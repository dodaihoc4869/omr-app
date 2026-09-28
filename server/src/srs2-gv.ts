// THUẬT TOÁN 2.0 — LỆNH CỦA THẦY `/gv/chien-dich` (nằm SAU cổng `laThay`).
//   action: co-doc | co-luu | danh-sach | suc-chua | tao | dong | huy | bang | buoi-chua | chua-xong
// Vòng khép kín: Kết thúc ca kiểm tra → Giao chiến dịch (có đồng hồ sức chứa) → Bảng chiến dịch khi đang chạy →
// Buổi chữa khi hết hạn nộp → "Chữa xong" (câu cần dạy lại quay về Đoàn Hộ Tống hôm sau).
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from './cam-tu-luan'
import { khoiLuongCan, phatLaiCau, soNgayConLai, sucChua, congNgay, TRAN_NGAY, type LanLam, type TrangThaiCau } from './srs2-loi'
import { docChienDichTuDong, docCoHoa2Tu, docMetaCau, KHOA_CO_HOA2, ngayVnCua, type ChienDich } from './srs2-d1'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const mangChuoi = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).map((x) => x.trim()).filter(Boolean) : [])
const NGAY = /^\d{4}-\d{2}-\d{2}$/

export async function gvChienDich(env: Env, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  const action = str(b.action) || 'danh-sach'
  try {
    if (action === 'co-doc') return coDoc(env)
    if (action === 'co-luu') return coLuu(env, b, nowMs)
    if (action === 'danh-sach') return danhSach(env, nowMs)
    if (action === 'suc-chua') return tinhSucChua(env, b, nowMs)
    if (action === 'ds-em') return dsEm(env)
    if (action === 'tao') return tao(env, b, nowMs)
    if (action === 'dong' || action === 'huy') return doiTrangThai(env, str(b.id), action === 'dong' ? 'da_dong' : 'da_huy', nowMs)
    if (action === 'bang') return bang(env, str(b.id), nowMs)
    if (action === 'buoi-chua') return buoiChua(env, str(b.id), nowMs, mangChuoi(b.coMat))
    if (action === 'chua-xong') return chuaXong(env, str(b.id), mangChuoi(b.qids), nowMs)
    return { ok: false, error: 'Hành động không hợp lệ.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ---------------------------------------------------------------- công tắc
async function coDoc(env: Env) {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CO_HOA2).first<{ gia_tri: string }>().catch(() => null)
  return { ok: true, co: docCoHoa2Tu(r?.gia_tri) }
}
async function coLuu(env: Env, b: Row, nowMs: number) {
  const co = { bat: b.bat === true, lop: mangChuoi(b.lop), sbd: mangChuoi(b.sbd) }
  await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(KHOA_CO_HOA2, JSON.stringify(co), new Date(nowMs).toISOString()).run()
  return { ok: true, co }
}

// ---------------------------------------------------------------- đọc chung
async function docMot(env: Env, id: string): Promise<ChienDich> {
  const r = await env.DB.prepare('SELECT * FROM chien_dich WHERE id = ?').bind(id).first<Row>()
  if (!r) throw new Error('Không tìm thấy chiến dịch.')
  return docChienDichTuDong(r)
}
/** Danh sách học sinh (đang học) cho bộ chọn khối → lớp → em ở màn giao — CÙNG bảng `emCuaLop` dùng, không phụ thuộc bộ nhớ máy thầy. */
async function dsEm(env: Env) {
  const r = await env.DB.prepare("SELECT sbd, ho_ten, lop FROM hoc_sinh WHERE COALESCE(trang_thai,'') <> 'khoa' AND COALESCE(lop,'') <> '' ORDER BY lop, ho_ten").all<Row>()
  return { ok: true, em: (r.results ?? []).map((x) => ({ sbd: str(x.sbd), hoTen: str(x.ho_ten), lop: str(x.lop) })) }
}
async function emCuaLop(env: Env, lop: string): Promise<string[]> {
  const r = await env.DB.prepare("SELECT sbd FROM hoc_sinh WHERE COALESCE(lop,'') = ? AND COALESCE(trang_thai,'') <> 'khoa' ORDER BY sbd").bind(lop).all<Row>()
  return (r.results ?? []).map((x) => str(x.sbd))
}
async function tenEm(env: Env, ds: readonly string[]): Promise<Map<string, string>> {
  if (!ds.length) return new Map()
  const r = await env.DB.prepare('SELECT sbd, ho_ten FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ds)).all<Row>()
  return new Map((r.results ?? []).map((x) => [str(x.sbd), str(x.ho_ten) || str(x.sbd)]))
}
/** Mã tờ thầy chọn có thể là tờ ĐÃ TÁCH theo phần (`<gốc>-TN|-DS|-TLN`, như màn Mở ca): tách ra mã gốc (khoá `game_v2_question.ma_de`) + phần. */
const PHAN_THEO_HAU_TO: Record<string, 'I' | 'II' | 'III'> = { TN: 'I', DS: 'II', TLN: 'III' }
export function tachMaTo(maDe: string): { goc: string; phan: 'I' | 'II' | 'III' | null } {
  const m = maDe.trim().match(/^(.*)-(TN|DS|TLN)$/)
  return m ? { goc: m[1]!, phan: PHAN_THEO_HAU_TO[m[2]!]! } : { goc: maDe.trim(), phan: null }
}
export const maGocCuaTo = (maDe: readonly string[]): string[] => [...new Set(maDe.map((m) => tachMaTo(m).goc))]
/**
 * Câu hợp lệ của các tờ đề (đã duyệt, bỏ tự luận), theo thứ tự tờ rồi thứ tự câu trong tờ; câu trùng giữa các tờ chỉ tính MỘT lần (tờ đứng trước giữ).
 * `theoTo`: số câu dùng được mà MỖI tờ góp vào (sau khi bỏ trùng) — cộng lại đúng bằng `qids.length`, để màn giao hiện số từng tờ khớp tổng.
 */
async function cauCuaToChiTiet(env: Env, maDe: readonly string[]): Promise<{ qids: string[]; theoTo: Record<string, number> }> {
  const r = await env.DB.prepare('SELECT ma_de, qid, json FROM game_v2_question WHERE ma_de IN (SELECT value FROM json_each(?)) ORDER BY rowid').bind(JSON.stringify(maGocCuaTo(maDe))).all<Row>()
  const theoGoc = new Map<string, { qid: string; phan: string }[]>()
  for (const x of r.results ?? []) {
    let q: PrivateQuestion
    try { q = JSON.parse(str(x.json)) as PrivateQuestion } catch { continue }
    if (!q.reviewed || laCauTuLuan(q)) continue
    const k = str(x.ma_de)
    theoGoc.set(k, [...(theoGoc.get(k) ?? []), { qid: str(x.qid), phan: str(q.phan) }])
  }
  const qids: string[] = [], da = new Set<string>(), theoTo: Record<string, number> = {}
  for (const m of maDe) {
    const { goc, phan } = tachMaTo(m)
    let n = 0
    for (const c of theoGoc.get(goc) ?? []) if ((!phan || c.phan === phan) && !da.has(c.qid)) { da.add(c.qid); qids.push(c.qid); n++ }
    theoTo[m] = (theoTo[m] ?? 0) + n
  }
  return { qids, theoTo }
}
async function cauCuaTo(env: Env, maDe: readonly string[]): Promise<string[]> {
  return (await cauCuaToChiTiet(env, maDe)).qids
}
/** Lần làm của CẢ LỚP với các câu (một truy vấn), nhóm theo em. */
async function lanLamCaLop(env: Env, sbd: readonly string[], qids: readonly string[]): Promise<Map<string, LanLam[]>> {
  const ra = new Map<string, LanLam[]>()
  if (!sbd.length || !qids.length) return ra
  let rows: Row[]
  try {
    rows = (await env.DB.prepare(`SELECT sbd, qid, ngay_vn, luc, ket_qua, assistance, visibility FROM su_kien_hoc
        WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(sbd), JSON.stringify(qids)).all<Row>()).results ?? []
  } catch {
    rows = (await env.DB.prepare(`SELECT sbd, qid, ngay_vn, luc, ket_qua FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))`)
      .bind(JSON.stringify(sbd), JSON.stringify(qids)).all<Row>()).results ?? []
  }
  for (const x of rows) {
    if (str(x.visibility) === 'embargoed') continue
    const k = str(x.sbd)
    ra.set(k, [...(ra.get(k) ?? []), { qid: str(x.qid), ngay: str(x.ngay_vn), luc: str(x.luc), dung: Number(x.ket_qua) === 1, coGoiY: str(x.assistance) === 'assisted' }])
  }
  return ra
}
async function mocDayLaiCaLop(env: Env, sbd: readonly string[]): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  if (!sbd.length) return ra
  const r = await env.DB.prepare('SELECT sbd, qid, luc FROM srs2_day_lai WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sbd)).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const k = `${str(x.sbd)}|${str(x.qid)}`
    ra.set(k, [...(ra.get(k) ?? []), str(x.luc)])
  }
  return ra
}
/** Trạng thái từng (em, câu) của một chiến dịch. */
async function trangThaiLop(env: Env, sbd: readonly string[], qids: readonly string[], hanNop: string | null): Promise<Map<string, Map<string, TrangThaiCau>>> {
  const [lan, moc] = await Promise.all([lanLamCaLop(env, sbd, qids), mocDayLaiCaLop(env, sbd)])
  const ra = new Map<string, Map<string, TrangThaiCau>>()
  for (const em of sbd) {
    const cua = lan.get(em) ?? []
    const theoQid = new Map<string, LanLam[]>()
    for (const x of cua) theoQid.set(x.qid, [...(theoQid.get(x.qid) ?? []), x])
    ra.set(em, new Map(qids.map((q) => [q, phatLaiCau(q, theoQid.get(q) ?? [], hanNop, moc.get(`${em}|${q}`) ?? [])])))
  }
  return ra
}
const trungVi = (ds: number[]): number => {
  if (!ds.length) return 0
  const s = [...ds].sort((a, b) => a - b)
  const g = Math.floor(s.length / 2)
  return s.length % 2 ? s[g]! : Math.round((s[g - 1]! + s[g]!) / 2)
}

// ---------------------------------------------------------------- danh sách, sức chứa, tạo
async function danhSach(env: Env, nowMs: number) {
  const r = await env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' ORDER BY tao_luc DESC LIMIT 100").all<Row>()
  const homNay = ngayVnCua(nowMs)
  return { ok: true, homNay, chienDich: (r.results ?? []).map(docChienDichTuDong).map(({ qids, sbd, ...c }) => ({ ...c, soCau: qids.length, soEm: sbd.length, hetHan: c.hanNop < homNay })) }
}

export const THE_LUC_TOI_DA = 500
/**
 * THỂ LỰC TỰ ĐỘNG (nút gạt "Tự động" ở màn giao): số lượt/ngày NHỎ NHẤT bảo đảm mục tiêu tới hạn nộp —
 * em ở giữa lớp ở vùng vừa sức (≤ 70% sức chứa) VÀ không em nào quá tải (em nặng nhất ≤ 100%). Tối thiểu 10.
 */
export function theLucDeXuat(klGiua: number, klNangNhat: number, D: number): number {
  if (D <= 0) return THE_LUC_TOI_DA
  return Math.min(THE_LUC_TOI_DA, Math.max(10, Math.ceil(klGiua / (0.7 * D)), Math.ceil(klNangNhat / D)))
}

interface DauVaoGiao { ten: string; lop: string | null; sbd: string[]; maDe: string[]; hanNop: string; theLucNgay: number; huyetChien: boolean; maCa: string | null }
async function docDauVao(env: Env, b: Row): Promise<DauVaoGiao> {
  const lop = str(b.lop).trim() || null
  const sbd = mangChuoi(b.sbd).length ? mangChuoi(b.sbd) : lop ? await emCuaLop(env, lop) : []
  const maDe = mangChuoi(b.maDe)
  const hanNop = str(b.hanNop)
  if (!sbd.length) throw new Error('Chưa chọn em nào.')
  if (!maDe.length) throw new Error('Chưa chọn tờ đề nào.')
  if (!NGAY.test(hanNop)) throw new Error('Hạn nộp phải là ngày dạng YYYY-MM-DD.')
  // Thầy 28/09: "thể lực một ngày cho tôi điền con số bất kì" ⇒ chỉ chặn số vô nghĩa (≥ 1, ≤ 500 lượt/ngày).
  const theLucNgay = Math.max(1, Math.min(THE_LUC_TOI_DA, Math.floor(Number(b.theLucNgay) || TRAN_NGAY)))
  return { ten: str(b.ten).trim() || 'Chiến dịch luyện', lop, sbd, maDe, hanNop, theLucNgay, huyetChien: b.huyetChien !== false, maCa: str(b.maCa).trim() || null }
}

/** Đồng hồ sức chứa: khối lượng lượt cần của em ở giữa lớp so với D × thể lực/ngày; kèm hai gợi ý đưa về ≤ 70%. */
async function tinhSucChua(env: Env, b: Row, nowMs: number) {
  const dv = await docDauVao(env, b)
  const { qids, theoTo } = await cauCuaToChiTiet(env, dv.maDe)
  const homNay = ngayVnCua(nowMs)
  if (dv.hanNop < homNay) throw new Error('Hạn nộp đã qua.')
  const D = soNgayConLai(homNay, dv.hanNop)
  const tt = await trangThaiLop(env, dv.sbd, qids, dv.hanNop)
  const khoiLuong = dv.sbd.map((em) => khoiLuongCan([...tt.get(em)!.values()]))
  const kl = trungVi(khoiLuong)
  // Tách lượt của EM Ở GIỮA LỚP thành "câu mới × 2" + "lượt ôn" để thầy đọc được vì sao ra số lượt (chỉ khi có em đúng bằng trung vị).
  const emGiua = dv.sbd.find((_, i) => khoiLuong[i] === kl)
  const tachGiua = emGiua === undefined ? null : (() => {
    const ds = [...tt.get(emGiua)!.values()].filter((t) => !t.catTia && !t.thanhThao)
    const cauMoi = ds.filter((t) => t.laMoi).length
    return { cauMoi, luotOn: kl - 2 * cauMoi }
  })()
  const sc = sucChua(kl, D, dv.theLucNgay)
  const tran = D * dv.theLucNgay
  const soBo = Math.max(0, Math.ceil((kl - 0.7 * tran) / 2))
  const Dmoi = Math.ceil(kl / (0.7 * dv.theLucNgay))
  return {
    ok: true, soCau: qids.length, theLucDeXuat: theLucDeXuat(kl, Math.max(0, ...khoiLuong), D), soCauTheoTo: theoTo, soEm: dv.sbd.length, D, sucChua: tran, khoiLuongTrungVi: kl, tachGiua, tiLe: sc.tiLe, muc: sc.muc,
    soEmQuaTai: khoiLuong.filter((x) => x > tran).length,
    goiY: sc.muc === 'xanh' ? null : {
      rutCon: soBo > 0 && soBo < qids.length ? { soCau: qids.length - soBo, tiLe: (kl - 2 * soBo) / tran } : null,
      luiHan: Dmoi > D ? { hanNop: congNgay(homNay, Dmoi - 1), tiLe: kl / (Dmoi * dv.theLucNgay) } : null,
    },
  }
}

async function tao(env: Env, b: Row, nowMs: number) {
  const dv = await docDauVao(env, b)
  let qids = await cauCuaTo(env, dv.maDe)
  const rutCon = Math.floor(Number(b.rutCon) || 0)
  if (rutCon > 0 && rutCon < qids.length) {
    // "Rút còn N câu, giữ câu cả lớp sai nhiều": ưu tiên câu nhiều em chưa thành thạo; hoà thì giữ thứ tự tờ đề.
    const tt = await trangThaiLop(env, dv.sbd, qids, dv.hanNop)
    const diem = new Map(qids.map((q) => [q, dv.sbd.filter((em) => !tt.get(em)!.get(q)!.thanhThao).length]))
    const giu = new Set([...qids].sort((a, c) => diem.get(c)! - diem.get(a)! || qids.indexOf(a) - qids.indexOf(c)).slice(0, rutCon))
    qids = qids.filter((q) => giu.has(q))
  }
  if (!qids.length) throw new Error('Các tờ đề đã chọn không có câu dùng được (câu chưa duyệt hoặc tự luận đã được bỏ).')
  const id = crypto.randomUUID()
  await env.DB.prepare(`INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, trang_thai)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'dang_chay')`)
    .bind(id, dv.ten, dv.lop, JSON.stringify(dv.sbd), JSON.stringify(maGocCuaTo(dv.maDe)), JSON.stringify(qids), dv.hanNop, dv.theLucNgay, dv.huyetChien ? 1 : 0, dv.maCa, new Date(nowMs).toISOString()).run()
  return { ok: true, id, soCau: qids.length, soEm: dv.sbd.length }
}

async function doiTrangThai(env: Env, id: string, trangThai: 'da_dong' | 'da_huy', nowMs: number) {
  const r = await env.DB.prepare('UPDATE chien_dich SET trang_thai = ?, dong_luc = ? WHERE id = ?').bind(trangThai, new Date(nowMs).toISOString(), id).run()
  if (!r.meta.changes) throw new Error('Không tìm thấy chiến dịch.')
  return { ok: true }
}

// ---------------------------------------------------------------- bảng chiến dịch
async function bang(env: Env, id: string, nowMs: number) {
  const cd = await docMot(env, id)
  const homNay = ngayVnCua(nowMs)
  const [tt, ten, meta] = await Promise.all([trangThaiLop(env, cd.sbd, cd.qids, cd.hanNop), tenEm(env, cd.sbd), docMetaCau(env, cd.qids, cd.maDe)])
  const dangTheoQid = new Map(cd.qids.map((q) => [q, meta.get(q)?.tenDang ?? meta.get(q)?.dang ?? 'Chưa gắn dạng']))
  const dang = [...new Set(dangTheoQid.values())]
  const kh = await env.DB.prepare('SELECT sbd, huyet_chien FROM srs2_ke_hoach WHERE ngay = ? AND sbd IN (SELECT value FROM json_each(?))').bind(homNay, JSON.stringify(cd.sbd)).all<Row>().catch(() => ({ results: [] as Row[] }))
  const huyet = new Set((kh.results ?? []).filter((x) => Number(x.huyet_chien) === 1).map((x) => str(x.sbd)))
  const em = cd.sbd.map((s) => {
    const m = tt.get(s)!
    const ds = [...m.values()]
    const ngayCuoi = ds.flatMap((t) => t.lichSu.map((l) => l.ngay)).sort().pop() ?? null
    const theoDang = Object.fromEntries(dang.map((d) => {
      const cua = cd.qids.filter((q) => dangTheoQid.get(q) === d).map((q) => m.get(q)!)
      return [d, cua.length ? cua.filter((t) => t.thanhThao).length / cua.length : null]
    }))
    return {
      sbd: s, ten: ten.get(s) ?? s, coXat: ds.filter((t) => !t.laMoi).length, thanhThao: ds.filter((t) => t.thanhThao).length, canDayLai: ds.filter((t) => t.catTia).length,
      treNhip: ngayCuoi ? Math.max(0, Math.round((Date.parse(homNay) - Date.parse(ngayCuoi)) / 86_400_000) - 1) : null, huyetChien: huyet.has(s), theoDang,
    }
  })
  const canDayLai = cd.qids.map((q) => ({ qid: q, stt: cd.qids.indexOf(q) + 1, dang: dangTheoQid.get(q), soEm: cd.sbd.filter((s) => tt.get(s)!.get(q)!.catTia).length }))
    .filter((x) => x.soEm > 0).sort((a, b) => b.soEm - a.soEm)
  const tong = cd.qids.length * Math.max(1, cd.sbd.length)
  return {
    ok: true, chienDich: { ...cd, qids: undefined, sbd: undefined, soCau: cd.qids.length, soEm: cd.sbd.length }, homNay, hetHan: cd.hanNop < homNay,
    lop: { coXat: em.reduce((s, x) => s + x.coXat, 0) / tong, thanhThao: em.reduce((s, x) => s + x.thanhThao, 0) / tong, huyetChien: huyet.size, canDayLaiCau: canDayLai.length, canDayLaiLuot: canDayLai.reduce((s, x) => s + x.soEm, 0) },
    dang, em, canDayLai,
  }
}

// ---------------------------------------------------------------- buổi chữa
/** Điểm chữa của câu = số em chưa thành thạo + 2 × số em cần thầy dạy lại. Mỗi dạng một câu đại diện (điểm cao nhất). */
async function buoiChua(env: Env, id: string, nowMs: number, coMat: string[]) {
  const cd = await docMot(env, id)
  const em = coMat.length ? cd.sbd.filter((s) => coMat.includes(s)) : cd.sbd
  const [tt, ten, meta] = await Promise.all([trangThaiLop(env, em, cd.qids, cd.hanNop), tenEm(env, em), docMetaCau(env, cd.qids, cd.maDe)])
  const cau = cd.qids.map((q) => {
    const chua = em.filter((s) => !tt.get(s)!.get(q)!.thanhThao)
    const dayLai = em.filter((s) => tt.get(s)!.get(q)!.catTia)
    const m = meta.get(q)
    return { qid: q, stt: cd.qids.indexOf(q) + 1, dang: m?.tenDang ?? m?.dang ?? 'Chưa gắn dạng', phan: m?.phan ?? 'I', mucDo: m?.mucDo ?? null, soChuaThanhThao: chua.length, soCanDayLai: dayLai.length, diemChua: chua.length + 2 * dayLai.length, emSua: [...dayLai, ...chua.filter((s) => !dayLai.includes(s))] }
  })
  const theoDang = new Map<string, (typeof cau)[number]>()
  for (const c of cau) {
    if (c.diemChua <= 0) continue
    const cu = theoDang.get(c.dang)
    if (!cu || c.diemChua > cu.diemChua) theoDang.set(c.dang, c)
  }
  const chon = [...theoDang.values()].sort((a, b) => b.diemChua - a.diemChua)
  // Người giải mẫu: em thành thạo nhiều câu nhất trong dạng đó (không trùng một em cho mọi câu nếu còn em khác).
  const daGiaiMau = new Map<string, number>()
  const deXuat = chon.map((c) => {
    const cungDang = cd.qids.filter((q) => (meta.get(q)?.tenDang ?? meta.get(q)?.dang ?? 'Chưa gắn dạng') === c.dang)
    const giaiMau = [...em].filter((s) => tt.get(s)!.get(c.qid)!.thanhThao)
      .sort((a, b) => (daGiaiMau.get(a) ?? 0) - (daGiaiMau.get(b) ?? 0) || cungDang.filter((q) => tt.get(b)!.get(q)!.thanhThao).length - cungDang.filter((q) => tt.get(a)!.get(q)!.thanhThao).length)[0] ?? null
    if (giaiMau) daGiaiMau.set(giaiMau, (daGiaiMau.get(giaiMau) ?? 0) + 1)
    return { ...c, giaiMau: giaiMau ? { sbd: giaiMau, ten: ten.get(giaiMau) ?? giaiMau } : null, emSua: c.emSua.map((s) => ({ sbd: s, ten: ten.get(s) ?? s })) }
  })
  const tong = cd.qids.length * Math.max(1, em.length)
  let coXat = 0, thanhThao = 0
  for (const s of em) for (const t of tt.get(s)!.values()) { if (!t.laMoi) coXat++; if (t.thanhThao) thanhThao++ }
  return { ok: true, chienDich: { id: cd.id, ten: cd.ten, hanNop: cd.hanNop, lop: cd.lop }, hetHan: cd.hanNop < ngayVnCua(nowMs), soEm: em.length, lop: { coXat: coXat / tong, thanhThao: thanhThao / tong }, cau: deXuat }
}

/** "Chữa xong": câu đã chữa trên lớp ⇒ đếm sai về 0 cho em đang cần dạy lại câu đó; câu vào Đoàn Hộ Tống từ hôm sau. */
async function chuaXong(env: Env, id: string, qids: string[], nowMs: number) {
  const cd = await docMot(env, id)
  const ds = qids.length ? qids.filter((q) => cd.qids.includes(q)) : cd.qids
  const tt = await trangThaiLop(env, cd.sbd, ds, cd.hanNop)
  const luc = new Date(nowMs).toISOString()
  const lenh: ReturnType<Env['DB']['prepare']>[] = []
  for (const s of cd.sbd) for (const q of ds) if (tt.get(s)!.get(q)!.catTia) lenh.push(env.DB.prepare('INSERT OR IGNORE INTO srs2_day_lai (sbd, qid, luc, chien_dich_id) VALUES (?,?,?,?)').bind(s, q, luc, cd.id))
  for (let i = 0; i < lenh.length; i += 50) await env.DB.batch(lenh.slice(i, i + 50))
  return { ok: true, soLuot: lenh.length, ngayOnLai: congNgay(ngayVnCua(nowMs), 1) }
}

