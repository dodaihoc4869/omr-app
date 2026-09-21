// CỔNG HẤP THỤ + CHUYỂN ĐỔI HỒ SƠ — máy chủ của Đợt 1 "Thần thú mỗi ngày" (DE-XUAT-THAN-THU-MOI-NGAY-2109.md Điều 1, 2, 9; prompt-than-thu-moi-ngay-2109.md).
// Luật (hàm thuần của Code 1: src/lib/hap-thu-ngay.ts): thần thú hấp thụ tối đa 200 EXP/ngày khi em ĐẠT nhiệm vụ ngày, 120 khi có học chưa đạt, 0 khi không học; EXP dư nằm ở ống nghiệm (`wallet`).
// MỌI lên cấp đi qua `invest` → `hapThu`. Máy chủ chỉ ĐỌC hôm nay em đạt/có học chưa (từ `exp_so`, `game_v2_attempt`) rồi gọi hàm thuần; máy em chỉ hiển thị kết quả.
// Chuyển đổi hồ sơ đã chơi (luatCap ≠ 2) là LƯỜI (khi mở hồ sơ) + cron quét từng lô; luôn ghi bằng CAS theo `revision` (thua CAS = em đang chơi ⇒ KHÔNG đè, lần sau làm lại).
import type { Env } from './kieu'
import type { Profile } from './game-v2'
import { LUAT_CAP_MOI, chuyenDoiLuatCap, tranExpGameNgay, tranHapThu } from '../../src/lib/hap-thu-ngay'
import { thanhExp } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { NGAY_BANG_GIA_MOI } from './exp-cau-hinh'
import { ngayVn } from './su-kien-hoc'

export const TOI_DA_HO_SO_MOI_TICK = 40
export const KHOA_CHUYEN_DOI_XONG = 'chuyen_doi_cap'
export const TIEU_DE_LUAT_CAP = 'A.I Đỗ Đại Học · Thần thú của em'
export const KENH_LUAT_CAP = 'than_thu'
export const LOI_LUAT_CAP = 'Từ 21/09 thần thú lớn theo từng ngày em học: mỗi ngày hấp thụ tối đa 200 EXP khi em đạt nhiệm vụ ngày. EXP em đã kiếm vẫn nguyên trong ống nghiệm, thần thú sẽ ăn dần mỗi ngày em học.'

const batDauNgay = (ngay: string): string => new Date(`${ngay}T00:00:00+07:00`).toISOString()

/** Hôm nay em ĐẠT nhiệm vụ ngày / CÓ HỌC chưa (đọc-chỉ, MỘT truy vấn). Lỗi đọc ⇒ coi như chưa học (trần 0: không nạp nhầm). */
export async function docTranHapThu(env: Env, sbd: string, ngay: string): Promise<{ tran: number; dat: boolean; coHoc: boolean }> {
  try {
    const r = await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM exp_so WHERE sbd = ? AND ngay_vn = ? AND loai = 'dat_ngay') AS dat,
              (SELECT COUNT(*) FROM exp_so WHERE sbd = ? AND ngay_vn = ?) AS ex,
              (SELECT COUNT(*) FROM game_v2_attempt WHERE sbd = ? AND created_at >= ? AND created_at < ?) AS tt`,
    ).bind(sbd, ngay, sbd, ngay, sbd, batDauNgay(ngay), new Date(Date.parse(batDauNgay(ngay)) + 86_400_000).toISOString()).first<{ dat: number; ex: number; tt: number }>()
    const dat = (Number(r?.dat) || 0) > 0
    const coHoc = dat || (Number(r?.ex) || 0) > 0 || (Number(r?.tt) || 0) > 0
    return { tran: tranHapThu({ datHomNay: dat, coHocHomNay: coHoc }), dat, coHoc }
  } catch (e) {
    console.error('[hap-thu] đọc trần lỗi (coi như chưa học):', e instanceof Error ? e.message : e)
    return { tran: 0, dat: false, coHoc: false }
  }
}

/** EXP game em đã nhận hôm nay (Điều 9). Sang ngày mới = 0. */
export const daExpGameHomNay = (p: Pick<Profile, 'expGame'>, ngay: string): number => (p.expGame && p.expGame.ngay === ngay ? Math.max(0, Math.floor(Number(p.expGame.da) || 0)) : 0)

/** MỘT CỬA cho mọi khoản EXP sinh trong game (trần 120/ngày VN): trả phần THẬT được nhận (≤ xin) và ghi `p.expGame`. Quá trần ⇒ 0 (mastery, sổ, vé nơi gọi vẫn ghi đủ). */
export function nhanExpGame(p: Profile, ngay: string, xin: number): number {
  const da = daExpGameHomNay(p, ngay)
  const nhan = tranExpGameNgay(da, xin)
  p.expGame = { ngay, da: da + nhan }
  return nhan
}

interface LieuChuyenDoi { ngayCoHoc: Set<string>; ngayDat: string[] }

/** Số liệu chuyển đổi cho một lô em (HAI truy vấn cho cả lô): các ngày VN có học (exp_so ∪ game_v2_attempt) và các ngày đạt (exp_so dat_ngay) trước bảng giá mới. */
async function docLieuChuyenDoi(env: Env, dsSbd: string[], tuNgay: string): Promise<Map<string, LieuChuyenDoi>> {
  const ra = new Map<string, LieuChuyenDoi>(dsSbd.map((s) => [s, { ngayCoHoc: new Set<string>(), ngayDat: [] }]))
  if (dsSbd.length === 0) return ra
  const arr = JSON.stringify(dsSbd)
  const hoc = await env.DB.prepare(
    `SELECT sbd, d FROM (SELECT sbd, ngay_vn AS d FROM exp_so WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ?
                         UNION SELECT sbd, date(created_at, '+7 hours') AS d FROM game_v2_attempt WHERE sbd IN (SELECT value FROM json_each(?)) AND created_at >= ?)`,
  ).bind(arr, tuNgay, arr, batDauNgay(tuNgay)).all<{ sbd: string; d: string }>()
  for (const x of hoc.results ?? []) ra.get(String(x.sbd))?.ngayCoHoc.add(String(x.d))
  const dat = await env.DB.prepare("SELECT sbd, ngay_vn FROM exp_so WHERE sbd IN (SELECT value FROM json_each(?)) AND loai = 'dat_ngay' AND ngay_vn >= ? AND ngay_vn < ?").bind(arr, tuNgay, NGAY_BANG_GIA_MOI).all<{ sbd: string; ngay_vn: string }>()
  for (const x of dat.results ?? []) ra.get(String(x.sbd))?.ngayDat.push(String(x.ngay_vn))
  return ra
}

export type KetQuaDoi = { daDoi: true; profile: Profile; revision: number } | { daDoi: false; lyDo: 'da_moi' | 'thua_cas' }

/** Chuyển đổi MỘT hồ sơ (đã đọc `p`, `revision`): tính bằng hàm thuần, ghi bằng CAS, tin MỘT lần cho em nếu cấp đổi. Thua CAS ⇒ không đè. */
async function doiMotHoSo(env: Env, sbd: string, p: Profile, revision: number, lieu: LieuChuyenDoi, nowMs: number): Promise<KetQuaDoi> {
  if (p.luatCap === LUAT_CAP_MOI) return { daDoi: false, lyDo: 'da_moi' }
  const homNay = ngayVn(nowMs)
  const tuNgay = ngayVn(Number.isFinite(Date.parse(p.cutover)) ? Date.parse(p.cutover) : nowMs)
  const ngayHoc = [...lieu.ngayCoHoc].filter((d) => d >= tuNgay)
  const datTruoc = lieu.ngayDat.filter((d) => d >= tuNgay).length
  const kq = chuyenDoiLuatCap(p, ngayHoc.length, homNay, { luc: new Date(nowMs).toISOString(), coHocHomNay: ngayHoc.includes(homNay), soNgayDatTruocBangGiaMoi: datTruoc })
  if (!kq.daChuyen) return { daDoi: false, lyDo: 'da_moi' }
  const moi = kq.hoSo as Profile
  const w = await env.DB.prepare('UPDATE game_v2_profile SET json = ?, revision = revision + 1 WHERE sbd = ? AND revision = ?').bind(JSON.stringify(moi), sbd, revision).run()
  if (!w.meta.changes) return { daDoi: false, lyDo: 'thua_cas' }
  if (moi.cap !== p.cap || moi.exp !== p.exp) {
    await env.DB.prepare('INSERT OR IGNORE INTO student_notice (id, sbd, title, body, target, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(`luat-cap|${sbd}`, sbd, TIEU_DE_LUAT_CAP, LOI_LUAT_CAP, KENH_LUAT_CAP, new Date(nowMs).toISOString()).run().catch(() => { /* tin phụ: hụt thì thôi */ })
  }
  return { daDoi: true, profile: moi, revision: revision + 1 }
}

/** Chuyển đổi LƯỜI khi mở hồ sơ. Lỗi/thua CAS ⇒ null (nơi gọi dùng hồ sơ như đã đọc; `invest` sẽ đòi hồ sơ đã chuyển). Không ném lỗi. */
export async function chuyenDoiKhiMo(env: Env, sbd: string, p: Profile, revision: number, nowMs: number = Date.now()): Promise<{ profile: Profile; revision: number } | null> {
  try {
    if (p.luatCap === LUAT_CAP_MOI) return null
    const tuNgay = ngayVn(Number.isFinite(Date.parse(p.cutover)) ? Date.parse(p.cutover) : nowMs)
    const lieu = (await docLieuChuyenDoi(env, [sbd], tuNgay)).get(sbd)!
    const r = await doiMotHoSo(env, sbd, p, revision, lieu, nowMs)
    return r.daDoi ? { profile: r.profile, revision: r.revision } : null
  } catch (e) {
    console.error('[hap-thu] chuyển đổi lười lỗi (hồ sơ giữ nguyên, cron sẽ làm):', e instanceof Error ? e.message : e)
    return null
  }
}

export interface KetQuaCronChuyenDoi { soDoc: number; daDoi: number; thuaCas: number; xong: boolean }

/** Cron mỗi phút: chuyển đổi ≤ `toiDa` (40) hồ sơ chưa đổi mỗi lượt cho tới hết (rồi đặt cờ `chuyen_doi_cap` = xong để các phút sau không truy vấn nữa). */
export async function chuyenDoiLoCron(env: Env, nowMs: number, tuyChon: { toiDa?: number } = {}): Promise<KetQuaCronChuyenDoi> {
  const xong = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CHUYEN_DOI_XONG).first<{ gia_tri: string }>().catch(() => null)
  if (String(xong?.gia_tri ?? '') === 'xong') return { soDoc: 0, daDoi: 0, thuaCas: 0, xong: true }
  const toiDa = Math.max(1, Math.floor(tuyChon.toiDa ?? TOI_DA_HO_SO_MOI_TICK))
  const r = await env.DB.prepare(`SELECT sbd, revision, json FROM game_v2_profile WHERE COALESCE(json_extract(json, '$.luatCap'), 0) <> ${LUAT_CAP_MOI} ORDER BY sbd LIMIT ${toiDa}`).all<{ sbd: string; revision: number; json: string }>()
  const dong = r.results ?? []
  if (dong.length === 0) {
    await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
      .bind(KHOA_CHUYEN_DOI_XONG, 'xong', new Date(nowMs).toISOString()).run()
    return { soDoc: 0, daDoi: 0, thuaCas: 0, xong: true }
  }
  const ho = dong.flatMap((x) => { try { return [{ sbd: String(x.sbd), revision: Number(x.revision) || 0, p: JSON.parse(String(x.json)) as Profile }] } catch { return [] } })
  const tuNgay = ho.reduce((m, h) => { const d = ngayVn(Number.isFinite(Date.parse(h.p.cutover)) ? Date.parse(h.p.cutover) : nowMs); return m === '' || d < m ? d : m }, '')
  const lieu = await docLieuChuyenDoi(env, ho.map((h) => h.sbd), tuNgay)
  let daDoi = 0, thuaCas = 0
  for (const h of ho) {
    const k = await doiMotHoSo(env, h.sbd, h.p, h.revision, lieu.get(h.sbd)!, nowMs)
    if (k.daDoi) daDoi++
    else if (k.lyDo === 'thua_cas') thuaCas++
  }
  return { soDoc: dong.length, daDoi, thuaCas, xong: false }
}

export interface HapThuChoEm {
  /** EXP thú còn thiếu để lên cấp = thanh cấp − EXP đã hấp thụ trong cấp; KHÔNG trừ ống nghiệm. 0 ở cấp 120. */
  expConThieu: number
  /** Ống nghiệm: EXP đã kiếm, chưa nạp. */
  ongNghiem: number
  /** Hôm nay thú còn ăn được (trần hôm nay − đã hấp thụ hôm nay). 0 khi chưa học. */
  hapThuConLaiHomNay: number
}

/**
 * Ba con số cho khối `exp` của phản hồi xong-chặng / kế hoạch ngày (Bảng nhiệm vụ nói thật: "còn N EXP nữa lên cấp · ống nghiệm có M · hôm nay thú còn ăn được K").
 * `null` khi em chưa có hồ sơ game, chưa chọn thú, hoặc hồ sơ CHƯA chuyển sang luật cấp mới (không bịa số). Đọc-chỉ, không ném lỗi.
 */
export async function docHapThuChoEm(env: Env, sbd: string, nowMs: number = Date.now()): Promise<HapThuChoEm | null> {
  try {
    const r = await env.DB.prepare('SELECT json FROM game_v2_profile WHERE sbd = ?').bind(sbd).first<{ json: string }>()
    if (!r) return null
    const p = JSON.parse(String(r.json)) as Profile
    if (p.choice || p.luatCap !== LUAT_CAP_MOI) return null
    const ngay = ngayVn(nowMs)
    const t = await docTranHapThu(env, sbd, ngay)
    const da = p.hapThu && p.hapThu.ngay === ngay ? Math.max(0, Math.floor(Number(p.hapThu.da) || 0)) : 0
    const cap = Math.max(1, Math.min(120, Math.round(Number(p.cap) || 1)))
    return { expConThieu: cap >= 120 ? 0 : Math.max(0, thanhExp(cap) - Math.max(0, Math.floor(Number(p.exp) || 0))), ongNghiem: Math.max(0, Math.floor(Number(p.wallet) || 0)), hapThuConLaiHomNay: Math.max(0, t.tran - da) }
  } catch {
    return null
  }
}
