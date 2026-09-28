// ẢNH GAME LỚN DẠNG WEBP (28/09). Atlas tiến hoá (evolution-*-cutout) và tia chiêu thức (spells/*) bản PNG nặng 2,2–3,1 MB/tệp;
// bản .webp (q82, giữ nền trong, cùng kích thước 1536×1024) chỉ 0,4–0,7 MB — cùng hình, tải nhanh gấp ~5 lần trên mạng điện thoại.
// PNG gốc VẪN giữ trong public/ làm đường lui: trình duyệt không đọc được WebP (iOS < 14) thì sự kiện lỗi đổi sang .png.
import type { SyntheticEvent } from 'react'

/** Đường ảnh game: '/than-thu-v2/x.png' → '/than-thu-v2/x.webp'. */
export const anhWebp = (duongPng: string): string => duongPng.replace(/\.png$/, '.webp')

/** onError cho <image>/<img>: WebP hỏng thì đổi về PNG gốc một lần. */
export function doiVePng(e: SyntheticEvent<SVGImageElement | HTMLImageElement>): void {
  const el = e.currentTarget
  const thuocTinh = el instanceof HTMLImageElement ? 'src' : 'href'
  const h = el.getAttribute(thuocTinh) || ''
  if (h.endsWith('.webp')) el.setAttribute(thuocTinh, h.replace(/\.webp$/, '.png'))
}

/** Nạp ảnh game (Image) — WebP trước, hỏng thì PNG. */
export function napAnhGame(duongPng: string, xong?: (anh: HTMLImageElement) => void, loi?: (e: Error) => void): HTMLImageElement {
  const image = new Image()
  let daLui = false
  image.onload = () => xong?.(image)
  image.onerror = () => {
    if (!daLui) {
      daLui = true
      image.src = duongPng
      return
    }
    loi?.(new Error('Chưa tải được ảnh thần thú'))
  }
  image.src = anhWebp(duongPng)
  return image
}
