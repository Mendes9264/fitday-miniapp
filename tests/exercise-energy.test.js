const test = require('node:test');
const assert = require('node:assert/strict');
const energy = require('../shared/exercise-energy');
const core = require('../shared/core');

test('有氧项目包含指定活动和可追溯来源', () => {
  for (const id of ['walk', 'incline', 'run', 'swim', 'cycle', 'elliptical', 'stairs']) {
    const activity = energy.ACTIVITIES.find(item => item.id === id);
    assert.ok(activity, id);
    for (const option of activity.options) {
      if (option.method === 'acsm-walking') {
        assert.equal(option.id, 'speed-grade');
        assert.ok(energy.find(id, option.id).sourceUrl.includes('pmc.ncbi.nlm.nih.gov'));
      } else {
        assert.ok(option.met > 1 && /^\d{5}$/.test(option.code), id + '/' + option.id);
        assert.ok(energy.find(id, option.id).sourceUrl.startsWith('https://pacompendium.com/'));
      }
    }
  }
});

test('跑步机爬坡按实际速度和坡度计算，不给“较快”虚构配速', () => {
  const result = energy.estimate('incline', 'speed-grade', 30, 70, { speedKmh: 5, gradePercent: 5 });
  assert.equal(result.met, 5.5);
  assert.equal(result.activeKcal, 158);
  assert.equal(result.grossKcal, 193);
  assert.equal(result.speedKmh, 5);
  assert.equal(result.gradePercent, 5);
  assert.equal(result.method, 'acsm-walking');
  assert.equal(energy.estimate('incline', 'speed-grade', 30, 70, { speedKmh: '', gradePercent: 5 }), null);
  assert.equal(energy.estimate('incline', 'speed-grade', 30, 70, { speedKmh: 6, gradePercent: 5 }), null);
});

test('按 MET 体重和有效运动时长计算额外与总热量，不推算无效输入', () => {
  const result = energy.estimate('walk', 'brisk', 30, 70);
  assert.equal(result.met, 4.8);
  assert.equal(result.activeKcal, 133);
  assert.equal(result.grossKcal, 168);
  assert.equal(energy.estimate('walk', 'brisk', 0, 70), null);
  assert.equal(energy.estimate('walk', 'brisk', 30, ''), null);
  assert.equal(energy.estimate('invalid', 'brisk', 30, 70), null);
});

test('单独记录有氧不会推进四天力量模板', () => {
  const state = core.createState();
  state.workouts.push({ createdAt: 2, planId: '', exercises: [], cardio: [energy.estimate('walk', 'brisk', 30, 70)] });
  assert.equal(core.nextPlanIndex(state), 0);
  state.workouts.push({ createdAt: 1, planId: state.plan[0].id, exercises: [{ name: '卧推', sets: [] }], cardio: [] });
  assert.equal(core.nextPlanIndex(state), 1);
});
