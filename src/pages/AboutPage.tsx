import { useCallback, useEffect, useState } from 'react';
import { APP_OWNER, APP_STAGE, OWNER_IS_SET, STAGE_IS_SET } from '../config/env';
import { getHealth, getScores, IS_MOCK, type Health, type Score } from '../lib/backend';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const FLOW = [
  { cmd: 'git switch -c feature/<slug>', text: '自分用のブランチを作る' },
  { cmd: 'src/contributions/<slug>/', text: '自分のフォルダに自己紹介と作品を追加する' },
  { cmd: 'npm run build', text: 'エラーが無いか確かめる' },
  { cmd: 'git add . / git commit', text: '変更を記録する' },
  { cmd: 'git push -u origin feature/<slug>', text: 'GitHub に送る' },
  { cmd: 'Pull Request', text: 'レビューしてもらって main に取り込む' },
];

type Load<T> = { state: 'loading' } | { state: 'done'; data: T } | { state: 'error'; message: string };

function ApiCheck() {
  const [health, setHealth] = useState<Load<Health>>({ state: 'loading' });
  const [scores, setScores] = useState<Load<Score[]>>({ state: 'loading' });

  const load = useCallback(() => {
    getHealth()
      .then((data) => setHealth({ state: 'done', data }))
      .catch((e: Error) => setHealth({ state: 'error', message: e.message }));
    getScores()
      .then((data) => setScores({ state: 'done', data }))
      .catch((e: Error) => setScores({ state: 'error', message: e.message }));
  }, []);

  useEffect(load, [load]);

  const retry = () => {
    setHealth({ state: 'loading' });
    setScores({ state: 'loading' });
    load();
  };

  return (
    <div className="api-check">
      <div className="api-check__row">
        <span className={`chip ${IS_MOCK ? 'chip--muted' : 'chip--tools'}`}>{IS_MOCK ? 'モック' : 'API 接続'}</span>
        <span aria-live="polite">
          {health.state === 'loading' && '確認中…'}
          {health.state === 'done' && (health.data.ok ? `✅ ${health.data.message}` : `⚠️ ${health.data.message}`)}
          {health.state === 'error' && `⚠️ ${health.message}`}
        </span>
      </div>
      {scores.state === 'done' && (
        <ol className="api-check__scores">
          {scores.data.map((s) => (
            <li key={`${s.name}-${s.score}`}>
              <span>{s.name}</span>
              <span className="muted">{s.game}</span>
              <strong>{s.score} ms</strong>
            </li>
          ))}
        </ol>
      )}
      {scores.state === 'error' && (
        <p className="api-check__error">スコアを取得できませんでした: {scores.message}。ほかの画面はそのまま使えます。</p>
      )}
      {(health.state === 'error' || scores.state === 'error') && (
        <button type="button" className="btn" onClick={retry}>もう一度試す</button>
      )}
    </div>
  );
}

export default function AboutPage() {
  useDocumentTitle('About');
  return (
    <div className="page prose">
      <h1>About FT_Acade</h1>
      <p>
        FT_Acade は、For Two の勉強会で参加者みんなが <strong>1 つの GitHub リポジトリ</strong> に機能を持ち寄って育てる Web アプリです。
        Arcade (ミニゲーム)・Who&apos;s Who (メンバー紹介)・Tools (便利ツール) の 3 つのカテゴリがあります。
      </p>

      <h2>みんなで開発するしくみ</h2>
      <p>
        参加者は 1 人 1 つのフォルダ <code>src/contributions/&lt;自分の slug&gt;/</code> を持ちます。
        <code>index.tsx</code> を置くと Who&apos;s Who に自分のカードと専用ページができ、
        <code>works/</code> に作品を置くと Arcade や Tools の一覧に並びます。
        共通のファイルを書き換える必要はなく、それぞれ自分のフォルダだけを触るので、同時に作業してもぶつかりません。
      </p>
      <ol className="flow">
        {FLOW.map((f) => (
          <li key={f.cmd}>
            <code>{f.cmd}</code>
            <span>{f.text}</span>
          </li>
        ))}
      </ol>

      <h2>環境変数</h2>
      <p>Vercel の設定画面で値を入れて <strong>再デプロイ</strong> すると、画面右上の表示が変わります。</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>変数</th><th>用途</th><th>いまの値</th></tr>
          </thead>
          <tbody>
            <tr><td><code>VITE_APP_OWNER</code></td><td>公開者の表示名</td><td>{OWNER_IS_SET ? APP_OWNER : `未設定 (${APP_OWNER})`}</td></tr>
            <tr><td><code>VITE_APP_STAGE</code></td><td>環境ラベル (local / preview / production)</td><td>{STAGE_IS_SET ? APP_STAGE : `未設定 (${APP_STAGE})`}</td></tr>
            <tr><td><code>VITE_API_BASE_URL</code></td><td>[L3] API の接続先</td><td>{IS_MOCK ? '未設定 (モック)' : '設定済み'}</td></tr>
            <tr><td><code>GAS_WEB_APP_URL</code></td><td>[L3] GAS の URL (サーバー側だけ)</td><td>ブラウザには渡さない</td></tr>
          </tbody>
        </table>
      </div>
      <p className="note">
        <code>VITE_</code> で始まる値はブラウザから誰でも見られます。パスワード・API キー・個人情報は入れないでください。
      </p>

      <h2>API 接続テスト (L3 発展)</h2>
      <p>
        バックエンドとつながっているかを確認できます。<code>VITE_API_BASE_URL</code> が空のときはダミーデータを表示します。
      </p>
      <ApiCheck />
    </div>
  );
}
