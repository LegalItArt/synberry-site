/* v5에서 옮긴 히어로 배경: 2D 장면(SCENE) + 장면 엔진 + 배경 움직임 버튼. 3D(/scene3d.js)는 따로 지연 로드 */
/* SynBerry — 새벽 고설재배 딸기하우스. 아치 골조(허브 터널과 같은 문법)가 해 뜨는 쪽 끝까지 이어지고,
   허리 높이 베드에 잎이 넘치고 딸기가 통로 쪽으로 매달린다. 끝 유리벽에서 빛줄기가 흘러든다. 단위 m. */
var SCENE = (function () {
  var HW = 4.8, WALL = 2.5, TOP = 5.4, BAY = 3, ZEND = 60, CAMY = 1.5, SPEED = 0.9;
  var BEDS = [-3.3, -1.25, 1.25, 3.3], BEDY = 1.05, FOGN = 6;
  var arcX = []; for (var i = 0; i <= 18; i++) arcX.push(-HW + (2 * HW) * i / 18);
  function arcY(x) { var u = x / HW; return WALL + (TOP - WALL) * Math.sqrt(Math.max(0, 1 - u * u)); }
  var W, Hh, F, CX, CY, motes = [], leaf = [], berry = [];
  var HAZE = [244, 184, 150];
  function P(x, y, z) { return [CX + F * x / z, CY - F * (y - CAMY) / z]; }
  function fogA(z) { return 1 - Math.exp(-z / 40); }
  function tint(src, a) { var c = document.createElement('canvas'); c.width = src.width; c.height = src.height; var x = c.getContext('2d'); x.drawImage(src, 0, 0); if (a > 0) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(' + HAZE + ',' + a + ')'; x.fillRect(0, 0, c.width, c.height); } return c; }
  /* 잎 덩이: 세 장 겹잎 40여 장, 뒤에서 오는 새벽빛으로 가장자리가 밝다 */
  function makeLeaf(seed, H) {
    var c = document.createElement('canvas'); c.width = 240; c.height = 150; var x = c.getContext('2d');
    for (var i = 0; i < 46; i++) {
      var r1 = H.hash(seed * 31 + i * 2.1), r2 = H.hash(seed * 17 + i * 5.7), r3 = H.hash(seed * 7 + i * 9.3);
      var cx = 20 + r1 * 200, cy = 40 + r2 * 90 - Math.sin(r1 * Math.PI) * 30, sz = 13 + r3 * 15, rot = (r1 - .5) * 2.4;
      var depth = cy / 150, g = x.createLinearGradient(cx, cy - sz, cx, cy + sz);
      var top = [62 + r3 * 34, 128 + r3 * 30, 58], bot = [10, 40 + r2 * 16, 22];
      g.addColorStop(0, 'rgb(' + (top[0] * (1.05 - depth * .55) | 0) + ',' + (top[1] * (1.02 - depth * .5) | 0) + ',' + (top[2] * (1 - depth * .4) | 0) + ')');
      g.addColorStop(1, 'rgb(' + bot + ')');
      for (var l = -1; l <= 1; l++) {
        var a = rot + l * .75, lx = cx + Math.cos(a - 1.57) * sz * .55, ly = cy + Math.sin(a - 1.57) * sz * .55;
        x.save(); x.translate(lx, ly); x.rotate(a); x.fillStyle = g;
        x.beginPath(); x.moveTo(0, sz * .55); x.bezierCurveTo(sz * .5, sz * .3, sz * .45, -sz * .5, 0, -sz * .6); x.bezierCurveTo(-sz * .45, -sz * .5, -sz * .5, sz * .3, 0, sz * .55); x.fill();
        x.strokeStyle = 'rgba(10,40,20,.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, sz * .5); x.lineTo(0, -sz * .5); x.stroke();
        x.strokeStyle = 'rgba(255,230,150,' + (.35 + r2 * .3) + ')'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-sz * .38, -sz * .3); x.quadraticCurveTo(0, -sz * .72, sz * .38, -sz * .3); x.stroke();
        x.restore();
      }
    }
    return c;
  }
  /* 딸기: 원뿔형, 씨, 꽃받침, 하이라이트 */
  function makeBerry(ripe) {
    var c = document.createElement('canvas'); c.width = 48; c.height = 64; var x = c.getContext('2d');
    var g = x.createLinearGradient(8, 10, 40, 60);
    if (ripe) { g.addColorStop(0, '#FF3B4E'); g.addColorStop(.55, '#D01530'); g.addColorStop(1, '#7E0A1C'); } else { g.addColorStop(0, '#F4F1D2'); g.addColorStop(1, '#B9C98E'); }
    x.fillStyle = g; x.beginPath(); x.moveTo(24, 62); x.bezierCurveTo(6, 46, 2, 22, 10, 14); x.bezierCurveTo(16, 8, 32, 8, 38, 14); x.bezierCurveTo(46, 22, 42, 46, 24, 62); x.fill();
    x.fillStyle = ripe ? 'rgba(255,220,120,.85)' : 'rgba(150,170,90,.7)';
    for (var i = 0; i < 22; i++) { var u = (i % 5) / 4, v = Math.floor(i / 5) / 4; var px = 12 + u * 24 * (1 - v * .45) + v * 5.5, py = 20 + v * 34; x.beginPath(); x.ellipse(px, py, 1, 1.5, 0, 0, 7); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(16, 22, 4, 7, -.4, 0, 7); x.fill();
    x.fillStyle = '#2E7A3A'; for (var k = 0; k < 6; k++) { var a = k / 6 * 6.28; x.beginPath(); x.ellipse(24 + Math.cos(a) * 7, 12 + Math.sin(a) * 3, 7, 2.6, a, 0, 7); x.fill(); }
    x.strokeStyle = '#3F8C44'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(24, 12); x.lineTo(24, 0); x.stroke();
    return c;
  }
  return {
    still: 6.5, start: 3, bloom: 0.8,
    init: function (S, H) {
      W = S.W; Hh = S.H; F = (S.mobile ? 1.15 : 0.82) * W; CX = W * (S.mobile ? 0.5 : 0.72); CY = Hh * (S.mobile ? 0.44 : 0.27);
      motes = []; for (var i = 0; i < (S.mobile ? 36 : 70); i++) motes.push([H.hash(i * 3.1), H.hash(i * 7.7), H.hash(i * 1.9), H.hash(i * 5.3)]);
      if (!leaf.length) {
        for (var v = 0; v < 4; v++) { var base = makeLeaf(v + 1, H), row = []; for (var f = 0; f < FOGN; f++) row.push(tint(base, Math.pow(f / (FOGN - 1), 1.1) * .9)); leaf.push(row); }
        [true, true, false].forEach(function (r) { var bse = makeBerry(r), row = []; for (var f = 0; f < FOGN; f++) row.push(tint(bse, Math.pow(f / (FOGN - 1), 1.1) * .85)); berry.push(row); });
      }
    },
    draw: function (c, S, t, H) {
      var camZ = t * SPEED, sun = P(0.1, 1.3, ZEND);
      var sky = c.createLinearGradient(0, 0, 0, sun[1] + Hh * 0.06);
      sky.addColorStop(0, '#0B152B'); sky.addColorStop(0.4, '#332F58'); sky.addColorStop(0.75, '#C9806F'); sky.addColorStop(1, '#FFD49A');
      c.fillStyle = sky; c.fillRect(0, 0, W, Hh);
      for (var st = 0; st < 40; st++) { var sx = H.hash(st * 4.1) * W, sy = H.hash(st * 8.3) * Hh * .32, tw = .25 + .25 * Math.sin(t * 1.3 + st); c.fillStyle = 'rgba(255,240,230,' + (tw * (1 - sy / (Hh * .32))) + ')'; c.fillRect(sx, sy, 1.4, 1.4); }
      for (var cl = 0; cl < 5; cl++) { var cy0 = sun[1] - Hh * (.08 + cl * .07), cw = W * (.5 + H.hash(cl * 3) * .5), cxp = ((H.hash(cl * 7) * W * 1.4 + t * (4 + cl * 2)) % (W * 1.6)) - W * .3;
        var cg = c.createLinearGradient(0, cy0 - 14, 0, cy0 + 14); cg.addColorStop(0, 'rgba(255,170,150,0)'); cg.addColorStop(.5, 'rgba(255,' + (150 + cl * 12) + ',140,' + (.16 - cl * .02) + ')'); cg.addColorStop(1, 'rgba(255,170,150,0)');
        c.fillStyle = cg; c.beginPath(); c.ellipse(cxp, cy0, cw / 2, 9 + cl * 3, 0, 0, 7); c.fill(); }
      H.glow(c, sun[0], sun[1], Math.max(W, Hh) * 0.7, [255, 160, 110], 0.5);
      H.glow(c, sun[0], sun[1], Math.max(W, Hh) * 0.2, [255, 226, 170], 0.9);
      H.glow(c, sun[0], sun[1], F / ZEND * 2, [255, 250, 230], 1);
      /* 지붕 필름: 칸마다 은은한 반사 */
      var fz = P(0, 0, ZEND);
      var soil = c.createLinearGradient(0, fz[1], 0, Hh);
      soil.addColorStop(0, 'rgb(205,160,132)'); soil.addColorStop(0.12, '#4A3A30'); soil.addColorStop(1, '#120E0C');
      H.poly(c, [P(-HW, 0, ZEND), P(HW, 0, ZEND), P(HW, 0, 0.6), P(-HW, 0, 0.6)], soil);
      /* 흰 바닥 시트(반사) — 베드 사이 */
      [-2.28, 2.28].forEach(function (x) { var g = c.createLinearGradient(0, fz[1], 0, Hh); g.addColorStop(0, 'rgba(255,214,176,.8)'); g.addColorStop(.3, 'rgba(150,130,120,.35)'); g.addColorStop(1, 'rgba(60,54,52,.25)'); H.poly(c, [P(x - .45, .003, ZEND), P(x + .45, .003, ZEND), P(x + .45, .003, 0.6), P(x - .45, .003, 0.6)], g); });
      var walk = c.createLinearGradient(0, fz[1], 0, Hh);
      walk.addColorStop(0, 'rgba(255,226,186,.98)'); walk.addColorStop(0.2, 'rgba(176,150,130,.8)'); walk.addColorStop(1, 'rgba(66,58,54,.95)');
      H.poly(c, [P(-0.5, 0.004, ZEND), P(0.5, 0.004, ZEND), P(0.5, 0.004, 0.6), P(-0.5, 0.004, 0.6)], walk);
      var rr = c.createLinearGradient(0, fz[1], 0, Hh); rr.addColorStop(0, 'rgba(255,232,196,.6)'); rr.addColorStop(1, 'rgba(255,232,196,0)');
      H.poly(c, [P(-0.1, 0.005, ZEND), P(0.1, 0.005, ZEND), P(0.7, 0.005, 1.6), P(-0.7, 0.005, 1.6)], rr);
      c.strokeStyle = 'rgba(255,236,205,.3)'; c.lineWidth = 1;
      for (var gx = -HW; gx <= HW + 0.01; gx += HW / 4) { var a0 = P(gx, 0, ZEND), b0 = P(gx, arcY(gx), ZEND); c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(b0[0], b0[1]); c.stroke(); }
      var k0 = Math.floor(camZ / BAY), kMax = Math.floor((camZ + ZEND) / BAY);
      for (var k = kMax; k >= k0; k--) {
        var zr = k * BAY - camZ; if (zr > ZEND) continue;
        var zn = Math.max(1.4, zr), zf = Math.min(ZEND, zr + BAY); if (zf <= zn) continue;
        var fa = fogA((zn + zf) / 2);
        for (var b = 0; b < BEDS.length; b++) {
          var x0 = BEDS[b], inner = Math.abs(x0) < 2;
          H.poly(c, [P(x0 - .2, BEDY, zn), P(x0 + .2, BEDY, zn), P(x0 + .2, BEDY, zf), P(x0 - .2, BEDY, zf)], H.rgb(H.mix([188, 194, 188], HAZE, fa * .85)));
          var sideX = x0 > 0 ? x0 - .2 : x0 + .2;
          H.poly(c, [P(sideX, BEDY - .18, zn), P(sideX, BEDY, zn), P(sideX, BEDY, zf), P(sideX, BEDY - .18, zf)], H.rgb(H.mix([118, 126, 124], HAZE, fa * .85)));
          for (var lz = zr; lz < zr + BAY; lz += 1.5) { if (lz < 1.4 || lz > ZEND) continue; var p1 = P(sideX, BEDY - .18, lz), p2 = P(sideX, 0, lz); c.strokeStyle = H.rgb(H.mix([70, 72, 70], HAZE, fogA(lz) * .8)); c.lineWidth = Math.max(.6, F * .028 / lz); c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.stroke(); }
          var step = zn < 8 ? .38 : zn < 22 ? .75 : 1.5;
          for (var z = zf; z > zn; z -= step) {
            var wz = z + camZ, hsh = H.hash(Math.round(wz * 8) * 1.37 + b * 91), sc = F / z; if (sc < .8) continue;
            var fi = Math.min(FOGN - 1, Math.round(fogA(z) * .95 * (FOGN - 1)));
            /* 통로 쪽으로 늘어진 딸기 (잎 뒤에 먼저) */
            var aisle = x0 > 0 ? -1 : 1;
            if (hsh > .25) {
              var nb = 1 + Math.floor(H.hash(wz * 3.1 + b) * 3.8);
              for (var m = 0; m < nb; m++) {
                var hm = H.hash(Math.round(wz * 8) + m * 5.1 + b * 7), dy = .14 + hm * .3, dx = aisle * (.2 + m * .06 + hm * .05);
                var bp = P(x0 + dx, BEDY - dy, z), bw = Math.max(1.2, sc * .058), bh = bw * 1.33, st = P(x0 + dx * .7, BEDY - .02, z);
                c.strokeStyle = H.rgb(H.mix([70, 130, 60], HAZE, fogA(z) * .85)); c.lineWidth = Math.max(.4, sc * .006); c.beginPath(); c.moveTo(st[0], st[1]); c.quadraticCurveTo(st[0] + aisle * bw, (st[1] + bp[1]) / 2, bp[0], bp[1] - bh * .45); c.stroke();
                c.drawImage(berry[hm > .88 ? 2 : (m & 1)][fi], bp[0] - bw / 2, bp[1] - bh * .5, bw, bh);
              }
            }
            /* 잎 덩이 양쪽 */
            for (var side = -1; side <= 1; side += 2) {
              var lw = sc * (.62 + hsh * .18), lh = lw * .62, lp = P(x0 + side * .1, BEDY + .02, z);
              var img = leaf[Math.floor(H.hash(Math.round(wz * 8) * 2.3 + side + b) * 4)][fi];
              c.save(); c.translate(lp[0], lp[1]); if (side < 0) c.scale(-1, 1);
              c.drawImage(img, -lw * .15, -lh * .8, lw, lh); c.restore();
            }
          }
        }
        if (zr > 0.6) {
          var lw2 = Math.max(.7, F * .05 / zr), lc = H.mix([196, 204, 216], [255, 224, 188], H.clamp(zr / ZEND, 0, 1));
          c.strokeStyle = H.rgb(H.mix(lc, HAZE, fogA(zr) * .7), .9); c.lineWidth = lw2;
          c.beginPath(); var s0 = P(-HW, 0, zr); c.moveTo(s0[0], s0[1]);
          for (var ai = 0; ai < arcX.length; ai++) { var ap = P(arcX[ai], arcY(arcX[ai]), zr); c.lineTo(ap[0], ap[1]); }
          var s1 = P(HW, 0, zr); c.lineTo(s1[0], s1[1]); c.stroke();
          c.lineWidth = lw2 * .5; c.beginPath(); var q0 = P(-HW * .62, arcY(HW * .62), zr), q1 = P(HW * .62, arcY(HW * .62), zr); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke();
          if (k % 3 === 0) for (var sd = -1; sd <= 1; sd += 2) { var sp = P(sd * 2.28, 1.7, zr), pulse = .55 + .45 * Math.sin(t * 2 + k); H.glow(c, sp[0], sp[1], Math.max(3, F * .14 / zr), [90, 225, 255], .75 * pulse * (1 - fogA(zr) * .6)); }
        }
      }
      c.lineWidth = 1;
      [-HW * .62, -HW * .3, 0, HW * .3, HW * .62].forEach(function (x) { var a = P(x, arcY(x), 0.9), b2 = P(x, arcY(x), ZEND); var g = c.createLinearGradient(a[0], a[1], b2[0], b2[1]); g.addColorStop(0, 'rgba(210,220,235,.5)'); g.addColorStop(1, 'rgba(255,220,180,.12)'); c.strokeStyle = g; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); });
      c.save(); c.globalCompositeOperation = 'lighter';
      for (var rI = 0; rI < 16; rI++) {
        var ang = -Math.PI * .97 + rI * (Math.PI * .94 / 15) + Math.sin(t * .13 + rI) * .02, wdt = .02 + H.hash(rI * 9) * .045;
        var L = Math.max(W, Hh) * 1.3, al = .045 + .035 * Math.sin(t * .35 + rI * 1.7);
        var g2 = c.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], L); g2.addColorStop(0, 'rgba(255,225,170,' + al + ')'); g2.addColorStop(1, 'rgba(255,225,170,0)');
        c.fillStyle = g2; c.beginPath(); c.moveTo(sun[0], sun[1]);
        c.lineTo(sun[0] + Math.cos(ang - wdt) * L, sun[1] + Math.sin(ang - wdt) * L); c.lineTo(sun[0] + Math.cos(ang + wdt) * L, sun[1] + Math.sin(ang + wdt) * L); c.closePath(); c.fill();
      }
      for (var mI = 0; mI < motes.length; mI++) {
        var m0 = motes[mI], zz = 1.5 + ((m0[0] * 16 - t * .35) % 16 + 16) % 16, xx = (m0[1] - .5) * 5 + Math.sin(t * .3 + mI) * .2, yy = .4 + ((m0[2] * 3.2 + t * .07) % 3.2);
        var mp = P(xx, yy, zz), lit = .3 + .7 * Math.exp(-Math.abs(xx) * .7);
        H.glow(c, mp[0], mp[1], Math.max(1.5, F * .012 / zz) * 2.2, [255, 236, 205], .55 * lit * H.clamp((16 - zz) / 3, 0, 1));
      }
      c.restore();
    }
  };
})();

/* SynItArt 장면 엔진 v1 — 히어로 배경 캔버스. 장식 전용(aria-hidden), 글자는 HTML.
   · 화면 밖·탭 숨김이면 정지 · '배경 움직임 끄기' 연동 · 움직임 줄이기 설정이면 정지 프레임 1장 */
(function () {
  var hero = document.getElementById('top'), cv = document.getElementById('scene');
  if (!hero || !cv || !cv.getContext || typeof SCENE === 'undefined') return;
  var ctx = cv.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = { W: 0, H: 0, DPR: 1, mobile: false, t: 0 };
  var H = window.SCN = {
    hash: function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
    mix: function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; },
    rgb: function (c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    poly: function (c, pts, fill) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); },
    glow: function (c, x, y, r, col, a) { if (r <= 0.3) return; var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, H.rgb(col, a)); g.addColorStop(1, H.rgb(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  };
  var bloom, bctx;
  function resize() {
    S.mobile = matchMedia('(max-width: 959px)').matches;
    S.DPR = Math.min(window.devicePixelRatio || 1, S.mobile ? 1.25 : 1.5);
    S.W = cv.clientWidth || hero.clientWidth; S.H = cv.clientHeight || hero.clientHeight;
    cv.width = Math.round(S.W * S.DPR); cv.height = Math.round(S.H * S.DPR);
    ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);
    bloom = document.createElement('canvas'); bloom.width = Math.max(48, Math.round(S.W / 6)); bloom.height = Math.max(48, Math.round(S.H / 6)); bctx = bloom.getContext('2d');
    if (SCENE.init) SCENE.init(S, H);
  }
  function post(strength) { /* 밝은 곳만 번지게(블룸) + 가장자리 어둡게 */
    if (!('filter' in bctx) || !strength) return;
    bctx.globalCompositeOperation = 'source-over'; bctx.drawImage(cv, 0, 0, bloom.width, bloom.height);
    bctx.globalCompositeOperation = 'multiply'; bctx.drawImage(bloom, 0, 0); bctx.drawImage(bloom, 0, 0); bctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = strength; ctx.filter = 'blur(' + Math.round(S.W / 120) + 'px)'; ctx.drawImage(bloom, 0, 0, S.W, S.H); ctx.restore(); ctx.filter = 'none';
  }
  function draw(t) { S.t = t; ctx.save(); SCENE.draw(ctx, S, t, H); ctx.restore(); post(SCENE.bloom == null ? 0.7 : SCENE.bloom);
    var vx = S.W * (S.mobile ? .5 : .68), vy = S.H * (S.mobile ? .4 : .35), v = ctx.createRadialGradient(vx, vy, Math.min(S.W, S.H) * .3, vx, vy, Math.max(S.W, S.H) * .9);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, S.W, S.H); }
  var want = !reduce, visible = true, docVis = true, raf = 0, base = performance.now(), acc = SCENE.start || 0, last = 0;
  function live() { return want && visible && docVis; }
  function frame(now) { raf = 0; if (!live()) return; if (now - last >= 32) { acc += Math.min(0.06, (now - last) / 1000); last = now; draw(acc); } raf = requestAnimationFrame(frame); }
  function kick() { if (live() && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  window.__scene = {
    setRunning: function (on) { want = !!on; if (!want) draw(acc); kick(); },
    draw: function (t) { acc = t; draw(t); }
  };
  addEventListener('resize', function () { resize(); draw(acc); });
  document.addEventListener('visibilitychange', function () { docVis = !document.hidden; kick(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }).observe(hero);
  resize();
  if (reduce) { draw(SCENE.still || 4); } else { draw(acc); kick(); }
})();


(function(){
  var hero=document.getElementById('top'),b=document.getElementById('motionBtn'),K='sia-motion-off';
  function set(off){if(window.__scene)__scene.setRunning(!off);b.setAttribute('aria-pressed',off?'true':'false');b.textContent=off?'배경 움직임 켜기':'배경 움직임 끄기';}
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,v=null;try{v=localStorage.getItem(K);}catch(e){}
  var off=v==='1'||(rm&&v!=='0');
  set(off);
  b.addEventListener('click',function(){off=!off;set(off);try{localStorage.setItem(K,off?'1':'0');}catch(e){}});
})();

