// BTVN "NÂNG ĐỠ" — LỊCH CHẶNG (hàm THUẦN, không IO). Tách riêng để cả `btvn-nang-do-d1.ts` lẫn `ke-hoach-ngay-d1.ts` dùng mà không vòng import.
import { themNgay } from './ho-so-nam-kt'
import { ngayVn } from './su-kien-hoc'
import { lichDaiSomHon } from '../../src/lib/btvn-nang-do-lich'
import { baiTuNgayMoc, docMocNo, KHOA_HIEN_THI_TU, KHOA_MOC_BANG_TIN_NO, KHOA_VE_DICH_TU } from './moc-no'

/** Khoảng cách `lan` của sổ `btvn_lo` giữa hai lượt làm của cùng một bài cá nhân hoá (chỉ số chặng luôn < 1000): `lan = chiSo + LAN_MOI_LUOT × (lượt − 1)`. Nơi đọc `lan` làm chỉ số lô phải lấy `lan % LAN_MOI_LUOT`. */
export const LAN_MOI_LUOT = 1000

/** Mốc mở từng chặng: chặng 0 = lúc chốt; chặng k ≥ 1 = 00:00 giờ VN của ngày thứ k kể từ ngày chốt (luôn < hạn nộp vì soChang ≤ ceil((hạn − lúc chốt)/ngày)). */
export function moLucChang(chotLuc: string, soChang: number): string[] {
  const ngayChot = ngayVn(chotLuc)
  const ra: string[] = []
  for (let k = 0; k < soChang; k++) ra.push(k === 0 ? new Date(Date.parse(chotLuc)).toISOString() : new Date(Date.parse(`${themNgay(ngayChot, k)}T00:00:00+07:00`)).toISOString())
  return ra
}

export interface TrangThaiChang {
  chiSo: number
  soCau: number
  moLuc: string
  /** ISO — "xong đúng nhịp" trước lúc này (23:59 giờ VN của ngày mở chặng); chỉ có khi bài có lịch đã lưu (bản 1.1). */
  dungNhipTruoc?: string
  daMo: boolean
  daXong: boolean
}

/** LỊCH ĐÃ LƯU ở `btvn_em.chang_mo_json` (bản 1.1, tính MỘT lần lúc chốt bằng `xepLichChang`): `theoGio` = hạn ngắn, chia theo giờ trong cửa sổ học. */
export interface LichDaLuu {
  cheDo: 'dai' | 'ngan'
  moLuc: string[]
  dungNhipTruoc: string[]
}

/** Ngữ cảnh để áp BẢN 1.3 khi đọc (hạn rơi buổi trưa): lịch hạn dài chốt trước bản vá được tính lại, chặng CHƯA MỞ chỉ được mở SỚM hơn (`lichDaiSomHon`, Code 1). */
export interface NguCanhLich {
  chotLuc: string
  hanNop: string
  nowMs: number
}

/**
 * Đọc `chang_mo_json`. Vắng / hỏng / lệch số chặng / mốc không phải ISO hoặc lùi giờ ⇒ `null` (bài chốt trước bản 1.1 ⇒ dùng `moLucChang` cũ).
 * Có `nguCanh` và lịch đã lưu là hạn DÀI ⇒ mốc mở chặng chưa mở tính lại theo bản 1.3 (chỉ sớm hơn, không migration, áp lại vẫn cùng kết quả); lỗi thời gian ⇒ giữ lịch đã lưu.
 */
export function docLichDaLuu(v: unknown, soChang: number, nguCanh?: NguCanhLich): LichDaLuu | null {
  const lich = docLichDaLuuGoc(v, soChang)
  if (!lich || !nguCanh || lich.cheDo !== 'dai') return lich
  try {
    const moi = lichDaiSomHon(lich.moLuc, { chotLuc: nguCanh.chotLuc, hanNop: nguCanh.hanNop }, nguCanh.nowMs)
    return moi.length === lich.moLuc.length ? { ...lich, moLuc: moi } : lich
  } catch {
    return lich
  }
}

function docLichDaLuuGoc(v: unknown, soChang: number): LichDaLuu | null {
  if (v === null || v === undefined || v === '') return null
  try {
    const o = JSON.parse(String(v)) as { cheDo?: unknown; chang?: unknown }
    if (!o || typeof o !== 'object' || !Array.isArray(o.chang) || o.chang.length !== soChang || soChang === 0) return null
    const moLuc: string[] = []
    const dungNhipTruoc: string[] = []
    for (const c of o.chang as { moLuc?: unknown; dungNhipTruoc?: unknown }[]) {
      const m = typeof c?.moLuc === 'string' ? Date.parse(c.moLuc) : NaN
      if (!Number.isFinite(m) || (moLuc.length > 0 && m < Date.parse(moLuc[moLuc.length - 1]!))) return null
      moLuc.push(new Date(m).toISOString())
      const n = typeof c?.dungNhipTruoc === 'string' ? Date.parse(c.dungNhipTruoc) : NaN
      dungNhipTruoc.push(Number.isFinite(n) ? new Date(n).toISOString() : '')
    }
    return { cheDo: o.cheDo === 'ngan' ? 'ngan' : 'dai', moLuc, dungNhipTruoc }
  } catch {
    return null
  }
}

/** Chặng nào đã mở/đã xong. Chặng k > 0 mở khi chặng k−1 ĐÃ XONG và tới `moLuc[k]`; bài đã nộp ⇒ mọi chặng coi là mở. */
export function trangThaiCacChang(chang: string[][], chotLuc: string, loDaXong: number, daNop: boolean, now: number, lich?: LichDaLuu | null): { chang: TrangThaiChang[]; changDangMo: number | null } {
  const moLuc = lich && lich.moLuc.length === chang.length ? lich.moLuc : moLucChang(chotLuc, chang.length)
  const daXong = Math.max(0, Math.min(chang.length, Math.floor(loDaXong)))
  const ds = chang.map((qs, k): TrangThaiChang => ({
    chiSo: k,
    soCau: qs.length,
    moLuc: moLuc[k],
    ...(lich && lich.moLuc.length === chang.length && lich.dungNhipTruoc[k] ? { dungNhipTruoc: lich.dungNhipTruoc[k] } : {}),
    daMo: daNop || k === 0 || (k <= daXong && now >= Date.parse(moLuc[k])),
    daXong: k < daXong,
  }))
  return { chang: ds, changDangMo: daXong < chang.length && ds[daXong].daMo ? daXong : null }
}

/** Số giờ TRỄ so với hạn nộp (làm tròn LÊN, tối thiểu 1); 0 = chưa quá hạn / hạn không đọc được. */
export function soGioTre(hanNop: unknown, nowMs: number): number {
  const h = Date.parse(String(hanNop ?? ''))
  return Number.isFinite(h) && nowMs > h ? Math.max(1, Math.ceil((nowMs - h) / 3_600_000)) : 0
}

/**
 * Mốc GỐC (ms) của các chặng đã MỞ SỚM (Điều 6): `moSom: [{ chiSo, luc, truoc }]` trong `chang_mo_json`, `truoc` = mốc mở theo lịch TRƯỚC khi bị đổi thành lúc mở sớm.
 * Mọi chỗ phân loại "nợ / hôm nay / sắp tới / chậm lịch" phải dùng mốc GỐC (em được mở sớm mà chưa kịp làm KHÔNG bị tính nợ sớm hơn lịch); cửa chặng / cổng nộp vẫn dùng `moLuc` thật. Hỏng / vắng ⇒ rỗng.
 */
export function moLucGocChangMoSom(lichJson: unknown): Map<number, number> {
  const ra = new Map<number, number>()
  try {
    const o = (typeof lichJson === 'string' ? JSON.parse(lichJson) : lichJson) as { moSom?: unknown } | null
    if (!Array.isArray(o?.moSom)) return ra
    for (const x of o!.moSom as { chiSo?: unknown; truoc?: unknown }[]) {
      const t = typeof x?.truoc === 'string' ? Date.parse(x.truoc) : NaN
      if (Number.isInteger(x?.chiSo) && Number.isFinite(t)) ra.set(x.chiSo as number, t)
    }
  } catch { /* JSON hỏng: không có mốc gốc */ }
  return ra
}

/**
 * NỘP TRỄ có được bật cho bài này không (Điều 4 = B đổi luật hạn nộp): TẮT nếu (a) cờ LÙI NHANH `cau_hinh.btvn_nop_tre = 'tat'` — trở lại luật cũ (qua hạn là khoá `qua_han`, em nhờ thầy gia hạn); hoặc
 * (b) bài được giao TRƯỚC NGÀY MỐC tính nợ (thầy nói rõ 21/09 15:55: bài cũ không được sống lại; mốc = `ve_dich_tu` ⇒ `bang_tin_tu` ⇒ hằng, xem moc-no.ts). Áp ở CẢ BA đường: mở bài (`/btvn/cua-em`),
 * nộp chặng (`/btvn/xong-lo`), nộp cả bài (`/btvn/nop`). Vắng cờ / lỗi đọc ⇒ BẬT; `giaoLuc` vắng / hỏng ⇒ coi là bài hợp lệ. MỘT truy vấn `cau_hinh`, chỉ chạy khi bài ĐÃ qua hạn (đường thường không tốn truy vấn).
 */
export async function btvnNopTreBat(env: { DB: { prepare(q: string): { bind(...a: unknown[]): { all<T>(): Promise<{ results?: T[] }> } } } }, giaoLuc?: unknown): Promise<boolean> {
  try {
    const r = await env.DB.prepare('SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN (?, ?, ?, ?)').bind('btvn_nop_tre', KHOA_HIEN_THI_TU, KHOA_VE_DICH_TU, KHOA_MOC_BANG_TIN_NO).all<{ khoa?: unknown; gia_tri?: unknown }>()
    const cau = new Map((r.results ?? []).map((x) => [String(x.khoa ?? ''), x.gia_tri]))
    if (String(cau.get('btvn_nop_tre') ?? '').trim().toLowerCase() === 'tat') return false
    return baiTuNgayMoc(giaoLuc, docMocNo(cau.get(KHOA_HIEN_THI_TU), cau.get(KHOA_VE_DICH_TU), cau.get(KHOA_MOC_BANG_TIN_NO)))
  } catch {
    return true
  }
}

/** NỘP TRỄ (Điều 4 = B): sau khi lượt nộp ĐẦU đã ghi `nop_luc`, đánh dấu `nop_tre = 1` + `gio_tre`. Best-effort: thiếu cột (chưa chạy migration-2109-nop-tre.sql) hoặc lỗi ⇒ bỏ qua, KHÔNG làm hỏng việc nộp. */
export async function ghiNopTre(env: { DB: { prepare(q: string): { bind(...a: unknown[]): { run(): Promise<unknown> } } } }, khoa: string, nopLuc: string, hanNop: unknown, nowMs: number): Promise<void> {
  const gio = soGioTre(hanNop, nowMs)
  if (gio <= 0) return
  try {
    await env.DB.prepare('UPDATE btvn_em SET nop_tre = 1, gio_tre = ? WHERE khoa = ? AND nop_luc = ?').bind(gio, khoa, nopLuc).run()
  } catch (e) {
    console.error('[nop-tre] không ghi được nộp trễ (bỏ qua):', e instanceof Error ? e.message : e)
  }
}
