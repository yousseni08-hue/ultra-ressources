import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import OptinForm from '@/components/OptinForm';
import Testimonials from '@/components/Testimonials';
import { getLeadMagnet, listLeadMagnets } from '@/lib/content';

type P = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listLeadMagnets().map((lm) => ({ slug: lm.slug }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const lm = getLeadMagnet((await params).slug);
  return lm ? { title: lm.title, description: lm.promise } : {};
}

const NICHE_TO_SECTOR: Record<string, string> = { BTP: 'btp', Restauration: 'resto', Garage: 'auto', Salon: 'beaute', 'Beauté': 'beaute', Commerce: 'commerce', Nettoyage: 'nettoyage' };

export default async function OptinPage({ params }: P) {
  const lm = getLeadMagnet((await params).slug);
  if (!lm) notFound();
  return (
    <main className="wrap hero">
      <span className="kicker">Méthode offerte · {lm.niche}</span>
      <h1>{lm.title}</h1>
      <p className="lead">{lm.promise}</p>
      <ul className="gets">
        {lm.deliverables.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
      <OptinForm resource={lm.slug} keyword={lm.keyword} cta={lm.cta} defaultSector={NICHE_TO_SECTOR[lm.niche]} />
      <Testimonials items={lm.testimonials.slice(0, 3)} />
    </main>
  );
}
