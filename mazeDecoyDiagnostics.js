

window.runDecoySmokeSpec = function() {
  const consoleErrors = [];
  const origConsoleError = console.error;
  console.error = function(...args) {
    consoleErrors.push(args.map(a => String(a)).join(' '));
    return origConsoleError.apply(console, args);
  };

  // Scalar globals
  const savedPlayerX = playerX;
  const savedPlayerY = playerY;
  const savedEscapeX = escapeX;
  const savedEscapeY = escapeY;
  const savedMinotaurActive = minotaurActive;
  const savedMinotaurX = minotaurX;
  const savedMinotaurY = minotaurY;
  const savedMinotaurStunnedUntil = minotaurStunnedUntil;
  const savedPlayerDecoys = playerDecoys;
  const savedDecoyFlashUntil = decoyFlashUntil;
  const savedSteps = steps;
  const savedTorchActive = torchActive;
  const savedTorchStepsRemaining = torchStepsRemaining;
  const savedPlayerSpools = playerSpools;
  const savedCompassStepsRemaining = compassStepsRemaining;
  const savedPlayerShields = playerShields;
  const savedPlayerDashes = playerDashes;
  const savedPlayerRecalls = playerRecalls;
  const savedPlayerBreaches = playerBreaches;
  const savedPlayerFlares = playerFlares;
  const savedSolarFlareStepsRemaining = solarFlareStepsRemaining;
  const savedPlayerKeys = playerKeys;
  const savedGameWon = gameWon;
  const savedGameLost = gameLost;
  const savedLastMoveDir = lastMoveDir ? { dx: lastMoveDir.dx, dy: lastMoveDir.dy } : null;

  // Collections/objects
  const savedVisitedTiles = Array.from(visitedTiles);
  const savedMinotaurPath = minotaurPath.map(n => ({ x: n.x, y: n.y }));
  const savedOrpheusShrines = orpheusShrines.map(o => ({ x: o.x, y: o.y }));
  const savedActiveDecoy = activeDecoy ? { x: activeDecoy.x, y: activeDecoy.y, steps: activeDecoy.steps } : null;
  const savedChronosAnchor = chronosAnchor ? { ...chronosAnchor } : null;
  const savedKeys = keys.map(k => ({ x: k.x, y: k.y }));
  const savedGates = gates.map(g => ({ x: g.x, y: g.y }));
  const savedTorchPickups = torchPickups.map(t => ({ x: t.x, y: t.y }));
  const savedThreadSpools = threadSpools.map(s => ({ x: s.x, y: s.y }));
  const savedAegisShrines = aegisShrines.map(a => ({ x: a.x, y: a.y }));
  const savedHermesShrines = hermesShrines.map(h => ({ x: h.x, y: h.y }));
  const savedChronosShrines = chronosShrines.map(c => ({ x: c.x, y: c.y }));
  const savedDaedalusShrines = daedalusShrines.map(d => ({ x: d.x, y: d.y }));
  const savedIcarusShrines = icarusShrines.map(i => ({ x: i.x, y: i.y }));

  // DOM overlays and HUD
  const winOverlay = document.getElementById('winOverlay');
  const loseOverlay = document.getElementById('loseOverlay');
  const stepCounter = document.getElementById('stepCounter');
  const uniqueTilesCounter = document.getElementById('uniqueTilesCounter');
  const keyCounter = document.getElementById('keyCounter');
  const decoyCounter = document.getElementById('decoyCounter');
  const decoyButton = document.getElementById('decoyButton');
  const minotaurRadar = document.getElementById('minotaurRadar');
  const savedWinOverlayDisplay = winOverlay ? winOverlay.style.display : null;
  const savedWinOverlayText = winOverlay ? winOverlay.textContent : null;
  const savedLoseOverlayDisplay = loseOverlay ? loseOverlay.style.display : null;
  const savedStepCounterText = stepCounter ? stepCounter.textContent : null;
  const savedUniqueTilesCounterText = uniqueTilesCounter ? uniqueTilesCounter.textContent : null;
  const savedKeyCounterText = keyCounter ? keyCounter.textContent : null;

  let D1 = false, D2 = false, D3 = false, D4 = false, D5 = false, D6 = false;

  try {
    // D1: Orpheus Shrine Placement Invariants
    if (!Array.isArray(orpheusShrines) || orpheusShrines.length < 12) throw new Error('D1: orpheusShrines.length < 12');
    for (const s of orpheusShrines) {
      if (!maze[s.y] || maze[s.y][s.x] !== 1) throw new Error('D1: shrine not on walkable tile');
    }
    const nearStart = orpheusShrines.filter(s => Math.abs(s.x - savedPlayerX) + Math.abs(s.y - savedPlayerY) <= 35);
    if (nearStart.length < 3) throw new Error('D1: <3 shrines within 35 of start');
    // Build anchors
    let anchors = [
      { x: savedPlayerX, y: savedPlayerY },
      { x: savedEscapeX, y: savedEscapeY },
      ...savedKeys,
      ...savedGates,
      ...savedTorchPickups,
      ...savedThreadSpools,
      ...savedAegisShrines,
      ...savedHermesShrines,
      ...savedChronosShrines,
      ...savedDaedalusShrines,
      ...savedIcarusShrines
    ];
    if (window.secretPassages && Array.isArray(window.secretPassages)) {
      for (const sp of window.secretPassages) {
        anchors.push({ x: sp.fromX, y: sp.fromY });
        anchors.push({ x: sp.toX, y: sp.toY });
      }
    }
    for (let i = 0; i < orpheusShrines.length; ++i) {
      const s = orpheusShrines[i];
      for (const anchor of anchors) {
        if (Math.abs(s.x - anchor.x) + Math.abs(s.y - anchor.y) < 5) throw new Error('D1: shrine too close to anchor');
      }
      for (let j = 0; j < orpheusShrines.length; ++j) {
        if (i !== j) {
          const t = orpheusShrines[j];
          if (Math.abs(s.x - t.x) + Math.abs(s.y - t.y) < 5) throw new Error('D1: shrines too close to each other');
        }
      }
    }
    D1 = true;

    // D2: Shrine Pickup & Cap Behavior
    minotaurActive = false; minotaurX = -1; minotaurY = -1; escapeX = -1; escapeY = -1; activeDecoy = null; window.activeDecoy = null;
    // Find validDir
    const dirs = [
      { dx: 0, dy: -1, key: 'ArrowUp', mobile: 'up', opp: 'down', oppKey: 'ArrowDown' },
      { dx: 0, dy: 1, key: 'ArrowDown', mobile: 'down', opp: 'up', oppKey: 'ArrowUp' },
      { dx: -1, dy: 0, key: 'ArrowLeft', mobile: 'left', opp: 'right', oppKey: 'ArrowRight' },
      { dx: 1, dy: 0, key: 'ArrowRight', mobile: 'right', opp: 'left', oppKey: 'ArrowLeft' }
    ];
    let validDir = null;
    for (const dir of dirs) {
      const nx = savedPlayerX + dir.dx, ny = savedPlayerY + dir.dy;
      if (maze[ny] && maze[ny][nx] === 1 && !gates.some(g => g.x === nx && g.y === ny) &&
        !(window.secretPassages && window.secretPassages.some(sp => (sp.fromX === nx && sp.fromY === ny)))) {
        validDir = { ...dir, nx, ny };
        break;
      }
    }
    if (!validDir) throw new Error('D2: No valid neighbor for shrine pickup test');
    // Ensure shrine at (nx, ny)
    if (!orpheusShrines.some(s => s.x === validDir.nx && s.y === validDir.ny)) {
      orpheusShrines.push({ x: validDir.nx, y: validDir.ny });
    }
    playerDecoys = 0; updateDecoyUI();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.key }));
    if (playerDecoys !== 1) throw new Error('D2: playerDecoys not incremented');
    if (orpheusShrines.some(s => s.x === validDir.nx && s.y === validDir.ny)) throw new Error('D2: shrine not removed after pickup');
    if (decoyCounter && decoyCounter.textContent !== 'Decoys: 1 (Off)') throw new Error('D2: decoyCounter text incorrect');
    if (decoyButton && decoyButton.disabled !== false) throw new Error('D2: decoyButton not enabled');
    // Cap check
    playerDecoys = 3;
    orpheusShrines.push({ x: savedPlayerX, y: savedPlayerY });
    updateDecoyUI();
    handleMobileMove(validDir.opp);
    if (playerDecoys !== 3) throw new Error('D2: playerDecoys exceeded cap');
    if (!orpheusShrines.some(s => s.x === savedPlayerX && s.y === savedPlayerY)) throw new Error('D2: shrine at player not preserved at cap');
    // Remove test shrine
    for (let i = orpheusShrines.length - 1; i >= 0; --i) {
      if (orpheusShrines[i].x === savedPlayerX && orpheusShrines[i].y === savedPlayerY) {
        orpheusShrines.splice(i, 1);
        break;
      }
    }
    D2 = true;

    // D3 & D6: Decoy Activation & Guard Checks
    playerX = savedPlayerX; playerY = savedPlayerY;
    playerDecoys = 1; activeDecoy = null; window.activeDecoy = null; updateDecoyUI();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    if (playerDecoys === 0 && activeDecoy && activeDecoy.x === savedPlayerX && activeDecoy.y === savedPlayerY && activeDecoy.steps === 18 &&
      decoyCounter && decoyCounter.textContent === 'Decoys: 0 (Lure: 18)' && decoyCounter.classList.contains('active') && decoyButton && decoyButton.disabled === true) {
      D3 = true;
    }
    // D6: Guards
    let d6ok = true;
    if (activeDecoy && activeDecoy.steps === 18) {
      const px = playerX, py = playerY, steps0 = activeDecoy.steps;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      if (playerX !== px || playerY !== py || activeDecoy.steps !== steps0) d6ok = false;
      const res = triggerSirenDecoy();
      if (res !== false || playerX !== px || playerY !== py || activeDecoy.steps !== steps0) d6ok = false;
    }
    activeDecoy = null; window.activeDecoy = null; playerDecoys = 0;
    if (triggerSirenDecoy() !== false) d6ok = false;
    playerDecoys = 1; gameWon = true;
    if (triggerSirenDecoy() !== false) d6ok = false;
    gameWon = savedGameWon;
    D6 = d6ok;

    // D4: 18-Step Countdown & Pursuit Suppression
    for (let i = orpheusShrines.length - 1; i >= 0; --i) {
      if ((orpheusShrines[i].x === savedPlayerX && orpheusShrines[i].y === savedPlayerY) || (orpheusShrines[i].x === validDir.nx && orpheusShrines[i].y === validDir.ny)) {
        orpheusShrines.splice(i, 1);
      }
    }
    playerX = savedPlayerX; playerY = savedPlayerY; playerDecoys = 0;
    activeDecoy = { x: savedPlayerX, y: savedPlayerY, steps: 18 }; window.activeDecoy = activeDecoy; updateDecoyUI();
    const prePathLen = minotaurPath.length;
    for (let i = 0; i < 18; ++i) {
      if (i % 2 === 0) {
        handleMobileMove(validDir.mobile);
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.oppKey }));
      }
      if (i === 0 && (!activeDecoy || activeDecoy.steps !== 17)) throw new Error('D4: decoy steps not decremented after move');
      if (isDecoyLureActive() && minotaurPath.length !== prePathLen) throw new Error('D4: minotaurPath mutated during decoy');
    }
    if (window.activeDecoy !== null || activeDecoy !== null) throw new Error('D4: activeDecoy not cleared after 18 moves');
    if (decoyCounter && decoyCounter.textContent !== 'Decoys: ' + playerDecoys + ' (Off)') throw new Error('D4: decoyCounter text not reset after 18 moves');
    D4 = true;
    // D5: Minotaur Lure Convergence & 5s Shatter Stun
    const P = { x: savedPlayerX, y: savedPlayerY };
    const T = { x: validDir.nx, y: validDir.ny };
    playerX = T.x; playerY = T.y; playerShields = 0;
    activeDecoy = { x: P.x, y: P.y, steps: 18 }; window.activeDecoy = activeDecoy;
    // Find Q
    let Q = null, route = null;
    outer: for (let dist = 1; dist <= 6; ++dist) {
      for (let dx = -dist; dx <= dist; ++dx) {
        for (let dy = -dist; dy <= dist; ++dy) {
          if (Math.abs(dx) + Math.abs(dy) !== dist) continue;
          const qx = P.x + dx, qy = P.y + dy;
          if ((qx === P.x && qy === P.y) || (qx === T.x && qy === T.y)) continue;
          if (!maze[qy] || maze[qy][qx] !== 1) continue;
          const r = computePathBetween(qx, qy, P.x, P.y);
          if (r && r.length >= 1 && r.length <= 10 && r.every(node => node.x !== T.x || node.y !== T.y)) {
            Q = { x: qx, y: qy };
            route = r;
            break outer;
          }
        }
      }
    }
    if (!Q || !route) {
      D5 = 'skipped';
    } else {
      minotaurActive = true; minotaurX = Q.x; minotaurY = Q.y; minotaurStunnedUntil = 0; minotaurPath.length = 0;
      let lastStatus = null;
      let prevX = minotaurX, prevY = minotaurY;
      let prevDist = route.length;
      for (let i = 0; i < route.length + 2; ++i) {
        const res = advanceMinotaurLure();
        if (!res || !res.status) throw new Error('D5: advanceMinotaurLure returned invalid result');
        lastStatus = res.status;
        if (minotaurX === prevX && minotaurY === prevY) throw new Error('D5: Minotaur did not move');
        if (Math.abs(minotaurX - prevX) + Math.abs(minotaurY - prevY) !== 1) throw new Error('D5: Minotaur moved non-adjacently');
        if (!maze[minotaurY] || maze[minotaurY][minotaurX] !== 1) throw new Error('D5: Minotaur moved to non-walkable tile');
        const curDist = computePathBetween(minotaurX, minotaurY, P.x, P.y).length;
        if (curDist > prevDist) throw new Error('D5: Minotaur distance increased');
        prevX = minotaurX; prevY = minotaurY;
        prevDist = curDist;
        if (lastStatus === 'shattered') break;
      }
      if (lastStatus !== 'shattered') throw new Error('D5: Minotaur did not shatter decoy');
      if (window.activeDecoy !== null) throw new Error('D5: activeDecoy not cleared after shatter');
      const stunMs = minotaurStunnedUntil - Date.now();
      if (stunMs < 4500 || stunMs > 5000) throw new Error('D5: Minotaur stun out of range');
      if (minotaurRadar && !minotaurRadar.textContent.startsWith('Minotaur: Stunned')) throw new Error('D5: minotaurRadar text not stunned');
      for (let i = 1; i < minotaurPath.length; ++i) {
        const a = minotaurPath[i-1], b = minotaurPath[i];
        if (!maze[a.y] || maze[a.y][a.x] !== 1 || !maze[b.y] || maze[b.y][b.x] !== 1) throw new Error('D5: minotaurPath node not walkable');
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) throw new Error('D5: minotaurPath not 4-adjacent');
      }
      D5 = true;
    }
  } catch (e) {
    consoleErrors.push(e && e.message ? e.message : String(e));
  } finally {
    // Restore arrays/sets in-place
    function restoreArray(target, saved) {
      target.length = 0;
      for (const v of saved) target.push(v);
    }
    function restoreSet(target, saved) {
      target.clear();
      for (const v of saved) target.add(v);
    }
    restoreSet(visitedTiles, savedVisitedTiles);
    restoreArray(minotaurPath, savedMinotaurPath);
    restoreArray(orpheusShrines, savedOrpheusShrines);
    restoreArray(keys, savedKeys);
    restoreArray(gates, savedGates);
    restoreArray(torchPickups, savedTorchPickups);
    restoreArray(threadSpools, savedThreadSpools);
    restoreArray(aegisShrines, savedAegisShrines);
    restoreArray(hermesShrines, savedHermesShrines);
    restoreArray(chronosShrines, savedChronosShrines);
    restoreArray(daedalusShrines, savedDaedalusShrines);
    restoreArray(icarusShrines, savedIcarusShrines);
    // Scalars
    playerX = savedPlayerX;
    playerY = savedPlayerY;
    escapeX = savedEscapeX;
    escapeY = savedEscapeY;
    minotaurActive = savedMinotaurActive;
    minotaurX = savedMinotaurX;
    minotaurY = savedMinotaurY;
    minotaurStunnedUntil = savedMinotaurStunnedUntil;
    playerDecoys = savedPlayerDecoys;
    decoyFlashUntil = savedDecoyFlashUntil;
    steps = savedSteps;
    torchActive = savedTorchActive;
    torchStepsRemaining = savedTorchStepsRemaining;
    playerSpools = savedPlayerSpools;
    compassStepsRemaining = savedCompassStepsRemaining;
    playerShields = savedPlayerShields;
    playerDashes = savedPlayerDashes;
    playerRecalls = savedPlayerRecalls;
    playerBreaches = savedPlayerBreaches;
    playerFlares = savedPlayerFlares;
    solarFlareStepsRemaining = savedSolarFlareStepsRemaining;
    playerKeys = savedPlayerKeys;
    gameWon = savedGameWon;
    gameLost = savedGameLost;
    lastMoveDir = savedLastMoveDir ? { dx: savedLastMoveDir.dx, dy: savedLastMoveDir.dy } : null;
    chronosAnchor = savedChronosAnchor ? { ...savedChronosAnchor } : null;
    activeDecoy = savedActiveDecoy ? { x: savedActiveDecoy.x, y: savedActiveDecoy.y, steps: savedActiveDecoy.steps } : null;
    window.activeDecoy = activeDecoy;
    window.orpheusShrines = orpheusShrines;
    // DOM overlays and HUD
    if (winOverlay) {
      winOverlay.style.display = savedWinOverlayDisplay;
      winOverlay.textContent = savedWinOverlayText;
    }
    if (loseOverlay) loseOverlay.style.display = savedLoseOverlayDisplay;
    if (stepCounter) stepCounter.textContent = savedStepCounterText;
    if (uniqueTilesCounter) uniqueTilesCounter.textContent = savedUniqueTilesCounterText;
    if (keyCounter) keyCounter.textContent = savedKeyCounterText;
    // UI updates
    if (typeof updateTorchIndicator === 'function') updateTorchIndicator();
    if (typeof updateSpoolUI === 'function') updateSpoolUI();
    if (typeof updateShieldUI === 'function') updateShieldUI();
    if (typeof updateDashUI === 'function') updateDashUI();
    if (typeof updateRecallUI === 'function') updateRecallUI();
    if (typeof updateBreachUI === 'function') updateBreachUI();
    if (typeof updateFlareUI === 'function') updateFlareUI();
    if (typeof updateDecoyUI === 'function') updateDecoyUI();
    if (typeof drawMaze === 'function') drawMaze();
    console.error = origConsoleError;
  }
  return { D1, D2, D3, D4, D5, D6, consoleErrors };
};
