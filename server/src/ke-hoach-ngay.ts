// BỘ ĐIỀU PHỐI NGÀY — GĐ 2 (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.3).
//
// `lapKeHoachNgay` là HÀM THUẦN: cùng đầu vào → cùng JSON, từng chữ. Không đọc đồng hồ (`now` truyền vào),
// không Math.random (mọi phá thế cân bằng dùng `hashSeed(sbd|ngày|phiên bản|qid)`).
//
// Không viết lại engine nào: ngân sách ngày vẫn là `tinhNganSachNgay` (test đang khoá 8–16), lịch lô vẫn là
// `tinhLichLoBtvn`/`loDangCho`. Bộ này chỉ đổi ĐẦU VÀO của chúng (tốc độ đo thật từ sổ, số câu sai còn chưa khắc
// phục, tải các bài khác tính theo câu/ngày) và xếp việc lên trên.
//
// XẾP VIỆC (tất định):
//   cung   = lô BTVN đang chờ (đúng 1 lô mỗi bài; xong sớm KHÔNG mở sớm) + Mom đã bắt đầu; sắp EDF
//            (hạn cứng tăng dần → hạn mềm → loại → id)
//   kiểm tra khả thi: ∀k  Σ_{i≤k} còn_lại_i ≤ B × ngày(now → hạn_k)  — điều kiện cần-và-đủ của EDF.
//            Không đạt → cảnh báo `khong_kip {canMoiNgay}` kèm đề xuất; KHÔNG cắt việc bắt buộc, KHÔNG giấu.
//   bù     = nếu tải cứng + số câu đã làm hôm nay < mức tối thiểu → lấy từ danh sách mềm cho đủ ("tự phân thêm khi thiếu")
//   tuỳ chọn = phần mềm còn lại nếu ngân sách còn dư
//   quá tải (tải cứng > B) → nhãn `qua_tai +X`, cắt hết việc mềm, giữ nguyên việc cứng.
//   cổng hiển thị: việc hiện khi mọi việc BẮT BUỘC đứng trước nó đã xong, hoặc nó mang nhãn `khan`.
import { hashSeed } from '../../src/lib/exam-shuffle'
import { loDangCho, tinhLichLoBtvn, tongCauDenLo, type LichLoBtvn } from '../../src/lib/lich-lo-btvn'
import { tinhNganSachNgay } from '../../src/lib/tro-ly-ca-nhan'
import {
  BOI_THAN_THU, BUOC_DIEU_CHINH, CAU_ON_THI, GIAY_MOT_CAU_TOI_DA, GIAY_MOT_CAU_TOI_THIEU, NGAN_SACH_SAN, NGAN_SACH_TRAN,
  NGAY_LIET_KE_QUA_HAN, NGAY_ON_THI, PHIEN_BAN_KE_HOACH, PHUT_NGAY_MAC_DINH, PHUT_NGAY_TOI_DA, PHUT_NGAY_TOI_THIEU,
  SO_MAU_GIAY_TOI_THIEU, SO_NGAY_KHONG_DAT_DE_GIAM, SO_NGAY_LICH_SU, TOI_THIEU_CAU_SAN, TOI_THIEU_CAU_TRAN,
  TRAN_THAN_THU_MOT_LUOT, TY_LE_ON_TOI_DA, VAN_TOC_MAC_DINH, VAN_TOC_NHANH_DE_TANG, VAN_TOC_SAN, VAN_TOC_TRAN,
} from './ho-so-cau-hinh'
import { dangYeu, type NamKtDang } from './ho-so-nam-kt'

const MOT_NGAY_MS = 86_400_000
const MOM_PHUT = 120

// --- Kiểu ------------------------------------------------------------------------

export interface BtvnDauVao {
  ma: string
  soCau: number
  giaoLuc: string
  hanNop: string
  loDaXong: number
  /** Em đã nộp — không còn việc. */
  daNop: boolean
}

export interface MomDauVao {
  id: string
  soCau: number
  taoLuc: string
  /** null = chưa bắt đầu. Hạn cứng chỉ có sau khi bắt đầu (120 phút). */
  batDauLuc: string | null
}

export interface CauToiHan {
  qid: string
  maDang: string | null
  mocOnKe: string
  lanSai: number
}

export interface CaSapToi {
  maCa: string
  tenCa: string
  batDau: string
}

export interface DauVaoKeHoach {
  sbd: string
  /** Giờ máy chủ (ms). */
  now: number
  /** Ngày VN của `now` (YYYY-MM-DD). */
  homNay: string
  /** null = chưa đặt → mặc định 20 phút. */
  phutNgay: number | null
  /** Các lần có đo giây trong 30 ngày (chưa lọc). */
  mauGiay: number[]
  btvn: BtvnDauVao[]
  mom: MomDauVao[]
  cauToiHan: CauToiHan[]
  /** Số câu `moi_sai`/`dang_on` còn chưa khắc phục (KHÔNG cộng bài chưa nộp). */
  soCauChuaKhacPhuc: number
  dang: NamKtDang[]
  /** Nhiệm vụ thần thú do phụ huynh nhắc (game_v2_task đang mở). */
  nhiemVuThanThu: { id: string; dang: string }[]
  caSapToi: CaSapToi[]
  /** Kết quả các ngày TRƯỚC hôm nay, mới nhất trước; null = ngày nghỉ/chưa chốt (bị bỏ qua). */
  lichSu: { ngay: string; ketQua: 'dat' | 'mot_phan' | 'khong' | null }[]
  daLamHomNay: { soCau: number; lenBac: number; tutBac: number }
  homNayLaNgayNghi: boolean
}

export type LoaiViec = 'btvn_lo' | 'btvn_nop' | 'mom' | 'on_lai' | 'than_thu' | 'on_thi'
export type NhanViec = 'khan_cap' | 'bu' | 'tuy_chon' | null

export interface Viec {
  id: string
  loai: LoaiViec
  thuTu: number
  soCau: number
  /** ISO — hạn KHÔNG thể lùi (hạn nộp chung / hết 120' của Mom). null với việc mềm. */
  hanCung: string | null
  /** ISO — mốc lô kế hoặc hạn chung; nhịp mà em nên bám. */
  hanMem: string | null
  batBuoc: boolean
  khan: boolean
  /** Việc đứng ngay trước; việc này hiện khi mọi việc bắt buộc trước nó đã xong (hoặc `khan`). */
  cong: string | null
  /** Có hiện lên bảng tin lúc lập kế hoạch không (đã áp cổng). */
  hien: boolean
  nguon: string
  nhan: NhanViec
  trangThai: 'cho'
  ghiChu: string
  chiTiet: Record<string, unknown>
}

export interface CanhBao {
  loai: 'khong_kip' | 'qua_tai' | 'thieu_nguon_bu' | 'chua_do_toc_do' | 'tang_tam_du'
  noiDung: string
  [k: string]: unknown
}

export interface NganSachNgay {
  mucTieuCau: number
  toiThieuCau: number
  phutNgay: number
  phutNgayLaMacDinh: boolean
  vanTocGiay: number
  vanTocNguon: 'do' | 'mac_dinh'
  ghiChuVanToc: string
  soMauGiay: number
  trangThaiTai: string
  dieuChinh: { lyDo: string; delta: number }[]
}

export interface KeHoachNgay {
  phienBan: number
  seed: number
  sbd: string
  ngay: string
  nganSach: NganSachNgay
  viec: Viec[]
  canhBao: CanhBao[]
  quaHan: { loai: 'btvn' | 'mom'; ma: string; hanNop: string; conLai: number }[]
  /** Lô/bài chưa tới nhịp — nói cho em biết bao giờ mở, KHÔNG hiện như việc hôm nay. */
  sapToi: { loai: 'btvn_lo'; ma: string; chiSo: number; moLuc: string }[]
  tai: { cung: number; bu: number; tuyChon: number; nganSach: number; vuot: number }
  tienBo: { daLamCau: number; lenBac: number; tutBac: number; dat: boolean; toiThieuCau: number; conThieu: number; soCauToiHan: number; treNhip: boolean }
  /** Cấp lịch sử ngày đạt liên tiếp (ngày nghỉ không đứt) — nơi gọi truyền vào `lichSu`. */
  chuoiDat: number
  lanNghi: boolean
}

// --- Tiện ích thuần ---------------------------------------------------------------------

const ms = (v: string | null | undefined): number | undefined => {
  if (!v) return undefined
  const n = Date.parse(v)
  return Number.isFinite(n) ? n : undefined
}
const kep = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** Trung vị, lọc [5, 1200] s. Thiếu mẫu thì dùng mặc định và NÓI RA số mẫu. */
export function tinhVanToc(mau: number[]): { giay: number; nguon: 'do' | 'mac_dinh'; soMau: number; ghiChu: string } {
  const h = mau.filter((g) => Number.isFinite(g) && g >= GIAY_MOT_CAU_TOI_THIEU && g <= GIAY_MOT_CAU_TOI_DA).sort((a, b) => a - b)
  if (h.length < SO_MAU_GIAY_TOI_THIEU) {
    return { giay: VAN_TOC_MAC_DINH, nguon: 'mac_dinh', soMau: h.length, ghiChu: `chưa đo được tốc độ (${h.length}/${SO_MAU_GIAY_TOI_THIEU} mẫu), tạm tính ${VAN_TOC_MAC_DINH} giây/câu` }
  }
  const giua = h.length % 2 ? h[(h.length - 1) / 2]! : (h[h.length / 2 - 1]! + h[h.length / 2]!) / 2
  return { giay: Math.round(kep(giua, VAN_TOC_SAN, VAN_TOC_TRAN)), nguon: 'do', soMau: h.length, ghiChu: '' }
}

const ngayConLai = (hanMs: number, now: number) => Math.max(1, Math.ceil((hanMs - now) / MOT_NGAY_MS))

interface BaiCung {
  loai: 'btvn' | 'mom'
  ma: string
  hanMs: number
  conLai: number
}

// --- Ngân sách ngày ------------------------------------------------------------------

export function tinhNganSach(d: DauVaoKeHoach, soBaiChuaNop: number): NganSachNgay {
  const vt = tinhVanToc(d.mauGiay)
  const phutLaMacDinh = d.phutNgay === null
  const phutNgay = kep(Math.round(d.phutNgay ?? PHUT_NGAY_MAC_DINH), PHUT_NGAY_TOI_THIEU, PHUT_NGAY_TOI_DA)
  // Hàm gốc giữ nguyên; đầu vào: số BÀI chưa nộp còn hạn, số câu sai CHƯA KHẮC PHỤC (giảm khi em chữa được).
  const goc = tinhNganSachNgay(soBaiChuaNop, d.soCauChuaKhacPhuc, vt.giay, d.daLamHomNay.soCau)
  const dieuChinh: { lyDo: string; delta: number }[] = []
  let b = goc.mucTieuCau

  const lichSu = d.lichSu.filter((x) => x.ketQua !== null).slice(0, SO_NGAY_LICH_SU)
  const khongDat = lichSu.filter((x) => x.ketQua === 'khong').length
  if (khongDat >= SO_NGAY_KHONG_DAT_DE_GIAM) {
    dieuChinh.push({ lyDo: `${khongDat}/${lichSu.length} ngày gần đây không đạt → giảm tải`, delta: -BUOC_DIEU_CHINH })
    b -= BUOC_DIEU_CHINH
  } else if (lichSu.length >= SO_NGAY_LICH_SU && lichSu.every((x) => x.ketQua === 'dat') && vt.nguon === 'do' && vt.giay < VAN_TOC_NHANH_DE_TANG) {
    dieuChinh.push({ lyDo: `${SO_NGAY_LICH_SU}/${SO_NGAY_LICH_SU} ngày đạt và tốc độ ${vt.giay} giây/câu → tăng nhẹ`, delta: BUOC_DIEU_CHINH })
    b += BUOC_DIEU_CHINH
  }

  // Phút học/ngày CHỈ ĐƯỢC HẠ mức mục tiêu, không bao giờ nâng.
  const theoPhut = Math.floor((phutNgay * 60) / vt.giay)
  if (theoPhut < b) {
    dieuChinh.push({ lyDo: `${phutNgay} phút/ngày${phutLaMacDinh ? ' (mặc định)' : ''} ở ${vt.giay} giây/câu chỉ đủ ${Math.max(NGAN_SACH_SAN, theoPhut)} câu`, delta: Math.max(NGAN_SACH_SAN, theoPhut) - b })
    b = theoPhut
  }
  const mucTieuCau = kep(b, NGAN_SACH_SAN, NGAN_SACH_TRAN)
  return {
    mucTieuCau,
    toiThieuCau: kep(Math.round(mucTieuCau / 2), TOI_THIEU_CAU_SAN, TOI_THIEU_CAU_TRAN),
    phutNgay,
    phutNgayLaMacDinh: phutLaMacDinh,
    vanTocGiay: vt.giay,
    vanTocNguon: vt.nguon,
    ghiChuVanToc: vt.ghiChu,
    soMauGiay: vt.soMau,
    trangThaiTai: goc.trangThaiTai,
    dieuChinh,
  }
}

// --- Hàm chính ------------------------------------------------------------------------

export function lapKeHoachNgay(d: DauVaoKeHoach): KeHoachNgay {
  const seed = hashSeed(`${d.sbd}|${d.homNay}|${PHIEN_BAN_KE_HOACH}`)

  // 1. Bài còn phải làm và bài quá hạn.
  const btvnCon = d.btvn.filter((b) => !b.daNop && (ms(b.hanNop) ?? Infinity) > d.now && b.soCau > 0)
  const quaHan: KeHoachNgay['quaHan'] = []
  for (const b of d.btvn) {
    const han = ms(b.hanNop)
    if (b.daNop || han === undefined || han > d.now || d.now - han > NGAY_LIET_KE_QUA_HAN * MOT_NGAY_MS) continue
    quaHan.push({ loai: 'btvn', ma: b.ma, hanNop: b.hanNop, conLai: b.soCau })
  }
  const momCung: (MomDauVao & { hanMs: number })[] = []
  for (const m of d.mom) {
    const bd = ms(m.batDauLuc)
    if (bd === undefined) continue // chưa bắt đầu: không hạn cứng, không tính vào tải cứng
    const han = bd + MOM_PHUT * 60_000
    if (han > d.now) momCung.push({ ...m, hanMs: han })
    else quaHan.push({ loai: 'mom', ma: m.id, hanNop: new Date(han).toISOString(), conLai: m.soCau })
  }
  quaHan.sort((a, b) => a.hanNop.localeCompare(b.hanNop) || a.ma.localeCompare(b.ma))

  const nganSach = tinhNganSach(d, btvnCon.length + momCung.length)
  const B = nganSach.mucTieuCau

  // 2. Còn lại của từng bài (hai lượt: lượt 1 chưa tính tải khác để biết còn lại; lượt 2 tính lịch lô đúng).
  const lich0 = new Map<string, LichLoBtvn>()
  const conLai = new Map<string, number>()
  for (const b of btvnCon) {
    const l = tinhLichLoBtvn({ soCau: b.soCau, giaoLuc: b.giaoLuc, hanNop: b.hanNop, nganSachNgay: B, taiKhac: 0 })
    lich0.set(b.ma, l)
    conLai.set(b.ma, Math.max(0, b.soCau - (b.loDaXong > 0 ? tongCauDenLo(l, b.loDaXong - 1) : 0)))
  }
  const baiCung: BaiCung[] = [
    ...btvnCon.map((b) => ({ loai: 'btvn' as const, ma: b.ma, hanMs: ms(b.hanNop)!, conLai: conLai.get(b.ma) ?? 0 })),
    ...momCung.map((m) => ({ loai: 'mom' as const, ma: m.id, hanMs: m.hanMs, conLai: m.soCau })),
  ].filter((x) => x.conLai > 0)
  const taiNgay = (x: BaiCung) => Math.ceil(x.conLai / ngayConLai(x.hanMs, d.now))

  // 3. Lô đang chờ của từng bài BTVN (tải khác = phần câu/ngày của CÁC bài kia).
  const cung: Viec[] = []
  const sapToi: KeHoachNgay['sapToi'] = []
  const chiTietBai: Record<string, { taiKhac: number; taiMoiNgay: number; conLai: number; soLo: number }> = {}
  for (const b of btvnCon) {
    const taiKhac = baiCung.filter((x) => !(x.loai === 'btvn' && x.ma === b.ma)).reduce((t, x) => t + taiNgay(x), 0)
    const lich = tinhLichLoBtvn({ soCau: b.soCau, giaoLuc: b.giaoLuc, hanNop: b.hanNop, nganSachNgay: B, taiKhac })
    const cl = Math.max(0, b.soCau - (b.loDaXong > 0 ? tongCauDenLo(lich, b.loDaXong - 1) : 0))
    const mine = baiCung.find((x) => x.loai === 'btvn' && x.ma === b.ma)
    chiTietBai[b.ma] = { taiKhac, taiMoiNgay: mine ? taiNgay({ ...mine, conLai: cl }) : 0, conLai: cl, soLo: lich.cacLo.length }
    const hanMs = ms(b.hanNop)!
    const lo = loDangCho(lich, b.loDaXong, d.now)
    if (!lo) {
      if (b.loDaXong >= lich.cacLo.length && lich.cacLo.length > 0) {
        cung.push(viecCung({ id: `btvn_nop:${b.ma}`, loai: 'btvn_nop', soCau: 0, hanMs, hanMemMs: hanMs, khan: hanMs - d.now <= MOT_NGAY_MS, nguon: b.ma, ghiChu: 'Đã xong mọi lô — bấm nộp bài trước hạn.', chiTiet: { ma: b.ma, ...chiTietBai[b.ma] } }))
      }
      continue
    }
    if (!lo.daToiMoc) {
      sapToi.push({ loai: 'btvn_lo', ma: b.ma, chiSo: lo.chiSo, moLuc: lo.moDuKienLuc })
      continue
    }
    const loSau = lich.cacLo[lo.chiSo + 1]
    cung.push(viecCung({
      id: `btvn_lo:${b.ma}:${lo.chiSo}`,
      loai: 'btvn_lo', soCau: lo.soCau, hanMs, hanMemMs: loSau ? ms(loSau.moDuKienLuc) ?? hanMs : hanMs,
      khan: lo.treNhip || hanMs - d.now <= MOT_NGAY_MS, nguon: b.ma,
      ghiChu: lo.treNhip ? `Lô ${lo.chiSo + 1}/${lich.cacLo.length} đã trễ nhịp — làm trước.` : `Lô ${lo.chiSo + 1}/${lich.cacLo.length}`,
      chiTiet: { ma: b.ma, chiSo: lo.chiSo, tongLo: lich.cacLo.length, treNhip: lo.treNhip, ...chiTietBai[b.ma] },
    }))
  }
  for (const m of momCung) {
    cung.push(viecCung({
      id: `mom:${m.id}`, loai: 'mom', soCau: m.soCau, hanMs: m.hanMs, hanMemMs: m.hanMs, khan: true, nguon: m.id,
      ghiChu: 'Bài Mom đã bắt đầu — hết giờ sau 120 phút.', chiTiet: { id: m.id },
    }))
  }
  cung.sort((a, b) => (ms(a.hanCung) ?? Infinity) - (ms(b.hanCung) ?? Infinity) || (ms(a.hanMem) ?? Infinity) - (ms(b.hanMem) ?? Infinity) || a.loai.localeCompare(b.loai) || a.id.localeCompare(b.id))

  // 4. Kiểm khả thi EDF trên TOÀN BỘ bài còn nợ (không chỉ lô hôm nay).
  const canhBao: CanhBao[] = []
  const theoHan = [...baiCung].sort((a, b) => a.hanMs - b.hanMs || a.ma.localeCompare(b.ma))
  let cong = 0
  for (const x of theoHan) {
    cong += x.conLai
    const ngay = Math.max(1, (x.hanMs - d.now) / MOT_NGAY_MS)
    if (cong > B * ngay + 1e-9) {
      const can = Math.ceil(cong / ngay)
      canhBao.push({
        loai: 'khong_kip', ma: x.ma, hanNop: new Date(x.hanMs).toISOString(), conLai: cong, ngayConLai: Math.round(ngay * 10) / 10, canMoiNgay: can,
        deXuat: can <= NGAN_SACH_TRAN ? 'tang_tam' : 'can_thay_gia_han',
        noiDung: can <= NGAN_SACH_TRAN
          ? `Để kịp hạn cần ${can} câu/ngày (mục tiêu hôm nay ${B}) — em tăng tạm lên ${can} câu, hoặc báo Thầy.`
          : `Để kịp hạn cần ${can} câu/ngày, vượt trần ${NGAN_SACH_TRAN} — cần Thầy gia hạn hoặc bớt bài.`,
      })
    }
  }
  if (nganSach.vanTocNguon === 'mac_dinh') {
    canhBao.push({ loai: 'chua_do_toc_do', noiDung: nganSach.ghiChuVanToc, soMau: nganSach.soMauGiay, can: SO_MAU_GIAY_TOI_THIEU })
  }

  // 5. Tải cứng, bù, tuỳ chọn.
  const taiCung = cung.reduce((t, v) => t + v.soCau, 0)
  const vuot = Math.max(0, taiCung - B)
  const mem: Viec[] = []
  const conCan = Math.max(0, nganSach.toiThieuCau - taiCung - d.daLamHomNay.soCau)
  if (vuot > 0) {
    canhBao.push({ loai: 'qua_tai', vuot, noiDung: `Việc bắt buộc hôm nay ${taiCung} câu, vượt mục tiêu ${B} câu (+${vuot}). Việc bắt buộc giữ nguyên, việc tự chọn tạm ẩn.` })
  } else {
    mem.push(...dungViecMem(d, B, taiCung, seed, conCan))
  }
  const bu: Viec[] = []
  const tuyChon: Viec[] = []
  let can = conCan
  for (const v of mem) {
    const conCho = B - taiCung - bu.reduce((t, x) => t + x.soCau, 0)
    if (can > 0) {
      // Thần thú giao theo bội 6 (một lượt game) nên có thể vượt nhẹ mức thiếu, NHƯNG không được đẩy tổng quá mục tiêu ngày:
      // không vừa thì bỏ qua (thử việc kế tiếp). Việc khác lấy đúng phần thiếu.
      if (v.loai === 'than_thu' && v.soCau > conCho) continue
      const soCau = v.loai === 'than_thu' ? v.soCau : Math.min(v.soCau, can, Math.max(0, conCho))
      if (soCau <= 0) continue
      bu.push({ ...v, soCau, nhan: 'bu' })
      can = Math.max(0, can - soCau)
    } else {
      tuyChon.push({ ...v, nhan: 'tuy_chon' })
    }
  }
  const conDu = Math.max(0, B - taiCung - bu.reduce((t, v) => t + v.soCau, 0))
  let dungDu = conDu
  const tuyChonCat = tuyChon.filter((v) => {
    if (dungDu <= 0) return false
    dungDu -= v.soCau
    return true
  })
  if (can > 0 && vuot === 0) {
    canhBao.push({ loai: 'thieu_nguon_bu', can, noiDung: `Còn thiếu ${can} câu cho đủ mức tối thiểu ${nganSach.toiThieuCau} câu nhưng chưa có câu ôn hay dạng yếu nào để tự phân (hồ sơ còn mỏng).` })
  }

  // 6. Ghép, đánh số, cổng.
  const viec: Viec[] = [...cung, ...bu, ...tuyChonCat].map((v, i, all) => {
    const truoc = all.slice(0, i)
    return {
      ...v,
      thuTu: i + 1,
      cong: i === 0 ? null : all[i - 1]!.id,
      nhan: v.khan && v.batBuoc ? ('khan_cap' as const) : v.nhan,
      hien: v.khan || !truoc.some((t) => t.batBuoc),
    }
  })

  const daLam = d.daLamHomNay.soCau
  const tienBo = {
    daLamCau: daLam, lenBac: d.daLamHomNay.lenBac, tutBac: d.daLamHomNay.tutBac,
    dat: daLam >= nganSach.toiThieuCau, toiThieuCau: nganSach.toiThieuCau, conThieu: Math.max(0, nganSach.toiThieuCau - daLam),
    soCauToiHan: d.cauToiHan.filter((c) => c.mocOnKe <= d.homNay).length,
    treNhip: viec.some((v) => v.batBuoc && v.chiTiet.treNhip === true),
  }
  return {
    phienBan: PHIEN_BAN_KE_HOACH, seed, sbd: d.sbd, ngay: d.homNay, nganSach, viec, canhBao, quaHan, sapToi,
    tai: { cung: taiCung, bu: bu.reduce((t, v) => t + v.soCau, 0), tuyChon: tuyChonCat.reduce((t, v) => t + v.soCau, 0), nganSach: B, vuot },
    tienBo, chuoiDat: demChuoiDat(d.lichSu), lanNghi: d.homNayLaNgayNghi,
  }
}

/** Ngày `dat` liên tiếp, mới nhất trước. Ngày nghỉ (`null`) bị BỎ QUA, không đứt chuỗi; `mot_phan`/`khong` đứt. */
export function demChuoiDat(lichSu: DauVaoKeHoach['lichSu']): number {
  let n = 0
  for (const x of lichSu) {
    if (x.ketQua === null) continue
    if (x.ketQua !== 'dat') break
    n++
  }
  return n
}

function viecCung(o: {
  id: string; loai: LoaiViec; soCau: number; hanMs: number; hanMemMs: number; khan: boolean; nguon: string; ghiChu: string; chiTiet: Record<string, unknown>
}): Viec {
  return {
    id: o.id, loai: o.loai, thuTu: 0, soCau: o.soCau, hanCung: new Date(o.hanMs).toISOString(), hanMem: new Date(o.hanMemMs).toISOString(),
    batBuoc: true, khan: o.khan, cong: null, hien: true, nguon: o.nguon, nhan: o.khan ? 'khan_cap' : null, trangThai: 'cho', ghiChu: o.ghiChu, chiTiet: o.chiTiet,
  }
}

/** Danh sách việc MỀM theo thứ tự ưu tiên: ôn tới hạn → thần thú → ôn thi. */
function dungViecMem(d: DauVaoKeHoach, B: number, taiCung: number, seed: number, conCan: number): Viec[] {
  const ra: Viec[] = []
  const mem = (o: Pick<Viec, 'id' | 'loai' | 'soCau' | 'nguon' | 'ghiChu' | 'chiTiet'>): Viec => ({
    ...o, thuTu: 0, hanCung: null, hanMem: null, batBuoc: false, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho',
  })

  // Thần thú: nhiệm vụ phụ huynh nhắc trước, rồi dạng yếu nhất (mã dạng thật, không phải 'CD:').
  const yeu = d.dang
    .filter((x) => !x.maDang.startsWith('CD:') && dangYeu(x, d.homNay))
    .sort((a, b) => (a.soDaKhacPhuc + a.soChuaThaySai) / a.soGap - (b.soDaKhacPhuc + b.soChuaThaySai) / b.soGap || b.soMoiSai - a.soMoiSai || a.maDang.localeCompare(b.maDang))
  const dangThan = [...d.nhiemVuThanThu].sort((a, b) => a.id.localeCompare(b.id))[0]?.dang ?? yeu[0]?.maDang

  // Ôn tới hạn: mốc sớm nhất trước, sai nhiều trước, phá thế cân bằng bằng seed. Trần 40% mục tiêu. CHỈ nới trần (đúng phần
  // còn thiếu, không quá ngân sách còn lại) khi thần thú không lo nổi phần thiếu: không có nguồn thần thú, hoặc một lượt
  // 6 câu không vừa phần ngân sách sau khi ôn.
  const tran40 = Math.floor(TY_LE_ON_TOI_DA * B)
  const thanThuKhongVua = !dangThan || B - taiCung - tran40 < BOI_THAN_THU
  const gioiHan = Math.max(0, Math.min(thanThuKhongVua ? Math.max(tran40, conCan) : tran40, B - taiCung))
  const toiHan = d.cauToiHan
    .filter((c) => c.mocOnKe <= d.homNay)
    .map((c) => ({ c, h: hashSeed(`${seed}|${c.qid}`) }))
    .sort((a, b) => a.c.mocOnKe.localeCompare(b.c.mocOnKe) || b.c.lanSai - a.c.lanSai || a.h - b.h || a.c.qid.localeCompare(b.c.qid))
    .slice(0, gioiHan)
    .map((x) => x.c)
  if (toiHan.length > 0) {
    ra.push(mem({ id: `on_lai:${d.homNay}`, loai: 'on_lai', soCau: toiHan.length, nguon: 'ho_so', ghiChu: `Ôn ${toiHan.length} câu đã tới hạn nhắc lại`, chiTiet: { qid: toiHan.map((c) => c.qid) } }))
  }

  if (dangThan) {
    // Cỡ lượt theo phần ngân sách CÒN LẠI sau khi ôn, bội 6, tối đa 12 (một lượt luôn ≥ 6).
    const cho = Math.max(BOI_THAN_THU, Math.min(TRAN_THAN_THU_MOT_LUOT, Math.floor(Math.max(0, B - taiCung - toiHan.length) / BOI_THAN_THU) * BOI_THAN_THU))
    ra.push(mem({ id: `than_thu:${dangThan}`, loai: 'than_thu', soCau: cho, nguon: 'ho_so', ghiChu: 'Luyện dạng còn yếu với thần thú', chiTiet: { dang: dangThan } }))
  }

  // Ôn thi: ca của lớp bắt đầu trong NGAY_ON_THI ngày tới — việc mềm (chỉ khi còn ngân sách).
  const ca = [...d.caSapToi]
    .filter((c) => { const t = ms(c.batDau); return t !== undefined && t > d.now && t - d.now <= NGAY_ON_THI * MOT_NGAY_MS })
    .sort((a, b) => a.batDau.localeCompare(b.batDau) || a.maCa.localeCompare(b.maCa))[0]
  if (ca) {
    ra.push(mem({ id: `on_thi:${ca.maCa}`, loai: 'on_thi', soCau: CAU_ON_THI, nguon: ca.maCa, ghiChu: `Ôn cho ca "${ca.tenCa}"`, chiTiet: { maCa: ca.maCa, tenCa: ca.tenCa, batDau: ca.batDau } }))
  }
  return ra
}
