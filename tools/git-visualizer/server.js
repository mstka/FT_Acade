#!/usr/bin/env node
// GitHubVisualizer - zero-dependency local server.
// Runs anywhere Node.js (>=18) and git are installed: Windows / macOS / Linux.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// ---------- config ----------
const args = parseArgs(process.argv.slice(2));
const PORT = Number(args.port || process.env.GV_PORT || 4321);
const HOST = args.host || process.env.GV_HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, '.data');
const CLONE_DIR = path.join(__dirname, 'repos');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const POLL_MS = 2000;

fs.mkdirSync(DATA_DIR, { recursive: true });

const saved = loadJSON(STATE_FILE, { recent: [], fetchInterval: 15, limit: 500 });
const state = {
  repo: null,            // { root, gitDir, label, url }
  fetchInterval: Number(args['fetch-interval'] ?? saved.fetchInterval ?? 15), // seconds, 0 = off
  limit: Number(args.limit || saved.limit || 500),
  recent: saved.recent || [],
  signature: '',
  snapshot: null,
  lastFetch: null,
  fetchError: null,
  fetching: false,
};

const clients = new Set();
let watcher = null;
let pollTimer = null;
let fetchTimer = null;
let refreshQueued = null;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else if (!out.repo) out.repo = a;
  }
  return out;
}

function loadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function persist() {
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    recent: state.recent.slice(0, 15),
    fetchInterval: state.fetchInterval,
    limit: state.limit,
  }, null, 2));
}

// ---------- git helpers ----------
function git(cwd, argv, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile('git', argv, {
      cwd,
      maxBuffer: 64 * 1024 * 1024,
      timeout: opts.timeout || 30000,
      windowsHide: true,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' },
    }, (err, stdout, stderr) => {
      if (err) { err.stderr = stderr; return opts.allowFail ? resolve('') : reject(err); }
      resolve(stdout);
    });
  });
}

const GITHUB_URL = /^(?:https?:\/\/github\.com\/|git@github\.com:)([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i;
const SHORTHAND = /^([\w.-]+)\/([\w.-]+)$/;

// Accepts a local path, a GitHub URL, or "owner/name" shorthand.
async function resolveRepo(input) {
  input = String(input || '').trim();
  if (!input) throw new Error('リポジトリのパスまたはURLを指定してください');

  let m = input.match(GITHUB_URL);
  if (!m && !fs.existsSync(input)) m = input.match(SHORTHAND);
  if (m) {
    const [, owner, name] = m;
    const url = `https://github.com/${owner}/${name}.git`;
    const dir = path.join(CLONE_DIR, `${owner}__${name}`);
    if (!fs.existsSync(path.join(dir, '.git'))) {
      fs.mkdirSync(CLONE_DIR, { recursive: true });
      broadcast('status', { message: `${owner}/${name} をクローン中…` });
      await git(CLONE_DIR, ['clone', '--filter=blob:none', '--no-checkout', url, dir], { timeout: 10 * 60 * 1000 });
    }
    return describeRepo(dir, url);
  }
  return describeRepo(path.resolve(input));
}

async function describeRepo(dir, url) {
  if (!fs.existsSync(dir)) throw new Error(`パスが存在しません: ${dir}`);
  let root, gitDir;
  try {
    const out = await git(dir, ['rev-parse', '--show-toplevel', '--absolute-git-dir']);
    [root, gitDir] = out.trim().split(/\r?\n/);
  } catch {
    // bare repository
    const out = await git(dir, ['rev-parse', '--absolute-git-dir']).catch(() => '');
    if (!out) throw new Error(`Gitリポジトリではありません: ${dir}`);
    root = gitDir = out.trim();
  }
  root = path.normalize(root);
  gitDir = path.normalize(gitDir);
  if (!url) url = (await git(root, ['remote', 'get-url', 'origin'], { allowFail: true })).trim() || null;
  // clones made by this app have no checkout: show them as read-only mirrors of GitHub
  const managed = root.startsWith(CLONE_DIR + path.sep);
  return { root, gitDir, url, managed, label: labelFor(root, url) };
}

function labelFor(root, url) {
  const m = url && url.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  return m ? `${m[1]}/${m[2]}` : path.basename(root);
}

const US = '\x1f', RS = '\x1e';

async function snapshot(repo) {
  const cwd = repo.root;
  const [refsOut, headOut, headSha, statusOut, logOut, remotesOut, stashOut, wtOut] = await Promise.all([
    git(cwd, ['for-each-ref', `--format=%(refname)${US}%(objectname)${US}%(*objectname)${US}%(upstream)${US}%(upstream:track)${US}%(committerdate:unix)${US}%(subject)`, 'refs/heads', 'refs/remotes', 'refs/tags']),
    git(cwd, ['symbolic-ref', '-q', 'HEAD'], { allowFail: true }),
    git(cwd, ['rev-parse', '-q', '--verify', 'HEAD'], { allowFail: true }),
    repo.managed ? '' : git(cwd, ['status', '--porcelain=v1', '--untracked-files=normal'], { allowFail: true }),
    git(cwd, ['log', '--branches', '--remotes', '--tags', 'HEAD', '--topo-order', `-n${state.limit}`, `--format=%H${US}%P${US}%an${US}%ae${US}%at${US}%s${RS}`], { allowFail: true }),
    git(cwd, ['remote', '-v'], { allowFail: true }),
    git(cwd, ['stash', 'list', '--format=%gd'], { allowFail: true }),
    git(cwd, ['worktree', 'list', '--porcelain'], { allowFail: true }),
  ]);

  const refs = [];
  for (const line of refsOut.split('\n')) {
    if (!line) continue;
    const [name, sha, peeled, upstream, track, date, subject] = line.split(US);
    if (name.endsWith('/HEAD')) continue;
    const ref = { name, sha: peeled || sha, date: Number(date), subject };
    if (name.startsWith('refs/heads/')) {
      ref.type = 'local';
      ref.short = name.slice(11);
      ref.upstream = upstream ? upstream.replace(/^refs\/remotes\//, '') : null;
      ref.gone = /gone/.test(track);
      ref.ahead = Number((track.match(/ahead (\d+)/) || [])[1] || 0);
      ref.behind = Number((track.match(/behind (\d+)/) || [])[1] || 0);
    } else if (name.startsWith('refs/remotes/')) {
      ref.type = 'remote';
      ref.short = name.slice(13);
      ref.remote = ref.short.split('/')[0];
    } else {
      ref.type = 'tag';
      ref.short = name.slice(10);
    }
    refs.push(ref);
  }

  const commits = [];
  for (const rec of logOut.split(RS)) {
    const r = rec.replace(/^\s+/, '');
    if (!r) continue;
    const [sha, parents, author, email, time, subject] = r.split(US);
    commits.push({ sha, parents: parents ? parents.split(' ') : [], author, email, time: Number(time), subject });
  }

  const remotes = {};
  for (const line of remotesOut.split('\n')) {
    const m = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)/);
    if (m && m[3] === 'fetch') remotes[m[1]] = m[2];
  }

  const worktrees = [];
  let cur = null;
  for (const line of wtOut.split('\n')) {
    if (line.startsWith('worktree ')) { cur = { path: line.slice(9) }; worktrees.push(cur); }
    else if (cur && line.startsWith('HEAD ')) cur.sha = line.slice(5);
    else if (cur && line.startsWith('branch ')) cur.branch = line.slice(7).replace(/^refs\/heads\//, '');
    else if (cur && line === 'bare') cur.bare = true;
  }

  const changes = statusOut.split('\n').filter(Boolean);
  return {
    repo: { label: repo.label, root: repo.root, url: repo.url, managed: repo.managed },
    head: {
      branch: headOut.trim() ? headOut.trim().replace(/^refs\/heads\//, '') : null,
      sha: headSha.trim() || null,
    },
    working: repo.managed ? null : {
      staged: changes.filter(l => l[0] !== ' ' && l[0] !== '?').length,
      unstaged: changes.filter(l => l[1] !== ' ' && l[0] !== '?').length,
      untracked: changes.filter(l => l.startsWith('??')).length,
    },
    refs,
    commits,
    remotes,
    stashes: stashOut.split('\n').filter(Boolean).length,
    worktrees,
    limit: state.limit,
    truncated: commits.length >= state.limit,
  };
}

// ---------- realtime ----------
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

function meta() {
  return {
    fetchInterval: state.fetchInterval,
    limit: state.limit,
    lastFetch: state.lastFetch,
    fetchError: state.fetchError,
    fetching: state.fetching,
    recent: state.recent,
  };
}

async function refresh(force = false) {
  if (!state.repo) return;
  const repo = state.repo;
  try {
    const snap = await snapshot(repo);
    if (repo !== state.repo) return; // repo switched meanwhile
    const sig = JSON.stringify([snap.head, snap.working, snap.refs.map(r => r.name + r.sha + (r.upstream || '') + r.ahead + r.behind), snap.commits.length, snap.stashes, snap.worktrees]);
    if (force || sig !== state.signature) {
      state.signature = sig;
      state.snapshot = { ...snap, updatedAt: Date.now() };
      broadcast('snapshot', { ...state.snapshot, meta: meta() });
    }
  } catch (e) {
    broadcast('error', { message: e.message });
  }
}

function scheduleRefresh() {
  clearTimeout(refreshQueued);
  refreshQueued = setTimeout(() => refresh(), 250);
}

async function doFetch() {
  if (!state.repo || state.fetching) return;
  state.fetching = true;
  broadcast('meta', meta());
  try {
    await git(state.repo.root, ['fetch', '--all', '--prune', '--tags', '--quiet'], { timeout: 120000 });
    if (state.repo.managed) await fastForwardMirror(state.repo.root);
    state.fetchError = null;
  } catch (e) {
    state.fetchError = (e.stderr || e.message || '').trim().split('\n').pop();
  }
  state.fetching = false;
  state.lastFetch = Date.now();
  broadcast('meta', meta());
  await refresh();
}

// keep local branches of a mirror clone in step with their upstream (no working tree to protect)
async function fastForwardMirror(cwd) {
  const out = await git(cwd, ['for-each-ref', `--format=%(refname)${US}%(upstream)`, 'refs/heads'], { allowFail: true });
  for (const line of out.split('\n')) {
    const [ref, up] = line.split(US);
    if (!ref || !up) continue;
    const isAncestor = await git(cwd, ['merge-base', '--is-ancestor', ref, up]).then(() => true, () => false);
    if (isAncestor) await git(cwd, ['update-ref', ref, up], { allowFail: true });
  }
}

function startFetchTimer() {
  clearInterval(fetchTimer);
  if (state.fetchInterval > 0) fetchTimer = setInterval(doFetch, state.fetchInterval * 1000);
}

function startWatching() {
  if (watcher) { watcher.close(); watcher = null; }
  clearInterval(pollTimer);
  try {
    // recursive fs.watch is supported on Windows, macOS and Linux (Node >= 20)
    watcher = fs.watch(state.repo.gitDir, { recursive: true }, (_ev, file) => {
      if (file && /(^|[\\/])(objects[\\/](?!pack)|.*\.lock$)/.test(file)) return;
      scheduleRefresh();
    });
    watcher.on('error', () => { watcher = null; });
  } catch { watcher = null; }
  // polling fallback: catches working-tree edits and filesystems where watch is unreliable
  pollTimer = setInterval(() => refresh(), POLL_MS);
}

async function openRepo(input) {
  const repo = await resolveRepo(input);
  state.repo = repo;
  state.signature = '';
  state.snapshot = null;
  state.lastFetch = null;
  state.fetchError = null;
  const key = repo.managed ? repo.label : repo.root;
  state.recent = [key, ...state.recent.filter(r => r !== key)].slice(0, 15);
  persist();
  startWatching();
  startFetchTimer();
  await refresh(true);
  return repo;
}

// ---------- http ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

function sendJSON(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // Reject cross-origin writes (simple CSRF guard for a localhost tool).
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return sendJSON(res, 403, { error: 'forbidden' });
  }

  try {
    if (p === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write('retry: 2000\n\n');
      clients.add(res);
      if (state.snapshot) res.write(`event: snapshot\ndata: ${JSON.stringify({ ...state.snapshot, meta: meta() })}\n\n`);
      else res.write(`event: meta\ndata: ${JSON.stringify(meta())}\n\n`);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => { clearInterval(ping); clients.delete(res); });
      return;
    }
    if (p === '/api/open' && req.method === 'POST') {
      const body = await readBody(req);
      const repo = await openRepo(body.repo);
      return sendJSON(res, 200, { ok: true, repo });
    }
    if (p === '/api/fetch' && req.method === 'POST') {
      doFetch();
      return sendJSON(res, 200, { ok: true });
    }
    if (p === '/api/settings' && req.method === 'POST') {
      const body = await readBody(req);
      if (body.fetchInterval !== undefined) { state.fetchInterval = Math.max(0, Number(body.fetchInterval) || 0); startFetchTimer(); }
      if (body.limit !== undefined) state.limit = Math.min(20000, Math.max(50, Number(body.limit) || 500));
      persist();
      broadcast('meta', meta());
      await refresh(true);
      return sendJSON(res, 200, { ok: true, meta: meta() });
    }
    if (p === '/api/compare') {
      // ahead/behind of every branch against a chosen base branch
      if (!state.snapshot) return sendJSON(res, 400, { error: 'no repo' });
      const known = new Set(state.snapshot.refs.filter(r => r.type !== 'tag').map(r => r.name));
      const base = url.searchParams.get('base');
      if (!known.has(base)) return sendJSON(res, 400, { error: 'unknown base' });
      const targets = [...known].filter(n => n !== base);
      const result = {};
      const cwd = state.repo.root;
      let i = 0;
      const worker = async () => {
        while (i < targets.length) {
          const ref = targets[i++];
          const out = await git(cwd, ['rev-list', '--left-right', '--count', `${base}...${ref}`], { allowFail: true });
          const [behind, ahead] = out.trim().split(/\s+/).map(Number);
          if (!Number.isNaN(ahead)) result[ref] = { ahead, behind };
        }
      };
      await Promise.all(Array.from({ length: 8 }, worker));
      return sendJSON(res, 200, { base, result });
    }
    if (p === '/api/commit') {
      if (!state.repo) return sendJSON(res, 400, { error: 'no repo' });
      const sha = url.searchParams.get('sha') || '';
      if (!/^[0-9a-f]{4,64}$/i.test(sha)) return sendJSON(res, 400, { error: 'bad sha' });
      const cwd = state.repo.root;
      const [show, contains] = await Promise.all([
        git(cwd, ['show', '--no-color', '--stat=120', `--format=%H${US}%P${US}%an <%ae>${US}%ad${US}%cn <%ce>${US}%B${RS}`, '--date=iso', sha], { allowFail: true }),
        git(cwd, ['branch', '-a', '--format=%(refname:short)', '--contains', sha], { allowFail: true }),
      ]);
      const [head, stat = ''] = show.split(RS);
      const [h, parents, author, date, committer, body] = (head || '').split(US);
      return sendJSON(res, 200, {
        sha: h, parents: parents ? parents.split(' ') : [], author, date, committer,
        body: (body || '').trim(), stat: stat.trim(),
        containedIn: contains.split('\n').map(s => s.trim()).filter(s => s && !s.endsWith('/HEAD')),
      });
    }

    // static files
    const file = path.normalize(path.join(PUBLIC_DIR, p === '/' ? 'index.html' : p));
    if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  } catch (e) {
    sendJSON(res, 500, { error: (e.stderr || e.message || String(e)).trim() });
  }
});

server.listen(PORT, HOST, async () => {
  console.log(`GitHubVisualizer: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  const initial = args.repo || process.env.GV_REPO;
  if (initial) {
    try { const r = await openRepo(initial); console.log(`watching ${r.root}`); }
    catch (e) { console.error(e.message); }
  } else {
    // no repo given: show the repository the command was run from, if any
    try { const r = await openRepo(process.cwd()); console.log(`watching ${r.root}`); }
    catch { console.log('ブラウザでリポジトリを選んでください'); }
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`ポート ${PORT} は使用中です。別のポートで起動するには --port ${PORT + 1} を付けてください`);
  else console.error(e.message);
  process.exit(1);
});
