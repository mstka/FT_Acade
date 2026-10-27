import { Link, useParams } from 'react-router-dom';
import { findContribution } from '../registry/contributions';
import { getCategory } from '../registry/categories';
import ErrorBoundary from '../components/ErrorBoundary';
import NotFoundPage from './NotFoundPage';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function MemberPage() {
  const { slug = '' } = useParams();
  const contribution = findContribution(slug);
  useDocumentTitle(contribution?.meta.title);

  if (!contribution) return <NotFoundPage />;

  const { meta, Component } = contribution;
  const category = getCategory(meta.category);

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="現在地">
        <Link to="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link to={category.path}>{category.label}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{meta.name}</span>
      </nav>

      <header className={`member-head member-head--${meta.category}`}>
        <span className="member-head__emoji" aria-hidden="true">{meta.emoji}</span>
        <div>
          <span className={`chip chip--${meta.category}`}>{category.label}</span>
          <h1 className="member-head__title">{meta.title}</h1>
          <p className="member-head__by">by {meta.name}</p>
          <p className="member-head__desc">{meta.description}</p>
        </div>
      </header>

      <section className="stage" aria-label={`${meta.name} さんのコンテンツ`}>
        {/* key を付けて、別のページに移ったらエラー状態をリセットする */}
        <ErrorBoundary key={meta.slug} label={`${meta.name} さんのページ`}>
          <Component />
        </ErrorBoundary>
      </section>
    </div>
  );
}
