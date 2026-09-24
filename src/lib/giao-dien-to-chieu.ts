// GIAO DIỆN TỜ MÁY CHIẾU LÊN BẢNG (M3, 19/09/2026) — dựng theo ba bản vẽ thầy đã chốt ("Chốt thiết kế lên bảng"):
//   ChieuHaiEm.dc.html (hai em, mỗi em 1/2 bảng) · ChieuCauDai.dc.html (câu dài: đề 2/3, thẻ tên + vùng làm bài 1/3)
//   · ChieuGoiTen.dc.html (màn gọi tên đầu đợt + trạng thái ăn mừng).
//
// Ý TƯỞNG "TẮT SÁNG": chiếu lên bảng trắng thật, nên chỗ nào tối (#15181c) là máy chiếu gần như không phát sáng — bảng trắng
// còn nguyên để em cầm bút viết, mực rõ, không chói mắt. Chỗ sáng chỉ là những tấm "giấy ấm" (#f4efe4): thẻ tên và đề bài.
// Vì thế vùng làm bài KHÔNG bao giờ có chữ sáng lớn: chỉ một nhãn mờ và hai nút nhỏ.
//
// TẾ NHỊ TRƯỚC LỚP (luật cứng của thầy): tờ KHÔNG chiếu lý do gọi em (`viSao`), không chiếu tình trạng bài tập về nhà của em
// (cũ có nhãn "Ở NHÀ LÀM SAI"), không có chữ/màu đỏ cạnh tên em. Nút chấm: "Đạt" / "Chưa đạt" trung tính; ghi xong chỉ còn "Đã ghi".
// Chỉ "Đạt" có ăn mừng.
//
// CHUYỂN ĐỘNG: TRONG LÚC ĐỌC ĐỀ KHÔNG CÓ GÌ CHUYỂN ĐỘNG. Chỉ có: màn gọi tên đầu đợt (2,5 s) và ăn mừng khi Đạt (1,5 s).
// `prefers-reduced-motion` tắt hết (và bỏ luôn màn gọi tên). Không thư viện, không mạng, không emoji.
//
// TỆP NÀY CHỈ CÓ CSS + HẰNG SỐ + BẢNG MÀU HỆ. Markup ở `html-may-chieu.ts`; hành vi (gọi tên, pha LÀM BÀI / CHỮA, ăn mừng) ở
// `JS_MAY_CHIEU` cùng tệp. CSS này xếp SAU `CSS_BO_CUC` (bố cục đo thật M2) nên thắng về độ ưu tiên; nó chỉ đổi DIỆN MẠO, KHÔNG
// đổi hợp đồng bố cục của M2 (`.mc-nua > .mc-em / .mc-vung-de / .mc-giai-vung / .mc-trang`).

export const GIAO_DIEN_TO_CHIEU = {
  /** Màn gọi tên đầu mỗi đợt: hiện bấy nhiêu ms rồi thu về thẻ tên (bấm phím/chạm để bỏ qua). */
  GOI_TEN_MS: 10000,
  /** Thu màn gọi tên về thẻ tên nhỏ: bấy nhiêu ms bay. */
  BAY_VE_THE_MS: 850,
  /** Thần thú ăn mừng khi Đạt: bấy nhiêu ms rồi đứng yên. */
  AN_MUNG_MS: 1500,
  /** Màu nền thẻ tên khi Đạt và chữ trên đó. */
  MUNG_NEN: '#c4eed0',
  MUNG_CHU: '#072100',
  /** Nền bảng "tắt sáng", giấy ấm, chữ, chữ phụ — đúng bản vẽ. */
  NEN_BANG: '#15181c',
  GIAY: '#f4efe4',
  CHU: '#22262b',
  PHU: '#5b6168',
  /** Cỡ chữ thẻ tên = tỉ lệ × bề ngang màn (30 px ở 1280). Tên trên màn gọi tên: 44 px ở 1280. */
  TEN_THE_TL_RONG: 30 / 1280,
  TEN_GOI_TL_RONG: 44 / 1280,
} as const

/** Màu HÀO QUANG theo hệ của thần thú (`he` = `PETS[i].element` ở `game/than-thu-v2/core.ts`): "r,g,b". Hệ lạ → màu ấm mặc định. */
export const MAU_HAO_QUANG_THEO_HE: Record<string, string> = {
  'Đất': '180,130,62',
  'Nước': '43,166,208',
  'Lửa': '241,99,59',
  'Khí': '175,203,206',
  'Đức tin': '65,101,183',
  'Tình yêu': '224,114,163',
  'Lòng biết ơn': '171,158,89',
  'Sự sáng ý thức': '171,164,224',
}
export const MAU_HAO_QUANG_MAC_DINH = '244,162,97'

/** "r,g,b" của hào quang cho một hệ. Chỉ trả chuỗi trong bảng (không bao giờ chèn chữ lạ vào thuộc tính `style`). */
export function mauHaoQuang(he: string | undefined): string {
  // hasOwnProperty: `he` là chữ từ máy chủ — "__proto__", "constructor"… không được lọt vào thuộc tính style qua nguyên mẫu của đối tượng
  return typeof he === 'string' && Object.prototype.hasOwnProperty.call(MAU_HAO_QUANG_THEO_HE, he) ? MAU_HAO_QUANG_THEO_HE[he] : MAU_HAO_QUANG_MAC_DINH
}

/** Diện mạo hai nút Đạt / Chưa đạt + nhãn "Đã ghi" — CHỈ chèn khi tờ có cầu nối (không cầu nối thì tờ không có `mc-cham` nào, kể cả trong CSS).
 * Cùng một kiểu cho cả hai nút: nền mờ trên bảng tối, chữ giấy ấm; không xanh/đỏ. */
export const CSS_GIAO_DIEN_NUT_CHAM = `
body.mc .mc-cham-nut{height:clamp(32px,3.12vw,56px);min-height:0;padding:0 clamp(12px,1.25vw,24px);border:0;border-radius:999px;background:var(--mc-bang-nut);color:var(--mc-bang-chu);font:600 clamp(12px,1.17vw,22px)/1 var(--mc-sans);cursor:pointer}
body.mc .mc-cham-nut:hover:not([disabled]){background:rgba(244,239,228,.24);color:var(--mc-bang-chu)}
body.mc .mc-cham-tin{color:var(--mc-bang-phu);font:600 clamp(11px,1vw,18px) var(--mc-sans)}
body.mc .mc-cham-xong{padding:0 clamp(10px,1vw,18px);height:clamp(28px,2.6vw,46px);display:inline-flex;align-items:center;border:0;border-radius:999px;background:var(--mc-bang-nut);color:var(--mc-bang-phu);font:600 clamp(11px,1vw,18px) var(--mc-sans)}
body.mc-noi .mc-cham{margin-left:0}
body.mc-bc .mc-giai-mo .mc-cham-nut{background:var(--mc-chu);color:var(--mc-giay)}
body.mc-bc .mc-giai-mo .mc-cham-xong,body.mc-bc .mc-giai-mo .mc-cham-tin{background:color-mix(in srgb,var(--mc-chu) 12%,transparent);color:var(--mc-phu)}
`

export const CSS_GIAO_DIEN_TO_CHIEU = `
/* ═══ GIAO DIỆN MỚI (M3) — ba bản vẽ đã chốt ═══ */
:root{--mc-bang:#15181c;--mc-bang-chu:#f4efe4;--mc-bang-phu:rgba(244,239,228,.55);--mc-bang-vien:rgba(244,239,228,.22);--mc-bang-nut:rgba(244,239,228,.14);
  --mc-giay:#f4efe4;--mc-chu:#22262b;--mc-phu:#5b6168;--mc-nhan:#0b57d0;--mc-chip:#d3e3fd;--mc-chip-chu:#041e49;--mc-the:#e7e1d3;
  --mc-thanh-nen:#22262b;--mc-lam-nen:#c4eed0;--mc-lam-chu:#072100;--mc-chua-nen:#c2e7ff;--mc-chua-chu:#001d35;--mc-qua-nen:#fdd663;--mc-qua-chu:#3b2f00;
  --mc-mung-nen:#c4eed0;--mc-mung-chu:#072100}
:root[data-projector]{color-scheme:light}
/* Bốn kiểu giấy (giữ nguyên bốn GIÁ TRỊ cũ của ô chọn để máy đã nhớ lựa chọn vẫn chạy); nền bảng luôn tối. */
:root[data-projector="matte-light"]{--mc-giay:#f4efe4;--mc-chu:#22262b;--mc-phu:#5b6168;--mc-nhan:#0b57d0;--mc-chip:#d3e3fd;--mc-chip-chu:#041e49;--mc-the:#e7e1d3}
:root[data-projector="soft"]{--mc-giay:#e6e1d3;--mc-chu:#1f2429;--mc-phu:#545b62;--mc-nhan:#0b4fb8;--mc-chip:#c7d8f2;--mc-chip-chu:#041e49;--mc-the:#d8d2c3}
:root[data-projector="matte-dark"]{--mc-giay:#30353a;--mc-chu:#efe9dc;--mc-phu:#b5bbc1;--mc-nhan:#a8c7fa;--mc-chip:#1f3a5f;--mc-chip-chu:#d3e3fd;--mc-the:#3b4148;color-scheme:dark}
:root[data-projector="dark"]{--mc-giay:#23282d;--mc-chu:#f4efe4;--mc-phu:#bfc5cb;--mc-nhan:#a8c7fa;--mc-chip:#1b3556;--mc-chip-chu:#d3e3fd;--mc-the:#2f353b;color-scheme:dark}
/* Cầu nối với luật cũ (lời giải, ô đáp án, bảng…) vẫn đọc các biến --mc-nen/--mc-muc…: nay chúng là màu GIẤY. */
:root[data-projector]{--mc-nen:var(--mc-giay);--mc-muc:var(--mc-chu);--mc-nhat:var(--mc-phu);--mc-vien:color-mix(in srgb,var(--mc-chu) 16%,transparent);--mc-xanh:var(--mc-nhan);--mc-xanh-nen:var(--mc-chip)}
:root[data-projector] body.mc,:root[data-projector^="matte-"] body.mc{background:var(--mc-bang)!important;background-image:none!important;color:var(--mc-bang-chu)}
body.mc-bc .mc-dot{background:var(--mc-bang)}
body.mc .mc-nua{color:var(--mc-chu)}

/* ── THẺ TÊN: giấy ấm, thần thú có hào quang theo hệ, tên to, "thú · cấp · lần lên bảng", chip số câu ── */
body.mc .mc-em,body.mc-bc .mc-nua .mc-em{position:static;display:grid;grid-template-columns:clamp(46px,5.94vw,116px) minmax(0,1fr) auto;grid-template-rows:auto auto;align-items:center;column-gap:clamp(8px,1.1vw,20px);row-gap:2px;
  margin:0;padding:clamp(4px,.62vw,12px) clamp(10px,1.4vw,26px) clamp(4px,.62vw,12px) clamp(4px,.62vw,12px);border:0;border-radius:clamp(14px,1.72vw,30px);background:var(--mc-giay);color:var(--mc-chu);box-shadow:none;justify-content:normal}
body.mc .mc-em-trai,body.mc .mc-em-hang1,body.mc .mc-em .mc-phu,body.mc .mc-em .mc-thu{display:contents}
body.mc .mc-em .mc-thu-anh{grid-column:1;grid-row:1 / span 2;justify-self:center;align-self:center;position:relative;width:100%;max-width:clamp(44px,5.6vw,108px);aspect-ratio:1;height:auto;object-fit:contain;border-radius:50%;animation:none;
  background:radial-gradient(circle,rgba(var(--mc-he,244,162,97),.55) 0%,rgba(var(--mc-he,244,162,97),0) 70%)}
body.mc .mc-em .mc-thu-trong{background:radial-gradient(circle,rgba(var(--mc-he,244,162,97),.35) 0%,rgba(var(--mc-he,244,162,97),0) 70%)}
body.mc .mc-em .mc-ten{grid-column:2;grid-row:1;font:700 clamp(20px,2.34vw,46px)/1.1 var(--mc-sans);letter-spacing:0;color:var(--mc-chu);overflow-wrap:anywhere}
body.mc .mc-em:not(:has(.mc-thu)) .mc-ten{grid-column:1 / span 2}
body.mc .mc-em .mc-thu-chu{grid-column:2;grid-row:2;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .45em;min-width:0;font:500 clamp(12px,1.25vw,24px)/1.3 var(--mc-sans);color:var(--mc-phu)}
body.mc .mc-em .mc-thu-ten,body.mc .mc-em .mc-thu-cap{margin:0;font:inherit;color:inherit}
body.mc .mc-em .mc-thu-ten,body.mc .mc-em .mc-thu-cap,body.mc .mc-em .mc-lan{white-space:nowrap}
body.mc .mc-em .mc-thu-ten:after{content:"·";margin-left:.45em}
body.mc .mc-em .mc-thu-cap:has(+ .mc-lan):after{content:"·";margin-left:.45em}
body.mc .mc-em .mc-thu-cap b{font-weight:500}
body.mc .mc-em .mc-thu-hinh{display:none}
/* "Em đã làm câu này chưa": hàng thứ ba của thẻ tên (chỉ thấy khi thẻ đã hiện). Nhãn viên thuốc; đúng = xanh lá, sai = cam (không đỏ), còn lại = xám. Cỡ chữ đọc được từ cuối lớp. */
body.mc .mc-em .mc-ls{grid-column:2 / -1;grid-row:3;display:flex;flex-wrap:wrap;align-items:center;gap:2px clamp(8px,.9vw,18px);margin-top:clamp(2px,.35vw,8px);min-width:0}
body.mc .mc-em:not(:has(.mc-thu)) .mc-ls{grid-column:1 / -1}
body.mc .mc-em .mc-ls-chu{font:700 clamp(13px,1.5vw,29px)/1.25 var(--mc-sans);padding:.08em .62em;border-radius:999px;background:var(--mc-the);color:var(--mc-chu);white-space:nowrap}
body.mc .mc-em .mc-ls-dung .mc-ls-chu{background:var(--mc-lam-nen);color:var(--mc-lam-chu)}
body.mc .mc-em .mc-ls-sai .mc-ls-chu{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}
body.mc .mc-em .mc-ls-phu{font:500 clamp(12px,1.22vw,24px)/1.3 var(--mc-sans);color:var(--mc-phu)}
body.mc .mc-em .mc-thu-so,body.mc .mc-em .mc-sbd,body.mc .mc-em .mc-btvn{display:none}
body.mc .mc-em .mc-lan{color:inherit;font:inherit}
body.mc .mc-em .mc-em-phu{grid-column:2;grid-row:2;font:500 clamp(12px,1.25vw,24px)/1.3 var(--mc-sans);color:var(--mc-phu)}
body.mc .mc-em .mc-cau-so{grid-column:3;grid-row:1 / span 2;align-self:center;padding:clamp(3px,.47vw,9px) clamp(8px,1.1vw,20px);border-radius:999px;background:var(--mc-chip);color:var(--mc-chip-chu);font:700 clamp(13px,1.4vw,26px)/1.2 var(--mc-sans);white-space:nowrap}
body.mc .mc-em .mc-em-phu ~ .mc-cau-so,body.mc .mc-em:not(:has(.mc-thu)) .mc-cau-so{grid-column:3}
/* Đợt đơn (câu chiếm 2/3): thẻ tên gọn ở cột phải, chip "Câu N" chuyển sang dòng đầu của thẻ đề (như bản vẽ) */
body.mc .mc-de-dau{display:none}
body.mc-bc .mc-dot-don .mc-de-dau{display:flex;flex-wrap:wrap;align-items:center;gap:clamp(6px,.8vw,14px);margin:0 0 clamp(6px,1vw,16px);font-family:var(--mc-sans)}
body.mc-bc .mc-dot-don .mc-de-so{padding:clamp(3px,.47vw,9px) clamp(8px,1.1vw,20px);border-radius:999px;background:var(--mc-chip);color:var(--mc-chip-chu);font:700 clamp(13px,1.4vw,26px)/1.2 var(--mc-sans)}
body.mc-bc .mc-dot-don .mc-de-phan{padding:clamp(3px,.47vw,9px) clamp(8px,1.1vw,20px);border-radius:999px;background:var(--mc-the);color:var(--mc-phu);font:600 clamp(12px,1.25vw,24px)/1.2 var(--mc-sans)}
body.mc-bc .mc-dot-don .mc-em{grid-template-columns:clamp(46px,5.94vw,116px) minmax(0,1fr)}
body.mc-bc .mc-dot-don .mc-em .mc-cau-so{display:none}
body.mc-bc .mc-dot-don .mc-em .mc-ten{font-size:clamp(18px,2.03vw,40px)}
/* trang đáp án giữ tiêu đề dạng khối */
body.mc .mc-da-trang .mc-em{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:clamp(10px,1.4vw,24px) clamp(14px,1.8vw,30px)}
body.mc .mc-da-trang .mc-em .mc-phu{display:flex;gap:10px;align-items:center;font:500 clamp(12px,1.25vw,22px) var(--mc-sans);color:var(--mc-phu)}
body.mc .mc-da-trang .mc-em .mc-cau-so{grid-column:auto;grid-row:auto}

/* ── ĐỀ BÀI: giấy ấm, chữ có chân, ký hiệu phương án xanh ── */
body.mc-bc .mc-vung-de{border:0;border-radius:clamp(14px,1.72vw,30px);padding:clamp(12px,1.72vw,30px) clamp(14px,1.9vw,34px);background:var(--mc-giay);color:var(--mc-chu)}
body.mc-bc .mc-vung-de .mc-de,body.mc-bc .mc-vung-de .mc-pa,body.mc-bc .mc-vung-de .mc-pa-chu,body.mc-bc .mc-vung-de .mc-ds-pa{color:var(--mc-chu)}
body.mc .mc-ky{width:auto;min-height:0;background:transparent;color:var(--mc-nhan);font:700 1em var(--mc-sans);text-align:left;border-radius:0}
body.mc .mc-ky:after{content:"."}
body.mc-bc .mc-vung-de .mc-ngan{color:var(--mc-phu)}
/* lời giải: giấy ấm, đè lên đúng vùng đề; cỡ chữ do JS co dần (--mc-co-giai) từ cỡ đề của đợt xuống sàn trước khi phải cuộn */
body.mc-bc .mc-vung-de>.mc-giai{background:var(--mc-giay);border-radius:inherit;padding-bottom:clamp(56px,5.6vw,92px)}
body.mc-bc .mc-vung-de>.mc-giai,body.mc-bc .mc-vung-de>.mc-giai .sol-box{font-size:var(--mc-co-giai,var(--mc-co,28px))}
/* đợt đôi mở lời giải: lấy cả nửa bảng dưới thẻ tên (vùng làm bài tạm ẩn); đợt đơn đã cao suốt bảng nên không cần */
body.mc-bc .mc-dot:not(.mc-dot-don) .mc-nua.mc-giai-mo .mc-vung-de{flex:1 1 0}
body.mc-bc .mc-dot:not(.mc-dot-don) .mc-nua.mc-giai-mo .mc-trang{display:none}
/* hàng nút nằm ĐÈ lên tờ giấy của lời giải ⇒ đảo màu (nền chữ, chữ nền) để vẫn thấy */
body.mc-bc .mc-nua.mc-giai-mo .mc-giai-vung .mc-nut-giai{background:var(--mc-chu);color:var(--mc-giay)}
body.mc .mc-giai .sol-box{background:transparent;color:var(--mc-chu)}

/* ── VÙNG LÀM BÀI: TẮT SÁNG. Nhãn mờ ở góc, KHÔNG chữ sáng lớn. Nút nhỏ ở đáy. ── */
body.mc-bc .mc-trang,body.mc-bc .mc-cot-lam-bai{position:relative;border:0;border-radius:clamp(14px,1.72vw,30px);background:transparent;box-shadow:inset 0 0 0 2px var(--mc-bang-vien);margin:0;overflow:hidden}
body.mc-bc .mc-trang:before,body.mc-bc .mc-cot-lam-bai:before{content:attr(data-nhan);position:absolute;left:clamp(10px,1.4vw,26px);right:40%;bottom:clamp(10px,1.3vw,22px);font:600 clamp(11px,1.25vw,20px)/1.3 var(--mc-sans);color:var(--mc-bang-phu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.mc-bc .mc-dot-don .mc-cot-lam-bai:before{right:clamp(10px,1.4vw,26px);bottom:clamp(60px,6.2vw,100px)}
body.mc-bc .mc-dot:not(.mc-dot-don) .mc-giai-vung{position:absolute;right:clamp(8px,1.1vw,18px);bottom:clamp(8px,1vw,16px);z-index:8;margin:0;padding:0}
body.mc-bc .mc-dot-don .mc-giai-vung{padding:clamp(8px,1vw,16px)}
body.mc .mc-giai-vung{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:clamp(6px,.62vw,12px)}
body.mc .mc-giai-vung .mc-nut-giai{height:clamp(32px,3.12vw,56px);min-height:0;padding:0 clamp(12px,1.25vw,24px);border:0;border-radius:999px;background:var(--mc-bang-nut);color:var(--mc-bang-chu);font:600 clamp(12px,1.17vw,22px)/1 var(--mc-sans);cursor:pointer}
body.mc .mc-giai-vung .mc-nut-giai[aria-expanded="true"]{background:rgba(244,239,228,.3);color:var(--mc-bang-chu)}
body.mc .mc-giai-vung .mc-nut-giai:hover{background:rgba(244,239,228,.24);color:var(--mc-bang-chu)}
/* nút "Hiện học sinh và thần thú" chỉ có ý nghĩa ở chế độ dạy học (thẻ tên ẩn tới khi hết giờ làm bài) */
body.mc .mc-nut-hien-em{display:none}
body.mc-day-hoc .mc-nut-hien-em{display:inline-flex;align-items:center;height:clamp(32px,3.12vw,56px);padding:0 clamp(12px,1.25vw,24px);border:0;border-radius:999px;background:var(--mc-bang-nut);color:var(--mc-bang-chu);font:600 clamp(12px,1.17vw,22px) var(--mc-sans);margin:0}
body.mc .mc-nut-hien-em[hidden]{display:none!important}
body.mc .mc-trong-chu{color:var(--mc-bang-phu)}
body.mc .mc-trong{background:transparent}

/* ── THU THẺ TÊN: không có gì chuyển động lúc đọc đề ── */
body.mc .mc-thu-anh,body.mc .mc-ten-reveal{animation:none!important}

/* ── THANH DƯỚI: đợt k/n · pha · đồng hồ · tiến độ · ghi chú/"rồi chữa" · buổi x/y phút · cài đặt ── */
body.mc .mc-thanh{position:fixed;top:auto;left:10px;right:10px;bottom:8px;height:42px;z-index:40;display:flex;flex-wrap:nowrap;align-items:center;gap:clamp(8px,1.25vw,16px);padding:0 clamp(8px,.9vw,14px) 0 clamp(6px,.6vw,10px);border:0;border-radius:21px;background:var(--mc-thanh-nen);color:var(--mc-bang-chu);font-family:var(--mc-sans);opacity:1;box-shadow:none}
:fullscreen body.mc .mc-thanh,body.mc:fullscreen .mc-thanh,:fullscreen .mc-thanh{top:auto;opacity:1}
:fullscreen .mc-ray{padding-top:0}
body.mc .mc-thanh .mc-buoc{display:flex;align-items:center;gap:2px;flex:none}
body.mc .mc-thanh .mc-buoc button{width:32px;height:32px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--mc-bang-chu);font:600 20px/1 var(--mc-sans);cursor:pointer}
body.mc .mc-thanh .mc-buoc button:hover:not([disabled]){background:var(--mc-bang-nut)}
body.mc .mc-thanh .mc-buoc button[disabled]{opacity:.32;cursor:default}
body.mc .mc-thanh .mc-dem{margin:0;flex:none;min-width:5.4em;text-align:center;font:600 clamp(12px,1.17vw,17px) var(--mc-sans);font-variant-numeric:tabular-nums;color:rgba(244,239,228,.72)}
body.mc .mc-thanh .mc-pha{flex:none;padding:4px 12px;border-radius:999px;font:700 clamp(11px,1.17vw,16px) var(--mc-sans);letter-spacing:.02em;white-space:nowrap}
body.mc .mc-thanh[data-pha="lam"] .mc-pha{background:var(--mc-lam-nen);color:var(--mc-lam-chu)}
body.mc .mc-thanh[data-pha="chua"] .mc-pha{background:var(--mc-chua-nen);color:var(--mc-chua-chu)}
body.mc .mc-thanh[data-pha="goi"] .mc-pha{background:var(--mc-bang-nut);color:var(--mc-bang-chu)}
body.mc .mc-thanh[data-pha="het"] .mc-pha{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}
body.mc .mc-thanh:not([data-pha]) .mc-pha,body.mc .mc-thanh[data-pha=""] .mc-pha,body.mc .mc-thanh:not([data-pha]) #mc-clock,body.mc .mc-thanh[data-pha=""] #mc-clock,body.mc .mc-thanh:not([data-pha]) .mc-tien,body.mc .mc-thanh[data-pha=""] .mc-tien{display:none}
body.mc .mc-thanh #mc-clock{position:static;flex:none;min-width:3.2em;margin:0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;color:var(--mc-bang-chu);font:700 clamp(18px,1.88vw,26px)/1 var(--mc-sans);font-variant-numeric:tabular-nums;text-align:center;pointer-events:auto}
body.mc .mc-thanh #mc-clock[hidden]{display:none!important}
body.mc .mc-thanh #mc-clock.mc-sap-het{background:transparent;color:var(--mc-qua-nen);border:0;box-shadow:none}
body.mc .mc-thanh[data-pha="het"] #mc-clock{color:var(--mc-qua-nen)}
body.mc .mc-thanh .mc-tien{flex:1 1 60px;min-width:40px;height:6px;border-radius:999px;background:rgba(244,239,228,.18);overflow:hidden}
body.mc .mc-thanh .mc-tien-dong{height:6px;width:0;background:#a8c7fa}
body.mc .mc-thanh .mc-thanh-phu{flex:3 1 0;min-width:0;margin:0;color:rgba(244,239,228,.72);font:500 clamp(11px,1.17vw,16px) var(--mc-sans);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.mc .mc-thanh .mc-thanh-phu[data-ghi-chu]{color:var(--mc-bang-chu);font-weight:600}
body.mc .mc-thanh .mc-thanh-phu[data-ghi-chu="canh-bao"]{color:var(--mc-qua-nen)}
body.mc .mc-thanh .mc-buoi{flex:none;font:600 clamp(11px,1.17vw,16px) var(--mc-sans);font-variant-numeric:tabular-nums;color:rgba(244,239,228,.72);white-space:nowrap}
body.mc .mc-thanh #mc-cai-btn{flex:none;height:30px;padding:0 14px;border:0;border-radius:999px;background:var(--mc-bang-nut);color:var(--mc-bang-chu);font:600 clamp(11px,1.17vw,15px) var(--mc-sans);white-space:nowrap;cursor:pointer}
body.mc .mc-thanh #mc-cai-btn:hover,body.mc .mc-thanh #mc-cai-btn[aria-expanded="true"]{background:var(--mc-bang-nut)}
body.mc .mc-thanh #mc-len-bang{flex:none;min-height:44px;padding:0 18px;border:1px solid #a4dcc2;border-radius:999px;background:#bce9d4;color:#163f30;font:700 clamp(12px,1.17vw,17px) var(--mc-sans);white-space:nowrap;cursor:pointer}
body.mc .mc-thanh #mc-len-bang:hover:not(:disabled){background:#d5f3e6}
body.mc .mc-thanh #mc-len-bang:focus-visible{outline:3px solid white;outline-offset:2px}
body.mc .mc-thanh #mc-len-bang:disabled{background:var(--mc-bang-nut);color:var(--mc-bang-phu);border-color:transparent;cursor:default}
body.mc .mc-thanh #mc-len-bang[hidden]{display:none}
@media(max-width:600px){body.mc .mc-thanh .mc-pha{display:none}body.mc .mc-thanh{gap:6px}body.mc .mc-thanh #mc-len-bang{padding:0 12px;white-space:normal;line-height:1.15;flex-shrink:1}body.mc .mc-thanh #mc-cai-btn{padding:0 8px}}
body.mc .mc-thanh-trai{display:none}
#mc-cai-dat{position:fixed;right:10px;bottom:58px;z-index:45;display:flex;flex-direction:column;gap:10px;min-width:280px;max-width:min(420px,calc(100vw - 20px));padding:14px 16px;border-radius:18px;background:var(--mc-thanh-nen);color:var(--mc-bang-chu);font-family:var(--mc-sans);box-shadow:0 8px 28px rgba(0,0,0,.5)}
#mc-cai-dat[hidden]{display:none}
#mc-cai-dat .mc-cai-ten{font:700 15px var(--mc-sans)}
#mc-cai-dat .mc-cai-meta{font:500 13px var(--mc-sans);color:rgba(244,239,228,.7)}
#mc-cai-dat select,#mc-cai-dat button{min-height:36px;padding:0 12px;border:0;border-radius:999px;background:var(--mc-bang-nut);color:var(--mc-bang-chu);font:600 13px var(--mc-sans);cursor:pointer}
#mc-cai-dat select option{color:#22262b;background:#f4efe4}
#mc-cai-dat label{display:flex;flex-direction:column;gap:4px;font:500 12px var(--mc-sans);color:rgba(244,239,228,.7)}
body.mc-timing .mc-ray{padding-bottom:0}
.mc-ray{box-sizing:border-box}

/* ── MÀN GỌI TÊN (đầu mỗi đợt) ── */
.mc-intro{position:fixed;inset:0;z-index:99999;display:flex;align-items:stretch;justify-content:center;background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);color:white;font-family:var(--mc-sans);pointer-events:auto;overflow:hidden;cursor:pointer;transition:background 0.6s ease,backdrop-filter 0.6s ease}
.mc-intro.mc-shrink{background:transparent;backdrop-filter:blur(0px);pointer-events:none}
.mc-intro-card{flex:1;min-width:0;position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(6px,1.1vh,14px);text-align:center;overflow:hidden;--aura:244,162,97}
.mc-intro-card+.mc-intro-card{box-shadow:inset 2px 0 0 rgba(244,239,228,.12)}
.mc-intro-card:before{content:"";position:absolute;left:50%;top:40%;width:min(50vw,80vh);height:min(50vw,80vh);margin:calc(min(50vw,80vh) / -2) 0 0 calc(min(50vw,80vh) / -2);border-radius:50%;z-index:-1;pointer-events:none;background:radial-gradient(circle,rgba(var(--aura),.6) 0%,rgba(var(--aura),.2) 40%,rgba(var(--aura),0) 68%);animation:mc-hao-quang 1.6s ease-in-out infinite alternate}
.mc-intro-card:after{content:"";position:absolute;left:50%;top:40%;width:min(35vw,55vh);height:min(35vw,55vh);margin:calc(min(35vw,55vh) / -2) 0 0 calc(min(35vw,55vh) / -2);border-radius:50%;z-index:-1;pointer-events:none;box-shadow:inset 0 0 0 2px rgba(var(--aura),.5);animation:mc-vong-quay 12s linear infinite}
.mc-intro-card img{width:min(32vw,50vh);height:min(32vw,50vh);object-fit:contain;background:transparent;border:0;filter:drop-shadow(0 0 25px rgba(var(--aura),0.8)) drop-shadow(0 0 60px rgba(var(--aura),0.5));z-index:1;animation:mc-thu-wow 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both}
.mc-intro-bong{width:min(16vw,24vh);height:clamp(12px,3vh,24px);border-radius:50%;background:rgba(0,0,0,.6);margin-top:calc(min(3vh,-12px) * -1);filter:blur(4px)}
.mc-intro-card h2{margin:clamp(8px,2vh,20px) 0 0;padding:clamp(12px,2vh,20px) clamp(24px,4vw,60px);border-radius:clamp(16px,2.2vw,32px);background:linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.0));border:1px solid rgba(var(--aura),0.5);box-shadow:0 8px 32px rgba(var(--aura),0.3), inset 0 0 20px rgba(var(--aura),0.2);backdrop-filter:blur(8px);color:#fff;font:900 clamp(32px,5vw,80px)/1.1 var(--mc-sans);text-transform:uppercase;letter-spacing:2px;text-shadow:0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(var(--aura),1);max-width:92%;z-index:1;animation:mc-text-wow 1s ease-out 0.3s both}
.mc-intro-card p{margin:0;font:700 clamp(18px,2vw,36px) var(--mc-sans);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(var(--aura),0.8);z-index:1;animation:mc-text-wow 1s ease-out 0.5s both}
.mc-intro-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:clamp(4px,1vh,12px);z-index:1;animation:mc-text-wow 1s ease-out 0.7s both}
.mc-intro-chips span{padding:clamp(6px,1vh,10px) clamp(14px,1.5vw,24px);border-radius:999px;background:rgba(0,0,0,0.5);border:1px solid rgba(var(--aura),0.4);box-shadow:0 4px 12px rgba(var(--aura),0.2);color:#fff;font:700 clamp(14px,1.6vw,28px) var(--mc-sans);text-shadow:0 1px 4px rgba(0,0,0,0.8)}
.mc-intro-label{position:absolute;z-index:2;top:clamp(10px,2.5vh,26px);left:0;right:0;text-align:center;font:800 clamp(16px,1.8vw,32px) var(--mc-sans);letter-spacing:0.2em;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(var(--aura),0.8);animation:mc-text-wow 1s ease-out both}
.mc-intro-close{display:none}
.mc-intro.mc-shrink .mc-intro-card:before,.mc-intro.mc-shrink .mc-intro-card:after,.mc-intro.mc-shrink .mc-intro-bong,.mc-intro.mc-shrink .mc-intro-chips{display:none}
@keyframes mc-hao-quang{from{transform:scale(.8);opacity:.5}to{transform:scale(1.2);opacity:1}}
@keyframes mc-vong-quay{to{transform:rotate(360deg)}}
@keyframes mc-thu-wow{0%{transform:scale(0.2) translateY(100px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
@keyframes mc-text-wow{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}

/* ── ĂN MỪNG KHI ĐẠT: thẻ tên xanh "Làm tốt lắm", thần thú nhảy 1,5 s rồi đứng yên ── */
body.mc .mc-em.mc-em-dat{background:var(--mc-mung-nen);color:var(--mc-mung-chu)}
body.mc .mc-em.mc-em-dat .mc-ten{color:var(--mc-mung-chu)}
body.mc .mc-em.mc-em-dat .mc-thu-chu,body.mc .mc-em.mc-em-dat .mc-em-phu{color:var(--mc-mung-chu)}
body.mc .mc-em.mc-em-dat .mc-cau-so{background:rgba(7,33,0,.12);color:var(--mc-mung-chu)}
body.mc .mc-em .mc-lam-tot{display:none}
body.mc .mc-em.mc-em-dat .mc-thu-chu,body.mc .mc-em.mc-em-dat .mc-em-phu{display:none}
body.mc .mc-em.mc-em-dat .mc-lam-tot{display:block;grid-column:2;grid-row:2;font:700 clamp(12px,1.25vw,24px)/1.3 var(--mc-sans);color:var(--mc-mung-chu)}
.mc-mung .mc-thu-anh{animation:mc-nhay 1.5s ease-in-out 1!important}
.mc-mung:before,.mc-mung:after{content:"";position:absolute;width:clamp(14px,1.9vw,30px);height:clamp(14px,1.9vw,30px);background:var(--mc-qua-nen);clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);pointer-events:none;animation:mc-lap-lanh 1.5s ease-in-out 1 both}
.mc-mung:before{left:clamp(30px,3.6vw,70px);top:-6px}
.mc-mung:after{left:clamp(4px,.5vw,10px);bottom:-4px;animation-delay:.2s;width:clamp(10px,1.4vw,22px);height:clamp(10px,1.4vw,22px)}
body.mc .mc-em{position:relative}
.mc-mung-overlay{background:transparent!important;backdrop-filter:none!important}
.mc-mung-card img{animation:mc-thu-wow 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both, mc-nhay-mung 1.5s ease-in-out infinite alternate!important}
.mc-hoa{position:absolute;top:-10vh;left:var(--x);width:clamp(20px,3vw,50px);height:clamp(20px,3vw,50px);background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 C50 40 100 50 100 50 C100 50 50 60 50 100 C50 100 50 60 0 50 C0 50 50 40 50 0" fill="%23facc15"/></svg>') no-repeat center/contain;animation:mc-roi 2.5s ease-in forwards;animation-delay:var(--delay);z-index:999;pointer-events:none}
@keyframes mc-nhay-mung{from{transform:translateY(0)}to{transform:translateY(-20px)}}
@keyframes mc-roi{to{transform:translateY(120vh) rotate(720deg)}}
@keyframes mc-nhay{0%,100%{transform:translateY(0) rotate(0)}18%{transform:translateY(-16%) rotate(-5deg)}36%{transform:translateY(0)}54%{transform:translateY(-11%) rotate(5deg)}72%{transform:translateY(0)}}
@keyframes mc-lap-lanh{0%{opacity:0;transform:scale(.3)}30%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.25)}}

/* tắt hết chuyển động khi người dùng/hệ điều hành yêu cầu */
@media (prefers-reduced-motion:reduce){.mc-intro-card:before,.mc-mung .mc-thu-anh,.mc-mung:before,.mc-mung:after{animation:none!important}.mc-mung:before,.mc-mung:after{display:none}}
@media print{.mc-thanh,#mc-cai-dat,.mc-intro{display:none!important}body.mc{background:#fff!important;color:#000}}
`
