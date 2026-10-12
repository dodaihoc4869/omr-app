// "HỒ SƠ LÀM BÀI CỦA EM" — HAI LỆNH HỌC SINH CHỈ ĐỌC (thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học
// nhé"). Em bấm bảng "Nhịp học của em" ⇒ tấm `HoSoLamCauEm` (đúng tấm thầy mở ở Hôm nay › Nhịp học) ở chế độ học sinh, đọc hai lệnh:
//   `POST /hs/ho-so-thai-do {token}`            ⇒ hợp đồng `KetQuaHoSoThaiDo` (bai-hang-ngay-kieu.ts)
//   `POST /hs/lich-su-lam-cau {token, gioiHan?}` ⇒ hợp đồng `KetQuaLichSuLamCau` (lich-su-lam-cau-kieu.ts)
//
// XÁC THỰC: đúng cơ chế token học sinh như `/hs/nhip-hoc` (`gameIdentity` — chữ ký + hạn + mật khẩu còn khớp; mã phụ huynh bị từ chối). SBD LẤY TỪ
// TOKEN, `sbd` trong thân lệnh bị BỎ QUA ⇒ em chỉ đọc được của CHÍNH MÌNH. Em không chọn khoảng ngày (bỏ `tu` / `den`: khoảng mặc định từ 01/10).
// Không ghi, không DDL; chạy trên `envDoc` như `/hs/nhip-hoc`.
//
// CÙNG SỐ VỚI THẦY: gọi ĐÚNG lõi của hai lệnh thầy (`hoSoThaiDoCuaEm` — bai-hang-ngay.ts, `lichSuLamCauCuaEm` — lich-su-lam-cau.ts) với
// `nguoiDoc = 'hoc-sinh'`; không phép tính thứ hai. Khác thầy CHỈ ở các trường bảo mật liệt kê đầu `ho-so-em-hs-loc.ts` (lượt ca chưa công bố,
// đáp án em chọn, mã câu thật, ghi chú nội bộ).
// Lỗi: token hỏng ⇒ "Em đăng nhập lại…"; lõi báo lỗi / ném ⇒ MỘT câu nói thật cho em (không lộ lời máy chủ nội bộ).
import type { Env } from './kieu'
import type { TraLoiHoSoThaiDo } from './bai-hang-ngay-kieu'
import type { TraLoiLichSuLamCau } from './lich-su-lam-cau-kieu'
import { gameIdentity } from './game-v2-auth'
import { hoSoThaiDoCuaEm } from './bai-hang-ngay'
import { lichSuLamCauCuaEm } from './lich-su-lam-cau'
import { banHocSinhHoSoThaiDo, banHocSinhLichSu } from './ho-so-em-hs-loc'

type Row = Record<string, unknown>

export const CAN_DANG_NHAP_HO_SO = 'Em đăng nhập lại để xem hồ sơ làm bài.'
export const LOI_HO_SO_EM = 'Chưa tải được hồ sơ làm bài của em. Em thử lại sau ít phút.'
export const LOI_LICH_SU_EM = 'Chưa tải được lịch sử làm câu của em. Em thử lại sau ít phút.'

/** SBD của chính em từ token; token thiếu / sai / hết hạn / mã phụ huynh ⇒ null. */
async function sbdTuToken(env: Env, b: Row): Promise<string | null> {
  try {
    const sbd = await gameIdentity(env, b)
    return sbd && sbd.length <= 40 ? sbd : null
  } catch {
    return null
  }
}

/** `POST /hs/ho-so-thai-do {token}` — xem đầu tệp. */
export async function hsHoSoThaiDo(env: Env, b: Row, nowMs = Date.now()): Promise<TraLoiHoSoThaiDo> {
  const sbd = await sbdTuToken(env, b)
  if (!sbd) return { ok: false, error: CAN_DANG_NHAP_HO_SO }
  try {
    const r = await hoSoThaiDoCuaEm(env, sbd, {}, nowMs, 'hoc-sinh')
    return r.ok ? banHocSinhHoSoThaiDo(r) : { ok: false, error: LOI_HO_SO_EM }
  } catch (e) {
    console.error('[ho-so-em-hs] hồ sơ thái độ lỗi (báo em thử lại):', e instanceof Error ? e.message : e)
    return { ok: false, error: LOI_HO_SO_EM }
  }
}

/** `POST /hs/lich-su-lam-cau {token, gioiHan?}` — xem đầu tệp. `gioiHan` như lệnh thầy (mặc định 1000, trần 2000). */
export async function hsLichSuLamCau(env: Env, b: Row): Promise<TraLoiLichSuLamCau> {
  const sbd = await sbdTuToken(env, b)
  if (!sbd) return { ok: false, error: CAN_DANG_NHAP_HO_SO }
  try {
    const r = await lichSuLamCauCuaEm(env, sbd, b.gioiHan, 'hoc-sinh')
    return r.ok ? banHocSinhLichSu(r) : { ok: false, error: LOI_LICH_SU_EM }
  } catch (e) {
    console.error('[ho-so-em-hs] lịch sử làm câu lỗi (báo em thử lại):', e instanceof Error ? e.message : e)
    return { ok: false, error: LOI_LICH_SU_EM }
  }
}
