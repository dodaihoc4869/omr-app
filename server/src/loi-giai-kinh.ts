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
//   Máy soạn nghi đáp án kho sai ⇒ KHÔNG tự sửa kho; bản VẪN hiện và câu VẪN ở kênh rút (thầy 03/11), cột `nghi` chỉ để đếm.
// ĐỌC (học sinh): `docBanKinh(env, qids)` — chỉ bản `dat`, không nghi, phiên bản hiện hành, băm = băm câu hiện tại. Luật xem (sau nộp / công bố /
// tự làm ở chỗ luyện) do nơi gọi giữ: `answer` (sau nộp), `/hs/loi-giai` (đã có luật), gói `dm` luyện tập (đã niêm phong).
import type { Env } from './kieu'
import { cauHienTai, damBaoBangLoiGiai } from './loi-giai'
import { kiemCong } from './so-do-cong'
import { THAN_CHU } from './kinh-than-chu'
import { bamCau, boCua, cauTrongGoi, dauVao, deHtml, loaiCau, lopCua, type CauKho } from '../../src/lib/loi-giai-kiem'
import { docSoViet } from '../../src/lib/loi-giai-kinh/kiem'
import { laCauTuLuan, laMaDeTuLuan } from '../../src/lib/cau-tu-luan'
import { kiemBanKinh, xepTheoCauPhat } from '../../src/lib/loi-giai-kinh/kiem'
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
  // SOÁT KIẾN THỨC (thầy 03/11): mỗi bản đạt được máy soát đối chiếu bài giảng của thầy đúng dạng bài — giu / sua (đã nộp bản mới) / loi.
  `CREATE TABLE IF NOT EXISTS loi_giai_kinh_soat (bam TEXT PRIMARY KEY, bo TEXT, trang_thai TEXT NOT NULL, ma_luot TEXT, nhan_luc TEXT, ghi TEXT, luc TEXT)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_kinh_soat_tt ON loi_giai_kinh_soat(trang_thai, ma_luot)',
  // CÂU NGOÀI CHỈ MỤC (thầy 03/11 «Câu tự luận giải luôn để lời giải hiện trên máy chiếu lúc dạy học»; câu xà phòng tờ -VD/-DT không hiện lời giải mới):
  // câu tờ dạy học / tự luận KHÔNG vào `loi_giai_cau` (bảng đó nuôi kênh rút tự động + lời giải từng bước — giữ nguyên luật «không rút câu tự luận»).
  // Bảng riêng qid → băm chỉ để Lời giải Kính tìm bản; dang: tn / ds / tln (chấm được, tờ dạy học) · tl (tự luận).
  `CREATE TABLE IF NOT EXISTS loi_giai_kinh_ngoai (qid TEXT PRIMARY KEY, bam TEXT NOT NULL, ma_de TEXT NOT NULL, dang TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_kinh_ngoai_bam ON loi_giai_kinh_ngoai(bam)',
]
let daTaoBang: Promise<void> | null = null
export function damBaoBangKinh(env: Env): Promise<void> {
  if (!daTaoBang) daTaoBang = env.DB.batch(SQL_BANG_KINH.map((q) => env.DB.prepare(q))).then(() => undefined).catch((e) => { daTaoBang = null; throw e })
  return daTaoBang
}

const PHAN_TU_DANG: Record<string, PhanKinh> = { tn: 'I', ds: 'II', tln: 'III', tl: 'III' }

/** Dạng soạn Kính: như `loaiCau` nhưng KHÔNG loại theo mã tờ dạy học (-VD/-DT/-TL) — câu chấm được trong tờ đó vẫn có lời giải; còn lại có đề ⇒ «tl». */
export function dangKinh(c: CauKho): 'tn' | 'ds' | 'tln' | 'tl' | null {
  const d = loaiCau({ ...c, maDe: 'KINH' })
  if (d === 'tn' || d === 'ds' || d === 'tln') return d
  return c.de && c.de.trim() ? 'tl' : null
}
/** Đáp số THAM CHIẾU của câu tự luận: đáp án kho hoặc kết quả lời giải kho nếu là một số (không có ⇒ rỗng — chỉ tính lại phép tính). */
function dapSoThamChieu(c: CauKho): string {
  for (const v of [c.dapAn, c.loiGiai?.ket_qua]) { const t = str(v); if (t && t.length <= 12 && docSoViet(t) !== null) return t }
  return ''
}
/** Đầu vào máy soạn Kính cho MỌI câu có đề: chấm được ⇒ `dauVao` (bỏ luật mã tờ); tự luận ⇒ đề + hình + lời giải kho + đáp số tham chiếu. */
export function dauVaoKinh(c: CauKho, bam: string): (Obj & { dang: string; bo: string }) | null {
  const d = dangKinh(c)
  if (!d) return null
  if (d !== 'tl') { const v = dauVao({ ...c, maDe: 'KINH' }, bam); return v ? { ...(v as unknown as Obj), nguon: c.maDe, dang: d, bo: str((v as unknown as Obj).bo) } : null }
  const lg = c.loiGiai ?? {}
  const o = c.pa ?? c.y ?? null
  return { qid: c.qid, bam, nguon: c.maDe, so: `Câu ${c.so}`, dang: 'tl', tuLuan: true, bo: boCua(c), chuong: c.chuong, mucDo: c.mucDo, de: deHtml(c, false), hinh: c.hinh,
    y: o ? Object.keys(o).sort().map((k) => ({ id: k, t: o[k] })) : [], dapAn: { kq: dapSoThamChieu(c), tl: str(c.dapAn).slice(0, 2000) },
    loiGiaiCo: { chot: lg.chot ?? '', tung: lg.tung_pa ?? lg.tung_y ?? null, buoc: lg.buoc ?? [], ket_qua: lg.ket_qua ?? '', trang_thai: lg.trang_thai ?? '' } }
}

/** Nạp hàng câu NGOÀI chỉ mục lời giải (tờ dạy học -VD/-DT/-TL, câu tự luận) đang dùng: đọc gói từng tờ, ghi bảng qid → băm + hàng việc. Gọi lại được. */
export async function napHangNgoaiKinh(env: Env) {
  await Promise.all([damBaoBangKinh(env), damBaoBangLoiGiai(env)])
  const r = await env.DB.prepare(`SELECT q.qid, q.ma_de FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
    WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid NOT IN (SELECT qid FROM loi_giai_cau) LIMIT 3000`).all<Obj>()
  const theoDe = new Map<string, Set<string>>()
  for (const x of r.results ?? []) { const m = str(x.ma_de); (theoDe.get(m) ?? theoDe.set(m, new Set()).get(m)!).add(str(x.qid)) }
  const nay = new Date().toISOString()
  const dem: Record<string, number> = {}
  let themViec = 0
  for (const [maDe, qids] of theoDe) {
    const o = await env.DE.get(`kho/${maDe}.json`).catch(() => null)
    const goi = o ? await new Response(o.body).json().catch(() => null) : null
    const lenh: ReturnType<Env["DB"]["prepare"]>[] = []
    for (const c of cauTrongGoi(maDe, goi)) {
      if (!qids.has(c.qid)) continue
      const d = dangKinh(c)
      if (!d) { dem.khong_de = (dem.khong_de ?? 0) + 1; continue }
      dem[d] = (dem[d] ?? 0) + 1
      const bam = await bamCau(c)
      lenh.push(env.DB.prepare('INSERT INTO loi_giai_kinh_ngoai (qid, bam, ma_de, dang, cap_nhat_luc) VALUES (?,?,?,?,?) ON CONFLICT(qid) DO UPDATE SET bam = excluded.bam, ma_de = excluded.ma_de, dang = excluded.dang, cap_nhat_luc = excluded.cap_nhat_luc')
        .bind(c.qid, bam, maDe, d, nay))
      lenh.push(env.DB.prepare(`INSERT OR IGNORE INTO loi_giai_kinh_viec (bam, qid, ma_de, bo, lop, phan, uu_tien, trang_thai, so_lan, tao_luc) VALUES (?,?,?,?,?,?,?,'cho',0,?)`)
        .bind(bam, c.qid, maDe, boCua(c), lopCua(maDe), d === 'tl' ? 'TL' : PHAN_TU_DANG[d], 50, nay))
    }
    for (let i = 0; i < lenh.length; i += 80) { const k = await env.DB.batch(lenh.slice(i, i + 80)); k.forEach((x, j) => { if ((i + j) % 2 === 1) themViec += Number(x.meta?.changes ?? 0) }) }
  }
  return { ok: true, dem, themViec }
}

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

/** Đề nạp mới (thầy 03/11): băm câu của MỘT tờ chưa có hàng Kính ⇒ vào hàng chờ (`ghiCauVaoHang` gọi sau khi chỉ mục lời giải ghi xong). Gọi lại được. */
export async function napKinhCuaTo(env: Env, maDe: string) {
  await damBaoBangKinh(env)
  const nay = new Date().toISOString()
  const r = await env.DB.prepare(
    `INSERT OR IGNORE INTO loi_giai_kinh_viec (bam, qid, ma_de, bo, lop, phan, uu_tien, trang_thai, so_lan, tao_luc)
     SELECT q.bam, MIN(q.qid), MIN(q.ma_de), MIN(q.bo), MIN(q.lop), CASE MIN(q.dang) WHEN 'tn' THEN 'I' WHEN 'ds' THEN 'II' WHEN 'tln' THEN 'III' ELSE MIN(q.dang) END, CASE WHEN MIN(q.lop) = '12' THEN 30 ELSE 0 END, 'cho', 0, ?
     FROM loi_giai_cau q WHERE q.ma_de = ? AND q.bam NOT IN (SELECT bam FROM loi_giai_kinh) GROUP BY q.bam`,
  ).bind(nay, maDe).run()
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
    const vao = dauVaoKinh(ht.c, bam)
    if (!vao) { await env.DB.prepare("UPDATE loi_giai_kinh_viec SET trang_thai = 'bo', loi = 'không có đề' WHERE bam = ?").bind(bam).run(); continue }
    viec.push({ ...vao, phan: vao.dang === 'tl' ? 'III' : ht.c.phan, deTho: ht.c.de, ...(ht.c.bang ? { bang: ht.c.bang } : {}), kieuKho: ht.c.kieu ?? '', chuong: ht.c.chuong, soLan: Number(v.so_lan ?? 0),
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
  const vao = dauVaoKinh(ht.c, bam)
  if (!vao) return { ok: false, error: 'Câu không có đề' }
  const tuLuan = vao.dang === 'tl'
  const phan = PHAN_TU_DANG[vao.dang] ?? (ht.c.phan as PhanKinh)
  const nguonB = (b.nguon && typeof b.nguon === 'object' ? b.nguon : {}) as Obj
  const nguon = { thanChu: THAN_CHU.map((t) => t.chu), thayNoi: mangChu(nguonB.thayNoi, 60), meo: mangChu(nguonB.meo, 30) }
  const luaChon = ht.c.pa ?? undefined
  const kiemSo = ({ soDo, buoc, ketQua }: { soDo?: BanKinh['soDo']; buoc: NonNullable<BanKinh['buoc']>; ketQua?: string }) => {
    const k = kiemCong({ qid, phienBan: 1, deNoiGi: '', ...(soDo ? { soDo } : {}), buoc, ...(ketQua ? { ketQua } : {}) }, { phan, dapAn: ht.c.dapAn, ...(luaChon ? { luaChon } : {}) })
    // Lời giải Kính chỉ hiện SAU khi nộp ⇒ «lộ đáp án» của gợi ý trước nộp không áp dụng.
    return { ok: k.ket === 'dat' || k.ket === 'lo_dap_an', ...(k.lyDo ? { lyDo: k.lyDo } : {}) }
  }
  const kq = kiemBanKinh(b.ban, tuLuan ? { phan, dapAn: str((vao.dapAn as Obj | undefined)?.kq), qid, nguon, tuLuan: true } : { phan, dapAn: ht.c.dapAn, qid, nguon, kiemSo })
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
  // Thầy 03/11 «Cho trở lại kênh rút tự động nhé»: câu máy nghi đáp án KHÔNG còn vào diện nghi (không bị loại khỏi kênh rút) — chỉ đếm ở cột `nghi`.
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
  // + câu ngoài chỉ mục (tờ dạy học / tự luận — bảng loi_giai_kinh_ngoai). Cùng luật xem ở nơi gọi (sau nộp · ngoài ca · câu bảo vệ bị bỏ).
  const ds = JSON.stringify(qids.slice(0, 200))
  return env.DB.prepare(
    `SELECT q.qid, k.ban_json FROM loi_giai_cau q JOIN loi_giai_kinh k ON k.bam = q.bam
     WHERE q.qid IN (SELECT value FROM json_each(?)) AND k.cong = 'dat' AND k.phien_ban >= ?
     UNION ALL
     SELECT n.qid, k.ban_json FROM loi_giai_kinh_ngoai n JOIN loi_giai_kinh k ON k.bam = n.bam
     WHERE n.qid IN (SELECT value FROM json_each(?)) AND n.qid NOT IN (SELECT qid FROM loi_giai_cau) AND k.cong = 'dat' AND k.phien_ban >= ?`,
  ).bind(ds, PHIEN_BAN_KINH, ds, PHIEN_BAN_KINH)
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

/** Thầy 03/11 «Cho trở lại kênh rút tự động nhé»: câu máy soạn Kính đã ghi vào diện nghi (`cau_nghi_dap_an`, ghi chú «Lời giải Kính») ⇒ trạng thái
 *  'tra_ve' — mọi kênh rút chỉ bỏ câu 'nghi' nên câu trở lại kênh. Không đụng dòng nghi do nguồn khác ghi (tỉ lệ sai, máy soạn lời giải từng bước). */
export async function traVeKenhKinh(env: Env) {
  const r = await env.DB.prepare(`UPDATE cau_nghi_dap_an SET trang_thai = 'tra_ve', ghi_chu = substr(COALESCE(ghi_chu, '') || ' · thầy cho trở lại kênh 03/11', 1, 600)
    WHERE trang_thai = 'nghi' AND ghi_chu LIKE '%Lời giải Kính%'`).run().catch(() => null)
  return { ok: true, traVe: Number(r?.meta?.changes ?? 0) }
}

// ---------------------------------------------------------------- SOÁT KIẾN THỨC (thầy 03/11)
// «Tôi thấy có câu xác định nhóm trong bảng tuần hoàn ko đưa kiến thức này vào. Bạn soát lại kĩ một lượt xem có phần nào mà chưa giải theo kiến thức thầy
// dạy tương ứng thì thêm vào đủ nhé.» Máy soát nhận lô bản ĐẠT (cùng chương), đọc mục lục bài giảng của thầy, tự tra đủ mục đúng dạng bài; bản thiếu / lệch
// ⇒ soạn lại và nộp qua `/kho/loi-giai-kinh/nop` (máy chủ kiểm lại như mọi bản); rồi ghi kết quả soát ở đây. Bảng CHỈ-THÊM, không đụng dữ liệu học sinh.

/** Nhận một lô bản đạt chưa soát (giữ 45 phút). `uuTien`: danh sách chương soát trước (vd BANG_TUAN_HOAN, NGUYEN_TU). */
export async function soatViecKinh(env: Env, b: Obj) {
  await damBaoBangKinh(env)
  const nay = Date.now()
  const so = Math.min(20, Math.max(1, Number(b.so ?? 10) || 10))
  const han = new Date(nay - PHUT_GIU_VIEC_KINH * 60_000).toISOString()
  const uuTien = mangChu(b.uuTien, 30)
  const chiBo = mangChu(b.chiBo, 30)
  // `coChu`: chỉ soát bản có một trong các cụm chữ (vd «gọi tên», «danh pháp» — thầy 03/11 «đồng bộ với tất cả các bài gọi danh pháp»).
  const coChu = mangChu(b.coChu, 10)
  const locBo = (chiBo.length ? ` AND COALESCE(k.bo, '') IN (SELECT value FROM json_each(?))` : '') + (coChu.length ? ` AND (${coChu.map(() => 'k.ban_json LIKE ?').join(' OR ')})` : '')
  // `soatLaiTruoc` (ISO): soát LẠI cả bản đã «giu» / «sua» trước mốc đó (cảnh mới điện di / độ tan 03/11 cần soạn lại cả bản đã sửa) (luật mới thêm sau khi soát — vd điện di / độ tan 03/11).
  const lai = str(b.soatLaiTruoc).slice(0, 30)
  const conSoat = `k.cong = 'dat' AND (s.bam IS NULL OR (s.trang_thai = 'dang' AND s.nhan_luc < ?) OR (? <> '' AND s.trang_thai IN ('giu', 'sua') AND s.luc < ?))${locBo}`
  const thamLoc = [...(chiBo.length ? [JSON.stringify(chiBo)] : []), ...coChu.map((c) => `%${c}%`)]
  const dau = await env.DB.prepare(
    `SELECT COALESCE(k.bo, '') AS bo FROM loi_giai_kinh k LEFT JOIN loi_giai_kinh_soat s ON s.bam = k.bam WHERE ${conSoat}
     ORDER BY CASE WHEN COALESCE(k.bo, '') IN (SELECT value FROM json_each(?)) THEN 0 ELSE 1 END, k.bo LIMIT 1`,
  ).bind(han, lai, lai, ...thamLoc, JSON.stringify(uuTien)).first<Obj>()
  if (!dau) return { ok: true, het: true, viec: [] }
  const bo = str(dau.bo), maLuot = crypto.randomUUID(), nhanLuc = new Date(nay).toISOString()
  await env.DB.prepare(
    `INSERT INTO loi_giai_kinh_soat (bam, bo, trang_thai, ma_luot, nhan_luc)
     SELECT k.bam, k.bo, 'dang', ?, ? FROM loi_giai_kinh k LEFT JOIN loi_giai_kinh_soat s ON s.bam = k.bam WHERE ${conSoat} AND COALESCE(k.bo, '') = ?
     ORDER BY k.qid_mau LIMIT ?
     ON CONFLICT(bam) DO UPDATE SET trang_thai = 'dang', ma_luot = excluded.ma_luot, nhan_luc = excluded.nhan_luc
       WHERE (loi_giai_kinh_soat.trang_thai = 'dang' AND loi_giai_kinh_soat.nhan_luc < ?) OR (? <> '' AND loi_giai_kinh_soat.trang_thai IN ('giu', 'sua') AND loi_giai_kinh_soat.luc < ?)`,
  ).bind(maLuot, nhanLuc, han, lai, lai, ...thamLoc, bo, so, han, lai, lai).run()
  const nhan = (await env.DB.prepare(
    'SELECT s.bam, k.qid_mau, k.ban_json FROM loi_giai_kinh_soat s JOIN loi_giai_kinh k ON k.bam = s.bam WHERE s.ma_luot = ? ORDER BY k.qid_mau',
  ).bind(maLuot).all<Obj>()).results ?? []
  const boNho = new Map<string, unknown>()
  const viec: Obj[] = []
  for (const x of nhan) {
    const qid = str(x.qid_mau), bam = str(x.bam)
    const ht = await cauHienTai(env, qid, undefined, boNho).catch(() => null)
    const vao = ht && ht.bam === bam ? dauVao(ht.c, bam) : null
    let ban: Obj | null = null
    try { ban = JSON.parse(str(x.ban_json)) as Obj } catch { /* bỏ */ }
    if (!ht || !vao || !ban) {
      await env.DB.prepare("UPDATE loi_giai_kinh_soat SET trang_thai = 'bo', ghi = ?, luc = ? WHERE bam = ?").bind(!ht || ht.bam !== bam ? 'đề đã đổi' : 'không dựng được đầu vào', nhanLuc, bam).run()
      continue
    }
    const { _goc: _bo, ...banHienTai } = ban
    viec.push({ ...vao, phan: ht.c.phan, deTho: ht.c.de, ...(ht.c.bang ? { bang: ht.c.bang } : {}), kieuKho: ht.c.kieu ?? '', chuong: ht.c.chuong, banHienTai })
  }
  if (!viec.length && nhan.length) return soatViecKinh(env, b)
  return { ok: true, het: false, maLuot, bo, viec }
}

/** Ghi kết quả soát một bản: giu (đã đúng bài giảng) · sua (đã nộp bản mới đạt) · loi (soạn lại chưa đạt — bản cũ vẫn hiện). */
export async function soatNopKinh(env: Env, b: Obj) {
  await damBaoBangKinh(env)
  const bam = str(b.bam), ket = str(b.ket)
  if (!bam || !['giu', 'sua', 'loi'].includes(ket)) return { ok: false, error: 'Thiếu bam / ket (giu|sua|loi)' }
  const r = await env.DB.prepare("UPDATE loi_giai_kinh_soat SET trang_thai = ?, ghi = ?, luc = ? WHERE bam = ? AND (ma_luot = ? OR ? = '')")
    .bind(ket, str(b.ghi).slice(0, 600), new Date().toISOString(), bam, str(b.maLuot), str(b.maLuot)).run()
  return { ok: true, ghi: Number(r.meta?.changes ?? 0) }
}

/** Số đếm soát theo chương + vài ghi chú bản đã sửa (chỉ chữ máy soát viết, không chữ câu). */
export async function soatTongKinh(env: Env) {
  await damBaoBangKinh(env)
  const [tong, theoBo, mau] = await Promise.all([
    env.DB.prepare("SELECT (SELECT COUNT(*) FROM loi_giai_kinh WHERE cong = 'dat') AS dat, (SELECT COUNT(*) FROM loi_giai_kinh_soat) AS da_nhan").first<Obj>(),
    env.DB.prepare('SELECT COALESCE(bo, ?) AS bo, trang_thai, COUNT(*) AS n FROM loi_giai_kinh_soat GROUP BY 1, 2 ORDER BY 1').bind('?').all<Obj>(),
    env.DB.prepare("SELECT bo, ghi FROM loi_giai_kinh_soat WHERE trang_thai = 'sua' ORDER BY luc DESC LIMIT 12").all<Obj>(),
  ])
  return { ok: true, tong, theoBo: theoBo.results ?? [], suaGanDay: mau.results ?? [] }
}

/** Vì sao câu kho đang dùng CHƯA vào chỉ mục lời giải (thầy 03/11 «Kho có hơn 15000 câu…»): đọc gói đề của từng câu thiếu, phân loại lý do. Chỉ đọc. */
export async function thieuChiTietKinh(env: Env) {
  const r = await env.DB.prepare(`SELECT q.qid, q.ma_de FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
    WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid NOT IN (SELECT qid FROM loi_giai_cau) LIMIT 1200`).all<Obj>()
  const theoDe = new Map<string, string[]>()
  for (const x of r.results ?? []) { const m = str(x.ma_de); theoDe.set(m, [...(theoDe.get(m) ?? []), str(x.qid)]) }
  const lyDo: Record<string, number> = {}
  const viDu: Record<string, string[]> = {}
  const dem = (k: string, qid: string) => { lyDo[k] = (lyDo[k] ?? 0) + 1; if ((viDu[k] ??= []).length < 6) viDu[k]!.push(qid) }
  for (const [maDe, qids] of theoDe) {
    if (laMaDeTuLuan(maDe)) { for (const q of qids) dem('tờ tự luận', q); continue }
    const o = await env.DE.get(`kho/${maDe}.json`).catch(() => null)
    const goi = o ? await new Response(o.body).json().catch(() => null) : null
    const cau = new Map(cauTrongGoi(maDe, goi).map((c) => [c.qid, c]))
    for (const q of qids) {
      const c = cau.get(q)
      if (!c) { dem(goi ? 'không đọc được câu trong gói (thiếu đề / sai khuôn)' : 'không có gói đề', q); continue }
      if (loaiCau(c)) { dem('đủ điều kiện — chưa nạp (nạp lại tờ)', q); continue }
      const tho = { kieu: c.kieu, phan: c.phan, de: c.de, pa: c.pa ? Object.values(c.pa) : undefined, y: c.y ? Object.values(c.y) : undefined, dap_an: c.dapAn, hinh: c.hinh.map((h) => ({ viTri: h.viTri, src: h.duLieu })) }
      if (laCauTuLuan(tho, c.phan)) dem('câu tự luận', q)
      else if (c.phan === 'I') dem(!c.pa || Object.keys(c.pa).length !== 4 ? 'Phần I không đủ 4 phương án' : 'Phần I thiếu / sai đáp án A–D', q)
      else if (c.phan === 'II') dem(!c.y || Object.keys(c.y).length !== 4 ? 'Phần II không đủ 4 ý' : 'Phần II thiếu / sai đáp án Đ/S', q)
      else dem(!c.dapAn ? 'Phần III thiếu đáp án' : 'Phần III đáp án dài quá 8 kí tự', q)
    }
  }
  return { ok: true, tong: (r.results ?? []).length, lyDo, viDu }
}

/**
 * QUÉT HIỆN (thầy 03/11 «lúc nãy tôi thấy một số câu xà phòng ko hiện lời giải mới, quét lại đi»): với từng câu kho ĐANG DÙNG (chỉ mục game), làm đúng như máy
 * em lúc mở lời giải — tìm bản đạt theo băm hiện tại rồi `xepTheoCauPhat` với phương án / ý / đáp án học sinh nhận — và đếm câu KHÔNG hiện được theo lý do.
 * Chỉ đọc. Theo trang `tu` (mặc định 1500 câu một lần) để không quá giờ CPU.
 */
export async function quetHienKinh(env: Env, b: Obj) {
  const tu = Math.max(0, Number(b.tu ?? 0) || 0), so = Math.min(3000, Math.max(100, Number(b.so ?? 1500) || 1500))
  const loc = str(b.chu) // lọc theo chữ trong đề (vd «xà phòng»), tuỳ chọn
  const r = await env.DB.prepare(
    `SELECT q.qid, q.json, COALESCE(c.bam, n.bam) AS bam, COALESCE(c.bo, n.dang) AS bo, k.ban_json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
       JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
       LEFT JOIN loi_giai_cau c ON c.qid = q.qid
       LEFT JOIN loi_giai_kinh_ngoai n ON n.qid = q.qid
       LEFT JOIN loi_giai_kinh k ON k.bam = COALESCE(c.bam, n.bam) AND k.cong = 'dat' AND k.phien_ban >= ?
     WHERE COALESCE(d.da_xoa, 0) = 0 ${loc ? 'AND q.json LIKE ?' : ''} ORDER BY q.qid LIMIT ? OFFSET ?`,
  ).bind(PHIEN_BAN_KINH, ...(loc ? [`%${loc}%`] : []), so, tu).all<Obj>()
  const dem: Record<string, number> = {}
  const viDu: Record<string, string[]> = {}
  const theoBo: Record<string, number> = {}
  const chiTiet: Obj[] = []
  const tran = b.tatCa === true ? 3000 : 12
  const ghi = (k: string, qid: string, bo: string) => { dem[k] = (dem[k] ?? 0) + 1; if (k !== 'hien') { theoBo[`${bo || '?'}·${k}`] = (theoBo[`${bo || '?'}·${k}`] ?? 0) + 1; if ((viDu[k] ??= []).length < tran) viDu[k]!.push(qid) } }
  for (const x of r.results ?? []) {
    const qid = str(x.qid), bo = str(x.bo)
    let q: Obj
    try { q = JSON.parse(str(x.json)) as Obj } catch { ghi('json_hong', qid, bo); continue }
    const phan = str(q.phan) as PhanKinh
    if (!str(x.bam)) { ghi('chua_chi_muc', qid, bo); continue }
    if (!str(x.ban_json)) { ghi('chua_ban_dat', qid, bo); continue }
    let tho: Obj
    try { tho = JSON.parse(str(x.ban_json)) as Obj } catch { ghi('ban_hong', qid, bo); continue }
    const mang = (v: unknown) => (Array.isArray(v) ? v.map((t) => (t && typeof t === 'object' ? str((t as Obj).text ?? (t as Obj).t) : str(t))) : undefined)
    const choices = mang(q.choices), ideas = mang(q.ideas)
    const correct = Array.isArray(q.correct) ? (q.correct as unknown[]).map(str).join('') : str(q.correct)
    const xep = xepTheoCauPhat(tho, { phan, choices, ideas, correct })
    if (xep) { ghi('hien', qid, bo); continue }
    const khongGoc = xepTheoCauPhat({ ...tho, _goc: undefined }, { phan, choices: undefined, ideas: undefined, correct })
    const lyDo = phan === 'III' ? 'lech_dap_so' : khongGoc ? 'lech_chu_phuong_an' : 'lech_dap_an'
    ghi(lyDo, qid, bo)
    // chiTiet: chữ phương án / ý máy em nhận vs chữ lúc soạn (_goc) — để tìm vì sao không ghép được (chỉ lệnh thầy, sau cổng mã bí mật).
    if (b.chiTiet === true && lyDo !== 'lech_dap_an' && (chiTiet.length < 40)) {
      const g = (tho._goc ?? {}) as { pa?: Record<string, string> | null; y?: Record<string, string> | null }
      chiTiet.push({ qid, phan, nhan: (phan === 'I' ? choices : ideas) ?? [], goc: (phan === 'I' ? g.pa : g.y) ?? null, ketQua: str(tho.ketQua), correct })
    }
  }
  const n = (r.results ?? []).length
  return { ok: true, tu, so: n, tiep: n === so ? tu + so : null, dem, theoBo, viDu, ...(b.chiTiet === true ? { chiTiet } : {}) }
}

/** SOẠN LẠI các câu quét-hiện báo không hiện (lệch chữ phương án / đáp số): đưa băm HIỆN TẠI của câu về hàng chờ. Bản cũ vẫn ở bảng cho tới khi bản mới đạt. */
export async function lamLaiKinh(env: Env, b: Obj) {
  await damBaoBangKinh(env)
  const qids = mangChu(b.qids, 200)
  if (!qids.length) return { ok: false, error: 'Thiếu qids' }
  const r = await env.DB.prepare(
    `UPDATE loi_giai_kinh_viec SET trang_thai = 'cho', so_lan = 0, ma_luot = NULL, loi = ?
     WHERE bam IN (SELECT bam FROM loi_giai_cau WHERE qid IN (SELECT value FROM json_each(?)) UNION SELECT bam FROM loi_giai_kinh_ngoai WHERE qid IN (SELECT value FROM json_each(?)))`,
  ).bind(str(b.lyDo).slice(0, 200) || 'quét hiện: câu không hiện được bản đạt — soạn lại theo câu hiện tại', JSON.stringify(qids), JSON.stringify(qids)).run()
  return { ok: true, veHang: Number(r.meta?.changes ?? 0) }
}
