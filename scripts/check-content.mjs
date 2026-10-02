// Vérifie le contenu avant déploiement : frontmatter complet, calculateurs connus, roadmap cohérente,
// et aucun « À VALIDER » visible (les notes internes doivent rester en commentaires HTML).
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CALCS = ['devis-dormants', 'marge-chantier', 'cout-matiere', 'ticket-rush', 'salon-5-regles'];
const errors = [];
const warns = [];

const dir = path.join(root, 'content/lead-magnets');
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'))) {
  const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const k of ['slug', 'keyword', 'title', 'promise', 'cta']) if (!data[k]) errors.push(`${f} : champ « ${k} » manquant`);
  if (data.slug && `${data.slug}.md` !== f) errors.push(`${f} : slug « ${data.slug} » ≠ nom de fichier`);
  if (!Array.isArray(data.deliverables) || !data.deliverables.length) errors.push(`${f} : deliverables vide`);
  if (!Array.isArray(data.testimonials) || data.testimonials.length < 3) warns.push(`${f} : moins de 3 témoignages`);
  for (const m of content.matchAll(/\{\{calculator:([a-z0-9-]+)\}\}/g)) if (!CALCS.includes(m[1])) errors.push(`${f} : calculateur inconnu « ${m[1]} »`);
  const LIENS = JSON.parse(fs.readFileSync(path.join(root, 'content/liens.json'), 'utf8'));
  for (const m of content.matchAll(/\{\{sheet:([a-z0-9-]+)\}\}/g)) if (!(m[1] in LIENS)) errors.push(`${f} : modèle inconnu « ${m[1]} » (ajoute-le dans content/liens.json)`); else if (!LIENS[m[1]]) warns.push(`${f} : lien du modèle « ${m[1]} » vide dans content/liens.json`);
  const visible = content.replace(/<!--[\s\S]*?-->/g, '');
  if (/À VALIDER|MANQUE PREUVE/i.test(visible)) errors.push(`${f} : « À VALIDER » visible hors commentaire`);
  const notes = (content.match(/<!--[\s\S]*?À VALIDER[\s\S]*?-->/g) || []).length;
  if (notes) warns.push(`${f} : ${notes} note(s) À VALIDER en commentaire (invisibles en ligne, à trancher)`);
}

const rm = JSON.parse(fs.readFileSync(path.join(root, 'content/roadmap.json'), 'utf8'));
const stageIds = new Set(rm.stages.map((s) => s.id));
for (const [opt, st] of Object.entries(rm.scoring.effectifToStage)) if (!stageIds.has(st)) errors.push(`roadmap : ${opt} → palier ${st} inexistant`);
const effQ = rm.questions.find((q) => q.options.every((o) => o.id in rm.scoring.effectifToStage));
if (!effQ) errors.push('roadmap : aucune question dont toutes les options sont mappées dans effectifToStage');
if (!rm.questions.find((q) => q.id === 'secteur')) errors.push('roadmap : question « secteur » manquante');
for (const s of rm.stages) for (const f of rm.functions) if (!s.actions?.[f.id]) warns.push(`roadmap : palier ${s.id} sans action « ${f.id} »`);
const blank = (v) => typeof v !== 'string' || !v.trim();
for (const s of rm.stages) {
  for (const k of ['graduateBy', 'graduateWhen']) if (blank(s[k])) errors.push(`roadmap : palier ${s.id} sans « ${k} »`);
  for (const k of ['title', 'text', 'button']) if (blank(s.cta?.[k])) errors.push(`roadmap : palier ${s.id} sans « cta.${k} »`);
  if (s.stat != null) for (const k of ['figure', 'text', 'source']) if (blank(s.stat[k])) errors.push(`roadmap : palier ${s.id} « stat.${k} » vide (retirer « stat » ou le compléter)`);
}

// ── Quiz adaptatif : flow + un fichier par secteur (content/roadmap-secteurs/<secteur>.json)
const SEC_DEP = ['specialite', 'nom', 'frein', 'kpi'];
const PH = new Set(['prenom', 'nom', 'noun', 'Noun', 'vend']);
const qIds = new Set(rm.questions.map((q) => q.id));
if (!Array.isArray(rm.flow) || !rm.flow.length) errors.push('roadmap : « flow » manquant');
else {
  if (new Set(rm.flow).size !== rm.flow.length) errors.push('roadmap : « flow » contient des doublons');
  if (rm.flow[0] !== 'secteur') errors.push('roadmap : « flow » doit commencer par « secteur » (les questions suivantes en dépendent)');
  for (const id of rm.flow) if (!qIds.has(id) && !SEC_DEP.includes(id)) errors.push(`roadmap : « flow » cite « ${id} », ni question globale ni question de secteur`);
  for (const id of qIds) if (!rm.flow.includes(id)) errors.push(`roadmap : question « ${id} » absente de « flow »`);
  for (const id of ['effectif', 'ca']) if (!rm.flow.includes(id)) errors.push(`roadmap : « ${id} » doit être dans « flow » (palier / priorité du lead)`);
}
const testNames = new Set(rm.testimonials.map((t) => t.name));
const secDir = path.join(root, 'content/roadmap-secteurs');
const secFiles = fs.existsSync(secDir) ? fs.readdirSync(secDir).filter((f) => f.endsWith('.json')) : [];
const secIds = new Set();
const checkPh = (where, txt) => {
  for (const m of String(txt ?? '').matchAll(/\{([^{}]*)\}/g)) if (!PH.has(m[1])) errors.push(`${where} : placeholder inconnu « {${m[1]}} »`);
};
const walk = (where, v) => {
  if (typeof v === 'string') checkPh(where, v);
  else if (Array.isArray(v)) v.forEach((x) => walk(where, x));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(where, x));
};
for (const f of secFiles) {
  const where = `roadmap-secteurs/${f}`;
  let x;
  try {
    x = JSON.parse(fs.readFileSync(path.join(secDir, f), 'utf8'));
  } catch (e) {
    errors.push(`${where} : JSON invalide (${e.message})`);
    continue;
  }
  if (`${x.id}.json` !== f) errors.push(`${where} : id « ${x.id} » ≠ nom de fichier`);
  secIds.add(x.id);
  for (const k of ['specialite', 'frein', 'kpi']) {
    if (!x[k]?.label) errors.push(`${where} : « ${k}.label » manquant`);
    if (!Array.isArray(x[k]?.options) || !x[k].options.length) errors.push(`${where} : « ${k}.options » vide`);
    else {
      const ids = x[k].options.map((o) => o.id);
      if (ids.some((id) => !id) || new Set(ids).size !== ids.length) errors.push(`${where} : ids d'options « ${k} » manquants ou en double`);
    }
  }
  if (!x.nomLabel) warns.push(`${where} : « nomLabel » absent (libellé par défaut utilisé)`);
  for (const o of x.specialite?.options || []) if (!o.noun || !o.vend) warns.push(`${where} : spécialité « ${o.id} » sans noun/vend`);
  for (const o of x.frein?.options || []) {
    if (!(o.id in (x.levers || {}))) errors.push(`${where} : frein « ${o.id} » sans levier dans « levers »`);
  }
  for (const [id, l] of Object.entries(x.levers || {})) {
    if (!(x.frein?.options || []).some((o) => o.id === id)) warns.push(`${where} : levier « ${id} » ne correspond à aucun frein`);
    if (!l) { errors.push(`${where} : levier « ${id} » vide`); continue; }
    if (!l.title || !l.diagnosis) errors.push(`${where} : levier « ${id} » sans title/diagnosis`);
    if (!Array.isArray(l.actions) || !l.actions.length) errors.push(`${where} : levier « ${id} » sans actions`);
    if (l.money != null) {
      const p = l.money.pctOfCA;
      if (typeof p !== 'number' || !(p > 0 && p <= 0.2)) errors.push(`${where} : levier « ${id} » pctOfCA=${p} hors de ]0 ; 0,2]`);
      if (!l.money.explain) errors.push(`${where} : levier « ${id} » money sans explain`);
    }
    if (l.proof && !testNames.has(l.proof)) errors.push(`${where} : levier « ${id} » proof « ${l.proof} » absent des témoignages de roadmap.json`);
  }
  if (!Array.isArray(x.proofs) || !x.proofs.length) warns.push(`${where} : aucune preuve (« proofs »)`);
  for (const n of x.proofs || []) if (!testNames.has(n)) errors.push(`${where} : preuve « ${n} » absente des témoignages de roadmap.json`);
  walk(where, x);
}
for (const o of rm.questions.find((q) => q.id === 'secteur')?.options || [])
  if (!secIds.has(o.id)) (secIds.has('autre') ? warns : errors).push(`roadmap : secteur « ${o.id} » sans fichier roadmap-secteurs/${o.id}.json${secIds.has('autre') ? ' (repli sur autre.json)' : ''}`);
const effOpts = rm.questions.find((q) => q.id === 'effectif')?.options || [];
for (const o of effOpts) if (!(o.id in rm.scoring.effectifToStage)) errors.push(`roadmap : effectif « ${o.id} » sans palier dans effectifToStage`);

warns.forEach((w) => console.log('⚠️ ', w));
errors.forEach((e) => console.log('❌', e));
console.log(errors.length ? `\n${errors.length} erreur(s).` : '\n✅ Contenu OK.');
process.exit(errors.length ? 1 : 0);
