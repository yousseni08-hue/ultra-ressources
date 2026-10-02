// Logique pure du quiz Roadmap adaptatif (partagée par le quiz client, l'API et la page résultat).
// Référence : scripts/build-apercu.mjs, section « Roadmap : quiz adaptatif ». Pas d'accès disque ici.
import type { RoadmapQuestion, RoadmapSecteur } from './content';

// Questions dont le contenu dépend du secteur : effacées quand on change de secteur.
export const SEC_DEP = ['specialite', 'nom', 'frein', 'kpi'] as const;
export const PLACEHOLDERS = ['prenom', 'nom', 'noun', 'Noun', 'vend'] as const;

// Milieu de chaque tranche de CA, pour l'ordre de grandeur du chantier n°1.
export const MID: Record<string, number> = {
  'moins-100k': 70000,
  '100-300k': 200000,
  '300-500k': 400000,
  '500k-1m': 750000,
  'plus-1m': 1500000,
};

export const EFF: Record<string, string> = {
  seul: 'Tu tiens tout seul, sans salarié.',
  'seul-renforts': 'Tu es seul, avec des extras ou des sous-traitants.',
  '1-4': 'Tu as une équipe de 1 à 4 personnes.',
  '5-9': 'Tu as une équipe de 5 à 9 personnes.',
  '10-19': 'Tu as une équipe de 10 à 19 personnes.',
  '20-49': 'Tu as une équipe de 20 à 49 personnes.',
  '50-99': 'Tu as une équipe de 50 à 99 personnes.',
  '100-plus': 'Tu as plus de 100 personnes.',
};

export const TRESO: Record<string, string> = {
  'moins-5k':
    "Avec moins de 5 000 € de côté, tu n'as pas le droit à l'erreur. Avant tout recrutement ou toute pub, ta priorité est de faire entrer l'argent que tu as déjà gagné : acomptes, relances, factures en retard.",
  '5-20k':
    "Tu as un petit matelas : de quoi tenir, pas de quoi recruter sereinement. Ce qui fait entrer de l'argent vite passe avant tout le reste.",
  '20-50k':
    "Ta trésorerie te permet d'investir dans le chantier ci-dessus sans te mettre en danger. Le frein n'est pas l'argent, c'est le temps que tu y mets.",
  'plus-50k':
    "Avec plus de 50 000 € de côté, l'argent n'est pas ton frein. Ce qui te retient, c'est l'organisation : tu peux aller vite si tu décides vite.",
};

export type QuizSecteur = Pick<
  RoadmapSecteur,
  'id' | 'nounDefault' | 'nomLabel' | 'nomPlaceholder' | 'specialite' | 'effectifLabel' | 'frein' | 'kpi'
>;
export type QuizStep =
  | { id: string; type: 'text'; label: string; placeholder: string }
  | { id: string; type: 'choice'; label: string; help?: string; options: { id: string; label: string }[] };
export type Ctx = { prenom: string; nom: string; noun: string; Noun: string; vend: string; spLabel: string };

/** Espaces insécables dans les nombres (« 5 000 € », « 10 % ») pour éviter les coupures de ligne. */
export const nb = (s: string) => String(s ?? '').replace(/(\d) (?=[\d€%])/g, '$1 ');
export const lc = (s?: string) => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);
export const fmt = (n: number) => nb((Math.round(n / 1000) * 1000).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €');

export function secteurOf<T extends QuizSecteur>(secteurs: Record<string, T>, id?: string): T | undefined {
  return (id && secteurs[id]) || secteurs.autre;
}

export function stepAt(i: number, flow: string[], questions: RoadmapQuestion[], s?: QuizSecteur): QuizStep | null {
  const id = flow[i];
  if (!id) return null;
  const g = questions.find((q) => q.id === id);
  if (id === 'nom') return { id, type: 'text', label: s?.nomLabel || "Comment s'appelle ton entreprise ?", placeholder: s?.nomPlaceholder || '' };
  if (id === 'effectif' && g) return { ...g, type: 'choice', label: s?.effectifLabel || g.label };
  if ((SEC_DEP as readonly string[]).includes(id)) {
    const q = s?.[id as 'specialite' | 'frein' | 'kpi'];
    return { id, type: 'choice', label: q?.label || '', help: q?.help, options: q?.options || [] };
  }
  return g ? { ...g, type: 'choice' } : null;
}

export function ctx(ans: Record<string, string>, s?: QuizSecteur, prenom = ''): Ctx {
  const sp = s?.specialite?.options.find((o) => o.id === ans.specialite);
  const noun = sp?.noun || s?.nounDefault || 'ton entreprise';
  return {
    prenom,
    nom: ans.nom || 'ton entreprise',
    noun,
    Noun: noun.charAt(0).toUpperCase() + noun.slice(1),
    vend: sp?.vend || 'tes prestations',
    spLabel: sp?.label || '',
  };
}

/** Remplace {prenom} {nom} {noun} {Noun} {vend}, et évite « chez Chez Karim » quand le nom commence par « Chez ». */
export function fill(t: string | undefined, c: Ctx) {
  return nb(
    String(t || '')
      .replace(/(chez|Chez) \{nom\}/g, (m) => (/^chez\s/i.test(c.nom) ? '{nom}' : m))
      .replace(/\{(prenom|nom|noun|Noun|vend)\}/g, (_, k: keyof Ctx) => c[k]),
  );
}

/** Libellé d'une réponse (questions globales ou propres au secteur), nombres insécables. */
export function answerLabel(id: string, v: string | undefined, questions: RoadmapQuestion[], s?: QuizSecteur) {
  if (!v) return '';
  const q = id === 'kpi' || id === 'frein' || id === 'specialite' ? s?.[id] : questions.find((x) => x.id === id);
  return nb((q?.options as { id: string; label: string }[] | undefined)?.find((o) => o.id === v)?.label || '');
}
