'use client';
import { useState } from 'react';

// Actions du chantier n°1 : on coche ce qui est fait (état local, rien n'est envoyé).
export default function Checklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  return (
    <ol className="prose checks">
      {items.map((a, i) => (
        <li key={i}>
          <label className={done[i] ? 'done' : ''}>
            <input type="checkbox" checked={done[i]} onChange={(e) => setDone((d) => d.map((x, j) => (j === i ? e.target.checked : x)))} />
            <span>{a}</span>
          </label>
        </li>
      ))}
    </ol>
  );
}
