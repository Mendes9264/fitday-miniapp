(function (root, factory) {
  const core = typeof module !== 'undefined' && module.exports ? require('../shared/core') : root.FitCore;
  const api = factory(core);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FitDishCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';

  // Values are representative cooked, edible-weight recipe estimates per 100 g.
  // The core food values are supplemented with common food-composition reference values.
  // They are not laboratory measurements of the named dishes.
  const food = Object.fromEntries(core.FOOD_LIST.map(x => [x.id, x]));
  Object.assign(food, {
    cabbage: { name: '卷心菜', kcal: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
    napa: { name: '大白菜', kcal: 16, protein: 1.2, carbs: 3.2, fat: 0.1 },
    celery: { name: '芹菜', kcal: 16, protein: 0.7, carbs: 3, fat: 0.2 },
    beans: { name: '四季豆', kcal: 31, protein: 1.8, carbs: 7, fat: 0.2 },
    longbean: { name: '豇豆', kcal: 34, protein: 2.5, carbs: 6.5, fat: 0.4 },
    lotus: { name: '莲藕', kcal: 74, protein: 2.6, carbs: 17.2, fat: 0.1 },
    cauliflower: { name: '菜花', kcal: 25, protein: 1.9, carbs: 5, fat: 0.3 },
    bamboo: { name: '竹笋', kcal: 27, protein: 2.6, carbs: 5.2, fat: 0.3 },
    squash: { name: '西葫芦', kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
    pumpkin: { name: '南瓜', kcal: 26, protein: 1, carbs: 6.5, fat: 0.1 },
    wintermelon: { name: '冬瓜', kcal: 13, protein: 0.4, carbs: 3, fat: 0.2 },
    radish: { name: '白萝卜', kcal: 18, protein: 0.7, carbs: 4.1, fat: 0.1 },
    sauerkraut: { name: '酸菜', kcal: 20, protein: 1.1, carbs: 4.2, fat: 0.2 },
    bitter: { name: '苦瓜', kcal: 17, protein: 1, carbs: 3.7, fat: 0.2 },
    chestnut: { name: '熟栗子', kcal: 196, protein: 2.7, carbs: 45, fat: 1.3 },
    corn: { name: '玉米粒', kcal: 96, protein: 3.4, carbs: 21, fat: 1.5 },
    peas: { name: '豌豆', kcal: 81, protein: 5.4, carbs: 14.5, fat: 0.4 },
    wood_ear: { name: '泡发木耳', kcal: 25, protein: 1.5, carbs: 6, fat: 0.1 },
    bean_sprout: { name: '绿豆芽', kcal: 30, protein: 3, carbs: 5.9, fat: 0.2 },
    leek: { name: '韭菜', kcal: 30, protein: 2.4, carbs: 4.5, fat: 0.7 },
    garlic_shoot: { name: '蒜薹', kcal: 66, protein: 2, carbs: 14, fat: 0.1 },
    seaweed: { name: '泡发海带', kcal: 25, protein: 1.7, carbs: 5, fat: 0.3 },
    seaweed_dry: { name: '紫菜', kcal: 306, protein: 30, carbs: 44, fat: 5 },
    sweet_potato: { name: '红薯', kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    rice_noodle: { name: '熟米粉', kcal: 110, protein: 2, carbs: 25, fat: 0.2 },
    vermicelli: { name: '熟粉丝', kcal: 85, protein: 0.1, carbs: 21, fat: 0.1 },
    dough: { name: '熟面皮', kcal: 220, protein: 6, carbs: 45, fat: 1.5 },
    wonton_wrapper: { name: '馄饨皮', kcal: 250, protein: 8, carbs: 50, fat: 1.5 },
    millet_congee: { name: '小米粥', kcal: 46, protein: 1.1, carbs: 9.5, fat: 0.4 },
    wheat_flour: { name: '面粉', kcal: 364, protein: 10, carbs: 76, fat: 1 },
    sticky_rice: { name: '熟糯米', kcal: 170, protein: 3.5, carbs: 37, fat: 0.4 },
    red_bean: { name: '熟红豆', kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
    mung_bean: { name: '熟绿豆', kcal: 105, protein: 7, carbs: 19, fat: 0.4 },
    tremella: { name: '泡发银耳', kcal: 16, protein: 1.4, carbs: 3.4, fat: 0.1 },
    red_date: { name: '红枣', kcal: 281, protein: 3.7, carbs: 72, fat: 0.5 },
    peanuts: { name: '花生仁', kcal: 567, protein: 25.8, carbs: 16.1, fat: 49.2 },
    sesame: { name: '芝麻', kcal: 573, protein: 17.7, carbs: 23.4, fat: 49.7 },
    starch: { name: '淀粉', kcal: 350, protein: 0.2, carbs: 87, fat: 0.1 },
    sugar: { name: '糖', kcal: 400, protein: 0, carbs: 100, fat: 0 },
    sauce: { name: '调味汁', kcal: 50, protein: 2, carbs: 10, fat: 0.2 },
    broth: { name: '汤水', kcal: 5, protein: 0.5, carbs: 0.5, fat: 0.1 },
    beef_brisket: { name: '牛腩', kcal: 240, protein: 20, carbs: 0, fat: 18 },
    lamb: { name: '羊肉', kcal: 203, protein: 25, carbs: 0, fat: 11 },
    duck: { name: '鸭肉', kcal: 240, protein: 19, carbs: 0, fat: 18 },
    liver: { name: '猪肝', kcal: 135, protein: 20, carbs: 3, fat: 4 },
    preserved_egg: { name: '皮蛋', kcal: 171, protein: 13, carbs: 2, fat: 11 },
    sausage: { name: '腊肠', kcal: 350, protein: 15, carbs: 8, fat: 29 },
    ham: { name: '火腿', kcal: 145, protein: 21, carbs: 2, fat: 6 },
    crab: { name: '蟹肉', kcal: 97, protein: 19, carbs: 0, fat: 2 },
    squid: { name: '鱿鱼', kcal: 92, protein: 15.6, carbs: 3, fat: 1.4 },
    clam: { name: '蛤蜊肉', kcal: 86, protein: 14.7, carbs: 3.6, fat: 1 },
    scallop: { name: '扇贝肉', kcal: 88, protein: 17, carbs: 2.3, fat: 0.8 },
    tofu_skin: { name: '豆腐皮', kcal: 190, protein: 20, carbs: 5, fat: 10 },
    tofu_dried: { name: '豆干', kcal: 140, protein: 16, carbs: 4, fat: 7 },
    tofu_silken: { name: '嫩豆腐', kcal: 55, protein: 5.5, carbs: 2, fat: 3 },
    fermented_bean: { name: '豆瓣酱', kcal: 110, protein: 6, carbs: 13, fat: 4 },
    milk_coconut: { name: '椰奶', kcal: 180, protein: 2, carbs: 4, fat: 18 },
    sea_intestine: { name: '海肠（贝类近似）', kcal: 86, protein: 14, carbs: 3, fat: 1 },
    sea_worm: { name: '土笋（贝类近似）', kcal: 86, protein: 14, carbs: 3, fat: 1 },
    duck_blood: { name: '鸭血（估值）', kcal: 80, protein: 13, carbs: 1, fat: 1 },
    pig_blood: { name: '猪血（估值）', kcal: 78, protein: 12, carbs: 1, fat: 1 },
    tripe: { name: '毛肚', kcal: 85, protein: 15, carbs: 0, fat: 2 },
    pork_intestine: { name: '猪大肠', kcal: 196, protein: 7, carbs: 0, fat: 19 },
    pork_kidney: { name: '猪腰', kcal: 100, protein: 15, carbs: 3, fat: 3 },
    chicken_gizzard: { name: '鸡胗', kcal: 94, protein: 17, carbs: 0, fat: 2 },
    chicken_feet: { name: '鸡爪', kcal: 215, protein: 19, carbs: 0, fat: 15 },
    rabbit: { name: '兔肉', kcal: 130, protein: 23, carbs: 0, fat: 4 },
    bullfrog: { name: '牛蛙', kcal: 73, protein: 15, carbs: 0, fat: 0.3 },
    eel: { name: '鳝鱼', kcal: 185, protein: 19, carbs: 0, fat: 11 },
    goose: { name: '鹅肉', kcal: 238, protein: 28, carbs: 0, fat: 13 },
    pigeon: { name: '乳鸽', kcal: 190, protein: 25, carbs: 0, fat: 10 },
    sea_cucumber: { name: '海参', kcal: 78, protein: 16, carbs: 0, fat: 0.5 },
    abalone: { name: '鲍鱼', kcal: 105, protein: 20, carbs: 4, fat: 0.5 },
    oyster: { name: '牡蛎', kcal: 68, protein: 7, carbs: 4, fat: 2 },
    luncheon_meat: { name: '午餐肉', kcal: 260, protein: 12, carbs: 4, fat: 22 },
    rice_cake: { name: '年糕', kcal: 160, protein: 3, carbs: 35, fat: 0.3 },
    taro: { name: '芋头', kcal: 112, protein: 1.5, carbs: 26, fat: 0.2 },
    rice_cracker: { name: '锅巴', kcal: 380, protein: 7, carbs: 80, fat: 3 },
    pig_skin: { name: '猪皮', kcal: 270, protein: 22, carbs: 0, fat: 20 },
    donkey: { name: '驴肉（瘦牛肉近似）', kcal: 175, protein: 28, carbs: 0, fat: 7 },
    fishmint: { name: '折耳根', kcal: 30, protein: 2, carbs: 5, fat: 0.3 },
    pig_trotter: { name: '猪蹄', kcal: 260, protein: 22, carbs: 0, fat: 19 },
    lamb_trotter: { name: '羊蹄（羊肉近似）', kcal: 230, protein: 21, carbs: 0, fat: 16 },
    cheese: { name: '乳制品（乳扇近似）', kcal: 300, protein: 20, carbs: 5, fat: 23 },
    pineapple: { name: '菠萝', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 },
    preserved_mustard: { name: '梅干菜', kcal: 35, protein: 2, carbs: 7, fat: 0.2 },
    sour_longbean: { name: '酸豆角', kcal: 32, protein: 2, carbs: 6, fat: 0.2 },
    pickled_radish: { name: '酸萝卜', kcal: 20, protein: 0.7, carbs: 4, fat: 0.1 },
    barley: { name: '熟青稞／大麦', kcal: 123, protein: 2.3, carbs: 28, fat: 0.4 }
  });

  // Each row is one familiar dish and a representative 100 g finished-food mix.
  // Ratios are author assumptions, not a claim of a standardized recipe.
  const baseRows = `
西红柿炒鸡蛋|家常蔬菜|tomato:52,egg:42,cooking_oil:6
清炒小白菜|家常蔬菜|greens:94,cooking_oil:6
蒜蓉菠菜|家常蔬菜|greens:94,cooking_oil:6
清炒西兰花|家常蔬菜|broccoli:93,cooking_oil:7
蒜蓉生菜|家常蔬菜|greens:94,cooking_oil:6
手撕包菜|家常蔬菜|cabbage:88,cooking_oil:8,sauce:4
醋溜白菜|家常蔬菜|napa:89,cooking_oil:6,sauce:5
酸辣土豆丝|家常蔬菜|potato:88,cooking_oil:8,sauce:4
青椒土豆丝|家常蔬菜|potato:66,pepper:25,cooking_oil:9
地三鲜|家常蔬菜|potato:33,eggplant:32,pepper:23,cooking_oil:12
干煸四季豆|家常蔬菜|beans:79,pork:10,cooking_oil:10,sauce:1
蒜蓉四季豆|家常蔬菜|beans:91,cooking_oil:7,sauce:2
凉拌黄瓜|家常蔬菜|cucumber:90,cooking_oil:3,sauce:7
拍黄瓜|家常蔬菜|cucumber:89,cooking_oil:4,sauce:7
凉拌木耳|家常蔬菜|wood_ear:88,cooking_oil:4,sauce:8
清炒藕片|家常蔬菜|lotus:89,cooking_oil:8,sauce:3
糖醋藕片|家常蔬菜|lotus:82,cooking_oil:5,sauce:7,sugar:6
干锅花菜|家常蔬菜|cauliflower:79,pork_belly:8,cooking_oil:10,sauce:3
清炒花菜|家常蔬菜|cauliflower:92,cooking_oil:7,sauce:1
清炒西葫芦|家常蔬菜|squash:92,cooking_oil:7,sauce:1
西葫芦炒鸡蛋|家常蔬菜|squash:60,egg:34,cooking_oil:6
苦瓜炒蛋|家常蔬菜|bitter:55,egg:38,cooking_oil:7
清炒芹菜|家常蔬菜|celery:91,cooking_oil:7,sauce:2
芹菜香干|家常蔬菜|celery:56,tofu_dried:36,cooking_oil:7,sauce:1
蒜蓉茄子|家常蔬菜|eggplant:84,cooking_oil:10,sauce:6
鱼香茄子|家常蔬菜|eggplant:77,pork:9,cooking_oil:10,sauce:4
红烧茄子|家常蔬菜|eggplant:80,cooking_oil:12,sauce:8
烧冬瓜|家常蔬菜|wintermelon:87,cooking_oil:6,sauce:7
清炒豆芽|家常蔬菜|bean_sprout:92,cooking_oil:7,sauce:1
韭菜炒豆芽|家常蔬菜|bean_sprout:63,leek:29,cooking_oil:7,sauce:1
蒜蓉油麦菜|家常蔬菜|greens:94,cooking_oil:6
蚝油生菜|家常蔬菜|greens:87,cooking_oil:5,sauce:8
香菇青菜|家常蔬菜|greens:65,mushroom:28,cooking_oil:7
凉拌海带丝|家常蔬菜|seaweed:87,cooking_oil:4,sauce:9
虎皮青椒|家常蔬菜|pepper:82,cooking_oil:11,sauce:7
麻婆豆腐|鸡蛋豆制品|tofu:75,pork:13,cooking_oil:8,fermented_bean:4
家常豆腐|鸡蛋豆制品|tofu:70,pepper:18,cooking_oil:8,sauce:4
红烧豆腐|鸡蛋豆制品|tofu:84,cooking_oil:7,sauce:9
香煎豆腐|鸡蛋豆制品|tofu:88,cooking_oil:10,sauce:2
小葱拌豆腐|鸡蛋豆制品|tofu_silken:90,greens:7,sauce:3
皮蛋豆腐|鸡蛋豆制品|tofu_silken:62,preserved_egg:30,sauce:8
锅塌豆腐|鸡蛋豆制品|tofu:72,egg:19,cooking_oil:8,sauce:1
鱼香豆腐|鸡蛋豆制品|tofu:74,pepper:12,cooking_oil:9,sauce:5
虾仁豆腐|鸡蛋豆制品|tofu_silken:58,shrimp:33,cooking_oil:5,sauce:4
肉末豆腐|鸡蛋豆制品|tofu:69,pork:23,cooking_oil:6,sauce:2
千张炒肉|鸡蛋豆制品|tofu_skin:52,pork:38,cooking_oil:8,sauce:2
青椒炒豆干|鸡蛋豆制品|tofu_dried:57,pepper:35,cooking_oil:7,sauce:1
韭菜炒豆干|鸡蛋豆制品|tofu_dried:55,leek:35,cooking_oil:8,sauce:2
香菇烧豆腐|鸡蛋豆制品|tofu:66,mushroom:25,cooking_oil:7,sauce:2
番茄豆腐|鸡蛋豆制品|tomato:44,tofu:48,cooking_oil:6,sauce:2
韭菜炒鸡蛋|鸡蛋豆制品|leek:52,egg:40,cooking_oil:8
黄瓜炒鸡蛋|鸡蛋豆制品|cucumber:54,egg:39,cooking_oil:7
木耳炒鸡蛋|鸡蛋豆制品|wood_ear:47,egg:45,cooking_oil:8
蒸水蛋|鸡蛋豆制品|egg:47,broth:52,sauce:1
茶叶蛋|鸡蛋豆制品|egg:96,sauce:4
荷包蛋|鸡蛋豆制品|egg:92,cooking_oil:8
虎皮鸡蛋|鸡蛋豆制品|egg:84,cooking_oil:9,sauce:7
苦瓜酿肉|鸡蛋豆制品|bitter:48,pork:43,cooking_oil:5,sauce:4
豆腐脑|鸡蛋豆制品|tofu_silken:90,sauce:10
毛豆炒鸡蛋|鸡蛋豆制品|edamame:47,egg:45,cooking_oil:8
青椒肉丝|畜肉菜|pepper:48,pork:42,cooking_oil:8,sauce:2
鱼香肉丝|畜肉菜|pork:47,bamboo:20,carrot:16,wood_ear:8,cooking_oil:7,sauce:2
京酱肉丝|畜肉菜|pork:67,onion:15,cooking_oil:8,sauce:10
蒜苔炒肉|畜肉菜|garlic_shoot:48,pork:43,cooking_oil:8,sauce:1
芹菜炒肉|畜肉菜|celery:48,pork:43,cooking_oil:8,sauce:1
木须肉|畜肉菜|pork:42,egg:25,wood_ear:20,cucumber:6,cooking_oil:7
回锅肉|畜肉菜|pork_belly:55,cabbage:28,cooking_oil:9,sauce:8
红烧肉|畜肉菜|pork_belly:72,broth:18,sauce:8,sugar:2
东坡肉|畜肉菜|pork_belly:73,broth:17,sauce:8,sugar:2
糖醋里脊|畜肉菜|pork:61,starch:13,cooking_oil:12,sauce:9,sugar:5
锅包肉|畜肉菜|pork:56,starch:18,cooking_oil:14,sauce:7,sugar:5
小酥肉|畜肉菜|pork:58,starch:19,egg:8,cooking_oil:15
红烧排骨|畜肉菜|pork_ribs:76,broth:13,cooking_oil:4,sauce:7
糖醋排骨|畜肉菜|pork_ribs:69,cooking_oil:6,sauce:15,sugar:10
土豆炖排骨|畜肉菜|pork_ribs:45,potato:42,broth:8,cooking_oil:5
蒜泥白肉|畜肉菜|pork_belly:60,cucumber:30,sauce:10
水煮肉片|畜肉菜|pork:42,napa:36,broth:12,cooking_oil:9,fermented_bean:1
农家小炒肉|畜肉菜|pork:45,pork_belly:18,pepper:27,cooking_oil:8,sauce:2
辣椒炒肉|畜肉菜|pork:50,pepper:40,cooking_oil:8,sauce:2
蒜苗回锅肉|畜肉菜|pork_belly:58,garlic_shoot:29,cooking_oil:8,sauce:5
莲藕炒肉片|畜肉菜|lotus:47,pork:43,cooking_oil:8,sauce:2
香菇炒肉片|畜肉菜|mushroom:48,pork:42,cooking_oil:8,sauce:2
番茄炖牛腩|畜肉菜|beef_brisket:48,tomato:40,broth:12
土豆炖牛肉|畜肉菜|beef:47,potato:43,broth:10
红烧牛肉|畜肉菜|beef_brisket:69,broth:19,cooking_oil:4,sauce:8
葱爆牛肉|畜肉菜|beef:61,onion:29,cooking_oil:8,sauce:2
青椒牛肉丝|畜肉菜|beef:52,pepper:38,cooking_oil:8,sauce:2
黑椒牛柳|畜肉菜|beef:62,onion:25,cooking_oil:9,sauce:4
芹菜牛肉|畜肉菜|beef:51,celery:39,cooking_oil:8,sauce:2
水煮牛肉|畜肉菜|beef:44,napa:35,broth:11,cooking_oil:9,fermented_bean:1
孜然牛肉|畜肉菜|beef:72,onion:17,cooking_oil:9,sauce:2
咖喱牛腩|畜肉菜|beef_brisket:51,potato:30,broth:12,cooking_oil:7
土豆炖羊肉|畜肉菜|lamb:49,potato:41,broth:10
葱爆羊肉|畜肉菜|lamb:66,onion:23,cooking_oil:9,sauce:2
孜然羊肉|畜肉菜|lamb:72,onion:17,cooking_oil:9,sauce:2
宫保鸡丁|禽肉菜|chicken_meat:56,pepper:20,peanuts:13,cooking_oil:8,sauce:3
辣子鸡|禽肉菜|chicken_meat:73,pepper:12,cooking_oil:12,sauce:3
黄焖鸡|禽肉菜|chicken_meat:57,potato:26,broth:10,cooking_oil:7
毛豆烧鸡|禽肉菜|chicken_meat:52,edamame:37,cooking_oil:7,sauce:4
土豆烧鸡|禽肉菜|chicken_meat:50,potato:40,cooking_oil:7,sauce:3
香菇炖鸡|禽肉菜|chicken_meat:53,mushroom:28,broth:19
白切鸡|禽肉菜|chicken_meat:94,broth:6
口水鸡|禽肉菜|chicken_meat:72,cucumber:13,cooking_oil:9,sauce:6
三杯鸡|禽肉菜|chicken_meat:74,cooking_oil:10,sauce:13,sugar:3
红烧鸡块|禽肉菜|chicken_meat:74,broth:12,cooking_oil:7,sauce:7
栗子烧鸡|禽肉菜|chicken_meat:59,chestnut:29,cooking_oil:7,sauce:5
可乐鸡翅|禽肉菜|chicken_leg:77,cola:15,cooking_oil:4,sauce:4
奥尔良烤鸡翅|禽肉菜|chicken_leg:92,sauce:8
蜜汁鸡翅|禽肉菜|chicken_leg:85,sauce:10,sugar:5
咖喱鸡块|禽肉菜|chicken_meat:53,potato:31,milk_coconut:10,cooking_oil:6
番茄鸡胸肉|禽肉菜|chicken_breast:58,tomato:34,cooking_oil:6,sauce:2
青椒鸡丁|禽肉菜|chicken_meat:54,pepper:37,cooking_oil:8,sauce:1
彩椒炒鸡胸|禽肉菜|chicken_breast:58,pepper:34,cooking_oil:7,sauce:1
鸡肉炒蘑菇|禽肉菜|chicken_meat:54,mushroom:37,cooking_oil:8,sauce:1
鸡肉炒西兰花|禽肉菜|chicken_breast:50,broccoli:41,cooking_oil:8,sauce:1
啤酒鸭|禽肉菜|duck:73,broth:17,cooking_oil:5,sauce:5
姜母鸭|禽肉菜|duck:79,broth:12,cooking_oil:5,sauce:4
盐水鸭|禽肉菜|duck:94,broth:6
烤鸭|禽肉菜|duck:93,sauce:7
子姜鸭|禽肉菜|duck:70,onion:18,cooking_oil:8,sauce:4
清蒸鲈鱼|鱼虾海鲜|fish:90,cooking_oil:4,sauce:6
清蒸鳕鱼|鱼虾海鲜|fish:91,cooking_oil:3,sauce:6
红烧鱼|鱼虾海鲜|fish:77,broth:9,cooking_oil:8,sauce:6
糖醋鱼|鱼虾海鲜|fish:65,starch:8,cooking_oil:9,sauce:12,sugar:6
酸菜鱼|鱼虾海鲜|fish:48,sauerkraut:25,broth:18,cooking_oil:8,sauce:1
水煮鱼|鱼虾海鲜|fish:49,bean_sprout:25,broth:12,cooking_oil:13,fermented_bean:1
番茄鱼片|鱼虾海鲜|fish:53,tomato:38,cooking_oil:6,sauce:3
剁椒鱼头|鱼虾海鲜|fish:67,pepper:22,cooking_oil:7,sauce:4
香煎带鱼|鱼虾海鲜|fish:84,cooking_oil:13,sauce:3
豆豉蒸鱼|鱼虾海鲜|fish:87,cooking_oil:5,sauce:8
椒盐虾|鱼虾海鲜|shrimp:82,starch:6,cooking_oil:10,sauce:2
白灼虾|鱼虾海鲜|shrimp:95,broth:5
油焖大虾|鱼虾海鲜|shrimp:80,cooking_oil:11,sauce:7,sugar:2
蒜蓉粉丝蒸虾|鱼虾海鲜|shrimp:54,vermicelli:32,cooking_oil:7,sauce:7
虾仁炒蛋|鱼虾海鲜|shrimp:45,egg:47,cooking_oil:8
虾仁滑蛋|鱼虾海鲜|shrimp:37,egg:55,cooking_oil:8
清炒虾仁|鱼虾海鲜|shrimp:83,pepper:10,cooking_oil:7
腰果虾仁|鱼虾海鲜|shrimp:55,nuts:19,pepper:18,cooking_oil:8
西兰花炒虾仁|鱼虾海鲜|shrimp:42,broccoli:50,cooking_oil:7,sauce:1
蟹肉豆腐|鱼虾海鲜|crab:43,tofu_silken:49,cooking_oil:5,sauce:3
葱姜炒蟹|鱼虾海鲜|crab:77,onion:12,cooking_oil:9,sauce:2
辣炒蛤蜊|鱼虾海鲜|clam:70,pepper:19,cooking_oil:8,sauce:3
蒜蓉蒸扇贝|鱼虾海鲜|scallop:65,vermicelli:23,cooking_oil:6,sauce:6
爆炒鱿鱼|鱼虾海鲜|squid:70,pepper:21,cooking_oil:8,sauce:1
韭菜炒鱿鱼|鱼虾海鲜|squid:60,leek:31,cooking_oil:8,sauce:1
蛋炒饭|米面主食|rice:74,egg:19,cooking_oil:7
扬州炒饭|米面主食|rice:65,egg:14,shrimp:8,peas:6,cooking_oil:7
腊肠炒饭|米面主食|rice:70,sausage:20,cooking_oil:8,sauce:2
虾仁炒饭|米面主食|rice:68,shrimp:16,egg:9,cooking_oil:7
酱油炒饭|米面主食|rice:84,cooking_oil:8,sauce:8
牛肉炒饭|米面主食|rice:66,beef:20,egg:7,cooking_oil:7
鸡肉炒饭|米面主食|rice:65,chicken_meat:21,egg:7,cooking_oil:7
盖浇饭|米面主食|rice:55,pork:19,greens:18,cooking_oil:6,sauce:2
卤肉饭|米面主食|rice:58,pork_belly:27,egg:8,sauce:7
黄焖鸡米饭|米面主食|rice:52,chicken_meat:31,potato:11,cooking_oil:6
皮蛋瘦肉粥|米面主食|broth:70,rice:16,pork:10,preserved_egg:4
白粥|米面主食|broth:72,rice:28
小米粥|米面主食|millet_congee:100
南瓜粥|米面主食|millet_congee:60,pumpkin:40
八宝粥|米面主食|broth:57,sticky_rice:21,red_bean:12,peanuts:5,sugar:5
红豆粥|米面主食|broth:60,rice:22,red_bean:18
牛肉面|米面主食|noodles:49,beef:24,greens:7,broth:20
兰州拉面|米面主食|noodles:52,beef:15,greens:5,broth:28
番茄鸡蛋面|米面主食|noodles:46,tomato:19,egg:14,broth:18,cooking_oil:3
炸酱面|米面主食|noodles:55,pork:19,cucumber:13,sauce:8,cooking_oil:5
担担面|米面主食|noodles:51,pork:19,greens:11,peanuts:6,cooking_oil:9,sauce:4
葱油拌面|米面主食|noodles:82,cooking_oil:11,sauce:7
热干面|米面主食|noodles:71,sesame:10,cooking_oil:8,sauce:11
阳春面|米面主食|noodles:53,greens:7,broth:37,cooking_oil:3
牛肉河粉|米面主食|rice_noodle:54,beef:23,bean_sprout:10,broth:13
炒河粉|米面主食|rice_noodle:62,beef:19,bean_sprout:10,cooking_oil:9
过桥米线|米面主食|rice_noodle:43,chicken_meat:16,egg:9,greens:8,broth:24
猪肉白菜饺子|米面主食|dough:43,pork:32,napa:25
韭菜鸡蛋饺子|米面主食|dough:43,leek:26,egg:27,cooking_oil:4
虾仁饺子|米面主食|dough:43,shrimp:35,pork:14,napa:8
小笼包|米面主食|dough:43,pork:35,broth:22
猪肉包子|米面主食|dough:58,pork:31,napa:11
菜包子|米面主食|dough:60,greens:34,cooking_oil:6
叉烧包|米面主食|dough:61,pork:31,sauce:8
烧卖|米面主食|wonton_wrapper:37,pork:30,shrimp:18,mushroom:15
鲜肉馄饨|米面主食|broth:51,wonton_wrapper:25,pork:20,greens:4
锅贴|米面主食|dough:42,pork:32,napa:19,cooking_oil:7
生煎包|米面主食|dough:51,pork:29,napa:12,cooking_oil:8
蛋饼|米面主食|wheat_flour:32,egg:28,broth:32,cooking_oil:8
肉夹馍|米面主食|dough:56,pork_belly:35,pepper:9
番茄蛋花汤|汤羹|broth:76,tomato:15,egg:9
紫菜蛋花汤|汤羹|broth:83,egg:15,seaweed_dry:2
冬瓜排骨汤|汤羹|broth:65,wintermelon:22,pork_ribs:13
海带排骨汤|汤羹|broth:64,seaweed:20,pork_ribs:16
玉米排骨汤|汤羹|broth:60,corn:22,pork_ribs:18
莲藕排骨汤|汤羹|broth:61,lotus:21,pork_ribs:18
香菇鸡汤|汤羹|broth:65,chicken_meat:20,mushroom:15
酸辣汤|汤羹|broth:59,tofu:16,egg:9,wood_ear:9,sauce:7
鱼头豆腐汤|汤羹|broth:59,fish:22,tofu:19
青菜豆腐汤|汤羹|broth:72,greens:15,tofu:13
菌菇汤|汤羹|broth:70,mushroom:30
萝卜牛腩汤|汤羹|broth:59,beef_brisket:21,radish:20
银耳红枣汤|汤羹|broth:73,tremella:15,red_date:7,sugar:5
绿豆汤|汤羹|broth:74,mung_bean:20,sugar:6
胡辣汤|汤羹|broth:54,tofu:12,pork:10,egg:9,starch:10,sauce:5
  `.trim().split('\n').map(line => line.trim()).filter(Boolean);

  // Regional dishes expand discovery beyond the initial everyday-food set.
  const regionalGroups = [
    ['鲁菜', `
海肠捞饭|米面主食|rice:50,sea_intestine:22,leek:12,pork:10,cooking_oil:4,sauce:2
临沂炒鸡|禽肉菜|chicken_meat:70,pepper:18,cooking_oil:7,sauce:5
九转大肠|畜肉菜|pork_intestine:76,broth:10,cooking_oil:7,sauce:5,sugar:2
葱烧海参|鱼虾海鲜|sea_cucumber:67,onion:18,broth:8,cooking_oil:5,sauce:2
糖醋鲤鱼|鱼虾海鲜|fish:65,starch:9,cooking_oil:11,sauce:10,sugar:5
四喜丸子|畜肉菜|pork:64,egg:10,napa:10,broth:10,cooking_oil:6
德州扒鸡|禽肉菜|chicken_meat:91,broth:6,sauce:3
济南把子肉|畜肉菜|pork_belly:72,broth:18,sauce:8,sugar:2
爆炒腰花|畜肉菜|pork_kidney:67,pepper:19,cooking_oil:10,sauce:4
赛螃蟹|鸡蛋豆制品|egg:75,fish:18,cooking_oil:5,sauce:2
芙蓉鸡片|禽肉菜|chicken_breast:60,egg:22,broth:12,cooking_oil:6
锅塌里脊|畜肉菜|pork:60,egg:23,starch:8,cooking_oil:9
糟熘鱼片|鱼虾海鲜|fish:75,broth:14,starch:4,cooking_oil:5,sauce:2
鲅鱼饺子|米面主食|dough:42,fish:38,pork:11,leek:9
胶东大包|米面主食|dough:57,pork:26,napa:17
烟台焖子|米面主食|sweet_potato:56,starch:18,cooking_oil:8,sesame:10,sauce:8
莱芜炒鸡|禽肉菜|chicken_meat:70,pepper:16,onion:7,cooking_oil:5,sauce:2
枣庄辣子鸡|禽肉菜|chicken_meat:70,pepper:18,cooking_oil:10,sauce:2
黄河鲤鱼汤|汤羹|broth:60,fish:29,greens:8,sauce:3
沂蒙全羊汤|汤羹|broth:63,lamb:32,greens:5
临沂糁|汤羹|broth:59,chicken_meat:19,egg:12,wheat_flour:10
沂蒙煎饼|米面主食|wheat_flour:48,broth:46,cooking_oil:6
肉末海参|鱼虾海鲜|sea_cucumber:58,pork:24,broth:11,cooking_oil:5,sauce:2
红烧大虾|鱼虾海鲜|shrimp:76,broth:11,cooking_oil:8,sauce:5
清蒸加吉鱼|鱼虾海鲜|fish:90,broth:5,cooking_oil:3,sauce:2
葱爆海肠|鱼虾海鲜|sea_intestine:68,onion:23,cooking_oil:7,sauce:2
博山酥锅|畜肉菜|pork:38,napa:25,seaweed:15,tofu:15,sauce:7
博山炸肉|畜肉菜|pork:63,starch:18,egg:7,cooking_oil:12
单县羊肉汤|汤羹|broth:61,lamb:34,greens:5
老厨白菜|家常蔬菜|napa:73,pork:14,vermicelli:7,cooking_oil:6
    `],
    ['川渝菜', `
毛血旺|畜肉菜|duck_blood:31,tripe:20,bean_sprout:18,luncheon_meat:12,broth:10,cooking_oil:7,fermented_bean:2
夫妻肺片|畜肉菜|beef:47,tripe:28,celery:10,cooking_oil:10,sauce:5
盐煎肉|畜肉菜|pork_belly:62,pepper:24,cooking_oil:8,fermented_bean:6
粉蒸肉|畜肉菜|pork_belly:52,rice:34,starch:7,sauce:7
甜烧白|畜肉菜|pork_belly:54,sticky_rice:30,sugar:11,sauce:5
咸烧白|畜肉菜|pork_belly:67,sauerkraut:25,sauce:8
麻辣兔丁|畜肉菜|rabbit:72,pepper:16,cooking_oil:10,sauce:2
泡椒凤爪|禽肉菜|chicken_leg:76,pepper:17,sauce:7
泡椒牛蛙|鱼虾海鲜|bullfrog:63,pepper:26,cooking_oil:8,sauce:3
藤椒鱼|鱼虾海鲜|fish:63,bean_sprout:18,broth:11,cooking_oil:8
酸辣肥肠|畜肉菜|pork_intestine:63,sauerkraut:21,cooking_oil:11,sauce:5
火爆腰花|畜肉菜|pork_kidney:65,pepper:25,cooking_oil:8,sauce:2
泡椒猪肝|畜肉菜|liver:66,pepper:24,cooking_oil:8,sauce:2
辣子兔|畜肉菜|rabbit:72,pepper:14,cooking_oil:12,sauce:2
重庆小面|米面主食|noodles:70,greens:10,broth:8,cooking_oil:8,sauce:4
红油抄手|米面主食|wonton_wrapper:37,pork:25,broth:21,cooking_oil:10,sauce:7
四川凉粉|米面主食|starch:25,broth:58,cooking_oil:9,sauce:8
钵钵鸡|禽肉菜|chicken_meat:53,greens:18,lotus:13,broth:8,cooking_oil:8
冷吃牛肉|畜肉菜|beef:72,pepper:13,cooking_oil:12,sauce:3
灯影牛肉|畜肉菜|beef:75,cooking_oil:12,sugar:5,sauce:8
豆花鱼|鱼虾海鲜|fish:45,tofu_silken:36,broth:11,cooking_oil:8
酸菜豆花|鸡蛋豆制品|tofu_silken:62,sauerkraut:24,broth:9,cooking_oil:5
川北凉粉|米面主食|starch:24,broth:58,cooking_oil:10,sauce:8
麻辣香锅|畜肉菜|pork:29,shrimp:17,lotus:17,cauliflower:17,cooking_oil:15,sauce:5
冒菜|畜肉菜|pork:23,tofu:20,napa:21,bean_sprout:16,broth:11,cooking_oil:9
干锅牛蛙|鱼虾海鲜|bullfrog:64,pepper:20,cooking_oil:12,sauce:4
干锅排骨|畜肉菜|pork_ribs:66,pepper:20,cooking_oil:11,sauce:3
干锅兔|畜肉菜|rabbit:65,pepper:19,cooking_oil:12,sauce:4
青椒鸡杂|禽肉菜|chicken_gizzard:60,pepper:30,cooking_oil:8,sauce:2
钟水饺|米面主食|dough:45,pork:30,cooking_oil:10,sauce:10,sugar:5
    `],
    ['粤菜', `
广式烧鹅|禽肉菜|goose:88,sauce:10,sugar:2
蜜汁叉烧|畜肉菜|pork:76,sauce:14,sugar:10
脆皮烧肉|畜肉菜|pork_belly:91,sauce:9
豉油鸡|禽肉菜|chicken_meat:83,broth:8,sauce:9
盐焗鸡|禽肉菜|chicken_meat:94,sauce:6
清蒸石斑鱼|鱼虾海鲜|fish:88,broth:6,cooking_oil:3,sauce:3
咕噜肉|畜肉菜|pork:57,pepper:17,starch:8,cooking_oil:10,sauce:8
菠萝咕噜肉|畜肉菜|pork:52,pineapple:13,pepper:16,starch:7,cooking_oil:8,sauce:4
菠萝炒饭|米面主食|rice:67,pineapple:15,egg:10,cooking_oil:8
红烧乳鸽|禽肉菜|pigeon:83,broth:9,cooking_oil:4,sauce:4
白灼菜心|家常蔬菜|greens:95,sauce:5
豉汁蒸排骨|畜肉菜|pork_ribs:82,broth:10,sauce:8
豉汁蒸凤爪|禽肉菜|chicken_feet:78,broth:10,sauce:12
水晶虾饺|米面主食|wonton_wrapper:39,shrimp:47,pork:10,sauce:4
鲜虾肠粉|米面主食|rice_noodle:62,shrimp:28,sauce:10
牛肉肠粉|米面主食|rice_noodle:62,beef:28,sauce:10
广式云吞面|米面主食|noodles:46,wonton_wrapper:17,pork:12,shrimp:7,broth:18
及第粥|米面主食|broth:66,rice:16,pork:10,liver:5,egg:3
艇仔粥|米面主食|broth:66,rice:17,fish:7,pork:6,peanuts:4
双皮奶|鸡蛋豆制品|milk:63,egg:24,sugar:13
杨枝甘露|汤羹|milk_coconut:24,milk:31,banana:24,broth:12,sugar:9
沙茶牛肉|畜肉菜|beef:64,onion:22,cooking_oil:8,sauce:6
广式腊味煲仔饭|米面主食|rice:62,sausage:23,chicken_meat:9,cooking_oil:4,sauce:2
酿苦瓜|畜肉菜|bitter:49,pork:42,cooking_oil:5,sauce:4
客家酿豆腐|鸡蛋豆制品|tofu:54,pork:36,cooking_oil:6,sauce:4
上汤娃娃菜|家常蔬菜|napa:70,broth:23,ham:5,sauce:2
生炒排骨|畜肉菜|pork_ribs:74,pepper:12,cooking_oil:9,sauce:5
啫啫鸡煲|禽肉菜|chicken_meat:73,onion:14,cooking_oil:8,sauce:5
白灼牛肉|畜肉菜|beef:84,broth:11,sauce:5
豉汁蒸鲮鱼|鱼虾海鲜|fish:83,broth:10,sauce:7
    `],
    ['湘菜', `
小炒黄牛肉|畜肉菜|beef:62,pepper:28,cooking_oil:8,sauce:2
永州血鸭|禽肉菜|duck:64,duck_blood:17,pepper:10,cooking_oil:7,sauce:2
东安子鸡|禽肉菜|chicken_meat:72,pepper:13,broth:8,cooking_oil:5,sauce:2
长沙口味虾|鱼虾海鲜|shrimp:76,pepper:10,broth:5,cooking_oil:8,sauce:1
湘味口味蟹|鱼虾海鲜|crab:75,pepper:12,cooking_oil:9,sauce:4
干锅手撕包菜|家常蔬菜|cabbage:73,pork_belly:14,cooking_oil:10,sauce:3
湘西外婆菜|家常蔬菜|sauerkraut:59,pork:24,pepper:8,cooking_oil:7,sauce:2
腊味合蒸|畜肉菜|sausage:48,pork_belly:34,broth:12,sauce:6
毛氏红烧肉|畜肉菜|pork_belly:72,broth:13,sauce:10,sugar:5
剁椒蒸鸡|禽肉菜|chicken_meat:78,pepper:17,sauce:5
酸豆角炒肉末|畜肉菜|sour_longbean:51,pork:38,cooking_oil:8,sauce:3
香干炒肉|畜肉菜|tofu_dried:49,pork:41,cooking_oil:8,sauce:2
茶油炒土鸡|禽肉菜|chicken_meat:75,pepper:14,cooking_oil:9,sauce:2
擂辣椒皮蛋|鸡蛋豆制品|pepper:54,preserved_egg:36,cooking_oil:5,sauce:5
蒜苗炒腊肉|畜肉菜|pork_belly:49,garlic_shoot:39,cooking_oil:9,sauce:3
泡椒炒鸡杂|禽肉菜|chicken_gizzard:62,pepper:27,cooking_oil:8,sauce:3
长沙臭豆腐|鸡蛋豆制品|tofu:72,cooking_oil:20,sauce:8
郴州鱼粉|米面主食|rice_noodle:50,fish:25,broth:20,cooking_oil:5
衡阳鱼粉|米面主食|rice_noodle:48,fish:26,broth:22,cooking_oil:4
邵阳猪血丸子|畜肉菜|pig_blood:40,pork:32,tofu:18,cooking_oil:6,sauce:4
长沙肉丝粉|米面主食|rice_noodle:53,pork:22,broth:21,cooking_oil:4
衡东土菜鸡|禽肉菜|chicken_meat:73,pepper:16,cooking_oil:9,sauce:2
湘潭水煮活鱼|鱼虾海鲜|fish:60,broth:17,bean_sprout:12,cooking_oil:9,sauce:2
柴火香干|鸡蛋豆制品|tofu_dried:72,pepper:17,cooking_oil:9,sauce:2
酸辣肚丝|畜肉菜|tripe:65,pepper:20,broth:7,cooking_oil:6,sauce:2
干锅黄牛肉|畜肉菜|beef:67,pepper:19,cooking_oil:11,sauce:3
湘西酸萝卜炒腊肉|畜肉菜|pork_belly:48,pickled_radish:39,cooking_oil:9,sauce:4
益阳麻辣肉|畜肉菜|pork:76,pepper:12,cooking_oil:9,sauce:3
长沙酱板鸭|禽肉菜|duck:87,sauce:10,sugar:3
湖南米粉汤|米面主食|rice_noodle:58,pork:16,greens:7,broth:19
    `],
    ['江浙菜', `
西湖醋鱼|鱼虾海鲜|fish:82,broth:8,sauce:7,sugar:3
叫花鸡|禽肉菜|chicken_meat:92,sauce:8
龙井虾仁|鱼虾海鲜|shrimp:82,broth:10,cooking_oil:5,sauce:3
宋嫂鱼羹|汤羹|broth:55,fish:25,egg:10,starch:6,sauce:4
杭州酱鸭|禽肉菜|duck:85,broth:7,sauce:8
绍兴醉鸡|禽肉菜|chicken_meat:89,broth:7,sauce:4
清蒸鲥鱼|鱼虾海鲜|fish:91,broth:6,sauce:3
油爆河虾|鱼虾海鲜|shrimp:78,cooking_oil:12,sauce:7,sugar:3
松鼠桂鱼|鱼虾海鲜|fish:62,starch:12,cooking_oil:12,sauce:9,sugar:5
清炖狮子头|畜肉菜|pork:58,napa:18,broth:17,egg:7
红烧狮子头|畜肉菜|pork:64,broth:17,egg:9,cooking_oil:6,sauce:4
金陵烤鸭|禽肉菜|duck:91,sauce:9
鸭血粉丝汤|米面主食|broth:45,vermicelli:24,duck_blood:22,greens:6,sauce:3
大煮干丝|鸡蛋豆制品|tofu_skin:56,ham:10,broth:25,shrimp:6,sauce:3
文思豆腐|鸡蛋豆制品|tofu_silken:60,broth:29,mushroom:8,sauce:3
蟹粉狮子头|畜肉菜|pork:54,crab:21,napa:14,broth:11
红烧河鳗|鱼虾海鲜|eel:75,broth:14,cooking_oil:5,sauce:6
响油鳝丝|鱼虾海鲜|eel:71,bamboo:17,cooking_oil:9,sauce:3
无锡酱排骨|畜肉菜|pork_ribs:74,broth:12,sauce:9,sugar:5
梅干菜扣肉|畜肉菜|pork_belly:68,preserved_mustard:25,sauce:7
宁波汤圆|米面主食|sticky_rice:59,sesame:22,sugar:14,broth:5
扬州烫干丝|鸡蛋豆制品|tofu_skin:64,broth:28,sauce:8
砂锅鱼头|鱼虾海鲜|fish:60,broth:28,tofu:12
笋干烧肉|畜肉菜|pork_belly:56,bamboo:33,cooking_oil:5,sauce:6
桂花糖藕|家常蔬菜|lotus:66,sticky_rice:20,sugar:14
上海熏鱼|鱼虾海鲜|fish:75,cooking_oil:12,sauce:9,sugar:4
葱烤鲫鱼|鱼虾海鲜|fish:75,onion:12,cooking_oil:8,sauce:5
荠菜馄饨|米面主食|wonton_wrapper:38,pork:27,greens:22,broth:13
上海本帮红烧肉|畜肉菜|pork_belly:73,broth:15,sauce:9,sugar:3
酒酿圆子|米面主食|broth:52,sticky_rice:32,sugar:11,red_bean:5
    `],
    ['东北菜', `
小鸡炖蘑菇|禽肉菜|chicken_meat:58,mushroom:25,broth:17
猪肉炖粉条|畜肉菜|pork_belly:40,vermicelli:34,napa:16,broth:10
东北大拉皮|米面主食|vermicelli:51,cucumber:26,pork:10,cooking_oil:8,sauce:5
得莫利炖鱼|鱼虾海鲜|fish:53,tofu:20,vermicelli:16,broth:11
酸菜白肉锅|畜肉菜|sauerkraut:39,pork_belly:35,broth:26
酸菜炖排骨|畜肉菜|sauerkraut:40,pork_ribs:45,broth:15
铁锅炖大鹅|禽肉菜|goose:64,potato:19,broth:12,sauce:5
铁锅炖鱼|鱼虾海鲜|fish:64,tofu:15,broth:16,sauce:5
东北乱炖|畜肉菜|pork:31,potato:28,beans:20,tomato:13,cooking_oil:8
尖椒干豆腐|鸡蛋豆制品|tofu_dried:60,pepper:31,cooking_oil:7,sauce:2
熘肉段|畜肉菜|pork:60,starch:16,pepper:10,cooking_oil:11,sauce:3
溜肥肠|畜肉菜|pork_intestine:62,pepper:24,cooking_oil:10,sauce:4
炸茄盒|家常蔬菜|eggplant:40,pork:25,wheat_flour:20,cooking_oil:15
鲶鱼炖茄子|鱼虾海鲜|fish:51,eggplant:34,broth:15
韭菜盒子|米面主食|dough:56,leek:21,egg:16,cooking_oil:7
东北酸菜饺子|米面主食|dough:44,pork:29,sauerkraut:27
朝鲜冷面|米面主食|noodles:55,beef:13,cucumber:12,egg:10,broth:10
延吉拌饭|米面主食|rice:58,beef:16,greens:13,egg:9,sauce:4
锅包牛肉|畜肉菜|beef:55,starch:18,cooking_oil:13,sauce:9,sugar:5
东北杀猪菜|畜肉菜|pork_belly:39,sauerkraut:36,duck_blood:13,broth:12
猪肉炖豆角|畜肉菜|pork:43,beans:42,broth:10,cooking_oil:5
豆角焖面|米面主食|noodles:52,beans:25,pork:13,broth:5,cooking_oil:5
东北大酱汤|汤羹|broth:52,tofu:20,pork:12,greens:11,sauce:5
东北拌菜|家常蔬菜|cucumber:36,napa:25,bean_sprout:24,cooking_oil:7,sauce:8
炒合菜|家常蔬菜|bean_sprout:40,leek:23,egg:20,vermicelli:10,cooking_oil:7
酱骨头|畜肉菜|pork_ribs:82,broth:12,sauce:6
扒肉条|畜肉菜|pork:73,broth:17,cooking_oil:5,sauce:5
沈阳鸡架|禽肉菜|chicken_meat:86,pepper:6,cooking_oil:5,sauce:3
雪衣豆沙|米面主食|egg:35,red_bean:30,wheat_flour:15,cooking_oil:12,sugar:8
东北酸菜炖粉条|米面主食|sauerkraut:45,vermicelli:37,pork:10,broth:8
    `],
    ['闽台菜', `
佛跳墙|汤羹|broth:35,sea_cucumber:18,abalone:12,scallop:12,chicken_meat:13,ham:10
荔枝肉|畜肉菜|pork:59,starch:15,cooking_oil:12,sauce:9,sugar:5
沙县拌面|米面主食|noodles:72,peanuts:12,cooking_oil:8,sauce:8
沙县扁肉|米面主食|broth:44,wonton_wrapper:28,pork:25,greens:3
福州鱼丸汤|汤羹|broth:62,fish:23,pork:11,sauce:4
海蛎煎|鱼虾海鲜|oyster:44,egg:24,starch:20,cooking_oil:12
闽南卤面|米面主食|noodles:52,pork:16,shrimp:11,napa:9,broth:12
泉州面线糊|米面主食|noodles:31,broth:50,pork:11,shrimp:8
莆田卤面|米面主食|noodles:51,pork:15,clam:13,napa:9,broth:12
莆田炝肉|畜肉菜|pork:52,broth:30,starch:10,greens:8
红糟鱼|鱼虾海鲜|fish:74,broth:12,cooking_oil:7,sauce:7
福州醉排骨|畜肉菜|pork_ribs:68,starch:10,cooking_oil:12,sauce:10
香菇肉燥饭|米面主食|rice:58,pork:23,mushroom:12,cooking_oil:5,sauce:2
蚵仔面线|米面主食|noodles:43,oyster:20,broth:29,starch:5,sauce:3
台湾牛肉面|米面主食|noodles:46,beef_brisket:29,broth:22,sauce:3
大肠包小肠|米面主食|sticky_rice:41,sausage:40,cucumber:11,sauce:8
闽南润饼|米面主食|dough:42,pork:21,napa:17,carrot:12,peanuts:8
台湾肉圆|米面主食|starch:38,pork:29,bamboo:18,broth:10,sauce:5
花生汤|汤羹|broth:66,peanuts:21,sugar:13
厦门五香卷|畜肉菜|tofu_skin:28,pork:46,onion:12,starch:7,cooking_oil:7
同安封肉|畜肉菜|pork_belly:73,broth:16,sauce:9,sugar:2
土笋冻|鱼虾海鲜|sea_worm:31,broth:62,sauce:7
沙茶面|米面主食|noodles:49,shrimp:12,pork:12,broth:19,sauce:8
泉州炸五香|畜肉菜|pork:52,tofu_skin:24,starch:10,cooking_oil:12,sauce:2
闽南海鲜米粉|米面主食|rice_noodle:50,shrimp:19,clam:13,broth:18
泉州炸醋肉|畜肉菜|pork:63,starch:16,cooking_oil:14,sauce:7
姜葱花蛤|鱼虾海鲜|clam:72,onion:16,cooking_oil:8,sauce:4
红糟鸡|禽肉菜|chicken_meat:75,broth:14,cooking_oil:5,sauce:6
福建炒饭|米面主食|rice:65,egg:13,shrimp:9,peas:7,cooking_oil:6
燕皮馄饨|米面主食|broth:42,wonton_wrapper:26,pork:26,greens:6
    `],
    ['鄂豫皖', `
清蒸武昌鱼|鱼虾海鲜|fish:90,broth:6,sauce:4
黄陂三鲜|鱼虾海鲜|fish:37,pork:24,egg:16,broth:18,sauce:5
沔阳三蒸|畜肉菜|pork:30,fish:29,pumpkin:24,rice:12,sauce:5
珍珠圆子|畜肉菜|pork:54,sticky_rice:37,egg:9
荆州鱼糕|鱼虾海鲜|fish:60,egg:25,pork:10,starch:5
潜江油焖大虾|鱼虾海鲜|shrimp:71,pepper:12,broth:5,cooking_oil:10,sauce:2
襄阳牛肉面|米面主食|noodles:51,beef:25,broth:18,cooking_oil:4,sauce:2
襄阳牛杂面|米面主食|noodles:49,tripe:24,broth:20,cooking_oil:5,sauce:2
河南烩面|米面主食|noodles:53,lamb:22,broth:20,greens:5
开封灌汤包|米面主食|dough:43,pork:35,broth:22
洛阳牡丹燕菜|汤羹|broth:52,radish:20,egg:12,pork:10,starch:6
道口烧鸡|禽肉菜|chicken_meat:89,broth:6,sauce:5
豫式红烧鲤鱼|鱼虾海鲜|fish:77,broth:12,cooking_oil:6,sauce:5
扁粉菜|米面主食|vermicelli:39,napa:22,tofu:16,duck_blood:10,broth:13
焦作驴肉汤|汤羹|broth:60,donkey:35,greens:5
淮南牛肉汤|汤羹|broth:53,beef:24,vermicelli:18,greens:5
徽州毛豆腐|鸡蛋豆制品|tofu:80,cooking_oil:10,sauce:10
臭鳜鱼|鱼虾海鲜|fish:79,pepper:8,broth:6,cooking_oil:5,sauce:2
徽州圆子|畜肉菜|pork:58,sticky_rice:23,egg:13,cooking_oil:6
徽州一品锅|畜肉菜|pork:27,chicken_meat:21,shrimp:11,bamboo:16,napa:15,broth:10
李鸿章杂烩|畜肉菜|chicken_meat:25,pork:19,sea_cucumber:12,shrimp:12,mushroom:12,broth:20
黄山炖鸽|禽肉菜|pigeon:45,broth:44,mushroom:11
符离集烧鸡|禽肉菜|chicken_meat:90,broth:7,sauce:3
虾籽面|米面主食|noodles:64,shrimp:10,broth:21,sauce:5
淮北撒汤|汤羹|broth:59,chicken_meat:17,egg:14,wheat_flour:10
安徽板面|米面主食|noodles:56,beef:17,broth:20,cooking_oil:5,sauce:2
肥西老母鸡汤|汤羹|broth:65,chicken_meat:28,mushroom:7
阜阳格拉条|米面主食|noodles:68,bean_sprout:11,peanuts:8,cooking_oil:6,sauce:7
信阳焖罐肉|畜肉菜|pork_belly:60,radish:21,broth:14,sauce:5
三河米饺|米面主食|rice_noodle:48,pork:31,tofu_dried:13,cooking_oil:8
    `],
    ['西北菜', `
羊肉泡馍|米面主食|dough:43,lamb:23,broth:29,vermicelli:5
水盆羊肉|汤羹|broth:54,lamb:34,dough:12
葫芦头泡馍|米面主食|dough:45,pork_intestine:22,broth:28,vermicelli:5
岐山臊子面|米面主食|noodles:54,pork:16,carrot:9,tofu:8,broth:13
油泼面|米面主食|noodles:76,greens:7,cooking_oil:13,sauce:4
biangbiang面|米面主食|noodles:74,pepper:8,cooking_oil:13,sauce:5
陕西凉皮|米面主食|rice_noodle:70,cucumber:16,cooking_oil:8,sauce:6
宝鸡擀面皮|米面主食|rice_noodle:75,bean_sprout:12,cooking_oil:8,sauce:5
烤羊肉串|畜肉菜|lamb:90,cooking_oil:5,sauce:5
烤羊排|畜肉菜|lamb:92,sauce:8
手抓羊肉|畜肉菜|lamb:96,sauce:4
兰州牛肉炒面|米面主食|noodles:57,beef:24,pepper:10,cooking_oil:9
牛肉面片|米面主食|noodles:53,beef:20,broth:22,greens:5
炒拉条|米面主食|noodles:61,beef:20,pepper:10,cooking_oil:9
新疆大盘鸡|禽肉菜|chicken_meat:49,potato:28,pepper:12,cooking_oil:9,sauce:2
新疆拌面|米面主食|noodles:57,lamb:20,pepper:13,cooking_oil:8,sauce:2
馕炒肉|畜肉菜|dough:41,lamb:43,pepper:8,cooking_oil:8
薄皮包子|米面主食|dough:48,lamb:37,onion:15
烤包子|米面主食|dough:50,lamb:34,onion:12,cooking_oil:4
羊肉抓饭|米面主食|rice:56,lamb:28,carrot:11,cooking_oil:5
馕坑肉|畜肉菜|lamb:91,sauce:9
胡辣羊蹄|畜肉菜|lamb_trotter:72,pepper:13,broth:10,sauce:5
甘肃酿皮|米面主食|rice_noodle:69,cucumber:15,cooking_oil:9,sauce:7
甜醅子|米面主食|barley:57,broth:27,sugar:16
牛奶鸡蛋醪糟|汤羹|milk:55,egg:18,sticky_rice:14,broth:8,sugar:5
宁夏烩羊杂|汤羹|broth:46,tripe:26,lamb:16,vermicelli:8,sauce:4
固原生汆面|米面主食|noodles:52,lamb:22,broth:21,greens:5
羊肉搓面|米面主食|noodles:52,lamb:22,broth:21,greens:5
洋芋擦擦|米面主食|potato:76,wheat_flour:14,cooking_oil:8,sauce:2
洋芋搅团|米面主食|potato:66,wheat_flour:17,broth:14,sauce:3
    `],
    ['云贵菜', `
汽锅鸡|禽肉菜|chicken_meat:51,broth:43,mushroom:6
傣味菠萝饭|米面主食|rice:62,pineapple:23,peanuts:10,sugar:5
傣味烤鱼|鱼虾海鲜|fish:84,pepper:9,cooking_oil:4,sauce:3
包浆豆腐|鸡蛋豆制品|tofu_silken:82,cooking_oil:11,sauce:7
宣威火腿炒饭|米面主食|rice:70,ham:16,egg:8,cooking_oil:6
昭通小肉串|畜肉菜|pork:87,cooking_oil:8,sauce:5
宜良烤鸭|禽肉菜|duck:91,sauce:9
曲靖蒸饵丝|米面主食|rice_noodle:70,pork:16,bean_sprout:8,sauce:6
大理砂锅鱼|鱼虾海鲜|fish:57,tofu:18,broth:18,mushroom:7
野生菌火锅|汤羹|mushroom:45,broth:34,chicken_meat:14,tofu:7
红三剁|畜肉菜|pork:43,tomato:28,pepper:20,cooking_oil:7,sauce:2
黑三剁|畜肉菜|pork:48,pepper:26,sauerkraut:17,cooking_oil:7,sauce:2
丽江腊排骨|畜肉菜|pork_ribs:66,potato:20,broth:14
贵州酸汤鱼|鱼虾海鲜|fish:64,tomato:15,broth:15,pepper:6
贵阳丝娃娃|米面主食|dough:39,carrot:16,cucumber:15,bean_sprout:15,peanuts:8,sauce:7
贵阳肠旺面|米面主食|noodles:48,pork_intestine:19,duck_blood:16,broth:12,cooking_oil:5
贵州辣子鸡|禽肉菜|chicken_meat:73,pepper:15,cooking_oil:10,sauce:2
花溪牛肉粉|米面主食|rice_noodle:53,beef:24,broth:20,sauce:3
遵义羊肉粉|米面主食|rice_noodle:51,lamb:25,broth:20,sauce:4
凯里红酸汤|汤羹|broth:65,tomato:21,pepper:10,sauce:4
贵州豆米火锅|鸡蛋豆制品|red_bean:35,pork:21,tofu:19,broth:18,cooking_oil:7
贵州烙锅|畜肉菜|pork:30,potato:24,tofu:23,cabbage:13,cooking_oil:10
黔味糟辣鱼|鱼虾海鲜|fish:74,pepper:15,cooking_oil:7,sauce:4
折耳根炒腊肉|畜肉菜|pork_belly:47,fishmint:43,cooking_oil:7,sauce:3
青岩猪脚|畜肉菜|pig_trotter:82,broth:12,sauce:6
夺夺粉|米面主食|vermicelli:45,pork:20,tofu:15,napa:10,broth:10
遵义豆花面|米面主食|noodles:53,tofu_silken:27,broth:15,cooking_oil:5
云南烧饵块|米面主食|rice_cake:70,egg:15,peanuts:8,sauce:7
大理乳扇|鸡蛋豆制品|cheese:81,cooking_oil:8,sugar:11
云南米豆腐|米面主食|rice_noodle:67,broth:18,peanuts:8,sauce:7
    `]
  ];
  const regionalRows = regionalGroups.flatMap(function ([cuisine, data]) {
    const lines = data.trim().split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length !== 30) throw new Error(cuisine + '应有 30 道菜，实际 ' + lines.length);
    return lines.map(line => line + '|' + cuisine);
  });
  const rows = baseRows.concat(regionalRows);

  const dishes = rows.map(function (row, index) {
    const [name, category, recipe, cuisine = '常见'] = row.split('|');
    const ingredients = recipe.split(',').map(function (part) {
      const [key, amount] = part.split(':');
      if (!food[key] || !Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error('菜肴配方有误：' + name + '/' + key);
      return { key: key, name: food[key].name, grams: Number(amount) };
    });
    const total = ingredients.reduce((sum, part) => sum + part.grams, 0);
    if (total !== 100) throw new Error('菜肴配方不是 100 克：' + name + ' (' + total + ')');
    const per100 = {};
    ['kcal', 'protein', 'carbs', 'fat'].forEach(function (key) {
      const value = ingredients.reduce((sum, part) => sum + food[part.key][key] * part.grams / 100, 0);
      per100[key] = Math.round(value * (key === 'kcal' ? 1 : 10)) / (key === 'kcal' ? 1 : 10);
    });
    return { id: 'catalog-' + (index + 1), name: name, category: category, cuisine: cuisine, defaultGrams: category === '汤羹' ? 250 : category === '米面主食' ? 200 : 180, ingredients: ingredients, per100: per100 };
  });
  if (dishes.length !== 500 || new Set(dishes.map(x => x.name)).size !== dishes.length) throw new Error('菜肴目录必须是 500 道不重复菜');

  const aliases = { '番茄炒鸡蛋': '西红柿炒鸡蛋', '番茄炒蛋': '西红柿炒鸡蛋', '西红柿炒蛋': '西红柿炒鸡蛋', '毛豆焖鸡': '毛豆烧鸡', '清蒸鱼': '清蒸鲈鱼', '小青菜': '清炒小白菜', '海肠饭': '海肠捞饭', '沂蒙炒鸡': '临沂炒鸡', '冒血旺': '毛血旺' };
  function find(query) {
    const q = String(query || '').trim().replace(/\s+/g, '').toLowerCase();
    if (!q) return dishes;
    const aliasName = aliases[q];
    return dishes.filter(x => x.name.toLowerCase().includes(q) || x.cuisine === q || (aliasName && x.name === aliasName));
  }
  function makeItem(dish, grams) {
    const vegetable = key => /^(?:cabbage|napa|celery|beans|longbean|sour_longbean|lotus|cauliflower|bamboo|squash|pumpkin|wintermelon|radish|pickled_radish|sauerkraut|preserved_mustard|bitter|wood_ear|bean_sprout|leek|garlic_shoot|seaweed|tomato|cucumber|pepper|mushroom|greens|broccoli|eggplant|carrot|onion|fishmint)$/.test(key);
    return { kind: 'catalog', catalogId: dish.id, name: dish.name, grams: Number(grams) > 0 ? Number(grams) : dish.defaultGrams, baseGrams: 100,
      nutrition: Object.assign({}, dish.per100), category: 'mixed',
      ingredients: dish.ingredients.map(x => ({ foodId: x.key, name: x.name, grams: x.grams,
        category: food[x.key].category || (vegetable(x.key) ? 'vegetable' : 'mixed'),
        kcal: food[x.key].kcal, protein: food[x.key].protein, carbs: food[x.key].carbs, fat: food[x.key].fat })) };
  }
  function parseText(text) {
    return String(text || '').split(/[，,、；;＋+\n]+/).map(x => x.trim()).filter(Boolean).flatMap(function (segment) {
      const match = dishes.filter(dish => segment.includes(dish.name)).sort((a, b) => b.name.length - a.name.length)[0] ||
        dishes.find(dish => Object.keys(aliases).some(alias => segment.includes(alias) && aliases[alias] === dish.name));
      if (!match) return core.parseMealText(segment);
      const amount = segment.match(/(\d+(?:\.\d+)?)\s*(?:克|g)/i);
      return [makeItem(match, amount ? Number(amount[1]) : match.defaultGrams)];
    });
  }
  return { dishes: dishes, find: find, makeItem: makeItem, parseText: parseText };
});
