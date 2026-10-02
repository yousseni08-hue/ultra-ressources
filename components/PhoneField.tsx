'use client';
import { useState } from 'react';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
import { COUNTRIES } from '@/lib/countries';

// Indicatif (les 23 pays du site Ultra) + numéro national. Envoie un champ caché `phone` au format international (+33612345678).
export default function PhoneField() {
  const [country, setCountry] = useState<CountryCode>('FR');
  const [national, setNational] = useState('');
  const parsed = parsePhoneNumberFromString(national, country);
  const e164 = parsed?.isValid() ? parsed.number : '';

  return (
    <div className="field">
      <label htmlFor="phone-national">Ton numéro de téléphone</label>
      <div className="phone-row">
        <select aria-label="Indicatif pays" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} title={c.name}>{`${c.flag} ${c.dial}`}</option>
          ))}
        </select>
        <input id="phone-national" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="06 12 34 56 78" required value={national} onChange={(e) => setNational(e.target.value)} />
      </div>
      <input type="hidden" name="phone" value={e164 || national} />
      <input type="hidden" name="phoneCountry" value={country} />
    </div>
  );
}
