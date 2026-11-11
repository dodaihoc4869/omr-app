// Một luật đóng lỗi cho các kênh; đọc theo lô để kho sai không tạo N lượt D1.
import type { Env } from './kieu'
import {
  phatLaiLoi,
  tachSongSinh,
  thamSoTheoLyDo,
  TU_NGAY,
  THAM_SO_GOC,
  type KetQuaLoi,
  type LanLamLoi,
  type ThamSoLuat,
} from './loi-hoc-luat'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { docLyDoLoi, docThamSoEmVaLyDo, lyDoHieuLuc } from './ly-do-sai'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { docThamSo } from './tu-hoan-thien'
import { docThamSoEm } from './ca-nhan-hoa-v2'
import type { TrangThaiDay } from './chua-cau-sai-kieu'
import { NhoCoLuot } from './chua-gon-nho'
export interface TrangThaiLoiDau {
  qidChuan: string
  loiHoc: KetQuaLoi
  moLuc: number | null
  saiCuoiLuc: number | null
}
export function qidChuan(qid: string): string {
  const q = tachSongSinh(qid).goc
  return q.startsWith('tc:') ? q.slice(3) : q
}
type Row = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))
import { SQL_DAU_HO_TRO_CHUA } from './dau-ho-tro-chua'
export { SQL_DAU_HO_TRO_CHUA }
export async function docLuatChua(env: Env, sbd: string): Promise<ThamSoLuat> {
  // 29/10 (thầy «Mở câu quá lâu»): hai lượt đọc độc lập chạy CÙNG đợt (trước: nối tiếp — tham số riêng của em rồi mới tham số chung). Kết quả y như cũ: riêng em nếu có, không thì chung.
  const [em, chung] = await Promise.all([docThamSoEm(env, sbd), docThamSo(env)])
  return em ?? chung
}
const LOC_LAN_LAM_LOI = `${SQL_LA_LAN_LAM} AND COALESCE(s.visibility,'')<>'embargoed'
   AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
   AND (s.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=s.ma_nguon AND ld.sbd=s.sbd AND ld.status='submitted'))`
const COT_LAN_LAM_LOI = `s.qid,s.nguon,s.luc,s.ngay_vn,s.ket_qua,s.assistance,json_extract(s.raw_json,'$.tc') AS tc`
/** Lần làm của các câu cần (11/11). Câu cũ «qid IN … OR tc IN …» khiến SQLite quét MỌI dòng của em từ TU_NGAY (đo 11/11: ~789 triệu hàng đọc / 10 giờ).
 *  Nay tách hai nhánh, mỗi nhánh đi đúng chỉ mục: (A) qid trong danh sách — idx_skh_em_qid_ngay; (B) tc trong danh sách mà qid KHÔNG trong danh sách
 *  (không trùng dòng với A) — idx_skh_em_tc (dấu «+» trước ngay_vn để bộ lập kế hoạch không chọn chỉ mục theo ngày). Bind: sbd, tat, TU_NGAY, sbd, tc, tat, TU_NGAY. */
export const SQL_LOI_DAU_SKH = `SELECT ${COT_LAN_LAM_LOI} FROM su_kien_hoc s WHERE s.sbd=? AND s.qid IN (SELECT value FROM json_each(?)) AND s.ngay_vn>=? AND ${LOC_LAN_LAM_LOI}
 UNION ALL SELECT ${COT_LAN_LAM_LOI} FROM su_kien_hoc s WHERE s.sbd=? AND json_extract(s.raw_json,'$.tc') IN (SELECT value FROM json_each(?)) AND json_extract(s.raw_json,'$.tc') IS NOT NULL
   AND (s.qid IS NULL OR s.qid NOT IN (SELECT value FROM json_each(?))) AND +s.ngay_vn>=? AND ${LOC_LAN_LAM_LOI}`
/** Dấu hỗ trợ của các câu cần (11/11; cũ đọc mọi dấu của em từ TU_NGAY, ~381 triệu hàng / 10 giờ). Dòng nào có qidChuan(qid) = gốc r thì qid bắt đầu bằng
 *  r hoặc «tc:»+r ⇒ dò khoảng [tiền tố, tiền tố+U+10FFFF) trên khoá chính (sbd,qid,luc); tập rộng hơn một chút, JS lọc đúng như cũ. Bind: [gốc, «tc:»gốc…], sbd, luc. */
export const SQL_LOI_DAU_HOI = `SELECT DISTINCT l.qid,l.luc FROM json_each(?) r CROSS JOIN loi_giai_hoi l ON l.sbd=? AND l.qid>=r.value AND l.qid<r.value||char(1114111)
 WHERE ${SQL_DAU_HO_TRO_CHUA.replace(/\b(co_ho_so|nguon)\b/g, 'l.$1')} AND l.luc>=?`
const nhoAlias = new NhoCoLuot<{ qid: string; goc: string }[]>()
export async function docNhieuTrangThaiLoiDau(
  env: Env,
  sbd: string,
  qids: string[],
  homNay: string,
  thamSo?: ThamSoLuat,
): Promise<Map<string, TrangThaiLoiDau>> {
  const goc = [...new Set(qids.map(qidChuan))],
    ra = new Map<string, TrangThaiLoiDau>()
  if (!goc.length) return ra
  const ds = JSON.stringify(goc)
  // 29/10: nhóm câu cùng nội dung của MỘT vài câu là dữ liệu ít đổi ⇒ nhớ 3 phút trong isolate (chỉ lượt tra ≤ 5 câu: mở / nộp một câu sửa; danh sách lớn không nhớ).
  const khoaAlias = goc.length <= 5 ? ds : ''
  const nho = khoaAlias ? nhoAlias.doc(khoaAlias) : undefined
  const aliasRows = nho ? { results: nho } : await env.DB.prepare(
    `SELECT a.qid AS qid,b.qid AS goc FROM game_v2_question b JOIN game_v2_question a ON a.content_group=b.content_group AND a.content_group<>'' WHERE b.qid IN (SELECT value FROM json_each(?))`,
  )
    .bind(ds)
    .all<{ qid: string; goc: string }>()
  if (khoaAlias && !nho) nhoAlias.ghi(khoaAlias, aliasRows.results ?? [])
  const alias = new Map<string, Set<string>>()
  for (const q of goc) alias.set(q, new Set([q]))
  for (const x of aliasRows.results ?? []) alias.get(x.goc)?.add(x.qid)
  const roots = [...new Set([...alias.values()].flatMap((x) => [...x]))],
    tat = JSON.stringify(
      roots.flatMap((q) => [q, ...[0, 1, 2, 3].map((i) => `${q}~ss${i}`)]),
    ),
    tcList = JSON.stringify(roots)
  const [r, docs, materials, ts, lyDo] = await Promise.all([
    // 11/11 (hoá đơn Cloudflare — hàng đọc D1): hai câu dưới đọc ĐÚNG dòng của các câu cần, không quét cả lịch sử của em. Cùng tập dòng như câu cũ
    // (test tests/doc-loi-dau-chi-muc-1111.test.ts so cũ ↔ mới), xem SQL_LOI_DAU_SKH / SQL_LOI_DAU_HOI.
    env.DB.prepare(SQL_LOI_DAU_SKH)
      .bind(sbd, tat, TU_NGAY, sbd, tcList, tat, TU_NGAY)
      .all<Row>(),
    env.DB.prepare(SQL_LOI_DAU_HOI)
      .bind(JSON.stringify(roots.flatMap((q) => [q, `tc:${q}`])), sbd, `${TU_NGAY}T00:00:00`)
      .all<{ qid: string; luc: string }>(),
    env.DB.prepare(
      "SELECT DISTINCT qid_chuan AS qid FROM chua_loi_hoc_lieu WHERE qid_chuan IN (SELECT value FROM json_each(?)) AND trang_thai='du_dung'",
    )
      .bind(ds)
      .all<{ qid: string }>(),
    // 10/11 khối B: lượt đúng theo loại lỗi — chưa có tham số ⇒ tham số riêng + lý do trong MỘT câu (không thêm lệnh); nơi gọi đưa sẵn tham số ⇒ đọc lý do cùng đợt
    thamSo ? Promise.resolve({ ts: thamSo, ly: docLyDoLoi(env, sbd) }) : Promise.all([docThamSoEmVaLyDo(env, sbd), docThamSo(env)]).then(([x, chung]) => ({ ts: x.em ?? chung, ly: Promise.resolve(x.ly) })),
  ]).then(async ([r0, d0, m0, t0]) => [r0, d0, m0, t0.ts, await t0.ly] as const)
  const lan = new Map<string, LanLamLoi[]>(),
    ss = new Set((materials.results ?? []).map((x) => x.qid))
  for (const x of r.results ?? []) {
    const q = qidChuan(str(x.qid)),
      tc = qidChuan(str(x.tc))
    const keys = goc.filter(
      (k) => alias.get(k)?.has(q) || alias.get(k)?.has(tc),
    )
    for (const k of keys) {
      const ds = lan.get(k) ?? []
      ds.push({
        luc: str(x.luc),
        ngayVn: str(x.ngay_vn),
        ketQua: x.ket_qua == null ? null : (Number(x.ket_qua) as 0 | 1),
        coHoTro: !['', 'none'].includes(str(x.assistance)),
        songSinh: (tc !== '' && str(x.qid) !== tc) || str(x.qid) !== q,
        nguon: str(x.nguon),
      })
      lan.set(k, ds)
    }
  }
  for (const q of goc) {
    const ds = lan.get(q) ?? [],
      doc = (docs.results ?? [])
        .filter((x) => alias.get(q)?.has(qidChuan(x.qid)))
        .map((x) => x.luc),
      tham = ts ?? THAM_SO_GOC
    // 10/11 khối B: lượt đúng theo «Vì sao em sai?» (Tính 1 · Chưa biết cách 2 · Hiểu nhầm 3 ngày); Tính mà đã sai từ 2 lần ⇒ như Chưa biết cách
    const ly = lyDo.get(q),
      theoLy = (l: typeof ly) => phatLaiLoi(ds, doc, ss.has(q) || ds.some((x) => x.songSinh), homNay, thamSoTheoLyDo(tham, l))
    let loiHoc = theoLy(ly)
    if (ly === 'tinh' && lyDoHieuLuc(ly, loiHoc.soLanSai) !== 'tinh') loiHoc = theoLy('cach')
    const sai = ds
      .filter((x) => !x.coHoTro && x.ketQua !== 1)
      .map((x) => Date.parse(x.luc))
      .filter(Number.isFinite)
    if (sai.length)
      ra.set(q, {
        qidChuan: q,
        loiHoc,
        moLuc: Math.min(...sai),
        saiCuoiLuc: Math.max(...sai),
      })
  }
  return ra
}
export async function docTrangThaiLoiDau(
  env: Env,
  sbd: string,
  qid: string,
  homNay: string,
  ts?: ThamSoLuat,
): Promise<TrangThaiLoiDau | null> {
  return (
    (await docNhieuTrangThaiLoiDau(env, sbd, [qid], homNay, ts)).get(
      qidChuan(qid),
    ) ?? null
  )
}
export function trangThaiDayBanDau(
  loi: KetQuaLoi,
  coHocLieu: boolean,
): TrangThaiDay {
  if (['dong', 'khong_loi'].includes(loi.trangThai)) return 'da_tu_sua'
  return coHocLieu ? 'can_chan_doan' : 'thieu_hoc_lieu'
}
