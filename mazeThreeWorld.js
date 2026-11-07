(function () {
  'use strict';

  // Module state
  let worldGroup = null;
  let attachedScene = null;
  let floorMesh = null;
  let ceilingMesh = null;
  let boxGeo = null;
  let planeGeo = null;
  let materials = null;
  let textures = [];
  let meshPool = [];
  let activeWallMeshes = 0;
  let activeGateMeshes = 0;

  // Procedural texture generator
  function createProceduralTexture (THREE, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (drawFn) drawFn(ctx, canvas);
    const tex = new THREE.CanvasTexture(canvas);
    textures.push(tex);
    return tex;
  }

  // Ensure Three.js resources are available
  function ensureResources (rendererApi) {
    if (!rendererApi || !rendererApi.THREE || !rendererApi.scene) return false;
    const THREE = rendererApi.THREE;
    if (!boxGeo) boxGeo = new THREE.BoxGeometry(1, 1, 1);
    if (!planeGeo) planeGeo = new THREE.PlaneGeometry(64, 64);
    if (!materials) materials = createMaterials(THREE);
    createWorldGroup(rendererApi);
    return true;
  }

  // Create procedural materials
  function createMaterials (THREE) {
    const floorTexture = createProceduralTexture(THREE, function (ctx, canvas) {
      ctx.fillStyle = '#c8d0dc';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#9aa4b4';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 8, 0);
        ctx.lineTo(i * 8, 64);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 8);
        ctx.lineTo(64, i * 8);
        ctx.stroke();
      }
    });
    const floorMat = new THREE.MeshLambertMaterial({
      map: floorTexture,
      color: 0x162038
    });

    const ceilingTexture = createProceduralTexture(THREE, function (ctx, canvas) {
      ctx.fillStyle = '#0c1022';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#5a6b7d';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 12 + 2, 0);
        ctx.lineTo(i * 12 + 2, 64);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 12 + 2);
        ctx.lineTo(64, i * 12 + 2);
        ctx.stroke();
      }
    });
    const ceilingMat = new THREE.MeshLambertMaterial({
      map: ceilingTexture,
      color: 0x0c1022
    });

    const wallTexture = createProceduralTexture(THREE, function (ctx, canvas) {
      ctx.fillStyle = '#1888b8';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#4a5a6a';
      ctx.lineWidth = 0.75;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, 0);
        ctx.lineTo(i * 10, 64);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 10);
        ctx.lineTo(64, i * 10);
        ctx.stroke();
      }
    });
    const wallMat = new THREE.MeshLambertMaterial({
      map: wallTexture,
      color: 0x1888b8
    });

    const breachWallTexture = createProceduralTexture(THREE, function (ctx, canvas) {
      ctx.fillStyle = '#cc5522';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#552211';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(64, 64);
      ctx.moveTo(64, 0);
      ctx.lineTo(0, 64);
      ctx.stroke();
      ctx.fillStyle = '#331100';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(10, 10, 44, 44);
      ctx.globalAlpha = 1.0;
    });
    const breachWallMat = new THREE.MeshLambertMaterial({
      map: breachWallTexture,
      color: 0xcc5522,
      emissive: 0x331100
    });

    const gateTexture = createProceduralTexture(THREE, function (ctx, canvas) {
      ctx.fillStyle = '#1e55ff';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#0a2266';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(48, 64);
      ctx.moveTo(48, 0);
      ctx.lineTo(16, 64);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('GATE', 8, 32);
      ctx.globalAlpha = 1.0;
    });
    const gateMat = new THREE.MeshLambertMaterial({
      map: gateTexture,
      color: 0x1e55ff,
      emissive: 0x0a2266
    });

    return { floorMat, ceilingMat, wallMat, breachWallMat, gateMat };
  }

  // Create world group and floor/ceiling meshes
  function createWorldGroup (rendererApi) {
    const THREE = rendererApi.THREE;
    if (!worldGroup || attachedScene !== rendererApi.scene) {
      if (worldGroup) {
        attachedScene.remove(worldGroup);
      }
      worldGroup = new THREE.Group();
      floorMesh = new THREE.Mesh(planeGeo, materials.floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = 0;
      ceilingMesh = new THREE.Mesh(planeGeo, materials.ceilingMat);
      ceilingMesh.rotation.x = Math.PI / 2;
      ceilingMesh.position.y = 1.0;
      worldGroup.add(floorMesh);
      worldGroup.add(ceilingMesh);
      rendererApi.scene.add(worldGroup);
      attachedScene = rendererApi.scene;
    }
  }

  // Sync the world with a snapshot
  function syncWorld (rendererApi, snapshot) {
    const THREE = rendererApi.THREE;
    if (!ensureResources(rendererApi) || !snapshot) return { activeWallMeshes: 0, activeGateMeshes: 0 };

    // Update floor material color based on state
    const floorColor = snapshot.solarFlareActive
      ? 0x3a3218
      : snapshot.compassActive
        ? 0x0e3545
        : 0x162038;
    materials.floorMat.color.setHex(floorColor);

    // Position floor and ceiling
    floorMesh.position.set(snapshot.playerX + 0.5, 0, snapshot.playerY + 0.5);
    ceilingMesh.position.set(snapshot.playerX + 0.5, 1.0, snapshot.playerY + 0.5);

    // Compute clamped scan radius
    const R = Math.min(24, Math.max(8, Math.ceil(Number(snapshot.effRadius) || 8) + 2));

    // Reset pooled mesh counters
    let poolIdx = 0;
    activeWallMeshes = 0;
    activeGateMeshes = 0;

    // Scan tiles around the player
    for (let my = snapshot.playerY - R; my <= snapshot.playerY + R; my++) {
      for (let mx = snapshot.playerX - R; mx <= snapshot.playerX + R; mx++) {
        // Determine tile kind
        let tileKind = 'wall';
        if (Array.isArray(snapshot.gates) && snapshot.gates.some(g => g.x === mx && g.y === my)) {
          tileKind = 'gate';
        } else if (typeof snapshot.maze !== 'undefined' && typeof snapshot.maze[my] !== 'undefined' && snapshot.maze[my][mx] === 1) {
          tileKind = 'open';
        }

        // Skip open tiles
        if (tileKind === 'open') continue;

        // For wall tiles, check 4-neighbors for culling
        if (tileKind === 'wall') {
          let hasOpenNeighbor = false;
          const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dx, dy] of neighbors) {
            const nx = mx + dx;
            const ny = my + dy;
            if (typeof snapshot.maze !== 'undefined' && typeof snapshot.maze[ny] !== 'undefined' && snapshot.maze[ny][nx] === 1) {
              hasOpenNeighbor = true;
              break;
            }
          }
          if (!hasOpenNeighbor) continue;
        }

        // Acquire or create a pooled mesh
        let mesh = meshPool[poolIdx];
        if (!mesh) {
          mesh = new THREE.Mesh(boxGeo, materials.wallMat);
          meshPool[poolIdx] = mesh;
          worldGroup.add(mesh);
        }

        mesh.position.set(mx + 0.5, 0.5, my + 0.5);
        mesh.visible = true;

        // Assign appropriate material
        let mat = materials.wallMat;
        if (tileKind === 'gate') {
          mat = materials.gateMat;
        } else if (Array.isArray(snapshot.breachedTiles) && snapshot.breachedTiles.some(b => Math.abs(b.x - mx) + Math.abs(b.y - my) <= 1)) {
          mat = materials.breachWallMat;
        }
        mesh.material = mat;

        if (tileKind === 'gate') {
          activeGateMeshes++;
        } else {
          activeWallMeshes++;
        }

        poolIdx++;
      }
    }

    // Hide unused pooled meshes
    for (let i = poolIdx; i < meshPool.length; i++) {
      meshPool[i].visible = false;
    }

    return { activeWallMeshes, activeGateMeshes };
  }

  // Reset: hide all pooled meshes and reset counts
  function onReset () {
    meshPool.forEach(m => {
      m.visible = false;
    });
    activeWallMeshes = 0;
    activeGateMeshes = 0;
  }

  // Dispose: remove worldGroup, dispose geometries, materials, textures
  function dispose () {
    if (worldGroup && attachedScene) {
      attachedScene.remove(worldGroup);
    }
    if (boxGeo) {
      boxGeo.dispose();
      boxGeo = null;
    }
    if (planeGeo) {
      planeGeo.dispose();
      planeGeo = null;
    }
    if (materials) {
      Object.values(materials).forEach(m => {
        if (m.map) m.map.dispose();
      });
      Object.values(materials).forEach(m => {
        m.dispose();
      });
      materials = null;
    }
    if (textures.length) {
      textures.forEach(t => t.dispose());
      textures = [];
    }
    meshPool = [];
    worldGroup = null;
    attachedScene = null;
    floorMesh = null;
    ceilingMesh = null;
    activeWallMeshes = 0;
    activeGateMeshes = 0;
  }

  // Get diagnostics
  function getDiagnostics () {
    return { activeWallMeshes, activeGateMeshes, poolSize: meshPool.length };
  }

  window.MazeThreeWorld = {
    init: function (rendererApi) {
      const THREE = rendererApi.THREE;
      if (!rendererApi || !rendererApi.scene) return;
      boxGeo = new THREE.BoxGeometry(1, 1, 1);
      planeGeo = new THREE.PlaneGeometry(64, 64);
      materials = createMaterials(THREE);
      createWorldGroup(rendererApi);
    },
    syncWorld: syncWorld,
    onReset: onReset,
    dispose: dispose,
    getDiagnostics: getDiagnostics
  };

})();


