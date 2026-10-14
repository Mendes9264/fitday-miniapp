const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = require('../shared/core.js');

test('修改记录更新原条目，复用餐食和训练各创建新条目', () => {
  const state = core.createState();
  const past = core.dateKey(new Date(Date.now() - 2 * 86400000));
  state.customFoods.push({ id: 'cf-oats', name: '燕麦杯', defaultGrams: 180,
    nutrition: { kcal: 200, protein: 8, carbs: 26, fat: 7 } });
  state.meals.push({ id: 'm-original', date: past, createdAt: 1000, type: '早餐', text: '燕麦杯',
    items: [{ kind: 'personal', customFoodId: 'cf-oats', name: '燕麦杯', grams: 180,
      nutrition: { kcal: 150, protein: 6, carbs: 21, fat: 5 } }], photo: 'data:image/jpeg;base64,AAA' });
  state.workouts.push({ id: 'w-original', date: past, createdAt: 2000, planId: state.plan[0].id,
    planName: '训练 A', focus: '上肢', exercises: [{ id: 'a-1', name: '卧推', sets: [{ reps: 8, weight: 50 }] }], cardio: [], cardioWeightKg: '' });

  const handlers = {};
  const values = new Map([['fitday-v1', JSON.stringify(state)]]);
  const main = { innerHTML: '' };
  const toast = { textContent: '', classList: { add() {}, remove() {} } };
  const document = {
    getElementById: id => id === 'app-main' ? main : toast,
    querySelectorAll: () => [],
    addEventListener: (name, fn) => { handlers[name] = fn; }
  };
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../web/app.js'), 'utf8'), {
    document, window: { FitCore: core, FitLocalBackup: require('../shared/local-backup.js'),
      FitDishCatalog: require('../web/dish-catalog.js'), FitExerciseEnergy: require('../shared/exercise-energy.js'),
      FitModelGateway: require('../web/model-gateway.js'), scrollTo() {}, confirm: () => true },
    localStorage: storage, sessionStorage: storage, setTimeout: () => 1, clearTimeout() {}, URL, Date, Blob
  });
  const click = dataset => handlers.click({ target: { closest: () => ({ dataset }) } });
  const input = (dataset, value) => handlers.input({ target: { dataset, value } });
  const saved = () => JSON.parse(values.get('fitday-v1'));

  click({ view: 'history' });
  assert.match(main.innerHTML, /每周总览/);
  click({ weekStep: '-1' });
  assert.match(main.innerHTML, new RegExp(core.getWeekOverview(state, core.dateKey(), -1).start));
  click({ weekStep: '1' });
  assert.match(main.innerHTML, /data-edit-record="meal:m-original"/);
  click({ editRecord: 'meal:m-original' });
  assert.match(main.innerHTML, /修改餐食记录/);
  input({ foodGrams: '0' }, '200');
  click({ action: 'save-meal' });
  assert.equal(saved().meals.length, 1);
  assert.equal(saved().meals[0].id, 'm-original');
  assert.equal(saved().meals[0].createdAt, 1000);
  assert.equal(saved().meals[0].items[0].grams, 200);
  assert.equal(saved().meals[0].items[0].nutrition.kcal, 150);

  click({ reuseMeal: 'm-original' });
  assert.match(main.innerHTML, /常吃餐食/);
  assert.doesNotMatch(main.innerHTML, /data:image\/jpeg;base64,AAA/);
  click({ action: 'save-meal' });
  assert.equal(saved().meals.length, 2);
  assert.equal(saved().meals[0].date, core.dateKey());
  assert.equal(saved().meals[0].photo, '');
  assert.equal(saved().meals[0].items[0].nutrition.kcal, 200);
  assert.equal(saved().meals[1].items[0].nutrition.kcal, 150);

  click({ view: 'history' });
  click({ editRecord: 'workout:w-original' });
  assert.match(main.innerHTML, /修改训练记录/);
  input({ set: '0:0:weight' }, '60');
  click({ addWorkoutSet: '0' });
  input({ set: '0:1:reps' }, '10');
  click({ action: 'save-workout' });
  assert.equal(saved().workouts.length, 1);
  assert.equal(saved().workouts[0].id, 'w-original');
  assert.equal(saved().workouts[0].createdAt, 2000);
  assert.equal(saved().workouts[0].exercises[0].sets[0].weight, 60);
  assert.equal(saved().workouts[0].exercises[0].sets[1].reps, 10);

  click({ view: 'workout' });
  assert.match(main.innerHTML, /常练训练/);
  assert.match(main.innerHTML, /data-reuse-workout="w-original"/);
  click({ view: 'history' });
  click({ reuseWorkout: 'w-original' });
  assert.match(main.innerHTML, /复用训练安排/);
  assert.match(main.innerHTML, /添加一组/);
  assert.match(main.innerHTML, /取消复用/);
  assert.equal(saved().workouts.length, 1);
  input({ set: '0:0:weight' }, '62.5');
  click({ action: 'save-workout' });
  assert.equal(saved().workouts.length, 2);
  assert.notEqual(saved().workouts[0].id, 'w-original');
  assert.equal(saved().workouts[0].date, core.dateKey());
  assert.equal(saved().workouts[0].planId, state.plan[0].id);
  assert.equal(saved().workouts[0].exercises[0].sets[0].weight, 62.5);
  assert.equal(saved().workouts[1].exercises[0].sets[0].weight, 60);

  click({ view: 'workout' });
  assert.match(main.innerHTML, /记过 2 次/);
  handlers.change({ target: { id: 'workout-date', value: past } });
  click({ reuseWorkout: saved().workouts[0].id });
  assert.match(main.innerHTML, new RegExp(`id="workout-date"[^>]+value="${past}"`));
  click({ action: 'cancel-workout-reuse' });
  assert.match(main.innerHTML, /常练训练/);
});
