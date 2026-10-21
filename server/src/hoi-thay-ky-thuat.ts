// CÁCH GIẢI CỦA THẦY cho Hỏi Thầy (thầy 21/10: "Nạp skill giải bài theo phong cách thầy và tinh chỉnh cho chuẩn cách giải của thầy nhất").
// Hai nguồn, đều gửi trong lượt NGƯỜI DÙNG (lời dặn hệ thống giữ cố định để Google dùng lại bộ đệm tiền tố):
//  1) BỘ CHÌA KHOÁ của chương (`src/lib/loi-giai-bo.ts`, bộ đã duyệt của "Lời giải từng bước") — tra theo mã dạng bài của câu (`boCua`).
//  2) KĨ THUẬT + BÀI MẪU Thầy đã giảng (skill `giai-bai-phong-cach-thay`, 314 video, `hoi-thay-ky-thuat-du-lieu.ts`) — chọn ≤ 6 mục khớp đề
//     bằng cụm hai âm tiết + công thức hoá học, cụm càng hiếm càng nặng (cụm chung như "khối lượng" nhẹ). Khớp yếu ⇒ không gửi gì.
// Không đọc D1, không gọi mạng; chỉ mục dựng một lần mỗi isolate.
import { BO_CHIA_KHOA } from '../../src/lib/loi-giai-bo'
import { CHUONG_BAI_GIANG, KY_THUAT_THAY } from './hoi-thay-ky-thuat-du-lieu'

/** CÁCH GIẢI CỦA THẦY — cô đọng `references/phong-cach-giai.md` của skill (lời dặn hệ thống, cố định cho mọi lượt). */
export const CACH_GIAI_THAY = `CÁCH GIẢI CỦA THẦY (chắt từ 314 video bài giảng của Thầy; cách nghĩ phải giống Thầy nhất)
- Thứ tự nghĩ: NHẬN DẠNG bản chất → CHỌN CÔNG CỤ vừa đủ → THAY SỐ → ĐÁP ÁN → KIỂM bằng một quan hệ khác. buoc và nac đi đúng thứ tự này; nhận dạng trước, tính sau.
- Nhận dạng: hữu cơ ưu tiên độ bất bão hoà, số liên kết π (tính cả vòng), nhóm chức. Đếm đồng phân có hệ thống: cố định nhóm chức (với amine cố định N, xét bậc), "nhổ H" để xét vị trí gắn, gộp vị trí đối xứng, đếm lại để không trùng không sót.
- Chọn công cụ vừa đủ, theo thứ tự: tỉ lệ hệ số / tỉ lệ mol, bảo toàn nguyên tố, quy đổi, bảo toàn electron, bảo toàn khối lượng, bảo toàn điện tích. Quan hệ rõ thì nhẩm ngắn, không lập hệ dài. Hỗn hợp xét giá trị trung bình khi hợp.
- Cân bằng: lập bảng ban đầu – phản ứng – cân bằng, phân biệt lượng ban đầu với lượng cân bằng; chuyển dịch nhìn tổng mol khí và chiều thu / toả nhiệt; chất xúc tác không làm chuyển dịch cân bằng.
- Oxi hoá – khử: chỉ ra nguyên tố tăng, giảm số oxi hoá, nhân đủ chỉ số nguyên tử; chất khử là chất nhường electron.
- Dùng đúng BỘ CHÌA KHOÁ của chương trong DỮ LIỆU CÂU: ưu tiên chìa khoá ghi [CHÌA KHOÁ CỦA DẠNG NÀY], gọi tên khi nêu quy tắc (ví dụ "Chìa khoá **Amine gặp thuốc thử**: …"). Có mục THẦY ĐÃ GIẢNG DẠNG NÀY thì đi theo kĩ thuật đó.
- Lời dẫn của Thầy: 1–2 câu trong cả trả lời, không lặp thành khẩu hiệu: "Em nhìn vào …", "Chỗ này là gì?", "Có nghĩa là …", "Em chỉ cần …"; gỡ nhầm bằng "…, chứ không phải …".
- Nêu đúng điểm dễ nhầm sát câu đang hỏi. Mọi con số tự tính lại và kiểm; không bao giờ đổi đáp án trong lời giải của Thầy.`

const CHI_SO_DUOI: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' }
const boThe = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[₀-₉]/g, (c) => CHI_SO_DUOI[c] ?? c)
const RE_CONG_THUC = /(?<![A-Za-z0-9])(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*){2,}(?![A-Za-z0-9])/g

/** Đặc trưng một đoạn chữ: cụm hai âm tiết liền nhau + công thức hoá học (giữ hoa/thường) — tập không trùng. */
export function dacTrung(chu: string): Set<string> {
  const s = boThe(chu)
  const ra = new Set<string>()
  for (const m of s.match(RE_CONG_THUC) ?? []) if (/\d/.test(m)) ra.add(`ct:${m}`)
  // Bỏ dấu thanh (giữ ơ, ư, â…): "thuỷ" và "thủy" là một âm tiết.
  const am = s.toLowerCase().normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC').split(/[^\p{L}\p{M}\d]+/u).filter(Boolean)
  for (let i = 0; i + 1 < am.length; i++) ra.add(`${am[i]} ${am[i + 1]}`)
  return ra
}

let chiMuc: { dt: Set<string>[]; idf: Map<string, number> } | null = null
function docChiMuc() {
  if (chiMuc) return chiMuc
  const dt = KY_THUAT_THAY.map(([c, , t]) => { const d = dacTrung(t); for (const x of dacTrung(CHUONG_BAI_GIANG[c] ?? '')) d.add(`ch:${x}`); return d })
  const df = new Map<string, number>()
  for (const d of dt) for (const x of d) df.set(x, (df.get(x) ?? 0) + 1)
  const n = dt.length
  const idf = new Map<string, number>()
  for (const [x, k] of df) idf.set(x, Math.log(n / k))
  chiMuc = { dt, idf }
  return chiMuc
}

/** Ngưỡng khớp: tổng độ hiếm các cụm chung (cụm của tên bài giảng tính nửa). Đo trên kho: ~8 ⇒ chỉ đưa khi khớp rõ dạng bài. */
export const NGUONG_KHOP = 8
export interface MucKyThuat { loai: 'k' | 'b'; chu: string; baiGiang: string; diem: number }

/** ≤ `toiDa` mục khớp đề nhất (tối đa 2 bài mẫu), mỗi mục ≥ 2 cụm chung và tổng điểm ≥ ngưỡng. */
export function chonKyThuat(de: string, chuong = '', toiDa = 6): MucKyThuat[] {
  const { dt, idf } = docChiMuc()
  const hoi = dacTrung(de)
  for (const x of dacTrung(chuong)) hoi.add(`ch:${x}`)
  const ung: MucKyThuat[] = []
  dt.forEach((d, i) => {
    let diem = 0, chung = 0
    for (const x of hoi) if (d.has(x)) { diem += (idf.get(x) ?? 0) * (x.startsWith('ch:') ? 0.5 : 1); if (!x.startsWith('ch:')) chung++ }
    if (chung >= 2 && diem >= NGUONG_KHOP) {
      const [c, loai, chu] = KY_THUAT_THAY[i]!
      ung.push({ loai, chu, baiGiang: CHUONG_BAI_GIANG[c] ?? '', diem: Math.round(diem * 10) / 10 })
    }
  })
  ung.sort((a, b) => b.diem - a.diem)
  const ra: MucKyThuat[] = []
  let soMau = 0
  for (const m of ung) {
    if (ra.length >= toiDa) break
    if (m.loai === 'b' && soMau >= 2) continue
    if (ra.some((x) => x.chu.toLowerCase() === m.chu.toLowerCase())) continue
    if (m.loai === 'b') soMau++
    ra.push(m)
  }
  return ra
}

const boHtml = (s: string) => s.replace(/<br\s*\/?>/gi, '; ').replace(/<[^>]*>/g, '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()

/** Bộ chìa khoá của chương câu này (mã dạng bài `HOP_CHAT_N.…` ⇒ `HOP_CHAT_N`); vắng mã ⇒ khớp đúng tên chương. Không có ⇒ ''. */
export function chuBoChiaKhoa(dangMa: string, chuong = ''): string {
  const ma = dangMa.split('.')[0]?.trim().toUpperCase() ?? ''
  const ten = chuong.trim().toLowerCase()
  const bo = BO_CHIA_KHOA[ma] ?? (ten ? Object.values(BO_CHIA_KHOA).find((b) => b.chuong.trim().toLowerCase() === ten) : undefined)
  if (!bo) return ''
  const chinh = bo.DANG_KEY?.[dangMa]
  const keys = Object.entries(bo.KEYS).map(([id, k]) => `${id === chinh ? '[CHÌA KHOÁ CỦA DẠNG NÀY] ' : ''}Chìa khoá ${k.ten}: ${boHtml(k.rule)}`)
  const bay = Object.values(bo.TRAPS_THEM ?? {}).map((t) => `Bẫy ${t.ten}: ${boHtml(t.hoi)}`)
  return [`BỘ CHÌA KHOÁ CỦA THẦY · chương ${bo.chuong} (cách Thầy chia dạng và quy tắc cần dùng; phản ứng nào trái mục PHẠM VI SGK thì theo PHẠM VI SGK):`, ...keys, ...bay].join('\n')
}

/** Khối "Thầy đã giảng dạng này" gửi kèm DỮ LIỆU CÂU; không khớp ⇒ ''. */
export function chuKyThuat(de: string, chuong = ''): string {
  const ds = chonKyThuat(de, chuong)
  if (!ds.length) return ''
  return ['THẦY ĐÃ GIẢNG DẠNG NÀY (tên kĩ thuật / bài mẫu trong bài giảng của Thầy; chỉ lấy CÁCH NGHĨ, không lấy số; mục nào không hợp câu này thì bỏ):',
    ...ds.map((m) => `- ${m.loai === 'k' ? 'Kĩ thuật' : 'Bài mẫu'}: ${m.chu} (bài giảng "${m.baiGiang}")`)].join('\n')
}
