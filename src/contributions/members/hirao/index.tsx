import type { MemberMeta } from '../../../types/contribution';
import styles from './profile.module.css';

export const meta: MemberMeta = {
  slug: 'hirao',
  name: 'hirao',
  emoji: '👩‍💻',
  tagline: 'Claude Code で FT_Arcade を育てています',
  addedAt: '2026-10-28',
};

// ---- 自己紹介の中身 (自由に書きかえてOK) ----
const PROFILE = {
  hello: 'はじめまして、hiraoです。Claude Code を使ってこのプロジェクトに参加しています。',
  likes: ['Claude Code', 'プログラミング', '新しい技術'],
  facts: [
    { label: '最近ハマっていること', value: 'Claude Code での開発' },
    { label: '休日の過ごし方', value: 'のんびり過ごしています' },
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
