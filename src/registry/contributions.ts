import type { ComponentType } from 'react';
import type { MemberMeta, WorkCategory, WorkMeta } from '../types/contribution';

export interface Member {
  meta: MemberMeta;
  Profile: ComponentType;
}

export interface Work {
  category: WorkCategory;
  meta: WorkMeta;
  Component: ComponentType;
  path: string; // /arcade/<slug> または /tools/<slug>
}

export interface RegistryIssue {
  file: string;
  problems: string[];
}

// フォルダを置くだけで自動で読み込む。
// Vite の制約で、ここのパスは変数を使わず文字列リテラルで書く必要がある。
// (除外パターン "!..." は使わない。テンプレートは対象外の src/templates/ に置いている)
const memberModules = import.meta.glob('../contributions/members/*/index.tsx', { eager: true });
const workModules: Record<WorkCategory, Record<string, unknown>> = {
  arcade: import.meta.glob('../contributions/arcade/*/index.tsx', { eager: true }),
  tools: import.meta.glob('../contributions/tools/*/index.tsx', { eager: true }),
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** meta と default export を取り出し、フォルダ名との一致と必須項目を確かめる */
function read<M>(section: string, path: string, mod: unknown, required: readonly string[]) {
  const slug = path.split('/').at(-2) ?? '';
  const file = `src/contributions/${section}/${slug}/index.tsx`;
  const problems: string[] = [];
  const m = mod as { meta?: Record<string, unknown>; default?: unknown };

  if (!m.meta || typeof m.meta !== 'object') problems.push('`export const meta = { ... }` が見つかりません');
  if (typeof m.default !== 'function') problems.push('`export default function ...` (画面のコンポーネント) が見つかりません');
  if (m.meta && typeof m.meta === 'object') {
    if (m.meta.slug !== slug) problems.push(`meta.slug ("${String(m.meta.slug)}") をフォルダ名 ("${slug}") と同じにしてください`);
    if (!SLUG_PATTERN.test(slug)) problems.push('フォルダ名は半角の英小文字・数字・ハイフンだけにしてください (例: tanaka, tanaka-renda)');
    for (const key of required) {
      const value = m.meta[key];
      if (typeof value !== 'string' || !value.trim()) problems.push(`meta.${key} を入力してください`);
    }
  }
  if (problems.length) return { ok: false as const, issue: { file, problems } };
  return { ok: true as const, slug, meta: m.meta as unknown as M, Component: m.default as ComponentType };
}

function load() {
  const issues: RegistryIssue[] = [];

  const members: Member[] = [];
  for (const [path, mod] of Object.entries(memberModules)) {
    const r = read<MemberMeta>('members', path, mod, ['name', 'emoji', 'tagline']);
    if (!r.ok) issues.push(r.issue);
    else members.push({ meta: r.meta, Profile: r.Component });
  }

  const works: Work[] = [];
  for (const category of ['arcade', 'tools'] as const) {
    for (const [path, mod] of Object.entries(workModules[category])) {
      const r = read<WorkMeta>(category, path, mod, ['title', 'description', 'emoji']);
      if (!r.ok) issues.push(r.issue);
      else works.push({ category, meta: r.meta, Component: r.Component, path: `/${category}/${r.slug}` });
    }
  }

  // サンプルは後ろ。メンバーは名前順、作品はタイトル順
  const sampleLast = (a?: boolean, b?: boolean) => Number(Boolean(a)) - Number(Boolean(b));
  members.sort((a, b) => sampleLast(a.meta.sample, b.meta.sample) || a.meta.name.localeCompare(b.meta.name, 'ja'));
  works.sort((a, b) => sampleLast(a.meta.sample, b.meta.sample) || a.meta.title.localeCompare(b.meta.title, 'ja'));

  if (import.meta.env.DEV) {
    for (const issue of issues) console.warn(`[FT_Arcade] ${issue.file}: ${issue.problems.join(' / ')}`);
  }
  return { members, works, issues };
}

export const { members, works, issues: registryIssues } = load();

export function findMember(slug: string): Member | undefined {
  return members.find((m) => m.meta.slug === slug);
}

export function findWork(category: WorkCategory, slug: string): Work | undefined {
  return works.find((w) => w.category === category && w.meta.slug === slug);
}

export function worksIn(category: WorkCategory): Work[] {
  return works.filter((w) => w.category === category);
}

/** 追加日 (addedAt) が新しい順。日付がないものは後ろ */
export function latestWorks(limit: number): Work[] {
  return [...works].sort((a, b) => (b.meta.addedAt ?? '').localeCompare(a.meta.addedAt ?? '')).slice(0, limit);
}
