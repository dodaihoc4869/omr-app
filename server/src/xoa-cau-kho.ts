// XOÁ CÂU KHỎI KHO (thầy 03/11, nguyên văn: «10 câu kia xoá luôn khỏi kho nhé» — 10 câu Phần III có đáp án kho dài quá 8 kí tự, máy không chấm / không soạn được).
// Kho chỉ có xoá cả tờ (xoá mềm `de_kho.da_xoa`), không có xoá một câu ⇒ lệnh này bỏ ĐÚNG các câu ấy khỏi gói R2 của tờ:
//   · CHÉP LƯU gói cũ sang R2 `kho-luu/<mã đề>/<giờ>.json` + dòng CHỈ-THÊM `kho_xoa_cau` TRƯỚC khi ghi ⇒ lùi được (chép gói lưu về chỗ cũ).
//   · Cổng như sửa đáp án kho (`kiemCong`): ca thi mở · câu bảo vệ (ca chưa công bố / đang làm / BTVN chấm điểm) · chặng kiểm tra cá nhân đang làm ⇒ từ chối, không ghi gì.
//   · Gói mới phải qua `normalizeBank`: đúng các câu đó biến mất, mọi câu khác còn nguyên (qid theo `so` / `qid`, không đánh số lại).
//   · Ghi R2 có điều kiện etag ⇒ `de_kho.cap_nhat_luc` mới ⇒ dựng lại chỉ mục game (`dongBoCacTo`) + chỉ mục lời giải (`ghiCauVaoHang`).
// `chayThu` (mặc định khi không có `qids`): chỉ liệt kê câu Phần III đáp án dài quá 8 kí tự (qid + độ dài, không in đáp án).
import type { Env } from './kieu'
import { dongBoCacTo, normalizeBank, xoaDemSync } from './game-v2-bank'
import { kiemCong } from './sua-dap-an-kho'
import { ghiCauVaoHang } from './loi-giai'
import { cauTrongGoi, loaiCau } from '../../src/lib/loi-giai-kiem'
import { laCauTuLuan, laMaDeTuLuan } from '../../src/lib/cau-tu-luan'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

export const SQL_BANG_XOA_CAU: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS kho_xoa_cau (id TEXT PRIMARY KEY, ma_de TEXT NOT NULL, qid TEXT NOT NULL, khoa_luu TEXT NOT NULL, ly_do TEXT, luc TEXT NOT NULL)`,
]

/** qid của một phần tử gói — đúng cách `normalizeBank` sinh (khuôn `cau[]`: c.qid hoặc `{ma_de}-{phan}-{so}`; khuôn cũ: c.id ?? c.qid). */
function qidPhanTu(goi: Obj, c: unknown, phan?: string): string {
  if (!laObj(c)) return ''
  if (Array.isArray(goi.cau)) return (typeof c.qid === 'string' && c.qid) || `${str(goi.ma_de)}-${str(c.phan)}-${str(c.so)}`
  return str(c.id ?? c.qid) || (phan ? '' : '')
}
function boKhoiGoi(goi: Obj, xoa: Set<string>): { goi: Obj; bo: string[] } {
  const bo: string[] = []
  if (Array.isArray(goi.cau)) {
    const cau = (goi.cau as unknown[]).filter((c) => { const q = qidPhanTu(goi, c); if (xoa.has(q)) { bo.push(q); return false } return true })
    return { goi: { ...goi, cau }, bo }
  }
  const moi: Obj = { ...goi }
  for (const p of ['I', 'II', 'III']) {
    const ds = goi[`phan${p}`]
    if (!Array.isArray(ds)) continue
    moi[`phan${p}`] = ds.filter((c) => { const q = qidPhanTu(goi, c, p); if (xoa.has(q)) { bo.push(q); return false } return true })
  }
  return { goi: moi, bo }
}

/** Câu Phần III đáp án kho dài quá 8 kí tự (không tự luận) trong các tờ đang dùng — đúng diện `thieu-chi-tiet` báo. */
async function timCauDapAnDai(env: Env): Promise<{ maDe: string; qid: string; doDai: number }[]> {
  const r = await env.DB.prepare(`SELECT q.qid, q.ma_de FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
    WHERE COALESCE(d.da_xoa, 0) = 0 AND json_extract(q.json, '$.phan') = 'III' AND q.qid NOT IN (SELECT qid FROM loi_giai_cau) LIMIT 2000`).all<Obj>()
  const theoDe = new Map<string, Set<string>>()
  for (const x of r.results ?? []) { const m = str(x.ma_de); if (laMaDeTuLuan(m)) continue; (theoDe.get(m) ?? theoDe.set(m, new Set()).get(m)!).add(str(x.qid)) }
  const ra: { maDe: string; qid: string; doDai: number }[] = []
  for (const [maDe, qids] of theoDe) {
    const o = await env.DE.get(`kho/${maDe}.json`).catch(() => null)
    const goi = o ? await new Response(o.body).json().catch(() => null) : null
    for (const c of cauTrongGoi(maDe, goi)) {
      if (!qids.has(c.qid) || loaiCau(c)) continue
      const tho = { kieu: c.kieu, phan: c.phan, de: c.de, pa: undefined, y: undefined, dap_an: c.dapAn, hinh: c.hinh.map((h) => ({ viTri: h.viTri, src: h.duLieu })) }
      if (laCauTuLuan(tho, c.phan)) continue
      if (c.phan === 'III' && c.dapAn && c.dapAn.length > 8) ra.push({ maDe, qid: c.qid, doDai: c.dapAn.length })
    }
  }
  return ra
}

export async function xoaCauKho(env: Env, b: Obj, nowMs = Date.now()) {
  const ds = await timCauDapAnDai(env)
  const muon = new Set((Array.isArray(b.qids) ? b.qids : []).map(str).filter(Boolean))
  if (!muon.size) return { ok: true, chayThu: true, so: ds.length, cau: ds }
  // Chỉ xoá câu NẰM TRONG diện đã báo thầy (Phần III đáp án dài, không tự luận) — qid khác bị bỏ qua, không xoá nhầm.
  const chon = ds.filter((x) => muon.has(x.qid))
  const tuChoi = [...muon].filter((q) => !chon.some((x) => x.qid === q)).map((qid) => ({ qid, error: 'không thuộc diện Phần III đáp án dài quá 8 kí tự' }))
  await env.DB.batch(SQL_BANG_XOA_CAU.map((q) => env.DB.prepare(q)))
  const theoDe = new Map<string, string[]>()
  for (const x of chon) theoDe.set(x.maDe, [...(theoDe.get(x.maDe) ?? []), x.qid])
  const daXoa: { maDe: string; qid: string; khoaLuu: string }[] = []
  const loi: { maDe: string; error: string }[] = []
  for (const [maDe, qids] of theoDe) {
    const d = await env.DB.prepare('SELECT r2_khoa, cap_nhat_luc FROM de_kho WHERE ma_de = ? AND COALESCE(da_xoa, 0) = 0').bind(maDe).first<Obj>()
    if (!d) { loi.push({ maDe, error: 'không có tờ' }); continue }
    const khoa = str(d.r2_khoa) || `kho/${maDe}.json`
    const vat = await env.DE.get(khoa)
    if (!vat) { loi.push({ maDe, error: 'không có gói R2' }); continue }
    const etag = (vat as unknown as { etag?: string }).etag
    const chu = await new Response(vat.body).text()
    let goi: unknown
    try { goi = JSON.parse(chu) } catch { loi.push({ maDe, error: 'gói hỏng' }); continue }
    if (!laObj(goi)) { loi.push({ maDe, error: 'gói hỏng' }); continue }
    const cu = await normalizeBank(goi, maDe)
    const nhom = new Map(cu.map((q) => [q.qid, q.group]))
    let chan: string | null = null
    for (const q of qids) { const k = await kiemCong(env, q, nhom.get(q) ?? '', nowMs); if (k) { chan = `${q}: ${k.error}`; break } }
    if (chan) { loi.push({ maDe, error: chan }); continue }
    const { goi: moi, bo } = boKhoiGoi(goi, new Set(qids))
    const sau = await normalizeBank(moi, maDe).catch(() => null)
    if (!sau || bo.length !== qids.length || sau.length !== cu.length - qids.length || sau.some((q) => qids.includes(q.qid))) { loi.push({ maDe, error: 'gói sau khi bỏ câu không khớp (không ghi)' }); continue }
    const luc = new Date(nowMs).toISOString()
    const khoaLuu = `kho-luu/${maDe}/${luc.replace(/[:.]/g, '-')}.json`
    await env.DE.put(khoaLuu, chu) // chép lưu TRƯỚC khi ghi đè
    const put = env.DE.put.bind(env.DE) as (k: string, v: string, o?: unknown) => Promise<unknown>
    const r = await put(khoa, JSON.stringify(moi), etag ? { onlyIf: { etagMatches: etag } } : undefined).catch(() => undefined)
    if (r === null || r === undefined) { loi.push({ maDe, error: 'ghi R2 không được (gói vừa đổi?) — gói cũ vẫn nguyên' }); continue }
    // Nhật ký chỉ ghi khi R2 đã nhận gói mới (không ghi «đã xoá» cho lần ghi trượt).
    await env.DB.batch(qids.map((q) => env.DB.prepare('INSERT INTO kho_xoa_cau (id, ma_de, qid, khoa_luu, ly_do, luc) VALUES (?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), maDe, q, khoaLuu, 'thầy 03/11: Phần III đáp án dài quá 8 kí tự — xoá khỏi kho', luc)))
    let lucMoi = luc
    if (lucMoi === str(d.cap_nhat_luc)) lucMoi = new Date(nowMs + 1).toISOString()
    await env.DB.prepare('UPDATE de_kho SET cap_nhat_luc = ? WHERE ma_de = ?').bind(lucMoi, maDe).run()
    xoaDemSync()
    try { await dongBoCacTo(env, [maDe]) } catch { /* cron dựng lại */ }
    try { await ghiCauVaoHang(env, maDe, moi) } catch { /* lần nạp hàng sau dựng lại */ }
    for (const q of qids) daXoa.push({ maDe, qid: q, khoaLuu })
  }
  return { ok: true, daXoa, loi, tuChoi, conLai: ds.length - daXoa.length }
}
