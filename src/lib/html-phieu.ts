import {experimentHtml,experimentOriginal} from './experiments/render'
import { tachDongTheoY } from './tach-dong-cau'
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
import { cauHinhNop, type CauHinhNopKhacPhuc } from './cau-hinh-nop-khac-phuc'
import { doanCongThuc, type DoanChu } from './chu-hoa-hoc-pdf'
import { goKyTuLa } from './chu-la-pdf'
import { chuanHoaLoiGiaiCau } from './chuan-hoa-loi-giai'
import { nhanChipHtml, ghiThuongHtml, heroCaNhanHtml, ghiChoHtml, chipThuSucHtml, ghiThuSucHtml, nhomThuSucHtml, nopThuSucHtml, CSS_PHIEU_CA_NHAN, type DauBaiCaNhanVao } from './html-phieu-ca-nhan'

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
  /** Phiếu này dành cho HỌC SINH / PHỤ HUYNH cầm trên màn hình (khắc phục, đề + lời giải của em, xem lại…): mặc áo
   * Material 3 (lớp gd-m3 trên <html>). Phiếu nộp được (`nop`) luôn mặc áo ấy, không cần cờ này. Phiếu của giáo
   * viên, bản in và tờ máy chiếu KHÔNG bao giờ đặt cờ này nên ra đúng từng byte như trước. */
  giaoDienHocSinh?: boolean
}

// Biểu tượng nét (SVG, kế thừa màu chữ) thay emoji: emoji hiện khác nhau theo máy và đọc thành tên lạ khi dùng đọc màn hình.
const ICO_SAO = '<svg class="ico-nho" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>'
const ICO_KHOA = '<svg class="ico-nho" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
const CHU_PA = ['A', 'B', 'C', 'D']
const CHU_Y = ['a', 'b', 'c', 'd']
const TEN_MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
const LOP_MUC: Record<string, string> = { biet: 'level-1', hieu: 'level-2', van_dung: 'level-3' }
const TEN_LOAI: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }
const LOP_LOAI: Record<string, string> = { I: 'type-mc', II: 'type-tf', III: 'type-sa' }

export function thoat(s: unknown): string {
  if (typeof s === 'object' && s !== null) {
    const obj = s as Record<string, unknown>
    if (typeof obj.ten === 'string') return thoat(obj.ten)
    if (typeof obj.name === 'string') return thoat(obj.name)
    if (typeof obj.ma === 'string') return thoat(obj.ma)
    if (typeof obj.text === 'string') return thoat(obj.text)
  }
  // Gộp dấu về một ký tự như `chuHtml` — tên em và tiêu đề cũng từ PDF ra.
  return String(s ?? '')
    .normalize('NFC')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Chuỗi có công thức Hoá → HTML có <sub>/<sup>, mũi tên là ký tự thật.
 * Dùng lại đúng bộ tách của màn làm bài nên hai đường ra không bao giờ lệch.
 *
 * GỠ KÝ TỰ LẠ NGAY TẠI ĐÂY, không chỉ lúc nạp đề. Ca mở TRƯỚC khi có bộ gỡ vẫn
 * đang giữ bản chưa lọc trong máy và trên máy chủ, nên phiếu của những ca đó
 * in ra ô vuông rỗng (thầy bắt được ở câu Kc, đề 12-C1-B1). Lọc ở tầng hiển
 * thị thì mọi ca cũ và mọi link đã gửi đi tự đúng, không phải nạp lại đề. */
export function chuHtml(s: unknown): string {
  if (s === null || s === undefined) return ''
  if (typeof s === 'object') {
    const obj = s as Record<string, unknown>
    const str = obj.chot || obj.text || obj.loiGiai || obj.giaiThich || obj.explanation || obj.noiDung || obj.viSao
    if (typeof str === 'string' && !str.includes('[object Object]')) return chuHtml(str)
    if (typeof str === 'object' && str !== null) return chuHtml(str)
    return ''
  }
  let str = String(s ?? '')
  if (str.includes('[object Object]')) {
    str = str.replace(/\[object Object\]/g, '').trim()
    if (!str) return ''
  }
  const trimmed = str.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>
      const inner = obj.chot || obj.text || obj.loiGiai || obj.giaiThich || obj.explanation || obj.noiDung || obj.viSao
      if (inner) return chuHtml(inner)
    } catch {}
  }
  return doanHtml(doanCongThuc(goKyTuLa(str)))
}

/** Hướng thân mũi tên: một chiều sang phải, sang trái, hay hai chiều. */
const HUONG_MUI: Record<string, string> = { '→': 'mt-phai', '←': 'mt-trai', '⇌': 'mt-hai' }

function doanHtml(ds: DoanChu[]): string {
  return ds
    .map((d) => {
      const v = thoat(d.v)
      if (d.t === 'sub') return `<sub>${v}</sub>`
      if (d.t === 'sup') return `<sup>${v}</sup>`
      if (d.t === 'mui') return muiTenHtml(d)
      return v
    })
    .join('')
}

/** MŨI TÊN PHẢN ỨNG vẽ bằng nét, nhãn nằm TRÊN và DƯỚI thân.
 *
 * Bản trước in `→ (+H2 dư, Ni, t°)` — điều kiện tụt xuống ngang hàng với chất,
 * đọc sơ đồ chuyển hoá phải tự đoán ngoặc nào của mũi tên nào. Nay xếp chồng
 * đúng như sách: nhãn trên là điều kiện, nhãn dưới là phần còn lại.
 *
 * Thân vẽ bằng `border` chứ không dùng ký tự `→`: nét luôn sắc khi in, dài ra
 * theo nhãn, và không phụ thuộc phông có glyph mũi tên hay không. */
function muiTenHtml(d: DoanChu): string {
  const huong = HUONG_MUI[d.v] || 'mt-phai'
  const tren = d.tren && d.tren.length ? `<span class="mt-tren">${doanHtml(d.tren)}</span>` : ''
  const duoi = d.duoi && d.duoi.length ? `<span class="mt-duoi">${doanHtml(d.duoi)}</span>` : ''
  // Không nhãn thì không cần khung xếp chồng — giữ mũi tên trần cho nhẹ.
  if (!tren && !duoi) return `<span class="mt mt-tran"><span class="mt-than ${huong}"></span></span>`
  return `<span class="mt">${tren}<span class="mt-than ${huong}"></span>${duoi}</span>`
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
/* Hai nút "−" và "," cạnh ô trả lời ngắn: bàn phím SỐ của điện thoại không có hai dấu ấy. Không lấy tiêu điểm khỏi ô (bàn phím không đóng). */
.lam-nhap-khoi { display: flex; align-items: stretch; gap: 8px; width: 100%; max-width: 340px; }
.lam-nhap-khoi .lam-nhap { flex: 1 1 auto; min-width: 0; max-width: none; }
.lam-nut { flex: 0 0 auto; min-width: 44px; height: 40px; padding: 0 10px; border-radius: 10px; border: 1px solid #e4e0d7; background: var(--o-nen); color: var(--muc); font: inherit; font-size: 20px; font-weight: 700; line-height: 1; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none; }
.lam-nut:focus-visible { outline: 3px solid rgba(47,62,70,.35); outline-offset: 2px; }
.q-card.da-cham .lam-nut { pointer-events: none; opacity: .5; }
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
.nop-loi.luu { color: #475467; }

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
.ico-nho { width: 1em; height: 1em; vertical-align: -0.15em; margin-right: 4px; flex-shrink: 0; }
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
  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s;
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
`

/** Mũi tên chỉ xuống, vẽ bằng SVG nội tuyến — không gọi phông biểu tượng nào,
 * nên phiếu vẫn đúng hình khi mất mạng. */
const MUI_TEN = '<svg class="q-mui" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'

/** Một thẻ câu: đề bài + phương án + ô lời giải gập sẵn.
 *
 * `stt` là số thứ tự liên tục trên cả phiếu.
 * `moSan` = true thì thẻ hiện sẵn lời giải (chỉ dùng khi cần bản đọc thẳng). */
/** CHỌN NGAY TRÊN PHƯƠNG ÁN CỦA ĐỀ — thầy chốt 08/09:
 * "làm cho chọn luôn các nút trên bài làm không cần tạo thêm dòng em chọn nữa".
 *
 * Bản trước dựng thêm một khối "EM CHỌN" bên dưới câu, tức là em đọc phương án
 * ở trên rồi phải dóng xuống một hàng A B C D khác để chọn — hai lần đọc cho
 * một việc, và trên điện thoại thì hai chỗ đó không nằm cùng màn hình.
 *
 * Nay chính hàng phương án là ô chọn. Không thêm byte nào cho phiếu chỉ đọc:
 * mọi thứ dưới đây chỉ bật khi `choLam`.
 */

export function theCauHtml(
  c: CauLuyen,
  stt: number,
  moSan = false,
  anGiai = false,
  choLam = false,
  laBtvn = false,
  soCauSang?: number,
): string {
  // Nhãn CHỮA đứng trước mọi nhãn khác: đọc một dòng là biết câu này có mặt
  // ở đây để sửa lỗi nào, không phải "một câu Ester bất kỳ".
  const n = c.chuaCho
  // BTVN nâng đỡ (bài ca_nhan): câu không mang `caNhan` thì mọi thứ dưới đây ra ĐÚNG như trước, từng byte.
  const cn = c.caNhan
  const coDap = !cn?.chuaCoDapAn
  const laDimmed = Boolean(laBtvn && soCauSang && stt > soCauSang)
  const tagVong = laBtvn
    ? c.mucDo === 'van_dung'
      ? '<span class="q-tag vong-btvn vong-3">Câu thử thách (sai không sao)</span>'
      : c.mucDo === 'hieu'
      ? '<span class="q-tag vong-btvn vong-2">Câu dành riêng cho em</span>'
      : '<span class="q-tag vong-btvn vong-1">Câu cốt lõi</span>'
    : ''
  const tagMucTieu = Boolean(laBtvn && soCauSang && stt <= soCauSang)
    ? `<span class="q-tag muc-tieu-hom-nay-tag">${ICO_SAO}Mục tiêu hôm nay</span>`
    : ''
  const tags = [
    cn?.thuSuc ? chipThuSucHtml() : cn?.nhan ? nhanChipHtml(cn.nhan) : '',
    tagMucTieu,
    tagVong,
    n
      ? `<span class="q-tag ${n.laDeCuaEm ? 'sai-cua-em' : 'chua'}">${
          n.laDeCuaEm
            ? `Em làm sai câu ${n.soCau} phần ${n.phan}`
            : n.laLamLai
            ? `Làm lại câu ${n.soCau} phần ${n.phan}`
            : n.theoChuyenDe
              ? `Luyện thêm cho câu ${n.soCau} phần ${n.phan}`
              : `Khắc phục lỗi sai câu ${n.soCau} phần ${n.phan}`
        }</span>`
      : '',
    n && n.laLamLai ? '<span class="q-tag chua-2">kho chưa có câu cùng dạng</span>' : '',
    n && n.theoChuyenDe ? '<span class="q-tag chua-2">cùng chuyên đề, chưa chắc cùng dạng</span>' : '',
    n && !n.laDeCuaEm && !n.laLamLai && !n.theoChuyenDe && n.bac === 2 ? '<span class="q-tag chua-2">cùng cơ chế, khác việc</span>' : '',
    `<span class="q-tag ${LOP_LOAI[c.phan]}">${TEN_LOAI[c.phan]}</span>`,
    c.mucDo ? `<span class="q-tag ${LOP_MUC[c.mucDo]}">${TEN_MUC[c.mucDo]}</span>` : '',
    c.chuyenDe ? `<span class="q-tag topic">${thoat(c.chuyenDe)}</span>` : '',
  ].filter(Boolean).join('')

  let than = ''
  if (c.phan === 'I' && c.luaChon) {
    // Phương án bằng ẢNH thì ảnh THAY chữ, đúng như màn làm bài. Kho đề ghi
    // chữ "(xem hình)" ở những phương án đó — in ra chữ ấy là em nhìn tờ phiếu
    // không có gì để chọn.
    const dai = c.luaChon.some((x) => (x || '').length > 56)
    const o = c.luaChon
      .map((pa, i) => {
        const dung = CHU_PA[i] === (c.dapAn || '').trim().toUpperCase()
        const laDaChonSai = Boolean(n && n.daChon && n.daChon.trim().toUpperCase() === CHU_PA[i] && !dung)
        // LỚP `dung`/`sai` KHÔNG NẰM SẴN TRONG THẺ — xem `dongBoLoDapAn` dưới
        // phần mã lệnh. Thẻ chỉ mang DẤU (`data-dung` / `data-sai`); khi nào
        // được phép hiện đáp án thì mã lệnh mới gắn lớp vào. Nhờ vậy lúc giấu
        // thì thẻ đúng và thẻ sai giống nhau TỪNG THUỘC TÍNH, không phải giống
        // nhau nhờ một bộ mau to lai bang tay (thầy bắt 15/09: bấm "Hiện đề"
        // mà ô đáp án vẫn khác màu).
        const dau = `${dung ? ' data-dung="1"' : ''}${laDaChonSai ? ' data-sai="1"' : ''}`
        const lop = 'q-opt'
        const anh = c.anhLuaChon?.[i]
        const noi = anh ? anhHtml(anh, 'pa', `Phương án ${CHU_PA[i]}`) : chuHtml(pa)
        // THẺ NÚT THẬT, không phải div gắn sự kiện (thầy chốt 08/09 sau bốn
        // lần báo "nút bấm được nút không"). Trình duyệt di động xử lý cú chạm
        // cho <button> khác hẳn cho <div>: nó tự lo ngưỡng xê tay, tự huỷ đúng
        // lúc, tự phát click. Mọi mã tự bắt chạm đều thua hàng gốc này.
        // SPAN chứ không DIV: thẻ button chỉ được chứa nội dung dòng, nhét div
        // vào là HTML sai chuẩn và trình duyệt tự cắt cấu trúc — đo được: cả
        // phương án phần I mất hẳn cú bấm.
        const trong = `<span class="q-opt-letter"><span class="ky">${CHU_PA[i]}</span></span><span class="q-opt-text">${noi}${hinhTaiViTri(c, `sau_pa_${CHU_PA[i]}`)}</span>`
        if (!choLam) return `<div class="${lop}"${dau}><div class="q-opt-letter"><span class="ky">${CHU_PA[i]}</span></div><div class="q-opt-text">${noi}${hinhTaiViTri(c, `sau_pa_${CHU_PA[i]}`)}</div></div>`
        return `<button type="button" class="${lop} lam-o"${dau} data-chon="${CHU_PA[i]}" role="radio" aria-checked="false">${trong}</button>`
      })
      .join('')
    than = `<div class="q-options${dai ? ' single-col' : ''}">${o}</div>`
  } else if (c.phan === 'II' && c.luaChon) {
    const dung = ysDung(c.dapAn)
    const hang = c.luaChon
      .map((y, i) => {
        const anh = c.anhLuaChon?.[i]
        const noi = anh ? anhHtml(anh, 'pa', `Ý ${CHU_Y[i]}`) : chuHtml(y)
        const oDS = (ds: 'd' | 's', ky: string, laDung: boolean) =>
          choLam
            ? `<button type="button" class="tf-badge ${ds} lam-o"${laDung ? ' data-dung="1"' : ''} data-chon="${ds === 'd' ? 'D' : 'S'}" role="radio" aria-checked="false" aria-label="${ky === 'Đ' ? 'Đúng' : 'Sai'} — ý ${CHU_Y[i]}"><span class="ky">${ky}</span></button>`
            : `<div class="tf-badge ${ds}"${laDung ? ' data-dung="1"' : ''}><span class="ky">${ky}</span></div>`
        return `<div class="tf-item"${choLam ? ` data-y="${CHU_Y[i]}"` : ''}><div class="tf-statement">${CHU_Y[i]}. ${noi}${hinhTaiViTri(c, `sau_y_${CHU_Y[i]}`)}</div><div class="tf-o">${oDS('d', 'Đ', coDap && dung[i])}${oDS('s', 'S', coDap && !dung[i])}</div></div>`
      })
      .join('')
    /* KHONG con hang nhan Đ / S o dau hai cot (thay bo 09/09): moi o da mang
       san chu cai cua no, hang nhan chi lam chat them chieu ngang tren dien
       thoai. */
    than = hang
  } else {
    // Phần III cho làm bài: ô điền ĐỨNG THAY dòng kẻ, không thêm hàng mới.
    const oDien = choLam
      ? `<div class="lam-nhap-khoi"><button type="button" class="lam-nut" data-lam-nut="am" aria-label="Đổi dấu âm">−</button><input class="lam-nhap" type="text" inputmode="decimal" autocomplete="off" aria-label="Đáp án của em" placeholder="Đáp án của em"><button type="button" class="lam-nut" data-lam-nut="phay" aria-label="Thêm dấu phẩy">,</button></div>`
      : `<div class="sa-blank">Đáp án: ……………………………</div>`
    than = anGiai || !coDap
      ? `<div class="sa-vung">${oDien}</div>`
      : `<div class="sa-vung">${oDien}<div class="sa-answer"><span class="ky">${chuHtml(c.dapAn || '—')}</span></div></div>`
  }

  // Ảnh cắt cả thân câu LÀ đề bài — có nó thì không in `text` nữa, đúng như màn
  // làm bài của học sinh (lớp chữ trong PDF gốc hay vỡ công thức ÂM THẦM).
  const txtDinhDang = tachDongTheoY(c.text)
  const deBai = (c.anhThanCau ? anhHtml(c.anhThanCau, 'than', 'Đề bài') : `<div class="q-text" style="white-space: pre-line;">${chuHtml(txtDinhDang)}</div>`) + experimentHtml(txtDinhDang)
  const giai = anGiai ? '' : oGiaiHtml(c)
  const nut = giai
    ? `<button class="q-nut-giai" type="button" aria-expanded="${moSan ? 'true' : 'false'}" aria-controls="giai-${stt}">${MUI_TEN}<span class="chu-mo">Xem lời giải</span><span class="chu-dong">Ẩn lời giải</span></button>
  <div class="sol-wrap" id="giai-${stt}"><div class="sol-inner">${giai}</div></div>`
    : ''

  const oLamLai =
    n && n.laDeCuaEm
      ? // Mệnh đề "đáp án đúng X" là ĐÁP ÁN VIẾT THẲNG RA CHỮ, nằm ngoài khối
        // lời giải nên chế độ "Hiện đề" không giấu được. Tách vào một span
        // riêng để giấu cùng lúc với mọi thứ khác (thầy bắt 15/09).
        `<div class="lam-lai"><b>Em chọn ${n.daChon ? thoat(n.daChon) : 'chưa trả lời'}<span class="lo-dap">${
          n.dapAnDung || c.dapAn ? ` · đáp án đúng ${thoat(n.dapAnDung || c.dapAn)}` : ''
        }</span>.</b> Đọc lời giải bên dưới rồi tự làm lại câu này.</div>`
      : n && n.laLamLai
      ? `<div class="lam-lai"><b>Lần thi vừa rồi em chọn ${n.daChon ? thoat(n.daChon) : 'sai câu này'}.</b>${
          n.viSaoSai ? ` ${thoat(n.viSaoSai)}` : ' Em xem lại lời giải bên dưới rồi tự làm lại từ đầu.'
        }</div>`
      : ''

  const bannerDimmed = laDimmed
    ? `<div class="dimmed-pacing-banner"><span class="dimmed-lock-icon">${ICO_KHOA}</span><span>Câu thuộc chặng tiếp theo · Hoàn thành ${soCauSang} câu sáng hôm nay trước để đạt chỉ tiêu</span></div>`
    : ''

  const cacLop = [
    'q-card',
    n ? 'la-chua' : '',
    moSan ? 'mo' : '',
    giai ? '' : 'khong-giai',
    laDimmed ? 'q-card-dimmed' : (laBtvn && soCauSang ? 'q-card-active' : ''),
    cn?.thuSuc ? 'q-card-thu-suc' : '',
    cn?.daCham ? 'da-cham' : '',
    cn?.daCham ? (cn.daCham.dung ? 'cau-dung' : 'cau-sai') : '',
  ].filter(Boolean).join(' ')

  return `<article class="${cacLop}" data-so="${stt}" data-phan="${c.phan}" data-muc="${thoat(c.mucDo || '')}"${choLam ? ` data-qid="${thoat(c.id || '')}"` : ''}>
  <div class="q-header"><div class="q-num"><span class="ky">${stt}</span></div><div class="q-tags">${tags}</div></div>
  <div class="q-than">
    ${bannerDimmed}${cn?.thuSuc ? '\n    ' + ghiThuSucHtml() : cn?.nhan && ghiThuongHtml(cn.nhan) ? '\n    ' + ghiThuongHtml(cn.nhan) : ''}
    ${oLamLai}
    ${deBai}
    ${bangHtml(c.bang)}
    ${experimentOriginal(c.text,hinhTaiViTri(c, 'sau_de'))}
    ${than}
    ${hinhTaiViTri(c, 'cuoi_cau')}${cn?.daCham ? `<div class="lam-ket">${cn.daCham.dung ? 'Đúng' : 'Sai'}</div>` : ''}
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
  let chot = c.chot
  let lyDo = c.lyDo
  let buoc = c.buoc
  let ketQua = c.ketQua

  if (!chot && (!lyDo || lyDo.length === 0) && (!buoc || buoc.length === 0)) {
    const rawAny = (c as any).loiGiai || (c as any).giaiThich || (c as any).explanation || (c as any).noiDung || (c as any).viSao
    if (rawAny) {
      const ch = chuanHoaLoiGiaiCau(rawAny, c.phan, c.dapAn)
      if (ch.chot) chot = ch.chot
      if (ch.lyDo && ch.lyDo.length > 0) lyDo = ch.lyDo
      if (ch.buoc && ch.buoc.length > 0) buoc = ch.buoc
      if (ch.ketQua && !ketQua) ketQua = ch.ketQua
    }
  }

  const khoi: string[] = [`<div class="sol-dap">Đáp án: <b>${chuHtml(dapAnChu(c))}</b></div>`]

  const dungKhoa = c.phan === 'II' ? CHU_Y.filter((_, i) => ysDung(c.dapAn)[i]) : [(c.dapAn || '').trim().toUpperCase()]
  let coGiai = false
  // KIẾN THỨC CỐT LÕI in đậm TRÊN CÙNG (thầy chốt 04-09 khuya: "kiến thức cốt lõi
  // bôi đậm trên cùng để giải câu đó"), rồi mới tới vì sao chọn / không chọn
  // từng phương án.
  const chuChot = chot ? chuHtml(chot).trim() : ''
  if (chuChot && !chuChot.includes('[object Object]')) {
    khoi.push(`<div class="sol-label">Kiến thức cốt lõi</div><div class="sol-text sol-cot-loi">${chuChot}</div>`)
    coGiai = true
  }
  if (lyDo && lyDo.length > 0) {
    const dong = lyDo
      .map((l) => `<div class="sol-pa${dungKhoa.includes(l.khoa) ? ' chon' : ''}"><strong>${thoat(l.khoa)}.</strong> ${dungKhoa.includes(l.khoa) ? '✓ ' : '✗ '}${chuHtml(l.ly)}</div>`)
      .join('')
    khoi.push(`<div class="sol-label">${c.phan === 'II' ? 'Vì sao từng ý đúng / sai' : 'Vì sao chọn / không chọn từng phương án'}</div><div class="sol-text">${dong}</div>`)
    coGiai = true
  }
  const dsBuoc = buoc ?? []
  if (dsBuoc.length > 0) {
    const ds = dsBuoc.map((b, i) => `<div class="sol-step">${i + 1}. ${chuHtml(b)}</div>`).join('')
    khoi.push(`<div class="sol-label">Làm từng bước</div>${ds}`)
    coGiai = true
  }
  if (ketQua) {
    khoi.push(`<div class="sol-label">Kết quả</div><div class="sol-text sol-ket">${chuHtml(ketQua)}</div>`)
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

/** CÔNG THỨC IN TRÊN BÌA, CHỌN THEO CHUYÊN ĐỀ.
 *
 * LỖI ĐÃ DÍNH (thầy báo 06/09): bìa gõ cứng `RCOOR'` và ba phân tử ester, nên
 * phiếu chuyên đề nào cũng in ester — bài amine, bài carbohydrate, bài kim
 * loại đều mang một cái bìa nói sai nội dung bên trong.
 *
 * Không khớp chuyên đề nào thì dùng bộ TRUNG TÍNH, chứ KHÔNG rơi về ester:
 * thà bìa chung chung còn hơn bìa nói sai. */
export function congThucBia(tenChuyenDe: string): { chinh: string; troi: [string, string, string] } {
  const t = goKyTuLa(String(tenChuyenDe ?? ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
  const co = (...tu: string[]) => tu.some((x) => t.includes(x))

  if (co('ester', 'lipid', 'chat beo', 'xa phong')) {
    return { chinh: "RCOOR'", troi: ['RCOOR&#39;', 'CH<sub>3</sub>COOH', 'C<sub>9</sub>H<sub>8</sub>O<sub>4</sub>'] }
  }
  if (co('carbohydrate', 'glucose', 'saccharose', 'tinh bot', 'cellulose')) {
    return { chinh: 'C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>', troi: ['C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>', 'C<sub>12</sub>H<sub>22</sub>O<sub>11</sub>', '(C<sub>6</sub>H<sub>10</sub>O<sub>5</sub>)<sub>n</sub>'] }
  }
  if (co('nitrogen', 'amine', 'amino acid', 'peptide', 'protein')) {
    return { chinh: 'H<sub>2</sub>N&ndash;R&ndash;COOH', troi: ['CH<sub>3</sub>NH<sub>2</sub>', 'H<sub>2</sub>N&ndash;CH<sub>2</sub>&ndash;COOH', '&ndash;CO&ndash;NH&ndash;'] }
  }
  if (co('polymer', 'chat deo', 'to ', 'cao su')) {
    return { chinh: '(&ndash;CH<sub>2</sub>&ndash;CH<sub>2</sub>&ndash;)<sub>n</sub>', troi: ['(&ndash;CH<sub>2</sub>&ndash;CH<sub>2</sub>&ndash;)<sub>n</sub>', 'CH<sub>2</sub>=CHCl', 'C<sub>5</sub>H<sub>8</sub>'] }
  }
  if (co('dien phan', 'pin dien', 'the dien cuc', 'an mon')) {
    return { chinh: 'E&deg;<sub>pin</sub>', troi: ['Zn | Zn<sup>2+</sup>', 'Cu<sup>2+</sup> | Cu', '2H<sub>2</sub>O &rarr; O<sub>2</sub>'] }
  }
  if (co('kim loai', 'hop kim', 'nhom ia', 'nhom iia', 'kiem tho', 'nuoc cung')) {
    return { chinh: 'M &rarr; M<sup>n+</sup>', troi: ['Fe<sub>2</sub>O<sub>3</sub>', 'CaCO<sub>3</sub>', 'Al(OH)<sub>3</sub>'] }
  }
  if (co('phuc chat', 'nguyen to chuyen tiep', 'kim loai chuyen tiep')) {
    return { chinh: '[Cu(NH<sub>3</sub>)<sub>4</sub>]<sup>2+</sup>', troi: ['[Ag(NH<sub>3</sub>)<sub>2</sub>]<sup>+</sup>', 'Fe<sup>3+</sup>', 'K<sub>2</sub>Cr<sub>2</sub>O<sub>7</sub>'] }
  }
  if (co('can bang', 'toc do phan ung', 'nhiet ', 'entropy', 'enthalpy')) {
    return { chinh: '&Delta;<sub>r</sub>H&deg;<sub>298</sub>', troi: ['K<sub>C</sub>', 'v = k[A]<sup>m</sup>', 'N<sub>2</sub> + 3H<sub>2</sub> &#8652; 2NH<sub>3</sub>'] }
  }
  // TRUNG TÍNH — dùng cho phiếu trộn nhiều chuyên đề, hoặc chuyên đề chưa có
  // trong bảng. Ba ký hiệu này đúng với mọi bài Hoá.
  return { chinh: 'H&oacute;a h&#7885;c', troi: ['H<sub>2</sub>O', 'NaOH', 'CO<sub>2</sub>'] }
}

export function biaHtml(t: ThongTinPhieu, soCau: number): string {
  const oKetQua = t.ketQua
    ? `<div class="cover-info-item" style="flex:0 1 auto;background:#fef2f2;border-color:#fecaca;">
    <div class="cover-info-label" style="color:#dc2626;">Kết quả</div>
    <div class="cover-info-value" style="color:#b91c1c;">${thoat(t.ketQua)}</div></div>`
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

  const ct = congThucBia(t.tenChuyenDe)
  // Công thức đứng CẠNH nhãn trong một viên thuốc, không còn chiếm một dòng
  // khổng lồ giữa trang, và ba phân tử mờ vắt chéo đã bỏ hẳn — chúng làm bìa
  // rối mà không nói thêm gì (thầy chốt 06/09).
  return `<header class="cover">
  <div class="google-bar"><div class="g-blue"></div><div class="g-red"></div><div class="g-yellow"></div><div class="g-green"></div></div>
  <div class="cover-blob b1"></div><div class="cover-blob b2"></div>
  <div class="cover-content">
    <div class="cover-badge">${thoat(t.nhanBia || (t.hienDapAn ? 'Lời giải chi tiết' : 'Phiếu bài tập riêng'))}<span class="ct">${ct.chinh}</span></div>
    <h1 class="cover-title">${tenHaiDong}</h1>
    <div class="cover-subtitle">Thầy Đỗ Đại Học · ${soCau} câu · ${ngayVN(t.ngay)}</div>
    <div class="cover-info">
      ${oNhanDang}
      ${oKetQua}
    </div>
  </div>
</header>`
}

/** Một ô thống kê. Có câu thì là NÚT LỌC, bấm vào chỉ còn hiện các câu của
 * phần đó; phần không có câu nào thì để ô chết, bấm vào lọc ra trang trắng là
 * vô nghĩa. */
function oThongKe(so: number, nhan: string, loc: string): string {
  const trong = `<span class="stat-number">${so}</span><span class="stat-label">${nhan}</span>`
  if (so === 0) return `<div class="stat-card" style="opacity:.5">${trong}</div>`
  return `<button type="button" class="stat-card" data-loc="${loc}" aria-pressed="false" title="${loc === 'tat' ? 'Xem tất cả' : 'Chỉ xem phần này'}">${trong}</button>`
}

export function tongQuanHtml(cau: CauLuyen[], laBtvn = false): string {
  const dem = (p: string) => cau.filter((c) => c.phan === p).length
  // Mức độ là thang THỨ BẬC dễ → khó, nên màu cũng phải đi theo bậc: xanh lá →
  // cam → đỏ, đúng lối Material của Google. Bản cũ để hồng cho "Thông hiểu" —
  // hồng không nằm trên thang nào cả, người đọc phải tra chú thích mới hiểu.
  // Ba mã dưới đều đủ tương phản trên nền sáng của phiếu, và tên mức luôn in
  // đậm ngay cạnh nên người mù màu vẫn phân biệt được, không phụ thuộc màu.
  const muc: [string, string, string][] = [
    ['biet', '#1e8e3e', 'Nhận biết'],
    ['hieu', '#e37400', 'Thông hiểu'],
    ['van_dung', '#c5221f', 'Vận dụng'],
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
      const tagVong = laBtvn
        ? k === 'biet'
          ? '<span class="vong-pill p1">Câu cốt lõi (bắt buộc)</span>'
          : k === 'hieu'
          ? '<span class="vong-pill p2">Câu dành riêng cho em (bắt buộc)</span>'
          : '<span class="vong-pill p3">Câu thử thách (sai không sao)</span>'
        : ''
      return `<button type="button" class="topic-item" data-loc="muc:${k}" aria-pressed="false"><span class="topic-cham"><span class="topic-dot" style="background:${mau};"></span></span><span class="topic-ten"><strong>${ten}</strong>${cd ? `<span class="topic-cd">${thoat(cd)}</span>` : ''}${tagVong}</span><span class="topic-cau">${nhan} · ${ds.length} câu</span></button>`
    })
    .join('')

  const v1Count = cau.filter((c) => c.mucDo === 'biet' || !c.mucDo).length
  const v2Count = cau.filter((c) => c.mucDo === 'hieu').length
  const v3Count = cau.filter((c) => c.mucDo === 'van_dung').length

  const bannerBtvn = laBtvn
    ? `<div class="btvn-3vong-banner">
  <div class="btvn-3vong-tieu-de">
    <strong>CÁC NHÓM CÂU TRONG BÀI TẬP VỀ NHÀ:</strong>
    <span class="btvn-chi-tieu">Làm xong câu cốt lõi và câu dành riêng cho em là đạt chỉ tiêu</span>
  </div>
  <div class="btvn-3vong-grid">
    <div class="vong-col col-1">
      <div class="vong-head">CÂU CỐT LÕI · ${v1Count} câu</div>
      <div class="vong-body">Kiến thức cốt lõi. Bắt buộc, em làm trước.</div>
    </div>
    <div class="vong-col col-2">
      <div class="vong-head">CÂU DÀNH RIÊNG CHO EM · ${v2Count} câu</div>
      <div class="vong-body">Rèn kỹ năng và lấp lỗ hổng theo chuyên đề. Bắt buộc.</div>
    </div>
    <div class="vong-col col-3">
      <div class="vong-head">CÂU THỬ THÁCH (SAI KHÔNG SAO) · ${v3Count} câu</div>
      <div class="vong-body">Câu vận dụng cao. Không bắt buộc; sai không sao, không bị trừ gì.</div>
    </div>
  </div>
</div>`
    : ''

  // KHÔNG EMOJI: quy tắc viết của thầy cấm emoji trong mọi thứ gửi phụ huynh và
  // học sinh, mà phiếu này gửi cả hai. Bốn ô đã tự nói tên phần của mình.
  return `<section class="summary-page">
  ${bannerBtvn}
  <div class="summary-dau">
    <span class="summary-title">Tổng quan đề bài</span>
    <span class="summary-tong">${cau.length} câu · chạm một ô để xem riêng phần đó</span>
  </div>
  <div class="stats-grid">
    ${oThongKe(cau.length, 'Tổng số câu', 'tat')}
    ${oThongKe(dem('I'), 'Trắc nghiệm', 'phan:I')}
    ${oThongKe(dem('II'), 'Đúng / Sai', 'phan:II')}
    ${oThongKe(dem('III'), 'Trả lời ngắn', 'phan:III')}
  </div>
  ${dong ? `<div class="topics-list"><h3>${laBtvn ? 'Phân loại mức độ & nhóm câu' : 'Phân loại mức độ'}</h3>${dong}</div>` : ''}
</section>`
}

/** KHỐI "PHIẾU NÀY CHỮA GÌ" — đầu phiếu, v4 mục 6.
 *
 * Nhìn <= 2 giây phải biết câu nào chữa câu nào. Hiện TÊN DẠNG, KHÔNG hiện mã:
 * mã là thứ nội bộ, phụ huynh và học sinh đọc vào chỉ thấy rối.
 *
 * Câu sai không có câu chữa vẫn phải có dòng, kèm lý do — im lặng bỏ qua là
 * thầy tưởng phiếu đã chữa hết. */
export function khoiChuaGiHtml(cau: CauLuyen[], thieu: { soCau: number; phan?: 'I' | 'II' | 'III'; tenDang: string; vi: string }[] = []): string {
  // GOM THEO PHẦN + SỐ CÂU, không theo số câu trần. Số câu đánh lại từ 1 ở mỗi
  // phần, nên gom theo số là dồn câu 2 phần I với câu 2 phần II vào một dòng —
  // đúng lỗi thầy bắt được 07/09: bảng báo "chưa có câu chữa cho câu 2" trong
  // khi phiếu vẫn in 5 câu khắc phục cho câu 2.
  const KHOA = (p: string | undefined, s: number) => `${p ?? '?'}|${s}`
  const THU = { I: 1, II: 2, III: 3 } as const
  const gom = new Map<string, { phan: 'I' | 'II' | 'III'; soCau: number; ten: string; so: number }>()
  for (const c of cau) {
    const n = c.chuaCho
    // Câu chỉ cùng chuyên đề KHÔNG được đếm vào bảng "chữa câu nào" — bảng ấy
    // là lời hứa đã chữa đúng bệnh.
    // Tờ ĐỀ CỦA EM không có bảng "khắc phục lỗi nào" — nó không khắc phục gì
    // cả, nó là chính bài em vừa làm.
    if (!n || n.theoChuyenDe || n.laDeCuaEm) continue
    const k = KHOA(n.phan, n.soCau)
    const cu = gom.get(k) ?? { phan: n.phan, soCau: n.soCau, ten: n.tenDang || '', so: 0 }
    cu.so += 1
    if (!cu.ten && n.tenDang) cu.ten = n.tenDang
    gom.set(k, cu)
  }
  if (gom.size === 0 && thieu.length === 0) return ''
  const sapXep = (a: { phan: 'I' | 'II' | 'III'; soCau: number }, b: { phan: 'I' | 'II' | 'III'; soCau: number }) =>
    THU[a.phan] - THU[b.phan] || a.soCau - b.soCau
  const dong = [...gom.values()]
    .sort(sapXep)
    .map((v) => `<li><b>Câu ${v.soCau} phần ${v.phan}</b>${v.ten ? ` · ${thoat(v.ten)}` : ''} <span class="chua-mui">-&gt;</span> ${v.so} câu khắc phục</li>`)
  const thieuDong = thieu
    .filter((t) => !gom.has(KHOA(t.phan, t.soCau)))
    .map(
      (t) =>
        `<li class="mo"><b>Câu ${t.soCau}${t.phan ? ` phần ${t.phan}` : ''}</b>${t.tenDang ? ` · ${thoat(t.tenDang)}` : ''} <span class="chua-mui">-&gt;</span> ${thoat(t.vi)}</li>`,
    )
  return `<section class="chua-gi">
  <h3>Phiếu này khắc phục lỗi nào</h3>
  <ul>${dong.join('')}${thieuDong.join('')}</ul>
</section>`
}

/** Thanh dính đầu màn: đếm số câu đã mở + mở/đóng tất cả + in.
 *
 * `soCau` là số câu CÓ LỜI GIẢI, không phải tổng số câu — câu chưa có đáp án
 * thì không mở được, đếm nó vào mẫu số là mãi mãi không bao giờ đủ. */
export function thanhHtml(soCau: number, anGiai = false): string {
  if (anGiai) {
    return `<div class="thanh">
  <div class="thanh-chu">Phiếu chỉ có đề<span class="the-loc" id="the-loc" hidden> · <b id="ten-loc"></b></span></div>
  <button class="nut nho" type="button" id="bo-loc" hidden>Bỏ lọc</button>
  <button class="nut nho" type="button" id="doi-mau" title="Đổi sang sắc cầu vồng tiếp theo">Đổi màu</button>
  <button class="nut chinh" type="button" id="pdf-de" title="Hộp thoại in mở ra, chọn Lưu thành PDF">Tải PDF</button>
</div>`
  }
  return `<div class="thanh">
  <div class="thanh-chu"><span class="dem-giai">Đã xem lời giải <b id="dem-mo">0</b>/<span id="dem-tong">${soCau}</span> câu</span><span class="the-loc" id="the-loc" hidden> · <b id="ten-loc"></b></span></div>
  <button class="nut nho" type="button" id="bo-loc" hidden>Bỏ lọc</button>
  <button class="nut nho" type="button" id="doi-mau" title="Đổi sang sắc cầu vồng tiếp theo">Đổi màu</button>
  <button class="nut" type="button" id="chi-de" aria-pressed="false" title="Giấu đáp án và lời giải để đọc đề trần"><span class="chu-mo">Ẩn lời giải</span><span class="chu-dong">Hiện cả lời giải</span></button>
  <button class="nut chinh" type="button" id="mo-het" aria-pressed="false"><span class="chu-mo">Mở hết lời giải</span><span class="chu-dong">Đóng hết lời giải</span></button>
  <span class="pdf-boc">
    <button class="nut dam" type="button" id="tai-pdf" aria-haspopup="true" aria-expanded="false">Tải PDF</button>
    <span class="pdf-chon" id="pdf-chon" role="menu" hidden>
      <button type="button" id="pdf-de" role="menuitem">Chỉ đề bài</button>
      <button type="button" id="pdf-giai" role="menuitem">Đề và lời giải</button>
      <span class="pdf-nhac">Hộp thoại in mở ra, chọn <b>Lưu thành PDF</b>.</span>
    </span>
  </span>
</div>`
}

/** Kịch bản gập mở. Uỷ quyền một chỗ nên thêm bao nhiêu câu cũng không phải
 * gắn thêm bộ nghe; và toàn bộ trang vẫn đọc được nếu trình duyệt tắt JS,
 * chỉ mất phần gập. */
export const JS_PHIEU = `
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
      if (tpt) tpt.innerHTML = '<div class="tpt-trai"><span class="tpt-sao">${ICO_SAO}</span><span>Đã mở toàn bộ ' + tatCa.length + ' câu của bài tập. Em có thể làm tiếp để nhận thêm EXP Thần Thú!</span></div>';
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

      // XONG LÔ HIỆN TẠI (thay Vòng 1/2 — lich-lo-btvn.ts): mọi câu trong
      // 'du.soCauMocLo' câu ĐẦU đã có đáp án — đúng lúc thanh phân tầng phía
      // trên đổi từ "còn khoá" sang "hiện hết". Chỉ báo MỘT LẦN mỗi lần mở
      // phiếu (biến daBaoXongLo); báo lại giữa hai lần mở là bình thường, máy
      // chủ tự lọc trùng (chỉ tăng, không lùi tiến độ).
      var daBaoXongLo = false;
      function baoXongLo() {
        if (daBaoXongLo || !du.soCauMocLo) return;
        for (var iV1 = 0; iV1 < du.soCauMocLo; iV1++) {
          if (!String(lam[du.cau[iV1].id] || '').trim()) return;
        }
        daBaoXongLo = true;
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ddh-btvn-xong-lo', ma: du.ma, sbd: du.sbd, chiSo: du.chiSoLo }, '*');
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
        baoXongLo();
      }
      function soDaLam() {
        var n = 0;
        for (var i = 0; i < du.cau.length; i++) if (!du.cau[i].ts && String(lam[du.cau[i].id] || '').trim()) n++;
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
        if (v.classList.contains('da-cham')) return;
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
        if (v.classList.contains('da-cham')) return;
        lam[v.getAttribute('data-qid')] = e.target.value;
        luuLam();
        if (demLam) demLam.textContent = String(soDaLam());
      });

      // HAI NÚT "−" VÀ "," cạnh ô trả lời ngắn (bàn phím SỐ của điện thoại không có hai dấu ấy; thầy lệnh 21/09). Cùng phép với src/lib/nhap-dap-so.ts (test đối chiếu):
      // "−" bật/tắt "-" ở ĐẦU số; "," chèn TẠI CON TRỎ, chỉ MỘT dấu thập phân ("," hoặc "."). Em gõ gì gửi nấy: KHÔNG chuẩn hoá ở đây.
      function phieuSuaDoiDau(s, den) {
        var dau = 0;
        while (dau < s.length && (s.charAt(dau) === ' ' || s.charAt(dau) === '\\t' || s.charAt(dau) === '\\n' || s.charAt(dau) === '\\u00a0')) dau++;
        var d = Math.max(0, Math.min(s.length, den));
        if (s.charAt(dau) === '-') return { value: s.slice(0, dau) + s.slice(dau + 1), caret: d > dau ? d - 1 : d };
        return { value: s.slice(0, dau) + '-' + s.slice(dau), caret: d >= dau ? d + 1 : d };
      }
      function phieuSuaChenPhay(s, tu, den) {
        var a = Math.max(0, Math.min(s.length, Math.min(tu, den))), b = Math.max(0, Math.min(s.length, Math.max(tu, den)));
        var giu = s.slice(0, a) + s.slice(b);
        if (giu.indexOf(',') >= 0 || giu.indexOf('.') >= 0) return null;
        return { value: s.slice(0, a) + ',' + s.slice(b), caret: a + 1 };
      }
      ['pointerdown', 'mousedown'].forEach(function (ev) {
        document.addEventListener(ev, function (e) {
          if (e.target && e.target.closest && e.target.closest('.lam-nut')) e.preventDefault(); // không lấy tiêu điểm khỏi ô: bàn phím không đóng
        }, true);
      });
      document.addEventListener('click', function (e) {
        var nut = e.target && e.target.closest ? e.target.closest('.lam-nut') : null;
        if (!nut || daNop) return;
        var khoi = nut.closest('.lam-nhap-khoi');
        var o = khoi ? khoi.querySelector('.lam-nhap') : null;
        if (!o || o.disabled) return;
        var the = o.closest('.q-card[data-qid]');
        if (the && the.classList.contains('da-cham')) return;
        var coTieuDiem = document.activeElement === o;
        var tu = coTieuDiem && o.selectionStart != null ? o.selectionStart : o.value.length;
        var den = coTieuDiem && o.selectionEnd != null ? o.selectionEnd : o.value.length;
        var kq = nut.getAttribute('data-lam-nut') === 'am' ? phieuSuaDoiDau(o.value, den) : phieuSuaChenPhay(o.value, tu, den);
        if (!kq) return;
        o.value = kq.value;
        o.dispatchEvent(new Event('input', { bubbles: true }));
        if (coTieuDiem) { try { o.setSelectionRange(kq.caret, kq.caret); } catch (x) { /* bỏ qua */ } }
      });

      /** CHẤM TẠI CHỖ để hiện ngay. Máy chủ vẫn chấm LẠI và con số ghi vào
       * Sheet là con số của máy chủ — máy em sửa được. */
      function chamTaiCho() {
        // PHẦN III chấm Y HỆT luật chính thức normalizeNumericAnswer (src/engine/score.ts): tám kiểu dấu trừ → "-", bỏ MỌI khoảng trắng (kể cả
        // no-break), "," → ".", rồi so CHUỖI. KHÔNG bỏ dấu "+", KHÔNG bỏ đơn vị (mol, g, %…), KHÔNG so theo số học: chữ số có nghĩa là có
        // tính điểm ("0,80" ≠ "0,8", "+5" ≠ "5", "5 mol" ≠ "5"). Máy chủ chấm lại bằng đúng luật này nên chỗ này không được "nới hơn" —
        // nới thì em thấy "đúng" rồi bị chấm sai. Test dau-tru-phan-ba-1009 + cham-tai-cho-dung-luat-2109 khoá cả hai bên.
        var chuanIII = function (v) {
          return String(v == null ? '' : v).replace(/[‐‑‒–—―−－]/g, '-').replace(/[\\s\u00a0\u1680\u180e\u2000-\u200f\u202f\u205f\u2060\u3000\ufeff]+/g, '').replace(new RegExp('[\\u2028\\u2029]', 'g'), '').replace(/[，٫‚،]/g, ',').replace(/．/g, '.').replace(',', '.');
        };
        var normII = function (v) {
          return String(v == null ? '' : v).toUpperCase().replace(/Đ/g, 'D').replace(/[^DS]/g, '');
        };
        // MỘT LUẬT DÙNG CHUNG (thầy chốt 23/09/2026): dọn nhiễu rồi so theo SỐ HỌC, sai số 1e-4.
        // Trước đây phiếu so CHUỖI nên chấm sai nhiều câu đúng: "0,540" != "0,54", "2,5e-3", "0,54.".
        var chuanSoIII = function (v) {
          var s = String(v == null ? '' : v);
          if (s.normalize) s = s.normalize('NFKC');
          s = chuanIII(s).toLowerCase();
          return s.replace(/^[+~=]+/, '').replace(/[.,;:!?]+$/, '').replace(/,/g, '.');
        };
        var tachSo = function (s) {
          var m = /^([+-]?(?:\d+\.?\d*|\.\d+))(.*)$/.exec(s);
          return m ? { n: m[1], u: m[2] } : null;
        };
        var khopIII = function (v, d) {
          var a = chuanSoIII(v), b = chuanSoIII(d);
          if (!a || !b) return false;
          if (a === b) return true;
          var x = tachSo(a), y = tachSo(b);
          if (!x || !y) return false;
          if (x.u && y.u && x.u !== y.u) return false;
          var na = Number(x.n), nb = Number(y.n);
          return isFinite(na) && isFinite(nb) && Math.abs(na - nb) < 1e-4;
        };
        var dung = 0;
        var sai = [];
        for (var i = 0; i < du.cau.length; i++) {
          var c = du.cau[i];
          var chon = String(lam[c.id] == null ? '' : lam[c.id]).trim();
          var dapAn = String(c.dapAn == null ? '' : c.dapAn).trim();
          var khop = false;
          if (!chon) khop = false;
          else if (c.phan === 'III') {
            khop = khopIII(chon, dapAn);
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

      /** NỘP CHẶNG (bài ca_nhan): máy em KHÔNG có đáp án nên không chấm tại chỗ. Gửi đáp án của các câu chưa chấm
       * ra host (app cha) — host gọi máy chủ, lưu kết quả rồi dựng lại phiếu có đáp án + lời giải. */
      function loiNopChang(chu) {
        daNop = false;
        if (nutNop) { nutNop.disabled = false; nutNop.textContent = 'Nộp chặng'; }
        if (oLoiNop) { oLoiNop.hidden = false; oLoiNop.textContent = chu; }
      }
      /** ĐÃ LƯU Ở MÁY (máy chủ bận, app giữ bài và TỰ nộp lại khi máy chủ rảnh): nút khoá, lời báo trung tính (không đỏ), em không phải bấm lại. */
      function daLuuMay(nut, oLoi) {
        if (nut) { nut.disabled = true; nut.textContent = 'Đã lưu ở máy · đang chờ máy chủ'; }
        if (oLoi) oLoi.classList.add('luu');
      }
      function khoaNutTam(nut, giay) {
        if (!nut) return;
        var chuGoc = nut.textContent;
        var con = giay;
        nut.disabled = true;
        nut.textContent = 'Nộp lại sau ' + con + ' giây';
        var h = setInterval(function () {
          con -= 1;
          if (con <= 0) { clearInterval(h); nut.disabled = false; nut.textContent = chuGoc; }
          else nut.textContent = 'Nộp lại sau ' + con + ' giây';
        }, 1000);
      }
      var nutNopTs = document.getElementById('nut-nop-ts');
      var oLoiTs = document.getElementById('nop-loi-ts');
      var dangNopTs = false;
      function loiNopThuSuc(chu) {
        dangNopTs = false;
        if (nutNopTs) { nutNopTs.disabled = false; nutNopTs.textContent = 'Nộp phần thử sức thêm'; }
        if (oLoiTs) { oLoiTs.hidden = false; oLoiTs.textContent = chu; }
      }
      // NỘP PHẦN THỬ SỨC THÊM: chặng ẢO chiSoThuSuc, CHỈ các câu thử sức đã làm; không bắt buộc nên không hỏi "còn N câu chưa làm".
      function nopThuSuc() {
        if (dangNopTs || !du.caNhan || typeof du.caNhan.chiSoThuSuc !== 'number') return;
        var dcT = du.caNhan.daCham || {};
        var guiTs = {};
        var nTs = 0;
        for (var it = 0; it < du.cau.length; it++) {
          if (!du.cau[it].ts) continue;
          var qt = du.cau[it].id;
          if (Object.prototype.hasOwnProperty.call(dcT, qt)) continue;
          var vt = String(lam[qt] == null ? '' : lam[qt]).trim();
          if (vt) { guiTs[qt] = vt; nTs++; }
        }
        if (nTs === 0) {
          if (oLoiTs) { oLoiTs.hidden = false; oLoiTs.textContent = 'Em chưa làm câu nào ở phần thử sức thêm.'; }
          return;
        }
        dangNopTs = true;
        if (nutNopTs) { nutNopTs.disabled = true; nutNopTs.textContent = 'Đang nộp…'; }
        if (oLoiTs) oLoiTs.hidden = true;
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ddh-btvn-nop-chang', ma: du.ma, sbd: du.sbd, chiSo: du.caNhan.chiSoThuSuc, dapAn: guiTs }, '*');
            return;
          }
        } catch (eTs) {}
        loiNopThuSuc('Không gửi được từ trang này. Em mở bài trong app để nộp.');
      }
      if (nutNopTs) nutNopTs.addEventListener('click', nopThuSuc);
      var daHoiThieuC = -1;
      function nopChangCaNhan() {
        if (daNop) return;
        var dc = du.caNhan.daCham || {};
        var guiDi = {};
        var lamMoi = 0;
        var thieuC = 0;
        for (var ic2 = 0; ic2 < du.cau.length; ic2++) {
          var qc = du.cau[ic2].id;
          if (Object.prototype.hasOwnProperty.call(dc, qc)) continue;
          if (du.cau[ic2].ts) continue; // câu thử sức thêm nộp RIÊNG (nút riêng), không nằm trong gói nộp chặng
          var vv = String(lam[qc] == null ? '' : lam[qc]).trim();
          if (vv) { guiDi[qc] = vv; lamMoi++; } else thieuC++;
        }
        if (lamMoi === 0) {
          if (oLoiNop) { oLoiNop.hidden = false; oLoiNop.textContent = 'Em chưa làm câu nào trong chặng này.'; }
          return;
        }
        // HỎI NGAY TRÊN TRANG, KHÔNG DÙNG hộp xác nhận: hộp M3 mượn đúng MỘT chỗ gọi hộp ở luồng nộp cũ (có test khoá).
        if (thieuC > 0 && daHoiThieuC !== thieuC) {
          daHoiThieuC = thieuC;
          if (oLoiNop) { oLoiNop.hidden = false; oLoiNop.textContent = 'Còn ' + thieuC + ' câu chưa làm. Bấm Nộp chặng lần nữa để nộp phần đã làm. Câu còn lại em làm tiếp sau, câu đã nộp thì không đổi đáp án được.'; }
          return;
        }
        daNop = true;
        if (nutNop) { nutNop.disabled = true; nutNop.textContent = 'Đang nộp…'; }
        if (oLoiNop) oLoiNop.hidden = true;
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ddh-btvn-nop-chang', ma: du.ma, sbd: du.sbd, chiSo: du.caNhan.chiSo, dapAn: guiDi }, '*');
            return;
          }
        } catch (eNc) {}
        loiNopChang('Không gửi được từ trang này. Em mở bài trong app để nộp chặng.');
      }
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!du.caNhan || !d || d.type !== 'ddh-btvn-nop-chang-ket' || e.source !== window.parent) return;
        if (d.ok === false) {
          var chuLoi = String(d.error || 'Chưa nộp được chặng. Bài của em vẫn được giữ, em thử lại nhé.');
          var laTs = dangNopTs;
          if (laTs) loiNopThuSuc(chuLoi); else loiNopChang(chuLoi);
          // MÁY CHỦ BẬN (hết giờ / không nối được): bài vẫn ở máy; KHOÁ nút nộp 15 giây, đếm ngược trên nút — chống bấm dồn lúc máy chủ nghẽn (sự cố D1 21/09).
          if (d.daLuu === true) daLuuMay(laTs ? nutNopTs : nutNop, laTs ? oLoiTs : oLoiNop);
          else if (d.ban === true) khoaNutTam(laTs ? nutNopTs : nutNop, 15);
        }
      });

      if (nutNop) nutNop.addEventListener('click', function () {
        if (daNop) return;
        if (du.caNhan) { nopChangCaNhan(); return; }
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

      // BÀI ca_nhan: câu ĐÃ CHẤM ở máy chủ — điền lại đáp án em đã nộp và khoá ô nhập. Màu đúng/sai do bước đồng bộ
      // ở đầu mã lệnh lo (không có chua-nop ⇒ hiện); chỉ thẻ nào mang data-dung mới có màu: thẻ chưa chấm không có đáp án nào.
      if (du.caNhan && du.caNhan.daCham) {
        var dcs = du.caNhan.daCham;
        for (var qdc in dcs) {
          if (!Object.prototype.hasOwnProperty.call(dcs, qdc)) continue;
          lam[qdc] = String(dcs[qdc] && dcs[qdc].chon != null ? dcs[qdc].chon : '');
        }
        var oDc = document.querySelectorAll('.q-card.da-cham .lam-nhap');
        for (var idc = 0; idc < oDc.length; idc++) oDc[idc].readOnly = true;
      }

      veLam();
    }
  }
})();
`

/** GIAO DIỆN MATERIAL 3 của phiếu học sinh làm/nộp (lớp `gd-m3` trên <html>). CHỈ được chèn khi `taiLieuHtml`
 * nhận lớp ấy; mọi phiếu khác (giáo viên, in, máy chiếu) KHÔNG có một byte nào của khối này. */
export const CSS_PHIEU_M3 = `
/* ===================== GIAO DIỆN MATERIAL 3 CỦA PHIẾU (lớp html.gd-m3) =====================
   Chỉ được chèn khi <html> có lớp gd-m3 (phiếu học sinh làm/nộp). Phiếu giáo viên, bản in, tờ máy
   chiếu KHÔNG có khối này. Phần tô kiểu nằm trong @media screen nên bản in không đổi một byte; chỉ thêm một luật ẩn thanh bấm-được khi in.
   THAY ÁO, KHÔNG THAY XƯƠNG: không đổi id/class/thuộc tính mà mã lệnh và test đang dùng.
   QUY TẮC GIẤU ĐÁP ÁN vẫn nguyên: ở đây chỉ tô kiểu cho ô đang chọn (aria-checked) và cho lớp
   dung/sai (mã lệnh chỉ gắn lớp ấy vào DOM khi được phép lộ). KHÔNG bao giờ theo [data-dung].
   (Cấm dấu huyền ngược và ký hiệu đô-la-ngoặc-nhọn trong khối này: cả khối nằm trong một chuỗi mẫu.) */
/* Ngoài màn hình (in, chiếu): thanh trên và tấm lưới là đồ chỉ để bấm, không được lọt ra giấy. */
@media not screen {
  html.gd-m3 body .gd-tren, html.gd-m3 body .gd-luoi, html.gd-m3 body .gd-luoi-nen, html.gd-m3 body .gd-hop, html.gd-m3 body .gd-hop-nen { display: none !important; }
}
@media screen {
html.gd-m3 body {
  /* --- KHỐI TOKEN: bảng màu vai trò M3, cùng mã với src/components/bang-nhiem-vu/m3-theme.css --- */
  --gm-primary: #0b57d0; --gm-on-primary: #ffffff; --gm-primary-c: #d3e3fd; --gm-on-primary-c: #041e49;
  --gm-secondary-c: #c2e7ff; --gm-on-secondary-c: #001d35;
  --gm-tertiary: #146c2e; --gm-tertiary-c: #c4eed0; --gm-on-tertiary-c: #072100;
  --gm-error: #b3261e; --gm-error-c: #f9dedc; --gm-on-error-c: #410e0b;
  --gm-surface: #fdfbff; --gm-lowest: #ffffff; --gm-sc: #f0f4f9; --gm-sc-high: #e9eef6;
  --gm-on-surface: #1f1f1f; --gm-on-surface-v: #444746; --gm-outline: #747775; --gm-outline-v: #c4c7c5;
  --gm-cao1: 0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15);
  --gm-cao-tren: 0 -1px 3px rgba(0,0,0,.15);
}
@media (prefers-color-scheme: dark) {
  html.gd-m3 body {
    --gm-primary: #a8c7fa; --gm-on-primary: #062e6f; --gm-primary-c: #0842a0; --gm-on-primary-c: #d3e3fd;
    --gm-secondary-c: #004a77; --gm-on-secondary-c: #c2e7ff;
    --gm-tertiary: #6dd58c; --gm-tertiary-c: #0f5223; --gm-on-tertiary-c: #c4eed0;
    --gm-error: #f2b8b5; --gm-error-c: #8c1d18; --gm-on-error-c: #f9dedc;
    --gm-surface: #131314; --gm-lowest: #3a3c3f; --gm-sc: #1e1f20; --gm-sc-high: #282a2c;
    --gm-on-surface: #e3e3e3; --gm-on-surface-v: #c4c7c5; --gm-outline: #8e918f; --gm-outline-v: #444746;
    --gm-cao1: 0 1px 2px rgba(0,0,0,.5), 0 1px 3px 1px rgba(0,0,0,.3);
    --gm-cao-tren: 0 -2px 8px rgba(0,0,0,.5);
  }
}
html.gd-m3 body.dark {
  --gm-primary: #a8c7fa; --gm-on-primary: #062e6f; --gm-primary-c: #0842a0; --gm-on-primary-c: #d3e3fd;
  --gm-secondary-c: #004a77; --gm-on-secondary-c: #c2e7ff;
  --gm-tertiary: #6dd58c; --gm-tertiary-c: #0f5223; --gm-on-tertiary-c: #c4eed0;
  --gm-error: #f2b8b5; --gm-error-c: #8c1d18; --gm-on-error-c: #f9dedc;
  --gm-surface: #131314; --gm-lowest: #3a3c3f; --gm-sc: #1e1f20; --gm-sc-high: #282a2c;
  --gm-on-surface: #e3e3e3; --gm-on-surface-v: #c4c7c5; --gm-outline: #8e918f; --gm-outline-v: #444746;
  --gm-cao1: 0 1px 2px rgba(0,0,0,.5), 0 1px 3px 1px rgba(0,0,0,.3);
  --gm-cao-tren: 0 -2px 8px rgba(0,0,0,.5);
}

/* --- biểu tượng nét (mặt nạ SVG, không thêm yêu cầu mạng) --- */
html.gd-m3 body {
  --gm-i-check: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E");
  --gm-i-x: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 6 18'/%3E%3Cpath d='m6 6 12 12'/%3E%3C/svg%3E");
  --gm-i-khoa: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2'/%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'/%3E%3C/svg%3E");
  /* --- ánh xạ biến cũ của phiếu sang token M3: mọi phần chưa ghi đè riêng tự hợp màu --- */
  --nen: var(--gm-surface); --the-nen: var(--gm-sc); --muc: var(--gm-on-surface); --muc-2: var(--gm-on-surface);
  --nhat: var(--gm-on-surface-v); --rat-nhat: var(--gm-outline); --vien: var(--gm-outline-v); --vien-dam: var(--gm-outline);
  --nav: var(--gm-primary); --luc: var(--gm-primary);
  --o-nen: var(--gm-lowest); --o-chu: var(--gm-on-surface); --chu-cai-nen: var(--gm-sc-high); --chu-cai-muc: var(--gm-on-surface-v);
  --chon-nen: var(--gm-primary-c); --chon-vien: var(--gm-primary);
  --dung: var(--gm-tertiary); --dung-nen: var(--gm-tertiary-c); --dung-muc: var(--gm-on-tertiary-c);
  --sai: var(--gm-error); --sai-nen: var(--gm-error-c); --sai-muc: var(--gm-on-error-c);
  --kem-nen: var(--gm-sc-high); --kem-vien: transparent; --kem-muc: var(--gm-on-surface); --kem-nhan: var(--gm-on-surface-v);
  --bo: 20px; --bo-nho: 12px; --bong: none; --bong-cao: none;
  background: var(--gm-surface); color: var(--gm-on-surface);
  -webkit-tap-highlight-color: transparent;
}
html.gd-m3 body .cover, html.gd-m3 body .summary-page, html.gd-m3 body .ds-tieu-de, html.gd-m3 body #doi-mau { display: none; }
/* Cách chia "3 Vòng" đã thay bằng lô theo ngày/giờ: chữ còn nằm trong DOM (bài kiểm khoá chuỗi) nhưng học sinh không thấy. */
html.gd-m3 body .q-tag.vong-btvn, html.gd-m3 body .vong-pill, html.gd-m3 body .btvn-3vong-banner { display: none; }
/* Chừa chỗ cho hai thanh dính: tab/cuộn tới một ô không được bị thanh trên hoặc thanh nộp che mất. */
html.gd-m3 { --gd-cao: 96px; scroll-padding-top: calc(var(--gd-cao) + 16px); scroll-padding-bottom: 96px; }
html.gd-m3 body .khung { max-width: 720px; margin: 0 auto; padding: 14px 16px 132px; }
/* Thanh trên là position:fixed (thu gọn khi cuộn KHÔNG được đổi chiều cao dòng chảy, nếu không trang giật và cuộn
   dao động); chỗ của nó do padding này giữ, --gd-cao do mã lệnh trang trí đo lại theo chiều cao thật. */
html.gd-m3 body.co-lam .khung { padding-top: calc(var(--gd-cao) + 14px); }
html.gd-m3 body .chan { color: var(--gm-on-surface-v); }

/* --- thanh trên dính: tên bài + tiến độ + lưới số câu --- */
html.gd-m3 body .gd-tren {
  position: fixed; top: 0; left: 0; right: 0; z-index: 30; box-sizing: border-box;
  padding: max(12px, env(safe-area-inset-top)) 16px 12px;
  background: var(--gm-surface); box-shadow: var(--gm-cao1);
}
html.gd-m3 body .gd-tren-trong { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
html.gd-m3 body .gd-tren-hang { display: flex; align-items: center; gap: 8px; }
html.gd-m3 body .gd-tren-chu { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
html.gd-m3 body .gd-hang-tieu { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
html.gd-m3 body .gd-han { flex-shrink: 0; font-size: 12px; font-weight: 600; color: var(--gm-on-surface-v); }
html.gd-m3 body .gd-tieu-de { min-width: 0; font-size: 17px; line-height: 24px; font-weight: 700; color: var(--gm-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
html.gd-m3 body .gd-phu-hang { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; }
html.gd-m3 body .gd-phu { font-size: 13px; font-weight: 600; color: var(--gm-on-surface-v); }
/* Cuộn xuống thì thu gọn: bỏ tên bài, chỉ còn số câu + tiến độ + nút lưới. */
html.gd-m3 body .gd-tren.gd-gon { padding-top: max(6px, env(safe-area-inset-top)); padding-bottom: 8px; }
html.gd-m3 body .gd-tren.gd-gon .gd-hang-tieu { display: none; }
html.gd-m3 body .gd-nut-luoi {
  flex-shrink: 0; width: 48px; height: 48px; padding: 0; border: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  background: var(--gm-sc-high); color: var(--gm-on-primary-c);
}
html.gd-m3 body .gd-khich {
  padding: 2px 10px; border-radius: 999px; background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c);
  font-size: 12px; font-weight: 700;
}
html.gd-m3 body .gd-khich[hidden] { display: none; }
html.gd-m3 body .gd-tien { height: 6px; border-radius: 999px; background: var(--gm-primary-c); overflow: hidden; }
html.gd-m3 body .gd-tien-day { height: 100%; width: var(--gd-tien, 0%); border-radius: 999px; background: var(--gm-primary); transition: width .2s cubic-bezier(.2,0,0,1); }
html.gd-m3 body.gd-vua-xong .gd-tien { animation: gd-nay .4s cubic-bezier(.2,0,0,1) 1; }
@keyframes gd-nay { 0% { transform: scaleY(1); } 40% { transform: scaleY(1.9); } 100% { transform: scaleY(1); } }
/* Chọn đáp án: dòng vừa chọn nảy nhẹ 120 ms (chạy khi bộ chọn bắt đầu khớp; tắt hẳn khi giảm chuyển động). */
@keyframes gd-chon { 0% { transform: scale(.985); } 100% { transform: scale(1); } }
html.gd-m3 body .q-opt.lam-o[aria-checked="true"], html.gd-m3 body .tf-badge.lam-o[aria-checked="true"] { animation: gd-chon .12s cubic-bezier(.2,0,0,1) 1; }

/* --- thanh nộp: dải dính dưới cùng, nút Nộp bài filled --- */
html.gd-m3 body #thanh-nop {
  position: fixed; left: 0; right: 0; bottom: 0; top: auto; z-index: 40; box-sizing: border-box;
  margin: 0; border: 0; border-radius: 0; flex-wrap: nowrap; gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--gm-sc); box-shadow: var(--gm-cao-tren);
  -webkit-backdrop-filter: none; backdrop-filter: none;
}
html.gd-m3 body #thanh-nop .nop-chu { flex: 1; min-width: 0; font-size: 14px; font-weight: 700; color: var(--gm-on-surface); }
/* Khi mã lệnh trang trí đã chạy (lớp gd-js) thì #gd-con thay dòng đếm cũ: con số ở thanh trên và ở đây không được
   lệch nhau (lô 5 câu mà đáy còn ghi "/12"). Dòng cũ vẫn nằm trong DOM, mã nộp vẫn ghi vào đó như trước. */
html.gd-m3.gd-js body #thanh-nop .nop-chu { display: none; }
html.gd-m3 body #thanh-nop .gd-con { flex: 1; min-width: 0; font-size: 14px; font-weight: 700; color: var(--gm-on-surface); }
html.gd-m3 body #thanh-nop .gd-con.ket { color: var(--gm-tertiary); }
html.gd-m3 body #thanh-nop .nop-ket { font-size: 13px; font-weight: 700; color: var(--gm-on-surface-v); }
html.gd-m3 body #thanh-nop .nop-loi { display: block; font-size: 12px; color: var(--gm-error); }
html.gd-m3 body #thanh-nop .nop-loi.luu { color: var(--gm-on-surface-v); }
html.gd-m3 body #thanh-nop .nut.nop {
  flex-shrink: 0; min-height: 52px; height: 52px; padding: 0 24px; border: 0; border-radius: 26px;
  background: var(--gm-primary); color: var(--gm-on-primary); font-size: 15px; font-weight: 700;
  box-shadow: var(--gm-cao1); cursor: pointer;
}
html.gd-m3 body #thanh-nop .nut.nop[disabled] { opacity: .38; box-shadow: none; }

/* --- thanh điều khiển cũ (mở hết lời giải, lọc): thẻ tonal gọn, không viền không bóng --- */
html.gd-m3 body .thanh:not(#thanh-nop) {
  position: static; margin: 0 0 14px; padding: 8px 12px; gap: 8px;
  background: var(--gm-sc); border: 0; border-radius: 16px; box-shadow: none;
  -webkit-backdrop-filter: none; backdrop-filter: none;
}
html.gd-m3 body .thanh:not(#thanh-nop) .thanh-chu { font-size: 13px; color: var(--gm-on-surface-v); }
html.gd-m3 body .nut {
  min-height: 48px; border: 0; border-radius: 999px; padding: 0 18px; font-size: 14px; font-weight: 700;
  background: var(--gm-sc-high); color: var(--gm-primary); box-shadow: none;
}
html.gd-m3 body .nut.chinh, html.gd-m3 body .nut.dam { background: var(--gm-primary); color: var(--gm-on-primary); }

/* --- băng thông tin đầu phiếu --- */
html.gd-m3 body .nhac-phieu {
  margin: 0 0 12px; padding: 12px 16px; border: 0; border-radius: 16px;
  background: var(--gm-secondary-c); color: var(--gm-on-secondary-c); font-size: 14px; line-height: 1.5;
}
html.gd-m3 body .nhac-phieu b { color: var(--gm-on-secondary-c); }
html.gd-m3 body .thanh-phan-tang-btvn {
  margin: 0 0 14px; padding: 12px 14px; border: 0; border-radius: 16px;
  background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); font-size: 13px; line-height: 1.45;
}
html.gd-m3 body .thanh-phan-tang-btvn .tpt-sao { display: none; }
html.gd-m3 body .tpt-nut-mo {
  min-height: 48px; padding: 0 14px; border: 0; border-radius: 24px; background: transparent;
  color: var(--gm-on-tertiary-c); font-size: 13px; font-weight: 700; cursor: pointer;
}
html.gd-m3 body .giai-khoa {
  margin: 0 0 12px; padding: 12px 16px; border-radius: 16px; background: var(--gm-sc-high);
  color: var(--gm-on-surface-v); font-size: 13px; font-weight: 600;
}

/* --- thẻ câu: tonal, không viền, bo 20 --- */
html.gd-m3 body .ds-cau { gap: 14px; }
html.gd-m3 body .q-card {
  background: var(--gm-sc); border: 0; border-radius: 20px; box-shadow: none; overflow: visible;
  transition: box-shadow .12s;
}
html.gd-m3 body .q-card:hover { box-shadow: none; }
html.gd-m3 body .q-card:focus-within { box-shadow: inset 0 0 0 2px var(--gm-primary); }
html.gd-m3 body .q-card.mo, html.gd-m3 body .q-card.la-chua, html.gd-m3 body .q-card.la-chua.mo { border-left: 0; }
html.gd-m3 body .q-card.q-card-active { border-left: 0 !important; box-shadow: none; }
html.gd-m3 body .q-card.q-card-active:focus-within { box-shadow: inset 0 0 0 2px var(--gm-primary); }
html.gd-m3 body.chi-de .q-card { border-left: 0 !important; }
html.gd-m3 body .q-header { padding: 16px 16px 0; align-items: center; gap: 10px; }
html.gd-m3 body .q-num {
  position: relative; width: 30px; height: 30px; border-radius: 50%; background: transparent; box-shadow: inset 0 0 0 1.5px var(--gm-outline);
  color: var(--gm-on-surface-v); font-size: 13px; font-weight: 700;
}
/* Đã làm xong câu: vòng số đổi thành dấu tích. Lớp gd-da-lam do mã lệnh trang trí gắn (không phụ thuộc :has). */
html.gd-m3 body .q-card.gd-da-lam .q-num, html.gd-m3 body .q-card.cau-dung .q-num {
  background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); box-shadow: none;
}
html.gd-m3 body .q-card.gd-da-lam .q-num .ky, html.gd-m3 body .q-card.cau-dung .q-num .ky, html.gd-m3 body .q-card.cau-sai .q-num .ky { font-size: 0; }
html.gd-m3 body .q-card.gd-da-lam .q-num::after, html.gd-m3 body .q-card.cau-dung .q-num::after {
  content: ''; position: absolute; width: 16px; height: 16px; background: currentColor;
  -webkit-mask: var(--gm-i-check) center / contain no-repeat; mask: var(--gm-i-check) center / contain no-repeat;
}
html.gd-m3 body .q-card.cau-sai .q-num { background: var(--gm-error-c); color: var(--gm-on-error-c); box-shadow: none; }
html.gd-m3 body .q-card.cau-sai .q-num::after {
  content: ''; position: absolute; width: 16px; height: 16px; background: currentColor;
  -webkit-mask: var(--gm-i-x) center / contain no-repeat; mask: var(--gm-i-x) center / contain no-repeat;
}
/* nhãn: chip tonal */
html.gd-m3 body .q-tags { gap: 6px; }
html.gd-m3 body .q-tag {
  padding: 3px 9px; border: 0; border-radius: 999px; box-shadow: none; letter-spacing: 0;
  background: var(--gm-sc-high); color: var(--gm-on-surface-v); font-size: 11px; font-weight: 600;
}
html.gd-m3 body .q-tag::before { display: none; }
html.gd-m3 body .q-tag.type-mc, html.gd-m3 body .q-tag.type-tf, html.gd-m3 body .q-tag.type-sa { background: var(--gm-secondary-c); color: var(--gm-on-secondary-c); }
html.gd-m3 body .q-tag.vong-1, html.gd-m3 body .q-tag.level-1 { background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); }
html.gd-m3 body .q-tag.vong-2, html.gd-m3 body .q-tag.level-2, html.gd-m3 body .q-tag.level-3 { background: var(--gm-sc-high); color: var(--gm-on-surface-v); }
html.gd-m3 body .q-tag.vong-3, html.gd-m3 body .q-tag.sai-cua-em { background: var(--gm-error-c); color: var(--gm-on-error-c); }
html.gd-m3 body .q-tag.chua, html.gd-m3 body .q-tag.chua-2 { background: var(--gm-secondary-c); color: var(--gm-on-secondary-c); }
html.gd-m3 body .q-tag.muc-tieu-hom-nay-tag { background: var(--gm-primary-c); color: var(--gm-on-primary-c) !important; box-shadow: none; }
html.gd-m3 body .q-tag.topic { background: var(--gm-sc-high); color: var(--gm-on-surface-v); white-space: normal; }
html.gd-m3 body .q-text { font-size: 16px; line-height: 1.55; color: var(--gm-on-surface); }
html.gd-m3 body .lam-lai { border-radius: 12px; background: var(--gm-sc-high); color: var(--gm-on-surface); }

/* --- phương án Phần I: hàng chọn M3 --- */
html.gd-m3 body .q-options, html.gd-m3 body .q-options.single-col { grid-template-columns: 1fr; gap: 8px; margin-top: 12px; }
html.gd-m3 body .q-opt {
  min-height: 52px; padding: 8px 14px; gap: 12px; border: 0; border-radius: 14px;
  background: var(--gm-lowest); color: var(--gm-on-surface); font-size: 15px; font-weight: 500; text-align: left;
  box-shadow: inset 0 0 0 1px var(--gm-outline-v); transition: background-color .12s, box-shadow .12s;
}
html.gd-m3 body .q-opt-letter {
  position: relative; width: 30px; height: 30px; background: transparent; color: var(--gm-on-surface-v);
  box-shadow: inset 0 0 0 1.5px var(--gm-outline); font-size: 13px; font-weight: 700;
}
html.gd-m3 body .q-opt.lam-o:active { background: var(--gm-sc-high); }
html.gd-m3 body .lam-o:focus-visible { outline: 3px solid var(--gm-primary); outline-offset: 2px; }
/* Ô EM ĐANG CHỌN: một kiểu duy nhất, đúng hay sai chưa nói gì (giữ luật giấu đáp án). */
html.gd-m3 body .q-opt.lam-o[aria-checked="true"],
html.gd-m3 body.co-lam.chua-nop .q-opt.lam-o[aria-checked="true"],
html.gd-m3 body.co-lam.chi-de .q-opt.lam-o[aria-checked="true"] {
  background: var(--gm-primary-c) !important; color: var(--gm-on-primary-c) !important; font-weight: 600 !important;
  border-color: transparent !important; box-shadow: inset 0 0 0 2px var(--gm-primary) !important;
}
html.gd-m3 body .q-opt.lam-o[aria-checked="true"] .q-opt-letter,
html.gd-m3 body.co-lam.chua-nop .q-opt.lam-o[aria-checked="true"] .q-opt-letter,
html.gd-m3 body.co-lam.chi-de .q-opt.lam-o[aria-checked="true"] .q-opt-letter {
  background: var(--gm-primary) !important; color: var(--gm-on-primary) !important; box-shadow: none !important; font-size: 0;
}
html.gd-m3 body .q-opt.lam-o[aria-checked="true"] .q-opt-letter .ky { font-size: 0; }
html.gd-m3 body .q-opt.lam-o[aria-checked="true"] .q-opt-letter::after {
  content: ''; position: absolute; width: 16px; height: 16px; background: currentColor;
  -webkit-mask: var(--gm-i-check) center / contain no-repeat; mask: var(--gm-i-check) center / contain no-repeat;
}
/* Sau khi mã lệnh cho lộ đáp án (lớp dung/sai chỉ có trong DOM lúc ấy). */
html.gd-m3 body .q-card.mo .q-opt.dung, html.gd-m3 body .q-opt.dung {
  background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); border-color: transparent; box-shadow: inset 0 0 0 1.5px var(--gm-tertiary); font-weight: 700;
}
html.gd-m3 body .q-card.mo .q-opt.dung .q-opt-letter, html.gd-m3 body .q-opt.dung .q-opt-letter {
  background: var(--gm-tertiary); color: var(--gm-surface); box-shadow: none;
}
html.gd-m3 body .q-card.mo .q-opt.sai, html.gd-m3 body .q-opt.sai, html.gd-m3 body .q-card.da-cham .q-opt.sai {
  background: var(--gm-error-c); color: var(--gm-on-error-c); border-color: transparent; box-shadow: inset 0 0 0 1.5px var(--gm-error); font-weight: 700;
}
html.gd-m3 body .q-card.mo .q-opt.sai .q-opt-letter, html.gd-m3 body .q-opt.sai .q-opt-letter, html.gd-m3 body .q-card.da-cham .q-opt.sai .q-opt-letter {
  background: var(--gm-error); color: var(--gm-surface); box-shadow: none;
}

/* --- Phần II: hàng ý + nút phân đoạn Đ | S --- */
html.gd-m3 body .tf-item, html.gd-m3 body.co-lam .tf-item {
  min-height: 52px; padding: 6px 8px 6px 14px; gap: 10px; border-radius: 14px; background: var(--gm-lowest);
}
html.gd-m3 body .q-card.mo .tf-item { background: var(--gm-lowest); }
html.gd-m3 body .tf-statement { font-size: 14px; line-height: 1.45; color: var(--gm-on-surface); }
html.gd-m3 body .tf-o, html.gd-m3 body.co-lam .tf-o {
  gap: 0; overflow: hidden; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--gm-outline);
}
html.gd-m3 body .tf-badge, html.gd-m3 body.co-lam .tf-badge {
  width: 52px; height: 48px; border: 0; border-radius: 0; box-shadow: none; background: transparent;
  color: var(--gm-on-surface-v); font-size: 14px; font-weight: 600;
}
html.gd-m3 body .tf-badge.s, html.gd-m3 body.co-lam .tf-badge.s { box-shadow: inset 1px 0 0 var(--gm-outline); }
html.gd-m3 body.co-lam .tf-badge.lam-o::after { inset: 0; border-radius: 0; }
html.gd-m3 body .tf-badge.lam-o:active { background: var(--gm-sc-high); }
html.gd-m3 body .tf-badge.lam-o[aria-checked="true"],
html.gd-m3 body.co-lam.chua-nop .tf-badge.lam-o[aria-checked="true"],
html.gd-m3 body.co-lam.chi-de .tf-badge.lam-o[aria-checked="true"] {
  background: var(--gm-secondary-c) !important; color: var(--gm-on-secondary-c) !important; font-weight: 700 !important; border-color: transparent !important;
}
html.gd-m3 body .q-card.mo .tf-badge.d.dung { background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); border-color: transparent; }
html.gd-m3 body .q-card.mo .tf-badge.s.dung { background: var(--gm-error-c); color: var(--gm-on-error-c); border-color: transparent; }

/* --- Phần III: ô nhập outlined --- */
html.gd-m3 body .sa-vung { min-height: 56px; }
html.gd-m3 body .lam-nhap {
  width: 100%; max-width: none; height: 56px; padding: 0 16px; border: 0; border-radius: 12px; background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--gm-outline); color: var(--gm-on-surface); font-size: 18px; font-weight: 600;
}
html.gd-m3 body .lam-nhap::placeholder { color: var(--gm-on-surface-v); font-weight: 500; }
html.gd-m3 body .lam-nhap-khoi { max-width: none; }
html.gd-m3 body .lam-nut { min-width: 48px; height: 56px; border: 0; border-radius: 12px; background: transparent; box-shadow: inset 0 0 0 1.5px var(--gm-outline); color: var(--gm-on-surface); font-size: 22px; }
html.gd-m3 body .lam-nut:focus-visible { outline: 3px solid var(--gm-primary); }
html.gd-m3 body .lam-nhap:focus { outline: none; box-shadow: inset 0 0 0 2px var(--gm-primary); }
html.gd-m3 body .sa-blank { border-radius: 12px; }
html.gd-m3 body .sa-answer { background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); border-radius: 12px; }

/* --- câu thuộc lô sau: mờ 38% + khoá --- */
html.gd-m3 body .q-card.q-card-dimmed, html.gd-m3 body .q-card.q-card-dimmed:hover, html.gd-m3 body .q-card.q-card-dimmed:focus-within { opacity: .38; filter: none; }
html.gd-m3 body .dimmed-pacing-banner {
  padding: 0; border: 0; border-radius: 0; background: transparent; color: var(--gm-on-surface-v); font-size: 14px; font-weight: 500;
}
html.gd-m3 body .dimmed-lock-icon svg { display: none; }
html.gd-m3 body .dimmed-lock-icon {
  display: inline-block; width: 18px; height: 18px; font-size: 0; flex-shrink: 0; background: currentColor;
  -webkit-mask: var(--gm-i-khoa) center / contain no-repeat; mask: var(--gm-i-khoa) center / contain no-repeat;
}

/* --- kết quả sau nộp trên từng thẻ --- */
html.gd-m3 body .lam-ket {
  display: inline-flex; margin-top: 10px; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;
}
html.gd-m3 body .q-card.cau-dung .lam-ket { background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); }
html.gd-m3 body .q-card.cau-sai .lam-ket { background: var(--gm-error-c); color: var(--gm-on-error-c); }

/* --- lời giải: khung bao ngoài đổi, NỘI DUNG bên trong giữ nguyên --- */
html.gd-m3 body .q-nut-giai {
  min-height: 48px; border: 0; border-top: 0; background: transparent; color: var(--gm-primary); font-size: 14px; font-weight: 700;
}
/* Khung nằm ở .sol-box (không ở .sol-inner: ô lưới đang đóng 0fr mà .sol-inner có đệm thì vẫn chừa khoảng trống). */
/* Giữ nguyên bản màu vàng chuẩn cho M3 như yêu cầu
html.gd-m3 body .sol-box {
  margin: 0 16px 16px; padding: 16px; border: 0; border-radius: 16px; box-shadow: none;
  background: var(--gm-sc-high); color: var(--gm-on-surface);
}
html.gd-m3 body .sol-label { color: var(--gm-on-surface-v); }
html.gd-m3 body .sol-dap, html.gd-m3 body .sol-dap b, html.gd-m3 body .sol-text, html.gd-m3 body .sol-text strong,
html.gd-m3 body .sol-cot-loi, html.gd-m3 body .sol-pa, html.gd-m3 body .sol-pa strong, html.gd-m3 body .sol-step,
html.gd-m3 body .sol-ket { color: var(--gm-on-surface); }
html.gd-m3 body .sol-pa + .sol-pa { border-top-color: var(--gm-outline-v); }
html.gd-m3 body .sol-pa.chon { color: var(--gm-tertiary); }
*/
html.gd-m3 body .sol-anh img { border: 0; }

/* --- hộp xác nhận nộp bài (thay window.confirm; mã lệnh chỉ hiện khi còn câu chưa làm) --- */
html.gd-m3 body .gd-hop-nen { position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,.5); }
html.gd-m3 body .gd-hop {
  position: fixed; z-index: 81; left: 50%; top: 50%; transform: translate(-50%, -50%); box-sizing: border-box;
  width: min(340px, calc(100vw - 48px)); padding: 24px 24px 16px; border-radius: 28px;
  background: var(--gm-sc-high); color: var(--gm-on-surface); box-shadow: 0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3);
  animation: gd-hop-vao .18s cubic-bezier(.2,0,0,1) 1;
}
@keyframes gd-hop-vao { 0% { opacity: 0; transform: translate(-50%, -48%) scale(.96); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
html.gd-m3 body .gd-hop:focus { outline: none; }
html.gd-m3 body .gd-hop-tieu { font-size: 22px; line-height: 28px; font-weight: 700; margin: 0 0 12px; }
html.gd-m3 body .gd-hop-nd { font-size: 15px; line-height: 22px; color: var(--gm-on-surface-v); }
html.gd-m3 body .gd-hop-nut { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
html.gd-m3 body .gd-hop-nut button {
  min-height: 48px; padding: 0 20px; border: 0; border-radius: 24px; cursor: pointer; font: inherit; font-size: 14px; font-weight: 700;
}
html.gd-m3 body .gd-hop-huy { background: transparent; color: var(--gm-primary); }
html.gd-m3 body .gd-hop-ok { background: var(--gm-primary); color: var(--gm-on-primary); }
html.gd-m3 body .gd-hop-nut button:focus-visible { outline: 3px solid var(--gm-primary); outline-offset: 2px; }

/* --- lưới số câu (tấm trượt từ dưới) --- */
html.gd-m3 body .gd-luoi-nen { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.5); }
html.gd-m3 body .gd-luoi-nen[hidden], html.gd-m3 body .gd-luoi[hidden] { display: none; }
html.gd-m3 body .gd-luoi {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 61; box-sizing: border-box; max-height: 72vh; overflow: auto;
  padding: 12px 16px calc(24px + env(safe-area-inset-bottom)); border-radius: 28px 28px 0 0;
  background: var(--gm-sc); color: var(--gm-on-surface); box-shadow: var(--gm-cao-tren);
  display: flex; flex-direction: column; gap: 14px;
}
html.gd-m3 body .gd-luoi-cam { width: 32px; height: 4px; border-radius: 999px; background: var(--gm-outline); align-self: center; }
html.gd-m3 body .gd-luoi-dau { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
html.gd-m3 body .gd-luoi-dau b { font-size: 16px; }
html.gd-m3 body .gd-luoi-dau span { font-size: 12px; color: var(--gm-on-surface-v); }
html.gd-m3 body .gd-luoi-o { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
html.gd-m3 body .gd-o {
  height: 48px; padding: 0; border: 0; border-radius: 14px; cursor: pointer; background: transparent;
  color: var(--gm-on-surface-v); box-shadow: inset 0 0 0 1px var(--gm-outline-v); font: inherit; font-size: 14px; font-weight: 600;
}
html.gd-m3 body .gd-o.da { background: var(--gm-primary-c); color: var(--gm-on-primary-c); box-shadow: none; font-weight: 700; }
html.gd-m3 body .gd-o.dang { background: var(--gm-primary); color: var(--gm-on-primary); box-shadow: none; font-weight: 700; }
html.gd-m3 body .gd-o[disabled] { opacity: .38; cursor: default; }
html.gd-m3 body .gd-o:focus-visible, html.gd-m3 body .gd-nut-luoi:focus-visible { outline: 3px solid var(--gm-primary); outline-offset: 2px; }
html.gd-m3 body .gd-chu-thich { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--gm-on-surface-v); }
html.gd-m3 body .gd-chu-thich i { display: inline-block; width: 12px; height: 12px; margin-right: 6px; vertical-align: -1px; border-radius: 4px; box-shadow: inset 0 0 0 1px var(--gm-outline); }
html.gd-m3 body .gd-chu-thich i.da { background: var(--gm-primary-c); box-shadow: none; }
html.gd-m3 body .gd-chu-thich i.dang { background: var(--gm-primary); box-shadow: none; }

@media (prefers-reduced-motion: reduce) {
  html.gd-m3 body *, html.gd-m3 body *::before, html.gd-m3 body *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
}
`

/** Mã lệnh TRANG TRÍ của phiếu M3 (thanh tiến độ, lời khích lệ, lưới số câu). Chạy trong một thẻ <script> RIÊNG,
 * bọc try/catch: lỗi ở đây không bao giờ chạm tới luồng chọn/lưu/nộp của `JS_PHIEU`. Không ghi đáp án, không gọi mạng. */
export const JS_PHIEU_M3 = `
(function () {
  try {
    var tren = document.getElementById('gd-tren');
    if (!tren) return;
    var dem = document.getElementById('gd-dem');
    var tong = document.getElementById('gd-tong');
    var thanh = tren.querySelector('.gd-tien');
    var khich = document.getElementById('gd-khich');
    var nutLuoi = document.getElementById('gd-nut-luoi');
    var giam = false;
    try { giam = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
    var coLo = !!document.getElementById('thanh-phan-tang-btvn');
    var daXongTruoc = false;
    // Đáy phiếu: #gd-con thay dòng đếm cũ (lô 5 câu mà đáy còn ghi "/12" là hai con số lệch nhau).
    var thanhNop = document.getElementById('thanh-nop');
    var oKet = document.getElementById('nop-ket');
    var con = null;
    if (thanhNop && thanhNop.querySelector('.nop-chu')) {
      con = document.createElement('div');
      con.className = 'gd-con';
      con.id = 'gd-con';
      thanhNop.insertBefore(con, thanhNop.firstChild);
      document.documentElement.classList.add('gd-js');
    }

    function cacThe() { return Array.prototype.slice.call(document.querySelectorAll('.q-card[data-qid]')); }
    function biKhoa(the) { return the.classList.contains('q-card-dimmed'); }
    function daLam(the) {
      var hangY = the.querySelectorAll('.tf-item[data-y]');
      if (hangY.length) {
        for (var i = 0; i < hangY.length; i++) { if (!hangY[i].querySelector('[aria-checked="true"]')) return false; }
        return true;
      }
      var nhap = the.querySelector('.lam-nhap');
      if (nhap) return String(nhap.value || '').trim() !== '';
      return !!the.querySelector('.q-opt[aria-checked="true"]');
    }
    function capNhat() {
      try {
        var ds = cacThe(), t = 0, l = 0;
        for (var i = 0; i < ds.length; i++) {
          var lam = daLam(ds[i]);
          if (ds[i].classList.contains('gd-da-lam') !== lam) ds[i].classList.toggle('gd-da-lam', lam);
          if (biKhoa(ds[i]) || ds[i].classList.contains('q-card-thu-suc')) continue;
          t++;
          if (lam) l++;
        }
        var pct = t > 0 ? Math.round((l * 100) / t) : 0;
        if (dem) dem.textContent = String(l);
        if (tong) tong.textContent = String(t);
        tren.style.setProperty('--gd-tien', pct + '%');
        if (thanh) thanh.setAttribute('aria-valuenow', String(pct));
        var xong = t > 0 && l >= t;
        var chu = '';
        if (xong) chu = coLo ? 'Xong chặng hôm nay' : 'Đã làm hết các câu';
        else if (pct >= 50) chu = 'Được nửa đường rồi';
        if (khich) {
          if (chu) { khich.textContent = chu; khich.hidden = false; } else { khich.hidden = true; }
        }
        document.body.classList.toggle('gd-xong', xong);
        if (con) {
          var chuKet = oKet && !oKet.hidden ? String(oKet.textContent || '').replace(/^[ ·]+/, '').trim() : '';
          var daNop = chuKet !== '';
          var chuCon = daNop ? chuKet : (t - l > 0 ? 'Còn ' + (t - l) + ' câu chưa làm' : 'Đã làm hết các câu');
          if (con.textContent !== chuCon) con.textContent = chuCon;
          con.classList.toggle('ket', daNop);
        }
        if (xong && !daXongTruoc && !giam) {
          document.body.classList.add('gd-vua-xong');
          setTimeout(function () { document.body.classList.remove('gd-vua-xong'); }, 500);
        }
        daXongTruoc = xong;
      } catch (e) {}
    }

    var dsEl = document.querySelector('.ds-cau');
    document.addEventListener('click', function () { setTimeout(capNhat, 0); }, true);
    document.addEventListener('input', capNhat, true);
    document.addEventListener('change', capNhat, true);
    if (window.MutationObserver && dsEl) {
      new MutationObserver(capNhat).observe(dsEl, { attributes: true, subtree: true, attributeFilter: ['aria-checked'] });
    }
    if (window.MutationObserver && oKet) {
      new MutationObserver(capNhat).observe(oKet, { attributes: true, childList: true, characterData: true, subtree: true });
    }
    // Cuộn xuống quá 120px thì thu gọn thanh trên; về gần đầu trang hoặc cuộn ngược thì mở lại.
    var yCu = 0, gon = false, cho = false;
    function khiCuon() {
      if (cho) return;
      cho = true;
      (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () {
        cho = false;
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        var xuong = y > yCu + 6, len = y < yCu - 6;
        var muon = gon;
        if (y < 40 || len) muon = false; else if (y > 120 && xuong) muon = true;
        if (muon !== gon) { gon = muon; tren.classList.toggle('gd-gon', gon); }
        if (Math.abs(y - yCu) > 6) yCu = y;
      });
    }
    window.addEventListener('scroll', khiCuon, { passive: true });
    // Đo chiều cao thật của thanh trên (lúc đang mở rộng) để .khung chừa đúng chỗ.
    function doCao() {
      try {
        if (gon) return;
        var h = tren.offsetHeight;
        if (h > 40) document.documentElement.style.setProperty('--gd-cao', h + 'px');
      } catch (e) {}
    }
    doCao();
    setTimeout(doCao, 300);
    window.addEventListener('resize', doCao);
    window.addEventListener('load', doCao);
    capNhat();
    setTimeout(capNhat, 400);

    // ---- lưới số câu: tấm trượt từ dưới; chỉ để nhảy tới câu, KHÔNG đổi đáp án ----
    var luoiNen = null, luoiHop = null;
    function dongLuoi() {
      if (luoiNen && luoiNen.parentNode) luoiNen.parentNode.removeChild(luoiNen);
      if (luoiHop && luoiHop.parentNode) luoiHop.parentNode.removeChild(luoiHop);
      luoiNen = luoiHop = null;
      document.removeEventListener('keydown', phim, true);
      if (nutLuoi) { nutLuoi.setAttribute('aria-expanded', 'false'); try { nutLuoi.focus(); } catch (e) {} }
    }
    function phim(e) { if (e.key === 'Escape') { e.stopPropagation(); dongLuoi(); } }
    function moLuoi() {
      if (luoiHop) { dongLuoi(); return; }
      var ds = cacThe();
      var dang = -1;
      for (var i = 0; i < ds.length; i++) {
        if (biKhoa(ds[i])) continue;
        if (ds[i].getBoundingClientRect().bottom > 140) { dang = i; break; }
      }
      luoiNen = document.createElement('div');
      luoiNen.className = 'gd-luoi-nen';
      luoiNen.addEventListener('click', dongLuoi);
      luoiHop = document.createElement('div');
      luoiHop.className = 'gd-luoi';
      luoiHop.setAttribute('role', 'dialog');
      luoiHop.setAttribute('aria-modal', 'true');
      luoiHop.setAttribute('aria-label', 'Lưới số câu');
      luoiHop.tabIndex = -1;
      var cam = document.createElement('div'); cam.className = 'gd-luoi-cam'; luoiHop.appendChild(cam);
      var dau = document.createElement('div'); dau.className = 'gd-luoi-dau';
      var tieu = document.createElement('b'); tieu.textContent = 'Lưới số câu';
      var dem2 = document.createElement('span'); dem2.textContent = ds.length + ' câu';
      dau.appendChild(tieu); dau.appendChild(dem2); luoiHop.appendChild(dau);
      var luoi = document.createElement('div'); luoi.className = 'gd-luoi-o';
      var dau1 = null;
      for (var j = 0; j < ds.length; j++) {
        (function (k) {
          var b = document.createElement('button');
          b.type = 'button';
          var khoa = biKhoa(ds[k]);
          var lam = ds[k].classList.contains('gd-da-lam');
          b.className = 'gd-o' + (k === dang ? ' dang' : lam ? ' da' : '');
          b.textContent = String(k + 1);
          b.setAttribute('aria-label', 'Câu ' + (k + 1) + (khoa ? ', thuộc chặng sau, chưa mở' : lam ? ', đã làm' : ', chưa làm'));
          if (khoa) b.disabled = true;
          b.addEventListener('click', function () {
            dongLuoi();
            var el = ds[k];
            if (el.scrollIntoView) {
              try { el.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
            }
          });
          if (!dau1 && !khoa) dau1 = b;
          luoi.appendChild(b);
        })(j);
      }
      luoiHop.appendChild(luoi);
      var ct = document.createElement('div'); ct.className = 'gd-chu-thich';
      ct.innerHTML = '<span><i class="da"></i>Đã làm</span><span><i class="dang"></i>Đang xem</span><span><i></i>Chưa làm / chặng sau</span>';
      luoiHop.appendChild(ct);
      document.body.appendChild(luoiNen);
      document.body.appendChild(luoiHop);
      document.addEventListener('keydown', phim, true);
      if (nutLuoi) nutLuoi.setAttribute('aria-expanded', 'true');
      try { (dau1 || luoiHop).focus(); } catch (e) {}
    }
    if (nutLuoi) nutLuoi.addEventListener('click', moLuoi);
  } catch (e) {}

    // ---- HỘP XÁC NHẬN NỘP kiểu M3 (thay window.confirm, CÙNG ngữ nghĩa) ----
    // Không sửa một dòng nào của luồng nộp cũ. Cách làm: khi bấm Nộp, mã cũ vẫn chạy nguyên vẹn nhưng window.confirm bị
    // thay tạm bằng hàm chỉ GHI LẠI lời hỏi rồi trả false (= "Huỷ", mã cũ dừng, không đổi gì). Nếu có lời hỏi, hiện hộp M3
    // với ĐÚNG chuỗi ấy. Bấm "Nộp luôn" = bấm lại nút Nộp với confirm trả true, tức chính mã nộp cũ chạy tiếp; bấm "Xem lại"
    // hoặc Esc = không làm gì (nền mờ không làm gì cả). Dựng hộp lỗi thì hỏi lại bằng window.confirm gốc, cùng chuỗi cũ.
    try {
      var nutNop = document.getElementById('nut-nop');
      if (nutNop) {
        var loiHoi = null, confirmCu = null, hopNop = null, nenNop = null, dangMoHop = false, choQua = false, vungKhoa = [];
        var traConfirm = function () { if (confirmCu) { window.confirm = confirmCu; confirmCu = null; } };
        var ketThucBam = function () {
          traConfirm();
          if (loiHoi !== null) { var m = loiHoi; loiHoi = null; hienHop(m); }
        };
        var nopLai = function () {
          choQua = true;
          var g = window.confirm;
          window.confirm = function () { return true; };
          try { nutNop.click(); } finally { window.confirm = g; choQua = false; }
        };
        var dongHop = function (traTieuDiem) {
          document.removeEventListener('keydown', phimHop, true);
          if (hopNop && hopNop.parentNode) hopNop.parentNode.removeChild(hopNop);
          if (nenNop && nenNop.parentNode) nenNop.parentNode.removeChild(nenNop);
          hopNop = nenNop = null;
          for (var i = 0; i < vungKhoa.length; i++) { try { vungKhoa[i].removeAttribute('inert'); } catch (e2) {} }
          vungKhoa = [];
          dangMoHop = false;
          if (traTieuDiem) { try { nutNop.focus(); } catch (e3) {} }
        };
        var phimHop = function (e) {
          if (!hopNop) return;
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dongHop(true); return; }
          if (e.key === 'Tab') {
            var nut = hopNop.querySelectorAll('button');
            if (!nut.length) return;
            var dau = nut[0], cuoi = nut[nut.length - 1];
            if (!hopNop.contains(document.activeElement)) { e.preventDefault(); dau.focus(); }
            else if (e.shiftKey && document.activeElement === dau) { e.preventDefault(); cuoi.focus(); }
            else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau.focus(); }
          }
        };
        var hienHop = function (loi) {
          try {
            nenNop = document.createElement('div');
            nenNop.className = 'gd-hop-nen';
            // Nền mờ KHÔNG đóng hộp (như window.confirm: chỉ "Xem lại", "Nộp luôn" hoặc Esc mới quyết định). Bấm đúp vào
            // Nộp thì cú bấm thứ hai rơi trúng nền mờ: nếu nền đóng hộp thì hộp vừa mở đã biến mất.
            hopNop = document.createElement('div');
            hopNop.className = 'gd-hop';
            hopNop.setAttribute('role', 'alertdialog');
            hopNop.setAttribute('aria-modal', 'true');
            hopNop.setAttribute('aria-labelledby', 'gd-hop-tieu');
            hopNop.setAttribute('aria-describedby', 'gd-hop-nd');
            hopNop.tabIndex = -1;
            var tieu = document.createElement('div'); tieu.className = 'gd-hop-tieu'; tieu.id = 'gd-hop-tieu'; tieu.textContent = 'Nộp bài?';
            var nd = document.createElement('div'); nd.className = 'gd-hop-nd'; nd.id = 'gd-hop-nd'; nd.textContent = loi;
            var hang = document.createElement('div'); hang.className = 'gd-hop-nut';
            var huy = document.createElement('button'); huy.type = 'button'; huy.className = 'gd-hop-huy'; huy.textContent = 'Xem lại';
            var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'gd-hop-ok'; ok.textContent = 'Nộp luôn';
            huy.addEventListener('click', function () { dongHop(true); });
            ok.addEventListener('click', function () { dongHop(false); nopLai(); });
            hang.appendChild(huy); hang.appendChild(ok);
            hopNop.appendChild(tieu); hopNop.appendChild(nd); hopNop.appendChild(hang);
            document.body.appendChild(nenNop);
            document.body.appendChild(hopNop);
            dangMoHop = true;
            var khoa = document.querySelectorAll('.khung, #gd-tren, #thanh-nop');
            for (var i = 0; i < khoa.length; i++) { try { khoa[i].setAttribute('inert', ''); vungKhoa.push(khoa[i]); } catch (e4) {} }
            document.addEventListener('keydown', phimHop, true);
            try { huy.focus(); } catch (e5) {}
          } catch (eDung) {
            dongHop(false);
            // Không dựng được hộp: hỏi bằng confirm gốc, ĐÚNG chuỗi cũ, cùng ngữ nghĩa.
            // (hoãn một nhịp: click() lồng trong chính lượt bấm đang chạy trên cùng nút bị trình duyệt bỏ qua)
            if (window.confirm(loi)) setTimeout(nopLai, 0);
          }
        };
        document.addEventListener('click', function (e) {
          try {
            var t = e.target;
            if (!t || !nutNop.contains(t)) return;
            if (dangMoHop) { e.stopImmediatePropagation(); e.preventDefault(); return; }
            if (choQua) return;
            loiHoi = null;
            traConfirm();
            confirmCu = window.confirm;
            window.confirm = function (m) { loiHoi = String(m); return false; };
            setTimeout(ketThucBam, 0);
          } catch (eBam) { traConfirm(); }
        }, true);
        document.addEventListener('click', function (e) {
          try { if (e.target && nutNop.contains(e.target)) ketThucBam(); } catch (eSau) { traConfirm(); }
        }, false);
      }
    } catch (eHopNop) {}
})();
`

/** Thanh trên dính của phiếu M3: tên bài + "Đã làm X/N câu" + tiến độ + nút lưới số câu. Số liệu do JS_PHIEU_M3 cập nhật. */
export function dauTrangM3Html(tieuDe: string, tong: number, han = '', tienTo = ''): string {
  return `<header class="gd-tren" id="gd-tren">
  <div class="gd-tren-trong">
    <div class="gd-tren-hang">
      <div class="gd-tren-chu"><div class="gd-hang-tieu"><div class="gd-tieu-de">${thoat(tieuDe)}</div>${han ? `<div class="gd-han">Hạn ${thoat(han)}</div>` : ''}</div><div class="gd-phu-hang"><span class="gd-phu">${tienTo ? thoat(tienTo) : ''}Đã làm <b id="gd-dem">0</b>/<span id="gd-tong">${tong}</span> câu</span><span class="gd-khich" id="gd-khich" hidden></span></div></div>
      <button type="button" class="gd-nut-luoi" id="gd-nut-luoi" aria-label="Mở lưới số câu" aria-haspopup="dialog" aria-expanded="false"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></button>
    </div>
    <div class="gd-tien" role="progressbar" aria-label="Tiến độ làm bài" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="gd-tien-day"></div></div>
  </div>
</header>`
}

/** Tài liệu HTML hoàn chỉnh, tự chứa — mở bằng một chạm, không cần mạng. */
export function taiLieuHtml(than: string, tieuDe: string, lopBody = '', m3 = false, cssThem = ''): string {
  const isDark =
    typeof document !== 'undefined' &&
    (document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark')
  const bodyClass = [lopBody, isDark ? 'dark' : ''].filter(Boolean).join(' ')
  // Khối M3 chỉ có ở phiếu học sinh: cờ `m3` đặt lớp gd-m3 lên <html> (KHÔNG đụng lớp của <body>, nhiều bài kiểm
  // đang ghim đúng chuỗi `<body class="co-lam chua-nop">`). Mọi phiếu khác ra ĐÚNG như trước, từng byte.
  const htmlClass = [m3 ? 'gd-m3' : '', isDark ? 'dark' : ''].filter(Boolean).join(' ')
  return `<!DOCTYPE html>
<html lang="vi"${htmlClass ? ` class="${htmlClass}"` : ''}><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${thoat(tieuDe)}</title><style>${CSS_PHIEU}${m3 ? CSS_PHIEU_M3 : ''}${cssThem}</style></head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>${than}
<script>${JS_PHIEU}</script>${m3 ? `<script>${JS_PHIEU_M3}</script>` : ''}</body></html>`
}

/** DỰNG TRỌN PHIẾU: bìa · tổng quan · thanh điều khiển · danh sách câu.
 *
 * Không còn mục "Lời Giải Chi Tiết" riêng: lời giải nằm trong từng thẻ câu,
 * bấm vào câu là mở. Hàm thuần chuỗi, không cần trình duyệt để đo trang. */
/** BẢN CHỈ CÓ ĐỀ: xoá sạch đáp án, lời giải và ảnh lời giải khỏi DỮ LIỆU trước
 * khi dựng. Không giấu bằng CSS — em tò mò bấm "xem mã nguồn" là thấy hết.
 * Đây là bản gửi cho con tự làm (link `~20d`). */
export function boLoiGiai(c: CauLuyen): CauLuyen {
  return { ...c, dapAn: '', chot: '', lyDo: null, buoc: null, ketQua: '', hinh: c.hinh?.filter((h) => h.viTri !== 'sau_loi_giai') }
}

export interface TuyChonPhieu {
  /** true = phiếu CHỈ CÓ ĐỀ (không đáp án, không lời giải, không nút mở). */
  anGiai?: boolean
  /** Câu sai chưa có câu chữa, để khối đầu phiếu nói lý do. */
  thieuChua?: { soCau: number; phan?: 'I' | 'II' | 'III'; tenDang: string; vi: string }[]
  /** PHIẾU NỘP ĐƯỢC (NOP-PHIEU-KHAC-PHUC). Thiếu ⇒ phiếu chỉ đọc như cũ, và
   * KHÔNG mọc thêm một byte nào — phiếu đã gửi đi vẫn y nguyên. */
  nop?: {
    /** Mã phiếu, để máy chủ biết bài này của phiếu nào. */
    ma: string
    legacyIds?: string[]
    /** SBD của em — máy chủ đối chiếu, không cho nộp hộ. */
    sbd: string
    /** Link Apps Script. Đây là link CÔNG KHAI, không kèm mã bí mật. */
    url: string
    cauHinh?: Partial<CauHinhNopKhacPhuc> | null
    banNhap?: Record<string, string> | null
  } | null
  /** MỘT DÒNG NÓI VÌ SAO phiếu mở ra ở dạng này — dựng ngay đầu phiếu.
   *
   * Bắt buộc phải nằm TRONG tài liệu: phiếu hiện trong lớp phủ toàn màn hình,
   * nên chữ đặt trên trang app bị che kín. Không có nó thì phiếu chỉ đọc trông
   * y hệt phiếu hỏng. */
  /** Mở sẵn tất cả lời giải ngay khi mở phiếu (tiện cho việc xem lại/review). */
  moSan?: boolean
  loiNhac?: string | null
  laBtvn?: boolean
  soCauSang?: number
  /** Chỉ số lô (0-based) đang mở — đi kèm `soCauSang` để báo đúng lô nào vừa
   * xong khi em điền đủ đáp án (xem `lich-lo-btvn.ts`). */
  chiSoLoHienTai?: number
  /** BTVN "NÂNG ĐỠ" (bài ca_nhan) — xem html-phieu-ca-nhan.ts. Thiếu ⇒ phiếu ra ĐÚNG như trước, từng byte.
   * Có ⇒ phiếu KHÔNG chấm tại chỗ (câu không có đáp án), nộp theo CHẶNG qua host, câu đã chấm hiện kết quả máy chủ. */
  caNhan?: {
    /** Chặng đang hiện (0-based) — host gửi kèm khi nộp chặng. */
    chiSo: number
    /** Câu ĐÃ CHẤM ở máy chủ: qid → đúng/sai + đáp án em đã nộp. */
    daCham: Record<string, { dung: boolean; chon: string }>
    dauBai: DauBaiCaNhanVao
    /** "Chặng 2 mở ngày mai." — rỗng thì bỏ. */
    ghiCho: string
    /** "Chặng 2/7 · " đứng trước "Đã làm x/y câu" ở thanh trên. */
    tienTo: string
    nutNop: string
    nutTat: boolean
    /** BẢN 1.2 — nhóm "Thử sức thêm" là chặng ẢO `chiSo = soChang`, NỘP RIÊNG bằng nút riêng ở cuối nhóm. Thiếu ⇒ không nút. */
    thuSuc?: { chiSo: number; nut: string; tat: boolean }
  } | null
}

export function dungPhieu(t: ThongTinPhieu, cauVao: CauLuyen[], tuyChon: TuyChonPhieu = {}): string {
  // `thieuChua` đi kèm phiếu để khối đầu phiếu nói được câu sai nào chưa có câu
  // chữa — im lặng bỏ qua là thầy tưởng phiếu đã chữa hết.
  const anGiai = !!tuyChon.anGiai
  const caNhan = tuyChon.caNhan ?? null
  const laBtvn = !caNhan && Boolean(tuyChon.laBtvn || t.nhanBia === 'BÀI TẬP VỀ NHÀ' || t.tenChuyenDe === 'Bài tập về nhà')
  // PHIẾU NỘP ĐƯỢC: chỉ khi chỗ gọi khai `nop`, và không đi cùng `anGiai`
  // (phiếu chỉ có đề thì không có đáp án để chấm).
  const nop = !anGiai && tuyChon.nop ? tuyChon.nop : null
  const chNop = cauHinhNop(nop?.cauHinh)
  const cau = anGiai ? cauVao.map(boLoiGiai) : cauVao

  // Phân tầng BTVN: Nếu là BTVN và chưa nộp, tính số câu hiện sáng (mặc định Vòng 1: ~45% số câu)
  const soCauSang = typeof tuyChon.soCauSang === 'number'
    ? tuyChon.soCauSang
    : (laBtvn && !tuyChon.moSan && nop ? Math.max(4, Math.round(cau.length * 0.45)) : undefined)

  // GIAO DIỆN M3: phiếu học sinh làm/nộp (`nop`) hoặc phiếu học sinh chỉ đọc do chỗ gọi khai `giaoDienHocSinh`.
  // KHÔNG suy từ `laBtvn`/`anGiai`: hai cờ ấy còn dùng cho phiếu của giáo viên.
  const m3 = Boolean(nop || t.giaoDienHocSinh)
  // BẢN 1.2: nhóm "Thử sức thêm · không bắt buộc" nằm CUỐI danh sách (sau chặng cuối); tiêu đề nhóm đứng trước câu thử sức đầu tiên.
  // Câu thử sức KHÔNG tính vào "Đã làm x/y" và không chặn nút nộp. Không câu nào mang `thuSuc` ⇒ đúng như trước, từng byte.
  const soThuSuc = caNhan ? cau.filter((c) => c.caNhan?.thuSuc).length : 0
  const soBatBuoc = cau.length - soThuSuc
  const the = cau
    .map((c, i) => (caNhan && c.caNhan?.thuSuc && !cau.slice(0, i).some((x) => x.caNhan?.thuSuc) ? nhomThuSucHtml(soThuSuc) : '') + theCauHtml(c, i + 1, !!tuyChon.moSan, anGiai, !!nop, laBtvn, soCauSang))
    .join('\n') + (soThuSuc > 0 && caNhan?.thuSuc ? '\n' + nopThuSucHtml(caNhan.thuSuc.nut, caNhan.thuSuc.tat) : '')
  // KHOÁ LỜI GIẢI TỚI KHI NỘP. Chỉ áp cho phiếu nộp được và khi thầy không
  // bật `HIEN_GIAI_TRUOC_NOP`.
  const khoaGiai = !caNhan && !!nop && !chNop.HIEN_GIAI_TRUOC_NOP
  const coGiai = anGiai ? 0 : cau.filter((c) => oGiaiHtml(c) !== '').length
  const huongDan = anGiai
    ? 'Em làm vào vở rồi đối chiếu với link lời giải bố mẹ gửi sau. Muốn bản giấy thì bấm "In đề" rồi chọn "Lưu thành PDF".'
    : 'Bấm vào từng câu để xem lời giải. Muốn bản giấy thì bấm "In đề" (phát cho em tự làm) hoặc "In kèm lời giải", rồi chọn "Lưu thành PDF".'
  const nhac = (tuyChon.loiNhac ?? '').trim()

  const thanhPhanTang = (laBtvn && typeof soCauSang === 'number' && soCauSang < cau.length)
    ? `<div class="thanh-phan-tang-btvn" id="thanh-phan-tang-btvn">
        <div class="tpt-trai">
          <span class="tpt-sao">${ICO_SAO}</span>
          <span>Hôm nay em làm <b>${soCauSang}</b> câu sáng · <b>${cau.length - soCauSang}</b> câu còn lại mở dần theo ngày/giờ để tránh quá tải.</span>
        </div>
        <button type="button" class="tpt-nut-mo" id="nut-mo-het-cau">Hiện tất cả ${cau.length} câu</button>
      </div>`
    : ''

  const soCauLam = typeof soCauSang === 'number' && soCauSang < cau.length ? soCauSang : soBatBuoc
  const hanNop = String((t.oBia ?? []).find((o) => o.nhan === 'Hạn nộp')?.gia ?? '').trim().replace(/^—$/, '')
  const than = `${m3 && nop ? dauTrangM3Html(t.tenChuyenDe, soCauLam, hanNop, caNhan?.tienTo ?? '') : ''}${biaHtml(t, cau.length)}
<div class="khung">
  ${caNhan ? heroCaNhanHtml(caNhan.dauBai) + ghiChoHtml(caNhan.ghiCho) : nhac ? `<div class="nhac-phieu">${thoat(nhac)}</div>` : ''}
  ${khoiChuaGiHtml(cau, tuyChon.thieuChua ?? [])}
  ${caNhan ? '' : tongQuanHtml(cau, laBtvn)}
  ${thanhHtml(coGiai, anGiai)}
  ${nop ? thanhNopHtml(soBatBuoc, caNhan?.nutNop, caNhan?.nutTat) : ''}
  ${khoaGiai ? '<div class="giai-khoa" id="giai-khoa">Lời giải mở ra ngay sau khi em bấm Nộp bài.</div>' : ''}
  ${thanhPhanTang}
  ${!anGiai ? '<div class="ds-tieu-de">LỜI GIẢI CHI TIẾT TỪNG CÂU THEO CHUẨN HOÁ HỌC:</div>' : ''}
  <div class="ds-cau">${the}</div>
  <div class="chan">Thầy Đỗ Đại Học · ${thoat(t.tenChuyenDe)} · ${ngayVN(t.ngay)}<span class="chi-man"><br>${huongDan}</span></div>
</div>`
  const ai = t.oBia && t.oBia.length > 0 ? t.oBia[0].gia : t.hoTen
  // Dữ liệu nộp đi kèm tài liệu, KHÔNG gắn vào chuỗi JS bằng nối chuỗi: đáp án
  // và mã phiếu là dữ liệu, nhét thẳng vào mã là mở đường chèn mã lạ.
  // NGƯỠNG LÔ HIỆN TẠI (thay Vòng 1 — lich-lo-btvn.ts) — chính là `soCauSang`
  // chỗ gọi đã tính (một nguồn duy nhất, không suy luận lại ở đây): với lô
  // theo ngày/giờ, mỗi lần mở phiếu chỉ có ĐÚNG MỘT "màn" (không còn 3 màn
  // Vòng 1/2/3 chọn lại `soCauSang` khác nhau như trước), nên không cần công
  // thức cố định riêng nữa. Bằng hoặc lớn hơn tổng số câu thì không có gì để
  // "xong lô trước" — bỏ qua.
  const soCauMocLoChoNop = laBtvn && nop && typeof soCauSang === 'number' && soCauSang < cau.length ? soCauSang : undefined
  const goiNop = nop
    ? `<script type="application/json" id="du-nop">${JSON.stringify({
        ma: nop.ma,
        legacyIds: nop.legacyIds,
        sbd: nop.sbd,
        url: nop.url,
        ch: chNop,
        banNhap: nop.banNhap,
        soCauMocLo: soCauMocLoChoNop,
        chiSoLo: tuyChon.chiSoLoHienTai,
        caNhan: caNhan ? { chiSo: caNhan.chiSo, daCham: caNhan.daCham, ...(caNhan.thuSuc && soThuSuc > 0 ? { chiSoThuSuc: caNhan.thuSuc.chiSo } : {}) } : undefined,
        cau: cau.map((c) => (caNhan ? { id: c.id, phan: c.phan, ...(c.caNhan?.thuSuc ? { ts: 1 } : {}) } : { id: c.id, phan: c.phan, dapAn: c.dapAn })),
      }).replace(/</g, '\\u003c')}<\/script>`
    : ''
  // `co-lam` bật khổ ô Đ/S to bằng ngón tay. Tách khỏi `chua-nop` vì thầy có
  // thể bật HIEN_GIAI_TRUOC_NOP — lúc đó vẫn làm bài, chỉ là không khoá giải.
  const lopBody = [nop ? 'co-lam' : '', khoaGiai ? 'chua-nop' : '', caNhan ? 'ca-nhan' : ''].filter(Boolean).join(' ')
  return taiLieuHtml(than + goiNop, `${t.tenChuyenDe}${ai ? ` · ${ai}` : ''}`, lopBody, m3, caNhan ? CSS_PHIEU_CA_NHAN : '')
}

/** THANH NỘP — dính dưới thanh điều khiển, NOP-PHIEU-KHAC-PHUC mục 6. */
export function thanhNopHtml(soCau: number, nutChu = 'Nộp bài', tat = false): string {
  return `<div class="thanh" id="thanh-nop">
  <div class="nop-chu">Đã làm <b id="nop-dem">0</b>/<span id="nop-tong">${soCau}</span> câu<span id="nop-ket" class="nop-ket" hidden></span></div>
  <span id="nop-loi" class="nop-loi" hidden></span>
  <button class="nut nop" type="button" id="nut-nop"${tat ? ' disabled' : ''}>${nutChu}</button>
</div>`
}
