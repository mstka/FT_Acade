// =====================================================================
// ゲーム・ツール (作品) を作るためのお手本です。このフォルダ自体はサイトには表示されません。
//
// 使い方:
//   1. この example フォルダをまるごとコピーして、置き場所で表示先を選ぶ
//        ゲーム・診断 → src/contributions/arcade/<作品の slug>/
//        便利ツール   → src/contributions/tools/<作品の slug>/
//      作品の slug はほかの人とかぶらないよう「自分の名前-作品名」にする (例: tanaka-renda)
//   2. 下の meta.slug をフォルダ名と同じにする   ← ここを忘れると表示されません
//   3. title / description / emoji を書きかえて、下の画面を自由に作る
//
// URL は /#/arcade/<slug> または /#/tools/<slug> になります。作者の登録は不要です。
// 共通のファイル (App.tsx など) を書きかえる必要はありません。
// =====================================================================
import { useState } from 'react';
import type { WorkMeta } from '../../../types/contribution';
import styles from './style.module.css';

export const meta: WorkMeta = {
  slug: 'example', // ← フォルダ名と同じにする (半角英小文字・数字・ハイフン)
  title: '今日のおみくじ', // ← 作品名
  description: 'ボタンを押すと今日の運勢がわかります。', // ← 1〜2 文の説明
  emoji: '🎴', // ← カードに出る絵文字
  addedAt: '2026-10-28', // ← 追加した日 (新着の並び順に使う)
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
