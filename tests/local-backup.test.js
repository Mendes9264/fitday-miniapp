const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../shared/core.js');
const backup = require('../shared/local-backup.js');

test('本地备份可迁移餐食、训练、身体数据、自定义食物和资料', () => {
  const state = core.createState();
  state.meals.push({ id: 'm-1', date: '2026-10-14', items: [{ foodId: 'rice', grams: 150 }] });
  state.workouts.push({ id: 'w-1', date: '2026-10-14', exercises: [] });
  state.bodyMeasurements.push({ date: '2026-10-14', weightKg: 74.5, waistCm: 83 });
  const food = core.saveCustomFood(state, { name: '自制燕麦杯', defaultGrams: 180, kcal: 150, protein: 6, carbs: 21, fat: 5 });
  state.meals[0].items.push(core.customFoodItem(food));
  state.profile.age = 30;
  const restored = backup.importState(backup.exportState(state));
  assert.deepEqual(restored, state);
});

test('本地备份拒绝无关 JSON', () => {
  assert.throws(() => backup.importState('{}'), /不是练食导出/);
  assert.throws(() => backup.importState('{'), /不是有效的 JSON/);
});
