const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../shared/core.js');

test('微信页面逻辑可保存餐食、训练并清除旧接口设置', () => {
  const storage = { 'fitday-direct-api-v1': { apiKey: 'old-key' } };
  global.wx = {
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = JSON.parse(JSON.stringify(value)); },
    removeStorageSync: key => { delete storage[key]; },
    showToast: () => {},
    pageScrollTo: () => {}
  };
  global.Page = definition => { global.pageDefinition = definition; };
  require('../miniprogram/pages/index/index.js');
  const page = global.pageDefinition;
  page.setData = update => { page.data = Object.assign({}, page.data, update); };
  page.onLoad();
  assert.equal(storage['fitday-direct-api-v1'], undefined);
  page.mealText({ detail: { value: '一碗米饭、150克鸡胸肉' } });
  page.parseMeal();
  assert.equal(page.data.mealItems.length, 2);
  page.saveMeal();
  assert.equal(storage['fitday-v1'].meals.length, 1);
  page.mealText({ detail: { value: '西红柿炒鸡蛋、毛豆烧鸡' } });
  page.parseMeal();
  assert.deepEqual(page.data.mealItems.map(x => x.name), ['西红柿炒鸡蛋', '毛豆烧鸡']);
  assert.equal(page.data.mealEstimate.estimatedCount, 2);
  page.saveMeal();
  assert.equal(storage['fitday-v1'].meals.length, 2);
  page.foodSelect({ detail: { value: '0' } });
  page.addFood();
  assert.equal(page.data.mealItems[0].name, '西红柿炒鸡蛋');
  page.saveWorkout();
  assert.equal(storage['fitday-v1'].workouts.length, 1);
  assert.equal(page.data.today.meals.length, 2);
  assert.equal(page.data.today.workouts.length, 1);
  page.mealText({ detail: { value: '完全未知的菜名' } });
  page.parseMeal();
  assert.equal(page.data.mealItems[0].kind, 'unknown');
  assert.equal(page.data.mealEstimate.estimatedCount, 0);
  const past = core.dateKey(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
  page.mealDateChange({ detail: { value: past } });
  page.saveMeal();
  assert.equal(storage['fitday-v1'].meals[0].date, past);
  assert.equal(page.data.tab, 'history');
  page.workoutDateChange({ detail: { value: past } });
  page.saveWorkout();
  assert.equal(storage['fitday-v1'].workouts[0].date, past);
  assert.equal(page.data.today.workouts.length, 1);
  assert.equal(page.data.tab, 'history');
  delete global.wx;
  delete global.Page;
  delete global.pageDefinition;
});
