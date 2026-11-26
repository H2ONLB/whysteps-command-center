/* WhySteps Command Center. Reads window.WS_SNAPSHOT (built from GitHub by
   tools/build_snapshot.py). Shows only recorded facts, each with its source.
   Decisions Hiba records here are kept in the artifact's database (db
   capability) until Claude writes them to GitHub; see README.md. */
{
const S = window.WS_SNAPSHOT;
const $ = (q, el = document) => el.querySelector(q);
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICONS = {
  work: '<path d="M4 20h16"/><path d="M6 20V9l6-5 6 5v11"/><path d="M10 20v-5h4v5"/>',
  campus: '<path d="M3 21h18"/><path d="M5 21V10l4-3 4 3v11"/><path d="M13 21v-7h6v7"/><path d="M9 4V2"/>',
  hq: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 10a3 3 0 1 0-1-6M17 14a5 5 0 0 1 4 5v2"/>',
  messages: '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>',
  now: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  issues: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  decisions: '<path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"/><path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z"/><path d="M5 22h14"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  evidence: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
};
const icon = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const src = (url, label = 'Source') => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : '';
const TZ = 'Asia/Beirut';
function fmt(d, withTime = true) {
  if (!d) return 'Date not recorded';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(d);
  const t = new Date(dateOnly ? d + 'T12:00:00Z' : d);
  if (isNaN(t)) return d;
  const o = { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ };
  if (withTime && !dateOnly) Object.assign(o, { hour: '2-digit', minute: '2-digit', hour12: false });
  return new Intl.DateTimeFormat('en-GB', o).format(t);
}
const dayKey = d => d ? fmt(d.length > 10 ? d : d, false) : 'Date not recorded';
const short = sha => sha ? sha.slice(0, 7) : '—';
const plural = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;

if (!S) {
  view.innerHTML = '<div class="band"><div class="empty">The GitHub snapshot (data/snapshot.js) is missing. Ask Claude to run tools/build_snapshot.py.</div></div>';
} else {

/* ------------------------------------------------------------ data */
let roles = S.roles;
let roleBy = Object.fromEntries(roles.map(r => [r.n, r]));
const SITE_LOCAL = !!window.WS_SITE; // the customer website is published inside this Command Center (site/)
let depts = S.departments;
let deptBy = Object.fromEntries(depts.map(d => [d.id, d]));
const ACTORS = { Hiba: 'Claude Hiba', Onsi: 'Claude Onsi', ChatGPT: 'ChatGPT', Founder: 'Hiba (founder)', 'Not stated': 'Account not stated' };
const chatRecs = snap => (snap.chatgpt || []).map(c => {
  const m = /(\d{1,2})(?:–\d{1,2})? (Nov|Oct|Dec)\w* (\d{4})/.exec(c.heading || '');
  const date = m ? new Date(`${m[1]} ${m[2]} ${m[3]} 12:00 UTC`).toISOString().slice(0, 10) : null;
  return { date, actor: 'ChatGPT', kind: 'ChatGPT finding recorded by Claude', title: c.text, url: c.url, source: `${c.file}, line ${c.line}${c.heading ? ' (' + c.heading + ')' : ''}` };
});
let chatItems = chatRecs(S);
let activity = [...S.activity, ...chatItems].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
let defects = S.defects || [];
let openP0 = defects.filter(d => d.severity === 'P0' && /^Issue/i.test(d.status || ''));
let msgsOpen = (S.coordination.messages || []).filter(m => !m.done);

function colourOf(r, mode) {
  const g = r.register || {}, rep = r.report || {};
  if (mode === 'report') return rep.status === 'Full' ? 'good' : rep.status === 'Partly' ? 'warn' : rep.status === 'Needs a real person' ? 'human' : 'none';
  if (mode === 'hiba') {
    const h = g.hiba23 || '';
    if (/^Sent back/.test(h)) return 'bad';
    if (/^Approved if Partly/.test(h)) return rep.status === 'Partly' ? 'good' : 'none';
    if (/^Approved/.test(h)) return 'good';
    return 'none';
  }
  const v = (g.verdict || '').toLowerCase();
  return v === 'issue found' ? 'bad' : v === 'pass' ? 'good' : g.human ? 'human' : 'none';
}
const MODES = {
  verdict: { label: 'Current build', help: `${S.verdictColumn || 'Area verdict'} (Phase A role register)`,
    keys: [['bad', 'Problem to fix'], ['human', 'Needs a real person'], ['good', 'Pass'], ['none', 'Not started on this build']] },
  report: { label: '23 Nov reports', help: 'Status each role gave in its 23 Nov report',
    keys: [['good', 'Full'], ['warn', 'Partly'], ['human', 'Needs a real person']] },
  hiba: { label: "Hiba's 23 Nov decision", help: "Hiba's decision on each report (review brief v2)",
    keys: [['good', 'Approved'], ['bad', 'Sent back'], ['none', 'Full kept as history, to verify']] }
};

/* ------------------------------------------------------------ state */
const st = { room: 'office', me: 'desk', mePrev: null, say: '', anim: '', office: true, nowF: 'u', open: null, hl: null, hlName: '', view: 'now', mode: 'verdict', q: '', actor: 'all', kind: 'all', aq: '', limit: 120, dtab: 'waiting', inbox: 'all' };

/* ------------------------------------------------------------ chrome */
const TABS = [['work', 'Work', 'Work'], ['campus', 'Campus', 'Campus'], ['now', 'Now', 'Now'], ['hq', 'Experts', 'Experts'], ['messages', 'Messages', 'Messages'], ['decisions', 'Decisions', 'Decisions'],
  ['dashboard', 'Project status', 'Status'], ['issues', 'Issues', 'Issues'], ['activity', 'Activity', 'Activity'], ['evidence', 'Evidence', 'Files'], ['more', 'More', 'More']];
function renderTabs() {
  const w = S.website && S.website.preview; const wb = $('#siteBtn'); if (SITE_LOCAL && wb) { wb.href = 'site/index.html'; wb.hidden = false; wb.title = 'Open the latest WhySteps website, built from main ' + WS_SITE.commit; } else if (w && wb) { wb.href = w.url; wb.hidden = false; wb.title = 'Open Latest WhySteps Website · ' + S.website.status; }
  const counts = { now: nowItems().u.length, issues: openP0.length, decisions: pendingCount() };
  $('#tabs').innerHTML = TABS.map(([id, long, sh]) => {
    const active = st.view === id || (id === 'more' && ['dashboard', 'issues', 'activity', 'evidence'].includes(st.view));
    return `<a class="tab" href="#${id}" ${active ? 'aria-current="page"' : ''}>${icon(id)}<span class="l-long">${long}</span>${counts[id] ? `<span class="n" aria-label="${counts[id]} open">${counts[id]}</span>` : ''}</a>`;
  }).join('');
  if (matchMedia('(max-width:899px)').matches) $('#tabs').querySelectorAll('.tab').forEach((a, i) => a.querySelector('.l-long').textContent = TABS[i][2]);
}
function paintStamp() {
const links = `<a href="${esc(S.branches.main.url)}" target="_blank" rel="noopener" title="Code version ${short(S.branches.main.sha)}">the code</a> · <a href="${esc(S.branches.coordination.url)}" target="_blank" rel="noopener" title="Notes version ${short(S.branches.coordination.sha)}">the team's notes</a>`;
if (window.WSLive) { $('#stamp').innerHTML = `<span id="liveStamp"></span><span class="stamp-links"> · ${links}</span>`; window.WSLive.paint(); }
else $('#stamp').innerHTML = `Read from GitHub ${fmt(S.generated.at)}${S.generated.by ? ' by Claude ' + esc(S.generated.by) : ''} · <a href="${esc(S.branches.main.url)}" target="_blank" rel="noopener" title="Code version ${short(S.branches.main.sha)}">the code</a> · <a href="${esc(S.branches.coordination.url)}" target="_blank" rel="noopener" title="Notes version ${short(S.branches.coordination.sha)}">the team's notes</a>`;
$('#notes').textContent = (S.notes || []).length ? 'Snapshot notes: ' + S.notes.join(' ') : '';
}
paintStamp();

/* ------------------------------------------------------------ headquarters */
function deskHTML(r) {
  const c = colourOf(r, st.mode);
  const q = st.q.trim().toLowerCase();
  const text = [r.title, r.responsibility, r.v2focus, r.job].join(' ').toLowerCase();
  const hit = (!q || String(r.n) === q.replace('#', '') || text.includes(q)) && (!st.hl || st.hl.has(r.n));
  return `<button class="desk ${c}${hit ? '' : ' dim'}${r.v2focus ? ' v2' : ''}" type="button" data-role="${r.n}" aria-label="#${r.n} ${esc(r.title)}: ${esc(MODES[st.mode].keys.find(k => k[0] === c)?.[1] || 'no record')}" title="#${r.n} ${esc(r.title)}">${r.n}</button>`;
}
function groupHTML(d, review) {
  const rs = d.roles.map(n => roleBy[n]).filter(Boolean);
  const bad = rs.filter(r => colourOf(r, st.mode) === 'bad').length;
  const name = review ? d.name.replace(/^Review: /, '') + ' review' : d.name;
  return `<section class="group${review ? ' rev' : ''}" data-room="${d.id}"><button class="group-head" type="button" data-dept="${d.id}">${esc(cap(name))}<span>${rs.length}${bad ? ` · ${bad} to fix` : ''}</span></button><div class="desks">${rs.map(deskHTML).join('')}</div></section>`;
}
function roomHTML(d) {
  const rs = d.roles.map(n => roleBy[n]).filter(Boolean);
  const bad = rs.filter(r => colourOf(r, st.mode) === 'bad').length;
  const basis = Math.max(150, Math.min(rs.length, 8) * 50 + 20);
  return `<section class="room" style="--grow:${Math.max(1, rs.length)};--basis:${basis}px" data-room="${d.id}">
    <button class="room-head" type="button" data-dept="${d.id}">${esc(d.name)}<span>${plural(rs.length, 'role')}${bad ? ` · ${bad} ${st.mode === 'hiba' ? 'sent back' : 'issue'}` : ''}</span></button>
    <div class="desks">${rs.map(deskHTML).join('')}</div></section>`;
}
function renderHQ() {
  const wings = [['Leadership', 'Teaching specialists'], ['Builders'], ['Independent reviewers']];
  const wingName = { Leadership: 'Leadership and teaching specialists (101–116)', Builders: 'Builders (1–50)', 'Independent reviewers': 'Independent reviewers (51–100): reviewer N+50 checks builder N' };
  const counts = {}; roles.forEach(r => { const c = colourOf(r, st.mode); counts[c] = (counts[c] || 0) + 1; });
  view.innerHTML = `<div class="band">
    <h1>The 116 experts</h1>
    <p class="lede">All 116 roles on one page, each builder beside the reviewer who checks it. Tap a square for its job, what it found and who checks it. These are expert functions played by Claude, not 116 separate people.</p>
    <div class="hq-jump" aria-label="Jump to a team area"><button class="ghost" type="button" data-wing="workspaces">AI workspaces</button><button class="ghost" type="button" data-wing="Leadership">Teaching specialists</button><button class="ghost" type="button" data-wing="Builders">Build team</button><button class="ghost" type="button" data-wing="Independent reviewers">Review team</button></div>
    <div class="row">
      <div class="seg" role="group" aria-label="Colour desks by">${Object.entries(MODES).map(([k, m]) => `<button type="button" data-mode="${k}" aria-pressed="${st.mode === k}">${m.label}</button>`).join('')}</div>
      <label class="search">${icon('search')}<span class="sr" hidden>Find a role</span><input type="search" id="roleq" placeholder="Find a role: number or job" value="${esc(st.q)}" aria-label="Find a role"></label>
    </div>
    <div class="legend" aria-label="Legend">${MODES[st.mode].keys.map(([k, l]) => `<span><i class="desk ${k}" style="display:inline-block;height:16px;width:16px"></i>${l}: ${counts[k] || 0}</span>`).join('')}<span><i class="desk none v2" style="display:inline-block;height:16px;width:16px;position:relative"></i>Has a V2 focus</span><span class="muted small">${esc(MODES[st.mode].help)} · ${src(st.mode === 'report' ? roles[0].report?.url?.split('#')[0] : S.registerSource)}</span></div>
    <div class="directory">
      <div class="wing" data-wing="workspaces"><div class="wing-label"><span>AI workspaces: who does the work</span><a class="src" href="#messages">Team Messages →</a></div>
        <div class="offices">${WORKSPACES.map(w => { const s = actorSummary(w.key); return `<button class="office" type="button" data-office="${w.key}"><span class="robot">${CH.svg(CH.robot(w.key), 40)}</span><span><strong>${esc(w.id)}</strong><small>${plural(s.items.length, 'record')}</small></span></button>`; }).join('')}</div></div>
      <div class="wing" data-wing="Leadership"><div class="wing-label"><span>Leadership and teaching specialists (101–116)</span></div>
        <div class="pair-row one">${depts.filter(d => ['Leadership', 'Teaching specialists'].includes(d.wing)).map(d => groupHTML(d)).join('')}</div></div>
      <div class="wing" data-wing="Builders"><div class="wing-label two"><span>Builders (1–50)</span><span data-wing-label="Independent reviewers">Their independent reviewers (51–100)</span></div>
        ${depts.filter(d => d.wing === 'Builders').map(d => `<div class="pair-row">${groupHTML(d)}${deptBy['review-' + d.id] ? groupHTML(deptBy['review-' + d.id], true) : '<div></div>'}</div>`).join('')}</div>
    </div>
    ${flowHTML()}
  </div>`;
}
let OM = S.operatingModel;
const cap = t => t ? t[0].toUpperCase() + t.slice(1) : t;
const chips = ns => {
  if (ns.length > 12) { const sorted = [...ns].sort((a, b) => a - b); const run = sorted.every((n, i) => !i || n === sorted[i - 1] + 1);
    if (run) return `<span class="range">#${sorted[0]}–#${sorted[sorted.length - 1]} (${ns.length} roles)</span>`; }
  return chipList(ns);
};
const chipList = ns => ns.map(n => `<button class="chip" type="button" data-role="${n}" title="${esc(roleBy[n]?.title || '')}">#${n}</button>`).join('');
function flowHTML() {
  const pairing = `<p class="small muted">Builders #1–50 are each checked by reviewer #N+50; #101 gives an advisory technical readiness summary; final product and release decisions belong to Hiba. ${src(S.roster?.url, 'Team directory V2')}</p>`;
  if (!OM) return `<h2 class="section">How work moves through the building</h2>${pairing}`;
  const hlBtn = (key, name, n) => `<button class="ghost hl" type="button" data-hl="${key}" aria-pressed="${st.hlName === name}">${st.hlName === name ? 'Showing' : 'Show'} ${n} desks</button>`;
  return `<h2 class="section">How work moves: the eight-step workflow</h2>
    <ol class="flow8">${OM.workflow.map(w => `<li><h3>${esc(w.name)}</h3><p>${esc(cap(w.text.replace(/^(#\d+(–\d+)?,?\s*(and\s*)?)+/, '').replace(/^[—–-]\s*/, '')))}</p><div class="row">${chips(w.roles)}</div></li>`).join('')}</ol>
    ${pairing}
    ${st.hl ? `<p class="callout teal small">Highlighting <strong>${esc(st.hlName)}</strong> in the building above. <button class="ghost" type="button" data-hl="">Show everyone</button></p>` : ''}
    <h2 class="section">Cross-team ownership</h2>
    <p class="lede">Who builds, who checks, and the evidence required. From the V2 operating model. ${src(OM.url, 'Operating model')}</p>
    <div class="grid">${OM.ownership.map((o, i) => `<div class="card"><h3>${esc(o.name)}</h3><p class="small muted">Owners</p><div class="row">${chips(o.owners)}</div><p class="small muted">Independent checks</p><div class="row">${chips(o.reviewers)}</div><p class="small">${esc(o.evidence)}</p><div class="row">${hlBtn('own:' + i, o.name, o.owners.length + o.reviewers.length)}${src(o.url)}</div></div>`).join('')}</div>
    <h2 class="section">Critical journeys and release checks</h2>
    <div class="scroll"><table class="stack"><thead><tr><th>Journey</th><th>Owners</th><th>Reviewers</th><th>Success evidence</th></tr></thead><tbody>
    ${OM.journeys.map((j, i) => `<tr><td><strong>${esc(j.name)}</strong><br>${hlBtn('jr:' + i, j.name, j.owners.length + j.reviewers.length)}</td><td><div class="row">${chips(j.owners)}</div></td><td><div class="row">${chips(j.reviewers)}</div></td><td class="small">${esc(j.evidence)}</td></tr>`).join('')}
    </tbody></table></div>
    <h2 class="section">Product principles</h2><ol class="list">${OM.principles.map(p => `<li>${esc(p.text)} ${src(p.url)}</li>`).join('')}</ol>`;
}
function roleDrawer(n) {
  const r = roleBy[n]; if (!r) return;
  const g = r.register || {}, rep = r.report || {}, d = deptBy[r.dept];
  const pair = r.pair && roleBy[r.pair];
  const kv = (k, v) => v ? `<dt>${k}</dt><dd>${v}</dd>` : '';
  openSheet(`<p class="muted small">${esc(d?.wing || '')} · ${esc(d?.name || '')}</p>
    <div class="role-hero">${CH.svg(CH.person(CH.look(r.n, r.dept)), 64)}<div><h2 id="sheetTitle">#${r.n} ${esc(r.title)}</h2><p class="small muted" style="margin:0">${esc(CH.look(r.n, r.dept).label)}</p></div></div>
    <p>${esc(r.responsibility || r.job || 'Responsibility not recorded.')} ${src(r.rosterUrl, 'Team directory V2')}</p>
    ${r.v2focus ? `<p class="callout teal small"><strong>V2 focus:</strong> ${esc(r.v2focus)}</p>` : ''}
    ${namedIn(r.n)}
    <p class="small muted">Role played by Claude (AI), not a separate person.</p>
    <dl class="kv">
      ${kv('23 Nov report', `<span class="pill ${colourOf(r, 'report')}">${esc(rep.status || 'No report found')}</span> ${rep.statusText && rep.statusText !== rep.status ? esc(rep.statusText) : ''} ${src(rep.url, 'Report')}`)}
      ${kv("Hiba's decision", g.hiba23 ? `<span class="pill ${colourOf(r, 'hiba')}">${esc(g.hiba23)}</span>` : '')}
      ${kv('Role work now', esc(g.work))}
      ${kv(esc(S.verdictColumn || 'Area verdict'), g.verdict ? `<span class="pill ${colourOf(r, 'verdict')}">${esc(g.verdict)}</span>` : '')}
      ${kv('Findings', esc(g.findings))}
      ${kv('Evidence', esc(g.evidence))}
      ${kv('Recheck owed', esc(g.recheck))}
      ${kv('Owner of open items', esc(g.owner))}
      ${kv('Needs a real person', g.human ? `<span class="pill human">${esc(g.human)}</span>` : '')}
    </dl>
    <p class="small">${src(S.registerSource, 'Phase A role register')}</p>
    ${pair ? `<h3>Works with</h3><p><button class="ghost" type="button" data-role="${pair.n}">#${pair.n} ${esc(pair.title)}</button></p><p class="small muted">${r.n <= 50 ? `#${pair.n} independently reviews this role's work.` : `This role independently reviews #${pair.n}'s work.`} #101 signs off every update.</p>` : ''}
    ${d ? `<p><button class="ghost" type="button" data-dept="${d.id}">Open the ${esc(d.name)} room</button></p>` : ''}
    <p><button class="primary" type="button" data-callrole="${r.n}">📣 Call #${r.n} to my office</button></p>
    ${quickBox('role-' + r.n, 'All three', `Question for #${r.n} ${r.title}`, '', `Ask #${r.n} a question`, 'Your question for this expert. Claude answers as this role in its next session.')}`);
  document.querySelectorAll('.desk.me,.desk.pair').forEach(x => x.classList.remove('me', 'pair'));
  document.querySelector(`.desk[data-role="${n}"]`)?.classList.add('me');
  if (pair) document.querySelector(`.desk[data-role="${pair.n}"]`)?.classList.add('pair');
}
function namedIn(n) {
  if (!OM) return '';
  const hits = [...OM.workflow.filter(w => w.roles.includes(n)).map(w => `Workflow step ${w.step}: ${w.name}`),
    ...OM.ownership.filter(o => o.owners.includes(n) || o.reviewers.includes(n)).map(o => `${o.name} (${o.owners.includes(n) ? 'owner' : 'independent check'})`),
    ...OM.journeys.filter(j => j.owners.includes(n) || j.reviewers.includes(n)).map(j => `Journey: ${j.name} (${j.owners.includes(n) ? 'owner' : 'reviewer'})`)];
  return hits.length ? `<h3>Named in the V2 operating model</h3><ul class="list small">${hits.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : '';
}
function deptDrawer(id) {
  const d = deptBy[id]; if (!d) return;
  const rs = d.roles.map(n => roleBy[n]).filter(Boolean);
  const twin = id.startsWith('review-') ? deptBy[id.slice(7)] : deptBy['review-' + id];
  const tally = k => rs.filter(r => colourOf(r, 'verdict') === k).length;
  openSheet(`<p class="muted small">${esc(d.wing)}</p><h2 id="sheetTitle">${esc(d.name)}</h2>
    <div class="row"><span class="pill bad">${tally('bad')} issue found</span><span class="pill">${tally('none')} not tested yet</span><span class="pill good">${tally('good')} pass</span></div>
    <h3 class="section">Responsibilities</h3>
    <ul class="list">${rs.map(r => `<li><button class="ghost" type="button" data-role="${r.n}">#${r.n} ${esc(r.title)}</button><div class="meta">${esc(r.responsibility || r.job || '')}</div></li>`).join('')}</ul>
    <h3 class="section">Collaboration</h3>
    <p>${twin ? `${id.startsWith('review-') ? 'Reviews the work of' : 'Its work is reviewed by'} <button class="ghost" type="button" data-dept="${twin.id}">${esc(twin.name)}</button>.` : id === 'architect' ? 'Connects Hiba\'s approved rules to AI instructions, software checks, human review and release tests, and signs off every update.' : 'Teaching specialists check the teaching in every lesson with the builder and reviewer roles for that subject.'}</p>
    <p class="small">${src(d.source, 'Team roster')}</p>`);
}

/* ------------------------------------------------------------ dashboard */
function actorSummary(a) {
  const prs = S.pullRequests.filter(p => p.account === a);
  const items = activity.filter(x => x.actor === a);
  const msgs = (S.coordination.messages || []).filter(m => m.from === a);
  return { prs, items, msgs };
}
function renderDashboard() {
  const merged = S.pullRequests.filter(p => p.state === 'merged');
  const last = merged.slice().sort((a, b) => (b.mergedAt || '').localeCompare(a.mergedAt || ''))[0];
  const openPRs = S.pullRequests.filter(p => p.state === 'open');
  const issueRoles = roles.filter(r => colourOf(r, 'verdict') === 'bad').length;
  const cw = S.coordination.currentWork;
  const who = workspaceCards();
  const covRow = c => {
    const t = c.total || 1, b = c.byStatus;
    const seg = (k, cls) => b[k] ? `<span class="${cls}" style="width:${b[k] / t * 100}%" title="${esc(k)}: ${b[k]}"></span>` : '';
    return `<div><div class="row" style="justify-content:space-between"><strong>${esc(c.area)}</strong><span class="small muted">${c.total} rows</span></div>
      <div class="bar" role="img" aria-label="${esc(Object.entries(b).map(([k, v]) => `${k} ${v}`).join(', '))}">${seg('Passed', 'b-good')}${seg('Issue found', 'b-bad')}${seg('Awaiting qualified human review', 'b-human')}${seg('Untested', 'b-none')}</div>
      <div class="meta">${Object.entries(b).map(([k, v]) => `<span>${esc(k)} ${v}</span>`).join('')}</div></div>`;
  };
  const prog = S.progress.filter(p => !p.next).slice(-6).reverse();
  const nexts = S.progress.filter(p => p.next || p.waiting);
  view.innerHTML = `<div class="band">
    <h1>Project status</h1>
    <p class="lede">Open your latest customer website, check recorded progress and go straight to the decisions that need you. This is a GitHub snapshot—not a continuously live feed.</p>
    ${websiteHTML()}
    <nav class="quick-grid" aria-label="Your main actions">
      <a class="quick-action" href="#hq"><strong>Explore the 116 experts</strong><span>Departments, roles and reviewers</span></a>
      <a class="quick-action" href="#messages"><strong>Team Messages</strong><span>Read and write GitHub message threads</span></a>
      <a class="quick-action" href="#decisions"><strong>My decisions${pendingCount() ? ` · ${pendingCount()} waiting` : ''}</strong><span>Review proposals and evidence</span></a>
      <a class="quick-action" href="#issues"><strong>Review issues</strong><span>${openP0.length} open P0 on the reviewed build</span></a>
    </nav>
    <h2 class="section">Project status</h2>
    <p class="small muted">The P0 count covers critical teaching, routing, family-data and reporting defects in the review register; it is not a claim about the current published website.</p>
    <div class="kpis">
      <div class="kpi alert"><b>${openP0.length}</b><span>P0 defects open: ${openP0.map(d => d.id).join(', ') || 'none'}</span>${src(S.registerSource, 'Register')}</div>
      <div class="kpi"><b>${issueRoles}<small class="muted" style="font-size:.5em"> / 116</small></b><span>roles with an issue found on ${esc(defects[0]?.build || 'the reviewed build')}</span>${src(S.registerSource, 'Register')}</div>
      <div class="kpi"><b>${pendingCount()}</b><span>decisions waiting for Hiba</span><a class="src" href="#decisions">Open decisions →</a></div>
      <div class="kpi"><b>${merged.length}</b><span>pull requests merged${last ? `; latest #${last.n}, ${fmt(last.mergedAt, false)}` : ''}${openPRs.length ? ` · ${openPRs.length} open` : ''}</span>${src(last?.url, 'GitHub')}</div>
    </div>
    <h2 class="section">Review v2: where each phase stands</h2>
    <div class="phases">${S.reviewPhases.map(p => `<div class="phase ${/Checkpoint/.test(p.status) ? 'done' : /Mentioned/.test(p.status) ? 'mid' : ''}"><strong>Phase ${p.phase}</strong><p>${esc(cap(p.title))}</p><p class="muted">${esc(p.status)}</p>${src(p.evidence || p.url, p.evidence ? 'Record' : 'Brief')}</div>`).join('')}</div>
    ${S.reviewPhases.filter(p => p.mentions.length && !/Checkpoint/.test(p.status)).map(p => `<p class="small muted">Phase ${p.phase}: “${esc(p.mentions[0].text.slice(0, 220))}” (message, ${fmt(p.mentions[0].date, false)}) ${src(p.mentions[0].url)}</p>`).join('')}
    <h2 class="section">The three AI workspaces (recorded in GitHub)</h2>
    <div class="who">${who}</div>
    <p class="small muted">${activity.filter(x => x.actor === 'Not stated').length} older records do not name an account (no [Hiba] or [Onsi] in the title or branch, and no Log entry); they are shown as “Account not stated”.</p>
    <div class="grid section">
      <div class="card"><h2>Coverage register</h2>${(S.coverage || []).map(covRow).join('<hr style="border:0;border-top:1px solid var(--line)">')}<p class="small">${src(S.coverageSource, 'Coverage register')}</p></div>
      <div class="card"><h2>Current work</h2><p>${esc(cw?.text || 'Not recorded.')}</p><p class="small muted">Last updated: ${esc(S.coordination.currentWorkUpdated || '—')} ${src(cw?.url)}</p>
        ${msgsOpen.length ? `<h3 class="section">Messages between the accounts not yet marked done</h3><ul class="list">${msgsOpen.slice(0, 4).map(m => `<li>${esc(m.text.slice(0, 200))}<div class="meta"><span>To ${esc(m.to)} from ${esc(m.from)}, ${fmt(m.date + (m.time ? 'T' + m.time + ':00+02:00' : ''))}</span>${src(m.url)}</div></li>`).join('')}</ul>` : ''}</div>
    </div>
    <div class="grid section">
      <div class="card"><h2>Progress log</h2><ul class="list">${prog.map(p => `<li>${esc(p.title)}<div class="meta"><span>${fmt(p.date, false)}</span>${src(p.url)}</div></li>`).join('')}</ul>
        ${nexts.length ? `<h3 class="section">Recorded as next or waiting</h3><ul class="list">${nexts.map(p => `<li>${esc(p.title)} ${src(p.url)}</li>`).join('')}</ul>` : ''}</div>
      <div class="card"><h2>Needs a real person</h2><p class="small muted">Claude cannot stand in for these (team roster).</p><ul class="list">${(S.realPeopleNeeded || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>${src(depts[0]?.source, 'Roster')}</div>
    </div></div>`;
}

function websiteHTML() {
  const w = S.website; if (!w) return '';
  const pub = w.lastPublish, latest = w.changes[0];
  const cls = w.status === 'Published' ? 'git' : /awaiting/.test(w.status) ? 'local' : '';
  const republish = `Please republish the existing "WhySteps · Customer website" Artifact from main in H2ONLB/whysteps, following CLAUDE.md: run every test suite first, republish only the changed files in patch mode, then post the publish record on GitHub (internal/command-center/README.md, "Website publish records") with the version and the commit it was built from.`;
  return `<section class="card site" aria-labelledby="siteTitle"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2 id="siteTitle">The customer website</h2>
      <p class="small muted">The one private preview “WhySteps · Customer website”, owned by the Hiba account. It changes only when Claude Hiba republishes it after a merge; a merge alone does not update it.</p></div>
      ${w.preview ? `<a class="primary" href="${esc(w.preview.url)}" target="_blank" rel="noopener">Open Latest WhySteps Website ${icon('ext')}</a>` : '<span class="pill">No website link recorded</span>'}</div>
    ${w.preview && !w.preview.confirmed ? `<p class="small muted">Link as recorded in ${esc(w.preview.recordedIn || 'the repo')} ${src(w.preview.source)}; not yet confirmed from the Hiba account (set it in internal/command-center/config.json once confirmed).</p>` : w.preview ? `<p class="small muted">Link confirmed by ${esc(w.preview.confirmedBy)}, ${fmt(w.preview.confirmedAt)}.</p>` : ''}
    <div class="grid"><div>
      <dl class="kv"><dt>Status</dt><dd><span class="state ${cls}" style="display:inline-block"><strong>${esc(w.status)}</strong></span><div class="small muted">${esc(w.statusWhy || '')}</div></dd>
        <dt>Last verified published</dt><dd>${pub ? `Version ${esc(pub.version)}${pub.commit ? `, built from ${short(pub.commit)}` : ''}, ${fmt(pub.date)}${pub.account ? ' by Claude ' + esc(pub.account) : ''} ${src(pub.url, pub.evidence)}` : 'No publish record in GitHub'}</dd>
        <dt>Latest merged change</dt><dd>${latest ? `${esc(latest.subject)} (${short(latest.sha)}, ${fmt(latest.date)}) ${src(latest.url, 'Commit')}` : 'None found'}</dd>
        <dt>Last checked</dt><dd>${fmt(S.generated.at)} <button class="ghost" type="button" data-refresh>Refresh now</button></dd>
        <dt>Code on GitHub</dt><dd><a href="${esc(w.githubUrl)}" target="_blank" rel="noopener">website/index.html on main</a> <span class="small muted">(source view, not the playable site)</span></dd></dl>
      ${/awaiting/.test(w.status) ? `<div class="callout"><strong>Action needed by Claude Hiba:</strong> republish the existing website Artifact. <button class="primary" type="button" data-copytext="${esc(republish)}">${icon('copy')}Copy republish request</button></div>` : ''}
      ${w.openPRs.length ? `<p class="small">In development (open pull requests that change the website, not published yet): ${w.openPRs.map(p => `<a href="${esc(p.url)}" target="_blank" rel="noopener">#${p.n} ${esc(p.title)}</a>`).join(', ')}</p>` : '<p class="small muted">No open pull request changes the website.</p>'}</div>
      <div><h3>What changed in website/ and app/ (main)</h3><ul class="list">${w.changes.slice(0, 6).map(c => `<li>${esc(c.subject)}<div class="meta"><span class="pill ${c.published ? 'good' : c.published === false ? 'bad' : ''}">${c.published ? 'Published' : c.published === false ? 'Merged, not yet published' : 'Merged'}</span><span>${fmt(c.date)}</span><span>${esc(c.areas.join(', ') || 'merge')}</span>${c.pr ? `<span>PR #${c.pr}</span>` : ''}<span>${c.account ? 'Claude ' + esc(c.account) : 'Account not stated'}</span>${src(c.url, 'Commit')}<button class="linkbtn" type="button" data-discuss="${esc(c.sha)}">Discuss</button></div></li>`).join('')}</ul></div></div></section>`;
}

/* ------------------------------------------------------------ now: what needs doing, and who does it */
const PLAIN = { D1: 'Wrong lab opens for a lesson', D2: 'Opening an info card counts as an answer', D3: 'Science and other subjects show as “Language lesson”',
  D4: 'The right answer is always first', D5: 'The longest answer gives it away', D6: 'KG2 “Build a sentence” shows its own answer', D7: '3D labs only turn the camera',
  D8: '“Secure” is given too easily', D9: 'Phonics reported to parents as “Vocabulary word”', D10: 'One reading story for every grade' };
const plainDefect = d => PLAIN[d.id] || cap(d.title);
/* The 🔥 Urgent corner (Hiba, 24 Nov 2026): every urgent problem in plain words, and what, if anything, Hiba has to do. */
const URGENT = {
  D1: { what: 'A child doing a maths lesson can be sent to a lab that teaches something else (for example, a subtraction lesson opens an addition lab).', why: 'The child practises the wrong skill, and the parent thinks the lesson was done.', fixQ: 'approve-pr-84' },
  D2: { what: 'Just opening an information card is recorded as if the child answered a question with a hint.', why: 'The parent report says the child needed help on something they never answered.', fixQ: 'approve-pr-84' },
  D3: { what: 'Science, social studies, Arabic and French lessons are reported to parents as "Language lesson".', why: 'Parents cannot see which subject the child actually worked on.', fixQ: 'approve-pr-84' },
  D9: { what: 'Phonics and spelling practice (sounds and letters) is reported to parents as "Vocabulary word".', why: 'Parents get the wrong picture of what their child practised.', fixQ: 'approve-pr-84' }
};
function urgentHTML() {
  const list = nowItems().u;
  if (!list.length) return `<h3>🔥 Urgent corner</h3><p>Nothing urgent right now. When something breaks for children or parents, it shows here first, in plain words.</p>`;
  const asks = {};
  const cards = list.map(x => { const id = x.id.replace(/^p0-/, ''), e = URGENT[id] || {}, q = e.fixQ && S.decisions.pending.find(p => p.id === e.fixQ), open = q && ['none', 'draft'].includes(stateOf(q.id).k);
    if (open) asks[q.id] = q;
    return `<li class="urgent-item"><strong>🔥 ${esc(x.title)}</strong>
      <p><b>What is wrong:</b> ${esc(e.what || 'The team has not explained this one yet; it has been asked to.')}</p>
      ${e.why ? `<p><b>Why it matters:</b> ${esc(e.why)}</p>` : ''}
      <p><b>Who is on it:</b> ${esc(x.who || 'Nobody has taken it yet')}.</p>
      <p><b>Your part:</b> ${open ? `the fix is built and tested, and waits for your answer to "${esc(q.title)}".` : q ? 'nothing now: your answer is in your 📮 box or on GitHub.' : 'nothing. The team fixes it and tells you here.'}</p></li>`; }).join('');
  const qs = Object.values(asks);
  return `<h3>🔥 Urgent corner · ${plural(list.length, 'problem')}</h3>
    ${qs.length ? `<p class="urgent-do"><strong>What you need to do:</strong> ${qs.length === 1 ? 'one answer fixes all of these.' : 'answer these questions.'}</p>${qs.map(q => `<button class="primary" type="button" data-urgentq="${esc(q.id)}">✍️ ${esc(q.title)}</button>`).join(' ')}` : '<p class="urgent-do"><strong>What you need to do:</strong> nothing right now. The team is working on them.</p>'}
    <ul class="urgent-list">${cards}</ul>`;
}
function urgentSignSVG() {
  const n = nowItems().u.length;
  return `<g class="urgent-sign${n ? ' alert' : ''}" data-walk="urgent" role="button" tabindex="0" aria-label="Urgent corner: ${n ? plural(n, 'urgent problem') : 'nothing urgent'}" transform="translate(228 70)"><rect width="34" height="24" rx="4" fill="${n ? '#B42318' : '#5F5E5A'}" stroke="#5A0F0B"/><text x="17" y="16.5" font-size="12" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">🔥${n || ''}</text></g>`;
}
const rolesFor = id => roles.filter(r => new RegExp('\\b' + id + '\\b').test(r.register?.findings || '')).map(r => r.n);
const msgTime = m => m.date + (m.time ? 'T' + m.time : '');
/* Assignments and team leads (Hiba, 25 Nov 2026: "I should be able to set assignments to teams … which AI handles a team …
   no one should be waiting"). Every team has one AI lead; a job nobody has taken goes to the lead of its team unless Hiba
   assigns someone else from the whiteboard. Assignments and lead changes travel like every answer: 📮 box → 🚀 Send all →
   a GitHub Issue the assigned AI is woken for (its to- label). The office shows them at once, before GitHub. */
const AIS = ['Claude Hiba', 'Claude Onsi', 'ChatGPT'], AI_KEY = { 'Claude Hiba': 'Hiba', 'Claude Onsi': 'Onsi', 'ChatGPT': 'ChatGPT' };
const TEAM_LEADS = { teaching: 'Claude Hiba', product: 'Claude Hiba', lead: 'Claude Hiba',
  technology: 'Claude Onsi', design: 'Claude Onsi', accessibility: 'Claude Onsi',
  'marketing-and-support': 'ChatGPT', 'privacy-lawyer': 'ChatGPT', 'child-safety-and-ai-ethics': 'ChatGPT' };
function assignRecords() { // newest last: [{ project, who, at, url, pending }]
  const r = [];
  THREADS.forEach(t => [t, ...(t.batch || []), ...t.comments.flatMap(c => [c, ...(c.batch || [])])].forEach(x => {
    if (/^(Assign|Team lead):/.test(x.project || '') && (x.to || []).length === 1 && /Hiba/.test(x.from || ''))
      r.push({ project: x.project, who: x.to[0], at: x.createdAt || t.createdAt, url: x.url || t.url }); }));
  OUT.filter(o => /^\[(Assign|Team lead)\]/.test(o.title || '')).forEach(o => { const m = /\*\*Project \/ feature:\*\*\s*(.*)/.exec(o.body || ''), w = /\*\*To:\*\*\s*(.*)/.exec(o.body || '');
    if (m && w && AIS.includes(w[1].trim())) r.push({ project: m[1].trim(), who: w[1].trim(), at: o.at, pending: o.status === 'waiting' }); });
  return r.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}
const lastRec = project => assignRecords().filter(x => x.project === project).slice(-1)[0];
const leadOf = teamId => { const r = lastRec('Team lead: ' + teamId); return r ? r.who : TEAM_LEADS[teamId] || 'Claude Onsi'; };
function defaultFor(id) { const n = rolesFor(id)[0], g = n ? teamOfRole(n) : null; return g ? { who: leadOf(g.id), team: g.name } : { who: 'Claude Onsi', team: null }; }
function assignOut(project, who, title, text) {
  NOW = null;
  sendOut({ kind: 'assign', key: 'assign-' + project.replace(/\W+/g, '-').toLowerCase() + '-' + Date.now().toString(36), title,
    labels: 'command-center,assignment', body: body({ to: who, project, text }) }, () => openGH(newIssueURL(title, body({ to: who, project, text }), 'command-center,assignment')));
  setTimeout(() => { NOW = null; const y = scrollY; renderNow(); scrollTo(0, y); }, 400);
}
function assignRow(id, title) {
  const a = lastRec('Assign: ' + id), d = defaultFor(id), cur = a ? a.who : null;
  return `<div class="assign-row" role="group" aria-label="Who works on ${esc(id)}"><span class="small"><strong>Assign to:</strong></span>
    ${AIS.map(w => `<button type="button" class="assign-btn${cur === w ? ' on' : !cur && d.who === w ? ' sug' : ''}" aria-pressed="${cur === w}" data-assign="${esc(id)}" data-assignwho="${esc(w)}" data-assigntitle="${esc(title)}">${CH.svg(CH.robot(AI_KEY[w]), 18)} ${esc(w.replace('Claude ', ''))}</button>`).join('')}
    ${a && a.pending ? '<span class="small">📮 in your box</span>' : ''}</div>`;
}
function takenBy(id) {
  const a = lastRec('Assign: ' + id); if (a) return { who: a.who, url: a.url, date: a.at, assigned: true, pending: !!a.pending };
  const m = (S.coordination.messages || []).filter(x => new RegExp('\\b' + id + '\\b').test(x.text) && /\b(Hiba|Onsi) account\b/.test(x.text)).sort((a, b) => msgTime(b).localeCompare(msgTime(a)))[0];
  return m ? { who: 'Claude ' + /\b(Hiba|Onsi) account\b/.exec(m.text)[1], url: m.url, date: m.date } : null;
}
let NOW = null;
function nowItems() {
  if (NOW) return NOW;
  const u = openP0.map(d => { const t = takenBy(d.id), rs = rolesFor(d.id), df = defaultFor(d.id);
    return { id: 'p0-' + d.id, cls: 'u', tag: 'Urgent · ' + d.id, title: plainDefect(d), who: t ? t.who : df.who,
      sub: t ? `${t.assigned ? 'Assigned to' : 'Being fixed by'} ${t.who} · ${rs.length ? plural(rs.length, 'expert') + ' involved' : 'no expert role named yet'}` : `Goes to ${df.who}${df.team ? ', lead of ' + df.team : ''}`,
      roles: rs, url: t ? t.url : d.url, task: `Fix ${d.id} (${d.title}). Evidence: ${d.evidence}` }; });
  const RANK = { "Hiba's decision": 0, 'Team decision to keep or overrule': 1, 'New rule': 2, 'Teaching rule (v1 wording)': 3 };
  const y = S.decisions.pending.filter(p => p.kind in RANK && stateOf(p.id).k !== 'git').sort((a, b) => RANK[a.kind] - RANK[b.kind])
    .map(p => { const real = (p.options && p.options.length) ? p.options : ['Approve'];
      return { id: p.id, cls: 'y', tag: p.kind === "Hiba's decision" ? 'Your decision' : p.kind, title: p.title, opts: [...real, ...(real.some(o => /^not yet$/i.test(o)) ? [] : ['Not yet'])], url: p.url, dec: true, fromAI: p.fromAI || null,
        bring: /^Teaching rule/.test(p.kind) ? 102 : null, multi: !!p.multi }; });
  const w = S.website;
  if (w && w.preview && !w.preview.confirmed && !SITE_LOCAL) y.unshift({ id: 'site-link', cls: 'y', tag: 'For you', title: 'Does the website open for you?', sub: 'Open it, then tell the team', open: w.preview.url, url: w.preview.source, dec: true, opts: ['Yes, it opens', 'No, it says Page not found'] });
  const rest = pendingCount() - y.filter(x => x.dec).length;
  const a = [], seen = new Set(), add = x => { if (!seen.has(x.title)) { seen.add(x.title); a.push(x); } };
  const msgs = S.coordination.messages || [];
  S.pullRequests.filter(p => p.state === 'open').forEach(p => {
    const m = msgs.filter(x => !x.done && new RegExp('#' + p.n + '\\b').test(x.text) && /^(Hiba|Onsi)$/.test(x.to)).sort((x1, x2) => msgTime(x2).localeCompare(msgTime(x1)))[0];
    const who = m ? 'Claude ' + m.to : p.account === 'ChatGPT' ? 'Claude Onsi' : p.account ? 'Claude ' + p.account : 'Claude Hiba';
    add({ id: 'pr-' + p.n, cls: 'a', tag: 'Waiting on AI', title: `Review and merge PR #${p.n}`, sub: `Who: ${who}${m ? ' (asked in COORDINATION.md)' : ''} · ${p.title}`, who, url: p.url, task: `Review PR #${p.n} (${p.title}), run every test suite, and merge it if they pass, following CLAUDE.md.` }); });
  if (w && /awaiting/i.test(w.status)) add({ id: 'republish', cls: 'a', tag: 'Waiting on AI', title: 'Republish the customer website', sub: 'Who: Claude Hiba · ' + (w.statusWhy || ''), who: 'Claude Hiba', url: w.githubUrl, task: 'Republish the existing "WhySteps · Customer website" Artifact from main after running every test suite, then post the publish record (internal/command-center/README.md).' });
  const test = THREADS.find(t => /connection test/i.test(t.title));
  if (test && !test.comments.some(c => /Claude Hiba/.test(c.from || ''))) add({ id: 'conn-test', cls: 'a', tag: 'Waiting on AI', title: `Run the connection test and post it on #${test.n}`, sub: 'Who: Claude Hiba, from your own Command Center', who: 'Claude Hiba', url: test.url, task: `Open my Command Center Artifact, run Messages → Run connection test, and post the result on Issue #${test.n}.` });
  THREADS.filter(t => t.state === 'open').forEach(t => t.to.forEach(r => { if (r !== 'All three' && !t.comments.some(c => (c.from || '').includes(r)) && !(t.from || '').includes(r) && !/connection test/i.test(t.title))
    add({ id: `th-${t.n}-${r}`, cls: 'a', tag: 'Unanswered message', title: `#${t.n} ${t.title}`, sub: `Waiting for a reply from ${r}`, who: r, url: t.url, task: `Read GitHub Issue #${t.n} (${t.title}) and reply there.` }); }));
  liveDefects().filter(d => d.severity !== 'P0').forEach(d => { const t = takenBy(d.id), df = defaultFor(d.id), who = t ? t.who : df.who;
    add({ id: 'wb-' + d.id, cls: 'a', tag: 'Team job · ' + d.id, title: plainDefect(d), sub: `Who: ${who}${t ? (t.assigned ? ' (you assigned it)' : '') : df.team ? ` (leads ${df.team})` : ''}`, who, url: d.url, task: `Work on ${d.id} (${d.title}) with its team's experts and reviewers, following CLAUDE.md. Evidence: ${d.evidence || d.url}` }); });
  NOW = { u, y, a, rest };
  return NOW;
}
const chatOf = who => who === 'ChatGPT' ? 'ChatGPT' : who === 'Claude Onsi' ? 'Claude, signed in with the Onsi account' : 'Claude, signed in with the Hiba account';
const pasteWhere = who => `Paste it into ${chatOf(who)}.`;
/* 📋 Pass on (Hiba, 24 Nov 2026: "what does Send do?"): a sheet that says in plain words that this is a job, not a decision,
   what was copied, and the three steps to hand it over. Nothing is sent anywhere by pressing it. */
function passOnSheet(x) {
  const c = command(x);
  copy(c, 'Instruction for ' + x.who).catch(() => {});
  openSheet(`<p class="muted small">📋 A job for ${esc(x.who)}</p><h2 id="sheetTitle">${esc(x.title)}</h2>
    <p><strong>This is not a decision for you.</strong> It is a job that ${esc(x.who)} still has to do${x.sub ? ` (${esc(x.sub)})` : ''}.</p>
    <h3>What happened when you pressed it</h3><p>The instruction below was <strong>copied</strong>, ready to paste. Nothing was sent anywhere yet.</p>
    <h3>To hand the job over now</h3><ol class="steps"><li>Open ${esc(chatOf(x.who))}.</li><li>Paste (⌘ V on a Mac, or long-press and Paste on a phone) and press Enter.</li><li>${esc(x.who)} does the job and records it on GitHub. It leaves this list at the next refresh.</li></ol>
    <p class="small muted">You only need to do this if you want it done now. Otherwise it waits for the next time you open ${esc(x.who)}.</p>
    <label class="small" for="passText">The instruction</label><textarea id="passText" rows="5" readonly>${esc(c)}</textarea>
    <div class="row" style="margin-top:8px"><button class="primary" type="button" data-copypass="1">📋 Copy it again</button></div>`);
}
const command = x => `WhySteps Command Center → ${x.who}\nTask: ${x.task || x.title}\nSource: ${x.url}\nFollow CLAUDE.md and COORDINATION.md, then record the result on GitHub.`;
function nowCard(x) {
  const btn = x.dec ? `${explainBtn(x.id)}<div class="opts">${x.opts.map(o => `<button class="opt" type="button" data-quickdec="${esc(x.id)}" data-opt="${esc(o)}">${esc(cap(o))}</button>`).join('')}</div><p class="small muted">${DB ? '📮 Goes in your box; 🚀 Send all sends the whole box to GitHub at once.' : '🚀 Opens GitHub with your answer filled in; it counts once you press the green Submit.'}</p>`
    : x.open ? `<a class="primary wide" href="${esc(x.open)}" target="_blank" rel="noopener">Open the website ${icon('ext')}</a>`
    : x.who ? `<button class="primary wide" type="button" data-send="${esc(x.id)}">${icon('copy')}Pass this job to ${esc(x.who)}</button><p class="small muted">Not a decision: it copies the job so you can paste it into ${esc(x.who)}'s chat.</p>`
    : `<button class="ghost wide" type="button" data-askteam="${esc(x.id)}">Ask the team who takes it</button>`;
  return `<article class="ncard n-${x.cls}"><div class="row" style="justify-content:space-between"><span class="ntag">${esc(x.tag)}</span>${src(x.url)}</div>
    <h3>${esc(x.title)}</h3>${x.sub ? `<p class="small muted">${esc(x.sub)}</p>` : ''}
    ${x.roles && x.roles.length ? `<div class="avs">${x.roles.slice(0, 8).map(n => `<button class="av" type="button" data-role="${n}" title="#${n} ${esc(roleBy[n]?.title || '')}">${n}</button>`).join('')}${x.roles.length > 8 ? `<span class="av more">+${x.roles.length - 8}</span>` : ''}</div>` : ''}
    ${btn}</article>`;
}
function aiNow(w) {
  const N = nowItems(), mine = [...N.u, ...N.a].filter(x => x.who === w.id);
  const fixing = N.u.filter(x => x.who === w.id).length;
  const last = activity.filter(x => x.actor === w.key && x.date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const doing = fixing ? `Fixing ${plural(fixing, 'urgent problem')}` : mine.length ? `${plural(mine.length, 'task')} waiting for it` : 'Nothing waiting for it';
  const dot = fixing ? 'busy' : mine.length ? 'wait' : 'idle';
  return `<div class="ainow"><span class="robot">${CH.svg(CH.robot(w.key), 40)}</span><div><strong>${esc(w.id)}</strong><p><span class="dot d-${dot}"></span>${esc(doing)}</p>${last ? `<p class="muted small">Last: ${esc(last.title.slice(0, 70))}${last.title.length > 70 ? '…' : ''} · ${fmt(last.date)}</p>` : ''}</div><button class="ghost" type="button" data-compose="${esc(w.id)}">💬 Write to ${esc(w.id)}</button></div>`;
}
/* ------------------------------------------------------------ rooms: AI lab, Experts hall, Whiteboard */
const ROOMS = { office: 'Your office', ai: 'AI lab', experts: 'Experts hall', board: 'Whiteboard', meeting: 'Meeting room', coffee: 'Coffee room', lunch: 'Lunch corner', spa: 'Massage room' };
const ROOM_OF = { ai: 'ai', board: 'board', door: 'experts', meeting: 'meeting', coffee: 'coffee' };
function roomNav() {
  return `<nav class="room-nav" aria-label="Rooms">${Object.entries(ROOMS).map(([k, n]) => `<button type="button" class="room-tab" data-room="${k}" aria-pressed="${(st.room || 'office') === k}">${esc(n)}</button>`).join('')}</nav>`;
}
const mateSVG = (n, w) => { const r = roleBy[n]; return CH.svg(CH.person(CH.look(n, r && r.dept)), w || 46); };
const avatarRow = (ns, max) => `<div class="faces">${ns.slice(0, max || 8).map(n => `<button class="face-btn" type="button" data-role="${n}" title="#${n} ${esc(roleBy[n]?.title || '')}" aria-label="#${n} ${esc(roleBy[n]?.title || '')}">${mateSVG(n, 30)}<span>${n}</span></button>`).join('')}${ns.length > (max || 8) ? `<span class="more-faces">+${ns.length - (max || 8)}</span>` : ''}</div>`;
function roomShell(r, sub, body) {
  return `<section class="room-scene room-${r}" aria-label="${esc(ROOMS[r])}">
    <div class="room-top"><span class="me-mini">${CH.svg(CH.FOUNDER, 40)}</span><div><h2>${esc(ROOMS[r])}</h2><p class="small muted">${sub}</p></div>${keycap('go-office', 'Back to my office', 'backbreak')}</div>
    ${body}</section>`;
}
/* ------------------------------------------------------------ team meetings (Hiba, 24 Nov 2026)
   Hiba calls a whole team into the meeting room, goes round the table one person at a time, sees what each is working on,
   and marks each one "Approved: on to the next job" or "Needs improvement" with her instructions. Ending the meeting sends
   one set of minutes to both Claude accounts (📮 box or GitHub), because the team's work is done by Claude. */
const tmNotes = gid => (store.get('teamMeetNotes', {}) || {})[gid] || {};
function tmSetNote(gid, n, v) { const all = store.get('teamMeetNotes', {}) || {}; all[gid] = { ...(all[gid] || {}), [n]: v }; store.set('teamMeetNotes', all); }
const tmGroup = () => deptGroups().find(x => x.id === store.get('teamMeet', null));
const tmList = () => { const g = tmGroup(); return g ? deptRoles(g) : []; };
const tmCur = () => { const L = tmList(), c = store.get('teamMeetCur', null); return L.includes(c) ? c : L.find(n => !tmNotes(tmGroup().id)[n]) || L[0]; };
const TMV = { angry: ['😡 Not done properly: redo it 100%', '#B42318'], ok: ['Approved: on to the next job', '#1D9E75'], fix: ['Needs improvement', '#E08A1E'], ask: ['Asked to explain what they did', '#185FA5'], skip: ['Later', '#888780'] };
const TM_EXPLAIN = 'Explain in plain words, with no technical terms: what you did, why, and where Hiba can see it on the website. Then show it at the next meeting.';
/* The whole team in plain words, so Hiba does not have to open each person (Hiba, 24 Nov 2026). */
function tmSummary(g) {
  const rs = deptRoles(g), reg = n => (roleBy[n] && roleBy[n].register) || {};
  const by = f => rs.filter(f), started = by(n => reg(n).work && reg(n).work !== 'not started');
  const findings = [...new Set(rs.flatMap(n => String(reg(n).findings || '').split(/;\s*/)).map(x => x.trim()).filter(Boolean))];
  return { rs, notStarted: by(n => !reg(n).work || reg(n).work === 'not started'), started, issues: by(n => reg(n).verdict === 'issue found'),
    noExplain: started.filter(n => !reg(n).findings && !reg(n).evidence), findings, live: liveDefects().filter(d => rolesFor(d.id).some(n => rs.includes(n))) };
}
function tmAll(v) {
  const g = tmGroup(); if (!g) return;
  const ta = $('#tmTeamNote'); let note = ta ? ta.value.trim() : '';
  if (v === 'ask' && !note) note = TM_EXPLAIN;
  if (v === 'angry' && !note) note = ANGRY_NOTE;
  if (v === 'fix' && !note) { toast('Write what the team must improve first.'); ta && ta.focus(); return; }
  if (SECRET.test(note)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
  const N = tmNotes(g.id), at = new Date().toISOString();
  deptRoles(g).forEach(n => { if (!N[n] || N[n].v === 'skip') tmSetNote(g.id, n, { v, note, at, all: true }); });
  tmEnd();
}
function tmStatusLine(g) {
  if (store.get('teamMeet', null) === g.id) return '<span class="small muted">In the meeting room now.</span>';
  if ((store.get('calledTeams', []) || []).includes(g.id)) return '<span class="small muted">Called: waiting outside the meeting room.</span>';
  const last = (store.get('teamMeetLast', {}) || {})[g.id];
  return last ? `<span class="small muted">Last meeting ${esc(fmt(last.at))}: ${last.angry ? `😡 ${last.angry} sent back, ` : ''}${last.ok} approved, ${last.fix} to improve${last.ask ? `, ${last.ask} asked to explain` : ''}.</span>` : '';
}
function callTeam(gid) {
  const cur = store.get('teamMeet', null);
  if (cur && cur !== gid) { const q = (store.get('calledTeams', []) || []).filter(x => x !== gid); store.set('calledTeams', [...q, gid]); toast('📣 Called. The team waits outside the meeting room until you finish the current meeting.'); }
  else { store.set('teamMeet', gid); store.set('teamMeetCur', null); toast('📣 The team is coming into the meeting room.'); }
  closeSheet(); enterRoom('meeting');
}
function tmGo(n) { store.set('teamMeetCur', n); const y = scrollY; renderNow(); scrollTo(0, y); $('#tmCard')?.scrollIntoView({ block: 'nearest' }); }
function tmVerdict(v) {
  const g = tmGroup(), n = tmCur(); if (!g || !n) return;
  const ta = $('#tmNote'); let note = ta ? ta.value.trim() : '';
  if (v === 'angry' && !note) note = ANGRY_NOTE;
  if (v === 'fix' && !note) { toast('Write what needs improving first, so they know what to do.'); ta && ta.focus(); return; }
  if (SECRET.test(note)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
  tmSetNote(g.id, n, { v, note, at: new Date().toISOString() });
  const L = tmList(), N = tmNotes(g.id), next = L.slice(L.indexOf(n) + 1).concat(L).find(x => !N[x]);
  toast(v === 'angry' ? `😡 #${n} goes back to finish it 100%.` : v === 'ok' ? `✓ #${n} approved: on to the next job.` : v === 'fix' ? `✍ #${n} has your instructions.` : `#${n} later.`);
  store.set('teamMeetCur', next || n); const y = scrollY; renderNow(); scrollTo(0, y);
}
function tmEnd() {
  const g = tmGroup(); if (!g) return; const L = deptRoles(g), N = tmNotes(g.id);
  const of = v => L.filter(n => N[n] && N[n].v === v), angry = of('angry'), ok = of('ok'), fix = of('fix'), ask = of('ask'), rest = L.filter(n => !N[n] || N[n].v === 'skip');
  if (!angry.length && !ok.length && !fix.length && !ask.length) { toast('Give the team a verdict first: for everyone at once, or person by person.'); return; }
  const lines = list => { if (!list.length) return ['- nobody'];
    const groups = {}; list.forEach(n => { const k = (N[n].note || '').replace(/\s+/g, ' '); (groups[k] = groups[k] || []).push(n); });
    return Object.entries(groups).map(([note, ns]) => ns.length === L.length ? `- The whole team (${L.length} people)${note ? ': ' + note : ''}`
      : ns.length === 1 ? `- #${ns[0]} ${roleBy[ns[0]] ? roleBy[ns[0]].title : ''}${note ? ': ' + note : ''}` : `- ${ns.map(n => '#' + n).join(', ')}${note ? ': ' + note : ''}`); };
  const text = [`Hiba met the ${g.name} team in the meeting room (${L.length} people).`, '',
    ...(angry.length ? [`**😡 Not done properly (${angry.length}): go back and finish it 100%.** Every part, every test suite, builder and reviewer checks, then a plain explanation of what was wrong and what you changed. Only then ask Hiba again. No excuses.`, ...lines(angry), ''] : []),
    `**Needs improvement (${fix.length}):** do what Hiba wrote, then reply on this thread with what you changed (pull request links).`, ...lines(fix), '',
    `**Asked to explain what they did (${ask.length}):** reply on this thread in plain words, no technical terms.`, ...lines(ask), '',
    `**Approved, on to the next job (${ok.length}):**`, ...lines(ok), '',
    `**Not discussed yet (${rest.length}):** ${rest.length ? rest.map(n => '#' + n).join(', ') : 'none'}`].join('\n');
  const project = `Team meeting: ${g.name}`, b = body({ to: 'Claude Hiba, Claude Onsi', project, roles: L.map(n => '#' + n).join(', '), text });
  const lb = angry.length ? 'command-center,not-done-properly' : 'command-center';
  sendOut({ kind: 'message', title: 'Message: ' + project, body: b, labels: lb }, () => { openGH(newIssueURL('Message: ' + project, b, lb)); toast('🚀 GitHub opened with the meeting minutes. They are posted only when you press the green Submit there.'); });
  const last = store.get('teamMeetLast', {}) || {}; last[g.id] = { at: new Date().toISOString(), angry: angry.length, ok: ok.length, fix: fix.length, ask: ask.length }; store.set('teamMeetLast', last);
  const all = store.get('teamMeetNotes', {}) || {}; all[g.id] = {}; store.set('teamMeetNotes', all);
  const q = store.get('calledTeams', []) || [];
  store.set('teamMeet', q[0] || null); store.set('calledTeams', q.slice(1)); store.set('teamMeetCur', null);
  if (q[0]) setTimeout(() => toast('📣 Minutes done. The next team comes into the meeting room.'), 1800);
  const y = scrollY; renderNow(); scrollTo(0, y);
}
function teamMeetingHTML(g) {
  const L = deptRoles(g), N = tmNotes(g.id), cur = tmCur(), r = roleBy[cur] || {}, reg = r.register || {}, done = L.filter(n => N[n] && N[n].v !== 'skip').length;
  const live = liveDefects().filter(d => rolesFor(d.id).includes(cur)), q = store.get('calledTeams', []) || [];
  const k = L.length, sc = k > 18 ? .4 : k > 12 ? .46 : .55;
  const seats = L.map((n, i) => { const a = Math.PI * (1.16 + 1.68 * (k > 1 ? i / (k - 1) : .5)), x = 215 + Math.cos(a) * 165, y = 150 + Math.sin(a) * 78;
    const v = N[n] && TMV[N[n].v], on = n === cur;
    return `<g class="tmseat${on ? ' on' : ''}" role="button" tabindex="0" data-tmpick="${n}" aria-label="#${n} ${esc(roleBy[n]?.title || '')}${v ? ': ' + v[0] : ''}" transform="translate(${(x - 45 * sc).toFixed(0)} ${(y - 100 * sc - (on ? 8 : 0)).toFixed(0)}) scale(${sc})">
      ${on ? '<ellipse cx="45" cy="112" rx="34" ry="8" fill="#F2C14E" opacity=".7"/>' : ''}${CH.person(CH.look(n, roleBy[n] && roleBy[n].dept))}
      <rect x="14" y="-16" width="44" height="22" rx="11" fill="${v ? v[1] : 'var(--ink)'}"/><text x="36" y="0" font-size="15" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">${n}${v ? (N[n].v === 'angry' ? ' 😡' : N[n].v === 'ok' ? ' ✓' : N[n].v === 'fix' ? ' ✍' : N[n].v === 'ask' ? ' ?' : '') : ''}</text></g>`; }).join('');
  const scene = `<svg viewBox="0 0 430 270" class="meet-svg tm-svg" role="img" aria-label="Meeting room: you and the ${esc(g.name)} team (${k} people) around the table">
    <rect width="430" height="270" fill="var(--floor)"/><rect y="190" width="430" height="80" fill="light-dark(#E8EFFA,#1C3346)"/>
    <g transform="translate(8 8)"><rect width="190" height="24" rx="4" fill="#fff" stroke="#888780"/><text x="95" y="16" font-size="11" text-anchor="middle" fill="#253E43" font-family="sans-serif" font-weight="700">Meeting: ${esc(g.name.slice(0, 28))}</text></g>
    <ellipse cx="215" cy="160" rx="135" ry="52" fill="#E8D8BE" stroke="#B98B67" stroke-width="2"/><ellipse cx="215" cy="156" rx="135" ry="52" fill="#F3E6D0"/>
    <g transform="translate(12 104) scale(.62)">${CH.FOUNDER}</g><text x="40" y="190" font-size="10" text-anchor="middle" fill="var(--ink)" font-family="sans-serif" font-weight="700">You</text>
    ${seats}</svg>`;
  const chip = n => { const v = N[n] && TMV[N[n].v]; return `<li><button class="tmchip${n === cur ? ' on' : ''}" type="button" data-tmpick="${n}" style="--c:${v ? v[1] : 'var(--line)'}"><b>#${n}</b> ${esc(roleBy[n]?.title || '')}<small>${v ? esc(v[0]) : 'Not discussed yet'}</small></button></li>`; };
  const mine = N[cur];
  const card = `<section class="panel tmcard" id="tmCard" aria-live="polite">
    <div class="asker"><span class="mini">${CH.svg(CH.person(CH.look(cur, r.dept)), 52)}</span><div><p class="who-line"><strong>#${cur} ${esc(r.title || '')}</strong><span>${esc(deptPlain(r.dept))}</span></p><p class="small muted" style="margin:2px 0 0">${L.indexOf(cur) + 1} of ${k} at the table</p></div></div>
    <p class="small"><strong>Their job:</strong> ${esc(r.responsibility || r.job || 'Not stated in the roster')}</p>
    <p class="small"><strong>What they are doing now:</strong> ${esc(reg.work ? cap(reg.work) : 'Not recorded')}${reg.verdict ? ` · check result: ${esc(reg.verdict)}` : ''}${r.report && r.report.statusText ? ` · last report: ${esc(r.report.statusText)}` : ''}</p>
    ${reg.findings ? `<p class="small"><strong>What they found:</strong> ${esc(reg.findings)}</p>` : ''}
    ${live.length ? `<p class="small"><strong>Open problems:</strong> ${live.map(d => esc(plainDefect(d)) + ' ' + src(d.url, d.id)).join(' · ')}</p>` : ''}
    <p class="small">${src(r.report && r.report.url, 'Their report')} ${src(r.rosterUrl, 'Roster')}</p>
    ${mine ? `<p class="small tmdone" style="--c:${TMV[mine.v][1]}"><strong>${esc(TMV[mine.v][0])}</strong>${mine.note ? `: “${esc(mine.note)}”` : ''} <span class="muted">(you can change it)</span></p>` : ''}
    <label class="small" for="tmNote"><strong>Your instructions</strong> (needed for “Needs improvement”; for “Approved” you can name their next job)</label>
    <textarea id="tmNote" class="teamnote" rows="3" placeholder="For example: check the Arabic screens on a phone, then show me again.">${esc(mine && mine.note || '')}</textarea>
    <div class="row teamrow"><button class="primary angry" type="button" data-tmverdict="angry">😡 Not done properly</button><button class="primary" type="button" data-tmverdict="ok">✓ Approved: on to the next job</button><button class="primary warn" type="button" data-tmverdict="fix">✍ Needs improvement</button><button class="ghost" type="button" data-tmverdict="skip">Later</button></div>
    <div class="row teamrow"><button class="ghost" type="button" data-tmstep="-1">← Previous person</button><button class="ghost" type="button" data-tmstep="1">Next person →</button></div>
  </section>`;
  const T = tmSummary(g), ids = ns => ns.map(n => '#' + n).join(', ');
  const team = `<section class="panel tmteam"><h3>The whole team in plain words</h3>
    <ul class="list small">
      <li><strong>${T.started.length} of ${k}</strong> have started work${T.started.length ? ` (${esc(ids(T.started))})` : ''}; <strong>${T.notStarted.length}</strong> have not started yet.</li>
      ${T.noExplain.length ? `<li class="warnline"><strong>${T.noExplain.length} did something but left no explanation</strong> (${esc(ids(T.noExplain))}).</li>` : ''}
      <li><strong>${T.issues.length}</strong> found a problem when checking.${T.findings.length ? ' What they found: ' + T.findings.slice(0, 6).map(esc).join('; ') + (T.findings.length > 6 ? ` (and ${T.findings.length - 6} more)` : '') : ''}</li>
      <li>${T.live.length ? `Open problems: ${T.live.map(d => esc(plainDefect(d)) + ' ' + src(d.url, d.id)).join(' · ')}` : 'No open problem assigned to this team on the reviewed build.'}</li>
    </ul>
    <label class="small" for="tmTeamNote"><strong>One instruction for the whole team</strong> (optional for “Explain” and “Approve”)</label>
    <textarea id="tmTeamNote" class="teamnote" rows="3" placeholder="${esc(TM_EXPLAIN)}"></textarea>
    <div class="row teamrow"><button class="primary angry" type="button" data-tmall="angry">😡 Whole team: not done properly</button><button class="primary" type="button" data-tmall="ask">❓ Ask the whole team to explain what they did</button><button class="primary warn" type="button" data-tmall="fix">✍ Whole team: needs improvement</button><button class="ghost" type="button" data-tmall="ok">✓ Approve the whole team</button></div>
    <p class="small muted">One press, nothing to write: 😡 sends everyone back with your standard message. Each button applies to everyone you have not marked yet and sends the meeting minutes${DB ? ' to your 📮 box' : ' (GitHub opens filled in)'}. Going person by person below is optional.</p></section>`;
  const one = `<details class="tmone"${Object.keys(N).length || store.get('teamMeetCur', null) ? ' open' : ''}><summary>💬 Talk to one person at a time (optional)</summary>${card}</details>`;
  return roomShell('meeting', `The ${esc(g.name)} team is at the table. Give the whole team one verdict, or go person by person. Your notes stay on this device until you end the meeting; then the minutes go to both Claude accounts.`,
    `<div class="meet"><div>${scene}${team}${one}</div>
      <div class="meet-side"><section class="panel"><h3>Round the table · ${done} of ${k} discussed</h3><ol class="tmlist">${L.map(chip).join('')}</ol></section>
        <section class="panel"><button class="primary" type="button" data-tmend>🏁 End meeting and send the minutes</button>
          <p class="small muted">${DB ? 'The minutes go in your 📮 box; 🚀 Send all sends them to GitHub.' : 'Opens GitHub with the minutes filled in; press the green Submit.'}</p>
          ${q.length ? `<p class="small"><strong>Waiting outside:</strong> ${q.map(id => esc((deptGroups().find(x => x.id === id) || {}).name || id)).join(', ')}</p><button class="ghost" type="button" data-tmnextteam>Bring in the next team (${esc((deptGroups().find(x => x.id === q[0]) || {}).name || '')})</button><p class="small muted">End this meeting first if you want its minutes sent.</p>` : ''}
          <button class="ghost" type="button" data-tmleave>Pause: the team goes back to its room</button></section></div></div>`);
}
/* ------------------------------------------------------------ rooms of their own: one per AI, one per department */
const AI_TINT = { Hiba: '#DCEBFA', Onsi: '#E3F3E8', ChatGPT: '#EEE8FB' };
function quickBox(id, to, project, thread, label, ph) {
  return `<div class="quickbox"><label for="qb-${id}" class="small"><strong>${esc(label)}</strong></label>
    <textarea id="qb-${id}" rows="2" placeholder="${esc(ph || 'Write a comment, an update or an answer…')}"></textarea>
    <div class="row"><button class="primary" type="button" data-qb="${esc(id)}" data-qbto="${esc(to)}" data-qbproject="${esc(project)}" data-qbthread="${thread || ''}">${icon('send')}${DB ? '📮 Put in my box' : thread ? 'Reply' : 'Send'}</button>
    <span class="small muted">${DB ? '📮 Goes in your box; 🚀 Send all sends it to GitHub.' : '🚀 Opens GitHub filled in; press the green Submit.'}</span></div></div>`;
}
function quickSend(btn) {
  const id = btn.dataset.qb, ta = document.getElementById('qb-' + id), text = ta ? ta.value.trim() : '';
  if (!text) { toast('Write something first.'); ta && ta.focus(); return; }
  if (SECRET.test(text)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
  const thread = btn.dataset.qbthread ? +btn.dataset.qbthread : null, t = thread && THREADS.find(x => x.n === thread);
  const b = body({ to: btn.dataset.qbto, project: btn.dataset.qbproject, text, links: t ? t.url : '' });
  const title = 'Message: ' + btn.dataset.qbproject;
  sendOut({ kind: 'message', title: thread ? '' : title, body: b, labels: 'command-center', issue: thread }, () => {
    if (t) { copy(b, 'Reply'); window.open(t.url + '#new_comment_field', '_blank', 'noopener'); return; }
    openGH(newIssueURL(title, b, 'command-center')); toast('🚀 GitHub opened with your message. It is posted only when you press the green Submit there.'); });
  if (ta) ta.value = '';
}
/* "Explain it simply": plain-English notes for each of Hiba's own decisions (from the approval sheet of 22 Nov 2026),
   written by the team. Other questions can ask Live Claude (labelled as AI, uses Hiba's Claude allowance). */
const EXPLAIN = {
  'decision-3.1': { what: 'Some demo lessons inside WhySteps use real children\'s names, and texts copied from real school books (the Hastings reading text, Main Idea Detective, محقّق الحروف).',
    why: 'Children\'s names are private information, and school-book pages belong to their publishers. When the website goes online, anyone could see them.',
    opts: { 'move them to a private copy and use made-up texts (team recommends)': 'The real names and pages are kept in a private copy outside the code, and the demo lessons get invented names and texts written by the team. The lessons keep working.',
      'keep them': 'Everything stays as it is, so the real names and book pages stay in the code and in the demo.' },
    rec: 'The team recommends the private copy: it protects the children and avoids copyright trouble before anything goes public.' },
  'decision-3.2': { what: 'The project notes on GitHub (the progress file, and one line in the Command Center) show your two personal Gmail addresses, the ones used for the Claude accounts.',
    why: 'The project is private today. But anyone you later give access to (a developer, a helper) would see them, and personal emails that get around attract spam and fake "account" emails.',
    opts: { 'remove them (team recommends)': 'The emails are replaced with plain names like "the Hiba account" and "the Onsi account". Your accounts keep working exactly the same. Older saved versions on GitHub still hold them; cleaning those is a separate step that needs your permission.',
      'keep them': 'The emails stay in the notes as they are.' },
    rec: 'The team recommends removing them: nothing breaks, and your personal emails stop being written in the project.' },
  'decision-3.3': { what: 'KG2 children cannot read yet, so lesson instructions need to be spoken. Which voice should WhySteps use?',
    why: 'Pronunciation matters most for the youngest, especially Arabic letters: a wrong sound teaches the wrong thing.',
    opts: { 'recorded native speakers (team recommends, for KG2 letters and words)': 'Real people who speak Arabic, English and French record the letters and words once. It sounds the most natural and correct. It needs people to record, which may cost money.',
      'a paid voice service, after a listening test': 'A company\'s computer voice reads the words. It is easy to make new audio, but it is a monthly cost, and you would first listen to check the Arabic sounds right.',
      'decide later': 'Nothing changes for now: Tiko keeps the device\'s voice and the Reading Lab stays silent (your choice of 22 Nov), and the final voice is chosen at the last stage.' },
    rec: 'The team recommends recorded native speakers for KG2 letters and words, because correct sounds matter most there.' },
  'decision-3.4': { what: 'Should the KG2 (youngest) lessons have sound ready before WhySteps opens to families?',
    why: 'A KG2 child cannot read the instructions, so without sound they need a parent next to them.',
    opts: { 'yes (team recommends)': 'Launch waits until KG2 has sound, so the youngest can use it on their own from the first day.',
      'after launch': 'WhySteps can open sooner, and KG2 children need a parent to read the instructions until sound is added.' },
    rec: 'The team recommends yes: the youngest children are the ones who most need sound.' },
  'decision-3.5': { what: 'Today WhySteps runs only as private previews. Putting it online for families needs four things:',
    why: 'Supabase keeps accounts and progress safe; Vercel puts the website on the internet; a domain is the web address (like whysteps.com); an Anthropic key lets the lesson maker use Claude, with a spending limit so it can never cost more than you set. These are new accounts and some cost money, which is why only you decide.',
    opts: { 'set up Supabase, Vercel, a domain and an Anthropic key with a spending limit, guided step by step': 'Claude walks you through creating each account, one step at a time. You stay in control of every payment.',
      'not yet': 'WhySteps stays private while the team keeps building and testing.' },
    rec: 'No recommendation from the team: it depends on when you want families to start.' },
  'decision-3.6': { what: 'An email address families can write to for help, for example a support address for WhySteps.',
    why: 'Once families use WhySteps, they need a way to reach you. Creating a new email account is something only you can do.',
    opts: { 'yes, Hiba creates one': 'You create the address (Claude can guide you), and the team adds it to the website.',
      'not yet': 'No contact address for now. That is fine while WhySteps is still private.' },
    rec: 'No recommendation from the team: it is needed before going online.' },
  'decision-3.7': { what: 'How much WhySteps will cost families, and which company takes the card payments.',
    why: 'Payment companies differ in fees and in whether they work for a business in Lebanon.',
    opts: { 'show the options as a one-page comparison of providers for a Lebanese business': 'The team prepares one simple page comparing the payment companies (fees, cards, how you get paid). You only read it; choosing this commits you to nothing.',
      'not yet': 'Pricing waits until later.' },
    rec: 'No recommendation from the team: the comparison is just information for you.' },
  'decision-3.8': { what: 'The code lives in the GitHub account H2ONLB. There was a plan to move it to the GitHub account H2OLB.',
    why: 'Moving changes who owns it and the web links to it. That is an access change, so it needs your yes.',
    opts: { 'still wanted': 'The team moves it with you, step by step, and updates every link. Nothing is lost.',
      'cancel': 'It stays in H2ONLB, as it is now.' },
    rec: 'No recommendation from the team: it is about where you want the project to live.' },
};
// Plain explanations for the approval-sheet items (reviews/2026-11-22/hiba-approval-sheet.md), so none of them comes to Hiba's office without one (Hiba, 24 Nov 2026).
{
  const RULE_OPTS = { 'each point of the rule': 'Pressing a point approves it exactly as written. From then on the team builds and tests every lesson against it.', 'not yet': 'Nothing is approved. The rule stays a draft, the team keeps following the current version, and it comes back to you later.' };
  const NEW_OPTS = { 'approve': 'The rule is added as written. The team builds and tests against it from now on.', 'not yet': 'The rule stays a proposal. Nothing changes in the product, and it comes back to you later.' };
  const TEAM_OPTS = { 'approve': 'You keep the team\'s decision. Nothing changes; it is simply recorded as yours.', 'not yet': 'The decision stays as the team made it for now, but it is not final. To overrule it instead, press ↩ Send back to fix and say what you want.' };
  const RULE = (what, why) => ({ what, why, opts: RULE_OPTS, rec: 'The team recommends approving every point: each one comes from a teaching specialist\'s review, and nothing here costs money.' });
  const NEW = (what, why) => ({ what, why, opts: NEW_OPTS, rec: 'The team recommends approving it.' });
  const TEAM = (what, why) => ({ what, why, opts: TEAM_OPTS, rec: 'The team recommends keeping it.' });
  Object.assign(EXPLAIN, {
    'rule-1': RULE('How lessons work for the youngest children (KG2 and Grade 1): one instruction at a time, short sessions of about 5 to 10 minutes, no timers, and every instruction shown with a picture, a demonstration or sound, never words alone.', 'Children of 4 to 6 mostly cannot read yet. If an instruction is only written, the lesson tests reading instead of the skill, and timers make small children anxious.'),
    'rule-2': RULE('How WhySteps reads the school material: it tells a topic apart from the real goal, offers the parent a short choice when the goal is unclear, asks only about new or unclear parts, and flags missing content instead of inventing it.', 'A lesson aimed at the wrong goal wastes the child\'s time. Asking the parent one precise question keeps it short, and inventing content would teach things the school never taught.'),
    'rule-3': RULE('How English reading and phonics are taught: the school\'s order of sounds where known, reading checks with only patterns already taught, pictures that confirm meaning but never let the child guess the word, and from Grade 3 word parts, homophones and spelling rules.', 'If a picture gives the word away, the child guesses instead of reading, and the parent report would say the child can read when they cannot.'),
    'rule-4': RULE('How Arabic letters and spelling (إملاء) are taught: vowel marks follow the school text and the child, with full marks as the default for beginners; any word said aloud is checked by an Arabic teacher; and a spelling ladder by grade.', 'Beginners read Arabic through the vowel marks. Wrong marks or a wrong pronunciation would teach a mistake that is hard to undo.'),
    'rule-5': RULE('How Arabic vocabulary and grammar are taught: picture pairs that change only one thing, then a fresh sentence to check meaning; neutral address by default with an optional boy or girl form; and a grammar ladder up to إعراب and بلاغة, with matching paths for English and French.', 'Changing one thing at a time shows exactly what the child understood. The ladder lets older children keep growing instead of repeating early grammar.'),
    'rule-6': RULE('How reading comprehension is checked: no fixed order of question words, the child shows the proof in the text, main-idea hints in a set order, and a year-by-year ladder from KG2 picture stories to Grade 12 analysis.', 'Showing the proof is how we know the child understood rather than guessed, and the hint order teaches a strategy the child can reuse.'),
    'rule-7': RULE('How thinking questions are built: wrong choices are real mistakes children make, "How do you know?" is asked when it tells two ways of thinking apart, and for young children pointing counts as a full explanation.', 'Real mistakes as wrong choices show the parent what the child actually misunderstands. Asking small children to write explanations would test writing, not thinking.'),
    'rule-8': RULE('How maths is taught: no tricks that stop being true later, every shortcut says when it works and is tested on the example most likely to break it, wording and scoring always agree, and a maths ladder up to Grade 12.', 'A trick like "multiplying makes bigger" fails later with fractions, and children then have to unlearn it. Testing shortcuts on hard examples catches that early.'),
    'rule-9': RULE('How each subject is taught: every language uses its own sounds and spelling, French follows the child\'s French level, silent-letter words are never sounded out letter by letter, and science and social studies have their own ladders by grade.', 'Arabic, English and French work differently. Teaching one with the rules of another builds the wrong habits.'),
    'rule-10': RULE('How writing is taught: a ladder from KG2 to Grade 12; first build the idea, then write, then reread for one purpose; and feedback that names the exact part it is about.', 'Children improve when each reread has one clear job and feedback points to a real sentence, not "good work" or "try harder".'),
    'rule-11': RULE('How WhySteps finds gaps: a second question tells two possible causes apart (which may be a skill from an earlier year), and one mistake is treated as a clue, never as a label.', 'Without the second question, a fractions mistake caused by weak times tables would be fixed in the wrong place. Labels after one mistake would be unfair to the child.'),
    'rule-12': RULE('How hints and memory work: a child who is ready tries alone first, review comes after about 1 day and 1 week (adjusted by results), and test revision is planned backwards from the test date.', 'Trying alone first and spaced review are what make learning last; cramming the night before fades within days.'),
    'rule-13': RULE('How language and inclusion work: فصحى stays the target, with an optional Lebanese explanation followed by a check; the unproven "21%" claim is removed; and there are dyslexia-friendly options, shorter steps and age-respectful help for older students.', 'The Lebanese bridge helps understanding without replacing فصحى. A number we cannot prove must not appear in WhySteps.'),
    'rule-14': RULE('How school question words are taught (compare, justify, استخرج, علّل…): one card per command word showing a complete answer and a checking habit, growing from KG2 to Grade 12.', 'Many children know the content but lose marks because they misread what the question asks.'),
    'rule-15': RULE('What parents are told: short meaningful notes, what the software saw kept apart from what the child said, never comparing siblings, no "fast taps" label, and teen privacy as in the team\'s Grades 9–12 decision.', 'Parents trust a report that says only what the child really showed. Comparing siblings or calling a child a "fast tapper" can hurt the child.'),
    'rule-A': NEW('Every trick or shortcut in a lesson is tested, including on an example chosen on purpose to break it.', 'A shortcut that works on easy examples but fails on hard ones teaches a mistake. Trying to break it first catches that before a child sees it.'),
    'rule-B': NEW('Rewards (stars, celebrations, badges) fit the child\'s age.', 'Cartoon stars feel babyish to a 14-year-old, and long point systems overwhelm a 5-year-old. The wrong reward makes children stop caring.'),
    'rule-C': NEW('Practice stays calm: no countdown timers, no pressure sounds, no losing streaks.', 'Stress makes children guess instead of think, so the results stop showing what they really know.'),
    'rule-D': NEW('Every "report a mistake" goes through a review: someone checks it, fixes it if it is right, and tells the family what happened.', 'A report button that nobody answers loses parents\' trust. A review also stops wrong "fixes" from going in.'),
    'rule-E': NEW('Children\'s names are removed from text, files, headers, photos and handwriting before anything is sent to the AI.', 'Children\'s names are private. The AI does not need them to make a lesson.'),
    'rule-F': NEW('WhySteps says a child is "secure" only for one narrow skill, never for a whole subject.', 'Getting 5 fraction questions right does not mean "secure in maths". Overclaiming misleads parents.'),
    'rule-G': NEW('When two rules conflict, there is one fixed order of which wins, with accessibility near the top.', 'Without an order, each lesson would solve conflicts differently, and children who need accessibility would lose out.'),
    'rule-H': NEW('Every rule has a check that tests it, an owner on the team, and a plan for what happens when the check fails.', 'A rule with no check is only a wish. This is how the team knows the rules are really followed.'),
    'rule-I': NEW('Uploaded material is treated as information, never as instructions to WhySteps.', 'A worksheet could contain text like "ignore your rules". WhySteps reads it as school content only, which keeps families safe.'),
    'rule-J': NEW('The software works out fixed answers itself (like maths). Open answers get a marking guide and an "unable to judge" result.', 'AI can be wrong about answers. Software checks fixed answers exactly, and saying "unable to judge" is more honest than a guessed mark.'),
    'rule-K': NEW('Rules have version numbers and tests, including tests that catch a lesson that teaches something wrong.', 'When a rule changes, the team can see what changed and prove that lessons still teach correctly.'),
    'rule-L': NEW('WhySteps stores only what it needs.', 'Less stored data means less to protect and less that could leak. This matters even more for children.'),
    'rule-M': NEW('When a lesson fails a check, the family gets reviewed practice or one question, never a broken or unchecked lesson.', 'A child should never be the one to discover a faulty lesson.'),
    'rule-N': NEW('In silent mode (pictures only), the word is shown first, or an unexpected answer counts as "unclear" instead of wrong.', 'A child may call a picture by another name (a "cup" for a "mug"). Marking that wrong would be unfair.'),
    'rule-O': NEW('Older students get feedback on their reasoning, not only right or wrong.', 'Teenagers learn most from seeing where their thinking went off track.'),
    'rule-P': NEW('WhySteps is tried on real phones and tablets and with real children before families use it.', 'Things that work on a computer screen often fail on a small phone or with a child\'s fingers.'),
    'rule-Q': NEW('Real accounts come later, with easy child sign-in, account recovery, limits on wrong codes, a way to forget a device, and siblings kept apart.', 'Children forget passwords and share devices. This keeps each child\'s work private and safe.'),
    'rule-R': NEW('Every rule shows its path from KG2 to Grade 12, in Arabic, English and French, for every subject.', 'A rule written only for one grade or one language leaves gaps that families would find first.'),
    'rule-S': NEW('Before you see anything, the team does a gap sweep: every grade, language, subject and route (silent, pictures, phone).', 'You should never be the first person to find a gap.'),
    'rule-T': NEW('Three tries made fair: a hint after each wrong try, the answer after three tries, and never a win by elimination (with two choices, the answer comes after one wrong try). Already built in update 19.', 'With two choices, a child could "win" by simply trying the other one. This keeps the result honest.'),
    'team-grades-9-12-privacy': TEAM('Privacy for Grades 9–12: the student sees full detail, the parent gets a weekly summary and can open the details, and the student is told that parents can see their progress. Grades 6–8 work the same way, with a bit more detail for parents.', 'Teenagers need some privacy to stay motivated, and parents still need to know how things are going. Telling the student keeps it honest.'),
    'team-arabic-address': TEAM('Arabic lessons speak to the child in a neutral form by default; a parent can choose the boy or girl form.', 'Arabic changes words for boys and girls. Neutral works for every child, and the parent can make it personal.'),
    'team-kg1': TEAM('KG1 is removed from the grade list. WhySteps starts at KG2.', 'KG1 children are too young for this kind of lesson; promising KG1 would be a promise we cannot keep.'),
    'team-grades-6-12': TEAM('Grades 6–12 see "At your level" lessons; everything not built yet says "coming soon".', 'Older students should not see lessons meant for younger children, and nothing should look ready when it is not.'),
    'team-maths-labs': TEAM('The maths labs follow the language each child learns maths in, set per child.', 'Many Lebanese children learn maths in French or English rather than Arabic. The lab should match their school.'),
    'team-chatgpt-s-11-november-design-review': TEAM('ChatGPT\'s design review of 11 November is closed: its points were handled or replaced by later reviews.', 'Closing it stops old advice from being acted on twice.'),
    'team-fonts': TEAM('The fonts stay as they are until the test on a real phone with a child.', 'Changing fonts now would be guesswork; the real-phone test will show what children can read comfortably.'),
    'team-one-tagline': TEAM('WhySteps uses one tagline everywhere: "Every question leads to understanding."', 'One tagline makes the brand clear and easy to remember.'),
    'team-parent-area': TEAM('The parent area shows one short row per child.', 'Busy parents see each child at a glance, without long reports.'),
    'team-children-use-this-device': TEAM('A "Children use this device" switch hides demo passwords, PINs and shortcuts, including the developer sign-in.', 'On a shared family device, a child should never see passwords or ways into the parent or developer areas.'),
  });
}
let EXQ = null;
function explainSheet(id) {
  const p = S.decisions.pending.find(x => x.id === id) || {}, e = EXPLAIN[id], x = nowItems().y.find(i => i.id === id);
  const opts = (x && x.opts) || p.options || [];
  EXQ = { id, text: '', busy: false };
  openSheet(`<p class="muted small">${esc(p.kind || 'Question')} · 🤔 Explained simply</p><h2 id="sheetTitle">${esc(p.title || id)}</h2>
    ${e ? `<h3>What is this about?</h3><p>${esc(e.what)}</p><h3>Why does it matter?</h3><p>${esc(e.why)}</p>
      <h3>What each answer means</h3><ul class="explain-opts">${Object.entries(e.opts).map(([o, m]) => `<li><strong>${esc(cap(o))}</strong><p>${esc(m)}</p></li>`).join('')}</ul>
      <p class="rec">👍 ${esc(e.rec)}</p><p class="small muted">Written by the team from the approval sheet of 22 Nov 2026.</p>`
      : p.explain ? `<h3>What ${esc(p.fromAI === 'ChatGPT' ? 'ChatGPT' : 'Claude ' + (p.fromAI || ''))} says</h3><p style="white-space:pre-line">${esc(p.explain)}</p>` : `<p>The team has not written a simple explanation for this one yet.</p>`}
    <div class="row ex-more" style="margin:10px 0"><button class="ghost" type="button" data-exdetails="${esc(id)}" aria-expanded="false">🔎 I need more details</button>
      <button class="ghost" type="button" data-exreturn="${esc(id)}">↩ Clear, back to your desk</button></div>
    <div id="exDetails" hidden>${detailsHTML(id)}</div>
    <div id="exLive">${exLiveHTML()}</div>
    <p class="small">${src(p.url, 'The full question on GitHub')}</p>
    ${opts.length && ['none', 'draft'].includes(stateOf(id).k) ? `<h3>Ready to answer?</h3><div class="opts">${opts.map(o => `<button class="opt" type="button" data-quickdec="${esc(id)}" data-opt="${esc(o)}">${esc(cap(o))}</button>`).join('')}</div>` : stateHTML(id)}`);
}
/* "I need more details": everything the snapshot holds about the item, in one place */
function detailsHTML(id) {
  const p = S.decisions.pending.find(x => x.id === id) || {}, x = nowItems().y.find(i => i.id === id) || {};
  const rows = [['Who asks', p.fromAI ? (p.fromAI === 'ChatGPT' ? 'ChatGPT' : 'Claude ' + p.fromAI) : (p.group || 'The team')], ['Kind', p.kind], ['Status', p.status],
    ['Answers you can give', ((p.options && p.options.length ? p.options : x.opts) || []).join(' · ')], ['Team roles', (rolesFor(id) || []).map(n => '#' + n).join(', ')]].filter(r => r[1]);
  return `<h3>The details</h3><dl class="ex-dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${p.explain && EXPLAIN[id] ? `<h3>What the team wrote</h3><p style="white-space:pre-line">${esc(p.explain)}</p>` : ''}
    ${x.sub ? `<p class="small">${esc(x.sub)}</p>` : ''}
    <p class="small">${p.url ? src(p.url, 'Evidence and the whole conversation on GitHub') : 'No GitHub link recorded for this one.'}</p>`;
}
/* 😡 Not done properly: the work goes back, and it does not come up again until it is finished 100% and explained */
const ANGRY_NOTE = 'Not done properly. This was half a job, or it came without a proper explanation. Go back to your office, finish it 100%, check every part (every grade, language, subject, route and test that it touches), write a plain explanation of what you did and how you checked it, and only then come back with a new question. No excuses: we are working, not playing.';
function angrySheet(id) {
  const p = S.decisions.pending.find(x => x.id === id) || nowItems().y.find(x => x.id === id) || {};
  openSheet(`<p class="muted small">😡 Not done properly</p><h2 id="sheetTitle">${esc(p.title || id)}</h2>
    <p>This goes back to the team on GitHub as your decision. It is <strong>not</strong> approved, and it will not come to your desk again: the team must redo it 100% and ask you again with a new, fully explained question.</p>
    <label class="small" for="angryText"><strong>What was missing?</strong> (optional, the team's instructions are already filled in)</label>
    <textarea id="angryText" rows="5" style="width:100%;box-sizing:border-box;font:inherit;padding:8px;border-radius:10px">${esc(ANGRY_NOTE)}</textarea>
    <div class="row" style="margin-top:8px"><button class="primary angry" type="button" data-angrygo="${esc(id)}">😡 Send it back to be done properly</button></div>`);
}
function exLiveHTML() {
  const can = LIVE.avail;
  if (EXQ && EXQ.text) return `<div class="bubble-note live"><p class="small muted">Live Claude's explanation (AI: check anything important)</p><p>${esc(EXQ.text)}</p></div>`;
  return can ? `<button class="ghost" type="button" data-exlive="1" ${EXQ && EXQ.busy ? 'disabled' : ''}>${EXQ && EXQ.busy ? 'Live Claude is thinking…' : '💬 Still not clear? Ask Live Claude to explain more simply'}</button><p class="small muted">Uses your Claude allowance.</p>`
    : `<button class="ghost" type="button" data-copytext="${esc('Please explain this WhySteps decision to me very simply, as if I have no technical background: what it is about, why it matters, what each answer would mean, and what the team recommends. Decision: ' + ((S.decisions.pending.find(x => x.id === (EXQ && EXQ.id)) || {}).title || '') + ' (H2ONLB/whysteps, reviews/2026-11-22/hiba-approval-sheet.md).')}">${icon('copy')}Still not clear? Copy a question for Claude</button>`;
}
async function exLive() {
  if (!SAMPLE || !EXQ || EXQ.busy) return;
  const p = S.decisions.pending.find(x => x.id === EXQ.id) || {}, e = EXPLAIN[EXQ.id];
  EXQ.busy = true; $('#exLive').innerHTML = exLiveHTML();
  const q = `Explain this decision to Hiba, the founder of WhySteps, very simply (she has no technical background). Use short sentences and everyday words, no jargon. Say what it is about, why it matters, and what each answer would mean for her and for the children. Do not tell her what to choose; say what the team recommends only if it is stated below. Keep it under 160 words.\n\nDecision: ${p.title}\nKind: ${p.kind}\nAnswers: ${(p.options || []).join(' | ') || 'approve, change it, or not yet'}\n${e ? 'Team notes: ' + e.what + ' ' + e.why + ' ' + e.rec : ''}`;
  try { const r = await SAMPLE([{ role: 'user', content: q }], { modelTier: 'default', cache: false, onText: ({ text }) => { EXQ.text = text; const el = document.querySelector('#exLive .live p:last-child'); if (el) el.textContent = text; else if ($('#exLive')) $('#exLive').innerHTML = exLiveHTML(); } }); EXQ.text = r.text; }
  catch (err) { EXQ.text = ''; toast(err && err.code === 'rate_limited' ? 'Live Claude is busy right now. Try again in a minute.' : 'Live Claude could not answer just now.'); }
  EXQ.busy = false; if ($('#exLive')) $('#exLive').innerHTML = exLiveHTML();
}
const explainBtn = id => `<button class="ghost explain" type="button" data-explain="${esc(id)}">🤔 Explain it simply</button>`;
function decQuick(p) {
  const x = nowItems().y.find(i => i.id === p.id), opts = x ? x.opts : [...(p.options || []), 'Not yet'];
  return `<article class="decq"><p class="small muted">${esc(p.kind)}</p><h4>${esc(p.title)}</h4>${explainBtn(p.id)}${stateHTML(p.id)}
    ${stateOf(p.id).k === 'git' ? '' : `<div class="opts">${opts.map(o => `<button class="opt" type="button" data-quickdec="${esc(p.id)}" data-opt="${esc(o)}">${esc(cap(o))}</button>`).join('')}</div>`}
    <p class="small">${src(p.url, 'The full question')}</p></article>`;
}
/* AI corridor and rooms */
function postsBy(who) {
  const out = [];
  THREADS.forEach(t => [t, ...t.comments].forEach(c => { if ((c.from || '').includes(who)) out.push({ t, c }); }));
  return out.sort((a, b) => (b.c.createdAt || '').localeCompare(a.c.createdAt || ''));
}
function aiStatus(w) {
  const N = nowItems(), tasks = [...N.u, ...N.a].filter(x => x.who === w.id), fixing = N.u.filter(x => x.who === w.id).length;
  return { tasks, dot: fixing ? 'busy' : tasks.length ? 'wait' : 'idle', doing: fixing ? `Fixing ${plural(fixing, 'urgent problem')}` : tasks.length ? `${plural(tasks.length, 'task')} waiting for it` : 'Nothing waiting for it' };
}
function doorSVG(inner, tint, badge) {
  return `<svg viewBox="0 0 120 150" class="door-svg" aria-hidden="true"><rect x="10" y="8" width="100" height="140" rx="6" fill="${tint}" stroke="#5F5E5A" stroke-width="2"/><rect x="18" y="16" width="84" height="132" rx="4" fill="light-dark(#FBFAF7,#22313A)" stroke="#888780"/>
    <g class="peek" transform="translate(30 40) scale(.62)">${inner}</g><circle cx="94" cy="96" r="4" fill="#C9A227"/>${badge ? `<g transform="translate(86 4)"><circle cx="12" cy="12" r="12" fill="#C2410C"/><text x="12" y="16.5" font-size="13" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">${badge}</text></g>` : ''}</svg>`;
}
function aiLabHTML() {
  if (st.aiRoom) { const w = WORKSPACES.find(x => x.key === st.aiRoom); if (w) return aiRoomHTML(w); }
  return roomShell('ai', 'A corridor with a room for each AI. The number on a door is how many jobs that AI still has to do: nothing here is a decision for you. Open a door to see the jobs, pass one on, or write to it.',
    `<div class="doors">${WORKSPACES.map(w => { const s = aiStatus(w), posts = postsBy(w.id);
      return `<button class="door-btn" type="button" data-airoom="${w.key}" aria-label="Open ${esc(w.id)}'s room: ${esc(s.doing)}">${doorSVG(CH.robot(w.key), AI_TINT[w.key], s.tasks.length || '')}
        <strong>${esc(w.id)}</strong><span class="small"><span class="dot d-${s.dot}"></span>${esc(s.doing)}</span>${posts[0] ? `<span class="small muted">Last note ${fmt(posts[0].c.createdAt)}</span>` : ''}</button>`; }).join('')}</div>`);
}
function aiRoomHTML(w) {
  const s = aiStatus(w), posts = postsBy(w.id).slice(0, 3), last = activity.filter(x => x.actor === w.key && x.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const open = THREADS.filter(t => t.state === 'open' && (t.to.includes(w.id) || (t.from || '').includes(w.id)));
  const scene = `<svg viewBox="0 0 400 210" class="airoom-svg" role="img" aria-label="${esc(w.id)}'s room">
    <polygon points="200,40 392,120 200,200 8,120" fill="light-dark(#F7F5EF,#1E2B31)" stroke="var(--line)"/>
    <polygon points="200,40 8,120 8,70 200,-10" fill="${AI_TINT[w.key]}" stroke="var(--line)"/><polygon points="200,40 392,120 392,70 200,-10" fill="light-dark(#fff,#24343B)" stroke="var(--line)"/>
    <g transform="translate(240 40) skewY(22)"><rect width="110" height="56" rx="3" fill="#fff" stroke="#888780"/><text x="8" y="14" font-size="9" font-family="sans-serif" font-weight="700" fill="#253E43">Its board</text>
      ${s.tasks.slice(0, 3).map((x, i) => `<rect x="8" y="${20 + i * 11}" width="94" height="8" rx="2" fill="${i === 0 ? '#FDE2D6' : '#FEF3C7'}"/><text x="11" y="${26.5 + i * 11}" font-size="6.5" font-family="sans-serif" fill="#253E43">${esc(x.title.slice(0, 26))}</text>`).join('') || '<text x="8" y="32" font-size="8" font-family="sans-serif" fill="#5F5E5A">Nothing waiting</text>'}</g>
    <g transform="translate(40 70)"><rect width="24" height="30" rx="3" fill="#B98B67"/><path d="M12 0c-14-14-4-26 0-30c4 4 14 16 0 30z" fill="#5AA469"/></g>
    <g><polygon points="190,112 262,146 222,166 150,132" fill="#B98B67"/><polygon points="150,132 222,166 222,178 150,144" fill="#8C6446"/><polygon points="222,166 262,146 262,158 222,178" fill="#73513A"/>
      <g transform="translate(196 100)"><rect width="34" height="22" rx="2" fill="#1C4047"/><rect x="2" y="2" width="30" height="18" fill="${s.dot === 'busy' ? '#FDE2D6' : s.dot === 'wait' ? '#FEF3C7' : '#E3F3E8'}"/><text x="17" y="15" font-size="10" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#253E43">${s.tasks.length}</text></g></g>
    <g class="tapbot" role="button" tabindex="0" data-botwave="${w.key}" aria-label="Wave at ${esc(w.id)}" transform="translate(120 70) scale(.95)">${CH.robot(w.key)}</g>
  </svg>`;
  return `<section class="room-scene room-ai airoom" aria-label="${esc(w.id)}'s room">
    <div class="room-top"><span class="me-mini">${CH.svg(CH.FOUNDER, 40)}</span><div><h2>${esc(w.id)}'s room</h2><p class="small muted"><span class="dot d-${s.dot}"></span>${esc(s.doing)} · ${esc(w.role)}</p></div>${keycap('back-corridor', 'Back to the corridor', 'backbreak')}</div>
    ${cxOfficeJobs(w)}
    <details class="cx-olddetails"><summary>Show details</summary>
    ${scene}
    <p class="small lab-note">These are <strong>jobs for ${esc(w.id)}</strong>, not decisions for you. 📋 Pass on copies a job so you can paste it into ${esc(chatOf(w.id))} if you want it done now.</p>
    <div class="room-cols">
      <section class="panel"><h3>Its tasks (${s.tasks.length})</h3>${s.tasks.length ? `<ul class="tasklist">${s.tasks.map(x => `<li><div><strong>${esc(x.title)}</strong>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</div><button class="ghost" type="button" data-send="${esc(x.id)}" aria-label="Pass this job to ${esc(w.id)}">${icon('copy')}Pass on</button></li>`).join('')}</ul>` : '<p class="muted small">Nothing waiting for it.</p>'}
        <h3>Last recorded work</h3>${last.length ? `<ul class="list small">${last.map(x => `<li>${esc(x.title.slice(0, 120))} <span class="muted">· ${fmt(x.date)}</span> ${src(x.url)}</li>`).join('')}</ul>` : '<p class="muted small">No record yet.</p>'}</section>
      <section class="panel"><h3>Its latest notes</h3>${posts.length ? posts.map(({ t, c }) => `<div class="bubble-note"><p class="small muted">#${t.n} ${esc(t.title)} · ${fmt(c.createdAt)} ${src(c.url)}</p><p>${esc((c.text || '').replace(/\s+/g, ' ').slice(0, 220))}${(c.text || '').length > 220 ? '…' : ''}</p></div>`).join('') : '<p class="muted small">No notes on GitHub yet.</p>'}
        ${quickBox('ai-' + w.key, w.id, `Message to ${w.id}`, open[0] ? open[0].n : '', open[0] ? `Reply on #${open[0].n} ${open[0].title}` : `Write to ${w.id}`)}
        ${open[0] ? quickBox('ai-new-' + w.key, w.id, `Message to ${w.id}`, '', `Or start a new message to ${w.id}`) : ''}</section>
    </div></details></section>`;
}
/* Experts corridor and department rooms */
function deptGroups() {
  const lead = depts.filter(d => ['Leadership', 'Teaching specialists'].includes(d.wing));
  return [{ id: 'lead', name: 'Leadership and teaching specialists', groups: lead.map(d => ({ label: d.name, rs: d.roles })) },
    ...depts.filter(d => d.wing === 'Builders').map(d => { const tw = deptBy['review-' + d.id];
      return { id: d.id, name: cap(d.name), groups: [{ label: 'Builders', rs: d.roles }, ...(tw ? [{ label: 'Their reviewers', rs: tw.roles }] : [])] }; })];
}
const deptRoles = g => g.groups.flatMap(x => x.rs);
const liveDefects = () => defects.filter(d => /^Issue/i.test(d.status || ''));
function deptDecisions(g) { const rs = new Set(deptRoles(g)); return S.decisions.pending.filter(p => rs.has(BRINGS[p.id] || (g.id === 'lead' ? 101 : -1))); }
function expertsHallHTML() {
  if (st.deptRoom) { const g = deptGroups().find(x => x.id === st.deptRoom); if (g) return deptRoomHTML(g); }
  const live = liveDefects();
  return roomShell('experts', 'A corridor with a room for each department. Open a door to meet the team, see what they are working on, and answer or comment right there.',
    `<div class="doors depts">${deptGroups().map(g => { const rs = deptRoles(g), on = live.filter(d => rolesFor(d.id).some(n => rs.includes(n))).length, need = deptDecisions(g).filter(p => stateOf(p.id).k === 'none').length;
      const faces = rs.slice(0, 3).map((n, i) => `<g transform="translate(${i * 34 - 8} ${i % 2 ? 6 : 0}) scale(.55)">${CH.person(CH.look(n, roleBy[n] && roleBy[n].dept))}</g>`).join('');
      return `<button class="door-btn" type="button" data-deptroom="${esc(g.id)}" aria-label="Open the ${esc(g.name)} room: ${rs.length} experts${need ? ', ' + need + ' need your answer' : ''}">${doorSVG(faces, '#F3E6D0', need || '')}
        <strong>${esc(g.name)}</strong><span class="small muted">${rs.length} experts${on ? ` · on ${plural(on, 'problem')}` : ''}</span></button>`; }).join('')}</div>
    <p class="small"><a href="#hq">Open the Experts page (search, colours, workflow) →</a></p>`);
}
function deptRoomHTML(g) {
  const rs = deptRoles(g), live = liveDefects().filter(d => rolesFor(d.id).some(n => rs.includes(n))), decs = deptDecisions(g);
  const shown = rs.slice(0, 12);
  const scene = `<svg viewBox="0 0 400 240" class="deptroom-svg" role="img" aria-label="${esc(g.name)} room with ${rs.length} experts">
    <polygon points="200,44 392,124 200,204 8,124" fill="light-dark(#F7F5EF,#1E2B31)" stroke="var(--line)"/>
    <polygon points="200,44 8,124 8,74 200,-6" fill="#F3E6D0" stroke="var(--line)"/><polygon points="200,44 392,124 392,74 200,-6" fill="light-dark(#fff,#24343B)" stroke="var(--line)"/>
    <g transform="translate(40 24) skewY(-22)"><rect width="128" height="60" rx="3" fill="#fff" stroke="#888780"/><text x="8" y="14" font-size="9" font-family="sans-serif" font-weight="700" fill="#253E43">Working on</text>
      ${live.slice(0, 3).map((d, i) => `<rect x="8" y="${20 + i * 12}" width="112" height="9" rx="2" fill="#FDE2D6"/><text x="11" y="${27 + i * 12}" font-size="6.5" font-family="sans-serif" fill="#253E43">${esc(plainDefect(d).slice(0, 30))}</text>`).join('') || '<text x="8" y="34" font-size="8" font-family="sans-serif" fill="#5F5E5A">No problem on the reviewed build</text>'}</g>
    <ellipse cx="220" cy="132" rx="90" ry="26" fill="#E8D8BE" stroke="#B98B67" stroke-width="2"/>
    ${shown.map((n, i) => { const a = -0.15 * Math.PI + (shown.length > 1 ? i / (shown.length - 1) : .5) * 1.3 * Math.PI, x = 220 + Math.cos(a) * 140 - 22, y = 118 + Math.sin(a) * 52 - 46;
      return `<g class="tapmate" role="button" tabindex="0" data-role="${n}" aria-label="#${n} ${esc(roleBy[n]?.title || '')}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(.62)">${CH.person(CH.look(n, roleBy[n] && roleBy[n].dept))}<rect x="18" y="-14" width="34" height="18" rx="9" fill="var(--ink)"/><text x="35" y="-1" font-size="13" text-anchor="middle" fill="var(--paper)" font-family="sans-serif" font-weight="700">${n}</text></g>`; }).join('')}
  </svg>`;
  return `<section class="room-scene room-experts deptroom" aria-label="${esc(g.name)} room">
    <div class="room-top"><span class="me-mini">${CH.svg(CH.FOUNDER, 40)}</span><div><h2>${esc(g.name)}</h2><p class="small muted">${rs.length} experts${rs.length > shown.length ? ` (${shown.length} around the table; all below)` : ''}. Tap anyone for their job and findings.</p></div>${keycap('back-hall', 'Back to the corridor', 'backbreak')}</div>
    ${scene}
    <div class="assign-row team-lead" role="group" aria-label="Which AI leads ${esc(g.name)}"><span class="small"><strong>Led by:</strong></span>${AIS.map(w => `<button type="button" class="assign-btn${leadOf(g.id) === w ? ' on' : ''}" aria-pressed="${leadOf(g.id) === w}" data-teamlead="${esc(g.id)}" data-teamleadname="${esc(g.name)}" data-assignwho="${esc(w)}">${CH.svg(CH.robot(AI_KEY[w]), 18)} ${esc(w.replace('Claude ', ''))}</button>`).join('')}<span class="small muted">The lead AI works on this team's jobs that nobody else has taken.</span></div>
    <div class="row teamreview"><button class="primary" type="button" data-teamreview="${esc(g.id)}" data-teamleadname="${esc(g.name)}">🔍 Review your work</button><span class="small muted">${esc(leadOf(g.id))} checks the ${esc(g.name)} team's work and finds what still needs doing. If nothing is needed, it says so in one line and stops: no invented work, no wasted usage.</span></div>
    <div class="row teamcall"><button class="primary" type="button" data-callteam="${esc(g.id)}">📣 Call the team to the meeting room</button>${tmStatusLine(g)}</div>
    <div class="room-cols">
      <section class="panel"><h3>Needs your answer (${decs.filter(p => stateOf(p.id).k !== 'git').length})</h3>${decs.length ? decs.filter(p => stateOf(p.id).k !== 'git').slice(0, 5).map(decQuick).join('') + (decs.filter(p => stateOf(p.id).k !== 'git').length > 5 ? `<p class="small"><a href="#decisions">${decs.filter(p => stateOf(p.id).k !== 'git').length - 5} more in Decisions →</a></p>` : '') : '<p class="muted small">Nothing from this team is waiting for you.</p>'}
        <h3>Working on</h3>${live.length ? `<ul class="list small">${live.map(d => `<li><strong>${esc(d.id)}</strong> ${esc(plainDefect(d))} ${src(d.url)}</li>`).join('')}</ul>` : '<p class="muted small">No problem assigned on the reviewed build.</p>'}</section>
      <section class="panel"><h3>The team</h3>${g.groups.map(x => `<p class="small"><strong>${esc(cap(x.label))}</strong></p>${avatarRow(x.rs, 30)}`).join('')}
        ${quickBox('dept-' + g.id, 'All three', `Team: ${g.name}`, '', `Comment or update for the ${g.name} team`, 'For example: please look at…  Claude passes it to this team.')}</section>
    </div></section>`;
}
/* ------------------------------------------------------------ 3D headquarters (hq3d.js draws; this file owns data and actions) */
const HQ = { inst: null, host: null, failed: false };
const TEAM_STYLE = { product: ['Product', '#ece7fb'], technology: ['Technology', '#e3efff'], design: ['Design', '#fbe6ef'], accessibility: ['Accessibility', '#e2f5ee'], teaching: ['Teaching', '#fbefdc'],
  'marketing-and-support': ['Marketing', '#fde9e2'], lead: ['Leadership', '#eeeafd'], 'privacy-lawyer': ['Privacy', '#ececec'], 'child-safety-and-ai-ethics': ['Safety', '#e8f4dc'] };
const hqOn = () => st.office && !HQ.failed && !window.__noHQ3D && !!window.HQ3D && window.HQ3D.supported();
const teamOfRole = n => deptGroups().find(g => deptRoles(g).includes(n));
function hqVisitor(x) {
  if (!x) return null; const v = visitorOf(x);
  if (v.kind === 'ai') return { id: x.id, col: '#185FA5', skin: '#e8eef2', hair: '#185FA5', team: null, svg: CH.robot(v.key) };
  const g = teamOfRole(v.n); return { id: x.id, n: v.n, col: v.look.top, skin: v.look.skin, hair: v.look.hair, team: g ? g.id : null, svg: CH.person(v.look) };
}
function hqData() {
  const N = nowItems(), q = officeQueue(), brk = onBreak(), live = liveDefects();
  const teams = Object.keys(TEAM_STYLE).map(id => deptGroups().find(g => g.id === id)).filter(Boolean).map(g => {
    const rs = deptRoles(g), lk = CH.look(rs[0], roleBy[rs[0]]?.dept);
    return { id: g.id, name: g.name, short: TEAM_STYLE[g.id][0], tint: TEAM_STYLE[g.id][1], col: lk.top, size: rs.length,
      badge: deptDecisions(g).filter(p => stateOf(p.id).k === 'none').length || '', problems: live.filter(d => rolesFor(d.id).some(n => rs.includes(n))).length,
      people: rs.slice(0, 3).map(n => { const l = CH.look(n, roleBy[n]?.dept); return { n, skin: l.skin, hair: l.hair, svg: CH.person(l) }; }) }; });
  const ai = Object.fromEntries(WORKSPACES.map(w => [w.key, aiStatus(w).dot]));
  const room = st.room || 'office';
  const hibaAt = brk ? brk.kind : room === 'experts' && st.deptRoom ? 'team:' + st.deptRoom : ['ai', 'meeting', 'board', 'coffee', 'lunch'].includes(room) ? room : 'desk';
  return { teams, ai, hibaAt, hibaSvg: CH.FOUNDER, robotSvg: Object.fromEntries(WORKSPACES.map(w => [w.key, CH.robot(w.key)])), visitor: hqVisitor(q[0]), line: q.slice(1, 4).map(hqVisitor), brk: brk ? brk.kind : null, wave: st.anim === 'wave', mail: DB ? outReady().length : 0,
    room: st.room || 'office', team: st.room === 'experts' ? st.deptRoom : null,
    roomBadges: { office: q.length || '', ai: N.a.length || '', board: N.u.length || '' },
    roomCols: { office: '#1d3b3a', ai: '#0F6E56', coffee: '#B5651D', meeting: '#33363d', board: '#185FA5' },
    screen: { urgent: N.u.length, decisions: pendingCount(), waitingAI: N.a.length, website: (S.website && S.website.status) || '—', at: fmt(S.generated.at) } };
}
function hqBubble() {
  const q = officeQueue(), front = q[0], brk = onBreak(); if (brk || !front) return '';
  const v = visitorOf(front), dept = v.kind === 'ai' ? 'AI workspace' : deptPlain(roleBy[v.n]?.dept);
  if (front.called) return `<p class="hq-b-who">You called #${v.n} · ${esc(dept)}</p><p class="hq-b-q">${esc(roleBy[v.n].title)}</p><p class="small" style="margin:0 0 6px">${esc(String(front.sub).slice(0, 160))}${String(front.sub).length > 160 ? '…' : ''}</p><div class="hq-b-row"><button class="chip" type="button" data-role="${v.n}">Their job and findings</button></div>`;
  return `<p class="hq-b-who" title="${esc(v.name)}">${v.kind === 'role' ? '#' + v.n + ' ' + esc(dept) : esc(v.name)} asks you · 1 of ${q.length}</p><p class="hq-b-q">${esc(front.title)}</p>
    <div class="hq-b-row">${front.dec ? `<button class="chip ex" type="button" data-explain="${esc(front.id)}">🤔 Explain</button>` : ''}${front.url ? `<a class="chip" href="${esc(front.url)}" target="_blank" rel="noopener">Evidence</a>` : ''}${v.kind === 'role' ? `<button class="chip" type="button" data-role="${v.n}">Ask #${v.n}</button>` : ''}</div>`;
}
function hqStamps() {
  const q = officeQueue(), front = q[0], brk = onBreak();
  if (brk) return `<div class="stamps"><p class="small muted">${esc(BREAKS[brk.kind])}: nobody comes upstairs until you are back.</p></div>`;
  const heldLine = heldHTML();
  if (!front) return `<div class="stamps">${heldLine}<p class="small muted">Nobody is waiting at your desk. Every decision that is yours is recorded on GitHub or waiting for your Submit.</p></div>`;
  if (front.called) return `<div class="stamps one">${quickBox('call-' + front.n, 'All three', `Question for #${front.n} ${roleBy[front.n].title}`, '', `Ask #${front.n} anything`, 'What do you need from this expert? Claude answers as this role in its next session.')}
    <button class="stamp" type="button" data-dismisscall="${front.n}"><span>✓ Thanks, back to work</span></button></div>`;
  const site = front.id === 'site-link' ? `<a class="stamp rec" href="${esc(front.open)}" target="_blank" rel="noopener" data-direct="1"><span>1. Open the website ${icon('ext')}</span></a>` : '';
  const real = front.opts.filter(o => !/^not yet$/i.test(o)), M = st.multi && st.multi[front.id];
  const canMulti = front.id !== 'site-link' && real.length >= 2;
  if (M) return `<div class="stamps" role="group" aria-label="Pick every answer that applies">${real.map(o => `<button class="stamp pick${M.includes(o) ? ' picked' : ''}" type="button" data-pick="${esc(front.id)}" data-opt="${esc(o)}" aria-pressed="${M.includes(o)}"><span>${esc(cap(o))}</span></button>`).join('')}
    <button class="stamp rec" type="button" data-quickmulti="${esc(front.id)}"><span>✓ Stamp my choices</span></button>
    <button class="chip multi" type="button" data-multitoggle="${esc(front.id)}">Back to one answer</button></div>`;
  return `${heldLine}<div class="stamps" role="group" aria-label="Your answer">${site}${front.opts.map(o => `<button class="stamp${/recommend/i.test(o) ? ' rec' : ''}" type="button" data-quickdec="${esc(front.id)}" data-opt="${esc(o)}"><span>${esc(cap(o))}</span></button>`).join('')}
    ${front.id === 'site-link' ? '' : `<button class="stamp back" type="button" data-sendback="${esc(front.id)}"><span>↩ Send back to fix</span></button><button class="stamp angry" type="button" data-angry="${esc(front.id)}" title="Half a job, or no explanation: back to the office until it is done 100%"><span>😡 Not done properly</span></button>`}
    ${canMulti ? `<button class="chip multi" type="button" data-multitoggle="${esc(front.id)}">☑ More than one answer applies</button>` : ''}</div>`;
}
function hqHTML() {
  const room = st.room || 'office', brk = onBreak(), q = officeQueue(), front = q[0];
  const views = [['desk', 'My desk'], ['f2', 'Floor 2 · You'], ['f1', 'Floor 1 · Teams'], ['whole', 'Whole building']];
  const panel = room === 'office' ? `${hqStamps()}
      <div class="desk-edge" role="group" aria-label="Things on your desk">${brk ? keycap('back-from-break', "I'm back", 'backbreak')
        : keycap('next', 'Next, please', 'next', q.length > 1) + keycap('back', 'Not now', 'back', q.length > 1) + keycap('end', 'Leave to the end', 'end', !!front) + keycap('coffee', 'Coffee break', 'coffee') + keycap('lunch', 'Lunch break', 'lunch') + keycap('massage', 'Thai massage', 'massage') + keycap('wave', 'Wave hello', 'wave')}</div>
      ${DB && front && front.dec ? '<p class="small muted center">Your answer goes in the 📮 by your desk; 🚀 Send all sends the box to GitHub at once.</p>' : ''}
      <div class="desk-more">${outboxBarHTML()}</div>`
    : `<div class="hq-panel">${room === 'ai' ? aiLabHTML() : room === 'experts' ? expertsHallHTML() : room === 'meeting' ? meetingHTML() : room === 'coffee' ? coffeeHTML() : room === 'lunch' ? lunchHTML() : room === 'spa' ? spaHTML() : room === 'board' ? whiteboardHTML() + `<section class="panel">${websiteHTML()}</section>` : ''}</div>`;
  return `<section class="hq" aria-label="WhySteps headquarters">
    <div class="hq-floors" role="group" aria-label="Floors">${views.map(([k, n]) => `<button class="chip" type="button" data-hqview="${k}">${n}</button>`).join('')}<button class="chip" type="button" id="officeToggle" aria-pressed="true">List view</button>${mailPill()}</div>
    <div id="hqSlot" class="hq-slot"></div>
    <p class="small muted hq-hint">Tap a room, team or person · drag to move · two fingers (or right-drag) to turn and tilt · pinch to zoom · from GitHub ${fmt(S.generated.at)}</p>
    ${panel}</section>`;
}
function mountHQ() {
  const slot = document.getElementById('hqSlot'); if (!slot) return;
  try {
    if (!HQ.inst) { HQ.host = document.createElement('div'); HQ.host.className = 'hq-host'; HQ.inst = window.HQ3D.create(HQ.host, { onPick: hqPick }); }
    slot.append(HQ.host); HQ.inst.update(hqData()); HQ.inst.setBubble((st.room || 'office') === 'office' ? hqBubble() : '');
  } catch (e) { HQ.failed = true; console.warn('3D office off:', e); renderNow(); }
}
function hqPick(p) {
  if (p.role) return roleDrawer(p.role);
  if (p.mail) { const b = $('#outboxBar'); if (st.room !== 'office') { enterRoom('office'); } setTimeout(() => { const bb = $('#outboxBar'); if (bb) { bb.querySelector('details') && (bb.querySelector('details').open = true); bb.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 60); return; }
  if (p.team) { st.room = 'experts'; st.aiRoom = null; st.deptRoom = p.team; store.set('room', 'experts'); renderNow(); HQ.inst && HQ.inst.focus(p.team); return; }
  if (p.ai) { st.room = 'ai'; st.deptRoom = null; st.aiRoom = p.ai; store.set('room', 'ai'); renderNow(); HQ.inst && HQ.inst.focus('ai'); return; }
  if (p.room) enterRoom(p.room);
}
function openSite() {
  let v = document.getElementById('siteView');
  if (!v) { v = document.createElement('div'); v.id = 'siteView'; v.className = 'site-view'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', 'Latest WhySteps website');
    v.innerHTML = `<div class="site-bar"><strong>Latest WhySteps website</strong><span class="small muted">built from main ${esc(WS_SITE.commit)} · ${esc(fmt(WS_SITE.builtAt))}</span><a class="chip" href="site/index.html" target="_blank" rel="noopener">New tab ${icon('ext')}</a><button class="primary" type="button" id="siteClose">✕ Close</button></div><iframe title="WhySteps customer website" src="site/index.html"></iframe>`;
    document.body.append(v); }
  v.hidden = false; document.body.classList.add('site-open'); v.querySelector('#siteClose').focus();
}
function closeSite() { const v = document.getElementById('siteView'); if (v) v.hidden = true; document.body.classList.remove('site-open'); }
function sendBack(id) {
  const p = S.decisions.pending.find(x => x.id === id) || {};
  openSheet(`<p class="muted small">Send back to fix</p><h2 id="sheetTitle">${esc(p.title || id)}</h2><p>Tell the team what to fix or check. It goes back to them; nothing is decided.</p>
    <textarea id="sbText" rows="4" style="width:100%;box-sizing:border-box;font:inherit;padding:8px;border-radius:10px" placeholder="For example: please compare the costs first"></textarea>
    <div class="row" style="margin-top:8px"><button class="primary" type="button" data-sbgo="${esc(id)}">↩ Send back</button></div>`);
}
addEventListener('hq3d-ready', () => { if (st.view === 'now' && hqOn()) renderNow(); });
/* Today's mission: the 3 most useful things, one button each */
function todayHTML() {
  const N = nowItems(), w = S.website, items = [];
  const u = N.u[0]; if (u) items.push({ k: 'u', icon: '🔥', title: u.title, sub: u.sub, btn: u.who ? `<button class="primary" type="button" data-send="${esc(u.id)}">${icon('copy')}📋 Pass this job to ${esc(u.who)}</button>` : `<button class="primary" type="button" data-askteam="${esc(u.id)}">Ask who takes it</button>` });
  const y = N.y.find(x => x.dec && stateOf(x.id).k === 'none' && !sent[x.id]);
  if (y) items.push({ k: 'y', icon: '✍️', title: y.title, sub: 'Your decision', btn: `<button class="primary" type="button" data-gotodesk="1">Answer at my desk</button>` });
  if (w && /awaiting/i.test(w.status)) items.push({ k: 'w', icon: '🌐', title: 'Publish the latest website', sub: w.statusWhy || '', btn: `<button class="primary" type="button" data-copytext="${esc('Please republish the existing WhySteps · Customer website Artifact with the latest website/ from main (patch mode), then refresh my Command Center.')}">${icon('copy')}Ask Claude to publish</button>` });
  const m = meetings()[0]; if (items.length < 3 && m) items.push({ k: 'm', icon: '🗒️', title: 'Read the latest team note', sub: `Meeting #${m.n} · ${plural(m.comments.length, 'note')}`, btn: `<button class="primary" type="button" data-room="meeting">Go to the meeting room</button>` });
  if (DB && outReady().length) items.splice(Math.min(1, items.length), 0, { k: 'o', icon: '📮', title: 'Send your box to GitHub', sub: plural(outReady().length, 'answer') + ' ready', btn: `<button class="primary rocket" type="button" data-sendall="1">🚀 Send all</button>` });
  if (!items.length) return '';
  return `<section class="today" aria-label="Today's mission"><h2>Today's mission</h2><ol>${items.slice(0, 3).map((x, i) => `<li class="t-${x.k}"><span class="t-n" aria-hidden="true">${x.icon}</span><div><strong>${i + 1}. ${esc(x.title)}</strong><small>${esc(x.sub || '')}</small></div>${x.btn}</li>`).join('')}</ol></section>`;
}
/* Celebration: real merges since your last visit */
function newSinceVisit() {
  let seen = store.get('seen-at');
  if (!seen) { seen = new Date(new Date(S.generated.at).getTime() - 864e5).toISOString(); }
  return S.pullRequests.filter(p => p.state === 'merged' && p.mergedAt && p.mergedAt > seen).sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
}
function celebrateHTML() {
  if (st.celebrated) return '';
  const prs = newSinceVisit(); if (!prs.length) return '';
  const bits = Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 6) * 0.12}s;--c:${['#F2C14E', '#2A9D74', '#C2410C', '#534AB7', '#5AA469', '#E0607E'][i % 6]}"></i>`).join('');
  return `<section class="celebrate" aria-label="New since your last visit"><div class="confetti" aria-hidden="true">${bits}</div>
    <div class="cel-row"><details><summary><strong>🎉 ${plural(prs.length, 'change')} merged since your last visit</strong></summary>
    <ul class="list small">${prs.slice(0, 5).map(p => `<li>PR #${p.n} ${esc(p.title.replace(/^\[[^\]]+\]\s*/, ''))} <span class="muted">· ${esc(p.account || '')} · ${fmt(p.mergedAt)}</span> ${src(p.url)}</li>`).join('')}</ul></details>
    <button class="ghost" type="button" data-celebrated="1" aria-label="Nice! Got it">Got it ✓</button></div></section>`;
}
/* Tap a robot in the meeting room */
/* Hiba, 24 Nov 2026: in the meeting room, see clearly what each AI is working on, talk to one at a time,
   and press 😡 with nothing to write, for one AI or the whole AI team. */
function aiTeamPanel() {
  const card = w => { const s = aiStatus(w), p = postsBy(w.id)[0];
    return `<li class="aiteam-card"><div class="asker"><span class="mini">${CH.svg(CH.robot(w.key), 44)}</span><div><p class="who-line"><strong>${esc(w.id)}</strong><span>${esc(w.role)}</span></p>
      <p class="small" style="margin:2px 0 0"><span class="dot d-${s.dot}"></span><strong>Working on:</strong> ${esc(s.doing)}</p></div></div>
      ${s.tasks.length ? `<ul class="small aiteam-tasks">${s.tasks.slice(0, 3).map(x => `<li>${esc(x.title)}</li>`).join('')}${s.tasks.length > 3 ? `<li class="muted">and ${s.tasks.length - 3} more</li>` : ''}</ul>` : ''}
      <p class="small muted" style="margin:4px 0">${p ? `Last note ${fmt(p.c.createdAt)}: “${esc((p.c.text || '').replace(/\s+/g, ' ').slice(0, 110))}${(p.c.text || '').length > 110 ? '…' : ''}”` : 'No note on GitHub yet.'}</p>
      <div class="row"><button class="ghost" type="button" data-bot="${w.key}">💬 Talk to ${esc(w.id)}</button><button class="primary angry" type="button" data-meetangry="${w.key}">😡 Not done properly</button></div></li>`; };
  return `<section class="panel aiteam" aria-label="The AI team"><h3>The AI team: who is doing what</h3>
    <p class="small muted">Read from GitHub ${fmt(S.issues && S.issues.readAt)}. 💬 opens a chat with one of them. 😡 needs no writing: it sends them back to finish the job 100%, check it and explain it.</p>
    <ul class="aiteam-list">${WORKSPACES.map(card).join('')}</ul>
    <button class="primary angry" type="button" data-meetangry="all">😡 Whole AI team: not done properly</button></section>`;
}
function meetAngry(key) {
  const ws = key === 'all' ? WORKSPACES : WORKSPACES.filter(w => w.key === key); if (!ws.length) return;
  const to = ws.map(w => w.id).join(', '), m = meetings()[0];
  const b = body({ to, project: 'Not done properly', text: `😡 ${ANGRY_NOTE}` });
  const title = `😡 Not done properly: ${key === 'all' ? 'the whole AI team' : to}`;
  sendOut({ kind: 'message', title, body: b, labels: 'command-center,not-done-properly' }, () => { openGH(newIssueURL(title, b, 'command-center,not-done-properly')); toast('🚀 GitHub opened. Press the green Submit there.'); });
  toast(`😡 ${key === 'all' ? 'The whole AI team goes' : to + ' goes'} back to finish it 100%. ${DB ? 'It is in your 📮 box: press 🚀 Send all.' : ''}`);
}
function botSheet(key) {
  const w = WORKSPACES.find(x => x.key === key); if (!w) return;
  const s = aiStatus(w), posts = postsBy(w.id).slice(0, 2), m = meetings()[0];
  openSheet(`<p class="muted small">In the meeting room</p><h2 id="sheetTitle">${CH.svg(CH.robot(w.key), 40)} ${esc(w.id)}</h2>
    <p><span class="dot d-${s.dot}"></span>${esc(s.doing)}</p>
    <h3>Its latest notes</h3>${posts.length ? posts.map(({ t, c }) => `<div class="bubble-note"><p class="small muted">#${t.n} · ${fmt(c.createdAt)} ${src(c.url)}</p><p>${esc((c.text || '').slice(0, 500))}</p></div>`).join('') : '<p class="muted">No notes on GitHub yet.</p>'}
    ${quickBox('bot-' + w.key, w.id, m ? 'Meeting room' : `Message to ${w.id}`, m ? m.n : '', m ? `Reply in meeting #${m.n}` : `Write to ${w.id}`)}
    <div class="row"><button class="ghost" type="button" data-airoom-go="${w.key}">Visit its room</button></div>`);
}
function whiteboardHTML() {
  const live = defects.filter(d => /^Issue/i.test(d.status || ''));
  const humanGroups = {}; roles.filter(r => r.register?.human).forEach(r => (humanGroups[r.register.human] = humanGroups[r.register.human] || []).push(r.n));
  const busy = new Set([...live.flatMap(d => rolesFor(d.id)), ...roles.filter(r => r.register?.human).map(r => r.n)]);
  const idle = roles.filter(r => !busy.has(r.n)).map(r => r.n);
  const card = (d, cls) => { const t = takenBy(d.id), rs = rolesFor(d.id);
    return `<div class="wb-card ${cls}"><p class="wb-id">${esc(d.id)} · ${esc(d.severity || '')}</p><p class="wb-title">${esc(plainDefect(d))}</p>
      <p class="wb-who">${t ? `${CH.svg(CH.robot(AI_KEY[t.who] || 'Onsi'), 22)} ${t.assigned ? (t.pending ? 'You assigned it to' : 'Assigned to') : 'Being fixed by'} ${esc(t.who)}` : (() => { const x = defaultFor(d.id); return `${CH.svg(CH.robot(AI_KEY[x.who]), 22)} Goes to ${esc(x.who)}${x.team ? `, lead of ${esc(x.team)}` : ''}, unless you pick someone else`; })()}</p>
      ${rs.length ? avatarRow(rs, 7) : '<p class="small muted">No expert role named yet</p>'}${assignRow(d.id, plainDefect(d))}${src(d.url, 'Evidence')}</div>`; };
  const col = (title, cls, inner, n) => `<div class="wb-col"><h3 class="wb-h ${cls}">${esc(title)} <span>${n}</span></h3>${inner || '<p class="small muted">Nothing here.</p>'}</div>`;
  return roomShell('board', 'The team whiteboard, from the latest review register on GitHub. Big enough to read every problem and who is on it.',
    `<div class="whiteboard">
      <div class="wb-phases">${S.reviewPhases.map(p => `<span class="wb-phase ${/Checkpoint/.test(p.status) ? 'done' : /Mentioned/.test(p.status) ? 'mid' : ''}"><b>Phase ${p.phase}</b> ${esc(cap(p.title))}<small>${esc(p.status)}</small></span>`).join('')}</div>
      <div class="wb-leads"><h3 class="small">Who leads each team</h3>${AIS.map(w => `<p class="small">${CH.svg(CH.robot(AI_KEY[w]), 20)} <strong>${esc(w)}</strong>: ${deptGroups().filter(g => leadOf(g.id) === w).map(g => `<button class="linkbtn" type="button" data-deptgo="${esc(g.id)}">${esc(g.name)}</button>`).join(', ') || 'no team yet'}</p>`).join('')}<p class="small muted">Open a team's room to change its lead.</p></div>
      <div class="wb-cols">
        ${col('Urgent', 'u', live.filter(d => d.severity === 'P0').map(d => card(d, 'u')).join(''), live.filter(d => d.severity === 'P0').length)}
        ${col('Fix next', 'y', live.filter(d => d.severity !== 'P0').map(d => card(d, 'y')).join(''), live.filter(d => d.severity !== 'P0').length)}
        ${col('Needs a real person', 'a', Object.entries(humanGroups).map(([need, ns]) => `<div class="wb-card a"><p class="wb-title">${esc(cap(need))}</p>${avatarRow(ns, 7)}</div>`).join(''), Object.keys(humanGroups).length)}
        ${col('Not started yet', 'n', `<div class="wb-card n"><p class="wb-title">${idle.length} experts</p><p class="small muted">Waiting for the next review phase on the new build.</p>${avatarRow(idle, 12)}<p class="small"><button class="linkbtn" type="button" data-room="experts">See them in the Experts hall</button></p></div>`, idle.length)}
      </div>
      <p class="small muted">${src(S.registerSource, 'Review register')} · read ${fmt(S.generated.at)}</p>
    </div>`);
}
/* 🌸 Massage room (Hiba, 24 Nov 2026: "a Thai massage to relax from all the work stress"). A calm room with a
   gentle massage scene and a breathing guide. Like coffee and lunch it is a break: nobody comes to the desk.
   Only on this device; nothing goes to GitHub. No sound; motion stops when the device asks for less motion. */
const SPA = { focus: 'back', mins: 10 };
const SPA_AREAS = { back: ['Back and shoulders', 'Slow palm presses along your back, then your shoulders loosen…', [176, 128]], neck: ['Head and neck', 'Gentle thumbs at the base of your neck, then small circles at your temples…', [118, 122]], feet: ['Feet', 'Firm thumb presses on the soles: the Thai way to finish…', [306, 136]] };
function spaHTML() {
  const b = onBreak(), on = b && b.kind === 'massage', a = SPA_AREAS[SPA.focus], waiting = officeQueue().length;
  const scene = `<svg viewBox="0 0 400 250" class="lunch-svg spa-svg${on ? ' on' : ''}" role="img" aria-label="${on ? `The massage room: you lie on a Thai massage mat while the therapist works on your ${esc(a[0].toLowerCase())}` : 'The massage room: a quiet room with a Thai massage mat, candles and an orchid'}">
    <rect width="400" height="250" fill="light-dark(#F6EEE4,#231C18)"/><rect y="170" width="400" height="80" fill="light-dark(#E8D6BF,#2E241D)"/>
    <g transform="translate(24 20)"><rect width="96" height="70" rx="6" fill="light-dark(#FBF6EE,#2B2420)" stroke="#B98B67" stroke-width="3"/><path d="M14 54 q34 -40 68 0" fill="none" stroke="#C99B6D" stroke-width="3"/><circle cx="48" cy="26" r="9" fill="#F2C14E" opacity=".8"/></g>
    <g transform="translate(340 30)"><path d="M10 120 v-60" stroke="#3B6D11" stroke-width="3"/><path d="M10 70 q-22 -6 -24 -24 q18 4 24 24z" fill="#639922"/><g fill="#F4C0D1" stroke="#993556" stroke-width="1"><circle cx="10" cy="56" r="7"/><circle cx="22" cy="44" r="6"/><circle cx="2" cy="40" r="6"/></g><rect x="-6" y="118" width="32" height="22" rx="4" fill="#C2410C" opacity=".85"/></g>
    ${[[150, 196], [176, 202], [244, 202]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><rect width="12" height="16" rx="2" fill="#FBF6EE" stroke="#B98B67"/><path class="flame f${i}" d="M6 -10 q-5 6 0 10 q5 -4 0 -10z" fill="#F2A341"/></g>`).join('')}
    <rect x="60" y="152" width="290" height="22" rx="8" fill="#C2410C" opacity=".85"/><rect x="60" y="148" width="290" height="10" rx="5" fill="#E8A87C"/>
    <g transform="translate(96 108)"><circle cx="22" cy="22" r="16" fill="#F1C9AE"/><path d="M8 16 q14 -16 30 -2 q-6 -4 -14 -2 q-10 2 -16 4z" fill="#3B2A20"/><rect x="36" y="18" width="150" height="26" rx="13" fill="#E9DCF6"/><rect x="180" y="22" width="44" height="18" rx="9" fill="#5F5E5A"/><ellipse cx="228" cy="31" rx="9" ry="7" fill="#F1C9AE"/><path class="breath" d="M60 18 q60 -8 120 0" stroke="#C7B4E3" stroke-width="6" fill="none" stroke-linecap="round"/></g>
    ${on ? `<g transform="translate(${a[2][0] - 30} ${a[2][1] - 96})"><circle cx="30" cy="20" r="13" fill="#C99B6D"/><path d="M17 16 q13 -14 26 0z" fill="#1E1E1E"/><path d="M12 36 q18 -8 36 0 v34 h-36z" fill="#4E7C5B"/><path class="hands" d="M14 52 q-4 22 14 34 M46 52 q4 22 -14 34" stroke="#C99B6D" stroke-width="7" stroke-linecap="round" fill="none"/></g>
      <g transform="translate(150 16)"><rect width="176" height="44" rx="14" fill="#fff" stroke="#993556" stroke-width="1.5"/><text x="12" y="19" font-size="12.5" fill="#4B1528" font-family="sans-serif" font-weight="700">Breathe out the work…</text><text x="12" y="35" font-size="11.5" fill="#4B1528" font-family="sans-serif">Sawasdee ka 🙏</text></g>` : ''}
  </svg>`;
  return roomShell('spa', on ? `Thai massage: ${esc(a[0].toLowerCase())}. The team waits at your desk.` : 'A quiet room for a Thai massage. While you are here, nobody comes to your desk.',
    `<div class="lunch spa">${scene}
      <div class="lunch-side">
        ${on ? `<p class="spa-now"><strong>${esc(a[0])}</strong><br><span class="small">${esc(a[1])}</span></p>
          <div class="breathe" aria-hidden="true"><span></span></div><p class="small">Breathe with the circle: in while it grows, out while it shrinks.</p>
          <div class="break-clock"><span class="big">${SPA.mins}</span><span>minutes, ends at ${fmt(new Date(new Date(b.since).getTime() + SPA.mins * 60000).toISOString()).split(', ').pop()}<br><small>started ${fmt(b.since).split(', ').pop()} · stay as long as you like</small></span></div>
          <div class="row" role="group" aria-label="Where to massage">${Object.entries(SPA_AREAS).map(([k, v]) => `<button class="opt${SPA.focus === k ? ' picked' : ''}" type="button" data-spaarea="${k}" aria-pressed="${SPA.focus === k}">${esc(v[0])}</button>`).join('')}</div>
          <div class="wait-sign">${waiting ? `${plural(waiting, 'person', 'people')} waiting at your desk. They keep their places in line.` : 'Nobody is waiting at your desk.'}</div>
          <div class="desk-controls walk-keys">${keycap('back-from-break', "I'm back, relaxed", 'backbreak')}</div>`
        : `<p>Choose how long, then lie down. The therapist starts with your back and shoulders; you can switch to head and neck, or feet, at any time.</p>
          <div class="row" role="group" aria-label="How long">${[10, 30, 60].map(m => `<button class="opt${SPA.mins === m ? ' picked' : ''}" type="button" data-spamins="${m}" aria-pressed="${SPA.mins === m}">${m} minutes</button>`).join('')}</div>
          <div class="desk-controls walk-keys">${keycap('massage', 'Start my Thai massage', 'massage')}</div>
          <p class="small muted">Nobody comes to your desk while you are here. Only on this device; nothing is sent to GitHub.</p>`}
      </div></div>`);
}
function breakMinutes(b) { return Math.max(0, Math.round((Date.now() - new Date(b.since).getTime()) / 60000)); }
function lunchHTML() {
  const b = onBreak(), eating = b && b.kind === 'lunch', sipping = b && b.kind === 'coffee', waiting = officeQueue().length;
  const scene = `<svg viewBox="0 0 400 250" class="lunch-svg" role="img" aria-label="${eating ? 'You, eating lunch at the lunch corner table' : sipping ? 'You, having a coffee at the lunch corner table' : 'The lunch corner: an empty table by the window'}">
    <rect x="0" y="0" width="400" height="250" fill="var(--floor)"/>
    <rect x="0" y="150" width="400" height="100" fill="light-dark(#F1E7D8,#241E16)"/>
    <g transform="translate(36 22)"><rect width="128" height="92" rx="6" fill="#DCEBFA" stroke="#8A6D5A" stroke-width="5"/><circle cx="96" cy="30" r="14" fill="#F2C14E"/><path d="M0 70 q32 -18 64 0 t64 0 v22 H0z" fill="#85B7EB"/><path d="M64 0v92M0 46h128" stroke="#8A6D5A" stroke-width="3"/></g>
    <g transform="translate(300 24)"><circle cx="26" cy="26" r="24" fill="#fff" stroke="#5F5E5A" stroke-width="3"/><path d="M26 26 V10 M26 26 L38 32" stroke="#253E43" stroke-width="3" stroke-linecap="round"/></g>
    <g transform="translate(232 112) scale(.4)"><path d="M10 0 h40 l-8 70 h-24z" fill="#D85A30"/><path d="M30 0 q-16 -26 -2 -46 q10 22 2 46z M30 0 q18 -22 8 -44 q-8 20 -8 44z" fill="#639922"/></g>
    ${b ? `<g transform="translate(150 34) scale(1.05)">${CH.FOUNDER}</g>` : ''}
    <g><ellipse cx="200" cy="160" rx="132" ry="26" fill="#C99B6D"/><rect x="68" y="160" width="264" height="10" fill="#A9784B"/><rect x="186" y="170" width="28" height="70" fill="#8A5A3B"/><ellipse cx="200" cy="242" rx="54" ry="7" fill="#000" opacity=".08"/></g>
    ${eating ? `<g transform="translate(166 142)"><ellipse cx="34" cy="14" rx="34" ry="11" fill="#fff" stroke="#B4B2A9"/><ellipse cx="34" cy="11" rx="24" ry="7" fill="#F5C98A"/><circle cx="22" cy="9" r="5" fill="#97C459"/><circle cx="34" cy="7" r="5" fill="#D85A30"/><circle cx="45" cy="10" r="5" fill="#97C459"/><circle cx="29" cy="12" r="3" fill="#EF9F27"/>
        <path class="steam" d="M22 -2 q-3 -6 0 -12 M34 -4 q-3 -6 0 -12 M46 -2 q-3 -6 0 -12" stroke="#B4B2A9" stroke-width="2" fill="none"/></g>
      <g class="fork" transform="translate(206 146)"><path d="M0 0 L7 22" stroke="#888780" stroke-width="2.4" stroke-linecap="round"/><path d="M-2.5 1 l-1 -6 M0 0 l0 -6 M2.5 -1 l1 -6" stroke="#888780" stroke-width="1.4" stroke-linecap="round"/><circle cx="0" cy="-6" r="2.6" fill="#97C459"/><ellipse cx="8" cy="23" rx="3.2" ry="2.6" fill="#F1C9AE"/></g>
      <g transform="translate(262 128)"><rect width="18" height="26" rx="3" fill="#FCE3C8" stroke="#B98B67"/><rect x="2" y="8" width="14" height="16" fill="#EF9F27" opacity=".8"/><path d="M12 0 l6 -12" stroke="#E24B4A" stroke-width="2"/></g>` : ''}
    ${sipping ? `<g transform="translate(212 126)"><rect width="22" height="22" rx="4" fill="#fff" stroke="#5A3420" stroke-width="2"/><path d="M22 6 q8 0 8 6 t-8 6" fill="none" stroke="#5A3420" stroke-width="2"/><path class="steam" d="M6 -4 q-3 -6 0 -12 M14 -4 q-3 -6 0 -12" stroke="#B4B2A9" stroke-width="2" fill="none"/></g><g transform="translate(150 138)"><rect width="30" height="14" rx="3" fill="#F5C98A"/><circle cx="8" cy="5" r="2" fill="#8A5A3B"/><circle cx="20" cy="8" r="2" fill="#8A5A3B"/></g>` : ''}
    ${b ? `<g class="say" transform="translate(${eating ? 22 : 40} 130)"><rect width="${eating ? 128 : 112}" height="28" rx="14" fill="#fff" stroke="#1C4047" stroke-width="1.5"/><path d="M${eating ? 112 : 96} 14 l26 4 l-24 6z" fill="#fff" stroke="#1C4047" stroke-width="1.5"/><text x="12" y="18.5" font-size="14" fill="#1C4047" font-family="sans-serif" font-weight="700">${eating ? 'Mmm, delicious!' : 'Ahh, coffee…'}</text></g>` : ''}
  </svg>`;
  return roomShell('lunch', b ? `${esc(BREAKS[b.kind])}: enjoy it. The team waits at your desk.` : 'A quiet table by the window. Take a break whenever you like.',
    `<div class="lunch">${scene}
      <div class="lunch-side">
        ${b ? `<div class="break-clock"><span class="big" id="breakMins">${breakMinutes(b)}</span><span>minutes on your ${esc(b.kind)} break<br><small>since ${fmt(b.since).split(', ').pop()}</small></span></div>
          <div class="wait-sign">${waiting ? `${plural(waiting, 'person', 'people')} waiting at your desk. They keep their places in line.` : 'Nobody is waiting at your desk.'}</div>
          <div class="desk-controls walk-keys">${keycap('back-from-break', "I'm back", 'backbreak')}${keycap(b.kind === 'lunch' ? 'coffee' : 'lunch', b.kind === 'lunch' ? 'Coffee after lunch' : 'Make it lunch', b.kind === 'lunch' ? 'coffee' : 'lunch')}</div>`
        : `<p class="small muted">Nobody comes to your desk while you are on a break. This is only on this device; nothing is sent to GitHub.</p><div class="desk-controls walk-keys">${keycap('lunch', 'Lunch break', 'lunch')}${keycap('coffee', 'Coffee break', 'coffee')}</div>`}
      </div></div>`);
}
/* ------------------------------------------------------------ meeting room: notes with the 3 AI, kept on GitHub */
const NOTE_KINDS = ['Update', 'Idea to improve', 'Question', 'Decision needed'];
const meetings = () => THREADS.filter(t => (t.labels || []).includes('meeting') || /^\[Meeting\]/i.test(t.title)).sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
let meetDraft0 = null;
const MD = () => meetDraft0 || (meetDraft0 = store.get('meeting-draft', { kind: 'Update', text: '', agenda: [] }));
function agendaItems() {
  const N = nowItems();
  return [...N.u.map(x => ({ id: x.id, text: `${x.tag}: ${x.title}` })), ...N.a.map(x => ({ id: x.id, text: `${x.title} (${x.who})` })),
    { id: 'decisions', text: `${pendingCount()} decisions waiting for Hiba` }];
}
function meetingHTML() {
  const tm = store.get('teamMeet', null), tg = tm && deptGroups().find(x => x.id === tm);
  if (tg) return teamMeetingHTML(tg);
  const ms = meetings(), m = ms[0], posts = m ? [m, ...m.comments] : [];
  const lastBy = who => [...posts].reverse().find(x => (x.from || '').toLowerCase().includes(who.toLowerCase()));
  const seats = [{ key: 'Hiba (founder)', label: 'You', svg: CH.FOUNDER, x: 40, y: 72 }, ...WORKSPACES.map((w, i) => ({ key: w.id, label: w.id, svg: CH.robot(w.key), x: [118, 194, 270][i], y: [60, 52, 60][i] }))];
  const short = t => { const x = (t || '').replace(/\s+/g, ' ').trim(); return x.length > 34 ? x.slice(0, 33) + '…' : x; };
  const scene = `<svg viewBox="0 0 400 230" class="meet-svg" role="img" aria-label="Meeting room: you and the 3 AI around a table${m ? ', with their latest notes' : ''}">
    <rect width="400" height="230" fill="var(--floor)"/><rect y="150" width="400" height="80" fill="light-dark(#E8EFFA,#1C3346)"/>
    <g transform="translate(6 6)"><rect width="100" height="24" rx="4" fill="#fff" stroke="#888780"/><text x="50" y="16" font-size="11" text-anchor="middle" fill="#253E43" font-family="sans-serif" font-weight="700">${m ? 'Meeting #' + m.n : 'No meeting yet'}</text></g>
    ${seats.map((st0, i) => i ? `<g class="tapbot" role="button" tabindex="0" data-bot="${WORKSPACES[i - 1].key}" aria-label="${esc(st0.label)}: see its notes and reply" transform="translate(${st0.x} ${st0.y}) scale(.7)">${st0.svg}</g>` : `<g transform="translate(${st0.x} ${st0.y}) scale(.7)">${st0.svg}</g>`).join('')}
    <ellipse cx="200" cy="168" rx="150" ry="36" fill="#E8D8BE" stroke="#B98B67" stroke-width="2"/><ellipse cx="200" cy="164" rx="150" ry="36" fill="#F3E6D0"/>
    <g transform="translate(334 112) scale(.7)">${CH.robot('Live')}</g><g transform="translate(326 92)"><rect width="72" height="18" rx="9" fill="#FCEDE4" stroke="#C2410C"/><text x="36" y="12.5" font-size="9.5" text-anchor="middle" fill="#8A3E12" font-family="sans-serif" font-weight="700">Live Claude</text></g>
    ${[[150, 158], [205, 150], [262, 160], [110, 170]].map(([x, y]) => `<rect x="${x}" y="${y}" width="22" height="14" rx="1" fill="#fff" stroke="#B4B2A9" transform="rotate(-8 ${x} ${y})"/>`).join('')}
    ${seats.map(st0 => { const n = lastBy(st0.key === 'Hiba (founder)' ? 'hiba (founder)' : st0.key); const txt = n ? short(n.text) : 'No note yet'; const w = Math.min(150, Math.max(70, txt.length * 5.6 + 14));
      const bx = Math.max(2, Math.min(st0.x + 10, 398 - w)), by = Math.max(2, st0.y - 30);
      return `<g class="note-bubble${n ? '' : ' empty'}"><rect x="${bx}" y="${by}" width="${w}" height="22" rx="11" fill="${n ? '#fff' : 'transparent'}" stroke="${n ? '#534AB7' : '#B4B2A9'}" stroke-dasharray="${n ? '0' : '3 3'}"/><text x="${bx + 8}" y="${by + 15}" font-size="10" fill="#253E43" font-family="sans-serif">${esc(txt)}</text></g>`; }).join('')}
  </svg>`;
  const items = agendaItems();
  const notes = posts.map((x, i) => `<li class="note"><div class="note-who">${(x.from || '').match(/Claude Hiba|Claude Onsi|ChatGPT/) ? CH.svg(CH.robot((x.from.match(/Claude Hiba|Claude Onsi|ChatGPT/)[0]).replace('Claude ', '')), 30) : CH.svg(CH.FOUNDER, 30)}<span><strong>${esc(x.from || 'Sender not stated')}</strong><small>${i ? 'note' : 'opened the meeting'} · ${fmt(x.createdAt)} · GitHub: ${esc(x.author)}</small></span>${src(x.url)}</div><p>${esc(x.text || '')}</p></li>`).join('');
  return roomShell('meeting', 'Your team right now, and one box to talk to them. Answers come back in the same place.',
    `${cxMeetingHTML()}<details class="cx-olddetails"><summary>Show details: meeting notes, Live Claude and team meetings</summary><div class="meet"><div>${scene}${livePanelHTML()}</div>
      <div class="meet-side">
        <div class="invite"><p class="small"><strong>Invite to read and add a note:</strong></p><div class="row">${WORKSPACES.map(w => `<button class="ghost" type="button" data-invite="${esc(w.id)}" ${m ? '' : 'disabled'}>${CH.svg(CH.robot(w.key), 22)} ${esc(w.id)}</button>`).join('')}</div>${m ? '' : '<p class="small muted">Start a meeting first.</p>'}</div>
        <form class="meet-form" id="meetForm" novalidate><p class="small" style="margin:0"><strong>Share a note</strong> ${m ? `in meeting #${m.n}` : '(starts a new meeting)'}</p>
          <div class="opts" role="radiogroup" aria-label="Kind of note">${NOTE_KINDS.map(k => `<button class="opt" type="button" role="radio" data-notekind="${esc(k)}" aria-checked="${MD().kind === k}" aria-pressed="${MD().kind === k}">${esc(k)}</button>`).join('')}</div>
          <label class="small">Your note<textarea id="meetText" rows="4" placeholder="What should the team improve, know or decide?">${esc(MD().text)}</textarea></label>
          <p class="state local" style="margin:0"><strong>Draft, not shared.</strong> Kept on this device until you post it on GitHub.</p>
          <div class="row">${m ? `<button class="primary" type="button" id="meetPost">Post note on GitHub</button>` : ''}<button class="${m ? 'ghost' : 'primary'}" type="button" id="meetNew">Start a new meeting</button><button class="ghost" type="button" id="meetClaude">${icon('copy')}Ask Claude to post</button></div>
        </form>
      </div></div>
      ${aiTeamPanel()}
      <section class="panel tmcall"><h3>Meet a team</h3><p class="small muted">Call a whole team to this table to see what they did and give them one verdict.</p><div class="row">${deptGroups().map(g => `<button class="ghost" type="button" data-callteam="${esc(g.id)}">📣 ${esc(g.name)}</button>`).join('')}</div></section>
      <details class="agenda" open><summary>Suggested agenda, from GitHub records</summary><ul class="list small">${items.map(it => `<li><label class="agenda-item"><input type="checkbox" data-agenda="${esc(it.id)}" ${MD().agenda.includes(it.id) ? 'checked' : ''}> ${esc(it.text)}</label></li>`).join('')}</ul><p class="small muted">Ticked items go into the meeting you start.</p></details>
      <h3 class="section">Meeting notes ${m ? `· #${m.n} ${esc(m.title.replace(/^\[Meeting\]\s*/i, ''))}` : ''}</h3>
      ${m ? `<ol class="notes">${notes}</ol><p class="small muted">Read from GitHub ${fmt(S.issues.readAt)}. New notes appear after the next refresh.</p>` : '<div class="empty">No meeting notes on GitHub yet. Start a meeting to open the first thread.</div>'}
      ${ms.length > 1 ? `<p class="small">Earlier meetings: ${ms.slice(1, 6).map(x => `<button class="linkbtn" type="button" data-thread="${x.n}">#${x.n} ${esc(x.title.replace(/^\[Meeting\]\s*/i, ''))}</button>`).join(' · ')}</p>` : ''}</details>`);
}
/* ------------------------------------------------------------ Live Claude at the meeting table (Artifact 'sample' capability) */
/* Hiba chose this on 23 Nov 2026. It is a fresh Claude running in this page under the viewer's
   own claude.ai account: not the Claude Hiba or Claude Onsi chats, not ChatGPT. It only sees the
   GitHub snapshot through the tools below and cannot change anything. Chat is kept in memory only. */
const LIVE = { msgs: [], busy: false, ctl: null, avail: null, err: '' };
let SAMPLE = null;
function liveData() {
  const N = nowItems();
  return [`Snapshot read from GitHub ${S.generated.at} (main ${short(S.branches.main.sha)}).`,
    `Urgent problems: ${N.u.map(x => `${x.tag} ${x.title} (${x.sub || ''})`).join('; ') || 'none'}.`,
    `Other open defects: ${defects.filter(d => /^Issue/i.test(d.status || '') && d.severity !== 'P0').map(d => `${d.id} ${d.severity} ${plainDefect(d)}`).join('; ')}.`,
    `Decisions waiting for Hiba: ${pendingCount()} (her own: ${N.y.filter(x => x.dec).map(x => x.title).join('; ')}).`,
    `Waiting on an AI: ${N.a.map(x => `${x.title} (${x.who})`).join('; ') || 'nothing'}.`,
    `AI workspaces: ${WORKSPACES.map(w => { const last = activity.filter(x => x.actor === w.key && x.date).sort((a, b) => b.date.localeCompare(a.date))[0]; return `${w.id}: ${w.role} Last record: ${last ? last.title.slice(0, 120) + ' (' + last.date + ')' : 'none'}`; }).join(' | ')}.`,
    `Website: ${S.website ? S.website.status + ' — ' + (S.website.statusWhy || '') : 'no record'}.`,
    `Review v2 phases: ${S.reviewPhases.map(p => `${p.phase} ${p.title}: ${p.status}`).join('; ')}.`,
    `Team: 116 expert roles played by Claude (builders 1-50, reviewers 51-100 check builder N-50, 101 lead architect, 102-116 teaching specialists); ${roles.filter(r => colourOf(r, 'verdict') === 'bad').length} have an issue found, ${roles.filter(r => r.register?.human).length} need a real person.`].join('\n');
}
const LIVE_TOOLS = [
  { name: 'get_role', description: 'One of the 116 expert roles by number: title, responsibility, V2 focus, latest report status, register findings and its reviewer pair.', inputSchema: { type: 'object', properties: { n: { type: 'integer' } }, required: ['n'] },
    execute: ({ n }) => { const r = roleBy[n]; if (!r) throw new Error('No role ' + n); const g = r.register || {}; return { n, title: r.title, department: deptPlain(r.dept), responsibility: r.responsibility, v2focus: r.v2focus || null, report: r.report?.status, reportText: r.report?.statusText, verdict: g.verdict, findings: g.findings, recheckOwed: g.recheck, needsHuman: g.human, pair: r.pair }; } },
  { name: 'search_roles', description: 'Find roles whose title, responsibility or findings contain a word.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    execute: ({ query }) => roles.filter(r => [r.title, r.responsibility, r.v2focus, r.register?.findings].join(' ').toLowerCase().includes(String(query).toLowerCase())).slice(0, 15).map(r => ({ n: r.n, title: r.title, verdict: r.register?.verdict })) },
  { name: 'get_defect', description: 'A defect from the review register by ID (D1-D10): status, severity, evidence, roles on it and which account is fixing it.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    execute: ({ id }) => { const d = defects.find(x => x.id === String(id).toUpperCase()); if (!d) throw new Error('No defect ' + id); const t = takenBy(d.id); return { ...d, plain: plainDefect(d), roles: rolesFor(d.id), beingFixedBy: t ? t.who : null }; } },
  { name: 'list_decisions', description: 'Decisions waiting for Hiba, optionally filtered by kind (Teaching rule, New rule, Hiba\'s decision, Team decision, Open decision).', inputSchema: { type: 'object', properties: { kind: { type: 'string' } } },
    execute: ({ kind }) => pendingList().filter(p => stateOf(p.id).k !== 'git' && (!kind || (p.kind || '').toLowerCase().includes(String(kind).toLowerCase()))).slice(0, 25).map(p => ({ id: p.id, kind: p.kind, title: p.title, options: p.options })) },
  { name: 'list_threads', description: 'Team message threads (GitHub Issues), with recipients and reply counts.', inputSchema: { type: 'object', properties: {} },
    execute: () => THREADS.map(t => ({ n: t.n, title: t.title, to: t.to, from: t.from, state: t.state, replies: t.comments.length })) },
  { name: 'get_thread', description: 'One message thread with all its notes.', inputSchema: { type: 'object', properties: { n: { type: 'integer' } }, required: ['n'] },
    execute: ({ n }) => { const t = THREADS.find(x => x.n === n); if (!t) throw new Error('No thread ' + n); return { n, title: t.title, to: t.to, posts: [t, ...t.comments].map(x => ({ from: x.from, githubAuthor: x.author, at: x.createdAt, text: (x.text || '').slice(0, 1500) })) }; } }
];
const LIVE_RULES = `You are "Live Claude (in this page)", a meeting helper inside the WhySteps Command Center, talking with Hiba, the founder. She has no coding background: answer in plain English, short enough for a phone (under 140 words unless she asks for more), with bullet points only when they help.
Be honest about what you are: a fresh Claude running in this page. You are NOT the Claude Hiba or Claude Onsi chats and NOT ChatGPT; you cannot act for them, message them, change GitHub, merge, publish or test anything. You only know the GitHub snapshot below and what the tools return. Never invent progress, results, people or dates; if the records do not say, say so. The 116 roles are expert functions played by Claude, not people.
When useful, suggest a concrete next step and who should do it (Claude Hiba, Claude Onsi, ChatGPT, a real person, or Hiba), and offer wording she can post as a meeting note.`;
async function liveInit() {
  if (LIVE.avail !== null) return; LIVE.avail = false;
  if (!(window.claude && window.claude.use)) { LIVE.err = 'Live Claude works inside the Command Center Artifact on claude.ai.'; return; }
  try { SAMPLE = await window.claude.use('sample'); } catch (e) { SAMPLE = null; }
  LIVE.avail = !!SAMPLE; if (!SAMPLE) LIVE.err = 'Live Claude is not switched on for this Artifact yet (README: "Live Claude").';
  if (st.view === 'now' && st.room === 'meeting') { const el = $('#livePanel'); if (el) el.outerHTML = livePanelHTML(); }
}
function livePanelHTML() {
  const ok = LIVE.avail;
  return `<section class="live" id="livePanel" aria-label="Live Claude (in this page)">
    <div class="live-head">${CH.svg(CH.robot('Live'), 34)}<div><strong>Live Claude <small>(in this page)</small></strong><span class="small muted">${ok ? 'Answers now, from the GitHub snapshot. Not your Claude Hiba or Claude Onsi chats, not ChatGPT.' : esc(LIVE.err || 'Connecting…')}</span></div>${LIVE.msgs.length ? '<button class="linkbtn" type="button" id="liveClear">Clear chat</button>' : ''}</div>
    <ol class="live-log" id="liveLog">${LIVE.msgs.map((m, i) => `<li class="lm ${m.role}"><p>${esc(m.content)}</p>${m.role === 'assistant' && !LIVE.busy ? `<button class="linkbtn" type="button" data-tonote="${i}">Use as a meeting note</button>` : ''}</li>`).join('') || `<li class="lm hint"><p>Ask anything about the project, for example: “What should we fix first?”, “What is #77 working on?”, or “Summarise today for the meeting.”</p></li>`}</ol>
    ${LIVE.msgs.some(m => m.role === 'assistant') && !LIVE.busy ? `<div class="live-share" role="group" aria-label="Share this discussion"><span class="small"><strong>Share this discussion:</strong></span>
      <button class="ghost" type="button" data-liveshare="github">Save to meeting notes</button>${WORKSPACES.map(w => `<button class="ghost" type="button" data-liveshare="${esc(w.id)}">${CH.svg(CH.robot(w.key), 20)} Send to ${esc(w.id)}</button>`).join('')}</div>` : ''}
    <form class="live-ask" id="liveForm" novalidate><label class="sr-only" for="liveQ" style="position:absolute;left:-999px">Ask Live Claude</label><textarea id="liveQ" rows="2" placeholder="${ok ? 'Ask Live Claude…' : 'Live Claude is not available here'}" ${ok ? '' : 'disabled'}></textarea>
      <button class="primary" type="button" id="liveSend" ${ok ? '' : 'disabled'}>${LIVE.busy ? 'Stop' : 'Ask'}</button></form>
    <p class="small muted" style="margin:0">Uses your Claude allowance, like a normal chat. Never type passwords or children's material. The chat is not saved; use “Use as a meeting note” to keep something.</p></section>`;
}
async function liveAsk() {
  if (LIVE.busy) { LIVE.ctl?.abort(); return; }
  const q = ($('#liveQ').value || '').trim();
  if (!q) { toast('Write your question first.'); return; }
  if (SECRET.test(q)) { toast('That looks like a password or key. Please leave it out.'); return; }
  LIVE.msgs.push({ role: 'user', content: q }, { role: 'assistant', content: 'Thinking…' });
  LIVE.busy = true; LIVE.ctl = new AbortController(); redrawLive();
  const hist = LIVE.msgs.slice(0, -1).map((m, i) => ({ role: m.role, content: i === 0 ? `${LIVE_RULES}\n\nGitHub snapshot:\n${liveData()}\n\nHiba asks: ${m.content}` : m.content }));
  try {
    const r = await SAMPLE(hist, { signal: LIVE.ctl.signal, tools: LIVE_TOOLS, modelTier: 'default', cache: false,
      onText: ({ text }) => { LIVE.msgs[LIVE.msgs.length - 1].content = text; const last = document.querySelector('#liveLog li:last-child p'); if (last) last.textContent = text; } });
    LIVE.msgs[LIVE.msgs.length - 1].content = r.text + (r.truncated ? ' …(cut short)' : '');
  } catch (e) {
    const last = LIVE.msgs[LIVE.msgs.length - 1];
    if (e && e.code === 'not_granted') { LIVE.avail = false; LIVE.err = 'Live Claude was not allowed on this page.'; }
    last.content = e && e.name === 'AbortError' ? (last.content === 'Thinking…' ? 'Stopped.' : last.content + ' (stopped)') : e && e.code === 'rate_limited' ? 'Live Claude is busy right now. Try again in a minute.' : (e && e.text) || 'Live Claude could not answer just now.';
  }
  LIVE.busy = false; LIVE.ctl = null; redrawLive();
}
function liveTranscript() {
  return LIVE.msgs.filter(m => m.content && m.content !== 'Thinking…').map(m => `${m.role === 'user' ? 'Hiba' : 'Live Claude (in this page)'}: ${m.content}`).join('\n\n');
}
function liveShare(to) {
  const m = meetings()[0], tr = liveTranscript();
  const body = ['<!-- whysteps-command-center/1 -->', '**To:** Claude Hiba, Claude Onsi, ChatGPT', '**From:** Hiba (founder)', '**Project / feature:** Meeting room · discussion with Live Claude', '',
    `Discussion between Hiba and Live Claude (a Claude running inside the Command Center page, reading the GitHub snapshot of ${fmt(S.generated.at)}). Its suggestions are not decisions until Hiba says so.`, '', tr].join('\n');
  if (to === 'github' && DB) { const ttl = `[Meeting] ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: TZ }).format(new Date())}: discussion with Live Claude`;
    sendOut({ kind: 'meeting', title: m ? '' : ttl, body, labels: 'meeting,command-center', issue: m ? m.n : null }, () => liveShare('github-direct')); return; }
  if (to === 'github' || to === 'github-direct') {
    if (m) { copy(body, 'Discussion').then(() => toast('Discussion copied. GitHub opens: paste it in the comment box and press Comment.')); window.open(m.url + '#new_comment_field', '_blank', 'noopener'); return; }
    const title = `[Meeting] ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: TZ }).format(new Date())}: discussion with Live Claude`;
    if (body.length < 6000) { const a = document.createElement('a'); a.href = newIssueURL(title, body, 'meeting,command-center'); a.target = '_blank'; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove(); toast('🚀 GitHub opened with the discussion. It is saved when you press the green Submit there.'); return; }
    copy(body, 'Discussion').then(() => toast('Long discussion copied. GitHub opens: paste it, then press Submit.')); window.open(`${GH}/issues/new?title=${encodeURIComponent(title)}&labels=meeting,command-center`, '_blank', 'noopener'); return;
  }
  const ask = `From Hiba's Command Center (WhySteps). Below is a discussion I had with Live Claude, a Claude inside the Command Center page that reads the GitHub snapshot. Please read it, tell me what you agree with, what you would do and anything that is wrong, then ${m ? `add your reply as a comment on GitHub Issue #${m.n} (H2ONLB/whysteps), starting with "**From:** ${to}"` : `record your reply on GitHub in H2ONLB/whysteps as an Issue labelled meeting, starting with "**From:** ${to}"`}.\n\n${tr}`;
  copy(ask, 'Discussion for ' + to).then(() => toast('Copied. ' + pasteWhere(to)));
}
function redrawLive() { const el = $('#livePanel'); if (el) { el.outerHTML = livePanelHTML(); const log = $('#liveLog'); if (log) log.scrollTop = log.scrollHeight; } }
function meetingBody(newMeeting) {
  const items = agendaItems().filter(it => MD().agenda.includes(it.id));
  const head = ['<!-- whysteps-command-center/1 -->', '**To:** Claude Hiba, Claude Onsi, ChatGPT', '**From:** Hiba (founder)', `**Project / feature:** Meeting room · ${MD().kind}`, ''];
  return head.join('\n') + (newMeeting && items.length ? 'Agenda:\n' + items.map(it => `- ${it.text}`).join('\n') + '\n\n' : '') + `${MD().kind}: ${MD().text.trim()}`;
}
/* ------------------------------------------------------------ the coffee room: make your coffee and drink it */
const DRINKS = {
  espresso: { name: 'Espresso', color: '#4A2A16', cream: '#C99B6D', small: true },
  cappuccino: { name: 'Cappuccino', color: '#8A5A3B', cream: '#F3E3D3' },
  lebanese: { name: 'Lebanese coffee', color: '#3B2416', cream: '#7A5A3B', small: true },
  latte: { name: 'Latte', color: '#B98B67', cream: '#FBF1E6' },
  tea: { name: 'Tea', color: '#B5651D', cream: '#C77C2E' },
  chocolate: { name: 'Hot chocolate', color: '#5A3420', cream: '#F7E7D7' } };
const CO = { drink: 'cappuccino', sugar: 1, stage: 'choose', level: 0 };
const SIPS = ['Mmm, perfect.', 'Just what I needed.', 'Ahh, lovely.', 'Last sip!'];
function coffeeHTML() {
  const d = DRINKS[CO.drink], b = onBreak(), held = CO.stage === 'drinking' || CO.stage === 'empty';
  const cupFill = (h) => `<rect x="2" y="${2 + (1 - CO.level / 100) * h}" width="20" height="${Math.max(0, CO.level / 100 * h)}" fill="${d.color}"/>${CO.level > 0 ? `<rect x="2" y="${2 + (1 - CO.level / 100) * h}" width="20" height="3" fill="${d.cream}"/>` : ''}`;
  const cup = (cls) => `<g class="${cls}"><rect x="0" y="0" width="24" height="${d.small ? 18 : 24}" rx="4" fill="#fff" stroke="#5A3420" stroke-width="1.6"/><g clip-path="url(#cupclip)">${cupFill(d.small ? 14 : 20)}</g><path d="M24 5 q8 0 8 6 t-8 6" fill="none" stroke="#5A3420" stroke-width="1.6"/>${CO.level > 0 ? '<path class="steam" d="M7 -3 q-3 -5 0 -10 M15 -3 q-3 -5 0 -10" stroke="#B4B2A9" stroke-width="1.6" fill="none"/>' : ''}</g>`;
  const scene = `<svg viewBox="0 0 400 250" class="coffee-svg" role="img" aria-label="The coffee room: ${CO.stage === 'brewing' ? 'the machine is pouring your ' + d.name : held ? 'you holding your ' + d.name + ', ' + CO.level + '% left' : 'the coffee machine, ready'}">
    <defs><clipPath id="cupclip"><rect x="2" y="2" width="20" height="${d.small ? 14 : 20}" rx="2"/></clipPath></defs>
    <rect width="400" height="250" fill="var(--floor)"/><rect y="196" width="400" height="54" fill="#A9784B"/><rect y="192" width="400" height="8" fill="#C99B6D"/>
    <g transform="translate(18 30)"><rect width="70" height="50" rx="4" fill="#fff" stroke="#888780"/><text x="35" y="20" font-size="9" text-anchor="middle" fill="#5A7075" font-family="sans-serif" font-weight="700">TODAY'S MENU</text><text x="35" y="34" font-size="8" text-anchor="middle" fill="#5A7075" font-family="sans-serif">coffee · tea · cocoa</text></g>
    <g transform="translate(110 22)">
      <rect width="130" height="172" rx="12" fill="#2C2C2A"/><rect x="8" y="8" width="114" height="34" rx="6" fill="#1C4047"/>
      <text x="65" y="23" font-size="10" text-anchor="middle" fill="#9FE1CB" font-family="sans-serif" font-weight="700">${esc(d.name)}</text>
      <text x="65" y="36" font-size="9" text-anchor="middle" fill="#E4EEEB" font-family="sans-serif">${CO.stage === 'brewing' ? 'Pouring…' : CO.stage === 'ready' ? 'Ready! Take your cup' : held ? 'Enjoy!' : 'Sugar: ' + (CO.sugar ? CO.sugar + ' cube' + (CO.sugar > 1 ? 's' : '') : 'none')}</text>
      ${[0, 1, 2].map(i => `<circle cx="${40 + i * 25}" cy="56" r="7" fill="${['#E24B4A', '#D9A53A', '#2A9D74'][i]}"/>`).join('')}
      <rect x="45" y="70" width="40" height="18" rx="4" fill="#5F5E5A"/><rect x="58" y="88" width="14" height="10" fill="#888780"/>
      ${CO.stage === 'brewing' ? `<rect class="pour" x="62" y="98" width="6" height="${d.small ? 52 : 46}" fill="${d.color}"/>` : ''}
      <rect x="20" y="158" width="90" height="8" rx="3" fill="#5F5E5A"/>
      ${CO.stage === 'brewing' || CO.stage === 'ready' ? `<g transform="translate(53 ${d.small ? 140 : 134})">${cup(CO.stage === 'brewing' ? 'filling' : '')}</g>` : ''}
    </g>
    ${CO.sugar && CO.stage !== 'choose' ? '' : `<g transform="translate(262 176)">${[0, 1, 2].map(i => `<rect x="${i * 10}" y="${i % 2 ? -6 : 0}" width="9" height="9" rx="1.5" fill="#fff" stroke="#B4B2A9"/>`).join('')}</g>`}
    <g transform="translate(252 40) scale(1)">${CH.FOUNDER}</g>
    ${held ? `<g transform="translate(304 112)">${cup('held')}</g>` : ''}
    ${CO.say ? `<g class="say" transform="translate(150 6)"><rect width="${Math.max(110, CO.say.length * 7.4)}" height="26" rx="13" fill="#fff" stroke="#1C4047" stroke-width="1.5"/><path d="M${Math.max(110, CO.say.length * 7.4) - 18} 25 l12 10 l-2 -10z" fill="#fff" stroke="#1C4047" stroke-width="1.5"/><text x="12" y="17.5" font-size="13" fill="#1C4047" font-family="sans-serif" font-weight="700">${esc(CO.say)}</text></g>` : ''}
  </svg>`;
  const controls = CO.stage === 'choose' ? `<p class="small" style="margin:0"><strong>1. Choose your drink</strong></p>
      <div class="drinks">${Object.entries(DRINKS).map(([k, x]) => `<button class="drink" type="button" data-drink="${k}" aria-pressed="${CO.drink === k}"><span class="sw" style="background:${x.color}"></span>${esc(x.name)}</button>`).join('')}</div>
      <p class="small" style="margin:0"><strong>2. Sugar</strong></p>
      <div class="seg" role="group" aria-label="Sugar">${[0, 1, 2, 3].map(n => `<button type="button" data-sugar="${n}" aria-pressed="${CO.sugar === n}">${n ? n + ' cube' + (n > 1 ? 's' : '') : 'None'}</button>`).join('')}</div>
      <div class="desk-controls walk-keys">${keycap('brew', 'Brew my ' + d.name.toLowerCase(), 'coffee')}${b ? keycap('back-from-break', "I'm back", 'backbreak') : keycap('go-office', 'Back to my office', 'backbreak')}</div>`
    : CO.stage === 'brewing' ? `<p class="brewing">Pouring your ${esc(d.name.toLowerCase())}…</p>`
    : CO.stage === 'ready' ? `<div class="desk-controls walk-keys">${keycap('takecup', 'Take your cup', 'coffee')}</div>`
    : CO.stage === 'drinking' ? `<p class="small" style="margin:0">Your ${esc(d.name.toLowerCase())}: <strong>${CO.level}% left</strong></p><div class="cupbar"><span style="width:${CO.level}%;background:${d.color}"></span></div>
      <div class="desk-controls walk-keys">${keycap('sip', 'Take a sip', 'coffee')}${b ? keycap('back-from-break', "I'm back", 'backbreak') : keycap('go-office', 'Back to my office', 'backbreak')}</div>`
    : `<p class="small" style="margin:0"><strong>All finished.</strong> ${b ? 'The team is still waiting at your desk.' : ''}</p><div class="desk-controls walk-keys">${keycap('another', 'Another one?', 'coffee')}${b ? keycap('back-from-break', "I'm back", 'backbreak') : keycap('go-office', 'Back to my office', 'backbreak')}</div>`;
  return roomShell('coffee', b ? `${esc(BREAKS[b.kind])} since ${fmt(b.since).split(', ').pop()} · ${plural(officeQueue().length, 'person', 'people')} waiting at your desk` : 'Make your own coffee. Making one starts a coffee break; the team waits at your desk.',
    `<div class="coffee">${scene}<div class="coffee-side">${controls}</div></div>`);
}
function coffeeStep(a) {
  const d = DRINKS[CO.drink];
  if (a === 'brew') { if (!onBreak()) store.set('break', { kind: 'coffee', since: new Date().toISOString() }); CO.stage = 'brewing'; CO.level = 0; CO.say = '';
    const fill = () => { if (CO.stage !== 'brewing') return; CO.level = Math.min(100, CO.level + 20); if (CO.level >= 100) { CO.stage = 'ready'; CO.say = 'Smells amazing!'; } redrawCoffee(); if (CO.stage === 'brewing') setTimeout(fill, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 450); };
    redrawCoffee(); setTimeout(fill, 450); return; }
  if (a === 'takecup') { CO.stage = 'drinking'; CO.say = d.small ? 'Small but strong.' : 'Lovely and hot.'; }
  if (a === 'sip') { const lift = () => { const c = $('.coffee-svg .held'); if (!c) return; requestAnimationFrame(() => { c.classList.add('sipping'); setTimeout(() => c.classList.remove('sipping'), 700); }); };
    lift(); setTimeout(() => { CO.level = Math.max(0, CO.level - (d.small ? 50 : 25)); CO.say = CO.level === 0 ? 'Last sip!' : SIPS[Math.floor(Math.random() * 3)]; if (CO.level === 0) CO.stage = 'empty'; redrawCoffee(); clearTimeout(window._coSay); window._coSay = setTimeout(() => { CO.say = ''; document.querySelector('.coffee-svg .say')?.remove(); }, 2200); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200); return; }
  if (a === 'another') { CO.stage = 'choose'; CO.level = 0; CO.say = ''; }
  redrawCoffee();
  clearTimeout(window._coSay); window._coSay = setTimeout(() => { CO.say = ''; document.querySelector('.coffee-svg .say')?.remove(); }, 2200);
}
function redrawCoffee() { if (st.view !== 'now' || st.room !== 'coffee') return; const el = $('.room-coffee'); if (el) { el.outerHTML = coffeeHTML(); $('.room-coffee [data-desk], .room-coffee .drink')?.focus({ preventScroll: true }); } }
function enterRoom(r) {
  if (!ROOMS[r]) return; st.aiRoom = null; st.deptRoom = null; st.room = r; store.set('room', r); if (r === 'meeting') liveInit();
  st.say = r === 'office' ? 'Back in my office.' : ''; const y = scrollY; renderNow(); scrollTo(0, y);
  if (HQ.inst && hqOn()) HQ.inst.focus(r === 'office' ? 'desk' : r === 'experts' ? 'f1' : r === 'lunch' ? 'coffee' : r);
  document.querySelector('.room-tab[aria-pressed="true"]')?.focus({ preventScroll: true });
}
function missionsHTML() {
  const live = defects.filter(d => /^Issue/i.test(d.status || ''));
  const human = roles.filter(r => r.register?.human).map(r => r.n);
  const busy = new Set([...live.flatMap(d => rolesFor(d.id)), ...human]);
  const idle = roles.filter(r => !busy.has(r.n)).length;
  const card = (key, tagc, tag, title, rs, note) => `<article class="mission${st.open === key ? ' open' : ''}"><button class="mission-head" type="button" data-mission="${key}" aria-expanded="${st.open === key}"><span><strong>${esc(title)}</strong><small>${note}</small></span><span class="ntag ${tagc}">${esc(tag)}</span></button>
    ${rs.length ? `<div class="avs">${rs.slice(0, 10).map(n => `<button class="av" type="button" data-role="${n}" title="#${n} ${esc(roleBy[n]?.title || '')}">${n}</button>`).join('')}${rs.length > 10 ? `<span class="av more">+${rs.length - 10}</span>` : ''}</div>` : ''}
    ${st.open === key ? `<ul class="list small">${rs.map(n => `<li><button class="linkbtn" type="button" data-role="${n}">#${n} ${esc(roleBy[n]?.title || '')}</button></li>`).join('') || '<li class="muted">No expert role is named for this in the register yet.</li>'}</ul>` : ''}</article>`;
  return `<h2 class="section">What the experts are working on</h2><p class="small muted">Grouped by the problem each role is on, from the latest review register. ${src(S.registerSource, 'Register')}</p>
    <div class="missions">${live.map(d => { const rs = rolesFor(d.id); return card(d.id, d.severity === 'P0' ? 'u' : 'y', d.severity === 'P0' ? 'Urgent' : 'Fix next', plainDefect(d), rs, rs.length ? plural(rs.length, 'expert') : 'no owner named'); }).join('')}
    ${card('human', 'a', 'Real person', 'Needs a teacher, lawyer, child or iPhone', human, plural(human.length, 'expert') + ' waiting')}
    <a class="mission idle" href="#hq"><span><strong>Not started on the reviewed build</strong><small>${idle} experts · waiting for the next review phase</small></span><span class="ntag">See all 116 →</span></a></div>`;
}
/* ------------------------------------------------------------ the office: the team queues at Hiba's desk */
const CH = window.WSChars;
/* Who brings each founder decision: the role responsible for that area (team assignment, by the roster's responsibilities). */
const BRINGS = { 'decision-3.1': 49, 'decision-3.2': 26, 'decision-3.3': 105, 'decision-3.4': 102, 'decision-3.5': 25, 'decision-3.6': 48, 'decision-3.7': 1, 'decision-3.8': 4 };
function visitorOf(x) {
  if (x.id === 'site-link') return { kind: 'ai', key: 'Hiba', name: 'Claude Hiba' };
  if (x.fromAI) return { kind: 'ai', key: x.fromAI, name: x.fromAI === 'ChatGPT' ? 'ChatGPT' : 'Claude ' + x.fromAI };
  const n = x.n || BRINGS[x.id] || x.bring || 101, r = roleBy[n];
  return { kind: 'role', n, name: `#${n} ${r ? r.title : ''}`, look: CH.look(n, r && r.dept) };
}
function figure(v, k) {
  const inner = v.kind === 'ai' ? CH.robot(v.key) : CH.person(v.look);
  return inner + '<rect x="6" y="76" width="15" height="19" rx="1" fill="#fff" stroke="#888780" stroke-width=".7" transform="rotate(10 13 85)"/><path d="M9 82h8M9 86h8M9 90h5" stroke="#B4B2A9" stroke-width="1" transform="rotate(10 13 85)"/>' +
    (k === 0 ? '<circle cx="66" cy="16" r="9" fill="#E24B4A"/><text x="66" y="20" font-size="12" text-anchor="middle" fill="#fff" font-family="sans-serif">!</text>' : '');
}
/* Hiba's rule, 24 Nov 2026: nobody comes to her office without a plain explanation. A question with none waits downstairs
   (listed as "held: no explanation") until its team writes one; a role she called herself always comes up. */
const hasExplain = id => { const p = S.decisions.pending.find(x => x.id === id) || {}; return !!EXPLAIN[id] || String(p.explain || '').replace(/\s+/g, ' ').trim().length >= 80; };
const heldHTML = () => { const h = heldNoExplain(); return h.length ? `<p class="small warnline">🚫 ${plural(h.length, 'question')} held downstairs: no explanation yet (${h.slice(0, 3).map(x => esc(x.title)).join('; ')}${h.length > 3 ? '…' : ''}). They come up once their team writes one.</p>` : ''; };
const heldNoExplain = () => nowItems().y.filter(x => x.dec && stateOf(x.id).k !== 'git' && !sent[x.id] && !hasExplain(x.id));
function officeQueue() {
  const base = nowItems().y.filter(x => stateOf(x.id).k !== 'git' && !sent[x.id] && !queuedFor(x.id) && !(x.dec && !hasExplain(x.id))), ids = base.map(x => x.id);
  const Q = store.get('queue', { order: [], end: [] });
  const order = [...Q.order.filter(id => ids.includes(id)), ...ids.filter(id => !Q.order.includes(id))];
  const end = Q.end.filter(id => ids.includes(id));
  const sorted = [...order.filter(id => !end.includes(id)), ...end];
  const called = (store.get('called', []) || []).map(n => roleBy[n] && { id: 'call-' + n, n, called: true, cls: 'y', tag: 'You called', title: `#${n} ${roleBy[n].title}`, sub: (roleBy[n].register && (roleBy[n].register.work || roleBy[n].register.findings)) || roleBy[n].responsibility || '' }).filter(Boolean);
  return [...called, ...sorted.map(id => base.find(x => x.id === id))];
}
function moveInQueue(how) {
  const q = officeQueue().map(x => x.id); if (q.length < 2 && how !== 'end') return;
  const Q = store.get('queue', { order: [], end: [] }), front = q[0];
  let end = Q.end.filter(id => q.includes(id)), order = q.slice();
  if (how === 'next') { order.splice(0, 2, order[1], order[0]); }
  if (how === 'back') { const rest = order.slice(1).filter(id => !end.includes(id)); order = [...rest, front, ...end.filter(id => id !== front)]; end = end.filter(id => id !== front); }
  if (how === 'end') { end = [...end.filter(id => id !== front), front]; order = [...order.slice(1).filter(id => !end.includes(id)), ...end]; }
  store.set('queue', { order, end });
}
const onBreak = () => store.get('break', null);
const BREAKS = { coffee: 'Coffee break', lunch: 'Lunch break', massage: 'Thai massage' };
const KEY_ICONS = {
  next: '<path d="M6 24h28" stroke="#5A3B06" stroke-width="2.5" stroke-linecap="round"/><path d="M9 23a11 11 0 0 1 22 0z" fill="#F2C14E" stroke="#5A3B06" stroke-width="2"/><circle cx="20" cy="10" r="2.4" fill="#5A3B06"/><path class="ding" d="M33 8l3-3M35 14h4M5 8L2 5M5 14H1" stroke="#5A3B06" stroke-width="2" stroke-linecap="round"/>',
  back: '<circle cx="20" cy="17" r="12" fill="#fff" stroke="#1F4C72" stroke-width="2.2"/><path d="M20 10v7l5 3" stroke="#1F4C72" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M5 32h22" stroke="#1F4C72" stroke-width="2.2" stroke-linecap="round"/><path d="M10 28l-5 4 5 4" stroke="#1F4C72" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  end: '<rect x="8" y="5" width="24" height="26" rx="2" fill="#FFE27A" stroke="#7A5A12" stroke-width="2" transform="rotate(-6 20 18)"/><path d="M13 13h13M13 18h13M13 23h8" stroke="#7A5A12" stroke-width="1.8" stroke-linecap="round" transform="rotate(-6 20 18)"/><circle cx="20" cy="6" r="3" fill="#E24B4A" stroke="#7A1F1F"/>',
  coffee: '<path class="steam" d="M15 4q-3 4 0 8M21 3q-3 4 0 8" stroke="#8A6D5A" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M8 14h20v10a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#fff" stroke="#5A3420" stroke-width="2"/><path d="M28 17h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#5A3420" stroke-width="2"/><path d="M10 18h16" stroke="#8A5A3B" stroke-width="3"/>',
  lunch: '<ellipse cx="20" cy="26" rx="16" ry="6" fill="#fff" stroke="#3B6D11" stroke-width="2"/><path d="M9 22q11-14 22 0" fill="#F5C98A" stroke="#8A5A1C" stroke-width="2"/><path d="M10 21q10 3 20 0" stroke="#639922" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="19" r="2" fill="#D85A30"/><circle cx="24" cy="19" r="2" fill="#D85A30"/>',
  wave: '<path d="M14 30 q-6 -10 -2 -18 l3 -5 q2 -3 4 0 l1 8 l2 -12 q2 -3 4 0 l0 12 l3 -9 q2 -3 4 0 l-1 13 q2 -3 4 -1 q1 2 -1 6 q-4 8 -10 10z" fill="#FCE3C8" stroke="#8A4A1C" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 10q-2 4 0 8M36 6q2 4 0 8" stroke="#8A4A1C" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
  brew: '', takecup: '', sip: '', another: '',
  massage: '<path d="M20 6c-5 6-5 12 0 18c5-6 5-12 0-18z" fill="#F4C0D1" stroke="#993556" stroke-width="1.8"/><path d="M20 24c-7-1-12-6-13-12c6 0 11 4 13 12zM20 24c7-1 12-6 13-12c-6 0-11 4-13 12z" fill="#FBEAF0" stroke="#993556" stroke-width="1.8"/><path d="M8 31h24" stroke="#7A5A12" stroke-width="2.2" stroke-linecap="round"/>',
  backbreak: '<circle cx="20" cy="18" r="13" fill="#fff" stroke="#215D45" stroke-width="2.2"/><path d="M13 18l5 5 9-10" stroke="#215D45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
};
const keycap = (id, label, cls, on = true) => `<button class="keycap k-${cls}" type="button" data-desk="${id}" ${on ? '' : 'disabled'} aria-label="${esc(label)}"><svg viewBox="0 0 40 38" width="34" height="32" aria-hidden="true">${KEY_ICONS[cls]}</svg><span>${esc(label)}</span></button>`;
const SAYS = { next: 'Next, please!', back: 'Not now, see you soon!', end: "Let's leave this to the end.", coffee: 'Coffee time!', lunch: 'Off to lunch!', massage: 'Massage time. Bye, stress!', 'back-from-break': "I'm back. Who's next?" };
const DEPT_PLAIN = { product: 'Product', technology: 'Technology', design: 'Design', accessibility: 'Accessibility', teaching: 'Teaching', 'marketing-and-support': 'Marketing and support',
  'privacy-lawyer': 'Privacy lawyer', 'child-safety-and-ai-ethics': 'Child safety', architect: 'Lead architect', specialists: 'Teaching specialist' };
const deptPlain = d => !d ? '' : /^review-/.test(d) ? 'Reviewer · ' + (DEPT_PLAIN[d.slice(7)] || '') : DEPT_PLAIN[d] || '';
const tagOf = v => v.kind === 'ai' ? 'AI · ' + v.name : `${deptPlain(roleBy[v.n]?.dept)} · #${v.n}`;
function whoIsWho() {
  const rows = [['product', 1], ['technology', 4], ['design', 6], ['teaching', 31], ['marketing-and-support', 41], ['privacy-lawyer', 49], ['architect', 101], ['specialists', 102], ['review-technology', 54]];
  return `<details class="whoiswho"><summary>Who's who: what each outfit means</summary><ul class="key">${rows.map(([d, n]) => `<li>${CH.svg(CH.person(CH.look(n, d)), 34)}<span><strong>${esc(deptPlain(d))}</strong><small>${esc(CH.look(n, d).label)}</small></span></li>`).join('')}
    ${WORKSPACES.map(w => `<li>${CH.svg(CH.robot(w.key), 34)}<span><strong>${esc(w.id)}</strong><small>AI workspace (robot)</small></span></li>`).join('')}
    <li>${CH.svg(CH.FOUNDER, 34)}<span><strong>You</strong><small>The founder, with your approval stamp</small></span></li></ul></details>`;
}
const STATIONS = {
  desk: { name: 'Your desk', label: 'Desk', pin: [222, 184], at: [268, 46] },
  board: { name: 'Whiteboard', label: 'Whiteboard', pin: [56, 52], at: [70, 80] },
  messages: { name: 'Message board', label: 'Messages', pin: [6, 80], at: [22, 74] },
  ai: { name: 'AI corner', label: 'AI corner', pin: [146, 20], at: [112, 58] },
  website: { name: 'Website screen', label: 'Website', pin: [298, 36], at: [302, 82] },
  coffee: { name: 'Coffee machine', label: 'Coffee', pin: [340, 146], at: [296, 104] },
  door: { name: 'Door to the Experts hall', label: 'Experts', pin: [344, 60], at: [318, 70] },
  meeting: { name: 'Meeting room', label: 'Meeting', pin: [96, 182], at: [150, 120] },
  urgent: { name: 'Urgent corner', label: '🔥 Urgent', pin: [262, 150], at: [236, 92] }
};
const WALK_ORDER = ['desk', 'urgent', 'board', 'messages', 'ai', 'meeting', 'website', 'coffee', 'door'];
function meSVG(me) {
  const [x, y] = STATIONS[me].at, [px, py] = STATIONS[st.mePrev || me].at;
  return `<g class="me${st.anim === 'wave' ? ' waving' : ''}" data-to="${x},${y}" style="transform:translate(${px}px,${py}px) scale(.82)">${CH.FOUNDER}${st.anim === 'wave' ? '<path class="hand" d="M70 66 q10 -14 6 -28" stroke="#F1C9AE" stroke-width="7" stroke-linecap="round" fill="none"/>' : ''}<rect x="18" y="-14" width="54" height="18" rx="9" fill="#FAECE7" stroke="#993C1D" stroke-width=".5"/><text x="45" y="0" font-size="12" text-anchor="middle" fill="#712B13" font-family="sans-serif">You</text></g>`;
}
function walkTo(k) {
  if (!STATIONS[k] || onBreak()) return;
  st.mePrev = st.me || 'desk'; st.me = k; store.set('me-at', k);
  st.say = k === 'desk' ? 'Back to work!' : k === 'coffee' ? 'Coffee time?' : k === 'door' ? 'Off to see the experts!' : k === 'ai' ? 'Hi robots!' : k === 'website' ? "Let's check the website." : k === 'messages' ? 'Any messages?' : k === 'urgent' ? 'What is urgent?' : 'Where are we?';
  st.anim = 'walk'; const y = scrollY; renderNow(); scrollTo(0, y);
  const g = document.querySelector('.me'); if (g) { const [x, yy] = g.dataset.to.split(','); requestAnimationFrame(() => requestAnimationFrame(() => { g.classList.add('walking'); g.style.transform = `translate(${x}px,${yy}px) scale(.82)`; setTimeout(() => g.classList.remove('walking'), 900); })); }
  st.mePrev = null;
  if (ROOM_OF[k]) setTimeout(() => { if (st.view === 'now' && st.me === k && (st.room || 'office') === 'office') enterRoom(ROOM_OF[k]); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 1100);
  clearTimeout(window._sayT); window._sayT = setTimeout(() => { st.say = ''; st.anim = ''; document.querySelector('.say')?.remove(); }, 2400);
  document.querySelector(`.walk-to [data-walk], .desk-panel [data-desk]`)?.focus({ preventScroll: true });
}
function stationObjects() {
  return `<g transform="translate(60 74) skewY(-25)"><rect width="46" height="32" rx="2" fill="#fff" stroke="#888780"/><path d="M5 24 L15 14 L25 20 L40 6" stroke="#185FA5" stroke-width="2" fill="none"/><rect x="5" y="26" width="6" height="3" fill="#E24B4A"/><rect x="14" y="26" width="6" height="3" fill="#D9A53A"/></g>
    <g transform="translate(16 96) skewY(-25)"><rect width="34" height="26" rx="2" fill="#E8C89A" stroke="#8A5A1C"/><rect x="4" y="4" width="10" height="8" fill="#FFE27A"/><rect x="18" y="6" width="11" height="9" fill="#B5D4F4"/><rect x="7" y="15" width="12" height="8" fill="#F4C0D1"/><circle cx="9" cy="5" r="1.5" fill="#E24B4A"/><circle cx="23" cy="7" r="1.5" fill="#E24B4A"/>${THREADS.length ? `<circle cx="32" cy="2" r="7" fill="#E24B4A"/><text x="32" y="5.5" font-size="9" text-anchor="middle" fill="#fff" font-family="sans-serif">${THREADS.length}</text>` : ''}</g>
    ${['Hiba', 'Onsi', 'ChatGPT'].map((k, i) => `<g transform="translate(${150 + i * 24} ${66 - i * 11}) scale(.32)">${CH.robot(k)}</g>`).join('')}
    <g class="site-screen${S.website && /awaiting/i.test(S.website.status) ? ' alert' : ''}" transform="translate(300 56) skewY(25)"><rect class="glow" x="-4" y="-4" width="58" height="40" rx="6" fill="#F2C14E" opacity="0"/><rect width="50" height="32" rx="3" fill="#1C4047" stroke="var(--line)"/><rect x="3" y="3" width="44" height="26" rx="2" fill="#F7F8F6"/><text x="25" y="14" font-size="8" text-anchor="middle" fill="#2A6F6A" font-family="sans-serif" font-weight="700">WhySteps</text><circle cx="25" cy="22" r="3.5" fill="${S.website && S.website.status === 'Published' ? '#2A9D74' : '#D9A53A'}"/></g>
    ${urgentSignSVG()}
    <g transform="translate(346 112)"><rect width="22" height="30" rx="3" fill="#5F5E5A"/><rect x="3" y="4" width="16" height="8" rx="1" fill="#85B7EB"/><rect x="6" y="18" width="10" height="9" rx="1" fill="#fff"/><path class="steam" d="M9 14 q-2 -3 0 -5 M13 14 q-2 -3 0 -5" stroke="#B4B2A9" fill="none"/></g>
    <g transform="translate(366 78) skewY(25)"><rect width="20" height="38" rx="1" fill="#8A5A1C" stroke="#5A3B06"/><circle cx="15" cy="20" r="1.8" fill="#F2C14E"/></g>`;
}
function stationPins(me) {
  return Object.entries(STATIONS).filter(([k]) => k !== me).map(([k, st0]) => { const w = Math.max(44, st0.label.length * 6.6 + 14);
    return `<g class="pin" data-walk="${k}" role="button" tabindex="0" aria-label="Walk to the ${esc(st0.name.toLowerCase())}" transform="translate(${Math.min(st0.pin[0], 398 - w)} ${st0.pin[1]})"><rect width="${w}" height="18" rx="9" fill="#fff" stroke="#2A6F6A" stroke-width="1.2"/><text x="${w / 2}" y="12.5" font-size="11" text-anchor="middle" fill="#1C4047" font-family="sans-serif" font-weight="700">${esc(st0.label)}</text></g>`; }).join('');
}
function stationPanel(me) {
  const w = S.website, N = nowItems();
  const back = `<div class="desk-controls walk-keys">${keycap('go-desk', 'Back to my desk', 'backbreak')}${keycap('wave', 'Wave hello', 'wave')}</div>`;
  const head = (t, sub) => `<h3>${esc(t)}</h3><p class="small muted" style="margin:0">${sub}</p>`;
  if (me === 'urgent') return back + urgentHTML();
  if (me === 'board') return back + head('Whiteboard', 'Walking into the whiteboard room…') + `<button class="primary" type="button" data-room="board">Go to the big whiteboard</button>`;
  if (me === 'messages') return back + head('Message board', `${plural(THREADS.length, 'thread')} on GitHub, read ${S.issues && S.issues.readAt ? fmt(S.issues.readAt) : 'never'}.`) +
    `<ul class="list small">${THREADS.slice(0, 4).map(t => `<li><button class="linkbtn" type="button" data-thread="${t.n}">#${t.n} ${esc(t.title)}</button><div class="meta"><span>To ${esc(t.to.join(', ') || 'not stated')}</span><span>${plural(t.comments.length, 'reply', 'replies')}</span></div></li>`).join('') || '<li class="muted">No threads yet.</li>'}</ul>
     <div class="row"><a class="primary" href="#messages">Open Team Messages</a><button class="ghost" type="button" data-compose="All three">Write a message</button></div>`;
  if (me === 'ai') return back + head('AI corner', 'Walking into the AI lab…') + `<button class="primary" type="button" data-room="ai">Go into the AI lab</button>`;
  if (me === 'website') return back + (w ? head('Website screen', esc(w.statusWhy || '')) + `<p><span class="pill ${w.status === 'Published' ? 'good' : /awaiting/i.test(w.status) ? 'bad' : ''}">${esc(w.status)}</span></p>${w.preview ? `<a class="primary" href="${esc(w.preview.url)}" target="_blank" rel="noopener">Open Latest WhySteps Website ${icon('ext')}</a>` : ''}<p class="small"><a href="#dashboard">What changed on the website →</a></p>` : head('Website screen', 'No website record.'));
  if (me === 'coffee') return back + head('Coffee machine', 'Walking into the coffee room…') + `<button class="primary" type="button" data-room="coffee">Go into the coffee room</button>`;
  if (me === 'meeting') return back + head('Meeting room', 'Walking into the meeting room…') + `<button class="primary" type="button" data-room="meeting">Go into the meeting room</button>`;
  if (me === 'door') return back + head('Door to the Experts hall', 'Walking into the Experts hall…') + `<button class="primary" type="button" data-room="experts">Go into the Experts hall</button>`;
  return '';
}
function officeHTML() {
  const brk = onBreak();
  const me = st.me || 'desk', away = me !== 'desk' && !brk;
  const q = officeQueue(), tray = Object.keys(sent).filter(id => stateOf(id).k !== 'git').length;
  const spots = [[178, 104], [122, 128], [66, 152], [10, 176]];
  const front = q[0], v = front && visitorOf(front);
  const people = q.slice(0, 4).map((x, k) => { const vv = visitorOf(x); const [px, py] = spots[k];
    const tag = k === 0 && !brk && !away ? `<g transform="translate(${px - 30} ${py - 26})"><rect width="${Math.max(90, tagOf(vv).length * 8.2)}" height="24" rx="12" fill="var(--ink)"/><text x="11" y="16.5" font-size="14.5" fill="var(--paper)" font-family="sans-serif" font-weight="600">${esc(tagOf(vv))}</text></g>` : '';
    return `<g class="visitor${k === 0 ? ' front' : ''}${k === 0 && st.anim ? ' hop' : ''}${k === q.length - 1 && st.anim === 'back' ? ' walkback' : ''}" transform="translate(${px} ${py}) scale(.8)" ${k === 0 ? 'tabindex="0" role="button" data-visit="front"' : ''} aria-label="${esc(vv.name)} brings: ${esc(x.title)}"><title>${esc(vv.name)}: ${esc(x.title)}</title>${figure(vv, k)}</g>${tag}`; }).reverse().join('');
  const opts = front ? (front.dec ? front.opts : []) : [];
  return `<section class="office-scene" aria-label="Your office">
    <div class="desk-panel" aria-live="polite">
      <div class="desk-head"><span class="small muted">${brk ? 'On a break' : away ? 'Walking around' : front ? `At your desk · ${plural(q.length, 'person', 'people')} waiting` : 'At your desk'}</span>${nowItems().u.length && me !== 'urgent' ? `<button class="urgent-pill" type="button" data-walk="urgent">🔥 ${nowItems().u.length} urgent · go to the corner</button>` : ''}${mailPill()}</div>
      ${away ? stationPanel(me) : brk
        ? `<div class="desk-controls compact" role="group" aria-label="Your desk controls"><span class="break-note"><strong>${esc(BREAKS[brk.kind])}</strong> since ${fmt(brk.since).split(', ').pop()} · the team waits</span>${keycap('back-from-break', "I'm back", 'backbreak')}</div><p class="small muted">Nobody comes to your desk during your break. Your papers keep their places in the line. This is only on this device; nothing is sent to GitHub.</p>`
        : `${front ? `<div class="asker"><span class="mini">${CH.svg(v.kind === 'ai' ? CH.robot(v.key) : CH.person(v.look), 44)}</span><div><p class="who-line"><strong>${esc(v.name)}</strong>${store.get('queue', { end: [] }).end.includes(front.id) ? '<span class="later">Left to the end</span>' : ''}<span>${esc(v.kind === 'ai' ? 'AI workspace' : deptPlain(roleBy[v.n]?.dept))}</span></p><p class="small muted" style="margin:2px 0 0">asks you to decide:</p></div></div>
        <h3 class="question">${esc(front.title)}</h3>
        ${front.dec ? `${explainBtn(front.id)}<div class="opts">${opts.map(o => `<button class="opt" type="button" data-quickdec="${esc(front.id)}" data-opt="${esc(o)}">${esc(cap(o))}</button>`).join('')}${front.id === 'site-link' ? '' : `<button class="opt angry" type="button" data-angry="${esc(front.id)}" title="Half a job, or no explanation: back to the office until it is done 100%">😡 Not done properly</button>`}</div><p class="small muted">${DB ? 'Your answer goes in your 📮 box; 🚀 Send all sends the box to GitHub at once.' : 'Stamping opens GitHub with your answer filled in 🚀 It is recorded once you press the green Submit.'} ${src(front.url, 'The full question')}</p>`
          : front.called ? `<p class="small">${esc(front.sub || '')}</p>${quickBox('call2-' + front.n, 'All three', `Question for #${front.n}`, '', `Ask #${front.n} anything`)}<button class="ghost" type="button" data-dismisscall="${front.n}">✓ Thanks, back to work</button>`
          : `<div class="row"><a class="primary" href="${esc(front.open)}" target="_blank" rel="noopener" data-sentdone="${esc(front.id)}">Open the website ${icon('ext')}</a></div><p class="small muted">${esc(front.sub || '')}</p>`}`
        : `<h3>Nobody is waiting at your desk</h3><p class="small muted">Every decision that is yours is either recorded on GitHub or waiting for you to press the green Submit there.</p>`}
        ${heldHTML()}<div class="desk-controls compact" role="group" aria-label="Your desk controls">${keycap('next', 'Next, please', 'next', q.length > 1) + keycap('back', 'Not now', 'back', q.length > 1) + keycap('end', 'Leave to the end', 'end', !!front) + keycap('coffee', 'Coffee break', 'coffee') + keycap('lunch', 'Lunch break', 'lunch') + keycap('massage', 'Thai massage', 'massage') + keycap('wave', 'Wave hello', 'wave')}</div>`}
      ${tray ? `<p class="small tray">${DB ? `${plural(tray, 'paper')} on your desk ${tray === 1 ? 'is' : 'are'} in your 📮 box. Press 🚀 Send all to send them to GitHub at once.` : `${plural(tray, 'paper')} on your desk went to GitHub and wait for you to press the green Submit there. They clear after the next refresh shows them recorded.`}</p>` : ''}
    </div>
    <svg viewBox="0 8 400 252" class="office-svg" role="img" aria-labelledby="officeT"><title id="officeT">Your office: ${q.length ? plural(q.length, 'person', 'people') + ' waiting at your desk' : 'nobody waiting'}</title>
      <polygon points="200,46 392,136 200,226 8,136" fill="var(--paper)" stroke="var(--line)"/>
      <polygon points="200,46 8,136 8,96 200,6" fill="var(--floor)" stroke="var(--line)"/>
      <polygon points="200,46 392,136 392,96 200,6" fill="var(--mint)" stroke="var(--line)"/>
      ${stationObjects()}
      ${brk ? `<g class="breaksign" transform="translate(36 108)"><path d="M20 -14 L59 -2 L98 -14" stroke="#7A5A12" stroke-width="1.5" fill="none"/><rect width="118" height="28" rx="8" fill="#F2C14E" stroke="#7A5A12" stroke-width="1.5"/><text x="59" y="19" font-size="13" text-anchor="middle" fill="#3A2A06" font-family="sans-serif" font-weight="600">${esc(BREAKS[brk.kind])}</text></g>` : ''}
      ${brk && brk.kind === 'coffee' ? '<g transform="translate(318 118)"><rect width="14" height="14" rx="3" fill="#fff" stroke="#888780"/><path d="M14 4 q5 0 5 4 t-5 4" fill="none" stroke="#888780"/><path d="M4 -3 q2 -3 0 -6 M9 -3 q2 -3 0 -6" stroke="#B4B2A9" fill="none"/></g>' : ''}
      ${brk && brk.kind === 'lunch' ? '<g transform="translate(300 124)"><ellipse cx="14" cy="8" rx="16" ry="6" fill="#fff" stroke="#888780"/><circle cx="9" cy="6" r="3" fill="#97C459"/><circle cx="17" cy="7" r="3" fill="#D85A30"/></g>' : ''}
      <g class="bell${st.anim === 'next' ? ' ring' : ''}" transform="translate(212 118)"><path d="M0 10h18" stroke="#5A3B06" stroke-width="2" stroke-linecap="round"/><path d="M2 9a7 7 0 0 1 14 0z" fill="#F2C14E" stroke="#5A3B06" stroke-width="1.5"/><circle cx="9" cy="1.5" r="1.6" fill="#5A3B06"/></g>
      ${away ? '' : meSVG(me)}
      <g><polygon points="238,118 300,149 268,165 206,134" fill="#2A6F6A"/><polygon points="206,134 268,165 268,181 206,150" fill="#1C4047"/><polygon points="268,165 300,149 300,165 268,181" fill="#163238"/>
        ${tray ? `<g transform="translate(246 128)"><rect width="16" height="11" rx="1" fill="#fff" stroke="#888780" stroke-width=".6" transform="rotate(26)"/><rect x="2" y="-3" width="16" height="11" rx="1" fill="#fff" stroke="#888780" stroke-width=".6" transform="rotate(26)"/><circle cx="24" cy="2" r="7" fill="#D9A53A"/><text x="24" y="5.5" font-size="9" text-anchor="middle" fill="#fff" font-family="sans-serif">${tray}</text></g>` : ''}</g>
      <g class="${brk || away ? 'paused' : ''}">${people}</g>
      ${away ? meSVG(me) : ''}
      ${mailboxSVG()}
      ${brk ? '' : stationPins(me)}
      ${st.say ? `<g class="say" transform="translate(${Math.max(4, Math.min(STATIONS[st.me || 'desk'].at[0] - 110, 396 - Math.max(118, st.say.length * 7.6)))} ${Math.max(10, STATIONS[st.me || 'desk'].at[1] - 30)})"><rect width="${Math.max(118, st.say.length * 7.6)}" height="28" rx="14" fill="#fff" stroke="#1C4047" stroke-width="1.5"/><path d="M${Math.max(118, st.say.length * 7.6) - 30} 27 l14 12 l-2 -12z" fill="#fff" stroke="#1C4047" stroke-width="1.5"/><text x="12" y="18.5" font-size="14" fill="#1C4047" font-family="sans-serif" font-weight="700">${esc(st.say)}</text></g>` : ''}
    </svg>
    ${brk ? '' : `<div class="walk-to" role="group" aria-label="Walk to"><span class="small muted">Walk to:</span>${WALK_ORDER.filter(k => k !== me).map(k => `<button class="chip walk" type="button" data-walk="${k}">${esc(STATIONS[k].name.replace('Door to the ', ''))}</button>`).join('')}</div>`}
    <div class="desk-more">${outboxBarHTML()}
      ${!brk && !away && q.length > 1 ? `<div><p class="small" style="margin:0 0 4px"><strong>Waiting in line (${q.length - 1})</strong></p><ol class="line">${q.slice(1).map(x => { const vv = visitorOf(x); return `<li><span class="mini sm">${CH.svg(vv.kind === 'ai' ? CH.robot(vv.key) : CH.person(vv.look), 26)}</span><span><strong>${esc(x.title)}${store.get('queue', { end: [] }).end.includes(x.id) ? ' <span class="later">left to the end</span>' : ''}</strong><small>${esc(vv.name)} · ${esc(vv.kind === 'ai' ? 'AI workspace' : deptPlain(roleBy[vv.n]?.dept))}</small></span></li>`; }).join('')}</ol></div>` : ''}
      ${front && !brk ? whoIsWho() : ''}</div>
  </section>`;
}
function renderNow() {
  const N = nowItems(), f = st.nowF;
  const list = f === 'u' ? N.u : f === 'y' ? N.y : N.a;
  const w = S.website;
  view.innerHTML = `<div class="band now">
    ${hqOn() ? '' : `<p class="eyebrow">Founder workspace · from GitHub ${fmt(S.generated.at)}</p>
    ${st.office && (st.room || 'office') === 'office' ? '' : outboxBarHTML()}
    <div class="row" style="justify-content:space-between;align-items:flex-end"><h1>${st.office ? 'Your office' : 'What needs doing next'}</h1><button class="ghost" type="button" id="officeToggle" aria-pressed="${st.office}">${st.office ? 'List view' : 'Office view'}</button></div>`}
    ${hqOn() ? hqHTML() : st.office ? roomNav() + ((st.room || 'office') === 'office' ? officeHTML() : st.room === 'ai' ? aiLabHTML() : st.room === 'experts' ? expertsHallHTML() : st.room === 'lunch' ? lunchHTML() : st.room === 'spa' ? spaHTML() : st.room === 'coffee' ? coffeeHTML() : st.room === 'meeting' ? meetingHTML() : whiteboardHTML()) : ''}
    ${todayHTML()}
    <div class="counters" role="group" aria-label="Show">
      <button type="button" class="ctr c-u" data-nowf="u" aria-pressed="${f === 'u'}"><b>${N.u.length}</b><span>Urgent problems</span></button>
      <button type="button" class="ctr c-y" data-nowf="y" aria-pressed="${f === 'y'}"><b>${N.y.length}</b><span>For you</span></button>
      <button type="button" class="ctr c-a" data-nowf="a" aria-pressed="${f === 'a'}"><b>${N.a.length}</b><span>Waiting on AI</span></button></div>
    <div class="nlist">${list.map(nowCard).join('') || '<div class="empty">Nothing in this list right now.</div>'}
      ${f === 'y' && N.rest > 0 ? `<a class="ncard n-more" href="#decisions"><h3>${N.rest} more rules and team choices wait for you</h3><p class="small muted">Teaching rules, new rules A–T and team decisions → Decisions</p></a>` : ''}</div>
    <div class="now-grid">
      <section class="panel"><h2>The 3 AI right now</h2><p class="small muted">From their last recorded work on GitHub. They act only when you open them and ask.</p>${WORKSPACES.map(aiNow).join('')}</section>
      ${w ? `<section class="panel site-mini"><h2>Customer website</h2><p><span class="pill ${w.status === 'Published' ? 'good' : /awaiting/i.test(w.status) ? 'bad' : ''}">${esc(w.status)}</span></p><p class="small muted">${esc(w.statusWhy || '')}</p>
        ${w.preview ? `<a class="primary wide" href="${esc(w.preview.url)}" target="_blank" rel="noopener">Open Latest WhySteps Website ${icon('ext')}</a>` : ''}<p class="small"><a href="#dashboard">Website details and project status →</a></p></section>` : ''}
    </div>
    ${missionsHTML()}
    ${celebrateHTML()}
  </div>`;
  if (hqOn()) mountHQ();
}

/* ------------------------------------------------------------ activity */
function renderActivity() {
  const kinds = { all: 'Everything', pr: 'Pull requests', issue: 'Team Messages (Issues)', main: 'Commits on main', coord: 'Coordination commits', msg: 'Handoff messages (COORDINATION.md)', chat: 'ChatGPT findings' };
  const kindOk = x => st.kind === 'all' || (st.kind === 'pr' && /^Pull request/.test(x.kind)) || (st.kind === 'main' && x.kind === 'Commit on main') ||
    (st.kind === 'coord' && x.kind === 'Coordination commit') || (st.kind === 'msg' && /^Message/.test(x.kind)) || (st.kind === 'issue' && /^Issue/.test(x.kind)) || (st.kind === 'chat' && x.actor === 'ChatGPT');
  const q = st.aq.trim().toLowerCase();
  const list = activity.filter(x => (st.actor === 'all' || x.actor === st.actor) && kindOk(x) && (!q || x.title.toLowerCase().includes(q)));
  let lastDay = '';
  const rows = list.slice(0, st.limit).map(x => {
    const d = dayKey(x.date); const head = d !== lastDay ? `</ul><p class="day">${esc(d)}</p><ul class="list feed">` : ''; lastDay = d;
    const tag = x.actor === 'Not stated' ? 'none' : x.actor;
    return `${head}<li><span class="who-tag t-${tag}">${esc({ 'Not stated': 'Not stated', ChatGPT: 'ChatGPT', Founder: 'Founder' }[x.actor] || 'Claude ' + x.actor)}</span><div>${esc(x.title)}<div class="meta"><span>${esc(x.kind)}</span>${x.date && x.date.length > 10 ? `<span>${fmt(x.date)}</span>` : ''}<span>${esc(x.source)}</span>${src(x.url)}</div></div></li>`;
  }).join('');
  view.innerHTML = `<div class="band"><h1>Activity: ${plural(list.length, 'recorded item')}</h1>
    <p class="lede">Pull requests, commits, coordination messages and recorded ChatGPT findings, newest first. Nothing here is generated: each line links to GitHub.</p>
    <div class="row"><div class="seg" role="group" aria-label="Who">${[['all', 'Everyone'], ...Object.entries(ACTORS)].map(([k, l]) => `<button type="button" data-actor="${k}" aria-pressed="${st.actor === k}">${l}</button>`).join('')}</div>
      <select id="kind" aria-label="Kind of record">${Object.entries(kinds).map(([k, l]) => `<option value="${k}" ${st.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <label class="search">${icon('search')}<input type="search" id="aq" placeholder="Search activity" value="${esc(st.aq)}" aria-label="Search activity"></label></div>
    ${list.length ? `<ul class="list feed">${rows}</ul>` : '<div class="empty section">No recorded activity matches.</div>'}
    ${list.length > st.limit ? `<p><button class="ghost" type="button" id="more">Show ${Math.min(120, list.length - st.limit)} more</button></p>` : ''}</div>`;
}

/* ------------------------------------------------------------ issues */
function renderIssues() {
  const sev = s => s === 'P0' ? 'bad' : s === 'P1' ? 'warn' : '';
  const ir = roles.filter(r => colourOf(r, 'verdict') === 'bad');
  view.innerHTML = `<div class="band"><h1>Issues: ${plural(defects.filter(d => /^Issue/i.test(d.status || '')).length, 'defect')} still present on ${esc(defects[0]?.build || 'the reviewed build')}</h1>
    <p class="lede">Defects are tracked in the review registers. GitHub Issues are used for Team Messages and decisions (see Messages).</p>
    <div class="scroll"><table class="stack"><thead><tr><th>ID</th><th>Defect</th><th>Severity</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
    ${defects.map(d => `<tr><td><strong>${esc(d.id)}</strong></td><td>${esc(d.title)}</td><td><span class="pill ${sev(d.severity) === 'warn' ? 'info' : sev(d.severity)}">${esc(d.severity || '—')}</span></td><td>${esc(d.status)}</td><td class="small">${esc(d.evidence)}</td></tr>`).join('')}
    </tbody></table></div><p class="small">${src(S.registerSource, 'Defects sheet, Phase A role register')}</p>
    <h2 class="section">${ir.length} roles with an issue found, and the recheck each owes</h2>
    <div class="scroll"><table class="stack"><thead><tr><th>Role</th><th>Hiba's decision</th><th>Findings</th><th>Recheck owed</th></tr></thead><tbody>
    ${ir.map(r => `<tr><td><button class="ghost" type="button" data-role="${r.n}">#${r.n} ${esc(r.title)}</button></td><td>${esc(r.register.hiba23)}</td><td class="small">${esc(r.register.findings)}</td><td class="small">${esc(r.register.recheck)}</td></tr>`).join('')}
    </tbody></table></div></div>`;
}

/* ------------------------------------------------------------ GitHub links, drafts */
const GH = 'https://github.com/' + S.repo;
const THREADS = (S.issues && S.issues.threads) || [];
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('wscc-' + k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('wscc-' + k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
const SECRET = /(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|sk-ant-|sk-[A-Za-z0-9]{20,}|password\s*[:=]|AKIA[0-9A-Z]{16})/i;
function body(m) {
  const to = m.to === 'All three' ? 'Claude Hiba, Claude Onsi, ChatGPT' : m.to;
  return ['<!-- whysteps-command-center/1 -->', `**To:** ${to}`, `**From:** ${m.from || 'Hiba (founder)'}`,
    m.project ? `**Project / feature:** ${m.project}` : '', m.roles ? `**Roles:** ${m.roles}` : '',
    m.decisionId ? `**Decision-ID:** ${m.decisionId}` : '', m.choice ? `**Choice:** ${m.choice}` : '',
    m.links ? `**Links:** ${m.links}` : '', '', m.text || ''].filter((x, i) => x !== '' || i === 8).join('\n');
}
/* Outbox: with the Artifact's db, answers are saved inside the Command Center (no GitHub page opens).
   A Claude chat session then posts them to GitHub (README, "Posting the outbox"). Never "Recorded" until GitHub has it. */
let DB = null, OUT = [];
const outKey = s => String(s).replace(/[^A-Za-z0-9_.~:@+-]/g, '-').slice(0, 120);
/* An answer Hiba takes back is marked 'withdrawn', never deleted (her rule). A newer answer than the one on GitHub stays in the box: the newest answer counts. */
const newerThanGit = o => { const g = o.ref && inGit(o.ref); return !g || String(o.at || '') > String(g.decidedAt || ''); };
const outWaiting = () => OUT.filter(o => o.status !== 'posted' && o.status !== 'withdrawn' && newerThanGit(o));
const queuedFor = id => outWaiting().find(o => o.key === outKey('dec-' + id));
async function outboxInit() {
  if (!(window.claude && window.claude.use)) return;
  try { DB = await window.claude.use('db'); } catch (e) { DB = null; }
  if (!DB) return;
  outboxChanged();
  try { DB.collection('outbox').orderBy('at', 'desc').limit(200).onSnapshot(s => { OUT = s.docs.map(d => Object.assign({}, d.data(), { key: d.id })); outboxChanged(); }, () => { }); } catch (e) { }
}
function outboxChanged() {
  const el = document.getElementById('outboxBar'); if (el) el.outerHTML = outboxBarHTML();
  const mb = document.getElementById('mailbox'); if (mb) mb.outerHTML = mailboxSVG();
  const mp = document.querySelector('.desk-head .mailpill'); if (mp) mp.outerHTML = mailPill();
  if (st.view === 'decisions') { const y = scrollY; renderDecisions(); scrollTo(0, y); }
  const td = document.querySelector('.today'); if (td) td.outerHTML = todayHTML() || '<span class="today" hidden></span>';
}
const OUTBOX_ASK = 'Please post my Command Center outbox to GitHub now (H2ONLB/whysteps, internal/command-center/README.md, "Posting the outbox"), then refresh my Command Center and tell me the links.';
/* Option 3 (Hiba, 23 Nov 2026): answers collect in the 📮 box with no popup; one 🚀 Send all opens GitHub once
   with all of them in one post, and Hiba presses Submit once. The snapshot splits the post back into its answers. */
/* A sent answer that GitHub still does not have after a later refresh did not arrive (for example the green Submit
   was not pressed): it comes back to the box as ready, marked ⚠️, so it is never silently lost. */
const notArrived = o => o.status === 'sent' && o.ref && !inGit(o.ref) && S.generated && String(o.sentAt || '') < String(S.generated.at || '');
const outReady = () => outWaiting().filter(o => o.status !== 'sent' || notArrived(o));
const outSent = () => outWaiting().filter(o => o.status === 'sent' && !notArrived(o));
/* The 📮 box stands next to Hiba's desk in the office: the flag goes up and a number shows when answers are ready. */
function mailboxSVG() {
  if (!DB) return '<g id="mailbox"></g>';
  const n = outReady().length;
  return `<g id="mailbox" class="mailbox${n ? ' full' : ''}" role="button" tabindex="0" data-openbox="1" aria-label="Your 📮 box: ${n ? plural(n, 'answer') + ' ready to send' : 'empty'}" transform="translate(316 132)">
    <rect x="9" y="16" width="5" height="34" fill="#5F5E5A"/><ellipse cx="11.5" cy="50" rx="10" ry="3" fill="rgba(0,0,0,.15)"/>
    <path d="M0 18v-8a11 11 0 0 1 22 0v8z" fill="#C2410C" stroke="#7A2A08" stroke-width="1.2"/><rect x="3" y="9" width="12" height="3" rx="1.5" fill="#7A2A08"/>
    <g class="flag"><rect x="21" y="${n ? -6 : 6}" width="2" height="14" fill="#5F5E5A"/><rect x="23" y="${n ? -6 : 6}" width="9" height="6" fill="#F2C14E"/></g>
    ${n ? `<g transform="translate(-10 -12)"><circle cx="8" cy="8" r="9" fill="#173B26"/><text x="8" y="12" font-size="11" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">${n}</text></g>` : ''}</g>`;
}
function mailPill() {
  if (!DB) return '<span class="mailpill" hidden></span>';
  const n = outReady().length;
  return n ? `<button class="mailpill full" type="button" data-sendall="1" aria-label="Send all ${plural(n, 'answer')} in your box to GitHub">📮 ${n} · 🚀 Send all</button>` : `<button class="mailpill" type="button" data-openbox="1" aria-label="Your 📮 box is empty">📮 0</button>`;
}
function outboxBarHTML() {
  if (!DB) return '<div id="outboxBar" hidden></div>';
  const r = outReady(), sn = outSent();
  if (!r.length && !sn.length) return '<div id="outboxBar" class="outbox empty" role="status"><span class="ob-ico" aria-hidden="true">📮</span><span class="small"><strong>Your box is empty.</strong> Answers you tap collect here; then 🚀 Send all.</span></div>';
  const li = o => `<li><div><strong>${esc(o.title || (o.issue ? 'Reply on #' + o.issue : 'Message'))}</strong><small>${notArrived(o) ? '⚠️ Sent ' + fmt(o.sentAt) + ', but GitHub does not have it: send it again' : o.status === 'sent' ? '🚀 Sent ' + fmt(o.sentAt) + ': waiting for GitHub (it leaves the box at the next refresh)' : esc(o.kind) + ' · ' + fmt(o.at)}</small></div><span class="ob-btns"><button class="ghost" type="button" data-outchange="${esc(o.key)}">${o.ref ? '✏️ Change my answer' : '↩ Take it out'}</button><button class="ghost" type="button" data-outpost="${esc(o.key)}">Post this one</button></span></li>`;
  return `<section id="outboxBar" class="outbox has" aria-label="Your 📮 box"><div class="ob-head"><span class="ob-ico" aria-hidden="true">📮</span><div class="ob-text"><strong>${r.length ? plural(r.length, 'answer') + ' ready to send' : 'All sent: nothing to do'}</strong><small>${r.length ? (r.some(notArrived) ? `⚠️ ${plural(r.filter(notArrived).length, 'answer')} did not reach GitHub last time. ` : '') + (nextBatch().length < r.length ? `They go in parts of about ${nextBatch().length} (one GitHub page each); press the green Submit on each page.` : 'One tap sends them all to GitHub together; then press the green Submit once.') : `${plural(sn.length, 'answer')} on the way to GitHub. They leave this box by themselves at the next refresh; you do not need to do anything.`}</small></div>
    ${r.length ? `<button class="primary rocket" type="button" data-sendall="1">🚀 ${nextBatch().length < r.length ? `Send the next ${nextBatch().length}` : 'Send all'}</button>` : ''}</div>
    <details><summary class="small">See what is in the box (${r.length + sn.length})</summary><ul class="ob-list">${[...r, ...sn].map(li).join('')}</ul></details></section>`;
}
function withReplyTo(b, n) { return n && !/\*\*Reply-to:\*\*/.test(b) ? b.replace('<!-- whysteps-command-center/1 -->', `<!-- whysteps-command-center/1 -->\n**Reply-to:** #${n}`) : b; }
/* Save to the 📮 box (no popup). Without a db (a plain page), open GitHub for this one answer as before. */
function sendOut(o, openGitHub) {
  if (!DB) return openGitHub();
  const key = outKey(o.key || (o.kind + '-' + Date.now().toString(36)));
  DB.collection('outbox').doc(key).set({ kind: o.kind, title: o.title || (o.issue ? 'Reply on #' + o.issue : ''), body: withReplyTo(o.body, o.issue), labels: withRecipients(o.labels, o.body), issue: o.issue || null, ref: o.key && o.key.startsWith('dec-') ? o.key.slice(4) : null, at: new Date().toISOString(), status: 'waiting', from: 'Hiba (founder)' })
    .then(() => toast('📮 In your box. Press 🚀 Send all when you are ready.'))
    .catch(e => { if (e && e.code === 'quota_exceeded') toast('The box is full: press 🚀 Send all first.'); else openGitHub(); });
}
/* Send all (fixed 24 Nov 2026): a GitHub link can only carry about 7,500 characters. Before, a longer box was
   "copied to paste" and GitHub opened with an empty post: 34 answers were lost that way (#109). Now the box is
   sent in parts that always fit: each press opens one full post, and the button says how many are left. */
function sendBatch(r) {
  const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date());
  const title = r.length === 1 ? (r[0].title || 'Answer from Hiba') : `[Batch] ${plural(r.length, 'answer')} from Hiba · ${when}`;
  const labels = [...new Set(['command-center', ...r.flatMap(o => (o.labels || '').split(',').filter(Boolean))])].join(',');
  const b = r.length === 1 && !r[0].issue ? r[0].body : ['<!-- whysteps-command-center/1 -->', '**From:** Hiba (founder)', '**To:** Claude Hiba, Claude Onsi, ChatGPT', '',
    `${plural(r.length, 'answer')} sent together from the Command Center 📮 (${when}). Each part below is its own answer; the Command Center reads them separately.`,
    ...r.map(o => '\n---\n\n' + withReplyTo(o.body, o.issue))].join('\n');
  return newIssueURL(title, b, labels);
}
const LINK_MAX = 7500;
function nextBatch() {
  const r = outReady(); let n = r.length;
  while (n > 1 && sendBatch(r.slice(0, n)).length >= LINK_MAX) n--;
  return r.slice(0, n);
}
function sendAll() {
  const r = outReady(); if (!r.length) return;
  const part = nextBatch(), url = sendBatch(part), left = r.length - part.length;
  if (url.length >= LINK_MAX) { const o = part[0]; copy(o.body, 'Your answer'); openGH(`${GH}/issues/new?title=${encodeURIComponent(o.title || 'Answer from Hiba')}`); toast('This one answer is very long: it was copied. In GitHub, paste it into the box, then press the green Submit.'); }
  else { openGH(url); toast(left ? `🚀 GitHub opened with ${plural(part.length, 'answer')}. Press the green Submit, then come back and press 🚀 Send the next ${left}.` : '🚀 GitHub opened with everything filled in. Press the green Submit once.'); }
  const at = new Date().toISOString();
  (async () => { for (const o of part) { try { await DB.collection('outbox').doc(o.key).update({ status: 'sent', sentAt: at }); } catch (e) { } } })();
}
function postMyself(key) {
  const o = OUT.find(x => x.key === key); if (!o) return;
  if (o.issue) { const t = THREADS.find(x => x.n === o.issue); copy(o.body, 'Answer').then(() => toast('🚀 Copied. GitHub opens: paste it in the comment box and press Comment.')); window.open((t ? t.url : `${GH}/issues/${o.issue}`) + '#new_comment_field', '_blank', 'noopener'); }
  else { openGH(newIssueURL(o.title, o.body, o.labels)); toast('🚀 GitHub opened with it filled in. Press the green Submit.'); }
  DB && DB.collection('outbox').doc(o.key).update({ status: 'sent', sentAt: new Date().toISOString() }).catch(() => { });
}
function stampFX(near) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = near.closest('.stamps, .desk-panel, .decq, .ncard') || document.body, el = document.createElement('div');
  el.className = 'stamp-fx'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = `<span>SIGNED</span><small>${DB ? '📮 into your box' : '🚀 off to GitHub'}</small>`;
  host.style.position = host.style.position || 'relative'; host.append(el); setTimeout(() => el.remove(), 1100);
}
const openGH = url => { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove(); };
/* Recipient labels (bridge pilot, Issue #87): to-claude-hiba, to-claude-onsi, to-chatgpt, read from the **To:** lines, so each assistant can be woken only for its own messages. */
const RECIPIENT_LABEL = { 'Claude Hiba': 'to-claude-hiba', 'Claude Onsi': 'to-claude-onsi', 'ChatGPT': 'to-chatgpt' };
function withRecipients(labels, b) {
  const to = [...String(b || '').matchAll(/^\*\*To:\*\*(.*)$/gm)].map(m => m[1]).join(' ');
  const add = Object.entries(RECIPIENT_LABEL).filter(([k]) => to.includes(k) || /all three/i.test(to)).map(([, v]) => v);
  return [...new Set([...String(labels || '').split(',').filter(Boolean), ...add])].join(',');
}
const newIssueURL = (title, b, labels) => `${GH}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(b)}&labels=${encodeURIComponent(withRecipients(labels, b))}`;

/* ------------------------------------------------------------ decisions */
let recorded = (S.decisions && S.decisions.recorded) || [];
const inGit = id => recorded.filter(e => e.id === id).slice(-1)[0];
const pendingList = () => [
  ...S.decisions.pending,
  ...(S.coordination.openDecisions || []).map(o => ({ id: 'open-' + o.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40), group: 'Open decisions listed in COORDINATION.md', kind: 'Open decision', title: o.text[0].toUpperCase() + o.text.slice(1), options: [], url: o.url }))
];
const drafts = store.get('decision-drafts', {});
const sent = store.get('sent-to-github', {});
function stateOf(id) { const g = inGit(id), q = queuedFor(id); if (q && newerThanGit(q)) return { k: 'queued', rec: q }; if (g) return { k: 'git', rec: g }; if (drafts[id] && (drafts[id].choice || drafts[id].comment)) return { k: 'draft', rec: drafts[id] }; return { k: 'none' }; }
function pendingCount() { return pendingList().filter(p => stateOf(p.id).k !== 'git').length; }
function stateHTML(id) {
  const s = stateOf(id);
  if (s.k === 'git') return `<div class="state git"><strong>Recorded in GitHub</strong>, Issue #${s.rec.issue}: ${esc(s.rec.choice)} (${fmt(s.rec.decidedAt)}, GitHub author ${esc(s.rec.githubAuthor)}${s.rec.statedBy ? ', from ' + esc(s.rec.statedBy) : ''}) ${src(s.rec.url, 'Open')}</div>`;
  if (s.k === 'queued') return `<div class="state queued"><strong>${s.rec.status === 'sent' ? '🚀 Sent to GitHub in your box: it counts once you pressed the green Submit.' : '📮 In your box, ready for 🚀 Send all.'}</strong> It shows as Recorded once it is on GitHub and the Command Center is refreshed. <button class="ghost" type="button" data-outchange="${esc(s.rec.key)}">✏️ Change my answer</button></div>`;
  if (s.k === 'draft') return `<div class="state local"><strong>Draft, not recorded.</strong> Saved on this device only. It counts once it is posted on GitHub and the Command Center is refreshed.</div>`;
  return `<div class="state">No answer recorded in GitHub yet.</div>`;
}
function decisionCard(p) {
  const opts = p.options && p.options.length ? [...p.options, 'Not yet'] : p.kind === 'Open decision' ? [] : ['Approve', 'Change it (say how below)', 'Not yet'];
  const dr = drafts[p.id] || {};
  return `<article class="card decision" data-dec="${esc(p.id)}">
    <div class="row" style="justify-content:space-between"><span class="pill">${esc(p.kind)}</span>${src(p.url)}</div>
    <h3>${esc(p.title)}</h3>
    ${explainBtn(p.id)}${opts.length ? `<div class="opts" role="group" aria-label="Your answer">${opts.map(o => `<button class="opt" type="button" data-opt="${esc(o)}" aria-pressed="${dr.multi ? (dr.choice || '').split(' + ').includes(o) : dr.choice === o}">${esc(o)}</button>`).join('')}</div>${opts.filter(o => !/^not yet$/i.test(o) && !/^change it/i.test(o)).length >= 2 ? `<button class="chip multi" type="button" data-cardmulti aria-pressed="${!!dr.multi}">${dr.multi ? '☑ Several answers: on' : '☑ More than one answer applies'}</button>` : ''}` : ''}
    <label class="small muted">Comment${opts.length ? ' (optional)' : ''}<textarea data-comment placeholder="${opts.length ? 'Anything the team should know' : 'Your decision, in your words'}">${esc(dr.comment || '')}</textarea></label>
    <div class="row"><button class="primary" type="button" data-record>Record decision on GitHub</button><button class="ghost" type="button" data-askclaude>${icon('copy')}Ask Claude to record</button></div>
    <div id="st-${esc(p.id)}">${stateHTML(p.id)}</div></article>`;
}
function decisionMessage(p, d) {
  return { title: `[Decision] ${p.title}`, labels: 'decision,command-center',
    body: body({ to: 'All three', project: p.group, decisionId: p.id, choice: d.choice || 'Answer in comment', links: p.url, text: (d.comment || '').trim() }) };
}
function renderDecisions() {
  const all = pendingList();
  const groups = {};
  all.filter(p => st.dtab === 'waiting' ? stateOf(p.id).k !== 'git' : false).forEach(p => (groups[p.kind] = groups[p.kind] || []).push(p));
  const approved = [...S.decisions.approved.map(a => ({ ...a, where: 'Review brief v2' })), ...recorded.map(e => ({ title: (all.find(p => p.id === e.id) || {}).title || e.id, text: `${e.choice}${e.comment ? ' · ' + e.comment : ''}`, date: e.decidedAt, by: e.statedBy || e.githubAuthor, url: e.url, where: 'GitHub Issue #' + e.issue }))];
  view.innerHTML = `<div class="band"><h1>Decisions: ${pendingCount()} waiting for Hiba</h1>${outboxBarHTML()}
    <p class="lede">Only items recorded in GitHub are listed, and nothing counts as decided until your answer is on GitHub. Founder decisions are kept apart from #101's technical readiness, which is advisory.</p>
    <div class="callout teal"><h3>How recording works</h3>
      <p class="small"><strong>Record decision on GitHub</strong> opens a GitHub Issue already filled in with your answer; it is recorded when you press <em>Submit</em> there. <strong>Ask Claude to record</strong> copies a request you paste into a Claude chat, which posts it for you. This page cannot write to GitHub itself, so it never says “recorded” until a refreshed snapshot shows the Issue.</p></div>
    <div class="seg" role="group" aria-label="Show">${[['waiting', `Waiting (${pendingCount()})`], ['approved', `Decided, on record (${approved.length})`]].map(([k, l]) => `<button type="button" data-dtab="${k}" aria-pressed="${st.dtab === k}">${l}</button>`).join('')}</div>
    ${st.dtab === 'approved' ? `<ul class="list section">${approved.map(a => `<li><span class="pill good">Decided</span> <strong>${esc(a.title)}</strong><div>${esc(a.text)}</div><div class="meta"><span>${esc(a.by)}, ${fmt(a.date)}</span><span>${esc(a.where)}</span>${src(a.url)}</div></li>`).join('')}</ul>` :
      Object.keys(groups).length ? Object.entries(groups).map(([k, ps]) => `<div class="dgroup"><h2>${esc(k)} <span class="muted small">(${ps.length})</span></h2><p class="small muted">${esc(ps[0].group)}</p><div class="grid">${ps.map(decisionCard).join('')}</div></div>`).join('') : `<div class="empty section">Nothing waiting.</div>`}
  </div>`;
}
/* ✏️ Change my answer (Hiba, 24 Nov 2026): the old answer is marked 'withdrawn' in the box (kept, never deleted),
   the question comes back to her desk, and its explanation opens so she can pick again. */
function changeAnswer(key) {
  const o = OUT.find(x => x.key === key); if (!o || !DB) return;
  const was = o.status;
  DB.collection('outbox').doc(key).update({ status: 'withdrawn', withdrawnAt: new Date().toISOString() }).then(() => {
    if (o.ref) { delete sent[o.ref]; store.set('sent-to-github', sent); if (drafts[o.ref]) { delete drafts[o.ref].choice; store.set('decision-drafts', drafts); } }
    closeSheet();
    toast(o.ref ? (was === 'sent' ? '✏️ Taken back. If you already pressed Submit on GitHub, your new answer replaces it: the newest answer counts.' : '✏️ Taken out of your box. Pick your new answer.') : '↩ Taken out of your box.');
    if (o.ref && (S.decisions.pending.some(p => p.id === o.ref) || pendingList().some(p => p.id === o.ref))) setTimeout(() => explainSheet(o.ref), 80);
  }).catch(() => toast('Could not change it just now. Try again in a moment.'));
}
function saveDraft(id, patch) { drafts[id] = { ...(drafts[id] || {}), ...patch, savedAt: new Date().toISOString() }; store.set('decision-drafts', drafts); const s = document.getElementById('st-' + id); if (s) s.innerHTML = stateHTML(id); }

/* ------------------------------------------------------------ team messages */
const WORKSPACES = [
  { id: 'Claude Hiba', key: 'Hiba', role: 'Main viewing and control account. Owns this Command Center Artifact.' },
  { id: 'Claude Onsi', key: 'Onsi', role: 'Builds and tests the Command Center; second Claude account.' },
  { id: 'ChatGPT', key: 'ChatGPT', role: 'Reviews the repository and reads or writes messages with its GitHub tools when asked in a ChatGPT session.' }];
function capabilities(w) {
  const prs = S.pullRequests.filter(p => p.account === w.key);
  const posted = THREADS.filter(t => (t.from || '').includes(w.id)).length + THREADS.reduce((n, t) => n + t.comments.filter(c => (c.from || '').includes(w.id)).length, 0);
  const proven = w.key === 'Onsi' ? THREADS.find(t => /connection test/i.test(t.title) && (t.from || '').includes('Claude Onsi')) : null;
  return [
    { k: 'Reads GitHub', v: w.key === 'ChatGPT' ? `When asked in a ChatGPT session (${prs.length} pull request${prs.length === 1 ? '' : 's'} on record from chatgpt/ branches)` : 'Yes, in a Claude chat with GitHub connected (COORDINATION.md)' },
    { k: 'Posts messages', v: proven ? `Proven: Issue #${proven.n} and its reply were posted from Claude chat` : posted ? `${posted} message(s) on record` : 'Not yet shown by a record. Run the connection test, then post to the test thread.' },
    { k: 'Live chat', v: 'No. It reads messages only when someone opens it and asks.' }];
}
function workspaceCards() {
  return WORKSPACES.map(w => {
    const s = actorSummary(w.key);
    const own = S.comms && S.comms.ownership[w.id];
    const inbox = THREADS.filter(t => t.to.includes(w.id)).length;
    return `<div class="card ws ws-${w.key}"><h3>${esc(w.id)}</h3><p class="small">${esc(own ? cap(own.text) : w.role)} ${own ? src(own.url) : ''}</p>
      <dl class="kv">${capabilities(w).map(c => `<dt>${esc(c.k)}</dt><dd>${esc(c.v)}</dd>`).join('')}</dl>
      <div class="stats"><div><b>${inbox}</b><span>threads addressed to it</span></div><div><b>${s.prs.length}</b><span>pull requests</span></div><div><b>${s.items.length}</b><span>records</span></div></div>
      <div class="row"><button class="ghost" type="button" data-inbox="${esc(w.id)}">Messages for ${esc(w.id)}</button><button class="ghost" type="button" data-compose="${esc(w.id)}">Write to ${esc(w.id)}</button></div></div>`;
  }).join('');
}
const msgDraft = store.get('message-draft', { to: 'All three', from: 'Hiba (founder)', subject: '', project: '', roles: '', links: '', text: '', thread: '' });
let lastTest = store.get('connection-test', null);
function threadRow(t) {
  const last = [t, ...t.comments].slice(-1)[0];
  return `<li><button class="thread" type="button" data-thread="${t.n}"><strong>#${t.n} ${esc(t.title)}</strong>
    <span class="meta"><span>To: ${t.to.length ? t.to.map(esc).join(', ') : 'not stated'}</span><span>From: ${esc(t.from || 'not stated')} (GitHub: ${esc(t.author)})</span><span>${plural(t.comments.length, 'reply', 'replies')}</span><span>Last: ${fmt(last.createdAt)}</span><span class="pill ${t.state === 'open' ? 'info' : ''}">${esc(t.state)}</span></span></button></li>`;
}
function threadDrawer(n) {
  const t = THREADS.find(x => x.n === n); if (!t) return;
  const post = (x, first) => `<article class="post"><div class="meta"><strong>${esc(x.from || 'Sender not stated')}</strong><span>GitHub author: ${esc(x.author)}</span><span>${first ? 'Posted' : 'Replied'} ${fmt(x.createdAt)}</span>${src(x.url, 'GitHub')}</div><div class="post-text">${esc(x.text || '(no text)')}</div></article>`;
  openSheet(`<p class="muted small">Team Messages · GitHub Issue #${t.n} · ${esc(t.state)}</p><h2 id="sheetTitle">${esc(t.title)}</h2>
    <div class="row"><span class="small muted">To:</span>${t.to.map(r => `<span class="pill">${esc(r)}</span>`).join('') || '<span class="small">not stated</span>'}</div>
    ${t.project ? `<p class="small"><strong>Project / feature:</strong> ${esc(t.project)}</p>` : ''}
    ${t.roles.length ? `<p class="small muted">Expert roles linked to this thread (and their reviewer pairs)</p><div class="row">${chips([...new Set(t.roles.flatMap(n => [n, roleBy[n]?.pair].filter(Boolean)))].sort((a, b) => a - b))}</div>` : ''}
    ${post(t, true)}${t.comments.map(c => post(c, false)).join('')}
    <p class="small muted">As read from GitHub ${fmt(S.issues.readAt)}. Newer replies appear after the next refresh.</p>
    <div class="row"><a class="primary" href="${esc(t.url)}#new_comment_field" target="_blank" rel="noopener">Reply on GitHub</a><button class="ghost" type="button" data-replyhere="${t.n}">Write a reply here</button></div>`);
}
function composeHTML() {
  const d = msgDraft, rs = ['Claude Hiba', 'Claude Onsi', 'ChatGPT', 'All three'];
  const roleNums = (d.roles.match(/\d+/g) || []).map(Number);
  const badRoles = roleNums.filter(n => n < 1 || n > 116);
  const secret = SECRET.test(d.text + d.subject + d.links);
  return `<form class="card compose" id="compose" novalidate>
    <h2>Write a message</h2>
    <fieldset class="seg-field"><legend class="small muted">To</legend><div class="seg" role="radiogroup">${rs.map(r => `<button type="button" role="radio" data-to="${r}" aria-checked="${d.to === r}" aria-pressed="${d.to === r}">${r}</button>`).join('')}</div></fieldset>
    <label>Reply to<select id="m-thread"><option value="">A new thread</option>${THREADS.map(t => `<option value="${t.n}" ${String(d.thread) === String(t.n) ? 'selected' : ''}>#${t.n} ${esc(t.title.slice(0, 60))}</option>`).join('')}</select></label>
    ${d.thread ? '' : `<label>Subject<input id="m-subject" value="${esc(d.subject)}" autocomplete="off"></label>`}
    <label>Project or feature<input id="m-project" value="${esc(d.project)}" placeholder="For example: Grade 1 tens-and-ones pilot" autocomplete="off"></label>
    <label>Expert roles (optional)<input id="m-roles" value="${esc(d.roles)}" placeholder="For example: #15, #19, #109" inputmode="numeric" autocomplete="off"></label>
    ${badRoles.length ? `<p class="error">Role numbers go from 1 to 116: ${badRoles.join(', ')} is not a role.</p>` : roleNums.length ? `<div class="row">${chips(roleNums)}</div>` : ''}
    <label>Links (optional)<input id="m-links" value="${esc(d.links)}" placeholder="PR, commit or evidence links" autocomplete="off"></label>
    <label>Message<textarea id="m-text" rows="5">${esc(d.text)}</textarea></label>
    ${secret ? '<p class="error">This looks like a password or key. Never put passwords, keys or children\'s material in GitHub.</p>' : '<p class="small muted">Never include children\'s school material, personal records, passwords or keys.</p>'}
    <div class="state local"><strong>Draft, not posted.</strong> Saved on this device only.</div>
    <div class="row"><button class="primary" type="button" id="m-github" ${secret || badRoles.length ? 'disabled' : ''}>Post on GitHub</button><button class="ghost" type="button" id="m-claude" ${secret || badRoles.length ? 'disabled' : ''}>${icon('copy')}Ask Claude to post</button><button class="ghost" type="button" id="m-copy">${icon('copy')}Copy message</button><button class="ghost" type="button" id="m-clear">Clear</button></div>
    <p class="small muted">Post on GitHub opens GitHub with your message filled in; it is posted when you press the green Submit there. A message does not wake any account: Claude Hiba, Claude Onsi or ChatGPT reads it when you open that account and ask.</p></form>`;
}
function renderMessages() {
  const f = st.inbox || 'all';
  const list = THREADS.filter(t => f === 'all' || t.to.includes(f));
  const read = S.issues || {};
  view.innerHTML = `<div class="band"><h1>Team Messages: ${plural(THREADS.length, 'thread')} on GitHub</h1>
    <div class="callout"><strong>${esc(S.comms?.boundary?.text?.split('. ')[0] || 'A GitHub issue is not a live AI chat')}.</strong> Messages are GitHub Issues and comments. Replies appear only after an account is opened and asked to read and answer. ${src(S.comms?.boundary?.url, 'Instructions')}
      <p class="small">${read.read ? `Last refreshed from GitHub: <strong>${fmt(read.readAt)}</strong> (a real read by Claude; not live).` : `<strong>GitHub Issues could not be read</strong> when this snapshot was built: ${esc(read.error || 'unknown error')}.`} <button class="ghost" type="button" data-refresh>Refresh now</button></p></div>
    <h2>Three AI workspaces</h2><div class="who">${workspaceCards()}</div>
    <div class="msg-grid section">
      <div><h2>Threads</h2>
        <div class="seg" role="group" aria-label="Show threads for">${[['all', 'Everyone'], ...WORKSPACES.map(w => [w.id, w.id])].map(([k, l]) => `<button type="button" data-inbox="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
        ${list.length ? `<ul class="list section">${list.map(threadRow).join('')}</ul>` : '<div class="empty section">No threads for this recipient on GitHub yet.</div>'}
      </div>
      <div id="composeWrap">${composeHTML()}</div>
    </div>
    <h2 class="section">Connection test</h2>
    <div class="card"><p>Checks, from this page in your browser, whether it can reach GitHub directly. It reads one harmless Issue (the test thread). It never uses a password or key.</p>
      <div class="row"><button class="primary" type="button" id="runTest">Run connection test</button>${THREADS.find(t => /connection test/i.test(t.title)) ? `<a class="ghost" href="${esc(THREADS.find(t => /connection test/i.test(t.title)).url)}" target="_blank" rel="noopener">Open the test thread</a>` : ''}</div>
      <div id="testOut">${testHTML()}</div></div>
  </div>`;
}
function testHTML() {
  if (!lastTest) return '<p class="small muted">Not run on this device yet.</p>';
  return `<ul class="list small section">${lastTest.steps.map(x => `<li><span class="pill ${x.ok ? 'good' : 'bad'}">${x.ok ? 'Works' : 'Does not work'}</span> <strong>${esc(x.name)}</strong>: ${esc(x.detail)}</li>`).join('')}</ul>
    <p class="small">Run ${fmt(lastTest.at)} in this browser (${esc(lastTest.where)}). <strong>${lastTest.steps.some(x => x.ok && x.read) ? 'This page can read GitHub directly.' : 'This page cannot reach GitHub directly; use Post on GitHub or Ask Claude to post.'}</strong></p>
    <button class="ghost" type="button" id="copyTest">${icon('copy')}Copy result for the test thread</button>`;
}
async function runTest() {
  const out = $('#testOut'); out.innerHTML = '<p class="small">Testing…</p>';
  const steps = [], where = window.claude && window.claude.use ? 'with the Artifact capability bridge' : 'without an Artifact capability bridge (a plain page, or an Artifact that declares no capabilities)';
  if (window.claude && window.claude.use) {
    let mcp = null; try { mcp = await window.claude.use('mcp'); } catch (e) { mcp = null; }
    steps.push({ name: 'GitHub through a claude.ai connector', ok: !!mcp, detail: mcp ? 'A connector bridge is available to this page.' : 'No connector is available to this page (none is declared; claude.ai offers no GitHub connector to declare).' });
  } else steps.push({ name: 'GitHub through a claude.ai connector', ok: false, detail: 'This page has no connector bridge (it declares no capabilities, and claude.ai offers no GitHub connector to declare).' });
  const t = THREADS.find(x => /connection test/i.test(x.title));
  const url = `https://api.github.com/repos/${S.repo}/issues/${t ? t.n : 1}`;
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store', credentials: 'omit' }); clearTimeout(timer);
    const j = r.ok ? await r.json().catch(() => null) : null;
    const read = !!(j && j.number);
    steps.push({ name: 'Read the test Issue from api.github.com', ok: read, read, detail: read ? `Read Issue #${j.number} (${j.comments} comments).` : `GitHub answered ${r.status}${r.status === 404 ? ': the repository is private, and this page has no permission to read it' : ''}.` });
  } catch (e) {
    steps.push({ name: 'Read the test Issue from api.github.com', ok: false, detail: e.name === 'AbortError' ? 'No answer within 8 seconds.' : 'Blocked before it reached GitHub (the Artifact page may only load its own files).' });
  }
  steps.push({ name: 'Write to GitHub from this page', ok: false, detail: 'Not attempted: writing needs a permission-controlled connector, and no key may be put in a page.' });
  lastTest = { at: new Date().toISOString(), where, steps }; store.set('connection-test', lastTest);
  out.innerHTML = testHTML();
}
function testReport() {
  return lastTest ? `<!-- whysteps-command-center/1 -->\n**From:** Claude Hiba account (Command Center connection test)\n\nConnection test run ${lastTest.at} ${lastTest.where}:\n` + lastTest.steps.map(x => `- ${x.ok ? 'Works' : 'Does not work'}: ${x.name}. ${x.detail}`).join('\n') : '';
}
function readCompose() {
  const v = id => ($('#' + id) || {}).value;
  Object.assign(msgDraft, { subject: v('m-subject') ?? msgDraft.subject, project: v('m-project') ?? '', roles: v('m-roles') ?? '', links: v('m-links') ?? '', text: v('m-text') ?? '', thread: v('m-thread') ?? '' });
  store.set('message-draft', msgDraft);
}
function messageOut() {
  const d = msgDraft, b = body(d);
  const t = d.thread && THREADS.find(x => String(x.n) === String(d.thread));
  return { b, t, title: d.subject || (d.project ? 'Message: ' + d.project : 'Message from the Command Center') };
}

/* ------------------------------------------------------------ evidence */
function renderEvidence() {
  const groups = {}; (S.evidence || []).forEach(f => (groups[f.folder] = groups[f.folder] || []).push(f));
  const k = { image: 'Screenshot', register: 'Register (spreadsheet)', report: 'Report', data: 'Data or script' };
  view.innerHTML = `<div class="band"><h1>Evidence: ${plural((S.evidence || []).length, 'recorded file')}</h1>
    <p class="lede">Review reports, registers and screenshots saved on the coordination branch. Each opens on GitHub (you need to be signed in to GitHub, because the repo is private).</p>
    ${Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([g, fs]) => `<div class="card section"><h2>${esc(g)}</h2><ul class="list">${fs.map(f => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a> <span class="pill">${k[f.kind]}</span></li>`).join('')}</ul></div>`).join('')}
    <h2 class="section">Recorded ChatGPT findings</h2><div class="card"><ul class="list">${(S.chatgpt || []).map(c => `<li>${esc(c.text)}<div class="meta"><span>${esc(c.heading || '')}</span><span>${esc(c.file)}:${c.line}</span>${src(c.url)}</div></li>`).join('')}</ul></div></div>`;
}

/* ------------------------------------------------------------ compact secondary navigation */
function renderMore() {
  view.innerHTML = `<div class="band"><h1>More project tools</h1>
    <p class="lede">Detailed records, when you need them. Your everyday tools (Now, Experts, Messages and Decisions) stay in the main menu.</p>
    <div class="grid more-tools" role="navigation" aria-label="Additional sections">
      <a class="card more-tool" href="#dashboard"><h2>Project status</h2><p>Website details, P0 count, review phases, coverage, workspaces and progress log.</p><span>View status →</span></a>
      <a class="card more-tool" href="#issues"><h2>Issues</h2><p>Open defects, educational risks and the reviewer checks owed.</p><span>View issues →</span></a>
      <a class="card more-tool" href="#activity"><h2>Activity</h2><p>Changes from both Claude accounts, ChatGPT findings and GitHub history.</p><span>View activity →</span></a>
      <a class="card more-tool" href="#evidence"><h2>Evidence</h2><p>Recorded review documents, screenshots, registers and source links.</p><span>View evidence →</span></a>
    </div></div>`;
}

/* ------------------------------------------------------------ sheet, toast, copy */
let lastFocus = null;
function openSheet(html) { lastFocus = document.activeElement; $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; $('.sheet-panel').scrollTop = 0; $('.sheet-panel .close').focus(); }
function closeSheet() { $('#sheet').hidden = true; document.querySelectorAll('.desk.me,.desk.pair').forEach(x => x.classList.remove('me', 'pair')); lastFocus?.focus?.(); }
let tt; function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => el.hidden = true, 3200); }
async function copy(text, what) {
  try { await navigator.clipboard.writeText(text); toast(what + (what.endsWith(' was') ? ' copied. Now paste it into a Claude chat in the WhySteps project.' : ' copied. Paste it into a Claude chat.')); }
  catch (e) { openSheet(`<h2 id="sheetTitle">Copy this into a Claude chat</h2><p class="small muted">Your browser did not allow copying. Select the text and copy it.</p><pre tabindex="0">${esc(text)}</pre>`); }
}
const REFRESH = `Please refresh my WhySteps Command Center from GitHub (internal/command-center/README.md, "Refreshing").
In H2ONLB/whysteps: fetch main and coordination, run python3 internal/command-center/tools/build_snapshot.py --by <your account>, then republish data/snapshot.js to my Command Center artifact (patch mode, only that file).`;
$('#refreshBtn').addEventListener('click', () => openSheet(`<h2 id="sheetTitle">Refresh your office</h2>
  <p><strong>It refreshes by itself every day, ready by 9:00 and 18:00</strong> (Beirut time). Each refresh reads GitHub and adds everything Claude Onsi, ChatGPT and Claude Hiba have finished. You chose this on 25 Nov 2026.</p>
  <p><strong>Want it fresh right now?</strong> Your GitHub is private and this page has no key to read it (keys never go in pages), so a Claude chat does an extra refresh for you:</p>
  <ol class="steps-plain">
    <li>Press <strong>📋 Copy the request</strong> below.</li>
    <li>Open a Claude chat in the <strong>WhySteps</strong> project (the one that works on WhySteps).</li>
    <li>Paste it and press Enter. Claude reads GitHub and updates this office, in a few minutes.</li>
    <li>Come back and reload this page. The time under "Last checked" changes when it is done.</li>
  </ol>
  <p class="small muted">Last checked: <strong>${fmt(S.generated.at)}</strong>. Your answers already sent to GitHub are safe; the office shows them after the next refresh.</p>
  <button class="primary" type="button" id="copyRefresh">${icon('copy')}📋 Copy the request</button>
  <details class="small"><summary>What Claude will be asked</summary><pre>${esc(REFRESH)}</pre></details>`));

/* ------------------------------------------------------------ campus part 1 (campus.js, Hiba 26 Nov 2026) */
/* From the campus breaks: open a break room in the 3D office (🌸 Thai massage, or the full coffee room). */
function goBreak(d) { const prev = onBreak(); store.set('break', { kind: d, since: prev ? prev.since : new Date().toISOString() }); st.room = d === 'massage' ? 'spa' : d; store.set('room', st.room); st.office = true;
  toast(d === 'massage' ? '🌸 Thai massage: lie down and breathe. Nobody comes to your desk.' : BREAKS[d] + ': off to the coffee room. The team waits.'); if (location.hash === '#now') route(); else location.hash = 'now'; }
const { renderWork, renderCampus, cxOfficeJobs, cxMeetingHTML } = window.WSCampus({ S, view, esc, icon, src, fmt, plural, CH, openSheet, toast, sendOut, body, openGH, newIssueURL, SECRET, THREADS, WORKSPACES, pendingList, stateOf, st, goBreak, get DB() { return DB; } });

/* ------------------------------------------------------------ routing and events */
const RENDER = { work: renderWork, campus: renderCampus, now: renderNow, messages: renderMessages, hq: renderHQ, dashboard: renderDashboard, activity: renderActivity, issues: renderIssues, decisions: renderDecisions, evidence: renderEvidence, more: renderMore };
function route() {
  const h = location.hash.slice(1);
  const rm = /^role-(\d{1,3})$/.exec(h);
  st.view = rm ? 'hq' : RENDER[h] ? h : /^campus-/.test(h) ? 'campus' : 'work'; // Work opens first (Hiba, 26 Nov 2026)
  renderTabs(); RENDER[st.view]();
  if (rm) roleDrawer(+rm[1]);
}
addEventListener('hashchange', () => { route(); $('#main').focus({ preventScroll: true }); scrollTo(0, 0); });
addEventListener('resize', () => renderTabs());
document.addEventListener('click', e => {
  const t = e.target.closest('button,a,[data-walk],[data-visit],[data-role],[data-bot],[data-botwave],[data-openbox]'); if (!t) { return; }
  const pv = S.website && S.website.preview;
  if (SITE_LOCAL && (t.id === 'siteBtn' || (t.tagName === 'A' && pv && t.getAttribute('href') === pv.url) || t.dataset.site)) { e.preventDefault(); return openSite(); }
  if (t.id === 'siteClose') return closeSite();
  if (pv && !pv.ownCopy && t.tagName === 'A' && t.getAttribute('href') === pv.url && !t.dataset.direct) { e.preventDefault(); return openSheet(`<p class="muted small">Customer website</p><h2 id="sheetTitle">Open the latest website</h2>
    <p>The website preview is a private page of your <strong>Hiba</strong> Claude account. claude.ai only opens it when this browser is signed in to that account; signed in to another account, it says "Page not found".</p>
    <ol><li>Sign in to claude.ai with your Hiba account (or open it in the Claude app on that account).</li><li>Then tap the button below.</li></ol>
    <p><a class="primary" data-direct="1" href="${esc(pv.url)}" target="_blank" rel="noopener">Open the website ${icon('ext')}</a></p>
    <p class="small muted">Status: ${esc(S.website.status || '')}. ${esc(S.website.statusWhy || '')} Once your own Command Center lives in the Hiba account, this button opens the website straight away.</p>`); }
  if (t.dataset.assign) { const who = t.dataset.assignwho, id = t.dataset.assign; if (lastRec('Assign: ' + id)?.who === who) return toast(`${id} is already with ${who}.`);
    stampFX(t); return assignOut('Assign: ' + id, who, `[Assign] ${id} → ${who}: ${t.dataset.assigntitle}`, `Please take ${id} (${t.dataset.assigntitle}) and work on it now, with its team's experts and reviewers, following CLAUDE.md. Post progress here and on the pull request; when it is done, say so plainly.`); }
  if (t.dataset.teamlead) { const who = t.dataset.assignwho, g = t.dataset.teamlead, nm = t.dataset.teamleadname; if (leadOf(g) === who) return toast(`${who} already leads ${nm}.`);
    stampFX(t); return assignOut('Team lead: ' + g, who, `[Team lead] ${nm} → ${who}`, `From now on you lead the ${nm} team: take every ${nm} job that nobody else has taken, work on it with the team's experts and reviewers, and report in the meeting room. Nobody waits with nothing to do.`); }
  if (t.dataset.teamreview) { const g = t.dataset.teamreview, nm = t.dataset.teamleadname, who = leadOf(g); stampFX(t);
    return assignOut('Review: ' + g, who, `[Review] ${nm} team → ${who}`, `Please review the ${nm} team's work the way a good employee would, with its experts and their reviewers, following CLAUDE.md and the gap sweep: check what the team has built and written against the latest main and the website, and find anything that is wrong, out of date or missing for the launch. Do real fixes through a pull request with every test suite passing, then report here in plain words. If nothing is needed, reply with one line, "Nothing needed for ${nm}", and stop. Do not invent work: Hiba's usage is for getting the website ready to launch.`); }
  if (t.dataset.deptgo) { st.room = 'experts'; st.aiRoom = null; st.deptRoom = t.dataset.deptgo; store.set('room', 'experts'); const y = scrollY; renderNow(); scrollTo(0, y); HQ.inst && HQ.inst.focus(t.dataset.deptgo); return; }
  if (t.matches('[data-close]')) return closeSheet();
  if (t.dataset.role) return roleDrawer(+t.dataset.role);
  if (t.dataset.office) { const w = WORKSPACES.find(x => x.key === t.dataset.office); const s = actorSummary(w.key); return openSheet(`<p class="muted small">AI workspace</p><h2 id="sheetTitle">${esc(w.id)}</h2><p>${esc(cap((S.comms && S.comms.ownership[w.id] || {}).text) || w.role)}</p><dl class="kv">${capabilities(w).map(c => `<dt>${esc(c.k)}</dt><dd>${esc(c.v)}</dd>`).join('')}</dl><h3>Latest records</h3><ul class="list">${s.items.slice(0, 6).map(x => `<li>${esc(x.title.slice(0, 160))}<div class="meta"><span>${esc(x.kind)}</span><span>${fmt(x.date)}</span>${src(x.url)}</div></li>`).join('') || '<li class="muted">None.</li>'}</ul><div class="row"><button class="ghost" type="button" data-inbox="${esc(w.id)}">Messages for ${esc(w.id)}</button><button class="ghost" type="button" data-compose="${esc(w.id)}">Write to ${esc(w.id)}</button></div>`); }
  if (t.dataset.dept) return deptDrawer(t.dataset.dept);
  if (t.dataset.wing) { const key = t.dataset.wing === 'Independent reviewers' ? 'Builders' : t.dataset.wing; const wing = [...document.querySelectorAll('.wing[data-wing]')].find(x => x.dataset.wing === key); wing?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'}); return; }
  if (t.dataset.hl !== undefined) {
    const k = t.dataset.hl, [kind, i] = k.split(':'); const o = kind === 'own' ? OM.ownership[+i] : kind === 'jr' ? OM.journeys[+i] : null;
    if (!o || st.hlName === o.name) { st.hl = null; st.hlName = ''; } else { st.hl = new Set([...o.owners, ...o.reviewers]); st.hlName = o.name; }
    renderHQ(); document.querySelector('.directory').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return;
  }
  if (t.dataset.mode) { st.mode = t.dataset.mode; return renderHQ(); }
  if (t.dataset.actor) { st.actor = t.dataset.actor; st.limit = 120; return renderActivity(); }
  if (t.dataset.dtab) { st.dtab = t.dataset.dtab; return renderDecisions(); }
  if (t.id === 'more') { st.limit += 120; return renderActivity(); }
  if (t.dataset.refresh !== undefined) return $('#refreshBtn').click();
  if (t.id === 'officeToggle') { st.office = !st.office; store.set('office-view', st.office); return renderNow(); }
  if (t.dataset.room) return enterRoom(t.dataset.room);
  if (t.id === 'liveSend') { liveAsk(); return; }
  if (t.dataset.liveshare) { liveShare(t.dataset.liveshare); return; }
  if (t.id === 'liveClear') { LIVE.msgs = []; redrawLive(); return; }
  if (t.dataset.tonote !== undefined) { const m = LIVE.msgs[+t.dataset.tonote]; MD().text = `Suggested by Live Claude (in this page), checked by Hiba:\n${m.content}`; store.set('meeting-draft', MD()); const ta = $('#meetText'); if (ta) { ta.value = MD().text; ta.focus(); } toast('Copied into your meeting note. Post it when you are happy with it.'); return; }
  if (t.dataset.notekind) { MD().kind = t.dataset.notekind; store.set('meeting-draft', MD()); document.querySelectorAll('[data-notekind]').forEach(b => { b.setAttribute('aria-checked', b === t); b.setAttribute('aria-pressed', b === t); }); return; }
  if (t.dataset.invite) { const m = meetings()[0]; if (!m) return; return copy(`Please read the WhySteps meeting notes in GitHub Issue #${m.n} (H2ONLB/whysteps, label "meeting") and add your note as a comment. Start it with:
<!-- whysteps-command-center/1 -->
**From:** ${t.dataset.invite}

Keep it short: what you are working on, what you suggest to improve, and anything you need from Hiba. Then tell me the link.`, 'Invitation for ' + t.dataset.invite).then(() => toast('Copied. ' + pasteWhere(t.dataset.invite))); }
  if (t.id === 'meetPost' || t.id === 'meetNew' || t.id === 'meetClaude') {
    MD().text = $('#meetText').value; store.set('meeting-draft', MD());
    if (!MD().text.trim()) { toast('Write your note first.'); $('#meetText').focus(); return; }
    if (SECRET.test(MD().text)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
    const m = meetings()[0], isNew = t.id === 'meetNew' || !m;
    const title = `[Meeting] ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: TZ }).format(new Date())}: ${MD().text.trim().slice(0, 50)}`;
    const body = meetingBody(isNew);
    if (t.id === 'meetClaude') return copy(`Please post this to GitHub in H2ONLB/whysteps (internal/command-center/README.md, "Posting messages"). ${isNew ? `Open a new Issue titled "${title}" with the labels meeting and command-center.` : `Add it as a comment on Issue #${m.n}.`} Post the text exactly, then tell me the link.

${body}`, 'Request for Claude');
    sendOut({ kind: 'meeting', title: isNew ? title : '', body, labels: 'meeting,command-center', issue: isNew ? null : m.n }, () => {
      if (isNew) { openGH(newIssueURL(title, body, 'meeting,command-center')); toast('🚀 GitHub opened with your meeting. It starts when you press the green Submit there.'); return; }
      copy(body, 'Note').then(() => toast('Note copied. GitHub opens: paste it in the comment box and press Comment.')); window.open(m.url + '#new_comment_field', '_blank', 'noopener'); }); return;
  }
  if (t.dataset.desk === 'go-office') return enterRoom('office');
  if (t.dataset.qb) return quickSend(t);
  if (t.dataset.outchange) return changeAnswer(t.dataset.outchange);
  if (t.dataset.outpost) return postMyself(t.dataset.outpost);
  if (t.dataset.sendall) return sendAll();
  if (t.dataset.callrole) { const n = +t.dataset.callrole, c = (store.get('called', []) || []).filter(x => x !== n); store.set('called', [n, ...c].slice(0, 5)); closeSheet(); toast(`📣 #${n} is coming up to your office.`); enterRoom('office'); return; }
  if (t.dataset.callteam) { callTeam(t.dataset.callteam); return; }
  if (t.dataset.tmpick) { tmGo(+t.dataset.tmpick); return; }
  if (t.dataset.tmverdict) { tmVerdict(t.dataset.tmverdict); return; }
  if (t.dataset.tmstep) { const L = tmList(), c = L.indexOf(tmCur()); tmGo(L[(c + (+t.dataset.tmstep) + L.length) % L.length]); return; }
  if (t.dataset.tmend !== undefined) { tmEnd(); return; }
  if (t.dataset.tmall) { tmAll(t.dataset.tmall); return; }
  if (t.dataset.tmnextteam !== undefined) { const q = (store.get('calledTeams', []) || []); if (q.length) { store.set('teamMeet', q[0]); store.set('calledTeams', q.slice(1)); } toast('📣 The next team comes into the meeting room.'); const y = scrollY; renderNow(); scrollTo(0, y); return; }
  if (t.dataset.tmleave !== undefined) { store.set('teamMeet', null); toast('The team goes back to its room. Your notes stay on this device until you end the meeting.'); const y = scrollY; renderNow(); scrollTo(0, y); return; }
  if (t.dataset.dismisscall) { const n = +t.dataset.dismisscall; store.set('called', (store.get('called', []) || []).filter(x => x !== n)); toast(`#${n} goes back to work.`); const y = scrollY; renderNow(); scrollTo(0, y); return; }
  if (t.dataset.hqview) { HQ.inst && HQ.inst.focus(t.dataset.hqview); return; }
  if (t.dataset.sendback) return sendBack(t.dataset.sendback);
  if (t.dataset.angry) return angrySheet(t.dataset.angry);
  if (t.dataset.exdetails) { const d = $('#exDetails'); if (d) { d.hidden = !d.hidden; t.setAttribute('aria-expanded', String(!d.hidden)); if (!d.hidden) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } return; }
  if (t.dataset.exreturn) { closeSheet(); moveInQueue('back'); toast('↩ Back to its desk. It waits in the line until you call it again.'); if (st.view === 'now') { const y = scrollY; renderNow(); scrollTo(0, y); } return; }
  if (t.dataset.angrygo) { const id = t.dataset.angrygo, txt = ($('#angryText')?.value || '').trim() || ANGRY_NOTE;
    if (SECRET.test(txt)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
    const p = pendingList().find(x => x.id === id) || { id, title: id, group: 'Office' }; saveDraft(id, { choice: '😡 Not done properly: redo it 100%', comment: txt }); const m = decisionMessage(p, drafts[id]); closeSheet();
    sendOut({ kind: 'decision', key: 'dec-' + id, title: m.title, body: m.body, labels: m.labels + ',not-done-properly' }, () => { openGH(newIssueURL(m.title, m.body, m.labels + ',not-done-properly')); toast('🚀 GitHub opened. Press the green Submit there.'); });
    sent[id] = new Date().toISOString(); store.set('sent-to-github', sent); toast('😡 Sent back. It does not come back until it is done 100% and explained.');
    const f = $('.visitor.front'); if (f) f.classList.add('leaving', 'angry');
    if (st.view === 'now') setTimeout(() => { if (st.view === 'now') renderNow(); }, 600); return; }
  if (t.dataset.sbgo) { const id = t.dataset.sbgo, txt = ($('#sbText')?.value || '').trim(); if (!txt) { toast('Write what the team should fix first.'); $('#sbText')?.focus(); return; }
    if (SECRET.test(txt)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
    const p = pendingList().find(x => x.id === id); saveDraft(id, { choice: 'Send back to fix', comment: txt }); const m = decisionMessage(p, drafts[id]); closeSheet();
    sendOut({ kind: 'decision', key: 'dec-' + id, title: m.title, body: m.body, labels: m.labels }, () => { openGH(newIssueURL(m.title, m.body, m.labels)); toast('🚀 GitHub opened. Press the green Submit there.'); });
    if (st.view === 'now' && st.office) { sent[id] = new Date().toISOString(); store.set('sent-to-github', sent); setTimeout(() => { if (st.view === 'now') renderNow(); }, 300); } return; }
  if (t.dataset.explain) return explainSheet(t.dataset.explain);
  if (t.dataset.exlive) return exLive();
  if (t.dataset.openbox) { const b = $('#outboxBar'); if (b) { const d = b.querySelector('details'); if (d) d.open = true; b.scrollIntoView({ block: 'center', behavior: 'smooth' }); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); } return; }
  if (t.dataset.airoom !== undefined || t.dataset.airoomGo || t.dataset.desk === 'back-corridor') { closeSheet(); st.room = 'ai'; store.set('room', 'ai'); st.aiRoom = t.dataset.airoomGo || t.dataset.airoom || null; renderNow(); $('.room-scene')?.scrollIntoView({ block: 'start' }); return; }
  if (t.dataset.deptroom !== undefined || t.dataset.desk === 'back-hall') { st.deptRoom = t.dataset.deptroom || null; renderNow(); $('.room-scene')?.scrollIntoView({ block: 'start' }); return; }
  if (t.dataset.spaarea) { SPA.focus = t.dataset.spaarea; const y = scrollY; renderNow(); scrollTo(0, y); return; }
  if (t.dataset.spamins) { SPA.mins = +t.dataset.spamins; const y = scrollY; renderNow(); scrollTo(0, y); return; }
  if (t.dataset.meetangry) return meetAngry(t.dataset.meetangry);
  if (t.dataset.bot) return botSheet(t.dataset.bot);
  if (t.dataset.botwave) { t.classList.remove('waving'); void t.getBBox(); t.classList.add('waving'); toast(`${WORKSPACES.find(w => w.key === t.dataset.botwave).id} waves back. It works when you open it and ask.`); return; }
  if (t.dataset.celebrated) { st.celebrated = true; store.set('seen-at', new Date().toISOString()); t.closest('.celebrate')?.remove(); return; }
  if (t.dataset.gotodesk) { if ((st.room || 'office') !== 'office') { st.room = 'office'; store.set('room', 'office'); renderNow(); } setTimeout(() => walkTo('desk'), 30); setTimeout(() => $('.desk-panel')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120); return; }
  if (['brew', 'takecup', 'sip', 'another'].includes(t.dataset.desk)) return coffeeStep(t.dataset.desk);
  if (t.dataset.drink) { CO.drink = t.dataset.drink; return redrawCoffee(); }
  if (t.dataset.sugar !== undefined && st.room === 'coffee') { CO.sugar = +t.dataset.sugar; return redrawCoffee(); }
  if (t.dataset.walk) return walkTo(t.dataset.walk);
  if (t.dataset.desk === 'go-desk') return walkTo('desk');
  if (t.dataset.desk === 'wave') { st.say = 'Hi team!'; st.anim = 'wave'; const y = scrollY; renderNow(); scrollTo(0, y); document.querySelectorAll('.visitor').forEach((v, i) => setTimeout(() => v.classList.add('waveback'), 150 * i));
    clearTimeout(window._sayT); window._sayT = setTimeout(() => { st.say = ''; st.anim = ''; document.querySelector('.say')?.remove(); document.querySelectorAll('.waveback').forEach(v => v.classList.remove('waveback')); document.querySelector('.hand')?.remove(); }, 2400); return; }
  if (t.dataset.desk) {
    const d = t.dataset.desk;
    if (d === 'coffee' || d === 'lunch' || d === 'massage') { const prev = onBreak(); store.set('break', { kind: d, since: prev ? prev.since : new Date().toISOString() }); st.room = d === 'coffee' ? 'coffee' : d === 'massage' ? 'spa' : 'lunch'; store.set('room', st.room); toast(d === 'massage' ? '🌸 Thai massage: lie down and breathe. Nobody comes to your desk.' : BREAKS[d] + (d === 'coffee' ? ': off to the coffee room.' : ': off to the lunch corner.') + ' The team waits.'); }
    else if (d === 'back-from-break') { store.set('break', null); st.room = 'office'; store.set('room', 'office'); toast('Welcome back. ' + plural(officeQueue().length, 'person', 'people') + ' waiting.'); }
    else { moveInQueue(d); toast(d === 'next' ? 'Ding! Next person, please.' : d === 'back' ? 'Moved to the back of the line.' : 'Pinned a note: left to the end.'); }
    st.say = d === 'coffee' || d === 'lunch' || d === 'massage' ? '' : SAYS[d]; st.anim = d;
    const y = scrollY; renderNow(); scrollTo(0, y); $(`[data-desk="${d === 'coffee' || d === 'lunch' || d === 'massage' ? 'back-from-break' : d === 'back-from-break' ? 'next' : d}"]`)?.focus();
    clearTimeout(window._sayT); window._sayT = setTimeout(() => { st.say = ''; st.anim = ''; document.querySelector('.say')?.remove(); }, 2400); return;
  }
  if (t.dataset.skip) { const q = officeQueue(); if (q.length > 1) { const N = nowItems(); const i = N.y.indexOf(q[0]); N.y.push(N.y.splice(i, 1)[0]); } return renderNow(); }
  if (t.dataset.sentdone) { sent[t.dataset.sentdone] = new Date().toISOString(); store.set('sent-to-github', sent); setTimeout(() => { if (st.view === 'now') renderNow(); }, 300); return; }
  if (t.dataset.visit) { const f = officeQueue()[0]; if (f && f.dec && f.id !== 'site-link') return explainSheet(f.id); $('.desk-panel .opt, .desk-panel .primary')?.focus(); return; }
  if (t.dataset.nowf) { st.nowF = t.dataset.nowf; return renderNow(); }
  if (t.dataset.mission) { st.open = st.open === t.dataset.mission ? null : t.dataset.mission; const y = scrollY; renderNow(); scrollTo(0, y); return; }
  if (t.dataset.send) { const N = nowItems(), x = [...N.u, ...N.y, ...N.a].find(i => i.id === t.dataset.send); if (x) passOnSheet(x); return; }
  if (t.dataset.copypass) { copy($('#passText')?.value || '', 'The instruction').then(() => toast('📋 Copied again.')); return; }
  if (t.dataset.urgentq) { closeSheet(); return explainSheet(t.dataset.urgentq); }
  if (t.dataset.askteam) { const x = nowItems().u.find(i => i.id === t.dataset.askteam); Object.assign(msgDraft, { to: 'All three', thread: '', subject: 'Who takes: ' + x.title, project: 'Review v2 urgent problems', roles: '', links: x.url, text: `${x.title} (${x.tag}) has no account taking it yet. Who takes it?` }); store.set('message-draft', msgDraft); location.hash = 'messages'; return; }
  if (t.dataset.multitoggle) { const id = t.dataset.multitoggle; st.multi = st.multi || {}; st.multi[id] = st.multi[id] ? null : []; const y = scrollY; renderNow(); scrollTo(0, y); return; }
  if (t.dataset.pick) { const id = t.dataset.pick, L = (st.multi && st.multi[id]) || [], o = t.dataset.opt, i = L.indexOf(o); if (i >= 0) L.splice(i, 1); else L.push(o); t.setAttribute('aria-pressed', i < 0); t.classList.toggle('picked', i < 0); return; }
  if (t.dataset.quickmulti) { const L = (st.multi && st.multi[t.dataset.quickmulti]) || []; if (!L.length) { toast('Pick at least one answer first.'); return; } t.dataset.quickdec = t.dataset.quickmulti; t.dataset.opt = L.join(' + '); st.multi[t.dataset.quickmulti] = null; }
  if (t.dataset.quickdec) { if (t.closest('#sheet')) closeSheet(); const p = S.decisions.pending.find(x => x.id === t.dataset.quickdec) || (t.dataset.quickdec === 'site-link' ? { id: 'site-link', kind: 'Website check', title: 'Does the website open for Hiba?', url: S.website.githubUrl } : null); if (!p) return; saveDraft(p.id, { choice: t.dataset.opt }); const m = decisionMessage(p, drafts[p.id]); sendOut({ kind: 'decision', key: 'dec-' + p.id, title: m.title, body: m.body, labels: m.labels }, () => { openGH(newIssueURL(m.title, m.body, m.labels)); toast('🚀 GitHub opened with your answer. It counts once you press the green Submit there.'); });
    if (st.view === 'now' && st.office) { sent[p.id] = new Date().toISOString(); store.set('sent-to-github', sent); stampFX(t); const f = $('.visitor.front'); if (f) f.classList.add('leaving', 'happy'); setTimeout(() => { if (st.view === 'now') renderNow(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600); }
    return; }
  if (t.dataset.thread) return threadDrawer(+t.dataset.thread);
  if (t.dataset.inbox) { st.inbox = t.dataset.inbox; if (st.view !== 'messages') { location.hash = 'messages'; return; } return renderMessages(); }
  if (t.dataset.compose) { msgDraft.to = t.dataset.compose; store.set('message-draft', msgDraft); if (st.view !== 'messages') { location.hash = 'messages'; } else renderMessages(); setTimeout(() => $('#m-text')?.focus(), 50); return; }
  if (t.dataset.replyhere) { closeSheet(); msgDraft.thread = t.dataset.replyhere; store.set('message-draft', msgDraft); if (st.view !== 'messages') location.hash = 'messages'; else renderMessages(); setTimeout(() => $('#m-text')?.focus(), 50); return; }
  if (t.dataset.to) { readCompose(); msgDraft.to = t.dataset.to; store.set('message-draft', msgDraft); $('#composeWrap').innerHTML = composeHTML(); return; }
  if (t.id === 'runTest') return runTest();
  if (t.dataset.copytext) return copy(t.dataset.copytext, 'Request');
  if (t.dataset.discuss) { const c = S.website.changes.find(x => x.sha === t.dataset.discuss); Object.assign(msgDraft, { thread: '', subject: 'Website change: ' + c.subject.slice(0, 70), project: 'Customer website', links: c.url + (c.pr ? ' , PR #' + c.pr : ''), text: `About this website change (${short(c.sha)}, ${S.website.status}): ` }); store.set('message-draft', msgDraft); location.hash = 'messages'; setTimeout(() => $('#m-text')?.focus(), 80); return; }
  if (t.id === 'copyTest') return copy(testReport(), 'Test result');
  if (t.id === 'm-clear') { Object.assign(msgDraft, { subject: '', project: '', roles: '', links: '', text: '', thread: '' }); store.set('message-draft', msgDraft); $('#composeWrap').innerHTML = composeHTML(); return; }
  if (t.id === 'm-copy' || t.id === 'm-claude' || t.id === 'm-github') {
    readCompose(); const m = messageOut();
    if (!msgDraft.text.trim()) { toast('Write the message first.'); return; }
    if (t.id === 'm-copy') return copy(m.b, 'Message');
    if (t.id === 'm-claude') return copy(`Please post this to GitHub in H2ONLB/whysteps (internal/command-center/README.md, "Posting messages"). ${m.t ? `Add it as a comment on Issue #${m.t.n}.` : `Open a new Issue titled "${m.title}" with the label command-center.`} Post the text exactly as written below, then tell me the link.\n\n${m.b}`, 'Request for Claude');
    if (SECRET.test(m.b)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
    sendOut({ kind: 'message', title: m.t ? '' : m.title, body: m.b, labels: 'command-center', issue: m.t ? m.t.n : null }, () => {
      if (m.t) { copy(m.b, 'Reply'); window.open(m.t.url + '#new_comment_field', '_blank', 'noopener'); return; }
      openGH(newIssueURL(m.title, m.b, 'command-center')); toast('🚀 GitHub opened with your message. It is posted only when you press the green Submit there.'); }); return;
  }
  if (t.id === 'copyRefresh') return copy(REFRESH, 'The refresh request was');
  const card = t.closest('[data-dec]');
  if (card && t.dataset.cardmulti !== undefined) { const id = card.dataset.dec, d = drafts[id] || {}; saveDraft(id, { multi: !d.multi, choice: '' }); card.querySelectorAll('.opt').forEach(o => o.setAttribute('aria-pressed', 'false')); t.setAttribute('aria-pressed', String(!d.multi)); t.textContent = !d.multi ? '☑ Several answers: on' : '☑ More than one answer applies'; return; }
  if (card && t.dataset.opt) { const id = card.dataset.dec, d = drafts[id] || {};
    if (d.multi && !/^not yet$/i.test(t.dataset.opt)) { const L = (d.choice || '').split(' + ').filter(Boolean), i = L.indexOf(t.dataset.opt); if (i >= 0) L.splice(i, 1); else L.push(t.dataset.opt); saveDraft(id, { choice: L.join(' + ') }); t.setAttribute('aria-pressed', i < 0); return; }
    saveDraft(id, { choice: t.dataset.opt }); card.querySelectorAll('.opt').forEach(o => o.setAttribute('aria-pressed', o === t)); return; }
  if (card && (t.matches('[data-record]') || t.matches('[data-askclaude]'))) {
    const id = card.dataset.dec, d = drafts[id] || {}, p = pendingList().find(x => x.id === id);
    if (!d.choice && !(d.comment || '').trim()) { toast('Pick an answer or write your decision first.'); return; }
    const m = decisionMessage(p, d);
    if (t.matches('[data-askclaude]')) return copy(`Please record this founder decision on GitHub in H2ONLB/whysteps (internal/command-center/README.md, "Recording decisions"): open a new Issue titled "${m.title}" with the labels decision and command-center, post the text below exactly, then tell me the link.\n\n${m.body}`, 'Request for Claude');
    sendOut({ kind: 'decision', key: 'dec-' + id, title: m.title, body: m.body, labels: m.labels }, () => { openGH(newIssueURL(m.title, m.body, m.labels)); toast('🚀 GitHub opened with your decision. It is recorded only when you press the green Submit there.'); }); return;
  }
});
document.addEventListener('click', e => { if (e.target.matches('.sheet-back')) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('site-open')) { closeSite(); return; } if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
  if (e.target.id === 'liveQ' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); liveAsk(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName && e.target.tagName.toLowerCase() === 'g' && e.target.dataset && (e.target.dataset.role || e.target.dataset.bot || e.target.dataset.botwave || e.target.dataset.openbox)) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.walk && e.target.tagName.toLowerCase() === 'g') { e.preventDefault(); walkTo(e.target.dataset.walk); return; }
  if (st.view === 'now' && st.office && (st.room || 'office') === 'office' && !onBreak() && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/input|textarea|select/i.test(e.target.tagName)) {
    const i = WALK_ORDER.indexOf(st.me || 'desk'), n = WALK_ORDER.length; e.preventDefault(); walkTo(WALK_ORDER[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n]); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.visit) { e.preventDefault(); $('.desk-panel .opt, .desk-panel .primary')?.focus(); } });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'roleq') { st.q = t.value; const pos = t.selectionStart; renderHQ(); const n = $('#roleq'); n.focus(); n.setSelectionRange(pos, pos); }
  if (t.id === 'aq') { st.aq = t.value; const pos = t.selectionStart; renderActivity(); const n = $('#aq'); n.focus(); n.setSelectionRange(pos, pos); }
  if (t.id === 'meetText') { MD().text = t.value; store.set('meeting-draft', MD()); }
  if (t.matches('[data-comment]')) saveDraft(t.closest('[data-dec]').dataset.dec, { comment: t.value });
  if (t.closest('#compose') && t.id !== 'm-thread') { readCompose(); if (t.id === 'm-text' || t.id === 'm-roles' || t.id === 'm-links' || t.id === 'm-subject') { const sec = SECRET.test(msgDraft.text + msgDraft.subject + msgDraft.links); const bad = (msgDraft.roles.match(/\d+/g) || []).some(n => +n < 1 || +n > 116); ['m-github', 'm-claude'].forEach(i => { const b = $('#' + i); if (b) b.disabled = sec || bad; }); } }
});
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.agenda) { const id = e.target.dataset.agenda; MD().agenda = e.target.checked ? [...new Set([...MD().agenda, id])] : MD().agenda.filter(x => x !== id); store.set('meeting-draft', MD()); return; } if (e.target.id === 'm-thread') { readCompose(); $('#composeWrap').innerHTML = composeHTML(); return; } if (e.target.id === 'kind') { st.kind = e.target.value; st.limit = 120; renderActivity(); } });

const setHH = () => document.documentElement.style.setProperty('--hh', $('.top').offsetHeight + 'px');
setHH(); addEventListener('resize', setHH);
setInterval(() => { const el = document.getElementById('breakMins'), b = onBreak(); if (el && b) el.textContent = breakMinutes(b); }, 30000);
try { st.office = JSON.parse(localStorage.getItem('wscc-office-view')) ?? true; st.me = JSON.parse(localStorage.getItem('wscc-me-at')) || 'desk'; st.room = JSON.parse(localStorage.getItem('wscc-room')) || 'office'; } catch (e) { st.office = true; }
if (st.room === 'meeting') liveInit();
/* Live Command Center (GitHub Pages, live.js): new data from GitHub replaces the old without reloading the page.
   The same object S is kept (campus.js holds it), so its contents are swapped and everything read from it is
   worked out again; then the screen Hiba is on is drawn again at the same scroll position. */
window.WSCC_APPLY = next => {
  Object.keys(S).forEach(k => delete S[k]); Object.assign(S, next); window.WS_SNAPSHOT = S;
  roles = S.roles; roleBy = Object.fromEntries(roles.map(r => [r.n, r]));
  depts = S.departments; deptBy = Object.fromEntries(depts.map(d => [d.id, d]));
  chatItems = chatRecs(S); activity = [...S.activity, ...chatItems].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  defects = S.defects || []; openP0 = defects.filter(d => d.severity === 'P0' && /^Issue/i.test(d.status || ''));
  msgsOpen = (S.coordination.messages || []).filter(m => !m.done);
  OM = S.operatingModel; recorded = (S.decisions && S.decisions.recorded) || [];
  THREADS.splice(0, THREADS.length, ...((S.issues && S.issues.threads) || []));
  NOW = null; paintStamp();
  const y = scrollY; renderTabs(); RENDER[st.view](); scrollTo(0, y);
};
route();
outboxInit();
liveInit();
}
}
