// CẦU NỐI TỜ MÁY CHIẾU ↔ MÀN GIÁO VIÊN (GĐ 6 làn giáo viên, mốc d, 19/09/2026).
//
// Thầy chốt: "Cho lên máy chiếu luôn" — nút Đạt / Chưa đạt ngay trên tờ máy chiếu (M3, 19/09: nhãn nút là "Chưa đạt", không phải
// "Không đạt" — thầy chốt trên bản vẽ; đường ghi vẫn là `dat: false`).
//
// TỜ CHIẾU LÀ MỘT TRANG HTML ĐỘC LẬP (`html-may-chieu.ts`), nằm trong `<iframe srcDoc>` của
// `KhungXemPhieu` (cùng nguồn với app, KHÔNG sandbox). Nó không có hàm ghi nào cả: bấm nút chỉ gửi một
// tin về khung cha (`window.parent.postMessage`), và MÀN GIÁO VIÊN mới là nơi gọi `ghiKetQua` — MỘT đường
// ghi duy nhất, dùng chung khoá chống ghi đôi `sbd|qid` với bảng buổi chữa.
//
// Tệp này giữ ĐÚNG những thứ cả hai bên phải thống nhất — tên tin, số giây chờ, cách kiểm tin đến — và
// nằm riêng để màn hình nạp tĩnh được mà không kéo cả `html-may-chieu.ts` (tệp lớn, vẫn nạp động) vào gói chính.
//
// BỐN LỚP KIỂM TRA cho mọi tin gửi tới màn giáo viên (không nhận lệnh ghi từ cửa sổ lạ):
//   1. NGUỒN: tin phải đến từ đúng khung iframe tờ chiếu ta đang mở (so `event.source`, không tin chữ);
//   2. GỐC: `event.origin` là gốc của chính app (khung srcdoc thừa hưởng gốc của cha; vài trình duyệt báo 'null');
//   3. MÃ PHIÊN: một chuỗi ngẫu nhiên sinh lúc mở tờ chiếu, chỉ nằm trong HTML của tờ ấy — cửa sổ khác không biết;
//   4. NỘI DUNG: `khoa` phải là một ô (em × câu) CÓ TRÊN tờ đang chiếu; kết quả phải là boolean thật.
// Màn hình KHÔNG tin `sbd`/`qid`/chuyên đề trong tin: nó tra lại từ bảng của chính nó theo `khoa`.

export const TIN_TO_CHIEU = {
  /** Tờ chiếu → app: "em ở đây, có ai nghe không" (gửi lặp cho tới khi có `KET_NOI`, phòng app nghe chậm). */
  SAN_SANG: 'ddh-mc-san-sang',
  /** App → tờ chiếu: "nghe rồi" — từ đây tờ chiếu mới hiện nút. */
  KET_NOI: 'ddh-mc-ket-noi',
  /** Tờ chiếu → app: thầy bấm Đạt / Chưa đạt ở một ô. */
  CHAM: 'ddh-mc-cham',
  /** App → tờ chiếu: kết quả ghi của một lệnh `CHAM` — `kq` là 'da_ghi' hoặc 'loi'; kèm `dat` (boolean) khi 'da_ghi' để tờ ăn mừng. */
  PHAN_HOI: 'ddh-mc-phan-hoi',
  /** App → tờ chiếu: ô này đã được ghi từ chỗ khác (bảng buổi chữa) — khoá nút; kèm `dat` khi vừa ghi xong (không kèm khi chỉ nhắc lại ô đã ghi từ trước). */
  DA_GHI: 'ddh-mc-da-ghi',
} as const

/** Quá số giây này mà app không trả lời thì tờ chiếu coi là LỖI và mở lại nút. */
export const GIAY_CHO_PHAN_HOI = 8

/** Bắt tay: gửi `SAN_SANG` mỗi `NHIP_BAT_TAY_MS`, tối đa `SO_LAN_BAT_TAY` lần rồi bỏ hẳn nút. */
export const SO_LAN_BAT_TAY = 15
export const NHIP_BAT_TAY_MS = 400

export type KetQuaGhiToChieu = 'da_ghi' | 'loi'

/** Khoá của một ô em × câu — CHUNG với bảng buổi chữa (`ketQuaBuoi`, `daGhiKhoa`). */
export function khoaToChieu(sbd: string, qid: string): string {
  return `${sbd}|${qid}`
}

/** Mã phiên ngẫu nhiên, sinh MỖI LẦN mở tờ chiếu. Không phải bí mật mật mã (tờ chiếu cùng nguồn với app),
 * chỉ để cửa sổ/khung khác không đoán ra được mà giả lệnh ghi. */
export function taoMaPhienChieu(): string {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto
  if (c?.getRandomValues) {
    return Array.from(c.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}

export type TinDenToChieu = { loai: 'san_sang' } | { loai: 'cham'; khoa: string; dat: boolean }

export interface BoiCanhKiemTin {
  /** Mã phiên của tờ chiếu đang mở. */
  maPhien: string
  /** `window.location.origin` của app. */
  gocApp: string
  /** `source` có đúng là khung iframe tờ chiếu đang mở không. */
  laKhungToChieu: (source: unknown) => boolean
  /** `khoa` có phải một ô CÓ TRÊN tờ đang chiếu không. */
  khoaHopLe: (khoa: string) => boolean
}

/** Kiểm một tin đến. Trả `null` với MỌI tin không đủ bốn lớp kiểm tra — bên nhận bỏ qua, không báo lỗi
 * (báo lỗi cho cửa sổ lạ là tiết lộ có ai đang nghe). */
export function kiemTinToChieu(e: { data: unknown; origin: string; source: unknown }, ctx: BoiCanhKiemTin): TinDenToChieu | null {
  if (!ctx.maPhien) return null
  const d = e.data
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null
  const t = d as Record<string, unknown>
  if (t.maPhien !== ctx.maPhien) return null
  if (e.origin !== ctx.gocApp && e.origin !== 'null') return null
  if (!ctx.laKhungToChieu(e.source)) return null
  if (t.type === TIN_TO_CHIEU.SAN_SANG) return { loai: 'san_sang' }
  if (t.type === TIN_TO_CHIEU.CHAM) {
    if (typeof t.khoa !== 'string' || !ctx.khoaHopLe(t.khoa)) return null
    if (typeof t.dat !== 'boolean') return null
    return { loai: 'cham', khoa: t.khoa, dat: t.dat }
  }
  return null
}

/** Gốc dùng khi gửi lại cho khung tờ chiếu: khung báo 'null' thì không nêu được gốc, dùng '*'. */
export function gocGuiLai(originCuaTin: string): string {
  return originCuaTin === 'null' ? '*' : originCuaTin
}

// ───────────────────────── PHÍA TỜ CHIẾU (trang HTML độc lập) ─────────────────────────
//
// HỢP ĐỒNG VỚI MARKUP CỦA TỜ CHIẾU — thiết kế nào của tờ cũng chỉ cần giữ đúng bấy nhiêu:
//   · mỗi ô em × câu có MỘT mảnh `mangNutChamToChieu(khoaToChieu(sbd, qid))` ở chỗ thầy muốn (mép ô, không đè đề,
//     không vào chỗ em viết);
//   · `<body data-cau-noi="MÃ PHIÊN">` (mã đã qua `chuanMaPhien`);
//   · chèn `<style>${CSS_CAU_NOI_TO_CHIEU}</style>` và `<script>${jsCauNoiToChieu()}</script>` (sau script của tờ);
//   · không có mã phiên thì KHÔNG chèn gì cả — tờ y như chưa có cầu nối.
// Class/thuộc tính mà JS dùng: `.mc-cham[data-khoa][data-cham]`, `.mc-cham-nut[data-kq]`, `.mc-cham-tin`, `body.mc-noi`.

/** Mã phiên đưa vào thuộc tính HTML: chỉ giữ `A-Za-z0-9_-`. Rỗng = không có cầu nối. */
export function chuanMaPhien(ma: unknown): string {
  return typeof ma === 'string' ? ma.replace(/[^A-Za-z0-9_-]/g, '') : ''
}

function thoatThuocTinh(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Mảnh markup hai nút của MỘT ô. Trung tính: nhãn "Đạt" / "Chưa đạt" chỉ nằm trên NÚT (trước khi bấm);
 * sau khi ghi mảnh này bị thay bằng nhãn "Đã ghi" (cả hai kết quả y hệt), kết quả không được lưu lại ở đâu trong mảnh này.
 * (Riêng "Đạt" còn kích hoạt ăn mừng trên thẻ tên — việc của tờ chiếu, xem sự kiện `mc-ghi-nhan` ở `jsCauNoiToChieu`.) */
export function mangNutChamToChieu(khoa: string): string {
  return `<span class="mc-cham" data-khoa="${thoatThuocTinh(khoa)}" data-cham="cho"><button type="button" class="mc-cham-nut" data-kq="1">Đạt</button><button type="button" class="mc-cham-nut" data-kq="0">Chưa đạt</button><span class="mc-cham-tin" role="status" aria-live="polite"></span></span>`
}

/** CSS CỦA HAI NÚT — chỉ chèn khi tờ có `cauNoi`. Chỉ giữ LUẬT HIỆN/ẨN và một diện mạo trung tính dự phòng (viền xám, cùng kiểu cho
 * cả hai nút, không xanh/đỏ); tờ chiếu M3 vẽ lại nút bằng luật riêng, đặc hiệu hơn (`giao-dien-to-chieu.ts`). */
export const CSS_CAU_NOI_TO_CHIEU = `
.mc-cham{display:none}
body.mc-noi .mc-cham{display:inline-flex;align-items:center;gap:8px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end;font-family:var(--mc-sans)}
body.mc-noi .mc-giai-vung{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
body.mc-noi .mc-giai-vung .mc-giai{flex:0 0 100%;margin-top:0}
.mc-cham-nut{min-height:36px;padding:0 14px;border:1px solid var(--mc-vien);border-radius:999px;background:transparent;color:var(--mc-nhat);font:700 13px var(--mc-sans);cursor:pointer}
.mc-cham-nut:hover:not([disabled]){background:var(--mc-xanh-nen);color:var(--mc-muc)}
.mc-cham-nut[disabled]{opacity:.5;cursor:default}
.mc-cham-tin{color:var(--mc-nhat);font:600 12px var(--mc-sans)}
.mc-cham-xong{padding:4px 12px;border:1px solid var(--mc-vien);border-radius:999px;color:var(--mc-nhat);font:700 12px var(--mc-sans)}
@media print{.mc-cham{display:none!important}}
`

/** JS CỦA HAI NÚT — chỉ chèn khi tờ có `cauNoi`. Giao thức và số giây ở đầu tệp này.
 *
 * KHÔNG lưu kết quả Đạt / Chưa đạt trong mảnh này: thầy bấm là gửi đi, phản hồi về thì ô chỉ còn nhãn "Đã ghi" (cả hai kết
 * quả y hệt nhau). Riêng khi app báo `dat: true` thì phát sự kiện `mc-ghi-nhan` để tờ ăn mừng. Bấm đúp bị chặn bằng trạng
 * thái `data-cham` (cho → dang → xong). */
export function jsCauNoiToChieu(): string {
  return `
(function () {
  var body = document.body;
  var ma = body ? body.getAttribute('data-cau-noi') : '';
  var vung = Array.prototype.slice.call(document.querySelectorAll('.mc-cham'));
  if (!ma || !vung.length) return;
  function bo() {
    vung.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    body.classList.remove('mc-noi');
  }
  // MỞ RIÊNG (tệp đã lưu, mở lại hôm khác, tab riêng): không có app ở trên để ghi ⇒ bỏ hẳn hai nút, tờ y như thường.
  if (window.parent === window) { bo(); return; }
  var goc = '*';
  try { goc = window.parent.location.origin; } catch (x) { bo(); return; }
  if (!goc || goc === 'null') goc = '*';
  var noi = false, lan = 0, nhip = null, cho = {};
  function gui(m) { m.maPhien = ma; try { window.parent.postMessage(m, goc); } catch (x) {} }
  function tim(khoa) {
    for (var k = 0; k < vung.length; k++) if (vung[k].getAttribute('data-khoa') === khoa) return vung[k];
    return null;
  }
  function nutCua(v) { return Array.prototype.slice.call(v.querySelectorAll('.mc-cham-nut')); }
  function tin(v, chu) { var t = v.querySelector('.mc-cham-tin'); if (t) t.textContent = chu; }
  // dat (true/false/vắng): kết quả app báo về cùng lệnh ghi. Chỉ true mới ăn mừng; false hoặc vắng thì không có hiệu ứng nào.
  function xong(khoa, kq, dat) {
    var v = tim(khoa);
    if (!v) return;
    var trang = v.getAttribute('data-cham');
    if (trang === 'xong') return;
    if (kq !== 'da_ghi' && trang !== 'dang') return;
    if (cho[khoa]) { clearTimeout(cho[khoa]); cho[khoa] = 0; }
    if (kq === 'da_ghi') {
      v.setAttribute('data-cham', 'xong');
      while (v.firstChild) v.removeChild(v.firstChild);
      var s = document.createElement('span');
      s.className = 'mc-cham-xong';
      s.textContent = 'Đã ghi';
      v.appendChild(s);
      // Tờ chiếu (thẻ tên xanh + thần thú nhảy) nghe sự kiện này. KHÔNG lưu kết quả ở đâu: chỉ phát cho lần này.
      if (dat === true) document.dispatchEvent(new CustomEvent('mc-ghi-nhan', { detail: { khoa: khoa, dat: true, vung: v } }));
      return;
    }
    v.setAttribute('data-cham', 'cho');
    nutCua(v).forEach(function (b) { b.disabled = false; });
    tin(v, 'chưa ghi được, bấm lại');
  }
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    if (goc !== '*' && e.origin !== goc) return;
    var d = e.data;
    if (!d || typeof d !== 'object' || d.maPhien !== ma) return;
    if (d.type === '${TIN_TO_CHIEU.KET_NOI}') {
      noi = true;
      if (nhip) { clearInterval(nhip); nhip = null; }
      body.classList.add('mc-noi');
    } else if (d.type === '${TIN_TO_CHIEU.PHAN_HOI}') {
      xong(String(d.khoa), d.kq === 'da_ghi' ? 'da_ghi' : 'loi', d.dat === true);
    } else if (d.type === '${TIN_TO_CHIEU.DA_GHI}') {
      xong(String(d.khoa), 'da_ghi', d.dat === true);
    }
  });
  document.addEventListener('click', function (e) {
    var nut = e.target && e.target.closest ? e.target.closest('.mc-cham-nut') : null;
    if (!nut || !noi) return;
    var v = nut.closest('.mc-cham');
    if (!v) return;
    var khoa = v.getAttribute('data-khoa');
    // Chỉ nhận khi ô đang rảnh: bấm đúp, ô đã ghi, ô đang chờ phản hồi đều bị bỏ.
    if (!khoa || v.getAttribute('data-cham') !== 'cho' || cho[khoa]) return;
    v.setAttribute('data-cham', 'dang');
    nutCua(v).forEach(function (b) { b.disabled = true; });
    tin(v, 'Đang ghi…');
    // Không có phản hồi trong ${GIAY_CHO_PHAN_HOI} giây = LỖI: mở lại nút để thầy bấm lại.
    cho[khoa] = setTimeout(function () { cho[khoa] = 0; xong(khoa, 'loi'); }, ${GIAY_CHO_PHAN_HOI * 1000});
    gui({ type: '${TIN_TO_CHIEU.CHAM}', khoa: khoa, dat: nut.getAttribute('data-kq') === '1' });
  });
  gui({ type: '${TIN_TO_CHIEU.SAN_SANG}' });
  nhip = setInterval(function () {
    if (noi) { clearInterval(nhip); nhip = null; return; }
    lan++;
    if (lan >= ${SO_LAN_BAT_TAY}) { clearInterval(nhip); nhip = null; bo(); return; }
    gui({ type: '${TIN_TO_CHIEU.SAN_SANG}' });
  }, ${NHIP_BAT_TAY_MS});
})();
`
}
