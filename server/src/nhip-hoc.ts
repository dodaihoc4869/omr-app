// NHỊP HỌC TRÊN "HÔM NAY CỦA THẦY" (thầy 12/10 duyệt bản vẽ). Hợp đồng + luật ngày vào / cờ đối phó: `nhip-hoc-kieu.ts` (đọc trước).
//
// `POST /gv/nhip-hoc {tu?, den?}` — LỆNH THẦY, CHỈ ĐỌC (sau cổng `laThay`, chạy trên `envDoc`). Không ghi, không DDL. MỘT lần gọi cho cả màn
// (≈ 300 em × 12 ngày):
//   · Danh sách em + dãy ngày (mức / đã làm): DÙNG LẠI đúng `docDanhSachEm` + `docNgayCacEm` của `/gv/bai-hang-ngay` (bai-hang-ngay.ts) ⇒ số "đủ mức"
//     ở Hôm nay và ở bảng Bài hằng ngày là MỘT con số. Trả gọn hai mảng số mỗi em (`muc`, `lam`) thay vì 11 trường mỗi ô.
//   · Ngày vào của em: mỗi lô 100 SBD năm truy vấn nhỏ song song (MIN theo SBD trên khoá chính / chỉ mục `(sbd, ngày)` của từng bảng).
//   · Cờ đối phó: mỗi lô HAI truy vấn gom sẵn trong SQL (GROUP BY sbd, đi chỉ mục `idx_skh_em_ngay (sbd, ngay_vn)`):
//       1) số giây: tổng lượt có số giây + lượt dưới 8 giây (theo em) + lượt 8–14 giây (theo em × câu, để biết câu tự tính Phần III — kho câu
//          `docCauKho`, thiếu kho ⇒ đuôi mã câu "-III-n" như hồ sơ một em);
//       2) chọn lặp: hàm cửa sổ ROW_NUMBER (khoảng liền cùng chữ, cùng ngày, xếp theo giờ) ⇒ chỉ trả các chuỗi ≥ 6 lượt + tổng lượt A–D mỗi em.
//     Không gọi `/gv/ho-so-thai-do` từng em. Truy vấn chọn lặp hỏng (D1 cũ thiếu cột) ⇒ chỉ dùng tín hiệu quá nhanh + cảnh báo nói thật.
//     B3 (15/10): hai truy vấn ấy nay là ĐƯỜNG LÙI — đường chính đọc ĐỆM THEO NGÀY `nhip_hoc_doi_pho_ngay` (nhip-hoc-dem.ts: ngày đã qua tính sẵn
//     bởi cron đêm, trigger trên sổ xoá ngày bị ghi muộn; chỉ hôm nay tính trực tiếp), MỘT câu mỗi lô, cùng số.
//   · ĐỘ TIN CẬY CỦA NHÓM mỗi em (13/10 đợt 18, CHỈ THÊM `doTinCay` / `canThem`): phép thuần `tinCayNhomNhip` (dưới) trên đúng dãy ngày đã đọc —
//     cùng phép `/hs/nhip-hoc` · `/ph/nhip-hoc` (nhip-hoc-em.ts) ⇒ thầy và em thấy cùng một số. KHÔNG truy vấn D1 nào thêm; nhóm vẫn do app tính.
import type { Env } from './kieu'
import type { LopBaiHangNgay, NgayBaiEm } from './bai-hang-ngay-kieu'
import { NGUONG_THAI_DO as NG } from './bai-hang-ngay-kieu'
import type { DoiPhoChonLap, DoiPhoEm, DoiPhoQuaNhanh, EmNhipHoc, NgayNhipEm, TraLoiNhipHoc } from './nhip-hoc-kieu'
import { cacNgay, docDanhSachEm, docNgayCacEm, khoangNgay, LO_EM_BAI_HANG_NGAY, LoiDocSo, ngayVnCua, type EmGoc } from './bai-hang-ngay'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { tachSongSinh } from './loi-hoc-luat'
import { docCauKho } from './omni-d1'
import { tomTatNhip } from './nhip-hoc-luat'
import { tinCayNhomNhip } from './thai-do-tin-cay'
import { bacChamChi } from './bac-cham-chi'
import { dbGoc } from './cau-hinh-dem'
import { demDoiPhoDungDuoc, docDoiPhoLoQuaDem, nghiDemDoiPho } from './nhip-hoc-dem'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const so = (x: unknown): number => {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Row[] | null> {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch {
    return null
  }
}

// ------------------------------------------------------------------ NGÀY VÀO (phép thuần — test gọi thẳng)

/** Ngày có mặt sớm nhất trong các nguồn (ngày `YYYY-MM-DD` hợp lệ; nguồn rỗng / hỏng bị bỏ) rồi kẹp về `tu`. Không nguồn nào ⇒ `tu`. */
export function ngayVaoCuaEm(tu: string, nguon: readonly (string | null | undefined)[]): string {
  let som: string | null = null
  for (const n of nguon) if (n && NGAY_RE.test(n) && (som === null || n < som)) som = n
  return som !== null && som > tu ? som : tu
}

/** `hoc_sinh.tao_luc` (ISO hoặc 'YYYY-MM-DD…') ⇒ ngày giờ Việt Nam; hỏng / rỗng ⇒ null. */
export function ngayTaoTaiKhoan(taoLuc: unknown): string | null {
  const s = str(taoLuc)
  if (!s) return null
  const t = Date.parse(s)
  if (Number.isFinite(t) && /[T ]\d{2}:\d{2}/.test(s)) return ngayVnCua(t)
  return NGAY_RE.test(s.slice(0, 10)) ? s.slice(0, 10) : null
}

const SQL_VAO_DAU_VET = [
  'SELECT sbd, MIN(ngay) AS d FROM hanh_trinh_v3_ngay WHERE sbd IN (SELECT value FROM json_each(?1)) GROUP BY sbd',
  'SELECT sbd, MIN(ngay) AS d FROM srs2_ke_hoach WHERE sbd IN (SELECT value FROM json_each(?1)) GROUP BY sbd',
  'SELECT sbd, MIN(bat_dau) AS d FROM goi_bai_7_em WHERE sbd IN (SELECT value FROM json_each(?1)) GROUP BY sbd',
  'SELECT sbd, MIN(ngay_vn) AS d FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?1)) GROUP BY sbd',
] as const
const SQL_VAO_TAO = 'SELECT sbd, tao_luc AS t FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?1))'

/** sbd → ngày bắt đầu tính (≥ `tu`). Nguồn nào đọc hỏng thì bỏ nguồn ấy (không chặn cả lệnh). Xuất 12/10 cho `/gv/ho-so-thai-do` và `/hs/nhip-hoc`
 *  (một em) — cùng ngày vào với Nhịp học của thầy. */
export async function docNgayVao(env: Env, em: readonly EmGoc[], tu: string): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  for (let i = 0; i < em.length; i += LO_EM_BAI_HANG_NGAY) {
    const lo = em.slice(i, i + LO_EM_BAI_HANG_NGAY)
    const j = JSON.stringify(lo.map((e) => e.sbd))
    const [tao, ...dauVet] = await Promise.all([hoi(env, SQL_VAO_TAO, j), ...SQL_VAO_DAU_VET.map((q) => hoi(env, q, j))])
    const nguon = new Map<string, string[]>()
    const them = (s: string, d: string | null) => {
      if (d) (nguon.get(s) ?? nguon.set(s, []).get(s)!).push(d)
    }
    for (const x of tao ?? []) them(str(x.sbd), ngayTaoTaiKhoan(x.t))
    for (const r of dauVet) for (const x of r ?? []) them(str(x.sbd), str(x.d).slice(0, 10) || null)
    for (const e of lo) ra.set(e.sbd, ngayVaoCuaEm(tu, nguon.get(e.sbd) ?? []))
  }
  return ra
}

// ------------------------------------------------------------------ ĐỘ TIN CẬY CỦA NHÓM (phép thuần — một chỗ cho thầy, em, phụ huynh)

// `NHAN_CUA_NHOM` + `tinCayNhomNhip` nằm ở thai-do-tin-cay.ts (13/10) để hồ sơ một em (bai-hang-ngay.ts) dùng CÙNG hàm mà không vòng nhập.
export { NHAN_CUA_NHOM, tinCayNhomNhip } from './thai-do-tin-cay'

/** Dãy ngày ĐƯỢC TÍNH của một em: từ ngày vào (gồm hôm nay), đúng `mucToiThieu` / `daLam` — cách dựng dải ô của bảng em và của dòng thầy. */
export const ngayDuocTinh = (ngay: readonly NgayBaiEm[], vao: string): NgayNhipEm[] =>
  ngay.filter((n) => n.ngay >= vao).map((n) => ({ ngay: n.ngay, muc: n.mucToiThieu, lam: n.daLam }))


// ------------------------------------------------------------------ CỜ ĐỐI PHÓ (phép thuần — test gọi thẳng)

const phanTram = (tu: number, mau: number): number | null => (mau > 0 ? Math.round((100 * tu) / mau) : null)

/** Số đếm số giây của một em (đã gom). `*Kq` = lượt có kết quả đúng/sai; `*Dung` = lượt đúng. */
export interface DemGiayEm {
  coGiay: number
  coGiayKq: number
  coGiayDung: number
  nhanh: number
  nhanhKq: number
  nhanhDung: number
  coTuTinh: boolean
}
/** Số đếm chọn lặp của một em: `tong` lượt có chữ A–D; `chuoi` = các chuỗi ≥ `NG.chuoiLap` lượt liền cùng chữ. */
export interface DemLapEm {
  tong: number
  chuoi: readonly { chu: string; n: number }[]
}

/** (b) quá nhanh — ĐÚNG luật mức "xấu" của hồ sơ một em (`tinhThaiDo`): đủ lượt có số giây, tỉ lệ quá nhanh ≥ 30%, nhóm quá nhanh đúng dưới 50%. */
export function quaNhanhVuot(d: DemGiayEm): DoiPhoQuaNhanh | null {
  if (d.coGiay < NG.soLuotGiayToiThieu) return null
  const p = phanTram(d.nhanh, d.coGiay)!
  const dungNhanh = phanTram(d.nhanhDung, d.nhanhKq)
  if (p < NG.nhanXau || dungNhanh === null || dungNhanh >= NG.nhanDungThap) return null
  return { nhanh: d.nhanh, coGiay: d.coGiay, dungNhanh, dungThuong: phanTram(d.coGiayDung - d.nhanhDung, d.coGiayKq - d.nhanhKq), coTuTinh: d.coTuTinh }
}

/** (e) chọn lặp — ĐÚNG luật mức "xấu" của hồ sơ một em: đủ lượt A–D, lượt nằm trong chuỗi ≥ 10%. */
export function chonLapVuot(d: DemLapEm): DoiPhoChonLap | null {
  if (d.tong < NG.soLuotLapToiThieu) return null
  const dung = d.chuoi.filter((c) => c.n >= NG.chuoiLap)
  const trongChuoi = dung.reduce((t, c) => t + c.n, 0)
  if ((phanTram(trongChuoi, d.tong) ?? 0) < NG.lapXau) return null
  const dai = dung.reduce<{ chu: string; n: number } | null>((m, c) => (!m || c.n > m.n ? c : m), null)
  return { trongChuoi, tong: d.tong, dai: dai?.n ?? 0, chu: dai?.chu ?? '' }
}

/** Câu lý do bằng số (đúng kiểu chữ bản vẽ). */
export function cauQuaNhanh(q: DoiPhoQuaNhanh): string {
  const nguong = q.coTuTinh ? `trả lời quá nhanh (dưới ${NG.giayNhanhTracNghiem} giây, câu tự tính dưới ${NG.giayNhanhTuTinh} giây)` : `trả lời dưới ${NG.giayNhanhTracNghiem} giây`
  return `${q.nhanh}/${q.coGiay} lượt ${nguong}, nhóm này đúng ${q.dungNhanh}%${q.dungThuong !== null ? ` (lượt thường đúng ${q.dungThuong}%)` : ''}`
}
export function cauChonLap(c: DoiPhoChonLap): string {
  return `Chọn ${c.chu} ${c.dai} lượt liền · ${c.trongChuoi}/${c.tong} lượt trắc nghiệm nằm trong chuỗi chọn lặp (${phanTram(c.trongChuoi, c.tong)}%)`
}

/** Gộp hai tín hiệu thành cờ của em; không tín hiệu nào vượt ⇒ null. Tín hiệu nặng hơn (tỉ lệ cao hơn) đứng trước trong lý do. */
export function doiPhoCuaEm(giay: DemGiayEm | null, lap: DemLapEm | null): DoiPhoEm | null {
  const quaNhanh = giay ? quaNhanhVuot(giay) : null
  const chonLap = lap ? chonLapVuot(lap) : null
  if (!quaNhanh && !chonLap) return null
  const ds: [number, string][] = []
  if (quaNhanh) ds.push([phanTram(quaNhanh.nhanh, quaNhanh.coGiay) ?? 0, cauQuaNhanh(quaNhanh)])
  if (chonLap) ds.push([phanTram(chonLap.trongChuoi, chonLap.tong) ?? 0, cauChonLap(chonLap)])
  return { quaNhanh, chonLap, lyDo: ds.sort((a, b) => b[0] - a[0]).map(([, c]) => c) }
}

// ------------------------------------------------------------------ CỜ ĐỐI PHÓ (đọc D1 theo lô)

/** Số giây của lượt: cột `giay` (> 0) ⇒ `raw_json.ms` (> 0, đổi giây) — đúng thứ tự `giayDoCuaLuot`; câu gốc = `raw_json.tc` hoặc mã câu.
 * Đợt 21: `l` MATERIALIZED — ba nhánh UNION ALL dùng chung MỘT lượt quét sổ + bóc JSON (trước: quét lại 3 lần; đo SQLite 145 → 67 ms/lô, cùng kết quả). */
export const SQL_GIAY_LO = `WITH r AS (
    SELECT sbd, qid, ket_qua AS kq, CAST(giay AS REAL) AS gc,
      CASE WHEN json_valid(raw_json) THEN CAST(json_extract(raw_json, '$.ms') AS REAL) END AS ms,
      CASE WHEN json_valid(raw_json) THEN json_extract(raw_json, '$.tc') END AS tc
    FROM su_kien_hoc
    WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn BETWEEN ?2 AND ?3 AND ${SQL_LA_LAN_LAM} AND COALESCE(visibility, '') <> 'embargoed'
  ),
  l AS MATERIALIZED (
    SELECT sbd, COALESCE(NULLIF(tc, ''), qid) AS q, kq,
      CASE WHEN gc > 0 THEN MAX(1, ROUND(gc)) WHEN ms > 0 THEN MAX(1, ROUND(ms / 1000.0)) END AS g
    FROM r
  )
  SELECT 'tong' AS loai, sbd, '' AS q, COUNT(*) AS n, COUNT(kq) AS nkq, SUM(CASE WHEN kq = 1 THEN 1 ELSE 0 END) AS nd FROM l WHERE g IS NOT NULL GROUP BY sbd
  UNION ALL SELECT 'duoi8', sbd, '', COUNT(*), COUNT(kq), SUM(CASE WHEN kq = 1 THEN 1 ELSE 0 END) FROM l WHERE g < ?4 GROUP BY sbd
  UNION ALL SELECT 'giua', sbd, q, COUNT(*), COUNT(kq), SUM(CASE WHEN kq = 1 THEN 1 ELSE 0 END) FROM l WHERE g >= ?4 AND g < ?5 GROUP BY sbd, q`

/** Chuỗi chọn lặp: khoảng liền cùng chữ A–D (cùng em, cùng ngày, xếp giờ rồi khoá) = hiệu hai ROW_NUMBER. Trả tổng lượt A–D + chuỗi ≥ ?4. */
export const SQL_LAP_LO = `WITH t AS (
    SELECT sbd, ngay_vn AS ngay, luc, khoa,
      UPPER(TRIM(CAST(CASE WHEN json_valid(raw_json) THEN COALESCE(json_extract(raw_json, '$.chon'), json_extract(raw_json, '$.traLoi')) END AS TEXT))) AS c
    FROM su_kien_hoc
    WHERE sbd IN (SELECT value FROM json_each(?1)) AND ngay_vn BETWEEN ?2 AND ?3 AND ${SQL_LA_LAN_LAM} AND COALESCE(visibility, '') <> 'embargoed'
  ),
  tn AS (SELECT sbd, ngay, luc, khoa, c FROM t WHERE c IN ('A', 'B', 'C', 'D')),
  g AS (
    SELECT sbd, ngay, c,
      ROW_NUMBER() OVER (PARTITION BY sbd, ngay ORDER BY luc, khoa) - ROW_NUMBER() OVER (PARTITION BY sbd, ngay, c ORDER BY luc, khoa) AS nhom
    FROM tn
  ),
  ch AS (SELECT sbd, c, COUNT(*) AS n FROM g GROUP BY sbd, ngay, c, nhom)
  SELECT sbd, '' AS c, COUNT(*) AS n FROM tn GROUP BY sbd
  UNION ALL SELECT sbd, c, n FROM ch WHERE n >= ?4`

const laPhanBa = (goc: string, phanKho: string | undefined): boolean => (phanKho || /-(III|II|I)-\d+$/.exec(goc)?.[1] || '') === 'III'

/** Đợt 21: kết quả "đối phó" (14 ngày, cả trường) đổi chậm ⇒ nhớ 5 phút theo isolate (khoá D1 gốc + khoảng ngày + danh sách em). Đọc lỗi ⇒ không nhớ. */
const demDoiPho = new WeakMap<object, Map<string, { luc: number; kq: Awaited<ReturnType<typeof docDoiPhoTho>> }>>()
async function docDoiPho(env: Env, em: readonly EmGoc[], tu: string, den: string, canhBao: string[], nowMs = Date.now()): Promise<Awaited<ReturnType<typeof docDoiPhoTho>>> {
  const goc = dbGoc(env.DB as unknown as object)
  const m = demDoiPho.get(goc) ?? demDoiPho.set(goc, new Map()).get(goc)!
  const khoa = `${tu}|${den}|${em.map((e) => e.sbd).join(',')}`
  const cu = m.get(khoa)
  if (cu && nowMs - cu.luc < 300_000 && nowMs >= cu.luc) return cu.kq
  const kq = await docDoiPhoTho(env, em, tu, den, canhBao, nowMs)
  if (kq.daTinh.quaNhanh && kq.daTinh.chonLap) { if (m.size > 8) m.clear(); m.set(khoa, { luc: nowMs, kq }) }
  return kq
}
/**
 * B3 (15/10, giờ cao điểm): mỗi lô đọc qua ĐỆM THEO NGÀY (`nhip-hoc-dem.ts` — ngày đã qua tính sẵn, chỉ hôm nay tính trực tiếp; MỘT câu thay hai,
 * cùng một vòng chờ). Câu đệm lỗi (bảng chưa dựng trước đêm đầu, D1 cũ…) ⇒ lô ấy và isolate này 10 phút đi ĐÚNG hai truy vấn cũ bên dưới.
 * Hai đường cho cùng số (test so khớp `nhip-hoc-dem-1510.test.ts`). `dungDem = false` chỉ để test ép đường cũ.
 */
export async function docDoiPhoTho(
  env: Env,
  em: readonly EmGoc[],
  tu: string,
  den: string,
  canhBao: string[],
  nowMs = Date.now(),
  dungDem = true,
): Promise<{ theoEm: Map<string, DoiPhoEm>; daTinh: { quaNhanh: boolean; chonLap: boolean } }> {
  const theoEm = new Map<string, DoiPhoEm>()
  const homNay = ngayVnCua(nowMs)
  let docGiay = true
  let docLap = true
  for (let i = 0; i < em.length; i += LO_EM_BAI_HANG_NGAY) {
    const lo = em.slice(i, i + LO_EM_BAI_HANG_NGAY)
    const j = JSON.stringify(lo.map((e) => e.sbd))
    let rG: Row[] | null
    let rL: Row[] | null
    const quaDem = dungDem && docGiay && docLap && demDoiPhoDungDuoc(env, nowMs)
      ? await docDoiPhoLoQuaDem(env, lo.map((e) => e.sbd), tu, den, homNay).catch(() => { nghiDemDoiPho(env, nowMs); return null })
      : null
    if (quaDem) ({ rG, rL } = quaDem)
    else {
      ;[rG, rL] = await Promise.all([
        docGiay ? hoi(env, SQL_GIAY_LO, j, tu, den, NG.giayNhanhTracNghiem, NG.giayNhanhTuTinh) : Promise.resolve(null),
        docLap ? hoi(env, SQL_LAP_LO, j, tu, den, NG.chuoiLap) : Promise.resolve(null),
      ])
    }
    if (rG === null) docGiay = false
    if (rL === null) docLap = false
    // câu 8–14 giây: Phần III (tự tính) mới tính là quá nhanh ⇒ tra kho câu (đệm sẵn của omni-d1), thiếu kho ⇒ đuôi mã câu.
    const giua = (rG ?? []).filter((x) => str(x.loai) === 'giua')
    const goc = [...new Set(giua.map((x) => tachSongSinh(str(x.q)).goc).filter(Boolean))]
    const kho = goc.length ? await docCauKho(env, goc).catch(() => new Map<string, { phan: string }>()) : new Map<string, { phan: string }>()
    const giay = new Map<string, DemGiayEm>()
    const lay = (s: string) => giay.get(s) ?? giay.set(s, { coGiay: 0, coGiayKq: 0, coGiayDung: 0, nhanh: 0, nhanhKq: 0, nhanhDung: 0, coTuTinh: false }).get(s)!
    for (const x of rG ?? []) {
      const d = lay(str(x.sbd))
      const loai = str(x.loai)
      if (loai === 'tong') Object.assign(d, { coGiay: so(x.n), coGiayKq: so(x.nkq), coGiayDung: so(x.nd) })
      else if (loai === 'duoi8' || (loai === 'giua' && laPhanBa(tachSongSinh(str(x.q)).goc, kho.get(tachSongSinh(str(x.q)).goc)?.phan))) {
        d.nhanh += so(x.n)
        d.nhanhKq += so(x.nkq)
        d.nhanhDung += so(x.nd)
        if (loai === 'giua') d.coTuTinh = true
      }
    }
    const lap = new Map<string, { tong: number; chuoi: { chu: string; n: number }[] }>()
    for (const x of rL ?? []) {
      const s = str(x.sbd)
      const d = lap.get(s) ?? lap.set(s, { tong: 0, chuoi: [] }).get(s)!
      if (str(x.c)) d.chuoi.push({ chu: str(x.c), n: so(x.n) })
      else d.tong = so(x.n)
    }
    for (const e of lo) {
      const dp = doiPhoCuaEm(giay.get(e.sbd) ?? null, lap.get(e.sbd) ?? null)
      if (dp) theoEm.set(e.sbd, dp)
    }
  }
  if (!docGiay) canhBao.push('Chưa đọc được số giây làm câu — chưa tính được dấu hiệu trả lời quá nhanh.')
  if (!docLap) canhBao.push('Chưa đọc được đáp án em chọn — dấu hiệu đối phó lần này chỉ tính trả lời quá nhanh.')
  return { theoEm, daTinh: { quaNhanh: docGiay, chonLap: docLap } }
}

// ------------------------------------------------------------------ LỆNH

/** Mỗi lớp một dòng (như `/gv/bai-hang-ngay`): khối giảm dần rồi tên lớp. */
function demLop(em: readonly EmGoc[]): LopBaiHangNgay[] {
  const dem = new Map<string, LopBaiHangNgay>()
  for (const e of em) {
    const l = dem.get(e.lop) ?? { tenLop: e.lop, khoi: e.khoi, soEm: 0 }
    l.soEm++
    dem.set(e.lop, l)
  }
  return [...dem.values()].sort((a, c) => c.khoi.localeCompare(a.khoi) || a.tenLop.localeCompare(c.tenLop, 'vi'))
}

/** `POST /gv/nhip-hoc` — xem đầu tệp. */
export async function gvNhipHoc(env: Env, b: Row, nowMs = Date.now()): Promise<TraLoiNhipHoc> {
  const kh = khoangNgay(b, nowMs)
  if ('error' in kh) return { ok: false, error: kh.error }
  const { tu, den, homNay, canhBao } = kh
  const tatCa = await docDanhSachEm(env, canhBao)
  if (!tatCa) return { ok: false, error: 'Không đọc được danh sách học sinh.' }
  let ngayEm: Map<string, NgayBaiEm[]>
  let vao: Map<string, string>
  let dp: Awaited<ReturnType<typeof docDoiPho>>
  try {
    ;[ngayEm, vao, dp] = await Promise.all([docNgayCacEm(env, tatCa, tu, den, homNay, canhBao), docNgayVao(env, tatCa, tu), docDoiPho(env, tatCa, tu, den, canhBao, nowMs)])
  } catch (e) {
    return { ok: false, error: e instanceof LoiDocSo ? e.message : 'Không đọc được sổ học của các em.' }
  }
  const em: EmNhipHoc[] = tatCa
    .map((e) => {
      const ngay = ngayEm.get(e.sbd) ?? []
      const ngayVao = vao.get(e.sbd) ?? tu
      // CHỈ THÊM 13/10 đợt 18: độ tin cậy của nhóm — đúng phép bảng của em, trên chính dãy số trả về (không đọc thêm D1).
      const dai = ngayDuocTinh(ngay, ngayVao)
      const tt = tomTatNhip(dai, homNay)
      const bac = bacChamChi(dai, homNay, tt)
      return { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, khoi: e.khoi, ngayVao, muc: ngay.map((n) => n.mucToiThieu), lam: ngay.map((n) => n.daLam), doiPho: dp.theoEm.get(e.sbd) ?? null, ...tinCayNhomNhip(tt), ...(bac ? { bacCham: bac } : {}) }
    })
    .sort((a, c) => c.khoi.localeCompare(a.khoi) || a.hoTen.localeCompare(c.hoTen, 'vi') || a.sbd.localeCompare(c.sbd))
  return { ok: true, tu, den, homNay, ngay: cacNgay(tu, den), em, lop: demLop(tatCa), doiPhoDaTinh: dp.daTinh, canhBao }
}
