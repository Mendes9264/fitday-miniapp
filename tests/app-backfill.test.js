const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = require('../shared/core.js');

test('网页可把训练和饮食补记到过去日期，并在记录页按日期显示', () => {
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
      FitCore: core, FitLocalBackup: require('../shared/local-backup.js'),
      FitDishCatalog: require('../web/dish-catalog.js'), FitExerciseEnergy: require('../shared/exercise-energy.js'),
      FitModelGateway: require('../web/model-gateway.js'), scrollTo() {}, confirm: () => true
    },
    localStorage: storage, sessionStorage: storage,
    setTimeout: () => 1, clearTimeout() {}, URL, Date, Blob
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../web/app.js'), 'utf8'), context);
  const click = dataset => handlers.click({ target: { closest: () => ({ dataset }) } });
  const changeDate = (id, value) => handlers.change({ target: { id, value, dataset: {} } });
  const past = core.dateKey(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));

  click({ view: 'workout' });
  assert.match(main.innerHTML, /训练日期/);
  changeDate('workout-date', past);
  click({ action: 'save-workout' });
  assert.equal(JSON.parse(values.get('fitday-v1')).workouts[0].date, past);
  assert.match(main.innerHTML, /我的记录/);

  click({ view: 'meal' });
  assert.match(main.innerHTML, /用餐日期/);
  changeDate('meal-date', past);
  handlers.input({ target: { id: 'meal-text', dataset: {}, value: '一碗米饭' } });
  click({ action: 'parse-meal' });
  click({ action: 'save-meal' });
  const saved = JSON.parse(values.get('fitday-v1'));
  assert.equal(saved.meals[0].date, past);
  assert.equal(core.getDaySummary(saved, past).meals.length, 1);
  assert.equal(core.getDaySummary(saved, past).workouts.length, 1);
  assert.equal(core.getDaySummary(saved, core.dateKey()).meals.length, 0);
  assert.match(main.innerHTML, /我的记录/);
});
