// OMNI 3 — LỆNH THẦY `POST /gv/omni` (sau cổng `laThay`). action:
//   co-doc · co-luu {co} · cau-hinh-doc · cau-hinh-luu {theLucLop?, maTran?}
//   bang {chienDichId}                 ⇒ BangOmni (omni-kieu.ts)
//   xac-nhan {sbd, maDang, ket:'vung'|'day_lai', nguoi?}  ⇒ { ok } (ghi omni_xac_nhan, chỉ-thêm)
//   q-lo {chienDichId?|maDang?, sau?}  ⇒ { ok, cau:[{qid, stt, de, phan, maDang, tenDang, goiY:string[], vknY?:string[][]}], vkn: Vkn[], conLai }
//   q-duyet {ds:[{qid, vkn[], vknY?}], vknMoi?: Vkn[]}  ⇒ { ok, daDuyet }
//   ca-chot {chienDichId}              ⇒ { ok, qids, soLa, soCu } (50 % câu chiến dịch + 50 % câu chưa gặp cùng ô từ TU LUYỆN, khung 18 + 4 + 6)
//   gan-ca-chot {chienDichId, maCa}    ⇒ { ok }
// Thầy 05/10: A.I Đỗ Đại Học TỰ GẮN vi kỹ năng (mỗi câu = `dang:<ma>` ∪ `nen:<nhãn>`) — `q-lo`/`q-duyet` để thầy XEM/sửa khi muốn, không bắt buộc duyệt.
// Bảng bài: cột = dạng; ô P của dạng = P vi kỹ năng `dang:<ma>` (khái niệm dạng); vi kỹ năng `nen:*` yếu nhất hiện trong "Cần thầy chữa" (nút thắt / sơ ý).
import type { Env } from './kieu'
import { xoaDemCauHinh } from './cau-hinh-dem'
import {
  KHOA_CO_OMNI, KHOA_MA_TRAN_THI, KHOA_THE_LUC_LOP, THAM_SO_OMNI, docCoOmniTu,
  type BangOmni, type CanThayChua, type HoSoOmniEm, type KhungDe, type Phan, type QCau, type ThamSoOmni, type TrangThaiSprt, type Vkn,
} from './omni-kieu'
import {
  capNhatChungChi, chiaTheoTiLe, chuyenDeCua, damBaoBangOmni, docCauKho, docChienDichTheoId, docHieuChuan, docThamSoOmni, docVknTheoDang, hoSoOmniNhieuEm,
  khungTheoPhamVi, qCuaCau, tenCuaDang, vknTheoId, xoaDemOmni, type CauKho,
} from './omni-d1'
import { pAnd } from './omni-p-vkn'
import { duBaoDiem } from './du-bao-diem'
import { thuMucCuaMaDe } from './kho-thu-muc'
import { THE_LUC_TOI_DA, trangThaiLop } from './srs2-gv'
import { docMocThemCaLop } from './srs2-d1'
import { NGUONG_CAT_TIA } from './srs2-loi'
import { cacQidSongSinh, tachSongSinh } from './loi-hoc-luat'
import { phanTram, soP } from '../../src/lib/omni-chu'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const mangChuoi = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x).trim()).filter(Boolean) : [])
const lam2 = (x: number): number => Math.round(x * 100) / 100
const lam4 = (x: number): number => Math.round(x * 10_000) / 10_000
const PHAN: readonly Phan[] = ['I', 'II', 'III']
/** Số câu tối đa một lô duyệt Q (đặc tả: lô 50 câu ≈ 15 phút). */
export const SO_CAU_MOT_LO_Q = 50
/** Đề rút gọn trong lô duyệt Q: tối đa 160 ký tự, không lời giải, không đáp án. */
export const DO_DAI_DE_RUT_GON = 160

export async function gvOmni(env: Env, b: Record<string, unknown>, nowMs = Date.now()): Promise<Record<string, unknown>> {
  const action = str(b.action)
  try {
    if (action === 'co-doc') return await coDoc(env)
    if (action === 'co-luu') return await coLuu(env, b, nowMs)
    if (action === 'cau-hinh-doc') return await cauHinhDoc(env)
    if (action === 'cau-hinh-luu') return await cauHinhLuu(env, b, nowMs)
    if (action === 'bang') return await bang(env, str(b.chienDichId ?? b.id).trim(), nowMs)
    if (action === 'xac-nhan') return await xacNhan(env, b, nowMs)
    if (action === 'q-lo') return await qLo(env, b)
    if (action === 'q-duyet') return await qDuyet(env, b, nowMs)
    if (action === 'ca-chot') return await caChot(env, str(b.chienDichId ?? b.id).trim())
    if (action === 'gan-ca-chot') return await ganCaChot(env, b, nowMs)
    return { ok: false, error: 'Hành động không hợp lệ.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ---------------------------------------------------------------- công tắc + cài đặt
async function docCauHinhTho(env: Env, khoa: string): Promise<string | null> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<Row>().catch(() => null)
  return r?.gia_tri == null ? null : str(r.gia_tri)
}
async function ghiCauHinh(env: Env, khoa: string, giaTri: unknown, nowMs: number): Promise<void> {
  await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(khoa, JSON.stringify(giaTri), new Date(nowMs).toISOString()).run()
  xoaDemCauHinh(env, khoa) // isolate này thấy ngay; isolate khác ≤ 15 s
}
async function coDoc(env: Env) {
  return { ok: true, co: docCoOmniTu(await docCauHinhTho(env, KHOA_CO_OMNI)) }
}
async function coLuu(env: Env, b: Row, nowMs: number) {
  const o = (b.co && typeof b.co === 'object' ? b.co : b) as Row
  const co = { bat: o.bat === true, lop: mangChuoi(o.lop), sbd: mangChuoi(o.sbd) }
  await ghiCauHinh(env, KHOA_CO_OMNI, co, nowMs)
  xoaDemOmni()
  return { ok: true, co }
}
const docJson = (s: string | null): unknown => { try { return s ? JSON.parse(s) : null } catch { return null } }
/** Thể lực lớp hợp lệ: lớp → số nguyên 1..THE_LUC_TOI_DA. Thuần. */
export function docTheLucLop(v: unknown): Record<string, number> {
  const ra: Record<string, number> = {}
  if (!v || typeof v !== 'object' || Array.isArray(v)) return ra
  for (const [k, x] of Object.entries(v as Row)) {
    const n = Number(x)
    if (k.trim() && Number.isInteger(n) && n >= 1 && n <= THE_LUC_TOI_DA) ra[k.trim()] = n
  }
  return ra
}
/** Ma trận đề thi {I, II, III} hợp lệ (số nguyên ≥ 0, tổng > 0); hỏng ⇒ null. Thuần. */
export function docMaTran(v: unknown): KhungDe | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const r = v as Row
  const m = { I: Number(r.I), II: Number(r.II), III: Number(r.III) }
  if (!PHAN.every((p) => Number.isInteger(m[p]) && m[p] >= 0 && m[p] <= 100) || m.I + m.II + m.III <= 0) return null
  return m
}
async function cauHinhDoc(env: Env) {
  const [tl, mt] = await Promise.all([docCauHinhTho(env, KHOA_THE_LUC_LOP), docCauHinhTho(env, KHOA_MA_TRAN_THI)])
  return {
    ok: true,
    theLucLop: docTheLucLop(docJson(tl)),
    maTran: docMaTran(docJson(mt)) ?? { ...THAM_SO_OMNI.KHUNG_DE },
    macDinh: { theLuc: THAM_SO_OMNI.THE_LUC_MAC_DINH, maTran: { ...THAM_SO_OMNI.KHUNG_DE } },
  }
}
async function cauHinhLuu(env: Env, b: Row, nowMs: number) {
  const ra: Row = { ok: true }
  if (b.theLucLop === undefined && b.maTran === undefined) return { ok: false, error: 'Thiếu thể lực lớp hoặc ma trận đề.' }
  if (b.theLucLop !== undefined) {
    if (!b.theLucLop || typeof b.theLucLop !== 'object' || Array.isArray(b.theLucLop)) return { ok: false, error: 'Thể lực lớp phải là bảng lớp → số lượt/ngày.' }
    const hop = docTheLucLop(b.theLucLop)
    const sai = Object.keys(b.theLucLop as Row).filter((k) => !(k.trim() in hop))
    if (sai.length) return { ok: false, error: `Số lượt/ngày phải là số nguyên từ 1 đến ${THE_LUC_TOI_DA}: ${sai.join(', ')}.` }
    await ghiCauHinh(env, KHOA_THE_LUC_LOP, hop, nowMs)
    ra.theLucLop = hop
  }
  if (b.maTran !== undefined) {
    const mt = docMaTran(b.maTran)
    if (!mt) return { ok: false, error: 'Ma trận đề cần số câu Phần I, II, III là số nguyên từ 0 đến 100 (tổng lớn hơn 0).' }
    await ghiCauHinh(env, KHOA_MA_TRAN_THI, mt, nowMs)
    ra.maTran = mt
  }
  xoaDemOmni()
  return ra
}

// ---------------------------------------------------------------- tiện ích chung
async function tenEm(env: Env, ds: readonly string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  if (!ds.length) return ra
  // Tối ưu 05/10: hai bảng đọc CÙNG đợt (trước: nối tiếp); ghép đúng thứ tự cũ (hoc_sinh đè danh_sach).
  const kq = await Promise.all(['danh_sach', 'hoc_sinh'].map((bang) => env.DB.prepare(`SELECT sbd, ho_ten FROM ${bang} WHERE sbd IN (SELECT value FROM json_each(?))`).bind(JSON.stringify([...new Set(ds)])).all<Row>().catch(() => ({ results: [] as Row[] }))))
  for (const r of kq) for (const x of r.results ?? []) if (str(x.ho_ten).trim()) ra.set(str(x.sbd), str(x.ho_ten).trim())
  return ra
}
const vknCuaCau = (c: QCau): string[] => [...new Set([...c.vkn, ...(c.vknY ?? []).flat()])]
/** Vi kỹ năng đại diện một dạng ở Bảng bài: `dang:<ma>` (khái niệm dạng) khi Q các câu của dạng có nó; không thì mọi vi kỹ năng của các câu ấy. Thuần. */
export function vknCotDang(cau: readonly QCau[], maDang: string): string[] {
  const tat = new Set(cau.filter((c) => c.maDang === maDang).flatMap(vknCuaCau))
  const k = `dang:${maDang}`
  return tat.has(k) || !tat.size ? [k] : [...tat].sort()
}
/** Gộp trạng thái SPRT nhiều vi kỹ năng: mọi cái 'vung' ⇒ 'vung'; có 'chua_vung' ⇒ 'chua_vung'; còn lại 'chua_du'. Thuần. */
export function gopTrangThai(ds: readonly TrangThaiSprt[]): TrangThaiSprt {
  if (ds.length && ds.every((t) => t === 'vung')) return 'vung'
  return ds.includes('chua_vung') ? 'chua_vung' : 'chua_du'
}
/** Vi kỹ năng nền (`nen:*`) yếu nhất trong `ids` theo P TRUNG BÌNH của các em (chỉ em có quan sát); không có ⇒ null. Thuần. */
export function nenYeuNhat(hsDs: readonly Pick<HoSoOmniEm, 'vkn'>[], ids: Iterable<string>): { vkn: string; p: number } | null {
  let tot: { vkn: string; p: number } | null = null
  for (const k of [...new Set(ids)].filter((x) => x.startsWith('nen:')).sort()) {
    const ps = hsDs.map((h) => h.vkn[k]).filter((v) => v && v.nTuLam > 0).map((v) => v!.p)
    if (!ps.length) continue
    const p = ps.reduce((a, b) => a + b, 0) / ps.length
    if (!tot || p < tot.p) tot = { vkn: k, p }
  }
  return tot
}

// ---------------------------------------------------------------- Bảng bài
async function bang(env: Env, id: string, nowMs: number): Promise<Record<string, unknown>> {
  const cd = await docChienDichTheoId(env, id)
  if (!cd) return { ok: false, error: 'Không tìm thấy chiến dịch.' }
  await capNhatChungChi(env, cd.id, nowMs, cd).catch(() => null) // chứng chỉ lười (chỉ-thêm) — dùng lại chiến dịch vừa đọc (tối ưu 05/10)
  const ts = await docThamSoOmni(env)
  // Tối ưu 05/10: trạng thái lớp (lần làm, dạy lại, loại câu; mốc thêm em chỉ dùng lúc ghép) bắt đầu NGAY, song song hồ sơ OMNI (trước: chờ cả lô dưới).
  const pThem = docMocThemCaLop(env, cd.id)
  const pTt = trangThaiLop(env, cd.sbd, cd.qids, cd.hanNop, cd.mocBatDau, undefined, pThem)
  pTt.catch(() => {})
  const [hsMap, qMap, kho, ten, hc, , nut] = await Promise.all([
    hoSoOmniNhieuEm(env, cd.sbd, nowMs), qCuaCau(env, cd.qids), docCauKho(env, cd.qids), tenEm(env, cd.sbd), docHieuChuan(env, ts), pThem,
    env.DB.prepare("SELECT sbd, qid, buoc FROM nut_that WHERE trang_thai = 'cho' AND sbd IN (SELECT value FROM json_each(?)) ORDER BY gui_luc, id")
      .bind(JSON.stringify(cd.sbd)).all<Row>().then((r) => r.results ?? []).catch(() => [] as Row[]),
  ])
  const tt = await pTt
  const cau = cd.qids.map((q) => qMap.get(q)!).filter(Boolean)
  const stt = new Map(cd.qids.map((q, i) => [q, i + 1]))
  const dangMa = [...new Set(cau.map((c) => c.maDang ?? '').filter(Boolean))]
  const tenD = new Map<string, string>()
  for (const q of cd.qids) { const m = kho.get(q); if (m?.dang && m.tenDang && !tenD.has(m.dang)) tenD.set(m.dang, m.tenDang) }
  const thieuTen = dangMa.filter((d) => !tenD.has(d))
  if (thieuTen.length) for (const [d, t] of await tenCuaDang(env, thieuTen).catch(() => new Map<string, string>())) tenD.set(d, t)
  const tenCuaCau = (q: string) => { const d = qMap.get(q)?.maDang; return (d && tenD.get(d)) || 'Chưa gắn dạng' }
  const cot = new Map(dangMa.map((d) => [d, vknCotDang(cau, d)]))
  const khung = khungTheoPhamVi(cau, ts)
  const o: BangOmni['o'] = {}, sEm: BangOmni['sEm'] = {}, khoangCach8: BangOmni['khoangCach8'] = {}, sanSang: BangOmni['sanSang'] = {}
  for (const s of cd.sbd) {
    const hs = hsMap.get(s)!
    o[s] = Object.fromEntries(dangMa.map((d) => {
      const vk = cot.get(d)!
      return [d, { p: lam4(pAnd(hs, vk, ts)), n: vk.reduce((t, k) => t + (hs.vkn[k]?.nTuLam ?? 0), 0), trangThai: gopTrangThai(vk.map((k) => hs.vkn[k]?.trangThai ?? 'chua_du')) }]
    }))
    const db = cau.length ? duBaoDiem(hs, cau, { khung, mucTieu: ts.MUC_TIEU }, ts) : null
    const du = !!db && db.soBangChung >= ts.S_AO
    sEm[s] = hs.nVung >= ts.S_AO ? hs.sEm : null
    khoangCach8[s] = du ? lam2(ts.MUC_TIEU - db!.kyVong) : null
    sanSang[s] = du ? lam4(db!.p8) : null
  }
  const vknTen = async (ids: string[]) => vknTheoId(env, ids).catch(() => new Map<string, Vkn>())
  // (1) Nút thắt: thẻ 'cho' của em trong chiến dịch, gom theo câu
  const theoCauNut = new Map<string, { sbd: Set<string>; buoc: Map<number, number> }>()
  for (const x of nut) {
    const q = tachSongSinh(str(x.qid)).goc
    if (!stt.has(q)) continue
    const g = theoCauNut.get(q) ?? { sbd: new Set<string>(), buoc: new Map<number, number>() }
    g.sbd.add(str(x.sbd))
    const bu = Number(x.buoc)
    if (Number.isInteger(bu)) g.buoc.set(bu, (g.buoc.get(bu) ?? 0) + 1)
    theoCauNut.set(q, g)
  }
  const nutDs = [...theoCauNut].map(([q, g]) => ({ q, g, nen: nenYeuNhat([...g.sbd].map((s) => hsMap.get(s)!), qMap.get(q) ? vknCuaCau(qMap.get(q)!) : []) }))
  // (3) Sơ ý cao dù kiến thức vững
  const nenPhamVi = new Set(cau.flatMap(vknCuaCau).filter((k) => k.startsWith('nen:')))
  const soYDs = cd.sbd.map((s) => ({ s, hs: hsMap.get(s)! })).filter(({ hs }) => hs.nVung >= ts.S_AO && hs.sEm > ts.SO_Y_CAO)
    .map(({ s, hs }) => ({ s, hs, nen: nenYeuNhat([hs], nenPhamVi) }))
  const tenVkn = await vknTen([...nutDs.map((x) => x.nen?.vkn), ...soYDs.map((x) => x.nen?.vkn)].filter((x): x is string => !!x))
  const canThayChua: CanThayChua[] = []
  for (const { q, g, nen } of nutDs.sort((a, b) => b.g.sbd.size - a.g.sbd.size || stt.get(a.q)! - stt.get(b.q)!)) {
    const buoc = [...g.buoc].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0]
    const tenNen = nen ? tenVkn.get(nen.vkn)?.ten ?? nen.vkn : null
    canThayChua.push({
      loai: 'nut_that', tieuDe: `Câu ${stt.get(q)} · ${tenCuaCau(q)}`,
      phu: `${g.sbd.size} em gửi thẻ nút thắt${buoc != null ? ` ở bước ${buoc}` : ''} — đã tự gỡ mà chưa xong${tenNen ? ` · nền yếu nhất: ${tenNen}` : ''}`,
      soEm: g.sbd.size, qids: [q], sbd: [...g.sbd].sort(), ...(nen ? { vkn: nen.vkn } : {}),
    })
  }
  // (2) Câu sai ≥ NGUONG_CAT_TIA lần đã rời kế hoạch (cắt tỉa) ≥ 1 em
  const catDs = cd.qids.map((q) => ({ q, sbd: cd.sbd.filter((s) => tt.get(s)?.get(q)?.catTia) })).filter((x) => x.sbd.length > 0)
    .sort((a, b) => b.sbd.length - a.sbd.length || stt.get(a.q)! - stt.get(b.q)!)
  for (const { q, sbd } of catDs) {
    canThayChua.push({ loai: 'cat_tia', tieuDe: `Câu ${stt.get(q)} · ${tenCuaCau(q)}`, phu: `${sbd.length} em sai từ ${NGUONG_CAT_TIA} lần, câu đã rời kế hoạch — chờ thầy chữa`, soEm: sbd.length, qids: [q], sbd })
  }
  for (const { s, hs, nen } of soYDs.sort((a, b) => b.hs.sEm - a.hs.sEm || (a.s < b.s ? -1 : 1))) {
    const tenNen = nen ? tenVkn.get(nen.vkn)?.ten ?? nen.vkn : null
    canThayChua.push({
      loai: 'so_y', tieuDe: `${ten.get(s) ?? s}: sơ ý ${phanTram(hs.sEm)}`,
      phu: `Kiến thức vững nhưng hay sai ở câu đã vững (${hs.nVung} lượt)${tenNen ? ` · nền yếu nhất: ${tenNen} ${soP(nen!.p)}` : ''}`,
      soEm: 1, sbd: [s], ...(nen ? { vkn: nen.vkn } : {}),
    })
  }
  const ra: BangOmni = {
    ok: true,
    chienDich: { id: cd.id, ten: cd.ten, hanNop: cd.hanNop, lop: cd.lop },
    em: cd.sbd.map((s) => ({ sbd: s, ten: ten.get(s) ?? s })),
    dang: dangMa.map((d) => ({ ma: d, ten: tenD.get(d) ?? d })),
    o, sEm, khoangCach8, sanSang,
    hieuChuan: { soCaChot: hc.soCaChot, du: hc.du },
    canThayChua,
  }
  return ra as unknown as Record<string, unknown>
}

// ---------------------------------------------------------------- xác nhận dạng
async function xacNhan(env: Env, b: Row, nowMs: number) {
  const sbd = str(b.sbd).trim(), maDang = str(b.maDang).trim(), ket = str(b.ket)
  if (!sbd || !maDang) return { ok: false, error: 'Thiếu em hoặc dạng.' }
  if (ket !== 'vung' && ket !== 'day_lai') return { ok: false, error: 'Kết luận phải là "vững" hoặc "dạy lại".' }
  await damBaoBangOmni(env)
  const luc = new Date(nowMs).toISOString()
  await env.DB.prepare('INSERT OR IGNORE INTO omni_xac_nhan (sbd, ma_dang, ket, luc, nguoi) VALUES (?,?,?,?,?)').bind(sbd, maDang, ket, luc, str(b.nguoi).trim() || null).run()
  xoaDemOmni()
  return { ok: true, luc }
}

// ---------------------------------------------------------------- ma trận Q: lô xem/duyệt
/** Đề rút gọn: bỏ thẻ HTML, gộp khoảng trắng, ≤ DO_DAI_DE_RUT_GON ký tự (kể cả dấu "…"). Thuần. */
export function rutGonDe(text: unknown, toiDa = DO_DAI_DE_RUT_GON): string {
  const s = str(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return s.length <= toiDa ? s : `${s.slice(0, Math.max(0, toiDa - 1)).trimEnd()}…`
}
async function qLo(env: Env, b: Row) {
  const chienDichId = str(b.chienDichId).trim(), maDang = str(b.maDang).trim()
  let qids: string[]
  if (chienDichId) {
    const cd = await docChienDichTheoId(env, chienDichId)
    if (!cd) return { ok: false, error: 'Không tìm thấy chiến dịch.' }
    qids = cd.qids
  } else if (maDang) {
    const r = await env.DB.prepare('SELECT qid FROM game_v2_question WHERE dang = ? ORDER BY ma_de, rowid').bind(maDang).all<Row>().catch(() => ({ results: [] as Row[] }))
    qids = [...new Set((r.results ?? []).map((x) => str(x.qid)))]
  } else return { ok: false, error: 'Thiếu chiến dịch hoặc dạng.' }
  const kho = await docCauKho(env, qids)
  qids = qids.filter((q) => { const m = kho.get(q); return !!m && !m.tuLuan && (!maDang || m.dang === maDang) && (!!chienDichId || m.reviewed) })
  const daThay = new Set<string>()
  if (qids.length) {
    const r = await env.DB.prepare("SELECT DISTINCT qid FROM omni_q WHERE nguon = 'thay' AND qid IN (SELECT value FROM json_each(?))").bind(JSON.stringify(qids)).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r.results ?? []) daThay.add(str(x.qid))
  }
  const chua = qids.filter((q) => !daThay.has(q))
  const sau = b.sau
  let tu = 0
  if (typeof sau === 'string' && sau) { const i = chua.indexOf(sau); tu = i >= 0 ? i + 1 : 0 } else if (Number.isInteger(Number(sau)) && Number(sau) > 0) tu = Number(sau)
  const lo = chua.slice(tu, tu + SO_CAU_MOT_LO_Q)
  const de = new Map<string, string>()
  if (lo.length) {
    const r = await env.DB.prepare("SELECT qid, json_extract(json, '$.text') AS de FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) AND json_valid(json) ORDER BY qid, ma_de")
      .bind(JSON.stringify(lo)).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r.results ?? []) if (!de.has(str(x.qid))) de.set(str(x.qid), rutGonDe(x.de))
  }
  const q = await qCuaCau(env, lo)
  const dangs = [...new Set(lo.map((x) => kho.get(x)?.dang ?? '').filter(Boolean))]
  const [danhMuc, goiYTen] = await Promise.all([
    docVknTheoDang(env, dangs),
    vknTheoId(env, [...dangs.map((d) => `dang:${d}`), ...lo.flatMap((x) => (q.get(x) ? vknCuaCau(q.get(x)!) : []))]),
  ])
  const vkn = new Map<string, Vkn>()
  for (const d of dangs) for (const v of danhMuc.get(d) ?? []) vkn.set(v.id, v)
  for (const [k, v] of goiYTen) if (!vkn.has(k)) vkn.set(k, v)
  const viTri = new Map(qids.map((x, i) => [x, i + 1]))
  return {
    ok: true,
    cau: lo.map((x) => {
      const m = kho.get(x)!, qc = q.get(x)!
      return { qid: x, stt: viTri.get(x)!, de: de.get(x) ?? '', phan: m.phan, maDang: m.dang, tenDang: m.tenDang, goiY: qc.vkn, ...(qc.vknY ? { vknY: qc.vknY } : {}), nguon: qc.nguon }
    }),
    vkn: [...vkn.values()],
    conLai: Math.max(0, chua.length - tu - lo.length),
  }
}
/** Một dòng duyệt Q hợp lệ? vkn ≥ 1 mã; vknY (nếu có) đúng 4 ý, mỗi ý ≥ 1 mã. Thuần. */
export function kiemDongDuyet(x: unknown): { qid: string; vkn: string[]; vknY: string[][] | null } | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Row
  const qid = tachSongSinh(str(r.qid).trim()).goc
  const vkn = [...new Set(mangChuoi(r.vkn))]
  if (!qid || !vkn.length) return null
  if (r.vknY === undefined || r.vknY === null) return { qid, vkn, vknY: null }
  if (!Array.isArray(r.vknY) || r.vknY.length !== 4) return null
  const vknY = r.vknY.map((a) => [...new Set(mangChuoi(a))])
  return vknY.every((a) => a.length > 0) ? { qid, vkn, vknY } : null
}
async function qDuyet(env: Env, b: Row, nowMs: number) {
  const dsTho = Array.isArray(b.ds) ? b.ds : []
  if (dsTho.length > 200) return { ok: false, error: 'Mỗi lần duyệt tối đa 200 câu.' }
  const ds: NonNullable<ReturnType<typeof kiemDongDuyet>>[] = []
  for (let i = 0; i < dsTho.length; i++) {
    const d = kiemDongDuyet(dsTho[i])
    if (!d) return { ok: false, error: `Dòng ${i + 1}: cần mã câu và ít nhất một vi kỹ năng (Đúng–sai: đủ 4 ý).` }
    ds.push(d)
  }
  const vknMoi: Vkn[] = []
  for (const [i, x] of (Array.isArray(b.vknMoi) ? b.vknMoi : []).entries()) {
    const r = (x ?? {}) as Row
    const v: Vkn = { id: str(r.id).trim(), maDang: str(r.maDang).trim(), ten: str(r.ten).trim(), tenLoi: str(r.tenLoi).trim() || null, nhanNen: str(r.nhanNen).trim() || null, thuTu: Number.isInteger(Number(r.thuTu)) ? Number(r.thuTu) : i }
    if (!v.id || !v.maDang || !v.ten) return { ok: false, error: `Vi kỹ năng mới ${i + 1}: cần mã, dạng và tên.` }
    vknMoi.push(v)
  }
  if (!ds.length && !vknMoi.length) return { ok: false, error: 'Chưa có câu nào để duyệt.' }
  await damBaoBangOmni(env)
  const luc = new Date(nowMs).toISOString()
  const lenh: ReturnType<Env['DB']['prepare']>[] = []
  for (const v of vknMoi) {
    lenh.push(env.DB.prepare(`INSERT INTO omni_vkn (id, ma_dang, ten, ten_loi, nhan_nen, thu_tu) VALUES (?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET ma_dang = excluded.ma_dang, ten = excluded.ten, ten_loi = excluded.ten_loi, nhan_nen = excluded.nhan_nen, thu_tu = excluded.thu_tu`)
      .bind(v.id, v.maDang, v.ten, v.tenLoi ?? null, v.nhanNen ?? null, v.thuTu))
  }
  for (const d of ds) {
    // Thầy duyệt THAY mọi dòng cũ của câu (kể cả gợi ý của A.I) — một nguồn duy nhất cho câu ấy.
    lenh.push(env.DB.prepare('DELETE FROM omni_q WHERE qid = ?').bind(d.qid))
    lenh.push(env.DB.prepare("INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?, -1, ?, 'thay', ?)").bind(d.qid, JSON.stringify(d.vkn), luc))
    d.vknY?.forEach((a, y) => lenh.push(env.DB.prepare("INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?, ?, ?, 'thay', ?)").bind(d.qid, y, JSON.stringify(a), luc)))
  }
  for (let i = 0; i < lenh.length; i += 90) await env.DB.batch(lenh.slice(i, i + 90))
  xoaDemOmni()
  return { ok: true, daDuyet: ds.length, vknMoi: vknMoi.length }
}

// ---------------------------------------------------------------- ca chốt 50/50
/** Ứng viên câu ca chốt: `o` = ô (phần × chuyên đề × mức độ); `diem` = ưu tiên (câu chiến dịch: số em CHƯA thành thạo; câu lạ: cùng dạng chiến dịch = 1). */
export interface UngCaChot { qid: string; phan: Phan; o: string; diem: number; thuTu: number }
export interface KetQuaCaChot { qids: string[]; qidCu: string[]; qidLa: string[]; khung: KhungDe; soLa: number; soCu: number }
/**
 * THUẦN — chọn câu ca chốt: khung CA_CHOT 18 + 4 + 6 (phần vắng câu chiến dịch ⇒ chia cho phần có câu theo tỉ lệ — `khungTheoPhamVi`); trong mỗi phần chia
 * theo ô tỉ lệ số câu chiến dịch của ô; tổng câu lạ = round(N × tiLeLa) chia theo phần rồi theo ô. Mỗi ô: câu chiến dịch nhiều em chưa thành thạo nhất +
 * câu lạ cùng ô; thiếu câu lạ ⇒ bù câu chiến dịch (cùng ô, rồi cùng phần); thiếu câu chiến dịch ⇒ bù câu lạ. soLa/soCu là số THẬT.
 */
export function chonCauCaChot(cauCd: readonly UngCaChot[], ungLa: readonly UngCaChot[], ts: ThamSoOmni = THAM_SO_OMNI): KetQuaCaChot {
  const xep = (a: UngCaChot, b: UngCaChot) => b.diem - a.diem || a.thuTu - b.thuTu || (a.qid < b.qid ? -1 : 1)
  const khungCd = khungTheoPhamVi(cauCd, ts)
  const quota = PHAN.map((p) => (cauCd.some((c) => c.phan === p) ? khungCd[p] : 0))
  const tong = quota.reduce((a, b) => a + b, 0)
  const laPhan = chiaTheoTiLe(Math.round(tong * ts.CA_CHOT.tiLeLa), quota)
  const daChon = new Set<string>()
  const qidCu: string[] = [], qidLa: string[] = [], thuTuRa: string[] = []
  const khung: KhungDe = { I: 0, II: 0, III: 0 }
  const lay = (ds: UngCaChot[], n: number, vao: string[]): number => {
    let k = 0
    for (const c of ds) { if (k >= n) break; if (daChon.has(c.qid)) continue; daChon.add(c.qid); vao.push(c.qid); thuTuRa.push(c.qid); k++ }
    return k
  }
  PHAN.forEach((p, ip) => {
    const n = quota[ip]!
    if (n <= 0) return
    const cdP = cauCd.filter((c) => c.phan === p)
    const o = [...new Set([...cdP].sort((a, b) => a.thuTu - b.thuTu).map((c) => c.o))]
    const laP = ungLa.filter((c) => c.phan === p && o.includes(c.o)) // câu lạ CHỈ lấy ở ô có câu chiến dịch
    const quotaO = chiaTheoTiLe(n, o.map((x) => cdP.filter((c) => c.o === x).length))
    const laO = chiaTheoTiLe(laPhan[ip]!, quotaO)
    let duoc = 0
    o.forEach((x, io) => {
      const cdO = cdP.filter((c) => c.o === x).sort(xep)
      const laOds = laP.filter((c) => c.o === x).sort(xep)
      const canLa = laO[io]!, canCu = quotaO[io]! - canLa
      const laDuoc = lay(laOds, canLa, qidLa)
      const cuDuoc = lay(cdO, canCu + (canLa - laDuoc), qidCu) // thiếu câu lạ ⇒ bù câu chiến dịch cùng ô
      duoc += laDuoc + cuDuoc
      if (laDuoc + cuDuoc < quotaO[io]!) duoc += lay(laOds, quotaO[io]! - laDuoc - cuDuoc, qidLa) // thiếu câu chiến dịch ⇒ bù câu lạ cùng ô
    })
    if (duoc < n) duoc += lay([...cdP].sort(xep), n - duoc, qidCu) // còn thiếu ⇒ câu chiến dịch khác ô trong phần
    if (duoc < n) duoc += lay([...laP].sort(xep), n - duoc, qidLa)
    khung[p] = duoc
  })
  const thuTuPhan = new Map([...cauCd, ...ungLa].map((c) => [c.qid, PHAN.indexOf(c.phan)]))
  const qids = thuTuRa.map((q, i) => ({ q, i })).sort((a, b) => thuTuPhan.get(a.q)! - thuTuPhan.get(b.q)! || a.i - b.i).map((x) => x.q)
  return { qids, qidCu, qidLa, khung, soLa: qidLa.length, soCu: qidCu.length }
}
const oCua = (m: Pick<CauKho, 'phan' | 'chuyenDe' | 'mucDo'>): string => `${m.phan}|${m.chuyenDe ?? ''}|${m.mucDo ?? ''}`
async function caChot(env: Env, id: string) {
  const cd = await docChienDichTheoId(env, id)
  if (!cd) return { ok: false, error: 'Không tìm thấy chiến dịch.' }
  const ts = await docThamSoOmni(env)
  const [kho, them] = await Promise.all([docCauKho(env, cd.qids), docMocThemCaLop(env, cd.id)])
  const tt = await trangThaiLop(env, cd.sbd, cd.qids, cd.hanNop, cd.mocBatDau, undefined, them)
  const cauCd: UngCaChot[] = cd.qids.flatMap((q, i) => {
    const m = kho.get(q)
    if (!m || m.tuLuan) return []
    return [{ qid: q, phan: m.phan, o: oCua(m), diem: cd.sbd.filter((s) => !tt.get(s)?.get(q)?.thanhThao).length, thuTu: i }]
  })
  if (!cauCd.length) return { ok: false, error: 'Chiến dịch chưa có câu dùng được cho ca chốt.' }
  // Câu lạ: cùng ô, mọi tờ chứa câu thuộc TU LUYỆN, chưa em nào trong lớp gặp (kể cả song sinh), không trùng nội dung câu chiến dịch.
  const oCan = new Set(cauCd.map((c) => c.o))
  const dangCd = new Set(cd.qids.map((q) => kho.get(q)?.dang ?? '').filter(Boolean))
  const nhomCd = new Set(cd.qids.map((q) => kho.get(q)?.group ?? '').filter(Boolean))
  const r = await env.DB.prepare(`SELECT ma_de, qid, content_group, dang, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do,
        json_extract(json,'$.chuyenDe') AS chuyen_de, json_extract(json,'$.reviewed') AS reviewed, json_extract(json,'$.tuLuan') AS tu_luan, json_extract(json,'$.tenDang') AS ten_dang
      FROM game_v2_question WHERE json_valid(json) AND json_extract(json,'$.phan') IN (SELECT value FROM json_each(?)) ORDER BY ma_de, qid`)
    .bind(JSON.stringify([...new Set(cauCd.map((c) => c.phan))])).all<Row>().catch(() => ({ results: [] as Row[] }))
  const cdSet = new Set(cd.qids)
  const theoQid = new Map<string, { maDe: Set<string>; m: CauKho }>()
  for (const x of r.results ?? []) {
    const q = str(x.qid)
    if (cdSet.has(q) || tachSongSinh(q).songSinh !== null) continue
    const cu = theoQid.get(q)
    if (cu) { cu.maDe.add(str(x.ma_de)); continue }
    const dang = str(x.dang).trim() || null
    const m: CauKho = {
      qid: q, maDe: str(x.ma_de), maDeDs: [str(x.ma_de)], group: str(x.content_group), phan: str(x.phan) as Phan, dang, tenDang: str(x.ten_dang) || null, mucDo: str(x.muc_do).trim() || null,
      chuyenDe: chuyenDeCua(dang, str(x.chuyen_de)), kienThuc: [], kienThucY: null, tuLuan: Number(x.tu_luan) === 1, reviewed: Number(x.reviewed) === 1,
    }
    theoQid.set(q, { maDe: new Set([str(x.ma_de)]), m })
  }
  const ung = [...theoQid.values()].filter(({ m }) => m.reviewed && !m.tuLuan && !nhomCd.has(m.group) && oCan.has(oCua(m)))
  const thuMuc = await thuMucCuaMaDe(env, [...new Set(ung.flatMap((u) => [...u.maDe]))])
  const tuLuyen = ung.filter((u) => [...u.maDe].every((md) => thuMuc.get(md) === 'TU_LUYEN'))
  // Lớp = em của chiến dịch ∪ học sinh cùng lớp (chiến dịch giao theo lớp).
  let lop = [...cd.sbd]
  if (cd.lop) {
    const rl = await env.DB.prepare("SELECT sbd FROM hoc_sinh WHERE COALESCE(lop, '') = ? AND COALESCE(trang_thai, '') <> 'khoa'").bind(cd.lop).all<Row>().catch(() => ({ results: [] as Row[] }))
    lop = [...new Set([...lop, ...(rl.results ?? []).map((x) => str(x.sbd))])]
  }
  const daGap = new Set<string>()
  const ds = tuLuyen.map((u) => u.m.qid)
  for (let i = 0; i < ds.length && lop.length; i += 300) {
    const lo = ds.slice(i, i + 300).flatMap(cacQidSongSinh)
    const rg = await env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))')
      .bind(JSON.stringify(lop), JSON.stringify(lo)).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of rg.results ?? []) daGap.add(tachSongSinh(str(x.qid)).goc)
  }
  const ungLa: UngCaChot[] = tuLuyen.filter((u) => !daGap.has(u.m.qid)).map((u, i) => ({ qid: u.m.qid, phan: u.m.phan, o: oCua(u.m), diem: u.m.dang && dangCd.has(u.m.dang) ? 1 : 0, thuTu: i }))
  const kq = chonCauCaChot(cauCd, ungLa, ts)
  return { ok: true, ...kq, phut: ts.CA_CHOT.phut }
}
async function ganCaChot(env: Env, b: Row, nowMs: number) {
  const cd = await docChienDichTheoId(env, str(b.chienDichId ?? b.id).trim())
  if (!cd) return { ok: false, error: 'Không tìm thấy chiến dịch.' }
  const maCa = str(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca kiểm tra.' }
  const ca = await env.DB.prepare('SELECT ma_ca FROM ca WHERE ma_ca = ?').bind(maCa).first<Row>().catch(() => null)
  if (!ca) return { ok: false, error: 'Không tìm thấy ca kiểm tra.' }
  await damBaoBangOmni(env)
  const luc = new Date(nowMs).toISOString()
  const qidLa = mangChuoi(b.qidLa)
  const g = await env.DB.prepare('INSERT OR IGNORE INTO omni_ca_chot (chien_dich_id, ma_ca, luc, qid_la_json) VALUES (?,?,?,?)').bind(cd.id, maCa, luc, qidLa.length ? JSON.stringify(qidLa) : null).run()
  // Dự báo TỪNG EM lúc gán (trước khi làm) — hiệu chuẩn so với điểm thật; gán lại không ghi đè dự báo cũ.
  const ts = await docThamSoOmni(env)
  const [hsMap, qMap] = await Promise.all([hoSoOmniNhieuEm(env, cd.sbd, nowMs), qCuaCau(env, cd.qids)])
  const cau = [...qMap.values()]
  const khung = khungTheoPhamVi(cau, ts)
  const lenh: ReturnType<Env['DB']['prepare']>[] = []
  if (cau.length) for (const s of cd.sbd) {
    const hs = hsMap.get(s)!
    const db = duBaoDiem(hs, cau, { khung, mucTieu: ts.MUC_TIEU }, ts)
    lenh.push(env.DB.prepare(`INSERT OR IGNORE INTO omni_du_bao (sbd, pham_vi, ky_vong, p8, sai_so, s_dung, con_duong, con_thieu_json, so_bang_chung, luc) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(s, `ca_chot:${maCa}`, db.kyVong, db.p8, db.saiSo, hs.sEm, db.conDuong, JSON.stringify(db.conThieu), db.soBangChung, luc))
  }
  let soDuBao = 0
  for (let i = 0; i < lenh.length; i += 80) for (const r of await env.DB.batch(lenh.slice(i, i + 80))) soDuBao += Number(r.meta?.changes ?? 0)
  xoaDemOmni()
  return { ok: true, daGan: Number(g.meta?.changes ?? 0) > 0, soDuBao }
}
