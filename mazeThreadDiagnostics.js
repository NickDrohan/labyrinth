
// Debug utility to reveal all secret passage locations
window.revealSecretPassages = function() {
    if (!window.secretPassages || !Array.isArray(window.secretPassages)) {
        console.log('No secret passages to reveal.');
        return;
    }
    // Set debug mode
    debugMode = true;
    // Compute active camera viewport origin based on camera mode
    let startX, startY;
    if (cameraMode === 'center') {
        startX = playerX - Math.floor(visibleWidth / 2);
        startY = playerY - Math.floor(visibleHeight / 2);
    } else {
        // cameraMode === 'edge'
        startX = Math.floor(playerX / visibleWidth) * visibleWidth;
        startY = Math.floor(playerY / visibleHeight) * visibleHeight;
    }
    // Overlay on canvas using PIXI
    const overlayLayerId = '__secretPassageOverlay';
    let overlay = pixiApp.stage.getChildByName(overlayLayerId);
    if (overlay) {
        pixiApp.stage.removeChild(overlay);
        overlay.destroy();
    }
    overlay = new PIXI.Graphics();
    overlay.name = overlayLayerId;
    for (const passage of window.secretPassages) {
        // 'from' tile: magenta rectangle at adjusted coordinates
        overlay.lineStyle(3, 0xff00ff, 0.9);
        overlay.drawRect((passage.fromX - startX) * tileSize, (passage.fromY - startY) * tileSize, tileSize, tileSize);
        // 'to' tile: cyan rectangle at adjusted coordinates
        overlay.lineStyle(3, 0x00ffff, 0.9);
        overlay.drawRect((passage.toX - startX) * tileSize, (passage.toY - startY) * tileSize, tileSize, tileSize);
    }
    // Draw maze before overlay
    drawMaze();
    pixiApp.stage.addChild(overlay);
    pixiApp.render();
    // Also log coordinates for automated validation
    console.log('Secret passages:', window.secretPassages.map(p => ({from:[p.fromX,p.fromY], to:[p.toX,p.toY]})));
    // Return secret passages
    return window.secretPassages;
};

window.getThreadState = () => ({
  playerSpools,
  compassStepsRemaining,
  threadSpools: threadSpools.map(s => ({ x: s.x, y: s.y })),
  playerX,
  playerY,
  escapeX,
  escapeY,
  gameWon,
  gameLost,
  visited: visitedTiles.size,
  playerShields,
  aegisShrines: aegisShrines.map(a => ({ x: a.x, y: a.y })),
  minotaurX,
  minotaurY,
  minotaurActive,
  minotaurStunned: Date.now() < minotaurStunnedUntil,
  minotaurStatus: getMinotaurStatusLabel(),
  playerDashes,
  lastMoveDir: { dx: lastMoveDir.dx, dy: lastMoveDir.dy },
  hermesShrines: hermesShrines.map(h => ({ x: h.x, y: h.y })),
  steps,
  playerRecalls,
  chronosAnchor: chronosAnchor ? { x: chronosAnchor.x, y: chronosAnchor.y } : null,
  chronosShrines: chronosShrines.map(c => ({ x: c.x, y: c.y })),
  playerBreaches,
  daedalusShrines: daedalusShrines.map(d => ({ x: d.x, y: d.y })),
  breachedTiles: breachedTiles.map(b => ({ x: b.x, y: b.y })),
  playerFlares,
  solarFlareStepsRemaining,
  icarusShrines: icarusShrines.map(s => ({ x: s.x, y: s.y })),
  playerDecoys,
  orpheusShrines: orpheusShrines.map(o => ({ x: o.x, y: o.y })),
  activeDecoy: activeDecoy ? { x: activeDecoy.x, y: activeDecoy.y, steps: activeDecoy.steps } : null,
  playerOwls,
  owlStepsRemaining,
  athenaShrines: athenaShrines.map(a => ({ x: a.x, y: a.y })),
  owlEscapePreviewLen: owlEscapePreview.length,
  playerTridents,
  poseidonShrines: poseidonShrines.map(p => ({ x: p.x, y: p.y })),
  playerArrows,
  arrowVisionStepsRemaining,
  artemisShrines: artemisShrines.map(a => ({ x: a.x, y: a.y })),
  playerChariots,
  chariotTrailStepsRemaining,
  apolloShrines: apolloShrines.map(ap => ({ x: ap.x, y: ap.y })),
  playerAnvils,
  activeAnvilTrap: activeAnvilTrap ? { x: activeAnvilTrap.x, y: activeAnvilTrap.y, steps: activeAnvilTrap.steps } : null,
  hephaestusShrines: hephaestusShrines.map(h => ({ x: h.x, y: h.y }))
});
window.runThreadSmokeSpec = function() {
    // Console error capture (T1)
    const consoleErrors = [];
    const origConsoleError = console.error;
    console.error = function(...args) {
        consoleErrors.push(args.map(a => String(a)).join(' '));
        return origConsoleError.apply(console, args);
    };

    // Snapshot all mutable state before running checks
    const savedPlayerX = playerX;
    const savedPlayerY = playerY;
    const savedEscapeX = escapeX;
    const savedEscapeY = escapeY;
    const savedPlayerSpools = playerSpools;
    const savedCompassStepsRemaining = compassStepsRemaining;
    const savedThreadSpools = threadSpools.map(s => ({ x: s.x, y: s.y }));
    const savedVisited = Array.from(visitedTiles);
    const savedMinotaurPath = minotaurPath.map(n => ({ x: n.x, y: n.y }));
    const savedMinotaurX = minotaurX;
    const savedMinotaurY = minotaurY;
    const savedMinotaurActive = minotaurActive;
    const savedMinotaurStunnedUntil = minotaurStunnedUntil;
    const savedKeys = keys.map(k => ({ x: k.x, y: k.y }));
    const savedGates = gates.map(g => ({ x: g.x, y: g.y }));
    const savedPlayerKeys = playerKeys;
    const savedTorchPickups = torchPickups.map(t => ({ x: t.x, y: t.y }));
    const savedTorchActive = torchActive;
    const savedTorchStepsRemaining = torchStepsRemaining;
    const savedAegisShrines = aegisShrines.map(a => ({ x: a.x, y: a.y }));
    const savedPlayerShields = playerShields;
    const savedGameWon = gameWon;
    const savedGameLost = gameLost;
    const savedSteps = steps;
    const savedLastMoveDir = lastMoveDir;
    const savedPlayerDashes = playerDashes;
    const savedHermesShrines = hermesShrines.map(h => ({ x: h.x, y: h.y }));
    const savedPlayerRecalls = playerRecalls;
    const savedChronosAnchor = chronosAnchor ? { ...chronosAnchor } : null;
    const savedChronosShrines = chronosShrines.map(c => ({ x: c.x, y: c.y }));
    const savedPlayerBreaches = playerBreaches;
    const savedDaedalusShrines = daedalusShrines.map(d => ({ x: d.x, y: d.y }));
    const savedPlayerFlares = playerFlares;
    const savedSolarFlareStepsRemaining = solarFlareStepsRemaining;
    const savedIcarusShrines = icarusShrines.map(i => ({ x: i.x, y: i.y }));
    const savedPlayerDecoys = playerDecoys;
    const savedOrpheusShrines = orpheusShrines.map(o => ({ x: o.x, y: o.y }));
    const savedActiveDecoy = activeDecoy ? { x: activeDecoy.x, y: activeDecoy.y, steps: activeDecoy.steps } : null;
    const savedDecoyFlashUntil = decoyFlashUntil;
    const savedPlayerOwls = playerOwls;
    const savedOwlStepsRemaining = owlStepsRemaining;
    const savedOwlFlashUntil = owlFlashUntil;
    const savedAthenaShrines = athenaShrines.map(a => ({ x: a.x, y: a.y }));
    const savedPlayerTridents = playerTridents;
    const savedPoseidonShrines = poseidonShrines.map(p => ({ x: p.x, y: p.y }));
    const savedOwlEscapePreview = owlEscapePreview.map(p => ({ x: p.x, y: p.y }));
    // Artemis Silver Bow state
    const savedPlayerArrows = playerArrows;
    const savedArrowVisionStepsRemaining = arrowVisionStepsRemaining;
    const savedArrowFlashUntil = arrowFlashUntil;
    const savedArtemisShrines = artemisShrines.map(a => ({ x: a.x, y: a.y }));
    const savedArrowTrail = arrowTrail.map(t => ({ x: t.x, y: t.y }));
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
    // Overlay display/textContent
    const winOverlay = document.getElementById('winOverlay');
    const loseOverlay = document.getElementById('loseOverlay');
    const savedWinOverlayDisplay = winOverlay ? winOverlay.style.display : '';
    const savedLoseOverlayDisplay = loseOverlay ? loseOverlay.style.display : '';
    const savedWinOverlayTextContent = winOverlay ? winOverlay.textContent : '';
    // HUD counters
    const stepCounter = document.getElementById('stepCounter');
    const uniqueTilesCounter = document.getElementById('uniqueTilesCounter');
    const keyCounter = document.getElementById('keyCounter');
    const savedStepCounter = stepCounter ? stepCounter.textContent : '';
    const savedUniqueTilesCounter = uniqueTilesCounter ? uniqueTilesCounter.textContent : '';
    const savedKeyCounter = keyCounter ? keyCounter.textContent : '';
    // Save references for restoration
    const savedThreadSpoolsRef = threadSpools;
    const savedTorchPickupsRef = torchPickups;
    const savedAegisShrinesRef = aegisShrines;
    const savedHermesShrinesRef = hermesShrines;
    const savedChronosShrinesRef = chronosShrines;
    const savedDaedalusShrinesRef = daedalusShrines;
    const savedIcarusShrinesRef = icarusShrines;

    let p1 = false, p2 = false, p4 = false, p5 = false, p6 = false, p9Idle = false, p9Active = false, p10 = false, p11 = false, p12 = false;
    try {
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
        const st0 = window.getThreadState();
        p1 = Array.isArray(st0.threadSpools) && st0.threadSpools.length >= 12 &&
            st0.threadSpools.every(s => s.y >= 0 && s.y < maze.length && s.x >= 0 && s.x < maze[0].length && maze[s.y][s.x] === 1);
        const nearStart = st0.threadSpools.filter(s => Math.abs(s.x - st0.playerX) + Math.abs(s.y - st0.playerY) <= 40).length >= 3;
        p2 = nearStart && st0.threadSpools.every((s, i) => {
            const dist = (x, y) => Math.abs(x - s.x) + Math.abs(y - s.y);
            return dist(st0.playerX, st0.playerY) >= 5 &&
                dist(st0.escapeX, st0.escapeY) >= 5 &&
                keys.every(k => dist(k.x, k.y) >= 5) &&
                gates.every(g => dist(g.x, g.y) >= 5) &&
                torchPickups.every(t => dist(t.x, t.y) >= 5) &&
                secretPassages.every(p => dist(p.fromX, p.fromY) >= 5 && dist(p.toX, p.toY) >= 5) &&
                st0.threadSpools.every((o, j) => j === i || dist(o.x, o.y) >= 5);
        });
        const checkNoOpTKeys = () => {
            const pre = window.getThreadState();
            const prePathLen = minotaurPath.length;
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'T' }));
            const post = window.getThreadState();
            return window.activateThreadCompass() === false &&
                post.playerX === pre.playerX &&
                post.playerY === pre.playerY &&
                minotaurPath.length === prePathLen &&
                post.playerSpools === pre.playerSpools &&
                post.compassStepsRemaining === pre.compassStepsRemaining;
        };
        p9Idle = st0.playerSpools === 0 && checkNoOpTKeys();
        const dirs = [
            { dx: 0, dy: -1, key: 'ArrowUp', mobile: 'up', opp: 'down' },
            { dx: 0, dy: 1, key: 'ArrowDown', mobile: 'down', opp: 'up' },
            { dx: -1, dy: 0, key: 'ArrowLeft', mobile: 'left', opp: 'right' },
            { dx: 1, dy: 0, key: 'ArrowRight', mobile: 'right', opp: 'left' }
        ];
        const validDir = dirs.find(d => {
            const nx = st0.playerX + d.dx, ny = st0.playerY + d.dy;
            return ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length && maze[ny][nx] === 1 &&
                !gates.some(g => g.x === nx && g.y === ny) &&
                !secretPassages.some(p => p.fromX === nx && p.fromY === ny);
        });
        if (validDir) {
            // Temporarily disable win condition and minotaur collision interference
            escapeX = -1;
            escapeY = -1;
            minotaurActive = false;
            minotaurX = -1;
            minotaurY = -1;
            const tx = st0.playerX + validDir.dx, ty = st0.playerY + validDir.dy;
            if (!threadSpools.some(s => s.x === tx && s.y === ty)) {
                threadSpools.push({ x: tx, y: ty });
            }
            const beforePickup = window.getThreadState();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.key }));
            const afterPickup = window.getThreadState();
            const counterEl = document.getElementById('spoolCounter');
            p4 = afterPickup.playerSpools === beforePickup.playerSpools + 1 && (!!counterEl && counterEl.textContent === 'Spools: ' + afterPickup.playerSpools);
            const activated = window.activateThreadCompass();
            const afterAct = window.getThreadState();
            const indEl = document.getElementById('compassIndicator');
            p5 = activated === true && afterAct.playerSpools === afterPickup.playerSpools - 1 && afterAct.compassStepsRemaining === 25 &&
                !!indEl && /^Compass: 25 \((Cold|Warm|Hot)\)$/.test(indEl.textContent) && indEl.classList.contains('active');
            p9Active = afterAct.compassStepsRemaining === 25 && checkNoOpTKeys();
            handleMobileMove(validDir.opp);
            const afterMobile = window.getThreadState();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.key }));
            const afterKey = window.getThreadState();
            // Step 23 more times to complete the countdown
            for (let i = 0; i < 23; i++) {
                handleMobileMove(i % 2 === 0 ? validDir.opp : validDir.mobile);
            }
            const afterCountdown = window.getThreadState();
            const useSpoolBtn = document.getElementById('useSpoolButton');
            p6 = afterMobile.playerSpools === afterAct.playerSpools && afterKey.playerSpools === afterMobile.playerSpools && afterMobile.compassStepsRemaining === 24 && afterKey.compassStepsRemaining === 23 &&
                afterCountdown.compassStepsRemaining === 0 &&
                !!indEl && indEl.textContent === 'Compass: Off' && !indEl.classList.contains('active') &&
                !!useSpoolBtn && useSpoolBtn.disabled === true;
        }
        // P10: Mobile torch parity
        if (validDir) {
            // Save current torch state
            const origTorchActive = torchActive;
            const origTorchSteps = torchStepsRemaining;
            // Set up torch for test
            torchActive = true;
            torchStepsRemaining = typeof TORCH_EFFECT_STEPS !== 'undefined' ? TORCH_EFFECT_STEPS : 30;
            updateTorchIndicator();
            minotaurActive = false;
            escapeX = -1;
            escapeY = -1;
            // Start at st0.playerX, st0.playerY to ensure we alternate correctly
            playerX = st0.playerX;
            playerY = st0.playerY;
            let torchState29 = null, torchState30 = null;
            for (let i = 0; i < 30; i++) {
                handleMobileMove(i % 2 === 0 ? validDir.mobile : validDir.opp);
                if (i === 28) {
                    torchState29 = {
                        torchActive: torchActive,
                        torchStepsRemaining: torchStepsRemaining,
                        indicator: (document.getElementById('torchIndicator')||{}).textContent
                    };
                }
                if (i === 29) {
                    torchState30 = {
                        torchActive: torchActive,
                        torchStepsRemaining: torchStepsRemaining,
                        indicator: (document.getElementById('torchIndicator')||{}).textContent
                    };
                }
            }
            p10 = torchState29 && torchState29.torchActive === true && torchState29.torchStepsRemaining === 1 &&
                  torchState30 && torchState30.torchActive === false && torchState30.torchStepsRemaining === 0 && torchState30.indicator === '';
            // Restore torch state
            torchActive = origTorchActive;
            torchStepsRemaining = origTorchSteps;
            updateTorchIndicator();
        }
        // P11: Independent loss and win checks
        let p11Loss = false, p11Win = false;
        if (loseOverlay) {
            playerX = st0.playerX;
            playerY = st0.playerY;
            playerSpools = 1;
            playerShields = 0;
            compassStepsRemaining = 0;
            gameLost = false;
            gameWon = false;
            escapeX = -1;
            escapeY = -1;
            
            // Trigger loss by placing Minotaur at validDir direction
            if (validDir) {
                minotaurActive = true;
                minotaurX = st0.playerX + validDir.dx;
                minotaurY = st0.playerY + validDir.dy;
                handleMobileMove(validDir.mobile);
            } else {
                gameLost = true;
                loseOverlay.style.display = 'flex';
                updateSpoolUI();
            }
            
            const useSpoolBtn = document.getElementById('useSpoolButton');
            const indEl = document.getElementById('compassIndicator');
            p11Loss = gameLost === true && loseOverlay.style.display === 'flex' &&
                      !!useSpoolBtn && useSpoolBtn.disabled === true &&
                      window.activateThreadCompass() === false &&
                      !!indEl && indEl.textContent === 'Compass: Off' && !indEl.classList.contains('active');
            
            // Reset state
            gameLost = false;
            loseOverlay.style.display = 'none';
            minotaurActive = false;
            minotaurX = -1;
            minotaurY = -1;
        }
        if (winOverlay) {
            playerX = st0.playerX;
            playerY = st0.playerY;
            playerSpools = 1;
            compassStepsRemaining = 25;
            gameLost = false;
            gameWon = false;
            
            // Trigger win by setting escape
            if (validDir) {
                escapeX = st0.playerX + validDir.dx;
                escapeY = st0.playerY + validDir.dy;
                handleMobileMove(validDir.mobile);
            } else {
                gameWon = true;
                compassStepsRemaining = 0;
                winOverlay.style.display = 'flex';
                updateSpoolUI();
            }
            
            const useSpoolBtn = document.getElementById('useSpoolButton');
            const indEl = document.getElementById('compassIndicator');
            p11Win = gameWon === true && winOverlay.style.display === 'flex' &&
                     !!useSpoolBtn && useSpoolBtn.disabled === true &&
                     window.activateThreadCompass() === false &&
                     !!indEl && indEl.textContent === 'Compass: Off' && !indEl.classList.contains('active');
            
            // Reset state
            gameWon = false;
            winOverlay.style.display = 'none';
        }
        p11 = p11Loss && p11Win;
        // P12: minotaurPath walkability
        p12 = Array.isArray(minotaurPath) && minotaurPath.every(n => maze[n.y] && maze[n.y][n.x] === 1);
        return { P1: p1, P2: p2, P4: p4, P5: p5, P6: p6, P9: p9Idle && p9Active, P10: p10, P11: p11, P12: p12, consoleErrors };
    } finally {
        // Restore visitedTiles in-place
        visitedTiles.clear();
        for (const k of savedVisited) visitedTiles.add(k);
        // Restore keys and gates in-place
        keys.length = 0;
        keys.push(...savedKeys);
        gates.length = 0;
        gates.push(...savedGates);
        // Restore array references in-place
        threadSpools.length = 0;
        threadSpools.push(...savedThreadSpools);
        window.threadSpools = threadSpools;
        torchPickups.length = 0;
        torchPickups.push(...savedTorchPickups);
        aegisShrines.length = 0;
        aegisShrines.push(...savedAegisShrines);
        window.aegisShrines = aegisShrines;
        hermesShrines.length = 0;
        hermesShrines.push(...savedHermesShrines);
        window.hermesShrines = hermesShrines;
        chronosShrines.length = 0;
        chronosShrines.push(...savedChronosShrines);
        window.chronosShrines = chronosShrines;
        daedalusShrines.length = 0;
        daedalusShrines.push(...savedDaedalusShrines);
        window.daedalusShrines = daedalusShrines;
        icarusShrines.length = 0;
        icarusShrines.push(...savedIcarusShrines);
        window.icarusShrines = icarusShrines;
        // Restore orpheusShrines in place
        orpheusShrines.length = 0;
        orpheusShrines.push(...savedOrpheusShrines);
        window.orpheusShrines = orpheusShrines;
        athenaShrines.length = 0;
        athenaShrines.push(...savedAthenaShrines);
        window.athenaShrines = athenaShrines;
        owlEscapePreview.length = 0;
        owlEscapePreview.push(...savedOwlEscapePreview);
        poseidonShrines.length = 0;
        poseidonShrines.push(...savedPoseidonShrines);
        window.poseidonShrines = poseidonShrines;
        // Restore scalar globals
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        escapeX = savedEscapeX;
        escapeY = savedEscapeY;
        playerSpools = savedPlayerSpools;
        compassStepsRemaining = savedCompassStepsRemaining;
        minotaurX = savedMinotaurX;
        minotaurY = savedMinotaurY;
        minotaurActive = savedMinotaurActive;
        minotaurStunnedUntil = savedMinotaurStunnedUntil;
        playerKeys = savedPlayerKeys;
        torchActive = savedTorchActive;
        torchStepsRemaining = savedTorchStepsRemaining;
        playerShields = savedPlayerShields;
        gameWon = savedGameWon;
        gameLost = savedGameLost;
        steps = savedSteps;
        lastMoveDir = savedLastMoveDir;
        playerDashes = savedPlayerDashes;
        playerRecalls = savedPlayerRecalls;
        playerBreaches = savedPlayerBreaches;
        playerFlares = savedPlayerFlares;
        solarFlareStepsRemaining = savedSolarFlareStepsRemaining;
        playerDecoys = savedPlayerDecoys;
        activeDecoy = savedActiveDecoy ? { x: savedActiveDecoy.x, y: savedActiveDecoy.y, steps: savedActiveDecoy.steps } : null;
        window.activeDecoy = activeDecoy;
        decoyFlashUntil = savedDecoyFlashUntil;
        playerOwls = savedPlayerOwls;
        owlStepsRemaining = savedOwlStepsRemaining;
        owlFlashUntil = savedOwlFlashUntil;
        playerTridents = savedPlayerTridents;
        artemisShrines.length = 0;
        artemisShrines.push(...savedArtemisShrines);
        window.artemisShrines = artemisShrines;
        playerArrows = savedPlayerArrows;
        arrowVisionStepsRemaining = savedArrowVisionStepsRemaining;
        arrowFlashUntil = savedArrowFlashUntil;
        arrowTrail = savedArrowTrail.map(t => ({ x: t.x, y: t.y }));
        apolloShrines.length = 0;
        apolloShrines.push(...savedApolloShrines);
        window.apolloShrines = apolloShrines;
        playerChariots = savedPlayerChariots;
        chariotTrailStepsRemaining = savedChariotTrailStepsRemaining;
        chariotFlashUntil = savedChariotFlashUntil;
        chariotTrail.length = 0;
        chariotTrail.push(...savedChariotTrail);
        // Restore minotaurPath
        minotaurPath.length = 0;
        for (const n of savedMinotaurPath) minotaurPath.push({ x: n.x, y: n.y });
        // Restore chronosAnchor
        chronosAnchor = savedChronosAnchor ? { ...savedChronosAnchor } : null;
        // Restore overlay styles
        if (winOverlay) {
            winOverlay.style.display = savedWinOverlayDisplay;
            winOverlay.textContent = savedWinOverlayTextContent;
        }
        if (loseOverlay) loseOverlay.style.display = savedLoseOverlayDisplay;
        // Restore HUD counters
        if (stepCounter) stepCounter.textContent = savedStepCounter;
        if (uniqueTilesCounter) uniqueTilesCounter.textContent = savedUniqueTilesCounter;
        if (keyCounter) keyCounter.textContent = savedKeyCounter;
        // Restore references
        window.threadSpools = threadSpools;
        window.aegisShrines = aegisShrines;
        window.hermesShrines = hermesShrines;
        window.chronosShrines = chronosShrines;
        window.daedalusShrines = daedalusShrines;
        window.icarusShrines = icarusShrines;
        // Restore Hephaestus Forge state
        hephaestusShrines.length = 0;
        hephaestusShrines.push(...savedHephaestusShrines);
        window.hephaestusShrines = hephaestusShrines;
        playerAnvils = savedPlayerAnvils;
        activeAnvilTrap = savedActiveAnvilTrap ? { x: savedActiveAnvilTrap.x, y: savedActiveAnvilTrap.y, steps: savedActiveAnvilTrap.steps } : null;
        window.activeAnvilTrap = activeAnvilTrap;
        anvilFlashUntil = savedAnvilFlashUntil;
        // Restore UI
        updateTorchIndicator();
        updateSpoolUI();
        updateShieldUI();
        updateDashUI();
        updateRecallUI();
        updateBreachUI();
        updateFlareUI();
        updateDecoyUI();
        updateOwlUI();
        if (typeof updateTridentUI === 'function') updateTridentUI();
        if (typeof updateArrowUI === 'function') updateArrowUI();
        if (typeof updateChariotUI === 'function') updateChariotUI();
        if (typeof updateAnvilUI === 'function') updateAnvilUI();
        drawMaze();
        // Restore console.error
        console.error = origConsoleError;
    }
};
