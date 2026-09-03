// RÚT CÂU CHO BÀI TẬP VỀ NHÀ (BA-APP.md đợt 3).
//
// Chạy TRÊN MÁY THẦY: máy thầy đã có nguyên ngân hàng câu hỏi (có đáp án, có
// chuyên đề/mức độ) trong IndexedDB, nên không cần bắt Apps Script đọc lại kho
// đề từ Drive — vừa chậm vừa dễ quá thời gian thực thi.
//
// GIỚI HẠN SỐ CÂU MỖI PHẦN: bộ gán câu (exam-assign.ts) lấy tối đa
// PHAN_I_NEED / PHAN_II_NEED / PHAN_III_NEED câu mỗi phần. Nếu bài tập chứa
// nhiều hơn thế, câu thừa sẽ không bao giờ hiện ra cho em. Vì vậy bài tập rút
// tối đa 18 + 4 + 6 = 28 câu — đúng bằng ma trận một đề thi thật.
import { PHAN_I_NEED, PHAN_II_NEED, PHAN_III_NEED, type PublicExamBank, type TeacherExamSource, type TeacherMcqQuestion, type TeacherShortAnswerQuestion, type TeacherTrueFalseQuestion } from '../data/examContent'
import type { KeyBank } from './exam-api'

export const SO_CAU_BAI_TAP_TOI_DA = PHAN_I_NEED + PHAN_II_NEED + PHAN_III_NEED
export const SO_CAU_BAI_TAP_TOI_THIEU = 5
export const SO_CAU_BAI_TAP_MAC_DINH = 10

export type MucDoLoc = 'biet' | 'hieu' | 'van_dung' | 'tron'

export interface YeuCauBaiTap {
  /** Chuyên đề thầy tick. Rỗng = lấy mọi chuyên đề. */
  chuyenDe: string[]
  mucDo: MucDoLoc
  soCau: number
  /** Câu em ĐÃ từng làm — ưu tiên tránh, chỉ dùng lại khi không đủ câu mới. */
  qidTranh?: string[]
  /** Hạt ngẫu nhiên (test truyền số cố định để kết quả lặp lại được). */
  ngauNhien?: () => number
}

export interface KetQuaRutBaiTap {
  bank: PublicExamBank
  keyBank: KeyBank
  soCau: number
  /** Số câu trong kho khớp bộ lọc (trước khi cắt theo số câu thầy chọn). */
  soCauKhop: number
  /** Số câu phải lấy lại từ những câu em đã làm vì kho không đủ câu mới. */
  soCauLapLai: number
}

type CauBatKy = { id: string; chuyenDe?: string; mucDo?: string }

/** Câu có khớp bộ lọc chuyên đề + mức độ không. */
export function khopLoc(cau: CauBatKy, chuyenDe: string[], mucDo: MucDoLoc): boolean {
  if (chuyenDe.length > 0 && !chuyenDe.includes(String(cau.chuyenDe || '').trim())) return false
  if (mucDo !== 'tron' && String(cau.mucDo || '') !== mucDo) return false
  return true
}

/** Chia N câu về 3 phần theo đúng tỉ lệ ma trận đề (18 : 4 : 6), không phần
 * nào vượt trần của nó, và không đòi nhiều hơn số câu kho đang có. */
export function chiaSoCau(soCau: number, co: { I: number; II: number; III: number }): { I: number; II: number; III: number } {
  const tran = { I: Math.min(PHAN_I_NEED, co.I), II: Math.min(PHAN_II_NEED, co.II), III: Math.min(PHAN_III_NEED, co.III) }
  const tongTran = tran.I + tran.II + tran.III
  const can = Math.max(0, Math.min(soCau, tongTran))
  const tyLe: [keyof typeof tran, number][] = [
    ['I', PHAN_I_NEED],
    ['II', PHAN_II_NEED],
    ['III', PHAN_III_NEED],
  ]
  const ra = { I: 0, II: 0, III: 0 }
  // Vòng 1: chia theo tỉ lệ, làm tròn xuống.
  let daChia = 0
  for (const [phan, w] of tyLe) {
    const n = Math.min(tran[phan], Math.floor((can * w) / SO_CAU_BAI_TAP_TOI_DA))
    ra[phan] = n
    daChia += n
  }
  // Vòng 2: rải phần dư cho phần nào còn chỗ, ưu tiên phần I (nhiều câu nhất).
  for (const [phan] of tyLe) {
    while (daChia < can && ra[phan] < tran[phan]) {
      ra[phan]++
      daChia++
    }
  }
  return ra
}

function tronMang<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Sắp câu: câu em CHƯA làm lên trước (đã trộn), rồi mới tới câu đã làm. */
function uuTienCauMoi<T extends { id: string }>(ds: T[], daLam: Set<string>, rnd: () => number): T[] {
  const moi = tronMang(ds.filter((q) => !daLam.has(q.id)), rnd)
  const cu = tronMang(ds.filter((q) => daLam.has(q.id)), rnd)
  return [...moi, ...cu]
}

/**
 * Rút bài tập từ ngân hàng CÓ đáp án trên máy thầy.
 * Không đủ câu thì trả đúng số câu có được — gọi bên ngoài phải báo rõ cho thầy,
 * KHÔNG âm thầm giao ít hơn số thầy chọn.
 */
export function rutBaiTap(nguon: TeacherExamSource[], yc: YeuCauBaiTap): KetQuaRutBaiTap {
  const rnd = yc.ngauNhien ?? Math.random
  const daLam = new Set((yc.qidTranh ?? []).map(String))

  const hopI = nguon.flatMap((s) => s.phanI).filter((q) => khopLoc(q, yc.chuyenDe, yc.mucDo))
  const hopII = nguon.flatMap((s) => s.phanII).filter((q) => khopLoc(q, yc.chuyenDe, yc.mucDo))
  const hopIII = nguon.flatMap((s) => s.phanIII).filter((q) => khopLoc(q, yc.chuyenDe, yc.mucDo))
  const soCauKhop = hopI.length + hopII.length + hopIII.length

  const can = chiaSoCau(yc.soCau, { I: hopI.length, II: hopII.length, III: hopIII.length })
  const chonI = uuTienCauMoi(hopI, daLam, rnd).slice(0, can.I) as TeacherMcqQuestion[]
  const chonII = uuTienCauMoi(hopII, daLam, rnd).slice(0, can.II) as TeacherTrueFalseQuestion[]
  const chonIII = uuTienCauMoi(hopIII, daLam, rnd).slice(0, can.III) as TeacherShortAnswerQuestion[]

  const soCauLapLai = [...chonI, ...chonII, ...chonIII].filter((q) => daLam.has(q.id)).length

  // bank công khai (KHÔNG đáp án) — đúng thứ gửi lên máy em.
  const bank: PublicExamBank = {
    phanI: chonI.map(({ id, text, choices, thanCauImg, choiceImgs }) => ({ id, text, choices, thanCauImg, choiceImgs })),
    phanII: chonII.map(({ id, text, ideas, thanCauImg, ideaImgs }) => ({ id, text, ideas, thanCauImg, ideaImgs })),
    phanIII: chonIII.map(({ id, text, thanCauImg }) => ({ id, text, thanCauImg })),
  }
  return {
    bank,
    keyBank: { phanI: chonI, phanII: chonII, phanIII: chonIII },
    soCau: chonI.length + chonII.length + chonIII.length,
    soCauKhop,
    soCauLapLai,
  }
}

/** Đếm số câu trong kho khớp từng chuyên đề — để màn Giao bài tập hiện sẵn
 * "kho có N câu khớp" trước khi thầy bấm giao. */
export function demCauTheoChuyenDe(nguon: TeacherExamSource[], mucDo: MucDoLoc): Record<string, number> {
  const dem: Record<string, number> = {}
  for (const s of nguon) {
    for (const q of [...s.phanI, ...s.phanII, ...s.phanIII] as CauBatKy[]) {
      if (mucDo !== 'tron' && String(q.mucDo || '') !== mucDo) continue
      const cd = String(q.chuyenDe || '').trim()
      if (!cd) continue
      dem[cd] = (dem[cd] || 0) + 1
    }
  }
  return dem
}
