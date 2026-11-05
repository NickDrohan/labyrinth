

function pushMinotaurBack(steps) {
  if (Array.isArray(minotaurPath) && minotaurPath.length > 0) {
    minotaurPath.splice(0, Math.min(steps, minotaurPath.length));
  }

  const visited = new Set();
  for (let i = 0; i < steps; i++) {
    let best = { x: minotaurX, y: minotaurY };
    let bestDist = -1;

    const candidates = [
      { x: minotaurX + 1, y: minotaurY },
      { x: minotaurX - 1, y: minotaurY },
      { x: minotaurX, y: minotaurY + 1 },
      { x: minotaurX, y: minotaurY - 1 }
    ];

    for (const nx of candidates) {
      if (nx.x < 0 || nx.x >= maze[0].length || nx.y < 0 || nx.y >= maze.length) continue;
      if (maze[nx.y][nx.x] !== 1) continue;
      if (nx.x === playerX && nx.y === playerY) continue;

      const key = nx.x + ',' + nx.y;
      if (visited.has(key)) continue;

      const dist = Math.abs(nx.x - playerX) + Math.abs(nx.y - playerY);
      if (dist > bestDist) {
        best = nx;
        bestDist = dist;
      }
    }

    if (bestDist === -1) break;

    minotaurX = best.x;
    minotaurY = best.y;
    visited.add(minotaurX + ',' + minotaurY);
    minotaurPath.unshift({ x: minotaurX, y: minotaurY });
  }

  if (minotaurX === playerX && minotaurY === playerY) {
    const adjacent = [
      { x: minotaurX + 1, y: minotaurY },
      { x: minotaurX - 1, y: minotaurY },
      { x: minotaurX, y: minotaurY + 1 },
      { x: minotaurX, y: minotaurY - 1 }
    ];
    for (const a of adjacent) {
      if (a.x < 0 || a.x >= maze[0].length || a.y < 0 || a.y >= maze.length) continue;
      if (maze[a.y][a.x] !== 1) continue;
      if (a.x === playerX && a.y === playerY) continue;
      minotaurX = a.x;
      minotaurY = a.y;
      break;
    }
  }

  if (!isDecoyLureActive()) {
    rebuildMinotaurPursuit();
  }
}


function computePathBetween(sx, sy, tx, ty) {
  if (!Array.isArray(maze) || maze.length === 0) return [];
  if (sx < 0 || sy < 0 || tx < 0 || ty < 0 || sy >= maze.length || ty >= maze.length || sx >= maze[0].length || tx >= maze[0].length) return [];
  if (maze[sy][sx] !== 1 || maze[ty][tx] !== 1) return [];
  if (sx === tx && sy === ty) return [];
  const H = maze.length, W = maze[0].length, total = W * H;
  if (!_pathParent || _pathParent.length !== total) {
    _pathParent = new Int32Array(total);
    _pathQueue = new Int32Array(total);
    _pathStamp = new Uint32Array(total);
    _pathGen = 0;
  }
  _pathGen++;
  if (_pathGen >= 0xffffffff) {
    _pathStamp.fill(0);
    _pathGen = 1;
  }
  const startIdx = sy * W + sx;
  const targetIdx = ty * W + tx;
  _pathStamp[startIdx] = _pathGen;
  _pathParent[startIdx] = -1;
  _pathQueue[0] = startIdx;
  let head = 0, tail = 1;
  while (head < tail) {
    const i = _pathQueue[head++];
    const x = i % W, y = (i / W) | 0;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (_pathStamp[ni] !== _pathGen && maze[ny] && maze[ny][nx] === 1) {
        _pathStamp[ni] = _pathGen;
        _pathParent[ni] = i;
        _pathQueue[tail++] = ni;
      }
    }
  }
  if (_pathStamp[targetIdx] !== _pathGen) return [];
  const path = [];
  let cur = targetIdx;
  while (cur !== startIdx) {
    path.push({ x: cur % W, y: (cur / W) | 0 });
    cur = _pathParent[cur];
  }
  path.reverse();
  return path;
}

function isDecoyLureActive() {
  return Boolean(activeDecoy && activeDecoy.steps > 0);
}

function rebuildMinotaurPursuit() {
  minotaurPath = (minotaurActive && minotaurX >= 0 && minotaurY >= 0) ? computePathBetween(minotaurX, minotaurY, playerX, playerY) : [];
}

function sanitizeMinotaurPath(){
  if(!minotaurActive||minotaurX<0||minotaurY<0||isDecoyLureActive()) return false;
  const n=minotaurPath[0]; if(!n) return false;
  const d=Math.abs(n.x-minotaurX)+Math.abs(n.y-minotaurY);
  const walk=!!(maze[n.y]&&maze[n.y][n.x]===1);
  const hop=secretPassages.some(p=>p.fromX===minotaurX&&p.fromY===minotaurY&&p.toX===n.x&&p.toY===n.y);
  if((d<=1&&walk)||hop) return false;
  rebuildMinotaurPursuit(); return true;
}

function shatterSirenDecoy(msg) {
  activeDecoy = null;
  window.activeDecoy = null;
  minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + DECOY_STUN_MS);
  decoyFlashUntil = Date.now() + 600;
  rebuildMinotaurPursuit();
  showBannerMessage(msg, 'rgba(210,40,130,0.95)');
  updateDecoyUI();
  updateShieldUI();
}

function onPlayerDecoyStep() {
  collectDecoyAt(playerX, playerY);
  if (isDecoyLureActive()) {
    activeDecoy.steps--;
    if (activeDecoy.steps <= 0) {
      activeDecoy = null;
      window.activeDecoy = null;
      rebuildMinotaurPursuit();
      showBannerMessage('Siren Decoy faded.', 'rgba(120,30,80,0.85)');
    }
  }
  updateDecoyUI();
}

function triggerSirenDecoy() {
  if (gameWon || gameLost || playerDecoys <= 0 || isDecoyLureActive()) return false;
  playerDecoys--;
  activeDecoy = { x: playerX, y: playerY, steps: DECOY_DURATION_STEPS };
  window.activeDecoy = activeDecoy;
  decoyFlashUntil = Date.now() + 600;
  if (minotaurActive && minotaurX >= 0 && minotaurY >= 0) {
    if (minotaurX === activeDecoy.x && minotaurY === activeDecoy.y) {
      shatterSirenDecoy('Siren Decoy shattered! Minotaur stunned for 5s!');
    } else {
      minotaurPath = computePathBetween(minotaurX, minotaurY, activeDecoy.x, activeDecoy.y);
      showBannerMessage('Siren Decoy deployed! Luring Minotaur for ' + DECOY_DURATION_STEPS + ' steps!', 'rgba(180,20,100,0.92)');
    }
  } else {
    showBannerMessage('Siren Decoy deployed! Luring Minotaur for ' + DECOY_DURATION_STEPS + ' steps!', 'rgba(180,20,100,0.92)');
  }
  updateDecoyUI();
  updateShieldUI();
  drawMaze();
  return true;
}

function advanceMinotaurLure() {
  if (!isDecoyLureActive() || !minotaurActive || minotaurX < 0 || minotaurY < 0 || gameWon || gameLost) {
    return { status: 'none', moved: false };
  }
  if (Date.now() < minotaurStunnedUntil) {
    return { status: 'stunned', moved: false };
  }
  if (minotaurX === activeDecoy.x && minotaurY === activeDecoy.y) {
    shatterSirenDecoy('Minotaur ensnared by Siren Decoy! Stunned for 5s!');
    drawMaze();
    return { status: 'shattered', moved: false };
  }

  const ok = (n) => Boolean(n && Math.abs(n.x - minotaurX) + Math.abs(n.y - minotaurY) === 1 && maze[n.y] && maze[n.y][n.x] === 1);

  if (!ok(minotaurPath[0])) {
    minotaurPath = computePathBetween(minotaurX, minotaurY, activeDecoy.x, activeDecoy.y);
  }

  let next = ok(minotaurPath[0]) ? minotaurPath.shift() : null;
  if (!next) {
    // Find a walkable neighbor that reduces Manhattan distance
    const neighbors = [
      {x: minotaurX + 1, y: minotaurY},
      {x: minotaurX - 1, y: minotaurY},
      {x: minotaurX, y: minotaurY + 1},
      {x: minotaurX, y: minotaurY - 1}
    ];
    const manhattan = (x, y) => Math.abs(x - activeDecoy.x) + Math.abs(y - activeDecoy.y);
    const currentDist = manhattan(minotaurX, minotaurY);
    for (const n of neighbors) {
      if (ok(n) && manhattan(n.x, n.y) < currentDist) {
        next = n;
        break;
      }
    }
  }

  if (!next) {
    updateShieldUI();
    drawMaze();
    return { status: 'blocked', moved: false };
  }

  minotaurX = next.x;
  minotaurY = next.y;

  if (minotaurX === playerX && minotaurY === playerY) {
    if (playerShields > 0) {
      triggerAegisRepel(true);
      updateDecoyUI();
      updateOwlUI();
      updateTridentUI();
      updateArrowUI();
      updateChariotUI();
      return { status: 'shielded', moved: true };
    } else {
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
      updateFlareUI();
      updateDecoyUI();
      updateOwlUI();
      updateTridentUI();
      updateArrowUI();
      updateChariotUI();
      const lo = document.getElementById('loseOverlay');
      if (lo) lo.style.display = 'flex';
      drawMaze();
      return { status: 'caught', moved: true };
    }
  }

  if (minotaurX === activeDecoy.x && minotaurY === activeDecoy.y) {
    shatterSirenDecoy('Minotaur ensnared by Siren Decoy! Stunned for 5s!');
    drawMaze();
    return { status: 'shattered', moved: true };
  }

  // Check if Minotaur stepped onto an active blazing trail
  if (chariotTrailStepsRemaining > 0 && Array.isArray(chariotTrail) && chariotTrail.some(t => t.x === minotaurX && t.y === minotaurY)) {
    minotaurStunnedUntil = Math.max(minotaurStunnedUntil, Date.now() + CHARIOT_STUN_MS);
    chariotTrailStepsRemaining = 0;
    chariotTrail = [];
    showBannerMessage('Minotaur scorched by Solar Chariot trail! Stunned for 5s!', 'rgba(220,100,10,0.92)');
    updateChariotUI();
    updateShieldUI();
    drawMaze();
    return { status: 'scorched', moved: true };
  }

  updateShieldUI();
  drawMaze();
  return { status: 'moved', moved: true };
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

    let qHead = 0;
    while (qHead < queue.length) {
        const {x, y, steps} = queue[qHead++];

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
                maze[ny][nx] === 1 && !bfsVisited.has(key)) {
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
        // Try to find any valid tile at least Manhattan distance 30 from player and not on escape tile
        for (let y = 0; y < maze.length && !spawnTile; y++) {
            for (let x = 0; x < maze[0].length && !spawnTile; x++) {
                if (maze[y][x] === 1 && !(x === playerX && y === playerY) && !(x === escapeX && y === escapeY)) {
                    if (Math.abs(x - playerX) + Math.abs(y - playerY) >= 30) {
                        spawnTile = {x, y};
                    }
                }
            }
        }
    }

    // Set Minotaur position
    if (spawnTile) {
        minotaurX = spawnTile.x;
        minotaurY = spawnTile.y;
        minotaurActive = true;
    } else {
        minotaurX = -1;
        minotaurY = -1;
        minotaurActive = false;
    }

    // Rebuild path from Minotaur to player using BFS with parent tracking
    minotaurPath = [];
    const pathVisited = new Set();
    pathVisited.add(`${minotaurX},${minotaurY}`);
    const pathQueue = [{x: minotaurX, y: minotaurY}];
    const parentMap = new Map();
    parentMap.set(`${minotaurX},${minotaurY}`, null);

    let pqHead = 0;
    while (pqHead < pathQueue.length) {
        const {x, y} = pathQueue[pqHead++];

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
                maze[ny][nx] === 1 && !pathVisited.has(key)) {
                pathVisited.add(key);
                pathQueue.push({x: nx, y: ny});
                parentMap.set(`${nx},${ny}`, {x, y});
            }
        }
    }

    // Invert so path goes from Minotaur toward player
    return minotaurPath.reverse();
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
