(function (root, factory) {
  const api = factory(typeof module !== 'undefined' && module.exports ? require('./core.js') : root.FitCore);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FitLocalBackup = api;
})(typeof window !== 'undefined' ? window : globalThis, function (core) {
  'use strict';
  const FORMAT = 'lianshi-local-backup-v1';

  function exportState(state) {
    return JSON.stringify({ format: FORMAT, exportedAt: new Date().toISOString(), state });
  }

  function importState(text) {
    let backup;
    try { backup = JSON.parse(text); }
    catch (_) { throw new Error('备份文件不是有效的 JSON'); }
    const data = backup && backup.state;
    if (backup.format !== FORMAT || !data || !Array.isArray(data.plan) || data.plan.length !== 4 ||
        !data.plan.every(day => day && typeof day.name === 'string' && Array.isArray(day.exercises)) ||
        !Array.isArray(data.meals) || !Array.isArray(data.workouts) || !data.profile || typeof data.profile !== 'object') {
      throw new Error('不是练食导出的备份文件');
    }
    return core.normalizeState(data);
  }

  return { exportState, importState };
});
