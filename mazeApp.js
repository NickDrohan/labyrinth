// Move ALL global variables to the very top of the file
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 16; // Size of each tile
const visibleWidth = 50; // Number of tiles to display in width
const visibleHeight = 50; // Number of tiles to display in height

// Initialize player and minotaur positions
let playerX = 25; // Start in the middle of the visible section
let playerY = 25;
let minotaurX = -1;
let minotaurY = -1;
let cameraMode = 'center'; // Default camera mode

// Generate the maze
const maze = generateMaze(1000, 1000);

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
    // Fill the entire canvas with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
                if (mazeX === playerX && mazeY === playerY) {
                    // Draw player
                    ctx.fillStyle = 'red';
                    ctx.strokeStyle = 'yellow';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                } else if (maze[mazeY][mazeX] === 1) {
                    // Draw maze tile
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    
                    // Add feather effect to paths adjacent to walls
                    if (
                        (mazeX > 0 && maze[mazeY][mazeX - 1] === 0) || // Left
                        (mazeX < 999 && maze[mazeY][mazeX + 1] === 0) || // Right
                        (mazeY > 0 && maze[mazeY - 1][mazeX] === 0) || // Up
                        (mazeY < 999 && maze[mazeY + 1][mazeX] === 0) // Down
                    ) {
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                        ctx.shadowBlur = 10;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
    }

    drawMinotaur();
}

// Handle user input for movement
document.addEventListener('keydown', (event) => {
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
        playerX = newX; // Update player position
        playerY = newY; // Update player position
    }

    drawMaze(); // Redraw the maze and player
});

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

// Handle camera mode change
document.getElementById('cameraMode').addEventListener('change', (event) => {
    cameraMode = event.target.value; // Update camera mode
    drawMaze(); // Redraw the maze with the new camera mode
});

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

    ctx.fillStyle = 'purple';
    ctx.beginPath();
    const centerX = canvasX + tileSize / 2;
    const centerY = canvasY + tileSize / 2;
    const size = tileSize / 2;
    
    ctx.moveTo(centerX, centerY - size); // Top
    ctx.lineTo(centerX + size, centerY); // Right
    ctx.lineTo(centerX, centerY + size); // Bottom
    ctx.lineTo(centerX - size, centerY); // Left
    ctx.closePath();
    ctx.fill();
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
    let minotaurPath = spawnMinotaur();
    let stepCount = 0; // Initialize step count
    drawMaze();
    
    setupMobileControls(); // Initialize mobile controls

    // Start minotaur behavior
    setInterval(() => {
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
            playerX = newX; // Update player position
            playerY = newY; // Update player position

            // Check if the player is moving backwards
            if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) {
                minotaurPath.pop(); // Remove the repeated position
            } else {
                minotaurPath.push({x: playerX, y: playerY}); // Append to minotaur path
            }
        }

        drawMaze(); // Redraw the maze and player
    });
}

// Call initGame instead of individual initialization calls
initGame();
