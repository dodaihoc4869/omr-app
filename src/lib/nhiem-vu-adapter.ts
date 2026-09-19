// Bộ chuyển DUY NHẤT giữa dữ liệu nhiệm vụ và màn "Bảng nhiệm vụ".
// Hai nguồn — `tongHopKeHoachTroLy` (đang chạy) và `/hs/ke-hoach-ngay` (GĐ 2 của
// DE-XUAT-CA-NHAN-HOA-1909.md) — ra CÙNG một cấu trúc `DuLieuBangNhiemVu`.
// Hàm thuần: không đọc giờ, không gọi mạng, KHÔNG xếp lại thứ tự — thứ tự là
// của dữ liệu; ở đây chỉ gán bậc, tính cổng và chọn thẻ "Làm ngay".
import { dinhDangConLai } from './tro-ly-ca-nhan'
import type { CapDoUuTien, KeHoachNgayTroLy, NhiemVuTroLy } from './tro-ly-ca-nhan'

export type BacNhiemVu = 'khan' | 'bat_buoc' | 'nen_lam' | 'tuy_chon'
/** Vai trò màu Material 3 của từng bậc — giao diện chỉ đọc, không tự chọn màu. */
export type VaiTroMau = 'error' | 'primary' | 'secondary' | 'tertiary'
export type BieuTuongViec = 'btvn' | 'mom' | 'on' | 'muc_tieu' | 'sao'
export type HanhDongNhiemVu = NhiemVuTroLy['hanhDong']

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
  expThuong: number
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
  tienDo: { daLam: number; mucTieu: number; phanTram: number }
  /** `giayMoiCau` thiếu = chưa đo; `chu` luôn nói thật ("chưa đo"). */
  tocDo: { giayMoiCau?: number; chu: string }
  chuoiNgay: { soNgay: number; chu: string }
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
  phanConLai: Pick<DuLieuBangNhiemVu, 'tienDo' | 'tocDo' | 'chuoiNgay'>,
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
      expThuong: soCau * 2,
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
      expThuong: t.expThuong,
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
    },
    tocDo: { chu: 'tốc độ: chưa đo' },
    // `chuoiNgayHoc` đếm ngày CÓ NỘP BÀI, chưa phải ngày "đạt" — nói đúng tên.
    chuoiNgay: { soNgay: streak.soNgayLienTiep, chu: `${streak.soNgayLienTiep} ngày học liên tiếp` },
  })
}

/** Một việc trong `viec_json` của `/hs/ke-hoach-ngay` (mục 1.3 của đề xuất). */
export interface ViecKeHoachNgay {
  id: string
  loai: string
  thuTu?: number
  soCau?: number
  hanCung?: string | null
  hanMem?: string | null
  batBuoc?: boolean
  khan?: boolean
  /** id việc đứng ngay trước (cổng). */
  cong?: string | null
  nguon?: string
  nhan?: 'bu' | 'tuy_chon' | string
  trangThai?: 'chua_lam' | 'dang_lam' | 'xong' | string
  tieuDe?: string
  moTa?: string
  hanhDong?: HanhDongNhiemVu
}

export interface KeHoachNgayMayChu {
  viec: ViecKeHoachNgay[]
  nganSach?: { mucTieuCau?: number; vanToc?: number | null; soMauTocDo?: number }
  soCauDaLam?: number
  /** Số ngày `dat` liên tiếp (ngày nghỉ thầy đặt không đứt). */
  chuoiDat?: number
}

const TEN_LOAI: Record<string, string> = {
  btvn_lo: 'Lô BTVN',
  mom: 'Bài gia đình giao',
  on_toi_han: 'Ôn câu sai tới hạn',
  on_thi: 'Ôn trước ca thi',
  than_thu: 'Thần thú: luyện dạng còn yếu',
  thu_thach: 'Thử thách',
}

function hanhDongMacDinh(loai: string): HanhDongNhiemVu {
  if (loai.startsWith('btvn')) return { loai: 'mo_btvn', nhanNut: 'Bắt đầu lô này' }
  if (loai === 'mom') return { loai: 'mo_mom', nhanNut: 'Làm bài gia đình giao' }
  if (loai === 'on_toi_han' || loai.startsWith('sua_loi')) return { loai: 'mo_khac_phuc', nhanNut: 'Ôn ngay' }
  if (loai === 'than_thu') return { loai: 'mo_than_thu', nhanNut: 'Luyện với thần thú' }
  if (loai === 'thu_thach') return { loai: 'mo_thu_thach', nhanNut: 'Thử sức' }
  return { loai: 'mo_khac_phuc', nhanNut: 'Bắt đầu' }
}

function bacKeHoachNgay(v: ViecKeHoachNgay): BacNhiemVu {
  if (v.khan) return 'khan'
  if (v.batBuoc) return 'bat_buoc'
  if (v.nhan === 'tuy_chon' || v.loai === 'than_thu' || v.loai === 'thu_thach') return 'tuy_chon'
  return 'nen_lam'
}

/** NGUỒN 2 — `viec_json` đã xếp của máy chủ. `now` chỉ để tính thời gian còn lại. */
export function tuKeHoachNgay(keHoach: KeHoachNgayMayChu, now: number): DuLieuBangNhiemVu {
  const tatCa = [...(keHoach.viec || [])]
  const tenTheoId = new Map<string, string>()
  for (const v of tatCa) tenTheoId.set(v.id, v.tieuDe || TEN_LOAI[v.loai] || v.loai)

  const viec: TheNhiemVu[] = []
  // Cổng hiển thị (đề xuất 1.3): việc i mở khi MỌI việc bắt buộc đứng trước đã
  // xong, hoặc chính nó mang `khan`.
  let chanDauTien: ViecKeHoachNgay | undefined
  for (const v of tatCa) {
    const xong = v.trangThai === 'xong'
    if (!xong) {
      const bac = bacKeHoachNgay(v)
      const biCong = !v.khan && chanDauTien !== undefined
      const tieuDe = tenTheoId.get(v.id)!
      const han = v.hanCung || v.hanMem || undefined
      const mocHan = han ? Date.parse(han) : NaN
      const conLaiMs = Number.isFinite(mocHan) ? mocHan - now : undefined
      const soCau = Math.max(0, Math.floor(Number(v.soCau) || 0))
      viec.push({
        id: v.id,
        bac,
        vaiTroMau: VAI_TRO_MAU[bac],
        bieuTuong: bieuTuongTuLoai(v.loai),
        tieuDe,
        moTa: v.moTa || (soCau > 0 ? `${soCau} câu` : ''),
        soCau,
        phutUocTinh: Math.ceil((soCau * (keHoach.nganSach?.vanToc || 90)) / 60),
        expThuong: soCau * 2,
        hanNop: han,
        conLaiMs,
        conLaiChu: conLaiMs === undefined ? undefined : dinhDangConLai(conLaiMs),
        tienDoLo: v.loai.startsWith('btvn') ? docTienDoLo(tieuDe) : undefined,
        biCong,
        moSauKhiXong: biCong ? tenTheoId.get(chanDauTien!.id) : undefined,
        trangThai: v.trangThai === 'dang_lam' ? 'dang_lam' : 'chua_lam',
        hanhDong: v.hanhDong || hanhDongMacDinh(v.loai),
      })
    }
    if (v.batBuoc && !xong && !chanDauTien) chanDauTien = v
  }

  const mucTieu = Math.max(0, Number(keHoach.nganSach?.mucTieuCau) || 0)
  const daLam = Math.max(0, Number(keHoach.soCauDaLam) || 0)
  const vanToc = keHoach.nganSach?.vanToc
  const soMau = keHoach.nganSach?.soMauTocDo
  const chuoi = Math.max(0, Number(keHoach.chuoiDat) || 0)
  return dongGoi('ke_hoach_ngay', viec, {
    tienDo: { daLam, mucTieu, phanTram: phanTram(daLam, mucTieu) },
    tocDo:
      typeof vanToc === 'number' && vanToc > 0
        ? { giayMoiCau: Math.round(vanToc), chu: `tốc độ ${Math.round(vanToc)} s/câu · đo 30 ngày` }
        : { chu: typeof soMau === 'number' ? `tốc độ: chưa đo (${soMau}/5 mẫu)` : 'tốc độ: chưa đo' },
    chuoiNgay: { soNgay: chuoi, chu: `${chuoi} ngày đạt liên tiếp` },
  })
}

/** Cửa vào duy nhất cho giao diện: có kế hoạch máy chủ thì dùng, không thì trợ lý. */
export function dungBangNhiemVu(input: {
  keHoachNgay?: KeHoachNgayMayChu | null
  keHoachTroLy: KeHoachNgayTroLy
  now: number
  /** Bài Mẹ giao thô — để nguồn trợ lý không làm rơi bài Mẹ giao khỏi trang chủ. */
  dsMomGiao?: any[]
}): DuLieuBangNhiemVu {
  if (input.keHoachNgay && Array.isArray(input.keHoachNgay.viec)) return tuKeHoachNgay(input.keHoachNgay, input.now)
  return tuKeHoachTroLy(input.keHoachTroLy, { dsMomGiao: input.dsMomGiao, now: input.now })
}
