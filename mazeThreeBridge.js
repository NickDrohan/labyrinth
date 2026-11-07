(function () {
  'use strict';

  // Module state
  let fpBackendPreference = 'three';
  let initRequested = false;

  // ensureInitialized: lazily start MazeThreeRenderer.init() and wire the drawMaze callback
  function ensureInitialized() {
    if (!window.MazeThreeRenderer || typeof window.MazeThreeRenderer.init !== 'function') return;
    if (!initRequested && !window.MazeThreeRenderer.isReady()) {
      initRequested = true;
      window.MazeThreeRenderer.init()
        .then(() => {
          if (typeof drawMaze === 'function' && typeof viewMode !== 'undefined' && viewMode === 'fp' && fpBackendPreference === 'three') {
            drawMaze();
          }
        })
        .catch(() => {});
    }
  }

  // syncToggleViewButton: update #toggleViewButton text based on mode and backend
  function syncToggleViewButton() {
    if (typeof viewMode !== 'undefined') {
      const btn = document.getElementById('toggleViewButton');
      if (!btn) return;
      if (viewMode === 'map') {
        btn.textContent = 'View: Overhead Map (M)';
      } else if (fpBackendPreference === 'pixi') {
        btn.textContent = 'View: 2.5D + Minimap (M)';
      } else {
        btn.textContent = 'View: 3D + Minimap (M)';
      }
    }
  }

  // renderThreeFpFrame: coordinate Three.js render or fall back to PIXI
  function renderThreeFpFrame(snapshot) {
    if (fpBackendPreference === 'three') { ensureInitialized(); }
    if (fpBackendPreference !== 'three' || !window.MazeThreeRenderer || !window.MazeThreeRenderer.isReady()) {
      if (window.MazeThreeRenderer) window.MazeThreeRenderer.setVisible(false);
      return { rendered: false, backend: 'pixi-fallback', preference: fpBackendPreference };
    }
    window.MazeThreeRenderer.ensureCanvas();
    window.MazeThreeRenderer.syncCamera(snapshot);
    if (window.MazeThreeWorld) window.MazeThreeWorld.syncWorld(window.MazeThreeRenderer, snapshot);
    if (window.MazeThreeSprites) window.MazeThreeSprites.syncSprites(window.MazeThreeRenderer, snapshot ? snapshot.entities : [], window.MazeThreeRenderer.camera);
    const ok = window.MazeThreeRenderer.render();
    window.MazeThreeRenderer.setVisible(ok);
    return { rendered: Boolean(ok), backend: ok ? 'three' : 'pixi-fallback', preference: fpBackendPreference };
  }

  // onViewModeChange: hide Three.js canvas when not in fp mode
  function onViewModeChange(mode) {
    if (mode !== 'fp' && window.MazeThreeRenderer) {
      window.MazeThreeRenderer.setVisible(false);
    }
  }

  // onReset: clean up all Three.js sub-systems
  function onReset() {
    if (window.MazeThreeWorld && typeof window.MazeThreeWorld.onReset === 'function') window.MazeThreeWorld.onReset();
    if (window.MazeThreeSprites && typeof window.MazeThreeSprites.onReset === 'function') window.MazeThreeSprites.onReset();
    if (window.MazeThreeRenderer && typeof window.MazeThreeRenderer.onReset === 'function') window.MazeThreeRenderer.onReset();
    ensureInitialized();
  }

  // toggleFpBackend: toggle between 'three' and 'pixi' render backends
  function toggleFpBackend(forceBackend) {
    if (forceBackend === 'three' || forceBackend === 'pixi') {
      fpBackendPreference = forceBackend;
    } else {
      fpBackendPreference = (fpBackendPreference === 'three') ? 'pixi' : 'three';
    }
    // If switched away from 'three' or in 'map' mode, hide Three.js canvas
    if (fpBackendPreference !== 'three' || (typeof viewMode !== 'undefined' && viewMode !== 'fp')) {
      if (window.MazeThreeRenderer) window.MazeThreeRenderer.setVisible(false);
    }
    syncToggleViewButton();
    // If fpBackendPreference === 'three', call ensureInitialized before drawMaze
    if (fpBackendPreference === 'three') {
      ensureInitialized();
    }
    if (typeof drawMaze === 'function') drawMaze();
    return fpBackendPreference;
  }

  // getDiagnostics: return state of bridge and sub-systems
  function getDiagnostics() {
    return {
      preference: fpBackendPreference,
      renderer: window.MazeThreeRenderer ? window.MazeThreeRenderer.getDiagnostics() : null,
      world: window.MazeThreeWorld ? window.MazeThreeWorld.getDiagnostics() : null,
      sprites: window.MazeThreeSprites ? window.MazeThreeSprites.getDiagnostics() : null
    };
  }

  // getBridgeDiagnostics: alias for getDiagnostics, also exposed on window
  function getBridgeDiagnostics() {
    return getDiagnostics();
  }

  // Expose bridge and global toggle
  window.MazeThreeBridge = {
    renderThreeFpFrame,
    onViewModeChange,
    onReset,
    toggleFpBackend,
    getPreference: function() { return fpBackendPreference; },
    getDiagnostics,
    getBridgeDiagnostics
  };
  window.toggleFpBackend = toggleFpBackend;
  window.getBridgeDiagnostics = getBridgeDiagnostics;

})();


