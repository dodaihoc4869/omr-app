// HÔM NAY · 4 BẢNG — PHẦN D1 (thầy chốt bản vẽ 01/11; lõi thuần bon-chi-so.ts; hợp đồng src/lib/bon-bang-kieu.ts).
//   · Tính sẵn: cron mỗi phút ngoài giờ cao điểm, mỗi lượt một lô em CHƯA có bản tính của hôm nay ⇒ bảng chỉ-thêm `bon_chi_so_em` (một dòng mỗi em, ghi đè bản
//     cũ của chính em — dữ liệu SUY RA, tính lại được từ sổ). Đọc sổ bằng ĐÚNG hai đường đã kiểm chứng: bộ xếp Học thật (`tinhLoEm`, lượt + Mức làm + KTCN)
//     và Nhịp học (`docNgayCacEm` + `docNgayVao` + `ngayDuocTinh`: mức ngày / đã làm, ngày vào app, ngày bảo trì).
//   · `/gv/bon-bang`: MỘT lượt đọc bảng + danh sách em ⇒ 4 bảng đã xếp + trung vị cả lớp.
//   · `/gv/bon-bang/em`: bản tính của một em (chưa có ⇒ tính ngay rồi lưu) + hạng + «cả lớp» từng thẻ + tên bài / đầu đề của các ví dụ.
// Không gửi gì cho học sinh / phụ huynh; không đụng bảng nào khác.
import type { Env } from './kieu'
import { docDanhSachEm, docNgayCacEm, type EmGoc } from './bai-hang-ngay'
import { docNgayVao, ngayDuocTinh } from './nhip-hoc'
import { cuaSoTinh, tinhLoEm } from './danh-gia-hoc-that-d1'
import { BAN_BON, tinhBon, trungVi, vaoBang, type KetQuaBon, type SoLieuBon, type TheTho } from './bon-chi-so'
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

/** Tính MỘT lô em (cùng cửa sổ 14 ngày trọn tới hôm qua). Không ghi. */
export async function tinhLoBon(env: Env, em: readonly EmGoc[], nowMs: number): Promise<{ sbd: string; kq: KetQuaBon }[]> {
  if (!em.length) return []
  const w = cuaSoTinh(nowMs)
  const sbds = em.map((e) => e.sbd)
  const [dg, ngayEm, vao, cuoi, rHoi] = await Promise.all([
    tinhLoEm(env, sbds, nowMs, { giuDauVao: true }).catch(() => null),
    docNgayCacEm(env, em, w.tu, w.cuoi, w.homNay, []),
    docNgayVao(env, em, w.tu),
    hoi(env, 'SELECT sbd, MAX(ngay_vn) AS n FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?1)) AND ket_qua IS NOT NULL GROUP BY sbd', JSON.stringify(sbds)).catch(() => [] as Row[]),
    // v2: số lần CHỦ ĐỘNG hỏi trong cửa sổ (Hỏi thầy + hỏi trợ lý về câu) — một lệnh, song song (luật tốc độ).
    hoi(env, `SELECT sbd, SUM(n) AS n FROM (
        SELECT sbd, COUNT(*) AS n FROM loi_giai_hoi WHERE sbd IN (SELECT value FROM json_each(?1)) AND substr(luc, 1, 10) BETWEEN ?2 AND ?3 GROUP BY sbd
        UNION ALL SELECT sbd, COUNT(*) AS n FROM hoi_tro_ly WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn BETWEEN ?2 AND ?3 GROUP BY sbd) GROUP BY sbd`,
      JSON.stringify(sbds), w.tu, w.cuoi).catch(() => [] as Row[]),
  ])
  const lanCuoi = new Map(cuoi.map((x) => [str(x.sbd), str(x.n)]))
  const soHoi = new Map(rHoi.map((x) => [str(x.sbd), Number(x.n) || 0]))
  return em.map((e) => {
    const d = dg?.find((x) => x.sbd === e.sbd)
    const ngay = ngayDuocTinh(ngayEm.get(e.sbd) ?? [], vao.get(e.sbd) ?? w.tu).filter((n) => n.ngay <= w.cuoi)
    return { sbd: e.sbd, kq: tinhBon({ dg: d && d.dauVao ? { kq: d.kq, dauVao: d.dauVao } : null, ngay, lanCuoiHoc: lanCuoi.get(e.sbd) ?? '', den: w.cuoi, hoi: soHoi.get(e.sbd) ?? 0 }) }
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
    .map((x) => ({ sbd: x.e!.sbd, hoTen: x.e!.hoTen, lop: x.e!.lop, khoi: x.e!.khoi, diem: x.d[b] as number, bc: json<Record<string, string>>(x.r.bc_json, {})[b] ?? '' }))
    .sort((a, c) => c.diem - a.diem || a.hoTen.localeCompare(c.hoTen, 'vi'))
}

export async function gvBonBang(env: Env, _b: Row, nowMs = Date.now()): Promise<TraLoiBonBang | LoiBon> {
  await damBaoBangBon(env)
  const w = cuaSoTinh(nowMs)
  const [em, rows] = await Promise.all([docDanhSachEm(env, []), hoi(env, "SELECT sbd, ngay, tinh_luc, ht, dp, ch, lu, bc_json, CASE WHEN json_valid(so_lieu_json) THEN json_extract(so_lieu_json, '$.vao') END AS vao, CASE WHEN json_valid(so_lieu_json) THEN json_extract(so_lieu_json, '$.theoDoi') END AS theo_doi FROM bon_chi_so_em")])
  if (!em) return { ok: false, error: 'Không đọc được danh sách học sinh.' }
  const emTheo = new Map(em.map((e) => [e.sbd, e]))
  const cua = rows.filter((r) => emTheo.has(str(r.sbd)))
  const bang = Object.fromEntries(THU_TU_BANG.map((b) => [b, xepBang(cua, emTheo, b)])) as Record<MaBang, DongBang[]>
  return {
    ok: true, tu: w.tu, den: w.cuoi,
    tinhLuc: cua.reduce((m, r) => (str(r.tinh_luc) > m ? str(r.tinh_luc) : m), ''),
    daTinh: cua.filter((r) => str(r.ngay) === w.homNay).length, tong: em.length,
    bang, trungVi: trungViCaLop(cua),
    // v2: em CÓ dấu hiệu nhưng CHƯA đủ chắc để xếp — không vào bảng nào (thà theo dõi thêm còn hơn xếp sai).
    theoDoi: cua.filter((r) => str(r.theo_doi) && emTheo.has(str(r.sbd)))
      .map((r) => { const e = emTheo.get(str(r.sbd))!; return { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, khoi: e.khoi, diem: 0, bc: str(r.theo_doi) } })
      .sort((a, c) => a.hoTen.localeCompare(c.hoTen, 'vi')),
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
    ...(viDu ? { viDu: viDu.map(({ qid, ...v }) => ({ ...v, cau: ten.get(qid) ?? 'Câu luyện tập' })) } : {}),
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
