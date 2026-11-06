
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

  const savedPlayerArrows = playerArrows;
  const savedArrowVisionStepsRemaining = arrowVisionStepsRemaining;
  const savedArrowFlashUntil = arrowFlashUntil;
  const savedArtemisShrines = artemisShrines.map(a => ({ x: a.x, y: a.y }));
  const savedArrowTrail = arrowTrail.map(t => ({ x: t.x, y: t.y }));

  const savedPlayerTridents = playerTridents;
  const savedRiptideFlashUntil = riptideFlashUntil;
  const savedPoseidonShrines = poseidonShrines.map(p => ({ x: p.x, y: p.y }));
  const savedRiptideTrail = riptideTrail.map(p => ({ x: p.x, y: p.y }));

  // Apollo Sun Chariot state
  const savedPlayerChariots = playerChariots;
  const savedChariotTrailStepsRemaining = chariotTrailStepsRemaining;
  const savedChariotFlashUntil = chariotFlashUntil;
  const savedApolloShrines = apolloShrines.map(ap => ({ x: ap.x, y: ap.y }));
  const savedChariotTrail = chariotTrail.map(t => ({ x: t.x, y: t.y }));

  // Hephaestus Forge state
  const savedPlayerAnvils = playerAnvils;
  const savedActiveAnvilTrap = activeAnvilTrap ? { x: activeAnvilTrap.x, y: activeAnvilTrap.y, steps: activeAnvilTrap.steps } : null;
  const savedAnvilFlashUntil = anvilFlashUntil;
  const savedHephaestusShrines = hephaestusShrines.map(h => ({ x: h.x, y: h.y }));

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
  let I7 = false;
  let I8 = false;
  let I9 = false;

  let I10 = false;

  let I11 = false;

  try {
    // Reset minotaur state
    minotaurActive = false;
    minotaurX = -1;
    minotaurY = -1;
    activeDecoy = null;
    window.activeDecoy = null;
    owlStepsRemaining = 0;
    owlEscapePreview = [];

    arrowVisionStepsRemaining = 0;
    arrowTrail = [];
    chariotTrailStepsRemaining = 0;
    chariotTrail = [];

    // I1: Keyboard victory

    activeAnvilTrap = null;
    window.activeAnvilTrap = null;

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
      const dirs4 = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
      const walk = (x, y) => y >= 0 && y < maze.length && x >= 0 && x < maze[0].length && maze[y][x] === 1;
      const isGate = (x, y) => gates.some(g => g.x === x && g.y === y);
      let A = null, D = null;
      for (let r = 0; r <= 15 && !A; r++) {
        for (let dx = -r; dx <= r && !A; dx++) {
          const dy = r - Math.abs(dx);
          for (const oy of (dy === 0 ? [0] : [dy, -dy])) {
            const ax = savedPlayerX + dx, ay = savedPlayerY + oy;
            if (!walk(ax, ay) || isGate(ax, ay)) continue;
            const d = dirs4.find(v => { const wx = ax + v.dx, wy = ay + v.dy, lx = ax + 2 * v.dx, ly = ay + 2 * v.dy;
              return wy >= 0 && wy < maze.length && wx >= 0 && wx < maze[0].length && maze[wy][wx] === 0 && walk(lx, ly) && !isGate(lx, ly) && !secretPassages.some(p => p.fromX === lx && p.fromY === ly); });
            if (d) { A = { x: ax, y: ay }; D = d; break; }
          }
        }
      }
      if (!A) { I4 = 'skipped'; }
      else {
        playerX = A.x; playerY = A.y; lastMoveDir = { dx: D.dx, dy: D.dy }; playerDashes = 1;
        const Q2 = findPursuer(A.x, A.y);
        if (!Q2) { I4 = false; consoleErrors.push('I4: no pursuer for A ' + A.x + ',' + A.y); }
        else {
          minotaurActive = true; minotaurX = Q2.x; minotaurY = Q2.y;
          minotaurPath = computePathBetween(Q2.x, Q2.y, A.x, A.y);
          triggerPhaseDash();
          I4 = (playerX === A.x + 2 * D.dx && playerY === A.y + 2 * D.dy && walkTrail(80) === true);
        }
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
        gameWon = false;
        gameLost = false;
        minotaurActive = false;
        minotaurX = -1;
        minotaurY = -1;
        handleMobileMove(dir.mobile);
      }
      const Q = findPursuer(savedPlayerX, savedPlayerY);
      if (!Q) {
        I5 = false;
        consoleErrors.push('I5: no pursuer tile');
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

    // I7: Owl button reachability, disable-on-win, keyboard victory clears Owl Sight
    {
      gameWon = false; gameLost = false; playerOwls = 1; owlStepsRemaining = 0; owlEscapePreview = []; updateOwlUI();
      const ob = document.getElementById('owlButton');
      const en = !!ob && ob.disabled === false;
      gameWon = true; updateOwlUI();
      const dis = !!ob && ob.disabled === true;
      gameWon = false;
      const dir = validDir(savedPlayerX, savedPlayerY);
      let clr = false;
      if (dir) {
        playerX = savedPlayerX; playerY = savedPlayerY; escapeX = savedPlayerX + dir.dx; escapeY = savedPlayerY + dir.dy;
        minotaurActive = false; minotaurX = -1; minotaurY = -1; playerOwls = 0; owlStepsRemaining = 5; updateOwlUI();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: dir.key }));
        const oc = document.getElementById('owlCounter');
        clr = gameWon === true && owlStepsRemaining === 0 && owlEscapePreview.length === 0 && !!oc && oc.textContent === 'Owls: 0 (Off)' && !!ob && ob.disabled === true;
        gameWon = false; if (winOverlay) winOverlay.style.display = 'none'; escapeX = -1; escapeY = -1; playerX = savedPlayerX; playerY = savedPlayerY;
      }
      I7 = en && dis && clr;
    }

    // I8: Poseidon shrine invariants, Riptide Surge movement + Minotaur pushback/stun, button disable on win, and score bonus
    {
      const anchors = [
        { x: savedPlayerX, y: savedPlayerY },
        { x: savedEscapeX, y: savedEscapeY },
        ...savedKeys, ...savedGates, ...savedTorchPickups, ...savedThreadSpools,
        ...savedAegisShrines, ...savedHermesShrines, ...savedChronosShrines,
        ...savedDaedalusShrines, ...savedIcarusShrines, ...savedOrpheusShrines, ...savedAthenaShrines
      ];
      for (const sp of (window.secretPassages || [])) {
        anchors.push({ x: sp.fromX, y: sp.fromY }, { x: sp.toX, y: sp.toY });
      }
      const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const st = { x: savedPlayerX, y: savedPlayerY };
      // Restore poseidonShrines from savedPoseidonShrines before placementOk
      poseidonShrines.length = 0;
      poseidonShrines.push(...savedPoseidonShrines);
      window.poseidonShrines = poseidonShrines;
      const placementOk = Array.isArray(poseidonShrines) &&
        poseidonShrines.length >= 12 &&
        poseidonShrines.every(s => maze[s.y] && maze[s.y][s.x] === 1) &&
        poseidonShrines.filter(s => md(s, st) <= 35).length >= 3 &&
        poseidonShrines.every((s, i) => anchors.every(a => md(s, a) >= 5) && poseidonShrines.every((o, j) => j === i || md(s, o) >= 5));

      const dir = validDir(savedPlayerX, savedPlayerY);
      let surgeOk = false;
      let btnOk = false;
      let scoreOk = false;
      if (dir) {
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        escapeX = -1;
        escapeY = -1;
        gameWon = false;
        gameLost = false;
        lastMoveDir = { dx: dir.dx, dy: dir.dy };
        playerTridents = 1;
        updateTridentUI();
        const tb = document.getElementById('tridentButton');
        const en = !!tb && tb.disabled === false;
        gameWon = true;
        updateTridentUI();
        const dis = !!tb && tb.disabled === true;
        gameWon = false;
        updateTridentUI();
        btnOk = en && dis;

        playerTridents = 0;
        const s0 = formatWinSummary();
        playerTridents = 2;
        const s2 = formatWinSummary();
        const m0 = s0.match(/Score:\s*(\d+)/);
        const m2 = s2.match(/Score:\s*(\d+)/);
        scoreOk = !!(m0 && m2 && (Number(m2[1]) - Number(m0[1]) === 300));

        playerX = savedPlayerX;
        playerY = savedPlayerY;
        minotaurActive = true;
        minotaurX = savedPlayerX + dir.dx;
        minotaurY = savedPlayerY + dir.dy;
        minotaurStunnedUntil = 0;
        minotaurPath = computePathBetween(minotaurX, minotaurY, playerX, playerY);
        playerTridents = 1;
        const stepsBefore = steps;
        // Clear poseidonShrines so triggerRiptideSurge cannot collect a Poseidon shrine along its 6-tile path
        poseidonShrines.length = 0;
        const surged = triggerRiptideSurge();
        // Restore poseidonShrines from savedPoseidonShrines after surgeOk is computed
        poseidonShrines.push(...savedPoseidonShrines);
        window.poseidonShrines = poseidonShrines;
        surgeOk = surged === true &&
          playerTridents === 0 &&
          steps === stepsBefore + 1 &&
          (playerX !== savedPlayerX || playerY !== savedPlayerY) &&
          Array.isArray(riptideTrail) && riptideTrail.length >= 2 &&
          minotaurStunnedUntil > Date.now() + 3000;
      }
      I8 = placementOk && btnOk && scoreOk && surgeOk;
    }

    // I9: Artemis shrine invariants, Silver Arrow piercing + vision + pickup + Minotaur pin/stun, button disable on win, and score bonus
    {
      const anchors = [
        { x: savedPlayerX, y: savedPlayerY },
        { x: savedEscapeX, y: savedEscapeY },
        ...savedKeys, ...savedGates, ...savedTorchPickups, ...savedThreadSpools,
        ...savedAegisShrines, ...savedHermesShrines, ...savedChronosShrines,
        ...savedDaedalusShrines, ...savedIcarusShrines, ...savedOrpheusShrines,
        ...savedAthenaShrines, ...savedPoseidonShrines
      ];
      for (const sp of (window.secretPassages || [])) {
        anchors.push({ x: sp.fromX, y: sp.fromY }, { x: sp.toX, y: sp.toY });
      }
      const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const st = { x: savedPlayerX, y: savedPlayerY };
      // Restore artemisShrines from savedArtemisShrines before placementOk
      artemisShrines.length = 0;
      artemisShrines.push(...savedArtemisShrines);
      window.artemisShrines = artemisShrines;
      const placementOk = Array.isArray(artemisShrines) &&
        artemisShrines.length >= 12 &&
        artemisShrines.every(s => maze[s.y] && maze[s.y][s.x] === 1) &&
        artemisShrines.filter(s => md(s, st) <= 35).length >= 3 &&
        artemisShrines.every((s, i) => anchors.every(a => md(s, a) >= 5) && artemisShrines.every((o, j) => j === i || md(s, o) >= 5));

      const dir = validDir(savedPlayerX, savedPlayerY);
      let arrowOk = false;
      let btnOk = false;
      let scoreOk = false;
      if (dir) {
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        escapeX = -1;
        escapeY = -1;
        gameWon = false;
        gameLost = false;
        lastMoveDir = { dx: dir.dx, dy: dir.dy };
        playerArrows = 1;
        arrowVisionStepsRemaining = 0;
        arrowTrail = [];
        updateArrowUI();
        const ab = document.getElementById('arrowButton');
        const en = !!ab && ab.disabled === false;
        gameWon = true;
        updateArrowUI();
        const dis = !!ab && ab.disabled === true;
        gameWon = false;
        updateArrowUI();
        btnOk = en && dis;

        playerArrows = 0;
        const s0 = formatWinSummary();
        playerArrows = 2;
        const s2 = formatWinSummary();
        const m0 = s0.match(/Score:\s*(\d+)/);
        const m2 = s2.match(/Score:\s*(\d+)/);
        scoreOk = !!(m0 && m2 && (Number(m2[1]) - Number(m0[1]) === 300));

        playerX = savedPlayerX;
        playerY = savedPlayerY;
        minotaurActive = true;
        minotaurX = savedPlayerX + dir.dx;
        minotaurY = savedPlayerY + dir.dy;
        minotaurStunnedUntil = 0;
        minotaurPath = computePathBetween(minotaurX, minotaurY, playerX, playerY);
        const kx = savedPlayerX + dir.dx;
        const ky = savedPlayerY + dir.dy;
        keys.length = 0;
        keys.push({ x: kx, y: ky });
        artemisShrines.length = 0;
        playerArrows = 1;
        const keysBefore = playerKeys;
        const fired = triggerSilverArrow();
        artemisShrines.length = 0; artemisShrines.push(...savedArtemisShrines); window.artemisShrines = artemisShrines;
        keys.length = 0; keys.push(...savedKeys);
        arrowOk = fired === true &&
          playerArrows === 0 &&
          arrowVisionStepsRemaining === 10 &&
          playerX === savedPlayerX && playerY === savedPlayerY &&
          Array.isArray(arrowTrail) && arrowTrail.length >= 2 &&
          visitedTiles.has(`${savedPlayerX + dir.dx},${savedPlayerY + dir.dy}`) &&
          playerKeys === keysBefore + 1 &&
          minotaurStunnedUntil > Date.now() + 4500;
      }
      I9 = placementOk && btnOk && scoreOk && arrowOk;
    }

    // I10: Artemis input loop (keyboard X + Sight countdown via keyboard/mobile, walking pickup + cap, keyboard win reset)
    {
      let kbOk = false, mobOk = false, pickOk = false, winOk = false;
      const dir = validDir(savedPlayerX, savedPlayerY);
      const ab = document.getElementById('arrowButton');
      if (dir) {
        playerX = savedPlayerX; playerY = savedPlayerY; escapeX = -1; escapeY = -1;
        gameWon = false; gameLost = false; minotaurActive = false; minotaurX = -1; minotaurY = -1;
        activeDecoy = null; window.activeDecoy = null;
        lastMoveDir = { dx: dir.dx, dy: dir.dy };
        playerArrows = 1; arrowVisionStepsRemaining = 0; arrowTrail = [];
        artemisShrines.length = 0;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
        kbOk = playerArrows === 0 && arrowVisionStepsRemaining === 10 && playerX === savedPlayerX && playerY === savedPlayerY;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: dir.key }));
        const afterKey = arrowVisionStepsRemaining;
        handleMobileMove(dir.opp);
        mobOk = afterKey === 9 && arrowVisionStepsRemaining === 8 && playerX === savedPlayerX && playerY === savedPlayerY;
        arrowVisionStepsRemaining = 0; arrowTrail = [];
        const tx = savedPlayerX + dir.dx, ty = savedPlayerY + dir.dy;
        if (!artemisShrines.some(a => a.x === tx && a.y === ty)) artemisShrines.push({ x: tx, y: ty });
        playerArrows = 0;
        handleMobileMove(dir.mobile);
        const got = playerArrows === 1 && !artemisShrines.some(a => a.x === tx && a.y === ty) && !!ab && ab.disabled === false;
        playerArrows = MAX_ARROWS; artemisShrines.push({ x: savedPlayerX, y: savedPlayerY });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: dir.oppKey }));
        const capped = playerArrows === MAX_ARROWS && artemisShrines.some(a => a.x === savedPlayerX && a.y === savedPlayerY);
        pickOk = got && capped;
        playerX = savedPlayerX; playerY = savedPlayerY; escapeX = tx; escapeY = ty;
        playerArrows = 1; arrowVisionStepsRemaining = 3; arrowTrail = [{ x: savedPlayerX, y: savedPlayerY }];
        document.dispatchEvent(new KeyboardEvent('keydown', { key: dir.key }));
        winOk = gameWon === true && arrowVisionStepsRemaining === 0 && arrowTrail.length === 0 && !!ab && ab.disabled === true;
        gameWon = false; if (winOverlay) winOverlay.style.display = 'none';
        escapeX = -1; escapeY = -1; playerX = savedPlayerX; playerY = savedPlayerY;
      }

      // Apollo Sun Chariot placement invariants
      artemisShrines.length = 0; artemisShrines.push(...savedArtemisShrines); window.artemisShrines = artemisShrines;
      apolloShrines.length = 0; apolloShrines.push(...savedApolloShrines); window.apolloShrines = apolloShrines;
      const apAnchors = [
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
        ...savedOrpheusShrines,
        ...savedAthenaShrines,
        ...savedPoseidonShrines,
        ...savedArtemisShrines,
        ...(window.secretPassages || []).map(sp => ({ x: sp.fromX, y: sp.fromY })),
        ...(window.secretPassages || []).map(sp => ({ x: sp.toX, y: sp.toY }))
      ];
      const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const st = { x: savedPlayerX, y: savedPlayerY };
      const apolloPlacementOk = Array.isArray(apolloShrines) && apolloShrines.length >= 12 && apolloShrines.every(s => maze[s.y] && maze[s.y][s.x] === 1) && apolloShrines.filter(s => md(s, st) <= 35).length >= 3 && apolloShrines.every((s, i) => apAnchors.every(a => md(s, a) >= 5) && apolloShrines.every((o, j) => j === i || md(s, o) >= 5));

      // Apollo Sun Chariot button & score checks
      let apolloBtnScoreOk = false;
      const cb = document.getElementById('chariotButton');
      if (dir) {
        playerChariots = 1;
        chariotTrailStepsRemaining = 0;
        chariotTrail = [];
        updateChariotUI();
        if (cb && cb.disabled === false) {
          gameWon = true;
          updateChariotUI();
          const btnDisabledAfter = cb.disabled === true;
          gameWon = false;
          updateChariotUI();
          playerChariots = 0;
          const s0 = formatWinSummary();
          const m0 = s0.match(/Score:\s*(\d+)/);
          playerChariots = 2;
          const s2 = formatWinSummary();
          playerChariots = 1;
          const m2 = s2.match(/Score:\s*(\d+)/);
          const scoreOk = !!(m0 && m2 && (Number(m2[1]) - Number(m0[1]) === 300));
          apolloBtnScoreOk = btnDisabledAfter && scoreOk;
        }
      }

      // Apollo Sun Chariot charge/trail/pickup/stun/z-hotkey/win-reset
      let apolloChargeOk = false;
      if (dir) {
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        escapeX = -1;
        escapeY = -1;
        lastMoveDir = { dx: dir.dx, dy: dir.dy };
        minotaurActive = true;
        minotaurX = savedPlayerX + dir.dx;
        minotaurY = savedPlayerY + dir.dy;
        minotaurStunnedUntil = 0;
        minotaurPath = computePathBetween(minotaurX, minotaurY, playerX, playerY);
        const kx = savedPlayerX + dir.dx;
        const ky = savedPlayerY + dir.dy;
        apolloShrines.length = 0;
        gates.length = 0;
        keys.length = 0;
        keys.push({ x: kx, y: ky });
        const keysBefore = playerKeys;
        const stepsBefore = steps;
        playerChariots = 1;
        const charged = triggerSolarChariot();
        apolloChargeOk = charged === true &&
          playerChariots === 0 &&
          chariotTrailStepsRemaining === 12 &&
          steps === stepsBefore + 1 &&
          (playerX !== savedPlayerX || playerY !== savedPlayerY) &&
          Array.isArray(chariotTrail) &&
          chariotTrail.length >= 2 &&
          playerKeys === keysBefore + 1 &&
          minotaurStunnedUntil > Date.now() + 4000;
        
        // Test 'z' hotkey and win reset
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        minotaurActive = false;
        minotaurX = -1;
        minotaurY = -1;
        lastMoveDir = { dx: dir.dx, dy: dir.dy };
        playerChariots = 1;
        chariotTrailStepsRemaining = 0;
        chariotTrail = [];
        updateChariotUI();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
        const zOk = playerChariots === 0 && chariotTrailStepsRemaining === 12 && (playerX !== savedPlayerX || playerY !== savedPlayerY);
        
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        escapeX = savedPlayerX + dir.dx;
        escapeY = savedPlayerY + dir.dy;
        playerChariots = 1;
        updateChariotUI();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: dir.key }));
        const winOkZ = gameWon === true && chariotTrailStepsRemaining === 0 && chariotTrail.length === 0 && !!cb && cb.disabled === true;
        gameWon = false;
        if (winOverlay) winOverlay.style.display = 'none';
        escapeX = -1;
        escapeY = -1;
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        apolloChargeOk = apolloChargeOk && zOk && winOkZ;
        apolloShrines.length = 0; apolloShrines.push(...savedApolloShrines); window.apolloShrines = apolloShrines;
        gates.length = 0; gates.push(...savedGates);
        keys.length = 0; keys.push(...savedKeys);
      }

      I10 = kbOk && mobOk && pickOk && winOk && apolloPlacementOk && apolloBtnScoreOk && apolloChargeOk;

      // Check I11: Hephaestus Forge & Molten Anvil integration
      // Hephaestus placement invariants
      hephaestusShrines.length = 0;
      hephaestusShrines.push(...savedHephaestusShrines);
      window.hephaestusShrines = hephaestusShrines;
      let hephaestusPlacementOk = Array.isArray(hephaestusShrines) && hephaestusShrines.length >= 12;
      if (hephaestusPlacementOk) {
        const startX = savedPlayerX;
        const startY = savedPlayerY;
        // Verify every shrine is on a walkable tile
        for (const s of hephaestusShrines) {
          if (!maze[s.y] || maze[s.y][s.x] !== 1) {
            hephaestusPlacementOk = false;
            break;
          }
        }
        // Verify at least 3 shrines within Manhattan distance <= 35 of start
        let shrinesNearStart = 0;
        if (hephaestusPlacementOk) {
          for (const s of hephaestusShrines) {
            const dist = Math.abs(s.x - startX) + Math.abs(s.y - startY);
            if (dist <= 35) shrinesNearStart++;
          }
          hephaestusPlacementOk = shrinesNearStart >= 3;
        }
        // Verify every shrine has Manhattan distance >= 5 from all anchors
        const hephaestusAnchors = [
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
          ...savedOrpheusShrines,
          ...savedAthenaShrines,
          ...savedPoseidonShrines,
          ...savedArtemisShrines,
          ...savedApolloShrines,
          ...(window.secretPassages || []).map(sp => ({ x: sp.fromX, y: sp.fromY })),
          ...(window.secretPassages || []).map(sp => ({ x: sp.toX, y: sp.toY }))
        ];
        if (hephaestusPlacementOk) {
          for (const s of hephaestusShrines) {
            let distFromAnyAnchor = false;
            for (const anchor of hephaestusAnchors) {
              const dist = Math.abs(s.x - anchor.x) + Math.abs(s.y - anchor.y);
              if (dist < 5) {
                distFromAnyAnchor = true;
                break;
              }
            }
            if (distFromAnyAnchor) {
              hephaestusPlacementOk = false;
              break;
            }
          }
        }
        // Verify pairwise Manhattan distance >= 5 between distinct shrines
        if (hephaestusPlacementOk) {
          for (let i = 0; i < hephaestusShrines.length; i++) {
            const s1 = hephaestusShrines[i];
            for (let j = i + 1; j < hephaestusShrines.length; j++) {
              const s2 = hephaestusShrines[j];
              const dist = Math.abs(s1.x - s2.x) + Math.abs(s1.y - s2.y);
              if (dist < 5) {
                hephaestusPlacementOk = false;
                break;
              }
            }
            if (!hephaestusPlacementOk) break;
          }
        }
      }

      // Button disable-on-win and +150 score bonus
      let anvilBtnScoreOk = false;
      {
        const testBtn = document.getElementById('anvilButton');
        if (testBtn) {
          gameWon = false;
          gameLost = false;
          playerAnvils = 1;
          activeAnvilTrap = null;
          window.activeAnvilTrap = null;
          updateAnvilUI();
          anvilBtnScoreOk = testBtn.disabled === false;

          gameWon = true;
          updateAnvilUI();
          anvilBtnScoreOk = anvilBtnScoreOk && testBtn.disabled === true;

          gameWon = false;
          updateAnvilUI();
        }
      }

      // Compare formatWinSummary with playerAnvils = 0 vs 2 for +150 per Anvil bonus
      if (anvilBtnScoreOk) {
        playerAnvils = 0;
        const win0 = formatWinSummary();
        playerAnvils = 2;
        const win2 = formatWinSummary();
        const m0 = win0.match(/Score:\s*(\d+)/);
        const m2 = win2.match(/Score:\s*(\d+)/);
        anvilBtnScoreOk = Boolean(m0 && m2 && Number(m2[1]) - Number(m0[1]) === 300);
        playerAnvils = 0;
      }

      // anvilTrapOk: triggerMoltenAnvil deployment + checkMinotaurAnvilTrap detonation/stun/wall-blast
      let anvilTrapOk = false;
      {
        const dir = validDir(savedPlayerX, savedPlayerY);
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        gameWon = false;
        gameLost = false;
        minotaurActive = false;
        minotaurX = -1;
        minotaurY = -1;
        playerAnvils = 1;
        activeAnvilTrap = null;
        window.activeAnvilTrap = null;

        const neighborDirs = [
          { dx: 0, dy: -1 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 }
        ];
        const savedNeighborWalls = neighborDirs.map(n => ({
          x: savedPlayerX + n.dx,
          y: savedPlayerY + n.dy,
          val: maze[savedPlayerY + n.dy] ? maze[savedPlayerY + n.dy][savedPlayerX + n.dx] : undefined
        }));
        const prevBreached = breachedTiles.map(b => ({ x: b.x, y: b.y }));

        try {
          if (!savedNeighborWalls.some(w => maze[w.y] && maze[w.y][w.x] === 0)) {
            const firstInteriorNeighbor = savedNeighborWalls.find(w =>
              w.y > 0 && w.y < maze.length - 1 &&
              w.x > 0 && w.x < maze[0].length - 1
            );
            if (firstInteriorNeighbor) maze[firstInteriorNeighbor.y][firstInteriorNeighbor.x] = 0;
          }

          const deployed = triggerMoltenAnvil();
          anvilTrapOk = deployed === true && playerAnvils === 0 && isAnvilTrapActive() &&
            activeAnvilTrap.x === savedPlayerX && activeAnvilTrap.y === savedPlayerY &&
            activeAnvilTrap.steps === 22;

          if (anvilTrapOk && dir) {
            minotaurActive = true;
            minotaurX = savedPlayerX + dir.dx;
            minotaurY = savedPlayerY + dir.dy;
            minotaurStunnedUntil = 0;
            minotaurPath = computePathBetween(minotaurX, minotaurY, playerX, playerY);

            const detonated = checkMinotaurAnvilTrap();
            anvilTrapOk = detonated === true && activeAnvilTrap === null &&
              window.activeAnvilTrap === null && minotaurStunnedUntil > Date.now() + 5500 &&
              breachedTiles.length > prevBreached.length;
          }
        } finally {
          for (const w of savedNeighborWalls) {
            if (w.val !== undefined && maze[w.y]) maze[w.y][w.x] = w.val;
          }
          breachedTiles.length = 0;
          breachedTiles.push(...prevBreached);
          window.breachedTiles = breachedTiles;
        }
      }

      I11 = hephaestusPlacementOk && anvilBtnScoreOk && anvilTrapOk;
    }

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
    restoreArray(minotaurPath, savedMinotaurPath);
    playerShields = savedPlayerShields;
    playerDashes = savedPlayerDashes;
    playerRecalls = savedPlayerRecalls;
    playerBreaches = savedPlayerBreaches;
    playerFlares = savedPlayerFlares;
    solarFlareStepsRemaining = savedSolarFlareStepsRemaining;
    playerKeys = savedPlayerKeys;
    gameWon = savedGameWon;
    gameLost = savedGameLost;
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

    // Restore arrays
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
    restoreArray(orpheusShrines, savedOrpheusShrines);

    // Restore sets
    restoreSet(visitedTiles, savedVisitedTiles);

    // Restore breachedTiles in-place
    breachedTiles.length = 0;
    breachedTiles.push(...savedBreachedTiles);
    window.breachedTiles = breachedTiles;

    // Restore owlEscapePreview
    owlEscapePreview.length = 0;
    owlEscapePreview.push(...savedOwlEscapePreview);

    // Restore Hephaestus Forge state
    restoreArray(hephaestusShrines, savedHephaestusShrines);
    window.hephaestusShrines = hephaestusShrines;
    playerAnvils = savedPlayerAnvils;
    activeAnvilTrap = savedActiveAnvilTrap ? { x: savedActiveAnvilTrap.x, y: savedActiveAnvilTrap.y, steps: savedActiveAnvilTrap.steps } : null;
    window.activeAnvilTrap = activeAnvilTrap;
    anvilFlashUntil = savedAnvilFlashUntil;

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

    // Restore Poseidon Trident state
    restoreArray(poseidonShrines, savedPoseidonShrines);
    restoreArray(riptideTrail, savedRiptideTrail);
    window.poseidonShrines = poseidonShrines;
    playerTridents = savedPlayerTridents;
    riptideFlashUntil = savedRiptideFlashUntil;

    // Restore Artemis Silver Bow state
    restoreArray(artemisShrines, savedArtemisShrines);
    restoreArray(arrowTrail, savedArrowTrail);
    window.artemisShrines = artemisShrines;
    playerArrows = savedPlayerArrows;
    arrowVisionStepsRemaining = savedArrowVisionStepsRemaining;
    arrowFlashUntil = savedArrowFlashUntil;

    // Restore Apollo Sun Chariot state
    restoreArray(apolloShrines, savedApolloShrines);
    restoreArray(chariotTrail, savedChariotTrail);
    window.apolloShrines = apolloShrines;
    playerChariots = savedPlayerChariots;
    chariotTrailStepsRemaining = savedChariotTrailStepsRemaining;
    chariotFlashUntil = savedChariotFlashUntil;

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
    updateTridentUI();
    updateArrowUI();
    updateChariotUI();
    updateAnvilUI();
    drawMaze();
    console.error = origConsoleError;
  }

  return { I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, consoleErrors };
};
