import { Link } from 'react-router-dom';
import type { Work } from '../registry/contributions';
import { getSection } from '../registry/categories';

interface Props {
  work: Work;
  showCategory?: boolean;
  showAuthor?: boolean;
}

export default function WorkCard({ work, showCategory = false, showAuthor = true }: Props) {
  const { meta, member } = work;
  return (
    <Link to={work.path} className={`work-card work-card--${meta.category}`}>
      <span className="work-card__emoji" aria-hidden="true">{meta.emoji}</span>
      <span className="work-card__body">
        {showCategory && <span className={`chip chip--${meta.category}`}>{getSection(meta.category).label}</span>}
        <span className="work-card__title">{meta.title}</span>
        <span className="work-card__desc">{meta.description}</span>
        {showAuthor && (
          <span className="work-card__by">
            <span aria-hidden="true">{member.meta.emoji}</span> {member.meta.name}
          </span>
        )}
      </span>
      <span className="work-card__go" aria-hidden="true">→</span>
    </Link>
  );
}
