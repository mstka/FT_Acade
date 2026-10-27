import { useCallback, useEffect, useState } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';

// ビジュアライザー本体は tools/git-visualizer にあるローカル専用ツール。
// npm run dev のときは vite.config.ts が自動で起動するので、ここではそれを埋め込むだけ。
const VISUALIZER_URL = 'http://localhost:4321/';
const IS_LOCAL_DEV = import.meta.env.DEV;

type Status = 'checking' | 'ready' | 'offline';

async function isRunning(): Promise<boolean> {
  try {
    // 別ポートなので中身は読めないが、つながるかどうかは分かる
    await fetch(VISUALIZER_URL, { mode: 'no-cors', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

function LocalOnly() {
  return (
    <div className="local-only">
      <span className="local-only__emoji" aria-hidden="true">💻</span>
      <h1 className="local-only__title">Git ビジュアライザーはローカル専用です</h1>
      <p>
        この機能は、あなたの PC にあるリポジトリ (<code>.git</code>) を読んでブランチの状態を図にします。
        公開されたサイトからは使えません。
      </p>
      <ol className="local-only__steps">
        <li>自分の PC で FT_Acade のフォルダを開く</li>
        <li><code>npm run dev</code> を実行する</li>
        <li><code>http://localhost:5173/#/git</code> を開く</li>
      </ol>
      <p className="muted">
        Claude Code に「ビジュアライザーを起動して」と頼んだり、<code>npm run visualizer</code> で単体起動したりもできます。
      </p>
    </div>
  );
}

function Embedded() {
  const [status, setStatus] = useState<Status>('checking');

  const check = useCallback(() => {
    isRunning().then((ok) => setStatus(ok ? 'ready' : 'offline'));
  }, []);

  useEffect(check, [check]);

  const retry = () => {
    setStatus('checking');
    check();
  };

  if (status === 'checking') return <p className="muted">ビジュアライザーに接続しています…</p>;
  if (status === 'offline') {
    return (
      <div className="local-only">
        <span className="local-only__emoji" aria-hidden="true">🔌</span>
        <h1 className="local-only__title">ビジュアライザーが起動していません</h1>
        <p>
          ターミナルで <code>npm run visualizer</code> を実行してから、もう一度試してください。
          (<code>npm run dev</code> を起動し直しても自動で立ち上がります)
        </p>
        <button type="button" className="btn btn--primary" onClick={retry}>もう一度試す</button>
      </div>
    );
  }
  return (
    <div className="git-frame">
      <div className="git-frame__bar">
        <span className="chip chip--muted">ローカル専用</span>
        <span className="muted">あなたの PC のブランチ状態をリアルタイムに表示しています</span>
        <a href={VISUALIZER_URL} target="_blank" rel="noopener noreferrer">別タブで開く ↗</a>
      </div>
      <iframe className="git-frame__view" src={VISUALIZER_URL} title="Git ビジュアライザー" />
    </div>
  );
}

export default function GitVisualizerPage() {
  useDocumentTitle('Git ビジュアライザー');
  return <div className="page">{IS_LOCAL_DEV ? <Embedded /> : <LocalOnly />}</div>;
}
