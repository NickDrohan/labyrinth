

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

function placeAegisShrines() {
  aegisShrines.length = 0;
  window.aegisShrines = aegisShrines;

  const anchors = [
    { x: playerX, y: playerY },
    { x: escapeX, y: escapeY }
  ];
  for (const k of keys) {
    anchors.push({ x: k.x, y: k.y });
  }
  for (const g of gates) {
    anchors.push({ x: g.x, y: g.y });
  }
  for (const t of torchPickups) {
    anchors.push({ x: t.x, y: t.y });
  }
  for (const p of secretPassages) {
    anchors.push({ x: p.fromX, y: p.fromY });
    anchors.push({ x: p.toX, y: p.toY });
  }
  for (const s of threadSpools) {
    anchors.push({ x: s.x, y: s.y });
  }

  const H = maze.length, W = maze[0].length;

  const far = (x, y, list) => list.every(a => Math.abs(a.x - x) + Math.abs(a.y - y) >= 5);

  function tryPlaceShrines(count, minR, maxR, maxAttempts) {
    let attempts = 0;
    while (count > 0 && aegisShrines.length < AEGIS_SHRINE_COUNT && attempts < maxAttempts) {
      attempts++;
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      const x = playerX + dx;
      const y = playerY + dy;
      if (x < 0 || x >= maze[0].length || y < 0 || y >= maze.length || maze[y][x] !== 1) continue;
      if (!far(x, y, anchors)) continue;
      if (!far(x, y, aegisShrines)) continue;
      aegisShrines.push({ x, y });
      count--;
    }
  }

  tryPlaceShrines(5, 6, 35, 6000);
  // Ensure at least 3 shrines within Manhattan distance <= 35 of (playerX, playerY)
  if (aegisShrines.length < 3) {
    for (let d = 6; d <= 35 && aegisShrines.length < 3; d++) {
      for (let dx = -d; dx <= d && aegisShrines.length < 3; dx++) {
        const dy = d - Math.abs(dx);
        for (const sy of [playerY + dy, playerY - dy]) {
          const sx = playerX + dx;
          if (sx >= 0 && sx < maze[0].length && sy >= 0 && sy < maze.length && maze[sy][sx] === 1) {
            if (far(sx, sy, anchors) && far(sx, sy, aegisShrines)) {
              aegisShrines.push({ x: sx, y: sy });
            }
          }
        }
      }
    }
  }
  tryPlaceShrines(AEGIS_SHRINE_COUNT, 8, 160, 25000);
  tryPlaceShrines(AEGIS_SHRINE_COUNT, 5, maze[0].length + maze.length, 50000);
}

function placeHermesShrines() {
  hermesShrines.length = 0;
  window.hermesShrines = hermesShrines;
  const anchors = [
    { x: playerX, y: playerY },
    { x: escapeX, y: escapeY }
  ];
  if (Array.isArray(keys)) for (const k of keys) anchors.push({ x: k.x, y: k.y });
  if (Array.isArray(gates)) for (const g of gates) anchors.push({ x: g.x, y: g.y });
  if (Array.isArray(torchPickups)) for (const t of torchPickups) anchors.push({ x: t.x, y: t.y });
  if (Array.isArray(secretPassages)) {
    for (const s of secretPassages) {
      anchors.push({ x: s.fromX, y: s.fromY });
      anchors.push({ x: s.toX, y: s.toY });
    }
  }
  if (Array.isArray(threadSpools)) for (const t of threadSpools) anchors.push({ x: t.x, y: t.y });
  if (Array.isArray(aegisShrines)) for (const a of aegisShrines) anchors.push({ x: a.x, y: a.y });

  const far = (x, y, list) => {
    for (const p of list) {
      if (Math.abs(x - p.x) + Math.abs(y - p.y) < 5) return false;
    }
    return true;
  };

  const isPath = (x, y) => y >= 0 && y < maze.length && x >= 0 && x < maze[0].length && maze[y][x] === 1;

  // Random sampling: up to 5 shrines in radius 6..35 around (playerX, playerY)
  let attempts = 0;
  while (hermesShrines.length < 5 && attempts < 6000) {
    const d = Math.floor(Math.random() * 30) + 6; // 6..35
    const angle = Math.random() * Math.PI * 2;
    const cx = Math.round(playerX + d * Math.cos(angle));
    const cy = Math.round(playerY + d * Math.sin(angle));
    if (isPath(cx, cy) && far(cx, cy, anchors) && far(cx, cy, hermesShrines)) {
      hermesShrines.push({ x: cx, y: cy });
    }
    attempts++;
  }

  // Deterministic ring fallback: at least 3 shrines within Manhattan distance <= 35
  for (let d = 6; d <= 35 && hermesShrines.length < 12; d++) {
    const foundInRing = [];
    for (let x = playerX - d; x <= playerX + d && hermesShrines.length < 12; x++) {
      const y1 = playerY + (d - Math.abs(x - playerX));
      const y2 = playerY - (d - Math.abs(x - playerX));
      for (const cy of [y1, y2]) {
        if (cy >= 0 && cy < maze.length && x >= 0 && x < maze[0].length && isPath(x, cy) && far(x, cy, anchors) && far(x, cy, hermesShrines)) {
          hermesShrines.push({ x: x, y: cy });
        }
      }
    }
  }

  // Fill remaining shrines across radii 8..160 and full map via tryPlaceHermes
  // tryPlaceHermes is assumed available from prior systems
  function tryPlaceHermes(count, minR, maxR, maxAttempts) {
    for (let a = 0; a < maxAttempts && count > 0 && hermesShrines.length < HERMES_SHRINE_COUNT; a++) {
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      const x = playerX + dx;
      const y = playerY + dy;
      if (isPath(x, y) && far(x, y, anchors) && far(x, y, hermesShrines)) {
        hermesShrines.push({ x, y });
      }
    }
  }

  tryPlaceHermes(HERMES_SHRINE_COUNT - hermesShrines.length, 8, 160, 25000);
  tryPlaceHermes(HERMES_SHRINE_COUNT - hermesShrines.length, 5, maze[0].length + maze.length, 50000);
}

function placeChronosShrines() {
  chronosShrines.length = 0;
  window.chronosShrines = chronosShrines;
  const anchors = [
    { x: playerX, y: playerY },
    { x: escapeX, y: escapeY }
  ];
  for (const k of keys) anchors.push(k);
  for (const g of gates) anchors.push(g);
  for (const t of torchPickups) anchors.push(t);
  for (const p of secretPassages) {
    anchors.push({ x: p.fromX, y: p.fromY });
    anchors.push({ x: p.toX, y: p.toY });
  }
  for (const s of threadSpools) anchors.push(s);
  for (const a of aegisShrines) anchors.push(a);
  for (const h of hermesShrines) anchors.push(h);
  const H = maze.length;
  const W = maze[0].length;
  const far = (x, y, list) => list.every(a => Math.abs(a.x - x) + Math.abs(a.y - y) >= 5);
  const tryPlaceChronos = (count, minR, maxR, maxAttempts) => {
    let attempts = 0;
    while (count > 0 && chronosShrines.length < CHRONOS_SHRINE_COUNT && attempts < maxAttempts) {
      attempts++;
      const dx = Math.floor(Math.random() * (maxR * 2 + 1)) - maxR;
      const dy = Math.floor(Math.random() * (maxR * 2 + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      const x = playerX + dx;
      const y = playerY + dy;
      if (x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, chronosShrines)) {
        chronosShrines.push({ x, y });
        count--;
      }
    }
  };
  tryPlaceChronos(5, 6, 35, 6000);
  if (chronosShrines.length < 3) {
    for (let d = 6; d <= 35 && chronosShrines.length < 3; d++) {
      for (let dx = -d; dx <= d; dx++) {
        const dy = d - Math.abs(dx);
        const sx = playerX + dx;
        const sy = playerY + dy;
        if (sx >= 0 && sx < W && sy >= 0 && sy < H && maze[sy][sx] === 1 && far(sx, sy, anchors) && far(sx, sy, chronosShrines)) {
          chronosShrines.push({ x: sx, y: sy });
          break;
        }
        const sy2 = playerY - dy;
        if (sx >= 0 && sx < W && sy2 >= 0 && sy2 < H && maze[sy2][sx] === 1 && far(sx, sy2, anchors) && far(sx, sy2, chronosShrines)) {
          chronosShrines.push({ x: sx, y: sy2 });
          break;
        }
      }
    }
  }
  tryPlaceChronos(CHRONOS_SHRINE_COUNT, 8, 160, 25000);
  tryPlaceChronos(CHRONOS_SHRINE_COUNT, 5, W + H, 50000);
  window.chronosShrines = chronosShrines;
}

function placeDaedalusShrines() {
  daedalusShrines.length = 0;
  window.daedalusShrines = daedalusShrines;

  let anchors = [
    { x: playerX, y: playerY },
    { x: escapeX, y: escapeY }
  ];

  for (let k of keys) anchors.push(k);
  for (let g of gates) anchors.push(g);
  for (let t of torchPickups) anchors.push(t);
  for (let p of secretPassages) {
    anchors.push({ x: p.fromX, y: p.fromY });
    anchors.push({ x: p.toX, y: p.toY });
  }
  for (let s of threadSpools) anchors.push(s);
  for (let a of aegisShrines) anchors.push(a);
  for (let h of hermesShrines) anchors.push(h);
  for (let c of chronosShrines) anchors.push(c);

  const H = maze.length;
  const W = maze[0].length;
  const far = (x, y, list) => list.every(a => Math.abs(a.x - x) + Math.abs(a.y - y) >= 5);

  const canPlaceAt = (x, y) => 
    Boolean(
      y >= 0 && y < H &&
      x >= 0 && x < W &&
      Array.isArray(maze[y]) &&
      maze[y][x] === 1 &&
      far(x, y, anchors) &&
      far(x, y, daedalusShrines)
    );

  const tryPlaceDaedalus = (targetCount, minR, maxR, maxAttempts) => {
    let attempts = 0;
    while (daedalusShrines.length < targetCount && attempts < maxAttempts) {
      attempts++;
      const dx = Math.floor(Math.random() * (maxR * 2 + 1)) - maxR;
      const dy = Math.floor(Math.random() * (maxR * 2 + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md >= minR && md <= maxR && canPlaceAt(playerX + dx, playerY + dy)) {
        daedalusShrines.push({ x: playerX + dx, y: playerY + dy });
      }
    }
  };

  tryPlaceDaedalus(5, 6, 35, 6000);

  // Ensure at least 3 shrines within Manhattan distance 6..35 of player
  let count = daedalusShrines.filter(s => 
    Math.abs(s.x - playerX) + Math.abs(s.y - playerY) >= 6 && 
    Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 35
  ).length;

  if (count < 3) {
    for (let d = 6; d <= 35 && daedalusShrines.length < 3; d++) {
      for (let dx = -d; dx <= d && daedalusShrines.length < 3; dx++) {
        const sy1 = playerY + (d - Math.abs(dx));
        const sy2 = playerY - (d - Math.abs(dx));
        const sx = playerX + dx;
        if (canPlaceAt(sx, sy1)) {
          daedalusShrines.push({ x: sx, y: sy1 });
        }
        if (canPlaceAt(sx, sy2) && daedalusShrines.length < 3) {
          daedalusShrines.push({ x: sx, y: sy2 });
        }
      }
    }
  }

  tryPlaceDaedalus(DAEDALUS_SHRINE_COUNT, 8, 160, 25000);
  tryPlaceDaedalus(DAEDALUS_SHRINE_COUNT, 5, W + H, 50000);

  // Fill remaining shrines if needed
  if (daedalusShrines.length < DAEDALUS_SHRINE_COUNT) {
    for (let y = 0; y < H && daedalusShrines.length < DAEDALUS_SHRINE_COUNT; y++) {
      for (let x = 0; x < W && daedalusShrines.length < DAEDALUS_SHRINE_COUNT; x++) {
        if (canPlaceAt(x, y)) {
          daedalusShrines.push({ x, y });
        }
      }
    }
  }

  window.daedalusShrines = daedalusShrines;
}
function placeIcarusShrines() {
  icarusShrines.length = 0;
  window.icarusShrines = icarusShrines;

  const H = maze.length;
  const W = maze[0].length;

  // Build anchors list
  const anchors = [
    { x: playerX, y: playerY },
    { x: escapeX, y: escapeY }
  ];

  // Add keys
  for (const k of keys) {
    anchors.push({ x: k.x, y: k.y });
  }

  // Add gates
  for (const g of gates) {
    anchors.push({ x: g.x, y: g.y });
  }

  // Add torch pickups
  for (const t of torchPickups) {
    anchors.push({ x: t.x, y: t.y });
  }

  // Add secret passages
  for (const p of secretPassages) {
    anchors.push({ x: p.fromX, y: p.fromY });
    anchors.push({ x: p.toX, y: p.toY });
  }

  // Add thread spools
  for (const s of threadSpools) {
    anchors.push({ x: s.x, y: s.y });
  }

  // Add aegis shrines
  for (const s of aegisShrines) {
    anchors.push({ x: s.x, y: s.y });
  }

  // Add hermes shrines
  for (const s of hermesShrines) {
    anchors.push({ x: s.x, y: s.y });
  }

  // Add chronos shrines
  for (const s of chronosShrines) {
    anchors.push({ x: s.x, y: s.y });
  }

  // Add daedalus shrines
  for (const s of daedalusShrines) {
    anchors.push({ x: s.x, y: s.y });
  }

  // Helper to check Manhattan distance >= 5
  function far(x, y, list) {
    for (const a of list) {
      if (Math.abs(x - a.x) + Math.abs(y - a.y) < 5) {
        return false;
      }
    }
    return true;
  }

  // Helper to check if we can place at (x, y)
  function canPlaceAt(x, y) {
    return (
      0 <= x && x < W &&
      0 <= y && y < H &&
      maze[y][x] === 1 &&
      far(x, y, anchors) &&
      far(x, y, icarusShrines)
    );
  }

  // Try to place shrines with distance bias
  function tryPlaceIcarus(targetCount, minR, maxR, maxAttempts) {
    let attempts = 0;
    while (icarusShrines.length < targetCount && attempts < maxAttempts) {
      attempts++;
      const dx = Math.floor(Math.random() * (maxR * 2 + 1)) - maxR;
      const dy = Math.floor(Math.random() * (maxR * 2 + 1)) - maxR;
      if (Math.abs(dx) + Math.abs(dy) < minR) continue;
      const x = playerX + dx;
      const y = playerY + dy;
      if (canPlaceAt(x, y)) {
        icarusShrines.push({ x, y });
      }
    }
  }

  tryPlaceIcarus(5, 6, 35, 6000);

  // Deterministic fallback ensuring at least 3 shrines within Manhattan distance 6..35
  let placedCount = icarusShrines.length;
  if (placedCount < 3) {
    for (let d = 6; d <= 35; d++) {
      for (let dx = -d; dx <= d; dx++) {
        const dy = d - Math.abs(dx);
        const x = playerX + dx;
        const y = playerY + dy;
        if (canPlaceAt(x, y)) {
          icarusShrines.push({ x, y });
          placedCount++;
          if (placedCount >= 3) break;
        }
        const x2 = playerX + dx;
        const y2 = playerY - dy;
        if (canPlaceAt(x2, y2)) {
          icarusShrines.push({ x: x2, y: y2 });
          placedCount++;
          if (placedCount >= 3) break;
        }
      }
      if (placedCount >= 3) break;
    }
  }

  // Place more shrines with different parameters
  tryPlaceIcarus(ICARUS_SHRINE_COUNT, 8, 160, 25000);

  // Final fallback with wider search
  tryPlaceIcarus(ICARUS_SHRINE_COUNT, 5, W + H, 50000);

  // Full grid fallback scan if needed
  if (icarusShrines.length < 12) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (canPlaceAt(x, y)) {
          icarusShrines.push({ x, y });
          if (icarusShrines.length >= 12) break;
        }
      }
      if (icarusShrines.length >= 12) break;
    }
  }

  // Ensure we have at least 12 shrines
  if (icarusShrines.length < 12) {
    for (let y = 0; y < H && icarusShrines.length < 12; y++) {
      for (let x = 0; x < W && icarusShrines.length < 12; x++) {
        if (canPlaceAt(x, y)) {
          icarusShrines.push({ x, y });
        }
      }
    }
  }
}

function placeOrpheusShrines() {
  orpheusShrines.length = 0;
  window.orpheusShrines = orpheusShrines;
  const anchors = [
    { x: playerX, y: playerY },
    { x: escapeX, y: escapeY }
  ];
  function pushKeys(arr) {
    if (Array.isArray(arr)) arr.forEach(p => { anchors.push({ x: p.x, y: p.y }); });
  }
  pushKeys(keys);
  pushKeys(gates);
  pushKeys(torchPickups);
  if (secretPassages) {
    secretPassages.forEach(p => { anchors.push({ x: p.fromX, y: p.fromY }); anchors.push({ x: p.toX, y: p.toY }); });
  }
  pushKeys(threadSpools);
  pushKeys(aegisShrines);
  pushKeys(hermesShrines);
  pushKeys(chronosShrines);
  pushKeys(daedalusShrines);
  pushKeys(icarusShrines);
  const H = maze.length, W = maze[0].length;
  function far(x, y, list) {
    return list.every(a => Math.abs(x - a.x) + Math.abs(y - a.y) >= 5);
  }
  function canPlaceAt(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, orpheusShrines);
  }
  function tryPlaceOrpheus(targetCount, minR, maxR, maxAttempts) {
    for (let attempts = 0; orpheusShrines.length < targetCount && attempts < maxAttempts; attempts++) {
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      if (canPlaceAt(playerX + dx, playerY + dy)) {
        orpheusShrines.push({ x: playerX + dx, y: playerY + dy });
      }
    }
  }
  tryPlaceOrpheus(5, 6, 35, 6000);
  let nearCount = orpheusShrines.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 35).length;
  if (nearCount < 3) {
    for (let d = 6; d <= 35 && nearCount < 3; d++) {
      for (let dx = -d; dx <= d && nearCount < 3; dx++) {
        const dy = d - Math.abs(dx);
        const ys = dy === 0 ? [playerY] : [playerY + dy, playerY - dy];
        for (const cy of ys) {
          if (canPlaceAt(playerX + dx, cy)) {
            orpheusShrines.push({ x: playerX + dx, y: cy });
            nearCount++;
          }
          if (nearCount >= 3) break;
        }
      }
    }
  }
  tryPlaceOrpheus(ORPHEUS_SHRINE_COUNT, 8, 160, 25000);
  tryPlaceOrpheus(ORPHEUS_SHRINE_COUNT, 5, W + H, 50000);
  if (orpheusShrines.length < 12) {
    for (let y = 0; y < H && orpheusShrines.length < 12; y++) {
      for (let x = 0; x < W && orpheusShrines.length < 12; x++) {
        if (canPlaceAt(x, y)) orpheusShrines.push({ x, y });
      }
    }
  }
  window.orpheusShrines = orpheusShrines;
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
