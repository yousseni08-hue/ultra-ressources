# CLAUDE.md — Ressources ULTRA (lead magnets avec opt-in téléphone)

Tu es le Claude de Mason. Ce repo est **prêt à déployer** : pages d'opt-in, ressources, quiz Roadmap, calculateurs, notif Slack. Ton travail : le brancher sur l'infra ULTRA et le mettre en ligne sur un sous-domaine. Tu n'as rien à concevoir, tout le contenu est déjà validé côté contenu.

## Ce que fait l'app
1. Un prospect envoie un mot-clé en DM (CloseMate) → il reçoit le lien d'une page d'opt-in.
2. Il laisse **prénom + téléphone + secteur + CA** → il accède tout de suite à la ressource.
3. **À la seconde**, une notif Slack part dans `#leads-magnets` (🔥 si CA ≥ 300 k€) → un setter l'appelle en moins de 5 minutes, pendant qu'il lit.
4. En fin de ressource : il écrit son objectif chiffré à 4 mois (renvoyé dans Slack) et peut réserver sur iClosed.

| Route | Rôle |
|---|---|
| `/` | Index interne des ressources (non indexé) |
| `/roadmap` | Ressource phare : quiz 2 min → opt-in → `/roadmap/resultat?t=…` (palier + plan personnalisé) |
| `/{slug}` | Page d'opt-in d'une ressource (`btp`, `resto`, `salon`) |
| `/{slug}/ressource?t=…` | La ressource, accessible uniquement avec le jeton signé reçu à l'opt-in |
| `POST /api/optin` | Valide, notifie (Slack / Sheet / Close / webhook / ta base), renvoie la redirection |
| `POST /api/objectif` | Objectif à 4 mois → Slack |

## Déploiement (Vercel, ~15 min)
1. `npm install && npm run check && npm run build` doivent passer.
2. Créer le projet Vercel depuis ce repo (framework Next.js, aucun réglage spécial).
3. Variables d'environnement : voir `.env.example`. **Obligatoires** : `SLACK_WEBHOOK_URL`, `LEAD_TOKEN_SECRET` (`openssl rand -hex 32`), `NEXT_PUBLIC_ICLOSED_URL`. **Recommandées** : `NEXT_PUBLIC_META_PIXEL_ID`, `SHEET_WEBHOOK_URL`.
   ⚠️ Après chaque saisie manuelle, vérifier qu'aucune valeur ne finit par un retour à la ligne : un `\n` invisible casse les webhooks sans erreur visible. Le code fait `.trim()` mais pas Vercel côté `NEXT_PUBLIC_*`.
4. Domaine : ajouter le sous-domaine choisi (ex. `ressources.<domaine-ultra>`) dans Vercel → CNAME `cname.vercel-dns.com` chez le registrar.
5. Tester en prod : `SLACK_WEBHOOK_URL=… npm run test:notify`, puis un vrai opt-in sur `/roadmap` avec un numéro de l'équipe → la notif doit arriver en moins de 2 secondes.

## Slack (5 min)
Canal `#leads-magnets`, setters dedans avec notifications mobiles « Tous les nouveaux messages ». Apps → *Incoming Webhooks* → ajouter au canal → copier l'URL dans `SLACK_WEBHOOK_URL`.

## Brancher la base de données ULTRA
Un seul endroit : `saveToDatabase()` dans `lib/leads.ts`. Le lead arrive déjà normalisé (téléphone en +33…). Alternative sans code : `LEAD_FORWARD_WEBHOOK_URL` reçoit chaque lead en JSON. Ne jamais faire échouer l'opt-in si la base tombe : `handleLead` isole chaque canal.

## Liens à mettre dans CloseMate
Un lien par ressource, avec UTM, pour mesurer proprement (le lien faux de la masterclass attribue aujourd'hui tout à la bio) :
```
https://<sous-domaine>/roadmap?utm_medium=dm&utm_campaign=plan&kw=PLAN
https://<sous-domaine>/btp?utm_medium=dm&utm_campaign=btp&kw=BTP
https://<sous-domaine>/resto?utm_medium=dm&utm_campaign=resto&kw=RESTO
https://<sous-domaine>/salon?utm_medium=dm&utm_campaign=salon&kw=SALON
```
`utm_medium` = `story` / `reel` / `bio` / `dm` selon d'où vient le clic. Deux réglages CloseMate sont bloquants, voir `docs/CLOSEMATE.md`. Points côté site (double diagnostic, iClosed) : `docs/POUR-MASON.md`.

## Ajouter ou modifier une ressource
- Ressource classique = un fichier `content/lead-magnets/{slug}.md` (frontmatter + markdown). La page d'opt-in et la page ressource sont générées toutes seules.
- Calculateur interactif : `{{calculator:id}}` dans le markdown (`devis-dormants`, `marge-chantier`, `cout-matiere`, code dans `components/Calculators.tsx`).
- Notes internes : en commentaire HTML `<!-- À VALIDER : … -->`, jamais visibles en ligne.
- Roadmap : `content/roadmap.json` (questions globales, `flow`, paliers, actions par fonction, témoignages) + `content/roadmap-intro.md` + un fichier par secteur dans `content/roadmap-secteurs/` (voir ci-dessous).
- Toujours lancer `npm run check` avant de pousser : il bloque si un « À VALIDER » est visible ou si la roadmap est incohérente.

## Roadmap : quiz adaptatif
Les questions suivent le secteur choisi. Référence de comportement : l'aperçu statique `scripts/build-apercu.mjs` (section « Roadmap : quiz adaptatif »), à ne pas modifier.
- **Ordre** : `flow` dans `roadmap.json` (`secteur, specialite, nom, effectif, ca, tresorerie, frein, kpi`). `secteur`, `effectif`, `ca`, `tresorerie` sont dans `questions` (globales) ; `specialite`, `nom`, `frein`, `kpi` viennent de `content/roadmap-secteurs/<secteur>.json` (repli sur `autre.json`). `effectifLabel` du secteur remplace le libellé de `effectif`.
- **Contenu secteur** (un JSON par secteur, à éditer là) : `nomLabel`/`nomPlaceholder` (étape texte obligatoire), `specialite.options` (avec `noun` et `vend`), `frein.options`, `kpi.options` (avec `read`), `levers.<id de frein>` (titre, diagnostic, actions, `money.pctOfCA` + `explain` ou `null`, `proof`), `proofs` (noms exacts de `testimonials` de `roadmap.json`). Placeholders autorisés : `{prenom} {nom} {noun} {Noun} {vend}`.
- **Comportement** : clic → l'option passe en orange, 320 ms, question suivante ; le retour garde la sélection ; changer de secteur efface spécialité/nom/frein/kpi. L'opt-in ne redemande ni secteur ni CA.
- **Code** : logique partagée dans `lib/roadmap.ts` (étapes, placeholders, MID/EFF/TRESO), quiz `app/roadmap/Quiz.tsx`, résultat `app/roadmap/resultat/page.tsx`. Le palier = `scoring.effectifToStage[effectif]`. Ordre de grandeur du chantier n°1 = milieu de la tranche de CA × `pctOfCA`.
- **Données** : `/api/optin` envoie toutes les réponses (ids) au webhook `LEAD_FORWARD_WEBHOOK_URL`, et les réponses lisibles (entreprise, activité, équipe, trésorerie, frein, chiffre clé) dans la notif Slack. Le jeton du résultat reste compact : ids + nom d'entreprise + prénom.
- **Page résultat** (ordre de l'aperçu) : trésorerie → « Tu es ici » (métro des paliers) → fiche du palier (`graduateBy` en case mise en avant) + `stat` optionnel {figure, text, source} → chantiers → fonctions → réussite + `graduateWhen` → bloc `cta` {title, text, button} (lien iClosed) → palier précédent / suivant (fiche + `<details>`) → intro, témoignages, objectif ; `npm run check` exige `graduateBy`, `graduateWhen`, `cta.*` sur chaque palier.
- `npm run check` valide chaque fichier secteur : un levier par frein, preuves présentes dans les témoignages, placeholders connus, `pctOfCA` entre 0 et 0,2, `flow` cohérent.

## Règles de contenu à ne pas casser
- Témoignages : uniquement réels, résultat qui colle à la promesse. Exclus : Maxime nettoyage auto (refusé Meta), Jérémy (strike), Antoine Barat (pas client), tout gabarit fictif.
- Titres : pas de « trouver des clients », « rentabilité », « marge » (vocabulaire qui attire les clients remboursés, fiche messaging du 01/08).
- Aucun prix ni description de l'offre dans les ressources.

## Stack
Next.js 15 (App Router), React 19, TypeScript, CSS maison (`app/globals.css`), `gray-matter` + `marked`. Aucune base requise, aucun service payant.
