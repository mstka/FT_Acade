// =====================================================================
// 作品のお手本です。works/ フォルダの中の 1 ファイルが 1 つの作品になります。
//
//   - ファイル名がそのまま URL になります: works/omikuji.tsx → /members/<slug>/omikuji
//     (ファイル名は半角英小文字・数字・ハイフンだけ)
//   - meta.category を 'arcade' にすると Arcade に、'tools' にすると Tools に並びます
//   - 作品はいくつ置いてもOK。ファイルを増やすだけで一覧に増えます
// =====================================================================
import { useState } from 'react';
import type { WorkMeta } from '../../../types/contribution';
import styles from './omikuji.module.css';

export const meta: WorkMeta = {
  category: 'arcade', // ← 'arcade' か 'tools'
  title: '今日のおみくじ', // ← 作品名
  description: 'ボタンを押すと今日の運勢がわかります。', // ← 1〜2 文の説明
  emoji: '🎴', // ← カードに出る絵文字
  addedAt: '2026-10-28', // ← 追加した日
};

const FORTUNES = ['🌟 大吉: 今日は何をやってもうまくいく！', '😊 中吉: いいことがありそう', '🙂 小吉: コツコツいこう', '🍀 末吉: 小さな幸せを見つけよう'];

export default function Omikuji() {
  const [fortune, setFortune] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const draw = () => {
    setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
    setCount((c) => c + 1);
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.fortune} aria-live="polite">{fortune ?? 'ボタンを押して引いてみよう'}</p>
      <button type="button" className="btn btn--primary" onClick={draw}>おみくじを引く</button>
      <p className={styles.count}>引いた回数: {count} 回</p>
    </div>
  );
}
