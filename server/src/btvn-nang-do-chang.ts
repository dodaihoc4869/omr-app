// BTVN "NÂNG ĐỠ" — LỊCH CHẶNG (hàm THUẦN, không IO). Tách riêng để cả `btvn-nang-do-d1.ts` lẫn `ke-hoach-ngay-d1.ts` dùng mà không vòng import.
import { themNgay } from './ho-so-nam-kt'
import { ngayVn } from './su-kien-hoc'
import { lichDaiSomHon } from '../../src/lib/btvn-nang-do-lich'

/** Khoảng cách `lan` của sổ `btvn_lo` giữa hai lượt làm của cùng một bài cá nhân hoá (chỉ số chặng luôn < 1000): `lan = chiSo + LAN_MOI_LUOT × (lượt − 1)`. Nơi đọc `lan` làm chỉ số lô phải lấy `lan % LAN_MOI_LUOT`. */
export const LAN_MOI_LUOT = 1000

/** Mốc mở từng chặng: chặng 0 = lúc chốt; chặng k ≥ 1 = 00:00 giờ VN của ngày thứ k kể từ ngày chốt (luôn < hạn nộp vì soChang ≤ ceil((hạn − lúc chốt)/ngày)). */
export function moLucChang(chotLuc: string, soChang: number): string[] {
  const ngayChot = ngayVn(chotLuc)
  const ra: string[] = []
  for (let k = 0; k < soChang; k++) ra.push(k === 0 ? new Date(Date.parse(chotLuc)).toISOString() : new Date(Date.parse(`${themNgay(ngayChot, k)}T00:00:00+07:00`)).toISOString())
  return ra
}

export interface TrangThaiChang {
  chiSo: number
  soCau: number
  moLuc: string
  /** ISO — "xong đúng nhịp" trước lúc này (23:59 giờ VN của ngày mở chặng); chỉ có khi bài có lịch đã lưu (bản 1.1). */
  dungNhipTruoc?: string
  daMo: boolean
  daXong: boolean
}

/** LỊCH ĐÃ LƯU ở `btvn_em.chang_mo_json` (bản 1.1, tính MỘT lần lúc chốt bằng `xepLichChang`): `theoGio` = hạn ngắn, chia theo giờ trong cửa sổ học. */
export interface LichDaLuu {
  cheDo: 'dai' | 'ngan'
  moLuc: string[]
  dungNhipTruoc: string[]
}

/** Ngữ cảnh để áp BẢN 1.3 khi đọc (hạn rơi buổi trưa): lịch hạn dài chốt trước bản vá được tính lại, chặng CHƯA MỞ chỉ được mở SỚM hơn (`lichDaiSomHon`, Code 1). */
export interface NguCanhLich {
  chotLuc: string
  hanNop: string
  nowMs: number
}

/**
 * Đọc `chang_mo_json`. Vắng / hỏng / lệch số chặng / mốc không phải ISO hoặc lùi giờ ⇒ `null` (bài chốt trước bản 1.1 ⇒ dùng `moLucChang` cũ).
 * Có `nguCanh` và lịch đã lưu là hạn DÀI ⇒ mốc mở chặng chưa mở tính lại theo bản 1.3 (chỉ sớm hơn, không migration, áp lại vẫn cùng kết quả); lỗi thời gian ⇒ giữ lịch đã lưu.
 */
export function docLichDaLuu(v: unknown, soChang: number, nguCanh?: NguCanhLich): LichDaLuu | null {
  const lich = docLichDaLuuGoc(v, soChang)
  if (!lich || !nguCanh || lich.cheDo !== 'dai') return lich
  try {
    const moi = lichDaiSomHon(lich.moLuc, { chotLuc: nguCanh.chotLuc, hanNop: nguCanh.hanNop }, nguCanh.nowMs)
    return moi.length === lich.moLuc.length ? { ...lich, moLuc: moi } : lich
  } catch {
    return lich
  }
}

function docLichDaLuuGoc(v: unknown, soChang: number): LichDaLuu | null {
  if (v === null || v === undefined || v === '') return null
  try {
    const o = JSON.parse(String(v)) as { cheDo?: unknown; chang?: unknown }
    if (!o || typeof o !== 'object' || !Array.isArray(o.chang) || o.chang.length !== soChang || soChang === 0) return null
    const moLuc: string[] = []
    const dungNhipTruoc: string[] = []
    for (const c of o.chang as { moLuc?: unknown; dungNhipTruoc?: unknown }[]) {
      const m = typeof c?.moLuc === 'string' ? Date.parse(c.moLuc) : NaN
      if (!Number.isFinite(m) || (moLuc.length > 0 && m < Date.parse(moLuc[moLuc.length - 1]!))) return null
      moLuc.push(new Date(m).toISOString())
      const n = typeof c?.dungNhipTruoc === 'string' ? Date.parse(c.dungNhipTruoc) : NaN
      dungNhipTruoc.push(Number.isFinite(n) ? new Date(n).toISOString() : '')
    }
    return { cheDo: o.cheDo === 'ngan' ? 'ngan' : 'dai', moLuc, dungNhipTruoc }
  } catch {
    return null
  }
}

/** Chặng nào đã mở/đã xong. Chặng k > 0 mở khi chặng k−1 ĐÃ XONG và tới `moLuc[k]`; bài đã nộp ⇒ mọi chặng coi là mở. */
export function trangThaiCacChang(chang: string[][], chotLuc: string, loDaXong: number, daNop: boolean, now: number, lich?: LichDaLuu | null): { chang: TrangThaiChang[]; changDangMo: number | null } {
  const moLuc = lich && lich.moLuc.length === chang.length ? lich.moLuc : moLucChang(chotLuc, chang.length)
  const daXong = Math.max(0, Math.min(chang.length, Math.floor(loDaXong)))
  const ds = chang.map((qs, k): TrangThaiChang => ({
    chiSo: k,
    soCau: qs.length,
    moLuc: moLuc[k],
    ...(lich && lich.moLuc.length === chang.length && lich.dungNhipTruoc[k] ? { dungNhipTruoc: lich.dungNhipTruoc[k] } : {}),
    daMo: daNop || k === 0 || (k <= daXong && now >= Date.parse(moLuc[k])),
    daXong: k < daXong,
  }))
  return { chang: ds, changDangMo: daXong < chang.length && ds[daXong].daMo ? daXong : null }
}

