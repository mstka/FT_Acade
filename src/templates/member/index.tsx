// =====================================================================
// 自分のページを作るためのお手本 (テンプレート) です。このフォルダ自体はサイトには表示されません。
//
// 使い方:
//   1. この src/templates/member フォルダをまるごとコピーして、
//      src/contributions/<自分の slug>/ という名前にする  (例: src/contributions/tanaka/)
//   2. 下の meta.slug をフォルダ名と同じにする   ← ここを忘れるとページが表示されません
//   3. name / emoji / tagline と、下の自己紹介の中身を自分用に書きかえる
//   4. 作品は works/ フォルダに置く (works/omikuji.tsx がお手本)
//
// このファイルが Who's Who の一覧のカードと、/members/<slug> の専用ページになります。
// 共通のファイル (App.tsx など) を書きかえる必要はありません。
// =====================================================================
import type { MemberMeta } from '../../types/contribution';
import styles from './profile.module.css';

export const meta: MemberMeta = {
  slug: 'template', // ← フォルダ名と同じにする (半角英小文字・数字・ハイフン)
  name: 'あなたの名前', // ← 画面に出る名前 (公開してよい名前だけ)
  emoji: '🙋', // ← アイコンになる絵文字
  tagline: 'ひとことで自己紹介', // ← 一覧のカードに出るひとこと
  addedAt: '2026-10-28', // ← 追加した日
};

// ---- 自己紹介の中身 (自由に書きかえてOK) ----
const PROFILE = {
  hello: 'はじめまして！ここに自己紹介を書きます。',
  likes: ['好きなもの 1', '好きなもの 2', '好きなもの 3'],
  facts: [
    { label: '最近ハマっていること', value: 'ここに書く' },
    { label: '休日の過ごし方', value: 'ここに書く' },
  ],
  oneWord: 'みんなで作るのを楽しみにしています！',
};

export default function Profile() {
  return (
    <div className={styles.wrap}>
      <p className={styles.hello}>{PROFILE.hello}</p>

      <h2 className={styles.heading}>好きなもの</h2>
      <ul className={styles.likes}>
        {PROFILE.likes.map((like) => (
          <li key={like}>{like}</li>
        ))}
      </ul>

      <dl className={styles.facts}>
        {PROFILE.facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className={styles.heading}>ひとこと</h2>
      <p>{PROFILE.oneWord}</p>
    </div>
  );
}
