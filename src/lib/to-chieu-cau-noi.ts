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
// (M6) Tin còn có thể mang `giay` + `duTinh` — số đo giờ thật; chỉ dùng để hiệu chỉnh mô hình giờ, hỏng/ngoài khoảng thì BỎ chứ không chặn lệnh ghi.
import { chuanDuTinh, chuanGiayThuc } from './hieu-chinh-giay-thuc'

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
  /** Tờ chiếu → app (bản vẽ 28/09): thầy bấm THẺ TÊN — xin hồ sơ em của ô `khoa` (kèm `id` để ghép câu trả lời). CHỈ ĐỌC. */
  HO_SO: 'ddh-mc-ho-so',
  /** App → tờ chiếu: hồ sơ em (`hoSo`, số thật từ `/gv/ho-so-len-bang`) hoặc `loi` cho lệnh `HO_SO` cùng `id`. */
  HO_SO_TRA: 'ddh-mc-ho-so-tra',
  /** App / Remote → tờ chiếu: lệnh điều khiển từ xa (gọi lên bảng, bật lời giải, chuyển đợt...) */
  LENH: 'ddh-mc-lenh',
  /** Tờ chiếu → app / Remote: báo trạng thái hiện tại (đợt, pha, lời giải) */
  TRANG_THAI: 'ddh-mc-trang-thai',
  /** Tờ chiếu → app (thầy 05/10): thầy bấm "Thầy chữa" ở ô `khoa` — KHÔNG gọi em lên nữa, câu tính là thầy đã chữa. */
  THAY_CHUA: 'ddh-mc-thay-chua',
  /** App → tờ chiếu: kết quả của `THAY_CHUA` cho ô `khoa` (`kq` 'da_ghi' | 'loi'); cũng gửi lại lúc bắt tay cho ô đã chữa trong phiên. */
  THAY_CHUA_XONG: 'ddh-mc-thay-chua-xong',
  /** Tờ chiếu → app (thầy 05/10, nút X): xin danh sách em đã làm SAI câu của ô `khoa` (kèm `id`). CHỈ ĐỌC. */
  AI_SAI: 'ddh-mc-ai-sai',
  /** App → tờ chiếu: `ds` (em · lúc · nơi · giây) hoặc `loi` cho lệnh `AI_SAI` cùng `id`. */
  AI_SAI_TRA: 'ddh-mc-ai-sai-tra',
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

/** `giayThuc` (M6) chỉ có khi tờ báo được CẢ HAI số hợp lệ (giây thật 20..1800, T dự tính > 0); ngoài khoảng thì BỎ số ấy — lệnh ghi vẫn nhận. */
export type TinDenToChieu =
  | { loai: 'san_sang' }
  | { loai: 'cham'; khoa: string; dat: boolean; giayThuc?: { giay: number; duTinh: number } }
  | { loai: 'ho_so'; khoa: string; id: string }
  | { loai: 'thay_chua'; khoa: string }
  | { loai: 'ai_sai'; khoa: string; id: string }

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
    const giay = chuanGiayThuc(t.giay)
    const duTinh = chuanDuTinh(t.duTinh)
    return giay !== null && duTinh !== null ? { loai: 'cham', khoa: t.khoa, dat: t.dat, giayThuc: { giay, duTinh } } : { loai: 'cham', khoa: t.khoa, dat: t.dat }
  }
  if (t.type === TIN_TO_CHIEU.HO_SO) {
    if (typeof t.khoa !== 'string' || !ctx.khoaHopLe(t.khoa)) return null
    if (typeof t.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(t.id)) return null
    return { loai: 'ho_so', khoa: t.khoa, id: t.id }
  }
  if (t.type === TIN_TO_CHIEU.AI_SAI) {
    if (typeof t.khoa !== 'string' || !ctx.khoaHopLe(t.khoa)) return null
    if (typeof t.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(t.id)) return null
    return { loai: 'ai_sai', khoa: t.khoa, id: t.id }
  }
  if (t.type === TIN_TO_CHIEU.THAY_CHUA) {
    if (typeof t.khoa !== 'string' || !ctx.khoaHopLe(t.khoa)) return null
    return { loai: 'thay_chua', khoa: t.khoa }
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
// Class/thuộc tính mà JS dùng: `.mc-cham[data-khoa][data-cham]`, `.mc-cham-nut[data-kq]`, `.mc-cham-tin`, `body.mc-noi`;
// nút "Thầy chữa" (05/10): `.mc-thay-chua[data-khoa-tc][data-trang]` — thuộc tính RIÊNG để nơi đếm `data-khoa` vẫn thấy mỗi ô một lần.

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

/** NÚT "THẦY CHỮA" của MỘT ô (thầy 05/10, MỌI tờ chiếu): bấm ⇒ không gọi em lên bảng nữa, câu tính là thầy đã chữa — màn đang
 * nghe tờ tự ghi theo loại của nó (chiến dịch: chữa xong câu; đầu giờ: ô "Thầy đã chữa"; Gọi lên bảng / Dạy học: nhãn "Thầy đã chữa").
 * Cùng khoá ô `sbd|qid` với hai nút chấm (cùng lớp kiểm "ô có trên tờ") nhưng lớp RIÊNG và nằm NGOÀI `.mc-cham` — không lẫn vào
 * đường ghi Đạt / Chưa đạt, không đổi bất biến "mỗi ô đúng hai nút chấm". */
export function mangNutThayChua(khoa: string): string {
  return `<span class="mc-thay-chua" data-khoa-tc="${thoatThuocTinh(khoa)}" data-trang="cho"><button type="button" class="mc-thay-chua-nut">Thầy chữa</button><span class="mc-cham-tin" role="status" aria-live="polite"></span></span>`
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
.mc-thay-chua{display:none}
body.mc-noi .mc-thay-chua{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:var(--mc-sans)}
.mc-thay-chua-nut{min-height:36px;padding:0 14px;border:1px solid var(--mc-vien);border-radius:999px;background:transparent;color:var(--mc-muc);font:700 13px var(--mc-sans);cursor:pointer}
.mc-thay-chua-nut[disabled]{opacity:.5;cursor:default}
.mc-thay-chua-xong{padding:4px 12px;border:1px solid var(--mc-vien);border-radius:999px;color:var(--mc-muc);font:700 12px var(--mc-sans)}
.mc-dot[data-thay-chua] .mc-em,.mc-dot[data-thay-chua] .mc-nut-hien-em,.mc-dot[data-thay-chua] .mc-cham{display:none!important}
.mc-dot[data-thay-chua] .mc-cot-lam-bai::before{content:"Thầy chữa";display:flex;align-items:center;justify-content:center;height:100%;min-height:120px;color:var(--mc-nhat);font:800 28px var(--mc-sans)}
@media print{.mc-thay-chua{display:none!important}}
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
  var vungTc = Array.prototype.slice.call(document.querySelectorAll('.mc-thay-chua'));
  if (!ma || (!vung.length && !vungTc.length)) return;
  function bo() {
    vung.concat(vungTc).forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    body.classList.remove('mc-noi');
    try { delete window.__mcHoiHoSo; } catch (x) { window.__mcHoiHoSo = undefined; }
    try { delete window.__mcHoiAiSai; } catch (x) { window.__mcHoiAiSai = undefined; }
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
      // Bản vẽ 28/09 (thầy chốt): thẻ tên mang nhãn "Đạt" / "Chưa đạt" ⇒ báo cả hai kết quả cho lớp bản vẽ (không lưu vào mảnh nút).
      document.dispatchEvent(new CustomEvent('mc-da-cham', { detail: { khoa: khoa, dat: typeof dat === 'boolean' ? dat : null } }));
      return;
    }
    v.setAttribute('data-cham', 'cho');
    nutCua(v).forEach(function (b) { b.disabled = false; });
    tin(v, 'chưa ghi được, bấm lại');
  }
  // THẦY CHỮA (05/10): app ghi xong ⇒ ô này thôi gọi em (ẩn thẻ tên, nút Đạt / Chưa đạt), cột làm bài ghi "Thầy chữa".
  var choTc = {};
  function xongTc(khoa, kq) {
    vungTc.forEach(function (v) {
      if (v.getAttribute('data-khoa-tc') !== khoa || v.getAttribute('data-trang') === 'xong') return;
      if (kq !== 'da_ghi' && v.getAttribute('data-trang') !== 'dang') return;
      if (choTc[khoa]) { clearTimeout(choTc[khoa]); choTc[khoa] = 0; }
      if (kq === 'da_ghi') {
        v.setAttribute('data-trang', 'xong');
        while (v.firstChild) v.removeChild(v.firstChild);
        var s = document.createElement('span');
        s.className = 'mc-thay-chua-xong';
        s.textContent = 'Thầy đã chữa';
        v.appendChild(s);
        var dot = v.closest ? v.closest('.mc-dot') : null;
        if (dot) dot.setAttribute('data-thay-chua', '1');
        document.dispatchEvent(new CustomEvent('mc-thay-chua', { detail: { khoa: khoa } }));
        return;
      }
      v.setAttribute('data-trang', 'cho');
      var b = v.querySelector('.mc-thay-chua-nut'); if (b) b.disabled = false;
      tin(v, 'chưa ghi được, bấm lại');
    });
  }
  function thucThiLenh(lenh, thamSo) {
    if (!lenh) return;
    if (lenh === 'LEN_BANG' || lenh === 'L') {
      if (window.__mcLenh) window.__mcLenh('L');
      else if (window.__mcLenBang) window.__mcLenBang();
    } else if (lenh === 'BAT_LOI_GIAI' || lenh === 'G') {
      if (thamSo && typeof thamSo.mo === 'boolean') {
        if (window.__mcMoLoiGiai) window.__mcMoLoiGiai(thamSo.mo);
        else if (window.__mcBatLoiGiai) window.__mcBatLoiGiai(thamSo.mo);
      } else {
        if (window.__mcLenh) window.__mcLenh('G');
        else if (window.__mcBatLoiGiai) window.__mcBatLoiGiai();
      }
    } else if (lenh === 'CHUYEN_DOT' || lenh === 'DEN') {
      var k = typeof thamSo === 'number' ? thamSo : (thamSo && typeof thamSo.dot === 'number' ? thamSo.dot : 0);
      if (window.__mcDen) window.__mcDen(k);
    } else if (lenh === 'CHAM' || lenh === 'D' || lenh === 'K') {
      var dat = lenh === 'D' ? true : lenh === 'K' ? false : (thamSo && typeof thamSo.dat === 'boolean' ? thamSo.dat : true);
      if (window.__mcLenh) window.__mcLenh(dat ? 'D' : 'K');
    } else if (lenh === 'BUOC_TIEP' || lenh === 'SP') {
      if (window.__mcLenh) window.__mcLenh('SP');
    } else if (lenh === 'XUONG' || lenh === '↓') {
      if (window.__mcLenh) window.__mcLenh('↓');
    } else if (lenh === 'LEN' || lenh === '↑') {
      if (window.__mcLenh) window.__mcLenh('↑');
    }
  }
  function baoTrangThai() {
    var tt = window.__mcTrangThai ? window.__mcTrangThai() : null;
    if (!tt) {
      tt = {
        dot: window.__mcChiSo ? window.__mcChiSo() : 0,
        soDot: window.__mcSoDot ? window.__mcSoDot() : 1,
        pha: document.body.getAttribute('data-pha') || '',
        lgMo: false,
      };
    }
    var msg = { type: '${TIN_TO_CHIEU.TRANG_THAI}', maPhien: ma, trangThai: tt };
    try { window.parent.postMessage(msg, goc); } catch (x) {}
    if (bc) { try { bc.postMessage(msg); } catch (x) {} }
  }
  document.addEventListener('mc-doi-dot', baoTrangThai);
  document.addEventListener('mc-doi-pha', baoTrangThai);
  document.addEventListener('mc-vao-dot', baoTrangThai);
  document.addEventListener('mc-giai-doi', baoTrangThai);
  var bc = null;
  try {
    if (typeof BroadcastChannel !== 'undefined' && ma) {
      bc = new BroadcastChannel('ddh-to-chieu-' + ma);
      bc.onmessage = function (e) {
        var d = e && e.data;
        if (!d || typeof d !== 'object') return;
        if (d.type === '${TIN_TO_CHIEU.LENH}' || d.type === 'mc-lenh') {
          thucThiLenh(d.lenh || d.loai, d.thamSo);
        } else if (d.loai) {
          thucThiLenh(d.loai, d.thamSo);
        }
      };
    }
  } catch (x) {}
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    if (goc !== '*' && e.origin !== goc) return;
    var d = e.data;
    if (!d || typeof d !== 'object' || d.maPhien !== ma) return;
    if (d.type === '${TIN_TO_CHIEU.KET_NOI}') {
      noi = true;
      if (nhip) { clearInterval(nhip); nhip = null; }
      body.classList.add('mc-noi');
      try { document.dispatchEvent(new CustomEvent('mc-noi')); } catch (x) {}
      baoTrangThai();
    } else if (d.type === '${TIN_TO_CHIEU.PHAN_HOI}') {
      xong(String(d.khoa), d.kq === 'da_ghi' ? 'da_ghi' : 'loi', typeof d.dat === 'boolean' ? d.dat : undefined);
    } else if (d.type === '${TIN_TO_CHIEU.DA_GHI}') {
      xong(String(d.khoa), 'da_ghi', typeof d.dat === 'boolean' ? d.dat : undefined);
    } else if (d.type === '${TIN_TO_CHIEU.THAY_CHUA_XONG}') {
      xongTc(String(d.khoa), d.kq === 'da_ghi' ? 'da_ghi' : 'loi');
    } else if (d.type === '${TIN_TO_CHIEU.AI_SAI_TRA}') {
      var cbs = hoiSai[String(d.id)];
      if (cbs) { delete hoiSai[String(d.id)]; cbs(Array.isArray(d.ds) ? d.ds : null, d.loi ? String(d.loi) : '', d.conNua === true); }
    } else if (d.type === '${TIN_TO_CHIEU.HO_SO_TRA}') {
      var cb = hoi[String(d.id)];
      if (cb) { delete hoi[String(d.id)]; cb(d.hoSo && typeof d.hoSo === 'object' ? d.hoSo : null, d.loi ? String(d.loi) : ''); }
    } else if (d.type === '${TIN_TO_CHIEU.LENH}' || d.type === 'mc-lenh') {
      thucThiLenh(d.lenh || d.loai, d.thamSo);
    }
  });
  document.addEventListener('click', function (e) {
    var tc = e.target && e.target.closest ? e.target.closest('.mc-thay-chua-nut') : null;
    if (tc) {
      if (!noi) return;
      var vt = tc.closest('.mc-thay-chua');
      var kt = vt ? vt.getAttribute('data-khoa-tc') : '';
      if (!kt || vt.getAttribute('data-trang') !== 'cho' || choTc[kt]) return;
      vt.setAttribute('data-trang', 'dang');
      tc.disabled = true;
      tin(vt, 'Đang ghi…');
      choTc[kt] = setTimeout(function () { choTc[kt] = 0; xongTc(kt, 'loi'); }, ${GIAY_CHO_PHAN_HOI * 1000});
      gui({ type: '${TIN_TO_CHIEU.THAY_CHUA}', khoa: kt });
      return;
    }
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
    var m = { type: '${TIN_TO_CHIEU.CHAM}', khoa: khoa, dat: nut.getAttribute('data-kq') === '1' };
    // M6: giây thật của đợt tới lúc bấm + T dự tính (tờ chiếu đo, app lọc lại khoảng hợp lệ). Không đo được thì lệnh ghi đi như cũ.
    try {
      var g = window.__mcGiayDot ? window.__mcGiayDot(v) : null;
      if (g && isFinite(g.giay) && isFinite(g.duTinh)) { m.giay = g.giay; m.duTinh = g.duTinh; }
    } catch (x) {}
    gui(m);
  });
  // BẢNG CHI TIẾT EM (bản vẽ 28/09): xin hồ sơ qua app thầy — tờ chiếu không tự gọi máy chủ, không giữ mã bí mật.
  var hoi = {}, soHoi = 0;
  window.__mcHoiHoSo = function (khoa, cb) {
    if (!noi) { cb(null, 'khong_noi'); return; }
    var id = 'h' + (++soHoi);
    hoi[id] = cb;
    gui({ type: '${TIN_TO_CHIEU.HO_SO}', khoa: String(khoa), id: id });
    setTimeout(function () { if (hoi[id]) { var f = hoi[id]; delete hoi[id]; f(null, 'het_gio'); } }, 20000);
  };
  // AI SAI CÂU NÀY (nút X, thầy 05/10): xin qua app thầy — tờ không tự gọi máy chủ.
  var hoiSai = {}, soHoiSai = 0;
  window.__mcHoiAiSai = function (khoa, cb) {
    if (!noi) { cb(null, 'khong_noi'); return; }
    var id = 's' + (++soHoiSai);
    hoiSai[id] = cb;
    gui({ type: '${TIN_TO_CHIEU.AI_SAI}', khoa: String(khoa), id: id });
    setTimeout(function () { if (hoiSai[id]) { var f = hoiSai[id]; delete hoiSai[id]; f(null, 'het_gio'); } }, 20000);
  };
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
