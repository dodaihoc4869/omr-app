// "CẢNH BÁO CỦA THẦY" — bộ đọc + câu chữ cho thẻ nhắc chưa nộp Bài tập về nhà (học sinh + phụ huynh). Đề bài `prompt-hom-nay-gv-v2.md` (phần Code 2).
// Máy chủ (Code 3, đã chốt 21/09): khoá `canhBaoThay` ở `POST /hs/ke-hoach-ngay` (lời cho EM, cửa sổ 48 giờ) và ở `POST /ph/ke-hoach {pass}`
// (lời cho PHỤ HUYNH, cửa sổ 72 giờ) — ≤ 3, mới nhất trước, CHỈ bài chưa nộp; khoá vắng khi không có. Chỉ thầy bấm mới gửi.
//   { id, maBtvn, tenBtvn, guiLuc, hanNop, loi, trangThaiEm:'chua_mo'|'do_chang'|'qua_han', chang?:{hienTai,tong}, daXem }
// THUẦN: không mạng, không đồng hồ (giờ hiện tại truyền vào), không trường lạ ra ngoài. Nói ĐÚNG SỰ THẬT (chưa mở / dở chặng mấy / hạn lúc nào),
// không doạ, không so với bạn, không nhãn năng lực. Mã tờ đề không bao giờ làm tên.
import { lamSachLoi } from './bo-nao-hien-thi'
import { gioDayDu } from './ngay-gio-24'

export type TrangThaiEm = 'chua_mo' | 'do_chang' | 'qua_han'

export interface CanhBaoThay {
  id: string
  maBtvn: string
  /** Tên bài đã làm sạch; rỗng nếu máy chủ gửi mã tờ đề / không có tên (khi vẽ dùng "Bài tập về nhà"). */
  tenBtvn: string
  guiLuc: string
  hanNop: string
  /** Lời thầy (đã làm sạch, ≤ 400 ký tự). Có thể rỗng: thẻ vẫn nói đủ sự việc bằng câu chuẩn. */
  loi: string
  trangThaiEm: TrangThaiEm | ''
  chang: { hienTai: number; tong: number } | null
  daXem: boolean
}

export const TOI_DA_CANH_BAO = 3
export const TEN_BAI_MAC_DINH = 'Bài tập về nhà'

const TRANG_THAI: readonly string[] = ['chua_mo', 'do_chang', 'qua_han']
const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const chuoi = (x: unknown, tran: number): string => (typeof x === 'string' || typeof x === 'number' ? lamSachLoi(String(x), tran).replace(/\s*\n+\s*/g, ' ') : '')
const soNguyenDuong = (x: unknown): number => (typeof x === 'number' && Number.isInteger(x) && x >= 1 ? x : 0)

/** Chuỗi trông như MÃ (không khoảng trắng, có chữ số, ≥ 6 ký tự: "DH-12-C2-B6-TN", "BTVN240921") ⇒ không phải tên để hiện cho em/phụ huynh. */
export const trongNhuMa = (s: string): boolean => /^[A-Za-z0-9][A-Za-z0-9._#/-]{5,}$/.test(s) && /\d/.test(s)

/** Đọc `canhBaoThay` từ gốc phản hồi. Không phải mảng / dòng hỏng (thiếu id) ⇒ bỏ dòng; trùng id ⇒ giữ dòng đầu; tối đa 3. */
export function docCanhBaoThay(x: unknown): CanhBaoThay[] {
  if (!Array.isArray(x)) return []
  const ra: CanhBaoThay[] = []
  const thay = new Set<string>()
  for (const d of x) {
    if (!laDoiTuong(d)) continue
    const id = chuoi(d.id, 80)
    if (!id || thay.has(id)) continue
    thay.add(id)
    const ten = chuoi(d.tenBtvn, 80)
    const tt = typeof d.trangThaiEm === 'string' && TRANG_THAI.includes(d.trangThaiEm) ? (d.trangThaiEm as TrangThaiEm) : ''
    const ch = laDoiTuong(d.chang) ? { hienTai: soNguyenDuong(d.chang.hienTai), tong: soNguyenDuong(d.chang.tong) } : null
    ra.push({
      id,
      maBtvn: chuoi(d.maBtvn, 80),
      tenBtvn: trongNhuMa(ten) ? '' : ten,
      guiLuc: chuoi(d.guiLuc, 40),
      hanNop: chuoi(d.hanNop, 40),
      loi: lamSachLoi(d.loi, 400),
      trangThaiEm: tt,
      chang: ch && ch.hienTai > 0 && ch.tong >= ch.hienTai ? ch : null,
      daXem: d.daXem === true,
    })
    if (ra.length >= TOI_DA_CANH_BAO) break
  }
  return ra
}

const ms = (iso: string): number => (iso ? Date.parse(iso) : NaN)

/** Đã qua Hạn nộp: máy chủ nói `qua_han`, hoặc mốc hạn hợp lệ đã trôi qua theo đồng hồ máy. */
export function daQuaHan(cb: CanhBaoThay, nayMs: number): boolean {
  if (cb.trangThaiEm === 'qua_han') return true
  const h = ms(cb.hanNop)
  return Number.isFinite(h) && nayMs > h
}

export const tenBaiHienThi = (cb: CanhBaoThay): string => cb.tenBtvn || TEN_BAI_MAC_DINH

/** Tiêu đề thẻ: "Thầy nhắc: em chưa nộp Bài tập về nhà" (HS) / "…con chưa nộp…" (PH). */
export function tieuDeCanhBao(cb: CanhBaoThay, vai: 'hocsinh' | 'phuhuynh'): string {
  return `Thầy nhắc: ${vai === 'phuhuynh' ? 'con' : 'em'} chưa nộp ${tenBaiHienThi(cb)}`
}

/** Một dòng SỰ THẬT về tình trạng bài của em. Không rõ ⇒ rỗng (không đoán). */
export function dongTinhTrang(cb: CanhBaoThay, nayMs: number, vai: 'hocsinh' | 'phuhuynh'): string {
  const ai = vai === 'phuhuynh' ? 'Con' : 'Em'
  if (daQuaHan(cb, nayMs)) return 'Đã qua Hạn nộp.'
  if (cb.trangThaiEm === 'chua_mo') return `${ai} chưa mở bài.`
  if (cb.trangThaiEm === 'do_chang') return cb.chang ? `${ai} đang dở chặng ${cb.chang.hienTai} trong ${cb.chang.tong} chặng.` : `${ai} đang làm dở bài này.`
  return ''
}

/** "còn 3 giờ 12 phút" / "còn 2 ngày 5 giờ" / "còn 40 phút". Hết hạn hoặc mốc sai ⇒ rỗng. */
export function chuConLai(hanMs: number, nayMs: number): string {
  const p = Math.floor((hanMs - nayMs) / 60000)
  if (!Number.isFinite(p) || p <= 0) return ''
  if (p < 60) return `còn ${p} phút`
  if (p < 24 * 60) return `còn ${Math.floor(p / 60)} giờ${p % 60 ? ` ${p % 60} phút` : ''}`
  const gio = Math.floor((p % (24 * 60)) / 60)
  return `còn ${Math.floor(p / (24 * 60))} ngày${gio ? ` ${gio} giờ` : ''}`
}

/** "Hạn nộp: 23:59 · Thứ Năm 24/09/2026 — còn 3 giờ 12 phút". Mốc hạn sai/vắng ⇒ rỗng (không bịa hạn). */
export function chuHanNop(cb: CanhBaoThay, nayMs: number): string {
  const h = ms(cb.hanNop)
  if (!Number.isFinite(h)) return ''
  const con = chuConLai(h, nayMs)
  return `Hạn nộp: ${gioDayDu(h)}${con ? ` — ${con}` : ''}`
}

/** "Thầy gửi lúc 20:15 · Thứ Hai 21/09/2026". Mốc sai/vắng ⇒ rỗng. */
export function chuGuiLuc(cb: CanhBaoThay): string {
  const g = ms(cb.guiLuc)
  return Number.isFinite(g) ? `Thầy gửi lúc ${gioDayDu(g)}` : ''
}
