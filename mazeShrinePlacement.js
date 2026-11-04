

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
