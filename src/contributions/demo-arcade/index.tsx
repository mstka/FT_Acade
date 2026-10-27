import { useEffect, useRef, useState } from 'react';
import type { ContributionMeta } from '../../types/contribution';
import styles from './style.module.css';

export const meta: ContributionMeta = {
  slug: 'demo-arcade',
  name: 'FT_Acade サンプル',
  category: 'arcade',
  title: '反射神経ゲーム',
  description: '合図が出たらすぐボタンを押そう。反応までの時間をミリ秒で計ります。',
  emoji: '⚡',
  addedAt: '2026-10-27',
};

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'early';

const BEST_KEY = 'ft-acade:demo-arcade:best';

function loadBest(): number | null {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function rank(ms: number) {
  if (ms < 200) return '🏆 超人級！';
  if (ms < 260) return '🚀 かなり速い！';
  if (ms < 330) return '👍 いい反応！';
  return '🐢 もう一回いってみよう';
}

export default function DemoArcade() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [time, setTime] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(loadBest);
  const timer = useRef<number | undefined>(undefined);
  const shownAt = useRef(0);

  // ページを離れたらタイマーを止める
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = () => {
    setTime(null);
    setPhase('waiting');
    const delay = 1500 + Math.random() * 2500; // 1.5〜4 秒のランダム
    timer.current = window.setTimeout(() => {
      shownAt.current = performance.now();
      setPhase('ready');
    }, delay);
  };

  const press = () => {
    if (phase === 'waiting') {
      window.clearTimeout(timer.current);
      setPhase('early');
      return;
    }
    if (phase !== 'ready') return;
    const ms = Math.round(performance.now() - shownAt.current);
    setTime(ms);
    setPhase('result');
    if (best === null || ms < best) {
      setBest(ms);
      try {
        localStorage.setItem(BEST_KEY, String(ms));
      } catch {
        // 保存できなくてもゲームは続けられる
      }
    }
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setPhase('idle');
    setTime(null);
    setBest(null);
    try {
      localStorage.removeItem(BEST_KEY);
    } catch {
      // 何もしない
    }
  };

  const playing = phase === 'waiting' || phase === 'ready';

  return (
    <div className={styles.wrap}>
      <p className={styles.howto}>「スタート」を押して、画面が <strong>緑の「今！」</strong> に変わった瞬間にタップ (またはスペースキー) してください。</p>

      <button
        type="button"
        className={`${styles.pad} ${styles[phase]}`}
        onClick={playing ? press : start}
        aria-live="polite"
      >
        {phase === 'idle' && <span>▶ スタート</span>}
        {phase === 'waiting' && <span>…まだだよ…</span>}
        {phase === 'ready' && <span className={styles.now}>今！</span>}
        {phase === 'result' && (
          <span>
            <span className={styles.ms}>{time} ms</span>
            <span className={styles.rank}>{time !== null && rank(time)}</span>
            <span className={styles.again}>タップでもう一回</span>
          </span>
        )}
        {phase === 'early' && (
          <span>
            <span className={styles.ms}>フライング！</span>
            <span className={styles.again}>タップでやり直し</span>
          </span>
        )}
      </button>

      <div className={styles.footer}>
        <span>ベスト: <strong>{best !== null ? `${best} ms` : '—'}</strong></span>
        <button type="button" className="btn" onClick={reset}>リセット</button>
      </div>
    </div>
  );
}
