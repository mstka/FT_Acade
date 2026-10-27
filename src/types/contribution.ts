import type { ComponentType } from 'react';

/**
 * 1 人に 1 つのフォルダ: src/contributions/<slug>/
 *   index.tsx          … その人の自己紹介ページ (Who's Who の一覧にカードで並ぶ)
 *   works/<作品名>.tsx  … その人が作った作品 (Arcade / Tools の一覧に並ぶ)。いくつでも置ける
 */

/** 作品を並べるカテゴリ。Who's Who はメンバーの一覧なので、作品のカテゴリには含めない */
export type WorkCategory = 'arcade' | 'tools';

/** src/contributions/<slug>/index.tsx の meta */
export interface MemberMeta {
  slug: string; // URL とフォルダ名に一致させる。例: tanaka
  name: string; // 表示名 (公開してよい名前のみ)
  emoji: string; // カードとページのアイコン
  tagline: string; // ひとこと (一覧のカードに出る)
  addedAt?: string; // 追加した日 (YYYY-MM-DD)。並び順に使う
  sample?: boolean; // 教材用のサンプルなら true
}

/** src/contributions/<slug>/works/<作品名>.tsx の meta。作品の URL はファイル名から決まる */
export interface WorkMeta {
  category: WorkCategory;
  title: string; // 作品名
  description: string; // 1〜2 文の説明
  emoji: string; // カードに出す絵文字
  addedAt?: string; // 追加した日 (YYYY-MM-DD)。ホームの「新着」の並び順に使う
}

export interface MemberModule {
  meta: MemberMeta;
  default: ComponentType;
}

export interface WorkModule {
  meta: WorkMeta;
  default: ComponentType;
}
