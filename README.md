# Escape Game — Agence Acapulco

## Déploiement en 5 minutes (Railway.app — gratuit)

### Étape 1 — Créer un compte GitHub
Si tu n'en as pas : https://github.com/signup

### Étape 2 — Mettre le projet sur GitHub
1. Va sur https://github.com/new
2. Crée un repo nommé `escape-acapulco` (privé ou public)
3. Dans ce dossier (`escape-acapulco`), ouvre un terminal et tape :
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_NOM/escape-acapulco.git
git push -u origin main
```

### Étape 3 — Déployer sur Railway
1. Va sur https://railway.app et connecte-toi avec GitHub
2. Clique **New Project → Deploy from GitHub repo**
3. Sélectionne `escape-acapulco`
4. Railway détecte Node.js automatiquement et déploie
5. Clique sur ton projet → **Settings → Domains → Generate Domain**
6. Tu obtiens une URL type `escape-acapulco-xxx.up.railway.app`

### Étape 4 — (Optionnel) Changer le mot de passe admin
Dans Railway → Variables → Ajouter :
- `ADMIN_PASSWORD` = le mot de passe de ton choix

---

## Le jour J — Checklist organisateur

### Avant de partir
- [ ] Imprimer et plastifier les QR codes (voir ci-dessous)
- [ ] Préparer une enveloppe "RÉCOMPENSE" avec un petit prix à l'intérieur
- [ ] Tester le jeu sur ton téléphone

### Dans le parc
- [ ] **Arbre A** : Attacher un ruban ROUGE + coller le QR code → `/clue/arbre-a`
- [ ] **Arbre B** : Attacher un ruban BLEU + coller le QR code → `/clue/arbre-b`
- [ ] À 7 pas vers le nord depuis l'Arbre B : enterrer/cacher l'enveloppe récompense

### Générer les QR codes
Aller sur https://www.qr-code-generator.com et créer 3 QR codes :
1. `https://TON-URL.railway.app` → QR code d'entrée (à partager avec les joueurs)
2. `https://TON-URL.railway.app/clue/arbre-a` → QR code Arbre A (ruban rouge)
3. `https://TON-URL.railway.app/clue/arbre-b` → QR code Arbre B (ruban bleu)

### Pendant le jeu
- Ouvrir `https://TON-URL.railway.app/admin` sur son téléphone
- Mot de passe : `acapulco2025`
- Cliquer **▶ Lancer le jeu** quand tout le monde est prêt
- Suivre la progression en temps réel
- Envoyer des indices aux brigades bloquées via le bouton 💡

---

## Scénario complet

**Coupable** : Isabelle Renard (comptable)
**Mobile** : Primes impayées depuis juin 2022
**Cachette** : Au pied de l'Arbre B, 7 pas vers le nord

### Réponses aux 8 étapes
| Étape | Type | Réponse |
|-------|------|---------|
| 1 | QCM | C — #2847 |
| 2 | Code | 1180 |
| 3 | Code — Logs d'accès | 2357 |
| 4 | QR Arbre A (ruban rouge) | 2022 |
| 5 | QCM — Portrait du coupable | Isabelle Renard |
| 6 | Code — Calcul du préjudice | 1600 |
| 7 | QR Arbre B (ruban bleu) | 4722 |
| 8 | QCM final | Isabelle Renard + Primes impayées + Au pied de l'Arbre B |

---

## Lancer en local (pour tester)

```bash
cd escape-acapulco
npm install
npm start
# Ouvrir http://localhost:3000
```
