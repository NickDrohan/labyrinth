

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
                const baseRadius = torchActive ? TORCH_RADIUS_BOOSTED : TORCH_RADIUS_NORMAL;
                const effectiveRadius = solarFlareStepsRemaining > 0 ? Math.max(baseRadius, SOLAR_FLARE_RADIUS) : baseRadius;
                const inDecoyVision = isDecoyLureActive() && Math.hypot(mazeX - activeDecoy.x, mazeY - activeDecoy.y) <= DECOY_VISION_RADIUS;
                const inArrowVision = arrowVisionStepsRemaining > 0 && Array.isArray(arrowTrail) && arrowTrail.some(t => Math.abs(mazeX - t.x) + Math.abs(mazeY - t.y) <= 2);
                if (distToPlayer > effectiveRadius && !inDecoyVision && !inArrowVision) {
                    // Darken out-of-radius tiles
                    mazeGraphics.beginFill(0x001f3f, 0.3);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();
                    continue;
                }

                // Draw path tiles
                if (maze[mazeY][mazeX] === 1) {
                    // Draw base path tile first
                    mazeGraphics.beginFill(0x00bfff, 1);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();

                    // Solar Flare rim tint (subtle, only on visible path tiles)
                    if (solarFlareStepsRemaining > 0) {
                        mazeGraphics.beginFill(0xffe066, 0.14);
                        mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                        mazeGraphics.endFill();
                    }

                    if (inDecoyVision) {
                        mazeGraphics.beginFill(0xff66b2, 0.14);
                        mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                        mazeGraphics.endFill();
                    }

                    // Draw breached tiles with warm copper/orange rubble marks on top
                    if (breachedTiles.some(b => b.x === mazeX && b.y === mazeY)) {
                        mazeGraphics.beginFill(0xcc5522, 0.65);
                        
                        // Draw 3 small rectangles/circles inside the tile
                        mazeGraphics.drawRoundedRect(x * tileSize + tileSize / 4, y * tileSize + tileSize / 4, tileSize / 6, tileSize / 6, 2);
                        mazeGraphics.drawRoundedRect(x * tileSize + tileSize * 3/4 - tileSize / 6, y * tileSize + tileSize / 4, tileSize / 6, tileSize / 6, 2);
                        mazeGraphics.drawRoundedRect(x * tileSize + tileSize / 4, y * tileSize + tileSize * 3/4 - tileSize / 6, tileSize / 6, tileSize / 6, 2);
                        
                        mazeGraphics.endFill();
                    }

                    // Draw golden breadcrumb trail on visited tiles (excluding player, escape, keys, gates, torches, spools, passages, aegis shrines, hermes shrines, chronos shrines, daedalus shrines, chronos anchor, and uncollected Icarus shrines, and uncollected Athena shrines)
                    if (visitedTiles.has(`${mazeX},${mazeY}`) && !(mazeX === playerX && mazeY === playerY) && !(mazeX === escapeX && mazeY === escapeY) && !keys.some(k => k.x === mazeX && k.y === mazeY) && !gates.some(g => g.x === mazeX && g.y === mazeY) && !isTorchTile(mazeX, mazeY) && !threadSpools.some(s => s.x === mazeX && s.y === mazeY) && !secretPassages.some(p => p.fromX === mazeX && p.fromY === mazeY) && !aegisShrines.some(a => a.x === mazeX && a.y === mazeY) && !hermesShrines.some(h => h.x === mazeX && h.y === mazeY) && !chronosShrines.some(c => c.x === mazeX && c.y === mazeY) && !daedalusShrines.some(d => d.x === mazeX && d.y === mazeY) && !(chronosAnchor && chronosAnchor.x === mazeX && chronosAnchor.y === mazeY) && !icarusShrines.some(ic => ic.x === mazeX && ic.y === mazeY) && !orpheusShrines.some(o => o.x === mazeX && o.y === mazeY) && !(isDecoyLureActive() && activeDecoy.x === mazeX && activeDecoy.y === mazeY) && !athenaShrines.some(a => a.x === mazeX && a.y === mazeY) && !(Array.isArray(poseidonShrines) && poseidonShrines.some(p => p.x === mazeX && p.y === mazeY)) && !(Array.isArray(artemisShrines) && artemisShrines.some(a => a.x === mazeX && a.y === mazeY))) {
                        mazeGraphics.beginFill(0xffd700, 0.65);
                        mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 6);
                        mazeGraphics.endFill();
                    }

                    // Draw inArrowVision tint on tiles within vision radius
                    if (inArrowVision) {
                        mazeGraphics.beginFill(0x99ffcc, 0.16);
                        mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                        mazeGraphics.endFill();
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

                // Draw thread spool pickups
                if (threadSpools.some(s => s.x === mazeX && s.y === mazeY)) {
                    mazeGraphics.beginFill(0x00e5ff, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 3);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xffffff, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 6);
                    mazeGraphics.endFill();
                }

                // Draw Aegis Shrine pickups
                if (aegisShrines.some(a => a.x === mazeX && a.y === mazeY)) {
                    mazeGraphics.beginFill(0x00ff88, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 2.6);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xccffee, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 5);
                    mazeGraphics.endFill();
                }

                // Draw Hermes Winged Sandals shrines
                if (hermesShrines.some(h => h.x === mazeX && h.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    mazeGraphics.beginFill(0xffaa00, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.38);
                    mazeGraphics.endFill();
                    // Draw winged sandals
                    mazeGraphics.beginFill(0xffdd55, 1);
                    mazeGraphics.drawRoundedRect(cx - tileSize * 0.25, cy - tileSize * 0.15, tileSize * 0.5, tileSize * 0.1, 2);
                    mazeGraphics.drawRoundedRect(cx - tileSize * 0.15, cy - tileSize * 0.3, tileSize * 0.3, tileSize * 0.15, 2);
                    mazeGraphics.endFill();
                }

                // Draw Chronos Shrines
                if (chronosShrines.some(c => c.x === mazeX && c.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    mazeGraphics.beginFill(0x00ffff, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.38);
                    mazeGraphics.endFill();
                    // Draw hourglass
                    mazeGraphics.beginFill(0x0088ff, 1);
                    mazeGraphics.drawRoundedRect(cx - tileSize * 0.2, cy - tileSize * 0.3, tileSize * 0.4, tileSize * 0.6, 2);
                    mazeGraphics.moveTo(cx - tileSize * 0.2, cy - tileSize * 0.3);
                    mazeGraphics.lineTo(cx + tileSize * 0.2, cy - tileSize * 0.3);
                    mazeGraphics.lineTo(cx, cy - tileSize * 0.1);
                    mazeGraphics.closePath();
                    mazeGraphics.moveTo(cx - tileSize * 0.2, cy + tileSize * 0.3);
                    mazeGraphics.lineTo(cx + tileSize * 0.2, cy + tileSize * 0.3);
                    mazeGraphics.lineTo(cx, cy + tileSize * 0.1);
                    mazeGraphics.closePath();
                    mazeGraphics.endFill();
                }

                // Draw Daedalus Anvil Shrines
                if (daedalusShrines.some(d => d.x === mazeX && d.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    // Outer circle
                    mazeGraphics.beginFill(0xff4422, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.38);
                    mazeGraphics.endFill();
                    // Inner anvil T-shape
                    mazeGraphics.beginFill(0xffbb66, 1);
                    mazeGraphics.drawRect(cx - 5, cy - 4, 10, 4);
                    mazeGraphics.drawRect(cx - 2, cy, 4, 5);
                    mazeGraphics.endFill();
                }

                // Icarus Sun Crystals
                if (icarusShrines.some(ic => ic.x === mazeX && ic.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    // Outer diamond
                    mazeGraphics.beginFill(0xffaa00, 0.95);
                    mazeGraphics.moveTo(cx, cy - tileSize * 0.42);
                    mazeGraphics.lineTo(cx + tileSize * 0.42, cy);
                    mazeGraphics.lineTo(cx, cy + tileSize * 0.42);
                    mazeGraphics.lineTo(cx - tileSize * 0.42, cy);
                    mazeGraphics.closePath();
                    // Rotated inner square
                    mazeGraphics.beginFill(0xffdd44, 1);
                    mazeGraphics.drawRect(cx - tileSize * 0.24, cy - tileSize * 0.24, tileSize * 0.48, tileSize * 0.48);
                    // Bright center core
                    mazeGraphics.beginFill(0xffffff, 1);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.12);
                    mazeGraphics.endFill();
                }

                // Orpheus Lyre shrines
                if (orpheusShrines.some(o => o.x === mazeX && o.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    mazeGraphics.beginFill(0xff3399, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.36);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xffdf66, 1);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.2);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xffffff, 1);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.09);
                    mazeGraphics.endFill();
                }

                // Athena Owl shrines
                if (athenaShrines.some(a => a.x === mazeX && a.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    mazeGraphics.beginFill(0x2266cc, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.38);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xffdd44, 1);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.2);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xffffff, 1);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.09);
                    mazeGraphics.endFill();
                }

                // Poseidon Trident shrines
                if (Array.isArray(poseidonShrines) && poseidonShrines.some(p => p.x === mazeX && p.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    mazeGraphics.beginFill(0x00ffd5, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.38);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0x0b3b3c, 1);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.24);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xffffff, 1);
                    mazeGraphics.drawRect(cx - 4, cy - 4, 1.5, 5);
                    mazeGraphics.drawRect(cx - 0.75, cy - 5, 1.5, 6);
                    mazeGraphics.drawRect(cx + 2.5, cy - 4, 1.5, 5);
                    mazeGraphics.drawRect(cx - 4, cy, 8, 1.5);
                    mazeGraphics.drawRect(cx - 0.75, cy + 1, 1.5, 4);
                    mazeGraphics.endFill();
                }

                // Artemis Silver Bow shrines
                if (Array.isArray(artemisShrines) && artemisShrines.some(a => a.x === mazeX && a.y === mazeY)) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    mazeGraphics.beginFill(0x22cc88, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.38);
                    mazeGraphics.endFill();
                    mazeGraphics.lineStyle(2, 0xe0fff4, 1);
                    mazeGraphics.moveTo(cx - 1 + Math.cos(-Math.PI * 0.45) * (tileSize * 0.22), cy + Math.sin(-Math.PI * 0.45) * (tileSize * 0.22));
                    mazeGraphics.arc(cx - 1, cy, tileSize * 0.22, -Math.PI * 0.45, Math.PI * 0.45);
                    mazeGraphics.moveTo(cx - 4, cy);
                    mazeGraphics.lineTo(cx + 4, cy);
                    mazeGraphics.lineStyle(0);
                }

                // Secret passage portals
                if (secretPassages.some(p => p.fromX === mazeX && p.fromY === mazeY)) {
                    mazeGraphics.beginFill(0x8000ff, 0.85);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 2.2);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xe0b3ff, 0.9);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 4);
                    mazeGraphics.endFill();
                }

                // Chronos waypoint anchor
                if (chronosAnchor && chronosAnchor.x === mazeX && chronosAnchor.y === mazeY) {
                    const cx = x * tileSize + tileSize / 2;
                    const cy = y * tileSize + tileSize / 2;
                    mazeGraphics.lineStyle(2, 0xd580ff, 0.95);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.42);
                    mazeGraphics.lineStyle(0);
                    mazeGraphics.beginFill(0xffea79, 0.9);
                    mazeGraphics.drawCircle(cx, cy, tileSize * 0.18);
                    mazeGraphics.endFill();
                }

                // Player tile
                if (mazeX === playerX && mazeY === playerY) {
                    mazeGraphics.beginFill(0xff0000, 1);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();
                }
            }
        }
    }

    // Compute player screen center coordinates
    const playerScreenCenterX = (playerX - startX) * tileSize + tileSize / 2;
    const playerScreenCenterY = (playerY - startY) * tileSize + tileSize / 2;

    // Draw breach flash shockwave ring
    if (Date.now() < breachFlashUntil) {
        mazeGraphics.lineStyle(3, 0xff5522, 0.9);
        mazeGraphics.drawCircle(playerScreenCenterX, playerScreenCenterY, tileSize * 1.45);
        mazeGraphics.lineStyle(0);
    }

    // Draw solar flare flash ring
    if (Date.now() < solarFlareFlashUntil) {
        mazeGraphics.lineStyle(3, 0xffe066, 0.95);
        mazeGraphics.drawCircle(playerScreenCenterX, playerScreenCenterY, tileSize * 1.65);
        mazeGraphics.lineStyle(0);
    }

    // Draw compass pointer
    if (compassStepsRemaining > 0 && !gameWon && (escapeX !== playerX || escapeY !== playerY)) {
        const a = Math.atan2(escapeY - playerY, escapeX - playerX);
        const cx = (playerX - startX) * tileSize + tileSize / 2;
        const cy = (playerY - startY) * tileSize + tileSize / 2;
        const L = tileSize * 1.5;
        const tx = cx + Math.cos(a) * L;
        const ty = cy + Math.sin(a) * L;
        const h = tileSize * 0.5;
        mazeGraphics.lineStyle(3, 0x00e5ff, 1);
        mazeGraphics.moveTo(cx, cy);
        mazeGraphics.lineTo(tx, ty);
        mazeGraphics.lineStyle(0);
        mazeGraphics.beginFill(0xffd700, 1);
        mazeGraphics.moveTo(tx, ty);
        mazeGraphics.lineTo(tx - h * Math.cos(a - Math.PI / 6), ty - h * Math.sin(a - Math.PI / 6));
        mazeGraphics.lineTo(tx - h * Math.cos(a + Math.PI / 6), ty - h * Math.sin(a + Math.PI / 6));
        mazeGraphics.closePath();
        mazeGraphics.endFill();
    }

    // Draw up to 3 directional beacon pips
    if (solarFlareStepsRemaining > 0 && !gameWon) {
        const targets = [];
        if (keys.length > 0) {
            let nearestKey = null;
            let minDist = Infinity;
            for (const k of keys) {
                const kx = (k.x - startX) * tileSize + tileSize / 2;
                const ky = (k.y - startY) * tileSize + tileSize / 2;
                const dist = Math.abs(k.x - playerX) + Math.abs(k.y - playerY);
                if (dist > 0 && dist < minDist) {
                    minDist = dist;
                    nearestKey = k;
                }
            }
            if (nearestKey) {
                targets.push({ x: (nearestKey.x - startX) * tileSize + tileSize / 2, y: (nearestKey.y - startY) * tileSize + tileSize / 2, color: 0xffd700 });
            }
        }
        if (escapeX >= 0 && escapeY >= 0 && (escapeX !== playerX || escapeY !== playerY)) {
            targets.push({ x: (escapeX - startX) * tileSize + tileSize / 2, y: (escapeY - startY) * tileSize + tileSize / 2, color: 0x00ff66 });
        }
        if (gates.length > 0) {
            let nearestGate = null;
            let minDist = Infinity;
            for (const g of gates) {
                const gx = (g.x - startX) * tileSize + tileSize / 2;
                const gy = (g.y - startY) * tileSize + tileSize / 2;
                const dist = Math.abs(g.x - playerX) + Math.abs(g.y - playerY);
                if (dist > 0 && dist < minDist) {
                    minDist = dist;
                    nearestGate = g;
                }
            }
            if (nearestGate) {
                targets.push({ x: (nearestGate.x - startX) * tileSize + tileSize / 2, y: (nearestGate.y - startY) * tileSize + tileSize / 2, color: 0x3399ff });
            }
        }
        for (const t of targets) {
            const ang = Math.atan2(t.y - playerScreenCenterY, t.x - playerScreenCenterX);
            const bx = playerScreenCenterX + Math.cos(ang) * (tileSize * 1.15);
            const by = playerScreenCenterY + Math.sin(ang) * (tileSize * 1.15);
            mazeGraphics.lineStyle(1, 0x000000, 0.8);
            mazeGraphics.beginFill(t.color, 1);
            mazeGraphics.drawCircle(bx, by, tileSize * 0.18);
            mazeGraphics.endFill();
            mazeGraphics.lineStyle(0);
        }
    }
    // Draw active Siren Decoy lure line, sonic rings, and beacon
    if (isDecoyLureActive()) {
        const dcx = (activeDecoy.x - startX) * tileSize + tileSize / 2;
        const dcy = (activeDecoy.y - startY) * tileSize + tileSize / 2;

        if (minotaurActive && minotaurX >= 0) {
            mazeGraphics.lineStyle(2, 0xff66b2, 0.65);
            mazeGraphics.moveTo((minotaurX - startX) * tileSize + tileSize / 2, (minotaurY - startY) * tileSize + tileSize / 2);
            mazeGraphics.lineTo(dcx, dcy);
            mazeGraphics.lineStyle(0);
        }

        // Beacon
        mazeGraphics.beginFill(0xff3399, 1);
        mazeGraphics.drawCircle(dcx, dcy, tileSize * 0.38);
        mazeGraphics.endFill();
        mazeGraphics.beginFill(0xffffff, 1);
        mazeGraphics.drawCircle(dcx, dcy, tileSize * 0.16);
        mazeGraphics.endFill();

        // Pulsing sonic rings
        const p = 1 + 0.15 * Math.sin(Date.now() / 150);
        mazeGraphics.lineStyle(2, 0xff66b2, 0.9);
        mazeGraphics.drawCircle(dcx, dcy, tileSize * 0.75 * p);
        mazeGraphics.lineStyle(1.5, 0x00ffff, 0.75);
        mazeGraphics.drawCircle(dcx, dcy, tileSize * 1.15 * p);
        mazeGraphics.lineStyle(0);
    }

    // Flash overlay
    if (Date.now() < decoyFlashUntil) {
        mazeGraphics.lineStyle(6, 0xff66b2, 0.6);
        mazeGraphics.beginFill(0xff66b2, 0.08);
        mazeGraphics.drawRect(0, 0, visibleWidth * tileSize, visibleHeight * tileSize);
        mazeGraphics.endFill();
        mazeGraphics.lineStyle(0);
    }

    // Athena Owl Tactical Clairvoyance overlay
    if (owlStepsRemaining > 0 && !gameWon) {
        // Escape Route Preview (owlEscapePreview)
        if (Array.isArray(owlEscapePreview) && owlEscapePreview.length > 0) {
            mazeGraphics.lineStyle(2, 0x00ffff, 0.85);
            mazeGraphics.moveTo(playerScreenCenterX, playerScreenCenterY);
            for (const n of owlEscapePreview) {
                if (n.x >= startX && n.x < startX + visibleWidth && n.y >= startY && n.y < startY + visibleHeight) {
                    mazeGraphics.lineTo((n.x - startX) * tileSize + tileSize / 2, (n.y - startY) * tileSize + tileSize / 2);
                }
            }
            mazeGraphics.lineStyle(0);
            for (const n of owlEscapePreview) {
                if (n.x >= startX && n.x < startX + visibleWidth && n.y >= startY && n.y < startY + visibleHeight) {
                    mazeGraphics.beginFill(0x00ffff, 0.85);
                    mazeGraphics.drawCircle((n.x - startX) * tileSize + tileSize / 2, (n.y - startY) * tileSize + tileSize / 2, tileSize * 0.18);
                    mazeGraphics.endFill();
                }
            }
        }

        // Remote Relic Beacons
        const baseR = torchActive ? TORCH_RADIUS_BOOSTED : TORCH_RADIUS_NORMAL;
        const effR = solarFlareStepsRemaining > 0 ? Math.max(baseR, SOLAR_FLARE_RADIUS) : baseR;
        const relicCandidates = [];
        if (keys.length > 0) {
            relicCandidates.push(...keys);
        }
        if (aegisShrines.length > 0) {
            relicCandidates.push(...aegisShrines);
        }
        if (hermesShrines.length > 0) {
            relicCandidates.push(...hermesShrines);
        }
        if (chronosShrines.length > 0) {
            relicCandidates.push(...chronosShrines);
        }
        if (daedalusShrines.length > 0) {
            relicCandidates.push(...daedalusShrines);
        }
        if (icarusShrines.length > 0) {
            relicCandidates.push(...icarusShrines);
        }
        if (orpheusShrines.length > 0) {
            relicCandidates.push(...orpheusShrines);
        }
        if (Array.isArray(poseidonShrines) && poseidonShrines.length > 0) {
            relicCandidates.push(...poseidonShrines);
        }
        if (Array.isArray(artemisShrines) && artemisShrines.length > 0) {
            relicCandidates.push(...artemisShrines);
        }
        for (const r of relicCandidates) {
            if (r.x >= startX && r.x < startX + visibleWidth && r.y >= startY && r.y < startY + visibleHeight) {
                if (Math.max(Math.abs(r.x - playerX), Math.abs(r.y - playerY)) > effR) {
                    const rcx = (r.x - startX) * tileSize + tileSize / 2;
                    const rcy = (r.y - startY) * tileSize + tileSize / 2;
                    mazeGraphics.lineStyle(2, 0x66b2ff, 0.85);
                    mazeGraphics.drawCircle(rcx, rcy, tileSize * 0.42);
                    mazeGraphics.lineStyle(0);
                }
            }
        }

        // Minotaur Tactical Reticle & Trajectory
        if (minotaurActive && minotaurX >= startX && minotaurX < startX + visibleWidth && minotaurY >= startY && minotaurY < startY + visibleHeight) {
            const mcx = (minotaurX - startX) * tileSize + tileSize / 2;
            const mcy = (minotaurY - startY) * tileSize + tileSize / 2;
            mazeGraphics.lineStyle(2, 0xff3355, 0.9);
            mazeGraphics.drawCircle(mcx, mcy, tileSize * 0.55);
            mazeGraphics.lineStyle(0);
            if (Array.isArray(minotaurPath) && minotaurPath.length > 0) {
                mazeGraphics.lineStyle(2, 0xff3355, 0.8);
                const limit = Math.min(8, minotaurPath.length);
                mazeGraphics.moveTo(mcx, mcy);
                for (let i = 0; i < limit; i++) {
                    const p = minotaurPath[i];
                    mazeGraphics.lineTo((p.x - startX) * tileSize + tileSize / 2, (p.y - startY) * tileSize + tileSize / 2);
                }
                mazeGraphics.lineStyle(0);
            }
        }
    }

    // Flash overlay
    if (Date.now() < owlFlashUntil) {
        mazeGraphics.lineStyle(6, 0x66b2ff, 0.65);
        mazeGraphics.beginFill(0x66b2ff, 0.08);
        mazeGraphics.drawRect(0, 0, visibleWidth * tileSize, visibleHeight * tileSize);
        mazeGraphics.endFill();
        mazeGraphics.lineStyle(0);
    }

    // Riptide Surge seafoam wake
    if (Date.now() < riptideFlashUntil && Array.isArray(riptideTrail)) {
        for (const t of riptideTrail) {
            if (t.x >= startX && t.x < startX + visibleWidth && t.y >= startY && t.y < startY + visibleHeight) {
                mazeGraphics.beginFill(0x00ffd5, 0.45);
                mazeGraphics.drawRoundedRect((t.x - startX) * tileSize + 2, (t.y - startY) * tileSize + 2, tileSize - 4, tileSize - 4, 4);
                mazeGraphics.endFill();
            }
        }
    }

    if ((arrowVisionStepsRemaining > 0 || Date.now() < arrowFlashUntil) && Array.isArray(arrowTrail)) {
        for (const t of arrowTrail) {
            if (t.x >= startX && t.x < startX + visibleWidth && t.y >= startY && t.y < startY + visibleHeight) {
                mazeGraphics.beginFill(0xc0ffd8, Date.now() < arrowFlashUntil ? 0.5 : 0.25);
                mazeGraphics.drawRoundedRect((t.x - startX) * tileSize + 3, (t.y - startY) * tileSize + 3, tileSize - 6, tileSize - 6, 3);
                mazeGraphics.endFill();
            }
        }
    }

    // Draw Minotaur
    drawMinotaur();
    pixiApp.render();
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

    // Draw stun ring if stunned
    if (Date.now() < minotaurStunnedUntil) {
        mazeGraphics.lineStyle(2, 0x00ff88, 0.95);
        mazeGraphics.drawCircle(centerX, centerY, size + 4);
        mazeGraphics.lineStyle(0);
    }
}
