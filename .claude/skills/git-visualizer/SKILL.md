---
name: git-visualizer
description: FT_Arcade のブランチの状態 (自分のPC と GitHub のつながり、push / pull 待ち、未コミットの変更) をブラウザで図示する Git ビジュアライザーを起動する。「ビジュアライザーを起動して」「ブランチの状態を見たい」「git の状態を図で見せて」「誰が何を push したか見たい」などと頼まれたときに使う。
---

# Git ビジュアライザーを起動する

`tools/git-visualizer/` にある、依存パッケージなしの Node.js 製ツールです。npm install は不要です。

## 手順

1. **前提を確認する**: `node -v` が v20 以上、`git --version` が使えること。
   Node.js が無い・古い場合は、https://nodejs.org から LTS 版を入れるようユーザーに案内して止まる。

2. **すでに動いていないか確認する**: `curl -s http://localhost:4321/ | grep -c "ビジュアライザー"` が 1 以上なら起動済み。手順 4 へ。
   `npm run dev` (http://localhost:5173) が動いていれば自動で起動しているので、アプリの http://localhost:5173/#/git を案内すればよい。

3. **リポジトリのルートでバックグラウンド起動する** (フォアグラウンドで実行するとセッションが止まるので必ずバックグラウンドで):

   ```bash
   node tools/git-visualizer/server.js
   ```

   - 出力に `watching <パス>` が出れば成功。
   - `ポート 4321 は使用中です` と出たら、`--port 4322` を付けて起動し直し、以降の URL も 4322 にする。

4. **画面を開く**:
   - Claude デスクトップアプリなら、プレビューで `.claude/launch.json` の `git-visualizer` を開く (起動もこれで行える)。
   - それ以外は http://localhost:4321 をユーザーに伝える。開いてほしいと言われたら OS に合わせて開く
     (Windows: `start http://localhost:4321` / macOS: `open http://localhost:4321` / Linux: `xdg-open http://localhost:4321`)。

5. **見かたを一言で伝える**:
   - 上の帯が ☁ GitHub、下の帯が 💻 自分のPC。横の線 1 本が 1 ブランチで、左が昔・右が最新。
   - 帯の間の線とバッジが PC と GitHub のつながり: ✓ 同じ / ⬆ push 待ち / ⬇ pull 待ち。
   - 画面上部の「つぎは」ボタンが、次にやるべき操作を示す。右のパネルに説明とコマンドが出る。

## 止めるとき

起動したバックグラウンドのプロセスを停止する。ポートで探す場合:
Windows は `netstat -ano | findstr :4321` で PID を調べて `taskkill /PID <PID> /F`、macOS / Linux は `lsof -ti :4321 | xargs kill`。
