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

    const repelBtn = document.getElementById('repelButton');
    if (repelBtn) {
        repelBtn.addEventListener('click', function() {
            triggerAegisRepel(false);
            document.getElementById('gameCanvas').focus();
        });
    }

    const dashBtn = document.getElementById('dashButton');
    if (dashBtn) {
        dashBtn.addEventListener('click', function() {
            triggerPhaseDash();
            document.getElementById('gameCanvas').focus();
        });
    }
});
// Helper to show and fade banner messages
let secretPassageMsgTimeout = null;
let secretPassageFadeTimeout = null;
function showBannerMessage(text, bg = 'rgba(80,0,120,0.85)') {
    const msgDiv = document.getElementById('secretPassageMessage');
    if (!msgDiv) return;
    msgDiv.textContent = text;
    msgDiv.style.background = bg;
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
function showSecretPassageMessage() {
    showBannerMessage('You found a secret passage!', 'rgba(80,0,120,0.85)');
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
let aegisShrines = [];
window.aegisShrines = aegisShrines;
let playerShields = 0;
const MAX_SHIELDS = 3;
const AEGIS_SHRINE_COUNT = 16;
let minotaurStunnedUntil = 0;
const MINOTAUR_STUN_MS = 8000;
const MINOTAUR_REPEL_STEPS = 15;
let repelFlashUntil = 0;
let hermesShrines = [];
window.hermesShrines = hermesShrines;
let playerDashes = 0;
const MAX_DASHES = 3;
const HERMES_SHRINE_COUNT = 16;
let lastMoveDir = { dx: 1, dy: 0 };
let dashTrail = [];
let dashTrailUntil = 0;
let steps = 0;

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

// Escape tile position and win state globals
let escapeX = -1;
let escapeY = -1;
let gameWon = false;

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

function getMinotaurStatusLabel() {
  if (!minotaurActive || minotaurX < 0 || minotaurY < 0) return 'Inactive';
  if (Date.now() < minotaurStunnedUntil) {
    const secs = Math.max(1, Math.ceil((minotaurStunnedUntil - Date.now()) / 1000));
    return 'Stunned (' + secs + 's)';
  }
  const d = Math.abs(minotaurX - playerX) + Math.abs(minotaurY - playerY);
  return d <= 15 ? 'DANGER' : (d <= 45 ? 'Near' : 'Distant');
}

function updateShieldUI() {
  const shieldCounter = document.getElementById('shieldCounter');
  if (shieldCounter) shieldCounter.textContent = `Shields: ${playerShields}`;

  const minotaurRadar = document.getElementById('minotaurRadar');
  if (minotaurRadar) {
    const status = getMinotaurStatusLabel();
    minotaurRadar.textContent = 'Minotaur: ' + status;
    minotaurRadar.classList.toggle('danger', status === 'DANGER');
    minotaurRadar.classList.toggle('stunned', status.startsWith('Stunned'));
  }

  const repelButton = document.getElementById('repelButton');
  if (repelButton) {
    repelButton.disabled = playerShields <= 0 || gameWon || gameLost || !minotaurActive;
  }
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

function collectShieldAt(x, y) {
  if (playerShields >= MAX_SHIELDS) return false;
  const i = aegisShrines.findIndex(a => a.x === x && a.y === y);
  if (i === -1) return false;
  aegisShrines.splice(i, 1);
  playerShields++;
  showBannerMessage('Aegis Shield acquired! (' + playerShields + '/' + MAX_SHIELDS + ')', 'rgba(0,110,60,0.9)');
  updateShieldUI();
  return true;
}

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
}

function triggerAegisRepel(isAutoIntercept = false) {
  if (gameWon || gameLost || playerShields <= 0) return false;

  playerShields--;
  minotaurStunnedUntil = Date.now() + MINOTAUR_STUN_MS;
  repelFlashUntil = Date.now() + 600;

  if (minotaurActive && minotaurX >= 0) {
    pushMinotaurBack(MINOTAUR_REPEL_STEPS);
  }

  const msg = isAutoIntercept ? 'Aegis Shield shattered! Minotaur repelled!' : 'Aegis Pulse! Minotaur repelled & stunned!';
  showBannerMessage(msg, 'rgba(0,120,70,0.9)');

  updateShieldUI();
  updateSpoolUI();
  drawMaze();
  return true;
}

window.triggerAegisRepel = triggerAegisRepel;
function getDirectionArrow() {
  if (lastMoveDir.dy === -1) return '↑';
  if (lastMoveDir.dy === 1) return '↓';
  if (lastMoveDir.dx === -1) return '←';
  return '→';
}

function updateDashUI() {
  const el = document.getElementById('dashCounter');
  if (el) el.textContent = `Dashes: ${playerDashes} (${getDirectionArrow()})`;
  const btn = document.getElementById('dashButton');
  if (btn) btn.disabled = playerDashes <= 0 || gameWon || gameLost;
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

function collectHermesAt(x, y) {
  if (playerDashes >= MAX_DASHES) return false;
  const i = hermesShrines.findIndex(h => h.x === x && h.y === y);
  if (i === -1) return false;
  hermesShrines.splice(i, 1);
  playerDashes++;
  showBannerMessage('Winged Sandals! Phase Dash (' + playerDashes + '/' + MAX_DASHES + ')', 'rgba(180,100,0,0.9)');
  updateDashUI();
  return true;
}

function canLandOnTile(tx, ty) {
  if (tx < 0 || tx >= maze[0].length || ty < 0 || ty >= maze.length) return false;
  if (maze[ty][tx] !== 1) return false;
  if (gates.some(g => g.x === tx && g.y === ty)) return playerKeys > 0;
  return true;
}

function formatWinSummary() {
  const score = Math.max(100, 5000 - steps * 2 + visitedTiles.size * 5 + (playerSpools + playerShields + playerDashes + playerKeys) * 150);
  return `You Escaped! Steps: ${steps} | Tiles: ${visitedTiles.size} | Score: ${score}`;
}

function triggerPhaseDash() {
  if (gameWon || gameLost || playerDashes <= 0) return false;
  const tx1 = playerX + lastMoveDir.dx;
  const ty1 = playerY + lastMoveDir.dy;
  const tx2 = playerX + 2 * lastMoveDir.dx;
  const ty2 = playerY + 2 * lastMoveDir.dy;
  let landX, landY, dist;
  if (canLandOnTile(tx2, ty2)) {
    landX = tx2; landY = ty2; dist = 2;
  } else if (canLandOnTile(tx1, ty1)) {
    landX = tx1; landY = ty1; dist = 1;
  } else {
    showBannerMessage('Dash blocked! Face an open corridor or thin wall.', 'rgba(140,40,0,0.9)');
    return false;
  }
  playerDashes--;
  dashTrail = [{ x: playerX, y: playerY }, { x: tx1, y: ty1 }, { x: landX, y: landY }];
  dashTrailUntil = Date.now() + 700;
  if (dist === 2 && maze[ty1] && maze[ty1][tx1] === 1 && !gates.some(g => g.x === tx1 && g.y === ty1)) {
    visitedTiles.add(`${tx1},${ty1}`);
    minotaurPath.push({ x: tx1, y: ty1 });
  }
  const gIdx = gates.findIndex(g => g.x === landX && g.y === landY);
  if (gIdx !== -1) {
    playerKeys--;
    gates.splice(gIdx, 1);
    const kc = document.getElementById('keyCounter');
    if (kc) kc.textContent = 'Keys: ' + playerKeys;
  }
  playerX = landX; playerY = landY; steps++;
  const sc = document.getElementById('stepCounter');
  if (sc) sc.textContent = 'Steps: ' + steps;
  visitedTiles.add(`${playerX},${playerY}`);
  const uc = document.getElementById('uniqueTilesCounter');
  if (uc) uc.textContent = 'Unique Tiles: ' + visitedTiles.size;
  minotaurPath.push({ x: playerX, y: playerY });
  // Handle pickups
    // Handle pickups
  const kIdx = keys.findIndex(k => k.x === playerX && k.y === playerY);
  if (kIdx !== -1) {
    playerKeys++;
    keys.splice(kIdx, 1);
    const kc = document.getElementById('keyCounter');
    if (kc) kc.textContent = 'Keys: ' + playerKeys;
  }
  const tIdx = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
  if (tIdx !== -1) {
    torchPickups.splice(tIdx, 1);
    torchActive = true;
    torchStepsRemaining = TORCH_EFFECT_STEPS;
    updateTorchIndicator();
  }
  onPlayerThreadStep();
  collectHermesAt(playerX, playerY);
  if (torchActive) {
    torchStepsRemaining--;
    if (torchStepsRemaining <= 0) {
      torchActive = false;
      torchStepsRemaining = 0;
    }
    updateTorchIndicator();
  }
  // Check secret passage
  const passage = secretPassages.find(p => p.fromX === playerX && p.fromY === playerY);
  if (passage) {
    playerX = passage.toX; playerY = passage.toY;
    visitedTiles.add(`${playerX},${playerY}`);
    const uc = document.getElementById('uniqueTilesCounter');
    if (uc) uc.textContent = 'Unique Tiles: ' + visitedTiles.size;
    minotaurPath.push({ x: playerX, y: playerY });
    const kIdx2 = keys.findIndex(k => k.x === playerX && k.y === playerY);
    if (kIdx2 !== -1) {
      playerKeys++;
      keys.splice(kIdx2, 1);
      const kc = document.getElementById('keyCounter');
      if (kc) kc.textContent = 'Keys: ' + playerKeys;
    }
    const tIdx2 = torchPickups.findIndex(t => t.x === playerX && t.y === playerY);
    if (tIdx2 !== -1) {
      torchPickups.splice(tIdx2, 1);
      torchActive = true;
      torchStepsRemaining = TORCH_EFFECT_STEPS;
      updateTorchIndicator();
    }
    if (collectSpoolAt(playerX, playerY)) updateSpoolUI();
    collectShieldAt(playerX, playerY);
    collectHermesAt(playerX, playerY);
    showSecretPassageMessage();
  }
  // Check Minotaur collision
  if (minotaurActive && playerX === minotaurX && playerY === minotaurY) {
    if (playerShields > 0) {
      triggerAegisRepel(true);
      updateDashUI();
      return true;
    }
    gameLost = true;
    const lo = document.getElementById('loseOverlay');
    if (lo) lo.style.display = 'flex';
    updateSpoolUI();
    updateShieldUI();
    updateDashUI();
    drawMaze();
    return true;
  }
  // Check escape victory
  if (playerX === escapeX && playerY === escapeY) {
    gameWon = true;
    clearInterval(minotaurInterval);
    torchActive = false; torchStepsRemaining = 0; compassStepsRemaining = 0;
    const wo = document.getElementById('winOverlay');
    if (wo) {
      wo.textContent = formatWinSummary();
      wo.style.display = 'flex';
    }
    updateTorchIndicator();
    updateSpoolUI();
    updateShieldUI();
    updateDashUI();
    drawMaze();
    return true;
  }
  showBannerMessage(dist === 2 && maze[ty1] && maze[ty1][tx1] === 0 ? 'Phase Dash! Phased through solid wall!' : 'Phase Dash! Vaulted ahead!', 'rgba(190,115,0,0.9)');
  updateDashUI();
  updateShieldUI();
  drawMaze();
  return true;
}

window.triggerPhaseDash = triggerPhaseDash;
function updateSpoolUI() {
  const c = document.getElementById('spoolCounter');
  if (c) c.textContent = 'Spools: ' + playerSpools;
  const ind = document.getElementById('compassIndicator');
  if (ind) {
    const on = compassStepsRemaining > 0;
    ind.textContent = on ? 'Compass: ' + compassStepsRemaining + ' (' + getProximityLabel() + ')' : 'Compass: Off';
    ind.classList.toggle('active', on);
  }
  const b = document.getElementById('useSpoolButton');
  if (b) b.disabled = (playerSpools <= 0 || compassStepsRemaining > 0 || gameWon || gameLost);
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

function collectSpoolAt(x, y) {
  const i = threadSpools.findIndex(s => s.x === x && s.y === y);
  if (i === -1) return false;
  threadSpools.splice(i, 1);
  playerSpools++;
  return true;
}

function onPlayerThreadStep() {
  collectSpoolAt(playerX, playerY);
  collectShieldAt(playerX, playerY);
  if (compassStepsRemaining > 0) compassStepsRemaining--;
  updateSpoolUI();
  updateShieldUI();
}

window.getThreadState = () => ({
  playerSpools,
  compassStepsRemaining,
  threadSpools: threadSpools.map(s => ({ x: s.x, y: s.y })),
  playerX,
  playerY,
  escapeX,
  escapeY,
  gameWon,
  gameLost,
  visited: visitedTiles.size,
  playerShields,
  aegisShrines: aegisShrines.map(a => ({ x: a.x, y: a.y })),
  minotaurX,
  minotaurY,
  minotaurActive,
  minotaurStunned: Date.now() < minotaurStunnedUntil,
  minotaurStatus: getMinotaurStatusLabel(),
  playerDashes,
  lastMoveDir: { dx: lastMoveDir.dx, dy: lastMoveDir.dy },
  hermesShrines: hermesShrines.map(h => ({ x: h.x, y: h.y })),
  steps
});

window.getGameState = window.getThreadState;


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

                // Draw path tiles
                if (maze[mazeY][mazeX] === 1) {
                    mazeGraphics.beginFill(0x00bfff, 1);
                    mazeGraphics.drawRoundedRect(x * tileSize, y * tileSize, tileSize, tileSize, 6);
                    mazeGraphics.endFill();

                    // Draw golden breadcrumb trail on visited tiles (excluding player, escape, keys, gates, torches, spools, passages, aegis shrines, and hermes shrines)
                    if (visitedTiles.has(`${mazeX},${mazeY}`) && !(mazeX === playerX && mazeY === playerY) && !(mazeX === escapeX && mazeY === escapeY) && !keys.some(k => k.x === mazeX && k.y === mazeY) && !gates.some(g => g.x === mazeX && g.y === mazeY) && !isTorchTile(mazeX, mazeY) && !threadSpools.some(s => s.x === mazeX && s.y === mazeY) && !secretPassages.some(p => p.fromX === mazeX && p.fromY === mazeY) && !aegisShrines.some(a => a.x === mazeX && a.y === mazeY) && !hermesShrines.some(h => h.x === mazeX && h.y === mazeY)) {
                        mazeGraphics.beginFill(0xffd700, 0.65);
                        mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 6);
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
                    mazeGraphics.drawCircle(cx, cy, tileSize / 2.5);
                    mazeGraphics.endFill();
                    mazeGraphics.beginFill(0xffffff, 0.9);
                    mazeGraphics.drawPolygon([
                        cx - 5, cy - 2,
                        cx + 1, cy - 6,
                        cx + 5, cy - 1,
                        cx - 1, cy + 5
                    ]);
                    mazeGraphics.endFill();
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
                                const arcX = tileX + Math.cos(angle) * radius;
                                const arcY = tileY + Math.sin(angle) * radius;
                                const nextAngle = ((a + 1) / 12) * Math.PI * 2 + (i * 0.3 + performance.now() / 500) % (Math.PI * 2);
                                const nextArcX = tileX + Math.cos(nextAngle) * radius;
                                const nextArcY = tileY + Math.sin(nextAngle) * radius;
                                mazeGraphics.moveTo(tileX, tileY);
                                mazeGraphics.lineTo(arcX, arcY);
                                mazeGraphics.lineTo(nextArcX, nextArcY);
                                mazeGraphics.closePath();
                            }
                            mazeGraphics.endFill();
                        }
                    }
                }

                // Draw player
                if (mazeX === playerX && mazeY === playerY) {
                    mazeGraphics.beginFill(0xff0000, 1);
                    mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize / 2);
                    mazeGraphics.endFill();

                    // Draw emerald aura ring when player has shields
                    if (playerShields > 0) {
                        mazeGraphics.lineStyle(2, 0x00ff88, 0.9);
                        mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize * 0.65);
                        mazeGraphics.lineStyle(0);

                        // Draw pulse ring when repel flash is active
                        if (Date.now() < repelFlashUntil) {
                            mazeGraphics.lineStyle(2, 0x00ff88, 0.6);
                            mazeGraphics.drawCircle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize * 1.4);
                            mazeGraphics.lineStyle(0);
                        }
                    }
                }
            }
        }
    }
    if (Date.now() < dashTrailUntil && dashTrail.length >= 2) {
        mazeGraphics.lineStyle(4, 0xffaa00, 0.85);
        for (let i = 0; i < dashTrail.length; i++) {
            const pt = dashTrail[i];
            const px = (pt.x - startX) * tileSize + tileSize / 2;
            const py = (pt.y - startY) * tileSize + tileSize / 2;
            if (i === 0) mazeGraphics.moveTo(px, py);
            else mazeGraphics.lineTo(px, py);
        }
        mazeGraphics.lineStyle(0);
    }
    if (compassStepsRemaining > 0 && !gameWon && (escapeX !== playerX || escapeY !== playerY)) {
        const angle = Math.atan2(escapeY - playerY, escapeX - playerX);
        const cx = (playerX - startX) * tileSize + tileSize / 2;
        const cy = (playerY - startY) * tileSize + tileSize / 2;
        const len = tileSize * 1.5;
        const tx = cx + Math.cos(angle) * len;
        const ty = cy + Math.sin(angle) * len;
        const head = tileSize * 0.5;
        mazeGraphics.lineStyle(3, 0x00e5ff, 1);
        mazeGraphics.moveTo(cx, cy);
        mazeGraphics.lineTo(tx, ty);
        mazeGraphics.lineStyle(0);
        mazeGraphics.beginFill(0xffd700, 1);
        mazeGraphics.moveTo(tx, ty);
        mazeGraphics.lineTo(tx - head * Math.cos(angle - Math.PI / 6), ty - head * Math.sin(angle - Math.PI / 6));
        mazeGraphics.lineTo(tx - head * Math.cos(angle + Math.PI / 6), ty - head * Math.sin(angle + Math.PI / 6));
        mazeGraphics.closePath();
        mazeGraphics.endFill();
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

    // Draw stun ring if stunned
    if (Date.now() < minotaurStunnedUntil) {
        mazeGraphics.lineStyle(2, 0x00ff88, 0.95);
        mazeGraphics.drawCircle(centerX, centerY, size + 4);
        mazeGraphics.lineStyle(0);
    }
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
    threadSpools.length = 0;
    window.threadSpools = threadSpools;
    playerSpools = 0;
    compassStepsRemaining = 0;
    // Reset Aegis Shield state
    aegisShrines.length = 0;
    window.aegisShrines = aegisShrines;
    playerShields = 0;
    minotaurStunnedUntil = 0;
    repelFlashUntil = 0;

    // Reset Hermes Winged Sandals & Phase Dash state
    hermesShrines.length = 0;
    window.hermesShrines = hermesShrines;
    playerDashes = 0;
    lastMoveDir = { dx: 1, dy: 0 };
    dashTrail = [];
    dashTrailUntil = 0;
    steps = 0;

    // Select escape tile first to ensure escapeX/escapeY are set
    selectEscapeTile();
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
    placeAegisShrines();
    updateShieldUI();
    placeHermesShrines();
    updateDashUI();
    let stepCount = 0; // Initialize step count
    const stepCounterEl = document.getElementById('stepCounter');
    if (stepCounterEl) stepCounterEl.textContent = 'Steps: 0';
    drawMaze();

    setupMobileControls(); // Initialize mobile controls

    // Start minotaur behavior
    minotaurInterval = setInterval(() => {
        if (gameWon || gameLost) {
            return; // Skip minotaur movement if game is won or lost
        }
        if (Date.now() < minotaurStunnedUntil) {
            updateShieldUI();
            drawMaze();
            return;
        }
        if (minotaurPath.length > 0) {
            const nextPosition = minotaurPath.shift(); // Use shift to move towards the user
            if (nextPosition) {
                minotaurX = nextPosition.x;
                minotaurY = nextPosition.y;
                stepCount++; // Increment step count
                steps = stepCount;
                document.getElementById('stepCounter').textContent = `Steps: ${stepCount}`; // Update step counter

                // Check for collision with the user
                if (minotaurX === playerX && minotaurY === playerY) {
                    if (playerShields > 0) {
                        triggerAegisRepel(true);
                        return;
                    }
                    gameLost = true;
                    updateSpoolUI();
                    updateShieldUI();
                    updateDashUI();
                    const overlay = document.getElementById('loseOverlay');
                    if (overlay) {
                        overlay.style.display = 'flex';
                    }
                    return;
                }

                updateShieldUI();
                drawMaze();
            }
        }
    }, 250); // Move 4 times per second (1000ms / 4 = 250ms)

    const keydownGen = (window._keydownGen = (window._keydownGen || 0) + 1);
    document.addEventListener('keydown', (event) => {
        if (keydownGen !== window._keydownGen) return;
        if (gameWon || gameLost) {
            return; // Ignore player input if game is won or lost
        }

        // Handle compass activation without movement
        if (event.key === 't' || event.key === 'T') {
            activateThreadCompass();
            return;
        }

        // Handle Aegis repel
        if (event.key === 'r' || event.key === 'R') {
            triggerAegisRepel(false);
            return;
        }

        // Handle Phase Dash
        if (event.key === 'f' || event.key === 'F' || event.key === ' ') {
            event.preventDefault();
            triggerPhaseDash();
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
            default:
                return;
        }

        // Update facing direction and UI even when movement blocked
        lastMoveDir = { dx: newX - playerX, dy: newY - playerY };
        updateDashUI();

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
                onPlayerThreadStep();

                // Increment step counter and update UI
                steps++;
                stepCount = steps;
                const stepCounterEl = document.getElementById('stepCounter');
                if (stepCounterEl) stepCounterEl.textContent = `Steps: ${steps}`;

                // Collect Hermes shrine if present
                collectHermesAt(playerX, playerY);
                updateDashUI();

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

                // Check if player reached escape tile
                if (playerX === escapeX && playerY === escapeY) {
                    gameWon = true; // Set win state
                    // Display win overlay using persistent overlay element
                    const overlay = document.getElementById('winOverlay');
                    if (overlay) {
                        overlay.textContent = formatWinSummary();
                        overlay.style.display = 'flex';
                    }
                    // Torch effect ends on win
                    torchActive = false;
                    torchStepsRemaining = 0;
                    updateTorchIndicator();
                    compassStepsRemaining = 0;
                    updateSpoolUI();
                    updateShieldUI();
                    updateDashUI();
                    drawMaze(); // Redraw maze with overlay on top
                    return;
                }

                // Check for secret passage teleportation
                const passage = secretPassages.find(p => p.fromX === playerX && p.fromY === playerY);
                if (passage) {
                    // Teleport player to destination
                    playerX = passage.toX;
                    playerY = passage.toY;

                    // Check if there's a spool at the destination
                    if (collectSpoolAt(playerX, playerY)) updateSpoolUI();
                    collectShieldAt(playerX, playerY);
                    updateShieldUI();

                    // Collect Hermes shrine if present
                    collectHermesAt(playerX, playerY);
                    updateDashUI();

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
                        if (playerShields > 0) {
                            triggerAegisRepel(true);
                            return;
                        }
                        gameLost = true;
                        updateSpoolUI();
                        updateShieldUI();
                        const overlay = document.getElementById('loseOverlay');
                        if (overlay) {
                            overlay.style.display = 'flex';
                        }
                        return;
                    }

                    drawMaze();
                }
                else {
                    // Check if player stepped directly onto the Minotaur
                    if (minotaurX === playerX && minotaurY === playerY) {
                        if (playerShields > 0) {
                            triggerAegisRepel(true);
                            return;
                        }
                        gameLost = true;
                        updateSpoolUI();
                        updateShieldUI();
                        const overlay = document.getElementById('loseOverlay');
                        if (overlay) overlay.style.display = 'flex';
                        drawMaze();
                        return;
                    }
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

    // Update last move direction and dash UI even when movement is blocked
    if (newX !== playerX || newY !== playerY) {
        lastMoveDir = { dx: newX - playerX, dy: newY - playerY };
        updateDashUI();
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

        onPlayerThreadStep();

        // Increment steps and update step counter
        steps++;
        const sc = document.getElementById('stepCounter');
        if (sc) sc.textContent = 'Steps: ' + steps;

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
            if (collectSpoolAt(playerX, playerY)) updateSpoolUI();

            // Collect shield at secret passage destination
            collectShieldAt(playerX, playerY);
            updateShieldUI();

            // Collect Hermes shrine at secret passage destination
            collectHermesAt(playerX, playerY);
            updateDashUI();

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
                if (playerShields > 0) {
                    triggerAegisRepel(true);
                    updateDashUI();
                    return;
                }
                gameLost = true;
                updateSpoolUI();
                updateShieldUI();
                updateDashUI();
                const overlay = document.getElementById('loseOverlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                    // Preserve existing textContent so #resetButton child element remains intact
                }
            }

            drawMaze();
            return;
        }
        if (torchActive) {
            torchStepsRemaining--;
            if (torchStepsRemaining <= 0) {
                torchActive = false;
                torchStepsRemaining = 0;
            }
            updateTorchIndicator();
        }

        // Check for Minotaur collision (non-teleport step)
        if (playerX === minotaurX && playerY === minotaurY) {
            if (playerShields > 0) {
                triggerAegisRepel(true);
                updateDashUI();
                return;
            } else {
                gameLost = true;
                updateSpoolUI();
                updateShieldUI();
                updateDashUI();
                const overlay = document.getElementById('loseOverlay');
                if (overlay) overlay.style.display = 'flex';
                drawMaze();
                return;
            }
        }

        // Collect Hermes shrine on regular tile move
        collectHermesAt(playerX, playerY);
        updateDashUI();

        if (playerX === escapeX && playerY === escapeY) {
            gameWon = true;
            compassStepsRemaining = 0;
            updateSpoolUI();
            updateShieldUI();
            updateDashUI();
            const overlay = document.getElementById('winOverlay');
            overlay.textContent = formatWinSummary();
            overlay.style.display = 'flex';
        }
        drawMaze();
    }
}


// Add this to your initialization code
initMobileControls();
// Restart button on the defeat overlay reloads the game
document.getElementById('resetButton').addEventListener('click', () => {
    window.location.reload();
});
window.runThreadSmokeSpec = function() {
    // Snapshot all mutable state before running checks
    const savedPlayerX = playerX;
    const savedPlayerY = playerY;
    const savedEscapeX = escapeX;
    const savedEscapeY = escapeY;
    const savedPlayerSpools = playerSpools;
    const savedCompassStepsRemaining = compassStepsRemaining;
    const savedThreadSpools = threadSpools.map(s => ({ x: s.x, y: s.y }));
    const savedVisited = Array.from(visitedTiles);
    const savedMinotaurPath = minotaurPath.map(n => ({ x: n.x, y: n.y }));
    const savedMinotaurX = minotaurX;
    const savedMinotaurY = minotaurY;
    const savedMinotaurActive = minotaurActive;
    const savedMinotaurStunnedUntil = minotaurStunnedUntil;
    const savedKeys = keys.map(k => ({ x: k.x, y: k.y }));
    const savedGates = gates.map(g => ({ x: g.x, y: g.y }));
    const savedPlayerKeys = playerKeys;
    const savedTorchPickups = torchPickups.map(t => ({ x: t.x, y: t.y }));
    const savedTorchActive = torchActive;
    const savedTorchStepsRemaining = torchStepsRemaining;
    const savedAegisShrines = aegisShrines.map(a => ({ x: a.x, y: a.y }));
    const savedPlayerShields = playerShields;
    const savedGameWon = gameWon;
    const savedGameLost = gameLost;

    try {
        const st0 = window.getThreadState();
        const p1 = Array.isArray(st0.threadSpools) && st0.threadSpools.length >= 12 &&
            st0.threadSpools.every(s => s.y >= 0 && s.y < maze.length && s.x >= 0 && s.x < maze[0].length && maze[s.y][s.x] === 1);
        const nearStart = st0.threadSpools.filter(s => Math.abs(s.x - st0.playerX) + Math.abs(s.y - st0.playerY) <= 40).length >= 3;
        const p2 = nearStart && st0.threadSpools.every((s, i) => {
            const dist = (x, y) => Math.abs(x - s.x) + Math.abs(y - s.y);
            return dist(st0.playerX, st0.playerY) >= 5 &&
                dist(st0.escapeX, st0.escapeY) >= 5 &&
                keys.every(k => dist(k.x, k.y) >= 5) &&
                gates.every(g => dist(g.x, g.y) >= 5) &&
                torchPickups.every(t => dist(t.x, t.y) >= 5) &&
                secretPassages.every(p => dist(p.fromX, p.fromY) >= 5 && dist(p.toX, p.toY) >= 5) &&
                st0.threadSpools.every((o, j) => j === i || dist(o.x, o.y) >= 5);
        });
        const checkNoOpTKeys = () => {
            const pre = window.getThreadState();
            const prePathLen = minotaurPath.length;
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'T' }));
            const post = window.getThreadState();
            return window.activateThreadCompass() === false &&
                post.playerX === pre.playerX &&
                post.playerY === pre.playerY &&
                minotaurPath.length === prePathLen &&
                post.playerSpools === pre.playerSpools &&
                post.compassStepsRemaining === pre.compassStepsRemaining;
        };
        const p9Idle = st0.playerSpools === 0 && checkNoOpTKeys();
        const dirs = [
            { dx: 0, dy: -1, key: 'ArrowUp', mobile: 'up', opp: 'down' },
            { dx: 0, dy: 1, key: 'ArrowDown', mobile: 'down', opp: 'up' },
            { dx: -1, dy: 0, key: 'ArrowLeft', mobile: 'left', opp: 'right' },
            { dx: 1, dy: 0, key: 'ArrowRight', mobile: 'right', opp: 'left' }
        ];
        const validDir = dirs.find(d => {
            const nx = st0.playerX + d.dx, ny = st0.playerY + d.dy;
            return ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length && maze[ny][nx] === 1 &&
                !gates.some(g => g.x === nx && g.y === ny) &&
                !secretPassages.some(p => p.fromX === nx && p.fromY === ny);
        });
        let p4 = false, p5 = false, p6 = false, p9Active = false;
        if (validDir) {
            // Temporarily disable win condition
            escapeX = -1;
            escapeY = -1;
            const tx = st0.playerX + validDir.dx, ty = st0.playerY + validDir.dy;
            if (!threadSpools.some(s => s.x === tx && s.y === ty)) {
                threadSpools.push({ x: tx, y: ty });
            }
            const beforePickup = window.getThreadState();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.key }));
            const afterPickup = window.getThreadState();
            const counterEl = document.getElementById('spoolCounter');
            p4 = afterPickup.playerSpools === beforePickup.playerSpools + 1 && (!!counterEl && counterEl.textContent === 'Spools: ' + afterPickup.playerSpools);
            const activated = window.activateThreadCompass();
            const afterAct = window.getThreadState();
            const indEl = document.getElementById('compassIndicator');
            p5 = activated === true && afterAct.playerSpools === afterPickup.playerSpools - 1 && afterAct.compassStepsRemaining === 25 &&
                !!indEl && /^Compass: 25 \((Cold|Warm|Hot)\)$/.test(indEl.textContent) && indEl.classList.contains('active');
            // Assign p9Active without shadowing
            p9Active = afterAct.compassStepsRemaining === 25 && checkNoOpTKeys();
            handleMobileMove(validDir.opp);
            const afterMobile = window.getThreadState();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: validDir.key }));
            const afterKey = window.getThreadState();
            p6 = afterMobile.compassStepsRemaining === 24 && afterKey.compassStepsRemaining === 23;
            // Restore win condition
            escapeX = savedEscapeX;
            escapeY = savedEscapeY;
        }
        const p12 = Array.isArray(minotaurPath) && minotaurPath.every(n => n.y >= 0 && n.y < maze.length && n.x >= 0 && n.x < maze[0].length && maze[n.y][n.x] === 1);
        return { P1: p1, P2: p2, P4: p4, P5: p5, P6: p6, P9: p9Idle && p9Active, P12: p12 };
    } finally {
        // Restore all mutable state
        playerX = savedPlayerX;
        playerY = savedPlayerY;
        escapeX = savedEscapeX;
        escapeY = savedEscapeY;
        playerSpools = savedPlayerSpools;
        compassStepsRemaining = savedCompassStepsRemaining;
        minotaurX = savedMinotaurX;
        minotaurY = savedMinotaurY;
        minotaurActive = savedMinotaurActive;
        minotaurStunnedUntil = savedMinotaurStunnedUntil;
        playerKeys = savedPlayerKeys;
        torchActive = savedTorchActive;
        torchStepsRemaining = savedTorchStepsRemaining;
        playerShields = savedPlayerShields;
        gameWon = savedGameWon;
        gameLost = savedGameLost;

        // Restore arrays in-place
        threadSpools.length = 0;
        savedThreadSpools.forEach(s => threadSpools.push(s));
        window.threadSpools = threadSpools;

        minotaurPath.length = 0;
        savedMinotaurPath.forEach(n => minotaurPath.push(n));

        keys.length = 0;
        savedKeys.forEach(k => keys.push(k));

        gates.length = 0;
        savedGates.forEach(g => gates.push(g));

        torchPickups.length = 0;
        savedTorchPickups.forEach(t => torchPickups.push(t));

        aegisShrines.length = 0;
        savedAegisShrines.forEach(a => aegisShrines.push(a));
        window.aegisShrines = aegisShrines;

        // Restore visitedTiles
        visitedTiles.clear();
        savedVisited.forEach(k => visitedTiles.add(k));

        // Update HUD elements
        document.getElementById('uniqueTilesCounter').textContent = 'Unique Tiles: ' + visitedTiles.size;
        document.getElementById('keyCounter').textContent = 'Keys: ' + playerKeys;
        document.getElementById('winOverlay').style.display = gameWon ? 'flex' : 'none';
        document.getElementById('loseOverlay').style.display = gameLost ? 'flex' : 'none';
        updateTorchIndicator();
        updateSpoolUI();
        updateShieldUI();
        drawMaze();
    }
};