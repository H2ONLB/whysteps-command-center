/* WhySteps Command Center, live version (Hiba's plan, 26 Nov 2026). Used only on the public GitHub Pages copy
   (H2ONLB/whysteps-command-center); the Claude Artifact copies keep data/snapshot.js and never load this file.

   1. Asks once for Hiba's read-only GitHub key and keeps it in this browser only (localStorage). Never in code.
   2. Reads snapshot.json from the private repo (branch cc-data, written by .github/workflows/command-center-data.yml)
      through the GitHub API, then checks again every 60 seconds with the ETag, so an unchanged check is answered
      "304 Not modified" and does not count against GitHub's limit. Checks pause while the tab is hidden.
   3. When the data changes, app.js swaps it in (window.WSCC_APPLY) without reloading or losing the scroll position.
      If Hiba is typing or has a panel open, the new data waits until she closes it.
   4. Compares old and new data and shows each change in the "Just now" feed, with a link to GitHub, and plays a short
      light effect on the 3D campus (none when the person has asked for reduced motion).
   5. If GitHub can't be reached or the key fails, it says so plainly and shows the last data it has. */
(() => {
const API = 'https://api.github.com/repos/H2ONLB/whysteps/contents/snapshot.json?ref=cc-data';
const EVERY = 60 * 1000;
const K = { key: 'wscc-live-key', cache: 'wscc-live-cache', feed: 'wscc-live-feed' };
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const TZ = 'Asia/Beirut';
const $ = q => document.querySelector(q);
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const del = k => { try { localStorage.removeItem(k); } catch (e) { } };
const hm = d => d ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(new Date(d)) : '—';

const L = { data: null, etag: null, checked: null, ok: false, why: '', pending: null, timer: null, booted: false, busyT: null };

/* ------------------------------------------------------------ stamp at the top */
function paint() {
  const el = $('#liveStamp') || $('#stamp'); if (!el) return;
  const last = L.data && L.data.generated && L.data.generated.at;
  if (L.ok) el.innerHTML = `<span class="live-dot" aria-hidden="true"></span><strong>Live</strong> · last change ${hm(last)} · checked ${hm(L.checked)}${L.pending ? ' · <em>new data waiting until you close this panel</em>' : ''}`;
  else el.innerHTML = `<span class="live-dot off" aria-hidden="true"></span><strong>Offline:</strong> showing data from ${last ? hm(last) + (new Date(last).toDateString() !== new Date().toDateString() ? ' on ' + new Date(last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ }) : '') : 'nowhere yet'}. ${esc(L.why)} <button type="button" class="live-link" data-live="retry">Try again</button>${/key/i.test(L.why) ? ' <button type="button" class="live-link" data-live="change">Change key</button>' : ''}`;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------------------------------------ the one-screen key form */
function keyForm(msg) {
  const st = $('#stamp'); if (st) st.textContent = 'Waiting for your read-only GitHub key';
  const v = $('#view');
  v.innerHTML = `<div class="band live-key"><form id="liveKeyForm" class="live-card" autocomplete="off">
    <p class="eyebrow">Live Command Center</p>
    <h1>Paste your read-only GitHub key</h1>
    <p>The Command Center reads your private WhySteps records with a key that can only <strong>read</strong>, never change anything. It stays in this browser only. You can forget it any time.</p>
    ${msg ? `<p class="live-err" role="alert">${esc(msg)}</p>` : ''}
    <label for="liveKey">Read-only key</label>
    <input id="liveKey" type="password" spellcheck="false" autocapitalize="off" placeholder="github_pat_…" required>
    <p><button class="primary" type="submit">Save and open</button></p>
    <details><summary>How to make the key (about 2 minutes)</summary><ol>
      <li>GitHub → your profile photo → <strong>Settings</strong> → <strong>Developer settings</strong> → <strong>Personal access tokens</strong> → <strong>Fine-grained tokens</strong> → <strong>Generate new token</strong>.</li>
      <li>Name: <em>Command Center (read only)</em>. Expiry: 1 year.</li>
      <li>Repository access: <strong>Only select repositories</strong> → <strong>H2ONLB/whysteps</strong>.</li>
      <li>Permissions: <strong>Contents → Read-only</strong> (Metadata read-only is added by itself). Nothing else.</li>
      <li>Copy the key and paste it here. Don't paste it anywhere else.</li></ol></details>
  </form></div>`;
  $('#liveKeyForm').addEventListener('submit', async e => {
    e.preventDefault(); const k = $('#liveKey').value.trim(); if (!k) return;
    const b = e.target.querySelector('button'); b.disabled = true; b.textContent = 'Checking the key…';
    set(K.key, k); const r = await check(true);
    if (r === 'key') { del(K.key); keyForm(L.why + ' Check the key and paste it again.'); }
    else if (!L.booted && L.data) boot();
    if (r !== 'key') schedule();
    else if (!L.data) keyForm('The key was saved, but GitHub could not be reached: ' + L.why);
  });
  $('#liveKey').focus();
}

/* ------------------------------------------------------------ reading GitHub */
async function check(first) {
  const key = get(K.key); if (!key) { keyForm(); return 'key'; }
  const h = { Accept: 'application/vnd.github.raw+json', Authorization: 'Bearer ' + key, 'X-GitHub-Api-Version': '2022-11-28' };
  if (L.etag && L.data) h['If-None-Match'] = L.etag;
  let r;
  try { r = await fetch(API, { headers: h, cache: 'no-store' }); }
  catch (e) { return fail('GitHub could not be reached (no internet connection?).'); }
  L.checked = new Date().toISOString();
  if (r.status === 304) { const was = L.ok; L.ok = true; L.why = ''; paint(); if (!was) feedDraw(false); return 'same'; }
  if (r.status === 401) return fail('GitHub did not accept your key (it may have expired).', 'key');
  if (r.status === 403 || r.status === 429) return fail(r.headers.get('x-ratelimit-remaining') === '0' ? 'GitHub asked us to wait a few minutes (too many checks).' : 'GitHub refused the key: it may not have Contents read access to H2ONLB/whysteps.', 'key');
  if (r.status === 404) return fail('GitHub found no live data yet, or the key cannot see H2ONLB/whysteps (it needs Contents: Read-only on that repository).', 'key');
  if (!r.ok) return fail(`GitHub answered with an error (${r.status}).`);
  let next; try { next = await r.json(); } catch (e) { return fail('The data from GitHub could not be read.'); }
  L.etag = r.headers.get('ETag'); L.ok = true; L.why = '';
  set(K.cache, JSON.stringify({ etag: L.etag, data: next }));
  receive(next); feedDraw(false);
  return 'new';
}
function fail(why, kind) { L.ok = false; L.why = why; L.checked = new Date().toISOString(); paint(); feedDraw(false); return kind || 'off'; }

/* ------------------------------------------------------------ new data */
function receive(next) {
  if (!L.booted) { L.data = next; boot(); return; }
  if (L.data && L.data.generated && next.generated && next.generated.at === L.data.generated.at) { paint(); return; }
  L.pending = next; applyWhenFree();
}
const busy = () => { const a = document.activeElement, sh = $('#sheet');
  return (sh && !sh.hidden) || document.body.classList.contains('site-open') || (a && /^(input|textarea|select)$/i.test(a.tagName) && a.id !== 'liveKey') || (a && a.isContentEditable); };
function applyWhenFree() {
  clearTimeout(L.busyT);
  if (!L.pending) return;
  if (busy()) { paint(); L.busyT = setTimeout(applyWhenFree, 3000); return; }
  const prev = L.data, next = L.pending; L.pending = null;
  const ev = changes(prev, next); // compared first: app.js reuses the first data object when it swaps the new data in
  L.data = next;
  if (window.WSCC_APPLY) window.WSCC_APPLY(next);
  paint(); feedAdd(ev); play(ev);
}

/* ------------------------------------------------------------ what changed (old and new data compared) */
const AI = { Hiba: ['Claude Hiba', '#4EA8FF'], Onsi: ['Claude Onsi', '#3FD18B'], ChatGPT: ['ChatGPT', '#A98BEB'] };
const who = a => (AI[a] || [a && a !== 'Not stated' ? a : 'The team', '#7FD8FF']);
const atOf = j => j.status === 'done' ? 'launch' : j.status === 'not-started' ? 'office' : (j.at || 'office');
const stopName = (snap, id) => ((snap.jobs && snap.jobs.stops) || []).find(s => s.id === id)?.name || { office: 'Office', lab: 'Testing Lab', studio: 'Studio', school: 'School', family: 'Family Centre', ministry: 'Ministry', launch: 'Launch pad' }[id] || id;
function changes(a, b) {
  const ev = []; if (!a || !b) return ev;
  const prs = new Map((a.pullRequests || []).map(p => [p.n, p]));
  (b.pullRequests || []).forEach(p => { const o = prs.get(p.n), [name, c] = who(p.account);
    if (!o) ev.push({ fx: 'work', c, text: `${name} opened pull request #${p.n}: ${p.title}`, url: p.url });
    else if (o.state !== p.state && p.state === 'merged') ev.push({ fx: 'merged', c, text: `Pull request #${p.n} merged: ${p.title}`, url: p.url });
    else if (o.state !== p.state) ev.push({ fx: 'none', c, text: `Pull request #${p.n} ${p.state}: ${p.title}`, url: p.url }); });
  const seen = new Set((a.activity || []).map(x => x.kind + '|' + x.url));
  (b.activity || []).forEach(x => { if (seen.has(x.kind + '|' + x.url) || /^Pull request/.test(x.kind)) return; const [name, c] = who(x.actor);
    if (/commit/i.test(x.kind)) ev.push({ fx: 'work', c, text: `${name}: ${x.title}`, url: x.url });
    else if (/^Issue|^Message/.test(x.kind)) ev.push({ fx: 'none', c, text: `${x.kind === 'Issue comment' ? 'New reply' : x.kind}: ${x.title.replace(/^Reply on /, 'on ')}`, url: x.url }); });
  const jobs = new Map((((a.jobs || {}).jobs) || []).map(j => [j.id, j]));
  (((b.jobs || {}).jobs) || []).forEach(j => { const o = jobs.get(j.id); if (!o) return; const from = atOf(o), to = atOf(j), url = (j.links || [])[0] || 'https://github.com/H2ONLB/whysteps/blob/main/docs/launch-jobs.json';
    if (j.status === 'sent-back' && o.status !== 'sent-back') ev.push({ fx: 'back', from, to, text: `Job sent back to ${stopName(b, to)}: ${j.title}${j.reason ? ' (' + j.reason + ')' : ''}`, url });
    else if (from !== to) ev.push({ fx: j.status === 'done' ? 'done' : 'move', from, to, text: `Job moved from ${stopName(b, from)} to ${stopName(b, to)}: ${j.title}`, url }); });
  return ev;
}

/* ------------------------------------------------------------ the "Just now" feed */
function feedList() { try { return JSON.parse(get(K.feed)) || []; } catch (e) { return []; } }
function feedAdd(ev) {
  if (!ev.length) return;
  const at = new Date().toISOString(), L2 = [...ev.map(e => ({ at, text: e.text, url: e.url })), ...feedList()].slice(0, 20);
  set(K.feed, JSON.stringify(L2)); feedDraw(true);
}
function feedDraw(fresh) {
  if (!L.booted) return;
  let box = $('#liveFeed');
  if (!box) { box = document.createElement('aside'); box.id = 'liveFeed'; box.className = 'live-feed'; box.setAttribute('aria-label', 'Just now'); document.body.append(box); }
  const items = feedList(), open = get('wscc-live-feed-open') !== '0';
  box.classList.toggle('closed', !open);
  box.innerHTML = `<button type="button" class="live-feed-h" data-live="feed" aria-expanded="${open}"><span class="live-dot${L.ok ? '' : ' off'}" aria-hidden="true"></span>${L.ok || !L.checked ? 'Just now' : `Offline · data from ${hm(L.data && L.data.generated && L.data.generated.at)}`}${items.length ? ` <span class="live-n">${items.length}</span>` : ''}</button>
    <div class="live-feed-b" ${open ? '' : 'hidden'}><ol aria-live="polite">${items.length ? items.map((x, i) => `<li${fresh && i === 0 ? ' class="new"' : ''}><time>${hm(x.at)}</time> <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.text.length > 140 ? x.text.slice(0, 138) + '…' : x.text)}</a></li>`).join('') : '<li class="muted">Nothing new since you opened the page. Changes from GitHub appear here within about two minutes.</li>'}</ol>
    <p class="live-feed-f"><button type="button" class="live-link" data-live="check">Check now</button> · <button type="button" class="live-link" data-live="forget">Forget key</button></p></div>`;
}

/* ------------------------------------------------------------ light effects on the 3D campus */
function play(ev) {
  if (RM.matches) return; // reduced motion: the feed only
  const c3 = window.CAMPUS3D && window.CAMPUS3D.current; if (!c3) return;
  ev.filter(e => e.fx !== 'none').slice(0, 8).forEach((e, i) => setTimeout(() => {
    const f = (window.CAMPUS3D.current || {}).fx; if (!f) return;
    if (e.fx === 'work') { f.pulse('office', e.c); f.walk('office', e.c); }
    else if (e.fx === 'merged') { f.pulse('office', e.c); f.sparkle('office'); }
    else if (e.fx === 'move') f.travel(e.from, e.to);
    else if (e.fx === 'done') { f.travel(e.from, 'launch', '#3FD18B'); setTimeout(() => (window.CAMPUS3D.current || {}).fx?.sparkle('launch'), 2500); }
    else if (e.fx === 'back') { if (e.from !== e.to) f.travel(e.from, e.to, '#F5A623'); f.glow(e.to); }
  }, i * 900));
}

/* ------------------------------------------------------------ start */
function load(src, module) { return new Promise(res => { const s = document.createElement('script'); if (module) s.type = 'module'; s.src = src; s.onload = s.onerror = res; document.body.append(s); }); }
async function boot() {
  if (L.booted) return; L.booted = true;
  window.WS_SNAPSHOT = JSON.parse(JSON.stringify(L.data)); // app.js gets its own copy, so L.data stays as it was
  for (const f of ['characters.js', 'campus.js', 'app.js']) await load(f);
  load('hq3d.js', true); load('campus3d.js', true);
  paint(); feedDraw(false);
}
function schedule() { clearTimeout(L.timer); if (document.hidden) return; L.timer = setTimeout(async () => { await check(); schedule(); }, EVERY); }

window.WSLive = { paint, check };
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-live]'); if (!t) return;
  const a = t.dataset.live;
  if (a === 'retry' || a === 'check') { t.disabled = true; await check(); t.disabled = false; schedule(); }
  if (a === 'change') { del(K.key); location.reload(); }
  if (a === 'forget') { if (confirm('Forget the GitHub key in this browser? You will need to paste it again to see live data.')) { del(K.key); del(K.cache); location.reload(); } }
  if (a === 'feed') { set('wscc-live-feed-open', $('#liveFeed').classList.contains('closed') ? '1' : '0'); feedDraw(false); }
});
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) { clearTimeout(L.timer); return; }
  if (!L.checked || Date.now() - new Date(L.checked) > EVERY) await check();
  schedule();
});
// the panel or the typing that held new data back has finished
document.addEventListener('focusout', () => { if (L.pending) setTimeout(applyWhenFree, 300); });

try { const c = JSON.parse(get(K.cache)); if (c && c.data) { L.data = c.data; L.etag = c.etag; } } catch (e) { }
if (!get(K.key)) { keyForm(); return; }
check(true).then(r => { if (!L.booted && L.data) boot(); else if (!L.booted) keyForm(L.why); schedule(); });
})();
