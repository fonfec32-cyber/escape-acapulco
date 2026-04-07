const socket = io();
let myTeamId = null;
let myTeamColor = '#f5c518';
let selectedTeamId = null;
let currentEnigma = null;

// ── Écrans ────────────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
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

socket.on('joined', ({ teamId, teamName, color }) => {
  myTeamId = teamId;
  myTeamColor = color;
  document.getElementById('waiting-team-name').textContent = teamName;
  document.getElementById('header-team').textContent = teamName;
  document.getElementById('header-team').style.borderColor = color;
  document.getElementById('header-team').style.color = color;
  showScreen('screen-waiting');
});

socket.on('enigma', (enigma) => {
  currentEnigma = enigma;
  renderEnigma(enigma);
  showScreen('screen-enigma');
});

socket.on('answer-result', ({ correct }) => {
  if (correct) {
    showScreen('screen-correct');
  } else {
    const btn = document.querySelector('#enigma-content .btn-submit');
    if (btn) { btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 400); }
    const err = document.getElementById('error-msg');
    if (err) { err.textContent = '❌ Mauvaise réponse, réessayez !'; err.style.display = 'block'; }
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

function renderEnigma(enigma) {
  document.getElementById('header-progress').textContent = `Étape ${enigma.number}/6`;
  const content = document.getElementById('enigma-content');
  let html = `<h2>${esc(enigma.title)}</h2><p class="intro">${esc(enigma.intro)}</p>`;

  if (enigma.type === 'qcm') {
    if (enigma.document) {
      html += '<div class="document">' + enigma.document.map(l => `<div>${esc(l)}</div>`).join('') + '</div>';
    }
    if (enigma.suspects) {
      html += '<div class="suspects">';
      enigma.suspects.forEach(s => {
        html += `<div class="suspect-card">
          <strong>${esc(s.name)}</strong> — <em>${esc(s.role)}</em><br>
          Badge : ${esc(s.badge)}<br>
          Alibi : ${esc(s.alibi)}
        </div>`;
      });
      html += '</div>';
    }
    html += `<p class="question">${esc(enigma.question)}</p>`;
    html += '<div class="options">';
    enigma.options.forEach((opt, i) => {
      html += `<label class="option-label">
        <input type="radio" name="qcm" value="${i}">
        <span>${esc(opt)}</span>
      </label>`;
    });
    html += '</div>';
    html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
    html += '<button class="btn btn-submit" onclick="submitQCM()">Valider ma réponse</button>';

  } else if (enigma.type === 'code') {
    if (enigma.table) {
      html += '<div class="table-wrap"><table class="clue-table">';
      html += '<tr>' + enigma.table.headers.map(h => `<th>${esc(h)}</th>`).join('') + '</tr>';
      enigma.table.rows.forEach(row => {
        html += '<tr>' + row.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>';
      });
      html += '</table></div>';
    }
    html += `<p class="question">${esc(enigma.question)}</p>`;
    html += '<input type="number" id="code-input" class="code-input" placeholder="_ _ _ _" inputmode="numeric">';
    html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
    html += '<button class="btn btn-submit" onclick="submitCode()">Valider le code</button>';

  } else if (enigma.type === 'qrcode') {
    html += `<div class="qr-instruction">
      <div class="qr-icon">📍</div>
      <p><strong>${esc(enigma.qrLabel)}</strong></p>
      <p>Partez trouver le QR code dans le parc, scannez-le pour obtenir votre indice, puis revenez ici !</p>
    </div>`;
    html += `<p class="question">${esc(enigma.question)}</p>`;
    html += '<input type="number" id="code-input" class="code-input" placeholder="_ _ _ _" inputmode="numeric">';
    html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
    html += '<button class="btn btn-submit" onclick="submitCode()">Valider le code</button>';

  } else if (enigma.type === 'final') {
    html += '<div class="final-questions">';
    enigma.questions.forEach((q, qi) => {
      html += `<div class="final-question">
        <p class="question">${esc(q.question)}</p>
        <div class="options">`;
      q.options.forEach((opt, oi) => {
        html += `<label class="option-label">
          <input type="radio" name="final-${qi}" value="${oi}">
          <span>${esc(opt)}</span>
        </label>`;
      });
      html += `</div></div>`;
    });
    html += '</div>';
    html += '<div id="error-msg" class="error-msg" style="display:none"></div>';
    html += '<button class="btn btn-submit btn-final" onclick="submitFinal()">🔒 Clôturer l\'enquête</button>';
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
