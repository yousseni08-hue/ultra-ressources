import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/token';

// Le lead écrit son objectif chiffré à 4 mois en fin de ressource : on le pousse dans Slack
// pour que le setter ait son ouverture d'appel. Protégé par le jeton d'accès.
export async function POST(req: Request) {
  const { t, objectif } = await req.json().catch(() => ({}));
  const tok = verifyToken<{ r: string; n: string }>(t);
  const text = typeof objectif === 'string' ? objectif.trim().slice(0, 500) : '';
  if (!tok || !text) return NextResponse.json({ error: 'invalide' }, { status: 400 });
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `🎯 *${tok.n}* (${tok.r}) a écrit son objectif à 4 mois : « ${text} »` }),
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
