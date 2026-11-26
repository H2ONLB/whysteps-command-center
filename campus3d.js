/* WhySteps campus in 3D (Hiba's plan, 26 Nov 2026, part 1). Simple buildings beside her office, joined by glowing
   lines on the ground. Her 3D office itself (hq3d.js) is not touched: the campus shows it as a building that opens it.
   This module only draws; campus.js passes the data (job counts and line colours from docs/launch-jobs.json) and
   decides what a tap does. It never invents activity. Renders only while visible; reduced motion stops the glow pulse.
   After launch (not built yet): roofs off, classrooms inside, glowing dots travelling along the lines.
   Live page (live.js, GitHub Pages): CAMPUS3D.current.fx(...) plays a short light effect when GitHub shows new work:
   pulse and walk (a commit or pull request), sparkle (merged), amber glow (sent back), travel (a job moved stage).
   live.js never calls these when the person has asked for reduced motion. The camera keeps its angle when the
   campus is drawn again with new data. */
import * as T from './vendor/three/r187/three.module.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)');
const POS = { office: [-11, -1], lab: [-6, -4.6], studio: [-0.5, 0.6], school: [6, -4.2], family: [5.2, 3.6], ministry: [11.5, 0], launch: [15, 5] };
let VIEW = null; // the camera angle, kept when the campus is drawn again with new data
const HT0 = { office: 3.4, lab: 3.6, studio: 3.6, school: 5, family: 3.6, ministry: 3.6, launch: .3 };
const LINE = { blue: '#4EA8FF', green: '#3FD18B', red: '#FF6B6B', grey: '#6F8A8E' };

function supported() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

function create(host, data, onPick) {
  const root = document.createElement('div'); root.className = 'cx3d'; host.append(root);
  const r = new T.WebGLRenderer({ antialias: true });
  r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.outputColorSpace = T.SRGBColorSpace; r.shadowMap.enabled = true;
  r.domElement.setAttribute('aria-hidden', 'true'); root.append(r.domElement);
  const ui = document.createElement('div'); ui.className = 'cx3d-ui'; root.append(ui);
  const s = new T.Scene(); s.background = new T.Color('#16343A');
  const cam = new T.PerspectiveCamera(38, 1, .1, 200);
  s.add(new T.HemisphereLight('#ffffff', '#21474d', 1.6));
  const sun = new T.DirectionalLight('#fff3df', 2.2); sun.position.set(10, 22, 14); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18 }); s.add(sun);

  const mats = {}; const M = (c, o = {}) => { const k = c + JSON.stringify(o); return mats[k] || (mats[k] = new T.MeshStandardMaterial({ color: c, roughness: .7, ...o })); };
  const pick = [];
  const add = (geo, mat, x, y, z, id) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; s.add(m); if (id) { m.userData.id = id; pick.push(m); } return m; };
  const box = (w, h, d, mat, x, y, z, id) => add(new T.BoxGeometry(w, h, d), mat, x, y + h / 2, z, id);

  // ground
  const g = new T.Mesh(new T.PlaneGeometry(44, 26), M('#1E4A50', { roughness: 1 })); g.rotation.x = -Math.PI / 2; g.position.set(2, 0, 1); g.receiveShadow = true; s.add(g);

  // Your office (stays as it is: this is only its sign on the campus; pressing it opens the real 3D office)
  { const [x, z] = POS.office; box(4.4, 3.4, 3.4, M('#2A6F6A'), x, 0, z, 'office');
    for (let f = 0; f < 3; f++) for (let i = 0; i < 4; i++) box(.6, .55, .05, M('#F6E7B8', { emissive: '#F6E7B8', emissiveIntensity: .35 }), x - 1.5 + i, .55 + f * .95, z + 1.72); }
  // Testing Lab: blue glass with a dome
  { const [x, z] = POS.lab; box(3.4, 2.4, 3, M('#5DA9E9', { transparent: true, opacity: .82, metalness: .3, roughness: .15 }), x, 0, z, 'lab');
    add(new T.SphereGeometry(1.25, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('#BFE3FF', { transparent: true, opacity: .75, metalness: .2, roughness: .1 }), x, 2.4, z, 'lab'); }
  // Design and Marketing Studio: modern purple glass, colourful sign on the roof
  { const [x, z] = POS.studio; box(3.4, 3, 3.2, M('#8E6CD9', { transparent: true, opacity: .85, metalness: .3, roughness: .2 }), x, 0, z, 'studio');
    ['#FF6B6B', '#F2C14E', '#3FD18B', '#4EA8FF', '#E6A16F'].forEach((c, i) => box(.55, .7, .12, M(c, { emissive: c, emissiveIntensity: .35 }), x - 1.2 + i * .6, 3.05, z, 'studio')); }
  // School: the biggest, clock tower, flag, four coloured doors (KG yellow, 1–5 green, 6–9 blue, 10–12 purple)
  { const [x, z] = POS.school; box(7, 2.8, 4, M('#E8C79A'), x, 0, z, 'school');
    box(1.4, 2.4, 1.4, M('#D9B27E'), x, 2.8, z - .6, 'school');
    add(new T.CylinderGeometry(.5, .5, .08, 24), M('#FFFFFF'), x, 4.3, z + .13, 'school').rotation.x = Math.PI / 2;
    box(.05, 1.6, .05, M('#5F5E5A'), x, 5.2, z - .6, 'school'); box(.8, .45, .03, M('#E6A16F'), x + .42, 6.3, z - .6, 'school');
    ['#E0B02E', '#2F9A5C', '#2E6FB5', '#7B4FB8'].forEach((c, i) => box(.9, 1.4, .1, M(c), x - 2.4 + i * 1.6, 0, z + 2.02, 'school')); }
  // Family Centre: warm house with a red roof
  { const [x, z] = POS.family; box(3.6, 2, 3, M('#F2D3A8'), x, 0, z, 'family');
    const roof = add(new T.ConeGeometry(2.75, 1.6, 4), M('#C8463D'), x, 2.8, z, 'family'); roof.rotation.y = Math.PI / 4; roof.scale.z = .85;
    box(.7, 1.1, .08, M('#8C6446'), x, 0, z + 1.52, 'family'); }
  // Ministry: white with columns
  { const [x, z] = POS.ministry; box(4.2, .4, 3.2, M('#F4F2EC'), x, 0, z, 'ministry'); box(3.6, 2.2, 2.2, M('#FFFFFF'), x, .4, z - .3, 'ministry');
    for (let i = 0; i < 6; i++) add(new T.CylinderGeometry(.16, .18, 2.2, 14), M('#FFFFFF'), x - 1.6 + i * .64, .4 + 1.1, z + 1.2, 'ministry');
    box(4, .3, 3, M('#EDEAE2'), x, 2.6, z, 'ministry');
    const ped = add(new T.ConeGeometry(2.4, .9, 3), M('#F4F2EC'), x, 3.35, z + .2, 'ministry'); ped.rotation.set(0, Math.PI / 2, 0); ped.scale.set(1, 1, .5); ped.rotation.x = 0; }
  // Launch pad: an apricot circle at the end
  { const [x, z] = POS.launch; add(new T.CylinderGeometry(1.8, 1.8, .12, 40), M('#E6A16F', { emissive: '#E6A16F', emissiveIntensity: .25 }), x, .06, z, 'launch');
    add(new T.CylinderGeometry(1.1, 1.1, .14, 40), M('#F7CFAE'), x, .08, z, 'launch'); }

  // Glowing lines on the ground: blue moving, green approved, red sent back, grey quiet
  const glows = [];
  (data.edges || []).forEach(e => {
    const [ax, az] = POS[e.a], [bx, bz] = POS[e.b], len = Math.hypot(bx - ax, bz - az), c = LINE[e.s] || LINE.grey;
    const m = new T.Mesh(new T.BoxGeometry(len, .05, .22), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e.s === 'grey' ? .15 : .9 }));
    m.position.set((ax + bx) / 2, .03, (az + bz) / 2); m.rotation.y = -Math.atan2(bz - az, bx - ax); s.add(m);
    if (e.s === 'blue') glows.push(m);
  });

  // Labels: name, leader, number badge. They are buttons, so a keyboard or screen reader can press them too.
  const lbls = (data.buildings || []).map(b => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'cx3d-lbl b-' + b.id;
    el.setAttribute('aria-label', `${b.name}: ${b.who}${b.id === 'launch' ? '' : `, ${b.n} job${b.n === 1 ? '' : 's'} here`}`);
    el.innerHTML = `<strong></strong><b class="cx3d-short"></b><small></small>${b.id === 'launch' ? '' : `<span class="cx-badge">${b.n}</span>`}`;
    el.querySelector('strong').textContent = b.name; el.querySelector('.cx3d-short').textContent = b.short || b.name; el.querySelector('small').textContent = b.who;
    el.addEventListener('click', () => onPick(b.id)); ui.append(el);
    const [x, z] = POS[b.id]; return { el, p: new T.Vector3(x, b.id === 'launch' ? .6 : b.id === 'school' ? 7.2 : 4.6, z) };
  });

  // camera: turn by dragging, zoom by pinch or wheel
  let sized = false, theta = -.32, dist = 34, dirty = true, alive = true, visible = true;
  const target = new T.Vector3(2, 0, .5);
  let ph = .86;
  const place = () => { VIEW = { theta, dist, ph, t: target.clone() }; cam.position.set(target.x + Math.sin(theta) * Math.cos(ph) * dist, target.y + Math.sin(ph) * dist, target.z + Math.cos(theta) * Math.cos(ph) * dist); cam.lookAt(target); };
  const cnv = r.domElement, pts = new Map(); let moved = 0, pinch0 = 0;
  cnv.addEventListener('pointerdown', e => { cnv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } });
  cnv.addEventListener('pointermove', e => { const q = pts.get(e.pointerId); if (!q) return;
    if (pts.size === 1) { const dx = e.clientX - q.x, dy = e.clientY - q.y; theta -= dx * .008; ph = Math.min(1.35, Math.max(.32, ph + dy * .006)); moved += Math.abs(dx) + Math.abs(dy); }
    q.x = e.clientX; q.y = e.clientY;
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) dist = Math.min(60, Math.max(16, dist * pinch0 / d)); pinch0 = d; moved += 10; }
    dirty = true; });
  const up = e => { const was = pts.has(e.pointerId); pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0;
    if (was && moved < 8 && e.type === 'pointerup') { const rc = new T.Raycaster(), b = cnv.getBoundingClientRect();
      rc.setFromCamera(new T.Vector2((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1), cam);
      const hit = rc.intersectObjects(pick)[0]; if (hit) onPick(hit.object.userData.id); } };
  cnv.addEventListener('pointerup', up); cnv.addEventListener('pointercancel', up);
  cnv.addEventListener('wheel', e => { e.preventDefault(); dist = Math.min(60, Math.max(16, dist * (e.deltaY < 0 ? .9 : 1.1))); dirty = true; }, { passive: false });

  const size = () => { const w = root.clientWidth || 300, h = root.clientHeight || 300; r.setSize(w, h, false); cam.aspect = w / h;
    const tall = w < h * 1.1; cam.fov = tall ? 62 : 38; if (!sized && VIEW) { ({ theta, dist, ph } = VIEW); target.copy(VIEW.t); sized = true; }
    if (!sized) { dist = tall ? 33 : 34; theta = tall ? -1.0 : -.32; ph = tall ? 1.2 : .86; if (tall) { target.set(1.5, 0, 0); ph = .8; dist = 40; } sized = true; } cam.updateProjectionMatrix(); dirty = true; };
  const ro = new ResizeObserver(size); ro.observe(root); size();
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; dirty = true; }); io.observe(root);
  const v3 = new T.Vector3();

  // Turn and tilt buttons (Hiba, 26 Nov 2026), also for a keyboard or a screen reader
  { const bar = document.createElement('div'); bar.className = 'v3-turn'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Turn the campus');
    const go = (dt, dp) => { theta += dt; ph = Math.min(1.35, Math.max(.32, ph + dp)); dirty = true; };
    [['↺', 'Turn left', () => go(.4, 0)], ['↻', 'Turn right', () => go(-.4, 0)], ['⤒', 'Look from higher', () => go(0, .18)], ['⤓', 'Look from lower', () => go(0, -.18)], ['⟲', 'Back to the first view', () => { sized = false; VIEW = null; size(); }]]
      .forEach(([t, l, f]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.title = l; b.setAttribute('aria-label', l); b.addEventListener('click', f); bar.append(b); });
    root.append(bar); }

  // Buildings glow while work is there (Hiba, 26 Nov 2026): a job is at that building now, or, for your office, the team
  // changed something on GitHub in the last hour. A slow breathing light; steady with reduced motion.
  const GLOW = { office: '#7FE3C4', lab: '#8CCBFF', studio: '#C8A8FF', school: '#FFD77A', family: '#FFB08A', ministry: '#FFF1C2', launch: '#FFC59A' };
  const glowing = (data.buildings || []).filter(b => b.working).map(b => {
    const c = new T.Color(GLOW[b.id] || '#FFFFFF'), parts = pick.filter(m => m.userData.id === b.id);
    parts.forEach(m => { m.material = m.material.clone(); m.material.emissive = c.clone(); m.userData.e0 = m.material.emissiveIntensity || 0; });
    const [x, z] = POS[b.id], lamp = new T.PointLight(c, 6, 9, 1.6); lamp.position.set(x, (HT0[b.id] || 3) + 1.2, z + 1.4); s.add(lamp);
    const halo = new T.Mesh(new T.CircleGeometry(b.id === 'school' ? 4.6 : 3, 48), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .22, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(x, .045, z); s.add(halo);
    return { parts, lamp, halo };
  });
  const breathe = t => { const k = RM.matches ? .7 : .55 + .45 * Math.sin(t / 900);
    glowing.forEach(g => { g.parts.forEach(m => { m.material.emissiveIntensity = m.userData.e0 + .05 + .13 * k; }); g.lamp.intensity = 3 + 7 * k; g.halo.material.opacity = .1 + .22 * k; }); };
  breathe(0);
  window.__cx3dGlow = () => (data.buildings || []).filter(b => b.working).map(b => b.id);

  // Live effects (short, then removed). Each returns false when it has finished.
  const fxs = [], AT = id => { const [x, z] = POS[id] || POS.office; return new T.Vector3(x, 0, z); };
  const HT = { office: 3.4, lab: 3.6, studio: 3.6, school: 5, family: 3.6, ministry: 3.6, launch: .3 };
  const gone = o => { s.remove(o); o.traverse(m => { m.geometry?.dispose(); m.material?.dispose(); }); };
  const path = (a, b) => { // the buildings a job passes, following the glowing lines
    const nb = {}; (data.edges || []).forEach(e => { (nb[e.a] = nb[e.a] || []).push(e.b); (nb[e.b] = nb[e.b] || []).push(e.a); });
    const prev = { [a]: null }, q = [a];
    while (q.length) { const c = q.shift(); if (c === b) break; (nb[c] || []).forEach(n => { if (!(n in prev)) { prev[n] = c; q.push(n); } }); }
    if (!(b in prev)) return [a, b];
    const out = []; for (let c = b; c != null; c = prev[c]) out.unshift(c); return out;
  };
  const fx = {
    pulse(id, colour = '#7FD8FF') { const p = AT(id), ring = new T.Mesh(new T.RingGeometry(.6, .9, 48), new T.MeshBasicMaterial({ color: colour, transparent: true, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, .08, p.z); const lamp = new T.PointLight(colour, 0, 12); lamp.position.set(p.x, HT[id] || 3, p.z + 1); s.add(ring, lamp);
      let t0 = null; fxs.push(t => { t0 ??= t; const k = (t - t0) / 2600; if (k >= 1) { gone(ring); s.remove(lamp); lamp.dispose?.(); return false; }
        const w = Math.sin(k * Math.PI * 2) ** 2; ring.scale.setScalar(1 + k * 4); ring.material.opacity = (1 - k) * .8; lamp.intensity = 18 * w; return true; }); },
    sparkle(id) { const p = AT(id), g = new T.Group(), cols = ['#FFE27A', '#FFFFFF', '#7FD8FF', '#3FD18B', '#FFB4A2'];
      const bits = Array.from({ length: 26 }, (_, i) => { const m = new T.Mesh(new T.SphereGeometry(.09, 8, 6), new T.MeshBasicMaterial({ color: cols[i % 5], transparent: true }));
        const a = Math.random() * Math.PI * 2, u = .6 + Math.random() * 1.4; m.userData.v = new T.Vector3(Math.cos(a) * u, 2 + Math.random() * 2, Math.sin(a) * u); g.add(m); return m; });
      g.position.set(p.x, HT[id] || 3, p.z); s.add(g);
      let t0 = null; fxs.push(t => { t0 ??= t; const k = (t - t0) / 1800; if (k >= 1) { gone(g); return false; }
        bits.forEach(m => { const v = m.userData.v; m.position.set(v.x * k * 1.6, v.y * k - 2.6 * k * k, v.z * k * 1.6); m.material.opacity = 1 - k; }); return true; }); },
    glow(id, colour = '#F5A623') { const p = AT(id), halo = new T.Mesh(new T.CircleGeometry(3.2, 48), new T.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0 }));
      halo.rotation.x = -Math.PI / 2; halo.position.set(p.x, .06, p.z); const lamp = new T.PointLight(colour, 0, 10); lamp.position.set(p.x, (HT[id] || 3) + .5, p.z + 1.2); s.add(halo, lamp);
      let t0 = null; fxs.push(t => { t0 ??= t; const k = (t - t0) / 4200; if (k >= 1) { gone(halo); s.remove(lamp); lamp.dispose?.(); return false; }
        const w = .5 - .5 * Math.cos(k * Math.PI * 6); halo.material.opacity = .45 * w * (1 - k * .5); lamp.intensity = 14 * w; return true; }); },
    travel(a, b, colour = '#E6A16F') { const pts = path(a, b).map(AT); if (pts.length < 2) return;
      const card = new T.Mesh(new T.BoxGeometry(.9, .6, .08), new T.MeshStandardMaterial({ color: '#FFFFFF', emissive: colour, emissiveIntensity: .7 })); s.add(card);
      const legs = pts.slice(1).map((q, i) => pts[i].distanceTo(q)), total = legs.reduce((x, y) => x + y, 0), dur = Math.min(6000, 1400 + total * 160);
      let t0 = null; fxs.push(t => { t0 ??= t; const k = (t - t0) / dur; if (k >= 1) { gone(card); fx.pulse(b, colour); return false; }
        let d = k * total, i = 0; while (i < legs.length - 1 && d > legs[i]) { d -= legs[i]; i++; } const f = Math.min(1, d / legs[i]);
        card.position.lerpVectors(pts[i], pts[i + 1], f); card.position.y = 1.2 + Math.sin(f * Math.PI) * .8; card.rotation.y = t / 500; return true; }); },
    walk(id, colour = '#4EA8FF') { const p = AT(id), who = new T.Group(), M2 = new T.MeshStandardMaterial({ color: colour }), skin = new T.MeshStandardMaterial({ color: '#E2A97E' });
      const body = new T.Mesh(new T.CylinderGeometry(.22, .28, .8, 12), M2); body.position.y = .55; const head = new T.Mesh(new T.SphereGeometry(.22, 14, 10), skin); head.position.y = 1.15;
      who.add(body, head); s.add(who); const from = new T.Vector3(p.x + 1.5, 0, p.z + 5.5), to = new T.Vector3(p.x, 0, p.z + 1.9);
      let t0 = null; fxs.push(t => { t0 ??= t; const k = (t - t0) / 2600; if (k >= 1.25) { gone(who); return false; }
        const f = Math.min(1, k); who.position.lerpVectors(from, to, f); who.position.y = f < 1 ? Math.abs(Math.sin(f * 18)) * .12 : 0;
        who.lookAt(to.x, 0, to.z + (f < 1 ? 0 : -1)); who.scale.setScalar(k > 1 ? Math.max(.01, (1.25 - k) * 4) : 1); return true; }); }
  };
  function frame(t) {
    if (!alive) return; requestAnimationFrame(frame);
    if (!visible) return;
    for (let i = fxs.length - 1; i >= 0; i--) if (!fxs[i](t)) fxs.splice(i, 1);
    if (glowing.length && !RM.matches) { breathe(t); dirty = true; }
    if (fxs.length) dirty = true;
    if (glows.length && !RM.matches) { const k = .6 + .4 * Math.sin(t / 380); glows.forEach(m => { m.material.emissiveIntensity = k; }); dirty = true; }
    if (!dirty) return; dirty = false; place(); r.render(s, cam);
    const w = root.clientWidth, h = root.clientHeight;
    lbls.forEach(({ el, p }) => { v3.copy(p).project(cam); el.style.transform = `translate(-50%,-100%) translate(${(v3.x + 1) / 2 * w}px,${(1 - v3.y) / 2 * h}px)`; el.hidden = v3.z > 1; });
  }
  requestAnimationFrame(frame);
  window.__cx3d = { state: () => ({ theta, dist, ph, buildings: lbls.length, lines: (data.edges || []).length, glowing: glowing.length }) };
  const api = { fx, dispose() { alive = false; ro.disconnect(); io.disconnect(); r.dispose(); root.remove(); if (window.CAMPUS3D.current === api) window.CAMPUS3D.current = null; } };
  window.CAMPUS3D.current = api;
  return api;
}

window.CAMPUS3D = { supported, create, current: null };
dispatchEvent(new Event('campus3d-ready'));
