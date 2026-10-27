import { Link } from 'react-router-dom';
import type { Work } from '../registry/contributions';
import { getSection } from '../registry/categories';

interface Props {
  work: Work;
  showCategory?: boolean;
}

export default function WorkCard({ work, showCategory = false }: Props) {
  const { meta, category } = work;
  return (
    <Link to={work.path} className={`work-card work-card--${category}`}>
      <span className="work-card__emoji" aria-hidden="true">{meta.emoji}</span>
      <span className="work-card__body">
        {(showCategory || meta.sample) && (
          <span className="work-card__chips">
            {showCategory && <span className={`chip chip--${category}`}>{getSection(category).label}</span>}
            {meta.sample && <span className="chip chip--muted">サンプル</span>}
          </span>
        )}
        <span className="work-card__title">{meta.title}</span>
        <span className="work-card__desc">{meta.description}</span>
      </span>
      <span className="work-card__go" aria-hidden="true">→</span>
    </Link>
  );
}
