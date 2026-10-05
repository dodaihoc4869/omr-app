// AI ĐÃ LÀM SAI CÂU NÀY (thầy 05/10: nút X trên tờ chiếu — "hiển thị ra toàn bộ học sinh đã làm sai câu đó, giờ nào, ca nào, làm trong bao lâu").
// Lệnh thầy `POST /gv/ai-sai-cau {qids: string[]}` (các bản cùng nội dung của MỘT câu; ≤ 20). CHỈ ĐỌC sổ `su_kien_hoc`:
//   · lượt TỰ LÀM sai (ket_qua = 0, hoặc bỏ trống ở ca thi), mọi kênh, kể cả câu song sinh (`<qid>~ss0|1`); bỏ sự kiện "đọc lời giải";
//   · mỗi lượt: em · lúc · nơi ("Ca <tên ca>" / Đoàn / Bi-a / Lên bảng / Đầu giờ / BTVN…) · số giây làm (nếu sổ có);
//   · xếp theo em (tên), trong một em mới trước; tối đa 300 lượt. Chỉ thầy (mã bí mật). Đọc theo chỉ mục `idx_skh_qid` (migration-su-kien-hoc-qid-0510.sql).
import type { Env } from './kieu'
import { loaiGameCua } from './dau-gio'
import { tenNguonNgan } from '../../src/lib/dau-gio'

type Row = Record<string, unknown>
const str = (x: unknown) => (x == null ? '' : String(x)).trim()
export const TOI_DA_LUOT_AI_SAI = 300

export interface LuotSai { sbd: string; ten: string; luc: string; noi: string; giay: number | null }

export async function aiSaiCau(env: Env, b: Row): Promise<Row> {
  const qids = [...new Set((Array.isArray(b.qids) ? b.qids : [b.qid]).map(str).filter((q) => q && q.length <= 120))].slice(0, 20)
  if (!qids.length) return { ok: false, error: 'Thiếu mã câu.' }
  const sql = (moi: boolean) => `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.giay, s.luc, d.ho_ten AS ten, c.ten_ca AS ten_ca
      FROM su_kien_hoc s LEFT JOIN danh_sach d ON d.sbd = s.sbd LEFT JOIN ca c ON s.nguon = 'thi' AND c.ma_ca = s.ma_nguon
     WHERE s.qid IN (SELECT value FROM json_each(?1))
       AND (s.ket_qua = 0 OR (s.ket_qua IS NULL AND s.nguon = 'thi'))
       ${moi ? "AND COALESCE(s.purpose, '') <> 'xem_loi_giai'" : ''}
     ORDER BY s.luc DESC LIMIT ${TOI_DA_LUOT_AI_SAI + 1}`
  // Câu gốc + hai câu song sinh (`~ss0`, `~ss1`) — danh sách đúng, để đọc theo chỉ mục (không LIKE).
  const bind = [JSON.stringify(qids.flatMap((q) => [q, `${q}~ss0`, `${q}~ss1`]))]
  let rows: Row[]
  try { rows = (await env.DB.prepare(sql(true)).bind(...bind).all<Row>()).results ?? [] } catch {
    rows = (await env.DB.prepare(sql(false)).bind(...bind).all<Row>()).results ?? []
  }
  const conNua = rows.length > TOI_DA_LUOT_AI_SAI
  rows = rows.slice(0, TOI_DA_LUOT_AI_SAI)
  const loai = await loaiGameCua(env, rows.filter((x) => str(x.nguon) === 'game').map((x) => str(x.ma_nguon))).catch(() => new Map<string, 'doan' | 'bia' | 'dao'>())
  const ds: LuotSai[] = rows.map((x) => {
    const nguon = str(x.nguon)
    const tenCa = str(x.ten_ca)
    const noi = nguon === 'thi' ? (tenCa ? (/^ca\s/i.test(tenCa) ? tenCa : `Ca ${tenCa}`) : 'Ca kiểm tra') : tenNguonNgan(nguon, nguon === 'game' ? (loai.get(str(x.ma_nguon)) ?? 'dao') : null)
    const g = Number(x.giay)
    return { sbd: str(x.sbd), ten: str(x.ten) || str(x.sbd), luc: str(x.luc), noi, giay: Number.isFinite(g) && g > 0 ? Math.round(g) : null }
  })
  ds.sort((a, b2) => a.ten.localeCompare(b2.ten, 'vi') || (a.luc < b2.luc ? 1 : a.luc > b2.luc ? -1 : 0))
  return { ok: true, ds, soEm: new Set(ds.map((x) => x.sbd)).size, conNua }
}
