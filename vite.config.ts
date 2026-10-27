import { spawn, type ChildProcess } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `npm run dev` のときだけ、Git ビジュアライザー (tools/git-visualizer) を裏で起動する。
 * ビジュアライザーは各自の PC の .git を読むローカル専用ツールなので、本番ビルド (Vercel) には含まれない。
 */
function gitVisualizer(): Plugin {
  let child: ChildProcess | undefined;
  const stop = () => {
    child?.kill();
    child = undefined;
  };
  return {
    name: 'ft-acade-git-visualizer',
    apply: 'serve',
    configureServer(server) {
      if (process.env.CI || process.env.FT_NO_VISUALIZER) return;
      child = spawn(process.execPath, ['tools/git-visualizer/server.js'], { cwd: process.cwd(), stdio: ['ignore', 'ignore', 'pipe'] });
      child.stderr?.on('data', (d: Buffer) => {
        const text = d.toString();
        // すでに別のビジュアライザーが 4321 番で動いているなら、そのまま使えるので黙っておく
        if (!text.includes('使用中')) server.config.logger.warn(`[git-visualizer] ${text.trim()}`);
      });
      server.httpServer?.once('close', stop);
      process.once('exit', stop);
    },
  };
}

export default defineConfig({
  plugins: [react(), gitVisualizer()],
  server: { port: 5173 },
});
