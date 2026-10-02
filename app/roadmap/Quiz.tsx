'use client';
import { useEffect, useRef, useState } from 'react';
import OptinForm from '@/components/OptinForm';
import type { RoadmapQuestion } from '@/lib/content';
import { SEC_DEP, ctx, fill, secteurOf, stepAt, type QuizSecteur } from '@/lib/roadmap';

const DELAY = 320; // le choix passe en orange, puis on enchaîne

// Quiz adaptatif : l'ordre suit `flow`, les questions specialite/nom/frein/kpi viennent du fichier du secteur choisi.
// Le quiz d'abord (le prospect s'investit), le numéro ensuite, le résultat après le numéro.
export default function Quiz({
  flow,
  questions,
  secteurs,
  cta,
  keyword,
}: {
  flow: string[];
  questions: RoadmapQuestion[];
  secteurs: Record<string, QuizSecteur>;
  cta: string;
  keyword: string;
}) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState(false);
  const [text, setText] = useState('');
  const [textErr, setTextErr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sec = secteurOf(secteurs, answers.secteur);
  const c = ctx(answers, sec);
  const q = step >= 0 ? stepAt(step, flow, questions, sec) : null;

  useEffect(() => {
    if (step >= 0) window.scrollTo(0, 0);
    if (q?.type === 'text') {
      setText(answers[q.id] || '');
      setTextErr(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === -1)
    return (
      <button className="btn" onClick={() => setStep(0)}>
        Je fais mon diagnostic offert
      </button>
    );

  if (step >= flow.length || !q) {
    return (
      <>
        <div className="progress"><div style={{ width: '100%' }} /></div>
        <h2 style={{ marginTop: 0 }}>
          Le plan de <mark>{c.nom}</mark> est prêt.
        </h2>
        <p>Dis-nous où te l’envoyer, il s’affiche juste après.</p>
        <OptinForm
          resource="roadmap"
          keyword={keyword}
          cta={cta}
          answers={answers}
          defaultSector={answers.secteur}
          hideSector={!!answers.secteur}
          defaultCa={answers.ca}
        />
        <button className="btn ghost back" onClick={() => setStep(flow.length - 1)}>
          ← Retour
        </button>
      </>
    );
  }

  const header = (
    <>
      <div className="progress"><div style={{ width: `${(step / flow.length) * 100}%` }} /></div>
      <p className="fine" style={{ marginTop: 0 }}>Question {step + 1} sur {flow.length}</p>
    </>
  );
  const back = (
    <button className="btn ghost back" disabled={locked} onClick={() => setStep((s) => s - 1)}>
      ← Retour
    </button>
  );

  if (q.type === 'text') {
    const go = () => {
      const v = text.trim();
      if (!v) {
        setTextErr(true);
        inputRef.current?.focus();
        return;
      }
      setAnswers((a) => ({ ...a, [q.id]: v }));
      setStep((s) => s + 1);
    };
    return (
      <div>
        {header}
        <h2 style={{ marginTop: 4 }}>{q.label}</h2>
        <p style={{ color: 'var(--muted)' }}>On s’en sert pour écrire ta roadmap à ton nom.</p>
        <input
          ref={inputRef}
          className={`txt${textErr ? ' err' : ''}`}
          maxLength={60}
          placeholder={q.placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setTextErr(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              go();
            }
          }}
        />
        <button className="btn" style={{ marginTop: 12 }} onClick={go}>
          Continuer
        </button>
        {back}
      </div>
    );
  }

  const pick = (id: string) => {
    if (locked) return;
    setLocked(true);
    setAnswers((a) => {
      const n = { ...a };
      if (q.id === 'secteur' && a.secteur !== id) SEC_DEP.forEach((k) => delete n[k]);
      n[q.id] = id;
      return n;
    });
    setTimeout(() => {
      setLocked(false);
      setStep((s) => s + 1);
    }, DELAY);
  };

  return (
    <div>
      {header}
      <h2 style={{ marginTop: 4 }}>{fill(q.label, c)}</h2>
      {q.help && <p style={{ color: 'var(--muted)' }}>{fill(q.help, c)}</p>}
      <div className="opts" key={q.id}>
        {q.options.map((o) => (
          <button key={o.id} className={`opt${answers[q.id] === o.id ? ' sel' : ''}`} aria-pressed={answers[q.id] === o.id} onClick={() => pick(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      {back}
    </div>
  );
}
