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
  // ── ÉTAPE 1 ────────────────────────────────────────────────────────────────
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
  // ── ÉTAPE 2 ────────────────────────────────────────────────────────────────
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
  // ── ÉTAPE 3 — L'Email de la Trahison ─────────────────────────────────────
  {
    id: 3,
    type: 'code',
    number: 3,
    title: "Étape 3 — L'Email de la Trahison",
    intro: "Le département informatique a intercepté un email envoyé depuis le poste de Mme Renard à 13h47, soit 28 minutes avant le vol. Une partie du contenu a été censurée par le filtre de sécurité de l'entreprise.",
    document: [
      "DE : i.renard@acapulco-agency.fr",
      "À : ████████████@protonmail.com",
      "OBJET : [CENSURÉ PAR LE FILTRE SÉCURITÉ]",
      "DATE : 14/07/2025 — 13:47:02",
      "────────────────────────────────────",
      "Le transfert est confirmé pour ce soir.",
      "L'objet est dans le compartiment 3 du sac.",
      "Référence du dossier : ACAP-7743",
      "Rendez-vous au point habituel à 20h.",
      "Supprime ce message après lecture.",
      "────────────────────────────────────",
      "[Signature supprimée par le filtre]"
    ],
    question: "Quelle est la référence numérique du dossier ? (les 4 chiffres après le tiret)",
    answer: "7743",
    hint: "La référence est clairement visible dans le corps du message : ACAP-7743. Ne conservez que les 4 chiffres."
  },
  // ── ÉTAPE 4 (nouvelle) — Les SMS d'Isabelle ──────────────────────────────
  {
    id: 4,
    type: 'qcm',
    number: 4,
    title: "Étape 4 — Les SMS d'Isabelle",
    intro: "L'unité technique a réussi à extraire les derniers SMS du téléphone d'Isabelle Renard avant qu'elle ne l'efface. Un échange avec un contact mystérieux retient l'attention de l'Inspecteur Moreau.",
    document: [
      "SMS RÉCUPÉRÉS — Isabelle Renard — 14/07/2025",
      "────────────────────────────────────",
      "[12h03] ← Maman : « On se voit dimanche ? »",
      "[12h47] → V.M. : « C'est bon pour ce soir, tout est prêt. »",
      "[13h02] ← V.M. : « Parfait. Boîte habituelle. N'oublie pas la référence. »",
      "[13h05] → V.M. : « ACAP-7743. Je n'oublie pas. »",
      "[13h47] → V.M. : « Email envoyé. Supprime tout après. »",
      "[14h52] → V.M. : « C'est fait. Rendez-vous confirmé. »",
      "────────────────────────────────────"
    ],
    question: "D'après l'email intercepté et les SMS, à quelle heure était prévu le rendez-vous avec le complice ?",
    options: ["18h00", "19h30", "20h00", "22h30"],
    answer: 2,
    hint: "Dans l'email intercepté à l'étape précédente, une heure de rendez-vous était clairement indiquée."
  },
  // ── ÉTAPE 5 — Logs d'Accès Suspects ──────────────────────────────────────
  {
    id: 5,
    type: 'code',
    number: 5,
    title: "Étape 5 — Logs d'Accès Suspects",
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
  // ── ÉTAPE 6 — L'Agenda Codé ───────────────────────────────────────────────
  {
    id: 6,
    type: 'code',
    number: 6,
    title: "Étape 6 — L'Agenda Codé",
    intro: "La brigade a mis la main sur l'agenda personnel d'Isabelle Renard. Ses rendez-vous sensibles sont codés selon une règle simple : chaque chiffre est augmenté de 4. Déchiffrez l'entrée du jour du pique-nique.",
    document: [
      "AGENDA PERSONNEL — I. RENARD",
      "────────────────────────────────────",
      "Lundi    : RAS",
      "Mardi    : Réunion budget 14h — salle B12",
      "Mercredi : Dentiste (reprogrammé)",
      "Jeudi    : RDV discret — code : 7965  ⚠",
      "Vendredi : Bilan mensuel comptabilité",
      "────────────────────────────────────",
      "Règle : soustraire 4 à chaque chiffre pour lire le vrai code."
    ],
    question: "Quel est le vrai code de rendez-vous du jeudi ? (soustrayez 4 à chaque chiffre de 7965)",
    answer: "3521",
    hint: "7→3, 9→5, 6→2, 5→1. Le résultat est 3521."
  },
  // ── ÉTAPE 7 (nouvelle) — Le Planning de la Journée ───────────────────────
  {
    id: 7,
    type: 'code',
    number: 7,
    title: "Étape 7 — Le Planning de la Journée",
    intro: "L'organisateur du pique-nique a remis à la brigade le planning officiel de la journée. En croisant avec les témoignages, identifiez les créneaux où Isabelle Renard était absente des activités collectives.",
    table: {
      headers: ["Activité", "Début", "Fin", "Présence d'Isabelle"],
      rows: [
        ["Accueil & café", "12h00", "12h30", "✓ Présente"],
        ["Discours de la direction", "12h30", "13h00", "✓ Présente"],
        ["Déjeuner collectif", "13h00", "14h00", "✓ Présente"],
        ["Activité pétanque", "14h00", "14h15", "✗ Absente"],
        ["Pause libre", "14h15", "14h45", "✗ Absente"],
        ["Jeux d'équipe", "14h45", "15h30", "✓ Présente"],
        ["Goûter commun", "15h30", "16h00", "✓ Présente"]
      ]
    },
    question: "Combien de minutes totales Isabelle était-elle absente des activités collectives ? (chiffres uniquement)",
    answer: "45",
    hint: "Repérez uniquement les lignes ✗ Absente. De 14h00 à 14h15 = 15 min. De 14h15 à 14h45 = 30 min. Total : 45 min."
  },
  // ── ÉTAPE 8 — Témoin Anonyme / QR Arbre A ────────────────────────────────
  {
    id: 8,
    type: 'qrcode',
    number: 8,
    title: "Étape 8 — Témoin Anonyme",
    intro: "Un témoin a laissé un message secret dans le parc. Trouvez l'Arbre A (marqué d'un ruban ROUGE) et scannez le QR code qui s'y trouve.",
    qrLabel: "Arbre A — ruban ROUGE",
    question: "En quelle année les injustices ont-elles commencé ? (4 chiffres)",
    answer: "2022",
    hint: "Le témoin mentionne une date précise dans son témoignage. L'année est clairement indiquée."
  },
  // ── ÉTAPE 9 (nouvelle) — Le Message Codé ─────────────────────────────────
  {
    id: 9,
    type: 'code',
    number: 9,
    title: "Étape 9 — Le Message Codé",
    intro: "Un post-it froissé a été retrouvé au fond du tiroir d'Isabelle. La technicienne en cryptologie identifie un chiffrement de César classique : chaque lettre a été décalée de 3 positions vers l'avant dans l'alphabet (A→D, B→E, …, Z→C). Les chiffres, eux, n'ont pas été modifiés.",
    document: [
      "POST-IT RETROUVÉ DANS LE TIROIR D'ISABELLE :",
      "────────────────────────────────────",
      "« Uhqghc-yrxv dx srlqw 47 »",
      "────────────────────────────────────",
      "Aide : pour décoder, décalez chaque lettre de −3 positions.",
      "Exemples : D→A   H→E   N→K   U→R"
    ],
    question: "Quel est le numéro du point de rendez-vous mentionné dans le message décodé ? (2 chiffres)",
    answer: "47",
    hint: "Décoder « Uhqghc-yrxv dx srlqw 47 » donne « Rendez-vous au point 47 ». Le nombre est directement 47."
  },
  // ── ÉTAPE 10 — Alibis Contradictoires ────────────────────────────────────
  {
    id: 10,
    type: 'qcm',
    number: 10,
    title: "Étape 10 — Alibis Contradictoires",
    intro: "L'Inspecteur Moreau a interrogé trois collègues séparément. En croisant leurs déclarations avec les logs d'accès badge, une incohérence flagrante apparaît. Qui ment ?",
    suspects: [
      {
        name: "Arnaud Fabre",
        role: "Responsable RH — présent au pique-nique",
        info: "Déclaration : « De 13h30 à 15h00, j'étais assis à la table principale avec plusieurs collègues. Je n'ai pas quitté ma place une seule fois. »",
        alibi: "Corroboré par Chloé Perrin"
      },
      {
        name: "Béatrice Moulin",
        role: "Assistante de direction — présente au pique-nique",
        info: "Déclaration : « À 14h20, j'ai croisé Arnaud dans le couloir menant aux vestiaires. Il semblait pressé et regardait autour de lui. »",
        alibi: "Non vérifiable — était seule à ce moment"
      },
      {
        name: "Chloé Perrin",
        role: "Chargée de communication — présente au pique-nique",
        info: "Déclaration : « Arnaud et moi avons déjeuné ensemble de 13h30 à 15h00. Il n'a absolument pas bougé de la table. Je peux en attester. »",
        alibi: "Corrobore la déclaration d'Arnaud"
      }
    ],
    question: "Laquelle de ces trois personnes donne une déclaration incompatible avec les deux autres ?",
    options: ["Arnaud Fabre", "Béatrice Moulin", "Chloé Perrin"],
    answer: 1,
    hint: "Arnaud et Chloé se corroborent mutuellement. L'une des trois déclarations contredit les deux autres à elle seule."
  },
  // ── ÉTAPE 11 (nouvelle) — Relevé des Appels ──────────────────────────────
  {
    id: 11,
    type: 'code',
    number: 11,
    title: "Étape 11 — Relevé des Appels",
    intro: "L'opérateur téléphonique a fourni à la brigade le relevé des appels passés par Isabelle Renard durant la semaine précédant le vol. Un pattern suspect se dégage.",
    table: {
      headers: ["Date", "Heure", "Durée (min)", "Correspondant"],
      rows: [
        ["08/07/2025", "09h14", "3", "Cabinet médical Saint-Louis"],
        ["09/07/2025", "11h32", "8", "Service comptabilité interne"],
        ["10/07/2025", "14h55", "2", "Dr. Beaulieu — Dentiste"],
        ["11/07/2025", "08h47", "45", "⚠ Numéro masqué"],
        ["12/07/2025", "17h20", "1", "Pharmacie Centrale"],
        ["13/07/2025", "20h03", "4", "Maman"],
        ["14/07/2025", "07h03", "12", "⚠ Numéro masqué"]
      ]
    },
    question: "Quel est le nombre total de minutes passées à appeler des numéros masqués ? (chiffres uniquement)",
    answer: "57",
    hint: "Repérez uniquement les lignes ⚠ Numéro masqué : 45 min + 12 min = 57 min."
  },
  // ── ÉTAPE 12 — Portrait du Coupable ──────────────────────────────────────
  {
    id: 12,
    type: 'qcm',
    number: 12,
    title: 'Étape 12 — Portrait du Coupable',
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
  // ── ÉTAPE 13 — La Mallette Secrète / Cadenas ─────────────────────────────
  {
    id: 13,
    type: 'padlock',
    number: 13,
    title: "Étape 13 — La Mallette Secrète",
    intro: "Une mallette noire portant un cadenas à 4 chiffres a été retrouvée dans les vestiaires. Une note collée dessus indique comment retrouver la combinaison à partir des éléments déjà découverts.",
    document: [
      "INDICE LAISSÉ PAR L'INFORMATEUR :",
      "────────────────────────────────────",
      "ROUE 1 : 1er chiffre de la référence email (ACAP-????)",
      "ROUE 2 : 1er chiffre du code des logs classés chronologiquement",
      "ROUE 3 : nombre de témoins ayant vu quelqu'un sortir des vestiaires",
      "ROUE 4 : dernier chiffre du numéro de badge utilisé (#2847)",
      "────────────────────────────────────"
    ],
    question: "Ouvrez le cadenas en formant le bon code à 4 chiffres.",
    answer: "7237",
    hint: "Référence ACAP-7743 → 7. Logs ordonnés 2357 → 2. Témoins → 3. Badge #2847, dernier chiffre → 7. Code : 7237."
  },
  // ── ÉTAPE 14 — Calcul du Préjudice ───────────────────────────────────────
  {
    id: 14,
    type: 'code',
    number: 14,
    title: 'Étape 14 — Calcul du Préjudice',
    intro: "La brigade financière a finalisé son rapport. La fraude a démarré en janvier 2025 et s'est poursuivie sans interruption jusqu'en avril 2025 inclus. Vous avez déjà établi la différence mensuelle constante entre les montants déclarés et réels à l'étape 2.",
    question: "Quel est le montant total en euros détourné sur cette période ? (chiffres uniquement, sans €)",
    answer: "1600",
    hint: "La différence mensuelle est de 400 €. Comptez les mois de janvier à avril inclus : 4 mois. Multipliez."
  },
  // ── ÉTAPE 15 (nouvelle) — QR Arbre C ─────────────────────────────────────
  {
    id: 15,
    type: 'qrcode',
    number: 15,
    title: "Étape 15 — La Boîte aux Lettres Morte",
    intro: "Un informateur anonyme a transmis un message vocal à l'Inspecteur Moreau : « J'ai déposé des preuves supplémentaires dans le parc. Cherchez l'arbre marqué d'un ruban VERT. »",
    qrLabel: "Arbre C — ruban VERT",
    question: "Quel code à 4 chiffres figure sur le document retrouvé ? (4 chiffres)",
    answer: "3847",
    hint: "Le document caché contient clairement un code à 4 chiffres dans la section « CODE D'IDENTIFICATION »."
  },
  // ── ÉTAPE 16 — Le Reçu Bancaire ──────────────────────────────────────────
  {
    id: 16,
    type: 'code',
    number: 16,
    title: "Étape 16 — Le Reçu Bancaire",
    intro: "La brigade financière a obtenu un extrait du relevé bancaire personnel d'Isabelle Renard. Un virement entrant suspect apparaît le jour même du vol, mais le montant exact a été partiellement effacé.",
    table: {
      headers: ["Date", "Opération", "Solde avant", "Solde après"],
      rows: [
        ["14/07/2025", "VIR ENTRANT — origine masquée", "1 800 €", "3 260 €"],
        ["15/07/2025", "PRÉLÈVEMENT LOYER", "3 260 €", "2 160 €"],
        ["20/07/2025", "ACHAT CB — ANONYMISÉ", "2 160 €", "1 903 €"]
      ]
    },
    question: "Quel était le montant exact du virement entrant suspect du 14 juillet ? (chiffres uniquement, sans €)",
    answer: "1460",
    hint: "Montant du virement = Solde après − Solde avant. 3 260 − 1 800 = 1 460."
  },
  // ── ÉTAPE 17 (nouvelle) — Caméra de Surveillance ─────────────────────────
  {
    id: 17,
    type: 'qcm',
    number: 17,
    title: "Étape 17 — Caméra de Surveillance",
    intro: "La responsable sécurité a isolé quatre séquences vidéo des caméras de surveillance de la journée. Elle en fait une description écrite car les fichiers ne peuvent pas être transmis directement.",
    suspects: [
      {
        name: "Image A",
        role: "Couloir principal — 13h58",
        info: "Isabelle Renard marche tranquillement vers la cafétéria, sac à main au bras gauche, téléphone à l'oreille.",
        alibi: "Avant la fenêtre horaire du vol (14h15–14h45)"
      },
      {
        name: "Image B",
        role: "Sortie de secours — 14h12",
        info: "Une personne non identifiable portant une veste bleue pousse la porte de sortie de secours. Le visage n'est pas visible.",
        alibi: "Avant la fenêtre horaire du vol (14h15–14h45)"
      },
      {
        name: "Image C",
        role: "Couloir vestiaires — 14h31",
        info: "Isabelle Renard sort des vestiaires avec un sac à dos noir qu'elle ne portait pas en arrivant. Elle regarde rapidement derrière elle avant de tourner dans le couloir.",
        alibi: "Pendant la fenêtre horaire du vol (14h15–14h45)"
      },
      {
        name: "Image D",
        role: "Parking sous-sol — 15h51",
        info: "Isabelle Renard marche seule vers l'ascenseur. Elle semble pressée, plus de sac à dos.",
        alibi: "Après la fenêtre horaire du vol (14h15–14h45)"
      }
    ],
    question: "Quelle séquence place formellement Isabelle Renard aux vestiaires pendant la fenêtre horaire du vol ?",
    options: [
      "Image A — Couloir principal 13h58",
      "Image B — Sortie de secours 14h12",
      "Image C — Couloir vestiaires 14h31",
      "Image D — Parking sous-sol 15h51"
    ],
    answer: 2,
    hint: "La fenêtre du vol est 14h15–14h45. Seule une image montre Isabelle aux vestiaires dans cet intervalle de temps."
  },
  // ── ÉTAPE 18 — Enregistrement Audio / QR Arbre B ─────────────────────────
  {
    id: 18,
    type: 'qrcode',
    number: 18,
    title: "Étape 18 — Enregistrement Audio",
    intro: "Une retranscription audio a été cachée dans le parc. Trouvez l'Arbre B (marqué d'un ruban BLEU) et scannez le QR code.",
    qrLabel: "Arbre B — ruban BLEU",
    question: "Quel est le code complet de la boîte métallique ? (4 chiffres)",
    answer: "4722",
    hint: "Le code commence par 47. Les 2 derniers chiffres sont les 2 derniers chiffres de l'année découverte à l'étape 8."
  },
  // ── ÉTAPE 19 (nouvelle) — Le Ticket de Caisse ────────────────────────────
  {
    id: 19,
    type: 'code',
    number: 19,
    title: "Étape 19 — Le Ticket de Caisse",
    intro: "Parmi les effets personnels d'Isabelle, la brigade a retrouvé un ticket de caisse d'une librairie datant du 10 juillet 2025. L'Inspecteur Moreau y repère le numéro de client d'Isabelle, formé ainsi : les 2 chiffres de l'heure d'achat suivis des 2 premiers chiffres du total TTC.",
    document: [
      "LIBRAIRIE DU CENTRE — Ticket N°08841",
      "────────────────────────────────────",
      "Date : 10/07/2025          Heure : 16h23",
      "────────────────────────────────────",
      "1x Roman policier             14,90 €",
      "1x Carnet moleskine A5         9,90 €",
      "1x Stylo plume                 6,80 €",
      "1x Livre de codes & chiffres  36,90 €",
      "────────────────────────────────────",
      "TOTAL TTC :                   68,50 €",
      "────────────────────────────────────",
      "Merci de votre visite !"
    ],
    question: "Quel est le numéro de client d'Isabelle ? (2 chiffres de l'heure + 2 premiers chiffres du total TTC)",
    answer: "1668",
    hint: "Heure d'achat = 16h → 16. Total TTC = 68,50 € → 2 premiers chiffres = 68. Numéro client : 1668."
  },
  // ── ÉTAPE 20 — Le Numéro de Casier ───────────────────────────────────────
  {
    id: 20,
    type: 'code',
    number: 20,
    title: "Étape 20 — Le Numéro de Casier",
    intro: "La chef de brigade demande de localiser le casier personnel d'Isabelle dans les vestiaires pour y chercher d'autres preuves. Chaque casier de l'agence suit une numérotation précise : (année de début des injustices) − (montant total détourné ÷ 4). Vous disposez déjà de ces deux informations.",
    question: "Quel est le numéro du casier d'Isabelle Renard ?",
    answer: "1622",
    hint: "Année des injustices : 2022 (étape 8). Montant total détourné : 1 600 € (étape 14). 1 600 ÷ 4 = 400. 2022 − 400 = 1622."
  },
  // ── ÉTAPE 21 (nouvelle) — Le Cadenas du Complice ─────────────────────────
  {
    id: 21,
    type: 'padlock',
    number: 21,
    title: "Étape 21 — Le Cadenas du Complice",
    intro: "Dans le casier d'Isabelle, la brigade a trouvé une petite mallette noire fermée par un cadenas à 4 roues. Une note glissée dessous indique comment former le code à partir d'indices déjà collectés.",
    document: [
      "NOTE TROUVÉE DANS LE CASIER D'ISABELLE :",
      "────────────────────────────────────",
      "ROUE 1 : Dernier chiffre du vrai code de l'agenda codé",
      "ROUE 2 : Premier chiffre du numéro de point (message César)",
      "ROUE 3 : Nombre de témoins ayant vu quelqu'un sortir des vestiaires",
      "ROUE 4 : Dernier chiffre du code retrouvé à l'Arbre C",
      "────────────────────────────────────"
    ],
    question: "Formez le code à 4 chiffres pour ouvrir la mallette du complice.",
    answer: "1437",
    hint: "Agenda (3521) → dernier chiffre : 1. César (47) → premier chiffre : 4. Témoins : 3. Arbre C (3847) → dernier chiffre : 7. Code : 1437."
  },
  // ── ÉTAPE 22 — Rapport de Clôture ────────────────────────────────────────
  {
    id: 22,
    type: 'code',
    number: 22,
    title: "Étape 22 — Rapport de Clôture",
    intro: "Le laboratoire judiciaire rend son rapport d'analyse final. Pour enregistrer officiellement le dossier dans le système, la brigade doit saisir le numéro de dossier — calculé à partir des données de l'affaire.",
    document: [
      "LABORATOIRE JUDICIAIRE — RAPPORT FINAL",
      "────────────────────────────────────────",
      "Analyste : Dr. A. Fontaine",
      "Date d'analyse : 14/07/2025",
      "",
      "RÉSULTATS :",
      "• Empreintes digitales sur la clé USB : correspondance 94 %",
      "• Fichiers récupérés : PROJET SOLEIL (complet)",
      "• Première copie non autorisée : 14 janvier 2025",
      "",
      "NUMÉRO DE DOSSIER :",
      "= Année de première copie − (montant mensuel détourné ÷ 100)",
      "────────────────────────────────────────"
    ],
    question: "Calculez le numéro de dossier et saisissez-le pour clôturer l'analyse. (4 chiffres)",
    answer: "2021",
    hint: "Année de première copie = 2025. Montant mensuel détourné = 400 € → 400 ÷ 100 = 4. 2025 − 4 = 2021."
  },
  // ── ÉTAPE 23 — Clôture de l'Enquête ──────────────────────────────────────
  {
    id: 23,
    type: 'final',
    number: 23,
    title: "Étape 23 — Clôture de l'Enquête",
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
    case 'padlock':
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
app.get('/clue/arbre-c', (req, res) => res.sendFile(path.join(__dirname, 'public/clue-c.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

server.listen(PORT, () => {
  console.log(`\n🎮 Escape Game — Agence Acapulco`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔑 Mot de passe admin : ${ADMIN_PASSWORD}\n`);
});
