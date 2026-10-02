import Link from 'next/link';
import { getRoadmap, listLeadMagnets } from '@/lib/content';

// Index interne (non indexé) : sert à l'équipe pour retrouver les liens à mettre dans CloseMate.
export default function Home() {
  const rm = getRoadmap();
  const items = [{ slug: 'plan', title: rm.title, keyword: rm.keyword, niche: 'Tous secteurs' }, ...listLeadMagnets()];
  return (
    <main className="wrap hero">
      <span className="kicker">Ressources gratuites</span>
      <h1>Les ressources de Marvin</h1>
      <div className="tests">
        {items.map((lm) => (
          <Link key={lm.slug} href={`/${lm.slug}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="kicker" style={{ marginBottom: 4 }}>{lm.niche} · {lm.keyword}</span>
            <b style={{ display: 'block' }}>{lm.title}</b>
          </Link>
        ))}
      </div>
    </main>
  );
}
