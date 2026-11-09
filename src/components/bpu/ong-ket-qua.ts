// BÌNH PHẢN ỨNG — ỐNG NGHIỆM KẾT QUẢ + MÀU ĐỘI (tách khỏi BangBinhPhanUng.tsx 09/11 vì cổng cỡ tệp). Hàm thuần, không JSX.
import { DOI_BPU, type ViewBang } from '../../lib/bpu/phong'
import type { OngVe, VeBang } from './bang-ve'

export const mauDoi = (d: number) => `var(${DOI_BPU[d]?.mau ?? '--tr-tin'})`
/** Ống «chibi» (thầy 07/11 «ống thí nghiệm làm ngắn lại, chibi hơn»): miệng 300 → đáy 590 (cũ 150 → 640), rộng 104. Nhãn dưới đáy. */
const ONG_GON = { top: 300, day: 590 }
export const HANG_DS = [{ top: 150, day: 350 }, { top: 425, day: 625 }] as const
const X_DS = (i: number) => 1340 + i * 140

/** Ống nghiệm theo số em chọn: Trắc nghiệm A–D; Đúng–sai 4 cặp Đ/S; Trả lời ngắn 3 đáp số hay gặp + «Khác». */
export function dungOng(l: NonNullable<ViewBang['luot']>, vb: VeBang): OngVe[] {
  const chon = Object.values(l.chon ?? {}), dung = (l.dung ?? '').toUpperCase(), M = vb.mau, mauPa = [M.tin, M.sao, M.chuY, M.hs]
  if (l.phan === 'I') { const dem = 'ABCD'.split('').map((c) => chon.filter((x) => x.toUpperCase() === c).length), max = Math.max(1, ...dem); return dem.map((d, i) => ({ x: 1300 + i * 152, w: 104, mau: mauPa[i]!, dung: 'ABCD'[i] === dung, h: d / max, ...ONG_GON })) }
  if (l.phan === 'II') {
    const ra: OngVe[] = []
    // HAI HÀNG (thầy 07/11 «đúng sai tách làm 2 ống nghiệm trên dưới cho đỡ rối»): hàng trên = số em chọn Đúng, hàng dưới = chọn Sai; cột = ý a–d.
    for (let i = 0; i < 4; i++) { const soD = chon.filter((x) => x.toUpperCase()[i] === 'D').length, n = Math.max(1, chon.length); ra.push({ x: X_DS(i), w: 84, mau: M.tin, dung: dung[i] === 'D', h: soD / n, ...HANG_DS[0] }) }
    for (let i = 0; i < 4; i++) { const soS = chon.filter((x) => x.toUpperCase()[i] === 'S').length, n = Math.max(1, chon.length); ra.push({ x: X_DS(i), w: 84, mau: M.chuY, dung: dung[i] === 'S', h: soS / n, ...HANG_DS[1] }) }
    return ra
  }
  const nhom = nhomTln(l), max = Math.max(1, ...nhom.map((x) => x.dem))
  return nhom.map((x, i) => ({ x: 1300 + i * 152, w: 104, mau: mauPa[i]!, dung: x.dung, h: x.dem / max, ...ONG_GON }))
}
function nhomTln(l: NonNullable<ViewBang['luot']>) {
  const dem = new Map<string, number>(), kq = l.ketQua ?? {}
  let soDung = 0
  for (const [s, c] of Object.entries(l.chon ?? {})) { if (kq[s]?.dung) { soDung++; continue } const k = c.trim().replace('.', ','); dem.set(k, (dem.get(k) ?? 0) + 1) }
  const sai = [...dem.entries()].sort((a, b) => b[1] - a[1])
  return [{ nhan: String(l.dung ?? ''), dem: soDung, dung: true }, ...sai.slice(0, 2).map(([n, d]) => ({ nhan: n, dem: d, dung: false })), { nhan: 'Khác', dem: sai.slice(2).reduce((s, x) => s + x[1], 0), dung: false }]
}
export function nhanOng(l: NonNullable<ViewBang['luot']>, vb: VeBang | null): { x: number; y?: number; gon?: boolean; nhan: string; dem: number; dung: boolean }[] {
  const chon = Object.values(l.chon ?? {}), dung = (l.dung ?? '').toUpperCase()
  if (l.phan === 'I') return 'ABCD'.split('').map((c, i) => ({ x: 1300 + i * 152, y: ONG_GON.day - 128 + 14, nhan: c, dem: chon.filter((x) => x.toUpperCase() === c).length, dung: c === dung }))
  if (l.phan === 'II') return ['D', 'S'].flatMap((k, h) => [0, 1, 2, 3].map((i) => ({ x: X_DS(i), y: HANG_DS[h]!.day - 128 + 8, gon: true, nhan: `${'abcd'[i]})`, dem: chon.filter((x) => x.toUpperCase()[i] === k).length, dung: dung[i] === k })))
  void vb
  return nhomTln(l).map((x, i) => ({ x: 1300 + i * 152, y: ONG_GON.day - 128 + 14, ...x }))
}

