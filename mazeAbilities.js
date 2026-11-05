

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
    steps++;
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
    if (minotaurActive && minotaurX >= 0 && Math.abs(minotaurX - playerX) + Math.abs(minotaurY - playerY) <= 2) {
      sweptMinotaur = true;
      minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + RIPTIDE_STUN_MS);
      pushMinotaurBack(RIPTIDE_PUSH_STEPS);
    }
    if (playerX === escapeX && playerY === escapeY || secretPassages.some(p => p.fromX === playerX && p.fromY === playerY)) break;
  }
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
  drawMaze();
  return true;
}