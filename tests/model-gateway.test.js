const { test } = require('node:test');
const assert = require('node:assert/strict');
const gateway = require('../web/model-gateway.js');
const core = require('../shared/core.js');

const dish = {
  name: '酸菜鱼', baseGrams: 300, kcal: 360, kcalMin: 270, kcalMax: 500,
  protein: 29, carbs: 12, fat: 22,
  ingredients: [{ name: '鱼肉', grams: 130 }], assumptions: ['用油约 15 克'], explanation: '按常见做法估算'
};

test('兼容接口可自定义地址、模型及搜索参数', () => {
  const config = { protocol: 'chat', endpoint: 'https://api.example.com/v1', model: 'my-model', apiKey: 'secret', extraBody: '{"enable_search":true}' };
  const request = gateway.buildRequest('酸菜鱼', config);
  assert.equal(request.url, 'https://api.example.com/v1/chat/completions');
  assert.equal(request.options.headers.Authorization, 'Bearer secret');
  assert.equal(JSON.parse(request.options.body).enable_search, true);
  const item = gateway.parseResponse({ choices: [{ message: { content: JSON.stringify(dish) } }] }, '酸菜鱼', config);
  assert.equal(item.aiEstimate.sourceMode, 'provider-search');
  item.grams = 150;
  const meal = core.calculateMeal([item]);
  assert.equal(meal.lines[0].source, 'ai');
  assert.equal(meal.range.min, 135);
  assert.equal(meal.range.max, 250);
});

test('Responses 搜索需要真实工具调用与网页来源', () => {
  const config = { protocol: 'responses', endpoint: 'https://api.example.com/v1', model: 'search-model', webSearch: true };
  const request = gateway.buildRequest('酸菜鱼', config);
  assert.equal(JSON.parse(request.options.body).tools[0].type, 'web_search');
  const message = { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify(dish) }] };
  assert.throws(() => gateway.parseResponse({ status: 'completed', output: [message] }, '酸菜鱼', config), /未执行网页搜索/);
  assert.throws(() => gateway.parseResponse({ status: 'completed', output: [{ type: 'web_search_call' }, message] }, '酸菜鱼', config), /网页来源/);
  const item = gateway.parseResponse({ status: 'completed', output: [
    { type: 'web_search_call', action: { sources: [{ title: '资料', url: 'https://example.org/food' }] } }, message
  ] }, '酸菜鱼', config);
  assert.equal(item.aiEstimate.sourceMode, 'web');
  assert.equal(item.aiEstimate.sources[0].url, 'https://example.org/food');
});

test('自定义 JSON 模板支持不同鉴权头和响应路径', () => {
  const anthropic = gateway.buildRequest('酸菜鱼', {
    protocol: 'custom', endpoint: 'https://api.anthropic.com/v1/messages', model: 'some-model', apiKey: 'secret',
    authMode: 'xApiKey', customHeaders: '{"anthropic-version":"2023-06-01"}',
    requestTemplate: '{"model":"{{model}}","max_tokens":1000,"messages":[{"role":"user","content":"{{prompt}}"}]}', responsePath: 'content.0.text'
  });
  assert.equal(anthropic.options.headers['x-api-key'], 'secret');
  assert.equal(anthropic.options.headers['anthropic-version'], '2023-06-01');
  const geminiConfig = {
    protocol: 'custom', endpoint: 'https://example.com/v1beta/models/{{model}}:generateContent', model: 'gemini-model', apiKey: 'secret',
    authMode: 'xGoogApiKey', requestTemplate: '{"contents":[{"parts":[{"text":"{{prompt}}"}]}]}', responsePath: 'candidates.0.content.parts.0.text'
  };
  const gemini = gateway.buildRequest('酸菜鱼', geminiConfig);
  assert.match(gemini.url, /gemini-model:generateContent$/);
  assert.equal(gemini.options.headers['x-goog-api-key'], 'secret');
  const item = gateway.parseResponse({ candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(dish) + '\n```' }] } }] }, '酸菜鱼', geminiConfig);
  assert.equal(item.aiEstimate.sourceMode, 'model');
});

test('阻止明文 Key 和不合理营养数值', () => {
  assert.throws(() => gateway.buildRequest('酸菜鱼', { protocol: 'chat', endpoint: 'http://example.com/v1', model: 'x', apiKey: 'secret' }), /HTTPS/);
  assert.throws(() => gateway.validateEstimate({ ...dish, kcalMin: 600 }, '酸菜鱼'), /不合理/);
});

test('HTTP 400 显示服务商的具体错误，但隐藏 Key', async () => {
  const config = { protocol: 'chat', endpoint: 'https://api.example.com', model: 'wrong-model', apiKey: 'secret-key' };
  const fetcher = async () => ({ ok: false, status: 400, text: async () => JSON.stringify({ error: { message: 'Model wrong-model invalid; key secret-key' } }) });
  await assert.rejects(gateway.searchDish('凉拌海蜇', config, fetcher), error => {
    assert.match(error.message, /Model wrong-model invalid/);
    assert.doesNotMatch(error.message, /secret-key/);
    return true;
  });
});
