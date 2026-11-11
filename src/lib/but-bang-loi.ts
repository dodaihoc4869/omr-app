// BÚT VIẾT BẢNG — LÕI THUẦN (thầy 10/11: «chỉnh phần bút viết cho mượt mà … viết bằng bút wacom lên phần bảng đen, nét bút mảnh vừa phải siêu đẹp»).
//
// Lõi KHÔNG đụng DOM: nét là VECTƠ, toạ độ chuẩn hoá 0..1 theo vùng viết ⇒ đổi cỡ cửa sổ / máy khác vẽ lại đúng, sẵn cho việc phát LIVE nét bút.
// Viết thành CHUỖI JS (ES5) vì tờ chiếu là trang HTML rời (iframe) — chèn qua `but-bang-to-chieu.ts`; app / test lấy cùng bộ máy bằng `taoLoiBut()`.
//
// MÔ HÌNH NÉT        { id, cong: 'but' | 'tay', mau, co, diem: [x, y, apLuc, t][] }
//   x, y   0..1 theo bề ngang / bề dọc vùng viết (5 số lẻ)      apLuc  0..1 (2 số lẻ)      t  mili-giây kể từ điểm đầu nét
//   BẢNG ĐEN CUỘN (11/11, thầy: «bảng đen khi live có cuộn vô hạn»): nét viết trên cột bảng đen mang mã bắt đầu bằng «b_» và y = y màn + độ cuộn của bảng
//   (tính bằng số lần bề dọc vùng viết ⇒ y có thể > 1, tối đa 160). Máy nhận thấy mã «b_» thì vẽ nét trong ô bảng, dời theo độ cuộn của chính nó.
//   co     bề rộng cơ sở của nét, tính bằng px ở màn 1920 (máy khác nhân dvi / 1920, dvi = min(ngang, dọc × 16 / 9))
// CÁCH DỰNG NÉT (hàm THUẦN của dữ liệu điểm: cùng một dữ liệu ⇒ cùng một hình ở mọi máy; KHÔNG dùng cột giờ `t` để dựng hình — giờ mẫu sai / dồn cục không làm méo nét):
//   1. khử rung RẤT NHẸ, không trễ (11/11, thầy: «viết bị nhằng nhằng chưa mượt như goodnote»): chỉ nắn chỗ mẫu ZÍCH-ZẮC sát nhau (bậc thang của toạ độ nguyên px khi đi chậm),
//      mỗi mẫu dịch tối đa 0,55 px; chỗ cong thật (bướu «m n u») và mẫu thưa (đi nhanh) giữ NGUYÊN. Không còn lọc 1€: lọc 1€ kéo trễ, san phẳng bướu, để lại đuôi thẳng lúc nhấc bút;
//   2. đường tâm = đường cong Catmull-Rom hướng tâm ĐI QUA đúng từng mẫu, chia theo độ cong (lệch đường cong ≤ 0,06 px; mẫu 60 Hz vẫn tròn dáng chữ, không cắt góc);
//   3. bán kính = co / 2 × (0,7 … 1,35 theo lực, lực làm trơn đối xứng 3 mẫu) × thon RẤT NGẮN ở đầu / cuối (nét càng ngắn càng ít thon: dấu chấm, dấu phẩy, dấu thanh vẫn rõ);
//   4. dựng ĐA GIÁC bao quanh đường tâm (hai mép lệch pháp tuyến, chỗ gập gắt thêm quạt tròn, hai đầu bo tròn), tô bằng đường cong bậc hai qua trung điểm các đỉnh.
//   Đang viết: phần đã CHỐT (không đổi nữa khi có mẫu mới) nằm trong X / Y / R / L; 3 đoạn cuối là ĐUÔI tạm, dựng lại mỗi lần vẽ — đầu nét luôn tới đúng mẫu mới nhất.
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
  /** Con trỏ lơ lửng. QUY ƯỚC 11/11: `x > 1,5` ⇒ không phải con trỏ mà là ĐỘ CUỘN của bảng đen (`y`, số lần bề dọc vùng viết) — máy nhận cuộn bảng theo. */
  | { loai: 'tro'; trang: string; x: number; y: number }
/** Khung quy chiếu của vùng viết W × H px: k = dvi / 1920; rw × rh = vùng viết tính bằng «px ở màn 1920». */
export interface KhungBut { W: number; H: number; k: number; rw: number; rh: number }
/** Trạng thái xử lý dần một nét: X / Y / R / L = đường tâm ĐÃ CHỐT (chia dày) + bán kính + độ dài cộng dồn; px, py = mẫu thật mới nhất. */
export interface XuLyBut { kh: KhungBut; n: number; X: number[]; Y: number[]; R: number[]; L: number[]; px: number; py: number; ban: number }
/** Đuôi tạm của nét đang viết (từ điểm chốt cuối tới mẫu mới nhất), nối tiếp sau X / Y / R / L của `XuLyBut`. */
export interface DuoiBut { X: number[]; Y: number[]; R: number[]; L: number[] }
export interface SoBut {
  nghe(f: (sk: SuKienBut) => void): () => void
  trang(): string
  ds(): NetBut[]
  datTiLe(v: number): void
  doiTrang(khoa: string): void
  /** `bang` = nét viết trên BẢNG ĐEN CUỘN (11/11): mã nét bắt đầu bằng «b_», toạ độ y tính theo bảng (y màn + độ cuộn, có thể > 1). */
  batDau(mo: { cong?: 'but' | 'tay'; mau: string; co: number; diem?: DiemBut; bang?: boolean }): NetBut
  themDiem(ds: DiemBut[]): void
  ketThuc(huy?: boolean): NetBut | null
  /** Con trỏ bút lơ lửng (chưa chạm): chỉ phát sự kiện `tro`, không đổi nét. */
  tro(x: number, y: number): void
  /** Báo ĐỘ CUỘN của bảng đen (11/11): phát sự kiện `tro` có `x = 2` (ngoài màn), `y` = độ cuộn. Không thêm loại sự kiện / khung mạng nào. */
  cuon(v: number): void
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
  /** `it` = số điểm dồn tối thiểu mới in (mặc định 64). */
  mocDong(st: XuLyBut, dong: number, it?: number): number
  /** Đuôi tạm; `them` = điểm nối thêm sau mẫu cuối (đầu bút thật, điểm dự đoán), px ở màn 1920. */
  duoiTam(st: XuLyBut, them: number[][] | null): DuoiBut
  /** Đa giác bao của nét từ điểm xử lý `tu` tới `den` (−1 = tới hết, kèm đuôi `duoi` và đầu bo); `xong` = thon cuối nét. Mảng phẳng [x0, y0, x1, y1…] (px ở màn 1920). */
  vien(st: XuLyBut, tu: number, den: number, duoi: number[][] | null, xong: boolean): number[]
  dungNet(net: NetBut, kh: KhungBut): number[]
  /** Đường tâm của cả nét (đã chốt + đuôi), mảng phẳng [x0, y0, x1, y1…] px ở màn 1920 — để đo độ trung thực, hoặc cho máy nhận muốn tự vẽ. */
  duongTam(net: NetBut, kh: KhungBut): number[]
  veDaGiac(g: { moveTo(x: number, y: number): void; quadraticCurveTo(a: number, b: number, x: number, y: number): void; closePath(): void }, p: number[]): void
  chamNet(net: NetBut, x: number, y: number, r: number, kh: KhungBut): boolean
  timCham(ds: NetBut[], x: number, y: number, r: number, kh: KhungBut): string[]
  /** Hộp bao [x0, y0, x1, y1] của nét (toạ độ chuẩn hoá; nhớ lại trên nét). */
  hop(net: NetBut): number[]
  /** Nét viết trên bảng đen cuộn (mã bắt đầu bằng «b_»)? */
  laBang(net: { id: string }): boolean
  taoSo(tuy?: { taoId?: (dem: number) => string; gioiHan?: number }): SoBut
  apSuKien(ds: NetBut[], sk: SuKienBut): NetBut[]
}

export const JS_LOI_BUT = `
var LoiBut = (function () {
  var CHIA = 1e5, PI = Math.PI, MAU0 = 'rgb(244,239,228)', YMAX = 160;
` + /* Khử rung: bước trung bình giữa các mẫu ≤ RUNG_A px ⇒ nắn đủ, ≥ RUNG_B px ⇒ không đụng; chỗ zích-zắc nắn RUNG_ZIC phần độ gãy, chỗ cong đều chỉ RUNG_DEU; */ `
` + /* không mẫu nào bị dịch quá RUNG_KEP px (px ở màn 1920). */ `
  var RUNG_A = 1, RUNG_B = 2.2, RUNG_ZIC = 0.25, RUNG_DEU = 0.04, RUNG_KEP = 0.55;
` + /* Đường cong: mỗi đoạn giữa hai mẫu chia THEO ĐỘ CONG — vừa đủ để đường gấp khúc lệch đường cong không quá DUNG px (đoạn thẳng đi nhanh: không chia; bướu gắt: chia dày), */ `
` + /* tối đa CHIA_MAX bước. */ `
  var DUNG = 0.06, CHIA_MAX = 14;
` + /* Thon: dài bằng bao nhiêu lần bề rộng cơ sở · bán kính còn lại ở mút · nét dài dưới NGAN_A lần bề rộng thì không thon, từ NGAN_B lần trở lên thon đủ. */ `
  var THON_DAU = 1.6, THON_CUOI = 2.2, NHO_DAU = 0.72, NHO_CUOI = 0.55, NGAN_A = 1.5, NGAN_B = 5, R_NHO = 0.3, SAT = 0.3;
  function kep(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tron(v, k) { return Math.round(v * k) / k; }
  function xa(ax, ay, bx, by) { ax -= bx; ay -= by; return Math.sqrt(ax * ax + ay * ay); }
  function muot(a, b, v) { v = kep((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); }
  function khung(W, H) { var k = Math.min(W, H * 16 / 9) / 1920 || 1; return { W: W, H: H, k: k, rw: W / k, rh: H / k }; }
  function diem(x, y, ap, t, W, H) { return [tron(kep(x / W, 0, 1), CHIA), tron(kep(y / H, 0, YMAX), CHIA), tron(kep(ap, 0, 1), 100), Math.max(0, Math.round(t))]; }
` + /* Chuột / chạm không có lực: giả theo vận tốc (quang = px ở màn 1920, dt = mili-giây) — đi nhanh thì nhẹ tay (mảnh), đi chậm thì đậm; đổi dần. */ `
  function apLucGia(truoc, quang, dt) { var dich = 0.56 - 0.48 * kep(quang / Math.max(1, dt) / 2.4, 0, 1); return truoc + (dich - truoc) * kep(dt / 70, 0, 1); }
` + /* Lực 0..1 ⇒ hệ số bề rộng 0,7 … 1,35 (11/11: hẹp hơn 0,6 … 1,6 cũ — chữ nhỏ ấn mạnh tay không còn bị nét to át chữ). */ `
  function heSo(ap) { return 0.7 + 0.65 * Math.pow(kep(ap, 0, 1), 0.8); }

` + /* ── 1 + 2 · đường tâm. rx / ry / rp = mẫu thật (bỏ mẫu trùng chỗ) · cx / cy / cr = MỐC đã chốt (mẫu sau khử rung) + bán kính · */ `
` + /*    X / Y / R / L = đường cong qua các mốc, chia dày, đã chốt. Mẫu k chốt thành mốc khi có mẫu k + 2; đoạn cong k → k + 1 chốt khi có mốc k + 2 (tức mẫu k + 4). ── */ `
  function moXuLy(net, kh) { return { kh: kh, n: 0, X: [], Y: [], R: [], L: [], rx: [], ry: [], rp: [], cx: [], cy: [], cr: [], ns: 0, px: 0, py: 0, ban: (net.co || 2.3) / 2 }; }
` + /* Khử rung mẫu i (0 < i < m − 1) ⇒ ra[0], ra[1]. Độ gãy s = a − 2b + c. Gãy NGƯỢC CHIỀU với mẫu kề (zích-zắc) = nhiễu ⇒ nắn; gãy cùng chiều = cong thật ⇒ gần như giữ nguyên. */ `
  function nan(RX, RY, i, m, ra) {
    var ax = RX[i - 1], ay = RY[i - 1], bx = RX[i], by = RY[i], cx = RX[i + 1], cy = RY[i + 1], sx = ax - 2 * bx + cx, sy = ay - 2 * by + cy, zic = false, w, q;
    q = xa(ax, ay, bx, by) + xa(bx, by, cx, cy);
` + /* quay đầu bút / góc nhọn (dây cung a → c ngắn hơn hẳn đường a → b → c) là NÉT THẬT: không nắn */ `
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
` + /* Lực làm trơn [1, 2, 1] / 4 quanh mẫu i (hai đầu lấy phần có được). */ `
  function lucTron(RP, i, m) { return m === 1 ? RP[0] : !i ? (2 * RP[0] + RP[1]) / 3 : i === m - 1 ? (RP[i - 1] + 2 * RP[i]) / 3 : (RP[i - 1] + 2 * RP[i] + RP[i + 1]) / 4; }
` + /* Một đoạn Catmull-Rom hướng tâm từ p1 tới p2 (p0, p3 = mốc kề hai bên): thêm các điểm chia vào X / Y / R / L (không thêm p1). Đi QUA đúng p1 và p2. */ `
  function doan(X, Y, R, L, x0, y0, x1, y1, x2, y2, x3, y3, r1, r2) {
    var d1 = Math.sqrt(xa(x0, y0, x1, y1)), d2 = Math.sqrt(xa(x1, y1, x2, y2)), d3 = Math.sqrt(xa(x2, y2, x3, y3)), n, k, t, t2, t3, a, b, c, d, x, y, m, q, ux, uy, vx, vy;
    if (d2 < 1e-4) return;
    if (d1 < 1e-4) d1 = d2; if (d3 < 1e-4) d3 = d2;
    ux = ((x1 - x0) / d1 - (x2 - x0) / (d1 + d2) + (x2 - x1) / d2) * d2; uy = ((y1 - y0) / d1 - (y2 - y0) / (d1 + d2) + (y2 - y1) / d2) * d2;
    vx = ((x2 - x1) / d2 - (x3 - x1) / (d2 + d3) + (x3 - x2) / d3) * d2; vy = ((y2 - y1) / d2 - (y3 - y1) / (d2 + d3) + (y3 - y2) / d3) * d2;
` + /* đường cong Hermite lệch dây cung nhiều nhất 4/27 × (|u − dây| + |v − dây|); chia n bước thì độ lệch giảm n² lần */ `
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
` + /* Đoạn cong từ mốc j tới mốc j + 1 (m = số mốc đang có). Ngoài hai đầu nét thì lấy mốc đối xứng qua mốc mút ⇒ đầu / cuối nét đi theo hướng đoạn kề. */ `
  function doanMoc(X, Y, R, L, CX, CY, CR, j, m) {
    var a = j > 0, b = j + 2 < m;
    doan(X, Y, R, L, a ? CX[j - 1] : 2 * CX[j] - CX[j + 1], a ? CY[j - 1] : 2 * CY[j] - CY[j + 1], CX[j], CY[j], CX[j + 1], CY[j + 1], b ? CX[j + 2] : 2 * CX[j + 1] - CX[j], b ? CY[j + 2] : 2 * CY[j + 1] - CY[j], CR[j], CR[j + 1]);
  }
  function xuLyThem(st, ds, den) {
    var kh = st.kh, i, d, x, y, m, k, ra = [0, 0];
    for (i = st.n; i < den; i++) {
      d = ds[i]; x = d[0] * kh.rw; y = d[1] * kh.rh; st.px = x; st.py = y;
      m = st.rx.length;
` + /* mẫu trùng chỗ (ấn bút tại chỗ): không thêm điểm, chỉ nhận lực mạnh hơn ⇒ chấm một cái ra chấm tròn đủ đậm */ `
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
` + /* ĐUÔI tạm: phần đường tâm từ điểm chốt cuối cùng tới mẫu mới nhất (+ them = điểm nối thêm: đầu bút thật, điểm xem trước, điểm dự đoán). */ `
` + /* noiDuoi NỐI THẲNG vào X / Y / R / L đang có (phải kết thúc ở điểm chốt cuối, hoặc rỗng nếu nét chưa chốt điểm nào) — chạy ở mỗi lượt vẽ nên dùng mảng nháp chung, không cấp mảng mới. */ `
  var DX = [], DY = [], DP = [], DCX = [], DCY = [], DCR = [], DRA = [0, 0];
  function noiDuoi(st, them, X, Y, R, L) {
` + /* chỉ lấy KHÚC CUỐI của mảng mẫu (từ mốc đứng trước đoạn chưa chốt) ⇒ nét dài mấy nghìn mẫu vẫn chỉ tốn vài phần tử */ `
    var s0 = Math.max(0, st.ns - 1), m0 = st.rx.length, nc = st.cx.length - s0, m = 0, i, q;
    for (i = s0; i < m0; i++) { DX[m] = st.rx[i]; DY[m] = st.ry[i]; DP[m] = st.rp[i]; m++; }
    if (them) for (i = 0; i < them.length; i++) if (!m || xa(them[i][0], them[i][1], DX[m - 1], DY[m - 1]) >= SAT) { DX[m] = them[i][0]; DY[m] = them[i][1]; DP[m] = m ? DP[m - 1] : 0.3; m++; }
    if (!m) return;
    for (i = 0; i < m; i++) {
      if (i < nc) { DCX[i] = st.cx[s0 + i]; DCY[i] = st.cy[s0 + i]; DCR[i] = st.cr[s0 + i]; continue; }
` + /* mẫu đầu / cuối NÉT giữ nguyên; mẫu giữa khử rung như lúc chốt (i + s0 = chỉ số thật) */ `
      if (!(i + s0) || i === m - 1) { DCX[i] = DX[i]; DCY[i] = DY[i]; } else { nan(DX, DY, i, m, DRA); DCX[i] = DRA[0]; DCY[i] = DRA[1]; }
      DCR[i] = st.ban * heSo(lucTron(DP, i, m));
    }
    if (!X.length) { X.push(DCX[0]); Y.push(DCY[0]); R.push(DCR[0]); L.push(0); }
` + /* khúc chép bắt đầu ở mốc đứng TRƯỚC đoạn chưa chốt ⇒ đoạn nào cũng có mốc kề phía trước; riêng nét chưa chốt đoạn nào (s0 = 0) thì đoạn 0 lấy mốc đối xứng như doanMoc */ `
    for (i = st.ns - s0; i < m - 1; i++) doanMoc(X, Y, R, L, DCX, DCY, DCR, i, m);
  }
  function duoiTam(st, them) {
    var n = st.X.length, X = n ? [st.X[n - 1]] : [], Y = n ? [st.Y[n - 1]] : [], R = n ? [st.R[n - 1]] : [], L = n ? [st.L[n - 1]] : [];
    noiDuoi(st, them, X, Y, R, L);
` + /* điểm đầu = điểm chốt cuối (đã có trong X / Y của nét) — chỉ để tính tiếp độ dài, xong thì bỏ */ `
    if (n) { X.shift(); Y.shift(); R.shift(); L.shift(); }
    return { X: X, Y: Y, R: R, L: L };
  }
` + /* Nét đang viết: phần đã chốt và đã cách đầu bút đủ xa (hơn đoạn thon cuối + ngưỡng «nét ngắn») thì đem in xuống lớp tĩnh. Trả về chỉ số in tới; −1 = chưa cần. */ `
` + /* it = in khi đã dồn được ít nhất ngần này điểm (mặc định 64). Máy thầy để 160: chữ viết thường không nét nào dài tới đó (đo chữ mẫu cao 28–64 px: nhiều nhất 134 điểm) ⇒ cả nét là MỘT đa giác, */ `
` + /* lúc đang viết và lúc vẽ lại từ vectơ ra cùng điểm ảnh (chỗ hai khúc in chồng mép lên nhau thì viền đậm hơn một chút). */ `
  function mocDong(st, dong, it) {
    var m = st.X.length, den = m - 1, giu = st.ban * 2 * (NGAN_B + THON_CUOI) + 3;
    it = it || 64;
    if (den - dong < it) return -1;
    while (den > dong && st.L[m - 1] - st.L[den] < giu) den--;
    return den - dong >= it ? den : -1;
  }

` + /* ── 3 + 4 · bán kính thon hai đầu, rồi đa giác bao ── */ `
  function vien(st, tu, den, duoi, xong) {
    var o = tu > 0 ? tu - 1 : 0, het = den < 0, c = het ? st.X.length : Math.min(st.X.length, den + 2);
    var X = st.X.slice(o, c), Y = st.Y.slice(o, c), R = st.R.slice(o, c), L = st.L.slice(o, c), n, i, q, s, f, g, tong, co, tD, tC;
    if (het) noiDuoi(st, duoi, X, Y, R, L);
    n = X.length; if (!n) return [];
    tong = L[n - 1]; co = st.ban * 2;
` + /* nét ngắn (dấu chấm, dấu phẩy, dấu thanh): g → 0 ⇒ không thon, giữ đủ bề rộng. Khúc in xuống lớp tĩnh giữa chừng (không tới hết) luôn thuộc nét đã dài ⇒ g = 1. */ `
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
` + /* (ax, ay) hướng TỚI điểm này · (bx, by) hướng RỜI điểm này */ `
      if (i > 0) { ax = X[i] - X[i - 1]; ay = Y[i] - Y[i - 1]; } else { ax = X[1] - X[0]; ay = Y[1] - Y[0]; }
      if (i < N - 1) { bx = X[i + 1] - X[i]; by = Y[i + 1] - Y[i]; } else { bx = ax; by = ay; }
      q = Math.sqrt(ax * ax + ay * ay) || 1; ax /= q; ay /= q;
      q = Math.sqrt(bx * bx + by * by) || 1; bx /= q; by /= q;
      r = R[i]; cham = ax * bx + ay * by;
      if (cham < -0.25 && i > a && i < b) {
` + /* gập gắt (quay đầu bút): hai mép cùng quét nửa vòng qua phía trước ⇒ góc tròn, không hở, không vênh */ `
        nx = -ay; ny = ax;
        for (k = 0; k <= 6; k++) {
          c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6);
          T.push(X[i] + r * (nx * c + ny * s), Y[i] + r * (ny * c - nx * s));
          P.push(X[i] + r * (ny * s - nx * c), Y[i] - r * (nx * s + ny * c));
        }
        continue;
      }
      nx = ax + bx; ny = ay + by; q = Math.sqrt(nx * nx + ny * ny) || 1; x = -ny / q * r; y = nx / q * r;
` + /* đỉnh mép sát đỉnh trước (dưới ~0,45 lần bán kính, và không dưới ~0,55 px) thì bỏ: nét mảnh không sinh thừa đỉnh */ `
      q = Math.max(r * r * 0.2, 0.3);
      m = T.length; nx = X[i] + x - T[m - 2]; ny = Y[i] + y - T[m - 1];
      if (i === a || i === b || nx * nx + ny * ny > q) T.push(X[i] + x, Y[i] + y);
      m = P.length; nx = X[i] - x - P[m - 2]; ny = Y[i] - y - P[m - 1];
      if (i === a || i === b || nx * nx + ny * ny > q) P.push(X[i] - x, Y[i] - y);
    }
    if (muCuoi) {
` + /* đầu bo ở cuối nét: từ mép trái vòng qua phía trước sang mép phải */ `
      ax = X[b] - X[b - 1]; ay = Y[b] - Y[b - 1]; q = Math.sqrt(ax * ax + ay * ay) || 1; nx = -ay / q; ny = ax / q; r = R[b];
      for (k = 1; k < 6; k++) { c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6); T.push(X[b] + r * (nx * c + ny * s), Y[b] + r * (ny * c - nx * s)); }
    }
    for (i = P.length - 2; i >= 0; i -= 2) T.push(P[i], P[i + 1]);
    if (muDau) {
` + /* đầu bo ở đầu nét: từ mép phải vòng qua phía sau về mép trái */ `
      ax = X[a + 1] - X[a]; ay = Y[a + 1] - Y[a]; q = Math.sqrt(ax * ax + ay * ay) || 1; nx = ay / q; ny = -ax / q; r = R[a];
      for (k = 1; k < 6; k++) { c = Math.cos(k * PI / 6); s = Math.sin(k * PI / 6); T.push(X[a] + r * (nx * c + ny * s), Y[a] + r * (ny * c - nx * s)); }
    }
    return T;
  }
  function dungNet(net, kh) { var st = moXuLy(net, kh); xuLyThem(st, net.diem, net.diem.length); return vien(st, 0, -1, null, true); }
  function duongTam(net, kh) { var st = moXuLy(net, kh), D, p = [], i; xuLyThem(st, net.diem, net.diem.length); D = duoiTam(st, null); for (i = 0; i < st.X.length; i++) p.push(st.X[i], st.Y[i]); for (i = 0; i < D.X.length; i++) p.push(D.X[i], D.Y[i]); return p; }
` + /* ── 4 · tô: đường cong bậc hai qua trung điểm các đỉnh (g = ngữ cảnh canvas 2D hoặc Path2D) ── */ `
  function veDaGiac(g, p) {
    var n = p.length >> 1, i, a, b;
    if (n < 3) return;
    g.moveTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2);
    for (i = 1; i <= n; i++) { a = (i % n) * 2; b = ((i + 1) % n) * 2; g.quadraticCurveTo(p[a], p[a + 1], (p[a] + p[b]) / 2, (p[a + 1] + p[b + 1]) / 2); }
    g.closePath();
  }

` + /* ── tẩy theo nét: (x, y) chuẩn hoá, r = bán kính tẩy (px ở màn 1920) ── */ `
  function hop(net) {
    var d = net.diem, h = net._h, i;
    if (!h) { h = [1e9, 1e9, -1e9, -1e9]; for (i = 0; i < d.length; i++) { h[0] = Math.min(h[0], d[i][0]); h[1] = Math.min(h[1], d[i][1]); h[2] = Math.max(h[2], d[i][0]); h[3] = Math.max(h[3], d[i][1]); } net._h = h; }
    return h;
  }
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

` + /* ── sổ nét: mỗi trang (đợt / câu) một mảng nét + hoàn tác / làm lại riêng; mọi thay đổi phát sự kiện ── */ `
  function gon(n) { return { id: n.id, cong: n.cong, mau: n.mau, co: n.co, diem: n.diem }; }
  function sachNet(n, i) {
    var ds = [], j, d;
    if (!n || !n.diem) return null;
    for (j = 0; j < n.diem.length; j++) { d = n.diem[j]; if (d && isFinite(d[0]) && isFinite(d[1])) ds.push([tron(kep(+d[0], 0, 1), CHIA), tron(kep(+d[1], 0, YMAX), CHIA), tron(kep(isFinite(d[2]) ? +d[2] : 0.5, 0, 1), 100), Math.max(0, Math.round(+d[3] || 0))]); }
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
` + /* Một bước = nhóm { net, vt } ghi theo thứ tự GỠ; gắn lại theo thứ tự ngược ⇒ nét về đúng chỗ cũ trong mảng. */ `
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
      batDau: function (mo) { dang = { id: (mo.bang ? 'b_' : '') + id(), cong: mo.cong === 'tay' ? 'tay' : 'but', mau: mo.mau, co: mo.co, diem: mo.diem ? [mo.diem] : [] }; phat({ loai: 'net-moi', net: { id: dang.id, cong: dang.cong, mau: dang.mau, co: dang.co, diem: dang.diem.slice() } }); return dang; },
      themDiem: function (ds) { var i; if (!dang || !ds.length) return; for (i = 0; i < ds.length; i++) dang.diem.push(ds[i]); phat({ loai: 'them-diem', id: dang.id, diem: ds }); },
      ketThuc: ketThuc,
      tro: function (x, y) { if (tai.length) phat({ loai: 'tro', x: tron(kep(x, 0, 1), 1e4), y: tron(kep(y, 0, YMAX), 1e4) }); },
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
` + /* Máy NHẬN: áp một sự kiện vào mảng nét của trang đang xem (sửa tại chỗ, trả lại chính mảng đó). */ `
  function apSuKien(ds, sk) {
    var i, n;
    if (sk.loai === 'trang') { ds.length = 0; for (i = 0; i < sk.net.length; i++) { n = gon(sk.net[i]); n.diem = n.diem.slice(); ds.push(n); } }
    else if (sk.loai === 'net-moi') { n = gon(sk.net); n.diem = n.diem.slice(); ds.splice(sk.vt == null ? ds.length : Math.min(sk.vt, ds.length), 0, n); }
    else if (sk.loai === 'them-diem') { for (i = 0; i < ds.length; i++) if (ds[i].id === sk.id) { ds[i].diem = ds[i].diem.concat(sk.diem); break; } }
    else if (sk.loai === 'xoa') { for (i = ds.length - 1; i >= 0; i--) if (sk.id.indexOf(ds[i].id) >= 0) ds.splice(i, 1); }
    return ds;
  }
  return { khung: khung, diem: diem, apLucGia: apLucGia, heSo: heSo, moXuLy: moXuLy, xuLyThem: xuLyThem, mocDong: mocDong, vien: vien, dungNet: dungNet, duongTam: duongTam, duoiTam: duoiTam, veDaGiac: veDaGiac, chamNet: chamNet, timCham: timCham, hop: hop, laBang: laBang, taoSo: taoSo, apSuKien: apSuKien };
})();
`

/** Bộ máy bút cho app / test: chạy chính chuỗi mà tờ chiếu chạy (một nguồn duy nhất ⇒ máy phát và máy nhận dựng nét y hệt nhau). */
export function taoLoiBut(): LoiBut {
  return new Function(`${JS_LOI_BUT}\nreturn LoiBut;`)() as LoiBut
}
