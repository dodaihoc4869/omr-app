// HÀNG CHỮA LỖI — Vòng học khép kín v2, Giai đoạn 3 (thầy 02/10: "đảm bảo tất cả các câu sai phải được xử lý triệt để và thông minh
// hiệu quả" + "chỉ tính từ 29/09 thôi nhé").
//
// Kế hoạch ngày (srs2-d1 `docHoSo2`) có 3 nguồn kéo câu cũ: chiến dịch, câu sai ca ĐÃ công bố, câu sai Lên bảng / đầu giờ. Câu em sai ở
// kênh khác (luyện đề, ôn lại, bài tập, Bi-a, game ngoài chiến dịch…) thì không ai kéo lại. Tệp này thêm NGUỒN THỨ 4: MỌI lượt TỰ LÀM sai
// từ 29/09 ở MỌI kênh ⇒ vào nợ. Rồi áp LUẬT ĐÓNG LỖI CHUNG (`loi-hoc-luat.ts`) lên trạng thái srs2 của câu đó: chưa đủ bằng chứng thì chưa
// thành thạo, lượt làm lại ưu tiên câu SONG SINH. Chỉ đọc sổ — không bảng trạng thái riêng (phát lại mỗi lần đọc, như srs2).
import type { Env } from './kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import type { LanLam, TrangThaiCau } from './srs2-loi'
import { phatLaiLoi, tachSongSinh, TU_NGAY, type KetQuaLoi, type ThamSoLuat } from './loi-hoc-luat'
import { boTroTheoQid } from './song-sinh-game'
import type { BoTro } from './cau-bo-tro'
import { apSongSinh } from './song-sinh-game'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'

type Row = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))

/**
 * NGUỒN THỨ 4: qid → lúc sai TỰ LÀM sớm nhất từ 29/09, mọi kênh. Bỏ: sự kiện đọc lời giải, lượt lướt (OMNI 3), lượt có hỗ trợ, sự kiện bị che (ca chưa công bố —
 * công bố xong mới kéo, như nguồn ca; câu ca thi chỉ tính khi ca ĐÃ công bố — không lộ câu thi). Bỏ trống chỉ tính sai ở ca thi (kênh khác NULL có thể là "chưa làm"). Lỗi đọc ⇒ rỗng.
 */
export async function docQidSaiV2(env: Env, sbd: string): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const sql = (moi: boolean) => `SELECT qid, MIN(luc) AS luc FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ?
      AND (ket_qua = 0 OR (ket_qua IS NULL AND nguon = 'thi')) AND COALESCE(qid, '') <> ''
      AND (nguon <> 'thi' OR EXISTS (SELECT 1 FROM ca c WHERE c.ma_ca = su_kien_hoc.ma_nguon AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
      ${moi ? `AND ${SQL_LA_LAN_LAM} AND COALESCE(assistance, '') <> 'assisted' AND COALESCE(visibility, '') <> 'embargoed'` : ''}
    GROUP BY qid`
  let rows: Row[]
  try { rows = (await env.DB.prepare(sql(true)).bind(sbd, TU_NGAY).all<Row>()).results ?? [] } catch {
    try { rows = (await env.DB.prepare(sql(false)).bind(sbd, TU_NGAY).all<Row>()).results ?? [] } catch { return ra }
  }
  for (const x of rows) {
    const q = tachSongSinh(str(x.qid)).goc, luc = str(x.luc)
    if (q && (!ra.has(q) || luc < ra.get(q)!)) ra.set(q, luc)
  }
  return ra
}

/** Mốc em đọc lời giải (Hỏi thầy) từ 29/09: qid → [ISO]. Lượt làm trong 12 giờ sau mốc đọc không tính tự làm. */
export async function docMocDocLoiGiai(env: Env, sbd: string): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  const r = await env.DB.prepare('SELECT qid, luc FROM loi_giai_hoi WHERE sbd = ? AND luc >= ?').bind(sbd, `${TU_NGAY}T00:00:00`).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) { const q = str(x.qid); ra.set(q, [...(ra.get(q) ?? []), str(x.luc)]) }
  return ra
}

/** LanLam (srs2) → lần làm cho luật v2. Bỏ trống đã quy về sai ở `docLanLam` (dung = false). */
const sangLoi = (x: LanLam) => ({ luc: x.luc, ngayVn: x.ngay, ketQua: (x.dung ? 1 : 0) as 0 | 1, coHoTro: x.coGoiY, songSinh: !!x.songSinh, nguon: x.nguon ?? '' })

/**
 * Áp luật đóng lỗi chung lên trạng thái srs2 của MỘT câu. Câu chưa từng sai tự làm từ 29/09 ⇒ giữ nguyên srs2. Câu là lỗi:
 *   mở / chờ kiểm ⇒ CHƯA thành thạo, hẹn theo luật v2 (song sinh, cách ≥ 3 ngày…); đã đóng ⇒ thành thạo, hẹn mốc duy trì 14/30 ngày;
 *   hết mốc ⇒ giữ hẹn srs2. `catTia` ("Cần thầy dạy lại") giữ của srs2.
 */
export function apLuatChung(t: TrangThaiCau, lan: readonly LanLam[], docLuc: readonly string[], coSongSinh: boolean, homNay: string, ts?: ThamSoLuat): { t: TrangThaiCau; loi: KetQuaLoi } {
  const loi = phatLaiLoi(lan.map(sangLoi), docLuc, coSongSinh, homNay, ts)
  if (loi.trangThai === 'khong_loi') return { t, loi }
  if (loi.trangThai === 'mo' || loi.trangThai === 'cho_kiem') {
    // Hẹn = mốc SỚM hơn giữa srs2 và luật v2: srs2 dồn lịch về hạn chiến dịch (ngày cuối "làm lại câu sai trong ngày", thầy chốt #110) —
    // làm thêm sớm không hại; việc ĐÓNG lỗi vẫn chỉ theo luật v2 (thanhThao = false tới khi đủ bằng chứng).
    const v2 = loi.denHan || homNay
    const hen = t.henOn && t.henOn < v2 ? t.henOn : v2
    return { t: { ...t, laMoi: false, thanhThao: false, henOn: hen, ngayVaoNo: t.ngayVaoNo ?? loi.saiCuoi }, loi }
  }
  if (loi.trangThai === 'dong') return { t: { ...t, laMoi: false, thanhThao: true, henOn: loi.denHan }, loi }
  return { t: { ...t, laMoi: false, thanhThao: true }, loi }
}

/** Chọn song sinh cho lượt tới: xoay vòng ss0 → ss1 → … (đủ `soSongSinh` bản, trần TRAN_SONG_SINH = 4) theo số lần em đã làm song sinh / câu anh em. */
export function chonSongSinh(lan: readonly LanLam[], soSongSinh: number): number {
  if (soSongSinh <= 0) return -1
  return lan.filter((x) => x.songSinh).length % soSongSinh
}

/** Học liệu bổ trợ (song sinh, câu kiểm, nhãn nền) của các câu lỗi — một lượt đọc. */
export async function docBoTroLoi(env: Env, qids: readonly string[]): Promise<Map<string, BoTro>> {
  return boTroTheoQid(env, qids).catch(() => new Map<string, BoTro>())
}

/** Phủ song sinh lên câu đã nạp nếu kế hoạch chọn song sinh cho câu đó; không có / không phủ được ⇒ câu gốc. */
export function phuNeuCan(q: PrivateQuestion, chon: ReadonlyMap<string, number> | undefined, boTro: ReadonlyMap<string, BoTro> | undefined): PrivateQuestion {
  const i = chon?.get(q.qid)
  const ss = i === undefined || i < 0 ? undefined : boTro?.get(q.qid)?.songSinh[i]
  return (ss && apSongSinh(q, ss, i!)) || q
}
