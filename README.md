# FT_Arcade

For Two の勉強会で、参加者みんなが 1 つの GitHub リポジトリに機能を持ち寄って育てる Web アプリです。
**Arcade**(ミニゲーム・診断)・**Who's Who**(メンバー紹介)・**Tools**(業務効率化ミニツール)の 3 カテゴリがあります。
Who's Who にはメンバー 1 人 1 枚のカードが並び、押すとその人の自己紹介ページに移ります。

> GitHub のリポジトリ名とフォルダ名は `FT_Acade` のままです (アプリの名前が FT_Arcade)。

---

## 3 分で起動する (参加者向け)

> 事前準備 (Git / Node.js 22 / GitHub / Vercel) がまだの人は、先に [docs/PARTICIPANT_GUIDE.md](docs/PARTICIPANT_GUIDE.md) の「0. 事前準備」を済ませてください。

```bash
git clone https://github.com/mstka/FT_Acade.git
cd FT_Acade
npm ci
npm run dev
```

ターミナルに出る `http://localhost:5173/` をブラウザで開けば完成です。止めるときは `Ctrl + C`。

## 自分の Vercel に公開する (L1)

```bash
npx vercel login         # 初回だけ。ブラウザでログイン
npx vercel               # 自分のプロジェクトを作る (質問はすべて Enter で OK)
```

1. 質問に答えるとき、**フレームワークは Vite・ルートディレクトリはリポジトリ直下 (`./`)・出力先は `dist`** になっていることを確認します (`vercel.json` で設定済み)。
2. Vercel の Web 画面でプロジェクトを開き、**Settings → Environment Variables** に次を追加します (対象は **Production**)。

   | 名前 | 値の例 |
   |---|---|
   | `VITE_APP_OWNER` | `tanaka` (画面右上に出る自分の名前) |
   | `VITE_APP_STAGE` | `production` |

3. 環境変数は **再デプロイしないと反映されません**。次のコマンドで本番公開します。

   ```bash
   npx vercel --prod
   ```

4. 表示された URL を開き、右上に自分の名前と `production` が出ていて、3 つのサンプルが動けば L1 クリアです。

うまくいかないときは [docs/PARTICIPANT_GUIDE.md の「困ったとき」](docs/PARTICIPANT_GUIDE.md#困ったとき) を見てください。

## 自分のページを作る (L2)

置き場所で表示先が決まります。自己紹介と作品は別々で、作品に作者を登録する必要はありません。

| 作るもの | コピーするテンプレート | 置き場所 | 表示先 |
|---|---|---|---|
| 自己紹介 | `src/templates/member/example/` | `src/contributions/members/<自分の名前>/` | Who's Who のカード → 専用ページ |
| ゲーム・診断 | `src/templates/work/example/` | `src/contributions/arcade/<自分の名前>-<作品名>/` | Arcade の一覧 |
| 便利ツール | `src/templates/work/example/` | `src/contributions/tools/<自分の名前>-<作品名>/` | Tools の一覧 |

1. テンプレートをフォルダごとコピーして、上の置き場所に置く
2. `index.tsx` の `meta.slug` をフォルダ名と同じにして、中身を書きかえる
3. `npm run dev` で確認 → ブランチを切って commit / push → Pull Request

**共通のファイル (`App.tsx`・ルーター・一覧など) は書きかえ不要です。** みんな自分のフォルダだけを触るので、同時に作業しても GitHub でぶつかりません。
くわしいルールは [CONTRIBUTING.md](CONTRIBUTING.md) にあります。

---

## コマンド一覧

| コマンド | 内容 |
|---|---|
| `npm ci` | 依存パッケージを lockfile どおりに入れる |
| `npm run dev` | 開発サーバーを起動 (http://localhost:5173/)。Git ビジュアライザーも一緒に起動 |
| `npm run build` | 型チェック + 本番用ビルド (`dist/` に出力) |
| `npm run typecheck` | TypeScript の型チェックだけ |
| `npm run lint` | ESLint でコードをチェック |
| `npm run preview` | ビルドしたものをローカルで確認 |
| `npm run visualizer` | Git ビジュアライザー (勉強会の補助ツール) を起動 |

## 環境変数

`.env.example` をコピーして `.env.local` を作ると、ローカルでも値を変えられます (`.env.local` は Git に入りません)。**未設定でもアプリは動きます。**

| 変数 | 使う場所 | 必要なレベル | 用途 |
|---|---|---|---|
| `VITE_APP_OWNER` | ブラウザ | L1 | 公開者の表示名。未設定なら `Guest` |
| `VITE_APP_STAGE` | ブラウザ | L1 | 環境ラベル `local` / `preview` / `production` |
| `VITE_API_BASE_URL` | ブラウザ | L3 (任意) | API の接続先。空ならモック (ダミーデータ) で動く。使うなら `/api` |
| `GAS_WEB_APP_URL` | Vercel Function のみ | L3 | GAS ウェブアプリの URL。ブラウザに渡さない |
| `GAS_SHARED_TOKEN` | Vercel Function のみ | L3 | GAS と共有する合言葉。ブラウザに渡さない |

> `VITE_` で始まる値はビルド時に埋め込まれ、**ブラウザから誰でも見られます**。パスワード・API キー・個人情報は絶対に入れないでください。
> Vercel で環境変数を追加・変更したら、**必ず再デプロイ** (`npx vercel --prod`) してください。

## しくみ

```text
src/
├── main.tsx / App.tsx        アプリの入口とルーティング (HashRouter)
├── components/               ヘッダー・カード・ErrorBoundary などの共通部品
├── pages/                    ホーム / カテゴリ / Who's Who / メンバー / 作品 / About / Git / 404
├── registry/contributions.ts src/contributions/ の自己紹介と作品を自動で登録
├── types/contribution.ts     自己紹介・作品が守る「型」(meta の形)
├── lib/backend.ts            [L3] API 呼び出し。未設定ならモック
├── templates/                お手本 (サイトには出ない): member/example (自己紹介)・work/example (作品)
└── contributions/            ← 参加者が触るのはここ (自分が追加したフォルダだけ)
    ├── members/              自己紹介 → Who's Who (サンプル: sample-pixel / sample-bit / sample-dot)
    ├── arcade/               ゲーム・診断 → Arcade (サンプル: reaction / character-quiz)
    └── tools/                便利ツール → Tools (サンプル: text-formatter)
api/                          [L3] Vercel Functions (GAS への中継)。未設定ならダミーデータ
docs/                         手順書・講師用台本・GAS サンプル
tools/git-visualizer/         Git ビジュアライザー (ローカル専用の補助ツール。本番ビルドには含まれない)
```

- **自動登録は Vite の機能 `import.meta.glob` を使っています。** パスは文字列リテラルで書く必要があります (Vite の制約)。
- URL は `https://<あなたのプロジェクト>.vercel.app/#/members/tanaka` (自己紹介)、`.../#/arcade/tanaka-renda` (作品) のように `#` が入ります (HashRouter)。これで Vercel のリライト設定が不要になります。
- フォルダ名や `meta` に誤りがあるページは表示されず、ホーム上部に直し方が表示されます。ページの中でエラーが起きても、ほかの画面は動き続けます。

## 動作環境

- Node.js **22 系** (`.nvmrc` 参照。22.13 以上を推奨)
- npm 10 以上 / Git
- Windows (PowerShell) / macOS (ターミナル) / Linux

## Git ビジュアライザー (ローカル専用)

ブランチの状態 (自分の PC と GitHub のつながり、push / pull 待ち、未コミットの変更) を図にして見られます。
各自の PC の `.git` を読むツールなので、**自分の PC で動かしたときだけ** 使えます。

- `npm run dev` を実行すると裏で自動的に起動し、アプリのメニュー **「🌿 Git (ローカル)」** (`/#/git`) の中に表示されます。
- Vercel で公開したサイトで開くと「ローカル専用です」という案内だけが出ます。ビジュアライザーのコードは本番ビルドに含まれません。
- 単体で使うときは `npm run visualizer` → http://localhost:4321 。Claude Code に「ビジュアライザーを起動して」と頼んでも OK です。
- 自動起動を止めたいときは、環境変数 `FT_NO_VISUALIZER=1` を付けて `npm run dev` します。

本体は `tools/git-visualizer/` にあり、アプリのコード (`src/`) とは分けてあります。

## ドキュメント

- [CONTRIBUTING.md](CONTRIBUTING.md) — 自分のページの追加方法と、触ってよい範囲
- [docs/PARTICIPANT_GUIDE.md](docs/PARTICIPANT_GUIDE.md) — 参加者向け手順書 (Mac / Windows)
- [docs/WORKSHOP_60MIN.md](docs/WORKSHOP_60MIN.md) — 講師用 60 分進行台本
- [docs/L3_GAS.md](docs/L3_GAS.md) — [発展] GAS バックエンドとつなぐ
- [SPEC.md](SPEC.md) — 実装仕様書

## 注意

- 公開した Vercel の URL は第三者も見られます。実在の人物のプロフィールは本人の同意がある場合だけ載せてください。
- Vercel Hobby プランは個人・非商用の利用に限られます。組織として継続利用する場合は、プランや利用条件を確認してください。
- CLI で個別に公開した Vercel プロジェクトは、GitHub の main が更新されても自動では更新されません。再デプロイしてください。
