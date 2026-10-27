# 自分のページと作品を追加する方法

## しくみ: 1 人 1 フォルダ

```text
src/contributions/<自分の slug>/
├── index.tsx            ← 自己紹介。Who's Who の一覧にカードが並び、押すと専用ページになる
├── profile.module.css   ← 自己紹介の見た目
└── works/               ← 作品を置く場所 (いくつでも)
    ├── renda.tsx        ← 1 ファイル = 1 作品。Arcade か Tools の一覧に並ぶ
    └── renda.module.css ← その作品の見た目
```

| 置くもの | 表示される場所 | URL |
|---|---|---|
| `index.tsx` (自己紹介) | Who's Who の一覧のカード → あなたの専用ページ | `/#/members/<slug>` |
| `works/<作品名>.tsx` | Arcade または Tools の一覧、ホームの新着、あなたの専用ページの作品一覧 | `/#/members/<slug>/<作品名>` |

ファイルを置くだけで自動で並びます。**一覧やメニューなど共通のファイルを書きかえる必要はありません。**

## 触ってよい範囲

> **参加者が編集してよいのは `src/contributions/<自分の slug>/` の中だけです。**
>
> **ほかの人のフォルダ、テンプレート (`src/templates/`)、`src/App.tsx`・`src/registry/`・`src/components/`・`src/pages/`・`src/types/`・`src/styles/`・`package.json`・`package-lock.json`・設定ファイル (`vite.config.ts` など) は、講師の許可なく変更しないでください。**
> Claude Code に頼むときも「`src/contributions/<slug>/` の中だけを変更して」と伝えてください。

全員が自分のフォルダだけを触るので、同時に作業しても GitHub でぶつかりません (自己紹介も、Arcade や Tools の作品も同じです)。

## slug を決める

slug は URL とフォルダ名に使う、あなた専用の名前です。

- 半角の **英小文字・数字・ハイフン** だけ (例: `tanaka`, `sato-hanako`, `team2`)
- ほかの人と同じにしない (先に Who's Who の一覧で確認)

## 手順

```bash
# 1. main を最新にする
git switch main
git pull

# 2. 自分のブランチを作る
git switch -c feature/<slug>
```

### 3. テンプレートをコピーする

テンプレート `src/templates/member/` をフォルダごと `src/contributions/` の中にコピーし、名前を `<slug>` にします (エクスプローラー / Finder でコピーして名前を変えても OK)。

```bash
# Mac
cp -R src/templates/member src/contributions/tanaka
# Windows (PowerShell)
Copy-Item -Recurse src/templates/member src/contributions/tanaka
```

### 4. 自己紹介を書く (`index.tsx`)

```tsx
export const meta: MemberMeta = {
  slug: 'tanaka',                       // ← フォルダ名と同じ
  name: '田中',                          // ← 公開してよい表示名
  emoji: '🎮',                          // ← アイコン
  tagline: 'ゲーム好きのエンジニアです',   // ← 一覧のカードに出るひとこと
  addedAt: '2026-10-28',
};
```

その下の `PROFILE` や `export default function Profile()` の中身を書きかえて、自己紹介ページを作ります。

### 5. 作品を作る (`works/`)

`works/omikuji.tsx` がお手本です。ファイル名を変えたり、ファイルを増やしたりして作品を作ります。

```tsx
export const meta: WorkMeta = {
  category: 'arcade',                     // ← 'arcade' (ゲーム・診断) か 'tools' (便利ツール)
  title: '連打チャレンジ',                 // ← 作品名
  description: '10 秒で何回押せるか競うゲーム',
  emoji: '👆',
  addedAt: '2026-10-28',                  // ← 新着の並び順に使う
};
```

- ファイル名がそのまま URL になります (`works/renda.tsx` → `/#/members/tanaka/renda`)。半角英小文字・数字・ハイフンだけにしてください。
- 見た目は同じ名前の `.module.css` に書きます (CSS Modules なので、ほかの人と class 名がぶつかりません)。
- 画像などを使うときも、自分のフォルダの中に置いてください。
- 作品がまだ無くても、自己紹介だけで Who's Who には並びます。おみくじが不要なら `works/` の中身を消しても OK です。

### 6. 確認する

```bash
npm run dev     # http://localhost:5173/#/members/<slug> を開く
npm run build   # エラーが出ないことを確認
```

### 7. GitHub に送って Pull Request を作る

```bash
git add src/contributions/<slug>
git commit -m "<slug> のページを追加"
git push -u origin feature/<slug>
```

GitHub のリポジトリ画面に出る「Compare & pull request」ボタンから PR を作り、テンプレートに沿って書いてください。

## よくあるつまずき

| 症状 | 原因と直し方 |
|---|---|
| 「表示できなかったページがあります」と出る | 書いてある内容のとおりに直す。多いのは `meta.slug` とフォルダ名の不一致 |
| Who's Who に自分のカードが出ない | `src/contributions/<slug>/index.tsx` の位置と名前を確認 |
| 作品が一覧に出ない | `works/` の中にあるか、`meta.category` が `'arcade'` か `'tools'` か、自己紹介 (`index.tsx`) が正しく表示されているか |
| ページが 404 になる | URL の slug・作品名 (ファイル名) の綴りを確認 |
| ページに「エラーが起きました」と出る | ブラウザの開発者ツール (F12) の Console を見る。ほかの人のページは影響を受けません |
| `npm run build` が失敗する | 表示されたファイル名と行番号を確認。わからなければエラー文を Claude Code に見せる |

## 守ること

- 個人情報・パスワード・API キー・社外秘の情報は書かない
- 実在の人の写真やプロフィールは、本人の同意がある場合だけ
- 外部の有料 API は使わない
- `main` に直接 push しない。必ず Pull Request で
