// LỚP NỐI "NHỊP HỌC + HỒ SƠ LÀM BÀI CỦA CON" (app phụ huynh — đợt 16, thầy 12/10: "App ph cũng phải hiển thị lười chăm đầy đủ như app hs" ·
// "Đồng bộ cho cả app hs gv và ph nhé"). Chỉ tệp này biết ba lệnh phụ huynh CHỈ ĐỌC (làn máy chủ D dựng, hình dạng trả về ĐÚNG như ba lệnh học sinh):
//   POST /ph/nhip-hoc          (= /hs/nhip-hoc,          hợp đồng `KetQuaNhipHocEm`  — đọc bằng `docNhipHocEm`)
//   POST /ph/ho-so-thai-do     (= /hs/ho-so-thai-do,     hợp đồng `KetQuaHoSoThaiDo` — đọc bằng `docHoSoThaiDo`)
//   POST /ph/lich-su-lam-cau   (= /hs/lich-su-lam-cau,   hợp đồng `KetQuaLichSuLamCau` — đọc bằng `docLichSuLamCau`, `gioiHan?` như lệnh thầy)
// DANH TÍNH: y hệt lệnh `/ph/con-tong-quan` (src/lib/ph-v3/api.ts) — mã liên kết riêng `{ pass }` (docPass) nếu máy đang lưu, không thì SBD trần `{ sbd }`.
// Không ném lỗi: trả `KetQuaLenh` với MỘT câu nói thật cho phụ huynh (404 = máy chủ chưa có lệnh ⇒ "thầy cần cập nhật máy chủ"); màn hiện "Chưa tải
// được …" + nút tải lại, KHÔNG số bịa. Nguồn `taoNguonHoSoCon` cắm thẳng vào tấm `HoSoLamCauEm` (prop `nguon`, chế độ 'phu-huynh').
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docPass } from './ph-token'
import type { KetQuaLenh } from './goi-lenh-thay'
import { docHoSoThaiDo, type KetQuaHoSoThaiDo } from './bai-hang-ngay-api'
import { docLichSuLamCau, TRAN_GIOI_HAN, type KetQuaLichSuLamCau } from './lich-su-lam-cau-api'
import { docNhipHocEm, type KetQuaNhipHocEm } from './nhip-hoc-em'

export const DUONG_NHIP_HOC_CON = '/ph/nhip-hoc'
export const DUONG_HO_SO_THAI_DO_CON = '/ph/ho-so-thai-do'
export const DUONG_LICH_SU_LAM_CAU_CON = '/ph/lich-su-lam-cau'
export const CHU_CHUA_CO_LENH_CON = 'Máy chủ chưa có hồ sơ làm bài cho phụ huynh — thầy cần cập nhật máy chủ.'
const HAN_GIAY = 20

type Thoat = Extract<KetQuaLenh<never>, { ok: false }>
const thoat = (loai: Thoat['loai'], chu: string): Thoat => ({ ok: false, loai, chu })

/** Thân lệnh danh tính phụ huynh: mã liên kết riêng nếu có, không thì SBD trần (như `/ph/con-tong-quan`). Không có gì ⇒ null. */
export function danhTinhPhuHuynh(sbd: string): { pass: string } | { sbd: string } | null {
  const pass = docPass()
  if (pass) return { pass }
  const s = sbd.trim()
  return s ? { sbd: s } : null
}

/** Gọi một lệnh phụ huynh (POST JSON). 404 ⇒ máy chủ cũ; quá hạn ⇒ chậm; mất mạng; máy chủ từ chối ⇒ giữ lời máy chủ (đã viết cho người đọc). */
async function goiLenhCon(duong: string, sbd: string, them: Record<string, unknown> = {}): Promise<KetQuaLenh<Record<string, unknown>>> {
  const danhTinh = danhTinhPhuHuynh(sbd)
  if (!danhTinh) return thoat('tu_choi', 'Anh/chị mở lại liên kết riêng thầy gửi hoặc nhập số báo danh của con.')
  let url: string
  try {
    url = await layDiaChiMayChu()
  } catch {
    return thoat('mang', 'Chưa đọc được cấu hình máy chủ.')
  }
  if (!url) return thoat('mang', 'Chưa kết nối được máy chủ. Anh/chị kiểm tra mạng rồi thử lại.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  try {
    const res = await fetch(`${String(url).replace(/\/+$/, '')}${duong}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...danhTinh, ...them }),
      signal: dk.signal,
    })
    if (res.status === 404) return thoat('chua_co_lenh', CHU_CHUA_CO_LENH_CON)
    let j: Record<string, unknown> | null
    try {
      j = (await res.json()) as Record<string, unknown> | null
    } catch (e) {
      // Thời hạn bao gồm cả thân phản hồi: headers về chưa có nghĩa JSON đã tải xong.
      if (dk.signal.aborted) throw e
      return thoat('khong_doc_duoc', 'Máy chủ trả lời không đọc được.')
    }
    if (!j || typeof j !== 'object') return thoat('khong_doc_duoc', 'Máy chủ trả lời không đọc được.')
    if (!res.ok || j.ok !== true) {
      const e = typeof j.error === 'string' ? j.error.replace(/\s+/g, ' ').trim() : ''
      return thoat('tu_choi', e && e.length <= 240 ? e : 'Máy chủ chưa trả số liệu — anh/chị thử lại sau ít phút.')
    }
    return { ok: true, du: j }
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return thoat('cham', 'Máy chủ trả lời chậm — anh/chị thử lại sau ít phút.')
    return thoat('mang', 'Chưa kết nối được máy chủ. Anh/chị kiểm tra mạng rồi thử lại.')
  } finally {
    clearTimeout(hen)
  }
}

/** Nhịp học của con (nhóm Chăm / Chưa đều / Lười / Chưa đủ dữ liệu, dải ô ngày từ 01/10, việc tiếp) — CÙNG hợp đồng bảng của em. */
export async function layNhipHocCon(sbd: string): Promise<KetQuaLenh<KetQuaNhipHocEm>> {
  const r = await goiLenhCon(DUONG_NHIP_HOC_CON, sbd)
  if (!r.ok) return r
  const kq = docNhipHocEm(r.du)
  return kq ? { ok: true, du: kq } : thoat('khong_doc_duoc', 'Máy chủ trả nhịp học không đúng dạng.')
}

/** Hồ sơ thái độ (nhóm, lý do bằng số, lịch ngày, tín hiệu, Câu đúng / Câu đã ôn) của con. */
export async function layHoSoThaiDoCon(sbd: string): Promise<KetQuaLenh<KetQuaHoSoThaiDo>> {
  const r = await goiLenhCon(DUONG_HO_SO_THAI_DO_CON, sbd)
  if (!r.ok) return r
  const kq = docHoSoThaiDo(r.du)
  return kq ? { ok: true, du: kq } : thoat('khong_doc_duoc', 'Máy chủ trả hồ sơ không đúng dạng.')
}

/** Lịch sử làm câu (lượt đã được xem kết quả · câu từng sai · số giây) của con. `gioiHan` như lệnh thầy (trần 2000). */
export async function layLichSuLamCauCon(sbd: string, gioiHan?: number): Promise<KetQuaLenh<KetQuaLichSuLamCau>> {
  const them: Record<string, unknown> = {}
  if (gioiHan) them.gioiHan = Math.min(TRAN_GIOI_HAN, Math.max(1, Math.round(gioiHan)))
  const r = await goiLenhCon(DUONG_LICH_SU_LAM_CAU_CON, sbd, them)
  if (!r.ok) return r
  const kq = docLichSuLamCau(r.du)
  return kq ? { ok: true, du: kq } : thoat('khong_doc_duoc', 'Máy chủ trả lịch sử làm câu không đúng dạng.')
}

/** Nguồn dữ liệu cho tấm `HoSoLamCauEm` ở chế độ phụ huynh (prop `nguon`). Nơi dùng giữ MỘT nguồn cho mỗi SBD (useMemo). */
export function taoNguonHoSoCon(sbd: string): { hoSoThaiDo(): Promise<KetQuaLenh<KetQuaHoSoThaiDo>>; lichSu(gioiHan?: number): Promise<KetQuaLenh<KetQuaLichSuLamCau>> } {
  return { hoSoThaiDo: () => layHoSoThaiDoCon(sbd), lichSu: (gioiHan) => layLichSuLamCauCon(sbd, gioiHan) }
}
