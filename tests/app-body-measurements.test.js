const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = require('../shared/core.js');

test('记录页保存每日身体数据并生成可切换指标的趋势图', () => {
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
  const enter = (key, value) => handlers.input({ target: { dataset: { bodyField: key }, value } });
  click({ view: 'history' });
  assert.match(main.innerHTML, /身体数据/);
  enter('weightKg', '75.2');
  enter('waistCm', '84');
  click({ action: 'save-body' });
  const today = core.dateKey();
  assert.equal(JSON.parse(values.get('fitday-v1')).bodyMeasurements[0].date, today);
  assert.match(main.innerHTML, /更新这天数据/);
  click({ action: 'toggle-body-chart' });
  assert.match(main.innerHTML, /体重趋势/);
  assert.match(main.innerHTML, /75.2/);
  assert.match(main.innerHTML, /<svg/);
  click({ bodyMetric: 'waistCm' });
  assert.match(main.innerHTML, /腰围趋势/);
  assert.match(main.innerHTML, /84 cm/);
  enter('weightKg', '74.8');
  enter('waistCm', '');
  click({ action: 'save-body' });
  assert.deepEqual(JSON.parse(values.get('fitday-v1')).bodyMeasurements[0], { date: today, weightKg: 74.8 });
  assert.match(main.innerHTML, /还没有腰围数据/);
  click({ action: 'delete-body' });
  assert.equal(JSON.parse(values.get('fitday-v1')).bodyMeasurements.length, 0);
});
