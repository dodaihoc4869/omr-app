// NHỊP HỌC TRÊN "HÔM NAY CỦA THẦY" (thầy 12/10 duyệt bản vẽ: "tôi nhìn vào thấy ngay học sinh nào chăm học sinh nào lười").
// Lớp nối + PHÉP THUẦN (test gọi thẳng — tests/nhip-hoc-thay-1210.test.tsx). Chỉ tệp này biết lệnh CHỈ ĐỌC `POST /gv/nhip-hoc` (hợp đồng
// `server/src/nhip-hoc-kieu.ts`, app CHỈ ĐỌC kiểu). Không ném lỗi: trả `KetQuaLenh` với MỘT câu nói thật; trường thiếu / sai kiểu ⇒ bỏ dòng (không bịa số).
//
// LUẬT NHÓM (thầy đã duyệt, `LUAT_NHOM_NHIP`) — tính trên các ngày ĐÃ QUA (không tính hôm nay vì ngày chưa hết), từ ngày vào của em (`ngayVao`, máy
// chủ đã kẹp ≥ 01/10: em vào học muộn không bị tính những ngày trước khi có mặt) tới hôm qua:
//   · Chưa đủ dữ liệu: em có dưới 3 ngày đã qua được tính.
//   · Lười: (số ngày đủ mức ≤ 40% số ngày đã qua, HOẶC có từ 3 ngày liền không làm câu nào) VÀ chuỗi ngày đủ mức liền gần nhất dưới 6 ngày.
//   · Thoát Lười (thầy chốt 12/10: "6 ngày liền làm đủ mới thoát nhóm lười nhé"): chuỗi ngày đủ mức liền gần nhất từ 6 ngày (lùi từ hôm qua; hôm nay
//     đã đủ thì cộng hôm nay) ⇒ ≥ 80% là Chăm, còn lại Chưa đều.
//   · Chăm: số ngày đủ mức ≥ 80% số ngày đã qua (không Lười).
//   · Chưa đều: còn lại.
//   Chồng lấn (≥ 80% mà vẫn có 3 ngày liền không làm — chỉ xảy ra khi em đã qua từ 15 ngày) ⇒ LƯỜI (trừ khi đã đủ 6 ngày liền): ba ngày liền bỏ là
//   việc thầy cần nhắc ngay. So sánh bằng số nguyên (đủ × 100 so với tỉ lệ × số ngày) — không làm tròn ở biên 80% / 40%.
//   PHÉP THUẦN MỘT CHỖ cho cả máy chủ và hai app: `server/src/nhip-hoc-luat.ts` (tệp này chỉ gọi lại, giữ nguyên chữ ký cũ).
// "Có dấu hiệu đối phó" là cờ RIÊNG (máy chủ tính theo lô, đúng ngưỡng `NGUONG_THAI_DO`), độc lập với nhóm.
// ĐỘ TIN CẬY CỦA NHÓM (13/10 đợt 18, máy chủ CHỈ THÊM `doTinCay` / `canThem` mỗi em — cùng phép `/hs/nhip-hoc`): app chỉ ĐỌC và chuyển nguyên vào dòng,
// KHÔNG tính lại, KHÔNG đổi nhóm. Máy chủ cũ không gửi ⇒ trường vắng, màn y như trước.
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import type { DoiPhoChonLap, DoiPhoEm, DoiPhoQuaNhanh, EmNhipHoc, KetQuaNhipHoc, NhomNhip } from '../../server/src/nhip-hoc-kieu'
import { LUAT_NHOM_NHIP } from '../../server/src/nhip-hoc-kieu'
import { nhomNhipTheoLuat, TEN_NHOM_NHIP, tomTatNhip } from '../../server/src/nhip-hoc-luat'
import type { LopBaiHangNgay } from '../../server/src/bai-hang-ngay-kieu'
import { chuCanThem, chuDoTinCay, NGUONG_TIN_CAY } from './nhip-hoc-em'

export type { DoiPhoEm, EmNhipHoc, KetQuaNhipHoc, NhomNhip }
export { LUAT_NHOM_NHIP, NGUONG_TIN_CAY, TEN_NHOM_NHIP }

export const DUONG_NHIP_HOC = '/gv/nhip-hoc'
const CHU_CHUA_CO = 'Máy chủ chưa có lệnh Nhịp học — cần đẩy bản máy chủ mới.'

// ------------------------------------------------------------------ ĐỌC TRẢ LỜI
type O = Record<string, unknown>
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const soKhongAm = (x: unknown): number => Math.max(0, so(x) ?? 0)
const chu = (x: unknown): string => (typeof x === 'string' ? x : '')
const laNgay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const mang = <T>(x: unknown, doc: (v: unknown) => T | null): T[] => (Array.isArray(x) ? x.map(doc).filter((v): v is T => v !== null) : [])
const mangSo = (x: unknown, dai: number): number[] | null => (Array.isArray(x) && x.length === dai && x.every((v) => so(v) !== null && (v as number) >= 0) ? (x as number[]) : null)

function docQuaNhanh(x: unknown): DoiPhoQuaNhanh | null {
  const o = dt(x)
  if (!o || so(o.nhanh) === null || so(o.coGiay) === null) return null
  return { nhanh: soKhongAm(o.nhanh), coGiay: soKhongAm(o.coGiay), dungNhanh: so(o.dungNhanh), dungThuong: so(o.dungThuong), coTuTinh: o.coTuTinh === true }
}
function docChonLap(x: unknown): DoiPhoChonLap | null {
  const o = dt(x)
  if (!o || so(o.trongChuoi) === null || so(o.tong) === null) return null
  return { trongChuoi: soKhongAm(o.trongChuoi), tong: soKhongAm(o.tong), dai: soKhongAm(o.dai), chu: chu(o.chu) }
}
function docDoiPho(x: unknown): DoiPhoEm | null {
  const o = dt(x)
  if (!o) return null
  const quaNhanh = docQuaNhanh(o.quaNhanh)
  const chonLap = docChonLap(o.chonLap)
  const lyDo = mang(o.lyDo, (v) => (typeof v === 'string' && v ? v : null))
  return quaNhanh || chonLap ? { quaNhanh, chonLap, lyDo } : null
}

/** Đọc trả lời `/gv/nhip-hoc` đúng hợp đồng; thiếu khung (tu/den/homNay/ngay/em) ⇒ null. Em có mảng số lệch độ dài ⇒ bỏ em ấy. Thuần. */
export function docNhipHoc(du: O): KetQuaNhipHoc | null {
  if (!laNgay(du.tu) || !laNgay(du.den) || !laNgay(du.homNay) || !Array.isArray(du.ngay) || !Array.isArray(du.em)) return null
  const ngay = du.ngay.filter(laNgay)
  const dp = dt(du.doiPhoDaTinh)
  return {
    ok: true,
    tu: du.tu,
    den: du.den,
    homNay: du.homNay,
    ngay,
    em: mang(du.em, (x): EmNhipHoc | null => {
      const o = dt(x)
      if (!o || typeof o.sbd !== 'string' || !o.sbd) return null
      const muc = mangSo(o.muc, ngay.length)
      const lam = mangSo(o.lam, ngay.length)
      if (!muc || !lam) return null
      const tin = so(o.doTinCay)
      const them = typeof o.canThem === 'string' ? o.canThem.trim() : ''
      return {
        sbd: o.sbd, hoTen: chu(o.hoTen) || o.sbd, lop: chu(o.lop), khoi: chu(o.khoi), ngayVao: laNgay(o.ngayVao) ? o.ngayVao : du.tu as string, muc, lam, doiPho: docDoiPho(o.doiPho),
        // độ tin cậy kẹp 0–99 (không bao giờ ghi 100%); câu "cần thêm" chỉ đi kèm khi có độ tin cậy
        ...(tin !== null ? { doTinCay: Math.max(0, Math.min(99, Math.round(tin))), ...(them ? { canThem: them } : {}) } : {}),
      }
    }),
    lop: mang(du.lop, (x): LopBaiHangNgay | null => {
      const o = dt(x)
      return o && typeof o.tenLop === 'string' && o.tenLop ? { tenLop: o.tenLop, khoi: chu(o.khoi), soEm: soKhongAm(o.soEm) } : null
    }),
    doiPhoDaTinh: { quaNhanh: dp?.quaNhanh !== false, chonLap: dp?.chonLap !== false },
    canhBao: mang(du.canhBao, (x) => (typeof x === 'string' && x ? x : null)),
  }
}

/** Nhịp học của mọi em — MỘT lệnh cho cả màn. */
export async function layNhipHoc(): Promise<KetQuaLenh<KetQuaNhipHoc>> {
  const r = await goiLenh(DUONG_NHIP_HOC, {}, CHU_CHUA_CO)
  if (!r.ok) return r
  const kq = docNhipHoc(r.du)
  return kq ? { ok: true, du: kq } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả Nhịp học không đúng dạng.' }
}

// ------------------------------------------------------------------ PHÉP THUẦN: một em

/** Màu một ô ngày — ĐÚNG bộ bốn mức của bảng Bài hằng ngày (`mucO`), thêm 'chua-vao' cho ngày trước khi em vào học. */
export type LoaiO = 'du' | 'thieu-it' | 'thieu-nhieu' | 'khong-lam' | 'chua-vao'
export interface ONgay {
  ngay: string
  muc: number
  lam: number
  loai: LoaiO
  homNay: boolean
}
export const TEN_LOAI_O: Record<LoaiO, string> = {
  du: 'Đủ mức',
  'thieu-it': 'Thiếu ít (đạt từ nửa mức)',
  'thieu-nhieu': 'Thiếu nhiều',
  'khong-lam': 'Không làm câu nào',
  'chua-vao': 'Trước ngày em vào học',
}

export interface DongNhipHoc {
  sbd: string
  hoTen: string
  lop: string
  khoi: string
  ngayVao: string
  nhom: NhomNhip
  /** Số ngày đã qua được tính (từ ngày vào tới hôm qua). */
  soNgayQua: number
  soNgayDu: number
  soNgayThieu: number
  /** Tổng câu còn thiếu so với mức qua các ngày đã qua được tính. */
  tongCauThieu: number
  soNgayKhongLam: number
  /** Tổng câu đã làm qua các ngày đã qua được tính. */
  tongLam: number
  /** Chuỗi ngày liền không làm câu nào DÀI NHẤT (ngày đã qua; hoà ⇒ chuỗi gần đây hơn); không có ⇒ null. */
  chuoiKhongLam: { dai: number; tu: string; den: string } | null
  /** Chuỗi ngày đủ mức liền GẦN NHẤT (lùi từ hôm qua; hôm nay đã đủ thì cộng hôm nay) — từ 6 ngày thì thoát nhóm Lười. */
  chuoiDuGanNhat: number
  /** Hôm nay tới lúc tải (ngày chưa hết). Khoảng không gồm hôm nay ⇒ null. */
  homNay: { muc: number; lam: number } | null
  /** Mỗi ngày từ đầu khoảng tới hôm nay (dải ô). */
  o: ONgay[]
  doiPho: DoiPhoEm | null
  /** Độ tin cậy 0–99 của `nhom` (máy chủ gửi, cùng phép bảng của em); vắng ⇒ không hiện chip. Dưới `NGUONG_TIN_CAY` ⇒ "đang theo dõi". */
  doTinCay?: number
  /** Câu "cần thêm" của máy chủ khi `doTinCay` dưới 90. */
  canThem?: string
}

const loaiO = (muc: number, lam: number): Exclude<LoaiO, 'chua-vao'> => (lam >= muc ? 'du' : lam <= 0 ? 'khong-lam' : 2 * lam >= muc ? 'thieu-it' : 'thieu-nhieu')

/** Chia nhóm theo luật đầu tệp. `n` = số ngày đã qua được tính, `du` = số ngày đủ mức, `chuoi` = số ngày liền không làm dài nhất,
 *  `chuoiDuGanNhat` (THÊM 12/10, tuỳ chọn — mặc định 0 = chưa xét đường thoát) = chuỗi ngày đủ mức liền gần nhất. */
export function nhomTheoLuat(n: number, du: number, chuoi: number, chuoiDuGanNhat = 0): NhomNhip {
  return nhomNhipTheoLuat(n, du, chuoi, chuoiDuGanNhat)
}

/** Một em ⇒ một dòng Nhịp học (nhóm, số ngày, dải ô). `ngay` = các ngày của trả lời (cùng thứ tự `muc` / `lam`). Thuần. */
export function phanNhomEm(e: EmNhipHoc, ngay: readonly string[], homNay: string): DongNhipHoc {
  const o: ONgay[] = ngay.map((d, i) => {
    const muc = e.muc[i] ?? 0
    const lam = e.lam[i] ?? 0
    const laHomNay = d === homNay
    // hôm nay: đã làm mà chưa đủ ⇒ "đang làm" (tô như thiếu ít, viền hôm nay) — ngày chưa hết nên không coi là thiếu nhiều
    const loai: LoaiO = d < e.ngayVao ? 'chua-vao' : laHomNay && lam > 0 && lam < muc ? 'thieu-it' : loaiO(muc, lam)
    return { ngay: d, muc, lam, loai, homNay: laHomNay }
  })
  // Các ngày được tính (từ ngày vào, gồm hôm nay) ⇒ MỘT phép thuần với máy chủ (`tomTatNhip`, server/src/nhip-hoc-luat.ts).
  const t = tomTatNhip(o.filter((x) => x.loai !== 'chua-vao'), homNay)
  return {
    sbd: e.sbd,
    hoTen: e.hoTen,
    lop: e.lop,
    khoi: e.khoi,
    ngayVao: e.ngayVao,
    nhom: t.nhom,
    soNgayQua: t.soNgayQua,
    soNgayDu: t.soNgayDu,
    soNgayThieu: t.soNgayThieu,
    tongCauThieu: t.tongCauThieu,
    soNgayKhongLam: t.soNgayKhongLam,
    tongLam: t.tongLam,
    chuoiKhongLam: t.chuoiKhongLam,
    chuoiDuGanNhat: t.chuoiDuGanNhat,
    homNay: t.homNay,
    o,
    doiPho: e.doiPho,
    // chuyển nguyên của máy chủ (chỉ khi nhóm đã xếp — 'chua-du' không có độ tin cậy)
    ...(t.nhom !== 'chua-du' && e.doTinCay !== undefined ? { doTinCay: e.doTinCay, ...(e.canThem ? { canThem: e.canThem } : {}) } : {}),
  }
}

// ------------------------------------------------------------------ PHÉP THUẦN: cả danh sách

export interface DemNhom {
  tong: number
  cham: number
  chuaDeu: number
  luoi: number
  chuaDu: number
  doiPho: number
}
export interface DongLop {
  tenLop: string
  khoi: string
  si: number
  cham: number
  chuaDeu: number
  luoi: number
  chuaDu: number
  /** % em lười của lớp (làm tròn). */
  pLuoi: number
}
export interface NhipHocDaTinh {
  dong: DongNhipHoc[]
  dem: DemNhom
  homNay: { du: number; dangLam: number; chuaLam: number } | null
  lop: DongLop[]
  /** Số ngày đã qua của khoảng (từ đầu khoảng tới hôm qua) — số trên chữ điều kiện. */
  soNgayQua: number
}

export const dem = (dong: readonly DongNhipHoc[]): DemNhom => ({
  tong: dong.length,
  cham: dong.filter((d) => d.nhom === 'cham').length,
  chuaDeu: dong.filter((d) => d.nhom === 'chua-deu').length,
  luoi: dong.filter((d) => d.nhom === 'luoi').length,
  chuaDu: dong.filter((d) => d.nhom === 'chua-du').length,
  doiPho: dong.filter((d) => d.doiPho).length,
})

/** Lớp nhiều em lười đứng trước: % lười ↓ → số em lười ↓ → tên lớp. */
export function theoLop(dong: readonly DongNhipHoc[]): DongLop[] {
  const m = new Map<string, DongNhipHoc[]>()
  for (const d of dong) (m.get(d.lop) ?? m.set(d.lop, []).get(d.lop)!).push(d)
  return [...m]
    .map(([tenLop, ds]) => {
      const c = dem(ds)
      return { tenLop, khoi: ds[0]?.khoi ?? '', si: ds.length, cham: c.cham, chuaDeu: c.chuaDeu, luoi: c.luoi, chuaDu: c.chuaDu, pLuoi: Math.round((100 * c.luoi) / ds.length) }
    })
    .sort((a, b) => b.pLuoi - a.pLuoi || b.luoi - a.luoi || a.tenLop.localeCompare(b.tenLop, 'vi'))
}

/** Lọc khối / lớp rồi tính mọi số của khối Nhịp học. `khoi` null = Tất cả; `lop` '' = Mọi lớp. Thuần. */
export function tinhNhipHoc(kq: KetQuaNhipHoc, loc: { khoi: string | null; lop: string }): NhipHocDaTinh {
  const dong = kq.em.filter((e) => (!loc.khoi || e.khoi === loc.khoi) && (!loc.lop || e.lop === loc.lop)).map((e) => phanNhomEm(e, kq.ngay, kq.homNay))
  const coHomNay = kq.ngay.includes(kq.homNay)
  return {
    dong,
    dem: dem(dong),
    homNay: coHomNay
      ? {
          du: dong.filter((d) => d.homNay && d.homNay.lam >= d.homNay.muc).length,
          dangLam: dong.filter((d) => d.homNay && d.homNay.lam > 0 && d.homNay.lam < d.homNay.muc).length,
          chuaLam: dong.filter((d) => d.homNay && d.homNay.lam <= 0 && d.homNay.muc > 0).length,
        }
      : null,
    lop: theoLop(dong),
    soNgayQua: kq.ngay.filter((d) => d < kq.homNay).length,
  }
}

/** Lười nhất · cần nhắc ngay: số ngày thiếu ↓ → tổng câu thiếu ↓ → tên → SBD. */
export const xepLuoi = (a: DongNhipHoc, b: DongNhipHoc): number =>
  b.soNgayThieu - a.soNgayThieu || b.tongCauThieu - a.tongCauThieu || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd)
/** Chăm nhất · đáng khen: số ngày đủ ↓ → số câu đã làm hôm nay ↓ → tên → SBD. */
export const xepCham = (a: DongNhipHoc, b: DongNhipHoc): number =>
  b.soNgayDu - a.soNgayDu || (b.homNay?.lam ?? 0) - (a.homNay?.lam ?? 0) || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd)
/** Mức nặng của cờ đối phó: tỉ lệ cao nhất trong hai tín hiệu (%). */
export const nangDoiPho = (d: DoiPhoEm | null): number =>
  Math.max(d?.quaNhanh && d.quaNhanh.coGiay ? (100 * d.quaNhanh.nhanh) / d.quaNhanh.coGiay : 0, d?.chonLap && d.chonLap.tong ? (100 * d.chonLap.trongChuoi) / d.chonLap.tong : 0)
/** Có dấu hiệu đối phó: tín hiệu nặng hơn trước → tên. */
export const xepDoiPho = (a: DongNhipHoc, b: DongNhipHoc): number => nangDoiPho(b.doiPho) - nangDoiPho(a.doiPho) || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd)

// ------------------------------------------------------------------ CHỮ (thuần)

/** "01/10". */
export const ngayNgan = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
/** "06–09/10" (cùng tháng) · "30/09–02/10". */
export const khoangNgan = (tu: string, den: string): string => (tu === den ? ngayNgan(tu) : tu.slice(0, 7) === den.slice(0, 7) ? `${tu.slice(8, 10)}–${ngayNgan(den)}` : `${ngayNgan(tu)}–${ngayNgan(den)}`)

/** Số ngày tối thiểu để Chăm / tối đa để Lười trên `n` ngày (số nguyên, đúng phép so của `nhomTheoLuat`). */
export const nguongNgay = (n: number) => ({ cham: Math.ceil((LUAT_NHOM_NHIP.chamTu * n) / 100), luoi: Math.floor((LUAT_NHOM_NHIP.luoiDen * n) / 100) })

/** Đường thoát nhóm Lười (thầy 12/10: "6 ngày liền làm đủ mới thoát nhóm lười nhé"). */
export const CHU_THOAT_LUOI = `thoát khi đủ mức ${LUAT_NHOM_NHIP.ngayLienThoatLuoi} ngày liền`

/** Chữ điều kiện dưới mỗi ô nhóm (bản vẽ: "Đủ mức từ 9/11 ngày trở lên"). Chưa đủ 3 ngày ⇒ chữ theo phần trăm. */
export function chuDieuKien(nhom: Exclude<NhomNhip, 'chua-du'>, n: number): string {
  const L = LUAT_NHOM_NHIP
  if (n < L.soNgayToiThieu) {
    return nhom === 'cham' ? `Đủ mức từ ${L.chamTu}% số ngày trở lên` : nhom === 'luoi' ? `Đủ mức từ ${L.luoiDen}% số ngày trở xuống, hoặc ${L.ngayLienKhongLam} ngày liền không làm · ${CHU_THOAT_LUOI}` : `Đủ mức trên ${L.luoiDen}% và dưới ${L.chamTu}% số ngày`
  }
  const g = nguongNgay(n)
  if (nhom === 'cham') return `Đủ mức từ ${g.cham}/${n} ngày trở lên`
  if (nhom === 'luoi') return `Đủ mức ${g.luoi}/${n} ngày trở xuống, hoặc ${L.ngayLienKhongLam} ngày liền không làm · ${CHU_THOAT_LUOI}`
  const a = g.luoi + 1
  const b = g.cham - 1
  return a >= b ? `Đủ mức ${a}/${n} ngày` : `Đủ mức ${a}–${b} ngày trong ${n}`
}

/** Hai dòng chữ bên phải một em ở cột Lười nhất (bản vẽ: "Thiếu 11/11 ngày" · "0 câu từ 01/10" / "4 ngày liền không làm (06–09/10)" / "thiếu 286 câu"). */
export function chuLuoi(d: DongNhipHoc): { chinh: string; phu: string } {
  const chinh = `Thiếu ${d.soNgayThieu}/${d.soNgayQua} ngày`
  if (d.tongLam === 0) return { chinh, phu: `0 câu từ ${ngayNgan(d.ngayVao)}` }
  const c = d.chuoiKhongLam
  // Lười VÌ chuỗi ngày liền không làm (tỉ lệ đủ mức chưa chạm ngưỡng 40%) ⇒ nói đúng lý do ấy
  if (c && c.dai >= LUAT_NHOM_NHIP.ngayLienKhongLam && d.soNgayDu * 100 > LUAT_NHOM_NHIP.luoiDen * d.soNgayQua) return { chinh, phu: `${c.dai} ngày liền không làm (${khoangNgan(c.tu, c.den)})` }
  if (d.soNgayKhongLam * 2 >= d.soNgayQua) return { chinh, phu: `${d.soNgayKhongLam} ngày không làm · làm ${d.tongLam} câu` }
  return { chinh, phu: `thiếu ${d.tongCauThieu} câu` }
}

/** Chữ hôm nay của một em ("hôm nay 30/36 câu" · "hôm nay chưa làm"). */
export const chuHomNayEm = (d: DongNhipHoc): string => (!d.homNay ? '' : d.homNay.lam <= 0 ? 'hôm nay chưa làm' : `hôm nay ${d.homNay.lam}/${d.homNay.muc} câu`)

/** Hai dòng chữ bên phải một em ở cột Chăm nhất. */
export const chuCham = (d: DongNhipHoc): { chinh: string; phu: string } => ({ chinh: `${d.soNgayDu}/${d.soNgayQua} ngày đủ mức`, phu: chuHomNayEm(d) })

/** Câu đầy đủ cho trình đọc màn hình của dải ô ngày. */
export function chuDaiO(d: DongNhipHoc): string {
  const vao = d.o.some((x) => x.loai === 'chua-vao') ? ` (em vào học từ ${ngayNgan(d.ngayVao)})` : ''
  const h = chuHomNayEm(d)
  return `Từ ${ngayNgan(d.o[0]?.ngay ?? d.ngayVao)} tới hôm nay${vao}: ${d.soNgayDu}/${d.soNgayQua} ngày đủ mức${h ? `; ${h}` : ''}`
}

/** Chip độ tin cậy của một dòng em (13/10 đợt 18) — CÙNG chữ với chip của tấm Hồ sơ làm bài và bảng của em: "Độ tin cậy 94%"; dưới
 *  `NGUONG_TIN_CAY` ⇒ "Độ tin cậy 72% · đang theo dõi" + câu "cần thêm" của máy chủ (`giaiThich`: hiện khi trỏ chuột / khi mở rộng cột).
 *  Máy chủ không gửi độ tin cậy (máy chủ cũ, nhóm 'chua-du') ⇒ null (không chip). Thuần. */
export function chipTinCay(d: Pick<DongNhipHoc, 'doTinCay' | 'canThem'>): { chu: string; tam: boolean; giaiThich: string } | null {
  if (d.doTinCay === undefined) return null
  const tam = d.doTinCay < NGUONG_TIN_CAY
  return {
    chu: `${chuDoTinCay(d.doTinCay)}${tam ? ' · đang theo dõi' : ''}`,
    tam,
    giaiThich: !tam
      ? `Kết luận chắc khi độ tin cậy từ ${NGUONG_TIN_CAY}%.`
      : d.canThem
        ? chuCanThem(d.canThem)
        : `Độ tin cậy dưới ${NGUONG_TIN_CAY}%: cần thêm ngày làm bài để chắc.`,
  }
}

/** Câu một ô (chú thích khi trỏ chuột). */
export function chuMotO(x: ONgay): string {
  const ngay = `${ngayNgan(x.ngay)}${x.homNay ? ' (hôm nay, chưa hết ngày)' : ''}`
  if (x.loai === 'chua-vao') return `${ngay}: em chưa vào học`
  return `${ngay}: đã làm ${x.lam}/${x.muc} câu — ${x.lam >= x.muc ? 'đủ mức' : x.homNay ? 'đang làm' : `thiếu ${x.muc - x.lam} câu`}`
}
