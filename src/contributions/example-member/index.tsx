// =====================================================================
// 自分のページを作るためのお手本 (テンプレート) です。
//
// 使い方:
//   1. このフォルダ (example-member) をまるごとコピーして、
//      src/contributions/<自分の slug>/ という名前にする  (例: src/contributions/tanaka/)
//   2. 下の meta の slug をフォルダ名と同じにする   ← ここを忘れるとページが表示されません
//   3. name / title / description / emoji / category を自分用に書きかえる
//   4. 下の ExampleMemberPage の中身を自由に作りかえる
//
// 共通のファイル (App.tsx など) を書きかえる必要はありません。
// =====================================================================
import { useState } from 'react';
import type { ContributionMeta } from '../../types/contribution';
import styles from './style.module.css';

export const meta: ContributionMeta = {
  slug: 'example-member', // ← フォルダ名と同じにする (半角英小文字・数字・ハイフン)
  name: 'サンプルメンバー', // ← 画面に出る名前 (公開してよい名前だけ)
  category: 'who-is-who', // ← 'arcade' / 'who-is-who' / 'tools' のどれか
  title: 'サンプル: 自己紹介＋おみくじ', // ← 作った機能の名前
  description: '自分のページを作るときのお手本です。このフォルダをコピーして始めましょう。',
  emoji: '🙋', // ← カードに出す絵文字
  addedAt: '2026-10-27', // ← 追加した日 (新着の並び順に使う)
};

// ---- 自己紹介 (書きかえてOK) ----
const PROFILE = {
  hello: 'はじめまして！FT_Acade のサンプルメンバーです。',
  likes: ['コーヒー', 'ボードゲーム', '散歩'],
  oneWord: 'みんなで作るのを楽しみにしています！',
};

// ---- ちょっとした機能: おみくじ (書きかえてOK) ----
const FORTUNES = ['🌟 大吉: 今日は何をやってもうまくいく！', '😊 中吉: いいことがありそう', '🙂 小吉: コツコツいこう', '🍀 末吉: 小さな幸せを見つけよう'];

export default function ExampleMemberPage() {
  const [fortune, setFortune] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const draw = () => {
    setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
    setCount((c) => c + 1);
  };

  return (
    <div className={styles.wrap}>
      <section className={styles.profile}>
        <h2 className={styles.heading}>自己紹介</h2>
        <p>{PROFILE.hello}</p>
        <p className={styles.sub}>好きなもの</p>
        <ul className={styles.likes}>
          {PROFILE.likes.map((like) => (
            <li key={like}>{like}</li>
          ))}
        </ul>
        <p className={styles.sub}>ひとこと</p>
        <p>{PROFILE.oneWord}</p>
      </section>

      <section className={styles.game}>
        <h2 className={styles.heading}>今日のおみくじ</h2>
        <p className={styles.fortune} aria-live="polite">{fortune ?? 'ボタンを押して引いてみよう'}</p>
        <button type="button" className="btn btn--primary" onClick={draw}>おみくじを引く</button>
        <p className={styles.count}>引いた回数: {count} 回</p>
      </section>
    </div>
  );
}
