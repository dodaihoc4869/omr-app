// Bộ chuyển DUY NHẤT giữa dữ liệu nhiệm vụ và màn "Bảng nhiệm vụ".
// Hai nguồn — `tongHopKeHoachTroLy` (đang chạy) và `/hs/ke-hoach-ngay` (GĐ 2 của
// DE-XUAT-CA-NHAN-HOA-1909.md) — ra CÙNG một cấu trúc `DuLieuBangNhiemVu`.
// Hàm thuần: không đọc giờ, không gọi mạng, KHÔNG xếp lại thứ tự — thứ tự là
// của dữ liệu; ở đây chỉ gán bậc, tính cổng và chọn thẻ "Làm ngay".
import { docBoNao, docBoNaoHocSinh, type BoNaoView } from './bo-nao-hien-thi'
import { docCanhBaoThay, type CanhBaoThay } from './canh-bao-thay-hien-thi'
import type { ThuThachRieng } from './thu-thach-rieng'
import { chuSoCauCuaEm, dongPhuChang, tenBaiTapVeNha } from './btvn-ca-nhan-kieu'
import { dinhDangConLai } from './tro-ly-ca-nhan'
import { ngayVietNam } from './han-bai-tap'
import type { CapDoUuTien, KeHoachNgayTroLy, NhiemVuTroLy } from './tro-ly-ca-nhan'

export type BacNhiemVu = 'khan' | 'bat_buoc' | 'nen_lam' | 'tuy_chon'
/** Vai trò màu Material 3 của từng bậc — giao diện chỉ đọc, không tự chọn màu. */
export type VaiTroMau = 'error' | 'primary' | 'secondary' | 'tertiary'
export type BieuTuongViec = 'btvn' | 'mom' | 'on' | 'muc_tieu' | 'sao'
/** Việc ôn câu (on_lai) đã có đường lấy đề + nộp riêng: mở màn LamCauOn với đúng các qid máy chủ chọn. (`tro-ly-ca-nhan.ts` không mở
 * cho phiên giao diện nên loại hành động mới khai ở đây, hợp với loại cũ bằng phép hợp.) */
export interface HanhDongLamCauOn {
  loai: 'lam_cau_on'
  payload: { viecId: string; qid: string[]; soCau: number; tieuDe: string }
  nhanNut: string
}
export type HanhDongNhiemVu = NhiemVuTroLy['hanhDong'] | HanhDongLamCauOn

export const THU_TU_BAC: readonly BacNhiemVu[] = ['khan', 'bat_buoc', 'nen_lam', 'tuy_chon']
export const VAI_TRO_MAU: Record<BacNhiemVu, VaiTroMau> = {
  khan: 'error',
  bat_buoc: 'primary',
  nen_lam: 'secondary',
  tuy_chon: 'tertiary',
}
export const NHAN_BAC: Record<BacNhiemVu, string> = {
  khan: 'Sắp đến hạn nộp',
  bat_buoc: 'Bắt buộc hôm nay',
  nen_lam: 'Nên làm',
  tuy_chon: 'Làm thêm (không bắt buộc)',
}

export interface TheNhiemVu {
  id: string
  bac: BacNhiemVu
  vaiTroMau: VaiTroMau
  bieuTuong: BieuTuongViec
  tieuDe: string
  moTa: string
  soCau: number
  phutUocTinh: number
  hanNop?: string
  conLaiMs?: number
  conLaiChu?: string
  /** Lô BTVN: `hienTai` đếm từ 1. Chỉ có khi dữ liệu nói rõ "Lô x/y". `laChang` = bài BTVN "nâng đỡ" (cá nhân hoá): lô ≡ CHẶNG. */
  tienDoLo?: { hienTai: number; tong: number; laChang?: boolean }
  /** Dòng phụ chữ nhỏ dưới tên thẻ (chỉ bài BTVN cá nhân hoá): "Chặng k trong K chặng", hạn thật, tờ đề. */
  dongPhu?: string[]
  biCong: boolean
  /** Tên việc phải xong trước — chỉ có khi `biCong`. */
  moSauKhiXong?: string
  trangThai: 'chua_lam' | 'dang_lam'
  hanhDong: HanhDongNhiemVu
}

export interface NhomBac {
  bac: BacNhiemVu
  nhan: string
  vaiTroMau: VaiTroMau
  viec: TheNhiemVu[]
}

export interface DuLieuBangNhiemVu {
  nguon: 'tro_ly' | 'ke_hoach_ngay'
  /** Việc đầu tiên đang mở (không bị cổng). `null` = không có gì để làm ngay. */
  lamNgay: TheNhiemVu | null
  /** Luôn đủ 4 bậc theo `THU_TU_BAC`; bậc rỗng có `viec: []`. KHÔNG chứa `lamNgay`. */
  cacBac: NhomBac[]
  /** Nguồn không trả việc nào cần làm ⇒ giao diện hiện thẻ trống, không bịa việc. */
  trong: boolean
  /** `ghiChu` (nếu có) là câu nói thật về tiến bộ; thiếu thì giao diện tự viết từ số câu. */
  tienDo: { daLam: number; mucTieu: number; phanTram: number; ghiChu?: string }
  /** `giayMoiCau` thiếu = chưa đo; `chu` luôn nói thật ("chưa đo"). */
  tocDo: { giayMoiCau?: number; chu: string }
  chuoiNgay: { soNgay: number; chu: string }
  /** Câu cảnh báo tiếng Việt máy chủ đã viết sẵn (khong_kip, qua_tai, thieu_nguon_bu…). */
  canhBao: { loai: string; noiDung: string }[]
  /** Việc đã quá hạn — liệt kê riêng, KHÔNG phải nhiệm vụ hôm nay. */
  quaHan: TheQuaHan[]
  /** ISO — chỉ có ở nguồn máy chủ. */
  capNhatLuc?: string
  /** Có chữ khi đang hiện BẢN CUỐI vì lần gọi mới nhất lỗi ("Kế hoạch lúc 12:54…"). */
  ghiChuCu?: string
  ngayNghi: boolean
  thanThu: TrangThaiThanThu
  tonCu: TonCu
  /**
   * Em ĐÃ ĐẠT chỉ tiêu hôm nay (`tienBo.dat`) và máy chủ chỉ còn mời việc TUỲ CHỌN ⇒ đầu bảng là thẻ MỪNG ("Em đã xong việc hôm
   * nay" + một dòng số đo), KHÔNG có thẻ "Làm ngay", bậc TUỲ CHỌN mang tên "LÀM THÊM · TUỲ CHỌN" và vẫn bấm được. `null` = không
   * ở trạng thái đó. (0.Planer đổi luật 19/09: trước đây "chỉ còn tuỳ chọn" bị coi là TRỐNG và em chăm không bao giờ thấy việc ôn thêm.)
   */
  daXongHomNay: { daLamCau: number; lenBac: number } | null
  /**
   * EXP học tập + mảnh khiên hôm nay — CHỈ có khi máy chủ đã bật cho em (`exp` trong /hs/ke-hoach-ngay); vắng ⇒ `null` và màn ẩn hết,
   * KHÔNG bịa số. Mọi số do máy chủ tính từ sổ; giao diện không cộng, không đoán.
   */
  exp: DuLieuExp | null
  /** Khoản EXP MỚI ghi trong CHÍNH lần gọi này (gọi lại thì rỗng) — để bật thông báo "+EXP". Không lưu vào bản nhớ (kẻo phát lại). */
  expNhan: { exp: number; ghiChu: string }[]
  /** Mảnh khiên mới trong lần gọi này (không lưu vào bản nhớ). */
  manhNhan: { so: number; ghiChu: string }[]
  /**
   * Máy chủ báo game "Đoàn Hộ Tống" MỞ cho em (`doanMo === true` ở gốc /hs/ke-hoach-ngay; nguồn cau_hinh.doan_ho_tong). CHỈ `true` thật mới hiện
   * thẻ mời; vắng/false/kiểu khác ⇒ ẩn hết, không chữ "Đoàn" nào. Có lưu vào bản nhớ (chỉ để khỏi giật bố cục khi mở lại; bản mới về thì thay).
   */
  doanMo?: boolean
  /**
   * Lời nhắn của "Bộ não A.I hỗ trợ riêng em" (`loiNhanHlv` ở gốc /hs/ke-hoach-ngay): CHỈ phần học sinh (`hs`). Phần phụ huynh (`ph`)
   * không đi qua đây (lệnh riêng `/ph/ke-hoach`, xem bo-nao-lay-loi-ph.ts). null/vắng ⇒ KHÔNG thẻ. Nguồn trợ lý không có ⇒ null.
   */
  boNao?: BoNaoView | null
  /**
   * "Cảnh báo của thầy" (khoá `canhBaoThay` ở gốc /hs/ke-hoach-ngay, lời cho EM): ≤ 3, chỉ bài chưa nộp; [] ⇒ KHÔNG thẻ. Phụ huynh nhận qua /ph/ke-hoach
   * (lời cho phụ huynh, xem bo-nao-lay-loi-ph.ts) chứ không qua đây. KHÔNG lưu vào bản nhớ: cảnh báo cũ có thể đã hết đúng (em vừa nộp).
   */
  canhBaoThay?: CanhBaoThay[]
  /**
   * "Thử thách riêng hôm nay" của Bộ não A.I: lời mời + câu do MÁY CHỦ chọn. Đến từ lệnh RIÊNG `POST /hs/thu-thach-hom-nay` (không nằm trong /hs/ke-hoach-ngay) nên
   * adapter luôn để null; màn cổng học sinh gắn vào SAU (`docThuThachRieng`). null/vắng ⇒ KHÔNG thẻ. Không lưu vào bản nhớ. Phụ huynh chưa nhận gì ở Nấc 1.
   */
  thuThachRieng?: ThuThachRieng | null
}

export interface DuLieuExp {
  homNay: number
  /**
   * Đợt 1 thần thú mỗi ngày — CHỈ khi máy chủ trả ĐỦ cả ba số (thiếu một ⇒ vắng hết, KHÔNG đoán): `expConThieu` = EXP thú còn thiếu để lên cấp (KHÔNG trừ ống nghiệm),
   * `ongNghiem` = EXP đã kiếm chưa nạp, `hapThuConLaiHomNay` = hôm nay thú còn ăn được (0 khi chưa học / đã no). Không lưu vào bản nhớ (số ví cũ sẽ nói sai).
   */
  thu?: { expConThieu: number; ongNghiem: number; hapThuConLaiHomNay: number }
  /** `ghiChu` là tiếng Việt máy chủ đã viết sẵn — in nguyên văn. */
  chiTiet: { loai: string; exp: number; ghiChu: string }[]
  manhKhien: { manh: number; moiKhien: number; khienConLai: number } | null
}

/**
 * Thần thú CỦA EM, lấy từ máy chủ (`thanThu` trong /hs/ke-hoach-ngay, đọc game_v2_profile).
 * KHÔNG có "thần thú mặc định": thiếu dữ liệu thì nói thiếu, không hiện con nào.
 *  - co        : máy chủ nói rõ em đang có thần thú `pet` (id) cấp `cap`, biệt danh `ten` (nếu có).
 *  - chua_chon : máy chủ nói em CHƯA chọn thần thú (`thanThu: null`), hoặc không có id.
 *  - chua_biet : chưa có dữ liệu (máy chủ cũ/lỗi/nguồn trợ lý) — chỉ giữ chỗ, không vẽ.
 * (`pet` lạ, không có trong danh sách game, được giao diện coi như chua_chon.)
 */
export type TrangThaiThanThu = { kieu: 'co'; pet: string; cap: number; ten?: string } | { kieu: 'chua_chon' } | { kieu: 'chua_biet' }

export function docThanThu(raw: unknown): TrangThaiThanThu {
  if (raw === undefined) return { kieu: 'chua_biet' }
  if (raw === null) return { kieu: 'chua_chon' }
  if (typeof raw !== 'object') return { kieu: 'chua_biet' }
  const t = raw as any
  const pet = typeof t.pet === 'string' ? t.pet.trim() : ''
  if (!pet) return { kieu: 'chua_chon' }
  const ten = typeof t.nickname === 'string' && t.nickname.trim() ? t.nickname.trim() : undefined
  return { kieu: 'co', pet, cap: Math.max(1, Math.floor(Number(t.cap) || 1)), ten }
}

/** Bài Mẹ giao CŨ chưa làm — đứng RIÊNG như quá hạn: không tính tải, không phải việc hôm nay, không tham gia cổng. */
export interface TheTonCu {
  id: string
  tieuDe: string
  soCau: number
  hanhDong: HanhDongNhiemVu
}
export interface TonCu {
  soBai: number
  soCau: number
  bai: TheTonCu[]
}

export interface TheQuaHan {
  id: string
  loai: 'btvn' | 'mom'
  tieuDe: string
  chu: string
  /** Chỉ bài Mẹ giao mới mở được (nộp phần đã lưu); BTVN quá hạn cần Thầy gia hạn. */
  hanhDong?: HanhDongNhiemVu
}

const BAC_TU_CAP_DO: Record<CapDoUuTien, BacNhiemVu> = {
  khan_cap: 'khan',
  quan_trong: 'bat_buoc',
  tieu_chuan: 'nen_lam',
  thu_thach: 'tuy_chon',
}

function bieuTuongTuLoai(loai: string): BieuTuongViec {
  if (loai === 'mom') return 'mom'
  if (loai.startsWith('btvn')) return 'btvn'
  if (loai.startsWith('sua_loi') || loai === 'on_tap' || loai === 'on_toi_han') return 'on'
  if (loai === 'on_thi') return 'muc_tieu'
  return 'sao'
}

function docTienDoLo(tieuDe: string): TheNhiemVu['tienDoLo'] {
  // Chuẩn từ ngữ (Boss 21/09): "Chặng k trong n chặng". Bản nhớ cũ còn "Lô k/n" ⇒ vẫn đọc được.
  const m = /Chặng\s+(\d+)\s+trong\s+(\d+)\s+chặng/.exec(tieuDe) ?? /Lô\s+(\d+)\s*\/\s*(\d+)/.exec(tieuDe)
  if (!m) return undefined
  const hienTai = Number(m[1])
  const tong = Number(m[2])
  return hienTai >= 1 && tong >= hienTai ? { hienTai, tong } : undefined
}

function phanTram(daLam: number, mucTieu: number): number {
  if (!(mucTieu > 0)) return 0
  return Math.max(0, Math.min(100, Math.round((daLam / mucTieu) * 100)))
}

/** Gom theo bậc, GIỮ thứ tự dữ liệu trong từng bậc. */
function gomBac(viec: TheNhiemVu[]): NhomBac[] {
  return THU_TU_BAC.map((bac) => ({
    bac,
    nhan: NHAN_BAC[bac],
    vaiTroMau: VAI_TRO_MAU[bac],
    viec: viec.filter((v) => v.bac === bac),
  }))
}

/** Nhãn bậc TUỲ CHỌN khi em đã xong việc hôm nay: việc còn lại là LÀM THÊM, không phải nợ. */
export const NHAN_LAM_THEM = 'Làm thêm (không bắt buộc)'

function dongGoi(
  nguon: DuLieuBangNhiemVu['nguon'],
  viec: TheNhiemVu[],
  phanConLai: Omit<DuLieuBangNhiemVu, 'nguon' | 'lamNgay' | 'cacBac' | 'trong' | 'daXongHomNay'>,
  xong: { dat: boolean; daLamCau: number; lenBac: number },
): DuLieuBangNhiemVu {
  // TRỐNG khi nguồn không đưa việc nào. Riêng nguồn TRỢ LÝ (dự phòng khi máy chủ lỗi) luôn kèm một gợi ý "Luyện nâng cao (tự chọn)"
  // cố định, không phải lời mời của máy chủ ⇒ ở đó "chỉ còn tuỳ chọn" vẫn là trống như cũ; ở nguồn MÁY CHỦ, việc tuỳ chọn là lời mời thật.
  const tuyChonLaViecThat = nguon === 'ke_hoach_ngay'
  const chiTuyChon = viec.every((v) => v.bac === 'tuy_chon')
  if (viec.length === 0 || (!tuyChonLaViecThat && chiTuyChon)) return { nguon, lamNgay: null, cacBac: gomBac([]), trong: true, daXongHomNay: null, ...phanConLai }
  if (chiTuyChon && xong.dat) {
    // Đã đạt chỉ tiêu: mừng, không "Làm ngay"; việc tuỳ chọn là LÀM THÊM và vẫn bấm được như thường.
    return {
      nguon,
      lamNgay: null,
      cacBac: gomBac(viec).map((g) => (g.bac === 'tuy_chon' ? { ...g, nhan: NHAN_LAM_THEM } : g)),
      trong: false,
      daXongHomNay: { daLamCau: Math.max(0, Math.floor(xong.daLamCau) || 0), lenBac: Math.max(0, Math.floor(xong.lenBac) || 0) },
      ...phanConLai,
    }
  }
  // Còn việc thật, hoặc chỉ tuỳ chọn mà CHƯA đạt: việc mở đầu tiên là "Làm ngay" (kể cả khi nó là việc tuỳ chọn).
  const lamNgay = viec.find((v) => !v.biCong) ?? null
  return {
    nguon,
    lamNgay,
    cacBac: gomBac(viec.filter((v) => v !== lamNgay)),
    trong: false,
    daXongHomNay: null,
    ...phanConLai,
  }
}

/** Dữ liệu thô đi kèm nguồn trợ lý (chỉ để không làm rơi bài Mẹ giao). */
export interface NguonPhuTroLy {
  dsMomGiao?: any[]
  now?: number
}

/**
 * `tongHopKeHoachTroLy` chỉ giữ `top3`, nên "Luyện sửa lỗi" có thể chiếm chỗ bài
 * Mẹ giao — mà bài Mẹ giao có hạn 2 tiếng và trang chủ cũ vẫn liệt kê nó ở bảng
 * radar. Bài Mẹ giao chưa nộp mà không nằm trong `top3` được bổ sung ở CUỐI danh
 * sách (không chen lên trước, không đổi thứ tự dữ liệu). CHỈ bài Mẹ giao: BTVN
 * có luật nhịp lô riêng (lô chưa tới mốc thì không được hiện) nên không bù từ radar.
 */
function themBaiMeBiCat(viec: TheNhiemVu[], keHoach: KeHoachNgayTroLy, phu: NguonPhuTroLy) {
  for (const r of keHoach.radarDeadline.danhSach) {
    if (r.loai !== 'mom' || r.trangThai === 'da_xong' || viec.some((v) => v.id === r.id)) continue
    const bai = (phu.dsMomGiao || []).find((m) => `mom_${m?.id}` === r.id)
    if (!bai) continue
    const quaHan = r.trangThai === 'qua_han'
    const bac: BacNhiemVu = quaHan || r.trangThai === 'khan_cap' ? 'khan' : 'bat_buoc'
    const soCau = Math.max(1, Math.floor(Number(bai.soCau) || 10))
    const moc = r.hanNop ? Date.parse(r.hanNop) : NaN
    viec.push({
      id: r.id,
      bac,
      vaiTroMau: VAI_TRO_MAU[bac],
      bieuTuong: 'mom',
      tieuDe: r.tieuDe,
      moTa: `Gồm ${soCau} câu ôn tập · ${r.conLaiChu}`,
      soCau,
      phutUocTinh: Math.ceil((soCau * 80) / 60),
      hanNop: r.hanNop,
      conLaiMs: Number.isFinite(moc) && phu.now !== undefined ? moc - phu.now : undefined,
      conLaiChu: r.conLaiChu,
      biCong: false,
      trangThai: bai.trangThai === 'dang_lam' ? 'dang_lam' : 'chua_lam',
      hanhDong: { loai: 'mo_mom', payload: { id: bai.id, bai }, nhanNut: quaHan ? 'Mở để hoàn tất nộp bài' : 'Làm bài gia đình giao' },
    })
  }
}

/** NGUỒN 1 — kết quả `tongHopKeHoachTroLy` hôm nay (thứ tự `top3` giữ nguyên). */
export function tuKeHoachTroLy(keHoach: KeHoachNgayTroLy, phu: NguonPhuTroLy = {}): DuLieuBangNhiemVu {
  const viec: TheNhiemVu[] = keHoach.top3.map((t) => {
    const bac = BAC_TU_CAP_DO[t.capDoUuTien] ?? 'nen_lam'
    return {
      id: t.id,
      bac,
      vaiTroMau: VAI_TRO_MAU[bac],
      bieuTuong: bieuTuongTuLoai(t.loai),
      tieuDe: t.tieuDe,
      moTa: t.moTa,
      soCau: t.soCau,
      phutUocTinh: t.phutUocTinh,
      hanNop: t.hanNop,
      conLaiMs: t.conLaiMs,
      conLaiChu: t.conLaiChu,
      tienDoLo: t.loai === 'btvn_lo' ? docTienDoLo(t.tieuDe) : undefined,
      biCong: false,
      trangThai: t.loai === 'mom' && t.hanhDong.payload?.bai?.trangThai === 'dang_lam' ? 'dang_lam' : 'chua_lam',
      hanhDong: t.hanhDong,
    }
  })
  themBaiMeBiCat(viec, keHoach, phu)
  // Cổng của nguồn trợ lý: việc tuỳ chọn chỉ mở khi đã hết việc khẩn/bắt buộc
  // (đúng lời `tro-ly-ca-nhan`: "Chỉ chọn khi em đã xong bài cần nộp").
  const chan = viec.find((v) => v.bac === 'khan' || v.bac === 'bat_buoc')
  if (chan) {
    for (const v of viec) {
      if (v.bac !== 'tuy_chon') continue
      v.biCong = true
      v.moSauKhiXong = chan.tieuDe
    }
  }
  const { nganSach, streak } = keHoach
  return dongGoi('tro_ly', viec, {
    tienDo: {
      daLam: nganSach.daLamCau,
      mucTieu: nganSach.mucTieuCau,
      phanTram: phanTram(nganSach.daLamCau, nganSach.mucTieuCau),
      ghiChu: undefined,
    },
    tocDo: { chu: 'tốc độ: chưa đo' },
    // `chuoiNgayHoc` đếm ngày CÓ NỘP BÀI, chưa phải ngày "đạt" — nói đúng tên.
    chuoiNgay: { soNgay: streak.soNgayLienTiep, chu: `Chuỗi ${streak.soNgayLienTiep} ngày` },
    canhBao: [],
    quaHan: [],
    capNhatLuc: undefined,
    ghiChuCu: undefined,
    ngayNghi: false,
    // Nguồn trợ lý chỉ có bảng V1 (không có id thần thú) — KHÔNG đoán, để giữ chỗ.
    thanThu: { kieu: 'chua_biet' },
    tonCu: { soBai: 0, soCau: 0, bai: [] },
    exp: null,
    expNhan: [],
    manhNhan: [],
    // Nguồn trợ lý không biết cờ mở game: KHÔNG mời (cùng bộ khoá ở gốc với nguồn máy chủ — test khoá).
    doanMo: false,
    boNao: null,
    canhBaoThay: [],
    thuThachRieng: null,
  }, {
    // Nguồn trợ lý không có `tienBo.dat`: coi là đạt khi đã làm đủ mức gợi ý.
    dat: nganSach.mucTieuCau > 0 && nganSach.daLamCau >= nganSach.mucTieuCau,
    daLamCau: nganSach.daLamCau,
    lenBac: 0,
  })
}

/** Một việc trong `viec[]` của `POST /hs/ke-hoach-ngay` (docs/ke-hoach-ngay-api-1909.md). */
export interface ViecMayChu {
  id: string
  loai: 'btvn_lo' | 'btvn_nop' | 'mom' | 'on_lai' | 'than_thu' | 'on_thi' | string
  thuTu?: number
  soCau?: number
  hanCung?: string | null
  hanMem?: string | null
  batBuoc?: boolean
  khan?: boolean
  /** id việc đứng ngay trước (cổng). */
  cong?: string | null
  /** false = CHƯA hiện (còn việc bắt buộc trước nó). Máy chủ đã áp cổng, giao diện KHÔNG tính lại. */
  hien?: boolean
  nguon?: string
  nhan?: 'khan_cap' | 'bu' | 'tuy_chon' | null
  trangThai?: string
  ghiChu?: string
  chiTiet?: Record<string, any>
}

export interface KeHoachNgayMayChu {
  ok?: boolean
  ngay?: string
  nganSach: {
    mucTieuCau: number
    toiThieuCau?: number
    vanTocGiay?: number
    vanTocNguon?: 'do' | 'mac_dinh'
    ghiChuVanToc?: string
  }
  /** Đã sắp EDF (`thuTu` 1..n). KHÔNG sắp lại. */
  viec: ViecMayChu[]
  canhBao?: { loai: string; noiDung: string }[]
  quaHan?: { loai: 'btvn' | 'mom'; ma: string; hanNop: string; conLai?: number }[]
  tienBo: { daLamCau: number; lenBac?: number; tutBac?: number; dat?: boolean; toiThieuCau?: number; conThieu?: number; thieuDat?: { soCauDung?: number; chu?: string } }
  chuoiDat?: number
  lanNghi?: boolean
  capNhatLuc?: string
  /** Thần thú của em (game V2). `null` = chưa chọn; vắng = máy chủ cũ. */
  thanThu?: { pet?: string | null; cap?: number; nickname?: string | null } | null
  /** Bài Mẹ giao cũ chưa làm (ngoài 3 ngày/3 bài gần nhất trong viec[]). Vắng = máy chủ chưa gửi trường này. */
  tonCu?: { id?: string; ma?: string; soCau?: number; taoLuc?: string }[]
  tonCuTong?: { soBai?: number; soCau?: number }
  /**
   * EXP học tập mới (chỉ có khi máy chủ đã bật cho em; vắng ⇒ bỏ qua). Chỉ dùng `datNgay`: định nghĩa "đạt nhiệm vụ ngày" CHẶT HƠN
   * `tienBo.dat` (còn đòi câu tới hạn ôn phải lên bậc, việc bắt buộc không trễ nhịp) — màn KHÔNG được nói "xong việc hôm nay" khi nó
   * chưa đạt, kẻo em bỏ qua đúng việc ôn cần để đạt (docs/ke-hoach-ngay-api-1909.md).
   */
  exp?: {
    homNay?: number
    chiTietHomNay?: { loai?: string; exp?: number; ghiChu?: string; soKhoan?: number }[]
    manhKhien?: { manh?: number; moiKhien?: number; khienRen?: number; khienConLai?: number; choCongVaoHoSo?: boolean } | null
    datNgay?: { dat?: boolean; thieu?: string[]; daLam?: number; toiThieu?: number; daTrao?: boolean; laNghi?: boolean } | null
    /** Đợt 1 thần thú mỗi ngày (chỉ-thêm; vắng khi em chưa có thú / hồ sơ chưa chuyển). */
    expConThieu?: number
    ongNghiem?: number
    hapThuConLaiHomNay?: number
  } | null
  /** Khoản EXP mới ghi trong CHÍNH lần gọi này. */
  expNhan?: { loai?: string; exp?: number; ghiChu?: string }[]
  manhNhan?: { loai?: string; so?: number; ghiChu?: string }[]
  /** Cờ mở game Đoàn Hộ Tống cho em (docs/hop-dong-mo-game-doan-ho-tong-1909.md). Đọc chặt `=== true`. */
  doanMo?: unknown
  /** Lời nhắn Bộ não cho học sinh — đọc chặt bằng `docBoNao` (bo-nao-hien-thi.ts). */
  loiNhanHlv?: unknown
  /** "Cảnh báo của thầy" cho em — đọc chặt bằng `docCanhBaoThay` (canh-bao-thay-hien-thi.ts). */
  canhBaoThay?: unknown
}

const soNguyen = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0))

/** `tienBo.thieuDat` (Điều 7, từ 22/09): còn thiếu CÂU ĐÚNG để đạt nhiệm vụ ngày. Chữ của máy chủ (vd "cần đúng thêm 2 câu"); thiếu chữ thì viết từ số; số không dương/hỏng ⇒ null (không nói gì). */
export function docThieuDat(t: KeHoachNgayMayChu['tienBo'] | undefined): string | null {
  const x = t?.thieuDat
  if (!x || typeof x !== 'object') return null
  const n = Math.floor(Number(x.soCauDung))
  if (!(n > 0)) return null
  const chu = typeof x.chu === 'string' ? x.chu.replace(/\s+/g, ' ').trim() : ''
  return chu || `cần đúng thêm ${n} câu`
}

/** Đọc phần EXP của máy chủ: thiếu `exp` (chưa bật cho em / máy chủ cũ) ⇒ `null`, giao diện ẩn hết. Bỏ khoản không có chữ `ghiChu`. */
function docExp(k: KeHoachNgayMayChu): Pick<DuLieuBangNhiemVu, 'exp' | 'expNhan' | 'manhNhan'> {
  const e = k.exp
  const co = !!e && typeof e === 'object' && e.homNay !== undefined && Number.isFinite(Number(e.homNay))
  const mk = co ? e!.manhKhien : null
  const laSo3 = co && [e!.expConThieu, e!.ongNghiem, e!.hapThuConLaiHomNay].every((x) => typeof x === 'number' && Number.isFinite(x) && x >= 0)
  return {
    exp: co
      ? {
          homNay: soNguyen(e!.homNay),
          ...(laSo3 ? { thu: { expConThieu: soNguyen(e!.expConThieu), ongNghiem: soNguyen(e!.ongNghiem), hapThuConLaiHomNay: soNguyen(e!.hapThuConLaiHomNay) } } : {}),
          chiTiet: (Array.isArray(e!.chiTietHomNay) ? e!.chiTietHomNay : [])
            .map((c) => ({ loai: String(c?.loai ?? ''), exp: soNguyen(c?.exp), ghiChu: String(c?.ghiChu ?? '').trim() }))
            .filter((c) => c.ghiChu),
          manhKhien: mk && Number.isFinite(Number(mk.manh)) ? { manh: soNguyen(mk.manh), moiKhien: soNguyen(mk.moiKhien) || 12, khienConLai: soNguyen(mk.khienConLai) } : null,
        }
      : null,
    expNhan: co ? (Array.isArray(k.expNhan) ? k.expNhan : []).map((x) => ({ exp: soNguyen(x?.exp), ghiChu: String(x?.ghiChu ?? '').trim() })).filter((x) => x.ghiChu) : [],
    manhNhan: co ? (Array.isArray(k.manhNhan) ? k.manhNhan : []).map((x) => ({ so: soNguyen(x?.so), ghiChu: String(x?.ghiChu ?? '').trim() })).filter((x) => x.ghiChu) : [],
  }
}

/** Chốt kiểu: JSON máy chủ trả về có đủ phần giao diện cần không (lỗi/HTML/`{ok:true,items:[]}` ⇒ false). */
export function laKeHoachNgayHopLe(x: unknown): x is KeHoachNgayMayChu {
  const k = x as any
  return !!k && k.ok !== false && Array.isArray(k.viec) && k.viec.every((x: any) => !!x && typeof x.id === 'string' && typeof x.loai === 'string') && !!k.nganSach && Number.isFinite(Number(k.nganSach.mucTieuCau)) && !!k.tienBo && Number.isFinite(Number(k.tienBo.daLamCau))
}

/** Dữ liệu thô của màn (danh sách bài) — chỉ để lấy TÊN bài và đúng payload {bt}/{id,bai} khi bấm. */
export interface NguonPhuKeHoach {
  dsBtvn?: any[]
  dsMomGiao?: any[]
}

function gioVietNam(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(t))
}

function bacMayChu(v: ViecMayChu): BacNhiemVu {
  if (v.khan === true || v.nhan === 'khan_cap') return 'khan'
  if (v.batBuoc === true) return 'bat_buoc'
  if (v.nhan === 'bu') return 'nen_lam'
  if (v.nhan === 'tuy_chon') return 'tuy_chon'
  // Máy chủ không nói gì thêm: xếp NÊN LÀM — không tự dựng thành khẩn hay bắt buộc.
  return 'nen_lam'
}

const msIso = (v?: string | null): number | undefined => {
  if (!v) return undefined
  const n = Date.parse(v)
  return Number.isFinite(n) ? n : undefined
}

/** NGUỒN 2 — `viec[]` máy chủ đã xếp và đã áp cổng. `now` chỉ để tính thời gian còn lại. */
export function tuKeHoachNgay(keHoach: KeHoachNgayMayChu, now: number, phu: NguonPhuKeHoach = {}, cu = false): DuLieuBangNhiemVu {
  const btvnTheoMa = (ma: unknown) => (phu.dsBtvn || []).find((b) => b && (b.maBtvn === ma || b.maCa === ma))
  const momTheoId = (id: unknown) => (phu.dsMomGiao || []).find((m) => m && m.id === id)
  const vanToc = Number(keHoach.nganSach.vanTocGiay) > 0 ? Number(keHoach.nganSach.vanTocGiay) : 90

  const tenViec = (v: ViecMayChu): string => {
    const ct = v.chiTiet || {}
    switch (v.loai) {
      case 'btvn_lo': {
        const bt = btvnTheoMa(ct.ma)
        // Bài cá nhân hoá (hợp đồng BTVN nâng đỡ mục 7): lô ≡ chặng, `chiTiet.caNhan:true`.
        // Thầy 21/09: thẻ bài cá nhân hoá KHÔNG lấy mã tờ đề làm tên — "Bài tập về nhà · Chặng k"; mã tờ xuống dòng phụ (`dongPhu`).
        if (ct.caNhan === true) return `Bài tập về nhà · Chặng ${Number(ct.chiSo) + 1}`
        return `${tenBaiTapVeNha(bt)}: Chặng ${Number(ct.chiSo) + 1} trong ${Number(ct.tongLo)} chặng`
      }
      case 'btvn_nop': {
        const bt = btvnTheoMa(ct.ma)
        return `${tenBaiTapVeNha(bt)}: nộp bài`
      }
      case 'mom':
        return momTheoId(ct.id)?.tieuDe || 'Bài gia đình giao'
      case 'than_thu':
        return 'Thần thú: luyện dạng còn yếu'
      default:
        return v.ghiChu || TEN_LOAI[v.loai] || v.loai
    }
  }
  const tenTheoId = new Map(keHoach.viec.map((v) => [v.id, tenViec(v)]))

  const hanhDongCua = (v: ViecMayChu): HanhDongNhiemVu => {
    const ct = v.chiTiet || {}
    switch (v.loai) {
      case 'btvn_lo':
      case 'btvn_nop': {
        const bt = btvnTheoMa(ct.ma)
        return { loai: 'mo_btvn', payload: bt ? { bt } : undefined, nhanNut: v.loai === 'btvn_nop' ? 'Nộp bài' : `Làm chặng ${Number(ct.chiSo) + 1}` }
      }
      case 'mom': {
        const bai = momTheoId(ct.id)
        return { loai: 'mo_mom', payload: bai ? { id: bai.id, bai } : { id: ct.id }, nhanNut: 'Làm bài gia đình giao' }
      }
      case 'than_thu':
        return { loai: 'mo_than_thu', nhanNut: 'Luyện với thần thú' }
      case 'on_lai':
      case 'on_thi': {
        // Việc ôn câu: máy chủ đã chọn ĐÚNG các qid (chiTiet.qid) và có đường lấy đề + nộp (`/hs/cau-theo-qid`, `/hs/on-lai/nop`)
        // ⇒ mở màn LamCauOn với chính các câu ấy. `on_thi` (ôn trước ca thi) NAY mang chiTiet.qid ≤ 4 câu và dùng CHÍNH hai đường ấy — không có
        // lệnh riêng (Code 3, Worker f835f0e5, 21/09). Thiếu qid (máy chủ cũ) thì rơi về luồng luyện câu sai cũ.
        const qid = Array.isArray(ct.qid) ? ct.qid.filter((q: unknown): q is string => typeof q === 'string' && q.trim() !== '') : []
        if (qid.length > 0) return { loai: 'lam_cau_on', payload: { viecId: v.id, qid: qid.slice(0, 20), soCau: qid.length, tieuDe: tenViec(v) }, nhanNut: 'Ôn ngay' }
        return { loai: 'mo_khac_phuc', payload: { cheDo: 1, soCau: v.soCau }, nhanNut: 'Ôn ngay' }
      }
      default:
        // loại khác chưa có đường riêng ⇒ mở luồng luyện lại câu sai hiện có.
        return { loai: 'mo_khac_phuc', payload: { cheDo: 1, soCau: v.soCau }, nhanNut: 'Ôn ngay' }
    }
  }

  const viec: TheNhiemVu[] = keHoach.viec.map((v) => {
    const bac = bacMayChu(v)
    const ct = v.chiTiet || {}
    const soCau = Math.max(0, Math.floor(Number(v.soCau) || 0))
    const han = v.hanCung || v.hanMem || undefined
    const moc = msIso(v.hanCung ?? v.hanMem)
    const conLaiMs = moc === undefined ? undefined : moc - now
    const conLaiChu = conLaiMs === undefined ? undefined : dinhDangConLai(conLaiMs, now)
    const biCong = v.hien === false
    const phanMoTa: string[] = []
    if (v.loai === 'btvn_lo') {
      // Bài cá nhân hoá: đây là số câu CỦA EM ở chặng này; chưa chốt bộ thì nói thật (số chỉ là ước lượng theo ngân sách ngày).
      // Bản 1.2: nhóm "Thử sức thêm" mở cùng CHẶNG CUỐI ⇒ chỉ thẻ chặng cuối nói thêm "(+M câu thử sức thêm, không bắt buộc)"; M không nằm trong N.
      const btLo = btvnTheoMa(ct.ma)
      const soTs = ct.caNhan === true && Number(ct.chiSo) + 1 === soChangThat(btLo) ? soThuSucCua(btLo, ct) : 0
      phanMoTa.push(ct.caNhan === true ? (ct.chuaChot === true ? 'Bộ câu của em chốt khi em mở bài' : chuSoCauCuaEm(soCau, soTs)) : `${soCau} câu`)
      if (ct.treNhip === true) phanMoTa.push('đã trễ nhịp — làm trước')
    } else if (v.loai === 'mom') phanMoTa.push(ct.chuaBatDau === true ? `Gồm ${soCau} câu · 120 phút từ khi bắt đầu` : `Gồm ${soCau} câu`)
    else if (v.loai === 'btvn_nop') phanMoTa.push('Đã xong mọi chặng — bấm Nộp bài trước Hạn nộp')
    else if (soCau > 0) phanMoTa.push(`${soCau} câu`)
    if (conLaiChu) phanMoTa.push(conLaiChu)
    const tieuDe = tenTheoId.get(v.id)!
    return {
      id: v.id,
      bac,
      vaiTroMau: VAI_TRO_MAU[bac],
      bieuTuong: bieuTuongTuLoai(v.loai),
      tieuDe,
      moTa: phanMoTa.join(' · '),
      soCau,
      phutUocTinh: Math.ceil((soCau * vanToc) / 60),
      hanNop: han,
      conLaiMs,
      conLaiChu,
      dongPhu: v.loai === 'btvn_lo' && ct.caNhan === true
        ? (() => {
            const bt = btvnTheoMa(ct.ma)
            return dongPhuChang({ chiSo: Number(ct.chiSo), tongChang: soChangThat(bt) ?? NaN, hanChang: han, hanBai: bt?.hanNop, tenTo: bt?.tenBtvn || bt?.tieuDe })
          })()
        : undefined,
      tienDoLo: tienDoLoCua(v.loai, ct, btvnTheoMa),
      biCong,
      moSauKhiXong: biCong ? (v.cong ? tenTheoId.get(v.cong) : undefined) ?? 'việc trước' : undefined,
      trangThai: 'chua_lam',
      hanhDong: hanhDongCua(v),
    }
  })

  // Máy chủ (Worker a230c979+) đưa cả bài Mẹ CHƯA bắt đầu vào viec[] (chiTiet.chuaBatDau) — không tự bù thành thẻ nữa.
  // Bài Mẹ giao CŨ ngoài viec[] nằm ở `tonCu[]` của máy chủ; máy chủ chưa gửi trường ấy thì suy từ danh sách bài của màn
  // (chưa làm, không có trong viec[]/quaHan) để KHÔNG làm mất lối vào bài cũ — nhưng chỉ là hàng thu gọn, không phải thẻ việc.
  const idMomTrongKeHoach = new Set(keHoach.viec.filter((v) => v.loai === 'mom').map((v) => v.chiTiet?.id))
  const idMomQuaHan = new Set((keHoach.quaHan || []).filter((q) => q.loai === 'mom').map((q) => q.ma))
  const theTonCu = (id: string, soCauMay?: number): TheTonCu => {
    const bai = momTheoId(id)
    return {
      id,
      tieuDe: bai?.tieuDe || 'Bài gia đình giao',
      soCau: Math.max(0, Math.floor(Number(soCauMay ?? bai?.soCau) || 0)),
      hanhDong: { loai: 'mo_mom', payload: bai ? { id, bai } : { id }, nhanNut: 'Làm bài gia đình giao' },
    }
  }
  // Máy chủ đã nói gì về bài cũ (`tonCu[]` hoặc `tonCuTong`, kể cả 0) thì CHỈ tin máy chủ; chưa nói gì mới suy từ danh sách bài.
  const maySayTonCu = Array.isArray(keHoach.tonCu) || keHoach.tonCuTong !== undefined
  const baiTonCu: TheTonCu[] = maySayTonCu
    ? (Array.isArray(keHoach.tonCu) ? keHoach.tonCu : [])
        .map((t) => ({ id: String(t?.id ?? t?.ma ?? ''), soCau: t?.soCau }))
        .filter((t) => t.id)
        .map((t) => theTonCu(t.id, t.soCau))
    : (phu.dsMomGiao || [])
        .filter((m) => m && m.trangThai === 'chua_lam' && !idMomTrongKeHoach.has(m.id) && !idMomQuaHan.has(m.id))
        .map((m) => theTonCu(m.id))
  const tonCu: TonCu = {
    soBai: Math.max(baiTonCu.length, Math.floor(Number(keHoach.tonCuTong?.soBai) || 0)),
    soCau: Math.max(baiTonCu.reduce((t, b) => t + b.soCau, 0), Math.floor(Number(keHoach.tonCuTong?.soCau) || 0)),
    bai: baiTonCu,
  }

  const quaHan: TheQuaHan[] = (keHoach.quaHan || []).map((q) => {
    if (q.loai === 'mom') {
      const bai = momTheoId(q.ma)
      return { id: `qua_han:mom:${q.ma}`, loai: 'mom', tieuDe: bai?.tieuDe || 'Bài gia đình giao', chu: 'Đã hết giờ — mở để nộp phần đã lưu', hanhDong: { loai: 'mo_mom', payload: bai ? { id: bai.id, bai } : { id: q.ma }, nhanNut: 'Mở để nộp' } }
    }
    const bt = btvnTheoMa(q.ma)
    return { id: `qua_han:btvn:${q.ma}`, loai: 'btvn', tieuDe: tenBaiTapVeNha(bt), chu: 'Đã qua Hạn nộp — nhờ Thầy gia hạn' }
  })

  const mucTieu = Math.max(0, Number(keHoach.nganSach.mucTieuCau) || 0)
  const daLam = Math.max(0, Number(keHoach.tienBo.daLamCau) || 0)
  const lenBac = Math.max(0, Number(keHoach.tienBo.lenBac) || 0)
  const conThieu = Math.max(0, Number(keHoach.tienBo.conThieu) || 0)
  // Nộp ≠ nắm: chỉ nói "đã làm N câu, M câu lên bậc", không nói "nắm chắc".
  const ghiChuTienDo0 = `Đã làm ${daLam} câu${lenBac > 0 ? `, ${lenBac} câu lên bậc` : ''} · ${conThieu > 0 ? `còn ${conThieu} câu là đạt hôm nay` : 'đã đủ số câu tối thiểu hôm nay'}`
  const chuoi = Math.max(0, Number(keHoach.chuoiDat) || 0)
  const daDo = keHoach.nganSach.vanTocNguon === 'do' && Number(keHoach.nganSach.vanTocGiay) > 0
  // "Đã xong việc hôm nay" chỉ khi CẢ HAI cùng đạt: `tienBo.dat` và (nếu máy chủ có nói) `exp.datNgay.dat`. Ngày nghỉ: chỉ `tienBo.dat`.
  const datNgayExp = keHoach.exp?.datNgay
  const coDatNgay = !!datNgayExp && datNgayExp.laNghi !== true && typeof datNgayExp.dat === 'boolean'
  const expChuaDat = coDatNgay && datNgayExp!.dat === false
  const thieuDat = docThieuDat(keHoach.tienBo)
  const chuaDat = expChuaDat || thieuDat !== null
  // Khi máy chủ CÓ nói `datNgay` thì câu trạng thái CHỈ theo `datNgay` (kèm số): hai định nghĩa "đạt" mà nói cùng lúc sẽ tự mâu thuẫn
  // ("đã đủ số câu tối thiểu · Để đạt hôm nay: chưa đủ số câu tối thiểu"). Không có `datNgay` thì giữ câu cũ theo `tienBo`.
  const soConThieu = Math.max(1, Math.floor(Number(datNgayExp?.toiThieu) || 0) - Math.floor(Number(datNgayExp?.daLam) || 0))
  const CHU_THIEU: Record<string, string> = {
    cau_toi_thieu: `làm thêm ${soConThieu} câu`,
    tre_nhip: 'làm nốt việc bắt buộc đang trễ nhịp',
    chua_len_bac: 'lên bậc ít nhất một câu đến lịch ôn lại',
  }
  const thieuChu = [...(expChuaDat ? (datNgayExp!.thieu || []).map((k) => CHU_THIEU[k]).filter(Boolean) : []), ...(thieuDat ? [thieuDat] : [])]
  const dauTienDo = `Đã làm ${daLam} câu${lenBac > 0 ? `, ${lenBac} câu lên bậc` : ''}`
  // Thiếu CÂU ĐÚNG (Điều 7): nói riêng, kèm số câu làm còn thiếu nếu có — không lẫn với "đã đủ số câu tối thiểu" (hai số khác nhau).
  const ghiChuTienDo = coDatNgay
    ? `${dauTienDo} · ${chuaDat ? (thieuChu.length > 0 ? `Để đạt hôm nay: ${thieuChu.join('; ')}` : 'chưa đạt hôm nay') : 'đã đạt hôm nay'}`
    : thieuDat
    ? `${dauTienDo} · Để đạt hôm nay: ${[...(conThieu > 0 ? [`làm thêm ${conThieu} câu`] : []), thieuDat].join('; ')}`
    : ghiChuTienDo0
  return dongGoi('ke_hoach_ngay', viec, {
    tienDo: { daLam, mucTieu, phanTram: phanTram(daLam, mucTieu), ghiChu: ghiChuTienDo },
    tocDo: daDo
      ? { giayMoiCau: Math.round(Number(keHoach.nganSach.vanTocGiay)), chu: `${Math.round(Number(keHoach.nganSach.vanTocGiay))} giây mỗi câu, trung bình 30 ngày gần đây` }
      : { chu: keHoach.nganSach.ghiChuVanToc || 'tốc độ: chưa đo' },
    chuoiNgay: { soNgay: chuoi, chu: `Chuỗi ${chuoi} ngày` },
    // `chua_do_toc_do` đã in ở dòng tốc độ (nguyên văn ghiChuVanToc) — không in hai lần.
    canhBao: (keHoach.canhBao || []).filter((c) => c.loai !== 'chua_do_toc_do' && c.noiDung).map((c) => ({ loai: c.loai, noiDung: c.noiDung })),
    quaHan,
    capNhatLuc: keHoach.capNhatLuc,
    ghiChuCu: cu && keHoach.capNhatLuc ? `Kế hoạch lúc ${gioVietNam(keHoach.capNhatLuc)} — chưa cập nhật được, đang hiện bản cuối.` : undefined,
    ngayNghi: keHoach.lanNghi === true,
    thanThu: docThanThu(keHoach.thanThu),
    tonCu,
    ...docExp(keHoach),
    doanMo: keHoach.doanMo === true,
    boNao: (() => { const v = docBoNao(keHoach); return v.hs ? { hs: v.hs, ph: null } : null })(),
    canhBaoThay: docCanhBaoThay(keHoach.canhBaoThay),
    thuThachRieng: null,
  }, { dat: keHoach.tienBo.dat === true && !chuaDat, daLamCau: daLam, lenBac })
}

const TEN_LOAI: Record<string, string> = {
  btvn_lo: 'Chặng bài tập về nhà',
  mom: 'Bài gia đình giao',
  on_lai: 'Ôn câu tới hạn nhắc lại',
  on_thi: 'Ôn trước ca kiểm tra',
  than_thu: 'Thần thú: luyện dạng còn yếu',
}

/**
 * Cửa vào duy nhất cho giao diện: có kế hoạch máy chủ HỢP LỆ thì dùng (`cu` = đang hiện bản cuối
 * vì lần gọi mới lỗi), không thì rơi về trợ lý. `dsBtvn`/`dsMomGiao` là dữ liệu thô của màn.
 */
/** Số chặng THẬT của bài cá nhân hoá: `soChang` của /hs/btvn (= btvn_em.so_chang, chốt cùng bộ câu). KHÔNG lấy `chiTiet.tongLo` của
 * kế hoạch ngày và KHÔNG đếm chặng đã mở (thầy 21/09: thẻ ghi "Chặng 1/1" trên bài 4 chặng). Chưa chốt / chưa biết ⇒ undefined. */
function soChangThat(bt: { soChang?: unknown } | undefined): number | undefined {
  const n = Number(bt?.soChang)
  return Number.isInteger(n) && n >= 1 ? n : undefined
}

/** BẢN 1.2 — số câu "thử sức thêm, không bắt buộc" của bài cá nhân hoá: `soThuSucThem` ở /hs/btvn (ưu tiên) hoặc ở chiTiet của kế hoạch ngày. Không phải số nguyên dương ⇒ 0. */
export function soThuSucCua(bt: { soThuSucThem?: unknown } | undefined, ct?: { soThuSucThem?: unknown }): number {
  for (const v of [bt?.soThuSucThem, ct?.soThuSucThem]) {
    const n = Number(v)
    if (v !== null && v !== undefined && v !== '' && Number.isInteger(n) && n >= 1) return n
  }
  return 0
}

/** Thanh tiến độ lô/chặng. Bài thường: theo `tongLo` của kế hoạch (như cũ). Bài cá nhân hoá: CHỈ khi biết số chặng thật. */
function tienDoLoCua(
  loai: string,
  ct: Record<string, any>,
  btvnTheoMa: (ma: unknown) => { soChang?: unknown } | undefined,
): TheNhiemVu['tienDoLo'] {
  if (loai !== 'btvn_lo' || !Number.isFinite(Number(ct.chiSo))) return undefined
  if (ct.caNhan === true) {
    const tong = soChangThat(btvnTheoMa(ct.ma))
    return tong !== undefined && tong > Number(ct.chiSo) ? { hienTai: Number(ct.chiSo) + 1, tong, laChang: true } : undefined
  }
  return Number(ct.tongLo) > Number(ct.chiSo) ? { hienTai: Number(ct.chiSo) + 1, tong: Number(ct.tongLo) } : undefined
}

export function dungBangNhiemVu(input: {
  keHoachNgay?: KeHoachNgayMayChu | null
  keHoachTroLy: KeHoachNgayTroLy
  now: number
  dsBtvn?: any[]
  dsMomGiao?: any[]
  cu?: boolean
}): DuLieuBangNhiemVu {
  if (laKeHoachNgayHopLe(input.keHoachNgay)) {
    return tuKeHoachNgay(input.keHoachNgay, input.now, { dsBtvn: input.dsBtvn, dsMomGiao: input.dsMomGiao }, input.cu === true)
  }
  return tuKeHoachTroLy(input.keHoachTroLy, { dsMomGiao: input.dsMomGiao, now: input.now })
}

// ─── APP PHỤ HUYNH KHÔNG CÒN GÌ CỦA GAME (thầy lệnh 21/09; `prompt-ph-giao-them-bai-2109.md` mục B) ─────────────────────────────
// Phụ huynh chỉ thấy việc HỌC: điểm, số câu, lên bậc, dạng con vấp, lịch ôn, bài tập về nhà, hạn nộp. Không thần thú, EXP, mảnh khiên/khiên, Đoàn Hộ Tống,
// Đảo thần thú, Võ đài, đường vào game. Ba lớp: (1) máy chủ không gửi (Code 3) · (2) hàm này gỡ ở DỮ LIỆU trước khi vẽ · (3) màn phụ huynh cũng không vẽ (BangNhiemVu/
// DauTrang/TheVinhDanh/BangTinPhuHuynh có chốt `laPh`) — test chốt chặn quét chữ hiển thị của cả cây.

/** Chữ thuộc game. `EXP` đứng riêng (không dính chữ khác); "Linh Tâm" là tên quái của Đoàn Hộ Tống. */
export const CHU_GAME_PH = /thần thú|\bEXP\b|khiên|Đoàn Hộ Tống|Đảo thần thú|Võ đài|Linh Tâm/i

/** Chữ tự do của máy chủ (cảnh báo, ghi chú, lời Bộ não…): có chữ game ⇒ bỏ CẢ câu (rỗng), không cắt vụn. */
export const khongChuGame = (s: string | null | undefined): string => {
  const t = typeof s === 'string' ? s : ''
  return CHU_GAME_PH.test(t) ? '' : t
}

/** Lời Bộ não cho phụ huynh: câu nào có chữ game bị bỏ; hết cả lời lẫn thư ⇒ null (không thẻ). */
export function sachBoNaoChoPhuHuynh<T extends { loiNhan: string; thuTuan: string } | null | undefined>(ph: T): T | null {
  if (!ph) return null
  const loiNhan = khongChuGame(ph.loiNhan)
  const thuTuan = khongChuGame(ph.thuTuan)
  return loiNhan || thuTuan ? { ...ph, loiNhan, thuTuan } : null
}

/** Việc "luyện dạng còn yếu" (loại `than_thu` của máy chủ) nói bằng chữ HỌC TẬP: "Luyện dạng con còn vấp · 6 câu" (số câu do thẻ tự in). */
export const TEN_VIEC_LUYEN_DANG_PH = 'Luyện dạng con còn vấp'

function sachViecPh(v: TheNhiemVu): TheNhiemVu {
  const laViecGame = v.hanhDong.loai === 'mo_than_thu'
  return {
    ...v,
    tieuDe: laViecGame ? TEN_VIEC_LUYEN_DANG_PH : v.tieuDe,
    moTa: khongChuGame(v.moTa),
    dongPhu: v.dongPhu?.filter((x) => khongChuGame(x)),
    hanhDong: laViecGame ? { ...v.hanhDong, nhanNut: 'Luyện dạng còn vấp' } : v.hanhDong,
  }
}

/** Gỡ MỌI thứ của game khỏi dữ liệu Bảng nhiệm vụ trước khi đưa cho màn phụ huynh. Thuần; không đụng điểm, số câu, hạn nộp, bậc việc. */
export function boGameChoPhuHuynh(d: DuLieuBangNhiemVu): DuLieuBangNhiemVu {
  return {
    ...d,
    thanThu: { kieu: 'chua_biet' },
    exp: null,
    expNhan: [],
    manhNhan: [],
    doanMo: false,
    thuThachRieng: null,
    lamNgay: d.lamNgay ? sachViecPh(d.lamNgay) : null,
    cacBac: d.cacBac.map((n) => ({ ...n, viec: n.viec.map(sachViecPh) })),
    canhBao: d.canhBao.filter((c) => khongChuGame(c.noiDung)),
    tienDo: { ...d.tienDo, ghiChu: khongChuGame(d.tienDo.ghiChu) || undefined },
  }
}

// ─── BẢN NHỚ (stale-while-revalidate) ────────────────────────────────────────────────────
// Mỗi lần mở app đều phải chờ thêm một vòng API. Nên nhớ bản kế hoạch vừa vẽ xong (cả tên bài và
// payload để bấm được) và VẼ NGAY từ đó khi mở lại, rồi gọi máy chủ và thay khi có bản mới.
// Bản nhớ của NGÀY KHÁC (theo ngày Việt Nam) KHÔNG được dùng để vẽ việc: việc hôm qua đã hết nghĩa.

export interface BanNhoBangNhiemVu {
  /** Ngày VN (YYYY-MM-DD) lúc lưu. */
  ngay: string
  luuLuc: number
  duLieu: DuLieuBangNhiemVu
}

/** Chỉ lưu bản DỰNG TỪ MÁY CHỦ và đang MỚI (không phải bản cuối, không phải nguồn trợ lý). */
export function dongGoiBanNho(duLieu: DuLieuBangNhiemVu, now: number): BanNhoBangNhiemVu | null {
  if (duLieu.nguon !== 'ke_hoach_ngay' || duLieu.ghiChuCu) return null
  const ngay = ngayVietNam(now)
  // "Vừa nhận EXP" là thông báo MỘT LẦN của đúng lần gọi ấy: lưu vào bản nhớ thì mở lại app sẽ phát lại.
  return ngay ? { ngay, luuLuc: now, duLieu: { ...duLieu, expNhan: [], manhNhan: [] } } : null
}

function docExpDaLuu(x: any): DuLieuExp | null {
  if (!x || typeof x !== 'object' || !Number.isFinite(x.homNay)) return null
  const mk = x.manhKhien
  return {
    homNay: x.homNay,
    chiTiet: (Array.isArray(x.chiTiet) ? x.chiTiet : []).filter((c: any) => c && typeof c.ghiChu === 'string' && c.ghiChu).map((c: any) => ({ loai: String(c.loai ?? ''), exp: Number(c.exp) || 0, ghiChu: c.ghiChu })),
    manhKhien: mk && Number.isFinite(mk.manh) ? { manh: mk.manh, moiKhien: Number(mk.moiKhien) || 12, khienConLai: Number(mk.khienConLai) || 0 } : null,
  }
}

const laMang = Array.isArray
const laThe = (v: any): v is TheNhiemVu =>
  !!v && typeof v.id === 'string' && typeof v.tieuDe === 'string' && !!v.hanhDong && typeof v.hanhDong.loai === 'string' && typeof v.biCong === 'boolean'

function lamMoiThe(v: TheNhiemVu, now: number): TheNhiemVu {
  const moc = msIso(v.hanNop)
  if (moc === undefined) return v
  const conLaiMs = moc - now
  return { ...v, conLaiMs, conLaiChu: dinhDangConLai(conLaiMs, now) }
}

/**
 * Đọc lại bản nhớ: đúng cấu trúc + ĐÚNG NGÀY hôm nay (VN) mới dùng. Thời gian còn lại tính lại theo `now`
 * (bản nhớ lưu lúc khác), gắn dòng "Kế hoạch lúc HH:MM · đang cập nhật". Sai một điều kiện ⇒ null.
 */
export function phucHoiBanNho(x: unknown, now: number): DuLieuBangNhiemVu | null {
  const b = x as BanNhoBangNhiemVu | null
  if (!b || typeof b !== 'object' || typeof b.ngay !== 'string' || b.ngay !== ngayVietNam(now)) return null
  const d = b.duLieu as DuLieuBangNhiemVu | undefined
  if (!d || d.nguon !== 'ke_hoach_ngay' || !laMang(d.cacBac) || d.cacBac.length !== THU_TU_BAC.length || !laMang(d.quaHan) || !laMang(d.canhBao)) return null
  if (!d.tienDo || !Number.isFinite(d.tienDo.daLam) || !Number.isFinite(d.tienDo.mucTieu) || !d.tocDo || !d.chuoiNgay) return null
  if (d.lamNgay !== null && !laThe(d.lamNgay)) return null
  if (!d.cacBac.every((g, i) => g && g.bac === THU_TU_BAC[i] && laMang(g.viec) && g.viec.every(laThe))) return null
  const gioLuu = d.capNhatLuc ? gioVietNam(d.capNhatLuc) : ''
  const tt: any = (d as any).thanThu
  const thanThu: TrangThaiThanThu =
    tt && tt.kieu === 'co' && typeof tt.pet === 'string' && tt.pet && Number.isFinite(tt.cap)
      ? { kieu: 'co', pet: tt.pet, cap: Math.max(1, Math.floor(tt.cap)), ten: typeof tt.ten === 'string' ? tt.ten : undefined }
      : tt && tt.kieu === 'chua_chon'
        ? { kieu: 'chua_chon' }
        : { kieu: 'chua_biet' }
  const tc: any = (d as any).tonCu
  const tonCu: TonCu =
    tc && Number.isFinite(tc.soBai) && Number.isFinite(tc.soCau) && Array.isArray(tc.bai) && tc.bai.every((b: any) => b && typeof b.id === 'string' && b.hanhDong && typeof b.hanhDong.loai === 'string')
      ? tc
      : { soBai: 0, soCau: 0, bai: [] }
  const xh: any = (d as any).daXongHomNay
  const daXongHomNay = xh && Number.isFinite(xh.daLamCau) && Number.isFinite(xh.lenBac) ? { daLamCau: xh.daLamCau, lenBac: xh.lenBac } : null
  return {
    ...d,
    thanThu,
    tonCu,
    daXongHomNay,
    exp: docExpDaLuu((d as any).exp),
    expNhan: [],
    manhNhan: [],
    doanMo: (d as any).doanMo === true,
    boNao: (() => { const hs = docBoNaoHocSinh((d as any).boNao?.hs); return hs ? { hs, ph: null } : null })(),
    canhBaoThay: [],
    thuThachRieng: null,
    lamNgay: d.lamNgay ? lamMoiThe(d.lamNgay, now) : null,
    cacBac: d.cacBac.map((g) => ({ ...g, viec: g.viec.map((v) => lamMoiThe(v, now)) })),
    ghiChuCu: gioLuu ? `Kế hoạch lúc ${gioLuu} · đang cập nhật…` : 'Kế hoạch đã nhớ · đang cập nhật…',
  }
}
