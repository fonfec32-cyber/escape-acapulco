const socket = io();
let myTeamId = null;
let myTeamColor = '#f5c518';
let selectedTeamId = null;
let currentEnigma = null;
let totalEnigmas = 23;
let padlockDigits = [0, 0, 0, 0];

let enigmaHistory = [];
let viewingIndex = -1;

// ── Écrans ────────────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Navigation historique ─────────────────────────────────────────────────────

function goBack() {
  if (viewingIndex > 0) { viewingIndex--; renderEnigmaAt(viewingIndex); }
}

function goForward() {
  if (viewingIndex < enigmaHistory.length - 1) { viewingIndex++; renderEnigmaAt(viewingIndex); }
}

function goToCurrent() {
  viewingIndex = enigmaHistory.length - 1;
  renderEnigmaAt(viewingIndex);
}

function renderEnigmaAt(idx) {
  const enigma = enigmaHistory[idx];
  const isCurrent = idx === enigmaHistory.length - 1;
  currentEnigma = enigmaHistory[enigmaHistory.length - 1];

  document.getElementById('header-progress').textContent = `Étape ${enigma.number}/${totalEnigmas}`;
  document.getElementById('btn-nav-prev').style.visibility = idx > 0 ? 'visible' : 'hidden';
  document.getElementById('btn-nav-next').style.visibility = idx < enigmaHistory.length - 1 ? 'visible' : 'hidden';

  renderEnigma(enigma, isCurrent);
  window.scrollTo(0, 0);
}

// ── Rejoindre ─────────────────────────────────────────────────────────────────

function renderTeamGrid(teams) {
  const grid = document.getElementById('team-grid');
  const prevSelected = selectedTeamId;
  grid.innerHTML = '';
  for (const [id, team] of Object.entries(teams)) {
    const div = document.createElement('div');
    div.className = 'team-option' + (String(id) === String(prevSelected) ? ' selected' : '');
    div.dataset.teamId = id;
    div.style.borderColor = prevSelected === id ? team.color : '';
    div.innerHTML = `<strong style="color:${team.color}">${team.name}</strong><span>${team.onlineCount} en ligne</span>`;
    div.addEventListener('click', () => selectTeam(id, team.color, div));
    grid.appendChild(div);
  }
}

function selectTeam(id, color, el) {
  document.querySelectorAll('.team-option').forEach(o => {
    o.classList.remove('selected');
    o.style.borderColor = '';
  });
  el.classList.add('selected');
  el.style.borderColor = color;
  selectedTeamId = id;
  updateJoinButton();
}

function updateJoinButton() {
  const name = document.getElementById('input-name').value.trim();
  document.getElementById('btn-join').disabled = !name || !selectedTeamId;
}

document.getElementById('input-name').addEventListener('input', updateJoinButton);
document.getElementById('btn-join').addEventListener('click', () => {
  const name = document.getElementById('input-name').value.trim();
  socket.emit('join-team', { name, teamId: selectedTeamId });
});

// ── Événements Socket ─────────────────────────────────────────────────────────

socket.on('state-update', (state) => {
  if (document.getElementById('screen-join').classList.contains('active')) {
    renderTeamGrid(state.teams);
  }
  if (myTeamId && document.getElementById('screen-waiting').classList.contains('active')) {
    const team = state.teams[myTeamId];
    if (team) {
      document.getElementById('waiting-members').textContent =
        team.members.length > 0 ? `Membres : ${team.members.join(', ')}` : '';
    }
  }
});

socket.on('joined', ({ teamId, teamName, color, totalEnigmas: te }) => {
  if (te) totalEnigmas = te;
  myTeamId = teamId;
  myTeamColor = color;
  document.getElementById('waiting-team-name').textContent = teamName;
  document.getElementById('header-team').textContent = teamName;
  document.getElementById('header-team').style.borderColor = color;
  document.getElementById('header-team').style.color = color;
  showScreen('screen-waiting');
});

socket.on('enigma', (enigma) => {
  enigmaHistory.push(enigma);
  viewingIndex = enigmaHistory.length - 1;
  currentEnigma = enigma;
  renderEnigmaAt(viewingIndex);
  showScreen('screen-enigma');
});

socket.on('answer-result', ({ correct }) => {
  if (correct) {
    if (currentEnigma && currentEnigma.type === 'padlock') {
      const icon = document.getElementById('padlock-icon');
      if (icon) {
        icon.textContent = '🔓';
        icon.style.color = 'var(--green)';
        icon.style.transform = 'scale(1.3)';
      }
      setTimeout(() => showScreen('screen-correct'), 900);
    } else {
      showScreen('screen-correct');
    }
  } else {
    const btn = document.querySelector('#enigma-content .btn-submit');
    if (btn) { btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 400); }
    const err = document.getElementById('error-msg');
    if (err) { err.textContent = '❌ Mauvaise réponse, réessayez !'; err.style.display = 'block'; }
    // If user was reviewing, bring them back to current enigma after wrong answer
    if (viewingIndex !== enigmaHistory.length - 1) {
      viewingIndex = enigmaHistory.length - 1;
      renderEnigmaAt(viewingIndex);
    }
  }
});

socket.on('team-won', ({ position, elapsed }) => {
  const medals = ['🥇 1ère brigade', '🥈 2ème brigade', '🥉 3ème brigade', '4ème brigade', '5ème brigade'];
  document.getElementById('won-position').textContent = (medals[position - 1] || `${position}ème brigade`) + ' à résoudre l\'affaire !';
  document.getElementById('won-time').textContent = `Temps : ${elapsed}`;
  showScreen('screen-won');
});

socket.on('hint-received', ({ message }) => {
  document.getElementById('hint-message').textContent = message;
  document.getElementById('hint-overlay').classList.remove('hidden');
});

socket.on('game-reset', () => {
  myTeamId = null;
  selectedTeamId = null;
  enigmaHistory = [];
  viewingIndex = -1;
  showScreen('screen-join');
});

function closeHint() {
  document.getElementById('hint-overlay').classList.add('hidden');
}

// ── Rendu des Énigmes ─────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDocument(doc) {
  return '<div class="document">' + doc.map(l => `<div>${esc(l)}</div>`).join('') + '</div>';
}

function renderTable(table) {
  let h = '<div class="table-wrap"><table class="clue-table">';
  h += '<tr>' + table.headers.map(c => `<th>${esc(c)}</th>`).join('') + '</tr>';
  table.rows.forEach(row => { h += '<tr>' + row.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>'; });
  h += '</table></div>';
  return h;
}

function renderEnigma(enigma, isActive = true) {
  const content = document.getElementById('enigma-content');
  let html = '';

  if (!isActive) {
    html += `<div class="review-banner">📂 Consultation — Étape ${enigma.number}<button onclick="goToCurrent()">▶ Revenir à mon enquête</button></div>`;
  }

  html += `<h2>${esc(enigma.title)}</h2><p class="intro">${esc(enigma.intro)}</p>`;

  if (enigma.type === 'qcm') {
    if (enigma.document) html += renderDocument(enigma.document);
    if (enigma.suspects) {
      html += '<div class="suspects">';
      enigma.suspects.forEach(s => {
        html += `<div class="suspect-card">
          <strong>${esc(s.name)}</strong> — <em>${esc(s.role)}</em><br>
          ${s.info ? `<span class="suspect-info">${esc(s.info)}</span><br>` : ''}
          Alibi : ${esc(s.alibi)}
        </div>`;
      });
      html += '</div>';
    }
    if (isActive) {
      html += `<p class="question">${esc(enigma.question)}</p>`;
      html += '<div class="options">';
      enigma.options.forEach((opt, i) => {
        html += `<label class="option-label"><input type="radio" name="qcm" value="${i}"><span>${esc(opt)}</span></label>`;
      });
      html += '</div>';
      html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
      html += '<button class="btn btn-submit" onclick="submitQCM()">Valider ma réponse</button>';
    }

  } else if (enigma.type === 'code') {
    if (enigma.document) html += renderDocument(enigma.document);
    if (enigma.table) html += renderTable(enigma.table);
    if (isActive) {
      html += `<p class="question">${esc(enigma.question)}</p>`;
      html += '<input type="number" id="code-input" class="code-input" placeholder="_ _ _ _" inputmode="numeric">';
      html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
      html += '<button class="btn btn-submit" onclick="submitCode()">Valider le code</button>';
    }

  } else if (enigma.type === 'qrcode') {
    html += `<div class="qr-instruction">
      <div class="qr-icon">📍</div>
      <p><strong>${esc(enigma.qrLabel)}</strong></p>
      <p>Partez trouver le QR code dans le parc, scannez-le pour obtenir votre indice, puis revenez ici !</p>
    </div>`;
    if (isActive) {
      html += `<p class="question">${esc(enigma.question)}</p>`;
      html += '<input type="number" id="code-input" class="code-input" placeholder="_ _ _ _" inputmode="numeric">';
      html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
      html += '<button class="btn btn-submit" onclick="submitCode()">Valider le code</button>';
    }

  } else if (enigma.type === 'padlock') {
    padlockDigits = [0, 0, 0, 0];
    if (enigma.document) html += renderDocument(enigma.document);
    if (isActive) {
      html += `<p class="question">${esc(enigma.question)}</p>`;
      html += '<div class="padlock-body" id="padlock-icon">🔒</div>';
      html += '<div class="padlock-wheels">';
      for (let i = 0; i < 4; i++) {
        html += `<div class="padlock-wheel">
          <button class="padlock-btn" onclick="padlockUp(${i})">▲</button>
          <div class="padlock-digit" id="pd-${i}">0</div>
          <button class="padlock-btn" onclick="padlockDown(${i})">▼</button>
        </div>`;
      }
      html += '</div>';
      html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
      html += '<button class="btn btn-submit" onclick="submitPadlock()">🔓 Déverrouiller</button>';
    }

  } else if (enigma.type === 'final') {
    html += '<div class="final-questions">';
    enigma.questions.forEach((q, qi) => {
      html += `<div class="final-question"><p class="question">${esc(q.question)}</p><div class="options">`;
      q.options.forEach((opt, oi) => {
        html += `<label class="option-label"><input type="radio" name="final-${qi}" value="${oi}"><span>${esc(opt)}</span></label>`;
      });
      html += `</div></div>`;
    });
    html += '</div>';
    if (isActive) {
      html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
      html += '<button class="btn btn-submit btn-final" onclick="submitFinal()">🔒 Clôturer l\'enquête</button>';
    }
  }

  if (!isActive) {
    html += `<div class="review-banner" style="margin-top:16px"><button onclick="goToCurrent()">▶ Revenir à mon enquête</button></div>`;
  }

  content.innerHTML = html;
}

function submitQCM() {
  const sel = document.querySelector('input[name="qcm"]:checked');
  if (!sel) { showError('Veuillez sélectionner une réponse.'); return; }
  hideError();
  socket.emit('submit-answer', { teamId: myTeamId, enigmaId: currentEnigma.id, answer: parseInt(sel.value) });
}

function submitCode() {
  const val = document.getElementById('code-input').value.trim();
  if (!val) { showError('Veuillez entrer un code.'); return; }
  hideError();
  socket.emit('submit-answer', { teamId: myTeamId, enigmaId: currentEnigma.id, answer: val });
}

function submitFinal() {
  const answers = [];
  const n = currentEnigma.questions.length;
  for (let i = 0; i < n; i++) {
    const sel = document.querySelector(`input[name="final-${i}"]:checked`);
    if (!sel) { showError('Répondez à toutes les questions avant de valider.'); return; }
    answers.push(parseInt(sel.value));
  }
  hideError();
  socket.emit('submit-answer', { teamId: myTeamId, enigmaId: currentEnigma.id, answer: answers });
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideError() {
  const el = document.getElementById('error-msg');
  if (el) el.style.display = 'none';
}

function padlockUp(i) {
  padlockDigits[i] = (padlockDigits[i] + 1) % 10;
  const el = document.getElementById(`pd-${i}`);
  if (el) { el.textContent = padlockDigits[i]; el.classList.add('changed'); }
  hideError();
}

function padlockDown(i) {
  padlockDigits[i] = (padlockDigits[i] + 9) % 10;
  const el = document.getElementById(`pd-${i}`);
  if (el) { el.textContent = padlockDigits[i]; el.classList.add('changed'); }
  hideError();
}

function submitPadlock() {
  const code = padlockDigits.join('');
  socket.emit('submit-answer', { teamId: myTeamId, enigmaId: currentEnigma.id, answer: code });
}
