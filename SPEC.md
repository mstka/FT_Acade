# FT_Arcade 実装仕様書 v1.2

作成日：2026-10-27（v1.1・v1.2 改訂：2026-10-28）  
対象：For Two「開発の基礎知識②」勉強会（2026-10-28／60分）  
実装担当：Claude Code  
プロダクト名：**FT_Arcade**（v1.2 で FT_Acade から改名。GitHub リポジトリ名・フォルダ名は `FT_Acade` のまま）

### v1.2 の変更点

- **プロダクト名を FT_Arcade に変更**（画面・ドキュメントの表記。リポジトリ名は変更しない）。
- **自己紹介と作品を分離。** 作品に作者を登録する仕組みをやめた。置き場所で表示先が決まる。
  - 自己紹介：`src/contributions/members/<slug>/index.tsx` → Who's Who の一覧のカードと専用ページ `/members/<slug>`
  - ゲーム・診断：`src/contributions/arcade/<slug>/index.tsx` → Arcade の一覧と作品ページ `/arcade/<slug>`
  - 便利ツール：`src/contributions/tools/<slug>/index.tsx` → Tools の一覧と作品ページ `/tools/<slug>`
- 作品の `meta` から `category` をなくし、`slug` を追加（カテゴリはフォルダで決まる）。
- テンプレートは `src/templates/member/example/`（自己紹介）と `src/templates/work/example/`（作品）。

### v1.1 の変更点

- **Who's Who を「メンバー一覧」に変更。** 1 人 1 枚のカードが並ぶ一覧から、各メンバーの専用ページ（自己紹介）へ移動する。Who's Who は作品のカテゴリではなく、作品のカテゴリは `arcade` / `tools` の 2 つ。
- **Git ビジュアライザー**は `tools/git-visualizer/` に分けたローカル専用ツール。`npm run dev` 時のみ `/#/git` に表示し、本番（Vercel）では「ローカル専用」の案内のみ表示する。本番ビルドには含めない。

## 0. この仕様書の使い方

本書に従って、授業で配布できる**実際に起動・デプロイ可能なWebアプリのソース一式**を実装する。説明用モックアップのみで終わらせない。主催者が事前にGitHubリポジトリへpushし、参加者がcloneしてVercelへ公開することを想定する。

優先順は **P0（必須・まず実装）→ P1（参加者の追加開発用）→ P2（GAS発展）**。P0が完成するまでP2を作り込まない。

## 1. 目的と学習ゴール

### 目的

FT_Arcadeは、複数人が1つのGitHubリポジトリへ機能を追加して育てる、社内勉強会向けのWebアプリ。以下3カテゴリを統合する。

- **Arcade**：ミニゲーム・診断
- **Who's Who**：自己紹介・人物当てクイズ
- **Tools**：業務効率化ミニツール

### 60分勉強会のレベル設計

| レベル | 学習内容 | 完了条件 | 優先度 |
|---|---|---|---|
| L1 | 共通リポジトリをclone → ローカルで起動 → 自分のVercelへデプロイ → 環境変数を反映 | 自分の公開URLでFT_Arcadeが動く | 全員必須 |
| L2 | 自分のブランチで専用ページと動く機能を追加 → commit / push / PR | 自分のページが動き、PRが提出される | 早く終わった人／発展 |
| L3 | 共通GASバックエンドAPIを呼ぶ機能を追加 | ダミーデータの取得／送信ができる | 発展・宿題 |

Gitビジュアライザーは授業冒頭の補助教材で、**ローカル専用ツール**として `tools/git-visualizer/` に分けて置く。`npm run dev` のときだけアプリの `/#/git` に表示し、本番（Vercel）のビルドには含めない（本番の `/#/git` は「ローカル専用です」という案内のみ）。

## 2. 技術とインフラ

- Frontend：**React + TypeScript + Vite**。スマートフォン・PC両対応。
- Routing：**React RouterのHashRouter**。GitHubからcloneした静的SPAをVercelに簡単に公開するため、初期版はURLを `/#/arcade` のようにする。リライト設定を不要にする。
- Styling：CSS Modulesまたは通常CSS＋CSS変数を原則とし、参加者が理解しやすい構成を優先。必要最小限の依存ライブラリにする。
- Icons：Lucide React等、商用利用条件を満たすライブラリを使用可。
- Deploy：**Vercel CLI**を基本導線にする。個人のデプロイ体験を優先するため、GitHub→Vercelの自動連携は必須にしない。
- Backend：P0では**不要**。L3向けにVercel Functions→GASの構成を後から拡張可能にする。
- Storage：P0ではDB不要。必要ならブラウザのlocalStorageのみ。個人情報や秘密情報を格納しない。
- Runtime：Node.js 22系を推奨（`.nvmrc` を同梱）。依存バージョンとlockfileを固定する。

### 環境構成

```text
参加者PC（Git + Claude Code）
    └─ clone / branch / commit / push / PR
             │
             ▼
        共通GitHubリポジトリ
             │
             ├─ 各参加者 → Vercel CLIで自分のコピーを公開（L1）
             └─ 主催者 → 共通Vercelプロジェクトを管理（統合版）
                                │
                                └─ [L3のみ] Vercel Function → GAS Web App → Google Sheets
```

**注意**：参加者がCLIで個別に公開したVercelプロジェクトは、GitHubでmainがマージされても自動更新されない。再デプロイするか、権限・利用条件を確認した上でGit連携する。VercelのプランはFor Twoでの利用目的に適合させる（Hobbyは個人・非商用限定）。

## 3. 情報設計・画面仕様

### 共通UI

- トップバー：FT_Arcadeロゴ／ホーム／Arcade／Who's Who／Tools。
- 右上：環境ラベル `VITE_APP_STAGE`、公開者 `VITE_APP_OWNER`（未設定なら「Guest」「local」などの分かりやすい既定値）。
- メイン：カテゴリカード、機能カード、説明文、操作ボタン。
- フッター：For Two Learning Project、教育用の注意書き。
- 雰囲気：遊び心のあるモダンなアーケード風。カラフルだが過剰な演出・アニメーションは避ける。日本語UIを基本にする。
- キーボード操作・フォーカス表示・色のコントラスト・スマートフォン幅の表示崩れに配慮する。

### 画面一覧

| ルート（HashRouter内） | 画面 | 要件 |
|---|---|---|
| `/` | ホーム | 3カテゴリの概要（作品数・メンバー数）、新着の作品、学習の進め方、公開者名 |
| `/arcade` | Arcade | ミニゲーム・診断の作品をカード一覧で表示 |
| `/arcade/:slug` | 作品ページ | 1つのゲーム・診断 |
| `/who-is-who` | Who's Who | **メンバー一覧**。1人1枚のカード（アイコン・名前・ひとこと）。押すとその人の専用ページへ |
| `/members/:slug` | メンバー専用ページ | その人の自己紹介 |
| `/tools` | Tools | 業務効率化ツールの作品をカード一覧で表示 |
| `/tools/:slug` | 作品ページ | 1つのツール |
| `/about` | About | 本プロジェクトの目的、GitHub共同開発の説明、API・環境変数の概要 |
| `/git` | Git ビジュアライザー | ローカル（`npm run dev`）では埋め込み表示、本番では「ローカル専用」の案内 |
| `*` | 404 | ホームへ戻れる案内 |

> 実際の公開URLは例：`https://example.vercel.app/#/members/tanaka`、`https://example.vercel.app/#/arcade/tanaka-renda`。

### 初期サンプル（デプロイ直後に必ず動く）

- Arcade：**反射神経ゲーム**（`arcade/reaction`）。開始後ランダムなタイミングでボタン表示、反応時間を表示。リセット可能。
- Arcade：**架空の人物当てクイズ**（`arcade/character-quiz`）。3問以上、選択肢を押すと正誤とスコアを表示。登場人物は架空。
- Tools：**文章整形・文字数カウンター**（`tools/text-formatter`）。入力すると文字数・行数を表示、余分な空白を整形しコピーできる。
- Who's Who：**架空のサンプルメンバー 3 人**（`members/sample-pixel` / `sample-bit` / `sample-dot`）の自己紹介。実在メンバーの情報は使わない。
- サンプルは全て外部API、DB、ログインなしで動く。一覧ではサンプルであることを明示する（`meta.sample: true`）。

## 4. 共同開発で衝突を避ける仕組み【最重要】

### 参加者による変更範囲

参加者は原則 **自分が追加したフォルダ（`src/contributions/members/<slug>/`・`arcade/<slug>/`・`tools/<slug>/`）のみを編集**する。`App.tsx`、共通ルーター、レジストリ、テンプレート、package.jsonは講師の許可がない限り触らない。

**目標**：フォルダを置くだけで、次がすべて自動で反映される。共通ファイルの編集は不要で、複数人が同時に PR を出しても衝突しない。

| 置くフォルダ | 自動で反映される場所 |
|---|---|
| `src/contributions/members/<slug>/index.tsx`（自己紹介） | Who's Who の一覧のカード、専用ページ `/members/<slug>` |
| `src/contributions/arcade/<slug>/index.tsx`（ゲーム・診断） | Arcade の一覧、ホームの新着、作品ページ `/arcade/<slug>` |
| `src/contributions/tools/<slug>/index.tsx`（便利ツール） | Tools の一覧、ホームの新着、作品ページ `/tools/<slug>` |

- 自己紹介と作品は独立している。作品に作者を登録する必要はなく、自己紹介がなくても作品は表示される。
- 作品の slug はほかの人と重ならないよう `<自分の名前>-<作品名>`（例：`tanaka-renda`）を推奨する。同じフォルダ名を 2 人が作ると PR が衝突するため。
- スタイルは同じフォルダの CSS Modules（`style.module.css` など）に書く。class 名がほかの人とぶつからない。
- localStorage を使う場合のキーは `ft-arcade:<slug>:...` とする。

### 型（契約）

TypeScriptで以下の契約を設ける（`src/types/contribution.ts`）。

```tsx
import type { ComponentType } from 'react';

export type WorkCategory = 'arcade' | 'tools'; // フォルダ（arcade/・tools/）で決まる

// src/contributions/members/<slug>/index.tsx
export interface MemberMeta {
  slug: string;        // URLとフォルダ名に一致。例: tanaka
  name: string;        // 表示名（公開してよい名前のみ）
  emoji: string;       // アイコン
  tagline: string;     // ひとこと（一覧のカードに出る）
  addedAt?: string;    // 追加日 YYYY-MM-DD
  sample?: boolean;    // 教材用サンプルなら true
}

// src/contributions/arcade/<slug>/index.tsx・tools/<slug>/index.tsx
export interface WorkMeta {
  slug: string;        // URLとフォルダ名に一致。例: tanaka-renda
  title: string;       // 作品名
  description: string; // 1〜2文
  emoji: string;       // カード用絵文字
  addedAt?: string;    // 追加日 YYYY-MM-DD（ホームの新着の並び順）
  sample?: boolean;    // 教材用サンプルなら true
}

export interface MemberModule { meta: MemberMeta; default: ComponentType }
export interface WorkModule { meta: WorkMeta; default: ComponentType }
```

```tsx
// src/contributions/members/tanaka/index.tsx（自己紹介）のイメージ
export const meta: MemberMeta = { slug: 'tanaka', name: '田中', emoji: '🎮', tagline: 'ゲーム好きのエンジニア' };
export default function Profile() { return <p>はじめまして、田中です！</p>; }

// src/contributions/arcade/tanaka-renda/index.tsx（ゲーム）のイメージ
export const meta: WorkMeta = { slug: 'tanaka-renda', title: '連打チャレンジ', description: '10秒で何回押せるか競うゲーム', emoji: '👆' };
export default function Renda() { /* 実際に動くミニゲーム */ }
```

### 自動登録

`src/registry/contributions.ts` に、Viteの `import.meta.glob` を利用した**自動発見**を実装する。

```ts
import.meta.glob('../contributions/members/*/index.tsx', { eager: true });
import.meta.glob('../contributions/arcade/*/index.tsx', { eager: true });
import.meta.glob('../contributions/tools/*/index.tsx', { eager: true });
```

- 各モジュールの`meta`とdefaultコンポーネントを取り込む。
- `meta.slug` とフォルダ名の一致、slug の形式（半角英小文字・数字・ハイフン）、必須項目を検証する。問題のあるものは表示せず、ホームと Who's Who に直し方を表示する。
- 除外パターン（`!...`）は使わない。テンプレートは glob の対象外の `src/templates/` に置く。
- 表示順：サンプルは後ろ。メンバーは名前順、作品はタイトル順、新着は `addedAt` の新しい順。
- サンプルも同じ仕組みで登録し、特別扱いしない（一覧の表示で「サンプル」と明示するのみ）。
- 自己紹介と作品それぞれを Error Boundary で囲み、1つのエラーで全画面が落ちないようにする。
- 参加者が共通の一覧・ルーターを編集する必要はない。

> `import.meta.glob`のパスはViteの制約に従い**文字列リテラル**で記述すること。Vite固有機能としてREADMEにも明記する。

## 5. 環境変数とVercel【L1必須】

### 変数定義

| 変数 | 利用場所 | 必須？ | 用途 |
|---|---|---|---|
| `VITE_APP_OWNER` | ブラウザ | L1必須 | 公開者の表示名。例：`tanaka` |
| `VITE_APP_STAGE` | ブラウザ | L1必須 | `local` / `preview` / `production` 等の環境ラベル |
| `VITE_API_BASE_URL` | ブラウザ | L3任意 | API接続先。未設定ならモックモード。設定時は同一オリジンの`/api`を推奨 |
| `GAS_WEB_APP_URL` | Vercel Functionサーバーのみ | L3のみ | GASデプロイ先URL。ブラウザへ渡さない |

- `.env.example`をGit管理し、値の例を書く。 `.env.local`・`.vercel/`は`.gitignore`に入れる。
- `import.meta.env.VITE_APP_OWNER`と`VITE_APP_STAGE`を画面に必ず表示する。
- 未設定でもクラッシュせず、既定値で動く。
- `VITE_`接頭辞の変数は**秘密ではない**。APIキー、トークン、顧客情報を入れない。
- Vercelに変数を追加した後は**再デプロイ**が必要であると手順書に明記する。
- L1ではAPIなしで公開・操作できる。L3までGASは未接続。

### L1 Vercel配布手順（READMEに記載）

1. GitHubアカウント・Git・Node.js 22・Claude Code・Vercelログインを**事前に確認**する。
2. 共通リポジトリをclone、`npm ci`、`npm run dev`でローカル起動。
3. `npx vercel`で自分のVercelプロジェクトを作る。フレームワークはVite、プロジェクトルートはリポジトリ直下、出力先は`dist`。
4. Vercelプロジェクトの設定画面で`VITE_APP_OWNER`と`VITE_APP_STAGE=production`をProduction環境に設定。
5. `npx vercel --prod`で公開し、発行URLを開いて表示名・環境ラベル・サンプル機能の動作を確認。
6. 失敗時に確認する事項：ログイン／ルートディレクトリ／Node.js／ビルドログ／環境変数の対象環境／再デプロイ有無。

※講師は事前にCLI操作・プラン条件・実機環境を検証すること。参加者全員のVercel利用形態が組織の利用条件に適合するよう調整する。

## 6. GitHub共同開発【L2】

- リポジトリは1つ、`main`を保護し、**直接pushは禁止**。参加者は`feature/<slug>`で開発。
- 参加者の基本操作：`git switch -c feature/tanaka` → 自分のフォルダにファイル追加 → `npm run build` → `git add` → `git commit` → `git push -u origin feature/tanaka` → PR作成。
- PRテンプレート：`機能名 / 変更内容 / 動作確認（スクリーンショット任意） / チェック項目`。
- GitHub ActionsでPRごとに`npm ci`→`npm run typecheck`→`npm run build`を実行。
- PRは講師または指定レビュー担当が確認してからmainへmergeする。
- マージされた機能は共通版のサイトに現れる。参加者の個別Vercel版へ自動反映されるとは限らない。
- 講師は最小限のレビューチェックリスト（表示／操作／ビルド／他画面への影響／個人情報）を用意する。

## 7. GASバックエンド【L3発展課題】

### 方針

P0には一切依存させない。まずは公開可能な**ダミーデータ**を使い、共通バックエンドからスコア一覧や自己紹介クイズ用データを取得・保存する。

### 想定インターフェース

| フロント側 | HTTP | 目的 | 初期挙動 |
|---|---|---|---|
| `/api/health` | GET | 稼働確認 | `ok`等を返す |
| `/api/scores` | GET | ゲームのスコア一覧 | サンプルスコアを返す |
| `/api/scores` | POST | スコア送信 | バリデーションして保存（発展） |

- ブラウザからGASへ直接アクセスせず、**Vercel Functionsを中継**してCORSやサーバー設定の複雑さを隠す。
- `GAS_WEB_APP_URL`はVercel Function側の環境変数とする。
- GASは`doGet`・`doPost`で実装。Google Sheets保存の権限や公開範囲を明示する。
- GET/POSTの成否・待機・エラーをフロント画面に表示し、APIが使えない場合は説明と再試行ボタンを出す。
- GASの公開URLを知っているだけで実データにアクセスできる状態を作らない。継続的な社内利用前に認証・認可・レート制限・秘密情報管理を別途設計する。
- GitHub Actions＋claspによるGASの自動デプロイは**講師の将来拡張**。P0で構築しない。

## 8. 必須ファイル構成

```text
FT_Arcade/
├── README.md                        # 参加者用3分起動手順・Vercelデプロイ
├── SPEC.md                          # この仕様書のコピー
├── CONTRIBUTING.md                  # 参加者の追加方法・編集禁止範囲
├── .env.example                     # 公開可能な設定例
├── .gitignore
├── .nvmrc                          # 22
├── package.json
├── package-lock.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   ├── components/                  # 共通レイアウト・カード・ErrorBoundary
│   ├── pages/                       # Home / Category / WhoIsWho / Member / Work / About / Git / NotFound
│   ├── types/contribution.ts
│   ├── registry/contributions.ts    # import.meta.globで自動登録
│   ├── lib/backend.ts               # L3に備える。未設定ならモック
│   ├── templates/                   # 参加者が複製するテンプレート（自動登録の対象外）
│   │   ├── member/example/          #   自己紹介のお手本
│   │   └── work/example/            #   ゲーム・ツールのお手本（おみくじ）
│   └── contributions/               # 参加者が触るのはここ（自分が追加したフォルダだけ）
│       ├── members/<slug>/          #   自己紹介 → Who's Who
│       ├── arcade/<slug>/           #   ゲーム・診断 → Arcade
│       └── tools/<slug>/            #   便利ツール → Tools
├── api/                             # L3用、P0では空でも可
├── tools/git-visualizer/            # ローカル専用の補助ツール（本番ビルドに含めない）
├── docs/
│   ├── WORKSHOP_60MIN.md            # 講師用進行台本
│   └── PARTICIPANT_GUIDE.md         # Mac/Windows共通の手順書
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/ci.yml
```

テンプレートは `src/templates/member/example/`（自己紹介）と `src/templates/work/example/`（作品）に置き、自動登録の対象外とする。参加者がフォルダごと複製して `meta.slug` を自分のフォルダ名にする。複製し忘れ・書き換え忘れは自動登録の検証で検出し、直し方を画面に表示する。

## 9. 開発者体験・エラー対応

- `npm ci` / `npm run dev` / `npm run build` / `npm run typecheck` / `npm run lint` が動く。
- `.env.local` がなくても画面は正常表示。
- 無効なslugは404、登録モジュールの不具合はエラー表示にフォールバック。
- データ未登録時には空状態メッセージを表示。
- デモ機能に実データ・有料APIは不要。
- Node/Git/Vercel CLIのインストールと認証の事前準備をREADMEに明記。
- Windows PowerShellとmacOS Terminalの双方で成立するコマンドを案内（別OS固有コマンドは注記）。
- 自動で`git push`、PR作成、Vercel本番公開、GAS公開を実行しない。外部への変更は人間の明示操作に委ねる。

## 10. 完了基準（Acceptance Criteria）

### P0・講師の配布物として完成

- [ ] クリーンな環境で `npm ci && npm run build` が成功する。
- [ ] `npm run dev` でトップ、3カテゴリ、サンプル機能がすべて動く。
- [ ] L1でDB・GAS・APIキーなしにVercelへ公開できる。
- [ ] VercelのProduction環境変数で公開者名と環境表示を変更できる。
- [ ] `src/contributions/members/new-person/index.tsx` 追加だけで Who's Who の一覧と専用ページに自動反映される。
- [ ] `src/contributions/arcade/<slug>/index.tsx`（または `tools/`）追加だけで、その一覧・ホームの新着・作品ページに自動反映される。作者の登録は不要。
- [ ] 異なる2人が別ディレクトリを追加し、同時にPRを作っても共通ファイルの編集が不要。
- [ ] README、参加者手順書、講師60分台本、PRテンプレート、CIがある。
- [ ] 個人情報・APIキー・実在社員の顔写真・機密情報が初期データに含まれない。

### P1・発展

- [ ] 自分の専用ページに入力・ボタン・結果表示など、実際に動く機能を追加できる。
- [ ] mainへのmerge後、統合版で機能が表示される。

### P2・発展

- [ ] デモ用GAS APIを中継してダミーのスコアを取得できる。
- [ ] API障害でも他の画面が正常に動く。

## 11. Claude Codeへの実装順序

1. **仕様の理解**：要件を読み、必要なファイルを洗い出す。既存コードがあれば調査し、無断で消さない。
2. **P0アプリを完成**：React/Vite/HashRouter、3カテゴリ、3つの動作するサンプル機能、レスポンシブUI。
3. **共同開発の仕組みを完成**：Contribution型、glob自動登録、slug検証、メンバー画面とサンプル。
4. **Vercel対応を完成**：環境変数、`.env.example`、デプロイ手順、必要な設定。
5. **GitHub教育用ファイルを完成**：PRテンプレート、CI、CONTRIBUTING、60分台本。
6. **品質確認**：typecheck・lint・build・サンプル操作確認。検証していない項目は正直に報告。
7. **P2は余力があれば**：GAS中継の設計とモック、ただし本番GASの認証情報がなければ接続しない。

最終報告には「作成したファイル」「起動方法」「動作確認結果」「残作業」「主催者が用意すべきアカウント・環境変数」を含める。

---

## 12. 非機能要件と制約

- 初心者が編集するファイル数を極力少なくし、参加者の最短経路をREADME冒頭へ置く。
- GitHubの協業教材であり、ユーザー登録・決済・本格的な管理画面は作らない。
- 実在メンバーのプロフィール掲載は本人同意を条件とする。社内向けでも公開Vercel URLは第三者が閲覧し得る。
- Vercel Hobbyは個人・非商用用途のみ。組織としての継続利用では適切な有料プランや代替環境を事前に確認する。
- 既存ファイルや共通設計を参加者のClaude Codeが壊さないよう、CONTRIBUTINGに編集可能範囲を太字で明記する。
- 教材としての分かりやすさ・確実なデプロイを、技術的な凝り方より優先する。
