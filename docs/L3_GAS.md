# [発展 L3] GAS バックエンドとつなぐ

L3 は宿題・発展課題です。**L1 / L2 は GAS が無くても全部動きます。**

## 構成

```text
ブラウザ (FT_Arcade) ──/api/scores──▶ Vercel Function (api/scores.ts) ──▶ GAS ウェブアプリ ──▶ Google スプレッドシート
```

- ブラウザは GAS に直接アクセスしません。Vercel Function が中継するので、GAS の URL と合言葉はブラウザに渡りません。
- 何も設定しない状態では、フロントも Vercel Function もダミーデータ (モック) で答えます。

| エンドポイント | メソッド | 内容 |
|---|---|---|
| `/api/health` | GET | 稼働確認。`{ ok: true, mode: "mock" \| "gas" }` |
| `/api/scores` | GET | スコア一覧 |
| `/api/scores` | POST | スコア送信 `{ name, game, score }` (入力チェックあり) |

## 手順

1. **GAS を用意する** — [docs/gas/Code.gs](gas/Code.gs) の冒頭コメントのとおりに、スプレッドシート・スクリプト・`SHARED_TOKEN` を準備してウェブアプリとしてデプロイします。
2. **Vercel に環境変数を入れる** (Production / Preview)
   - `GAS_WEB_APP_URL` = GAS の URL (サーバー側だけで使う)
   - `GAS_SHARED_TOKEN` = GAS の `SHARED_TOKEN` と同じ値 (サーバー側だけで使う)
   - `VITE_API_BASE_URL` = `/api` (フロントがこの API を呼ぶようになる)
3. **再デプロイ** — `npx vercel --prod`
4. 公開 URL の **About → API 接続テスト** が「API に接続できました (gas)」になれば成功です。

## ローカルで試す

`npm run dev` (Vite) は `api/` の関数を動かしません。ローカルで API ごと試すときは `npx vercel dev` を使い、`.env.local` に `VITE_API_BASE_URL=/api` を設定します。

## 自分のページから使う

```tsx
import { getScores, postScore } from '../../lib/backend';

const scores = await getScores();
await postScore({ name: 'ピクセル太郎', game: '連打チャレンジ', score: 42 });
```

失敗したときは例外になるので、`try / catch` でエラーメッセージと「もう一度試す」ボタンを出してください (About ページの実装が参考になります)。

## 注意

- 合言葉 (`SHARED_TOKEN`) は「URL を知っているだけでは使えない」ための最低限の仕組みです。継続して社内で使う前に、認証・利用制限・秘密情報の管理を別途設計してください。
- 保存するのはダミーデータだけにしてください。個人情報は保存しないでください。
- GitHub Actions と clasp による GAS の自動デプロイは、今回は扱いません (将来の拡張)。
