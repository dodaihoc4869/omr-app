// ĐỆM THEO NGÀY cho cờ "ĐỐI PHÓ" của Nhịp học thầy (B3 "máy chủ nhanh hơn giờ cao điểm", thầy duyệt 15/10). KHÔNG đổi dữ liệu trả về.
//
// VÌ SAO: `/gv/nhip-hoc` quét sổ `su_kien_hoc` của CẢ TRƯỜNG từ 01/10 tới hôm nay mỗi lần thầy mở (hai truy vấn SQL_GIAY_LO + SQL_LAP_LO
// của nhip-hoc.ts, hàm cửa sổ). D1 insights giờ cao điểm 14/10: ~0,57 s và ~188 nghìn dòng đọc mỗi lần, ~135 lần / 3 giờ; số dòng TĂNG theo
// số ngày của khoảng (01/10 → 01/12: ×4,4). Mọi số đếm của hai truy vấn ấy CỘNG ĐƯỢC THEO NGÀY: lượt có số giây / dưới 8 giây / 8–14 giây theo câu
// cộng dồn; chuỗi chọn lặp vốn KHÔNG nối qua ngày (PARTITION BY sbd, ngay). ⇒ ngày ĐÃ QUA tính một lần, cất một dòng mỗi (em, ngày) ở
// `nhip_hoc_doi_pho_ngay`; chỉ HÔM NAY (ngày VN) tính trực tiếp. Bảng này là ĐỆM DẪN XUẤT (xoá đi chỉ làm lần sau tính lại), không phải dữ liệu thật.
//
// NGÀY ĐÃ QUA CÓ ĐỔI ĐƯỢC KHÔNG? CÓ — đã soát mọi đường ghi sổ (15/10):
//   · nộp bù ngoại tuyến / nạp lại sổ (`ghiSuKien` boQuaTrung/tranhTrungLo, su-kien-nap-lai.ts): INSERT dòng mới mang `luc` (⇒ `ngay_vn`) CŨ;
//   · chấm lại ca thi (`ghiSuKien` capNhat — ON CONFLICT DO UPDATE): đổi ket_qua, giay, luc, ngay_vn, raw_json, visibility của dòng cũ;
//   · công bố ca (`congBoSuKien`, nang-luc-d1.ts): UPDATE embargoed → released cho dòng của ngày thi ⇒ dòng ấy BẮT ĐẦU được tính;
//   · xoá dòng (không có đường mã nào hôm nay, nhưng sửa tay / reset sau này có thể).
//   "Tính lại 2–3 ngày gần nhất mỗi đêm" KHÔNG đủ (ca công bố muộn hơn, máy em ngoại tuyến nhiều ngày); "dấu vân tay rẻ theo ngày" phải đọc lại
//   đúng các dòng ấy (COUNT/SUM trên giây, raw_json, visibility…) nên không bớt được dòng đọc.
// CÁCH VÔ HIỆU ĐÃ CHỌN — TRIGGER ở tầng D1 (đã có tiền lệ trên chính sổ này: migration-z-0710-chua-giao-tu-so.sql): mỗi INSERT / UPDATE / DELETE
//   trên `su_kien_hoc` XOÁ dòng đệm (sbd, ngày) của dòng cũ và dòng mới, CÙNG giao dịch với lệnh ghi. Bắt MỌI đường ghi (kể cả đường viết sau này),
//   không phải sửa tệp ghi sổ của phiên khác. Giá: một lần dò khoá chính trên bảng nhỏ mỗi dòng sổ ghi (không thêm vòng chờ nào cho lệnh nóng).
//   Không có điều kiện "ngày < hôm nay" trong trigger ⇒ không lệ thuộc đồng hồ D1 ↔ Worker lệch nhau quanh nửa đêm.
// BẤT BIẾN: dòng đệm nào CÒN trong một ảnh chụp D1 thì khớp sổ của CHÍNH ảnh chụp ấy — vì (1) dòng đệm chỉ được ghi bằng MỘT câu
//   `INSERT … SELECT` đọc thẳng sổ (nguyên tử, không có khe giữa "đọc" và "ghi"); (2) mọi ghi sổ xoá dòng đệm tương ứng trong cùng giao dịch.
//   Bản sao đọc (`withSession`) là ảnh chụp nhất quán của primary ⇒ bất biến giữ cả khi đọc từ bản sao.
// AI GHI ĐỆM: chỉ cron đêm 00:01 VN (`lapDemDoiPho`, gọi từ `scheduled()` — dựng bảng + trigger lúc chạy như chỉ mục cron đêm, rồi lấp các
//   (em, ngày) còn thiếu từ 01/10 tới HÔM QUA). Lệnh của thầy CHỈ ĐỌC (giữ nguyên phân loại route đọc-chỉ chạy trên `envDoc`): (em, ngày) thiếu
//   đệm / đệm khác phiên bản / bị trigger xoá ⇒ tính trực tiếp TRONG CÙNG câu đọc (EXCEPT), đêm sau cron lấp lại. Bảng chưa có (trước đêm đầu)
//   hoặc câu đọc lỗi ⇒ rơi về đúng hai truy vấn cũ (nhip-hoc.ts), nhớ theo isolate 10 phút để không thử lại mỗi lượt.
// PHIÊN BẢN: cột `ban` = băm của phần SQL tính + ngưỡng (8 giây / 15 giây / chuỗi 6) — đổi luật ở mã ⇒ dòng cũ tự coi như chưa tính.
// ⚠️ KHÔNG BAO GIỜ `DROP TABLE nhip_hoc_doi_pho_ngay` khi chưa DROP ba trigger `nhip_hoc_doi_pho_sau_*` (trigger trỏ tới bảng mất ⇒ MỌI lệnh ghi sổ lỗi).
//   Xoá dữ liệu (DELETE) thì an toàn. Reset xếp bảng vào GIỮ (đệm dẫn xuất từ sổ — sổ cũng GIỮ).
import type { Env } from './kieu'
import { NGUONG_THAI_DO as NG } from './bai-hang-ngay-kieu'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { cacNgay, congNgayBhn, docDanhSachEm, khoangNgay, LO_EM_BAI_HANG_NGAY, ngayVnCua } from './bai-hang-ngay'
import { chayDdlMotLan } from './ddl-mot-lan'
import { dbGoc } from './cau-hinh-dem'

type Row = Record<string, unknown>

export const BANG_DEM_DOI_PHO = 'nhip_hoc_doi_pho_ngay'

/** Bảng đệm + ba trigger vô hiệu — MỘT `DB.batch` (một giao dịch): có bảng thì chắc chắn có trigger. Chạy lúc cron (không trên đường lệnh của thầy). */
export const DDL_DEM_DOI_PHO: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS ${BANG_DEM_DOI_PHO} (
    sbd TEXT NOT NULL,
    ngay TEXT NOT NULL,
    ban TEXT NOT NULL,
    tn INTEGER NOT NULL, tkq INTEGER NOT NULL, td INTEGER NOT NULL,
    dn INTEGER NOT NULL, dkq INTEGER NOT NULL, dd INTEGER NOT NULL,
    gj TEXT NOT NULL,
    lt INTEGER NOT NULL,
    cj TEXT NOT NULL,
    luc TEXT NOT NULL,
    PRIMARY KEY (sbd, ngay)
  )`,
  `CREATE TRIGGER IF NOT EXISTS nhip_hoc_doi_pho_sau_them AFTER INSERT ON su_kien_hoc BEGIN
    DELETE FROM ${BANG_DEM_DOI_PHO} WHERE sbd = NEW.sbd AND ngay = NEW.ngay_vn;
  END`,
  `CREATE TRIGGER IF NOT EXISTS nhip_hoc_doi_pho_sau_sua AFTER UPDATE ON su_kien_hoc BEGIN
    DELETE FROM ${BANG_DEM_DOI_PHO} WHERE sbd = OLD.sbd AND ngay = OLD.ngay_vn;
    DELETE FROM ${BANG_DEM_DOI_PHO} WHERE sbd = NEW.sbd AND ngay = NEW.ngay_vn;
  END`,
  `CREATE TRIGGER IF NOT EXISTS nhip_hoc_doi_pho_sau_xoa AFTER DELETE ON su_kien_hoc BEGIN
    DELETE FROM ${BANG_DEM_DOI_PHO} WHERE sbd = OLD.sbd AND ngay = OLD.ngay_vn;
  END`,
]

/** Các cột số của một (em, ngày) — tên ngắn vì đi qua mạng mỗi lần đọc. */
const COT_SO = 'tn, tkq, td, dn, dkq, dd, gj, lt, cj'
const DEM = (dk: string) => `SUM(CASE WHEN ${dk} THEN 1 ELSE 0 END)`

/**
 * LÕI TÍNH cho các cặp (em, ngày) của CTE `cap(sbd, ngay)` — ĐÚNG từng biểu thức của SQL_GIAY_LO + SQL_LAP_LO (nhip-hoc.ts), chỉ thêm `ngay` vào mọi
 * GROUP BY / PARTITION (chuỗi chọn lặp vốn đã chia theo ngày ⇒ không đổi). Tham số: ?7 giây trắc nghiệm, ?8 giây tự tính, ?9 độ dài chuỗi tối thiểu.
 *   tn/tkq/td = lượt có số giây (đếm / có kết quả / đúng) · dn/dkq/dd = như thế với lượt dưới ?7 giây · gj = [[câu, n, nkq, nd], …] lượt ?7–(?8−1) giây
 *   · lt = lượt có chữ A–D · cj = [[chữ, n, nhóm], …] các chuỗi ≥ ?9 (nhóm = hiệu hai ROW_NUMBER — để xếp đúng thứ tự cũ).
 *   "tong"/"duoi8"/A–D gom MỘT lượt quét (`SUM(CASE …)` = COUNT có điều kiện của bản cũ: COUNT(kq) ≡ đếm kq IS NOT NULL) ⇒ bớt quét lại + bớt nối.
 * `cap CROSS JOIN su_kien_hoc` ép thứ tự nối: mỗi cặp một lần tìm theo chỉ mục (sbd, ngay_vn).
 */
const SQL_LOI_TINH = `r AS (
    SELECT s.sbd AS sbd, s.ngay_vn AS ngay, s.luc AS luc, s.khoa AS khoa, s.qid AS qid, s.ket_qua AS kq, CAST(s.giay AS REAL) AS gc,
      CASE WHEN json_valid(s.raw_json) THEN CAST(json_extract(s.raw_json, '$.ms') AS REAL) END AS ms,
      CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.tc') END AS tc,
      UPPER(TRIM(CAST(CASE WHEN json_valid(s.raw_json) THEN COALESCE(json_extract(s.raw_json, '$.chon'), json_extract(s.raw_json, '$.traLoi')) END AS TEXT))) AS c
    FROM cap CROSS JOIN su_kien_hoc s ON s.sbd = cap.sbd AND s.ngay_vn = cap.ngay
    WHERE ${SQL_LA_LAN_LAM} AND COALESCE(s.visibility, '') <> 'embargoed'
  ),
  l AS MATERIALIZED (
    SELECT sbd, ngay, luc, khoa, c, COALESCE(NULLIF(tc, ''), qid) AS q, kq,
      CASE WHEN gc > 0 THEN MAX(1, ROUND(gc)) WHEN ms > 0 THEN MAX(1, ROUND(ms / 1000.0)) END AS g
    FROM r
  ),
  tong AS (
    SELECT sbd, ngay,
      ${DEM('g IS NOT NULL')} AS tn, ${DEM('g IS NOT NULL AND kq IS NOT NULL')} AS tkq, ${DEM('g IS NOT NULL AND kq = 1')} AS td,
      ${DEM('g < ?7')} AS dn, ${DEM('g < ?7 AND kq IS NOT NULL')} AS dkq, ${DEM('g < ?7 AND kq = 1')} AS dd,
      ${DEM("c IN ('A', 'B', 'C', 'D')")} AS lt
    FROM l GROUP BY sbd, ngay
  ),
  gq AS (
    SELECT sbd, ngay, q, COUNT(*) AS n, COUNT(kq) AS nkq, SUM(CASE WHEN kq = 1 THEN 1 ELSE 0 END) AS nd
    FROM l WHERE g >= ?7 AND g < ?8 GROUP BY sbd, ngay, q
  ),
  gjs AS (SELECT sbd, ngay, json_group_array(json_array(q, n, nkq, nd)) AS j FROM gq GROUP BY sbd, ngay),
  w AS (
    SELECT sbd, ngay, c,
      ROW_NUMBER() OVER (PARTITION BY sbd, ngay ORDER BY luc, khoa) - ROW_NUMBER() OVER (PARTITION BY sbd, ngay, c ORDER BY luc, khoa) AS nhom
    FROM l WHERE c IN ('A', 'B', 'C', 'D')
  ),
  ch AS (SELECT sbd, ngay, c, nhom, COUNT(*) AS n FROM w GROUP BY sbd, ngay, c, nhom),
  cjs AS (SELECT sbd, ngay, json_group_array(json_array(c, n, nhom)) AS j FROM ch WHERE n >= ?9 GROUP BY sbd, ngay),
  tinh AS (
    SELECT cap.sbd AS sbd, cap.ngay AS ngay, COALESCE(tong.tn, 0) AS tn, COALESCE(tong.tkq, 0) AS tkq, COALESCE(tong.td, 0) AS td,
      COALESCE(tong.dn, 0) AS dn, COALESCE(tong.dkq, 0) AS dkq, COALESCE(tong.dd, 0) AS dd, COALESCE(gjs.j, '[]') AS gj,
      COALESCE(tong.lt, 0) AS lt, COALESCE(cjs.j, '[]') AS cj
    FROM cap
      LEFT JOIN tong ON tong.sbd = cap.sbd AND tong.ngay = cap.ngay
      LEFT JOIN gjs ON gjs.sbd = cap.sbd AND gjs.ngay = cap.ngay
      LEFT JOIN cjs ON cjs.sbd = cap.sbd AND cjs.ngay = cap.ngay
  )`

/** Dòng đệm hợp lệ của lô: ?1 sbd (JSON), ?2–?3 khoảng ngày đã qua, ?4 phiên bản; ?5 = các ngày đã qua (JSON) để biết (em, ngày) nào còn thiếu. */
const SQL_DAU = `WITH em(sbd) AS (SELECT DISTINCT value FROM json_each(?1)),
  ng(ngay) AS (SELECT value FROM json_each(?5)),
  dem AS MATERIALIZED (
    SELECT sbd, ngay, ${COT_SO} FROM ${BANG_DEM_DOI_PHO}
    WHERE sbd IN (SELECT sbd FROM em) AND ngay BETWEEN ?2 AND ?3 AND ban = ?4
  ),`

/**
 * ĐƯỜNG ĐỌC (lệnh thầy, CHỈ ĐỌC, MỘT câu mỗi lô ⇒ một ảnh chụp nhất quán, không thêm vòng chờ so với bản cũ): dòng đệm hợp lệ + tính trực tiếp
 * các (em, ngày đã qua) còn thiếu + HÔM NAY (?6, '' khi khoảng không chạm hôm nay). Chỉ trả (em, ngày) có lượt (dòng toàn 0 không góp gì).
 */
export const SQL_DOC_DEM_DOI_PHO = `${SQL_DAU}
  cap(sbd, ngay) AS MATERIALIZED (
    SELECT em.sbd, ng.ngay FROM em, ng EXCEPT SELECT sbd, ngay FROM dem
    UNION ALL SELECT sbd, ?6 FROM em WHERE ?6 <> ''
  ),
  ${SQL_LOI_TINH}
SELECT sbd, ngay, ${COT_SO} FROM dem WHERE tn > 0 OR lt > 0
UNION ALL SELECT sbd, ngay, ${COT_SO} FROM tinh WHERE tn > 0 OR lt > 0`

/** ĐƯỜNG GHI (chỉ cron): lấp MỌI (em, ngày đã qua) còn thiếu — kể cả dòng toàn 0 (có dòng = đã tính). Một câu `INSERT … SELECT` nguyên tử. ?6 = lúc tính. */
export const SQL_LAP_DEM_DOI_PHO = `${SQL_DAU}
  cap(sbd, ngay) AS MATERIALIZED (SELECT em.sbd, ng.ngay FROM em, ng EXCEPT SELECT sbd, ngay FROM dem),
  ${SQL_LOI_TINH}
INSERT OR REPLACE INTO ${BANG_DEM_DOI_PHO} (sbd, ngay, ban, ${COT_SO}, luc)
SELECT sbd, ngay, ?4, ${COT_SO}, ?6 FROM tinh`

/** FNV-1a 32 bit — đủ để phân biệt phiên bản phép tính (không dùng cho bảo mật). */
function bam(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0
  return h.toString(16).padStart(8, '0')
}
/** Phiên bản đệm: đổi SQL tính hay ngưỡng ⇒ khác ⇒ dòng cũ coi như chưa tính (đọc trực tiếp, đêm sau lấp lại). */
export const BAN_DEM_DOI_PHO = `1-${NG.giayNhanhTracNghiem}-${NG.giayNhanhTuTinh}-${NG.chuoiLap}-${bam(SQL_LOI_TINH)}`

const nguong = () => [NG.giayNhanhTracNghiem, NG.giayNhanhTuTinh, NG.chuoiLap] as const
const so = (x: unknown): number => {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
const mang = (x: unknown): unknown[][] => {
  try {
    const a: unknown = JSON.parse(String(x ?? '[]'))
    return Array.isArray(a) ? a.filter((v): v is unknown[] => Array.isArray(v)) : []
  } catch {
    return []
  }
}

/**
 * Dòng theo (em, ngày) ⇒ ĐÚNG hình dạng kết quả của SQL_GIAY_LO (`loai/sbd/q/n/nkq/nd`) và SQL_LAP_LO (`sbd/c/n`) trên cả khoảng:
 * 'tong'/'duoi8' cộng dồn các ngày (chỉ có dòng khi > 0, như GROUP BY trên tập rỗng); 'giua' mỗi (ngày, câu) một dòng — nơi dùng chỉ CỘNG theo câu nên
 * bằng dòng gộp (sbd, câu) cũ; chuỗi xếp (ngày, chữ, nhóm) tăng dần = thứ tự GROUP BY sbd, ngay, c, nhom của truy vấn cũ (chuỗi dài bằng nhau ⇒ chữ
 * của chuỗi ĐẦU TIÊN được nêu, nên thứ tự phải giữ).
 */
export function gopNgayDoiPho(rows: readonly Row[]): { rG: Row[]; rL: Row[] } {
  const theoEm = new Map<string, Row[]>()
  for (const x of rows) {
    const s = String(x.sbd ?? '')
    ;(theoEm.get(s) ?? theoEm.set(s, []).get(s)!).push(x)
  }
  const rG: Row[] = []
  const rL: Row[] = []
  for (const [sbd, ds] of theoEm) {
    ds.sort((a, b) => (String(a.ngay) < String(b.ngay) ? -1 : String(a.ngay) > String(b.ngay) ? 1 : 0))
    const tong = { n: 0, nkq: 0, nd: 0 }
    const duoi8 = { n: 0, nkq: 0, nd: 0 }
    let lt = 0
    const chuoi: { c: string; n: number; nhom: number; ngay: string }[] = []
    for (const x of ds) {
      tong.n += so(x.tn); tong.nkq += so(x.tkq); tong.nd += so(x.td)
      duoi8.n += so(x.dn); duoi8.nkq += so(x.dkq); duoi8.nd += so(x.dd)
      lt += so(x.lt)
      for (const [q, n, nkq, nd] of mang(x.gj)) rG.push({ loai: 'giua', sbd, q, n, nkq, nd })
      for (const [c, n, nhom] of mang(x.cj)) chuoi.push({ c: String(c ?? ''), n: so(n), nhom: so(nhom), ngay: String(x.ngay) })
    }
    if (tong.n > 0) rG.push({ loai: 'tong', sbd, q: '', ...tong })
    if (duoi8.n > 0) rG.push({ loai: 'duoi8', sbd, q: '', ...duoi8 })
    if (lt > 0) rL.push({ sbd, c: '', n: lt })
    chuoi.sort((a, b) => (a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : a.c < b.c ? -1 : a.c > b.c ? 1 : a.nhom - b.nhom))
    for (const c of chuoi) rL.push({ sbd, c: c.c, n: c.n })
  }
  return { rG, rL }
}

/** Câu đọc đệm hỏng (bảng chưa có trước đêm đầu, D1 cũ…) ⇒ isolate này dùng đường cũ 10 phút rồi mới thử lại (không trả giá một vòng hỏng mỗi lượt). */
const NGHI_MS = 600_000
const nghiDen = new WeakMap<object, number>()
export function demDoiPhoDungDuoc(env: Env, nowMs: number): boolean {
  const t = nghiDen.get(dbGoc(env.DB as unknown as object))
  return t === undefined || nowMs >= t || nowMs < t - NGHI_MS
}
export function nghiDemDoiPho(env: Env, nowMs: number): void {
  nghiDen.set(dbGoc(env.DB as unknown as object), nowMs + NGHI_MS)
}

/**
 * Số đếm "đối phó" của MỘT lô em trên khoảng `tu…den` (≤ hôm nay), đúng hình dạng hai truy vấn cũ. Ngày đã qua: đệm (thiếu thì tính trực tiếp);
 * hôm nay: tính trực tiếp. MỘT câu đọc. Lỗi ⇒ NÉM (nơi gọi rơi về đường cũ).
 */
export async function docDoiPhoLoQuaDem(env: Env, sbd: readonly string[], tu: string, den: string, homNay: string): Promise<{ rG: Row[]; rL: Row[] }> {
  const homQua = congNgayBhn(homNay, -1)
  const denQua = den < homQua ? den : homQua
  const ngayQua = tu <= denQua ? cacNgay(tu, denQua) : []
  const tinhHomNay = tu <= homNay && homNay <= den ? homNay : ''
  const r = await env.DB.prepare(SQL_DOC_DEM_DOI_PHO)
    .bind(JSON.stringify(sbd), tu, denQua, BAN_DEM_DOI_PHO, JSON.stringify(ngayQua), tinhHomNay, ...nguong())
    .all<Row>()
  return gopNgayDoiPho(r.results ?? [])
}

/** Số ngày mỗi câu lấp (giữ khoá ghi D1 ngắn; đêm đầu sau phát hành lấp cả khoảng từ 01/10). */
const NGAY_MOI_CAU_LAP = 7

/**
 * CRON ĐÊM (00:01 VN, `scheduled()`): dựng bảng + trigger (một lần mỗi isolate) rồi lấp mọi (em, ngày) còn thiếu của khoảng MẶC ĐỊNH của Nhịp học
 * (01/10 hoặc 62 ngày gần nhất) tới HÔM QUA — không bao giờ ghi hôm nay. Đêm thường chỉ có hôm qua (+ cặp bị trigger xoá) là thiếu.
 * Trả số câu lấp đã chạy + số dòng đã ghi. Lỗi ⇒ NÉM (nơi gọi ghi nhật ký máy); lệnh thầy vẫn đúng nhờ tính trực tiếp phần thiếu.
 */
export async function lapDemDoiPho(env: Env, nowMs = Date.now()): Promise<{ soCau: number; soDong: number }> {
  await chayDdlMotLan(env, 'nhip-hoc-doi-pho', DDL_DEM_DOI_PHO)
  const kh = khoangNgay({}, nowMs)
  if ('error' in kh) return { soCau: 0, soDong: 0 }
  const homQua = congNgayBhn(ngayVnCua(nowMs), -1)
  if (kh.tu > homQua) return { soCau: 0, soDong: 0 }
  const em = await docDanhSachEm(env, [])
  if (!em || em.length === 0) return { soCau: 0, soDong: 0 }
  const ngay = cacNgay(kh.tu, homQua)
  const luc = new Date(nowMs).toISOString()
  let soCau = 0
  let soDong = 0
  for (let i = 0; i < em.length; i += LO_EM_BAI_HANG_NGAY) {
    const j = JSON.stringify(em.slice(i, i + LO_EM_BAI_HANG_NGAY).map((e) => e.sbd))
    for (let k = 0; k < ngay.length; k += NGAY_MOI_CAU_LAP) {
      const doan = ngay.slice(k, k + NGAY_MOI_CAU_LAP)
      const r = await env.DB.prepare(SQL_LAP_DEM_DOI_PHO).bind(j, doan[0], doan[doan.length - 1], BAN_DEM_DOI_PHO, JSON.stringify(doan), luc, ...nguong()).run()
      soCau++
      soDong += so((r as { meta?: { changes?: unknown } }).meta?.changes)
    }
  }
  return { soCau, soDong }
}
