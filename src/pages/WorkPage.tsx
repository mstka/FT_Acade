import { Link, useParams } from 'react-router-dom';
import { findWork } from '../registry/contributions';
import { getSection } from '../registry/categories';
import ErrorBoundary from '../components/ErrorBoundary';
import NotFoundPage from './NotFoundPage';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** /members/:slug/:work — 1 つの作品のページ */
export default function WorkPage() {
  const { slug = '', work: id = '' } = useParams();
  const work = findWork(slug, id);
  useDocumentTitle(work?.meta.title);

  if (!work) return <NotFoundPage />;
  const { meta, member, Component } = work;
  const section = getSection(meta.category);

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="現在地">
        <Link to="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link to={section.path}>{section.label}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{meta.title}</span>
      </nav>

      <header className={`page-head page-head--${meta.category}`}>
        <span className="page-head__emoji" aria-hidden="true">{meta.emoji}</span>
        <div>
          <span className={`chip chip--${meta.category}`}>{section.label}</span>
          <h1 className="work-head__title">{meta.title}</h1>
          <p className="page-head__desc">{meta.description}</p>
          <Link to={`/members/${member.meta.slug}`} className="work-head__author">
            <span aria-hidden="true">{member.meta.emoji}</span> {member.meta.name} さんの作品 →
          </Link>
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
