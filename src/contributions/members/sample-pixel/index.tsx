import type { MemberMeta } from '../../../types/contribution';
import styles from './profile.module.css';

// 教材用の架空のメンバーです。
export const meta: MemberMeta = {
  slug: 'sample-pixel',
  name: 'ピクセル太郎',
  emoji: '🎮',
  tagline: '反応速度には自信あり。ゲーム担当のサンプルメンバー',
  addedAt: '2026-10-27',
  sample: true,
};

const PROFILE = {
  hello: 'こんにちは、ピクセル太郎です！レトロゲームが大好きで、FT_Arcade では Arcade の作品を担当しています。',
  likes: ['ドット絵', '格闘ゲーム', 'カレーパン'],
  facts: [
    { label: '最近ハマっていること', value: '反射神経ゲームで 200 ms を切ること' },
    { label: '休日の過ごし方', value: 'ゲームセンターめぐり' },
  ],
  oneWord: '「反射神経ゲーム」で僕のベスト (231 ms) を超えてみてください！',
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
