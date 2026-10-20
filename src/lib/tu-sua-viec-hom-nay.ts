// VIỆC HÔM NAY của Tự sửa lỗi (thầy 20/10: "cho sửa ít nhất 12 câu mỗi ngày, chia làm các chặng cho thông minh và cảm hứng"; "157 câu đang chờ" làm em nản).
// Hàm THUẦN + một nhật ký nhỏ trên máy em (không thêm lệnh máy chủ):
//   · Mỗi ngày (giờ VN) chọn tối thiểu 12 câu từ danh sách Tự sửa lỗi, chia chặng 4 câu: câu GẦN XONG trước (đã tới lần gặp lại 2) → câu đang sửa dở →
//     câu mới có bài luyện từng bước → câu chỉ có lối "tự làm lại trên câu gốc" (đa số: 94% đợt chưa có bài luyện từng bước — đếm thật 20/10).
//   · "XONG PHẦN HÔM NAY" ≠ "đã tự sửa": một câu không thể đi từ lúc bắt đầu tới `da_tu_sua` trong một ngày (ghép bài → chờ ≥ 24 giờ → bản mới). Câu tính là xong phần
//     khi hôm nay em đã nộp chặng cuối làm được: ghép xong cả bài (`cho_gap_lai_2`) · tự sửa xong bản mới (`da_tu_sua`) · hết sức mà còn vướng (`can_thay`) ·
//     hoặc với câu chỉ có lối câu gốc: em đã bấm "Kiểm tra lại" ít nhất một lần.
//   · XOAY VÒNG câu gốc: câu chỉ có lối câu gốc không đổi trạng thái sau khi em tự làm lại, nên mỗi câu có "lần cuối em làm" (map nhỏ theo SBD, giữ ~30 ngày); trong nhóm câu gốc,
//     câu CHƯA làm bao giờ / làm lâu nhất đứng trước ⇒ hôm sau ra câu khác, không lặp cùng tám câu. Không loại câu nào: chỉ còn câu làm gần đây thì vẫn lấp đủ ngày.
//   · Danh sách chỉ trả tối đa 100 dòng (câu đã tự sửa đứng cuối, câu chờ có thể rớt trang 1) ⇒ "không còn trong danh sách" KHÔNG nghĩa là xong. Mỗi câu của ngày được
//     lưu kèm bản chụp mục (qid, dotId, trạng thái lúc chọn) và danh sách "đã xong" ghi lúc nộp; khoá theo SBD + ngày VN (đăng nhập lại không mất).
import type { MucChua } from './chua-cau-sai-api'
import { nhomMucChua } from './tu-sua-loi'

export const SO_CAU_MOI_NGAY = 12
export const SO_CAU_MOI_CHANG = 4
/** Khoá phiên cổng học sinh (viết thẳng, như hoi-thay-nhung.ts — không nhập phien-hoc-sinh.ts để khỏi tách khối tải). */
const KHOA_PHIEN = 'omr_student_portal_auth'
const khoaNhatKy = (sbd: string) => `omr_tu_sua_hom_nay_${sbd}`
const khoaLanCuoi = (sbd: string) => `omr_tu_sua_lan_cuoi_${sbd}`
const NGAY_GIU_LAN_CUOI = 30
const TOI_DA_LAN_CUOI = 400

/** gan = chỉ còn làm bản mới · dang = đang sửa dở · moi = có bài luyện từng bước, chưa bắt đầu · goc = chỉ có lối tự làm lại trên câu gốc. */
export type LoaiViec = 'gan' | 'dang' | 'moi' | 'goc'
const THU_TU: Record<LoaiViec, number> = { gan: 0, dang: 1, moi: 2, goc: 3 }

export interface ViecMuc {
  m: MucChua
  khoa: string
  loai: LoaiViec
  xong: boolean
}
export interface ViecHomNay {
  muc: ViecMuc[]
  /** Chặng 4 câu (chặng cuối có thể ít hơn). */
  chang: ViecMuc[][]
  xong: number
  tong: number
  /** Chỉ số (từ 0) chặng đầu tiên còn việc; = chang.length khi xong cả ngày. */
  changHienTai: number
  /** Câu chưa xong đầu tiên theo thứ tự ngày. */
  tiep: ViecMuc | null
  /** Số câu nhóm cần sửa không thuộc việc hôm nay. */
  conNgaySau: number
}
export interface MucLuu { q: string; d?: string; t: string; h?: string; l: LoaiViec }
export interface NhatKy { n: string; m: MucLuu[]; x: string[]; them?: number }

export const khoaMuc = (m: Pick<MucChua, 'dotId' | 'qid'>) => m.dotId ?? m.qid
export const ngayVnTuSua = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)

/** Loại việc của một mục theo trạng thái hiện tại; mục không còn việc (đã tự sửa, đang chờ chưa tới giờ) ⇒ null. */
export function loaiViec(m: Pick<MucChua, 'trangThai' | 'denHan'>, nayMs: number): LoaiViec | null {
  if (nhomMucChua(m, nayMs) !== 'can') return null
  switch (m.trangThai) {
    case 'cho_gap_lai_2': case 'dang_kiem_chung': return 'gan'
    case 'dang_chua_buoc': case 'dang_ghep_bai': return 'dang'
    case 'can_chan_doan': return 'moi'
    default: return 'goc'
  }
}

/** Em đã xong phần hôm nay của mục này chưa: có ghi lúc nộp, hoặc trạng thái đã vượt chặng cuối làm được (không áp cho câu chỉ có lối câu gốc). */
function daXong(m: MucChua, loai: LoaiViec, ghi: ReadonlySet<string>, nayMs: number): boolean {
  if (ghi.has(khoaMuc(m))) return true
  if (m.trangThai === 'da_tu_sua') return true
  if (loai === 'goc') return false
  if (m.trangThai === 'can_thay') return true
  return m.trangThai === 'cho_gap_lai_2' && nhomMucChua(m, nayMs) === 'cho'
}

// ---------------------------------------------------------------- nhật ký trên máy em ----------------------------------------------------------------
export function docSbdHs(): string {
  try {
    const o = JSON.parse(localStorage.getItem(KHOA_PHIEN) || 'null') as { sbd?: unknown } | null
    return typeof o?.sbd === 'string' ? o.sbd.trim() : ''
  } catch { return '' }
}
function docNhatKy(sbd: string, nayMs: number): NhatKy {
  const rong: NhatKy = { n: ngayVnTuSua(nayMs), m: [], x: [] }
  if (!sbd) return rong
  try {
    const o = JSON.parse(localStorage.getItem(khoaNhatKy(sbd)) || 'null') as NhatKy | null
    if (o && o.n === rong.n && Array.isArray(o.m) && Array.isArray(o.x)) return o
  } catch { /* máy chặn lưu / hỏng ⇒ coi như ngày mới */ }
  return rong
}
function luuNhatKy(sbd: string, nk: NhatKy): void {
  if (!sbd) return
  try { localStorage.setItem(khoaNhatKy(sbd), JSON.stringify(nk)) } catch { /* không lưu được: màn vẫn đúng trong phiên này */ }
}
/** Map {khoá đợt → ngày VN em làm lần cuối} (xoay vòng câu gốc). Hỏng / chưa có ⇒ rỗng. */
function docLanCuoi(sbd: string): Record<string, string> {
  if (!sbd) return {}
  try {
    const o = JSON.parse(localStorage.getItem(khoaLanCuoi(sbd)) || 'null') as Record<string, unknown> | null
    return o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'string')) as Record<string, string> : {}
  } catch { return {} }
}
function ghiLanCuoi(sbd: string, khoa: string, nayMs: number): void {
  const han = ngayVnTuSua(nayMs - NGAY_GIU_LAN_CUOI * 86_400_000)
  const cu = Object.entries({ ...docLanCuoi(sbd), [khoa]: ngayVnTuSua(nayMs) }).filter(([, d]) => d >= han)
  const giu = cu.length > TOI_DA_LAN_CUOI ? cu.sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0)).slice(0, TOI_DA_LAN_CUOI) : cu
  try { localStorage.setItem(khoaLanCuoi(sbd), JSON.stringify(Object.fromEntries(giu))) } catch { /* không lưu được: bỏ qua */ }
}
/** Ghi: hôm nay em đã xong phần của đợt `dotId` (gọi lúc nộp bước ghép bài / bản mới, hoặc lúc bấm "Kiểm tra lại" ở câu gốc). Lặp lại không đổi gì. */
export function ghiXongHomNay(dotId: string, nayMs = Date.now()): void {
  const sbd = docSbdHs()
  if (!sbd || !dotId) return
  const nk = docNhatKy(sbd, nayMs)
  ghiLanCuoi(sbd, dotId, nayMs)
  if (nk.x.includes(dotId)) return
  luuNhatKy(sbd, { ...nk, x: [...nk.x, dotId] })
}

// ---------------------------------------------------------------- dựng việc hôm nay ----------------------------------------------------------------
function chiaChang(muc: ViecMuc[]): ViecMuc[][] {
  const ra: ViecMuc[][] = []
  for (let i = 0; i < muc.length; i += SO_CAU_MOI_CHANG) ra.push(muc.slice(i, i + SO_CAU_MOI_CHANG))
  return ra
}

/**
 * Dựng việc hôm nay từ danh sách Tự sửa lỗi. Trả `viec` (null khi không có việc nào) và `luu` (nhật ký mới, nơi gọi ghi trong effect — không ghi lúc vẽ).
 * Không đủ 12 câu làm được ⇒ ngày nhỏ hơn, đúng số có. Danh sách lỗi / vòng chữa tắt ⇒ null.
 */
export function dungViecHomNay(
  kq: { trangThai: string; ds?: readonly MucChua[]; dem?: { can: number } } | null | undefined,
  nayMs: number,
  sbd: string,
  them = 0,
): { viec: ViecHomNay | null; luu: NhatKy | null } {
  if (!kq || kq.trangThai !== 'bat' || !kq.ds) return { viec: null, luu: null }
  const ds = kq.ds
  const nk = docNhatKy(sbd, nayMs)
  const hienTai = new Map(ds.map((m) => [khoaMuc(m), m]))
  const ghi = new Set(nk.x)
  const co = new Set(nk.m.map((x) => x.d ?? x.q))
  const soMuc = SO_CAU_MOI_NGAY + SO_CAU_MOI_CHANG * Math.max(them, nk.them ?? 0)
  // Bổ sung từ danh sách hiện tại (theo thứ tự máy chủ, ổn định theo loại) khi ngày chưa đủ số câu.
  const them_: MucLuu[] = []
  if (nk.m.length < soMuc) {
    const lanCuoi = docLanCuoi(sbd)
    const truoc = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
    const ung = ds
      .map((m, i) => ({ m, i, l: loaiViec(m, nayMs) }))
      .filter((x): x is { m: MucChua; i: number; l: LoaiViec } => x.l !== null && !co.has(khoaMuc(x.m)))
      .sort((a, b) => THU_TU[a.l] - THU_TU[b.l] || (a.l === 'goc' ? truoc(lanCuoi[khoaMuc(a.m)] ?? '', lanCuoi[khoaMuc(b.m)] ?? '') : 0) || a.i - b.i)
      .slice(0, soMuc - nk.m.length)
    for (const x of ung) them_.push({ q: x.m.qid, ...(x.m.dotId ? { d: x.m.dotId } : {}), t: x.m.trangThai, ...(x.m.denHan ? { h: x.m.denHan } : {}), l: x.l })
  }
  const luuMuc = [...nk.m, ...them_]
  if (!luuMuc.length) return { viec: null, luu: null }
  const muc: ViecMuc[] = luuMuc.map((x) => {
    const khoa = x.d ?? x.q
    const m = hienTai.get(khoa) ?? { qid: x.q, ...(x.d ? { dotId: x.d } : {}), trangThai: x.t, ...(x.h ? { denHan: x.h } : {}) } as MucChua
    return { m, khoa, loai: x.l, xong: daXong(m, x.l, ghi, nayMs) }
  })
  const chang = chiaChang(muc)
  const xong = muc.filter((x) => x.xong).length
  const tiep = muc.find((x) => !x.xong) ?? null
  const soCan = kq.dem?.can ?? ds.filter((m) => nhomMucChua(m, nayMs) === 'can').length
  const trongCan = muc.filter((x) => nhomMucChua(x.m, nayMs) === 'can').length
  const viec: ViecHomNay = {
    muc, chang, xong, tong: muc.length, tiep,
    changHienTai: tiep ? chang.findIndex((c) => c.some((x) => x.khoa === tiep.khoa)) : chang.length,
    conNgaySau: Math.max(0, soCan - trongCan),
  }
  const doi = them_.length > 0 || (them > (nk.them ?? 0))
  return { viec, luu: doi ? { n: nk.n, m: luuMuc, x: nk.x, them: Math.max(them, nk.them ?? 0) } : null }
}

/** Mở thêm một chặng cho hôm nay (em đã xong phần mà còn muốn sửa). Trả nhật ký mới đã lưu. */
export function themMotChang(kq: Parameters<typeof dungViecHomNay>[0], nayMs = Date.now()): ViecHomNay | null {
  const sbd = docSbdHs()
  const nk = docNhatKy(sbd, nayMs)
  const { viec, luu } = dungViecHomNay(kq, nayMs, sbd, (nk.them ?? 0) + 1)
  if (luu) luuNhatKy(sbd, luu)
  return viec
}

/** Ghi nhật ký do `dungViecHomNay` trả (gọi trong effect). */
export function luuViecHomNay(luu: NhatKy | null): void {
  if (luu) luuNhatKy(docSbdHs(), luu)
}

/** Chữ nhóm chặng cho dòng phụ: "2 câu chỉ còn làm bản mới · 2 câu đang sửa dở". Rỗng khi không có gì đáng nói. */
export function moTaChang(c: readonly ViecMuc[]): string {
  const dem = (l: LoaiViec) => c.filter((x) => x.loai === l && !x.xong).length
  const phan = [
    [dem('gan'), 'chỉ còn làm bản mới'],
    [dem('dang'), 'đang sửa dở'],
    [dem('moi'), 'chưa bắt đầu'],
    [dem('goc'), 'tự làm lại trên câu gốc'],
  ] as const
  return phan.filter(([n]) => n > 0).map(([n, t]) => `${n} câu ${t}`).join(' · ')
}
