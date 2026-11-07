
window.collectM0Probe = async function() {
  const savedMode = typeof viewMode !== 'undefined' ? viewMode : 'fp';
  const minotaurIntervalRunning = minotaurInterval !== null;
  const stylesCssStatus = (await fetch('styles.css')).status;
  const winEl = document.getElementById('winOverlay');
  const loseEl = document.getElementById('loseOverlay');
  const winStyle = winEl ? getComputedStyle(winEl) : null;
  const loseStyle = loseEl ? getComputedStyle(loseEl) : null;
  window.toggleViewMode('fp');
  const fpMode = {
    maskIsMinimapMask: mazeGraphics.mask === fpGraphics._minimapMask,
    maskVisible: fpGraphics._minimapMask ? fpGraphics._minimapMask.visible : undefined
  };
  window.toggleViewMode('map');
  const mapMode = {
    mask: mazeGraphics.mask,
    maskVisible: fpGraphics._minimapMask ? fpGraphics._minimapMask.visible : undefined
  };
  window.toggleViewMode(savedMode);
  return {
    styleSheets: [...document.styleSheets].map(s => s.href),
    stylesCssStatus,
    winOverlay: winStyle ? { position: winStyle.position, zIndex: winStyle.zIndex } : null,
    loseOverlay: loseStyle ? { position: loseStyle.position, zIndex: loseStyle.zIndex } : null,
    pixiVersion: typeof PIXI !== 'undefined' ? PIXI.VERSION : null,
    fpMode,
    mapMode,
    minotaurIntervalRunning,
    minotaurIntervalNotNull: minotaurInterval !== null
  };
};
