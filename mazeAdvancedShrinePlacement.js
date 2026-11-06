
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

function placeAthenaShrines() {
  // 1. Clear athenaShrines and assign to window
  athenaShrines.length = 0;
  window.athenaShrines = athenaShrines;

  // 2. Build anchors array
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
  pushKeys(orpheusShrines);

  // 3. Define H and W
  const H = maze.length;
  const W = maze[0].length;

  // 4. Define far(x, y, list)
  function far(x, y, list) {
    return list.every(a => Math.abs(x - a.x) + Math.abs(y - a.y) >= 5);
  }

  // 5. Define canPlaceAt(x, y)
  function canPlaceAt(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, athenaShrines);
  }

  // 6. Define tryPlaceAthena(targetCount, minR, maxR, maxAttempts)
  function tryPlaceAthena(targetCount, minR, maxR, maxAttempts) {
    for (let attempts = 0; attempts < maxAttempts && athenaShrines.length < targetCount; attempts++) {
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      if (canPlaceAt(playerX + dx, playerY + dy)) {
        athenaShrines.push({ x: playerX + dx, y: playerY + dy });
      }
    }
  }

  // 7. Call tryPlaceAthena(5, 6, 35, 6000)
  tryPlaceAthena(5, 6, 35, 6000);

  // 8. Count near shrines and deterministic ring scan
  let nearCount = athenaShrines.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 35).length;
  if (nearCount < 3) {
    for (let d = 6; d <= 35 && nearCount < 3; d++) {
      for (let dx = -d; dx <= d && nearCount < 3; dx++) {
        const dy = d - Math.abs(dx);
        const ys = dy === 0 ? [playerY] : [playerY + dy, playerY - dy];
        for (const cy of ys) {
          if (canPlaceAt(playerX + dx, cy)) {
            athenaShrines.push({ x: playerX + dx, y: cy });
            nearCount++;
          }
          if (nearCount >= 3) break;
        }
      }
    }
  }

  // 9. Call tryPlaceAthena(ATHENA_SHRINE_COUNT, 8, 160, 25000) and (5, W + H, 50000)
  tryPlaceAthena(ATHENA_SHRINE_COUNT, 8, 160, 25000);
  tryPlaceAthena(ATHENA_SHRINE_COUNT, 5, W + H, 50000);

  // 10. Row-major fallback for at least 12 shrines
  if (athenaShrines.length < 12) {
    for (let y = 0; y < H && athenaShrines.length < 12; y++) {
      for (let x = 0; x < W && athenaShrines.length < 12; x++) {
        if (canPlaceAt(x, y)) athenaShrines.push({ x, y });
      }
    }
  }

  // 11. Assign to window
  window.athenaShrines = athenaShrines;
}

function placePoseidonShrines() {
  // 1. Clear poseidonShrines and assign to window
  poseidonShrines.length = 0;
  window.poseidonShrines = poseidonShrines;

  // 2. Build anchors array
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
  pushKeys(orpheusShrines);
  pushKeys(athenaShrines);

  // 3. Define H and W
  const H = maze.length;
  const W = maze[0].length;

  // 4. Define far(x, y, list)
  function far(x, y, list) {
    return list.every(a => Math.abs(x - a.x) + Math.abs(y - a.y) >= 5);
  }

  // 5. Define canPlaceAt(x, y)
  function canPlaceAt(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, poseidonShrines);
  }

  // 6. Define tryPlacePoseidon(targetCount, minR, maxR, maxAttempts)
  function tryPlacePoseidon(targetCount, minR, maxR, maxAttempts) {
    for (let attempts = 0; attempts < maxAttempts && poseidonShrines.length < targetCount; attempts++) {
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      if (canPlaceAt(playerX + dx, playerY + dy)) {
        poseidonShrines.push({ x: playerX + dx, y: playerY + dy });
      }
    }
  }

  // 7. Call tryPlacePoseidon(5, 6, 35, 6000)
  tryPlacePoseidon(5, 6, 35, 6000);

  // 8. Count near shrines and deterministic ring scan
  let nearCount = poseidonShrines.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 35).length;
  if (nearCount < 3) {
    for (let d = 6; d <= 35 && nearCount < 3; d++) {
      for (let dx = -d; dx <= d && nearCount < 3; dx++) {
        const dy = d - Math.abs(dx);
        const ys = dy === 0 ? [playerY] : [playerY + dy, playerY - dy];
        for (const cy of ys) {
          if (canPlaceAt(playerX + dx, cy)) {
            poseidonShrines.push({ x: playerX + dx, y: cy });
            nearCount++;
          }
          if (nearCount >= 3) break;
        }
      }
    }
  }

  // 9. Call tryPlacePoseidon(POSEIDON_SHRINE_COUNT, 8, 160, 25000) and (5, W + H, 50000)
  tryPlacePoseidon(POSEIDON_SHRINE_COUNT, 8, 160, 25000);
  tryPlacePoseidon(POSEIDON_SHRINE_COUNT, 5, W + H, 50000);

  // 10. Row-major fallback for at least 12 shrines
  if (poseidonShrines.length < 12) {
    for (let y = 0; y < H && poseidonShrines.length < 12; y++) {
      for (let x = 0; x < W && poseidonShrines.length < 12; x++) {
        if (canPlaceAt(x, y)) poseidonShrines.push({ x, y });
      }
    }
  }

  // 11. Assign to window
  window.poseidonShrines = poseidonShrines;
}

function placeArtemisShrines() {
  // 1. Clear artemisShrines and assign to window
  artemisShrines.length = 0;
  window.artemisShrines = artemisShrines;

  // 2. Build anchors array
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
  pushKeys(orpheusShrines);
  pushKeys(athenaShrines);
  pushKeys(poseidonShrines);

  // 3. Define H and W
  const H = maze.length;
  const W = maze[0].length;

  // 4. Define far(x, y, list)
  function far(x, y, list) {
    return list.every(a => Math.abs(x - a.x) + Math.abs(y - a.y) >= 5);
  }

  // 5. Define canPlaceAt(x, y)
  function canPlaceAt(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, artemisShrines);
  }

  // 6. Define tryPlaceArtemis(targetCount, minR, maxR, maxAttempts)
  function tryPlaceArtemis(targetCount, minR, maxR, maxAttempts) {
    for (let attempts = 0; attempts < maxAttempts && artemisShrines.length < targetCount; attempts++) {
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      if (canPlaceAt(playerX + dx, playerY + dy)) {
        artemisShrines.push({ x: playerX + dx, y: playerY + dy });
      }
    }
  }

  // 7. Call tryPlaceArtemis(5, 6, 35, 6000)
  tryPlaceArtemis(5, 6, 35, 6000);

  // 8. Count near shrines and deterministic ring scan
  let nearCount = artemisShrines.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 35).length;
  if (nearCount < 3) {
    for (let d = 6; d <= 35 && nearCount < 3; d++) {
      for (let dx = -d; dx <= d && nearCount < 3; dx++) {
        const dy = d - Math.abs(dx);
        const ys = dy === 0 ? [playerY] : [playerY + dy, playerY - dy];
        for (const cy of ys) {
          if (canPlaceAt(playerX + dx, cy)) {
            artemisShrines.push({ x: playerX + dx, y: cy });
            nearCount++;
          }
          if (nearCount >= 3) break;
        }
      }
    }
  }

  // 10. tryPlaceArtemis(ARTEMIS_SHRINE_COUNT, 8, 160, 25000)
  tryPlaceArtemis(ARTEMIS_SHRINE_COUNT, 8, 160, 25000);

  // 11. tryPlaceArtemis(ARTEMIS_SHRINE_COUNT, 5, W + H, 50000)
  tryPlaceArtemis(ARTEMIS_SHRINE_COUNT, 5, W + H, 50000);

  // 12. Row-major fallback ensuring artemisShrines.length >= 12
  if (artemisShrines.length < 12) {
    for (let y = 0; y < H && artemisShrines.length < 12; y++) {
      for (let x = 0; x < W && artemisShrines.length < 12; x++) {
        if (canPlaceAt(x, y)) artemisShrines.push({ x, y });
      }
    }
  }

  // 13. Assign to window
  window.artemisShrines = artemisShrines;
}

function placeApolloShrines() {
  // 1. Clear apolloShrines and assign to window
  apolloShrines.length = 0;
  window.apolloShrines = apolloShrines;

  // 2. Build anchors array
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
  pushKeys(orpheusShrines);
  pushKeys(athenaShrines);
  pushKeys(poseidonShrines);
  pushKeys(artemisShrines);

  // 3. Define H and W
  const H = maze.length;
  const W = maze[0].length;

  // 4. Define far(x, y, list)
  function far(x, y, list) {
    return list.every(a => Math.abs(x - a.x) + Math.abs(y - a.y) >= 5);
  }

  // 5. Define canPlaceAt(x, y)
  function canPlaceAt(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, apolloShrines);
  }

  // 6. Define tryPlaceApollo(targetCount, minR, maxR, maxAttempts)
  function tryPlaceApollo(targetCount, minR, maxR, maxAttempts) {
    for (let attempts = 0; attempts < maxAttempts && apolloShrines.length < targetCount; attempts++) {
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      if (canPlaceAt(playerX + dx, playerY + dy)) {
        apolloShrines.push({ x: playerX + dx, y: playerY + dy });
      }
    }
  }

  // 7. Call tryPlaceApollo(5, 6, 35, 6000)
  tryPlaceApollo(5, 6, 35, 6000);

  // 8. Count near shrines and deterministic ring scan
  let nearCount = apolloShrines.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 35).length;
  if (nearCount < 3) {
    for (let d = 6; d <= 35 && nearCount < 3; d++) {
      for (let dx = -d; dx <= d && nearCount < 3; dx++) {
        const dy = d - Math.abs(dx);
        const ys = dy === 0 ? [playerY] : [playerY + dy, playerY - dy];
        for (const cy of ys) {
          if (canPlaceAt(playerX + dx, cy)) {
            apolloShrines.push({ x: playerX + dx, y: cy });
            nearCount++;
          }
          if (nearCount >= 3) break;
        }
      }
    }
  }

  // 10. tryPlaceApollo(APOLLO_SHRINE_COUNT, 8, 160, 25000)
  tryPlaceApollo(APOLLO_SHRINE_COUNT, 8, 160, 25000);

  // 11. tryPlaceApollo(APOLLO_SHRINE_COUNT, 5, W + H, 50000)
  tryPlaceApollo(APOLLO_SHRINE_COUNT, 5, W + H, 50000);

  // 12. Row-major fallback ensuring apolloShrines.length >= 12
  if (apolloShrines.length < 12) {
    for (let y = 0; y < H && apolloShrines.length < 12; y++) {
      for (let x = 0; x < W && apolloShrines.length < 12; x++) {
        if (canPlaceAt(x, y)) apolloShrines.push({ x, y });
      }
    }
  }

  // 13. Assign to window
  window.apolloShrines = apolloShrines;
}

function placeHephaestusShrines() {
  // 1. Clear hephaestusShrines and assign to window
  hephaestusShrines.length = 0;
  window.hephaestusShrines = hephaestusShrines;

  // 2. Build anchors array
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
  pushKeys(orpheusShrines);
  pushKeys(athenaShrines);
  pushKeys(poseidonShrines);
  pushKeys(artemisShrines);
  pushKeys(apolloShrines);

  // 3. Define H and W
  const H = maze.length;
  const W = maze[0].length;

  // 4. Define far(x, y, list)
  function far(x, y, list) {
    return list.every(a => Math.abs(x - a.x) + Math.abs(y - a.y) >= 5);
  }

  // 5. Define canPlaceAt(x, y)
  function canPlaceAt(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H && maze[y][x] === 1 && far(x, y, anchors) && far(x, y, hephaestusShrines);
  }

  // 6. Define tryPlaceHephaestus(targetCount, minR, maxR, maxAttempts)
  function tryPlaceHephaestus(targetCount, minR, maxR, maxAttempts) {
    for (let attempts = 0; attempts < maxAttempts && hephaestusShrines.length < targetCount; attempts++) {
      const dx = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const dy = Math.floor(Math.random() * (2 * maxR + 1)) - maxR;
      const md = Math.abs(dx) + Math.abs(dy);
      if (md < minR || md > maxR) continue;
      if (canPlaceAt(playerX + dx, playerY + dy)) {
        hephaestusShrines.push({ x: playerX + dx, y: playerY + dy });
      }
    }
  }

  // 7. Call tryPlaceHephaestus(5, 6, 35, 6000)
  tryPlaceHephaestus(5, 6, 35, 6000);

  // 8. Count near shrines and deterministic ring scan
  let nearCount = hephaestusShrines.filter(s => Math.abs(s.x - playerX) + Math.abs(s.y - playerY) <= 35).length;
  if (nearCount < 3) {
    for (let d = 6; d <= 35 && nearCount < 3; d++) {
      for (let dx = -d; dx <= d && nearCount < 3; dx++) {
        const dy = d - Math.abs(dx);
        const ys = dy === 0 ? [playerY] : [playerY + dy, playerY - dy];
        for (const cy of ys) {
          if (canPlaceAt(playerX + dx, cy)) {
            hephaestusShrines.push({ x: playerX + dx, y: cy });
            nearCount++;
          }
          if (nearCount >= 3) break;
        }
      }
    }
  }

  // 9. tryPlaceHephaestus(HEPHAESTUS_SHRINE_COUNT, 8, 160, 25000)
  tryPlaceHephaestus(HEPHAESTUS_SHRINE_COUNT, 8, 160, 25000);

  // 10. tryPlaceHephaestus(HEPHAESTUS_SHRINE_COUNT, 5, W + H, 50000)
  tryPlaceHephaestus(HEPHAESTUS_SHRINE_COUNT, 5, W + H, 50000);

  // 11. Row-major fallback ensuring hephaestusShrines.length >= 12
  if (hephaestusShrines.length < 12) {
    for (let y = 0; y < H && hephaestusShrines.length < 12; y++) {
      for (let x = 0; x < W && hephaestusShrines.length < 12; x++) {
        if (canPlaceAt(x, y)) hephaestusShrines.push({ x, y });
      }
    }
  }

  // 12. Assign to window
  window.hephaestusShrines = hephaestusShrines;
}
