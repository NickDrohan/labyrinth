

window.runOwlSmokeSpec = function() {
  const consoleErrors = [];
  const origConsoleError = console.error;
  console.error = function(...args) {
    consoleErrors.push(args.map(a => String(a)).join(' '));
    return origConsoleError.apply(console, args);
  };

  const onWinError = e => consoleErrors.push('window.error: ' + (e && e.message ? e.message : String(e)) + (e && e.filename ? ' @' + e.filename + ':' + e.lineno : ''));
  window.addEventListener('error', onWinError);

  // Snapshot all scalar globals
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
  const savedLastMoveDir = lastMoveDir ? { dx: lastMoveDir.dx, dy: lastMoveDir.dy } : null;

  const savedMinotaurLoopRunning = minotaurInterval !== null;

  const savedPlayerFlares = playerFlares;
  const savedSolarFlareStepsRemaining = solarFlareStepsRemaining;
  const savedPlayerKeys = playerKeys;
  const savedGameWon = gameWon;
  const savedGameLost = gameLost;

  // Snapshot all collections
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
  const savedAthenaShrines = athenaShrines.map(a => ({ x: a.x, y: a.y }));
  const savedOwlEscapePreview = owlEscapePreview.map(p => ({ x: p. x, y: p. y }));

  // Snapshot Poseidon state
  const savedPlayerTridents = playerTridents;
  const savedRiptideFlashUntil = riptideFlashUntil;
  const savedPoseidonShrines = poseidonShrines.map(p => ({ x: p.x, y: p.y }));
  const savedRiptideTrail = riptideTrail.map(p => ({ x: p.x, y: p.y }));

  // Snapshot Artemis state
  const savedPlayerArrows = playerArrows;
  const savedArrowVisionStepsRemaining = arrowVisionStepsRemaining;
  const savedArrowFlashUntil = arrowFlashUntil;
  const savedArtemisShrines = artemisShrines.map(a => ({ x: a.x, y: a.y }));
  const savedArrowTrail = arrowTrail.map(t => ({ x: t.x, y: t.y }));

  // Snapshot Apollo Sun Chariot state
  const savedPlayerChariots = playerChariots;
  const savedChariotTrailStepsRemaining = chariotTrailStepsRemaining;
  const savedChariotFlashUntil = chariotFlashUntil;
  const savedApolloShrines = apolloShrines.map(ap => ({ x: ap.x, y: ap.y }));
  const savedChariotTrail = chariotTrail.map(t => ({ x: t.x, y: t.y }));

  // Snapshot Hephaestus Forge state
  const savedPlayerAnvils = playerAnvils;
  const savedActiveAnvilTrap = activeAnvilTrap ? { x: activeAnvilTrap.x, y: activeAnvilTrap.y, steps: activeAnvilTrap.steps } : null;
  const savedAnvilFlashUntil = anvilFlashUntil;
  const savedHephaestusShrines = hephaestusShrines.map(h => ({ x: h.x, y: h.y }));

  // Snapshot DOM elements
  const winOverlay = document.getElementById('winOverlay');
  const loseOverlay = document.getElementById('loseOverlay');
  const stepCounter = document.getElementById('stepCounter');
  const uniqueTilesCounter = document.getElementById('uniqueTilesCounter');
  const keyCounter = document.getElementById('keyCounter');
  const owlCounter = document.getElementById('owlCounter');
  const owlButton = document.getElementById('owlButton');
  const minotaurRadar = document.getElementById('minotaurRadar');
  const savedWinOverlayDisplay = winOverlay ? winOverlay.style.display : null;
  const savedWinOverlayText = winOverlay ? winOverlay.textContent : null;
  const savedLoseOverlayDisplay = loseOverlay ? loseOverlay.style.display : null;
  const savedStepCounterText = stepCounter ? stepCounter.textContent : null;
  const savedUniqueTilesCounterText = uniqueTilesCounter ? uniqueTilesCounter.textContent : null;
  const savedKeyCounterText = keyCounter ? keyCounter.textContent : null;
  const savedWinOverlayTextContent = savedWinOverlayText;
  const savedOwlCounterText = owlCounter ? owlCounter.textContent : null;
  const savedOwlButtonDisabled = owlButton ? owlButton.disabled : null;
  const savedMinotaurRadarDisplay = minotaurRadar ? minotaurRadar.style.display : null;

  // Initialize flags
  let O1 = false, O2 = false, O3 = false, O4 = false, O5 = false, O6 = false;

  try {
    // Reset transient lures
    gameWon = false;
    gameLost = false;
    activeDecoy = null;
    window.activeDecoy = null;
    owlStepsRemaining = 0;
    owlEscapePreview = [];

    arrowVisionStepsRemaining = 0;
    arrowTrail = [];
    chariotTrailStepsRemaining = 0;
    chariotTrail = [];
    activeAnvilTrap = null;
    window.activeAnvilTrap = null;

    // O1: Verify Athena Shrine placement
    {
      const anchors = [
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
        ...savedIcarusShrines,
        ...savedOrpheusShrines
      ];
      if (Array.isArray(window.secretPassages)) {
        for (const sp of window.secretPassages) {
          anchors.push({ x: sp.fromX, y: sp.fromY });
          anchors.push({ x: sp.toX, y: sp.toY });
        }
      }
      const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const st = { x: savedPlayerX, y: savedPlayerY };
      O1 = Array.isArray(athenaShrines) && 
           athenaShrines.length >= 12 && 
           athenaShrines.every(s => maze[s.y] && maze[s.y][s.x] === 1) && 
           athenaShrines.filter(s => md(s, st) <= 35).length >= 3 && 
           athenaShrines.every((s, i) => 
             anchors.every(a => md(s, a) >= 5) && 
             athenaShrines.every((o, j) => j === i || md(s, o) >= 5)
           );
    }

    // O2: Test owl pickup and cap
    minotaurActive = false; minotaurX = -1; minotaurY = -1; escapeX = -1; escapeY = -1;
    playerX = savedPlayerX; playerY = savedPlayerY; owlStepsRemaining = 0; owlEscapePreview = [];
    
    // Find a valid 4-cardinal neighbor
    const directions = [
      { dx: 0, dy: -1, key: 'ArrowUp', mobile: 'up', opp: 'down', oppKey: 'ArrowDown' },
      { dx: 0, dy: 1, key: 'ArrowDown', mobile: 'down', opp: 'up', oppKey: 'ArrowUp' },
      { dx: -1, dy: 0, key: 'ArrowLeft', mobile: 'left', opp: 'right', oppKey: 'ArrowRight' },
      { dx: 1, dy: 0, key: 'ArrowRight', mobile: 'right', opp: 'left', oppKey: 'ArrowLeft' }
    ];
    let validDir = null;
    for (const dir of directions) {
      const nx = savedPlayerX + dir.dx;
      const ny = savedPlayerY + dir.dy;
      if (maze[ny] && maze[ny][nx] === 1 && 
          !gates.some(g => g.x === nx && g.y === ny) &&
          !(window.secretPassages && window.secretPassages.some(sp => sp.fromX === nx && sp.fromY === ny))) {
        validDir = { ...dir, nx, ny };
        break;
      }
    }
    if (!validDir) {
      throw new Error('O2: No valid neighbor for owl pickup test');
    }
    
    // Ensure athenaShrines has the valid neighbor
    const shrineExists = athenaShrines.some(s => s.x === validDir.nx && s.y === validDir.ny);
    if (!shrineExists) {
      athenaShrines.push({ x: validDir.nx, y: validDir.ny });
    }
    
    // Perform the pickup test
    playerOwls = 0;
    updateOwlUI();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.key }));
    
    // Verify pickup
    if (playerOwls === 1 && 
        !athenaShrines.some(s => s.x === validDir.nx && s.y === validDir.ny) &&
        owlCounter && owlCounter.textContent === 'Owls: 1 (Off)' &&
        owlButton && owlButton.disabled === false) {
      
      // Test MAX_OWLS cap
      playerOwls = MAX_OWLS;
      athenaShrines.push({ x: savedPlayerX, y: savedPlayerY });
      updateOwlUI();
      handleMobileMove(validDir.opp);
      
      // Verify cap
      if (playerOwls === MAX_OWLS && 
          athenaShrines.some(s => s.x === savedPlayerX && s.y === savedPlayerY)) {
        // Clean up test shrines
        for (let i = athenaShrines.length - 1; i >= 0; i--) {
          const s = athenaShrines[i];
          if ((s.x === savedPlayerX && s.y === savedPlayerY) || (s.x === validDir.nx && s.y === validDir.ny)) {
            athenaShrines.splice(i, 1);
          }
        }
        O2 = true;
      }
    }

    // O3: Test owl movement
    minotaurActive = false; minotaurX = -1; minotaurY = -1; escapeX = savedEscapeX; escapeY = savedEscapeY;
    playerX = savedPlayerX; playerY = savedPlayerY; playerOwls = 1; owlStepsRemaining = 0; owlEscapePreview = [];
    updateOwlUI();
    
    // Dispatch v-hotkey
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
    
    // Verify activation
    if (playerOwls === 0 && 
        owlStepsRemaining === 22 && 
        Array.isArray(owlEscapePreview) && 
        owlEscapePreview.length > 0 && 
        owlEscapePreview.length <= 10 && 
        owlCounter && 
        owlCounter.textContent === 'Owls: 0 (Sight: 22)' && 
        owlCounter.classList.contains('active') && 
        owlButton && 
        owlButton.disabled === true) {
      
      // Verify guard conditions
      const guard1 = triggerOwlClairvoyance() === false; // Active (owlStepsRemaining === 22)
      
      // Reset for next test
      owlStepsRemaining = 0;
      playerOwls = 0;
      const guard2 = triggerOwlClairvoyance() === false; // owlStepsRemaining = 0
      
      // Reset for next test
      playerOwls = 1;
      const oldGameWon = gameWon;
      gameWon = true;
      const guard3 = triggerOwlClairvoyance() === false; // gameWon = true
      gameWon = oldGameWon;
      
      if (guard1 && guard2 && guard3) {
        O3 = true;
      }
    }

    // O4: Test 22-step countdown
    minotaurActive = false; minotaurX = -1; minotaurY = -1; escapeX = savedEscapeX; escapeY = savedEscapeY;
    playerX = savedPlayerX; playerY = savedPlayerY; playerOwls = 0; owlStepsRemaining = 22; refreshOwlEscapePreview(); updateOwlUI();
    
    // Run 22-step loop
    for (let i = 0; i < 22; i++) {
      if (i % 2 === 0) {
        handleMobileMove(validDir.mobile);
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.oppKey }));
      }
      
      // Verify after first move
      if (i === 0) {
        if (owlStepsRemaining === 21 && owlEscapePreview.length > 0) {
          // Continue
        } else {
          break;
        }
      }
    }
    
    // Verify final state
    if (owlStepsRemaining === 0 && 
        owlEscapePreview.length === 0 && 
        owlCounter && 
        owlCounter.textContent === 'Owls: 0 (Off)' && 
        !owlCounter.classList.contains('active') && 
        owlButton && 
        owlButton.disabled === true) {
      O4 = true;
    }

    // O5: Test glare stun
    minotaurActive = true; minotaurX = validDir.nx; minotaurY = validDir.ny; minotaurStunnedUntil = 0;
    playerX = savedPlayerX; playerY = savedPlayerY; playerOwls = 1; owlStepsRemaining = 0; owlEscapePreview = [];
    updateOwlUI();
    
    const glareRes = triggerOwlClairvoyance();
    if (glareRes === true && 
        playerOwls === 0 && 
        owlStepsRemaining === 22 && 
        (minotaurStunnedUntil - Date.now() >= 2500) && 
        (!minotaurRadar || minotaurRadar.textContent.startsWith('Minotaur: Stunned'))) {
      O5 = true;
    }

    // O6: Test clear-on-win
    minotaurActive = false; minotaurX = -1; minotaurY = -1; escapeX = validDir.nx; escapeY = validDir.ny;
    playerX = savedPlayerX; playerY = savedPlayerY; gameWon = false; gameLost = false; playerOwls = 1; owlStepsRemaining = 10; owlEscapePreview = [{ x: validDir.nx, y: validDir.ny }];
    updateOwlUI();
    
    handleMobileMove(validDir.mobile);
    
    // Verify win conditions
    if (gameWon === true && 
        owlStepsRemaining === 0 && 
        owlEscapePreview.length === 0 && 
        owlCounter && 
        owlCounter.textContent === 'Owls: 1 (Off)' && 
        !owlCounter.classList.contains('active') && 
        owlButton && 
        owlButton.disabled === true) {
      O6 = true;
      gameWon = false;
      if (winOverlay) winOverlay.style.display = 'none';
    }

    return { O1, O2, O3, O4, O5, O6, consoleErrors };
  } catch (e) {
    console.error(e);
    if (e && e.message) {
      consoleErrors.push(e.message);
    } else {
      consoleErrors.push(String(e));
    }
    return { O1, O2, O3, O4, O5, O6, consoleErrors };
  } finally {
    // Restore local helpers
    function restoreArray(target, saved) { target.length = 0; for (const v of saved) target.push(v); }
    function restoreSet(target, saved) { target.clear(); for (const v of saved) target.add(v); }

    // Restore all snapshotted collections in-place
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
    restoreArray(poseidonShrines, savedPoseidonShrines);
    restoreArray(riptideTrail, savedRiptideTrail);
    restoreArray(artemisShrines, savedArtemisShrines);
    restoreArray(arrowTrail, savedArrowTrail);
    restoreArray(apolloShrines, savedApolloShrines);
    restoreArray(chariotTrail, savedChariotTrail);
    restoreArray(hephaestusShrines, savedHephaestusShrines);

    // Restore visitedTiles via restoreSet (visitedTiles is a Set)
    restoreSet(visitedTiles, savedVisitedTiles);

    // Restore all scalar and object globals
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
    playerTridents = savedPlayerTridents;
    riptideFlashUntil = savedRiptideFlashUntil;
    playerArrows = savedPlayerArrows;
    arrowVisionStepsRemaining = savedArrowVisionStepsRemaining;
    arrowFlashUntil = savedArrowFlashUntil;
    playerChariots = savedPlayerChariots;
    chariotTrailStepsRemaining = savedChariotTrailStepsRemaining;
    chariotFlashUntil = savedChariotFlashUntil;
    playerAnvils = savedPlayerAnvils;
    activeAnvilTrap = savedActiveAnvilTrap ? { x: savedActiveAnvilTrap.x, y: savedActiveAnvilTrap.y, steps: savedActiveAnvilTrap.steps } : null;
    window.activeAnvilTrap = activeAnvilTrap;
    anvilFlashUntil = savedAnvilFlashUntil;
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

    // Restore DOM overlay and counter states
    if (winOverlay) { winOverlay.style.display = savedWinOverlayDisplay; winOverlay.textContent = savedWinOverlayText; }
    if (loseOverlay) loseOverlay.style.display = savedLoseOverlayDisplay;
    if (stepCounter) stepCounter.textContent = savedStepCounterText;
    if (uniqueTilesCounter) uniqueTilesCounter.textContent = savedUniqueTilesCounterText;
    if (keyCounter) keyCounter.textContent = savedKeyCounterText;
    if (owlCounter) owlCounter.textContent = savedOwlCounterText;
    if (owlButton) owlButton.disabled = savedOwlButtonDisabled;
    if (minotaurRadar) minotaurRadar.style.display = savedMinotaurRadarDisplay;

    // Invoke all HUD update functions
    if (typeof updateTorchIndicator === 'function') updateTorchIndicator();
    if (typeof updateSpoolUI === 'function') updateSpoolUI();
    if (typeof updateShieldUI === 'function') updateShieldUI();
    if (typeof updateDashUI === 'function') updateDashUI();
    if (typeof updateRecallUI === 'function') updateRecallUI();
    if (typeof updateBreachUI === 'function') updateBreachUI();
    if (typeof updateFlareUI === 'function') updateFlareUI();
    if (typeof updateDecoyUI === 'function') updateDecoyUI();
    if (typeof updateOwlUI === 'function') updateOwlUI();
    if (typeof updateTridentUI === 'function') updateTridentUI();
    if (typeof updateArrowUI === 'function') updateArrowUI();
    if (typeof updateChariotUI === 'function') updateChariotUI();
    if (typeof updateAnvilUI === 'function') updateAnvilUI();

    // Restore Minotaur loop if it was running before the spec
    if (savedMinotaurLoopRunning && minotaurInterval === null && typeof startMinotaurLoop === 'function') startMinotaurLoop();

    if (typeof drawMaze === 'function') drawMaze();

    window.removeEventListener('error', onWinError);

    console.error = origConsoleError;
  }
}
