import type { MemberMeta } from '../../types/contribution';
import styles from './profile.module.css';

// 教材用の架空のメンバーです。
export const meta: MemberMeta = {
  slug: 'sample-bit',
  name: 'ビット次郎',
  emoji: '🕵️',
  tagline: 'なぞ解きとクイズ作りが好きなサンプルメンバー',
  addedAt: '2026-10-27',
  sample: true,
};

const PROFILE = {
  hello: 'ビット次郎です。クイズやなぞ解きを作るのが好きで、架空のキャラクターを考えるのが得意です。',
  likes: ['推理小説', 'パズル', 'メロンソーダ'],
  facts: [
    { label: '最近ハマっていること', value: '架空のキャラクターのプロフィール作り' },
    { label: '休日の過ごし方', value: '謎解きイベントに参加' },
  ],
  oneWord: '「架空の人物当てクイズ」、全問正解できるかな？',
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
