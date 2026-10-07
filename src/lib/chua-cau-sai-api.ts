// CLIENT API — vòng chữa câu sai (đặc tả §10, 07/10/2026).
// Pattern: POST với token trong body (y hệt tu-luyen/api.ts).
// BẢO MẬT: không nhận/trả đáp án, không nhận sbd từ client.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import type { HinhAnh } from '../data/examContent'

// ---------------------------------------------------------------------------
// Kiểu công khai (mirror server/src/chua-cau-sai-kieu.ts phần public)
// ---------------------------------------------------------------------------
export type TrangThaiChua =
  | 'can_chan_doan'
  | 'dang_chua_buoc'
  | 'dang_ghep_bai'
  | 'cho_gap_lai_2'
  | 'dang_kiem_chung'
  | 'da_tu_sua'
  | 'can_thay'
  | 'thieu_hoc_lieu'
  | 'tam_khoa'
  | 'cau_thay_doi'

export type KieuItem = 'so' | 'chon' | 'ds' | 'chon_ly_do' | 'tu_nhap'

export interface LuaChonItem {
  ky: string
  noi: string
}

export interface ItemCongKhai {
  id: string
  loai: string
  buocSo?: number
  tieuDe: string
  kieu: KieuItem
  hoi: string
  luaChon: LuaChonItem[] | null
  mucHoTro?: number
  donVi?: string
  bang?: string[][]
  y?: string[]
  hinhAnh?: HinhAnh[]
}

export interface TienDoChua {
  soBuocDaQua: number
  soBuocCanKiem: number
}

export interface KetQuaDot {
  ok: boolean
  dotId?: string
  trangThai?: TrangThaiChua
  lyDoThieu?: string
  coHocLieu?: boolean
  phienId?: string
  revision?: number
  traLoiDaNop?: string
  loiThay?: string
  canNghi?: boolean
  cauGoc?: {
    phan: string
    text: string
    table?: string[][]
    choices?: string[]
    ideas?: string[]
    thanCauImg?: string
    imageDataUrl?: string
    choiceImgs?: (string | undefined)[]
    ideaImgs?: (string | undefined)[]
    hinhAnh?: HinhAnh[]
  } | null
  tienDoChiTiet?: { buocId: string; tieuDe: string; trangThai: string }[]
  phanHoiTruoc?: KetQuaNop | null
  item?: ItemCongKhai
  tienDo?: TienDoChua
  lanGapLai?: number
  denHan?: string
  ma?: string
  loi?: string
}

export interface KetQuaNop {
  dieuCanHieu?: {
    mucTieu: string
    yNghiaDaiLuong: string
    viSaoCanBuoc: string
    dieuKienApDung: string
    noiVoiBuocSau: string
  }
  ok: boolean
  dung?: boolean
  idempotent?: boolean
  hanhDongTiep?: string
  phanGiuDuoc?: string
  diemlech?: string
  giaThiet?: string
  trangThaiMoi?: TrangThaiChua
  ma?: string
  loi?: string
}

export interface KetQuaGoiY {
  ok: boolean
  mucHoTro?: number
  noiDungGoiY?: string | null
  dacBiet?: string
  ma?: string
  loi?: string
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
type Obj = Record<string, unknown>

const LOI_MANG = 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.'
const chu = (v: unknown) => (typeof v === 'string' ? v : String(v ?? ''))

async function goi(
  lenh: string,
  token: string,
  du: Obj = {},
): Promise<Obj | null> {
  const dk = new AbortController()
  const t = setTimeout(() => dk.abort(), 20_000)
  try {
    const goc = await layDiaChiMayChu()
    if (!goc) return null
    const r = await fetch(`${goc}/hs/chua-cau-sai/${lenh}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...du, token }),
      signal: dk.signal,
    })
    return (await r.json()) as Obj
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

const loiCua = (j: Obj | null): string =>
  j
    ? chu(j.mo ?? j.error ?? 'Máy chủ chưa trả lời được. Em thử lại.')
    : LOI_MANG

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Mở/lấy đợt lỗi theo qid câu sai đã nộp. */
export async function apiMoDot(
  token: string,
  qid: string,
  nguonSai?: string,
): Promise<KetQuaDot> {
  const j = await goi('mo-dot', token, {
    qid,
    ...(nguonSai ? { nguonSai } : {}),
  })
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma) }
  return j as unknown as KetQuaDot
}

/** Lấy item hiện tại (hoặc tạo mới) cho đợt. */
export async function apiPhatItem(
  token: string,
  dotId: string,
  tiep = false,
  tiepDoan = false,
): Promise<KetQuaDot> {
  const j = await goi('phat-item', token, { dotId, tiep, tiepDoan })
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma) }
  return j as unknown as KetQuaDot
}

/** Nộp đáp án item (idempotent theo attemptId). */
export async function apiNopItem(
  token: string,
  dotId: string,
  itemId: string,
  traLoi: string,
  attemptId: string,
  giay = 0,
): Promise<KetQuaNop> {
  const j = await goi('nop-item', token, {
    dotId,
    itemId,
    traLoi,
    attemptId,
    giay,
  })
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma) }
  return j as unknown as KetQuaNop
}

/** Xin gợi ý — tăng mức hỗ trợ cho item hiện tại. */
export async function apiXinGoiY(
  token: string,
  dotId: string,
  itemId: string,
  mucHoTro = 1,
): Promise<KetQuaGoiY> {
  const j = await goi('xin-goi-y', token, { dotId, itemId, mucHoTro })
  if (!j?.ok) return { ok: false, loi: loiCua(j), ma: chu(j?.ma) }
  return j as unknown as KetQuaGoiY
}

export async function apiGuiThay(
  token: string,
  dotId: string,
): Promise<{ ok: boolean; loi?: string }> {
  const j = await goi('gui-thay', token, { dotId })
  return j?.ok ? { ok: true } : { ok: false, loi: loiCua(j) }
}
const demCo = new Map<string, { den: number; p: Promise<boolean> }>()
export function apiCoChua(token: string): Promise<boolean> {
  const hit = demCo.get(token)
  if (hit && hit.den > Date.now()) return hit.p
  const p = goi('co', token).then((j) => j?.ok === true)
  if (demCo.size > 5) demCo.clear()
  demCo.set(token, { den: Date.now() + 15000, p })
  return p
}
export async function apiDanhSachChua(
  token: string,
): Promise<{ qid: string; trangThai: string; denHan?: string }[]> {
  const j = await goi('danh-sach', token)
  return j?.ok && Array.isArray(j.ds)
    ? (j.ds as { qid: string; trangThai: string; denHan?: string }[])
    : []
}
