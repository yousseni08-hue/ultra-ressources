'use client';
import { useEffect, useState } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { COUNTRIES, countryOfDial, flagOf, type Country } from '@/lib/phone';

// Indicatif tapable (+33, +221…) ou choisi dans la liste de tous les pays (clic sur le drapeau), puis le numéro.
// Envoie un champ caché `phone` au format international (+33612345678).
export default function PhoneField() {
  const [dial, setDial] = useState('33');
  const [national, setNational] = useState('');
  // Noms des pays traduits par le navigateur : la liste se remplit après le chargement (sinon écart serveur/navigateur).
  const [list, setList] = useState<Country[]>([]);
  useEffect(() => setList(COUNTRIES), []);

  const intl = national.trim().replace(/^00/, '+').startsWith('+');
  const parsed = intl
    ? parsePhoneNumberFromString(national.replace(/^\s*00/, '+'))
    : dial
      ? parsePhoneNumberFromString(national, { defaultCallingCode: dial })
      : undefined;
  const e164 = parsed?.isValid() ? parsed.number : '';
  const country = parsed?.country || countryOfDial(intl ? parsed?.countryCallingCode || '' : dial);

  const onNational = (v: string) => {
    // Numéro collé au format international : on remplit l'indicatif tout seul.
    const p = parsePhoneNumberFromString(v.replace(/^\s*00/, '+'));
    if (/^\s*(\+|00)/.test(v) && p?.isValid()) {
      setDial(p.countryCallingCode);
      setNational(p.formatNational());
      return;
    }
    setNational(v);
  };

  return (
    <div className="field">
      <label htmlFor="phone-national">Ton numéro de téléphone</label>
      <div className="phone-row">
        <div className="dial">
          <span className="flag" aria-hidden>{country ? flagOf(country) : '🌍'}<small>▾</small></span>
          <select
            aria-label="Choisir le pays"
            value={country || ''}
            onChange={(e) => setDial(COUNTRIES.find((c) => c.code === e.target.value)?.dial || dial)}
          >
            {(!country || !list.length) && <option value={country || ''}>Pays</option>}
            {list.map((c) => (
              <option key={c.code} value={c.code}>{`${c.flag} ${c.name} (+${c.dial})`}</option>
            ))}
          </select>
          <input
            aria-label="Indicatif"
            type="tel"
            inputMode="tel"
            value={'+' + dial}
            onChange={(e) => setDial(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
        <input id="phone-national" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" required value={national} onChange={(e) => onNational(e.target.value)} />
      </div>
      <input type="hidden" name="phone" value={e164 || (dial ? `+${dial}${national.replace(/\D/g, '').replace(/^0/, '')}` : national)} />
      <input type="hidden" name="phoneCountry" value={country || ''} />
    </div>
  );
}
