const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'acapulco2025';

// ─── ENIGMES ──────────────────────────────────────────────────────────────────

const enigmas = [
  {
    id: 1,
    type: 'qcm',
    number: 1,
    title: 'Étape 1 — Rapport Préliminaire',
    intro: "L'Inspecteur Moreau vous transmet le rapport officiel de la scène de crime. Lisez chaque ligne attentivement.",
    document: [
      "RAPPORT PRÉLIMINAIRE — CONFIDENTIEL",
      "Agence Acapulco — Pique-nique d'été",
      "────────────────────────────────────",
      "Heure du vol : entre 14h15 et 14h45",
      "Objet dérobé : 1 clé USB noire Kingston 32 Go",
      "Contenu : Dossier « PROJET SOLEIL » — fichiers clients",
      "Dernier accès numérique : 14h23 depuis le poste de Mme Renard",
      "Badge utilisé pour l'accès aux vestiaires : #2847",
      "Témoins : 3 personnes ont vu quelqu'un sortir des vestiaires à 14h30",
    ],
    question: "Quel numéro de badge a permis l'accès aux vestiaires ?",
    options: ["#1234", "#9901", "#2847", "#3312"],
    answer: 2,
    hint: "Relisez le rapport ligne par ligne. Le numéro de badge est mentionné explicitement."
  },
  {
    id: 2,
    type: 'code',
    number: 2,
    title: 'Étape 2 — Notes de Frais Suspectes',
    intro: "La brigade financière a découvert des irrégularités dans les notes de frais. Un montant a volontairement été effacé.",
    table: {
      headers: ["Mois", "Montant déclaré", "Montant réel"],
      rows: [
        ["Janvier", "850 €", "1 250 €"],
        ["Février", "920 €", "1 320 €"],
        ["Mars", "780 €", "???"],
        ["Avril", "1 100 €", "1 500 €"]
      ]
    },
    question: "Quel est le montant réel du mois de mars ? (chiffres uniquement, sans €)",
    answer: "1180",
    hint: "La différence entre montant déclaré et montant réel est toujours la même chaque mois."
  },
  {
    id: 3,
    type: 'code',
    number: 3,
    title: 'Étape 3 — Logs d\'Accès Suspects',
    intro: "La responsable sécurité a extrait les logs des badges pour la journée du pique-nique. Les enregistrements ont été mélangés volontairement. Remettez-les dans l'ordre chronologique et lisez le nombre de passages de chaque zone.",
    table: {
      headers: ["Zone", "Heure d'accès", "Passages"],
      rows: [
        ["Parking sous-sol", "15:48", "7"],
        ["Bureau d'Isabelle", "12:07", "2"],
        ["Cafétéria", "13:15", "3"],
        ["Vestiaires", "14:32", "5"]
      ]
    },
    question: "Classez les zones de la plus tôt à la plus tardive, puis lisez leurs passages dans cet ordre. Quel code à 4 chiffres obtenez-vous ?",
    answer: "2357",
    hint: "Triez par heure croissante : 12h07 → 13h15 → 14h32 → 15h48. Notez les passages dans cet ordre."
  },
  {
    id: 4,
    type: 'qrcode',
    number: 4,
    title: 'Étape 4 — Témoin Anonyme',
    intro: "Un témoin a laissé un message secret dans le parc. Trouvez l'Arbre A (marqué d'un ruban ROUGE) et scannez le QR code qui s'y trouve.",
    qrLabel: "Arbre A — ruban ROUGE",
    question: "En quelle année les injustices ont-elles commencé ? (4 chiffres)",
    answer: "2022",
    hint: "Le témoin mentionne une date précise dans son témoignage. L'année est clairement indiquée."
  },
  {
    id: 5,
    type: 'qcm',
    number: 5,
    title: 'Étape 5 — Portrait du Coupable',
    intro: "Un informateur anonyme a glissé un message sous la porte de l'Inspecteur Moreau :\n\n« Le voleur travaille avec les chiffres chaque jour. Il était déjà là quand les injustices ont commencé. Le jour du crime, sa seule défense… c'est sa propre parole. »\n\nCroisez ce message avec tous les indices récoltés depuis le début.",
    suspects: [
      { name: "Marc Leroux", role: "Directeur IT — dans l'entreprise depuis 2015", info: "Spécialité : réseaux, sécurité informatique, serveurs", alibi: "Confirmé par 4 collègues en réunion téléphonique de 14h à 15h" },
      { name: "Sophie Blanc", role: "DRH — dans l'entreprise depuis 2018", info: "Spécialité : gestion du personnel, contrats, recrutement", alibi: "Confirmée par 3 témoins — préparait les salades au moment du vol" },
      { name: "Kevin Dumas", role: "Stagiaire — arrivé en janvier 2024", info: "Spécialité : communication digitale, réseaux sociaux", alibi: "Non vérifié — dormait seul sous un arbre selon ses dires" },
      { name: "Isabelle Renard", role: "Comptable — dans l'entreprise depuis 2019", info: "Spécialité : gestion financière, notes de frais, bilans", alibi: "Non vérifié — « je lisais mon livre », aucun témoin présent" },
      { name: "Bruno Castets", role: "Commercial — arrivé en mars 2023", info: "Spécialité : développement commercial, prospection clients", alibi: "Confirmé par 5 personnes lors d'une partie de frisbee" }
    ],
    question: "En croisant le message de l'informateur avec vos indices, qui est le coupable ?",
    options: ["Marc Leroux", "Sophie Blanc", "Kevin Dumas", "Isabelle Renard", "Bruno Castets"],
    answer: 3,
    hint: "Trois critères à croiser : qui travaille avec des chiffres ? Qui était présent en 2022 ? Qui n'a aucun témoin pour son alibi ?"
  },
  {
    id: 6,
    type: 'code',
    number: 6,
    title: 'Étape 6 — Calcul du Préjudice',
    intro: "La brigade financière a finalisé son rapport. La fraude a démarré en janvier 2025 et s'est poursuivie sans interruption jusqu'en avril 2025 inclus. Vous avez déjà établi la différence mensuelle constante entre les montants déclarés et réels à l'étape 2.",
    question: "Quel est le montant total en euros détourné sur cette période ? (chiffres uniquement, sans €)",
    answer: "1600",
    hint: "La différence mensuelle est de 400 €. Comptez les mois de janvier à avril inclus : 4 mois. Multipliez."
  },
  {
    id: 7,
    type: 'qrcode',
    number: 7,
    title: 'Étape 7 — Enregistrement Audio',
    intro: "Une retranscription audio a été cachée dans le parc. Trouvez l'Arbre B (marqué d'un ruban BLEU) et scannez le QR code.",
    qrLabel: "Arbre B — ruban BLEU",
    question: "Quel est le code complet de la boîte métallique ? (4 chiffres)",
    answer: "4722",
    hint: "Le code commence par 47. Les 2 derniers chiffres sont les 2 derniers chiffres de l'année découverte à l'étape 4."
  },
  {
    id: 8,
    type: 'final',
    number: 8,
    title: 'Étape 8 — Clôture de l\'Enquête',
    intro: "Vous avez tous les éléments. Il est temps de boucler l'affaire et de rendre vos conclusions !",
    questions: [
      {
        question: "Qui a volé la clé USB du Projet Soleil ?",
        options: ["Marc Leroux", "Sophie Blanc", "Kevin Dumas", "Isabelle Renard", "Bruno Castets"],
        answer: 3
      },
      {
        question: "Quel était le mobile du crime ?",
        options: [
          "Jalousie professionnelle",
          "Espionnage industriel",
          "Primes impayées depuis 3 ans",
          "Vengeance personnelle",
          "Chantage"
        ],
        answer: 2
      },
      {
        question: "Où est cachée la clé USB ?",
        options: [
          "Sous le banc principal",
          "Au pied de l'Arbre B, 7 pas vers le nord",
          "Dans la glacière bleue",
          "Derrière la banderole de bienvenue"
        ],
        answer: 1
      }
    ]
  }
];

// ─── ÉTAT DU JEU ──────────────────────────────────────────────────────────────

function createTeams() {
  return {
    1: { name: 'Brigade Alpha',   color: '#e74c3c', progress: 0, members: [], socketIds: new Set(), hints: [], completedAt: null },
    2: { name: 'Brigade Bravo',   color: '#3498db', progress: 0, members: [], socketIds: new Set(), hints: [], completedAt: null },
    3: { name: 'Brigade Charlie', color: '#2ecc71', progress: 0, members: [], socketIds: new Set(), hints: [], completedAt: null },
    4: { name: 'Brigade Delta',   color: '#f39c12', progress: 0, members: [], socketIds: new Set(), hints: [], completedAt: null },
    5: { name: 'Brigade Echo',    color: '#9b59b6', progress: 0, members: [], socketIds: new Set(), hints: [], completedAt: null },
  };
}

let gameState = {
  started: false,
  startTime: null,
  finished: [],
  teams: createTeams()
};

function getPublicState() {
  const teams = {};
  for (const [id, team] of Object.entries(gameState.teams)) {
    teams[id] = {
      name: team.name,
      color: team.color,
      progress: team.progress,
      members: team.members,
      onlineCount: team.socketIds.size,
      hints: team.hints,
      completedAt: team.completedAt,
      totalEnigmas: enigmas.length
    };
  }
  return {
    started: gameState.started,
    startTime: gameState.startTime,
    finished: gameState.finished,
    totalEnigmas: enigmas.length,
    teams
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getEnigmaForClient(num) {
  if (num < 1 || num > enigmas.length) return null;
  const e = enigmas[num - 1];
  if (e.type === 'final') {
    const questions = e.questions.map(({ answer, ...q }) => q);
    const { questions: _q, ...rest } = e;
    return { ...rest, questions };
  }
  const { answer, ...rest } = e;
  return rest;
}

function checkAnswer(enigma, answer) {
  switch (enigma.type) {
    case 'qcm':
      return parseInt(answer) === enigma.answer;
    case 'code':
    case 'qrcode':
      return String(answer).trim().replace(/\s/g, '') === String(enigma.answer);
    case 'final':
      if (!Array.isArray(answer) || answer.length !== enigma.questions.length) return false;
      return enigma.questions.every((q, i) => parseInt(answer[i]) === q.answer);
    default:
      return false;
  }
}

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}m${ss.toString().padStart(2, '0')}s`;
}

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  let myTeamId = null;
  let myName = null;

  socket.emit('state-update', getPublicState());

  socket.on('join-team', ({ name, teamId }) => {
    teamId = parseInt(teamId);
    if (!gameState.teams[teamId]) return;

    if (myTeamId && gameState.teams[myTeamId]) {
      gameState.teams[myTeamId].socketIds.delete(socket.id);
      socket.leave(`team-${myTeamId}`);
    }

    myTeamId = teamId;
    myName = (name || 'Anonyme').trim().slice(0, 30);

    const team = gameState.teams[teamId];
    team.socketIds.add(socket.id);
    if (!team.members.includes(myName)) team.members.push(myName);
    socket.join(`team-${teamId}`);

    socket.emit('joined', {
      teamId,
      teamName: team.name,
      color: team.color,
      progress: team.progress,
      totalEnigmas: enigmas.length
    });

    if (gameState.started) {
      if (team.completedAt) {
        const pos = gameState.finished.findIndex(f => f.teamId === teamId) + 1;
        socket.emit('team-won', {
          position: pos,
          elapsed: formatElapsed(team.completedAt - gameState.startTime)
        });
      } else {
        socket.emit('enigma', getEnigmaForClient(team.progress + 1));
        team.hints.forEach(h => socket.emit('hint-received', h));
      }
    }

    io.emit('state-update', getPublicState());
  });

  socket.on('submit-answer', ({ teamId, enigmaId, answer }) => {
    teamId = parseInt(teamId);
    enigmaId = parseInt(enigmaId);
    if (!gameState.started) return;
    const team = gameState.teams[teamId];
    if (!team || team.completedAt) return;
    if (team.progress !== enigmaId - 1) return;

    const enigma = enigmas[enigmaId - 1];
    const correct = checkAnswer(enigma, answer);

    socket.emit('answer-result', { correct, enigmaId });

    if (correct) {
      team.progress++;

      if (team.progress >= enigmas.length) {
        team.completedAt = Date.now();
        const elapsed = team.completedAt - gameState.startTime;
        gameState.finished.push({
          teamId,
          teamName: team.name,
          elapsed: formatElapsed(elapsed),
          rawMs: elapsed
        });
        io.to(`team-${teamId}`).emit('team-won', {
          position: gameState.finished.length,
          elapsed: formatElapsed(elapsed)
        });
      } else {
        setTimeout(() => {
          io.to(`team-${teamId}`).emit('enigma', getEnigmaForClient(team.progress + 1));
        }, 1500);
      }

      io.emit('state-update', getPublicState());
    }
  });

  socket.on('admin-auth', ({ password }) => {
    if (password !== ADMIN_PASSWORD) {
      socket.emit('admin-error', 'Mot de passe incorrect.');
      return;
    }
    socket.emit('admin-authed');
    socket.emit('state-update', getPublicState());
  });

  socket.on('admin-start', ({ password }) => {
    if (password !== ADMIN_PASSWORD || gameState.started) return;
    gameState.started = true;
    gameState.startTime = Date.now();
    io.emit('game-started');
    io.emit('state-update', getPublicState());
    for (const [teamId, team] of Object.entries(gameState.teams)) {
      if (team.socketIds.size > 0) {
        io.to(`team-${teamId}`).emit('enigma', getEnigmaForClient(1));
      }
    }
  });

  socket.on('admin-reset', ({ password }) => {
    if (password !== ADMIN_PASSWORD) return;
    const oldTeams = gameState.teams;
    gameState = { started: false, startTime: null, finished: [], teams: createTeams() };
    for (const [teamId, team] of Object.entries(gameState.teams)) {
      if (oldTeams[teamId]) team.socketIds = oldTeams[teamId].socketIds;
    }
    io.emit('game-reset');
    io.emit('state-update', getPublicState());
  });

  socket.on('admin-hint', ({ password, teamId, message }) => {
    if (password !== ADMIN_PASSWORD) return;
    teamId = parseInt(teamId);
    if (!gameState.teams[teamId]) return;
    const hint = { message: message.trim().slice(0, 500), timestamp: Date.now() };
    gameState.teams[teamId].hints.push(hint);
    io.to(`team-${teamId}`).emit('hint-received', hint);
    io.emit('state-update', getPublicState());
  });

  socket.on('admin-advance', ({ password, teamId }) => {
    if (password !== ADMIN_PASSWORD) return;
    teamId = parseInt(teamId);
    const team = gameState.teams[teamId];
    if (!team || team.completedAt || !gameState.started) return;
    team.progress = Math.min(team.progress + 1, enigmas.length);
    if (team.progress >= enigmas.length) {
      team.completedAt = Date.now();
      const elapsed = team.completedAt - gameState.startTime;
      gameState.finished.push({ teamId, teamName: team.name, elapsed: formatElapsed(elapsed), rawMs: elapsed });
      io.to(`team-${teamId}`).emit('team-won', { position: gameState.finished.length, elapsed: formatElapsed(elapsed) });
    } else {
      io.to(`team-${teamId}`).emit('enigma', getEnigmaForClient(team.progress + 1));
    }
    io.emit('state-update', getPublicState());
  });

  socket.on('request-state', () => socket.emit('state-update', getPublicState()));

  socket.on('disconnect', () => {
    if (myTeamId && gameState.teams[myTeamId]) {
      gameState.teams[myTeamId].socketIds.delete(socket.id);
      io.emit('state-update', getPublicState());
    }
  });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('/clue/arbre-a', (req, res) => res.sendFile(path.join(__dirname, 'public/clue-a.html')));
app.get('/clue/arbre-b', (req, res) => res.sendFile(path.join(__dirname, 'public/clue-b.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

server.listen(PORT, () => {
  console.log(`\n🎮 Escape Game — Agence Acapulco`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔑 Mot de passe admin : ${ADMIN_PASSWORD}\n`);
});
