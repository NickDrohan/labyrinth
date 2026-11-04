

function collectShieldAt(x, y) {
  if (playerShields >= MAX_SHIELDS) return false;
  const i = aegisShrines.findIndex(a => a.x === x && a.y === y);
  if (i === -1) return false;
  aegisShrines.splice(i, 1);
  playerShields++;
  showBannerMessage('Aegis Shield acquired! (' + playerShields + '/' + MAX_SHIELDS + ')', 'rgba(0,110,60,0.9)');
  updateShieldUI();
  return true;
}

function triggerAegisRepel(isAutoIntercept = false) {
  if (gameWon || gameLost || playerShields <= 0) return false;

  playerShields--;
  minotaurStunnedUntil = Date.now() + MINOTAUR_STUN_MS;
  repelFlashUntil = Date.now() + 600;

  if (minotaurActive && minotaurX >= 0) {
    pushMinotaurBack(MINOTAUR_REPEL_STEPS);
  }

  const msg = isAutoIntercept ? 'Aegis Shield shattered! Minotaur repelled!' : 'Aegis Pulse! Minotaur repelled & stunned!';
  showBannerMessage(msg, 'rgba(0,120,70,0.9)');

  updateShieldUI();
  updateSpoolUI();
  drawMaze();
  return true;
}

function collectIcarusAt(x, y) {
  if (playerFlares >= MAX_FLARES) {
    return false;
  }
  const i = icarusShrines.findIndex(s => s.x === x && s.y === y);
  if (i === -1) {
    return false;
  }
  icarusShrines.splice(i, 1);
  playerFlares++;
  showBannerMessage('Icarus Sun Crystal acquired! (' + playerFlares + '/' + MAX_FLARES + ')', 'rgba(180,120,0,0.92)');
  updateFlareUI();
  return true;
}

function onPlayerFlareStep() {
  collectIcarusAt(playerX, playerY);
  if (solarFlareStepsRemaining > 0) {
    solarFlareStepsRemaining--;
  }
  updateFlareUI();
}

function triggerSolarFlare() {
  if (gameWon || gameLost || playerFlares <= 0 || solarFlareStepsRemaining > 0) {
    return false;
  }
  playerFlares--;
  solarFlareStepsRemaining = SOLAR_FLARE_STEPS;
  solarFlareFlashUntil = Date.now() + 900;
  minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + SOLAR_FLARE_STUN_MS);
  showBannerMessage('Solar Flare ignited! 22-tile vision & Minotaur blinded!', 'rgba(200,140,0,0.92)');
  updateFlareUI();
  updateShieldUI();
  drawMaze();
  return true;
}

function collectDecoyAt(x, y) {
  if (playerDecoys >= MAX_DECOYS) return false;
  const i = orpheusShrines.findIndex(s => s && s.x === x && s.y === y);
  if (i === -1) return false;
  orpheusShrines.splice(i, 1);
  playerDecoys++;
  showBannerMessage('Orpheus Lyre acquired! (' + playerDecoys + '/' + MAX_DECOYS + ')', 'rgba(180,20,100,0.9)');
  updateDecoyUI();
  return true;
}

function activateThreadCompass() {
  if (gameWon || gameLost || playerSpools <= 0 || compassStepsRemaining > 0) return false;
  playerSpools--;
  compassStepsRemaining = COMPASS_EFFECT_STEPS;
  updateSpoolUI();
  drawMaze();
  return true;
}

function collectSpoolAt(x, y) {
  const i = threadSpools.findIndex(s => s.x === x && s.y === y);
  if (i === -1) return false;
  threadSpools.splice(i, 1);
  playerSpools++;
  return true;
}

function onPlayerThreadStep() {
  collectSpoolAt(playerX, playerY);
  collectRecallAt(playerX, playerY);
  collectShieldAt(playerX, playerY);
  if (compassStepsRemaining > 0) compassStepsRemaining--;
  updateSpoolUI();
  updateShieldUI();
  updateRecallUI();
}

function refreshOwlEscapePreview() {
  if (owlStepsRemaining <= 0 || gameWon || gameLost) {
    owlEscapePreview = [];
    return;
  }
  const fullRoute = computePathBetween(playerX, playerY, escapeX, escapeY);
  owlEscapePreview = Array.isArray(fullRoute) ? fullRoute.slice(0, 10) : [];
}

function collectOwlAt(x, y) {
  if (playerOwls >= MAX_OWLS) return false;
  const i = athenaShrines.findIndex(a => a && a.x === x && a.y === y);
  if (i === -1) return false;
  athenaShrines.splice(i, 1);
  playerOwls++;
  showBannerMessage('Athena Owl acquired! (' + playerOwls + '/' + MAX_OWLS + ')', 'rgba(20,75,160,0.92)');
  updateOwlUI();
  return true;
}

function onPlayerOwlStep() {
  collectOwlAt(playerX, playerY);
  if (owlStepsRemaining > 0) {
    owlStepsRemaining--;
    if (owlStepsRemaining > 0) {
      refreshOwlEscapePreview();
    } else {
      owlEscapePreview = [];
    }
  }
  updateOwlUI();
}

function triggerOwlClairvoyance() {
  if (gameWon || gameLost || playerOwls <= 0 || owlStepsRemaining > 0) return false;
  playerOwls--;
  owlStepsRemaining = OWL_VISION_STEPS;
  owlFlashUntil = Date.now() + 700;
  refreshOwlEscapePreview();
  if (minotaurActive && minotaurX >= 0 && minotaurY >= 0 && (Math.abs(minotaurX - playerX) + Math.abs(minotaurY - playerY) <= OWL_GLARE_DIST)) {
    minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + OWL_GLARE_STUN_MS);
    showBannerMessage('Athena Clairvoyance! Escape path revealed & Minotaur dazzled (3s)!', 'rgba(25,90,185,0.92)');
  } else {
    showBannerMessage('Athena Clairvoyance! Escape path, Minotaur trail & relics revealed!', 'rgba(25,90,185,0.92)');
  }
  updateOwlUI();
  updateShieldUI();
  drawMaze();
  return true;
}
