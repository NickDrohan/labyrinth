

function canBreachFacingWall() {
  if (!Array.isArray(maze) || maze.length === 0 || !lastMoveDir || typeof lastMoveDir !== 'object') return false;
  const tx = playerX + lastMoveDir.dx;
  const ty = playerY + lastMoveDir.dy;
  return Boolean(ty > 0 && ty < maze.length - 1 && Array.isArray(maze[ty]) && tx > 0 && tx < maze[ty].length - 1 && maze[ty][tx] !== undefined && maze[ty][tx] === 0);
}

function collectHermesAt(x, y) {
  if (playerDashes >= MAX_DASHES) return false;
  const i = hermesShrines.findIndex(h => h.x === x && h.y === y);
  if (i === -1) return false;
  hermesShrines.splice(i, 1);
  playerDashes++;
  showBannerMessage('Winged Sandals! Phase Dash (' + playerDashes + '/' + MAX_DASHES + ')', 'rgba(180,100,0,0.9)');
  updateDashUI();
  return true;
}

function canLandOnTile(tx, ty) {
  if (tx < 0 || tx >= maze[0].length || ty < 0 || ty >= maze.length) return false;
  if (maze[ty][tx] !== 1) return false;
  if (gates.some(g => g.x === tx && g.y === ty)) return playerKeys > 0;
  return true;
}

function triggerPhaseDash() {
  if (gameWon || gameLost || playerDashes <= 0) return false;
  const tx1 = playerX + lastMoveDir.dx;
  const ty1 = playerY + lastMoveDir.dy;
  const tx2 = playerX + 2 * lastMoveDir.dx;
  const ty2 = playerY + 2 * lastMoveDir.dy;
  let landX, landY, dist;
  if (canLandOnTile(tx2, ty2)) {
    landX = tx2; landY = ty2; dist = 2;
  } else if (canLandOnTile(tx1, ty1)) {
    landX = tx1; landY = ty1; dist = 1;
  } else {
    showBannerMessage('Dash blocked! Face an open corridor or thin wall.', 'rgba(140,40,0,0.9)');
    return false;
  }
  playerDashes--;
  dashTrail = [{ x: playerX, y: playerY }, { x: tx1, y: ty1 }, { x: landX, y: landY }];
  dashTrailUntil = Date.now() + 700;
  if (dist === 2 && maze[ty1] && maze[ty1][tx1] === 1 && !gates.some(g => g.x === tx1 && g.y === ty1)) {
    visitedTiles.add(`${tx1},${ty1}`);
    if (!isDecoyLureActive()) {
      minotaurPath.push({ x: tx1, y: ty1 });
    }
    collectRecallAt(tx1, ty1);
    collectBreachAt(tx1, ty1);
    collectIcarusAt(tx1, ty1);
    collectDecoyAt(tx1, ty1);
    collectOwlAt(tx1, ty1);
    collectTridentAt(tx1, ty1);
    collectArrowAt(tx1, ty1);
    collectChariotAt(tx1, ty1);
  }
  const gIdx = gates.findIndex(g => g.x === landX && g.y === landY);
  if (gIdx !== -1) {
    playerKeys--;
    gates.splice(gIdx, 1);
    const kc = document.getElementById('keyCounter');
    if (kc) kc.textContent = 'Keys: ' + playerKeys;
  }
  playerX = landX; playerY = landY; steps++;
  const sc = document.getElementById('stepCounter');
  if (sc) sc.textContent = 'Steps: ' + steps;
  visitedTiles.add(`${playerX},${playerY}`);
  const uc = document.getElementById('uniqueTilesCounter');
  if (uc) uc.textContent = 'Unique Tiles: ' + visitedTiles.size;
  if (!isDecoyLureActive()) {
    if (dist === 2 && !(maze[ty1] && maze[ty1][tx1] === 1)) rebuildMinotaurPursuit();
    else minotaurPath.push({ x: playerX, y: playerY });
  }
  // Handle pickups
  const kIdx = keys.findIndex(k => k.x === playerX && k.y === playerY);
  if (kIdx !== -1) {
    playerKeys++;
    keys.splice(kIdx, 1);
    const kc = document.getElementById('keyCounter');
    if (kc) kc.textContent = 'Keys: ' + playerKeys;
  }
  const tIdx = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
  if (tIdx !== -1) {
    torchPickups.splice(tIdx, 1);
    torchActive = true;
    torchStepsRemaining = TORCH_EFFECT_STEPS;
    updateTorchIndicator();
  }
  onPlayerThreadStep();
  collectHermesAt(playerX, playerY);
  collectBreachAt(playerX, playerY);
  collectRecallAt(playerX, playerY);
  onPlayerFlareStep();
  onPlayerDecoyStep();
  onPlayerOwlStep();
  collectTridentAt(playerX, playerY);
  onPlayerArrowStep();
  onPlayerChariotStep();
  if (torchActive) {
    torchStepsRemaining--;
    if (torchStepsRemaining <= 0) {
      torchActive = false;
      torchStepsRemaining = 0;
    }
    updateTorchIndicator();
  }
  // Check secret passage
  const passage = secretPassages.find(p => p.fromX === playerX && p.fromY === playerY);
  if (passage) {
    playerX = passage.toX; playerY = passage.toY;
    visitedTiles.add(`${playerX},${playerY}`);
    if (!isDecoyLureActive()) minotaurPath.push({ x: playerX, y: playerY });
    const kIdx2 = keys.findIndex(k => k.x === playerX && k.y === playerY);
    if (kIdx2 !== -1) {
      playerKeys++;
      keys.splice(kIdx2, 1);
      const kc = document.getElementById('keyCounter');
      if (kc) kc.textContent = 'Keys: ' + playerKeys;
    }
    const tIdx2 = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
    if (tIdx2 !== -1) {
      torchPickups.splice(tIdx2, 1);
      torchActive = true;
      torchStepsRemaining = TORCH_EFFECT_STEPS;
      updateTorchIndicator();
    }
    if (collectSpoolAt(playerX, playerY)) updateSpoolUI();
    collectShieldAt(playerX, playerY);
    collectHermesAt(playerX, playerY);
    collectBreachAt(playerX, playerY);
    collectRecallAt(playerX, playerY);
    if (collectIcarusAt(playerX, playerY)) updateFlareUI();
    if (collectDecoyAt(playerX, playerY)) updateDecoyUI();
    if (collectOwlAt(playerX, playerY)) updateOwlUI();
    if (collectTridentAt(playerX, playerY)) updateTridentUI();
    if (collectArrowAt(playerX, playerY)) updateArrowUI();
    if (collectChariotAt(playerX, playerY)) updateChariotUI();
    if (owlStepsRemaining > 0) refreshOwlEscapePreview();
    showSecretPassageMessage();
  }
  // Check Minotaur collision
  if (minotaurActive && playerX === minotaurX && playerY === minotaurY) {
    if (playerShields > 0) {
      triggerAegisRepel(true);
      updateDashUI();
      updateRecallUI();
      updateBreachUI();
      updateFlareUI();
      updateDecoyUI();
      updateOwlUI();
      updateTridentUI();
      updateArrowUI();
      updateChariotUI();
      return true;
    }
    gameLost = true;
    arrowVisionStepsRemaining = 0;
    arrowTrail = [];
    chariotTrailStepsRemaining = 0;
    chariotTrail = [];
    const lo = document.getElementById('loseOverlay');
    if (lo) lo.style.display = 'flex';
    updateSpoolUI();
    updateShieldUI();
    updateDashUI();
    updateRecallUI();
    updateBreachUI();
    updateFlareUI();
    updateDecoyUI();
    updateOwlUI();
    updateTridentUI();
    updateArrowUI();
    updateChariotUI();
    drawMaze();
    return true;
  }
  // Check escape victory
  if (playerX === escapeX && playerY === escapeY) {
    gameWon = true;
    clearInterval(minotaurInterval);
    torchActive = false; torchStepsRemaining = 0; compassStepsRemaining = 0;
    const wo = document.getElementById('winOverlay');
    if (wo) {
      wo.textContent = formatWinSummary();
      wo.style.display = 'flex';
    }
    updateTorchIndicator();
    updateSpoolUI();
    updateShieldUI();
    updateDashUI();
    updateRecallUI();
    updateBreachUI();
    solarFlareStepsRemaining = 0;
    activeDecoy = null;
    window.activeDecoy = null;
    updateFlareUI();
    updateDecoyUI();
    owlStepsRemaining = 0;
    owlEscapePreview = [];
    updateOwlUI();
    updateTridentUI();
    arrowVisionStepsRemaining = 0;
    arrowTrail = [];
    chariotTrailStepsRemaining = 0;
    chariotTrail = [];
    updateArrowUI();
    updateChariotUI();
    drawMaze();

    return true;
  }
  showBannerMessage(dist === 2 && maze[ty1] && maze[ty1][tx1] === 0 ? 'Phase Dash! Phased through solid wall!' : 'Phase Dash! Vaulted ahead!', 'rgba(190,115,0,0.9)');
  updateDashUI();
  updateShieldUI();
  updateRecallUI();
  updateBreachUI();
  updateFlareUI();
  updateDecoyUI();
  updateOwlUI();
  updateTridentUI();
  updateArrowUI();
  drawMaze();
  return true;
}

function collectRecallAt(x, y) {
  if (playerRecalls >= MAX_RECALLS) return false;
  const idx = chronosShrines.findIndex(s => s.x === x && s.y === y);
  if (idx !== -1) {
    chronosShrines.splice(idx, 1);
    playerRecalls++;
    showBannerMessage('Chronos Hourglass acquired! (' + playerRecalls + '/' + MAX_RECALLS + ')', 'rgba(110,30,160,0.9)');
    updateRecallUI();
    return true;
  }
  return false;
}


function collectBreachAt(x, y) {
  if (typeof x !== 'number' || typeof y !== 'number' || !Array.isArray(daedalusShrines)) return false;
  if (playerBreaches >= MAX_BREACHES) return false;
  
  const idx = daedalusShrines.findIndex(s => s && s.x === x && s.y === y);
  if (idx === -1 || !daedalusShrines[idx] || daedalusShrines[idx].x !== x || daedalusShrines[idx].y !== y) return false;
  
  daedalusShrines.splice(idx, 1);
  playerBreaches++;
  showBannerMessage('Daedalus Hammer acquired! (' + playerBreaches + '/' + MAX_BREACHES + ')', 'rgba(150,40,15,0.92)');
  updateBreachUI();
  return true;
}
function triggerChronosRecall() {
  if (gameWon || gameLost || playerRecalls <= 0) return false;
  if (!chronosAnchor) {
    chronosAnchor = { x: playerX, y: playerY };
    showBannerMessage('Chronos Anchor set! Press B again to recall.', 'rgba(110,30,160,0.9)');
    updateRecallUI();
    drawMaze();
    return true;
  }
  playerRecalls--;
  playerX = chronosAnchor.x;
  playerY = chronosAnchor.y;
  chronosAnchor = null;
  visitedTiles.add(`${playerX},${playerY}`);
  const uc = document.getElementById('uniqueTilesCounter');
  if (uc) uc.textContent = 'Unique Tiles: ' + visitedTiles.size;
  recallFlashUntil = Date.now() + 650;
  minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + CHRONOS_STUN_MS);
  if (!isDecoyLureActive()) {
    rebuildMinotaurPursuit();
  }
  collectOwlAt(playerX, playerY);
  if (owlStepsRemaining > 0) refreshOwlEscapePreview();
  collectArrowAt(playerX, playerY);
  collectChariotAt(playerX, playerY);
  updateRecallUI();
  updateArrowUI();
  updateChariotUI();
  updateShieldUI();
  updateDashUI();
  updateBreachUI();
  updateFlareUI();
  updateDecoyUI();
  updateOwlUI();
  updateTridentUI();
  updateSpoolUI();
  drawMaze();
  return true;
}

function triggerWallBreach() {
  if (gameWon || gameLost || playerBreaches <= 0) return false;
  const tx = playerX + lastMoveDir.dx;
  const ty = playerY + lastMoveDir.dy;
  if (!canBreachFacingWall()) {
    showBannerMessage('Face an interior wall to breach!', 'rgba(150,40,15,0.85)');
    return false;
  }
  playerBreaches--;
  maze[ty][tx] = 1;
  if (!breachedTiles.some(b => b.x === tx && b.y === ty)) breachedTiles.push({ x: tx, y: ty });
  collectBreachAt(tx, ty);
  playerX = tx;
  playerY = ty;
  steps++;
  document.getElementById('stepCounter').textContent = 'Steps: ' + steps;
  visitedTiles.add(`${playerX},${playerY}`);
  document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
  if (!isDecoyLureActive()) {
    minotaurPath.push({ x: playerX, y: playerY });
  }
  // Inline key pickup logic
  const keyIndex = keys.findIndex(k => k.x === playerX && k.y === playerY);
  if (keyIndex !== -1) {
    playerKeys++;
    keys.splice(keyIndex, 1);
    document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
  }
  // Inline torch pickup logic
  const torchIndex = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
  if (torchIndex !== -1) {
    torchPickups.splice(torchIndex, 1);
    torchActive = true;
    torchStepsRemaining = TORCH_EFFECT_STEPS;
    updateTorchIndicator();
  }
  onPlayerThreadStep();
  collectHermesAt(playerX, playerY);
  onPlayerFlareStep();
  onPlayerDecoyStep();
  onPlayerOwlStep();
  onPlayerArrowStep();
  onPlayerChariotStep();
  if (torchActive) {
    torchStepsRemaining--;
    if (torchStepsRemaining <= 0) {
      torchActive = false;
      torchStepsRemaining = 0;
    }
    updateTorchIndicator();
  }
  breachFlashUntil = Date.now() + 600;
  let bannerMsg;
  if (minotaurActive && minotaurX >= 0 && Math.abs(minotaurX - playerX) + Math.abs(minotaurY - playerY) <= 8) {
    minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + BREACH_STUN_MS);
    updateShieldUI();
    bannerMsg = 'Wall breached! Shockwave stunned the Minotaur!';
  } else {
    bannerMsg = 'Wall breached! Shortcut carved!';
  }
  showBannerMessage(bannerMsg, 'rgba(180,50,20,0.92)');
  collectTridentAt(playerX, playerY);
  updateBreachUI();
  updateDashUI();
  updateShieldUI();
  updateRecallUI();
  updateSpoolUI();
  updateFlareUI();
  updateDecoyUI();
  updateOwlUI();
  updateTridentUI();
  updateArrowUI();
  updateChariotUI();
  drawMaze();
  return true;
}