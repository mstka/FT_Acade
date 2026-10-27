# GitHub Visualizer

Git リポジトリの **ローカル / リモート(GitHub)のブランチ状況とつながり** を、ブラウザでリアルタイムに表示するローカル Web アプリです。Git 初心者でも「今どこにいて、次に何をすればいいか」がひと目で分かることを目指しています。

## 特長

- **OS 非依存**: Node.js と git だけで動きます (npm パッケージ依存ゼロ)。Windows / macOS / Linux 共通
- **リアルタイム**: `.git` を監視し、commit / checkout / merge / push などを即座に反映 (Server-Sent Events)。リモートの変更は自動 `git fetch` で取り込み
- **ブランチマップ (初心者向け)**
  - ☁ リモート (GitHub) と 💻 ローカル (あなたのPC) を上下のセクターに分けて表示
  - 1 ブランチ = 1 レーン。左が古く右が新しい。同じコミットは両セクターで同じ列に並ぶので、見比べるだけで差分が分かる
  - 各レーンに状態を表示: ✅ 最新 / ⬆ push 待ち / ⬇ pull 待ち / ⚠ 食い違い / 🆕 まだ GitHub に無い / 🗑 GitHub 側で削除済み
  - 未push コミットはオレンジの破線リング、GitHub にだけあるコミットは青の点線リング
  - 📍 今いる場所 (HEAD) と ✏ 未コミットの変更を表示
  - 画面上部に「今の状態」と「次にやること (コマンド例)」を表示
- **コミットグラフ (詳細)**: 一般的な Git グラフ表示。ブランチをクリックすると祖先コミットを強調
- **ブランチ同期状況**: 各ブランチの upstream との差分と、基準ブランチ (main など) との ahead / behind を一覧
- コミットをクリックすると詳細 (変更ファイル、そのコミットを含むブランチ) を表示

## 必要なもの

- Node.js 20 以上
- git

## 起動

```bash
cd GitHubVisualizer
npm start
```

ブラウザで http://localhost:4321 を開き、上部の入力欄にリポジトリを指定します。

- ローカルパス: `C:\path\to\repo`、`/home/me/repo` など
- GitHub: `https://github.com/owner/repo` または `owner/repo` (`repos/` に自動クローンし、閲覧専用ミラーとして表示)

起動時にリポジトリを指定することもできます。

```bash
node server.js /path/to/repo --port 4321 --fetch-interval 15
```

| オプション | 説明 | 既定値 |
|---|---|---|
| `--port` | 待ち受けポート (`GV_PORT`) | 4321 |
| `--host` | 待ち受けアドレス (`GV_HOST`) | 127.0.0.1 |
| `--fetch-interval` | 自動 fetch 間隔 (秒、0 で無効) | 15 |
| `--limit` | 読み込むコミット数 | 500 |

## 仕組み

```
ブラウザ (public/)  ⇐ SSE: snapshot / meta ─  server.js (Node 標準ライブラリのみ)
                    ─ fetch: /api/open 等 ⇒      │  fs.watch(.git) + 2秒ポーリング
                                                 │  定期 git fetch --all --prune
                                                 └─ git CLI (execFile)
```

- `server.js`: git コマンドの結果を JSON に整形し、変化があったときだけ配信
- `public/lanes.js`: ブランチマップ (ブランチごとのレーン配置)
- `public/app.js`: 接続管理、サイドバー、コミットグラフ、同期状況
- 状態 (最近開いたリポジトリなど) は `.data/state.json` に保存

## 注意

- リモートの最新状態は `git fetch` した時点のものです。プライベートリポジトリの自動 fetch には、git に認証情報が設定されている必要があります (パスワード入力を求めるプロンプトは出さずに失敗します)
- サーバーは既定で `127.0.0.1` のみで待ち受けます
