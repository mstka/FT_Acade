# 自分のページを追加する方法

## 触ってよい範囲

> **参加者が編集してよいのは `src/contributions/<自分の slug>/` の中だけです。**
>
> **`src/App.tsx`・`src/registry/`・`src/components/`・`src/pages/`・`src/types/`・`package.json`・`package-lock.json`・設定ファイル (`vite.config.ts` など) は、講師の許可なく変更しないでください。**
> Claude Code に頼むときも「`src/contributions/<slug>/` の中だけを変更して」と伝えてください。

自分のフォルダだけを触れば、ほかの人と同時に作業してもぶつかりません。

## slug を決める

slug は URL とフォルダ名に使う、あなた専用の名前です。

- 半角の **英小文字・数字・ハイフン** だけ (例: `tanaka`, `sato-hanako`, `team2`)
- ほかの人と同じにしない
- ページの URL は `/#/members/<slug>` になります

## 手順

```bash
# 1. main を最新にする
git switch main
git pull

# 2. 自分のブランチを作る
git switch -c feature/<slug>
```

3. `src/contributions/example-member/` をフォルダごとコピーし、名前を `<slug>` にします。
   - エクスプローラー / Finder でコピーして名前を変えても OK です。
4. コピーした `index.tsx` の `meta` を書きかえます。

   ```tsx
   export const meta: ContributionMeta = {
     slug: 'tanaka',              // ← フォルダ名と同じ
     name: '田中',                // ← 公開してよい表示名
     category: 'arcade',          // ← 'arcade' / 'who-is-who' / 'tools'
     title: '連打チャレンジ',      // ← 作った機能の名前
     description: '10 秒で何回押せるか競うゲーム',
     emoji: '🎮',
     addedAt: '2026-10-28',       // ← 追加した日 (新着の並び順に使う)
   };
   ```

5. `export default function ...` の中身を自由に作ります。入力欄・ボタン・結果表示など、実際に動くものにしてみましょう。
   - 見た目は同じフォルダの `style.module.css` に書きます (CSS Modules なので、ほかの人のページと class 名がぶつかりません)。
   - 画像などを使うときも、自分のフォルダに置いてください。
6. 確認します。

   ```bash
   npm run dev     # http://localhost:5173/#/members/<slug> を開く
   npm run build   # エラーが出ないことを確認
   ```

7. GitHub に送って Pull Request を作ります。

   ```bash
   git add src/contributions/<slug>
   git commit -m "<slug> のページを追加"
   git push -u origin feature/<slug>
   ```

   GitHub のリポジトリ画面に出る「Compare & pull request」ボタンから PR を作り、テンプレートに沿って書いてください。

## よくあるつまずき

| 症状 | 原因と直し方 |
|---|---|
| ホームに「表示できなかったページがあります」と出る | 書いてある内容のとおりに直す。多いのは `meta.slug` とフォルダ名の不一致 |
| 自分のページが一覧に出ない | ファイル名が `index.tsx` か、`src/contributions/<slug>/index.tsx` の位置にあるか確認 |
| `/#/members/<slug>` が 404 になる | slug の綴り、または上の 2 つを確認 |
| ページに「エラーが起きました」と出る | ブラウザの開発者ツール (F12) の Console を見る。ほかのページは影響を受けません |
| `npm run build` が失敗する | 表示されたファイル名と行番号を確認。わからなければエラー文を Claude Code に見せる |

## 守ること

- 個人情報・パスワード・API キー・社外秘の情報は書かない
- 実在の人の写真やプロフィールは、本人の同意がある場合だけ
- 外部の有料 API は使わない
- `main` に直接 push しない。必ず Pull Request で
