

function isTorchTile(x, y) {
  return torchPickups.some(t => t.x === x && t.y === y);
}

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
  if (Array.isArray(secretPassages)) {
    for (const p of secretPassages) {
      forbidden.add(`${p.fromX},${p.fromY}`);
      forbidden.add(`${p.toX},${p.toY}`);
    }
  }
  if (Array.isArray(aegisShrines)) {
    for (const a of aegisShrines) forbidden.add(`${a.x},${a.y}`);
  }
  if (Array.isArray(hermesShrines)) {
    for (const h of hermesShrines) forbidden.add(`${h.x},${h.y}`);
  }
  if (Array.isArray(chronosShrines)) {
    for (const c of chronosShrines) forbidden.add(`${c.x},${c.y}`);
  }
  if (Array.isArray(daedalusShrines)) {
    for (const d of daedalusShrines) forbidden.add(`${d.x},${d.y}`);
  }
  if (Array.isArray(icarusShrines)) {
    for (const ic of icarusShrines) forbidden.add(`${ic.x},${ic.y}`);
  }
  if (chronosAnchor) {
    forbidden.add(`${chronosAnchor.x},${chronosAnchor.y}`);
  }
  if (Array.isArray(orpheusShrines)) {
    for (const o of orpheusShrines) forbidden.add(`${o.x},${o.y}`);
  }
  if (Array.isArray(athenaShrines)) {
    for (const a of athenaShrines) forbidden.add(`${a.x},${a.y}`);
  }
  if (Array.isArray(poseidonShrines)) {
    for (const p of poseidonShrines) forbidden.add(`${p.x},${p.y}`);
  }
  if (Array.isArray(artemisShrines)) {
    for (const a of artemisShrines) forbidden.add(`${a.x},${a.y}`);
  }
  if (Array.isArray(apolloShrines)) {
    for (const ap of apolloShrines) forbidden.add(`${ap.x},${ap.y}`);
  }
  if (activeDecoy) {
    forbidden.add(`${activeDecoy.x},${activeDecoy.y}`);
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


function placeThreadSpools() {
  threadSpools.length = 0;
  window.threadSpools = threadSpools;
  const anchors = [
    { x: playerX, y: playerY },
    { x: escapeX, y: escapeY }
  ];
  for (const k of keys) anchors.push({ x: k.x, y: k.y });
  for (const g of gates) anchors.push({ x: g.x, y: g.y });
  for (const t of torchPickups) anchors.push({ x: t.x, y: t.y });
  for (const p of secretPassages) {
    anchors.push({ x: p.fromX, y: p.fromY });
    anchors.push({ x: p.toX, y: p.toY });
  }
  const H = maze.length, W = maze[0].length;
  const far = (x, y, list) => list.every(a => Math.abs(a.x - x) + Math.abs(a.y - y) >= 5);
  function tryPlace(count, minR, maxR, maxAttempts) {
    let attempts = 0;
    while (count > 0 && threadSpools.length < THREAD_SPOOL_COUNT && attempts < maxAttempts) {
      attempts++;
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      const x = playerX + dx;
      const y = playerY + dy;
      if (x < 0 || x >= W || y < 0 || y >= H || maze[y][x] !== 1) continue;
      if (!far(x, y, anchors) || !far(x, y, threadSpools)) continue;
      threadSpools.push({ x, y });
      count--;
    }
  }
  tryPlace(6, 8, 40, 5000);
  // Ensure at least 3 spools within Manhattan distance <= 40 of player start
  const minNear = 3;
  const nearCount = threadSpools.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 40).length;
  if (nearCount < minNear) {
    const H = maze.length, W = maze[0].length;
    const far = (x, y, list) => list.every(a => Math.abs(a.x - x) + Math.abs(a.y - y) >= 5);
    const candidates = [];
    for (let d = 5; d <= 40 && candidates.length < 3; d++) {
      for (let dx = -d; dx <= d && candidates.length < 3; dx++) {
        const dy = d - Math.abs(dx);
        for (const sd of [dy, -dy]) {
          const x = playerX + dx;
          const y = playerY + sd;
          if (x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, threadSpools) && far(x, y, candidates)) {
            candidates.push({ x, y });
          }
        }
      }
    }
    for (const c of candidates) {
      if (far(c.x, c.y, threadSpools)) {
        threadSpools.push(c);
      }
      if (threadSpools.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 40).length >= minNear) break;
    }
  }
  tryPlace(THREAD_SPOOL_COUNT, 8, 150, 20000);
  tryPlace(THREAD_SPOOL_COUNT, 5, W + H, 50000);
  if (threadSpools.length < 12) console.warn('threadSpools under minimum');
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
