// ĐIỂM DANH + NHỊP HỌC CỦA LỚP (thầy 12/10 duyệt bản vẽ: "mỗi buổi lên lớp học sinh sẽ làm điểm danh đầu tiên, khi học sinh điểm danh xong sẽ hiện
// luôn thống kê lười và chăm chỉ rõ ràng đầy đủ trong bản chiếu"). PHÉP THUẦN (test gọi thẳng — tests/diem-danh-nhip-1210c.test.tsx):
//   · em của buổi = danh sách lớp của buổi (`lopEm` đúng lớp) ∪ em có mặt (em học ghép lớp khác vẫn hiện);
//   · nhóm từng em CHỈ lấy từ lệnh CHỈ ĐỌC `/gv/nhip-hoc` qua `phanNhomEm` của `nhip-hoc-thay.ts` (luật nhóm ở đó — làn khác giữ, tệp này chỉ dùng);
//     em không có trong trả lời ⇒ "chưa có số" (ô tên vẫn hiện, không màu nhóm — không bịa nhóm);
//   · em vắng = em đúng lớp của buổi chưa có trong danh sách có mặt (`emVangBuoi`; buổi "Mọi lớp" ⇒ không tính vắng);
//   · ba cột của bản chiếu Nhịp học: Chăm xếp số ngày đủ mức GIẢM dần, Chưa đều giảm dần, Lười TĂNG dần (cùng số ⇒ bỏ liền dài hơn trước).
//   · 13/10 (thầy: "Hiện bậc trên màn chiếu luôn nhé"): mỗi em mang `bacCham` (bậc 1–12, CHỈ THÊM) — đúng số `phanNhomEm` đã đọc chặt + kiểm khớp nhóm;
//     em chưa đủ dữ liệu / máy chủ cũ ⇒ vắng (không chip). Đếm số em mỗi bậc: `demTheoBac` (nhip-hoc-thay.ts).
import type { TrangThaiBuoi } from './buoi-hoc-api'
import { LUAT_NHOM_NHIP, phanNhomEm, type DongNhipHoc, type KetQuaNhipHoc } from './nhip-hoc-thay'
import type { KetQuaBac } from './bac-cham-chi'

/** Hai bản chiếu: đang điểm danh · Nhịp học của lớp. */
export type CheDoChieu = 'diem-danh' | 'nhip-lop'
/** Số nhịp học của bước 1 (một lệnh `/gv/nhip-hoc`); lỗi ⇒ giữ số cũ + câu nói thật. */
export interface TrangThaiNhip {
  kq: KetQuaNhipHoc | null
  dangTai: boolean
  loi: string
}

/** Luật thoát nhóm Lười thầy chốt 12/10 ("6 ngày liền làm đủ mới thoát nhóm lười") — chỉ để VIẾT chữ chú giải; phép chia nhóm nằm ở `nhip-hoc-thay.ts`. */
export const NGAY_LIEN_THOAT_LUOI = 6

/** Em VẮNG của buổi: em thuộc đúng lớp của buổi mà chưa có trong danh sách có mặt. Buổi "Mọi lớp" hoặc chưa có danh sách lớp ⇒ rỗng (không đoán). */
export function emVangBuoi(tt: Pick<TrangThaiBuoi, 'buoi' | 'lopEm' | 'coMat'> | null): { sbd: string; hoTen: string }[] {
  const lop = (tt?.buoi.lop ?? '').trim()
  if (!tt || !lop || !tt.lopEm) return []
  const co = new Set(tt.coMat.map((e) => e.sbd))
  return tt.lopEm.filter((e) => e.tenLop === lop && !co.has(e.sbd)).map((e) => ({ sbd: e.sbd, hoTen: e.hoTen }))
}

/** Nhịp học từng em theo SBD (mọi em của trả lời — em học ghép lớp khác vẫn tra được). */
export function nhipTheoSbd(kq: KetQuaNhipHoc | null): Map<string, DongNhipHoc> {
  const m = new Map<string, DongNhipHoc>()
  if (!kq) return m
  for (const e of kq.em) if (!m.has(e.sbd)) m.set(e.sbd, phanNhomEm(e, kq.ngay, kq.homNay))
  return m
}

export interface EmBuoi {
  sbd: string
  hoTen: string
  lop: string
  coMat: boolean
  /** Giờ điểm danh (ISO) — chỉ em có mặt. */
  luc: string | null
  cach: 'ma' | 'thay' | null
  /** null = máy chủ không có số nhịp học của em này. */
  nhip: DongNhipHoc | null
  /** 13/10 — bậc 1–12 của em (từ `nhip.bacCham`); vắng ⇒ không chip bậc. */
  bacCham?: KetQuaBac
}

/** Nhóm hiển thị: bốn nhóm của luật + "chưa có số" (không có trong trả lời Nhịp học). "Mới" = chưa đủ 3 ngày để xếp nhóm. */
export type KhoaNhom = 'cham' | 'chua-deu' | 'luoi' | 'moi' | 'chua-co'
export const khoaNhom = (e: Pick<EmBuoi, 'nhip'>): KhoaNhom => (!e.nhip ? 'chua-co' : e.nhip.nhom === 'chua-du' ? 'moi' : e.nhip.nhom)
export const TEN_NHOM: Record<KhoaNhom, string> = { cham: 'Chăm', 'chua-deu': 'Chưa đều', luoi: 'Lười', moi: 'Mới', 'chua-co': 'Chưa có số' }
/** Thứ tự nhóm trên lưới tên của bản chiếu đang điểm danh. */
export const THU_TU_NHOM: readonly KhoaNhom[] = ['cham', 'chua-deu', 'luoi', 'moi', 'chua-co']

/** Em của buổi: lớp của buổi (thứ tự danh sách lớp) rồi em có mặt ngoài lớp (học ghép). Thuần. */
export function emCuaBuoi(tt: Pick<TrangThaiBuoi, 'buoi' | 'lopEm' | 'coMat'> | null, nhip: ReadonlyMap<string, DongNhipHoc>): EmBuoi[] {
  if (!tt) return []
  const lop = tt.buoi.lop.trim()
  const coMat = new Map(tt.coMat.map((e) => [e.sbd, e]))
  const ra: EmBuoi[] = []
  const da = new Set<string>()
  const them = (sbd: string, hoTen: string, tenLop: string) => {
    if (da.has(sbd)) return
    da.add(sbd)
    const c = coMat.get(sbd)
    const n = nhip.get(sbd) ?? null
    ra.push({ sbd, hoTen: (hoTen || c?.hoTen || n?.hoTen || '').trim(), lop: tenLop || n?.lop || '', coMat: !!c, luc: c?.luc ?? null, cach: c?.cach ?? null, nhip: n, ...(n?.bacCham ? { bacCham: n.bacCham } : {}) })
  }
  if (lop) for (const e of tt.lopEm ?? []) if (e.tenLop === lop) them(e.sbd, e.hoTen, e.tenLop)
  for (const e of tt.coMat) them(e.sbd, e.hoTen, tt.lopEm?.find((x) => x.sbd === e.sbd)?.tenLop ?? lop)
  return ra
}

export interface DemNhom {
  tong: number
  cham: number
  chuaDeu: number
  luoi: number
  moi: number
  chuaCo: number
}
export function demNhom(ds: readonly Pick<EmBuoi, 'nhip'>[]): DemNhom {
  const d: DemNhom = { tong: ds.length, cham: 0, chuaDeu: 0, luoi: 0, moi: 0, chuaCo: 0 }
  for (const e of ds) {
    const k = khoaNhom(e)
    if (k === 'cham') d.cham++
    else if (k === 'chua-deu') d.chuaDeu++
    else if (k === 'luoi') d.luoi++
    else if (k === 'moi') d.moi++
    else d.chuaCo++
  }
  return d
}

/** Số em của một nhóm trong bộ đếm. */
export function soNhom(d: DemNhom, k: KhoaNhom): number {
  return k === 'cham' ? d.cham : k === 'chua-deu' ? d.chuaDeu : k === 'luoi' ? d.luoi : k === 'moi' ? d.moi : d.chuaCo
}

const ten = (a: Pick<EmBuoi, 'hoTen' | 'sbd'>, b: Pick<EmBuoi, 'hoTen' | 'sbd'>) => (a.hoTen || a.sbd).localeCompare(b.hoTen || b.sbd, 'vi') || a.sbd.localeCompare(b.sbd)
/** Số ngày liền không làm câu nào (dài nhất) khi đã chạm ngưỡng Lười của luật (3 ngày); dưới ngưỡng ⇒ 0. */
export const soNgayBo = (d: DongNhipHoc | null): number => (d?.chuoiKhongLam && d.chuoiKhongLam.dai >= LUAT_NHOM_NHIP.ngayLienKhongLam ? d.chuoiKhongLam.dai : 0)
/** Lười: số ngày đủ mức TĂNG dần → bỏ liền dài hơn trước → tên. */
export const xepLuoiChieu = (a: EmBuoi, b: EmBuoi): number => (a.nhip?.soNgayDu ?? 0) - (b.nhip?.soNgayDu ?? 0) || soNgayBo(b.nhip) - soNgayBo(a.nhip) || ten(a, b)
/** Chăm / Chưa đều: số ngày đủ mức GIẢM dần → tên. */
export const xepDuGiam = (a: EmBuoi, b: EmBuoi): number => (b.nhip?.soNgayDu ?? 0) - (a.nhip?.soNgayDu ?? 0) || ten(a, b)

export interface ThongKeBuoi {
  ds: EmBuoi[]
  /** Em có mặt — vừa điểm danh đứng trước. */
  coMat: EmBuoi[]
  /** Em vắng — em đang Lười đứng trước (số ngày đủ tăng dần), rồi theo tên. */
  vang: EmBuoi[]
  demCoMat: DemNhom
  demLop: DemNhom
  /** Số em vắng đang ở nhóm Lười. */
  vangLuoi: number
}
/** Mọi số của bước Điểm danh + hai bản chiếu. Thuần. */
export function thongKeBuoi(tt: Pick<TrangThaiBuoi, 'buoi' | 'lopEm' | 'coMat'> | null, nhip: ReadonlyMap<string, DongNhipHoc>): ThongKeBuoi {
  const ds = emCuaBuoi(tt, nhip)
  const coMat = ds.filter((e) => e.coMat).sort((a, b) => (b.luc ?? '').localeCompare(a.luc ?? '') || ten(a, b))
  const vangSbd = new Set(emVangBuoi(tt).map((e) => e.sbd))
  const vang = ds
    .filter((e) => vangSbd.has(e.sbd))
    .sort((a, b) => {
      const la = khoaNhom(a) === 'luoi' ? 0 : 1
      const lb = khoaNhom(b) === 'luoi' ? 0 : 1
      return la - lb || (la === 0 ? xepLuoiChieu(a, b) : ten(a, b))
    })
  return { ds, coMat, vang, demCoMat: demNhom(coMat), demLop: demNhom(ds), vangLuoi: vang.filter((e) => khoaNhom(e) === 'luoi').length }
}

/** Lưới thẻ của bản chiếu đang điểm danh. Đợt 19 (thầy duyệt 13/10 "giữ xếp theo bậc"): XẾP THEO BẬC từ cao xuống (cùng bậc ⇒ điểm chăm cao trước),
 *  em chưa xếp bậc đứng sau; rồi theo nhóm (Chăm → Chưa đều → Lười → Mới → chưa có số), rồi giờ điểm danh (đến trước đứng trước). Máy chủ cũ không
 *  gửi bậc ⇒ đúng cách xếp cũ (nhóm → giờ). */
export function luoiDiemDanh(coMat: readonly EmBuoi[]): EmBuoi[] {
  return [...coMat].sort(
    (a, b) =>
      (b.bacCham?.bac ?? 0) - (a.bacCham?.bac ?? 0) ||
      (b.bacCham?.diem ?? 0) - (a.bacCham?.diem ?? 0) ||
      THU_TU_NHOM.indexOf(khoaNhom(a)) - THU_TU_NHOM.indexOf(khoaNhom(b)) ||
      (a.luc ?? '').localeCompare(b.luc ?? '') ||
      ten(a, b),
  )
}

export interface CotNhip {
  cham: EmBuoi[]
  chuaDeu: EmBuoi[]
  luoi: EmBuoi[]
  /** Mới (chưa đủ 3 ngày) + chưa có số — chỉ đếm trên thanh, không vào ba cột. */
  khac: EmBuoi[]
}
/** Ba cột của bản chiếu Nhịp học của lớp (cả lớp, kể cả em vắng). Thuần. */
export function cotNhipLop(ds: readonly EmBuoi[]): CotNhip {
  const theo = (k: KhoaNhom) => ds.filter((e) => khoaNhom(e) === k)
  return {
    cham: theo('cham').sort(xepDuGiam),
    chuaDeu: theo('chua-deu').sort(xepDuGiam),
    luoi: theo('luoi').sort(xepLuoiChieu),
    khac: ds.filter((e) => khoaNhom(e) === 'moi' || khoaNhom(e) === 'chua-co'),
  }
}

/** "01/10". */
export const ngayNganDd = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`

export interface KhoangNhip {
  tu: string
  /** Ngày đã qua cuối cùng (hôm qua của trả lời); chưa có ngày nào qua ⇒ null. */
  homQua: string | null
  soNgayQua: number
}
export function khoangNhip(kq: Pick<KetQuaNhipHoc, 'tu' | 'ngay' | 'homNay'> | null): KhoangNhip | null {
  if (!kq) return null
  const qua = kq.ngay.filter((d) => d < kq.homNay)
  return { tu: kq.tu, homQua: qua[qua.length - 1] ?? null, soNgayQua: qua.length }
}

/** Chân bản chiếu Nhịp học: hôm qua cả lớp bao nhiêu em đủ mức (trên số em đã vào học hôm qua) · hôm nay đã có bao nhiêu em đủ mức. */
export function homQuaHomNay(ds: readonly EmBuoi[], kq: Pick<KetQuaNhipHoc, 'tu' | 'ngay' | 'homNay'> | null): { homQua: { du: number; tong: number } | null; homNayDu: number | null } {
  const k = khoangNhip(kq)
  if (!k) return { homQua: null, homNayDu: null }
  let du = 0
  let tong = 0
  let homNayDu = 0
  let coHomNay = false
  for (const e of ds) {
    const n = e.nhip
    if (!n) continue
    const o = k.homQua ? n.o.find((x) => x.ngay === k.homQua) : undefined
    if (o && o.loai !== 'chua-vao') {
      tong++
      if (o.lam >= o.muc) du++
    }
    if (n.homNay) {
      coHomNay = true
      if (n.homNay.muc > 0 && n.homNay.lam >= n.homNay.muc) homNayDu++
    }
  }
  return { homQua: k.homQua && tong > 0 ? { du, tong } : null, homNayDu: coHomNay ? homNayDu : null }
}

/** Chữ số ngày đủ mức của một em ("đủ mức 9/11 ngày"); "Mới" ⇒ "mới vào lớp"; không có số ⇒ "chưa có số nhịp học". */
export function chuDuMuc(e: Pick<EmBuoi, 'nhip'>): string {
  const n = e.nhip
  if (!n) return 'chưa có số nhịp học'
  if (n.nhom === 'chua-du') return 'mới vào lớp'
  return `đủ mức ${n.soNgayDu}/${n.soNgayQua} ngày`
}

/** Phần trăm làm tròn (mẫu 0 ⇒ 0). */
export const phanTramDd = (a: number, b: number): number => (b > 0 ? Math.round((100 * a) / b) : 0)

/** Khối của em cho tấm Hồ sơ làm bài: khối trong số nhịp học, không thì hai số đầu của tên lớp ("12A1" ⇒ "12"). */
export function khoiEm(e: Pick<EmBuoi, 'lop' | 'nhip'>): '10' | '11' | '12' | null {
  const k = e.nhip?.khoi || (/^\s*(1[0-2])/.exec(e.lop)?.[1] ?? '')
  return k === '10' || k === '11' || k === '12' ? k : null
}

// ------------------------------------------------------------------ CHỮ (thuần) dùng chung bước 1 + hai bản chiếu

/** "17:58" — giờ Việt Nam (UTC+7, không đổi giờ mùa hè), cùng kiểu ô "Buổi dạy" (`chuBuoi`) — chuẩn A1 luật 6. ISO hỏng ⇒ ''. */
export const gioDd = (iso: string | null): string => {
  const ms = Date.parse(iso ?? '')
  return Number.isFinite(ms) ? new Date(ms + 7 * 3600_000).toISOString().slice(11, 16) : ''
}
/** Chữ chip nhóm của một em ("Lười · 0/11", "Mới", "Chưa có số"). */
export function chuChip(e: Pick<EmBuoi, 'nhip'>): string {
  const k = khoaNhom(e)
  if (k === 'moi' || k === 'chua-co' || !e.nhip) return TEN_NHOM[k]
  return `${TEN_NHOM[k]} · ${e.nhip.soNgayDu}/${e.nhip.soNgayQua}`
}
/** Câu đọc màn hình của một nút tên em. `bac` (13/10, tuỳ chọn) = chữ bậc đã dựng ("Bậc 3/12 · Vua Ngủ Nướng") ⇒ chèn sau nhóm. */
export function chuNutEm(e: EmBuoi, bac?: string): string {
  const k = khoaNhom(e)
  const nhom = !e.nhip ? 'chưa có số nhịp học' : k === 'moi' ? 'mới vào lớp, chưa đủ 3 ngày để xếp nhóm' : `${TEN_NHOM[k]}, đủ mức ${e.nhip.soNgayDu}/${e.nhip.soNgayQua} ngày`
  return `${e.hoTen || `SBD ${e.sbd}`}${e.coMat ? '' : ', vắng'}, ${nhom}${bac ? `, ${bac}` : ''} — mở hồ sơ làm bài`
}

