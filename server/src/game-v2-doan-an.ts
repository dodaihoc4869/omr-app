// ĐOÀN HỘ TỐNG — bước 6: ẤN THẠCH DẠNG (sức mạnh đến từ khắc phục), bạn đồng hành BÙ NHAU, hào quang/danh hiệu, bảng cho thầy.
// Mọi thứ ĐỌC từ hồ sơ nắm kiến thức thật (`nam_kt_dang`) bằng đúng MỘT định nghĩa "dạng yếu" của hồ sơ (`dangYeu`) — game không có định nghĩa riêng.
// Ấn SÁNG không tăng chỉ số thô: chỉ mở biến thể kỹ năng (×1,25 theo công thức đã chốt) khi câu của hiệp thuộc đúng dạng em đã khắc phục.
import type { Env } from './kieu'
import { PETS } from '../../src/game/than-thu-v2/core'
import { CHIEU } from '../../src/game/than-thu-v2/doan-core'
import { hashSeed } from '../../src/lib/exam-shuffle'
import { dangYeu, type NamKtDang } from './ho-so-nam-kt'
import { NGUONG_DANG_YEU, SO_CAU_DU_TIN } from './ho-so-cau-hinh'

type Row = Record<string, unknown>
export type TrangThaiAn = 'sang' | 'nut'
export interface AnThach { dang: string; ten: string; trangThai: TrangThaiAn; conCau: number }
export const SO_AN_HIEN = 6
export const HAO_QUANG = { bac: 3, vang: 6 } // số ấn sáng
export const DANH_HIEU_TIEP_SUC = { soLan: 3, soNgay: 7, ten: 'Người tiếp sức' }

// ───────────────────────── Hàm thuần ─────────────────────────
/** Ấn NỨT = dạng đang yếu theo hồ sơ; ấn SÁNG = đã đủ căn cứ (≥ 4 câu đã gặp) và không yếu; chưa đủ căn cứ → chưa có ấn (không đoán). */
export function trangThaiAn(d: NamKtDang, homNay: string): TrangThaiAn | null {
  if (dangYeu(d, homNay)) return 'nut'
  return d.soGap >= SO_CAU_DU_TIN ? 'sang' : null
}
/** Còn bao nhiêu câu cần khắc phục nữa thì ấn sáng — số đo được từ hồ sơ, tối thiểu 1 khi ấn đang nứt. */
export function conCauDeSang(d: NamKtDang, homNay: string): number {
  if (!dangYeu(d, homNay)) return 0
  const theoTiLe = d.soGap >= SO_CAU_DU_TIN ? Math.ceil(NGUONG_DANG_YEU * d.soGap - (d.soDaKhacPhuc + d.soChuaThaySai) - 1e-9) : 0
  return Math.max(1, theoTiLe, d.soMoiSai)
}
export const haoQuang = (soAnSang: number): 'khong' | 'bac' | 'vang' => (soAnSang >= HAO_QUANG.vang ? 'vang' : soAnSang >= HAO_QUANG.bac ? 'bac' : 'khong')

// ───────────────────────── D1 (không bao giờ ném lỗi vì thiếu bảng hồ sơ) ─────────────────────────
const doiDong = (x: Row): NamKtDang => ({ sbd: String(x.sbd), maDang: String(x.ma_dang), soGap: Number(x.so_gap) || 0, soSai: Number(x.so_sai) || 0, soDaKhacPhuc: Number(x.so_da_khac_phuc) || 0, soMoiSai: Number(x.so_moi_sai) || 0,
  soChuaThaySai: Number(x.so_chua_thay_sai) || 0, bac: Number(x.bac) || 0, mocOnKe: x.moc_on_ke ? String(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? String(x.moc_moi_sai) : null })
const CHON = "SELECT sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,moc_on_ke,moc_moi_sai FROM nam_kt_dang WHERE ma_dang NOT LIKE 'CD:%'"
async function tenDang(env: Env, ds: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  if (!ds.length) return ra
  try {
    const r = await env.DB.prepare(`SELECT dang, MAX(json_extract(json,'$.tenDang')) ten FROM game_v2_question WHERE dang IN (${ds.map(() => '?').join(',')}) GROUP BY dang`).bind(...ds).all<Row>()
    for (const x of r.results ?? []) if (x.ten) ra.set(String(x.dang), String(x.ten))
  } catch { /* không có chỉ mục: dùng mã dạng */ }
  return ra
}
/** Mọi ấn của em (chưa cắt 6): nứt trước (gần sáng nhất lên đầu), rồi tới sáng. */
export async function docAnThach(env: Env, sbd: string, homNay: string): Promise<AnThach[]> {
  try {
    const r = await env.DB.prepare(`${CHON} AND sbd=?`).bind(sbd).all<Row>()
    const ds = (r.results ?? []).map(doiDong).map(d => ({ d, tt: trangThaiAn(d, homNay) })).filter((x): x is { d: NamKtDang; tt: TrangThaiAn } => !!x.tt)
    const ten = await tenDang(env, ds.map(x => x.d.maDang))
    return ds.map(x => ({ dang: x.d.maDang, ten: ten.get(x.d.maDang) ?? x.d.maDang, trangThai: x.tt, conCau: conCauDeSang(x.d, homNay) }))
      .sort((a, b) => (a.trangThai === 'nut' ? 0 : 1) - (b.trangThai === 'nut' ? 0 : 1) || a.conCau - b.conCau || a.dang.localeCompare(b.dang))
  } catch { return [] }
}
export interface AnXem { sang: number; nut: number; ds: AnThach[]; ganSang: { ten: string; conCau: number; kyNang: string } | null }
export function anChoSanh(ds: AnThach[], pet: number): AnXem {
  const nut = ds.filter(a => a.trangThai === 'nut'), g = nut[0]
  return { sang: ds.length - nut.length, nut: nut.length, ds: ds.slice(0, SO_AN_HIEN), ganSang: g ? { ten: g.ten, conCau: g.conCau, kyNang: CHIEU[pet]?.kyNangAn ?? '' } : null }
}

export interface BanDongHanh { ten: string; pet: number; cap: number; banVung: string; emVung: string }
/** Bạn cùng lớp BÙ NHAU với em: bạn ấy có ấn SÁNG ở dạng em đang nứt VÀ ngược lại. Chỉ nói điều mỗi bên VỮNG. Tất định theo (sbd, ngày). */
export async function goiYBanDongHanh(env: Env, sbd: string, lop: string, homNay: string, tenGoi: (hoTen: string, duPhong: string) => string): Promise<BanDongHanh | null> {
  if (!lop) return null
  try {
    const r = await env.DB.prepare(`${CHON} AND sbd IN (SELECT sbd FROM hoc_sinh WHERE lop=? AND COALESCE(trang_thai,'')<>'khoa' LIMIT 80)`).bind(lop).all<Row>()
    const theo = new Map<string, { sang: Set<string>; nut: Set<string> }>()
    for (const d of (r.results ?? []).map(doiDong)) { const tt = trangThaiAn(d, homNay); if (!tt) continue; const o = theo.get(d.sbd) ?? { sang: new Set(), nut: new Set() }; o[tt].add(d.maDang); theo.set(d.sbd, o) }
    const toi = theo.get(sbd); if (!toi) return null
    let tot: { sbd: string; ban: string; em: string; diem: number } | null = null
    for (const [ban, o] of theo) {
      if (ban === sbd) continue
      const banVung = [...toi.nut].filter(x => o.sang.has(x)).sort(), emVung = [...o.nut].filter(x => toi.sang.has(x)).sort()
      if (!banVung.length || !emVung.length) continue
      const diem = (banVung.length + emVung.length) * 1e6 + (hashSeed(`${sbd}|${ban}|${homNay}`) % 1e6)
      if (!tot || diem > tot.diem) tot = { sbd: ban, ban: banVung[0]!, em: emVung[0]!, diem }
    }
    if (!tot) return null
    const hs = await env.DB.prepare('SELECT h.ho_ten, g.json FROM hoc_sinh h JOIN game_v2_profile g ON g.sbd=h.sbd WHERE h.sbd=?').bind(tot.sbd).first<{ ho_ten: string | null; json: string }>()
    if (!hs) return null
    const p = JSON.parse(hs.json) as { pet?: string; cap?: number; choice?: boolean }
    if (p.choice) return null
    const pet = Math.max(0, PETS.findIndex(x => x.id === p.pet)), ten = await tenDang(env, [tot.ban, tot.em])
    return { ten: tenGoi(String(hs.ho_ten ?? ''), PETS[pet]!.name), pet, cap: Math.max(1, Number(p.cap) || 1), banVung: ten.get(tot.ban) ?? tot.ban, emVung: ten.get(tot.em) ?? tot.em }
  } catch { return null }
}

/** HIỂN THỊ NGOÀI GAME (Bảng nhiệm vụ, Vinh danh, màn chiếu): hào quang theo số ấn sáng, danh hiệu theo việc tiếp sức thật trong 7 ngày. Chưa có gì → 'khong' / null. */
export async function docHienThi(env: Env, sbd: string, now: number, homNay: string): Promise<{ anSang: number; anNut: number; haoQuang: 'khong' | 'bac' | 'vang'; danhHieu: string | null }> {
  const an = await docAnThach(env, sbd, homNay), sang = an.filter(a => a.trangThai === 'sang').length
  let giup = 0
  try { giup = (await env.DB.prepare("SELECT COUNT(*) n FROM doan_tiep_suc WHERE tu_sbd=? AND thanh_cong=1 AND luc>=?").bind(sbd, new Date(now - DANH_HIEU_TIEP_SUC.soNgay * 86_400_000).toISOString()).first<{ n: number }>())?.n ?? 0 } catch { /* chưa có sổ */ }
  return { anSang: sang, anNut: an.length - sang, haoQuang: haoQuang(sang), danhHieu: giup >= DANH_HIEU_TIEP_SUC.soLan ? DANH_HIEU_TIEP_SUC.ten : null }
}

/** BẢNG CHO THẦY (đường quản trị, đã qua cổng giáo viên của index.ts): ai giúp ai, Người tiếp sức của tuần, lớp yếu dạng nào qua câu trùm. */
export async function baoCaoDoan(env: Env, b: Row): Promise<Record<string, unknown>> {
  const lop = String(b.lop ?? '').trim(), soNgay = Math.max(1, Math.min(60, Number(b.soNgay) || 7)), tu = new Date(Date.now() - soNgay * 86_400_000).toISOString()
  const loc = lop ? ' AND h.lop=?' : '', tham = lop ? [tu, lop] : [tu]
  const ten = "COALESCE(NULLIF(TRIM(h.ho_ten),''),t.tu_sbd)"
  try {
    const cap = await env.DB.prepare(`SELECT t.tu_sbd tu, ${ten} tenTu, t.den_sbd den, COALESCE(NULLIF(TRIM(d.ho_ten),''),t.den_sbd) tenDen, COUNT(*) soLan, SUM(CASE WHEN t.thanh_cong=1 THEN 1 ELSE 0 END) thanhCong
      FROM doan_tiep_suc t JOIN hoc_sinh h ON h.sbd=t.tu_sbd LEFT JOIN hoc_sinh d ON d.sbd=t.den_sbd WHERE t.luc>=?${loc} GROUP BY t.tu_sbd,t.den_sbd ORDER BY soLan DESC, tu, den LIMIT 200`).bind(...tham).all<Row>()
    const top = await env.DB.prepare(`SELECT t.tu_sbd sbd, ${ten} ten, h.lop lop, COUNT(*) soLan, SUM(CASE WHEN t.thanh_cong=1 THEN 1 ELSE 0 END) thanhCong
      FROM doan_tiep_suc t JOIN hoc_sinh h ON h.sbd=t.tu_sbd WHERE t.luc>=?${loc} GROUP BY t.tu_sbd ORDER BY thanhCong DESC, soLan DESC, sbd LIMIT 10`).bind(...tham).all<Row>()
    let trum: Row[] = []
    try {
      const r = await env.DB.prepare(`SELECT ma_dang maDang, COUNT(*) soLan, ROUND(AVG(y_dung),2) yDungTB, SUM(CASE WHEN y_dung>=3 THEN 1 ELSE 0 END) voGiap FROM doan_trum_cau WHERE ngay_vn>=?${lop ? ' AND lop=?' : ''} GROUP BY ma_dang ORDER BY yDungTB ASC, soLan DESC LIMIT 30`)
        .bind(tu.slice(0, 10), ...(lop ? [lop] : [])).all<Row>()
      const tenD = await tenDang(env, (r.results ?? []).map(x => String(x.maDang)))
      trum = (r.results ?? []).map(x => ({ ...x, ten: tenD.get(String(x.maDang)) ?? x.maDang }))
    } catch { /* chưa chạy migration bước 6 */ }
    return { ok: true, lop, soNgay, tiepSuc: cap.results ?? [], nguoiTiepSucCuaTuan: top.results ?? [], trum }
  } catch (e) {
    if (e instanceof Error && /no such table/i.test(e.message)) return { ok: true, lop, soNgay, tiepSuc: [], nguoiTiepSucCuaTuan: [], trum: [] }
    throw e
  }
}
