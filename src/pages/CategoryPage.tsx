import type { WorkCategory } from '../types/contribution';
import { getSection } from '../registry/categories';
import { worksIn } from '../registry/contributions';
import WorkCard from '../components/WorkCard';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface Props {
  category: WorkCategory;
}

/** Arcade / Tools: みんなの作品の一覧 */
export default function CategoryPage({ category }: Props) {
  const info = getSection(category);
  useDocumentTitle(info.label);
  const items = worksIn(category);

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

      <section aria-labelledby="list-title">
        <h2 id="list-title" className="section-title">作品 ({items.length})</h2>
        {items.length ? (
          <div className="work-grid">
            {items.map((w) => (
              <WorkCard key={w.path} work={w} />
            ))}
          </div>
        ) : (
          <EmptyState title={`${info.label} の作品はまだありません`}>
            <p>
              自分のフォルダの <code>works/</code> に、<code>meta.category</code> を <code>&quot;{category}&quot;</code> にした作品を置くと、ここに並びます。
            </p>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
