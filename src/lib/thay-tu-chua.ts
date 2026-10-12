// THẦY TỰ CHỮA — phần THUẦN (thầy 12/10, nguyên văn: "mục cần chữa cho tôi một phần tự chữa, phần này cho tôi chọn đề trong Mục dạy học (trắc nghiệm
// khách quan trả lời ngắn) khi chọn đề nào thì đề đó hiển thị tất cả các câu chiếu lên máy chiếu, ưu tiên đẩy câu đúng sai và tính toán lên đầu tiên
// hiển thị, bảng hiển thị đầy đủ mọi thứ như mục chiếu lên bảng (đúng chuẩn)").
//
// NGUỒN ĐỀ = đúng cây DẠY HỌC thầy thấy ở Hành trình › Dạy học › Bài hôm nay: kho trên máy (`loadExamSources`) → `khoDayHoc` (lọc nhánh DẠY HỌC,
// khử trùng, tách theo phần) → `dsBaiCuaKhoi(dungCay(locDeDayHoc(kho)), khối)`. Mỗi bài có các tờ Trắc nghiệm (-TN) · Đúng–sai (-DS) · Trả lời ngắn
// (-TLN) — chỉ các tờ `tuDong` (không Ví dụ minh hoạ, không Các dạng toán trọng tâm), đúng ba loại thầy nói.
//
// LUẬT XẾP (`xepThuTuChua`, sắp ỔN ĐỊNH theo thứ tự đề Phần I → II → III):
//   hạng 0 · câu Đúng–sai CÓ tính toán · hạng 1 · câu Đúng–sai · hạng 2 · câu có tính toán (Trắc nghiệm / Trả lời ngắn) · hạng 3 · phần còn lại.
// NHẬN DIỆN "CÓ TÍNH TOÁN" (`laCauTinhToan`): gói bài 7 ngày ghi lý do "Có tính toán" bằng một biểu thức viết liền trong máy chủ (`server/src/goi-bai-7.ts`,
// không có hàm xuất) — `Phần III ∨ /tính|khối lượng|số mol|…|số kèm đơn vị/`. Biểu thức ấy bắt cả "tính chất", "tính base" (câu lý thuyết) nên KHÔNG dùng
// một mình: trước hết dùng luật lý thuyết / bài tập MỘT NGUỒN của app (`dangCua`, src/lib/dang-cau.ts — nhãn `kieu` của kho trước, Phần III luôn là
// bài tập, rồi điểm mặt chữ đã đo trên 2.520 câu); chỉ câu `dangCua` còn "chưa rõ" mới dùng đúng biểu thức của gói 7 (`MAU_TINH_TOAN_GOI_7`, test khoá
// chữ biểu thức trùng với máy chủ). Trước khi chấm mặt chữ, bỏ các cụm LÝ THUYẾT có chữ "tính" ("tính chất", "tính base", "lưỡng tính"…
// — `CUM_TINH_LY_THUYET`) để "Tính chất hoá học của ammonia là" không thành câu tính toán.
// TỰ LUẬN: thầy TỰ CHỌN đề ⇒ câu tự luận có trong tờ vẫn hiện, ghi nhãn "Tự luận" (luật CLAUDE.md "riêng Gọi lên bảng thầy chọn gì hiện đúng thế" —
// cùng cách bảng Dạy học `cauTuDeChon`). Đây KHÔNG phải kênh rút đề tự động.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { dangCua } from './dang-cau'
import { laCauTuLuan } from './cau-tu-luan'
import { qidMayChuCuaIdCau } from './lich-su-cau-len-bang'
import { phanTichKhoiCau } from './khoi-cau'
import type { SoGopCauLop } from './thong-ke-lop-cau'

export type PhanCau = 'I' | 'II' | 'III'
export type CauGocTuChua = TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion

/** Tên loại câu trên màn thầy (chuẩn từ ngữ A1.4: viết đủ, không TN/DS/TLN). */
export const TEN_LOAI_CAU: Record<PhanCau, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

/** Biểu thức "Có tính toán" của gói bài 7 ngày — CHÉP NGUYÊN từ `server/src/goi-bai-7.ts` (`cauTuTick7`, trường `tinhToan`). Test so chữ với máy chủ. */
export const MAU_TINH_TOAN_GOI_7 = /(?:tính|khối lượng|số mol|thể tích|nồng độ|hiệu suất|phần trăm|pH|\d+[.,]?\d*\s*(?:mol|gam|g\b|lít|mL|kJ|%))/i

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
  if (c.phan === 'III' && !tuLuan) return true
  const text = boCumLyThuyet(c.text)
  const luaChon = (c.luaChon ?? []).map((x) => boCumLyThuyet(x))
  const dang = dangCua({ phan: tuLuan ? undefined : c.phan, text, luaChon, dapAn: tuLuan ? '' : (c.dapAn ?? ''), mucDo: c.mucDo, kieu: c.kieu })
  if (dang !== 'chua_ro') return dang === 'bai_tap'
  return MAU_TINH_TOAN_GOI_7.test(`${text} ${boCumLyThuyet(c.tenDang)}`)
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
  tuLuan: boolean
  /** Câu không có chữ đề lẫn hình trên máy này ⇒ tờ chiếu dùng dòng thay thế. */
  thieuNoiDung: boolean
}

const THU_TU_PHAN: Record<PhanCau, number> = { I: 0, II: 1, III: 2 }

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

/** Hạng ưu tiên chiếu: 0 Đúng–sai có tính toán · 1 Đúng–sai · 2 có tính toán · 3 còn lại. */
export function hangCau(c: Pick<CauTuChua, 'phan' | 'tinhToan'>): 0 | 1 | 2 | 3 {
  if (c.phan === 'II') return c.tinhToan ? 0 : 1
  return c.tinhToan ? 2 : 3
}

/** Thứ tự chiếu: hạng tăng dần, cùng hạng giữ thứ tự đề (Phần I → II → III, số câu tăng dần). Không đổi mảng vào. */
export function xepThuTuChua<T extends Pick<CauTuChua, 'phan' | 'tinhToan' | 'thuTuDe'>>(ds: readonly T[]): T[] {
  return [...ds].sort((a, b) => hangCau(a) - hangCau(b) || THU_TU_PHAN[a.phan] - THU_TU_PHAN[b.phan] || a.thuTuDe - b.thuTuDe)
}

/** Đếm cho dòng tóm tắt. */
export function demTuChua(ds: readonly CauTuChua[]): { tong: number; dungSai: number; tinhToan: number; tuLuan: number; thieu: number } {
  return {
    tong: ds.length,
    dungSai: ds.filter((c) => c.phan === 'II').length,
    tinhToan: ds.filter((c) => c.tinhToan).length,
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
