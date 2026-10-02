import { NextResponse } from 'next/server';
import { getLeadMagnet, getRoadmap } from '@/lib/content';
import { handleLead, isValidPhone, normalizePhone, type Lead } from '@/lib/leads';
import { answerLabel, secteurOf } from '@/lib/roadmap';
import { signToken } from '@/lib/token';

const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  // Champ piège invisible : un humain ne le remplit jamais.
  if (clean(body.website)) return NextResponse.json({ ok: true, redirect: '/' });

  const resource = clean(body.resource, 60);
  const firstName = clean(body.firstName, 60);
  const phone = clean(body.phone, 30);

  const answers: Record<string, string> = {};
  if (body.answers && typeof body.answers === 'object') {
    for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) answers[clean(k, 40)] = clean(v, k === 'nom' ? 60 : 300);
  }
  // Roadmap : secteur et CA sont déjà répondus dans le quiz, le formulaire ne les redemande pas.
  const sector = clean(body.sector, 30) || answers.secteur || '';
  const ca = clean(body.ca, 30) || answers.ca || '';

  if (!firstName) return NextResponse.json({ error: 'Ton prénom ?' }, { status: 400 });
  if (!isValidPhone(phone)) return NextResponse.json({ error: 'Ce numéro ne semble pas valide.' }, { status: 400 });
  if (!sector || !ca) return NextResponse.json({ error: 'Secteur et chiffre d’affaires, s’il te plaît.' }, { status: 400 });

  let resourceTitle = '';
  let stage: number | undefined;
  let redirect = '';
  let details: [string, string][] | undefined;
  let tokenExtra: Record<string, string> = {};

  if (resource === 'roadmap') {
    const rm = getRoadmap();
    resourceTitle = rm.title;
    stage = rm.scoring.effectifToStage[answers.effectif] ?? rm.stages[0].id;
    const sec = secteurOf(rm.secteurs, sector);
    const lab = (id: string) => answerLabel(id, answers[id], rm.questions, sec);
    // Lisible dans la notif Slack : le setter a tout le contexte avant de composer le numéro.
    details = [
      ['Entreprise', answers.nom],
      ['Activité', lab('specialite')],
      ['Équipe', lab('effectif')],
      ['Trésorerie', lab('tresorerie')],
      ['Frein n°1', lab('frein')],
      [sec?.kpi?.short || 'Chiffre clé', lab('kpi')],
    ].filter((d): d is [string, string] => !!d[1]);
    // Jeton compact : ids des réponses + nom d'entreprise (le prénom est déjà dans « n »).
    const ids = { sp: answers.specialite, nm: answers.nom, ef: answers.effectif, ca, tr: answers.tresorerie, fr: answers.frein, kp: answers.kpi };
    tokenExtra = Object.fromEntries(Object.entries(ids).filter(([, v]) => !!v)) as Record<string, string>;
  } else {
    const lm = getLeadMagnet(resource);
    if (!lm) return NextResponse.json({ error: 'Ressource inconnue' }, { status: 404 });
    resourceTitle = lm.title;
  }

  const lead: Lead = {
    firstName,
    phone: normalizePhone(phone),
    sector,
    ca,
    resource,
    resourceTitle,
    source: clean(body.source, 30),
    campaign: clean(body.campaign, 60),
    keyword: clean(body.keyword, 30),
    stage: stage ? String(stage) : undefined,
    answers,
    details,
    createdAt: Date.now(),
  };

  const notify = await handleLead(lead);

  const token = signToken({ r: resource, n: firstName, sec: sector, ...(stage ? { s: stage } : {}), ...tokenExtra });
  redirect = resource === 'roadmap' ? `/plan/resultat?t=${token}` : `/${resource}/ressource?t=${token}`;

  return NextResponse.json({ ok: true, redirect, notify });
}
