// DỰNG PHIẾU THÀNH MỘT TRANG WEB ĐỌC ĐƯỢC, BẤM VÀO CÂU LÀ HIỆN LỜI GIẢI.
//
// VÌ SAO ĐỔI KHỎI BẢN "GIẤY A4"
//
// Bản trước bắt chước tờ giấy: khổ 210×297mm, cắt trang, đầu trang chân trang,
// rồi một mục "Lời Giải Chi Tiết" in lại toàn bộ câu ở cuối tập. Ra được PDF
// thì đúng, nhưng thầy đã bỏ đường xuất PDF (04-09). Trên màn hình, khổ giấy
// cứng là hại: điện thoại phải thu nhỏ mới thấy hết bề ngang, chữ 10px không
// đọc nổi, và muốn xem lời giải câu 3 thì phải cuộn qua 20 câu xuống cuối.
//
// Nay phiếu là TRANG WEB thật:
//   · Bề ngang co theo máy — điện thoại một cột, máy tính hai cột phương án.
//   · Lời giải nằm NGAY TRONG thẻ câu, gập lại. Bấm vào câu là mở ra, bấm lần
//     nữa là đóng. Không còn mục lời giải riêng ở cuối.
//   · Đáp án đúng CHỈ được tô khi thẻ mở. Nên cùng một tệp vừa dùng để em tự
//     làm (không mở là không thấy đáp án), vừa dùng để dò bài.
//   · Muốn bản giấy thì bấm In rồi chọn "Lưu thành PDF": bản in tự mở hết lời
//     giải, chữ là chữ vector nên nét hơn hẳn bản chụp ảnh cũ.
//
// File này chỉ sinh CHUỖI, không đụng DOM, nên test được bằng chuỗi.
//
// GIẢ ĐỊNH ĐÃ DÙNG: `hienDapAn` nay chỉ đổi nhãn ngoài bìa. Lời giải luôn được
// nhúng và luôn gập sẵn — kể cả phiếu bài tập gửi phụ huynh — vì đây là phiếu
// ÔN, em tự bấm ra dò sau khi làm xong.
import type { CauLuyen } from './bai-tap-pdf'
import { doanCongThuc } from './chu-hoa-hoc-pdf'
import { goKyTuLa } from './chu-la-pdf'

/** Một ô thông tin ngoài bìa: nhãn nhỏ ở trên, giá trị đậm ở dưới. */
export interface OBia {
  nhan: string
  gia: string
}

export interface ThongTinPhieu {
  hoTen: string
  sbd: string
  ngay: Date
  /** Tên chuyên đề lớn in ở bìa, vd "ESTER & LIPID". */
  tenChuyenDe: string
  /** Dòng kết quả góc trên bìa. Rỗng thì không in ô đó. */
  ketQua: string
  /** true = bản dò bài của thầy (đổi nhãn bìa). Không còn quyết định việc tô
   * đáp án nữa: đáp án nay do người đọc bấm mở. */
  hienDapAn: boolean
  /** Nhãn nhỏ trên đầu bìa. Rỗng thì suy từ `hienDapAn`. */
  nhanBia?: string
  /** THAY hai ô "Học sinh" và "SBD" mặc định.
   *
   * LỖI ĐÃ DÍNH 04-09: bìa gõ cứng nhãn "HỌC SINH" và "SBD", nên đề của một
   * CA in ra thành "Học sinh: Test 3" (đó là tên ca) và "SBD: 547341" (đó là
   * mã ca). Bìa không được đoán mình đang in phiếu của ai — chỗ gọi biết rõ
   * thì chỗ gọi phải nói ra.
   *
   * Ô Ngày và ô kết quả vẫn do bìa tự thêm, khỏi chỗ nào cũng phải lặp. */
  oBia?: OBia[]
}

const CHU_PA = ['A', 'B', 'C', 'D']
const CHU_Y = ['a', 'b', 'c', 'd']
const TEN_MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
const LOP_MUC: Record<string, string> = { biet: 'level-1', hieu: 'level-2', van_dung: 'level-3' }
const TEN_LOAI: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }
const LOP_LOAI: Record<string, string> = { I: 'type-mc', II: 'type-tf', III: 'type-sa' }

export function thoat(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Chuỗi có công thức Hoá → HTML có <sub>/<sup>, mũi tên là ký tự thật.
 * Dùng lại đúng bộ tách của màn làm bài nên hai đường ra không bao giờ lệch.
 *
 * GỠ KÝ TỰ LẠ NGAY TẠI ĐÂY, không chỉ lúc nạp đề. Ca mở TRƯỚC khi có bộ gỡ vẫn
 * đang giữ bản chưa lọc trong máy và trên máy chủ, nên phiếu của những ca đó
 * in ra ô vuông rỗng (thầy bắt được ở câu Kc, đề 12-C1-B1). Lọc ở tầng hiển
 * thị thì mọi ca cũ và mọi link đã gửi đi tự đúng, không phải nạp lại đề. */
export function chuHtml(s: string): string {
  return doanCongThuc(goKyTuLa(s))
    .map((d) => {
      const v = thoat(d.v)
      if (d.t === 'sub') return `<sub>${v}</sub>`
      if (d.t === 'sup') return `<sup>${v}</sup>`
      return v
    })
    .join('')
}

export function ngayVN(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Ảnh nhúng thẳng vào phiếu. `src` là data URL base64 lấy từ kho đề, không
 * gọi ra mạng nên phiếu mở được cả khi mất mạng. */
export function anhHtml(src: string, lop = '', alt = ''): string {
  if (!src) return ''
  return `<img class="q-hinh${lop ? ` ${lop}` : ''}" src="${thoat(src)}" alt="${thoat(alt)}" loading="lazy">`
}

/** Mọi ảnh ở một vị trí trong câu (sau đề, sau từng phương án, cuối câu). */
export function hinhTaiViTri(c: CauLuyen, viTri: string): string {
  return (c.hinh ?? [])
    .filter((h) => h.viTri === viTri)
    .map((h) => anhHtml(h.src, '', h.alt ?? ''))
    .join('')
}

export function bangHtml(bang: string[][] | null | undefined): string {
  if (!bang || bang.length === 0) return ''
  const [dau, ...than] = bang
  const th = dau.map((x) => `<th>${chuHtml(x)}</th>`).join('')
  const tr = than.map((h) => `<tr>${h.map((x) => `<td>${chuHtml(x)}</td>`).join('')}</tr>`).join('')
  return `<div class="q-bang-cuon"><table class="q-bang"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`
}

/** Đáp án Phần II "DSDD" → mảng true/false. */
function ysDung(dapAn: string): boolean[] {
  return CHU_Y.map((_, i) => (dapAn || '')[i] === 'D')
}

export const CSS_PHIEU = `
@page { size: A4; margin: 12mm 10mm 14mm; }

:root {
  color-scheme: light;
  --nav: #0f3057;
  --nav-2: #00587a;
  --luc: #008891;
  --luc-2: #00b4a6;
  --vang: #ffd700;
  --nen: #eef2f7;
  --the-nen: #ffffff;
  --muc: #0f172a;
  --muc-2: #334155;
  --nhat: #64748b;
  --rat-nhat: #94a3b8;
  --vien: #e4eaf1;
  --vien-dam: #cbd5e1;
  --dung: #10b981;
  --dung-nen: #d1fae5;
  --dung-muc: #065f46;
  --sai: #ef4444;
  --sai-nen: #fee2e2;
  --sai-muc: #991b1b;
  --kem-nen: #fffbeb;
  --kem-vien: #fde68a;
  --kem-muc: #78350f;
  --kem-nhan: #92400e;
  --bo: 16px;
  --bo-nho: 10px;
  --bong: 0 1px 2px rgba(15,48,87,.05), 0 10px 28px rgba(15,48,87,.07);
  --bong-cao: 0 2px 6px rgba(15,48,87,.08), 0 18px 40px rgba(15,48,87,.12);
  --muot: .32s cubic-bezier(.4, 0, .2, 1);
}

* { margin: 0; padding: 0; box-sizing: border-box; }
/* Phải !important: .nut đặt display:inline-flex bằng class nên THẮNG luật
   [hidden]{display:none} mặc định của trình duyệt, làm nút Bỏ lọc hiện ra
   ngay cả khi chưa lọc gì. */
[hidden] { display: none !important; }

html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif;
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

.khung { max-width: 900px; margin: 0 auto; padding: 0 16px 72px; }

/* ================= BÌA ================= */
.cover {
  position: relative;
  overflow: hidden;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 56px 20px 84px;
  color: #ffffff;
  background: linear-gradient(135deg, #0f3057 0%, #00587a 40%, #008891 70%, #00b4a6 100%);
}
.cover-blob { position: absolute; border-radius: 50%; pointer-events: none; }
.cover-blob.b1 { top: -140px; right: -120px; width: 420px; height: 420px; background: rgba(255,255,255,.06); }
.cover-blob.b2 { bottom: -180px; left: -130px; width: 520px; height: 520px; background: rgba(255,255,255,.045); }
.cover-molecule { position: absolute; font-weight: 900; opacity: .07; pointer-events: none; white-space: nowrap; }
.cover-molecule.m1 { top: 12%; left: 6%; font-size: clamp(48px, 11vw, 120px); transform: rotate(-15deg); }
.cover-molecule.m2 { top: 62%; right: 4%; font-size: clamp(38px, 8vw, 90px); transform: rotate(20deg); }
.cover-molecule.m3 { bottom: 16%; left: 10%; font-size: clamp(30px, 6vw, 70px); transform: rotate(10deg); }
.cover-content { position: relative; z-index: 2; width: 100%; max-width: 700px; }
.cover-badge {
  display: inline-block; margin-bottom: 26px; padding: 8px 22px;
  background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.34); border-radius: 999px;
  font-size: 12px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
}
.cover-title { font-size: clamp(34px, 9vw, 60px); font-weight: 900; line-height: 1.08; letter-spacing: -.02em; text-shadow: 0 6px 34px rgba(0,0,0,.28); }
.cover-subtitle { margin-top: 14px; font-size: clamp(15px, 3.4vw, 21px); font-weight: 300; letter-spacing: .04em; opacity: .92; }
.cover-chemical { margin: 30px 0 34px; font-size: clamp(26px, 6.5vw, 42px); font-weight: 800; letter-spacing: .12em; color: var(--vang); }
/* LƯỚI chứ không phải flex-wrap: bốn ô (kể cả ô Kết quả) luôn CÙNG CHIỀU CAO
   và chia đều một hàng. Bản flex trước để ô Kết quả rơi xuống một mình, còn ô
   tên dài hai dòng thì cao vống hơn hai ô bên cạnh. */
.cover-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 12px; }
.cover-info-item {
  padding: 14px 16px; display: flex; flex-direction: column; justify-content: center;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.24); border-radius: var(--bo);
}
.cover-info-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .14em; opacity: .78; margin-bottom: 5px; }
.cover-info-value { font-size: clamp(15px, 3.6vw, 18px); font-weight: 700; overflow-wrap: anywhere; }
/* Neo cao hơn mép dưới vì thẻ Tổng quan trườn đè lên 28px cuối của bìa. */
.cover-footer { position: absolute; left: 0; right: 0; bottom: 54px; z-index: 2; font-size: 13px; opacity: .68; padding: 0 16px; }

/* ================= TỔNG QUAN ================= */
.summary-page {
  margin: -28px auto 26px; max-width: 900px; position: relative; z-index: 3;
  border-radius: 22px; padding: 26px 22px 28px; color: #ffffff;
  background: linear-gradient(135deg, #0f3057 0%, #00587a 55%, #008891 100%);
  box-shadow: var(--bong-cao);
}
.summary-title { text-align: center; font-size: clamp(20px, 5vw, 27px); font-weight: 800; letter-spacing: -.01em; margin-bottom: 20px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 20px; }
.stat-card {
  display: block; width: 100%; text-align: center; padding: 16px 10px; color: inherit; font: inherit;
  background: rgba(255,255,255,.11); border: 1px solid rgba(255,255,255,.2); border-radius: var(--bo);
  transition: background-color var(--muot), border-color var(--muot), transform var(--muot);
}
/* Ô bấm được thì phải TRÔNG như bấm được: con trỏ bàn tay, sáng lên khi rê
   chuột, và khi đang lọc thì nền trắng hẳn để biết đang xem phần nào. */
button.stat-card, button.topic-item { cursor: pointer; }
button.stat-card:hover { background: rgba(255,255,255,.2); border-color: rgba(255,255,255,.45); }
button.stat-card:active { transform: scale(.98); }
button.stat-card.chon { background: #ffffff; border-color: #ffffff; color: var(--nav); }
button.stat-card.chon .stat-label { opacity: 1; font-weight: 700; }
button.stat-card:focus-visible, button.topic-item:focus-visible { outline: 3px solid rgba(255,255,255,.7); outline-offset: 2px; }
.stat-loc { display: block; margin-top: 6px; font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; opacity: .6; }
button.stat-card.chon .stat-loc { opacity: .85; }
.stat-icon { font-size: 22px; margin-bottom: 4px; }
.stat-number { font-size: clamp(26px, 6vw, 34px); font-weight: 900; line-height: 1.1; }
.stat-label { font-size: 12px; opacity: .82; margin-top: 3px; }
.topics-list { background: rgba(255,255,255,.09); border-radius: var(--bo); padding: 16px 20px; }
.topics-list h3 { font-size: 14px; font-weight: 700; opacity: .9; margin-bottom: 8px; }
.topic-item {
  display: flex; align-items: flex-start; gap: 10px; width: 100%; text-align: left;
  padding: 8px 10px; margin: 0 -10px; border: none; border-bottom: 1px solid rgba(255,255,255,.12);
  border-radius: 8px; background: transparent; color: inherit; font: inherit;
  font-size: 13.5px; line-height: 1.5;
  transition: background-color var(--muot);
}
.topic-item:last-child { border-bottom: none; }
button.topic-item:hover { background: rgba(255,255,255,.14); }
button.topic-item.chon { background: rgba(255,255,255,.22); font-weight: 600; }
/* CHẤM TRÒN CÂN VỚI DÒNG CHỮ ĐẦU, KHÔNG PHẢI VỚI CẢ Ô.
   Căn giữa cả ô (align-items:center) thì dòng nào xuống hai dòng là chấm tụt
   xuống giữa hai dòng, nhìn như chấm của dòng khác. Nên ô chấm cao đúng MỘT
   dòng rồi tự căn giữa bên trong: chữ dài bao nhiêu chấm vẫn nằm ngang dòng
   đầu. Dùng em nên đổi cỡ chữ là chấm tự theo, không phải chỉnh tay. */
.topic-cham { flex-shrink: 0; display: flex; align-items: center; height: 1.5em; }
.topic-dot { width: 9px; height: 9px; border-radius: 50%; }

/* ================= THANH ĐIỀU KHIỂN ================= */
.thanh {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin: 0 auto 18px; padding: 10px 12px;
  background: rgba(255,255,255,.86);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  backdrop-filter: saturate(180%) blur(12px);
  border: 1px solid var(--vien); border-radius: var(--bo);
  box-shadow: 0 6px 20px rgba(15,48,87,.07);
}
.thanh-chu { flex: 1; min-width: 120px; font-size: 13px; font-weight: 600; color: var(--nhat); }
.thanh-chu b { color: var(--nav); font-weight: 800; }
.the-loc b { color: var(--luc); }
.nut.nho { min-height: 34px; padding: 0 12px; font-size: 12.5px; border-color: var(--luc); color: var(--luc); }
.nut.nho:hover { background: #e6f4f5; }
.nut {
  display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
  min-height: 40px; padding: 0 16px; border: 1px solid var(--vien-dam); border-radius: 999px;
  background: #ffffff; color: var(--nav); font: inherit; font-size: 13.5px; font-weight: 700;
  cursor: pointer; transition: background-color var(--muot), border-color var(--muot), transform var(--muot);
}
.nut:hover { background: #f1f5f9; border-color: var(--nav); }
.nut:active { transform: scale(.97); }
.nut.chinh { background: linear-gradient(135deg, var(--nav), var(--luc)); border-color: transparent; color: #ffffff; }
.nut.chinh:hover { filter: brightness(1.08); }
.nut:focus-visible { outline: 3px solid rgba(0,136,145,.4); outline-offset: 2px; }

/* MỘT NÚT, HAI NHÃN. Nhãn "đóng" ẩn sẵn, chỉ hiện khi nút đang ở trạng thái
   mở. Quy tắc này phải phủ CẢ nút trong thẻ câu lẫn nút trên thanh — bản trước
   chỉ viết cho thẻ câu nên nút trên thanh in ra cả hai nhãn liền nhau. */
.chu-dong { display: none; }
.q-card.mo .q-nut-giai .chu-mo, .nut.dang-mo-het .chu-mo { display: none; }
.q-card.mo .q-nut-giai .chu-dong, .nut.dang-mo-het .chu-dong { display: inline; }

/* ================= THẺ CÂU ================= */
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
  border-radius: var(--bo); box-shadow: var(--bong); overflow: hidden;
  transition: border-left-color var(--muot), box-shadow var(--muot), transform var(--muot);
  break-inside: avoid;
}
.q-card:hover { box-shadow: var(--bong-cao); }
.q-card.mo { border-left-color: var(--luc); }

.q-header { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px 0; }
.q-num {
  flex-shrink: 0; width: 34px; height: 34px; border-radius: 11px;
  background: linear-gradient(135deg, var(--nav), var(--luc)); color: #ffffff;
  display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800;
  box-shadow: 0 3px 10px rgba(0,88,122,.25);
}
.q-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.q-tag { font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 600; letter-spacing: .01em; white-space: nowrap; }
.q-tag.type-mc { background: #dbeafe; color: #1e40af; }
.q-tag.type-tf { background: #fef3c7; color: #92400e; }
.q-tag.type-sa { background: #e0e7ff; color: #4338ca; }
.q-tag.level-1 { background: #d1fae5; color: #065f46; }
.q-tag.level-2 { background: #fce7f3; color: #9d174d; }
.q-tag.level-3 { background: #fed7aa; color: #9a3412; }
.q-tag.topic { background: #f1f5f9; color: #475569; }

/* Vùng bấm: cả thân câu. Con trỏ hình bàn tay để thấy ngay là bấm được. */
.q-than { padding: 10px 16px 14px; cursor: pointer; }
.q-text { font-size: 15.5px; line-height: 1.62; color: var(--muc); font-weight: 500; overflow-wrap: break-word; }
.q-text + .q-options, .q-text + .tf-head, .q-text + .sa-vung, .q-hinh + .q-options { margin-top: 12px; }

/* HAI CỘT CỐ ĐỊNH trên màn rộng, đúng mẫu thầy chốt. Dùng auto-fit thì màn
   1200px xếp được ba cột, mà bốn phương án chia 3+1 nhìn lệch hẳn. */
.q-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.q-options.single-col { grid-template-columns: 1fr; }
.q-opt {
  display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 9px 12px;
  background: #f8fafc; border: 1px solid var(--vien); border-radius: var(--bo-nho);
  font-size: 14.5px; line-height: 1.5; color: var(--muc-2);
  transition: background-color var(--muot), border-color var(--muot), color var(--muot);
}
.q-opt-letter {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
  background: var(--vien-dam); color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12.5px; font-weight: 800; line-height: 1;
  transition: background-color var(--muot);
}
.q-opt-text { flex: 1; min-width: 0; overflow-wrap: break-word; }

/* ĐÁP ÁN CHỈ HIỆN KHI THẺ MỞ. Lớp dung luôn có trong HTML, nhưng chỉ được tô
   màu khi thẻ có thêm lớp mo. Nhờ vậy đúng một tệp dùng được cả lúc em tự làm
   lẫn lúc dò bài, không phải dựng hai bản. */
.q-card.mo .q-opt.dung { background: var(--dung-nen); border-color: var(--dung); color: var(--dung-muc); font-weight: 700; }
.q-card.mo .q-opt.dung .q-opt-letter { background: var(--dung); }

.tf-head { display: flex; justify-content: flex-end; gap: 10px; padding-right: 4px; margin-bottom: 4px; }
.tf-head span { width: 34px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--rat-nhat); }
.tf-item {
  display: flex; align-items: center; gap: 12px; padding: 7px 10px; border-radius: var(--bo-nho);
  transition: background-color var(--muot);
}
.tf-item + .tf-item { margin-top: 4px; }
.q-card.mo .tf-item { background: #f8fafc; }
.tf-statement { flex: 1; min-width: 0; font-size: 14.5px; line-height: 1.55; color: var(--muc-2); overflow-wrap: break-word; }
.tf-o { display: flex; gap: 10px; flex-shrink: 0; }
.tf-badge {
  width: 34px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800;
  background: #f1f5f9; color: var(--rat-nhat); border: 1px solid var(--vien);
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
.q-bang th { background: #f1f5f9; font-weight: 700; }

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
  margin: 0 16px 16px; padding: 14px 16px;
  background: var(--kem-nen); border: 1px solid var(--kem-vien); border-radius: var(--bo-nho);
  opacity: 0; transform: translateY(-6px);
  transition: opacity var(--muot), transform var(--muot);
}
.q-card.mo .sol-box { opacity: 1; transform: none; }
.sol-label {
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
  color: var(--kem-nhan); margin-bottom: 6px;
}
.sol-label + .sol-label, .sol-text + .sol-label, .sol-step + .sol-label, .sol-dap + .sol-label { margin-top: 12px; }
/* Đáp án gói gọn MỘT DÒNG. Để nguyên cỡ nhãn lớn như các mục khác thì câu trả
   lời ngắn in số đáp án hai lần sát nhau (ô lớn phía trên và trong ô kem),
   nhìn như lỗi. */
.sol-dap { font-size: 14.5px; color: var(--kem-nhan); font-weight: 600; margin-bottom: 10px; }
.sol-dap b { font-size: 16px; font-weight: 800; color: var(--kem-muc); letter-spacing: .04em; }
.sol-text { font-size: 14.5px; line-height: 1.65; color: var(--kem-muc); overflow-wrap: break-word; }
.sol-text strong { color: #5b2a06; }
.sol-step { font-size: 14.5px; line-height: 1.65; color: var(--kem-muc); padding-left: 18px; text-indent: -18px; }
.sol-ket { font-size: 15px; font-weight: 800; color: var(--kem-muc); }
/* Ảnh lời giải gốc chụp từ đề của tác giả. Nền trắng vì ảnh cắt ra là giấy
   trắng mực đen; đặt trên nền kem của ô lời giải sẽ thấy một vệt lệch màu. */
.sol-anh { margin-top: 6px; }
.sol-anh img { display: block; width: 100%; height: auto; border-radius: 10px; background: #fff; }
.sol-step + .sol-label, .sol-text + .sol-anh { margin-top: 10px; }

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

  /* IN ĐỀ TRẦN — phát cho em tự làm.
     Cùng một tệp ra được hai bản giấy: bản này giấu sạch đáp án và lời giải,
     bản mặc định ở trên in đủ. Khỏi phải dựng hai tệp rồi lo gửi nhầm. */
  body.in-de-tran .sol-wrap { display: none !important; }
  /* !important vì luật màn hình cho thẻ đang mở có ĐỘ ƯU TIÊN BẰNG
     luật này. Thẻ nào thầy đang mở đọc dở lúc bấm In đề thì câu đó in ra vẫn
     tô xanh đáp án — thầy bắt được đúng lỗi đó ở câu 1. */
  body.in-de-tran .q-opt.dung { background: #f8fafc !important; border-color: var(--vien) !important; color: var(--muc-2) !important; font-weight: 400 !important; }
  body.in-de-tran .q-opt.dung .q-opt-letter { background: var(--vien-dam) !important; }
  body.in-de-tran .tf-badge.dung { background: #f1f5f9 !important; color: var(--rat-nhat) !important; border-color: var(--vien) !important; }
  body.in-de-tran .q-card { border-left-color: var(--vien-dam) !important; }
  body.in-de-tran .sa-answer { display: none !important; }
  body.in-de-tran .sa-blank { display: block !important; }
}
`

/** Mũi tên chỉ xuống, vẽ bằng SVG nội tuyến — không gọi phông biểu tượng nào,
 * nên phiếu vẫn đúng hình khi mất mạng. */
const MUI_TEN = '<svg class="q-mui" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'

/** Một thẻ câu: đề bài + phương án + ô lời giải gập sẵn.
 *
 * `stt` là số thứ tự liên tục trên cả phiếu.
 * `moSan` = true thì thẻ hiện sẵn lời giải (chỉ dùng khi cần bản đọc thẳng). */
export function theCauHtml(c: CauLuyen, stt: number, moSan = false): string {
  const tags = [
    `<span class="q-tag ${LOP_LOAI[c.phan]}">${TEN_LOAI[c.phan]}</span>`,
    c.mucDo ? `<span class="q-tag ${LOP_MUC[c.mucDo]}">${TEN_MUC[c.mucDo]}</span>` : '',
    c.chuyenDe ? `<span class="q-tag topic">${thoat(c.chuyenDe)}</span>` : '',
  ].join('')

  let than = ''
  if (c.phan === 'I' && c.luaChon) {
    // Phương án bằng ẢNH thì ảnh THAY chữ, đúng như màn làm bài. Kho đề ghi
    // chữ "(xem hình)" ở những phương án đó — in ra chữ ấy là em nhìn tờ phiếu
    // không có gì để chọn.
    const dai = c.luaChon.some((x) => (x || '').length > 56)
    const o = c.luaChon
      .map((pa, i) => {
        const dung = CHU_PA[i] === (c.dapAn || '').trim().toUpperCase()
        const anh = c.anhLuaChon?.[i]
        const noi = anh ? anhHtml(anh, 'pa', `Phương án ${CHU_PA[i]}`) : chuHtml(pa)
        return `<div class="q-opt${dung ? ' dung' : ''}"><div class="q-opt-letter"><span class="ky">${CHU_PA[i]}</span></div><div class="q-opt-text">${noi}${hinhTaiViTri(c, `sau_pa_${CHU_PA[i]}`)}</div></div>`
      })
      .join('')
    than = `<div class="q-options${dai ? ' single-col' : ''}">${o}</div>`
  } else if (c.phan === 'II' && c.luaChon) {
    const dung = ysDung(c.dapAn)
    const hang = c.luaChon
      .map((y, i) => {
        const anh = c.anhLuaChon?.[i]
        const noi = anh ? anhHtml(anh, 'pa', `Ý ${CHU_Y[i]}`) : chuHtml(y)
        return `<div class="tf-item"><div class="tf-statement">${CHU_Y[i]}. ${noi}${hinhTaiViTri(c, `sau_y_${CHU_Y[i]}`)}</div><div class="tf-o"><div class="tf-badge d${dung[i] ? ' dung' : ''}"><span class="ky">Đ</span></div><div class="tf-badge s${dung[i] ? '' : ' dung'}"><span class="ky">S</span></div></div></div>`
      })
      .join('')
    than = `<div class="tf-head"><span>Đ</span><span>S</span></div>${hang}`
  } else {
    than = `<div class="sa-vung"><div class="sa-blank">Đáp án: ……………………………</div><div class="sa-answer"><span class="ky">${chuHtml(c.dapAn || '—')}</span></div></div>`
  }

  // Ảnh cắt cả thân câu LÀ đề bài — có nó thì không in `text` nữa, đúng như màn
  // làm bài của học sinh (lớp chữ trong PDF gốc hay vỡ công thức ÂM THẦM).
  const deBai = c.anhThanCau ? anhHtml(c.anhThanCau, 'than', 'Đề bài') : `<div class="q-text">${chuHtml(c.text)}</div>`
  const giai = oGiaiHtml(c)
  const nut = giai
    ? `<button class="q-nut-giai" type="button" aria-expanded="${moSan ? 'true' : 'false'}" aria-controls="giai-${stt}">${MUI_TEN}<span class="chu-mo">Xem lời giải</span><span class="chu-dong">Ẩn lời giải</span></button>
  <div class="sol-wrap" id="giai-${stt}"><div class="sol-inner">${giai}</div></div>`
    : ''

  return `<article class="q-card${moSan ? ' mo' : ''}${giai ? '' : ' khong-giai'}" data-so="${stt}" data-phan="${c.phan}" data-muc="${thoat(c.mucDo || '')}">
  <div class="q-header"><div class="q-num"><span class="ky">${stt}</span></div><div class="q-tags">${tags}</div></div>
  <div class="q-than">
    ${deBai}
    ${bangHtml(c.bang)}
    ${hinhTaiViTri(c, 'sau_de')}
    ${than}
    ${hinhTaiViTri(c, 'cuoi_cau')}
  </div>
  ${nut}
</article>`
}

/** Đáp án in ra chữ. Phần II đổi DSDD thành Đ Đ S S. */
export function dapAnChu(c: CauLuyen): string {
  if (c.phan === 'II' && /^[DS]{2,4}$/.test(c.dapAn)) return c.dapAn.split('').map((k) => (k === 'D' ? 'Đ' : 'S')).join(' ')
  return c.dapAn || '—'
}

/** TOÀN BỘ lời giải của một câu, gói trong ô kem: đáp án, vì sao từng phương
 * án, các bước, kết quả. Trước đây phần này bị xé đôi — câu chốt ở trang đề,
 * phần dài ở mục "Lời Giải Chi Tiết" cuối tập. Nay chỉ còn một chỗ.
 *
 * Không có gì để giải thì trả về chuỗi rỗng, và thẻ câu sẽ KHÔNG có nút mở. */
export function oGiaiHtml(c: CauLuyen): string {
  const khoi: string[] = [`<div class="sol-dap">Đáp án: <b>${chuHtml(dapAnChu(c))}</b></div>`]

  const dungKhoa = c.phan === 'II' ? CHU_Y.filter((_, i) => ysDung(c.dapAn)[i]) : [(c.dapAn || '').trim().toUpperCase()]
  let coGiai = false
  if (c.lyDo && c.lyDo.length > 0) {
    const dong = c.lyDo
      .map((l) => `<strong>${thoat(l.khoa)}.</strong> ${dungKhoa.includes(l.khoa) ? '✓ ' : ''}${chuHtml(l.ly)}`)
      .join('<br>')
    khoi.push(`<div class="sol-label">${c.phan === 'II' ? 'Vì sao từng ý' : 'Vì sao từng phương án'}</div><div class="sol-text">${dong}</div>`)
    coGiai = true
  }
  if (c.chot) {
    khoi.push(`<div class="sol-label">Hướng làm</div><div class="sol-text">${chuHtml(c.chot)}</div>`)
    coGiai = true
  }
  const buoc = c.buoc ?? []
  if (buoc.length > 0) {
    const ds = buoc.map((b, i) => `<div class="sol-step">${i + 1}. ${chuHtml(b)}</div>`).join('')
    khoi.push(`<div class="sol-label">Làm từng bước</div>${ds}`)
    coGiai = true
  }
  if (c.ketQua) {
    khoi.push(`<div class="sol-label">Kết quả</div><div class="sol-text sol-ket">${chuHtml(c.ketQua)}</div>`)
    coGiai = true
  }

  // ẢNH LỜI GIẢI GỐC — bản chụp nguyên trang giải của tác giả đề.
  //
  // Vị trí `sau_loi_giai` KHÔNG được vẽ cùng thân câu như `cuoi_cau`: ảnh này
  // có sẵn đáp số, in ra cạnh đề là phát cho em cả bài giải. Nó chỉ hiện sau
  // khi bấm "Xem lời giải".
  //
  // Có ảnh là ĐỦ để mở nút, kể cả khi chữ rút ra vỡ hết: 64 câu trong kho rơi
  // đúng cảnh đó (xem kho-de/cong-cu/va-loi-giai.py).
  const anhGiai = hinhTaiViTri(c, 'sau_loi_giai')
  if (anhGiai) {
    khoi.push(`<div class="sol-label">Lời giải của Thầy</div><div class="sol-anh">${anhGiai}</div>`)
    coGiai = true
  }

  // Chỉ có mỗi đáp án, không một dòng giải thích nào: vẫn cho mở, vì đáp án là
  // thứ em cần nhất khi dò bài. Nhưng câu không có CẢ đáp án thì bỏ hẳn nút.
  if (!coGiai && !c.dapAn) return ''
  return `<div class="sol-box">${khoi.join('')}</div>`
}

export function biaHtml(t: ThongTinPhieu, soCau: number): string {
  const oKetQua = t.ketQua
    ? `<div class="cover-info-item" style="flex:0 1 auto;background:rgba(239,68,68,.16);border-color:rgba(239,68,68,.34);">
    <div class="cover-info-label" style="color:#fecaca;">Kết quả</div>
    <div class="cover-info-value" style="color:#fecaca;">${thoat(t.ketQua)}</div></div>`
    : ''
  // Tên chuyên đề xuống DÒNG THỨ HAI ở dấu phân cách, đúng như mẫu ("ESTER" /
  // "& LIPID"). Một dòng dài là tràn khỏi bìa với tên như "Hydrocarbon không
  // no", và khối chữ cũng lệch hẳn so với mẫu.
  const ten = thoat(t.tenChuyenDe || 'Hoá học').toUpperCase()
  const tenHaiDong = ten.replace(/\s*([–—-])\s*/, '<br>$1 ').replace(/\s+&\s+/, '<br>& ')
  // Chỗ gọi khai rõ thì dùng đúng lời khai; không khai thì mới rơi về "Học
  // sinh / SBD" như cũ, để mọi link phiếu đã gửi đi vẫn hiện đúng như lúc gửi.
  const oNhanDang = (t.oBia && t.oBia.length > 0 ? t.oBia : [
    { nhan: 'Học sinh', gia: t.hoTen },
    { nhan: 'SBD', gia: t.sbd },
  ])
    .filter((o) => o.gia)
    .map((o) => `<div class="cover-info-item"><div class="cover-info-label">${thoat(o.nhan)}</div><div class="cover-info-value">${thoat(o.gia)}</div></div>`)
    .join('')

  return `<header class="cover">
  <div class="cover-blob b1"></div><div class="cover-blob b2"></div>
  <div class="cover-molecule m1">RCOOR'</div>
  <div class="cover-molecule m2">CH<sub>3</sub>COOH</div>
  <div class="cover-molecule m3">C<sub>9</sub>H<sub>8</sub>O<sub>4</sub></div>
  <div class="cover-content">
    <div class="cover-badge">${thoat(t.nhanBia || (t.hienDapAn ? 'Lời giải chi tiết' : 'Phiếu Bài Tập Riêng'))}</div>
    <h1 class="cover-title">${tenHaiDong}</h1>
    <div class="cover-subtitle">Bài tập Hóa học Hữu cơ</div>
    <div class="cover-chemical">RCOOR'</div>
    <div class="cover-info">
      ${oNhanDang}
      <div class="cover-info-item"><div class="cover-info-label">Ngày</div><div class="cover-info-value">${ngayVN(t.ngay)}</div></div>
      ${oKetQua}
    </div>
  </div>
  <div class="cover-footer">Thầy Đỗ Đại Học · ${thoat(t.tenChuyenDe)} · ${soCau} Câu</div>
</header>`
}

/** Một ô thống kê. Có câu thì là NÚT LỌC, bấm vào chỉ còn hiện các câu của
 * phần đó; phần không có câu nào thì để ô chết, bấm vào lọc ra trang trắng là
 * vô nghĩa. */
function oThongKe(icon: string, so: number, nhan: string, loc: string): string {
  const trong = `<div class="stat-icon">${icon}</div><div class="stat-number">${so}</div><div class="stat-label">${nhan}</div>`
  if (so === 0) return `<div class="stat-card">${trong}</div>`
  return `<button type="button" class="stat-card" data-loc="${loc}" aria-pressed="false">${trong}<span class="stat-loc">${loc === 'tat' ? 'Xem tất cả' : 'Xem riêng'}</span></button>`
}

export function tongQuanHtml(cau: CauLuyen[]): string {
  const dem = (p: string) => cau.filter((c) => c.phan === p).length
  const muc: [string, string, string][] = [
    ['biet', '#34d399', 'Nhận biết'],
    ['hieu', '#f472b6', 'Thông hiểu'],
    ['van_dung', '#fb923c', 'Vận dụng'],
  ]
  const dong = muc
    .map(([k, mau, ten]) => {
      const ds = cau.map((c, i) => ({ c, i })).filter((x) => x.c.mucDo === k)
      if (ds.length === 0) return ''
      const so = ds.map((x) => x.i + 1)
      // Chỉ ghi khoảng "Câu 1–5" khi các câu ĐỨNG LIỀN NHAU. Mức độ xen kẽ mà
      // vẫn ghi khoảng là nói sai: "Câu 1–9" trong khi mức đó chỉ có 5 câu.
      const lien = so[so.length - 1] - so[0] + 1 === so.length
      const nhan = so.length === 1 ? `Câu ${so[0]}` : lien ? `Câu ${so[0]}–${so[so.length - 1]}` : `Câu ${so.join(', ')}`
      const cd = [...new Set(ds.map((x) => x.c.chuyenDe).filter(Boolean))].join(', ')
      return `<button type="button" class="topic-item" data-loc="muc:${k}" aria-pressed="false"><span class="topic-cham"><span class="topic-dot" style="background:${mau};"></span></span><span><strong>${ten}:</strong> ${nhan} · ${ds.length} câu${cd ? ` — ${thoat(cd)}` : ''}</span></button>`
    })
    .join('')
  return `<section class="summary-page">
  <div class="summary-title">Tổng Quan Đề Bài</div>
  <div class="stats-grid">
    ${oThongKe('📝', cau.length, 'Tổng số câu', 'tat')}
    ${oThongKe('✅', dem('I'), 'Trắc nghiệm', 'phan:I')}
    ${oThongKe('⚖️', dem('II'), 'Đúng / Sai', 'phan:II')}
    ${oThongKe('✏️', dem('III'), 'Trả lời ngắn', 'phan:III')}
  </div>
  ${dong ? `<div class="topics-list"><h3>📌 Phân loại mức độ</h3>${dong}</div>` : ''}
</section>`
}

/** Thanh dính đầu màn: đếm số câu đã mở + mở/đóng tất cả + in.
 *
 * `soCau` là số câu CÓ LỜI GIẢI, không phải tổng số câu — câu chưa có đáp án
 * thì không mở được, đếm nó vào mẫu số là mãi mãi không bao giờ đủ. */
export function thanhHtml(soCau: number): string {
  return `<div class="thanh">
  <div class="thanh-chu">Đã xem lời giải <b id="dem-mo">0</b>/<span id="dem-tong">${soCau}</span> câu<span class="the-loc" id="the-loc" hidden> · <b id="ten-loc"></b></span></div>
  <button class="nut nho" type="button" id="bo-loc" hidden>Bỏ lọc</button>
  <button class="nut chinh" type="button" id="mo-het" aria-pressed="false"><span class="chu-mo">Mở tất cả</span><span class="chu-dong">Đóng tất cả</span></button>
  <button class="nut" type="button" id="in-de" title="In hoặc lưu PDF chỉ có đề bài, không lộ đáp án">In đề</button>
  <button class="nut" type="button" id="in-giai" title="In hoặc lưu PDF có đủ đáp án và lời giải">In kèm lời giải</button>
  <button class="nut" type="button" id="tai-tep" title="Tải tệp HTML này về máy để gửi Zalo">Tải tệp</button>
</div>`
}

/** Kịch bản gập mở. Uỷ quyền một chỗ nên thêm bao nhiêu câu cũng không phải
 * gắn thêm bộ nghe; và toàn bộ trang vẫn đọc được nếu trình duyệt tắt JS,
 * chỉ mất phần gập. */
export const JS_PHIEU = `
(function () {
  var tatCa = Array.prototype.slice.call(document.querySelectorAll('.q-card'));
  var dem = document.getElementById('dem-mo');
  var demTong = document.getElementById('dem-tong');
  var nutHet = document.getElementById('mo-het');
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
  /** In. coGiai = false thì giấu sạch đáp án và lời giải trên giấy.
   * In luôn in TRỌN phiếu, không in mỗi phần đang lọc: bản giấy phải đủ bài. */
  function inPhieu(coGiai) {
    // Phải nhớ tên lọc TRƯỚC khi xoá, vì locTheo xoá luôn ô chữ đang giữ tên.
    var giu = locHienTai;
    var giuTen = tenLoc ? tenLoc.textContent : '';
    if (giu) locTheo('', '');
    document.body.classList.toggle('in-de-tran', !coGiai);
    // ĐÓNG HẾT thẻ đang mở. Chỉ dựa vào CSS là chưa đủ chắc: thẻ đang mở mang
    // lớp mo, mà luật màn hình của lớp đó ngang cơ với luật bản in.
    var daMo = [];
    if (!coGiai) {
      for (var i = 0; i < tatCa.length; i++) {
        if (tatCa[i].classList.contains('mo')) { daMo.push(tatCa[i]); bat(tatCa[i], false); }
      }
    }
    window.print();
    // Trả màn hình về như cũ sau khi hộp in đóng. Chrome trả quyền ngay sau
    // print(), Safari chậm hơn — chờ một nhịp cho chắc.
    setTimeout(function () {
      document.body.classList.remove('in-de-tran');
      for (var j = 0; j < daMo.length; j++) bat(daMo[j], true);
      if (giu) locTheo(giu, giuTen);
      demLai();
    }, 800);
  }

  // TẢI CHÍNH TRANG NÀY về máy. Tự đọc mã nguồn của mình nên tệp tải về giống
  // hệt bản đang xem, kể cả ảnh nhúng — không cần app dựng lại lần nữa.
  var nutTai = document.getElementById('tai-tep');
  if (nutTai) nutTai.addEventListener('click', function () {
    var ten = (document.title || 'phieu').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'phieu';
    var goc = '<!DOCTYPE html>' + document.documentElement.outerHTML;
    var u = URL.createObjectURL(new Blob([goc], { type: 'text/html;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = u; a.download = ten + '.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 8000);
  });

  var nutInDe = document.getElementById('in-de');
  var nutInGiai = document.getElementById('in-giai');
  if (nutInDe) nutInDe.addEventListener('click', function () { inPhieu(false); });
  if (nutInGiai) nutInGiai.addEventListener('click', function () { inPhieu(true); });

  demLai();
})();
`

/** Tài liệu HTML hoàn chỉnh, tự chứa — mở bằng một chạm, không cần mạng. */
export function taiLieuHtml(than: string, tieuDe: string): string {
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${thoat(tieuDe)}</title><style>${CSS_PHIEU}</style></head>
<body>${than}
<script>${JS_PHIEU}</script></body></html>`
}

/** DỰNG TRỌN PHIẾU: bìa · tổng quan · thanh điều khiển · danh sách câu.
 *
 * Không còn mục "Lời Giải Chi Tiết" riêng: lời giải nằm trong từng thẻ câu,
 * bấm vào câu là mở. Hàm thuần chuỗi, không cần trình duyệt để đo trang. */
export function dungPhieu(t: ThongTinPhieu, cau: CauLuyen[]): string {
  const the = cau.map((c, i) => theCauHtml(c, i + 1)).join('\n')
  const coGiai = cau.filter((c) => oGiaiHtml(c) !== '').length
  const than = `${biaHtml(t, cau.length)}
<div class="khung">
  ${tongQuanHtml(cau)}
  ${thanhHtml(coGiai)}
  <div class="ds-cau">${the}</div>
  <div class="chan">Thầy Đỗ Đại Học · ${thoat(t.tenChuyenDe)} · ${ngayVN(t.ngay)}<span class="chi-man"><br>Bấm vào từng câu để xem lời giải. Muốn bản giấy thì bấm "In đề" (phát cho em tự làm) hoặc "In kèm lời giải", rồi chọn "Lưu thành PDF".</span></div>
</div>`
  const ai = t.oBia && t.oBia.length > 0 ? t.oBia[0].gia : t.hoTen
  return taiLieuHtml(than, `${t.tenChuyenDe}${ai ? ` · ${ai}` : ''}`)
}
