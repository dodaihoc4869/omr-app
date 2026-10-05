// TỰ HOÀN THIỆN HẰNG TUẦN — Vòng học khép kín v2, Giai đoạn 5. Chạy đêm thứ Hai (cron 00:01 VN), không ai phải bấm:
//   1. HIỆU CHỈNH LUẬT ĐÓNG LỖI theo tỉ lệ SAI LẠI thực tế: lỗi đã đóng mà lượt kiểm duy trì đầu tiên (≥ mốc 1, mặc định 14 ngày) lại sai.
//      Cửa GĐ3 của đặc tả: ≤ 20%. Cao hơn ⇒ đòi lượt đúng cuối cách lần sai xa hơn (+1 ngày, tối đa 7); rất thấp (< 5%) ⇒ bớt 1 ngày
//      (tối thiểu 2). Cần ≥ 30 lượt kiểm mới chỉnh (ít dữ liệu thì giữ). Tham số lưu ở `cau_hinh` khoá 'v2_tham_so'; nhật ký `v2_hieu_chinh`.
//   2. CÂU NGHI SAI ĐÁP ÁN: em GIỎI (tỉ lệ đúng tự làm 30 ngày thuộc nhóm 30% cao nhất, ≥ 20 lượt) sai một câu bất thường (≥ 5 lượt của em
//      giỏi, ≥ 60% sai) ⇒ ghi `cau_nghi_dap_an` (trạng thái 'nghi'). Rút đề ca thi đọc danh sách này để tạm bỏ câu (`/ca/cau-nghi-dap-an`);
//      thầy (hoặc máy soạn) tính lại rồi chốt qua `/gv/cau-nghi/xu-ly`.
// Chỉ đọc sổ + ghi 3 bảng/khoá riêng (chỉ thêm). Không đổi điểm, không đổi kho.
import type { Env } from './kieu'
import { damBaoBangThamSoEm, thamSoRieng, TY_LE_CHUNG_MAC_DINH } from './ca-nhan-hoa-v2'
import { phatLaiLoi, tachSongSinh, cachNgay, THAM_SO_GOC, TU_NGAY, type LanLamLoi, type ThamSoLuat } from './loi-hoc-luat'
import { MUC_DICH_LUOT } from './omni-kieu'

type Row = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))

const TAO_BANG = [
  `CREATE TABLE IF NOT EXISTS v2_hieu_chinh (tuan TEXT PRIMARY KEY, n_kiem INTEGER NOT NULL, n_sai_lai INTEGER NOT NULL, ty_le REAL, tham_so_cu TEXT, tham_so_moi TEXT, luc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cau_nghi_dap_an (qid TEXT PRIMARY KEY, so_lan INTEGER NOT NULL, so_sai INTEGER NOT NULL, ty_le_sai REAL NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'nghi', ghi_chu TEXT, luc TEXT NOT NULL)`,
]
const daTao = new WeakMap<object, Promise<void>>()
export function damBaoBangTuHoanThien(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(TAO_BANG.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

const KHOA_THAM_SO = 'v2_tham_so'
/** Tham số luật đang dùng (đã kiểm biên). Lỗi đọc / chưa có ⇒ tham số gốc. */
export async function docThamSo(env: Env): Promise<ThamSoLuat> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_THAM_SO).first<Row>().catch(() => null)
  return chuanThamSo(r?.gia_tri)
}
export function chuanThamSo(v: unknown): ThamSoLuat {
  try {
    const o = (typeof v === 'string' ? JSON.parse(v) : v) as Partial<ThamSoLuat> | null
    const cach = Number(o?.cachSaiCuoi)
    const moc = Array.isArray(o?.mocDuyTri) ? o!.mocDuyTri.map(Number).filter((x) => Number.isInteger(x) && x >= 3 && x <= 90) : []
    return {
      cachSaiCuoi: Number.isInteger(cach) && cach >= 2 && cach <= 7 ? cach : THAM_SO_GOC.cachSaiCuoi,
      mocDuyTri: moc.length ? moc : THAM_SO_GOC.mocDuyTri,
      gioDocLoiGiai: THAM_SO_GOC.gioDocLoiGiai,
    }
  } catch {
    return THAM_SO_GOC
  }
}

/** Lượt kiểm duy trì của MỘT (em, câu): sau mỗi lần đóng lỗi, lượt tự làm ĐẦU TIÊN cách ngày đóng ≥ mốc 1 — đúng hay sai. */
export function luotKiemDuyTri(lan: readonly LanLamLoi[], doc: readonly string[], coSS: boolean, ts: ThamSoLuat): { kiem: number; saiLai: number } {
  const ds = [...lan].sort((a, b) => a.luc.localeCompare(b.luc))
  let kiem = 0, saiLai = 0
  for (let i = 0; i < ds.length; i++) {
    const truoc = ds.slice(0, i + 1)
    const kq = phatLaiLoi(truoc, doc, coSS, ds[i]!.ngayVn, ts)
    // Vừa đóng ở lượt i ⇒ tìm lượt kiểm duy trì đầu tiên.
    if (kq.trangThai === 'dong' && kq.dongNgay === ds[i]!.ngayVn && kq.mocDuyTri === 0 && (i === 0 || phatLaiLoi(ds.slice(0, i), doc, coSS, ds[i]!.ngayVn, ts).trangThai !== 'dong')) {
      const sau = ds.slice(i + 1).find((x) => !x.coHoTro && cachNgay(kq.dongNgay, x.ngayVn) >= (ts.mocDuyTri[0] ?? 14))
      if (sau) { kiem++; if (sau.ketQua !== 1) saiLai++ }
    }
  }
  return { kiem, saiLai }
}

/** Quyết định tham số tuần tới từ số đo. */
export function deXuatThamSo(cu: ThamSoLuat, kiem: number, saiLai: number): ThamSoLuat {
  if (kiem < 30) return cu
  const tyLe = saiLai / kiem
  if (tyLe > 0.2) return { ...cu, cachSaiCuoi: Math.min(7, cu.cachSaiCuoi + 1) }
  if (tyLe < 0.05) return { ...cu, cachSaiCuoi: Math.max(2, cu.cachSaiCuoi - 1) }
  return cu
}

/** Đọc sổ từ 29/09 (cột gọn) ⇒ lần làm theo (em, câu gốc). */
async function docSoGon(env: Env): Promise<{ theo: Map<string, LanLamLoi[]>; doc: Map<string, string[]> }> {
  const theo = new Map<string, LanLamLoi[]>(), doc = new Map<string, string[]>()
  const sql = (moi: boolean) => `SELECT sbd, qid, nguon, ket_qua, luc, ngay_vn${moi ? ', assistance, purpose, visibility' : ''} FROM su_kien_hoc WHERE ngay_vn >= ?`
  let rows: Row[]
  try { rows = (await env.DB.prepare(sql(true)).bind(TU_NGAY).all<Row>()).results ?? [] } catch { rows = (await env.DB.prepare(sql(false)).bind(TU_NGAY).all<Row>()).results ?? [] }
  for (const x of rows) {
    // OMNI 3: dòng lướt (purpose 'luot') không phải một lần làm — bỏ như dòng đọc lời giải.
    if (str(x.purpose) === 'xem_loi_giai' || str(x.purpose) === MUC_DICH_LUOT || str(x.visibility) === 'embargoed') continue
    if (x.ket_qua == null && str(x.nguon) !== 'thi') continue
    const t = tachSongSinh(str(x.qid))
    const k = `${str(x.sbd)}|${t.goc}`
    const ls = theo.get(k) ?? []
    ls.push({ luc: str(x.luc), ngayVn: str(x.ngay_vn), ketQua: Number(x.ket_qua) === 1 ? 1 : 0, coHoTro: str(x.assistance) === 'assisted', songSinh: t.songSinh !== null, nguon: str(x.nguon) })
    theo.set(k, ls)
  }
  const r = await env.DB.prepare('SELECT sbd, qid, luc FROM loi_giai_hoi WHERE luc >= ?').bind(`${TU_NGAY}T00:00:00`).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) { const k = `${str(x.sbd)}|${str(x.qid)}`; doc.set(k, [...(doc.get(k) ?? []), str(x.luc)]) }
  return { theo, doc }
}

/** Câu nghi sai đáp án từ các lượt tự làm 30 ngày gần nhất. Hàm thuần (để test). */
export function timCauNghi(theo: ReadonlyMap<string, readonly LanLamLoi[]>, tuNgay: string): { qid: string; soLan: number; soSai: number; tyLeSai: number }[] {
  const emDung = new Map<string, { n: number; d: number }>()
  const theoCau = new Map<string, { sbd: string; dung: boolean }[]>()
  for (const [k, ls] of theo) {
    const [sbd, qid] = [k.slice(0, k.indexOf('|')), k.slice(k.indexOf('|') + 1)]
    for (const x of ls) {
      if (x.coHoTro || x.ngayVn < tuNgay || x.songSinh) continue
      const e = emDung.get(sbd) ?? { n: 0, d: 0 }
      e.n++; if (x.ketQua === 1) e.d++
      emDung.set(sbd, e)
      theoCau.set(qid, [...(theoCau.get(qid) ?? []), { sbd, dung: x.ketQua === 1 }])
    }
  }
  const du = [...emDung.entries()].filter(([, e]) => e.n >= 20).map(([sbd, e]) => ({ sbd, tl: e.d / e.n })).sort((a, b) => b.tl - a.tl)
  const gioi = new Set(du.slice(0, Math.max(1, Math.ceil(du.length * 0.3))).map((x) => x.sbd))
  const ra: { qid: string; soLan: number; soSai: number; tyLeSai: number }[] = []
  for (const [qid, ls] of theoCau) {
    const g = ls.filter((x) => gioi.has(x.sbd))
    if (g.length < 5) continue
    const sai = g.filter((x) => !x.dung).length
    if (sai / g.length >= 0.6) ra.push({ qid, soLan: g.length, soSai: sai, tyLeSai: sai / g.length })
  }
  return ra.sort((a, b) => b.tyLeSai - a.tyLeSai)
}

const tuanCua = (ngay: string) => { const d = new Date(`${ngay}T00:00:00Z`); const thu = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - thu * 86_400_000).toISOString().slice(0, 10) }

/** Chạy hằng tuần (idempotent theo tuần). Trả số đo để ghi log cron. */
export async function chayTuHoanThien(env: Env, nowMs: number): Promise<Record<string, unknown>> {
  await damBaoBangTuHoanThien(env)
  const homNay = new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10)
  const tuan = tuanCua(homNay)
  if (await env.DB.prepare('SELECT 1 AS co FROM v2_hieu_chinh WHERE tuan = ?').bind(tuan).first<Row>()) return { chay: false, lyDo: 'da_chay_tuan_nay', tuan }
  const cu = await docThamSo(env)
  const { theo, doc } = await docSoGon(env)
  let kiem = 0, saiLai = 0
  const theoEm = new Map<string, { kiem: number; saiLai: number }>()
  for (const [k, ls] of theo) {
    const r = luotKiemDuyTri(ls, doc.get(k) ?? [], false, cu); kiem += r.kiem; saiLai += r.saiLai
    const sbd = k.slice(0, k.indexOf('|')), e = theoEm.get(sbd) ?? { kiem: 0, saiLai: 0 }
    e.kiem += r.kiem; e.saiLai += r.saiLai; theoEm.set(sbd, e)
  }
  const moi = deXuatThamSo(cu, kiem, saiLai)
  const nay = new Date(nowMs).toISOString()
  const lenh = [env.DB.prepare('INSERT OR IGNORE INTO v2_hieu_chinh (tuan, n_kiem, n_sai_lai, ty_le, tham_so_cu, tham_so_moi, luc) VALUES (?,?,?,?,?,?,?)')
    .bind(tuan, kiem, saiLai, kiem ? saiLai / kiem : null, JSON.stringify(cu), JSON.stringify(moi), nay)]
  if (JSON.stringify(moi) !== JSON.stringify(cu)) lenh.push(env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc').bind(KHOA_THAM_SO, JSON.stringify(moi), nay))
  const tuNgay = new Date(nowMs + 7 * 3_600_000 - 30 * 86_400_000).toISOString().slice(0, 10)
  const nghi = timCauNghi(theo, tuNgay < TU_NGAY ? TU_NGAY : tuNgay)
  for (const c of nghi) lenh.push(env.DB.prepare(`INSERT INTO cau_nghi_dap_an (qid, so_lan, so_sai, ty_le_sai, trang_thai, luc) VALUES (?,?,?,?, 'nghi', ?)
    ON CONFLICT(qid) DO UPDATE SET so_lan = excluded.so_lan, so_sai = excluded.so_sai, ty_le_sai = excluded.ty_le_sai, luc = excluded.luc
    WHERE cau_nghi_dap_an.trang_thai = 'nghi'`).bind(c.qid, c.soLan, c.soSai, c.tyLeSai, nay))
  // CÁ NHÂN HOÁ (02/10): ngưỡng luật RIÊNG từng em có lượt kiểm duy trì — co về tỉ lệ chung (ca-nhan-hoa-v2.ts `thamSoRieng`).
  await damBaoBangThamSoEm(env)
  const tyLeChung = kiem >= 30 ? saiLai / kiem : TY_LE_CHUNG_MAC_DINH
  let soEm = 0
  for (const [sbd, e] of theoEm) {
    if (e.kiem < 1) continue
    const r = thamSoRieng(e.kiem, e.saiLai, tyLeChung, moi)
    lenh.push(env.DB.prepare(`INSERT INTO v2_tham_so_em (sbd, tham_so_json, ty_le, n_kiem, n_sai_lai, cap_nhat_luc) VALUES (?,?,?,?,?,?)
      ON CONFLICT(sbd) DO UPDATE SET tham_so_json = excluded.tham_so_json, ty_le = excluded.ty_le, n_kiem = excluded.n_kiem, n_sai_lai = excluded.n_sai_lai, cap_nhat_luc = excluded.cap_nhat_luc`)
      .bind(sbd, JSON.stringify(r.ts), r.tyLe, e.kiem, e.saiLai, nay))
    soEm++
  }
  for (let i = 0; i < lenh.length; i += 100) await env.DB.batch(lenh.slice(i, i + 100))
  return { chay: true, tuan, kiem, saiLai, thamSo: moi, cauNghi: nghi.length, emRieng: soEm }
}

/** `/gv/v2/tong` (thầy): tham số đang dùng, 8 tuần hiệu chỉnh gần nhất, câu đang nghi sai đáp án. */
export async function gvTongV2(env: Env): Promise<Record<string, unknown>> {
  await damBaoBangTuHoanThien(env)
  await damBaoBangThamSoEm(env)
  const [ts, hc, ng, em] = await Promise.all([
    docThamSo(env),
    env.DB.prepare('SELECT * FROM v2_hieu_chinh ORDER BY tuan DESC LIMIT 8').all<Row>(),
    env.DB.prepare("SELECT * FROM cau_nghi_dap_an WHERE trang_thai = 'nghi' ORDER BY ty_le_sai DESC LIMIT 100").all<Row>(),
    // Em có ngưỡng riêng, hay quên nhất trước (để thầy biết em nào được kiểm lại sớm hơn).
    env.DB.prepare('SELECT t.sbd, h.ho_ten, t.ty_le, t.n_kiem, t.n_sai_lai, t.tham_so_json FROM v2_tham_so_em t LEFT JOIN hoc_sinh h ON h.sbd = t.sbd ORDER BY t.ty_le DESC LIMIT 30').all<Row>(),
  ])
  const emRieng = (em.results ?? []).map((x) => { let t: Partial<ThamSoLuat> = {}; try { t = JSON.parse(str(x.tham_so_json)) } catch { /* bỏ */ } return { sbd: str(x.sbd), hoTen: str(x.ho_ten), tyLeSaiLai: Number(x.ty_le), soLuotKiem: Number(x.n_kiem), cachSaiCuoi: t.cachSaiCuoi, mocDuyTri: t.mocDuyTri } })
  return { ok: true, thamSo: ts, hieuChinh: hc.results ?? [], cauNghi: ng.results ?? [], emRieng }
}
/** `/ca/cau-nghi-dap-an` (thầy): qid đang nghi ⇒ rút đề ca thi tạm bỏ. */
export async function dsCauNghi(env: Env): Promise<{ ok: true; qid: string[] }> {
  await damBaoBangTuHoanThien(env)
  const r = await env.DB.prepare("SELECT qid FROM cau_nghi_dap_an WHERE trang_thai = 'nghi'").all<Row>().catch(() => ({ results: [] as Row[] }))
  return { ok: true, qid: (r.results ?? []).map((x) => str(x.qid)) }
}
/** `/gv/cau-nghi/xu-ly {qid, trangThai: 'dung_dap_an'|'da_sua', ghiChu}` (thầy) — chốt câu nghi (đáp án đúng ⇒ trả về ca thi; đã sửa kho ⇒ như vậy). */
export async function gvXuLyCauNghi(env: Env, b: Row): Promise<Record<string, unknown>> {
  await damBaoBangTuHoanThien(env)
  const qid = str(b.qid).trim(), tt = str(b.trangThai)
  if (!qid || !['dung_dap_an', 'da_sua'].includes(tt)) return { ok: false, error: 'Thiếu câu hoặc trạng thái không hợp lệ.' }
  const r = await env.DB.prepare('UPDATE cau_nghi_dap_an SET trang_thai = ?, ghi_chu = ? WHERE qid = ?').bind(tt, str(b.ghiChu).slice(0, 500), qid).run()
  return { ok: true, doi: r.meta?.changes ?? 0 }
}
