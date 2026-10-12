// LỚP NỐI "BÀI HẰNG NGÀY" + "HỒ SƠ THÁI ĐỘ LÀM BÀI" của app thầy (thầy 12/10). Chỉ tệp này biết hai lệnh máy chủ CHỈ ĐỌC
// `POST /gv/bai-hang-ngay {tu?, den?, khoi?, lop?}` và `POST /gv/ho-so-thai-do {sbd, tu?, den?}`; hình dạng trả về là hợp đồng dùng chung
// `server/src/bai-hang-ngay-kieu.ts` (app CHỈ ĐỌC kiểu). Không ném lỗi: trả `KetQuaLenh` với MỘT câu nói thật. Trường thiếu / sai kiểu ⇒ bỏ dòng ấy
// (không bịa số); thiếu cả khung ⇒ "không đọc được".
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import type {
  CauTomTat, CheDoNgay, EmBaiHangNgay, KetLuanThaiDo, KetQuaBaiHangNgay, KetQuaHoSoThaiDo, LopBaiHangNgay, MaTinHieu, MucTinHieu, NgayBaiEm,
  NgayHoatDong, NguonMuc, NhanThaiDo, NhomGiay, TinHieuThaiDo,
} from '../../server/src/bai-hang-ngay-kieu'
import { MUC_THEO_TANG, NGAY_BAT_DAU_BAI_HANG_NGAY, NGUONG_THAI_DO, TEN_NHAN_THAI_DO } from '../../server/src/bai-hang-ngay-kieu'

export type {
  CauTomTat, EmBaiHangNgay, KetLuanThaiDo, KetQuaBaiHangNgay, KetQuaHoSoThaiDo, LopBaiHangNgay, MaTinHieu, MucTinHieu, NgayBaiEm, NgayHoatDong,
  NhanThaiDo, NhomGiay, TinHieuThaiDo,
}
export { MUC_THEO_TANG, NGAY_BAT_DAU_BAI_HANG_NGAY, NGUONG_THAI_DO, TEN_NHAN_THAI_DO }

// ĐỢT 16 (thầy 12/10: "đo kĩ hơn nữa thái độ của học sinh chính xác hơn 90%") — làn máy chủ D CHỈ THÊM ba trường TUỲ CHỌN; khai ở PHÍA APP (không sửa
// tệp máy chủ). Máy chủ cũ không gửi ⇒ trường vắng, tấm hiện y như trước (không chip, không "đang theo dõi").
/** Độ tin cậy (0–100) của MỘT tín hiệu. */
export type TinHieuThaiDoApp = TinHieuThaiDo & { doTinCay?: number }
/** Độ tin cậy (0–100; máy chủ kẹp ≤ 99) của kết luận + câu "cần thêm gì để chắc" khi chưa đủ tin cậy. */
export type KetLuanThaiDoApp = KetLuanThaiDo & { doTinCay?: number; canThem?: string }
/** Cả hồ sơ: cách tính độ tin cậy (chữ) + số câu từng sai nay đã làm lại đúng (chỉ để hiện). */
export type KetQuaHoSoThaiDoApp = KetQuaHoSoThaiDo & { cachTinhTinCay?: string; tuSuaSai?: number }
/** Đọc độ tin cậy: số hữu hạn ⇒ làm tròn, kẹp 0–100; khác ⇒ null (bỏ trường, không bịa). */
export const docDoTinCay = (x: unknown): number | null => {
  const n = so(x)
  return n === null ? null : Math.max(0, Math.min(100, Math.round(n)))
}

export const DUONG_BAI_HANG_NGAY = '/gv/bai-hang-ngay'
export const DUONG_HO_SO_THAI_DO = '/gv/ho-so-thai-do'
const CHU_CHUA_CO_BHN = 'Máy chủ chưa có lệnh Bài hằng ngày — cần đẩy bản máy chủ mới.'
const CHU_CHUA_CO_TDO = 'Máy chủ chưa có lệnh Hồ sơ thái độ làm bài — cần đẩy bản máy chủ mới.'

type O = Record<string, unknown>
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const soKhongAm = (x: unknown): number => Math.max(0, so(x) ?? 0)
const chu = (x: unknown): string => (typeof x === 'string' ? x : '')
const laNgay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const mang = <T>(x: unknown, doc: (v: unknown) => T | null): T[] => (Array.isArray(x) ? x.map(doc).filter((v): v is T => v !== null) : [])
const tang = (x: unknown): 1 | 2 | 3 | 4 => (x === 2 || x === 3 || x === 4 ? x : 1)
/** Bốn nhóm Nhịp học (trường `nhomNhip` của hồ sơ thái độ, chỉ thêm 12/10). */
const NHOM_NHIP = ['cham', 'chua-deu', 'luoi', 'chua-du'] as const

function docNgayBai(x: unknown): NgayBaiEm | null {
  const o = dt(x)
  if (!o || !laNgay(o.ngay)) return null
  const muc = so(o.mucToiThieu)
  if (muc === null || muc < 0) return null
  const daLam = soKhongAm(o.daLam)
  return {
    ngay: o.ngay,
    mucToiThieu: muc,
    daLam,
    // Tính lại từ hai số đã đọc (không tin một trường lệch).
    thieu: Math.max(0, muc - daLam),
    datMuc: daLam >= muc,
    mucUocTinh: o.mucUocTinh === true,
    nguonMuc: (['da-chot', 'tang-gan-nhat', 'mac-dinh', 'uoc-goi7'] as NguonMuc[]).includes(o.nguonMuc as NguonMuc) ? (o.nguonMuc as NguonMuc) : 'mac-dinh',
    tang: tang(o.tang),
    cheDo: (o.cheDo === 'goi7' ? 'goi7' : 'hanh-trinh') as CheDoNgay,
    homNay: o.homNay === true,
  }
}

function docEm(x: unknown): EmBaiHangNgay | null {
  const o = dt(x)
  if (!o || typeof o.sbd !== 'string' || !o.sbd) return null
  const ngay = mang(o.ngay, docNgayBai)
  const lon = dt(o.ngayThieuNhieuNhat)
  return {
    sbd: o.sbd,
    hoTen: chu(o.hoTen) || o.sbd,
    lop: chu(o.lop),
    khoi: chu(o.khoi),
    ngay,
    soNgayThieu: soKhongAm(o.soNgayThieu),
    tongCauThieu: soKhongAm(o.tongCauThieu),
    ngayThieuNhieuNhat: lon && laNgay(lon.ngay) && soKhongAm(lon.thieu) > 0 ? { ngay: lon.ngay, thieu: soKhongAm(lon.thieu) } : null,
    soNgayDu: soKhongAm(o.soNgayDu),
    soNgayKhongLam: soKhongAm(o.soNgayKhongLam),
    tongDaLam: soKhongAm(o.tongDaLam),
    // máy chủ cũ chưa có trường ⇒ tính lại từ ô hôm nay (không bịa)
    thieuHomNay: so(o.thieuHomNay) !== null ? soKhongAm(o.thieuHomNay) : (ngay.find((n) => n.homNay)?.thieu ?? 0),
  }
}

/** Đọc trả lời `/gv/bai-hang-ngay` thành đúng hợp đồng; thiếu khung (tu/den/ngay/em) ⇒ null. Thuần — test gọi thẳng. */
export function docBaiHangNgay(du: O): KetQuaBaiHangNgay | null {
  if (!laNgay(du.tu) || !laNgay(du.den) || !Array.isArray(du.ngay) || !Array.isArray(du.em)) return null
  return {
    ok: true,
    tu: du.tu,
    den: du.den,
    homNay: laNgay(du.homNay) ? du.homNay : du.den,
    ngay: du.ngay.filter(laNgay),
    em: mang(du.em, docEm),
    lop: mang(du.lop, (x): LopBaiHangNgay | null => {
      const o = dt(x)
      return o && typeof o.tenLop === 'string' && o.tenLop ? { tenLop: o.tenLop, khoi: chu(o.khoi), soEm: soKhongAm(o.soEm) } : null
    }),
    soOUocTinh: soKhongAm(du.soOUocTinh),
    soO: soKhongAm(du.soO),
    canhBao: mang(du.canhBao, (x) => (typeof x === 'string' && x ? x : null)),
  }
}

const MA_TIN_HIEU: readonly MaTinHieu[] = ['ngay-du-muc', 'qua-nhanh', 'don-bai', 'goi-y', 'chon-lap', 'xu-huong']
const MUC: readonly MucTinHieu[] = ['tot', 'chu-y', 'xau', 'chua-du']
function docTinHieu(x: unknown): TinHieuThaiDo | null {
  const o = dt(x)
  if (!o || !MA_TIN_HIEU.includes(o.ma as MaTinHieu)) return null
  return {
    ma: o.ma as MaTinHieu,
    ten: chu(o.ten),
    muc: MUC.includes(o.muc as MucTinHieu) ? (o.muc as MucTinHieu) : 'chua-du',
    giaTri: so(o.giaTri),
    tu: soKhongAm(o.tu),
    mau: soKhongAm(o.mau),
    chu: chu(o.chu),
    nguong: chu(o.nguong),
    // ĐỢT 16 — tuỳ chọn (xem `TinHieuThaiDoApp`)
    ...(docDoTinCay(o.doTinCay) !== null ? { doTinCay: docDoTinCay(o.doTinCay)! } : {}),
  }
}
function docCau(x: unknown): CauTomTat | null {
  const o = dt(x)
  if (!o || typeof o.qid !== 'string' || !o.qid) return null
  return {
    qid: o.qid,
    tieuDe: chu(o.tieuDe),
    mucDo: chu(o.mucDo),
    soLan: soKhongAm(o.soLan),
    soDung: soKhongAm(o.soDung),
    soSai: soKhongAm(o.soSai),
    dungLanDau: o.dungLanDau === true,
    lanCuoiDung: o.lanCuoiDung === true,
    lanCuoi: chu(o.lanCuoi),
    soLanOn: soKhongAm(o.soLanOn),
  }
}

/** Đọc trả lời `/gv/ho-so-thai-do`; thiếu khung (em/ketLuan/tinHieu/dem/ngay) ⇒ null. Thuần — test gọi thẳng. */
export function docHoSoThaiDo(du: O): KetQuaHoSoThaiDo | null {
  const em = dt(du.em), kl = dt(du.ketLuan), dem = dt(du.dem)
  if (!em || !kl || !dem || !Array.isArray(du.tinHieu) || !Array.isArray(du.ngay) || !laNgay(du.tu) || !laNgay(du.den)) return null
  const nhan: NhanThaiDo = (Object.keys(TEN_NHAN_THAI_DO) as NhanThaiDo[]).includes(kl.nhan as NhanThaiDo) ? (kl.nhan as NhanThaiDo) : 'chua-du-du-lieu'
  return {
    ok: true,
    em: { sbd: chu(em.sbd), hoTen: chu(em.hoTen), lop: chu(em.lop), khoi: chu(em.khoi) },
    tu: du.tu,
    den: du.den,
    homNay: laNgay(du.homNay) ? du.homNay : du.den,
    ketLuan: {
      nhan,
      chu: TEN_NHAN_THAI_DO[nhan],
      lyDo: mang(kl.lyDo, (x) => (typeof x === 'string' && x ? x : null)),
      // ĐỢT 16 — tuỳ chọn (xem `KetLuanThaiDoApp`)
      ...(docDoTinCay(kl.doTinCay) !== null ? { doTinCay: docDoTinCay(kl.doTinCay)! } : {}),
      ...(typeof kl.canThem === 'string' && kl.canThem.trim() ? { canThem: kl.canThem.trim() } : {}),
    },
    tinHieu: mang(du.tinHieu, docTinHieu),
    dem: {
      soLuot: soKhongAm(dem.soLuot),
      soCau: soKhongAm(dem.soCau),
      soDung: soKhongAm(dem.soDung),
      soSai: soKhongAm(dem.soSai),
      soBoTrong: soKhongAm(dem.soBoTrong),
      soCauOn: soKhongAm(dem.soCauOn),
      soLuotOn: soKhongAm(dem.soLuotOn),
      giayTb: so(dem.giayTb),
      giayTrungVi: so(dem.giayTrungVi),
      soLuotCoGiay: soKhongAm(dem.soLuotCoGiay),
    },
    ngay: mang(du.ngay, (x): NgayHoatDong | null => {
      const n = docNgayBai(x)
      const o = dt(x)!
      return n ? { ...n, soLuot: soKhongAm(o.soLuot), soDung: soKhongAm(o.soDung), soSai: soKhongAm(o.soSai), tiLeDung: so(o.tiLeDung) } : null
    }),
    phanBoGiay: mang(du.phanBoGiay, (x): NhomGiay | null => {
      const o = dt(x)
      return o && typeof o.nhan === 'string'
        ? { nhan: o.nhan, tu: soKhongAm(o.tu), den: so(o.den), soLuot: soKhongAm(o.soLuot), soDung: soKhongAm(o.soDung), soNhanh: soKhongAm(o.soNhanh) }
        : null
    }),
    cauDung: mang(du.cauDung, docCau),
    cauDaOn: mang(du.cauDaOn, docCau),
    catBot: du.catBot === true,
    canhBao: mang(du.canhBao, (x) => (typeof x === 'string' && x ? x : null)),
    // CHỈ THÊM 12/10: nhóm Nhịp học + cờ đối phó + chuỗi đủ mức liền gần nhất. Máy chủ cũ không có / sai kiểu ⇒ bỏ trường (tấm lùi về nhãn `ketLuan`).
    ...(NHOM_NHIP.includes(du.nhomNhip as never) ? { nhomNhip: du.nhomNhip as NonNullable<KetQuaHoSoThaiDo['nhomNhip']> } : {}),
    ...(typeof du.coDoiPho === 'boolean' ? { coDoiPho: du.coDoiPho } : {}),
    ...(so(du.chuoiDuGanNhat) !== null ? { chuoiDuGanNhat: soKhongAm(du.chuoiDuGanNhat) } : {}),
    // ĐỢT 16 — tuỳ chọn (xem `KetQuaHoSoThaiDoApp`)
    ...(typeof du.cachTinhTinCay === 'string' && du.cachTinhTinCay.trim() ? { cachTinhTinCay: du.cachTinhTinCay.trim() } : {}),
    ...(so(du.tuSuaSai) !== null ? { tuSuaSai: Math.round(soKhongAm(du.tuSuaSai)) } : {}),
  }
}

/** Bài hằng ngày của mọi em (lọc khối/lớp ở app). */
export async function layBaiHangNgay(b: { tu?: string; den?: string; khoi?: string; lop?: string } = {}): Promise<KetQuaLenh<KetQuaBaiHangNgay>> {
  const r = await goiLenh(DUONG_BAI_HANG_NGAY, b, CHU_CHUA_CO_BHN)
  if (!r.ok) return r
  const kq = docBaiHangNgay(r.du)
  return kq ? { ok: true, du: kq } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả bài hằng ngày không đúng dạng.' }
}

/** Hồ sơ thái độ làm bài của một em. */
export async function layHoSoThaiDo(sbd: string): Promise<KetQuaLenh<KetQuaHoSoThaiDo>> {
  const r = await goiLenh(DUONG_HO_SO_THAI_DO, { sbd }, CHU_CHUA_CO_TDO)
  if (!r.ok) return r
  const kq = docHoSoThaiDo(r.du)
  return kq ? { ok: true, du: kq } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả hồ sơ thái độ không đúng dạng.' }
}
