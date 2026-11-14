/* eslint-disable */ // TỆP SINH TỰ ĐỘNG từ src/lib/but-bang-loi.ts (JS_LOI_BUT) bằng scripts/video-bai-giang/xuat-loi-but.ts — KHÔNG sửa tay.
var LoiBut = (function () {
  var CHIA = 1e5, PI = Math.PI, MAU0 = 'rgb(244,239,228)', YMAX = 160;


  var RUNG_A = 1, RUNG_B = 2.2, RUNG_ZIC = 0.25, RUNG_DEU = 0.04, RUNG_KEP = 0.55;


  var DUNG = 0.06, CHIA_MAX = 14;

  var THON_DAU = 1.6, THON_CUOI = 2.2, NHO_DAU = 0.72, NHO_CUOI = 0.55, NGAN_A = 1.5, NGAN_B = 5, R_NHO = 0.3, SAT = 0.3;
  function kep(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tron(v, k) { return Math.round(v * k) / k; }
  function xa(ax, ay, bx, by) { ax -= bx; ay -= by; return Math.sqrt(ax * ax + ay * ay); }
  function muot(a, b, v) { v = kep((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); }
  function khung(W, H) { var k = Math.min(W, H * 16 / 9) / 1920 || 1; return { W: W, H: H, k: k, rw: W / k, rh: H / k }; }
  function diem(x, y, ap, t, W, H) { return [tron(kep(x / W, 0, 1), CHIA), tron(kep(y / H, 0, YMAX), CHIA), tron(kep(ap, 0, 1), 100), Math.max(0, Math.round(t))]; }

  function apLucGia(truoc, quang, dt) { var dich = 0.56 - 0.48 * kep(quang / Math.max(1, dt) / 2.4, 0, 1); return truoc + (dich - truoc) * kep(dt / 70, 0, 1); }

  function heSo(ap) { return 0.7 + 0.65 * Math.pow(kep(ap, 0, 1), 0.8); }



  function moXuLy(net, kh) { return { kh: kh, n: 0, X: [], Y: [], R: [], L: [], rx: [], ry: [], rp: [], cx: [], cy: [], cr: [], ns: 0, px: 0, py: 0, ban: (net.co || 2.3) / 2 }; }

  function nan(RX, RY, i, m, ra) {
    var ax = RX[i - 1], ay = RY[i - 1], bx = RX[i], by = RY[i], cx = RX[i + 1], cy = RY[i + 1], sx = ax - 2 * bx + cx, sy = ay - 2 * by + cy, zic = false, w, q;
    q = xa(ax, ay, bx, by) + xa(bx, by, cx, cy);

    w = xa(ax, ay, cx, cy) < 0.8 * q ? 0 : 1 - muot(RUNG_A, RUNG_B, q / 2);
    if (w > 0) {
      if (i > 1 && (RX[i - 2] - 2 * ax + bx) * sx + (RY[i - 2] - 2 * ay + by) * sy < 0) zic = true;
      if (!zic && i < m - 2 && (bx - 2 * cx + RX[i + 2]) * sx + (by - 2 * cy + RY[i + 2]) * sy < 0) zic = true;
      w *= zic ? RUNG_ZIC : RUNG_DEU;
      sx *= w; sy *= w; q = Math.sqrt(sx * sx + sy * sy);
      if (q > RUNG_KEP) { sx *= RUNG_KEP / q; sy *= RUNG_KEP / q; }
      bx += sx; by += sy;
    }
    ra[0] = bx; ra[1] = by;
  }

  function lucTron(RP, i, m) { return m === 1 ? RP[0] : !i ? (2 * RP[0] + RP[1]) / 3 : i === m - 1 ? (RP[i - 1] + 2 * RP[i]) / 3 : (RP[i - 1] + 2 * RP[i] + RP[i + 1]) / 4; }

  function doan(X, Y, R, L, x0, y0, x1, y1, x2, y2, x3, y3, r1, r2) {
    var d1 = Math.sqrt(xa(x0, y0, x1, y1)), d2 = Math.sqrt(xa(x1, y1, x2, y2)), d3 = Math.sqrt(xa(x2, y2, x3, y3)), n, k, t, t2, t3, a, b, c, d, x, y, m, q, ux, uy, vx, vy;
    if (d2 < 1e-4) return;
    if (d1 < 1e-4) d1 = d2; if (d3 < 1e-4) d3 = d2;
    ux = ((x1 - x0) / d1 - (x2 - x0) / (d1 + d2) + (x2 - x1) / d2) * d2; uy = ((y1 - y0) / d1 - (y2 - y0) / (d1 + d2) + (y2 - y1) / d2) * d2;
    vx = ((x2 - x1) / d2 - (x3 - x1) / (d2 + d3) + (x3 - x2) / d3) * d2; vy = ((y2 - y1) / d2 - (y3 - y1) / (d2 + d3) + (y3 - y2) / d3) * d2;

    n = kep(Math.ceil(Math.sqrt(0.148 * (xa(ux, uy, x2 - x1, y2 - y1) + xa(vx, vy, x2 - x1, y2 - y1)) / DUNG)), 1, CHIA_MAX);
    for (k = 1; k <= n; k++) {
      t = k / n; t2 = t * t; t3 = t2 * t;
      a = 2 * t3 - 3 * t2 + 1; b = t3 - 2 * t2 + t; c = 3 * t2 - 2 * t3; d = t3 - t2;
      x = k === n ? x2 : a * x1 + b * ux + c * x2 + d * vx; y = k === n ? y2 : a * y1 + b * uy + c * y2 + d * vy;
      m = X.length; q = xa(x, y, X[m - 1], Y[m - 1]);
      if (q < SAT && k < n) continue;
      X.push(x); Y.push(y); R.push(r1 + (r2 - r1) * t); L.push(L[m - 1] + q);
    }
  }

  function doanMoc(X, Y, R, L, CX, CY, CR, j, m) {
    var a = j > 0, b = j + 2 < m;
    doan(X, Y, R, L, a ? CX[j - 1] : 2 * CX[j] - CX[j + 1], a ? CY[j - 1] : 2 * CY[j] - CY[j + 1], CX[j], CY[j], CX[j + 1], CY[j + 1], b ? CX[j + 2] : 2 * CX[j + 1] - CX[j], b ? CY[j + 2] : 2 * CY[j + 1] - CY[j], CR[j], CR[j + 1]);
  }
  function xuLyThem(st, ds, den) {
    var kh = st.kh, i, d, x, y, m, k, ra = [0, 0];
    for (i = st.n; i < den; i++) {
      d = ds[i]; x = d[0] * kh.rw; y = d[1] * kh.rh; st.px = x; st.py = y;
      m = st.rx.length;

      if (m && xa(x, y, st.rx[m - 1], st.ry[m - 1]) < SAT) { if (d[2] > st.rp[m - 1]) st.rp[m - 1] = d[2]; continue; }
      st.rx.push(x); st.ry.push(y); st.rp.push(d[2]); m++;
      for (k = st.cx.length; k < m - 2; k++) {
        if (!k) { ra[0] = st.rx[0]; ra[1] = st.ry[0]; } else nan(st.rx, st.ry, k, m, ra);
        st.cx.push(ra[0]); st.cy.push(ra[1]); st.cr.push(st.ban * heSo(lucTron(st.rp, k, m)));
      }
      if (st.cx.length && !st.X.length) { st.X.push(st.cx[0]); st.Y.push(st.cy[0]); st.R.push(st.cr[0]); st.L.push(0); }
      for (; st.ns < st.cx.length - 2; st.ns++) doanMoc(st.X, st.Y, st.R, st.L, st.cx, st.cy, st.cr, st.ns, st.cx.length);
    }
    st.n = den;
  }


  var DX = [], DY = [], DP = [], DCX = [], DCY = [], DCR = [], DRA = [0, 0];
  function noiDuoi(st, them, X, Y, R, L) {

    var s0 = Math.max(0, st.ns - 1), m0 = st.rx.length, nc = st.cx.length - s0, m = 0, i, q;
    for (i = s0; i < m0; i++) { DX[m] = st.rx[i]; DY[m] = st.ry[i]; DP[m] = st.rp[i]; m++; }
    if (them) for (i = 0; i < them.length; i++) if (!m || xa(them[i][0], them[i][1], DX[m - 1], DY[m - 1]) >= SAT) { DX[m] = them[i][0]; DY[m] = them[i][1]; DP[m] = m ? DP[m - 1] : 0.3; m++; }
    if (!m) return;
    for (i = 0; i < m; i++) {
      if (i < nc) { DCX[i] = st.cx[s0 + i]; DCY[i] = st.cy[s0 + i]; DCR[i] = st.cr[s0 + i]; continue; }

      if (!(i + s0) || i === m - 1) { DCX[i] = DX[i]; DCY[i] = DY[i]; } else { nan(DX, DY, i, m, DRA); DCX[i] = DRA[0]; DCY[i] = DRA[1]; }
      DCR[i] = st.ban * heSo(lucTron(DP, i, m));
    }
    if (!X.length) { X.push(DCX[0]); Y.push(DCY[0]); R.push(DCR[0]); L.push(0); }

    for (i = st.ns - s0; i < m - 1; i++) doanMoc(X, Y, R, L, DCX, DCY, DCR, i, m);
  }
  function duoiTam(st, them) {
    var n = st.X.length, X = n ? [st.X[n - 1]] : [], Y = n ? [st.Y[n - 1]] : [], R = n ? [st.R[n - 1]] : [], L = n ? [st.L[n - 1]] : [];
    noiDuoi(st, them, X, Y, R, L);

    if (n) { X.shift(); Y.shift(); R.shift(); L.shift(); }
    return { X: X, Y: Y, R: R, L: L };
  }



  function mocDong(st, dong, it) {
    var m = st.X.length, den = m - 1, giu = st.ban * 2 * (NGAN_B + THON_CUOI) + 3;
    it = it || 64;
    if (den - dong < it) return -1;
    while (den > dong && st.L[m - 1] - st.L[den] < giu) den--;
    return den - dong >= it ? den : -1;
  }


  function vien(st, tu, den, duoi, xong) {
    var o = tu > 0 ? tu - 1 : 0, het = den < 0, c = het ? st.X.length : Math.min(st.X.length, den + 2);
    var X = st.X.slice(o, c), Y = st.Y.slice(o, c), R = st.R.slice(o, c), L = st.L.slice(o, c), n, i, q, s, f, g, tong, co, tD, tC;
    if (het) noiDuoi(st, duoi, X, Y, R, L);
    n = X.length; if (!n) return [];
    tong = L[n - 1]; co = st.ban * 2;

    g = het ? muot(NGAN_A * co, NGAN_B * co, tong) : 1;
    tD = THON_DAU * co; tC = xong ? Math.min(THON_CUOI * co, tong * 0.4) : 0;
    for (i = 0; i < n; i++) {
      f = 1; s = L[i];
      if (s < tD) { q = 1 - s / tD; f *= 1 - (1 - NHO_DAU) * g * q * q; }
      s = tong - s;
      if (s < tC) { q = 1 - s / tC; f *= 1 - (1 - NHO_CUOI) * g * q * q; }
      R[i] = Math.max(R_NHO, R[i] * f);
    }
    return bao(X, Y, R, tu - o, het ? n - 1 : Math.min(n - 1, den - o), tu === 0, het);
  }
  function bao(X, Y, R, a, b, muDau, muCuoi) {
    var N = X.length, T = [], P = [], i, k, m, ax, ay, bx, by, q, r, nx, ny, x, y, c, s, cham;
    if (b <= a) { r = R[a] * 1.3; for (k = 0; k < 14; k++) T.push(X[a] + r * Math.cos(k * PI / 7), Y[a] + r * Math.sin(k * PI / 7)); return T; }
    for (i = a; i <= b; i++) {

      if (i > 0) { ax = X[i] - X[i - 1]; ay = Y[i] - Y[i - 1]; } else { ax = X[1] - X[0]; ay = Y[1] - Y[0]; }
      if (i < N - 1) { bx = X[i + 1] - X[i]; by = Y[i + 1] - Y[i]; } else { bx = ax; by = ay; }
      q = Math.sqrt(ax * ax + ay * ay) || 1; ax /= q; ay /= q;
      q = Math.sqrt(bx * bx + by * by) || 1; bx /= q; by /= q;
      r = R[i]; cham = ax * bx + ay * by;
      if (cham < -0.25 && i > a && i < b) {

        nx = -ay; ny = ax;
        for (k = 0; k <= 6; k++) {
          c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6);
          T.push(X[i] + r * (nx * c + ny * s), Y[i] + r * (ny * c - nx * s));
          P.push(X[i] + r * (ny * s - nx * c), Y[i] - r * (nx * s + ny * c));
        }
        continue;
      }
      nx = ax + bx; ny = ay + by; q = Math.sqrt(nx * nx + ny * ny) || 1; x = -ny / q * r; y = nx / q * r;

      q = Math.max(r * r * 0.2, 0.3);
      m = T.length; nx = X[i] + x - T[m - 2]; ny = Y[i] + y - T[m - 1];
      if (i === a || i === b || nx * nx + ny * ny > q) T.push(X[i] + x, Y[i] + y);
      m = P.length; nx = X[i] - x - P[m - 2]; ny = Y[i] - y - P[m - 1];
      if (i === a || i === b || nx * nx + ny * ny > q) P.push(X[i] - x, Y[i] - y);
    }
    if (muCuoi) {

      ax = X[b] - X[b - 1]; ay = Y[b] - Y[b - 1]; q = Math.sqrt(ax * ax + ay * ay) || 1; nx = -ay / q; ny = ax / q; r = R[b];
      for (k = 1; k < 6; k++) { c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6); T.push(X[b] + r * (nx * c + ny * s), Y[b] + r * (ny * c - nx * s)); }
    }
    for (i = P.length - 2; i >= 0; i -= 2) T.push(P[i], P[i + 1]);
    if (muDau) {

      ax = X[a + 1] - X[a]; ay = Y[a + 1] - Y[a]; q = Math.sqrt(ax * ax + ay * ay) || 1; nx = ay / q; ny = -ax / q; r = R[a];
      for (k = 1; k < 6; k++) { c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6); T.push(X[a] + r * (nx * c + ny * s), Y[a] + r * (ny * c - nx * s)); }
    }
    return T;
  }
  function dungNet(net, kh) { var st = moXuLy(net, kh); xuLyThem(st, net.diem, net.diem.length); return vien(st, 0, -1, null, true); }
  function duongTam(net, kh) { var st = moXuLy(net, kh), D, p = [], i; xuLyThem(st, net.diem, net.diem.length); D = duoiTam(st, null); for (i = 0; i < st.X.length; i++) p.push(st.X[i], st.Y[i]); for (i = 0; i < D.X.length; i++) p.push(D.X[i], D.Y[i]); return p; }

  function veDaGiac(g, p) {
    var n = p.length >> 1, i, a, b;
    if (n < 3) return;
    g.moveTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2);
    for (i = 1; i <= n; i++) { a = (i % n) * 2; b = ((i + 1) % n) * 2; g.quadraticCurveTo(p[a], p[a + 1], (p[a] + p[b]) / 2, (p[a + 1] + p[b + 1]) / 2); }
    g.closePath();
  }


  function hop(net) {
    var d = net.diem, h = net._h, i;
    if (!h) { h = [1e9, 1e9, -1e9, -1e9]; for (i = 0; i < d.length; i++) { h[0] = Math.min(h[0], d[i][0]); h[1] = Math.min(h[1], d[i][1]); h[2] = Math.max(h[2], d[i][0]); h[3] = Math.max(h[3], d[i][1]); } net._h = h; }
    return h;
  }




  var BU_SANG = {};
  function buSang(mau) { var v = BU_SANG[mau], m; if (v == null) { m = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(mau); v = BU_SANG[mau] = m && m[1] * 0.3 + m[2] * 0.59 + m[3] * 0.11 > 150 ? 0.55 : 0; } return v; }
  function laBang(net) { return net.id.charCodeAt(0) === 98 && net.id.charCodeAt(1) === 95; }
  function chamNet(net, x, y, r, kh) {
    var d = net.diem, h = hop(net), i, px, py, ax, ay, bx, by, vx, vy, t, rr, mx, my;
    rr = r + net.co * 0.8; mx = rr / kh.rw; my = rr / kh.rh;
    if (x < h[0] - mx || x > h[2] + mx || y < h[1] - my || y > h[3] + my) return false;
    px = x * kh.rw; py = y * kh.rh; rr *= rr;
    ax = d[0][0] * kh.rw; ay = d[0][1] * kh.rh;
    if (d.length === 1) return (px - ax) * (px - ax) + (py - ay) * (py - ay) <= rr;
    for (i = 1; i < d.length; i++) {
      bx = d[i][0] * kh.rw; by = d[i][1] * kh.rh; vx = bx - ax; vy = by - ay;
      t = kep(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1);
      vx = ax + t * vx - px; vy = ay + t * vy - py;
      if (vx * vx + vy * vy <= rr) return true;
      ax = bx; ay = by;
    }
    return false;
  }
  function timCham(ds, x, y, r, kh) { var ra = [], i; for (i = 0; i < ds.length; i++) if (ds[i].cong !== 'tay' && chamNet(ds[i], x, y, r, kh)) ra.push(ds[i].id); return ra; }


  function gon(n) { return { id: n.id, cong: n.cong, mau: n.mau, co: n.co, diem: n.diem }; }
  function sachNet(n, i) {
    var ds = [], j, d;
    if (!n || !n.diem) return null;
    for (j = 0; j < n.diem.length; j++) { d = n.diem[j]; if (d && isFinite(d[0]) && isFinite(d[1])) ds.push([tron(kep(+d[0], 0, 1), CHIA), tron(kep(+d[1], 0, YMAX), CHIA), tron(kep(isFinite(d[2]) ? +d[2] : 0.5, 0, 1), 100), Math.max(0, Math.round(+d[3] || 0))]); }
    if (!ds.length) return null;
    return { id: String(n.id || 'n' + i), cong: n.cong === 'tay' ? 'tay' : 'but', mau: /^rgba?\([0-9., %\/]+\)$/.test(n.mau) ? n.mau : MAU0, co: kep(+n.co || 2.3, 0.5, 16), diem: ds };
  }




  function nanHinh(diem, tiLe) {
    var n = diem.length, T = tiLe > 0 ? tiLe : 16 / 9, P = [], i, j, L = 0, dx, dy, D, x0, y0, x1, y1, lech = 0, t0, t1, ap = 0, minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, W, H, cheo, cx, cy, a, b, sai, goc, dinh, ra, k, m, u, v, g;
    if (n < 6) return null;
    for (i = 0; i < n; i++) { P.push([diem[i][0] * T, diem[i][1]]); ap += diem[i][2]; if (P[i][0] < minX) minX = P[i][0]; if (P[i][0] > maxX) maxX = P[i][0]; if (P[i][1] < minY) minY = P[i][1]; if (P[i][1] > maxY) maxY = P[i][1]; if (i) L += Math.sqrt((P[i][0] - P[i - 1][0]) * (P[i][0] - P[i - 1][0]) + (P[i][1] - P[i - 1][1]) * (P[i][1] - P[i - 1][1])); }
    ap = tron(ap / n, 100); t0 = diem[0][3]; t1 = diem[n - 1][3];
    x0 = P[0][0]; y0 = P[0][1]; x1 = P[n - 1][0]; y1 = P[n - 1][1]; dx = x1 - x0; dy = y1 - y0; D = Math.sqrt(dx * dx + dy * dy);
    W = maxX - minX; H = maxY - minY; cheo = Math.sqrt(W * W + H * H);
    function diemRa(ds) { var r = [], q; for (q = 0; q < ds.length; q++) r.push([tron(kep(ds[q][0] / T, 0, 1), CHIA), tron(kep(ds[q][1], 0, YMAX), CHIA), ap, Math.round(t0 + (t1 - t0) * q / Math.max(1, ds.length - 1))]); return r; }

    if (D >= 0.09 && L <= D * 1.08) {
      for (i = 1; i < n - 1; i++) { u = Math.abs((P[i][0] - x0) * dy - (P[i][1] - y0) * dx) / D; if (u > lech) lech = u; }
      if (lech <= Math.max(0.006, D * 0.045)) {
        goc = Math.abs(Math.atan2(dy, dx)) * 180 / Math.PI;
        if (goc < 6 || goc > 174) y1 = y0 = (y0 + y1) / 2; else if (Math.abs(goc - 90) < 6) x1 = x0 = (x0 + x1) / 2;
        return diemRa([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2], [x1, y1]]);
      }
      return null;
    }

    if (cheo < 0.09 || D > cheo * 0.28 || L < cheo * 1.9) return null;
    cx = (minX + maxX) / 2; cy = (minY + maxY) / 2; a = W / 2; b = H / 2;
    if (a < 0.012 || b < 0.012) return null;

    function rut(tu, den, eps, giu) { var xa = 0, ki = -1, q, ex = P[den][0] - P[tu][0], ey = P[den][1] - P[tu][1], el = Math.sqrt(ex * ex + ey * ey) || 1, w; for (q = tu + 1; q < den; q++) { w = Math.abs((P[q][0] - P[tu][0]) * ey - (P[q][1] - P[tu][1]) * ex) / el; if (w > xa) { xa = w; ki = q; } } if (ki >= 0 && xa > eps) { rut(tu, ki, eps, giu); giu.push(ki); rut(ki, den, eps, giu); } }
    m = 0; u = 0; for (i = 1; i < n; i++) { v = (P[i][0] - x0) * (P[i][0] - x0) + (P[i][1] - y0) * (P[i][1] - y0); if (v > u) { u = v; m = i; } }
    dinh = [0]; rut(0, m, cheo * 0.07, dinh); dinh.push(m); rut(m, n - 1, cheo * 0.07, dinh);

    sai = 0; for (i = 0; i < n; i++) { u = (P[i][0] - cx) / a; v = (P[i][1] - cy) / b; sai += Math.abs(Math.sqrt(u * u + v * v) - 1); } sai /= n;
    if (sai < 0.13 && dinh.length !== 3 && dinh.length !== 4) {
      if (Math.abs(a - b) < Math.max(a, b) * 0.16) a = b = (a + b) / 2;
      ra = []; g = Math.atan2(y0 - cy, x0 - cx); for (i = 0; i <= 44; i++) ra.push([cx + a * Math.cos(g + i * Math.PI / 22), cy + b * Math.sin(g + i * Math.PI / 22)]);
      return diemRa(ra);
    }
    if (dinh.length !== 3 && dinh.length !== 4) return null;
    ra = []; for (i = 0; i < dinh.length; i++) ra.push([P[dinh[i]][0], P[dinh[i]][1]]);

    if (ra.length === 4) {
      k = 0; for (i = 0; i < 4; i++) { j = (i + 1) % 4; g = Math.abs(Math.atan2(ra[j][1] - ra[i][1], ra[j][0] - ra[i][0])) * 180 / Math.PI; g = Math.min(g, 180 - g); if (g < 14 || g > 76) k++; }
      if (k === 4) { g = Math.abs(ra[1][0] - ra[0][0]) > Math.abs(ra[1][1] - ra[0][1]); u = ra[0][0] < cx; v = ra[0][1] < cy; ra = g ? [[u ? minX : maxX, v ? minY : maxY], [u ? maxX : minX, v ? minY : maxY], [u ? maxX : minX, v ? maxY : minY], [u ? minX : maxX, v ? maxY : minY]] : [[u ? minX : maxX, v ? minY : maxY], [u ? minX : maxX, v ? maxY : minY], [u ? maxX : minX, v ? maxY : minY], [u ? maxX : minX, v ? minY : maxY]]; }
    }

    m = []; for (i = 0; i < ra.length; i++) { j = (i + 1) % ra.length; m.push(ra[i], ra[i], ra[i]); for (k = 1; k < 6; k++) m.push([ra[i][0] + (ra[j][0] - ra[i][0]) * k / 6, ra[i][1] + (ra[j][1] - ra[i][1]) * k / 6]); }
    m.push(ra[0], ra[0]);
    return diemRa(m);
  }
  function taoSo(tuy) {
    tuy = tuy || {};
    var khoa = '', T = { net: [], lui: [], toi: [] }, trang = { '': T }, tai = [], dang = null, dem = 0, tiLe = 16 / 9, GIOI = tuy.gioiHan || 300;
    function id() { dem++; return tuy.taoId ? tuy.taoId(dem) : 'n' + Date.now().toString(36) + dem.toString(36) + Math.floor(Math.random() * 1296).toString(36); }
    function phat(sk) { var i; sk.trang = khoa; for (i = 0; i < tai.length; i++) { try { tai[i](sk); } catch (e) {} } }
    function vt(i) { var k; for (k = 0; k < T.net.length; k++) if (T.net[k].id === i) return k; return -1; }
    function ghi(b) { T.lui.push(b); if (T.lui.length > GIOI) T.lui.shift(); T.toi = []; }

    function go(ds) { var ids = [], i, k; for (i = 0; i < ds.length; i++) { k = vt(ds[i].net.id); if (k >= 0) { ds[i].vt = k; T.net.splice(k, 1); ids.push(ds[i].net.id); } } if (ids.length) phat({ loai: 'xoa', id: ids }); }
    function gan(ds) { var i, k; for (i = ds.length - 1; i >= 0; i--) { k = Math.min(ds[i].vt, T.net.length); T.net.splice(k, 0, ds[i].net); phat({ loai: 'net-moi', net: gon(ds[i].net), vt: k, xong: true }); } }
    function ketThuc(huy) {
      var n = dang; if (!n) return null; dang = null;
      if (huy || !n.diem.length) { phat({ loai: 'xoa', id: [n.id] }); return null; }
      var m = tuy.nan === false || n.cong !== 'but' ? null : nanHinh(n.diem, tiLe), cu;
      if (m) {

        cu = n.id; phat({ loai: 'xoa', id: [cu] });

        n.id = (cu.indexOf('b_') === 0 ? 'b_' : '') + id(); n.diem = m; n.nan = 1;
        T.net.push(n); ghi({ l: 'them', ds: [{ net: n, vt: T.net.length - 1 }] }); phat({ loai: 'net-moi', net: gon(n), vt: T.net.length - 1, xong: true });
        return n;
      }
      T.net.push(n); ghi({ l: 'them', ds: [{ net: n, vt: T.net.length - 1 }] }); phat({ loai: 'net-xong', id: n.id });
      return n;
    }
    function xoa(ids, gop) {
      var ds = [], k, b;
      for (k = T.net.length - 1; k >= 0; k--) if (ids.indexOf(T.net[k].id) >= 0) ds.push({ net: T.net[k], vt: k });
      if (!ds.length) return 0;
      go(ds); b = T.lui[T.lui.length - 1];
      if (gop && b && b.mo) { b.ds = b.ds.concat(ds); T.toi = []; } else ghi({ l: 'xoa', ds: ds, mo: !!gop });
      return ds.length;
    }
    return {
      nghe: function (f) { tai.push(f); return function () { var i = tai.indexOf(f); if (i >= 0) tai.splice(i, 1); }; },
      trang: function () { return khoa; },
      ds: function () { return T.net; },
      datTiLe: function (v) { if (v > 0) tiLe = tron(v, 1e4); },
      doiTrang: function (k) { k = String(k); if (dang) ketThuc(); if (k === khoa) return; khoa = k; T = trang[k] || (trang[k] = { net: [], lui: [], toi: [] }); phat({ loai: 'trang', net: T.net.map(gon), tiLe: tiLe }); },
      batDau: function (mo) { dang = { id: (mo.bang ? 'b_' : '') + id(), cong: mo.cong === 'tay' ? 'tay' : 'but', mau: mo.mau, co: mo.co, diem: mo.diem ? [mo.diem] : [] }; phat({ loai: 'net-moi', net: { id: dang.id, cong: dang.cong, mau: dang.mau, co: dang.co, diem: dang.diem.slice() } }); return dang; },
      themDiem: function (ds) { var i; if (!dang || !ds.length) return; for (i = 0; i < ds.length; i++) dang.diem.push(ds[i]); phat({ loai: 'them-diem', id: dang.id, diem: ds }); },
      ketThuc: ketThuc,
      tro: function (x, y, lz) { var e; if (!tai.length) return; e = { loai: 'tro', x: tron(kep(x, 0, 1), 1e4), y: tron(kep(y, 0, YMAX), 1e4) }; if (lz) e.lz = 1; phat(e); },
      cuon: function (v) { if (tai.length) phat({ loai: 'tro', x: 2, y: tron(kep(v, 0, YMAX), 1e4) }); },
      xoa: xoa,
      dongGop: function () { var b = T.lui[T.lui.length - 1]; if (b) b.mo = false; },
      xoaHet: function () { return xoa(T.net.map(function (n) { return n.id; })); },
      hoanTac: function () { var b = T.lui.pop(); if (!b) return false; b.mo = false; if (b.l === 'them') go(b.ds); else gan(b.ds); T.toi.push(b); return true; },
      lamLai: function () { var b = T.toi.pop(); if (!b) return false; if (b.l === 'them') gan(b.ds); else go(b.ds); T.lui.push(b); return true; },
      coLui: function () { return T.lui.length > 0; },
      coToi: function () { return T.toi.length > 0; },
      xuat: function () { return { v: 1, tiLe: tiLe, net: T.net.map(gon) }; },
      nhap: function (goi) {
        var vao = goi && (goi.net || goi), ra = [], i, n;
        if (dang) ketThuc();
        if (vao && vao.length) for (i = 0; i < vao.length; i++) { n = sachNet(vao[i], i); if (n) ra.push(n); }
        T.net = ra; T.lui = []; T.toi = [];
        phat({ loai: 'trang', net: T.net.map(gon), tiLe: tiLe });
        return ra.length;
      }
    };
  }

  function apSuKien(ds, sk) {
    var i, n;
    if (sk.loai === 'trang') { ds.length = 0; for (i = 0; i < sk.net.length; i++) { n = gon(sk.net[i]); n.diem = n.diem.slice(); ds.push(n); } }
    else if (sk.loai === 'net-moi') { n = gon(sk.net); n.diem = n.diem.slice(); ds.splice(sk.vt == null ? ds.length : Math.min(sk.vt, ds.length), 0, n); }
    else if (sk.loai === 'them-diem') { for (i = 0; i < ds.length; i++) if (ds[i].id === sk.id) { ds[i].diem = ds[i].diem.concat(sk.diem); break; } }
    else if (sk.loai === 'xoa') { for (i = ds.length - 1; i >= 0; i--) if (sk.id.indexOf(ds[i].id) >= 0) ds.splice(i, 1); }
    return ds;
  }
  return { khung: khung, diem: diem, apLucGia: apLucGia, heSo: heSo, moXuLy: moXuLy, xuLyThem: xuLyThem, mocDong: mocDong, vien: vien, dungNet: dungNet, duongTam: duongTam, duoiTam: duoiTam, veDaGiac: veDaGiac, chamNet: chamNet, timCham: timCham, hop: hop, laBang: laBang, buSang: buSang, taoSo: taoSo, apSuKien: apSuKien };
})();
