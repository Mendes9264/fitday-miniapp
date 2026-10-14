(function () {
  'use strict';
  const core = window.FitCore;
  const localBackup = window.FitLocalBackup;
  const catalog = window.FitDishCatalog;
  const exerciseEnergy = window.FitExerciseEnergy;
  const modelGateway = window.FitModelGateway;
  const storageKey = 'fitday-v1';
  try { localStorage.removeItem('fitday-direct-api-v1'); } catch (_) {}
  const main = document.getElementById('app-main');
  const toastNode = document.getElementById('toast');
  let state;
  try { state = core.normalizeState(JSON.parse(localStorage.getItem(storageKey))); }
  catch (_) { state = core.createState(); }
  let view = 'home';
  let selectedPlan = core.nextPlanIndex(state);
  let workoutDraft = null;
  let workoutMode = 'strength';
  let workoutDate = core.dateKey();
  let cardioDraft = [];
  let cardioWeightKg = state.profile.weightKg || '';
  let editingPlan = false;
  let mealDraft = { type: '午餐', text: '', items: [], photo: '' };
  let mealDate = core.dateKey();
  let editingMealId = '';
  let editingWorkoutId = '';
  let reusedWorkoutMeta = null;
  let workoutDraftDirty = false;
  let pausedMealDraft = null;
  let pausedWorkoutDraft = null;
  let customFoodOpen = false;
  let editingCustomFoodId = '';
  let customFoodDraft = { name: '', defaultGrams: '100', kcal: '', protein: '', carbs: '', fat: '' };
  let bodyDate = core.dateKey();
  let bodyDraft = { ...state.bodyMeasurements.find(entry => entry.date === bodyDate) };
  let bodyChartOpen = false;
  let bodyChartMetric = 'weightKg';
  let weekOffset = 0;
  let catalogQuery = '';
  let catalogCategory = '全部';
  let catalogCuisine = '全部地区';
  let catalogLimit = 8;
  let expandedRecipe = -1;
  let aiConfig = modelGateway.configOf();
  try { aiConfig = modelGateway.configOf(JSON.parse(localStorage.getItem('fitday-model-config-v2'))); } catch (_) {}
  let aiKey = '';
  let rememberAiKey = false;
  try {
    rememberAiKey = !!localStorage.getItem('fitday-model-key');
    aiKey = sessionStorage.getItem('fitday-model-key') || localStorage.getItem('fitday-model-key') || '';
  } catch (_) {}
  let aiBusy = false;
  let aiError = '';
  let aiResult = null;
  let aiTarget = null;
  let toastTimer;

  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const clock = timestamp => new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const recordTime = item => core.dateKey(new Date(item.createdAt)) === item.date ? clock(item.createdAt) : '补记';
  const dayLabel = key => new Date(key + 'T12:00:00').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const nowKey = () => core.dateKey();
  const copy = value => JSON.parse(JSON.stringify(value));
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; }
    catch (_) { toast('本地空间已满，请删除一些照片或旧记录'); return false; }
  }
  function persistModelConfig() {
    try { localStorage.setItem('fitday-model-config-v2', JSON.stringify(aiConfig)); return true; }
    catch (_) { toast('模型设置未能保存到本机'); return false; }
  }
  function toast(message) {
    toastNode.textContent = message;
    toastNode.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.classList.remove('show'), 2800);
  }
  function heading(title, subtitle, date) {
    return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${date ? `<div class="tiny-date">${dayLabel(date)}</div>` : ''}</div>`;
  }
  function initWorkoutDraft() {
    const plan = state.plan[selectedPlan];
    const previous = core.lastWorkoutForPlan(state, plan.id);
    workoutDraft = plan.exercises.map((exercise, ei) => ({
      id: exercise.id, name: exercise.name,
      sets: Array.from({ length: Math.max(1, number(exercise.sets)) }, (_, si) => {
        const old = previous && previous.exercises && previous.exercises[ei] && previous.exercises[ei].sets[si];
        return { reps: old ? old.reps : exercise.reps, weight: old ? old.weight : '', done: true };
      })
    }));
    workoutDraftDirty = false;
  }
  function stopMealEdit() {
    editingMealId = '';
    if (pausedMealDraft) {
      mealDraft = pausedMealDraft.draft;
      mealDate = pausedMealDraft.date;
      pausedMealDraft = null;
    } else {
      mealDraft = { type: '午餐', text: '', items: [], photo: '' };
      mealDate = nowKey();
    }
    expandedRecipe = -1;
  }
  function stopWorkoutEdit() {
    editingWorkoutId = '';
    if (pausedWorkoutDraft) {
      ({ selectedPlan, workoutDraft, workoutMode, workoutDate, cardioDraft, cardioWeightKg, editingPlan, reusedWorkoutMeta, workoutDraftDirty } = pausedWorkoutDraft);
      pausedWorkoutDraft = null;
    } else {
      selectedPlan = core.nextPlanIndex(state);
      workoutDraft = null;
      workoutMode = 'strength';
      workoutDate = nowKey();
      cardioDraft = [];
      editingPlan = false;
      reusedWorkoutMeta = null;
      workoutDraftDirty = false;
    }
  }
  function beginMealEdit(meal) {
    if (editingMealId || editingWorkoutId) return toast('请先保存或取消正在编辑的记录');
    pausedMealDraft = { draft: mealDraft, date: mealDate };
    editingMealId = meal.id;
    mealDraft = { type: meal.type, text: meal.text || '', items: copy(meal.items || []), photo: meal.photo || '' };
    mealDate = meal.date;
    expandedRecipe = -1;
    navigate('meal');
  }
  function beginWorkoutEdit(workout) {
    if (editingMealId || editingWorkoutId) return toast('请先保存或取消正在编辑的记录');
    pausedWorkoutDraft = { selectedPlan, workoutDraft, workoutMode, workoutDate, cardioDraft, cardioWeightKg, editingPlan, reusedWorkoutMeta, workoutDraftDirty };
    editingWorkoutId = workout.id;
    reusedWorkoutMeta = null;
    const planIndex = state.plan.findIndex(plan => plan.id === workout.planId);
    if (planIndex >= 0) selectedPlan = planIndex;
    workoutDraft = copy(workout.exercises || []).map(exercise => ({ ...exercise, sets: exercise.sets.map(set => ({ ...set, done: true })) }));
    workoutMode = workoutDraft.length ? 'strength' : 'cardio';
    workoutDate = workout.date;
    cardioDraft = copy(workout.cardio || []);
    cardioWeightKg = workout.cardioWeightKg || workout.cardio?.[0]?.weightKg || state.profile.weightKg || '';
    editingPlan = false;
    navigate('workout');
  }
  function frequentWorkouts() {
    const groups = new Map();
    [...state.workouts].sort(core.newestRecordFirst).forEach(workout => {
      if (!(workout.exercises?.length || workout.cardio?.length)) return;
      const key = [workout.planId || workout.planName,
        (workout.exercises || []).map(exercise => exercise.name).join('|'),
        (workout.cardio || []).map(entry => entry.activityId + ':' + entry.optionId).join('|')].join('::');
      const found = groups.get(key);
      if (found) found.count += 1;
      else groups.set(key, { workout, count: 1 });
    });
    return [...groups.values()].sort((a, b) => b.count - a.count || core.newestRecordFirst(a.workout, b.workout)).slice(0, 4);
  }
  function reuseWorkout(workout, fromHistory) {
    if (editingMealId || editingWorkoutId) return toast('请先保存或取消正在编辑的记录');
    if (workoutDraftDirty && !window.confirm('用这次训练替换当前未保存的训练草稿？')) return;
    const planIndex = state.plan.findIndex(plan => plan.id === workout.planId);
    if (planIndex >= 0) selectedPlan = planIndex;
    reusedWorkoutMeta = { planId: workout.planId || '', planName: workout.planName || '训练', focus: workout.focus || '力量' };
    workoutDraft = copy(workout.exercises || []).map(exercise => ({ ...exercise,
      sets: (exercise.sets || []).map(set => ({ ...set, done: true })) }));
    cardioDraft = copy(workout.cardio || []);
    cardioWeightKg = state.profile.weightKg || workout.cardioWeightKg || workout.cardio?.[0]?.weightKg || '';
    workoutMode = workoutDraft.length ? 'strength' : 'cardio';
    if (fromHistory) workoutDate = nowKey();
    editingPlan = false;
    workoutDraftDirty = false;
    navigate('workout');
    toast('已带入训练安排，请核对本次次数、重量和有氧时长后保存');
  }
  function frequentMeals() {
    const groups = new Map();
    [...state.meals].sort(core.newestRecordFirst).forEach(meal => {
      if (!meal.items?.length) return;
      const key = meal.type + ':' + meal.items.map(item => item.customFoodId || item.dishId || item.foodId || item.name).join('|');
      const found = groups.get(key);
      if (found) found.count += 1;
      else groups.set(key, { meal, count: 1 });
    });
    return [...groups.values()].sort((a, b) => b.count - a.count || core.newestRecordFirst(a.meal, b.meal)).slice(0, 4);
  }
  function reuseMeal(meal, fromHistory) {
    if (editingMealId || editingWorkoutId) return toast('请先保存或取消正在编辑的记录');
    if ((mealDraft.items.length || mealDraft.text.trim() || mealDraft.photo) && !window.confirm('用这餐替换当前未保存的餐食内容？')) return;
    mealDraft = { type: meal.type, text: meal.text || '', photo: '', items: (meal.items || []).map(item => {
      const currentFood = item.customFoodId && state.customFoods.find(food => food.id === item.customFoodId);
      return currentFood ? core.customFoodItem(currentFood, item.grams) : copy(item);
    }) };
    if (fromHistory) mealDate = nowKey();
    expandedRecipe = -1;
    aiResult = null;
    aiTarget = null;
    navigate('meal');
    toast('已带入这餐，请核对份量后保存');
  }
  function workoutDetail(item) {
    const strength = Array.isArray(item.exercises) ? item.exercises.length : 0;
    const cardio = Array.isArray(item.cardio) ? item.cardio.length : 0;
    return [strength ? strength + ' 个力量动作' : '', cardio ? cardio + ' 项有氧' : ''].filter(Boolean).join(' · ') || '已记录';
  }
  function workoutFigure(item) {
    const cardio = Array.isArray(item.cardio) ? item.cardio : [];
    return cardio.length ? cardio.reduce((sum, session) => sum + number(session.activeKcal), 0) + ' 活动千卡' : '完成';
  }
  function paceLabel(speedKmh) {
    const speed = number(speedKmh);
    if (speed <= 0) return '';
    const seconds = Math.round(3600 / speed);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}/公里`;
  }
  function renderCardioEntry(entry, i, result) {
    const activity = exerciseEnergy.ACTIVITIES.find(x => x.id === entry.activityId) || exerciseEnergy.ACTIVITIES[0];
    const incline = activity.id === 'incline';
    const intensity = incline ? `<label><span class="field-label">跑步机速度 km/h</span><input class="field-control" type="number" min="3.2" max="5.6" step="0.1" inputmode="decimal" data-cardio-speed="${i}" value="${safe(entry.speedKmh || '')}" placeholder="3.2–5.6"></label><label><span class="field-label">跑步机坡度 %</span><input class="field-control" type="number" min="1" max="15" step="0.5" inputmode="decimal" data-cardio-grade="${i}" value="${safe(entry.gradePercent || '')}" placeholder="1–15"></label>`
      : `<label class="cardio-intensity"><span class="field-label">速度或强度</span><select class="field-control" data-cardio-option="${i}">${activity.options.map(x => `<option value="${x.id}" ${x.id === entry.optionId ? 'selected' : ''}>${safe(x.label)}</option>`).join('')}</select></label>`;
    const method = result ? result.method === 'acsm-walking' ? 'ACSM 步行公式' : `汇编编号 ${result.compendiumCode}` : '';
    return `<div class="cardio-entry"><div class="cardio-entry-top"><strong>有氧 ${i + 1}</strong><button class="danger-button" data-remove-cardio="${i}">删除</button></div>
      <div class="cardio-fields"><label><span class="field-label">项目</span><select class="field-control" data-cardio-activity="${i}">${exerciseEnergy.ACTIVITIES.map(x => `<option value="${x.id}" ${x.id === activity.id ? 'selected' : ''}>${safe(x.name)}</option>`).join('')}</select></label><label><span class="field-label">实际运动分钟</span><input class="field-control" type="number" min="1" max="300" inputmode="numeric" data-cardio-minutes="${i}" value="${safe(entry.minutes)}"></label>${intensity}</div>
      ${incline ? `<p class="cardio-hint">${paceLabel(entry.speedKmh) ? `当前配速 ${paceLabel(entry.speedKmh)}。` : ''}按跑步机显示的速度和坡度填写；步行公式适用约 3.2–5.6 km/h。</p>` : ''}
      ${result ? `<div class="cardio-result"><strong>约 ${result.activeKcal} 活动千卡</strong><span>${result.met} MET · ${method}</span></div><a class="cardio-source" href="${safe(result.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看这项的计算依据</a>` : '<p class="cardio-hint">填写有效的体重、运动分钟和项目参数后显示估算。</p>'}</div>`;
  }
  function renderCardioSection() {
    const weight = number(cardioWeightKg);
    const estimated = cardioDraft.map(entry => exerciseEnergy.estimate(entry.activityId, entry.optionId, entry.minutes, weight, entry));
    const valid = estimated.every(Boolean) && estimated.length;
    const total = valid ? estimated.reduce((sum, entry) => sum + entry.activeKcal, 0) : 0;
    return `<div class="sheet cardio-sheet"><div class="sheet-header"><h2>有氧训练</h2><small>可添加多项</small></div>
      <label class="cardio-weight"><span class="field-label">本次估算用体重 kg</span><input class="field-control" type="number" min="30" max="300" step="0.1" inputmode="decimal" data-cardio-weight value="${safe(cardioWeightKg)}" placeholder="例如 70"><small>仅用于这次估算；保存训练时随记录留存，不生成体重趋势。</small></label>
      ${cardioDraft.map((entry, i) => renderCardioEntry(entry, i, estimated[i])).join('')}
      <button class="secondary-button" data-action="add-cardio">＋ 添加有氧项目</button>
      ${valid ? `<div class="cardio-total">本次有氧额外消耗约 <strong>${total} 千卡</strong></div>` : ''}
      <p class="note">一般项目采用 2024 成人体力活动汇编（主要适用于 19–59 岁）；跑步机爬坡采用 ACSM 步行公式，由速度和坡度计算 MET。活动千卡＝(MET－1) × 体重 × 运动小时。只填写实际运动时间，不含停顿。<a href="https://pacompendium.com/adult-compendium/" target="_blank" rel="noopener noreferrer">查看活动汇编</a></p></div>`;
  }
  function renderHome() {
    const today = core.getDaySummary(state, nowKey());
    const ref = core.getReference(state.profile);
    const next = state.plan[core.nextPlanIndex(state)];
    return `<section class="page">${heading('今天，练得怎样？', '用几分钟补记训练和饮食，慢慢看清自己的节奏。', nowKey())}
      <div class="home-hero"><span class="hero-label">今日饮食 · ${today.unknownCount ? '仅已识别部分' : '粗略估算'}</span><h2>${today.estimatedCount ? `${today.range.min}–${today.range.max} <small style="font-size:15px">千卡</small>` : today.meals.length ? '已记录，待估算' : '从第一餐开始'}</h2>
      <div class="hero-metrics"><div class="hero-metric"><strong>${today.meals.length}</strong><span>餐已记录</span></div><div class="hero-metric"><strong>${today.workouts.length}</strong><span>次训练</span></div></div>
      <div class="hero-foot">${ref ? `个人每日参考 ${ref.min}–${ref.max} 千卡。估算有误差，仅用于观察记录。` : '先记录即可。需要个人每日参考时，可在设置中填写基础资料。'}</div></div>
      <div class="quick-actions"><button class="quick-action" data-view="workout"><span class="action-art">↗</span><strong>补记训练</strong><small>下一次 · ${safe(next.name)} / ${safe(next.focus)}</small></button><button class="quick-action warm" data-view="meal"><span class="action-art">＋</span><strong>记一餐</strong><small>文字或照片，估个范围</small></button></div>
      <div class="section-head"><h2>今天的记录</h2><button data-view="history">全部记录 →</button></div>
      ${today.workouts.length || today.meals.length ? [...today.workouts.map(w => ({ kind: 'workout', ...w })), ...today.meals.map(m => ({ kind: 'meal', ...m }))].sort((a,b) => b.createdAt - a.createdAt).slice(0,4).map(item => `<div class="plain-card"><div class="card-top"><div><div class="card-title">${item.kind === 'workout' ? safe(item.planName) : safe(item.type) + ' · ' + safe(item.text || item.items.map(x => x.name).join('、'))}</div><div class="card-sub">${clock(item.createdAt)} · ${item.kind === 'workout' ? workoutDetail(item) : item.items.length + ' 道食物/菜'}</div></div><div class="card-figure">${item.kind === 'workout' ? workoutFigure(item) : mealFigure(item.items)}</div></div></div>`).join('') : `<div class="plain-card empty-hint">还没有记录。先从今天最容易补记的一项开始。</div>`}
      <div class="section-head"><h2>接下来</h2></div><div class="plain-card tinted"><div class="card-title">${safe(next.name)} · ${safe(next.focus)}</div><div class="card-sub">${next.exercises.map(x => safe(x.name)).join(' / ')}</div></div>
      <p class="note">家常菜按示例食材和做法估算；未识别的菜不会计入数字。照片只留档，暂不自动识别。</p></section>`;
  }
  function renderWorkout() {
    if (!workoutDraft) initWorkoutDraft();
    const plan = state.plan[selectedPlan];
    const last = core.lastWorkoutForPlan(state, plan.id);
    const savedWorkout = editingWorkoutId ? state.workouts.find(item => item.id === editingWorkoutId) : null;
    const draftSource = savedWorkout || reusedWorkoutMeta;
    const editableExercises = !!draftSource;
    const repeats = savedWorkout || reusedWorkoutMeta ? [] : frequentWorkouts();
    return `<section class="page">${heading(savedWorkout ? '修改训练记录' : reusedWorkoutMeta ? '复用训练安排' : '训练补记', savedWorkout ? '修改后会更新原记录，不会新增一次训练。' : reusedWorkoutMeta ? '历史安排已带入；核对这次的实际完成情况后另存。' : '训练后补记力量动作，也可以单独记录有氧。')}
      <label class="record-date"><span class="field-label">训练日期</span><input class="field-control" type="date" id="workout-date" max="${nowKey()}" value="${safe(workoutDate)}"></label>
      <div class="workout-mode"><button class="pill ${workoutMode === 'strength' ? 'active' : ''}" data-workout-mode="strength">力量＋有氧</button><button class="pill ${workoutMode === 'cardio' ? 'active' : ''}" data-workout-mode="cardio">仅有氧</button></div>
      ${repeats.length ? `<div class="repeat-panel"><div class="sheet-header"><h2>常练训练</h2><small>复用后仍可改动作和重量</small></div><div class="repeat-list">${repeats.map(({ workout, count }) => `<button type="button" class="repeat-item" data-reuse-workout="${safe(workout.id)}"><span><strong>${safe(workout.planName)}</strong><small>记过 ${count} 次 · ${safe((workout.exercises || []).map(item => item.name).join(' / ') || workoutDetail(workout))}</small></span><b>复用 →</b></button>`).join('')}</div><p class="note">带入最近一次的动作、组数和有氧设置；保存后是新的一次训练。</p></div>` : ''}
      ${workoutMode === 'strength' ? `${draftSource ? '' : `<div class="rail">${state.plan.map((day, i) => `<button class="pill ${i === selectedPlan ? 'active' : ''}" data-plan="${i}">${safe(day.name)} · ${safe(day.focus)}</button>`).join('')}</div>`}
      ${editingPlan ? `<div class="sheet"><div class="sheet-header"><h2>编辑训练模板</h2><small>修改后每周沿用</small></div><div class="form-stack" style="margin-top:14px"><label><span class="field-label">名称</span><input class="field-control" data-plan-field="name" value="${safe(plan.name)}"></label><label><span class="field-label">训练部位</span><input class="field-control" data-plan-field="focus" value="${safe(plan.focus)}"></label>${plan.exercises.map((x,i) => `<div class="profile-grid"><label><span class="field-label">动作 ${i+1}</span><input class="field-control" data-exercise-name="${i}" value="${safe(x.name)}"></label><label><span class="field-label">组数</span><input class="field-control" type="number" min="1" max="12" data-exercise-sets="${i}" value="${x.sets}"></label></div>`).join('')}<button class="secondary-button" data-action="add-exercise">＋ 添加动作</button><button class="primary-button" data-action="save-plan">保存模板</button></div></div>` : `<div class="sheet"><div class="sheet-header"><h2>${safe(draftSource ? draftSource.planName : plan.name)} · ${safe(draftSource ? draftSource.focus : plan.focus)}</h2><small>${savedWorkout ? '原记录' : reusedWorkoutMeta ? '由历史训练带入' : last ? '已带入上次记录' : '示例模板'}</small></div>
      ${workoutDraft.map((exercise, ei) => `<div class="exercise"><div class="exercise-heading">${editableExercises ? `<input class="field-control exercise-name-edit" aria-label="动作名称" data-workout-exercise-name="${ei}" value="${safe(exercise.name)}"><button class="danger-button" data-remove-workout-exercise="${ei}">删除动作</button>` : `<strong>${safe(exercise.name)}</strong><small>${exercise.sets.length} 组</small>`}</div>${exercise.sets.map((set, si) => `<div class="set-row ${set.done ? '' : 'dimmed'}"><span class="set-number">${si+1}</span><label class="mini-field"><span>次数</span><input type="number" min="0" data-set="${ei}:${si}:reps" value="${safe(set.reps)}"></label><label class="mini-field"><span>重量 kg</span><input type="number" min="0" step="0.5" data-set="${ei}:${si}:weight" value="${safe(set.weight)}"></label><input type="checkbox" aria-label="第 ${si+1} 组已完成" data-set="${ei}:${si}:done" ${set.done ? 'checked' : ''}></div>`).join('')}${editableExercises ? `<button class="text-button" data-add-workout-set="${ei}">＋ 添加一组</button>` : ''}</div>`).join('')}${editableExercises ? '<button class="secondary-button" data-action="add-workout-exercise">＋ 添加动作</button>' : ''}</div>
      <p class="note">未完成的组可取消勾选。重量可留空；仅凭组数、次数和重量不能可靠推算每个力量动作的热量。<a href="https://pacompendium.com/conditioning-exercise/" target="_blank" rel="noopener noreferrer">查看力量训练 MET 分类</a></p>${draftSource ? '' : '<button class="text-button" data-action="edit-plan">编辑四天模板</button>'}`}` : ''}
      ${!editingPlan ? `${renderCardioSection()}<button class="primary-button" data-action="save-workout">${savedWorkout ? '保存修改' : `保存${workoutDate === nowKey() ? '今天' : core.validRecordDate(workoutDate) ? dayLabel(workoutDate) : '所选日期'}的训练`}</button>${savedWorkout ? '<button class="text-button cancel-edit" data-action="cancel-record-edit">取消修改</button>' : reusedWorkoutMeta ? '<button class="text-button cancel-edit" data-action="cancel-workout-reuse">取消复用</button>' : ''}` : ''}</section>`;
  }
  function mealEstimate() {
    return core.calculateMeal(mealDraft.items);
  }
  function mealFigure(items) {
    const estimate = core.calculateMeal(items);
    return estimate.estimatedCount ? `${estimate.range.min}–${estimate.range.max} kcal${estimate.unknownCount ? ' · 部分' : ''}` : '待估算';
  }
  function editableRecipe(item) {
    const grams = number(item.grams);
    const withOil = parts => {
      if (parts && !parts.some(part => part.foodId === 'cooking_oil')) {
        const oil = core.FOOD_LIST.find(x => x.id === 'cooking_oil');
        parts.push({ foodId: oil.id, name: oil.name, grams: 0, category: oil.category,
          kcal: oil.kcal, protein: oil.protein, carbs: oil.carbs, fat: oil.fat });
      }
      return parts;
    };
    if (item.kind === 'catalog') {
      const dish = catalog.dishes.find(x => x.id === item.catalogId);
      if (!dish || !grams) return null;
      return withOil(catalog.makeItem(dish, grams).ingredients.map(part => ({ ...part, grams: Math.round(part.grams * grams) / 100 })));
    }
    if (Array.isArray(item.components) && grams) {
      const base = number(item.baseGrams) || item.components.reduce((sum, part) => sum + number(part.grams), 0);
      return withOil(item.components.map(part => {
        const food = core.FOOD_LIST.find(x => x.id === part.foodId);
        return food ? { foodId: food.id, name: food.name, grams: Math.round(number(part.grams) * grams / base), category: food.category,
          kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat } : null;
      }).filter(Boolean));
    }
    return null;
  }
  function renderFoodLine(item, i) {
    const line = core.calculateMeal([item]).lines[0];
    const ai = line.source === 'ai';
    const sourceLinks = ai ? (line.sources || []).filter(x => { try { return new URL(x.url).protocol === 'https:'; } catch (_) { return false; } }).slice(0, 3) : [];
    const canEdit = item.kind === 'catalog' || Array.isArray(item.components);
    const parts = item.customRecipe || (expandedRecipe === i ? editableRecipe(item) : null);
    const lineLabel = line.estimated ? `${line.kcal} 千卡${ai ? ' · AI 估算' : line.source === 'personal' ? ' · 自定义食物' : line.source === 'custom' ? '估算 · 自定义做法' : line.source === 'inferred' ? '估算 · 按菜名推断' : line.source === 'catalog' ? '估算 · 菜肴目录' : '估算'}` : '待估算 · 可补充食材和做法';
    return `<div class="food-entry"><div class="food-line"><div><strong>${safe(item.name)}</strong><small>${lineLabel}</small>${!line.estimated ? `<button type="button" class="text-button" data-ai-unknown="${i}" ${aiBusy ? 'disabled' : ''}>用模型估算</button>` : ''}${line.ingredients?.length ? `<small class="recipe-hint">按 ${safe(line.ingredients.map(x => x.name + x.grams + 'g').join(' + '))} 估算</small>` : ''}${canEdit ? `<button type="button" class="text-button" data-edit-recipe="${i}">${expandedRecipe === i ? '收起食材与用油' : '调整食材与用油'}</button>` : ''}${ai ? `<small class="recipe-hint">${safe(line.explanation)}</small>${line.assumptions?.length ? `<small class="recipe-hint">假设：${safe(line.assumptions.join('；'))}</small>` : ''}${sourceLinks.length ? `<small class="recipe-hint">参考：${sourceLinks.map((x, n) => `<a href="${safe(x.url)}" target="_blank" rel="noopener noreferrer">${safe(x.title || '来源 ' + (n + 1))}</a>`).join(' · ')}</small>` : ''}` : ''}</div><input type="number" min="1" data-food-grams="${i}" value="${safe(item.grams)}" placeholder="克数" aria-label="${safe(item.name)}的克数"><button class="danger-button" data-remove-food="${i}" aria-label="删除${safe(item.name)}">×</button></div>${expandedRecipe === i && parts ? `<div class="recipe-editor"><strong>这一份的食材估计</strong><p>食材克数可按实际比例修改；用油 1 喷按 1 克计算，约 9 千卡。</p>${parts.map((part, j) => `<label class="recipe-part"><span>${safe(part.foodId === 'cooking_oil' ? '用油（喷）' : part.name)}</span><input type="number" min="0" step="1" inputmode="numeric" data-recipe-part="${i}:${j}" value="${safe(part.grams)}" aria-label="${safe(part.name)}的${part.foodId === 'cooking_oil' ? '喷数' : '克数'}"><small>${part.foodId === 'cooking_oil' ? '喷' : '克'}</small></label>`).join('')}<p class="recipe-seasoning">少量盐、酱油、醋和干香料的热量可忽略；酱油和盐仍含钠。糖、淀粉和调味汁若出现在上方，可按实际用量调整。大量含油或含糖酱料还会带来额外热量，当前未单独估计。</p>${item.customRecipe ? `<button type="button" class="text-button" data-reset-recipe="${i}">恢复示例比例</button>` : ''}</div>` : ''}</div>`;
  }
  function renderCustomFoods() {
    const field = (label, key, unit, limit) => `<label><span class="field-label">${label} <small>${unit}</small></span><input class="field-control" type="number" min="0" max="${limit}" step="0.1" inputmode="decimal" data-custom-food-field="${key}" value="${safe(customFoodDraft[key])}" placeholder="必填"></label>`;
    return `<div class="custom-food-panel"><div class="sheet-header"><h2>我的食物库</h2><small>保存在本机</small></div>
      <p class="note">按每 100 克录入包装标示或你掌握的营养数值，下次可以直接加入。已有餐食会保留加入时的数值。</p>
      <button type="button" class="secondary-button custom-food-new" data-action="new-custom-food">${customFoodOpen ? '取消填写' : '＋ 新建自定义食物'}</button>
      ${customFoodOpen ? `<div class="custom-food-form"><div class="custom-food-fields"><label class="span-2"><span class="field-label">食物名称</span><input class="field-control" data-custom-food-field="name" maxlength="80" value="${safe(customFoodDraft.name)}" placeholder="例如：山姆虾仁饼"></label><label class="span-2"><span class="field-label">常用份量 <small>克，加入一餐后仍可修改</small></span><input class="field-control" type="number" min="1" max="2000" step="0.1" inputmode="decimal" data-custom-food-field="defaultGrams" value="${safe(customFoodDraft.defaultGrams)}"></label>${field('热量', 'kcal', '千卡 / 100克', 900)}${field('蛋白质', 'protein', '克 / 100克', 100)}${field('碳水', 'carbs', '克 / 100克', 100)}${field('脂肪', 'fat', '克 / 100克', 100)}</div><button type="button" class="primary-button" data-action="save-custom-food">${editingCustomFoodId ? '保存修改' : '保存并加入这餐'}</button></div>` : ''}
      ${state.customFoods.length ? `<div class="custom-food-list">${state.customFoods.map(food => `<div class="custom-food-row"><div><strong>${safe(food.name)}</strong><small>每100克 ${food.nutrition.kcal} 千卡 · 蛋白质 ${food.nutrition.protein}g · 碳水 ${food.nutrition.carbs}g · 脂肪 ${food.nutrition.fat}g</small></div><div class="custom-food-buttons"><button type="button" class="secondary-button" data-add-custom-food="${safe(food.id)}">加入这餐</button><button type="button" class="text-button" data-edit-custom-food="${safe(food.id)}">修改</button><button type="button" class="text-button delete" data-delete-custom-food="${safe(food.id)}">删除</button></div></div>`).join('')}</div>` : '<p class="empty-hint custom-food-empty">还没有自定义食物。新建一次，以后就能重复使用。</p>'}</div>`;
  }
  const catalogCategories = ['全部', '家常蔬菜', '鸡蛋豆制品', '畜肉菜', '禽肉菜', '鱼虾海鲜', '米面主食', '汤羹'];
  const catalogCuisines = ['全部地区', ...new Set(catalog.dishes.map(dish => dish.cuisine))];
  function renderCatalogResults() {
    const matches = catalog.find(catalogQuery).filter(dish => (catalogCategory === '全部' || dish.category === catalogCategory) && (catalogCuisine === '全部地区' || dish.cuisine === catalogCuisine));
    return `<div class="catalog-count">找到 <strong>${matches.length}</strong> 道菜 · 每百克为参考估算</div>
      ${matches.length ? `<div class="catalog-list">${matches.slice(0, catalogLimit).map(dish => `<div class="catalog-result"><div class="catalog-result-top"><div><strong>${safe(dish.name)}</strong><small>${safe(dish.cuisine)} · ${safe(dish.category)} · 默认 ${dish.defaultGrams}g</small></div><button type="button" data-catalog-add="${safe(dish.id)}" aria-label="加入${safe(dish.name)}">＋ 加入</button></div><div class="catalog-nutrients"><b>${dish.per100.kcal}<span>千卡</span></b><span>蛋白质 ${dish.per100.protein}g</span><span>碳水 ${dish.per100.carbs}g</span><span>脂肪 ${dish.per100.fat}g</span></div></div>`).join('')}</div>${matches.length > catalogLimit ? `<button type="button" class="catalog-more" data-action="catalog-more">再显示 ${Math.min(12, matches.length - catalogLimit)} 道</button>` : ''}` : '<div class="catalog-empty">没有找到这道菜。可换个菜名搜索，或手动添加食材和份量。</div>'}`;
  }
  function refreshCatalogResults() {
    const node = document.getElementById('catalog-results');
    if (node) node.innerHTML = renderCatalogResults();
    document.querySelectorAll('[data-catalog-category]').forEach(button => button.classList.toggle('active', button.dataset.catalogCategory === catalogCategory));
    document.querySelectorAll('[data-catalog-cuisine]').forEach(button => button.classList.toggle('active', button.dataset.catalogCuisine === catalogCuisine));
  }
  function renderAiSearch() {
    const estimate = aiResult && aiResult.aiEstimate;
    const sourceLabel = estimate?.sourceMode === 'web' ? '接口返回的网页检索来源' : estimate?.sourceMode === 'provider-search' ? '已请求服务商搜索；以下链接由模型提供，请自行核对' : '模型知识估算；未验证网页检索';
    return `<div class="ai-panel"><div class="sheet-header"><h2>菜谱没有？用模型估算</h2><small>按次使用</small></div>
      <p class="note">输入上方菜名后查询，或在待估算菜品旁点“用模型估算”。只会将菜名和估算指令发给你设置的接口；是否实际联网搜索取决于服务商和接口设置，调用可能产生费用。</p>
      <button type="button" class="secondary-button" data-action="ai-search" ${aiBusy ? 'disabled' : ''}>${aiBusy ? '正在查询…' : '用所选模型估算这道菜'}</button>
      ${!aiConfig.endpoint || !aiConfig.model ? '<p class="note">使用前请到“个人设置 → 大模型接口”填写接口地址和模型名称。</p>' : ''}
      ${aiError ? `<p class="ai-error" role="alert">${safe(aiError)}</p>` : ''}
      ${estimate ? `<div class="ai-result"><strong>${safe(aiResult.name)} · 约 ${aiResult.grams}g/份</strong><div class="catalog-nutrients"><b>${estimate.kcal}<span>千卡</span></b><span>范围 ${estimate.kcalMin}–${estimate.kcalMax}</span><span>蛋白质 ${estimate.protein}g</span><span>碳水 ${estimate.carbs}g</span><span>脂肪 ${estimate.fat}g</span></div>
        <p>模型：${safe(estimate.model || aiConfig.model)} · ${sourceLabel}</p>
        <p>${safe(estimate.explanation)}</p><p>食材假设：${safe(estimate.ingredients.map(x => x.name + ' ' + x.grams + 'g').join('、') || '未列出')}</p>
        ${estimate.assumptions.length ? `<p>其他假设：${safe(estimate.assumptions.join('；'))}</p>` : ''}
        ${estimate.sources.length ? `<p>参考链接：${estimate.sources.map(x => `<a href="${safe(x.url)}" target="_blank" rel="noopener noreferrer">${safe(x.title)}</a>`).join(' · ')}</p>` : ''}
        <p>这些数值由模型估算，请核对份量与做法；加入后仍可修改克数。</p>
        <button type="button" class="secondary-button" data-action="ai-add">${aiTarget ? '替换待估算菜品' : '加入这餐'}</button></div>` : ''}</div>`;
  }
  function renderMeal() {
    const estimate = mealEstimate();
    const selectedDay = core.getDaySummary({ ...state, meals: state.meals.filter(item => item.id !== editingMealId) }, mealDate);
    const prospective = { ...selectedDay, meals: selectedDay.meals.concat([{ items: mealDraft.items }]), range: { min: selectedDay.range.min + estimate.range.min, max: selectedDay.range.max + estimate.range.max }, unknownCount: selectedDay.unknownCount + estimate.unknownCount };
    const advice = core.getMealAdvice(estimate, prospective, state.profile);
    const repeats = editingMealId ? [] : frequentMeals();
    return `<section class="page">${heading(editingMealId ? '修改餐食记录' : '记一餐', editingMealId ? '修改后会更新原记录，不会新增一餐。' : '拍照留档，或直接写吃了什么；份量可以再改。')}
      <label class="record-date"><span class="field-label">用餐日期</span><input class="field-control" type="date" id="meal-date" max="${nowKey()}" value="${safe(mealDate)}"></label>
      <div class="rail">${['早餐','午餐','晚餐','加餐','饮料'].map(type => `<button class="pill ${mealDraft.type === type ? 'active' : ''}" data-meal-type="${type}">${type}</button>`).join('')}</div>
      ${repeats.length ? `<div class="repeat-panel"><div class="sheet-header"><h2>常吃餐食</h2><small>复用后仍可改份量</small></div><div class="repeat-list">${repeats.map(({ meal, count }) => `<button type="button" class="repeat-item" data-reuse-meal="${safe(meal.id)}"><span><strong>${safe(meal.type)} · ${safe(meal.items.map(item => item.name).join('、'))}</strong><small>记过 ${count} 次 · ${mealFigure(meal.items)}</small></span><b>复用 →</b></button>`).join('')}</div><p class="note">带入最近一次的食物与份量；旧照片不会复制。</p></div>` : ''}
      <div class="sheet"><div class="form-stack"><label class="photo-pick">${mealDraft.photo ? `<img src="${mealDraft.photo}" alt="本餐照片">` : '<span>＋ 添加餐食照片</span><small>照片仅保存在本机，暂不自动识别</small>'}<input type="file" accept="image/*" capture="environment" id="meal-photo"></label>
      <label><span class="field-label">这餐吃了什么</span><textarea class="field-control textarea" id="meal-text" placeholder="例：一盘西红柿炒鸡蛋、毛豆烧鸡、一碗米饭">${safe(mealDraft.text)}</textarea></label><button class="secondary-button" data-action="parse-meal">拆解菜名并估算</button></div></div>
      <div class="section-head"><h2>菜品与份量</h2><span>按实际情况调整</span></div><div class="plain-card">${mealDraft.items.length ? mealDraft.items.map(renderFoodLine).join('') : `<div class="empty-hint">输入菜名后点“拆解菜名并估算”；常见家常菜也可从下方手动添加。</div>`}
      <div class="food-add"><select class="field-control" id="food-select" aria-label="选择单项食材">${core.FOOD_LIST.map(food => `<option value="food:${food.id}">${safe(food.name)}</option>`).join('')}</select><input class="field-control" type="number" min="1" id="food-grams" placeholder="克数"><button class="secondary-button" data-action="add-food">添加食材</button></div></div>
      ${renderCustomFoods()}
      <div class="catalog-panel"><div class="catalog-heading"><div><span class="catalog-eyebrow">中餐菜肴目录</span><h2>搜索一道菜</h2></div><span class="catalog-total">${catalog.dishes.length} 道</span></div><label class="catalog-search"><span aria-hidden="true">⌕</span><input id="catalog-search" type="search" autocomplete="off" value="${safe(catalogQuery)}" placeholder="试试：海肠捞饭、临沂炒鸡、毛血旺" aria-label="搜索中餐菜名"></label><div class="catalog-filter-label">按菜系</div><div class="catalog-filters catalog-regions" aria-label="菜系">${catalogCuisines.map(cuisine => `<button type="button" data-catalog-cuisine="${cuisine}" class="${cuisine === catalogCuisine ? 'active' : ''}">${cuisine}</button>`).join('')}</div><div class="catalog-filter-label">按食材类型</div><div class="catalog-filters" aria-label="菜肴分类">${catalogCategories.map(category => `<button type="button" data-catalog-category="${category}" class="${category === catalogCategory ? 'active' : ''}">${category}</button>`).join('')}</div><div id="catalog-results" aria-live="polite">${renderCatalogResults()}</div>${renderAiSearch()}<p class="catalog-method">以上是按常见食材比例、熟重和烹调油量推算的每 100g 数值，不是菜品实测。不同餐馆或家庭做法可能差很多；加入后请修改实际份量。<a href="https://fdc.nal.usda.gov/download-datasets/" target="_blank" rel="noopener noreferrer">食材数据参考：USDA FoodData Central</a></p></div>
      ${estimate.lines.length ? `${estimate.estimatedCount ? `<div class="estimate"><div class="estimate-head">${estimate.unknownCount ? '已识别部分热量' : '本餐热量'} · 约</div><div class="estimate-range">${estimate.range.min}–${estimate.range.max}<small>千卡</small></div><div class="macro-row"><div><strong>${estimate.totals.protein}g</strong><span>蛋白质</span></div><div><strong>${estimate.totals.carbs}g</strong><span>碳水</span></div><div><strong>${estimate.totals.fat}g</strong><span>脂肪</span></div></div></div>` : `<div class="inline-note" style="margin-top:15px">已保存菜名，但缺少可靠的食材信息，暂不显示热量。</div>`}<div class="advice-box"><h3>${safe(advice.headline)}</h3><ul>${advice.notes.map(note => `<li>${safe(note)}</li>`).join('')}</ul></div>` : ''}
      <p class="note">未查询或未加入的未知菜名暂不计入热量；可用模型估算、搜索目录菜、手动添加食材或录入自定义食物。家常菜按示例食材和用油估算。</p><button class="primary-button" data-action="save-meal">${editingMealId ? '保存修改' : '保存这餐'}</button>${editingMealId ? '<button class="text-button cancel-edit" data-action="cancel-record-edit">取消修改</button>' : ''}</section>`;
  }
  function renderBodyChart() {
    const metric = core.BODY_METRICS.find(item => item.key === bodyChartMetric) || core.BODY_METRICS[0];
    const series = core.bodyMetricSeries(state, metric.key);
    const tabs = `<div class="body-chart-tabs" aria-label="选择图表指标">${core.BODY_METRICS.map(item => `<button type="button" data-body-metric="${item.key}" class="${item.key === metric.key ? 'active' : ''}" aria-pressed="${item.key === metric.key}">${item.label}</button>`).join('')}</div>`;
    if (!series.length) return `<div class="body-chart-panel"><div class="sheet-header"><h2>身体数据趋势</h2><small>按记录日期</small></div>${tabs}<p class="empty-hint">还没有${metric.label}数据。填入并保存后，这里会显示变化。</p></div>`;
    const values = series.map(point => point.value);
    const low = Math.min(...values), high = Math.max(...values);
    const pad = Math.max((high - low) * .15, metric.key === 'weightKg' ? .5 : 1);
    const lower = low - pad, upper = high + pad;
    const start = new Date(series[0].date + 'T12:00:00').getTime();
    const end = new Date(series[series.length - 1].date + 'T12:00:00').getTime();
    const points = series.map(point => {
      const time = new Date(point.date + 'T12:00:00').getTime();
      return { ...point, x: series.length === 1 ? 160 : 42 + (time - start) / (end - start) * 248,
        y: 147 - (point.value - lower) / (upper - lower) * 112 };
    });
    const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const firstDate = series[0].date.slice(5).replace('-', '/');
    const lastDate = series[series.length - 1].date.slice(5).replace('-', '/');
    const latest = series[series.length - 1];
    const labels = `<text x="8" y="31">${upper.toFixed(1)}</text><text x="8" y="151">${lower.toFixed(1)}</text><text x="42" y="184">${firstDate}</text>${series.length > 1 ? `<text x="290" y="184" text-anchor="end">${lastDate}</text>` : ''}`;
    const svg = `<svg viewBox="0 0 320 195" role="img" aria-label="${metric.label}趋势，${series.length}条记录，最新${latest.value}${metric.unit}"><path class="chart-grid" d="M 42 35 H 290 M 42 91 H 290 M 42 147 H 290"/><path class="chart-line" d="${line}"/>${points.map(point => `<circle class="chart-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4.5"><title>${point.date}：${point.value} ${metric.unit}</title></circle>`).join('')}${labels}</svg>`;
    return `<div class="body-chart-panel"><div class="sheet-header"><h2>身体数据趋势</h2><small>${series.length} 次记录</small></div>${tabs}<div class="body-chart-summary"><span>最新 ${latest.date.slice(5)}</span><strong>${latest.value}<small> ${metric.unit}</small></strong></div>${svg}<div class="body-chart-values">${series.slice(-5).reverse().map(point => `<div><time>${point.date}</time><span>${point.value} ${metric.unit}</span></div>`).join('')}</div></div>`;
  }
  function renderBodyMeasurements() {
    const saved = state.bodyMeasurements.find(entry => entry.date === bodyDate);
    return `<div class="body-record-sheet"><div class="sheet-header"><h2>身体数据</h2><small>想记时再填</small></div>
      <p class="note">每天可只记其中几项；同一天再次保存会更新这一天的数据。</p>
      <label class="body-date"><span class="field-label">记录日期</span><input class="field-control" type="date" id="body-date" max="${nowKey()}" value="${safe(bodyDate)}"></label>
      <div class="body-field-grid">${core.BODY_METRICS.map(metric => `<label><span class="field-label">${metric.label} <small>${metric.unit}</small></span><input class="field-control" type="number" inputmode="decimal" min="${metric.min}" max="${metric.max}" step="0.1" data-body-field="${metric.key}" value="${safe(bodyDraft[metric.key] ?? '')}" placeholder="可留空"></label>`).join('')}</div>
      <div class="body-actions"><button type="button" class="primary-button" data-action="save-body">${saved ? '更新这天数据' : '保存身体数据'}</button>${saved ? '<button type="button" class="text-button" data-action="delete-body">删除这天数据</button>' : ''}</div>
      <button type="button" class="body-chart-toggle" data-action="toggle-body-chart" aria-expanded="${bodyChartOpen}">${bodyChartOpen ? '收起趋势图' : '生成趋势图'}</button>
      </div>${bodyChartOpen ? renderBodyChart() : ''}`;
  }
  function renderHistoryEntry(item) {
    const meal = item.kind === 'meal';
    const label = meal ? safe(item.type) + ' · ' + safe(item.text || item.items.map(x => x.name).join('、')) : safe(item.planName);
    const detail = meal ? mealFigure(item.items) : workoutDetail(item) + (Array.isArray(item.cardio) && item.cardio.length ? ' · ' + workoutFigure(item) : '');
    return `<div class="history-row"><div class="history-mark ${meal ? 'food' : ''}">${meal ? '餐' : '练'}</div>
      <div class="history-body"><strong>${label}</strong><small>${recordTime(item)} · ${detail}</small></div>
      <div class="history-actions"><button type="button" class="text-button" data-reuse-${meal ? 'meal' : 'workout'}="${safe(item.id)}">复用</button><button type="button" class="text-button" data-edit-record="${item.kind}:${safe(item.id)}">修改</button><button type="button" class="danger-button" data-delete="${item.kind}:${safe(item.id)}">删除</button></div></div>`;
  }
  function renderWeekOverview() {
    const week = core.getWeekOverview(state, nowKey(), weekOffset);
    const firstWeight = week.recordedWeights[0];
    const lastWeight = week.recordedWeights[week.recordedWeights.length - 1];
    const difference = firstWeight && lastWeight ? Math.round((lastWeight.value - firstWeight.value) * 10) / 10 : 0;
    const weightText = week.recordedWeights.length > 1
      ? `体重记录：${firstWeight.value} → ${lastWeight.value} kg（${difference > 0 ? '+' : ''}${difference} kg，按本周首末两次记录）`
      : firstWeight ? `体重记录：${firstWeight.value} kg（本周仅 1 次）` : '本周还没有体重记录';
    return `<div class="week-panel"><div class="week-heading"><div><h2>每周总览</h2><small>${week.start} 至 ${week.end}</small></div>
      <div class="week-controls"><button type="button" data-week-step="-1" aria-label="上一周">‹</button><button type="button" data-week-step="1" aria-label="下一周" ${weekOffset === 0 ? 'disabled' : ''}>›</button></div></div>
      <div class="week-stats"><div><strong>${week.strengthCount}<small> / 4 次</small></strong><span>力量训练</span></div><div><strong>${week.mealDays}<small> 天 · ${week.mealCount} 餐</small></strong><span>饮食已记</span></div>
      <div><strong>${week.estimatedCount ? `${week.range.min}–${week.range.max}` : '—'}<small> kcal</small></strong><span>已记餐食热量</span></div><div><strong>${week.estimatedCount ? week.protein : '—'}<small> g</small></strong><span>已记蛋白质</span></div></div>
      <p class="week-weight">${weightText}${week.cardioCount ? ` · 有氧 ${week.cardioCount} 次` : ''}</p>
      <div class="week-days">${week.days.map(day => {
        const weekday = new Date(day.date + 'T12:00:00').toLocaleDateString('zh-CN', { weekday: 'short' });
        const mealText = day.meals.length ? `${day.meals.length} 餐 · ${day.estimatedCount ? `${day.range.min}–${day.range.max} kcal` : '待估算'}${day.unknownCount ? ' · 部分待估' : ''}` : day.date > nowKey() ? '尚未到来' : '饮食未记';
        const details = [day.estimatedCount ? `蛋白质 ${day.totals.protein}g` : '', day.workouts.length ? `训练 ${day.workouts.length} 次` : '', day.weightKg != null ? `体重 ${day.weightKg}kg` : ''].filter(Boolean).join(' · ');
        return `<div class="week-day"><div class="week-day-date"><strong>${weekday}</strong><small>${day.date.slice(5)}</small></div><div class="week-day-info"><strong>${mealText}</strong>${details ? `<small>${details}</small>` : ''}</div></div>`;
      }).join('')}</div>
      <p class="note">只统计已记录且可估算的餐食；漏记的日子不会按 0 千卡计算。力量训练以每周 4 次为个人目标。</p></div>`;
  }
  function renderHistory() {
    const entries = [...state.workouts.map(x => ({ ...x, kind: 'workout' })), ...state.meals.map(x => ({ ...x, kind: 'meal' }))].sort(core.newestRecordFirst);
    const groups = [...new Set(entries.map(x => x.date))];
    return `<section class="page">${heading('我的记录', '身体数据、训练和饮食按天回看。')}${renderWeekOverview()}${renderBodyMeasurements()}
      <div class="section-head"><h2>训练与饮食</h2><span>按天回看</span></div>
      ${entries.length ? groups.map(day => `<div class="history-date">${safe(day)} · ${dayLabel(day)}</div>${entries.filter(x => x.date === day).map(renderHistoryEntry).join('')}`).join('') : '<div class="plain-card empty-hint">还没有训练或饮食记录。完成一次训练或记一餐后，就会出现在这里。</div>'}</section>`;
  }
  function renderModelSettings() {
    const c = aiConfig;
    const field = (label, key, value, placeholder = '') => `<label><span class="field-label">${label}</span><input class="field-control" data-ai-config="${key}" value="${safe(value)}" placeholder="${safe(placeholder)}" autocomplete="off" spellcheck="false"></label>`;
    const textarea = (label, key, value, placeholder = '') => `<label><span class="field-label">${label}</span><textarea class="field-control textarea ai-json" data-ai-config="${key}" placeholder="${safe(placeholder)}" spellcheck="false">${safe(value)}</textarea></label>`;
    return `<div class="sheet ai-settings"><div class="sheet-header"><h2>大模型接口</h2><small>自己选择服务商</small></div>
      <p class="note">填写服务商提供的接口地址和模型名。兼容 Chat Completions 的接口可直接使用；其他 JSON 接口可用自定义请求体。是否支持网页搜索由服务商决定。</p>
      <label><span class="field-label">接口格式</span><select class="field-control" data-ai-config="protocol"><option value="chat" ${c.protocol === 'chat' ? 'selected' : ''}>Chat Completions 兼容接口</option><option value="responses" ${c.protocol === 'responses' ? 'selected' : ''}>Responses 接口</option><option value="custom" ${c.protocol === 'custom' ? 'selected' : ''}>自定义 JSON 接口</option></select></label>
      ${field('接口地址', 'endpoint', c.endpoint, c.protocol === 'chat' ? 'https://服务商地址/v1' : c.protocol === 'responses' ? 'https://服务商地址/v1' : 'https://服务商地址/完整路径')}
      ${field('模型名称', 'model', c.model, '填写服务商的模型 ID')}
      <label><span class="field-label">API Key（无 Key 接口可留空）</span><input class="field-control" type="password" id="ai-api-key" value="${safe(aiKey)}" autocomplete="off" spellcheck="false" placeholder="填写你的 API Key"></label>
      <label class="ai-check"><input type="checkbox" id="ai-remember-key" ${rememberAiKey ? 'checked' : ''}><span>在本机记住 API Key，关闭 App 后仍可使用</span></label>
      ${c.protocol === 'responses' ? `<label class="ai-check"><input type="checkbox" data-ai-config="webSearch" ${c.webSearch ? 'checked' : ''}><span>请求网页搜索工具，并要求返回来源</span></label>${textarea('附加请求参数（JSON，可选）', 'extraBody', c.extraBody, '{"store":false}')}` : ''}
      ${c.protocol === 'chat' ? `${textarea('附加请求参数（JSON，可选）', 'extraBody', c.extraBody, '{"enable_search":true}')}<p class="note">例如部分服务商用 enable_search 开启搜索。请按该服务商文档填写；返回的来源链接仍需核对。</p>` : ''}
      ${c.protocol === 'custom' ? `<label><span class="field-label">鉴权方式</span><select class="field-control" data-ai-config="authMode"><option value="bearer" ${c.authMode === 'bearer' ? 'selected' : ''}>Authorization: Bearer</option><option value="xApiKey" ${c.authMode === 'xApiKey' ? 'selected' : ''}>x-api-key</option><option value="xGoogApiKey" ${c.authMode === 'xGoogApiKey' ? 'selected' : ''}>x-goog-api-key</option><option value="none" ${c.authMode === 'none' ? 'selected' : ''}>不自动添加鉴权头</option></select></label>${textarea('自定义请求头（JSON，可选）', 'customHeaders', c.customHeaders, '{"anthropic-version":"2023-06-01"}')}${textarea('请求体模板（JSON）', 'requestTemplate', c.requestTemplate, modelGateway.CUSTOM_TEMPLATE)}${field('结果文本路径', 'responsePath', c.responsePath, '例如 content.0.text')}<p class="note">模板支持 {{model}}、{{dish}}、{{prompt}}；接口地址也支持 {{model}}。结果路径按接口响应 JSON 填写，如 candidates.0.content.parts.0.text。复杂签名或流式接口可能需要专门适配。</p>` : ''}
      <p class="note">填写的 Key 立即用于当前会话；勾选上方选项并点“保存接口设置”后，Key 才会留在本机。它不进入餐食备份；清除应用数据会删除它。请求只发送菜名和估算指令，不发送照片、个人资料或整餐记录。</p>
      <button type="button" class="primary-button" data-action="save-ai-config">保存接口设置</button>
      <button type="button" class="secondary-button" data-action="clear-ai-key">清除 API Key</button></div>`;
  }
  function renderProfile() {
    const p = state.profile;
    const ref = core.getReference(p);
    return `<section class="page">${heading('个人设置', '基础资料只填一次，随时可以调整。')}
      <div class="reference-box"><small>每日摄入参考</small><strong>${ref ? ref.min + '–' + ref.max + ' 千卡' : '尚未设置'}</strong><p>${ref ? '用于对照已记录的全天饮食；食物估算误差较大，请勿当作精确目标。' : '填写下方资料后生成粗略参考，也可以直接填自己的参考值。'}</p></div>
      <div class="sheet"><div class="profile-grid"><label><span class="field-label">年龄</span><input class="field-control" type="number" min="18" max="100" data-profile="age" value="${safe(p.age)}"></label><label><span class="field-label">身高 cm</span><input class="field-control" type="number" min="120" max="230" data-profile="heightCm" value="${safe(p.heightCm)}"></label><label><span class="field-label">当前体重 kg</span><input class="field-control" type="number" min="30" max="300" step="0.1" data-profile="weightKg" value="${safe(p.weightKg)}"></label><label><span class="field-label">公式参数</span><select class="field-control" data-profile="formulaSex"><option value="" ${!p.formulaSex ? 'selected' : ''}>暂不选择</option><option value="male" ${p.formulaSex === 'male' ? 'selected' : ''}>男性公式</option><option value="female" ${p.formulaSex === 'female' ? 'selected' : ''}>女性公式</option></select></label><label class="span-2"><span class="field-label">日常活动量</span><select class="field-control" data-profile="activity"><option value="low" ${p.activity === 'low' ? 'selected' : ''}>较低 · 久坐为主</option><option value="moderate" ${p.activity === 'moderate' ? 'selected' : ''}>中等 · 每周训练约 4 次</option><option value="high" ${p.activity === 'high' ? 'selected' : ''}>较高 · 训练之外也经常活动</option></select></label><label class="span-2"><span class="field-label">自行设置每日参考千卡（可选，优先使用）</span><input class="field-control" type="number" min="1" data-profile="dailyReference" value="${safe(p.dailyReference)}" placeholder="留空则使用基础资料粗估"></label></div><button class="primary-button" data-action="save-profile">保存设置</button></div>
      ${renderModelSettings()}
      <div class="sheet"><div class="sheet-header"><h2>本地数据</h2><small>记录留在本机</small></div><p class="note">网页和安装包的记录各自保存在本机。可先在网页导出 JSON 备份，再在安装包内导入。导入会替换当前设备现有记录；模型查询只发送主动输入的菜名和估算指令。</p><div class="food-add"><button type="button" class="secondary-button" data-action="export-backup">导出备份</button><button type="button" class="secondary-button" data-action="choose-backup">导入备份</button><input id="backup-file" type="file" accept=".json,application/json" hidden></div></div>
      <p class="note">这里的体重用于每日摄入参考的粗略估算。体重趋势请在“记录”页单独填写；每日记录不会自动修改这里的设置。</p></section>`;
  }
  function render() {
    main.innerHTML = ({ home: renderHome, workout: renderWorkout, meal: renderMeal, history: renderHistory, profile: renderProfile }[view] || renderHome)();
    document.querySelectorAll('.bottom-nav [data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  }
  function navigate(next) { view = next; render(); window.scrollTo(0, 0); }
  function desktopModelFetch(url, options) {
    return fetch('/api/model-proxy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, headers: options.headers, body: options.body }), signal: options.signal
    });
  }
  async function searchUnknownDish(name, target) {
    if (aiBusy) return;
    if (!aiConfig.endpoint.trim() || !aiConfig.model.trim()) { navigate('profile'); toast('请先填写模型接口地址和名称'); return; }
    aiBusy = true; aiError = ''; aiResult = null; aiTarget = target;
    view = 'meal'; render();
    const desktopPreview = window.location?.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(window.location.hostname);
    try { aiResult = await modelGateway.searchDish(name, { ...aiConfig, apiKey: aiKey }, desktopPreview ? desktopModelFetch : undefined); }
    catch (error) { aiError = error.message || '模型查询失败，请重试'; }
    finally { aiBusy = false; render(); }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.view) return navigate(button.dataset.view);
    if (button.dataset.weekStep) { weekOffset = Math.min(0, weekOffset + Number(button.dataset.weekStep)); render(); return; }
    if (button.dataset.reuseMeal) {
      const meal = state.meals.find(item => item.id === button.dataset.reuseMeal);
      return meal ? reuseMeal(meal, view === 'history') : toast('这餐已不存在');
    }
    if (button.dataset.reuseWorkout) {
      const workout = state.workouts.find(item => item.id === button.dataset.reuseWorkout);
      return workout ? reuseWorkout(workout, view === 'history') : toast('这次训练已不存在');
    }
    if (button.dataset.editRecord) {
      const [kind, id] = button.dataset.editRecord.split(':');
      const item = state[kind === 'meal' ? 'meals' : 'workouts'].find(record => record.id === id);
      if (!item) return toast('这条记录不存在');
      return kind === 'meal' ? beginMealEdit(item) : beginWorkoutEdit(item);
    }
    if (button.dataset.workoutMode) { workoutMode = button.dataset.workoutMode; editingPlan = false; workoutDraftDirty = true; return render(); }
    if (button.dataset.plan !== undefined) { selectedPlan = Number(button.dataset.plan); reusedWorkoutMeta = null; editingPlan = false; initWorkoutDraft(); return render(); }
    if (button.dataset.removeCardio !== undefined) { cardioDraft.splice(Number(button.dataset.removeCardio), 1); workoutDraftDirty = true; return render(); }
    if (button.dataset.addWorkoutSet !== undefined) {
      const exercise = workoutDraft[Number(button.dataset.addWorkoutSet)];
      if (exercise) exercise.sets.push({ reps: '', weight: '', done: true });
      workoutDraftDirty = true;
      return render();
    }
    if (button.dataset.removeWorkoutExercise !== undefined) { workoutDraft.splice(Number(button.dataset.removeWorkoutExercise), 1); workoutDraftDirty = true; return render(); }
    if (button.dataset.mealType) { mealDraft.type = button.dataset.mealType; return render(); }
    if (button.dataset.removeFood !== undefined) { const index = Number(button.dataset.removeFood); mealDraft.items.splice(index, 1); expandedRecipe = -1; return render(); }
    if (button.dataset.editRecipe !== undefined) { const index = Number(button.dataset.editRecipe); const item = mealDraft.items[index]; if (!item.customRecipe) { item.customRecipe = editableRecipe(item); item.recipeBaseGrams = number(item.grams); } expandedRecipe = expandedRecipe === index ? -1 : index; return render(); }
    if (button.dataset.resetRecipe !== undefined) { const index = Number(button.dataset.resetRecipe); delete mealDraft.items[index].customRecipe; delete mealDraft.items[index].recipeBaseGrams; return render(); }
    if (button.dataset.catalogCategory !== undefined) { catalogCategory = button.dataset.catalogCategory; catalogLimit = 8; refreshCatalogResults(); return; }
    if (button.dataset.catalogCuisine !== undefined) { catalogCuisine = button.dataset.catalogCuisine; catalogLimit = 8; refreshCatalogResults(); return; }
    if (button.dataset.catalogAdd !== undefined) { const dish = catalog.dishes.find(x => x.id === button.dataset.catalogAdd); if (!dish) return; mealDraft.items.push(catalog.makeItem(dish)); render(); toast(`已加入${dish.name}，请核对克数`); return; }
    if (button.dataset.addCustomFood !== undefined) {
      const food = state.customFoods.find(item => item.id === button.dataset.addCustomFood);
      if (!food) return;
      mealDraft.items.push(core.customFoodItem(food)); render(); toast(`已加入${food.name}，请核对克数`); return;
    }
    if (button.dataset.editCustomFood !== undefined) {
      const food = state.customFoods.find(item => item.id === button.dataset.editCustomFood);
      if (!food) return;
      editingCustomFoodId = food.id; customFoodOpen = true;
      customFoodDraft = { name: food.name, defaultGrams: String(food.defaultGrams),
        ...Object.fromEntries(Object.entries(food.nutrition).map(([key, value]) => [key, String(value)])) };
      render(); return;
    }
    if (button.dataset.deleteCustomFood !== undefined) {
      const food = state.customFoods.find(item => item.id === button.dataset.deleteCustomFood);
      if (!food || !window.confirm(`从我的食物库删除“${food.name}”？已保存的餐食不会改变。`)) return;
      const previous = state.customFoods;
      state.customFoods = previous.filter(item => item.id !== food.id);
      if (!persist()) { state.customFoods = previous; return; }
      if (editingCustomFoodId === food.id) { editingCustomFoodId = ''; customFoodOpen = false; }
      render(); toast('已从食物库删除'); return;
    }
    if (button.dataset.bodyMetric !== undefined) { bodyChartMetric = button.dataset.bodyMetric; render(); return; }
    if (button.dataset.aiUnknown !== undefined) { const item = mealDraft.items[Number(button.dataset.aiUnknown)]; if (item) searchUnknownDish(item.name, item); return; }
    if (button.dataset.delete) {
      const [kind, id] = button.dataset.delete.split(':');
      if (!window.confirm('删除这条记录？')) return;
      const field = kind === 'meal' ? 'meals' : 'workouts';
      const previous = state[field];
      state[field] = previous.filter(x => x.id !== id);
      if (!persist()) { state[field] = previous; return; }
      if (editingMealId === id) stopMealEdit();
      if (editingWorkoutId === id) stopWorkoutEdit();
      render(); return;
    }
    const action = button.dataset.action;
    if (action === 'cancel-record-edit') {
      if (editingMealId) stopMealEdit();
      if (editingWorkoutId) stopWorkoutEdit();
      navigate('history'); return;
    }
    if (action === 'cancel-workout-reuse') {
      reusedWorkoutMeta = null; selectedPlan = core.nextPlanIndex(state); workoutDraft = null;
      cardioDraft = []; cardioWeightKg = state.profile.weightKg || ''; workoutDraftDirty = false;
      render(); return;
    }
    if (action === 'add-workout-exercise') {
      workoutDraft.push({ id: 'manual-' + Date.now(), name: '新动作', sets: [{ reps: '', weight: '', done: true }] });
      workoutDraftDirty = true;
      render(); return;
    }
    if (action === 'new-custom-food') {
      customFoodOpen = !customFoodOpen; editingCustomFoodId = '';
      customFoodDraft = { name: '', defaultGrams: '100', kcal: '', protein: '', carbs: '', fat: '' };
      render(); return;
    }
    if (action === 'save-custom-food') {
      const previous = state.customFoods;
      const adding = !editingCustomFoodId;
      let food;
      try { food = core.saveCustomFood(state, customFoodDraft, editingCustomFoodId); }
      catch (error) { toast(error.message); return; }
      if (!persist()) { state.customFoods = previous; return; }
      if (adding) mealDraft.items.push(core.customFoodItem(food));
      customFoodOpen = false; editingCustomFoodId = '';
      customFoodDraft = { name: '', defaultGrams: '100', kcal: '', protein: '', carbs: '', fat: '' };
      render(); toast(adding ? '已保存到食物库并加入这餐' : '食物库已更新'); return;
    }
    if (action === 'toggle-body-chart') { bodyChartOpen = !bodyChartOpen; render(); return; }
    if (action === 'save-body') {
      const previous = state.bodyMeasurements;
      try { core.saveBodyMeasurement(state, bodyDate, bodyDraft); }
      catch (error) { toast(error.message); return; }
      if (!persist()) { state.bodyMeasurements = previous; return; }
      bodyDraft = { ...state.bodyMeasurements.find(entry => entry.date === bodyDate) };
      render(); toast('身体数据已保存'); return;
    }
    if (action === 'delete-body') {
      if (!window.confirm('删除这一天的身体数据？')) return;
      const previous = state.bodyMeasurements;
      state.bodyMeasurements = previous.filter(entry => entry.date !== bodyDate);
      if (!persist()) { state.bodyMeasurements = previous; return; }
      bodyDraft = {};
      render(); toast('这天的身体数据已删除'); return;
    }
    if (action === 'edit-plan') { editingPlan = true; return render(); }
    if (action === 'add-cardio') { const activity = exerciseEnergy.ACTIVITIES[0]; cardioDraft.push({ activityId: activity.id, optionId: activity.options[1].id, minutes: 30 }); workoutDraftDirty = true; return render(); }
    if (action === 'add-exercise') { state.plan[selectedPlan].exercises.push({ id: 'x-' + Date.now(), name: '新动作', sets: 3, reps: 10 }); return render(); }
    if (action === 'save-plan') { state.plan[selectedPlan].name = state.plan[selectedPlan].name.trim() || '训练'; state.plan[selectedPlan].exercises.forEach(x => { x.name = x.name.trim() || '未命名动作'; x.sets = Math.min(12, Math.max(1, number(x.sets))); }); persist(); editingPlan = false; initWorkoutDraft(); render(); return toast('模板已保存'); }
    if (action === 'save-workout') {
      if (!core.validRecordDate(workoutDate)) return toast('请选择今天或更早的有效训练日期');
      const exercises = workoutMode === 'strength' ? workoutDraft.map(x => ({ id: x.id, name: String(x.name || '').trim(), sets: x.sets.filter(s => s.done).map(s => ({ reps: number(s.reps), weight: s.weight === '' ? '' : number(s.weight) })) })).filter(x => x.sets.length) : [];
      if (exercises.some(x => !x.name || x.sets.some(set => set.reps <= 0))) return toast('请填写动作名称和已完成组的次数');
      const cardio = cardioDraft.map(entry => exerciseEnergy.estimate(entry.activityId, entry.optionId, entry.minutes, cardioWeightKg, entry));
      if (cardio.some(entry => !entry)) return toast('请填写有效的有氧时长和估算体重');
      if (!exercises.length && !cardio.length) return toast('请至少记录一组力量训练或一项有氧');
      const plan = state.plan[selectedPlan];
      const hasStrength = exercises.length > 0;
      const existing = editingWorkoutId ? state.workouts.find(item => item.id === editingWorkoutId) : null;
      if (editingWorkoutId && !existing) return toast('原训练记录已不存在');
      const planId = hasStrength ? (existing ? existing.planId || '' : reusedWorkoutMeta ? reusedWorkoutMeta.planId : plan.id) : '';
      const baseName = existing ? (existing.planId ? existing.planName.replace(/＋有氧$/, '') : '力量训练')
        : reusedWorkoutMeta ? reusedWorkoutMeta.planName.replace(/＋有氧$/, '') : plan.name;
      const updated = { ...existing, id: existing ? existing.id : 'w-' + Date.now(), date: workoutDate,
        createdAt: existing ? existing.createdAt : Date.now(), planId,
        planName: hasStrength ? baseName + (cardio.length ? '＋有氧' : '') : '有氧训练',
        focus: hasStrength ? (existing?.planId ? existing.focus : existing ? '力量' : reusedWorkoutMeta ? reusedWorkoutMeta.focus : plan.focus) : '有氧',
        exercises, cardio, cardioWeightKg: cardio.length ? number(cardioWeightKg) : '' };
      if (existing) updated.updatedAt = Date.now();
      const previous = state.workouts;
      state.workouts = existing ? previous.map(item => item.id === existing.id ? updated : item) : [updated, ...previous];
      if (!persist()) { state.workouts = previous; return; }
      const backfilledWorkout = workoutDate !== nowKey();
      if (existing) {
        stopWorkoutEdit();
        if (!workoutDraft) selectedPlan = core.nextPlanIndex(state);
      } else { selectedPlan = core.nextPlanIndex(state); workoutDraft = null; cardioDraft = []; workoutDate = nowKey(); reusedWorkoutMeta = null; workoutDraftDirty = false; }
      navigate(existing || backfilledWorkout ? 'history' : 'home'); toast(existing ? '训练记录已更新' : '训练已保存'); return;
    }
    if (action === 'parse-meal') { expandedRecipe = -1; mealDraft.items = catalog.parseText(mealDraft.text); const result = core.calculateMeal(mealDraft.items); render(); toast(result.unknownCount ? `已拆解 ${result.estimatedCount} 道，${result.unknownCount} 道待估算` : result.estimatedCount ? `已拆解 ${result.estimatedCount} 道，请核对份量` : '请先写下食物或菜名'); return; }
    if (action === 'ai-search') { searchUnknownDish(catalogQuery, null); return; }
    if (action === 'ai-add' && aiResult) {
      const index = aiTarget ? mealDraft.items.indexOf(aiTarget) : -1;
      if (index >= 0) { if (number(aiTarget.grams) > 0) aiResult.grams = number(aiTarget.grams); mealDraft.items[index] = aiResult; }
      else mealDraft.items.push(aiResult);
      aiResult = null; aiTarget = null; expandedRecipe = -1; render(); toast('已加入这餐，请核对份量'); return;
    }
    if (action === 'save-ai-config') {
      if (!persistModelConfig()) return;
      try {
        if (rememberAiKey && aiKey) localStorage.setItem('fitday-model-key', aiKey);
        else localStorage.removeItem('fitday-model-key');
        if (aiKey) sessionStorage.setItem('fitday-model-key', aiKey);
        else sessionStorage.removeItem('fitday-model-key');
      } catch (_) { toast('API Key 保存失败，请检查本机存储空间'); return; }
      toast(rememberAiKey && aiKey ? '接口设置和 API Key 已保存在本机' : '接口设置已保存；API Key 仅用于当前会话');
      return;
    }
    if (action === 'clear-ai-key') { aiKey = ''; rememberAiKey = false; try { sessionStorage.removeItem('fitday-model-key'); sessionStorage.removeItem('fitday-openai-key'); localStorage.removeItem('fitday-model-key'); } catch (_) {} render(); toast('API Key 已从本机清除'); return; }
    if (action === 'catalog-more') { catalogLimit += 12; refreshCatalogResults(); return; }
    if (action === 'add-food') { const [kind, id] = document.getElementById('food-select').value.split(':'); const entered = number(document.getElementById('food-grams').value); if (kind === 'dish') { const dish = core.DISH_LIST.find(x => x.id === id); mealDraft.items.push(core.makeDishItem(dish, entered)); } else { const food = core.FOOD_LIST.find(x => x.id === id); mealDraft.items.push({ foodId: food.id, name: food.name, grams: entered || food.defaultGrams }); } return render(); }
    if (action === 'save-meal') {
      if (!core.validRecordDate(mealDate)) return toast('请选择今天或更早的有效用餐日期');
      if (!mealDraft.items.length) return toast('请先识别或添加食物');
      const existing = editingMealId ? state.meals.find(item => item.id === editingMealId) : null;
      if (editingMealId && !existing) return toast('原餐食记录已不存在');
      const updated = { ...existing, id: existing ? existing.id : 'm-' + Date.now(), date: mealDate,
        createdAt: existing ? existing.createdAt : Date.now(), type: mealDraft.type, text: mealDraft.text.trim(),
        items: copy(mealDraft.items), photo: mealDraft.photo };
      if (existing) updated.updatedAt = Date.now();
      const previous = state.meals;
      state.meals = existing ? previous.map(item => item.id === existing.id ? updated : item) : [updated, ...previous];
      if (!persist()) { state.meals = previous; return; }
      const backfilledMeal = mealDate !== nowKey();
      if (existing) stopMealEdit();
      else { expandedRecipe = -1; mealDraft = { type: '午餐', text: '', items: [], photo: '' }; mealDate = nowKey(); }
      navigate(existing || backfilledMeal ? 'history' : 'home'); toast(existing ? '餐食记录已更新' : '这餐已保存'); return;
    }
    if (action === 'save-profile') { persist(); render(); return toast('设置已保存'); }
    if (action === 'export-backup') {
      const blob = new Blob([localBackup.exportState(state)], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href; link.download = `lianshi-backup-${nowKey()}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 60000);
      return toast('备份文件已生成，请在下载目录查看');
    }
    if (action === 'choose-backup') { document.getElementById('backup-file').click(); return; }
  });
  document.addEventListener('input', event => {
    const el = event.target;
    if (el.dataset.customFoodField !== undefined) customFoodDraft[el.dataset.customFoodField] = el.value;
    if (el.dataset.bodyField !== undefined) bodyDraft[el.dataset.bodyField] = el.value;
    if (el.id === 'meal-text') mealDraft.text = el.value;
    if (el.id === 'catalog-search') { catalogQuery = el.value; catalogCategory = '全部'; catalogCuisine = '全部地区'; catalogLimit = 8; refreshCatalogResults(); }
    if (el.id === 'ai-api-key') { aiKey = el.value.trim(); try { if (aiKey) sessionStorage.setItem('fitday-model-key', aiKey); else sessionStorage.removeItem('fitday-model-key'); } catch (_) {} }
    if (el.dataset.aiConfig && el.type !== 'checkbox' && el.tagName !== 'SELECT') { aiConfig[el.dataset.aiConfig] = el.value; persistModelConfig(); }
    if (el.dataset.foodGrams !== undefined) mealDraft.items[Number(el.dataset.foodGrams)].grams = el.value === '' ? '' : number(el.value);
    if (el.dataset.recipePart !== undefined) { const [i, j] = el.dataset.recipePart.split(':').map(Number); mealDraft.items[i].customRecipe[j].grams = el.value === '' ? 0 : Math.max(0, number(el.value)); }
    if (el.dataset.set) { const [ei, si, key] = el.dataset.set.split(':'); workoutDraft[ei].sets[si][key] = el.type === 'checkbox' ? el.checked : el.value; workoutDraftDirty = true; }
    if (el.dataset.workoutExerciseName !== undefined) { workoutDraft[Number(el.dataset.workoutExerciseName)].name = el.value; workoutDraftDirty = true; }
    if (el.dataset.cardioWeight !== undefined) { cardioWeightKg = el.value; workoutDraftDirty = true; }
    if (el.dataset.cardioMinutes !== undefined) { cardioDraft[Number(el.dataset.cardioMinutes)].minutes = el.value; workoutDraftDirty = true; }
    if (el.dataset.cardioSpeed !== undefined) { cardioDraft[Number(el.dataset.cardioSpeed)].speedKmh = el.value; workoutDraftDirty = true; }
    if (el.dataset.cardioGrade !== undefined) { cardioDraft[Number(el.dataset.cardioGrade)].gradePercent = el.value; workoutDraftDirty = true; }
    if (el.dataset.planField) state.plan[selectedPlan][el.dataset.planField] = el.value;
    if (el.dataset.exerciseName !== undefined) state.plan[selectedPlan].exercises[Number(el.dataset.exerciseName)].name = el.value;
    if (el.dataset.exerciseSets !== undefined) state.plan[selectedPlan].exercises[Number(el.dataset.exerciseSets)].sets = el.value;
    if (el.dataset.profile) state.profile[el.dataset.profile] = el.value;
  });
  document.addEventListener('change', async event => {
    if (event.target.id === 'workout-date') { workoutDate = event.target.value; workoutDraftDirty = true; render(); return; }
    if (event.target.id === 'meal-date') { mealDate = event.target.value; render(); return; }
    if (event.target.id === 'body-date') { bodyDate = event.target.value; bodyDraft = { ...state.bodyMeasurements.find(entry => entry.date === bodyDate) }; render(); return; }
    if (event.target.id === 'ai-remember-key') { rememberAiKey = event.target.checked; return; }
    if (event.target.dataset.aiConfig && (event.target.type === 'checkbox' || event.target.tagName === 'SELECT')) {
      aiConfig[event.target.dataset.aiConfig] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      persistModelConfig();
      if (event.target.dataset.aiConfig === 'protocol') render();
      return;
    }
    if (event.target.id === 'backup-file') {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) return toast('备份文件超过 10 MB，无法导入');
      try {
        const imported = localBackup.importState(await file.text());
        if (!window.confirm(`将导入 ${imported.meals.length} 餐、${imported.workouts.length} 次训练、${imported.bodyMeasurements.length} 天身体数据、${imported.customFoods.length} 个自定义食物，并替换本设备现有记录。确定继续吗？`)) return;
        const previous = state;
        state = imported;
        if (!persist()) { state = previous; return; }
        selectedPlan = core.nextPlanIndex(state); workoutDraft = null; cardioDraft = []; workoutDate = nowKey(); reusedWorkoutMeta = null; workoutDraftDirty = false;
        mealDraft = { type: '午餐', text: '', items: [], photo: '' }; mealDate = nowKey();
        editingMealId = ''; editingWorkoutId = ''; pausedMealDraft = null; pausedWorkoutDraft = null;
        customFoodOpen = false; editingCustomFoodId = '';
        customFoodDraft = { name: '', defaultGrams: '100', kcal: '', protein: '', carbs: '', fat: '' };
        bodyDate = core.dateKey(); bodyDraft = { ...state.bodyMeasurements.find(entry => entry.date === bodyDate) }; bodyChartOpen = false; weekOffset = 0;
        navigate('home'); toast('本地备份已导入');
      } catch (error) { toast(error.message || '备份文件读取失败'); }
      return;
    }
    if (event.target.dataset.set) { const row = event.target.closest('.set-row'); if (row) row.classList.toggle('dimmed', !event.target.checked); }
    if (event.target.dataset.cardioActivity !== undefined) {
      const index = Number(event.target.dataset.cardioActivity);
      const activity = exerciseEnergy.ACTIVITIES.find(x => x.id === event.target.value);
      if (activity) { cardioDraft[index].activityId = activity.id; cardioDraft[index].optionId = activity.options[0].id; workoutDraftDirty = true; }
      render(); return;
    }
    if (event.target.dataset.cardioOption !== undefined) { cardioDraft[Number(event.target.dataset.cardioOption)].optionId = event.target.value; workoutDraftDirty = true; render(); return; }
    if (event.target.dataset.cardioMinutes !== undefined || event.target.dataset.cardioWeight !== undefined ||
      event.target.dataset.cardioSpeed !== undefined || event.target.dataset.cardioGrade !== undefined) { render(); return; }
    if (event.target.dataset.foodGrams !== undefined) {
      const item = mealDraft.items[Number(event.target.dataset.foodGrams)];
      if (item.customRecipe && number(item.grams) > 0 && number(item.recipeBaseGrams) > 0) {
        const factor = number(item.grams) / number(item.recipeBaseGrams);
        item.customRecipe.forEach(part => { part.grams = Math.round(number(part.grams) * factor * 10) / 10; });
        item.recipeBaseGrams = number(item.grams);
      }
      render(); return;
    }
    if (event.target.dataset.recipePart !== undefined) { render(); return; }
    if (event.target.id !== 'meal-photo' || !event.target.files[0]) return;
    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) return toast('请选择图片');
    try {
      const image = new Image(); image.src = URL.createObjectURL(file);
      await image.decode();
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 900 / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      mealDraft.photo = canvas.toDataURL('image/jpeg', .68);
      URL.revokeObjectURL(image.src); render();
    } catch (_) { toast('照片读取失败，请重试'); }
  });
  render();
})();
