import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DIR = path.join(process.cwd(), 'content');

export type Testimonial = { name: string; business: string; result: string; quote?: string; url?: string; source?: string; stages?: number[] };

export type LeadMagnet = {
  slug: string;
  keyword: string;
  niche: string;
  title: string;
  promise: string;
  audience: string;
  deliverables: string[];
  cta: string;
  calculator?: string;
  testimonials: Testimonial[];
  body: string; // markdown, peut contenir {{calculator:id}}
};

export function listLeadMagnets(): LeadMagnet[] {
  const dir = path.join(DIR, 'lead-magnets');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => getLeadMagnet(f.replace(/\.md$/, ''))!)
    .filter(Boolean);
}

export function getLeadMagnet(slug: string): LeadMagnet | null {
  const file = path.join(DIR, 'lead-magnets', `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  return {
    slug: data.slug ?? slug,
    keyword: data.keyword ?? '',
    niche: data.niche ?? '',
    title: data.title ?? slug,
    promise: data.promise ?? '',
    audience: data.audience ?? '',
    deliverables: data.deliverables ?? [],
    cta: data.cta ?? 'Je reçois la ressource',
    calculator: data.calculator,
    testimonials: data.testimonials ?? [],
    body: content,
  };
}

export type RoadmapOption = { id: string; label: string };
export type RoadmapQuestion = { id: string; label: string; help?: string; options: RoadmapOption[] };
export type RoadmapStage = {
  id: number;
  name: string;
  effectif: string;
  founderRole: string;
  summary: string;
  bottleneck: string;
  signsOk: string[];
  signsKo: string[];
  actions: Record<string, string>;
  top3: string[];
  examples: Record<string, string>;
  /** Ce qui fait passer au palier suivant (case mise en avant de la fiche). */
  graduateBy: string;
  /** Le signal qu'on est prêt pour la suite. */
  graduateWhen: string;
  cta: { title: string; text: string; button: string };
  /** Chiffre sourcé, optionnel : affiché seulement s'il existe. */
  stat?: { figure: string; text: string; source: string };
};
export type Roadmap = {
  slug: string;
  keyword: string;
  title: string;
  promise: string;
  audience: string;
  deliverables: string[];
  cta: string;
  functions: { id: string; label: string }[];
  questions: RoadmapQuestion[];
  stages: RoadmapStage[];
  stageRule: string;
  scoring: { effectifToStage: Record<string, number> };
  testimonials: Testimonial[];
  /** Ordre des étapes du quiz : ids de `questions` (globales) ou des questions propres au secteur. */
  flow: string[];
  flowNote?: string;
  /** Contenu propre à chaque secteur, chargé depuis content/roadmap-secteurs/<id>.json. */
  secteurs: Record<string, RoadmapSecteur>;
};

// ── Contenu par secteur (content/roadmap-secteurs/<secteur>.json)
export type RoadmapSpecialite = RoadmapOption & { noun?: string; vend?: string };
export type RoadmapKpiOption = RoadmapOption & { level?: string; read?: string };
export type RoadmapLever = {
  title: string;
  diagnosis: string;
  actions: string[];
  money: { pctOfCA: number; explain: string } | null;
  proof?: string;
};
export type RoadmapSecteur = {
  id: string;
  nounDefault?: string;
  nomLabel?: string;
  nomPlaceholder?: string;
  specialite: { label: string; help?: string; options: RoadmapSpecialite[] };
  effectifLabel?: string;
  frein: { label: string; help?: string; options: RoadmapOption[] };
  kpi: { label: string; help?: string; short?: string; options: RoadmapKpiOption[] };
  levers: Record<string, RoadmapLever | null>;
  proofs: string[];
};

export function getRoadmap(): Roadmap {
  const rm = JSON.parse(fs.readFileSync(path.join(DIR, 'roadmap.json'), 'utf8')) as Roadmap;
  rm.secteurs = {};
  const dir = path.join(DIR, 'roadmap-secteurs');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const x = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as RoadmapSecteur;
      rm.secteurs[x.id] = x;
    }
  }
  return rm;
}

export function getRoadmapIntro(): string {
  const f = path.join(DIR, 'roadmap-intro.md');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
}

// Retire les commentaires HTML (notes internes « À VALIDER ») avant publication.
export function stripInternalNotes(md: string) {
  return md.replace(/<!--[\s\S]*?-->/g, '');
}
