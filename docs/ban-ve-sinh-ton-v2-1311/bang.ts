// BẢN VẼ «SINH TỒN · TRANG VỞ» (13/11) — bảng màu. KHÔNG mã màu thô: mọi màu đọc từ token có sẵn của app học sinh (tokens.css, trong-hs-mau.css dưới
// :root[data-trong='hs']) lúc chạy; sắc mới chỉ PHA từ token (đúng luật màu 05/10). NỀN CHUẨN DUOLINGO (thầy 13/11 «cho nền chuẩn doligo nhé»): mặt trang = --tr-nen
// (sáng trắng · tối xanh than #131f24), dòng kẻ = --tr-vien, ngoài trang = --tr-mat-2 / --tr-vien-2, nét = --tr-chu; chỉ lề đỏ và đồ vật mang màu riêng.
export type Rgb = [number, number, number]

const thu = document.createElement('i')
document.documentElement.appendChild(thu)
/** Đọc một biến màu CSS ra [r, g, b] (trình duyệt tự giải mã, kể cả hex hay rgb). */
export function doc(bien: string): Rgb {
  thu.style.color = `var(${bien})`
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(getComputedStyle(thu).color)
  if (!m) throw new Error(`Thiếu biến màu ${bien}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
export const pha = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
export const mau = (c: Rgb, a = 1): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`

export interface Bang {
  toi: boolean
  /** Mặt trang (= nền Duolingo) · ngoài trang. */
  giay: Rgb; ban: Rgb
  /** Dòng kẻ ô li mảnh · đậm · lề đỏ. */
  ke: Rgb; keDam: Rgb; le: Rgb
  /** Nét viền: mực bút bi (sáng) / phấn trắng (tối). */
  muc: Rgb
  /** Bóng đổ của đồ vật nằm trên trang. */
  bong: Rgb; bongA: number
  /** Bốn đội: Na · K · Cu · Ca (giữ nguyên token đội). */
  doi: Rgb[]
  sao: Rgb; tin: Rgb; sai: Rgb; dung: Rgb; hs: Rgb; chu: Rgb; chu3: Rgb
}

export function docBang(): Bang {
  const toi = matchMedia('(prefers-color-scheme: dark)').matches
  const sao = doc('--tr-sao'), tin = doc('--tr-tin'), sai = doc('--tr-sai'), dung = doc('--tr-dung'), hs = doc('--tr-hs'), chu = doc('--tr-chu'), chu3 = doc('--tr-chu-3')
  const doi = ['--p-cam', '--p-tim-2', '--p-xanh', '--p-do'].map(doc)
  const nen = doc('--tr-nen'), vien = doc('--tr-vien')
  if (toi) return { toi, giay: nen, ban: doc('--tr-vien-2'), ke: pha(nen, vien, 0.32), keDam: pha(nen, vien, 0.62), le: pha(nen, sai, 0.42), muc: chu, bong: [0, 0, 0], bongA: 0.32, doi, sao, tin, sai, dung, hs, chu, chu3 }
  return { toi, giay: nen, ban: doc('--tr-mat-2'), ke: pha(nen, vien, 0.5), keDam: vien, le: pha(nen, sai, 0.45), muc: chu, bong: chu, bongA: 0.11, doi, sao, tin, sai, dung, hs, chu, chu3 }
}
