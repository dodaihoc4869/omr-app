import {HAP_THU_DAT} from '../../../lib/hap-thu-ngay'
// CỬA HÀNG PHỤ KIỆN — hàm THUẦN của lớp màn (không React, không mạng). Mọi số ở đây là số MÁY CHỦ đã trả đưa vào;
// hàm chỉ chọn trạng thái / viết lời chỉ đường / ghép danh mục / dựng "đang mặc + đang thử". KHÔNG có hàm nào cộng trừ SỐ DƯ vàng.
import { DANH_MUC_PHU_KIEN, DOT_MO_BAN } from '../../../lib/phu-kien-danh-muc'
import type { MonPhuKien } from '../../../lib/phu-kien-danh-muc'
import { CAC_O, MA_MAT_MANG } from './kieu'
import type { DangMac, EmCo, MonMayChu, MonShop, OGan } from './kieu'
import {
  chuCanChuoiNgan,
  chuCanDai,
  chuChiDuongAn,
  chuChiDuongChuoi,
  chuChiDuongDuExp,
  chuChiDuongNgay,
  chuChiCon,
  chuChuaMuaDuoc,
  chuKhoaAnDai,
  chuLoiKhongRo,
  chuLoiTheoMa,
  chuMatMang,
  chuKhoaChuoiDai,
  chuMonKe,
  chuMonKeChuaDu,
  chuMuaChiCo,
  chuSoLuongDai,
  chuThieuVang,
  chuTrangThai,
} from './chu-shop'

/** Mức EXP dư mỗi ngày của em học đủ (đề xuất mục 2). CHỈ dùng để ước lượng lời "khoảng N ngày nữa là đủ vàng"; Boss đổi sau khi đo. */
export const DU_MOI_NGAY = 80

/**
 * [D2] số ngày ước lượng = làm tròn lên của (vàng còn thiếu − EXP thừa đang đổi được) ÷ 80.
 * Trả 0 khi EXP thừa hiện có ĐÃ đủ (⇒ nói [D1]). Tính từ số máy chủ đã trả (`vang`, `doiToiDa`, `gia`), không phải số dư tự tính.
 */
export function ngayConThieuVang(thieuVang: number, doiToiDa: number, duMoiNgay: number = DU_MOI_NGAY): number {
  const con = thieuVang - Math.max(0, doiToiDa)
  if (!(con > 0) || !(duMoiNgay > 0)) return 0
  return Math.ceil(con / duMoiNgay)
}

/** Lời chỉ đường khi thiếu vàng: [D1] nếu EXP thừa đủ, không thì [D2] "khoảng N ngày". */
export function chiDuongThieuVang(thieuVang: number, doiToiDa: number): string {
  const ngay = ngayConThieuVang(thieuVang, doiToiDa)
  return ngay === 0 ? chuChiDuongDuExp : chuChiDuongNgay(ngay)
}

/** Số ngày ăn ứng với `exp` dự trữ (1 ngày ăn = HAP_THU_DAT, độc lập mức dự trữ để mua đồ). Chỉ để nói "Sau khi đổi"; số thật do máy chủ trả. */
export function ngayAnCua(exp: number, giuLai: number): number {
  return giuLai > 0 ? Math.max(0, Math.floor(exp / HAP_THU_DAT)) : 0
}

/** Số EXP hợp lệ để gửi `vang-doi`: nguyên, 1..doiToiDa (máy chủ tính `doiToiDa`). Ngoài khoảng ⇒ kẹp; không phải số ⇒ 0. */
export function kepSoExp(giaTri: number, doiToiDa: number): number {
  if (!Number.isFinite(giaTri)) return 0
  return Math.min(Math.max(0, Math.trunc(giaTri)), Math.max(0, Math.trunc(doiToiDa)))
}

// ── ghép danh mục ──
/** Ghép món máy chủ trả với tên/bậc/Bật mí/điều kiện của danh mục. Mã không có trong danh mục ⇒ bỏ (không có gì để vẽ). */
export function ghepDanhMuc(mon: readonly MonMayChu[], danhMuc: readonly MonPhuKien[] = DANH_MUC_PHU_KIEN): MonShop[] {
  const theoMa = new Map(danhMuc.map((x) => [x.ma, x] as const))
  const r: MonShop[] = []
  for (const m of mon) {
    const d = theoMa.get(m.ma)
    if (!d) continue
    r.push({ ...m, ten: d.ten, bac: d.bac, oGan: d.o, batMi: d.batMi, canChuoi: d.canChuoiNgay, canAnThach: d.canAnThach })
  }
  return r
}

/** Chỗ đeo còn "Sắp mở": máy chủ không trả món nào ở chỗ ấy VÀ danh mục nói mọi món của nó mở ở đợt sau. */
export function oSapMo(o: OGan, mon: readonly MonShop[], danhMuc: readonly MonPhuKien[] = DANH_MUC_PHU_KIEN, dotMoBan: number = DOT_MO_BAN): boolean {
  if (mon.some((m) => m.oGan === o)) return false
  const cua = danhMuc.filter((x) => x.o === o)
  return cua.length > 0 && cua.every((x) => x.moBan > dotMoBan)
}

// ── trạng thái một món ──
export type TrangThaiMon =
  | { loai: 'dang-mac' }
  | { loai: 'da-co' }
  | { loai: 'het' }
  | { loai: 'khoa' }
  | { loai: 'thieu-vang'; thieu: number }
  | { loai: 'du-vang' }

export const conGioiHan = (m: MonMayChu): boolean => typeof m.suatTong === 'number' && m.suatTong > 0
export const daHetSuat = (m: MonMayChu): boolean => conGioiHan(m) && (m.suatCon ?? 0) <= 0

/** Thứ tự: đang mặc → đã có → đã hết → còn khoá → thiếu vàng → đủ vàng. `vang` là số máy chủ trả. */
export function trangThaiMon(m: MonMayChu, vang: number): TrangThaiMon {
  if (m.dangMac) return { loai: 'dang-mac' }
  if (m.daCo) return { loai: 'da-co' }
  if (daHetSuat(m)) return { loai: 'het' }
  if (!m.moKhoa) return { loai: 'khoa' }
  if (vang < m.gia) return { loai: 'thieu-vang', thieu: m.gia - vang }
  return { loai: 'du-vang' }
}

/** Phần điều kiện học em CHƯA đạt (số, kèm số em đang có). */
function conThieu(m: MonShop, em: EmCo | null): { chuoi: number | null; an: number | null } {
  return {
    chuoi: em && m.canChuoi && em.chuoiNgay < m.canChuoi ? m.canChuoi : null,
    an: em && m.canAnThach && em.anThachSang < m.canAnThach ? m.canAnThach : null,
  }
}

/** Dạng ngắn của khoá: "Cần chuỗi 14 ngày + 5 ấn thạch sáng". Thiếu số điều kiện ⇒ dùng nguyên lời máy chủ. */
export function chuKhoaNgan(m: MonShop, em: EmCo | null): string {
  const { chuoi, an } = conThieu(m, em)
  if (chuoi || an) return chuCanChuoiNgan(chuoi, an)
  return m.thieu ?? ''
}

/** Dạng dài [S1]+[S2] nói em đang ở đâu: "Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)". Thiếu số ⇒ lời máy chủ. */
export function chuKhoaCanDai(m: MonShop, em: EmCo | null): string {
  const { chuoi, an } = conThieu(m, em)
  const phan: string[] = []
  if (chuoi && em) phan.push(chuKhoaChuoiDai(chuoi, em.chuoiNgay))
  if (an && em) phan.push(chuKhoaAnDai(an, em.anThachSang))
  return phan.length ? chuCanDai(phan) : (m.thieu ?? '')
}

/** [S4] "Chưa mua được — cần chuỗi 14 ngày (em đang chuỗi 9 ngày)". */
export function chuKhoaChuaMua(m: MonShop, em: EmCo | null): string {
  const goc = chuKhoaCanDai(m, em)
  return goc ? chuChuaMuaDuoc(goc) : ''
}

/** [D3]/[D4] — nói đúng số còn thiếu; hai điều kiện thì hai câu. */
export function chiDuongKhoa(m: MonShop, em: EmCo | null): string {
  const { chuoi, an } = conThieu(m, em)
  const ds: string[] = []
  if (chuoi && em) ds.push(chuChiDuongChuoi(chuoi - em.chuoiNgay))
  if (an && em) ds.push(chuChiDuongAn(an - em.anThachSang))
  return ds.join(' ')
}

/** Chữ ngắn của trạng thái (bảy trạng thái chuẩn). */
export function chuTrangThaiMon(t: TrangThaiMon, m: MonShop, em: EmCo | null): string {
  switch (t.loai) {
    case 'dang-mac':
      return chuTrangThai.dangMac
    case 'da-co':
      return chuTrangThai.daCo
    case 'het':
      return chuTrangThai.daHet
    case 'khoa':
      return chuKhoaNgan(m, em)
    case 'thieu-vang':
      return chuThieuVang(t.thieu)
    default:
      return chuTrangThai.duVang
  }
}

/** Dòng số lượng trên thẻ: chưa ai mua ⇒ "Mùa 1 chỉ có N cái"; còn ít ⇒ "Chỉ còn N cái"; hết ⇒ "Đã hết". Không giới hạn ⇒ rỗng. */
export function chuSoLuongThe(m: MonMayChu): string {
  if (!conGioiHan(m)) return ''
  const con = m.suatCon ?? 0
  const tong = m.suatTong ?? 0
  if (con <= 0) return chuTrangThai.daHet
  if (con >= tong) return chuMuaChiCo(tong)
  return chuChiCon(con)
}

/** Dòng "Số lượng" trong khung chi tiết (dạng dài [S3]). */
export function chuSoLuongChiTiet(m: MonMayChu): string {
  if (!conGioiHan(m)) return ''
  const con = m.suatCon ?? 0
  const tong = m.suatTong ?? 0
  if (con <= 0) return chuTrangThai.daHet
  if (con >= tong) return chuMuaChiCo(tong)
  return chuSoLuongDai(con, tong)
}

/**
 * Câu chỉ món kế sau khi mua [M2]: món chưa có, đã mở khoá, còn suất, ĐẮT NHẤT mà số vàng máy chủ trả còn đủ;
 * không món nào vừa ⇒ món RẺ NHẤT chưa có kèm [D1]/[D2]. Không còn món nào ⇒ rỗng.
 */
export function cauMonKe(mon: readonly MonShop[], vang: number, doiToiDa: number): string {
  const ung = mon.filter((m) => !m.daCo && m.moKhoa && !daHetSuat(m)).sort((a, b) => a.gia - b.gia || a.ma.localeCompare(b.ma))
  if (!ung.length) return ''
  const vua = ung.filter((m) => m.gia <= vang)
  if (vua.length) {
    const t = vua[vua.length - 1]!
    return chuMonKe(t.ten, t.gia)
  }
  const re = ung[0]!
  return chuMonKeChuaDu(re.ten, chiDuongThieuVang(re.gia - vang, doiToiDa))
}

// ── đang mặc + đang thử ──
const trong = (): DangMac => Object.fromEntries(CAC_O.map((o) => [o, null])) as DangMac

/** Chuẩn hoá `dangMac` máy chủ trả: đủ năm khoá, thiếu ⇒ null. */
export function chuanDangMac(d: DangMac | null | undefined): DangMac {
  const r = trong()
  for (const o of CAC_O) r[o] = d?.[o] ?? null
  return r
}

/** Thần thú hiện trên sân khấu: món đang THỬ đè lên món đang MẶC ở cùng chỗ đeo. */
export function hienThiTrenThu(dangMac: DangMac, dangThu: DangMac): DangMac {
  const r = trong()
  for (const o of CAC_O) r[o] = dangThu[o] ?? dangMac[o] ?? null
  return r
}

export function demDangThu(dangThu: DangMac): number {
  return CAC_O.filter((o) => !!dangThu[o]).length
}

/** Món đang thử theo thứ tự chỗ đeo cố định. */
export function monDangThu(mon: readonly MonShop[], dangThu: DangMac): MonShop[] {
  const r: MonShop[] = []
  for (const o of CAC_O) {
    const ma = dangThu[o]
    const m = ma ? mon.find((x) => x.ma === ma) : undefined
    if (m) r.push(m)
  }
  return r
}

/** Lưới thẻ xếp theo giá tăng dần (đúng chú giải "Đắt dần"), cùng giá theo mã. */
export function xepTheoGia(mon: readonly MonShop[], loc: OGan | 'tat-ca'): MonShop[] {
  return mon.filter((m) => loc === 'tat-ca' || m.oGan === loc).sort((a, b) => a.gia - b.gia || a.ma.localeCompare(b.ma))
}

/** `khoaYeuCau` (8–64 ký tự [A-Za-z0-9_-]): sinh MỘT lần cho mỗi lần bấm. Chỉ để chống ghi hai lần; không dùng để chia thưởng. */
export function sinhKhoa(tienTo: 'mua' | 'doi'): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  const r = c?.randomUUID ? c.randomUUID().replace(/-/g, '').slice(0, 10) : Math.random().toString(36).slice(2, 12).padEnd(10, '0')
  return `${tienTo}-${r}`
}

/** Đọc một lỗi ném từ `ShopApi`: mã hợp đồng + lời hiện lên màn (lời máy chủ trước, không có thì lời chung theo mã, cuối cùng là lỗi không rõ). */
export function docLoi(e: unknown): { ma: string; loi: string } {
  const o = e && typeof e === 'object' ? (e as { ma?: unknown; message?: unknown; loi?: unknown }) : {}
  const ma = typeof o.ma === 'string' ? o.ma : ''
  const loi = typeof o.message === 'string' && o.message ? o.message : typeof o.loi === 'string' ? o.loi : ''
  if (loi) return { ma, loi }
  return { ma, loi: ma === MA_MAT_MANG ? chuMatMang : (chuLoiTheoMa[ma] ?? chuLoiKhongRo) }
}
