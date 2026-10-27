'use strict';
// Branch map: one horizontal lane per branch, GitHub (remote) and the user's PC (local) in separate sectors.
// Time flows left (old) → right (new). The same commit sits in the same column in both sectors,
// so comparing a PC lane with its GitHub lane shows what is unpushed / not yet pulled.
// Explanations live in the info panel; the map itself only carries names and small badges.

const LM = { laneH: 50, sectH: 46, gapH: 58, colW: 36, left: 34, right: 140, top: 8, labelW: 236 };

function branchKey(r) { return r.type === 'remote' ? r.short.slice(r.remote.length + 1) : r.short; }

function branchColor(key) {
  if (key === ui.lanesBaseKey) return COLORS[0];
  let h = 7;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[1 + Math.abs(h) % (COLORS.length - 1)];
}

function reachableFrom(shas, index) {
  const set = new Set();
  const stack = shas.filter(Boolean);
  while (stack.length) {
    const h = stack.pop();
    if (set.has(h)) continue;
    set.add(h);
    const i = index.get(h);
    if (i !== undefined) stack.push(...ui.snap.commits[i].parents);
  }
  return set;
}

function mergedName(subject) {
  let m = subject.match(/Merge pull request #(\d+) from [^/\s]+\/(\S+)/);
  if (m) return `${m[2]} #${m[1]}`;
  m = subject.match(/Merge (?:remote-tracking )?branch '([^']+)'/);
  if (m) return m[1];
  return '過去のブランチ';
}

// Assign every commit reachable from `refs` to exactly one lane by walking first parents.
function buildSector(refs, index, baseKey) {
  const C = ui.snap.commits;
  // base branch first, then older tips first: a branch built on top of another forks off it
  const age = r => index.has(r.sha) ? index.get(r.sha) : -1;
  const ordered = [...refs].sort((a, b) => (branchKey(b) === baseKey) - (branchKey(a) === baseKey) || age(b) - age(a));
  const owner = new Map();
  const lanes = [];

  const claim = (lane, start) => {
    let s = start;
    while (s && index.has(s) && !owner.has(s)) {
      owner.set(s, lane);
      lane.commits.push(s);
      s = C[index.get(s)].parents[0];
    }
    lane.forkFrom = s && owner.has(s) ? s : null;
  };

  for (const r of ordered) {
    const lane = { ref: r, key: branchKey(r), commits: [] };
    claim(lane, r.sha);
    if (!lane.commits.length) lane.sameAs = owner.has(r.sha) ? r.sha : null;
    lanes.push(lane);
  }
  // display order: base, then the rest newest-first
  lanes.sort((a, b) => (b.key === baseKey) - (a.key === baseKey) || b.ref.date - a.ref.date);

  // commits only reachable through merges belong to branches that were merged (and maybe deleted)
  const anon = [];
  const queue = [];
  const enqueueMerges = lane => lane.commits.forEach(s => C[index.get(s)].parents.slice(1).forEach(p => queue.push([p, s])));
  lanes.forEach(enqueueMerges);
  while (queue.length) {
    const [p, mergeSha] = queue.shift();
    if (!index.has(p) || owner.has(p)) continue;
    const lane = { anon: true, key: '', label: mergedName(C[index.get(mergeSha)].subject), commits: [], mergeInto: mergeSha };
    claim(lane, p);
    anon.push(lane);
    enqueueMerges(lane);
  }
  return { lanes, anon, owner };
}

function renderLanes() {
  const s = ui.snap;
  const view = $('#view-lanes');
  const C = s.commits;
  const index = new Map(C.map((c, i) => [c.sha, i]));
  const N = C.length;
  const col = sha => N - 1 - index.get(sha);
  const X = c => LM.left + c * LM.colW;

  const locals = s.refs.filter(r => r.type === 'local');
  const remotes = s.refs.filter(r => r.type === 'remote');
  const baseRef = locals.find(r => ['main', 'master'].includes(r.short)) || remotes.find(r => ['main', 'master'].includes(branchKey(r)));
  ui.lanesBaseKey = baseRef ? branchKey(baseRef) : (s.head.branch || '');

  const localSet = reachableFrom([...locals.map(r => r.sha), s.head.sha], index);
  const remoteSet = reachableFrom(remotes.map(r => r.sha), index);
  const remoteExists = hasRemote();
  const tagsAt = new Map();
  for (const r of s.refs) if (r.type === 'tag') (tagsAt.get(r.sha) || tagsAt.set(r.sha, []).get(r.sha)).push(r.short);

  // ---- vertical layout ----
  let y = LM.top;
  const rows = [];
  const sectors = [];
  const place = (kind, refs) => {
    const sec = { kind, top: y, ...buildSector(refs, index, ui.lanesBaseKey) };
    y += LM.sectH;
    for (const lane of sec.lanes) { lane.y = y + LM.laneH / 2; rows.push({ lane, sec, top: y }); y += LM.laneH; }
    if (sec.anon.length && ui.showMerged) {
      // pack merged-history lanes into as few rows as possible
      const span = l => [l.forkFrom ? col(l.forkFrom) : Math.min(...l.commits.map(col)), col(l.mergeInto)];
      const packed = [];
      for (const l of sec.anon.sort((a, b) => span(a)[0] - span(b)[0])) {
        const [a, b] = span(l);
        let row = packed.find(p => p.end < a);
        if (!row) { row = { end: -1, lanes: [] }; packed.push(row); }
        row.end = b; row.lanes.push(l);
      }
      for (const row of packed) {
        row.lanes.forEach(l => { l.y = y + LM.laneH / 2; });
        rows.push({ merged: row.lanes, sec, top: y });
        y += LM.laneH;
      }
    }
    if (!sec.lanes.length) { rows.push({ empty: true, sec, top: y }); y += LM.laneH; }
    sec.bottom = y + 6;
    y += 6;
    sectors.push(sec);
  };
  place('remote', remotes);
  const gapTop = y;
  y += LM.gapH;
  place('local', locals);
  const totalH = y + 8;
  const hasWip = dirtyCount() > 0;
  // bands fill the visible card even when the history is short
  const width = Math.max(LM.left + (N + (hasWip ? 1 : 0)) * LM.colW + LM.right, view.clientWidth - LM.labelW - 4, 320);

  // ---- SVG ----
  const selKey = ui.selectedRef ? branchKey(s.refs.find(r => r.name === ui.selectedRef) || {}) : null;
  let bg = '', lines = '', dots = '', over = '';
  for (const sec of sectors) {
    bg += `<rect class="band ${sec.kind}" x="0" y="${sec.top}" width="${width}" height="${sec.bottom - sec.top}"/>`;
    for (const r of rows.filter(r => r.sec === sec && !r.empty)) {
      const sel = r.lane && selKey === r.lane.key;
      if (sel) bg += `<rect class="lane-sel" x="0" y="${r.top + 3}" width="${width}" height="${LM.laneH - 6}" rx="12"/>`;
    }
  }

  for (const sec of sectors) {
    const visible = [...sec.lanes, ...(ui.showMerged ? sec.anon : [])];
    const laneOf = sha => { const l = sec.owner.get(sha); return l && l.y !== undefined && (!l.anon || ui.showMerged) ? l : null; };
    const dimFor = lane => selKey && lane.key !== selKey ? ' dim' : '';
    for (const lane of visible) {
      const color = lane.anon ? 'var(--muted)' : branchColor(lane.key);
      const cls = `lane-line${lane.anon ? ' anon' : ''}${dimFor(lane)}`;
      if (lane.commits.length) {
        const xs = lane.commits.map(c => X(col(c)));
        const x0 = Math.min(...xs), x1 = Math.max(...xs);
        if (lane.forkFrom && laneOf(lane.forkFrom)) {
          const fx = X(col(lane.forkFrom)), fy = laneOf(lane.forkFrom).y;
          lines += `<path class="${cls}" stroke="${color}" d="M${fx},${fy} C${fx + LM.colW * 0.7},${fy} ${fx + LM.colW * 0.3},${lane.y} ${fx + LM.colW},${lane.y} L${x0},${lane.y}"/>`;
        }
        lines += `<path class="${cls}" stroke="${color}" d="M${x0},${lane.y} L${x1},${lane.y}"/>`;
      } else if (lane.sameAs && laneOf(lane.sameAs)) {
        const x = X(col(lane.sameAs)), oy = laneOf(lane.sameAs).y;
        lines += `<path class="${cls} same" stroke="${color}" d="M${x},${oy} L${x},${lane.y}"/>`;
        dots += `<circle class="ghost${dimFor(lane)}" cx="${x}" cy="${lane.y}" r="7" stroke="${color}"><title>${esc(lane.ref.short)} は同じコミットを指しています</title></circle>`;
      }
    }
    for (const lane of visible) for (const sha of lane.commits) {
      for (const p of C[index.get(sha)].parents.slice(1)) {
        const pl = laneOf(p);
        if (!pl) continue;
        const px = X(col(p)), mx = X(col(sha)), my = lane.y;
        const color = pl.anon ? 'var(--muted)' : branchColor(pl.key);
        const dim = selKey && pl.key !== selKey && lane.key !== selKey ? ' dim' : '';
        lines += `<path class="lane-line merge-line${pl.anon ? ' anon' : ''}${dim}" stroke="${color}" d="M${px},${pl.y} L${mx - LM.colW},${pl.y} C${mx - LM.colW * 0.3},${pl.y} ${mx - LM.colW * 0.7},${my} ${mx},${my}"/>`;
      }
    }
    for (const lane of visible) for (const sha of lane.commits) {
      const c = C[index.get(sha)];
      const x = X(col(sha));
      const color = lane.anon ? 'var(--muted)' : branchColor(lane.key);
      const unpushed = sec.kind === 'local' && remoteExists && !remoteSet.has(sha);
      const notPulled = sec.kind === 'remote' && !localSet.has(sha);
      const isHead = sec.kind === 'local' && sha === s.head.sha;
      const merge = c.parents.length > 1;
      const fresh = ui.freshShas?.has(sha) ? ' fresh' : '';
      dots += `<g class="commit${dimFor(lane)}${fresh}" data-commit="${sha}"><title>${esc(c.subject)}\n${esc(c.author)} · ${rel(c.time)}</title>`;
      if (unpushed || notPulled) dots += `<circle class="halo ${unpushed ? 'unpushed' : 'notpulled'}" cx="${x}" cy="${lane.y}" r="13"/>`;
      if (isHead) dots += `<circle class="head-ring" cx="${x}" cy="${lane.y}" r="13" stroke="${color}"/>`;
      dots += `<circle class="dot${merge ? ' merge' : ''}${ui.selectedSha === sha ? ' sel' : ''}" cx="${x}" cy="${lane.y}" r="${merge ? 6 : 8}" style="--c:${color}"/>`;
      if (isHead) over += `<text class="pin" x="${x}" y="${lane.y - 17}" text-anchor="middle">📍</text>`;
      for (const t of tagsAt.get(sha) || []) over += `<g class="tagflag"><rect x="${x - 4}" y="${lane.y + 11}" width="${t.length * 6.6 + 20}" height="16" rx="8"/><text x="${x + 3}" y="${lane.y + 23}">🏷${esc(t)}</text></g>`;
      dots += '</g>';
    }
  }
  if (hasWip && s.head.sha && index.has(s.head.sha)) {
    const local = sectors[1];
    const headLane = local.lanes.find(l => l.ref.short === s.head.branch) || local.owner.get(s.head.sha);
    if (headLane && headLane.y !== undefined) {
      const hx = X(col(s.head.sha)), wx = X(N);
      lines += `<path class="lane-line wip" d="M${hx},${headLane.y} L${wx},${headLane.y}"/>`;
      dots += `<g class="wip-g"><title>まだコミットしていない変更 ${dirtyCount()} 件</title><circle class="wipdot" cx="${wx}" cy="${headLane.y}" r="10"/><text x="${wx}" y="${headLane.y + 4.5}" text-anchor="middle">✏</text></g>`;
    }
  }

  // ---- bridges: each PC branch is wired to its GitHub branch through the gap between the sectors ----
  let bridges = '';
  const gapMid = gapTop + LM.gapH / 2;
  const tipOf = lane => {
    const sha = lane.commits[0] || lane.sameAs;
    return sha && index.has(sha) ? X(col(sha)) : null;
  };
  const remoteLanes = new Map(sectors[0].lanes.map(l => [l.ref.short, l]));
  const usedX = [];
  const slot = x => {
    while (usedX.some(u => Math.abs(u - x) < 46)) x += 46;
    usedX.push(x);
    return x;
  };
  // tip → sideways → vertical into the gap (rounded corner)
  const wire = (x, y, bx) => {
    const dir = y > gapMid ? -1 : 1;
    return `M${x},${y} L${bx - 12},${y} Q${bx},${y} ${bx},${y + dir * 12} L${bx},${gapMid}`;
  };
  // the same wire drawn from the gap out to the tip, so that "PC wire + GitHub wire" reads PC → GitHub
  // (the flow animation follows the path direction: forward = push, reverse = pull)
  const wireFromGap = (x, y, bx) => {
    const dir = y > gapMid ? -1 : 1;
    return `M${bx},${gapMid} L${bx},${y + dir * 12} Q${bx},${y} ${bx - 12},${y} L${x},${y}`;
  };
  const arrow = (bx, up, color, dim) => {
    const cy = up ? gapMid - 22 : gapMid + 22, d = up ? -4 : 4;
    return `<path class="bridge-arrow${dim}" stroke="${color}" d="M${bx - 6},${cy - d} L${bx},${cy + d} L${bx + 6},${cy - d}"/>`;
  };
  // a wire's vertical part must pass to the right of every lane it crosses
  const allLanes = sectors.flatMap(sec => [...sec.lanes, ...(ui.showMerged ? sec.anon : [])]).filter(l => l.y !== undefined);
  const headLaneY = sectors[1].lanes.find(l => l.ref.short === s.head.branch)?.y;
  const clearOf = (...ys) => {
    const lo = Math.min(...ys, gapMid), hi = Math.max(...ys, gapMid);
    let m = 0;
    for (const l of allLanes) {
      if (l.y <= lo || l.y >= hi) continue;
      const shas = l.commits.length ? l.commits : l.sameAs ? [l.sameAs] : [];
      for (const sha of shas) if (index.has(sha)) m = Math.max(m, X(col(sha)));
      if (hasWip && l.y === headLaneY) m = Math.max(m, X(N));
    }
    return m ? m + 30 : 0;
  };
  const linked = new Set();
  for (const l of sectors[1].lanes) {
    const r = l.ref;
    const xl = tipOf(l);
    if (xl === null) continue;
    const st = branchStatus(r);
    const color = branchColor(l.key);
    const dim = selKey && l.key !== selKey ? ' dim' : '';
    const wipPad = hasWip && r.short === s.head.branch ? X(N) - xl : 0;
    const rl = r.upstream && remoteLanes.get(r.upstream);
    const xr = rl ? tipOf(rl) : null;
    if (rl && xr !== null && !r.gone) {
      linked.add(rl);
      const bx = slot(Math.max(Math.max(xl + wipPad, xr) + 30, clearOf(l.y, rl.y)));
      const text = st.cls === 'ok' ? '✓' : st.badge;
      bridges += `<path class="bridge st-${st.cls}${dim}" stroke="${color}" d="${wire(xl, l.y, bx)}"/><path class="bridge st-${st.cls}${dim}" stroke="${color}" d="${wireFromGap(xr, rl.y, bx)}"/>`;
      if (r.ahead) over += arrow(bx, true, color, dim);
      if (r.behind) over += arrow(bx, false, color, dim);
      over += `<g class="bridge-badge st-${st.cls}${dim}" data-ref="${esc(r.name)}"><title>${esc(r.short)} ⇄ ${esc(r.upstream)}\n${esc(st.say)}</title>
        <rect x="${bx - (text.length * 5 + 14)}" y="${gapMid - 12}" width="${text.length * 10 + 28}" height="24" rx="12"/>
        <text x="${bx}" y="${gapMid + 5}" text-anchor="middle">${esc(text)}</text></g>`;
    } else if (remoteExists) {
      // not on GitHub yet: a dangling wire that stops in the gap
      const bx = slot(Math.max(xl + wipPad + 30, clearOf(l.y)));
      bridges += `<path class="bridge open${dim}" stroke="${color}" d="${wire(xl, l.y, bx)}"/>`;
      over += `<g class="bridge-badge st-${st.cls} open${dim}" data-ref="${esc(r.name)}"><title>${esc(st.say)}</title>
        <rect x="${bx - 24}" y="${gapMid - 12}" width="48" height="24" rx="12"/><text x="${bx}" y="${gapMid + 5}" text-anchor="middle">${esc(st.badge || '?')}</text></g>`;
    }
  }
  for (const rl of sectors[0].lanes) {
    if (linked.has(rl)) continue;
    const xr = tipOf(rl);
    if (xr === null) continue;
    const dim = selKey && rl.key !== selKey ? ' dim' : '';
    const bx = slot(Math.max(xr + 30, clearOf(rl.y)));
    bridges += `<path class="bridge open${dim}" stroke="${branchColor(rl.key)}" d="${wire(xr, rl.y, bx)}"/>`;
    over += `<g class="bridge-badge st-remote-only open${dim}" data-ref="${esc(rl.ref.name)}"><title>GitHub にだけあるブランチ</title>
      <rect x="${bx - 32}" y="${gapMid - 12}" width="64" height="24" rx="12"/><text x="${bx}" y="${gapMid + 5}" text-anchor="middle">PCに無い</text></g>`;
  }

  // ---- label column: names + badges only ----
  const sectTitle = (sec, icon, name) => `<div class="sect-title ${sec.kind}" style="top:${sec.top}px;height:${LM.sectH}px"><span class="sect-chip">${icon} ${name}</span></div>`;
  let labels = sectors.map(sec => `<div class="sect-bg ${sec.kind}" style="top:${sec.top}px;height:${sec.bottom - sec.top}px"></div>`).join('');
  labels += sectTitle(sectors[0], '☁', 'GitHub') + sectTitle(sectors[1], '💻', '自分のPC');
  labels += `<div class="gap-label" style="top:${gapTop}px;height:${LM.gapH}px"><span class="up">⬆ push</span><span class="down">⬇ pull</span></div>`;
  for (const r of rows) {
    const style = `top:${r.top}px;height:${LM.laneH}px`;
    if (r.empty) { labels += `<div class="lane-label empty" style="${style}">${r.sec.kind === 'remote' ? (remoteExists ? 'まだ何もありません' : 'GitHub 未接続') : 'ブランチなし'}</div>`; continue; }
    if (r.merged) {
      labels += `<div class="lane-label merged" style="${style}" title="${esc(r.merged.map(l => l.label).join(', '))}"><span class="bpill faded">↪ 過去のブランチ${r.merged.length > 1 ? ` ×${r.merged.length}` : ''}</span></div>`;
      continue;
    }
    const lane = r.lane, ref = lane.ref;
    const st = branchStatus(ref);
    const isHead = ref.type === 'local' && ref.short === s.head.branch;
    labels += `<div class="lane-label ${selKey === lane.key ? 'selected' : ''} ${selKey && selKey !== lane.key ? 'dim' : ''}" style="${style}" data-ref="${esc(ref.name)}" data-key="${esc(lane.key)}" title="${esc(ref.short)}">
      ${bpill(lane.key, branchColor(lane.key), isHead ? '📍 ' : '')}
      ${st.badge ? `<span class="sbadge st-${st.cls}">${esc(st.badge)}</span>` : ''}
    </div>`;
  }

  const prev = view.querySelector('.lanes-x');
  const keep = prev ? { left: prev.scrollLeft, max: prev.scrollWidth - prev.clientWidth, top: view.querySelector('.map-card').scrollTop } : null;
  view.innerHTML = `
    ${statusBar(s)}
    <div class="map-card card">
      <div class="lanes-labels" style="height:${totalH}px;width:${LM.labelW}px">${labels}</div>
      <div class="lanes-x"><svg class="lanes-svg" width="${width}" height="${totalH}">${bg}${bridges}${lines}${dots}${over}</svg>
        <div class="time-hint">むかし ←　→ さいしん</div></div>
    </div>`;
  const sc = view.querySelector('.lanes-x');
  // stay pinned to the newest commits unless the user scrolled back in time
  sc.scrollLeft = !keep || keep.left >= keep.max - 4 ? sc.scrollWidth : keep.left;
  if (keep) view.querySelector('.map-card').scrollTop = keep.top;
}

// big, glanceable numbers for the branch you are on; the words live in the info panel
function statusBar(s) {
  const cur = s.refs.find(r => r.type === 'local' && r.short === s.head.branch);
  const w = dirtyCount();
  const up = cur?.upstream ? cur.ahead : 0;
  const down = cur?.upstream ? cur.behind : 0;
  const st = cur ? branchStatus(cur) : null;
  let next = { icon: '🎉', text: '最新です', cls: 'ok' };
  if (w) next = { icon: '✏', text: 'commit', cls: 'wip' };
  else if (st && st.cls === 'warn') next = { icon: '⚠', text: 'pull → push', cls: 'warn' };
  else if (st && st.cls === 'new') next = { icon: '⬆', text: 'push', cls: 'up' };
  else if (down) next = { icon: '⬇', text: 'pull', cls: 'down' };
  else if (up) next = { icon: '⬆', text: 'push', cls: 'up' };
  const bubble = (cls, icon, n, label) => `<div class="bubble ${cls} ${n ? 'on' : ''}"><span class="b-icon">${icon}</span><b>${n}</b><small>${label}</small></div>`;
  return `<div class="statusbar">
    <div class="here">
      <small>📍 いまここ</small>
      ${cur ? bpill(cur.short, branchColor(branchKey(cur))) : `<span class="bpill" style="--c:var(--muted)">detached</span>`}
    </div>
    <div class="bubbles">
      ${bubble('wip', '✏', w, '未コミット')}
      ${bubble('up', '⬆', up, '未push')}
      ${bubble('down', '⬇', down, '未pull')}
    </div>
    <button type="button" class="next ${next.cls}" data-back title="くわしくはパネルで">
      <small>つぎは</small><span>${next.icon} ${next.text}</span>
    </button>
  </div>`;
}

// hover a lane label → highlight the same branch in the other sector
document.addEventListener('mouseover', e => {
  const l = e.target.closest('.lane-label[data-key]');
  document.querySelectorAll('.lane-label.partner').forEach(x => x.classList.remove('partner'));
  if (l) document.querySelectorAll(`.lane-label[data-key="${CSS.escape(l.dataset.key)}"]`).forEach(x => x !== l && x.classList.add('partner'));
});
