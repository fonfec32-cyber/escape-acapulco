const socket = io();
let adminPwd = null;
let hintTargetTeam = null;
let timerInterval = null;
let gameStartTime = null;

// ── Auth ──────────────────────────────────────────────────────────────────────

function adminLogin() {
  const pwd = document.getElementById('admin-password').value;
  socket.emit('admin-auth', { password: pwd });
}

document.getElementById('admin-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adminLogin();
});

socket.on('admin-authed', () => {
  adminPwd = document.getElementById('admin-password').value;
  document.getElementById('admin-auth').classList.remove('active');
  document.getElementById('admin-main').classList.add('active');
  socket.emit('request-state');
});

socket.on('admin-error', (msg) => {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
});

// ── État du jeu ───────────────────────────────────────────────────────────────

socket.on('state-update', (state) => {
  renderTeams(state);
  renderRanking(state);

  const btn = document.getElementById('btn-start');
  if (state.started) {
    btn.disabled = true;
    btn.textContent = '▶ En cours';
    if (!timerInterval && state.startTime) {
      gameStartTime = state.startTime;
      startTimer();
    }
  } else {
    btn.disabled = false;
    btn.textContent = '▶ Lancer le jeu';
  }
});

function renderTeams(state) {
  const grid = document.getElementById('teams-grid');
  grid.innerHTML = '';

  for (const [id, team] of Object.entries(state.teams)) {
    const pct = state.totalEnigmas > 0 ? Math.round((team.progress / state.totalEnigmas) * 100) : 0;
    const statusText = team.completedAt
      ? '✅ TERMINÉ'
      : state.started
        ? `Étape ${team.progress + 1} / ${state.totalEnigmas}`
        : 'En attente';
    const isDone = !!team.completedAt;

    const card = document.createElement('div');
    card.className = 'team-card';
    card.style.borderTopColor = team.color;
    card.innerHTML = `
      <div class="team-card-header">
        <h3 style="color:${team.color}">${team.name}</h3>
        <span class="status-badge ${isDone ? 'done' : ''}">${statusText}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%; background:${team.color}"></div>
      </div>
      <div class="team-meta">
        <span>👥 ${team.members.join(', ') || 'Aucun membre'}</span>
        <span>📱 ${team.onlineCount} connecté(s)</span>
        <span>💡 ${team.hints.length} indice(s) envoyé(s)</span>
      </div>
      <div class="team-actions">
        <button class="action-btn hint-btn" onclick="openHintModal(${id}, '${team.name}')">💡 Indice</button>
        <button class="action-btn advance-btn"
          onclick="advanceTeam(${id})"
          ${!state.started || isDone ? 'disabled' : ''}>⏩ Avancer</button>
      </div>
    `;
    grid.appendChild(card);
  }
}

function renderRanking(state) {
  const list = document.getElementById('ranking-list');
  if (!state.finished || state.finished.length === 0) {
    list.innerHTML = '<p class="muted">Aucune équipe n\'a terminé pour l\'instant.</p>';
    return;
  }
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  list.innerHTML = state.finished.map((f, i) => `
    <div class="ranking-item">
      <span class="medal">${medals[i] || (i + 1)}</span>
      <strong>${f.teamName}</strong>
      <span class="elapsed">${f.elapsed}</span>
    </div>
  `).join('');
}

// ── Minuteur ──────────────────────────────────────────────────────────────────

function startTimer() {
  timerInterval = setInterval(() => {
    if (!gameStartTime) return;
    const ms = Date.now() - gameStartTime;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    document.getElementById('timer-display').textContent =
      `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

socket.on('game-reset', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  gameStartTime = null;
  document.getElementById('timer-display').textContent = '00:00';
});

// ── Contrôles admin ───────────────────────────────────────────────────────────

function startGame() {
  if (!confirm('Lancer le jeu pour toutes les brigades ?')) return;
  socket.emit('admin-start', { password: adminPwd });
}

function resetGame() {
  if (!confirm('Réinitialiser la partie ? Toute la progression sera perdue.')) return;
  socket.emit('admin-reset', { password: adminPwd });
}

function openHintModal(teamId, teamName) {
  hintTargetTeam = teamId;
  document.getElementById('hint-modal-team').textContent = `Pour : ${teamName}`;
  document.getElementById('hint-text').value = '';
  document.getElementById('hint-modal').classList.remove('hidden');
  document.getElementById('hint-text').focus();
}

function closeModal() {
  document.getElementById('hint-modal').classList.add('hidden');
  hintTargetTeam = null;
}

function sendHint() {
  const msg = document.getElementById('hint-text').value.trim();
  if (!msg) return;
  socket.emit('admin-hint', { password: adminPwd, teamId: hintTargetTeam, message: msg });
  closeModal();
}

function advanceTeam(teamId) {
  if (!confirm('Avancer cette brigade à l\'étape suivante ?')) return;
  socket.emit('admin-advance', { password: adminPwd, teamId });
}

// Fermer modal en cliquant à l'extérieur
document.getElementById('hint-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('hint-modal')) closeModal();
});
