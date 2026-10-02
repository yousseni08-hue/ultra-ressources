# Points à régler côté site ultra-consulting.eu (pour Mason)

## 1. Double diagnostic (à trancher avant le lancement)
Le site a déjà son propre diagnostic (`/#diagnostic` : 5 questions, stade calculé sur le CA, téléphone, iClosed si CA > 200 k€).
Nos ressources, et surtout le plan (quiz 8 questions, palier calculé sur l'effectif), font déjà le diagnostic.

Risque : un prospect qui vient d'une ressource clique sur une étude de cas (« Lire son histoire »), arrive sur le site, voit « Faire le diagnostic », et le refait. Il donne deux fois son numéro, peut obtenir deux résultats différents (CA vs effectif), et le setter reçoit deux leads.

Recommandation :
- Les liens « Lire son histoire » de nos pages arrivent avec `?utm_source=ressources` (déjà en place dans les liens).
- Sur les pages `/transformations/*`, si `utm_source=ressources` : remplacer « Faire le diagnostic » par « Réserve un appel diagnostic avec l'équipe Ultra » (lien iClosed), et masquer le bloc diagnostic.
- Côté base / Close : dédoublonner sur le numéro de téléphone (un même numéro venant du diagnostic du site ET d'une ressource = un seul lead, source = la première).
- Vocabulaire : le site parle de « stade », nos pages de « palier ». Positionnement proposé : le diagnostic du site dit où tu en es, le plan dit quoi faire.

## 2. Lien iClosed
`NEXT_PUBLIC_ICLOSED_URL` à renseigner dans Vercel AVANT le build, sinon les boutons « Réserve un appel diagnostic » ne mènent nulle part.

## 3. CloseMate
Voir `docs/CLOSEMATE.md` : mots-clés en correspondance exacte, lever le blocage « agent IA actif » pour ces mots-clés.
