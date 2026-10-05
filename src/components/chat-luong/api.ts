// GỌI `/gv/chat-luong-loi` (5 thước đo chất lượng sửa lỗi theo lớp — máy chủ server/src/chat-luong-loi.ts, thầy 05/10).
// Không ném lỗi: trả `KetQuaLenh`. Đọc KỸ hình dạng câu trả lời (máy chủ cũ / lạ ⇒ `khong_doc_duoc`) — thẻ ẩn, màn Tổng quan không vỡ.
import { goiLenh, type KetQuaLenh } from '../../lib/goi-lenh-thay'

export const DUONG_CHAT_LUONG_LOI = '/gv/chat-luong-loi'
const CHU_CHUA_CO = 'Máy chủ chưa có lệnh chất lượng sửa lỗi — cần đẩy bản máy chủ mới.'

/** Một tỉ lệ `dat / n`; `du` = đủ mẫu (n ≥ nToiThieu). */
export interface TiLeCl { tiLe: number | null; dat: number; n: number; du: boolean }
export interface ChatLuongLop {
  tenLop: string
  soEm: number
  tuNgay: string
  denNgay: string
  soNgay: number
  lamLaiDau: TiLeCl
  saiLaiDuyTri: (TiLeCl & { moc: number })[]
  ngayToiDong: { trungVi: number | null; n: number; du: boolean }
  cauLaCungDang: TiLeCl
  lapNguyenVan: TiLeCl
  boKhacKhoi: number
  soEmCoLuot: number
}
export interface LopCl { tenLop: string; soEm: number }
export interface DuChatLuong { soNgay: number; nToiThieu: number; lop: LopCl[]; chon: string | null; ketQua: ChatLuongLop | null }

type Ho = Record<string, unknown>
const laHo = (x: unknown): x is Ho => !!x && typeof x === 'object' && !Array.isArray(x)
const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const soDem = (v: unknown): number | null => { const n = so(v); return n !== null && n >= 0 ? Math.round(n) : null }
const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const ngay = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

function docTiLe(v: unknown): TiLeCl | null {
  if (!laHo(v)) return null
  const n = soDem(v.n), dat = soDem(v.dat)
  if (n === null || dat === null || dat > n || typeof v.du !== 'boolean') return null
  const t = so(v.tiLe)
  return { tiLe: n > 0 && t !== null && t >= 0 && t <= 1 ? t : null, dat, n, du: v.du && n > 0 }
}

/** Câu trả lời lệnh ⇒ dữ liệu thẻ; sai dạng ở BẤT KỲ chỗ nào ⇒ null (thẻ ẩn, không hiện số đoán). */
export function docChatLuong(du: unknown): DuChatLuong | null {
  if (!laHo(du) || !Array.isArray(du.lop)) return null
  const soNgay = soDem(du.soNgay), nToiThieu = soDem(du.nToiThieu)
  if (!soNgay || !nToiThieu) return null
  const lop: LopCl[] = []
  for (const l of du.lop) {
    if (!laHo(l) || !chu(l.tenLop)) return null
    lop.push({ tenLop: chu(l.tenLop), soEm: soDem(l.soEm) ?? 0 })
  }
  const chon = chu(du.chon) || null
  if (du.ketQua == null) return { soNgay, nToiThieu, lop, chon, ketQua: null }
  const k = du.ketQua
  if (!laHo(k) || !Array.isArray(k.saiLaiDuyTri) || !laHo(k.ngayToiDong)) return null
  const tuNgay = ngay(k.tuNgay), denNgay = ngay(k.denNgay)
  const lamLaiDau = docTiLe(k.lamLaiDau), cauLaCungDang = docTiLe(k.cauLaCungDang), lapNguyenVan = docTiLe(k.lapNguyenVan)
  if (!chu(k.tenLop) || !tuNgay || !denNgay || !lamLaiDau || !cauLaCungDang || !lapNguyenVan) return null
  const saiLaiDuyTri: ChatLuongLop['saiLaiDuyTri'] = []
  for (const m of k.saiLaiDuyTri) {
    const t = docTiLe(m), moc = laHo(m) ? soDem(m.moc) : null
    if (!t || !moc) return null
    saiLaiDuyTri.push({ ...t, moc })
  }
  const nd = k.ngayToiDong, nDong = soDem(nd.n), tv = so(nd.trungVi)
  if (nDong === null || typeof nd.du !== 'boolean') return null
  return {
    soNgay, nToiThieu, lop, chon,
    ketQua: {
      tenLop: chu(k.tenLop), soEm: soDem(k.soEm) ?? 0, tuNgay, denNgay, soNgay: soDem(k.soNgay) ?? soNgay,
      lamLaiDau, saiLaiDuyTri, ngayToiDong: { trungVi: nDong > 0 && tv !== null && tv >= 0 ? tv : null, n: nDong, du: nd.du && nDong > 0 },
      cauLaCungDang, lapNguyenVan, boKhacKhoi: soDem(k.boKhacKhoi) ?? 0, soEmCoLuot: soDem(k.soEmCoLuot) ?? 0,
    },
  }
}

/** Tải 5 thước đo của một lớp (`lop` vắng ⇒ máy chủ chọn lớp đầu danh sách). Không ném. */
export async function taiChatLuong(lop: string | null, soNgay: number): Promise<KetQuaLenh<DuChatLuong>> {
  try {
    const r = await goiLenh(DUONG_CHAT_LUONG_LOI, lop ? { lop, soNgay } : { soNgay }, CHU_CHUA_CO)
    if (!r || typeof r !== 'object') return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả lời không đọc được.' }
    if (r.ok !== true) return r
    const du = docChatLuong(r.du)
    return du ? { ok: true, du } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả lời không đúng dạng.' }
  } catch {
    return { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }
  }
}
