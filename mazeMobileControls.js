

// Handle user input for movement


// Add mobile touch controls
function setupMobileControls() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas || canvas.dataset.mobileControlsInitialized || canvas._mobileControlsInitialized) {
        return;
    }
    canvas.dataset.mobileControlsInitialized = 'true';
    canvas._mobileControlsInitialized = true;
    let startX, startY;

    canvas.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
    });

    canvas.addEventListener('touchend', (event) => {
        const touch = event.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;

        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                handleMobileMove('right');
            } else {
                handleMobileMove('left');
            }
        } else {
            if (diffY > 0) {
                handleMobileMove('down');
            } else {
                handleMobileMove('up');
            }
        }
    });
}





// Find the mobile button event handlers
function initMobileControls() {
    document.querySelectorAll('.mobile-btn').forEach(btn => {
        // Prevent double-tap zoom
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            const direction = btn.dataset.direction;
            handleMobileMove(direction);
        }, { passive: false });
        
        // Prevent default on touchstart to avoid any zooming
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        btn.addEventListener('click', () => {
            const direction = btn.dataset.direction;
            handleMobileMove(direction);
        });
    });
}

function handleMobileMove(direction) {
    if (gameWon) {
        return;
    }

    if (gameLost) {
        return;
    }

    let newX = playerX;
    let newY = playerY;

    switch(direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }

    // Update last move direction and dash UI even when movement is blocked
    if (newX !== playerX || newY !== playerY) {
        lastMoveDir = { dx: newX - playerX, dy: newY - playerY };
        updateDashUI();
        updateBreachUI();
    }

    // Check if the new position is a gate
    const gateIdx = gates.findIndex(g => g.x === newX && g.y === newY);
    if (gateIdx !== -1) {
        if (playerKeys > 0) {
            playerKeys--;
            gates.splice(gateIdx, 1);
            
            document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
            // Remove the gate from the maze
            maze[newY][newX] = 1;
            // Recursively move into the now-open tile
            return handleMobileMove(direction);
        } else {
            // Block movement and give feedback - brief color flash
            document.body.style.backgroundColor = '#FF0000';
            setTimeout(() => { document.body.style.backgroundColor = ''; }, 50);
            return;
        }
    }

    // Check if the new position is a key
    const keyIdx = keys.findIndex(k => k.x === newX && k.y === newY);
    if (keyIdx !== -1) {
        playerKeys++;
        keys.splice(keyIdx, 1);
        document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
    }

    // Check if the new position is a torch
    const torchIdx = torchPickups.findIndex(t => t.x === newX && t.y === newY);
    if (torchIdx !== -1) {
        torchPickups.splice(torchIdx, 1);
        torchActive = true;
        torchStepsRemaining = TORCH_EFFECT_STEPS;
        updateTorchIndicator();
    }

    // Check if the new position is a path (white tile)
    if (maze[newY] && maze[newY][newX] === 1) {
        // Collect any Daedalus shrine at the new position before moving
        collectBreachAt(newX, newY);
        playerX = newX;
        playerY = newY;

        onPlayerThreadStep();

        onPlayerFlareStep();

        // Increment steps and update step counter
        steps++;
        const sc = document.getElementById('stepCounter');
        if (sc) sc.textContent = 'Steps: ' + steps;

        // Track unique tiles visited
        const tileKey = `${playerX},${playerY}`;
        if (!visitedTiles.has(tileKey)) {
            visitedTiles.add(tileKey);
            document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
        }

        // Update minotaur path
        if (!isDecoyLureActive()) {
            if (minotaurPath.length > 0 &&
                minotaurPath[minotaurPath.length - 1].x === playerX &&
                minotaurPath[minotaurPath.length - 1].y === playerY) {
                minotaurPath.pop(); // Remove the repeated position
            } else {
                minotaurPath.push({x: playerX, y: playerY}); // Append to minotaur path
            }
        }
        onPlayerDecoyStep();
        onPlayerOwlStep();

        // Check for secret passage teleportation after moving onto a new tile
        const passageIdx = secretPassages.findIndex(p => p.fromX === playerX && p.fromY === playerY);
        if (passageIdx !== -1) {
            // Decrement active torch steps consistently with keyboard movement
            if (torchActive) {
                torchStepsRemaining--;
                if (torchStepsRemaining <= 0) {
                    torchActive = false;
                    torchStepsRemaining = 0;
                }
                updateTorchIndicator();
            }

            // Teleport player to the paired destination
            playerX = secretPassages[passageIdx].toX;
            playerY = secretPassages[passageIdx].toY;

            // Collect any Daedalus shrine at the teleport destination before continuing
            collectBreachAt(playerX, playerY);
            updateBreachUI();

            // Collect shield at secret passage destination
            collectShieldAt(playerX, playerY);
            updateShieldUI();

            // Collect Hermes shrine at secret passage destination
            collectHermesAt(playerX, playerY);
            updateDashUI();

            // Collect recall at secret passage destination
            collectRecallAt(playerX, playerY);
            updateRecallUI();

            if (collectIcarusAt(playerX, playerY)) updateFlareUI();
            collectDecoyAt(playerX, playerY);

            // Collect Owl shrine at current tile
            collectOwlAt(playerX, playerY);
            if (owlStepsRemaining > 0) refreshOwlEscapePreview();
            updateOwlUI();

            // Update visited tiles tracking
            const tileKey = `${playerX},${playerY}`;
            if (!visitedTiles.has(tileKey)) {
                visitedTiles.add(tileKey);
                document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
            }

            // Update minotaur path
            if (!isDecoyLureActive()) {
                if (minotaurPath.length > 0 &&
                    minotaurPath[minotaurPath.length - 1].x === playerX &&
                    minotaurPath[minotaurPath.length - 1].y === playerY) {
                    minotaurPath.pop();
                } else {
                    minotaurPath.push({x: playerX, y: playerY});
                }
            }

            // Show secret passage message
            showSecretPassageMessage();

            // Check if minotaur is at destination (lose condition)
            if (playerX === minotaurX && playerY === minotaurY) {
                if (playerShields > 0) {
                    triggerAegisRepel(true);
                    updateDashUI();
                    updateBreachUI();
                    updateFlareUI();
                    updateDecoyUI();
                    updateOwlUI();
                    return;
                }
                gameLost = true;
                updateSpoolUI();
                updateShieldUI();
                updateDashUI();
                updateRecallUI();
                updateBreachUI();
                updateFlareUI();
                updateDecoyUI();
                updateOwlUI();
                const overlay = document.getElementById('loseOverlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                    // Preserve existing textContent so #resetButton child element remains intact
                }
            }

            drawMaze();
            return;
        }
        if (torchActive) {
            torchStepsRemaining--;
            if (torchStepsRemaining <= 0) {
                torchActive = false;
                torchStepsRemaining = 0;
            }
            updateTorchIndicator();
        }

        // Check for Minotaur collision (non-teleport step)
        if (playerX === minotaurX && playerY === minotaurY) {
            if (playerShields > 0) {
                triggerAegisRepel(true);
                updateDashUI();
                updateBreachUI();
                updateFlareUI();
                updateDecoyUI();
                updateOwlUI();
                return;
            } else {
                gameLost = true;
                updateSpoolUI();
                updateShieldUI();
                updateDashUI();
                updateRecallUI();
                updateBreachUI();
                updateFlareUI();
                updateDecoyUI();
                updateOwlUI();
                const overlay = document.getElementById('loseOverlay');
                if (overlay) overlay.style.display = 'flex';
                drawMaze();
                return;
            }
        }

        // Collect Hermes shrine on regular tile move
        collectHermesAt(playerX, playerY);
        updateDashUI();
        updateBreachUI();

        if (playerX === escapeX && playerY === escapeY) {
            gameWon = true;
            compassStepsRemaining = 0;
            solarFlareStepsRemaining = 0;
            torchActive = false;
            torchStepsRemaining = 0;
            activeDecoy = null;
            window.activeDecoy = null;
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
            owlStepsRemaining = 0;
            owlEscapePreview = [];
            updateOwlUI();
            drawMaze();
            return;
        }
    }

    // Check if the new position is a key
    const keyIdx2 = keys.findIndex(k => k.x === newX && k.y === newY);
    if (keyIdx2 !== -1) {
        playerKeys++;
        keys.splice(keyIdx2, 1);
        document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
    }
}
