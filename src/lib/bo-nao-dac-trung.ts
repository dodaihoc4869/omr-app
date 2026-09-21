// BỘ NÃO — ĐẶC TRƯNG + PHÂN LUỒNG + ĐÁNH GIÁ ĐIỀU CHỈNH (Code 1, 21/09/2026). Tầng T2 "trợ lý số liệu" của `DE-XUAT-BO-NAO-AI-2109.md`.
//
// THUẦN: không IO, không đồng hồ (ngày truyền vào), không `Math.random`. Máy chủ (`server/src/bo-nao.ts`) đọc D1 rồi đưa vào ĐÂY dưới dạng `DauVaoEm`; ở đây tính:
//   · `tinhDacTrung` → THẺ NGẮN (≤ ~300 token, mọi em có hoạt động) và HỒ SƠ ĐẦY ĐỦ (≤ ~1.200 token, em soi kỹ);
//   · `phanLuong`    → `nhanh | sau | vang | bo_qua` kèm LÝ DO BẰNG SỐ; soi kỹ xoay vòng 1/7 tất định theo `sbd` + ngày (tuần nào em nào cũng được soi kỹ đúng một lần);
//   · `danhGiaDieuChinh` → `an_thua | khong_doi | xau_di | chua_du_du_lieu` từ thẻ hôm trước / hôm nay (số đo, không do AI nói);
//   · `tinhBucTranhLop` → bức tranh cả lớp cho `lop.json` (bản tin sáng chỉ được dùng số có trong đó).
// KHÔNG có tên em; thẻ chỉ mang SBD ở phía máy chủ (mã lệnh đổi sang bí danh trước khi AI đọc). Số trong thẻ là NGUỒN DUY NHẤT của mọi con số AI được nói (`kiemKhuon`).
import { hashSeed } from './exam-shuffle'
import type { CoBoNao, KhacPhucEm } from './bo-nao-khuon'

// ══════════════════════════════ HẰNG SỐ (đổi một chỗ; test khoá) ══════════════════════════════

export const NGUONG_BO_NAO = {
  /** Cửa sổ "7 ngày" = từ ngày−7 tới ngày−1 (KHÔNG tính ngày hôm nay: bộ não chạy sáng sớm, hôm nay chưa có gì; thẻ ổn định dù chạy lúc nào). */
  SO_NGAY_CUA_SO: 7,
  SO_NGAY_GAN: 3,
  /** Vắng ≥ bấy nhiêu ngày (kể từ ngày hoạt động cuối) ⇒ luồng `vang`; ≥ `VANG_BAO_THAY` thì thẻ đánh dấu để bản tin BÁO thầy nhắn phụ huynh. */
  VANG_TOI_THIEU: 2,
  VANG_BAO_THAY: 5,
  /** Không hoạt động trong bấy nhiêu ngày (hoặc chưa từng) ⇒ `bo_qua`. */
  KHONG_HOAT_DONG_BO_QUA: 30,
  SO_LUONG_XOAY_VONG: 7,
  /** Tụt nhịp: số câu 3 ngày gần < 50 % số câu TRUNG BÌNH cùng độ dài của 4 ngày trước, và 4 ngày trước ≥ 12 câu. */
  TUT_NHIP_TI_LE: 0.5,
  TUT_NHIP_NEN_TOI_THIEU: 12,
  SAI_LAP_SO_LAN: 3,
  DUNG_NHANH_TI_LE: 0.9,
  DUNG_NHANH_SO_CAU: 6,
  NHANH_TI_LE_GIAY: 0.5,
  LAM_CHO_XONG_TI_LE: 0.5,
  VUA_THI_TU: 1,
  VUA_THI_DEN: 3,
  MOI_VAO_NGAY: 7,
  MAU_GIAY_TOI_THIEU: 5,
  /** Đánh giá điều chỉnh: cần ≥ bấy nhiêu câu làm trong ngày sau điều chỉnh mới đánh giá. */
  DANH_GIA_TOI_THIEU_CAU: 5,
  AN_THUA_TI_LE: 0.7,
  XAU_DI_TI_LE: 0.5,
  XAU_DI_TUT: 0.15,
  AN_THUA_TANG: 0.1,
  XU_HUONG_LECH: 0.1,
  SO_DANG_CHU_Y: 3,
  SO_MA_DANG_TOI_DA: 6,
  SO_DANG_HO_SO: 10,
  SO_CAU_SAI_HO_SO: 8,
} as const
const N = NGUONG_BO_NAO

// ══════════════════════════════ KIỂU ĐẦU VÀO (máy chủ chuyển từ D1) ══════════════════════════════

/** Một dòng sổ sự kiện học (`su_kien_hoc`). `ngay` = `ngay_vn`. */
export interface SuKienNgan {
  qid: string
  /** `btvn` | `btvn_lo` | `on_lai` | `game` | `thi` | `khac_phuc` | `mom` | `len_bang` | `luyen` … */
  nguon: string
  /** 1 đúng · 0 sai · null bỏ trống. */
  ketQua: 0 | 1 | null
  giay: number | null
  ngay: string
}

/** Một câu trong hồ sơ nắm kiến thức (`nam_kt_cau`), chỉ những câu vừa có hoạt động. `dang` đã tra `ma_dang` (hoặc `CD:<chuyên đề>`). */
export interface CauEmNgan {
  qid: string
  dang: string
  lanSai: number
  trangThai: 'chua_thay_sai' | 'moi_sai' | 'dang_on' | 'da_khac_phuc' | null
}

/** Một dạng trong hồ sơ nắm kiến thức (`nam_kt_dang`). */
export interface DangEmNgan {
  ma: string
  bac: 0 | 1 | 2
  soGap: number
  soSai: number
  soDaKhacPhuc: number
  soChuaThaySai: number
}

export interface NgayKeHoachNgan {
  ngay: string
  ketQua: 'dat' | 'mot_phan' | 'khong' | null
  laNgayNghi: boolean
}

export interface DieuChinhDaNop {
  ngay: string
  cheDo: 'bong' | 'that'
  apDung: boolean
  nhip: { lech: number; khoiDong: number }
  dang: { ma: string; hanhDong: 'uu_tien' | 'ha_mot_bac' | 'cho_thu_len_bac' | 'tam_nghi' }[]
  khacPhuc: KhacPhucEm[]
  co: CoBoNao
}

export interface DauVaoEm {
  /** Ngày cần lập hồ sơ (`YYYY-MM-DD`, giờ Việt Nam). */
  ngay: string
  sbd: string
  lop: string
  /** Ngày hoạt động cuối / đầu tiên trong sổ (`ngay_vn`), null = chưa từng. */
  ngayHoatDongCuoi: string | null
  ngayHoatDongDau: string | null
  /** Sự kiện của 14 ngày trước `ngay` (đã lọc `ngay_vn < ngay`). */
  suKien: SuKienNgan[]
  cau: CauEmNgan[]
  dang: DangEmNgan[]
  /** Số câu tới hạn ôn mà chưa ôn (`moc_on_ke ≤ ngay`). */
  noOn: number
  /** Kế hoạch ngày của ≤ 7 ngày trước (chuỗi ngày đạt). */
  keHoach: NgayKeHoachNgan[]
  /** Bài BTVN đang mở của em (chưa nộp, chưa thu hồi). */
  btvn: { changXong: number; tongChang: number | null }[]
  exp: { tong: number | null; cap: number | null }
  /** Ca thi đã nộp gần nhất (điểm thang 10, có thể null nếu chưa chấm). Không có ⇒ null. */
  caGanNhat: { diem: number | null; ngayNop: string } | null
  dieuChinhHomQua: DieuChinhDaNop | null
  /** Thẻ đêm trước của em này (để thấy dạng LÊN BẬC). Vắng ⇒ null. */
  theHomTruoc?: TheNgan | null
  /** ≤ 3 lời nhắn cho em gần nhất (mới nhất trước) — để AI KHÔNG lặp ý / cấu trúc / từ mở đầu. Không phải nguồn số. */
  loiNhanGanDay?: string[]
}

// ══════════════════════════════ KIỂU ĐẦU RA ══════════════════════════════

export type XuHuong = 'len' | 'xuong' | 'on' | 'chua_du'
export type CoThuatToan = 'tut_nhip' | 'bo_do' | 'sai_lap' | 'dung_nhanh' | 'lam_cho_xong' | 'vua_thi' | 'moi_vao' | 'xau_di_hom_qua' | 'vang_lau'

export interface DangChuY {
  ma: string
  gap: number
  sai: number
  bac: 0 | 1 | 2
  /** (khắc phục + chưa từng sai)/đã gặp, 0–1; null khi chưa đủ mẫu (< 4 câu). */
  tiLeKhacPhuc: number | null
  lam7: number
  sai7: number
}

/** MỐC ĐÁNG KHEN (thuật toán tính, có số): lời nhắn xoay quanh mốc. `len_bac`: lần đầu lên bậc ở một dạng (`tu` → `den`) · `dung_lai`: hôm qua đúng lại `soCau` câu từng sai ·
 * `chuoi`: chuỗi `soNgay` ngày đạt (3 / 7 / 14) · `quay_lai`: quay lại học sau `soNgay` ngày vắng · `tu_lam_them`: hôm qua tự luyện thêm `soCau` câu ngoài bài giao. */
export interface MocDangKhen {
  loai: 'len_bac' | 'dung_lai' | 'chuoi' | 'quay_lai' | 'tu_lam_them'
  dang?: string
  tu?: number
  den?: number
  soCau?: number
  soNgay?: number
}

/** THẺ NGẮN (mọi em có hoạt động; ≤ ~300 token). KHÔNG có tên/SBD. `maDang` = mã dạng AI được nêu. */
export interface TheNgan {
  ngay: string
  maDang: string[]
  /** Bậc hiện tại (0 Biết · 1 Hiểu · 2 Vận dụng) của từng dạng trong `maDang`, CÙNG THỨ TỰ — để đêm sau thấy dạng lên bậc. (Mảng song song: không lặp mã dạng cho thẻ gọn.) */
  bacCuaMaDang: (0 | 1 | 2)[]
  hoatDong: { ngayCoBai7: number; soNgayVang: number; soNgayTuLucDau: number | null }
  cau: { lam7: number; dung7: number; sai7: number; tiLe7: number | null; lam3: number; tiLe3: number | null; lam4Truoc: number; lamHomQua: number; dungHomQua: number }
  xuHuong: XuHuong
  giay: { trungVi7: number | null; homQua: number | null }
  nguon: { btvn7: number; btvn2: number; onLai7: number; game7: number; khac7: number }
  chuoi: number
  datNgay7: number
  ngayNghi7: number
  btvn: { baiMo: number; changXong: number; tongChang: number | null }
  noOn: number
  exp: { tong: number | null; cap: number | null }
  ca: { diem: number | null; ngayTruoc: number } | null
  dangChuY: DangChuY[]
  co: CoThuatToan[]
  mocDangKhen: MocDangKhen[]
  /** Hôm nay là lượt soi kỹ hằng tuần của em (được viết thư tuần). */
  luotSoiKyTuan: boolean
  /** Lý do được phép viết lời cho phụ huynh (`KHI_NAO_VIET_PHU_HUYNH`); rỗng ⇒ ngày thường, để rỗng. */
  khiNaoVietPhuHuynh: string[]
  /** ≤ 3 lời nhắn gần nhất cho em (chống lặp). KHÔNG phải nguồn số. */
  loiNhanGanDay: string[]
  /** Kết quả CHẤM điều chỉnh hôm qua (máy chủ gắn sau khi so thẻ đêm trước với thẻ này); chỉ khi em có điều chỉnh hôm qua. Số đo ở đây là nguồn số cho lời nhắn. */
  homQuaDanhGia?: DanhGiaDieuChinh | null
  homQuaDc: {
    lech: number
    khoiDong: number
    dang: { ma: string; hanhDong: string }[]
    khacPhuc: { dang: string; kieu: string }[]
    co: string
    apDung: boolean
  } | null
}

/** HỒ SƠ ĐẦY ĐỦ (em soi kỹ; ≤ ~1.200 token): thẻ + số liệu từng ngày + từng dạng + câu sai gần nhất. */
export interface HoSoDayDu extends TheNgan {
  theoNgay: { ngayTruoc: number; lam: number; dung: number }[]
  dang: (DangChuY & { daKhacPhuc: number; xuHuong: XuHuong })[]
  cauSaiGanDay: { dang: string; lanSai: number; trangThai: string; giay: number | null }[]
}

export type Luong = 'nhanh' | 'sau' | 'vang' | 'bo_qua'
export interface KetQuaPhanLuong {
  luong: Luong
  lyDo: string[]
}

export type KetQuaDieuChinh = 'an_thua' | 'khong_doi' | 'xau_di' | 'chua_du_du_lieu'
export interface DanhGiaDieuChinh {
  ketQua: KetQuaDieuChinh
  /** Câu ngắn do MÁY ghép từ số đo (không do AI viết). */
  chu: string
  so: { lam: number; dung: number; tiLeHomQua: number | null; tiLe7Truoc: number | null; soChangThem: number; soDangLenBac: number }
}

// ══════════════════════════════ NGÀY (thuần, không đồng hồ) ══════════════════════════════

/** Số ngày kể từ 1970-01-01 của một chuỗi `YYYY-MM-DD` (NaN nếu sai). */
export function chiSoNgay(ngay: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  if (!m) return NaN
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000)
}
export function themNgay(ngay: string, n: number): string {
  const i = chiSoNgay(ngay)
  return Number.isNaN(i) ? '' : new Date((i + n) * 86_400_000).toISOString().slice(0, 10)
}
/** a − b (ngày). */
export function hieuNgay(a: string, b: string): number {
  return chiSoNgay(a) - chiSoNgay(b)
}

const lamTron = (x: number, k = 100) => Math.round(x * k) / k
const tiLe = (dung: number, lam: number): number | null => (lam > 0 ? lamTron(dung / lam) : null)
function trungVi(xs: number[]): number | null {
  if (xs.length === 0) return null
  const a = [...xs].sort((x, y) => x - y)
  const n = a.length
  return n % 2 ? a[(n - 1) / 2] : Math.round((a[n / 2 - 1] + a[n / 2]) / 2)
}
const laBtvn = (nguon: string) => nguon === 'btvn' || nguon === 'btvn_lo'

// ══════════════════════════════ ĐẶC TRƯNG ══════════════════════════════

/** Chuỗi ngày đạt tới hôm qua: đếm ngược từ ngày gần nhất; `khong`/`mot_phan` làm đứt; ngày nghỉ hoặc chưa chốt (null) không làm đứt cũng không cộng. */
function demChuoi(keHoach: NgayKeHoachNgan[]): number {
  const ds = [...keHoach].sort((a, b) => (a.ngay < b.ngay ? 1 : -1))
  let n = 0
  for (const k of ds) {
    if (k.laNgayNghi || k.ketQua === null) continue
    if (k.ketQua === 'dat') n++
    else break
  }
  return n
}

/** THẺ + HỒ SƠ của một em từ dữ liệu đã đọc. Tất định. */
export function tinhDacTrung(v: DauVaoEm): { the: TheNgan; hoSo: HoSoDayDu } {
  const homQua = themNgay(v.ngay, -1)
  const dau7 = themNgay(v.ngay, -N.SO_NGAY_CUA_SO)
  const dau3 = themNgay(v.ngay, -N.SO_NGAY_GAN)
  const cuoi4 = themNgay(v.ngay, -(N.SO_NGAY_GAN + 1)) // ngày−4: hết đoạn "4 ngày trước"
  const trong = (e: SuKienNgan, tu: string, den: string) => e.ngay >= tu && e.ngay <= den
  const ev7 = v.suKien.filter((e) => trong(e, dau7, homQua))
  const evLam = (l: SuKienNgan[]) => l.filter((e) => e.ketQua !== null)
  const lam = (l: SuKienNgan[]) => evLam(l).length
  const dung = (l: SuKienNgan[]) => l.filter((e) => e.ketQua === 1).length
  const e7 = evLam(ev7)
  const e3 = e7.filter((e) => e.ngay >= dau3)
  const e4 = e7.filter((e) => e.ngay <= cuoi4)
  const eHQ = e7.filter((e) => e.ngay === homQua)
  const tiLe7 = tiLe(dung(e7), e7.length)
  const tiLe3 = tiLe(dung(e3), e3.length)
  const tiLe4 = tiLe(dung(e4), e4.length)
  let xuHuong: XuHuong = 'chua_du'
  if (e3.length >= 5 && e4.length >= 5 && tiLe3 !== null && tiLe4 !== null) xuHuong = tiLe3 - tiLe4 >= N.XU_HUONG_LECH ? 'len' : tiLe4 - tiLe3 >= N.XU_HUONG_LECH ? 'xuong' : 'on'

  const giay7 = e7.map((e) => e.giay).filter((g): g is number => typeof g === 'number' && g > 0)
  const giayHQ = eHQ.map((e) => e.giay).filter((g): g is number => typeof g === 'number' && g > 0)
  const gTV7 = giay7.length >= N.MAU_GIAY_TOI_THIEU ? trungVi(giay7) : null
  const gHQ = giayHQ.length >= N.MAU_GIAY_TOI_THIEU ? trungVi(giayHQ) : null

  const ngayCoBai = new Set(e7.map((e) => e.ngay))
  const soNgayVang = v.ngayHoatDongCuoi ? Math.max(0, hieuNgay(v.ngay, v.ngayHoatDongCuoi) - 1) : N.KHONG_HOAT_DONG_BO_QUA + 1
  // `soNgayVang`: số ngày TRỌN VẸN em không học tính tới hôm qua (học hôm qua ⇒ 0; hoạt động cuối cách 3 ngày ⇒ 2)

  const dangCua = new Map(v.cau.map((c) => [c.qid, c.dang]))
  const theoDang = new Map<string, { lam: number; sai: number }>()
  for (const e of e7) {
    const d = dangCua.get(e.qid)
    if (!d) continue
    const x = theoDang.get(d) ?? { lam: 0, sai: 0 }
    x.lam++
    if (e.ketQua === 0) x.sai++
    theoDang.set(d, x)
  }
  const hoSoDang = new Map(v.dang.map((d) => [d.ma, d]))
  const dangTho: DangChuY[] = [...new Set([...theoDang.keys(), ...v.dang.map((d) => d.ma)])].map((ma) => {
    const d = hoSoDang.get(ma)
    const t = theoDang.get(ma) ?? { lam: 0, sai: 0 }
    const duTin = !!d && d.soGap >= 4
    return {
      ma,
      gap: d?.soGap ?? 0,
      sai: d?.soSai ?? 0,
      bac: d?.bac ?? 1,
      tiLeKhacPhuc: duTin && d ? lamTron((d.soDaKhacPhuc + d.soChuaThaySai) / d.soGap) : null,
      lam7: t.lam,
      sai7: t.sai,
    }
  })
  // Dạng CẦN CHÚ Ý: sai nhiều trong 7 ngày trước, rồi dạng có tỉ lệ khắc phục thấp; chỉ dạng có hoạt động hoặc có dữ liệu.
  const dangChuY = [...dangTho]
    .filter((d) => d.sai7 > 0 || (d.tiLeKhacPhuc !== null && d.tiLeKhacPhuc < 0.7))
    .sort((a, b) => b.sai7 - a.sai7 || (a.tiLeKhacPhuc ?? 1) - (b.tiLeKhacPhuc ?? 1) || (a.ma < b.ma ? -1 : 1))
    .slice(0, N.SO_DANG_CHU_Y)
  const maDang = [...new Set([...dangChuY.map((d) => d.ma), ...[...dangTho].sort((a, b) => b.lam7 - a.lam7 || (a.ma < b.ma ? -1 : 1)).map((d) => d.ma)])].slice(0, N.SO_MA_DANG_TOI_DA)

  const nguon = {
    btvn7: lam(ev7.filter((e) => laBtvn(e.nguon))),
    btvn2: lam(ev7.filter((e) => laBtvn(e.nguon) && e.ngay >= themNgay(v.ngay, -2))),
    onLai7: lam(ev7.filter((e) => e.nguon === 'on_lai')),
    game7: lam(ev7.filter((e) => e.nguon === 'game')),
    khac7: lam(ev7.filter((e) => !laBtvn(e.nguon) && e.nguon !== 'on_lai' && e.nguon !== 'game')),
  }
  const baiMo = v.btvn.length
  const btvn = { baiMo, changXong: v.btvn.reduce((n, b) => n + b.changXong, 0), tongChang: baiMo && v.btvn.every((b) => b.tongChang !== null) ? v.btvn.reduce((n, b) => n + (b.tongChang as number), 0) : null }
  const kh7 = v.keHoach.filter((k) => k.ngay >= dau7 && k.ngay <= homQua)
  const ca = v.caGanNhat ? { diem: v.caGanNhat.diem, ngayTruoc: Math.max(0, hieuNgay(v.ngay, v.caGanNhat.ngayNop)) } : null
  const dc = v.dieuChinhHomQua
  const homQuaDc = dc
    ? { lech: dc.nhip.lech, khoiDong: dc.nhip.khoiDong, dang: dc.dang.map((d) => ({ ma: d.ma, hanhDong: d.hanhDong })), khacPhuc: dc.khacPhuc.map((k) => ({ dang: k.dang, kieu: k.kieu })), co: dc.co, apDung: dc.apDung }
    : null

  const the: TheNgan = {
    ngay: v.ngay,
    maDang,
    bacCuaMaDang: maDang.map((ma) => (hoSoDang.get(ma)?.bac ?? 1) as 0 | 1 | 2),
    hoatDong: { ngayCoBai7: ngayCoBai.size, soNgayVang, soNgayTuLucDau: v.ngayHoatDongDau ? Math.max(0, hieuNgay(v.ngay, v.ngayHoatDongDau)) : null },
    cau: { lam7: e7.length, dung7: dung(e7), sai7: e7.length - dung(e7), tiLe7, lam3: e3.length, tiLe3, lam4Truoc: e4.length, lamHomQua: eHQ.length, dungHomQua: dung(eHQ) },
    xuHuong,
    giay: { trungVi7: gTV7, homQua: gHQ },
    nguon,
    chuoi: demChuoi(v.keHoach),
    datNgay7: kh7.filter((k) => k.ketQua === 'dat').length,
    ngayNghi7: kh7.filter((k) => k.laNgayNghi).length,
    btvn,
    noOn: v.noOn,
    exp: v.exp,
    ca,
    dangChuY,
    co: [],
    mocDangKhen: [],
    luotSoiKyTuan: toiLuotSoiKy(v.sbd, v.ngay),
    khiNaoVietPhuHuynh: [],
    loiNhanGanDay: (v.loiNhanGanDay ?? []).slice(0, 3).map((t) => t.slice(0, 160)),
    homQuaDc,
  }
  the.co = timCo(the, v)
  the.mocDangKhen = timMocDangKhen(the, v, eHQ, dangCua)
  the.khiNaoVietPhuHuynh = timKhiNaoVietPhuHuynh(the)

  const theoNgay = Array.from({ length: N.SO_NGAY_CUA_SO }, (_, i) => {
    const ngay = themNgay(v.ngay, -(i + 1))
    const l = e7.filter((e) => e.ngay === ngay)
    return { ngayTruoc: i + 1, lam: l.length, dung: dung(l) }
  })
  const hoSoDayDu: HoSoDayDu = {
    ...the,
    theoNgay,
    dang: [...dangTho]
      .sort((a, b) => b.lam7 - a.lam7 || b.sai7 - a.sai7 || (a.ma < b.ma ? -1 : 1))
      .slice(0, N.SO_DANG_HO_SO)
      .map((d) => ({ ...d, daKhacPhuc: hoSoDang.get(d.ma)?.soDaKhacPhuc ?? 0, xuHuong: 'chua_du' as XuHuong })),
    cauSaiGanDay: v.cau
      .filter((c) => c.trangThai === 'moi_sai' || c.trangThai === 'dang_on')
      .sort((a, b) => b.lanSai - a.lanSai || (a.qid < b.qid ? -1 : 1))
      .slice(0, N.SO_CAU_SAI_HO_SO)
      .map((c) => ({ dang: c.dang, lanSai: c.lanSai, trangThai: c.trangThai as string, giay: v.suKien.find((e) => e.qid === c.qid && typeof e.giay === 'number')?.giay ?? null })),
  }
  // xu hướng từng dạng: sai7 nhiều hơn nửa số lần làm ⇒ xuống; ngược lại ổn — chỉ khi đủ ≥ 3 lần làm
  hoSoDayDu.dang = hoSoDayDu.dang.map((d) => ({ ...d, xuHuong: d.lam7 < 3 ? 'chua_du' : d.sai7 * 2 > d.lam7 ? 'xuong' : d.sai7 === 0 ? 'len' : 'on' }))
  return { the, hoSo: hoSoDayDu }
}

/** Cờ thuật toán gắn cho em (đầu vào của `phanLuong`; KHÔNG do AI). Không có chữ số trong tên cờ. */
function timCo(the: TheNgan, v: DauVaoEm): CoThuatToan[] {
  const co: CoThuatToan[] = []
  const c = the.cau
  const trungBinh4 = c.lam4Truoc / (N.SO_NGAY_CUA_SO - N.SO_NGAY_GAN)
  if (c.lam4Truoc >= N.TUT_NHIP_NEN_TOI_THIEU && c.lam3 / N.SO_NGAY_GAN < N.TUT_NHIP_TI_LE * trungBinh4) co.push('tut_nhip')
  if (the.btvn.baiMo > 0 && the.nguon.btvn7 > 0 && the.nguon.btvn2 === 0) co.push('bo_do')
  if (the.dangChuY.some((d) => d.sai7 >= N.SAI_LAP_SO_LAN)) co.push('sai_lap')
  if (c.lam3 >= N.DUNG_NHANH_SO_CAU && c.tiLe3 !== null && c.tiLe3 >= N.DUNG_NHANH_TI_LE && the.giay.homQua !== null && the.giay.trungVi7 !== null && the.giay.homQua <= N.NHANH_TI_LE_GIAY * the.giay.trungVi7) co.push('dung_nhanh')
  if (c.lamHomQua >= N.DUNG_NHANH_SO_CAU && c.tiLe3 !== null && c.tiLe3 < N.LAM_CHO_XONG_TI_LE && the.giay.homQua !== null && the.giay.trungVi7 !== null && the.giay.homQua <= N.NHANH_TI_LE_GIAY * the.giay.trungVi7) co.push('lam_cho_xong')
  if (the.ca && the.ca.ngayTruoc >= N.VUA_THI_TU && the.ca.ngayTruoc <= N.VUA_THI_DEN) co.push('vua_thi')
  if (the.hoatDong.soNgayTuLucDau !== null && the.hoatDong.soNgayTuLucDau <= N.MOI_VAO_NGAY) co.push('moi_vao')
  if (the.hoatDong.soNgayVang >= N.VANG_BAO_THAY) co.push('vang_lau')
  void v
  return co
}

/** MỐC ĐÁNG KHEN của em (tính bằng thuật toán, có số). Tất định; thứ tự cố định: lên bậc → đúng lại → chuỗi → quay lại → tự làm thêm. */
function timMocDangKhen(the: TheNgan, v: DauVaoEm, eHomQua: SuKienNgan[], dangCua: Map<string, string>): MocDangKhen[] {
  const ra: MocDangKhen[] = []
  const truoc = new Map((v.theHomTruoc?.maDang ?? []).map((ma, i) => [ma, v.theHomTruoc?.bacCuaMaDang?.[i]]))
  const nay = the.maDang.map((ma, i) => ({ ma, bac: the.bacCuaMaDang[i] })).sort((x, y) => (x.ma < y.ma ? -1 : 1))
  for (const b of nay) {
    const tu = truoc.get(b.ma)
    if (tu !== undefined && b.bac > tu) ra.push({ loai: 'len_bac', dang: b.ma, tu, den: b.bac })
  }
  const lanSai = new Map(v.cau.map((c) => [c.qid, c.lanSai]))
  const dungLai = new Set(eHomQua.filter((e) => e.ketQua === 1 && (lanSai.get(e.qid) ?? 0) > 0).map((e) => e.qid))
  if (dungLai.size > 0) ra.push({ loai: 'dung_lai', soCau: dungLai.size })
  if (the.chuoi === 3 || the.chuoi === 7 || the.chuoi === 14) ra.push({ loai: 'chuoi', soNgay: the.chuoi })
  // quay lại: hôm qua học, ngày học liền trước đó cách ≥ 3 ngày (vắng ≥ 2 ngày trọn)
  const homQua = themNgay(v.ngay, -1)
  const ngayHoc = [...new Set(v.suKien.filter((e) => e.ketQua !== null && e.ngay < v.ngay).map((e) => e.ngay))].sort()
  if (ngayHoc[ngayHoc.length - 1] === homQua && ngayHoc.length >= 2) {
    const khoang = hieuNgay(homQua, ngayHoc[ngayHoc.length - 2])
    if (khoang >= 3) ra.push({ loai: 'quay_lai', soNgay: khoang - 1 })
  }
  const tuLam = eHomQua.filter((e) => e.nguon === 'luyen' || e.nguon === 'mom').length
  if (tuLam >= 3) ra.push({ loai: 'tu_lam_them', soCau: tuLam })
  void dangCua
  return ra
}

/** Lý do được phép viết lời cho phụ huynh, tính từ thẻ (`vap_lap_da_xu_ly` còn phải thoả điều kiện "bộ não ĐÃ xử lý" — do `kiemKhuon` kiểm trên đầu ra). */
function timKhiNaoVietPhuHuynh(the: TheNgan): string[] {
  const ra: string[] = []
  if (the.mocDangKhen.length > 0) ra.push('moc_dang_khen')
  if (the.co.includes('sai_lap')) ra.push('vap_lap_da_xu_ly')
  if (the.co.includes('bo_do')) ra.push('bo_do_2_ngay')
  if (the.hoatDong.soNgayVang >= 3) ra.push('vang_3_ngay')
  if (the.co.includes('vua_thi')) ra.push('vua_thi')
  return ra
}

// ══════════════════════════════ PHÂN LUỒNG ══════════════════════════════

/** Ngày này có phải LƯỢT SOI KỸ HẰNG TUẦN của em không (tất định: băm `sbd` mod 7 = chỉ số ngày mod 7 ⇒ mỗi 7 ngày liền, mỗi em đúng một lần). */
export function toiLuotSoiKy(sbd: string, ngay: string): boolean {
  const i = chiSoNgay(ngay)
  return !Number.isNaN(i) && hashSeed(sbd) % N.SO_LUONG_XOAY_VONG === ((i % N.SO_LUONG_XOAY_VONG) + N.SO_LUONG_XOAY_VONG) % N.SO_LUONG_XOAY_VONG
}

/**
 * PHÂN LUỒNG một em cho đêm `ngay`. Thứ tự: không hoạt động ⇒ `bo_qua`; vắng ≥ 2 ngày ⇒ `vang`; có cờ thuật toán hoặc tới lượt xoay vòng ⇒ `sau`; còn lại ⇒ `nhanh`.
 * `lyDo` là những câu ngắn BẰNG SỐ lấy đúng từ thẻ (không có tên em).
 */
export function phanLuong(the: TheNgan, boiCanh: { sbd: string; ngay: string }): KetQuaPhanLuong {
  const h = the.hoatDong
  const c = the.cau
  if (the.hoatDong.soNgayTuLucDau === null || h.soNgayVang > N.KHONG_HOAT_DONG_BO_QUA) return { luong: 'bo_qua', lyDo: [`không có hoạt động trong ${N.KHONG_HOAT_DONG_BO_QUA} ngày`] }
  if (h.soNgayVang >= N.VANG_TOI_THIEU) return { luong: 'vang', lyDo: [`vắng ${h.soNgayVang} ngày liền`] }
  const lyDo: string[] = []
  for (const co of the.co) {
    if (co === 'tut_nhip') lyDo.push(`tụt nhịp: ${c.lam3} câu / 3 ngày so với ${c.lam4Truoc} câu / 4 ngày trước`)
    else if (co === 'bo_do') lyDo.push(`bỏ dở BTVN: ${the.btvn.changXong} chặng xong, 2 ngày qua không làm câu nào của bài`)
    else if (co === 'sai_lap') {
      const d = the.dangChuY.find((x) => x.sai7 >= N.SAI_LAP_SO_LAN)
      if (d) lyDo.push(`sai lặp: dạng ${d.ma} sai ${d.sai7}/${d.lam7} lần trong 7 ngày`)
    } else if (co === 'dung_nhanh') lyDo.push(`đúng nhanh bất thường: ${Math.round((c.tiLe3 ?? 0) * 100)} % đúng, ${the.giay.homQua} giây/câu so với trung vị ${the.giay.trungVi7}`)
    else if (co === 'lam_cho_xong') lyDo.push(`làm cho xong: ${Math.round((c.tiLe3 ?? 0) * 100)} % đúng, ${the.giay.homQua} giây/câu so với trung vị ${the.giay.trungVi7}`)
    else if (co === 'vua_thi' && the.ca) lyDo.push(`vừa thi ${the.ca.ngayTruoc} ngày trước`)
    else if (co === 'moi_vao') lyDo.push(`mới vào ${h.soNgayTuLucDau} ngày`)
    else if (co === 'xau_di_hom_qua') lyDo.push('điều chỉnh hôm qua chưa hiệu quả')
  }
  if (lyDo.length === 0 && toiLuotSoiKy(boiCanh.sbd, boiCanh.ngay)) lyDo.push('tới lượt soi kỹ xoay vòng hằng tuần')
  return lyDo.length ? { luong: 'sau', lyDo } : { luong: 'nhanh', lyDo: [] }
}

// ══════════════════════════════ ĐÁNH GIÁ ĐIỀU CHỈNH HÔM QUA ══════════════════════════════

/**
 * Điều chỉnh ĐÊM QUA (áp cho ngày hôm qua) có ăn thua không: so KẾT QUẢ NGÀY HÔM QUA (trong `theNay`) với thẻ đêm trước (`theTruoc`).
 * Chưa đủ dữ liệu ⇒ `chua_du_du_lieu` (điều chỉnh GIỮ NGUYÊN, nguyên tắc 10 "không rung lắc"). Chỉ dùng SỐ ĐO; câu chữ ghép ở đây.
 */
export function danhGiaDieuChinh(theTruoc: TheNgan | null, theNay: TheNgan): DanhGiaDieuChinh {
  const lam = theNay.cau.lamHomQua
  const dungHq = theNay.cau.dungHomQua
  const tiLeHq = tiLe(dungHq, lam)
  const tiLeT = theTruoc ? theTruoc.cau.tiLe7 : null
  const soChangThem = theTruoc ? Math.max(0, theNay.btvn.changXong - theTruoc.btvn.changXong) : 0
  const bacTruoc = new Map((theTruoc?.dangChuY ?? []).map((d) => [d.ma, d.bac]))
  const soDangLenBac = theNay.dangChuY.filter((d) => bacTruoc.has(d.ma) && d.bac > (bacTruoc.get(d.ma) as number)).length
  const so = { lam, dung: dungHq, tiLeHomQua: tiLeHq, tiLe7Truoc: tiLeT, soChangThem, soDangLenBac }
  if (lam < N.DANH_GIA_TOI_THIEU_CAU || tiLeHq === null) return { ketQua: 'chua_du_du_lieu', chu: `hôm qua mới làm ${lam} câu — chưa đủ để đánh giá`, so }
  const phanTram = (x: number) => Math.round(x * 100)
  const goc = tiLeT !== null ? `, 7 ngày trước ${phanTram(tiLeT)} %` : ''
  const chu = `hôm qua đúng ${dungHq}/${lam} câu (${phanTram(tiLeHq)} %)${goc}${soChangThem > 0 ? `, xong thêm ${soChangThem} chặng` : ''}${soDangLenBac > 0 ? `, ${soDangLenBac} dạng lên bậc` : ''}`
  const goiTut = tiLeT !== null ? tiLeT - tiLeHq : 0
  if (tiLeHq < N.XAU_DI_TI_LE && goiTut >= N.XAU_DI_TUT) return { ketQua: 'xau_di', chu, so }
  const tang = tiLeT !== null ? tiLeHq - tiLeT : 0
  if ((tiLeHq >= N.AN_THUA_TI_LE && goiTut <= 0.05) || tang >= N.AN_THUA_TANG || soChangThem >= 1 || soDangLenBac >= 1) return { ketQua: 'an_thua', chu, so }
  return { ketQua: 'khong_doi', chu, so }
}

// ══════════════════════════════ BỨC TRANH CẢ LỚP ══════════════════════════════

export interface TheCuaEmLop {
  sbd: string
  lop: string
  the: TheNgan
  luong: Luong
  /** Đánh giá điều chỉnh hôm qua của em này (nếu có). */
  ketQuaHomQua?: KetQuaDieuChinh | null
}

export interface BucTranhLop {
  ngay: string
  soEm: number
  soSoiNhanh: number
  soSoiKy: number
  soVang: number
  soBoQua: number
  /** Dạng nhiều em sai lặp nhất (≥ 3 lần/7 ngày): số em, tổng lần sai — theo mã dạng. */
  dangKet: { ma: string; soEm: number; tongSai: number }[]
  soEmBoDoBtvn: number
  soEmTutNhip: number
  soEmVangLau: number
  /** SBD (mã lệnh đổi sang bí danh): em đang lên rõ (≥ 15 câu/7 ngày, ≥ 85 % đúng, xu hướng lên). */
  emNoiLen: string[]
  ketQuaDieuChinh: { anThua: number; khongDoi: number; xauDi: number; chuaDu: number }
}

export function tinhBucTranhLop(ngay: string, cacEm: TheCuaEmLop[]): BucTranhLop {
  const dem = (l: Luong) => cacEm.filter((e) => e.luong === l).length
  const dangSai = new Map<string, { soEm: number; tongSai: number }>()
  for (const e of cacEm) {
    for (const d of e.the.dangChuY) {
      if (d.sai7 < N.SAI_LAP_SO_LAN) continue
      const x = dangSai.get(d.ma) ?? { soEm: 0, tongSai: 0 }
      x.soEm++
      x.tongSai += d.sai7
      dangSai.set(d.ma, x)
    }
  }
  const kq = (k: KetQuaDieuChinh) => cacEm.filter((e) => e.ketQuaHomQua === k).length
  return {
    ngay,
    soEm: cacEm.length,
    soSoiNhanh: dem('nhanh'),
    soSoiKy: dem('sau'),
    soVang: dem('vang'),
    soBoQua: dem('bo_qua'),
    dangKet: [...dangSai.entries()]
      .map(([ma, x]) => ({ ma, ...x }))
      .sort((a, b) => b.soEm - a.soEm || b.tongSai - a.tongSai || (a.ma < b.ma ? -1 : 1))
      .slice(0, 5),
    soEmBoDoBtvn: cacEm.filter((e) => e.the.co.includes('bo_do')).length,
    soEmTutNhip: cacEm.filter((e) => e.the.co.includes('tut_nhip')).length,
    soEmVangLau: cacEm.filter((e) => e.the.co.includes('vang_lau')).length,
    emNoiLen: cacEm
      .filter((e) => e.the.cau.lam7 >= 15 && (e.the.cau.tiLe7 ?? 0) >= 0.85 && e.the.xuHuong === 'len')
      .map((e) => e.sbd)
      .sort()
      .slice(0, 5),
    ketQuaDieuChinh: { anThua: kq('an_thua'), khongDoi: kq('khong_doi'), xauDi: kq('xau_di'), chuaDu: kq('chua_du_du_lieu') },
  }
}
