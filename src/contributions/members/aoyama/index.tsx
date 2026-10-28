import type { MemberMeta } from '../../../types/contribution';
import styles from './profile.module.css';

export const meta: MemberMeta = {
  slug: 'aoyama',
  name: '青山',
  emoji: '🙋',
  tagline: 'FT_Arcade を一緒に育てていくメンバーです',
  addedAt: '2026-10-28',
};

// ---- 自己紹介の中身 (好きなものや最近のことを書き足してください) ----
const PROFILE = {
  hello: 'はじめまして、青山です。',
  oneWord: 'みんなで FT_Arcade を作っていくのを楽しみにしています。よろしくお願いします！',
};

export default function Profile() {
  return (
    <div className={styles.wrap}>
      <p className={styles.hello}>{PROFILE.hello}</p>

      <h2 className={styles.heading}>ひとこと</h2>
      <p>{PROFILE.oneWord}</p>
    </div>
  );
}
