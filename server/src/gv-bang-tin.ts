// `POST /gv/bang-tin {}` — BẢNG TIN CỦA THẦY bản 3 (thầy lệnh 21/09; đề bài prompt-bang-tin-thay-v3.md mục 1; hợp đồng docs/hop-dong-bang-tin-v3-2109.md — Code 3 → Code 4).
// MỘT lệnh ĐỌC-CHỈ cho cả màn Hôm nay: ≤ 12 truy vấn D1, không ghi, không AI. Mọi con số "hôm nay" chỉ đếm sự kiện `luc ≥ mốc` (`cau_hinh.bang_tin_tu`); mốc CHỈ LỌC HIỂN THỊ (thuật toán cá nhân hoá vẫn dùng toàn bộ lịch sử).
// Khối nào thiếu số liệu thật thì VẮNG (không bịa, không số 0 giả); thiếu bảng/cột ⇒ khối vắng + `lyDoThieu`, lệnh vẫn ok.
import type { Env } from './kieu'
import { themNgay } from './ho-so-nam-kt'
import { ngayVnCuaMs, trangThaiNopBai } from './canh-bao-thay'
import { buoiCua, docCauHinhNhac, KHOA_CAU_HINH, KHOA_LAN_CHAY, lanChayKe, thuCua, trongKhung } from './nhac-tu-dong'
import { tenCuaCacDang } from './ten-dang-bo-nao'
import { tenLopCuaEm } from './ten-lop'

type Dong = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const json = (v: unknown): string => JSON.stringify(v)
const GIO_VN_MS = 7 * 3_600_000
const MOT_NGAY_MS = 86_400_000
const DANG_ISO = /^\d{4}-\d{2}-\d{2}T/
const tron = (n: number, k: number): number => Math.round(n * 10 ** k) / 10 ** k

export const KHOA_MOC_BANG_TIN = 'bang_tin_tu'
/** Tài khoản thử của hệ thống — không tính vào số liệu lớp. */
export const SBD_THU = '12121212'
export const SO_NGAY_CUA_SO = 14 // cửa sổ đọc sổ học (chuỗi ngày bền bỉ tối đa 14)
export const SO_NGAY_DANG_VAP = 3 // dạng vấp tính trên 3 ngày gần nhất (nhưng không trước mốc)
export const TOI_DA_BAI = 8
export const TOI_DA_TIEN_BO = 3
export const TOI_DA_CAN_DE_Y = 5
export const TOI_DA_DANG_VAP = 5
export const TOI_DA_GOI_Y = 2
export const CHAM_NHAT_TOI_THIEU = 5
export const BEN_BI_LUOT_MOI_NGAY = 5
export const BEN_BI_TOI_THIEU_NGAY = 2
export const SAI_NHIEU_TOI_THIEU_LUOT = 4
export const SAI_NHIEU_TI_LE = 0.6
export const VAP_TOI_THIEU_LUOT = 2
export const VAP_TI_LE = 0.5
export const DANG_VAP_TOI_THIEU_EM = 3
export const GIO_BO_NAO_TOI_DA = 26
export const PHUT_CRON_NHAC_TOI_DA = 45

function boDem(env: Env) {
  let n = 0
  return {
    dem: () => n,
    tinh: () => { n++ },
    async hoi(sql: string, ...bind: unknown[]): Promise<Dong[] | null> {
      n++
      try {
        return ((await env.DB.prepare(sql).bind(...bind).all<Dong>()).results ?? []) as Dong[]
      } catch (e) {
        console.error('[bang-tin] truy vấn lỗi (khối liên quan vắng):', e instanceof Error ? e.message : e, sql.replace(/\s+/g, ' ').slice(0, 70))
        return null
      }
    },
  }
}

const dauNgayMs = (ngay: string): number => Date.parse(`${ngay}T00:00:00+07:00`)
const iso = (ms: number): string => new Date(ms).toISOString()
const gioVn = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(11, 16)
const ddmm = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`

/** Hạn nộp viết cho thầy: "12:00 trưa nay" · "12:00 trưa mai (Thứ Tư 23/09)" · "12:00 Thứ Tư 23/09". */
export function chuHanBangTin(hanIso: string, nowMs: number): string {
  const han = Date.parse(hanIso)
  if (!Number.isFinite(han)) return 'chưa rõ'
  const ngay = ngayVnCuaMs(han)
  const gio = gioVn(han)
  if (ngay === ngayVnCuaMs(nowMs)) return `${gio} ${buoiCua(gio)} nay`
  if (ngay === ngayVnCuaMs(nowMs + MOT_NGAY_MS)) return `${gio} ${buoiCua(gio)} mai (${thuCua(ngay)} ${ddmm(ngay)})`
  return `${gio} ${thuCua(ngay)} ${ddmm(ngay)}`
}

/** Mốc bảng tin: khoá hợp lệ ⇒ dùng; vắng/hỏng ⇒ 00:00 hôm nay (giờ VN), `tuDangAp = false`. */
export function docMocBangTin(giaTri: unknown, homNay: string): { tuMs: number; tuDangAp: boolean } {
  const t = typeof giaTri === 'string' && DANG_ISO.test(giaTri.trim()) ? Date.parse(giaTri.trim()) : NaN
  return Number.isFinite(t) ? { tuMs: t, tuDangAp: true } : { tuMs: dauNgayMs(homNay), tuDangAp: false }
}

export async function gvBangTin(env: Env, _b: Dong = {}, nowMs: number = Date.now()): Promise<Dong> {
  const ngay = ngayVnCuaMs(nowMs)
  const homQua = themNgay(ngay, -1)
  const Q = boDem(env)
  const lyDoThieu: Record<string, string> = {}

  // 1 · em + tên lớp
  let rEm = await Q.hoi("SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, 0 AS uu FROM danh_sach")
  if (!rEm) rEm = await Q.hoi("SELECT sbd, ho_ten, lop, NULL AS ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, 0 AS uu FROM danh_sach")
  if (!rEm) return { ok: false, error: 'Không đọc được danh sách học sinh', soTruyVan: Q.dem() }
  const em = new Map<string, { hoTen: string; tenLop: string }>()
  for (const x of [...rEm].sort((a, c) => so(c.uu) - so(a.uu))) {
    const sbd = chuoi(x.sbd)
    if (!sbd || sbd === SBD_THU) continue
    if (em.get(sbd)?.hoTen) continue // hồ sơ (đã xếp trước) thắng danh sách cổng
    em.set(sbd, { hoTen: chuoi(x.ho_ten), tenLop: tenLopCuaEm(chuoi(x.lop), x.ten_lop) })
  }

  // 2 · cấu hình: mốc, cờ nhắc, lượt cron nhắc gần nhất
  const rCfg = await Q.hoi("SELECT khoa, gia_tri, cap_nhat_luc FROM cau_hinh WHERE khoa IN (?, ?, ?)", KHOA_MOC_BANG_TIN, KHOA_CAU_HINH, KHOA_LAN_CHAY)
  const cfg = new Map((rCfg ?? []).map((x) => [chuoi(x.khoa), x]))
  const { tuMs, tuDangAp } = docMocBangTin(cfg.get(KHOA_MOC_BANG_TIN)?.gia_tri, ngay)
  const dauHomNay = dauNgayMs(ngay)
  const tuHomNayMs = Math.max(tuMs, dauHomNay)
  const tuHomNay = iso(tuHomNayMs)
  const cfgNhac = docCauHinhNhac(cfg.get(KHOA_CAU_HINH)?.gia_tri)
  const cronNhacLuc = chuoi(cfg.get(KHOA_LAN_CHAY)?.cap_nhat_luc)

  // 3 · sổ học từ mốc (cửa sổ ≤ 14 ngày): (ngày, em, dạng) → số lượt đã chấm, số đúng
  const batDauSo = Math.max(tuMs, dauNgayMs(themNgay(ngay, -(SO_NGAY_CUA_SO - 1))))
  const rSo = await Q.hoi(
    `SELECT ngay_vn, sbd, COALESCE(ma_dang, '') AS ma_dang, COUNT(*) AS n, SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) AS dung
       FROM su_kien_hoc WHERE luc >= ? AND ket_qua IS NOT NULL GROUP BY ngay_vn, sbd, ma_dang`,
    iso(batDauSo),
  )
  if (!rSo) lyDoThieu.nhip = 'Không đọc được sổ học'
  interface Sl { n: number; dung: number }
  const homNay = new Map<string, Map<string, Sl>>() // sbd → dạng → số
  const theoNgayEm = new Map<string, Map<string, number>>() // sbd → ngày → số lượt
  const dangVapSo = new Map<string, Map<string, Sl>>() // dạng → sbd → số (3 ngày gần nhất)
  const tongHomQua: Sl & { em: Set<string> } = { n: 0, dung: 0, em: new Set() }
  const dauVap = themNgay(ngay, -(SO_NGAY_DANG_VAP - 1))
  for (const x of rSo ?? []) {
    const sbd = chuoi(x.sbd)
    if (!em.has(sbd)) continue
    const nd = chuoi(x.ngay_vn)
    const n = so(x.n)
    const dung = so(x.dung)
    const ma = chuoi(x.ma_dang)
    const t = theoNgayEm.get(sbd) ?? new Map<string, number>()
    t.set(nd, (t.get(nd) ?? 0) + n)
    theoNgayEm.set(sbd, t)
    if (nd === ngay) {
      const m = homNay.get(sbd) ?? new Map<string, Sl>()
      const c = m.get(ma) ?? { n: 0, dung: 0 }
      m.set(ma, { n: c.n + n, dung: c.dung + dung })
      homNay.set(sbd, m)
    }
    if (nd === homQua) { tongHomQua.n += n; tongHomQua.dung += dung; tongHomQua.em.add(sbd) }
    if (nd >= dauVap && ma) {
      const d = dangVapSo.get(ma) ?? new Map<string, Sl>()
      const c = d.get(sbd) ?? { n: 0, dung: 0 }
      d.set(sbd, { n: c.n + n, dung: c.dung + dung })
      dangVapSo.set(ma, d)
    }
  }

  // nhịp
  let soCauHomNay = 0
  let dungHomNay = 0
  for (const m of homNay.values()) for (const c of m.values()) { soCauHomNay += c.n; dungHomNay += c.dung }
  const nhip: Dong = {
    soEmHoc: [...homNay.values()].filter((m) => [...m.values()].some((c) => c.n > 0)).length,
    tongEm: em.size,
    soCau: soCauHomNay,
    soCauDung: dungHomNay,
    ...(soCauHomNay > 0 ? { tiLeDung: tron(dungHomNay / soCauHomNay, 3) } : {}),
    // chỉ so với hôm qua khi CẢ ngày hôm qua nằm sau mốc (không bịa số của nửa ngày)
    ...(rSo && dauNgayMs(homQua) >= tuMs && tongHomQua.n > 0 ? { homQua: { soEmHoc: tongHomQua.em.size, soCau: tongHomQua.n, tiLeDung: tron(tongHomQua.dung / tongHomQua.n, 3) } } : {}),
  }

  // 4 · hồ sơ nắm kiến thức: câu sai trước nay làm đúng lại, câu sai mới đưa về lịch ôn (từ đầu "hôm nay" của bảng tin)
  const rNk = await Q.hoi("SELECT sbd, trang_thai, COUNT(*) AS n FROM nam_kt_cau WHERE trang_thai IN ('da_khac_phuc', 'moi_sai') AND luc_cuoi >= ? GROUP BY sbd, trang_thai", tuHomNay)
  const dungLai = new Map<string, number>()
  let soCauVeLichOn = 0
  for (const x of rNk ?? []) {
    if (chuoi(x.trang_thai) === 'da_khac_phuc' && em.has(chuoi(x.sbd))) dungLai.set(chuoi(x.sbd), so(x.n))
    if (chuoi(x.trang_thai) === 'moi_sai' && em.has(chuoi(x.sbd))) soCauVeLichOn += so(x.n)
  }

  // 5 · bài tập về nhà giao sau mốc, còn sống
  const sqlBai = (coCaNhan: boolean) =>
    `SELECT b.ma_btvn, b.giao_luc, b.han_nop, ${coCaNhan ? 'COALESCE(b.ca_nhan, 0)' : '0'} AS ca_nhan, COALESCE(NULLIF(TRIM(c.ten_ca), ''), d.ten_de, b.ma_de) AS ten
       FROM btvn b LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de
      WHERE b.da_xoa = 0 AND b.giao_luc >= ? AND b.giao_luc <= ? AND b.han_nop >= ? ORDER BY b.han_nop, b.ma_btvn LIMIT ${TOI_DA_BAI}`
  const bindBai = [iso(tuMs), iso(nowMs), iso(nowMs - MOT_NGAY_MS)]
  let rBai = await Q.hoi(sqlBai(true), ...bindBai)
  if (!rBai) rBai = await Q.hoi(sqlBai(false), ...bindBai)
  if (!rBai) lyDoThieu.baiTap = 'Không đọc được bài tập về nhà'
  const bai = (rBai ?? []).map((x) => ({ ma: chuoi(x.ma_btvn), giaoLuc: chuoi(x.giao_luc), han: chuoi(x.han_nop), hanMs: Date.parse(chuoi(x.han_nop)), ten: chuoi(x.ten) })).filter((b) => b.ma)

  // 6 · em của các bài đó
  const sqlEm = (day: boolean) =>
    `SELECT ma_btvn, sbd, nop_luc, ${day ? 'COALESCE(so_chang, 0) AS so_chang, COALESCE(lo_da_xong, 0) AS lo_da_xong, chot_luc' : '0 AS so_chang, 0 AS lo_da_xong, NULL AS chot_luc'},
            (COALESCE(dap_an_json, '') NOT IN ('', '{}')) AS co_da, xong_vong1_luc
       FROM btvn_em WHERE ma_btvn IN (SELECT value FROM json_each(?)) AND thu_hoi = 0`
  let rBe = bai.length > 0 ? await Q.hoi(sqlEm(true), json(bai.map((b) => b.ma))) : []
  if (!rBe && bai.length > 0) rBe = await Q.hoi(sqlEm(false), json(bai.map((b) => b.ma)))
  if (!rBe) lyDoThieu.baiTap = 'Không đọc được em của bài tập về nhà'

  // 7 · nhắc tự động hôm nay
  const rNhac = await Q.hoi('SELECT ma_btvn, moc, sbd, ph_nhom FROM canh_bao_thay WHERE ngay = ? AND gui_luc >= ?', ngay, tuHomNay)
  if (!rNhac) lyDoThieu.nhacNopBai = 'Chưa có bảng nhắc'
  const nhacTuDong = (rNhac ?? []).filter((x) => chuoi(x.moc) !== 'tay')

  // 8 · Bộ não: điều chỉnh đã áp hôm nay + bản tin gần nhất
  const rDc = await Q.hoi('SELECT sbd, json FROM ai_dieu_chinh WHERE ngay = ? AND ap_dung = 1 AND huy = 0', ngay)
  const rBt = await Q.hoi('SELECT ngay, json, nop_luc, so_em, so_nhan FROM ai_ban_tin WHERE ngay <= ? ORDER BY ngay DESC LIMIT 1', ngay)
  // 9 · vinh danh hôm nay (bản đã đăng hôm nay lưu ở ngày hôm qua)
  const rVd = await Q.hoi('SELECT body FROM daily_honors WHERE day = ?', homQua)

  // ---------------------------------------------------------------- baiTap[]
  const baiTap: Dong[] = []
  const daoBai = new Map<string, { chuaMo: number; dangLam: number; daNop: number; chotSo: number; chotXong: number; chotTong: number; tenLop: Map<string, number> }>()
  const emChuaMoSatHan = new Map<string, { ten: string; han: string; hanMs: number }[]>()
  const emQuaHan = new Map<string, { ten: string; han: string }[]>()
  const emDaChot = new Set<string>()
  for (const x of rBe ?? []) {
    const ma = chuoi(x.ma_btvn)
    const sbd = chuoi(x.sbd)
    const b = bai.find((y) => y.ma === ma)
    if (!b || !em.has(sbd)) continue
    const d = daoBai.get(ma) ?? { chuaMo: 0, dangLam: 0, daNop: 0, chotSo: 0, chotXong: 0, chotTong: 0, tenLop: new Map<string, number>() }
    const st = trangThaiNopBai({ ...x, dap_an_json: so(x.co_da) === 1 ? '{"x":1}' : '' }, b.han, nowMs) // `co_da` = đã có ít nhất một đáp án (không tải cả JSON đáp án)
    const nop = chuoi(x.nop_luc) !== ''
    if (nop) d.daNop++
    else if (st.trangThai === 'chua_mo') d.chuaMo++
    else d.dangLam++
    if (so(x.so_chang) > 0 && chuoi(x.chot_luc) !== '') { d.chotSo++; d.chotXong += so(x.lo_da_xong); d.chotTong += so(x.so_chang) }
    if (chuoi(x.chot_luc) !== '' && Date.parse(chuoi(x.chot_luc)) >= tuHomNayMs) emDaChot.add(sbd)
    const tl = em.get(sbd)!.tenLop
    d.tenLop.set(tl, (d.tenLop.get(tl) ?? 0) + 1)
    daoBai.set(ma, d)
    if (!nop && st.trangThai === 'chua_mo' && b.hanMs > nowMs && b.hanMs - nowMs <= MOT_NGAY_MS) emChuaMoSatHan.set(sbd, [...(emChuaMoSatHan.get(sbd) ?? []), { ten: b.ten, han: b.han, hanMs: b.hanMs }])
    if (!nop && b.hanMs <= nowMs) emQuaHan.set(sbd, [...(emQuaHan.get(sbd) ?? []), { ten: b.ten, han: b.han }])
  }
  const luotKe = cfgNhac.bat ? lanChayKe(nowMs, cfgNhac) : undefined
  for (const b of bai) {
    const d = daoBai.get(b.ma)
    if (!d) continue
    const tong = d.chuaMo + d.dangLam + d.daNop
    const lop = [...d.tenLop].sort((a, c) => c[1] - a[1] || (a[0] < c[0] ? -1 : 1))
    const nhac = nhacTuDong.filter((x) => chuoi(x.ma_btvn) === b.ma)
    baiTap.push({
      maBtvn: b.ma, ten: b.ten, tenLop: lop[0]?.[0] ?? '', nhieuLop: lop.length > 1, giaoLuc: b.giaoLuc, hanNop: b.han, quaHan: b.hanMs <= nowMs,
      tong, chuaMo: d.chuaMo, dangLam: d.dangLam, daNop: d.daNop,
      ...(d.chotSo > 0 ? { chang: { tbDaXong: tron(d.chotXong / d.chotSo, 1), tong: Math.round(d.chotTong / d.chotSo), soEm: d.chotSo } } : {}),
      nhac: { soEm: new Set(nhac.map((x) => chuoi(x.sbd))).size, soPhuHuynh: new Set(nhac.map((x) => chuoi(x.ph_nhom)).filter(Boolean)).size, ...(luotKe ? { luotKe } : {}) },
    })
  }

  // ---------------------------------------------------------------- tienBo[]
  const soHomNayCuaEm = (sbd: string): number => [...(homNay.get(sbd)?.values() ?? [])].reduce((s, c) => s + c.n, 0)
  const chuoiNgay = (sbd: string): number => {
    const t = theoNgayEm.get(sbd)
    if (!t) return 0
    let k = 0
    for (let d = ngay; (t.get(d) ?? 0) >= BEN_BI_LUOT_MOI_NGAY; d = themNgay(d, -1)) k++
    return k
  }
  const goiTen = (sbd: string) => ({ sbd, hoTen: em.get(sbd)?.hoTen ?? '', tenLop: em.get(sbd)?.tenLop ?? '' })
  const tienBo: Dong[] = []
  const chamNhat = [...em.keys()].map((sbd) => ({ sbd, n: soHomNayCuaEm(sbd) })).filter((x) => x.n >= CHAM_NHAT_TOI_THIEU).sort((a, c) => c.n - a.n || (a.sbd < c.sbd ? -1 : 1))[0]
  if (chamNhat) tienBo.push({ loai: 'cham_nhat', ...goiTen(chamNhat.sbd), so: chamNhat.n, chu: `${chamNhat.n} câu đã làm hôm nay` })
  const tienBoNhat = [...dungLai].map(([sbd, n]) => ({ sbd, n })).filter((x) => x.n >= 1).sort((a, c) => c.n - a.n || (a.sbd < c.sbd ? -1 : 1))[0]
  if (tienBoNhat) tienBo.push({ loai: 'tien_bo_nhat', ...goiTen(tienBoNhat.sbd), so: tienBoNhat.n, chu: `${tienBoNhat.n} câu sai trước nay đã làm đúng lại hôm nay` })
  const benBi = [...em.keys()].map((sbd) => ({ sbd, n: chuoiNgay(sbd) })).filter((x) => x.n >= BEN_BI_TOI_THIEU_NGAY).sort((a, c) => c.n - a.n || (a.sbd < c.sbd ? -1 : 1))[0]
  if (benBi) tienBo.push({ loai: 'ben_bi_nhat', ...goiTen(benBi.sbd), so: benBi.n, chu: `${benBi.n} ngày liên tiếp làm từ ${BEN_BI_LUOT_MOI_NGAY} câu` })

  // ---------------------------------------------------------------- dangVap[] + tên dạng
  interface Vap { ma: string; soEmVap: number; soEmGap: number }
  const dangVap: Vap[] = []
  for (const [ma, m] of dangVapSo) {
    let vap = 0
    for (const c of m.values()) if (c.n >= VAP_TOI_THIEU_LUOT && (c.n - c.dung) / c.n >= VAP_TI_LE) vap++
    if (vap >= DANG_VAP_TOI_THIEU_EM) dangVap.push({ ma, soEmVap: vap, soEmGap: m.size })
  }
  dangVap.sort((a, c) => c.soEmVap / c.soEmGap - a.soEmVap / a.soEmGap || c.soEmVap - a.soEmVap || (a.ma < c.ma ? -1 : 1))
  const dangVapCat = dangVap.slice(0, TOI_DA_DANG_VAP)

  // ---------------------------------------------------------------- canDeY
  interface LyDo { loai: 'qua_han' | 'sai_nhieu' | 'chua_mo_bai'; chu: string; so?: number; tong?: number; sapXep: number }
  const lyDoCua = new Map<string, LyDo[]>()
  const them = (sbd: string, l: LyDo) => lyDoCua.set(sbd, [...(lyDoCua.get(sbd) ?? []), l])
  const daiSai = new Map<string, { ma: string; sai: number; n: number }>() // dạng sai tệ nhất hôm nay của mỗi em
  for (const [sbd, m] of homNay) {
    for (const [ma, c] of m) {
      const sai = c.n - c.dung
      if (c.n >= SAI_NHIEU_TOI_THIEU_LUOT && sai / c.n >= SAI_NHIEU_TI_LE) {
        const cu = daiSai.get(sbd)
        if (!cu || sai / c.n > cu.sai / cu.n || (sai / c.n === cu.sai / cu.n && c.n > cu.n)) daiSai.set(sbd, { ma, sai, n: c.n })
      }
    }
  }
  const maDangCan = [...dangVapCat.map((d) => d.ma), ...[...daiSai.values()].map((d) => d.ma).filter(Boolean)]
  Q.tinh()
  const tenDang = await tenCuaCacDang(env, maDangCan)
  const tenCua = (ma: string): string => tenDang.get(ma) ?? ma.replace(/^CD:/, '')
  for (const [sbd, ds] of emQuaHan) for (const b of ds.slice(0, 1)) them(sbd, { loai: 'qua_han', chu: `Chưa nộp bài «${b.ten}», đã quá hạn ${chuHanBangTin(b.han, nowMs)}`, sapXep: 0 })
  for (const [sbd, d] of daiSai) them(sbd, { loai: 'sai_nhieu', chu: `Sai ${d.sai}/${d.n} câu${d.ma ? ` dạng ${tenCua(d.ma)}` : ''} hôm nay`, so: d.sai, tong: d.n, sapXep: 1 - d.sai / d.n })
  for (const [sbd, ds] of emChuaMoSatHan) {
    const g = [...ds].sort((a, c) => a.hanMs - c.hanMs)[0]!
    them(sbd, { loai: 'chua_mo_bai', chu: `Chưa mở bài «${g.ten}», hạn ${chuHanBangTin(g.han, nowMs)}`, sapXep: 2 + g.hanMs / 1e14 })
  }
  const dsCan = [...lyDoCua]
    .map(([sbd, ls]) => ({ sbd, ls: [...ls].sort((a, c) => a.sapXep - c.sapXep) }))
    .sort((a, c) => c.ls.length - a.ls.length || a.ls[0]!.sapXep - c.ls[0]!.sapXep || (a.sbd < c.sbd ? -1 : 1))
  const canDeY = { ds: dsCan.slice(0, TOI_DA_CAN_DE_Y).map(({ sbd, ls }) => ({ ...goiTen(sbd), lyDo: ls.map(({ sapXep: _s, ...l }) => l) })), conLai: Math.max(0, dsCan.length - TOI_DA_CAN_DE_Y) }

  // ---------------------------------------------------------------- boNao
  let boNao: Dong | undefined
  const bt = rBt?.[0]
  const dcEm = new Set((rDc ?? []).map((x) => chuoi(x.sbd)))
  let khacPhucLuon = 0
  for (const x of rDc ?? []) {
    try {
      const o = JSON.parse(chuoi(x.json)) as { khacPhuc?: unknown }
      if (Array.isArray(o.khacPhuc) && o.khacPhuc.length > 0) khacPhucLuon++
    } catch { /* dòng hỏng: bỏ */ }
  }
  if (bt) {
    let cacDong: Dong[] = []
    try {
      const o = JSON.parse(chuoi(bt.json)) as { cacDong?: Dong[] }
      cacDong = Array.isArray(o.cacDong) ? o.cacDong : []
    } catch { cacDong = [] }
    const goiY = cacDong.filter((d) => chuoi(d.loai) === 'ca_lop' && chuoi(d.chu)).slice(0, TOI_DA_GOI_Y)
    const tenGoiY = goiY.some((d) => chuoi(d.dang)) ? await tenCuaCacDang(env, goiY.map((d) => chuoi(d.dang))) : new Map<string, string>()
    if (goiY.some((d) => chuoi(d.dang))) Q.tinh()
    boNao = {
      ngay: chuoi(bt.ngay), chayLuc: chuoi(bt.nop_luc), soEmSoi: so(bt.so_em), soEmDieuChinh: dcEm.size, soLoiNhan: so(bt.so_nhan),
      goiY: goiY.map((d) => ({ chu: chuoi(d.chu), ...(chuoi(d.dang) ? { dang: chuoi(d.dang), ...(tenGoiY.has(chuoi(d.dang)) ? { tenDang: tenGoiY.get(chuoi(d.dang)) } : {}) } : {}) })),
    }
  } else if (rBt) {
    lyDoThieu.boNao = 'Chưa có bản tin Bộ não A.I'
  } else {
    lyDoThieu.boNao = 'Không đọc được bản tin Bộ não A.I'
  }

  // ---------------------------------------------------------------- mayDaLam[]
  let soVinhDanh = 0
  try {
    const o = rVd?.[0] ? (JSON.parse(chuoi(rVd[0].body)) as { winners?: unknown[]; publishedAt?: string }) : null
    if (o && Array.isArray(o.winners) && Date.parse(chuoi(o.publishedAt)) >= tuHomNayMs) soVinhDanh = o.winners.length
  } catch { soVinhDanh = 0 }
  const emNhac = new Set(nhacTuDong.map((x) => chuoi(x.sbd)))
  const soPh = new Set(nhacTuDong.map((x) => chuoi(x.ph_nhom)).filter(Boolean)).size
  const soEmBoNaoSoi = bt && chuoi(bt.ngay) === ngay ? so(bt.so_em) : 0
  const mayDaLam: Dong[] = [
    { loai: 'nhac_nop_bai', so: emNhac.size, ...(soPh > 0 ? { soPhuHuynh: soPh } : {}), chu: `Nhắc nộp bài cho ${emNhac.size} em${soPh > 0 ? `, báo ${soPh} phụ huynh` : ''}` },
    { loai: 'khac_phuc_luon', so: khacPhucLuon, chu: `Đưa câu khắc phục vào bài cho ${khacPhucLuon} em` },
    { loai: 'on_lai', so: soCauVeLichOn, chu: `Đưa ${soCauVeLichOn} câu sai về lịch ôn lại` },
    { loai: 'bo_cau_rieng', so: emDaChot.size, chu: `Rút bộ câu riêng cho ${emDaChot.size} em` },
    { loai: 'vinh_danh', so: soVinhDanh, chu: `Vinh danh ${soVinhDanh} em` },
    { loai: 'bo_nao_soi', so: soEmBoNaoSoi, chu: `Bộ não A.I soi ${soEmBoNaoSoi} em` },
  ].filter((x) => (x.so as number) > 0)

  // ---------------------------------------------------------------- sucKhoe
  const boNaoLuc = bt ? Date.parse(chuoi(bt.nop_luc)) : NaN
  const cronLuc = Date.parse(cronNhacLuc)
  const boNaoTt: 'ok' | 'tre' | 'chua_biet' = Number.isFinite(boNaoLuc) ? (nowMs - boNaoLuc <= GIO_BO_NAO_TOI_DA * 3_600_000 ? 'ok' : 'tre') : 'chua_biet'
  const cronTt: 'ok' | 'tre' | 'chua_biet' | 'tat' = !cfgNhac.bat ? 'tat' : !trongKhung(nowMs, cfgNhac) ? 'ok' : Number.isFinite(cronLuc) ? (nowMs - cronLuc <= PHUT_CRON_NHAC_TOI_DA * 60_000 ? 'ok' : 'tre') : 'chua_biet'
  const soTre = Number(boNaoTt === 'tre') + Number(cronTt === 'tre')
  const muc = soTre === 2 ? 'do' : soTre === 1 || boNaoTt === 'chua_biet' || cronTt === 'chua_biet' || cronTt === 'tat' ? 'vang' : 'xanh'
  const chuBoNao = Number.isFinite(boNaoLuc) ? `Bộ não A.I chạy lúc ${gioVn(boNaoLuc)}${boNaoTt === 'tre' ? ' (đã quá 26 giờ)' : ''}` : 'Chưa có dữ liệu Bộ não A.I'
  const chuCron = cronTt === 'tat' ? 'nhắc nộp bài đang tắt' : Number.isFinite(cronLuc) ? `nhắc nộp bài chạy lúc ${gioVn(cronLuc)}${cronTt === 'tre' ? ' (trễ hơn 45 phút)' : ''}` : 'chưa có dữ liệu nhắc nộp bài'
  const sucKhoe: Dong = {
    muc, chu: `${chuBoNao} · ${chuCron}`,
    ...(Number.isFinite(boNaoLuc) ? { boNaoChayLuc: iso(boNaoLuc) } : {}),
    ...(Number.isFinite(cronLuc) ? { cronNhacLuc: iso(cronLuc) } : {}),
  }

  const tenDangVap = dangVapCat.map((d) => ({ ma: d.ma, ten: tenCua(d.ma), soEmVap: d.soEmVap, soEmGap: d.soEmGap }))
  return {
    ok: true, ngay, tu: iso(tuMs), tuHomNay, tuDangAp, capNhatLuc: iso(nowMs),
    nhip, baiTap, tienBo: tienBo.slice(0, TOI_DA_TIEN_BO), canDeY, dangVap: tenDangVap, ...(boNao ? { boNao } : {}), mayDaLam, sucKhoe,
    ...(Object.keys(lyDoThieu).length > 0 ? { lyDoThieu } : {}),
    soTruyVan: Q.dem(),
  }
}
