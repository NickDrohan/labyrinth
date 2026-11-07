
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
function getDirectionArrow() {
  if (!lastMoveDir || typeof lastMoveDir !== 'object') return '→';
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

function updateBreachUI() {
  const rawArrow = getDirectionArrow();
  const arrow = ['↑', '↓', '←', '→'].includes(rawArrow) ? rawArrow : '→';
  const counter = document.getElementById('breachCounter');
  if (counter) {
    counter.textContent = `Breaches: ${playerBreaches} (${arrow})`;
    counter.classList.toggle('ready', Boolean(playerBreaches > 0 && canBreachFacingWall()));
  }
  const button = document.getElementById('breachButton');
  if (button) {
    button.disabled = Boolean(playerBreaches <= 0 || gameWon || gameLost);
  }
}

function updateTridentUI() {
  const c = document.getElementById('tridentCounter');
  if (c) {
    c.textContent = 'Tridents: ' + playerTridents + ' (' + getDirectionArrow() + ')';
    c.classList.toggle('ready', Boolean(playerTridents > 0 && typeof canSurgeInFacingDir === 'function' && canSurgeInFacingDir()));
  }
  const b = document.getElementById('tridentButton');
  if (b) {
    b.disabled = Boolean(playerTridents <= 0 || gameWon || gameLost);
  }
}

function updateArrowUI() {
  const c = document.getElementById('arrowCounter');
  if (c) {
    c.textContent = 'Arrows: ' + playerArrows + (arrowVisionStepsRemaining > 0 ? ' (Sight: ' + arrowVisionStepsRemaining + ')' : ' (' + getDirectionArrow() + ')');
    c.classList.toggle('ready', Boolean((playerArrows > 0 && typeof canFireArrowInFacingDir === 'function' && canFireArrowInFacingDir()) || arrowVisionStepsRemaining > 0));
  }
  const b = document.getElementById('arrowButton');
  if (b) {
    b.disabled = Boolean(playerArrows <= 0 || gameWon || gameLost);
  }
}

function updateChariotUI() {
  const c = document.getElementById('chariotCounter');
  if (c) {
    c.textContent = 'Chariots: ' + playerChariots + (chariotTrailStepsRemaining > 0 ? ' (Blaze: ' + chariotTrailStepsRemaining + ')' : ' (' + getDirectionArrow() + ')');
    c.classList.toggle('ready', Boolean((playerChariots > 0 && typeof canChargeChariotInFacingDir === 'function' && canChargeChariotInFacingDir()) || chariotTrailStepsRemaining > 0));
  }
  const b = document.getElementById('chariotButton');
  if (b) {
    b.disabled = Boolean(playerChariots <= 0 || gameWon || gameLost);
  }
}
function updateAnvilUI() {
  const c = document.getElementById('anvilCounter');
  const active = Boolean(activeAnvilTrap && activeAnvilTrap.steps > 0);
  if (c) {
    c.textContent = 'Anvils: ' + playerAnvils + (active ? ' (Forge: ' + activeAnvilTrap.steps + ')' : ' (Ready)');
    c.classList.toggle('active', active);
  }
  const b = document.getElementById('anvilButton');
  if (b) {
    b.disabled = Boolean(playerAnvils <= 0 || active || gameWon || gameLost);
  }
}

function formatWinSummary() {
  const uniqueCount = visitedTiles ? visitedTiles.size : 0;
  const bonusCharges = (playerSpools || 0) + (playerShields || 0) + (playerDashes || 0) + (playerRecalls || 0) + (playerBreaches || 0) + (playerFlares || 0) + (playerDecoys || 0) + (playerOwls || 0) + (playerTridents || 0) + (playerArrows || 0) + (playerChariots || 0) + (playerAnvils || 0);
  const rawScore = 5000 - steps * 5 + uniqueCount * 10 + bonusCharges * 150;
  const score = Math.max(100, rawScore);
  return 'You Escaped! | Steps: ' + steps + ' | Tiles Explored: ' + uniqueCount + ' | Score: ' + score + ' | Click to Play Again';
}

function updateRecallUI() {
  const counter = document.getElementById('recallCounter');
  const button = document.getElementById('recallButton');
  if (chronosAnchor) {
    const d = Math.abs(playerX - chronosAnchor.x) + Math.abs(playerY - chronosAnchor.y);
    counter.textContent = 'Recalls: ' + playerRecalls + ' (Anchored Δ' + d + ')';
    counter.classList.toggle('anchored', true);
  } else {
    counter.textContent = 'Recalls: ' + playerRecalls + ' (Ready)';
    counter.classList.toggle('anchored', false);
  }
  button.textContent = chronosAnchor ? 'Recall to Anchor (B)' : 'Set Anchor (B)';
  button.disabled = playerRecalls <= 0 || gameWon || gameLost;
}

function updateFlareUI() {
  const flareCounter = document.getElementById('flareCounter');
  if (flareCounter) {
    flareCounter.textContent = 'Flares: ' + playerFlares + (solarFlareStepsRemaining > 0 ? ' (' + solarFlareStepsRemaining + ')' : ' (Off)');
    flareCounter.classList.toggle('active', solarFlareStepsRemaining > 0);
  }
  const flareButton = document.getElementById('flareButton');
  if (flareButton) {
    flareButton.disabled = Boolean(playerFlares <= 0 || solarFlareStepsRemaining > 0 || gameWon || gameLost);
  }
}

function updateDecoyUI() {
  const c = document.getElementById('decoyCounter');
  if (c) {
    if (isDecoyLureActive()) {
      c.textContent = 'Decoys: ' + playerDecoys + ' (Lure: ' + activeDecoy.steps + ')';
      c.classList.toggle('active', true);
    } else {
      c.textContent = 'Decoys: ' + playerDecoys + ' (Off)';
      c.classList.toggle('active', false);
    }
  }
  const b = document.getElementById('decoyButton');
  if (b) {
    b.disabled = Boolean(playerDecoys <= 0 || isDecoyLureActive() || gameWon || gameLost);
  }
}

function updateOwlUI() {
  const c = document.getElementById('owlCounter');
  if (c) {
    c.textContent = 'Owls: ' + playerOwls + (owlStepsRemaining > 0 ? ' (Sight: ' + owlStepsRemaining + ')' : ' (Off)');
    c.classList.toggle('active', owlStepsRemaining > 0);
  }
  const b = document.getElementById('owlButton');
  if (b) {
    b.disabled = Boolean(playerOwls <= 0 || owlStepsRemaining > 0 || gameWon || gameLost);
  }
}

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
