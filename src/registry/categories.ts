import type { ContributionCategory } from '../types/contribution';

export interface CategoryInfo {
  id: ContributionCategory;
  path: string;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
}

export const CATEGORIES: readonly CategoryInfo[] = [
  {
    id: 'arcade',
    path: '/arcade',
    label: 'Arcade',
    emoji: '🕹️',
    tagline: 'ミニゲーム・診断',
    description: 'サクッと遊べるミニゲームや診断コンテンツ。スコアを競ったり、結果を見せ合ったり。',
  },
  {
    id: 'who-is-who',
    path: '/who-is-who',
    label: "Who's Who",
    emoji: '🪪',
    tagline: '自己紹介・人物当てクイズ',
    description: 'メンバーの自己紹介ページや人物当てクイズ。チームのことをもっと知ろう。',
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

export function getCategory(id: ContributionCategory): CategoryInfo {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`unknown category: ${id}`);
  return found;
}
