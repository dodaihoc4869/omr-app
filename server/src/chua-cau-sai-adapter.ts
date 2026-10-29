// Một luật đóng lỗi cho các kênh; đọc theo lô để kho sai không tạo N lượt D1.
import type { Env } from './kieu'
import {
  phatLaiLoi,
  tachSongSinh,
  TU_NGAY,
  THAM_SO_GOC,
  type KetQuaLoi,
  type LanLamLoi,
  type ThamSoLuat,
} from './loi-hoc-luat'
import { SQL_LA_LAN_LAM } from './omni-kieu'
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
  const [r, docs, materials, ts] = await Promise.all([
    env.DB.prepare(
      `SELECT s.qid,s.nguon,s.luc,s.ngay_vn,s.ket_qua,s.assistance,json_extract(s.raw_json,'$.tc') AS tc FROM su_kien_hoc s WHERE s.sbd=? AND s.ngay_vn>=? AND ${SQL_LA_LAN_LAM} AND COALESCE(s.visibility,'')<>'embargoed'
   AND (s.qid IN (SELECT value FROM json_each(?)) OR json_extract(s.raw_json,'$.tc') IN (SELECT value FROM json_each(?)))
   AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
   AND (s.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=s.ma_nguon AND ld.sbd=s.sbd AND ld.status='submitted'))`,
    )
      .bind(sbd, TU_NGAY, tat, tcList)
      .all<Row>(),
    env.DB.prepare(
      `SELECT qid,luc FROM loi_giai_hoi WHERE sbd=? AND ${SQL_DAU_HO_TRO_CHUA} AND luc>=?`,
    )
      .bind(sbd, `${TU_NGAY}T00:00:00`)
      .all<{ qid: string; luc: string }>(),
    env.DB.prepare(
      "SELECT DISTINCT qid_chuan AS qid FROM chua_loi_hoc_lieu WHERE qid_chuan IN (SELECT value FROM json_each(?)) AND trang_thai='du_dung'",
    )
      .bind(ds)
      .all<{ qid: string }>(),
    thamSo ? Promise.resolve(thamSo) : docLuatChua(env, sbd),
  ])
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
    const loiHoc = phatLaiLoi(
      ds,
      doc,
      ss.has(q) || ds.some((x) => x.songSinh),
      homNay,
      tham,
    )
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
