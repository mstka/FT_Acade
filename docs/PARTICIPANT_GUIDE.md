# 参加者手順書 (Mac / Windows 共通)

コマンドは **Windows は PowerShell、Mac はターミナル** にそのまま貼り付けて実行できます。OS ごとに違う所だけ注記しています。

## 0. 事前準備 (勉強会の前に)

| 必要なもの | 確認コマンド | 期待する結果 |
|---|---|---|
| Git | `git --version` | `git version 2.x` |
| Node.js 22 | `node -v` | `v22.13` 以上 |
| npm | `npm -v` | `10.x` 以上 |
| GitHub アカウント | — | ログインでき、FT_Acade リポジトリへの招待を承認済み |
| Vercel アカウント | — | GitHub アカウントでサインアップ済み |
| Claude Code | `claude --version` | バージョンが表示される |

- Node.js が無い・古い: https://nodejs.org から **22 (LTS)** をインストール
  - nvm を使っている人は、リポジトリで `nvm use` (Windows の nvm-windows は `nvm install 22` → `nvm use 22`)
- Git が無い: Windows は https://git-scm.com 、Mac は `xcode-select --install`
- GitHub に初めて push するときはブラウザでのログインを求められます。画面の指示に従ってください。

## 1. ダウンロードして起動する (L1 前半)

```bash
git clone https://github.com/mstka/FT_Acade.git
cd FT_Acade
npm ci
npm run dev
```

表示された `http://localhost:5173/` を開きます。確認すること:

- [ ] ホームに 3 つのカテゴリが出る
- [ ] Arcade の「反射神経ゲーム」が遊べる
- [ ] Who's Who の「人物当てクイズ」が遊べる
- [ ] Tools の「文字数カウンター」が使える
- [ ] 右上に `local` と `公開者 Guest` が出ている
- [ ] メニューの「🌿 Git (ローカル)」で、自分の PC のブランチの図が見られる (ローカルで動かしたときだけ使える機能です)

止めるときは、ターミナルで `Ctrl + C` (Mac も Ctrl)。

### (任意) ローカルで自分の名前を出す

`.env.example` をコピーして `.env.local` を作り、`VITE_APP_OWNER=` に自分の名前を書いて `npm run dev` をやり直します。

```bash
# Mac
cp .env.example .env.local
# Windows (PowerShell)
Copy-Item .env.example .env.local
```

## 2. 自分の Vercel に公開する (L1 後半)

```bash
npx vercel login
npx vercel
```

質問への答え方:

| 質問 | 答え |
|---|---|
| Set up and deploy? | `Y` |
| Which scope? | 自分のアカウント |
| Link to existing project? | `N` |
| Project name | そのまま Enter (または `ft-acade-<slug>`) |
| In which directory is your code located? | `./` のまま Enter |
| Want to modify these settings? | `N` (Vite / `npm run build` / `dist` になっていれば OK) |

続けて:

1. https://vercel.com を開き、作ったプロジェクト → **Settings → Environment Variables**
2. `VITE_APP_OWNER` = 自分の名前、`VITE_APP_STAGE` = `production` を **Production** に追加して保存
3. ターミナルで本番公開 (環境変数は **再デプロイして初めて反映** されます)

   ```bash
   npx vercel --prod
   ```

4. 表示された URL を開き、右上が「`production` / 公開者 自分の名前」になっていれば **L1 クリア** 🎉

## 3. 自分のページを作る (L2)

[CONTRIBUTING.md](../CONTRIBUTING.md) の手順どおりに進めます。流れは次のとおりです。

```bash
git switch main
git pull
git switch -c feature/<slug>
# src/contributions/example-member を src/contributions/<slug> にコピーして編集
npm run dev
npm run build
git add src/contributions/<slug>
git commit -m "<slug> のページを追加"
git push -u origin feature/<slug>
```

GitHub で Pull Request を作ったら L2 クリアです。CI (自動チェック) が緑になるか見てみましょう。

### Claude Code への頼み方の例

- 「`src/contributions/tanaka/` の中だけを変更して、10 秒で何回ボタンを押せるかのゲームを作って」
- 「`npm run build` のエラーを直して。変更は `src/contributions/tanaka/` の中だけにして」
- 「ビジュアライザーを起動して」 (ブランチの状態を図で見られます)

## 困ったとき

| 症状 | 確認すること |
|---|---|
| `npm ci` が失敗する | `node -v` が 22 か。`FT_Acade` フォルダの中で実行しているか |
| `npm run dev` の URL が開けない | ターミナルがまだ動いているか。別のアプリがポート 5173 を使っていないか |
| `vercel` でログインできない | `npx vercel login` をやり直す。ブラウザのポップアップがブロックされていないか |
| Vercel のビルドが失敗する | Vercel の Deployments → 該当デプロイの **Build Logs** を見る。ルートディレクトリが `./` か、Node.js が 22 か |
| 公開 URL で名前が `Guest` のまま | 環境変数を **Production** に入れたか。追加した **後に** `npx vercel --prod` したか |
| 公開 URL が 404 | URL の末尾が `/#/...` の形か。プロジェクトの Output Directory が `dist` か |
| `git push` が拒否される | `main` に push していないか (自分のブランチに切り替える)。リポジトリへの招待を承認したか |
| PR の CI が赤い | Details → ログの赤い行を見る。手元で `npm run build` と `npm run lint` を実行して同じエラーを直す |
