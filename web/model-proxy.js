const MAX_REQUEST_BYTES = 128 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

function prepareRequest(input) {
  if (!input || typeof input !== 'object') throw new Error('模型请求格式无效');
  let target;
  try { target = new URL(input.url); } catch (_) { throw new Error('模型接口地址无效'); }
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname);
  if (target.username || target.password || (target.protocol !== 'https:' && !(target.protocol === 'http:' && local))) {
    throw new Error('桌面调试仅允许 HTTPS 接口或本机 HTTP 接口');
  }
  if (!input.headers || typeof input.headers !== 'object' || Array.isArray(input.headers)) throw new Error('请求头格式无效');
  const headers = {};
  for (const [name, value] of Object.entries(input.headers)) {
    if (!/^[A-Za-z0-9-]+$/.test(name) || /^(host|cookie|connection|content-length|transfer-encoding)$/i.test(name) ||
      typeof value !== 'string' || /[\r\n]/.test(value)) throw new Error('请求头格式无效');
    headers[name] = value;
  }
  if (target.protocol === 'http:' && Object.keys(headers).some(name => /^(authorization|x-api-key|x-goog-api-key)$/i.test(name))) {
    throw new Error('带 API Key 的接口必须使用 HTTPS');
  }
  if (typeof input.body !== 'string' || Buffer.byteLength(input.body) > MAX_REQUEST_BYTES) throw new Error('模型请求体过大或格式无效');
  return { url: target.href, options: { method: 'POST', headers, body: input.body, redirect: 'error', signal: AbortSignal.timeout(65000) } };
}

async function forwardModelRequest(input, fetcher = fetch) {
  const request = prepareRequest(input);
  const upstream = await fetcher(request.url, request.options);
  const body = await upstream.text();
  if (Buffer.byteLength(body) > MAX_RESPONSE_BYTES) throw new Error('模型响应过大');
  return { status: upstream.status, body };
}

module.exports = { MAX_REQUEST_BYTES, prepareRequest, forwardModelRequest };
