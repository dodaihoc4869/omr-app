// MÀN HÔM NAY CỦA THẦY — máy khách của lệnh đọc-chỉ `POST /ke-hoach/hom-nay-thay` (hợp đồng: docs/hop-dong-gv-hom-nay-2109.md) và
// `/ke-hoach/do-phu-phuc-vu` (câu tới hạn ôn). Mọi con số hiện trên màn đều đến từ đây; lỗi / khối `null` ⇒ màn hiện "đang chờ máy chủ".
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

export type LyDoCanY = 'tre_nhip' | 'tut_bac' | 'dang_yeu'
export interface HomNayEm {
  sbd: string
  hoTen: string
  lop: string
  lyDo: LyDoCanY
  soLieu: { ngay?: number; soCau?: number; soNgay?: number; ma?: string; ten?: string; soCauSai?: number }
}
export interface HomNayBtvn {
  ma: string
  ten: string
  lop: string
  soEm: number
  loHienTai: number
  tongLo: number
  soEmKip: number
  han: string | null
}
export interface HomNay {
  serverNow: number
  ngay: string
  soEm: number | null
  soLop: number | null
  caDangMo: number | null
  nhiemVu: { tong: number; dat: number; tongHomQua: number | null; datHomQua: number | null } | null
  btvn: { soEmCoLo: number; soEmDungNhip: number; dangChay: HomNayBtvn[] } | null
  canYTuong: { tong: number; ds: HomNayEm[] } | null
  dangYeu: { lop: string; siSo: number; dang: { ma: string; ten: string; soEmYeu: number }[] }[] | null
  doan: { lop: string; tram: number; tongTram: number; gopSucHomNay: number; siSo: number } | null
  lyDoThieu?: Partial<Record<'nhiemVu' | 'btvn' | 'canYTuong' | 'dangYeu' | 'doan', string>>
}
export interface CauToiHan {
  toiHan: number
  moDuoc: number
}

async function goi(duong: string, body: unknown): Promise<Record<string, unknown> | null> {
  try {
    const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return null
    const dk = new AbortController()
    const t = setTimeout(() => dk.abort(), 15000)
    const r = await fetch(`${ch.URL}${duong}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' },
      body: JSON.stringify(body),
      signal: dk.signal,
    })
    clearTimeout(t)
    const j = (await r.json()) as Record<string, unknown>
    return r.ok && j.ok === true ? j : null
  } catch {
    return null
  }
}

/** Lệnh Hôm nay. `null` = máy chủ chưa có lệnh / lỗi mạng / sai mã — màn hiện "đang chờ máy chủ". */
export async function layHomNay(): Promise<HomNay | null> {
  const j = await goi('/ke-hoach/hom-nay-thay', {})
  return j ? (j as unknown as HomNay) : null
}

/** Câu tới hạn ôn cả trường (lệnh sẵn có). `null` nếu không lấy được. */
export async function layCauToiHan(): Promise<CauToiHan | null> {
  const j = await goi('/ke-hoach/do-phu-phuc-vu', {})
  if (!j || typeof j.qidToiHan !== 'number' || typeof j.qidPhucVuDuoc !== 'number') return null
  return { toiHan: j.qidToiHan, moDuoc: j.qidPhucVuDuoc }
}

/** MỘT câu lý do bằng SỐ cho mỗi em cần để ý (máy chủ chỉ đưa số; câu ghép ở đây). Không kết luận năng lực từ điểm. */
export function cauLyDo(e: HomNayEm): string {
  const s = e.soLieu ?? {}
  if (e.lyDo === 'tre_nhip') return `Trễ nhịp ${s.ngay ?? '?'} ngày, chưa làm câu nào trong thời gian ấy`
  if (e.lyDo === 'tut_bac') return `Tụt bậc ${s.soCau ?? '?'} câu trong ${s.soNgay ?? 3} ngày`
  return `Dạng "${s.ten || s.ma || '?'}" sai ${s.soCauSai ?? '?'} câu`
}

/** Nhãn nút hành động theo lý do (mỗi em MỘT nút). */
export function hanhDongCua(e: HomNayEm): 'nhan_phu_huynh' | 'dua_vao_buoi_chua' | 'xem_ho_so' {
  return e.lyDo === 'tre_nhip' ? 'nhan_phu_huynh' : e.lyDo === 'dang_yeu' ? 'dua_vao_buoi_chua' : 'xem_ho_so'
}

export const NHAN_HANH_DONG = { nhan_phu_huynh: 'Nhắn phụ huynh', dua_vao_buoi_chua: 'Đưa vào buổi chữa', xem_ho_so: 'Xem hồ sơ' } as const

/** Tỉ lệ nguyên (%) — `null` khi mẫu số 0 (không bịa 0%). */
export function phanTram(tu: number, mau: number): number | null {
  return mau > 0 ? Math.round((tu / mau) * 100) : null
}

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
/** "Thứ Hai, 21/09" từ 'YYYY-MM-DD' hoặc Date (giờ máy — trùng giờ VN với máy thầy). */
export function ngayDai(d: string | Date): string {
  const x = typeof d === 'string' ? new Date(`${d}T00:00:00`) : d
  if (!Number.isFinite(x.getTime())) return ''
  return `${THU[x.getDay()]}, ${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`
}
/** "thứ Sáu" / "Chủ nhật" cho hạn nộp; rỗng nếu không đọc được. */
export function thuCuaHan(han: string | null): string {
  if (!han) return ''
  const x = new Date(han)
  return Number.isFinite(x.getTime()) ? THU[x.getDay()].replace(/^Thứ/, 'thứ') : ''
}
