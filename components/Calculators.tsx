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

// BTP — l'argent qui dort dans les devis en attente
function DevisDormants() {
  const [nb, setNb] = useState(16);
  const [moyen, setMoyen] = useState(12000);
  const [taux, setTaux] = useState(25);
  const [gain, setGain] = useState(10);
  const enAttente = nb * moyen;
  const signeAujourdhui = enAttente * (taux / 100);
  const signeApres = enAttente * ((taux + gain) / 100);
  return (
    <div className="card calc">
      <h3>Calcule l’argent qui dort dans tes devis</h3>
      <div className="grid">
        <Num label="Devis envoyés, pas encore signés" value={nb} onChange={setNb} />
        <Num label="Montant moyen d’un devis" suffix="€ HT" value={moyen} onChange={setMoyen} />
        <Num label="Ton taux de signature actuel" suffix="%" value={taux} onChange={setTaux} />
        <Num label="Points de signature gagnés par la relance" suffix="%" value={gain} onChange={setGain} />
      </div>
      <div className="result">
        <div>Montant chiffré qui attend une réponse</div>
        <div className="big">{eur(enAttente)}</div>
        <p style={{ margin: '8px 0 0' }}>
          À ton taux actuel, tu en signes environ <b>{eur(signeAujourdhui)}</b>. Avec {gain} points de plus grâce à une vraie relance, ça passe à <b>{eur(signeApres)}</b>, soit <mark>{eur(signeApres - signeAujourdhui)}</mark> de plus sur des devis que tu as déjà faits.
        </p>
      </div>
    </div>
  );
}

// BTP — ce que chaque chantier te laisse vraiment
function MargeChantier() {
  const [ht, setHt] = useState(25000);
  const [mat, setMat] = useState(7000);
  const [heures, setHeures] = useState(220);
  const [coutH, setCoutH] = useState(32);
  const [st, setSt] = useState(0);
  const [frais, setFrais] = useState(900);
  const couts = mat + heures * coutH + st + frais;
  const reste = ht - couts;
  const taux = (reste / ht) * 100;
  return (
    <div className="card calc">
      <h3>Ce que ce chantier te laisse vraiment</h3>
      <div className="grid">
        <Num label="Montant du devis" suffix="€ HT" value={ht} onChange={setHt} />
        <Num label="Matériaux et fournitures" suffix="€" value={mat} onChange={setMat} />
        <Num label="Heures passées (toutes équipes)" value={heures} onChange={setHeures} />
        <Num label="Coût horaire chargé d’un compagnon" suffix="€/h" value={coutH} onChange={setCoutH} />
        <Num label="Sous-traitance" suffix="€" value={st} onChange={setSt} />
        <Num label="Location, déplacements, déchets, divers" suffix="€" value={frais} onChange={setFrais} />
      </div>
      <div className="result">
        <div>Ce qui reste une fois le chantier payé</div>
        <div className="big">{eur(reste)}</div>
        <p style={{ margin: '8px 0 0' }}>
          Soit <mark>{pct(taux)}</mark> du montant du devis. Fais le calcul sur tes 5 derniers chantiers : celui qui te laisse le moins te dit quel type de chantier arrêter de prendre.
        </p>
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

// Restauration — ce que le rush et le panier moyen rapportent en plus
function TicketRush() {
  const [cv, setCv] = useState(80);
  const [tk, setTk] = useState(22);
  const [nb, setNb] = useState(8);
  const [cv2, setCv2] = useState(120);
  const [up, setUp] = useState(2);
  const now = cv * tk * nb;
  const after = cv2 * (tk + up) * nb;
  return (
    <div className="card calc">
      <h3>Ce que ton rush peut te rapporter en plus</h3>
      <div className="grid">
        <Num label="Couverts servis un soir de rush aujourd’hui" value={cv} onChange={setCv} />
        <Num label="Panier moyen par couvert" suffix="€" value={tk} onChange={setTk} />
        <Num label="Soirées de rush par mois" value={nb} onChange={setNb} />
        <Num label="Couverts visés un soir de rush" value={cv2} onChange={setCv2} />
        <Num label="Hausse de panier moyen visée" suffix="€" value={up} onChange={setUp} />
      </div>
      <div className="result">
        <div>Chiffre d’affaires en plus chaque mois</div>
        <div className="big">+ {eur(after - now)}</div>
        <p style={{ margin: '8px 0 0' }}>
          Aujourd’hui tes soirées de rush font <b>{eur(now)}</b> par mois. Avec {cv2} couverts et {up} € de plus par couvert, elles font <b>{eur(after)}</b>, soit <mark>{eur((after - now) * 12)}</mark> sur l’année, avec la même salle.
        </p>
      </div>
    </div>
  );
}

// Beauté — les 5 règles chiffrées de Marvin pour un salon ou un institut
function Salon5Regles() {
  const [ca, setCa] = useState(22000);
  const [prod, setProd] = useState(3500);
  const [sal, setSal] = useState(11000);
  const [charges, setCharges] = useState(17000);
  const [cote, setCote] = useState(15000);
  const [cout, setCout] = useState(2800);
  const [nb, setNb] = useState(2);
  const [caCollab, setCaCollab] = useState(6500);
  const rules = [
    { t: 'Produits : au moins 15 % du CA', ok: prod >= ca * 0.15, d: `Cible ${eur(ca * 0.15)} par mois, tu fais ${eur(prod)}.` },
    { t: 'Salaires chargés : 45 % du CA maximum', ok: sal <= ca * 0.45, d: `Plafond ${eur(ca * 0.45)} par mois, tu es à ${eur(sal)}.` },
    { t: '3 mois de charges de côté', ok: cote >= charges * 3, d: `Il te faut ${eur(charges * 3)} sur un compte à part, tu as ${eur(cote)}.` },
    { t: 'Chaque collaboratrice ramène 3 fois son coût', ok: caCollab >= cout * 3, d: `Cible ${eur(cout * 3)} de prestations par mois, elle fait ${eur(caCollab)}.` },
    { t: `Objectif de l’équipe : ${nb} × 100 800 € par an`, ok: ca * 12 >= nb * 100800, d: `Objectif ${eur(nb * 100800)}, ton rythme actuel donne ${eur(ca * 12)} sur l’année.` },
  ];
  const okCount = rules.filter((r) => r.ok).length;
  return (
    <div className="card calc">
      <h3>Ton salon passe-t-il les 5 règles ?</h3>
      <div className="grid">
        <Num label="Chiffre d’affaires du mois" suffix="€" value={ca} onChange={setCa} />
        <Num label="Ventes de produits du mois" suffix="€" value={prod} onChange={setProd} />
        <Num label="Salaires du mois, charges comprises" suffix="€" value={sal} onChange={setSal} />
        <Num label="Toutes tes charges du mois, salaires compris" suffix="€" value={charges} onChange={setCharges} />
        <Num label="Argent de côté sur un compte à part" suffix="€" value={cote} onChange={setCote} />
        <Num label="Coût d’une collaboratrice par mois, chargée" suffix="€" value={cout} onChange={setCout} />
        <Num label="Nombre de collaboratrices" value={nb} onChange={setNb} />
        <Num label="Prestations faites par une collaboratrice par mois" suffix="€" value={caCollab} onChange={setCaCollab} />
      </div>
      <div className="result">
        <div>Règles respectées</div>
        <div className="big">{okCount} sur 5</div>
        {rules.map((r, i) => (
          <p key={i} style={{ margin: '10px 0 0' }}>
            <b style={{ color: r.ok ? 'var(--ok)' : 'var(--danger)' }}>{r.ok ? '✓' : '✗'} {r.t}</b>
            <br />
            {r.d}
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
