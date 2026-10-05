// HỌC PHÍ (thầy 05/10): mỗi em nộp cả khoá 4.500.000 đ (2 đợt: 3.000.000 + 1.500.000). Màn Học sinh của thầy có nút Học phí từng em
// (đã nộp · còn thiếu · nhập thêm lần nộp) và bảng tổng ở đầu màn. Em CHƯA có dòng nào ⇒ phải nộp mức chuẩn, đã nộp 0 = "chưa nộp"
// (em mới thêm tự rơi vào đây, không cần ghi gì).
//   · `hoc_phi`      — mức phải nộp RIÊNG khi khác mức chuẩn (miễn giảm, tài khoản trùng = 0) + ghi chú. Không có dòng ⇒ mức chuẩn.
//   · `hoc_phi_nop`  — MỖI LẦN nộp một dòng (sổ thu, chỉ thêm); đã nộp = tổng các dòng. Nhập nhầm thì thầy xoá đúng dòng đó.
// Tiền là số nguyên đồng. Chỉ thầy (mã bí mật) gọi được; học sinh / phụ huynh không có đường đọc. Bảng tự tạo lần đầu dùng (CHỈ THÊM);
// bản SQL: migration-0510-hoc-phi.sql.
import type { D1PreparedStatement, Env } from './kieu'
import { ngayVnCuaMs } from './canh-bao-thay'

export const MUC_HOC_PHI_CHUAN = 4_500_000
/** Trần một khoản (chặn gõ thừa số 0): 50 triệu. */
export const TRAN_TIEN = 50_000_000

type Obj = Record<string, unknown>
const chuoi = (v: unknown) => (v == null ? '' : String(v)).trim()

const TAO_BANG = [
  `CREATE TABLE IF NOT EXISTS hoc_phi (sbd TEXT PRIMARY KEY, phai_nop INTEGER NOT NULL, ghi_chu TEXT, cap_nhat_luc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hoc_phi_nop (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, so_tien INTEGER NOT NULL, ngay_vn TEXT NOT NULL, ghi_chu TEXT, nguon TEXT NOT NULL, luc TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_hoc_phi_nop_sbd ON hoc_phi_nop(sbd)`,
]
const daTao = new WeakMap<object, Promise<void>>()
function damBaoBang(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(TAO_BANG.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

/** Số tiền hợp lệ: số nguyên dương ≤ trần (nhận cả chuỗi "500000"). */
export function docTien(v: unknown, choPhepKhong = false): number | null {
  const n = typeof v === 'number' ? v : /^\d+$/.test(chuoi(v)) ? Number(chuoi(v)) : NaN
  if (!Number.isSafeInteger(n) || n > TRAN_TIEN) return null
  if (n < 0 || (n === 0 && !choPhepKhong)) return null
  return n
}

export interface LanNop { id: string; soTien: number; ngayVn: string; ghiChu: string; nguon: string; luc: string }
export interface HocPhiEm { sbd: string; phaiNop: number; daNop: number; ghiChu: string; soLan: number }

/** Sổ học phí của MỘT em (kèm từng lần nộp, mới nhất trước). */
async function docEm(env: Env, sbd: string): Promise<HocPhiEm & { lanNop: LanNop[] }> {
  const [m, l] = await env.DB.batch([
    env.DB.prepare('SELECT phai_nop, ghi_chu FROM hoc_phi WHERE sbd = ?').bind(sbd),
    env.DB.prepare('SELECT id, so_tien, ngay_vn, ghi_chu, nguon, luc FROM hoc_phi_nop WHERE sbd = ? ORDER BY luc DESC, id DESC').bind(sbd),
  ])
  const muc = (m.results?.[0] ?? null) as Obj | null
  const lanNop = ((l.results ?? []) as Obj[]).map((x) => ({
    id: chuoi(x.id), soTien: Number(x.so_tien) || 0, ngayVn: chuoi(x.ngay_vn), ghiChu: chuoi(x.ghi_chu), nguon: chuoi(x.nguon), luc: chuoi(x.luc),
  }))
  return {
    sbd,
    phaiNop: muc ? Number(muc.phai_nop) : MUC_HOC_PHI_CHUAN,
    daNop: lanNop.reduce((s, x) => s + x.soTien, 0),
    ghiChu: muc ? chuoi(muc.ghi_chu) : '',
    soLan: lanNop.length,
    lanNop,
  }
}

async function coEm(env: Env, sbd: string): Promise<boolean> {
  return !!(await env.DB.prepare('SELECT 1 AS co FROM hoc_sinh WHERE sbd = ?').bind(sbd).first())
}

/** Mọi em CÓ ghi gì về học phí (mức riêng hoặc ít nhất một lần nộp). Em không có trong danh sách này = mức chuẩn, chưa nộp. */
async function danhSach(env: Env) {
  const r = await env.DB.prepare(
    `SELECT s.sbd AS sbd, h.phai_nop AS phai_nop, h.ghi_chu AS ghi_chu, COALESCE(n.da, 0) AS da_nop, COALESCE(n.so, 0) AS so_lan
       FROM (SELECT sbd FROM hoc_phi UNION SELECT sbd FROM hoc_phi_nop) s
       LEFT JOIN hoc_phi h ON h.sbd = s.sbd
       LEFT JOIN (SELECT sbd, SUM(so_tien) AS da, COUNT(*) AS so FROM hoc_phi_nop GROUP BY sbd) n ON n.sbd = s.sbd`,
  ).all<Obj>()
  const items: HocPhiEm[] = (r.results ?? []).map((x) => ({
    sbd: chuoi(x.sbd),
    phaiNop: x.phai_nop == null ? MUC_HOC_PHI_CHUAN : Number(x.phai_nop),
    daNop: Number(x.da_nop) || 0,
    ghiChu: chuoi(x.ghi_chu),
    soLan: Number(x.so_lan) || 0,
  }))
  return { ok: true, mucChuan: MUC_HOC_PHI_CHUAN, items }
}

/** Ghi MỘT lần nộp. Không cho vượt số còn thiếu (chặn gõ nhầm); `id` do máy thầy sinh ⇒ bấm hai lần / gửi lại không ghi đôi. */
async function nop(env: Env, b: Obj, nowMs: number) {
  const sbd = chuoi(b.sbd)
  const soTien = docTien(b.soTien)
  const id = chuoi(b.id)
  const ghiChu = chuoi(b.ghiChu).slice(0, 200)
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh.' }
  if (soTien === null) return { ok: false, error: 'Số tiền phải là số nguyên dương, tối đa 50.000.000 đ.' }
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return { ok: false, error: 'Thiếu mã lần nộp.' }
  if (!(await coEm(env, sbd))) return { ok: false, error: `Không có học sinh SBD ${sbd}.` }
  const daCo = await env.DB.prepare('SELECT sbd FROM hoc_phi_nop WHERE id = ?').bind(id).first<Obj>()
  if (daCo) return chuoi(daCo.sbd) === sbd ? { ok: true, trung: true, em: await docEm(env, sbd) } : { ok: false, error: 'Mã lần nộp đã dùng cho em khác.' }
  // Điều kiện "không vượt số còn thiếu" nằm NGAY trong câu ghi ⇒ hai máy cùng ghi một lúc cũng không vượt.
  const r = await env.DB.prepare(
    `INSERT INTO hoc_phi_nop (id, sbd, so_tien, ngay_vn, ghi_chu, nguon, luc)
     SELECT ?, ?, ?, ?, ?, 'thay', ?
      WHERE COALESCE((SELECT phai_nop FROM hoc_phi WHERE sbd = ?), ?) - COALESCE((SELECT SUM(so_tien) FROM hoc_phi_nop WHERE sbd = ?), 0) >= ?`,
  ).bind(id, sbd, soTien, ngayVnCuaMs(nowMs), ghiChu || null, new Date(nowMs).toISOString(), sbd, MUC_HOC_PHI_CHUAN, sbd, soTien).run()
  const em = await docEm(env, sbd)
  if (!r.meta?.changes) {
    const thieu = Math.max(0, em.phaiNop - em.daNop)
    return { ok: false, em, error: thieu === 0 ? 'Em đã nộp đủ học phí — không nhập thêm được.' : `Số tiền vượt số còn thiếu (${thieu.toLocaleString('vi-VN')} đ). Chưa ghi.` }
  }
  return { ok: true, em }
}

/** Đổi mức phải nộp riêng của một em (miễn giảm, tài khoản trùng = 0). Không được thấp hơn số đã nộp. */
async function suaMuc(env: Env, b: Obj, nowMs: number) {
  const sbd = chuoi(b.sbd)
  const phaiNop = docTien(b.phaiNop, true)
  const ghiChu = chuoi(b.ghiChu).slice(0, 200)
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh.' }
  if (phaiNop === null) return { ok: false, error: 'Mức học phí phải là số nguyên từ 0 tới 50.000.000 đ.' }
  if (!(await coEm(env, sbd))) return { ok: false, error: `Không có học sinh SBD ${sbd}.` }
  const truoc = await docEm(env, sbd)
  if (phaiNop < truoc.daNop) return { ok: false, em: truoc, error: `Em đã nộp ${truoc.daNop.toLocaleString('vi-VN')} đ — mức phải nộp không được thấp hơn.` }
  await env.DB.prepare(
    `INSERT INTO hoc_phi (sbd, phai_nop, ghi_chu, cap_nhat_luc) VALUES (?,?,?,?)
     ON CONFLICT(sbd) DO UPDATE SET phai_nop = excluded.phai_nop, ghi_chu = excluded.ghi_chu, cap_nhat_luc = excluded.cap_nhat_luc`,
  ).bind(sbd, phaiNop, ghiChu || null, new Date(nowMs).toISOString()).run()
  return { ok: true, em: await docEm(env, sbd) }
}

/** Xoá MỘT lần nộp nhập nhầm (thầy bấm, có hỏi lại ở màn). */
async function xoaLan(env: Env, b: Obj) {
  const sbd = chuoi(b.sbd), id = chuoi(b.id)
  if (!sbd || !id) return { ok: false, error: 'Thiếu số báo danh hoặc mã lần nộp.' }
  const r = await env.DB.prepare('DELETE FROM hoc_phi_nop WHERE id = ? AND sbd = ?').bind(id, sbd).run()
  if (!r.meta?.changes) return { ok: false, error: 'Không thấy lần nộp này (có thể đã xoá).', em: await docEm(env, sbd) }
  return { ok: true, em: await docEm(env, sbd) }
}

/**
 * NẠP SỔ CŨ (file Excel của thầy) — một lần, chạy lại vô hại: em đã có dòng mang đúng `nguon` này thì BỎ QUA cả em (không ghi đôi,
 * không đè lần thầy nhập tay). `items[i] = {sbd, phaiNop?, ghiChu?, lan: [{soTien, ghiChu}]}`; SBD không có trong danh sách ⇒ báo, không ghi.
 */
async function napSo(env: Env, b: Obj, nowMs: number) {
  const nguon = chuoi(b.nguon)
  if (!/^excel:[A-Za-z0-9_.-]{1,40}$/.test(nguon)) return { ok: false, error: 'Thiếu nguồn dạng excel:<tên>.' }
  const items = Array.isArray(b.items) ? (b.items as Obj[]) : []
  if (!items.length || items.length > 500) return { ok: false, error: 'Danh sách nạp rỗng hoặc quá 500 em.' }
  // Kiểm toàn bộ TRƯỚC khi ghi: một dòng sai ⇒ không ghi gì.
  const loi: string[] = []
  for (const [i, x] of items.entries()) {
    if (!chuoi(x.sbd)) loi.push(`dòng ${i + 1}: thiếu SBD`)
    if (x.phaiNop != null && docTien(x.phaiNop, true) === null) loi.push(`dòng ${i + 1}: mức sai`)
    const lan = Array.isArray(x.lan) ? (x.lan as Obj[]) : []
    if (lan.some((l) => docTien(l.soTien) === null)) loi.push(`dòng ${i + 1}: số tiền sai`)
    const tong = lan.reduce((s, l) => s + (docTien(l.soTien) ?? 0), 0)
    const muc = x.phaiNop != null ? (docTien(x.phaiNop, true) ?? 0) : MUC_HOC_PHI_CHUAN
    if (tong > muc) loi.push(`dòng ${i + 1}: đã nộp vượt mức`)
  }
  if (loi.length) return { ok: false, error: `Dữ liệu nạp sai: ${loi.slice(0, 10).join('; ')}` }
  const sbds = items.map((x) => chuoi(x.sbd))
  const coTrongDs = new Set(((await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sbds)).all<Obj>()).results ?? []).map((x) => chuoi(x.sbd)))
  const daNap = new Set(((await env.DB.prepare('SELECT DISTINCT sbd FROM hoc_phi_nop WHERE nguon = ? UNION SELECT sbd FROM hoc_phi WHERE ghi_chu LIKE ?').bind(nguon, `%[${nguon}]%`).all<Obj>()).results ?? []).map((x) => chuoi(x.sbd)))
  const luc = new Date(nowMs).toISOString(), ngay = ngayVnCuaMs(nowMs)
  const lenh: D1PreparedStatement[] = []
  const khongCo: string[] = [], boQua: string[] = []
  let soEm = 0, soLan = 0, tongTien = 0
  for (const x of items) {
    const sbd = chuoi(x.sbd)
    if (!coTrongDs.has(sbd)) { khongCo.push(sbd); continue }
    if (daNap.has(sbd)) { boQua.push(sbd); continue }
    soEm++
    if (x.phaiNop != null) {
      lenh.push(env.DB.prepare(
        `INSERT INTO hoc_phi (sbd, phai_nop, ghi_chu, cap_nhat_luc) VALUES (?,?,?,?)
         ON CONFLICT(sbd) DO UPDATE SET phai_nop = excluded.phai_nop, ghi_chu = excluded.ghi_chu, cap_nhat_luc = excluded.cap_nhat_luc`,
      ).bind(sbd, docTien(x.phaiNop, true), `${chuoi(x.ghiChu).slice(0, 180)} [${nguon}]`.trim(), luc))
    }
    for (const [j, l] of ((Array.isArray(x.lan) ? x.lan : []) as Obj[]).entries()) {
      const tien = docTien(l.soTien)!
      soLan++; tongTien += tien
      lenh.push(env.DB.prepare(`INSERT INTO hoc_phi_nop (id, sbd, so_tien, ngay_vn, ghi_chu, nguon, luc) VALUES (?,?,?,?,?,?,?)`)
        .bind(`${nguon}:${sbd}:${j}`, sbd, tien, ngay, chuoi(l.ghiChu).slice(0, 200) || null, nguon, luc))
    }
  }
  for (let i = 0; i < lenh.length; i += 90) await env.DB.batch(lenh.slice(i, i + 90))
  return { ok: true, soEm, soLan, tongTien, khongCo, boQua }
}

export async function gvHocPhi(env: Env, p: string, b: Obj, nowMs = Date.now()): Promise<unknown> {
  await damBaoBang(env)
  if (p === '/gv/hoc-phi/ds') return danhSach(env)
  if (p === '/gv/hoc-phi/em') {
    const sbd = chuoi(b.sbd)
    if (!sbd) return { ok: false, error: 'Thiếu số báo danh.' }
    return { ok: true, em: await docEm(env, sbd) }
  }
  if (p === '/gv/hoc-phi/nop') return nop(env, b, nowMs)
  if (p === '/gv/hoc-phi/muc') return suaMuc(env, b, nowMs)
  if (p === '/gv/hoc-phi/xoa-lan') return xoaLan(env, b)
  if (p === '/gv/hoc-phi/nap') return napSo(env, b, nowMs)
  return { ok: false, error: 'Lệnh học phí không có.' }
}
