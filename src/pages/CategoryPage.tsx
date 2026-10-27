import { Link } from 'react-router-dom';
import type { ContributionCategory } from '../types/contribution';
import { getCategory } from '../registry/categories';
import { contributions, contributionsIn } from '../registry/contributions';
import FeatureCard from '../components/FeatureCard';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface Props {
  category: ContributionCategory;
}

export default function CategoryPage({ category }: Props) {
  const info = getCategory(category);
  useDocumentTitle(info.label);
  const items = contributionsIn(category);

  return (
    <div className="page">
      <header className={`page-head page-head--${category}`}>
        <span className="page-head__emoji" aria-hidden="true">{info.emoji}</span>
        <div>
          <h1 className="page-head__title">{info.label}</h1>
          <p className="page-head__tagline">{info.tagline}</p>
          <p className="page-head__desc">{info.description}</p>
        </div>
      </header>

      {category === 'who-is-who' && contributions.length > 0 && (
        <section aria-labelledby="members-title">
          <h2 id="members-title" className="section-title">メンバーのページ</h2>
          <ul className="member-list">
            {contributions.map((c) => (
              <li key={c.meta.slug}>
                <Link to={`/members/${c.meta.slug}`} className="member-chip">
                  <span aria-hidden="true">{c.meta.emoji}</span> {c.meta.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="list-title">
        <h2 id="list-title" className="section-title">{info.tagline}</h2>
        {items.length ? (
          <div className="feature-grid">
            {items.map((c) => (
              <FeatureCard key={c.meta.slug} contribution={c} />
            ))}
          </div>
        ) : (
          <EmptyState title={`${info.label} にはまだ何もありません`}>
            <p>
              <code>meta.category</code> を <code>&quot;{category}&quot;</code> にしたページを作ると、ここに並びます。
            </p>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
