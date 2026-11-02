// MẢNH NẠP LƯỜI của bộ hiệu ứng ăn mừng (tên tệp = tên mảnh `hieu-ung-an-mung-*.js` ⇒ globIgnores `hieu-ung-*` của service worker: kho chạy-lúc, không
// precache). Chỉ được nạp qua src/lib/hieu-ung/nap.ts (import động) — KHÔNG nhập tĩnh từ đâu khác (sẽ kéo mã vẽ vào mảnh màn).
// Một cửa `chay(loai, dat)`: chọn chế độ của máy (đầy đủ / gọn / tĩnh), mở một phiên trên lớp phủ dùng chung, chạy hiệu ứng, trả hàm huỷ.
import type { DatAnMung, LoaiAnMung } from './kieu'
import { cheDoMayNay } from './nap'
import { moPhien, type Phien } from './bo-chay'
import { set } from './set'
import { dung, sai } from './dung-sai'
import { nguyenTu } from './nguyen-tu'
import { lua } from './lua'
import { chang } from './chang'
import { ruong } from './ruong'
import { not } from './am-thanh-an-mung'

const BANG: { [K in LoaiAnMung]: (ph: Phien, d: DatAnMung[K]) => void } = { set, dung, sai, 'nguyen-tu': nguyenTu, lua, chang, ruong }

export function chay<K extends LoaiAnMung>(loai: K, dat: DatAnMung[K]): () => void {
  if (loai === 'nguyen-tu') { // `onXong` chắc chắn chỉ MỘT lần (nơi gọi cộng số)
    const d0 = dat as DatAnMung['nguyen-tu'], goc = d0.onXong
    let da = false
    dat = { ...d0, onXong: () => { if (!da) { da = true; goc?.() } } } as DatAnMung[K]
  }
  let ph: Phien | null = null
  try {
    ph = moPhien(cheDoMayNay())
    BANG[loai](ph, dat)
    const p = ph
    return () => p.huy()
  } catch {
    ph?.huy()
    if (loai === 'nguyen-tu') (dat as DatAnMung['nguyen-tu']).onXong?.()
    return () => {}
  }
}

/** Em vừa bật «Tiếng ăn mừng» ở menu ⇒ kêu thử hai nốt chuông ngắn (tự im nếu «Âm thanh» chung đang tắt). */
export function thuTieng(): void {
  not(784, 0, 0.12, { kieu: 'triangle', v: 0.16 }); not(1175, 0.08, 0.3, { kieu: 'triangle', v: 0.16 })
}
