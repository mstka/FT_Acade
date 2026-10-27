'use strict';

const ROW = 32, LANE = 18, PAD = 18;
const COLORS = ['#4f8cff', '#ff6b9a', '#22c997', '#ffb020', '#9b6bff', '#00b8f0', '#ff7a45', '#7ccf3a', '#e05cff', '#f25f5c'];
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ui = {
  snap: null,
  meta: null,
  tab: 'lanes',
  panel: 'info',
  focus: { kind: 'head' },  // what the info panel explains: head | ref | commit
  selectedRef: null,        // full refname highlighted in the views
  selectedSha: null,
  commitCache: new Map(),
  filter: '',
  base: null,
  compare: null,
  log: [],
  unseen: 0,
  lastFetchError: null,
  showMerged: true,
  lanesBaseKey: '',
};

// ---------- realtime connection ----------
function connect() {
  const es = new EventSource('/api/events');
  es.onopen = () => setLive('on', 'ライブ');
  es.onerror = () => setLive('off', '再接続中…');
  es.addEventListener('snapshot', e => onSnapshot(JSON.parse(e.data)));
  es.addEventListener('meta', e => onMeta(JSON.parse(e.data)));
  es.addEventListener('status', e => toast('⏳', JSON.parse(e.data).message));
  es.addEventListener('error', e => { if (e.data) toast('⚠', JSON.parse(e.data).message, 'error'); });
}

function setLive(cls, text) {
  const live = $('#live');
  live.className = 'live ' + cls;
  live.lastElementChild.textContent = text;
}

function onMeta(meta) {
  ui.meta = meta;
  $('#fetch-interval').value = String(meta.fetchInterval);
  $('#limit').value = String(meta.limit);
  $('#recent').innerHTML = meta.recent.length
    ? '<div class="recent-title">最近ひらいた</div>' + meta.recent.map(r => `<button type="button" class="recent-item" data-open="${esc(r)}">${esc(r.split(/[\\/]/).slice(-2).join('/'))}<small>${esc(r)}</small></button>`).join('')
    : '';
  const btn = $('#fetch-now');
  btn.disabled = meta.fetching;
  btn.classList.toggle('spinning', meta.fetching);
  $('#fetch-label').textContent = meta.fetching ? '確認中…' : meta.lastFetch ? `GitHub を確認 · ${relMs(meta.lastFetch)}` : 'GitHub を確認';
  if (meta.fetching) setLive('busy', '確認中');
  else if ($('#live').classList.contains('busy')) setLive('on', 'ライブ');
  if (meta.fetchError && meta.fetchError !== ui.lastFetchError) toast('⚠', 'GitHub の確認に失敗: ' + meta.fetchError, 'error');
  ui.lastFetchError = meta.fetchError;
}

function onSnapshot(snap) {
  if (snap.meta) onMeta(snap.meta);
  const sameRepo = ui.snap && ui.snap.repo.root === snap.repo.root;
  const fresh = new Set();
  if (sameRepo) {
    diffRefs(ui.snap, snap);
    const old = new Set(ui.snap.commits.map(c => c.sha));
    for (const c of snap.commits) if (!old.has(c.sha)) fresh.add(c.sha);
  } else {
    Object.assign(ui, { log: [], unseen: 0, selectedRef: null, selectedSha: null, base: null, focus: { kind: 'head' } });
    ui.commitCache.clear();
    $('#repo-input').value = snap.repo.managed ? snap.repo.label : snap.repo.root;
  }
  ui.snap = snap;
  ui.compare = null;
  document.title = `${snap.repo.label} - Git ビジュアライザー`;
  $('#repo-name').textContent = snap.repo.label;
  $('#welcome').classList.add('hidden');
  if (ui.selectedRef && !snap.refs.some(r => r.name === ui.selectedRef)) { ui.selectedRef = null; ui.focus = { kind: 'head' }; }
  ui.freshShas = fresh;
  renderView();
  renderPanel();
}

function diffRefs(a, b) {
  const before = new Map(a.refs.map(r => [r.name, r]));
  const after = new Map(b.refs.map(r => [r.name, r]));
  const t = new Date();
  const events = [];
  const where = r => r.type === 'remote' ? '☁' : r.type === 'tag' ? '🏷' : '💻';
  for (const [n, r] of after) {
    const o = before.get(n);
    if (!o) events.push({ icon: '✨', kind: 'created', ref: r.name, text: `${where(r)} ${r.short} ができた` });
    else if (o.sha !== r.sha) events.push({ icon: r.type === 'remote' ? '☁' : '➕', kind: 'moved', ref: r.name, text: `${where(r)} ${r.short} が進んだ`, sub: r.subject });
  }
  for (const [n, r] of before) if (!after.has(n)) events.push({ icon: '🗑', kind: 'deleted', text: `${where(r)} ${r.short} が消えた` });
  if (a.head.branch !== b.head.branch) events.push({ icon: '📍', kind: 'moved', ref: b.head.branch ? 'refs/heads/' + b.head.branch : null, text: `${b.head.branch || 'detached'} に移動した` });
  for (const e of events) ui.log.unshift({ t, ...e });
  ui.log.length = Math.min(ui.log.length, 100);
  if (events.length) {
    if (ui.panel !== 'log') ui.unseen += events.length;
    const e = events[0];
    toast(e.icon, events.length === 1 ? e.text : `${e.text} ほか ${events.length - 1} 件`);
  }
}

// ---------- shared status vocabulary ----------
function hasRemote(s = ui.snap) { return Object.keys(s.remotes).length > 0; }

function branchStatus(r, s = ui.snap) {
  if (r.type === 'remote') {
    const local = s.refs.find(l => l.type === 'local' && l.upstream === r.short);
    const name = r.short.slice(r.remote.length + 1);
    return local
      ? { cls: 'linked', badge: '', say: `自分のPCの「${local.short}」とつながっています。` }
      : { cls: 'remote-only', badge: 'PCに無い', say: 'GitHub にだけあるブランチです。自分のPCでも作業するなら取り込みましょう。', cmd: `git switch ${name}` };
  }
  if (!hasRemote(s)) return { cls: 'none', badge: '', say: 'このリポジトリは GitHub とつながっていません。' };
  if (r.gone) return { cls: 'warn', badge: '✕', say: 'GitHub 側のブランチは削除されています(マージ済みかもしれません)。', cmd: 'git switch main' };
  if (!r.upstream) return { cls: 'new', badge: 'NEW', say: 'まだ GitHub に送っていない、新しいブランチです。', cmd: `git push -u origin ${r.short}` };
  if (r.ahead && r.behind) return { cls: 'warn', badge: `⬆${r.ahead} ⬇${r.behind}`, say: '自分のPCと GitHub の両方に新しいコミットがあります。先に取り込んでから送りましょう。', cmd: 'git pull' };
  if (r.ahead) return { cls: 'ahead', badge: `⬆${r.ahead}`, say: `GitHub にまだ送っていないコミットが ${r.ahead} 件あります。`, cmd: 'git push' };
  if (r.behind) return { cls: 'behind', badge: `⬇${r.behind}`, say: `GitHub に新しいコミットが ${r.behind} 件あります。`, cmd: 'git pull' };
  return { cls: 'ok', badge: '✓', say: 'GitHub と同じ、最新の状態です。' };
}

function dirtyCount(s = ui.snap) {
  const w = s.working;
  return w ? w.staged + w.unstaged + w.untracked : 0;
}

// ---------- info panel ----------
function renderPanel() {
  document.querySelectorAll('.ptab').forEach(b => b.classList.toggle('active', b.dataset.ptab === ui.panel));
  const count = $('#log-count');
  count.textContent = ui.unseen;
  count.classList.toggle('hidden', !ui.unseen);
  const body = $('#pbody');
  if (!ui.snap) { body.innerHTML = helpHTML(); return; }
  if (ui.panel === 'log') body.innerHTML = logHTML();
  else if (ui.panel === 'help') body.innerHTML = helpHTML();
  else if (ui.focus.kind === 'ref') body.innerHTML = refHTML(ui.snap.refs.find(r => r.name === ui.focus.name));
  else if (ui.focus.kind === 'commit') body.innerHTML = commitHTML(ui.focus.sha);
  else body.innerHTML = headHTML();
}

function bpill(name, color, extra = '') {
  return `<span class="bpill" style="--c:${color}">${extra}${esc(name)}</span>`;
}

function cmdHTML(cmd) {
  return cmd ? `<div class="cmd"><code>${esc(cmd)}</code><button type="button" class="copy" data-copy="${esc(cmd)}" title="コピー">📋</button></div>` : '';
}

function syncViz(r) {
  const s = ui.snap;
  if (r.type === 'remote') {
    const local = s.refs.find(l => l.type === 'local' && l.upstream === r.short);
    if (local) return syncViz(local);
    return `<div class="syncviz"><div class="node pc off">💻<span>自分のPC</span></div>
      <div class="arrows"><div class="arr none">まだ無い</div></div>
      <div class="node gh">☁<span>GitHub</span></div></div>`;
  }
  if (!r.upstream || r.gone) {
    return `<div class="syncviz"><div class="node pc">💻<span>自分のPC</span></div>
      <div class="arrows"><div class="arr none">${r.gone ? '削除済み' : 'まだ送っていない'}</div></div>
      <div class="node gh off">☁<span>GitHub</span></div></div>`;
  }
  return `<div class="syncviz"><div class="node pc">💻<span>自分のPC</span></div>
    <div class="arrows">
      <div class="arr up ${r.ahead ? 'on' : ''}"><b>${r.ahead}</b> push 待ち ➜</div>
      <div class="arr down ${r.behind ? 'on' : ''}">⬅ pull 待ち <b>${r.behind}</b></div>
    </div>
    <div class="node gh">☁<span>GitHub</span></div></div>`;
}

function headHTML() {
  const s = ui.snap;
  const cur = s.refs.find(r => r.type === 'local' && r.short === s.head.branch);
  let html = `<div class="pcard here-card">
    <div class="eyebrow">📍 いまいる場所</div>
    <div class="title-row">${cur ? bpill(cur.short, branchColor(branchKey(cur))) : `<span class="bpill" style="--c:var(--muted)">detached ${esc((s.head.sha || '').slice(0, 7))}</span>`}</div>
  </div>`;
  const w = s.working;
  if (w && dirtyCount()) {
    html += `<div class="pcard step wip">
      <div class="eyebrow">✏ まだコミットしていない変更</div>
      <div class="mini-bubbles">
        ${w.unstaged ? `<div><b>${w.unstaged}</b>変更</div>` : ''}${w.untracked ? `<div><b>${w.untracked}</b>新しいファイル</div>` : ''}${w.staged ? `<div><b>${w.staged}</b>add 済み</div>` : ''}
      </div>
      <p class="say">変更を記録(コミット)しましょう。</p>
      ${cmdHTML('git add .')}${cmdHTML('git commit -m "やったこと"')}
    </div>`;
  }
  if (cur) {
    const st = branchStatus(cur);
    html += `<div class="pcard step st-${st.cls}">
      <div class="eyebrow">🔄 GitHub との関係</div>
      ${hasRemote() ? syncViz(cur) : ''}
      <p class="say">${esc(st.say)}</p>${cmdHTML(st.cmd)}
    </div>`;
    if (st.cls === 'ok' && !dirtyCount()) {
      html += `<div class="pcard celebrate"><div class="big">🎉</div><p>すべて最新です！<br>新しい作業はブランチを作って始めましょう。</p>${cmdHTML('git switch -c feature/やること')}</div>`;
    }
  }
  return html;
}

function refHTML(r) {
  if (!r) return headHTML();
  const st = r.type === 'tag' ? { say: 'リリースなどの目印として付けた名前です。' } : branchStatus(r);
  const place = r.type === 'remote' ? '<span class="place gh">☁ GitHub</span>' : r.type === 'tag' ? '<span class="place tag">🏷 タグ</span>' : '<span class="place pc">💻 自分のPC</span>';
  const isHead = r.type === 'local' && r.short === ui.snap.head.branch;
  return `<button type="button" class="back" data-back>← いまいる場所へ</button>
    <div class="pcard">
      <div class="eyebrow">${place}${isHead ? '<span class="place here">📍 いまここ</span>' : ''}</div>
      <div class="title-row">${bpill(r.short, branchColor(branchKey(r)))}</div>
      ${r.type !== 'tag' && hasRemote() ? syncViz(r) : ''}
      <p class="say">${esc(st.say)}</p>${cmdHTML(st.cmd)}
    </div>
    <div class="pcard">
      <div class="eyebrow">🕐 いちばん新しいコミット</div>
      <div class="commit-mini" data-commit="${r.sha}"><b>${esc(r.subject)}</b><span>${rel(r.date)} · ${r.sha.slice(0, 7)}</span></div>
    </div>`;
}

function commitHTML(sha) {
  const d = ui.commitCache.get(sha);
  if (!d) return '<div class="pcard"><div class="eyebrow">読み込み中…</div></div>';
  if (d.error) return `<div class="pcard">${esc(d.error)}</div>`;
  const [title, ...rest] = d.body.split('\n');
  const gh = githubWebUrl(ui.snap.repo.url);
  const s = ui.snap;
  const inPC = d.containedIn.filter(b => s.refs.some(r => r.type === 'local' && r.short === b));
  const inGH = d.containedIn.filter(b => s.refs.some(r => r.type === 'remote' && r.short === b));
  const files = d.stat.split('\n').filter(l => l.includes('|')).map(l => {
    const [f, ch] = l.split('|');
    return `<li><span class="fname">📄 ${esc(f.trim())}</span><span class="fch">${esc(ch.replace(/\d+/, '').trim().replace(/\+/g, '＋').replace(/-/g, '－').slice(0, 12))}</span></li>`;
  }).join('');
  return `<button type="button" class="back" data-back>← いまいる場所へ</button>
    <div class="pcard">
      <div class="eyebrow">${d.parents.length > 1 ? '🔀 マージ(合流)したコミット' : '● コミット'}</div>
      <h3 class="ctitle">${esc(title)}</h3>
      ${rest.join('\n').trim() ? `<p class="cbody">${esc(rest.join('\n').trim())}</p>` : ''}
      <div class="who"><span class="avatar">${esc((d.author || '?').trim()[0])}</span><div><b>${esc(d.author.replace(/\s*<.*>/, ''))}</b><span>${esc(d.date)}</span></div></div>
      <div class="hash"><code>${d.sha.slice(0, 7)}</code>${gh ? `<a href="${esc(gh)}/commit/${d.sha}" target="_blank" rel="noopener">GitHub で見る ↗</a>` : ''}</div>
    </div>
    <div class="pcard">
      <div class="eyebrow">📦 このコミットがある場所</div>
      <div class="where-grid">
        <div class="where pc ${inPC.length ? '' : 'off'}"><div class="wh">💻 自分のPC</div>${inPC.map(b => bpill(b, branchColor(b))).join('') || '<span class="muted">まだ無い</span>'}</div>
        <div class="where gh ${inGH.length ? '' : 'off'}"><div class="wh">☁ GitHub</div>${inGH.map(b => bpill(b.replace(/^[^/]+\//, ''), branchColor(b.replace(/^[^/]+\//, '')))).join('') || '<span class="muted">まだ無い</span>'}</div>
      </div>
    </div>
    ${files ? `<div class="pcard"><div class="eyebrow">📝 変更したファイル</div><ul class="files">${files}</ul></div>` : ''}`;
}

function logHTML() {
  if (!ui.log.length) return '<div class="empty-note"><div class="big">🕊️</div>まだ何も起きていません。<br>commit や push をすると、ここに流れてきます。</div>';
  return `<ul class="timeline">${ui.log.map(e => `
    <li class="ev ${e.kind}" ${e.ref ? `data-ref="${esc(e.ref)}"` : ''}>
      <span class="ev-icon">${e.icon}</span>
      <div><div class="ev-text">${esc(e.text)}</div>${e.sub ? `<div class="ev-sub">${esc(e.sub)}</div>` : ''}</div>
      <time>${e.t.toLocaleTimeString().slice(0, 5)}</time>
    </li>`).join('')}</ul>`;
}

function helpHTML() {
  const dot = (extra = '') => `<svg width="30" height="30" viewBox="0 0 30 30">${extra}<circle cx="15" cy="15" r="8" fill="var(--blue)" stroke="var(--card)" stroke-width="3"/></svg>`;
  return `<div class="pcard"><div class="eyebrow">🗺️ マップの見かた</div>
    <p class="say">横の線が 1 本のブランチ。<b>左が昔、右が最新</b>です。上が GitHub、下が自分のPC。</p>
    <ul class="legend-list">
      <li>${dot()}<div><b>コミット</b><span>変更を記録したところ</span></div></li>
      <li><svg width="30" height="30"><circle cx="15" cy="15" r="7" fill="var(--card)" stroke="var(--blue)" stroke-width="4"/></svg><div><b>マージ</b><span>ブランチが合流したところ</span></div></li>
      <li>${dot('<circle cx="15" cy="15" r="13" class="halo unpushed"/>')}<div><b>まだ送っていない</b><span>PC にだけあるコミット</span></div></li>
      <li>${dot('<circle cx="15" cy="15" r="13" class="halo notpulled"/>')}<div><b>まだ取り込んでいない</b><span>GitHub にだけあるコミット</span></div></li>
      <li><span class="lg-emoji">📍</span><div><b>いまいる場所</b><span>作業中のブランチ</span></div></li>
      <li><svg width="30" height="30"><circle cx="15" cy="15" r="8" class="wipdot"/></svg><div><b>コミット前の変更</b><span>まだ記録していない作業</span></div></li>
    </ul></div>
    <div class="pcard"><div class="eyebrow">🏷️ ブランチ横のバッジ</div>
    <ul class="legend-list badges">
      <li><span class="sbadge st-ok">✓</span><div><b>最新</b><span>GitHub と同じ</span></div></li>
      <li><span class="sbadge st-ahead">⬆2</span><div><b>push 待ち</b><span>送っていないコミットの数</span></div></li>
      <li><span class="sbadge st-behind">⬇1</span><div><b>pull 待ち</b><span>取り込んでいないコミットの数</span></div></li>
      <li><span class="sbadge st-warn">⬆1 ⬇1</span><div><b>食い違い</b><span>pull してから push</span></div></li>
      <li><span class="sbadge st-new">NEW</span><div><b>新しいブランチ</b><span>まだ GitHub に無い</span></div></li>
      <li><span class="sbadge st-remote-only">PCに無い</span><div><b>GitHub だけ</b><span>PC にはまだ無い</span></div></li>
    </ul></div>
    <div class="pcard"><div class="eyebrow">📖 ことば</div>
    <dl class="glossary">
      <dt>commit</dt><dd>作業をセーブすること</dd>
      <dt>branch</dt><dd>作業を分けるための枝分かれ</dd>
      <dt>push</dt><dd>PC → GitHub へ送る</dd>
      <dt>pull</dt><dd>GitHub → PC へ取り込む</dd>
      <dt>merge</dt><dd>ブランチを合流させる</dd>
    </dl></div>`;
}

// ---------- commit graph (detailed view) ----------
function computeLayout(commits) {
  const lanes = [];
  const pos = new Array(commits.length);
  const edges = [];
  let width = 1;
  for (let i = 0; i < commits.length; i++) {
    const c = commits[i];
    let lane = lanes.indexOf(c.sha);
    if (lane === -1) {
      lane = lanes.indexOf(null);
      if (lane === -1) { lane = lanes.length; lanes.push(null); }
    }
    for (let k = 0; k < lanes.length; k++) if (lanes[k] === c.sha) lanes[k] = null;
    pos[i] = lane;
    c.parents.forEach((p, pi) => {
      let carrier = lanes.indexOf(p);
      if (carrier === -1) {
        if (pi === 0 && lanes[lane] === null) carrier = lane;
        else {
          carrier = lanes.indexOf(null);
          if (carrier === -1) { carrier = lanes.length; lanes.push(null); }
        }
        lanes[carrier] = p;
      }
      edges.push({ from: i, parent: p, carrier });
    });
    while (lanes.length && lanes[lanes.length - 1] === null) lanes.pop();
    width = Math.max(width, lane + 1, lanes.length);
  }
  return { pos, edges, width };
}

const laneX = l => PAD + l * LANE;
const rowY = i => i * ROW + ROW / 2;

function renderGraph() {
  const s = ui.snap;
  const commits = s.commits;
  const L = computeLayout(commits);
  const index = new Map(commits.map((c, i) => [c.sha, i]));
  const graphW = PAD * 2 + (L.width - 1) * LANE;
  const totalH = commits.length * ROW;
  const lit = ui.selectedRef ? ancestry(refSha(ui.selectedRef), index) : null;

  let paths = '';
  for (const e of L.edges) {
    const i = e.from, j = index.get(e.parent);
    const x1 = laneX(L.pos[i]), y1 = rowY(i), xk = laneX(e.carrier);
    const color = COLORS[e.carrier % COLORS.length];
    const dim = lit && !(lit.has(commits[i].sha) && lit.has(e.parent)) ? ' class="dim"' : '';
    if (j === undefined) {
      paths += `<path d="M${x1},${y1} ${curve(x1, y1, xk, y1 + ROW)} L${xk},${totalH}" stroke="${color}" stroke-dasharray="3 4"${dim}/>`;
      continue;
    }
    const x2 = laneX(L.pos[j]), y2 = rowY(j);
    let d = `M${x1},${y1}`;
    if (j - i <= 1) d += curve(x1, y1, x2, y2);
    else {
      d += xk === x1 ? `L${x1},${y1 + ROW}` : curve(x1, y1, xk, y1 + ROW);
      d += ` L${xk},${y2 - ROW}`;
      d += xk === x2 ? ` L${x2},${y2}` : curve(xk, y2 - ROW, x2, y2);
    }
    paths += `<path d="${d}" stroke="${color}"${dim}/>`;
  }

  let dots = '';
  commits.forEach((c, i) => {
    const color = COLORS[L.pos[i] % COLORS.length];
    const merge = c.parents.length > 1;
    const cls = [merge ? 'merge' : '', c.sha === s.head.sha ? 'head' : '', lit && !lit.has(c.sha) ? 'dim' : ''].join(' ');
    dots += `<circle cx="${laneX(L.pos[i])}" cy="${rowY(i)}" r="${merge ? 4.5 : 6}" fill="${merge ? 'var(--card)' : color}" stroke="${merge ? color : 'var(--card)'}" class="${cls}"/>`;
  });

  const refsAt = groupRefs(s);
  const filter = ui.filter.toLowerCase();
  const rows = commits.map((c, i) => {
    const badges = (refsAt.get(c.sha) || []).join('');
    const wip = c.sha === s.head.sha && dirtyCount() ? '<span class="gbadge wip">✏ 未コミット</span>' : '';
    const hit = !filter || (c.subject + ' ' + c.author + ' ' + c.sha).toLowerCase().includes(filter);
    const cls = ['row', ui.selectedSha === c.sha ? 'selected' : '', lit && !lit.has(c.sha) ? 'dim' : '', hit ? '' : 'filtered', ui.freshShas?.has(c.sha) ? 'fresh' : ''].join(' ');
    return `<div class="${cls}" data-commit="${c.sha}" style="padding-left:${graphW}px">
      <div class="msg">${wip}${badges}<span class="subject">${esc(c.subject)}</span></div>
      <div class="meta"><span class="avatar sm">${esc((c.author || '?')[0])}</span><span class="when">${rel(c.time)}</span></div>
    </div>`;
  }).join('');

  const scroller = $('#graph-scroll');
  const keep = scroller.scrollTop;
  $('#graph-inner').innerHTML = `
    <svg class="graph" width="${graphW}" height="${totalH}">${paths}${dots}</svg>
    ${rows}
    ${s.truncated ? `<div class="more-row">最新 ${s.limit} 件まで表示中(⚙ で増やせます)</div>` : ''}`;
  scroller.scrollTop = keep;
}

function curve(x1, y1, x2, y2) {
  const my = (y1 + y2) / 2;
  return ` C${x1},${my} ${x2},${my} ${x2},${y2}`;
}

// badges per commit; a local branch and its upstream on the same commit merge into one badge
function groupRefs(s) {
  const map = new Map();
  const add = (sha, html) => (map.get(sha) || map.set(sha, []).get(sha)).push(html);
  const remotesByName = new Map(s.refs.filter(r => r.type === 'remote').map(r => [r.short, r]));
  const used = new Set();
  if (!s.head.branch && s.head.sha) add(s.head.sha, '<span class="gbadge head">📍 HEAD</span>');
  for (const r of s.refs.filter(r => r.type === 'local')) {
    const up = r.upstream && remotesByName.get(r.upstream);
    const color = branchColor(branchKey(r));
    const here = r.short === s.head.branch ? '📍 ' : '';
    if (up && up.sha === r.sha) {
      used.add(up.name);
      add(r.sha, `<span class="gbadge" style="--c:${color}" data-ref="${esc(r.name)}" title="PC と GitHub で同じ位置">${here}${esc(r.short)} <i>💻☁</i></span>`);
    } else {
      add(r.sha, `<span class="gbadge" style="--c:${color}" data-ref="${esc(r.name)}" title="自分のPC">${here}${esc(r.short)} <i>💻</i></span>`);
    }
  }
  for (const r of s.refs) {
    if (r.type === 'remote' && !used.has(r.name)) add(r.sha, `<span class="gbadge remote" style="--c:${branchColor(branchKey(r))}" data-ref="${esc(r.name)}" title="GitHub">${esc(branchKey(r))} <i>☁</i></span>`);
    if (r.type === 'tag') add(r.sha, `<span class="gbadge tag" data-ref="${esc(r.name)}">🏷 ${esc(r.short)}</span>`);
  }
  return map;
}

function refSha(name) { return ui.snap.refs.find(r => r.name === name)?.sha; }

function ancestry(sha, index) {
  const set = new Set();
  const stack = sha ? [sha] : [];
  while (stack.length) {
    const h = stack.pop();
    if (set.has(h)) continue;
    set.add(h);
    const i = index.get(h);
    if (i !== undefined) stack.push(...ui.snap.commits[i].parents);
  }
  return set;
}

// ---------- sync view ----------
async function renderSync() {
  const s = ui.snap;
  const view = $('#view-sync');
  const locals = s.refs.filter(r => r.type === 'local').sort((a, b) => (b.short === s.head.branch) - (a.short === s.head.branch) || b.date - a.date);
  const remotes = s.refs.filter(r => r.type === 'remote');
  const branches = [...locals, ...remotes];
  if (!ui.base || !branches.some(b => b.name === ui.base)) ui.base = guessBase(s);
  const tracked = new Set(locals.map(l => l.upstream).filter(Boolean));
  const remoteOnly = remotes.filter(r => !tracked.has(r.short)).sort((a, b) => b.date - a.date);
  const baseRef = branches.find(b => b.name === ui.base);

  const cmp = ui.compare?.base === ui.base ? ui.compare.result : null;
  const maxDiv = cmp ? Math.max(1, ...Object.values(cmp).map(v => Math.max(v.ahead, v.behind))) : 1;
  const divCell = r => {
    if (r.name === ui.base) return '<span class="muted">基準</span>';
    const v = cmp?.[r.name];
    if (!v) return '<span class="muted">…</span>';
    const w = n => n ? Math.max(4, Math.round(Math.sqrt(n / maxDiv) * 70)) : 0;
    return `<div class="divbar" title="基準より ${v.behind} 遅れ / ${v.ahead} 進み"><span class="n">${v.behind}</span><div class="l" style="width:${w(v.behind)}px"></div><div class="mid"></div><div class="r" style="width:${w(v.ahead)}px"></div><span class="n">${v.ahead}</span></div>`;
  };
  const card = r => {
    const st = branchStatus(r);
    return `<div class="scard" data-ref="${esc(r.name)}">
      <div class="scard-top">${bpill(r.type === 'remote' ? branchKey(r) : r.short, branchColor(branchKey(r)), r.short === s.head.branch && r.type === 'local' ? '📍 ' : '')}${st.badge ? `<span class="sbadge st-${st.cls}">${esc(st.badge)}</span>` : ''}</div>
      ${divCell(r)}
      <div class="scard-sub">${esc(r.subject)} · ${rel(r.date)}</div>
    </div>`;
  };
  const opts = branches.map(b => `<option value="${esc(b.name)}" ${b.name === ui.base ? 'selected' : ''}>${esc(b.short)}</option>`).join('');
  view.innerHTML = `<div class="sync">
    <div class="sync-head">
      <div class="basepick">くらべる相手 <select id="base-select">${opts}</select></div>
      <div class="divlegend"><span><i class="l"></i>遅れ</span><span><i class="r"></i>進み</span></div>
    </div>
    <h2><span class="place pc">💻 自分のPC</span></h2>
    <div class="scards">${locals.map(card).join('') || '<p class="muted">ブランチがありません</p>'}</div>
    <h2><span class="place gh">☁ GitHub にだけある</span></h2>
    <div class="scards">${remoteOnly.map(card).join('') || '<p class="muted">ありません 👍</p>'}</div>
  </div>`;

  if (!cmp && baseRef) {
    const base = ui.base;
    const res = await fetch('/api/compare?base=' + encodeURIComponent(base)).then(r => r.json()).catch(() => null);
    if (res && !res.error && ui.base === base && ui.tab === 'sync') { ui.compare = res; renderSync(); }
  }
}

function guessBase(s) {
  const names = s.refs.map(r => r.name);
  for (const n of ['refs/heads/main', 'refs/heads/master', 'refs/heads/develop', 'refs/remotes/origin/main', 'refs/remotes/origin/master']) if (names.includes(n)) return n;
  return s.head.branch ? 'refs/heads/' + s.head.branch : s.refs.find(r => r.type !== 'tag')?.name;
}

// ---------- navigation ----------
function renderView() {
  if (!ui.snap) return;
  if (ui.tab === 'lanes') renderLanes();
  else if (ui.tab === 'graph') renderGraph();
  else renderSync();
}

function switchTab(tab) {
  ui.tab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  for (const v of ['lanes', 'graph', 'sync']) $('#view-' + v).classList.toggle('hidden', v !== tab);
  $('#filter').classList.toggle('hidden', tab !== 'graph');
  renderView();
}

function selectRef(name) {
  if (ui.selectedRef === name) { ui.selectedRef = null; ui.focus = { kind: 'head' }; }
  else { ui.selectedRef = name; ui.focus = { kind: 'ref', name }; }
  ui.panel = 'info';
  renderView();
  renderPanel();
  if (ui.selectedRef && ui.tab === 'graph') scrollToSha(refSha(name));
}

function scrollToSha(sha) {
  const el = sha && document.querySelector(`.row[data-commit="${sha}"]`);
  if (!el) return;
  const sc = $('#graph-scroll');
  sc.scrollTo({ top: el.offsetTop - sc.clientHeight / 3, behavior: 'smooth' });
}

async function showCommit(sha) {
  ui.selectedSha = sha;
  ui.focus = { kind: 'commit', sha };
  ui.panel = 'info';
  renderView();
  renderPanel();
  if (!ui.commitCache.has(sha)) {
    const d = await fetch('/api/commit?sha=' + sha).then(r => r.json()).catch(e => ({ error: e.message }));
    ui.commitCache.set(sha, d);
    if (ui.focus.kind === 'commit' && ui.focus.sha === sha) renderPanel();
  }
}

// ---------- misc ----------
function rel(sec) {
  const d = Date.now() / 1000 - sec;
  if (d < 60) return 'たった今';
  if (d < 3600) return Math.floor(d / 60) + '分前';
  if (d < 86400) return Math.floor(d / 3600) + '時間前';
  if (d < 86400 * 30) return Math.floor(d / 86400) + '日前';
  if (d < 86400 * 365) return Math.floor(d / 86400 / 30) + 'ヶ月前';
  return Math.floor(d / 86400 / 365) + '年前';
}
const relMs = ms => rel(ms / 1000);

function githubWebUrl(url) {
  const m = url && url.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  return m ? `https://github.com/${m[1]}/${m[2]}` : null;
}

function toast(icon, msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = `<span class="t-icon">${esc(icon)}</span><span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), kind === 'error' ? 6500 : 3200);
  setTimeout(() => el.remove(), kind === 'error' ? 7000 : 3700);
}

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function openRepo(value) {
  $('#repo-menu').classList.add('hidden');
  const btn = $('#open-form button');
  btn.disabled = true;
  try { await post('/api/open', { repo: value }); }
  catch (err) { toast('⚠', err.message, 'error'); }
  btn.disabled = false;
}

// ---------- events ----------
$('#open-form').addEventListener('submit', e => { e.preventDefault(); openRepo($('#repo-input').value); });
$('#fetch-now').addEventListener('click', () => post('/api/fetch').catch(err => toast('⚠', err.message, 'error')));
$('#fetch-interval').addEventListener('change', e => post('/api/settings', { fetchInterval: Number(e.target.value) }));
$('#limit').addEventListener('change', e => post('/api/settings', { limit: Number(e.target.value) }));
$('#show-merged').addEventListener('change', e => { ui.showMerged = e.target.checked; renderView(); });
$('#filter').addEventListener('input', e => { ui.filter = e.target.value; renderGraph(); });
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('.ptab').forEach(t => t.addEventListener('click', () => {
  ui.panel = t.dataset.ptab;
  if (ui.panel === 'log') ui.unseen = 0;
  renderPanel();
}));
for (const [btn, menu] of [['#repo-btn', '#repo-menu'], ['#settings-btn', '#settings-menu']]) {
  $(btn).addEventListener('click', e => {
    e.stopPropagation();
    document.querySelectorAll('.pop-menu').forEach(m => m !== $(menu) && m.classList.add('hidden'));
    $(menu).classList.toggle('hidden');
    if (menu === '#repo-menu' && !$(menu).classList.contains('hidden')) $('#repo-input').select();
  });
}

document.addEventListener('click', e => {
  if (!e.target.closest('.pop-menu')) document.querySelectorAll('.pop-menu').forEach(m => m.classList.add('hidden'));
  const t = e.target;
  const open = t.closest('[data-open]');
  if (open) return openRepo(open.dataset.open);
  const copy = t.closest('[data-copy]');
  if (copy) {
    navigator.clipboard?.writeText(copy.dataset.copy).then(() => { copy.textContent = '✅'; setTimeout(() => { copy.textContent = '📋'; }, 1200); });
    return;
  }
  if (t.closest('[data-back]')) { ui.selectedRef = null; ui.selectedSha = null; ui.focus = { kind: 'head' }; renderView(); renderPanel(); return; }
  const commit = t.closest('[data-commit]');
  if (commit && !t.closest('[data-ref]')) return showCommit(commit.dataset.commit);
  const ref = t.closest('[data-ref]');
  if (ref && ref.dataset.ref) return selectRef(ref.dataset.ref);
});

document.addEventListener('change', e => {
  if (e.target.id === 'base-select') { ui.base = e.target.value; ui.compare = null; renderSync(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.pop-menu').forEach(m => m.classList.add('hidden'));
    if (ui.focus.kind !== 'head') { ui.selectedRef = null; ui.selectedSha = null; ui.focus = { kind: 'head' }; renderView(); renderPanel(); }
  }
});

// keep relative times fresh
setInterval(() => { if (ui.meta) onMeta(ui.meta); }, 30000);

renderPanel();
connect();
