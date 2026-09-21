// "DỒN VỀ ĐÍCH" — PHẦN ĐỌC-CHỈ CỦA MÁY CHỦ (Code 4 viết giúp Code 3 theo lệnh Boss, 21/09/2026; thầy chốt 14:13 "Chốt B và chốt hết build"; `DE-XUAT-DON-VE-DICH-2109.md`, `prompt-don-ve-dich-2109.md` mục "CODE 3 — máy chủ").
//
// `docVeDichCuaEm(env, sbd, nowMs)` DỰNG đầu vào từ D1 rồi giao cho hàm thuần của Code 1 (`src/lib/ve-dich.ts`: `soNo`, `keHoachVeDich`) — không tự tính lại luật nào của hàm thuần:
//   { no: { theoNgay: MonNo[], tongCau, tongPhut }, veDich: [ { maBtvn, ten, hanNop, gioConLai, quaHan, chang[{chiSo, trangThai, ngay}], toiNay, cacBuoiSau, kip, canRutPhanLamThem, daRutPhanLamThem } ] }
// ĐỌC-CHỈ: không INSERT/UPDATE/DELETE, không mở/khoá chặng, không đổi hạn nộp (test khoá). CHỈ đọc đúng `sbd` được đưa vào — việc xác thực (token / SBD trần) là của lệnh gọi.
// Không một trường hay chữ nào của game (thần thú, EXP, khiên…): tên bài/gói có chữ game bị thay bằng tên chung (`chu-game.ts`).
//
// TRUY VẤN D1 (đo trong test): 5 ở đường thường — (1) bài tập về nhà đang chạy + số câu từng chặng (UNION ALL), (2) học sinh + danh sách lớp + ca kiểm tra sắp tới (UNION ALL), (3) câu ôn quá lịch (gộp theo ngày mốc),
// (4) gói gia đình giao chưa xong, (5) sổ học: giờ hay học (14 ngày) + giây/câu (30 ngày). Tối đa 6: chỉ truy vấn (1) có một đường lùi (bản D1 chưa có cột/bảng "nâng đỡ" ⇒ đọc như bài thường).
// Bảng/cột thiếu (`no such table/column`, migration chưa chạy) ⇒ giá trị an toàn của riêng phần đó (như `tat()` ở ph-giao-them.ts); lỗi D1 khác vẫn ném (không nuốt lỗi thật).
//
// CÁC CHỖ TỰ CHỌN (đề bài để ngỏ; mỗi chỗ có một hằng số hoặc một hàm nhỏ để đổi):
//   • Bài "đang chạy" = chưa nộp, chưa thu hồi, chưa xoá, hạn nộp chưa quá `NGAY_LIET_KE_BAI_QUA_HAN` (14) ngày — cùng cửa sổ liệt kê quá hạn của kế hoạch ngày. Bài QUÁ HẠN vẫn còn chặng chưa làm thì vẫn hiện (Điều 4 B).
//   • Bài KHÔNG chia chặng (bài cũ, hoặc bài cá nhân hoá em chưa mở nên chưa chốt): coi là MỘT chặng, chưa có lịch nên KHÔNG bị tính nợ trước hạn — mốc mở giả = min(00:00 ngày hạn, 00:00 hôm nay):
//     còn hạn ⇒ 'hom_nay'; hạn đã qua từ ngày trước ⇒ 'no' gắn ngày hạn (Điều 4 B). Số câu: bài cũ = `btvn.so_cau`; bài cá nhân hoá chưa chốt = min(so_cau, số ngày còn lại × NGAN_SACH_TRAN) — như kế hoạch ngày (ke-hoach-ngay.ts, "kẻo tải ngày bị thổi phồng").
//   • Câu ôn quá lịch = câu TỪNG SAI còn đang ôn (`moi_sai`/`dang_on`/`da_khac_phuc`, `can_day_lai = 0`) có mốc `moc_on_ke` < hôm nay — cùng tập trạng thái với hàng ôn của kế hoạch ngày (`cauToiHan`), chỉ khác "< hôm nay" thay vì "≤".
//     Gom theo NGÀY MỐC; giữ `SO_NGAY_RAI_ON_TOI_DA` (3) ngày mốc GẦN NHẤT, phần cũ hơn DỒN vào ngày cũ nhất trong ba (không bỏ số câu nào — nợ không biến mất) — xem `gomOnQuaLich`.
//   • Gói gia đình giao = bài `mom_bai` chưa nộp, KHÔNG phải bài hằng ngày `daily_*` (kế hoạch ngày cũng bỏ bài hằng ngày của ngày cũ), tạo trong 14 ngày VN gần nhất, ngày VN của `created_at` < hôm nay. Mỗi gói một món nợ.
//   • Khung giờ học của em = cửa sổ 3 giờ tròn giờ có nhiều lượt học nhất trong 14 ngày (giờ VN), nằm trong 07:00–22:30 (cuối cửa sổ kẹp 22:30); < 20 lượt hoặc không suy được ⇒ `KHUNG_GIO_HOC_MAC_DINH` (19:30–22:30) — xem `khungGioTuLuotTheoGio`.
//   • Ca kiểm tra sắp tới = ca `mo`, loại `thi`, khớp khối của em (`ca.lop` rỗng hoặc bằng `hoc_sinh.lop` — cùng cách ke-hoach-ngay-d1.ts) và qua cổng phạm vi (`chon`/`khoi` như `hopPhamVi` của index.ts — test khoá hai bản khớp nhau),
//     còn diễn ra hoặc bắt đầu trong 7 ngày tới; khoảng giờ = [bắt đầu, bắt đầu + thoi_gian_phut] (thiếu ⇒ 45 phút như cổng vào thi).
//   • Mỗi bài được lập kế hoạch RIÊNG (như hàm thuần); giờ học của gói gia đình / câu ôn chưa trừ khỏi khung giờ của các bài (chúng chỉ nằm ở `no`).
import type { Env } from './kieu'
import { phutUocTinhChang } from '../../src/lib/btvn-nang-do-lich'
import {
  GIO_MUON_NHAT, KHUNG_GIO_HOC_MAC_DINH, SO_NGAY_RAI_ON_TOI_DA, keHoachVeDich, soNo,
  type BaiDangChay, type BuoiVeDich, type GoiGiaDinhChuaXong, type KhoangGio, type KhungGioHoc, type MonNo, type OnQuaLich, type ViecVeDich,
} from '../../src/lib/ve-dich'
import { docLichDaLuu, moLucChang } from './btvn-nang-do-chang'
import { coChuGame } from './chu-game'
import { NGAN_SACH_TRAN, NGAY_LIET_KE_QUA_HAN, SO_NGAY_DO_VAN_TOC } from './ho-so-cau-hinh'
import { themNgay } from './ho-so-nam-kt'
import { tinhVanToc } from './ke-hoach-ngay'
import { ngayVn } from './su-kien-hoc'

type Row = Record<string, unknown>

// ------------------------------------------------------------------ hằng số (test khoá từng con số) ------------------------------------------------------------------
export const NGAY_LIET_KE_BAI_QUA_HAN = NGAY_LIET_KE_QUA_HAN
export const TOI_DA_BAI_DANG_CHAY = 20
export const SO_NGAY_GOI_GIA_DINH = 14
export const SO_NGAY_KHUNG_GIO = 14
export const TOI_THIEU_LUOT_KHUNG_GIO = 20
export const SO_GIO_KHUNG_HOC = 3
/** Khung học của em không sớm hơn giờ này (giờ VN). */
export const GIO_HOC_SOM_NHAT = 7
/** Cửa sổ 3 giờ bắt đầu muộn nhất từ giờ này (20:00 ⇒ cuối cửa sổ kẹp 22:30, còn 2,5 giờ). */
export const GIO_KHUNG_BAT_DAU_MUON_NHAT = 20
export const SO_NGAY_CA_SAP_TOI = 7
export const PHUT_CA_MAC_DINH = 45
const TOI_DA_CHANG_MOI_BAI = 60

const MS_PHUT = 60_000
const MS_NGAY = 86_400_000

const so = (v: unknown): number => Number(v) || 0
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const dauNgayVnMs = (ngay: string): number => Date.parse(`${ngay}T00:00:00+07:00`)
/** Tên hiển thị: rỗng hoặc có chữ game ⇒ tên chung; cắt ≤ 120 ký tự. */
const tenSach = (v: unknown, macDinh: string): string => {
  const t = chuoi(v).replace(/\s+/g, ' ').slice(0, 120)
  return t && !coChuGame(t) ? t : macDinh
}

// ------------------------------------------------------------------ kiểu trả về ------------------------------------------------------------------
export type TrangThaiChangDich = 'xong' | 'no' | 'hom_nay' | 'sap_toi'
export interface ChangDich {
  chiSo: number
  trangThai: TrangThaiChangDich
  /** Ngày VN (YYYY-MM-DD) chặng mở; bài không chia chặng đã quá hạn từ ngày trước: ngày hạn. */
  ngay: string
}
export interface ToiNay {
  soChang: number
  soCau: number
  phut: number
  /** ISO (+07:00) — bắt đầu MUỘN NHẤT tối nay để kịp (đúng `BuoiVeDich.batDauMuonNhat` của hàm thuần). */
  batDauMuonNhat: string
}
export interface BaiVeDich {
  maBtvn: string
  ten: string
  hanNop: string
  /** Giờ (đồng hồ) còn lại tới hạn nộp, làm tròn 2 số lẻ; hạn đã qua ⇒ 0. */
  gioConLai: number
  /** Hạn nộp đã qua (Điều 4 B: em vẫn phải làm nốt chặng còn lại, ghi nộp trễ). */
  quaHan: boolean
  chang: ChangDich[]
  /** Buổi có `ngay` = hôm nay (giờ VN) của kế hoạch; hôm nay không có buổi ⇒ `null`. */
  toiNay: ToiNay | null
  /** Các buổi SAU hôm nay (nguyên `BuoiVeDich` của hàm thuần). */
  cacBuoiSau: BuoiVeDich[]
  /** Mọi việc còn lại được xếp trước hạn. */
  kip: boolean
  /** Không kịp ⇒ cần rút PHẦN LÀM THÊM (lõi giữ nguyên) — lấy thẳng từ kế hoạch. */
  canRutPhanLamThem: boolean
  /** Luôn `false` ở phần đọc-chỉ; phần rút do Code 3 làm ở W3 khi nối kế hoạch ngày. */
  daRutPhanLamThem: boolean
}
export interface SoNoCuaEm {
  theoNgay: MonNo[]
  tongCau: number
  tongPhut: number
}
export interface VeDichCuaEm {
  no: SoNoCuaEm
  veDich: BaiVeDich[]
}

// ------------------------------------------------------------------ hàm thuần nhỏ (xuất để test) ------------------------------------------------------------------
/**
 * Gom câu ôn quá lịch theo NGÀY MỐC: giữ `SO_NGAY_RAI_ON_TOI_DA` ngày mốc GẦN NHẤT, các ngày cũ hơn dồn vào ngày cũ nhất trong ba (tổng số câu không đổi). Trả về tăng dần theo ngày.
 * Lý do dồn (không bỏ): nợ không tự biến mất; nhãn ngày của phần dồn là "gần nhất có thể", em vẫn thấy ĐÚNG tổng ("14 câu ôn lại đã quá lịch").
 */
export function gomOnQuaLich(cacNgay: readonly OnQuaLich[]): OnQuaLich[] {
  const xep = cacNgay
    .map((x) => ({ ngay: chuoi(x.ngay), soCau: Math.floor(Number(x.soCau)) }))
    .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.ngay) && Number.isFinite(x.soCau) && x.soCau > 0)
    .sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : 0)) // mới → cũ
  const giu = xep.slice(0, SO_NGAY_RAI_ON_TOI_DA)
  const cu = xep.slice(SO_NGAY_RAI_ON_TOI_DA).reduce((s, x) => s + x.soCau, 0)
  if (giu.length === SO_NGAY_RAI_ON_TOI_DA && cu > 0) giu[giu.length - 1]!.soCau += cu
  return giu.reverse()
}

/**
 * KHUNG GIỜ HỌC THẬT: từ số lượt học theo GIỜ VN (24 phần tử, chỉ số = giờ) chọn cửa sổ `SO_GIO_KHUNG_HOC` giờ tròn có nhiều lượt nhất, bắt đầu trong [07:00, 20:00]; hoà ⇒ cửa sổ mở đầu bằng giờ có nhiều lượt hơn,
 * vẫn hoà ⇒ cửa sổ sớm hơn (như `gioThuongHoc` của phụ huynh). Cuối cửa sổ kẹp `GIO_MUON_NHAT` (22:30). Ít hơn `TOI_THIEU_LUOT_KHUNG_GIO` lượt, hoặc không có lượt nào trong 07:00–23:00 ⇒ `null` (dùng khung mặc định).
 */
export function khungGioTuLuotTheoGio(theoGio: readonly number[]): KhungGioHoc | null {
  const h = Array.from({ length: 24 }, (_, i) => Math.max(0, Math.floor(Number(theoGio[i]) || 0)))
  if (h.reduce((s, x) => s + x, 0) < TOI_THIEU_LUOT_KHUNG_GIO) return null
  let tot = -1
  let diem = 0
  for (let s = GIO_HOC_SOM_NHAT; s <= GIO_KHUNG_BAT_DAU_MUON_NHAT; s++) {
    let c = 0
    for (let k = 0; k < SO_GIO_KHUNG_HOC; k++) c += h[s + k]!
    if (c > diem || (c === diem && tot >= 0 && h[s]! > h[tot]!)) { diem = c; tot = s }
  }
  if (tot < 0) return null
  const hh = (x: number): string => `${String(x).padStart(2, '0')}:00`
  const den = tot + SO_GIO_KHUNG_HOC
  return { tu: hh(tot), den: den * 60 >= 22 * 60 + 30 ? GIO_MUON_NHAT : hh(den) }
}

/**
 * Cổng PHẠM VI của ca — BẢN SAO có chủ đích của `hopPhamVi` (index.ts; không import để khỏi vòng phụ thuộc khi index.ts nối lệnh này). Test khoá hai bản cho cùng kết quả trên nhiều đầu vào.
 * `tu_do`/`sbd` ⇒ hợp; `khoi`: năm sinh phải khớp (thiếu năm sinh ⇒ hợp); `chon`: SBD phải nằm trong danh sách (danh sách rỗng ⇒ hợp).
 */
export function phamViHop(ca: { pham_vi?: unknown; danh_sach_chon_json?: unknown }, namSinh: unknown, sbd: string): boolean {
  const pv = String(ca.pham_vi ?? '').trim() || 'tu_do'
  if (pv !== 'khoi' && pv !== 'chon') return true
  const goc = ca.danh_sach_chon_json
  let chon: unknown = null
  if (typeof goc === 'string' && goc.trim() !== '') {
    try { chon = JSON.parse(goc) } catch { chon = null }
  }
  if (pv === 'khoi') {
    const nam = String(chon ?? '').trim()
    if (!/^\d{4}$/.test(nam)) return true
    const cuaEm = String(namSinh ?? '').trim()
    if (!cuaEm) return true
    return cuaEm === nam
  }
  const ds = Array.isArray(chon) ? chon.map((x) => String(x).trim()).filter(Boolean) : []
  if (ds.length === 0) return true
  return ds.includes(sbd)
}

// ------------------------------------------------------------------ truy vấn ------------------------------------------------------------------
const thieuBang = (e: unknown): boolean => /no such (table|column)/i.test(e instanceof Error ? e.message : String(e))

type Hoi = (sql: string, ...bind: unknown[]) => Promise<Row[] | null>
/** Truy vấn ĐỌC. Thiếu bảng/cột (migration chưa chạy) ⇒ `null`; lỗi khác vẫn ném (không nuốt lỗi D1 thật). */
const boHoi = (env: Env): Hoi => async (sql, ...bind) => {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch (e) {
    if (thieuBang(e)) return null
    throw e
  }
}

/** (1) Bài đang chạy của em (+ số câu từng chặng khi có). `nangDo` = có các cột/bảng "nâng đỡ"; không có ⇒ mọi bài đọc như bài thường. */
function sqlBai(nangDo: boolean): string {
  const cot = nangDo
    ? 'COALESCE(b.ca_nhan, 0) AS ca_nhan, be.so_cau_em, be.chot_luc, be.chang_mo_json, be.so_chang'
    : '0 AS ca_nhan, NULL AS so_cau_em, NULL AS chot_luc, NULL AS chang_mo_json, NULL AS so_chang'
  const dang = `SELECT be.ma_btvn AS ma, COALESCE(NULLIF(TRIM(c.ten_ca), ''), NULLIF(TRIM(d.ten_de), ''), '') AS ten, b.han_nop, b.giao_luc, b.so_cau AS so_cau_bai, COALESCE(be.lo_da_xong, 0) AS lo_da_xong, ${cot}
      FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de
     WHERE be.sbd = ? AND COALESCE(be.nop_luc, '') = '' AND be.thu_hoi = 0 AND b.da_xoa = 0 AND b.han_nop > ?
     ORDER BY b.han_nop, b.ma_btvn LIMIT ${TOI_DA_BAI_DANG_CHAY}`
  const bt = "SELECT 'bt' AS k, ma AS c1, ten AS c2, han_nop AS c3, giao_luc AS c4, so_cau_bai AS c5, lo_da_xong AS c6, ca_nhan AS c7, so_cau_em AS c8, chot_luc AS c9, chang_mo_json AS c10, so_chang AS c11 FROM dang"
  const cg = "SELECT 'cg', m.ma_btvn, m.chang, COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM btvn_em_cau m WHERE m.sbd = ? AND m.chang >= 0 AND m.ma_btvn IN (SELECT ma FROM dang) GROUP BY m.ma_btvn, m.chang"
  return `WITH dang AS (${dang}) ${nangDo ? `${bt} UNION ALL ${cg}` : bt}`
}

interface BaiTho {
  ma: string
  ten: string
  hanNop: string
  giaoLuc: string
  soCauBai: number
  loDaXong: number
  caNhan: boolean
  soCauEm: number
  chotLuc: string
  lichJson: string
  /** chặng → số câu (từ `btvn_em_cau`); rỗng nếu em chưa có bộ chốt / chưa migration. */
  cauMoiChang: Map<number, number>
}

async function docBai(hoi: Hoi, sbd: string, nowMs: number): Promise<BaiTho[]> {
  const cat = new Date(nowMs - NGAY_LIET_KE_BAI_QUA_HAN * MS_NGAY).toISOString()
  let r = await hoi(sqlBai(true), sbd, cat, sbd)
  if (r === null) r = await hoi(sqlBai(false), sbd, cat)
  const bai = new Map<string, BaiTho>()
  const thuTu: string[] = []
  for (const x of r ?? []) {
    if (x.k !== 'bt') continue
    const ma = chuoi(x.c1)
    if (!ma || bai.has(ma)) continue
    bai.set(ma, {
      ma, ten: chuoi(x.c2), hanNop: chuoi(x.c3), giaoLuc: chuoi(x.c4), soCauBai: so(x.c5), loDaXong: so(x.c6), caNhan: so(x.c7) === 1,
      soCauEm: so(x.c8), chotLuc: chuoi(x.c9), lichJson: chuoi(x.c10), cauMoiChang: new Map(),
    })
    thuTu.push(ma)
  }
  for (const x of r ?? []) {
    if (x.k !== 'cg') continue
    const b = bai.get(chuoi(x.c1))
    const chang = Number(x.c2)
    if (b && Number.isInteger(chang) && chang >= 0 && chang < TOI_DA_CHANG_MOI_BAI) b.cauMoiChang.set(chang, so(x.c3))
  }
  return thuTu.map((m) => bai.get(m)!)
}

interface ThongTinEm { lop: string; namSinh: string }
interface CaTho { tu: number; den: number; lop: string; phamVi: { pham_vi: unknown; danh_sach_chon_json: unknown } }

/** (2) Học sinh (+ danh sách lớp, để lấy năm sinh cho cổng phạm vi) và ca kiểm tra ở gần `nowMs`. Thiếu bảng/cột ⇒ không biết lớp, không có ca (không chặn giờ nào). */
async function docEmVaCa(hoi: Hoi, sbd: string, nowMs: number): Promise<{ em: ThongTinEm; ca: CaTho[] }> {
  // Cận SQL rộng (±1 ngày) vì `bat_dau` là chuỗi ISO có thể ở múi giờ khác; lọc chính xác bằng số ở dưới.
  const tu = new Date(nowMs - MS_NGAY).toISOString()
  const den = new Date(nowMs + (SO_NGAY_CA_SAP_TOI + 1) * MS_NGAY).toISOString()
  const r = await hoi(
    `SELECT 'em' AS k, lop AS a, nam_sinh AS b, NULL AS c, NULL AS d, NULL AS e, NULL AS f FROM hoc_sinh WHERE sbd = ?
     UNION ALL SELECT 'ds', lop, nam_sinh, NULL, NULL, NULL, NULL FROM danh_sach WHERE sbd = ?
     UNION ALL SELECT 'ca', ma_ca, bat_dau, thoi_gian_phut, lop, pham_vi, danh_sach_chon_json FROM ca
      WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi' AND bat_dau >= ? AND bat_dau <= ?`,
    sbd, sbd, tu, den,
  )
  const em: ThongTinEm = { lop: '', namSinh: '' }
  const ca: CaTho[] = []
  for (const x of r ?? []) {
    if (x.k === 'em') { em.lop = chuoi(x.a) || em.lop; em.namSinh = chuoi(x.b) || em.namSinh }
    else if (x.k === 'ds') { if (!em.lop) em.lop = chuoi(x.a); if (!em.namSinh) em.namSinh = chuoi(x.b) }
    else if (x.k === 'ca') {
      const bd = Date.parse(chuoi(x.b))
      if (!Number.isFinite(bd)) continue
      const phut = so(x.c) > 0 ? so(x.c) : PHUT_CA_MAC_DINH
      ca.push({ tu: bd, den: bd + phut * MS_PHUT, lop: chuoi(x.d), phamVi: { pham_vi: x.e, danh_sach_chon_json: x.f } })
    }
  }
  return { em, ca }
}

/** Ca kiểm tra còn liên quan tới em: chưa kết thúc, bắt đầu trong `SO_NGAY_CA_SAP_TOI` ngày tới, đúng khối và qua cổng phạm vi. */
function caCuaEm(ca: readonly CaTho[], em: ThongTinEm, sbd: string, nowMs: number): KhoangGio[] {
  return ca
    .filter((c) => c.den > nowMs && c.tu <= nowMs + SO_NGAY_CA_SAP_TOI * MS_NGAY && (c.lop === '' || c.lop === em.lop) && phamViHop(c.phamVi, em.namSinh, sbd))
    .sort((a, b) => a.tu - b.tu || a.den - b.den)
    .map((c) => ({ tu: new Date(c.tu).toISOString(), den: new Date(c.den).toISOString() }))
}

/** (3) Câu ôn QUÁ LỊCH gộp theo ngày mốc (tập trạng thái y hệt hàng ôn `cauToiHan` của kế hoạch ngày; mốc < hôm nay). Thiếu bảng ⇒ không có nợ ôn. */
async function docOn(hoi: Hoi, sbd: string, homNay: string): Promise<OnQuaLich[]> {
  const r = await hoi(
    `SELECT moc_on_ke AS ngay, COUNT(*) AS n FROM nam_kt_cau
      WHERE sbd = ? AND trang_thai IN ('moi_sai', 'dang_on', 'da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke < ?
      GROUP BY moc_on_ke`,
    sbd, homNay,
  )
  return gomOnQuaLich((r ?? []).map((x) => ({ ngay: chuoi(x.ngay), soCau: so(x.n) })))
}

/** (4) Gói gia đình giao CHƯA nộp của các ngày trước. Cận SQL rộng hơn 1 ngày; ngày VN tính bằng số ở dưới. Thiếu bảng ⇒ không có. */
async function docGoi(hoi: Hoi, sbd: string, nowMs: number): Promise<GoiGiaDinhChuaXong[]> {
  const homNay = ngayVn(nowMs)
  const tuNgay = themNgay(homNay, -SO_NGAY_GOI_GIA_DINH)
  const r = await hoi(
    `SELECT id, title, question_count, created_at FROM mom_bai
      WHERE sbd = ? AND COALESCE(submitted_at, '') = '' AND substr(id, 1, 6) <> 'daily_' AND created_at >= ? ORDER BY created_at, id LIMIT 60`,
    sbd, new Date(dauNgayVnMs(tuNgay) - MS_NGAY).toISOString(),
  )
  const ra: GoiGiaDinhChuaXong[] = []
  for (const x of r ?? []) {
    const ngay = ngayVn(chuoi(x.created_at))
    if (!ngay || ngay >= homNay || ngay < tuNgay || so(x.question_count) <= 0) continue
    ra.push({ ngay, soCau: so(x.question_count), ten: tenSach(x.title, 'Bài gia đình giao') })
  }
  return ra
}

/** (5) Sổ học của em: số lượt theo GIỜ VN trong 14 ngày + mẫu giây/câu của 30 ngày (tối đa 400 mẫu mới nhất). Thiếu bảng ⇒ rỗng (khung mặc định, 90 giây/câu). */
async function docSoHoc(hoi: Hoi, sbd: string, homNay: string): Promise<{ theoGio: number[]; mauGiay: number[] }> {
  const r = await hoi(
    `SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT 400)
     UNION ALL SELECT 'h', CAST(strftime('%H', luc, '+7 hours') AS INTEGER), COUNT(*) FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? GROUP BY strftime('%H', luc, '+7 hours')`,
    sbd, themNgay(homNay, -SO_NGAY_DO_VAN_TOC), sbd, themNgay(homNay, -(SO_NGAY_KHUNG_GIO - 1)),
  )
  const theoGio = new Array<number>(24).fill(0)
  const mauGiay: number[] = []
  for (const x of r ?? []) {
    if (x.k === 'g') mauGiay.push(so(x.a))
    else if (x.k === 'h' && x.a !== null && x.a !== undefined) {
      const g = Number(x.a)
      if (Number.isInteger(g) && g >= 0 && g <= 23) theoGio[g]! += so(x.b)
    }
  }
  return { theoGio, mauGiay }
}

// ------------------------------------------------------------------ dựng chặng ------------------------------------------------------------------
interface ChangCuaBai {
  moLuc: string[]
  soCau: number[]
  daXong: number
}

/** Chặng của một bài: bài cá nhân hoá đã chốt ⇒ lịch đã lưu (`chang_mo_json`, không có ⇒ `moLucChang`) và số câu thật từng chặng; ngược lại MỘT chặng chưa có lịch (xem đầu tệp). */
function dungChang(b: BaiTho, hanMs: number, nowMs: number, dauHomNay: number): ChangCuaBai {
  const chotMs = Date.parse(b.chotLuc)
  if (b.caNhan && Number.isFinite(chotMs) && b.cauMoiChang.size > 0) {
    const n = Math.max(...b.cauMoiChang.keys()) + 1
    const soCau = Array.from({ length: n }, (_, i) => b.cauMoiChang.get(i) ?? 0)
    const moLuc = docLichDaLuu(b.lichJson, n, { chotLuc: b.chotLuc, hanNop: b.hanNop, nowMs })?.moLuc ?? moLucChang(b.chotLuc, n)
    return { moLuc, soCau, daXong: Math.max(0, Math.min(n, Math.floor(b.loDaXong))) }
  }
  const ngayConLai = Math.max(1, Math.ceil((hanMs - nowMs) / MS_NGAY))
  const soCau = b.caNhan ? (b.soCauEm > 0 ? b.soCauEm : Math.max(0, Math.min(b.soCauBai, ngayConLai * NGAN_SACH_TRAN))) : b.soCauBai
  const mo = Math.min(dauNgayVnMs(ngayVn(hanMs)), dauHomNay)
  return { moLuc: [new Date(mo).toISOString()], soCau: [Math.max(0, Math.floor(soCau))], daXong: 0 }
}

// ------------------------------------------------------------------ LỆNH ------------------------------------------------------------------
/**
 * Đọc "Dồn về đích" của MỘT em (đọc-chỉ, xem đầu tệp). `nowMs` do lệnh gọi đưa vào (test dựng được đủ ca). SBD rỗng / `nowMs` hỏng ⇒ không nợ, không bài.
 */
export async function docVeDichCuaEm(env: Env, sbd: string, nowMs: number = Date.now()): Promise<VeDichCuaEm> {
  const em = chuoi(sbd)
  const rong: VeDichCuaEm = { no: { theoNgay: [], tongCau: 0, tongPhut: 0 }, veDich: [] }
  if (!em || !Number.isFinite(nowMs)) return rong
  const hoi = boHoi(env)
  const homNay = ngayVn(nowMs)
  const dauHomNay = dauNgayVnMs(homNay)
  const dauMai = dauHomNay + MS_NGAY

  const [bai, emVaCa, onQuaLich, goiGiaDinh, soHoc] = await Promise.all([
    docBai(hoi, em, nowMs), docEmVaCa(hoi, em, nowMs), docOn(hoi, em, homNay), docGoi(hoi, em, nowMs), docSoHoc(hoi, em, homNay),
  ])
  const giay = tinhVanToc(soHoc.mauGiay).giay
  const khung: KhungGioHoc = khungGioTuLuotTheoGio(soHoc.theoGio) ?? KHUNG_GIO_HOC_MAC_DINH
  const ca = caCuaEm(emVaCa.ca, emVaCa.em, em, nowMs)
  const phut = (soCau: number): number => phutUocTinhChang(soCau, giay)

  const baiDangChay: BaiDangChay[] = []
  const veDich: BaiVeDich[] = []
  for (const b of bai) {
    const hanMs = Date.parse(b.hanNop)
    if (!Number.isFinite(hanMs)) continue // hạn hỏng: không lập được kế hoạch, cũng không có "quá hạn" để nói
    const ten = tenSach(b.ten, 'Bài tập về nhà')
    const c = dungChang(b, hanMs, nowMs, dauHomNay)
    baiDangChay.push({ maBtvn: b.ma, ten, hanNop: b.hanNop, moLuc: c.moLuc, daXong: c.daXong, cauMoiChang: c.soCau, phutMoiChang: c.soCau.map(phut) })

    const chang: ChangDich[] = []
    const viecConLai: ViecVeDich[] = []
    c.moLuc.forEach((mo, k) => {
      const ms = Date.parse(mo)
      const hopLe = Number.isFinite(ms)
      const ngay = hopLe ? ngayVn(ms) : ''
      // chỉ số < daXong ⇒ xong; mở trước 00:00 hôm nay mà chưa xong ⇒ nợ; mở hôm nay ⇒ hôm nay; mở sau ⇒ sắp tới (mốc hỏng: coi như đã mở hôm nay, không bịa nợ)
      const trangThai: TrangThaiChangDich = k < c.daXong ? 'xong' : !hopLe ? 'hom_nay' : ms < dauHomNay ? 'no' : ms < dauMai ? 'hom_nay' : 'sap_toi'
      chang.push({ chiSo: k, trangThai, ngay })
      if (trangThai !== 'xong') viecConLai.push({ loai: 'chang_btvn', trangThai, maBtvn: b.ma, ten, chiSo: k, ngay, soCau: c.soCau[k]!, phut: phut(c.soCau[k]!), moLuc: mo })
    })

    const kh = keHoachVeDich({ now: nowMs, hanNop: b.hanNop, viecConLai, khungGioHoc: khung, caKiemTraSapToi: ca })
    const tn = kh.cacBuoi.find((x) => x.ngay === homNay)
    veDich.push({
      maBtvn: b.ma,
      ten,
      hanNop: b.hanNop,
      gioConLai: Math.round(kh.gioConLai * 100) / 100,
      quaHan: kh.quaHan,
      chang,
      toiNay: tn ? { soChang: tn.chang.length, soCau: tn.soCau, phut: tn.phut, batDauMuonNhat: tn.batDauMuonNhat } : null,
      cacBuoiSau: kh.cacBuoi.filter((x) => x.ngay !== homNay),
      kip: kh.kip,
      canRutPhanLamThem: kh.canRutPhanLamThem,
      daRutPhanLamThem: false,
    })
  }

  const theoNgay = soNo({ now: nowMs, baiDangChay, onQuaLich, goiGiaDinh, giayMoiCau: giay })
  return { no: { theoNgay, tongCau: theoNgay.reduce((s, m) => s + m.soCau, 0), tongPhut: theoNgay.reduce((s, m) => s + m.phut, 0) }, veDich }
}

