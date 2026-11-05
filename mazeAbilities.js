

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

function canSurgeInFacingDir() {
  if (!Array.isArray(maze) || maze.length === 0 || !lastMoveDir || typeof lastMoveDir !== 'object') return false;
  if (Math.abs(lastMoveDir.dx) + Math.abs(lastMoveDir.dy) !== 1) return false;
  const nx = playerX + lastMoveDir.dx;
  const ny = playerY + lastMoveDir.dy;
  if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length || !maze[ny] || maze[ny][nx] !== 1) return false;
  if (gates.some(g => g.x === nx && g.y === ny)) return playerKeys > 0;
  return true;
}

function collectTridentAt(x, y) {
  if (playerTridents >= MAX_TRIDENTS || !Array.isArray(poseidonShrines)) return false;
  const i = poseidonShrines.findIndex(p => p && p.x === x && p.y === y);
  if (i === -1) return false;
  poseidonShrines.splice(i, 1);
  playerTridents++;
  showBannerMessage('Poseidon Trident acquired! (' + playerTridents + '/' + MAX_TRIDENTS + ')', 'rgba(0,140,130,0.92)');
  updateTridentUI();
  return true;
}

function triggerRiptideSurge() {
  if (gameWon || gameLost || playerTridents <= 0) return false;
  if (!canSurgeInFacingDir()) {
    showBannerMessage('Riptide blocked! Face an open corridor to surge.', 'rgba(0,100,110,0.9)');
    return false;
  }
  playerTridents--;
  riptideTrail = [{ x: playerX, y: playerY }];
  riptideFlashUntil = Date.now() + 750;
  let tilesSurfed = 0;
  let sweptMinotaur = false;
  for (let step = 1; step <= RIPTIDE_MAX_STEPS; step++) {
    const nx = playerX + lastMoveDir.dx;
    const ny = playerY + lastMoveDir.dy;
    if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length || !maze[ny] || maze[ny][nx] !== 1) break;
    const gIdx = gates.findIndex(g => g.x === nx && g.y === ny);
    if (gIdx !== -1) {
      if (playerKeys > 0) {
        playerKeys--;
        gates.splice(gIdx, 1);
        document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
      } else break;
    }
    playerX = nx;
    playerY = ny;
    tilesSurfed++;
    riptideTrail.push({ x: playerX, y: playerY });
    visitedTiles.add(`${playerX},${playerY}`);
    // Update minotaur path
    if (!isDecoyLureActive()) {
      if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) {
        minotaurPath.pop();
      } else {
        minotaurPath.push({ x: playerX, y: playerY });
      }
    }
    // Collect pickups on traversed tile
    // Key pickup
    const keyIdx = keys.findIndex(k => k.x === playerX && k.y === playerY);
    if (keyIdx !== -1) {
      playerKeys++;
      keys.splice(keyIdx, 1);
      document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
    }
    // Torch pickup
    const torchIdx = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
    if (torchIdx !== -1) {
      torchPickups.splice(torchIdx, 1);
      torchActive = true;
      torchStepsRemaining = TORCH_EFFECT_STEPS;
      updateTorchIndicator();
    }
    // Additional player step callbacks
    onPlayerThreadStep();
    collectHermesAt(playerX, playerY);
    collectBreachAt(playerX, playerY);
    onPlayerFlareStep();
    onPlayerDecoyStep();
    onPlayerOwlStep();
    // Collect trident on surge tile
    collectTridentAt(playerX, playerY);
    onPlayerArrowStep();
    collectChariotAt(playerX, playerY);
    if (minotaurActive && minotaurX >= 0 && Math.abs(minotaurX - playerX) + Math.abs(minotaurY - playerY) <= 2) {
      sweptMinotaur = true;
      minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + RIPTIDE_STUN_MS);
      pushMinotaurBack(RIPTIDE_PUSH_STEPS);
    }
    if (playerX === escapeX && playerY === escapeY || secretPassages.some(p => p.fromX === playerX && p.fromY === playerY)) break;
  }
  steps++;
  document.getElementById('stepCounter').textContent = 'Steps: ' + steps;
  document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
  if (torchActive) {
    torchStepsRemaining--;
    if (torchStepsRemaining <= 0) {
      torchActive = false;
      torchStepsRemaining = 0;
    }
    updateTorchIndicator();
  }
  if (secretPassages.some(p => p.fromX === playerX && p.fromY === playerY)) {
    const passage = secretPassages.find(p => p.fromX === playerX && p.fromY === playerY);
    playerX = passage.toX;
    playerY = passage.toY;
    visitedTiles.add(`${playerX},${playerY}`);
    document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
    // Minotaur path update matching triggerPhaseDash
    if (!isDecoyLureActive()) {
      if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) minotaurPath.pop();
      else minotaurPath.push({ x: playerX, y: playerY });
    }
    // Collect pickups at teleport destination
    // Key pickup
    const destKeyIdx = keys.findIndex(k => k.x === playerX && k.y === playerY);
    if (destKeyIdx !== -1) {
      playerKeys++;
      keys.splice(destKeyIdx, 1);
      document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
    }
    // Torch pickup
    const destTorchIdx = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
    if (destTorchIdx !== -1) {
      torchPickups.splice(destTorchIdx, 1);
      torchActive = true;
      torchStepsRemaining = TORCH_EFFECT_STEPS;
      updateTorchIndicator();
    }
    // Additional pickup callbacks
    if (collectSpoolAt(playerX, playerY)) updateSpoolUI();
    collectShieldAt(playerX, playerY);
    collectHermesAt(playerX, playerY);
    collectBreachAt(playerX, playerY);
    collectRecallAt(playerX, playerY);
    if (collectIcarusAt(playerX, playerY)) updateFlareUI();
    if (collectDecoyAt(playerX, playerY)) updateDecoyUI();
    if (collectOwlAt(playerX, playerY)) updateOwlUI();
    if (owlStepsRemaining > 0) refreshOwlEscapePreview();
    collectTridentAt(playerX, playerY);
    collectArrowAt(playerX, playerY);
    collectChariotAt(playerX, playerY);
    showSecretPassageMessage();
  }
  if (playerX === escapeX && playerY === escapeY) {
    gameWon = true;
    clearInterval(minotaurInterval);
    compassStepsRemaining = 0;
    solarFlareStepsRemaining = 0;
    torchActive = false;
    torchStepsRemaining = 0;
    activeDecoy = null;
    window.activeDecoy = null;
    owlStepsRemaining = 0;
    owlEscapePreview = [];
    arrowVisionStepsRemaining = 0;
    arrowTrail = [];
    chariotTrailStepsRemaining = 0;
    chariotTrail = [];
    document.getElementById('winOverlay').textContent = formatWinSummary();
    document.getElementById('winOverlay').style.display = 'flex';
    updateTorchIndicator();
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
  const bannerText = sweptMinotaur ? 'Riptide Surge! Surfed ' + tilesSurfed + ' tiles & swept Minotaur back!' : 'Riptide Surge! Surfed ' + tilesSurfed + ' tiles!';
  showBannerMessage(bannerText, 'rgba(0,150,140,0.92)');
  updateTridentUI();
  updateDashUI();
  updateShieldUI();
  updateRecallUI();
  updateBreachUI();
  updateFlareUI();
  updateDecoyUI();
  updateOwlUI();
  updateSpoolUI();
  updateArrowUI();
  updateChariotUI();
  drawMaze();
  return true;
}

function canChargeChariotInFacingDir() {
  if (!Array.isArray(maze) || maze.length === 0 || !lastMoveDir || typeof lastMoveDir !== 'object') return false;
  if (Math.abs(lastMoveDir.dx) + Math.abs(lastMoveDir.dy) !== 1) return false;
  const nx = playerX + lastMoveDir.dx;
  const ny = playerY + lastMoveDir.dy;
  if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length || !maze[ny] || maze[ny][nx] !== 1) return false;
  if (gates.some(g => g.x === nx && g.y === ny)) return playerKeys > 0;
  return true;
}

function collectChariotAt(x, y) {
  if (playerChariots >= MAX_CHARIOTS || !Array.isArray(apolloShrines)) return false;
  const i = apolloShrines.findIndex(ap => ap && ap.x === x && ap.y === y);
  if (i === -1) return false;
  apolloShrines.splice(i, 1);
  playerChariots++;
  showBannerMessage('Apollo Sun Chariot acquired! (' + playerChariots + '/' + MAX_CHARIOTS + ')', 'rgba(210,110,10,0.92)');
  updateChariotUI();
  return true;
}

function onPlayerChariotStep() {
  collectChariotAt(playerX, playerY);
  if (chariotTrailStepsRemaining > 0) {
    chariotTrailStepsRemaining--;
    if (chariotTrailStepsRemaining <= 0) {
      chariotTrailStepsRemaining = 0;
      chariotTrail = [];
    }
  }
  updateChariotUI();
}

function canFireArrowInFacingDir() {
  if (!Array.isArray(maze) || maze.length === 0 || !lastMoveDir || typeof lastMoveDir !== 'object') return false;
  if (Math.abs(lastMoveDir.dx) + Math.abs(lastMoveDir.dy) !== 1) return false;
  const nx = playerX + lastMoveDir.dx;
  const ny = playerY + lastMoveDir.dy;
  if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length || !maze[ny] || maze[ny][nx] !== 1) return false;
  return true;
}

function collectArrowAt(x, y) {
  if (playerArrows >= MAX_ARROWS || !Array.isArray(artemisShrines)) return false;
  const i = artemisShrines.findIndex(a => a && a.x === x && a.y === y);
  if (i === -1) return false;
  artemisShrines.splice(i, 1);
  playerArrows++;
  showBannerMessage('Artemis Silver Bow acquired! (' + playerArrows + '/' + MAX_ARROWS + ')', 'rgba(20,130,95,0.92)');
  updateArrowUI();
  return true;
}

function onPlayerArrowStep() {
  collectArrowAt(playerX, playerY);
  if (arrowVisionStepsRemaining > 0) {
    arrowVisionStepsRemaining--;
    if (arrowVisionStepsRemaining <= 0) {
      arrowVisionStepsRemaining = 0;
      arrowTrail = [];
    }
  }
  updateArrowUI();
}

function triggerSilverArrow() {
  if (gameWon || gameLost || playerArrows <= 0) return false;
  if (!canFireArrowInFacingDir()) {
    showBannerMessage('Silver Arrow blocked! Face an open corridor to fire.', 'rgba(20,100,80,0.9)');
    return false;
  }
  playerArrows--;
  arrowTrail = [{ x: playerX, y: playerY }];
  arrowVisionStepsRemaining = ARROW_VISION_STEPS;
  arrowFlashUntil = Date.now() + 750;
  let tilesPierced = 0;
  let pickupsSkewered = 0;
  let pinnedMinotaur = false;
  for (let step = 1; step <= ARROW_MAX_RANGE; step++) {
    const nx = playerX + step * lastMoveDir.dx;
    const ny = playerY + step * lastMoveDir.dy;
    if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length || !maze[ny] || maze[ny][nx] !== 1) break;
    tilesPierced++;
    arrowTrail.push({ x: nx, y: ny });
    visitedTiles.add(`${nx},${ny}`);
    const keyIdx = keys.findIndex(k => k.x === nx && k.y === ny);
    if (keyIdx !== -1) {
      playerKeys++;
      keys.splice(keyIdx, 1);
      pickupsSkewered++;
      const kc = document.getElementById('keyCounter');
      if (kc) kc.textContent = 'Keys: ' + playerKeys;
    }
    const torchIdx = torchPickups.findIndex(t => t.x === nx && t.y === ny);
    if (torchIdx !== -1) {
      torchPickups.splice(torchIdx, 1);
      torchActive = true;
      torchStepsRemaining = TORCH_EFFECT_STEPS;
      pickupsSkewered++;
      updateTorchIndicator();
    }
    if (collectSpoolAt(nx, ny)) pickupsSkewered++;
    if (collectShieldAt(nx, ny)) pickupsSkewered++;
    if (collectHermesAt(nx, ny)) pickupsSkewered++;
    if (collectRecallAt(nx, ny)) pickupsSkewered++;
    if (collectBreachAt(nx, ny)) pickupsSkewered++;
    if (collectIcarusAt(nx, ny)) pickupsSkewered++;
    if (collectDecoyAt(nx, ny)) pickupsSkewered++;
    if (collectOwlAt(nx, ny)) pickupsSkewered++;
    if (collectTridentAt(nx, ny)) pickupsSkewered++;
    if (collectArrowAt(nx, ny)) pickupsSkewered++;
    if (collectChariotAt(nx, ny)) pickupsSkewered++;
    if (!pinnedMinotaur && minotaurActive && minotaurX >= 0 && Math.abs(minotaurX - nx) + Math.abs(minotaurY - ny) <= 1) {
      pinnedMinotaur = true;
      minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + ARROW_STUN_MS);
      pushMinotaurBack(ARROW_PUSH_STEPS);
    }
  }
  const uc = document.getElementById('uniqueTilesCounter');
  if (uc) uc.textContent = 'Unique Tiles: ' + visitedTiles.size;
  const bannerText = pinnedMinotaur
    ? 'Silver Arrow! Pierced ' + tilesPierced + ' tiles & pinned Minotaur (5.5s)!'
    : 'Silver Arrow! Pierced ' + tilesPierced + ' tiles' + (pickupsSkewered > 0 ? ' & retrieved ' + pickupsSkewered + ' pickup(s)!' : '!');
  showBannerMessage(bannerText, 'rgba(25,140,105,0.92)');
  updateArrowUI();
  updateChariotUI();
  updateTridentUI();
  updateOwlUI();
  updateDecoyUI();
  updateFlareUI();
  updateBreachUI();
  updateRecallUI();
  updateDashUI();
  updateShieldUI();
  updateSpoolUI();
  drawMaze();
  return true;
}

function triggerSolarChariot() {
  if (gameWon || gameLost || playerChariots <= 0) return false;
  if (!canChargeChariotInFacingDir()) {
    showBannerMessage('Solar Chariot blocked! Face an open corridor to charge.', 'rgba(180,80,10,0.9)');
    return false;
  }
  playerChariots--;
  chariotTrail = [{ x: playerX, y: playerY }];
  chariotTrailStepsRemaining = CHARIOT_TRAIL_STEPS;
  chariotFlashUntil = Date.now() + 800;
  let tilesCharged = 0;
  let scorchedMinotaur = false;
  for (let step = 1; step <= CHARIOT_MAX_STEPS; step++) {
    const nx = playerX + lastMoveDir.dx;
    const ny = playerY + lastMoveDir.dy;
    if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length || !maze[ny] || maze[ny][nx] !== 1) break;
    const gIdx = gates.findIndex(g => g.x === nx && g.y === ny);
    if (gIdx !== -1) {
      if (playerKeys > 0) {
        playerKeys--;
        gates.splice(gIdx, 1);
        const kc = document.getElementById('keyCounter');
        if (kc) kc.textContent = 'Keys: ' + playerKeys;
      } else {
        break;
      }
    }
    playerX = nx;
    playerY = ny;
    tilesCharged++;
    chariotTrail.push({ x: playerX, y: playerY });
    visitedTiles.add(playerX + ',' + playerY);
    if (!isDecoyLureActive()) {
      if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) {
        minotaurPath.pop();
      } else {
        minotaurPath.push({ x: playerX, y: playerY });
      }
    }
    const keyIdx = keys.findIndex(k => k.x === playerX && k.y === playerY);
    if (keyIdx !== -1) {
      playerKeys++;
      keys.splice(keyIdx, 1);
      const kc = document.getElementById('keyCounter');
      if (kc) kc.textContent = 'Keys: ' + playerKeys;
    }
    const torchIdx = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
    if (torchIdx !== -1) {
      torchPickups.splice(torchIdx, 1);
      torchActive = true;
      torchStepsRemaining = TORCH_EFFECT_STEPS;
      updateTorchIndicator();
    }
    onPlayerThreadStep();
    collectHermesAt(playerX, playerY);
    collectBreachAt(playerX, playerY);
    onPlayerFlareStep();
    onPlayerDecoyStep();
    onPlayerOwlStep();
    collectTridentAt(playerX, playerY);
    onPlayerArrowStep();
    collectChariotAt(playerX, playerY);
    if (minotaurActive && minotaurX >= 0 && Math.abs(minotaurX - playerX) + Math.abs(minotaurY - playerY) <= 2) {
      scorchedMinotaur = true;
      minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + CHARIOT_STUN_MS);
      pushMinotaurBack(CHARIOT_PUSH_STEPS);
    }
    if ((playerX === escapeX && playerY === escapeY) || secretPassages.some(p => p.fromX === playerX && p.fromY === playerY)) break;
  }
  steps++;
  const sc = document.getElementById('stepCounter');
  if (sc) sc.textContent = 'Steps: ' + steps;
  const uc = document.getElementById('uniqueTilesCounter');
  if (uc) uc.textContent = 'Unique Tiles: ' + visitedTiles.size;
  if (torchActive) {
    torchStepsRemaining--;
    if (torchStepsRemaining <= 0) {
      torchActive = false;
      torchStepsRemaining = 0;
    }
    updateTorchIndicator();
  }
  if (secretPassages.some(p => p.fromX === playerX && p.fromY === playerY)) {
    const passage = secretPassages.find(p => p.fromX === playerX && p.fromY === playerY);
    playerX = passage.toX;
    playerY = passage.toY;
    visitedTiles.add(playerX + ',' + playerY);
    const uc2 = document.getElementById('uniqueTilesCounter');
    if (uc2) uc2.textContent = 'Unique Tiles: ' + visitedTiles.size;
    if (!isDecoyLureActive()) {
      if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) minotaurPath.pop();
      else minotaurPath.push({ x: playerX, y: playerY });
    }
    const destKeyIdx = keys.findIndex(k => k.x === playerX && k.y === playerY);
    if (destKeyIdx !== -1) {
      playerKeys++;
      keys.splice(destKeyIdx, 1);
      const kc = document.getElementById('keyCounter');
      if (kc) kc.textContent = 'Keys: ' + playerKeys;
    }
    const destTorchIdx = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
    if (destTorchIdx !== -1) {
      torchPickups.splice(destTorchIdx, 1);
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
    if (owlStepsRemaining > 0) refreshOwlEscapePreview();
    collectTridentAt(playerX, playerY);
    collectArrowAt(playerX, playerY);
    collectChariotAt(playerX, playerY);
    showSecretPassageMessage();
  }
  if (playerX === escapeX && playerY === escapeY) {
    gameWon = true;
    clearInterval(minotaurInterval);
    compassStepsRemaining = 0;
    solarFlareStepsRemaining = 0;
    torchActive = false;
    torchStepsRemaining = 0;
    activeDecoy = null;
    window.activeDecoy = null;
    owlStepsRemaining = 0;
    owlEscapePreview = [];
    arrowVisionStepsRemaining = 0;
    arrowTrail = [];
    chariotTrailStepsRemaining = 0;
    chariotTrail = [];
    const winOverlay = document.getElementById('winOverlay');
    if (winOverlay) {
      winOverlay.textContent = formatWinSummary();
      winOverlay.style.display = 'flex';
    }
    updateTorchIndicator();
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
  const bannerMsg = scorchedMinotaur
    ? 'Solar Chariot! Charged ' + tilesCharged + ' tiles & scorched Minotaur (5s)!'
    : 'Solar Chariot! Charged ' + tilesCharged + ' tiles!';
  showBannerMessage(bannerMsg, 'rgba(210,110,10,0.92)');
  updateChariotUI();
  updateArrowUI();
  updateTridentUI();
  updateDashUI();
  updateShieldUI();
  updateRecallUI();
  updateBreachUI();
  updateFlareUI();
  updateDecoyUI();
  updateOwlUI();
  updateSpoolUI();
  drawMaze();
  return true;
}