// TOKEN PHỤ HUYNH — giai đoạn MỀM (hợp đồng: docs/token-phu-huynh-1909.md, Code 3). Liên kết `<Pages>/ph?ph=<pass>`: đọc `pass`, lưu vào máy,
// XOÁ `?ph=` khỏi thanh địa chỉ (để pass không nằm trong lịch sử / ảnh chụp), rồi `/ph/xac-dinh` cho tên con + lớp. Có pass thì mọi lệnh phụ huynh
// gửi `{pass}` thay `{sbd}` (mom-api.ts làm việc đó). Không có pass thì mọi thứ chạy như trước bằng SBD.
import { chuLoiAnToan } from './loi-may-chu'
import { layDiaChiMayChu } from './dia-chi-may-chu'

export const KHOA_PH_PASS = 'omr_ph_pass'
// Máy chặn ghi/xóa thì dùng giá trị riêng cho phiên này, kể cả '' sau đăng xuất.
let passPhien: string | undefined
const nguoiTheoDoi = new Set<() => void>()
const baoDoiPass = () => { for (const bao of nguoiTheoDoi) bao() }

/** Theo dõi liên kết trong tab này và thao tác đăng nhập ở tab khác. Không phát mã ra DOM/sự kiện. */
export function theoDoiPass(bao: () => void): () => void {
  nguoiTheoDoi.add(bao)
  const khiLuu = (e: StorageEvent) => { if (e.key === KHOA_PH_PASS || e.key === null) bao() }
  if (typeof window !== 'undefined') window.addEventListener('storage', khiLuu)
  return () => {
    nguoiTheoDoi.delete(bao)
    if (typeof window !== 'undefined') window.removeEventListener('storage', khiLuu)
  }
}

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
  passPhien = pass
  try {
    localStorage.setItem(KHOA_PH_PASS, pass)
    passPhien = undefined
  } catch {
    /* chế độ riêng tư: dùng cho phiên này thôi */
  }
  baoDoiPass()
}
export function docPass(): string {
  if (passPhien !== undefined) return passPhien.trim()
  try {
    return (localStorage.getItem(KHOA_PH_PASS) ?? '').trim()
  } catch {
    return ''
  }
}
export function xoaPass(): void {
  passPhien = ''
  try {
    localStorage.removeItem(KHOA_PH_PASS)
    passPhien = undefined
  } catch {
    /* bỏ qua */
  }
  baoDoiPass()
}

export type KetQuaXacDinh = { ok: true; sbd: string; hoTen: string; lop: string } | { ok: false; error: string }

/** `POST /ph/xac-dinh {pass}` — lỗi trả đúng câu `error` của máy chủ (đã là chữ dành cho phụ huynh). */
export async function xacDinhPhuHuynh(pass: string): Promise<KetQuaXacDinh> {
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), 20_000)
  try {
    const url = await layDiaChiMayChu()
    if (!url) return { ok: false, error: 'Chưa kết nối được máy chủ. Vui lòng thử lại.' }
    const r = await fetch(`${url}/ph/xac-dinh`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pass }), signal: dk.signal })
    const j = (await r.json()) as { ok?: boolean; sbd?: string; hoTen?: string; lop?: string; error?: string }
    if (j.ok && j.sbd) return { ok: true, sbd: String(j.sbd), hoTen: String(j.hoTen ?? ''), lop: String(j.lop ?? '') }
    return { ok: false, error: chuLoiAnToan(j.error, 'Liên kết không dùng được. Anh/chị nhờ Thầy gửi lại liên kết.') }
  } catch {
    return { ok: false, error: 'Chưa kết nối được máy chủ. Vui lòng thử lại.' }
  } finally {
    clearTimeout(hen)
  }
}
