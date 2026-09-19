// Bộ chuyển DUY NHẤT giữa dữ liệu nhiệm vụ và màn "Bảng nhiệm vụ".
// Hai nguồn — `tongHopKeHoachTroLy` (đang chạy) và `/hs/ke-hoach-ngay` (GĐ 2 của
// DE-XUAT-CA-NHAN-HOA-1909.md) — ra CÙNG một cấu trúc `DuLieuBangNhiemVu`.
// Hàm thuần: không đọc giờ, không gọi mạng, KHÔNG xếp lại thứ tự — thứ tự là
// của dữ liệu; ở đây chỉ gán bậc, tính cổng và chọn thẻ "Làm ngay".
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
  khan: 'KHẨN',
  bat_buoc: 'BẮT BUỘC HÔM NAY',
  nen_lam: 'NÊN LÀM',
  tuy_chon: 'TUỲ CHỌN',
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
  /** Lô BTVN: `hienTai` đếm từ 1. Chỉ có khi dữ liệu nói rõ "Lô x/y". */
  tienDoLo?: { hienTai: number; tong: number }
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
  const m = /Lô\s+(\d+)\s*\/\s*(\d+)/.exec(tieuDe)
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

function dongGoi(
  nguon: DuLieuBangNhiemVu['nguon'],
  viec: TheNhiemVu[],
  phanConLai: Pick<DuLieuBangNhiemVu, 'tienDo' | 'tocDo' | 'chuoiNgay' | 'canhBao' | 'quaHan' | 'capNhatLuc' | 'ghiChuCu' | 'ngayNghi' | 'thanThu' | 'tonCu'>,
): DuLieuBangNhiemVu {
  // Chỉ còn việc tuỳ chọn ⇒ coi là "hôm nay chưa có việc": không dựng thẻ nào.
  const coViecThat = viec.some((v) => v.bac !== 'tuy_chon')
  if (!coViecThat) return { nguon, lamNgay: null, cacBac: gomBac([]), trong: true, ...phanConLai }
  const lamNgay = viec.find((v) => !v.biCong) ?? null
  return {
    nguon,
    lamNgay,
    cacBac: gomBac(viec.filter((v) => v !== lamNgay)),
    trong: false,
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
      hanhDong: { loai: 'mo_mom', payload: { id: bai.id, bai }, nhanNut: quaHan ? 'Mở để hoàn tất nộp bài' : 'Làm bài của Mom' },
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
    chuoiNgay: { soNgay: streak.soNgayLienTiep, chu: `${streak.soNgayLienTiep} ngày học liên tiếp` },
    canhBao: [],
    quaHan: [],
    capNhatLuc: undefined,
    ghiChuCu: undefined,
    ngayNghi: false,
    // Nguồn trợ lý chỉ có bảng V1 (không có id thần thú) — KHÔNG đoán, để giữ chỗ.
    thanThu: { kieu: 'chua_biet' },
    tonCu: { soBai: 0, soCau: 0, bai: [] },
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
  tienBo: { daLamCau: number; lenBac?: number; tutBac?: number; dat?: boolean; toiThieuCau?: number; conThieu?: number }
  chuoiDat?: number
  lanNghi?: boolean
  capNhatLuc?: string
  /** Thần thú của em (game V2). `null` = chưa chọn; vắng = máy chủ cũ. */
  thanThu?: { pet?: string | null; cap?: number; nickname?: string | null } | null
  /** Bài Mẹ giao cũ chưa làm (ngoài 3 ngày/3 bài gần nhất trong viec[]). Vắng = máy chủ chưa gửi trường này. */
  tonCu?: { id?: string; ma?: string; soCau?: number; taoLuc?: string }[]
  tonCuTong?: { soBai?: number; soCau?: number }
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
        return `${bt?.tenBtvn || bt?.tieuDe || 'BTVN'}: Lô ${Number(ct.chiSo) + 1}/${Number(ct.tongLo)}`
      }
      case 'btvn_nop': {
        const bt = btvnTheoMa(ct.ma)
        return `${bt?.tenBtvn || bt?.tieuDe || 'BTVN'}: nộp bài`
      }
      case 'mom':
        return momTheoId(ct.id)?.tieuDe || 'Bài của Mẹ giao'
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
        return { loai: 'mo_btvn', payload: bt ? { bt } : undefined, nhanNut: v.loai === 'btvn_nop' ? 'Nộp bài' : `Làm Lô ${Number(ct.chiSo) + 1}` }
      }
      case 'mom': {
        const bai = momTheoId(ct.id)
        return { loai: 'mo_mom', payload: bai ? { id: bai.id, bai } : { id: ct.id }, nhanNut: 'Làm bài của Mom' }
      }
      case 'than_thu':
        return { loai: 'mo_than_thu', nhanNut: 'Luyện với thần thú' }
      case 'on_lai': {
        // Việc ôn câu: máy chủ đã chọn ĐÚNG các qid (chiTiet.qid) và có đường lấy đề + nộp (`/hs/cau-theo-qid`, `/hs/on-lai/nop`)
        // ⇒ mở màn LamCauOn với chính các câu ấy. Thiếu qid (máy chủ cũ) thì rơi về luồng luyện câu sai cũ.
        const qid = Array.isArray(ct.qid) ? ct.qid.filter((q: unknown): q is string => typeof q === 'string' && q.trim() !== '') : []
        if (qid.length > 0) return { loai: 'lam_cau_on', payload: { viecId: v.id, qid: qid.slice(0, 20), soCau: qid.length, tieuDe: tenViec(v) }, nhanNut: 'Ôn ngay' }
        return { loai: 'mo_khac_phuc', payload: { cheDo: 1, soCau: v.soCau }, nhanNut: 'Ôn ngay' }
      }
      default:
        // on_thi: chưa có đường lấy/nộp riêng ⇒ mở luồng luyện lại câu sai hiện có.
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
    const conLaiChu = conLaiMs === undefined ? undefined : dinhDangConLai(conLaiMs)
    const biCong = v.hien === false
    const phanMoTa: string[] = []
    if (v.loai === 'btvn_lo') {
      phanMoTa.push(`${soCau} câu`)
      if (ct.treNhip === true) phanMoTa.push('đã trễ nhịp — làm trước')
    } else if (v.loai === 'mom') phanMoTa.push(ct.chuaBatDau === true ? `Gồm ${soCau} câu · 120 phút từ khi bắt đầu` : `Gồm ${soCau} câu`)
    else if (v.loai === 'btvn_nop') phanMoTa.push('Đã xong mọi lô — bấm nộp bài trước hạn')
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
      tienDoLo: v.loai === 'btvn_lo' && Number.isFinite(Number(ct.chiSo)) && Number(ct.tongLo) > Number(ct.chiSo)
        ? { hienTai: Number(ct.chiSo) + 1, tong: Number(ct.tongLo) }
        : undefined,
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
      tieuDe: bai?.tieuDe || 'Bài Mẹ giao',
      soCau: Math.max(0, Math.floor(Number(soCauMay ?? bai?.soCau) || 0)),
      hanhDong: { loai: 'mo_mom', payload: bai ? { id, bai } : { id }, nhanNut: 'Làm bài của Mom' },
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
      return { id: `qua_han:mom:${q.ma}`, loai: 'mom', tieuDe: bai?.tieuDe || 'Bài của Mẹ giao', chu: 'Đã hết giờ — mở để nộp phần đã lưu', hanhDong: { loai: 'mo_mom', payload: bai ? { id: bai.id, bai } : { id: q.ma }, nhanNut: 'Mở để nộp' } }
    }
    const bt = btvnTheoMa(q.ma)
    return { id: `qua_han:btvn:${q.ma}`, loai: 'btvn', tieuDe: bt?.tenBtvn || bt?.tieuDe || 'BTVN', chu: 'Đã quá hạn — cần Thầy gia hạn' }
  })

  const mucTieu = Math.max(0, Number(keHoach.nganSach.mucTieuCau) || 0)
  const daLam = Math.max(0, Number(keHoach.tienBo.daLamCau) || 0)
  const lenBac = Math.max(0, Number(keHoach.tienBo.lenBac) || 0)
  const conThieu = Math.max(0, Number(keHoach.tienBo.conThieu) || 0)
  // Nộp ≠ nắm: chỉ nói "đã làm N câu, M câu lên bậc", không nói "nắm chắc".
  const ghiChuTienDo = `Đã làm ${daLam} câu${lenBac > 0 ? `, ${lenBac} câu lên bậc ôn` : ''} · ${conThieu > 0 ? `còn ${conThieu} câu là đạt hôm nay` : 'đã đủ số câu tối thiểu hôm nay'}`
  const chuoi = Math.max(0, Number(keHoach.chuoiDat) || 0)
  const daDo = keHoach.nganSach.vanTocNguon === 'do' && Number(keHoach.nganSach.vanTocGiay) > 0
  return dongGoi('ke_hoach_ngay', viec, {
    tienDo: { daLam, mucTieu, phanTram: phanTram(daLam, mucTieu), ghiChu: ghiChuTienDo },
    tocDo: daDo
      ? { giayMoiCau: Math.round(Number(keHoach.nganSach.vanTocGiay)), chu: `tốc độ ${Math.round(Number(keHoach.nganSach.vanTocGiay))} s/câu · đo 30 ngày` }
      : { chu: keHoach.nganSach.ghiChuVanToc || 'tốc độ: chưa đo' },
    chuoiNgay: { soNgay: chuoi, chu: `${chuoi} ngày đạt liên tiếp` },
    // `chua_do_toc_do` đã in ở dòng tốc độ (nguyên văn ghiChuVanToc) — không in hai lần.
    canhBao: (keHoach.canhBao || []).filter((c) => c.loai !== 'chua_do_toc_do' && c.noiDung).map((c) => ({ loai: c.loai, noiDung: c.noiDung })),
    quaHan,
    capNhatLuc: keHoach.capNhatLuc,
    ghiChuCu: cu && keHoach.capNhatLuc ? `Kế hoạch lúc ${gioVietNam(keHoach.capNhatLuc)} — chưa cập nhật được, đang hiện bản cuối.` : undefined,
    ngayNghi: keHoach.lanNghi === true,
    thanThu: docThanThu(keHoach.thanThu),
    tonCu,
  })
}

const TEN_LOAI: Record<string, string> = {
  btvn_lo: 'Lô BTVN',
  mom: 'Bài gia đình giao',
  on_lai: 'Ôn câu tới hạn nhắc lại',
  on_thi: 'Ôn trước ca thi',
  than_thu: 'Thần thú: luyện dạng còn yếu',
}

/**
 * Cửa vào duy nhất cho giao diện: có kế hoạch máy chủ HỢP LỆ thì dùng (`cu` = đang hiện bản cuối
 * vì lần gọi mới lỗi), không thì rơi về trợ lý. `dsBtvn`/`dsMomGiao` là dữ liệu thô của màn.
 */
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
  return ngay ? { ngay, luuLuc: now, duLieu } : null
}

const laMang = Array.isArray
const laThe = (v: any): v is TheNhiemVu =>
  !!v && typeof v.id === 'string' && typeof v.tieuDe === 'string' && !!v.hanhDong && typeof v.hanhDong.loai === 'string' && typeof v.biCong === 'boolean'

function lamMoiThe(v: TheNhiemVu, now: number): TheNhiemVu {
  const moc = msIso(v.hanNop)
  if (moc === undefined) return v
  const conLaiMs = moc - now
  return { ...v, conLaiMs, conLaiChu: dinhDangConLai(conLaiMs) }
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
  return {
    ...d,
    thanThu,
    tonCu,
    lamNgay: d.lamNgay ? lamMoiThe(d.lamNgay, now) : null,
    cacBac: d.cacBac.map((g) => ({ ...g, viec: g.viec.map((v) => lamMoiThe(v, now)) })),
    ghiChuCu: gioLuu ? `Kế hoạch lúc ${gioLuu} · đang cập nhật…` : 'Kế hoạch đã nhớ · đang cập nhật…',
  }
}
