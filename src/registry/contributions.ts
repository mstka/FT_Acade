import type { ComponentType } from 'react';
import type { ContributionCategory, ContributionMeta } from '../types/contribution';
import { CATEGORIES } from './categories';

export interface Contribution {
  meta: ContributionMeta;
  Component: ComponentType;
}

export interface RegistryIssue {
  folder: string;
  problems: string[];
}

// src/contributions/<slug>/index.tsx を自動で読み込む。
// Vite の制約で、ここのパスは変数を使わず文字列リテラルで書く必要がある。
const modules = import.meta.glob('../contributions/*/index.tsx', { eager: true });

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_IDS: readonly string[] = CATEGORIES.map((c) => c.id);
const REQUIRED_TEXT = ['name', 'title', 'description', 'emoji'] as const;

function validate(folder: string, mod: Record<string, unknown>): { contribution?: Contribution; problems: string[] } {
  const problems: string[] = [];
  const meta = mod.meta as Partial<ContributionMeta> | undefined;
  const Component = mod.default as ComponentType | undefined;

  if (!meta || typeof meta !== 'object') problems.push('`export const meta = { ... }` が見つかりません');
  if (typeof Component !== 'function') problems.push('`export default function ...` (ページのコンポーネント) が見つかりません');
  if (!meta || typeof meta !== 'object' || typeof Component !== 'function') return { problems };

  if (meta.slug !== folder) problems.push(`meta.slug ("${String(meta.slug)}") をフォルダ名 ("${folder}") と同じにしてください`);
  if (!SLUG_PATTERN.test(folder)) problems.push('フォルダ名 (slug) は半角の英小文字・数字・ハイフンだけにしてください (例: tanaka, sato-hanako)');
  if (!CATEGORY_IDS.includes(String(meta.category))) {
    problems.push(`meta.category は ${CATEGORY_IDS.map((c) => `"${c}"`).join(' / ')} のどれかにしてください`);
  }
  for (const key of REQUIRED_TEXT) {
    const value = meta[key];
    if (typeof value !== 'string' || !value.trim()) problems.push(`meta.${key} を入力してください`);
  }
  if (problems.length) return { problems };
  return { contribution: { meta: meta as ContributionMeta, Component }, problems };
}

function load() {
  const contributions: Contribution[] = [];
  const issues: RegistryIssue[] = [];
  const seen = new Set<string>();

  for (const [path, mod] of Object.entries(modules)) {
    const folder = path.split('/').at(-2) ?? path;
    const { contribution, problems } = validate(folder, mod as Record<string, unknown>);
    if (contribution && seen.has(folder.toLowerCase())) problems.push('同じ slug のフォルダがほかにもあります');
    if (!contribution || problems.length) {
      issues.push({ folder, problems });
      continue;
    }
    seen.add(folder.toLowerCase());
    contributions.push(contribution);
  }

  const order = (c: ContributionCategory) => CATEGORY_IDS.indexOf(c);
  contributions.sort(
    (a, b) =>
      order(a.meta.category) - order(b.meta.category) ||
      a.meta.title.localeCompare(b.meta.title, 'ja') ||
      a.meta.slug.localeCompare(b.meta.slug),
  );

  if (import.meta.env.DEV) {
    for (const issue of issues) console.warn(`[FT_Acade] src/contributions/${issue.folder}: ${issue.problems.join(' / ')}`);
  }
  return { contributions, issues };
}

export const { contributions, issues: registryIssues } = load();

export function findContribution(slug: string): Contribution | undefined {
  return contributions.find((c) => c.meta.slug === slug);
}

export function contributionsIn(category: ContributionCategory): Contribution[] {
  return contributions.filter((c) => c.meta.category === category);
}

/** 追加日 (addedAt) が新しい順。日付がないものは後ろに並ぶ。 */
export function latestContributions(limit: number): Contribution[] {
  return [...contributions]
    .sort((a, b) => (b.meta.addedAt ?? '').localeCompare(a.meta.addedAt ?? ''))
    .slice(0, limit);
}
