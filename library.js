
(function(){
'use strict';
function build(E){
const THREE = window.THREE, scene = E.scene, D = E.D, TYPE_COL = E.TYPE_COL, rnd = E.rnd, mat = E.mat, glowTex = E.glowTex;
const DEG = Math.PI/180, TAU = Math.PI*2, R = 0.3;
const norm = a => ((a % TAU) + TAU) % TAU;
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const P = (r, a) => [r*Math.sin(a), r*Math.cos(a)];
const angOf = (x, z) => Math.atan2(x, z);
const GLOWS = {};
const glowMat = c => GLOWS[c] || (GLOWS[c] = new THREE.MeshBasicMaterial({color:c}));

const ISL = 26, FH = 4.8, RA = 6.2, RW = 11.75, RO = 12.3, RB = 12.85, SLAB = 0.45;
const CEIL0 = 14.0, SKY_Y = 15.5, LR = 7.0;
const TIERS_C = [{r:5.2, y:14.6}, {r:4.0, y:15.1}, {r:3.0, y:15.5}];
const fy = k => k*FH;
const ST = {r0:1.15, r1:3.0, N:28, turns:1.25, land:30*DEG, a0:40*DEG};
ST.dA = ST.turns*TAU/ST.N; ST.rise = FH/ST.N; ST.rm = (ST.r0 + ST.r1)/2;
ST.flight = k => ST.a0 + k*(ST.turns*TAU + ST.land);
ST.landing = k => ST.flight(k - 1) + ST.turns*TAU + ST.land/2;
ST.top = ST.flight(1) + ST.turns*TAU + ST.land;
const BRIDGE_W = 1.7;
const SW = 4.4, SD = 0.9, SH = 3.8, TIERS = 5, BASE_Y = 0.42, tierH = (SH - BASE_Y - 0.12)/TIERS;
const MAHOG = 0x3a1e12, MAHOG_L = 0x57301d, MAHOG_D = 0x21100a, BRASS = 0xc9a45a, GOLD = 0xd4b064;
const CONC = 0x8c7f7a, CONC_L = 0x9c8e86, CONC_D = 0x4e4456, OAK = 0xb48659, FLOORW = 0x4e3322, GUNJO = 0x1f3a96, GUNJO_D = 0x172b70, BRONZE = 0x3a2c22;
const WINGLOW = [0xffc46e, 0xe9a258, 0xffd48a, 0xd8914c];
const RAILGLASS = new THREE.MeshLambertMaterial({color:0xbfd6ff, transparent:true, opacity:0.16, depthWrite:false});
const DECK = 0x3b3d5c;
const DOOR_A = 8.5*DEG;
const BA = [null, norm(ST.landing(1)), norm(ST.landing(2))];
const Z1 = RB + 1.75;
const LOWG = [[0, 120, 240], [60, 180, 247, 300]];
const LOW = {r0:8.85, r1:9.45, h:1.3, gw:7*DEG};
const CORR = RW - 1.3;

const NS = 12, SA = TAU/NS, SG = {}, CUTS = [];
const OUT = new THREE.Group(); OUT.userData.root = 1; scene.add(OUT);
function sec(kind, f, a){ const s = kind === 'fl' && f === 0 ? 0 : Math.floor(norm(a)/SA) % NS, key = kind + f + '_' + s;
  if (!SG[key]){ const g = new THREE.Group(); g.userData.root = 1; scene.add(g); SG[key] = g; CUTS.push({g, kind, f, a:kind === 'fl' && f === 0 ? 0 : (s + 0.5)*SA}); }
  return SG[key]; }
const forSectors = fn => { for (let s = 0; s < NS; s++) fn(s*SA, (s + 1)*SA, (s + 0.5)*SA); };
const rootOf = o => { while (o && !o.userData.root && o !== scene) o = o.parent; return o && o !== scene ? o : OUT; };

const box = (w, h, d, c, x = 0, y = 0, z = 0, parent = OUT, shadow = true) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? mat(c) : c);
  m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
const cyl = (rt, rb, h, m, x, y, z, parent = OUT, seg = 12, shadow = true) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'number' ? mat(m) : m);
  o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o; };
const _w = new THREE.Vector3();
const toWorld = (parent, x, y, z) => { parent.updateWorldMatrix(true, false); return _w.set(x, y, z).applyMatrix4(parent.matrixWorld); };

const HALOS = new Map();
function halo(color, size, x, y, z, parent = OUT, op = 0.55, bob){
  const w = toWorld(parent, x, y, z), root = rootOf(parent), c = new THREE.Color(color).multiplyScalar(op);
  if (!HALOS.has(root)) HALOS.set(root, []); HALOS.get(root).push([w.x, w.y, w.z, size, c.r, c.g, c.b, bob == null ? -1 : bob]);
}

const POOLS = {out:[], 0:[], 1:[], 2:[]};
function pool(color, size, x, y, z, op = 0.3, parent = OUT){
  const w = toWorld(parent, x, y, z), r = Math.hypot(w.x, w.z), k = r > RB + 0.2 ? 'out' : w.y < FH - 1 ? 0 : w.y < 2*FH - 1 ? 1 : 2;
  const c = new THREE.Color(color).multiplyScalar(op); POOLS[k].push([w.x, w.y + 0.035, w.z, size, c.r, c.g, c.b]);
}
function sectorGeo(r0, r1, a0, a1, y0, y1){
  const n = Math.max(1, Math.ceil((a1 - a0)/(3.75*DEG))), sh = new THREE.Shape();
  for (let i = 0; i <= n; i++){ const [x, z] = P(r1, a0 + (a1 - a0)*i/n); i ? sh.lineTo(x, z) : sh.moveTo(x, z); }
  if (r0 <= 0.001) sh.lineTo(0, 0); else for (let i = n; i >= 0; i--){ const [x, z] = P(r0, a0 + (a1 - a0)*i/n); sh.lineTo(x, z); }
  const g = new THREE.ExtrudeGeometry(sh, {depth:y1 - y0, bevelEnabled:false});
  g.rotateX(Math.PI/2); g.translate(0, y1, 0); return g;
}
function ann(r0, r1, a0, a1, y0, y1, c, parent, shadow = true){
  const m = new THREE.Mesh(sectorGeo(r0, r1, a0, a1, y0, y1), typeof c === 'number' ? mat(c) : c);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function rbox(w, h, d, c, r, a, y, parent, yaw = 0, shadow = true){ const [x, z] = P(r, a), m = box(w, h, d, c, x, y, z, parent, shadow); m.rotation.y = a + yaw; return m; }
const chord = (r, da) => 2*r*Math.sin(da/2);
function starInlay(x, y, z, s, par){
  [0, 1].forEach(i => { const m = box(s*2, 0.01, s*0.28, GOLD, x, y, z, par, false); m.rotation.y = i*Math.PI/2 + Math.PI/4; });
  [0, 1].forEach(i => { const m = box(s*1.1, 0.012, s*0.18, 0xe8c878, x, y + 0.002, z, par, false); m.rotation.y = i*Math.PI/2; });
  box(s*0.25, 0.016, s*0.25, glowMat(0xfff0c0), x, y + 0.004, z, par, false);
}
function tube(points, rad, c, parent, seg){
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg || points.length*2, rad, 5, false), typeof c === 'number' ? mat(c) : c);
  m.castShadow = false; m.receiveShadow = true; parent.add(m); return m;
}
const arcPts = (r, a0, a1, y, step = 4*DEG) => { const n = Math.max(1, Math.ceil((a1 - a0)/step)), out = [];
  for (let i = 0; i <= n; i++){ const [x, z] = P(r, a0 + (a1 - a0)*i/n); out.push(new THREE.Vector3(x, y, z)); } return out; };

const OBST = {0:[], 1:[], 2:[]};
const polarBox = (k, r0, r1, a, hw, ah) => OBST[k].push({r0, r1, a, hw, ah});
const circ = (k, x, z, rad) => OBST[k].push({x, z, rad});
const SEATS = [];
const seat = (kind, name, x, z, face, y, o) => SEATS.push([kind, name, x, z, face, y, o]);

const WF_A = Math.atan2(-11.6, Math.sqrt(ISL*ISL - 11.6*11.6));
(() => {
  const T = 1.4, n = Math.ceil(ISL*2/T), im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), n*n);
  im.receiveShadow = true; const m4 = new THREE.Matrix4(), col = new THREE.Color(); let c = 0;
  const plaza = (x, z) => Math.abs(x) < 8.2 && z > 12.2 && z < ISL - 0.6;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
    const x = -ISL + (i + 0.5)*T, z = -ISL + (j + 0.5)*T, r = Math.hypot(x, z);
    if (r > ISL - 0.3 || r < RB - 0.6) continue;
    const v = rnd('gt' + i + '_' + j);
    m4.makeScale(T - 0.02, 0.3, T - 0.02); m4.setPosition(x, plaza(x, z) ? -0.2 : -0.17 + (v - 0.5)*0.02, z);
    im.setMatrixAt(c, m4); im.setColorAt(c++, col.setRGB(0.10 + v*0.05, 0.20 + v*0.07, 0.17 + v*0.05));
  }
  im.count = c; OUT.add(im);
  const PT = 1.2, pim = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), 400); let pc = 0;
  for (let j = 0; j < 12; j++) for (let i = 0; i < 14; i++){
    const x = -7.8 + (i + 0.5)*PT, z = 12.4 + (j + 0.5)*PT; if (Math.hypot(x, z) < RB + 0.25 || Math.hypot(x, z) > ISL - 0.5) continue;
    const v = rnd('pv' + i + '_' + j), dark = (i + j) % 2;
    m4.makeScale(PT - 0.05, 0.3, PT - 0.05); m4.setPosition(x, -0.13, z); pim.setMatrixAt(pc, m4);
    pim.setColorAt(pc++, dark ? col.setRGB(0.36 + v*0.04, 0.33 + v*0.04, 0.40 + v*0.04) : col.setRGB(0.55 + v*0.04, 0.51 + v*0.04, 0.55 + v*0.04));
  }
  pim.count = pc; pim.receiveShadow = true; OUT.add(pim);
  [0x4a3d5e, 0x41365a, 0x372d4e, 0x2d2442, 0x231c36].forEach((c, i) => cyl(ISL - i*3.6, ISL - i*3.6 - 2.2, 1.3, c, 0, -0.95 - i*1.3, 0, OUT, 24, false));
  const N = 70, rk = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), N), q = new THREE.Quaternion(), e = new THREE.Euler(); let nr = 0;
  for (let i = 0; i < N; i++){ const a = i/N*TAU + rnd('ra' + i)*0.08; if (Math.abs(angDiff(a, WF_A)) < 5*DEG) continue;
    const r = ISL - 1.2 - rnd('rr' + i)*2.0, sz = 1.0 + rnd('rs' + i)*1.9, hy = sz*1.7;
    e.set((rnd('rx' + i) - 0.5)*0.7, rnd('ry' + i)*3, (rnd('rz' + i) - 0.5)*0.7); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(Math.sin(a)*r, -0.6 - hy*0.6 - rnd('rh' + i)*2.4, Math.cos(a)*r), q, new THREE.Vector3(sz, hy, sz));
    rk.setMatrixAt(nr, m4); const v = rnd('rv' + i); rk.setColorAt(nr++, col.setRGB(0.20 + v*0.12, 0.17 + v*0.1, 0.30 + v*0.14)); }
  rk.count = nr; OUT.add(rk);
  for (let i = 0; i < 14; i++){ const a = rnd('cr' + i)*TAU, r = 4 + rnd('cq' + i)*12, h = 0.6 + rnd('ch' + i)*1.8, y = -3 - rnd('cy' + i)*4;
    const c = rnd('cc' + i) > 0.5 ? 0x9f86ff : 0xffc98a, m = box(0.3, h, 0.3, glowMat(c), Math.sin(a)*r, y, Math.cos(a)*r, OUT, false); m.rotation.z = (rnd('cz' + i) - 0.5)*0.5;
    if (i % 3 === 0) halo(c, 2.4, Math.sin(a)*r, y, Math.cos(a)*r, OUT, 0.3); }
})();

const SIGN = {x:-5.6, z:23.0, w:5.4};
(() => {
  box(5.2, 0.7, 0.5, 0x4a4352, SIGN.x, 0.35, SIGN.z); box(5.4, 0.08, 0.6, 0x5c556a, SIGN.x, 0.74, SIGN.z, OUT, false);
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 110; const g2 = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter;
  const draw = () => { g2.fillStyle = '#2a2632'; g2.fillRect(0, 0, 640, 110); g2.strokeStyle = '#c9a45a'; g2.lineWidth = 6; g2.strokeRect(6, 6, 628, 98);
    g2.font = '58px DotGothic16, "Noto Sans JP", monospace'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillStyle = '#ffd88a'; g2.fillText(HK.T(HK.cfg.title), 320, 58); tex.needsUpdate = true; };
  draw(); try { document.fonts.load('58px DotGothic16', HK.T(HK.cfg.title)).then(draw); } catch(e) {}
  const sm = new THREE.MeshLambertMaterial({color:0xffffff, map:tex, emissive:0xffffff, emissiveMap:tex, emissiveIntensity:0.6}), sd = mat(0x2a2632);
  const sg = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.76, 0.12), [sd, sd, sd, sd, sm, sd]); sg.position.set(SIGN.x, 0.42, SIGN.z + 0.27); OUT.add(sg);
  halo(0xffd890, 4, SIGN.x, 0.5, SIGN.z + 0.6, OUT, 0.18);
})();

(() => {
  const PAIR = 20*DEG;
  for (let k = 0; k < 2; k++){
    const y0 = k ? fy(k) + 0.05 : 0.38, y1 = fy(k + 1) - 0.5, hh = y1 - y0, yc = (y0 + y1)/2, off = (k*7.3 + 3)*DEG;
    for (let j = 0; j < 18; j++){
      const p0 = off + j*PAIR, cw = PAIR*(0.34 + 0.2*rnd('cw' + k + '_' + j)), ca = p0 + cw/2, ga0 = p0 + cw, ga1 = p0 + PAIR;
      const inPortal = a => k === 0 && Math.abs(angDiff(a, 0)) < 17*DEG;
      if (!inPortal(ca)){
        const par = sec('wall', k, ca), pr = 0.08 + 0.5*rnd('pr' + k + '_' + j), yaw = (j % 2 ? 1 : -1)*(4 + 6*rnd('yw' + k + '_' + j))*DEG;
        const c = new THREE.Color(CONC).multiplyScalar(0.94 + 0.08*rnd('cv' + k + '_' + j)).getHex();
        rbox(chord(RO, cw) + 0.1, hh, 0.55 + pr, c, RW + (0.55 + pr)/2, ca, yc, par, yaw);
        rbox(0.05, hh - 0.2, 0.04, CONC_D, RO + pr + 0.01, ca + cw*0.42*(j % 2 ? 1 : -1), yc, par, 0, false);
      }
      const gm = (ga0 + ga1)/2, gw = chord(RO - 0.2, ga1 - ga0) + 0.06;
      if (inPortal(gm)) continue;
      const par = sec('wall', k, gm), gl = WINGLOW[Math.floor(rnd('wg' + k + '_' + j)*4)], dim = rnd('wd' + k + '_' + j) < 0.45;
      rbox(gw, hh, 0.05, glowMat(dim ? 0xb8763e : gl), RO - 0.18, gm, yc, par, 0, false);
      if (dim) for (let i = 0; i < 6; i++) rbox(gw*0.9, 0.06, 0.07, 0x3a2216, RO - 0.14, gm, y0 + 0.5 + i*(hh - 0.9)/5, par, 0, false);
      rbox(gw, hh, 0.04, 0x1b2346, RW - 0.03, gm, yc, par, 0, false);
      const nm = Math.max(1, Math.round(hh/1.15));
      for (let i = 1; i < nm; i++) rbox(gw, 0.05, 0.08, 0x2b2a36, RO - 0.12, gm, y0 + hh*i/nm, par, 0, false);
      rbox(0.05, hh, 0.08, 0x2b2a36, RO - 0.12, gm, yc, par, 0, false);
      if (rnd('wh' + k + '_' + j) < 0.35){ const [x, z] = P(RO + 0.3, gm); halo(gl, 2.6, x, yc, z, par, 0.22); }
    }
  }
  forSectors((a0, a1, am) => {
    [1, 2].forEach(k => { const par = sec('wall', k, am);
      ann(RW, RB, a0, a1, fy(k) - 0.5, fy(k) + 0.05, CONC_L, par);
      ann(RB - 0.02, RB + 0.04, a0, a1, fy(k) - 0.5, fy(k) - 0.46, glowMat(0xffe3b0), par, false); });

    const b0 = sec('wall', 0, am);
    const segs = [[a0, a1]].flatMap(([s0, s1]) => { const d0 = angDiff(s0, 0), d1 = angDiff(s1, 0);
      if (d1 <= -DOOR_A || d0 >= DOOR_A) return [[s0, s1]];
      const out = []; if (d0 < -DOOR_A) out.push([s0, s0 + (-DOOR_A - d0)]); if (d1 > DOOR_A) out.push([s1 - (d1 - DOOR_A), s1]); return out; });
    segs.forEach(([s0, s1]) => ann(RW, RB + 0.2, s0, s1, 0, 0.38, 0x4a4352, b0));
    if (Math.abs(angDiff(am, 0)) < SA){ const t0 = Math.max(a0, -DOOR_A + (am > Math.PI ? TAU : 0)), t1 = Math.min(a1, DOOR_A + (am > Math.PI ? TAU : 0)); if (t1 > t0) ann(RW, RB + 0.2, t0, t1, 0, 0.03, 0x5c556a, b0, false); }
    const top = sec('wall', 2, am), yd = fy(2);
    ann(RW, RB, a0, a1, yd + 0.02, yd + 0.42, CONC_L, top);
    ann(RB - 0.3, RB - 0.26, a0, a1, yd + 0.42, yd + 1.12, RAILGLASS, top, false);
    tube(arcPts(RB - 0.28, a0, a1, yd + 1.15), 0.05, BRASS, top);
    for (let i = 0; i < 4; i++) rbox(0.04, 0.72, 0.04, BRONZE, RB - 0.28, a0 + (a1 - a0)*i/4, yd + 0.78, top, 0, false);
    { const [x, z] = P(RB - 0.55, am); box(0.12, 0.18, 0.12, glowMat(0xffd48a), x, yd + 0.52, z, top, false); halo(0xffc070, 1.4, x, yd + 0.55, z, top, 0.5); }
  });

  { const rf = sec('roof', 0, 0);
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g2 = cv.getContext('2d');
    for (let r = 0; r < 4; r++) for (let i = -1; i < 5; i++){ const x = i*32 + (r % 2)*16, v = rnd('rt' + r + '_' + i);
      g2.fillStyle = `hsl(${208 + v*14},${38 + v*14}%,${22 + v*9}%)`; g2.fillRect(x, r*32, 31, 31);
      g2.fillStyle = 'rgba(160,200,255,.12)'; g2.fillRect(x, r*32, 31, 3); g2.fillStyle = 'rgba(0,0,10,.32)'; g2.fillRect(x, r*32 + 27, 31, 4); }
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.repeat.set(0.55, 0.55);
    const rm = new THREE.MeshLambertMaterial({color:0xffffff, map:tex});
    ann(TIERS_C[0].r, LR + 0.25, 0, TAU, 14.1, 14.5, rm, rf); ann(TIERS_C[1].r, TIERS_C[0].r, 0, TAU, 14.7, 15.0, rm, rf); ann(TIERS_C[2].r, TIERS_C[1].r, 0, TAU, 15.2, 15.45, rm, rf);
    ann(TIERS_C[0].r - 0.06, TIERS_C[0].r, 0, TAU, 14.5, 15.0, glowMat(0xbcd2ff), rf, false);
    ann(TIERS_C[1].r - 0.06, TIERS_C[1].r, 0, TAU, 15.0, 15.45, glowMat(0xbcd2ff), rf, false);
    [[LR + 0.25, 14.5], [TIERS_C[0].r, 15.0], [TIERS_C[1].r, 15.45]].forEach(([r, y]) => ann(r - 0.08, r + 0.06, 0, TAU, y - 0.04, y + 0.03, GOLD, rf, false));
    const dy = 15.47, dr = TIERS_C[2].r - 0.05;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(dr, 18, 5, 0, TAU, 0, Math.PI/2), glowMat(0x6f8ad0)); dome.scale.y = 0.42; dome.position.y = dy; rf.add(dome);
    for (let i = 0; i < 9; i++){ const a = i/9*TAU, pts = []; for (let t = 0; t <= 6; t++){ const ph = t/6*Math.PI/2, r = (dr + 0.04)*Math.cos(ph);
      pts.push(new THREE.Vector3(r*Math.sin(a), dy + (dr + 0.04)*0.42*Math.sin(ph), r*Math.cos(a))); } tube(pts, 0.035, 0x6b5a3a, rf, 10); }
    const fy0 = dy + dr*0.42;
    cyl(0.05, 0.08, 0.7, GOLD, 0, fy0 + 0.3, 0, rf, 8);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), glowMat(0xffe08a)); star.position.set(0, fy0 + 0.85, 0); star.scale.set(1, 1.4, 0.4); rf.add(star);
    const st2 = star.clone(); st2.rotation.y = Math.PI/2; rf.add(st2);
    halo(0xffd890, 3.2, 0, fy0 + 0.85, 0, rf, 0.55); halo(0xd6e8ff, 5, 0, dy + 0.6, 0, rf, 0.22); }
  for (let i = 0; i < 18; i++){ const a = (i + 0.5)/18*TAU; if (Math.abs(angDiff(a, 0)) < 0.3) continue; const [x, z] = P(RB + 1.6, a); pool(0xffb866, 4.2, x, 0, z, 0.13); }

  { const par = sec('wall', 0, 0), A = 17*DEG, ncol = 12;
    for (let i = 0; i < ncol; i++){ const a = -A + (i + 0.5)*2*A/ncol, w = chord(RO, 2*A/ncol) + 0.04, open = i >= 3 && i <= 8;
      if (!open){ rbox(w, 2.3, 0.06, glowMat(i % 3 === 1 ? 0xffe2a6 : 0xffcf86), RO - 0.18, a, 0.38 + 1.15, par, 0, false);
        rbox(0.07, 2.3, 0.1, 0x2b2a36, RO - 0.12, a - A/ncol, 0.38 + 1.15, par, 0, false); }
      else if (i === 3 || i === 8) rbox(0.12, 2.7, 0.16, 0x2b2a36, RO - 0.12, i === 3 ? a - A/ncol : a + A/ncol, 1.35, par, 0, false);
      for (let r = 0; r < 3; r++){ const glass = (i + r) % 2 === 0, y = 2.95 + (r + 0.5)*0.44;
        rbox(w, 0.44, glass ? 0.06 : 0.5, glass ? glowMat(0xf0d6a8) : CONC_L, glass ? RO - 0.18 : RW + 0.3, a, y, par, 0, !glass); }
    }
    rbox(chord(RO, 2*A), 0.06, 0.6, 0x2b2a36, RO - 0.05, 0, 2.92, par, 0, false);
    const cz0 = RO, cz1 = RO + 1.5; rbox(9.4, 0.14, cz1 - cz0, 0x7a6e78, (cz0 + cz1)/2, 0, 2.78, par, 0, true);
    rbox(9.5, 0.08, 0.06, GOLD, cz1 + 0.02, 0, 2.8, par, 0, false);
    for (let i = -2; i <= 2; i++){ box(0.2, 0.03, 0.2, glowMat(0xfff0c8), i*1.9, 2.7, RO + 0.9, par, false); pool(0xffc070, 3.0, i*1.9, 0.02, RO + 1.0, 0.14); }
    halo(0xffc070, 6, 0, 1.6, RO + 0.6, par, 0.18);
    [0, 1].forEach(s => ann(RB + 0.2 + s*0.7, RB + 0.9 + s*0.7, -20*DEG + s*2*DEG, 20*DEG - s*2*DEG, 0, 0.05 - s*0.02, 0x5c556a, OUT, false));
  }
})();

const POINTS = [];
const bridgeHalf = r => Math.asin((BRIDGE_W/2 + 0.05)/r);
const F0 = new THREE.Group(); F0.userData.root = 1; scene.add(F0);
(() => {
  ann(0, RA, 0, TAU, -0.3, 0.02, 0x75695f, F0);
  ann(RA, RW + 0.05, 0, TAU, -0.3, 0.02, FLOORW, F0);
  ann(RA - 0.04, RA + 0.04, 0, TAU, 0.02, 0.035, BRASS, F0, false);
  ann(3.35, 3.42, 0, TAU, 0.02, 0.035, BRASS, F0, false);
  ann(0, 1.0, 0, TAU, 0.02, 0.03, GUNJO, F0, false); ann(0.92, 1.0, 0, TAU, 0.03, 0.04, GOLD, F0, false);
  for (let i = 0; i < 8; i++){ const a = i/8*TAU; rbox(0.05, 0.012, 2.3, BRASS, 1.0 + 1.15, a, 0.03, F0, 0, false); }
  pool(0xe6ecff, 6.0, 0, 0.0, 0, 0.16); pool(0xfff2d8, 2.6, 0, 0.0, 0, 0.2);
  [1, 2].forEach(k => {
    const y = fy(k), bh = bridgeHalf(RA + 0.1);
    forSectors((a0, a1, am) => {
      const par = sec('fl', k, am);
      ann(RA, RW + 0.02, a0, a1, y - SLAB, y - 0.03, CONC_L, par);
      if (k < 2) ann(RA + 0.14, RW, a0, a1, y - 0.03, y, FLOORW, par);
      else {
        ann(RA + 0.14, RB - 0.04, a0, a1, y - 0.03, y + 0.02, DECK, par);
        [9.2, 11.1].forEach(r => ann(r - 0.03, r + 0.03, a0, a1, y + 0.02, y + 0.03, GOLD, par, false));
        const pts = [0, 1, 2].map(n => { const aa = a0 + (a1 - a0)*(0.15 + 0.7*rnd('ds' + am.toFixed(2) + n)), rr = 7.4 + 3.4*rnd('dr' + am.toFixed(2) + n); return P(rr, aa); });
        pts.forEach(([x, z], n) => starInlay(x, y + 0.03, z, n ? 0.22 : 0.34, par));
        for (let n = 0; n < 2; n++){ const [x0, z0] = pts[n], [x1, z1] = pts[n + 1], L = Math.hypot(x1 - x0, z1 - z0);
          const m = box(L, 0.006, 0.025, GOLD, (x0 + x1)/2, y + 0.028, (z0 + z1)/2, par, false); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); }
      }
      ann(RA, RA + 0.14, a0, a1, y - 0.03, y + 0.01, BRASS, par, false);
      ann(RA + 0.22, RA + 0.32, a0, a1, y - SLAB - 0.05, y - SLAB, glowMat(0xffd59a), par, false);
      const ba = BA[k], segs = [], d0 = angDiff(a0, ba), d1 = angDiff(a1, ba);
      if (d0 < -bh && d1 > bh && d1 - d0 < Math.PI) segs.push([a0, ba + Math.round((a0 - ba)/TAU)*TAU - bh], [ba + Math.round((a0 - ba)/TAU)*TAU + bh, a1]);
      else if (Math.abs(d0) < bh && Math.abs(d1) < bh) {}
      else if (Math.abs(d0) < bh) segs.push([a1 - (d1 - bh), a1]);
      else if (Math.abs(d1) < bh) segs.push([a0, a0 + (-bh - d0)]);
      else segs.push([a0, a1]);
      segs.forEach(([s0, s1]) => {
        if (s1 - s0 < 0.01) return;
        par.add(new THREE.Mesh(sectorGeo(RA + 0.06, RA + 0.1, s0, s1, y + 0.08, y + 1.0), RAILGLASS));
        tube(arcPts(RA + 0.08, s0, s1, y + 1.04), 0.045, BRASS, par);
        tube(arcPts(RA + 0.08, s0, s1, y + 0.1), 0.025, BRONZE, par);
        const np = Math.max(1, Math.round((s1 - s0)/(6*DEG)));
        for (let i = 0; i <= np; i++){ const a = s0 + (s1 - s0)*i/np; rbox(0.035, 0.95, 0.035, BRONZE, RA + 0.08, a, y + 0.55, par, 0, false); }
        for (let i = 0; i < np; i += 2){ const a = s0 + (s1 - s0)*(i + 0.5)/np, [x, z] = P(RA + 0.3, a); box(0.09, 0.05, 0.09, glowMat(0xffe1a8), x, y + 0.04, z, par, false); }
      });
      { const [x, z] = P(RA + 0.5, am); halo(0xffcf90, 2.0, x, y + 0.2, z, par, 0.25); }
    });
    { const ba = BA[k], par = sec('fl', k, ba), r0 = ST.r1 - 0.1, r1 = RA + 0.2, len = r1 - r0, rc = (r0 + r1)/2;
      rbox(BRIDGE_W, 0.22, len, CONC_L, rc, ba, y - 0.13, par); rbox(BRIDGE_W - 0.2, 0.03, len, OAK, rc, ba, y - 0.005, par);
      rbox(BRIDGE_W + 0.04, 0.06, len, glowMat(0xffd59a), rc, ba, y - 0.27, par, 0, false);
      [-1, 1].forEach(sd => { const off = sd*(BRIDGE_W/2 - 0.04), t = [Math.cos(ba), -Math.sin(ba)];
        const [cx, cz] = P(rc, ba), pts = [-1, 1].map(e => { const [ex, ez] = P(len/2*e, ba); return new THREE.Vector3(cx + ex + t[0]*off, y + 1.02, cz + ez + t[1]*off); });
        tube(pts, 0.04, BRASS, par, 4);
        for (let i = 0; i <= 5; i++){ const u = -len/2 + len*i/5, [ex, ez] = P(u, ba); box(0.03, 0.95, 0.03, BRONZE, cx + ex + t[0]*off, y + 0.5, cz + ez + t[1]*off, par, false); }
        const gp = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, len), RAILGLASS); gp.position.set(cx + t[0]*off, y + 0.52, cz + t[1]*off); gp.rotation.y = ba; par.add(gp); });
    }
    const L = new THREE.PointLight(0xffc680, 0.9, 18, 2); L.position.set(0, y + 3.2, 0); scene.add(L); POINTS.push(L);
  });
  { const L = new THREE.PointLight(0xffc680, 0.9, 18, 2); L.position.set(0, 3.0, 0); scene.add(L); POINTS.push(L); }
})();

const SHELF_LAYOUT = [{n:10, off:30, step:300/9, seat:1.5}, {n:10, off:18, step:36, seat:1.9}];
const SHELVES = [], bookShelf = {}, BOOKM = [];
(() => {
  let si = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color(), e0 = new THREE.Euler();
  SHELF_LAYOUT.forEach((L, k) => {
    for (let i = 0; i < L.n; i++){
      const s = D.shelves[si] || {name:'棚' + si, kind:'', books:[]}; si++;
      const a = (L.off + i*L.step)*DEG, r = RW - SD/2 - 0.12, par = sec('wall', k, a);
      const g = new THREE.Group(), [x, z] = P(r, a); g.position.set(x, fy(k), z); g.rotation.y = a + Math.PI; par.add(g);
      const B = (w, h, d, c, x, y, z, sh = true) => box(w, h, d, c, x, y, z, g, sh), FZ = SD/2;
      B(SW + 0.3, 0.3, SD + 0.24, MAHOG_D, 0, 0.15, 0); B(SW + 0.36, 0.05, SD + 0.3, MAHOG_L, 0, 0.32, 0);
      B(SW - 0.3, SH, 0.08, MAHOG_D, 0, SH/2, -FZ + 0.04);
      for (const sx of [-1, 1]){ const cx = sx*(SW/2 - 0.12); B(0.24, SH, SD + 0.04, MAHOG, cx, SH/2, 0); B(0.18, SH - 0.5, 0.03, MAHOG_L, cx, SH/2, FZ + 0.03, false); }
      for (let t = 0; t <= TIERS; t++){ const y = BASE_Y + t*tierH; B(SW - 0.44, 0.07, SD - 0.04, MAHOG, 0, y, 0); B(SW - 0.44, 0.05, 0.03, MAHOG_L, 0, y + 0.005, FZ - 0.02, false); }
      B(SW + 0.06, 0.22, SD + 0.06, MAHOG, 0, SH + 0.11, 0); B(SW + 0.26, 0.08, SD + 0.2, MAHOG_L, 0, SH + 0.32, 0); B(SW + 0.4, 0.1, SD + 0.3, MAHOG, 0, SH + 0.41, 0);
      B(0.9, 0.14, 0.02, BRASS, 0, SH + 0.11, FZ + 0.045, false);
      B(SW - 0.6, 0.03, 0.06, glowMat(0xffe3a8), 0, SH - 0.08, FZ + 0.2, false);
      for (let t = 1; t <= TIERS; t++) B(SW - 0.6, 0.02, 0.02, glowMat(0xffcf8a), 0, BASE_Y + t*tierH - 0.05, -FZ + 0.12, false);
      halo(0xffc98a, 3.4, 0, SH - 0.5, FZ + 0.35, g, 0.26);
      pool(0xffb866, 4.2, 0, 0, FZ + 1.1, 0.22, g);

      const per = Math.max(1, Math.ceil(s.books.length/TIERS)), slotW = Math.min(0.44, (SW - 0.9)/Math.max(per, 7)), list = [];
      s.books.forEach((bid, j) => {
        const b = D.books[bid]; if (!b) return;
        const t = TIERS - 1 - Math.floor(j/per), kk = j % per, len = Math.min(1, (b.body || '').length/2500), rr = rnd(bid);
        const bh = tierH*(0.6 + len*0.24 + rr*0.08), bw = slotW*(0.8 + rr*0.18), bd = SD*(0.62 + rr*0.08);
        const bx = -SW/2 + 0.46 + slotW*(kk + 0.5), yb = BASE_Y + 0.035 + t*tierH + bh/2, bz = 0.02, tilt = (kk === per - 1 && rr > 0.55 && per > 2) ? 0.1 : 0;
        const c = new THREE.Color(TYPE_COL[b.type] || TYPE_COL.other).offsetHSL((rr - 0.5)*0.04, (rr - 0.5)*0.12, (rr - 0.5)*0.12);
        list.push([bid, bx + tilt*bh*0.5, yb, bz, bw, bh, bd, tilt, c]);
      });
      const nb = list.reduce((a, it) => a + 2 + (rnd(it[0]) > 0.5 ? 3 : 2), 0);
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), Math.max(1, nb)), ids = []; let n = 0;
      list.forEach(([bid, bx, yb, bz, bw, bh, bd, tilt, c]) => {
        q.setFromEuler(e0.set(0, 0, tilt));
        const put = (px, py, pz, sx, sy, sz, cc) => { pos.set(px, py, pz); sc.set(sx, sy, sz); m4.compose(pos, q, sc); im.setMatrixAt(n, m4); im.setColorAt(n, cc); ids[n++] = bid; };
        put(bx, yb, bz, bw, bh, bd, c);
        put(bx, yb + bh/2 - 0.012, bz - 0.02, bw*0.86, 0.02, bd*0.9, col.setHex(0xeee2c4));
        (rnd(bid) > 0.5 ? [0.12, 0.2, 0.84] : [0.16, 0.86]).forEach(f => put(bx, yb - bh/2 + bh*f, bz + bd/2 + 0.004, bw*1.01, 0.018, 0.01, col.setHex(GOLD)));
      });
      im.count = n; im.castShadow = true; im.receiveShadow = true; im.userData.ids = ids; g.add(im); BOOKM.push(im);
      const [fx, fz] = P(CORR - 0.3, a);
      const sh = {...s, idx:si - 1, level:k, a, x, z, y:fy(k), top:fy(k) + SH + 0.5, fx, fz, face:a, mesh:im, cut:par};
      s.books.forEach(bid => { bookShelf[bid] = sh; });
      SHELVES.push(sh);
    }
  });
})();

const SHADE_M = new THREE.MeshLambertMaterial({color:0x1f6b45, side:THREE.DoubleSide});
function bankerLamp(x, y, z, par){
  cyl(0.1, 0.12, 0.03, BRASS, x, y + 0.015, z, par); cyl(0.015, 0.015, 0.26, BRASS, x, y + 0.15, z, par, 6);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.42, 12, 1, false, 0, Math.PI), SHADE_M);
  sh.rotation.z = Math.PI/2; sh.position.set(x, y + 0.3, z); par.add(sh);
  box(0.4, 0.012, 0.12, glowMat(0xfff0c0), x, y + 0.28, z, par, false); halo(0xffd890, 1.6, x, y + 0.22, z, par, 0.6);
  pool(0xffc070, 2.8, x, y - 0.8, z, 0.26, par);
}
const FURN0 = new THREE.Group(); FURN0.userData.root = 1; scene.add(FURN0);
function railDesk(k, a){
  const y = fy(k), par = sec('fl', k, a), r = RA + 1.05;
  rbox(1.5, 0.07, 0.7, MAHOG, r, a, y + 0.78, par); rbox(1.3, 0.02, 0.5, 0x1f4a33, r, a, y + 0.82, par, 0, false);
  [-0.65, 0.65].forEach(d => { const [x, z] = P(r, a + d/r); cyl(0.035, 0.03, 0.76, MAHOG_D, x, y + 0.38, z, par, 6); });
  rbox(0.5, 0.06, 0.48, MAHOG, r + 0.75, a, y + 0.46, par); rbox(0.44, 0.07, 0.42, 0x6d1c26, r + 0.75, a, y + 0.51, par, 0, false);
  rbox(0.5, 0.6, 0.06, MAHOG, r + 1.0, a, y + 0.78, par);
  { const [x, z] = P(r, a + 0.45/r); bankerLamp(x, y + 0.82, z, par); }
  { const [x, z] = P(r - 0.05, a - 0.3/r); box(0.3, 0.06, 0.22, 0x2a3558, x, y + 0.85, z, par, false); }
  polarBox(k, r - 0.35, r + 1.05, a, 0.75);
  { const [x, z] = P(r + 0.75, a); seat('sit', '吹き抜けの一人席', x, z, a + Math.PI, y + 0.22, {lv:k}); }
}
function windowSeat(k, a, w = 2.4){
  const y = fy(k), par = sec('wall', k, a), r = RW - 0.42;
  rbox(w, 0.42, 0.62, MAHOG_L, r, a, y + 0.21, par); rbox(w - 0.1, 0.1, 0.56, 0x6d1c26, r, a, y + 0.47, par, 0, false);
  [-1, 1].forEach((d, i) => rbox(0.42, 0.32, 0.12, [0x2a3558, 0xb08a44][i], r + 0.2, a + d*(w/2 - 0.35)/r, y + 0.66, par, 0.2*(i ? 1 : -1), false));
  const [x, z] = P(r - 0.15, a + (w/2 - 0.12)/r); cyl(0.05, 0.08, 0.04, BRASS, x, y + 0.54, z, par, 8);
  box(0.1, 0.16, 0.1, glowMat(0xffd48a), x, y + 0.64, z, par, false); halo(0xffc070, 1.4, x, y + 0.64, z, par, 0.55);
  pool(0xffb866, 2.6, x, y, z - 0.2, 0.24, par);
  { const [sx, sz] = P(r - 0.05, a); seat('sit', '窓ぎわのベンチ', sx, sz, a + Math.PI, y + 0.27, {lv:k}); }
}
SHELF_LAYOUT.forEach((L, k) => { for (let i = 0; i < L.n; i++){ const a = (L.off + (i + 0.5)*L.step)*DEG; if (k === 0 && i === L.n - 1) continue; if (i % 2 === (k % 2)) windowSeat(k, a, L.seat); } });
[205, 290, 20, 100].forEach(d => railDesk(1, d*DEG));
const DESKS0 = [[70, 4.2], [150, 4.2], [215, 4.25], [290, 4.25]];
(() => {
  DESKS0.forEach(([d, r]) => {
    const a = d*DEG, par = FURN0;
    rbox(2.2, 0.08, 0.95, MAHOG, r, a, 0.8, par); rbox(1.95, 0.02, 0.7, 0x1f4a33, r, a, 0.845, par, 0, false); rbox(2.24, 0.05, 0.99, MAHOG_L, r, a, 0.75, par);
    [[-0.95, -0.35], [0.95, -0.35], [-0.95, 0.35], [0.95, 0.35]].forEach(([u, v]) => { const [x, z] = P(r + v, a + u/(r + v)); cyl(0.045, 0.035, 0.74, MAHOG_D, x, 0.37, z, par, 8); });
    [-0.5, 0.5].forEach(u => { rbox(0.5, 0.06, 0.48, MAHOG, r + 0.85, a + u/r, 0.45, par); rbox(0.44, 0.07, 0.42, 0x6d1c26, r + 0.85, a + u/r, 0.5, par, 0, false); rbox(0.5, 0.6, 0.06, MAHOG, r + 1.1, a + u/r, 0.78, par);
      const [x, z] = P(r + 0.85, a + u/r); seat('sit', '閲覧席の椅子', x, z, a + u/r + Math.PI, 0.22, {lv:0, region:'lib'}); });
    { const [x, z] = P(r - 0.2, a + 0.6/r); bankerLamp(x, 0.85, z, par); }
    { const [x, z] = P(r, a - 0.4/r); box(0.6, 0.035, 0.45, 0xf6efdd, x, 0.87, z, par); }
    polarBox(0, r - 0.5, r + 1.15, a, 1.12);
  });
  [[100, 7.9], [250, 7.9], [175, 7.6]].forEach(([d, r]) => { const [x, z] = P(r, d*DEG), par = sec('fl', 0, d*DEG);
    cyl(0.26, 0.2, 0.46, 0x2c4a6e, x, 0.23, z, par, 12);
    [[0, 0.8, 0, 0.26, 0x2f6b3c], [0.2, 1.0, 0.1, 0.18, 0x3a7f47], [-0.18, 1.08, -0.1, 0.17, 0x2a5f36], [0.04, 1.3, 0.12, 0.15, 0x4a8f55]]
      .forEach(([u, y, v, rr, c]) => { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 0), mat(c)); l.position.set(x + u, y, z + v); l.castShadow = true; par.add(l); });
    circ(0, x, z, 0.3); });
})();

(() => {
  const types = Object.keys(TYPE_COL);
  for (let k = 0; k < 2; k++){
    const y = fy(k);
    forSectors((a0, a1, am) => {
      const par = sec('fl', k, am);
      ann(9.62, 10.58, a0, a1, y + 0.005, y + 0.02, 0xa8843e, par, false); ann(9.7, 10.5, a0, a1, y + 0.02, y + 0.03, 0x3a0e14, par, false);
      ann(9.82, 10.38, a0, a1, y + 0.03, y + 0.035, 0x4a1219, par, false);
      const segs = []; let s0 = a0;
      LOWG[k].forEach(gd => { const g = gd*DEG, g0 = g - LOW.gw, g1 = g + LOW.gw;
        [g0, g0 + TAU, g0 - TAU].forEach((h0, j) => { const h1 = h0 + 2*LOW.gw; if (h1 > a0 && h0 < a1){ if (h0 > s0) segs.push([s0, h0]); s0 = Math.max(s0, h1); } }); });
      if (s0 < a1) segs.push([s0, a1]);
      segs.sort((p, q) => p[0] - q[0]).forEach(([b0, b1]) => {
        if (b1 - b0 < 0.02) return;
        ann(LOW.r0 - 0.05, LOW.r1 + 0.05, b0, b1, y, y + 0.14, MAHOG_D, par);
        ann(LOW.r0, LOW.r1, b0, b1, y + 0.14, y + LOW.h - 0.06, MAHOG_D, par);
        ann(LOW.r0 - 0.06, LOW.r1 + 0.06, b0, b1, y + LOW.h - 0.06, y + LOW.h, MAHOG_L, par);
        ann(LOW.r0 - 0.07, LOW.r0 - 0.03, b0, b1, y + LOW.h - 0.04, y + LOW.h + 0.01, BRASS, par, false);
        [[0.2, 0.62], [0.7, 1.16]].forEach(([t0, t1], ti) => {
          ann(LOW.r0 - 0.02, LOW.r1 + 0.02, b0, b1, y + t0 - 0.05, y + t0, MAHOG, par, false);
          let a = b0;
          while (a < b1 - 0.003){
            const w = (0.12 + 0.2*rnd('lw' + k + ti + Math.round(a*1000)))/LOW.r0, e = Math.min(b1, a + w), rr = rnd('lc' + k + ti + Math.round(a*1000));
            const t = types[Math.floor(rr*types.length)], c = new THREE.Color(TYPE_COL[t]).offsetHSL((rr - 0.5)*0.05, 0, (rr - 0.5)*0.14).getHex();
            const top = y + t0 + (t1 - t0)*(0.72 + 0.25*rnd('lh' + k + ti + Math.round(a*1000)));
            if (e - a > 0.002) ann(LOW.r0 + 0.02, LOW.r1 - 0.02, a + 0.0015, e - 0.0015, y + t0, top, c, par, false);
            a = e;
          }
        });
      });
      if (Math.round(am/SA) % 2 === k % 2){ const [x, z] = P((LOW.r0 + LOW.r1)/2, am + 0.6*SA/2);
        box(0.12, 0.2, 0.12, glowMat(0xffd48a), x, y + LOW.h + 0.1, z, par, false); halo(0xffc070, 1.5, x, y + LOW.h + 0.12, z, par, 0.5); pool(0xffb866, 3.0, x, y, z, 0.2, par); }
    });
  }
})();

const ORBS = {im:null, list:[]};
(() => {
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), new THREE.MeshBasicMaterial(), 12), col = new THREE.Color();
  for (let i = 0; i < 12; i++){
    const a = i/12*TAU + rnd('oa' + i), r = 3.6 + rnd('or' + i)*2.0, y = 2 + rnd('oy' + i)*11, c = [0xffd36b, 0x9fd8ff, 0xe7a0c0, 0xb8a8ff][i % 4], [x, z] = P(r, a), ph = rnd('op' + i)*6;
    ORBS.list.push({x, y, z, ph}); im.setColorAt(i, col.setHex(c)); halo(c, 1.1, x, y, z, OUT, 0.55, ph);
  }
  im.frustumCulled = false; OUT.add(im); ORBS.im = im;
})();

(() => {
  const y = fy(2);
  const loc = (r, a, par) => { const g = new THREE.Group(), [x, z] = P(r, a); g.position.set(x, y, z); g.rotation.y = a; par.add(g); return g; };
  [[330, 10.0], [345, 10.0], [62, 10.0], [130, 10.1]].forEach(([d, r]) => { const a = d*DEG, g = loc(r, a, sec('fl', 2, a));
    box(0.7, 0.12, 1.9, MAHOG_L, 0, 0.32, 0.1, g); box(0.62, 0.1, 1.5, 0xe9dcc4, 0, 0.42, 0.3, g, false);
    const bk = box(0.62, 0.1, 0.8, 0xe9dcc4, 0, 0.62, -0.72, g, false); bk.rotation.x = -0.75;
    [[-0.3, 0.9], [0.3, 0.9], [-0.3, -0.7], [0.3, -0.7]].forEach(([u, v]) => box(0.05, 0.28, 0.05, MAHOG_D, u, 0.14, v, g, false));
    box(0.34, 0.14, 0.12, 0x2a3558, 0, 0.75, -0.8, g, false);
    box(0.4, 0.04, 0.4, MAHOG, 0.65, 0.5, -0.4, g); box(0.05, 0.48, 0.05, MAHOG_D, 0.65, 0.25, -0.4, g, false);
    box(0.09, 0.14, 0.09, glowMat(0xffd48a), 0.65, 0.6, -0.4, g, false); halo(0xffc070, 1.2, 0.65, 0.62, -0.4, g, 0.5); pool(0xffb866, 2.4, 0.65, 0, -0.4, 0.2, g);
    polarBox(2, r - 0.85, r + 1.05, a, 0.85);
    { const [x, z] = P(r, a); seat('sit', 'デッキの寝椅子', x, z, a, y + 0.36, {lv:2, recline:0.95}); } });
  [[100], [155], [292]].forEach(([d]) => { const a = d*DEG, g = loc(11.15, a, sec('fl', 2, a));
    box(2.0, 0.08, 0.55, MAHOG_L, 0, 0.45, 0, g); box(2.0, 0.5, 0.07, MAHOG_L, 0, 0.75, -0.28, g); [-0.85, 0.85].forEach(u => box(0.07, 0.44, 0.5, BRONZE, u, 0.22, 0, g, false));
    polarBox(2, 10.8, 11.6, a, 1.0);
    { const [x, z] = P(11.15, a); seat('sit', 'デッキのベンチ', x, z, a, y + 0.27, {lv:2}); } });
  { const a = 24*DEG, g = loc(10.75, a, sec('fl', 2, a));
    [0, 1, 2].forEach(i => { const ang = i/3*TAU, leg = cyl(0.025, 0.025, 1.25, BRONZE, Math.sin(ang)*0.28, 0.58, Math.cos(ang)*0.28, g, 6); leg.rotation.set(Math.cos(ang)*0.25, 0, -Math.sin(ang)*0.25); });
    cyl(0.06, 0.06, 0.12, BRASS, 0, 1.18, 0, g, 8);
    const tg = new THREE.Group(); tg.position.set(0, 1.28, 0); tg.rotation.x = 0.95; g.add(tg);
    cyl(0.075, 0.09, 1.25, BRASS, 0, 0.25, 0, tg, 10); cyl(0.1, 0.1, 0.14, MAHOG_D, 0, 0.86, 0, tg, 10); cyl(0.03, 0.03, 0.2, BRONZE, 0, -0.42, 0, tg, 6);
    cyl(0.085, 0.085, 0.02, glowMat(0x9fd8ff), 0, 0.93, 0, tg, 10, false); halo(0x9fd8ff, 0.8, 0, 0.95, 0, tg, 0.5);
    const [x, z] = P(10.75, a); circ(2, x, z, 0.45); }
  [[88, 11.3], [242, 11.3], [305, 11.3], [175, 7.6], [228, 7.6]].forEach(([d, r]) => { const a = d*DEG, [x, z] = P(r, a), par = sec('fl', 2, a);
    cyl(0.24, 0.18, 0.42, 0x2c4a6e, x, y + 0.21, z, par, 10);
    [[0, 0.75, 0, 0.26, 0x2f6b3c], [0.18, 0.95, 0.1, 0.18, 0x3a7f47], [-0.16, 1.02, -0.1, 0.17, 0x2a5f36]].forEach(([u, yy, v, rr, c]) => { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 0), mat(c)); l.position.set(x + u, y + yy, z + v); l.castShadow = true; par.add(l); });
    circ(2, x, z, 0.3); });
  { const ba = BA[2], par = sec('fl', 2, ba), g = loc(RA + 0.55, ba, par);
    [-1, 1].forEach(sd => { box(0.14, 2.5, 0.14, 0xe9e2d4, sd*1.0, 1.25, 0, g); box(0.22, 0.12, 0.22, BRASS, sd*1.0, 0.06, 0, g, false);
      box(0.16, 0.24, 0.16, glowMat(0xffe0a0), sd*1.0, 2.62, 0, g, false); halo(0xffd08a, 1.8, sd*1.0, 2.62, 0, g, 0.6);
      const t = [Math.cos(ba), -Math.sin(ba)], [cx, cz] = P(RA + 0.55, ba); circ(2, cx + t[0]*sd, cz + t[1]*sd, 0.15); });
    const arc = []; for (let i = 0; i <= 10; i++){ const t = i/10*Math.PI; arc.push(new THREE.Vector3(-Math.cos(t)*1.0, 2.5 + Math.sin(t)*0.55, 0)); }
    tube(arc, 0.05, GOLD, g, 20);
    const [sx, sz] = P(RA + 2.2, ba); starInlay(sx, y + 0.04, sz, 0.75, par); pool(0xffd8a0, 3.6, sx, y + 0.02, sz, 0.22, par); }
})();

const SEC = {a:200*DEG, h:18*DEG, r0:8.5, r1:12.2, ht:3.3};
const SECRET = {shell:new THREE.Group(), front:new THREE.Group(), roof:new THREE.Group(), inner:new THREE.Group()};
(() => {
  const y = fy(2), a0 = SEC.a - SEC.h, a1 = SEC.a + SEC.h, S = SECRET, ST_ = 0x6e5f72, VEL = 0x5c1c2c, VEL_D = 0x3e0f1c;
  Object.values(S).forEach(g => { g.userData.root = 1; scene.add(g); });
  const dh = 0.82/SEC.r0, DADO = 1.1;
  ann(SEC.r1 - 0.22, SEC.r1, a0, a1, y, y + SEC.ht, ST_, S.shell);
  [a0, a1].forEach(a => rbox(0.22, SEC.ht, SEC.r1 - SEC.r0, ST_, (SEC.r0 + SEC.r1)/2, a, y + SEC.ht/2, S.shell));
  [[a0, SEC.a - dh], [SEC.a + dh, a1]].forEach(([b0, b1]) => { ann(SEC.r0, SEC.r0 + 0.24, b0, b1, y, y + DADO, ST_, S.shell); ann(SEC.r0 - 0.06, SEC.r0, b0, b1, y, y + 0.3, MAHOG_D, S.shell); });
  { const [x, z] = P(SEC.r1 + 0.02, SEC.a); const w = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), glowMat(0xd0603a)); w.position.set(x, y + 2.1, z); w.rotation.y = SEC.a; S.shell.add(w);
    const [hx, hz] = P(SEC.r1 + 0.3, SEC.a); halo(0xd07040, 1.6, hx, y + 2.1, hz, S.shell, 0.35); }
  [[a0, SEC.a - dh], [SEC.a + dh, a1]].forEach(([b0, b1]) => ann(SEC.r0, SEC.r0 + 0.24, b0, b1, y + DADO, y + SEC.ht, ST_, S.front));
  ann(SEC.r0, SEC.r0 + 0.24, SEC.a - dh, SEC.a + dh, y + 2.62, y + SEC.ht, ST_, S.front);
  ann(SEC.r0 - 0.1, SEC.r0 + 0.26, a0 - 0.6*DEG, a1 + 0.6*DEG, y + SEC.ht - 0.28, y + SEC.ht, MAHOG, S.front);
  ann(SEC.r0 - 0.12, SEC.r0 - 0.08, a0, a1, y + SEC.ht - 0.32, y + SEC.ht - 0.28, GOLD, S.front, false);
  for (let i = 0; i <= 4; i++){ if (i === 2) continue; const a = a0 + (a1 - a0)*i/4; rbox(0.2, SEC.ht - 0.3, 0.08, MAHOG, SEC.r0 - 0.04, a, y + (SEC.ht - 0.3)/2, S.front); }
  { const g = new THREE.Group(), [x, z] = P(SEC.r0, SEC.a); g.position.set(x, y, z); g.rotation.y = SEC.a + Math.PI; S.front.add(g);
    [-1, 1].forEach(sd => box(0.18, 2.7, 0.34, MAHOG_L, sd*0.74, 1.35, 0.02, g));
    box(1.66, 0.2, 0.36, MAHOG_L, 0, 2.7, 0.02, g);
    const arc = []; for (let i = 0; i <= 10; i++){ const t = i/10*Math.PI; arc.push(new THREE.Vector3(-Math.cos(t)*0.74, 2.8 + Math.sin(t)*0.32, 0.2)); } tube(arc, 0.045, GOLD, g, 20);
    box(1.3, 2.5, 0.12, 0x2a140c, 0, 1.25, -0.08, g);
    for (let i = 0; i < 5; i++) box(0.24, 2.44, 0.04, i % 2 ? 0x4a2414 : 0x3e1d10, -0.52 + i*0.26, 1.25, 0.0, g, false);
    [0.45, 1.3, 2.1].forEach(yy => { box(1.28, 0.08, 0.03, GOLD, 0, yy, 0.035, g, false); for (let i = 0; i < 5; i++) box(0.05, 0.05, 0.03, 0xe8c878, -0.52 + i*0.26, yy, 0.05, g, false); });
    box(0.26, 0.4, 0.04, GOLD, 0.42, 1.15, 0.05, g, false);
    box(0.08, 0.08, 0.02, 0x0a0608, 0.42, 1.2, 0.075, g, false); box(0.03, 0.1, 0.02, 0x0a0608, 0.42, 1.12, 0.075, g, false);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 6, 12), mat(GOLD)); ring.position.set(-0.4, 1.12, 0.08); g.add(ring);
    box(0.06, 0.06, 0.3, BRONZE, 0, 3.05, 0.15, g, false); box(0.18, 0.26, 0.18, glowMat(0xffcf80), 0, 2.92, 0.32, g, false); box(0.24, 0.05, 0.24, BRONZE, 0, 3.07, 0.32, g, false);
    halo(0xffc070, 1.8, 0, 2.92, 0.42, g, 0.45); pool(0xffb060, 3.0, 0, 0, 0.9, 0.24, g); }
  ann(SEC.r0 - 0.22, SEC.r1 + 0.08, a0 - 1*DEG, a1 + 1*DEG, y + SEC.ht, y + SEC.ht + 0.22, 0x24385c, S.roof);
  ann(SEC.r0 - 0.26, SEC.r0 - 0.18, a0 - 1*DEG, a1 + 1*DEG, y + SEC.ht + 0.15, y + SEC.ht + 0.26, GOLD, S.roof, false);
  { const [x, z] = P((SEC.r0 + SEC.r1)/2, SEC.a); const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat(0xffe08a)); st.position.set(x, y + SEC.ht + 0.5, z); st.scale.set(1, 1.4, 0.4); S.roof.add(st); }
  ann(SEC.r0 + 0.26, SEC.r1 - 0.24, a0 + 0.8*DEG, a1 - 0.8*DEG, y + 0.02, y + 0.05, VEL, S.inner, false);
  ann(SEC.r0 + 0.5, SEC.r1 - 0.5, a0 + 3*DEG, a1 - 3*DEG, y + 0.05, y + 0.058, GOLD, S.inner, false); ann(SEC.r0 + 0.58, SEC.r1 - 0.58, a0 + 3.6*DEG, a1 - 3.6*DEG, y + 0.058, y + 0.064, VEL_D, S.inner, false);
  ann(SEC.r1 - 0.26, SEC.r1 - 0.22, a0, a1, y + 0.05, y + SEC.ht - 0.05, VEL_D, S.inner, false);
  [1.0, 2.9].forEach(yy => ann(SEC.r1 - 0.28, SEC.r1 - 0.26, a0, a1, y + yy, y + yy + 0.04, GOLD, S.inner, false));
  const loc = (r, a) => { const g = new THREE.Group(), [x, z] = P(r, a); g.position.set(x, y, z); g.rotation.y = a + Math.PI; S.inner.add(g); return g; };
  { const g = loc(SEC.r1 - 0.52, SEC.a);
    box(1.9, 2.1, 0.06, MAHOG_D, 0, 1.05, -0.2, g); [-1, 1].forEach(sd => box(0.08, 2.1, 0.44, MAHOG_D, sd*0.92, 1.05, 0, g)); box(2.0, 0.1, 0.5, MAHOG_L, 0, 2.15, 0, g);
    const cs = [0x5c1c2c, 0x8c2c40, 0x2a3558, 0x4a3f80, 0x1f3d2c, 0xb08a44];
    [0.25, 0.85, 1.45].forEach((yy, t) => { box(1.7, 0.05, 0.4, MAHOG, 0, yy, 0.02, g, false); let x = -0.8;
      while (x < 0.8){ const w = 0.08 + 0.07*rnd('sb' + t + x.toFixed(2)), h = 0.4 + 0.14*rnd('sh' + t + x.toFixed(2)), c = cs[Math.floor(rnd('sc' + t + x.toFixed(2))*cs.length)];
        box(w - 0.012, h, 0.3, c, x + w/2, yy + 0.025 + h/2, 0.05, g, false); box(w - 0.006, 0.02, 0.006, GOLD, x + w/2, yy + 0.025 + h*0.8, 0.205, g, false); x += w; } });
    box(1.6, 0.025, 0.04, glowMat(0xffcf8a), 0, 2.0, 0.2, g, false); [0.78, 1.38].forEach(yy => box(1.6, 0.02, 0.03, glowMat(0xffc070), 0, yy, 0.21, g, false));
    halo(0xffb070, 2.6, 0, 1.3, 0.5, g, 0.4); }
  { const g = loc(11.0, SEC.a + 9*DEG);
    box(0.95, 0.46, 0.58, 0x3a1a0e, 0, 0.27, 0, g); [-0.38, 0, 0.38].forEach(u => box(0.06, 0.48, 0.6, GOLD, u, 0.27, 0, g, false));
    box(0.97, 0.05, 0.6, GOLD, 0, 0.06, 0, g, false); box(0.12, 0.14, 0.03, GOLD, 0, 0.42, 0.3, g, false);
    [[0x8c2c40, -0.25], [0x2a3558, -0.05], [0x4a3f80, 0.15], [0xb08a44, 0.32]].forEach(([c, u], i) => { const b = box(0.14, 0.34, 0.42, c, u, 0.6 + (i % 2)*0.04, 0.0, g, false); b.rotation.z = (i - 1.5)*0.12; });
    box(0.85, 0.04, 0.48, glowMat(0xffc070), 0, 0.5, 0, g, false); halo(0xffc070, 1.6, 0, 0.62, 0, g, 0.55);
    const lid = new THREE.Group(); lid.position.set(0, 0.5, -0.29); lid.rotation.x = -1.05; g.add(lid);
    box(0.95, 0.06, 0.58, 0x3a1a0e, 0, 0.03, 0.29, lid); [-0.38, 0.38].forEach(u => box(0.06, 0.08, 0.6, GOLD, u, 0.03, 0.29, lid, false)); }
  { const g = loc(10.9, SEC.a - 10*DEG);
    box(0.75, 0.38, 0.7, VEL, 0, 0.3, 0, g); box(0.75, 0.75, 0.16, VEL, 0, 0.75, -0.28, g); [-0.37, 0.37].forEach(u => box(0.12, 0.55, 0.7, VEL_D, u, 0.4, 0, g)); box(0.77, 0.04, 0.72, GOLD, 0, 0.1, 0, g, false);
    cyl(0.02, 0.02, 1.2, GOLD, 0.7, 0.6, 0.3, g, 6); cyl(0.1, 0.06, 0.04, GOLD, 0.7, 1.2, 0.3, g, 8); box(0.04, 0.12, 0.04, glowMat(0xffd070), 0.7, 1.29, 0.3, g, false);
    halo(0xffb860, 1.4, 0.7, 1.3, 0.3, g, 0.6); }
  polarBox(2, SEC.r0 - 0.15, SEC.r1 + 0.6, SEC.a, 0, SEC.h + 1.5*DEG);
})();
[SECRET.shell, SECRET.front, SECRET.roof, SECRET.inner].forEach(g => CUTS.push({g, kind:'fl', f:2, a:SEC.a}));
const DOOR = (() => { const [x, z] = P(SEC.r0 - 0.75, SEC.a); return {x, z, face:SEC.a}; })();

const STAIR = new THREE.Group(); STAIR.userData.root = 1; scene.add(STAIR);
const stairY = (k, a) => fy(k) + (a - ST.flight(k))/ST.dA*ST.rise + ST.rise*0.5;
(() => {
  const g = STAIR, steps = [], lights = [], strM = new THREE.MeshLambertMaterial({color:0xece6da, side:THREE.DoubleSide});
  for (let k = 0; k < 2; k++){
    const A = ST.flight(k);
    for (let i = 0; i < ST.N; i++){
      const a = A + i*ST.dA, y = fy(k) + (i + 1)*ST.rise;
      ann(ST.r0 + 0.04, ST.r1 - 0.04, a, a + ST.dA*1.03, y - 0.06, y, OAK, g);
      ann(ST.r0 + 0.1, ST.r1 - 0.1, a + ST.dA*0.08, a + ST.dA*0.9, y - 0.075, y - 0.06, 0x8a6440, g, false);
      steps.push([a + ST.dA/2, y]);
    }
    [[ST.r1, ST.r1 + 0.06], [ST.r0 - 0.06, ST.r0]].forEach(([ra, rb], side) => {
      const pos = [], n = Math.ceil(ST.turns*TAU/(3*DEG));
      const v = (r, a, y) => { const [x, z] = P(r, a); return [x, y, z]; };
      for (let i = 0; i < n; i++){
        const a0 = A + ST.turns*TAU*i/n, a1 = A + ST.turns*TAU*(i + 1)/n, ya = stairY(k, a0), yb = stairY(k, a1), lo = 0.34, hi = 0.12;
        [ra, rb].forEach(r => { const p00 = v(r, a0, ya - lo), p01 = v(r, a1, yb - lo), p10 = v(r, a0, ya + hi), p11 = v(r, a1, yb + hi); pos.push(...p00, ...p01, ...p11, ...p00, ...p11, ...p10); });
        const b0 = v(ra, a0, ya - lo), b1 = v(ra, a1, yb - lo), c0 = v(rb, a0, ya - lo), c1 = v(rb, a1, yb - lo);
        pos.push(...b0, ...c1, ...b1, ...b0, ...c0, ...c1);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, strM); m.castShadow = true; m.receiveShadow = true; g.add(m);
      const rr = side ? ST.r0 + 0.02 : ST.r1 - 0.02, pts = [], led = [];
      for (let i = 0; i <= n; i++){ const a = A + ST.turns*TAU*i/n, [x, z] = P(rr, a), y = stairY(k, a); pts.push(new THREE.Vector3(x, y + 0.95, z)); const [lx, lz] = P(rr - (side ? -0.05 : 0.05), a); led.push(new THREE.Vector3(lx, y + 0.87, lz)); }
      tube(pts, side ? 0.035 : 0.045, BRASS, g, n);
      if (!side) tube(led, 0.018, glowMat(0xffdba0), g, n);
    });
  }
  const NB = steps.length*3, bal = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(BRONZE), NB), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
  let nb = 0; const kOf = y => y <= FH + 1e-6 ? 0 : 1;
  steps.forEach(([a, y]) => {
    const k = kOf(y);
    [[ST.r1 - 0.02, a - ST.dA*0.25], [ST.r1 - 0.02, a + ST.dA*0.25], [ST.r0 + 0.02, a]].forEach(([r, aa]) => {
      const top = stairY(k, aa) + 0.95, [x, z] = P(r, aa); pv.set(x, (y + top)/2, z); q.setFromEuler(new THREE.Euler(0, aa, 0)); sc.set(0.03, top - y, 0.03);
      m4.compose(pv, q, sc); bal.setMatrixAt(nb++, m4); });
    const [x, z] = P(ST.r1 - 0.09, a); lights.push([x, y + 0.08, z, a]);
  });
  bal.count = nb; bal.castShadow = true; g.add(bal);
  const lm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), glowMat(0xffe6b4), lights.length);
  lights.forEach(([x, y, z, a], i) => { pv.set(x, y, z); q.setFromEuler(new THREE.Euler(0, a, 0)); sc.set(0.16, 0.035, 0.03); m4.compose(pv, q, sc); lm.setMatrixAt(i, m4); });
  g.add(lm);
  lights.forEach(([x, y, z], i) => { if (i % 4 === 0) halo(0xffd090, 1.1, x, y + 0.05, z, g, 0.35); });
  [1, 2].forEach(k => { const c = ST.landing(k), a0 = c - ST.land/2, a1 = c + ST.land/2, y = fy(k);
    ann(ST.r0 - 0.06, ST.r1 + 0.06, a0, a1 + 0.5*DEG, y - 0.3, y, 0xece6da, g); ann(ST.r0 + 0.04, ST.r1 - 0.04, a0, a1, y - 0.005, y + 0.005, OAK, g, false);
    tube(arcPts(ST.r0 + 0.02, a0, a1, y + 0.95), 0.035, BRASS, g);
    for (let i = 0; i <= 3; i++) rbox(0.03, 0.95, 0.03, BRONZE, ST.r0 + 0.02, a0 + (a1 - a0)*i/3, y + 0.48, g, 0, false);
    const bh = Math.asin((BRIDGE_W/2)/ST.r1) + 1*DEG;
    [[c - ST.land/2, c - bh], [c + bh, c + ST.land/2]].forEach(([s0, s1]) => { tube(arcPts(ST.r1, s0, s1, y + 0.95, 2*DEG), 0.04, BRASS, g);
      if (k === 2){ rbox(0.03, 0.95, 0.03, BRONZE, ST.r1, s0, y + 0.48, g, 0, false); rbox(0.03, 0.95, 0.03, BRONZE, ST.r1, s1, y + 0.48, g, 0, false); } });
  });
  { const a = ST.flight(0) - 2*DEG; [ST.r0, ST.r1].forEach(r => { const [x, z] = P(r, a); cyl(0.07, 0.08, 1.1, BRASS, x, 0.55, z, g, 8);
      cyl(0.06, 0.06, 0.12, glowMat(0xfff0c8), x, 1.16, z, g, 8, false); halo(0xffd890, 1.4, x, 1.16, z, g, 0.5); }); }
})();

(() => {
  const side = new THREE.MeshLambertMaterial({color:GUNJO, side:THREE.DoubleSide});
  forSectors((a0, a1, am) => {
    const par = sec('ceil', 0, am);
    { const yd = fy(2), ca = a0, nearB = Math.abs(angDiff(ca, BA[2])) < 10*DEG, [x, z] = P(6.6, ca);
      if (!nearB){ cyl(0.08, 0.1, CEIL0 - yd, 0xe9e2d4, x, (yd + CEIL0)/2, z, par, 8); cyl(0.15, 0.15, 0.12, BRASS, x, yd + 0.06, z, par, 8); cyl(0.14, 0.1, 0.16, BRASS, x, CEIL0 - 0.08, z, par, 8); circ(2, x, z, 0.15); }
      ann(6.85, LR + 0.25, a0, a1, CEIL0 - 0.1, CEIL0 + 0.42, CONC_L, par); ann(6.9, LR + 0.2, a0, a1, CEIL0 - 0.14, CEIL0 - 0.1, glowMat(0xffe3b0), par, false); }
    const zones = [[TIERS_C[0].r, LR, CEIL0], [TIERS_C[1].r, TIERS_C[0].r, TIERS_C[0].y], [TIERS_C[2].r, TIERS_C[1].r, TIERS_C[1].y]];
    zones.forEach(([r0, r1, y], i) => {
      ann(r0, r1, a0, a1, y, y + 0.1, i % 2 ? GUNJO_D : GUNJO, par, false);
      const top = i < 2 ? TIERS_C[i].y : TIERS_C[2].y;
      par.add(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(r0 + 0.01, y), new THREE.Vector2(r0 + 0.01, top + 0.1)], 4, a0, a1 - a0), side));
      ann(r0 - 0.03, r0 + 0.07, a0, a1, y - 0.06, y, GOLD, par, false);
      const [x, z] = P(r0 + 0.25, am); box(0.1, 0.04, 0.1, glowMat(0xfff0cc), x, y - 0.03, z, par, false);
      if (i === 0){ const [hx, hz] = P(r0 + 0.4, am); halo(0xffe0b0, 1.6, hx, y - 0.15, hz, par, 0.3); }
      for (let n = 0; n < 3; n++){ const sa = a0 + (a1 - a0)*rnd('vs' + i + '_' + am.toFixed(2) + n), sy = y + 0.12 + (top - y)*rnd('vy' + i + am.toFixed(2) + n), [sx, sz] = P(r0 + 0.04, sa);
        box(0.07, 0.07, 0.07, glowMat(n ? 0xffe6a0 : 0xfff6dc), sx, sy, sz, par, false); }
    });
    ann(0, TIERS_C[2].r + 0.02, a0, a1, SKY_Y + 0.02, SKY_Y + 0.06, glowMat(0xb4c4ee), par, false);
    ann(TIERS_C[2].r - 0.08, TIERS_C[2].r + 0.04, a0, a1, SKY_Y - 0.05, SKY_Y + 0.07, GOLD, par, false);
  });
  { const par = sec('ceil', 0, 0); for (let i = 0; i < 9; i++) rbox(0.06, 0.05, TIERS_C[2].r*2, 0x6b5a3a, 0, i/9*Math.PI, SKY_Y + 0.07, par, 0, false); }
})();

function bake(root){
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), lam = [], bas = [], other = new Map();
  root.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.keep || Array.isArray(o.material)) return;
    const m = o.material;
    if (!m.map && m.type === 'MeshLambertMaterial' && !m.transparent && !(m.emissive && m.emissive.getHex()) && m.side === THREE.FrontSide) lam.push(o);
    else if (!m.map && m.type === 'MeshBasicMaterial' && !m.transparent && m.side === THREE.FrontSide) bas.push(o);
    else if (m.type === 'MeshLambertMaterial' || m.type === 'MeshBasicMaterial'){ if (!other.has(m)) other.set(m, []); other.get(m).push(o); } });
  const merge = (list, material, useCol, shadow) => {
    const pos = [], nor = [], col = [], uv = [], M = new THREE.Matrix4(), hasUv = list.every(o => !!o.geometry.attributes.uv);
    list.forEach(o => { M.multiplyMatrices(inv, o.matrixWorld);
      const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(M), p = g.attributes.position.array, n = g.attributes.normal.array, c = o.material.color;
      for (let i = 0; i < p.length; i += 3){ pos.push(p[i], p[i+1], p[i+2]); nor.push(n[i], n[i+1], n[i+2]); if (useCol) col.push(c.r, c.g, c.b); }
      if (hasUv){ const u = g.attributes.uv.array; for (let i = 0; i < u.length; i++) uv.push(u[i]); }
      g.dispose(); o.parent.remove(o); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    if (useCol) geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); if (hasUv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const out = new THREE.Mesh(geo, material); out.castShadow = shadow; out.receiveShadow = true; root.add(out);
  };
  if (lam.length) merge(lam, new THREE.MeshLambertMaterial({vertexColors:true}), true, true);
  if (bas.length) merge(bas, new THREE.MeshBasicMaterial({vertexColors:true}), true, false);
  other.forEach((list, m) => { if (list.length > 1) merge(list, m, false, !m.transparent && m.type === 'MeshLambertMaterial'); });
}
[OUT, F0, FURN0, STAIR, ...Object.values(SG), ...Object.values(SECRET)].forEach(bake);

const HALO_VS = `attribute vec2 crn; attribute float sz; attribute vec3 col; attribute float bob; uniform float t; varying vec2 vUv; varying vec3 vC;
  void main(){ vec3 c = position; if (bob >= 0.0) c.y += sin(t*0.6 + bob)*0.25;
    vec4 mv = modelViewMatrix*vec4(c, 1.0); mv.xy += crn*sz; gl_Position = projectionMatrix*mv; vUv = crn + 0.5; vC = col; }`;
const HALO_FS = `uniform sampler2D map; varying vec2 vUv; varying vec3 vC; void main(){ vec4 tx = texture2D(map, vUv); gl_FragColor = vec4(vC*tx.rgb, tx.a); }`;
const haloMat = new THREE.ShaderMaterial({uniforms:{map:{value:glowTex}, t:{value:0}}, vertexShader:HALO_VS, fragmentShader:HALO_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending});
HALOS.forEach((list, root) => {
  const n = list.length, pos = new Float32Array(n*12), crn = new Float32Array(n*8), sz = new Float32Array(n*4), col = new Float32Array(n*12), bob = new Float32Array(n*4), idx = [];
  const C = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]; let big = 0;
  list.forEach(([x, y, z, s, r, g, b, bb], i) => { big = Math.max(big, s);
    for (let v = 0; v < 4; v++){ const j = i*4 + v; pos.set([x, y, z], j*3); crn.set(C[v], j*2); sz[j] = s; col.set([r, g, b], j*3); bob[j] = bb; }
    idx.push(i*4, i*4 + 1, i*4 + 2, i*4, i*4 + 2, i*4 + 3); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('crn', new THREE.BufferAttribute(crn, 2));
  geo.setAttribute('sz', new THREE.BufferAttribute(sz, 1)); geo.setAttribute('col', new THREE.BufferAttribute(col, 3)); geo.setAttribute('bob', new THREE.BufferAttribute(bob, 1)); geo.setIndex(idx);
  geo.computeBoundingSphere(); geo.boundingSphere.radius += big + 0.3;
  const m = new THREE.Mesh(geo, haloMat); m.renderOrder = 2; m.userData.hdNoGlow = 1; root.add(m);
});

const poolMat = new THREE.MeshBasicMaterial({map:glowTex, vertexColors:true, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false});
const POOLM = {};
Object.entries(POOLS).forEach(([k, list]) => {
  if (!list.length) return;
  const pos = [], uv = [], col = [], idx = [];
  list.forEach(([x, y, z, s, r, g, b], i) => { const h = s/2;
    pos.push(x - h, y, z - h, x + h, y, z - h, x + h, y, z + h, x - h, y, z + h); uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    for (let v = 0; v < 4; v++) col.push(r, g, b); idx.push(i*4, i*4 + 2, i*4 + 1, i*4, i*4 + 3, i*4 + 2); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
  const m = new THREE.Mesh(geo, poolMat); m.renderOrder = 1; scene.add(m); POOLM[k] = m;
});

const HD = {objs:[], shafts:[], dust:null};
(() => {
  const ADD = {blending:THREE.CustomBlending, blendEquation:THREE.AddEquation, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor, blendSrcAlpha:THREE.ZeroFactor, blendDstAlpha:THREE.OneFactor};
  const VS = `varying vec2 vU; varying float vF; void main(){ vU = uv; vec4 mv = modelViewMatrix*vec4(position, 1.0); vF = abs(normalize(normalMatrix*normal).z); gl_Position = projectionMatrix*mv; }`;
  const shaftMat = (color, op, fall) => new THREE.ShaderMaterial({uniforms:{col:{value:new THREE.Color(color)}, op:{value:op}, t:{value:0}, fall:{value:fall}}, vertexShader:VS, fragmentShader:`
    uniform vec3 col; uniform float op, t, fall; varying vec2 vU; varying float vF;
    void main(){ float a = pow(vF, 1.6)*pow(vU.y, fall)*smoothstep(0.0, 0.08, vU.y); a *= 0.85 + 0.15*sin(vU.x*37.7 + t*0.5)*sin(vU.x*12.6 - t*0.3 + vU.y*4.0); gl_FragColor = vec4(col*a*op, 1.0); }`,
    transparent:true, depthWrite:false, side:THREE.DoubleSide, ...ADD});
  [[2.5, 1.35, 0xe6ecff, 0.34], [1.25, 0.7, 0xfff4dc, 0.24]].forEach(([rt, rb, c, op]) => { const h = SKY_Y - 0.02;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 28, 1, true), shaftMat(c, op, 0.55)); m.position.set(0, 0.02 + h/2, 0); m.renderOrder = 3; m.userData.hdNoGlow = 1;
    scene.add(m); HD.objs.push(m); HD.shafts.push(m); });
  const N = 160, g = new THREE.BufferGeometry(), p = new Float32Array(N*3);
  for (let i = 0; i < N; i++){ const a = rnd('da' + i)*TAU, r = Math.sqrt(rnd('dr' + i))*1.5; p[i*3] = Math.sin(a)*r; p[i*3 + 1] = rnd('dy' + i)*SKY_Y; p[i*3 + 2] = Math.cos(a)*r; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({size:2, sizeAttenuation:false, color:0xfff0d0, transparent:true, opacity:0.7, blending:THREE.AdditiveBlending, depthWrite:false}));
  pts.userData.hdNoGlow = 1; pts.renderOrder = 4; pts.frustumCulled = false; scene.add(pts); HD.objs.push(pts); HD.dust = pts;
  if (E.hd2dObjs) HD.objs.forEach(o => { o.visible = E.hd2dMode ? E.hd2dMode() === 2 : false; E.hd2dObjs.push(o); });
})();

const inBridge = (x, z, k) => { const ba = BA[k], u = x*Math.sin(ba) + z*Math.cos(ba), v = x*Math.cos(ba) - z*Math.sin(ba); return u >= ST.r1 - 0.1 && u <= RA + 0.45 && Math.abs(v) <= BRIDGE_W/2 - R; };
const inApproach = (r, th) => { const d = angDiff(th, ST.a0); return r >= ST.r0 + 0.15 && r <= ST.r1 + 0.45 && d >= -24*DEG && d <= -1*DEG; };
function hitObst(k, x, z, r, th){
  for (const o of OBST[k]){
    if (o.rad != null){ if (Math.hypot(x - o.x, z - o.z) < o.rad + R) return true; continue; }
    if (r > o.r0 - R && r < o.r1 + R && (o.ah ? Math.abs(angDiff(th, o.a)) < o.ah + R/r : Math.abs(angDiff(th, o.a))*r < o.hw + R)) return true;
  }
  return false;
}
function inLowGap(k, th, r){ return LOWG[k].some(g => Math.abs(angDiff(th, g*DEG))*r < LOW.gw*LOW.r0 - R); }
function blocked(x, z, lv){
  const r = Math.hypot(x, z), th = angOf(x, z);
  if (lv > 0){
    if (r > RB + 1) return null;
    if (inBridge(x, z, lv)) return false;
    if (r < RA + 0.1 + R) return true;
    if (lv === 1){ if (r > CORR) return true; if (r > LOW.r0 - 0.07 - R && r < LOW.r1 + 0.07 + R && !inLowGap(1, th, r)) return true; }
    else if (r > RW - R) return true;
    return hitObst(lv, x, z, r, th);
  }
  if (r > ISL - R) return null;
  const door = Math.abs(th)*r < DOOR_A*RO - R - 0.05;
  if (r > RW - 0.05 - R && r < RB + 0.2 + R) return !door;
  if (r >= RB + 0.2 + R) return false;
  if (r < ST.r1 + 0.12 + R) return !inApproach(r, th);
  if (r > CORR && !door) return true;
  if (r > LOW.r0 - 0.07 - R && r < LOW.r1 + 0.07 + R && !inLowGap(0, th, r)) return true;
  return hitObst(0, x, z, r, th);
}

const A0 = ST.flight(0);
function stairH(A){
  for (let k = 0; k < 2; k++){ const f0 = ST.flight(k), f1 = f0 + ST.turns*TAU;
    if (A <= f1) return Math.max(fy(k), Math.min(fy(k + 1), stairY(k, A)));
    if (A <= ST.flight(k + 1) || k === 1) return fy(k + 1); }
  return fy(2);
}
const landingAt = A => { for (let k = 1; k <= 2; k++){ const c = ST.landing(k); if (Math.abs(A - c) <= ST.land/2 + 0.01) return k; } return 0; };
function placeOnStair(Pl){ const A = Pl.st.A, [x, z] = P(ST.rm, A); Pl.x = x; Pl.z = z; const h = stairH(A); Pl.level = Math.min(2, Math.floor((h + 0.05)/FH)); }

function stairMove(Pl, dx, dz, sp, key, up, down){
  const A = Pl.st.A, tx = Math.cos(A), tz = -Math.sin(A), nx = Math.sin(A), nz = Math.cos(A), vt = dx*tx + dz*tz, vn = dx*nx + dz*nz, lk = landingAt(A);
  if (lk !== Pl.st.lk){ Pl.st.lk = lk; Pl.st.arr = key; }
  const exit = k => { Pl.st = null; Pl.level = k; const [x, z] = P(ST.r1 + 0.3, BA[k]); Pl.x = x; Pl.z = z; return angOf(nx, nz); };
  const ob = lk ? [Math.sin(BA[lk]), Math.cos(BA[lk])] : null;
  if (lk && key !== up && key !== down && key !== Pl.st.arr && dx*ob[0] + dz*ob[1] > 0.3){
    const d = ST.landing(lk) - A; if (Math.abs(d) < 3*DEG) return exit(lk);
    Pl.st.A += Math.sign(d)*Math.min(Math.abs(d), sp/ST.rm); placeOnStair(Pl); return angOf(nx, nz);
  }
  if (key !== Pl.st.key){ Pl.st.key = key; Pl.st.s = key === up ? 1 : key === down ? -1 : Math.abs(vt) > 0.2 ? Math.sign(vt) : (Pl.st.s || 1); }
  const s = Pl.st.s;
  let An = A + s*sp/ST.rm;
  if (An < A0 - 0.01){ Pl.st = null; Pl.level = 0; const [x, z] = P(ST.rm, A0 - 0.12); Pl.x = x; Pl.z = z; return angOf(-tx, -tz); }
  if (s > 0 && An >= ST.landing(2) && !(Pl.st.lk === 2 && Pl.st.from === 2)) return exit(2);
  An = Math.min(ST.top - 0.01, An); Pl.st.A = An; placeOnStair(Pl);
  return angOf(tx*s, tz*s);
}

function move(Pl, dx, dz, sp, key, up, down){
  if (Pl.st) return stairMove(Pl, dx, dz, sp, key, up, down);
  const nx = Pl.x + dx*sp, nz = Pl.z + dz*sp, r = Math.hypot(Pl.x, Pl.z), rn = Math.hypot(nx, nz), th = angOf(Pl.x, Pl.z), thn = angOf(nx, nz);
  if (!Pl.level && inApproach(r, th) && angDiff(thn, A0) > -1*DEG && rn >= ST.r0 - 0.1 && rn <= ST.r1 + 0.5){ Pl.st = {A:A0 + 0.01, s:1, key, lk:0}; placeOnStair(Pl); return angOf(Math.cos(A0), -Math.sin(A0)); }
  if (Pl.level > 0 && inBridge(Pl.x, Pl.z, Pl.level) && rn < ST.r1 + 0.05){ const A = ST.landing(Pl.level);
    Pl.st = {A, s:key === up ? 1 : -1, key, lk:Pl.level, arr:key, from:Pl.level}; placeOnStair(Pl); return angOf(-Math.sin(BA[Pl.level]), -Math.cos(BA[Pl.level])); }
  return null;
}
const release = Pl => { if (Pl.st){ Pl.st.key = null; Pl.st.arr = null; Pl.st.lk = landingAt(Pl.st.A); Pl.st.from = 0; } };
const stairHint = Pl => !Pl.st ? null : landingAt(Pl.st.A) ? `踊り場（${landingAt(Pl.st.A) + 1}階）：E か 橋の方へ押すと${landingAt(Pl.st.A) + 1}階へ ／ ↑ 上る ↓ 下りる` : 'らせん階段：↑ 上る ／ ↓ 下りる';
const exitLanding = Pl => { const k = Pl.st && landingAt(Pl.st.A); if (!k) return false; Pl.st = null; Pl.level = k; const [x, z] = P(ST.r1 + 0.3, BA[k]); Pl.x = x; Pl.z = z; Pl.face = BA[k]; return true; };

function slide(Pl, vx, vz, isBlocked){
  const r = Math.hypot(Pl.x, Pl.z); if (r > ISL || Pl.st) return false;
  const th = angOf(Pl.x, Pl.z), tx = Math.cos(th), tz = -Math.sin(th), nx = Math.sin(th), nz = Math.cos(th), L = Math.hypot(vx, vz);
  const vt = vx*tx + vz*tz, vn = vx*nx + vz*nz;
  for (const [ax, az] of [[tx*vt, tz*vt], [nx*vn, nz*vn]]){ const l = Math.hypot(ax, az); if (l < 0.3*L) continue;
    const k = 0.85*L/l, x = Pl.x + ax*k, z = Pl.z + az*k; if (!isBlocked(x, z)){ Pl.x = x; Pl.z = z; return true; } }
  return false;
}
const groundY = (x, z, lv) => lv > 0 && Math.hypot(x, z) < RB + 1 ? fy(lv) : 0;
const insideAt = Pl => Pl.st || Pl.level > 0 || Math.hypot(Pl.x, Pl.z) < RW - 0.1;

let nearD = 9;
function nearShelf(Pl){
  nearD = 9; if (Pl.st) return null; let best = null;
  const r = Math.hypot(Pl.x, Pl.z), th = angOf(Pl.x, Pl.z);
  if (r < 9.3) return null;
  for (const s of SHELVES){ if (s.level !== (Pl.level | 0)) continue;
    const d = RW - SD - 0.12 - r; if (d < -0.2 || d > 1.6) continue;
    if (Math.abs(angDiff(th, s.a))*r > SW/2 + 0.2) continue;
    if (d < nearD){ nearD = d; best = s; } }
  return best;
}
const nearDoor = Pl => !Pl.st && Pl.level === 2 && Math.hypot(Pl.x - DOOR.x, Pl.z - DOOR.z) < 1.5;

const CARD = (() => {
  const el = document.createElement('div'); el.id = 'secretCard'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:40;display:none;max-width:min(360px,calc(100vw - 32px));' +
    'background:rgba(28,14,22,.92);border:1px solid #c9a45a;border-radius:12px;padding:14px 16px 12px;color:#ffe9d6;font:14px/1.6 "DotGothic16","Noto Sans JP",sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5);text-align:center';
  el.innerHTML = '<div style="font-size:16px;color:#ffd88a">🔒 鍵がかかってる…</div><div style="color:#d9c3b8;font-size:12px;margin:2px 0 10px">この扉の先は、まだ準備中。</div>' +
    '<button id="secretX" style="display:block;margin:10px auto 0;background:none;border:1px solid rgba(255,220,180,.35);color:#d9c3b8;border-radius:8px;padding:3px 12px;font:inherit;font-size:12px;cursor:pointer">閉じる Esc</button>';
  document.body.appendChild(el);
  const hide = () => { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); };
  el.querySelector('#secretX').onclick = hide;
  addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  return {el, hide, show(){ el.style.display = 'block'; el.setAttribute('aria-hidden', 'false'); }, get open(){ return el.style.display === 'block'; }};
})();

const WEDGE = {wall:100*DEG, fl:104*DEG, ceil:150*DEG};
let cutKey = '';
function applyCut(Pl, camC, pitch, force){
  const inside = insideAt(Pl), L = Pl.st ? Math.min(2, Math.floor((stairH(Pl.st.A) + 0.6)/FH)) : (Pl.level | 0), pc = Math.atan2(camC.x, camC.z);
  const occ = [];
  if (inside){ const y0 = Pl.st ? stairH(Pl.st.A) : fy(L), tp = Math.max(0.2, Math.tan(pitch));
    for (let k = L + 1; k <= 2; k++) for (const dh of [-0.5, 1.2, 3.0]){ const d = (fy(k) + dh - y0)/tp, x = Pl.x + camC.x*d, z = Pl.z + camC.z*d, r = Math.hypot(x, z);
      if (r > RA - 1.5 && r < RB + 1) occ.push([k, angOf(x, z)]); } }
  const lanternOcc = {all:false, a:[]};
  if (inside && L === 2){ const tp = Math.max(0.2, Math.tan(pitch)); for (const h of [CEIL0 - 0.3, SKY_Y + 0.2]){ const d = (h - fy(2))/tp, x = Pl.x + camC.x*d, z = Pl.z + camC.z*d, r = Math.hypot(x, z);
    if (r < TIERS_C[0].r) lanternOcc.all = true; else if (r < LR + 1.2) lanternOcc.a.push(angOf(x, z)); } }
  const key = inside ? (lanternOcc.all ? 'A' : lanternOcc.a.map(a => Math.round(a/(6*DEG))).join(',')) + '|' + L + '|' + Math.round(pc/(4*DEG)) + '|' + occ.map(([k, a]) => k + ':' + Math.round(a/(6*DEG))).join(',') : 'out';
  if (key === cutKey && !force) return false; cutKey = key;
  CUTS.forEach(c => {
    let hide = false;
    if (inside){
      const front = w => Math.abs(angDiff(c.a, pc)) < w;
      if (c.kind === 'roof') hide = true;
      else if (c.kind === 'ceil') hide = L === 2 ? lanternOcc.all || lanternOcc.a.some(a => Math.abs(angDiff(c.a, a)) < 45*DEG) : front(WEDGE.ceil);
      else if (c.kind === 'wall') hide = c.f >= L && front(WEDGE.wall);
      else if (c.kind === 'fl') hide = c.f > L && (front(WEDGE.fl) || occ.some(([k, a]) => k === c.f && Math.abs(angDiff(c.a, a)) < SA*0.5 + 14*DEG));
    }
    c.g.visible = !hide;
  });
  Object.entries(POOLM).forEach(([k, m]) => { m.visible = !inside || k === 'out' || +k <= L; });
  return true;
}

const _m4 = new THREE.Matrix4();
function update(t, dt, Pl, camC, pitch){
  const changed = applyCut(Pl, camC, pitch);
  haloMat.uniforms.t.value = t;
  ORBS.list.forEach((o, i) => { _m4.makeTranslation(o.x, o.y + Math.sin(t*0.6 + o.ph)*0.25, o.z); ORBS.im.setMatrixAt(i, _m4); }); ORBS.im.instanceMatrix.needsUpdate = true;
  HD.shafts.forEach(m => { m.material.uniforms.t.value = t; });
  if (HD.dust && HD.dust.visible){ const p = HD.dust.geometry.attributes.position; for (let i = 0; i < p.count; i++){ let y = p.getY(i) - dt*0.12*(0.5 + rnd('ds' + i)); if (y < 0.1) y += SKY_Y; p.setY(i, y); } p.needsUpdate = true; }
  if (CARD.open && !nearDoor(Pl)) CARD.hide();
  return changed;
}
const shelfShown = s => s.cut.visible;
const labelK = (s, Pl) => insideAt(Pl) && !Pl.st && s.level === (Pl.level | 0) && shelfShown(s) ? 1 : 0;
const _o = new THREE.Vector3();
function pickBook(ray){
  const hits = ray.intersectObjects(BOOKM, false).filter(h => { let o = h.object; while (o){ if (!o.visible) return false; o = o.parent; } return true; });
  const h = hits[0]; return h && h.instanceId != null ? h.object.userData.ids[h.instanceId] : null;
}

const LINES = [
  '[region:lib] 天窓から、星の光がまっすぐ落ちてくるの', '[region:lib] 吹き抜けを見上げると、ちょっと背すじがのびる', '[region:lib] らせん階段、のぼるたびに少しだけ景色が変わるんだ',
  '[region:lib] 本のページみたいな壁、外から見ると好きなんだ', '[region:lib] 三つの階、ぜんぶ私たちの記憶でできてる', '[region:lib] この書庫、どの階もちゃんと灯りがついてるでしょ',
  '[region:lib] 群青の天井、夜空を閉じこめたみたい', '[region:lib floor:3] ここから島がぜんぶ見えるね', '[region:lib floor:3] 展望デッキの風、気持ちいい',
  '[region:lib floor:3] あの扉は…まだ、ないしょ', '[region:lib floor:2] 吹き抜けの一人席、集中したい時の場所'];
const LINE_RE = /天窓|吹き抜け|らせん階段|ページみたいな壁|三つの階|この書庫|群青の天井|展望デッキ|あの扉|島がぜんぶ/;
const LINE_RULES = [[/らせん階段|吹き抜け|天窓|展望デッキ|秘密の書庫|群青の天井/, 'region:lib']];

function LIB_toStair(Pl, deg){ Pl.st = {A:deg*DEG, s:1, key:null, lk:landingAt(deg*DEG)}; placeOnStair(Pl); }

return {ISL, FH, RB, RW, Z1, SW, SD, SH, YARD:[{x:SIGN.x, z:SIGN.z, w:2.7, d:0.32}], DOOR_W:2*RW*Math.sin(DOOR_A), WF_X:-11.6,
  shelves:SHELVES, bookShelf, SEATS, LINES, LINE_RE, LINE_RULES,
  blocked, move, slide, release, stairHint, exitLanding, toStair(Pl, deg){ Pl.st = {A:deg*DEG, s:1, key:null, lk:landingAt(deg*DEG)}; placeOnStair(Pl); }, groundY, insideAt, stairY:Pl => stairH(Pl.st.A),
  cutState(Pl, camC, pitch){ applyCut(Pl, camC, pitch, true); const v = (kind, f, deg) => CUTS.find(c => c.kind === kind && c.f === f && Math.abs(angDiff(c.a, deg*DEG)) < SA/2 + 1e-6).g.visible;
    return {wall0front:v('wall', 0, 15), wall0back:v('wall', 0, 195), fl1front:v('fl', 1, 15), fl1back:v('fl', 1, 195), all:CUTS.every(c => c.g.visible)}; }, nearShelf, get nearD(){ return nearD; }, nearDoor, knock(){ CARD.show(); }, card:CARD,
  update, applyCut(Pl, camC, pitch){ return applyCut(Pl, camC, pitch, true); }, labelK, pickBook,
  stairFoot(){ const [x, z] = P(ST.rm, A0 - 0.15); return {x, z}; }, P, edgeAt:z => Math.sqrt(Math.max(0, ISL*ISL - z*z)),
  _dbg:{CUTS, POOLM, HD, ST, BA, DOOR, SEC, stairH, landingAt}};
}
window.Library3F = {build};
})();
