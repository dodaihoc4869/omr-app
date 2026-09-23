import{r as e}from"./jsx-runtime-Cx0BB4qO.js";import{n as t}from"./chu-la-pdf-G-SgNRQ3.js";import{i as n,n as r,o as i,r as a,s as o}from"./chem-format-5TOrh_IH.js";import{n as s}from"./chuan-hoa-loi-giai-cyQRzOHL.js";function c(e){let t=e??{};return{CHO_NOP_LAI:t.CHO_NOP_LAI!==!1,HIEN_GIAI_SAU_NOP:t.HIEN_GIAI_SAU_NOP!==!1,HIEN_GIAI_TRUOC_NOP:t.HIEN_GIAI_TRUOC_NOP===!0,CAN_LAM_HET_MOI_NOP:t.CAN_LAM_HET_MOI_NOP===!0}}function l(e){return String(e??``).replace(/\\ce\s*\{([\s\S]*?)\}/g,`$1`).replace(/\\(?:text|mathrm|mathbf|rm)\s*\{([\s\S]*?)\}/g,`$1`)}function u(e){let t=String(e??``);return t=t.replace(/\^\s*\\?circ\b/g,`°`),t=t.replace(/\bt\^o\b/gi,`t°`),t=t.replace(/\\left|\\right/g,``),t=t.replace(/\\to\b|\\rightarrow\b/g,`->`),t=t.replace(/\\rightleftharpoons\b|\\leftrightharpoons\b/g,`<=>`),t=t.replace(/\\times\b/g,`×`),t=t.replace(/\\cdot\b/g,`·`),t=t.replace(/\\Delta\b/g,`Δ`),t=t.replace(/\\alpha\b/g,`α`),t=t.replace(/\\beta\b/g,`β`),t=t.replace(/\\%/g,`%`),t=t.replace(/\\,|\\;|\\!/g,` `),t=t.replace(/\$/g,``),t=t.replace(/[ \t]{2,}/g,` `),t.trim()}var d=new Set([`→`,`←`,`⇌`]);function f(e){let t=[];for(let n of a(l(e))){if(n.t===`mui`){let e=p(n.tren),r=p(n.duoi);t.push({t:`mui`,v:n.mui,...e.length?{tren:e}:{},...r.length?{duoi:r}:{}});continue}t.push(...p(n.v))}return t.filter(e=>e.v!==``)}function p(e){let t=String(e??``);if(!t.trim())return[];let n=[];for(let e of r(u(t))){if(e.t===`sub`||e.t===`sup`){n.push({t:e.t,v:e.v});continue}if(e.t===`mui`){let t=p(e.tren),r=p(e.duoi);n.push({t:`mui`,v:e.mui,...t.length?{tren:t}:{},...r.length?{duoi:r}:{}});continue}let t=``;for(let r of e.v)d.has(r)?(t&&n.push({t:`chu`,v:t}),t=``,n.push({t:`mui`,v:r})):t+=r;t&&n.push({t:`chu`,v:t})}return n.filter(e=>e.v!==``)}var m=e({CSS_PHIEU:()=>j,JS_PHIEU:()=>H,anhHtml:()=>D,bangHtml:()=>k,biaHtml:()=>L,boLoiGiai:()=>W,chuHtml:()=>S,congThucBia:()=>I,dapAnChu:()=>P,dungPhieu:()=>G,hinhTaiViTri:()=>O,khoiChuaGiHtml:()=>B,ngayVN:()=>E,oGiaiHtml:()=>F,taiLieuHtml:()=>U,thanhHtml:()=>V,thanhNopHtml:()=>K,theCauHtml:()=>N,thoat:()=>x,tongQuanHtml:()=>z}),h=[`A`,`B`,`C`,`D`],g=[`a`,`b`,`c`,`d`],_={biet:`Nhận biết`,hieu:`Thông hiểu`,van_dung:`Vận dụng`},v={biet:`level-1`,hieu:`level-2`,van_dung:`level-3`},y={I:`Trắc nghiệm`,II:`Đúng / Sai`,III:`Trả lời ngắn`},b={I:`type-mc`,II:`type-tf`,III:`type-sa`};function x(e){if(typeof e==`object`&&e){let t=e;if(typeof t.ten==`string`)return x(t.ten);if(typeof t.name==`string`)return x(t.name);if(typeof t.ma==`string`)return x(t.ma);if(typeof t.text==`string`)return x(t.text)}return String(e??``).normalize(`NFC`).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function S(e){if(e==null)return``;if(typeof e==`object`){let t=e,n=t.chot||t.text||t.loiGiai||t.giaiThich||t.explanation||t.noiDung||t.viSao;return typeof n==`string`&&!n.includes(`[object Object]`)||typeof n==`object`&&n?S(n):``}let n=String(e??``);if(n.includes(`[object Object]`)&&(n=n.replace(/\[object Object\]/g,``).trim(),!n))return``;let r=n.trim();if(r.startsWith(`{`)&&r.endsWith(`}`))try{let e=JSON.parse(r),t=e.chot||e.text||e.loiGiai||e.giaiThich||e.explanation||e.noiDung||e.viSao;if(t)return S(t)}catch{}return w(f(t(n)))}var C={"→":`mt-phai`,"←":`mt-trai`,"⇌":`mt-hai`};function w(e){return e.map(e=>{let t=x(e.v);return e.t===`sub`?`<sub>${t}</sub>`:e.t===`sup`?`<sup>${t}</sup>`:e.t===`mui`?T(e):t}).join(``)}function T(e){let t=C[e.v]||`mt-phai`,n=e.tren&&e.tren.length?`<span class="mt-tren">${w(e.tren)}</span>`:``,r=e.duoi&&e.duoi.length?`<span class="mt-duoi">${w(e.duoi)}</span>`:``;return!n&&!r?`<span class="mt mt-tran"><span class="mt-than ${t}"></span></span>`:`<span class="mt">${n}<span class="mt-than ${t}"></span>${r}</span>`}function E(e){return`${String(e.getDate()).padStart(2,`0`)}/${String(e.getMonth()+1).padStart(2,`0`)}/${e.getFullYear()}`}function D(e,t=``,n=``){return e?`<img class="q-hinh${t?` ${t}`:``}" src="${x(e)}" alt="${x(n)}" loading="lazy">`:``}function O(e,t){return(e.hinh??[]).filter(e=>e.viTri===t).map(e=>D(e.src,``,e.alt??``)).join(``)}function k(e){if(!e||e.length===0)return``;let[t,...n]=e;return`<div class="q-bang-cuon"><table class="q-bang"><thead><tr>${t.map(e=>`<th>${S(e)}</th>`).join(``)}</tr></thead><tbody>${n.map(e=>`<tr>${e.map(e=>`<td>${S(e)}</td>`).join(``)}</tr>`).join(``)}</tbody></table></div>`}function A(e){return g.map((t,n)=>(e||``)[n]===`D`)}var j=`
@page { size: A4; margin: 12mm 10mm 14mm; }

:root {
  color-scheme: light;
  --nav: #1a73e8;
  --nav-2: #1557b0;
  --luc: #1a73e8;
  --luc-2: #34a853;
  --vang: #fbbc04;
  --nen: #f8fafc;
  --the-nen: #ffffff;
  --muc: #0f172a;
  --muc-2: #334155;
  --nhat: #64748b;
  --rat-nhat: #94a3b8;
  --vien: #e2e8f0;
  --vien-dam: #cbd5e1;
  --dung: #16a34a;
  --dung-nen: #dcfce7;
  --dung-muc: #15803d;
  --sai: #dc2626;
  --sai-nen: #fee2e2;
  --sai-muc: #b91c1c;
  --kem-nen: #fffbeb;
  --kem-vien: #fde68a;
  --kem-muc: #78350f;
  --kem-nhan: #92400e;
  --bo: 24px;
  --bo-nho: 14px;
  --o-nen: #ffffff;
  --o-chu: #334155;
  --chu-cai-nen: #f1f5f9;
  --chu-cai-muc: #475569;
  --chon-nen: #eef2f6;
  --chon-vien: #2f3e46;
  --bong: 0 2px 10px rgba(0,0,0,.04);
  --bong-cao: 0 8px 30px rgba(0,0,0,.08);
  --muot: .25s cubic-bezier(.4, 0, .2, 1);
}

@media screen and (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --nen: #0b1120;
  --o-nen: #0f172a;
  --o-chu: #e2e8f0;
  --chu-cai-nen: #1e293b;
  --chu-cai-muc: #cbd5e1;
  --chon-nen: #263b55;
  --chon-vien: #93c5fd;
    --the-nen: #1e293b;
    --muc: #f8fafc;
    --muc-2: #cbd5e1;
    --nhat: #94a3b8;
    --rat-nhat: #64748b;
    --vien: #334155;
    --vien-dam: #475569;
    --kem-nen: #292524;
    --kem-vien: #78350f;
    --kem-muc: #fef3c7;
    --kem-nhan: #fbbf24;
  }

}

:root.dark, body.dark, [data-theme="dark"] {
  color-scheme: dark;
  --nen: #0b1120;
  --o-nen: #0f172a;
  --o-chu: #e2e8f0;
  --chu-cai-nen: #1e293b;
  --chu-cai-muc: #cbd5e1;
  --chon-nen: #263b55;
  --chon-vien: #93c5fd;
  --the-nen: #1e293b;
  --muc: #f8fafc;
  --muc-2: #cbd5e1;
  --nhat: #94a3b8;
  --rat-nhat: #64748b;
  --vien: #334155;
  --vien-dam: #475569;
  --kem-nen: #292524;
  --kem-vien: #78350f;
  --kem-muc: #fef3c7;
  --kem-nhan: #fbbf24;
}


/* DẢI 4 MÀU THƯƠNG HIỆU GOOGLE (CHUẨN MẪU MOM GIAO) */
.google-bar {
  height: 6px;
  width: 100%;
  border-radius: 9999px;
  overflow: hidden;
  display: flex;
  margin-bottom: 24px;
}
.google-bar .g-blue { flex: 1; background: #1a73e8; }
.google-bar .g-red { flex: 1; background: #ea4335; }
.google-bar .g-yellow { flex: 1; background: #fbbc04; }
.google-bar .g-green { flex: 1; background: #34a853; }

/* BẢY SẮC CẦU VỒNG ĐIỂM XUYẾT */
body[data-mau="1"] { --nav: #dc2626; --nav-2: #b91c1c; --luc: #ef4444; --luc-2: #f87171; --vang: #fca5a5; }
body[data-mau="2"] { --nav: #ea580c; --nav-2: #c2410c; --luc: #f97316; --luc-2: #fb923c; --vang: #fdba74; }
body[data-mau="3"] { --nav: #ca8a04; --nav-2: #a16207; --luc: #eab308; --luc-2: #facc15; --vang: #fde047; }
body[data-mau="4"] { --nav: #16a34a; --nav-2: #15803d; --luc: #22c55e; --luc-2: #4ade80; --vang: #86efac; }
body[data-mau="5"] { --nav: #0284c7; --nav-2: #0369a1; --luc: #0ea5e9; --luc-2: #38bdf8; --vang: #7dd3fc; }
body[data-mau="6"] { --nav: #4f46e5; --nav-2: #3730a3; --luc: #6366f1; --luc-2: #818cf8; --vang: #a5b4fc; }
body[data-mau="7"] { --nav: #7c3aed; --nav-2: #6d28d9; --luc: #8b5cf6; --luc-2: #a78bfa; --vang: #c4b5fd; }

* { margin: 0; padding: 0; box-sizing: border-box; }
[hidden] { display: none !important; }

html { scroll-behavior: smooth; }

body {
  font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--nen);
  color: var(--muc);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-variant-numeric: tabular-nums;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  -webkit-tap-highlight-color: transparent;
}

sub { font-size: .72em; vertical-align: -.25em; }
sup { font-size: .72em; vertical-align: .42em; }

.khung { max-width: 900px; margin: 0 auto; padding: 24px 16px 72px; }

/* ================= BÌA ================= */
/* ================= BÌA — PHẲNG VÀ SÁNG (Material 3) =================
   Bản trước: nền chuyển sắc đậm, chữ trắng, hai vệt tròn mờ và bóng đổ. Ba
   thứ ấy cộng lại làm cả đầu phiếu tối và chói, chữ trắng trên nền vàng thì
   gần như không đọc nổi ngoài nắng — mà em mở phiếu này trên điện thoại.
   Nay: nền sáng, chữ tối, MÀU chỉ còn làm điểm nhấn nhỏ. Đúng lối Material 3 —
   phân tầng bằng nền và viền mảnh chứ không bằng bóng đổ. */
.cover {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 32px 22px 28px;
  color: var(--muc);
  border-radius: 28px;
  border: 1px solid var(--vien);
  margin-bottom: 16px;
  background: var(--the-nen);
}
/* Hai vệt tròn mờ chỉ có nghĩa trên nền đậm. Nền sáng thì chúng thành hai
   mảng xám bẩn, nên tắt hẳn — giữ thẻ trong HTML để không phải sửa mọi chỗ
   dựng bìa. */
.cover-blob { display: none; }
.cover-content { position: relative; z-index: 2; width: 100%; max-width: 700px; margin: 0 auto; }
.cover-badge {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 6px 14px;
  background: var(--nen); border: 1px solid var(--vien); border-radius: 999px;
  color: var(--nav);
  font-size: 11.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
}
/* Công thức đứng CẠNH nhãn, không chiếm một dòng khổng lồ giữa trang. */
.cover-badge .ct { letter-spacing: 0; text-transform: none; font-size: 13px; color: var(--muc-2); }
.cover-title { font-size: clamp(28px, 7.4vw, 44px); font-weight: 900; line-height: 1.1; letter-spacing: -.02em; }
.cover-subtitle { margin-top: 8px; font-size: clamp(13.5px, 3vw, 16px); font-weight: 400; color: var(--nhat); }
/* LƯỚI chứ không phải flex-wrap: các ô luôn CÙNG CHIỀU CAO và chia đều hàng. */
.cover-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 8px; margin-top: 22px; }
.cover-info-item {
  padding: 11px 13px; display: flex; flex-direction: column; justify-content: center;
  background: var(--nen); border: 1px solid var(--vien); border-radius: 14px;
}
.cover-info-label { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: var(--nhat); margin-bottom: 3px; }
.cover-info-value { font-size: clamp(13.5px, 3.2vw, 15.5px); font-weight: 700; overflow-wrap: anywhere; line-height: 1.35; }

/* ================= TỔNG QUAN ================= */
/* TỔNG QUAN — cùng lối phẳng sáng với bìa.
   Bỏ luôn lề trên âm: khối này chồng đè lên bìa chỉ có nghĩa khi hai khối
   khác màu nhau. Cùng nền sáng thì chồng lên nhau thành một mảng rối, nên nay
   xếp cách đều. */
.summary-page {
  margin: 0 auto 20px; max-width: 900px; position: relative; z-index: 3;
  border-radius: 28px; padding: 18px 18px 20px; color: var(--muc);
  background: var(--the-nen); border: 1px solid var(--vien);
}
.summary-dau { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.summary-title { font-size: clamp(15px, 3.6vw, 18px); font-weight: 800; letter-spacing: .01em; }
.summary-tong { font-size: 13px; color: var(--nhat); font-variant-numeric: tabular-nums; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; margin-bottom: 12px; }
.stat-card {
  display: flex; align-items: baseline; gap: 8px; width: 100%; text-align: left;
  padding: 12px 13px; color: inherit; font: inherit;
  background: var(--nen); border: 1px solid var(--vien); border-radius: 16px;
  transition: background-color var(--muot), border-color var(--muot), transform var(--muot);
}
button.stat-card, button.topic-item { cursor: pointer; }
button.stat-card:hover { background: var(--the-nen); border-color: var(--vien-dam); }
button.stat-card:active { transform: scale(.98); }
/* Ô ĐANG CHỌN: tô bằng chính màu nhấn ở mức rất nhạt + viền đậm, thay cho
   cách cũ là đảo sang nền trắng — trên nền sáng thì trắng không còn nổi. */
button.stat-card.chon { background: var(--the-nen); border-color: var(--nav); color: var(--nav); box-shadow: inset 0 0 0 1px var(--nav); }
button.stat-card.chon .stat-label { color: var(--nav); font-weight: 700; }
button.stat-card:focus-visible, button.topic-item:focus-visible { outline: 3px solid var(--nav); outline-offset: 2px; }
.stat-number { font-size: clamp(19px, 4.4vw, 23px); font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; }
.stat-label { font-size: 12px; color: var(--nhat); line-height: 1.3; }
/* PHÂN LOẠI MỨC ĐỘ.
   Bản cũ dồn tất cả vào MỘT dòng chữ 13px: tên mức, dãy số câu, số câu, tên
   chuyên đề nối đuôi nhau. Đọc trên điện thoại là một dải chữ dài không có
   chỗ nghỉ mắt. Nặng hơn: mỗi dòng mang lề âm -10px trong khung chỉ đệm 14px,
   nên nền và viền dòng tràn sát mép khung, nhìn như bị cắt cụt.
   Nay tách hai tầng — tầng trên là TÊN MỨC (đọc trước) kèm chuyên đề mờ,
   tầng dưới là dãy số câu chữ nhỏ — và dòng nằm gọn hẳn trong khung. */
.topics-list { background: var(--nen); border: 1px solid var(--vien); border-radius: 20px; padding: 12px 8px 8px; }
.topics-list h3 {
  font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--nhat); margin: 0 0 6px; padding: 0 10px;
}
.topic-item {
  display: grid; grid-template-columns: 4px minmax(0, 1fr); align-items: start;
  gap: 3px 11px; width: 100%; margin: 0; text-align: left;
  padding: 9px 11px; border: 0; border-radius: 14px;
  background: transparent; color: inherit; font: inherit;
  transition: background-color var(--muot), box-shadow var(--muot);
}
.topic-item + .topic-item { margin-top: 2px; }
/* Thanh màu dọc thay cho chấm tròn: dòng cao hai tầng thì chấm tròn lửng lơ,
   còn thanh chạy hết chiều cao nên neo được cả khối chữ. */
.topic-cham { grid-row: 1 / span 2; align-self: stretch; display: block; min-height: 26px; }
.topic-dot { display: block; width: 4px; height: 100%; min-height: 26px; border-radius: 999px; }
.topic-ten {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px;
  font-size: 14px; line-height: 1.35; letter-spacing: -.01em;
}
.topic-ten strong { font-weight: 700; }
.topic-cd { font-size: 12px; font-weight: 500; color: var(--nhat); }
.topic-cau {
  grid-column: 2; font-size: 12px; line-height: 1.55; color: var(--nhat);
  font-variant-numeric: tabular-nums;
}
button.topic-item:hover { background: var(--the-nen); }
button.topic-item:active { background: var(--the-nen); }
button.topic-item.chon { background: var(--the-nen); box-shadow: inset 0 0 0 1.5px var(--nav); }
button.topic-item.chon .topic-ten { color: var(--nav); }
button.topic-item.chon .topic-cau, button.topic-item.chon .topic-cd { color: var(--nav); opacity: .78; }

/* 3 VÒNG PHÂN TẦNG BTVN THÔNG MINH */
.btvn-3vong-banner {
  background: var(--the-nen, #f8fafc);
  border: 1.5px solid var(--vien-dam, #cbd5e1);
  border-radius: 18px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.btvn-3vong-tieu-de {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-size: 13px;
  margin-bottom: 10px;
}
.btvn-3vong-tieu-de strong { font-weight: 800; color: var(--muc); }
.btvn-chi-tieu {
  font-size: 12px;
  font-weight: 700;
  background: #ecfdf5;
  color: #047857;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid #a7f3d0;
}
.btvn-3vong-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.vong-col {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--vien);
  background: var(--nen);
}
.vong-col.col-1 { border-left: 4px solid #1e8e3e; }
.vong-col.col-2 { border-left: 4px solid #e37400; }
.vong-col.col-3 { border-left: 4px solid #c5221f; }
.vong-head {
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 4px;
}
.col-1 .vong-head { color: #1e8e3e; }
.col-2 .vong-head { color: #e37400; }
.col-3 .vong-head { color: #c5221f; }
.vong-body {
  font-size: 11px;
  line-height: 1.45;
  color: var(--nhat);
}
.vong-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  margin-left: 6px;
  white-space: nowrap;
}
.vong-pill.p1 { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.vong-pill.p2 { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.vong-pill.p3 { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

.q-tag.vong-btvn { font-weight: 800; letter-spacing: 0.02em; }
.q-tag.vong-1 { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.q-tag.vong-2 { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.q-tag.vong-3 { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

/* ================= Ô LÀM BÀI (phiếu nộp được) =================
   CHỌN NGAY TRÊN PHƯƠNG ÁN, không có hàng "EM CHỌN" riêng nữa (thầy chốt
   08/09). Hàng phương án của đề vốn đã cao hơn 44px nên cỡ chạm đã đạt; ở đây
   chỉ thêm con trỏ, viền chọn và trạng thái. */
/* Ô CHỌN LÀ THẺ <button> THẬT. Reset dáng mặc định của nút để hình y hệt bản
   chỉ đọc, nhưng vẫn là nút với trình duyệt — đó mới là thứ làm cú chạm ăn. */
button.lam-o {
  appearance: none; -webkit-appearance: none;
  font: inherit; text-align: left; margin: 0;
}
.lam-o {
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  /* KHÔNG CHỜ CHẠM ĐÚP: thiếu dòng này thì trình duyệt di động giữ chạm lại
     khoảng 300ms để xem có phải chạm đúp không, và em thấy nút "lì". */
  touch-action: manipulation;
  /* Chạm giữ lâu không được bôi đen chữ trong ô — bôi đen xong thì cú chạm
     tính là chọn chữ, không tính là bấm. */
  -webkit-user-select: none; user-select: none;
}
/* Ô Đ/S TO BẰNG NGÓN TAY khi phiếu cho làm bài (thầy bắt được 08/09: "nút Đ
   bấm mãi không được"). Ô cũ 34x30 — dưới ngưỡng 44px, lại đứng cách nhau 10px
   nên ngón tay rơi vào khe giữa hai ô là mất cú bấm.
   CHỈ áp cho phiếu làm bài: phiếu đọc và bản in giữ nguyên khổ cũ. */
body.co-lam .tf-badge { width: 46px; height: 44px; border-radius: 10px; font-size: 15px; position: relative; }
/* VÙNG CHẠM RỘNG HƠN Ô NHÌN THẤY. Đo trên Chromium có cảm ứng: tay xê ngang
   18px là đã rơi ra rìa ô 46px và mất cú bấm. Nới thêm 6px mỗi phía cho ngón
   tay, giao diện KHÔNG đổi. Đúng 6px vì hai ô cách nhau 12px — rộng hơn nữa là
   hai vùng chạm chồng lên nhau, bấm Đ lại ăn sang S. */
body.co-lam .tf-badge.lam-o::after { content: ''; position: absolute; inset: -6px; border-radius: 14px; }
body.co-lam .tf-o { gap: 12px; }
body.co-lam .tf-item { padding: 9px 10px; }
.q-opt.lam-o { transition: background-color .12s, border-color .12s; }
.q-opt.lam-o[aria-checked="true"] { background: var(--chon-nen); border-color: var(--chon-vien); }
.q-opt.lam-o[aria-checked="true"] .q-opt-letter { background: #2f3e46; color: #ffffff; }
.tf-badge.lam-o { transition: background-color .12s, border-color .12s, color .12s; }
.tf-badge.lam-o[aria-checked="true"] { background: #2f3e46; border-color: #2f3e46; color: #ffffff; }
.lam-o:focus-visible { outline: 3px solid rgba(47,62,70,.35); outline-offset: 2px; }
.lam-nhap {
  width: 100%; max-width: 260px; height: 40px; border-radius: 10px; border: 1px solid #e4e0d7;
  padding: 0 14px; font: inherit; font-size: 14px; color: var(--muc); background: var(--o-nen);
}
.lam-nhap:focus { outline: none; border-color: #2f3e46; }
/* Sau khi nộp: khoá ô lại và tô đúng/sai. Màu KHÔNG đứng một mình — mỗi thẻ
   mang thêm dòng chữ "Đúng"/"Sai" ngay dưới. */
.q-card.da-cham .lam-o, .q-card.da-cham .lam-nhap { pointer-events: none; opacity: .95; }
.lam-ket { margin-top: 8px; font-size: 13px; font-weight: 700; }
.q-card.cau-dung .lam-ket { color: #2e8b6b; }
.q-card.cau-sai .lam-ket { color: #b42318; }

/* Thanh nộp và dải kết quả. */
.nop-chu { flex: 1; min-width: 0; font-size: 12.5px; color: var(--muc-2); }
.nut.nop { background: #16171a; color: #ffffff; }
.nut.nop[disabled] { opacity: .5; cursor: default; }
.nop-ket { font-weight: 700; font-size: 14px; color: var(--muc); }
.nop-loi { font-size: 12.5px; color: #b42318; }

/* ================= THANH ĐIỀU KHIỂN ================= */
.thanh {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  margin: 0 auto 18px; padding: 11px 13px;
  background: var(--the-nen);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  backdrop-filter: saturate(180%) blur(14px);
  border: 1px solid var(--vien); border-radius: 22px;
  box-shadow: 0 2px 4px rgba(15,48,87,.04), 0 14px 34px -10px rgba(15,48,87,.16);
}
body.co-lam .thanh:not(#thanh-nop) { position: static; }
.thanh-chu { flex: 1 1 100%; min-width: 120px; font-size: 13px; font-weight: 600; color: var(--nhat); }
/* Nút chính CHIẾM CHỖ CÒN LẠI của hàng dưới — thanh nhìn cân, và trên điện
   thoại 360px vùng chạm rộng hết cỡ thay vì một viên thuốc bé tí ở góc. */
.thanh #mo-het { flex: 1 1 auto; justify-content: center; }
.thanh .pdf-boc { flex: 0 0 auto; }
.thanh-chu b { color: var(--nav); font-weight: 800; }
.the-loc b { color: var(--luc); }
.nut.nho { min-height: 34px; padding: 0 12px; font-size: 12.5px; border-color: var(--luc); color: var(--luc); }
.nut.nho:hover { background: #e6f4f5; }
.nut {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px; white-space: nowrap;
  min-height: 48px; padding: 0 20px; border: 1px solid var(--vien-dam); border-radius: 999px;
  background: #ffffff; color: var(--nav); font: inherit; font-size: 14px; font-weight: 800;
  cursor: pointer; transition: background-color var(--muot), border-color var(--muot), transform var(--muot), box-shadow var(--muot);
}
.nut:hover { background: #f1f5f9; border-color: var(--nav); }
.nut:active { transform: scale(.97); }
.nut.chinh {
  background: linear-gradient(135deg, var(--nav), var(--luc)); border-color: transparent; color: #ffffff;
  box-shadow: 0 2px 4px rgba(15,48,87,.10), 0 10px 22px -8px rgba(0,136,145,.55);
}
.nut.chinh:hover { filter: brightness(1.08); }
/* Nút phụ ĐẶC, không viền rỗng: trong ảnh thầy chốt 06/09 nó là viên thuốc
   xanh đậm đứng cạnh nút chính, không phải một cái khung trắng. */
.nut.dam { background: var(--nav); border-color: transparent; color: #ffffff; }
.nut.dam:hover { background: var(--nav); filter: brightness(1.14); }
.nut:focus-visible { outline: 3px solid rgba(0,136,145,.4); outline-offset: 2px; }

/* MỘT NÚT, HAI NHÃN. Nhãn "đóng" ẩn sẵn, chỉ hiện khi nút đang ở trạng thái
   mở. Quy tắc này phải phủ CẢ nút trong thẻ câu lẫn nút trên thanh — bản trước
   chỉ viết cho thẻ câu nên nút trên thanh in ra cả hai nhãn liền nhau. */
.chu-dong { display: none; }
.q-card.mo .q-nut-giai .chu-mo, .nut.dang-mo-het .chu-mo { display: none; }
.q-card.mo .q-nut-giai .chu-dong, .nut.dang-mo-het .chu-dong { display: inline; }

/* ================= THẺ CÂU ================= */
.ds-tieu-de { font-size: 16px; font-weight: 800; margin: 18px 0 14px; color: var(--muc); letter-spacing: .02em; }
.ds-cau { display: flex; flex-direction: column; gap: 14px; }

/* Chừa đúng chiều cao thanh dính khi cuộn thẻ vào tầm nhìn, không thì đầu thẻ
   chui xuống dưới thanh và thầy tưởng mất một dòng. */
.q-card { scroll-margin-top: 78px; }
/* Thẻ bị lọc ra ngoài. Dùng lớp riêng chứ không xoá khỏi trang: bỏ lọc là hiện
   lại ngay, và số thứ tự câu không bị đánh lại. */
.q-card.an { display: none; }
/* Lọc xong không còn câu nào — báo thẳng chứ không để trang trống trơn. */
.trong-loc { padding: 26px 18px; text-align: center; color: var(--nhat); font-size: 14px; }

.q-card {
  background: var(--the-nen); border: 1px solid var(--vien); border-left: 4px solid var(--vien-dam);
  border-radius: 20px; box-shadow: var(--bong); overflow: hidden;
  transition: border-left-color var(--muot), box-shadow var(--muot), transform var(--muot);
  break-inside: avoid;
}
.q-card:hover { box-shadow: var(--bong-cao); }
.q-card.mo { border-left-color: #1a73e8; }

.q-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px 0; }
.q-num {
  flex-shrink: 0; width: 36px; height: 36px; border-radius: 12px;
  background: #1a73e8; color: #ffffff;
  display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800;
  box-shadow: 0 2px 8px rgba(26,115,232,.3);
}
.q-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.q-tag { font-size: 11px; padding: 3.5px 10px; border-radius: 999px; font-weight: 700; letter-spacing: .01em; white-space: nowrap; }
.q-tag.type-mc { background: #eff6ff; color: #1d4ed8; }
.q-tag.type-tf { background: #fef3c7; color: #92400e; }
.q-tag.type-sa { background: #eef2ff; color: #4338ca; }
.q-tag.level-1 { background: #ecfdf5; color: #047857; }
.q-tag.level-2 { background: #fdf2f8; color: #be185d; }
.q-tag.level-3 { background: #fff7ed; color: #c2410c; }
.q-tag.topic { background: var(--chu-cai-nen); color: var(--chu-cai-muc); }
/* NHÃN CHỮA — lý do câu này có mặt trên phiếu, nên phải đọc thấy trước ba nhãn
   kia. Thầy chốt 07/09: "gắn màu nào cho nổi bật lên".
   Cam đậm: ba nhãn còn lại đều là màu pastel nhạt (xanh nhạt, hồng nhạt, xám),
   nên một ô đặc màu ấm là thứ duy nhất bật lên khỏi hàng. Kèm chấm trắng và cỡ
   chữ to hơn một bậc để không phải dò từng chữ. */
.q-tag.chua {
  background: #c2410c; color: #ffffff; font-size: 12px; font-weight: 800;
  padding: 4px 12px 4px 9px; letter-spacing: .015em;
  box-shadow: 0 2px 6px rgba(194,65,12,.3);
}
.q-tag.chua::before {
  content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #ffffff; margin-right: 7px; vertical-align: 1px;
}
/* Bậc 2 là "gần dạng", không trùng khít — cùng họ màu nhưng nhạt hẳn, để thầy
   phân biệt được từ xa mà không phải đọc chữ. */
.q-tag.chua-2 { background: #ffedd5; color: #9a3412; box-shadow: none; }
.q-tag.chua-2::before { background: #c2410c; }
/* NHÃN "EM LÀM SAI CÂU NÀY" — tờ ĐỀ CỦA EM, không phải phiếu khắc phục.
   Màu đỏ chứ không cam: cam là màu của việc phải làm tiếp (khắc phục, luyện
   thêm), đỏ là màu của chỗ đã sai. Nhìn một cái phải phân biệt được hai loại
   tờ, vì thầy mở cả hai trong cùng một buổi. */
.q-tag.sai-cua-em {
  background: #c5221f; color: #ffffff; font-size: 12px; font-weight: 800;
  padding: 4px 12px 4px 9px; letter-spacing: .015em;
  box-shadow: 0 2px 6px rgba(197,34,31,.28);
}
.q-tag.sai-cua-em::before {
  content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #ffffff; margin-right: 7px; vertical-align: 1px;
}
/* Cả thẻ câu cũng đổi vạch trái: nhìn lướt là thấy câu nào là câu chữa. */
.q-card.la-chua { border-left-color: #c2410c; }
/* PHÂN TẦNG BTVN: HIỆN SÁNG CÂU ĐƯỢC GIAO HÔM NAY, ẨN MỜ CÂU KHÁC */
.q-card.q-card-active {
  border-left-color: #2563eb !important;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12), var(--bong);
}
.q-card.q-card-dimmed {
  opacity: 0.32;
  filter: grayscale(80%) blur(0.4px);
  position: relative;
  transition: opacity 0.3s ease, filter 0.3s ease;
  user-select: none;
}
.q-card.q-card-dimmed:hover, .q-card.q-card-dimmed:focus-within {
  opacity: 0.78;
  filter: none;
}
.q-card.q-card-dimmed .lam-o, .q-card.q-card-dimmed .lam-nhap {
  pointer-events: none;
}
.dimmed-pacing-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.16);
  border: 1px dashed rgba(148, 163, 184, 0.45);
  color: #64748b;
  font-size: 11.5px;
  font-weight: 600;
}
:root.dark .dimmed-pacing-banner, body.dark .dimmed-pacing-banner {
  background: rgba(30, 41, 59, 0.7);
  border-color: rgba(71, 85, 105, 0.5);
  color: #94a3b8;
}
.q-tag.muc-tieu-hom-nay-tag {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #ffffff !important;
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}
.thanh-phan-tang-btvn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 18px;
  margin-bottom: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(79, 70, 229, 0.08));
  border: 1px solid rgba(37, 99, 235, 0.25);
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 600;
}
:root.dark .thanh-phan-tang-btvn, body.dark .thanh-phan-tang-btvn {
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.3), rgba(67, 56, 202, 0.3));
  border-color: rgba(96, 165, 250, 0.3);
  color: #bfdbfe;
}
.thanh-phan-tang-btvn .tpt-trai {
  display: flex;
  align-items: center;
  gap: 8px;
}
.thanh-phan-tang-btvn .tpt-nut-mo {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: #ffffff;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.3);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  transition: all 0.2s;
}
.thanh-phan-tang-btvn .tpt-nut-mo:hover {
  background: #2563eb;
  color: #ffffff;
}
:root.dark .thanh-phan-tang-btvn .tpt-nut-mo {
  background: #1e293b;
  color: #93c5fd;
  border-color: rgba(147, 197, 253, 0.3);
}
:root.dark .thanh-phan-tang-btvn .tpt-nut-mo:hover {
  background: #3b82f6;
  color: #ffffff;
}
/* Khối "Phiếu này chữa gì" — đọc trước khi làm bài, nên đặt màu nhạt cùng họ
   với nhãn chữa để mắt nối được hai thứ với nhau. */
/* LỜI NHẮC ĐẦU PHIẾU — vì sao phiếu này mở ra ở dạng chỉ đọc.
   Phải nằm TRONG tài liệu phiếu, không phải trên trang app: phiếu hiện trong
   một lớp phủ toàn màn hình (KhungXemPhieu), nên mọi dòng giải thích đặt ngoài
   lớp phủ đều bị che kín. Thầy báo 09/09: bấm "tạo câu khắc phục" ra phiếu
   xám không bấm được, mà không có một chữ nào nói vì sao — đúng là dòng giải
   thích đã được dựng, chỉ là nằm dưới lớp phủ. */
.nhac-phieu { background: var(--kem-nen); border: 1px solid var(--kem-vien); border-left: 4px solid var(--kem-nhan); border-radius: 16px; padding: 14px 18px; margin-bottom: 16px; color: var(--kem-muc); font-size: 14px; line-height: 1.55; }
.nhac-phieu b { color: var(--kem-nhan); }
.chua-gi { background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #d97706; border-radius: 20px; padding: 18px 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(217,119,6,0.06); }
.chua-gi h3 { margin: 0 0 10px; font-size: 13.5px; letter-spacing: .04em; text-transform: uppercase; color: #92400e; font-weight: 800; }
.chua-gi ul { margin: 0; padding-left: 18px; }
.chua-gi li { margin: 6px 0; font-size: 14px; line-height: 1.55; color: #78350f; }
.chua-gi li.mo { color: #a8a29e; }
.chua-gi .chua-mui { color: #d97706; font-weight: 800; }
/* Ô phân tích cho câu LÀM LẠI: em phải đọc trước khi làm lại, nên đặt trên đề. */
.lam-lai { background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; font-size: 14px; line-height: 1.55; color: #78350f; }
.q-card.la-chua.mo { border-left-color: #1a73e8; }

/* Vùng bấm: cả thân câu. Con trỏ hình bàn tay để thấy ngay là bấm được. */
.q-than { padding: 10px 16px 14px; cursor: pointer; }
.q-text { font-size: 15.5px; line-height: 1.62; color: var(--muc); font-weight: 500; overflow-wrap: break-word; }
.q-text + .q-options, .q-text + .sa-vung, .q-hinh + .q-options { margin-top: 12px; }

/* MŨI TÊN PHẢN ỨNG — nhãn TRÊN và DƯỚI thân, đúng như sách.
   Thân vẽ bằng border nên in ra giấy vẫn sắc và dài ra theo nhãn; ký tự mũi
   tên của phông thì cố định bề ngang, nhãn dài là chữ đè lên nhau.
   inline-grid + vertical-align:middle để mũi tên nằm ĐÚNG giữa dòng chữ, và
   line-height riêng để nhãn không bị giãn theo giãn dòng của đoạn văn. */
.mt {
  display: inline-grid; justify-items: center; align-items: center;
  vertical-align: middle; margin: 0 3px; line-height: 1.15; text-align: center;
}
.mt-tren, .mt-duoi { font-size: .74em; white-space: nowrap; padding: 0 4px; color: var(--nhat); }
.mt-than { position: relative; width: 100%; min-width: 26px; height: 0; border-top: 1.4px solid currentColor; margin: 3px 0; }
.mt-than::after, .mt-than::before { content: ""; position: absolute; top: -4px; width: 0; height: 0; border: 4px solid transparent; }
.mt-phai::after { right: -1px; border-right: 0; border-left-color: currentColor; }
.mt-trai::before { left: -1px; border-left: 0; border-right-color: currentColor; }
/* Hai chiều: hai nét song song, mỗi nét một đầu nhọn ngược hướng nhau. */
.mt-hai { height: 5px; border-bottom: 1.4px solid currentColor; }
.mt-hai::after { top: -4px; right: -1px; border-right: 0; border-left-color: currentColor; }
.mt-hai::before { top: 1px; left: -1px; border-left: 0; border-right-color: currentColor; }
/* Mũi tên trần (không nhãn) đứng ngay trong dòng chữ, không cần chiều rộng lớn. */
.mt-tran { margin: 0 5px; }
.mt-tran .mt-than { min-width: 20px; }

/* HAI CỘT CỐ ĐỊNH trên màn rộng, đúng mẫu theo ảnh. */
.q-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.q-options.single-col { grid-template-columns: 1fr; }
.q-opt {
  display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 10px 16px;
  width: 100%; box-sizing: border-box;
  background: var(--o-nen); border: 1.5px solid var(--vien); border-radius: 16px;
  font-size: 14.5px; line-height: 1.5; color: var(--o-chu); font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  transition: background-color var(--muot), border-color var(--muot), color var(--muot);
}
.q-opt-letter {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
  background: var(--chu-cai-nen); color: var(--chu-cai-muc);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; line-height: 1;
  transition: background-color var(--muot), color var(--muot);
}
.q-opt-text { flex: 1; min-width: 0; overflow-wrap: break-word; }

/* ĐÁP ÁN ĐÚNG (A) - Chuẩn màu xanh theo ảnh */
.q-card.mo .q-opt.dung, .q-opt.dung {
  background: #f0fdf4; border-color: #a7f3d0; color: #166534; font-weight: 700;
}
.q-card.mo .q-opt.dung .q-opt-letter, .q-opt.dung .q-opt-letter {
  background: #dcfce7; color: #166534;
}

/* ĐÁP ÁN SAI (B) - Khi em chọn nhầm theo ảnh */
.q-card.mo .q-opt.sai, .q-opt.sai, .q-card.da-cham .q-opt.sai {
  background: #fef2f2; border-color: #fecaca; color: #991b1b; font-weight: 700;
}
.q-card.mo .q-opt.sai .q-opt-letter, .q-opt.sai .q-opt-letter, .q-card.da-cham .q-opt.sai .q-opt-letter {
  background: #fee2e2; color: #991b1b;
}

.tf-item {
  display: flex; align-items: center; gap: 12px; padding: 7px 10px; border-radius: var(--bo-nho);
  transition: background-color var(--muot);
}
.tf-item + .tf-item { margin-top: 4px; }
.q-card.mo .tf-item { background: var(--o-nen); }
.tf-statement { flex: 1; min-width: 0; font-size: 14.5px; line-height: 1.55; color: var(--muc-2); overflow-wrap: break-word; }
.tf-o { display: flex; gap: 10px; flex-shrink: 0; }
.tf-badge {
  width: 34px; height: 30px; border-radius: 8px; box-sizing: border-box; padding: 0;
  display: flex; align-items: center; justify-content: center;
  /* CHU MO DEU NHAU. Thay bao 09/09: chu cai trong hai cot dung/sai bi in dam
     san, nhin nhu da danh dau truoc. Do dam 800 la muc dung cho chu DA CHON,
     dat san cho o chua chon la noi doi bang hinh thuc. O da chon van noi bat vi
     no doi ca NEN lan MAU CHU, khong can muon them do dam. */
  font-size: 14px; font-weight: 500;
  background: var(--chu-cai-nen); color: var(--chu-cai-muc); border: 1px solid var(--vien);
  transition: background-color var(--muot), color var(--muot), border-color var(--muot);
}
.q-card.mo .tf-badge.d.dung { background: var(--dung-nen); color: var(--dung-muc); border-color: var(--dung); }
.q-card.mo .tf-badge.s.dung { background: var(--sai-nen); color: var(--sai-muc); border-color: var(--sai); }

.sa-vung { display: flex; align-items: center; min-height: 48px; }
.sa-blank {
  flex: 1; padding: 12px 18px; border: 1.5px dashed var(--vien-dam); border-radius: var(--bo-nho);
  font-size: 14px; color: var(--rat-nhat);
}
.sa-answer {
  display: none; align-items: center; padding: 11px 24px; border-radius: var(--bo-nho);
  background: linear-gradient(135deg, var(--nav), var(--luc)); color: #ffffff;
  font-size: 19px; font-weight: 800; letter-spacing: .02em;
}
.q-card.mo .sa-blank { display: none; }
.q-card.mo .sa-answer { display: inline-flex; }

.q-hinh {
  display: block; max-width: 100%; height: auto; margin: 12px auto;
  border: 1px solid var(--vien); border-radius: var(--bo-nho); background: #ffffff;
}
.q-hinh.pa { max-height: 64px; margin: 0; border: none; background: transparent; }
.q-bang-cuon { overflow-x: auto; margin: 12px 0; }
.q-bang { width: 100%; border-collapse: collapse; font-size: 14px; }
.q-bang th, .q-bang td { border: 1px solid var(--vien-dam); padding: 7px 12px; text-align: center; color: var(--muc-2); white-space: nowrap; }
.q-bang th { background: var(--o-nen); font-weight: 700; }

/* ================= NÚT MỞ LỜI GIẢI ================= */
.q-nut-giai {
  display: flex; align-items: center; gap: 8px; width: 100%;
  min-height: 44px; padding: 0 16px; border: none; border-top: 1px solid var(--vien);
  background: #f8fafc; color: var(--luc); font: inherit; font-size: 13.5px; font-weight: 700;
  cursor: pointer; text-align: left;
  transition: background-color var(--muot), color var(--muot);
}
.q-nut-giai:hover { background: #eef6f7; }
.q-nut-giai:focus-visible { outline: 3px solid rgba(0,136,145,.4); outline-offset: -3px; }
.q-card.mo .q-nut-giai { background: var(--kem-nen); color: var(--kem-nhan); border-top-color: var(--kem-vien); }
.q-mui { flex-shrink: 0; width: 16px; height: 16px; transition: transform var(--muot); }
.q-card.mo .q-mui { transform: rotate(180deg); }

/* ================= Ô LỜI GIẢI (GẬP / MỞ) =================
   Chuyển động bằng grid-template-rows 0fr → 1fr: mở đúng chiều cao thật của
   nội dung mà KHÔNG phải đo bằng JS, và không giật như cách đặt max-height ước
   lượng. Trình duyệt cũ không chạy được thì nội dung vẫn hiện, chỉ mất hiệu
   ứng trượt. */
.sol-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--muot); }
.q-card.mo .sol-wrap { grid-template-rows: 1fr; }
.sol-inner { overflow: hidden; min-height: 0; }
.sol-box {
  margin: 0 16px 20px; padding: 22px 24px;
  background: #fffdf5; border: 1.5px solid #fde68a; border-radius: 20px;
  box-shadow: 0 4px 16px rgba(217,119,6,0.06);
  opacity: 0; transform: translateY(-6px);
  transition: opacity var(--muot), transform var(--muot);
}
.q-card.mo .sol-box { opacity: 1; transform: none; }
.sol-label {
  font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  color: #92400e; margin-bottom: 6px;
}
.sol-label + .sol-label, .sol-text + .sol-label, .sol-step + .sol-label, .sol-dap + .sol-label { margin-top: 14px; }
/* Đáp án nổi bật rõ ràng chuẩn theo ảnh */
.sol-dap { font-size: 16px; color: #78350f; font-weight: 700; margin-bottom: 12px; }
.sol-dap b { font-size: 18px; font-weight: 900; color: #78350f; letter-spacing: .04em; }
.sol-text { font-size: 14.5px; line-height: 1.65; color: #78350f; overflow-wrap: break-word; }
.sol-text strong { color: #5b2a06; }
.sol-cot-loi { font-weight: 800; font-size: 15px; line-height: 1.65; color: #3b1d05; margin-bottom: 14px; }
.sol-pa { padding: 6px 0; font-size: 14px; line-height: 1.65; color: #78350f; }
.sol-pa + .sol-pa { border-top: 1px dashed rgba(146, 64, 14, .18); }
.sol-pa strong { color: #78350f; }
.sol-pa.chon { font-weight: 700; color: #14532d; }
.sol-step { font-size: 14.5px; line-height: 1.65; color: #78350f; padding-left: 18px; text-indent: -18px; }
.sol-ket { font-size: 15px; font-weight: 800; color: #451a03; }
/* Ảnh lời giải gốc chụp từ đề của tác giả. Nền trắng vì ảnh cắt ra là giấy
   trắng mực đen; đặt trên nền kem của ô lời giải sẽ thấy một vệt lệch màu. */
.sol-anh { margin-top: 8px; }
.sol-anh img { display: block; width: 100%; height: auto; border-radius: 12px; background: #fff; border: 1px solid #fde68a; }
.sol-step + .sol-label, .sol-text + .sol-anh { margin-top: 12px; }

/* ============ TÊN EM HỎI (trang tổng hợp câu hỏi) ============
   HOIBAITHAY.md mục 4D. Nằm ở ĐÂY chứ không ở một bảng kiểu riêng: cả app chỉ
   có MỘT bộ dựng phiếu, thêm bộ thứ hai là hai trang bắt đầu lệch nhau. */
.cau-hoi-nhom { display: flex; flex-direction: column; }
.em-hoi {
  margin: -4px 0 0; padding: 9px 14px;
  border: 1px solid var(--vien); border-top: none;
  border-radius: 0 0 12px 12px;
  background: var(--the-nen);
  font-size: 13.5px; line-height: 1.6; color: var(--muc-2);
  overflow-wrap: break-word;
}
.em-hoi b { color: var(--muc); }
.em-ghi-chu { padding: 2px 14px 0; font-size: 13px; line-height: 1.6; color: var(--nhat); overflow-wrap: break-word; }
.em-ghi-chu:last-child { padding-bottom: 8px; }

/* ================= CHÂN TRANG ================= */
.chan { margin-top: 26px; text-align: center; font-size: 12.5px; line-height: 1.7; color: var(--nhat); }

/* CĂN GIỮA THEO NÉT CHỮ, KHÔNG THEO HỘP DÒNG.
 *
 * Căn giữa bằng flex chỉ đưa HỘP DÒNG vào giữa, mà hộp dòng còn chừa chỗ cho
 * phần đuôi chữ đi xuống (g, y, p). Chữ A B C D, số, hay chữ Đ không dùng đến
 * chỗ đó nên nét chữ luôn nằm CAO HƠN tâm ô tròn khoảng 1-2px.
 *
 * text-box-trim cắt đúng phần thừa trên đỉnh chữ hoa và dưới đường chân chữ,
 * nên hộp chữ TRÙNG nét chữ và căn giữa thành chính xác.
 *
 * BẪY ĐÃ DÍNH: đặt thẳng lên .q-opt-letter KHÔNG ăn, vì ô đó là flex container
 * — text-box-trim chỉ áp cho khối có dòng chữ thật bên trong. Phải bọc ký tự
 * bằng một thẻ span riêng rồi cắt trên span đó. Trình duyệt cũ không hiểu thì
 * bỏ qua, ô vẫn tròn chứ không vỡ. */
.ky {
  display: block;
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  text-box: trim-both cap alphabetic;
}
.q-opt-text, .q-tag, .tf-statement, .stat-number {
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  text-box: trim-both cap alphabetic;
}

@media (max-width: 640px) {
  .khung { padding: 0 10px 56px; }
  .q-header { padding: 12px 12px 0; gap: 10px; }
  .q-than { padding: 8px 12px 12px; }
  .sol-box { margin: 0 12px 12px; }
  .q-nut-giai { padding: 0 12px; }
  .q-options { grid-template-columns: 1fr; }
  /* Thanh gọn lại còn HAI dòng: dòng đếm, rồi hai nút chia đôi. Ba dòng như
     bản đầu là thanh dính nuốt gần nửa màn điện thoại. */
  .thanh { gap: 8px; padding: 8px 10px; }
  .thanh-chu { flex: 1 0 100%; font-size: 12.5px; }
  .thanh .nut { flex: 1; justify-content: center; padding: 0 10px; font-size: 13px; }
  .q-card { scroll-margin-top: 104px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { transition-duration: .01ms !important; }
}

/* ================= BẢN IN =================
   Bấm In rồi chọn "Lưu thành PDF" là ra bản chữ vector, nét và bôi đen chọn
   được. Bản in MỞ SẴN mọi lời giải: trên giấy không bấm được. */
@media print {
  :root, :root.dark, body.dark, [data-theme="dark"] { color-scheme: light; --nen: #ffffff; --the-nen: #ffffff; --muc: #0f172a; --muc-2: #334155; --nhat: #475569; --o-nen: #ffffff; --o-chu: #334155; --chu-cai-nen: #f1f5f9; --chu-cai-muc: #475569; --chon-nen: #eef2f6; --chon-vien: #2f3e46; }
  body { background: #ffffff; }
  .khung { max-width: none; padding: 0; }
  /* Trên giấy không bấm được: bỏ thanh điều khiển, nút mở lời giải và mọi gợi
     ý "bấm vào đây". Để lại là tờ giấy đầy chữ vô nghĩa. */
  .thanh, .stat-loc, .chi-man { display: none; }
  .cover { min-height: auto; height: 250mm; break-after: page; border-radius: 0; }
  .summary-page { max-width: none; margin: 0 0 8mm; break-after: page; box-shadow: none; }
  .q-card { box-shadow: none; break-inside: avoid; margin-bottom: 6mm; }
  .q-card:hover { box-shadow: none; }
  .q-nut-giai { display: none; }
  .sol-wrap { grid-template-rows: 1fr !important; }
  .sol-box { opacity: 1 !important; transform: none !important; }
  .q-opt.dung { background: var(--dung-nen); border-color: var(--dung); color: var(--dung-muc); font-weight: 700; }
  .q-opt.dung .q-opt-letter { background: var(--dung); }
  .tf-badge.d.dung { background: var(--dung-nen); color: var(--dung-muc); border-color: var(--dung); }
  .tf-badge.s.dung { background: var(--sai-nen); color: var(--sai-muc); border-color: var(--sai); }
  .sa-blank { display: none; }
  .sa-answer { display: inline-flex; }
  .ds-cau { gap: 4mm; }

}

/* ================= CHỈ ĐỀ =================
   Một lớp DUY NHẤT cho cả màn hình lẫn bản in: nút "Hiện đề" bật nó để em đọc
   đề mà không thấy đáp án, và lệnh in cũng bật đúng lớp này. Trước đây luật
   chỉ nằm trong @media print nên trên màn hình không có cách nào giấu lời giải
   — mà đó chính là lúc em cần đọc đề trần nhất (thầy chốt 06/09).

   !important vì luật màn hình cho thẻ đang mở có ĐỘ ƯU TIÊN BẰNG luật này.
   Thẻ nào đang mở đọc dở lúc bấm là câu đó vẫn tô xanh đáp án. */
body.chi-de .sol-wrap { display: none !important; }
body.chi-de .q-nut-giai { visibility: hidden; }
/* CHƯA NỘP THÌ KHÔNG CÓ LỜI GIẢI (thầy chốt 08/09: "phải nộp xong mới hiện").
   Mở sẵn lời giải trong lúc em còn đang chọn thì bài luyện thành bài chép, và
   con số "đúng 7/10" không còn nghĩa gì.

   Giấu bằng CSS chứ không cắt lời giải khỏi tệp: em nộp xong là mở ra ngay,
   không phải gọi lại máy chủ — phiếu mở từ Zalo hay lúc mất mạng vẫn chạy.
   Đánh đổi, nói thẳng: ai mở mã nguồn trang vẫn đọc được đáp án. Đây là phiếu
   tự luyện ở nhà, không phải bài thi có coi. */
/* CHƯA NỘP: giấu MỌI đường tới đáp án, không riêng nút trên từng thẻ.
   Bản đầu chỉ giấu .q-nut-giai và một lớp .q-giai KHÔNG TỒN TẠI (khối lời giải
   thật tên là .sol-wrap), nên nút "Mở tất cả" ở thanh trên vẫn mở được sạch cả
   11 câu — thầy bắt được ngay 08/09.

   Bốn đường phải bịt hết:
     1. nút lời giải trên từng thẻ và khối lời giải;
     2. nút "Mở tất cả" và "Hiện đề" ở thanh trên (cả hai đều mở đáp án);
     3. bộ đếm "Đã xem lời giải x/y" — nói ra là có lời giải để xem;
     4. lựa chọn tải PDF KÈM lời giải.
   Kèm theo: tô đáp án đúng trên thân câu cũng phải tắt, y như chế độ chi-de,
   phòng khi một thẻ nào đó lọt vào trạng thái mở.
   (Cấm dấu huyền ngược trong khối này: cả khối nằm trong một chuỗi mẫu.) */
body.chua-nop .q-nut-giai, body.chua-nop .sol-wrap { display: none !important; }
body.chua-nop #mo-het, body.chua-nop #chi-de, body.chua-nop #pdf-giai, body.chua-nop .dem-giai { display: none !important; }
/* GIẤU ĐÁP ÁN TRƯỚC KHI NỘP — nhưng CHỪA Ô EM ĐANG CHỌN.
   Đây là nguyên nhân gốc của "lựa chọn A chưa bao giờ bấm được" (thầy chỉ ra
   08/09). Ô đáp án đúng mang lớp "dung"; ba luật này dùng !important nên đè
   luôn cả màu của ô ĐANG ĐƯỢC CHỌN, vốn không có !important. Hậu quả: em bấm
   trúng đáp án đúng thì cú bấm VẪN ĂN (đếm lên, lưu lại) nhưng ô không đổi màu
   một chút nào — nhìn y như không bấm được, bấm lại lần nữa là bỏ chọn.
   Ba đợt trước tôi đi sửa tầng sự kiện chạm; sự kiện chưa bao giờ hỏng.
   SỬA LẠI 08/09 TỐI. Bản trưa dùng :not([aria-checked=true]) để chừa ô đang chọn
   ra — TẮT luật giấu cho ô đó. Hậu quả: ô đáp án ĐÚNG khi được chọn rơi về style
   .dung (xanh lá) còn ô sai rơi về style chọn thường (xám), nên em bấm là biết
   ngay đúng hay sai. Đo trên Chromium: ô đúng rgb(215,250,232), ô sai
   rgb(239,243,247). Em nhắn thầy đúng chỗ này.
   Cách đúng không phải TẮT luật giấu mà là ĐÈ LÊN nó: giấu vẫn áp cho mọi ô
   mang lớp dung, rồi luật "đang chọn" mang !important đặt ngay sau và thắng.
   Ô nào em chọn cũng ra CÙNG MỘT MÀU, đúng hay sai chưa nói gì.
   (Cấm dấu huyền ngược trong khối này: cả khối nằm trong một chuỗi mẫu.) */
/* 15/09 - BO HAN LOI "TO LAI CHO TRUNG HOA".
   Ba luat cu o day ve lai o dap an bang mot bo mau KHAC bo mau cua o thuong:
   nen #f8fafc trong khi o thuong la #ffffff, chu var(--muc-2) trong khi o
   thuong la var(--muc), va chu cai nen var(--vien-dam) trong khi o thuong la
   #f1f5f9. Bon cho lech mau la bon cho lo dap an - thay chup duoc 15/09: bam
   "Hien de" ma o B va o D van khac hen ba o con lai.
   Khong the va lai cho giong bang tay: them mot thuoc tinh moi vao .q-opt.dung
   la lo lai. Nay LOP "dung" KHONG CON TRONG THE khi dang giau (ham
   dongBoLoDapAn o phan mã lệnh go han lop ra khoi DOM), nen khong con luat nao
   de ve. Cam them luat body.chua-nop .q-opt.dung / body.chi-de .q-opt.dung.
   (Cam dau huyen nguoc trong khoi nay: ca khoi nam trong mot chuoi mau.) */
body.chua-nop .sa-answer { display: none !important; }
body.chua-nop .sa-blank { display: block !important; }
/* DAP AN VIET THANG RA CHU cung phai giau, khong chi rieng o to mau:
   - .lo-dap la menh de "dap an dung X" trong hop nhac cua phieu de-cua-em;
   - .lam-ket la chu "Dung"/"Sai" gan vao tung the sau khi nop, noi gian tiep
     o em chon la dung hay sai.
   Hai cho nay nam NGOAI khoi loi giai nen luat giau loi giai khong voi toi.
   (Cam dau huyen nguoc trong khoi nay: ca khoi nam trong mot chuoi mau.) */
body.chua-nop .lo-dap, body.chi-de .lo-dap { display: none !important; }
body.chi-de .lam-ket { display: none !important; }
.giai-khoa {
  margin: 0 0 10px; padding: 10px 14px; border-radius: 12px; background: #fdf6e7;
  color: #8a6d1f; font-size: 12.5px; font-weight: 600; line-height: 1.5;
}
body:not(.chua-nop) .giai-khoa { display: none; }
/* Chế độ "Hiện đề" cũng giấu đáp án — và cũng phải chừa ô em đang chọn, cùng
   một lý do như khối chua-nop bên trên. */
/* Xem ghi chu 15/09 o khoi chua-nop ben tren: lop "dung" bi go khoi DOM chu
   khong to lai mau. (Cam dau huyen nguoc trong khoi nay.) */
body.chi-de .q-card { border-left-color: var(--vien-dam) !important; }
body.chi-de .sa-answer { display: none !important; }
body.chi-de .sa-blank { display: block !important; }
body.chi-de #mo-het, body.chi-de .thanh-chu b { display: none; }

/* Ô EM ĐANG CHỌN — MỘT MÀU DUY NHẤT, ĐÚNG HAY SAI ĐỀU THẾ.
   Đặt SAU hai khối giấu bên trên và mang !important nên thắng chúng. Nhờ vậy
   ô bấm vẫn đổi màu (thầy báo trưa 08/09: "lựa chọn A chưa bao giờ bấm được")
   mà không lộ đáp án (thầy báo tối 08/09: "bấm 1 đáp án ra hết 4 đáp án").
   Hai yêu cầu ấy chỉ cùng thoả khi màu ô-đang-chọn KHÔNG phụ thuộc lớp dung. */
body.chua-nop .q-opt.lam-o[aria-checked="true"],
body.chi-de .q-opt.lam-o[aria-checked="true"] { background: var(--chon-nen) !important; border-color: var(--chon-vien) !important; color: var(--muc) !important; font-weight: 600 !important; }
body.chua-nop .q-opt.lam-o[aria-checked="true"] .q-opt-letter,
body.chi-de .q-opt.lam-o[aria-checked="true"] .q-opt-letter { background: #2f3e46 !important; color: #ffffff !important; }
body.chua-nop .tf-badge.lam-o[aria-checked="true"],
body.chi-de .tf-badge.lam-o[aria-checked="true"] { background: #2f3e46 !important; border-color: #2f3e46 !important; color: #ffffff !important; }

/* HỘP CHỌN KIỂU PDF — thầy chốt 06/09: bấm Tải PDF phải hỏi tải đề trần hay
   tải cả lời giải, thay vì đoán hộ. Hai lựa chọn ra hai tệp khác hẳn nhau:
   một bản phát cho em tự làm, một bản để dò bài. */
.pdf-boc { position: relative; }
.pdf-chon {
  position: absolute; right: 0; bottom: calc(100% + 10px); z-index: 30;
  display: flex; flex-direction: column; gap: 10px; width: max-content; min-width: 214px; max-width: 78vw;
  padding: 14px; border-radius: 20px; background: var(--the-nen);
  border: 1px solid var(--vien); box-shadow: 0 4px 10px rgba(15,23,42,.06), 0 22px 50px -14px rgba(15,23,42,.32);
}
.pdf-chon[hidden] { display: none; }
.pdf-chon button {
  display: block; width: 100%; text-align: left; min-height: 48px;
  padding: 12px 18px; border-radius: 999px; border: 1px solid var(--vien-dam); background: var(--o-nen);
  font: inherit; font-size: 14.5px; font-weight: 800; color: var(--muc); cursor: pointer;
  transition: background-color var(--muot), border-color var(--muot);
}
.pdf-chon button:hover { background: #f1f5f9; border-color: var(--nav); }
.pdf-nhac { font-size: 12.5px; line-height: 1.5; color: var(--nhat); font-weight: 500; }
.pdf-nhac b { color: var(--muc-2); font-weight: 800; }
@media print { .pdf-chon, .thanh { display: none !important; } }
`,M=`<svg class="q-mui" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;function N(e,t,r=!1,a=!1,s=!1,c=!1,l){let u=e.chuaCho,d=!!(c&&l&&t>l),f=c?e.mucDo===`van_dung`?`<span class="q-tag vong-btvn vong-3">Vòng 3: Thử Thách (x2 EXP)</span>`:e.mucDo===`hieu`?`<span class="q-tag vong-btvn vong-2">Vòng 2: Trọng Tâm</span>`:`<span class="q-tag vong-btvn vong-1">Vòng 1: Lõi Căn Bản</span>`:``,p=[c&&l&&t<=l?`<span class="q-tag muc-tieu-hom-nay-tag">✨ Mục tiêu hôm nay</span>`:``,f,u?`<span class="q-tag ${u.laDeCuaEm?`sai-cua-em`:`chua`}">${u.laDeCuaEm?`Em làm sai câu ${u.soCau} phần ${u.phan}`:u.laLamLai?`Làm lại câu ${u.soCau} phần ${u.phan}`:u.theoChuyenDe?`Luyện thêm cho câu ${u.soCau} phần ${u.phan}`:`Khắc phục lỗi sai câu ${u.soCau} phần ${u.phan}`}</span>`:``,u&&u.laLamLai?`<span class="q-tag chua-2">kho chưa có câu cùng dạng</span>`:``,u&&u.theoChuyenDe?`<span class="q-tag chua-2">cùng chuyên đề, chưa chắc cùng dạng</span>`:``,u&&!u.laDeCuaEm&&!u.laLamLai&&!u.theoChuyenDe&&u.bac===2?`<span class="q-tag chua-2">cùng cơ chế, khác việc</span>`:``,`<span class="q-tag ${b[e.phan]}">${y[e.phan]}</span>`,e.mucDo?`<span class="q-tag ${v[e.mucDo]}">${_[e.mucDo]}</span>`:``,e.chuyenDe?`<span class="q-tag topic">${x(e.chuyenDe)}</span>`:``].filter(Boolean).join(``),m=``;if(e.phan===`I`&&e.luaChon){let t=e.luaChon.some(e=>(e||``).length>56),n=e.luaChon.map((t,n)=>{let r=h[n]===(e.dapAn||``).trim().toUpperCase(),i=!!(u&&u.daChon&&u.daChon.trim().toUpperCase()===h[n]&&!r),a=`${r?` data-dung="1"`:``}${i?` data-sai="1"`:``}`,o=`q-opt`,c=e.anhLuaChon?.[n],l=c?D(c,`pa`,`Phương án ${h[n]}`):S(t),d=`<span class="q-opt-letter"><span class="ky">${h[n]}</span></span><span class="q-opt-text">${l}${O(e,`sau_pa_${h[n]}`)}</span>`;return s?`<button type="button" class="${o} lam-o"${a} data-chon="${h[n]}" role="radio" aria-checked="false">${d}</button>`:`<div class="${o}"${a}><div class="q-opt-letter"><span class="ky">${h[n]}</span></div><div class="q-opt-text">${l}${O(e,`sau_pa_${h[n]}`)}</div></div>`}).join(``);m=`<div class="q-options${t?` single-col`:``}">${n}</div>`}else if(e.phan===`II`&&e.luaChon){let t=A(e.dapAn);m=e.luaChon.map((n,r)=>{let i=e.anhLuaChon?.[r],a=i?D(i,`pa`,`Ý ${g[r]}`):S(n),o=(e,t,n)=>s?`<button type="button" class="tf-badge ${e} lam-o"${n?` data-dung="1"`:``} data-chon="${e===`d`?`D`:`S`}" role="radio" aria-checked="false" aria-label="${t===`Đ`?`Đúng`:`Sai`} — ý ${g[r]}"><span class="ky">${t}</span></button>`:`<div class="tf-badge ${e}"${n?` data-dung="1"`:``}><span class="ky">${t}</span></div>`;return`<div class="tf-item"${s?` data-y="${g[r]}"`:``}><div class="tf-statement">${g[r]}. ${a}${O(e,`sau_y_${g[r]}`)}</div><div class="tf-o">${o(`d`,`Đ`,t[r])}${o(`s`,`S`,!t[r])}</div></div>`}).join(``)}else{let t=s?`<input class="lam-nhap" type="text" inputmode="decimal" autocomplete="off" aria-label="Đáp án của em" placeholder="Đáp án của em">`:`<div class="sa-blank">Đáp án: ……………………………</div>`;m=a?`<div class="sa-vung">${t}</div>`:`<div class="sa-vung">${t}<div class="sa-answer"><span class="ky">${S(e.dapAn||`—`)}</span></div></div>`}let C=n(e.text),w=(e.anhThanCau?D(e.anhThanCau,`than`,`Đề bài`):`<div class="q-text" style="white-space: pre-line;">${S(C)}</div>`)+i(C),T=a?``:F(e),E=T?`<button class="q-nut-giai" type="button" aria-expanded="${r?`true`:`false`}" aria-controls="giai-${t}">${M}<span class="chu-mo">Xem lời giải</span><span class="chu-dong">Ẩn lời giải</span></button>
  <div class="sol-wrap" id="giai-${t}"><div class="sol-inner">${T}</div></div>`:``,j=u&&u.laDeCuaEm?`<div class="lam-lai"><b>Em chọn ${u.daChon?x(u.daChon):`chưa trả lời`}<span class="lo-dap">${u.dapAnDung||e.dapAn?` · đáp án đúng ${x(u.dapAnDung||e.dapAn)}`:``}</span>.</b> Đọc lời giải bên dưới rồi tự làm lại câu này.</div>`:u&&u.laLamLai?`<div class="lam-lai"><b>Lần thi vừa rồi em chọn ${u.daChon?x(u.daChon):`sai câu này`}.</b>${u.viSaoSai?` ${x(u.viSaoSai)}`:` Em xem lại lời giải bên dưới rồi tự làm lại từ đầu.`}</div>`:``,N=d?`<div class="dimmed-pacing-banner"><span class="dimmed-lock-icon">🔒</span><span>Câu thuộc Vòng tiếp theo · Hoàn thành ${l} câu sáng hôm nay trước để đạt chỉ tiêu</span></div>`:``;return`<article class="${[`q-card`,u?`la-chua`:``,r?`mo`:``,T?``:`khong-giai`,d?`q-card-dimmed`:c&&l?`q-card-active`:``].filter(Boolean).join(` `)}" data-so="${t}" data-phan="${e.phan}" data-muc="${x(e.mucDo||``)}"${s?` data-qid="${x(e.id||``)}"`:``}>
  <div class="q-header"><div class="q-num"><span class="ky">${t}</span></div><div class="q-tags">${p}</div></div>
  <div class="q-than">
    ${N}
    ${j}
    ${w}
    ${k(e.bang)}
    ${o(e.text,O(e,`sau_de`))}
    ${m}
    ${O(e,`cuoi_cau`)}
  </div>
  ${E}
</article>`}function P(e){return e.phan===`II`&&/^[DS]{2,4}$/.test(e.dapAn)?e.dapAn.split(``).map(e=>e===`D`?`Đ`:`S`).join(` `):e.dapAn||`—`}function F(e){let t=e.chot,n=e.lyDo,r=e.buoc,i=e.ketQua;if(!t&&(!n||n.length===0)&&(!r||r.length===0)){let a=e.loiGiai||e.giaiThich||e.explanation||e.noiDung||e.viSao;if(a){let o=s(a,e.phan,e.dapAn);o.chot&&(t=o.chot),o.lyDo&&o.lyDo.length>0&&(n=o.lyDo),o.buoc&&o.buoc.length>0&&(r=o.buoc),o.ketQua&&!i&&(i=o.ketQua)}}let a=[`<div class="sol-dap">Đáp án: <b>${S(P(e))}</b></div>`],o=e.phan===`II`?g.filter((t,n)=>A(e.dapAn)[n]):[(e.dapAn||``).trim().toUpperCase()],c=!1,l=t?S(t).trim():``;if(l&&!l.includes(`[object Object]`)&&(a.push(`<div class="sol-label">Kiến thức cốt lõi</div><div class="sol-text sol-cot-loi">${l}</div>`),c=!0),n&&n.length>0){let t=n.map(e=>`<div class="sol-pa${o.includes(e.khoa)?` chon`:``}"><strong>${x(e.khoa)}.</strong> ${o.includes(e.khoa)?`✓ `:`✗ `}${S(e.ly)}</div>`).join(``);a.push(`<div class="sol-label">${e.phan===`II`?`Vì sao từng ý đúng / sai`:`Vì sao chọn / không chọn từng phương án`}</div><div class="sol-text">${t}</div>`),c=!0}let u=r??[];if(u.length>0){let e=u.map((e,t)=>`<div class="sol-step">${t+1}. ${S(e)}</div>`).join(``);a.push(`<div class="sol-label">Làm từng bước</div>${e}`),c=!0}i&&(a.push(`<div class="sol-label">Kết quả</div><div class="sol-text sol-ket">${S(i)}</div>`),c=!0);let d=O(e,`sau_loi_giai`);return d&&(a.push(`<div class="sol-label">Lời giải của Thầy</div><div class="sol-anh">${d}</div>`),c=!0),!c&&!e.dapAn?``:`<div class="sol-box">${a.join(``)}</div>`}function I(e){let n=t(String(e??``)).normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).replace(/đ/g,`d`).toLowerCase(),r=(...e)=>e.some(e=>n.includes(e));return r(`ester`,`lipid`,`chat beo`,`xa phong`)?{chinh:`RCOOR'`,troi:[`RCOOR&#39;`,`CH<sub>3</sub>COOH`,`C<sub>9</sub>H<sub>8</sub>O<sub>4</sub>`]}:r(`carbohydrate`,`glucose`,`saccharose`,`tinh bot`,`cellulose`)?{chinh:`C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>`,troi:[`C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>`,`C<sub>12</sub>H<sub>22</sub>O<sub>11</sub>`,`(C<sub>6</sub>H<sub>10</sub>O<sub>5</sub>)<sub>n</sub>`]}:r(`nitrogen`,`amine`,`amino acid`,`peptide`,`protein`)?{chinh:`H<sub>2</sub>N&ndash;R&ndash;COOH`,troi:[`CH<sub>3</sub>NH<sub>2</sub>`,`H<sub>2</sub>N&ndash;CH<sub>2</sub>&ndash;COOH`,`&ndash;CO&ndash;NH&ndash;`]}:r(`polymer`,`chat deo`,`to `,`cao su`)?{chinh:`(&ndash;CH<sub>2</sub>&ndash;CH<sub>2</sub>&ndash;)<sub>n</sub>`,troi:[`(&ndash;CH<sub>2</sub>&ndash;CH<sub>2</sub>&ndash;)<sub>n</sub>`,`CH<sub>2</sub>=CHCl`,`C<sub>5</sub>H<sub>8</sub>`]}:r(`dien phan`,`pin dien`,`the dien cuc`,`an mon`)?{chinh:`E&deg;<sub>pin</sub>`,troi:[`Zn | Zn<sup>2+</sup>`,`Cu<sup>2+</sup> | Cu`,`2H<sub>2</sub>O &rarr; O<sub>2</sub>`]}:r(`kim loai`,`hop kim`,`nhom ia`,`nhom iia`,`kiem tho`,`nuoc cung`)?{chinh:`M &rarr; M<sup>n+</sup>`,troi:[`Fe<sub>2</sub>O<sub>3</sub>`,`CaCO<sub>3</sub>`,`Al(OH)<sub>3</sub>`]}:r(`phuc chat`,`nguyen to chuyen tiep`,`kim loai chuyen tiep`)?{chinh:`[Cu(NH<sub>3</sub>)<sub>4</sub>]<sup>2+</sup>`,troi:[`[Ag(NH<sub>3</sub>)<sub>2</sub>]<sup>+</sup>`,`Fe<sup>3+</sup>`,`K<sub>2</sub>Cr<sub>2</sub>O<sub>7</sub>`]}:r(`can bang`,`toc do phan ung`,`nhiet `,`entropy`,`enthalpy`)?{chinh:`&Delta;<sub>r</sub>H&deg;<sub>298</sub>`,troi:[`K<sub>C</sub>`,`v = k[A]<sup>m</sup>`,`N<sub>2</sub> + 3H<sub>2</sub> &#8652; 2NH<sub>3</sub>`]}:{chinh:`H&oacute;a h&#7885;c`,troi:[`H<sub>2</sub>O`,`NaOH`,`CO<sub>2</sub>`]}}function L(e,t){let n=e.ketQua?`<div class="cover-info-item" style="flex:0 1 auto;background:#fef2f2;border-color:#fecaca;">
    <div class="cover-info-label" style="color:#dc2626;">Kết quả</div>
    <div class="cover-info-value" style="color:#b91c1c;">${x(e.ketQua)}</div></div>`:``,r=x(e.tenChuyenDe||`Hoá học`).toUpperCase().replace(/\s*([–—-])\s*/,`<br>$1 `).replace(/\s+&\s+/,`<br>& `),i=(e.oBia&&e.oBia.length>0?e.oBia:[{nhan:`Học sinh`,gia:e.hoTen},{nhan:`SBD`,gia:e.sbd}]).filter(e=>e.gia).map(e=>`<div class="cover-info-item"><div class="cover-info-label">${x(e.nhan)}</div><div class="cover-info-value">${x(e.gia)}</div></div>`).join(``),a=I(e.tenChuyenDe);return`<header class="cover">
  <div class="google-bar"><div class="g-blue"></div><div class="g-red"></div><div class="g-yellow"></div><div class="g-green"></div></div>
  <div class="cover-blob b1"></div><div class="cover-blob b2"></div>
  <div class="cover-content">
    <div class="cover-badge">${x(e.nhanBia||(e.hienDapAn?`Lời giải chi tiết`:`Phiếu bài tập riêng`))}<span class="ct">${a.chinh}</span></div>
    <h1 class="cover-title">${r}</h1>
    <div class="cover-subtitle">Thầy Đỗ Đại Học · ${t} câu · ${E(e.ngay)}</div>
    <div class="cover-info">
      ${i}
      ${n}
    </div>
  </div>
</header>`}function R(e,t,n){let r=`<span class="stat-number">${e}</span><span class="stat-label">${t}</span>`;return e===0?`<div class="stat-card" style="opacity:.5">${r}</div>`:`<button type="button" class="stat-card" data-loc="${n}" aria-pressed="false" title="${n===`tat`?`Xem tất cả`:`Chỉ xem phần này`}">${r}</button>`}function z(e,t=!1){let n=t=>e.filter(e=>e.phan===t).length,r=[[`biet`,`#1e8e3e`,`Nhận biết`],[`hieu`,`#e37400`,`Thông hiểu`],[`van_dung`,`#c5221f`,`Vận dụng`]].map(([n,r,i])=>{let a=e.map((e,t)=>({c:e,i:t})).filter(e=>e.c.mucDo===n);if(a.length===0)return``;let o=a.map(e=>e.i+1),s=o[o.length-1]-o[0]+1===o.length,c=o.length===1?`Câu ${o[0]}`:s?`Câu ${o[0]}–${o[o.length-1]}`:`Câu ${o.join(`, `)}`,l=[...new Set(a.map(e=>e.c.chuyenDe).filter(Boolean))].join(`, `),u=t?n===`biet`?`<span class="vong-pill p1">Vòng 1: Lõi Căn Bản (Bắt buộc)</span>`:n===`hieu`?`<span class="vong-pill p2">Vòng 2: Trọng Tâm Cá Nhân (Bắt buộc)</span>`:`<span class="vong-pill p3">Vòng 3: Thử Thách Bứt Phá (x2 EXP)</span>`:``;return`<button type="button" class="topic-item" data-loc="muc:${n}" aria-pressed="false"><span class="topic-cham"><span class="topic-dot" style="background:${r};"></span></span><span class="topic-ten"><strong>${i}</strong>${l?`<span class="topic-cd">${x(l)}</span>`:``}${u}</span><span class="topic-cau">${c} · ${a.length} câu</span></button>`}).join(``),i=e.filter(e=>e.mucDo===`biet`||!e.mucDo).length,a=e.filter(e=>e.mucDo===`hieu`).length,o=e.filter(e=>e.mucDo===`van_dung`).length;return`<section class="summary-page">
  ${t?`<div class="btvn-3vong-banner">
  <div class="btvn-3vong-tieu-de">
    <strong>THUẬT TOÁN 3 VÒNG PHÂN TẦNG BÀI TẬP VỀ NHÀ:</strong>
    <span class="btvn-chi-tieu">Hoàn thành Vòng 1 + Vòng 2 là đạt 100% chỉ tiêu BTVN</span>
  </div>
  <div class="btvn-3vong-grid">
    <div class="vong-col col-1">
      <div class="vong-head">VÒNG 1: LÕI CĂN BẢN · ${i} câu</div>
      <div class="vong-body">Kiến thức cốt lõi nhận biết & thông hiểu. Bắt buộc 100% học sinh hoàn thành để nắm chắc nền tảng.</div>
    </div>
    <div class="vong-col col-2">
      <div class="vong-head">VÒNG 2: TRỌNG TÂM CÁ NHÂN · ${a} câu</div>
      <div class="vong-body">Rèn luyện kỹ năng & lấp lỗ hổng chuyên đề. Bắt buộc hoàn thành để đạt chuẩn bài tập.</div>
    </div>
    <div class="vong-col col-3">
      <div class="vong-head">VÒNG 3: THỬ THÁCH BỨT PHÁ · ${o} câu</div>
      <div class="vong-body">Vận dụng cao 2 sao. Không ép buộc học sinh; thử sức để bứt phá điểm 9–10 và nhận x2 EXP Thần Thú.</div>
    </div>
  </div>
</div>`:``}
  <div class="summary-dau">
    <span class="summary-title">Tổng quan đề bài</span>
    <span class="summary-tong">${e.length} câu · chạm một ô để xem riêng phần đó</span>
  </div>
  <div class="stats-grid">
    ${R(e.length,`Tổng số câu`,`tat`)}
    ${R(n(`I`),`Trắc nghiệm`,`phan:I`)}
    ${R(n(`II`),`Đúng / Sai`,`phan:II`)}
    ${R(n(`III`),`Trả lời ngắn`,`phan:III`)}
  </div>
  ${r?`<div class="topics-list"><h3>${t?`Phân loại mức độ & Vòng phân tầng`:`Phân loại mức độ`}</h3>${r}</div>`:``}
</section>`}function B(e,t=[]){let n=(e,t)=>`${e??`?`}|${t}`,r={I:1,II:2,III:3},i=new Map;for(let t of e){let e=t.chuaCho;if(!e||e.theoChuyenDe||e.laDeCuaEm)continue;let r=n(e.phan,e.soCau),a=i.get(r)??{phan:e.phan,soCau:e.soCau,ten:e.tenDang||``,so:0};a.so+=1,!a.ten&&e.tenDang&&(a.ten=e.tenDang),i.set(r,a)}if(i.size===0&&t.length===0)return``;let a=(e,t)=>r[e.phan]-r[t.phan]||e.soCau-t.soCau,o=[...i.values()].sort(a).map(e=>`<li><b>Câu ${e.soCau} phần ${e.phan}</b>${e.ten?` · ${x(e.ten)}`:``} <span class="chua-mui">-&gt;</span> ${e.so} câu khắc phục</li>`),s=t.filter(e=>!i.has(n(e.phan,e.soCau))).map(e=>`<li class="mo"><b>Câu ${e.soCau}${e.phan?` phần ${e.phan}`:``}</b>${e.tenDang?` · ${x(e.tenDang)}`:``} <span class="chua-mui">-&gt;</span> ${x(e.vi)}</li>`);return`<section class="chua-gi">
  <h3>Phiếu này khắc phục lỗi nào</h3>
  <ul>${o.join(``)}${s.join(``)}</ul>
</section>`}function V(e,t=!1){return t?`<div class="thanh">
  <div class="thanh-chu">Phiếu chỉ có đề<span class="the-loc" id="the-loc" hidden> · <b id="ten-loc"></b></span></div>
  <button class="nut nho" type="button" id="bo-loc" hidden>Bỏ lọc</button>
  <button class="nut nho" type="button" id="doi-mau" title="Đổi sang sắc cầu vồng tiếp theo">Đổi màu</button>
  <button class="nut chinh" type="button" id="pdf-de" title="Hộp thoại in mở ra, chọn Lưu thành PDF">Tải PDF</button>
</div>`:`<div class="thanh">
  <div class="thanh-chu"><span class="dem-giai">Đã xem lời giải <b id="dem-mo">0</b>/<span id="dem-tong">${e}</span> câu</span><span class="the-loc" id="the-loc" hidden> · <b id="ten-loc"></b></span></div>
  <button class="nut nho" type="button" id="bo-loc" hidden>Bỏ lọc</button>
  <button class="nut nho" type="button" id="doi-mau" title="Đổi sang sắc cầu vồng tiếp theo">Đổi màu</button>
  <button class="nut" type="button" id="chi-de" aria-pressed="false" title="Giấu đáp án và lời giải để đọc đề trần"><span class="chu-mo">Hiện đề</span><span class="chu-dong">Hiện cả lời giải</span></button>
  <button class="nut chinh" type="button" id="mo-het" aria-pressed="false"><span class="chu-mo">Mở tất cả</span><span class="chu-dong">Đóng tất cả</span></button>
  <span class="pdf-boc">
    <button class="nut dam" type="button" id="tai-pdf" aria-haspopup="true" aria-expanded="false">Tải PDF</button>
    <span class="pdf-chon" id="pdf-chon" role="menu" hidden>
      <button type="button" id="pdf-de" role="menuitem">Chỉ đề bài</button>
      <button type="button" id="pdf-giai" role="menuitem">Đề và lời giải</button>
      <span class="pdf-nhac">Hộp thoại in mở ra, chọn <b>Lưu thành PDF</b>.</span>
    </span>
  </span>
</div>`}var H=`
(function () {
  // BẢY SẮC CẦU VỒNG XOAY VÒNG (thầy chốt 08/09). Mở phiếu lần nào là nhích
  // sang sắc kế tiếp, hết 7 thì quay về 1; nút "Đổi màu" nhích ngay tại chỗ.
  // Số thứ tự cất ở localStorage nên đóng phiếu mở lại vẫn đi tiếp, không nhảy
  // về đầu. Máy chặn localStorage thì rơi về sắc 1, phiếu vẫn chạy đủ.
  // (Cấm dấu huyền ngược trong khối này: cả khối nằm trong một chuỗi mẫu.)
  var KHOA_MAU = 'ddh.phieu.mau';
  var SO_MAU = 7;
  function datMau(n) {
    var v = ((Number(n) - 1) % SO_MAU + SO_MAU) % SO_MAU + 1;
    document.body.setAttribute('data-mau', String(v));
    try { localStorage.setItem(KHOA_MAU, String(v)); } catch (eM) {}
    return v;
  }
  var mauHienTai = 0;
  try { mauHienTai = Number(localStorage.getItem(KHOA_MAU)) || 0; } catch (eM0) { mauHienTai = 0; }
  mauHienTai = datMau(mauHienTai + 1);
  var nutMau = document.getElementById('doi-mau');
  if (nutMau) nutMau.addEventListener('click', function () { mauHienTai = datMau(mauHienTai + 1); });

  var tatCa = Array.prototype.slice.call(document.querySelectorAll('.q-card'));
  var dem = document.getElementById('dem-mo');
  var demTong = document.getElementById('dem-tong');
  var nutHet = document.getElementById('mo-het');
  var nutChiDe = document.getElementById('chi-de');
  var nutPdf = document.getElementById('tai-pdf');
  var hopPdf = document.getElementById('pdf-chon');
  var nutPdfDe = document.getElementById('pdf-de');
  var nutPdfGiai = document.getElementById('pdf-giai');
  var nutBo = document.getElementById('bo-loc');
  var theLoc = document.getElementById('the-loc');
  var tenLoc = document.getElementById('ten-loc');
  var dsCau = document.querySelector('.ds-cau');
  var locHienTai = '';

  /** Các thẻ ĐANG hiện và CÓ lời giải — mẫu số của bộ đếm và tập mà nút
   * "Mở tất cả" tác động. Lọc còn 4 câu mà vẫn ghi /20 là nói sai. */
  function dangXem() {
    var ra = [];
    for (var i = 0; i < tatCa.length; i++) {
      var t = tatCa[i];
      if (!t.classList.contains('an') && !t.classList.contains('khong-giai')) ra.push(t);
    }
    return ra;
  }

  function demLai() {
    var ds = dangXem();
    var n = 0;
    for (var i = 0; i < ds.length; i++) if (ds[i].classList.contains('mo')) n++;
    if (dem) dem.textContent = String(n);
    if (demTong) demTong.textContent = String(ds.length);
    var het = ds.length > 0 && n === ds.length;
    if (nutHet) {
      nutHet.setAttribute('aria-pressed', het ? 'true' : 'false');
      nutHet.classList.toggle('dang-mo-het', het);
      nutHet.disabled = ds.length === 0;
    }
    return { so: n, ds: ds, het: het };
  }

  function bat(the, mo) {
    if (the.classList.contains('khong-giai')) return;
    the.classList.toggle('mo', mo);
    var nut = the.querySelector('.q-nut-giai');
    if (nut) nut.setAttribute('aria-expanded', mo ? 'true' : 'false');
  }

  function khop(the, l) {
    var i = l.indexOf(':');
    if (i < 0) return true;
    var k = l.slice(0, i), v = l.slice(i + 1);
    return k === 'phan' ? the.getAttribute('data-phan') === v : the.getAttribute('data-muc') === v;
  }

  function locTheo(l, ten) {
    // Bấm lại đúng ô đang chọn thì bỏ lọc — không phải đi tìm nút Bỏ lọc.
    if (l === locHienTai || l === 'tat') { l = ''; ten = ''; }
    locHienTai = l;
    for (var i = 0; i < tatCa.length; i++) tatCa[i].classList.toggle('an', !!l && !khop(tatCa[i], l));
    var nut = document.querySelectorAll('[data-loc]');
    for (var j = 0; j < nut.length; j++) {
      var cua = nut[j].getAttribute('data-loc');
      var dang = !!l && cua === l;
      nut[j].classList.toggle('chon', dang);
      nut[j].setAttribute('aria-pressed', dang ? 'true' : 'false');
    }
    if (theLoc) theLoc.hidden = !l;
    if (tenLoc) tenLoc.textContent = ten || '';
    if (nutBo) nutBo.hidden = !l;
    demLai();
    if (l && dsCau) dsCau.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;

    var oLoc = e.target.closest('[data-loc]');
    if (oLoc) {
      var nhan = oLoc.querySelector('.stat-label') || oLoc.querySelector('strong');
      locTheo(oLoc.getAttribute('data-loc'), nhan ? nhan.textContent.replace(/:$/, '') : '');
      return;
    }

    var the = e.target.closest('.q-card');
    if (!the) return;
    // Bấm bên trong ô lời giải thì KHÔNG đóng: thầy hay bôi đen chép công thức.
    if (e.target.closest('.sol-wrap')) return;
    // Bôi đen chữ rồi nhả chuột cũng tính là click. Đang có vùng chọn thì bỏ qua.
    var chon = window.getSelection && window.getSelection();
    if (chon && String(chon).length > 2) return;
    var dangMo = the.classList.contains('mo');
    bat(the, !dangMo);
    demLai();
    if (!dangMo) {
      var d = the.getBoundingClientRect();
      if (d.top < 0) the.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  });

  if (nutBo) nutBo.addEventListener('click', function () { locTheo('', ''); });

  if (nutHet) {
    nutHet.addEventListener('click', function () {
      var t = demLai();
      for (var i = 0; i < t.ds.length; i++) bat(t.ds[i], !t.het);
      demLai();
    });
  }

  var nutMoHetCau = document.getElementById('nut-mo-het-cau');
  if (nutMoHetCau) {
    nutMoHetCau.addEventListener('click', function () {
      var dimmed = document.querySelectorAll('.q-card.q-card-dimmed');
      for (var i = 0; i < dimmed.length; i++) {
        dimmed[i].classList.remove('q-card-dimmed');
        dimmed[i].classList.add('q-card-active');
      }
      var banners = document.querySelectorAll('.dimmed-pacing-banner');
      for (var j = 0; j < banners.length; j++) banners[j].remove();
      var tpt = document.getElementById('thanh-phan-tang-btvn');
      if (tpt) tpt.innerHTML = '<div class="tpt-trai"><span class="tpt-sao">✨</span><span>Đã mở toàn bộ ' + tatCa.length + ' câu của bài tập. Em có thể làm tiếp để nhận thêm EXP Thần Thú!</span></div>';
    });
  }
  /** HIỆN ĐỀ — giấu đáp án và lời giải ngay trên màn hình.
   *
   * Một lớp "chi-de" dùng cho CẢ màn hình lẫn bản in, nên đang xem kiểu nào
   * thì lưu ra PDF đúng kiểu đó. Trước đây chỉ có bản in giấu được, còn trên
   * màn hình em mở phiếu ra là thấy sẵn đáp án. */
  /** GO LOP DAP AN RA KHOI DOM KHI DANG GIAU.
   *
   * Thay bat 15/09: "trong de khac phuc loi sai khi bam nut chi hien de thi
   * dap an van bi lo vi khac mau". Dung: ban cu giau bang cach TO LAI o dap an
   * cho "trung hoa", ma bo mau to lai khong trung khop bo mau cua o thuong -
   * nen #f8fafc so voi #ffffff, chu var(--muc-2) so voi var(--muc), chu cai
   * nen var(--vien-dam) so voi #f1f5f9. Nhin la thay ngay o nao la dap an.
   *
   * Khong to lai nua. The mang DAU data-dung / data-sai; lop "dung"/"sai" chi
   * duoc gan khi duoc phep hien. Dang giau thi lop khong ton tai, nen khong
   * luat CSS nao - hom nay hay mai sau - ve khac duoc o do.
   * (Cam dau huyen nguoc trong khoi nay: ca khoi nam trong mot chuoi mau.)
   *
   * Goi ham nay o MOI cho doi trang thai giau/hien: bat tat "Hien de", nop bai
   * xong, va truoc khi in. */
  function dongBoLoDapAn() {
    var an = document.body.classList.contains('chi-de') || document.body.classList.contains('chua-nop');
    var ds = document.querySelectorAll('[data-dung],[data-sai]');
    for (var i = 0; i < ds.length; i++) {
      var e = ds[i];
      if (e.getAttribute('data-dung') === '1') e.classList.toggle('dung', !an);
      if (e.getAttribute('data-sai') === '1') e.classList.toggle('sai', !an);
    }
  }
  window.addEventListener('beforeprint', dongBoLoDapAn);

  function datChiDe(bat_) {
    document.body.classList.toggle('chi-de', !!bat_);
    dongBoLoDapAn();
    if (nutChiDe) nutChiDe.setAttribute('aria-pressed', bat_ ? 'true' : 'false');
    if (nutChiDe) nutChiDe.classList.toggle('dang-mo-het', !!bat_);
    // ĐÓNG HẾT thẻ đang mở: thẻ đang mở mang lớp "mo", mà luật của lớp đó
    // ngang cơ với luật "chi-de" — không đóng thì câu đó vẫn hở lời giải.
    if (bat_) for (var i = 0; i < tatCa.length; i++) if (tatCa[i].classList.contains('mo')) bat(tatCa[i], false);
    demLai();
  }

  /** LƯU PDF. In TRỌN phiếu, không in mỗi phần đang lọc: bản giấy phải đủ bài.
   *
   * coGiai = false thì in bản đề trần, phát cho em tự làm; true thì in bản đầy
   * đủ để dò bài. Hai lựa chọn ra hai tệp khác hẳn nhau nên PHẢI hỏi, không
   * đoán hộ theo trạng thái màn hình.
   *
   * Trình duyệt không cho trang web tự ghi thẳng một tệp PDF; đường duy nhất
   * là hộp in của máy rồi chọn "Lưu thành PDF". */
  function luuPdf(coGiai) {
    dongChonPdf();
    var giu = locHienTai;
    var giuTen = tenLoc ? tenLoc.textContent : '';
    var chiDeCu = document.body.classList.contains('chi-de');
    var daMo = [];
    if (giu) locTheo('', '');
    if (!coGiai) {
      document.body.classList.add('chi-de');
      for (var i = 0; i < tatCa.length; i++) {
        if (tatCa[i].classList.contains('mo')) { daMo.push(tatCa[i]); bat(tatCa[i], false); }
      }
    } else {
      document.body.classList.remove('chi-de');
    }
    // Ban in cung phai theo dung trang thai giau/hien nhu tren man hinh.
    dongBoLoDapAn();
    window.print();
    // Trả màn hình về đúng như trước khi bấm. Chrome trả quyền ngay sau
    // print(), Safari chậm hơn — chờ một nhịp cho chắc.
    setTimeout(function () {
      datChiDe(chiDeCu);
      for (var j = 0; j < daMo.length; j++) bat(daMo[j], true);
      if (giu) locTheo(giu, giuTen);
      demLai();
    }, 800);
  }

  function dongChonPdf() {
    if (!hopPdf) return;
    hopPdf.hidden = true;
    if (nutPdf) nutPdf.setAttribute('aria-expanded', 'false');
  }

  if (nutPdf) nutPdf.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!hopPdf) return;
    var mo = hopPdf.hidden;
    hopPdf.hidden = !mo;
    nutPdf.setAttribute('aria-expanded', mo ? 'true' : 'false');
  });
  if (nutPdfDe) nutPdfDe.addEventListener('click', function () { luuPdf(false); });
  if (nutPdfGiai) nutPdfGiai.addEventListener('click', function () { luuPdf(true); });
  // Bấm ra ngoài hay bấm Esc thì đóng hộp chọn — không để nó treo giữa màn.
  document.addEventListener('click', function (e) {
    if (hopPdf && !hopPdf.hidden && !hopPdf.contains(e.target) && e.target !== nutPdf) dongChonPdf();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dongChonPdf(); });
  if (nutChiDe) nutChiDe.addEventListener('click', function () {
    datChiDe(!document.body.classList.contains('chi-de'));
  });
  // Phiếu CHỈ CÓ ĐỀ: bật sẵn chế độ chỉ đề, khỏi phải bấm.
  if (!nutChiDe && !document.getElementById('mo-het')) document.body.classList.add('chi-de');
  // Gan lop dap an theo dung trang thai luc mo trang. Ban dung HTML KHONG gan
  // san lop nao, nen thieu loi goi nay la phieu da nop cung khong hien dap an.
  dongBoLoDapAn();

  demLai();

  // ==================== LÀM BÀI VÀ NỘP (NOP-PHIEU-KHAC-PHUC) ====================
  //
  // Chỉ chạy khi phiếu có khối dữ liệu nộp. Phiếu chỉ đọc không đụng gì tới
  // đoạn này, và phiếu đã gửi đi từ trước cũng vậy.
  var oNop = document.getElementById('du-nop');
  if (oNop) {
    var du = null;
    try { du = JSON.parse(oNop.textContent || 'null'); } catch (e3) { du = null; }
    if (du && du.cau && du.cau.length) {
      /* KHOÁ LƯU BÀI PHẢI GẮN VỚI BỘ CÂU, KHÔNG CHỈ GẮN VỚI MÃ PHIẾU.
       *
       * Thầy báo 09/09 khuya: "bấm tạo câu lần 2 thì hiện sẵn đáp án vào ô đáp
       * án, phần đúng sai đáp án hiện chữ đậm".
       *
       * Gốc: mã phiếu CỐ Ý dùng lại cho cùng một em trong cùng một ca (máy chủ
       * tìm thấy dòng cũ thì trả lại mã cũ, để link đã phát ra vẫn sống). Nhưng
       * bấm "tạo câu" lần nữa lại rút một BỘ CÂU KHÁC. Hai bộ khác nhau dùng
       * chung một khoá ddh.lam.<ma> nên bài làm lần 1 được đổ ngược vào phiếu
       * lần 2: ô trả lời ngắn hiện sẵn chữ, huy hiệu Đ/S hiện sẵn đậm.
       *
       * Đo được (jsdom): lần 1 làm q1=B, q2=S, q3=99 rồi nộp; lần 2 rút bộ khác
       * cùng mã thì oNhap vẫn ["99"], tfDaChon vẫn ["S"].
       *
       * Nay khoá mang thêm VÂN TAY của bộ câu. Cùng bộ mở lại thì vẫn khôi phục
       * đúng như trước; bộ khác thì tờ giấy trắng.
       */
      function vanTayBo(ids) {
        var t = '';
        for (var i = 0; i < du.cau.length; i++) t += (ids ? ids[i] : du.cau[i].id) + '|';
        var h = 5381;
        for (var j = 0; j < t.length; j++) { h = ((h * 33) ^ t.charCodeAt(j)) >>> 0; }
        return h.toString(36);
      }
      var KHOA_CU = 'ddh.lam.' + du.ma;
      var KHOA_LUU = KHOA_CU + '.' + vanTayBo();
      var nutNop = document.getElementById('nut-nop');
      var demLam = document.getElementById('nop-dem');
      var oKet = document.getElementById('nop-ket');
      var oLoiNop = document.getElementById('nop-loi');
      var daNop = false;
      var lam = {};
      if (du.banNhap && typeof du.banNhap === 'object') {
        try { Object.assign(lam, du.banNhap); } catch (eBn) {}
      }
      try {
        var tuLocal = JSON.parse(localStorage.getItem(KHOA_LUU) || '{}') || {};
        if (tuLocal && typeof tuLocal === 'object') {
          Object.assign(lam, tuLocal);
        }
      } catch (e4) {}
      // Chuyển bản nháp BTVN mã ghép cũ; không xóa bản gốc.
      try {
        if (!Object.keys(lam).length && du.legacyIds && du.legacyIds.length === du.cau.length && new Set(du.legacyIds).size === du.legacyIds.length) {
          var oldKey=KHOA_CU+'.'+vanTayBo(du.legacyIds);
          var oldDraft=JSON.parse(localStorage.getItem(oldKey)||'{}');
          for(var li=0;li<du.cau.length;li++)if(Object.prototype.hasOwnProperty.call(oldDraft,du.legacyIds[li]))lam[du.cau[li].id]=oldDraft[du.legacyIds[li]];
          if(Object.keys(lam).length)localStorage.setItem(KHOA_LUU,JSON.stringify(lam));
          if(localStorage.getItem(oldKey+'.cho')==='1')localStorage.setItem(KHOA_LUU+'.cho','1');
        }
      }catch(legacyError){}
      /* CHUYỂN BÀI CŨ SANG KHOÁ MỚI, chỉ khi CHẮC CHẮN là cùng bộ câu.
       * Em đang làm dở bằng bản app cũ thì mở bản mới không được mất bài. Điều
       * kiện chặt: mọi qid đã lưu đều nằm trong bộ đang mở. Lệch một câu là bỏ
       * qua, thà tờ giấy trắng còn hơn đổ nhầm bài của bộ khác. */
      try {
        if (!Object.keys(lam).length) {
          var cu = JSON.parse(localStorage.getItem(KHOA_CU) || '{}') || {};
          var kCu = Object.keys(cu);
          if (kCu.length) {
            var coDu = {};
            for (var ic = 0; ic < du.cau.length; ic++) coDu[du.cau[ic].id] = 1;
            var hop = true;
            for (var jc = 0; jc < kCu.length; jc++) if (!coDu[kCu[jc]]) { hop = false; break; }
            if (hop) {
              lam = cu;
              localStorage.setItem(KHOA_LUU, JSON.stringify(lam));
              if (localStorage.getItem(KHOA_CU + '.cho') === '1') localStorage.setItem(KHOA_LUU + '.cho', '1');
            }
          }
          localStorage.removeItem(KHOA_CU);
          localStorage.removeItem(KHOA_CU + '.cho');
        }
      } catch (e4b) {}

      // XONG VÒNG 1 (KIEM-TRA-VONG-2.md): mọi câu trong 'du.soCauV1' câu ĐẦU
      // đã có đáp án — đúng lúc thanh phân tầng phía trên đổi từ "còn khoá"
      // sang "hiện hết". Chỉ báo MỘT LẦN mỗi lần mở phiếu (biến daBaoXongVong1);
      // báo lại giữa hai lần mở là bình thường, máy chủ tự lọc trùng.
      var daBaoXongVong1 = false;
      function baoXongVong1() {
        if (daBaoXongVong1 || !du.soCauV1) return;
        for (var iV1 = 0; iV1 < du.soCauV1; iV1++) {
          if (!String(lam[du.cau[iV1].id] || '').trim()) return;
        }
        daBaoXongVong1 = true;
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ddh-btvn-xong-vong', ma: du.ma, sbd: du.sbd, vong: 1 }, '*');
          }
        } catch (ePostV) {}
      }

      function luuLam() {
        try { localStorage.setItem(KHOA_LUU, JSON.stringify(lam)); } catch (e5) {}
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ddh-btvn-draft', ma: du.ma, sbd: du.sbd, lam: lam }, '*');
          }
        } catch (ePost) {}
        baoXongVong1();
      }
      function soDaLam() {
        var n = 0;
        for (var i = 0; i < du.cau.length; i++) if (String(lam[du.cau[i].id] || '').trim()) n++;
        return n;
      }
      // Ô CHỌN NẰM NGAY TRÊN PHƯƠNG ÁN, nên mọi thứ tra từ thẻ câu.
      function theLam() { return document.querySelectorAll('.q-card[data-qid]'); }
      function veLam() {
        var vung = theLam();
        for (var i = 0; i < vung.length; i++) {
          var v = vung[i];
          var qid = v.getAttribute('data-qid');
          var giaTri = String(lam[qid] || '');
          var phan = v.getAttribute('data-phan');
          if (phan === 'III') {
            var o = v.querySelector('.lam-nhap');
            if (o && o.value !== giaTri) o.value = giaTri;
          } else if (phan === 'II') {
            var hangY = v.querySelectorAll('.tf-item[data-y]');
            for (var j = 0; j < hangY.length; j++) {
              var nutY = hangY[j].querySelectorAll('.lam-o');
              for (var k = 0; k < nutY.length; k++) {
                nutY[k].setAttribute('aria-checked', giaTri.charAt(j) === nutY[k].getAttribute('data-chon') ? 'true' : 'false');
              }
            }
          } else {
            var nutPa = v.querySelectorAll('.lam-o');
            for (var m = 0; m < nutPa.length; m++) {
              nutPa[m].setAttribute('aria-checked', giaTri === nutPa[m].getAttribute('data-chon') ? 'true' : 'false');
            }
          }
        }
        if (demLam) demLam.textContent = String(soDaLam());
      }

      function chonO(o) {
        var v = o.closest('.q-card[data-qid]');
        if (!v) return;
        var qid = v.getAttribute('data-qid');
        var phan = v.getAttribute('data-phan');
        if (phan === 'II') {
          var hangY = Array.prototype.slice.call(v.querySelectorAll('.tf-item[data-y]'));
          var cu = String(lam[qid] || '----');
          while (cu.length < hangY.length) cu += '-';
          var iY = hangY.indexOf(o.closest('.tf-item[data-y]'));
          if (iY < 0) return;
          lam[qid] = cu.substring(0, iY) + o.getAttribute('data-chon') + cu.substring(iY + 1);
        } else {
          // Bấm lại đúng ô đang chọn thì BỎ chọn — em đổi ý không phải tìm nút xoá.
          lam[qid] = lam[qid] === o.getAttribute('data-chon') ? '' : o.getAttribute('data-chon');
        }
        luuLam();
        veLam();
      }

      // NHẬN CÚ CHẠM Ở POINTERUP, KHÔNG ĐỢI CLICK (thầy bắt được 08/09: "nút Đ
      // bấm mãi không được").
      //
      // Ngón tay đặt xuống rồi nhích một hai pixel là trình duyệt di động coi
      // đó là cuộn trang và HUỶ luôn sự kiện click — em bấm thật mà máy không
      // nhận. Chạm sạch tuyệt đối gần như không có trên điện thoại.
      //
      // Nay: nhớ chỗ ngón tay đặt xuống, tới lúc nhấc lên còn trong cùng một ô
      // và xê dịch dưới 14px thì tính là bấm. Cuộn thật (kéo xa hơn) vẫn là
      // cuộn. Chuột và bàn phím đi đường click như cũ, có khoá chống ăn hai lần.
      // HAI LỚP, MỖI LỚP MỘT VIỆC — thầy báo BỐN lần "nút bấm được nút không".
      //
      // Lớp 1: ô chọn là thẻ <button> THẬT, không phải div gắn sự kiện. Trình
      // duyệt xử lý cú chạm cho nút gốc theo luật riêng của nó, tự nhận Enter
      // và Space, và đọc màn hình gọi đúng tên. Đây là nền, không phải bản vá.
      //
      // Lớp 2: LƯỚI AN TOÀN nghe touchend. Đo bằng Chromium có cảm ứng, ghi
      // nhật ký từng sự kiện: ngón tay xê chừng 18px thì trình duyệt coi là kéo
      // trang và HUỶ luôn click — kể cả trên thẻ button. Lúc đó chỉ còn touchend
      // được bắn, nên lưới này là đường duy nhất còn bắt được cú bấm ấy.
      // Luật của lưới: nhấc tay CÒN Ở TRONG Ô đã đặt tay xuống thì là bấm;
      // trang trượt quá 8px giữa lúc đặt và nhấc thì đó là cuộn, bỏ qua.
      // Hỏi elementFromPoint theo toạ độ, KHÔNG hỏi e.target — chạm di động bị
      // "pointer capture" ngầm nên e.target luôn là ô lúc đặt tay xuống.
      //
      // CHỐNG ĂN HAI LẦN TẠI NGUỒN: lưới xử lý xong thì chặn luôn cú click giả
      // mà trình duyệt phát sau touchend. Không dùng khoá theo thời gian nữa —
      // khoá kiểu đó nuốt mất cú bấm lại cùng một ô để BỎ CHỌN, phép kiểm bấm
      // thật trong DOM bắt được ngay.
      // (Cấm dấu huyền ngược trong khối này: cả khối nằm trong một chuỗi mẫu.)
      function cuonY() {
        return window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop || 0;
      }
      function oTaiCham(t) {
        if (!t) return null;
        var el = document.elementFromPoint(t.clientX, t.clientY);
        return el && el.closest ? el.closest('.lam-o') : null;
      }
      var chamDau = null;
      // Tem thời gian cú chạm ĐÃ được lưới xử lý. Cú click giả kế tiếp bị nuốt
      // ĐÚNG MỘT LẦN rồi tem tự xoá. Không phải khoá theo thời gian: cú chạm
      // thứ hai vào cùng ô vẫn đi đường touchend nên BỎ CHỌN vẫn chạy.
      // Cần lớp này vì preventDefault chỉ chặn được click khi touchend còn huỷ
      // được; máy đang cuộn thì trình duyệt phát touchend KHÔNG huỷ được, lúc
      // ấy click vẫn tới và ô bị chọn rồi bỏ chọn ngay — đúng triệu chứng thầy
      // báo "có cái nhận có cái không".
      var temCham = 0;
      document.addEventListener('touchstart', function (e) {
        if (daNop) { chamDau = null; return; }
        var o = oTaiCham(e.touches && e.touches[0]);
        chamDau = o ? { o: o, cuon: cuonY() } : null;
      }, { passive: true, capture: true });
      document.addEventListener('touchend', function (e) {
        var d = chamDau;
        chamDau = null;
        if (daNop || !d) return;
        if (Math.abs(cuonY() - d.cuon) > 8) return;
        var o = oTaiCham(e.changedTouches && e.changedTouches[0]);
        if (!o || o !== d.o) return;
        // Chặn cú click giả trình duyệt phát sau touchend. Nhờ đó một cú chạm
        // chỉ chọn ĐÚNG MỘT LẦN mà không cần khoá theo thời gian.
        if (e.cancelable) e.preventDefault();
        temCham = Date.now();
        chonO(o);
      }, { passive: false, capture: true });
      document.addEventListener('click', function (e) {
        if (daNop || !e.target || !e.target.closest) return;
        var o = e.target.closest('.lam-o');
        if (!o) return;
        if (temCham && Date.now() - temCham < 900) { temCham = 0; return; }
        temCham = 0;
        chonO(o);
      });

      // KHÔNG có khối bàn phím riêng: thẻ button tự nhận Enter và Space rồi
      // tự phát click. Tự bắt thêm là ăn hai lần.

      document.addEventListener('input', function (e) {
        if (daNop || !e.target || !e.target.classList || !e.target.classList.contains('lam-nhap')) return;
        var v = e.target.closest('.q-card[data-qid]');
        if (!v) return;
        lam[v.getAttribute('data-qid')] = e.target.value;
        luuLam();
        if (demLam) demLam.textContent = String(soDaLam());
      });

      /** CHẤM TẠI CHỖ để hiện ngay. Máy chủ vẫn chấm LẠI và con số ghi vào
       * Sheet là con số của máy chủ — máy em sửa được. */
      function chamTaiCho() {
        var chuanIII = function (v) {
          var s = String(v == null ? '' : v).replace(/[‐‑‒–—―−－]/g, '-').replace(/[s ]+/g, '').replace(',', '.').replace(/^[+]/, '');
          return s.replace(/(gam|lit|lít|mol|cm3|dm3|kcal|kj|cal|amu|giay|phut|kg|ml|g|l|m|%|j|h|s)$/i, '').trim();
        };
        var normII = function (v) {
          return String(v == null ? '' : v).toUpperCase().replace(/Đ/g, 'D').replace(/[^DS]/g, '');
        };
        var dung = 0;
        var sai = [];
        for (var i = 0; i < du.cau.length; i++) {
          var c = du.cau[i];
          var chon = String(lam[c.id] || '').trim();
          var dapAn = String(c.dapAn == null ? '' : c.dapAn).trim();
          var khop = false;
          if (!chon) khop = false;
          else if (c.phan === 'III') {
            var cChon = chuanIII(chon), cDap = chuanIII(dapAn);
            if (cChon === cDap) khop = true;
            else {
              var nC = Number(cChon), nD = Number(cDap);
              khop = !isNaN(nC) && !isNaN(nD) && Math.abs(nC - nD) < 1e-4;
            }
          } else if (c.phan === 'II') {
            var nChon = normII(chon), nDap = normII(dapAn);
            khop = nChon.length === 4 && nDap.length === 4 && nChon === nDap;
          } else {
            khop = chon.toUpperCase().replace(/Đ/g, 'D') === dapAn.toUpperCase().replace(/Đ/g, 'D');
          }
          if (khop) dung++; else sai.push(c.id);
        }
        return { dung: dung, sai: sai };
      }

      function toKetQua(kq) {
        var saiCua = {};
        for (var i = 0; i < kq.sai.length; i++) saiCua[kq.sai[i]] = true;
        var vung = theLam();
        for (var j = 0; j < vung.length; j++) {
          var the = vung[j];
          var qidT = the.getAttribute('data-qid');
          var laSai = !!saiCua[qidT];
          the.classList.remove('cau-sai','cau-dung');
          var ketCu=the.querySelectorAll('.lam-ket');
          for(var kc=0;kc<ketCu.length;kc++)ketCu[kc].remove();
          the.classList.add('da-cham');
          the.classList.add(laSai ? 'cau-sai' : 'cau-dung');
          var d = document.createElement('div');
          d.className = 'lam-ket';
          d.textContent = laSai ? (String(lam[qidT] || '').trim() ? 'Sai' : 'Bỏ trống, tính là sai') : 'Đúng';
          var than = the.querySelector('.q-than');
          (than || the).appendChild(d);
        }
      }

      /** GỬI LÊN MÁY CHỦ. Mất mạng thì GIỮ LẠI và tự gửi lần mở sau — nuốt bài
       * im lặng là em làm xong mà thầy không thấy gì. */
      function gui(choLai) {
        var than = JSON.stringify({ action: 'nopKhacPhuc', ma: du.ma, sbd: du.sbd, dapAn: lam });
        return fetch(du.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: than })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j || !j.ok) throw new Error((j && j.error) || 'Không nộp được bài');
            try { localStorage.removeItem(KHOA_LUU + '.cho'); } catch (e6) {}
            return j;
          })
          .catch(function (err) {
            if (choLai) { try { localStorage.setItem(KHOA_LUU + '.cho', '1'); } catch (e7) {} }
            throw err;
          });
      }

      if (nutNop) nutNop.addEventListener('click', function () {
        if (daNop) return;
        var thieu = du.cau.length - soDaLam();
        if (du.ch && du.ch.CAN_LAM_HET_MOI_NOP && thieu > 0) {
          if (oLoiNop) { oLoiNop.hidden = false; oLoiNop.textContent = 'Còn ' + thieu + ' câu chưa làm.'; }
          return;
        }
        // NÓI RÕ TRƯỚC KHI NỘP: bỏ trống tính là sai, không để em nộp nhầm.
        if (thieu > 0 && !window.confirm('Còn ' + thieu + ' câu chưa làm, mấy câu đó tính là sai. Nộp luôn?')) return;
        daNop = true;
        nutNop.disabled = true;
        nutNop.textContent = 'Đang nộp…';
        var kq = chamTaiCho();
        toKetQua(kq);
        // MỞ LỜI GIẢI MỌI CÂU NGAY (thầy chốt 08/09) — em vừa làm xong là lúc
        // muốn biết vì sao nhất. Không đợi kết quả mạng.
        if (!du.ch || du.ch.HIEN_GIAI_SAU_NOP !== false) {
          // NỘP XONG MỚI MỞ KHOÁ LỜI GIẢI (thầy chốt 08/09). Gỡ lớp trước,
          // rồi mới mở từng thẻ — mở trong lúc còn lớp chua-nop là mở vào
          // chỗ đang bị CSS giấu. (Cấm dấu huyền ngược trong khối này: cả
          // khối nằm trong một chuỗi mẫu.)
          document.body.classList.remove('chua-nop');
          dongBoLoDapAn();
          for (var i = 0; i < tatCa.length; i++) bat(tatCa[i], true);
          demLai();
        }
        if (oKet) { oKet.hidden = false; oKet.textContent = ' · Đúng ' + kq.dung + '/' + du.cau.length; }
        gui(true)
          .then(function (j) {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ddh-btvn-submitted', ma: du.ma, sbd: du.sbd }, '*');
              }
            } catch (eSub) {}
            if(Array.isArray(j.qidSai))toKetQua({sai:j.qidSai});
            nutNop.textContent = du.ch && du.ch.CHO_NOP_LAI === false ? 'Đã nộp' : 'Làm lại';
            nutNop.disabled = false;
            if (oKet) oKet.textContent = ' · Đúng ' + j.soDung + '/' + j.soCau + ' (lần ' + j.lanThu + ')';
          })
          .catch(function (err) {
            nutNop.textContent = 'Gửi lại';
            nutNop.disabled = false;
            daNop = false;
            if (oLoiNop) { oLoiNop.hidden = false; oLoiNop.textContent = 'Chưa gửi được lên máy Thầy (' + err.message + '). Bài của em vẫn được giữ, mở lại trang là gửi tiếp.'; }
          });
      });

      // Lần mở sau: còn bài chưa gửi được thì tự gửi, im lặng nếu vẫn hỏng.
      try {
        if (localStorage.getItem(KHOA_LUU + '.cho') === '1') gui(false).catch(function () {});
      } catch (e8) {}

      veLam();
    }
  }
})();
`;function U(e,t,n=``){let r=typeof document<`u`&&(document.documentElement.classList.contains(`dark`)||document.body.classList.contains(`dark`)||document.documentElement.getAttribute(`data-theme`)===`dark`),i=[n,r?`dark`:``].filter(Boolean).join(` `);return`<!DOCTYPE html>
<html lang="vi"${r?` class="dark"`:``}><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${x(t)}</title><style>${j}</style></head>
<body${i?` class="${i}"`:``}>${e}
<script>${H}<\/script></body></html>`}function W(e){return{...e,dapAn:``,chot:``,lyDo:null,buoc:null,ketQua:``,hinh:e.hinh?.filter(e=>e.viTri!==`sau_loi_giai`)}}function G(e,t,n={}){let r=!!n.anGiai,i=!!(n.laBtvn||e.nhanBia===`BÀI TẬP VỀ NHÀ`||e.tenChuyenDe===`Bài tập về nhà`),a=!r&&n.nop?n.nop:null,o=c(a?.cauHinh),s=r?t.map(W):t,l=typeof n.soCauSang==`number`?n.soCauSang:i&&!n.moSan&&a?Math.max(4,Math.round(s.length*.45)):void 0,u=s.map((e,t)=>N(e,t+1,!!n.moSan,r,!!a,i,l)).join(`
`),d=!!a&&!o.HIEN_GIAI_TRUOC_NOP,f=r?0:s.filter(e=>F(e)!==``).length,p=r?`Em làm vào vở rồi đối chiếu với link lời giải bố mẹ gửi sau. Muốn bản giấy thì bấm "In đề" rồi chọn "Lưu thành PDF".`:`Bấm vào từng câu để xem lời giải. Muốn bản giấy thì bấm "In đề" (phát cho em tự làm) hoặc "In kèm lời giải", rồi chọn "Lưu thành PDF".`,m=(n.loiNhac??``).trim(),h=i&&typeof l==`number`&&l<s.length?`<div class="thanh-phan-tang-btvn" id="thanh-phan-tang-btvn">
        <div class="tpt-trai">
          <span class="tpt-sao">✨</span>
          <span>Hôm nay em làm <b>${l}</b> câu sáng (Vòng 1 Lõi Căn Bản) · <b>${s.length-l}</b> câu kế tiếp ẩn mờ để tránh quá tải.</span>
        </div>
        <button type="button" class="tpt-nut-mo" id="nut-mo-het-cau">Hiện tất cả ${s.length} câu</button>
      </div>`:``,g=`${L(e,s.length)}
<div class="khung">
  ${m?`<div class="nhac-phieu">${x(m)}</div>`:``}
  ${B(s,n.thieuChua??[])}
  ${z(s,i)}
  ${V(f,r)}
  ${a?K(s.length):``}
  ${d?`<div class="giai-khoa" id="giai-khoa">Lời giải mở ra ngay sau khi em bấm Nộp bài.</div>`:``}
  ${h}
  ${r?``:`<div class="ds-tieu-de">LỜI GIẢI CHI TIẾT TỪNG CÂU THEO CHUẨN HOÁ HỌC:</div>`}
  <div class="ds-cau">${u}</div>
  <div class="chan">Thầy Đỗ Đại Học · ${x(e.tenChuyenDe)} · ${E(e.ngay)}<span class="chi-man"><br>${p}</span></div>
</div>`,_=e.oBia&&e.oBia.length>0?e.oBia[0].gia:e.hoTen,v=Math.max(4,Math.round(s.length*.45)),y=i&&a&&v<s.length?v:void 0,b=a?`<script type="application/json" id="du-nop">${JSON.stringify({ma:a.ma,legacyIds:a.legacyIds,sbd:a.sbd,url:a.url,ch:o,banNhap:a.banNhap,soCauV1:y,cau:s.map(e=>({id:e.id,phan:e.phan,dapAn:e.dapAn}))}).replace(/</g,`\\u003c`)}<\/script>`:``,S=[a?`co-lam`:``,d?`chua-nop`:``].filter(Boolean).join(` `);return U(g+b,`${e.tenChuyenDe}${_?` · ${_}`:``}`,S)}function K(e){return`<div class="thanh" id="thanh-nop">
  <div class="nop-chu">Đã làm <b id="nop-dem">0</b>/<span id="nop-tong">${e}</span> câu<span id="nop-ket" class="nop-ket" hidden></span></div>
  <span id="nop-loi" class="nop-loi" hidden></span>
  <button class="nut nop" type="button" id="nut-nop">Nộp bài</button>
</div>`}export{S as a,O as c,F as d,U as f,z as g,x as h,L as i,m as l,N as m,D as n,P as o,V as p,k as r,G as s,j as t,E as u};