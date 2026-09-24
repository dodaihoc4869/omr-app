// BỐ CỤC TỜ MÁY CHIẾU — ĐO THẬT, KHÔNG BAO GIỜ CUỘN (M2, 19/09/2026).
//
// Thầy chốt: "câu dài thì tự động lấy 2/3 bảng để hiển thị (làm lại thuật toán chỗ này cho chuẩn, để phải hiển
// thị đầy đủ trên bảng KHÔNG PHẢI CUỘN bất kể câu nào). 1/3 bảng còn lại để học sinh lên làm bài."
//
// BẢN CŨ ĐOÁN bằng ký tự (`laCauDai`: >280 ký tự, ≥4 dòng, có ảnh…) rồi để nửa bảng `overflow-y:auto` — đoán sai là
// chữ tràn và thầy phải cuộn giữa giờ. Chiều cao chữ thật phụ thuộc phông, bề ngang màn, công thức, ảnh: chỉ ĐO mới đúng.
//
// THUẬT TOÁN — mỗi đợt LEO BẬC cho tới khi vùng đề VỪA (không `scrollHeight > clientHeight`, không tràn ngang):
//   bậc 1  ĐÔI      hai em, mỗi em ½ bảng: đề trên, vùng làm bài dưới (≥ 30% chiều cao)   [chỉ ghép đôi khi CẢ HAI vừa]
//   bậc 2  ĐƠN 2/3  một em: đề chiếm 2/3 bề ngang, 1/3 bên phải là thẻ tên + vùng làm bài
//   bậc 3  CHIA CỘT bậc 2 + phương án/ý chia 2 cột, hình co dần tới 40% cỡ gốc
//   bậc 4  CO CHỮ   bậc 3 + cỡ chữ giảm từng 1 px từ cỡ chuẩn xuống SÀN (24 px ở 1920 px bề ngang, quy đổi theo bề ngang)
//   bậc 5  TOÀN BẢNG không còn vùng làm bài (em làm ở bảng phụ); vẫn vừa thì thôi, chưa vừa thì co tiếp tới đáy tuyệt đối và CẢNH BÁO
// Đợt ĐÔI mà đo lại không vừa (bậc 1) thì TÁCH thành hai đợt đơn, cộng thời gian, ghi chú cho thầy.
//
// HAI PHẦN, MỘT NGUỒN HẰNG SỐ (`BO_CUC_TO_CHIEU`):
//   · `jsBoCuc()` — mã CHẠY TRONG TỜ CHIẾU (đo bằng DOM thật của trình duyệt). Đây là chân lý;
//   · `uocLuongBac…` (tệp `uoc-luong-bo-cuc.ts`) — ước lượng THUẦN lúc xếp buổi, hiệu chỉnh bằng phép đo thật,
//     sai lệch ≤ 1 bậc, để biết trước câu nào ghép đôi được. Tờ chiếu luôn đo lại nên ước lượng sai không làm tràn chữ.
//
// HỢP ĐỒNG VỚI MARKUP (thiết kế nào của tờ cũng phải giữ): mỗi ô em = `.mc-nua` chứa `.mc-em` (thẻ tên), `.mc-vung-de`
// (VÙNG ĐO — bọc `.mc-than` và `.mc-giai` phủ lên), `.mc-giai-vung`, `.mc-trang`; đợt = `.mc-dot`; toàn bộ trong `#mc-ray`.

export const BO_CUC_TO_CHIEU = {
  /** Cỡ chữ đề chuẩn = tỉ lệ này × bề ngang khung (30 px ở 1280 px, đúng bản vẽ đã chốt). Nhân hệ số cỡ chữ thầy chọn. */
  CO_CHUAN_TL_RONG: 30 / 1280,
  /** SÀN cỡ chữ đề: 24 px ở 1920 px bề ngang, quy đổi theo bề ngang (16 px ở 1280 px). */
  CO_SAN_TL_RONG: 24 / 1920,
  /** ĐÁY TUYỆT ĐỐI khi bậc 5 ở sàn vẫn chưa vừa (kèm cảnh báo cho thầy): 18 px ở 1920 px. */
  CO_DAY_TL_RONG: 18 / 1920,
  /** Mỗi bước co chữ, px. */
  BUOC_CO_PX: 1,
  /** Hình co dần tới tỉ lệ này của cỡ gốc; mỗi bước giảm `BUOC_HINH`. */
  HINH_TOI_THIEU: 0.4,
  BUOC_HINH: 0.1,
  /** Bậc 1: vùng làm bài phải còn ≥ tỉ lệ này của chiều cao đợt. */
  LAM_BAI_TOI_THIEU_TL: 0.3,
  /** Dung sai đo (px) — tránh làm tròn nửa điểm ảnh báo tràn oan. */
  DUNG_SAI_PX: 1,
  /** Chờ bấy nhiêu ms sau sự kiện đổi cỡ/ảnh tải xong rồi mới đo lại (gộp nhiều sự kiện một lần đo). */
  CHO_DO_LAI_MS: 60,
  /** Số lần tối đa đo lại một đợt cho một lượt xếp (chốt an toàn cho vòng lặp — thực tế < 60). */
  TOI_DA_LAN_DO: 200,
} as const

export type BacBoCuc = 1 | 2 | 3 | 4 | 5

/** Tên hiển thị của từng bậc — dùng chung cảnh báo lúc xếp buổi và ghi chú trên tờ. */
export const TEN_BAC_BO_CUC: Record<BacBoCuc, string> = {
  1: 'hai em, mỗi em nửa bảng',
  2: 'một em, đề chiếm 2/3 bảng',
  3: 'một em, 2/3 bảng, phương án chia cột và hình thu nhỏ',
  4: 'một em, 2/3 bảng, chữ co nhỏ để vừa',
  5: 'toàn bảng, em làm ở bảng phụ',
}

export interface CauHinhLeoBac {
  /** Cỡ chữ chuẩn (px) — điểm bắt đầu. */
  coChuan: number
  /** Sàn cỡ chữ (px). */
  coSan: number
  /** Đáy tuyệt đối (px), thấp hơn sàn — chỉ dùng ở bậc 5. */
  coDay: number
  buocCo: number
  hinhToiThieu: number
  buocHinh: number
  /** 1 = đợt có HAI em (thử bậc 1: mỗi em nửa bảng); 2 = một em (leo từ bậc 2 — nửa bảng bỏ trống chỉ phí chỗ). */
  batDauOBac: 1 | 2
  /** Bậc 3 có khác bậc 2 không (câu có phương án/ý hoặc hình để chia cột/co hình). Không khác thì bỏ qua bậc 3. */
  coBac3: boolean
  /** Số lần đo tối đa. */
  toiDaLanDo: number
}

export interface KetQuaLeoBac {
  bac: BacBoCuc
  co: number
  hinh: number
  /** Đã vừa vùng đề chưa. `false` chỉ khi ngay cả đáy tuyệt đối ở bậc 5 vẫn tràn. */
  vua: boolean
  /** Cỡ chữ thấp hơn SÀN (chỉ xảy ra ở bậc 5). */
  duoiSan: boolean
  soLanDo: number
}

/** THUẬT TOÁN LEO BẬC — HÀM THUẦN, MỘT NGUỒN: vừa được ước lượng lúc xếp buổi (`uoc-luong-bo-cuc.ts`) gọi trực tiếp,
 * vừa được CHÉP NGUYÊN VĂN vào tờ chiếu (`JS_LEO_BAC` = `leoBacBoCuc.toString()`) để chạy với DOM thật. Vì vậy hàm này TỰ
 * CHỨA: không dùng biến/hằng/import nào ngoài `vua` và `cfg`, không đọc DOM, không đồng hồ.
 *
 * `vua(bac, co, hinh)`: áp bố cục đó rồi trả `true` nếu MỌI vùng đề đều không tràn.
 * Thứ tự thử là thứ tự ưu tiên của thầy: bố cục càng thấp bậc càng tốt, chữ càng to càng tốt. */
export function leoBacBoCuc(vua: (bac: number, co: number, hinh: number) => boolean, cfg: CauHinhLeoBac): KetQuaLeoBac {
  let dem = 0
  const thu = (bac: number, co: number, hinh: number) => {
    dem++
    return vua(bac, co, hinh)
  }
  const ra = (bac: BacBoCuc, co: number, hinh: number, ok: boolean, duoi?: boolean): KetQuaLeoBac => ({ bac, co, hinh, vua: ok, duoiSan: !!duoi, soLanDo: dem })
  const co0 = Math.max(cfg.coChuan, cfg.coSan)
  const xong = () => dem >= cfg.toiDaLanDo
  // bậc 1: chỉ khi đợt đang là dạng ĐÔI / nửa bảng
  if (cfg.batDauOBac === 1 && thu(1, co0, 1)) return ra(1, co0, 1, true)
  // bậc 2: đơn 2/3 + 1/3
  if (thu(2, co0, 1)) return ra(2, co0, 1, true)
  const hMin = cfg.hinhToiThieu
  // bậc 3: chia cột phương án/ý, hình co dần (chữ giữ nguyên cỡ chuẩn)
  if (cfg.coBac3) {
    for (let h = 1; h > hMin - 1e-9 && !xong(); h = Math.round((h - cfg.buocHinh) * 100) / 100) {
      if (thu(3, co0, h)) return ra(3, co0, h, true)
    }
  }
  // NẾU VẪN KHÔNG VỪA (Bậc 1, 2, 3 ở cỡ chuẩn đều tràn)
  // Bỏ hẳn Bậc 4 (co chữ) và Bậc 5 co chữ — luôn giữ cỡ chuẩn!
  // Đẩy sang Bậc 5 (toàn bảng) với cỡ chuẩn, chấp nhận không vừa để CSS xử lý cuộn.
  const hCo = cfg.coBac3 ? hMin : 1
  return ra(5, co0, hCo, false, false)
}

/** Bản chữ của `leoBacBoCuc` để nhúng vào tờ chiếu (gán vào biến cùng tên). */
export const JS_LEO_BAC = `var leoBacBoCuc = (${leoBacBoCuc.toString()});`

// ───────────────────────── CSS ─────────────────────────
/** CSS BỐ CỤC. Xếp SAU CSS cũ của tờ nên thắng về độ ưu tiên; chỉ có hiệu lực khi JS đã thêm `body.mc-bc` (tờ không
 * có JS thì vẫn là bố cục cũ, và tờ in `@media print` giữ nguyên). Không có luật nào cho phép CUỘN vùng đề. */
export const CSS_BO_CUC = `
/* ── BỐ CỤC ĐO THẬT (M2) ── */
body.mc-do *, body.mc-do *::before, body.mc-do *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
body.mc-bc .mc-dot { box-sizing: border-box; padding: 10px; gap: 10px; position: relative; }
body.mc-bc .mc-nua { overflow: hidden; padding: 0; gap: 10px; min-height: 0; min-width: 0; border: 0; }
body.mc-bc .mc-dot + .mc-dot .mc-trai, body.mc-bc .mc-dot + .mc-dot-don .mc-nua { border-left: 0; }
body.mc-bc .mc-trai { border-right: 0; }
body.mc-bc .mc-nua .mc-em { position: static; margin: 0; flex: none; border-radius: 16px; border: 1px solid var(--mc-vien); }
body.mc-bc .mc-vung-de { position: relative; flex: 0 1 auto; min-height: 0; min-width: 0; overflow: hidden; box-sizing: border-box; padding: 18px 22px; border-radius: 16px; background: var(--mc-nen); border: 1px solid var(--mc-vien); }
body.mc-bc .mc-vung-de .mc-than { padding-top: 0; }
body.mc-bc .mc-vung-de .mc-de { font-size: var(--mc-co, 28px); line-height: 1.45; }
body.mc-bc .mc-vung-de .mc-pa { font-size: calc(var(--mc-co, 28px) * .93); line-height: 1.4; }
body.mc-bc .mc-vung-de .mc-ngan { font-size: calc(var(--mc-co, 28px) * .6); }
body.mc-bc .mc-vung-de img { max-width: 100%; width: auto; height: auto; max-height: calc(30vh * var(--mc-hinh, 1)); object-fit: contain; }
body.mc-bc .mc-vung-de img.mc-anh-pa { max-height: calc(12vh * var(--mc-hinh, 1)); }
body.mc-bc .mc-vung-de .q-bang-cuon { overflow: visible; }
body.mc-bc .mc-vung-de .q-bang { width: auto; max-width: 100%; font-size: calc(var(--mc-co, 28px) * .72); }
/* lời giải PHỦ lên đúng vùng đề (có cuộn riêng — lời giải là phụ lục, không phải đề) */
body.mc-bc .mc-vung-de > .mc-giai { position: absolute; inset: 0; margin: 0; padding: 14px 20px; overflow-y: auto; background: var(--mc-nen); z-index: 6; box-sizing: border-box; }
body.mc-bc .mc-vung-de > .mc-giai[hidden] { display: none; }
body.mc-bc .mc-giai-vung { margin: 0; flex: none; }
/* BẬC 1: hai em, mỗi em nửa bảng — vùng làm bài co giãn nhưng KHÔNG dưới ngưỡng */
body.mc-bc .mc-nua { display: flex; flex-direction: column; }
body.mc-bc .mc-nua .mc-trang { flex: 1 0 var(--mc-lam-bai-min, 30%); min-height: 0; margin: 0; border: 0; border-radius: 16px; box-shadow: inset 0 0 0 2px var(--mc-vien); }
/* BẬC 2, 3, 4: đề 2/3 bên trái; bên phải: thẻ tên trên, vùng làm bài dưới */
body.mc-bc .mc-dot.mc-dot-don { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto minmax(0, 1fr); }
body.mc-bc .mc-dot-don > .mc-nua { display: contents; }
body.mc-bc .mc-dot-don .mc-vung-de { grid-column: 1; grid-row: 1 / span 2; align-self: stretch; }
body.mc-bc .mc-dot-don .mc-em { grid-column: 2; grid-row: 1; }
body.mc-bc .mc-dot-don .mc-nut-hien-em { grid-column: 2; grid-row: 1; align-self: start; z-index: 3; }
body.mc-bc .mc-dot-don .mc-cot-lam-bai { grid-column: 2; grid-row: 2; padding: 0; border: 0; border-radius: 16px; box-shadow: inset 0 0 0 2px var(--mc-vien); background: transparent; }
body.mc-bc .mc-dot-don .mc-giai-vung { grid-column: 2; grid-row: 2; align-self: end; justify-self: stretch; padding: 12px; z-index: 3; }
body.mc-bc .mc-dot-don .mc-trang, body.mc-bc .mc-dot-don > .mc-trong { display: none; }
/* phương án / ý chia 2 cột ở bậc 3, 4, 5 */
body.mc-bc .mc-b3 .mc-auto-options, body.mc-bc .mc-b4 .mc-auto-options, body.mc-bc .mc-b5 .mc-auto-options { --mc-option-cols: 2 !important; }
body.mc-bc .mc-b3 .mc-ds-pa:not(.mc-auto-options), body.mc-bc .mc-b4 .mc-ds-pa:not(.mc-auto-options), body.mc-bc .mc-b5 .mc-ds-pa:not(.mc-auto-options) { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 22px; }
/* BẬC 5: toàn bảng, không còn vùng làm bài */
body.mc-bc .mc-dot.mc-b5 { display: grid; grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
body.mc-bc .mc-b5 > .mc-nua { display: contents; }
body.mc-bc .mc-b5 .mc-em { grid-column: 1; grid-row: 1; }
body.mc-bc .mc-b5 .mc-vung-de { grid-column: 1; grid-row: 2; }
body.mc-bc .mc-b5 .mc-nut-hien-em { grid-column: 1; grid-row: 1; align-self: start; z-index: 3; }
body.mc-bc .mc-b5 .mc-cot-lam-bai, body.mc-bc .mc-b5 .mc-trang, body.mc-bc .mc-b5 > .mc-trong { display: none; }
body.mc-bc .mc-b5 .mc-giai-vung { grid-column: 1; grid-row: 1; justify-self: end; align-self: center; padding: 0 16px; z-index: 3; }
body.mc-bc .mc-b5 .mc-vung-de { overflow-y: auto !important; }
/* Khi bấm lên bảng (pha="goi"), mc-b5 biến thành 2/3 bảng y hệt mc-dot-don, VÀ cho phép cuộn */
body[data-pha="goi"].mc-bc .mc-dot.mc-b5 { grid-template-columns: 2fr 1fr; grid-template-rows: auto minmax(0, 1fr); }
body[data-pha="goi"].mc-bc .mc-b5 .mc-vung-de { grid-column: 1; grid-row: 1 / span 2; align-self: stretch; overflow-y: auto !important; }
body[data-pha="goi"].mc-bc .mc-b5 .mc-em { grid-column: 2; grid-row: 1; }
body[data-pha="goi"].mc-bc .mc-b5 .mc-nut-hien-em { grid-column: 2; grid-row: 1; align-self: start; z-index: 3; }
body[data-pha="goi"].mc-bc .mc-b5 .mc-cot-lam-bai { display: block; grid-column: 2; grid-row: 2; padding: 0; border: 0; border-radius: 16px; box-shadow: inset 0 0 0 2px var(--mc-vien); background: transparent; }
body[data-pha="goi"].mc-bc .mc-b5 .mc-giai-vung { grid-column: 2; grid-row: 2; align-self: end; justify-self: stretch; padding: 12px; z-index: 3; }
body[data-pha="goi"].mc-bc .mc-b5 .mc-trang { display: block; flex: 1 0 var(--mc-lam-bai-min, 30%); min-height: 0; margin: 0; border: 0; border-radius: 16px; box-shadow: inset 0 0 0 2px var(--mc-vien); }
/* Nếu đợt Bậc 5 đang ở chế độ CHỜ (full board) và có hình/bảng -> Chia đôi bảng: chữ bên trái, hình/bảng bên phải */
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: row; column-gap: 32px; }
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .mc-de,
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .mc-ds-pa,
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .mc-ngan,
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .mc-pa { grid-column: 1; }
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .mc-anh,
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .q-bang-cuon,
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > table,
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .ex-demo,
body[data-pha="cho"].mc-bc .mc-b5 .mc-than:has(.mc-anh, .q-bang-cuon, table, .ex-demo) > .ex-original { grid-column: 2; margin-top: 0; }
/* ghi chú cho thầy (đợt tự tách, chữ ở đáy, toàn bảng): nằm trong đợt làm NGUỒN, KHÔNG vẽ ở đó (không lấn đề, không đổi bề cao vùng đo);
   script chính chép nó lên dòng phụ của thanh trên khi đợt ấy đang hiện. */
.mc-ghi-chu { display: none; }
body.mc-bc .mc-dot:not(.mc-dot-don) > .mc-cot-lam-bai { display: none; }
@media print { body.mc-bc .mc-nua, body.mc-bc .mc-vung-de { overflow: visible; } .mc-ghi-chu { display: none; } }
`

// ───────────────────────── JS TRONG TỜ ─────────────────────────
/** MÃ ĐO BỐ CỤC chạy trong tờ chiếu. Nhúng SAU script chính của tờ (`JS_MAY_CHIEU`) vì cần các nút/dòng đợt đã có,
 * và báo cho script chính biết khi số đợt đổi (tách đợt) bằng sự kiện `mc-doi-dot` trên `document`. */
export function jsBoCuc(): string {
  const B = BO_CUC_TO_CHIEU
  return `
(function () {
  var ray = document.getElementById('mc-ray');
  if (!ray) return;
  var body = document.body;
  ${JS_LEO_BAC}
  var TL_CHUAN = ${B.CO_CHUAN_TL_RONG}, TL_SAN = ${B.CO_SAN_TL_RONG}, TL_DAY = ${B.CO_DAY_TL_RONG};
  var CFG_CO = { buocCo: ${B.BUOC_CO_PX}, hinhToiThieu: ${B.HINH_TOI_THIEU}, buocHinh: ${B.BUOC_HINH}, toiDaLanDo: ${B.TOI_DA_LAN_DO} };
  var LAM_BAI_TL = ${B.LAM_BAI_TOI_THIEU_TL}, DUNG_SAI = ${B.DUNG_SAI_PX}, CHO_MS = ${B.CHO_DO_LAI_MS};
  body.classList.add('mc-bc');
  var dangDo = false, hen = null, daTach = 0, idTach = 0;

  function ds(x, sel) { return Array.prototype.slice.call(x.querySelectorAll(sel)); }
  function nuaThat(dot) { return ds(dot, '.mc-nua').filter(function (n) { return !n.classList.contains('mc-trong') && n.querySelector('.mc-vung-de'); }); }
  function tran(v) { return v.scrollHeight > v.clientHeight + DUNG_SAI || v.scrollWidth > v.clientWidth + DUNG_SAI; }
  function vua(dot) { return ds(dot, '.mc-vung-de').every(function (v) { return !tran(v); }); }
  function rong() { return ray.clientWidth || window.innerWidth || 1280; }
  function heSo() { var s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mc-scale')); return s > 0 ? s : 1; }

  /** Bảo đảm đợt có cấu trúc ĐƠN (2fr/1fr) khi bậc ≥ 2; bậc 1 trả về dạng nửa bảng nếu đợt vốn là đợt đôi. */
  function dangDon(dot, don) {
    if (don) {
      dot.classList.add('mc-dot-don');
      if (!dot.querySelector('.mc-cot-lam-bai')) {
        var cot = document.createElement('section');
        cot.className = 'mc-cot-lam-bai';
        cot.setAttribute('data-tao', '1');
        cot.setAttribute('aria-label', 'Bảng để học sinh lên làm');
        var trang = dot.querySelector('.mc-trang');
        if (trang && trang.getAttribute('data-nhan')) cot.setAttribute('data-nhan', trang.getAttribute('data-nhan'));
        dot.appendChild(cot);
      }
    } else if (dot.getAttribute('data-goc-don') !== '1') {
      dot.classList.remove('mc-dot-don');
    }
  }

  /** TRẢ MỘT ĐỢT VỀ NGUYÊN TRẠNG lúc dựng: mỗi lượt đo bắt đầu từ đây nên KHÔNG phụ thuộc lịch sử (tách nhầm lúc
   * phông chưa tải xong thì lượt đo sau sẽ ghép lại). */
  function veNguyenTrang(dot) {
    dot.classList.remove('mc-b1', 'mc-b2', 'mc-b3', 'mc-b4', 'mc-b5');
    if (dot.getAttribute('data-goc-don') !== '1') dot.classList.remove('mc-dot-don');
    ds(dot, ':scope > .mc-cot-lam-bai[data-tao]').forEach(function (c) { c.remove(); });
    ds(dot, ':scope > .mc-ghi-chu').forEach(function (g) { g.remove(); });
    ['data-bac', 'data-co', 'data-vua'].forEach(function (a) { dot.removeAttribute(a); });
    dot.style.removeProperty('--mc-co');
    dot.style.removeProperty('--mc-hinh');
    dot.style.removeProperty('--mc-lam-bai-min');
  }

  /** GHÉP LẠI các đợt đã tách ở lượt đo trước (đúng cặp, đúng thứ tự) và trả data-seconds về giá trị gốc. */
  function hopLai() {
    var doi = 0;
    ds(ray, ':scope > .mc-dot[data-tach-thu="2"]').forEach(function (b) {
      var a = b.previousElementSibling;
      if (!a || a.getAttribute('data-tach-thu') !== '1' || a.getAttribute('data-tach-id') !== b.getAttribute('data-tach-id')) return;
      ds(b, ':scope > .mc-nua').forEach(function (n) { a.appendChild(n); });
      var goc = a.getAttribute('data-seconds-goc');
      if (goc !== null) { if (goc) a.setAttribute('data-seconds', goc); else a.removeAttribute('data-seconds'); }
      ['data-tach', 'data-tach-id', 'data-tach-thu', 'data-seconds-goc'].forEach(function (x) { a.removeAttribute(x); });
      b.remove();
      doi++;
    });
    return doi;
  }

  function ap(dot, bac, co, hinh) {
    dot.classList.remove('mc-b1', 'mc-b2', 'mc-b3', 'mc-b4', 'mc-b5');
    dangDon(dot, bac >= 2);
    dot.classList.add('mc-b' + bac);
    dot.style.setProperty('--mc-co', co + 'px');
    dot.style.setProperty('--mc-hinh', String(hinh));
    dot.style.setProperty('--mc-lam-bai-min', Math.round(dot.clientHeight * LAM_BAI_TL) + 'px');
    void dot.offsetHeight; // ép trình duyệt bố cục lại NGAY, trước khi đọc scrollHeight
    // Số cột phương án (1/2/4) phụ thuộc bề ngang ô — đổi bậc là đổi bề ngang, phải chia lại cột TRƯỚC khi đo.
    if (window.__mcFitOptions) { window.__mcFitOptions(dot); void dot.offsetHeight; }
  }

  function ghiChu(dot, chu, kieu) {
    var g = dot.querySelector(':scope > .mc-ghi-chu');
    if (!chu) { if (g) g.remove(); return; }
    if (!g) { g = document.createElement('div'); g.className = 'mc-ghi-chu'; dot.appendChild(g); }
    g.textContent = chu;
    g.setAttribute('data-kieu', kieu || '');
  }

  function coBac3(dot) {
    return !!dot.querySelector('.mc-vung-de .mc-ds-pa, .mc-vung-de img, .mc-vung-de table');
  }

  function cauHinh(dot, batDau) {
    var w = rong(), k = heSo();
    var san = Math.round(w * TL_SAN * 10) / 10;
    return { coChuan: Math.max(Math.round(w * TL_CHUAN * k * 10) / 10, san), coSan: san, coDay: Math.round(w * TL_DAY * 10) / 10,
      buocCo: CFG_CO.buocCo, hinhToiThieu: CFG_CO.hinhToiThieu, buocHinh: CFG_CO.buocHinh, batDauOBac: batDau, coBac3: coBac3(dot), toiDaLanDo: CFG_CO.toiDaLanDo };
  }

  function danhSoDot() {
    ds(ray, '.mc-dot').forEach(function (d, i) { d.setAttribute('data-dot', String(i + 1)); });
    document.dispatchEvent(new CustomEvent('mc-doi-dot'));
  }

  /** TÁCH đợt đôi thành hai đợt đơn (thời gian mỗi đợt = giờ của chính câu ấy). */
  function tach(dot) {
    var hai = nuaThat(dot);
    if (hai.length < 2) return null;
    var moi = document.createElement('div');
    moi.className = 'mc-dot';
    moi.setAttribute('data-tach', '1');
    moi.appendChild(hai[1]);
    dot.parentNode.insertBefore(moi, dot.nextSibling);
    var maCap = String(++idTach);
    dot.setAttribute('data-tach', '1');
    dot.setAttribute('data-tach-id', maCap);
    dot.setAttribute('data-tach-thu', '1');
    dot.setAttribute('data-seconds-goc', dot.getAttribute('data-seconds') || '');
    moi.setAttribute('data-tach-id', maCap);
    moi.setAttribute('data-tach-thu', '2');
    [dot, moi].forEach(function (d) {
      var n = nuaThat(d)[0];
      var g = n ? n.getAttribute('data-giay') : null;
      if (g) d.setAttribute('data-seconds', g); else d.removeAttribute('data-seconds');
    });
    daTach++;
    return moi;
  }

  function boCucMotDot(dot) {
    var nua = nuaThat(dot);
    if (!nua.length) return;
    if (!dot.hasAttribute('data-goc-don')) dot.setAttribute('data-goc-don', dot.classList.contains('mc-dot-don') ? '1' : '0');
    if (nua.length >= 2) {
      // ĐỢT ĐÔI: chỉ ghép khi CẢ HAI vừa ở bậc 1 (cỡ chuẩn) — không thì tách.
      var k = cauHinh(dot, 1);
      ap(dot, 1, k.coChuan, 1);
      if (vua(dot)) { dot.setAttribute('data-bac', '1'); dot.setAttribute('data-co', String(k.coChuan)); ghiChu(dot, ''); return; }
      var moi = tach(dot);
      if (moi) { boCucMotDot(dot); boCucMotDot(moi); }
      return;
    }
    // MỘT EM (đợt đơn, đợt đôi lẻ, hoặc đợt vừa tách): không có bạn ghép nên nửa bảng chỉ phí chỗ — leo từ bậc 2.
    var cfg = cauHinh(dot, 2);
    var kq = leoBacBoCuc(function (bac, co, hinh) { ap(dot, bac, co, hinh); return vua(dot); }, cfg);
    ap(dot, kq.bac, kq.co, kq.hinh);
    dot.setAttribute('data-bac', String(kq.bac));
    dot.setAttribute('data-co', String(kq.co));
    dot.setAttribute('data-vua', kq.vua ? '1' : '0');
    if (!kq.vua) ghiChu(dot, 'Câu này quá dài để vừa bảng — cân nhắc chia hai đợt hoặc phát đề in', 'canh-bao');
    else if (kq.duoiSan) ghiChu(dot, 'Câu rất dài — chữ nhỏ hơn mức khuyến nghị', 'canh-bao');
    else if (kq.bac === 5) ghiChu(dot, 'Câu dài — cả bảng cho đề; em làm ở bảng phụ', '');
    else if (dot.getAttribute('data-tach') === '1') ghiChu(dot, 'Đợt này tách ra vì hai câu không vừa một bảng', '');
    else ghiChu(dot, '');
  }

  function chay() {
    if (dangDo) return;
    if (!ray.clientHeight || !ray.clientWidth) return; // khung đang ẩn: đợi ResizeObserver/resize gọi lại
    dangDo = true;
    body.classList.add('mc-do');
    var an = ds(ray, '.mc-em[hidden]');
    an.forEach(function (e) { e.hidden = false; });
    var giaiMo = ds(ray, '.mc-giai:not([hidden])');
    giaiMo.forEach(function (g) { g.hidden = true; }); // lời giải đang mở phủ lên vùng đề: gỡ tạm cho đo đúng
    var nuaGiai = ds(ray, '.mc-nua.mc-giai-mo'); // đợt đôi đang mở lời giải chiếm cả nửa bảng: trả nửa bảng về bố cục đo trước khi đo
    nuaGiai.forEach(function (n) { n.classList.remove('mc-giai-mo'); });
    var truoc = daTach;
    var doiSo = 0;
    try {
      // MỖI LƯỢT ĐO ĐI TỪ NGUYÊN TRẠNG: ghép lại đợt đã tách, trả mọi đợt về cấu trúc lúc dựng, rồi mới đo.
      doiSo += hopLai();
      var dsDot = ds(ray, ':scope > .mc-dot').filter(function (d) { return !d.classList.contains('mc-dot-da'); });
      dsDot.forEach(function (d) { if (!d.hasAttribute('data-goc-don')) d.setAttribute('data-goc-don', d.classList.contains('mc-dot-don') ? '1' : '0'); veNguyenTrang(d); });
      dsDot.forEach(boCucMotDot);
    } finally {
      giaiMo.forEach(function (g) { g.hidden = false; });
      nuaGiai.forEach(function (n) { n.classList.add('mc-giai-mo'); });
      an.forEach(function (e) { e.hidden = true; });
      body.classList.remove('mc-do');
      dangDo = false;
    }
    if (daTach !== truoc || doiSo) danhSoDot();
    body.setAttribute('data-bo-cuc', 'xong');
    document.dispatchEvent(new CustomEvent('mc-bo-cuc-xong'));
  }

  function doiLai() {
    if (hen) clearTimeout(hen);
    hen = setTimeout(function () { hen = null; chay(); }, CHO_MS);
  }

  window.addEventListener('resize', doiLai);
  document.addEventListener('fullscreenchange', doiLai);
  document.addEventListener('webkitfullscreenchange', doiLai);
  var co = document.getElementById('mc-size');
  if (co) co.addEventListener('change', doiLai);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(doiLai);
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(function () { requestAnimationFrame(doiLai); }); // sau lần chia cột phương án đầu tiên của script chính
  ray.addEventListener('load', doiLai, true); // ảnh tải xong đổi chiều cao đề
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(doiLai).observe(ray);
  window.__mcBoCuc = { chay: chay, doiLai: doiLai, leo: leoBacBoCuc };
  chay();
})();
`
}
