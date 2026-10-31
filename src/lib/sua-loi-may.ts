// ĐÁP ÁN TỰ SỬA LỖI TRÊN MÁY EM (thầy 31/10: «làm cả cho tự sửa lỗi … xong đẩy luôn») — mã DÙNG CHUNG máy em / máy chủ (server/src/chua-gon-niem.ts `dmSua`).
// gon-mo gắn `dm` = «khoá.gói»: gói AES-GCM chứa ĐÚNG phần tem `sk` dùng để chấm LẦN này (đáp án của bản làm lại, lần thứ mấy, có tính «Đã tự sửa» không, gợi ý
// sau lần sai đầu, lời giải + ảnh sau lời giải); khoá riêng em + ngày VN (như đáp án câu luyện tập, dap-an-may.ts); dữ liệu kèm gắn đợt + bản ⇒ không chép gói
// câu này sang câu khác. Bấm «Kiểm tra» ⇒ máy em chấm NGAY (đúng luật `dong1Sua` của máy chủ) rồi vẫn gửi gon-nop: MÁY CHỦ CHẤM LẠI, quyết số lần / «Đã tự sửa» /
// tiến độ; bản máy chủ khác ⇒ theo máy chủ. Mảnh nhỏ: chỉ nằm trong mảnh màn sửa câu (không kéo dap-an-may / tu-luyen ⇒ không thêm tệp precache).
import { khopPhanIII } from './cham-so'

/** Số lần làm một câu mỗi ngày — bằng `SO_LAN_MOI_NGAY` của máy chủ (tests/sua-loi-tren-may-3110.test.ts canh). */
export const SO_LAN_SUA_MAY = 2

/** Phần chấm một lần sửa câu (khớp `NiemSua` của tem, bỏ hạn / phiên bản). */
export interface GoiSuaMay {
  /** Mã đợt. */ d: string
  /** Mã bản làm lại. */ b: string
  p: 'I' | 'II' | 'III'
  /** Đáp án đúng của bản. */ c: string
  /** Lần thứ mấy hôm nay. */ L: number
  /** Đúng ở lần này ⇒ «Đã tự sửa». */ tu: 0 | 1
  /** Em vừa xem lời giải. */ dg: 0 | 1
  /** Gợi ý sau lần sai đầu. */ gy?: string
  /** Lời giải. */ l: unknown
  /** Ảnh sau lời giải. */ h: unknown[]
}

/** Dữ liệu kèm của gói (đúng chuỗi máy chủ dùng). */
export const kemSuaMay = (dotId: string, ban: string): string => `sua|${dotId}|${ban}`

const chuHoa = (v: unknown) => String(v ?? '').trim().toUpperCase()
const dungSai = (v: unknown) => chuHoa(v).replace(/Đ/g, 'D').replace(/[^DS-]/g, '')
/** Đúng / sai — đúng luật `chamCauTuLuyen(...).dung` (src/lib/tu-luyen.ts) mà gon-nop dùng; chép lại để mảnh này không kéo tu-luyen. */
export function dungSuaMay(p: GoiSuaMay['p'], dapAn: string, traLoi: string): boolean {
  if (p === 'I') {
    const a = chuHoa(traLoi).replace(/[.)\s]+$/, ''), d = chuHoa(dapAn).replace(/[.)\s]+$/, '')
    return /^[A-D]$/.test(a) && a === d
  }
  if (p === 'II') {
    const d = dungSai(dapAn), a = dungSai(traLoi)
    let y = 0
    for (let i = 0; i < 4; i++) if ((a[i] === 'D' || a[i] === 'S') && a[i] === d[i]) y++
    return y === 4
  }
  return !!String(traLoi ?? '').trim() && khopPhanIII(traLoi, dapAn)
}

/** Kết quả TẠM của lần nộp — đúng dòng 1 (`dong1Sua`) của máy chủ, trừ tem lần 2 (máy em tự dựng lần 2 bằng `goiLanSau`). */
export function ketSuaMay(g: GoiSuaMay, traLoi: string): Record<string, unknown> {
  const dung = dungSuaMay(g.p, g.c, traLoi)
  const tuSua = dung && g.tu === 1
  const ket = dung ? (tuSua ? 'tu_sua' : 'xong_phan') : g.L < SO_LAN_SUA_MAY ? 'goi_y' : 'loi_giai'
  const o: Record<string, unknown> = {
    ok: true, tam: true, dotId: g.d, lan: g.L, ban: g.b, dung, ket,
    ...(ket === 'tu_sua' ? { trangThai: 'da_tu_sua' } : {}),
    ...(ket === 'xong_phan' ? { lyDo: g.L > 1 ? 'co_goi_y' : g.dg === 1 ? 'doc_loi_giai' : 'cung_ngay' } : {}),
    ...(ket === 'goi_y' && g.gy ? { goiY: g.gy } : {}),
  }
  if (ket !== 'goi_y') o.ct = { dapAn: g.c, loiGiai: g.l, hinhSau: g.h }
  return o
}

/** Lần kế hôm nay (sau khi sai, cùng bản): đúng như tem lần 2 máy chủ cấp — không còn «tự sửa», không gợi ý nữa. */
export const goiLanSau = (g: GoiSuaMay): GoiSuaMay => ({ d: g.d, b: g.b, p: g.p, c: g.c, L: g.L + 1, tu: 0, dg: g.dg, l: g.l, h: g.h })

const tuB64u = (s: string): Uint8Array<ArrayBuffer> => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/')
  const r = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
  const b = new Uint8Array(new ArrayBuffer(r.length))
  for (let i = 0; i < r.length; i++) b[i] = r.charCodeAt(i)
  return b
}

/** Mở `dm` («khoá.gói») của lần đang làm (đợt + bản). Sai khoá / khác đợt, khác bản / hỏng / trình duyệt không có WebCrypto ⇒ null (chờ máy chủ chấm như cũ). */
export async function moDmSua(dm: unknown, dotId: string, ban: string): Promise<GoiSuaMay | null> {
  if (typeof dm !== 'string' || !dotId || !ban) return null
  const i = dm.indexOf('.')
  if (i <= 0) return null
  try {
    const b = tuB64u(dm.slice(i + 1))
    const k = await crypto.subtle.importKey('raw', tuB64u(dm.slice(0, i)), { name: 'AES-GCM' }, false, ['decrypt'])
    const ro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: new TextEncoder().encode(kemSuaMay(dotId, ban)) }, k, b.slice(12))
    const g = JSON.parse(new TextDecoder().decode(ro)) as GoiSuaMay
    if (!g || g.d !== dotId || g.b !== ban || (g.p !== 'I' && g.p !== 'II' && g.p !== 'III') || typeof g.c !== 'string' || !g.c || !Number.isFinite(g.L)) return null
    return g
  } catch { return null }
}

/** Gói của LẦN `lan` (gói máy chủ cấp cho lần `g.L`; lần sau cùng bản ⇒ `goiLanSau`). Lệch quá ⇒ null. */
export function goiChoLan(g: GoiSuaMay, lan: number | undefined): GoiSuaMay | null {
  const L = lan ?? g.L
  if (L === g.L) return g
  if (L === g.L + 1 && L <= SO_LAN_SUA_MAY) return goiLanSau(g)
  return null
}
