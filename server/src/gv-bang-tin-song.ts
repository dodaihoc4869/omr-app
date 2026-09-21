// `POST /gv/bang-tin-song` — BẢNG TIN KIỂU "SÀN GIAO DỊCH" của thầy (prompt-bang-tin-san-2109.md mục CODE 3; hợp đồng hai bên docs/hop-dong-bang-tin-song-2109.md — Code 4 ⇄ Code 3; màn đọc bằng `docSan`).
// ĐỌC-CHỈ, mã bí mật của thầy như `/gv/bang-tin`. Trả `{ ok, serverNow, ...MỌI khoá của /gv/bang-tin (gọi chung `gvBangTin`), song:{ tongEm, dungNhip, tia60, nen, theoLop, nhiet, suKienMoi, danDau } }`.
// MỘT nguồn số: tổng câu / câu đúng / em đã học / theo lớp / ô nhiệt / nến / tia đều tính từ CÙNG danh sách sự kiện hôm nay ⇒ khớp nhau (luật khớp của hợp đồng); `nhip.soCau|soCauDung|soEmHoc|tiLeDung` của bản 3 được GHI ĐÈ bằng số này
// (bản 3 đệm 60 giây, phần trực tiếp 10 giây — không để hai số lệch nhau). Mọi số TỪ MỐC hiển thị (`tuHomNay` của Bảng tin = max(mốc, 00:00 hôm nay)). Khối không có số thật ⇒ null / [] (không bịa).
//
// CHI PHÍ D1 (Boss dặn): bảng mở là máy hỏi mỗi 10 giây. Hai lớp đệm trong bộ nhớ Worker:
//   • phần "trực tiếp": 10 GIÂY — mỗi lần tính chỉ 2 truy vấn: sự kiện hôm nay (đi chỉ mục) · bài vừa nộp. Ba khối ĐỔI CHẬM có đệm riêng: danh sách em 60 giây (cùng nhịp bản 3), nền tiến bộ (các ngày TRƯỚC hôm nay) và tên dạng 10 phút;
//   • phần `gvBangTin`: 60 GIÂY — 12 truy vấn, đọc sổ 14 ngày ≈ 25–30 nghìn dòng (số của khối này đổi chậm).
// Sự kiện hôm nay đi bằng chỉ mục `idx_skh_luc(luc, sbd, ket_qua, ma_dang)` (migration-2109-index-luc.sql; chưa có chỉ mục thì vẫn chạy, quét cả bảng). Mỗi truy vấn ≤ 5 term UNION (giới hạn D1 thật).
import type { Env } from './kieu'
import { gvBangTin, SBD_THU } from './gv-bang-tin'
import { tenCuaCacDang } from './ten-dang-bo-nao'
import { tenLopCuaEm } from './ten-lop'

type Hang = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const tron = (n: number, k: number): number => Math.round(n * 10 ** k) / 10 ** k

export const DEM_SONG_MS = 10_000
export const DEM_BANG_TIN_MS = 60_000
/** Nền tiến bộ (các ngày trước hôm nay) và tên dạng hầu như không đổi trong ngày ⇒ đệm 10 phút. */
export const DEM_CHAM_MS = 600_000
export const NEN_MS = 300_000
export const TOI_DA_NEN = 100
export const TOI_DA_TIN = 20
export const TOI_DA_DAN_DAU = 5
/** Em cần ≥ ngần này câu hôm nay mới vào "Dẫn đầu" (chăm trước; tiến bộ so với CHÍNH em kèm theo). */
export const DAN_DAU_TOI_THIEU_CAU = 10
/** "Tiến bộ" so với CHÍNH em trong tối đa ngần này ngày trước hôm nay (hợp đồng: 7 ngày), và không sớm hơn mốc hiển thị. */
export const NGAY_NEN_TIEN_BO = 7
export const TOI_DA_SU_KIEN = 20_000
/** Mốc chuỗi đúng liên tiếp / số câu của lớp / số lượt sai của dạng để sinh một dòng tin. */
export const MOC_CHUOI_DUNG = [5, 8, 12, 20] as const
export const CAU_MOI_DONG_LOP = 12
export const LUOT_SAI_MOI_DONG_DANG = 3

export interface NenSan { tu: number; mo: number; cao: number; thap: number; dong: number; soCau: number }
export interface TinSan { luc: number; loai: 'len' | 'xuong' | 'cham'; chu: string; phu?: string }
export interface Ev { sbd: string; ms: number; kq: 0 | 1; dang: string }
export interface EmInfo { hoTen: string; tenLop: string }

let demBangTin: { at: number; kq: Hang } | null = null
let demSong: { at: number; kq: Hang } | null = null
let demEm: { at: number; em: Map<string, EmInfo> } | null = null
let demNen: { at: number; khoa: string; nen: Map<string, { n: number; dung: number }> } | null = null
let demTenDang: { at: number; ten: Map<string, string> } | null = null
/** Xoá đệm (test / sau khi đổi cấu hình). */
export function xoaDemBangTinSong(): void { demBangTin = null; demSong = null; demEm = null; demNen = null; demTenDang = null }
const conHan = (at: number, nowMs: number, han: number): boolean => nowMs - at >= 0 && nowMs - at < han

// ------------------------------------------------------------------ HÀM THUẦN ------------------------------------------------------------------
/**
 * NẾN 5 PHÚT (định nghĩa của hợp đồng): A(t) = % câu ĐÚNG trong các câu có kết quả có `luc ∈ (t − 5 phút, t]` (cửa sổ trượt). Khung [T, T+5'): `mo` = A(T) (khung trước không có câu ⇒ `dong` khung trước; câu đầu ngày ⇒ A tại câu đầu),
 * `dong` = A(min(bây giờ, T+5')) (cửa sổ rỗng ⇒ giữ giá trước), `cao/thap` = max/min của A tại mọi câu trong khung (kể cả `mo`, `dong`), `soCau` = số sự kiện có kết quả trong khung. Khung yên ⇒ nến phẳng, soCau 0. Không có câu nào ⇒ [].
 * Trả tối đa `TOI_DA_NEN` khung mới nhất, cũ → mới. `ev` phải tăng dần theo `ms`.
 */
export function tinhNen(ev: readonly Ev[], nowMs: number): NenSan[] {
  if (ev.length === 0) return []
  const n = ev.length
  const pN: number[] = [0], pD: number[] = [0]
  for (const e of ev) { pN.push(pN[pN.length - 1]! + 1); pD.push(pD[pD.length - 1]! + e.kq) }
  // số sự kiện có ms ≤ t (chia đôi)
  const dem = (t: number): number => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (ev[m]!.ms <= t) lo = m + 1; else hi = m } return lo }
  const A = (t: number): number | null => {
    const b = dem(t), a = dem(t - NEN_MS), tong = pN[b]! - pN[a]!
    return tong > 0 ? ((pD[b]! - pD[a]!) / tong) * 100 : null
  }
  const khung = (ms: number): number => Math.floor(ms / NEN_MS) * NEN_MS
  const ra: NenSan[] = []
  let dongTruoc: number | null = null
  for (let t = khung(ev[0]!.ms); t <= khung(nowMs); t += NEN_MS) {
    const a = dem(t - 1), b = dem(t + NEN_MS - 1) // sự kiện trong [t, t + 5')
    let mo: number | null = A(t) ?? dongTruoc
    const cuoi: number | null = A(Math.min(nowMs, t + NEN_MS - 1)) ?? dongTruoc
    let cao = -1, thap = 101
    for (let i = a; i < b; i++) { const r = A(ev[i]!.ms); if (r !== null) { if (mo === null) mo = r; cao = Math.max(cao, r); thap = Math.min(thap, r) } }
    const o: number = mo ?? cuoi ?? 0
    const c: number = cuoi ?? o
    if (cao < 0) { cao = Math.max(o, c); thap = Math.min(o, c) } else { cao = Math.max(cao, o, c); thap = Math.min(thap, o, c) }
    dongTruoc = c
    ra.push({ tu: t, mo: tron(o, 1), cao: tron(cao, 1), thap: tron(thap, 1), dong: tron(c, 1), soCau: b - a })
  }
  return ra.slice(-TOI_DA_NEN)
}

/** TIA 60 phút: 60 điểm, mỗi điểm một phút, điểm cuối = phút hiện tại; giá trị LUỸ KẾ từ mốc tại cuối phút ấy: em đã học, câu đã làm, tỉ lệ đúng cả ngày (%). */
export function tinhTia(ev: readonly Ev[], nowMs: number): { hs: number[]; cau: number[]; tile: number[] } {
  const hs: number[] = [], cau: number[] = [], tile: number[] = []
  const phutNay = Math.floor(nowMs / 60_000)
  const daHoc = new Set<string>()
  let n = 0, dung = 0, i = 0
  for (let k = 0; k < 60; k++) {
    const het = k === 59 ? Infinity : (phutNay - 59 + k + 1) * 60_000
    while (i < ev.length && ev[i]!.ms < het) { daHoc.add(ev[i]!.sbd); n++; dung += ev[i]!.kq; i++ }
    hs.push(daHoc.size); cau.push(n); tile.push(n ? tron((dung / n) * 100, 2) : 0)
  }
  return { hs, cau, tile }
}

/**
 * Dòng tin THẬT từ sổ hôm nay: chuỗi đúng liên tiếp của em (5/8/12/20 câu), lớp thêm 12 câu (kèm % đúng của 12 câu ấy), em vừa vào học, dạng có 3 lượt sai mới. Trả TẤT CẢ dòng, cũ → mới (nơi gọi cắt 20 mới nhất).
 * `dang` (mã dạng) chỉ để nơi gọi đổi sang TÊN dạng — không bao giờ ra khỏi máy chủ.
 */
export function taoTinTuSu(ev: readonly Ev[], em: ReadonlyMap<string, EmInfo>): (TinSan & { dang?: string })[] {
  const tin: (TinSan & { dang?: string })[] = []
  const chuoiDung = new Map<string, number>(), daVao = new Set<string>()
  const lop = new Map<string, { n: number; dung: number }>(), dang = new Map<string, number>()
  for (const e of ev) {
    const x = em.get(e.sbd)
    if (!x) continue
    if (!daVao.has(e.sbd)) { daVao.add(e.sbd); tin.push({ luc: e.ms, loai: 'cham', chu: x.hoTen, phu: `· ${x.tenLop} · vừa vào học` }) }
    const c = e.kq === 1 ? (chuoiDung.get(e.sbd) ?? 0) + 1 : 0
    chuoiDung.set(e.sbd, c)
    if ((MOC_CHUOI_DUNG as readonly number[]).includes(c)) tin.push({ luc: e.ms, loai: 'len', chu: x.hoTen, phu: `· ${x.tenLop} · đúng ${c} câu liền` })
    const l = lop.get(x.tenLop) ?? { n: 0, dung: 0 }
    l.n++; l.dung += e.kq
    if (l.n >= CAU_MOI_DONG_LOP) {
      tin.push({ luc: e.ms, loai: 'cham', chu: x.tenLop, phu: `· thêm ${l.n} câu · đúng ${Math.round((l.dung / l.n) * 100)} %` })
      l.n = 0; l.dung = 0
    }
    lop.set(x.tenLop, l)
    if (e.kq === 0 && e.dang) {
      const s = (dang.get(e.dang) ?? 0) + 1
      if (s >= LUOT_SAI_MOI_DONG_DANG) { tin.push({ luc: e.ms, loai: 'xuong', chu: e.dang, phu: `· ${s} lượt sai vừa qua`, dang: e.dang }); dang.set(e.dang, 0) } else dang.set(e.dang, s)
    }
  }
  return tin.sort((a, b) => a.luc - b.luc)
}

// ------------------------------------------------------------------ ĐỌC D1 ------------------------------------------------------------------
async function docEm(env: Env): Promise<Map<string, EmInfo>> {
  const sql = (co: boolean) => `SELECT sbd, ho_ten, lop, ${co ? 'ten_lop' : 'NULL AS ten_lop'}, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, 0 AS uu FROM danh_sach`
  const r = await env.DB.prepare(sql(true)).all<Hang>().catch(() => env.DB.prepare(sql(false)).all<Hang>())
  const em = new Map<string, EmInfo>()
  for (const x of [...(r.results ?? [])].sort((a, b) => so(b.uu) - so(a.uu))) {
    const sbd = chuoi(x.sbd)
    if (!sbd || sbd === SBD_THU || em.get(sbd)?.hoTen) continue
    em.set(sbd, { hoTen: chuoi(x.ho_ten), tenLop: tenLopCuaEm(chuoi(x.lop), x.ten_lop) })
  }
  return em
}

async function tinhSong(env: Env, bt: Hang, nowMs: number): Promise<{ phan: Hang; nhip: Hang; soTruyVan: number }> {
  let soTruyVan = 0
  const tuHomNay = chuoi(bt.tuHomNay), tuMs = Date.parse(chuoi(bt.tu)), tuHomNayMs = Date.parse(tuHomNay)
  let em: Map<string, EmInfo>
  if (demEm && conHan(demEm.at, nowMs, DEM_BANG_TIN_MS)) em = demEm.em
  else { em = await docEm(env); soTruyVan++; demEm = { at: nowMs, em } }
  // sự kiện HÔM NAY (từ mốc), đã chấm, theo thời gian (đi chỉ mục idx_skh_luc khi đã có)
  const rSu = await env.DB.prepare(
    "SELECT sbd, luc, ket_qua, COALESCE(ma_dang, '') AS ma_dang FROM su_kien_hoc WHERE luc >= ? AND ket_qua IS NOT NULL ORDER BY luc LIMIT ?",
  ).bind(tuHomNay, TOI_DA_SU_KIEN).all<Hang>(); soTruyVan++
  const ev: Ev[] = []
  for (const x of rSu.results ?? []) {
    const sbd = chuoi(x.sbd), ms = Date.parse(chuoi(x.luc))
    if (!em.has(sbd) || !Number.isFinite(ms) || ms > nowMs) continue
    ev.push({ sbd, ms, kq: so(x.ket_qua) === 1 ? 1 : 0, dang: chuoi(x.ma_dang) })
  }
  // tổng + theo em + theo lớp (MỘT nguồn ⇒ các khối khớp nhau)
  const theoEm = new Map<string, { n: number; dung: number }>(), theoLop = new Map<string, { daHoc: Set<string>; n: number; dung: number }>()
  let soCauDung = 0
  for (const e of ev) {
    const a = theoEm.get(e.sbd) ?? { n: 0, dung: 0 }; a.n++; a.dung += e.kq; theoEm.set(e.sbd, a)
    const tl = em.get(e.sbd)!.tenLop
    const l = theoLop.get(tl) ?? { daHoc: new Set<string>(), n: 0, dung: 0 }; l.daHoc.add(e.sbd); l.n++; l.dung += e.kq; theoLop.set(tl, l)
    soCauDung += e.kq
  }
  const siSo = new Map<string, number>()
  for (const [, x] of em) siSo.set(x.tenLop, (siSo.get(x.tenLop) ?? 0) + 1)
  const canDeY = (bt.canDeY as { ds?: { sbd?: unknown; lyDo?: { loai?: unknown }[] }[] } | undefined)?.ds ?? []
  const dangVap = new Set(canDeY.filter((x) => (x.lyDo ?? []).some((l) => l.loai === 'sai_nhieu')).map((x) => chuoi(x.sbd)))
  // NỀN tiến bộ của CHÍNH em: các ngày từ mốc tới đầu hôm nay (mốc trước hôm nay mới có); không có ⇒ tienBo 0. Không so em này với em khác.
  let nen0 = new Map<string, { n: number; dung: number }>()
  const tuNenMs = Math.max(tuMs, tuHomNayMs - NGAY_NEN_TIEN_BO * 86_400_000)
  if (Number.isFinite(tuNenMs) && tuNenMs < tuHomNayMs) {
    const khoaNen = `${new Date(tuNenMs).toISOString()}|${tuHomNay}`
    if (demNen && demNen.khoa === khoaNen && conHan(demNen.at, nowMs, DEM_CHAM_MS)) nen0 = demNen.nen
    else {
      const rNen = await env.DB.prepare(
        'SELECT sbd, COUNT(*) AS n, SUM(ket_qua) AS d FROM su_kien_hoc WHERE luc >= ? AND luc < ? AND ket_qua IS NOT NULL GROUP BY sbd',
      ).bind(new Date(tuNenMs).toISOString(), tuHomNay).all<Hang>().catch(() => null); soTruyVan++
      for (const x of rNen?.results ?? []) nen0.set(chuoi(x.sbd), { n: so(x.n), dung: so(x.d) })
      if (rNen) demNen = { at: nowMs, khoa: khoaNen, nen: nen0 } // lỗi đọc ⇒ KHÔNG đệm (lần sau đọc lại)
    }
  }
  const danDau = [...theoEm].filter(([sbd, a]) => em.has(sbd) && a.n >= DAN_DAU_TOI_THIEU_CAU).map(([sbd, a]) => {
    const b = nen0.get(sbd), x = em.get(sbd)!
    return { sbd, hoTen: x.hoTen, tenLop: x.tenLop, soCau: a.n, tienBo: b && b.n > 0 ? Math.round((a.dung / a.n - b.dung / b.n) * 100) : 0 }
  }).sort((p, q) => q.soCau - p.soCau || q.tienBo - p.tienBo || (p.sbd < q.sbd ? -1 : 1)).slice(0, TOI_DA_DAN_DAU)
  // băng tin: từ sổ + bài vừa nộp; cũ → mới, ≤ 20 mới nhất
  const tin = taoTinTuSu(ev, em)
  const rNop = await env.DB.prepare(
    `SELECT be.sbd, be.nop_luc, (SELECT bc.chuyen_de FROM btvn_cau bc WHERE bc.ma_btvn = be.ma_btvn AND COALESCE(bc.chuyen_de, '') <> '' GROUP BY bc.chuyen_de ORDER BY COUNT(*) DESC, bc.chuyen_de LIMIT 1) AS cd
       FROM btvn_em be WHERE be.nop_luc >= ? AND be.thu_hoi = 0 ORDER BY be.nop_luc DESC LIMIT 20`,
  ).bind(tuHomNay).all<Hang>().catch(() => ({ results: [] as Hang[] })); soTruyVan++
  for (const x of rNop.results ?? []) {
    const e = em.get(chuoi(x.sbd)), ms = Date.parse(chuoi(x.nop_luc))
    if (e && Number.isFinite(ms) && ms <= nowMs) tin.push({ luc: ms, loai: 'len', chu: e.hoTen, phu: `· ${e.tenLop} · vừa nộp bài${chuoi(x.cd) ? ` ${chuoi(x.cd)}` : ''}` })
  }
  tin.sort((a, b) => a.luc - b.luc)
  const tinCat = tin.slice(-TOI_DA_TIN)
  const maDang = tinCat.map((t) => t.dang ?? '').filter(Boolean)
  if (maDang.length) {
    if (!demTenDang || !conHan(demTenDang.at, nowMs, DEM_CHAM_MS)) demTenDang = { at: nowMs, ten: new Map() }
    const thieu = [...new Set(maDang)].filter((m) => !demTenDang!.ten.has(m))
    if (thieu.length) {
      const tra = await tenCuaCacDang(env, thieu); soTruyVan++
      for (const m of thieu) demTenDang.ten.set(m, tra.get(m) ?? '') // dạng chưa có tên cũng đệm (không hỏi lại mỗi 10 giây)
    }
    for (const t of tinCat) if (t.dang) t.chu = demTenDang.ten.get(t.dang) || 'Một dạng bài'
  }
  const suKienMoi: TinSan[] = tinCat.map(({ luc, loai, chu, phu }) => ({ luc, loai, chu, ...(phu ? { phu } : {}) }))
  const dn = (bt.nhip as { btvnDungNhip?: { dungNhip?: number; tongEm?: number } } | undefined)?.btvnDungNhip
  const nen = tinhNen(ev, nowMs)
  const nhipGhiDe = { soCau: ev.length, soCauDung, soEmHoc: theoEm.size, tongEm: em.size, ...(ev.length ? { tiLeDung: tron(soCauDung / ev.length, 3) } : {}) }
  return {
    soTruyVan,
    nhip: nhipGhiDe,
    phan: {
      tongEm: em.size,
      // "Bài tập về nhà đúng nhịp": soEm = số em đúng nhịp; soCoLo = số em có bài đang chạy (mẫu số). Chưa có bài ⇒ null.
      dungNhip: dn && Number(dn.tongEm) > 0 ? { soEm: Number(dn.dungNhip) || 0, soCoLo: Number(dn.tongEm) || 0 } : null,
      tia60: { ...tinhTia(ev, nowMs), nhip: null },
      nen,
      theoLop: [...siSo].map(([lop, n]) => ({ lop, siSo: n, daHoc: theoLop.get(lop)?.daHoc.size ?? 0, soCau: theoLop.get(lop)?.n ?? 0, soCauDung: theoLop.get(lop)?.dung ?? 0 })).sort((a, b) => a.lop.localeCompare(b.lop, 'vi')),
      nhiet: [...em].map(([sbd, x]) => ({ sbd, hoTen: x.hoTen, lop: x.tenLop, soCau: theoEm.get(sbd)?.n ?? 0, soCauDung: theoEm.get(sbd)?.dung ?? 0, dangVap: dangVap.has(sbd) }))
        .sort((a, b) => a.lop.localeCompare(b.lop, 'vi') || a.hoTen.localeCompare(b.hoTen, 'vi') || (a.sbd < b.sbd ? -1 : 1)),
      suKienMoi,
      danDau,
    },
  }
}

/**
 * Lệnh chính. Đệm: phần "trực tiếp" 10 giây, phần `gvBangTin` 60 giây (xem đầu tệp). `serverNow` = giờ máy chủ LÚC TRẢ LỜI. Lỗi ở phần bản 3 ⇒ trả lỗi đó (không trả nửa vời);
 * lỗi ở phần trực tiếp ⇒ trả các khối của bản 3 mà KHÔNG có `song` (máy thầy dùng Bảng tin bản 3). `khoiRieng` (route): khối phụ gộp vào phần bản 3 và đệm cùng nó (vd `chuaHocHomNay`).
 */
export async function gvBangTinSong(env: Env, _b: Hang = {}, nowMs: number = Date.now(), tuyChon: { dem?: boolean; khoiRieng?: (env: Env) => Promise<Hang> } = {}): Promise<Hang> {
  const dungDem = tuyChon.dem !== false
  let soTruyVan = 0
  let bt: Hang
  const conMoiBt = dungDem && demBangTin !== null && nowMs - demBangTin.at >= 0 && nowMs - demBangTin.at < DEM_BANG_TIN_MS
  if (conMoiBt) bt = demBangTin!.kq
  else {
    bt = await gvBangTin(env, {}, nowMs)
    if (bt.ok !== true) return bt
    soTruyVan += so(bt.soTruyVan)
    if (tuyChon.khoiRieng) { try { bt = { ...bt, ...(await tuyChon.khoiRieng(env)) } } catch (e) { console.error('[bang-tin-song] khối phụ lỗi (vắng):', e instanceof Error ? e.message : e) } }
    if (dungDem) demBangTin = { at: nowMs, kq: bt }
  }
  let song: Hang | null = null, nhipGhiDe: Hang = {}
  const conMoiSong = dungDem && demSong !== null && conMoiBt && nowMs - demSong.at >= 0 && nowMs - demSong.at < DEM_SONG_MS
  if (conMoiSong) { song = (demSong!.kq as { song: Hang }).song; nhipGhiDe = (demSong!.kq as { nhip: Hang }).nhip }
  else {
    try {
      const t = await tinhSong(env, bt, nowMs)
      song = t.phan; nhipGhiDe = t.nhip; soTruyVan += t.soTruyVan
      if (dungDem) demSong = { at: nowMs, kq: { song, nhip: nhipGhiDe } }
    } catch (e) {
      console.error('[bang-tin-song] phần trực tiếp lỗi (khối song vắng):', e instanceof Error ? e.message : e)
    }
  }
  const { soTruyVan: _dem, nhip: nhipBt, ...btCon } = bt
  return { ...btCon, nhip: { ...((nhipBt as Hang) ?? {}), ...nhipGhiDe }, ...(song ? { song } : {}), ok: true, serverNow: nowMs, soTruyVan, dem: { bangTin: conMoiBt, song: conMoiSong } }
}
