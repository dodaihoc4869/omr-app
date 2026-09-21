// `POST /gv/bang-tin {}` — BẢNG TIN CỦA THẦY bản 3 (thầy lệnh 21/09; đề bài prompt-bang-tin-thay-v3.md mục 1; hợp đồng docs/hop-dong-bang-tin-v3-2109.md — Code 3 → Code 4).
// MỘT lệnh ĐỌC-CHỈ cho cả màn Hôm nay: ≤ 12 truy vấn D1, không ghi, không AI. Mọi con số "hôm nay" chỉ đếm sự kiện `luc ≥ mốc` (`cau_hinh.bang_tin_tu`); mốc CHỈ LỌC HIỂN THỊ (thuật toán cá nhân hoá vẫn dùng toàn bộ lịch sử).
// Khối nào thiếu số liệu thật thì VẮNG (không bịa, không số 0 giả); thiếu bảng/cột ⇒ khối vắng + `lyDoThieu`, lệnh vẫn ok.
import type { Env } from './kieu'
import { themNgay } from './ho-so-nam-kt'
import { ngayVnCuaMs, trangThaiNopBai } from './canh-bao-thay'
import { buoiCua, docCauHinhNhac, KHOA_CAU_HINH, KHOA_LAN_CHAY, lanChayKe, thuCua, trongKhung } from './nhac-tu-dong'
import { tenCuaCacDang } from './ten-dang-bo-nao'
import { tenLopCuaEm } from './ten-lop'
import { docLichDaLuu, moLucChang, moLucGocChangMoSom } from './btvn-nang-do-chang'
import { baiTuNgayMoc, docMocHienThiMs, giaiMocHienThi, KHOA_HIEN_THI_TU, KHOA_VE_DICH_TU, type MocHienThi } from './moc-no'
import { tenViec } from './nhat-ky-may'
import { docCoTuDong, KHOA_TU_DONG } from './tu-dong-cac-viec'
import { docThuThachTuDieuChinh, NGUON_THU_THACH, thuThachDaApTuHang } from './thu-thach-rieng'
import { KHIEN_MAT_KHI_VANG_NGAY } from './exp-cau-hinh'
import { docSaiNhanhDem, KHOA_SAI_NHANH_GV } from './sai-nhanh-gv'

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
/** Trễ nặng ⇒ ĐỎ: Bộ não quá gấp đôi ngưỡng (52 giờ), cron nhắc quá 120 phút; lỗi lặp ≥ 3 lần trong 24 giờ; lời bị loại ≥ 5 và ≥ gấp đôi trung vị 7 đêm gần nhất ⇒ vàng. */
export const PHUT_CRON_NHAC_DO = 120
export const LOI_MAY_DO_TU_LAN = 3
export const LOI_MAY_SO_GIO = 24
export const LOAI_TOI_THIEU_LOI = 5
export const LOAI_GAP_TRUNG_VI = 2
export const SO_DEM_TRUNG_VI = 7

/** Mã kỹ thuật của tờ đề (vd `DH-12-C2-B4-TN` hoặc danh sách `DH-…-TN,DH-…-DS`): không được hiện ra cho thầy. */
const LA_MA_KY_THUAT = /^[A-Z]{1,5}(-[A-Z0-9]+){2,}(\s*,\s*[A-Z]{1,5}(-[A-Z0-9]+){2,})*$/
/** TÊN HIỂN THỊ của một bài tập về nhà (Boss/Code 4 21/09: "tên chuyên đề + lớp", không mã kỹ thuật): chuyên đề trội nhất của bộ câu (`btvn_cau.chuyen_de`) → tên ca/tờ nếu KHÔNG phải mã → "Bài tập về nhà"; kèm " · <lớp>" khi có. */
export function tenBaiHienThi(chuyenDe: string, ten: string, tenLop = ''): string {
  const goc = chuyenDe || (ten && !LA_MA_KY_THUAT.test(ten) ? ten : 'Bài tập về nhà')
  return tenLop ? `${goc} · ${tenLop}` : goc
}

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

/**
 * `nhip.btvnDungNhip` — em có CHẬM ≥ 1 chặng so với lịch CỦA CHÍNH EM không (Boss 21/09; chỉ dùng cột đã đọc sẵn của `btvn_em`, không thêm truy vấn).
 * Đã nộp ⇒ không chậm. Em đã chốt bộ (có `so_chang` + `chot_luc`): số chặng TỚI HẠN = số chặng có mốc "xong đúng nhịp" (`dungNhipTruoc` của lịch đã lưu; bài chốt trước bản 1.1 ⇒ mốc mở chặng KẾ, chặng cuối ⇒ hạn nộp)
 * đã qua; chậm khi `lo_da_xong` < số đó. Em chưa chốt / bài thường (không chặng): chỉ chậm khi QUÁ HẠN mà chưa nộp (em chưa mở bài thì chưa có lịch nên chưa chặng nào tới hạn).
 */
export function emChamNhip(x: Dong, hanIso: string, hanMs: number, nowMs: number, moc?: MocHienThi): boolean {
  if (chuoi(x.nop_luc) !== '') return false
  const soChang = so(x.so_chang)
  const chot = chuoi(x.chot_luc)
  // Có `moc` (MỐC TÍNH NỢ, thầy lệnh 21/09 15:52 — dùng cho `nhip.noTheoLop`): việc TRƯỚC mốc không phải nợ — bài thường/chưa chốt: hạn rơi trước NGÀY mốc; chặng: mốc mở GỐC trước mốc THEO GIỜ (cùng luật `soNo` của thẻ em: `moGoc >= moc.ms`).
  // Vắng ⇒ luật chậm cũ, không đổi một byte.
  if (soChang <= 0 || chot === '' || !Number.isFinite(Date.parse(chot))) return hanMs <= nowMs && (moc === undefined || Date.parse(`${ngayVnCuaMs(hanMs)}T00:00:00+07:00`) >= moc.ms) // cùng luật soNo của thẻ em: mốc mở = 00:00 NGÀY hạn, so với mốc GIỜ
  const lich = docLichDaLuu(x.chang_mo_json, soChang, { chotLuc: chot, hanNop: hanIso, nowMs })
  const moLuc = lich && lich.moLuc.length === soChang ? lich.moLuc : moLucChang(chot, soChang)
  let toiHan = 0
  const goc = moc === undefined ? null : moLucGocChangMoSom(x.chang_mo_json) // chặng đã MỞ SỚM: phân loại theo mốc gốc của lịch
  const daXong = so(x.lo_da_xong)
  let noTuMoc = false
  for (let k = 0; k < soChang; k++) {
    const dn = lich && lich.moLuc.length === soChang ? Date.parse(lich.dungNhipTruoc[k] ?? '') : NaN
    const t = Number.isFinite(dn) ? dn : k + 1 < soChang ? Date.parse(moLuc[k + 1]!) : hanMs
    if (t <= nowMs) {
      toiHan++
      if (moc !== undefined && k >= daXong) {
        const moGoc = goc!.get(k) ?? Date.parse(moLuc[k]!)
        if (!Number.isFinite(moGoc) || moGoc >= moc.ms) noTuMoc = true
      }
    }
  }
  return moc === undefined ? daXong < toiHan : noTuMoc
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
  const rCfg = await Q.hoi("SELECT khoa, gia_tri, cap_nhat_luc FROM cau_hinh WHERE khoa IN (?, ?, ?, ?, ?, ?, ?)", KHOA_MOC_BANG_TIN, KHOA_CAU_HINH, KHOA_LAN_CHAY, KHOA_TU_DONG, KHOA_SAI_NHANH_GV, KHOA_VE_DICH_TU, KHOA_HIEN_THI_TU)
  const cfg = new Map((rCfg ?? []).map((x) => [chuoi(x.khoa), x]))
  // MỐC: MỘT nguồn với Thi đua / thẻ Hôm nay / phụ huynh (`docMocHienThi`: hien_thi_tu ⇒ ve_dich_tu ⇒ bang_tin_tu). Mốc chung vắng hết ⇒ luật cũ của bảng tin (00:00 hôm nay, `tuDangAp = false`).
  const giaTriMoc = [KHOA_HIEN_THI_TU, KHOA_VE_DICH_TU, KHOA_MOC_BANG_TIN].map((k) => chuoi(cfg.get(k)?.gia_tri)).find((v) => /^\d{4}-\d{2}-\d{2}(T|$)/.test(v) && Number.isFinite(docMocHienThiMs(v)) && (v.includes('T') || Number.isFinite(Date.parse(`${v}T00:00:00Z`))))
  const { tuMs, tuDangAp } = giaTriMoc ? { tuMs: docMocHienThiMs(giaTriMoc), tuDangAp: true } : docMocBangTin(undefined, ngay)
  const dauHomNay = dauNgayMs(ngay)
  const tuHomNayMs = Math.max(tuMs, dauHomNay)
  const tuHomNay = iso(tuHomNayMs)
  const cfgNhac = docCauHinhNhac(cfg.get(KHOA_CAU_HINH)?.gia_tri)
  const cronNhacLuc = chuoi(cfg.get(KHOA_LAN_CHAY)?.cap_nhat_luc)
  const coTuDong = docCoTuDong(cfg.get(KHOA_TU_DONG)?.gia_tri)

  // 3 · sổ học từ mốc (cửa sổ ≤ 14 ngày): (ngày, em, dạng) → số CÂU KHÁC NHAU đã trả lời (`n`), số câu có ≥ 1 lần đúng (`dung`) — MỘT ĐỊNH NGHĨA `cau-da-lam.ts` (Boss 21/09); `luot`/`luot_dung` = số LƯỢT cũ, chỉ cho luật "dạng vấp".
  // Mỗi (ngày, em, qid) được gán MỘT dạng (`MAX(ma_dang)`) ⇒ Σ theo dạng = số qid khác nhau của em trong ngày (đo D1 thật: có qid mang ≥ 2 mã dạng, cộng theo dạng sẽ phồng).
  const batDauSo = Math.max(tuMs, dauNgayMs(themNgay(ngay, -(SO_NGAY_CUA_SO - 1))))
  const rSo = await Q.hoi(
    `SELECT ngay_vn, sbd, ma_dang, COUNT(*) AS n, SUM(m) AS dung, SUM(c) AS luot, SUM(d) AS luot_dung
       FROM (SELECT ngay_vn, sbd, qid, MAX(COALESCE(ma_dang, '')) AS ma_dang, MAX(ket_qua) AS m, COUNT(*) AS c, SUM(ket_qua) AS d
               FROM su_kien_hoc WHERE luc >= ? AND ket_qua IS NOT NULL GROUP BY ngay_vn, sbd, qid)
      GROUP BY ngay_vn, sbd, ma_dang`,
    iso(batDauSo),
  )
  if (!rSo) lyDoThieu.nhip = 'Không đọc được sổ học'
  interface Sl { n: number; dung: number }
  const homNay = new Map<string, Map<string, Sl>>() // sbd → dạng → số
  const theoNgayEm = new Map<string, Map<string, number>>() // sbd → ngày → số CÂU khác nhau
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
    if (nd >= dauVap && ma) { // luật "dạng vấp" giữ số LƯỢT (em sai đi sai lại một câu vẫn là vấp) — không phải số "câu" hiển thị
      const d = dangVapSo.get(ma) ?? new Map<string, Sl>()
      const c = d.get(sbd) ?? { n: 0, dung: 0 }
      d.set(sbd, { n: c.n + so(x.luot), dung: c.dung + so(x.luot_dung) })
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
    `SELECT b.ma_btvn, b.giao_luc, b.han_nop, ${coCaNhan ? 'COALESCE(b.ca_nhan, 0)' : '0'} AS ca_nhan, COALESCE(NULLIF(TRIM(c.ten_ca), ''), d.ten_de, b.ma_de) AS ten,
            ${coCaNhan ? "(SELECT bc.chuyen_de FROM btvn_cau bc WHERE bc.ma_btvn = b.ma_btvn AND COALESCE(bc.chuyen_de, '') <> '' GROUP BY bc.chuyen_de ORDER BY COUNT(*) DESC, bc.chuyen_de LIMIT 1)" : 'NULL'} AS cd
       FROM btvn b LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de
      WHERE b.da_xoa = 0 AND b.giao_luc >= ? AND b.giao_luc <= ? AND b.han_nop >= ? ORDER BY b.han_nop, b.ma_btvn LIMIT ${TOI_DA_BAI}`
  // Bài KHÔNG lọc theo giờ của mốc: bài thầy giao trong CÙNG ngày với mốc (vd 10:48 sáng, trước mốc 12:00) vẫn là bài mới cần hiện; bài cũ đã bị xoá (`da_xoa`). Chỉ lấy bài giao từ 00:00 ngày của mốc.
  const bindBai = [iso(dauNgayMs(ngayVnCuaMs(tuMs))), iso(nowMs), iso(nowMs - MOT_NGAY_MS)]
  let rBai = await Q.hoi(sqlBai(true), ...bindBai)
  if (!rBai) rBai = await Q.hoi(sqlBai(false), ...bindBai)
  if (!rBai) lyDoThieu.baiTap = 'Không đọc được bài tập về nhà'
  const bai = (rBai ?? []).map((x) => ({ ma: chuoi(x.ma_btvn), giaoLuc: chuoi(x.giao_luc), han: chuoi(x.han_nop), hanMs: Date.parse(chuoi(x.han_nop)), ten: chuoi(x.ten), tenHT: tenBaiHienThi(chuoi(x.cd), chuoi(x.ten)), cd: chuoi(x.cd) })).filter((b) => b.ma)

  // 6 · em của các bài đó
  const sqlEm = (day: boolean) =>
    `SELECT ma_btvn, sbd, nop_luc, ${day ? 'COALESCE(so_chang, 0) AS so_chang, COALESCE(lo_da_xong, 0) AS lo_da_xong, chot_luc, chang_mo_json' : '0 AS so_chang, 0 AS lo_da_xong, NULL AS chot_luc, NULL AS chang_mo_json'},
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
  // Điều chỉnh đã áp (`ap_dung = 1`) VÀ hàng có thử thách được áp riêng (`thuThachApDung`; hàng đêm bóng + chiều thật). MỘT truy vấn; tách hai tập ở dưới.
  const rDcTho = await Q.hoi("SELECT sbd, json, ap_dung FROM ai_dieu_chinh WHERE ngay = ? AND huy = 0 AND (ap_dung = 1 OR json_extract(json, '$.thuThachApDung') = 1)", ngay)
  const luotChieu = (json: unknown): boolean => { try { return (JSON.parse(chuoi(json)) as { luot?: unknown })?.luot === 'chieu' } catch { return false } }
  const rDc = rDcTho ? rDcTho.filter((x) => so(x.ap_dung) === 1 && !luotChieu(x.json)) : rDcTho
  const rBt = await Q.hoi(`SELECT ngay, json, nop_luc, so_em, so_nhan, so_bi_loai FROM ai_ban_tin WHERE ngay <= ? ORDER BY ngay DESC LIMIT ${SO_DEM_TRUNG_VI + 1}`, ngay)
  // 9 · vinh danh hôm nay (bản đã đăng hôm nay lưu ở ngày hôm qua)
  // (vinh danh hôm nay + số em đã làm thử thách riêng: MỘT truy vấn; thiếu bảng daily_honors ⇒ chỉ đọc phần thử thách)
  // (thêm: số em bị trừ 1 khiên hôm nay vì vắng nhiệm vụ ngày — `khien_mat_so` — và số gói "bài gia đình giao" hôm nay — `ph_giao_them`; thiếu bảng ⇒ lùi về truy vấn không có chúng)
  let rVd = await Q.hoi("SELECT 'vd' AS k, body AS v FROM daily_honors WHERE day = ? UNION ALL SELECT 'tt', COUNT(DISTINCT sbd) FROM su_kien_hoc WHERE nguon = ? AND ngay_vn = ? AND luc >= ? UNION ALL SELECT 'km', COUNT(*) FROM khien_mat_so WHERE ngay_vn = ? UNION ALL SELECT 'gt', COUNT(*) FROM ph_giao_them WHERE ngay_vn = ?", homQua, NGUON_THU_THACH, ngay, tuHomNay, ngay, ngay)
  if (!rVd) rVd = await Q.hoi("SELECT 'vd' AS k, body AS v FROM daily_honors WHERE day = ? UNION ALL SELECT 'tt', COUNT(DISTINCT sbd) FROM su_kien_hoc WHERE nguon = ? AND ngay_vn = ? AND luc >= ?", homQua, NGUON_THU_THACH, ngay, tuHomNay)
  if (!rVd) rVd = await Q.hoi("SELECT 'tt' AS k, COUNT(DISTINCT sbd) AS v FROM su_kien_hoc WHERE nguon = ? AND ngay_vn = ? AND luc >= ?", NGUON_THU_THACH, ngay, tuHomNay)
  // 10 · lỗi của các việc nền trong 24 giờ (B11; bảng `nhat_ky_may`)
  const rLoiMay = await Q.hoi('SELECT nguon, COUNT(*) AS n, MAX(luc) AS cuoi FROM nhat_ky_may WHERE luc >= ? GROUP BY nguon', iso(nowMs - LOI_MAY_SO_GIO * 3_600_000))
  if (!rLoiMay) lyDoThieu.nhatKyMay = 'Chưa có bảng nhật ký lỗi của máy'

  // ---------------------------------------------------------------- baiTap[]
  const baiTap: Dong[] = []
  const daoBai = new Map<string, { chuaMo: number; dangLam: number; daNop: number; chotSo: number; chotXong: number; chotTong: number; tenLop: Map<string, number> }>()
  const emChuaMoSatHan = new Map<string, { ten: string; han: string; hanMs: number }[]>()
  const emQuaHan = new Map<string, { ten: string; han: string }[]>()
  const emDaChot = new Set<string>()
  const emTrongBai = new Set<string>() // nhip.btvnDungNhip: em có ≥ 1 bài đang hiện ở baiTap
  const emCham = new Set<string>() // ...và chậm ≥ 1 chặng ở ≥ 1 bài
  const emNo = new Set<string>() // NỢ: như trên nhưng chỉ tính việc từ NGÀY MỐC tính nợ (moc-no.ts) — cho `nhip.noTheoLop`
  const mocNo = giaiMocHienThi(cfg.get(KHOA_HIEN_THI_TU)?.gia_tri, cfg.get(KHOA_VE_DICH_TU)?.gia_tri, cfg.get(KHOA_MOC_BANG_TIN)?.gia_tri)
  for (const x of rBe ?? []) {
    const ma = chuoi(x.ma_btvn)
    const sbd = chuoi(x.sbd)
    const b = bai.find((y) => y.ma === ma)
    if (!b || !em.has(sbd)) continue
    const d = daoBai.get(ma) ?? { chuaMo: 0, dangLam: 0, daNop: 0, chotSo: 0, chotXong: 0, chotTong: 0, tenLop: new Map<string, number>() }
    const st = trangThaiNopBai({ ...x, dap_an_json: so(x.co_da) === 1 ? '{"x":1}' : '' }, b.han, nowMs) // `co_da` = đã có ít nhất một đáp án (không tải cả JSON đáp án)
    const nop = chuoi(x.nop_luc) !== ''
    emTrongBai.add(sbd)
    if (emChamNhip(x, b.han, b.hanMs, nowMs)) emCham.add(sbd)
    if (baiTuNgayMoc(b.giaoLuc, mocNo.ngayVn) && emChamNhip(x, b.han, b.hanMs, nowMs, mocNo)) emNo.add(sbd) // bài giao TRƯỚC ngày mốc: không tính nợ
    if (nop) d.daNop++
    else if (st.trangThai === 'chua_mo') d.chuaMo++
    else d.dangLam++
    if (so(x.so_chang) > 0 && chuoi(x.chot_luc) !== '') { d.chotSo++; d.chotXong += so(x.lo_da_xong); d.chotTong += so(x.so_chang) }
    if (chuoi(x.chot_luc) !== '' && Date.parse(chuoi(x.chot_luc)) >= tuHomNayMs) emDaChot.add(sbd)
    const tl = em.get(sbd)!.tenLop
    d.tenLop.set(tl, (d.tenLop.get(tl) ?? 0) + 1)
    daoBai.set(ma, d)
    if (!nop && st.trangThai === 'chua_mo' && b.hanMs > nowMs && b.hanMs - nowMs <= MOT_NGAY_MS) emChuaMoSatHan.set(sbd, [...(emChuaMoSatHan.get(sbd) ?? []), { ten: b.tenHT, han: b.han, hanMs: b.hanMs }])
    if (!nop && b.hanMs <= nowMs) emQuaHan.set(sbd, [...(emQuaHan.get(sbd) ?? []), { ten: b.tenHT, han: b.han }])
  }
  // nhip.btvnDungNhip: tính từ mốc (chỉ các bài đang hiện ở baiTap, tức bài giao từ ngày của mốc); vắng khi không có bài / không đọc được em của bài
  if (rBe && emTrongBai.size > 0) nhip.btvnDungNhip = { dungNhip: emTrongBai.size - emCham.size, tongEm: emTrongBai.size, cham: emCham.size }
  // DỒN VỀ ĐÍCH: số em ĐANG NỢ (chậm ≥ 1 chặng so với lịch của chính em, hoặc quá hạn chưa nộp) THEO LỚP — dùng tập `emNo` (= `emCham` nhưng chỉ tính việc từ NGÀY MỐC tính nợ), KHÔNG thêm truy vấn. Chỉ lớp có ≥ 1 em nợ; xếp giảm dần; vắng ⇒ máy thầy ẩn.
  if (rBe && emNo.size > 0) {
    const siSo = new Map<string, number>(), no = new Map<string, number>()
    for (const [, e] of em) siSo.set(e.tenLop, (siSo.get(e.tenLop) ?? 0) + 1)
    for (const sbd of emNo) { const e = em.get(sbd); if (e) no.set(e.tenLop, (no.get(e.tenLop) ?? 0) + 1) }
    nhip.noTheoLop = [...no].map(([lop, soEmNo]) => ({ lop, siSo: siSo.get(lop) ?? soEmNo, soEmNo })).sort((a, c) => c.soEmNo - a.soEmNo || (a.lop < c.lop ? -1 : 1))
  }
  const luotKe = cfgNhac.bat ? lanChayKe(nowMs, cfgNhac) : undefined
  for (const b of bai) {
    const d = daoBai.get(b.ma)
    if (!d) continue
    const tong = d.chuaMo + d.dangLam + d.daNop
    const lop = [...d.tenLop].sort((a, c) => c[1] - a[1] || (a[0] < c[0] ? -1 : 1))
    const nhac = nhacTuDong.filter((x) => chuoi(x.ma_btvn) === b.ma)
    baiTap.push({
      maBtvn: b.ma, ten: tenBaiHienThi(b.cd, b.ten, lop[0]?.[0] ?? ''), tenGoc: b.ten, tenLop: lop[0]?.[0] ?? '', nhieuLop: lop.length > 1, giaoLuc: b.giaoLuc, hanNop: b.han, quaHan: b.hanMs <= nowMs,
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
  const bt = rBt?.[0]
  let cacDongBt: Dong[] = []
  if (bt) {
    try {
      const o = JSON.parse(chuoi(bt.json)) as { cacDong?: Dong[] }
      cacDongBt = Array.isArray(o.cacDong) ? o.cacDong : []
    } catch { cacDongBt = [] }
  }
  const goiYTho = cacDongBt.filter((d) => chuoi(d.loai) === 'ca_lop' && chuoi(d.chu)).slice(0, TOI_DA_GOI_Y)
  // MỘT lần tra tên dạng cho cả dạng vấp, dạng sai nhiều và gợi ý của Bộ não (giữ ngân sách ≤ 12 truy vấn)
  const maDangCan = [...dangVapCat.map((d) => d.ma), ...[...daiSai.values()].map((d) => d.ma).filter(Boolean), ...goiYTho.map((d) => chuoi(d.dang)).filter(Boolean)]
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
  const dcEm = new Set((rDc ?? []).map((x) => chuoi(x.sbd)))
  let khacPhucLuon = 0
  for (const x of rDc ?? []) {
    try {
      const o = JSON.parse(chuoi(x.json)) as { khacPhuc?: unknown }
      if (Array.isArray(o.khacPhuc) && o.khacPhuc.length > 0) khacPhucLuon++
    } catch { /* dòng hỏng: bỏ */ }
  }
  if (bt) {
    boNao = {
      ngay: chuoi(bt.ngay), chayLuc: chuoi(bt.nop_luc), soEmSoi: so(bt.so_em), soEmDieuChinh: dcEm.size, soLoiNhan: so(bt.so_nhan),
      goiY: goiYTho.map((d) => ({ chu: chuoi(d.chu), ...(chuoi(d.dang) ? { dang: chuoi(d.dang), ...(tenDang.has(chuoi(d.dang)) ? { tenDang: tenDang.get(chuoi(d.dang)) } : {}) } : {}) })),
    }
  } else if (rBt) {
    lyDoThieu.boNao = 'Chưa có bản tin Bộ não A.I'
  } else {
    lyDoThieu.boNao = 'Không đọc được bản tin Bộ não A.I'
  }

  // ---------------------------------------------------------------- mayDaLam[]
  let soVinhDanh = 0
  try {
    const vd = (rVd ?? []).find((x) => chuoi(x.k) === 'vd')
    const o = vd ? (JSON.parse(chuoi(vd.v)) as { winners?: unknown[]; publishedAt?: string }) : null
    if (o && Array.isArray(o.winners) && Date.parse(chuoi(o.publishedAt)) >= tuHomNayMs) soVinhDanh = o.winners.length
  } catch { soVinhDanh = 0 }
  const soEmDaLamThuThach = so((rVd ?? []).find((x) => chuoi(x.k) === 'tt')?.v)
  const soEmMatKhien = so((rVd ?? []).find((x) => chuoi(x.k) === 'km')?.v)
  const soGoiGiaoThem = so((rVd ?? []).find((x) => chuoi(x.k) === 'gt')?.v)
  let soEmNhanThuThach = 0
  for (const x of rDcTho ?? []) if (docThuThachTuDieuChinh(x.json) && thuThachDaApTuHang(x.json, x.ap_dung)) soEmNhanThuThach++
  const emNhac = new Set(nhacTuDong.map((x) => chuoi(x.sbd)))
  const soPh = new Set(nhacTuDong.map((x) => chuoi(x.ph_nhom)).filter(Boolean)).size
  const soEmBoNaoSoi = bt && chuoi(bt.ngay) === ngay ? so(bt.so_em) : 0
  const mayDaLam: Dong[] = [
    { loai: 'nhac_nop_bai', so: emNhac.size, ...(soPh > 0 ? { soPhuHuynh: soPh } : {}), chu: `Nhắc nộp bài cho ${emNhac.size} em${soPh > 0 ? `, báo ${soPh} phụ huynh` : ''}` },
    { loai: 'khac_phuc_luon', so: khacPhucLuon, chu: `Đưa câu khắc phục vào bài cho ${khacPhucLuon} em` },
    { loai: 'on_lai', so: soCauVeLichOn, chu: `Đưa ${soCauVeLichOn} câu sai về lịch ôn lại` },
    { loai: 'bo_cau_rieng', so: emDaChot.size, chu: `Rút bộ câu riêng cho ${emDaChot.size} em` },
    { loai: 'vinh_danh', so: soVinhDanh, chu: `Vinh danh ${soVinhDanh} em` },
    { loai: 'thu_thach_rieng', so: soEmNhanThuThach, soDaLam: soEmDaLamThuThach, chu: `${soEmNhanThuThach} em nhận thử thách riêng · ${soEmDaLamThuThach} em đã làm` },
    { loai: 'bo_nao_soi', so: soEmBoNaoSoi, chu: `Bộ não A.I soi ${soEmBoNaoSoi} em` },
    { loai: 'giao_them', so: soGoiGiaoThem, chu: `A.I Đỗ Đại Học soạn ${soGoiGiaoThem} gói bài gia đình giao hôm nay` },
    { loai: 'khien_mat', so: soEmMatKhien, chu: `A.I Đỗ Đại Học đã trừ 1 khiên của ${soEmMatKhien} em vắng nhiệm vụ ngày ${KHIEN_MAT_KHI_VANG_NGAY} ngày liên tiếp` },
  ].filter((x) => (x.so as number) > 0)

  // ---------------------------------------------------------------- sucKhoe
  const boNaoLuc = bt ? Date.parse(chuoi(bt.nop_luc)) : NaN
  const cronLuc = Date.parse(cronNhacLuc)
  const boNaoTt: 'ok' | 'tre' | 'chua_biet' = Number.isFinite(boNaoLuc) ? (nowMs - boNaoLuc <= GIO_BO_NAO_TOI_DA * 3_600_000 ? 'ok' : 'tre') : 'chua_biet'
  const cronTt: 'ok' | 'tre' | 'chua_biet' | 'tat' = !cfgNhac.bat ? 'tat' : !trongKhung(nowMs, cfgNhac) ? 'ok' : Number.isFinite(cronLuc) ? (nowMs - cronLuc <= PHUT_CRON_NHAC_TOI_DA * 60_000 ? 'ok' : 'tre') : 'chua_biet'
  const soTre = Number(boNaoTt === 'tre') + Number(cronTt === 'tre')
  const chuBoNao = Number.isFinite(boNaoLuc) ? `Bộ não A.I chạy lúc ${gioVn(boNaoLuc)}${boNaoTt === 'tre' ? ' (đã quá 26 giờ)' : ''}` : 'Chưa có dữ liệu Bộ não A.I'
  const chuCron = cronTt === 'tat' ? 'nhắc nộp bài đang tắt' : Number.isFinite(cronLuc) ? `nhắc nộp bài chạy lúc ${gioVn(cronLuc)}${cronTt === 'tre' ? ' (trễ hơn 45 phút)' : ''}` : 'chưa có dữ liệu nhắc nộp bài'
  // B11 · CẢNH BÁO của máy (chỉ HIỂN THỊ; mỗi dòng một câu đơn giản, không chi tiết kỹ thuật)
  const canhBao: { nguon: string; muc: 'vang' | 'do'; chu: string }[] = []
  const tuLuc = (ms: number): string => `${gioVn(ms)}${ngayVnCuaMs(ms) === ngay ? '' : ` ${ddmm(ngayVnCuaMs(ms))}`}`
  if (boNaoTt === 'tre') canhBao.push({ nguon: 'bo_nao', muc: nowMs - boNaoLuc > 2 * GIO_BO_NAO_TOI_DA * 3_600_000 ? 'do' : 'vang', chu: `Bộ não A.I chưa chạy lại từ ${tuLuc(boNaoLuc)} (đã quá ${GIO_BO_NAO_TOI_DA} giờ)` })
  else if (boNaoTt === 'chua_biet') canhBao.push({ nguon: 'bo_nao', muc: 'vang', chu: 'Chưa có dữ liệu Bộ não A.I để kiểm' })
  if (cronTt === 'tre') canhBao.push({ nguon: 'nhac_nop_bai', muc: nowMs - cronLuc > PHUT_CRON_NHAC_DO * 60_000 ? 'do' : 'vang', chu: `Nhắc nộp bài chưa chạy lại từ ${tuLuc(cronLuc)}` })
  else if (cronTt === 'chua_biet') canhBao.push({ nguon: 'nhac_nop_bai', muc: 'vang', chu: 'Chưa có dữ liệu nhắc nộp bài để kiểm' })
  else if (cronTt === 'tat') canhBao.push({ nguon: 'nhac_nop_bai', muc: 'vang', chu: 'Nhắc nộp bài đang tắt' })
  for (const x of rLoiMay ?? []) {
    const n = so(x.n)
    if (n < 1) continue
    const cuoi = Date.parse(chuoi(x.cuoi))
    canhBao.push({
      nguon: `loi_${chuoi(x.nguon)}`, muc: n >= LOI_MAY_DO_TU_LAN ? 'do' : 'vang',
      chu: n === 1 ? `${tenViec(chuoi(x.nguon))} lỗi lúc ${Number.isFinite(cuoi) ? tuLuc(cuoi) : 'gần đây'}, A.I Đỗ Đại Học sẽ thử lại` : `${tenViec(chuoi(x.nguon))} lỗi ${n} lần trong ${LOI_MAY_SO_GIO} giờ, lần cuối lúc ${Number.isFinite(cuoi) ? tuLuc(cuoi) : 'gần đây'}`,
    })
  }
  // tỉ lệ lời bị loại tăng: đêm mới nhất ≥ 5 lời bị loại và ≥ gấp đôi trung vị các đêm trước (tối đa 7)
  if (rBt && rBt.length >= 2) {
    const tl = (x: Dong): number => (so(x.so_em) > 0 ? so(x.so_bi_loai) / so(x.so_em) : NaN)
    const truoc = rBt.slice(1).map(tl).filter(Number.isFinite).sort((a, c) => a - c)
    const moiNhat = rBt[0]!
    if (truoc.length > 0 && so(moiNhat.so_bi_loai) >= LOAI_TOI_THIEU_LOI && tl(moiNhat) >= LOAI_GAP_TRUNG_VI * (truoc.length % 2 ? truoc[(truoc.length - 1) / 2]! : (truoc[truoc.length / 2 - 1]! + truoc[truoc.length / 2]!) / 2)) {
      canhBao.push({ nguon: 'ty_le_loai', muc: 'vang', chu: `Bộ não A.I bị loại ${so(moiNhat.so_bi_loai)}/${so(moiNhat.so_em)} lời (${Math.round(tl(moiNhat) * 100)} %), nhiều hơn hẳn các đêm trước` })
    }
  }
  if (!coTuDong.suKhoe) canhBao.length = 0 // thầy đã tắt việc "tự canh sức khoẻ" (cờ suKhoe): không hiện cảnh báo
  canhBao.sort((a, c) => (a.muc === c.muc ? 0 : a.muc === 'do' ? -1 : 1) || (a.nguon < c.nguon ? -1 : 1))
  const muc = !coTuDong.suKhoe ? 'xanh' : canhBao.some((x) => x.muc === 'do') || soTre === 2 ? 'do' : canhBao.length > 0 ? 'vang' : 'xanh'
  const sucKhoe: Dong = {
    muc, chu: `${chuBoNao} · ${chuCron}`, canhBao,
    ...(Number.isFinite(boNaoLuc) ? { boNaoChayLuc: iso(boNaoLuc) } : {}),
    ...(Number.isFinite(cronLuc) ? { cronNhacLuc: iso(cronLuc) } : {}),
  }

  const tenDangVap = dangVapCat.map((d) => ({ ma: d.ma, ten: tenCua(d.ma), soEmVap: d.soEmVap, soEmGap: d.soEmGap }))
  // SAI RẤT NHANH RỒI ĐÚNG LẠI (tín hiệu ĐO của Code 1, chỉ thầy thấy): đọc bản đệm do cron tính (sai-nhanh-gv.ts) — 0 truy vấn thêm. Bản đệm vắng / cũ / khác ngày ⇒ khoá VẮNG (không bịa 0); tính rồi mà không em nào `co` ⇒ { ds: [] }.
  const demSaiNhanh = docSaiNhanhDem(cfg.get(KHOA_SAI_NHANH_GV)?.gia_tri, nowMs)
  const saiNhanh = demSaiNhanh
    ? { ds: demSaiNhanh.ds.filter((x) => em.has(x.sbd)).slice(0, 20).map((x) => ({ sbd: x.sbd, hoTen: em.get(x.sbd)!.hoTen, tenLop: em.get(x.sbd)!.tenLop, soCau: x.soCau, nguongSoCau: x.nguongSoCau, nguongGiay: x.nguongGiay, cuaSoNgay: x.cuaSoNgay, tuNgay: x.tuNgay, co: true })) }
    : null
  return {
    ok: true, ngay, tu: iso(tuMs), tuHomNay, tuDangAp, capNhatLuc: iso(nowMs),
    nhip, baiTap, tienBo: tienBo.slice(0, TOI_DA_TIEN_BO), canDeY, dangVap: tenDangVap, ...(boNao ? { boNao } : {}), mayDaLam, sucKhoe,
    ...(saiNhanh ? { saiNhanh } : {}),
    ...(Object.keys(lyDoThieu).length > 0 ? { lyDoThieu } : {}),
    soTruyVan: Q.dem(),
  }
}
