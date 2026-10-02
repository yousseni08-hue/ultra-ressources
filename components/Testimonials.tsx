import type { Testimonial } from '@/lib/content';

export default function Testimonials({ items, title = 'Ils sont passés par là' }: { items: Testimonial[]; title?: string }) {
  if (!items?.length) return null;
  return (
    <section>
      <h2>{title}</h2>
      <div className="tests">
        {items.map((t, i) => (
          <div key={i} className="card test">
            <b>{t.name}</b>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>{t.business}</span>
            <div className="res">{t.result}</div>
            {t.quote && <div className="quote">« {t.quote} »</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
