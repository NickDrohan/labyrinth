document.addEventListener('DOMContentLoaded', function() {
    // Call initGame instead of individual initialization calls
    initGame();

    // Add event listeners for the new buttons
    document.getElementById('centerCameraButton').addEventListener('click', function() {
        cameraMode = 'center';
        document.getElementById('gameCanvas').focus();
        drawMaze();
    });

    document.getElementById('edgeCameraButton').addEventListener('click', function() {
        cameraMode = 'edge';
        document.getElementById('gameCanvas').focus();
        drawMaze();
    });
});

// Move ALL global variables to the very top of the file
const canvas = document.getElementById('gameCanvas');
const pixiApp = new PIXI.Application({
    view: canvas,
    width: canvas.width,
    height: canvas.height,
    antialias: true,
    backgroundColor: 0x000000,
    autoStart: false
});
const mazeGraphics = new PIXI.Graphics();
pixiApp.stage.addChild(mazeGraphics);
const tileSize = 16; // Size of each tile
const visibleWidth = 50; // Number of tiles to display in width
const visibleHeight = 50; // Number of tiles to display in height

// Initialize player and minotaur positions
let playerX = 25; // Start in the middle of the visible section
let playerY = 25;
let minotaurX = -1;
let minotaurY = -1;
const visitedTiles = new Set();
const keys = [];
const gates = [];
let playerKeys = 0;


function selectEscapeTile() {
  let valid = false;
  let attempts = 0;
  const maxAttempts = 1000;
  while (!valid && attempts < maxAttempts) {
    const tx = Math.floor(Math.random() * maze[0].length);
    const ty = Math.floor(Math.random() * maze.length);
    if (maze[ty][tx] === 1) {
      const manhattan = Math.abs(tx - playerX) + Math.abs(ty - playerY);
      if (manhattan >= 100 && !(tx === playerX && ty === playerY)) {
        escapeX = tx;
        escapeY = ty;
        valid = true;
      }
    }
    attempts++;
  }
  if (!valid) {
    // Fallback: place anywhere on a path tile, avoiding player start
    for (let y = 0; y < maze.length && !valid; y++) {
      for (let x = 0; x < maze[y].length && !valid; x++) {
        if (maze[y][x] === 1 && !(x === playerX && y === playerY)) {
          escapeX = x;
          escapeY = y;
          valid = true;
        }
      }
    }
  }
}


// Escape tile position and win state globals
let escapeX = -1;
let escapeY = -1;
let gameWon = false;

// Generate the maze
let cameraMode = "center";
const maze = generateMaze(1000, 1000);

// Ensure the player starts on a valid path

// Generate the maze


// Ensure the player starts on a valid path
while (maze[playerY][playerX] !== 1) {
    playerX = Math.floor(Math.random() * 1000);
    playerY = Math.floor(Math.random() * 1000);
}

// Then all your function definitions follow...
function generateMaze(width, height) {
    const maze = Array.from({ length: height }, () => Array(width).fill(0));
    const stack = [];
    const start = [0, 0];
    stack.push(start);
    maze[0][0] = 1; // Mark the starting point as part of the maze

    while (stack.length > 0) {
        const [x, y] = stack[stack.length - 1];
        const neighbors = [];

        // Check for unvisited neighbors
        if (x > 1 && maze[y][x - 2] === 0) neighbors.push([x - 2, y]);
        if (y > 1 && maze[y - 2][x] === 0) neighbors.push([x, y - 2]);
        if (x < width - 2 && maze[y][x + 2] === 0) neighbors.push([x + 2, y]);
        if (y < height - 2 && maze[y + 2][x] === 0) neighbors.push([x, y + 2]);

        if (neighbors.length > 0) {
            const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[ny][nx] = 1; // Mark the neighbor as part of the maze
            maze[y + (ny - y) / 2][x + (nx - x) / 2] = 1; // Remove the wall
            stack.push([nx, ny]);
        } else {
            stack.pop();
        }
    }

    return maze;
}

// Function to draw the maze with inverted feather effect for the visible section
function drawMaze() {
    mazeGraphics.clear();

    let startX, startY;

    if (cameraMode === 'center') {
        startX = playerX - Math.floor(visibleWidth / 2);
        startY = playerY - Math.floor(visibleHeight / 2);
    } else { // edge mode
        startX = Math.floor(playerX / visibleWidth) * visibleWidth;
        startY = Math.floor(playerY / visibleHeight) * visibleHeight;
    }

    for (let y = 0; y < visibleHeight; y++) {
        for (let x = 0; x < visibleWidth; x++) {
            const mazeX = startX + x;
            const mazeY = startY + y;

            if (mazeY >= 0 && mazeY < 1000 && mazeX >= 0 && mazeX < 1000) {
                // Draw escape tile first (beneath player)
                if (mazeX === escapeX && mazeY === escapeY) {
                    mazeGraphics.beginFill(0xffd700, 1);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();
                }

                // Draw keys (gold key icon) - above path tiles, below player
                if (keys && keys.length > 0) {
                    for (let i = 0; i < keys.length; i++) {
                        if (keys[i].x === mazeX && keys[i].y === mazeY) {
                            mazeGraphics.beginFill(0xffd700, 1);
                            mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3);
                            mazeGraphics.endFill();
                            // Draw key handle
                            mazeGraphics.beginFill(0xb8860b, 1);
                            mazeGraphics.drawRect(x * tileSize + tileSize / 4, y * tileSize + tileSize / 2 + tileSize / 6, tileSize / 4, tileSize / 6);
                            mazeGraphics.endFill();
                        }
                    }
                }

                // Draw gates (blue gate icon) - above path tiles, below player
                if (gates && gates.length > 0) {
                    for (let i = 0; i < gates.length; i++) {
                        if (gates[i].x === mazeX && gates[i].y === mazeY) {
                            mazeGraphics.beginFill(0x0000ff, 1);
                            mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 8);
                            mazeGraphics.endFill();
                        }
                    }
                }

                if (mazeX === playerX && mazeY === playerY) {
                    // Draw player
                    mazeGraphics.beginFill(0xff0000, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3);
                    mazeGraphics.endFill();
                    mazeGraphics.lineStyle(3, 0xffd700, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3);
                    mazeGraphics.lineStyle(0);
                } else if (maze[mazeY][mazeX] === 1) {
                    // Draw maze tile
                    const isAdjacentToWall = (
                        (mazeX > 0 && maze[mazeY][mazeX - 1] === 0) || // Left
                        (mazeX < 999 && maze[mazeY][mazeX + 1] === 0) || // Right
                        (mazeY > 0 && maze[mazeY - 1][mazeX] === 0) || // Up
                        (mazeY < 999 && maze[mazeY + 1][mazeX] === 0) // Down
                    );

                    if (isAdjacentToWall) {
                        // Feathered edge: larger, more translucent underlay
                        mazeGraphics.beginFill(0x00bfff, 0.25);
                        mazeGraphics.drawRoundedRect(x * tileSize - 2, y * tileSize - 2, tileSize + 4, tileSize + 4, 6);
                        mazeGraphics.endFill();
                    }

                    // Opaque path
                    mazeGraphics.beginFill(0x00bfff, 1);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();
                }
            }
        }
    }

    drawMinotaur();
    pixiApp.render();
}

// Handle user input for movement


// Add mobile touch controls
function setupMobileControls() {
    const canvas = document.getElementById('gameCanvas');
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

        let newX = playerX;
        let newY = playerY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                newX++; // Move right
            } else {
                newX--; // Move left
            }
        } else {
            if (diffY > 0) {
                newY++; // Move down
            } else {
                newY--; // Move up
            }
        }

        // Check if the new position is a path (white tile)
        if (maze[newY] && maze[newY][newX] === 1) {
            playerX = newX; // Update player position
            playerY = newY; // Update player position
        }

        drawMaze(); // Redraw the maze and player
    });
}

function generatePathDFS(x, y, path, visited, steps) {
    if (path.length >= steps) return true;

    const directions = [
        {x: 0, y: -1}, // Up
        {x: 1, y: 0},  // Right
        {x: 0, y: 1},  // Down
        {x: -1, y: 0}  // Left
    ];

    // Shuffle directions to ensure randomness
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    for (const dir of directions) {
        const newX = x + dir.x;
        const newY = y + dir.y;
        const key = `${newX},${newY}`;

        if (maze[newY] && maze[newY][newX] === 1 && !visited.has(key)) {
            visited.add(key);
            path.push({x: newX, y: newY});

            if (generatePathDFS(newX, newY, path, visited, steps)) {
                return true;
            }

            path.pop();
            visited.delete(key);
        }
    }

    return false;
}

function spawnMinotaur() {
    const path = [];
    const visited = new Set();
    visited.add(`${playerX},${playerY}`);
    path.push({x: playerX, y: playerY});

    if (generatePathDFS(playerX, playerY, path, visited, 50)) {
        minotaurX = path[path.length - 1].x;
        minotaurY = path[path.length - 1].y;
    }

    // Invert the path
    return path.reverse();
}

function drawMinotaur() {
    if (minotaurX === -1 || minotaurY === -1) {
        return;
    }

    // Calculate viewport boundaries based on camera mode
    let viewportLeft, viewportRight, viewportTop, viewportBottom;

    if (cameraMode === 'center') {
        viewportLeft = playerX - Math.floor(visibleWidth / 2);
        viewportRight = playerX + Math.floor(visibleWidth / 2);
        viewportTop = playerY - Math.floor(visibleHeight / 2);
        viewportBottom = playerY + Math.floor(visibleHeight / 2);
    } else { // edge mode
        viewportLeft = Math.floor(playerX / visibleWidth) * visibleWidth;
        viewportRight = viewportLeft + visibleWidth;
        viewportTop = Math.floor(playerY / visibleHeight) * visibleHeight;
        viewportBottom = viewportTop + visibleHeight;
    }

    // Check if minotaur is within viewport
    if (minotaurX < viewportLeft || minotaurX > viewportRight ||
        minotaurY < viewportTop || minotaurY > viewportBottom) {
        return;
    }

    // Calculate minotaur's position on the canvas
    const canvasX = (minotaurX - viewportLeft) * tileSize;
    const canvasY = (minotaurY - viewportTop) * tileSize;

    // Calculate diamond corners relative to canvas position
    const centerX = canvasX + tileSize / 2;
    const centerY = canvasY + tileSize / 2;
    const size = tileSize / 2;

    // Draw larger, translucent purple diamond for glow
    mazeGraphics.beginFill(0x800080, 0.18);
    mazeGraphics.moveTo(centerX, centerY - (size + 3));
    mazeGraphics.lineTo(centerX + (size + 3), centerY);
    mazeGraphics.lineTo(centerX, centerY + (size + 3));
    mazeGraphics.lineTo(centerX - (size + 3), centerY);
    mazeGraphics.endFill();

    // Draw smaller, opaque purple diamond
    mazeGraphics.beginFill(0x800080, 1);
    mazeGraphics.moveTo(centerX, centerY - size);
    mazeGraphics.lineTo(centerX + size, centerY);
    mazeGraphics.lineTo(centerX, centerY + size);
    mazeGraphics.lineTo(centerX - size, centerY);
    mazeGraphics.endFill();


    // Draw smaller, opaque purple diamond
    mazeGraphics.beginFill(0x800080, 1);
    mazeGraphics.moveTo(centerX, centerY - size);
    mazeGraphics.lineTo(centerX + size, centerY);
    mazeGraphics.lineTo(centerX, centerY + size);
    mazeGraphics.lineTo(centerX - size, centerY);
    mazeGraphics.endFill();
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

// Move the initialization code to the bottom of the file
function initGame() {
    visitedTiles.clear();
    visitedTiles.add(`${playerX},${playerY}`);
    document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: 1';
    playerKeys = 0;
    document.getElementById('keyCounter').textContent = 'Keys: 0';
    keys.length = 0;
    gates.length = 0;

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

    // Select escape tile first to ensure escapeX/escapeY are set
    selectEscapeTile();

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

    minotaurPath = spawnMinotaur();
    let stepCount = 0; // Initialize step count
    drawMaze();

    setupMobileControls(); // Initialize mobile controls

    // Start minotaur behavior
    setInterval(() => {
        if (gameWon) {
            return; // Skip minotaur movement if game is won
        }
        if (minotaurPath.length > 0) {
            const nextPosition = minotaurPath.shift(); // Use shift to move towards the user
            if (nextPosition) {
                minotaurX = nextPosition.x;
                minotaurY = nextPosition.y;
                stepCount++; // Increment step count
                document.getElementById('stepCounter').textContent = `Steps: ${stepCount}`; // Update step counter

                // Check for collision with the user
                if (minotaurX === playerX && minotaurY === playerY) {
                    window.location.reload(); // Refresh the page
                    return;
                }

                drawMaze();
            }
        }
    }, 250); // Move 4 times per second (1000ms / 4 = 250ms)

    // Handle user movement
    document.addEventListener('keydown', (event) => {
        if (gameWon) {
            return; // Ignore player input if game is won
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
        }

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
                    return;
                }
            }

            playerX = newX; // Update player position
            playerY = newY; // Update player position

            // Check if the player is moving backwards
            if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) {
                minotaurPath.pop(); // Remove the repeated position
            } else {
                minotaurPath.push({x: playerX, y: playerY}); // Append to minotaur path
            }

            // Check if the new tile is not in visitedTiles
            const tileKey = `${playerX},${playerY}`;
            if (!visitedTiles.has(tileKey)) {
                visitedTiles.add(tileKey);
                document.getElementById('uniqueTilesCounter').textContent = `Unique Tiles: ${visitedTiles.size}`;
            }

            // Check if the new tile contains a key
            const keyIndex = keys.findIndex(k => k.x === playerX && k.y === playerY);
            if (keyIndex !== -1) {
                playerKeys++;
                keys.splice(keyIndex, 1);
                document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
            }

            // Check if player reached escape tile
            if (playerX === escapeX && playerY === escapeY) {
                gameWon = true; // Set win state
                // Display win overlay using persistent overlay element
                const overlay = document.getElementById('winOverlay');
                if (overlay) {
                    overlay.textContent = `You Escaped! Steps: ${stepCount}, Unique Tiles: ${visitedTiles.size}, Keys: ${playerKeys}`;
                    overlay.style.display = 'flex';
                }
                drawMaze(); // Redraw maze with overlay on top
                return;
            }
        }

        drawMaze(); // Redraw the maze and player
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
    });
}

function handleMobileMove(direction) {
    if (gameWon) {
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

    // Check if the new position is a path (white tile)
    if (maze[newY] && maze[newY][newX] === 1) {
        playerX = newX;
        playerY = newY;

        // Track unique tiles visited
        const tileKey = `${playerX},${playerY}`;
        if (!visitedTiles.has(tileKey)) {
            visitedTiles.add(tileKey);
            document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
        }

        // Update minotaur path
        if (minotaurPath.length > 0 &&
            minotaurPath[minotaurPath.length - 1].x === playerX &&
            minotaurPath[minotaurPath.length - 1].y === playerY) {
            minotaurPath.pop(); // Remove the repeated position
        } else {
            minotaurPath.push({x: playerX, y: playerY}); // Append to minotaur path
        }

        if (playerX === escapeX && playerY === escapeY) {
            gameWon = true;
            const overlay = document.getElementById('winOverlay');
            overlay.textContent = 'You Escaped! Steps: ' + document.getElementById('stepCounter').textContent + ', Unique Tiles: ' + visitedTiles.size + ', Keys: ' + playerKeys;
            overlay.style.display = 'flex';
        }
        drawMaze();
    }
}


// Add this to your initialization code
initMobileControls();
