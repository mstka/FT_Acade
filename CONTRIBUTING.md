# 自己紹介や作品を追加する方法

## しくみ: 置き場所で表示先が決まる

```text
src/contributions/
├── members/<自分の slug>/index.tsx   ← 自己紹介。Who's Who にカードが並び、押すと専用ページ
├── arcade/<作品の slug>/index.tsx    ← ゲーム・診断。Arcade の一覧に並ぶ
└── tools/<作品の slug>/index.tsx     ← 便利ツール。Tools の一覧に並ぶ
```

| 置くもの | 表示される場所 | URL |
|---|---|---|
| `members/<slug>/` (自己紹介) | Who's Who の一覧のカード → 専用ページ | `/#/members/<slug>` |
| `arcade/<slug>/` (ゲーム・診断) | Arcade の一覧、ホームの新着 | `/#/arcade/<slug>` |
| `tools/<slug>/` (便利ツール) | Tools の一覧、ホームの新着 | `/#/tools/<slug>` |

- フォルダを置くだけで自動で並びます。**一覧やメニューなど共通のファイルを書きかえる必要はありません。**
- 自己紹介と作品は別々です。作品に作者を登録する必要はありません。自己紹介だけ、作品だけでも OK です。

## 触ってよい範囲

> **参加者が編集してよいのは、自分が追加したフォルダの中だけです。**
>
> **ほかの人のフォルダ、テンプレート (`src/templates/`)、`src/App.tsx`・`src/registry/`・`src/components/`・`src/pages/`・`src/types/`・`src/styles/`・`package.json`・`package-lock.json`・設定ファイル (`vite.config.ts` など) は、講師の許可なく変更しないでください。**
> Claude Code に頼むときも「`src/contributions/members/tanaka/` の中だけを変更して」のようにフォルダを指定してください。

全員が自分のフォルダだけを触るので、同時に作業しても GitHub でぶつかりません。

## slug (フォルダ名) を決める

slug は URL とフォルダ名に使う名前です。

- 半角の **英小文字・数字・ハイフン** だけ (例: `tanaka`, `sato-hanako`)
- **自己紹介**は自分の名前にする (例: `members/tanaka`)
- **作品**はほかの人とかぶらないよう「自分の名前-作品名」にする (例: `arcade/tanaka-renda`、`tools/tanaka-memo`)
  - 2 人が同じフォルダ名で作ると Pull Request がぶつかります

## 手順

```bash
# 1. main を最新にする
git switch main
git pull

# 2. 自分のブランチを作る
git switch -c feature/<自分の名前>
```

### 3. 自己紹介を作る

テンプレート `src/templates/member/example/` をフォルダごとコピーし、`src/contributions/members/<自分の slug>/` にします (エクスプローラー / Finder でコピーして名前を変えても OK)。

```bash
# Mac
cp -R src/templates/member/example src/contributions/members/tanaka
# Windows (PowerShell)
Copy-Item -Recurse src/templates/member/example src/contributions/members/tanaka
```

`index.tsx` の `meta` を書きかえます。

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

### 4. ゲームやツールを作る (やりたい人)

テンプレート `src/templates/work/example/` (おみくじ) をフォルダごとコピーします。

```bash
# ゲーム・診断なら arcade、便利ツールなら tools にコピーする
# Mac
cp -R src/templates/work/example src/contributions/arcade/tanaka-renda
# Windows (PowerShell)
Copy-Item -Recurse src/templates/work/example src/contributions/arcade/tanaka-renda
```

```tsx
export const meta: WorkMeta = {
  slug: 'tanaka-renda',                   // ← フォルダ名と同じ
  title: '連打チャレンジ',                 // ← 作品名
  description: '10 秒で何回押せるか競うゲーム',
  emoji: '👆',
  addedAt: '2026-10-28',                  // ← 新着の並び順に使う
};
```

- 見た目は同じフォルダの `style.module.css` に書きます (CSS Modules なので、ほかの人と class 名がぶつかりません)。
- 画像などを使うときも、そのフォルダの中に置いてください。
- ゲームやツールはいくつ作っても OK。フォルダを増やすだけです。

### 5. 確認する

```bash
npm run dev     # http://localhost:5173/#/members/<slug> や /#/arcade/<slug> を開く
npm run build   # エラーが出ないことを確認
```

### 6. GitHub に送って Pull Request を作る

```bash
git add src/contributions
git status       # 自分のフォルダだけが入っているか確認
git commit -m "tanaka の自己紹介と連打チャレンジを追加"
git push -u origin feature/<自分の名前>
```

GitHub のリポジトリ画面に出る「Compare & pull request」ボタンから PR を作り、テンプレートに沿って書いてください。

## よくあるつまずき

| 症状 | 原因と直し方 |
|---|---|
| 「表示できなかったページがあります」と出る | 書いてある内容のとおりに直す。多いのは `meta.slug` とフォルダ名の不一致 |
| Who's Who に自分のカードが出ない | `src/contributions/members/<slug>/index.tsx` の位置と名前を確認 |
| ゲーム・ツールが一覧に出ない | `src/contributions/arcade/<slug>/index.tsx` (または `tools/`) の位置と名前を確認 |
| ページが 404 になる | URL の slug の綴りを確認 |
| ページに「エラーが起きました」と出る | ブラウザの開発者ツール (F12) の Console を見る。ほかの人のページは影響を受けません |
| `npm run build` が失敗する | 表示されたファイル名と行番号を確認。わからなければエラー文を Claude Code に見せる |
| PR が「conflict」になる | 自分のフォルダ以外を触っていないか、作品のフォルダ名がほかの人と同じでないか確認 |

## 守ること

- 個人情報・パスワード・API キー・社外秘の情報は書かない
- 実在の人の写真やプロフィールは、本人の同意がある場合だけ
- 外部の有料 API は使わない
- `main` に直接 push しない。必ず Pull Request で
