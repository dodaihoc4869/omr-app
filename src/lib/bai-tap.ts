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
import { PHAN_I_NEED, PHAN_II_NEED, PHAN_III_NEED, soSao, type PublicExamBank, type TeacherExamSource, type TeacherMcqQuestion, type TeacherShortAnswerQuestion, type TeacherTrueFalseQuestion } from '../data/examContent'
import type { CanChua } from '../data/examContent'
import type { KeyBank } from './exam-api'
import { dangCua, hopDang, LOC_DANG_MAC_DINH, type LocDang } from './dang-cau'
import { hopSao, LOC_SAO_MAC_DINH, type LocSao } from './loc-sao'

import { hopLeDeRut } from './loc-cau-rut'

export const SO_CAU_BAI_TAP_TOI_DA = PHAN_I_NEED + PHAN_II_NEED + PHAN_III_NEED
export const SO_CAU_BAI_TAP_TOI_THIEU = 5
export const SO_CAU_BAI_TAP_MAC_DINH = 10

export type MucDoLoc = 'biet' | 'hieu' | 'van_dung' | 'tron'

export interface YeuCauBaiTap {
  /** Chuyên đề thầy tick. Rỗng = lấy mọi chuyên đề. */
  chuyenDe: string[]
  mucDo: MucDoLoc
  /** Chỉ lý thuyết, chỉ bài tập, hay ngẫu nhiên. Mặc định ngẫu nhiên. */
  dang?: LocDang
  /** Chỉ 2 sao (khó), chỉ 1 sao (bản chất), hay mọi mức — thầy chốt 07/09. */
  sao?: LocSao
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

type CauBatKy = { id: string; chuyenDe?: string; mucDo?: string; canChua?: CanChua; text?: string; correct?: unknown }

/** Câu có khớp bộ lọc chuyên đề + mức độ + dạng + sao không. */
export function khopLoc(
  cau: CauBatKy,
  chuyenDe: string[],
  mucDo: MucDoLoc,
  dang: LocDang = LOC_DANG_MAC_DINH,
  phan?: 'I' | 'II' | 'III',
  sao: LocSao = LOC_SAO_MAC_DINH,
): boolean {
  if (!hopLeDeRut({ phan, id: cau.id, dapAn: cau.correct, text: cau.text, q: cau })) return false
  if (chuyenDe.length > 0 && !chuyenDe.includes(String(cau.chuyenDe || '').trim())) return false
  if (mucDo !== 'tron' && String(cau.mucDo || '') !== mucDo) return false
  if (!hopSao(soSao(cau), sao)) return false
  if (dang !== 'ngau_nhien') {
    const c = cau as { text?: string; choices?: string[]; ideas?: string[]; correct?: unknown; mucDo?: string; kieu?: string }
    const luaChon = phan === 'I' ? (c.choices ?? []) : phan === 'II' ? (c.ideas ?? []) : []
    if (!hopDang(dangCua({ phan, text: c.text, luaChon, dapAn: phan === 'III' ? String(c.correct ?? '') : '', mucDo: c.mucDo, kieu: c.kieu }), dang)) return false
  }
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

  const loc = yc.dang ?? LOC_DANG_MAC_DINH
  const locS = yc.sao ?? LOC_SAO_MAC_DINH
  const hopI = nguon.flatMap((s) => s.phanI).filter((q) => khopLoc(q, yc.chuyenDe, yc.mucDo, loc, 'I', locS))
  const hopII = nguon.flatMap((s) => s.phanII).filter((q) => khopLoc(q, yc.chuyenDe, yc.mucDo, loc, 'II', locS))
  const hopIII = nguon.flatMap((s) => s.phanIII).filter((q) => khopLoc(q, yc.chuyenDe, yc.mucDo, loc, 'III', locS))
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

/** 3 VÒNG PHÂN TẦNG BÀI TẬP VỀ NHÀ THÔNG MINH */
export type VongBtvn = 'loi' | 'trong_tam' | 'thu_thach'

export interface CauPhanTangBtvn {
  id: string
  vong: VongBtvn
  tenVong: string
  batBuoc: boolean
  moTa: string
  sao?: number
}

export const MO_TA_VONG_BTVN: Record<VongBtvn, { ten: string; moTa: string; batBuoc: boolean }> = {
  loi: {
    ten: 'Vòng 1: Lõi Căn Bản',
    moTa: 'Kiến thức cốt lõi nhận biết & thông hiểu. Bắt buộc 100% học sinh hoàn thành.',
    batBuoc: true,
  },
  trong_tam: {
    ten: 'Vòng 2: Trọng Tâm Cá Nhân',
    moTa: 'Câu hỏi nhắm vào chuyên đề / dạng bài em hay sai để lấp lỗ hổng kiến thức.',
    batBuoc: true,
  },
  thu_thach: {
    ten: 'Vòng 3: Thử Thách Bứt Phá',
    moTa: 'Câu vận dụng cao 2 sao. Dành cho em muốn bứt phá điểm 9-10 & nhân đôi EXP Thần Thú.',
    batBuoc: false,
  },
}

/**
 * Phân loại câu trong bài tập về nhà thành 3 vòng thông minh.
 * @param cau Danh sách câu hỏi trong đề BTVN
 * @param chuyenDeYeu Danh sách chuyên đề em hay sai nhất (từ hồ sơ cá nhân)
 */
export function phanTangBtvn(
  cau: { id: string; chuyenDe?: string; mucDo?: string; sao?: number }[],
  chuyenDeYeu: string[] = [],
): Record<string, CauPhanTangBtvn> {
  const cdYeuNorm = new Set(chuyenDeYeu.map((c) => c.toLowerCase().trim()))
  const ketQua: Record<string, CauPhanTangBtvn> = {}

  for (const c of cau) {
    const sao = c.sao ?? (c.mucDo === 'van_dung' ? 2 : c.mucDo === 'hieu' ? 1 : 0)
    const cd = (c.chuyenDe || '').toLowerCase().trim()
    const laChuyenDeYeu = cd && cdYeuNorm.has(cd)

    let vong: VongBtvn
    if (sao === 2) {
      vong = 'thu_thach'
    } else if (laChuyenDeYeu) {
      vong = 'trong_tam'
    } else {
      vong = 'loi'
    }

    const info = MO_TA_VONG_BTVN[vong]
    ketQua[c.id] = {
      id: c.id,
      vong,
      tenVong: info.ten,
      batBuoc: info.batBuoc,
      moTa: info.moTa,
      sao,
    }
  }

  return ketQua
}

/**
 * Tính tiến độ hoàn thành thông minh (Smart Completion Rate).
 * Học sinh KHÔNG bắt buộc làm 100% đề máy móc:
 * Chỉ cần hoàn thành Vòng 1 (Lõi) + Vòng 2 (Trọng tâm) là đạt 100% yêu cầu.
 * Làm thêm Vòng 3 (Thử thách) sẽ vượt 100% (thưởng bứt phá).
 */
export function tinhTienDoThongMinh(
  danhSachCau: { id: string; chuyenDe?: string; mucDo?: string; sao?: number }[],
  cauDaLam: Set<string> | string[],
  chuyenDeYeu: string[] = [],
): {
  datYeuCau: boolean
  tiLeHoanThanh: number
  soLoiDaLam: number
  tongLoi: number
  soTrongTamDaLam: number
  tongTrongTam: number
  soThuThachDaLam: number
  tongThuThach: number
  tongDaLam: number
  tongSoCau: number
} {
  const daLamSet = new Set(cauDaLam)
  const phanTang = phanTangBtvn(danhSachCau, chuyenDeYeu)

  let tongLoi = 0
  let soLoiDaLam = 0
  let tongTrongTam = 0
  let soTrongTamDaLam = 0
  let tongThuThach = 0
  let soThuThachDaLam = 0

  for (const c of danhSachCau) {
    const pt = phanTang[c.id]
    const da = daLamSet.has(c.id)
    if (pt.vong === 'loi') {
      tongLoi++
      if (da) soLoiDaLam++
    } else if (pt.vong === 'trong_tam') {
      tongTrongTam++
      if (da) soTrongTamDaLam++
    } else {
      tongThuThach++
      if (da) soThuThachDaLam++
    }
  }

  const tongBatBuoc = tongLoi + tongTrongTam
  const daLamBatBuoc = soLoiDaLam + soTrongTamDaLam

  const tiLeHoanThanh =
    tongBatBuoc > 0 ? Math.min(100, Math.round((daLamBatBuoc / tongBatBuoc) * 100)) : 100
  const datYeuCau = daLamBatBuoc >= tongBatBuoc

  return {
    datYeuCau,
    tiLeHoanThanh,
    soLoiDaLam,
    tongLoi,
    soTrongTamDaLam,
    tongTrongTam,
    soThuThachDaLam,
    tongThuThach,
    tongDaLam: daLamSet.size,
    tongSoCau: danhSachCau.length,
  }
}

