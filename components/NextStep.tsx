'use client';
import { useEffect, useState } from 'react';
import { track } from './Pixel';

// Fin de ressource : objectif chiffré à 4 mois (pré-qualifie + donne l'ouverture d'appel au setter) puis booking iClosed.
type Props = { token: string; resource: string; title?: string; intro?: string; defaultObjectif?: string; bookLabel?: string };

const bookingHref = (resource: string) => {
  const booking = process.env.NEXT_PUBLIC_ICLOSED_URL;
  return booking ? `${booking}${booking.includes('?') ? '&' : '?'}utm_source=leadmagnet&utm_campaign=${resource}` : '#';
};

/** Bouton de réservation iClosed (même lien et même event Pixel que le bouton de fin de ressource). */
export function BookLink({ resource, children }: { resource: string; children: React.ReactNode }) {
  return (
    <a className="btn" href={bookingHref(resource)} onClick={() => track('Schedule', { content_name: resource })}>
      {children}
    </a>
  );
}

export default function NextStep({ token, resource, title, intro, defaultObjectif, bookLabel }: Props) {
  const [objectif, setObjectif] = useState(defaultObjectif ?? '');
  const [sent, setSent] = useState(false);
  const booking = process.env.NEXT_PUBLIC_ICLOSED_URL;

  useEffect(() => {
    track('ViewContent', { content_name: resource });
  }, [resource]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!objectif.trim()) return;
    await fetch('/api/objectif', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token, objectif }) }).catch(() => {});
    setSent(true);
  }

  return (
    <section>
      <h2>{title ?? 'Ton objectif chiffré à 4 mois'}</h2>
      {intro ? (
        <p className="fine">{intro}</p>
      ) : (
        <p>Écris-le en une phrase, avec une date et le moyen d’y arriver. Par exemple : « recruter un chef de chantier d’ici février pour sortir du chantier deux jours par semaine ».</p>
      )}
      {sent ? (
        <p className="card">C’est noté. Quelqu’un de l’équipe Ultra va regarder ça avec toi.</p>
      ) : (
        <form onSubmit={send} className="card">
          <textarea rows={3} value={objectif} onChange={(e) => setObjectif(e.target.value)} placeholder="D’ici le … je veux … en …" />
          <button className="btn" style={{ marginTop: 12 }}>Valider mon objectif</button>
        </form>
      )}
      {booking && (
        <div style={{ marginTop: 24 }}>
          <BookLink resource={resource}>{bookLabel || 'Réserve un appel diagnostic avec l’équipe Ultra'}</BookLink>
          <p className="fine">30 minutes pour regarder tes chiffres et te dire par quoi tu commencerais à notre place.</p>
        </div>
      )}
    </section>
  );
}
