// Envoie un faux lead dans le vrai Slack pour vérifier le branchement.
// Usage : SLACK_WEBHOOK_URL=... node scripts/test-notify.mjs
const url = process.env.SLACK_WEBHOOK_URL;
if (!url) { console.error('SLACK_WEBHOOK_URL manquant'); process.exit(1); }
const res = await fetch(url.trim(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: '🧪 TEST — ressources ULTRA : si tu lis ça sur ton téléphone, les notifs de leads sont branchées.' }),
});
console.log(res.ok ? '✅ Message envoyé dans Slack' : `❌ ${res.status} ${await res.text()}`);
