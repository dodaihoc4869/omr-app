// THẦY TỰ CHỮA — phần THUẦN (thầy 12/10, nguyên văn: "mục cần chữa cho tôi một phần tự chữa, phần này cho tôi chọn đề trong Mục dạy học (trắc nghiệm
// khách quan trả lời ngắn) khi chọn đề nào thì đề đó hiển thị tất cả các câu chiếu lên máy chiếu, ưu tiên đẩy câu đúng sai và tính toán lên đầu tiên
// hiển thị, bảng hiển thị đầy đủ mọi thứ như mục chiếu lên bảng (đúng chuẩn)").
//
// NGUỒN ĐỀ = đúng cây DẠY HỌC thầy thấy ở Hành trình › Dạy học › Bài hôm nay: kho trên máy (`loadExamSources`) → `khoDayHoc` (lọc nhánh DẠY HỌC,
// khử trùng, tách theo phần) → `dsBaiCuaKhoi(dungCay(locDeDayHoc(kho)), khối)`. Mỗi bài có các tờ Trắc nghiệm (-TN) · Đúng–sai (-DS) · Trả lời ngắn
// (-TLN) — chỉ các tờ `tuDong` (không Ví dụ minh hoạ, không Các dạng toán trọng tâm), đúng ba loại thầy nói.
//
// LUẬT XẾP thầy chốt 13/10: gộp câu tính toán, câu khó và câu lớp sai nhiều vào MỘT nhóm ưu tiên, trộn ngẫu nhiên trong nhóm.
// Giữ hạt ngẫu nhiên trong cùng buổi; phần còn lại theo đề, không bỏ câu và không lặp câu thuộc nhiều nhóm.
// NHẬN DIỆN "CÓ TÍNH TOÁN" (`laCauTinhToan`): gói bài 7 ngày ghi lý do "Có tính toán" bằng một biểu thức viết liền trong máy chủ (`server/src/goi-bai-7.ts`,
// không có hàm xuất) — `Phần III ∨ /tính|khối lượng|số mol|…|số kèm đơn vị/`. Biểu thức ấy bắt cả "tính chất", "tính base" (câu lý thuyết) nên KHÔNG dùng
// một mình: trước hết dùng luật lý thuyết / bài tập MỘT NGUỒN của app (`dangCua`, src/lib/dang-cau.ts — nhãn `kieu` của kho trước, Phần III luôn là
// bài tập, rồi điểm mặt chữ đã đo trên 2.520 câu); chỉ câu `dangCua` còn "chưa rõ" mới dùng biểu thức của gói 7 (`MAU_TINH_TOAN_GOI_7`, test khoá
// chữ biểu thức trùng với máy chủ) — bản `MAU_TINH_TOAN_LOC` đã chặn "pH" khớp "phân/phát" (22/10). TRẢ LỜI NGẮN (22/10) xét riêng, xem hàm. Trước khi chấm mặt chữ, bỏ các cụm LÝ THUYẾT có chữ "tính" ("tính chất", "tính base", "lưỡng tính"…
// — `CUM_TINH_LY_THUYET`) để "Tính chất hoá học của ammonia là" không thành câu tính toán.
// TỰ LUẬN: thầy TỰ CHỌN đề ⇒ câu tự luận có trong tờ vẫn hiện, ghi nhãn "Tự luận" (luật CLAUDE.md "riêng Gọi lên bảng thầy chọn gì hiện đúng thế" —
// cùng cách bảng Dạy học `cauTuDeChon`). Đây KHÔNG phải kênh rút đề tự động.
import { soSao, type CanChua, type TeacherExamSource, type TeacherMcqQuestion, type TeacherShortAnswerQuestion, type TeacherTrueFalseQuestion } from '../data/examContent'
import { dangCua } from './dang-cau'
import { laCauTuLuan } from './cau-tu-luan'
import { qidMayChuCuaIdCau } from './lich-su-cau-len-bang'
import { phanTichKhoiCau } from './khoi-cau'
import type { SoGopCauLop } from './thong-ke-lop-cau'
import { sinhMaNgauNhien } from './thiet-bi'

export type PhanCau = 'I' | 'II' | 'III'
export type CauGocTuChua = TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion

/** Tên loại câu trên màn thầy (chuẩn từ ngữ A1.4: viết đủ, không TN/DS/TLN). */
export const TEN_LOAI_CAU: Record<PhanCau, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

/** Biểu thức "Có tính toán" của gói bài 7 ngày — CHÉP NGUYÊN từ `server/src/goi-bai-7.ts` (`cauTuTick7`, trường `tinhToan`). Test so chữ với máy chủ. */
export const MAU_TINH_TOAN_GOI_7 = /(?:tính|khối lượng|số mol|thể tích|nồng độ|hiệu suất|phần trăm|pH|\d+[.,]?\d*\s*(?:mol|gam|g\b|lít|mL|kJ|%))/i

/** Bản dùng cho BỘ LỌC "câu khó & tính toán" (22/10): như `MAU_TINH_TOAN_GOI_7` nhưng "pH" phải đứng riêng — cờ /i làm "pH" khớp cả "PHân tử",
 *  "PHát biểu", "PHân bón", biến câu đếm / lý thuyết thành câu tính. Biểu thức gói 7 giữ nguyên (test khoá trùng máy chủ). */
export const MAU_TINH_TOAN_LOC = new RegExp(MAU_TINH_TOAN_GOI_7.source.replace('|pH|', '|pH(?![a-zà-ỹ])|'), 'i')

/** Cụm từ LÝ THUYẾT mang chữ "tính" (không phải phép tính) — bỏ khỏi mặt chữ trước khi chấm, nếu không cả `dangCua` (động từ hỏi "tính …")
 *  lẫn biểu thức gói 7 đều nhận nhầm. */
export const CUM_TINH_LY_THUYET = /lưỡng\s+tính|tính\s+(?:chất|base|bazơ|bazo|acid|axit|khử|oxi\s*h(?:oá|óa|oa)|oxy\s*h(?:oá|óa|oa)|kim\s*loại|phi\s*kim|tan|dẻo|cứng|dẫn|thơm|đặc\s*trưng)/giu
const boCumLyThuyet = (s: string | undefined) => String(s ?? '').replace(CUM_TINH_LY_THUYET, ' ')

/** Câu có phải làm tính không. Xem đầu tệp: nhãn kho / `dangCua` trước, chỉ câu "chưa rõ" mới dùng biểu thức của gói 7.
 *  `tuLuan`: câu tự luận Phần III ("Giải thích vì sao…") KHÔNG mặc nhiên là tính toán — xét theo nội dung như câu thường. */
export function laCauTinhToan(
  c: { phan: PhanCau; text?: string; luaChon?: readonly (string | undefined)[]; dapAn?: string; mucDo?: string; kieu?: string; tenDang?: string },
  tuLuan = false,
): boolean {
  const text = boCumLyThuyet(c.text)
  // TRẢ LỜI NGẮN (thầy 22/10, kèm ảnh: "bộ lọc câu khó và tính toán chưa hoạt động à, tôi tick vào vẫn y nguyên"): trước đây MỌI câu Phần III mặc
  // nhiên "có tính toán" ⇒ đề Trả lời ngắn lọc ra 40/40, câu đếm ("Số nguyên tử hydrogen trong trimethylamine…") cũng mang nhãn tính toán.
  // Nay: nhãn kho `kieu` thắng; còn lại là câu tính khi có dấu hiệu phép tính (biểu thức gói 7: khối lượng, số mol, số kèm đơn vị, %…) HOẶC
  // `dangCua` chấm mặt chữ ra bài tập (không truyền phần / đáp số — Phần III luôn "bài tập" và đáp số luôn là số). Câu đếm / lý thuyết ⇒ không.
  if (c.phan === 'III' && !tuLuan) {
    if (c.kieu === 'ly_thuyet' || c.kieu === 'bai_tap') return c.kieu === 'bai_tap'
    if (MAU_TINH_TOAN_LOC.test(`${text} ${boCumLyThuyet(c.tenDang)}`)) return true
    return dangCua({ text, luaChon: [], dapAn: '', mucDo: c.mucDo }) === 'bai_tap'
  }
  const luaChon = (c.luaChon ?? []).map((x) => boCumLyThuyet(x))
  const dang = dangCua({ phan: tuLuan ? undefined : c.phan, text, luaChon, dapAn: tuLuan ? '' : (c.dapAn ?? ''), mucDo: c.mucDo, kieu: c.kieu })
  if (dang !== 'chua_ro') return dang === 'bai_tap'
  return MAU_TINH_TOAN_LOC.test(`${text} ${boCumLyThuyet(c.tenDang)}`)
}

/** CÂU KHÓ (thầy chốt 21/10): mức Vận dụng (kho đã gộp VDC vào `van_dung` lúc nạp — `chuanHoaMucDo`) HOẶC câu 2 sao cần chữa (`canChua.sao`, đọc qua `soSao`).
 *  Trước 21/10 hàm xếp đọc nhầm `q.sao` (không có trường này) và so `VDC`/`van_dung_cao` (kho không bao giờ có) ⇒ không câu nào được nhận là khó. */
export function laCauKho(q: { mucDo?: string; canChua?: CanChua } | null | undefined): boolean {
  if (!q) return false
  const m = String(q.mucDo ?? '').toLowerCase()
  return soSao(q) === 2 || m === 'van_dung' || m === 'van_dung_cao' || m === 'vdc' || m === 'vd'
}

/** Một câu của đề thầy chọn, sẵn để xếp + chiếu. */
export interface CauTuChua {
  /** Id câu trong kho (khoá React, khoá tra). */
  khoa: string
  /** Mã câu MÁY CHỦ (`<tờ gốc>-<phần>-<số>`) — tra thống kê lớp, ai sai, nội dung. Không đổi được ⇒ id kho. */
  qid: string
  phan: PhanCau
  /** Số câu trong tờ — số em thấy trên đề ("Câu 3"). */
  so: number
  /** Mã tờ chứa câu. */
  maDe: string
  /** Vị trí trong đề (Phần I → II → III, trong phần theo thứ tự tờ) — khoá sắp ổn định. */
  thuTuDe: number
  q: CauGocTuChua
  tinhToan: boolean
  /** `laCauKho`: Vận dụng hoặc 2 sao. */
  kho: boolean
  tuLuan: boolean
  /** Câu không có chữ đề lẫn hình trên máy này ⇒ tờ chiếu dùng dòng thay thế. */
  thieuNoiDung: boolean
}


function coNoiDung(q: CauGocTuChua): boolean {
  const o = q as { text?: string; thanCauImg?: string; imageDataUrl?: string; hinhAnh?: unknown[] }
  return !!(String(o.text ?? '').replace(/<[^>]*>/g, '').trim() || o.thanCauImg || o.imageDataUrl || (Array.isArray(o.hinhAnh) && o.hinhAnh.length))
}

/** Mọi câu của các tờ đã chọn, theo THỨ TỰ ĐỀ: Phần I → II → III; cùng phần thì theo thứ tự tờ rồi thứ tự câu. Trùng id ⇒ một lần. */
export function cauCuaDe(dsTo: readonly TeacherExamSource[]): CauTuChua[] {
  const ra: CauTuChua[] = []
  const daCo = new Set<string>()
  const theoPhan: [PhanCau, (s: TeacherExamSource) => readonly CauGocTuChua[] | undefined][] = [
    ['I', (s) => s.phanI],
    ['II', (s) => s.phanII],
    ['III', (s) => s.phanIII],
  ]
  for (const [phan, lay] of theoPhan) {
    for (const s of dsTo) {
      ;(lay(s) ?? []).forEach((q, i) => {
        if (!q || !q.id || daCo.has(q.id)) return
        daCo.add(q.id)
        const luaChon = phan === 'I' ? (q as TeacherMcqQuestion).choices : phan === 'II' ? (q as TeacherTrueFalseQuestion).ideas : []
        const dapAn = phan === 'III' ? String((q as TeacherShortAnswerQuestion).correct ?? '') : ''
        const tuLuan = laCauTuLuan({ ...q, id: undefined, qid: undefined, maDe: undefined }, phan)
        ra.push({
          khoa: q.id,
          qid: qidMayChuCuaIdCau(q.id) ?? q.id,
          phan,
          so: Number(/-(\d+)$/.exec(q.id)?.[1]) || i + 1,
          maDe: s.maDe,
          thuTuDe: ra.length,
          q,
          tinhToan: laCauTinhToan({ phan, text: q.text, luaChon, dapAn, mucDo: q.mucDo, kieu: (q as { kieu?: string }).kieu, tenDang: q.dang?.ten }, tuLuan),
          kho: laCauKho(q),
          tuLuan,
          thieuNoiDung: !coNoiDung(q),
        })
      })
    }
  }
  return ra
}

/** Câu mang mã KHÁC khối của lớp đang chọn — CÙNG LUẬT `cauKhacKhoiLop` (to-chieu.ts, luật B của cổng máy chủ: khác khối hoặc mã tự mâu thuẫn ⇒ chặn; mã không
 *  đọc ra khối ⇒ giữ). Xem trước bỏ sẵn câu ấy (tờ chiếu vẫn chặn thêm một lần). Test khoá hai hàm cho cùng kết quả. */
export function laCauKhacKhoi(qid: string, khoi: number | null): boolean {
  if (!khoi) return false
  const p = phanTichKhoiCau(qid)
  if (p.tinhTrang === 'khong_ro') return false
  if (p.tinhTrang === 'mau_thuan') return true
  return p.khoi !== khoi
}

/** Hạng cũ giữ cho bên gọi cũ; không dùng trong thứ tự chữa hiện tại. */
export function hangCau(c: Pick<CauTuChua, 'phan' | 'tinhToan'>): 0 | 1 | 2 | 3 {
  if (c.phan === 'II') return c.tinhToan ? 0 : 1
  return c.tinhToan ? 2 : 3
}

/** Câu khó hoặc có tính toán — đúng điều kiện công tắc "Chỉ hiện câu khó & tính toán". Đối tượng không mang `kho` ⇒ tính từ `q`. */
export function laCauKhoHoacTinh(c: { tinhToan: boolean; kho?: boolean; q?: unknown }): boolean {
  return c.tinhToan || (c.kho ?? laCauKho(c.q as Parameters<typeof laCauKho>[0]))
}

/** Trộn chung nhóm ưu tiên, ổn định theo buổi; giữ nguyên mảng vào, câu còn lại theo đề. */
export function xepThuTuChua<T extends Pick<CauTuChua, 'phan' | 'tinhToan' | 'thuTuDe'>>(ds: readonly T[], soLop?:ReadonlyMap<string,{sai:number;lam:number}>|null,seed=sinhMaNgauNhien()): T[] {
  const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
  const key=(c:T)=>String((c as T&{qid?:string}).qid??c.thuTuDe)
  const uu=(c:T)=>{const g=soLop?.get(key(c));return laCauKhoHoacTinh(c)||!!g&&g.lam>=5&&g.sai/g.lam>=0.3}
  const unique=[...new Map(ds.map(c=>[key(c),c])).values()].sort((a,b)=>a.thuTuDe-b.thuTuDe)
  let state=hash(seed)||1
  const a=unique.filter(uu)
  for(let i=a.length-1;i>0;i--){state^=state<<13;state^=state>>>17;state^=state<<5;const j=(state>>>0)%(i+1);[a[i],a[j]]=[a[j]!,a[i]!]}
  return [...a,...unique.filter(c=>!uu(c))]
}

/** Đếm cho dòng tóm tắt. */
export function demTuChua(ds: readonly CauTuChua[]): { tong: number; dungSai: number; tinhToan: number; kho: number; tuLuan: number; thieu: number } {
  return {
    tong: ds.length,
    dungSai: ds.filter((c) => c.phan === 'II').length,
    tinhToan: ds.filter((c) => c.tinhToan).length,
    kho: ds.filter((c) => c.kho).length,
    tuLuan: ds.filter((c) => c.tuLuan).length,
    thieu: ds.filter((c) => c.thieuNoiDung).length,
  }
}

/** Tỉ lệ SAI của lớp ở một câu (lần làm mới nhất mỗi em, sổ học — `/gv/thong-ke-lop-cau`). Chưa em nào làm ⇒ null (không bịa). */
export function tiLeSaiLop(g: SoGopCauLop | null | undefined): { phanTram: number; bai: number } | null {
  if (!g || !(g.bai > 0)) return null
  const sai = Math.max(0, g.bai - Math.max(0, g.dung))
  return { phanTram: Math.round((sai / g.bai) * 100), bai: g.bai }
}

/** Ngưỡng "lớp sai nhiều" (bản vẽ Chữa bài 12/10: ô "câu lớp sai từ 30%", số % tô màu cảnh báo). */
export const NGUONG_LOP_SAI = 30

/** Số liệu lớp của một câu cho xem trước (12/10B): ưu tiên danh sách em sai theo lô (`/gv/ai-sai-nhieu-cau` — lần làm MỚI NHẤT của mỗi em, có số em đã
 *  làm), không có thì số gộp sổ học (`tiLeSaiLop`). Không có số ⇒ null (không bịa). */
export function soLieuLopCau(
  saiLo: { lam: number | null; sai: readonly unknown[] } | null | undefined,
  gop: SoGopCauLop | null | undefined,
): { sai: number; lam: number; phanTram: number } | null {
  if (saiLo && saiLo.lam !== null && saiLo.lam > 0) {
    const sai = Math.min(saiLo.sai.length, saiLo.lam)
    return { sai, lam: saiLo.lam, phanTram: Math.round((sai / saiLo.lam) * 100) }
  }
  const t = tiLeSaiLop(gop)
  return t && gop ? { sai: Math.max(0, gop.bai - Math.max(0, gop.dung)), lam: t.bai, phanTram: t.phanTram } : null
}

/** Dòng tóm tắt đề (một dòng, bỏ thẻ / mhchem thô) cho danh sách xem trước. */
export function tomTatCau(q: Pick<CauGocTuChua, 'text'>, toiDa = 120): string {
  const t = String(q.text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\\ce\{([^{}]*)\}/g, '$1')
    .replace(/\$+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > toiDa ? `${t.slice(0, toiDa - 1).trimEnd()}…` : t
}

/** Ghép tờ đã chọn ⇒ tên ngắn cho tờ chiếu: "Bài 6 · Trắc nghiệm + Đúng–sai". */
export function tenBuoiTuChua(tenBai: string, phan: readonly PhanCau[]): string {
  const ten = /^\s*Bài\s+\d+[a-z]?/i.exec(tenBai)?.[0]?.trim() || tenBai.trim()
  const loai = (['I', 'II', 'III'] as const).filter((p) => phan.includes(p)).map((p) => TEN_LOAI_CAU[p])
  return `Thầy tự chữa · ${ten}${loai.length ? ` · ${loai.join(' + ')}` : ''}`
}
