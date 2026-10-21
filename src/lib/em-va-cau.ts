// THẺ «EM VÀ CÂU NÀY» trong hộp Hỏi Thầy (thầy 21/10: "thiết kế thân thiện hiểu rõ được điểm mạnh điểm yếu, mọi dữ liệu của học sinh khi bấm
// vào mục hỏi thầy để hỗ trợ tốt nhất"; bản vẽ + đặc tả docs/ban-ve-hoi-thay-em-2110). Kiểu dữ liệu + kiểm khuôn phía máy em (máy chủ cũ / hỏng ⇒ null:
// thẻ ẩn, hộp chạy như cũ) + chữ hiện ra. Máy chủ: `tomTatEmVaCau` (server/src/hoi-thay-ca-nhan.ts), gắn vào `/hs/hoi-thay` khi `emVaCau: true`.

export type MucEm = 'vung' | 'luyen_them' | 'chua_du'
export interface LanEm { ketQua: 0 | 1; troGiup: boolean; luc: string }
export interface EmVaCau {
  /** Vắng ⇒ em chưa làm câu này. `soLan` ⇒ em ĐANG LÀM (máy chủ không gửi đúng/sai từng lần). */
  cauNay?: { tuLam: number; tuLamDung: number; coTroGiup: number; lan: LanEm[] } | { soLan: number }
  kienThuc: { ten: string; muc: MucEm; tuLam: number; ngay: number; trongCau: boolean }[]
  hoiNhanh: string[]
  mocKienThuc?: string
}

const so = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null)
const chu = (v: unknown, toiDa: number) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim().slice(0, toiDa) : '')

/** Kiểm khuôn phản hồi máy chủ. Sai khuôn ⇒ null (thẻ ẩn — không doạ, không báo lỗi riêng). */
export function docEmVaCau(v: unknown): EmVaCau | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  if (!Array.isArray(o.kienThuc) || !Array.isArray(o.hoiNhanh)) return null
  const kienThuc = o.kienThuc.slice(0, 14).flatMap((k) => {
    const x = (k && typeof k === 'object' ? k : {}) as Record<string, unknown>
    const ten = chu(x.ten, 100), tuLam = so(x.tuLam), ngay = so(x.ngay)
    return ten && tuLam !== null && ngay !== null && (x.muc === 'vung' || x.muc === 'luyen_them' || x.muc === 'chua_du')
      ? [{ ten, muc: x.muc as MucEm, tuLam, ngay, trongCau: x.trongCau === true }] : []
  })
  let cauNay: EmVaCau['cauNay']
  const c = o.cauNay && typeof o.cauNay === 'object' ? (o.cauNay as Record<string, unknown>) : null
  if (c && so(c.soLan) !== null && !('lan' in c)) cauNay = { soLan: so(c.soLan)! }
  else if (c && Array.isArray(c.lan)) {
    const lan = c.lan.slice(-8).flatMap((l) => {
      const x = (l && typeof l === 'object' ? l : {}) as Record<string, unknown>
      return (x.ketQua === 0 || x.ketQua === 1) && typeof x.luc === 'string' ? [{ ketQua: x.ketQua as 0 | 1, troGiup: x.troGiup === true, luc: x.luc }] : []
    })
    const tuLam = so(c.tuLam), tuLamDung = so(c.tuLamDung), coTroGiup = so(c.coTroGiup)
    if (lan.length && tuLam !== null && tuLamDung !== null && coTroGiup !== null && tuLamDung <= tuLam) cauNay = { tuLam, tuLamDung, coTroGiup, lan }
  }
  const hoiNhanh = o.hoiNhanh.slice(0, 2).map((x) => chu(x, 100)).filter(Boolean)
  return { ...(cauNay ? { cauNay } : {}), kienThuc, hoiNhanh, ...(typeof o.mocKienThuc === 'string' && o.mocKienThuc ? { mocKienThuc: o.mocKienThuc } : {}) }
}

export const laDangLam = (c: EmVaCau['cauNay']): c is { soLan: number } => !!c && 'soLan' in c
/** Lần đầu: chưa làm câu này và chưa có kiến thức nào đủ dữ liệu để nói ⇒ thẻ chỉ một dòng, không mở. */
export const laLanDau = (e: EmVaCau) => !e.cauNay && !e.kienThuc.length

/** Nhãn tóm tắt trên dòng gập. Không bao giờ "0/0". */
export function nhanTomTat(e: EmVaCau): string {
  const c = e.cauNay
  if (laDangLam(c)) return `Đã làm ${c.soLan} lần`
  if (c && c.tuLam > 0) return `Tự làm đúng ${c.tuLamDung}/${c.tuLam} lần`
  if (c) return `Đã làm ${c.lan.length} lần, đều có trợ giúp`
  const vung = e.kienThuc.filter((k) => k.muc === 'vung').length
  return vung ? `Lần đầu làm câu này · ${vung} phần đã vững` : 'Lần đầu làm câu này'
}

/** "Có trong câu này · tự làm 7 lần trong 5 ngày". */
export function chuPhuKienThuc(k: EmVaCau['kienThuc'][number]): string {
  const lan = `tự làm ${k.tuLam} lần${k.ngay > 0 ? ` trong ${k.ngay} ngày` : ''}`
  return k.trongCau ? `Có trong câu này · ${lan}` : lan.charAt(0).toUpperCase() + lan.slice(1)
}

// Ngày giờ viết TẠI CHỖ (không nhập dau-gio.ts / ngay-gio-24.ts): nhập chung làm Vite xếp lại mảnh dùng chung ⇒ thêm tệp precache (trần 170).
const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const hai = (n: number) => String(n).padStart(2, '0')
/** Mốc ISO ⇒ ngày giờ Việt Nam (UTC+7). Hỏng ⇒ null. */
function vn(iso: string): Date | null {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? new Date(t + 7 * 3_600_000) : null
}
/** "dd/mm" giờ Việt Nam (nhãn dưới chấm từng lần làm). */
export function ngayLan(l: LanEm): string {
  const d = vn(l.luc)
  return d ? `${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}` : ''
}
/** "14:05 · Thứ Tư 21/10/2026" giờ Việt Nam (chuẩn từ ngữ, luật 6). Hỏng ⇒ ''. */
export function gioDayDuVn(iso: string): string {
  const d = vn(iso)
  return d ? `${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())} · ${THU[d.getUTCDay()]} ${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}` : ''
}
export const gioLan = (l: LanEm) => gioDayDuVn(l.luc)
export const chuMoc = (iso?: string) => (iso ? gioDayDuVn(iso) : '')

/** Câu gửi Thầy khi em chạm nút hỏi nhanh. Đang làm ⇒ xin gợi hướng (máy chủ vẫn chặn lộ đáp án). */
export function cauHoiNhanh(ten: string, dangLam: boolean): { nhan: string; cau: string } {
  if (!ten) return dangLam ? { nhan: 'Gợi hướng câu này', cau: 'Thầy gợi hướng giúp em câu này.' } : { nhan: 'Giải thích lại câu này', cau: 'Thầy giải thích lại giúp em câu này.' }
  return dangLam ? { nhan: `Gợi hướng: ${ten}`, cau: `Thầy gợi hướng giúp em phần ${ten} trong câu này.` }
    : { nhan: `Giải thích lại: ${ten}`, cau: `Thầy giải thích lại giúp em phần ${ten} trong câu này.` }
}
