import { notFound, redirect } from 'next/navigation';
import Markdown from '@/components/Markdown';
import NextStep from '@/components/NextStep';
import Testimonials from '@/components/Testimonials';
import { getLeadMagnet } from '@/lib/content';
import { verifyToken } from '@/lib/token';

export const dynamic = 'force-dynamic';

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> };

export default async function ResourcePage({ params, searchParams }: P) {
  const { slug } = await params;
  const { t } = await searchParams;
  const lm = getLeadMagnet(slug);
  if (!lm) notFound();
  const tok = verifyToken<{ r: string; n: string }>(t);
  if (!tok || tok.r !== slug) redirect(`/${slug}`); // pas d'opt-in → retour au formulaire

  return (
    <main className="wrap hero">
      <span className="kicker">C’est pour toi, {tok.n}</span>
      <h1>{lm.title}</h1>
      <p className="lead">{lm.promise}</p>
      <p className="fine" style={{ marginTop: -12 }}>Garde cette page dans tes favoris, c’est ton accès.</p>
      <Markdown source={lm.body} />
      <Testimonials items={lm.testimonials} />
      <NextStep token={t!} resource={slug} />
    </main>
  );
}
