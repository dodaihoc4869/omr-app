// Ba hành trình theo khối. Gộp có bản sao, không sửa sổ học/điểm; chạy lại an toàn.
import type { Env, D1PreparedStatement } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { khoiCuaLop, khoiCuaCau, type Khoi } from '../../src/lib/khoi-cau'
import { laCauTuLuan } from './cam-tu-luan'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { bam } from './srs2-loi'
import { tangCuaCau } from './hanh-trinh-ngay'
import { docCauHinhDem } from './cau-hinh-dem'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_TC } from './lam-lai-so'
import { tachSongSinh } from './loi-hoc-luat'

type Row = Record<string, unknown>
export const KHOA_HANH_TRINH = 'hanh_trinh_3_0910_v1'
export const idHanhTrinh = (k: Khoi) => `hanh-trinh-v3-khoi-${k}`
export const laHanhTrinh = (id: string) => /^hanh-trinh-v3-khoi-(10|11|12)$/.test(id)
const mang = (v: unknown): string[] => { try { const a: unknown = JSON.parse(String(v ?? '[]')); return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [] } catch { return [] } }
export const SQL_BANG_HANH_TRINH = [
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v3_nguon (id TEXT PRIMARY KEY, noi_dung_json TEXT NOT NULL, hop_nhat_luc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v3_chot (id TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v3_ngay (sbd TEXT NOT NULL, ngay TEXT NOT NULL, tang INTEGER NOT NULL, toi_thieu INTEGER NOT NULL, xong_chot INTEGER NOT NULL DEFAULT -1, PRIMARY KEY(sbd,ngay))`,
] as const

/** Câu được duyệt, không tự luận, nguồn khối không mâu thuẫn. Không suy khối từ tên chiến dịch. */
export function khoCauTheoKhoi(rows: readonly Row[]): Map<Khoi, { qids: Set<string>; maDe: Set<string> }> {
  const ra = new Map<Khoi, { qids: Set<string>; maDe: Set<string> }>([10, 11, 12].map(k => [k as Khoi, { qids: new Set(), maDe: new Set() }]))
  for (const r of rows) {
    try {
      const q = JSON.parse(String(r.json)) as PrivateQuestion
      if (!q.reviewed || laCauTuLuan(q)) continue
      const k = khoiCuaCau({ ...q, maDe: String(r.ma_de), qid: String(r.qid), lopTo: r.lop as string | undefined })
      if (!k) continue
      ra.get(k)!.qids.add(String(r.qid)); ra.get(k)!.maDe.add(String(r.ma_de))
    } catch { /* Câu hỏng không phát cho học sinh. */ }
  }
  return ra
}

/** Quét theo khoá chính, mỗi đợt 1000 câu; kho 15 nghìn câu cần khoảng 16 lượt đọc,
 * còn ngân sách cho các việc cron khác trong giới hạn truy vấn D1. Không tải toàn bộ JSON một lần. */
async function docKhoHanhTrinh(env: Env) {
  const theoKhoi = khoCauTheoKhoi([])
  const tang = new Map<Khoi, Record<string, string[]>>([10,11,12].map(k => [k as Khoi,{1:[],2:[],3:[],4:[]}]))
  let maDe = '', qid = ''
  for (;;) {
    const page = await env.DB.prepare(`SELECT g.qid,g.ma_de,g.json,c.lop FROM game_v2_question g
      LEFT JOIN cau_hoi c ON c.qid=g.qid AND c.ma_de=g.ma_de
      WHERE (g.ma_de,g.qid) > (?,?) ORDER BY g.ma_de,g.qid LIMIT 1000`).bind(maDe,qid).all<Row>()
    const rows = page.results ?? []
    if (!rows.length) break
    const ds = khoCauTheoKhoi(rows)
    for (const k of [10,11,12] as const) {
      const kho = theoKhoi.get(k)!, moi = ds.get(k)!
      for (const ma of moi.maDe) kho.maDe.add(ma)
      for (const row of rows) {
        const q = String(row.qid)
        if (!moi.qids.has(q) || kho.qids.has(q)) continue
        kho.qids.add(q)
        const c = JSON.parse(String(row.json)) as PrivateQuestion
        const t = tangCuaCau({qid:q,phan:c.phan,mucDo:c.mucDo ?? null,sao:c.sao ?? undefined,dang:c.dang ?? null})
        if (t) tang.get(k)![t]!.push(q)
      }
    }
    const last = rows.at(-1)!
    maDe = String(last.ma_de); qid = String(last.qid)
  }
  return {theoKhoi,tang}
}

/** Cron tự nhận học sinh/câu mới. Lần đầu đóng các chiến dịch nguồn trong cùng giao dịch có kiểm tra ca mở và CAS.
 * Ca đang mở ⇒ chờ cron kế tiếp; không thay đổi dữ liệu. */
export async function dongBoBaHanhTrinh(env: Env, nowMs: number): Promise<{ trangThai: string; soChienDich?: number }> {
  if (await env.DB.prepare("SELECT 1 FROM ca WHERE trang_thai='mo' LIMIT 1").first()) return { trangThai: 'cho_het_ca' }
  const truoc = await env.DB.prepare('SELECT gia_tri,cap_nhat_luc FROM cau_hinh WHERE khoa=?').bind(KHOA_HANH_TRINH).first<Row>()
  if (truoc && nowMs - Date.parse(String(truoc.cap_nhat_luc)) < 5 * 60_000) return { trangThai: 'da_cap_nhat' }
  await chayDdlMotLan(env, 'hanh_trinh_v3', SQL_BANG_HANH_TRINH)
  const [marker, cd, hs, kho] = await Promise.all([
    env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').bind(KHOA_HANH_TRINH).first<Row>(),
    env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy'").all<Row>(),
    env.DB.prepare('SELECT sbd,lop,ten_lop,trang_thai FROM hoc_sinh').all<Row>(),
    docKhoHanhTrinh(env),
  ])
  const nguon = (cd.results ?? []).filter(r => !laHanhTrinh(String(r.id)))
  const theoKhoi = kho.theoKhoi
  const em = new Map<Khoi, Set<string>>([10, 11, 12].map(k => [k as Khoi, new Set<string>()]))
  const daDangKy = new Set((hs.results ?? []).map(r => String(r.sbd)))
  const daCoEm = new Set<string>()
  for (const r of hs.results ?? []) {
    if (r.trang_thai === 'khoa') { daCoEm.add(String(r.sbd)); continue }
    const k = khoiCuaLop(r.lop) ?? khoiCuaLop(r.ten_lop)
    if (k) { em.get(k)!.add(String(r.sbd)); daCoEm.add(String(r.sbd)) }
  }
  // Chưa có dữ liệu học thực ⇒ giữ các luồng cũ; không bật Game/OMNI trên một kho rỗng.
  if (![...em.values()].some(s => s.size) || ![...theoKhoi.values()].some(q => q.qids.size)) return { trangThai: 'cho_du_lieu' }
  if (nguon.some(r => r.trang_thai === 'dang_chay' && mang(r.sbd_json).some(s => daDangKy.has(s) && !daCoEm.has(s)))) {
    throw new Error('Có học sinh của chiến dịch nguồn chưa xác định được khối; giữ chiến dịch nguồn, chưa gộp.')
  }
  // Tham chiếu cũ không có tài khoản: giữ trong bản sao nguồn/sổ học, không tạo hay giao câu cho tài khoản mới.
  const thieuTaiKhoan = new Set(nguon.filter(r => r.trang_thai === 'dang_chay').flatMap(r => mang(r.sbd_json)).filter(s => !daDangKy.has(s))).size
  const luc = new Date(nowMs).toISOString()
  const lenh: D1PreparedStatement[] = []
  // CHECK làm cả batch rollback nếu ca mở giữa lúc đọc và lúc ghi.
  lenh.push(env.DB.prepare(`INSERT INTO hanh_trinh_v3_chot(id,ok) SELECT ?,CASE WHEN NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo') THEN 1 ELSE 0 END`).bind(crypto.randomUUID()))
  // Nguồn được sao lưu một lần; giữ mốc sớm nhất để lịch sử đã làm không thành câu mới.
  const moc = (cd.results ?? []).map(r => String(r.tao_luc)).filter(Boolean).sort()[0] ?? luc
  for (const k of [10, 11, 12] as const) {
    const id = idHanhTrinh(k), qs = theoKhoi.get(k)!, sbds = em.get(k)!
    lenh.push(env.DB.prepare(`INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,the_luc_ngay,huyet_chien,ma_ca,tao_luc,trang_thai)
      VALUES(?,?,?,?,?,?,'9999-12-31',36,0,NULL,?,'dang_chay')
      ON CONFLICT(id) DO UPDATE SET sbd_json=excluded.sbd_json,ma_de_json=excluded.ma_de_json,qid_json=excluded.qid_json,
        han_nop=excluded.han_nop,the_luc_ngay=excluded.the_luc_ngay,huyet_chien=excluded.huyet_chien
      WHERE chien_dich.trang_thai='dang_chay'`)
      .bind(id, `Hành trình giỏi hoá · Khối ${k}`, `Khối ${k}`, JSON.stringify([...sbds].sort()), JSON.stringify([...qs.maDe].sort()), JSON.stringify([...qs.qids].sort()), moc))
    lenh.push(env.DB.prepare(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri,cap_nhat_luc=excluded.cap_nhat_luc`)
      .bind(`hanh_trinh_v3_kho_${k}`, JSON.stringify(kho.tang.get(k)), luc))
  }
  // Đóng nguồn, không xoá: bảng cũ tiếp tục phục vụ báo cáo và lịch sử.
  const nguonDangChay = nguon.filter(r => r.trang_thai === 'dang_chay')
  if (nguonDangChay.length) {
    const jsonNguon = JSON.stringify(nguonDangChay)
    lenh.push(env.DB.prepare(`INSERT INTO hanh_trinh_v3_chot(id,ok) SELECT ?,CASE WHEN NOT EXISTS(
      SELECT 1 FROM json_each(?) n LEFT JOIN chien_dich c ON c.id=json_extract(n.value,'$.id')
      WHERE c.id IS NULL OR c.trang_thai <> 'dang_chay' OR c.sbd_json IS NOT json_extract(n.value,'$.sbd_json')
      OR c.qid_json IS NOT json_extract(n.value,'$.qid_json') OR c.tao_luc IS NOT json_extract(n.value,'$.tao_luc')
    ) THEN 1 ELSE 0 END`).bind(crypto.randomUUID(),jsonNguon))
    lenh.push(env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v3_nguon(id,noi_dung_json,hop_nhat_luc)
      SELECT json_extract(value,'$.id'),value,? FROM json_each(?)`).bind(luc,jsonNguon))
    lenh.push(env.DB.prepare(`UPDATE chien_dich SET trang_thai='da_dong',dong_luc=?
      WHERE id IN (SELECT json_extract(value,'$.id') FROM json_each(?))`).bind(luc,jsonNguon))
  }
  if (!marker) {
    // Bật OMNI + Game 2 cho ba khối khi chuyển sang hành trình, giữ nguyên mã bảo mật.
    for (const key of ['game_hoa_2', 'omni', KHOA_HANH_TRINH]) lenh.push(env.DB.prepare(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)
      ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri,cap_nhat_luc=excluded.cap_nhat_luc`).bind(key,
        JSON.stringify({ bat: true, phienBan: 1, ...(key === KHOA_HANH_TRINH ? { thamChieuCuKhongCoTaiKhoan: thieuTaiKhoan } : {}) }), luc))
  }
  else lenh.push(env.DB.prepare('UPDATE cau_hinh SET cap_nhat_luc=? WHERE khoa=?').bind(luc, KHOA_HANH_TRINH))
  await env.DB.batch(lenh)
  // Import sau để tránh vòng phụ thuộc srs2-d1 → hành trình → srs2-d1.
  const [{ xoaDemChienDich }, { xoaDemCauHinh }] = await Promise.all([import('./srs2-d1'), import('./cau-hinh-dem')])
  xoaDemChienDich(); xoaDemCauHinh(env)
  return { trangThai: marker ? 'da_dong_bo' : 'vua_hop_nhat', soChienDich: nguon.filter(r => r.trang_thai === 'dang_chay').length }
}

/** Chỉ đọc tối đa 96 ứng viên mỗi tầng/em/ngày, cộng câu đang phục vụ.
 * Kho đầy đủ dùng chung ba khối, đệm 15 s; tránh nạp hàng vạn nội dung ở mỗi lần em mở Sảnh.
 * Chọn cuối cùng vẫn theo trạng thái, tiên quyết tầng và trọng số OMNI.
 */
export async function ungVienHanhTrinh(env: Env, id: string, sbd: string, ngay: string, qidsCu: readonly string[]): Promise<string[]> {
  const k = id.split('-').at(-1)
  const raw = await docCauHinhDem(env, `hanh_trinh_v3_kho_${k}`)
  let tang: Record<string, unknown> = {}
  try { tang = JSON.parse(String(raw ?? '{}')) as Record<string, unknown> } catch { /* Chưa có kho mới: dùng phạm vi cũ có giới hạn. */ }
  const [daChot, daLam] = await Promise.all([
    env.DB.prepare('SELECT dao_json,doan_json FROM srs2_ke_hoach WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>(),
    env.DB.prepare(`SELECT DISTINCT qid,${SQL_TC} AS tc FROM su_kien_hoc WHERE sbd=? AND ngay_vn=? AND ket_qua IS NOT NULL AND nguon='game' AND COALESCE(visibility,'') <> 'embargoed' AND ${SQL_LA_LAN_LAM}`).bind(sbd,ngay).all<Row>(),
  ])
  const da = [...mang(daChot?.dao_json), ...mang(daChot?.doan_json)].map(q => q.replace(/#\d+$/, ''))
  const ds = Object.values(tang).filter((a): a is string[] => Array.isArray(a)).flatMap(a =>
    [...a].sort((x, y) => bam(`${sbd}|${ngay}|${x}`) - bam(`${sbd}|${ngay}|${y}`) || x.localeCompare(y)).slice(0, 96))
  const phamVi = new Set(qidsCu)
  const xong = daLam.results.map(r => String(r.tc || tachSongSinh(String(r.qid)).goc)).filter(q => phamVi.has(q))
  return [...new Set([...da, ...xong, ...(ds.length ? ds : qidsCu.slice(0, 384))])]
}
