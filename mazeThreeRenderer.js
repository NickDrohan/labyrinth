const THREE_MODULE_URL = 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

let THREE = null;
let loadPromise = null;
let initPromise = null;
let renderer = null;
let scene = null;
let camera = null;
let playerLight = null;
let threeCanvas = null;
let ready = false;
let loading = false;
let lastError = null;
let frameCount = 0;
let resetCount = 0;
let lastRenderInfo = { calls: 0, triangles: 0, points: 0, lines: 0 };
let lastMemoryInfo = { geometries: 0, textures: 0 };

function loadThree() {
    if (!loadPromise) {
        loadPromise = import(/* @vite-ignore */ THREE_MODULE_URL).then(module => {
            THREE = module;
            return module;
        }).catch(error => {
            loadPromise = null;
            throw error;
        });
    }
    return loadPromise;
}

function ensureCanvas() {
    const gameCanvas = document.getElementById('gameCanvas');
    let container = document.querySelector('.canvas-container');
    if (!container) {
        if (!gameCanvas || !gameCanvas.parentNode) throw new Error('Missing #gameCanvas container');
        container = document.createElement('div');
        container.className = 'canvas-container';
        gameCanvas.parentNode.insertBefore(container, gameCanvas);
        container.appendChild(gameCanvas);
    }

    const matches = document.querySelectorAll('#threeCanvas');
    threeCanvas = matches.length ? matches[0] : document.createElement('canvas');
    for (let i = 1; i < matches.length; i += 1) matches[i].remove();
    threeCanvas.id = 'threeCanvas';
    threeCanvas.width = 800;
    threeCanvas.height = 800;
    threeCanvas.setAttribute('aria-hidden', 'true');
    if (threeCanvas !== gameCanvas && threeCanvas.parentNode !== container) {
        threeCanvas.remove();
        container.insertBefore(threeCanvas, gameCanvas && gameCanvas.parentNode === container ? gameCanvas : null);
    } else if (!threeCanvas.parentNode) {
        container.insertBefore(threeCanvas, gameCanvas && gameCanvas.parentNode === container ? gameCanvas : null);
    }
    if (threeCanvas === gameCanvas) throw new Error('#threeCanvas must be distinct from #gameCanvas');
    return threeCanvas;
}

function init() {
    if (ready && renderer) return Promise.resolve(api);
    if (initPromise) return initPromise;
    loading = true;
    lastError = null;
    initPromise = (async function() {
        try {
            await loadThree();
            const canvas = ensureCanvas();
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(800, 800, false);
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x101610);
            scene.fog = new THREE.FogExp2(0x101610, 0.09);
            camera = new THREE.PerspectiveCamera(72, 1, 0.1, 32);
            const ambient = new THREE.AmbientLight(0xffffff, 0.72);
            playerLight = new THREE.PointLight(0xffd99a, 1.8, 10);
            scene.add(ambient);
            scene.add(playerLight);
            ready = true;
            setVisible(false);
            return api;
        } catch (error) {
            ready = false;
            lastError = error;
            if (renderer) {
                try { renderer.dispose(); } catch (_) { /* best-effort cleanup */ }
                renderer = null;
            }
            scene = null;
            camera = null;
            playerLight = null;
            setVisible(false);
            return api;
        } finally {
            loading = false;
            initPromise = null;
        }
    })();
    return initPromise;
}

function syncCamera(snapshot) {
    if (!ready || !camera || !snapshot) return;
    const x = snapshot.playerX + 0.5;
    const z = snapshot.playerY + 0.5;
    camera.position.set(x, 0.52, z);
    camera.lookAt(x + snapshot.dirX, 0.52, z + snapshot.dirY);
    const radius = Math.max(1, Number(snapshot.effRadius) || 1);
    const flare = Boolean(snapshot.solarFlareActive);
    if (playerLight) {
        playerLight.position.set(x, 0.8, z);
        playerLight.distance = radius * (flare ? 1.8 : 1.25);
        playerLight.intensity = flare ? 2.5 : 1.8;
    }
    if (scene && THREE) {
        scene.fog = new THREE.FogExp2(0x101610, (flare ? 0.035 : 0.12) / radius);
    }
}

function setVisible(visible) {
    if (!threeCanvas) {
        const existing = document.getElementById('threeCanvas');
        if (existing) threeCanvas = existing;
    }
    if (threeCanvas) threeCanvas.style.display = visible ? 'block' : 'none';
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) gameCanvas.classList.toggle('three-active', Boolean(visible && ready));
}

function render() {
    if (!ready || !renderer || !scene || !camera) return false;
    try {
        renderer.render(scene, camera);
        frameCount += 1;
        const info = renderer.info;
        const renderInfo = info && info.render;
        const memoryInfo = info && info.memory;
        lastRenderInfo = {
            calls: renderInfo ? renderInfo.calls || 0 : 0,
            triangles: renderInfo ? renderInfo.triangles || 0 : 0,
            points: renderInfo ? renderInfo.points || 0 : 0,
            lines: renderInfo ? renderInfo.lines || 0 : 0
        };
        lastMemoryInfo = {
            geometries: memoryInfo ? memoryInfo.geometries || 0 : 0,
            textures: memoryInfo ? memoryInfo.textures || 0 : 0
        };
        return true;
    } catch (error) {
        ready = false;
        lastError = error;
        setVisible(false);
        return false;
    }
}

function disposeObjectResources(root) {
    if (!root) return;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    root.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach(material => {
            if (!material) return;
            materials.add(material);
            Object.keys(material).forEach(key => {
                const value = material[key];
                if (value && value.isTexture) textures.add(value);
            });
        });
    });
    textures.forEach(texture => texture.dispose());
    materials.forEach(material => material.dispose());
    geometries.forEach(geometry => geometry.dispose());
}

function onReset() {
    resetCount += 1;
    ensureCanvas();
    setVisible(false);
}

function dispose() {
    ready = false;
    loading = false;
    if (scene) disposeObjectResources(scene);
    if (renderer) {
        try { renderer.dispose(); } catch (_) { /* best-effort cleanup */ }
        if (typeof renderer.forceContextLoss === 'function') {
            try { renderer.forceContextLoss(); } catch (_) { /* best-effort cleanup */ }
        }
    }
    renderer = null;
    scene = null;
    camera = null;
    playerLight = null;
    initPromise = null;
    setVisible(false);
}

function getDiagnostics() {
    const gameCanvas = document.getElementById('gameCanvas');
    return {
        backend: ready ? 'three' : 'pixi-fallback',
        threeVersion: THREE ? THREE.REVISION : null,
        pinnedUrl: THREE_MODULE_URL,
        ready: Boolean(ready),
        loading: Boolean(loading),
        lastError: lastError ? String(lastError) : null,
        canvasId: 'threeCanvas',
        canvasVisible: Boolean(threeCanvas && threeCanvas.style.display !== 'none'),
        canvasCount: document.querySelectorAll('#threeCanvas').length,
        distinctFromGameCanvas: Boolean(threeCanvas && threeCanvas !== gameCanvas),
        frameCount: frameCount,
        resetCount: resetCount,
        drawCalls: lastRenderInfo.calls,
        triangles: lastRenderInfo.triangles,
        points: lastRenderInfo.points,
        lines: lastRenderInfo.lines,
        geometries: lastMemoryInfo.geometries,
        textures: lastMemoryInfo.textures
    };
}

const api = {
    init: init,
    ensureCanvas: ensureCanvas,
    syncCamera: syncCamera,
    setVisible: setVisible,
    render: render,
    onReset: onReset,
    dispose: dispose,
    getDiagnostics: getDiagnostics,
    isReady: function() { return Boolean(ready); },
    get scene() { return scene; },
    get camera() { return camera; },
    get THREE() { return THREE; }
};
window.MazeThreeRenderer = api;

