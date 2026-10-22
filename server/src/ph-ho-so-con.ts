// HỒ SƠ CỦA CON CHO PHỤ HUYNH — BA LỆNH CHỈ ĐỌC, CÙNG HỢP ĐỒNG VỚI APP HỌC SINH (thầy 12/10: "App ph cũng phải hiển thị lười chăm đầy đủ như app hs";
// hồ sơ của em phải GIỐNG NHAU ở ba app thầy / em / phụ huynh).
//   `POST /ph/nhip-hoc {pass|sbd}`                  ⇒ `TraLoiNhipHocEm`    (nhip-hoc-kieu.ts) — ĐÚNG `/hs/nhip-hoc`
//   `POST /ph/ho-so-thai-do {pass|sbd}`             ⇒ `TraLoiHoSoThaiDo`   (bai-hang-ngay-kieu.ts) — ĐÚNG `/hs/ho-so-thai-do`
//   `POST /ph/lich-su-lam-cau {pass|sbd, gioiHan?}` ⇒ `TraLoiLichSuLamCau` (lich-su-lam-cau-kieu.ts) — ĐÚNG `/hs/lich-su-lam-cau`
//
// XÁC THỰC: Y HỆT `/ph/con-tong-quan` (ph-con-tong-quan.ts) — `sbdCuaPhuHuynh` + `CHI_NHAN_TOKEN`: có `pass` (liên kết riêng thầy cấp) ⇒ con của
//   liên kết, `sbd` trong thân bị BỎ QUA (liên kết của con A không đọc được con B); liên kết sai / hết hạn / mã học sinh ⇒ NÉM lỗi có chữ (Worker trả
//   `{ ok: false, error }`), KHÔNG rơi xuống SBD trần; không có `pass` ⇒ SBD trần của giai đoạn mềm (như mọi lệnh /ph/* đọc-chỉ hiện nay); SBD không có
//   thật ⇒ ném "Không tìm thấy số báo danh của con.". Việc GHI DUY NHẤT là dòng đếm truy cập của chính hàm xác thực (hoãn qua ctx, ghi `envGoc`).
//   Mọi lượt ĐỌC chạy trên `envDoc` (bản sao gần nhất) như `/ph/con-tong-quan`.
//
// CÙNG SỐ VỚI EM: gọi ĐÚNG lõi bản học sinh (`nhipHocCuaEm` — nhip-hoc-em.ts; `hoSoThaiDoBanHocSinh`, `lichSuLamCauBanHocSinh` — ho-so-em-hs.ts) ⇒
//   không phép tính thứ hai, và MỌI luật bảo mật của bản em áp y nguyên: bỏ lượt còn giấu (embargoed), lượt ca kiểm tra chưa công bố / đã xoá; không
//   đáp án em chọn, không mã câu thật, không ghi chú nội bộ của thầy (danh sách đầy đủ: đầu ho-so-em-hs-loc.ts). Không chọn khoảng ngày (`tu`/`den`
//   trong thân bị bỏ, khoảng mặc định từ 01/10). Khác bản em CHỈ ở câu báo lỗi (xưng "Anh/chị").
import type { Env, ExecutionContext } from './kieu'
import type { TraLoiNhipHocEm } from './nhip-hoc-kieu'
import type { TraLoiHoSoThaiDo } from './bai-hang-ngay-kieu'
import type { TraLoiLichSuLamCau } from './lich-su-lam-cau-kieu'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { CHI_NHAN_TOKEN } from './ph-tat-ca-ve-con'
import { nhipHocCuaEm } from './nhip-hoc-em'
import { hoSoThaiDoBanHocSinh, lichSuLamCauBanHocSinh } from './ho-so-em-hs'

type Row = Record<string, unknown>

export const LOI_NHIP_CON = 'Chưa tải được nhịp học của con. Anh/chị thử lại sau ít phút.'
export const LOI_HO_SO_CON = 'Chưa tải được hồ sơ làm bài của con. Anh/chị thử lại sau ít phút.'
export const LOI_LICH_SU_CON = 'Chưa tải được lịch sử làm câu của con. Anh/chị thử lại sau ít phút.'

/** `POST /ph/nhip-hoc {pass|sbd}` — xem đầu tệp. */
export async function phNhipHoc(envGoc: Env, b: Row, nowMs: number = Date.now(), envDoc: Env = envGoc, ctx?: ExecutionContext): Promise<TraLoiNhipHocEm> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-nhip-hoc', { chiToken: CHI_NHAN_TOKEN, envGhi: envGoc, ctx })
  return nhipHocCuaEm(envDoc, sbd, nowMs, LOI_NHIP_CON)
}

/** `POST /ph/ho-so-thai-do {pass|sbd}` — xem đầu tệp. */
export async function phHoSoThaiDo(envGoc: Env, b: Row, nowMs: number = Date.now(), envDoc: Env = envGoc, ctx?: ExecutionContext): Promise<TraLoiHoSoThaiDo> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-ho-so-thai-do', { chiToken: CHI_NHAN_TOKEN, envGhi: envGoc, ctx })
  return hoSoThaiDoBanHocSinh(envDoc, sbd, nowMs, LOI_HO_SO_CON)
}

/** `POST /ph/lich-su-lam-cau {pass|sbd, gioiHan?}` — xem đầu tệp. `gioiHan` như bản em (mặc định 1000, trần 5000). */
export async function phLichSuLamCau(envGoc: Env, b: Row, envDoc: Env = envGoc, ctx?: ExecutionContext): Promise<TraLoiLichSuLamCau> {
  const { sbd } = await sbdCuaPhuHuynh(envDoc, b, 'ph-lich-su-lam-cau', { chiToken: CHI_NHAN_TOKEN, envGhi: envGoc, ctx })
  return banPhuHuynhLichSu(await lichSuLamCauBanHocSinh(envDoc, sbd, b.gioiHan, LOI_LICH_SU_CON))
}

/** Hồ sơ 6 mức (thầy chốt 22/10, điểm 1): phụ huynh thấy lượt treo là "Máy để treo" nhưng KHÔNG số phút ⇒ bỏ `giayTreo` từng lượt.
 *  GIỮ `treo: 'treo'` — bỏ cả `treo` thì lượt treo 10 phút lại hiện thành "Có thời gian nghĩ". (Mức 6 đã hạ ở lõi bản học sinh.) */
export function banPhuHuynhLichSu(r: TraLoiLichSuLamCau): TraLoiLichSuLamCau {
  if (!r.ok) return r
  return { ...r, lan: r.lan.map((l) => (l.mucLam?.giayTreo === undefined ? l : { ...l, mucLam: (({ giayTreo: _g, ...m }) => m)(l.mucLam) })) }
}
