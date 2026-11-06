

function getFacingCardinal() {
    const d = lastMoveDir || { dx: 1, dy: 0 };
    if (d.dy < 0) return 'N';
    if (d.dy > 0) return 'S';
    if (d.dx < 0) return 'W';
    return 'E';
}

function getFpEffectiveRadius() {
    const base = torchActive ? TORCH_RADIUS_BOOSTED : TORCH_RADIUS_NORMAL;
    return solarFlareStepsRemaining > 0 ? Math.max(base, SOLAR_FLARE_RADIUS) : base;
}

function fpTileKind(x, y) {
    if (!Array.isArray(maze) || y < 0 || y >= maze.length || !Array.isArray(maze[y]) || x < 0 || x >= maze[y].length || maze[y][x] !== 1) {
        return 'wall';
    }
    if (Array.isArray(gates) && gates.some(g => g.x === x && g.y === y)) {
        return 'gate';
    }
    return 'open';
}

function castFpRay(dirX, dirY, planeX, planeY, camX) {
    const eyeX = playerX + 0.5;
    const eyeY = playerY + 0.5;
    const rayDirX = dirX + planeX * camX;
    const rayDirY = dirY + planeY * camX;
    let mapX = Math.floor(eyeX);
    let mapY = Math.floor(eyeY);
    const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
    const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);
    let stepX, sideDistX, stepY, sideDistY;
    if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (eyeX - mapX) * deltaDistX;
    } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - eyeX) * deltaDistX;
    }
    if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (eyeY - mapY) * deltaDistY;
    } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - eyeY) * deltaDistY;
    }
    let side = 0;
    let perpDist = 0;
    for (let steps = 0; steps < 64; steps++) {
        if (sideDistX < sideDistY) {
            perpDist = sideDistX;
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
        } else {
            perpDist = sideDistY;
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
        }
        if (perpDist > 24) {
            return { perpDist: 24, side, mapX, mapY, kind: 'none' };
        }
        const kind = fpTileKind(mapX, mapY);
        if (kind === 'wall' || kind === 'gate') {
            return { perpDist: Math.max(0.15, perpDist), side, mapX, mapY, kind };
        }
    }
    return { perpDist: 24, side, mapX, mapY, kind: 'none' };
}

function drawFpWorld(g, rays) {
    g.beginFill(0x0c1022, 1);
    g.drawRect(0, 0, 800, 400);
    g.endFill();
    const floorColor = solarFlareStepsRemaining > 0 ? 0x3a3218 : (compassStepsRemaining > 0 ? 0x0e3545 : 0x162038);
    g.beginFill(floorColor, 1);
    g.drawRect(0, 400, 800, 400);
    g.endFill();
    const effRadius = getFpEffectiveRadius();
    for (let col = 0; col < 100; col++) {
        const ray = rays[col];
        if (!ray || ray.kind === 'none') continue;
        const h = Math.min(800, Math.floor(800 / Math.max(0.15, ray.perpDist)));
        let color;
        if (ray.kind === 'gate') {
            color = 0x1e55ff;
        } else if (Array.isArray(breachedTiles) && breachedTiles.some(b => Math.abs(b.x - ray.mapX) + Math.abs(b.y - ray.mapY) <= 1)) {
            color = 0xcc5522;
        } else {
            color = ray.side ? 0x10648a : 0x1888b8;
        }
        const alpha = Math.max(0.12, 1 - ray.perpDist / (effRadius + 1));
        g.beginFill(color, alpha);
        g.drawRect(col * 8, 400 - h / 2, 8, h);
        g.endFill();
    }
}

function collectFpSprites() {
    const effRadius = getFpEffectiveRadius();
    const entities = [];
    const pushIfInRange = (x, y, color, kind) => {
        if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || y < 0) return;
        if (Math.max(Math.abs(x - playerX), Math.abs(y - playerY)) <= effRadius) {
            entities.push({ x, y, color, kind });
        }
    };
    pushIfInRange(escapeX, escapeY, 0xffd700, 'escape');
    if (minotaurActive && minotaurX >= 0 && minotaurY >= 0) {
        pushIfInRange(minotaurX, minotaurY, Date.now() < minotaurStunnedUntil ? 0x00ff88 : 0xff2222, 'minotaur');
    }
    const addList = (arr, color, kind = 'pickup', xKey = 'x', yKey = 'y') => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
            if (item) pushIfInRange(item[xKey], item[yKey], color, kind);
        }
    };
    addList(keys, 0xffd700, 'pickup');
    addList(torchPickups, 0xffa500, 'pickup');
    addList(secretPassages, 0x9933ff, 'pickup', 'fromX', 'fromY');
    addList(threadSpools, 0x00e5ff, 'pickup');
    addList(aegisShrines, 0x00ff88, 'pickup');
    addList(hermesShrines, 0xffaa00, 'pickup');
    addList(chronosShrines, 0x00ffff, 'pickup');
    addList(daedalusShrines, 0xff4422, 'pickup');
    addList(icarusShrines, 0xffdd44, 'pickup');
    addList(orpheusShrines, 0xff3399, 'pickup');
    addList(athenaShrines, 0x2266cc, 'pickup');
    addList(poseidonShrines, 0x00ffd5, 'pickup');
    addList(artemisShrines, 0x22cc88, 'pickup');
    addList(apolloShrines, 0xffbb33, 'pickup');
    addList(hephaestusShrines, 0xcc4411, 'pickup');
    if (chronosAnchor) pushIfInRange(chronosAnchor.x, chronosAnchor.y, 0xd580ff, 'pickup');
    if (typeof isDecoyLureActive === 'function' && isDecoyLureActive() && activeDecoy) {
        pushIfInRange(activeDecoy.x, activeDecoy.y, 0xff66b2, 'pickup');
    }
    if (typeof isAnvilTrapActive === 'function' && isAnvilTrapActive() && activeAnvilTrap) {
        pushIfInRange(activeAnvilTrap.x, activeAnvilTrap.y, 0xff3300, 'pickup');
    }
    return entities;
}

function drawFpSprites(g, zBuffer, dirX, dirY, planeX, planeY) {
    const entities = collectFpSprites();
    const eyeX = playerX + 0.5;
    const eyeY = playerY + 0.5;
    const det = planeX * dirY - dirX * planeY;
    if (Math.abs(det) < 1e-6) return 0;
    const invDet = 1 / det;
    const projected = [];
    for (const ent of entities) {
        const dx = ent.x + 0.5 - eyeX;
        const dy = ent.y + 0.5 - eyeY;
        const transformX = invDet * (dirY * dx - dirX * dy);
        const transformY = invDet * (-planeY * dx + planeX * dy);
        if (transformY > 0.2 && transformY <= 24) {
            const screenX = 400 * (1 + transformX / transformY);
            const size = Math.min(800, 600 / transformY);
            projected.push({ ...ent, transformX, transformY, screenX, size });
        }
    }
    projected.sort((a, b) => b.transformY - a.transformY);
    let visibleCount = 0;
    for (const sp of projected) {
        const half = sp.size / 2;
        const startCol = Math.max(0, Math.floor((sp.screenX - half) / 8));
        const endCol = Math.min(99, Math.floor((sp.screenX + half) / 8));
        let anyStripe = false;
        for (let col = startCol; col <= endCol; col++) {
            if (sp.transformY >= zBuffer[col]) continue;
            anyStripe = true;
            const stripeCenterX = col * 8 + 4;
            const normX = Math.min(1, Math.abs(stripeCenterX - sp.screenX) / Math.max(1, half));
            let colH = sp.size;
            let topY = 400 - colH / 2;
            if (sp.kind === 'minotaur') {
                const diamondH = sp.size * Math.max(0.2, 1 - normX * 0.75);
                const hornBoost = (normX > 0.45 && normX < 0.85) ? sp.size * 0.22 : 0;
                colH = diamondH + hornBoost;
                topY = 400 - colH / 2;
            } else if (sp.kind === 'escape') {
                const archCurve = Math.sqrt(Math.max(0, 1 - normX * normX));
                colH = sp.size * (0.55 + 0.45 * archCurve);
                topY = 400 + half - colH;
            } else {
                const circleFactor = Math.sqrt(Math.max(0, 1 - normX * normX));
                colH = Math.max(4, sp.size * 0.65 * circleFactor);
                topY = 400 - colH / 2;
            }
            g.beginFill(sp.color, 0.92);
            g.drawRect(col * 8, topY, 8, colH);
            g.endFill();
        }
        if (anyStripe) visibleCount++;
    }
    return visibleCount;
}

function drawFpHud(g) {
    g.lineStyle(2, 0xffffff, 0.75);
    g.moveTo(392, 400);
    g.lineTo(408, 400);
    g.moveTo(400, 392);
    g.lineTo(400, 408);
    g.lineStyle(0);
    g.beginFill(0x0b132b, 0.85);
    g.lineStyle(1, 0x80d4ff, 0.9);
    g.drawRoundedRect(340, 10, 120, 28, 8);
    g.endFill();
    g.lineStyle(0);
    if (!g._facingLabel) {
        g._facingLabel = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x80d4ff,
            fontWeight: 'bold'
        });
        if (g._facingLabel.anchor && typeof g._facingLabel.anchor.set === 'function') {
            g._facingLabel.anchor.set(0.5, 0.5);
        }
        g._facingLabel.position.set(400, 24);
        g.addChild(g._facingLabel);
    }
    g._facingLabel.text = 'Facing: ' + getFacingCardinal();
    if (typeof getMinotaurStatusLabel === 'function' && getMinotaurStatusLabel() === 'DANGER') {
        g.lineStyle(16, 0xff2222, 0.25);
        g.drawRect(0, 0, 800, 800);
        g.lineStyle(0);
    }
}



function toggleViewMode(forceMode) {
    if (forceMode === 'fp' || forceMode === 'map') {
        viewMode = forceMode;
    } else {
        viewMode = (viewMode === 'fp') ? 'map' : 'fp';
    }
    window.viewMode = viewMode;

    const toggleViewBtn = document.getElementById('toggleViewButton');
    if (toggleViewBtn) {
        toggleViewBtn.textContent = (viewMode === 'fp') 
            ? 'View: 3D + Minimap (M)' 
            : 'View: Overhead Map (M)';
    }

    if (typeof drawMaze === 'function') drawMaze();
    return viewMode;
}


function renderFirstPersonAndMinimap() {
    // Lazily create and attach minimap mask if missing
    if (!fpGraphics._minimapMask) {
        fpGraphics._minimapMask = new PIXI.Graphics();
    }
    if (!fpGraphics._minimapMask.parent && pixiApp && pixiApp.stage) {
        pixiApp.stage.addChild(fpGraphics._minimapMask);
    }

    fpGraphics.clear();
    minimapFrameGraphics.clear();

    const d = lastMoveDir || { dx: 1, dy: 0 };
    const dirX = (d.dx === 0 && d.dy === 0) ? 1 : d.dx;
    const dirY = (d.dx === 0 && d.dy === 0) ? 0 : d.dy;
    const planeX = -dirY * 0.66;
    const planeY = dirX * 0.66;
    const rays = new Array(100);
    const zBuffer = new Array(100);
    for (let col = 0; col < 100; col++) {
        const camX = 2 * (col + 0.5) / 100 - 1;
        const ray = castFpRay(dirX, dirY, planeX, planeY, camX);
        rays[col] = ray;
        zBuffer[col] = ray.perpDist;
    }
    lastFpFrameSummary.raysCast = 100;
    lastFpFrameSummary.frontWallDist = rays[50].perpDist;
    lastFpFrameSummary.facing = getFacingCardinal();
    lastFpFrameSummary.mode = viewMode;
    if (viewMode === 'map') {
        fpGraphics.visible = false;
        minimapFrameGraphics.visible = false;
        mazeGraphics.scale.set(1);
        mazeGraphics.position.set(0, 0);
        // Clear and hide minimap mask before setting mazeGraphics.mask = null (baseline ordering)
        if (fpGraphics._minimapMask) {
            fpGraphics._minimapMask.clear();
            fpGraphics._minimapMask.visible = false;
        }
        mazeGraphics.mask = null;
        lastFpFrameSummary.visibleSprites = 0;
        return;
    }
    fpGraphics.visible = true;
    minimapFrameGraphics.visible = true;
    drawFpWorld(fpGraphics, rays);
    lastFpFrameSummary.visibleSprites = drawFpSprites(fpGraphics, zBuffer, dirX, dirY, planeX, planeY);
    drawFpHud(fpGraphics);
    minimapFrameGraphics.beginFill(0x05070f, 0.85);
    minimapFrameGraphics.lineStyle(2, 0x80d4ff, 1);
    minimapFrameGraphics.drawRoundedRect(564, 8, 228, 228, 8);
    minimapFrameGraphics.endFill();
    minimapFrameGraphics.lineStyle(0);
    mazeGraphics.scale.set(0.275);
    mazeGraphics.position.set(568, 12);

    // Apply minimap mask in fp mode
    // Clear mask first, then draw with specified geometry, set visible, then assign to mazeGraphics.mask
    fpGraphics._minimapMask.clear();
    fpGraphics._minimapMask.beginFill(0xffffff, 1);
    fpGraphics._minimapMask.drawRoundedRect(568, 12, 220, 220, 6);
    fpGraphics._minimapMask.endFill();
    fpGraphics._minimapMask.visible = true;
    mazeGraphics.mask = fpGraphics._minimapMask;
}

function getFirstPersonState() {
    const d = lastMoveDir || { dx: 1, dy: 0 };
    return {
        viewMode,
        facing: getFacingCardinal(),
        lastMoveDir: { dx: d.dx, dy: d.dy },
        playerX,
        playerY,
        raysCast: lastFpFrameSummary.raysCast,
        visibleSprites: lastFpFrameSummary.visibleSprites,
        frontWallDist: lastFpFrameSummary.frontWallDist,
        minimapScale: mazeGraphics.scale.x,
        minimapX: mazeGraphics.x,
        minimapY: mazeGraphics.y,
        minimapMasked: Boolean(mazeGraphics.mask && fpGraphics._minimapMask && mazeGraphics.mask === fpGraphics._minimapMask && fpGraphics._minimapMask.visible)
    };
}
