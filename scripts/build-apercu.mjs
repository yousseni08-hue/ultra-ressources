// Génère des aperçus HTML autonomes (un fichier = une page, ouvrable sans serveur) aux couleurs du site ultra-consulting.eu.
// Usage : node scripts/build-apercu.mjs  → ../apercu/*.html
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { getCountryCallingCode } from 'libphonenumber-js/min';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(root, 'apercu');
fs.mkdirSync(out, { recursive: true });
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
:root{--bg:#0a0a0a;--card:#141414;--line:#262626;--gray-dark:#1a1a1a;--text:#f5f5f0;--muted:#a0a0a0;--orange:#ff5b14;--glow:#ff7b3a;--ok:#3ccf6e;--bad:#ff5b5b}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(60% 40% at 85% 0%,rgba(255,91,20,.14),transparent 70%)}
a{color:var(--orange)}
h1,h2,h3,.mont{font-family:Montserrat,system-ui,sans-serif;letter-spacing:-.02em;line-height:1.1}
h1{font-size:clamp(32px,7vw,56px);font-weight:900;margin:0 0 18px}
h2{font-size:clamp(23px,4.6vw,32px);font-weight:800;margin:56px 0 14px}
h3{font-size:19px;font-weight:800;margin:30px 0 8px}
.o{color:var(--orange)}
.wrap{max-width:760px;margin:0 auto;padding:0 16px;position:relative}
.nav{display:flex;flex-wrap:wrap;gap:8px 0;align-items:center;justify-content:space-between;padding:18px 0;border-bottom:1px solid var(--line)}.nav>div:last-child{display:flex;flex-wrap:wrap}
.logo{font-family:Montserrat;font-weight:900;font-size:22px;letter-spacing:.02em}.logo span{color:var(--orange)}
.nav a{font-size:14px;color:var(--muted);text-decoration:none;margin-left:12px}@media(max-width:560px){.nav a{margin:0 12px 0 0}}.nav a:hover{color:var(--text)}
.tag{display:inline-block;font-family:Montserrat;font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);border:1px solid rgba(255,91,20,.4);border-radius:99px;padding:6px 12px;margin:36px 0 18px}
.lead{font-size:20px;color:var(--muted);margin:0 0 26px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px}
.cover{border-color:rgba(255,91,20,.35);box-shadow:0 30px 80px -40px rgba(255,91,20,.45)}
.gets{list-style:none;padding:0;margin:0}.gets li{position:relative;padding-left:32px;margin:12px 0}
.gets li::before{content:"✓";position:absolute;left:0;top:3px;width:21px;height:21px;border-radius:50%;background:var(--orange);color:#0a0a0a;font-weight:900;font-size:12px;display:grid;place-items:center}
.btn{display:block;width:100%;text-align:center;text-decoration:none;cursor:pointer;border:0;border-radius:14px;padding:17px 18px;background:var(--orange);color:#0a0a0a;font-family:Montserrat;font-weight:900;font-size:17px;box-shadow:0 12px 40px -12px rgba(255,91,20,.6)}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--line);box-shadow:none}
.prose p,.prose li{color:#e9e8e2}.prose ul,.prose ol{padding-left:22px}.prose li{margin:7px 0}
.prose strong{color:var(--text)}
.prose blockquote{margin:20px 0;padding:14px 18px;border-left:4px solid var(--orange);background:var(--card);border-radius:0 12px 12px 0}
.prose table{width:100%;border-collapse:collapse;font-size:15px;display:block;overflow-x:auto;margin:18px 0}
.prose th,.prose td{border:1px solid var(--line);padding:9px 11px;text-align:left;vertical-align:top}.prose th{background:var(--gray-dark);font-family:Montserrat;font-weight:800;font-size:13px}
.prose code{background:var(--gray-dark);padding:2px 6px;border-radius:6px}
.prose hr{border:0;border-top:1px solid var(--line);margin:40px 0}
.prose h2{padding-top:22px;border-top:1px solid var(--line)}
.prose h4{font-family:Montserrat,system-ui,sans-serif;font-weight:800;font-size:16px;color:var(--orange);margin:22px 0 6px}
.calc{margin:30px 0;border-color:var(--orange)}.calc h3{margin-top:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:560px){.grid{grid-template-columns:1fr}}
label{display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--muted)}
input,select,textarea{width:100%;font:inherit;font-size:16px;color:var(--text);background:var(--bg);border:1px solid var(--line);border-radius:11px;padding:12px 14px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--orange)}
.result{margin-top:16px;padding:18px;border-radius:12px;background:var(--bg);border:1px dashed #333}
.big{font-family:Montserrat;font-weight:900;font-size:36px;color:var(--orange);line-height:1.1}
mark{background:var(--orange);color:#0a0a0a;border-radius:5px;padding:0 6px;font-weight:700}
.case{display:grid;gap:6px}.case .kpi{font-family:Montserrat;font-weight:900;font-size:30px;color:var(--orange);line-height:1}
.case .who{font-weight:700}.case .biz{color:var(--muted);font-size:14px}.case .q{font-style:italic;color:#d8d7d0}
.cases{display:grid;gap:14px;margin:18px 0}
.foot{padding:50px 0 70px;color:var(--muted);font-size:13px}
.note{font-size:13px;color:var(--muted)}
.phone-row{display:flex;gap:8px}.phone-row select{flex:0 0 112px;width:112px}.phone-row input{flex:1;min-width:0}
.pill{display:inline-block;background:var(--orange);color:#0a0a0a;font-family:Montserrat;font-weight:900;border-radius:99px;padding:5px 13px;font-size:13px}
`;


// Sélecteur d'indicatif : les 23 pays du diagnostic d'ultra-consulting.eu, même ordre (même liste que lib/countries.ts)
const TOP = ['FR', 'BE', 'CH', 'LU', 'MC', 'CA', 'GB', 'DE', 'ES', 'IT', 'PT', 'NL', 'MA', 'DZ', 'TN', 'SN', 'CI', 'CM', 'MU', 'RE', 'GP', 'MQ', 'GF'];
const rn = new Intl.DisplayNames(['fr'], { type: 'region' });
const flagOf = (c) => String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
const COUNTRY_OPTS = TOP.map((c) => `<option value="${c}" title="${esc(rn.of(c))}">${flagOf(c)} +${getCountryCallingCode(c)}</option>`).join('');
const phoneField = (id) => `<label>Ton numéro de téléphone</label><div class="phone-row"><select aria-label="Indicatif pays">${COUNTRY_OPTS}</select><input id="${id}" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="06 12 34 56 78"></div>`;
const head = (title) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>`;
const nav = `<div class="wrap"><div class="nav"><div class="logo">ULTRA<span>.</span></div><div><a href="index.html">Aperçus</a><a href="roadmap.html">Plan</a><a href="btp.html">BTP</a><a href="resto.html">Resto</a><a href="salon.html">Salon</a></div></div></div>`;
const foot = `<div class="wrap foot">Aperçu de travail ULTRA · ressource offerte, ne pas diffuser en l'état.</div></body></html>`;

function caseCard(t) {
  const kpi = t.kpi || '';
  return `<div class="card case">${kpi ? `<div class="kpi">${esc(kpi)}</div>` : ''}<div class="who">${esc(t.name)}</div><div class="biz">${esc(t.business || '')}</div><div>${esc(t.result)}</div>${t.quote ? `<div class="q">« ${esc(t.quote)} »</div>` : ''}${t.url ? `<a href="${esc(t.url)}${t.url.includes("?") ? "&" : "?"}utm_source=ressources" target="_blank">Lire son histoire →</a>` : ''}</div>`;
}

// ── Calculateurs (JS vanilla, injectés à la place de {{calculator:id}})
const CALC = {
  'devis-dormants': `<div class="card calc" id="c-devis"><h3>L'argent qui attend une réponse</h3><div class="grid">
<div><label>Devis envoyés sans réponse</label><input type="number" data-k="nb" value="10"></div>
<div><label>Montant moyen d'un devis (€ HT)</label><input type="number" data-k="moy" value="8000"></div></div>
<div class="result"><div class="big" data-o="att"></div><p data-o="txt" style="margin:8px 0 0"></p></div></div>
<script>(()=>{const r=document.getElementById('c-devis'),v=k=>+r.querySelector('[data-k='+k+']').value||0,e=n=>Math.round(n).toLocaleString('fr-FR')+' €';
const f=()=>{r.querySelector('[data-o=att]').textContent=e(v('nb')*v('moy'));r.querySelector('[data-o=txt]').innerHTML='1 signature de plus : <b>+'+e(v('moy'))+'</b> · 2 signatures : <b>+'+e(v('moy')*2)+'</b> · 3 signatures : <mark>+'+e(v('moy')*3)+'</mark>'};
r.addEventListener('input',f);f()})()</script>`,
  'marge-chantier': `<div class="card calc" id="c-marge"><h3>Ce que ce chantier te laisse vraiment</h3><div class="grid">
<div><label>Montant du devis (€ HT)</label><input type="number" data-k="ht" value="25000"></div>
<div><label>Matériaux, location et sous-traitance (€)</label><input type="number" data-k="ach" value="8000"></div>
<div><label>Heures passées, toute l'équipe</label><input type="number" data-k="h" value="220"></div>
<div><label>Coût horaire chargé (€/h)</label><input type="number" data-k="ch" value="32"></div></div>
<div class="result"><div class="big" data-o="r"></div><p data-o="txt" style="margin:8px 0 0"></p></div></div>
<script>(()=>{const r=document.getElementById('c-marge'),v=k=>+r.querySelector('[data-k='+k+']').value||0;
const f=()=>{const reste=v('ht')-v('ach')-v('h')*v('ch'),p=reste/v('ht')*100;r.querySelector('[data-o=r]').textContent=Math.round(reste).toLocaleString('fr-FR')+' €';
r.querySelector('[data-o=txt]').innerHTML='Soit <mark>'+(isFinite(p)?p.toFixed(1).replace('.',','):'—')+' %</mark> du devis qui reste une fois le chantier payé.'};
r.addEventListener('input',f);f()})()</script>`,
  'ticket-rush': `<div class="card calc" id="c-rush"><h3>Ce que ta salle peut rapporter en plus sur un an</h3><div class="grid">
<div><label>Couverts sur un gros service</label><input type="number" data-k="cv" value="80"></div>
<div><label>Panier moyen par couvert (€)</label><input type="number" data-k="pm" value="22"></div>
<div><label>Gros services par mois</label><input type="number" data-k="nb" value="20"></div></div>
<div class="result"><div class="big" data-o="r"></div><p data-o="txt" style="margin:8px 0 0"></p></div></div>
<script>(()=>{const r=document.getElementById('c-rush'),v=k=>+r.querySelector('[data-k='+k+']').value||0,e=n=>Math.round(n).toLocaleString('fr-FR')+' €';
const f=()=>{const ca=v('cv')*v('pm')*v('nb')*12;r.querySelector('[data-o=r]').textContent='+ '+e(ca*.3);
r.querySelector('[data-o=txt]').innerHTML='par an avec <b>+30 % de panier moyen</b>, soit '+(v('pm')*.3).toFixed(2).replace('.',',')+' € de plus par couvert. Et <mark>+'+e(ca*.2)+'</mark> de plus si ta cuisine sort 20 % de couverts en plus.'};
r.addEventListener('input',f);f()})()</script>`,
  'salon-5-regles': `<div class="card calc" id="c-salon"><h3>Ton salon passe-t-il les règles ?</h3><div class="grid">
<div><label>Chiffre d'affaires du mois (€)</label><input type="number" data-k="ca" value="22000"></div>
<div><label>Ventes de produits du mois (€)</label><input type="number" data-k="prod" value="1800"></div>
<div><label>Salaires du mois, charges comprises (€)</label><input type="number" data-k="sal" value="11000"></div>
<div><label>Nombre de collaboratrices</label><input type="number" data-k="nb" value="2"></div></div>
<div class="result"><div class="big" data-o="n"></div><div data-o="rules"></div></div></div>
<script>(()=>{const r=document.getElementById('c-salon'),v=k=>+r.querySelector('[data-k='+k+']').value||0,e=n=>Math.round(n).toLocaleString('fr-FR')+' €';
const f=()=>{const ca=v('ca'),R=[['Produits : 15 % du CA minimum',v('prod')>=ca*.15,'Cible '+e(ca*.15)+', tu fais '+e(v('prod'))+'.'],['Salaires chargés : 45 % du CA maximum',v('sal')<=ca*.45,'Plafond '+e(ca*.45)+', tu es à '+e(v('sal'))+'.'],['Objectif : 100 800 € par an et par collaboratrice',ca*12>=v('nb')*100800,'Objectif '+e(v('nb')*100800)+', ton rythme donne '+e(ca*12)+'.']];
r.querySelector('[data-o=n]').textContent=R.filter(x=>x[1]).length+' sur 3';r.querySelector('[data-o=rules]').innerHTML=R.map(x=>'<p style="margin:8px 0 0"><b style="color:'+(x[1]?'var(--ok)':'var(--bad)')+'">'+(x[1]?'✓ ':'✗ ')+x[0]+'</b> · '+x[2]+'</p>').join('')};
r.addEventListener('input',f);f()})()</script>`,
  'cout-matiere': `<div class="card calc" id="c-cm"><h3>Le coût matière de chaque plat</h3><div class="grid">
<div><label>TVA sur tes plats (%)</label><input type="number" data-k="tva" value="10"></div><div><label>Seuil d'alerte coût matière (%)</label><input type="number" data-k="seuil" value="30"></div></div>
<div data-o="rows"></div><button class="btn ghost" style="margin-top:12px" data-o="add">+ Ajouter un plat</button></div>
<script>(()=>{const r=document.getElementById('c-cm'),rows=r.querySelector('[data-o=rows]');const plats=[['Plat phare',16,4.2],['Deuxième plat',14,4.9],['Dessert',7,1.4]];
const row=(n,p,c)=>{const d=document.createElement('div');d.className='result';d.innerHTML='<div class="grid"><div><label>Plat</label><input value="'+n+'"></div><div><label>Prix TTC (€)</label><input type="number" data-p value="'+p+'"></div><div><label>Ingrédients par portion (€)</label><input type="number" data-c value="'+c+'"></div><div><label>Résultat</label><div data-res style="padding-top:8px"></div></div></div>';rows.appendChild(d)};
plats.forEach(p=>row(...p));const f=()=>{const tva=+r.querySelector('[data-k=tva]').value||0,s=+r.querySelector('[data-k=seuil]').value||0;
rows.querySelectorAll('.result').forEach(d=>{const ht=(+d.querySelector('[data-p]').value||0)/(1+tva/100),c=+d.querySelector('[data-c]').value||0,cm=c/ht*100;
d.querySelector('[data-res]').innerHTML='Coût matière <b style="color:'+(cm>s?'var(--bad)':'var(--ok)')+'">'+(isFinite(cm)?cm.toFixed(1).replace('.',','):'—')+' %</b><br>Il te reste <b>'+(ht-c).toFixed(2).replace('.',',')+' € HT</b> par assiette'})};
r.addEventListener('input',f);r.querySelector('[data-o=add]').onclick=()=>{row('Plat '+(rows.children.length+1),0,0);f()};f()})()</script>`,
};

// Liens externes (Google Sheets offerts…) : content/liens.json, rendus à la place de {{sheet:id}}
const LIENS = JSON.parse(fs.readFileSync(path.join(root, 'content/liens.json'), 'utf8'));
const SHEET_LABEL = { 'tableau-relance': 'Copier le tableau de relance (Google Sheets)' };
const sheetBtn = (id) => { const u = LIENS[id] || ''; const copy = u.replace(/\/edit.*$/, '/copy'); return `<div class="card calc"><h3 style="margin-top:0">${esc(SHEET_LABEL[id] || 'Ouvrir le modèle')}</h3><p class="note">Prêt à l'emploi : clique, Google te propose d'en faire une copie dans ton compte. Tu remplis, le reste se calcule.</p><a class="btn" href="${esc(copy || '#')}" target="_blank">${u ? 'Faire ma copie du tableau' : 'Lien du tableau à venir'}</a></div>`; };
function renderBody(md) {
  const clean = md.replace(/<!--[\s\S]*?-->/g, '');
  return clean.split(/\{\{(calculator|sheet):([a-z0-9-]+)\}\}/g).map((p, i, a) => (i % 3 === 0 ? marked.parse(p) : i % 3 === 1 ? '' : a[i - 1] === 'sheet' ? sheetBtn(p) : CALC[p] || '')).join('');
}
// Opt-in avant la ressource (aperçu : rien n'est envoyé, Mason branche la vraie prise de numéro)
const GATE_JS = `<script>(()=>{const g=document.getElementById('gate'),r=document.getElementById('res');document.getElementById('gogate').onclick=()=>{const t=document.getElementById('gtel').value.replace(/\\D/g,'');if(t.length<9){document.getElementById('gtel').style.borderColor='var(--orange)';return}g.hidden=true;r.hidden=false;scrollTo(0,0)}})()</script>`;

// ── Pages ressources
const LM = [
  ['btp', 'btp.html'],
  ['resto', 'resto.html'],
  ['salon', 'salon.html'],
];
const index = [];
for (const [slug, file] of LM) {
  const { data, content } = matter(fs.readFileSync(path.join(root, 'content/lead-magnets', slug + '.md'), 'utf8'));
  const html = `${head(data.title)}${nav}<main class="wrap">
<span class="tag">Méthode offerte · ${esc(data.niche)}</span>
<h1>${esc(data.title)}</h1><p class="lead">${esc(data.promise)}</p>
<div class="card cover"><ul class="gets">${(data.deliverables || []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
<div id="gate" class="card" style="margin-top:18px"><div class="mont" style="font-weight:800;font-size:20px;margin-bottom:12px">Où on t'envoie la ressource ?</div><label>Ton prénom</label><input value="Karim"><div style="height:12px"></div>${phoneField('gtel')}<div style="height:14px"></div><button class="btn" id="gogate">${esc(data.cta || 'Je reçois la ressource')}</button><p class="note">Accès immédiat. Quelqu'un de l'équipe Ultra peut t'appeler pour t'aider à l'appliquer. Aperçu : rien n'est envoyé.</p></div>
<div id="res" hidden><div class="prose">${renderBody(content)}</div>
<h2>Ils l'ont fait</h2><div class="cases">${(data.testimonials || []).map(caseCard).join('')}</div>
<h2>Ton objectif chiffré à 4 mois</h2><div class="card"><textarea rows="3" placeholder="D'ici le … je veux … en …"></textarea></div>
<div style="margin-top:22px"><a class="btn" href="#">Réserve un appel diagnostic avec l'équipe Ultra</a></div></div></main>${GATE_JS}${foot}`;
  fs.writeFileSync(path.join(out, file), html);
  index.push({ file, title: data.title, niche: data.niche, kw: data.keyword, promise: data.promise });
}

// ── Roadmap : quiz adaptatif (les questions suivent le secteur) + résultat personnalisé + navigation libre
const rm = JSON.parse(fs.readFileSync(path.join(root, 'content/roadmap.json'), 'utf8'));
const secDir = path.join(root, 'content/roadmap-secteurs');
rm.secteurs = {};
if (fs.existsSync(secDir)) for (const f of fs.readdirSync(secDir).filter((f) => f.endsWith('.json'))) { const x = JSON.parse(fs.readFileSync(path.join(secDir, f), 'utf8')); rm.secteurs[x.id] = x; }
const intro = marked.parse(fs.readFileSync(path.join(root, 'content/roadmap-intro.md'), 'utf8').replace(/<!--[\s\S]*?-->/g, ''));
const SECT = rm.questions.find((q) => q.id === 'secteur')?.options || [];
const QUIZ_CSS = `<style>
.opt{display:block;width:100%;text-align:left;font:500 17px Inter,system-ui,sans-serif;color:var(--text);background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;cursor:pointer;transition:background .15s,border-color .15s,color .15s,transform .1s}
.opt:hover{border-color:rgba(255,91,20,.6)}.opt:active{transform:scale(.99)}
.opt.sel{background:var(--orange);border-color:var(--orange);color:#0a0a0a;font-weight:700;box-shadow:0 10px 30px -12px rgba(255,91,20,.7)}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}@media(max-width:560px){.facts{grid-template-columns:1fr}}
.fact{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.fact small{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.1em;font-family:Montserrat;font-weight:800}.fact b{font-size:16px}
.money{margin-top:18px;padding:18px;border-radius:14px;background:rgba(255,91,20,.08);border:1px solid rgba(255,91,20,.4)}
.metro{position:relative;margin:16px 0 8px;padding-left:4px}.metro .st{display:flex;gap:14px;align-items:center;padding:9px 0;position:relative}.metro .st:not(:last-child)::after{content:"";position:absolute;left:8px;top:30px;bottom:-12px;width:2px;background:#262626}.metro .st.done:not(:last-child)::after{background:var(--orange)}
.metro .dot{width:18px;height:18px;flex:none;border-radius:50%;border:2px solid #333;background:var(--bg);position:relative;z-index:1}.metro .done .dot{background:var(--orange);border-color:var(--orange)}.metro .here .dot{background:var(--orange);border-color:var(--orange);box-shadow:0 0 0 6px rgba(255,91,20,.25)}.metro .here b{color:var(--orange)}.metro .st:not(.here):not(.done){opacity:.55}
.fiche{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:560px){.fiche{grid-template-columns:1fr}}.fc{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px}.fc small{display:block;color:var(--orange);font:800 11px Montserrat;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px}.fiche.main .fc div{font-size:17px;font-weight:600}.fc.key{border-color:var(--orange);background:rgba(255,91,20,.08)}
.stat{margin:18px 0;padding:18px;border-left:4px solid var(--orange);background:var(--card);border-radius:0 14px 14px 0}
.ctabox{margin:44px 0 10px;padding:28px 22px;border-radius:20px;background:linear-gradient(160deg,rgba(255,91,20,.22),rgba(255,91,20,.04) 60%),var(--card);border:1px solid rgba(255,91,20,.5)}
details{margin-top:14px}summary{cursor:pointer;color:var(--orange);font-weight:700}
.fnrow{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}@media(max-width:560px){.fnrow{grid-template-columns:1fr;gap:2px}}
</style>`;
const roadmapHtml = `${head('Ton plan sur 12 mois')}${QUIZ_CSS}${nav}<main class="wrap" id="app"></main>
<div class="wrap"><div class="card" style="margin-top:40px"><div class="mont" style="font-weight:800">Mode exploration (aperçu interne)</div>
<p class="note">Navigue librement dans les ${rm.stages.length} paliers et les métiers, sans refaire le quiz (nom, frein et chiffre pris par défaut).</p>
<div class="grid"><div><label>Palier</label><select id="xs">${rm.stages.map((s, i) => `<option value="${i}">${i + 1}. ${esc(s.name)} (${esc(s.effectif)})</option>`).join('')}</select></div>
<div><label>Métier</label><select id="xm">${SECT.map((o) => `<option value="${o.id}">${esc(o.label)}</option>`).join('')}</select></div></div>
<div style="display:flex;gap:10px;margin-top:12px"><button class="btn" id="xgo">Voir ce palier</button><button class="btn ghost" id="xquiz">Refaire le quiz</button></div></div></div>
<div id="introsrc" hidden>${intro}</div>
<script>
const RM=${JSON.stringify(rm)};
const app=document.getElementById('app');const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const G=id=>RM.questions.find(q=>q.id===id);
const SEC_DEP=['specialite','nom','frein','kpi'];
let ans={},step=-1,prenom='';
const S=()=>RM.secteurs[ans.secteur]||RM.secteurs.autre||{};
function qAt(i){const id=RM.flow[i],s=S();
  if(id==='nom')return{id,type:'text',label:s.nomLabel||'Comment s\\'appelle ton entreprise ?',placeholder:s.nomPlaceholder||''};
  if(id==='effectif')return{...G('effectif'),label:s.effectifLabel||G('effectif').label};
  if(SEC_DEP.includes(id))return{id,...(s[id]||{label:'',options:[]})};
  return G(id)}
const lc=s=>String(s||'').charAt(0).toLowerCase()+String(s||'').slice(1);
function ctx(){const s=S(),sp=(s.specialite?.options||[]).find(o=>o.id===ans.specialite)||{};const noun=sp.noun||s.nounDefault||'ton entreprise';
  return{prenom:prenom||'',nom:ans.nom||'ton entreprise',noun,Noun:noun.charAt(0).toUpperCase()+noun.slice(1),vend:sp.vend||'tes prestations',spLabel:sp.label||''}}
function F(t){const c=ctx();return String(t||'').replace(/(chez|Chez) \\{nom\\}/g,m=>/^chez\\s/i.test(c.nom)?'{nom}':m).replace(/\\{(prenom|nom|noun|Noun|vend)\\}/g,(_,k)=>c[k])}
function landing(){app.innerHTML='<span class="tag">Diagnostic offert · 2 minutes</span><h1>'+E(RM.title).replace('augmenter ton profit','<span class=o>augmenter ton profit</span>').replace('sortir de l\\'opérationnel','<span class=o>sortir de l\\'opérationnel</span>')+'</h1><p class="lead">'+E(RM.promise)+'</p><div class="card cover"><ul class="gets">'+RM.deliverables.map(d=>'<li>'+E(d)+'</li>').join('')+'</ul></div><div style="margin-top:22px"><button class="btn" onclick="step=0;ans={};quiz()">Je fais mon diagnostic offert</button></div>';scrollTo(0,0)}
function bar(){return'<div style="height:6px;background:#262626;border-radius:99px;margin:36px 0 10px;overflow:hidden"><div style="height:100%;width:'+(step/RM.flow.length*100)+'%;background:var(--orange);transition:width .3s"></div></div><p class="note">Question '+(step+1)+' sur '+RM.flow.length+'</p>'}
function quiz(){if(step>=RM.flow.length)return optin();const q=qAt(step);
  const back='<button class="btn ghost" style="margin-top:14px;width:auto;padding:10px 16px" onclick="'+(step>0?'step--;quiz()':'landing()')+'">← Retour</button>';
  if(q.type==='text'){app.innerHTML=bar()+'<h2 style="margin-top:6px">'+E(q.label)+'</h2><p class="note">On s\\'en sert pour écrire ta roadmap à ton nom.</p><input id="tx" maxlength="60" placeholder="'+E(q.placeholder)+'" value="'+E(ans[q.id]||'')+'" style="font-size:19px;padding:16px 18px"><button class="btn" id="txgo" style="margin-top:12px">Continuer</button>'+back;
    const i=document.getElementById('tx'),go=()=>{const v=i.value.trim();if(!v){i.style.borderColor='var(--orange)';i.focus();return}ans[q.id]=v;step++;quiz()};
    document.getElementById('txgo').onclick=go;i.onkeydown=e=>{if(e.key==='Enter')go()};setTimeout(()=>i.focus(),50);scrollTo(0,0);return}
  app.innerHTML=bar()+'<h2 style="margin-top:6px">'+E(F(q.label))+'</h2>'+(q.help?'<p class="note">'+E(F(q.help))+'</p>':'')+'<div style="display:grid;gap:10px">'+q.options.map(o=>'<button class="opt'+(ans[q.id]===o.id?' sel':'')+'" data-id="'+o.id+'">'+E(o.label)+'</button>').join('')+'</div>'+back;
  app.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{if(app.dataset.lock)return;app.dataset.lock=1;
    app.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');
    if(q.id==='secteur'&&ans.secteur!==b.dataset.id)SEC_DEP.forEach(k=>delete ans[k]);
    ans[q.id]=b.dataset.id;setTimeout(()=>{delete app.dataset.lock;step++;quiz()},320)});scrollTo(0,0)}
function optin(){const c=ctx();app.innerHTML='<span class="tag">Dernière étape</span><h1>Le plan de <span class="o">'+E(c.nom)+'</span> est prêt.</h1><p class="lead">Dis-nous où te l\\'envoyer, il s\\'affiche juste après.</p><div class="card"><label>Ton prénom</label><input id="fn" value="Karim"><div style="height:12px"></div>'+${JSON.stringify(phoneField('rtel'))}+'<p class="note">Aperçu : rien n\\'est envoyé. En vrai, c\\'est ici que Mason branche la prise du numéro.</p><button class="btn" id="go">'+E(RM.cta)+'</button></div><button class="btn ghost" style="margin-top:14px;width:auto;padding:10px 16px" onclick="step=RM.flow.length-1;quiz()">← Retour</button>';
  document.getElementById('go').onclick=()=>{prenom=document.getElementById('fn').value.trim();const sid=RM.scoring.effectifToStage[ans.effectif]??RM.stages[0].id;result(RM.stages.findIndex(s=>s.id===sid))}}
const MID={'moins-100k':70000,'100-300k':200000,'300-500k':400000,'500k-1m':750000,'plus-1m':1500000};
const EFF={'seul':'Tu tiens tout seul, sans salarié.','seul-renforts':'Tu es seul, avec des extras ou des sous-traitants.','1-4':'Tu as une équipe de 1 à 4 personnes.','5-9':'Tu as une équipe de 5 à 9 personnes.','10-19':'Tu as une équipe de 10 à 19 personnes.','20-49':'Tu as une équipe de 20 à 49 personnes.','50-99':'Tu as une équipe de 50 à 99 personnes.','100-plus':'Tu as plus de 100 personnes.'};
const TRESO={'moins-5k':'Avec moins de 5 000 € de côté, tu n\\'as pas le droit à l\\'erreur. Avant tout recrutement ou toute pub, ta priorité est de faire entrer l\\'argent que tu as déjà gagné : acomptes, relances, factures en retard.','5-20k':'Tu as un petit matelas : de quoi tenir, pas de quoi recruter sereinement. Ce qui fait entrer de l\\'argent vite passe avant tout le reste.','20-50k':'Ta trésorerie te permet d\\'investir dans le chantier ci-dessus sans te mettre en danger. Le frein n\\'est pas l\\'argent, c\\'est le temps que tu y mets.','plus-50k':'Avec plus de 50 000 € de côté, l\\'argent n\\'est pas ton frein. Ce qui te retient, c\\'est l\\'organisation : tu peux aller vite si tu décides vite.'};
const eur=n=>Math.round(n/1000)*1000;const fmt=n=>eur(n).toLocaleString('fr-FR')+' €';
const lab=(id,v)=>{const q=id==='kpi'||id==='frein'||id==='specialite'?S()[id]:G(id);return((q?.options||[]).find(o=>o.id===v)?.label||'').replace(/(\\d) (?=\\d)/g,'$1\\u00a0')};
function card(t){return'<div class="card case">'+(t.kpi?'<div class="kpi">'+E(t.kpi)+'</div>':'')+'<div class="who">'+E(t.name)+'</div><div class="biz">'+E(t.business)+'</div><div>'+E(t.result)+'</div>'+(t.quote?'<div class="q">« '+E(t.quote)+' »</div>':'')+(t.url?'<a href="'+E(t.url)+(t.url.includes('?')?'&':'?')+'utm_source=ressources" target="_blank">Lire son histoire →</a>':'')+'</div>'}
function metro(i){return'<div class="metro">'+RM.stages.map((x,j)=>'<div class="st'+(j<i?' done':j===i?' here':'')+'"><span class="dot"></span><div><b>'+(j+1)+'. '+E(x.name)+'</b> <span class="note">'+E(x.effectif)+'</span>'+(j===i?' <span class="pill" style="font-size:11px;padding:3px 9px">Tu es ici</span>':'')+'</div></div>').join('')+'</div>'}
function fiche(s,big){const n=RM.stages.findIndex(x=>x.id===s.id)+1;return'<div class="fiche'+(big?' main':'')+'">'+[['Ton rôle',s.founderRole],['Effectif',s.effectif],['Le blocage',s.bottleneck],[n<RM.stages.length?'Pour passer au palier '+(n+1):'Pour aller plus loin',s.graduateBy]].filter(x=>x[1]).map((x,k)=>'<div class="fc'+(k===3?' key':'')+'"><small>'+E(x[0])+'</small><div>'+E(x[1])+'</div></div>').join('')+'</div>'+(big?'':'<p class="note" style="margin:10px 0 0">Palier '+n+' · '+E(s.name)+'</p>')}
function fns(s){return RM.functions.map(f=>s.actions[f.id]?'<div class="fnrow"><b class="o mont" style="font-size:15px">'+E(f.label)+'</b><span>'+E(s.actions[f.id])+'</span></div>':'').join('')}
function result(i){const s=RM.stages[i],prev=RM.stages[i-1],next=RM.stages[i+1],sec=ans.secteur||'autre',sd=S(),c=ctx();
  const lever=sd.levers?.[ans.frein],kpi=(sd.kpi?.options||[]).find(o=>o.id===ans.kpi);
  const proofs=(sd.proofs||[]).map(n=>RM.testimonials.find(t=>t.name===n)).filter(Boolean);
  const tests=proofs.length?proofs:RM.testimonials.filter(t=>!t.stages||t.stages.includes(s.id));
  const leverProof=lever?.proof&&RM.testimonials.find(t=>t.name===lever.proof);
  const money=lever?.money&&MID[ans.ca]?MID[ans.ca]*lever.money.pctOfCA:0;
  const d4=new Date();d4.setMonth(d4.getMonth()+4);const dt=d4.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
  const goal=lever?(money?'D\\'ici le '+dt+', '+c.nom+' fait '+fmt(money/3)+' de chiffre en plus, grâce à un seul chantier : '+lc(F(lever.title).replace(/^Ton chantier n°1\\s*:\\s*/i,''))+'.':'D\\'ici le '+dt+', '+c.nom+' tourne une semaine entière sans moi, sans que le chiffre baisse.'):'';
  let h='<span class="tag">Le plan de '+E(c.nom)+'</span><h1>'+(c.prenom?E(c.prenom)+', ':'')+lc(E(c.noun))+' est au palier '+(i+1)+' sur '+RM.stages.length+' : <span class="o">'+E(s.name)+'</span></h1>'+
  '<div style="display:flex;gap:6px;margin:6px 0 22px">'+RM.stages.map((x,j)=>'<div title="'+E(x.name)+'" style="flex:1;height:8px;border-radius:99px;background:'+(j<=i?'var(--orange)':'#262626')+'"></div>').join('')+'</div>';
  h+='<div class="card cover"><span class="pill">'+E(c.nom)+' aujourd\\'hui</span><p style="font-size:19px;margin:14px 0 0">'+E(c.Noun)+' « '+E(c.nom)+' » vend '+E(c.vend)+'. '+E(EFF[ans.effectif]||'')+' '+(ans.ca?'Chiffre d\\'affaires : '+E(lc(lab('ca',ans.ca)))+'. ':'')+(ans.tresorerie?'De côté : '+E(lc(lab('tresorerie',ans.tresorerie)))+'.':'')+'</p>'+
    '<div class="facts">'+[['Activité',c.spLabel||lab('secteur',sec)],['Équipe',lab('effectif',ans.effectif)],['Chiffre d\\'affaires',lab('ca',ans.ca)],['Trésorerie',lab('tresorerie',ans.tresorerie)],['Ton frein n°1',lab('frein',ans.frein)],[sd.kpi?.short||'Ton chiffre clé',lab('kpi',ans.kpi)]].filter(x=>x[1]).map(x=>'<div class="fact"><small>'+E(x[0])+'</small><b>'+E(x[1])+'</b></div>').join('')+'</div>'+
    (kpi?.read?'<p style="margin:0;color:#e9e8e2">'+E(F(kpi.read))+'</p>':'')+'</div>';
  if(lever){h+='<h2>'+E(F(lever.title))+'</h2><p class="lead" style="font-size:18px">'+E(F(lever.diagnosis))+'</p><div class="card"><div class="mont" style="font-weight:800;margin-bottom:6px">Ce que tu fais dès cette semaine</div><ol class="prose" style="margin:0">'+lever.actions.map(a=>'<li><label style="display:flex;gap:10px;align-items:flex-start;color:inherit;font-size:inherit;font-weight:inherit;cursor:pointer"><input type="checkbox" style="width:20px;height:20px;flex:none;margin-top:4px;accent-color:var(--orange)" onchange="this.parentNode.style.opacity=this.checked?.5:1"><span>'+E(F(a))+'</span></label></li>').join('')+'</ol>'+
    (money?'<div class="money"><div class="note" style="margin:0">Ordre de grandeur pour '+E(c.nom)+'</div><div class="big">≈ '+fmt(money)+' par an</div><p class="note" style="margin:8px 0 0">'+E(F(lever.money.explain))+' Calcul sur le milieu de ta tranche de chiffre d\\'affaires : c\\'est un ordre d\\'idée, pas une promesse.</p></div>':'')+'</div>'+(leverProof?'<div style="margin-top:14px">'+card(leverProof)+'</div>':'')}
  h+='<h2>Ta trésorerie</h2><p>'+E(TRESO[ans.tresorerie]||'')+'</p>';
  h+='<h2>Tu es ici</h2><p class="note">'+E(RM.stageRule)+'</p>'+metro(i);
  h+='<h2>Ton palier : '+E(s.name)+'</h2>'+fiche(s,true)+(s.stat?'<div class="stat"><div class="big">'+E(s.stat.figure||'')+'</div><p style="margin:6px 0 0">'+E(s.stat.text)+'</p><p class="note" style="margin:6px 0 0">'+E(s.stat.source)+'</p></div>':'')+
  '<h3>Quand tu arrives à ce palier</h3><p>'+E(s.summary)+'</p>'+(s.examples&&s.examples[sec]?'<p style="color:#e9e8e2">Chez '+E(c.nom)+', ça ressemble à ça : '+E(lc(s.examples[sec]))+'</p>':'')+
  '<h2>Tes 3 chantiers du trimestre</h2><ol class="prose">'+s.top3.map(x=>'<li>'+E(x)+'</li>').join('')+'</ol>'+
  '<h2>Fonction par fonction</h2><p class="note">Pour chaque fonction de l\\'entreprise : ce qu\\'il faut faire à ton palier.</p>'+fns(s)+
  '<h2>À quoi ressemble la réussite</h2><h3>Tu sais que tu avances quand…</h3><ul class="gets">'+s.signsOk.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul><h3>Tu sais qu\\'il reste du travail quand…</h3><ul class="prose">'+s.signsKo.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul>'+
  (s.graduateWhen?'<div class="card cover"><span class="pill">Prêt pour la suite</span><p class="mont" style="font-size:19px;font-weight:800;margin:12px 0 0">'+E(s.graduateWhen)+'</p></div>':'')+
  (s.cta?'<div class="ctabox"><div class="mont" style="font-size:clamp(24px,5vw,34px);font-weight:900;line-height:1.1">'+E(s.cta.title)+'</div><p style="margin:12px 0 18px;color:#e9e8e2">'+E(s.cta.text)+'</p><a class="btn" href="#">'+E(s.cta.button)+'</a></div>':'')+
  (prev?'<h2>Le palier que tu viens de passer</h2><p class="note">Vérifie que rien ne traîne derrière toi : ce qui n\\'est pas réglé au palier d\\'avant revient toujours.</p><div class="card">'+fiche(prev,false)+'<details><summary>Voir le palier '+(i)+' fonction par fonction</summary>'+fns(prev)+'</details></div>':'')+
  (next?'<h2>Ce qui t\\'attend ensuite</h2><p class="note">Prépare-le maintenant : c\\'est le palier suivant qui dit quoi construire aujourd\\'hui.</p><div class="card">'+fiche(next,false)+'<p style="margin:14px 0 0">'+E(next.summary)+'</p><details><summary>Voir le palier '+(i+2)+' fonction par fonction</summary>'+fns(next)+'</details></div>':'')+
  '<div class="prose">'+document.getElementById('introsrc').innerHTML+'</div><h2>Ils sont passés par là</h2><div class="cases">'+tests.filter(t=>t!==leverProof).map(card).join('')+'</div>'+
  '<h2>L\\'objectif de '+E(c.nom)+' à 4 mois</h2><p class="note">On te l\\'a pré-rempli à partir de tes réponses. Change-le, c\\'est le tien.</p><div class="card"><textarea rows="3">'+E(goal)+'</textarea></div><div style="margin-top:22px"><a class="btn" href="#">'+E(s.cta?.button||'Réserve un appel diagnostic avec l\\'équipe Ultra')+'</a></div>';
  app.innerHTML=h;document.getElementById('xs').value=i;document.getElementById('xm').value=sec;scrollTo(0,0)}
document.getElementById('xgo').onclick=()=>{const sec=document.getElementById('xm').value,sd=RM.secteurs[sec]||{};const i=+document.getElementById('xs').value;
  ans={secteur:sec,specialite:sd.specialite?.options?.[0]?.id,nom:'Exemple',effectif:Object.keys(RM.scoring.effectifToStage).find(k=>RM.scoring.effectifToStage[k]===RM.stages[i].id),ca:'300-500k',tresorerie:'5-20k',frein:sd.frein?.options?.[0]?.id,kpi:sd.kpi?.options?.[1]?.id};prenom='';result(i)};
document.getElementById('xquiz').onclick=landing;landing();
</script>${foot}`;
fs.writeFileSync(path.join(out, 'roadmap.html'), roadmapHtml);
// Version autonome « parcours prospect » : sans menu interne ni mode exploration
fs.writeFileSync(path.join(out, 'roadmap-parcours.html'), roadmapHtml
  .replace(nav, '<div class="wrap"><div class="nav"><div class="logo">ULTRA<span>.</span></div></div></div>')
  .replace(/<div class="wrap"><div class="card" style="margin-top:40px"><div class="mont" style="font-weight:800">Mode exploration[\s\S]*?Refaire le quiz<\/button><\/div><\/div><\/div>/, '<div hidden><select id="xs"></select><select id="xm"></select><button id="xgo"></button><button id="xquiz"></button></div>'));

// ── Index
fs.writeFileSync(path.join(out, 'index.html'), `${head('Aperçus ressources ULTRA')}${nav}<main class="wrap"><span class="tag">Aperçus de travail</span><h1>Les ressources <span class="o">gratuites</span></h1><p class="lead">Ce que reçoit le prospect après avoir envoyé le mot-clé et laissé son numéro.</p><div class="cases">
<a class="card" href="roadmap.html" style="text-decoration:none;color:inherit"><span class="tag" style="margin:0 0 8px">Tous secteurs · ${esc(rm.keyword)}</span><h3 style="margin:0">${esc(rm.title)}</h3><p class="note" style="margin:6px 0 0">${esc(rm.promise)}</p></a>
${index.map((x) => `<a class="card" href="${x.file}" style="text-decoration:none;color:inherit"><span class="tag" style="margin:0 0 8px">${esc(x.niche)} · ${esc(x.kw)}</span><h3 style="margin:0">${esc(x.title)}</h3><p class="note" style="margin:6px 0 0">${esc(x.promise)}</p></a>`).join('')}
</div></main>${foot}`);
// Copie de confort hors du repo (dossier de travail de Yakine)
fs.cpSync(out, path.resolve(root, '../apercu'), { recursive: true });
console.log('OK →', out);
