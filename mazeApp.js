document.addEventListener('DOMContentLoaded', function() {
    // Ensure secret passage message element exists
    if (!document.getElementById('secretPassageMessage')) {
        const msgDiv = document.createElement('div');
        msgDiv.id = 'secretPassageMessage';
        msgDiv.style.position = 'absolute';
        msgDiv.style.top = '40px';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translateX(-50%)';
        msgDiv.style.background = 'rgba(80,0,120,0.85)';
        msgDiv.style.color = '#fff';
        msgDiv.style.padding = '8px 18px';
        msgDiv.style.borderRadius = '12px';
        msgDiv.style.fontFamily = 'Arial, sans-serif';
        msgDiv.style.fontSize = '1.2rem';
        msgDiv.style.textShadow = '1px 1px 2px #000';
        msgDiv.style.zIndex = '1001';
        msgDiv.style.display = 'none';
        msgDiv.style.pointerEvents = 'none';
        document.body.appendChild(msgDiv);
    }
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

    const useSpoolBtn = document.getElementById('useSpoolButton');
    if (useSpoolBtn) {
        useSpoolBtn.addEventListener('click', function() {
            activateThreadCompass();
            document.getElementById('gameCanvas').focus();
        });
    }
});

// Helper to show and fade secret passage message
let secretPassageMsgTimeout = null;
let secretPassageFadeTimeout = null;
function showSecretPassageMessage() {
    const msgDiv = document.getElementById('secretPassageMessage');
    if (!msgDiv) return;
    msgDiv.textContent = 'You found a secret passage!';
    msgDiv.style.transition = '';
    msgDiv.style.opacity = '1';
    msgDiv.style.display = 'block';
    if (secretPassageMsgTimeout) {
        clearTimeout(secretPassageMsgTimeout);
    }
    if (secretPassageFadeTimeout) {
        clearTimeout(secretPassageFadeTimeout);
    }
    secretPassageMsgTimeout = setTimeout(() => {
        msgDiv.style.transition = 'opacity 0.4s';
        msgDiv.style.opacity = '0';
        setTimeout(() => {
            msgDiv.style.display = 'none';
            msgDiv.style.transition = '';
        }, 400);
    }, 1500);
    secretPassageFadeTimeout = setTimeout(() => {
        msgDiv.style.display = 'none';
        msgDiv.style.transition = '';
    }, 1900);
}
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

let playerX = 25; // Start in the middle of the visible section
let playerY = 25;
let minotaurX = -1;
let minotaurY = -1;
let minotaurActive = false;
let minotaurInterval = null;
let secretPassages = [];
window.secretPassages = secretPassages;
let debugMode = false;

let minotaurPath = [];
let torchPickups = [];
let torchActive = false;
let torchStepsRemaining = 0;
const TORCH_EFFECT_STEPS = 30;
const TORCH_RADIUS_NORMAL = 7;
const TORCH_RADIUS_BOOSTED = 15;
let threadSpools = [];
window.threadSpools = threadSpools;
let playerSpools = 0;
let compassStepsRemaining = 0;
const COMPASS_EFFECT_STEPS = 25;
const THREAD_SPOOL_COUNT = 18;

function isTorchTile(x, y) {
  return torchPickups.some(t => t.x === x && t.y === y);
}
let gameLost = false;

function updateTorchIndicator() {
  const indicator = document.getElementById('torchIndicator');
  if (torchActive && torchStepsRemaining > 0) {
    if (indicator) {
      indicator.textContent = torchStepsRemaining;
    }
  } else {
    if (indicator) {
      indicator.textContent = '';
    }
  }
}

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


// Helper to get all forbidden tiles (player, escape, keys, gates, torches)
function getForbiddenTiles() {
  const forbidden = new Set();
  forbidden.add(`${playerX},${playerY}`);
  forbidden.add(`${escapeX},${escapeY}`);
  if (Array.isArray(keys)) {
    for (const k of keys) forbidden.add(`${k.x},${k.y}`);
  }
  if (Array.isArray(gates)) {
    for (const g of gates) forbidden.add(`${g.x},${g.y}`);
  }
  if (Array.isArray(torchPickups)) {
    for (const t of torchPickups) forbidden.add(`${t.x},${t.y}`);
  }
  if (Array.isArray(threadSpools)) {
    for (const s of threadSpools) forbidden.add(`${s.x},${s.y}`);
  }
  return forbidden;
}

// Helper to get all valid path tiles not near forbidden tiles
function getCandidatePathTiles(minDist = 3) {
  const forbidden = getForbiddenTiles();
  const candidates = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] !== 1) continue;
      let tooClose = false;
      for (let dy = -minDist; dy <= minDist && !tooClose; dy++) {
        for (let dx = -minDist; dx <= minDist && !tooClose; dx++) {
          const nx = x + dx, ny = y + dy;
          if (forbidden.has(`${nx},${ny}`)) tooClose = true;
        }
      }
      if (!tooClose) candidates.push({x, y});
    }
  }
  return candidates;
}

// Returns Manhattan distance
function tileDist(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Place secret passages
function placeSecretPassages() {
  if (pixiApp && pixiApp.stage) {
    const existingOverlay = pixiApp.stage.getChildByName('__secretPassageOverlay');
    if (existingOverlay) {
      existingOverlay.destroy();
    }
  }
  secretPassages.length = 0;
  window.secretPassages = secretPassages;
  const minPairs = 3, maxPairs = 6, minDistance = 40;
  const candidates = getCandidatePathTiles(3);
  if (candidates.length < 2 * minPairs) return; // Not enough space
  const used = new Set();
  let attempts = 0;
  const pairs = Math.min(maxPairs, Math.max(minPairs, Math.floor(Math.random() * (maxPairs - minPairs + 1)) + minPairs));
  while (secretPassages.length < pairs && attempts < 2000) {
    attempts++;
    // Pick random 'from'
    const fromIdx = Math.floor(Math.random() * candidates.length);
    const from = candidates[fromIdx];
    if (used.has(`${from.x},${from.y}`)) continue;
    // Find a distant 'to'
    let bestTo = null, bestDist = 0;
    for (let i = 0; i < 20; i++) {
      const toIdx = Math.floor(Math.random() * candidates.length);
      if (toIdx === fromIdx) continue;
      const to = candidates[toIdx];
      if (used.has(`${to.x},${to.y}`)) continue;
      const dist = tileDist(from, to);
      if (dist >= minDistance && dist > bestDist) {
        bestTo = to;
        bestDist = dist;
      }
    }
    if (bestTo) {
      secretPassages.push({fromX: from.x, fromY: from.y, toX: bestTo.x, toY: bestTo.y});
      used.add(`${from.x},${from.y}`);
      used.add(`${bestTo.x},${bestTo.y}`);
    }
  }
  window.secretPassages = secretPassages;
}

function getProximityLabel() {
  const d = Math.abs(escapeX - playerX) + Math.abs(escapeY - playerY);
  if (d <= 60) return 'Hot';
  if (d <= 160) return 'Warm';
  return 'Cold';
}

function updateSpoolUI() {
  const spoolCounter = document.getElementById('spoolCounter');
  if (spoolCounter) spoolCounter.textContent = `Spools: ${playerSpools}`;

  const compassIndicator = document.getElementById('compassIndicator');
  if (compassIndicator) {
    if (compassStepsRemaining > 0) {
      compassIndicator.textContent = `Compass: ${compassStepsRemaining} (${getProximityLabel()})`;
      compassIndicator.classList.add('active');
    } else {
      compassIndicator.textContent = 'Compass: Off';
      compassIndicator.classList.remove('active');
    }
  }

  const btn = document.getElementById('useSpoolButton');
  if (btn) {
    btn.disabled = playerSpools <= 0 || compassStepsRemaining > 0 || gameWon || gameLost;
  }
}

function activateThreadCompass() {
  if (gameWon || gameLost || playerSpools <= 0 || compassStepsRemaining > 0) return false;

  playerSpools--;
  compassStepsRemaining = COMPASS_EFFECT_STEPS;
  updateSpoolUI();
  drawMaze();
  return true;
}
window.activateThreadCompass = activateThreadCompass;

function placeThreadSpools() {
  threadSpools.length = 0;
  window.threadSpools = threadSpools;

  const candidates = getCandidatePathTiles(5).filter(tile =>
    !secretPassages.some(passage =>
      Math.abs(tile.x - passage.fromX) + Math.abs(tile.y - passage.fromY) < 5 ||
      Math.abs(tile.x - passage.toX) + Math.abs(tile.y - passage.toY) < 5
    )
  );

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const tile of candidates) {
    if (threadSpools.length >= THREAD_SPOOL_COUNT) break;
    if (threadSpools.every(spool => tileDist(tile, spool) >= 5)) {
      threadSpools.push({ x: tile.x, y: tile.y });
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
                // Skip/darken tiles outside vision radius
                const distToPlayer = Math.max(Math.abs(mazeX - playerX), Math.abs(mazeY - playerY));
                const effectiveRadius = torchActive ? TORCH_RADIUS_BOOSTED : TORCH_RADIUS_NORMAL;
                if (distToPlayer > effectiveRadius) {
                    // Darken out-of-radius tiles
                    mazeGraphics.beginFill(0x001f3f, 0.3);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();
                    continue;
                }

                // Draw torch pickups as orange/yellow flame icons
                if (torchPickups && torchPickups.length > 0) {
                    for (let i = 0; i < torchPickups.length; i++) {
                        if (torchPickups[i].x === mazeX && torchPickups[i].y === mazeY) {
                            mazeGraphics.beginFill(0xffa500, 1);
                            mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3);
                            mazeGraphics.endFill();
                            // Add flame detail
                            mazeGraphics.beginFill(0xffd700, 1);
                            mazeGraphics.moveTo(x * tileSize + tileSize / 2, y * tileSize + tileSize / 6);
                            mazeGraphics.lineTo(x * tileSize + tileSize * 2 / 3, y * tileSize + tileSize / 3);
                            mazeGraphics.lineTo(x * tileSize + tileSize / 3, y * tileSize + tileSize / 3);
                            mazeGraphics.lineTo(x * tileSize + tileSize / 2, y * tileSize + tileSize / 4);
                            mazeGraphics.closePath();
                            mazeGraphics.endFill();
                            break;
                        }
                    }
                }

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

                // Draw gates
                if (gates && gates.length > 0) {
                    for (let i = 0; i < gates.length; i++) {
                        if (gates[i].x === mazeX && gates[i].y === mazeY) {
                            mazeGraphics.beginFill(0x0000ff, 1);
                            mazeGraphics.drawRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                            mazeGraphics.endFill();
                        }
                    }
                }

                // Draw torches
                if (torchPickups && torchPickups.length > 0) {
                    for (let i = 0; i < torchPickups.length; i++) {
                        if (torchPickups[i].x === mazeX && torchPickups[i].y === mazeY) {
                            mazeGraphics.beginFill(0xffa500, 1);
                            mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3);
                            mazeGraphics.endFill();
                            // Add flame detail
                            mazeGraphics.beginFill(0xffd700, 1);
                            mazeGraphics.moveTo(x * tileSize + tileSize / 2, y * tileSize + tileSize / 6);
                            mazeGraphics.lineTo(x * tileSize + tileSize * 2 / 3, y * tileSize + tileSize / 3);
                            mazeGraphics.lineTo(x * tileSize + tileSize / 3, y * tileSize + tileSize / 3);
                            mazeGraphics.lineTo(x * tileSize + tileSize / 2, y * tileSize + tileSize / 4);
                            mazeGraphics.closePath();
                            mazeGraphics.endFill();
                            break;
                        }
                    }
                }

                // Draw path tiles
                if (maze[mazeY][mazeX] === 1) {
                    mazeGraphics.beginFill(0x00bfff, 1);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();

                    // Draw golden breadcrumb trail on visited tiles (excluding player and escape)
                    if (visitedTiles.has(`${mazeX},${mazeY}`) && !(mazeX === playerX && mazeY === playerY) && !(mazeX === escapeX && mazeY === escapeY)) {
                        mazeGraphics.beginFill(0xffd700, 0.65);
                        mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 6);
                        mazeGraphics.endFill();
                    }

                    // Draw thread spool pickups
                    if (threadSpools && threadSpools.length > 0) {
                        for (let s of threadSpools) {
                            if (s.x === mazeX && s.y === mazeY) {
                                // Outer cyan circle
                                mazeGraphics.beginFill(0x00e5ff, 1);
                                mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3);
                                mazeGraphics.endFill();
                                // Inner white core
                                mazeGraphics.beginFill(0xffffff, 1);
                                mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 6);
                                mazeGraphics.endFill();
                                break;
                            }
                        }
                    }
                }

                // Draw secret passage 'from' tiles as swirling purple portals ON TOP of path tiles
                if (secretPassages && secretPassages.length > 0) {
                    for (let i = 0; i < secretPassages.length; i++) {
                        const passage = secretPassages[i];
                        // Check if passage 'from' tile is within viewport and matches current tile
                        const inViewport = passage.fromX >= startX && passage.fromX < startX + visibleWidth && passage.fromY >= startY && passage.fromY < startY + visibleHeight;
                        if (inViewport && passage.fromX === mazeX && passage.fromY === mazeY) {
                            const x = passage.fromX - startX;
                            const y = passage.fromY - startY;
                            const tileX = x * tileSize + tileSize / 2;
                            const tileY = y * tileSize + tileSize / 2;
                            const radius = tileSize / 2 - 4;
                            // Draw swirling purple portal with multiple arcs
                            mazeGraphics.beginFill(0x8000ff, 0.7);
                            for (let a = 0; a < 12; a++) {
                                const angle = (a / 12) * Math.PI * 2 + (i * 0.3 + performance.now() / 500) % (Math.PI * 2);
                                const r = radius * (0.7 + (a % 2 === 0 ? 0.15 : 0));
                                const px = tileX + Math.cos(angle) * r;
                                const py = tileY + Math.sin(angle) * r;
                                if (a === 0) {
                                    mazeGraphics.moveTo(px, py);
                                } else {
                                    mazeGraphics.lineTo(px, py);
                                }
                            }
                            mazeGraphics.closePath();
                            mazeGraphics.endFill();
                            // Draw inner light-purple swirl core
                            mazeGraphics.beginFill(0xd870ff, 0.85);
                            mazeGraphics.drawCircle(tileX, tileY, Math.max(2, radius * 0.35));
                            mazeGraphics.endFill();
                        }
                    }
                }

                // Draw debug 'to' tile circles when enabled
                if (debugMode) {
                    if (secretPassages && secretPassages.length > 0) {
                        for (let i = 0; i < secretPassages.length; i++) {
                            const passage = secretPassages[i];
                            const inToViewport = passage.toX >= startX && passage.toX < startX + visibleWidth && passage.toY >= startY && passage.toY < startY + visibleHeight;
                            if (inToViewport && passage.toX === mazeX && passage.toY === mazeY) {
                                const tx = (passage.toX - startX) * tileSize + tileSize / 2;
                                const ty = (passage.toY - startY) * tileSize + tileSize / 2;
                                mazeGraphics.beginFill(0x8000ff, 0.15);
                                mazeGraphics.drawCircle(tx, ty, tileSize / 4);
                                mazeGraphics.endFill();
                            }
                        }
                    }
                }

                // Draw player last (on top of everything)
                if (mazeX === playerX && mazeY === playerY) {
                    mazeGraphics.beginFill(0xff0000, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 2);
                    mazeGraphics.endFill();

                    // Draw active escape compass pointer
                    if (compassStepsRemaining > 0 && (escapeX !== playerX || escapeY !== playerY)) {
                        const angle = Math.atan2(escapeY - playerY, escapeX - playerX);
                        const cx = x * tileSize + tileSize / 2;
                        const cy = y * tileSize + tileSize / 2;
                        const pointerLen = tileSize * 1.4;
                        const tipX = cx + Math.cos(angle) * pointerLen;
                        const tipY = cy + Math.sin(angle) * pointerLen;

                        // Draw directional line
                        mazeGraphics.lineStyle(3, 0x00e5ff, 1);
                        mazeGraphics.moveTo(cx, cy);
                        mazeGraphics.lineTo(tipX, tipY);
                        mazeGraphics.lineStyle(0);

                        // Draw arrowhead triangle
                        const arrowSize = tileSize / 4;
                        const arrowAngle = angle + Math.PI;
                        const arrowX1 = tipX + Math.cos(arrowAngle + Math.PI / 6) * arrowSize;
                        const arrowY1 = tipY + Math.sin(arrowAngle + Math.PI / 6) * arrowSize;
                        const arrowX2 = tipX + Math.cos(arrowAngle - Math.PI / 6) * arrowSize;
                        const arrowY2 = tipY + Math.sin(arrowAngle - Math.PI / 6) * arrowSize;

                        mazeGraphics.beginFill(0x00e5ff, 1);
                        mazeGraphics.moveTo(tipX, tipY);
                        mazeGraphics.lineTo(arrowX1, arrowY1);
                        mazeGraphics.lineTo(arrowX2, arrowY2);
                        mazeGraphics.closePath();
                        mazeGraphics.endFill();
                    }
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

    while (queue.length > 0) {
        const {x, y, steps} = queue.shift();

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
                maze[nx][ny] !== 1 && !bfsVisited.has(key)) {
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
        // Try to find any valid tile not on player or escape tile
        for (let x = 0; x < maze[0].length && !spawnTile; x++) {
            for (let y = 0; y < maze.length && !spawnTile; y++) {
                const escapeKey = `${escapeTileX},${escapeTileY}`;
                const playerKey = `${playerX},${playerY}`;
                if (x !== playerX || y !== playerY) {
                    if (!(x === escapeTileX && y === escapeTileY)) {
                        if (maze[x][y] !== 1) {
                            spawnTile = {x, y};
                        }
                    }
                }
            }
        }
    }

    // Set Minotaur position
    if (spawnTile) {
        minotaurX = spawnTile.x;
        minotaurY = spawnTile.y;
    } else {
        minotaurX = -1;
        minotaurY = -1;
    }

    // Rebuild path from Minotaur to player using BFS with parent tracking
    minotaurPath = [];
    const pathVisited = new Set();
    pathVisited.add(`${minotaurX},${minotaurY}`);
    const pathQueue = [{x: minotaurX, y: minotaurY}];
    const parentMap = new Map();
    parentMap.set(`${minotaurX},${minotaurY}`, null);

    while (pathQueue.length > 0) {
        const {x, y} = pathQueue.shift();

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
                maze[nx][ny] !== 1 && !pathVisited.has(key)) {
                pathVisited.add(key);
                pathQueue.push({x: nx, y: ny});
                parentMap.set(`${nx},${ny}`, {x, y});
            }
        }
    }

    // Invert so path goes from Minotaur toward player
    return minotaurPath.reverse();
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
    document.getElementById('winOverlay').style.display = 'none';
    document.getElementById('loseOverlay').style.display = 'none';

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
    playerSpools = 0;
    compassStepsRemaining = 0;
    threadSpools.length = 0;

    // Select escape tile first to ensure escapeX/escapeY are set
    selectEscapeTile();

    // Helper: BFS to find shortest path from (sx,sy) to (ex,ey) on maze (1=path,0=wall)
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
    let stepCount = 0; // Initialize step count
    drawMaze();

    setupMobileControls(); // Initialize mobile controls

    // Start minotaur behavior
    minotaurInterval = setInterval(() => {
        if (gameWon || gameLost) {
            return; // Skip minotaur movement if game is won or lost
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
                    gameLost = true;
                    updateSpoolUI();
                    const overlay = document.getElementById('loseOverlay');
                    if (overlay) {
                        overlay.style.display = 'flex';
                    }
                    return;
                }

                drawMaze();
            }
        }
    }, 250); // Move 4 times per second (1000ms / 4 = 250ms)

    // Handle user movement
    document.addEventListener('keydown', (event) => {
        if (gameWon || gameLost) {
            return; // Ignore player input if game is won or lost
        }
        
        // Handle compass activation without movement
        if (event.key === 't' || event.key === 'T') {
            activateThreadCompass();
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
        }

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

                // Check for spool pickup
                const spoolIndex = threadSpools.findIndex(s => s.x === playerX && s.y === playerY);
                if (spoolIndex !== -1) {
                    threadSpools.splice(spoolIndex, 1);
                    playerSpools++;
                }

                // Compass step countdown
                if (compassStepsRemaining > 0) {
                    compassStepsRemaining--;
                }

                // Update HUD
                updateSpoolUI();

                // Check if player reached escape tile
                if (playerX === escapeX && playerY === escapeY) {
                    gameWon = true; // Set win state
                    // Display win overlay using persistent overlay element
                    const overlay = document.getElementById('winOverlay');
                    if (overlay) {
                        overlay.textContent = `You Escaped! Steps: ${stepCount}, Unique Tiles: ${visitedTiles.size}, Keys: ${playerKeys}`;
                        overlay.style.display = 'flex';
                    }
                    // Torch effect ends on win
                    torchActive = false;
                    torchStepsRemaining = 0;
                    updateTorchIndicator();
                    updateSpoolUI();
                    drawMaze(); // Redraw maze with overlay on top
                    return;
                }

                // Check for secret passage teleportation
                const passage = secretPassages.find(p => p.fromX === playerX && p.fromY === playerY);
                if (passage) {
                    // Teleport player to destination
                    playerX = passage.toX;
                    playerY = passage.toY;

                    // Update visited tiles and counters
                    const newTileKey = `${playerX},${playerY}`;
                    if (!visitedTiles.has(newTileKey)) {
                        visitedTiles.add(newTileKey);
                        document.getElementById('uniqueTilesCounter').textContent = `Unique Tiles: ${visitedTiles.size}`;
                    }

                    // Update minotaur path with the teleported position
                    if (minotaurPath.length > 0 && minotaurPath[minotaurPath.length - 1].x === playerX && minotaurPath[minotaurPath.length - 1].y === playerY) {
                        minotaurPath.pop();
                    } else {
                        minotaurPath.push({x: playerX, y: playerY});
                    }

                    showSecretPassageMessage();

                    // Check if the minotaur is at the destination
                    if (minotaurX === playerX && minotaurY === playerY) {
                        gameLost = true;
                        updateSpoolUI();
                        const overlay = document.getElementById('loseOverlay');
                        if (overlay) {
                            overlay.style.display = 'flex';
                        }
                        return;
                    }

                    // Check if there's a spool at the destination
                    const destSpoolIndex = threadSpools.findIndex(s => s.x === playerX && s.y === playerY);
                    if (destSpoolIndex !== -1) {
                        threadSpools.splice(destSpoolIndex, 1);
                        playerSpools++;
                        updateSpoolUI();
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
        }
        else {
            drawMaze();
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
        playerX = newX;
        playerY = newY;

        // Check if player stepped on a thread spool
        const spoolIdx = threadSpools.findIndex(s => s.x === playerX && s.y === playerY);
        if (spoolIdx !== -1) {
            threadSpools.splice(spoolIdx, 1);
            playerSpools++;
        }

        // Decrement compass steps if active
        if (compassStepsRemaining > 0) {
            compassStepsRemaining--;
        }

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

            // Check if there's a spool at the destination tile
            const destSpoolIdx = threadSpools.findIndex(s => s.x === playerX && s.y === playerY);
            if (destSpoolIdx !== -1) {
                threadSpools.splice(destSpoolIdx, 1);
                playerSpools++;
            }

            // Update visited tiles tracking
            const tileKey = `${playerX},${playerY}`;
            if (!visitedTiles.has(tileKey)) {
                visitedTiles.add(tileKey);
                document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
            }

            // Update minotaur path
            if (minotaurPath.length > 0 &&
                minotaurPath[minotaurPath.length - 1].x === playerX &&
                minotaurPath[minotaurPath.length - 1].y === playerY) {
                minotaurPath.pop();
            } else {
                minotaurPath.push({x: playerX, y: playerY});
            }

            // Show secret passage message
            showSecretPassageMessage();

            // Check if minotaur is at destination (lose condition)
            if (playerX === minotaurX && playerY === minotaurY) {
                gameLost = true;
                const overlay = document.getElementById('loseOverlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                    // Preserve existing textContent so #resetButton child element remains intact
                }
            }

            updateSpoolUI();
            drawMaze();
            return;
        }

        if (playerX === escapeX && playerY === escapeY) {
            gameWon = true;
            updateSpoolUI();
            const overlay = document.getElementById('winOverlay');
            overlay.textContent = 'You Escaped! Steps: ' + document.getElementById('stepCounter').textContent + ', Unique Tiles: ' + visitedTiles.size + ', Keys: ' + playerKeys;
            overlay.style.display = 'flex';
        }
        updateSpoolUI();
        drawMaze();
    }
}


// Add this to your initialization code
initMobileControls();

// Restart button on the defeat overlay reloads the game
document.getElementById('resetButton').addEventListener('click', () => {
    window.location.reload();
});
