const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../web/dish-catalog');
const core = require('../shared/core');

test('500 道菜的名称唯一且具有每百克热量和三大营养素', () => {
  assert.equal(catalog.dishes.length, 500);
  assert.equal(new Set(catalog.dishes.map(dish => dish.name)).size, 500);
  for (const dish of catalog.dishes) {
    for (const key of ['kcal', 'protein', 'carbs', 'fat']) {
      assert.ok(Number.isFinite(dish.per100[key]) && dish.per100[key] >= 0, dish.name + '/' + key);
    }
  }
});

test('鲁菜和川渝菜可搜索，代表菜的主要食材与名称对应', () => {
  assert.equal(catalog.find('鲁菜').length, 30);
  assert.equal(catalog.find('川渝菜').length, 30);
  const expected = [
    ['海肠捞饭', '海肠（贝类近似）'],
    ['临沂炒鸡', '鸡肉'],
    ['毛血旺', '鸭血（估值）']
  ];
  for (const [name, ingredient] of expected) {
    const dish = catalog.find(name)[0];
    assert.equal(dish.name, name);
    assert.ok(dish.ingredients.some(part => part.name === ingredient), name);
    assert.equal(core.calculateMeal([catalog.makeItem(dish, 100)]).lines[0].kcal, dish.per100.kcal);
  }
  assert.deepEqual(catalog.parseText('海肠捞饭、临沂炒鸡、毛血旺').map(x => x.name), expected.map(x => x[0]));
});

test('菜名搜索、文字拆解和份量换算使用同一条菜肴数据', () => {
  assert.equal(catalog.find('番茄炒蛋')[0].name, '西红柿炒鸡蛋');
  assert.equal(catalog.find('毛豆烧鸡')[0].name, '毛豆烧鸡');
  const items = catalog.parseText('一盘西红柿炒鸡蛋、毛豆烧鸡、一碗米饭');
  assert.deepEqual(items.map(item => item.name), ['西红柿炒鸡蛋', '毛豆烧鸡', '米饭']);
  const dish = catalog.find('西红柿炒鸡蛋')[0];
  const line = core.calculateMeal([catalog.makeItem(dish, 200)]).lines[0];
  assert.equal(line.kcal, dish.per100.kcal * 2);
  assert.equal(line.source, 'catalog');
  assert.ok(line.ingredients.some(part => part.name === '烹调油'));
});

test('自定义食材和喷油用量替换示例配方，不重复计入目录热量', () => {
  const dish = catalog.find('西红柿炒鸡蛋')[0];
  const item = catalog.makeItem(dish, 100);
  item.customRecipe = item.ingredients.map(part => ({ ...part, grams: part.foodId === 'cooking_oil' ? 1 : part.grams }));
  item.recipeBaseGrams = 100;
  const line = core.calculateMeal([item]).lines[0];
  const expected = Math.round(item.customRecipe.reduce((sum, part) => sum + part.kcal * part.grams / 100, 0));
  assert.equal(line.kcal, expected);
  assert.equal(line.source, 'custom');
  assert.ok(line.kcal < dish.per100.kcal);
  item.grams = 200;
  assert.equal(core.calculateMeal([item]).lines[0].kcal,
    Math.round(item.customRecipe.reduce((sum, part) => sum + part.kcal * part.grams / 100, 0) * 2));
});
