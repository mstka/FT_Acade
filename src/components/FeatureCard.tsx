import { Link } from 'react-router-dom';
import type { Contribution } from '../registry/contributions';
import { getCategory } from '../registry/categories';

interface Props {
  contribution: Contribution;
  showCategory?: boolean;
}

export default function FeatureCard({ contribution, showCategory = false }: Props) {
  const { meta } = contribution;
  const category = getCategory(meta.category);
  return (
    <Link to={`/members/${meta.slug}`} className={`feature-card feature-card--${meta.category}`}>
      <span className="feature-card__emoji" aria-hidden="true">{meta.emoji}</span>
      <span className="feature-card__body">
        {showCategory && <span className={`chip chip--${meta.category}`}>{category.label}</span>}
        <span className="feature-card__title">{meta.title}</span>
        <span className="feature-card__desc">{meta.description}</span>
        <span className="feature-card__by">by {meta.name}</span>
      </span>
      <span className="feature-card__go" aria-hidden="true">→</span>
    </Link>
  );
}
