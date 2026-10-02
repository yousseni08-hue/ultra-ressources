# Ressources ULTRA : 4 lead magnets prêts à brancher

Ressources gratuites données en DM contre le numéro de téléphone. Un setter rappelle dans les 5 minutes.
Contenu : Yakine. Infra (sous-domaine, base, Slack, iClosed, CloseMate) : Mason.

## Voir le rendu sans rien installer
Ouvre les fichiers du dossier `apercu/` dans ton navigateur :
- `apercu/plan-parcours.html` : le plan, tel que le prospect le vit (quiz 8 questions adapté au métier → numéro → résultat personnalisé)
- `apercu/btp.html`, `apercu/resto.html`, `apercu/salon.html` : les 3 ressources (numéro demandé avant l'accès)
- `apercu/plan.html` : le plan avec un mode exploration (tous les paliers × tous les métiers)

## Les 4 ressources

| Mot-clé DM | Ressource | Route |
|---|---|---|
| `PLAN` | Le plan pour augmenter ton profit et sortir de l'opérationnel dans les 12 prochains mois | `/plan` |
| `BTP` | Comment augmenter ton chiffre d'affaires de 30 % quand tu es artisan du BTP (+ tableau de relance Google Sheets offert) | `/btp` |
| `RESTO` | La méthode pour augmenter ton panier moyen de 30 % et doubler ton chiffre d'affaires | `/resto` |
| `SALON` | La ressource beauté : coiffure, barbier, institut, ongles, cils, spa (5 règles chiffrées de Marvin + calculateur) | `/salon` |

Tableau de relance BTP (modèle à copier) : https://docs.google.com/spreadsheets/d/11m97yTKMUbL8kAwbBYpjpCR6xXu9kl0svXvshS9Dwac/copy

## Mise en ligne (ton Claude s'en charge)
Tout est dans `CLAUDE.md` : `npm install && npm run check && npm run build`, projet Vercel, variables d'environnement (`.env.example`), sous-domaine, tests.

## À régler de ton côté avant la 1ʳᵉ story
1. `NEXT_PUBLIC_ICLOSED_URL` dans Vercel **avant** le build (sinon les boutons « Réserve un appel diagnostic » ne mènent nulle part).
2. CloseMate : mots-clés en correspondance exacte + lever le blocage « agent IA actif » → `docs/CLOSEMATE.md`.
3. Double diagnostic avec le site ultra-consulting.eu + dédoublonnage par téléphone → `docs/POUR-MASON.md`.

## Modifier le contenu
Les textes sont dans `content/` (markdown et JSON), jamais dans le code. `npm run check` bloque tout contenu incohérent. Les notes internes `<!-- À VALIDER : … -->` sont invisibles en ligne.
