// Tout ce qui se passe quand un numéro tombe. Chaque canal est indépendant :
// une panne Sheet / Close / webhook ne bloque jamais la notif Slack, et rien ne fait échouer l'opt-in.

export const CA_OPTIONS = [
  { id: 'moins-100k', label: 'Moins de 100 k€', floor: 0 },
  { id: '100-300k', label: '100 à 300 k€', floor: 100000 },
  { id: '300-500k', label: '300 à 500 k€', floor: 300000 },
  { id: '500k-1m', label: '500 k€ à 1 M€', floor: 500000 },
  { id: 'plus-1m', label: 'Plus de 1 M€', floor: 1000000 },
] as const;

export const SECTOR_OPTIONS = [
  { id: 'btp', label: 'BTP / artisanat' },
  { id: 'resto', label: 'Restauration' },
  { id: 'auto', label: 'Garage / automobile' },
  { id: 'beaute', label: 'Salon / beauté / bien-être' },
  { id: 'commerce', label: 'Commerce / boutique' },
  { id: 'nettoyage', label: 'Nettoyage / entretien' },
  { id: 'autre', label: 'Autre' },
] as const;

export type Lead = {
  firstName: string;
  phone: string;
  sector: string;
  ca: string;
  resource: string; // slug
  resourceTitle?: string;
  source?: string; // utm_medium : story / reel / bio / dm
  campaign?: string;
  keyword?: string;
  stage?: string; // palier roadmap
  answers?: Record<string, string>;
  details?: [string, string][]; // réponses lisibles (quiz Roadmap) affichées dans la notif
  createdAt: number;
};

const label = (list: readonly { id: string; label: string }[], id?: string) => list.find((o) => o.id === id)?.label ?? id ?? '—';

export function normalizePhone(raw = '') {
  let p = String(raw).replace(/[^\d+]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (/^0[1-9]\d{8}$/.test(p)) p = '+33' + p.slice(1); // 06 12 34 56 78 → +33612345678
  return p;
}

export function isValidPhone(raw = '') {
  return /^\+\d{9,15}$/.test(normalizePhone(raw));
}

export function isPriority(lead: Pick<Lead, 'ca'>) {
  const min = Number(process.env.LEAD_PRIORITY_MIN_CA ?? 300000);
  return (CA_OPTIONS.find((o) => o.id === lead.ca)?.floor ?? 0) >= min;
}

function flat(lead: Lead) {
  return {
    createdAt: new Date(lead.createdAt).toISOString(),
    firstName: lead.firstName,
    phone: normalizePhone(lead.phone),
    sector: label(SECTOR_OPTIONS, lead.sector),
    ca: label(CA_OPTIONS, lead.ca),
    resource: lead.resourceTitle ?? lead.resource,
    stage: lead.stage ?? '',
    source: lead.source ?? '',
    campaign: lead.campaign ?? '',
    keyword: lead.keyword ?? '',
    priority: isPriority(lead) ? 'OUI' : '',
  };
}

export function slackPayload(lead: Lead) {
  const f = flat(lead);
  const head = isPriority(lead) ? '🔥 LEAD PRIORITAIRE — appelle maintenant' : '📞 Nouveau lead — appelle maintenant';
  const fields = [
    `*Prénom*\n${f.firstName}`,
    `*Téléphone*\n<tel:${f.phone}|${f.phone}>`,
    `*Secteur*\n${f.sector}`,
    `*CA annuel*\n${f.ca}`,
    `*Ressource*\n${f.resource}${f.stage ? ` · palier ${f.stage}` : ''}`,
    `*Source*\n${f.source || '—'}${f.keyword ? ` · ${f.keyword}` : ''}`,
  ];
  const quiz = lead.details?.length
    ? [{ type: 'section', text: { type: 'mrkdwn', text: lead.details.map(([k, v]) => `*${k}* : ${v}`).join('\n') } }]
    : [];
  const extra = lead.answers?.objectif ? [{ type: 'section', text: { type: 'mrkdwn', text: `*Objectif à 4 mois* : ${lead.answers.objectif}` } }] : [];
  return {
    text: `${head} : ${f.firstName} ${f.phone} (${f.resource})`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: head } },
      { type: 'section', fields: fields.map((text) => ({ type: 'mrkdwn', text })) },
      ...quiz,
      ...extra,
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Opt-in ${new Date(lead.createdAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} · il lit la ressource en ce moment · réagis ✅ quand tu l'as eu`,
          },
        ],
      },
    ],
  };
}

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${url.split('?')[0]} → ${res.status}`);
}

async function slack(lead: Lead) {
  if (!process.env.SLACK_WEBHOOK_URL) throw new Error('SLACK_WEBHOOK_URL manquant');
  await post(process.env.SLACK_WEBHOOK_URL.trim(), slackPayload(lead));
}

async function sheet(lead: Lead) {
  if (!process.env.SHEET_WEBHOOK_URL) return;
  await post(process.env.SHEET_WEBHOOK_URL.trim(), flat(lead));
}

async function close(lead: Lead) {
  if (!process.env.CLOSE_API_KEY) return;
  const f = flat(lead);
  await post(
    'https://api.close.com/api/v1/lead/',
    {
      name: f.firstName || f.phone,
      description: `Lead magnet : ${f.resource} · ${f.sector} · CA ${f.ca} · ${f.source}`,
      contacts: [{ name: f.firstName, phones: [{ phone: f.phone, type: 'mobile' }] }],
    },
    { Authorization: 'Basic ' + Buffer.from(process.env.CLOSE_API_KEY.trim() + ':').toString('base64') },
  );
}

async function forward(lead: Lead) {
  if (!process.env.LEAD_FORWARD_WEBHOOK_URL) return;
  await post(process.env.LEAD_FORWARD_WEBHOOK_URL.trim(), { ...flat(lead), answers: lead.answers ?? {} });
}

// 👉 Point d'extension : brancher ici la base de données interne si besoin
// (ex. await db.insert(leads).values(flat(lead))). Laisser vide = Sheet + Slack suffisent.
async function saveToDatabase(_lead: Lead) {}

export async function handleLead(lead: Lead) {
  const channels = { db: saveToDatabase, slack, sheet, close, forward };
  const results = await Promise.allSettled(Object.values(channels).map((fn) => fn(lead)));
  const status: Record<string, string> = {};
  Object.keys(channels).forEach((k, i) => {
    const r = results[i];
    status[k] = r.status;
    if (r.status === 'rejected') console.error(`[lead] ${k} :`, (r.reason as Error)?.message);
  });
  return status;
}
