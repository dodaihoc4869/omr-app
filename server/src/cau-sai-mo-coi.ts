// KIỂM "CÂU SAI MỒ CÔI" (thầy 02/10: "đảm bảo tất cả các câu sai phải được xử lý triệt để" + "chỉ tính từ 29/09 thôi nhé").
// Chỉ ĐỌC. Một (em, câu) là câu sai khi LẦN TỰ LÀM CUỐI (bỏ sự kiện đọc lời giải và lượt LƯỚT — OMNI 3) từ ngày VN `tuNgay` là sai hoặc bỏ trống.
// Câu sai "mồ côi" = KHÔNG nguồn nào của kế hoạch ngày (srs2-d1 `docHoSo2`) kéo lại: không thuộc chiến dịch nào của em, không phải câu
// sai trong ca ĐÃ CÔNG BỐ (`docQidSaiCaDaCongBo`), không phải câu sai Lên bảng / đầu giờ (`docQidSaiTaiLop`). Sửa 02/10: bản đầu chỉ
// xét chiến dịch nên đếm thừa (381 ⇒ phần lớn là câu ca đã công bố vốn ĐÃ vào nợ). `ngoaiKho`: câu không có trong kho game ⇒ game
// không phục vụ được dù có nguồn kéo (cần câu song sinh / câu cùng dạng thay thế).
// `moCoi` = mồ côi theo 3 nguồn CŨ (trước v2). Hàng chữa lỗi v2 (`hang-chua-loi.ts`, nguồn thứ 4) kéo MỌI câu sai trong kho game ⇒ sau v2
// chỉ còn mồ côi câu NGOÀI kho game (`sauV2` = `ngoaiKho`; vd câu tự luận / đề chưa vào game) — số này cần câu song sinh / cùng dạng thay thế.
import type { Env } from './kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { SQL_LA_LAN_LAM } from './omni-kieu'

type Obj = Record<string, unknown>
const NGAY = /^\d{4}-\d{2}-\d{2}$/

const sqlCauSai = (coMucDich: boolean) => `
WITH ev AS (
  -- Câu gốc: bỏ hậu tố lượt game "#n" rồi hậu tố câu song sinh "~ss0|1" (04/10: thiếu bước này ⇒ lượt làm song sinh bị đếm thành câu "ngoài kho"),
  -- biến thể bằng mã "~bt<k>" và bộ ý Đ–S mới "~yd<k>" (06/10, ban-khac-ao.ts — cùng lẽ).
  SELECT sbd, CASE WHEN instr(q0, '~ss') > 0 THEN substr(q0, 1, instr(q0, '~ss') - 1)
    WHEN instr(q0, '~bt') > 0 THEN substr(q0, 1, instr(q0, '~bt') - 1)
    WHEN instr(q0, '~yd') > 0 THEN substr(q0, 1, instr(q0, '~yd') - 1) ELSE q0 END AS q, nguon, ket_qua, luc FROM (
  SELECT sbd, CASE WHEN instr(qid, '#') > 0 THEN substr(qid, 1, instr(qid, '#') - 1) ELSE qid END AS q0, nguon, ket_qua, luc
    FROM su_kien_hoc WHERE ngay_vn >= ? AND nguon <> 'nen'${coMucDich ? ` AND ${SQL_LA_LAN_LAM} AND COALESCE(assistance, '') <> 'assisted'` : ''}
  )
),
cuoi AS (
  SELECT ev.sbd, ev.q, ev.nguon, ev.ket_qua FROM ev
    JOIN (SELECT sbd, q, MAX(luc) AS luc FROM ev GROUP BY sbd, q) m ON m.sbd = ev.sbd AND m.q = ev.q AND m.luc = ev.luc
),
sai AS (SELECT sbd, q, MIN(nguon) AS nguon, MAX(CASE WHEN ket_qua IS NULL THEN 1 ELSE 0 END) AS bo_trong FROM cuoi
  WHERE ket_qua IS NULL OR ket_qua = 0 GROUP BY sbd, q),
cd AS (SELECT DISTINCT s.value AS sbd, j.value AS q FROM chien_dich c, json_each(c.sbd_json) s, json_each(c.qid_json) j WHERE c.trang_thai <> 'da_huy'),
caCb AS (SELECT DISTINCT s.sbd, s.qid AS q FROM su_kien_hoc s JOIN ca c ON c.ma_ca = s.ma_nguon
  WHERE s.nguon = 'thi' AND COALESCE(s.ket_qua, 0) <> 1 AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}),
lop AS (SELECT DISTINCT sbd, qid AS q FROM su_kien_hoc WHERE nguon IN ('len_bang', 'dau_gio') AND ket_qua = 0)
SELECT sai.sbd, sai.nguon, sai.bo_trong,
       CASE WHEN cd.q IS NULL AND caCb.q IS NULL AND lop.q IS NULL THEN 1 ELSE 0 END AS mo_coi,
       CASE WHEN EXISTS (SELECT 1 FROM game_v2_question g WHERE g.qid = sai.q) THEN 0 ELSE 1 END AS ngoai_kho
  FROM sai LEFT JOIN cd ON cd.sbd = sai.sbd AND cd.q = sai.q
           LEFT JOIN caCb ON caCb.sbd = sai.sbd AND caCb.q = sai.q
           LEFT JOIN lop ON lop.sbd = sai.sbd AND lop.q = sai.q`

/** Gộp các dòng (em, câu sai) thành số theo kênh + danh sách em có nhiều câu mồ côi nhất. Tách riêng để test. */
export function tongHopMoCoi(rows: { sbd: string; nguon: string; bo_trong: number; mo_coi: number; ngoai_kho?: number }[]) {
  const kenh = new Map<string, { kenh: string; cauSai: number; boTrong: number; moCoi: number; ngoaiKho: number; em: Set<string> }>()
  const theoEm = new Map<string, number>()
  for (const r of rows) {
    const k = kenh.get(r.nguon) ?? { kenh: r.nguon, cauSai: 0, boTrong: 0, moCoi: 0, ngoaiKho: 0, em: new Set<string>() }
    k.cauSai++
    if (Number(r.bo_trong) === 1) k.boTrong++
    if (Number(r.ngoai_kho) === 1) k.ngoaiKho++
    if (Number(r.mo_coi) === 1) { k.moCoi++; theoEm.set(r.sbd, (theoEm.get(r.sbd) ?? 0) + 1) }
    k.em.add(r.sbd)
    kenh.set(r.nguon, k)
  }
  const dsKenh = [...kenh.values()].map(({ em, ...x }) => ({ ...x, soEm: em.size })).sort((a, b) => b.cauSai - a.cauSai)
  return {
    tong: { cauSai: rows.length, moCoi: rows.filter((r) => Number(r.mo_coi) === 1).length, ngoaiKho: rows.filter((r) => Number(r.ngoai_kho) === 1).length, sauV2: rows.filter((r) => Number(r.ngoai_kho) === 1).length, soEm: new Set(rows.map((r) => r.sbd)).size },
    kenh: dsKenh,
    emNhieuNhat: [...theoEm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([sbd, moCoi]) => ({ sbd, moCoi })),
  }
}

/** `/gv/cau-sai-mo-coi {tuNgay?}` (thầy) — mặc định từ 29/09/2026 theo lệnh thầy. */
export async function gvCauSaiMoCoi(env: Env, b: Obj) {
  const tuNgay = NGAY.test(String(b.tuNgay ?? '')) ? String(b.tuNgay) : '2026-09-29'
  type Dong = { sbd: string; nguon: string; bo_trong: number; mo_coi: number; ngoai_kho: number }
  const doc = (coMucDich: boolean) => env.DB.prepare(sqlCauSai(coMucDich)).bind(tuNgay).all<Dong>()
  const r = await doc(true).catch(() => doc(false)) // sổ cũ chưa có cột purpose
  return { ok: true, tuNgay, ...tongHopMoCoi(r.results ?? []) }
}
