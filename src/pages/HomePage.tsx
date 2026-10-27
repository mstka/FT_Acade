import { Link } from 'react-router-dom';
import { CATEGORIES } from '../registry/categories';
import { contributionsIn, latestContributions } from '../registry/contributions';
import { APP_OWNER, OWNER_IS_SET } from '../config/env';
import FeatureCard from '../components/FeatureCard';
import EmptyState from '../components/EmptyState';
import RegistryIssues from '../components/RegistryIssues';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const STEPS = [
  { level: 'L1', title: '動かして公開する', body: 'clone → ローカルで起動 → 自分の Vercel に公開 → 環境変数で名前を表示' },
  { level: 'L2', title: '自分のページを作る', body: 'ブランチを作り src/contributions/<自分>/ を追加 → commit / push → Pull Request' },
  { level: 'L3', title: 'API とつなぐ', body: '共通のバックエンド (GAS) からデータを取得・送信する発展課題' },
];

export default function HomePage() {
  useDocumentTitle();
  const latest = latestContributions(6);

  return (
    <div className="page">
      <section className="hero">
        <p className="hero__eyebrow">For Two 勉強会 共同開発プロジェクト</p>
        <h1 className="hero__title">
          <span className="hero__logo">FT_Acade</span>
        </h1>
        <p className="hero__lead">みんなで 1 つのリポジトリに機能を持ち寄って育てる、ゲーム＆ツール集です。</p>
        <p className="hero__owner">
          {OWNER_IS_SET ? (
            <>このサイトは <strong>{APP_OWNER}</strong> さんが公開しています</>
          ) : (
            <>公開者名はまだ設定されていません (<code>VITE_APP_OWNER</code>)</>
          )}
        </p>
      </section>

      <RegistryIssues />

      <section aria-labelledby="cat-title">
        <h2 id="cat-title" className="section-title">カテゴリ</h2>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={c.path} className={`category-card category-card--${c.id}`}>
              <span className="category-card__emoji" aria-hidden="true">{c.emoji}</span>
              <span className="category-card__label">{c.label}</span>
              <span className="category-card__tagline">{c.tagline}</span>
              <span className="category-card__count">{contributionsIn(c.id).length} 件</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="new-title">
        <h2 id="new-title" className="section-title">新着</h2>
        {latest.length ? (
          <div className="feature-grid">
            {latest.map((c) => (
              <FeatureCard key={c.meta.slug} contribution={c} showCategory />
            ))}
          </div>
        ) : (
          <EmptyState title="まだ機能がありません">
            <p><code>src/contributions/&lt;slug&gt;/index.tsx</code> を追加すると、ここに表示されます。</p>
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="section-title">学習の進め方</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.level} className="step">
              <span className="step__level">{s.level}</span>
              <span className="step__title">{s.title}</span>
              <span className="step__body">{s.body}</span>
            </li>
          ))}
        </ol>
        <p className="muted">
          くわしくは <Link to="/about">About</Link> と、リポジトリの <code>README.md</code> を見てください。
        </p>
      </section>
    </div>
  );
}
