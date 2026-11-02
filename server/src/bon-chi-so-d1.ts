// HÔM NAY · 4 BẢNG — PHẦN D1 (thầy chốt bản vẽ 01/11; lõi thuần bon-chi-so.ts; hợp đồng src/lib/bon-bang-kieu.ts).
//   · Tính sẵn: cron mỗi phút ngoài giờ cao điểm, mỗi lượt một lô em CHƯA có bản tính của hôm nay ⇒ bảng chỉ-thêm `bon_chi_so_em` (một dòng mỗi em, ghi đè bản
//     cũ của chính em — dữ liệu SUY RA, tính lại được từ sổ). Đọc sổ bằng ĐÚNG hai đường đã kiểm chứng: bộ xếp Học thật (`tinhLoEm`, lượt + Mức làm + KTCN)
//     và Nhịp học (`docNgayCacEm` + `docNgayVao` + `ngayDuocTinh`: mức ngày / đã làm, ngày vào app, ngày bảo trì).
//   · `/gv/bon-bang`: MỘT lượt đọc bảng + danh sách em ⇒ 4 bảng đã xếp + trung vị cả lớp.
//   · `/gv/bon-bang/em`: bản tính của một em (chưa có ⇒ tính ngay rồi lưu) + hạng + «cả lớp» từng thẻ + tên bài / đầu đề của các ví dụ.
//   · v3 (02/11): đọc thêm SONG SONG ca thi thật + lên bảng + kiểm tra đầu giờ (60 ngày), luyện tập cũ gộp theo đơn vị kiến thức, độ khó từng câu trong ca
//     (đệm 3 giờ) ⇒ `bon-ca-thi.ts`. v3b: hai trục, mọi em đều có bảng (không còn «Đang theo dõi»).
// Không gửi gì cho học sinh / phụ huynh; không đụng bảng nào khác.
import type { Env } from './kieu'
import { docDanhSachEm, docNgayCacEm, type EmGoc } from './bai-hang-ngay'
import { docNgayVao, ngayDuocTinh } from './nhip-hoc'
import { cuaSoTinh, sqlChuyenDeKho, sqlQidGoc, SQL_LUOT_LAM, tinhLoEm } from './danh-gia-hoc-that-d1'
import { BAN_BON, tinhBon, trungVi, vaoBang, type DauVaoBon, type KetQuaBon, type SoLieuBon, type TheTho } from './bon-chi-so'
import { NGAY_LUYEN_TOI_DA, SO_NGAY_CA, type CauCaThi, type LuotBang, type LuyenCuDv } from './bon-ca-thi'
import { congNgay7 } from './goi-bai-7-loi'
import { THU_TU_BANG, type DiemBon, type DongBang, type LoiBon, type MaBang, type TheBangChung, type TraLoiBangChung, type TraLoiBonBang } from '../../src/lib/bon-bang-kieu'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const soHoacNull = (x: unknown): number | null => (x === null || x === undefined || x === '' ? null : Number.isFinite(Number(x)) ? Number(x) : null)
const json = <T>(x: unknown, macDinh: T): T => { try { return x ? (JSON.parse(String(x)) as T) : macDinh } catch { return macDinh } }
const hoi = async (env: Env, sql: string, ...bind: unknown[]): Promise<Row[]> => (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []

export const LO_BON_DEM = 25
export const LO_BON_NGAY = 12

const BANG = `CREATE TABLE IF NOT EXISTS bon_chi_so_em (sbd TEXT PRIMARY KEY, ngay TEXT NOT NULL, tinh_luc TEXT NOT NULL, ht REAL, dp REAL, ch REAL, lu REAL,
  so_luot INTEGER NOT NULL DEFAULT 0, so_lieu_json TEXT, bc_json TEXT, ket_json TEXT, the_json TEXT, ngay_json TEXT)`
let daTaoBang = false
export async function damBaoBangBon(env: Env): Promise<void> {
  if (daTaoBang) return
  await env.DB.prepare(BANG).run()
  daTaoBang = true
}
/** Cho test: quên cờ đã tạo bảng (D1 giả mới). */
export function xoaDemBon(): void { daTaoBang = false }

// ───── v3 (02/11): CA THI THẬT + LÊN BẢNG + luyện tập cũ theo đơn vị kiến thức — đọc SONG SONG với các đường cũ (không thêm vòng chờ nối tiếp).
/** Câu ca thi + lên bảng + kiểm tra đầu giờ của lô em trong 60 ngày (sổ `su_kien_hoc`, đi chỉ mục (sbd, ngay_vn)). Ca loại «bài tập» không tính là thi;
 *  dòng còn CHE (ca chưa công bố) không đọc. Câu thi bỏ trống (ket_qua NULL) = sai. */
const SQL_CA_BANG = `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.ket_qua, s.luc, s.ngay_vn, s.muc_do, s.chuyen_de AS cd_dong, s.ma_dang AS dg, ${sqlChuyenDeKho('s')} AS cd_kho
  FROM su_kien_hoc s WHERE s.sbd IN (SELECT value FROM json_each(?1)) AND s.ngay_vn BETWEEN ?2 AND ?3 AND s.nguon IN ('thi', 'len_bang', 'dau_gio')
    AND (s.ket_qua IS NOT NULL OR s.nguon = 'thi') AND COALESCE(s.visibility, '') <> 'embargoed' AND COALESCE(s.purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc')
    AND (s.nguon <> 'thi' OR NOT EXISTS (SELECT 1 FROM ca c WHERE c.ma_ca = s.ma_nguon AND c.loai = 'baitap'))`
/** Luyện tập CŨ hơn cửa sổ 14 ngày (tới đầu cửa sổ ca thi), gộp theo (em, ngày, chuyên đề, dạng): lượt thật, không hỗ trợ, LẦN ĐẦU gặp câu gốc (không song
 *  sinh `~ss`/`~bt`/`~yd`, không lượt lặp) — cùng luật lượt luyện của `bon-ca-thi.ts`. */
const SQL_LUYEN_CU = `SELECT sbd, ngay, cd, dg, COUNT(*) AS n, SUM(kq = 1) AS d FROM (
    SELECT s.sbd, s.ngay_vn AS ngay, s.ket_qua AS kq, s.ma_dang AS dg, COALESCE(${sqlChuyenDeKho('s')}, NULLIF(TRIM(s.chuyen_de), '')) AS cd,
      ROW_NUMBER() OVER (PARTITION BY s.sbd, ${sqlQidGoc('s')} ORDER BY s.luc) AS rn
    FROM su_kien_hoc s WHERE s.sbd IN (SELECT value FROM json_each(?1)) AND s.ngay_vn BETWEEN ?2 AND ?3 AND s.nguon NOT IN ('thi', 'len_bang', 'dau_gio') AND instr(s.qid, '~') = 0
      AND ${SQL_LUOT_LAM} AND COALESCE(s.assistance, '') <> 'assisted')
  WHERE rn = 1 GROUP BY sbd, ngay, cd, dg`
/** Tỉ lệ đúng CẢ LỚP từng câu trong từng ca của 60 ngày (≥ 5 em) — hiệu chỉnh độ khó. Ca lấy từ bảng lượt thi (nhỏ) theo giờ vào. */
const SQL_DO_KHO_CA = `SELECT ma_nguon AS ma, qid, COUNT(*) AS n, SUM(COALESCE(ket_qua, 0) = 1) AS d FROM su_kien_hoc
  WHERE nguon = 'thi' AND ma_nguon IN (SELECT DISTINCT ma_ca FROM luot WHERE vao_luc >= ?1) GROUP BY ma_nguon, qid HAVING COUNT(*) >= 5`
/** Đệm độ khó ca theo cửa sổ (đổi chậm: chỉ khi có ca mới) — cron mỗi phút không đọc lại cả khối câu thi mỗi lô. */
let demDoKho: { db: unknown; khoa: string; het: number; p: Map<string, number> } | null = null
async function docDoKhoCa(env: Env, tuIso: string, nowMs: number): Promise<Map<string, number>> {
  if (demDoKho && demDoKho.db === env.DB && demDoKho.khoa === tuIso && demDoKho.het > nowMs) return demDoKho.p
  const r = await hoi(env, SQL_DO_KHO_CA, tuIso).catch(() => [] as Row[])
  const p = new Map(r.map((x) => [`${str(x.ma)}|${str(x.qid)}`, Number(x.d) / Math.max(1, Number(x.n))]))
  demDoKho = { db: env.DB, khoa: tuIso, het: nowMs + 3 * 3_600_000, p }
  return p
}
const cdThat = (x: unknown): string => { const s = str(x); return s === 'Hoá học' || s === 'Hóa học' ? '' : s }

/** Tính MỘT lô em (cùng cửa sổ 14 ngày trọn tới hôm qua; ca thi + lên bảng 60 ngày). Không ghi. */
export async function tinhLoBon(env: Env, em: readonly EmGoc[], nowMs: number): Promise<{ sbd: string; kq: KetQuaBon }[]> {
  return (await docDauVaoBon(env, em, nowMs)).map(({ sbd, dv }) => ({ sbd, kq: tinhBon(dv) }))
}

/** ĐỌC đầu vào của MỘT lô em (mọi lượt đọc song song, không ghi). Tách khỏi `tinhLoBon` (02/11) để chẩn đoán trên dữ liệu thật dùng ĐÚNG đường đọc này.
 *  `chiDoc` ⇒ bộ Học thật không tạo bảng (đo trên D1 thật chỉ đọc). */
export async function docDauVaoBon(env: Env, em: readonly EmGoc[], nowMs: number, tuy: { chiDoc?: boolean } = {}): Promise<{ sbd: string; dv: DauVaoBon }[]> {
  if (!em.length) return []
  const w = cuaSoTinh(nowMs)
  const sbds = em.map((e) => e.sbd)
  // 60 ngày trọn tới hôm qua; luyện tập cũ = phần TRƯỚC cửa sổ 14 ngày (phần trong 14 ngày đã có từng lượt từ bộ Học thật), lùi thêm NGAY_LUYEN_TOI_DA ngày
  // trước đầu cửa sổ ca thi (ca đầu cửa sổ vẫn có đủ luyện tập trước nó).
  const tuCa = congNgay7(w.cuoi, -(SO_NGAY_CA - 1)), truocTu = congNgay7(w.tu, -1), tuCu = congNgay7(tuCa, -NGAY_LUYEN_TOI_DA)
  const tuCaIso = new Date(Date.parse(tuCa + 'T00:00:00Z') - 7 * 3600_000).toISOString()
  const ds = JSON.stringify(sbds)
  const [dg, ngayEm, vao, cuoi, rHoi, rCa, rCu, doKho] = await Promise.all([
    tinhLoEm(env, sbds, nowMs, { giuDauVao: true, chiDoc: tuy.chiDoc }).catch(() => null),
    docNgayCacEm(env, em, w.tu, w.cuoi, w.homNay, []),
    docNgayVao(env, em, w.tu),
    hoi(env, 'SELECT sbd, MAX(ngay_vn) AS n FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?1)) AND ket_qua IS NOT NULL GROUP BY sbd', JSON.stringify(sbds)).catch(() => [] as Row[]),
    // v2: số lần CHỦ ĐỘNG hỏi trong cửa sổ (Hỏi thầy + hỏi trợ lý về câu) — một lệnh, song song (luật tốc độ).
    hoi(env, `SELECT sbd, SUM(n) AS n FROM (
        SELECT sbd, COUNT(*) AS n FROM loi_giai_hoi WHERE sbd IN (SELECT value FROM json_each(?1)) AND substr(luc, 1, 10) BETWEEN ?2 AND ?3 GROUP BY sbd
        UNION ALL SELECT sbd, COUNT(*) AS n FROM hoi_tro_ly WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn BETWEEN ?2 AND ?3 GROUP BY sbd) GROUP BY sbd`,
      JSON.stringify(sbds), w.tu, w.cuoi).catch(() => [] as Row[]),
    hoi(env, SQL_CA_BANG, ds, tuCa, w.cuoi).catch(() => [] as Row[]),
    truocTu >= tuCu ? hoi(env, SQL_LUYEN_CU, ds, tuCu, truocTu).catch(() => [] as Row[]) : Promise.resolve([] as Row[]),
    docDoKhoCa(env, tuCaIso, nowMs),
  ])
  const lanCuoi = new Map(cuoi.map((x) => [str(x.sbd), str(x.n)]))
  const soHoi = new Map(rHoi.map((x) => [str(x.sbd), Number(x.n) || 0]))
  // Cầu nối DẠNG → CHUYÊN ĐỀ (dòng có cả hai trong lô): lượt chặng học ghi mã dạng mà câu chưa có trong chỉ mục kho vẫn ghép được đơn vị.
  const demCau = new Map<string, Map<string, number>>()
  const noi = (dgx: unknown, cd: unknown) => { const a = str(dgx), b = cdThat(cd); if (!a || !b) return; const m = demCau.get(a) ?? new Map<string, number>(); m.set(b, (m.get(b) ?? 0) + 1); demCau.set(a, m) }
  for (const x of dg ?? []) for (const l of x.dauVao?.luot ?? []) noi(l.dg, l.dv)
  for (const x of rCu) noi(x.dg, x.cd)
  for (const x of rCa) noi(x.dg, str(x.cd_kho) || x.cd_dong)
  const cauNoi = new Map([...demCau].map(([a, m]) => [a, [...m].sort((p, q) => q[1] - p[1])[0]![0]]))
  const dvCua = (cdKho: unknown, cdDong: unknown, dgx: unknown): string | null => str(cdKho) || cdThat(cdDong) || cauNoi.get(str(dgx)) || null
  const caTheo = new Map<string, CauCaThi[]>(), bangTheo = new Map<string, LuotBang[]>(), cuTheo = new Map<string, LuyenCuDv[]>()
  const them = <T>(m: Map<string, T[]>, k: string, x: T) => { const a = m.get(k); if (a) a.push(x); else m.set(k, [x]) }
  for (const x of rCa) {
    const sbd = str(x.sbd), dv = dvCua(x.cd_kho, x.cd_dong, x.dg), nguon = str(x.nguon)
    const chung = { qid: str(x.qid), ngay: str(x.ngay_vn), luc: str(x.luc), dv }
    if (nguon === 'thi') them(caTheo, sbd, { ...chung, ma: str(x.ma_nguon), mucDo: str(x.muc_do), dung: Number(x.ket_qua) === 1, pLop: doKho.get(`${str(x.ma_nguon)}|${str(x.qid)}`) ?? null })
    else them(bangTheo, sbd, { ...chung, dat: Number(x.ket_qua) === 1, loai: nguon === 'dau_gio' ? 'dau_gio' : 'len_bang' })
  }
  for (const x of rCu) { const dv = dvCua(null, x.cd, x.dg); if (dv) them(cuTheo, str(x.sbd), { ngay: str(x.ngay), dv, n: Number(x.n) || 0, d: Number(x.d) || 0 }) }
  return em.map((e) => {
    const d = dg?.find((x) => x.sbd === e.sbd)
    const ngay = ngayDuocTinh(ngayEm.get(e.sbd) ?? [], vao.get(e.sbd) ?? w.tu).filter((n) => n.ngay <= w.cuoi)
    const dauVao = d?.dauVao ? { ...d.dauVao, luot: d.dauVao.luot.map((l) => (l.dv || !l.dg || !cauNoi.has(l.dg) ? l : { ...l, dv: cauNoi.get(l.dg)! })) } : null
    return { sbd: e.sbd, dv: { dg: d && dauVao ? { kq: d.kq, dauVao } : null, ngay, lanCuoiHoc: lanCuoi.get(e.sbd) ?? '', den: w.cuoi, hoi: soHoi.get(e.sbd) ?? 0,
      caThi: caTheo.get(e.sbd) ?? [], lenBang: bangTheo.get(e.sbd) ?? [], luyenCu: cuTheo.get(e.sbd) ?? [] } }
  })
}

/** Kết luận lưu kèm số phiên bản chữ: 2 = mỗi lý do một dòng (thầy 01/11). Bản cũ (chưa có `v: 2`) ⇒ trang bằng chứng tính lại ngay khi thầy bấm. */
const BAN_KET = 2
const ketJson = (k: KetQuaBon): string => JSON.stringify({ ...k.ketLuan, v: BAN_KET })
const ketCu = (r: Row): boolean => json<{ v?: number }>(r.ket_json, {}).v !== BAN_KET
async function ghiBon(env: Env, ds: readonly { sbd: string; kq: KetQuaBon }[], nowMs: number): Promise<void> {
  if (!ds.length) return
  const w = cuaSoTinh(nowMs), nay = new Date(nowMs).toISOString()
  await env.DB.batch(ds.map(({ sbd, kq }) => env.DB.prepare(
    `INSERT INTO bon_chi_so_em (sbd, ngay, tinh_luc, ht, dp, ch, lu, so_luot, so_lieu_json, bc_json, ket_json, the_json, ngay_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(sbd) DO UPDATE SET ngay=excluded.ngay, tinh_luc=excluded.tinh_luc, ht=excluded.ht, dp=excluded.dp, ch=excluded.ch, lu=excluded.lu, so_luot=excluded.so_luot,
       so_lieu_json=excluded.so_lieu_json, bc_json=excluded.bc_json, ket_json=excluded.ket_json, the_json=excluded.the_json, ngay_json=excluded.ngay_json`,
  ).bind(sbd, w.homNay, nay, kq.diem.ht, kq.diem.dp, kq.diem.ch, kq.diem.lu, kq.soLieu.soLuot, JSON.stringify(kq.soLieu), JSON.stringify(kq.bc), ketJson(kq), JSON.stringify(kq.the), JSON.stringify(kq.ngay))))
}

/** Một bước cron: ngoài giờ cao điểm (18:00–23:30 giờ VN không chạy), tính một lô em chưa có bản của hôm nay. */
export async function cronBonChiSo(env: Env, nowMs: number, caoDiem = false): Promise<{ chay: boolean; soEm?: number; con?: number; lyDo?: string }> {
  const g = new Date(nowMs + 7 * 3600_000)
  const phut = g.getUTCHours() * 60 + g.getUTCMinutes()
  if (caoDiem || (phut >= 18 * 60 && phut < 23 * 60 + 30)) return { chay: false, lyDo: 'cao_diem' }
  await damBaoBangBon(env)
  const w = cuaSoTinh(nowMs)
  const em = await docDanhSachEm(env, [])
  if (!em?.length) return { chay: false, lyDo: 'khong_em' }
  // bản của hôm nay VÀ đúng phiên bản bộ máy (`ban` = BAN_BON) mới coi là xong — bản cũ trong ngày được tính lại dần (01/11, đánh giá v2).
  const xong = new Set((await hoi(env, "SELECT sbd FROM bon_chi_so_em WHERE ngay = ?1 AND json_valid(so_lieu_json) AND json_extract(so_lieu_json, '$.ban') = ?2", w.homNay, BAN_BON)).map((x) => str(x.sbd)))
  const can = em.filter((e) => !xong.has(e.sbd))
  if (!can.length) return { chay: false, lyDo: 'xong' }
  const lo = can.slice(0, phut < 6 * 60 ? LO_BON_DEM : LO_BON_NGAY)
  await ghiBon(env, await tinhLoBon(env, lo, nowMs), nowMs)
  return { chay: true, soEm: lo.length, con: can.length - lo.length }
}

const diemCua = (x: Row): DiemBon => ({ ht: soHoacNull(x.ht), dp: soHoacNull(x.dp), ch: soHoacNull(x.ch), lu: soHoacNull(x.lu) })
function trungViCaLop(rows: readonly Row[]): DiemBon {
  const tv = (k: keyof DiemBon) => { const t = trungVi(rows.map((r) => soHoacNull(r[k])).filter((x): x is number => x !== null)); return t === null ? null : Math.round(t) }
  return { ht: tv('ht'), dp: tv('dp'), ch: tv('ch'), lu: tv('lu') }
}
function xepBang(rows: readonly Row[], emTheo: ReadonlyMap<string, EmGoc>, b: MaBang): DongBang[] {
  return rows
    .map((r) => ({ r, d: diemCua(r), e: emTheo.get(str(r.sbd)), vao: json<Partial<Record<MaBang, boolean>> | null>(r.vao, null) }))
    // v2: quyết định «chắc mới xếp» lưu sẵn trong số đo; bản cũ (chưa tính lại) dùng ngưỡng điểm như trước.
    .filter((x) => x.e && (x.vao ? x.vao[b] === true : vaoBang(x.d, b)))
    // v3b: em được xếp mà điểm trục ấy chưa có (bản cũ) ⇒ 0 để xếp hạng không vỡ.
    .map((x) => ({ sbd: x.e!.sbd, hoTen: x.e!.hoTen, lop: x.e!.lop, khoi: x.e!.khoi, diem: x.d[b] ?? 0, bc: json<Record<string, string>>(x.r.bc_json, {})[b] ?? '' }))
    .sort((a, c) => c.diem - a.diem || a.hoTen.localeCompare(c.hoTen, 'vi'))
}

export async function gvBonBang(env: Env, _b: Row, nowMs = Date.now()): Promise<TraLoiBonBang | LoiBon> {
  await damBaoBangBon(env)
  const w = cuaSoTinh(nowMs)
  const [em, rows] = await Promise.all([docDanhSachEm(env, []), hoi(env, "SELECT sbd, ngay, tinh_luc, ht, dp, ch, lu, bc_json, CASE WHEN json_valid(so_lieu_json) THEN json_extract(so_lieu_json, '$.vao') END AS vao FROM bon_chi_so_em")])
  if (!em) return { ok: false, error: 'Không đọc được danh sách học sinh.' }
  const emTheo = new Map(em.map((e) => [e.sbd, e]))
  const cua = rows.filter((r) => emTheo.has(str(r.sbd)))
  const bang = Object.fromEntries(THU_TU_BANG.map((b) => [b, xepBang(cua, emTheo, b)])) as Record<MaBang, DongBang[]>
  return {
    ok: true, tu: w.tu, den: w.cuoi,
    tinhLuc: cua.reduce((m, r) => (str(r.tinh_luc) > m ? str(r.tinh_luc) : m), ''),
    daTinh: cua.filter((r) => str(r.ngay) === w.homNay).length, tong: em.length,
    bang, trungVi: trungViCaLop(cua),
    // v3b (thầy 02/11 «không còn theo dõi nữa»): mọi em đều ở bảng của mình kèm lý do ⇒ khoá giữ cho app cũ, luôn rỗng.
    theoDoi: [],
  }
}

/** «Bài 7 · Fe và Cu tác dụng với HCl…» từ tên tờ + đầu đề. Thuần. */
export function tenCauNgan(tenDe: string, de: string): string {
  const bai = /^(Bài\s*\d+)/i.exec(tenDe.trim())?.[1] ?? tenDe.trim().slice(0, 24)
  const d = de.replace(/\s+/g, ' ').trim()
  const dau = d.length > 52 ? d.slice(0, 50).replace(/\s+\S*$/, '') + '…' : d
  return [bai, dau].filter(Boolean).join(' · ') || 'Câu luyện tập'
}

export async function gvBonBangEm(env: Env, b: Row, nowMs = Date.now()): Promise<TraLoiBangChung | LoiBon> {
  const sbd = str(b.sbd)
  const bangHoi = (THU_TU_BANG as readonly string[]).includes(str(b.bang)) ? (str(b.bang) as MaBang) : 'ht'
  if (!sbd) return { ok: false, error: 'Thiếu học sinh.' }
  await damBaoBangBon(env)
  const w = cuaSoTinh(nowMs)
  const [em, rows] = await Promise.all([docDanhSachEm(env, []), hoi(env, 'SELECT sbd, ngay, tinh_luc, ht, dp, ch, lu, so_luot, so_lieu_json, bc_json, ket_json, the_json, ngay_json FROM bon_chi_so_em')])
  const e = em?.find((x) => x.sbd === sbd)
  if (!em || !e) return { ok: false, error: 'Không tìm thấy học sinh này trong danh sách đang học.' }
  let r = rows.find((x) => str(x.sbd) === sbd)
  if (!r || ketCu(r)) {
    const [mot] = await tinhLoBon(env, [e], nowMs)
    if (!mot) return { ok: false, error: 'Chưa tính được số liệu của em.' }
    await ghiBon(env, [mot], nowMs)
    const k = mot.kq
    r = { sbd, ngay: w.homNay, tinh_luc: new Date(nowMs).toISOString(), ht: k.diem.ht, dp: k.diem.dp, ch: k.diem.ch, lu: k.diem.lu, so_luot: k.soLieu.soLuot, so_lieu_json: JSON.stringify(k.soLieu), bc_json: JSON.stringify(k.bc), ket_json: ketJson(k), the_json: JSON.stringify(k.the), ngay_json: JSON.stringify(k.ngay) }
    const cu = rows.findIndex((x) => str(x.sbd) === sbd)
    if (cu >= 0) rows[cu] = r
    else rows.push(r)
  }
  const emTheo = new Map(em.map((x) => [x.sbd, x]))
  const cua = rows.filter((x) => emTheo.has(str(x.sbd)))
  const ds = xepBang(cua, emTheo, bangHoi)
  const vt = ds.findIndex((x) => x.sbd === sbd)
  // «Cả lớp» của từng thẻ = trung vị cùng số đo của mọi em (khoá thẻ = khoá số đo).
  const soLieuLop = cua.map((x) => json<Partial<SoLieuBon>>(x.so_lieu_json, {}))
  const lopCua = (ma: string): number | undefined => { const t = trungVi(soLieuLop.map((s) => (s as Record<string, unknown>)[ma]).filter((v): v is number => typeof v === 'number')); return t === null ? undefined : Math.round(t) }
  const theTho = json<Record<MaBang, TheTho[]>>(r.the_json, { ht: [], dp: [], ch: [], lu: [] })[bangHoi] ?? []
  // Tên bài + đầu đề cho các ví dụ: MỘT lượt đọc kho câu + tên tờ.
  const qids = [...new Set(theTho.flatMap((t) => (t.viDu ?? []).map((v) => v.qid)).filter(Boolean))]
  const ten = new Map<string, string>()
  if (qids.length) {
    const rq = await hoi(env, `SELECT q.qid AS qid, COALESCE(d.ten_de, q.ma_de) AS ten_de, substr(COALESCE(json_extract(q.json, '$.text'), ''), 1, 160) AS de
      FROM game_v2_question q LEFT JOIN de_kho d ON d.ma_de = q.ma_de WHERE q.qid IN (SELECT value FROM json_each(?1))`, JSON.stringify(qids)).catch(() => [] as Row[])
    for (const x of rq) ten.set(str(x.qid), tenCauNgan(str(x.ten_de), str(x.de)))
  }
  const the: TheBangChung[] = theTho.map(({ viDu, ...t }) => ({
    ...t,
    ...(typeof t.so === 'number' ? { lop: lopCua(t.ma) } : {}),
    // v3: ví dụ theo ĐƠN VỊ (ca thi khớp / lệch) mang sẵn tên chuyên đề ở `cau`, không có qid.
    ...(viDu ? { viDu: viDu.map(({ qid, ...v }) => ({ ...v, cau: (qid && ten.get(qid)) || v.cau || 'Câu luyện tập' })) } : {}),
  }))
  return {
    ok: true,
    em: { sbd, hoTen: e.hoTen, lop: e.lop },
    tu: w.tu, den: w.cuoi, tinhLuc: str(r.tinh_luc),
    diem: diemCua(r), trungVi: trungViCaLop(cua),
    soLuot: Number(r.so_luot) || 0,
    bang: bangHoi,
    hang: vt >= 0 ? { thu: vt + 1, tong: ds.length } : null,
    ketLuan: json<Record<string, string>>(r.ket_json, {})[bangHoi] ?? '',
    the,
    ngay: json(r.ngay_json, []),
  }
}
