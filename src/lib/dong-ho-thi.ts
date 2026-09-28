// ĐỒNG HỒ ĐẾM NGƯỢC TÁCH KHỎI GỐC MÀN (28/09).
//
// Vì sao có tệp này: trước đây màn thi giữ `remaining` (giây còn lại) ngay ở
// GỐC màn và `setRemaining` mỗi giây ⇒ cả đề (~260 công thức KaTeX, ~11 000 nút
// DOM) vẽ lại mỗi giây. Máy chậm (CPU ×4) bận 8,9 s trong mỗi 10 s ngồi yên
// (docs/toi-uu-2809/MAN-THI.md).
//
// Cách làm: một "kho giờ" nhỏ (kiểu store ngoài React) giữ giây còn lại và tự
// nhích mỗi giây. Chỉ các NÚT LÁ hiển thị số giờ (`useGiayConLai`) đổi mỗi
// giây; gốc màn chỉ đăng ký MỐC (`useMocGio`: thường / gấp ≤5' / cuối ≤1' /
// hết giờ) nên chỉ vẽ lại vài lần trong cả ca — đúng lúc đổi màu, khoá/mở
// nút nộp, tự nộp khi hết giờ.
//
// Giờ hiện tại luôn lấy LẠI từ hàm `gio` mỗi nhịp (màn thi truyền gioMayChu()
// — đã hiệu chỉnh theo máy chủ) và trừ vào mốc hết giờ tuyệt đối, KHÔNG cộng
// dồn nhịp ⇒ không trôi giờ, chỉnh giờ máy cũng không lợi.
import { useSyncExternalStore } from 'react'

export interface KhoGio {
  /** Giây còn lại (số thực, có thể âm) tại nhịp gần nhất — ảnh chụp ổn định cho React. */
  conLai(): number
  /** Giây còn lại tính NGAY bây giờ (không đợi nhịp) — dùng trong hàm xử lý sự kiện. */
  conLaiNgay(): number
  /** Đăng ký nghe nhịp. Nhịp chỉ chạy khi có người nghe. */
  dangKy(nghe: () => void): () => void
}

export function taoKhoGio(hetLucMs: number, gio: () => number = Date.now, chuKyMs = 1000): KhoGio {
  const tinh = () => (hetLucMs - gio()) / 1000
  let giaTri = tinh()
  const ds = new Set<() => void>()
  let id: ReturnType<typeof setInterval> | null = null
  const nhip = () => {
    giaTri = tinh()
    for (const f of Array.from(ds)) f()
  }
  return {
    conLai: () => giaTri,
    conLaiNgay: tinh,
    dangKy(nghe) {
      ds.add(nghe)
      if (id === null) {
        // Có thể đã trôi một lúc kể từ khi tạo kho ⇒ cập nhật ngay; React tự so lại
        // ảnh chụp sau khi đăng ký (useSyncExternalStore) nên không cần tự báo.
        giaTri = tinh()
        id = setInterval(nhip, chuKyMs)
      }
      return () => {
        ds.delete(nghe)
        if (ds.size === 0 && id !== null) {
          clearInterval(id)
          id = null
        }
      }
    },
  }
}

const khongDangKy = () => () => {}
const layNull = () => null

/** Giây còn lại, đổi MỖI NHỊP — chỉ dùng ở nút lá hiển thị số giờ. `null` khi không có đồng hồ. */
export function useGiayConLai(kho: KhoGio | null): number | null {
  return useSyncExternalStore(kho ? kho.dangKy : khongDangKy, kho ? kho.conLai : layNull, kho ? kho.conLai : layNull)
}

export type MocGio = 'thuong' | 'gap' | 'cuoi' | 'het' | 'khong-ro'

/** Mốc theo giây còn lại: gấp ≤ 5 phút, cuối ≤ 1 phút, hết ≤ 0. Mốc hết giờ hỏng
 * (NaN) ⇒ 'khong-ro': không gấp, không khoá nộp, không tự nộp — như bản cũ. */
export function mocCua(giay: number): MocGio {
  if (Number.isNaN(giay)) return 'khong-ro'
  if (giay <= 0) return 'het'
  if (giay <= 60) return 'cuoi'
  if (giay <= 300) return 'gap'
  return 'thuong'
}

/** Mốc giờ — chỉ đổi khi qua ngưỡng ⇒ gốc màn đăng ký cái này thay vì giây. */
export function useMocGio(kho: KhoGio | null): MocGio | null {
  const lay = () => (kho ? mocCua(kho.conLai()) : null)
  return useSyncExternalStore(kho ? kho.dangKy : khongDangKy, lay, lay)
}

/** "mm:ss" — y hệt `formatClock` cũ của màn thi (âm ⇒ 00:00). */
export function dinhDangDongHo(tongGiay: number): string {
  const s = Math.max(0, Math.floor(tongGiay))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
