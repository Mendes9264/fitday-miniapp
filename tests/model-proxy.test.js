const { test } = require('node:test');
const assert = require('node:assert/strict');
const proxy = require('../web/model-proxy.js');

test('桌面代理转发模型请求及服务商错误状态', async () => {
  let sent;
  const result = await proxy.forwardModelRequest({
    url: 'https://api.example.com/chat/completions',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
    body: '{"model":"test"}'
  }, async (url, options) => {
    sent = { url, options };
    return { status: 400, text: async () => '{"error":{"message":"Model not found"}}' };
  });
  assert.equal(sent.url, 'https://api.example.com/chat/completions');
  assert.equal(sent.options.headers.Authorization, 'Bearer test-key');
  assert.equal(sent.options.redirect, 'error');
  assert.equal(result.status, 400);
  assert.match(result.body, /Model not found/);
});

test('桌面代理拒绝把 Key 发往明文或无效地址', () => {
  assert.throws(() => proxy.prepareRequest({ url: 'http://localhost:11434/v1/chat/completions', headers: { Authorization: 'Bearer secret' }, body: '{}' }), /HTTPS/);
  assert.throws(() => proxy.prepareRequest({ url: 'http://remote.example/v1/chat/completions', headers: {}, body: '{}' }), /HTTPS/);
});
