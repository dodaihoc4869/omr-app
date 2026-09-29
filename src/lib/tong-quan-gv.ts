// PHÉP TÍNH THUẦN CỦA MÀN TỔNG QUAN + BẢNG CA KIỂM TRA (Game Hóa 2.0 · docs/ban-ve-gv-2809/GV-TongQuan, GV-CaKiemTra).
// Chỉ dùng dữ liệu máy chủ ĐÃ CÓ (danh sách ca `danhSachCa`, `/gv/chien-dich` danh-sach + bang) — không bịa số so sánh
// không có nguồn (máy chủ chưa lưu lịch sử theo ngày của chiến dịch ⇒ dòng so sánh dùng "mức cần hôm nay", không "so với hôm qua").
import type { CaTomTat } from './exam-api'
import type { BangChienDich, ChienDichTom } from '../components/chien-dich/api'
import { mocHetHan, ngayVn } from '../components/chien-dich/ngay'

const NGAY_MS = 86_400_000

/** "4.812" — số nguyên kiểu Việt (dấu chấm hàng nghìn). */
export const soVi = (n: number): string => Math.round(n).toLocaleString('vi-VN')
/** "6,8" — một chữ số thập phân, dấu phẩy. */
export const thapPhanVi = (n: number): string => n.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
/** 0,457 ⇒ 46 (phần trăm làm tròn). */
export const phanTramSo = (tiLe: number): number => Math.round(Math.max(0, tiLe) * 100)

/** Số em trong danh sách lớp theo tên lớp (để làm MẪU SỐ "đã vào / mời"). */
export function demEmTheoLop(ds: readonly { lop?: string }[] | undefined): Map<string, number> {
  const m = new Map<string, number>()
  for (const e of ds ?? []) {
    const l = String(e.lop ?? '').trim()
    if (l) m.set(l, (m.get(l) ?? 0) + 1)
  }
  return m
}

/** MỨC LỚP CẦN ĐẠT HÔM NAY (vạch đen trên thanh): phần thời gian đã trôi từ lúc giao tới hạn nộp (0–1). */
export function mucCanHomNay(taoLuc: string, hanNop: string, nowMs: number): number {
  const tao = new Date(taoLuc).getTime()
  const het = mocHetHan(hanNop)
  if (!Number.isFinite(tao) || !Number.isFinite(het) || het <= tao) return Number.isFinite(het) && nowMs > het ? 1 : 0
  return Math.min(1, Math.max(0, (nowMs - tao) / (het - tao)))
}

/** Số ngày còn tới hạn (làm tròn lên); đã qua ⇒ 0. */
export function soNgayCon(hanNop: string, nowMs: number): number {
  const het = mocHetHan(hanNop)
  if (!Number.isFinite(het) || het <= nowMs) return 0
  return Math.ceil((het - nowMs) / NGAY_MS)
}

/** Khoảng hụt so với mức cần hôm nay mới tính là Chậm nhịp (10 điểm %). */
export const NGUONG_CHAM_NHIP = 0.1

export type NhipChienDich = 'dung' | 'cham' | 'cho_chua'
export const CHU_NHIP: Record<NhipChienDich, string> = { dung: 'Đúng nhịp', cham: 'Chậm nhịp', cho_chua: 'Chờ buổi chữa' }

export interface DongChienDich {
  cd: ChienDichTom
  /** Tỉ lệ câu thành thạo của lớp (0–1); `null` = chưa đọc được bảng. */
  thanhThao: number | null
  mucCan: number
  /** Em có `treNhip` ≥ 2 ngày. */
  treNhip: number
  soEm: number
  dangYeu: { ten: string; tiLe: number } | null
  canDayLaiCau: number
  canDayLaiLuot: number
  nhip: NhipChienDich
  conNgay: number
}

/** Một dòng "Chiến dịch luyện đang chạy" từ danh sách + bảng chiến dịch. */
export function dongChienDich(cd: ChienDichTom, bang: BangChienDich | null, nowMs: number): DongChienDich {
  const mucCan = mucCanHomNay(cd.taoLuc, cd.hanNop, nowMs)
  const thanhThao = bang ? bang.lop.thanhThao : null
  const em = bang?.em ?? []
  const treNhip = em.filter((e) => e.treNhip !== null && e.treNhip >= 2).length
  let dangYeu: DongChienDich['dangYeu'] = null
  for (const d of bang?.dang ?? []) {
    const ds = em.map((e) => e.theoDang[d]).filter((x): x is number => typeof x === 'number')
    if (!ds.length) continue
    const tb = ds.reduce((a, b) => a + b, 0) / ds.length
    if (!dangYeu || tb < dangYeu.tiLe) dangYeu = { ten: d, tiLe: tb }
  }
  // CHẬM NHỊP = thấp hơn mức cần hôm nay TỪ 10 điểm % — CÙNG luật trang Chiến dịch (`trangThaiHien`, DsChienDichDaGiao.tsx).
  // Trước 29/09 so sát nút ⇒ chiến dịch vừa giao (0% thành thạo, mức cần 0,3% hiện "cần 0%") đã bị báo Chậm nhịp.
  const nhip: NhipChienDich = cd.hetHan ? 'cho_chua' : thanhThao !== null && thanhThao < mucCan - NGUONG_CHAM_NHIP ? 'cham' : 'dung'
  return {
    cd,
    thanhThao,
    mucCan,
    treNhip,
    soEm: bang ? em.length || cd.soEm : cd.soEm,
    dangYeu,
    canDayLaiCau: bang?.lop.canDayLaiCau ?? 0,
    canDayLaiLuot: bang?.lop.canDayLaiLuot ?? 0,
    nhip,
    conNgay: soNgayCon(cd.hanNop, nowMs),
  }
}

/** Chiến dịch hiện ở Tổng quan: còn chạy (kể cả đã hết hạn nhưng chưa kết thúc = chờ buổi chữa). Hạn gần nhất lên trước. */
export function chienDichHienTongQuan(ds: readonly ChienDichTom[]): ChienDichTom[] {
  return ds.filter((c) => c.trangThai === 'dang_chay').sort((a, b) => Number(a.hetHan) - Number(b.hetHan) || a.hanNop.localeCompare(b.hanNop))
}

export interface KpiTongQuan {
  emDuocGiao: number
  thanhThaoTb: number | null
  mucCanTb: number | null
  treNhip: number
  canDayLaiCau: number
  canDayLaiLuot: number
  soChay: number
}

/** Hàng thẻ số của Tổng quan — chỉ tính trên chiến dịch còn trong hạn (chưa tới buổi chữa). */
export function kpiTongQuan(dong: readonly DongChienDich[], bang: readonly (BangChienDich | null)[]): KpiTongQuan {
  const chay = dong.filter((d) => d.nhip !== 'cho_chua')
  const sbd = new Set<string>()
  for (const b of bang) if (b && !b.hetHan) for (const e of b.em) sbd.add(e.sbd)
  const coSo = chay.filter((d) => d.thanhThao !== null)
  const tb = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
  return {
    emDuocGiao: sbd.size || chay.reduce((s, d) => s + d.soEm, 0),
    thanhThaoTb: tb(coSo.map((d) => d.thanhThao as number)),
    mucCanTb: tb(coSo.map((d) => d.mucCan)),
    treNhip: chay.reduce((s, d) => s + d.treNhip, 0),
    canDayLaiCau: dong.reduce((s, d) => s + d.canDayLaiCau, 0),
    canDayLaiLuot: dong.reduce((s, d) => s + d.canDayLaiLuot, 0),
    soChay: chay.length,
  }
}

/** Bài nộp ca kiểm tra theo ngày (giờ VN) trong `soNgay` ngày gần nhất, cũ → mới. Ca bài tập về nhà (cũ) không tính. */
export function baiNopTheoNgay(ds: readonly CaTomTat[], nowMs: number, soNgay = 14): { ngay: string; so: number }[] {
  const out: { ngay: string; so: number }[] = []
  for (let i = soNgay - 1; i >= 0; i--) out.push({ ngay: ngayVn(nowMs - i * NGAY_MS), so: 0 })
  const chiSo = new Map(out.map((d, i) => [d.ngay, i]))
  for (const c of ds) {
    if (c.loai === 'baitap' || c.trangThai === 'da_xoa') continue
    const t = new Date(c.batDau || c.moLuc).getTime()
    if (!Number.isFinite(t)) continue
    const i = chiSo.get(ngayVn(t))
    if (i !== undefined) out[i].so += c.daNop
  }
  return out
}

/** Thống kê ca trong một tháng (giờ VN) — hàng thẻ số màn Ca kiểm tra. */
export function thongKeThang(ds: readonly CaTomTat[], nowMs: number): { thang: number; soCa: number; daNop: number; daVao: number; roiMan: number; soCaRoiMan: number } {
  const thangNay = ngayVn(nowMs).slice(0, 7)
  const trong = ds.filter((c) => c.loai !== 'baitap' && c.trangThai !== 'da_xoa' && Number.isFinite(new Date(c.batDau || c.moLuc).getTime()) && ngayVn(new Date(c.batDau || c.moLuc).getTime()).slice(0, 7) === thangNay)
  return {
    thang: Number(thangNay.slice(5, 7)),
    soCa: trong.length,
    daNop: trong.reduce((s, c) => s + c.daNop, 0),
    daVao: trong.reduce((s, c) => s + c.daVao, 0),
    roiMan: trong.reduce((s, c) => s + c.canhBao, 0),
    soCaRoiMan: trong.filter((c) => c.canhBao > 0).length,
  }
}

/** Ca kiểm tra đã xong trong `soNgay` ngày, có bài nộp, chưa có chiến dịch nào giao từ ca ấy — việc "Giao chiến dịch". */
export function caChuaCoChienDich(ds: readonly CaTomTat[], cds: readonly ChienDichTom[], nowMs: number, soNgay = 7): CaTomTat[] {
  const daGiao = new Set(cds.map((c) => c.maCa).filter(Boolean))
  return ds
    .filter((c) => c.loai !== 'baitap' && c.trangThai === 'dong' && c.daNop > 0 && !daGiao.has(c.maCa))
    .filter((c) => {
      const t = new Date(c.batDau || c.moLuc).getTime()
      return Number.isFinite(t) && nowMs - t <= soNgay * NGAY_MS
    })
    .sort((a, b) => (b.batDau || b.moLuc).localeCompare(a.batDau || a.moLuc))
}
