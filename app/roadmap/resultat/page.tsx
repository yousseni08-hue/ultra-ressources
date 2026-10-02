import { redirect } from 'next/navigation';
import Checklist from '@/components/Checklist';
import Markdown from '@/components/Markdown';
import NextStep, { BookLink } from '@/components/NextStep';
import Testimonials from '@/components/Testimonials';
import { getRoadmap, getRoadmapIntro, type Roadmap, type RoadmapStage, type Testimonial } from '@/lib/content';
import { EFF, MID, TRESO, answerLabel, ctx, fill, fmt, lc, secteurOf } from '@/lib/roadmap';
import { verifyToken } from '@/lib/token';

export const dynamic = 'force-dynamic';

// Jeton signé à l'opt-in : r ressource, n prénom, sec secteur, s palier, puis les ids des réponses du quiz
// (sp spécialité, nm nom d'entreprise, ef effectif, ca, tr trésorerie, fr frein, kp chiffre clé).
type Tok = { r: string; n: string; sec: string; s: number; sp?: string; nm?: string; ef?: string; ca?: string; tr?: string; fr?: string; kp?: string };

function ProofCard({ t }: { t: Testimonial }) {
  return (
    <div className="card test">
      <b>{t.name}</b>
      <span style={{ color: 'var(--muted)', fontSize: 14 }}>{t.business}</span>
      <div className="res">{t.result}</div>
      {t.quote && <div className="quote">« {t.quote} »</div>}
    </div>
  );
}

/** Plan de métro des paliers : passés pleins, actuel avec halo + « Tu es ici », futurs grisés. */
function Metro({ stages, idx }: { stages: RoadmapStage[]; idx: number }) {
  return (
    <div className="metro">
      {stages.map((x, j) => (
        <div key={x.id} className={`st${j < idx ? ' done' : j === idx ? ' here' : ''}`}>
          <span className="dot" />
          <div>
            <b>
              {j + 1}. {x.name}
            </b>{' '}
            <span className="note">{x.effectif}</span>
            {j === idx && (
              <>
                {' '}
                <span className="stage-badge">Tu es ici</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Fiche 4 cases d'un palier ; la dernière (graduateBy) est mise en avant. */
function Fiche({ stages, s, big }: { stages: RoadmapStage[]; s: RoadmapStage; big?: boolean }) {
  const n = stages.findIndex((x) => x.id === s.id) + 1;
  const cells = (
    [
      ['Ton rôle', s.founderRole],
      ['Effectif', s.effectif],
      ['Le blocage', s.bottleneck],
      [n < stages.length ? `Pour passer au palier ${n + 1}` : 'Pour aller plus loin', s.graduateBy],
    ] as [string, string | undefined][]
  ).filter((x) => x[1]);
  return (
    <>
      <div className={`fiche${big ? ' main' : ''}`}>
        {cells.map(([k, v], i) => (
          <div key={k} className={`fc${i === 3 ? ' key' : ''}`}>
            <small>{k}</small>
            <div>{v}</div>
          </div>
        ))}
      </div>
      {!big && (
        <p className="note" style={{ margin: '10px 0 0' }}>
          Palier {n} · {s.name}
        </p>
      )}
    </>
  );
}

function Fns({ functions, s }: { functions: Roadmap['functions']; s: RoadmapStage }) {
  return (
    <div>
      {functions.map((f) =>
        s.actions[f.id] ? (
          <div key={f.id} className="fn">
            <b>{f.label}</b>
            <span>{s.actions[f.id]}</span>
          </div>
        ) : null,
      )}
    </div>
  );
}

export default async function RoadmapResult({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const tok = verifyToken<Tok>(t);
  if (!tok || tok.r !== 'roadmap') redirect('/roadmap');

  const rm = getRoadmap();
  const idx = Math.max(0, rm.stages.findIndex((s) => s.id === Number(tok.s)));
  const stage = rm.stages[idx];
  const prev = rm.stages[idx - 1];
  const next = rm.stages[idx + 1];
  const secId = tok.sec || 'autre';
  const sd = secteurOf(rm.secteurs, secId);
  const ans: Record<string, string> = {
    secteur: secId,
    ...(tok.sp && { specialite: tok.sp }),
    ...(tok.nm && { nom: tok.nm }),
    ...(tok.ef && { effectif: tok.ef }),
    ...(tok.ca && { ca: tok.ca }),
    ...(tok.tr && { tresorerie: tok.tr }),
    ...(tok.fr && { frein: tok.fr }),
    ...(tok.kp && { kpi: tok.kp }),
  };
  const c = ctx(ans, sd, tok.n);
  const F = (x?: string) => fill(x, c);
  const lab = (id: string) => answerLabel(id, ans[id], rm.questions, sd);

  const lever = ans.frein ? sd?.levers?.[ans.frein] : undefined;
  const kpi = sd?.kpi?.options.find((o) => o.id === ans.kpi);
  const byName = (n?: string) => (n ? rm.testimonials.find((x) => x.name === n) : undefined);
  const proofs = (sd?.proofs || []).map(byName).filter((x): x is Testimonial => !!x);
  const tests = proofs.length ? proofs : rm.testimonials.filter((x) => !x.stages || x.stages.includes(stage.id));
  const leverProof = byName(lever?.proof);
  const money = lever?.money && ans.ca && MID[ans.ca] ? MID[ans.ca] * lever.money.pctOfCA : 0;

  const d4 = new Date();
  d4.setMonth(d4.getMonth() + 4);
  const dt = d4.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
  const goal = lever
    ? money
      ? `D’ici le ${dt}, ${c.nom} fait ${fmt(money / 3)} de chiffre en plus, grâce à un seul chantier : ${lc(F(lever.title).replace(/^Ton chantier n°1\s*:\s*/i, ''))}.`
      : `D’ici le ${dt}, ${c.nom} tourne une semaine entière sans moi, sans que le chiffre baisse.`
    : '';

  const facts: [string, string][] = (
    [
      ['Activité', c.spLabel || lab('secteur')],
      ['Équipe', lab('effectif')],
      ['Chiffre d’affaires', lab('ca')],
      ['Trésorerie', lab('tresorerie')],
      ['Ton frein n°1', lab('frein')],
      [sd?.kpi?.short || 'Ton chiffre clé', lab('kpi')],
    ] as [string, string][]
  ).filter((x) => x[1]);

  const today =
    `${c.Noun} « ${c.nom} » vend ${c.vend}. ${EFF[ans.effectif] || ''} ` +
    (ans.ca ? `Chiffre d’affaires : ${lc(lab('ca'))}. ` : '') +
    (ans.tresorerie ? `De côté : ${lc(lab('tresorerie'))}.` : '');
  const example = stage.examples?.[secId];

  return (
    <main className="wrap hero">
      <span className="kicker">Le plan de {c.nom}</span>
      <h1>
        {c.prenom ? `${c.prenom}, ` : ''}
        {lc(c.noun)} est au palier {idx + 1} sur {rm.stages.length} : <mark>{stage.name}</mark>
      </h1>
      <div className="stages">
        {rm.stages.map((s, i) => (
          <div key={s.id} className={i <= idx ? 'on' : ''} title={s.name} />
        ))}
      </div>

      <div className="card">
        <span className="stage-badge">{c.nom} aujourd’hui</span>
        <p style={{ fontSize: 19, margin: '14px 0 0' }}>{F(today)}</p>
        <div className="facts">
          {facts.map(([k, v]) => (
            <div key={k} className="fact">
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>
        {kpi?.read && <p style={{ margin: 0, color: '#e7e6e1' }}>{F(kpi.read)}</p>}
      </div>

      {lever && (
        <>
          <h2>{F(lever.title)}</h2>
          <p className="lead" style={{ fontSize: 18 }}>{F(lever.diagnosis)}</p>
          <div className="card">
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 6 }}>Ce que tu fais dès cette semaine</div>
            <Checklist items={lever.actions.map(F)} />
            {money > 0 && lever.money && (
              <div className="money">
                <div className="fine" style={{ margin: 0 }}>Ordre de grandeur pour {c.nom}</div>
                <div className="big">≈ {fmt(money)} par an</div>
                <p className="fine" style={{ margin: '8px 0 0' }}>
                  {F(lever.money.explain)} Calcul sur le milieu de ta tranche de chiffre d’affaires : c’est un ordre d’idée, pas une promesse.
                </p>
              </div>
            )}
          </div>
          {leverProof && (
            <div className="tests">
              <ProofCard t={leverProof} />
            </div>
          )}
        </>
      )}

      {ans.tresorerie && TRESO[ans.tresorerie] && (
        <>
          <h2>Ta trésorerie</h2>
          <p>{F(TRESO[ans.tresorerie])}</p>
        </>
      )}

      <h2>Tu es ici</h2>
      <p className="note">{rm.stageRule}</p>
      <Metro stages={rm.stages} idx={idx} />

      <h2>Ton palier : {stage.name}</h2>
      <Fiche stages={rm.stages} s={stage} big />
      {stage.stat && (
        <div className="stat">
          <div className="big">{stage.stat.figure}</div>
          <p style={{ margin: '6px 0 0' }}>{stage.stat.text}</p>
          <p className="note" style={{ margin: '6px 0 0' }}>{stage.stat.source}</p>
        </div>
      )}
      <h3>Quand tu arrives à ce palier</h3>
      <p>{stage.summary}</p>
      {example && <p style={{ color: '#e7e6e1' }}>{F(`Chez {nom}, ça ressemble à ça : ${lc(example)}`)}</p>}

      <h2>Tes 3 chantiers du trimestre</h2>
      <ol className="prose">
        {stage.top3.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ol>

      <h2>Fonction par fonction</h2>
      <p className="note">Pour chaque fonction de l’entreprise : ce qu’il faut faire à ton palier.</p>
      <Fns functions={rm.functions} s={stage} />

      <h2>À quoi ressemble la réussite</h2>
      <h3>Tu sais que tu avances quand…</h3>
      <ul className="gets">{stage.signsOk.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h3>Tu sais qu’il reste du travail quand…</h3>
      <ul className="prose">{stage.signsKo.map((x, i) => <li key={i}>{x}</li>)}</ul>
      {stage.graduateWhen && (
        <div className="card cover">
          <span className="stage-badge">Prêt pour la suite</span>
          <p style={{ fontFamily: 'var(--font-head)', fontSize: 19, fontWeight: 800, margin: '12px 0 0' }}>{stage.graduateWhen}</p>
        </div>
      )}

      {stage.cta && (
        <div className="ctabox">
          <div className="t">{stage.cta.title}</div>
          <p style={{ margin: '12px 0 18px', color: '#e7e6e1' }}>{stage.cta.text}</p>
          <BookLink resource="roadmap">{stage.cta.button}</BookLink>
        </div>
      )}

      {prev && (
        <>
          <h2>Le palier que tu viens de passer</h2>
          <p className="note">Vérifie que rien ne traîne derrière toi : ce qui n’est pas réglé au palier d’avant revient toujours.</p>
          <div className="card">
            <Fiche stages={rm.stages} s={prev} />
            <details>
              <summary>Voir le palier {idx} fonction par fonction</summary>
              <Fns functions={rm.functions} s={prev} />
            </details>
          </div>
        </>
      )}
      {next && (
        <>
          <h2>Ce qui t’attend ensuite</h2>
          <p className="note">Prépare-le maintenant : c’est le palier suivant qui dit quoi construire aujourd’hui.</p>
          <div className="card">
            <Fiche stages={rm.stages} s={next} />
            <p style={{ margin: '14px 0 0' }}>{next.summary}</p>
            <details>
              <summary>Voir le palier {idx + 2} fonction par fonction</summary>
              <Fns functions={rm.functions} s={next} />
            </details>
          </div>
        </>
      )}

      <Markdown source={getRoadmapIntro()} />
      <Testimonials items={tests.filter((x) => x !== leverProof)} />
      <NextStep
        token={t!}
        resource="roadmap"
        title={`L’objectif de ${c.nom} à 4 mois`}
        intro={goal ? 'On te l’a pré-rempli à partir de tes réponses. Change-le, c’est le tien.' : undefined}
        defaultObjectif={goal}
        bookLabel={stage.cta?.button}
      />
    </main>
  );
}
