import { Link, useParams } from 'react-router-dom';
import type { WorkCategory } from '../types/contribution';
import { findWork } from '../registry/contributions';
import { getSection } from '../registry/categories';
import ErrorBoundary from '../components/ErrorBoundary';
import NotFoundPage from './NotFoundPage';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface Props {
  category: WorkCategory;
}

/** /arcade/:slug と /tools/:slug — 1 つの作品のページ */
export default function WorkPage({ category }: Props) {
  const { slug = '' } = useParams();
  const work = findWork(category, slug);
  useDocumentTitle(work?.meta.title);

  if (!work) return <NotFoundPage />;
  const { meta, Component } = work;
  const section = getSection(category);

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="現在地">
        <Link to="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link to={section.path}>{section.label}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{meta.title}</span>
      </nav>

      <header className={`page-head page-head--${category}`}>
        <span className="page-head__emoji" aria-hidden="true">{meta.emoji}</span>
        <div>
          <span className={`chip chip--${category}`}>{section.label}</span>
          {meta.sample && <span className="chip chip--muted"> サンプル</span>}
          <h1 className="work-head__title">{meta.title}</h1>
          <p className="page-head__desc">{meta.description}</p>
        </div>
      </header>

      <section className="stage" aria-label={meta.title}>
        <ErrorBoundary key={work.path} label={`「${meta.title}」`}>
          <Component />
        </ErrorBoundary>
      </section>
    </div>
  );
}
