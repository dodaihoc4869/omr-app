// LỚP NỐI "HỒ SƠ LÀM BÀI CỦA EM" (app học sinh — thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học
// nhé"). Chỉ tệp này biết hai lệnh học sinh CHỈ ĐỌC `POST /hs/ho-so-thai-do {token}` và `POST /hs/lich-su-lam-cau {token, gioiHan?}`
// (server/src/ho-so-em-hs.ts). Hình dạng trả về là ĐÚNG hợp đồng hai lệnh thầy ⇒ đọc bằng CÙNG hàm đọc (`docHoSoThaiDo`, `docLichSuLamCau`) và vẽ
// bằng CÙNG tấm `HoSoLamCauEm` (chế độ học sinh). Không ném lỗi: trả `KetQuaLenh` với MỘT câu nói thật (như lệnh thầy).
// Token đi trong thân lệnh (như `/hs/nhip-hoc`); không mã bí mật của thầy, không SBD (máy chủ lấy SBD từ token).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import type { KetQuaLenh } from './goi-lenh-thay'
import { docHoSoThaiDo, type KetQuaHoSoThaiDo } from './bai-hang-ngay-api'
import { docLichSuLamCau, TRAN_GIOI_HAN, type KetQuaLichSuLamCau } from './lich-su-lam-cau-api'
import { TRUONG_AN_HO_SO_HS, TRUONG_AN_LICH_SU_HS } from '../../server/src/an-luoi-hs'

export const DUONG_HO_SO_THAI_DO_EM = '/hs/ho-so-thai-do'
export const DUONG_LICH_SU_LAM_CAU_EM = '/hs/lich-su-lam-cau'
const CHU_CHUA_CO = 'Máy chủ chưa có hồ sơ làm bài cho học sinh — thầy cần cập nhật máy chủ.'
const HAN_GIAY = 20

type Thoat = Extract<KetQuaLenh<never>, { ok: false }>
const thoat = (loai: Thoat['loai'], chu: string): Thoat => ({ ok: false, loai, chu })

/** Gọi một lệnh học sinh (POST JSON có token). 404 ⇒ máy chủ cũ; quá hạn ⇒ chậm; mất mạng; máy chủ từ chối ⇒ giữ NGUYÊN lời máy chủ (đã viết cho em). */
export async function goiLenhEm(duong: string, body: Record<string, unknown>): Promise<KetQuaLenh<Record<string, unknown>>> {
  let url: string
  try {
    url = await layDiaChiMayChu()
  } catch {
    return thoat('mang', 'Chưa đọc được cấu hình máy chủ.')
  }
  if (!url) return thoat('mang', 'Chưa kết nối được máy chủ.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${String(url).replace(/\/+$/, '')}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: dk.signal })
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return thoat('cham', 'Máy chủ trả lời chậm — em thử lại sau ít phút.')
    return thoat('mang', 'Không nối được máy chủ.')
  } finally {
    clearTimeout(hen)
  }
  if (res.status === 404) return thoat('chua_co_lenh', CHU_CHUA_CO)
  let j: Record<string, unknown>
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    return thoat('khong_doc_duoc', 'Máy chủ trả lời không đọc được.')
  }
  if (!res.ok || j.ok !== true) return thoat('tu_choi', String(j.error || 'Máy chủ chưa trả hồ sơ — em thử lại sau ít phút.'))
  return { ok: true, du: j }
}

// 26/10 (thầy: hệ phát hiện lười CHỈ thầy + phụ huynh xem): máy chủ mới đã bỏ các trường dưới đây khỏi bản em (server/src/an-luoi-hs.ts). Máy chủ CŨ
// còn gửi ⇒ bỏ ngay ở đây, TRƯỚC khi đọc (không vào bộ nhớ app em). Khung bắt buộc của bộ đọc chung (`ketLuan`, `tinHieu`) điền TRUNG TÍNH: nhãn
// «Chưa đủ dữ liệu» không lý do, không tín hiệu — tấm chế độ học sinh không vẽ hai phần này.
const KET_LUAN_TRUNG_TINH = { nhan: 'chua-du-du-lieu', lyDo: [] } as const
function boKhoa(o: Record<string, unknown>, ds: readonly string[]): Record<string, unknown> {
  const ra = { ...o }
  for (const k of ds) delete ra[k]
  return ra
}
/** Thân `/hs/ho-so-thai-do` ⇒ khung bản em (thuần). */
export function hoSoThaiDoKhungHs(du: Record<string, unknown>): Record<string, unknown> {
  const r = boKhoa(du, TRUONG_AN_HO_SO_HS)
  const pb = Array.isArray(du.phanBoGiay) ? du.phanBoGiay.map((g) => (g && typeof g === 'object' ? boKhoa(g as Record<string, unknown>, ['soNhanh']) : g)) : du.phanBoGiay
  return { ...r, ketLuan: KET_LUAN_TRUNG_TINH, tinHieu: [], phanBoGiay: pb }
}
/** Thân `/hs/lich-su-lam-cau` ⇒ khung bản em: không Mức làm ở tổng, 6 mức, từng lượt (thuần). */
export function lichSuKhungHs(du: Record<string, unknown>): Record<string, unknown> {
  const r = boKhoa(du, TRUONG_AN_LICH_SU_HS)
  return Array.isArray(du.lan) ? { ...r, lan: du.lan.map((l) => (l && typeof l === 'object' ? boKhoa(l as Record<string, unknown>, ['mucLam']) : l)) } : r
}

/** Hồ sơ thái độ (số đếm, lịch, số giây, Câu đúng / Câu đã ôn) của CHÍNH em — bản em, không nhãn / tín hiệu / nhóm / bậc. */
export async function layHoSoThaiDoEm(token: string): Promise<KetQuaLenh<KetQuaHoSoThaiDo>> {
  if (!token) return thoat('tu_choi', 'Em đăng nhập lại để xem hồ sơ làm bài.')
  const r = await goiLenhEm(DUONG_HO_SO_THAI_DO_EM, { token })
  if (!r.ok) return r
  const kq = docHoSoThaiDo(hoSoThaiDoKhungHs(r.du))
  return kq ? { ok: true, du: kq } : thoat('khong_doc_duoc', 'Máy chủ trả hồ sơ không đúng dạng.')
}

/** Lịch sử làm câu (mọi lượt đã được xem kết quả · câu từng sai · số giây) của CHÍNH em. `gioiHan` như lệnh thầy (trần 5000). */
export async function layLichSuLamCauEm(token: string, gioiHan?: number): Promise<KetQuaLenh<KetQuaLichSuLamCau>> {
  if (!token) return thoat('tu_choi', 'Em đăng nhập lại để xem hồ sơ làm bài.')
  const body: Record<string, unknown> = { token }
  if (gioiHan) body.gioiHan = Math.min(TRAN_GIOI_HAN, Math.max(1, Math.round(gioiHan)))
  const r = await goiLenhEm(DUONG_LICH_SU_LAM_CAU_EM, body)
  if (!r.ok) return r
  const kq = docLichSuLamCau(lichSuKhungHs(r.du))
  return kq ? { ok: true, du: kq } : thoat('khong_doc_duoc', 'Máy chủ trả lịch sử làm câu không đúng dạng.')
}

/** Nguồn dữ liệu cho tấm `HoSoLamCauEm` ở chế độ học sinh (prop `nguon`). Nơi dùng giữ một nguồn cho mỗi token (useMemo). */
export function taoNguonHoSoEm(token: string): { hoSoThaiDo(): Promise<KetQuaLenh<KetQuaHoSoThaiDo>>; lichSu(gioiHan?: number): Promise<KetQuaLenh<KetQuaLichSuLamCau>> } {
  return { hoSoThaiDo: () => layHoSoThaiDoEm(token), lichSu: (gioiHan) => layLichSuLamCauEm(token, gioiHan) }
}

