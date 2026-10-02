import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import Calculator from './Calculators';
import { stripInternalNotes } from '@/lib/content';

// Liens des modèles offerts (Google Sheets…) : content/liens.json, affichés à la place de {{sheet:id}}.
const LIENS: Record<string, string> = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/liens.json'), 'utf8'));
const SHEET_LABEL: Record<string, string> = { 'tableau-relance': 'Copier le tableau de relance (Google Sheets)' };

function Sheet({ id }: { id: string }) {
  const url = (LIENS[id] || '').replace(/\/edit.*$/, '/copy');
  if (!url) return null;
  return (
    <div className="card calc">
      <h3 style={{ marginTop: 0 }}>{SHEET_LABEL[id] || 'Ouvrir le modèle'}</h3>
      <p className="fine">Prêt à l’emploi : clique, Google te propose d’en faire une copie dans ton compte. Tu remplis, le reste se calcule.</p>
      <a className="btn" href={url} target="_blank" rel="noopener">Faire ma copie du tableau</a>
    </div>
  );
}

// Rend le markdown d'une ressource et remplace {{calculator:id}} / {{sheet:id}} par le bloc interactif.
export default function Markdown({ source }: { source: string }) {
  const parts = stripInternalNotes(source).split(/\{\{(calculator|sheet):([a-z0-9-]+)\}\}/g);
  return (
    <div className="prose">
      {parts.map((p, i) => {
        if (i % 3 === 1) return null;
        if (i % 3 === 2) return parts[i - 1] === 'sheet' ? <Sheet key={i} id={p} /> : <Calculator key={i} id={p} />;
        return <div key={i} dangerouslySetInnerHTML={{ __html: marked.parse(p, { async: false }) as string }} />;
      })}
    </div>
  );
}
