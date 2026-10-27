import type { ComponentType } from 'react';

export type ContributionCategory = 'arcade' | 'who-is-who' | 'tools';

export interface ContributionMeta {
  slug: string; // URL とフォルダ名に一致させる。例: tanaka
  name: string; // 表示名 (公開してよい名前のみ)
  category: ContributionCategory;
  title: string; // 作った機能の名前
  description: string; // 1〜2 文の説明
  emoji: string; // カードに出す絵文字
  addedAt?: string; // 追加した日 (YYYY-MM-DD)。ホームの「新着」の並び順に使う
}

export interface ContributionModule {
  meta: ContributionMeta;
  default: ComponentType;
}
