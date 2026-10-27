import type { ComponentType } from 'react';
import type { MemberMeta, WorkCategory, WorkMeta } from '../types/contribution';
import { WORK_CATEGORIES } from './categories';

export interface Member {
  meta: MemberMeta;
  Profile: ComponentType;
  works: Work[];
}

export interface Work {
  id: string; // works/<id>.tsx のファイル名
  meta: WorkMeta;
  Component: ComponentType;
  member: Member;
  path: string; // /members/<slug>/<id>
}

export interface RegistryIssue {
  file: string;
  problems: string[];
}

// src/contributions/<slug>/index.tsx と works/*.tsx を自動で読み込む。
// Vite の制約で、ここのパスは変数を使わず文字列リテラルで書く必要がある。
// (除外パターン "!..." を使うと、npm run dev 中に追加したフォルダが反映されなくなるので使わない。
//  テンプレートは対象外の src/templates/member/ に置いている)
const profileModules = import.meta.glob('../contributions/*/index.tsx', { eager: true });
const workModules = import.meta.glob('../contributions/*/works/*.tsx', { eager: true });

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_RULE = '半角の英小文字・数字・ハイフンだけにしてください (例: tanaka, sato-hanako)';

function checkText(meta: Record<string, unknown>, keys: readonly string[], problems: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value !== 'string' || !value.trim()) problems.push(`meta.${key} を入力してください`);
  }
}

function readModule(mod: unknown, problems: string[]) {
  const m = mod as { meta?: unknown; default?: unknown };
  if (!m.meta || typeof m.meta !== 'object') problems.push('`export const meta = { ... }` が見つかりません');
  if (typeof m.default !== 'function') problems.push('`export default function ...` (画面のコンポーネント) が見つかりません');
  return problems.length ? null : { meta: m.meta as Record<string, unknown>, Component: m.default as ComponentType };
}

function load() {
  const issues: RegistryIssue[] = [];
  const members = new Map<string, Member>();

  for (const [path, mod] of Object.entries(profileModules)) {
    const slug = path.split('/').at(-2) ?? '';
    const file = `src/contributions/${slug}/index.tsx`;
    const problems: string[] = [];
    const read = readModule(mod, problems);
    if (read) {
      if (read.meta.slug !== slug) problems.push(`meta.slug ("${String(read.meta.slug)}") をフォルダ名 ("${slug}") と同じにしてください`);
      if (!NAME_PATTERN.test(slug)) problems.push(`フォルダ名 (slug) は${NAME_RULE}`);
      checkText(read.meta, ['name', 'emoji', 'tagline'], problems);
    }
    if (!read || problems.length) {
      issues.push({ file, problems });
      continue;
    }
    members.set(slug, { meta: read.meta as unknown as MemberMeta, Profile: read.Component, works: [] });
  }

  const works: Work[] = [];
  for (const [path, mod] of Object.entries(workModules)) {
    const parts = path.split('/');
    const slug = parts.at(-3) ?? '';
    const id = (parts.at(-1) ?? '').replace(/\.tsx$/, '');
    const file = `src/contributions/${slug}/works/${id}.tsx`;
    const problems: string[] = [];
    const member = members.get(slug);
    if (!member) problems.push(`先に自己紹介ページ src/contributions/${slug}/index.tsx を正しく作ってください`);
    if (!NAME_PATTERN.test(id)) problems.push(`ファイル名は${NAME_RULE}`);
    const read = readModule(mod, problems);
    if (read) {
      if (!(WORK_CATEGORIES as readonly string[]).includes(String(read.meta.category))) {
        problems.push(`meta.category は ${WORK_CATEGORIES.map((c) => `"${c}"`).join(' か ')} にしてください`);
      }
      checkText(read.meta, ['title', 'description', 'emoji'], problems);
    }
    if (!member || !read || problems.length) {
      issues.push({ file, problems });
      continue;
    }
    const work: Work = { id, meta: read.meta as unknown as WorkMeta, Component: read.Component, member, path: `/members/${slug}/${id}` };
    member.works.push(work);
    works.push(work);
  }

  // サンプルは後ろ、あとは名前順。作品はカテゴリ→タイトル順
  const memberList = [...members.values()].sort(
    (a, b) => Number(Boolean(a.meta.sample)) - Number(Boolean(b.meta.sample)) || a.meta.name.localeCompare(b.meta.name, 'ja'),
  );
  const order = (c: WorkCategory) => WORK_CATEGORIES.indexOf(c);
  const byWork = (a: Work, b: Work) => order(a.meta.category) - order(b.meta.category) || a.meta.title.localeCompare(b.meta.title, 'ja');
  works.sort(byWork);
  for (const m of memberList) m.works.sort(byWork);

  if (import.meta.env.DEV) {
    for (const issue of issues) console.warn(`[FT_Acade] ${issue.file}: ${issue.problems.join(' / ')}`);
  }
  return { members: memberList, works, issues };
}

export const { members, works, issues: registryIssues } = load();

export function findMember(slug: string): Member | undefined {
  return members.find((m) => m.meta.slug === slug);
}

export function findWork(slug: string, id: string): Work | undefined {
  return findMember(slug)?.works.find((w) => w.id === id);
}

export function worksIn(category: WorkCategory): Work[] {
  return works.filter((w) => w.meta.category === category);
}

/** 追加日 (addedAt) が新しい順。日付がないものは後ろ */
export function latestWorks(limit: number): Work[] {
  return [...works].sort((a, b) => (b.meta.addedAt ?? '').localeCompare(a.meta.addedAt ?? '')).slice(0, limit);
}
