'use client';
import { useState } from 'react';

const eur = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString('fr-FR') + ' €' : '—');
const pct = (n: number) => (isFinite(n) ? n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %' : '—');

function Num({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <div className="field">
      <label>{label}{suffix ? ` (${suffix})` : ''}</label>
      <input type="number" inputMode="decimal" min={0} value={Number.isNaN(value) ? '' : value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

// BTP : l'argent qui dort dans les devis en attente (2 chiffres)
function DevisDormants() {
  const [nb, setNb] = useState(10);
  const [moyen, setMoyen] = useState(8000);
  return (
    <div className="card calc">
      <h3>L’argent qui attend une réponse</h3>
      <div className="grid">
        <Num label="Devis envoyés sans réponse" value={nb} onChange={setNb} />
        <Num label="Montant moyen d’un devis" suffix="€ HT" value={moyen} onChange={setMoyen} />
      </div>
      <div className="result">
        <div className="big">{eur(nb * moyen)}</div>
        <p style={{ margin: '8px 0 0' }}>
          1 signature de plus : <b>+{eur(moyen)}</b> · 2 signatures : <b>+{eur(moyen * 2)}</b> · 3 signatures : <mark>+{eur(moyen * 3)}</mark>
        </p>
      </div>
    </div>
  );
}

// BTP : ce que le chantier laisse vraiment (4 chiffres)
function MargeChantier() {
  const [ht, setHt] = useState(25000);
  const [achats, setAchats] = useState(8000);
  const [heures, setHeures] = useState(220);
  const [coutH, setCoutH] = useState(32);
  const reste = ht - achats - heures * coutH;
  return (
    <div className="card calc">
      <h3>Ce que ce chantier te laisse vraiment</h3>
      <div className="grid">
        <Num label="Montant du devis" suffix="€ HT" value={ht} onChange={setHt} />
        <Num label="Matériaux, location et sous-traitance" suffix="€" value={achats} onChange={setAchats} />
        <Num label="Heures passées, toute l’équipe" value={heures} onChange={setHeures} />
        <Num label="Coût horaire chargé" suffix="€/h" value={coutH} onChange={setCoutH} />
      </div>
      <div className="result">
        <div className="big">{eur(reste)}</div>
        <p style={{ margin: '8px 0 0' }}>Soit <mark>{pct((reste / ht) * 100)}</mark> du devis qui reste une fois le chantier payé.</p>
      </div>
    </div>
  );
}

// Restauration — coût matière plat par plat
type Plat = { nom: string; prix: number; cout: number };
function CoutMatiere() {
  const [tva, setTva] = useState(10);
  const [seuil, setSeuil] = useState(30);
  const [plats, setPlats] = useState<Plat[]>([
    { nom: 'Plat phare', prix: 16, cout: 4.2 },
    { nom: 'Deuxième plat', prix: 14, cout: 4.9 },
    { nom: 'Dessert', prix: 7, cout: 1.4 },
  ]);
  const upd = (i: number, k: keyof Plat, v: string) =>
    setPlats((p) => p.map((pl, j) => (j === i ? { ...pl, [k]: k === 'nom' ? v : parseFloat(v) } : pl)));
  return (
    <div className="card calc">
      <h3>Le coût matière de chaque plat</h3>
      <div className="grid">
        <Num label="TVA sur tes plats" suffix="%" value={tva} onChange={setTva} />
        <Num label="Ton seuil d’alerte coût matière" suffix="%" value={seuil} onChange={setSeuil} />
      </div>
      {plats.map((p, i) => {
        const ht = p.prix / (1 + tva / 100);
        const cm = (p.cout / ht) * 100;
        return (
          <div key={i} className="result" style={{ marginTop: 12 }}>
            <div className="grid">
              <div className="field"><label>Plat</label><input value={p.nom} onChange={(e) => upd(i, 'nom', e.target.value)} /></div>
              <div className="field"><label>Prix de vente TTC (€)</label><input type="number" inputMode="decimal" value={Number.isNaN(p.prix) ? '' : p.prix} onChange={(e) => upd(i, 'prix', e.target.value)} /></div>
              <div className="field"><label>Coût des ingrédients par portion (€)</label><input type="number" inputMode="decimal" value={Number.isNaN(p.cout) ? '' : p.cout} onChange={(e) => upd(i, 'cout', e.target.value)} /></div>
              <div className="field">
                <label>Résultat</label>
                <div style={{ paddingTop: 10 }}>
                  Coût matière <b style={{ color: cm > seuil ? 'var(--danger)' : 'var(--ok)' }}>{pct(cm)}</b>
                  <br />Il te reste <b>{(ht - p.cout).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT</b> par assiette
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={() => setPlats((p) => [...p, { nom: `Plat ${p.length + 1}`, prix: 0, cout: 0 }])}>
        + Ajouter un plat
      </button>
    </div>
  );
}


// Restauration : ce que rapportent quelques euros de plus et quelques couverts de plus (3 chiffres)
function TicketRush() {
  const [cv, setCv] = useState(80);
  const [panier, setPanier] = useState(22);
  const [nb, setNb] = useState(20);
  const ca = cv * panier * nb * 12;
  return (
    <div className="card calc">
      <h3>Ce que ta salle peut rapporter en plus sur un an</h3>
      <div className="grid">
        <Num label="Couverts sur un gros service" value={cv} onChange={setCv} />
        <Num label="Panier moyen par couvert" suffix="€" value={panier} onChange={setPanier} />
        <Num label="Gros services par mois" value={nb} onChange={setNb} />
      </div>
      <div className="result">
        <div className="big">+ {eur(ca * 0.3)}</div>
        <p style={{ margin: '8px 0 0' }}>
          par an avec <b>+30 % de panier moyen</b>, soit {eur(panier * 0.3)} de plus par couvert. Et <mark>+{eur(ca * 0.2)}</mark> de plus si ta cuisine sort 20 % de couverts en plus.
        </p>
      </div>
    </div>
  );
}

// Beauté : 3 des 5 règles de Marvin, calculées sur 4 chiffres de la caisse
function Salon5Regles() {
  const [ca, setCa] = useState(22000);
  const [prod, setProd] = useState(1800);
  const [sal, setSal] = useState(11000);
  const [nb, setNb] = useState(2);
  const rules = [
    { t: 'Produits : 15 % du CA minimum', ok: prod >= ca * 0.15, d: `Cible ${eur(ca * 0.15)}, tu fais ${eur(prod)}.` },
    { t: 'Salaires chargés : 45 % du CA maximum', ok: sal <= ca * 0.45, d: `Plafond ${eur(ca * 0.45)}, tu es à ${eur(sal)}.` },
    { t: 'Objectif : 100 800 € par an et par collaboratrice', ok: ca * 12 >= nb * 100800, d: `Objectif ${eur(nb * 100800)}, ton rythme donne ${eur(ca * 12)}.` },
  ];
  return (
    <div className="card calc">
      <h3>Ton salon passe-t-il les règles ?</h3>
      <div className="grid">
        <Num label="Chiffre d’affaires du mois" suffix="€" value={ca} onChange={setCa} />
        <Num label="Ventes de produits du mois" suffix="€" value={prod} onChange={setProd} />
        <Num label="Salaires du mois, charges comprises" suffix="€" value={sal} onChange={setSal} />
        <Num label="Nombre de collaboratrices" value={nb} onChange={setNb} />
      </div>
      <div className="result">
        <div className="big">{rules.filter((r) => r.ok).length} sur 3</div>
        {rules.map((r, i) => (
          <p key={i} style={{ margin: '8px 0 0' }}>
            <b style={{ color: r.ok ? 'var(--ok)' : 'var(--danger)' }}>{r.ok ? '✓' : '✗'} {r.t}</b> · {r.d}
          </p>
        ))}
      </div>
    </div>
  );
}

const CALCS: Record<string, () => React.JSX.Element> = {
  'ticket-rush': TicketRush,
  'devis-dormants': DevisDormants,
  'marge-chantier': MargeChantier,
  'cout-matiere': CoutMatiere,
  'salon-5-regles': Salon5Regles,
};

export default function Calculator({ id }: { id: string }) {
  const C = CALCS[id];
  return C ? <C /> : null;
}
