import { getSection } from '../registry/categories';
import { members } from '../registry/contributions';
import MemberCard from '../components/MemberCard';
import EmptyState from '../components/EmptyState';
import RegistryIssues from '../components/RegistryIssues';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function WhoIsWhoPage() {
  const info = getSection('who-is-who');
  useDocumentTitle(info.label);

  return (
    <div className="page">
      <header className="page-head page-head--who-is-who">
        <span className="page-head__emoji" aria-hidden="true">{info.emoji}</span>
        <div>
          <h1 className="page-head__title">{info.label}</h1>
          <p className="page-head__tagline">{info.tagline}</p>
          <p className="page-head__desc">{info.description}</p>
        </div>
      </header>

      <RegistryIssues />

      <section aria-labelledby="members-title">
        <h2 id="members-title" className="section-title">メンバー ({members.length} 人)</h2>
        {members.length ? (
          <div className="member-grid">
            {members.map((m) => (
              <MemberCard key={m.meta.slug} member={m} />
            ))}
          </div>
        ) : (
          <EmptyState emoji="🪪" title="まだメンバーがいません">
            <p><code>src/templates/member</code> を <code>src/contributions/</code> にコピーして、自分のページを作ってみよう。</p>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
