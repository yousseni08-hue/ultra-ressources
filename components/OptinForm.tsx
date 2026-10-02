'use client';
import { useState } from 'react';
import { track } from './Pixel';
import PhoneField from './PhoneField';

const SECTORS = [
  ['btp', 'BTP / artisanat'],
  ['resto', 'Restauration'],
  ['auto', 'Garage / automobile'],
  ['beaute', 'Salon / beauté / bien-être'],
  ['commerce', 'Commerce / boutique'],
  ['nettoyage', 'Nettoyage / entretien'],
  ['autre', 'Autre'],
];
const CA = [
  ['moins-100k', 'Moins de 100 k€'],
  ['100-300k', '100 à 300 k€'],
  ['300-500k', '300 à 500 k€'],
  ['500k-1m', '500 k€ à 1 M€'],
  ['plus-1m', 'Plus de 1 M€'],
];

type Props = {
  resource: string;
  keyword?: string;
  cta: string;
  answers?: Record<string, string>;
  defaultSector?: string;
  defaultCa?: string;
  hideSector?: boolean;
};

export default function OptinForm({ resource, keyword, cta, answers, defaultSector, defaultCa, hideSector }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const qs = new URLSearchParams(window.location.search);
    try {
      const res = await fetch('/api/optin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource,
          keyword: qs.get('kw') || keyword,
          firstName: fd.get('firstName'),
          phone: fd.get('phone'),
          phoneCountry: fd.get('phoneCountry'),
          sector: fd.get('sector') || defaultSector,
          ca: fd.get('ca') || defaultCa,
          website: fd.get('website'),
          source: qs.get('utm_medium') || qs.get('src') || 'direct',
          campaign: qs.get('utm_campaign') || resource,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur, réessaie.');
      track('Lead', { content_name: resource });
      window.location.href = data.redirect;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card" id="optin">
      <div className="field">
        <label htmlFor="firstName">Ton prénom</label>
        <input id="firstName" name="firstName" autoComplete="given-name" required />
      </div>
      <PhoneField />
      {!hideSector && (
        <div className="field">
          <label htmlFor="sector">Ton secteur</label>
          <select id="sector" name="sector" required defaultValue={defaultSector ?? ''}>
            <option value="" disabled>Choisis…</option>
            {SECTORS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      )}
      {!defaultCa && (
        <div className="field">
          <label htmlFor="ca">Ton chiffre d’affaires annuel</label>
          <select id="ca" name="ca" required defaultValue="">
            <option value="" disabled>Choisis…</option>
            {CA.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      )}
      <div className="hp" aria-hidden>
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button className="btn" disabled={loading}>{loading ? 'Une seconde…' : cta}</button>
      {error && <p className="error">{error}</p>}
      <p className="fine">Accès immédiat. Quelqu’un de l’équipe Ultra peut t’appeler pour t’aider à l’appliquer à ta boîte.</p>
    </form>
  );
}
