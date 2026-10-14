const core = require('../../utils/core.js');
const KEY = 'fitday-v1';
const uid = prefix => prefix + '-' + Date.now();
const numeric = value => Number(value) || 0;

Page({
  data: {
    tab: 'home', state: core.createState(), today: {}, nextPlan: {}, selectedPlan: 0,
    workoutDraft: [], editingPlan: false, workoutDate: core.dateKey(), mealDate: core.dateKey(), maxRecordDate: core.dateKey(), mealType: '午餐', mealText: '', mealItems: [], mealPhoto: '',
    mealEstimate: null, advice: null, reference: null, entries: [], foods: core.DISH_LIST.map(x => ({ kind: 'dish', id: x.id, name: x.name })).concat(core.FOOD_LIST.map(x => ({ kind: 'food', id: x.id, name: x.name }))),
    foodIndex: 0, foodGrams: '', mealTypes: ['早餐','午餐','晚餐','加餐','饮料'],
    activityIndex: 1, formulaIndex: 0,
    formulaLabels: ['暂不选择','男性公式','女性公式'],
    activityLabels: ['较低 · 久坐为主','中等 · 每周训练约 4 次','较高 · 经常活动']
  },
  onLoad() {
    let state;
    try { state = core.normalizeState(wx.getStorageSync(KEY)); }
    catch (_) { state = core.createState(); }
    this.state = state;
    try { if (typeof wx.removeStorageSync === 'function') wx.removeStorageSync('fitday-direct-api-v1'); } catch (_) {}
    this.selectedPlan = core.nextPlanIndex(state);
    this.workoutDate = core.dateKey();
    this.mealDate = core.dateKey();
    this.mealDraft = { type: '午餐', text: '', items: [], photo: '' };
    this.initWorkout(); this.refresh();
  },
  save() {
    try { wx.setStorageSync(KEY, this.state); return true; }
    catch (_) { wx.showToast({ title: '本地空间不足', icon: 'none' }); return false; }
  },
  notice(title) { wx.showToast({ title, icon: 'none' }); },
  initWorkout() {
    const plan = this.state.plan[this.selectedPlan];
    const previous = core.lastWorkoutForPlan(this.state, plan.id);
    this.workoutDraft = plan.exercises.map((exercise, ei) => ({
      id: exercise.id, name: exercise.name,
      sets: Array.from({ length: Math.max(1, numeric(exercise.sets)) }, (_, si) => {
        const old = previous && previous.exercises && previous.exercises[ei] && previous.exercises[ei].sets[si];
        return { index: si, reps: old ? old.reps : exercise.reps, weight: old ? old.weight : '', done: true };
      })
    }));
  },
  refresh() {
    const today = core.getDaySummary(this.state, core.dateKey());
    const selectedDay = core.getDaySummary(this.state, this.mealDate);
    const estimate = core.calculateMeal(this.mealDraft.items);
    const prospective = Object.assign({}, selectedDay, { meals: selectedDay.meals.concat([{ items: this.mealDraft.items }]), range: { min: selectedDay.range.min + estimate.range.min, max: selectedDay.range.max + estimate.range.max }, unknownCount: selectedDay.unknownCount + estimate.unknownCount });
    const entries = this.state.workouts.map(x => Object.assign({ kind: 'workout' }, x)).concat(this.state.meals.map(x => Object.assign({ kind: 'meal' }, x))).sort(core.newestRecordFirst).map(x => Object.assign({}, x, {
      label: x.kind === 'meal' ? x.type + ' · ' + (x.text || x.items.map(i => i.name).join('、')) : x.planName + ' · ' + x.focus,
      detail: x.kind === 'meal' ? (core.calculateMeal(x.items).estimatedCount ? core.calculateMeal(x.items).range.min + '–' + core.calculateMeal(x.items).range.max + ' 千卡' + (core.calculateMeal(x.items).unknownCount ? ' · 部分' : '') : '待估算') : x.exercises.length + ' 个动作'
    }));
    const activities = ['low','moderate','high'];
    const formulas = ['', 'male','female'];
    this.setData({
      state: this.state, today, emptyToday: !today.meals.length && !today.workouts.length, nextPlan: this.state.plan[core.nextPlanIndex(this.state)], selectedPlan: this.selectedPlan, currentPlan: this.state.plan[this.selectedPlan],
      workoutDraft: this.workoutDraft, workoutDate: this.workoutDate, mealDate: this.mealDate, maxRecordDate: core.dateKey(), mealType: this.mealDraft.type, mealText: this.mealDraft.text,
      mealItems: this.mealDraft.items.map((item, index) => {
        const line = core.calculateMeal([item]).lines[0];
        return Object.assign({ listIndex: index, detail: line.estimated ? line.kcal + ' 千卡估算' + (line.source === 'ai' ? ' · 历史估算' : line.source === 'inferred' ? ' · 按菜名推断' : '') : '待估算', recipe: line.ingredients && line.ingredients.length ? '按 ' + line.ingredients.map(x => x.name + x.grams + 'g').join(' + ') + ' 估算' : '', assumptions: line.source === 'ai' ? (line.assumptions || []).join('；') : '' }, item);
      }), mealPhoto: this.mealDraft.photo, mealEstimate: estimate,
      advice: core.getMealAdvice(estimate, prospective, this.state.profile), reference: core.getReference(this.state.profile), entries,
      activityIndex: Math.max(0, activities.indexOf(this.state.profile.activity)), formulaIndex: Math.max(0, formulas.indexOf(this.state.profile.formulaSex))
    });
  },
  tab(e) { this.setData({ tab: e.currentTarget.dataset.tab }); wx.pageScrollTo({ scrollTop: 0, duration: 150 }); },
  plan(e) { this.selectedPlan = Number(e.currentTarget.dataset.index); this.setData({ editingPlan: false }); this.initWorkout(); this.refresh(); },
  editPlan() { this.setData({ editingPlan: true }); },
  planField(e) { this.state.plan[this.selectedPlan][e.currentTarget.dataset.field] = e.detail.value; },
  exerciseField(e) { this.state.plan[this.selectedPlan].exercises[Number(e.currentTarget.dataset.index)][e.currentTarget.dataset.field] = e.detail.value; },
  addExercise() { this.state.plan[this.selectedPlan].exercises.push({ id: uid('x'), name: '新动作', sets: 3, reps: 10 }); this.refresh(); },
  savePlan() {
    const plan = this.state.plan[this.selectedPlan];
    plan.name = plan.name.trim() || '训练';
    plan.exercises.forEach(x => { x.name = x.name.trim() || '未命名动作'; x.sets = Math.min(12, Math.max(1, numeric(x.sets))); });
    this.save(); this.setData({ editingPlan: false }); this.initWorkout(); this.refresh(); this.notice('模板已保存');
  },
  setField(e) {
    const { exercise, set, field } = e.currentTarget.dataset;
    this.workoutDraft[Number(exercise)].sets[Number(set)][field] = e.detail.value;
  },
  workoutDateChange(e) { this.workoutDate = e.detail.value; this.refresh(); },
  mealDateChange(e) { this.mealDate = e.detail.value; this.refresh(); },
  saveWorkout() {
    if (!core.validRecordDate(this.workoutDate)) return this.notice('请选择今天或更早的训练日期');
    const exercises = this.workoutDraft.map(x => ({ id: x.id, name: x.name, sets: x.sets.filter(s => s.done).map(s => ({ reps: numeric(s.reps), weight: s.weight === '' ? '' : numeric(s.weight) })) })).filter(x => x.sets.length);
    if (!exercises.length) return this.notice('请至少保留一组');
    const plan = this.state.plan[this.selectedPlan];
    this.state.workouts.unshift({ id: uid('w'), date: this.workoutDate, createdAt: Date.now(), planId: plan.id, planName: plan.name, focus: plan.focus, exercises });
    if (!this.save()) { this.state.workouts.shift(); return; }
    const backfilled = this.workoutDate !== core.dateKey();
    this.workoutDate = core.dateKey(); this.selectedPlan = core.nextPlanIndex(this.state); this.initWorkout(); this.setData({ tab: backfilled ? 'history' : 'home' }); this.refresh(); this.notice('训练已保存');
  },
  mealType(e) { this.mealDraft.type = e.currentTarget.dataset.type; this.refresh(); },
  mealText(e) { this.mealDraft.text = e.detail.value; },
  choosePhoto() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album','camera'], success: result => {
      wx.saveFile({ tempFilePath: result.tempFiles[0].tempFilePath, success: saved => { this.mealDraft.photo = saved.savedFilePath; this.refresh(); }, fail: () => this.notice('照片保存失败') });
    }});
  },
  parseMeal() { this.mealDraft.items = core.parseMealText(this.mealDraft.text); const result = core.calculateMeal(this.mealDraft.items); this.refresh(); this.notice(result.unknownCount ? '部分菜名待估算' : result.estimatedCount ? '请核对份量' : '请先输入菜名'); },
  foodSelect(e) { this.setData({ foodIndex: Number(e.detail.value) }); },
  foodGrams(e) { this.setData({ foodGrams: e.detail.value }); },
  addFood() {
    const choice = this.data.foods[this.data.foodIndex];
    if (choice.kind === 'dish') {
      const dish = core.DISH_LIST.find(x => x.id === choice.id);
      this.mealDraft.items.push(core.makeDishItem(dish, numeric(this.data.foodGrams)));
    } else {
      const food = core.FOOD_LIST.find(x => x.id === choice.id);
      this.mealDraft.items.push({ foodId: food.id, name: food.name, grams: numeric(this.data.foodGrams) || food.defaultGrams });
    }
    this.setData({ foodGrams: '' }); this.refresh();
  },
  itemGrams(e) { this.mealDraft.items[Number(e.currentTarget.dataset.index)].grams = e.detail.value === '' ? '' : numeric(e.detail.value); this.refresh(); },
  removeFood(e) { this.mealDraft.items.splice(Number(e.currentTarget.dataset.index), 1); this.refresh(); },
  saveMeal() {
    if (!core.validRecordDate(this.mealDate)) return this.notice('请选择今天或更早的用餐日期');
    if (!this.mealDraft.items.length) return this.notice('先添加食物');
    this.state.meals.unshift({ id: uid('m'), date: this.mealDate, createdAt: Date.now(), type: this.mealDraft.type, text: this.mealDraft.text.trim(), items: this.mealDraft.items.map(x => Object.assign({}, x)), photo: this.mealDraft.photo });
    if (!this.save()) { this.state.meals.shift(); return; }
    const backfilled = this.mealDate !== core.dateKey();
    this.mealDate = core.dateKey(); this.mealDraft = { type: '午餐', text: '', items: [], photo: '' }; this.setData({ tab: backfilled ? 'history' : 'home' }); this.refresh(); this.notice('这餐已保存');
  },
  profileField(e) { this.state.profile[e.currentTarget.dataset.field] = e.detail.value; },
  activityChange(e) { this.state.profile.activity = ['low','moderate','high'][Number(e.detail.value)]; this.refresh(); },
  formulaChange(e) { this.state.profile.formulaSex = ['', 'male','female'][Number(e.detail.value)]; this.refresh(); },
  saveProfile() { this.save(); this.refresh(); this.notice('设置已保存'); },
  deleteEntry(e) {
    const { id, kind } = e.currentTarget.dataset;
    wx.showModal({ title: '删除记录？', content: '删除后无法恢复', success: result => {
      if (!result.confirm) return;
      const field = kind === 'meal' ? 'meals' : 'workouts';
      this.state[field] = this.state[field].filter(x => x.id !== id);
      this.save(); this.refresh();
    }});
  }
});
