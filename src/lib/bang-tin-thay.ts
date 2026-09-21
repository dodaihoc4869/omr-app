// BẢNG TIN CỦA THẦY bản 3 (màn Hôm nay) — MỘT tệp giữ hợp đồng máy chủ, phần còn lại của app chỉ nói chuyện với tệp này.
//   POST /gv/bang-tin {} → { ok, ngay, tu, tuHomNay, tuDangAp, capNhatLuc, nhip, baiTap[], tienBo[], canDeY{ds,conLai}, dangVap[], boNao, mayDaLam[], sucKhoe, lyDoThieu?, soTruyVan }
//   (docs/hop-dong-bang-tin-v3-2109.md, Code 3). Lệnh CHỈ ĐỌC. Mọi con số "hôm nay" chỉ đếm từ mốc `tuHomNay`.
// Luật đọc: khoá vắng = KHÔNG có số thật ⇒ ẩn hoặc ghi "chưa có", không vẽ số 0 giả; sai kiểu ⇒ bỏ dòng ấy, không làm hỏng cả màn; chưa có lệnh (404) ⇒ lời thật, màn rơi về các lệnh cũ.
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import { TIN_HIEU_SAI_NHANH, type KetQuaSaiNhanh } from './tin-hieu-sai-nhanh'
import { gioPhutVN, ngayThuChu, ngayVN } from './em-toan-canh'

export interface NhipBangTin {
  soEmHoc: number
  tongEm: number
  soCau: number
  soCauDung: number | null
  /** 0–1 (máy chủ) — vắng khi `soCau = 0`. */
  tiLeDung: number | null
  /** CHỈ có khi cả ngày hôm qua ≥ mốc; sáng 21–22/09 vắng. */
  homQua: { soEmHoc?: number; soCau?: number; tiLeDung?: number } | null
  /** Dồn về đích (Code 3, khoá `nhip.noTheoLop`): theo lớp, số em đang NỢ chặng bài tập về nhà / sĩ số. Vắng ⇒ null (ẩn, không vẽ 0 giả). */
  noTheoLop: NoTheoLop[] | null
  /** Ô "Bài tập về nhà đúng nhịp" (khoá `nhip.btvnDungNhip`, Code 3): em KHÔNG chậm chặng nào / em có bài đang hiện. Vắng (không em nào có bài) ⇒ null ⇒ ô nói thật "chưa có số liệu". */
  btvnDungNhip: { dungNhip: number; tongEm: number; cham: number } | null
}

export interface NoTheoLop {
  lop: string
  siSo: number
  soEmNo: number
}

/** Một em có tín hiệu "sai rất nhanh rồi đúng lại hôm sau" (khoá `saiNhanh`, đúng `KetQuaSaiNhanh` của Code 1 + sbd/hoTen/tenLop). Chỉ thầy thấy; là số ĐO, không phải nhãn năng lực. */
export interface EmSaiNhanh extends KetQuaSaiNhanh {
  sbd: string
  hoTen: string
  tenLop: string
}

export interface BaiTapBangTin {
  ma: string
  ten: string
  tenLop: string
  nhieuLop: boolean
  hanNop: string
  quaHan: boolean
  tong: number
  chuaMo: number
  dangLam: number
  daNop: number
  /** Chỉ bài cá nhân hoá: số chặng xong trung bình / số chặng trung bình / số em đã chốt bộ. */
  chang: { tbDaXong: number; tong: number; soEm: number } | null
  nhac: { soEm: number; soPhuHuynh: number; luotKe: string } | null
}

export type BucTienBo = 'cham_nhat' | 'tien_bo_nhat' | 'ben_bi_nhat'
export const TEN_BUC: Record<BucTienBo, string> = { cham_nhat: 'Chăm nhất', tien_bo_nhat: 'Tiến bộ nhất', ben_bi_nhat: 'Bền bỉ nhất' }
export interface TienBoBangTin {
  loai: BucTienBo
  sbd: string
  hoTen: string
  tenLop: string
  so: number
  chu: string
  /** Ảnh thần thú của em (nếu máy chủ trả); vắng ⇒ chữ cái đầu. */
  anh: string
}

export interface LyDoBangTin {
  loai: string
  chu: string
  so: number | null
  tong: number | null
}
/** Một lớp có em chưa học hôm nay: số em chưa học / sĩ số + tên (chạm tên ⇒ Toàn cảnh một em). */
export interface LopChuaHoc {
  lop: string
  siSo: number
  chuaHoc: number
  em: { sbd: string; hoTen: string }[]
}

export interface EmCanDeY {
  sbd: string
  hoTen: string
  tenLop: string
  lyDo: LyDoBangTin[]
}

export interface DangVapBangTin {
  ma: string
  ten: string
  soEmVap: number
  soEmGap: number
}

export interface BoNaoBangTin {
  chayLuc: string
  soEmSoi: number | null
  soEmDieuChinh: number | null
  soLoiNhan: number | null
  goiY: { chu: string; tenDang: string }[]
}

export interface ViecMayLam {
  loai: string
  so: number
  soPhuHuynh: number | null
  chu: string
}

export type MucSucKhoe = 'xanh' | 'vang' | 'do'
export interface SucKhoeBangTin {
  muc: MucSucKhoe
  chu: string
}

export interface BangTin {
  ngay: string
  tu: string
  tuHomNay: string
  tuDangAp: boolean
  capNhatLuc: string
  nhip: NhipBangTin
  baiTap: BaiTapBangTin[]
  tienBo: TienBoBangTin[]
  canDeY: { ds: EmCanDeY[]; conLai: number }
  /** Em CHƯA HỌC hôm nay theo lớp (khối `chuaHocHomNay`, Code 3). null = máy chủ chưa trả / không có em nào chưa học ⇒ ẩn (không bịa "cả lớp đã học"). Chỉ thầy thấy tên. */
  chuaHoc: LopChuaHoc[] | null
  /** Em có tín hiệu sai rất nhanh rồi đúng lại (khoá `saiNhanh`, Code 3). null = máy chủ chưa trả / không em nào `co` ⇒ ẩn. */
  saiNhanh: EmSaiNhanh[] | null
  dangVap: DangVapBangTin[]
  boNao: BoNaoBangTin | null
  mayDaLam: ViecMayLam[]
  sucKhoe: SucKhoeBangTin | null
  /** Khối nào máy chủ không tính được ⇒ lý do bằng lời (khoá = tên khối). */
  lyDoThieu: Record<string, string>
}

// ─────────────────────────────── ĐỌC CÓ CHỐNG SAI KIỂU ───────────────────────────────

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const soKhong = (v: unknown): number => so(v) ?? 0
const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const doiTuong = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null)
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

const BUC: readonly BucTienBo[] = ['cham_nhat', 'tien_bo_nhat', 'ben_bi_nhat']
const MUC: readonly MucSucKhoe[] = ['xanh', 'vang', 'do']

/** `nhip.noTheoLop` = `[{lop, siSo, soEmNo}]`: bỏ lớp thiếu tên hoặc soEmNo < 1; sĩ số tối thiểu bằng soEmNo; xếp soEmNo giảm dần; rỗng ⇒ null. */
export function docNoTheoLop(v: unknown): NoTheoLop[] | null {
  const ra: NoTheoLop[] = []
  for (const x of mang(v)) {
    const l = doiTuong(x)
    if (!l) continue
    const ten = chu(l.lop)
    const soEmNo = Math.round(soKhong(l.soEmNo))
    if (!ten || soEmNo < 1) continue
    ra.push({ lop: ten, siSo: Math.max(soEmNo, Math.round(soKhong(l.siSo))), soEmNo })
  }
  ra.sort((a, b) => b.soEmNo - a.soEmNo || a.lop.localeCompare(b.lop, 'vi'))
  return ra.length > 0 ? ra : null
}

/** Khoá `saiNhanh` = `{ds:[{sbd, hoTen, tenLop, soCau, nguongSoCau, nguongGiay, cuaSoNgay, tuNgay, co}]}` (hoặc thẳng mảng). Chỉ em `co` (máy chủ báo, hoặc soCau ≥ ngưỡng); thiếu ngưỡng ⇒ dùng ngưỡng mặc định của Code 1; xếp soCau giảm dần, ≤ 20; rỗng ⇒ null. */
export function docSaiNhanh(v: unknown): EmSaiNhanh[] | null {
  const o = doiTuong(v)
  const ds = Array.isArray(v) ? v : o ? mang(o.ds) : []
  const ra: EmSaiNhanh[] = []
  for (const x of ds) {
    const e = doiTuong(x)
    if (!e || !chu(e.sbd) || !chu(e.hoTen)) continue
    const soCau = Math.max(0, Math.round(soKhong(e.soCau)))
    const nguongSoCau = Math.max(1, Math.round(soKhong(e.nguongSoCau)) || TIN_HIEU_SAI_NHANH.nguongSoCau)
    const nguongGiay = so(e.nguongGiay) ?? TIN_HIEU_SAI_NHANH.nguongGiay
    const cuaSoNgay = Math.max(2, Math.round(soKhong(e.cuaSoNgay)) || TIN_HIEU_SAI_NHANH.cuaSoNgay)
    const co = typeof e.co === 'boolean' ? e.co : soCau >= nguongSoCau
    if (!co || soCau < 1) continue
    ra.push({ sbd: chu(e.sbd), hoTen: chu(e.hoTen), tenLop: chu(e.tenLop), soCau, nguongSoCau, nguongGiay, cuaSoNgay, tuNgay: chu(e.tuNgay), co: true })
  }
  ra.sort((a, b) => b.soCau - a.soCau || a.hoTen.localeCompare(b.hoTen, 'vi'))
  return ra.length > 0 ? ra.slice(0, 20) : null
}

/** `nhip.btvnDungNhip = {dungNhip, tongEm, cham}`: số nguyên không âm, tongEm ≥ 1, dungNhip ≤ tongEm — sai dạng ⇒ null (không dựng ô từ số vô lý). */
export function docBtvnDungNhip(v: unknown): NhipBangTin['btvnDungNhip'] {
  const o = doiTuong(v)
  if (!o) return null
  const d = so(o.dungNhip), t = so(o.tongEm)
  if (d === null || t === null || !Number.isInteger(d) || !Number.isInteger(t) || d < 0 || t < 1 || d > t) return null
  const c = so(o.cham)
  return { dungNhip: d, tongEm: t, cham: c !== null && Number.isInteger(c) && c >= 0 ? c : t - d }
}

function docNhip(v: unknown): NhipBangTin | null {
  const o = doiTuong(v)
  if (!o) return null
  const homQuaO = doiTuong(o.homQua)
  const homQua = homQuaO
    ? {
        ...(so(homQuaO.soEmHoc) != null ? { soEmHoc: so(homQuaO.soEmHoc)! } : {}),
        ...(so(homQuaO.soCau) != null ? { soCau: so(homQuaO.soCau)! } : {}),
        ...(so(homQuaO.tiLeDung) != null ? { tiLeDung: so(homQuaO.tiLeDung)! } : {}),
      }
    : null
  return {
    soEmHoc: soKhong(o.soEmHoc),
    tongEm: soKhong(o.tongEm),
    soCau: soKhong(o.soCau),
    soCauDung: so(o.soCauDung),
    tiLeDung: so(o.tiLeDung),
    homQua: homQua && Object.keys(homQua).length > 0 ? homQua : null,
    noTheoLop: docNoTheoLop(o.noTheoLop),
    btvnDungNhip: docBtvnDungNhip(o.btvnDungNhip),
  }
}

function docBaiTap(x: unknown): BaiTapBangTin | null {
  const o = doiTuong(x)
  if (!o || !chu(o.ten)) return null
  const chuaMo = soKhong(o.chuaMo)
  const dangLam = soKhong(o.dangLam)
  const daNop = soKhong(o.daNop)
  const c = doiTuong(o.chang)
  const n = doiTuong(o.nhac)
  return {
    ma: chu(o.maBtvn) || chu(o.ten),
    ten: chu(o.ten),
    tenLop: chu(o.tenLop),
    nhieuLop: o.nhieuLop === true,
    hanNop: chu(o.hanNop),
    quaHan: o.quaHan === true,
    // `tong` là tổng ba ô; nếu máy chủ không gửi thì cộng lại — nhưng không bao giờ nhỏ hơn tổng ba ô (thanh xếp chồng phải khớp số).
    tong: Math.max(soKhong(o.tong), chuaMo + dangLam + daNop),
    chuaMo,
    dangLam,
    daNop,
    chang: c && so(c.tbDaXong) != null && so(c.tong) != null ? { tbDaXong: so(c.tbDaXong)!, tong: so(c.tong)!, soEm: soKhong(c.soEm) } : null,
    nhac: n ? { soEm: soKhong(n.soEm), soPhuHuynh: soKhong(n.soPhuHuynh), luotKe: chu(n.luotKe) } : null,
  }
}

function docTienBo(x: unknown): TienBoBangTin | null {
  const o = doiTuong(x)
  if (!o) return null
  const loai = chu(o.loai) as BucTienBo
  if (!BUC.includes(loai) || so(o.so) == null || !chu(o.sbd)) return null
  return { loai, sbd: chu(o.sbd), hoTen: chu(o.hoTen) || `SBD ${chu(o.sbd)}`, tenLop: chu(o.tenLop), so: so(o.so)!, chu: chu(o.chu), anh: chu(o.anh) }
}

function docEmCanDeY(x: unknown): EmCanDeY | null {
  const o = doiTuong(x)
  if (!o || !chu(o.sbd)) return null
  const lyDo = mang(o.lyDo)
    .map((l): LyDoBangTin | null => {
      const d = doiTuong(l)
      return d && chu(d.chu) ? { loai: chu(d.loai), chu: chu(d.chu), so: so(d.so), tong: so(d.tong) } : null
    })
    .filter((l): l is LyDoBangTin => l != null)
  return { sbd: chu(o.sbd), hoTen: chu(o.hoTen) || `SBD ${chu(o.sbd)}`, tenLop: chu(o.tenLop), lyDo }
}

function docDangVap(x: unknown): DangVapBangTin | null {
  const o = doiTuong(x)
  if (!o || !chu(o.ten)) return null
  const gap = soKhong(o.soEmGap)
  return { ma: chu(o.ma) || chu(o.ten), ten: chu(o.ten), soEmVap: soKhong(o.soEmVap), soEmGap: gap }
}

function docBoNao(v: unknown): BoNaoBangTin | null {
  const o = doiTuong(v)
  if (!o) return null
  return {
    chayLuc: chu(o.chayLuc),
    soEmSoi: so(o.soEmSoi),
    soEmDieuChinh: so(o.soEmDieuChinh),
    soLoiNhan: so(o.soLoiNhan),
    goiY: mang(o.goiY)
      .map((g) => {
        const d = doiTuong(g)
        return d && chu(d.chu) ? { chu: chu(d.chu), tenDang: chu(d.tenDang) } : null
      })
      .filter((g): g is { chu: string; tenDang: string } => g != null)
      .slice(0, 2),
  }
}

/** Dòng "máy đã làm": ưu tiên câu sẵn của máy chủ (`chu`); chỉ dòng có số > 0 (đúng hợp đồng). */
function docViec(x: unknown): ViecMayLam | null {
  const o = doiTuong(x)
  if (!o) return null
  const n = so(o.so)
  if (n == null || n <= 0 || !chu(o.chu)) return null
  return { loai: chu(o.loai), so: n, soPhuHuynh: so(o.soPhuHuynh), chu: chu(o.chu) }
}

function docSucKhoe(v: unknown): SucKhoeBangTin | null {
  const o = doiTuong(v)
  const muc = o ? (chu(o.muc) as MucSucKhoe) : ('' as MucSucKhoe)
  return o && MUC.includes(muc) && chu(o.chu) ? { muc, chu: chu(o.chu) } : null
}

/** Khối `chuaHocHomNay` = `{ ngay, theoLop:[{ lop, siSo, chuaHoc, em:[{sbd, hoTen}] }] }` (hoặc thẳng mảng lớp). Lớp không có em nào chưa học hoặc sai dạng bị bỏ; rỗng ⇒ null. */
export function docChuaHoc(v: unknown): LopChuaHoc[] | null {
  const o = doiTuong(v)
  const ds = Array.isArray(v) ? v : o ? mang(o.theoLop) : []
  const ra: LopChuaHoc[] = []
  for (const x of ds) {
    const l = doiTuong(x)
    if (!l) continue
    const ten = chu(l.lop)
    const em = mang(l.em).flatMap((e) => {
      const d = doiTuong(e)
      return d && chu(d.sbd) && chu(d.hoTen) ? [{ sbd: chu(d.sbd), hoTen: chu(d.hoTen) }] : []
    })
    if (!ten || em.length === 0) continue
    const chuaHoc = Math.max(em.length, Math.round(soKhong(l.chuaHoc)))
    ra.push({ lop: ten, siSo: Math.max(chuaHoc, Math.round(soKhong(l.siSo))), chuaHoc, em })
  }
  return ra.length > 0 ? ra : null
}

/** Không đọc được phần `nhip` (luôn phải có) ⇒ null: màn rơi về lệnh cũ, không vẽ bảng tin rỗng như thể "hôm nay không ai học". */
export function docBangTin(j: Record<string, unknown>): BangTin | null {
  const nhip = docNhip(j.nhip)
  if (!nhip) return null
  const cd = doiTuong(j.canDeY)
  const dsCanDeY = cd ? mang(cd.ds) : mang(j.canDeY)
  const lyDoThieu: Record<string, string> = {}
  const lt = doiTuong(j.lyDoThieu)
  if (lt) for (const [k, v] of Object.entries(lt)) if (chu(v)) lyDoThieu[k] = chu(v)
  const tu = chu(j.tu)
  return {
    ngay: chu(j.ngay),
    tu,
    tuHomNay: chu(j.tuHomNay) || tu,
    tuDangAp: j.tuDangAp === true,
    capNhatLuc: chu(j.capNhatLuc),
    nhip,
    baiTap: mang(j.baiTap).map(docBaiTap).filter((b): b is BaiTapBangTin => b != null),
    tienBo: mang(j.tienBo).map(docTienBo).filter((t): t is TienBoBangTin => t != null).slice(0, 3),
    canDeY: {
      ds: dsCanDeY.map(docEmCanDeY).filter((e): e is EmCanDeY => e != null),
      conLai: Math.max(0, Math.round(soKhong(cd ? cd.conLai : j.canDeYConLai))),
    },
    chuaHoc: docChuaHoc(j.chuaHocHomNay),
    saiNhanh: docSaiNhanh(j.saiNhanh),
    dangVap: mang(j.dangVap).map(docDangVap).filter((d): d is DangVapBangTin => d != null),
    boNao: docBoNao(j.boNao),
    mayDaLam: mang(j.mayDaLam).map(docViec).filter((v): v is ViecMayLam => v != null),
    sucKhoe: docSucKhoe(j.sucKhoe),
    lyDoThieu,
  }
}

export async function layBangTin(): Promise<KetQuaLenh<BangTin>> {
  const r = await goiLenh('/gv/bang-tin', {}, 'Máy chủ chưa có lệnh Bảng tin bản mới — đang hiện bản cũ.')
  if (!r.ok) return r
  const bt = docBangTin(r.du as Record<string, unknown>)
  if (!bt) return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả Bảng tin không đúng dạng — đang hiện bản cũ.' }
  return { ok: true, du: bt }
}

// ─────────────────────────────── CHỮ HIỂN THỊ ───────────────────────────────

/** "trưa" / "sáng"… cho câu "Từ 12:00 trưa nay …" (giờ 24, không AM/PM). */
export function buoiCuaGio(gio: string): string {
  const h = Number(gio.split(':')[0])
  if (!Number.isFinite(h)) return ''
  if (h < 11) return 'sáng'
  if (h < 14) return 'trưa'
  if (h < 18) return 'chiều'
  return 'tối'
}

/** Nhãn mốc ở đầu trang (bản vẽ thầy chốt): "Từ 12:00 · Thứ Hai 21/09/2026" khi mốc rơi vào giữa hôm nay; còn lại "Hôm nay · Thứ Ba 22/09/2026". */
export function chuMocDau(bt: Pick<BangTin, 'tuHomNay' | 'tuDangAp'>, nayMs: number): string {
  const homNay = ngayVN(nayMs)
  const ngayMoc = ngayVN(bt.tuHomNay)
  const gio = gioPhutVN(bt.tuHomNay)
  if (bt.tuDangAp && ngayMoc === homNay && gio && gio !== '00:00') return `Từ ${gio} · ${ngayThuChu(homNay)}`
  return `Hôm nay · ${ngayThuChu(homNay)}`
}

/** Mốc bắt đầu của bảng tin, dùng trong câu trạng thái rỗng: "Từ 12:00 trưa nay" / "Hôm nay". */
export function chuTuMoc(bt: Pick<BangTin, 'tuHomNay' | 'tuDangAp'>, nayMs: number): string {
  const gio = gioPhutVN(bt.tuHomNay)
  if (bt.tuDangAp && ngayVN(bt.tuHomNay) === ngayVN(nayMs) && gio && gio !== '00:00') return `Từ ${gio} ${buoiCuaGio(gio)} nay`
  return 'Hôm nay'
}

/** Cụm "tính từ 12:00 trưa" cho dòng phụ số lớn; mốc là 00:00 ⇒ "tính trong hôm nay". */
export function chuTinhTu(bt: Pick<BangTin, 'tuHomNay' | 'tuDangAp'>, nayMs: number): string {
  const gio = gioPhutVN(bt.tuHomNay)
  if (bt.tuDangAp && ngayVN(bt.tuHomNay) === ngayVN(nayMs) && gio && gio !== '00:00') return `tính từ ${gio} ${buoiCuaGio(gio)}`
  return 'tính trong hôm nay'
}

export const phanTramTiLe = (t: number | null | undefined): number | null => (t == null ? null : Math.round(t * 100))

/** Hạn nộp cho dòng bài tập (giờ 24): "Hạn nộp 12:00 Thứ Sáu 25/09" · đã quá ⇒ "Quá hạn nộp 12:00 Thứ Sáu 25/09". Không có hạn hợp lệ ⇒ ''. */
export function chuHanNop(iso: string, quaHan = false): string {
  const ngay = ngayVN(iso)
  if (!ngay) return ''
  const [, m, d] = ngay.split('-')
  const thu = ngayThuChu(ngay).split(' ').slice(0, 2).join(' ')
  return `${quaHan ? 'Quá hạn nộp' : 'Hạn nộp'} ${gioPhutVN(iso)} ${thu} ${d}/${m}`
}
