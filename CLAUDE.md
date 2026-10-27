# FT_Acade — Claude Code 向けガイド

For Two の勉強会で、参加者みんなが 1 つのリポジトリに機能を持ち寄って育てる Web アプリです。
React + TypeScript + Vite + React Router (HashRouter)。仕様は [SPEC.md](SPEC.md)、参加者向けの説明は [README.md](README.md) と [CONTRIBUTING.md](CONTRIBUTING.md)。
GitHub: https://github.com/mstka/FT_Acade

## 一緒に作業する人について

- 参加者の多くは Git / 開発の初心者です。専門用語は短く言い換え、何をするのか・なぜするのかを一言添えてください。
- git や npm のコマンドを実行・提案するときは、そのコマンドが何をするかを日本語で一行説明してください。
- 説明は日本語で行ってください。

## 変更してよい範囲 【最重要】

- **参加者のために作業するときは、`src/contributions/<その人の slug>/` の中だけを変更してください。**
- `src/App.tsx`・`src/registry/`・`src/components/`・`src/pages/`・`src/types/`・`src/styles/`・`package.json`・`package-lock.json`・設定ファイル (`vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `vercel.json`, `.github/`) は、ユーザーが「講師として共通部分を変更する」と明言したときだけ変更してください。
- 新しい npm パッケージを追加しないでください (`package-lock.json` が衝突の原因になります)。必要そうなら、まず講師に相談するようユーザーに伝えてください。
- 自分のページは `src/contributions/<slug>/index.tsx` を置くだけで、専用ページ・カテゴリ一覧・ホームの新着に自動で並びます。共通ファイルへの登録は不要です。

## 自分のページ (contribution) の作り方

- お手本は `src/contributions/example-member/`。フォルダごとコピーして `<slug>` に名前を変える。
- `index.tsx` は `export const meta: ContributionMeta` と `export default function` (ページのコンポーネント) の 2 つを必ず export する。
- `meta.slug` はフォルダ名と同じ。半角英小文字・数字・ハイフンのみ。
- `meta.category` は `'arcade'` / `'who-is-who'` / `'tools'` のどれか。
- スタイルは同じフォルダの `style.module.css` (CSS Modules) に書く。共通の色などは `var(--pink)` などの CSS 変数を使ってよい。
- 共通部品として使ってよい class: `btn`, `btn--primary`, `muted`, `chip`。
- 実在の人物の個人情報、パスワード、API キー、社外秘の情報、外部の有料 API は使わない。データは架空のものにする。
- localStorage を使うときはキーを `ft-acade:<slug>:...` にし、try / catch で囲む。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm ci` | 依存パッケージを入れる (lockfile どおり) |
| `npm run dev` | 開発サーバー http://localhost:5173/ (バックグラウンドで起動する) |
| `npm run build` | 型チェック + ビルド。commit 前に必ず成功させる |
| `npm run typecheck` / `npm run lint` | 型チェック / ESLint |
| `npm run visualizer` | Git ビジュアライザー http://localhost:4321 |

変更後は `npm run build` と `npm run lint` が通ることを確認してから完了を報告してください。

## Git の運用ルール

1. **`main` に直接 commit / push しない。** ブランチ名は `feature/<slug>`。
2. 作業を始める前に `git switch main` → `git pull` で最新にする。
3. commit は小さく、メッセージは日本語で「何をしたか」を書く。`git add` は自分のフォルダを指定する (`git add src/contributions/<slug>`)。
4. push は自分のブランチだけ: `git push -u origin feature/<slug>`。`main` への取り込みは Pull Request で行う。
5. 次の操作はユーザーに確認してから: `git push`、PR の作成、`git push --force`、`git reset --hard`、ブランチの削除、他人のブランチへの push、`npx vercel --prod`。
6. コンフリクト (競合) が起きたら、どのファイルのどこがぶつかっているかを説明し、どちらを残すかユーザーと相談してから解決する。

## 環境変数

- `VITE_APP_OWNER` (公開者名) / `VITE_APP_STAGE` (環境ラベル) / `VITE_API_BASE_URL` ([L3] 空ならモック) はブラウザに埋め込まれ、誰でも見られる。秘密を入れない。
- `GAS_WEB_APP_URL` / `GAS_SHARED_TOKEN` は Vercel Function (`api/`) だけで使う。`VITE_` を付けない。
- Vercel で環境変数を変えたら再デプロイが必要。

## Git ビジュアライザー

ブランチの状態 (自分の PC と GitHub のつながり、push / pull 待ち、未コミットの変更) をブラウザで図示する、ローカル専用の補助ツール (`tools/git-visualizer/`)。頼まれない限り変更しない。

- `npm run dev` のとき `vite.config.ts` のプラグインが自動で起動し、アプリの `/#/git` に埋め込まれる (`src/pages/GitVisualizerPage.tsx`)。
- 本番ビルド (Vercel) では `/#/git` は「ローカル専用です」の案内だけを表示し、ビジュアライザーのコードは含まれない。Vercel 上で動かそうとしないこと。
- 「ビジュアライザーを起動して」などと頼まれたら `git-visualizer` スキルの手順で起動する。開発サーバーが動いていれば http://localhost:5173/#/git を案内すればよい。
