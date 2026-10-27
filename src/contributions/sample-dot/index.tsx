import type { MemberMeta } from '../../types/contribution';
import styles from './profile.module.css';

// 教材用の架空のメンバーです。
export const meta: MemberMeta = {
  slug: 'sample-dot',
  name: 'ドット花子',
  emoji: '📝',
  tagline: '文章を整えるのが得意。ツール担当のサンプルメンバー',
  addedAt: '2026-10-27',
  sample: true,
};

const PROFILE = {
  hello: 'ドット花子です。資料やメールの文章を整えるのが好きで、毎日の小さな手間を減らすツールを作っています。',
  likes: ['きれいな表', '万年筆', '抹茶ラテ'],
  facts: [
    { label: '最近ハマっていること', value: 'ショートカットキーを覚えること' },
    { label: '休日の過ごし方', value: 'カフェで読書' },
  ],
  oneWord: '「文章整形・文字数カウンター」、日報を書くときにどうぞ。',
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
