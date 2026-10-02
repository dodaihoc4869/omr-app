// LỜI GIẢI TỪNG BƯỚC — MÁY CHỦ (phương án A, thầy chốt 29/09/2026: duyệt theo đề lúc giao · 4 luồng soạn · khối 12 trước).
// Thiết kế: DE-XUAT-LOI-GIAI-A-2909.md. Lõi thuần (chuẩn hoá câu, băm, bộ kiểm 6 khoá): src/lib/loi-giai-kiem.ts.
//
// DÂY CHUYỀN
//   nạp đề (dayDeKho) ──móc──▶ loi_giai_cau (qid → băm) + loi_giai_viec (hàng việc theo BĂM, gộp câu trùng)
//   máy soạn của thầy ──/kho/loi-giai/viec──▶ nhận một lô CÙNG CHƯƠNG ──/kho/loi-giai/nop──▶ máy chủ KIỂM LẠI với đáp án KHO
//        (không tin máy soạn) ──qua──▶ R2 `giai/<băm>.json` + loi_giai: SẠCH ⇒ 'da_duyet' ngay ("máy duyệt", thầy chốt 29/09);
//        còn cờ đáp án ⇒ 'cho_duyet' (không hiện với học sinh; gom ở /gv/loi-giai/sua-kho để báo thầy)
//   thầy mở đề sắp giao ──/gv/loi-giai/cho-duyet──▶ xem / trả lại từng câu (không bắt buộc) ──▶ 'tra_lai' ⇒ máy soạn lại
//   học sinh ──/hs/loi-giai──▶ chỉ khi ca đã CÔNG BỐ (hoặc em đã tự làm câu ở chỗ luyện) + hồ sơ đã duyệt + băm còn khớp đề hiện tại.
//
// Bảng CHỈ-THÊM, dựng tại chỗ (CI không chạy migration — mẫu bi-a.ts); bản ghi tay: server/migration-2909-loi-giai.sql.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { coCaDangMo } from './bi-a'
import { protectedQuestions } from './game-v2-bank'
import { qidGoc } from './srs2-d1'
import { ghiSuKien, ngayVn, MUC_DICH_XEM_LOI_GIAI } from './su-kien-hoc'
import {
  bamCau, boCua, cauTrongGoi, chuHtml, dauVao, deHtml, gonHoSo, kiemHoSo, laHoSoSach, lopCua, loaiCau, tangCau,
  type CauKho, type DangLoiGiai,
} from '../../src/lib/loi-giai-kiem'
import { BO_CHIA_KHOA } from '../../src/lib/loi-giai-bo'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()

export const SQL_BANG_LOI_GIAI: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS loi_giai (bam TEXT PRIMARY KEY, qid_mau TEXT NOT NULL, dang TEXT NOT NULL, bo TEXT, lop TEXT, tang TEXT, trang_thai TEXT NOT NULL, so_co_dap_an INTEGER NOT NULL DEFAULT 0, co_json TEXT, r2_khoa TEXT NOT NULL, soan_luc TEXT NOT NULL, duyet_luc TEXT, ghi_chu TEXT)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_trang_thai ON loi_giai(trang_thai)',
  `CREATE TABLE IF NOT EXISTS loi_giai_cau (qid TEXT PRIMARY KEY, bam TEXT NOT NULL, ma_de TEXT NOT NULL, dang TEXT NOT NULL, lop TEXT, bo TEXT, cap_nhat_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_cau_bam ON loi_giai_cau(bam)',
  'CREATE INDEX IF NOT EXISTS loi_giai_cau_de ON loi_giai_cau(ma_de)',
  `CREATE TABLE IF NOT EXISTS loi_giai_viec (bam TEXT PRIMARY KEY, qid TEXT NOT NULL, ma_de TEXT NOT NULL, dang TEXT NOT NULL, lop TEXT, bo TEXT, tang TEXT, uu_tien INTEGER NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL, so_lan INTEGER NOT NULL DEFAULT 0, ma_luot TEXT, nhan_luc TEXT, loi TEXT, tao_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS loi_giai_viec_hang ON loi_giai_viec(trang_thai, bo, uu_tien)',
  // Nút "Hỏi thầy" (29/09): mỗi lần em bấm một dòng — màn "Học sinh hỏi" của thầy và luật chấm luyện tập đọc được em đã xem lời giải câu nào.
  `CREATE TABLE IF NOT EXISTS loi_giai_hoi (sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT, luc TEXT NOT NULL, co_ho_so INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (sbd, qid, luc))`,
  'CREATE INDEX IF NOT EXISTS loi_giai_hoi_qid ON loi_giai_hoi(qid)',
  // GĐ1 v2 (02/10): mỗi lần em ĐÓNG khung lời giải một dòng — đọc bao lâu, làm bao nhiêu thao tác, đúng bao nhiêu (cửa "đã nỗ lực thật").
  `CREATE TABLE IF NOT EXISTS doc_loi_giai (id INTEGER PRIMARY KEY AUTOINCREMENT, sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT, luc TEXT NOT NULL, ngay_vn TEXT NOT NULL, giay INTEGER NOT NULL DEFAULT 0, so_su_kien INTEGER NOT NULL DEFAULT 0, tom_tat_json TEXT, su_kien_json TEXT)`,
  'CREATE INDEX IF NOT EXISTS doc_loi_giai_sbd_qid ON doc_loi_giai(sbd, qid)',
]
const bangDaDung = new WeakMap<object, Promise<void>>()
export function damBaoBangLoiGiai(env: Env): Promise<void> {
  const db = env.DB as unknown as object
  let p = bangDaDung.get(db)
  if (!p) {
    p = env.DB.batch(SQL_BANG_LOI_GIAI.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => bangDaDung.delete(db))
    bangDaDung.set(db, p)
  }
  return p
}

/**
 * HỒ SƠ HỌC SINH ĐƯỢC XEM: thầy đã duyệt, HOẶC hồ sơ SẠCH đang chờ duyệt (qua đủ bộ kiểm máy chủ, máy đã tự chốt, không còn cờ đáp án).
 * Thầy giao máy tự chốt (29/09) và muốn "Hỏi thầy" hiện lời giải ngay ⇒ không bắt em đợi thầy duyệt từng đề. Cờ "đáp án kho sai" không bao giờ lộ ra.
 */
const SQL_XEM_DUOC = (l = 'l') => `(${l}.trang_thai = 'da_duyet' OR (${l}.trang_thai = 'cho_duyet' AND ${l}.so_co_dap_an = 0))`

/**
 * MÁY TỰ DUYỆT (thầy chốt 29/09: "Giữ hiện luôn, máy duyệt luôn. Tôi không làm gì cả."): hồ sơ qua đủ 6 khoá + không còn cờ đáp án
 * (cờ đã chuyển daChot / loiDe / hienThi vẫn là sạch) ⇒ 'da_duyet' lúc nộp, ghi chú bắt đầu bằng dấu này. Ghi chú trả lại cũ của thầy
 * (nếu có) được giữ sau dấu " · ", không mất.
 */
export const GHI_CHU_MAY_DUYET = 'máy duyệt'
const SQL_GHI_CHU_MAY_DUYET = (cot = 'ghi_chu') =>
  `CASE WHEN ${cot} IS NULL OR ${cot} = '' OR ${cot} LIKE '${GHI_CHU_MAY_DUYET}%' THEN '${GHI_CHU_MAY_DUYET}' ELSE '${GHI_CHU_MAY_DUYET} · ' || ${cot} END`
const SQL_HO_SO_SACH_CHO = "trang_thai = 'cho_duyet' AND so_co_dap_an = 0"

/** Số lần máy soạn được thử một câu trước khi câu bị đẩy sang "trượt" để thầy xem. */
const SO_LAN_TOI_DA = 3
/** Máy soạn nhận việc mà quá chừng này phút không nộp ⇒ việc trả lại hàng (máy tắt giữa chừng). */
const PHUT_GIU_VIEC = 45

/** Ưu tiên trong hàng (mục 5.6 bản đề xuất): khối 12 trước; sâu > đủ > gọn; câu đáng chữa nhiều sao lên trước. Đề thầy sắp giao được cộng thêm ở `gvSoanGap`. */
export function uuTienCau(c: CauKho, dang: DangLoiGiai): number {
  const tang = tangCau(c, dang)
  return (lopCua(c.maDe) === '12' ? 1000 : 0) + (tang === 'sau' ? 30 : tang === 'du' ? 20 : 10) + Math.min(3, c.sao) * 50 + (c.mucDo === 'van_dung' ? 5 : 0)
}

// ---------------------------------------------------------------- móc nạp đề

/**
 * GHI CÂU CỦA MỘT GÓI ĐỀ VÀO HÀNG LỜI GIẢI. Gọi từ `dayDeKho` (mọi đường nạp đề đi qua đó) và từ `/kho/loi-giai/nap-hang` (lấp kho cũ).
 * Câu mới hoặc đổi nội dung (băm mới, chưa có hồ sơ) ⇒ vào hàng; câu trùng đề khác ⇒ dùng chung hồ sơ, không soạn lại.
 */
export async function ghiCauVaoHang(env: Env, maDe: string, goi: unknown): Promise<{ soCau: number; vaoHang: number }> {
  await damBaoBangLoiGiai(env)
  const nay = new Date().toISOString()
  const lenh = [env.DB.prepare('DELETE FROM loi_giai_cau WHERE ma_de = ?').bind(maDe)]
  const laViec = [false]
  let soCau = 0
  const bamDaCo = new Set<string>()
  for (const c of cauTrongGoi(maDe, goi)) {
    const dang = loaiCau(c)
    if (!dang) continue
    const bam = await bamCau(c)
    soCau++
    const lop = lopCua(maDe), bo = boCua(c)
    lenh.push(env.DB.prepare(
      `INSERT INTO loi_giai_cau (qid, bam, ma_de, dang, lop, bo, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(qid) DO UPDATE SET bam=excluded.bam, ma_de=excluded.ma_de, dang=excluded.dang, lop=excluded.lop, bo=excluded.bo, cap_nhat_luc=excluded.cap_nhat_luc`,
    ).bind(c.qid, bam, maDe, dang, lop, bo, nay))
    laViec.push(false)
    if (bamDaCo.has(bam)) continue
    bamDaCo.add(bam)
    lenh.push(env.DB.prepare(
      `INSERT INTO loi_giai_viec (bam, qid, ma_de, dang, lop, bo, tang, uu_tien, trang_thai, so_lan, tao_luc)
       SELECT ?,?,?,?,?,?,?,?,'cho',0,? WHERE NOT EXISTS (SELECT 1 FROM loi_giai WHERE bam = ?)
       ON CONFLICT(bam) DO NOTHING`,
    ).bind(bam, c.qid, maDe, dang, lop, bo, tangCau(c, dang), uuTienCau(c, dang), nay, bam))
    laViec.push(true)
  }
  let vaoHang = 0
  for (let i = 0; i < lenh.length; i += 100) {
    const kq = await env.DB.batch(lenh.slice(i, i + 100))
    kq.forEach((r, j) => { if (laViec[i + j]) vaoHang += r.meta?.changes ?? 0 })
  }
  return { soCau, vaoHang }
}

// ---------------------------------------------------------------- đọc câu hiện tại từ kho

async function docGoi(env: Env, maDe: string): Promise<unknown | null> {
  const o = await env.DE.get(`kho/${maDe}.json`)
  return o ? await new Response(o.body).json() : null
}
/** Câu HIỆN TẠI trong kho theo qid (đọc gói R2 của đề ghi trong loi_giai_cau), kèm băm tính lại ngay. */
async function cauHienTai(env: Env, qid: string, maDeGoiY?: string, boNho?: Map<string, unknown>): Promise<{ c: CauKho; bam: string } | null> {
  const maDe = maDeGoiY || str((await env.DB.prepare('SELECT ma_de FROM loi_giai_cau WHERE qid = ?').bind(qid).first<Obj>())?.ma_de)
    || (/^(.+)-(?:III|II|I)-\d+$/.exec(qid)?.[1] ?? '')
  if (!maDe) return null
  let goi = boNho?.get(maDe)
  if (goi === undefined) { goi = await docGoi(env, maDe); boNho?.set(maDe, goi) }
  const c = cauTrongGoi(maDe, goi).find((x) => x.qid === qid)
  return c ? { c, bam: await bamCau(c) } : null
}

/** Câu để KHUNG hiển thị: đề (HTML đã thoát, có bảng + hình), chữ từng ý / phương án. Không kèm đáp án — đáp án nằm trong hồ sơ. */
function cauChoKhung(c: CauKho) {
  const o = c.pa ?? c.y ?? {}
  return { qid: c.qid, so: `Câu ${c.so}`, nguon: c.maDe, chuong: c.chuong, de: deHtml(c), y: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, chuHtml(v)])) }
}

async function docHoSo(env: Env, bam: string): Promise<Obj | null> {
  const o = await env.DE.get(`giai/${bam}.json`)
  return o ? ((await new Response(o.body).json()) as Obj) : null
}

// ---------------------------------------------------------------- máy soạn (thầy)

/** LẤP KHO CŨ: quét gói R2 của `so` đề kể từ `tu` (theo mã đề) vào hàng. Máy soạn gọi lặp tới khi `tiep` = null. */
export async function napHangTuKho(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const tu = Math.max(0, Number(b.tu ?? 0) || 0)
  const so = Math.min(20, Math.max(1, Number(b.so ?? 8) || 8))
  const lop = str(b.lop)
  const r = await env.DB.prepare(
    `SELECT ma_de FROM de_kho WHERE da_xoa = 0 AND r2_khoa IS NOT NULL ${lop ? "AND (lop = ? OR ma_de LIKE ? OR ma_de LIKE ?)" : ''} ORDER BY ma_de LIMIT ? OFFSET ?`,
  ).bind(...(lop ? [lop, `${lop}-%`, `DB-${lop}-%`] : []), so, tu).all<Obj>()
  const ds = (r.results ?? []).map((x) => str(x.ma_de))
  let soCau = 0, vaoHang = 0
  const loi: string[] = []
  for (const maDe of ds) {
    try {
      const goi = await docGoi(env, maDe)
      if (!goi) { loi.push(`${maDe}: không có gói`); continue }
      const k = await ghiCauVaoHang(env, maDe, goi)
      soCau += k.soCau; vaoHang += k.vaoHang
    } catch (e) { loi.push(`${maDe}: ${(e as Error).message}`) }
  }
  return { ok: true, daQuet: ds, soCau, vaoHang, loi, tiep: ds.length === so ? tu + so : null }
}

/**
 * NHẬN MỘT LÔ VIỆC cho một luồng máy soạn: các câu CÙNG CHƯƠNG (đọc bộ chìa khoá một lần), ưu tiên cao trước.
 * Nhận bằng MỘT câu UPDATE có mã lượt ⇒ 4 luồng gọi cùng lúc không bao giờ nhận trùng câu.
 * Chỉ phát chương đã có bộ chìa khoá; câu chương chưa có bộ nằm chờ.
 */
export async function layViec(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const nay = Date.now()
  const so = Math.min(20, Math.max(1, Number(b.so ?? 12) || 12))
  const lop = str(b.lop)
  const boCo = Object.keys(BO_CHIA_KHOA)
  await env.DB.prepare("UPDATE loi_giai_viec SET trang_thai = 'cho', ma_luot = NULL WHERE trang_thai = 'dang' AND nhan_luc < ?")
    .bind(new Date(nay - PHUT_GIU_VIEC * 60_000).toISOString()).run()
  const dieuKien = `trang_thai = 'cho' AND bo IN (SELECT value FROM json_each(?))${lop ? ' AND lop = ?' : ''}${str(b.bo) ? ' AND bo = ?' : ''}`
  const thamSo = [JSON.stringify(boCo), ...(lop ? [lop] : []), ...(str(b.bo) ? [str(b.bo)] : [])]
  const dau = await env.DB.prepare(`SELECT bo FROM loi_giai_viec WHERE ${dieuKien} ORDER BY uu_tien DESC LIMIT 1`).bind(...thamSo).first<Obj>()
  if (!dau) return { ok: true, het: true, viec: [] }
  const bo = str(dau.bo)
  const maLuot = crypto.randomUUID()
  await env.DB.prepare(
    `UPDATE loi_giai_viec SET trang_thai = 'dang', ma_luot = ?, nhan_luc = ?, so_lan = so_lan + 1
     WHERE bam IN (SELECT bam FROM loi_giai_viec WHERE trang_thai = 'cho' AND bo = ?${lop ? ' AND lop = ?' : ''} ORDER BY uu_tien DESC, qid LIMIT ?)`,
  ).bind(maLuot, new Date(nay).toISOString(), bo, ...(lop ? [lop] : []), so).run()
  const nhan = (await env.DB.prepare('SELECT * FROM loi_giai_viec WHERE ma_luot = ? ORDER BY uu_tien DESC, qid').bind(maLuot).all<Obj>()).results ?? []
  const boNho = new Map<string, unknown>()
  const viec: unknown[] = []
  for (const v of nhan) {
    const qid = str(v.qid), bam = str(v.bam)
    const ht = await cauHienTai(env, qid, str(v.ma_de), boNho).catch(() => null)
    if (!ht || ht.bam !== bam) {
      // Đề đã sửa sau khi vào hàng: băm cũ không còn câu nào dùng ⇒ bỏ việc (móc nạp đề đã xếp băm mới).
      await env.DB.prepare("UPDATE loi_giai_viec SET trang_thai = 'bo', loi = 'đề đã đổi' WHERE bam = ?").bind(bam).run()
      continue
    }
    const vao = dauVao(ht.c, bam)
    if (vao) viec.push({ ...vao, ghiChuThay: str(v.loi) || undefined })
  }
  return { ok: true, het: false, maLuot, bo: BO_CHIA_KHOA[bo], viec }
}

/** NỘP MỘT HỒ SƠ. Máy chủ tự dựng lại đầu vào TỪ KHO rồi kiểm 6 khoá — không tin gì máy soạn gửi ngoài chính hồ sơ. */
export async function nopHoSo(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const qid = str(b.qid), bam = str(b.bam)
  const hoSo = b.hoSo
  if (!qid || !bam || !hoSo || typeof hoSo !== 'object') return { ok: false, error: 'Thiếu qid / bam / hoSo' }
  const ht = await cauHienTai(env, qid)
  if (!ht) return { ok: false, error: 'Không thấy câu trong kho' }
  if (ht.bam !== bam) return { ok: false, error: 'Đề đã đổi sau khi nhận việc (băm lệch) — bỏ hồ sơ này', loi: ['KHOÁ VÂN TAY'] }
  const vao = dauVao(ht.c, bam)
  if (!vao) return { ok: false, error: 'Câu không thuộc dạng soạn lời giải (tự luận?)' }
  const bo = BO_CHIA_KHOA[vao.bo]
  if (!bo) return { ok: false, error: `Chương ${vao.bo || '?'} chưa có bộ chìa khoá` }
  const cu = await env.DB.prepare('SELECT trang_thai FROM loi_giai WHERE bam = ?').bind(bam).first<Obj>()
  if (str(cu?.trang_thai) === 'da_duyet' && b.ghiDe !== true) return { ok: false, error: 'Hồ sơ câu này đã duyệt — không ghi đè' }
  const { loi, canhBao } = kiemHoSo(vao, hoSo, bo)
  const nay = new Date().toISOString()
  if (loi.length) {
    await env.DB.prepare(
      `UPDATE loi_giai_viec SET trang_thai = CASE WHEN so_lan >= ? THEN 'truot' ELSE 'cho' END, ma_luot = NULL, loi = ? WHERE bam = ?`,
    ).bind(SO_LAN_TOI_DA, loi.slice(0, 12).join(' | ').slice(0, 1500), bam).run()
    return { ok: false, loi, canhBao }
  }
  // Trường định danh lấy từ KHO, không lấy từ máy soạn: khung chọn bộ chìa khoá theo `bo`.
  const gon: Obj = { ...gonHoSo(hoSo as Obj), qid, bam, dang: vao.dang, bo: vao.bo }
  const co = (gon.co as { loai: string }[]) ?? []
  const soCoDapAn = co.filter((c) => c.loai === 'dapAn').length
  // Máy duyệt: đã qua 6 khoá ở trên + không còn cờ đáp án. Cờ đáp án ⇒ chờ (không hiện với học sinh), để cuối đợt báo thầy.
  const daDuyet = soCoDapAn === 0
  const khoa = `giai/${bam}.json`
  await env.DE.put(khoa, JSON.stringify(gon))
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO loi_giai (bam, qid_mau, dang, bo, lop, tang, trang_thai, so_co_dap_an, co_json, r2_khoa, soan_luc, duyet_luc, ghi_chu)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(bam) DO UPDATE SET qid_mau=excluded.qid_mau, dang=excluded.dang, bo=excluded.bo, lop=excluded.lop, tang=excluded.tang,
         trang_thai=excluded.trang_thai, so_co_dap_an=excluded.so_co_dap_an, co_json=excluded.co_json, r2_khoa=excluded.r2_khoa, soan_luc=excluded.soan_luc,
         duyet_luc=excluded.duyet_luc,
         ghi_chu=CASE WHEN excluded.trang_thai = 'da_duyet' THEN ${SQL_GHI_CHU_MAY_DUYET('loi_giai.ghi_chu')}
           WHEN loi_giai.ghi_chu = '${GHI_CHU_MAY_DUYET}' THEN NULL
           WHEN loi_giai.ghi_chu LIKE '${GHI_CHU_MAY_DUYET} · %' THEN substr(loi_giai.ghi_chu, ${GHI_CHU_MAY_DUYET.length + 4}) ELSE loi_giai.ghi_chu END`,
    ).bind(bam, qid, vao.dang, vao.bo, lopCua(ht.c.maDe), vao.tang, daDuyet ? 'da_duyet' : 'cho_duyet', soCoDapAn, JSON.stringify(co), khoa, nay,
      daDuyet ? nay : null, daDuyet ? GHI_CHU_MAY_DUYET : null),
    env.DB.prepare("UPDATE loi_giai_viec SET trang_thai = 'xong', ma_luot = NULL, loi = NULL WHERE bam = ?").bind(bam),
  ])
  return { ok: true, bam, sach: laHoSoSach(gon), daDuyet, canhBao, kichThuoc: JSON.stringify(gon).length }
}

/** Tổng quan hàng việc theo chương (máy soạn in ra; màn thầy hiện). */
export async function tongHang(env: Env) {
  await damBaoBangLoiGiai(env)
  const viec = (await env.DB.prepare('SELECT bo, lop, trang_thai, COUNT(*) n FROM loi_giai_viec GROUP BY bo, lop, trang_thai').all<Obj>()).results ?? []
  const hs = (await env.DB.prepare('SELECT bo, lop, trang_thai, COUNT(*) n FROM loi_giai GROUP BY bo, lop, trang_thai').all<Obj>()).results ?? []
  return { ok: true, viec, hoSo: hs, boCo: Object.keys(BO_CHIA_KHOA) }
}

// ---------------------------------------------------------------- thầy duyệt theo đề

/** Mọi câu (trắc nghiệm, Đ/S, trả lời ngắn) của một đề kèm trạng thái lời giải. Đề chưa vào hàng thì xếp ngay. */
export async function gvChoDuyet(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const maDe = str(b.maDe)
  if (!maDe) return { ok: false, error: 'Thiếu mã đề' }
  const doc = () => env.DB.prepare(
    `SELECT q.qid, q.bam, q.dang, q.bo, l.trang_thai AS tt, l.so_co_dap_an, l.co_json, l.ghi_chu, v.trang_thai AS viec, v.loi AS loi_viec, v.so_lan
     FROM loi_giai_cau q LEFT JOIN loi_giai l ON l.bam = q.bam LEFT JOIN loi_giai_viec v ON v.bam = q.bam WHERE q.ma_de = ?`,
  ).bind(maDe).all<Obj>()
  let rows = (await doc()).results ?? []
  if (!rows.length) {
    const goi = await docGoi(env, maDe)
    if (!goi) return { ok: false, error: 'Không thấy đề trong kho' }
    await ghiCauVaoHang(env, maDe, goi)
    rows = (await doc()).results ?? []
  }
  const soThu = (qid: string) => { const m = /-(III|II|I)-(\d+)$/.exec(qid); return m ? ({ I: 0, II: 1000, III: 2000 } as Record<string, number>)[m[1]] + Number(m[2]) : 9999 }
  const cau = rows.map((r) => {
    const tt = str(r.tt)
    const trangThai = tt === 'da_duyet' ? 'da_duyet' : tt === 'cho_duyet' ? 'cho_duyet' : tt === 'tra_lai' ? 'tra_lai'
      : !BO_CHIA_KHOA[str(r.bo)] ? 'chua_co_bo' : str(r.viec) === 'truot' ? 'truot' : 'dang_soan'
    let co: unknown[] = []
    try { co = JSON.parse(str(r.co_json) || '[]') } catch { co = [] }
    const { mayDuyet, ghiChu } = tachGhiChu(trangThai, str(r.ghi_chu))
    return { qid: str(r.qid), bam: str(r.bam), dang: str(r.dang), bo: str(r.bo), trangThai, sach: trangThai === 'cho_duyet' && Number(r.so_co_dap_an ?? 0) === 0, mayDuyet, co, ghiChu, loiMay: str(r.loi_viec), soLan: Number(r.so_lan ?? 0) }
  }).sort((a, b2) => soThu(a.qid) - soThu(b2.qid))
  const dem = (t: string) => cau.filter((c) => c.trangThai === t).length
  return {
    ok: true, maDe, cau,
    tong: { cau: cau.length, daDuyet: dem('da_duyet'), choDuyet: dem('cho_duyet'), sach: cau.filter((c) => c.sach).length, dangSoan: dem('dang_soan'), traLai: dem('tra_lai'), truot: dem('truot'), chuaCoBo: dem('chua_co_bo') },
  }
}

/** Ghi chú trong bảng ⇒ (máy duyệt?, ghi chú trả lại của thầy còn lại). */
function tachGhiChu(trangThai: string, ghi: string): { mayDuyet: boolean; ghiChu: string } {
  if (!ghi.startsWith(GHI_CHU_MAY_DUYET)) return { mayDuyet: false, ghiChu: ghi }
  return { mayDuyet: trangThai === 'da_duyet', ghiChu: ghi.slice(GHI_CHU_MAY_DUYET.length).replace(/^ · /, '') }
}

/**
 * BÙ MÁY DUYỆT cho hồ sơ nộp TRƯỚC khi có luật máy duyệt: hồ sơ sạch đang chờ ⇒ 'da_duyet' (ghi giờ + "máy duyệt").
 * CHỈ đổi trạng thái — không xoá, không đụng hồ sơ còn cờ đáp án, hồ sơ thầy đã trả lại hay đã duyệt. Chạy lại vô hại. `thu: true` ⇒ chỉ đếm.
 */
export async function gvMayDuyetBu(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const dem = async (dk: string) => Number((await env.DB.prepare(`SELECT COUNT(*) AS n FROM loi_giai WHERE ${dk}`).first<Obj>())?.n ?? 0)
  const conCoDapAn = await dem("trang_thai = 'cho_duyet' AND so_co_dap_an > 0")
  if (b.thu === true) return { ok: true, thu: true, soCau: await dem(SQL_HO_SO_SACH_CHO), conCoDapAn }
  const r = await env.DB.prepare(`UPDATE loi_giai SET trang_thai = 'da_duyet', duyet_luc = ?, ghi_chu = ${SQL_GHI_CHU_MAY_DUYET()} WHERE ${SQL_HO_SO_SACH_CHO}`)
    .bind(new Date().toISOString()).run()
  return { ok: true, soCau: r.meta?.changes ?? 0, conCoDapAn }
}

/** Thầy xem một hồ sơ (mọi trạng thái) + câu để khung vẽ. */
export async function gvXemHoSo(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const qid = str(b.qid)
  const ht = await cauHienTai(env, qid)
  if (!ht) return { ok: false, error: 'Không thấy câu trong kho' }
  const hoSo = await docHoSo(env, ht.bam)
  if (!hoSo) return { ok: false, error: 'Câu này chưa có hồ sơ lời giải' }
  return { ok: true, hoSo, cau: cauChoKhung(ht.c) }
}

/**
 * DUYỆT / TRẢ LẠI. `quyet`: 'duyet' | 'tra_lai'. Chọn câu bằng `bam: string[]`, hoặc `maDe` + `caLoSach: true` = mọi hồ sơ SẠCH (không cờ đáp án) đang chờ của đề.
 * Trả lại ⇒ hồ sơ ẩn khỏi học sinh + câu vào lại hàng kèm ghi chú của thầy cho máy soạn đọc.
 */
export async function gvDuyet(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const quyet = str(b.quyet)
  if (quyet !== 'duyet' && quyet !== 'tra_lai') return { ok: false, error: 'quyet phải là duyet | tra_lai' }
  const nay = new Date().toISOString()
  let bams = Array.isArray(b.bam) ? (b.bam as unknown[]).map(str).filter(Boolean) : []
  if (b.caLoSach === true) {
    if (quyet !== 'duyet') return { ok: false, error: 'Chỉ duyệt cả lô, không trả lại cả lô' }
    const r = await env.DB.prepare(
      `SELECT DISTINCT l.bam FROM loi_giai l JOIN loi_giai_cau q ON q.bam = l.bam WHERE q.ma_de = ? AND l.trang_thai = 'cho_duyet' AND l.so_co_dap_an = 0`,
    ).bind(str(b.maDe)).all<Obj>()
    bams = (r.results ?? []).map((x) => str(x.bam))
  }
  if (!bams.length) return { ok: true, soCau: 0 }
  const ds = JSON.stringify(bams)
  if (quyet === 'duyet') {
    const r = await env.DB.prepare(`UPDATE loi_giai SET trang_thai = 'da_duyet', duyet_luc = ? WHERE trang_thai IN ('cho_duyet','tra_lai') AND bam IN (SELECT value FROM json_each(?))`).bind(nay, ds).run()
    return { ok: true, soCau: r.meta?.changes ?? 0 }
  }
  const ghiChu = str(b.ghiChu).slice(0, 500)
  const [r] = await env.DB.batch([
    env.DB.prepare(`UPDATE loi_giai SET trang_thai = 'tra_lai', ghi_chu = ?, duyet_luc = ? WHERE bam IN (SELECT value FROM json_each(?))`).bind(ghiChu, nay, ds),
    env.DB.prepare(`UPDATE loi_giai_viec SET trang_thai = 'cho', so_lan = 0, ma_luot = NULL, uu_tien = uu_tien + 5000, loi = ? WHERE bam IN (SELECT value FROM json_each(?))`).bind(ghiChu ? 'Thầy trả lại: ' + ghiChu : 'Thầy trả lại', ds),
  ])
  return { ok: true, soCau: r.meta?.changes ?? 0 }
}

/**
 * DANH SÁCH SỬA KHO do phiên chốt đề xuất (cờ `loiDe` / `hienThi` có `sua`), đúng khuôn `docs/ra-soat-hien-thi-de-2809/sua-tung-cau.json`
 * để công cụ áp dụng sẵn có ghi qua `/kho/day` (kiểm ca mở, đọc lại, lùi được). Cờ `dapAn` đã chốt "đáp án kho sai" trả riêng: đổi đáp án là đổi điểm thật.
 * Cờ `dapAn` phiên chốt chưa kết luận (không có `chot`) trả ở `chuaChot` — cuối đợt Boss báo thầy cả hai danh sách.
 */
export async function gvSuaKho(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const maDe = str(b.maDe)
  const r = await env.DB.prepare(
    `SELECT q.qid, q.ma_de, l.co_json FROM loi_giai l JOIN loi_giai_cau q ON q.bam = l.bam
     WHERE (l.co_json LIKE '%"sua"%' OR l.co_json LIKE '%"chot"%' OR l.so_co_dap_an > 0) ${maDe ? 'AND q.ma_de = ?' : ''} ORDER BY q.ma_de, q.qid`,
  ).bind(...(maDe ? [maDe] : [])).all<Obj>()
  const sua: Obj[] = [], dapAnSai: Obj[] = [], chuaChot: Obj[] = []
  for (const row of r.results ?? []) {
    let co: Obj[] = []
    try { co = JSON.parse(str(row.co_json) || '[]') } catch { co = [] }
    const qid = str(row.qid), m = /-(III|II|I)-(\d+)$/.exec(qid)
    for (const c of co) {
      const su = c.sua as Obj | undefined
      if (su && typeof su === 'object') sua.push({ qid, maDe: str(row.ma_de), phan: m?.[1] ?? '', so: Number(m?.[2] ?? 0), truong: str(su.truong), truoc: String(su.truoc ?? ''), sau: String(su.sau ?? ''), lyDo: str(c.ghi), loai: [c.loai === 'hienThi' ? 'hien-thi' : 'loi-de'] })
      if (c.loai === 'dapAn') (str(c.chot) ? dapAnSai : chuaChot).push({ qid, maDe: str(row.ma_de), ghi: str(c.ghi), ...(str(c.chot) ? { chot: str(c.chot) } : {}) })
    }
  }
  return { ok: true, sua, dapAnSai, chuaChot }
}

/** Đề thầy sắp giao ⇒ câu của đề lên đầu hàng (mục 5.6: ưu tiên 1). */
export async function gvSoanGap(env: Env, b: Obj) {
  const kq = await gvChoDuyet(env, b)
  if (!kq.ok) return kq
  const r = await env.DB.prepare(
    `UPDATE loi_giai_viec SET uu_tien = uu_tien + 5000 WHERE trang_thai = 'cho' AND uu_tien < 5000 AND bam IN (SELECT bam FROM loi_giai_cau WHERE ma_de = ?)`,
  ).bind(str(b.maDe)).run()
  return { ok: true, soCau: r.meta?.changes ?? 0 }
}

// ---------------------------------------------------------------- học sinh

/** Trong các qid, câu nào ĐÃ có lời giải từng bước xem được (chỉ báo có/không — không lộ nội dung). */
export async function hsLoiGiaiCo(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  await gameIdentity(env, b)
  const qids = (Array.isArray(b.qids) ? b.qids : []).map(str).filter(Boolean).slice(0, 80)
  if (!qids.length) return { ok: true, qids: [] }
  const r = await env.DB.prepare(
    `SELECT q.qid FROM loi_giai_cau q JOIN loi_giai l ON l.bam = q.bam AND ${SQL_XEM_DUOC('l')} WHERE q.qid IN (SELECT value FROM json_each(?))`,
  ).bind(JSON.stringify(qids)).all<Obj>()
  return { ok: true, qids: (r.results ?? []).map((x) => str(x.qid)) }
}

/**
 * EM MỞ LỜI GIẢI TỪNG BƯỚC CỦA MỘT CÂU. Đủ ba điều kiện mới trả:
 *   (1) em được xem đáp án câu này: câu nằm trong ca của em đã CÔNG BỐ (luật `SQL_DA_CONG_BO`), hoặc em đã tự làm câu ở chỗ luyện (không phải ca thi);
 *   (2) hồ sơ xem được (`SQL_XEM_DUOC`: thầy đã duyệt hoặc hồ sơ sạch);
 *   (3) băm hồ sơ = băm câu HIỆN TẠI trong kho (thầy sửa đề thì hồ sơ cũ tự tắt).
 */
export async function hsLoiGiai(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const sbd = await gameIdentity(env, b)
  const qid = str(b.qid)
  if (!qid) return { ok: false, error: 'Thiếu câu cần xem.' }
  const thi = await env.DB.prepare(
    `SELECT 1 AS co FROM chi_tiet_cau t JOIN ca c ON c.ma_ca = t.ma_ca WHERE t.sbd = ? AND t.qid = ? AND c.trang_thai IS NOT 'da_xoa' AND ${SQL_DA_CONG_BO('c')} LIMIT 1`,
  ).bind(sbd, qid).first<Obj>().catch(() => null)
  let duoc = !!thi
  if (!duoc) {
    const luyen = await env.DB.prepare(`SELECT 1 AS co FROM su_kien_hoc WHERE sbd = ? AND qid = ? AND nguon <> 'thi' AND COALESCE(visibility,'released') <> 'embargoed' LIMIT 1`)
      .bind(sbd, qid).first<Obj>()
      .catch(() => env.DB.prepare(`SELECT 1 AS co FROM su_kien_hoc WHERE sbd = ? AND qid = ? AND nguon <> 'thi' LIMIT 1`).bind(sbd, qid).first<Obj>().catch(() => null))
    duoc = !!luyen
  }
  if (!duoc) return { ok: false, error: 'Lời giải mở sau khi Thầy công bố kết quả, hoặc sau khi em tự làm câu này.' }
  const dong = await env.DB.prepare(`SELECT q.bam FROM loi_giai_cau q JOIN loi_giai l ON l.bam = q.bam AND ${SQL_XEM_DUOC('l')} WHERE q.qid = ?`).bind(qid).first<Obj>()
  if (!dong) return { ok: true, coLoiGiai: false }
  // Câu (hoặc bản cùng nội dung ở tờ khác) đang nằm trong một ca còn làm được / chưa công bố ⇒ khoá, KỂ CẢ nhánh thi:
  // câu cũ được dùng lại trong ca mới, hoặc ca "công bố ngay" còn bạn đang làm — em nộp sớm không được chuyền lời giải.
  if (await cauDangBaoVe(env, qid, str(dong.bam))) return { ok: false, error: 'Câu này đang nằm trong một ca kiểm tra chưa công bố kết quả. Thầy công bố xong em xem lại nhé.' }
  const ht = await cauHienTai(env, qid)
  if (!ht || ht.bam !== str(dong.bam)) return { ok: true, coLoiGiai: false }
  const hoSo = await docHoSo(env, ht.bam)
  if (!hoSo) return { ok: true, coLoiGiai: false }
  return { ok: true, coLoiGiai: true, hoSo, cau: cauChoKhung(ht.c) }
}

/**
 * Câu thuộc đề của một ca CHƯA công bố hoặc còn làm được (kể cả bài tập) — đúng tập game dùng để KHÔNG chấm câu ấy (`protectedQuestions`).
 * Lỗi đọc phạm vi ⇒ coi như ĐANG bảo vệ (thà khoá nhầm một lúc còn hơn lộ lời giải câu đang thi).
 */
async function cauDangBaoVe(env: Env, qid: string, bam?: string): Promise<boolean> {
  try {
    const tap = await protectedQuestions(env)
    if (tap.has(qid) || tap.has(qidGoc(qid))) return true
    // CÙNG NỘI DUNG, KHÁC MÃ: câu chép sang tờ DB-/DH- mang qid khác nhưng dùng CHUNG hồ sơ lời giải (cùng băm).
    // Chỉ so qid thì em mở bản chép là thấy lời giải câu đang nằm trong ca chưa công bố ⇒ so thêm mọi qid cùng băm.
    if (!bam) return false
    const cungNoiDung = await env.DB.prepare('SELECT qid FROM loi_giai_cau WHERE bam = ?').bind(bam).all<Obj>()
    return (cungNoiDung.results ?? []).some((r) => tap.has(str(r.qid)))
  } catch {
    return true
  }
}

/** Lời giải chữ đang có trong kho (khi câu chưa có hồ sơ từng bước): đúng trường của gói, không bịa thêm gì. */
function loiGiaiChu(c: CauKho) {
  const lg = (c.loiGiai ?? {}) as Obj
  const tung = (lg.tung_y ?? lg.tung_pa ?? null) as Record<string, { dung?: unknown; vi_sao?: unknown }> | null
  return {
    dapAn: c.dapAn,
    chot: str(lg.chot),
    tung: tung ? Object.entries(tung).map(([id, v]) => ({ id, dung: v?.dung === true, viSao: str(v?.vi_sao) })) : [],
    buoc: Array.isArray(lg.buoc) ? (lg.buoc as unknown[]).map((x) => (typeof x === 'string' ? x : str((x as Obj)?.noi_dung ?? (x as Obj)?.t ?? JSON.stringify(x)))) : [],
    ketQua: str(lg.ket_qua),
  }
}

/**
 * NÚT "HỎI THẦY" (thầy lệnh 29/09: "bất kể câu nào học sinh làm trừ lúc học sinh kiểm tra có một nút Hỏi thầy, bấm vào là hiển thị luôn lời giải kiểu mới").
 * Chặn ở MÁY CHỦ, không tin máy em:
 *   - em đang có ca kiểm tra mở vào được (`coCaDangMo`, đúng luật cổng vào thi) ⇒ khoá mọi câu;
 *   - câu nằm trong một ca kiểm tra CHƯA công bố kết quả (của bất kì em nào) ⇒ khoá câu ấy, kẻo em làm xong chuyền lời giải cho bạn chưa làm.
 * Có hồ sơ xem được ⇒ trả hồ sơ + câu cho khung. Chưa có ⇒ trả lời giải chữ của kho và đẩy câu lên đầu hàng soạn.
 * Mỗi lần bấm ghi một dòng `loi_giai_hoi` (em đã xem lời giải câu này).
 */
export async function hsHoiThay(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const sbd = await gameIdentity(env, b)
  const qid = qidGoc(str(b.qid)) // câu game có hậu tố "#n" cho lượt lặp
  const nguon = str(b.nguon).slice(0, 40) || 'luyen'
  if (!qid) return { ok: false, error: 'Thiếu câu cần hỏi.' }
  const nay = Date.now()
  if (await coCaDangMo(env, sbd, nay)) return { ok: false, khoa: 'dang_kiem_tra', error: 'Em đang có ca kiểm tra mở nên nút Hỏi thầy tạm khoá. Làm xong ca kiểm tra rồi hỏi nhé.' }
  if (await cauDangBaoVe(env, qid)) return { ok: false, khoa: 'ca_chua_cong_bo', error: 'Câu này đang nằm trong một ca kiểm tra chưa công bố kết quả. Thầy công bố xong em hỏi lại nhé.' }
  const ht = await cauHienTai(env, qid).catch(() => null)
  if (!ht) return { ok: false, error: 'Không tìm thấy câu này trong kho đề.' }
  // Bản chép cùng nội dung ở tờ khác đang bảo vệ ⇒ khoá như chính câu ấy (dùng chung hồ sơ lời giải và đáp án).
  if (await cauDangBaoVe(env, qid, ht.bam)) return { ok: false, khoa: 'ca_chua_cong_bo', error: 'Câu này đang nằm trong một ca kiểm tra chưa công bố kết quả. Thầy công bố xong em hỏi lại nhé.' }
  const dong = await env.DB.prepare(`SELECT l.bam FROM loi_giai l WHERE l.bam = ? AND ${SQL_XEM_DUOC('l')}`).bind(ht.bam).first<Obj>()
  const hoSo = dong ? await docHoSo(env, ht.bam) : null
  const luc = new Date(nay).toISOString()
  const ghi = [env.DB.prepare('INSERT OR IGNORE INTO loi_giai_hoi (sbd, qid, nguon, luc, co_ho_so) VALUES (?,?,?,?,?)').bind(sbd, qid, nguon, luc, hoSo ? 1 : 0)]
  if (!hoSo) {
    // Câu học sinh hỏi mà chưa có hồ sơ ⇒ lên đầu hàng soạn (mục 5.6: câu học sinh cần). Chưa vào hàng thì xếp cả đề ngay.
    const coViec = await env.DB.prepare('SELECT 1 AS co FROM loi_giai_viec WHERE bam = ?').bind(ht.bam).first<Obj>()
    if (!coViec) await ghiCauVaoHang(env, ht.c.maDe, await docGoi(env, ht.c.maDe)).catch(() => null)
    ghi.push(env.DB.prepare("UPDATE loi_giai_viec SET uu_tien = uu_tien + 3000 WHERE bam = ? AND trang_thai = 'cho' AND uu_tien < 3000").bind(ht.bam))
  }
  await env.DB.batch(ghi).catch(() => null)
  // ÔN LẠI: hỏi thầy khi CHƯA nộp câu hôm nay ⇒ ghi trước lần làm đầu tiên của câu là "có trợ giúp" (assisted, chưa đúng).
  // Ôn lại lấy kết quả LẦN ĐẦU trong ngày (nộp lại không đổi) ⇒ em không nhận EXP cho câu vừa xem lời giải, câu quay lại lịch ôn để tự làm.
  // Đã nộp rồi mới hỏi thì khoá trùng ⇒ không đổi gì. Chỉ các nguồn có luật "lần đầu" này mới ghi (game tự gửi `assisted` khi trả lời).
  if (nguon === 'on_lai') {
    // 02/10 (Vòng học khép kín v2, GĐ1): dòng này chỉ KHOÁ lần làm hôm nay (không EXP, câu quay lại lịch ôn) — nó là sự kiện ĐỌC LỜI GIẢI,
    // không phải một lần làm sai. `purpose = xem_loi_giai` ⇒ ôn tập / hồ sơ năm / năng lực bỏ qua dòng này khi đếm đúng–sai.
    await ghiSuKien(env, [{ nguon: 'on_lai', maNguon: `on_lai:${ngayVn(nay)}`, sbd, qid, lan: 1, ketQua: 0, luc, assistance: 'assisted', purpose: MUC_DICH_XEM_LOI_GIAI }]).catch(() => null)
  }
  const cau = cauChoKhung(ht.c)
  if (hoSo) return { ok: true, coLoiGiai: true, hoSo, cau }
  return { ok: true, coLoiGiai: false, cau, loiGiaiChu: loiGiaiChu(ht.c) }
}

// ---------------------------------------------------------------- GĐ1 v2: em đọc lời giải thế nào

const KIEU_DOC = new Set(['chon', 'goi_y', 'gan', 'tuong_tu', 'tra_loi_so', 'chot'])

/** Lọc thao tác máy em gửi: chỉ kiểu đã biết, tối đa 200, mốc thời gian là số. Dữ liệu máy em gửi KHÔNG đáng tin ⇒ chỉ giữ trường cần. */
export function locSuKienDoc(v: unknown): { k: string; y?: string; d?: boolean; m?: number; t: number }[] {
  if (!Array.isArray(v)) return []
  const ra: { k: string; y?: string; d?: boolean; m?: number; t: number }[] = []
  for (const x of v.slice(0, 200)) {
    if (!x || typeof x !== 'object') continue
    const o = x as Obj
    if (typeof o.k !== 'string' || !KIEU_DOC.has(o.k) || !Number.isFinite(Number(o.t))) continue
    ra.push({ k: o.k, ...(typeof o.y === 'string' ? { y: o.y.slice(0, 12) } : {}), ...(typeof o.d === 'boolean' ? { d: o.d } : {}), ...(Number.isFinite(Number(o.m)) && o.m != null ? { m: Math.min(3, Math.max(0, Number(o.m))) } : {}), t: Number(o.t) })
  }
  return ra
}

/** Tóm tắt một lần đọc: số ý đã chọn / đúng, số lần xin gợi ý, đã làm câu chốt chưa và đúng không. */
export function tomTatDoc(ds: { k: string; y?: string; d?: boolean; m?: number }[]) {
  const chon = ds.filter((x) => x.k === 'chon' || x.k === 'tra_loi_so')
  const chot = ds.find((x) => x.k === 'chot')
  return {
    soY: new Set(chon.map((x) => x.y ?? '')).size,
    soYDung: chon.filter((x) => x.d === true).length,
    soGoiY: ds.filter((x) => x.k === 'goi_y').length,
    soTuongTu: ds.filter((x) => x.k === 'tuong_tu').length,
    soTuongTuDung: ds.filter((x) => x.k === 'tuong_tu' && x.d === true).length,
    daChot: !!chot,
    chotDung: chot ? chot.d === true : null,
  }
}

/**
 * `/hs/doc-loi-giai {token, qid, nguon, giay, suKien}` — máy em gửi khi đóng khung lời giải. Chỉ ghi khi em ĐÃ bấm Hỏi thầy câu này
 * (có dòng `loi_giai_hoi`) — không ai ghi bừa cho câu chưa mở. Chỉ thêm dữ liệu; không đổi điểm, EXP, lịch ôn.
 */
export async function hsDocLoiGiai(env: Env, b: Obj) {
  await damBaoBangLoiGiai(env)
  const sbd = await gameIdentity(env, b)
  const qid = qidGoc(str(b.qid))
  if (!qid) return { ok: false, error: 'Thiếu câu.' }
  const daHoi = await env.DB.prepare('SELECT 1 AS co FROM loi_giai_hoi WHERE sbd = ? AND qid = ? LIMIT 1').bind(sbd, qid).first<Obj>()
  if (!daHoi) return { ok: false, error: 'Em chưa mở lời giải câu này.' }
  const ds = locSuKienDoc(b.suKien)
  const giay = Math.min(6 * 3600, Math.max(0, Math.round(Number(b.giay) || 0)))
  const nay = Date.now()
  await env.DB.prepare('INSERT INTO doc_loi_giai (sbd, qid, nguon, luc, ngay_vn, giay, so_su_kien, tom_tat_json, su_kien_json) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(sbd, qid, str(b.nguon).slice(0, 40) || 'luyen', new Date(nay).toISOString(), ngayVn(nay), giay, ds.length, JSON.stringify(tomTatDoc(ds)), JSON.stringify(ds)).run()
  return { ok: true }
}
