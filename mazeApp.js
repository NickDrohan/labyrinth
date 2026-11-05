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
    const recallBtn = document.getElementById('recallButton');
    if (recallBtn) {
        recallBtn.addEventListener('click', function() {
            triggerChronosRecall();
            document.getElementById('gameCanvas').focus();
        });
    }
    const flareBtn = document.getElementById('flareButton');
    if (flareBtn) {
        flareBtn.addEventListener('click', function() {
            triggerSolarFlare();
            document.getElementById('gameCanvas').focus();
        });
    }
    const breachBtn = document.getElementById('breachButton');
    if (breachBtn) {
        breachBtn.addEventListener('click', function() {
            triggerWallBreach();
            document.getElementById('gameCanvas').focus();
        });
    }
    const decoyBtn = document.getElementById('decoyButton');
    if (decoyBtn) {
        decoyBtn.addEventListener('click', function() {
            triggerSirenDecoy();
            document.getElementById('gameCanvas').focus();
        });
    }
    const owlBtn = document.getElementById('owlButton');
    if (owlBtn) {
        owlBtn.addEventListener('click', function() {
            triggerOwlClairvoyance();
            document.getElementById('gameCanvas').focus();
        });
    }
    const tridentBtn = document.getElementById('tridentButton');
    if (tridentBtn) {
        tridentBtn.addEventListener('click', function() {
            triggerRiptideSurge();
            document.getElementById('gameCanvas').focus();
        });
    }

    const arrowBtn = document.getElementById('arrowButton');
    if (arrowBtn) {
        arrowBtn.addEventListener('click', function() {
            triggerSilverArrow();
            document.getElementById('gameCanvas').focus();
        });
    }
});
// Helper to show and fade banner messages
let secretPassageMsgTimeout = null;
let secretPassageFadeTimeout = null;

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
let repelFlashUntil = 0;
const MINOTAUR_STUN_MS = 4000;
const MINOTAUR_REPEL_STEPS = 12;
let daedalusShrines = [];
window.daedalusShrines = daedalusShrines;
let breachedTiles = [];
window.breachedTiles = breachedTiles;
let playerBreaches = 0;
const MAX_BREACHES = 3;
const DAEDALUS_SHRINE_COUNT = 16;
const BREACH_STUN_MS = 4000;
let breachFlashUntil = 0;

let icarusShrines = [];
window.icarusShrines = icarusShrines;
let playerFlares = 0;
const MAX_FLARES = 3;
const ICARUS_SHRINE_COUNT = 16;
let solarFlareStepsRemaining = 0;
const SOLAR_FLARE_STEPS = 20;
const SOLAR_FLARE_RADIUS = 22;
const SOLAR_FLARE_STUN_MS = 6000;
let solarFlareFlashUntil = 0;

let orpheusShrines = [];
window.orpheusShrines = orpheusShrines;
let playerDecoys = 0;
const MAX_DECOYS = 3;
const ORPHEUS_SHRINE_COUNT = 16;
const DECOY_DURATION_STEPS = 18;
const DECOY_VISION_RADIUS = 12;
const DECOY_STUN_MS = 5000;
let activeDecoy = null;
window.activeDecoy = activeDecoy;
let decoyFlashUntil = 0;

let athenaShrines = [];
window.athenaShrines = athenaShrines;
let playerOwls = 0;
const MAX_OWLS = 3;
const ATHENA_SHRINE_COUNT = 16;
const OWL_VISION_STEPS = 22;
const OWL_GLARE_DIST = 10;
const OWL_GLARE_STUN_MS = 3000;
let owlStepsRemaining = 0;
let owlFlashUntil = 0;
let owlEscapePreview = [];

let poseidonShrines = [];
window.poseidonShrines = poseidonShrines;
let playerTridents = 0;
const MAX_TRIDENTS = 3;
const POSEIDON_SHRINE_COUNT = 16;
const RIPTIDE_MAX_STEPS = 6;
const RIPTIDE_STUN_MS = 4000;
const RIPTIDE_PUSH_STEPS = 8;
let riptideTrail = [];
let riptideFlashUntil = 0;

let artemisShrines = [];
window.artemisShrines = artemisShrines;
let playerArrows = 0;
const MAX_ARROWS = 3;
const ARTEMIS_SHRINE_COUNT = 16;
const ARROW_MAX_RANGE = 14;
const ARROW_VISION_STEPS = 10;
const ARROW_STUN_MS = 5500;
const ARROW_PUSH_STEPS = 6;
let arrowVisionStepsRemaining = 0;
let arrowTrail = [];
let arrowFlashUntil = 0;

let chronosShrines = [];
window.chronosShrines = chronosShrines;
let playerRecalls = 0;
const MAX_RECALLS = 3;
const CHRONOS_SHRINE_COUNT = 16;
const CHRONOS_STUN_MS = 5000;
let chronosAnchor = null;
let recallFlashUntil = 0;
let hermesShrines = [];
window.hermesShrines = hermesShrines;
let playerDashes = 0;
const MAX_DASHES = 3;
const HERMES_SHRINE_COUNT = 16;
let lastMoveDir = { dx: 1, dy: 0 };
let dashTrail = [];
let dashTrailUntil = 0;
let steps = 0;
let gameLost = false;

const visitedTiles = new Set();
const keys = [];
const gates = [];
let playerKeys = 0;

// Escape tile position and win state globals
let escapeX = -1;
let escapeY = -1;
let gameWon = false;

window.triggerAegisRepel = triggerAegisRepel;
window.triggerPhaseDash = triggerPhaseDash;

const collectDashAt = collectHermesAt;

window.triggerChronosRecall = triggerChronosRecall;

window.triggerWallBreach = triggerWallBreach;
window.triggerSolarFlare = triggerSolarFlare;
let _pathParent = null, _pathStamp = null, _pathQueue = null, _pathGen = 0;

window.triggerSirenDecoy = triggerSirenDecoy;
window.advanceMinotaurLure = advanceMinotaurLure;
window.activateThreadCompass = activateThreadCompass;
window.triggerOwlClairvoyance = triggerOwlClairvoyance;
window.triggerRiptideSurge = triggerRiptideSurge;
window.triggerSilverArrow = triggerSilverArrow;

let cameraMode = 'center';
const maze = generateMaze(1000, 1000);

document.getElementById('resetButton').addEventListener('click', () => {
    initGame();
});

initMobileControls();
