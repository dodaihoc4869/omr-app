// THẦY CHỮA MỘT CÂU TỪ TỜ CHIẾU (thầy 05/10: nút "Thầy chữa" trên MỌI tờ chiếu — không gọi em lên nữa, câu tính là thầy đã chữa).
// Lệnh thầy `POST /gv/thay-chua-cau {sbd, qid, nguon, maNguon}` cho Gọi lên bảng / Dạy học: ghi ĐÚNG hai thứ như ô "Thầy đã chữa"
// của Kiểm tra đầu giờ (dau-gio.ts `da-chua`) — nhãn ngày vào `thay_da_chua` + mốc dạy lại `srs2_day_lai` (`ghiMocDayLai`: đếm sai
// về 0, câu quay lại kế hoạch hôm sau). Idempotent theo (em, câu, nguồn, mã nguồn). Không ghi điểm, không ghi Đạt/Chưa đạt cho em.
// (Chiến dịch dùng `chua-xong`; đầu giờ dùng `da-chua` — hai đường ấy giữ nguyên.)
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { ngayVn } from './su-kien-hoc'
import { ghiMocDayLai } from './srs2-d1'
import { SQL_TAO_BANG_DAU_GIO } from './dau-gio'

const NGUON_HOP_LE = new Set(['len_bang', 'day_hoc'])
const str = (x: unknown) => (x == null ? '' : String(x)).trim()

export async function thayChuaCau(env: Env, b: Record<string, unknown>, nowMs = Date.now()): Promise<Record<string, unknown>> {
  const sbd = str(b.sbd), qid = str(b.qid), nguon = str(b.nguon), maNguon = str(b.maNguon).slice(0, 80) || '-'
  if (!sbd || !qid) return { ok: false, error: 'Thiếu em hoặc câu.' }
  if (!NGUON_HOP_LE.has(nguon)) return { ok: false, error: 'Nguồn không hợp lệ.' }
  if (qid.length > 200) return { ok: false, error: 'Mã câu quá dài.' }
  await chayDdlMotLan(env, 'dau_gio', SQL_TAO_BANG_DAU_GIO)
  const nay = new Date(nowMs).toISOString()
  const r = await env.DB.prepare('INSERT OR IGNORE INTO thay_da_chua (sbd, qid, nguon, ma_nguon, luc, ngay_vn) VALUES (?,?,?,?,?,?)').bind(sbd, qid, nguon, maNguon, nay, ngayVn(nay)).run()
  if (!Number(r.meta?.changes ?? 0)) return { ok: true, daCoTruoc: true }
  try {
    await ghiMocDayLai(env, sbd, qid, nay)
  } catch {
    return { ok: true, luc: nay, canhBao: 'Đã lưu nhãn "Thầy đã chữa" nhưng chưa ghi được mốc dạy lại.' }
  }
  return { ok: true, luc: nay }
}
