import type { MemberMeta } from '../../../types/contribution';
import styles from './profile.module.css';

export const meta: MemberMeta = {
  slug: 'takeo',
  name: '竹尾',
  emoji: '🤝',
  tagline: 'AI導入を一緒に進めます',
  addedAt: '2026-10-28',
};

const PROFILE = {
  hello: 'はじめまして、竹尾です。',
  likes: ['AI活用', '業務改善', 'お客様との対話'],
  facts: [
    { label: '仕事', value: '福祉事業者さま向けのAI導入支援・研修' },
    { label: 'このアプリで作りたいもの', value: '営業や日々の業務に役立つミニツール' },
  ],
  oneWord: 'みなさんと一緒に作るのを楽しみにしています！',
};

export default function Profile() {
  return (
    <div className={styles.wrap}>
      <p className={styles.hello}>{PROFILE.hello}</p>

      <h2 className={styles.heading}>関心のあること</h2>
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
