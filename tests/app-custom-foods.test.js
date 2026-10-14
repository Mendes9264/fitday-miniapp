const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('记一餐可创建、复用、修改和删除本机自定义食物', () => {
  const handlers = {};
  const values = new Map();
  const main = { innerHTML: '' };
  const toast = { textContent: '', classList: { add() {}, remove() {} } };
  const document = {
    getElementById: id => id === 'app-main' ? main : toast,
    querySelectorAll: () => [],
    addEventListener: (name, fn) => { handlers[name] = fn; }
  };
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const context = {
    document, window: {
      FitCore: require('../shared/core.js'), FitLocalBackup: require('../shared/local-backup.js'),
      FitDishCatalog: require('../web/dish-catalog.js'), FitExerciseEnergy: require('../shared/exercise-energy.js'),
      FitModelGateway: require('../web/model-gateway.js'), scrollTo() {}, confirm: () => true
    },
    localStorage: storage, sessionStorage: storage,
    setTimeout: () => 1, clearTimeout() {}, URL, Date, Blob
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../web/app.js'), 'utf8'), context);
  const click = dataset => handlers.click({ target: { closest: () => ({ dataset }) } });
  const enter = (key, value) => handlers.input({ target: { dataset: { customFoodField: key }, value } });
  click({ view: 'meal' });
  click({ action: 'new-custom-food' });
  assert.match(main.innerHTML, /每 100 克录入/);
  Object.entries({ name: '自制燕麦杯', defaultGrams: '180', kcal: '150', protein: '6', carbs: '21', fat: '5' }).forEach(([key, value]) => enter(key, value));
  click({ action: 'save-custom-food' });
  const saved = JSON.parse(values.get('fitday-v1'));
  assert.equal(saved.customFoods.length, 1);
  assert.equal(saved.customFoods[0].nutrition.kcal, 150);
  assert.match(main.innerHTML, /270 千卡 · 自定义食物/);
  click({ action: 'save-meal' });
  const mealSnapshot = JSON.parse(values.get('fitday-v1')).meals[0].items[0];
  assert.equal(mealSnapshot.nutrition.kcal, 150);
  click({ view: 'meal' });
  click({ addCustomFood: saved.customFoods[0].id });
  assert.match(main.innerHTML, /270 千卡 · 自定义食物/);
  click({ editCustomFood: saved.customFoods[0].id });
  enter('kcal', '200');
  click({ action: 'save-custom-food' });
  const changed = JSON.parse(values.get('fitday-v1'));
  assert.equal(changed.customFoods[0].nutrition.kcal, 200);
  assert.equal(changed.meals[0].items[0].nutrition.kcal, 150);
  click({ deleteCustomFood: saved.customFoods[0].id });
  const afterDelete = JSON.parse(values.get('fitday-v1'));
  assert.equal(afterDelete.customFoods.length, 0);
  assert.equal(afterDelete.meals[0].items[0].nutrition.kcal, 150);
});
