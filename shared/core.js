(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FitCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORE_VERSION = 1;
  const BODY_METRICS = [
    { key: 'weightKg', label: '体重', unit: 'kg', min: 20, max: 400 },
    { key: 'waistCm', label: '腰围', unit: 'cm', min: 30, max: 250 },
    { key: 'armCm', label: '臂围', unit: 'cm', min: 10, max: 100 },
    { key: 'chestCm', label: '胸围', unit: 'cm', min: 30, max: 250 },
    { key: 'hipCm', label: '臀围', unit: 'cm', min: 30, max: 250 },
    { key: 'thighCm', label: '腿围', unit: 'cm', min: 15, max: 150 }
  ];
  const CUSTOM_FOOD_NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat'];
  const FOOD_LIST = [
    { id: 'rice', name: '米饭', aliases: ['白米饭', '米饭'], kcal: 116, protein: 2.6, carbs: 25.9, fat: 0.3, defaultGrams: 150, category: 'starch' },
    { id: 'chicken_breast', name: '鸡胸肉', aliases: ['鸡胸肉', '鸡胸'], kcal: 165, protein: 31, carbs: 0, fat: 3.6, defaultGrams: 120, category: 'protein' },
    { id: 'egg', name: '鸡蛋', aliases: ['鸡蛋', '水煮蛋', '煎蛋'], kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, defaultGrams: 50, category: 'protein', pieceGrams: 50 },
    { id: 'broccoli', name: '西兰花', aliases: ['西兰花'], kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, defaultGrams: 150, category: 'vegetable' },
    { id: 'milk', name: '牛奶', aliases: ['纯牛奶', '牛奶'], kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, defaultGrams: 250, category: 'drink' },
    { id: 'banana', name: '香蕉', aliases: ['香蕉'], kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, defaultGrams: 100, category: 'fruit', pieceGrams: 100 },
    { id: 'apple', name: '苹果', aliases: ['苹果'], kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, defaultGrams: 150, category: 'fruit', pieceGrams: 150 },
    { id: 'oats', name: '燕麦', aliases: ['燕麦片', '燕麦'], kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, defaultGrams: 40, category: 'starch' },
    { id: 'salmon', name: '三文鱼', aliases: ['三文鱼'], kcal: 208, protein: 20, carbs: 0, fat: 13, defaultGrams: 120, category: 'protein' },
    { id: 'beef', name: '牛肉', aliases: ['瘦牛肉', '牛肉'], kcal: 217, protein: 26, carbs: 0, fat: 12, defaultGrams: 120, category: 'protein' },
    { id: 'tofu', name: '豆腐', aliases: ['豆腐'], kcal: 76, protein: 8, carbs: 1.9, fat: 4.8, defaultGrams: 150, category: 'protein' },
    { id: 'noodles', name: '面条', aliases: ['面条', '面'], kcal: 138, protein: 4.5, carbs: 25, fat: 2.1, defaultGrams: 200, category: 'starch' },
    { id: 'steamed_bun', name: '馒头', aliases: ['馒头'], kcal: 223, protein: 7, carbs: 47, fat: 1.1, defaultGrams: 100, category: 'starch', pieceGrams: 100 },
    { id: 'bread', name: '面包', aliases: ['全麦面包', '面包'], kcal: 265, protein: 9, carbs: 49, fat: 3.2, defaultGrams: 70, category: 'starch' },
    { id: 'yogurt', name: '酸奶', aliases: ['无糖酸奶', '酸奶'], kcal: 95, protein: 3.5, carbs: 10, fat: 4, defaultGrams: 200, category: 'drink' },
    { id: 'chicken_leg', name: '鸡腿', aliases: ['鸡腿肉', '鸡腿'], kcal: 209, protein: 26, carbs: 0, fat: 11, defaultGrams: 150, category: 'protein' },
    { id: 'tomato', name: '番茄', aliases: ['西红柿', '番茄'], kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, defaultGrams: 150, category: 'vegetable' },
    { id: 'cucumber', name: '黄瓜', aliases: ['黄瓜'], kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, defaultGrams: 150, category: 'vegetable' },
    { id: 'potato', name: '土豆', aliases: ['土豆', '马铃薯'], kcal: 77, protein: 2, carbs: 17, fat: 0.1, defaultGrams: 180, category: 'starch' },
    { id: 'nuts', name: '坚果', aliases: ['混合坚果', '坚果'], kcal: 607, protein: 20, carbs: 21, fat: 54, defaultGrams: 30, category: 'snack' },
    { id: 'dumpling', name: '饺子', aliases: ['饺子'], kcal: 215, protein: 9, carbs: 25, fat: 9, defaultGrams: 200, category: 'mixed' },
    { id: 'cola', name: '可乐', aliases: ['可乐'], kcal: 42, protein: 0, carbs: 10.6, fat: 0, defaultGrams: 330, category: 'drink' },
    { id: 'milk_tea', name: '奶茶', aliases: ['奶茶'], kcal: 90, protein: 1, carbs: 16, fat: 2.5, defaultGrams: 350, category: 'drink' },
    { id: 'edamame', name: '毛豆', aliases: ['毛豆'], kcal: 121, protein: 11.9, carbs: 8.9, fat: 5.2, defaultGrams: 150, category: 'protein' },
    { id: 'chicken_meat', name: '鸡肉', aliases: ['鸡肉', '鸡丁', '鸡块', '鸡'], kcal: 195, protein: 27, carbs: 0, fat: 9, defaultGrams: 120, category: 'protein' },
    { id: 'pepper', name: '青椒', aliases: ['青椒', '彩椒', '尖椒'], kcal: 22, protein: 1, carbs: 5, fat: 0.2, defaultGrams: 120, category: 'vegetable' },
    { id: 'pork', name: '瘦猪肉', aliases: ['瘦猪肉', '猪肉', '肉丝'], kcal: 170, protein: 25, carbs: 0, fat: 7, defaultGrams: 120, category: 'protein' },
    { id: 'pork_belly', name: '五花肉', aliases: ['五花肉'], kcal: 518, protein: 9, carbs: 0, fat: 53, defaultGrams: 100, category: 'protein' },
    { id: 'pork_ribs', name: '排骨', aliases: ['排骨'], kcal: 277, protein: 18, carbs: 0, fat: 22, defaultGrams: 120, category: 'protein' },
    { id: 'mushroom', name: '香菇', aliases: ['香菇', '蘑菇'], kcal: 34, protein: 2.2, carbs: 6.8, fat: 0.5, defaultGrams: 120, category: 'vegetable' },
    { id: 'greens', name: '青菜', aliases: ['小青菜', '青菜', '油菜', '菠菜'], kcal: 20, protein: 2, carbs: 3, fat: 0.2, defaultGrams: 180, category: 'vegetable' },
    { id: 'fish', name: '鱼肉', aliases: ['鱼肉', '鱼片'], kcal: 120, protein: 20, carbs: 0, fat: 4, defaultGrams: 150, category: 'protein' },
    { id: 'shrimp', name: '虾仁', aliases: ['虾仁', '虾'], kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, defaultGrams: 120, category: 'protein' },
    { id: 'carrot', name: '胡萝卜', aliases: ['胡萝卜'], kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, defaultGrams: 100, category: 'vegetable' },
    { id: 'onion', name: '洋葱', aliases: ['洋葱'], kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, defaultGrams: 100, category: 'vegetable' },
    { id: 'eggplant', name: '茄子', aliases: ['茄子'], kcal: 25, protein: 1, carbs: 5.9, fat: 0.2, defaultGrams: 180, category: 'vegetable' },
    { id: 'cooking_oil', name: '烹调油', aliases: ['食用油', '烹调油', '植物油'], kcal: 884, protein: 0, carbs: 0, fat: 100, defaultGrams: 10, category: 'oil' }
  ];

  // These are editable starting assumptions for one home-style serving, not measured recipes.
  const DISH_LIST = [
    { id: 'tomato_egg', name: '西红柿炒鸡蛋', aliases: ['西红柿炒鸡蛋', '西红柿炒蛋', '番茄炒鸡蛋', '番茄炒蛋'], components: [['tomato', 160], ['egg', 100], ['cooking_oil', 10]] },
    { id: 'edamame_chicken', name: '毛豆烧鸡', aliases: ['毛豆烧鸡', '毛豆焖鸡', '毛豆烧鸡块'], components: [['edamame', 120], ['chicken_meat', 120], ['cooking_oil', 8]] },
    { id: 'pepper_pork', name: '青椒肉丝', aliases: ['青椒肉丝', '青椒炒肉丝'], components: [['pepper', 140], ['pork', 120], ['cooking_oil', 12]] },
    { id: 'kung_pao', name: '宫保鸡丁', aliases: ['宫保鸡丁'], components: [['chicken_meat', 130], ['pepper', 70], ['nuts', 20], ['cooking_oil', 15]] },
    { id: 'mapo_tofu', name: '麻婆豆腐', aliases: ['麻婆豆腐'], components: [['tofu', 200], ['pork', 60], ['cooking_oil', 12]] },
    { id: 'fish_pork', name: '鱼香肉丝', aliases: ['鱼香肉丝'], components: [['pork', 120], ['carrot', 60], ['mushroom', 40], ['cooking_oil', 12]] },
    { id: 'beef_potato', name: '土豆炖牛肉', aliases: ['土豆炖牛肉', '牛肉炖土豆'], components: [['potato', 150], ['beef', 120], ['cooking_oil', 8]] },
    { id: 'stir_greens', name: '清炒青菜', aliases: ['清炒青菜', '炒青菜', '炒小青菜'], components: [['greens', 200], ['cooking_oil', 10]] },
    { id: 'steamed_fish', name: '清蒸鱼', aliases: ['清蒸鱼'], components: [['fish', 180], ['cooking_oil', 5]] },
    { id: 'braised_pork', name: '红烧肉', aliases: ['红烧肉'], components: [['pork_belly', 120], ['cooking_oil', 5]] },
    { id: 'egg_fried_rice', name: '蛋炒饭', aliases: ['蛋炒饭', '鸡蛋炒饭'], components: [['rice', 180], ['egg', 50], ['cooking_oil', 12]] },
    { id: 'yellow_chicken', name: '黄焖鸡', aliases: ['黄焖鸡', '黄焖鸡米饭中的鸡'], components: [['chicken_meat', 150], ['potato', 80], ['cooking_oil', 12]] }
  ];

  const DEFAULT_PLAN = [
    { id: 'day-1', name: '训练 A', focus: '上肢', exercises: [
      { id: 'a-1', name: '卧推', sets: 3, reps: 8 }, { id: 'a-2', name: '高位下拉', sets: 3, reps: 10 },
      { id: 'a-3', name: '哑铃肩推', sets: 3, reps: 10 }, { id: 'a-4', name: '坐姿划船', sets: 3, reps: 10 }
    ] },
    { id: 'day-2', name: '训练 B', focus: '下肢', exercises: [
      { id: 'b-1', name: '深蹲', sets: 3, reps: 8 }, { id: 'b-2', name: '罗马尼亚硬拉', sets: 3, reps: 10 },
      { id: 'b-3', name: '腿举', sets: 3, reps: 10 }, { id: 'b-4', name: '提踵', sets: 3, reps: 12 }
    ] },
    { id: 'day-3', name: '训练 C', focus: '上肢', exercises: [
      { id: 'c-1', name: '上斜哑铃卧推', sets: 3, reps: 10 }, { id: 'c-2', name: '引体向上或辅助引体', sets: 3, reps: 8 },
      { id: 'c-3', name: '侧平举', sets: 3, reps: 12 }, { id: 'c-4', name: '俯身划船', sets: 3, reps: 10 }
    ] },
    { id: 'day-4', name: '训练 D', focus: '下肢', exercises: [
      { id: 'd-1', name: '硬拉', sets: 3, reps: 6 }, { id: 'd-2', name: '保加利亚分腿蹲', sets: 3, reps: 10 },
      { id: 'd-3', name: '腿弯举', sets: 3, reps: 10 }, { id: 'd-4', name: '平板支撑', sets: 3, reps: 30 }
    ] }
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function dateKey(date) {
    const d = date instanceof Date ? date : new Date(date || Date.now());
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function createState() {
    return { version: STORE_VERSION, plan: clone(DEFAULT_PLAN), workouts: [], meals: [], bodyMeasurements: [], customFoods: [], profile: { age: '', heightCm: '', weightKg: '', activity: 'moderate', formulaSex: '', dailyReference: '' } };
  }
  function normalizeCustomFoods(raw) {
    if (!Array.isArray(raw)) return [];
    const byId = new Map();
    raw.forEach(function (food) {
      if (!food || typeof food.id !== 'string' || !/^cf-[\w-]{3,80}$/.test(food.id)) return;
      const name = String(food.name || '').trim().slice(0, 80);
      const defaultGrams = Number(food.defaultGrams);
      const nutrition = food.nutrition;
      if (!name || !Number.isFinite(defaultGrams) || defaultGrams < 1 || defaultGrams > 2000 ||
        !nutrition || !CUSTOM_FOOD_NUTRIENTS.every(function (key) {
          const value = nutrition[key];
          return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= (key === 'kcal' ? 900 : 100);
        })) return;
      const cleanNutrition = {};
      CUSTOM_FOOD_NUTRIENTS.forEach(function (key) { cleanNutrition[key] = Math.round(nutrition[key] * 10) / 10; });
      byId.set(food.id, { id: food.id, name: name, defaultGrams: Math.round(defaultGrams * 10) / 10, nutrition: cleanNutrition });
    });
    return [...byId.values()];
  }
  function saveCustomFood(state, input, editingId) {
    const name = String(input && input.name || '').trim();
    if (!name || name.length > 80) throw new Error('食物名称应填写 1–80 个字');
    const existing = Array.isArray(state.customFoods) ? state.customFoods : [];
    if (editingId && !existing.some(function (food) { return food.id === editingId; })) throw new Error('要修改的食物不存在');
    if (existing.some(function (food) { return food.id !== editingId && food.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(); })) throw new Error('已有同名食物，请修改现有条目');
    const defaultGrams = input.defaultGrams === '' || input.defaultGrams == null ? 100 : Number(input.defaultGrams);
    if (!Number.isFinite(defaultGrams) || defaultGrams < 1 || defaultGrams > 2000) throw new Error('常用份量应填写 1–2000 克');
    const nutrition = {};
    CUSTOM_FOOD_NUTRIENTS.forEach(function (key) {
      const raw = input[key];
      const value = Number(raw);
      const label = { kcal: '热量', protein: '蛋白质', carbs: '碳水', fat: '脂肪' }[key];
      const limit = key === 'kcal' ? 900 : 100;
      if (raw === '' || raw == null || !Number.isFinite(value) || value < 0 || value > limit) throw new Error(label + '应填写 0–' + limit + ' 的每百克数值');
      nutrition[key] = Math.round(value * 10) / 10;
    });
    const food = { id: editingId || 'cf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      name: name, defaultGrams: Math.round(defaultGrams * 10) / 10, nutrition: nutrition };
    state.customFoods = editingId ? existing.map(function (item) { return item.id === editingId ? food : item; }) : existing.concat(food);
    return food;
  }
  function customFoodItem(food, grams) {
    return { kind: 'personal', customFoodId: food.id, name: food.name,
      grams: Number(grams) > 0 ? Number(grams) : food.defaultGrams, nutrition: { ...food.nutrition } };
  }
  function validBodyDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(new Date(value + 'T12:00:00')) === value;
  }
  function validRecordDate(value) {
    return validBodyDate(value) && value <= dateKey();
  }
  function normalizeBodyMeasurements(raw) {
    if (!Array.isArray(raw)) return [];
    const byDate = new Map();
    raw.forEach(entry => {
      if (!entry || !validBodyDate(entry.date)) return;
      const clean = { date: entry.date };
      BODY_METRICS.forEach(metric => {
        const value = Number(entry[metric.key]);
        if (entry[metric.key] !== '' && entry[metric.key] != null && Number.isFinite(value) && value >= metric.min && value <= metric.max) {
          clean[metric.key] = Math.round(value * 10) / 10;
        }
      });
      if (Object.keys(clean).length > 1) byDate.set(entry.date, clean);
    });
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }
  function saveBodyMeasurement(state, date, values) {
    if (!validBodyDate(date)) throw new Error('请选择有效的记录日期');
    if (date > dateKey()) throw new Error('不能记录未来日期的身体数据');
    const entry = { date };
    BODY_METRICS.forEach(metric => {
      const raw = values && values[metric.key];
      if (raw === '' || raw == null) return;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < metric.min || value > metric.max) throw new Error(metric.label + '应填写 ' + metric.min + '–' + metric.max + ' ' + metric.unit);
      entry[metric.key] = Math.round(value * 10) / 10;
    });
    if (Object.keys(entry).length === 1) throw new Error('至少填写一项身体数据');
    state.bodyMeasurements = normalizeBodyMeasurements([...(state.bodyMeasurements || []).filter(item => item.date !== date), entry]);
    return entry;
  }
  function bodyMetricSeries(state, key) {
    if (!BODY_METRICS.some(metric => metric.key === key)) return [];
    return normalizeBodyMeasurements(state.bodyMeasurements).filter(item => item[key] != null).map(item => ({ date: item.date, value: item[key] }));
  }
  function normalizeState(raw) {
    const base = createState();
    if (!raw || typeof raw !== 'object') return base;
    return {
      version: STORE_VERSION,
      plan: Array.isArray(raw.plan) && raw.plan.length ? raw.plan : base.plan,
      workouts: Array.isArray(raw.workouts) ? raw.workouts : [],
      meals: Array.isArray(raw.meals) ? raw.meals : [],
      bodyMeasurements: normalizeBodyMeasurements(raw.bodyMeasurements),
      customFoods: normalizeCustomFoods(raw.customFoods),
      profile: Object.assign(base.profile, raw.profile || {})
    };
  }
  function toCount(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }
  function round(value, digits) {
    const factor = Math.pow(10, digits || 0);
    return Math.round(value * factor) / factor;
  }
  function readAmount(numberText, unit, food) {
    const chinese = { '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '半': 0.5 };
    const amount = chinese[numberText] || Number(numberText);
    if (!Number.isFinite(amount) || amount <= 0) return food.defaultGrams;
    if (unit === '克' || unit.toLowerCase() === 'g') return amount;
    if (unit === '个') return amount * (food.pieceGrams || food.defaultGrams);
    if (unit === '杯') return amount * (food.category === 'drink' ? 250 : food.defaultGrams);
    if (unit === '碗') return amount * (food.id === 'rice' ? 150 : food.id === 'noodles' ? 200 : food.defaultGrams);
    if (unit === '盘') return amount * food.defaultGrams;
    return amount * food.defaultGrams;
  }
  function amountNear(text, position, length, food) {
    const unit = '(克|g|碗|个|份|杯|盘)';
    const number = '(\\d+(?:\\.\\d+)?|一|二|两|三|四|半)';
    const before = text.slice(Math.max(0, position - 12), position);
    const after = text.slice(position + length, position + length + 12);
    const prefix = before.match(new RegExp(number + '\\s*' + unit + '\\s*$','i'));
    const suffix = after.match(new RegExp('^\\s*' + number + '\\s*' + unit,'i'));
    const match = suffix || prefix;
    return match ? readAmount(match[1], match[2], food) : food.defaultGrams;
  }
  function overlap(start, end, occupied) {
    return occupied.some(function (span) { return start < span[1] && end > span[0]; });
  }
  function mentions(text, entries, occupied) {
    const candidates = [];
    entries.forEach(function (entry) { entry.aliases.forEach(function (alias) { candidates.push({ entry: entry, alias: alias }); }); });
    candidates.sort(function (a, b) { return b.alias.length - a.alias.length; });
    const found = [];
    candidates.forEach(function (candidate) {
      let from = 0;
      while (true) {
        const position = text.indexOf(candidate.alias, from);
        if (position < 0) break;
        const end = position + candidate.alias.length;
        if (!overlap(position, end, occupied)) {
          found.push({ entry: candidate.entry, position: position, length: candidate.alias.length });
          occupied.push([position, end]);
        }
        from = end;
      }
    });
    return found.sort(function (a, b) { return a.position - b.position; });
  }
  function makeDishItem(dish, grams) {
    const components = dish.components.map(function (part) { return { foodId: part[0], grams: part[1] }; });
    const baseGrams = components.reduce(function (sum, part) { return sum + part.grams; }, 0);
    return { kind: 'dish', dishId: dish.id, name: dish.name, grams: round(grams || baseGrams, 0), baseGrams: baseGrams, components: components, source: 'template' };
  }
  function makeUnknownItem(name) {
    let label = String(name || '').trim().replace(/^(?:我|今天|中午|晚上)?(?:吃了|吃的|点了|喝了)/, '').trim();
    const amount = label.match(/(\d+(?:\.\d+)?)\s*(?:克|g)/i);
    label = label.replace(/^(?:\d+(?:\.\d+)?|一|二|两|三|四|半)\s*(?:克|g|碗|个|份|杯|盘)\s*/i, '').replace(/\s*\d+(?:\.\d+)?\s*(?:克|g)\s*$/i, '').trim();
    return { kind: 'unknown', name: label || '未命名食物', grams: amount ? round(Number(amount[1]), 0) : '' };
  }
  function makeInferredDish(segment, foodMentions) {
    const unique = [];
    foodMentions.forEach(function (match) { if (match.entry.id !== 'cooking_oil' && !unique.some(function (food) { return food.id === match.entry.id; })) unique.push(match.entry); });
    const target = unique.length === 1 ? 200 : 240;
    const weight = unique.reduce(function (sum, food) { return sum + (food.category === 'protein' ? 1.2 : 1); }, 0);
    const components = unique.map(function (food) { return { foodId: food.id, grams: round(target * (food.category === 'protein' ? 1.2 : 1) / weight, 0) }; });
    const method = segment.match(/炒|煎|炸|烧|焖|炖|拌|蒸|煮|烤/);
    const oil = method && /炒|煎|炸/.test(method[0]) ? 12 : method && /烧|焖|炖/.test(method[0]) ? 8 : method && method[0] === '拌' ? 5 : 0;
    if (oil) components.push({ foodId: 'cooking_oil', grams: oil });
    const baseGrams = components.reduce(function (sum, part) { return sum + part.grams; }, 0);
    const name = segment.replace(/^(?:我|今天|中午|晚上)?(?:吃了|吃的|点了)?\s*(?:\d+(?:\.\d+)?|一|二|两|三|四|半)\s*(?:克|g|碗|个|份|杯|盘)\s*/i, '').trim();
    const portion = amountNear(segment, segment.indexOf(name), name.length, { defaultGrams: baseGrams, category: 'mixed' });
    return { kind: 'dish', name: name || segment.trim(), grams: round(portion, 0), baseGrams: baseGrams, components: components, source: 'inferred' };
  }
  function parseMealText(text) {
    return String(text || '').split(/[，,、；;+\n]+/).map(function (part) { return part.trim(); }).filter(Boolean).reduce(function (all, segment) {
      const occupied = [];
      const dishMatches = mentions(segment, DISH_LIST, occupied);
      if (dishMatches.length) {
        dishMatches.forEach(function (match) {
          const base = match.entry.components.reduce(function (sum, part) { return sum + part[1]; }, 0);
          const grams = amountNear(segment, match.position, match.length, { defaultGrams: base, category: 'mixed' });
          all.push(makeDishItem(match.entry, grams));
        });
      }
      const foodMatches = mentions(segment, FOOD_LIST, occupied);
      if (!dishMatches.length && /炒|煎|炸|烧|焖|炖|拌|蒸|煮|烤/.test(segment) && foodMatches.length) {
        all.push(makeInferredDish(segment, foodMatches));
      } else {
        foodMatches.forEach(function (match) {
          all.push({ foodId: match.entry.id, name: match.entry.name, grams: round(amountNear(segment, match.position, match.length, match.entry), 0) });
        });
      }
      if (!dishMatches.length && !foodMatches.length) all.push(makeUnknownItem(segment));
      return all;
    }, []);
  }
  function calculateMeal(items) {
    const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const range = { min: 0, max: 0 };
    let estimatedCount = 0, unknownCount = 0;
    const lines = (items || []).map(function (item) {
      const grams = toCount(item.grams);
      if (Array.isArray(item.customRecipe) && item.customRecipe.length && grams) {
        const base = toCount(item.recipeBaseGrams) || grams;
        const factor = grams / base;
        const ingredients = item.customRecipe.map(function (part) {
          const amount = toCount(part.grams) * factor;
          const valid = ['kcal', 'protein', 'carbs', 'fat'].every(function (key) { return Number.isFinite(part[key]) && part[key] >= 0; });
          if (!valid || !amount) return null;
          return { name: String(part.name || '食材'), grams: round(amount, 1), category: part.category || 'mixed',
            kcal: part.kcal * amount / 100, protein: part.protein * amount / 100,
            carbs: part.carbs * amount / 100, fat: part.fat * amount / 100 };
        }).filter(Boolean);
        if (ingredients.length) {
          const line = { name: item.name, grams: round(grams, 0), category: 'mixed', source: 'custom', ingredients: ingredients, estimated: true };
          ['kcal','protein','carbs','fat'].forEach(function (key) { line[key] = round(ingredients.reduce(function (sum, part) { return sum + part[key]; }, 0), key === 'kcal' ? 0 : 1); });
          return line;
        }
        return { name: item.name || '未识别食物', grams: round(grams, 0), category: 'unknown', estimated: false };
      }
      if ((item.kind === 'catalog' || item.kind === 'personal') && item.nutrition && grams) {
        const nutrient = item.nutrition;
        const keys = ['kcal', 'protein', 'carbs', 'fat'];
        if (keys.every(function (key) { return typeof nutrient[key] === 'number' && Number.isFinite(nutrient[key]) && nutrient[key] >= 0; })) {
          const factor = grams / 100;
          const ingredients = Array.isArray(item.ingredients) ? item.ingredients.map(function (part) {
            return { name: String(part.name || ''), grams: round(toCount(part.grams) * factor, 0), category: part.category || 'mixed' };
          }) : [];
          return { name: item.name, grams: round(grams, 0), category: item.category || 'mixed', source: item.kind, estimated: true,
            kcal: round(nutrient.kcal * factor, 0), protein: round(nutrient.protein * factor, 1), carbs: round(nutrient.carbs * factor, 1), fat: round(nutrient.fat * factor, 1),
            ingredients: ingredients };
        }
      }
      if (item.kind === 'ai' && item.aiEstimate && grams) {
        const estimate = item.aiEstimate;
        const baseGrams = toCount(item.baseGrams);
        const keys = ['kcal', 'kcalMin', 'kcalMax', 'protein', 'carbs', 'fat'];
        if (baseGrams && keys.every(function (key) { return typeof estimate[key] === 'number' && Number.isFinite(estimate[key]) && estimate[key] >= 0; }) && estimate.kcalMin <= estimate.kcal && estimate.kcal <= estimate.kcalMax) {
          const factor = grams / baseGrams;
          const ingredients = Array.isArray(estimate.ingredients) ? estimate.ingredients.map(function (part) { return { name: String(part.name || ''), grams: round(toCount(part.grams) * factor, 0), category: 'mixed' }; }) : [];
          return { name: item.name, grams: round(grams, 0), category: 'mixed', source: 'ai', estimated: true,
            kcal: round(estimate.kcal * factor, 0), kcalMin: round(estimate.kcalMin * factor, 0), kcalMax: round(estimate.kcalMax * factor, 0),
            protein: round(estimate.protein * factor, 1), carbs: round(estimate.carbs * factor, 1), fat: round(estimate.fat * factor, 1),
            ingredients: ingredients, assumptions: estimate.assumptions || [], explanation: estimate.explanation || '', sources: estimate.sources || [] };
        }
      }
      if (Array.isArray(item.components) && item.components.length && grams) {
        const baseGrams = toCount(item.baseGrams) || item.components.reduce(function (sum, part) { return sum + toCount(part.grams); }, 0);
        const ingredients = item.components.map(function (part) {
          const food = FOOD_LIST.find(function (entry) { return entry.id === part.foodId; });
          if (!food) return null;
          const amount = toCount(part.grams) * grams / baseGrams;
          return { name: food.name, grams: round(amount, 0), category: food.category, kcal: food.kcal * amount / 100, protein: food.protein * amount / 100, carbs: food.carbs * amount / 100, fat: food.fat * amount / 100 };
        }).filter(Boolean);
        if (!ingredients.length) return null;
        const line = { name: item.name, grams: round(grams, 0), category: 'mixed', source: item.source || 'template', ingredients: ingredients, estimated: true };
        ['kcal','protein','carbs','fat'].forEach(function (key) { line[key] = round(ingredients.reduce(function (sum, part) { return sum + part[key]; }, 0), key === 'kcal' ? 0 : 1); });
        return line;
      }
      const food = FOOD_LIST.find(function (entry) { return entry.id === item.foodId; });
      if (food && grams) {
        const factor = grams / 100;
        return { foodId: food.id, name: food.name, grams: round(grams, 0), category: food.category, source: 'food', estimated: true,
          kcal: round(food.kcal * factor, 0), protein: round(food.protein * factor, 1), carbs: round(food.carbs * factor, 1), fat: round(food.fat * factor, 1) };
      }
      return { name: item.name || '未识别食物', grams: grams ? round(grams, 0) : '', category: 'unknown', estimated: false };
    }).filter(Boolean);
    lines.forEach(function (line) {
      if (!line.estimated) { unknownCount += 1; return; }
      estimatedCount += 1;
      ['kcal','protein','carbs','fat'].forEach(function (key) { totals[key] += line[key]; });
      if (line.source === 'ai') { range.min += line.kcalMin; range.max += line.kcalMax; }
      else {
        const uncertainty = line.source === 'personal' ? 0 : line.source === 'inferred' ? 0.45 : line.source === 'template' || line.source === 'catalog' ? 0.35 : line.source === 'custom' ? 0.2 : 0.3;
        range.min += line.kcal * (1 - uncertainty);
        range.max += line.kcal * (1 + uncertainty);
      }
    });
    Object.keys(totals).forEach(function (key) { totals[key] = round(totals[key], key === 'kcal' ? 0 : 1); });
    range.min = round(range.min, 0); range.max = round(range.max, 0);
    return { lines: lines, totals: totals, range: range, estimatedCount: estimatedCount, unknownCount: unknownCount };
  }
  function getDaySummary(state, day) {
    const key = day || dateKey();
    const meals = (state.meals || []).filter(function (meal) { return meal.date === key; });
    const workouts = (state.workouts || []).filter(function (workout) { return workout.date === key; });
    const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const range = { min: 0, max: 0 };
    let estimatedCount = 0, unknownCount = 0;
    meals.forEach(function (meal) {
      const estimate = calculateMeal(meal.items || []);
      Object.keys(totals).forEach(function (field) { totals[field] += estimate.totals[field]; });
      range.min += estimate.range.min; range.max += estimate.range.max;
      estimatedCount += estimate.estimatedCount; unknownCount += estimate.unknownCount;
    });
    Object.keys(totals).forEach(function (field) { totals[field] = round(totals[field], field === 'kcal' ? 0 : 1); });
    return { date: key, meals: meals, workouts: workouts, totals: totals, range: range, estimatedCount: estimatedCount, unknownCount: unknownCount };
  }
  function getWeekOverview(state, referenceDate, weekOffset) {
    const reference = validBodyDate(referenceDate) ? referenceDate : dateKey();
    const monday = new Date(reference + 'T12:00:00');
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7 + Math.trunc(Number(weekOffset) || 0) * 7);
    const weights = new Map((state.bodyMeasurements || []).filter(item => item.weightKg != null).map(item => [item.date, item.weightKg]));
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = dateKey(date);
      return { ...getDaySummary(state, key), weightKg: weights.get(key) };
    });
    const recordedWeights = days.filter(day => day.weightKg != null).map(day => ({ date: day.date, value: day.weightKg }));
    return {
      start: days[0].date, end: days[6].date, days,
      mealDays: days.filter(day => day.meals.length).length,
      mealCount: days.reduce((sum, day) => sum + day.meals.length, 0),
      strengthCount: days.reduce((sum, day) => sum + day.workouts.filter(item => Array.isArray(item.exercises) && item.exercises.length).length, 0),
      cardioCount: days.reduce((sum, day) => sum + day.workouts.filter(item => Array.isArray(item.cardio) && item.cardio.length).length, 0),
      estimatedCount: days.reduce((sum, day) => sum + day.estimatedCount, 0),
      unknownCount: days.reduce((sum, day) => sum + day.unknownCount, 0),
      range: { min: days.reduce((sum, day) => sum + day.range.min, 0), max: days.reduce((sum, day) => sum + day.range.max, 0) },
      protein: round(days.reduce((sum, day) => sum + day.totals.protein, 0), 1),
      recordedWeights
    };
  }
  function estimateReference(profile) {
    const age = Number(profile.age), height = Number(profile.heightCm), weight = Number(profile.weightKg);
    if (!(age >= 18 && age <= 100 && height >= 120 && height <= 230 && weight >= 30 && weight <= 300)) return null;
    if (profile.formulaSex !== 'male' && profile.formulaSex !== 'female') return null;
    const resting = 10 * weight + 6.25 * height - 5 * age + (profile.formulaSex === 'male' ? 5 : -161);
    const factor = { low: 1.4, moderate: 1.6, high: 1.8 }[profile.activity] || 1.6;
    const maintenance = resting * factor;
    const center = maintenance * 0.9;
    return { min: Math.round((center - 150) / 50) * 50, max: Math.round((center + 150) / 50) * 50, maintenance: Math.round(maintenance / 50) * 50 };
  }
  function getReference(profile) {
    const manual = toCount(profile.dailyReference);
    if (manual) return { min: Math.max(0, manual - 150), max: manual + 150, source: 'manual' };
    const estimate = estimateReference(profile);
    return estimate ? { min: estimate.min, max: estimate.max, source: 'formula' } : null;
  }
  function getMealAdvice(estimate, dailySummary, profile) {
    if (!estimate.lines.length) return { headline: '请先补充食物', notes: ['写下菜名后点击识别，或从下方手动添加。'] };
    if (!estimate.estimatedCount) return { headline: '已记下菜名，暂无法估算', notes: ['这道菜没有足够的食材信息；可补充主要食材、做法和份量。', '先保留记录，不会用 0 千卡冒充估算结果。'] };
    const notes = [];
    const categories = estimate.lines.reduce(function (all, line) { return all.concat(line.category, (line.ingredients || []).map(function (part) { return part.category; })); }, []);
    if (estimate.unknownCount) notes.push('有 ' + estimate.unknownCount + ' 项尚未估算，下方数字只包含已识别部分。');
    if (!estimate.unknownCount) {
      if (estimate.totals.protein < 20) notes.push('这餐蛋白质估算较少，可考虑加入蛋、豆腐、鱼或瘦肉。');
      else notes.push('这餐有较明确的蛋白质来源。');
      if (!categories.includes('vegetable')) notes.push('当前记录中没有蔬菜；若实际吃了，请补记。');
    }
    if (estimate.lines.some(function (line) { return line.source === 'inferred'; })) notes.push('部分菜名按食材和做法推断了用油与份量，实际做法可能不同。');
    else if (estimate.lines.some(function (line) { return line.source === 'template' || line.source === 'catalog'; })) notes.push('家常菜按示例食材与用油估算，可在上方调整食材和用油。');
    if (estimate.lines.some(function (line) { return line.source === 'custom'; })) notes.push('食材和用油已按你填写的量估算；仍需留意熟重、酱料和分餐比例。');
    if (estimate.lines.some(function (line) { return line.source === 'ai'; })) notes.push('AI 搜索估算可能与实际配方和用油不同，请核对份量与食材。');
    if (categories.includes('drink') && estimate.lines.some(function (line) { return line.foodId === 'cola' || line.foodId === 'milk_tea'; })) notes.push('饮料也计入了这餐热量，份量会明显影响估算。');
    if (estimate.totals.kcal > 800) notes.push('这餐热量估算偏高，注意与当天其他餐一起看。');
    if (dailySummary.workouts.length) notes.push('今天记录了训练，建议结合全天饮食查看蛋白质和总量。');
    const reference = getReference(profile || {});
    if (reference && dailySummary.meals.length && !dailySummary.unknownCount && !estimate.unknownCount) {
      if (dailySummary.range.min > reference.max) notes.push('当天已记录餐食的估算下限超过参考范围；请先检查份量和漏记、重记。');
      else notes.push('当天估算摄入为 ' + dailySummary.range.min + '–' + dailySummary.range.max + ' 千卡；参考范围为 ' + reference.min + '–' + reference.max + ' 千卡。');
    } else notes.push('单餐不能决定全天是否符合减脂目标，继续记录当天其他餐会更有帮助。');
    return { headline: estimate.unknownCount ? '已识别部分可供参考' : estimate.totals.protein >= 20 && estimate.totals.kcal <= 800 ? '目前看，这餐结构较稳妥' : '这餐有可调整的地方', notes: notes.slice(0, 5) };
  }
  function lastWorkoutForPlan(state, planId) {
    return (state.workouts || []).filter(function (item) { return item.planId === planId; }).sort(newestRecordFirst)[0] || null;
  }
  function newestRecordFirst(a, b) {
    return String(b.date || '').localeCompare(String(a.date || '')) || Number(b.createdAt || 0) - Number(a.createdAt || 0);
  }
  function nextPlanIndex(state) {
    const ordered = state.workouts.filter(function (item) { return state.plan.some(function (day) { return day.id === item.planId; }); })
      .sort(newestRecordFirst);
    if (!ordered.length) return 0;
    const index = state.plan.findIndex(function (day) { return day.id === ordered[0].planId; });
    return index < 0 ? 0 : (index + 1) % state.plan.length;
  }
  return { STORE_VERSION: STORE_VERSION, FOOD_LIST: FOOD_LIST, DISH_LIST: DISH_LIST, DEFAULT_PLAN: DEFAULT_PLAN, BODY_METRICS: BODY_METRICS, createState: createState, normalizeState: normalizeState, normalizeBodyMeasurements: normalizeBodyMeasurements, saveBodyMeasurement: saveBodyMeasurement, bodyMetricSeries: bodyMetricSeries, normalizeCustomFoods: normalizeCustomFoods, saveCustomFood: saveCustomFood, customFoodItem: customFoodItem, dateKey: dateKey, validRecordDate: validRecordDate, newestRecordFirst: newestRecordFirst, getWeekOverview: getWeekOverview, parseMealText: parseMealText, makeDishItem: makeDishItem, makeUnknownItem: makeUnknownItem, calculateMeal: calculateMeal, getDaySummary: getDaySummary, getMealAdvice: getMealAdvice, estimateReference: estimateReference, getReference: getReference, lastWorkoutForPlan: lastWorkoutForPlan, nextPlanIndex: nextPlanIndex };
});
