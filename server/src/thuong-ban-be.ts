// HỌC CÙNG BẠN — chuỗi đôi kiểu Friend Streak của Duolingo (thầy 26/10: «áp dụng thật tinh tế và dễ hiểu cho học sinh»). Phần B.
// Luật: LUAT-THUONG-PHAT.md «Bổ sung 26/10». Hợp đồng: DAC-TA §4.4 «Học cùng bạn».
//   · Mời tối đa 3 bạn trong trung tâm (tìm theo tên hoặc SBD đúng), bạn phải đồng ý.
//   · Chuỗi đôi +1 khi CẢ HAI cùng xong ≥ 1 bài trong ngày; ngày vắng có phép / bình giữ chuỗi của bạn nào đỡ cho bạn ấy (giữ, không tăng); một bạn lỡ ⇒ về 0.
//     Tính bởi cron 00:10 VN (`cronChuoiDoi`, mỗi cặp một ngày mỗi lượt, CAS theo `ngay_tinh`). Ngày có học + bình + phép: thuong-ngay-hoc.ts (= luật B3).
//     Giới hạn đã biết: cứu chuỗi (học bù hôm sau) cứu chuỗi CÁ NHÂN, không cứu chuỗi đôi (cron chốt ngày lỡ lúc 00:10 hôm sau, trước khi em học bù).
//   · Mốc đôi 7/30/100 ⇒ cả hai +10/30/100 tinh thể, huy hiệu đôi, thông báo `moc_doi` (mỗi cặp mỗi mốc một lần: `moc_da`).
//   · Gõ cửa: 1 lần/ngày/bạn (khoá chính go_cua) ⇒ thông báo `go_cua` cho bạn.
//   · RIÊNG TƯ: chỉ trả tên rút gọn + lớp + «đã học hôm nay chưa» + số chuỗi đôi. KHÔNG điểm, KHÔNG nguyên tử, KHÔNG nhãn, KHÔNG số báo danh của bạn.
//     Mã bạn = mã công khai (rowid hoc_sinh, `maCongKhai`).
//   · Đọc: MỘT batch song song với bước kiểm mật khẩu. Ghi: khoá chống lặp ở mọi lệnh (PK / CAS trạng thái / INSERT OR IGNORE).
import type { D1PreparedStatement, Env } from './kieu'
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { CAN_DANG_NHAP } from './on-lai-nop'
import { ngayVn } from './su-kien-hoc'
import { themNgay } from './ho-so-nam-kt'
import { tenRutGon, SBD_THU_NGHIEM } from './thi-dua-hom-nay'
import {
  SQL_TEN_LOP, cauHuyHieu, cauThongBao, cauTinhThe, docCongTacTuDong, ghiBangPhanA, maCongKhai, num, rowidTuMa, sqlCongTac, str, type Row,
} from './thuong-b-chung'
import {
  SO_NGAY_NHIEU_EM, chuoiCuaEm, cauNhatKyDs, datNgay, gopNhatKy, kieuNgayCua, laNgayDo, sqlSoCau, sqlTuSua, type KieuNgay,
} from './thuong-ngay-hoc'

export const TOI_DA_BAN = 3
export const MOC_DOI: readonly { moc: number; tinhThe: number }[] = [{ moc: 7, tinhThe: 10 }, { moc: 30, tinhThe: 30 }, { moc: 100, tinhThe: 100 }]
export const TIM_TOI_DA = 10
const LOI_TAT = 'Học cùng bạn đang tạm tắt.'

// ═════════════════════════════════ HÀM THUẦN ═════════════════════════════════

export const capDoi = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x])
export type HomNayDoi = 'ca_hai' | 'ban_chua' | 'em_chua' | 'ca_hai_chua'
export const homNayDoi = (emXong: boolean, banXong: boolean): HomNayDoi =>
  emXong && banXong ? 'ca_hai' : emXong ? 'ban_chua' : banXong ? 'em_chua' : 'ca_hai_chua'

/** Một ngày của chuỗi đôi (thuần): cả hai học ⇒ +1; mỗi bạn học hoặc được đỡ ⇒ giữ; còn lại ⇒ 0. */
export function buocChuoiDoi(chuoi: number, a: KieuNgay, b: KieuNgay): number {
  if (a === 'hoc' && b === 'hoc') return chuoi + 1
  if ((a === 'hoc' || laNgayDo(a)) && (b === 'hoc' || laNgayDo(b))) return chuoi
  return 0
}
/** Mốc đôi vừa đạt (thuần): mốc > mocDa và ≤ chuoi. */
export const mocMoiDat = (chuoi: number, mocDa: number) => MOC_DOI.filter((m) => m.moc > mocDa && m.moc <= chuoi)

/** Bỏ dấu + thường hoá để tìm tên tiếng Việt. */
export const boDau = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim()

// ═════════════════════════════════ CHUNG ═════════════════════════════════

async function xacThuc(env: Env, b: Row): Promise<{ sbd: string; xong: Promise<string> } | null> {
  try {
    const r = await gameIdentityHaiBuoc(env, b)
    r.xong.catch(() => {})
    return r
  } catch {
    return null
  }
}
const chan = <T,>(p: Promise<T>): Promise<T> => { p.catch(() => {}); return p }
const kq = (r: { results?: unknown[] }[]): Row[][] => r.map((x) => (x.results ?? []) as Row[])

/** Bạn của em (cả chờ lẫn đã đồng ý), kèm hồ sơ của BẠN. Hai nhánh UNION ALL để mỗi nhánh đi đúng chỉ mục (PK em_a / idx_ban_hoc_b). */
const SQL_CAP_CUA_EM = `SELECT p.em_a AS em_a, p.em_b AS em_b, p.trang_thai AS tt, p.nguoi_moi AS nguoi_moi, p.chuoi_doi AS chuoi_doi, p.moi_luc AS moi_luc,
    h.rowid AS rid, h.sbd AS ban, h.ho_ten AS ho_ten, ${SQL_TEN_LOP('h')} AS lop
  FROM (SELECT * FROM ban_hoc WHERE em_a = ?1 AND trang_thai IN ('cho', 'dong_y')
        UNION ALL SELECT * FROM ban_hoc WHERE em_b = ?1 AND trang_thai IN ('cho', 'dong_y')) p
  JOIN hoc_sinh h ON h.sbd = CASE WHEN p.em_a = ?1 THEN p.em_b ELSE p.em_a END
 WHERE COALESCE(h.trang_thai, '') <> 'khoa'`
/** Em + các bạn đã đồng ý: tập em cho câu đếm ngày học (dùng `?1` = sbd của em). */
const TAP_EM_VA_BAN = `(SELECT ?1 UNION SELECT em_b FROM ban_hoc WHERE em_a = ?1 AND trang_thai = 'dong_y' UNION SELECT em_a FROM ban_hoc WHERE em_b = ?1 AND trang_thai = 'dong_y')`

// ═════════════════════════════════ LỆNH ĐỌC ═════════════════════════════════

/**
 * `POST /hs/ban {token}` (hợp đồng «GET /hs/ban») →
 * `{ok, bat, ban: {ma, ten, lop, chuoiDoi, homNay, daGoCua}[], loiMoi: {ma, ten, lop}[], daMoi: {ma, ten, lop}[]}`. MỘT batch (5 câu, chỉ mục).
 * `chuoiDoi` = số đã chốt tới hôm qua + 1 nếu HÔM NAY cả hai đã xong bài (ngọn lửa đôi tăng ngay khi đủ, như Duolingo).
 */
export async function hsBan(env: Env, b: Row, nowMs: number = Date.now(), envDoc: Env = env): Promise<Row> {
  const xt = await xacThuc(env, b)
  if (!xt) return { ok: false, error: CAN_DANG_NHAP }
  const em = xt.sbd
  const homNay = ngayVn(nowMs)
  const pDoc = chan(envDoc.DB.batch([
    sqlCongTac(envDoc),
    envDoc.DB.prepare(SQL_CAP_CUA_EM).bind(em),
    envDoc.DB.prepare(sqlSoCau(TAP_EM_VA_BAN)).bind(em, homNay, homNay),
    envDoc.DB.prepare(sqlTuSua(TAP_EM_VA_BAN)).bind(em, `${themNgay(homNay, -1)}T00:00:00Z`),
    envDoc.DB.prepare('SELECT toi_em FROM go_cua WHERE ngay = ? AND tu_em = ?').bind(homNay, em),
  ]))
  try { await xt.xong } catch { return { ok: false, error: CAN_DANG_NHAP } }
  try {
    const [rCt, rCap, rSo, rSua, rGo] = kq(await pDoc)
    if (!docCongTacTuDong(rCt).banBe) return { ok: true, bat: false }
    const nk = gopNhatKy(rSo, rSua, [], [])
    const xong = (s: string) => datNgay(nk.get(s), homNay)
    const daGo = new Set((rGo ?? []).map((x) => str(x.toi_em)))
    const ban: Row[] = [], loiMoi: Row[] = [], daMoi: Row[] = []
    for (const x of rCap ?? []) {
      const ma = maCongKhai(x.rid), ten = tenRutGon(x.ho_ten), lop = str(x.lop), sbdBan = str(x.ban)
      if (str(x.tt) === 'dong_y') {
        const h = homNayDoi(xong(em), xong(sbdBan))
        ban.push({ ma, ten, lop, chuoiDoi: num(x.chuoi_doi) + (h === 'ca_hai' ? 1 : 0), homNay: h, daGoCua: daGo.has(sbdBan) })
      } else if (str(x.nguoi_moi) === em) daMoi.push({ ma, ten, lop })
      else loiMoi.push({ ma, ten, lop })
    }
    return { ok: true, bat: true, ban, loiMoi, daMoi, toiDa: TOI_DA_BAN }
  } catch (e) {
    console.error('[ban] /hs/ban lỗi:', e instanceof Error ? e.message : e)
    return { ok: false, error: 'Chưa xem được bạn học cùng. Em thử lại sau nhé.' }
  }
}

/**
 * `POST /hs/ban/tim {token, q}` → `{ok, ketQua: {ma, ten, lop, trangThai: 'ban'|'da_moi'|'moi_em'|null}[]}` (≤ 10).
 * q = SBD (khớp ĐÚNG cả chuỗi) hoặc một phần tên (không phân biệt dấu/hoa thường, ≥ 2 ký tự). Chỉ em đang học (không khoá), không phải chính em / tài khoản thử.
 * MỘT batch: danh sách em (nhỏ, vài trăm dòng) + cặp của em.
 */
export async function hsBanTim(env: Env, b: Row, envDoc: Env = env): Promise<Row> {
  const xt = await xacThuc(env, b)
  if (!xt) return { ok: false, error: CAN_DANG_NHAP }
  const em = xt.sbd
  const q = str(b.q).slice(0, 60)
  const pDoc = chan(envDoc.DB.batch([
    sqlCongTac(envDoc),
    envDoc.DB.prepare(`SELECT h.rowid AS rid, h.sbd AS sbd, h.ho_ten AS ho_ten, ${SQL_TEN_LOP('h')} AS lop FROM hoc_sinh h WHERE COALESCE(h.trang_thai, '') <> 'khoa'`),
    envDoc.DB.prepare(SQL_CAP_CUA_EM).bind(em),
  ]))
  try { await xt.xong } catch { return { ok: false, error: CAN_DANG_NHAP } }
  try {
    const [rCt, rHs, rCap] = kq(await pDoc)
    if (!docCongTacTuDong(rCt).banBe) return { ok: true, bat: false, ketQua: [] }
    const qd = boDau(q)
    if (qd.length < 2) return { ok: true, bat: true, ketQua: [] }
    const trangThai = new Map<string, string>()
    for (const x of rCap ?? []) trangThai.set(str(x.ban), str(x.tt) === 'dong_y' ? 'ban' : str(x.nguoi_moi) === em ? 'da_moi' : 'moi_em')
    const ketQua = (rHs ?? [])
      .filter((x) => { const s = str(x.sbd); return s !== em && s !== SBD_THU_NGHIEM && (s === q || boDau(str(x.ho_ten)).includes(qd)) })
      .sort((a, c) => (str(a.sbd) === q ? -1 : 0) - (str(c.sbd) === q ? -1 : 0) || str(a.ho_ten).localeCompare(str(c.ho_ten), 'vi'))
      .slice(0, TIM_TOI_DA)
      .map((x) => ({ ma: maCongKhai(x.rid), ten: tenRutGon(x.ho_ten), lop: str(x.lop), trangThai: trangThai.get(str(x.sbd)) ?? null }))
    return { ok: true, bat: true, ketQua }
  } catch (e) {
    console.error('[ban] tìm lỗi:', e instanceof Error ? e.message : e)
    return { ok: false, error: 'Chưa tìm được. Em thử lại sau nhé.' }
  }
}

// ═════════════════════════════════ LỆNH GHI ═════════════════════════════════

const SQL_BAN_THEO_MA = `SELECT h.sbd AS sbd, h.ho_ten AS ho_ten, ${SQL_TEN_LOP('h')} AS lop, COALESCE(h.trang_thai, '') AS tt FROM hoc_sinh h WHERE h.rowid = ?`
const SQL_DEM_BAN = `SELECT (SELECT COUNT(*) FROM ban_hoc WHERE em_a = ?1 AND (trang_thai = 'dong_y' OR (trang_thai = 'cho' AND nguoi_moi = ?1)))
  + (SELECT COUNT(*) FROM ban_hoc WHERE em_b = ?1 AND (trang_thai = 'dong_y' OR (trang_thai = 'cho' AND nguoi_moi = ?1))) AS n`
const SQL_DEM_DONG_Y = `SELECT (SELECT COUNT(*) FROM ban_hoc WHERE em_a = ?1 AND trang_thai = 'dong_y') + (SELECT COUNT(*) FROM ban_hoc WHERE em_b = ?1 AND trang_thai = 'dong_y') AS n`

/** Chuẩn bị lệnh ghi: xác thực + công tắc + bạn theo mã + cặp hiện có + số bạn của hai em — MỘT batch đọc. */
async function chuanBiGhi(env: Env, b: Row): Promise<{ loi: Row } | { em: string; ban: Row; cap: Row | null; demEm: number; demBan: number; dongYEm: number; dongYBan: number }> {
  const xt = await xacThuc(env, b)
  if (!xt) return { loi: { ok: false, error: CAN_DANG_NHAP } }
  const em = xt.sbd
  const rowid = rowidTuMa(b.ma)
  const doc = chan(env.DB.batch([
    sqlCongTac(env),
    env.DB.prepare(SQL_BAN_THEO_MA).bind(rowid ?? -1),
    env.DB.prepare(SQL_DEM_BAN).bind(em),
    env.DB.prepare(SQL_DEM_DONG_Y).bind(em),
  ]))
  try { await xt.xong } catch { return { loi: { ok: false, error: CAN_DANG_NHAP } } }
  const [rCt, rBan, rDem, rDy] = kq(await doc)
  if (!docCongTacTuDong(rCt).banBe) return { loi: { ok: false, bat: false, error: LOI_TAT } }
  const ban = rBan?.[0]
  if (!rowid || !ban || str(ban.tt) === 'khoa' || str(ban.sbd) === em || str(ban.sbd) === SBD_THU_NGHIEM) return { loi: { ok: false, error: 'Không tìm thấy bạn này.' } }
  const sbdBan = str(ban.sbd)
  const [a, c] = capDoi(em, sbdBan)
  const [rCap, rDemBan, rDyBan] = kq(await env.DB.batch([
    env.DB.prepare('SELECT * FROM ban_hoc WHERE em_a = ? AND em_b = ?').bind(a, c),
    env.DB.prepare(SQL_DEM_BAN).bind(sbdBan),
    env.DB.prepare(SQL_DEM_DONG_Y).bind(sbdBan),
  ]))
  return { em, ban, cap: rCap?.[0] ?? null, demEm: num(rDem?.[0]?.n), demBan: num(rDemBan?.[0]?.n), dongYEm: num(rDy?.[0]?.n), dongYBan: num(rDyBan?.[0]?.n) }
}

/** `POST /hs/ban/tra-loi {token, ma, dongY}` — trả lời lời mời của bạn `ma`. Chống lặp: chỉ đổi khi cặp đang 'cho' và người mời là bạn. */
export async function hsBanTraLoi(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const c = await chuanBiGhi(env, b)
  if ('loi' in c) return c.loi
  const { em, ban, cap } = c
  const sbdBan = str(ban.sbd)
  const [a, bb] = capDoi(em, sbdBan)
  if (str(cap?.trang_thai) === 'dong_y') return { ok: true, trangThai: 'ban' }
  if (str(cap?.trang_thai) !== 'cho' || str(cap?.nguoi_moi) !== sbdBan) return { ok: false, error: 'Lời mời này không còn nữa.' }
  const luc = new Date(nowMs).toISOString()
  if (b.dongY !== true) {
    await env.DB.prepare("UPDATE ban_hoc SET trang_thai = 'tu_choi', cap_nhat_luc = ? WHERE em_a = ? AND em_b = ? AND trang_thai = 'cho' AND nguoi_moi = ?").bind(luc, a, bb, sbdBan).run()
    return { ok: true, trangThai: null }
  }
  if (c.dongYEm >= TOI_DA_BAN) return { ok: false, error: `Em đã có đủ ${TOI_DA_BAN} bạn học cùng.` }
  if (c.dongYBan >= TOI_DA_BAN) return { ok: false, error: 'Bạn ấy đã đủ bạn học cùng rồi.' }
  const homNay = ngayVn(nowMs)
  // Chuỗi đôi bắt đầu từ HÔM NAY (ngay_tinh = hôm qua). `moc_da` giữ nguyên: thôi rồi kết bạn lại không nhận lại thưởng mốc cũ.
  await env.DB.prepare(
    "UPDATE ban_hoc SET trang_thai = 'dong_y', tu_ngay = ?, chuoi_doi = 0, ngay_tinh = ?, cap_nhat_luc = ? WHERE em_a = ? AND em_b = ? AND trang_thai = 'cho' AND nguoi_moi = ?",
  ).bind(homNay, themNgay(homNay, -1), luc, a, bb, sbdBan).run()
  return { ok: true, trangThai: 'ban' }
}

/** `POST /hs/ban/moi {token, ma}` — mời bạn. Bạn đã mời em trước ⇒ thành bạn luôn. Chống lặp: CAS theo trạng thái cặp. */
export async function hsBanMoi(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const c = await chuanBiGhi(env, b)
  if ('loi' in c) return c.loi
  const { em, ban, cap } = c
  const sbdBan = str(ban.sbd)
  const [a, bb] = capDoi(em, sbdBan)
  const luc = new Date(nowMs).toISOString()
  const tt = str(cap?.trang_thai)
  if (tt === 'dong_y') return { ok: true, trangThai: 'ban' }
  if (tt === 'cho' && str(cap?.nguoi_moi) === em) return { ok: true, trangThai: 'da_moi' }
  if (tt === 'cho') return hsBanTraLoi(env, { ...b, dongY: true }, nowMs) // bạn đã mời em ⇒ đồng ý luôn
  if (c.demEm >= TOI_DA_BAN) return { ok: false, error: `Em đã có đủ ${TOI_DA_BAN} bạn học cùng.` }
  if (c.dongYBan >= TOI_DA_BAN) return { ok: false, error: 'Bạn ấy đã đủ bạn học cùng rồi.' }
  const r = await env.DB.prepare(
    `INSERT INTO ban_hoc (em_a, em_b, trang_thai, nguoi_moi, moi_luc, cap_nhat_luc) VALUES (?1, ?2, 'cho', ?3, ?4, ?4)
     ON CONFLICT(em_a, em_b) DO UPDATE SET trang_thai = 'cho', nguoi_moi = excluded.nguoi_moi, moi_luc = excluded.moi_luc, cap_nhat_luc = excluded.cap_nhat_luc
     WHERE ban_hoc.trang_thai IN ('tu_choi', 'thoi')`,
  ).bind(a, bb, em, luc).run()
  if (num(r.meta?.changes) > 0) {
    const toi = await env.DB.prepare(`SELECT rowid AS rid, ho_ten, ${SQL_TEN_LOP('hoc_sinh')} AS lop FROM hoc_sinh WHERE sbd = ?`).bind(em).first<Row>().catch(() => null)
    await ghiBangPhanA(env, [cauThongBao(env, `moi_ban|${a}|${bb}|${luc}`, sbdBan, 'moi_ban', { ma: maCongKhai(toi?.rid), ten: tenRutGon(toi?.ho_ten), lop: str(toi?.lop) }, luc)], 'moi_ban')
  }
  return { ok: true, trangThai: 'da_moi' }
}

/** `POST /hs/ban/go-cua {token, ma}` — gõ cửa nhắc bạn: 1 lần/ngày/bạn (khoá chính). `moi` = true khi lần gõ này vừa được ghi. */
export async function hsBanGoCua(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const c = await chuanBiGhi(env, b)
  if ('loi' in c) return c.loi
  const { em, ban, cap } = c
  if (str(cap?.trang_thai) !== 'dong_y') return { ok: false, error: 'Hai em chưa học cùng nhau.' }
  const sbdBan = str(ban.sbd)
  const homNay = ngayVn(nowMs)
  const luc = new Date(nowMs).toISOString()
  const r = await env.DB.prepare('INSERT OR IGNORE INTO go_cua (ngay, tu_em, toi_em, luc) VALUES (?, ?, ?, ?)').bind(homNay, em, sbdBan, luc).run()
  const moi = num(r.meta?.changes) > 0
  if (moi) {
    const tu = await env.DB.prepare(`SELECT rowid AS rid, ho_ten, ${SQL_TEN_LOP('hoc_sinh')} AS lop FROM hoc_sinh WHERE sbd = ?`).bind(em).first<Row>().catch(() => null)
    await ghiBangPhanA(env, [cauThongBao(env, `go_cua|${homNay}|${em}|${sbdBan}`, sbdBan, 'go_cua', { ma: maCongKhai(tu?.rid), ten: tenRutGon(tu?.ho_ten), lop: str(tu?.lop) }, luc)], 'go_cua')
  }
  return { ok: true, daGoCua: true, moi }
}

/** `POST /hs/ban/thoi {token, ma}` — thôi học cùng (hoặc rút lời mời). Bạn kia không nhận thông báo nào. */
export async function hsBanThoi(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const c = await chuanBiGhi(env, b)
  if ('loi' in c) return c.loi
  const [a, bb] = capDoi(c.em, str(c.ban.sbd))
  await env.DB.prepare("UPDATE ban_hoc SET trang_thai = 'thoi', cap_nhat_luc = ? WHERE em_a = ? AND em_b = ? AND trang_thai IN ('cho', 'dong_y')").bind(new Date(nowMs).toISOString(), a, bb).run()
  return { ok: true, trangThai: null }
}

// ═════════════════════════════════ CRON CHUỖI ĐÔI ═════════════════════════════════

let xongNgay = ''
export const xoaNhoBanBe = (): void => { xongNgay = '' }
const CAP_MOI_LUOT = 150

/**
 * Cron (nhánh mỗi phút, từ 00:10 giờ VN): mỗi cặp đang học cùng chưa tính tới HÔM QUA ⇒ tính MỘT ngày kế tiếp (lượt sau tính tiếp, tự đuổi kịp khi lỡ cron).
 * Bạn bị khoá / xoá ⇒ cặp kết thúc êm ('thoi'). Ghi: một batch (CAS `ngay_tinh`, tinh thể mốc theo khoá) + thông báo/huy hiệu (bảng phần A).
 * Xong mọi cặp ⇒ nhớ trong isolate tới hết ngày (các phút sau không truy vấn).
 */
export async function cronChuoiDoi(env: Env, nowMs: number = Date.now()): Promise<Row> {
  const g = new Date(nowMs + 7 * 3600_000)
  if (g.getUTCHours() * 60 + g.getUTCMinutes() < 10) return { chay: false, lyDo: 'chua_toi_gio' }
  const homNay = ngayVn(nowMs)
  if (xongNgay === homNay) return { chay: false, lyDo: 'da_xong' }
  const homQua = themNgay(homNay, -1)
  const [rCt, rCap] = kq(await env.DB.batch([
    sqlCongTac(env),
    env.DB.prepare(`SELECT p.em_a AS em_a, p.em_b AS em_b, p.chuoi_doi AS chuoi_doi, p.ngay_tinh AS ngay_tinh, p.tu_ngay AS tu_ngay, p.moc_da AS moc_da,
        (SELECT COUNT(*) FROM hoc_sinh h WHERE h.sbd IN (p.em_a, p.em_b) AND COALESCE(h.trang_thai, '') <> 'khoa') AS con,
        (SELECT ho_ten FROM hoc_sinh WHERE sbd = p.em_a) AS ten_a, (SELECT ho_ten FROM hoc_sinh WHERE sbd = p.em_b) AS ten_b
      FROM ban_hoc p WHERE p.trang_thai = 'dong_y' AND COALESCE(p.ngay_tinh, '') < ?1 LIMIT ${CAP_MOI_LUOT}`).bind(homQua),
  ]))
  if (!docCongTacTuDong(rCt).banBe) { xongNgay = homNay; return { chay: false, lyDo: 'tat' } }
  if (!rCap?.length) { xongNgay = homNay; return { chay: true, soCap: 0 } }
  const luc = new Date(nowMs).toISOString()
  const viec = rCap.map((x) => {
    const tu = str(x.tu_ngay) || homQua
    const nt = str(x.ngay_tinh)
    const ngay = nt && themNgay(nt, 1) > tu ? themNgay(nt, 1) : tu
    return { a: str(x.em_a), b: str(x.em_b), tenA: str(x.ten_a), tenB: str(x.ten_b), chuoi: num(x.chuoi_doi), mocDa: num(x.moc_da), nt, ngay: ngay > homQua ? homQua : ngay, con: num(x.con) }
  })
  const dsEm = [...new Set(viec.flatMap((v) => [v.a, v.b]))]
  // Nhật ký đủ dài để bình giữ chuỗi (tặng mỗi thứ Hai / mua / tự dùng) tính đúng như B3; MỘT batch 4 câu cho mọi em của lượt.
  const [rSo, rSua, rPhep, rMua] = kq(await env.DB.batch(cauNhatKyDs(env, dsEm, themNgay(homNay, -SO_NGAY_NHIEU_EM), homNay)))
  const nhatKy = gopNhatKy(rSo, rSua, rPhep, rMua)
  const chuoiEm = new Map(dsEm.map((e) => [e, chuoiCuaEm(nhatKy.get(e), homNay)] as const))
  const kieu = (e: string, ngay: string): KieuNgay => kieuNgayCua(nhatKy.get(e), ngay, homNay, chuoiEm.get(e))
  // Mỗi cặp một ĐƠN VỊ ghi (CAS + tinh thể mốc) — không bao giờ bị cắt đôi giữa hai batch.
  const donVi: D1PreparedStatement[][] = []
  const phanA: D1PreparedStatement[] = []
  let soMoc = 0
  for (const v of viec) {
    if (v.con < 2) {
      donVi.push([env.DB.prepare("UPDATE ban_hoc SET trang_thai = 'thoi', cap_nhat_luc = ? WHERE em_a = ? AND em_b = ? AND trang_thai = 'dong_y'").bind(luc, v.a, v.b)])
      continue
    }
    const chuoi = buocChuoiDoi(v.chuoi, kieu(v.a, v.ngay), kieu(v.b, v.ngay))
    const moc = mocMoiDat(chuoi, v.mocDa)
    const mocDa = moc.length ? moc[moc.length - 1]!.moc : v.mocDa
    const cau = [env.DB.prepare("UPDATE ban_hoc SET chuoi_doi = ?, ngay_tinh = ?, moc_da = ?, cap_nhat_luc = ? WHERE em_a = ? AND em_b = ? AND trang_thai = 'dong_y' AND COALESCE(ngay_tinh, '') = ?")
      .bind(chuoi, v.ngay, mocDa, luc, v.a, v.b, v.nt)]
    for (const m of moc) {
      soMoc++
      for (const [toi, tenKia] of [[v.a, v.tenB], [v.b, v.tenA]] as const) {
        cau.push(cauTinhThe(env, toi, 'moc_doi', m.tinhThe, `${v.a}|${v.b}|${m.moc}|${toi}`, luc))
        phanA.push(cauHuyHieu(env, toi, `doi_${m.moc}`, v.ngay, luc))
        phanA.push(cauThongBao(env, `moc_doi|${v.a}|${v.b}|${m.moc}|${toi}`, toi, 'moc_doi', { moc: m.moc, tinhThe: m.tinhThe, ban: tenRutGon(tenKia) }, luc))
      }
    }
    donVi.push(cau)
  }
  let lo: D1PreparedStatement[] = []
  for (const d of donVi) {
    if (lo.length + d.length > 90) { await env.DB.batch(lo); lo = [] }
    lo.push(...d)
  }
  if (lo.length) await env.DB.batch(lo)
  await ghiBangPhanA(env, phanA, 'moc_doi')
  return { chay: true, soCap: viec.length, soMoc }
}
