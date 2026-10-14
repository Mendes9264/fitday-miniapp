const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../shared/core.js');

test('文字识别份量并计算餐食范围', () => {
  const items = core.parseMealText('一碗米饭、150克鸡胸肉、西兰花');
  assert.equal(items.length, 3);
  assert.equal(items.find(x => x.foodId === 'rice').grams, 150);
  assert.equal(items.find(x => x.foodId === 'chicken_breast').grams, 150);
  const estimate = core.calculateMeal(items);
  assert.ok(estimate.totals.kcal > 0);
  assert.ok(estimate.range.min < estimate.totals.kcal);
  assert.ok(estimate.range.max > estimate.totals.kcal);
});

test('旧版模型估算餐食仍可按保存时的数值显示', () => {
  const item = { kind: 'ai', name: '旧记录', grams: 200, baseGrams: 200,
    aiEstimate: { kcal: 300, kcalMin: 240, kcalMax: 360, protein: 20, carbs: 25, fat: 12,
      ingredients: [{ name: '食材', grams: 150 }], assumptions: ['旧版估算'] } };
  const result = core.calculateMeal([item]);
  assert.equal(result.estimatedCount, 1);
  assert.deepEqual(result.range, { min: 240, max: 360 });
  assert.equal(result.totals.kcal, 300);
});

test('每天汇总餐食与训练，并推进四天模板', () => {
  const state = core.createState();
  const day = core.dateKey();
  state.meals.push({ date: day, items: [{ foodId: 'egg', grams: 100 }] });
  state.workouts.push({ date: day, planId: state.plan[0].id, createdAt: Date.now(), exercises: [] });
  const summary = core.getDaySummary(state, day);
  assert.equal(summary.meals.length, 1);
  assert.equal(summary.workouts.length, 1);
  assert.equal(summary.totals.kcal, 143);
  assert.equal(core.nextPlanIndex(state), 1);
});

test('参考范围需要完整资料，手动参考值优先', () => {
  const profile = core.createState().profile;
  assert.equal(core.getReference(profile), null);
  Object.assign(profile, { age: 30, heightCm: 175, weightKg: 75, formulaSex: 'male' });
  assert.ok(core.getReference(profile).min > 0);
  profile.dailyReference = 2000;
  assert.deepEqual(core.getReference(profile), { min: 1850, max: 2150, source: 'manual' });
});

test('家常菜作为一整道菜识别并显示食材假设', () => {
  const items = core.parseMealText('一盘西红柿炒鸡蛋、毛豆烧鸡、一碗米饭');
  assert.equal(items.length, 3);
  assert.deepEqual(items.map(x => x.name), ['西红柿炒鸡蛋', '毛豆烧鸡', '米饭']);
  const estimate = core.calculateMeal(items);
  assert.equal(estimate.estimatedCount, 3);
  assert.ok(estimate.lines[0].ingredients.some(x => x.name === '烹调油'));
  assert.ok(estimate.lines[1].ingredients.some(x => x.name === '毛豆'));
  assert.ok(estimate.range.min < estimate.totals.kcal);
});

test('未预设炒菜可按食材推断，未知菜名保留但不伪造热量', () => {
  const inferred = core.parseMealText('香菇炒鸡');
  assert.equal(inferred[0].source, 'inferred');
  assert.ok(core.calculateMeal(inferred).totals.kcal > 0);
  const unknown = core.parseMealText('酸菜鱼');
  const estimate = core.calculateMeal(unknown);
  assert.equal(unknown[0].name, '酸菜鱼');
  assert.equal(unknown[0].grams, '');
  assert.equal(estimate.estimatedCount, 0);
  assert.equal(estimate.unknownCount, 1);
  assert.equal(core.getMealAdvice(estimate, { meals: [], workouts: [] }, {}).headline, '已记下菜名，暂无法估算');
});

test('每日身体数据可按日期更新，趋势忽略未填写的指标', () => {
  const state = core.createState();
  core.saveBodyMeasurement(state, '2026-10-12', { weightKg: '75.2', waistCm: '84' });
  core.saveBodyMeasurement(state, '2026-10-13', { armCm: '31.5' });
  core.saveBodyMeasurement(state, '2026-10-12', { weightKg: '74.8' });
  assert.deepEqual(state.bodyMeasurements, [
    { date: '2026-10-12', weightKg: 74.8 },
    { date: '2026-10-13', armCm: 31.5 }
  ]);
  assert.deepEqual(core.bodyMetricSeries(state, 'weightKg'), [{ date: '2026-10-12', value: 74.8 }]);
  assert.deepEqual(core.bodyMetricSeries(state, 'waistCm'), []);
  assert.deepEqual(core.normalizeState({ profile: {} }).bodyMeasurements, []);
});

test('身体数据拒绝空记录、异常数值和未来日期', () => {
  const state = core.createState();
  assert.throws(() => core.saveBodyMeasurement(state, '2026-10-12', {}), /至少填写/);
  assert.throws(() => core.saveBodyMeasurement(state, '2026-10-12', { weightKg: 0 }), /体重应填写/);
  assert.throws(() => core.saveBodyMeasurement(state, '2026-02-30', { weightKg: 75 }), /有效的记录日期/);
  assert.throws(() => core.saveBodyMeasurement(state, '2999-01-01', { weightKg: 75 }), /未来日期/);
  assert.deepEqual(state.bodyMeasurements, []);
});

test('补记日期有效，训练顺序按训练日而非补记时间计算', () => {
  const state = core.createState();
  const today = core.dateKey();
  const yesterday = core.dateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  assert.equal(core.validRecordDate(yesterday), true);
  assert.equal(core.validRecordDate('2999-01-01'), false);
  assert.equal(core.validRecordDate('2026-02-30'), false);
  state.workouts.push({ date: today, createdAt: 100, planId: state.plan[1].id, exercises: [] });
  state.workouts.push({ date: yesterday, createdAt: 200, planId: state.plan[0].id, exercises: [] });
  assert.equal(core.nextPlanIndex(state), 2);
  state.workouts.push({ date: yesterday, createdAt: 300, planId: state.plan[1].id, exercises: [] });
  assert.equal(core.lastWorkoutForPlan(state, state.plan[1].id).date, today);
});

test('每周总览只汇总实际记录，按周一至周日展示并计算体重首末变化', () => {
  const state = core.createState();
  state.meals.push({ date: '2026-10-12', items: [{ foodId: 'egg', grams: 100 }] });
  state.meals.push({ date: '2026-10-14', items: [{ foodId: 'rice', grams: 150 }] });
  state.workouts.push({ date: '2026-10-14', exercises: [{ name: '卧推', sets: [{ reps: 8 }] }], cardio: [] });
  state.workouts.push({ date: '2026-10-14', exercises: [], cardio: [{ activeKcal: 100 }] });
  state.bodyMeasurements = [{ date: '2026-10-12', weightKg: 75 }, { date: '2026-10-14', weightKg: 74.6 }];
  const week = core.getWeekOverview(state, '2026-10-14', 0);
  assert.equal(week.start, '2026-10-12');
  assert.equal(week.end, '2026-10-18');
  assert.equal(week.mealDays, 2);
  assert.equal(week.mealCount, 2);
  assert.equal(week.strengthCount, 1);
  assert.equal(week.cardioCount, 1);
  assert.equal(week.days[1].meals.length, 0);
  assert.equal(week.recordedWeights[0].value, 75);
  assert.equal(week.recordedWeights[1].value, 74.6);
  assert.equal(core.getWeekOverview(state, '2026-10-14', -1).start, '2026-10-05');
});

test('自定义食物按每百克换算，修改食物库不改变已加入的餐食', () => {
  const state = core.createState();
  const food = core.saveCustomFood(state, { name: '虾仁饼', defaultGrams: '60', kcal: '200', protein: '12', carbs: '18', fat: '8' });
  const oldMealItem = core.customFoodItem(food);
  const estimate = core.calculateMeal([oldMealItem]);
  assert.equal(estimate.totals.kcal, 120);
  assert.equal(estimate.totals.protein, 7.2);
  assert.deepEqual(estimate.range, { min: 120, max: 120 });
  core.saveCustomFood(state, { name: '虾仁饼', defaultGrams: '80', kcal: '240', protein: '13', carbs: '20', fat: '10' }, food.id);
  assert.equal(core.calculateMeal([oldMealItem]).totals.kcal, 120);
  assert.equal(core.calculateMeal([core.customFoodItem(state.customFoods[0])]).totals.kcal, 192);
  assert.equal(core.normalizeState({}).customFoods.length, 0);
});

test('自定义食物拒绝空营养、超范围和重复名称', () => {
  const state = core.createState();
  const draft = { name: '牛奶', defaultGrams: '250', kcal: '60', protein: '3', carbs: '5', fat: '3' };
  assert.throws(() => core.saveCustomFood(state, { ...draft, fat: '' }), /脂肪应填写/);
  assert.throws(() => core.saveCustomFood(state, { ...draft, kcal: '1000' }), /热量应填写/);
  core.saveCustomFood(state, draft);
  assert.throws(() => core.saveCustomFood(state, { ...draft, name: ' 牛奶 ' }), /已有同名食物/);
  assert.equal(core.normalizeCustomFoods([{ id: 'cf-valid', ...state.customFoods[0], nutrition: { ...state.customFoods[0].nutrition, fat: -1 } }]).length, 0);
});
