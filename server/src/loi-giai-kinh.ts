// LỜI GIẢI KÍNH — MÁY CHỦ (thầy chốt bản vẽ 02/11: docs/ban-ve-loi-giai-0211/; «chốt, làm vào app và giải lại toàn bộ kho»,
// «100% phải hiển thị lời giải mới», «khi hết hạn mức thì chuyển sang phiên này giải luôn, liên tục không dừng tới lúc xong»).
// Hợp đồng dữ liệu + bộ kiểm thuần: src/lib/loi-giai-kinh/{kieu,kiem}.ts.
//
// DÂY CHUYỀN (cùng khoá của lời giải từng bước 29/09, không tin máy soạn):
//   /kho/loi-giai-kinh/nap-hang ⇒ hàng CHỈ-THÊM `loi_giai_kinh_viec` (mọi băm trong `loi_giai_cau`, ưu tiên chép từ `loi_giai_viec`: lớp 12, câu em đã sai…)
//   /kho/loi-giai-kinh/viec     ⇒ nhận một lô CÙNG CHƯƠNG (khoá 45 phút) + đầu vào dựng lại TỪ KHO (đề, ý, đáp án, hình, lời giải cũ, sơ đồ đã đạt)
//   /kho/loi-giai-kinh/nop      ⇒ dựng lại câu từ kho, băm phải khớp, `kiemBanKinh` (đủ khối bản mẫu · khớp đáp án kho · tính lại số · thần chú thuộc
//                                  bảng thầy · câu thầy nói thuộc mục kiến thức đã gửi) ⇒ bảng CHỈ-THÊM `loi_giai_kinh` (bản `dat` không bị bản kém ghi đè)
//   /kho/loi-giai-kinh/tong     ⇒ số đếm phủ (đạt / tổng theo phần) — log công khai chỉ in số.
//   Máy soạn nghi đáp án kho sai ⇒ KHÔNG tự sửa kho: câu vào diện nghi (`ghiNghiTuXu`, đã có), bản không hiện, báo thầy bằng số đếm.
// ĐỌC (học sinh): `docBanKinh(env, qids)` — chỉ bản `dat`, không nghi, phiên bản hiện hành, băm = băm câu hiện tại. Luật xem (sau nộp / công bố /
// tự làm ở chỗ luyện) do nơi gọi giữ: `answer` (sau nộp), `/hs/loi-giai` (đã có luật), gói `dm` luyện tập (đã niêm phong).
import type { Env } from './kieu'
import { cauHienTai, damBaoBangLoiGiai } from './loi-giai'
import { ghiNghiTuXu } from './hoc-lieu-may-soan'
import { kiemCong } from './so-do-cong'
import { THAN_CHU } from './kinh-than-chu'
import { dauVao, lopCua } from '../../src/lib/loi-giai-kiem'
import { kiemBanKinh } from '../../src/lib/loi-giai-kinh/kiem'
import { PHIEN_BAN_KINH, type BanKinh, type PhanKinh } from '../../src/lib/loi-giai-kinh/kieu'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()
const mangChu = (v: unknown, tran: number) => (Array.isArray(v) ? v : []).map((x) => str(x).slice(0, 400)).filter(Boolean).slice(0, tran)

export const PHUT_GIU_VIEC_KINH = 45
export const SO_LAN_TOI_DA_KINH = 4

export const SQL_BANG_KINH: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS loi_giai_kinh (bam TEXT PRIMARY KEY, qid_mau TEXT NOT NULL, phan TEXT NOT NULL, bo TEXT, lop TEXT,
    ban_json TEXT NOT NULL, cong TEXT NOT NULL, ly_do TEXT, nghi INTEGER NOT NULL DEFAULT 0, nguon TEXT, phien_ban INTEGER NOT NULL,
    so_lan INTEGER NOT NULL DEFAULT 1, tao_luc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_kinh_cong ON loi_giai_kinh(cong)',
  `CREATE TABLE IF NOT EXISTS loi_giai_kinh_viec (bam TEXT PRIMARY KEY, qid TEXT NOT NULL, ma_de TEXT NOT NULL, bo TEXT, lop TEXT, phan TEXT,
    uu_tien INTEGER NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL, ma_luot TEXT, nhan_luc TEXT, so_lan INTEGER NOT NULL DEFAULT 0, loi TEXT, tao_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_kinh_viec_cho ON loi_giai_kinh_viec(trang_thai, bo, uu_tien)',
]
let daTaoBang: Promise<void> | null = null
export function damBaoBangKinh(env: Env): Promise<void> {
  if (!daTaoBang) daTaoBang = env.DB.batch(SQL_BANG_KINH.map((q) => env.DB.prepare(q))).then(() => undefined).catch((e) => { daTaoBang = null; throw e })
  return daTaoBang
}

const PHAN_TU_DANG: Record<string, PhanKinh> = { tn: 'I', ds: 'II', tln: 'III' }

/** Nạp hàng: mọi băm câu kho chưa có trong hàng (ưu tiên chép từ hàng lời giải từng bước). Gọi lại được (INSERT OR IGNORE). */
export async function napHangKinh(env: Env) {
  await Promise.all([damBaoBangKinh(env), damBaoBangLoiGiai(env)])
  const nay = new Date().toISOString()
  const r = await env.DB.prepare(
    `INSERT OR IGNORE INTO loi_giai_kinh_viec (bam, qid, ma_de, bo, lop, phan, uu_tien, trang_thai, so_lan, tao_luc)
     SELECT q.bam, MIN(q.qid), MIN(q.ma_de), MIN(q.bo), MIN(q.lop), CASE MIN(q.dang) WHEN 'tn' THEN 'I' WHEN 'ds' THEN 'II' WHEN 'tln' THEN 'III' ELSE MIN(q.dang) END, COALESCE(MAX(v.uu_tien), 0) + CASE WHEN MIN(q.lop) = '12' THEN 30 ELSE 0 END, 'cho', 0, ?
     FROM loi_giai_cau q LEFT JOIN loi_giai_viec v ON v.bam = q.bam GROUP BY q.bam`,
  ).bind(nay).run()
  return { ok: true, themMoi: Number(r.meta?.changes ?? 0) }
}

/** Nhận một lô cùng chương. Đầu vào DỰNG LẠI TỪ KHO; kèm bản sơ đồ đã đạt của câu (nếu có) để máy soạn dùng lại phép tính đã kiểm. */
export async function layViecKinh(env: Env, b: Obj) {
  await damBaoBangKinh(env)
  const nay = Date.now()
  const so = Math.min(20, Math.max(1, Number(b.so ?? 12) || 12))
  const han = new Date(nay - PHUT_GIU_VIEC_KINH * 60_000).toISOString()
  await env.DB.prepare("UPDATE loi_giai_kinh_viec SET trang_thai = 'cho', ma_luot = NULL WHERE trang_thai = 'dang' AND nhan_luc < ?").bind(han).run()
  const locBo = str(b.bo) ? ' AND bo = ?' : '', thamBo = str(b.bo) ? [str(b.bo)] : []
  const dau = await env.DB.prepare(`SELECT bo FROM loi_giai_kinh_viec WHERE trang_thai = 'cho'${locBo} ORDER BY uu_tien DESC, qid LIMIT 1`).bind(...thamBo).first<Obj>()
  if (!dau) return { ok: true, het: true, viec: [] }
  const bo = str(dau.bo), maLuot = crypto.randomUUID(), nhanLuc = new Date(nay).toISOString()
  await env.DB.prepare(
    `UPDATE loi_giai_kinh_viec SET trang_thai = 'dang', ma_luot = ?, nhan_luc = ?, so_lan = so_lan + 1
     WHERE bam IN (SELECT bam FROM loi_giai_kinh_viec WHERE trang_thai = 'cho' AND COALESCE(bo, '') = ? ORDER BY uu_tien DESC, qid LIMIT ?)`,
  ).bind(maLuot, nhanLuc, bo, so).run()
  const nhan = (await env.DB.prepare('SELECT * FROM loi_giai_kinh_viec WHERE ma_luot = ? ORDER BY uu_tien DESC, qid').bind(maLuot).all<Obj>()).results ?? []
  const soDoDat = await docSoDoDat(env, nhan.map((v) => str(v.qid)))
  const boNho = new Map<string, unknown>()
  const viec: Obj[] = []
  for (const v of nhan) {
    const qid = str(v.qid), bam = str(v.bam)
    const ht = await cauHienTai(env, qid, str(v.ma_de), boNho).catch(() => null)
    if (!ht || ht.bam !== bam) { await env.DB.prepare("UPDATE loi_giai_kinh_viec SET trang_thai = 'bo', loi = 'đề đã đổi' WHERE bam = ?").bind(bam).run(); continue }
    const vao = dauVao(ht.c, bam)
    if (!vao) { await env.DB.prepare("UPDATE loi_giai_kinh_viec SET trang_thai = 'bo', loi = 'không thuộc dạng soạn (tự luận?)' WHERE bam = ?").bind(bam).run(); continue }
    viec.push({ ...vao, phan: ht.c.phan, deTho: ht.c.de, ...(ht.c.bang ? { bang: ht.c.bang } : {}), kieuKho: ht.c.kieu ?? '', chuong: ht.c.chuong, soLan: Number(v.so_lan ?? 0),
      ...(str(v.loi) ? { loiLanTruoc: str(v.loi) } : {}), ...(soDoDat.get(qid) ? { soDoDaDat: soDoDat.get(qid) } : {}) })
  }
  if (!viec.length && nhan.length) return layViecKinh(env, b)
  return { ok: true, het: false, maLuot, bo, viec }
}

async function docSoDoDat(env: Env, qids: readonly string[]): Promise<Map<string, unknown>> {
  const ra = new Map<string, unknown>()
  if (!qids.length) return ra
  const r = await env.DB.prepare("SELECT qid, ban_json FROM loi_giai_so_do WHERE cong = 'dat' AND qid IN (SELECT value FROM json_each(?))")
    .bind(JSON.stringify(qids)).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  for (const x of r.results ?? []) { try { ra.set(str(x.qid), JSON.parse(str(x.ban_json))) } catch { /* bỏ */ } }
  return ra
}

/** Nộp một bản. Máy chủ dựng lại câu TỪ KHO và tự kiểm; chỉ tin chữ nguồn (mục kiến thức) mà chính máy soạn đã gửi kèm cho câu thầy nói / mẹo,
 *  còn thần chú đối chiếu bảng thần chú nhúng trong máy chủ. */
export async function nopBanKinh(env: Env, b: Obj) {
  await damBaoBangKinh(env)
  const qid = str(b.qid), bam = str(b.bam)
  if (!qid || !bam || !b.ban || typeof b.ban !== 'object') return { ok: false, error: 'Thiếu qid / bam / ban' }
  const ht = await cauHienTai(env, qid)
  if (!ht) return { ok: false, error: 'Không thấy câu trong kho' }
  if (ht.bam !== bam) return { ok: false, error: 'Đề đã đổi sau khi nhận việc (băm lệch)', loi: ['KHOÁ VÂN TAY'] }
  const vao = dauVao(ht.c, bam)
  if (!vao) return { ok: false, error: 'Câu không thuộc dạng soạn lời giải (tự luận?)' }
  const phan = PHAN_TU_DANG[vao.dang] ?? (ht.c.phan as PhanKinh)
  const nguonB = (b.nguon && typeof b.nguon === 'object' ? b.nguon : {}) as Obj
  const nguon = { thanChu: THAN_CHU.map((t) => t.chu), thayNoi: mangChu(nguonB.thayNoi, 60), meo: mangChu(nguonB.meo, 30) }
  const luaChon = ht.c.pa ?? undefined
  const kiemSo = ({ soDo, buoc, ketQua }: { soDo?: BanKinh['soDo']; buoc: NonNullable<BanKinh['buoc']>; ketQua?: string }) => {
    const k = kiemCong({ qid, phienBan: 1, deNoiGi: '', ...(soDo ? { soDo } : {}), buoc, ...(ketQua ? { ketQua } : {}) }, { phan, dapAn: ht.c.dapAn, ...(luaChon ? { luaChon } : {}) })
    // Lời giải Kính chỉ hiện SAU khi nộp ⇒ «lộ đáp án» của gợi ý trước nộp không áp dụng.
    return { ok: k.ket === 'dat' || k.ket === 'lo_dap_an', ...(k.lyDo ? { lyDo: k.lyDo } : {}) }
  }
  const kq = kiemBanKinh(b.ban, { phan, dapAn: ht.c.dapAn, qid, nguon, kiemSo })
  const nghi = str(b.nghiDapAn)
  const nay = new Date().toISOString()
  const ban = kq.ban ?? { qid }
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO loi_giai_kinh (bam, qid_mau, phan, bo, lop, ban_json, cong, ly_do, nghi, nguon, phien_ban, so_lan, tao_luc, cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)
       ON CONFLICT(bam) DO UPDATE SET qid_mau = excluded.qid_mau, phan = excluded.phan, bo = excluded.bo, lop = excluded.lop, ban_json = excluded.ban_json,
         cong = excluded.cong, ly_do = excluded.ly_do, nghi = excluded.nghi, nguon = excluded.nguon, phien_ban = excluded.phien_ban,
         so_lan = loi_giai_kinh.so_lan + 1, cap_nhat_luc = excluded.cap_nhat_luc
       WHERE excluded.cong = 'dat' OR loi_giai_kinh.cong <> 'dat' OR loi_giai_kinh.phien_ban < excluded.phien_ban`,
    ).bind(bam, qid, phan, vao.bo, lopCua(ht.c.maDe), JSON.stringify({ ...ban, _goc: { pa: ht.c.pa ?? null, y: ht.c.y ?? null } }), kq.ket, kq.lyDo.slice(0, 500), nghi ? 1 : 0,
      str(b.nguonMay).slice(0, 20) || 'claude', PHIEN_BAN_KINH, nay, nay),
    env.DB.prepare(
      `UPDATE loi_giai_kinh_viec SET trang_thai = CASE WHEN ? = 'dat' THEN 'xong' WHEN so_lan >= ? THEN 'truot' ELSE 'cho' END, ma_luot = NULL, loi = ? WHERE bam = ?`,
    ).bind(kq.ket, SO_LAN_TOI_DA_KINH, kq.ket === 'dat' ? (nghi ? 'nghi đáp án' : null) : kq.lyDo.slice(0, 500), bam),
  ])
  if (nghi && kq.ket === 'dat') await ghiNghiTuXu(env, bam, qid, `máy soạn Lời giải Kính nghi đáp án kho: ${nghi.slice(0, 300)} — bản ẩn`).catch(() => 0)
  return { ok: true, ket: kq.ket, lyDo: kq.lyDo, boKhoi: kq.boKhoi, ...(nghi ? { nghiDapAn: true } : {}) }
}

/** Số đếm phủ: đạt / tổng theo phần + hàng việc. Chỉ số, không chữ câu. */
export async function tongKinh(env: Env) {
  await damBaoBangKinh(env)
  const [hang, ban] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(phan, ?) AS phan, trang_thai, COUNT(*) AS n FROM loi_giai_kinh_viec GROUP BY 1, 2').bind('?').all<Obj>(),
    env.DB.prepare('SELECT phan, cong, nghi, COUNT(*) AS n FROM loi_giai_kinh WHERE phien_ban >= ? GROUP BY 1, 2, 3').bind(PHIEN_BAN_KINH).all<Obj>(),
  ])
  // ĐỐI CHIẾU PHỦ (thầy 03/11 «Kho có hơn 15000 câu mà sao chỉ phải làm hơn 8000 câu»): câu kho ĐANG DÙNG (chỉ mục game, tờ chưa xoá) so với chỉ mục lời giải.
  const KHO = `FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
    WHERE COALESCE(d.da_xoa, 0) = 0`
  const [kho, thieu, thieuDe, chiMuc] = await Promise.all([
    env.DB.prepare(`SELECT json_extract(q.json,'$.phan') AS phan, COUNT(*) AS n, COUNT(DISTINCT q.content_group) AS nhom ${KHO} GROUP BY 1`).all<Obj>().then((r) => r.results ?? [], () => []),
    env.DB.prepare(`SELECT json_extract(q.json,'$.phan') AS phan, COUNT(*) AS n ${KHO} AND q.qid NOT IN (SELECT qid FROM loi_giai_cau) GROUP BY 1`).all<Obj>().then((r) => r.results ?? [], () => []),
    env.DB.prepare(`SELECT q.ma_de, COUNT(*) AS n ${KHO} AND q.qid NOT IN (SELECT qid FROM loi_giai_cau) GROUP BY 1 ORDER BY 2 DESC LIMIT 15`).all<Obj>().then((r) => r.results ?? [], () => []),
    env.DB.prepare('SELECT COUNT(*) AS qid, COUNT(DISTINCT bam) AS bam FROM loi_giai_cau').first<Obj>().catch(() => null),
  ])
  return { ok: true, phienBan: PHIEN_BAN_KINH, hang: hang.results ?? [], ban: ban.results ?? [], doiChieu: { kho, thieu, thieuDe, chiMuc } }
}

/** BẢN ĐẠT cho danh sách qid (băm hiện tại trong `loi_giai_cau`; phiên bản hiện hành). Câu máy nghi đáp án VẪN hiện (thầy 03/11: «Câu nào nghi đáp án thì lấy luôn lời giải mới nhé ko cần tôi duyệt») — cột `nghi` chỉ còn để đếm. Một câu D1, dùng trong đợt đọc sẵn của nơi gọi. */
export function sqlBanKinhTheoQid(env: Env, qids: readonly string[]) {
  return env.DB.prepare(
    `SELECT q.qid, k.ban_json FROM loi_giai_cau q JOIN loi_giai_kinh k ON k.bam = q.bam
     WHERE q.qid IN (SELECT value FROM json_each(?)) AND k.cong = 'dat' AND k.phien_ban >= ?`,
  ).bind(JSON.stringify(qids.slice(0, 200)), PHIEN_BAN_KINH)
}
/** Dòng ⇒ bản THÔ (còn `_goc` để `xepTheoCauPhat` sắp theo câu đã phát). */
export function banTuDong(rows: readonly Obj[] | undefined): Map<string, Obj> {
  const ra = new Map<string, Obj>()
  for (const x of rows ?? []) { try { ra.set(str(x.qid), { ...(JSON.parse(str(x.ban_json)) as Obj), qid: str(x.qid) }) } catch { /* bỏ */ } }
  return ra
}
export async function docBanKinh(env: Env, qids: readonly string[]): Promise<Map<string, Obj>> {
  if (!qids.length) return new Map()
  const r = await sqlBanKinhTheoQid(env, qids).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  return banTuDong(r.results)
}


/**
 * `/hs/loi-giai-kinh {token, qids}` — TẢI SẴN bản Kính cho các câu em đang có trên máy (chặng vừa mở, câu đã làm) để lời giải hiện TỨC THÌ sau khi em bấm «Kiểm tra».
 * Cùng luật phạm vi với gói đáp án `dm` (dap-an-may.ts, thầy duyệt 31/10): TẮT HẲN khi em đang có ca kiểm tra mở / chặng kiểm tra cá nhân; câu (qid hoặc nhóm
 * nội dung) đang nằm trong ca chưa công bố / còn làm được / bài tập về nhà chấm điểm (`protectedQuestions`) ⇒ bỏ; câu tự luận không bao giờ có bản.
 * Mỗi bản đi dạng «khoá.gói» AES-GCM gắn chặt mã câu (khoá ngày của em) — máy em chỉ mở ra vẽ SAU khi đã có kết quả câu.
 * MỘT ĐỢT D1: xác thực · bản đạt · nhóm nội dung · trạng thái kiểm tra · tập bảo vệ chạy song song.
 */
export async function hsGoiKinh(env: Env, b: Obj) {
  const { gameIdentityHaiBuoc } = await import('./game-v2-auth')
  const { protectedQuestions } = await import('./game-v2-bank')
  const { trangThaiHoiThay } = await import('./hoi-thay-ca-nhan')
  const { TU_CHI_MUC_GAME } = await import('./cau-theo-qid')
  const { qidTraSoDo } = await import('./loi-giai-so-do')
  const { dmChuoi } = await import('./dap-an-may')
  const { sbd, xong } = await gameIdentityHaiBuoc(env, b)
  const vao = [...new Set((Array.isArray(b.qids) ? b.qids : []).map((x) => str(x).slice(0, 200)).filter(Boolean))].slice(0, 80)
  if (!vao.length) { await xong; return { ok: true, ban: {} } }
  const tra = new Map(vao.map((q) => [q, qidTraSoDo(q)]))
  const tatCa = [...new Set([...tra.values()].flat())]
  const nay = Date.now()
  const [, rows, nhomRows, tt, baoVe] = await Promise.all([
    xong,
    sqlBanKinhTheoQid(env, tatCa).all<Obj>().then((r) => r.results ?? [], () => [] as Obj[]),
    env.DB.prepare(`SELECT q.qid, q.content_group AS nhom ${TU_CHI_MUC_GAME}`).bind(JSON.stringify(tatCa)).all<Obj>().then((r) => r.results ?? [], () => null),
    trangThaiHoiThay(env, sbd, vao[0]!, nay).catch(() => null),
    protectedQuestions(env).catch(() => null),
  ])
  // Không kiểm được trạng thái / tập bảo vệ ⇒ đóng (thà chờ máy chủ còn hơn lộ trong ca kiểm tra).
  if (!tt || tt.dangKiemTra || !baoVe || nhomRows === null) return { ok: true, ban: {}, dong: true }
  const nhom = new Map(nhomRows.map((r) => [str(r.qid), str(r.nhom)]))
  const banGoc = banTuDong(rows)
  const ra: Record<string, string> = {}
  await Promise.all(vao.map(async (q) => {
    const ds = tra.get(q) ?? [q]
    if (ds.some((x) => baoVe.has(x) || (nhom.get(x) && baoVe.has(nhom.get(x)!)))) return
    const ban = ds.map((x) => banGoc.get(x)).find(Boolean)
    if (!ban) return
    const dm = await dmChuoi(env, sbd, `kinh|${q}`, JSON.stringify(ban), nay)
    if (dm) ra[q] = dm
  }))
  return { ok: true, ban: ra }
}

/** BÙ `_goc` (chữ phương án / ý lúc soạn) cho bản nộp trước khi đợt 2 lên (03/11) — chỉ sửa bảng Kính của chính máy soạn, theo lô 40, gọi lặp tới `con = 0`. */
export async function buGocKinh(env: Env) {
  await damBaoBangKinh(env)
  const r = await env.DB.prepare(`SELECT bam, qid_mau, ban_json FROM loi_giai_kinh WHERE ban_json NOT LIKE '%"_goc"%' LIMIT 40`).all<Obj>()
  const ds = r.results ?? []
  const boNho = new Map<string, unknown>()
  let daBu = 0
  for (const x of ds) {
    const ht = await cauHienTai(env, str(x.qid_mau), undefined, boNho).catch(() => null)
    let ban: Obj
    try { ban = JSON.parse(str(x.ban_json)) as Obj } catch { continue }
    const goc = ht && ht.bam === str(x.bam) ? { pa: ht.c.pa ?? null, y: ht.c.y ?? null } : { pa: null, y: null }
    await env.DB.prepare('UPDATE loi_giai_kinh SET ban_json = ? WHERE bam = ?').bind(JSON.stringify({ ...ban, _goc: goc }), str(x.bam)).run()
    daBu++
  }
  const con = await env.DB.prepare(`SELECT COUNT(*) AS n FROM loi_giai_kinh WHERE ban_json NOT LIKE '%"_goc"%'`).first<Obj>()
  return { ok: true, daBu, con: Number(con?.n ?? 0) }
}
