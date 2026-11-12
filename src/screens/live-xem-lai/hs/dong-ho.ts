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

/** Mỗi khung hình chỉ sửa chừng này phần của độ lệch so với tiếng, và không quá `SUA_TRAN` lần quãng vừa đi ⇒ nét luôn tiến đều (0,75–1,25 lần tốc độ phát). */
export const SUA_MOI_KHUNG = 0.08, SUA_TRAN = 0.25
/** Trình duyệt thôi cập nhật giờ tiếng quá chừng này (giờ thật) ⇒ coi là tiếng đang đứng. */
export const TIENG_DUNG_MS = 400
/** Làm mượt `audio.currentTime` (ms) — ĐỒNG HỒ BÁM PHA (thầy 13/11: «nét bút xem lại bị giật … làm cho nét bút mượt như lúc live»).
 *  Trước: mỗi lần trình duyệt cập nhật giờ tiếng, đồng hồ nhảy theo con số mới (số mới nhỏ hơn mốc đã hiện ⇒ ĐỨNG chờ, lớn hơn ⇒ NHẢY) ⇒ đầu nét khựng /
 *  giật theo từng lần cập nhật (điện thoại cập nhật thưa và không đều). Nay: đồng hồ tự chạy theo đồng hồ máy × tốc độ phát, chỉ nắn DẦN về giờ tiếng
 *  (mỗi khung một phần nhỏ độ lệch) ⇒ nét đi đều ở mọi khung hình, vẫn khớp tiếng. Lệch quá `TRAN_UOC_MS` (tua, nhảy khoảng lặng) ⇒ theo ngay.
 *  Tiếng đứng (trình duyệt thôi cập nhật quá `TIENG_DUNG_MS`) ⇒ nét đi nốt tới mốc ước rồi đứng, không chạy trước tiếng. Tạm dừng ⇒ đúng con số của audio. */
export function taoLamMuot() {
  let tAm = -1, luc = 0, ra = 0, lucRa = 0, chayCu = false
  return {
    doc(tAudio: number, nay: number, chay: boolean, td: number): number {
      if (!chay || !chayCu) { tAm = tAudio; luc = nay; lucRa = nay; chayCu = chay; return (ra = tAudio) }
      if (tAudio !== tAm) { tAm = tAudio; luc = nay }
      const di = Math.max(0, nay - lucRa) * td, cho = Math.max(0, nay - luc) // `cho` = giờ THẬT từ lần cập nhật cuối (không nhân tốc độ)
      lucRa = nay
      const am = tAm + Math.min(TIENG_DUNG_MS, cho) * td, uoc = ra + di, lech = am - uoc
      if (Math.abs(lech) > TRAN_UOC_MS * Math.max(1, td)) return (ra = am)
      if (cho > TIENG_DUNG_MS) return (ra = ra >= am ? ra : Math.min(am, uoc))
      const sua = Math.max(-SUA_TRAN * di, Math.min(SUA_TRAN * di, lech * SUA_MOI_KHUNG))
      return (ra = uoc + sua)
    },
  }
}
