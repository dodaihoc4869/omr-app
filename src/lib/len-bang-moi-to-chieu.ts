// LÊN BẢNG — BẢN VẼ MỚI THẦY CHỐT 28/09/2026 (docs/ban-ve-len-bang-2809/LenBang-Moi.html, nhánh ban-ve-len-bang).
// "Cho hiện luôn lên máy chiếu và build luôn theo thiết kế mới này."
//
// Lớp này nằm SAU mọi CSS/JS cũ của tờ chiếu (`html-may-chieu.ts`, `bo-cuc-to-chieu.ts`, `giao-dien-to-chieu.ts`, cầu nối) nên thắng
// về độ ưu tiên; nó thêm hành vi mới mà KHÔNG đổi hợp đồng markup cũ (`.mc-dot > .mc-nua > .mc-em / .mc-vung-de / .mc-giai-vung`).
//
// LUẬT THẦY (28/09):
//  1. KHÔNG BAO GIỜ thu nhỏ chữ. Cỡ chữ đề = phương án = lời giải = `--mc-co` (cố định theo bề ngang × hệ số thầy chọn).
//  2. CHỜ GỌI: câu dài hơn vùng 2/3 ⇒ LẬT TRANG trong câu, ngắt ở RANH GIỚI KHỐI (đoạn đề / hình / phương án / ý / mục lời giải),
//     trang sau có dòng "Câu N (tiếp)", chân có "Trang i/n"; Space / ↓ / PageDown lật; ← / → đổi đợt.
//  3. ĐÃ BẤM LÊN BẢNG: đề + lời giải CUỘN dọc trong 2/3; cột 1/3 ĐEN TUYỀN (tắt máy chiếu chỗ em viết), chỉ thẻ tên nhỏ ở mép trên;
//     bóng "còn nữa ↓" khi chưa cuộn hết.
//  4. Chờ gọi KHÔNG hiện/gợi ý tên em nào (kể cả lưới tổng quan: chỉ đợt đã gọi mới có tên).
//  6. Lời giải nằm DƯỚI đề trong 2/3, HIỆN DẦN bằng Space (mục cũ mờ nhẹ, ý a–d sáng dòng tương ứng của đề).
//  7. Phím: L · G · D/K · T · B · Tab · số+Enter · Home/End · ? · Esc. Thanh dưới ≥ 22 px@1920, đậm.
//  8. Hình bấm để phóng toàn tờ. Phương án là phương trình: không ngắt dòng giữa hai vế.
//  9. Bấm THẺ TÊN ⇒ bảng chi tiết học sinh trượt từ phải (số thật từ máy chủ, qua cầu nối `__mcHoiHoSo` → app thầy → `/gv/ho-so-len-bang`).
//
// TỆP NÀY KHÔNG CÓ MÃ MÀU "#rrggbb" (luật `check:mau`) — chỉ rgb()/rgba().
import { thoat } from './html-phieu'
import type { ThongKeLopCau } from './thong-ke-lop-cau'
export { thongKeLopCau, type ThongKeLopCau } from './thong-ke-lop-cau'

// ───────────────────────── THỐNG KÊ LỚP (phím T) ─────────────────────────

/** Dải thống kê (ẩn cho tới khi thầy bấm T). Nằm đầu vùng đề 2/3, cao một dòng. Có ở MỌI buổi chữa (từ ca: bài làm của ca; không từ ca: sổ
 * su_kien_hoc của cả lớp — `thongKeTuSoGop`). KHÔNG có số ⇒ KHÔNG vẽ dải; bấm T thì tờ báo "Chưa có số liệu lớp" (hoàn thiện bản vẽ 28/09). */
export function thongKeHtml(t: ThongKeLopCau | null | undefined): string {
  if (!t) return ''
  let h = '<span class="mc-tk-nhan">Cả lớp</span>'
  if (t.kieu === 'pa') h += Object.entries(t.tiLe).map(([k, v]) => `<span class="mc-tk-o${k === t.dung ? ' mc-tk-dung' : ''}"><b>${thoat(k)}</b><span class="mc-tk-thanh"><i style="width:${v}%"></i></span>${v}%</span>`).join('')
  if (t.kieu === 'y') h += Object.entries(t.tiLe).map(([k, v]) => `<span class="mc-tk-o${v >= 60 ? ' mc-tk-dung' : ''}"><b>${thoat(k)})</b> đúng ${v}%</span>`).join('')
  if (t.kieu === 'so') h += `<span class="mc-tk-o mc-tk-dung">Đúng ${t.dung}%</span>` + (t.saiHay.length ? `<span class="mc-tk-nhan">Sai hay gặp:</span>` + t.saiHay.map((s) => `<span class="mc-tk-sai"><b>${thoat(s.dap)}</b> ${s.tiLe}%</span>`).join(' · ') : '')
  return `<div class="mc-tk" aria-label="Thống kê cả lớp">${h}<span class="mc-tk-bai">${t.bai} bài nộp</span></div>`
}

// ───────────────────────── CSS ─────────────────────────
export const CSS_LEN_BANG_MOI = `
/* ═══ LÊN BẢNG — BẢN VẼ MỚI 28/09 ═══ */
:root{--u:min(1vw,1.777778vh);--mc-den:rgb(0,0,0);--mc-vang-noi:rgb(255,210,122);--mc-thanh2:rgb(27,26,23)}
/* 1 · CHỮ CỐ ĐỊNH: đề = phương án = lời giải = --mc-co (không co, không bậc chữ) cho cả dạy học, đầu giờ và chiến dịch */
body.mc-bc .mc-vung-de .mc-de,body.mc .mc-de{font-size:var(--mc-co,28px)!important;line-height:1.6!important}
body.mc-bc .mc-vung-de .mc-pa,body.mc-bc .mc-vung-de .mc-pa-chu{font-size:var(--mc-co,28px)}
body.mc .mc-pa,body.mc .mc-pa-chu{font-size:var(--mc-co,28px)!important;line-height:1.6!important}
.mc-giai .sol-box{font-size:var(--mc-co,28px)!important}
body.mc-bc .mc-vung-de>.mc-giai,body.mc-bc .mc-vung-de>.mc-giai .sol-box{font-size:var(--mc-co,28px)!important}
body.mc .mc-giai .sol-box{font-size:var(--mc-co,28px)!important}
/* 8 · phương án là phương trình: không ngắt giữa hai vế */
body.mc .mc-pa-chu{overflow-wrap:normal}
body.mc .mc-pa-chu:has(.mt){white-space:nowrap}
/* 6 · LỜI GIẢI NẰM DƯỚI ĐỀ — hiển thị chuẩn như trong app */
body.mc-bc .mc-vung-de>.mc-giai{position:static;inset:auto;overflow:visible;margin:.6em 0 0;padding:0;background:transparent;border:0;z-index:auto}
body.mc-bc .mc-vung-de>.mc-giai .sol-box{display:block;margin:12px 0;padding:16px 20px;background:rgba(254,243,199,.6);border:1.5px solid rgb(253,230,138);border-left:5px solid rgb(217,119,6);border-radius:16px;box-shadow:0 3px 12px rgba(180,83,9,.08);color:var(--mc-muc,rgb(30,41,59));font-size:var(--mc-co,28px)!important}
/* Lời giải hiển thị theo hàng ngang, cân đối, đẹp mắt, không bị ép thành 4 cột dọc */
body.mc .mc-giai .sol-box .sol-text,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-text{display:flex!important;flex-direction:column!important;width:100%!important;gap:10px!important;padding:4px 0!important}
body.mc .mc-giai .sol-box .sol-pa,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-pa{display:flex!important;flex-direction:row!important;align-items:flex-start!important;gap:12px!important;width:100%!important;box-sizing:border-box!important;padding:8px 12px!important;border-radius:8px!important}
body.mc .mc-giai .sol-box .sol-pa strong,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-pa strong{flex-shrink:0!important;font-weight:800!important;min-width:1.4em!important}
body.mc .mc-giai .sol-box .sol-pa .sol-dau,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-pa .sol-dau{flex-shrink:0!important;font-weight:900!important;min-width:1.2em!important;text-align:center!important}
body.mc .mc-giai .sol-box .sol-pa .sol-ly,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-pa .sol-ly{flex:1 1 auto!important;min-width:0!important;overflow-wrap:break-word!important}
body.mc .mc-giai .sol-box .sol-pa.chon,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-pa.chon{background:rgba(16,185,129,.12)!important;border-left:5px solid rgb(5,150,105)!important;font-weight:700!important}
/* Cỡ chữ lời giải chiếu lên bảng ĐỀU NHAU, GIỐNG NHAU và BẰNG VỚI KÍCH THƯỚC CỦA ĐỀ: var(--mc-co, 28px) */
body.mc-bc .mc-vung-de>.mc-giai .sol-box,
body.mc-bc .mc-vung-de>.mc-giai .sol-box *,
body.mc .mc-giai .sol-box,
body.mc .mc-giai .sol-box *,
body.mc .mc-giai .sol-dap,
body.mc .mc-giai .sol-dap b,
body.mc .mc-giai .sol-cot-loi,
body.mc .mc-giai .sol-text,
body.mc .mc-giai .sol-pa,
body.mc .mc-giai .sol-pa strong,
body.mc .mc-giai .sol-pa span,
body.mc .mc-giai .sol-dau,
body.mc .mc-giai .sol-ly,
body.mc .mc-giai .sol-step,
body.mc .mc-giai .sol-ket,
body.mc .mc-giai .sol-box .sol-label,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-label{font-size:var(--mc-co,28px)!important;line-height:1.6!important}
body.mc .mc-giai .sol-box .sol-label,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .sol-label{font-weight:800!important;text-transform:uppercase!important;letter-spacing:0.05em!important;margin-top:14px!important;margin-bottom:8px!important}
body.mc .mc-giai .sol-box .katex,
body.mc-bc .mc-vung-de>.mc-giai .sol-box .katex{font-size:1em!important}
body.mc .mc-giai .sol-box sub,
body.mc .mc-giai .sol-box sup,
body.mc-bc .mc-vung-de>.mc-giai .sol-box sub,
body.mc-bc .mc-vung-de>.mc-giai .sol-box sup{font-size:.75em!important;line-height:0!important}
body.mc .mc-giai .mc-buoc-an,body.mc .mc-giai .mc-buoc-cu,body.mc .mc-giai .mc-buoc-nay{opacity:1!important}
body.mc .mc-giai .sol-box>*,body.mc .mc-giai .sol-pa{transition:opacity .35s,background .35s}
body.mc .mc-giai-dem{display:block;font:600 calc(var(--u)*1) var(--mc-sans);color:var(--mc-phu);margin:0 0 .3em}
body.mc .mc-pa.mc-y-sang{background:linear-gradient(90deg,rgba(36,86,201,.16),transparent);border-radius:.3em}
body.mc .mc-pa.mc-pa-dung .mc-ky{color:var(--mc-lam-chu);background:var(--mc-lam-nen);border-radius:.3em;padding:0 .15em}
/* Ẩn hoàn toàn cụm nút lời giải, đạt, không đạt khỏi khu vực bảng của học sinh */
body.mc-bc .mc-giai-vung,body.mc .mc-giai-vung{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important;opacity:0!important;pointer-events:none!important}
/* 2 · LẬT TRANG (chờ gọi) */
body.mc-bc .mc-vung-de{overflow:hidden}
body.mc-bc .mc-vung-de>.mc-de-dau,body.mc-bc .mc-vung-de>.mc-than,body.mc-bc .mc-vung-de>.mc-giai,body.mc-bc .mc-vung-de>.mc-tk{transition:transform .3s cubic-bezier(.3,.8,.3,1)}
body.mc-bc .mc-vung-de .mc-ngoai{visibility:hidden}
body.mc-do .mc-vung-de>*{transform:none!important}
.mc-tiep-bar{position:absolute;left:0;right:0;top:0;z-index:4;display:none;align-items:center;gap:.6em;height:calc(var(--u)*2.6);padding:0 clamp(14px,1.9vw,34px);background:var(--mc-giay);border-bottom:1px dashed var(--mc-vien);font:700 calc(var(--u)*1.1) var(--mc-sans);color:var(--mc-phu);border-radius:inherit}
.mc-tiep-bar.mc-hien{display:flex}
.mc-tiep-bar b{color:var(--mc-nhan)}
.mc-che{position:absolute;left:0;right:0;bottom:0;z-index:3;display:none;background:var(--mc-giay);border-radius:0 0 clamp(14px,1.72vw,30px) clamp(14px,1.72vw,30px)}
.mc-che.mc-hien{display:block}
.mc-trang-so{position:absolute;right:calc(var(--u)*1);bottom:calc(var(--u)*.5);z-index:4;display:none;align-items:center;gap:.5em;padding:.2em .7em;border-radius:1em;background:var(--mc-giay);box-shadow:0 0 0 1px var(--mc-vien);font:800 calc(var(--u)*1.05) var(--mc-sans);color:var(--mc-chu)}
.mc-trang-so.mc-hien{display:flex}
.mc-trang-so i{display:inline-block;width:calc(var(--u)*.7);height:calc(var(--u)*.7);border-radius:50%;background:var(--mc-vien)}
.mc-trang-so i.mc-o{background:var(--mc-nhan)}
.mc-trang-so kbd{font:inherit;font-size:.8em;border:.1em solid var(--mc-phu);border-bottom-width:.18em;border-radius:.3em;padding:0 .3em}
/* 3 · ĐANG CHỮA: cuộn trong 2/3, bóng "còn nữa ↓" */
body.mc-bc .mc-vung-de.mc-cuon{overflow-y:auto!important;scrollbar-width:thin}
body.mc-bc .mc-vung-de.mc-cuon>*{transform:none!important}
.mc-con-nua{position:sticky;bottom:calc(-1 * clamp(12px,1.72vw,30px));z-index:4;display:none;align-items:flex-end;justify-content:center;height:calc(var(--u)*4.5);margin-top:calc(var(--u)*-4.5);pointer-events:none;background:linear-gradient(rgba(244,239,228,0),var(--mc-giay) 80%);font:800 calc(var(--u)*1.05) var(--mc-sans);color:var(--mc-nhan)}
.mc-con-nua.mc-hien{display:flex}
/* 3 · CỘT 1/3 ĐEN TUYỀN khi đã gọi (máy chiếu không phát sáng chỗ em viết) */
body.mc-bc[data-pha="chua"] .mc-dot,body.mc-bc[data-pha="goi"] .mc-dot{background:var(--mc-den)}
body.mc-bc[data-pha="chua"] .mc-cot-lam-bai,body.mc-bc[data-pha="goi"] .mc-cot-lam-bai,body.mc-bc[data-pha="chua"] .mc-trang,body.mc-bc[data-pha="goi"] .mc-trang{background:var(--mc-den)!important;box-shadow:none!important;border:0!important}
body.mc-bc[data-pha="chua"] .mc-cot-lam-bai::before,body.mc-bc[data-pha="chua"] .mc-cot-lam-bai::after,body.mc-bc[data-pha="chua"] .mc-trang::before,body.mc-bc[data-pha="chua"] .mc-trang::after{content:none!important;display:none!important}
/* 4 · CHỜ GỌI: cột 1/3 chỉ có lời mời, KHÔNG tên em nào */
body.mc-bc[data-pha="cho"] .mc-dot-don .mc-cot-lam-bai{display:grid;place-items:center;text-align:center}
body.mc-bc[data-pha="cho"] .mc-dot-don .mc-cot-lam-bai::before{content:"Chờ thầy gọi\\A Bấm L hoặc nút “Lên bảng”\\A \\A Tên em chỉ hiện khi thầy bấm Lên bảng";white-space:pre-line;font:600 calc(var(--u)*1.25)/1.5 var(--mc-sans);color:var(--mc-bang-phu);padding:calc(var(--u)*1.5)}
body.mc-bc .mc-dot-don[data-thay-chua] .mc-cot-lam-bai::before,body.mc-bc[data-pha] .mc-dot-don[data-thay-chua] .mc-cot-lam-bai::before{content:"Thầy chữa\\A Câu này không gọi em lên bảng";white-space:pre-line;font:800 calc(var(--u)*1.6)/1.5 var(--mc-sans);color:var(--mc-bang-chu);padding:calc(var(--u)*1.5)}
body[data-dot-thay-chua] .mc-thanh #mc-len-bang{display:none}
body[data-dot-thay-chua] .mc-thanh #mc-pha{font-size:0}
body[data-dot-thay-chua] .mc-thanh #mc-pha::after{content:"THẦY CHỮA";font-size:max(13px,calc(var(--u)*1.15))}
/* THẺ TÊN (bản vẽ H15 + thầy 28/09): lưới cố định; nhãn Đạt/Chưa đạt là viên thuốc MỘT dòng, tên dài tự cắt "…" */
body.mc .mc-em .mc-ten-hang{grid-column:2;grid-row:1;display:flex;align-items:center;min-width:0;gap:.6em}
body.mc .mc-em:not(:has(.mc-thu)) .mc-ten-hang{grid-column:1 / span 2}
body.mc .mc-em .mc-ten{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;overflow-wrap:normal}
body.mc .mc-em .mc-dau-kq{flex:none;display:inline-flex;align-items:center;white-space:nowrap;font-size:.58em;font-weight:800;line-height:1;border-radius:1em;padding:.35em .75em;color:rgb(255,255,255);font-family:var(--mc-sans)}
body.mc .mc-em .mc-ten-hang{font:700 clamp(18px,2.03vw,40px)/1.1 var(--mc-sans)}
body.mc .mc-em .mc-ten-hang .mc-ten{font:inherit}
body.mc .mc-em .mc-dau-kq[hidden]{display:none}
body.mc .mc-em .mc-dau-kq.mc-dat{background:rgb(31,122,77)}
body.mc .mc-em .mc-dau-kq.mc-kd{background:rgb(200,50,47)}
body.mc .mc-em{cursor:pointer}
body.mc .mc-em .mc-xem-ct{display:none}
body.mc-bc .mc-dot-don .mc-em .mc-xem-ct{display:inline-flex;grid-column:3;grid-row:1 / span 2;align-self:center;font:700 calc(var(--u)*.85) var(--mc-sans);color:var(--mc-nhan);border:1px solid color-mix(in srgb,var(--mc-nhan) 35%,transparent);border-radius:2em;padding:.35em .8em;white-space:nowrap}
body.mc-bc .mc-dot-don .mc-em{grid-template-columns:clamp(46px,5.94vw,116px) minmax(0,1fr) auto}
body.mc .mc-em.mc-pop{animation:mc-pop .45s cubic-bezier(.2,1.6,.4,1)}
@keyframes mc-pop{0%{transform:scale(.92)}100%{transform:scale(1)}}
/* 7 · THANH DƯỚI ≥ 22 px@1920, đậm; số đợt vàng nổi */
body.mc .mc-thanh{height:calc(var(--u)*3.6);min-height:44px;font-size:max(14px,calc(var(--u)*1.15));font-weight:700;border-radius:calc(var(--u)*1.2);gap:calc(var(--u)*.6)}
body.mc .mc-thanh .mc-dem{font:800 max(15px,calc(var(--u)*1.27)) var(--mc-sans);color:var(--mc-vang-noi);min-width:5.6em}
body.mc .mc-thanh .mc-buoc button{width:calc(var(--u)*2.5);height:calc(var(--u)*2.5);min-width:32px;min-height:32px;font-size:max(18px,calc(var(--u)*1.3))}
body.mc .mc-thanh .mc-pha,body.mc .mc-thanh .mc-thanh-phu,body.mc .mc-thanh #mc-cai-btn,body.mc .mc-thanh #mc-len-bang{font-size:max(13px,calc(var(--u)*1.15));font-weight:700}
body.mc .mc-thanh #mc-len-bang{min-height:calc(var(--u)*2.5)}
.mc-phim-nhom{display:flex;align-items:center;gap:calc(var(--u)*.5);flex:none}
.mc-nut-phim{display:inline-flex;align-items:center;gap:.4em;height:calc(var(--u)*2.8);min-height:36px;padding:0 .75em;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:var(--mc-bang-chu);font:700 max(13px,calc(var(--u)*1.15)) var(--mc-sans);white-space:nowrap;cursor:pointer;transition:all .15s ease}
.mc-nut-phim:hover{background:rgba(255,255,255,.18)}
.mc-nut-phim kbd{font:inherit;font-size:.82em;font-weight:800;background:var(--mc-bang-chu);color:var(--mc-thanh2);border-radius:.25em;padding:0 .35em;min-width:1.3em;text-align:center}
.mc-nut-phim.mc-bat{background:var(--mc-bang-chu);color:var(--mc-thanh2)}
.mc-nut-phim.mc-bat kbd{background:var(--mc-thanh2);color:var(--mc-bang-chu)}
.mc-nut-phim[hidden]{display:none}
@media(max-width:1100px){.mc-nut-phim:not([data-k="G"]):not([data-k="D"]):not([data-k="K"]):not([data-k="C"]) .mc-nut-chu{display:none}}
/* Nút G, D, K luôn hiện chữ, nổi bật dễ bấm */
body.mc .mc-phim-nhom [data-k="C"] .mc-nut-chu,
body.mc .mc-phim-nhom [data-k="G"] .mc-nut-chu,
body.mc .mc-phim-nhom [data-k="D"] .mc-nut-chu,
body.mc .mc-phim-nhom [data-k="K"] .mc-nut-chu{display:inline!important;font-weight:700;margin-left:2px}
body.mc .mc-phim-nhom [data-k="G"]{background:rgba(217,119,6,.18);border:1.5px solid rgb(245,158,11);color:rgb(254,243,199)}
body.mc .mc-phim-nhom [data-k="G"] kbd{background:rgb(245,158,11);color:rgb(27,26,23);font-weight:900}
body.mc .mc-phim-nhom [data-k="G"].mc-bat{background:rgb(217,119,6);border-color:rgb(251,191,36);color:rgb(255,255,255);box-shadow:0 0 12px rgba(245,158,11,.5)}
body.mc .mc-phim-nhom [data-k="G"].mc-bat kbd{background:rgb(255,255,255);color:rgb(180,83,9)}
body.mc .mc-phim-nhom [data-k="D"]{background:rgb(20,108,67);border:1.5px solid rgb(34,197,94);color:rgb(255,255,255)}
body.mc .mc-phim-nhom [data-k="D"] kbd{background:rgb(255,255,255);color:rgb(20,108,67);font-weight:900}
body.mc .mc-phim-nhom [data-k="D"]:hover{background:rgb(22,128,61);box-shadow:0 0 10px rgba(34,197,94,.4)}
body.mc .mc-phim-nhom [data-k="K"]{background:rgb(185,28,28);border:1.5px solid rgb(239,68,68);color:rgb(255,255,255)}
body.mc .mc-phim-nhom [data-k="K"] kbd{background:rgb(255,255,255);color:rgb(185,28,28);font-weight:900}
body.mc .mc-phim-nhom [data-k="K"]:hover{background:rgb(220,38,38);box-shadow:0 0 10px rgba(239,68,68,.4)}
/* 7 · T · dải thống kê lớp */
body.mc .mc-tk{display:none}
body.mc.mc-co-tk .mc-tk{display:flex;align-items:center;gap:calc(var(--u)*1);height:calc(var(--u)*3.2);margin:0 0 calc(var(--u)*.6);padding:0 calc(var(--u)*1);border-radius:calc(var(--u)*.6);background:rgb(255,255,255);border:1px solid var(--mc-vien);font:600 calc(var(--u)*1.05) var(--mc-sans);color:var(--mc-chu);white-space:nowrap;overflow:hidden}
.mc-tk-nhan{font-size:.8em;color:var(--mc-phu);font-weight:700}
.mc-tk-bai{margin-left:auto;font-size:.75em;color:var(--mc-phu)}
.mc-tk-o{display:flex;align-items:center;gap:.35em}
.mc-tk-thanh{width:calc(var(--u)*5);height:calc(var(--u)*.7);background:var(--mc-the);border-radius:1em;overflow:hidden}
.mc-tk-thanh i{display:block;height:100%;background:var(--mc-phu)}
.mc-tk-dung{color:rgb(31,122,77)}.mc-tk-dung .mc-tk-thanh i{background:rgb(31,122,77)}
.mc-tk-sai{color:rgb(200,50,47)}
.mc-tk-rong{color:var(--mc-phu)}
/* 7 · B · bút */
canvas.mc-but{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:30;pointer-events:none;touch-action:none}
body.mc-co-but canvas.mc-but{pointer-events:auto;cursor:crosshair}
.mc-but-cu{position:fixed;top:calc(var(--u)*.8);left:50%;transform:translateX(-50%);z-index:31;display:none;gap:calc(var(--u)*.5);align-items:center;background:var(--mc-thanh2);color:rgb(255,255,255);border-radius:3em;padding:calc(var(--u)*.4) calc(var(--u)*.8);font:700 max(13px,calc(var(--u)*.95)) var(--mc-sans);box-shadow:0 .5em 1.5em rgba(0,0,0,.25)}
body.mc-co-but .mc-but-cu{display:flex}
.mc-but-cu button{font:inherit;color:inherit;border:0;cursor:pointer}
.mc-but-cu .mc-m{width:calc(var(--u)*1.9);height:calc(var(--u)*1.9);min-width:24px;min-height:24px;border-radius:50%;border:.2em solid transparent}
.mc-but-cu .mc-m.mc-chon{border-color:rgb(255,255,255)}
.mc-but-cu .mc-n{padding:.3em .8em;border-radius:2em;background:rgba(255,255,255,.1)}
.mc-but-cu .mc-n.mc-chon{background:rgb(255,255,255);color:var(--mc-thanh2)}
/* Lớp phủ: phóng hình · lưới tổng quan · phím tắt · báo nhanh */
.mc-phu-lop{position:fixed;inset:0;z-index:60;display:none;font-family:var(--mc-sans)}
.mc-phu-lop.mc-mo{display:block}
.mc-phong{background:rgba(20,18,14,.9);cursor:zoom-out}
.mc-phong .mc-ruot{position:absolute;inset:calc(var(--u)*2.5);background:rgb(255,255,255);border-radius:calc(var(--u)*1);display:grid;place-items:center;padding:calc(var(--u)*1.5)}
.mc-phong .mc-ruot img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain}
.mc-phong .mc-gc{position:absolute;right:calc(var(--u)*3.2);top:calc(var(--u)*3);font:700 calc(var(--u)*1) var(--mc-sans);color:rgb(91,86,71)}
body.mc-bc .mc-vung-de img.mc-anh,body.mc-bc .mc-vung-de .mc-than img{cursor:zoom-in}
.mc-luoi{background:rgba(14,17,24,.95);color:rgb(238,238,255);padding:calc(var(--u)*2) calc(var(--u)*2.4);overflow:auto}
.mc-luoi h2{font-size:calc(var(--u)*1.7);margin:0 0 calc(var(--u)*1);display:flex;align-items:baseline;gap:1em}
.mc-luoi h2 span{font-size:.55em;color:rgb(154,163,184);font-weight:500}
.mc-luoi .mc-ds{display:grid;grid-template-columns:repeat(6,1fr);gap:calc(var(--u)*.8)}
.mc-the-dot{text-align:left;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:calc(var(--u)*.7);padding:calc(var(--u)*.7) calc(var(--u)*.8);font:500 max(13px,calc(var(--u)*.95))/1.35 var(--mc-sans);color:inherit;cursor:pointer}
.mc-the-dot b{font-size:1.35em;display:block}
.mc-the-dot .mc-tt{display:inline-block;margin-top:.3em;font-size:.8em;font-weight:700;border-radius:1em;padding:.05em .6em;background:rgba(255,255,255,.1)}
.mc-the-dot .mc-tt.mc-dat{background:rgb(31,122,77)}.mc-the-dot .mc-tt.mc-kd{background:rgb(200,50,47)}.mc-the-dot .mc-tt.mc-dang{background:var(--mc-vang-noi);color:var(--mc-thanh2)}
.mc-the-dot.mc-dang{outline:.15em solid var(--mc-vang-noi)}
.mc-phim{background:rgba(14,17,24,.8)}
.mc-phim.mc-mo{display:grid;place-items:center}
.mc-phim .mc-h{background:rgb(255,255,255);color:rgb(29,27,22);border-radius:calc(var(--u)*1.2);padding:calc(var(--u)*1.6) calc(var(--u)*2.2);font-size:max(14px,calc(var(--u)*1.1));min-width:42%}
.mc-phim h2{font-size:1.3em;margin:0 0 .6em}
.mc-phim dl{display:grid;grid-template-columns:auto 1fr;gap:.4em 1.2em;align-items:center;margin:0}
.mc-phim dt{text-align:right}.mc-phim dd{margin:0}
.mc-phim kbd{font:inherit;font-weight:800;font-size:.85em;border:.1em solid rgb(91,86,71);border-bottom-width:.22em;border-radius:.3em;padding:0 .4em;margin-left:.2em}
.mc-bao{position:fixed;top:calc(var(--u)*1.2);left:50%;transform:translateX(-50%);z-index:70;background:var(--mc-thanh2);color:rgb(255,255,255);font:700 max(14px,calc(var(--u)*1.1)) var(--mc-sans);padding:.5em 1.1em;border-radius:2em;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}
.mc-bao.mc-hien{opacity:1}
/* 5 · HIỆU ỨNG GỌI TÊN ≈1,5 s */
.mc-goi{position:fixed;inset:0;z-index:99999;overflow:hidden;font-family:var(--mc-sans);cursor:pointer}
.mc-goi .mc-g-nen{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,rgba(255,190,80,.42) 0,rgba(255,190,80,0) 38%),rgba(16,11,6,.94);animation:mc-g-vao .35s ease-out both}
.mc-goi.mc-ve .mc-g-nen{animation:mc-g-ra .4s ease-in both}
@keyframes mc-g-vao{from{opacity:0}to{opacity:1}}
@keyframes mc-g-ra{to{opacity:0}}
.mc-goi .mc-g-vong{position:absolute;left:50%;top:40%;width:calc(var(--u)*16);height:calc(var(--u)*16);margin:calc(var(--u)*-8) 0 0 calc(var(--u)*-8);border-radius:50%;border:calc(var(--u)*.35) solid rgba(255,214,120,.9);box-shadow:0 0 calc(var(--u)*3) rgba(255,200,90,.8),inset 0 0 calc(var(--u)*2) rgba(255,200,90,.6);animation:mc-g-vong 1.1s cubic-bezier(.2,.8,.2,1) both}
.mc-goi .mc-g-vong.mc-v2{animation-delay:.18s;border-color:rgba(255,255,255,.6)}
@keyframes mc-g-vong{0%{transform:scale(.2);opacity:0}30%{opacity:1}100%{transform:scale(2.3);opacity:0}}
.mc-goi .mc-g-tia{position:absolute;left:50%;top:40%;width:calc(var(--u)*40);height:calc(var(--u)*40);margin:calc(var(--u)*-20) 0 0 calc(var(--u)*-20);background:repeating-conic-gradient(rgba(255,220,140,.16) 0 6deg,transparent 6deg 18deg);border-radius:50%;-webkit-mask:radial-gradient(circle,rgb(0,0,0) 20%,transparent 68%);mask:radial-gradient(circle,rgb(0,0,0) 20%,transparent 68%);animation:mc-g-tia 1.5s linear both}
@keyframes mc-g-tia{from{transform:rotate(0) scale(.6);opacity:0}25%{opacity:1}to{transform:rotate(40deg) scale(1.1);opacity:.8}}
.mc-goi .mc-g-hat{position:absolute;left:50%;top:40%;width:calc(var(--u)*.55);height:calc(var(--u)*.55);border-radius:50%;background:rgb(255,227,161);box-shadow:0 0 calc(var(--u)*.8) rgb(255,199,90);animation:mc-g-hat 1.05s cubic-bezier(.1,.7,.3,1) both}
@keyframes mc-g-hat{0%{transform:translate(0,0) scale(.3);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}
.mc-goi .mc-g-hang{position:absolute;left:0;right:0;top:40%;transform:translateY(-50%);display:flex;justify-content:center;gap:calc(var(--u)*6)}
.mc-goi .mc-g-cum{display:grid;justify-items:center;text-align:center;color:rgb(255,255,255);transform-origin:0 0}
.mc-goi .mc-g-thu{width:calc(var(--u)*15);height:calc(var(--u)*15);object-fit:contain;animation:mc-g-thu .6s cubic-bezier(.2,1.5,.4,1) .1s both;filter:drop-shadow(0 0 calc(var(--u)*1.5) rgba(255,200,90,.8))}
@keyframes mc-g-thu{0%{transform:scale(.2) translateY(30%);opacity:0}100%{transform:none;opacity:1}}
.mc-goi .mc-g-tg{font-size:calc(var(--u)*1.05);font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--mc-vang-noi);margin-top:calc(var(--u)*.6);animation:mc-g-chu .4s .3s both}
.mc-goi .mc-g-tl{font-size:calc(var(--u)*5.4);font-weight:800;line-height:1.05;text-shadow:0 .06em .3em rgba(0,0,0,.5);animation:mc-g-chu .45s .38s both;white-space:nowrap}
.mc-goi .mc-g-tp{font-size:calc(var(--u)*1.5);font-weight:600;color:rgb(255,233,189);margin-top:calc(var(--u)*.5);animation:mc-g-chu .4s .5s both}
.mc-goi .mc-g-tp b{color:rgb(255,255,255)}
@keyframes mc-g-chu{from{opacity:0;transform:translateY(.4em)}to{opacity:1;transform:none}}
.mc-goi.mc-ve .mc-g-cum{transition:transform .42s cubic-bezier(.5,0,.2,1),opacity .42s}
.mc-goi.mc-ve .mc-g-hat,.mc-goi.mc-ve .mc-g-vong,.mc-goi.mc-ve .mc-g-tia{opacity:0;transition:opacity .2s}
/* 9 · BẢNG CHI TIẾT HỌC SINH (kính, trượt từ phải) */
.mc-ct-mo{position:fixed;inset:0;z-index:80;background:rgba(10,12,18,.35);opacity:0;pointer-events:none;transition:opacity .3s}
.mc-ct-mo.mc-mo{opacity:1;pointer-events:auto}
.mc-ct{position:fixed;top:0;right:0;bottom:0;width:68%;z-index:81;transform:translateX(104%);transition:transform .45s cubic-bezier(.2,.9,.2,1);background:rgba(19,23,36,.9);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);border-left:1px solid rgba(255,255,255,.12);
  color:rgb(238,241,248);font:500 max(12px,calc(var(--u)*.85))/1.4 var(--mc-sans);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto 1fr auto;padding:calc(var(--u)*1) calc(var(--u)*1.3) calc(var(--u)*.6);gap:calc(var(--u)*.75);overflow:hidden}
.mc-ct.mc-mo{transform:none}
.mc-ct button{font:inherit;color:inherit;border:0;cursor:pointer;background:none}
.mc-ct .mc-ct-dong{position:absolute;top:calc(var(--u)*.9);right:calc(var(--u)*1);width:calc(var(--u)*2.4);height:calc(var(--u)*2.4);min-width:32px;min-height:32px;border-radius:50%;background:rgba(255,255,255,.1);font-size:calc(var(--u)*1.3);line-height:1}
.mc-ct-dau{display:grid;grid-template-columns:calc(var(--u)*6.6) minmax(0,1fr);gap:calc(var(--u)*1.2);align-items:center;padding-right:calc(var(--u)*3)}
.mc-ct-anh{width:calc(var(--u)*6.6);height:calc(var(--u)*6.6);border-radius:28%;background:radial-gradient(circle at 50% 38%,rgba(255,220,150,.45),rgba(255,255,255,.04) 70%);border:1px solid rgba(255,255,255,.12);display:grid;place-items:center;overflow:hidden}
.mc-ct-anh img{width:88%;height:88%;object-fit:contain}
.mc-ct-dau h2{margin:0;font-size:calc(var(--u)*1.9);font-weight:800;line-height:1.1}
.mc-ct-chips{display:flex;flex-wrap:wrap;gap:.5em;margin:.35em 0 0;font-size:.95em;color:rgb(201,208,224)}
/* thanh tiến độ EXP trong bảng chi tiết học sinh (hoàn thiện bản vẽ 28/09) */
.mc-exp-cap{margin-top:calc(var(--u)*.6);max-width:calc(var(--u)*30)}
.mc-exp-dong{display:flex;justify-content:space-between;gap:1em;font:600 calc(var(--u)*.9) var(--mc-sans)}
.mc-exp-dong span{color:rgb(154,163,184)}
.mc-exp-ray{height:calc(var(--u)*.55);border-radius:1em;background:rgba(255,255,255,.1);overflow:hidden;margin-top:.3em}
.mc-exp-ray i{display:block;height:100%;border-radius:inherit;background:var(--mc-vang-noi)}
.mc-chip{display:inline-flex;align-items:center;gap:.35em;border-radius:2em;padding:.15em .7em;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.1);font-weight:600;white-space:nowrap}
.mc-chip.mc-vuot{background:rgba(76,179,95,.25);border-color:rgba(76,179,95,.6)}
.mc-chip.mc-dung{background:rgba(53,182,164,.22);border-color:rgba(53,182,164,.5)}
.mc-chip.mc-tre12,.mc-chip.mc-tre3{background:rgba(240,165,58,.22);border-color:rgba(240,165,58,.55)}
.mc-cau-nay{background:linear-gradient(135deg,rgba(255,210,122,.14),rgba(255,255,255,.05));border:1px solid rgba(255,210,122,.35);border-radius:calc(var(--u)*.9);padding:calc(var(--u)*.7) calc(var(--u)*.9);display:grid;grid-template-columns:calc(var(--u)*13) minmax(0,1fr);gap:calc(var(--u)*1.2)}
.mc-cau-nay h4,.mc-the-ct h4{grid-column:1/-1;margin:0 0 .4em;font-size:.82em;letter-spacing:.05em;text-transform:uppercase;font-weight:800}
.mc-cau-nay h4{color:var(--mc-vang-noi)}
.mc-tong .mc-ct-lan{font-size:calc(var(--u)*2.3);font-weight:800;line-height:1}
.mc-tong .mc-ct-lan small{font-size:.45em;color:rgb(170,178,197);font-weight:600}
.mc-tong .mc-ds{display:flex;gap:.4em;margin:.35em 0}
.mc-tong .mc-gan{font-size:.92em;color:rgb(201,208,224)}
.mc-kq{font-weight:800;font-size:.85em;border-radius:1em;padding:.05em .6em;white-space:nowrap}
.mc-kq.mc-dat{background:rgba(76,179,95,.3);color:rgb(184,240,194)}.mc-kq.mc-kd{background:rgba(229,83,75,.3);color:rgb(255,196,191)}
.mc-dtg{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*10),1fr));gap:calc(var(--u)*.6);align-content:start;max-height:calc(var(--u)*14);overflow:auto}
.mc-lanlam{position:relative;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-left:.35em solid var(--c,rgb(107,114,128));border-radius:calc(var(--u)*.6);padding:.45em .6em;line-height:1.4;font-size:.92em}
.mc-lanlam.mc-dung{--c:rgb(76,179,95)}.mc-lanlam.mc-sai{--c:rgb(229,83,75)}
.mc-lanlam .mc-gio{font-weight:700}
.mc-lanlam .mc-kq2{font-weight:800}.mc-lanlam.mc-dung .mc-kq2{color:rgb(155,227,168)}.mc-lanlam.mc-sai .mc-kq2{color:rgb(255,170,163)}
.mc-lanlam .mc-ph{color:rgb(170,178,197)}
.mc-lanlam .mc-ng{display:inline-block;margin-top:.25em;font-size:.85em;font-weight:700;border-radius:1em;padding:0 .55em;background:rgba(142,202,230,.2);border:1px solid rgba(142,202,230,.4)}
.mc-ct-luoi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:calc(var(--u)*.8);min-height:0}
.mc-the-ct{background:rgba(255,255,255,.065);border:1px solid rgba(255,255,255,.12);border-radius:calc(var(--u)*.9);padding:calc(var(--u)*.7) calc(var(--u)*.9);min-height:0;overflow:auto;display:flex;flex-direction:column}
.mc-the-ct h4{color:rgb(170,178,197)}
.mc-rong{color:rgb(142,151,171)}
.mc-vong-so{position:relative;width:calc(var(--u)*5.6);height:calc(var(--u)*5.6)}
.mc-vong-so svg{width:100%;height:100%;transform:rotate(-90deg)}
.mc-vong-so div{position:absolute;inset:0;display:grid;place-content:center;text-align:center;line-height:1.1}
.mc-vong-so b{font-size:calc(var(--u)*1.25)}
.mc-vong-so span{font-size:.72em;color:rgb(170,178,197)}
.mc-cd{display:flex;gap:calc(var(--u)*1);align-items:center}
.mc-bd{width:100%;flex:1;min-height:calc(var(--u)*6)}
.mc-chu-giai{display:flex;flex-wrap:wrap;gap:1em;font-size:.82em;color:rgb(170,178,197);margin-top:.3em}
.mc-chu-giai i{display:inline-block;width:.8em;height:.8em;border-radius:.2em;margin-right:.3em;vertical-align:-.05em}
.mc-nhiet{display:grid;gap:.28em}
.mc-nhiet .mc-d{display:grid;grid-template-columns:minmax(0,8em) minmax(0,1fr) 2.8em 6.4em;gap:.6em;align-items:center;font-size:.95em}
.mc-nhiet .mc-th{height:1.05em;border-radius:.3em;background:rgba(255,255,255,.08);position:relative;overflow:hidden}
.mc-nhiet .mc-th i{position:absolute;left:0;top:0;bottom:0;border-radius:.3em}
.mc-nhiet .mc-moc{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.35)}
.mc-nhiet b{text-align:right}
.mc-hang{white-space:nowrap;font-size:.76em;font-weight:800;border-radius:.4em;padding:.05em .45em;text-align:center;color:rgb(17,17,17)}
.mc-L1{background:rgb(229,83,75)}.mc-L2{background:rgb(240,165,58)}.mc-L3{background:rgb(53,182,164)}.mc-L4{background:rgb(76,179,95)}
.mc-ds-dong{display:grid;gap:.25em}
.mc-ds-dong .mc-r{display:grid;grid-template-columns:5.2em 1fr auto;gap:.6em;align-items:center;padding:.22em .45em;border-radius:.4em;background:rgba(255,255,255,.04)}
.mc-ds-dong .mc-r span{color:rgb(170,178,197)}
.mc-diem{white-space:nowrap;font-size:calc(var(--u)*3.2);font-weight:800;line-height:1;color:var(--mc-vang-noi)}
.mc-diem small{font-size:.35em;color:rgb(170,178,197)}
.mc-ct-chan{font-size:.78em;color:rgb(142,151,171);display:flex;justify-content:space-between;gap:1em}
@media (prefers-reduced-motion: reduce){
  .mc-goi *,.mc-ct,.mc-ct-mo,body.mc-bc .mc-vung-de>*,body.mc .mc-giai .sol-box>*,.mc-em.mc-pop{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important}
}
@media print{.mc-phim-nhom,.mc-tiep-bar,.mc-trang-so,.mc-con-nua,canvas.mc-but,.mc-but-cu,.mc-phu-lop,.mc-ct,.mc-ct-mo,.mc-goi,.mc-bao{display:none!important}}
`

// ───────────────────────── JS TRONG TỜ ─────────────────────────
/** Mã chạy trong tờ, nhúng SAU script chính + bố cục + cầu nối. Cần các móc của script chính: `__mcDot`, `__mcDen`, `__mcSoDot`,
 * `__mcLenBang`, sự kiện `mc-vao-dot` / `mc-doi-pha`; và của cầu nối: `__mcHoiHoSo` (vắng khi tờ mở riêng). */
export function jsLenBangMoi(tuy: { cauNoi?: boolean } = {}): string {
  // Tờ KHÔNG có cầu nối thì không có ô chấm nào: mã không nhắc tới lớp của ô chấm (hợp đồng `to-chieu-cau-noi.ts`).
  const CHAM = tuy.cauNoi ? "'.mc-cham'" : 'null'
  return `
(function () {
  var body = document.body, ray = document.getElementById('mc-ray');
  if (!ray) return;
  var CHAM = ${CHAM};
  function oCham(g) { return CHAM ? $$(g, CHAM) : []; }
  var S = { tk: false, but: false, mau: 'rgb(229,72,77)', tay: false, soGo: '', ketQua: {}, daGoi: {} };
  function $$(g, s) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function dot() { return window.__mcDot ? window.__mcDot() : null; }
  function soDot() { return window.__mcSoDot ? window.__mcSoDot() : $$(ray, '.mc-dot').length; }
  function chiSo() { return window.__mcChiSo ? window.__mcChiSo() : 0; }
  function pha() { return body.getAttribute('data-pha') || ''; }
  function daGoi() { var p = pha(); return p === 'chua' || p === 'goi'; }
  function giamCD() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function u() { return Math.min(window.innerWidth, window.innerHeight * 16 / 9) / 100; }
  function tao(tag, cls, cha) { var e = document.createElement(tag); if (cls) e.className = cls; if (cha) cha.appendChild(e); return e; }
  function thoat(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var bao = tao('div', 'mc-bao', body), hBao = 0;
  function baoNhanh(chu, ms) { bao.textContent = chu; bao.classList.toggle('mc-hien', !!chu); clearTimeout(hBao); if (ms !== 0) hBao = setTimeout(function () { bao.classList.remove('mc-hien'); }, ms || 1400); }

  // ── KHỐI: đơn vị chia trang (không cắt giữa đoạn/hình/phương án/ý/mục lời giải) ──
  var HOP = '.mc-than,.mc-ds-pa,.mc-giai,.sol-box,.sol-wrap';
  function khoi(v) {
    var ra = [];
    function them(el) {
      if (el.hidden || el.classList.contains('mc-tiep-bar') || el.classList.contains('mc-trang-so') || el.classList.contains('mc-con-nua') || el.classList.contains('mc-che')) return;
      if (el.matches(HOP) || (el.classList.contains('sol-text') && el.querySelector('.sol-pa'))) { Array.prototype.forEach.call(el.children, them); return; }
      ra.push(el);
    }
    Array.prototype.forEach.call(v.children, them);
    return ra;
  }
  function phu(v, cls, tag) { var e = v.querySelector(':scope > .' + cls); if (!e) { e = tao(tag || 'div', cls); v.appendChild(e); } return e; }
  function dat(v, off) { Array.prototype.forEach.call(v.children, function (c) { if (c.classList.contains('mc-tiep-bar') || c.classList.contains('mc-trang-so') || c.classList.contains('mc-con-nua') || c.classList.contains('mc-che')) return; c.style.transform = off ? 'translateY(' + (-off) + 'px)' : ''; }); }
  function soCauCua(v) { var s = v.querySelector('.mc-de-so'); if (s) return s.textContent; var n = v.closest('.mc-nua'); var c = n && n.querySelector('.mc-cau-so'); return c ? c.textContent.split(' · ')[0] : 'Câu'; }

  /** CHIA TRANG một vùng đề theo khối (chờ gọi). Lưu mốc từng trang vào v.__trang. */
  function chiaTrang(v) {
    dat(v, 0); v.scrollTop = 0;
    $$(v, '.mc-ngoai').forEach(function (b) { b.classList.remove('mc-ngoai'); });
    var cs = getComputedStyle(v), pT = parseFloat(cs.paddingTop) || 0, pB = parseFloat(cs.paddingBottom) || 0;
    var H = v.clientHeight, hT = u() * 2.6 + 4, r0 = v.getBoundingClientRect().top;
    var ds = khoi(v).map(function (b) { var r = b.getBoundingClientRect(); return { b: b, tren: r.top - r0, duoi: r.bottom - r0 }; }).filter(function (x) { return x.duoi > x.tren; });
    var moc = [ds.length ? Math.min(pT, ds[0].tren) : pT], dau = moc[0], suc = H - pT - pB, suc2 = H - pT - pB - hT;
    ds.forEach(function (x) {
      if (x.duoi - dau <= suc + 1) return;
      var cao = x.duoi - x.tren;
      // khối VỪA một trang ⇒ sang trang mới ở đầu khối (không cắt giữa đoạn / hình / phương án / ý / mục lời giải)
      if (cao <= suc2 + 1 && x.tren > dau + 1) { dau = x.tren; moc.push(dau); suc = suc2; return; }
      // khối CAO HƠN một trang (đoạn dẫn rất dài): ngắt ở RANH GIỚI DÒNG bên trong khối
      var lh = parseFloat(getComputedStyle(x.b).lineHeight) || u() * 3;
      var an = 0;
      while (x.duoi - dau > suc + 1 && an++ < 50) {
        var ngat = x.tren + Math.floor((dau + suc - x.tren) / lh) * lh;
        if (ngat <= dau + 1) ngat = dau + suc;
        dau = ngat; moc.push(dau); suc = suc2;
      }
    });
    v.__moc = moc; v.__khoi = ds; v.__pT = pT; v.__hT = hT; v.__cuoiNd = ds.length ? ds[ds.length - 1].duoi : pT;
    if (!(v.__trang < moc.length)) v.__trang = 0;
  }
  function hienTrang(v, k) {
    var moc = v.__moc || [0];
    k = Math.max(0, Math.min(moc.length - 1, k)); v.__trang = k;
    var dau = moc[k], cuoi = k + 1 < moc.length ? moc[k + 1] : Infinity;
    // khối nằm hẳn ngoài trang thì ẩn; khối dài vắt qua nhiều trang thì hiện ở mọi trang nó chạm tới
    (v.__khoi || []).forEach(function (x) { x.b.classList.toggle('mc-ngoai', x.duoi <= dau + 1 || x.tren >= cuoi - 1); });
    dat(v, k ? dau - v.__pT - v.__hT : 0);
    // CHE phần dưới mốc trang sau (dòng bị cắt dở của khối dài) — trang nào cũng kết thúc gọn ở ranh giới dòng/khối
    var che = phu(v, 'mc-che'), dinh = (k ? v.__pT + v.__hT : dau) + (Math.min(cuoi, v.__cuoiNd || cuoi) - dau);
    che.style.top = Math.max(0, dinh) + 'px';
    che.classList.toggle('mc-hien', cuoi !== Infinity);
    var tiep = phu(v, 'mc-tiep-bar'), so = phu(v, 'mc-trang-so');
    tiep.innerHTML = '<b>' + thoat(soCauCua(v)) + '</b> (tiếp) · trang ' + (k + 1) + '/' + moc.length;
    tiep.classList.toggle('mc-hien', k > 0);
    so.innerHTML = moc.length > 1 ? 'Trang ' + (k + 1) + '/' + moc.length + ' ' + moc.map(function (_, i) { return '<i class="' + (i === k ? 'mc-o' : '') + '"></i>'; }).join('') + ' <kbd>Space</kbd>' : '';
    so.classList.toggle('mc-hien', moc.length > 1);
    v.setAttribute('data-trang', (k + 1) + '/' + moc.length);
  }
  function conNua(v) {
    var c = phu(v, 'mc-con-nua');
    if (!c.textContent) c.textContent = 'còn nữa ↓';
    if (c !== v.lastElementChild) v.appendChild(c);
    c.classList.toggle('mc-hien', v.classList.contains('mc-cuon') && v.scrollTop + v.clientHeight < v.scrollHeight - 2);
  }
  function xep() {
    var d = dot(); if (!d) return;
    $$(d, '.mc-vung-de').forEach(function (v) {
      if (daGoi() || lgMo()) {
        if (!v.classList.contains('mc-cuon')) {
          var giu = v.__moc ? (v.__moc[v.__trang || 0] || 0) : 0;
          v.classList.add('mc-cuon'); dat(v, 0);
          $$(v, '.mc-ngoai').forEach(function (b) { b.classList.remove('mc-ngoai'); });
          v.scrollTop = Math.max(0, giu - (v.__pT || 0));
        }
        ['mc-tiep-bar', 'mc-trang-so', 'mc-che'].forEach(function (c) { var e = v.querySelector(':scope > .' + c); if (e) e.classList.remove('mc-hien'); });
        v.removeAttribute('data-trang');
        conNua(v);
        if (!v.__ngheCuon) { v.__ngheCuon = true; v.addEventListener('scroll', function () { conNua(v); }); }
      } else {
        v.classList.remove('mc-cuon');
        var cn = v.querySelector(':scope > .mc-con-nua'); if (cn) cn.classList.remove('mc-hien');
        var k = v.__trang || 0; chiaTrang(v); hienTrang(v, k);
      }
    });
  }
  window.__mcXepTrang = xep;
  /** Lật trang / cuộn một khung. Trả false nếu đã ở trang cuối. */
  function xuong(huong) {
    var d = dot(); if (!d) return false;
    var vs = $$(d, '.mc-vung-de'), moi = false;
    vs.forEach(function (v) {
      if (v.classList.contains('mc-cuon')) {
        var truoc = v.scrollTop;
        v.scrollTop = truoc + huong * Math.max(40, v.clientHeight - u() * 3);
        if (v.scrollTop !== truoc) moi = true;
        conNua(v);
      } else {
        var k = (v.__trang || 0) + huong;
        if (v.__moc && k >= 0 && k < v.__moc.length) { hienTrang(v, k); moi = true; }
      }
    });
    return moi;
  }

  // ── LỜI GIẢI HIỆN DẦN ──
  function donVi(g) {
    var box = g.querySelector('.sol-box') || g, ra = [], nhan = [];
    Array.prototype.forEach.call(box.children, function (el) {
      if (el.classList.contains('sol-label')) { nhan.push(el); return; }
      if (el.classList.contains('sol-text') && el.querySelector('.sol-pa')) {
        $$(el, '.sol-pa').forEach(function (p, i) { ra.push((i === 0 ? nhan.concat([el]) : []).concat([p])); });
        nhan = []; return;
      }
      ra.push(nhan.concat([el])); nhan = [];
    });
    if (nhan.length) ra.push(nhan);
    return ra;
  }
  function veLoiGiai(g) {
    var ds = donVi(g), k = Math.min(g.__buoc || 0, ds.length);
    ds.forEach(function (dv, i) { dv.forEach(function (el) {
      if (el.classList.contains('sol-text') && el.querySelector('.sol-pa')) { el.classList.remove('mc-buoc-an', 'mc-buoc-cu', 'mc-buoc-nay'); if (i >= k) el.classList.add('mc-buoc-an'); return; }
      el.classList.toggle('mc-buoc-an', i >= k); el.classList.toggle('mc-buoc-cu', i < k - 1); el.classList.toggle('mc-buoc-nay', i === k - 1);
    }); });
    var dem = g.querySelector(':scope > .mc-giai-dem');
    if (!dem) { dem = tao('span', 'mc-giai-dem'); g.insertBefore(dem, g.firstChild); }
    dem.textContent = 'Lời giải · Space: hiện tiếp · ' + k + '/' + ds.length;
    // ý a–d / phương án đang nói tới sáng lên trong đề
    var nua = g.closest('.mc-nua') || g.closest('.mc-dot'), hienTai = k > 0 ? ds[k - 1] : null, khoa = '';
    if (hienTai) hienTai.forEach(function (el) { if (el.classList.contains('sol-pa')) { var s = el.querySelector('strong'); khoa = s ? s.textContent.replace(/[.)\s]/g, '').toLowerCase() : ''; } });
    var dung = k > 0 ? $$(g, '.sol-pa.chon strong').map(function (s) { return s.textContent.replace(/[.)\s]/g, '').toLowerCase(); }) : [];
    if (nua) $$(nua, '.mc-vung-de .mc-pa').forEach(function (p) {
      var ky = p.querySelector('.mc-ky'), t = ky ? ky.textContent.replace(/[.)\s]/g, '').toLowerCase() : '';
      p.classList.toggle('mc-y-sang', !!khoa && t === khoa);
      p.classList.toggle('mc-pa-dung', !!ky && dung.indexOf(t) >= 0 && /^[A-D]$/.test(ky.textContent.trim()));
    });
    return ds.length;
  }
  function moLoiGiai(mo) {
    var d = dot(); if (!d) return;
    $$(d, '.mc-giai').forEach(function (g) {
      g.hidden = !mo;
      g.style.display = mo ? 'block' : 'none';
      g.__buoc = mo ? 1 : 0;
      var nut = d.querySelector('.mc-nut-giai[aria-controls="' + g.id + '"]');
      if (nut) { nut.setAttribute('aria-expanded', mo ? 'true' : 'false'); var c = nut.querySelector('.mc-nut-chu'); if (c) c.textContent = mo ? 'Ẩn lời giải' : 'Hiện lời giải'; }
      if (mo) veLoiGiai(g); else $$(d, '.mc-pa').forEach(function (p) { p.classList.remove('mc-y-sang', 'mc-pa-dung'); });
    });
    xep();
    if (mo) {
      setTimeout(function () {
        var g = d.querySelector('.mc-giai:not([hidden])');
        if (g) {
          try { g.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (x) {}
        }
        denBuoc();
      }, 50);
    }
    veThanh();
    try { document.dispatchEvent(new CustomEvent('mc-giai-doi', { detail: { mo: mo } })); } catch (x) {}
  }
  function lgMo() { var d = dot(); return !!(d && d.querySelector('.mc-giai:not([hidden])')); }
  function denBuoc() {
    var d = dot(); if (!d) return;
    $$(d, '.mc-giai:not([hidden])').forEach(function (g) {
      var v = g.closest('.mc-vung-de'), b = g.querySelector('.mc-buoc-nay') || g.querySelector('.mc-giai-dem');
      if (!v || !b) return;
      if (v.classList.contains('mc-cuon')) {
        var rv = v.getBoundingClientRect(), rb = b.getBoundingClientRect();
        if (rb.bottom > rv.bottom - u() * 2) v.scrollTop += rb.bottom - rv.bottom + u() * 3;
        else if (rb.top < rv.top) v.scrollTop -= rv.top - rb.top + u();
        conNua(v); return;
      }
      var r0 = v.getBoundingClientRect().top, cu = v.__trang || 0;
      dat(v, 0); var tren = b.getBoundingClientRect().top - r0; hienTrang(v, cu);
      var k = 0; (v.__moc || [0]).forEach(function (m, i) { if (m <= tren + 1) k = i; });
      if (k !== cu) hienTrang(v, k);
    });
  }
  function space() {
    var d = dot(), tien = false;
    if (d) $$(d, '.mc-giai:not([hidden])').forEach(function (g) { var n = donVi(g).length; if ((g.__buoc || 0) < n) { g.__buoc = (g.__buoc || 0) + 1; veLoiGiai(g); tien = true; } });
    if (tien) { denBuoc(); return; }
    if (!xuong(1)) baoNhanh('Hết câu — bấm → để sang đợt sau');
  }

  // ── THANH DƯỚI: nhóm nút phím ──
  var thanh = document.getElementById('mc-thanh'), nhom = document.getElementById('mc-phim-nhom');
  function veThanh() {
    if (!nhom) return;
    var p = pha(), noi = body.classList.contains('mc-noi');
    $$(nhom, '[data-k]').forEach(function (b) {
      var k = b.getAttribute('data-k');
      if (k === 'D' || k === 'K') b.hidden = !(p === 'chua' && noi);
      // "Thầy chữa" (05/10): có khi tờ đã nối app và đợt này còn nút chưa bấm; đợt đã thầy chữa thì ẩn.
      if (k === 'C') { var dc = dot(); b.hidden = !(noi && dc && dc.querySelector('.mc-thay-chua[data-trang="cho"]')); }
      if (k === 'C') { if (thayChuaDot()) body.setAttribute('data-dot-thay-chua', ''); else body.removeAttribute('data-dot-thay-chua'); }
      if (k === 'G') { b.classList.toggle('mc-bat', lgMo()); var c = b.querySelector('.mc-nut-chu'); if (c) c.textContent = lgMo() ? 'Ẩn giải' : 'Giải'; }
      if (k === 'T') b.classList.toggle('mc-bat', S.tk);
      if (k === 'B') b.classList.toggle('mc-bat', S.but);
    });
  }
  if (nhom) nhom.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-k]'); if (b) lenh(b.getAttribute('data-k')); });

  // ── D / K: ghi Đạt / Chưa đạt qua cầu nối (ô đầu tiên chưa ghi của đợt) ──
  function cham(dat) {
    if (pha() === 'cho' && window.__mcLenBang) {
      window.__mcLenBang();
    }
    if (pha() !== 'chua') { baoNhanh('Gọi em lên bảng trước (L)'); return; }
    if (!body.classList.contains('mc-noi')) {
      dauKq(String(chiSo()), dat);
      baoNhanh('Tờ chưa nối với app thầy — đã ghi: ' + (dat ? 'Đạt' : 'Chưa đạt'));
      return;
    }
    var d = dot(), v = d && CHAM ? d.querySelector(CHAM + '[data-cham="cho"]') : null;
    if (!v) {
      var daGhi = d && CHAM ? d.querySelector(CHAM) : null;
      var kx = (daGhi && daGhi.getAttribute('data-khoa')) || String(chiSo());
      dauKq(kx, dat);
      return;
    }
    var nut = v.querySelector(CHAM + '-nut[data-kq="' + (dat ? '1' : '0') + '"]');
    if (nut) { S.choGhi = { khoa: v.getAttribute('data-khoa'), dat: dat }; nut.click(); baoNhanh('Đang ghi: ' + (dat ? 'Đạt' : 'Chưa đạt')); }
    else { dauKq(v.getAttribute('data-khoa') || String(chiSo()), dat); }
  }
  function dauKq(khoa, dat) {
    S.ketQua[khoa] = dat ? 'dat' : 'kd';
    S.ketQua[chiSo()] = dat ? 'dat' : 'kd';
    var v = null; oCham(ray).forEach(function (x) { if (x.getAttribute('data-khoa') === khoa) v = x; });
    var nua = v && v.closest('.mc-nua'), p = nua && nua.querySelector('.mc-dau-kq');
    if (!p) {
      var d = dot();
      p = d ? d.querySelector('.mc-dau-kq') : null;
      if (!p && d) {
        var th = d.querySelector('.mc-ten-hang');
        if (th) p = tao('span', 'mc-dau-kq', th);
      }
    }
    if (p) { p.hidden = false; p.className = 'mc-dau-kq ' + (dat ? 'mc-dat' : 'mc-kd'); p.textContent = dat ? 'Đạt' : 'Chưa đạt'; }
    baoNhanh('Đã ghi: ' + (dat ? 'Đạt' : 'Không đạt'));
  }
  document.addEventListener('mc-da-cham', function (e) {
    var d = (e && e.detail) || {};
    var dat = typeof d.dat === 'boolean' ? d.dat : (S.choGhi && S.choGhi.khoa === d.khoa ? S.choGhi.dat : null);
    if (dat !== null) dauKq(String(d.khoa), dat);
  });
  // bấm nút cũ trực tiếp (vẫn có trong DOM) cũng nhớ để gắn nhãn
  if (CHAM) document.addEventListener('click', function (e) { var n = e.target.closest && e.target.closest(CHAM + '-nut'); if (n) { var v = n.closest(CHAM); if (v) S.choGhi = { khoa: v.getAttribute('data-khoa'), dat: n.getAttribute('data-kq') === '1' }; } }, true);

  // ── T · thống kê ──
  function batTk() {
    S.tk = !S.tk; body.classList.toggle('mc-co-tk', S.tk); xep(); veThanh();
    var d = dot();
    if (S.tk && d && !d.querySelector('.mc-tk')) baoNhanh('Chưa có số liệu lớp cho câu này', 1800);
  }

  // ── B · bút ──
  var cv = tao('canvas', 'mc-but', body), g2 = cv.getContext ? cv.getContext('2d') : null, butCu = tao('div', 'mc-but-cu', body);
  function coCanvas() { if (!g2) return; var dpr = window.devicePixelRatio || 1; cv.width = Math.round(window.innerWidth * dpr); cv.height = Math.round(window.innerHeight * dpr); g2.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function xoaBut() { if (g2) { g2.save(); g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(0, 0, cv.width, cv.height); g2.restore(); } }
  function veButCu() {
    var MAU = [['rgb(229,72,77)', 'Đỏ'], ['rgb(36,86,201)', 'Xanh dương'], ['rgb(31,157,85)', 'Xanh lá']];
    butCu.innerHTML = 'Bút' + MAU.map(function (m) { return '<button type="button" class="mc-m' + (!S.tay && S.mau === m[0] ? ' mc-chon' : '') + '" style="background:' + m[0] + '" data-m="' + m[0] + '" aria-label="' + m[1] + '"></button>'; }).join('') +
      '<button type="button" class="mc-n' + (S.tay ? ' mc-chon' : '') + '" data-tay="1">Tẩy</button><button type="button" class="mc-n" data-xoa="1">Xoá hết</button><button type="button" class="mc-n" data-tat="1">Tắt (B)</button>';
  }
  butCu.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.getAttribute('data-m')) { S.mau = b.getAttribute('data-m'); S.tay = false; }
    if (b.getAttribute('data-tay')) S.tay = true;
    if (b.getAttribute('data-xoa')) xoaBut();
    if (b.getAttribute('data-tat')) { batBut(); return; }
    veButCu();
  });
  var dangVe = false, truoc = null;
  cv.addEventListener('pointerdown', function (e) { if (!S.but) return; dangVe = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} truoc = { x: e.clientX, y: e.clientY }; });
  cv.addEventListener('pointermove', function (e) {
    if (!dangVe || !g2) return;
    g2.globalCompositeOperation = S.tay ? 'destination-out' : 'source-over';
    g2.strokeStyle = S.mau; g2.lineCap = 'round'; g2.lineJoin = 'round'; g2.lineWidth = u() * (S.tay ? 2.2 : 0.35);
    g2.beginPath(); g2.moveTo(truoc.x, truoc.y); g2.lineTo(e.clientX, e.clientY); g2.stroke(); truoc = { x: e.clientX, y: e.clientY };
  });
  ['pointerup', 'pointercancel'].forEach(function (t) { cv.addEventListener(t, function () { dangVe = false; }); });
  function batBut() { S.but = !S.but; if (S.but && !cv.width) coCanvas(); body.classList.toggle('mc-co-but', S.but); veButCu(); veThanh(); }
  window.addEventListener('resize', function () { if (cv.width) { coCanvas(); } });
  veButCu();

  // ── lớp phủ: phóng hình / tổng quan / phím ──
  var phong = tao('div', 'mc-phu-lop mc-phong', body), luoi = tao('div', 'mc-phu-lop mc-luoi', body), phim = tao('div', 'mc-phu-lop mc-phim', body);
  phong.addEventListener('click', function () { phong.classList.remove('mc-mo'); });
  ray.addEventListener('click', function (e) {
    var im = e.target.closest && e.target.closest('.mc-vung-de img');
    if (!im || S.but) return;
    phong.innerHTML = '<div class="mc-ruot"><img alt="' + thoat(im.alt || 'Hình trong đề') + '" src="' + thoat(im.src) + '"></div><div class="mc-gc">Bấm hoặc Esc để đóng</div>';
    phong.classList.add('mc-mo');
  });
  function moLuoi() {
    var ds = $$(ray, ':scope > .mc-dot'), h = '<h2>Tổng quan buổi chữa <span>Bấm thẻ, hoặc gõ số đợt rồi Enter · Tab/Esc để đóng</span></h2><div class="mc-ds">';
    ds.forEach(function (d, i) {
      var cau = $$(d, '.mc-cau-so').map(function (c) { return c.textContent; }).join(' + ') || (d.classList.contains('mc-dot-da') ? 'Trang đáp án' : '');
      var kq = oCham(d).map(function (v) { return S.ketQua[v.getAttribute('data-khoa')]; }).filter(Boolean);
      // LUẬT 4: chỉ ĐỢT ĐÃ GỌI mới có tên em
      var ten = S.daGoi[i] ? $$(d, '.mc-ten').map(function (t) { return t.textContent; }).join(', ') : '';
      var tt = i === chiSo() ? '<span class="mc-tt mc-dang">Đang chiếu</span>' : kq.length ? '<span class="mc-tt ' + (kq.indexOf('kd') >= 0 ? 'mc-kd' : 'mc-dat') + '">' + (kq.indexOf('kd') >= 0 ? 'Chưa đạt' : 'Đạt') + '</span>' : S.daGoi[i] ? '<span class="mc-tt">Đã gọi</span>' : '<span class="mc-tt">Chưa chữa</span>';
      h += '<button type="button" class="mc-the-dot' + (i === chiSo() ? ' mc-dang' : '') + '" data-i="' + i + '"><b>Đợt ' + (i + 1) + '</b>' + thoat(cau) + (ten ? '<br>' + thoat(ten) : '') + '<br>' + tt + '</button>';
    });
    luoi.innerHTML = h + '</div>'; luoi.classList.add('mc-mo');
  }
  luoi.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.mc-the-dot'); if (b) { luoi.classList.remove('mc-mo'); toiDot(+b.getAttribute('data-i')); } });
  function moPhim() {
    var ds = [['L', 'Gọi em lên bảng (hiệu ứng gọi tên)'], ['G', 'Mở / đóng lời giải (ngay dưới đề, trong 2/3)'], ['Space', 'Lời giải đang mở: hiện mục tiếp — hết mục thì lật trang / cuộn'],
      ['↓ PageDown', 'Chờ gọi: lật trang của câu · Đang chữa: cuộn một khung'], ['↑ PageUp', 'Trang trước / cuộn lên'], ['← →', 'Đổi đợt'],
      ['C', 'Thầy chữa câu này (không gọi em)'], ['D / K', 'Ghi Đạt / Chưa đạt'], ['T', 'Dải thống kê cả lớp'], ['B', 'Bút vẽ (3 màu, tẩy)'], ['Tab', 'Lưới tổng quan các đợt'], ['số + Enter', 'Nhảy tới đợt'], ['Home / End', 'Đợt đầu / cuối'], ['F', 'Toàn màn hình'], ['Esc', 'Đóng lớp đang mở'], ['?', 'Bảng này']];
    phim.innerHTML = '<div class="mc-h"><h2>Phím tắt</h2><dl>' + ds.map(function (x) { return '<dt>' + x[0].split(' ').map(function (k) { return k === '/' || k === '+' || k === 'số' ? k : '<kbd>' + k + '</kbd>'; }).join(' ') + '</dt><dd>' + x[1] + '</dd>'; }).join('') + '</dl></div>';
    phim.classList.add('mc-mo');
  }
  phim.addEventListener('click', function () { phim.classList.remove('mc-mo'); });

  // ── 9 · BẢNG CHI TIẾT HỌC SINH ──
  var ctMo = tao('div', 'mc-ct-mo', body), ct = tao('aside', 'mc-ct', body);
  ct.setAttribute('aria-label', 'Chi tiết học sinh');
  ctMo.addEventListener('click', dongCt);
  function dongCt() { ct.classList.remove('mc-mo'); ctMo.classList.remove('mc-mo'); }
  var THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function gioVn(iso) { var t = Date.parse(iso); if (!isFinite(t)) return { ngay: '—', gio: '' }; var d = new Date(t + 7 * 3600e3), p = function (n) { return (n < 10 ? '0' : '') + n; }; return { ngay: THU[d.getUTCDay()] + ' ' + p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1), gio: p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()), ngan: p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) }; }
  function tenCau(qid) { var m = /-(III|II|I)-(\\d+)$/.exec(String(qid || '')); return m ? 'Câu ' + m[2] + ' · Phần ' + m[1] : String(qid || '—'); }
  function vongSo(p, mau, chu) { var R = 42, C = 2 * Math.PI * R; return '<div class="mc-vong-so"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/><circle cx="50" cy="50" r="' + R + '" fill="none" stroke="' + mau + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (C * p).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg><div><b>' + Math.round(p * 100) + '%</b><span>' + chu + '</span></div></div>'; }
  var RONG = '<div class="mc-rong">—</div>';
  /** THANH TIẾN ĐỘ EXP (hoàn thiện bản vẽ 28/09): cấp · EXP trong thanh / mốc cấp sau — số thật từ \`/gv/ho-so-len-bang\` \`tienDoCap\`. Vắng ⇒ không vẽ. */
  function thanhCap(t) {
    if (!t || typeof t.cap !== 'number') return '';
    if (t.toiDa || !t.moc) return '<div class="mc-exp-cap" aria-label="Cấp ' + t.cap + ', đã tối đa"><div class="mc-exp-dong"><b>Cấp ' + t.cap + '</b><span>Đã đạt cấp tối đa</span></div><div class="mc-exp-ray"><i style="width:100%"></i></div></div>';
    var p = Math.max(0, Math.min(100, Math.round(t.exp / t.moc * 100)));
    return '<div class="mc-exp-cap" aria-label="Cấp ' + t.cap + ': ' + t.exp + ' trên ' + t.moc + ' EXP để lên cấp ' + (t.cap + 1) + '"><div class="mc-exp-dong"><b>Cấp ' + t.cap + '</b><span>' + t.exp.toLocaleString('vi-VN') + ' / ' + t.moc.toLocaleString('vi-VN') + ' EXP · lên cấp ' + (t.cap + 1) + '</span></div><div class="mc-exp-ray"><i style="width:' + p + '%"></i></div></div>';
  }
  function veCt(nua, hs, loi) {
    var anh = nua.querySelector('img.mc-thu-anh'), ten = nua.querySelector('.mc-ten'), thuTen = nua.querySelector('.mc-thu-ten'), cap = nua.querySelector('.mc-thu-cap b'), cauSo = nua.querySelector('.mc-cau-so');
    var the = nua.querySelector('.mc-em'), em = (hs && hs.em) || {}, lop = (the && the.getAttribute('data-lop')) || em.tenLop || em.lop || '';
    var h = '<button type="button" class="mc-ct-dong" aria-label="Đóng">✕</button><div class="mc-ct-dau"><div class="mc-ct-anh">' + (anh ? '<img alt="" src="' + thoat(anh.src) + '">' : '') + '</div><div><h2>' + thoat(ten ? ten.textContent : em.hoTen || '') + '</h2><div class="mc-ct-chips">' +
      (lop ? '<span class="mc-chip">Lớp ' + thoat(lop) + '</span>' : '') + (thuTen ? '<span class="mc-chip">' + thoat(thuTen.textContent) + (cap ? ' · ' + thoat(cap.textContent.split('/')[0]) : '') + '</span>' : '') +
      (typeof em.expTong === 'number' ? '<span class="mc-chip">' + em.expTong.toLocaleString('vi-VN') + ' EXP' + (typeof em.expHomNay === 'number' ? ' · hôm nay +' + em.expHomNay : '') + '</span>' : '') +
      (typeof em.chuoiNgay === 'number' ? '<span class="mc-chip">Chuỗi ' + em.chuoiNgay + ' ngày liền</span>' : '') + '</div>' + thanhCap(hs && hs.tienDoCap) + '</div></div>';
    if (!hs) {
      h += '<section class="mc-cau-nay"><h4>Câu này</h4><div class="mc-rong" style="grid-column:1/-1">' + thoat(loi === 'khong_noi' ? 'Chỉ xem được khi mở tờ chiếu từ app thầy (tờ đang mở riêng).' : loi === 'dang' ? 'Đang lấy số liệu từ máy chủ…' : 'Chưa lấy được số liệu từ máy chủ.') + '</div></section><div></div>';
    } else {
      var c = hs.cauNay;
      h += '<section class="mc-cau-nay"><h4>Câu này · ' + thoat(cauSo ? cauSo.textContent : '') + '</h4>';
      if (!c || !c.soLan) h += '<div class="mc-tong"><div class="mc-ct-lan">0 <small>lần làm</small></div></div><div class="mc-rong">Em chưa làm câu này lần nào.</div>';
      else {
        var cuoi = c.lan[c.lan.length - 1], gc = gioVn(cuoi.luc);
        h += '<div class="mc-tong"><div class="mc-ct-lan">' + c.soLan + ' <small>lần làm</small></div><div class="mc-ds"><span class="mc-kq mc-dat">Đúng ' + c.soDung + '</span><span class="mc-kq mc-kd">Sai ' + c.soSai + '</span></div><div class="mc-gan">Gần nhất: <b>' + (cuoi.dung ? 'đúng' : 'sai') + '</b> lúc ' + gc.gio + ' ' + gc.ngay + '</div></div><div class="mc-dtg">' +
          c.lan.map(function (x) { var g = gioVn(x.luc); return '<div class="mc-lanlam ' + (x.dung ? 'mc-dung' : 'mc-sai') + '"><div class="mc-gio">' + g.ngay + ' · ' + g.gio + '</div><div><span class="mc-kq2">' + (x.dung ? 'Đúng' : 'Sai') + '</span> · chọn <b>' + thoat(x.chon || '—') + '</b></div><div class="mc-ph">' + (x.coGoiY ? 'Có gợi ý' : 'Không gợi ý') + (x.giay != null ? ' · ' + x.giay + ' giây' : '') + '</div><span class="mc-ng">' + thoat(x.nguon) + '</span></div>'; }).join('') + '</div>';
      }
      h += '</section><div class="mc-ct-luoi">';
      var cd = hs.chienDich, NHIP = { vuot: ['Vượt nhịp', 'đã làm hơn mức cần'], dung: ['Đúng nhịp', 'làm đủ mức cần mỗi ngày'], tre12: ['Trễ 1–2 ngày', 'nên nhắc em làm bù'], tre3: ['Trễ từ 3 ngày', 'cần nhắc em ngay'] };
      h += '<section class="mc-the-ct"><h4>Chiến dịch đang theo</h4>' + (cd ? '<div style="font-weight:700;margin-bottom:.4em">' + thoat(cd.ten) + ' <span class="mc-rong">· hạn nộp ' + thoat(String(cd.hanNop).slice(8, 10) + '/' + String(cd.hanNop).slice(5, 7)) + '</span></div><div class="mc-cd">' + vongSo(cd.coXat, 'rgb(142,202,230)', 'cọ xát') + vongSo(cd.thanhThao, 'rgb(76,179,95)', 'thành thạo') + '</div><div style="margin-top:.5em"><span class="mc-chip mc-' + thoat(cd.nhip) + '">' + (NHIP[cd.nhip] || [cd.nhip])[0] + '</span> <span class="mc-rong">' + ((NHIP[cd.nhip] || [])[1] || '') + '</span></div>' : '<div class="mc-rong">Em không có chiến dịch đang chạy.</div>') + '</section>';
      var n14 = hs.ngay14;
      if (n14 && n14.length) {
        var W = 300, H = 110, bw = W / 14, mx = 1, cot = '', td = 0, ts = 0;
        n14.forEach(function (x) { mx = Math.max(mx, x.dung + x.sai); td += x.dung; ts += x.sai; });
        n14.forEach(function (x, i) { var k = (H - 18) / mx, X = i * bw + bw * .18, w = bw * .64, hd = x.dung * k, hsai = x.sai * k;
          cot += '<rect x="' + X.toFixed(1) + '" y="' + (H - 16 - hd).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hd.toFixed(1) + '" rx="2" fill="rgb(76,179,95)"/><rect x="' + X.toFixed(1) + '" y="' + (H - 16 - hd - hsai).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hsai.toFixed(1) + '" rx="2" fill="rgb(229,83,75)"/>';
          if (i % 2 === 1) cot += '<text x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (H - 3) + '" font-size="9" text-anchor="middle" fill="rgb(154,163,184)">' + x.ngay.slice(8, 10) + '/' + x.ngay.slice(5, 7) + '</text>'; });
        h += '<section class="mc-the-ct"><h4>Đúng / sai 14 ngày</h4><svg class="mc-bd" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Số câu đúng và sai 14 ngày">' + cot + '</svg><div class="mc-chu-giai"><span><i style="background:rgb(76,179,95)"></i>Đúng ' + td + '</span><span><i style="background:rgb(229,83,75)"></i>Sai ' + ts + '</span><span>Tỉ lệ đúng ' + (td + ts ? Math.round(td / (td + ts) * 100) + '%' : '—') + '</span></div></section>';
      } else h += '<section class="mc-the-ct"><h4>Đúng / sai 14 ngày</h4>' + RONG + '</section>';
      var CHU = { L1: 'Yếu', L2: 'Trung bình', L3: 'Khá', L4: 'Giỏi' };
      h += '<section class="mc-the-ct"><h4>Sức học theo dạng (30 ngày)</h4>' + (hs.dang && hs.dang.length ? '<div class="mc-nhiet">' + hs.dang.map(function (x) { var p = Math.round(x.tiLe * 100); return '<div class="mc-d"><span>' + thoat(x.ten) + '</span><span class="mc-th"><i class="mc-' + x.hang + '" style="width:' + p + '%"></i><span class="mc-moc" style="left:40%"></span><span class="mc-moc" style="left:65%"></span><span class="mc-moc" style="left:85%"></span></span><b>' + p + '%</b><span class="mc-hang mc-' + x.hang + '">' + x.hang + ' ' + CHU[x.hang] + '</span></div>'; }).join('') + '</div><div class="mc-chu-giai"><span><i class="mc-L1"></i>&lt;40%</span><span><i class="mc-L2"></i>40–65%</span><span><i class="mc-L3"></i>65–85%</span><span><i class="mc-L4"></i>&gt;85%</span></div>' : RONG) + '</section>';
      h += '<section class="mc-the-ct"><h4>5 câu sai gần nhất</h4>' + (hs.saiGanNhat && hs.saiGanNhat.length ? '<div class="mc-ds-dong">' + hs.saiGanNhat.map(function (x) { return '<div class="mc-r"><b>' + thoat(tenCau(x.qid)) + '</b><span>' + thoat(x.dang || x.nguon) + '</span><span>' + gioVn(x.luc).ngan + '</span></div>'; }).join('') + '</div>' : RONG) + '</section>';
      h += '<section class="mc-the-ct"><h4>Lịch sử lên bảng</h4>' + (hs.lenBang && hs.lenBang.length ? '<div class="mc-ds-dong">' + hs.lenBang.map(function (x) { return '<div class="mc-r"><b>' + gioVn(x.luc).ngan + '</b><span>' + thoat(tenCau(x.qid)) + '</span><span class="mc-kq ' + (x.dat ? 'mc-dat' : 'mc-kd') + '">' + (x.dat ? 'Đạt' : 'Chưa đạt') + '</span></div>'; }).join('') + '</div>' : '<div class="mc-rong">Lần đầu lên bảng.</div>') + '</section>';
      var ca = hs.caGanNhat;
      h += '<section class="mc-the-ct"><h4>Ca kiểm tra gần nhất</h4>' + (ca ? '<div class="mc-diem">' + String(ca.diem).replace('.', ',') + '<small> /10</small></div><div><b>' + thoat(ca.tenCa) + '</b><br><span class="mc-rong">nộp ' + gioVn(ca.luc).ngan + (typeof ca.diemTruoc === 'number' ? ' · lần trước ' + String(ca.diemTruoc).replace('.', ',') : '') + '</span></div>' : RONG) + '</section></div>';
    }
    h += '<div class="mc-ct-chan"><span>Bảng này hiện trên máy chiếu — cả lớp cùng thấy. Giờ Việt Nam.</span><span>Esc để đóng</span></div>';
    ct.innerHTML = h;
    var dong = ct.querySelector('.mc-ct-dong'); if (dong) dong.addEventListener('click', dongCt);
  }
  function moCt(nua) {
    if (!nua) return;
    var v = oCham(nua)[0] || oCham(nua.closest('.mc-dot') || nua)[0], khoa = nua.getAttribute('data-khoa') || (v ? v.getAttribute('data-khoa') : '');
    ct.classList.add('mc-mo'); ctMo.classList.add('mc-mo');
    if (!window.__mcHoiHoSo || !khoa) { veCt(nua, null, 'khong_noi'); return; }
    veCt(nua, null, 'dang');
    window.__mcHoiHoSo(khoa, function (hs, loi) { if (ct.classList.contains('mc-mo')) veCt(nua, hs, loi); });
  }
  ray.addEventListener('click', function (e) {
    var the = e.target.closest && e.target.closest('.mc-em[id]');
    if (!the || the.hidden || S.but) return;
    moCt(the.closest('.mc-nua') || the);
  });

  // ── ĐIỀU KHIỂN ──
  function toiDot(k) { if (window.__mcDen) window.__mcDen(Math.max(0, Math.min(soDot() - 1, k))); baoNhanh('Đợt ' + (chiSo() + 1) + ' / ' + soDot(), 900); }
  // "THẦY CHỮA" (05/10): bấm nút ẩn của đợt (cầu nối gửi app ghi); đợt đã thầy chữa thì không gọi em, không chấm em — phím L / D / K chỉ nhắc.
  function thayChua() {
    if (!body.classList.contains('mc-noi')) { baoNhanh('Tờ chưa nối với app thầy — chưa ghi được'); return; }
    var d = dot(), n = d ? d.querySelector('.mc-thay-chua[data-trang="cho"] .mc-thay-chua-nut') : null;
    if (!n) { baoNhanh('Câu này không ghi "Thầy chữa" được'); return; }
    n.click();
    baoNhanh('Đang ghi: Thầy chữa');
  }
  document.addEventListener('mc-noi', veThanh); // tờ vừa nối app (cầu nối): hiện nút chỉ dùng được khi có app
  document.addEventListener('mc-thay-chua', function () { veThanh(); baoNhanh('Đã ghi: Thầy chữa — không gọi em'); });
  function thayChuaDot() { var d = dot(); return !!(d && d.hasAttribute && d.hasAttribute('data-thay-chua')); }
  function lenh(k) {
    if ((k === 'L' || k === 'D' || k === 'K' || k === 'C') && thayChuaDot()) { baoNhanh('Câu này thầy chữa — không gọi em'); return; }
    switch (k) {
      case 'C': thayChua(); break;
      case 'L': if (pha() === 'cho' && window.__mcLenBang) window.__mcLenBang(); else if (daGoi()) baoNhanh('Em đã lên bảng'); break;
      case 'G': moLoiGiai(!lgMo()); break;
      case 'D': cham(true); break;
      case 'K': cham(false); break;
      case 'T': batTk(); break;
      case 'B': batBut(); break;
      case 'Tab': if (luoi.classList.contains('mc-mo')) luoi.classList.remove('mc-mo'); else moLuoi(); break;
      case '?': if (phim.classList.contains('mc-mo')) phim.classList.remove('mc-mo'); else moPhim(); break;
      case '→': toiDot(chiSo() + 1); break;
      case '←': toiDot(chiSo() - 1); break;
      case 'SP': space(); break;
      case '↓': if (!xuong(1)) baoNhanh('Hết câu — bấm → để sang đợt sau'); break;
      case '↑': xuong(-1); break;
      case 'H': toiDot(0); break;
      case 'E': toiDot(soDot() - 1); break;
    }
  }
  window.__mcLenh = lenh;
  window.__mcMoLoiGiai = moLoiGiai;
  window.__mcLgMo = lgMo;
  window.__mcTrangThai = function () {
    return { dot: chiSo(), soDot: soDot(), pha: pha(), lgMo: lgMo() };
  };
  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.closest && e.target.closest('input,textarea,select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'Escape') {
      if (S.soGo) { S.soGo = ''; baoNhanh(''); return; }
      var lop = [phim, luoi, phong].filter(function (x) { return x.classList.contains('mc-mo'); })[0];
      if (lop) { lop.classList.remove('mc-mo'); return; }
      if (ct.classList.contains('mc-mo')) { dongCt(); return; }
      if (S.but) { batBut(); return; }
      return;
    }
    if (/^[0-9]$/.test(k)) { S.soGo = (S.soGo + k).slice(-3); baoNhanh('Tới đợt: ' + S.soGo + '  ↵ Enter', 0); return; }
    if (k === 'Backspace' && S.soGo) { S.soGo = S.soGo.slice(0, -1); baoNhanh(S.soGo ? 'Tới đợt: ' + S.soGo + '  ↵ Enter' : '', 0); return; }
    if (k === 'Enter' && S.soGo) { var n = +S.soGo; S.soGo = ''; luoi.classList.remove('mc-mo'); e.preventDefault(); toiDot(n - 1); return; }
    var MAP = { l: 'L', g: 'G', d: 'D', k: 'K', c: 'C', t: 'T', b: 'B', Tab: 'Tab', '?': '?', ArrowRight: '→', ArrowLeft: '←', ' ': 'SP', ArrowDown: '↓', PageDown: '↓', ArrowUp: '↑', PageUp: '↑', Home: 'H', End: 'E' };
    var m = MAP[k] || MAP[k.toLowerCase ? k.toLowerCase() : k];
    if (!m) return;
    e.preventDefault();
    lenh(m);
  });

  // ── móc vào script chính ──
  document.addEventListener('mc-vao-dot', function () {
    xoaBut(); dongCt(); phong.classList.remove('mc-mo');
    var d = dot();
    if (d) $$(d, '.mc-vung-de').forEach(function (v) { v.__trang = 0; v.classList.remove('mc-cuon'); v.scrollTop = 0; });
    if (d) $$(d, '.mc-giai').forEach(function (g) { g.__buoc = 0; });
    xep(); veThanh();
  });
  document.addEventListener('mc-doi-pha', function () {
    if (daGoi()) S.daGoi[chiSo()] = true;
    xep(); veThanh();
  });
  document.addEventListener('mc-bo-cuc-xong', function () { xep(); });
  // đổi cỡ cửa sổ: bộ đo bố cục đo lại rồi phát 'mc-bo-cuc-xong' ⇒ xếp trang lại ở đó (không hẹn giờ riêng)
  // cầu nối nối xong ⇒ hiện D / K
  if (window.MutationObserver) new MutationObserver(veThanh).observe(body, { attributes: true, attributeFilter: ['class'] });
  xep(); veThanh();
})();
`
}
