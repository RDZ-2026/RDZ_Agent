# RDZ Stock — Guide de mise en ligne

## Vue d'ensemble

Application de gestion de stock vestiaire et matériel pour RDZ.
- **Mobile** (PWA) : inventaires, prêts, retours, stock — fonctionne hors-ligne
- **Bureau agents** : gestion complète, catalogue, rapports
- **Bureau direction** : accès complet + bons de commande + paramètres

Stack : React + Vite + Supabase + PWA offline

---

## ÉTAPE 1 — Supabase RH (projet existant)

1. Aller sur https://supabase.com/dashboard/project/trdhtlcenmjlcvzuplid
2. **SQL Editor → New Query**
3. Copier-coller le contenu de `sql/01_supabase_RH.sql`
4. Cliquer **Run**

✅ Résultat : table `rh_agents` créée + vue sécurisée `v_agents_stock` + 5 agents injectés

---

## ÉTAPE 2 — Supabase Stock (projet existant)

1. Aller sur https://supabase.com/dashboard/project/pdewmubikmotqzbxmyeq
2. **SQL Editor → New Query**
3. Copier-coller le contenu de `sql/02_supabase_STOCK.sql`
4. Cliquer **Run**

✅ Résultat : toutes les tables créées + données de démo insérées

---

## ÉTAPE 3 — Créer les utilisateurs

Dans le projet Supabase Stock :
1. **Authentication → Users → Invite user** → créer 3 comptes :
   - terrain@rdz.fr
   - gestion@rdz.fr
   - direction@rdz.fr

2. **SQL Editor → New Query** → exécuter :

```sql
update auth.users
set raw_user_meta_data = '{"role":"terrain","nom":"Agent Terrain"}'
where email = 'terrain@rdz.fr';

update auth.users
set raw_user_meta_data = '{"role":"agent","nom":"Gestionnaire"}'
where email = 'gestion@rdz.fr';

update auth.users
set raw_user_meta_data = '{"role":"direction","nom":"Direction RDZ"}'
where email = 'direction@rdz.fr';
```

---

## ÉTAPE 4 — Pousser sur GitHub

```bash
# Depuis le dossier rdz-stock
git init
git add .
git commit -m "Initial commit — RDZ Stock v1.0"
git remote add origin https://github.com/RDZ-2026/RDZ_Agent.git
git push -u origin main
```

> Si le repo a déjà du contenu, créer d'abord un sous-dossier `stock/`
> et travailler depuis là.

---

## ÉTAPE 5 — Déploiement Vercel (optionnel)

1. https://vercel.com → New Project → importer depuis GitHub
2. **Environment Variables** → ajouter :
   ```
   VITE_SUPABASE_URL = https://pdewmubikmotqzbxmyeq.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_RH_URL = https://trdhtlcenmjlcvzuplid.supabase.co
   VITE_SUPABASE_RH_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Déployer → URL publique automatique

---

## ÉTAPE 6 — Installer sur mobile (PWA)

Ouvrir l'URL dans :
- **iOS Safari** → Partager → "Sur l'écran d'accueil"
- **Android Chrome** → Menu → "Ajouter à l'écran d'accueil"

L'app fonctionne ensuite hors-ligne. Les saisies sont stockées
localement et synchronisées automatiquement à la reconnexion.

---

## Test en local

```bash
npm install
npm run dev
# Ouvrir http://localhost:5173
# Utiliser le mode "Démonstration" pour tester sans compte
```

---

## Architecture offline

```
Mobile hors-ligne → saisie
  ↓
IndexedDB (local — file FIFO)
  ↓ reconnexion détectée
Sync automatique vers Supabase
  ↓ conflit détecté (modif simultanée)
Alerte manuelle de résolution
```

---

## Sécurité — accès base RH

La clé anon du projet RH ne donne accès qu'à la vue `v_agents_stock`
(id, nom, prénom, fonction, brigade des agents actifs).

**Inaccessible depuis RDZ Stock :**
- Numéros AVS
- Salaires et taux horaires  
- Permis de travail
- Documents personnels
- Mesures disciplinaires
- Formations
- Données du conjoint
- Toute autre table du projet RH

Cette restriction est garantie par le Row Level Security de Supabase,
pas seulement par une règle applicative.

---

## Structure du projet

```
rdz-stock/
├── sql/
│   ├── 01_supabase_RH.sql      ← Exécuter dans projet RH
│   └── 02_supabase_STOCK.sql   ← Exécuter dans projet Stock
├── src/
│   ├── lib/
│   │   ├── supabase.js          ← Clients Supabase + sync RH
│   │   ├── db.js                ← IndexedDB offline queue
│   │   └── sync.js              ← Moteur synchronisation
│   ├── context/AppContext.jsx   ← État global + auth
│   ├── hooks/useStock.js        ← Hooks données
│   ├── components/
│   │   ├── layout/              ← StatusBar
│   │   ├── mobile/              ← Interface terrain PWA
│   │   └── bureau/              ← Interface gestionnaire + direction
│   ├── pages/Login.jsx          ← Auth + mode démo
│   └── App.jsx                  ← Routeur selon rôle
├── .env                         ← Clés Supabase (ne pas committer)
├── .gitignore                   ← .env exclu de git
└── package.json
```
