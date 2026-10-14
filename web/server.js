const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { MAX_REQUEST_BYTES, forwardModelRequest } = require('./model-proxy');

const root = path.resolve(__dirname, '..');
const lan = process.argv.includes('--lan');
const port = Number(process.env.PORT) || (lan ? 5178 : 5177);
const addresses = Object.entries(os.networkInterfaces())
  .flatMap(([name, entries]) => entries.map(entry => ({ name, ...entry })))
  .filter(entry => entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.'))
  .sort((a, b) => Number(/wlan|wi-fi|ethernet/i.test(b.name)) - Number(/wlan|wi-fi|ethernet/i.test(a.name)));
const host = lan ? addresses[0]?.address : '127.0.0.1';
if (!host) throw new Error('没有找到可用的局域网 IPv4 地址');
const accessToken = lan ? crypto.randomBytes(8).toString('base64url') : '';
const publicFiles = new Map([
  ['/', 'web/index.html'],
  ['/web/index.html', 'web/index.html'],
  ['/web/styles.css', 'web/styles.css'],
  ['/web/logo.png', 'web/logo.png'],
  ['/web/app.js', 'web/app.js'],
  ['/web/dish-catalog.js', 'web/dish-catalog.js'],
  ['/web/model-gateway.js', 'web/model-gateway.js'],
  ['/download/fitday.apk', 'android/app/build/outputs/apk/debug/app-debug.apk'],
  ['/shared/core.js', 'shared/core.js'],
  ['/shared/local-backup.js', 'shared/local-backup.js'],
  ['/shared/exercise-energy.js', 'shared/exercise-energy.js']
]);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.apk': 'application/vnd.android.package-archive' };
async function handleModelProxy(request, response) {
  const reply = (status, message) => {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ error: { message } }));
  };
  if (lan) return reply(403, '模型调试代理仅在电脑本机的 npm start 模式可用');
  if (request.method !== 'POST') return reply(405, '请使用 POST 请求');
  if (request.headers.origin && request.headers.origin !== `http://${host}:${port}`) return reply(403, '请求来源无效');
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) return reply(415, '请求格式必须是 JSON');
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) return reply(413, '模型请求过大');
      chunks.push(chunk);
    }
    let input;
    try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch (_) { return reply(400, '模型请求不是有效 JSON'); }
    const result = await forwardModelRequest(input);
    response.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(result.body);
  } catch (error) {
    reply(error.name === 'TimeoutError' || error instanceof TypeError ? 502 : 400,
      error.name === 'TimeoutError' ? '桌面代理连接模型接口超时' : error instanceof TypeError ? '桌面代理无法连接模型接口，请检查网络和地址' : error.message || '桌面代理请求失败');
  }
}
http.createServer((request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);
  if (lan) {
    if (request.method === 'GET' && url.pathname === '/' && url.searchParams.get('access') === accessToken) {
      response.writeHead(302, { Location: '/', 'Set-Cookie': `fitday_access=${accessToken}; HttpOnly; SameSite=Lax; Path=/` });
      response.end(); return;
    }
    const cookie = (request.headers.cookie || '').split(';').map(part => part.trim());
    const apkLink = request.method === 'GET' && url.pathname === '/download/fitday.apk' && url.searchParams.get('access') === accessToken;
    if (!cookie.includes(`fitday_access=${accessToken}`) && !apkLink) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('请使用本次生成的手机访问链接'); return;
    }
  }
  if (url.pathname === '/api/model-proxy') { handleModelProxy(request, response); return; }
  const relative = publicFiles.get(url.pathname);
  if (!relative) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('未找到页面'); return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405); response.end(); return;
  }
  const filename = path.resolve(root, relative);
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('未找到页面');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', ...(url.pathname === '/download/fitday.apk' ? { 'Content-Disposition': 'attachment; filename="fitday-debug.apk"' } : {}) });
  if (request.method === 'HEAD') response.end();
  else fs.createReadStream(filename).pipe(response);
}).listen(port, host, () => {
  process.stdout.write(`练食原型已启动：http://${host}:${port}/${lan ? '?access=' + accessToken : ''}\n`);
});
