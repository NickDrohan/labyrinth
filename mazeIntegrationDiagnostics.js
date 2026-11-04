
window.runIntegrationSmokeSpec = function() {
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
  const savedPlayerOwls = playerOwls;
  const savedOwlStepsRemaining = owlStepsRemaining;
  const savedOwlFlashUntil = owlFlashUntil;
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
  
  // Collections
  const savedVisitedTiles = [...visitedTiles];
  const savedMinotaurPath = [...minotaurPath];
  const savedOrpheusShrines = [...orpheusShrines];
  const savedActiveDecoy = activeDecoy ? { x: activeDecoy.x, y: activeDecoy.y, steps: activeDecoy.steps } : null;
  const savedChronosAnchor = chronosAnchor ? { ...chronosAnchor } : null;
  const savedKeys = [...keys];
  const savedGates = [...gates];
  const savedTorchPickups = [...torchPickups];
  const savedThreadSpools = [...threadSpools];
  const savedAegisShrines = [...aegisShrines];
  const savedHermesShrines = [...hermesShrines];
  const savedChronosShrines = [...chronosShrines];
  const savedDaedalusShrines = [...daedalusShrines];
  const savedIcarusShrines = [...icarusShrines];
  const savedAthenaShrines = [...athenaShrines];
  const savedOwlEscapePreview = [...owlEscapePreview];
  const savedBreachedTiles = [...breachedTiles];
  const savedDashTrail = [...dashTrail];
  const savedDashTrailUntil = dashTrailUntil;

  // DOM elements
  const winOverlay = document.getElementById('winOverlay');
  const loseOverlay = document.getElementById('loseOverlay');
  const stepCounter = document.getElementById('stepCounter');
  const uniqueTilesCounter = document.getElementById('uniqueTilesCounter');
  const keyCounter = document.getElementById('keyCounter');
  const decoyCounter = document.getElementById('decoyCounter');
  const decoyButton = document.getElementById('decoyButton');
  const minotaurRadar = document.getElementById('minotaurRadar');
  const compassIndicator = document.getElementById('compassIndicator');
  const torchIndicator = document.getElementById('torchIndicator');

  // Snapshot additional DOM element states
  const savedWinOverlayDisplay = winOverlay ? winOverlay.style.display : '';
  const savedWinOverlayText = winOverlay ? winOverlay.textContent : '';
  const savedLoseOverlayDisplay = loseOverlay ? loseOverlay.style.display : '';
  const savedStepCounterText = stepCounter ? stepCounter.textContent : '';
  const savedUniqueTilesCounterText = uniqueTilesCounter ? uniqueTilesCounter.textContent : '';
  const savedKeyCounterText = keyCounter ? keyCounter.textContent : '';
  const savedDecoyCounterText = decoyCounter ? decoyCounter.textContent : '';
  const savedCompassText = compassIndicator ? compassIndicator.textContent : '';
  const savedTorchText = torchIndicator ? torchIndicator.textContent : '';

  // Helper functions
  function validDir(px = playerX, py = playerY) {
    const dirs = [
      { dx: 0, dy: -1, key: 'ArrowUp', mobile: 'up', opp: 'down', oppKey: 'ArrowDown' },
      { dx: 0, dy: 1, key: 'ArrowDown', mobile: 'down', opp: 'up', oppKey: 'ArrowUp' },
      { dx: -1, dy: 0, key: 'ArrowLeft', mobile: 'left', opp: 'right', oppKey: 'ArrowRight' },
      { dx: 1, dy: 0, key: 'ArrowRight', mobile: 'right', opp: 'left', oppKey: 'ArrowLeft' }
    ];
    for (const dir of dirs) {
      const nx = px + dir.dx;
      const ny = py + dir.dy;
      if (ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length &&
          maze[ny] && maze[ny][nx] === 1 &&
          !gates.some(g => g.x === nx && g.y === ny) &&
          !(window.secretPassages && window.secretPassages.some(sp => sp.fromX === nx && sp.fromY === ny))) {
        return dir;
      }
    }
    return null;
  }

  function findPursuer(px, py) {
    for (let r = 8; r <= 20; r++) {
      for (let dx = -r; dx <= r; dx++) {
        const dy = r - Math.abs(dx);
        const dyOffsets = dy === 0 ? [0] : [dy, -dy];
        for (const dyOffset of dyOffsets) {
          const qx = px + dx;
          const qy = py + dyOffset;
          if (qx >= 0 && qx < maze[0].length && qy >= 0 && qy < maze.length &&
              maze[qy] && maze[qy][qx] === 1) {
            const route = computePathBetween(qx, qy, px, py);
            if (route.length >= 10 && route.length <= 40) {
              return { x: qx, y: qy, route };
            }
          }
        }
      }
    }
    return null;
  }

  function walkTrail(max) {
    for (let i = 0; i < max; i++) {
      sanitizeMinotaurPath();
      const n = minotaurPath.shift();
      if (!n) return false;
      const d = Math.abs(n.x - minotaurX) + Math.abs(n.y - minotaurY);
      const walk = !!(maze[n.y] && maze[n.y][n.x] === 1);
      const hop = secretPassages.some(p => p.fromX === minotaurX && p.fromY === minotaurY && p.toX === n.x && p.toY === n.y);
      if (!((d <= 1 && walk) || hop)) return false;
      minotaurX = n.x;
      minotaurY = n.y;
      if (Math.abs(minotaurX - playerX) + Math.abs(minotaurY - playerY) <= 1) break;
    }
    return true;
  }

  // Flags
  let I1 = false;
  let I2 = false;
  let I3 = false;
  let I4 = false;
  let I5 = false;
  let I6 = false;

  try {
    // Reset minotaur state
    minotaurActive = false;
    minotaurX = -1;
    minotaurY = -1;
    activeDecoy = null;
    window.activeDecoy = null;
    owlStepsRemaining = 0;
    owlEscapePreview = [];

    // I1: Keyboard victory
    {
      const dir = validDir(savedPlayerX, savedPlayerY);
      if (dir) {
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        gameWon = false;
        gameLost = false;
        escapeX = savedPlayerX + dir.dx;
        escapeY = savedPlayerY + dir.dy;
        compassStepsRemaining = 5;
        torchActive = true;
        torchStepsRemaining = 10;
        playerDecoys = 1;
        activeDecoy = null;
        window.activeDecoy = null;
        updateDecoyUI();
        updateSpoolUI();
        updateTorchIndicator();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: dir.key }));
        if (Boolean(gameWon === true && winOverlay && winOverlay.style.display === 'flex' && winOverlay.textContent.startsWith('You Escaped!') && compassIndicator && compassIndicator.textContent === 'Compass: Off' && torchIndicator && torchIndicator.textContent === '' && decoyButton && decoyButton.disabled === true)) {
          I1 = true;
        }
        gameWon = false;
        if (winOverlay) winOverlay.style.display = 'none';
        escapeX = -1;
        escapeY = -1;
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        compassStepsRemaining = 0;
        torchActive = false;
        torchStepsRemaining = 0;
        playerDecoys = 0;
        updateDecoyUI();
        updateSpoolUI();
        updateTorchIndicator();
      }
    }

    // I2: Mobile victory (same as I1 but via handleMobileMove)
    {
      const dir = validDir(savedPlayerX, savedPlayerY);
      if (dir) {
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        gameWon = false;
        gameLost = false;
        escapeX = savedPlayerX + dir.dx;
        escapeY = savedPlayerY + dir.dy;
        compassStepsRemaining = 5;
        torchActive = true;
        torchStepsRemaining = 10;
        playerDecoys = 1;
        activeDecoy = null;
        window.activeDecoy = null;
        updateDecoyUI();
        updateSpoolUI();
        updateTorchIndicator();
        handleMobileMove(dir.mobile);
        if (Boolean(gameWon === true && winOverlay && winOverlay.style.display === 'flex' && winOverlay.textContent.startsWith('You Escaped!') && compassIndicator && compassIndicator.textContent === 'Compass: Off' && torchIndicator && torchIndicator.textContent === '' && decoyButton && decoyButton.disabled === true)) {
          I2 = true;
        }
        gameWon = false;
        if (winOverlay) winOverlay.style.display = 'none';
        escapeX = -1;
        escapeY = -1;
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        compassStepsRemaining = 0;
        torchActive = false;
        torchStepsRemaining = 0;
        playerDecoys = 0;
        updateDecoyUI();
        updateSpoolUI();
        updateTorchIndicator();
      }
    }

    // I3: Minotaur trail continuity after repel
    {
      playerX = savedPlayerX;
      playerY = savedPlayerY;
      const Q = findPursuer(savedPlayerX, savedPlayerY);
      if (Q) {
        minotaurActive = true;
        minotaurX = Q.x;
        minotaurY = Q.y;
        minotaurPath = computePathBetween(Q.x, Q.y, savedPlayerX, savedPlayerY);
        playerShields = 1;
        triggerAegisRepel(false);
      }
      I3 = (playerShields === 0 && walkTrail(80) === true);
    }

    // I4: Dash through a wall
    {
      const startX = savedPlayerX;
      const startY = savedPlayerY;
      let found = false;
      // Search within Manhattan radius 0..15 of (savedPlayerX, savedPlayerY)
      for (let r = 0; r <= 15 && !found; r++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const dy = r - Math.abs(dx);
          const A = { x: startX + dx, y: startY + dy };
          if (A.x >= 0 && A.y >= 0 && A.y < maze.length && A.x < maze[A.y].length && maze[A.y] && maze[A.y][A.x] === 1 && !gates.some(g => g.x === A.x && g.y === A.y)) {
            // 4-direction d where A+d is an in-bounds wall and A+2d is walkable and not a gate or secret passage
            const dirs = [
              { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
              { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];
            for (const d of dirs) {
              const nx = A.x + d.dx;
              const ny = A.y + d.dy;
              if (nx >= 0 && ny >= 0 && ny < maze.length && nx < maze[ny].length && maze[ny] && maze[ny][nx] === 0) {
                // A+d is wall
                const nnx = nx + d.dx;
                const nny = ny + d.dy;
                if (nnx >= 0 && nny >= 0 && nny < maze.length && nnx < maze[nny].length && maze[nny] && maze[nny][nnx] === 1) {
                  // A+2d is walkable
                  // Not a gate or secret passage
                  if (!gates.some(g => g.x === nnx && g.y === nny) && !secretPassages.some(p => p.fromX === nnx && p.fromY === nny)) {
                    playerX = A.x;
                    playerY = A.y;
                    lastMoveDir = { dx: d.dx, dy: d.dy };
                    playerDashes = 1;
                    const Q2 = findPursuer(A.x, A.y);
                    if (!Q2) {
                      I4 = 'skipped';
                      found = true;
                      break;
                    }
                    minotaurActive = true;
                    minotaurX = Q2.x;
                    minotaurY = Q2.y;
                    minotaurPath = computePathBetween(Q2.x, Q2.y, A.x, A.y);
                    triggerPhaseDash();
                    I4 = (playerX === A.x + 2 * d.dx && playerY === A.y + 2 * d.dy && walkTrail(80) === true);
                    found = true;
                    break;
                  }
                }
              }
            }
            if (found) break;
          }
          if (found) break;
        }
        if (found) break;
      }
      if (!found) {
        I4 = 'skipped';
      }
    }

    // I5: Recall continuity
    {
      playerX = savedPlayerX;
      playerY = savedPlayerY;
      const dir = validDir(savedPlayerX, savedPlayerY);
      if (dir) {
        chronosAnchor = { x: savedPlayerX, y: savedPlayerY };
        playerRecalls = 1;
        minotaurActive = false;
        handleMobileMove(dir.mobile);
      }
      const Q = findPursuer(savedPlayerX, savedPlayerY);
      if (!Q) {
        I5 = 'skipped';
      } else {
        minotaurActive = true;
        minotaurX = Q.x;
        minotaurY = Q.y;
        minotaurPath = computePathBetween(Q.x, Q.y, playerX, playerY);
        minotaurStunnedUntil = 0;
        triggerChronosRecall();
        I5 = (playerX === savedPlayerX && playerY === savedPlayerY && (minotaurStunnedUntil - Date.now() >= 4500) && walkTrail(80) === true);
      }
    }

    // I6: Ability button reachability/disable-on-win
    {
      gameWon = false;
      gameLost = false;
      compassStepsRemaining = 0;
      solarFlareStepsRemaining = 0;
      activeDecoy = null;
      window.activeDecoy = null;
      minotaurActive = true;
      minotaurX = playerX + 30;
      playerSpools = 1;
      playerShields = 1;
      playerDashes = 1;
      playerRecalls = 1;
      playerBreaches = 1;
      playerFlares = 1;
      playerDecoys = 1;
      updateSpoolUI();
      updateShieldUI();
      updateDashUI();
      updateRecallUI();
      updateBreachUI();
      updateFlareUI();
      updateDecoyUI();
      // Verify all 7 buttons enabled when gameWon === false
      const buttons = ['#useSpoolButton', '#repelButton', '#dashButton', '#recallButton', '#breachButton', '#flareButton', '#decoyButton'];
      let allEnabled = true;
      for (const sel of buttons) {
        const btn = document.querySelector(sel);
        if (!btn || btn.disabled !== false) {
          allEnabled = false;
          break;
        }
      }
      if (allEnabled) {
        gameWon = true;
        updateSpoolUI();
        updateShieldUI();
        updateDashUI();
        updateRecallUI();
        updateBreachUI();
        updateFlareUI();
        updateDecoyUI();
        // Verify all 7 buttons disabled after gameWon
        let allDisabled = true;
        for (const sel of buttons) {
          const btn = document.querySelector(sel);
          if (!btn || btn.disabled !== true) {
            allDisabled = false;
            break;
          }
        }
        if (allDisabled) {
          I6 = true;
        }
        gameWon = false;
      }
    }

    // @@INTEGRATION_CHECKS_APPEND@@
  } catch (e) {
    consoleErrors.push(e && e.message ? e.message : String(e));
  }

  // Restore all state in finally
  finally {
    // Helper functions for restoring collections
    function restoreArray(target, saved) {
      target.length = 0;
      for (let i = 0; i < saved.length; i++) {
        target.push(saved[i]);
      }
    }

    function restoreSet(target, saved) {
      target.clear();
      for (let i = 0; i < saved.length; i++) {
        target.add(saved[i]);
      }
    }

    // Restore scalar globals
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
    playerOwls = savedPlayerOwls;
    owlStepsRemaining = savedOwlStepsRemaining;
    owlFlashUntil = savedOwlFlashUntil;
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
    // Restore arrays in-place
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
    restoreArray(athenaShrines, savedAthenaShrines);
    restoreArray(owlEscapePreview, savedOwlEscapePreview);
    restoreArray(breachedTiles, savedBreachedTiles);

    // Restore scalar/object state
    lastMoveDir = savedLastMoveDir ? { dx: savedLastMoveDir.dx, dy: savedLastMoveDir.dy } : null;
    chronosAnchor = savedChronosAnchor ? { ...savedChronosAnchor } : null;
    activeDecoy = savedActiveDecoy ? { x: savedActiveDecoy.x, y: savedActiveDecoy.y, steps: savedActiveDecoy.steps } : null;
    window.activeDecoy = activeDecoy;
    dashTrailUntil = savedDashTrailUntil;

    // Restore collections in-place
    restoreArray(dashTrail, savedDashTrail);
    window.orpheusShrines = orpheusShrines;
    window.athenaShrines = athenaShrines;

    // Restore DOM elements
    if (winOverlay) {
      winOverlay.style.display = savedWinOverlayDisplay;
      winOverlay.textContent = savedWinOverlayText;
    }
    if (loseOverlay) loseOverlay.style.display = savedLoseOverlayDisplay;
    if (stepCounter) stepCounter.textContent = savedStepCounterText || `Steps: ${steps}`;
    if (uniqueTilesCounter) uniqueTilesCounter.textContent = savedUniqueTilesCounterText || `Unique Tiles: ${visitedTiles.size}`;
    if (keyCounter) keyCounter.textContent = savedKeyCounterText || `Keys: ${playerKeys}`;

    // Update UI indicators
    updateTorchIndicator();
    updateSpoolUI();
    updateShieldUI();
    updateDashUI();
    updateRecallUI();
    updateBreachUI();
    updateFlareUI();
    updateDecoyUI();
    updateOwlUI();
    drawMaze();

    // Restore console error handler
    console.error = origConsoleError;

    return { I1, I2, I3, I4, I5, I6, consoleErrors };
  }
};