import type { WorkCategory } from '../types/contribution';

export type SectionId = WorkCategory | 'who-is-who';

export interface SectionInfo {
  id: SectionId;
  path: string;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
}

/** メニューとホームに並ぶ 3 つのセクション */
export const SECTIONS: readonly SectionInfo[] = [
  {
    id: 'arcade',
    path: '/arcade',
    label: 'Arcade',
    emoji: '🕹️',
    tagline: 'ミニゲーム・診断',
    description: 'みんなが作ったミニゲームや診断。スコアを競ったり、結果を見せ合ったり。',
  },
  {
    id: 'who-is-who',
    path: '/who-is-who',
    label: "Who's Who",
    emoji: '🪪',
    tagline: 'メンバー紹介',
    description: 'メンバーひとりひとりの自己紹介ページ。カードを押すと、その人の専用ページに移ります。',
  },
  {
    id: 'tools',
    path: '/tools',
    label: 'Tools',
    emoji: '🧰',
    tagline: '業務効率化ミニツール',
    description: '毎日の仕事がちょっと楽になる、小さな便利ツール。',
  },
];

export function getSection(id: SectionId): SectionInfo {
  const found = SECTIONS.find((c) => c.id === id);
  if (!found) throw new Error(`unknown section: ${id}`);
  return found;
}
