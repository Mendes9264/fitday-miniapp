(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FitExerciseEnergy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // MET values and activity codes from the 2024 Adult Compendium of Physical Activities (ages 19-59).
  // https://pacompendium.com/adult-compendium/
  const ACTIVITIES = [
    { id: 'walk', name: '快走', source: 'walking', options: [
      { id: 'steady', label: '约 4.5–5.5 km/h', met: 3.8, code: '17355' },
      { id: 'brisk', label: '约 5.6–6.3 km/h', met: 4.8, code: '17358' },
      { id: 'very-brisk', label: '约 6.4–7.1 km/h', met: 5.8, code: '17361' }
    ] },
    { id: 'incline', name: '跑步机爬坡步行', source: 'walking', options: [
      { id: 'speed-grade', label: '按实际速度和坡度估算', method: 'acsm-walking' }
    ] },
    { id: 'run', name: '跑步', source: 'running', options: [
      { id: 'easy', label: '约 8 km/h', met: 8.5, code: '12030' },
      { id: 'steady', label: '约 9–9.3 km/h', met: 9.0, code: '12045' },
      { id: 'fast', label: '约 9.7–10.1 km/h', met: 9.3, code: '12050' },
      { id: 'faster', label: '约 10.8 km/h', met: 10.5, code: '12060' }
    ] },
    { id: 'swim', name: '游泳', source: 'water-activities', options: [
      { id: 'slow', label: '慢速自由泳', met: 5.8, code: '18240' },
      { id: 'medium', label: '中速爬泳', met: 8.0, code: '18290' },
      { id: 'fast', label: '快速自由泳', met: 9.8, code: '18230' }
    ] },
    { id: 'cycle', name: '骑自行车', source: 'bicycling', options: [
      { id: 'outdoor-easy', label: '户外休闲，低于 16 km/h', met: 4.0, code: '01010' },
      { id: 'outdoor-medium', label: '户外约 19–22 km/h', met: 8.0, code: '01030' },
      { id: 'stationary-light', label: '动感/固定车，约 60 W', met: 5.0, code: '01216' },
      { id: 'stationary-medium', label: '固定车，约 90–100 W', met: 6.0, code: '01220' },
      { id: 'stationary-hard', label: '固定车，约 126–150 W', met: 8.0, code: '01228' }
    ] },
    { id: 'elliptical', name: '椭圆机', source: 'conditioning-exercise', options: [
      { id: 'medium', label: '中等强度', met: 5.0, code: '02048' },
      { id: 'hard', label: '较高强度', met: 9.0, code: '02049' }
    ] },
    { id: 'stairs', name: '爬楼／登阶机', source: 'walking', options: [
      { id: 'slow', label: '爬楼，慢速', met: 4.5, code: '17133' },
      { id: 'general', label: '爬楼，一般', met: 6.8, code: '17131' },
      { id: 'fast', label: '爬楼，快速', met: 9.3, code: '17134' },
      { id: 'machine', label: '登阶机，一般', met: 9.3, code: '02065', source: 'conditioning-exercise' }
    ] },
    { id: 'rowing', name: '划船机', source: 'conditioning-exercise', options: [
      { id: 'medium', label: '低于 100 W，中等', met: 5.0, code: '02071' },
      { id: 'hard', label: '100–149 W，较高', met: 7.5, code: '02072' }
    ] },
    { id: 'rope', name: '跳绳', source: 'conditioning-exercise', options: [
      { id: 'general', label: '连续跳绳', met: 11.0, code: '02068' }
    ] }
  ];

  function find(activityId, optionId) {
    const activity = ACTIVITIES.find(item => item.id === activityId);
    const option = activity && activity.options.find(item => item.id === optionId);
    return option ? { activity, option, sourceUrl: option.method === 'acsm-walking'
      ? 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3656435/'
      : 'https://pacompendium.com/' + (option.source || activity.source) + '/' } : null;
  }

  function estimate(activityId, optionId, minutes, weightKg, details) {
    const match = find(activityId, optionId);
    const duration = Number(minutes), weight = Number(weightKg);
    if (!match || !Number.isFinite(duration) || duration <= 0 || duration > 300 ||
      !Number.isFinite(weight) || weight < 30 || weight > 300) return null;
    let met = match.option.met;
    let speedKmh, gradePercent;
    if (match.option.method === 'acsm-walking') {
      speedKmh = Number(details && details.speedKmh);
      gradePercent = Number(details && details.gradePercent);
      // ACSM treadmill walking equation is intended for roughly 0.89–1.56 m/s.
      if (!Number.isFinite(speedKmh) || speedKmh < 3.2 || speedKmh > 5.6 ||
        !Number.isFinite(gradePercent) || gradePercent < 1 || gradePercent > 15) return null;
      const metresPerMinute = speedKmh * 1000 / 60;
      const oxygenMlKgMin = 3.5 + 0.1 * metresPerMinute + 1.8 * metresPerMinute * gradePercent / 100;
      met = oxygenMlKgMin / 3.5;
    }
    const grossKcal = Math.round(met * weight * duration / 60);
    const activeKcal = Math.round((met - 1) * weight * duration / 60);
    return { activityId, activityName: match.activity.name, optionId,
      optionLabel: match.option.method === 'acsm-walking' ? speedKmh + ' km/h · ' + gradePercent + '% 坡' : match.option.label,
      met: Math.round(met * 10) / 10, method: match.option.method || 'compendium',
      compendiumCode: match.option.code || '', sourceUrl: match.sourceUrl,
      speedKmh: speedKmh || null, gradePercent: gradePercent || null,
      minutes: duration, weightKg: weight, activeKcal, grossKcal };
  }

  return { ACTIVITIES, find, estimate };
});
