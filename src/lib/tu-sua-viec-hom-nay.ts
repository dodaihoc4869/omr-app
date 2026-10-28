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
//   · MÁY CHỦ GIỮ BẢN CHÍNH (thầy duyệt 28/10 «sửa theo đề xuất», server/src/tu-sua-viec-ngay.ts): danh sách Tự sửa lỗi kèm `viecNgay` (cùng lô đọc) ⇒ gộp với
//     bản trên máy (danh sách DÀI hơn thắng, bằng nhau thì bản máy chủ — đổi máy vẫn cùng 12 câu; «đã xong» hợp lại); bản gộp mới hơn máy chủ ⇒ gửi NỀN
//     (`dayViecNgay`, gom 400 ms, không chờ). localStorage giữ làm bản đệm (mất mạng / máy chủ cũ vẫn đúng như trước).
import type { MucChua, ViecNgayMayChu } from './chua-cau-sai-api'
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
  /** Số câu ĐÃ TỰ SỬA hôm nay (máy chủ đếm, `dem.xongHomNay`; chữa câu gọn 25/10). */
  xongHomNay?: number
}
export interface MucLuu { q: string; d?: string; t: string; h?: string; l: LoaiViec }
export interface NhatKy { n: string; m: MucLuu[]; x: string[]; them?: number }

export const khoaMuc = (m: Pick<MucChua, 'dotId' | 'qid'>) => m.dotId ?? m.qid
export const ngayVnTuSua = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)

/** Loại việc của một mục; mục không còn việc (đã tự sửa, đang chờ chưa tới giờ) ⇒ null.
 *  Chữa câu gọn (thầy 25/10): MỘT đường sửa cho mọi câu (ChuaGon) ⇒ mọi câu cần sửa cùng một loại 'goc' (các loại cũ chỉ còn để đọc nhật ký đã lưu). */
export function loaiViec(m: Pick<MucChua, 'trangThai' | 'denHan'>, nayMs: number): LoaiViec | null {
  return nhomMucChua(m, nayMs) === 'can' ? 'goc' : null
}

/** Thứ tự trong ngày (chữa câu gọn 25/10): câu sai TRƯỚC hôm nay lên đầu (mới nhất trước — làm đúng là "Đã tự sửa" ngay),
 *  câu vừa sai HÔM NAY xuống cuối (cùng ngày chỉ tính xong phần). Thiếu mốc sai ⇒ đứng giữa. */
export function hangSai(m: Pick<MucChua, 'saiLuc'>, nayMs: number): number {
  const dau = Date.parse(`${ngayVnTuSua(nayMs)}T00:00:00+07:00`)
  if (!m.saiLuc) return 1
  return m.saiLuc >= dau ? 2 : 0
}

/** Em đã xong phần hôm nay của mục này chưa: có ghi lúc nộp, hoặc trạng thái đã vượt chặng cuối làm được (không áp cho câu chỉ có lối câu gốc). */
function daXong(m: MucChua, loai: LoaiViec, ghi: ReadonlySet<string>, nayMs: number): boolean {
  // Khớp cả MÃ CÂU (25/10 video thầy: kẹt 11/12): mục của ngày mang mã đợt cũ / chưa có đợt, còn mở câu thì máy chủ trả đợt khác (đã tự sửa) ⇒ ghi theo mã đợt mới
  // không bao giờ khớp ⇒ "Sửa tiếp" mở lại đúng câu ấy mãi. Màn chữa ghi thêm mã câu (đúng `qid` của mục) ⇒ khép được.
  if (ghi.has(khoaMuc(m)) || ghi.has(m.qid)) return true
  if (m.trangThai === 'da_tu_sua') return true
  // 28/10 (video thầy 20:09: «Câu sai số 9 · Cần sửa» mở ra «Đang chờ kiểm lại · lịch 20:02 29-10» ⇒ kẹt 11/12, chặng sau khoá mãi): câu kiểm lại sau Hỏi thầy
  // chỉ chờ lịch ôn chung — hôm nay em không còn gì để làm ở đây ⇒ coi như xong phần.
  if (m.kiemHoiThay) return true
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
function docTokenHs(): string {
  try {
    const o = JSON.parse(localStorage.getItem(KHOA_PHIEN) || 'null') as { token?: unknown } | null
    return typeof o?.token === 'string' ? o.token : ''
  } catch { return '' }
}
/** Gộp bản trên máy với bản máy chủ CÙNG ngày: mục — dài hơn thắng (bằng nhau ⇒ máy chủ); «đã xong» — hợp; chặng thêm — lớn nhất. */
export function hopNhatKy(nk: NhatKy, may: ViecNgayMayChu | null | undefined): NhatKy {
  if (!may || may.n !== nk.n) return nk
  const m = may.m.length >= nk.m.length && may.m.length > 0 ? may.m.map((x): MucLuu => ({ q: x.q, ...(x.d ? { d: x.d } : {}), t: x.t, ...(x.h ? { h: x.h } : {}), l: x.l })) : nk.m
  const x = [...new Set([...nk.x, ...may.x])]
  const them = Math.max(nk.them ?? 0, may.them)
  return { n: nk.n, m, x, ...(them > 0 ? { them } : {}) }
}
const giongNhatKy = (a: NhatKy, b: NhatKy) => a.n === b.n && (a.them ?? 0) === (b.them ?? 0) && a.x.length === b.x.length && a.x.every((k) => b.x.includes(k))
  && a.m.length === b.m.length && a.m.every((x, i) => (x.d ?? x.q) === (b.m[i]!.d ?? b.m[i]!.q))
/** Bản `nk` có gì máy chủ chưa có (mục dài hơn, câu xong mới, thêm chặng)? */
function canDay(nk: NhatKy, may: ViecNgayMayChu | null | undefined): boolean {
  if (!nk.m.length && !nk.x.length) return false
  if (!may || may.n !== nk.n) return true
  return nk.m.length > may.m.length || (nk.them ?? 0) > may.them || nk.x.some((k) => !may.x.includes(k))
}
let choDay: { nk: NhatKy; h: ReturnType<typeof setTimeout> } | null = null
let daDay = ''
/** Gửi NỀN bản việc hôm nay lên máy chủ (gom 400 ms; trùng bản vừa gửi ⇒ bỏ). Không phiên / lỗi mạng ⇒ bỏ qua — bản đệm trên máy vẫn đúng. */
export function dayViecNgay(nk: NhatKy | null): void {
  if (!nk) return
  if (choDay) clearTimeout(choDay.h)
  choDay = { nk, h: setTimeout(() => {
    const v = choDay?.nk
    choDay = null
    const token = docTokenHs()
    if (!v || !token) return
    const ky = JSON.stringify([v.n, v.m.map((x) => x.d ?? x.q), [...v.x].sort(), v.them ?? 0])
    if (ky === daDay) return
    daDay = ky
    void import('./chua-cau-sai-api').then((m) => m.apiGhiViecNgay(token, { n: v.n, m: v.m, x: v.x, them: v.them ?? 0 }))
      .then((ok) => { if (!ok && daDay === ky) daDay = '' }, () => { if (daDay === ky) daDay = '' })
  }, 400) }
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
  const moi = { ...nk, x: [...nk.x, dotId] }
  luuNhatKy(sbd, moi)
  dayViecNgay(moi)
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
  kq: { trangThai: string; ds?: readonly MucChua[]; dem?: { can: number; xongHomNay?: number }; viecNgay?: ViecNgayMayChu } | null | undefined,
  nayMs: number,
  sbd: string,
  them = 0,
): { viec: ViecHomNay | null; luu: NhatKy | null; day?: NhatKy | null } {
  if (!kq || kq.trangThai !== 'bat' || !kq.ds) return { viec: null, luu: null }
  const ds = kq.ds
  const nkMay = docNhatKy(sbd, nayMs)
  const nk = hopNhatKy(nkMay, kq.viecNgay)
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
      .filter((x): x is { m: MucChua; i: number; l: LoaiViec } => x.l !== null && !x.m.kiemHoiThay && !co.has(khoaMuc(x.m)))
      .sort((a, b) => THU_TU[a.l] - THU_TU[b.l] || hangSai(a.m, nayMs) - hangSai(b.m, nayMs)
        || (a.l === 'goc' ? truoc(lanCuoi[khoaMuc(a.m)] ?? '', lanCuoi[khoaMuc(b.m)] ?? '') : 0) || (b.m.saiLuc ?? 0) - (a.m.saiLuc ?? 0) || a.i - b.i)
      .slice(0, soMuc - nk.m.length)
    for (const x of ung) them_.push({ q: x.m.qid, ...(x.m.dotId ? { d: x.m.dotId } : {}), t: x.m.trangThai, ...(x.m.denHan ? { h: x.m.denHan } : {}), l: x.l })
  }
  const luuMuc = [...nk.m, ...them_]
  if (!luuMuc.length) return { viec: null, luu: null, day: null }
  const muc: ViecMuc[] = luuMuc.map((x) => {
    const khoa = x.d ?? x.q
    const m = hienTai.get(khoa) ?? { qid: x.q, ...(x.d ? { dotId: x.d } : {}), trangThai: x.t, ...(x.h ? { denHan: x.h } : {}) } as MucChua
    return { m, khoa, loai: x.l, xong: daXong(m, x.l, ghi, nayMs) }
  })
  // Câu chờ kiểm lại đã nằm trong việc hôm nay ⇒ ghi vào «đã xong» (máy chủ đếm cùng tập này khi khoá chặng sau Sửa lỗi — TU_SUA_TRUOC).
  const tuXong = muc.filter((x) => x.m.kiemHoiThay && !ghi.has(x.khoa)).map((x) => x.khoa)
  const chang = chiaChang(muc)
  const xong = muc.filter((x) => x.xong).length
  const tiep = muc.find((x) => !x.xong) ?? null
  const soCan = kq.dem?.can ?? ds.filter((m) => nhomMucChua(m, nayMs) === 'can').length
  const trongCan = muc.filter((x) => nhomMucChua(x.m, nayMs) === 'can').length
  const viec: ViecHomNay = {
    muc, chang, xong, tong: muc.length, tiep,
    changHienTai: tiep ? chang.findIndex((c) => c.some((x) => x.khoa === tiep.khoa)) : chang.length,
    conNgaySau: Math.max(0, soCan - trongCan),
    ...(kq.dem?.xongHomNay ? { xongHomNay: kq.dem.xongHomNay } : {}),
  }
  const doi = them_.length > 0 || (them > (nk.them ?? 0)) || tuXong.length > 0
  const cuoi: NhatKy = doi ? { n: nk.n, m: luuMuc, x: [...nk.x, ...tuXong], them: Math.max(them, nk.them ?? 0) } : nk
  // Ghi bản đệm khi bản cuối khác bản đang nằm trên máy (thêm câu, hoặc vừa nhận bản máy chủ); gửi máy chủ khi máy chủ còn thiếu.
  return { viec, luu: doi || !giongNhatKy(cuoi, nkMay) ? cuoi : null, day: canDay(cuoi, kq.viecNgay) ? cuoi : null }
}

/** Mở thêm một chặng cho hôm nay (em đã xong phần mà còn muốn sửa). Trả nhật ký mới đã lưu. */
export function themMotChang(kq: Parameters<typeof dungViecHomNay>[0], nayMs = Date.now()): ViecHomNay | null {
  const sbd = docSbdHs()
  const nk = docNhatKy(sbd, nayMs)
  const { viec, luu, day } = dungViecHomNay(kq, nayMs, sbd, (hopNhatKy(nk, kq?.viecNgay).them ?? 0) + 1)
  if (luu) luuNhatKy(sbd, luu)
  dayViecNgay(day ?? null)
  return viec
}

/** Ghi nhật ký do `dungViecHomNay` trả (gọi trong effect); `day` ⇒ gửi nền lên máy chủ. */
export function luuViecHomNay(luu: NhatKy | null, day: NhatKy | null = null): void {
  if (luu) luuNhatKy(docSbdHs(), luu)
  dayViecNgay(day)
}

/** Số câu CÒN PHẢI SỬA HÔM NAY cho nút «Sửa lỗi» trên Lộ trình (thầy duyệt 28/10): việc hôm nay − đã xong phần; 0 ⇒ xong hôm nay (nút ✓).
 *  Chưa dựng được việc hôm nay (chưa có danh sách / vòng chữa tắt) ⇒ null (nơi gọi dùng tối đa 12 trên số cần sửa). */
export const conSuaHomNay = (v: ViecHomNay | null): number | null => (v ? Math.max(0, v.tong - v.xong) : null)
/** Số câu PHẦN NGÀY (12 câu đầu) chưa xong — khoá chặng sau nút Tự sửa lỗi (thầy 28/10 «sửa phải xong mới hiện chặng sau»). «Sửa thêm 1 chặng» nối câu ở CUỐI
 *  ⇒ không làm khoá lại. Cùng phép đếm với máy chủ (`conPhanNgay`, server/src/tu-sua-viec-ngay.ts). */
export const conSuaPhanNgay = (v: ViecHomNay | null): number | null => (v ? v.muc.slice(0, SO_CAU_MOI_NGAY).filter((x) => !x.xong).length : null)
/** Báo máy chủ (nền, một lần / ngày / máy): Lộ trình đang khoá chặng sau nút Tự sửa lỗi ⇒ máy chủ chặn mở chặng bằng lối khác. Lỗi mạng ⇒ lần mở sau báo lại. */
export function baoKhoaSua(nayMs = Date.now()): void {
  const sbd = docSbdHs(), token = docTokenHs(), nk = docNhatKy(sbd, nayMs), khoa = `omr_tu_sua_khoa_${sbd}`
  if (!sbd || !token || !nk.m.length) return
  try { if (localStorage.getItem(khoa) === nk.n) return } catch { /* không đọc được: vẫn báo */ }
  void import('./chua-cau-sai-api').then((m) => m.apiGhiViecNgay(token, { n: nk.n, m: nk.m, x: nk.x, them: nk.them ?? 0 }, true))
    .then((ok) => { if (ok) try { localStorage.setItem(khoa, nk.n) } catch { /* bỏ qua */ } }, () => {})
}

/** Chữ nhóm chặng cho dòng phụ: "2 câu chỉ còn làm bản mới · 2 câu đang sửa dở". Rỗng khi không có gì đáng nói. */
export function moTaChang(c: readonly ViecMuc[]): string {
  const dem = (l: LoaiViec) => c.filter((x) => x.loai === l && !x.xong).length
  // Chữa câu gọn (25/10): một đường cho mọi câu ⇒ một con số.
  const n = dem('gan') + dem('dang') + dem('moi') + dem('goc')
  return n > 0 ? `Còn ${n} câu cần sửa` : ''
}
