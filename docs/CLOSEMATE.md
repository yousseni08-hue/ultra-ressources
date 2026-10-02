# Réglages CloseMate pour les ressources (à faire AVANT de poster la 1ʳᵉ story)

## 1. Lever le blocage « pas d'automation si l'agent IA est actif » pour ces mots-clés
Environ 90 % des gens qui répondent aux stories ont déjà une conversation ouverte avec l'agent. Avec le blocage actuel, **ils ne recevront jamais le lien**. Les mots-clés de ressource doivent passer même si l'agent est actif.

## 2. Les mots-clés : un mot simple, et le message doit être CE mot seul
Décision Yakine (02/10) : des mots courts et simples que les gens tapent sans réfléchir, sans variantes bizarres.

| Mot-clé | Ressource | Lien |
|---|---|---|
| `PLAN` | Le plan pour augmenter ton profit et sortir de l'opérationnel dans les 12 prochains mois (quiz) | `/plan?utm_medium=dm&utm_campaign=plan&kw=PLAN` |
| `BTP` | Comment augmenter ton chiffre d'affaires de 30 % quand tu es artisan du BTP | `/btp?utm_medium=dm&utm_campaign=btp&kw=BTP` |
| `RESTO` | La méthode pour augmenter ton panier moyen de 30 % et doubler ton chiffre d'affaires | `/resto?utm_medium=dm&utm_campaign=resto&kw=RESTO` |
| `SALON` | La ressource beauté (coiffure, barbier, institut, ongles, cils, spa) | `/salon?utm_medium=dm&utm_campaign=salon&kw=SALON` |

**Réglage indispensable : déclenchement uniquement si le message contient le mot SEUL** (correspondance exacte, insensible à la casse et aux accents : « btp », « BTP », « salon », « Salon »). Ce sont des mots courants : en mode « contient le mot », un prospect qui écrit « j'ai un salon de coiffure » recevrait le lien en pleine conversation (c'est le bug garage/coaching du 14/09). Tag posé : `LM-{MOTCLE}`. Une seule activation par contact.

## 3. Le message envoyé : on livre d'abord, on ne qualifie pas avant
> Voilà ta ressource 👇
> {lien}
> Dis-moi quand tu l'as lue, je te dis par quoi je commencerais à ta place.

Pas de question sur le secteur ou le CA avant le lien : la page s'en charge. La conversation de l'agent reprend **après** la livraison.

## 4. ManyChat
Vérifier qu'aucune automation ManyChat (gérée par Noélie) n'écoute ces mots-clés, sinon double message.
