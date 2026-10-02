import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js/min';

// Tous les pays du monde. L'indicatif se choisit dans la liste OU se tape à la main (+221, +1…).
// Les pays proches de l'audience Ultra sont en tête, le reste suit par ordre alphabétique.
const FIRST: CountryCode[] = ['FR', 'BE', 'CH', 'LU', 'CA', 'MA', 'DZ', 'TN', 'RE', 'GP', 'MQ', 'GF'];

const names = new Intl.DisplayNames(['fr'], { type: 'region' });
export const flagOf = (c: string) => String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));

export type Country = { code: CountryCode; name: string; dial: string; flag: string };
const make = (code: CountryCode): Country => ({ code, name: names.of(code) || code, dial: getCountryCallingCode(code), flag: flagOf(code) });
const rest = getCountries()
  .filter((c) => !FIRST.includes(c))
  .map(make)
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
export const COUNTRIES: Country[] = [...FIRST.map(make), ...rest];

// Pays affiché quand un indicatif est partagé (+1, +7, +44…) et que le numéro n'est pas encore complet.
const MAIN: Record<string, CountryCode> = { '1': 'US', '7': 'RU', '44': 'GB', '33': 'FR', '39': 'IT', '47': 'NO', '61': 'AU', '212': 'MA', '262': 'RE', '290': 'SH', '358': 'FI', '590': 'GP', '599': 'CW' };
export function countryOfDial(dial: string): CountryCode | undefined {
  if (MAIN[dial]) return MAIN[dial];
  return getCountries().find((c) => getCountryCallingCode(c) === dial);
}
