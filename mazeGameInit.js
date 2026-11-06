

function minotaurTick() {
    if (gameWon || gameLost) return;

    if (Date.now() < minotaurStunnedUntil) {
        updateShieldUI();
        drawMaze();
        return;
    }

    const lure = advanceMinotaurLure();
    if (lure.moved) {
        steps++;
        const stepCounter = document.getElementById('stepCounter');
        if (stepCounter) stepCounter.textContent = 'Steps: ' + steps;
    }

    if (minotaurPath.length === 0 && minotaurActive && !(minotaurX === playerX && minotaurY === playerY)) {
        rebuildMinotaurPursuit();
    }

    sanitizeMinotaurPath();

    if (minotaurPath.length > 0) {
        const next = minotaurPath.shift();
        minotaurX = next.x;
        minotaurY = next.y;
        steps++;
        const stepCounter = document.getElementById('stepCounter');
        if (stepCounter) stepCounter.textContent = 'Steps: ' + steps;

        if (playerX === minotaurX && playerY === minotaurY) {
            if (playerShields > 0) {
                triggerAegisRepel(true);
            } else {
                gameLost = true;
                // Clear active arrow/chariot/anvil state
                arrowVisionStepsRemaining = 0;
                arrowTrail = [];
                chariotTrailStepsRemaining = 0;
                chariotTrail = [];
                activeAnvilTrap = null;
                window.activeAnvilTrap = null;

                // Update all HUD counters
                updateSpoolUI();
                updateShieldUI();
                updateDashUI();
                updateRecallUI();
                updateBreachUI();
                updateDecoyUI();
                updateAnvilUI();
                updateFlareUI();
                updateOwlUI();
                updateTridentUI();
                updateArrowUI();
                updateChariotUI();

                // Display lose overlay
                const loseOverlay = document.getElementById('loseOverlay');
                if (loseOverlay) loseOverlay.style.display = 'flex';

                drawMaze();
                return;
            }
        }
    }

    // Scorch check for chariot trail
    if (chariotTrailStepsRemaining > 0 && Array.isArray(chariotTrail) && chariotTrail.some(t => t.x === minotaurX && t.y === minotaurY)) {
        minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + CHARIOT_STUN_MS);
        chariotTrailStepsRemaining = 0;
        chariotTrail = [];
        showBannerMessage('Minotaur scorched by Solar Chariot trail! Stunned for 5s!', 'rgba(220,100,10,0.92)');
        updateChariotUI();
        updateShieldUI();
        drawMaze();
        return;
    }

    checkMinotaurAnvilTrap();
    updateShieldUI();
    drawMaze();
}

function startMinotaurLoop() {
    clearInterval(minotaurInterval);
    minotaurInterval = setInterval(minotaurTick, 250);
    return minotaurInterval;
}

function initGame() {
    // Hide secret passage message and clear timeout on reset
    const secretPassageMessageEl = document.getElementById('secretPassageMessage');
    if (secretPassageMessageEl) {
        secretPassageMessageEl.style.display = 'none';
        if (secretPassageMsgTimeout) {
            clearTimeout(secretPassageMsgTimeout);
            secretPassageMsgTimeout = null;
        }
    }

    gameWon = false;
    gameLost = false;
    document.getElementById('winOverlay').style.display = 'none';    document.getElementById('loseOverlay').style.display = 'none';

    visitedTiles.clear();
    visitedTiles.add(`${playerX},${playerY}`);
    document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: 1';
    playerKeys = 0;
    document.getElementById('keyCounter').textContent = 'Keys: 0';
    keys.length = 0;
    gates.length = 0;

    // Reset torch state and pickups
    torchPickups.length = 0;
    torchActive = false;
    torchStepsRemaining = 0;
    updateTorchIndicator();

    // Reset thread spools and compass state
    threadSpools.length = 0;
    window.threadSpools = threadSpools;
    playerSpools = 0;
    compassStepsRemaining = 0;
    // Reset Aegis Shield state
    aegisShrines.length = 0;
    window.aegisShrines = aegisShrines;
    playerShields = 0;
    minotaurStunnedUntil = 0;
    repelFlashUntil = 0;

    // Reset Hermes Winged Sandals & Phase Dash state
    hermesShrines.length = 0;
    window.hermesShrines = hermesShrines;
    playerDashes = 0;
    lastMoveDir = { dx: 1, dy: 0 };
    dashTrail = [];
    dashTrailUntil = 0;
    steps = 0;

    // Reset Chronos state globals
    chronosShrines.length = 0;
    window.chronosShrines = chronosShrines;
    playerRecalls = 0;
    chronosAnchor = null;
    recallFlashUntil = 0;
    daedalusShrines.length = 0;
    window.daedalusShrines = daedalusShrines;
    for (const b of breachedTiles) {
        if (b.y > 0 && b.y < maze.length - 1 && b.x > 0 && b.x < maze[0].length - 1) {
            maze[b.y][b.x] = 0;
        }
    }
    breachedTiles.length = 0;
    window.breachedTiles = breachedTiles;
    playerBreaches = 0;
    breachFlashUntil = 0;
    icarusShrines.length = 0;
    window.icarusShrines = icarusShrines;
    playerFlares = 0;
    solarFlareStepsRemaining = 0;
    solarFlareFlashUntil = 0;

    // Reset Orpheus Lyre & Siren Decoy state
    orpheusShrines.length = 0;
    window.orpheusShrines = orpheusShrines;
    playerDecoys = 0;
    activeDecoy = null;
    window.activeDecoy = null;
    decoyFlashUntil = 0;

    // Reset Athena Owl & Tactical Clairvoyance state
    athenaShrines.length = 0;
    window.athenaShrines = athenaShrines;
    playerOwls = 0;
    owlStepsRemaining = 0;
    owlFlashUntil = 0;
    owlEscapePreview = [];

    // Reset Poseidon Trident & Riptide Surge state
    poseidonShrines.length = 0;
    window.poseidonShrines = poseidonShrines;
    playerTridents = 0;
    riptideTrail = [];
    riptideFlashUntil = 0;

    // Reset Artemis Silver Bow & Piercing Silver Arrow state
    artemisShrines.length = 0;
    window.artemisShrines = artemisShrines;
    playerArrows = 0;
    arrowVisionStepsRemaining = 0;
    arrowTrail = [];
    arrowFlashUntil = 0;

    // Reset Apollo Sun Chariot & Blazing Solar Chariot Charge state
    apolloShrines.length = 0;
    window.apolloShrines = apolloShrines;
    playerChariots = 0;
    chariotTrail = [];
    chariotTrailStepsRemaining = 0;
    chariotFlashUntil = 0;

    // Reset Hephaestus Forge & Molten Anvil state
    hephaestusShrines.length = 0;
    window.hephaestusShrines = hephaestusShrines;
    playerAnvils = 0;
    activeAnvilTrap = null;
    window.activeAnvilTrap = null;
    anvilFlashUntil = 0;

    // Ensure start tile (25, 25) is walkable and connected to the even-coordinate spanning tree
    playerX = 25;
    playerY = 25;
    maze[playerY][playerX] = 1;
    maze[playerY][playerX + 1] = 1;
    maze[playerY - 1][playerX] = 1;
    visitedTiles.clear();
    visitedTiles.add(`${playerX},${playerY}`);
    document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: 1';

    // Select escape tile first to ensure escapeX/escapeY are set
    selectEscapeTile();
    // Helper: BFS to find shortest path from (sx,sy) to (ex,ey) on maze (1=path,0=wall)
    function findShortestPath(sx, sy, ex, ey) {
        const parent = {};
        const queue = [{x: sx, y: sy}];
        const visited = Array.from({length: maze.length}, () => Array(maze[0].length).fill(false));
        visited[sy][sx] = true;
        const dirs = [
            {dx: 0, dy: -1},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 1, dy: 0}
        ];
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            if (x === ex && y === ey) {
                // Reconstruct path using parent pointers
                const path = [];
                let cx = x, cy = y;
                while (!(cx === sx && cy === sy)) {
                    path.push({x: cx, y: cy});
                    const p = parent[`${cx},${cy}`];
                    cx = p.x;
                    cy = p.y;
                }
                path.reverse();
                return path;
            }
            for (const {dx, dy} of dirs) {
                const nx = x + dx;
                const ny = y + dy;
                if (
                    ny >= 0 && ny < maze.length &&
                    nx >= 0 && nx < maze[0].length &&
                    maze[ny][nx] === 1 &&
                    !visited[ny][nx]
                ) {
                    visited[ny][nx] = true;
                    parent[`${nx},${ny}`] = {x, y};
                    queue.push({x: nx, y: ny});
                }
            }
        }
        return null; // No path
    }

    // Place keys: 3-5 on valid path tiles, not on player, escape, or each other
    const validPathTiles = [];
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                validPathTiles.push({x, y});
            }
        }
    }
    // Remove player and escape from validPathTiles
    const escapeTile = {x: escapeX, y: escapeY};
    const playerTile = {x: playerX, y: playerY};
    function tileKey(t) { return `${t.x},${t.y}`; }
    let availableTiles = validPathTiles.filter(t => tileKey(t) !== tileKey(escapeTile) && tileKey(t) !== tileKey(playerTile));
    // Shuffle availableTiles
    availableTiles = availableTiles.sort(() => 0.5 - Math.random());
    const numKeys = 3 + Math.floor(Math.random() * 3); // 3-5 keys
    for (let i = 0; i < numKeys && i < availableTiles.length; i++) {
        keys.push({x: availableTiles[i].x, y: availableTiles[i].y});
    }

    // Place gates: 1-2 on shortest path from player to escape, not on player, escape, or keys

    // Find shortest path
    const pathToEscape = findShortestPath(playerX, playerY, escapeX, escapeY);
    let gateCandidates = [];
    if (pathToEscape && pathToEscape.length > 2) {
        // Exclude player and escape tile from gate candidates
        gateCandidates = pathToEscape.slice(1, pathToEscape.length - 1)
            .filter(pt => !keys.some(k => k.x === pt.x && k.y === pt.y));
    }
    // If not enough path tiles, fallback to any available path tile not occupied
    if (gateCandidates.length === 0) {
        gateCandidates = validPathTiles.filter(t =>
            tileKey(t) !== tileKey(escapeTile) &&
            tileKey(t) !== tileKey(playerTile) &&
            !keys.some(k => k.x === t.x && k.y === t.y)
        );
    }
    // Shuffle gate candidates
    gateCandidates = gateCandidates.sort(() => 0.5 - Math.random());
    const numGates = Math.min(1 + Math.floor(Math.random() * 2), gateCandidates.length); // 1-2 gates
    for (let i = 0; i < numGates; i++) {
        gates.push({x: gateCandidates[i].x, y: gateCandidates[i].y});
    }

    // Place 10-20 torch pickups on valid path tiles, not overlapping player, escape, keys, or gates
    const torchValidTiles = validPathTiles.filter(t =>
        tileKey(t) !== tileKey(escapeTile) &&
        tileKey(t) !== tileKey(playerTile) &&
        !keys.some(k => k.x === t.x && k.y === t.y) &&
        !gates.some(g => g.x === t.x && g.y === t.y)
    );
    // Shuffle and select 10-20 torch positions
    torchValidTiles.sort(() => 0.5 - Math.random());
    const numTorches = 10 + Math.floor(Math.random() * 11); // 10-20
    const torchPositions = torchValidTiles.slice(0, numTorches);
    for (const pos of torchPositions) {
        torchPickups.push({x: pos.x, y: pos.y});
    }

    // Clear any previous secret passages and place new ones
    secretPassages.length = 0;
    placeSecretPassages();

    // Place thread spools on valid path tiles at least 5 Manhattan distance from start, escape, keys, gates, torches, and secret passages
    placeThreadSpools();

    // Update spool UI to reflect initial state
    updateSpoolUI();

    // Clear any previous minotaur setInterval timer
    clearInterval(minotaurInterval);
    minotaurInterval = null;

    minotaurPath = spawnMinotaur();
    placeAegisShrines();
    updateShieldUI();
    placeHermesShrines();
    updateDashUI();
    placeChronosShrines();
    updateRecallUI();
    placeDaedalusShrines();
    updateBreachUI();
    placeIcarusShrines();
    updateFlareUI();
    placeOrpheusShrines();
    updateDecoyUI();
    placeAthenaShrines();
    updateOwlUI();
    placePoseidonShrines();
    updateTridentUI();
    placeArtemisShrines();
    updateArrowUI();
    placeApolloShrines();
    updateChariotUI();
    placeHephaestusShrines();
    updateAnvilUI();
    let stepCount = 0; // Initialize step count
    const stepCounterEl = document.getElementById('stepCounter');
    if (stepCounterEl) stepCounterEl.textContent = 'Steps: 0';
    viewMode = 'fp';
    window.viewMode = 'fp';
    const toggleViewBtn = document.getElementById('toggleViewButton');
    if (toggleViewBtn) toggleViewBtn.textContent = 'View: 3D + Minimap (M)';
    drawMaze();

    setupMobileControls(); // Initialize mobile controls

    // Start minotaur behavior
    startMinotaurLoop();

    const keydownGen = (window._keydownGen = (window._keydownGen || 0) + 1);
    document.addEventListener('keydown', (event) => {
        if (keydownGen !== window._keydownGen) return;
        if (gameWon || gameLost) {
            return; // Ignore player input if game is won or lost
        }

        // Handle compass activation without movement
        if (event.key === 't' || event.key === 'T') {
            activateThreadCompass();
            return;
        }

        // Handle Aegis repel
        if (event.key === 'r' || event.key === 'R') {
            triggerAegisRepel(false);
            return;
        }

        // Handle Phase Dash
        if (event.key === 'f' || event.key === 'F' || event.key === ' ') {
            event.preventDefault();
            triggerPhaseDash();
            return;
        }
        if (event.key === 'b' || event.key === 'B') {
            event.preventDefault();
            triggerChronosRecall();
            return;
        }
        if (event.key === 'e' || event.key === 'E') {
            event.preventDefault();
            triggerWallBreach();
            return;
        }
        // Solar Flare hotkey
        if (event.key === 'q' || event.key === 'Q') {
            event.preventDefault();
            triggerSolarFlare();
            return;
        }

        // Siren Decoy hotkey
        if (event.key === 'g' || event.key === 'G') {
            event.preventDefault();
            triggerSirenDecoy();
            return;
        }

        // Athena Owl Clairvoyance hotkey
        if (event.key === 'v' || event.key === 'V') {
            event.preventDefault();
            triggerOwlClairvoyance();
            return;
        }

        // Poseidon Riptide Surge hotkey
        if (event.key === 'c' || event.key === 'C') {
            event.preventDefault();
            triggerRiptideSurge();
            return;
        }

        // Artemis Silver Arrow hotkey
        if (event.key === 'x' || event.key === 'X') {
            event.preventDefault();
            triggerSilverArrow();
            return;
        }

        // Apollo Solar Chariot hotkey
        if (event.key === 'z' || event.key === 'Z') {
            event.preventDefault();
            triggerSolarChariot();
            return;
        }

        // Hephaestus Molten Anvil hotkey
        if (event.key === 'h' || event.key === 'H') {
            event.preventDefault();
            triggerMoltenAnvil();
            return;
        }

        // M/m view mode toggle
        if (event.key === 'm' || event.key === 'M') {
            event.preventDefault();
            if (typeof toggleViewMode === 'function') toggleViewMode();
            return;
        }

        let newX = playerX;
        let newY = playerY;

        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                newY--; // Move up
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                newY++; // Move down
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                newX--; // Move left
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                newX++; // Move right
                break;
            default:
                return;
        }

        // Update facing direction and UI even when movement blocked
        lastMoveDir = { dx: newX - playerX, dy: newY - playerY };
        updateDashUI();
        updateBreachUI();
        updateTridentUI();
        updateArrowUI();
        updateChariotUI();

        // Only process movement if position actually changed
        if (newX !== playerX || newY !== playerY) {
            // Check if the new position is a path (white tile)
            if (maze[newY] && maze[newY][newX] === 1) {
                // Check if the new tile contains a gate
                const gateIndex = gates.findIndex(g => g.x === newX && g.y === newY);
                if (gateIndex !== -1) {
                    if (playerKeys > 0) {
                        playerKeys--;
                        gates.splice(gateIndex, 1);
                        document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
                    } else {
                        // Block movement and trigger feedback
                        document.body.style.backgroundColor = '#ffcccc';
                        setTimeout(() => { document.body.style.backgroundColor = ''; }, 100);
                        // Redraw 3D view and minimap when turning toward locked gate
                        drawMaze();
                        return;
                    }
                }

                collectBreachAt(newX, newY);
                playerX = newX; // Update player position
                playerY = newY; // Update player position
                onPlayerThreadStep();
                onPlayerFlareStep();

                // Increment step counter and update UI
                steps++;
                stepCount = steps;
                const stepCounterEl = document.getElementById('stepCounter');
                if (stepCounterEl) stepCounterEl.textContent = `Steps: ${steps}`;

                // Collect Hermes shrine if present
                collectHermesAt(playerX, playerY);
                updateDashUI();
                updateBreachUI();

                // Check if the player is moving backwards
                if (!isDecoyLureActive()) {
                    if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) {
                        minotaurPath.pop(); // Remove the repeated position
                    } else {
                        minotaurPath.push({x: playerX, y: playerY}); // Append to minotaur path
                    }
                }
                onPlayerDecoyStep();
                onPlayerOwlStep();
                collectTridentAt(playerX, playerY);
                updateTridentUI();
                onPlayerArrowStep();
        onPlayerChariotStep();
        onPlayerAnvilStep();

                // Check if the new tile is not in visitedTiles
                const tileKeyStr = `${playerX},${playerY}`;
                if (!visitedTiles.has(tileKeyStr)) {
                    visitedTiles.add(tileKeyStr);
                    document.getElementById('uniqueTilesCounter').textContent = `Unique Tiles: ${visitedTiles.size}`;
                }

                // Check if the new tile contains a key
                const keyIndex = keys.findIndex(k => k.x === playerX && k.y === playerY);
                if (keyIndex !== -1) {
                    playerKeys++;
                    keys.splice(keyIndex, 1);
                    document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
                }

                // Torch pickup logic: after key pickup, before escape check
                const torchIndex = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
                if (torchIndex !== -1) {
                    torchPickups.splice(torchIndex, 1);
                    torchActive = true;
                    torchStepsRemaining = TORCH_EFFECT_STEPS;
                    updateTorchIndicator();
                }

                // Torch effect decrement logic
                if (torchActive) {
                    torchStepsRemaining--;
                    if (torchStepsRemaining <= 0) {
                        torchActive = false;
                        torchStepsRemaining = 0;
                    }
                    updateTorchIndicator();
                }

                // Check for secret passage teleportation
                const passage = secretPassages.find(p => p.fromX === playerX && p.fromY === playerY);
                if (passage) {
                    // Teleport player to destination
                    playerX = passage.toX;
                    playerY = passage.toY;
                    collectBreachAt(playerX, playerY);
                    updateBreachUI();

                    // Check if there's a spool at the destination
                    if (collectSpoolAt(playerX, playerY)) updateSpoolUI();
                    collectShieldAt(playerX, playerY);
                    updateShieldUI();

                    // Collect Hermes shrine if present
                    collectHermesAt(playerX, playerY);
                    updateDashUI();

                    collectRecallAt(playerX, playerY);
                    updateRecallUI();
                    if (collectIcarusAt(playerX, playerY)) updateFlareUI();

                    // Collect Apollo shrine at teleport destination
                    collectChariotAt(playerX, playerY);
                    updateChariotUI();
                    collectDecoyAt(playerX, playerY);
                    collectOwlAt(playerX, playerY);
                    if (owlStepsRemaining > 0) refreshOwlEscapePreview();
                    updateOwlUI();
                    collectTridentAt(playerX, playerY);
                    updateTridentUI();
                    collectArrowAt(playerX, playerY);
                    updateArrowUI();

                    // Collect Hephaestus shrine at teleport destination
                    collectAnvilAt(playerX, playerY);
                    updateAnvilUI();

                    // Update visited tiles and counters
                    const newTileKey = `${playerX},${playerY}`;
                    if (!visitedTiles.has(newTileKey)) {
                        visitedTiles.add(newTileKey);
                        document.getElementById('uniqueTilesCounter').textContent = `Unique Tiles: ${visitedTiles.size}`;
                    }

                    // Update minotaur path with the teleported position
                    if (!isDecoyLureActive()) {
                        if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) {
                            minotaurPath.pop();
                        } else {
                            minotaurPath.push({x: playerX, y: playerY});
                        }
                    }
                    showSecretPassageMessage();
                }

                // Check if player reached escape tile
                if (playerX === escapeX && playerY === escapeY) {
                    gameWon = true;
                    activeDecoy = null;
                    window.activeDecoy = null;
                    updateDecoyUI();
                    solarFlareStepsRemaining = 0;
                    compassStepsRemaining = 0;
                    torchActive = false;
                    torchStepsRemaining = 0;
                    updateTorchIndicator();
                    updateFlareUI();
                    owlStepsRemaining = 0;
                    owlEscapePreview = [];
                    updateOwlUI();
                    updateTridentUI();
                    arrowVisionStepsRemaining = 0;
                    arrowTrail = [];
                    updateArrowUI();
                    chariotTrailStepsRemaining = 0;
                    chariotTrail = [];
                    updateChariotUI();
                    // Clear active Anvil Trap on win
                    activeAnvilTrap = null;
                    window.activeAnvilTrap = null;
                    updateAnvilUI();
                    const winOverlay = document.getElementById('winOverlay');
                    if (winOverlay) {
                        winOverlay.textContent = formatWinSummary();
                        winOverlay.style.display = 'flex';
                    }
                    updateSpoolUI();
                    updateShieldUI();
                    updateDashUI();
                    updateRecallUI();
                    updateBreachUI();
                    drawMaze(); // Redraw maze with overlay on top
                    return;
                }

                // Check if player stepped directly onto the Minotaur
                if (minotaurX === playerX && minotaurY === playerY) {
                    if (playerShields > 0) {
                        triggerAegisRepel(true);
                        return;
                    }
                    gameLost = true;
                    arrowVisionStepsRemaining = 0;
                    arrowTrail = [];
                    chariotTrailStepsRemaining = 0;
                    chariotTrail = [];
                    updateSpoolUI();
                    updateShieldUI();
                    updateDashUI();
                    updateRecallUI();
                    updateBreachUI();
                    updateTridentUI();
                    updateArrowUI();
                    updateChariotUI();
                    // Clear active Anvil Trap on loss
                    activeAnvilTrap = null;
                    window.activeAnvilTrap = null;
                    updateAnvilUI();
                    // Lose: update flare UI to disable button
                    updateFlareUI();
                    updateDecoyUI();
                    updateOwlUI();
                    const overlay = document.getElementById('loseOverlay');
                    if (overlay) overlay.style.display = 'flex';
                    drawMaze();
                    return;
                }
                drawMaze();
            }
            else {
                drawMaze();
            }
        }
        else {
            drawMaze();
        }
    });
}
