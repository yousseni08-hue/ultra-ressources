import type { Metadata } from 'next';
import Quiz from './Quiz';
import Testimonials from '@/components/Testimonials';
import { getRoadmap } from '@/lib/content';
import type { QuizSecteur } from '@/lib/roadmap';

export function generateMetadata(): Metadata {
  const rm = getRoadmap();
  return { title: rm.title, description: rm.promise };
}

export default function RoadmapPage() {
  const rm = getRoadmap();
  // Le quiz n'a besoin que des questions du secteur : les leviers et preuves restent côté serveur.
  const quizSecteurs: Record<string, QuizSecteur> = Object.fromEntries(
    Object.values(rm.secteurs).map(({ id, nounDefault, nomLabel, nomPlaceholder, specialite, effectifLabel, frein, kpi }) => [
      id,
      { id, nounDefault, nomLabel, nomPlaceholder, specialite, effectifLabel, frein, kpi },
    ]),
  );
  return (
    <main className="wrap hero">
      <span className="kicker">Diagnostic offert · 2 minutes</span>
      <h1>{rm.title}</h1>
      <p className="lead">{rm.promise}</p>
      <ul className="gets">
        {rm.deliverables.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
      <Quiz flow={rm.flow} questions={rm.questions} secteurs={quizSecteurs} cta={rm.cta} keyword={rm.keyword} />
      <Testimonials items={rm.testimonials.slice(0, 3)} />
    </main>
  );
}
