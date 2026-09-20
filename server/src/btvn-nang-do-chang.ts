// BTVN "NÂNG ĐỠ" — LỊCH CHẶNG (hàm THUẦN, không IO). Tách riêng để cả `btvn-nang-do-d1.ts` lẫn `ke-hoach-ngay-d1.ts` dùng mà không vòng import.
import { themNgay } from './ho-so-nam-kt'
import { ngayVn } from './su-kien-hoc'

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
  daMo: boolean
  daXong: boolean
}

/** Chặng nào đã mở/đã xong. Chặng k > 0 mở khi chặng k−1 ĐÃ XONG và tới `moLuc[k]`; bài đã nộp ⇒ mọi chặng coi là mở. */
export function trangThaiCacChang(chang: string[][], chotLuc: string, loDaXong: number, daNop: boolean, now: number): { chang: TrangThaiChang[]; changDangMo: number | null } {
  const moLuc = moLucChang(chotLuc, chang.length)
  const daXong = Math.max(0, Math.min(chang.length, Math.floor(loDaXong)))
  const ds = chang.map((qs, k): TrangThaiChang => ({
    chiSo: k,
    soCau: qs.length,
    moLuc: moLuc[k],
    daMo: daNop || k === 0 || (k <= daXong && now >= Date.parse(moLuc[k])),
    daXong: k < daXong,
  }))
  return { chang: ds, changDangMo: daXong < chang.length && ds[daXong].daMo ? daXong : null }
}

