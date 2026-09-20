// TOKEN PHỤ HUYNH — giai đoạn MỀM (hợp đồng: docs/token-phu-huynh-1909.md, Code 3). Liên kết `<Pages>/ph?ph=<pass>`: đọc `pass`, lưu vào máy,
// XOÁ `?ph=` khỏi thanh địa chỉ (để pass không nằm trong lịch sử / ảnh chụp), rồi `/ph/xac-dinh` cho tên con + lớp. Có pass thì mọi lệnh phụ huynh
// gửi `{pass}` thay `{sbd}` (mom-api.ts làm việc đó). Không có pass thì mọi thứ chạy như trước bằng SBD.
import { layDiaChiMayChu } from './dia-chi-may-chu'

export const KHOA_PH_PASS = 'omr_ph_pass'

/** Tách `ph=` khỏi chuỗi truy vấn: trả pass (đã giải mã, đã cắt khoảng trắng; rỗng nếu không có) và chuỗi truy vấn còn lại. Thuần. */
export function tachPass(search: string): { pass: string; con: string } {
  const q = new URLSearchParams(search)
  const pass = (q.get('ph') ?? '').trim()
  q.delete('ph')
  const s = q.toString()
  return { pass, con: s ? `?${s}` : '' }
}

/** Đọc `?ph=` của địa chỉ hiện tại; có thì LƯU và XOÁ khỏi địa chỉ. Trả pass hoặc ''. */
export function nhanPassTuDiaChi(): string {
  try {
    const { pass, con } = tachPass(location.search)
    if (!pass) return ''
    luuPass(pass)
    history.replaceState(history.state, '', `${location.pathname}${con}${location.hash}`)
    return pass
  } catch {
    return ''
  }
}

export function luuPass(pass: string): void {
  try {
    localStorage.setItem(KHOA_PH_PASS, pass)
  } catch {
    /* chế độ riêng tư: dùng cho phiên này thôi */
  }
}
export function docPass(): string {
  try {
    return (localStorage.getItem(KHOA_PH_PASS) ?? '').trim()
  } catch {
    return ''
  }
}
export function xoaPass(): void {
  try {
    localStorage.removeItem(KHOA_PH_PASS)
  } catch {
    /* bỏ qua */
  }
}

export type KetQuaXacDinh = { ok: true; sbd: string; hoTen: string; lop: string } | { ok: false; error: string }

/** `POST /ph/xac-dinh {pass}` — lỗi trả đúng câu `error` của máy chủ (đã là chữ dành cho phụ huynh). */
export async function xacDinhPhuHuynh(pass: string): Promise<KetQuaXacDinh> {
  try {
    const url = await layDiaChiMayChu()
    if (!url) return { ok: false, error: 'Chưa kết nối được máy chủ. Vui lòng thử lại.' }
    const r = await fetch(`${url}/ph/xac-dinh`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pass }) })
    const j = (await r.json()) as { ok?: boolean; sbd?: string; hoTen?: string; lop?: string; error?: string }
    if (j.ok && j.sbd) return { ok: true, sbd: String(j.sbd), hoTen: String(j.hoTen ?? ''), lop: String(j.lop ?? '') }
    return { ok: false, error: j.error || 'Liên kết không dùng được. Anh/chị nhờ Thầy gửi lại liên kết.' }
  } catch {
    return { ok: false, error: 'Chưa kết nối được máy chủ. Vui lòng thử lại.' }
  }
}
