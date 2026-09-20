/** Số liệu HIỂN THỊ của màn theo dõi ca (G4) — chỉ tính từ dữ liệu ca đã có, không gọi máy chủ, không ghi gì.
 *  Thuần logic, có test ở tests/ca-thi-m3-2109.test.tsx. */
import type { AnswerRecord } from './exam-db'

export interface ConLaiCa {
  /** Còn bao nhiêu mili-giây tới giờ hết CHUNG của ca (không âm). */
  conLaiMs: number
  /** Giờ hết chung (ISO). */
  hetLuc: string
}

interface CaGio {
  trangThai: 'mo' | 'dong' | 'da_xoa'
  phongCho?: boolean
  batDauThiLuc?: string
  dongBoGio?: boolean
  thoiGianPhut: number
}

/** Chỉ ca ĐANG MỞ, thầy đã bấm Bắt đầu thi và bật "đồng bộ giờ cả phòng" mới có MỘT giờ hết chung — đúng luật của dòng
 *  "cùng hết giờ lúc …" ở thẻ thông tin ca. Ca tính giờ riêng từng em thì KHÔNG có đồng hồ chung: trả `null`, không bịa. */
export function conLaiCa(ca: CaGio, nowMs: number): ConLaiCa | null {
  if (ca.trangThai !== 'mo' || !ca.phongCho || !ca.batDauThiLuc || !ca.dongBoGio) return null
  const batDau = Date.parse(ca.batDauThiLuc)
  if (!Number.isFinite(batDau) || !(ca.thoiGianPhut > 0)) return null
  const het = batDau + ca.thoiGianPhut * 60000
  return { conLaiMs: Math.max(0, het - nowMs), hetLuc: new Date(het).toISOString() }
}

/** 31:46 — hoặc 1:05:09 khi còn từ một giờ trở lên. */
export function dinhDangDongHo(ms: number): string {
  const giay = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(giay / 3600)
  const p = Math.floor((giay % 3600) / 60)
  const s = giay % 60
  const hai = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${hai(p)}:${hai(s)}` : `${hai(p)}:${hai(s)}`
}

/** Số câu em đã trả lời trong bài đang lưu: phần I có chọn, phần II có ít nhất một ý, phần III có gõ. */
export function demCauDaLam(dapAn: AnswerRecord | null | undefined): number {
  if (!dapAn) return 0
  const i = Object.values(dapAn.phanI ?? {}).filter(Boolean).length
  const ii = Object.values(dapAn.phanII ?? {}).filter((y) => Array.isArray(y) && y.some((v) => v === 'D' || v === 'S')).length
  const iii = Object.values(dapAn.phanIII ?? {}).filter((v) => String(v ?? '').trim() !== '').length
  return i + ii + iii
}

/** Tổng số câu của đề; `null` khi máy chưa biết mẫu số (không đoán). */
export function tongSoCauCa(soCau: { I: number; II: number; III: number } | undefined | null): number | null {
  if (!soCau) return null
  const t = (Number(soCau.I) || 0) + (Number(soCau.II) || 0) + (Number(soCau.III) || 0)
  return t > 0 ? t : null
}
