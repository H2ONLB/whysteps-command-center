/* WhySteps HQ in 3D (Hiba, 23 Nov 2026): a two-floor building drawn with three.js (kept copy in vendor/).
   Floor 1: the 9 team rooms. Floor 2: Hiba's office with her desk and the 📮 mailbox, the AI lab,
   the meeting room, the coffee lounge and the command center. A team member climbs the stairs to her desk.
   This module only draws and animates; app.js owns the data, the panels and every action.
   It shows only what app.js passes in (from the GitHub snapshot); it never invents activity. */
import * as T from './vendor/three/r187/three.module.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)');
const Y2 = 7.6;                         // height of floor 2
const F2 = new T.Vector3(-6, 0, -5);    // floor 2 offset from floor 1
const STAIR_X = -10.2, STAIR_N = 16, STAIR_RUN = 0.62;
const STAIR_Z0 = -2.5 + STAIR_N * STAIR_RUN; // bottom of the stairs (front)
const DESK = new T.Vector3(1.5 + F2.x, Y2, -2 + F2.z);        // Hiba's desk (world)
const ASK_SPOT = new T.Vector3(DESK.x - 1.05, Y2, DESK.z + 1.25);     // where the visitor stands
const ROOM_POS = {                      // labels sit on walls and floor edges, away from people's heads
  office: new T.Vector3(1.5 + F2.x, Y2 + .15, .75 + F2.z), ai: new T.Vector3(1.5 + F2.x, Y2 + 2.75, -7.35 + F2.z),
  coffee: new T.Vector3(-4.85 + F2.x, Y2 + 2.5, -4.6 + F2.z), meeting: new T.Vector3(6.2 + F2.x, Y2 + 2.75, -7.35 + F2.z),
  board: new T.Vector3(6.2 + F2.x, Y2 + .15, 2.35 + F2.z) };
const ROOM_NAMES = { office: 'My office', ai: 'AI lab', coffee: 'Coffee lounge', meeting: 'Meeting room', board: 'Command center' };
const VIEWS = { whole: { t: new T.Vector3(-3, 3.3, -1), z: 1 }, f2: { t: new T.Vector3(-4.4, 12.4, -6.2), z: 1.95 }, f1: { t: new T.Vector3(0, 0.6, 0.5), z: 1.45 } };

function supported() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

function create(host, H) {
  const root = document.createElement('div'); root.className = 'hq3d'; host.append(root);
  const r = new T.WebGLRenderer({ antialias: true, alpha: false });
  r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = T.PCFShadowMap;
  r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = T.SRGBColorSpace;
  r.domElement.setAttribute('aria-hidden', 'true'); root.append(r.domElement);
  const ui = document.createElement('div'); ui.className = 'hq-ui'; root.append(ui);
  const ptr = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ptr.setAttribute('class', 'hq-ptr'); ptr.setAttribute('aria-hidden', 'true');
  ptr.innerHTML = '<path fill="none" stroke="#534AB7" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"/><circle r="5" fill="#534AB7" stroke="#fff" stroke-width="2"/>'; root.append(ptr);
  const pointer = ptr.querySelector('path'), dot = ptr.querySelector('circle');
  const bubble = document.createElement('div'); bubble.className = 'hq-bubble'; bubble.hidden = true; root.append(bubble);
  const s = new T.Scene(); s.background = new T.Color('#EEF0F6');
  const cam = new T.OrthographicCamera(-1, 1, 1, -1, -100, 200); const FH = 29;
  const target = VIEWS.f2.t.clone(); let zoom = VIEWS.f2.z;
  s.add(new T.HemisphereLight('#ffffff', '#d9cbb8', 1.35));
  const sun = new T.DirectionalLight('#fff1dc', 2.1); sun.position.set(14, 32, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22 }); s.add(sun);
  const warm = new T.PointLight('#ffd9a0', 6, 9, 1.6); warm.position.set(DESK.x, Y2 + 2.4, DESK.z); s.add(warm);

  /* ---------- building helpers ---------- */
  const mats = {}; const M = (c, o = {}) => { const k = c + JSON.stringify(o); return mats[k] || (mats[k] = new T.MeshStandardMaterial({ color: c, roughness: .78, ...o })); };
  const glass = new T.MeshStandardMaterial({ color: '#cfeaf7', transparent: true, opacity: .26, roughness: .08, metalness: .1, depthWrite: false });
  const pick = [];
  let grp = s;
  const box = (w, h, d, c, x, y, z, o) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), c && c.isMaterial ? c : M(c, o)); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = !(c && c.isMaterial && c.transparent); grp.add(m); return m; };
  const cyl = (rt, rb, h, c, x, y, z, seg = 18) => { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), M(c)); m.position.set(x, y + h / 2, z); m.castShadow = true; grp.add(m); return m; };
  function plant(x, y, z, k = 1) {
    cyl(.22 * k, .17 * k, .42 * k, '#efe8dc', x, y, z);
    const leaf = M('#3f8f4c', { flatShading: true }), leaf2 = M('#57a65e', { flatShading: true });
    [[0, .85, 0, .48], [.16, 1.2, .05, .32], [-.14, 1.12, -.08, .3]].forEach(([dx, dy, dz, rr], i) => { const g = new T.Mesh(new T.IcosahedronGeometry(rr * k, 0), i ? leaf2 : leaf); g.position.set(x + dx * k, y + dy * k, z + dz * k); g.castShadow = true; grp.add(g); });
  }
  function desk(x, y, z, chairCol, screen = '#8fd6ff', rot = 0) {
    const g = new T.Group(); const pg = grp; grp = g;
    box(1.6, .08, .8, '#f4f0e8', 0, .7, 0); box(.08, .7, .72, '#dcd6cc', -.74, 0, 0); box(.08, .7, .72, '#dcd6cc', .74, 0, 0);
    box(.7, .45, .05, '#1f2329', 0, .78, -.26); box(.62, .37, .02, M(screen, { emissive: screen, emissiveIntensity: .75 }), 0, .82, -.23);
    box(.5, .08, .5, chairCol, 0, .42, .72); box(.5, .5, .08, chairCol, 0, .5, .97); cyl(.04, .04, .42, '#555', 0, 0, .72, 8);
    grp = pg; g.position.set(x, y, z); g.rotation.y = rot; grp.add(g); return g;
  }
  function person(col, opt = {}) {
    const g = new T.Group();
    const body = new T.Mesh(new T.CapsuleGeometry(.23, .55, 4, 10), M(col)); body.position.y = .62;
    const head = new T.Mesh(new T.SphereGeometry(.2, 18, 14), M(opt.skin || '#c98e6b')); head.position.y = 1.24;
    const hair = new T.Mesh(new T.SphereGeometry(.212, 18, 14, 0, Math.PI * 2, 0, Math.PI / 1.9), M(opt.hair || '#2b1d14')); hair.position.y = 1.27;
    [body, head, hair].forEach(m => { m.castShadow = true; g.add(m); });
    if (opt.long) { const lh = new T.Mesh(new T.BoxGeometry(.36, .5, .14), M(opt.hair || '#6b3e26')); lh.position.set(0, 1.08, .13); lh.castShadow = true; g.add(lh); }
    if (opt.paper) { const p = new T.Mesh(new T.BoxGeometry(.26, .32, .02), M('#ffffff')); p.position.set(.26, .85, -.2); p.rotation.x = -.4; g.add(p); g.userData.paper = p; }
    const arm = new T.Mesh(new T.CapsuleGeometry(.07, .38, 3, 6), M(col)); arm.position.set(.3, .78, 0); g.add(arm); g.userData.arm = arm;
    return g;
  }
  /* Hiba's own characters (characters.js drawings) stand in the 3D office as flat cut-outs that always face her. */
  const texCache = {};
  function charSprite(inner, h = 1.55) {
    const mat = new T.SpriteMaterial({ transparent: true, depthWrite: true, alphaTest: .35 });
    const sp = new T.Sprite(mat); sp.center.set(.5, 0); sp.scale.set(h * 90 / 120, h, 1);
    const hit = texCache[inner];
    if (hit && hit.tex) { mat.map = hit.tex; mat.needsUpdate = true; }
    else {
      const c = texCache[inner] = hit || { tex: null, wait: [] }; c.wait.push(mat);
      if (!hit) { const img = new Image(); img.onload = () => { const t = new T.Texture(img); t.colorSpace = T.SRGBColorSpace; t.needsUpdate = true; c.tex = t; c.wait.forEach(m => { m.map = t; m.needsUpdate = true; }); c.wait = []; dirty = true; };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 120" width="270" height="360">${inner}</svg>`); }
    }
    return sp;
  }
  function robot(col) {
    const g = new T.Group();
    const b = new T.Mesh(new T.BoxGeometry(.42, .55, .32), M(col)); b.position.y = .4; const h = new T.Mesh(new T.BoxGeometry(.5, .36, .38), M('#e8eef2')); h.position.y = .88;
    const eye = M('#3fc1ff', { emissive: '#3fc1ff', emissiveIntensity: 1.2 }); [-.1, .1].forEach(dx => { const e = new T.Mesh(new T.SphereGeometry(.045, 10, 8), eye); e.position.set(dx, .9, -.2); g.add(e); });
    const ant = new T.Mesh(new T.CylinderGeometry(.015, .015, .2, 6), M('#888')); ant.position.y = 1.15; const tip = new T.Mesh(new T.SphereGeometry(.05, 10, 8), M(col, { emissive: col, emissiveIntensity: .8 })); tip.position.y = 1.27;
    [b, h, ant, tip].forEach(m => { m.castShadow = true; g.add(m); }); g.userData.tip = tip; return g;
  }
  const add = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; grp.add(o); return o; };

  /* ---------- floor 1: team rooms ---------- */
  box(18, .4, 15, '#e7dac5', 0, -.4, 0);
  box(18, 1.3, .2, '#efe7da', 0, 0, -7.5); box(.2, 1.3, 15, '#eae1d2', -9, 0, 0);
  const teamCells = {}; const teamPeople = {};
  /* ---------- floor 2 ---------- */
  const f2 = new T.Group(); f2.position.copy(F2); s.add(f2);
  const pillarsAt = [[-5, 2.5], [8, 2.5], [8, -7.5], [-5, -7.5], [1.5, 2.5]];
  grp = f2;
  pillarsAt.forEach(([x, z]) => box(.32, Y2 - .35, .32, '#cfc8bb', x, 0, z));
  box(13, .35, 10, '#f5efe6', 1.5, Y2 - .35, -2.5);
  box(13, 2.8, .15, '#efe5d6', 1.5, Y2, -7.5); box(.15, 2.8, 10, '#ece1cf', -5, Y2, -2.5);
  for (let i = 0; i < 9; i++) box(.12, 2.6, .5, '#c9a37a', -2 + i * .7, Y2, -7.38); // wood slats behind
  box(13, .75, .05, glass, 1.5, Y2, 2.5); box(.05, .75, 10, glass, 8, Y2, -2.5);
  // my office (glass walls, desk, shelf, sofas)
  box(5, .02, 4, '#f6e9dc', 1.5, Y2, -1.5);
  box(5, 2.1, .05, glass, 1.5, Y2, .5); box(.05, 2.1, 4, glass, -1, Y2, -1.5); box(.05, 2.1, 4, glass, 4, Y2, -1.5);
  box(2.3, .1, 1.05, '#c99a69', 1.5, Y2 + .74, -2); box(2.1, .74, .95, '#b8875a', 1.5, Y2, -2);
  box(.7, .42, .6, '#2b2b2b', 1.5, Y2, -3.05); box(.7, .7, .1, '#2b2b2b', 1.5, Y2 + .42, -3.3); box(2.8, 2.2, .3, '#8a5a3b', 1.5, Y2, -3.45);
  for (let i = 0; i < 6; i++) box(.16, .4, .22, ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60', '#8e44ad', '#e67e22'][i], .6 + i * .3, Y2 + 1.1, -3.3);
  box(.5, .04, .36, '#d8d1c6', 2.25, Y2 + .84, -1.75); box(.46, .3, .03, M('#dfe9f2', { emissive: '#9cc8ea', emissiveIntensity: .4 }), 2.25, Y2 + .88, -1.95);
  box(1.4, .45, .65, '#1e6f6a', .2, Y2, -.05); box(1.4, .45, .65, '#1e6f6a', 2.8, Y2, -.05); cyl(.45, .45, .08, '#e9dcc6', 1.5, Y2 + .35, .1); cyl(.06, .06, .35, '#a58c6f', 1.5, Y2, .1, 8);
  plant(3.55, Y2, -3, .85); plant(-.55, Y2, -3, .85);
  // the 📮 mailbox by her desk
  const mailbox = new T.Group(); grp = mailbox;
  cyl(.05, .05, .9, '#5f5e5a', 0, 0, 0, 8); box(.42, .34, .3, '#c2410c', 0, .9, 0); const flag = box(.04, .3, .04, '#5f5e5a', .24, .95, 0); const flagTop = box(.16, .1, .02, '#f2c14e', .32, 1.15, 0);
  grp = f2; add(mailbox, 3.6, Y2, -2.3, -.4); mailbox.userData = { pick: { mail: true } }; pick.push(mailbox);
  // AI lab
  box(4, .02, 3.2, '#e4efff', 1.5, Y2, -5.8); box(4, 2, .05, glass, 1.5, Y2, -4.2); box(.05, 2, 3.2, glass, -.5, Y2, -5.8); box(.05, 2, 3.2, glass, 3.5, Y2, -5.8);
  desk(.5, Y2, -6.4, '#3a3f45', '#4aa3ff'); desk(2.6, Y2, -6.4, '#3a3f45', '#4aa3ff');
  box(1.3, .85, .05, M('#2a7fff', { emissive: '#2a7fff', emissiveIntensity: 1.1 }), 1.5, Y2 + 1.15, -7.35);
  const robots = {}; [['Hiba', '#185FA5', .5, -5.5], ['Onsi', '#0F6E56', 2.6, -5.5], ['ChatGPT', '#534AB7', 1.55, -4.9]].forEach(([k, c, x, z]) => { const rb = add(robot(c), x, Y2, z, Math.PI); Object.assign(rb.userData, { pick: { ai: k } }); pick.push(rb); robots[k] = rb; });
  // coffee lounge
  box(3.4, .02, 4.2, '#fbefdc', -3.1, Y2, -4.5); box(2.8, .95, .62, '#d9c2a2', -3.3, Y2, -7.0); box(.42, .55, .4, '#2f2f2f', -4.1, Y2 + .95, -7.0); box(.3, .3, .3, '#b0b0b0', -3.4, Y2 + .95, -7.0);
  cyl(.48, .48, .06, '#ffffff', -3, Y2 + .68, -4.2); cyl(.06, .06, .68, '#9a9a9a', -3, Y2, -4.2, 8);
  box(.55, .42, .55, '#e0a95a', -3.9, Y2, -3.7); box(.55, .42, .55, '#6d8fa6', -2.1, Y2, -4.6); plant(-4.5, Y2, -2.9, .85);
  // meeting room
  box(3.4, .02, 4, '#eef1f5', 6.2, Y2, -5.3); box(.05, 2, 4, glass, 4.5, Y2, -5.3); box(3.4, 2, .05, glass, 6.2, Y2, -3.3);
  box(2.5, .08, 1.2, '#e7d8c0', 6.2, Y2 + .72, -5.3); box(2.3, .72, .1, '#bfae95', 6.2, Y2, -5.3);
  [[5.4, -6.2], [7, -6.2], [5.4, -4.4], [7, -4.4]].forEach(([x, z]) => box(.42, .48, .42, '#3a3f45', x, Y2, z));
  box(.06, 1.1, 1.9, M('#1d2b3a', { emissive: '#1d2b3a' }), 7.88, Y2 + .85, -5.3);
  // command center (front right): a big screen with real numbers
  box(3.2, .02, 2.6, '#eef4ef', 6.2, Y2, .9);
  const cc = document.createElement('canvas'); cc.width = 512; cc.height = 300; const ccTex = new T.CanvasTexture(cc); ccTex.colorSpace = T.SRGBColorSpace;
  const scr = box(2.6, 1.5, .08, new T.MeshBasicMaterial({ map: ccTex }), 6.2, Y2 + .55, -.25); box(2.75, 1.65, .06, '#1f2329', 6.2, Y2 + .48, -.3); box(.12, .55, .12, '#555', 6.2, Y2, -.3);
  plant(7.6, Y2, 1.8, .8);
  grp = s;
  // floor pick surfaces for the floor-2 rooms
  [['office', 1.5, -1.5, 5, 4], ['ai', 1.5, -5.8, 4, 3.2], ['coffee', -3.1, -4.5, 3.4, 4.2], ['meeting', 6.2, -5.3, 3.4, 4], ['board', 6.2, .9, 3.2, 2.6]].forEach(([k, x, z, w, d]) => {
    const p = new T.Mesh(new T.BoxGeometry(w, .05, d), new T.MeshBasicMaterial({ visible: false })); p.position.set(x + F2.x, Y2 + .03, z + F2.z); p.userData = { pick: { room: k } }; s.add(p); pick.push(p); });
  // stairs with glass rail
  for (let k = 0; k < STAIR_N; k++) box(1.5, (k + 1) * (Y2 / STAIR_N), STAIR_RUN, '#f3efe7', STAIR_X, 0, -2.5 + (STAIR_N - k) * STAIR_RUN - STAIR_RUN / 2);
  const rail = box(.05, 1, Math.hypot(STAIR_N * STAIR_RUN, Y2), glass, STAIR_X + .78, Y2 / 2 - .2, -2.5 + STAIR_N * STAIR_RUN / 2); rail.rotation.x = Math.atan2(Y2, STAIR_N * STAIR_RUN);
  // Hiba at her desk
  const hiba = new T.Group(); const hibaMesh = person('#1F4A3E', { long: true, hair: '#5A3420', skin: '#F1C9AE' }); hibaMesh.scale.setScalar(1.25); hibaMesh.rotation.y = Math.PI * .8; hiba.add(hibaMesh); hiba.userData.arm = hibaMesh.userData.arm;
  hiba.position.set(DESK.x + 1.35, Y2, DESK.z + 1.0); s.add(hiba); let hibaAt = 'desk';
  Object.assign(hiba.userData, { pick: { room: "office" } }); pick.push(hiba);

  /* ---------- data-driven parts ---------- */
  const labels = {}; let data = null; let visitor = null, visitorId = null; const line = [];
  const anims = []; let dirty = true, alive = true, visible = true;
  function label(key, text, col, pickData, extraCls = '') {
    let b = labels[key];
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'hq-lbl ' + extraCls; ui.append(b); labels[key] = b;
      b.addEventListener('click', e => { e.stopPropagation(); H.onPick(b._pick); }); }
    b._pick = pickData; b.style.setProperty('--c', col);
    return b;
  }
  function setLabel(b, text, badge, aria) {
    b.textContent = text; if (badge) { const sp = document.createElement('span'); sp.className = 'hq-badge'; sp.textContent = badge; b.append(sp); }
    b.setAttribute('aria-label', aria || (text + (badge ? `: ${badge} waiting for you` : '')));
  }
  function buildTeams(teams) {
    teams.forEach((t, i) => {
      const cx = -6 + (i % 3) * 6, cz = -5 + Math.floor(i / 3) * 5;
      if (!teamCells[t.id]) {
        grp = s;
        box(5.8, .02, 4.8, t.tint, cx, 0, cz); box(5.8, 1.15, .05, glass, cx, 0, cz + 2.4); box(.05, 1.15, 4.8, glass, cx + 2.9, 0, cz);
        const ppl = [];
        t.people.slice(0, 3).forEach((p, j) => {
          const dx = [-1.4, 1.2, -1.4][j], dz = [-.7, .2, 1.2][j];
          if (j === 2) { grp = s; } desk(cx + dx, 0, cz + dz - .1, t.col);
          const fig = p.svg ? charSprite(p.svg, 1.65) : person(t.col, { skin: p.skin, hair: p.hair }); fig.position.set(cx + dx, 0, cz + dz + .55); fig.rotation.y = Math.PI; Object.assign(fig.userData, { pick: { role: p.n }, phase: j * 1.3 + i, sprite: !!p.svg }); s.add(fig); pick.push(fig); ppl.push(fig);
        });
        plant(cx + 2.3, 0, cz - 1.8, .8);
        const fl = new T.Mesh(new T.BoxGeometry(5.8, .06, 4.8), new T.MeshBasicMaterial({ visible: false })); fl.position.set(cx, .03, cz); fl.userData = { pick: { team: t.id } }; s.add(fl); pick.push(fl);
        teamCells[t.id] = new T.Vector3(cx, 1.9, cz - 1.4); teamPeople[t.id] = ppl;
      }
      const b = label('t-' + t.id, t.short, t.col, { team: t.id }); setLabel(b, t.short, t.badge, `${t.name}: ${t.size} experts${t.badge ? ', ' + t.badge + ' waiting for you' : ''}${t.problems ? ', on ' + t.problems + ' problems' : ''}`);
      b.classList.toggle('busy', !!t.problems); b._pos = teamCells[t.id];
    });
  }
  function drawScreen(d) {
    const g = cc.getContext('2d'); g.fillStyle = '#0f1b24'; g.fillRect(0, 0, 512, 300);
    g.fillStyle = '#9fd3ff'; g.font = '600 30px sans-serif'; g.fillText('WhySteps · command center', 22, 46);
    const rows = [['Urgent problems', d.urgent, '#ff8a80'], ['Decisions for you', d.decisions, '#ffd180'], ['Waiting on AI', d.waitingAI, '#80d8ff'], ['Website', d.website, d.website === 'Published' ? '#a5d6a7' : '#ffd180']];
    rows.forEach(([k, v, c], i) => { g.fillStyle = '#cfd8dc'; g.font = '26px sans-serif'; g.fillText(k, 22, 100 + i * 52); g.fillStyle = c; g.font = '700 34px sans-serif'; g.textAlign = 'right'; g.fillText(String(v), 490, 100 + i * 52); g.textAlign = 'left'; });
    g.fillStyle = '#607d8b'; g.font = '20px sans-serif'; g.fillText('From GitHub ' + d.at, 22, 290);
    ccTex.needsUpdate = true;
  }
  function makeVisitor(v) {
    const fig = v.svg ? charSprite(v.svg, 1.9) : person(v.col, { paper: true, skin: v.skin, hair: v.hair }); Object.assign(fig.userData, { pick: v.n ? { role: v.n } : { room: 'office' } }); s.add(fig); pick.push(fig); return fig;
  }
  function removeFig(f) { s.remove(f); const i = pick.indexOf(f); if (i >= 0) pick.splice(i, 1); }
  const stairTop = new T.Vector3(STAIR_X, Y2, -2.9), stairBottom = new T.Vector3(STAIR_X, 0, STAIR_Z0 + .4);
  const stairWay = k => new T.Vector3(STAIR_X, Y2 * k, -2.5 + STAIR_N * STAIR_RUN * (1 - k));
  function walk(fig, pts, speed, done) {
    if (RM.matches) { fig.position.copy(pts[pts.length - 1]); done && done(); dirty = true; return; }
    anims.push({ fig, pts: pts.map(p => p.clone()), i: 0, speed, done });
  }
  function teamDoor(teamId) { const c = teamCells[teamId]; return c ? new T.Vector3(c.x - 2.2, 0, c.z + 2.6) : stairBottom.clone(); }
  function setVisitor(v) {
    const id = v ? v.id : null; if (id === visitorId) return; const old = visitor, oldTeam = old && old.userData.team;
    visitorId = id; visitor = null;
    if (old) walk(old, [stairTop.clone().add(new T.Vector3(.6, 0, 0)), stairTop, stairWay(.5), stairBottom, teamDoor(oldTeam)], 4.2, () => removeFig(old));
    if (!v) { dirty = true; return; }
    const fig = makeVisitor(v); fig.userData.team = v.team; if (!v.svg) fig.scale.setScalar(1.2); visitor = fig;
    if (!data || data.first || RM.matches) { fig.position.copy(ASK_SPOT); fig.rotation.y = Math.PI; }
    else { fig.position.copy(stairWay(.35)); walk(fig, [stairWay(.7), stairTop, stairTop.clone().add(new T.Vector3(.8, 0, -.4)), ASK_SPOT], 3.6, () => { fig.rotation.y = Math.PI; }); }
    dirty = true;
  }
  function setLine(items) {
    while (line.length) removeFig(line.pop());
    items.slice(0, 3).forEach((v, i) => { const f = v.svg ? charSprite(v.svg, 1.45) : person(v.col, { skin: v.skin, hair: v.hair, paper: true }); f.position.set(STAIR_X + .9 + i * .55, Y2, -3.6 + i * .25); f.rotation.y = Math.PI * .75; Object.assign(f.userData, { pick: v.n ? { role: v.n } : { room: 'office' } }); s.add(f); pick.push(f); line.push(f); });
  }
  const f2p = (x, z) => new T.Vector3(x + F2.x, Y2, z + F2.z);
  const SPOTS = { desk: f2p(2.85, -1), coffee: f2p(-3.6, -6.0), lunch: f2p(-2.4, -4.0), ai: f2p(1.5, -3.7), meeting: f2p(5.0, -3.0), board: f2p(5.0, 1.6) };
  const HUB = f2p(-2.6, 1.6);
  function spotOf(where) { if (SPOTS[where]) return SPOTS[where]; const c = where && where.startsWith('team:') && teamCells[where.slice(5)]; return c ? new T.Vector3(c.x - .4, 0, c.z + 1.9) : SPOTS.desk; }
  function setHiba(where) {
    if (where === hibaAt) return; const from = hibaAt; hibaAt = where;
    const to = spotOf(where), up = !where.startsWith('team:'), wasUp = !from.startsWith('team:');
    let path;
    if (up && wasUp) path = [HUB, to];
    else if (!up && wasUp) path = [HUB, stairTop, stairWay(.5), stairWay(0), new T.Vector3(STAIR_X + 1.6, 0, STAIR_Z0 - 1), to];
    else if (up && !wasUp) path = [new T.Vector3(STAIR_X + 1.6, 0, STAIR_Z0 - 1), stairWay(0), stairWay(.5), stairTop, HUB, to];
    else path = [new T.Vector3(hiba.position.x, 0, 7.2), new T.Vector3(to.x, 0, 7.2), to];
    walk(hiba, path, 6, null);
  }


  /* ---------- camera ---------- */
  let tw = null;
  function applyCam() {
    const w = root.clientWidth || 1, h = root.clientHeight || 1, a = w / h;
    cam.left = -FH * a / 2; cam.right = FH * a / 2; cam.top = FH / 2; cam.bottom = -FH / 2; cam.zoom = zoom; cam.updateProjectionMatrix();
    cam.position.set(target.x + 30, target.y + 30, target.z + 30); cam.lookAt(target); cam.updateMatrixWorld();
  }
  function goTo(t, z) {
    if (RM.matches) { target.copy(t); zoom = z; dirty = true; return; }
    tw = { t0: performance.now(), from: target.clone(), fz: zoom, to: t.clone(), tz: z };
  }
  function focus(view) {
    visible = true; dirty = true;
    if (view === 'desk') { const z = root.clientWidth < 600 ? 3.1 : 2.3; return goTo(new T.Vector3(DESK.x - .2, Y2 + 1 + .16 * FH / z / .816, DESK.z + .5), z); }
    if (VIEWS[view]) return goTo(VIEWS[view].t, VIEWS[view].z * (root.clientWidth < 600 ? 1 : .95));
    const p = ROOM_POS[view] || teamCells[view]; if (p) goTo(new T.Vector3(p.x, p.y - 1.4, p.z), root.clientWidth < 600 ? 2.4 : 2.2);
  }
  // pan, pinch, wheel, tap
  const pts = new Map(); let drag = null, pinch = null, moved = 0;
  const cnv = r.domElement; cnv.style.touchAction = 'none';
  cnv.addEventListener('pointerdown', e => { cnv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
    if (pts.size === 1) drag = { x: e.clientX, y: e.clientY }; else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; drag = null; } });
  cnv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); tw = null;
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; zoom = clamp(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, .7, 3.6); moved += 10; dirty = true; return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
      const k = FH / zoom / (root.clientHeight || 1); const right = new T.Vector3(1, 0, -1).normalize(), up = new T.Vector3(-1, 2, -1).normalize();
      target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k * .9); dirty = true; } });
  const end = e => { const was = pts.size; pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { if (was === 1 && moved < 8) tap(e); drag = null; } };
  cnv.addEventListener('pointerup', end); cnv.addEventListener('pointercancel', e => { pts.delete(e.pointerId); drag = pinch = null; });
  cnv.addEventListener('wheel', e => { e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.1 : .9), .7, 3.6); tw = null; dirty = true; }, { passive: false });
  const ray = new T.Raycaster();
  function tap(e) {
    const rc = cnv.getBoundingClientRect(); ray.setFromCamera(new T.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -(e.clientY - rc.top) / rc.height * 2 + 1), cam);
    const hit = ray.intersectObjects(pick, true)[0]; if (!hit) return;
    let o = hit.object; while (o && !(o.userData && o.userData.pick)) o = o.parent; if (o) H.onPick(o.userData.pick);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- frame loop (only while visible) ---------- */
  const v3 = new T.Vector3();
  function place(el, p, dy = 0) {
    v3.copy(p).project(cam); const w = root.clientWidth, h = root.clientHeight;
    const x = (v3.x + 1) / 2 * w, y = (1 - v3.y) / 2 * h + dy; const out = x < -40 || x > w + 40 || y < -20 || y > h + 20;
    el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`; el.style.visibility = out ? 'hidden' : 'visible';
  }
  let last = performance.now();
  function frame(now) {
    if (!alive) return; requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const dt = Math.min(.25, (now - last) / 1000); last = now;
    if (tw) { const k = Math.min(1, (now - tw.t0) / 650), e = 1 - Math.pow(1 - k, 3); target.lerpVectors(tw.from, tw.to, e); zoom = tw.fz + (tw.tz - tw.fz) * e; if (k >= 1) tw = null; dirty = true; }
    for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i], f = a.fig, to = a.pts[a.i]; const d = v3.copy(to).sub(f.position); const L = d.length(), step = a.speed * dt;
      if (L <= step) { f.position.copy(to); a.i++; if (a.i >= a.pts.length) { anims.splice(i, 1); a.done && a.done(); } }
      else { f.position.addScaledVector(d.normalize(), step); f.rotation.y = Math.atan2(d.x, d.z) + Math.PI; f.position.y += Math.abs(Math.sin(now / 90)) * .02; }
      dirty = true; }
    if (!RM.matches) { // subtle life: robots' lights pulse, people at desks lean a little
      const t = now / 1000; Object.values(robots).forEach((rb, i) => { rb.userData.tip.material.emissiveIntensity = .5 + .5 * Math.abs(Math.sin(t * 1.5 + i)); });
      Object.values(teamPeople).forEach(ppl => ppl.forEach(f => { if (f.userData.sprite) f.position.y = Math.max(0, Math.sin(t * 1.2 + f.userData.phase)) * .03; else f.children[1].position.y = 1.24 + Math.sin(t * 1.2 + f.userData.phase) * .012; }));
      if (hiba.userData.wave && now < hiba.userData.wave) { hiba.children[0].position.y = Math.abs(Math.sin(now / 120)) * .25; } else if (hiba.userData.wave) { hiba.userData.wave = 0; hiba.children[0].position.y = 0; }
      dirty = true; }
    if (!dirty) return; dirty = false;
    applyCam(); r.render(s, cam);
    for (const b of Object.values(labels)) if (b._pos) place(b, b._pos);
    if (visitor && !bubble.hidden) {
      // The bubble is pinned to the top of the view; a dotted line points down to the person's head, so no head is ever covered.
      v3.copy(visitor.position).add(new T.Vector3(0, 1.55, 0)).project(cam); const w = root.clientWidth, h = root.clientHeight;
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight; const x = (v3.x + 1) / 2 * w, y = (1 - v3.y) / 2 * h;
      const left = clamp(x - bw / 2, 8, w - bw - 8); bubble.style.transform = `translate(${left.toFixed(1)}px,8px)`;
      const x0 = clamp(x, left + 20, left + bw - 20), y0 = 8 + bh;
      const show = y > y0 + 12 && x > 0 && x < w && y < h;
      pointer.setAttribute('d', show ? `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x.toFixed(1)} ${(y - 6).toFixed(1)}` : ''); dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', (y - 4).toFixed(1)); dot.style.display = show ? '' : 'none';
    } else { pointer.setAttribute('d', ''); dot.style.display = 'none'; }
  }
  requestAnimationFrame(frame);
  const ro = new ResizeObserver(() => { const w = root.clientWidth, h = root.clientHeight; if (w && h) { r.setSize(w, h, false); dirty = true; } }); ro.observe(root);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; dirty = true; }); io.observe(root);

  const api = {
    root,
    update(d) {
      const first = !data; data = Object.assign({ first }, d); visible = true; io.unobserve(root); io.observe(root);
      buildTeams(d.teams);
      Object.entries(ROOM_NAMES).forEach(([k, n]) => { const b = label('r-' + k, n, d.roomCols[k] || '#33363d', { room: k }, 'room'); setLabel(b, n, (d.roomBadges || {})[k]); b._pos = ROOM_POS[k]; });
      Object.values(labels).forEach(b => b.classList.toggle('on', !!((b._pick.team && b._pick.team === d.team) || (b._pick.room && b._pick.room === d.room && d.room !== 'office'))));
      const mb = label('mail', '📮', '#c2410c', { mail: true }, 'mail'); setLabel(mb, '📮', d.mail || '', d.mail ? `Your 📮 box: ${d.mail} ready to send` : 'Your 📮 box: empty'); mb._pos = new T.Vector3(3.6 + F2.x, Y2 + .2, -1.9 + F2.z);
      flag.rotation.z = d.mail ? 0 : -Math.PI / 2; flagTop.visible = !!d.mail;
      Object.entries(d.ai || {}).forEach(([k, st]) => { const rb = robots[k]; if (rb) rb.userData.tip.material = M(st === 'busy' ? '#ff7043' : st === 'wait' ? '#ffca28' : '#66bb6a', { emissive: st === 'busy' ? '#ff7043' : st === 'wait' ? '#ffca28' : '#66bb6a', emissiveIntensity: .8 }); });
      drawScreen(d.screen);
      setVisitor(d.brk ? null : d.visitor); setLine(d.brk ? [] : d.line || []);
      if (d.hibaSvg && !hiba.userData.drawn) { hiba.userData.drawn = true; hiba.remove(hibaMesh); hiba.add(charSprite(d.hibaSvg, 2.0)); }
      if (d.robotSvg) Object.entries(robots).forEach(([k, rb]) => { if (d.robotSvg[k] && !rb.userData.drawn) { rb.userData.drawn = true; rb.children.forEach(ch => { if (ch !== rb.userData.tip) ch.visible = false; }); rb.add(charSprite(d.robotSvg[k], 1.35)); rb.userData.tip.position.set(.42, 1.25, 0); } });
      setHiba(d.hibaAt || d.brk || 'desk');
      if (d.wave) hiba.userData.wave = performance.now() + 1800;
      if (first) { focus(d.view || 'desk'); }
      dirty = true;
    },
    setBubble(html) { if (!html) { bubble.hidden = true; bubble.innerHTML = ''; return; } bubble.innerHTML = html; bubble.hidden = false; dirty = true; },
    focus, ROOM_NAMES,
    state: () => ({ target: target.toArray(), zoom, visitor: visitorId, labels: Object.keys(labels).length, hiba: hiba.position.toArray() }),
    dispose() { alive = false; ro.disconnect(); io.disconnect(); r.dispose(); root.remove(); },
    _dbg: () => ({ visible, dirty, alive, tw: !!tw, hidden: document.hidden })
  };
  window.__hq = api; return api;
}
window.HQ3D = { supported, create };
dispatchEvent(new Event('hq3d-ready'));
