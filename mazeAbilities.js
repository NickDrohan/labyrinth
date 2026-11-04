

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

function pushMinotaurBack(steps) {
  if (Array.isArray(minotaurPath) && minotaurPath.length > 0) {
    minotaurPath.splice(0, Math.min(steps, minotaurPath.length));
  }

  const visited = new Set();
  for (let i = 0; i < steps; i++) {
    let best = { x: minotaurX, y: minotaurY };
    let bestDist = -1;

    const candidates = [
      { x: minotaurX + 1, y: minotaurY },
      { x: minotaurX - 1, y: minotaurY },
      { x: minotaurX, y: minotaurY + 1 },
      { x: minotaurX, y: minotaurY - 1 }
    ];

    for (const nx of candidates) {
      if (nx.x < 0 || nx.x >= maze[0].length || nx.y < 0 || nx.y >= maze.length) continue;
      if (maze[nx.y][nx.x] !== 1) continue;
      if (nx.x === playerX && nx.y === playerY) continue;

      const key = nx.x + ',' + nx.y;
      if (visited.has(key)) continue;

      const dist = Math.abs(nx.x - playerX) + Math.abs(nx.y - playerY);
      if (dist > bestDist) {
        best = nx;
        bestDist = dist;
      }
    }

    if (bestDist === -1) break;

    minotaurX = best.x;
    minotaurY = best.y;
    visited.add(minotaurX + ',' + minotaurY);
    minotaurPath.unshift({ x: minotaurX, y: minotaurY });
  }

  if (minotaurX === playerX && minotaurY === playerY) {
    const adjacent = [
      { x: minotaurX + 1, y: minotaurY },
      { x: minotaurX - 1, y: minotaurY },
      { x: minotaurX, y: minotaurY + 1 },
      { x: minotaurX, y: minotaurY - 1 }
    ];
    for (const a of adjacent) {
      if (a.x < 0 || a.x >= maze[0].length || a.y < 0 || a.y >= maze.length) continue;
      if (maze[a.y][a.x] !== 1) continue;
      if (a.x === playerX && a.y === playerY) continue;
      minotaurX = a.x;
      minotaurY = a.y;
      break;
    }
  }
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
    if (!isDecoyLureActive()) {
      visitedTiles.add(`${tx1},${ty1}`);
      minotaurPath.push({ x: tx1, y: ty1 });
    }
    collectRecallAt(tx1, ty1);
    collectBreachAt(tx1, ty1);
    collectIcarusAt(tx1, ty1);
    collectDecoyAt(tx1, ty1);
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
      return true;
    }
    gameLost = true;
    const lo = document.getElementById('loseOverlay');
    if (lo) lo.style.display = 'flex';
    updateSpoolUI();
    updateShieldUI();
    updateDashUI();
    updateRecallUI();
    updateBreachUI();
    updateFlareUI();
    updateDecoyUI();
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
    recallFlashUntil = Date.now() + 450;
    showBannerMessage('Chronos Anchor set! Press B again to warp back.', 'rgba(110,30,160,0.9)');
    updateRecallUI();
    drawMaze();
    return true;
  }
  if (chronosAnchor.x === playerX && chronosAnchor.y === playerY) {
    chronosAnchor = null;
    showBannerMessage('Chronos Anchor packed up (no charge used).', 'rgba(110,30,160,0.9)');
    updateRecallUI();
    drawMaze();
    return true;
  }
  playerRecalls--;
  playerX = chronosAnchor.x;
  playerY = chronosAnchor.y;
  chronosAnchor = null;
  visitedTiles.add(`${playerX},${playerY}`);
  document.getElementById('uniqueTilesCounter').textContent = 'Unique tiles: ' + visitedTiles.size;
  recallFlashUntil = Date.now() + 650;
  minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + CHRONOS_STUN_MS);
  if (isDecoyLureActive() && minotaurActive && minotaurX >= 0) {
    minotaurPath = computePathBetween(minotaurX, minotaurY, activeDecoy.x, activeDecoy.y);
  } else {
    rebuildMinotaurPursuit();
  }
  collectSpoolAt(playerX, playerY);
  collectShieldAt(playerX, playerY);
  collectDashAt(playerX, playerY);
  collectRecallAt(playerX, playerY);
  collectBreachAt(playerX, playerY);
  collectIcarusAt(playerX, playerY);
  collectDecoyAt(playerX, playerY);
  updateSpoolUI();
  updateShieldUI();
  updateDashUI();
  updateBreachUI();
  updateRecallUI();
  updateFlareUI();
  updateDecoyUI();
  showBannerMessage('Chronos Recall! Warped to anchor & Minotaur time-locked!', 'rgba(130,40,190,0.92)');
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
  updateBreachUI();
  updateDashUI();
  updateShieldUI();
  updateRecallUI();
  updateSpoolUI();
  updateFlareUI();
  updateDecoyUI();
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

function computePathBetween(sx, sy, tx, ty) {
  if (!Array.isArray(maze) || maze.length === 0) return [];
  if (sx < 0 || sy < 0 || tx < 0 || ty < 0 || sy >= maze.length || ty >= maze.length || sx >= maze[0].length || tx >= maze[0].length) return [];
  if (maze[sy][sx] !== 1 || maze[ty][tx] !== 1) return [];
  if (sx === tx && sy === ty) return [];
  const H = maze.length, W = maze[0].length, total = W * H;
  if (!_pathParent || _pathParent.length !== total) {
    _pathParent = new Int32Array(total);
    _pathQueue = new Int32Array(total);
    _pathStamp = new Uint32Array(total);
    _pathGen = 0;
  }
  _pathGen++;
  if (_pathGen >= 0xffffffff) {
    _pathStamp.fill(0);
    _pathGen = 1;
  }
  const startIdx = sy * W + sx;
  const targetIdx = ty * W + tx;
  _pathStamp[startIdx] = _pathGen;
  _pathParent[startIdx] = -1;
  _pathQueue[0] = startIdx;
  let head = 0, tail = 1;
  while (head < tail) {
    const i = _pathQueue[head++];
    const x = i % W, y = (i / W) | 0;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (_pathStamp[ni] !== _pathGen && maze[ny] && maze[ny][nx] === 1) {
        _pathStamp[ni] = _pathGen;
        _pathParent[ni] = i;
        _pathQueue[tail++] = ni;
      }
    }
  }
  if (_pathStamp[targetIdx] !== _pathGen) return [];
  const path = [];
  let cur = targetIdx;
  while (cur !== startIdx) {
    path.push({ x: cur % W, y: (cur / W) | 0 });
    cur = _pathParent[cur];
  }
  path.reverse();
  return path;
}

function isDecoyLureActive() {
  return Boolean(activeDecoy && activeDecoy.steps > 0);
}

function rebuildMinotaurPursuit() {
  minotaurPath = (minotaurActive && minotaurX >= 0 && minotaurY >= 0) ? computePathBetween(minotaurX, minotaurY, playerX, playerY) : [];
}

function shatterSirenDecoy(msg) {
  activeDecoy = null;
  window.activeDecoy = null;
  minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + DECOY_STUN_MS);
  decoyFlashUntil = Date.now() + 600;
  rebuildMinotaurPursuit();
  showBannerMessage(msg, 'rgba(210,40,130,0.95)');
  updateDecoyUI();
  updateShieldUI();
}

function onPlayerDecoyStep() {
  collectDecoyAt(playerX, playerY);
  if (isDecoyLureActive()) {
    activeDecoy.steps--;
    if (activeDecoy.steps <= 0) {
      activeDecoy = null;
      window.activeDecoy = null;
      rebuildMinotaurPursuit();
      showBannerMessage('Siren Decoy faded.', 'rgba(120,30,80,0.85)');
    }
  }
  updateDecoyUI();
}

function triggerSirenDecoy() {
  if (gameWon || gameLost || playerDecoys <= 0 || isDecoyLureActive()) return false;
  playerDecoys--;
  activeDecoy = { x: playerX, y: playerY, steps: DECOY_DURATION_STEPS };
  window.activeDecoy = activeDecoy;
  decoyFlashUntil = Date.now() + 600;
  if (minotaurActive && minotaurX >= 0 && minotaurY >= 0) {
    if (minotaurX === activeDecoy.x && minotaurY === activeDecoy.y) {
      shatterSirenDecoy('Siren Decoy shattered! Minotaur stunned for 5s!');
    } else {
      minotaurPath = computePathBetween(minotaurX, minotaurY, activeDecoy.x, activeDecoy.y);
      showBannerMessage('Siren Decoy deployed! Luring Minotaur for ' + DECOY_DURATION_STEPS + ' steps!', 'rgba(180,20,100,0.92)');
    }
  } else {
    showBannerMessage('Siren Decoy deployed! Luring Minotaur for ' + DECOY_DURATION_STEPS + ' steps!', 'rgba(180,20,100,0.92)');
  }
  updateDecoyUI();
  updateShieldUI();
  drawMaze();
  return true;
}

function advanceMinotaurLure() {
  if (!isDecoyLureActive() || !minotaurActive || minotaurX < 0 || minotaurY < 0 || gameWon || gameLost) {
    return { status: 'none', moved: false };
  }
  if (Date.now() < minotaurStunnedUntil) {
    return { status: 'stunned', moved: false };
  }
  if (minotaurX === activeDecoy.x && minotaurY === activeDecoy.y) {
    shatterSirenDecoy('Minotaur ensnared by Siren Decoy! Stunned for 5s!');
    drawMaze();
    return { status: 'shattered', moved: false };
  }
  
  const ok = (n) => Boolean(n && Math.abs(n.x - minotaurX) + Math.abs(n.y - minotaurY) === 1 && maze[n.y] && maze[n.y][n.x] === 1);
  
  if (!ok(minotaurPath[0])) {
    minotaurPath = computePathBetween(minotaurX, minotaurY, activeDecoy.x, activeDecoy.y);
  }
  
  let next = ok(minotaurPath[0]) ? minotaurPath.shift() : null;
  if (!next) {
    // Find a walkable neighbor that reduces Manhattan distance
    const neighbors = [
      {x: minotaurX + 1, y: minotaurY},
      {x: minotaurX - 1, y: minotaurY},
      {x: minotaurX, y: minotaurY + 1},
      {x: minotaurX, y: minotaurY - 1}
    ];
    const manhattan = (x, y) => Math.abs(x - activeDecoy.x) + Math.abs(y - activeDecoy.y);
    const currentDist = manhattan(minotaurX, minotaurY);
    for (const n of neighbors) {
      if (ok(n) && manhattan(n.x, n.y) < currentDist) {
        next = n;
        break;
      }
    }
  }
  
  if (!next) {
    updateShieldUI();
    drawMaze();
    return { status: 'blocked', moved: false };
  }
  
  minotaurX = next.x;
  minotaurY = next.y;
  
  if (minotaurX === playerX && minotaurY === playerY) {
    if (playerShields > 0) {
      triggerAegisRepel(true);
      updateDecoyUI();
      return { status: 'shielded', moved: true };
    } else {
      gameLost = true;
      updateSpoolUI();
      updateShieldUI();
      updateDashUI();
      updateRecallUI();
      updateBreachUI();
      updateFlareUI();
      updateDecoyUI();
      const lo = document.getElementById('loseOverlay');
      if (lo) lo.style.display = 'flex';
      drawMaze();
      return { status: 'caught', moved: true };
    }
  }
  
  if (minotaurX === activeDecoy.x && minotaurY === activeDecoy.y) {
    shatterSirenDecoy('Minotaur ensnared by Siren Decoy! Stunned for 5s!');
    drawMaze();
    return { status: 'shattered', moved: true };
  }
  
  updateShieldUI();
  drawMaze();
  return { status: 'moved', moved: true };
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

function spawnMinotaur() {
    const path = [];
    const visited = new Set();
    visited.add(`${playerX},${playerY}`);
    path.push({x: playerX, y: playerY});

    // BFS to find all valid spawn tiles at least 50 steps from the player
    const queue = [{x: playerX, y: playerY, steps: 0}];
    const bfsVisited = new Set();
    bfsVisited.add(`${playerX},${playerY}`);
    const validSpawnTiles = [];

    const directions = [
        {dx: 0, dy: -1},  // up
        {dx: 0, dy: 1},   // down
        {dx: -1, dy: 0},  // left
        {dx: 1, dy: 0}    // right
    ];

    let qHead = 0;
    while (qHead < queue.length) {
        const {x, y, steps} = queue[qHead++];

        // If we found a tile at least 50 steps away, collect it as a valid spawn
        if (steps >= 50) {
            validSpawnTiles.push({x, y});
        }

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const key = `${nx},${ny}`;

            // Check bounds, wall, and not already visited
            if (nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length &&
                maze[ny][nx] === 1 && !bfsVisited.has(key)) {
                bfsVisited.add(key);
                queue.push({x: nx, y: ny, steps: steps + 1});
            }
        }
    }

    // If no tile found 50+ steps away, fall back to any valid tile not on player/escapetile
    let spawnTile = null;
    if (validSpawnTiles.length > 0) {
        // Randomly select among all valid spawn tiles at least 50 steps away
        const randomIndex = Math.floor(Math.random() * validSpawnTiles.length);
        spawnTile = validSpawnTiles[randomIndex];
    } else {
        // Try to find any valid tile at least Manhattan distance 30 from player and not on escape tile
        for (let y = 0; y < maze.length && !spawnTile; y++) {
            for (let x = 0; x < maze[0].length && !spawnTile; x++) {
                if (maze[y][x] === 1 && !(x === playerX && y === playerY) && !(x === escapeX && y === escapeY)) {
                    if (Math.abs(x - playerX) + Math.abs(y - playerY) >= 30) {
                        spawnTile = {x, y};
                    }
                }
            }
        }
    }

    // Set Minotaur position
    if (spawnTile) {
        minotaurX = spawnTile.x;
        minotaurY = spawnTile.y;
        minotaurActive = true;
    } else {
        minotaurX = -1;
        minotaurY = -1;
        minotaurActive = false;
    }

    // Rebuild path from Minotaur to player using BFS with parent tracking
    minotaurPath = [];
    const pathVisited = new Set();
    pathVisited.add(`${minotaurX},${minotaurY}`);
    const pathQueue = [{x: minotaurX, y: minotaurY}];
    const parentMap = new Map();
    parentMap.set(`${minotaurX},${minotaurY}`, null);

    let pqHead = 0;
    while (pqHead < pathQueue.length) {
        const {x, y} = pathQueue[pqHead++];

        // If we reached the player, stop and reconstruct path
        if (x === playerX && y === playerY) {
            // Reconstruct path from Minotaur to player using parent pointers
            let cx = x, cy = y;
            while (parentMap.get(`${cx},${cy}`) !== null) {
                const parent = parentMap.get(`${cx},${cy}`);
                minotaurPath.push({x: cx, y: cy});
                cx = parent.x;
                cy = parent.y;
            }
            minotaurPath.push({x: minotaurX, y: minotaurY});
            break;
        }

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const key = `${nx},${ny}`;

            if (nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length &&
                maze[ny][nx] === 1 && !pathVisited.has(key)) {
                pathVisited.add(key);
                pathQueue.push({x: nx, y: ny});
                parentMap.set(`${nx},${ny}`, {x, y});
            }
        }
    }

    // Invert so path goes from Minotaur toward player
    return minotaurPath.reverse();
}


async function findPathToPlayer() {
    const visited = new Set();
    const stack = [{x: minotaurX, y: minotaurY}];
    const parent = new Map();
    
    while (stack.length > 0) {
        const current = stack.pop();
        const key = `${current.x},${current.y}`;
        
        if (current.x === playerX && current.y === playerY) {
            // Found player, backtrack to get next move
            let next = current;
            while (parent.has(`${next.x},${next.y}`)) {
                const prev = parent.get(`${next.x},${next.y}`);
                if (prev.x === minotaurX && prev.y === minotaurY) {
                    return next;
                }
                next = prev;
            }
            return next;
        }
        
        if (!visited.has(key)) {
            visited.add(key);
            
            // Check all four directions
            const directions = [
                {x: 0, y: -1}, // Up
                {x: 1, y: 0},  // Right
                {x: 0, y: 1},  // Down
                {x: -1, y: 0}  // Left
            ];
            
            for (const dir of directions) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                
                if (maze[newY] && maze[newY][newX] === 1) {
                    stack.push({x: newX, y: newY});
                    parent.set(`${newX},${newY}`, current);
                }
            }
        }

        // Yield control back to the event loop to keep the UI responsive
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    return null;
}
