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
import { doanCongThuc, type DoanChu } from './chu-hoa-hoc-pdf'
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
// LỚP MÀU CHO MỨC ĐỘ VÀ PHẦN ĐÃ BỎ (PHIEU-BAI-TAP-V2 mục 3): sáu chip màu
// tranh nhau thì không màu nào còn nổi. Ba thứ đó nay là một dòng chữ xám.
const TEN_LOAI: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }

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
  return doanHtml(doanCongThuc(goKyTuLa(s)))
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
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 40px 22px 60px;
  color: #ffffff;
  background: linear-gradient(150deg, #0f3057 0%, #00587a 52%, #008891 100%);
}
/* BÌA KHÔNG CHIẾM TRỌN MÀN NỮA (thầy chốt 06/09: "trực quan, sạch, gọn").
   Bản cũ cao 100svh, chữ căn giữa, ba phân tử mờ nằm vắt chéo — mở phiếu ra
   phải cuộn hết một màn mới thấy câu đầu tiên. Nay bìa cao vừa đủ nội dung,
   chữ căn TRÁI như một tiêu đề tài liệu, và bỏ hẳn hoa văn phân tử. */
/* Quầng sáng trên bìa đã bỏ cùng với bìa cũ — nền tối phẳng. */
.cover-content { position: relative; z-index: 2; width: 100%; max-width: 700px; margin: 0 auto; }
.cover-badge {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 18px; padding: 7px 16px;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 999px;
  font-size: 11.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
}
/* Công thức đứng CẠNH nhãn, không chiếm một dòng khổng lồ giữa trang. */
.cover-badge .ct { letter-spacing: 0; text-transform: none; font-size: 13px; opacity: .92; }
.cover-title { font-size: clamp(28px, 7.4vw, 44px); font-weight: 900; line-height: 1.1; letter-spacing: -.02em; }
.cover-subtitle { margin-top: 8px; font-size: clamp(13.5px, 3vw, 16px); font-weight: 400; opacity: .82; }
/* LƯỚI chứ không phải flex-wrap: các ô luôn CÙNG CHIỀU CAO và chia đều hàng.
   Bản flex trước để ô Kết quả rơi xuống một mình, còn ô tên dài hai dòng thì
   cao vống hơn hai ô bên cạnh. */
.cover-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 8px; margin-top: 22px; }
.cover-info-item {
  padding: 10px 13px; display: flex; flex-direction: column; justify-content: center;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); border-radius: 13px;
}
.cover-info-label { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; opacity: .72; margin-bottom: 3px; }
.cover-info-value { font-size: clamp(13.5px, 3.2vw, 15.5px); font-weight: 700; overflow-wrap: anywhere; line-height: 1.35; }

/* ================= TỔNG QUAN =================
   Panel bốn ô thống kê cộng bảng phân loại mức độ đã thu thành MỘT DÒNG chữ
   xám (V2 mục 4.3); bảng kiểu của panel cũ (bốn ô thống kê và bảng phân loại
   mức độ) không còn thẻ nào mang nữa nên xoá hẳn — để lại là bảng kiểu chết,
   người sau đọc tưởng còn dùng.
   Kiểu của dòng mới nằm ở khối .tong-quan phía trên. */

/* ================= THANH ĐIỀU KHIỂN ================= */
.thanh {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  margin: 0 auto 18px; padding: 11px 13px;
  background: rgba(255,255,255,.92);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  backdrop-filter: saturate(180%) blur(14px);
  border: 1px solid var(--vien); border-radius: 22px;
  box-shadow: 0 2px 4px rgba(15,48,87,.04), 0 14px 34px -10px rgba(15,48,87,.16);
}
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
/* Phần, mức độ, chuyên đề: MỘT DÒNG CHỮ XÁM đẩy sang phải, không còn chip màu
 * (PHIEU-BAI-TAP-V2 mục 3 — sáu màu tranh nhau thì không màu nào còn nổi). */
.q-meta { margin-left: auto; font-size: 11.5px; color: #67646f; white-space: nowrap; align-self: center; }

/* LÝ DO NẰM NGAY TRONG Ô PHƯƠNG ÁN, chỉ hiện khi mở lời giải. Bản cũ để lý do
 * ở một khối riêng bên dưới nên em phải nhảy qua lại để dò dòng nào ứng với
 * phương án nào. */
.opt-ly { display: none; margin-top: 6px; font-size: 13px; line-height: 1.55; gap: 7px; align-items: flex-start; }
.q-card.mo .opt-ly { display: flex; }
.opt-dau { flex: 0 0 auto; font-weight: 700; }
.opt-ly.dung .opt-dau { color: #2e8b6b; }
.opt-ly.sai .opt-dau { color: #b42318; }
.opt-ly.dung { color: #2e8b6b; }
.opt-ly.sai { color: #67646f; }

/* TỔNG QUAN MỘT DÒNG. Ba cụm phần vẫn là nút lọc như panel cũ. */
.tong-quan { margin: 0 0 14px; font-size: 12.5px; color: #67646f; line-height: 1.9; }
.tq-cum { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer;
  border-bottom: 1px dashed #d8d3c8; }
.tq-cum.tat { border-bottom: none; opacity: .55; cursor: default; }
.tq-muc { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer;
  border-bottom: 1px dashed #d8d3c8; }
.tq-cum[aria-pressed="true"], .tq-muc[aria-pressed="true"] { color: #b42318; border-bottom-color: #b42318; font-weight: 600; }

/* Ô kết quả trên bìa — nhãn nói rõ nó là kết quả của bài NÀO. */
.cover-ket { flex: 0 1 auto; background: rgba(180,35,24,.16); border-color: rgba(180,35,24,.34); }
.cover-ket .cover-info-label, .cover-ket .cover-info-value { color: #f2c9c4; }
/* NHÃN CHỮA — lý do câu này có mặt trên phiếu, nên phải đọc thấy trước ba nhãn
   kia. Thầy chốt 07/09: "gắn màu nào cho nổi bật lên".
   Cam đậm: ba nhãn còn lại đều là màu pastel nhạt (xanh nhạt, hồng nhạt, xám),
   nên một ô đặc màu ấm là thứ duy nhất bật lên khỏi hàng. Kèm chấm trắng và cỡ
   chữ to hơn một bậc để không phải dò từng chữ. */
.q-tag.chua {
  background: #c2410c; color: #ffffff; font-size: 12px; font-weight: 800;
  padding: 4px 12px 4px 9px; letter-spacing: .015em;
  box-shadow: 0 1px 3px rgba(194, 65, 12, .35);
}
.q-tag.chua::before {
  content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #ffffff; margin-right: 7px; vertical-align: 1px;
}
/* Bậc 2 là "gần dạng", không trùng khít — cùng họ màu nhưng nhạt hẳn, để thầy
   phân biệt được từ xa mà không phải đọc chữ. */
.q-tag.chua-2 { background: #ffedd5; color: #9a3412; box-shadow: none; }
.q-tag.chua-2::before { background: #c2410c; }
/* Cả thẻ câu cũng đổi vạch trái: nhìn lướt là thấy câu nào là câu chữa. */
.q-card.la-chua { border-left-color: #c2410c; }
/* Khối "Phiếu này chữa gì" — đọc trước khi làm bài, nên đặt màu nhạt cùng họ
   với nhãn chữa để mắt nối được hai thứ với nhau. */
.chua-gi { background: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #c2410c; border-radius: var(--bo); padding: 14px 16px; margin-bottom: 14px; }
.chua-gi h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; color: #9a3412; }
.chua-gi ul { margin: 0; padding-left: 18px; }
.chua-gi li { margin: 4px 0; font-size: 14px; line-height: 1.5; }
.chua-gi li.mo { color: #78716c; }
.chua-gi .chua-mui { color: #c2410c; font-weight: 700; }
/* Ô phân tích cho câu LÀM LẠI: em phải đọc trước khi làm lại, nên đặt trên đề. */
.lam-lai { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; font-size: 14px; line-height: 1.55; color: #7c2d12; }
.q-card.la-chua.mo { border-left-color: var(--luc); }

/* Vùng bấm: cả thân câu. Con trỏ hình bàn tay để thấy ngay là bấm được. */
.q-than { padding: 10px 16px 14px; cursor: pointer; }
.q-text { font-size: 15.5px; line-height: 1.62; color: var(--muc); font-weight: 500; overflow-wrap: break-word; }
.q-text + .q-options, .q-text + .tf-head, .q-text + .sa-vung, .q-hinh + .q-options { margin-top: 12px; }

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
.sol-cot-loi { font-weight: 800; font-size: 15px; line-height: 1.6; color: #3b1d05; }
.sol-pa { padding: 3px 0; }
.sol-pa + .sol-pa { border-top: 1px dashed rgba(91,42,6,.18); }
.sol-pa.chon { font-weight: 600; }
.sol-step { font-size: 14.5px; line-height: 1.65; color: var(--kem-muc); padding-left: 18px; text-indent: -18px; }
.sol-ket { font-size: 15px; font-weight: 800; color: var(--kem-muc); }
/* Ảnh lời giải gốc chụp từ đề của tác giả. Nền trắng vì ảnh cắt ra là giấy
   trắng mực đen; đặt trên nền kem của ô lời giải sẽ thấy một vệt lệch màu. */
.sol-anh { margin-top: 6px; }
.sol-anh img { display: block; width: 100%; height: auto; border-radius: 10px; background: #fff; }
.sol-step + .sol-label, .sol-text + .sol-anh { margin-top: 10px; }

/* ============ TÊN EM HỎI (trang tổng hợp câu hỏi) ============
   HOIBAITHAY.md mục 4D. Nằm ở ĐÂY chứ không ở một bảng kiểu riêng: cả app chỉ
   có MỘT bộ dựng phiếu, thêm bộ thứ hai là hai trang bắt đầu lệch nhau. */
.cau-hoi-nhom { display: flex; flex-direction: column; }
.em-hoi {
  margin: -4px 0 0; padding: 9px 14px;
  border: 1px solid var(--vien); border-top: none;
  border-radius: 0 0 12px 12px;
  background: #f8fafc;
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
.q-opt-text, .q-tag, .tf-statement {
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
body.chi-de .q-opt.dung { background: #f8fafc !important; border-color: var(--vien) !important; color: var(--muc-2) !important; font-weight: 400 !important; }
body.chi-de .q-opt.dung .q-opt-letter { background: var(--vien-dam) !important; }
body.chi-de .tf-badge.dung { background: #f1f5f9 !important; color: var(--rat-nhat) !important; border-color: var(--vien) !important; }
body.chi-de .q-card { border-left-color: var(--vien-dam) !important; }
body.chi-de .sa-answer { display: none !important; }
body.chi-de .sa-blank { display: block !important; }
body.chi-de #mo-het, body.chi-de .thanh-chu b { display: none; }

/* HỘP CHỌN KIỂU PDF — thầy chốt 06/09: bấm Tải PDF phải hỏi tải đề trần hay
   tải cả lời giải, thay vì đoán hộ. Hai lựa chọn ra hai tệp khác hẳn nhau:
   một bản phát cho em tự làm, một bản để dò bài. */
.pdf-boc { position: relative; }
.pdf-chon {
  position: absolute; right: 0; bottom: calc(100% + 10px); z-index: 30;
  display: flex; flex-direction: column; gap: 10px; width: max-content; min-width: 214px; max-width: 78vw;
  padding: 14px; border-radius: 20px; background: #fff;
  border: 1px solid var(--vien); box-shadow: 0 4px 10px rgba(15,23,42,.06), 0 22px 50px -14px rgba(15,23,42,.32);
}
.pdf-chon[hidden] { display: none; }
.pdf-chon button {
  display: block; width: 100%; text-align: left; min-height: 48px;
  padding: 12px 18px; border-radius: 999px; border: 1px solid var(--vien-dam); background: #fff;
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
export function theCauHtml(c: CauLuyen, stt: number, moSan = false, anGiai = false): string {
  // Nhãn CHỮA đứng trước mọi nhãn khác: đọc một dòng là biết câu này có mặt
  // ở đây để sửa lỗi nào, không phải "một câu Ester bất kỳ".
  const n = c.chuaCho
  // MỘT CHIP CÓ MÀU VÀ CHỈ MỘT: "Chữa câu 3 phần I". Đó là thứ duy nhất đổi
  // việc em phải làm với câu này. Phần, mức độ, chuyên đề trước đây mỗi thứ một
  // chip màu — sáu màu tranh nhau thì không màu nào còn nổi; nay chúng gộp
  // thành MỘT DÒNG CHỮ XÁM đẩy sang phải.
  //
  // Nhãn chữa PHẢI kèm phần: "câu 2" trần trỏ vào hai câu khác nhau của cùng
  // một bài thi, em không biết mình đang chữa câu nào.
  // CHỮ TRÊN CHIP GIỮ NGUYÊN "Khắc phục lỗi sai câu N phần X". Đặc tả v2 vẽ
  // minh hoạ chip bằng chữ "Chữa câu 3 phần I", nhưng đó là hình vẽ chứ không
  // phải yêu cầu đổi chữ — và thầy đã chốt riêng chữ này trước đó (xem
  // `tests/tao-lai-phieu-va-chu-nhan.test.ts`). Đổi chữ ở đây là lặng lẽ lật
  // một quyết định cũ.
  const tags = [
    n ? `<span class="q-tag chua">${n.laLamLai ? `Làm lại câu ${n.soCau} phần ${n.phan}` : `Khắc phục lỗi sai câu ${n.soCau} phần ${n.phan}`}</span>` : '',
    n && n.laLamLai ? '<span class="q-tag chua-2">kho chưa có câu cùng dạng</span>' : '',
    n && !n.laLamLai && n.bac === 2 ? '<span class="q-tag chua-2">cùng cơ chế, khác việc</span>' : '',
  ].join('')
  const meta = [TEN_LOAI[c.phan], c.mucDo ? TEN_MUC[c.mucDo] : '', thoat(c.chuyenDe || '')].filter(Boolean).join(' · ')

  // LÝ DO ĐI THEO PHƯƠNG ÁN CỦA NÓ — thay đổi lớn nhất của bản này.
  //
  // Bản cũ dựng một khối "Vì sao chọn / không chọn từng phương án" nằm riêng
  // bên dưới, nên em phải nhảy qua lại để dò dòng nào ứng với phương án nào.
  // Đó là split-attention: việc tìm kiếm giữa hai nguồn ngốn đúng phần trí nhớ
  // làm việc đáng lẽ dùng để hiểu bài. Cách chữa là đưa lời giải thích tới
  // ĐÚNG CHỖ NÓ ÁP DỤNG.
  //
  // Dòng lý do nằm ngay trong ô phương án nhưng chỉ hiện khi mở lời giải
  // (`.q-card.mo`), nên bản chỉ-đề vẫn sạch.
  const lyTheoKhoa = new Map((c.lyDo ?? []).map((l) => [l.khoa, l.ly]))
  const dungKhoaCau = c.phan === 'II' ? CHU_Y.filter((_, i) => ysDung(c.dapAn)[i]) : [(c.dapAn || '').trim().toUpperCase()]
  const dongLy = (khoa: string): string => {
    if (anGiai) return ''
    const ly = lyTheoKhoa.get(khoa)
    if (!ly) return ''
    const dung = dungKhoaCau.includes(khoa)
    return `<div class="opt-ly${dung ? ' dung' : ' sai'}"><span class="opt-dau" aria-hidden="true">${dung ? '✓' : '✗'}</span><span>${chuHtml(ly)}</span></div>`
  }

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
        return `<div class="q-opt${dung ? ' dung' : ''}"><div class="q-opt-letter"><span class="ky">${CHU_PA[i]}</span></div><div class="q-opt-text">${noi}${hinhTaiViTri(c, `sau_pa_${CHU_PA[i]}`)}${dongLy(CHU_PA[i])}</div></div>`
      })
      .join('')
    than = `<div class="q-options${dai ? ' single-col' : ''}">${o}</div>`
  } else if (c.phan === 'II' && c.luaChon) {
    const dung = ysDung(c.dapAn)
    const hang = c.luaChon
      .map((y, i) => {
        const anh = c.anhLuaChon?.[i]
        const noi = anh ? anhHtml(anh, 'pa', `Ý ${CHU_Y[i]}`) : chuHtml(y)
        return `<div class="tf-item"><div class="tf-statement">${CHU_Y[i]}. ${noi}${hinhTaiViTri(c, `sau_y_${CHU_Y[i]}`)}${dongLy(CHU_Y[i])}</div><div class="tf-o"><div class="tf-badge d${dung[i] ? ' dung' : ''}"><span class="ky">Đ</span></div><div class="tf-badge s${dung[i] ? '' : ' dung'}"><span class="ky">S</span></div></div></div>`
      })
      .join('')
    than = `<div class="tf-head"><span>Đ</span><span>S</span></div>${hang}`
  } else {
    than = anGiai
      ? `<div class="sa-vung"><div class="sa-blank">Đáp án: ……………………………</div></div>`
      : `<div class="sa-vung"><div class="sa-blank">Đáp án: ……………………………</div><div class="sa-answer"><span class="ky">${chuHtml(c.dapAn || '—')}</span></div></div>`
  }

  // Ảnh cắt cả thân câu LÀ đề bài — có nó thì không in `text` nữa, đúng như màn
  // làm bài của học sinh (lớp chữ trong PDF gốc hay vỡ công thức ÂM THẦM).
  const deBai = c.anhThanCau ? anhHtml(c.anhThanCau, 'than', 'Đề bài') : `<div class="q-text">${chuHtml(c.text)}</div>`
  const giai = anGiai ? '' : oGiaiHtml(c)
  const nut = giai
    ? `<button class="q-nut-giai" type="button" aria-expanded="${moSan ? 'true' : 'false'}" aria-controls="giai-${stt}">${MUI_TEN}<span class="chu-mo">Xem lời giải</span><span class="chu-dong">Ẩn lời giải</span></button>
  <div class="sol-wrap" id="giai-${stt}"><div class="sol-inner">${giai}</div></div>`
    : ''

  const oLamLai =
    n && n.laLamLai
      ? `<div class="lam-lai"><b>Lần thi vừa rồi em chọn ${n.daChon ? thoat(n.daChon) : 'sai câu này'}.</b>${
          n.viSaoSai ? ` ${thoat(n.viSaoSai)}` : ' Em xem lại lời giải bên dưới rồi tự làm lại từ đầu.'
        }</div>`
      : ''
  return `<article class="q-card${n ? ' la-chua' : ''}${moSan ? ' mo' : ''}${giai ? '' : ' khong-giai'}" data-so="${stt}" data-phan="${c.phan}" data-muc="${thoat(c.mucDo || '')}">
  <div class="q-header"><div class="q-num"><span class="ky">${stt}</span></div><div class="q-tags">${tags}</div><div class="q-meta">${meta}</div></div>
  <div class="q-than">
    ${oLamLai}
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

  let coGiai = false
  // KIẾN THỨC CỐT LÕI in đậm TRÊN CÙNG (thầy chốt 04-09 khuya: "kiến thức cốt lõi
  // bôi đậm trên cùng để giải câu đó"), rồi mới tới vì sao chọn / không chọn
  // từng phương án.
  if (c.chot) {
    khoi.push(`<div class="sol-label">Kiến thức cốt lõi</div><div class="sol-text sol-cot-loi">${chuHtml(c.chot)}</div>`)
    coGiai = true
  }
  // KHÔNG dựng lại khối "Vì sao từng phương án" ở đây: từ bản này lý do đi
  // theo chính phương án của nó trong `theCauHtml`. Dựng cả hai là em đọc hai
  // lần cùng một câu.
  if (c.lyDo && c.lyDo.length > 0) coGiai = true
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

/* BẢNG CÔNG THỨC IN TRÊN BÌA ĐÃ BỎ HẲN — PHIEU-BAI-TAP-V2 mục 4.1.
 *
 * Bản 06/09 chữa lỗi "phiếu chuyên đề nào cũng in công thức ester" bằng cách chọn theo
 * chuyên đề. Chọn đúng hơn gõ cứng, nhưng vẫn là một bảng chữ Hoá nằm trong mã
 * app: chuyên đề mới thì rơi về bộ trung tính, và không chỗ gọi nào đổi được.
 *
 * Nay bìa KHÔNG in công thức nào. Mọi chữ trên bìa đến từ tham số. */

export function biaHtml(t: ThongTinPhieu, soCau: number): string {
  // Ô KẾT QUẢ PHẢI NÓI RÕ NÓ LÀ KẾT QUẢ CỦA BÀI NÀO. Nhãn trơ "Kết quả" trên
  // một phiếu 10 câu đọc ra "Sai 2/12 câu" là mâu thuẫn ngay trên bìa. Chỗ gọi
  // truyền nhãn qua `oBia`; không truyền thì mặc định là "Bài trước".
  const oKetQua = t.ketQua
    ? `<div class="cover-info-item cover-ket"><div class="cover-info-label">Bài trước</div><div class="cover-info-value">${thoat(t.ketQua)}</div></div>`
    : ''
  // Tên chuyên đề để NGUYÊN MỘT DÒNG: cỡ chữ `clamp()` tự xuống dòng đúng chỗ,
  // còn cắt tay ở dấu gạch thì tên như "Hydrocarbon không no" xuống sai chỗ.
  const ten = thoat(t.tenChuyenDe || 'Hoá học')
  const oNhanDang = (t.oBia && t.oBia.length > 0 ? t.oBia : [
    { nhan: 'Học sinh', gia: t.hoTen },
    { nhan: 'SBD', gia: t.sbd },
  ])
    .filter((o) => o.gia)
    .map((o) => `<div class="cover-info-item"><div class="cover-info-label">${thoat(o.nhan)}</div><div class="cover-info-value">${thoat(o.gia)}</div></div>`)
    .join('')

  return `<header class="cover">
  <div class="cover-content">
    <div class="cover-badge">${thoat(t.nhanBia || (t.hienDapAn ? 'Lời giải chi tiết' : 'Phiếu bài tập riêng'))}</div>
    <h1 class="cover-title">${ten}</h1>
    <div class="cover-subtitle">Thầy Đỗ Đại Học · ${soCau} câu · ${ngayVN(t.ngay)}</div>
    <div class="cover-info">
      ${oNhanDang}
      ${oKetQua}
    </div>
  </div>
</header>`
}

/** Một cụm đếm trong dòng tổng quan. Có câu thì là NÚT LỌC (`data-loc`), bấm
 * vào chỉ còn hiện câu của phần đó; phần 0 câu thì là chữ chết, bấm vào lọc ra
 * trang trắng là vô nghĩa.
 *
 * GIỮ NGUYÊN `data-loc` và `aria-pressed` để `JS_PHIEU` chạy tiếp không phải
 * sửa một dòng nào. */
function cumLoc(so: number, nhan: string, loc: string): string {
  const chu = `${so} ${nhan}`
  if (so === 0) return `<span class="tq-cum tat">${chu}</span>`
  return `<button type="button" class="tq-cum" data-loc="${loc}" aria-pressed="false" title="Chỉ xem phần này">${chu}</button>`
}

/** TỔNG QUAN ĐỀ BÀI — MỘT DÒNG CHỮ XÁM (PHIEU-BAI-TAP-V2 mục 4.3).
 *
 * Bản cũ là panel bốn ô thống kê cộng bảng phân loại mức độ, chiếm trọn một màn
 * trước khi em thấy câu 1 — mà đó là dữ liệu của thầy chứ không phải của em.
 *
 * Chức năng LỌC THEO PHẦN giữ nguyên: ba cụm "7 trắc nghiệm", "2 đúng sai",
 * "1 trả lời ngắn" trong dòng này chính là ba nút lọc cũ. */
export function tongQuanHtml(cau: CauLuyen[]): string {
  const dem = (p: string) => cau.filter((c) => c.phan === p).length
  const mucTen: [string, string][] = [
    ['biet', 'nhận biết'],
    ['hieu', 'thông hiểu'],
    ['van_dung', 'vận dụng'],
  ]
  // Mức độ VẪN LÀ NÚT LỌC như bản cũ. Đặc tả chỉ đòi bỏ CHIP MÀU và thu panel
  // thành một dòng; nó không đòi bỏ chức năng lọc theo mức độ, mà bỏ một thứ
  // đang chạy thì thầy mất công cụ đã quen. Nên: chữ xám như phần còn lại của
  // dòng, `data-loc="muc:..."` giữ nguyên cho `JS_PHIEU`.
  const muc = mucTen
    .map(([k, ten]) => {
      const n = cau.filter((c) => c.mucDo === k).length
      return n > 0 ? `<button type="button" class="tq-muc" data-loc="muc:${k}" aria-pressed="false" title="Chỉ xem mức độ này">${n} ${ten}</button>` : ''
    })
    .filter(Boolean)
    .join(', ')
  const phan = [cumLoc(dem('I'), 'trắc nghiệm', 'phan:I'), cumLoc(dem('II'), 'đúng sai', 'phan:II'), cumLoc(dem('III'), 'trả lời ngắn', 'phan:III')].join(' · ')
  return `<section class="tong-quan">
  <button type="button" class="tq-cum tq-tat" data-loc="tat" aria-pressed="false" title="Xem tất cả">${cau.length} câu</button> · ${phan}${muc ? ` · ${muc}` : ''}
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
    if (!n) continue
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
  <button class="nut chinh" type="button" id="pdf-de" title="Hộp thoại in mở ra, chọn Lưu thành PDF">Tải PDF</button>
</div>`
  }
  return `<div class="thanh">
  <div class="thanh-chu">Đã xem lời giải <b id="dem-mo">0</b>/<span id="dem-tong">${soCau}</span> câu<span class="the-loc" id="the-loc" hidden> · <b id="ten-loc"></b></span></div>
  <button class="nut nho" type="button" id="bo-loc" hidden>Bỏ lọc</button>
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
      // Dòng tổng quan v2: cụm lọc KHÔNG còn nhãn con, chữ nằm thẳng trong nút.
      // Không lùi về chính nút đó thì thanh "đang lọc" hiện tên rỗng.
      var nhan = oLoc.querySelector('strong') || oLoc;
      locTheo(oLoc.getAttribute('data-loc'), nhan.textContent.replace(/:$/, '').trim());
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
  /** HIỆN ĐỀ — giấu đáp án và lời giải ngay trên màn hình.
   *
   * Một lớp "chi-de" dùng cho CẢ màn hình lẫn bản in, nên đang xem kiểu nào
   * thì lưu ra PDF đúng kiểu đó. Trước đây chỉ có bản in giấu được, còn trên
   * màn hình em mở phiếu ra là thấy sẵn đáp án. */
  function datChiDe(bat_) {
    document.body.classList.toggle('chi-de', !!bat_);
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
}

export function dungPhieu(t: ThongTinPhieu, cauVao: CauLuyen[], tuyChon: TuyChonPhieu = {}): string {
  // `thieuChua` đi kèm phiếu để khối đầu phiếu nói được câu sai nào chưa có câu
  // chữa — im lặng bỏ qua là thầy tưởng phiếu đã chữa hết.
  const anGiai = !!tuyChon.anGiai
  const cau = anGiai ? cauVao.map(boLoiGiai) : cauVao
  const the = cau.map((c, i) => theCauHtml(c, i + 1, false, anGiai)).join('\n')
  const coGiai = anGiai ? 0 : cau.filter((c) => oGiaiHtml(c) !== '').length
  const huongDan = anGiai
    ? 'Em làm vào vở rồi đối chiếu với link lời giải bố mẹ gửi sau. Muốn bản giấy thì bấm "In đề" rồi chọn "Lưu thành PDF".'
    : 'Bấm vào từng câu để xem lời giải. Muốn bản giấy thì bấm "In đề" (phát cho em tự làm) hoặc "In kèm lời giải", rồi chọn "Lưu thành PDF".'
  const than = `${biaHtml(t, cau.length)}
<div class="khung">
  ${khoiChuaGiHtml(cau, tuyChon.thieuChua ?? [])}
  ${tongQuanHtml(cau)}
  ${thanhHtml(coGiai, anGiai)}
  <div class="ds-cau">${the}</div>
  <div class="chan">Thầy Đỗ Đại Học · ${thoat(t.tenChuyenDe)} · ${ngayVN(t.ngay)}<span class="chi-man"><br>${huongDan}</span></div>
</div>`
  const ai = t.oBia && t.oBia.length > 0 ? t.oBia[0].gia : t.hoTen
  return taiLieuHtml(than, `${t.tenChuyenDe}${ai ? ` · ${ai}` : ''}`)
}
