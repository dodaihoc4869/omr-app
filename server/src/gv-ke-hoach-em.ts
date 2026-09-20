// `POST /gv/ke-hoach-em {sbd}` — LỆNH THẦY, CHỈ ĐỌC: kế hoạch hôm nay của MỘT em cho màn "Học sinh" của app giáo viên.
//
// Vì sao không dùng `/hs/ke-hoach-ngay`: đường ấy LẬP kế hoạch (ghi `ke_hoach_ngay`) và chạy `capNhatExp` (ghi sổ EXP, cộng vào hồ sơ game, sinh `expNhan`/`manhNhan` một lần
// cho em). Thầy mở màn Học sinh mà gọi đường ấy thì NUỐT thông báo EXP của em. Lệnh này TUYỆT ĐỐI KHÔNG ghi: không INSERT, UPDATE, DELETE, không lập kế hoạch, không `capNhatExp`
// (test khoá cả câu SQL lẫn từng byte D1). Chỉ đọc dòng `ke_hoach_ngay` ĐÃ CÓ của hôm nay (cron 00:01 hoặc lượt mở của em đã lập), sổ EXP, thần thú.
//
// Chưa có dòng của hôm nay ⇒ `{ ok:true, chuaCo:true }`. Không có `chuoiDat` (cần lịch sử nhiều ngày), không có `expNhan`/`datNgay` (chỉ có khi em mở app).
import type { Env } from './kieu'
import { docExpHomNay } from './exp-d1'
import { docThanThu, laHocSinhThat } from './ke-hoach-ngay-d1'

const ngayVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const doc = <T>(v: unknown): T => JSON.parse(String(v)) as T

export async function gvKeHoachEm(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const sbd = String(b.sbd ?? '').trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  if (sbd.length > 40 || !(await laHocSinhThat(env, sbd))) return { ok: false, error: 'Không tìm thấy học sinh' }
  const ngay = ngayVn(nowMs)
  let row: Record<string, unknown> | null = null
  try {
    row = await env.DB.prepare(
      'SELECT ngan_sach_json, viec_json, canh_bao_json, ket_qua, la_ngay_nghi, cap_nhat_luc FROM ke_hoach_ngay WHERE sbd = ? AND ngay = ?',
    ).bind(sbd, ngay).first<Record<string, unknown>>()
  } catch {
    row = null // chưa có bảng ke_hoach_ngay (migration chưa chạy): coi như chưa có kế hoạch
  }
  if (!row) return { ok: true, chuaCo: true, ngay }
  let nganSach: unknown, phan: Record<string, unknown>, canhBao: unknown
  try {
    nganSach = doc(row.ngan_sach_json)
    phan = doc<Record<string, unknown>>(row.viec_json)
    canhBao = doc(row.canh_bao_json)
  } catch {
    return { ok: false, error: 'Kế hoạch hôm nay của em đọc không được' }
  }
  return {
    ok: true,
    sbd,
    ngay,
    capNhatLuc: String(row.cap_nhat_luc ?? ''),
    lanNghi: Number(row.la_ngay_nghi) === 1,
    ketQua: row.ket_qua === null || row.ket_qua === undefined ? null : String(row.ket_qua),
    nganSach,
    viec: phan.viec ?? [],
    canhBao,
    quaHan: phan.quaHan ?? [],
    sapToi: phan.sapToi ?? [],
    tai: phan.tai ?? null,
    tienBo: phan.tienBo ?? null,
    tonCu: phan.tonCu ?? [],
    tonCuTong: phan.tonCuTong ?? { soBai: 0, soCau: 0 },
    thanThu: await docThanThu(env, sbd),
    exp: await docExpHomNay(env, sbd, nowMs),
  }
}
