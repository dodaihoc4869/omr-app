// BÚT VIẾT BẢNG — LÕI THUẦN (thầy 10/11: «chỉnh phần bút viết cho mượt mà … viết bằng bút wacom lên phần bảng đen, nét bút mảnh vừa phải siêu đẹp»).
//
// Lõi KHÔNG đụng DOM: nét là VECTƠ, toạ độ chuẩn hoá 0..1 theo vùng viết ⇒ đổi cỡ cửa sổ / máy khác vẽ lại đúng, sẵn cho việc phát LIVE nét bút.
// Viết thành CHUỖI JS (ES5) vì tờ chiếu là trang HTML rời (iframe) — chèn qua `but-bang-to-chieu.ts`; app / test lấy cùng bộ máy bằng `taoLoiBut()`.
//
// MÔ HÌNH NÉT        { id, cong: 'but' | 'tay', mau, co, diem: [x, y, apLuc, t][] }
//   x, y   0..1 theo bề ngang / bề dọc vùng viết (5 số lẻ)      apLuc  0..1 (2 số lẻ)      t  mili-giây kể từ điểm đầu nét
//   co     bề rộng cơ sở của nét, tính bằng px ở màn 1920 (máy khác nhân dvi / 1920, dvi = min(ngang, dọc × 16 / 9))
// CÁCH DỰNG NÉT (cùng một dữ liệu ⇒ cùng một hình ở mọi máy):
//   1. lọc nhiễu 1€ (tần số cắt tăng theo vận tốc: đi chậm lọc run tay, đi nhanh gần như không trễ) + nối thẳng tới điểm thật cuối cùng;
//   2. bán kính = co / 2 × (0,6 … 1,6 theo lực, lực đã làm mượt) × thon đầu nét / thon cuối nét;
//   3. dựng ĐA GIÁC bao quanh đường tâm (hai mép lệch pháp tuyến, chỗ gập gắt thêm quạt tròn, hai đầu bo tròn);
//   4. tô đa giác bằng đường cong bậc hai qua trung điểm các đỉnh ⇒ mép mịn, không «hạt cườm».
// SỰ KIỆN (cho việc live):  net-moi · them-diem · net-xong · xoa · trang · tro (con trỏ lơ lửng)   — `apSuKien` dựng lại đúng mảng nét ở máy nhận.

/** Một điểm của nét: [x 0..1, y 0..1, áp lực 0..1, mili-giây từ đầu nét]. */
export type DiemBut = [number, number, number, number]
/** Một nét vectơ. `co` = bề rộng cơ sở tính bằng px ở màn 1920. */
export interface NetBut { id: string; cong: 'but' | 'tay'; mau: string; co: number; diem: DiemBut[] }
/** Gói xuất / nhập của MỘT trang (một đợt / câu). `tiLe` = ngang / dọc của vùng viết lúc xuất. */
export interface GoiNetBut { v: 1; tiLe: number; net: NetBut[] }
/** Sự kiện phát ra khi nét đổi. `trang` = khoá trang (đợt) đang viết. */
export type SuKienBut =
  | { loai: 'net-moi'; trang: string; net: NetBut; vt?: number; xong?: boolean }
  | { loai: 'them-diem'; trang: string; id: string; diem: DiemBut[] }
  | { loai: 'net-xong'; trang: string; id: string }
  | { loai: 'xoa'; trang: string; id: string[] }
  | { loai: 'trang'; trang: string; net: NetBut[]; tiLe: number }
  | { loai: 'tro'; trang: string; x: number; y: number }
/** Khung quy chiếu của vùng viết W × H px: k = dvi / 1920; rw × rh = vùng viết tính bằng «px ở màn 1920». */
export interface KhungBut { W: number; H: number; k: number; rw: number; rh: number }
/** Trạng thái xử lý dần một nét (đường tâm đã lọc + bán kính + độ dài cộng dồn). */
export interface XuLyBut { kh: KhungBut; n: number; X: number[]; Y: number[]; R: number[]; L: number[]; px: number; py: number; ban: number }
export interface SoBut {
  nghe(f: (sk: SuKienBut) => void): () => void
  trang(): string
  ds(): NetBut[]
  datTiLe(v: number): void
  doiTrang(khoa: string): void
  batDau(mo: { cong?: 'but' | 'tay'; mau: string; co: number; diem?: DiemBut }): NetBut
  themDiem(ds: DiemBut[]): void
  ketThuc(huy?: boolean): NetBut | null
  /** Con trỏ bút lơ lửng (chưa chạm): chỉ phát sự kiện `tro`, không đổi nét. */
  tro(x: number, y: number): void
  xoa(ids: string[], gop?: boolean): number
  dongGop(): void
  xoaHet(): number
  hoanTac(): boolean
  lamLai(): boolean
  coLui(): boolean
  coToi(): boolean
  xuat(): GoiNetBut
  nhap(goi: GoiNetBut | NetBut[]): number
}
export interface LoiBut {
  khung(W: number, H: number): KhungBut
  diem(xPx: number, yPx: number, apLuc: number, t: number, W: number, H: number): DiemBut
  apLucGia(truoc: number, quang: number, dt: number): number
  heSo(apLuc: number): number
  moXuLy(net: { co: number }, kh: KhungBut): XuLyBut
  xuLyThem(st: XuLyBut, diem: DiemBut[], den: number): void
  mocDong(st: XuLyBut, dong: number): number
  /** Đa giác bao của nét từ điểm xử lý `tu` tới `den` (−1 = tới hết, kèm đuôi `duoi` và đầu bo); `xong` = thon cuối nét. Mảng phẳng [x0, y0, x1, y1…] (px ở màn 1920). */
  vien(st: XuLyBut, tu: number, den: number, duoi: number[][] | null, xong: boolean): number[]
  dungNet(net: NetBut, kh: KhungBut): number[]
  veDaGiac(g: { moveTo(x: number, y: number): void; quadraticCurveTo(a: number, b: number, x: number, y: number): void; closePath(): void }, p: number[]): void
  chamNet(net: NetBut, x: number, y: number, r: number, kh: KhungBut): boolean
  timCham(ds: NetBut[], x: number, y: number, r: number, kh: KhungBut): string[]
  taoSo(tuy?: { taoId?: (dem: number) => string; gioiHan?: number }): SoBut
  apSuKien(ds: NetBut[], sk: SuKienBut): NetBut[]
}

export const JS_LOI_BUT = `
var LoiBut = (function () {
  var CHIA = 1e5, PI = Math.PI, MAU0 = 'rgb(244,239,228)';
  // Lọc 1€: tần số cắt (Hz) = FC0 + BETA × vận tốc (px ở màn 1920 mỗi giây); FCV = tần số cắt của vận tốc.
  var FC0 = 3.5, BETA = 0.06, FCV = 6;
  // Thon: dài bằng bao nhiêu lần bề rộng cơ sở · bán kính còn lại ở mút · bán kính nhỏ nhất (px ở màn 1920).
  var THON_DAU = 4, THON_CUOI = 6, NHO_DAU = 0.42, NHO_CUOI = 0.28, R_NHO = 0.3, SAT = 0.3;
  function kep(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tron(v, k) { return Math.round(v * k) / k; }
  function xa(ax, ay, bx, by) { ax -= bx; ay -= by; return Math.sqrt(ax * ax + ay * ay); }
  function khung(W, H) { var k = Math.min(W, H * 16 / 9) / 1920 || 1; return { W: W, H: H, k: k, rw: W / k, rh: H / k }; }
  function diem(x, y, ap, t, W, H) { return [tron(kep(x / W, 0, 1), CHIA), tron(kep(y / H, 0, 1), CHIA), tron(kep(ap, 0, 1), 100), Math.max(0, Math.round(t))]; }
  // Chuột / chạm không có lực: giả theo vận tốc (quang = px ở màn 1920, dt = mili-giây) — đi nhanh thì nhẹ tay (mảnh), đi chậm thì đậm; đổi dần.
  function apLucGia(truoc, quang, dt) { var dich = 0.56 - 0.48 * kep(quang / Math.max(1, dt) / 2.4, 0, 1); return truoc + (dich - truoc) * kep(dt / 70, 0, 1); }
  // Lực 0..1 ⇒ hệ số bề rộng 0,6 … 1,6.
  function heSo(ap) { return 0.6 + Math.pow(kep(ap, 0, 1), 0.7); }

  // ── 1 · đường tâm: lọc dần từng điểm (nhân quả ⇒ phần đã xử lý không đổi khi có điểm mới) ──
  function moXuLy(net, kh) { return { kh: kh, n: 0, X: [], Y: [], R: [], L: [], fx: 0, fy: 0, vx: 0, vy: 0, ap: 0, px: 0, py: 0, t: 0, ban: (net.co || 2.3) / 2 }; }
  function tiLoc(dt, fc) { return 1 / (1 + 1 / (2 * PI * fc * dt)); }
  function xuLyThem(st, ds, den) {
    var kh = st.kh, i, d, x, y, dt, a, m, q;
    for (i = st.n; i < den; i++) {
      d = ds[i]; x = d[0] * kh.rw; y = d[1] * kh.rh;
      if (!i) { st.fx = x; st.fy = y; st.ap = d[2]; }
      else {
        dt = Math.max(1, d[3] - st.t) / 1000;
        a = i === 1 ? 1 : tiLoc(dt, FCV);
        st.vx += a * ((x - st.px) / dt - st.vx); st.vy += a * ((y - st.py) / dt - st.vy);
        a = tiLoc(dt, FC0 + BETA * Math.sqrt(st.vx * st.vx + st.vy * st.vy));
        st.fx += a * (x - st.fx); st.fy += a * (y - st.fy);
        st.ap += (d[2] - st.ap) * dt / (dt + 0.03);
      }
      st.px = x; st.py = y; st.t = d[3];
      m = st.X.length;
      if (m) { q = xa(st.fx, st.fy, st.X[m - 1], st.Y[m - 1]); if (q < SAT) continue; st.L.push(st.L[m - 1] + q); } else st.L.push(0);
      st.X.push(st.fx); st.Y.push(st.fy); st.R.push(st.ban * heSo(st.ap));
    }
    st.n = den;
  }
  // Nét đang viết quá dài: phần đầu (tới chỉ số trả về) đã ổn định, đem in xuống lớp tĩnh. −1 = chưa cần. Luôn chừa đuôi dài hơn đoạn thon cuối.
  function mocDong(st, dong) {
    var m = st.X.length, den = m - 40, giu = st.ban * 2 * THON_CUOI * 3;
    if (den - dong < 80) return -1;
    while (den > dong + 40 && st.L[m - 1] - st.L[den] < giu) den -= 8;
    return den - dong >= 40 ? den : -1;
  }

  // ── 2 + 3 · bán kính thon hai đầu, rồi đa giác bao ──
  function vien(st, tu, den, duoi, xong) {
    var o = tu > 0 ? tu - 1 : 0, het = den < 0, c = het ? st.X.length : Math.min(st.X.length, den + 2);
    var X = st.X.slice(o, c), Y = st.Y.slice(o, c), R = st.R.slice(o, c), L = st.L.slice(o, c), n, i, q, s, f, tong, co, tD, tC;
    function noi(x, y) { n = X.length; q = n ? xa(x, y, X[n - 1], Y[n - 1]) : 0; if (n && q < SAT) return; X.push(x); Y.push(y); R.push(n ? R[n - 1] : st.ban); L.push(n ? L[n - 1] + q : 0); }
    if (het) { if (st.n) noi(st.px, st.py); if (duoi) for (i = 0; i < duoi.length; i++) noi(duoi[i][0], duoi[i][1]); }
    n = X.length; if (!n) return [];
    tong = L[n - 1]; co = st.ban * 2;
    tD = Math.min(THON_DAU * co, tong * 0.35); tC = xong ? Math.min(THON_CUOI * co, tong * 0.45) : 0;
    for (i = 0; i < n; i++) {
      f = 1; s = L[i];
      if (s < tD) { q = s / tD; f *= NHO_DAU + (1 - NHO_DAU) * q * (2 - q); }
      s = tong - s;
      if (s < tC) { q = s / tC; f *= NHO_CUOI + (1 - NHO_CUOI) * q * (2 - q); }
      R[i] = Math.max(R_NHO, R[i] * f);
    }
    return bao(X, Y, R, tu - o, het ? n - 1 : Math.min(n - 1, den - o), tu === 0, het);
  }
  function bao(X, Y, R, a, b, muDau, muCuoi) {
    var N = X.length, T = [], P = [], i, k, m, ax, ay, bx, by, q, r, nx, ny, x, y, c, s, cham;
    if (b <= a) { r = R[a] * 1.3; for (k = 0; k < 14; k++) T.push(X[a] + r * Math.cos(k * PI / 7), Y[a] + r * Math.sin(k * PI / 7)); return T; }
    for (i = a; i <= b; i++) {
      // (ax, ay) hướng TỚI điểm này · (bx, by) hướng RỜI điểm này
      if (i > 0) { ax = X[i] - X[i - 1]; ay = Y[i] - Y[i - 1]; } else { ax = X[1] - X[0]; ay = Y[1] - Y[0]; }
      if (i < N - 1) { bx = X[i + 1] - X[i]; by = Y[i + 1] - Y[i]; } else { bx = ax; by = ay; }
      q = Math.sqrt(ax * ax + ay * ay) || 1; ax /= q; ay /= q;
      q = Math.sqrt(bx * bx + by * by) || 1; bx /= q; by /= q;
      r = R[i]; cham = ax * bx + ay * by;
      if (cham < -0.25 && i > a && i < b) {
        // gập gắt (quay đầu bút): hai mép cùng quét nửa vòng qua phía trước ⇒ góc tròn, không hở, không vênh
        nx = -ay; ny = ax;
        for (k = 0; k <= 6; k++) {
          c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6);
          T.push(X[i] + r * (nx * c + ny * s), Y[i] + r * (ny * c - nx * s));
          P.push(X[i] + r * (ny * s - nx * c), Y[i] - r * (nx * s + ny * c));
        }
        continue;
      }
      nx = ax + bx; ny = ay + by; q = Math.sqrt(nx * nx + ny * ny) || 1; x = -ny / q * r; y = nx / q * r;
      q = r * r * 0.2;
      m = T.length; nx = X[i] + x - T[m - 2]; ny = Y[i] + y - T[m - 1];
      if (i === a || i === b || nx * nx + ny * ny > q) T.push(X[i] + x, Y[i] + y);
      m = P.length; nx = X[i] - x - P[m - 2]; ny = Y[i] - y - P[m - 1];
      if (i === a || i === b || nx * nx + ny * ny > q) P.push(X[i] - x, Y[i] - y);
    }
    if (muCuoi) {
      // đầu bo ở cuối nét: từ mép trái vòng qua phía trước sang mép phải
      ax = X[b] - X[b - 1]; ay = Y[b] - Y[b - 1]; q = Math.sqrt(ax * ax + ay * ay) || 1; nx = -ay / q; ny = ax / q; r = R[b];
      for (k = 1; k < 6; k++) { c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6); T.push(X[b] + r * (nx * c + ny * s), Y[b] + r * (ny * c - nx * s)); }
    }
    for (i = P.length - 2; i >= 0; i -= 2) T.push(P[i], P[i + 1]);
    if (muDau) {
      // đầu bo ở đầu nét: từ mép phải vòng qua phía sau về mép trái
      ax = X[a + 1] - X[a]; ay = Y[a + 1] - Y[a]; q = Math.sqrt(ax * ax + ay * ay) || 1; nx = ay / q; ny = -ax / q; r = R[a];
      for (k = 1; k < 6; k++) { c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6); T.push(X[a] + r * (nx * c + ny * s), Y[a] + r * (ny * c - nx * s)); }
    }
    return T;
  }
  function dungNet(net, kh) { var st = moXuLy(net, kh); xuLyThem(st, net.diem, net.diem.length); return vien(st, 0, -1, null, true); }
  // ── 4 · tô: đường cong bậc hai qua trung điểm các đỉnh (g = ngữ cảnh canvas 2D hoặc Path2D) ──
  function veDaGiac(g, p) {
    var n = p.length >> 1, i, a, b;
    if (n < 3) return;
    g.moveTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2);
    for (i = 1; i <= n; i++) { a = (i % n) * 2; b = ((i + 1) % n) * 2; g.quadraticCurveTo(p[a], p[a + 1], (p[a] + p[b]) / 2, (p[a + 1] + p[b + 1]) / 2); }
    g.closePath();
  }

  // ── tẩy theo nét: (x, y) chuẩn hoá, r = bán kính tẩy (px ở màn 1920) ──
  function chamNet(net, x, y, r, kh) {
    var d = net.diem, h = net._h, i, px, py, ax, ay, bx, by, vx, vy, t, rr, mx, my;
    if (!h) { h = [1, 1, 0, 0]; for (i = 0; i < d.length; i++) { h[0] = Math.min(h[0], d[i][0]); h[1] = Math.min(h[1], d[i][1]); h[2] = Math.max(h[2], d[i][0]); h[3] = Math.max(h[3], d[i][1]); } net._h = h; }
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

  // ── sổ nét: mỗi trang (đợt / câu) một mảng nét + hoàn tác / làm lại riêng; mọi thay đổi phát sự kiện ──
  function gon(n) { return { id: n.id, cong: n.cong, mau: n.mau, co: n.co, diem: n.diem }; }
  function sachNet(n, i) {
    var ds = [], j, d;
    if (!n || !n.diem) return null;
    for (j = 0; j < n.diem.length; j++) { d = n.diem[j]; if (d && isFinite(d[0]) && isFinite(d[1])) ds.push([tron(kep(+d[0], 0, 1), CHIA), tron(kep(+d[1], 0, 1), CHIA), tron(kep(isFinite(d[2]) ? +d[2] : 0.5, 0, 1), 100), Math.max(0, Math.round(+d[3] || 0))]); }
    if (!ds.length) return null;
    return { id: String(n.id || 'n' + i), cong: n.cong === 'tay' ? 'tay' : 'but', mau: /^rgba?\\([0-9., %\\/]+\\)$/.test(n.mau) ? n.mau : MAU0, co: kep(+n.co || 2.3, 0.5, 16), diem: ds };
  }
  function taoSo(tuy) {
    tuy = tuy || {};
    var khoa = '', T = { net: [], lui: [], toi: [] }, trang = { '': T }, tai = [], dang = null, dem = 0, tiLe = 16 / 9, GIOI = tuy.gioiHan || 300;
    function id() { dem++; return tuy.taoId ? tuy.taoId(dem) : 'n' + Date.now().toString(36) + dem.toString(36) + Math.floor(Math.random() * 1296).toString(36); }
    function phat(sk) { var i; sk.trang = khoa; for (i = 0; i < tai.length; i++) { try { tai[i](sk); } catch (e) {} } }
    function vt(i) { var k; for (k = 0; k < T.net.length; k++) if (T.net[k].id === i) return k; return -1; }
    function ghi(b) { T.lui.push(b); if (T.lui.length > GIOI) T.lui.shift(); T.toi = []; }
    // Một bước = nhóm { net, vt } ghi theo thứ tự GỠ; gắn lại theo thứ tự ngược ⇒ nét về đúng chỗ cũ trong mảng.
    function go(ds) { var ids = [], i, k; for (i = 0; i < ds.length; i++) { k = vt(ds[i].net.id); if (k >= 0) { ds[i].vt = k; T.net.splice(k, 1); ids.push(ds[i].net.id); } } if (ids.length) phat({ loai: 'xoa', id: ids }); }
    function gan(ds) { var i, k; for (i = ds.length - 1; i >= 0; i--) { k = Math.min(ds[i].vt, T.net.length); T.net.splice(k, 0, ds[i].net); phat({ loai: 'net-moi', net: gon(ds[i].net), vt: k, xong: true }); } }
    function ketThuc(huy) {
      var n = dang; if (!n) return null; dang = null;
      if (huy || !n.diem.length) { phat({ loai: 'xoa', id: [n.id] }); return null; }
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
      batDau: function (mo) { dang = { id: id(), cong: mo.cong === 'tay' ? 'tay' : 'but', mau: mo.mau, co: mo.co, diem: mo.diem ? [mo.diem] : [] }; phat({ loai: 'net-moi', net: { id: dang.id, cong: dang.cong, mau: dang.mau, co: dang.co, diem: dang.diem.slice() } }); return dang; },
      themDiem: function (ds) { var i; if (!dang || !ds.length) return; for (i = 0; i < ds.length; i++) dang.diem.push(ds[i]); phat({ loai: 'them-diem', id: dang.id, diem: ds }); },
      ketThuc: ketThuc,
      tro: function (x, y) { if (tai.length) phat({ loai: 'tro', x: tron(kep(x, 0, 1), 1e4), y: tron(kep(y, 0, 1), 1e4) }); },
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
  // Máy NHẬN: áp một sự kiện vào mảng nét của trang đang xem (sửa tại chỗ, trả lại chính mảng đó).
  function apSuKien(ds, sk) {
    var i, n;
    if (sk.loai === 'trang') { ds.length = 0; for (i = 0; i < sk.net.length; i++) { n = gon(sk.net[i]); n.diem = n.diem.slice(); ds.push(n); } }
    else if (sk.loai === 'net-moi') { n = gon(sk.net); n.diem = n.diem.slice(); ds.splice(sk.vt == null ? ds.length : Math.min(sk.vt, ds.length), 0, n); }
    else if (sk.loai === 'them-diem') { for (i = 0; i < ds.length; i++) if (ds[i].id === sk.id) { ds[i].diem = ds[i].diem.concat(sk.diem); break; } }
    else if (sk.loai === 'xoa') { for (i = ds.length - 1; i >= 0; i--) if (sk.id.indexOf(ds[i].id) >= 0) ds.splice(i, 1); }
    return ds;
  }
  return { khung: khung, diem: diem, apLucGia: apLucGia, heSo: heSo, moXuLy: moXuLy, xuLyThem: xuLyThem, mocDong: mocDong, vien: vien, dungNet: dungNet, veDaGiac: veDaGiac, chamNet: chamNet, timCham: timCham, taoSo: taoSo, apSuKien: apSuKien };
})();
`

/** Bộ máy bút cho app / test: chạy chính chuỗi mà tờ chiếu chạy (một nguồn duy nhất ⇒ máy phát và máy nhận dựng nét y hệt nhau). */
export function taoLoiBut(): LoiBut {
  return new Function(`${JS_LOI_BUT}\nreturn LoiBut;`)() as LoiBut
}
