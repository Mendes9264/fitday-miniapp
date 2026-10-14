const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('设置页可切换接口格式，并按用户选择记住或清除 Key', async () => {
  const handlers = {};
  const values = new Map();
  const session = new Map();
  const main = { innerHTML: '' };
  const toast = { textContent: '', classList: { add() {}, remove() {} } };
  const document = {
    getElementById: id => id === 'app-main' ? main : toast,
    querySelectorAll: () => [],
    addEventListener: (name, fn) => { handlers[name] = fn; }
  };
  const storage = map => ({ getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
  const context = {
    document, window: {
      FitCore: require('../shared/core.js'), FitLocalBackup: require('../shared/local-backup.js'),
      FitDishCatalog: require('../web/dish-catalog.js'), FitExerciseEnergy: require('../shared/exercise-energy.js'),
      FitModelGateway: require('../web/model-gateway.js'), scrollTo() {}
    },
    localStorage: storage(values), sessionStorage: storage(session),
    setTimeout: () => 1, clearTimeout() {}, URL, Date, Blob
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../web/app.js'), 'utf8'), context);
  handlers.click({ target: { closest: () => ({ dataset: { view: 'profile' } }) } });
  assert.match(main.innerHTML, /大模型接口/);
  handlers.input({ target: { id: '', dataset: { aiConfig: 'endpoint' }, type: 'text', tagName: 'INPUT', value: 'https:\/\/api.example.com\/v1' } });
  handlers.input({ target: { id: '', dataset: { aiConfig: 'model' }, type: 'text', tagName: 'INPUT', value: 'my-model' } });
  handlers.input({ target: { id: 'ai-api-key', dataset: {}, value: 'secret' } });
  handlers.change({ target: { dataset: { aiConfig: 'protocol' }, type: 'select-one', tagName: 'SELECT', value: 'custom' } });
  assert.match(main.innerHTML, /自定义请求头/);
  assert.match(main.innerHTML, /my-model/);
  assert.equal(JSON.parse(values.get('fitday-model-config-v2')).endpoint, 'https://api.example.com/v1');
  assert.equal(JSON.parse(values.get('fitday-model-config-v2')).apiKey, undefined);
  assert.equal(session.get('fitday-model-key'), 'secret');
  const clickAction = action => handlers.click({ target: { closest: () => ({ dataset: { action } }) } });
  clickAction('save-ai-config');
  assert.equal(values.has('fitday-model-key'), false);
  handlers.change({ target: { id: 'ai-remember-key', checked: true, dataset: {} } });
  clickAction('save-ai-config');
  assert.equal(values.get('fitday-model-key'), 'secret');
  clickAction('clear-ai-key');
  assert.equal(values.has('fitday-model-key'), false);
  assert.equal(session.has('fitday-model-key'), false);

  handlers.change({ target: { dataset: { aiConfig: 'protocol' }, type: 'select-one', tagName: 'SELECT', value: 'chat' } });
  handlers.input({ target: { id: 'ai-api-key', dataset: {}, value: 'new-key' } });
  context.window.location = { protocol: 'http:', hostname: '127.0.0.1' };
  const requests = [];
  context.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: false, status: 400, text: async () => '{"error":{"message":"Model not found"}}' };
  };
  handlers.click({ target: { closest: () => ({ dataset: { view: 'meal' } }) } });
  handlers.input({ target: { id: 'catalog-search', dataset: {}, value: '凉拌海蜇' } });
  clickAction('ai-search');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests[0].url, '/api/model-proxy');
  assert.match(requests[0].options.body, /my-model/);
  assert.match(main.innerHTML, /Model not found/);
});
