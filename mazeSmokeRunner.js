window.runAllSmokeSpecs = async function () {
  const pre = { playerX, playerY, viewMode, gameLost, gameWon, loop: minotaurInterval !== null };
  const errors = {};
  let m0, thread, decoy, owl, integration, i13, threeBridge;
  try { m0 = await window.collectM0Probe(); } catch (e) { errors.m0 = e && e.message ? e.message : String(e); }
  try { thread = window.runThreadSmokeSpec(); } catch (e) { errors.thread = e && e.message ? e.message : String(e); }
  try { decoy = window.runDecoySmokeSpec(); } catch (e) { errors.decoy = e && e.message ? e.message : String(e); }
  try { owl = window.runOwlSmokeSpec(); } catch (e) { errors.owl = e && e.message ? e.message : String(e); }
  try { integration = window.runIntegrationSmokeSpec(); } catch (e) { errors.integration = e && e.message ? e.message : String(e); }
  try { i13 = window.collectI13Diagnostics(); } catch (e) { errors.i13 = e && e.message ? e.message : String(e); }
  try {
    const apisPresent = typeof window.MazeThreeRenderer === 'object' && typeof window.MazeThreeWorld === 'object' && typeof window.MazeThreeSprites === 'object' && typeof window.MazeThreeBridge === 'object' && typeof window.toggleFpBackend === 'function';
    if (!apisPresent) {
      throw new Error('ThreeBridge APIs missing from window');
    }
    const savedPref = window.MazeThreeBridge.getPreference ? window.MazeThreeBridge.getPreference() : 'three';
    const steps0 = steps, px0 = playerX, py0 = playerY;
    window.toggleFpBackend('pixi');
    const pixiState = getFirstPersonState();
    const pixiOk = pixiState.backend === 'pixi' && pixiState.threePref === 'pixi';
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    const keyToggleOk = window.MazeThreeBridge.getPreference() === 'three' && playerX === px0 && playerY === py0 && steps === steps0;
    window.toggleFpBackend(savedPref);
    if (viewMode !== 'fp') toggleViewMode('fp');
    threeBridge = { apisPresent: true, pixiOk, keyToggleOk, pass: Boolean(pixiOk && keyToggleOk), diagnostics: window.MazeThreeBridge.getDiagnostics() };
  } catch (e) {
    errors.threeBridge = e && e.message ? e.message : String(e);
  }
  const post = { playerX, playerY, viewMode, minotaurIntervalNotNull: minotaurInterval !== null, keydownHandlerInstalled: typeof window._mazeKeydownHandler === 'function' };
  const invalidPrecondition = Boolean(pre.gameLost || pre.gameWon);
  const allPass = !invalidPrecondition && Object.keys(errors).length === 0 &&
    thread && thread.P1 === true && thread.P2 === true && thread.P4 === true && thread.P5 === true && thread.P6 === true && thread.P9 === true && thread.P10 === true && thread.P11 === true && thread.P12 === true &&
    decoy && decoy.D1 === true && decoy.D2 === true && decoy.D3 === true && decoy.D4 === true && (decoy.D5 === true || decoy.D5 === 'skipped') && decoy.D6 === true &&
    owl && owl.O1 === true && owl.O2 === true && owl.O3 === true && owl.O4 === true && owl.O5 === true && owl.O6 === true &&
    integration && integration.I1 === true && integration.I2 === true && integration.I3 === true && integration.I4 === true && integration.I5 === true && integration.I6 === true && integration.I7 === true && integration.I8 === true && integration.I9 === true && integration.I10 === true && integration.I11 === true && integration.I12 === true && integration.I13 === true &&
    Array.isArray(thread.consoleErrors) && thread.consoleErrors.length === 0 &&
    Array.isArray(decoy.consoleErrors) && decoy.consoleErrors.length === 0 &&
    Array.isArray(owl.consoleErrors) && owl.consoleErrors.length === 0 &&
    Array.isArray(integration.consoleErrors) && integration.consoleErrors.length === 0 &&
    i13 && i13.lastI13Detail && i13.lastI13Detail.winRuleFound === true && i13.lastI13Detail.modalPos === 'fixed' && i13.lastI13Detail.modalZ === '1000' &&
    threeBridge && threeBridge.pass === true &&
    post.playerX === pre.playerX && post.playerY === pre.playerY && post.viewMode === 'fp' && post.minotaurIntervalNotNull === true;
  const report = { allPass, pre, m0, thread, decoy, owl, integration, i13, threeBridge, post, errors };
  if (invalidPrecondition) { report.invalidPrecondition = true; report.allPass = false; }
  window.__smokeReport = report;
  return report;
}
window.addEventListener('load', async function () {
  if (new URLSearchParams(window.location.search).get('smoke') === '1') {
    const report = await window.runAllSmokeSpecs();
    const existing = document.getElementById('smokeReport');
    if (existing) { existing.textContent = JSON.stringify(report); }
    else { const preEl = document.createElement('pre'); preEl.id = 'smokeReport'; preEl.textContent = JSON.stringify(report); document.body.appendChild(preEl); }
    document.title = 'SMOKE_DONE ' + document.title;
  }
});
