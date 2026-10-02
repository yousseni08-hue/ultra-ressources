import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js/min';

// Même liste et même ordre que le sélecteur du diagnostic d'ultra-consulting.eu (23 pays, relevé le 02/10/2026).
// Les autres pays ne sont volontairement pas proposés : on garde le même filtre que le site.
export const ALLOWED_COUNTRIES: CountryCode[] = ['FR', 'BE', 'CH', 'LU', 'MC', 'CA', 'GB', 'DE', 'ES', 'IT', 'PT', 'NL', 'MA', 'DZ', 'TN', 'SN', 'CI', 'CM', 'MU', 'RE', 'GP', 'MQ', 'GF'];

const names = new Intl.DisplayNames(['fr'], { type: 'region' });
const flag = (c: string) => String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));

export type Country = { code: CountryCode; name: string; dial: string; flag: string };
export const COUNTRIES: Country[] = ALLOWED_COUNTRIES.map((code) => ({ code, name: names.of(code) || code, dial: '+' + getCountryCallingCode(code), flag: flag(code) }));
