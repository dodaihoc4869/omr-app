// XEM LẠI LIVE — ĐỒNG HỒ PHÁT (đặc tả mục 4.9). Thuần: không DOM; mọi «bây giờ» do nơi gọi truyền vào (ms, `performance.now()`).
// · Đồng hồ CHỦ là `audio.currentTime`. Trình duyệt chỉ cập nhật con số ấy vài chục lần mỗi giây (iPhone thưa hơn) ⇒ `taoLamMuot` nội suy giữa hai lần
//   cập nhật để nét chạy đều ở mọi khung hình; tiếng đứng (đang đệm) quá `TRAN_UOC_MS` thì nét cũng đứng, không chạy trước tiếng.
// · Buổi không có tiếng (`coTieng: false`) ⇒ `taoDongHoRieng`: đồng hồ tự chạy theo tốc độ phát.
// · «Bỏ khoảng lặng»: tới một khoảng lặng của chỉ mục thì nhảy sang cuối khoảng (`nhayLang`).
// · Hàng phát = các đoạn nối nhau: `viTriHang` / `tuViTriHang` đổi giữa (đoạn, giờ trên trục tiếng) và mili-giây trên thanh tua.
import type { KhoangMs } from '../../../lib/live/xem-lai-kieu'

export interface Khoang { t0: number; t1: number }
/** Chỉ nhảy khi còn ít nhất chừng này để lược (khỏi nhảy lắt nhắt ở mép khoảng). */
export const LUOC_IT_NHAT_MS = 800
export const TRAN_UOC_MS = 250

/** `t` đang nằm trong một khoảng lặng ⇒ mốc nhảy tới (cuối khoảng, không vượt cuối đoạn); không ⇒ null. */
export function nhayLang(t: number, lang: readonly KhoangMs[], doan: Khoang): number | null {
  for (const k of lang) {
    const a = k[0], b = Math.min(k[1], doan.t1)
    if (t >= a && t < b) return b - t >= LUOC_IT_NHAT_MS ? b : null
    if (a > t) break // chỉ mục xếp theo giờ
  }
  return null
}
/** Tổng khoảng lặng nằm trong một đoạn (ms) — chữ «bỏ khoảng lặng còn m:ss». */
export function tongLang(lang: readonly KhoangMs[], doan: Khoang): number {
  let s = 0
  for (const k of lang) { const a = Math.max(k[0], doan.t0), b = Math.min(k[1], doan.t1); if (b - a >= LUOC_IT_NHAT_MS) s += b - a }
  return s
}

export const tongHang = (hang: readonly Khoang[]): number => hang.reduce((s, d) => s + Math.max(0, d.t1 - d.t0), 0)
/** Mili-giây đã qua trên thanh tua khi đang ở đoạn `vt`, giờ `t` (trục tiếng). */
export function viTriHang(hang: readonly Khoang[], vt: number, t: number): number {
  let s = 0
  for (let i = 0; i < vt && i < hang.length; i++) s += Math.max(0, hang[i]!.t1 - hang[i]!.t0)
  const d = hang[vt]
  return d ? s + Math.min(Math.max(0, t - d.t0), d.t1 - d.t0) : s
}
/** Ngược lại: mili-giây trên thanh tua ⇒ (đoạn, giờ trên trục tiếng). Quá cuối ⇒ cuối đoạn cuối. */
export function tuViTriHang(hang: readonly Khoang[], ms: number): { vt: number; t: number } {
  let con = Math.max(0, ms)
  for (let i = 0; i < hang.length; i++) {
    const dai = Math.max(0, hang[i]!.t1 - hang[i]!.t0)
    if (con < dai || i === hang.length - 1) return { vt: i, t: hang[i]!.t0 + Math.min(con, dai) }
    con -= dai
  }
  return { vt: 0, t: 0 }
}

/** Đồng hồ riêng cho buổi không có tiếng. */
export function taoDongHoRieng() {
  let goc = 0, luc = 0, chay = false, td = 1
  const doc = (nay: number): number => (chay ? goc + (nay - luc) * td : goc)
  return {
    doc,
    dangPhat: (): boolean => chay,
    phat(nay: number): void { if (!chay) { luc = nay; chay = true } },
    dung(nay: number): void { goc = doc(nay); chay = false },
    dat(ms: number, nay: number): void { goc = ms; luc = nay },
    datTocDo(v: number, nay: number): void { goc = doc(nay); luc = nay; td = v > 0 ? v : 1 },
  }
}
export type DongHoRieng = ReturnType<typeof taoDongHoRieng>

/** Làm mượt `audio.currentTime` (ms): nội suy theo tốc độ phát giữa hai lần trình duyệt cập nhật; không lùi khi đang phát trừ lúc tua (lệch quá 250 ms). */
export function taoLamMuot() {
  let tAm = -1, luc = 0, ra = 0
  return {
    doc(tAudio: number, nay: number, chay: boolean, td: number): number {
      if (!chay) { tAm = tAudio; luc = nay; return (ra = tAudio) }
      if (tAudio !== tAm) { tAm = tAudio; luc = nay }
      const uoc = tAm + Math.min(TRAN_UOC_MS, Math.max(0, nay - luc) * td)
      if (uoc >= ra || ra - uoc > TRAN_UOC_MS) ra = uoc
      return ra
    },
  }
}
