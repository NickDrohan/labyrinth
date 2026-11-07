(function () {
  'use strict';

  // Module state
  let spriteGroup = null;
  let attachedScene = null;
  let planeGeo = null;
  let kindTextures = {};
  let spritePool = [];
  let activeSprites = 0;

  // Procedural texture generators
  function getKindTexture (THREE, kind) {
    if (kindTextures[kind]) {
      return kindTextures[kind];
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    switch (kind) {
      case 'minotaur':
        // Horned diamond silhouette
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.lineTo(20, 32);
        ctx.lineTo(32, 54);
        ctx.lineTo(44, 32);
        ctx.closePath();
        ctx.fill();
        
        // Add horns
        ctx.fillStyle = 'white';
        ctx.fillRect(22, 8, 2, 6);
        ctx.fillRect(40, 8, 2, 6);
        break;
      
      case 'escape':
        // Glowing arch portal
        ctx.fillStyle = 'white';
        ctx.fillRect(10, 20, 44, 24);
        
        // Gold glow effect
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'gold');
        gradient.addColorStop(1, 'white');
        ctx.fillStyle = gradient;
        ctx.fillRect(10, 20, 44, 24);
        break;
      
      case 'pickup':
        // Glowing relic orb with bright core
        const coreGradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        coreGradient.addColorStop(0, 'white');
        coreGradient.addColorStop(1, '#888');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        glowGradient.addColorStop(0, 'white');
        glowGradient.addColorStop(0.7, 'white');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();
        break;
      
      default:
        // Default to a simple circle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    kindTextures[kind] = texture;
    return texture;
  }

  // Main sync function
  function syncSprites (rendererApi, entities, camera) {
    if (!rendererApi || !rendererApi.THREE || !rendererApi.scene) {
      return 0;
    }

    // Lazy initialization
    if (!planeGeo) {
      planeGeo = new rendererApi.THREE.PlaneGeometry(0.65, 0.65);
    }
    if (!spriteGroup) {
      spriteGroup = new rendererApi.THREE.Group();
      rendererApi.scene.add(spriteGroup);
      attachedScene = rendererApi.scene;
    }

    const list = Array.isArray(entities) ? entities : [];
    
    // Process entities
    for (let i = 0; i < list.length; i++) {
      const ent = list[i];
      let mesh = spritePool[i];
      
      // Create new mesh if needed
      if (!mesh) {
        const material = new rendererApi.THREE.MeshBasicMaterial({
          transparent: true,
          alphaTest: 0.05,
          depthWrite: false,
          side: rendererApi.THREE.DoubleSide
        });
        mesh = new rendererApi.THREE.Mesh(planeGeo, material);
        spritePool.push(mesh);
        spriteGroup.add(mesh);
      }
      
      // Configure mesh
      mesh.material.map = getKindTexture(rendererApi.THREE, ent.kind || 'pickup');
      mesh.material.color.setHex(typeof ent.color === 'number' ? ent.color : 0xffffff);
      mesh.material.needsUpdate = true;
      
      // Scale and position based on kind
      switch (ent.kind) {
        case 'escape':
          mesh.scale.set(0.85, 0.95, 1);
          mesh.position.set(ent.x + 0.5, 0.48, ent.y + 0.5);
          break;
        case 'minotaur':
          mesh.scale.set(0.8, 0.85, 1);
          mesh.position.set(ent.x + 0.5, 0.46, ent.y + 0.5);
          break;
        default: // pickup
          mesh.scale.set(0.45, 0.45, 1);
          mesh.position.set(ent.x + 0.5, 0.38, ent.y + 0.5);
      }
      
      // Orient towards camera
      if (camera && camera.position) {
        mesh.lookAt(camera.position.x, mesh.position.y, camera.position.z);
      }
      
      mesh.visible = true;
    }
    
    // Hide unused meshes
    for (let i = list.length; i < spritePool.length; i++) {
      spritePool[i].visible = false;
    }
    
    activeSprites = list.length;
    return activeSprites;
  }

  // Reset function
  function onReset () {
    spritePool.forEach(mesh => {
      mesh.visible = false;
    });
    activeSprites = 0;
  }

  // Dispose function
  function dispose () {
    if (spriteGroup && attachedScene) {
      attachedScene.remove(spriteGroup);
    }
    
    if (planeGeo) {
      planeGeo.dispose();
      planeGeo = null;
    }
    
    // Dispose materials and textures
    spritePool.forEach(mesh => {
      if (mesh.material) {
        mesh.material.dispose();
      }
    });
    
    // Clear textures
    Object.values(kindTextures).forEach(texture => {
      texture.dispose();
    });
    kindTextures = {};
    
    spritePool = [];
    spriteGroup = null;
    attachedScene = null;
  }

  // Diagnostics function
  function getDiagnostics () {
    return {
      activeSprites,
      spritePoolSize: spritePool.length
    };
  }

  // Attach to window
  window.MazeThreeSprites = {
    syncSprites,
    onReset,
    dispose,
    getDiagnostics
  };
})();
