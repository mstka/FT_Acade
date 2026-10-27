import type { ComponentType } from 'react';

/**
 * 置き場所で表示先が決まる:
 *   src/contributions/members/<slug>/index.tsx … 自己紹介 (Who's Who)
 *   src/contributions/arcade/<slug>/index.tsx  … ゲーム・診断 (Arcade)
 *   src/contributions/tools/<slug>/index.tsx   … 便利ツール (Tools)
 * 自己紹介と作品はそれぞれ独立していて、作品に作者を登録する必要はない。
 */

export type WorkCategory = 'arcade' | 'tools';

/** src/contributions/members/<slug>/index.tsx の meta */
export interface MemberMeta {
  slug: string; // URL とフォルダ名に一致させる。例: tanaka
  name: string; // 表示名 (公開してよい名前のみ)
  emoji: string; // カードとページのアイコン
  tagline: string; // ひとこと (一覧のカードに出る)
  addedAt?: string; // 追加した日 (YYYY-MM-DD)
  sample?: boolean; // 教材用のサンプルなら true
}

/** src/contributions/arcade/<slug>/index.tsx と tools/<slug>/index.tsx の meta */
export interface WorkMeta {
  slug: string; // URL とフォルダ名に一致させる。例: tanaka-renda
  title: string; // 作品名
  description: string; // 1〜2 文の説明
  emoji: string; // カードに出す絵文字
  addedAt?: string; // 追加した日 (YYYY-MM-DD)。ホームの「新着」の並び順に使う
  sample?: boolean; // 教材用のサンプルなら true
}

export interface MemberModule {
  meta: MemberMeta;
  default: ComponentType;
}

export interface WorkModule {
  meta: WorkMeta;
  default: ComponentType;
}
