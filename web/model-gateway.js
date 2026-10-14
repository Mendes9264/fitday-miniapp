(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FitModelGateway = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_CONFIG = {
    protocol: 'chat', endpoint: '', model: '', extraBody: '', webSearch: false,
    authMode: 'bearer', customHeaders: '', requestTemplate: '', responsePath: ''
  };
  const SYSTEM_PROMPT = '你是餐食营养估算助手。请根据菜名及常见做法，估算一份成品的重量和营养。只输出一个 JSON 对象，不要 Markdown。必须包含 name、baseGrams、kcal、kcalMin、kcalMax、protein、carbs、fat、ingredients、assumptions、explanation。ingredients 是含 name 和 grams 的数组；assumptions 是字符串数组。仅当接口实际提供网页检索且你确实看到了网页时，才在 sources 数组中列出真实的 title 和 https URL；否则 sources 为空数组。热量为千卡，其余为克。无法确认配方时说明假设，给较宽的热量范围，不要冒充实测数据。';
  const CUSTOM_TEMPLATE = '{"model":"{{model}}","messages":[{"role":"user","content":"{{prompt}}"}]}';

  function configOf(input) { return Object.assign({}, DEFAULT_CONFIG, input || {}); }

  function jsonObject(text, label) {
    if (!String(text || '').trim()) return {};
    let value;
    try { value = JSON.parse(text); } catch (_) { throw new Error(label + '不是有效 JSON'); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + '必须是 JSON 对象');
    return value;
  }

  function endpointUrl(raw, suffix, key) {
    let value = String(raw || '').trim();
    if (!value) throw new Error('请填写模型接口地址');
    if (value.includes('{{model}}')) value = value.replaceAll('{{model}}', encodeURIComponent(key.model));
    let url;
    try { url = new URL(value); } catch (_) { throw new Error('模型接口地址无效'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('请填写有效的 HTTP(S) 接口地址');
    if (url.protocol === 'http:' && String(key.apiKey || '').trim()) throw new Error('带 API Key 的接口必须使用 HTTPS');
    if (suffix && !url.pathname.replace(/\/$/, '').endsWith(suffix)) url.pathname = url.pathname.replace(/\/$/, '') + suffix;
    return url.href;
  }

  function substitute(value, vars) {
    if (typeof value === 'string') return value.replace(/\{\{(model|dish|prompt|apiKey)\}\}/g, (_, name) => vars[name]);
    if (Array.isArray(value)) return value.map(part => substitute(part, vars));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, part]) => [key, substitute(part, vars)]));
    return value;
  }

  function buildRequest(dishName, input) {
    const config = configOf(input);
    const name = String(dishName || '').trim().slice(0, 80);
    if (!name) throw new Error('请先输入菜名');
    if (!String(config.model || '').trim()) throw new Error('请在设置中填写模型名称');
    const vars = {
      model: String(config.model).trim(), dish: name, apiKey: String(config.apiKey || '').trim(),
      prompt: SYSTEM_PROMPT + '\n\n请估算这道菜：' + name
    };
    let body, url, headers = { 'Content-Type': 'application/json' }, searchRequested = false;
    if (config.protocol === 'chat') {
      url = endpointUrl(config.endpoint, '/chat/completions', config);
      body = {
        model: vars.model, stream: false,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: '请估算这道菜：' + name + '。只输出 JSON。' }]
      };
      const extra = jsonObject(config.extraBody, '附加请求参数');
      if (['model', 'messages', 'stream'].some(key => Object.hasOwn(extra, key))) throw new Error('附加请求参数不能覆盖 model、messages 或 stream');
      Object.assign(body, extra);
      searchRequested = extra.enable_search === true || Array.isArray(extra.tools) || !!extra.web_search_options;
      if (vars.apiKey) headers.Authorization = 'Bearer ' + vars.apiKey;
    } else if (config.protocol === 'responses') {
      url = endpointUrl(config.endpoint, '/responses', config);
      body = { model: vars.model, input: '请估算这道菜：' + name + '。只输出 JSON。', instructions: SYSTEM_PROMPT };
      if (config.webSearch) {
        body.tools = [{ type: 'web_search' }];
        body.tool_choice = 'required';
        body.include = ['web_search_call.action.sources'];
        searchRequested = true;
      }
      const extra = jsonObject(config.extraBody, '附加请求参数');
      if (['model', 'input', 'instructions', 'tools', 'tool_choice', 'include'].some(key => Object.hasOwn(extra, key))) throw new Error('附加请求参数不能覆盖模型输入或搜索工具设置');
      Object.assign(body, extra);
      if (vars.apiKey) headers.Authorization = 'Bearer ' + vars.apiKey;
    } else if (config.protocol === 'custom') {
      url = endpointUrl(config.endpoint, '', config);
      const template = String(config.requestTemplate || '').trim() || CUSTOM_TEMPLATE;
      if (!template.includes('{{prompt}}') && !template.includes('{{dish}}')) throw new Error('自定义请求体需包含 {{prompt}} 或 {{dish}}');
      body = substitute(jsonObject(template, '自定义请求体'), vars);
      const modes = { bearer: ['Authorization', 'Bearer '], xApiKey: ['x-api-key', ''], xGoogApiKey: ['x-goog-api-key', ''], none: null };
      if (!Object.hasOwn(modes, config.authMode)) throw new Error('鉴权方式无效');
      if (modes[config.authMode] && vars.apiKey) headers[modes[config.authMode][0]] = modes[config.authMode][1] + vars.apiKey;
      const customHeaders = substitute(jsonObject(config.customHeaders, '自定义请求头'), vars);
      for (const [key, value] of Object.entries(customHeaders)) {
        if (!/^[A-Za-z0-9-]+$/.test(key) || typeof value !== 'string' || /[\r\n]/.test(value)) throw new Error('自定义请求头格式无效');
        headers[key] = value;
      }
      if (!String(config.responsePath || '').trim()) throw new Error('请填写结果文本路径');
    } else throw new Error('接口协议无效');
    return { url, options: { method: 'POST', headers, body: JSON.stringify(body) }, searchRequested };
  }

  function parseJsonText(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    let text = String(value || '').trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try { return JSON.parse(text); } catch (_) {
      const start = text.indexOf('{'), end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {}
      }
      throw new Error('模型没有返回可解析的 JSON 营养数据');
    }
  }

  function getPath(value, path) {
    const keys = String(path || '').replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    if (!keys.length || keys.some(key => !/^[\w-]+$/.test(key))) throw new Error('结果文本路径无效');
    return keys.reduce((part, key) => part == null ? undefined : part[key], value);
  }

  function sourcesOf(list) {
    const sources = [];
    (Array.isArray(list) ? list : []).forEach(source => {
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:' || sources.some(item => item.url === url.href)) return;
        sources.push({ title: String(source.title || url.hostname).slice(0, 80), url: url.href });
      } catch (_) {}
    });
    return sources.slice(0, 3);
  }

  function validateEstimate(value, dishName) {
    if (!value || typeof value !== 'object') throw new Error('模型未返回可用的菜品估算');
    const grams = Number(value.baseGrams);
    const keys = ['kcal', 'kcalMin', 'kcalMax', 'protein', 'carbs', 'fat'];
    if (!Number.isFinite(grams) || grams < 10 || grams > 2000 ||
      keys.some(key => typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key] < 0 || value[key] > 10000) ||
      value.kcalMin > value.kcal || value.kcal > value.kcalMax ||
      !Array.isArray(value.ingredients) || !Array.isArray(value.assumptions)) throw new Error('模型返回的营养数值不合理，请重试或手动记录');
    return {
      kind: 'ai', name: String(value.name || dishName).slice(0, 80), grams, baseGrams: grams,
      aiEstimate: {
        kcal: value.kcal, kcalMin: value.kcalMin, kcalMax: value.kcalMax,
        protein: value.protein, carbs: value.carbs, fat: value.fat,
        ingredients: value.ingredients.slice(0, 12).map(part => ({ name: String(part.name || '').slice(0, 40), grams: Math.max(0, Number(part.grams) || 0) })),
        assumptions: value.assumptions.slice(0, 5).map(x => String(x).slice(0, 160)),
        explanation: String(value.explanation || '').slice(0, 400), sources: sourcesOf(value.sources), sourceMode: 'model'
      }
    };
  }

  function parseResponse(body, dishName, input) {
    const config = configOf(input);
    let raw, verifiedSources = [], searched = false;
    if (config.protocol === 'chat') raw = body && body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content;
    else if (config.protocol === 'responses') {
      if (body && body.status && body.status !== 'completed') throw new Error('模型请求未完成，请重试');
      const calls = (body && body.output || []).filter(part => part.type === 'web_search_call');
      searched = calls.length > 0;
      const message = (body && body.output || []).filter(part => part.type === 'message' && part.role === 'assistant').pop();
      const output = message && (message.content || []).find(part => part.type === 'output_text');
      raw = output && output.text || body && body.output_text;
      verifiedSources = sourcesOf([...(output && output.annotations || []).filter(part => part.type === 'url_citation'),
        ...calls.flatMap(call => call.action && call.action.sources || [])]);
      if (config.webSearch && !searched) throw new Error('接口未执行网页搜索；请检查模型是否支持 web_search');
      if (config.webSearch && !verifiedSources.length) throw new Error('接口搜索后未返回可核对的网页来源');
    } else if (config.protocol === 'custom') raw = getPath(body, config.responsePath);
    else throw new Error('接口协议无效');
    if (Array.isArray(raw)) raw = raw.map(part => typeof part === 'string' ? part : part.text || '').join('');
    const item = validateEstimate(parseJsonText(raw), dishName);
    if (verifiedSources.length) { item.aiEstimate.sources = verifiedSources; item.aiEstimate.sourceMode = 'web'; }
    else if (config.protocol === 'chat') {
      const extra = jsonObject(config.extraBody, '附加请求参数');
      if (extra.enable_search === true || Array.isArray(extra.tools) || extra.web_search_options) item.aiEstimate.sourceMode = 'provider-search';
    }
    item.aiEstimate.model = String(config.model || '').slice(0, 100);
    return item;
  }

  async function searchDish(dishName, config, fetcher) {
    const request = buildRequest(dishName, config);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await (fetcher || fetch)(request.url, Object.assign({}, request.options, { signal: controller.signal }));
      if (!response.ok) {
        let detail = '';
        try {
          const raw = (await response.text()).slice(0, 3000);
          let parsed;
          try { parsed = JSON.parse(raw); } catch (_) {}
          detail = parsed && (parsed.error && parsed.error.message || parsed.message || parsed.detail) || (!/<[a-z][\s\S]*>/i.test(raw) ? raw : '');
          detail = String(detail || '').replaceAll(String(config.apiKey || '') || '\u0000', '[已隐藏]').slice(0, 400);
        } catch (_) {}
        const prefix = response.status === 401 || response.status === 403 ? '接口鉴权失败' :
          response.status === 429 ? '接口额度或速率已达到限制' : '模型接口请求失败';
        throw new Error(prefix + '（HTTP ' + response.status + '）' + (detail ? '：' + detail : '，请检查地址、模型和协议'));
      }
      const result = await response.json();
      return parseResponse(result, dishName, config);
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('模型请求超时，请检查网络后重试');
      if (error instanceof TypeError) throw new Error('无法连接模型接口；请检查地址、网络及接口是否允许 App 跨域访问');
      throw error;
    } finally { clearTimeout(timer); }
  }

  return { DEFAULT_CONFIG, CUSTOM_TEMPLATE, SYSTEM_PROMPT, configOf, buildRequest, parseResponse, validateEstimate, searchDish };
});
