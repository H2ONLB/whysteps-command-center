/* WhySteps Command Center, campus part 1 (Hiba's plan, 26 Nov 2026).
   Adds, without changing the 3D office: the Work screen (opens first), job cards in the AI offices, the simple
   meeting room with one "Talk to the team" box, the campus (campus3d.js draws it in 3D), the inside of each
   building, and the Lunch and Coffee breaks (interactive since 26 Nov), with a Thai massage button.
   Every job comes from docs/launch-jobs.json on GitHub (in the snapshot as S.jobs). Nothing is invented: a job
   shows as moving or sent back only when that file says so. The names (Ibrahim, Omar, Saad…) are AI roles played
   by the three AI, not real people.
   Loaded before app.js. app.js keeps its helpers inside one block, so it hands them in (window.WSCampus(K))
   and gets back the screens it shows. */
window.WSCampus = K => {
const { S, view, esc, icon, src, fmt, plural, CH, openSheet, toast, sendOut, body, openGH, newIssueURL, SECRET, THREADS, WORKSPACES, pendingList, stateOf, st } = K;

const CX_ROUTE = ['office', 'lab', 'studio', 'school', 'family', 'ministry'];
const CX_STEP = { office: 'Built', lab: 'Lab', studio: 'Studio', school: 'School', family: 'Parents', ministry: 'Audit' };
const CX_STOPS_DEFAULT = [
  { id: 'office', name: 'Office', leader: 'Hiba · Ibrahim', question: 'Being built by the 3 AI teams' },
  { id: 'lab', name: 'Testing Lab', leader: 'Omar, Head of Testing', question: 'Does it work?' },
  { id: 'studio', name: 'Design and Marketing Studio', leader: 'Mohammad, Creative Director', question: 'Does it look right?' },
  { id: 'school', name: 'School', leader: 'Saad, Head Principal', question: 'Can children use it alone?' },
  { id: 'family', name: 'Family Centre', leader: 'Walid, Director', question: 'Can parents trust it?' },
  { id: 'ministry', name: 'Ministry', leader: 'Kamel, Minister of Education', question: 'Final audit' },
  { id: 'launch', name: 'Launch pad', leader: '', question: '3 to 5 real families try WhySteps first' }];
/* Which AI plays each role (the team leads: Claude Hiba leads Teaching, Product and Leadership; Claude Onsi
   Technology, Design and Accessibility; ChatGPT Marketing, Privacy and Safety). */
const CX_PEOPLE = {
  ibrahim: { name: 'Ibrahim', role: 'Project Manager', ai: 'Claude Hiba', look: { top: '#185FA5', prop: 'clip', skin: '#E2A97E', hair: '#2C2C2A', style: 'short' } },
  omar: { name: 'Omar', role: 'Head of Testing', ai: 'Claude Onsi', look: { top: '#2E6FB5', prop: 'glass', skin: '#C58B62', hair: '#1A1A1A', style: 'short' } },
  mohammad: { name: 'Mohammad', role: 'Creative Director', ai: 'Claude Onsi', look: { top: '#7B4FB8', prop: 'pencil', hat: 'beret', skin: '#F5C9A8', hair: '#412402', style: 'curly' } },
  saad: { name: 'Saad', role: 'Head Principal', ai: 'Claude Hiba', look: { top: '#0F6E56', prop: 'book', hat: 'grad', skin: '#E2A97E', hair: '#444441', style: 'short' } },
  tia: { name: 'Tia', role: 'KG teacher', ai: 'Claude Hiba', look: { top: '#E0B02E', prop: 'book', skin: '#F1D3BC', hair: '#633806', style: 'bun' } },
  tala: { name: 'Tala', role: 'Grades 1–5 teacher', ai: 'Claude Hiba', look: { top: '#2F9A5C', prop: 'book', skin: '#F5C9A8', hair: '#2C2C2A', style: 'long' } },
  ghina: { name: 'Ghina', role: 'Grades 6–9 teacher', ai: 'Claude Hiba', look: { top: '#2E6FB5', prop: 'book', skin: '#E2A97E', hair: '#712B13', style: 'wrap' } },
  inaam: { name: 'Inaam', role: 'Grades 10–12 teacher', ai: 'Claude Hiba', look: { top: '#7B4FB8', prop: 'book', skin: '#C58B62', hair: '#1A1A1A', style: 'long' } },
  walid: { name: 'Walid', role: 'Director, Family Centre', ai: 'ChatGPT', look: { top: '#C2410C', prop: 'shield', skin: '#C58B62', hair: '#2C2C2A', style: 'short' } },
  kamel: { name: 'Kamel', role: 'Minister of Education', ai: 'Claude Hiba', look: { top: '#2C2C2A', prop: 'plan', skin: '#E2A97E', hair: '#B4B2A9', style: 'short' } }};
const CX_BLD = [
  { id: 'office', name: 'Your office', who: 'Hiba · Ibrahim · 3 AI teams', look: 'Your 3D office, as it is' },
  { id: 'lab', name: 'Testing Lab', lead: 'omar', look: 'Blue glass with a dome' },
  { id: 'studio', name: 'Design and Marketing Studio', lead: 'mohammad', look: 'Purple glass, colourful sign on the roof' },
  { id: 'school', name: 'School', lead: 'saad', look: 'Clock tower, flag and four coloured doors' },
  { id: 'family', name: 'Family Centre', lead: 'walid', look: 'A warm house with a red roof' },
  { id: 'ministry', name: 'Ministry', lead: 'kamel', look: 'White, with columns' },
  { id: 'launch', name: 'Launch pad', who: '3 to 5 real families first', look: 'An apricot circle' }];
const CX_DOORS = [
  { id: 'kg', name: 'KG', lead: 'tia', colour: '#E0B02E' }, { id: 'g15', name: 'Grades 1–5', lead: 'tala', colour: '#2F9A5C' },
  { id: 'g69', name: 'Grades 6–9', lead: 'ghina', colour: '#2E6FB5' }, { id: 'g1012', name: 'Grades 10–12', lead: 'inaam', colour: '#7B4FB8' }];
/* The glowing lines, in Hiba's order: Office → Testing Lab → Studio → School and Family Centre → Ministry → Launch. */
const CX_EDGES = [['office', 'lab'], ['lab', 'studio'], ['studio', 'school'], ['studio', 'family'], ['school', 'ministry'], ['family', 'ministry'], ['ministry', 'launch']];
const CX = { to: {}, sent: {}, door: null, allJobs: false };

const cxJobs = () => (window.WS_SNAPSHOT.jobs && window.WS_SNAPSHOT.jobs.jobs) || [];
const cxStops = () => (window.WS_SNAPSHOT.jobs && window.WS_SNAPSHOT.jobs.stops) || CX_STOPS_DEFAULT;
const cxStop = id => cxStops().find(s => s.id === id) || CX_STOPS_DEFAULT.find(s => s.id === id) || { id, name: id, leader: '' };
const cxRoute = j => (Array.isArray(j.route) && j.route.length ? j.route : CX_ROUTE);
const cxLaunch = () => cxJobs().filter(j => j.forLaunch !== false);
const cxAt = j => j.status === 'done' ? 'launch' : j.status === 'not-started' ? 'office' : (j.at || 'office');
const cxFirst = s => (s || '').split(/[ ,·]/)[0];
const cxAIKey = who => ({ 'Claude Hiba': 'Hiba', 'Claude Onsi': 'Onsi', ChatGPT: 'ChatGPT' }[who] || 'Onsi');
const cxShortAI = who => who === 'Claude Onsi' ? 'Onsi' : who === 'Claude Hiba' ? 'Claude Hiba' : who;
function cxPct(j) {
  if (j.status === 'done') return 100;
  if (j.status === 'not-started') return 0;
  if (typeof j.pct === 'number') return Math.max(0, Math.min(99, j.pct));
  const r = cxRoute(j), i = Math.max(0, r.indexOf(cxAt(j)));
  return Math.max(4, Math.round((i + (j.status === 'moving' ? .5 : .2)) / r.length * 100));
}
function cxNowAt(j) {
  const s = cxStop(cxAt(j));
  if (j.status === 'done') return 'Done';
  if (j.status === 'not-started') return 'Not started';
  if (cxAt(j) === 'office') return j.status === 'sent-back' ? 'Back in the office to be fixed' : 'Being built in the office';
  return `${s.name} (${cxFirst(s.leader)})`;
}
function cxNext(j) {
  if (j.status === 'done') return '';
  const r = cxRoute(j), i = r.indexOf(cxAt(j)), n = r[i + 1];
  if (j.status === 'not-started') return cxStop(r[0] === 'office' ? r[1] || 'launch' : r[0]).name;
  if (!n) return 'Launch';
  const s = cxStop(n); return s.leader ? `${s.name} (${cxFirst(s.leader)})` : s.name;
}
const CX_LIGHT = { done: ['done', 'Done'], moving: ['moving', 'Moving'], 'sent-back': ['back', 'Sent back'], 'not-started': ['new', 'Not started'] };
function cxDots(j) {
  const r = cxRoute(j), i = j.status === 'done' ? r.length : j.status === 'not-started' ? -1 : r.indexOf(cxAt(j));
  return `<ol class="cx-dots" aria-label="Steps">${r.map((k, n) => `<li class="${n < i ? 'ok' : n === i ? (j.status === 'sent-back' ? 'back' : 'now') : ''}"><span aria-hidden="true"></span>${esc(CX_STEP[k] || cxStop(k).name)}</li>`).join('')}<li class="${j.status === 'done' ? 'ok' : ''}"><span aria-hidden="true"></span>You</li></ol>`;
}
/* One card per job: name, progress bar, Now at, Next stop, a line of dots for its steps. A sent-back job is a dashed
   card with the reason in plain words. Technical details stay behind "Show details". */
function cxJobCard(j, opts) {
  const o = opts || {}, [cls] = CX_LIGHT[j.status] || CX_LIGHT['not-started'], pct = cxPct(j);
  const links = (j.links || []).map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace('https://github.com/H2ONLB/whysteps/', ''))} ↗</a>`).join(' · ');
  return `<article class="cx-job s-${cls}" data-job="${esc(j.id)}">
    <div class="cx-job-h"><span class="cx-light l-${cls}" role="img" aria-label="${esc((CX_LIGHT[j.status] || [])[1] || '')}"></span><h3>${esc(j.title)}</h3></div>
    ${j.status === 'sent-back' ? `<p class="cx-reason"><strong>Sent back by ${esc(j.sentBackBy === 'Hiba' ? 'you' : j.sentBackBy || 'the team')}:</strong> ${esc(j.reason || 'no reason recorded')}</p>` : ''}
    <div class="cx-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(j.title)}: ${pct}%"><span style="width:${pct}%"></span></div>
    <p class="cx-at"><strong>${pct}%</strong> · ${j.status === 'done' ? 'Done' : `Now at: ${esc(cxNowAt(j))}`}</p>
    ${j.status !== 'done' ? `<p class="cx-at">Next stop: ${esc(cxNext(j))}</p>` : ''}
    ${j.now ? `<p class="cx-now small">${esc(j.now)}</p>` : ''}
    ${cxDots(j)}
    ${o.owner === false ? '' : `<p class="small muted cx-owner">${CH.svg(CH.robot(cxAIKey(j.owner)), 20)} ${esc(j.owner)}${j.forLaunch === false ? ' · after launch' : ''}</p>`}
    <details class="cx-more"><summary>Show details</summary><p class="small">${esc(j.details || 'No details recorded.')}</p>${links ? `<p class="small">${links}</p>` : ''}</details>
  </article>`;
}
function cxCounts(list) {
  const c = { done: 0, moving: 0, 'sent-back': 0, 'not-started': 0 };
  list.forEach(j => { c[j.status] = (c[j.status] || 0) + 1; }); return c;
}
function cxLaunchBar() {
  const L = cxLaunch(), c = cxCounts(L), pct = L.length ? Math.round(c.done / L.length * 100) : 0;
  return `<section class="cx-launch" aria-label="Website launch">
    <p class="cx-launch-t">Website launch: <strong>${c.done} of ${L.length} jobs done</strong></p>
    <div class="cx-bar big" role="progressbar" aria-valuemin="0" aria-valuemax="${L.length}" aria-valuenow="${c.done}" aria-label="${c.done} of ${L.length} launch jobs done"><span style="width:${pct}%"></span></div>
    <p class="small">${plural(L.length - c.done, 'job')} left before real families try it · <span class="cx-key"><i class="l-done"></i>${c.done} done</span> <span class="cx-key"><i class="l-moving"></i>${c.moving} moving</span> <span class="cx-key"><i class="l-back"></i>${c['sent-back']} sent back</span> <span class="cx-key"><i class="l-new"></i>${c['not-started']} not started</span></p>
  </section>`;
}
function cxRoadStop(j) {
  const [cls] = CX_LIGHT[j.status] || CX_LIGHT['not-started'];
  const sub = j.status === 'done' ? 'Done' : j.status === 'sent-back' ? `Sent back by ${j.sentBackBy === 'Hiba' ? 'you' : j.sentBackBy || 'the team'}: ${j.reason || ''}` : j.status === 'moving' ? `${cxNowAt(j)} · ${cxShortAI(j.owner)}` : `Not started · ${cxShortAI(j.owner)}`;
  return `<li class="cx-stop s-${cls}"><button type="button" class="cx-stop-b" data-cxjob="${esc(j.id)}"><span class="cx-circle" aria-hidden="true"></span><span><strong>${esc(j.title)}</strong><small>${esc(sub)}</small></span>
    <span class="cx-who">${CH.svg(CH.robot(cxAIKey(j.owner)), 26)}</span></button></li>`;
}
const CX_ORDER = { done: 0, moving: 1, 'sent-back': 2, 'not-started': 3 };
function renderWork() {
  const L = cxLaunch().slice().sort((a, b) => CX_ORDER[a.status] - CX_ORDER[b.status]), after = cxJobs().filter(j => j.forLaunch === false);
  const show = CX.allJobs ? L : [...L.filter(j => j.status !== 'done').slice(0, 9)];
  const doneN = L.filter(j => j.status === 'done').length;
  const src0 = window.WS_SNAPSHOT.jobs && window.WS_SNAPSHOT.jobs.source;
  view.innerHTML = `<div class="band cx-work">
    <p class="eyebrow">Work · from GitHub ${fmt(S.generated.at)}</p>
    <h1>Road to launch</h1>
    ${L.length ? cxLaunchBar() : '<div class="empty">The job list (docs/launch-jobs.json) is not in this snapshot yet. Refresh the office after it is merged.</div>'}
    ${L.length ? cxFlatMap() : ''}
    <nav class="cx-go" aria-label="Places">
      <a class="primary" href="#campus">🏫 Campus</a><a class="ghost" href="#now">🏢 Your 3D office</a><a class="ghost" href="#campus-meeting">🗣 Meeting room</a>
      <a class="ghost" href="#campus-lunch">🍽 Lunch</a><a class="ghost" href="#campus-coffee">☕ Coffee</a></nav>
    ${L.length ? `<section class="cx-road" aria-label="Road to launch"><h2>Every job is a stop</h2>
      <p class="small muted">Green: done · Blue: moving · Apricot: sent back, with the reason · Empty circle: not started. The robot is the AI that owns the job. Tap a stop for its card.</p>
      <ol class="cx-stops">
        ${CX.allJobs ? '' : doneN ? `<li class="cx-stop s-done"><button type="button" class="cx-stop-b" data-cxall="1"><span class="cx-circle" aria-hidden="true"></span><span><strong>${plural(doneN, 'job')} done</strong><small>Tap to see them all</small></span></button></li>` : ''}
        ${show.map(cxRoadStop).join('')}
        ${!CX.allJobs && L.length - doneN > show.length ? `<li class="cx-stop more"><button type="button" class="cx-stop-b" data-cxall="1"><span class="cx-circle" aria-hidden="true"></span><span><strong>${plural(L.length - doneN - show.length, 'more job')} not started</strong><small>See all ${L.length} jobs</small></span></button></li>` : ''}
        <li class="cx-stop flag"><div class="cx-stop-b"><span class="cx-circle" aria-hidden="true">🚀</span><span><strong>Launch: real families try WhySteps</strong><small>3 to 5 families first</small></span></div></li>
      </ol>
      ${CX.allJobs ? '<button class="ghost" type="button" data-cxall="0">Show fewer</button>' : `<button class="ghost" type="button" data-cxall="1">See all ${L.length} jobs</button>`}
    </section>
    ${after.length ? `<section class="cx-after"><h2>After launch</h2><p class="small muted">Not needed for the first families (they do not pay). You can move any of these back.</p><ul class="cx-stops">${after.map(j => cxRoadStop(j).replace('<small>', '<small>After launch · ')).join('')}</ul></section>` : ''}` : ''}
    <p class="small muted">${src0 ? src(src0, 'The job list on GitHub') : ''} · Names such as Ibrahim, Omar and Saad are AI roles, not real people.</p>
  </div>`;
}
function cxJobSheet(id) {
  const j = cxJobs().find(x => x.id === id); if (!j) return;
  openSheet(`<p class="muted small">Job</p><h2 id="sheetTitle">${esc(j.title)}</h2>${cxJobCard(j)}
    <div class="row"><button class="ghost" type="button" data-cxask="${esc(j.owner)}">Ask ${esc(cxShortAI(j.owner))} a question</button></div>`);
}

/* ---------------------------------------------------------------- office visits: one card per job */
function cxOfficeJobs(w) {
  const mine = cxJobs().filter(j => j.owner === w.id), open = mine.filter(j => j.status !== 'done').sort((a, b) => CX_ORDER[a.status] - CX_ORDER[b.status]);
  const active = open.filter(j => j.status === 'moving' || j.status === 'sent-back'), waiting = open.filter(j => j.status === 'not-started'), done = mine.filter(j => j.status === 'done');
  const pill = active.length ? `<span class="cx-pill busy">Working now · ${plural(active.length, 'job')}</span>` : `<span class="cx-pill">No job moving right now</span>`;
  return `<section class="cx-office" aria-label="${esc(w.id)}'s jobs"><p class="eyebrow">Office visit</p>${pill}
    <div class="cx-cards">${active.map(j => cxJobCard(j, { owner: false })).join('') || '<p class="small muted">No job is moving or sent back for this AI.</p>'}</div>
    ${waiting.length ? `<details class="cx-wait"><summary>${plural(waiting.length, 'job')} not started yet</summary><div class="cx-cards">${waiting.map(j => cxJobCard(j, { owner: false })).join('')}</div></details>` : ''}
    ${done.length ? `<details class="cx-wait"><summary>${plural(done.length, 'job')} done</summary><div class="cx-cards">${done.map(j => cxJobCard(j, { owner: false })).join('')}</div></details>` : ''}
    <button class="primary cx-askbtn" type="button" data-cxask="${esc(w.id)}">Ask ${esc(cxShortAI(w.id))} a question</button>
  </section>`;
}
function cxAskSheet(who) {
  openSheet(`<p class="muted small">Question</p><h2 id="sheetTitle">Ask ${esc(cxShortAI(who))} a question</h2>${cxTalkHTML('ask-' + cxAIKey(who), [who], 'Question for ' + who, who)}`);
}

/* ---------------------------------------------------------------- talking (one box, answers in the same place) */
const CX_TALK_TO = { Everyone: 'All three', 'Claude Hiba': 'Claude Hiba', Onsi: 'Claude Onsi', 'Claude Onsi': 'Claude Onsi', ChatGPT: 'ChatGPT' };
function cxLastExchange(project) {
  const t = THREADS.filter(x => x.project === project || (x.title || '') === 'Message: ' + project).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
  if (!t) return null;
  const replies = t.comments.filter(c => !/hiba \(founder\)/i.test(c.from || '') && /Claude Hiba|Claude Onsi|ChatGPT/.test(c.from || ''));
  return { t, replies };
}
function cxTalkHTML(key, choices, project, fixedTo) {
  const to = CX.to[key] || choices[0], ex = cxLastExchange(project), sent = CX.sent[key];
  const ans = sent ? `<p class="cx-sent">${K.DB ? '📮 Your message is in your box. Press 🚀 Send all when you are ready; the answer shows here after the office refreshes.' : '🚀 GitHub opened with your message. Press the green Submit there; the answer shows here after the office refreshes.'}</p>` : '';
  const last = ex ? `<div class="cx-exchange"><p class="small muted">You asked ${fmt(ex.t.createdAt)} ${src(ex.t.url)}</p><p class="cx-q">${esc((ex.t.text || '').slice(0, 400))}</p>
      ${ex.replies.length ? ex.replies.slice(-3).map(c => { const who = (c.from.match(/Claude Hiba|Claude Onsi|ChatGPT/) || ['AI'])[0];
        return `<div class="cx-a">${CH.svg(CH.robot(cxAIKey(who)), 26)}<p><strong>${esc(cxShortAI(who))}:</strong> ${esc((c.text || '').replace(/\s+/g, ' ').slice(0, 600))}</p></div>`; }).join('')
        : '<p class="small muted">No answer yet. The team reads it at its next session; the answer shows here after the office refreshes.</p>'}</div>` : '';
  return `<section class="cx-talk" data-cxtalkbox="${esc(key)}">
    ${choices.length > 1 ? `<div class="opts" role="radiogroup" aria-label="Who to talk to">${choices.map(c => `<button class="opt" type="button" role="radio" data-cxto="${esc(c)}" data-cxkey="${esc(key)}" aria-checked="${c === to}" aria-pressed="${c === to}">${esc(c)}</button>`).join('')}</div>` : `<p class="small">To: <strong>${esc(fixedTo || choices[0])}</strong></p>`}
    <label class="small" for="cxt-${esc(key)}">Your message</label>
    <textarea id="cxt-${esc(key)}" rows="3" placeholder="Write your question or message…"></textarea>
    <div class="row"><button class="primary" type="button" data-cxsend="${esc(key)}" data-cxproject="${esc(project)}">${icon('send')}Send</button></div>
    <div class="cx-answer" aria-live="polite">${ans}${last}</div>
  </section>`;
}
function cxSend(btn) {
  const key = btn.dataset.cxsend, project = btn.dataset.cxproject, ta = document.getElementById('cxt-' + key), text = ta ? ta.value.trim() : '';
  if (!text) { toast('Write something first.'); ta && ta.focus(); return; }
  if (SECRET.test(text)) { toast('That looks like a password or key. Never put it on GitHub.'); return; }
  const box = btn.closest('[data-cxtalkbox]'), choice = box.querySelector('[data-cxto][aria-checked="true"]'), chosen = choice ? choice.dataset.cxto : (box.querySelector('p strong') || {}).textContent;
  const to = btn.dataset.cxai || CX_TALK_TO[chosen] || chosen;
  const b = body({ to, project, text }), title = 'Talk: ' + text.replace(/\s+/g, ' ').slice(0, 60);
  sendOut({ kind: 'message', title, body: b, labels: 'command-center' }, () => { openGH(newIssueURL(title, b, 'command-center')); toast('🚀 GitHub opened with your message. It is posted only when you press the green Submit there.'); });
  ta.value = ''; CX.sent[key] = true;
  const a = box.querySelector('.cx-answer'); if (a) a.innerHTML = `<p class="cx-sent">${K.DB ? '📮 Your message is in your box. Press 🚀 Send all when you are ready; the answer shows here after the office refreshes.' : '🚀 GitHub opened with your message. Press the green Submit there; the answer shows here after the office refreshes.'}</p>`;
}

/* ---------------------------------------------------------------- meeting room: one row each, one box */
function cxPendingFrom(ai) { try { return pendingList().filter(p => p.fromAI === ai && stateOf(p.id).k !== 'git').length; } catch (e) { return 0; } }
function cxRow(name, role, light, line, svg) {
  const L = { green: 'Working', yellow: 'Needs you', red: 'Stuck', grey: 'Quiet' }[light];
  return `<li class="cx-row"><span class="cx-face">${svg}</span><div><p><strong>${esc(name)}</strong> · ${esc(role)}</p><p class="small">${esc(line)}</p></div><span class="cx-lamp k-${light}" role="img" aria-label="${L}" title="${L}"></span></li>`;
}
function cxTeamRows() {
  const J = cxJobs(), L = cxLaunch(), c = cxCounts(L), stuck = J.filter(j => j.stuck);
  let desk = 0; try { desk = pendingList().filter(p => stateOf(p.id).k !== 'git').length; } catch (e) { }
  const ib = stuck.length ? ['red', `Stuck: ${stuck[0].title}`] : [desk ? 'yellow' : 'green', `${c['sent-back'] ? `Chasing ${plural(c['sent-back'], 'job')} you sent back. ` : ''}${c.done} of ${L.length} launch jobs done, ${c.moving} moving.${desk ? ` ${plural(desk, 'question')} wait at your desk.` : ''}`];
  const ai = w => {
    const mine = J.filter(j => j.owner === w.id), st0 = mine.find(j => j.stuck), q = cxPendingFrom(w.id), mv = mine.find(j => j.status === 'moving'), sb = mine.filter(j => j.status === 'sent-back'), nx = mine.find(j => j.status === 'not-started' && j.forLaunch !== false);
    if (st0) return ['red', `Stuck: ${st0.title}`];
    if (q) return ['yellow', `Waiting for you: ${plural(q, 'question')} at your desk.`];
    if (mv) return ['green', `Building: ${mv.title}.`];
    const fixing = sb.filter(j => !/^Not restarted/i.test(j.now || ''));
    if (fixing.length) return ['green', `Fixing what you sent back: ${fixing[0].title}${fixing.length > 1 ? ` (and ${fixing.length - 1} more)` : ''}.`];
    if (sb.length) return ['grey', `Not working on it yet: ${plural(sb.length, 'job')} you sent back wait to be restarted.`];
    return ['grey', nx ? `Nothing moving. Next: ${nx.title}.` : 'Nothing moving.'];
  };
  const ib0 = CX_PEOPLE.ibrahim;
  return `<ul class="cx-rows" aria-label="Your team right now">
    ${cxRow('Ibrahim', 'Project Manager', ib[0], ib[1], CH.svg(CH.person(ib0.look), 40))}
    ${WORKSPACES.map(w => { const [l, t] = ai(w); return cxRow(w.id, { Hiba: 'Product and Teaching', Onsi: 'Technology and Design', ChatGPT: 'Marketing, Privacy and Safety' }[w.key], l, t, CH.svg(CH.robot(w.key), 40)); }).join('')}
  </ul><p class="small muted cx-legend"><span class="cx-lamp k-green"></span>Working <span class="cx-lamp k-yellow"></span>Needs you <span class="cx-lamp k-red"></span>Stuck <span class="cx-lamp k-grey"></span>Quiet</p>`;
}
function cxMeetingHTML() {
  return `<section class="cx-meet" aria-label="Your team right now"><h2>Your team right now</h2>${cxTeamRows()}
    <h2>Talk to the team</h2>${cxTalkHTML('meet', ['Everyone', 'Claude Hiba', 'Onsi', 'ChatGPT'], 'Talk to the team')}</section>`;
}

/* ---------------------------------------------------------------- campus */
function cxJobsAt(id, door) {
  return cxJobs().filter(j => j.status !== 'done' && j.forLaunch !== false && (id === 'office' ? cxAt(j) === 'office' : cxAt(j) === id) && (!door || j.door === door));
}
/* Line colours: red when a job was sent back from the building at the end of the line, blue when a job is moving
   there, green when a job has been approved there and moved on, grey when nothing moves. */
function cxEdgeState(a, b) {
  const J = cxJobs().filter(j => j.status !== 'done');
  if (J.some(j => j.status === 'sent-back' && j.sentBackFrom === b)) return 'red';
  if (J.some(j => j.status === 'moving' && cxAt(j) === b && cxRoute(j).includes(a))) return 'blue';
  if (J.some(j => { const r = cxRoute(j), i = r.indexOf(cxAt(j)); return j.status !== 'not-started' && r.indexOf(b) > -1 && r.indexOf(b) < i; })) return 'green';
  return 'grey';
}
/* A building glows while work is there: a job is at it now, or (your office) the team changed something on GitHub in the
   last hour. Read from the snapshot only. */
function cxWorking(id) {
  if (id === 'launch') return false;
  if (id === 'office') { const last = (S.activity || []).map(a => a.date).filter(Boolean).sort().pop(); return !!last && Date.now() - new Date(last) < 3600e3; }
  return cxJobsAt(id).length > 0;
}
function cxCampusData() {
  return { buildings: CX_BLD.map(b => ({ id: b.id, name: b.name, short: { studio: 'Studio', family: 'Family Centre', lab: 'Testing Lab', launch: 'Launch' }[b.id] || b.name, who: b.lead ? `${CX_PEOPLE[b.lead].name}, ${CX_PEOPLE[b.lead].role}` : b.who, n: b.id === 'launch' ? 0 : cxJobsAt(b.id).length, working: cxWorking(b.id) })),
    edges: CX_EDGES.map(([a, b]) => ({ a, b, s: cxEdgeState(a, b) })) };
}

/* ---------------------------------------------------------------- the flat campus map (Hiba, 26 Nov 2026: "Shouldn't I see
   this on the main page?"). The approved slide "Campus map with glowing lines", with real jobs: a box per building with its
   leader and how many launch jobs are there, lines in the order work travels, coloured like the 3D campus, and the jobs she
   sent back shown in red at the Office. On a phone the boxes stack in two columns. */
const CX_MAPS = {
  wide: { W: 1060, H: 300, bw: 176, bh: 100, dir: 'h', at: { office: [8, 90], lab: [218, 90], studio: [428, 90], school: [650, 8], family: [650, 184], ministry: [872, 90], launch: [872, 224] }, lh: 52 },
  tall: { W: 360, H: 462, bw: 168, bh: 86, dir: 'v', at: { office: [6, 6], lab: [186, 6], studio: [96, 108], school: [6, 210], family: [186, 210], ministry: [96, 312], launch: [96, 414] }, lh: 44 } };
const CX_MAPCOL = { blue: '#4EA8FF', green: '#2FBF7D', red: '#E5534B', grey: '#9AAEAD' };
function cxMapSVG(kind) {
  const L = CX_MAPS[kind], D = cxCampusData(), by = Object.fromEntries(D.buildings.map(b => [b.id, b]));
  const box = id => { const [x, y] = L.at[id]; return { x, y, w: L.bw, h: id === 'launch' ? L.lh : L.bh }; };
  const sentHere = cxJobs().filter(j => j.status === 'sent-back' && j.forLaunch !== false && !j.sentBackFrom && cxAt(j) === 'office').length;
  const building = cxJobs().filter(j => j.forLaunch !== false && j.status !== 'done' && cxAt(j) === 'office' && j.status !== 'sent-back').length;
  const edge = e => { const a = box(e.a), b = box(e.b), c = CX_MAPCOL[e.s];
    let d; const sameRow = Math.abs(a.y - b.y) < 10 && L.dir === 'h' || Math.abs(a.y - b.y) < 10;
    if (sameRow) d = `M${a.x + a.w} ${a.y + a.h / 2} H${b.x}`;
    else if (L.dir === 'h' && e.b !== 'launch') { const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, mx = (x1 + x2) / 2; d = `M${x1} ${y1} H${mx} V${y2} H${x2}`; }
    else { const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, my = (y1 + y2) / 2; d = `M${x1} ${y1} V${my} H${x2} V${y2}`; }
    return `<path class="cx-map-line e-${e.s}" d="${d}" fill="none" stroke="${c}" stroke-width="${e.s === 'grey' ? 3 : 5}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#cxArr-${kind}-${e.s})"><title>${esc(cxStop(e.a).name)} → ${esc(cxStop(e.b).name)}: ${{ blue: 'a job moving', green: 'approved', red: 'sent back', grey: 'quiet' }[e.s]}</title></path>`; };
  const node = id => { const b = box(id), info = by[id], meta = CX_BLD.find(x => x.id === id), p = meta.lead && CX_PEOPLE[meta.lead];
    const href = id === 'office' ? '#now' : id === 'launch' ? '#work' : '#campus-' + id, stop = cxStop(id);
    const l1 = id === 'office' ? 'Office' : id === 'studio' ? 'Studio' : meta.name;
    const l2 = id === 'office' ? 'Hiba · Ibrahim' : id === 'launch' ? '3 to 5 real families first' : `${p.name}, ${p.role}`;
    const lq = id === 'office' ? '3 AI teams' : id === 'launch' ? '' : `"${stop.question}"`;
    const l3 = id === 'office' ? `${plural(building, 'job')} being built` : id === 'launch' ? (cxLaunch().every(j => j.status === 'done') ? 'Ready to launch' : 'Waiting') : `${plural(info.n, 'job')} here`;
    const fill = { office: '#E3F1EE', lab: '#E3EFFB', studio: '#EEE6FA', school: '#FBF0DD', family: '#FBE7E3', ministry: '#F3F2EE', launch: '#F6C9A5' }[id];
    const big = id === 'launch';
    return `<a href="${href}" class="cx-map-box b-${id}" aria-label="${esc(meta.name)}: ${esc(l2)}. ${esc(l3)}${id === 'office' && sentHere ? `, ${sentHere} sent back by you` : ''}">
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${fill}" stroke="${id === 'office' && sentHere ? CX_MAPCOL.red : '#7C9C9A'}" stroke-width="${id === 'office' && sentHere ? 2.5 : 1.2}"${id === 'office' && sentHere ? ' stroke-dasharray="7 4"' : ''}/>
      <text x="${b.x + b.w / 2}" y="${b.y + (big ? 20 : 22)}" text-anchor="middle" class="m1">${esc(l1)}</text>
      <text x="${b.x + b.w / 2}" y="${b.y + (big ? 36 : 40)}" text-anchor="middle" class="m2">${esc(l2)}</text>
      ${big ? '' : `<text x="${b.x + b.w / 2}" y="${b.y + 56}" text-anchor="middle" class="m2 mq">${esc(lq)}</text><text x="${b.x + b.w / 2}" y="${b.y + (kind === 'tall' ? 76 : 82)}" text-anchor="middle" class="m3${(id === 'office' ? building : info.n) ? ' on' : ''}">${esc(l3)}</text>`}</a>`; };
  const ob = box('office'), back = sentHere ? (L.dir === 'h'
    ? `<g class="cx-map-back"><path d="M${ob.x + ob.w * .7} ${ob.y + ob.h} v34 h-${ob.w * .4} v-30" fill="none" stroke="${CX_MAPCOL.red}" stroke-width="4" stroke-linecap="round" marker-end="url(#cxArr-${kind}-red)"/><text x="${ob.x + ob.w / 2}" y="${ob.y + ob.h + 54}" text-anchor="middle" class="m-red">${plural(sentHere, 'job')} sent back by you</text></g>`
    : `<g class="cx-map-back"><text x="${ob.x + ob.w / 2}" y="${ob.y + ob.h + 14}" text-anchor="middle" class="m-red">↩ ${plural(sentHere, 'job')} sent back by you</text></g>`) : '';
  const arrows = Object.entries(CX_MAPCOL).map(([k, c]) => `<marker id="cxArr-${kind}-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="${k === 'grey' ? 5 : 4}" markerHeight="${k === 'grey' ? 5 : 4}" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="${c}"/></marker>`).join('');
  return `<svg viewBox="0 0 ${L.W} ${L.H}" class="cx-map-svg cx-map-${kind}" role="group" aria-label="Campus map: where the launch jobs are"><defs>${arrows}</defs>
    ${D.edges.map(edge).join('')}${back}${CX_BLD.map(b => node(b.id)).join('')}</svg>`;
}
function cxFlatMap() {
  const L = cxLaunch(), open = L.filter(j => j.status !== 'done'), out = open.filter(j => cxAt(j) !== 'office');
  const note = !L.length ? '' : out.length ? `${plural(out.length, 'job')} ${out.length === 1 ? 'is' : 'are'} in the buildings now. Press a box to go inside.`
    : `Nothing has left the office yet: all ${plural(open.length, 'unfinished launch job')} are still being built or fixed in the office, so the buildings show 0 and the lines are grey. A line lights up as soon as a job moves on to the Testing Lab.`;
  return `<section class="cx-map" aria-label="Campus map">
    <div class="cx-map-h"><h2>Campus map</h2><a class="linkbtn" href="#campus">Open the 3D campus</a></div>
    ${cxMapSVG('wide')}${cxMapSVG('tall')}
    <p class="small cx-map-note">${esc(note)}</p>
    <p class="small cx-legend"><span class="cx-line e-blue"></span>Blue: moving <span class="cx-line e-green"></span>Green: approved <span class="cx-line e-red"></span>Red: sent back <span class="cx-line e-grey"></span>Grey: nothing moving</p>
  </section>`;
}
const C3D = { inst: null };
function cxBldCard(b) {
  const n = b.id === 'launch' ? null : cxJobsAt(b.id).length, p = b.lead && CX_PEOPLE[b.lead];
  return `<a class="cx-bld b-${b.id}" href="${b.id === 'office' ? '#now' : b.id === 'launch' ? '#work' : '#campus-' + b.id}"><span class="cx-bld-ico" aria-hidden="true">${{ office: '🏢', lab: '🔬', studio: '🎨', school: '🏫', family: '🏠', ministry: '🏛', launch: '🚀' }[b.id]}</span>
    <span><strong>${esc(b.name)}</strong><small>${p ? `${esc(p.name)}, ${esc(p.role)}` : esc(b.who)}</small><small class="muted">${esc(b.look)}</small></span>
    ${n === null ? '' : `<span class="cx-badge" aria-label="${plural(n, 'job')} here">${n}</span>`}</a>`;
}
function renderCampus() {
  const h = location.hash.slice(1), sub = h.replace(/^campus-?/, '');
  if (C3D.inst) { try { C3D.inst.dispose(); } catch (e) { } C3D.inst = null; }
  if (sub === 'lunch' || sub === 'coffee') return cxBreak(sub);
  if (sub === 'meeting') return cxMeetingPage();
  if (CX_BLD.some(b => b.id === sub && b.lead)) return cxBuilding(sub);
  const D = cxCampusData();
  view.innerHTML = `<div class="band cx-campus">
    <p class="eyebrow">Campus · from GitHub ${fmt(S.generated.at)}</p><h1>WhySteps campus</h1>
    ${cxLaunch().length ? cxLaunchBar() + cxFlatMap().replace('<a class="linkbtn" href="#campus">Open the 3D campus</a>', '') : ''}
    <h2>3D campus</h2><p class="small muted">Your office stays as it is. Six buildings stand beside it, joined by glowing lines in the order work travels. Press a building to go inside. Drag to turn and tilt (or use the arrow buttons), pinch or scroll to zoom.</p>
    <div class="cx-3d" id="cx3d"></div>
    <p class="small cx-legend"><span class="cx-line e-blue"></span>Blue: a job moving <span class="cx-line e-green"></span>Green: approved <span class="cx-line e-red"></span>Red: sent back <span class="cx-line e-grey"></span>Grey: quiet</p>
    <div class="cx-blds">${CX_BLD.map(cxBldCard).join('')}</div>
    <nav class="cx-go" aria-label="Breaks"><a class="ghost" href="#campus-lunch">🍽 Lunch</a><a class="ghost" href="#campus-coffee">☕ Coffee</a><button type="button" class="ghost" data-cxbreak="massage">🌸 Thai massage</button><a class="ghost" href="#work">← Work</a></nav>
    <p class="small muted">The lines: ${D.edges.map(e => `${esc(cxStop(e.a).name)} → ${esc(cxStop(e.b).name)}: ${{ blue: 'moving', green: 'approved', red: 'sent back', grey: 'quiet' }[e.s]}`).join(' · ')}</p>
  </div>`;
  cxMount3D();
}
function cxMount3D() {
  const host = document.getElementById('cx3d'); if (!host) return;
  if (window.__noCampus3D || !window.CAMPUS3D || !window.CAMPUS3D.supported()) { host.hidden = true; return; }
  try { C3D.inst = window.CAMPUS3D.create(host, cxCampusData(), id => { location.hash = id === 'office' ? 'now' : id === 'launch' ? 'work' : 'campus-' + id; }); }
  catch (e) { host.hidden = true; C3D.inst = null; }
}
addEventListener('campus3d-ready', () => { if (st.view === 'campus' && /^#?campus$/.test(location.hash || '#campus') && !C3D.inst) cxMount3D(); });

function cxBuilding(id) {
  const b = CX_BLD.find(x => x.id === id), p = CX_PEOPLE[b.lead], stop = cxStop(id);
  const door = id === 'school' ? CX.door : null, jobs = cxJobsAt(id, door);
  const doors = id === 'school' ? `<h2>Choose a door</h2><div class="cx-doors">${CX_DOORS.map(d => { const n = cxJobsAt('school', d.id).length, t = CX_PEOPLE[d.lead];
    return `<button type="button" class="cx-door" style="--door:${d.colour}" data-cxdoor="${d.id}" aria-pressed="${CX.door === d.id}"><strong>${esc(d.name)}</strong><span>${esc(t.name)}</span><small>${n ? plural(n, 'job') : 'No jobs here yet'}</small></button>`; }).join('')}</div>
    ${CX.door ? `<button class="linkbtn" type="button" data-cxdoor="">Show every door</button>` : ''}` : '';
  const studio = id === 'studio' ? `<h2>Before and after</h2>${(() => { const vis = cxJobs().flatMap(j => (j.pictures || (j.before && j.after ? [{ label: '', before: j.before, after: j.after }] : [])).map(x => ({ title: j.title + (x.label ? ': ' + x.label : ''), before: x.before, after: x.after, j })));
    return vis.length ? `<div class="cx-ba">${vis.map(j => `<figure class="cx-ba-one"><figcaption><strong>${esc(j.title)}</strong></figcaption><div class="cx-ba-pair"><figure><a href="${esc(j.before)}" target="_blank" rel="noopener"><img src="${esc(j.before)}" alt="Before: ${esc(j.title)}" loading="lazy"></a><figcaption>Before</figcaption></figure><figure><a href="${esc(j.after)}" target="_blank" rel="noopener"><img src="${esc(j.after)}" alt="After: ${esc(j.title)}" loading="lazy"></a><figcaption>After</figcaption></figure></div></figure>`).join('')}
      ${[...new Set(vis.map(x => x.j))].map(j => `<div class="cx-look"><p><strong>${esc(j.title)}</strong>: does it look right? <span class="small muted">(tap a picture to see it full size)</span></p><div class="row"><button class="primary" type="button" data-cxlook="${esc(j.id)}:ok">✅ Looks right</button><button class="ghost" type="button" data-cxlook="${esc(j.id)}:no">😡 Not right: redo it</button></div></div>`).join('')}</div>`
      : '<div class="empty small">No visual change has reached the Studio yet. Each one will come with a before and an after picture here (the first is "One set of text sizes and rounded corners").</div>'; })()}` : '';
  view.innerHTML = `<div class="band cx-inside b-${id}">
    <a class="ghost cx-back" href="#campus">← Back to campus</a>
    <p class="eyebrow">Inside the ${esc(b.name.replace(/^Design and Marketing /, ''))}</p><h1>${esc(b.name)}</h1>
    <div class="cx-lead">${CH.svg(CH.person(p.look), 56)}<div><p><strong>${esc(p.name)}, ${esc(p.role)}</strong></p><p class="small">"${esc(stop.question)}" · ${plural(cxJobsAt(id).length, 'job')} here</p><p class="small muted">Played by ${esc(p.ai)} (an AI role).</p></div></div>
    ${doors}
    <h2>${door ? `Jobs at ${esc(CX_DOORS.find(d => d.id === door).name)}` : `Jobs in the ${esc(b.name.replace(/^Design and Marketing /, ''))} now`}</h2>
    <div class="cx-cards">${jobs.map(j => cxJobCard(j)).join('') || `<div class="empty small">No job is here right now. ${id === 'lab' ? 'Jobs come here from the office once they are built.' : 'Jobs reach this building after the ones before it approve them.'}</div>`}</div>
    ${studio}
    <h2>Talk to ${esc(p.name)}</h2>${cxTalkHTML('b-' + id, [`${p.name} (${p.ai})`], `Talk to ${p.name} (${b.name})`, `${p.name}, ${p.role} (played by ${p.ai})`).replace(/data-cxsend=/, `data-cxai="${esc(p.ai)}" data-cxsend=`)}
  </div>`;
}
function cxMeetingPage() {
  view.innerHTML = `<div class="band"><a class="ghost cx-back" href="#work">← Back to work</a><p class="eyebrow">Meeting room</p><h1>Meeting room</h1>${cxMeetingHTML()}
    <p class="small muted">The full meeting room, with notes and Live Claude, is in <a href="#now">your 3D office</a>.</p></div>`;
}

/* ---------------------------------------------------------------- lunch and coffee (just for fun: work never pauses)
   Hiba, 26 Nov 2026: "the lunch I need it interactive, something more fun, not just icons around a table; the coffee
   break: where's the coffee machine; where's the Thai massage". Lunch: pick a Lebanese dish and serve it, tap anyone
   to hear them, raise a glass, bring dessert. Coffee: a real coffee machine brews for you and Kamel. A 🌸 Thai massage
   button opens the massage room in the 3D office. Everything stays on this device; nothing goes to GitHub. */
const CX_LUNCH = ['hiba', 'ibrahim', 'saad', 'tia', 'tala', 'ghina', 'inaam', 'omar', 'mohammad', 'walid', 'kamel'];
const CX_DISHES = {
  hummus: { name: 'Hummus', ico: '🫘', col: '#E8C98F' }, tabbouleh: { name: 'Tabbouleh', ico: '🌿', col: '#6FA85A' },
  fattoush: { name: 'Fattoush', ico: '🥗', col: '#9BC46B' }, kibbeh: { name: 'Kibbeh tray', ico: '🥧', col: '#9C6239' },
  manakish: { name: "Man'oushe", ico: '🫓', col: '#D9A75E' }, taouk: { name: 'Shish taouk', ico: '🍢', col: '#D9823B' },
  batata: { name: 'Batata harra', ico: '🥔', col: '#E3B34C' }, fruit: { name: 'Fruit plate', ico: '🍉', col: '#E0606B' } };
const CX_TALK = {
  hiba: ['Sahtein, everyone!', 'Eat first, work later.'],
  ibrahim: ['Lunch is on the plan: one hour, zero meetings.', 'I added "second helping" to the job list.', 'Status: plate moving, not done yet.'],
  omar: ['I tested this hummus three times. It passes.', 'Found a bug: the bread ran out.', 'Test result: the kibbeh is green.'],
  mohammad: ['Look at these colours! Tabbouleh green is my new favourite.', 'Can we make the plates a little rounder?', 'This table needs a before and after photo.'],
  saad: ['In my school everyone washes their hands first.', 'Ten out of ten for this kibbeh.', 'Quiet please: we are chewing.'],
  tia: ['Can I have the one shaped like a star?', 'Yummy! Can we sing a song?', 'I can count to ten olives!'],
  tala: ["Let's count the olives: one, two, three…", 'Fattoush has seven vegetables. I counted.', 'Why is hummus so smooth? Good question!'],
  ghina: ['Fun fact: chickpeas are full of protein.', 'Pass the lemon, please!', 'Compare: manakish or kibbeh? Both!'],
  inaam: ['Exam tip: always leave room for dessert.', 'Justify your answer: knafeh, because it is the best.', 'Evidence: everyone is smiling.'],
  walid: ['Parents ask: is it healthy? Mostly, yes.', 'Family lunch is the best feature.', 'Everyone feels welcome at this table.'],
  kamel: ['Officially approved: this lunch passes inspection.', 'The Ministry recommends a second plate.', 'Final audit: delicious.'] };
const CX_THANKS = ['Thank you, Hiba! Sahtein!', 'Mmm, my favourite!', 'Yum! Thank you!', 'Just what I wanted.', 'Wow, smells amazing!'];
const LU = { dish: null, plates: {}, say: {}, cheers: 0, dessert: false, served: 0, bread: null, last: null };
const CX_DRINKS = { lebanese: { name: 'Lebanese coffee', col: '#3B2416' }, espresso: { name: 'Espresso', col: '#4A2A16' },
  cappuccino: { name: 'Cappuccino', col: '#B07A52' }, latte: { name: 'Latte', col: '#C9A07C' }, tea: { name: 'Tea', col: '#B5651D' }, chocolate: { name: 'Hot chocolate', col: '#5A3420' } };
const KAMEL_SIPS = ['Ahh. Now we can talk about the launch.', 'Good coffee, good decisions.', 'The Ministry approves this cup.', 'One more sip, then back to work. Maybe.'];
const KC = { you: 'lebanese', kamel: 'lebanese', stage: 'choose', sips: 0, say: {} };
let cxBubbleT = null;

function cxSeat(k, x, y, s) {
  const p = CX_PEOPLE[k], inner = k === 'hiba' ? CH.FOUNDER : CH.person(p.look), name = k === 'hiba' ? 'You' : p.name;
  return `<g class="cx-seat" data-cxseat="${k}" transform="translate(${x} ${y})"><g class="cx-body" transform="translate(${-45 * s} ${-120 * s}) scale(${s})">${inner}</g>
    <rect x="-30" y="4" width="60" height="18" rx="9" fill="var(--paper)" stroke="var(--line)"/><text x="0" y="17" text-anchor="middle" font-size="11" font-family="DM Sans, sans-serif" font-weight="700" fill="var(--ink)">${esc(name)}</text></g>`;
}
function cxWrap(t, max) { const out = []; let line = ''; for (const w of String(t).split(' ')) { if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out.slice(0, 3); }
function cxBubble(x, y, text, W) {
  const lines = cxWrap(text, 24), w = Math.min(190, Math.max(...lines.map(l => l.length)) * 6.6 + 20), h = lines.length * 15 + 12;
  const bx = Math.max(6, Math.min(W - w - 6, x - w / 2)), by = Math.max(6, y - h);
  return `<g class="cx-bub"><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="10" fill="#FFFDF7" stroke="#B98B67" stroke-width="1.5"/>
    <path d="M${Math.max(bx + 12, Math.min(bx + w - 12, x)) - 6} ${by + h - 1} l6 8 l6 -8" fill="#FFFDF7" stroke="#B98B67" stroke-width="1.5"/><rect x="${Math.max(bx + 12, Math.min(bx + w - 12, x)) - 7}" y="${by + h - 3}" width="14" height="3" fill="#FFFDF7"/>
    ${lines.map((l, i) => `<text x="${bx + w / 2}" y="${by + 18 + i * 15}" text-anchor="middle" font-size="12" font-family="DM Sans, sans-serif" fill="#1D3339">${esc(l)}</text>`).join('')}</g>`;
}
function cxSay(map, k, text) { map[k] = text; }
/* Hiba, 26 Nov 2026: "In lunch I need to scroll down from my phone to be able to press things. I want to see what goes on
   on the table and make us closer to each other. Make the table rectangular, same as a family lunch table. More creative."
   A long family table seen from the front: five people along the back, four along the front, Hiba at the head and Kamel
   at the foot, close together. Plates show what each person got; hot dishes steam; the bread basket goes hand to hand;
   whoever was just served leans in. On a phone the table and every button fit on one screen. */
const LW = 560, LH = 442, LT = { x: 78, y: 168, w: 404, h: 150 };
const LSEAT = (() => { const o = {}, top = ['ibrahim', 'saad', 'tia', 'tala', 'ghina'], bot = ['inaam', 'omar', 'mohammad', 'walid'];
  top.forEach((k, i) => { const x = 122 + i * 79; o[k] = { x, y: 196, top: 96, px: x, py: 196, side: 't' }; });
  bot.forEach((k, i) => { const x = 160 + i * 80; o[k] = { x, y: 436, top: 318, px: x, py: 296, side: 'b' }; });
  o.hiba = { x: 40, y: 330, top: 220, px: 106, py: 246, side: 'l' }; o.kamel = { x: 520, y: 330, top: 220, px: 454, py: 246, side: 'r' };
  return o; })();
const LDISH = (() => { const o = {}; Object.keys(CX_DISHES).forEach((id, i) => { o[id] = { x: [160, 228, 332, 400][i % 4], y: i < 4 ? 228 : 266 }; }); return o; })();
const CX_HOT = { kibbeh: 1, taouk: 1, batata: 1, manakish: 1 };
const CX_BREAD = ['hiba', 'ibrahim', 'saad', 'tia', 'tala', 'ghina', 'kamel', 'walid', 'mohammad', 'omar', 'inaam'];
const CX_BREAD_SAY = ['Bread, please!', 'Pass it on!', 'Still warm!', 'Just one piece…', 'Here you go!'];
function cxLunchSeat(k) {
  const p = LSEAT[k], s = .74, inner = k === 'hiba' ? CH.FOUNDER : CH.person(CX_PEOPLE[k].look), name = k === 'hiba' ? 'You' : CX_PEOPLE[k].name;
  const lean = LU.last === k ? (p.side === 't' ? ' lean-d' : p.side === 'b' ? ' lean-u' : p.side === 'l' ? ' lean-r' : ' lean-l') : '';
  const ty = p.side === 't' ? p.top - 4 : p.y - 6;
  return `<g class="cx-seat${lean}" data-cxseat="${k}" role="button" tabindex="-1" aria-label="${esc(name)}"><g class="cx-body" transform="translate(${p.x - 45 * s} ${p.top}) scale(${s})">${inner}</g>
    <rect x="${p.x - 30}" y="${ty - 13}" width="60" height="17" rx="8.5" fill="var(--paper)" stroke="var(--line)"/><text x="${p.x}" y="${ty}" text-anchor="middle" font-size="11" font-family="DM Sans, sans-serif" font-weight="700" fill="var(--ink)">${esc(name)}</text></g>`;
}
function cxLunchSVG() {
  const T0 = LT, steam = (x, y) => `<path class="cx-steam" d="M${x - 6} ${y - 12} q4 -6 0 -12 M${x} ${y - 13} q4 -6 0 -12 M${x + 6} ${y - 12} q4 -6 0 -12" stroke="#B4B2A9" stroke-width="1.6" fill="none"/>`;
  const plate = k => { const p = LSEAT[k], d = LU.plates[k] || [];
    return `<g class="cx-plate" data-cxseat="${k}"><ellipse cx="${p.px}" cy="${p.py + 2}" rx="21" ry="9" fill="#00000014"/><ellipse cx="${p.px}" cy="${p.py}" rx="21" ry="9" fill="#fff" stroke="#D3C7B3"/><ellipse cx="${p.px}" cy="${p.py}" rx="14" ry="5.5" fill="none" stroke="#EFE7DA"/>
      ${d.slice(-3).map((id, j) => `<ellipse class="cx-food" cx="${p.px - 8 + j * 8}" cy="${p.py - 1}" rx="6.5" ry="3.8" fill="${CX_DISHES[id].col}"/>`).join('')}
      <g class="cx-glass${LU.cheers ? ' up' : ''}" style="--d:${(CX_LUNCH.indexOf(k) * 60)}ms"><rect x="${p.px + 22}" y="${p.py - 15}" width="8" height="13" rx="2" fill="#E9F4F8" stroke="#8FB3C0"/><rect x="${p.px + 23}" y="${p.py - 10}" width="6" height="7" fill="#F2B04A" opacity=".8"/></g></g>`; };
  const deco = { hummus: (x, y) => `<path d="M${x - 9} ${y - 1} q9 -5 18 0" stroke="#C9A25E" fill="none"/><circle cx="${x}" cy="${y - 1}" r="2" fill="#7A9A3A"/>`, tabbouleh: (x, y) => `<circle cx="${x - 6}" cy="${y}" r="1.6" fill="#E0606B"/><circle cx="${x + 5}" cy="${y - 2}" r="1.6" fill="#E0606B"/>`,
    fattoush: (x, y) => `<rect x="${x - 7}" y="${y - 4}" width="5" height="4" fill="#E3C28A"/><circle cx="${x + 5}" cy="${y}" r="2" fill="#E0606B"/>`, kibbeh: (x, y) => `<path d="M${x - 10} ${y - 3} l20 4 M${x - 10} ${y + 1} l20 -4" stroke="#6E4224"/>`,
    manakish: (x, y) => `<circle cx="${x - 4}" cy="${y}" r="1.3" fill="#5C7A2E"/><circle cx="${x + 3}" cy="${y - 2}" r="1.3" fill="#5C7A2E"/><circle cx="${x + 6}" cy="${y + 1}" r="1.3" fill="#5C7A2E"/>`, taouk: (x, y) => `<path d="M${x - 12} ${y} h24" stroke="#8C6446" stroke-width="1.5"/><circle cx="${x - 5}" cy="${y}" r="2.6" fill="#B8642A"/><circle cx="${x + 3}" cy="${y}" r="2.6" fill="#B8642A"/>`,
    batata: (x, y) => `<rect x="${x - 6}" y="${y - 3}" width="4" height="4" fill="#C98F2A"/><rect x="${x + 2}" y="${y - 2}" width="4" height="4" fill="#C98F2A"/><circle cx="${x}" cy="${y - 3}" r="1.2" fill="#3F7F3A"/>`, fruit: (x, y) => `<path d="M${x - 8} ${y + 2} a8 6 0 0 1 16 0z" fill="#E0606B" stroke="#4F9A4F"/><circle cx="${x + 9}" cy="${y - 1}" r="2.6" fill="#F2C14E"/>` };
  const dishes = Object.keys(CX_DISHES).map(id => { const { x, y } = LDISH[id], d = CX_DISHES[id], on = LU.dish === id;
    return `<g class="cx-dish${on ? ' on' : ''}" data-cxdish="${id}" aria-label="${esc(d.name)}"><ellipse cx="${x}" cy="${y + 3}" rx="28" ry="12" fill="#00000018"/><ellipse cx="${x}" cy="${y}" rx="27" ry="12" fill="#FFFBF2" stroke="${on ? '#2A6F6A' : '#CDBFA6'}" stroke-width="${on ? 3 : 1.5}"/><ellipse cx="${x}" cy="${y - 1}" rx="19" ry="7.5" fill="${d.col}"/>${deco[id](x, y - 1)}${CX_HOT[id] ? steam(x, y) : ''}</g>`; }).join('');
  const holder = LU.bread == null ? null : CX_BREAD[LU.bread % CX_BREAD.length], bp = holder ? LSEAT[holder] : { px: 280, py: 247 };
  const bx = holder ? bp.px + (bp.side === 'r' ? -2 : bp.side === 'l' ? 2 : -30) : 280, by = holder ? bp.py + (bp.side === 't' ? 22 : bp.side === 'b' ? -22 : 26) : 247;
  const bread = LU.dessert ? '' : `<g class="cx-bread${holder ? ' moving' : ''}" data-cxlu="bread" aria-label="Bread basket"><ellipse cx="${bx}" cy="${by + 3}" rx="20" ry="8" fill="#00000018"/><path d="M${bx - 19} ${by - 4} h38 l-5 11 h-28z" fill="#B98B4E" stroke="#8C6446"/><path d="M${bx - 19} ${by - 4} h38" stroke="#E8D3A8" stroke-width="2"/><ellipse cx="${bx - 6}" cy="${by - 6}" rx="9" ry="4" fill="#E4C38A"/><ellipse cx="${bx + 7}" cy="${by - 7}" rx="8" ry="3.6" fill="#D9AE6C"/></g>`;
  const dessert = LU.dessert ? `<g class="cx-dessert"><rect x="236" y="234" width="88" height="30" rx="6" fill="#B7B9BE"/><rect x="241" y="237" width="78" height="22" rx="4" fill="#E8A33D"/><path d="M247 243 h66 M247 251 h66" stroke="#7FB069" stroke-width="2" stroke-dasharray="2 4"/><text x="280" y="253" text-anchor="middle" font-size="12" font-weight="700" font-family="DM Sans, sans-serif" fill="#5A2A08">Knafeh!</text>${steam(280, 236)}</g>` : '';
  const confetti = LU.cheers ? Array.from({ length: 26 }, (_, i) => `<rect class="cx-conf" x="${20 + (i * 97) % 520}" y="-10" width="7" height="11" rx="2" fill="${['#E6A16F', '#2A6F6A', '#F2C14E', '#8E6CD9', '#E0606B', '#5DA9E9'][i % 6]}" style="--d:${(i % 9) * 90}ms;--x:${(i % 5 - 2) * 14}px"/>`).join('') : '';
  const bubbles = Object.entries(LU.say).map(([k, t]) => cxBubble(LSEAT[k].x, LSEAT[k].top - (LSEAT[k].side === 't' ? 20 : 2), t, LW)).join('');
  const back = ['ibrahim', 'saad', 'tia', 'tala', 'ghina'], front = ['inaam', 'omar', 'mohammad', 'walid'];
  return `<svg viewBox="0 0 ${LW} ${LH}" class="cx-break-svg cx-lunch-svg" role="img" aria-label="A long family table with 11 seats: you at the head, Kamel at the foot, Ibrahim, Saad, Tia, Tala and Ghina along the back, Inaam, Omar, Mohammad and Walid along the front, with Lebanese dishes in the middle${LU.dessert ? ' and a tray of knafeh' : ''}. ${LU.served} plates served.">
    <rect width="${LW}" height="${LH}" rx="18" fill="light-dark(#FBF3E8,#2A2218)"/>
    <rect y="0" width="${LW}" height="150" rx="18" fill="light-dark(#F4E6D3,#30271C)"/>
    <g opacity=".6"><rect x="24" y="22" width="92" height="58" rx="6" fill="#CFE6F2" stroke="#B98B67" stroke-width="4"/><path d="M70 22v58M24 51h92" stroke="#B98B67" stroke-width="3"/><circle cx="96" cy="40" r="8" fill="#F2C14E"/>
      <path d="M470 36 q24 -12 48 0 q-24 12 -48 0z" fill="#7FB069"/><path d="M494 36 v48" stroke="#8C6446" stroke-width="3"/><rect x="482" y="82" width="24" height="20" rx="4" fill="#C77C2E"/></g>
    ${[200, 280, 360].map(x => `<g class="cx-lamp"><path d="M${x} 0 v24" stroke="#5F5E5A" stroke-width="1.5"/><path d="M${x - 16} 36 q16 -18 32 0z" fill="#E6A16F"/><ellipse cx="${x}" cy="37" rx="7" ry="3" fill="#FFF3C4"/></g>`).join('')}
    ${back.map(cxLunchSeat).join('')}
    <rect x="${T0.x}" y="${T0.y + 8}" width="${T0.w}" height="${T0.h}" rx="10" fill="#9C6F4A"/>
    <rect class="cx-table" x="${T0.x}" y="${T0.y}" width="${T0.w}" height="${T0.h}" rx="10" fill="#E8D8BE" stroke="#B98B67" stroke-width="2"/>
    <rect x="${T0.x + 70}" y="${T0.y}" width="${T0.w - 140}" height="${T0.h}" fill="#F6EEDF" opacity=".75"/><path d="M${T0.x + 70} ${T0.y} v${T0.h} M${T0.x + T0.w - 70} ${T0.y} v${T0.h}" stroke="#E0606B" stroke-width="2" stroke-dasharray="6 5" opacity=".55"/>
    <rect x="${T0.x + 20}" y="${T0.y + T0.h + 8}" width="10" height="34" fill="#8C6446"/><rect x="${T0.x + T0.w - 30}" y="${T0.y + T0.h + 8}" width="10" height="34" fill="#8C6446"/>
    ${CX_LUNCH.map(plate).join('')}${dishes}${dessert}${bread}
    ${['hiba', 'kamel'].map(cxLunchSeat).join('')}${front.map(cxLunchSeat).join('')}${bubbles}${confetti}</svg>`;
}
function cxLunchSide() {
  const d = LU.dish && CX_DISHES[LU.dish], n = CX_LUNCH.length - 1;
  const score = LU.served ? `🍽 ${plural(CX_LUNCH.filter(k => k !== 'hiba' && (LU.plates[k] || []).length).length, 'person', 'people')} of ${n} served · ${plural(LU.served, 'dish', 'dishes')} passed round${CX_LUNCH.every(k => k === 'hiba' || (LU.plates[k] || []).length) ? ' · everyone is eating!' : ''}` : 'Nobody has food yet. Start passing dishes round!';
  return `<div class="cx-play">
    <p class="cx-hint small" aria-live="polite"><strong>${d ? `Tap someone to give them the ${esc(d.name.toLowerCase())}` : 'Pick a dish, then tap a person'}</strong> · <span class="cx-score">${score}</span></p>
    <p class="cx-step"><strong>1. Pick a dish</strong> <span class="muted small">(or tap one on the table)</span></p>
    <div class="cx-chips cx-strip" role="group" aria-label="Dishes">${Object.entries(CX_DISHES).map(([id, x]) => `<button type="button" class="opt cx-chip" data-cxdish="${id}" aria-pressed="${LU.dish === id}"><span aria-hidden="true">${x.ico}</span> ${esc(x.name)}</button>`).join('')}</div>
    <p class="cx-step"><strong>2. ${d ? `Serve the ${esc(d.name.toLowerCase())} to someone` : 'Tap someone to hear them talk'}</strong> <span class="muted small">(or tap them at the table)</span></p>
    <div class="cx-chips cx-strip" role="group" aria-label="${d ? 'Serve to' : 'Talk to'}">${CX_LUNCH.filter(k => k !== 'hiba').map(k => `<button type="button" class="ghost cx-chip" data-cxseat="${k}">${esc(CX_PEOPLE[k].name)}${(LU.plates[k] || []).length ? ` <span class="cx-n" aria-label="${plural(LU.plates[k].length, 'dish', 'dishes')} on the plate">${LU.plates[k].length}</span>` : ''}</button>`).join('')}</div>
    <div class="cx-fun cx-acts"><button type="button" class="primary" data-cxlu="all">🙌 <span>Pass round</span></button><button type="button" class="ghost" data-cxlu="bread">🥖 <span>Bread</span></button><button type="button" class="ghost" data-cxlu="cheers">🥂 <span>Cheers</span></button><button type="button" class="ghost" data-cxlu="dessert"${LU.dessert ? ' aria-pressed="true"' : ''}>🍰 <span>${LU.dessert ? 'Knafeh!' : 'Dessert'}</span></button><button type="button" class="ghost" data-cxlu="reset">🧽 <span>Clear</span></button></div>
  </div>`;
}
function cxCoffeeSVG() {
  const W = 700, H = 380, you = CX_DRINKS[KC.you], km = CX_DRINKS[KC.kamel], brewing = KC.stage === 'brewing', onTable = KC.stage === 'drinking' || KC.stage === 'done';
  const tx = 470, ty = 250, level = KC.stage === 'done' ? 0 : Math.max(0, 1 - KC.sips / KAMEL_SIPS.length);
  const cup = (x, y, d, lv, cls = '') => `<g class="cx-cup ${cls}" transform="translate(${x} ${y})"><rect x="0" y="0" width="24" height="20" rx="4" fill="#fff" stroke="#5A3420" stroke-width="1.6"/><rect x="2" y="${2 + 16 * (1 - lv)}" width="20" height="${16 * lv}" fill="${d.col}"/><path d="M24 5 q8 0 8 6 t-8 6" fill="none" stroke="#5A3420" stroke-width="1.6"/>${lv > 0 ? '<path class="cx-steam" d="M7 -4 q3 -6 0 -11 M15 -4 q3 -6 0 -11" stroke="#B4B2A9" stroke-width="1.6" fill="none"/>' : ''}</g>`;
  const machine = `<g class="cx-machine" aria-hidden="true"><rect x="40" y="200" width="250" height="20" rx="4" fill="#B98B67"/><rect x="40" y="220" width="250" height="110" fill="#E3CFB3"/>
    <rect x="70" y="70" width="160" height="132" rx="14" fill="#2C2C2A"/><rect x="84" y="82" width="132" height="34" rx="6" fill="#16343A"/>
    <text x="150" y="97" text-anchor="middle" font-size="10" font-family="DM Sans, sans-serif" fill="#BFE7D3">${brewing ? 'Brewing…' : onTable ? 'Enjoy!' : 'Ready'}</text>
    <text x="150" y="110" text-anchor="middle" font-size="9" font-family="DM Sans, sans-serif" fill="#BFE7D3">${esc(you.name)} + ${esc(km.name)}</text>
    <circle cx="104" cy="132" r="6" fill="${brewing ? '#3FD18B' : '#E0606B'}"/><circle cx="124" cy="132" r="6" fill="#F2C14E"/><rect x="140" y="126" width="62" height="12" rx="6" fill="#444441"/>
    <rect x="112" y="146" width="76" height="14" rx="4" fill="#5F5E5A"/><rect x="124" y="160" width="10" height="10" fill="#5F5E5A"/><rect x="166" y="160" width="10" height="10" fill="#5F5E5A"/>
    ${brewing ? `<rect class="cx-pour" x="127" y="170" width="4" height="22" fill="${you.col}"/><rect class="cx-pour" x="169" y="170" width="4" height="22" fill="${km.col}"/>` : ''}
    <rect x="96" y="196" width="108" height="6" rx="3" fill="#888780"/>
    ${brewing || KC.stage === 'ready' ? cup(118, 176, you, brewing ? .5 : 1, brewing ? 'filling' : '') + cup(160, 176, km, brewing ? .5 : 1, brewing ? 'filling' : '') : ''}
    <rect x="248" y="150" width="30" height="50" rx="4" fill="#FFFBF2" stroke="#CDBFA6"/><text x="263" y="172" text-anchor="middle" font-size="9" font-family="DM Sans, sans-serif" fill="#7A5A3B">cups</text>
    <text x="165" y="58" text-anchor="middle" font-size="13" font-weight="700" font-family="DM Sans, sans-serif" fill="#7A3F14">The coffee machine</text></g>`;
  const bubbles = Object.entries(KC.say).map(([k, t]) => cxBubble(k === 'hiba' ? tx - 85 : tx + 85, ty - 92, t, W)).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="cx-break-svg cx-coffee-svg" role="img" aria-label="The coffee corner: a coffee machine on the counter, and a small table where you and Kamel sit. ${brewing ? 'The machine is brewing.' : onTable ? 'Your cups are on the table.' : ''}">
    <rect width="${W}" height="${H}" rx="18" fill="light-dark(#F4EDE4,#26201A)"/>${machine}
    ${cxSeat('hiba', tx - 85, ty + 16, .58)}${cxSeat('kamel', tx + 85, ty + 16, .58)}
    <ellipse cx="${tx}" cy="${ty + 8}" rx="80" ry="26" fill="#8C6446"/><ellipse cx="${tx}" cy="${ty}" rx="80" ry="26" fill="#C9A27C" stroke="#8C6446" stroke-width="2"/><rect x="${tx - 5}" y="${ty + 26}" width="10" height="70" fill="#8C6446"/>
    ${onTable ? cup(tx - 46, ty - 16, you, level) + cup(tx + 20, ty - 16, km, level) : `<text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="11" font-family="DM Sans, sans-serif" fill="#5A3A1E">${KC.stage === 'ready' ? 'Bring the cups over!' : 'Waiting for coffee…'}</text>`}
    ${bubbles}</svg>`;
}
function cxCoffeeSide() {
  const pick = (who, label) => `<p class="cx-step"><strong>${label}</strong></p><div class="cx-chips" role="group" aria-label="${label}">${Object.entries(CX_DRINKS).map(([id, d]) => `<button type="button" class="opt cx-chip" data-cxdrink="${who}:${id}" aria-pressed="${KC[who] === id}"${KC.stage === 'choose' ? '' : ' disabled'}>${esc(d.name)}</button>`).join('')}</div>`;
  const act = KC.stage === 'choose' ? `<button type="button" class="primary" data-cxco="brew">☕ Brew both cups</button>`
    : KC.stage === 'brewing' ? `<button type="button" class="primary" disabled>Brewing…</button>`
    : KC.stage === 'ready' ? `<button type="button" class="primary" data-cxco="take">Take the cups to the table</button>`
    : KC.stage === 'drinking' ? `<button type="button" class="primary" data-cxco="sip">Take a sip</button><button type="button" class="ghost" data-cxco="clink">🥂 Clink cups</button>`
    : `<button type="button" class="primary" data-cxco="again">Another round</button>`;
  return `<div class="cx-play">${pick('you', '1. Your drink')}${pick('kamel', "2. Kamel's drink")}
    <p class="small cx-score" aria-live="polite">${{ choose: 'Choose, then press Brew.', brewing: 'The machine is pouring your ' + CX_DRINKS[KC.you].name.toLowerCase() + '…', ready: 'Both cups are ready.', drinking: plural(KC.sips, 'sip') + ' so far.', done: 'All finished. Kamel enjoyed it.' }[KC.stage]}</p>
    <div class="row cx-fun">${act}</div></div>`;
}
function cxBreakNav(kind) {
  return `<nav class="row cx-go" aria-label="Breaks">${kind === 'lunch' ? '' : '<a class="ghost" href="#campus-lunch">🍽 Lunch</a>'}${kind === 'coffee' ? '' : '<a class="ghost" href="#campus-coffee">☕ Coffee</a>'}<button type="button" class="ghost" data-cxbreak="massage">🌸 Thai massage</button><a class="primary" href="#work">Back to work</a></nav>`;
}
function cxBreak(kind) {
  const lunch = kind === 'lunch';
  view.innerHTML = `<div class="band cx-break cx-${kind}">
    <div class="cx-bh"><a class="ghost cx-back" href="#campus" aria-label="Back to campus">← <span>Back to campus</span></a><div><p class="eyebrow">${lunch ? 'Lunch' : 'Coffee'} · just for fun</p><h1>${lunch ? 'Family lunch' : 'Coffee with Kamel'}</h1></div></div>
    <div class="cx-break-grid"><div id="cxScene">${lunch ? cxLunchSVG() : cxCoffeeSVG()}</div><div id="cxSide">${lunch ? cxLunchSide() : cxCoffeeSide()}</div></div>
    <p>${lunch ? 'Eleven seats at one long family table: you at the head, Kamel at the foot, and Ibrahim, Saad, Tia, Tala, Ghina, Inaam, Omar, Mohammad and Walid close together along the sides. Pick a dish and serve it, pass the bread basket hand to hand, tap anyone to hear them, raise a glass.' : 'Only Kamel, the Minister of Education, joins you for coffee. Choose your drinks and the machine brews them. The full coffee room is also in <button type="button" class="linkbtn" data-cxbreak="coffee">your 3D office</button>.'} <strong>Work never pauses:</strong> the three AI keep working while you ${lunch ? 'eat' : 'drink'}, and nothing here goes to GitHub.</p>
    ${cxBreakNav(kind)}
  </div>`;
}
function cxRedraw(kind) {
  const sc = document.getElementById('cxScene'), sd = document.getElementById('cxSide'); if (!sc || !sd) return cxBreak(kind);
  const f = document.activeElement, key = f && f.closest('#cxSide') ? [...f.attributes].filter(a => a.name.startsWith('data-cx')).map(a => `[${a.name}="${a.value}"]`).join('') : '';
  sc.innerHTML = kind === 'lunch' ? cxLunchSVG() : cxCoffeeSVG(); sd.innerHTML = kind === 'lunch' ? cxLunchSide() : cxCoffeeSide();
  if (key) { const again = sd.querySelector(key); if (again && !again.disabled) again.focus(); else sd.querySelector('button:not([disabled])')?.focus(); }
  clearTimeout(cxBubbleT); if (Object.keys(kind === 'lunch' ? LU.say : KC.say).length) cxBubbleT = setTimeout(() => { LU.say = {}; KC.say = {}; document.querySelectorAll('#cxScene .cx-bub').forEach(b => b.remove()); }, 2800);
}
const cxPickLine = (k) => { const l = CX_TALK[k]; LU.talk = LU.talk || {}; const i = LU.talk[k] = ((LU.talk[k] ?? -1) + 1) % l.length; return l[i]; };
function cxServe(k, id) { (LU.plates[k] = LU.plates[k] || []).push(id); LU.served++; }
function cxLunchTap(k) {
  LU.say = {};
  if (k === 'hiba') { LU.say.hiba = cxPickLine('hiba'); return; }
  if (LU.dish) { LU.last = k; cxServe(k, LU.dish); LU.say[k] = CX_THANKS[LU.served % CX_THANKS.length].replace('!', ` for the ${CX_DISHES[LU.dish].name.toLowerCase()}!`).replace('Thank you, Hiba for', 'Thank you, Hiba, for'); }
  else LU.say[k] = cxPickLine(k);
}
function cxLunchAct(a) {
  LU.say = {}; LU.last = null;
  if (a === 'bread') { LU.bread = LU.bread == null ? 0 : (LU.bread + 1) % CX_BREAD.length; const k = CX_BREAD[LU.bread]; LU.last = k; LU.say[k] = k === 'hiba' ? 'Bread for everyone!' : CX_BREAD_SAY[LU.bread % CX_BREAD_SAY.length]; }
  if (a === 'all') { const ids = Object.keys(CX_DISHES); CX_LUNCH.filter(k => k !== 'hiba').forEach((k, i) => cxServe(k, LU.dish || ids[(i + LU.served) % ids.length])); LU.say.hiba = 'Sahtein, everyone!'; LU.say.saad = 'Sahtein!'; LU.say.kamel = 'Thank you, Hiba!'; toast('🙌 A plate for everyone. Sahtein!'); }
  if (a === 'cheers') { LU.cheers++; ['hiba', 'ibrahim', 'tia', 'omar', 'walid'].forEach(k => { LU.say[k] = 'Cheers!'; }); LU.say.hiba = 'To WhySteps! Cheers!'; }
  if (a === 'dessert') { LU.dessert = true; LU.say.inaam = 'Told you: always leave room for dessert!'; LU.say.tia = 'Knafeh! Yay!'; }
  if (a === 'reset') { LU.plates = {}; LU.served = 0; LU.dessert = false; LU.cheers = 0; LU.dish = null; LU.bread = null; LU.last = null; toast('🧽 Table cleared. Ready for the next lunch.'); }
}
function cxCoffeeAct(a) {
  KC.say = {};
  if (a === 'brew') { KC.stage = 'brewing'; KC.sips = 0; clearTimeout(KC.t); KC.t = setTimeout(() => { if (KC.stage !== 'brewing') return; KC.stage = 'ready'; KC.say.kamel = 'Smells wonderful!'; if (document.getElementById('cxScene')) cxRedraw('coffee'); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 1800); }
  if (a === 'take') { KC.stage = 'drinking'; KC.say.hiba = 'Here you go, Kamel.'; KC.say.kamel = 'Thank you, Hiba!'; }
  if (a === 'sip') { KC.say.kamel = KAMEL_SIPS[KC.sips % KAMEL_SIPS.length]; KC.sips++; if (KC.sips >= KAMEL_SIPS.length) KC.stage = 'done'; }
  if (a === 'clink') { KC.say.hiba = 'Cheers!'; KC.say.kamel = 'To the launch!'; }
  if (a === 'again') { KC.stage = 'choose'; KC.sips = 0; }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-cxseat],[data-cxdish],[data-cxlu],[data-cxdrink],[data-cxco],[data-cxbreak]'); if (!t) return;
  if (t.dataset.cxbreak) return K.goBreak && K.goBreak(t.dataset.cxbreak);
  if (!t.closest('.cx-break')) return;
  const kind = t.closest('.cx-lunch') ? 'lunch' : 'coffee';
  if (t.dataset.cxdish) { LU.dish = LU.dish === t.dataset.cxdish ? null : t.dataset.cxdish; LU.say = {}; }
  else if (t.dataset.cxseat && kind === 'lunch') cxLunchTap(t.dataset.cxseat);
  else if (t.dataset.cxseat) { KC.say = {}; KC.say[t.dataset.cxseat] = t.dataset.cxseat === 'kamel' ? KAMEL_SIPS[(KC.sips + 1) % KAMEL_SIPS.length] : 'Ahh, coffee time.'; }
  else if (t.dataset.cxlu) cxLunchAct(t.dataset.cxlu);
  else if (t.dataset.cxdrink) { const [w, id] = t.dataset.cxdrink.split(':'); KC[w] = id; }
  else if (t.dataset.cxco) cxCoffeeAct(t.dataset.cxco);
  cxRedraw(kind);
});

/* ---------------------------------------------------------------- clicks for the campus screens */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-cxjob],[data-cxall],[data-cxask],[data-cxto],[data-cxsend],[data-cxdoor],[data-cxlook]'); if (!t) return;
  if (t.dataset.cxjob) return cxJobSheet(t.dataset.cxjob);
  if (t.dataset.cxall) { CX.allJobs = t.dataset.cxall === '1'; const y = scrollY; renderWork(); scrollTo(0, y); return; }
  if (t.dataset.cxask) return cxAskSheet(t.dataset.cxask);
  if (t.dataset.cxto) { CX.to[t.dataset.cxkey] = t.dataset.cxto; t.closest('[role=radiogroup]').querySelectorAll('[data-cxto]').forEach(b => { const on = b === t; b.setAttribute('aria-checked', on); b.setAttribute('aria-pressed', on); }); return; }
  if (t.dataset.cxsend) return cxSend(t);
  if (t.dataset.cxlook) { const [id, v] = t.dataset.cxlook.split(':'), j = cxJobs().find(x => x.id === id); if (!j) return;
    const text = v === 'ok' ? `✅ Looks right: "${j.title}" is approved at the Studio. Move it on to the next building.` : `😡 Not right: redo "${j.title}" 100%, then bring new before and after pictures.`;
    const b = body({ to: j.owner, project: 'Studio: ' + j.title, text }), title = (v === 'ok' ? 'Studio ✅ ' : 'Studio 😡 ') + j.title;
    sendOut({ kind: 'message', title, body: b, labels: v === 'ok' ? 'command-center' : 'command-center,not-done-properly' }, () => { openGH(newIssueURL(title, b, v === 'ok' ? 'command-center' : 'command-center,not-done-properly')); toast('🚀 GitHub opened with your answer. Press the green Submit there.'); });
    const box = t.closest('.cx-look'); if (box) box.innerHTML = `<p class="cx-sent">${v === 'ok' ? '✅ Thank you! Your answer is in your 📮 box: the job moves on once it reaches GitHub.' : '😡 Sent back. Your answer is in your 📮 box; Claude Onsi redoes it.'}</p>`; return; }
  if (t.hasAttribute('data-cxdoor')) { CX.door = t.dataset.cxdoor || null; const y = scrollY; cxBuilding('school'); scrollTo(0, y); }
});
return { renderWork, renderCampus, cxOfficeJobs, cxMeetingHTML };
};
