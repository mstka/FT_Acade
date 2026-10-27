import { Link, useParams } from 'react-router-dom';
import { findMember } from '../registry/contributions';
import ErrorBoundary from '../components/ErrorBoundary';
import NotFoundPage from './NotFoundPage';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** /members/:slug — その人の自己紹介ページ */
export default function MemberPage() {
  const { slug = '' } = useParams();
  const member = findMember(slug);
  useDocumentTitle(member?.meta.name);

  if (!member) return <NotFoundPage />;
  const { meta, Profile } = member;

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="現在地">
        <Link to="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link to="/who-is-who">Who&apos;s Who</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{meta.name}</span>
      </nav>

      <header className="profile-head">
        <span className="profile-head__avatar" aria-hidden="true">{meta.emoji}</span>
        <div>
          {meta.sample && <span className="chip chip--muted">サンプル</span>}
          <h1 className="profile-head__name">{meta.name}</h1>
          <p className="profile-head__tagline">{meta.tagline}</p>
        </div>
      </header>

      <section className="stage" aria-label={`${meta.name} さんの自己紹介`}>
        {/* key を付けて、別の人のページに移ったらエラー状態をリセットする */}
        <ErrorBoundary key={meta.slug} label={`${meta.name} さんの自己紹介`}>
          <Profile />
        </ErrorBoundary>
      </section>

      <p>
        <Link to="/who-is-who" className="btn">← メンバー一覧へ戻る</Link>
      </p>
    </div>
  );
}
