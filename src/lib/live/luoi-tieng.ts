// LƯỚI AN TOÀN BẮT «CÂM» (11/11 tối — thầy: «câm cả hai chiều», mọi bộ thử cũ chỉ bắt LỖI chứ không bắt CÂM). Hai lưới, mỗi lưới một công tắc lùi riêng:
//  · PHÍA GỬI (`taoLuoiGui`, `ddh.live.luoi-gui` = `tat` để tắt): track ĐÃ QUA chuỗi / bộ lọc đang nằm ở bộ gửi mà `media-source` (tiếng bộ gửi thật sự cầm)
//    không có chút năng lượng nào suốt 1,5 giây trong khi mic vào có tín hiệu (hoặc không đo được mic vào) ⇒ báo `khiCam` để lớp gọi đổi về track mic THÔ.
//    Mic thật luôn có ồn nền ⇒ năng lượng đúng 0 = chuỗi / bộ lọc đứng hoặc ra số 0, không phải «thầy đang im».
//  · PHÍA NGHE (`taoLuoiPhat`, `ddh.live.luoi-phat` = `tat` để tắt): gói tiếng VẪN TỚI (`inbound-rtp.packetsReceived` tăng) mà thẻ <audio> không tắt tiếng lại
//    đang dừng / `currentTime` đứng ⇒ lần 1: bỏ chọn loa (`setSinkId('')`) nếu đang chọn + `play()` lại · lần 2: `play()` lại · từ lần 3: báo `khiKet(true)` để
//    lớp giao diện hiện «Chạm để nghe» (cú chạm của người dùng là thứ duy nhất trình duyệt chấp nhận) và tự `play()` ở lần chạm / bấm phím kế tiếp.
//    Dùng số GÓI chứ không dùng năng lượng nhận: Chrome chỉ tính năng lượng khi có thẻ đang phát kéo tiếng ra ⇒ thẻ đứng thì năng lượng cũng đứng.
import type { MoiTruongLive } from './sfu'

export const LUOI_GUI_MS = 1500
const tat = (k: string): boolean => { try { return typeof localStorage !== 'undefined' && localStorage.getItem(k) === 'tat' } catch { return false } }
export const luoiGuiBat = (): boolean => !tat('ddh.live.luoi-gui')
export const luoiPhatBat = (): boolean => !tat('ddh.live.luoi-phat')

/** Một mẫu của bộ gửi: giờ (ms) + tổng năng lượng `media-source` (null = trình duyệt không báo). */
export interface MauGui { luc: number; nl: number | null }
/** CÂM? — có mẫu trải ≥ 1,5 giây, mọi mẫu đều có số đo, năng lượng KHÔNG tăng, và mic vào không phải đang im hẳn (`micCoTieng` false = mic im ⇒ không trách chuỗi). */
export function xetGuiCam(mau: readonly MauGui[], micCoTieng: boolean | null): boolean {
  if (mau.length < 3 || micCoTieng === false) return false
  const dau = mau[0]!, cuoi = mau[mau.length - 1]!
  if (cuoi.luc - dau.luc < LUOI_GUI_MS || mau.some((m) => m.nl == null)) return false
  return cuoi.nl! - dau.nl! <= 1e-9
}
/** Tổng năng lượng tiếng bộ gửi đang cầm (`media-source`), null = không đọc được. */
export async function nangLuongGui(g: RTCRtpSender): Promise<number | null> {
  try {
    let nl: number | null = null
    ;(await g.getStats()).forEach((s: Record<string, unknown>) => { if (s.type === 'media-source' && (s.kind === 'audio' || s.kind == null) && typeof s.totalAudioEnergy === 'number') nl = s.totalAudioEnergy })
    return nl
  } catch { return null }
}

/** Lưới phía gửi. `dangXuLy()` = bộ gửi đang cầm track đã qua chuỗi / bộ lọc VÀ người dùng không tắt tiếng (tắt tiếng thì chuỗi ra 0 là đúng). */
export function taoLuoiGui(o: { gui: () => RTCRtpSender | null; dangXuLy: () => boolean; micCoTieng: () => boolean | null; khiCam: () => void; mt: Pick<MoiTruongLive, 'hen' | 'huyHen' | 'dongHo'> }) {
  let mau: MauGui[] = [], track: MediaStreamTrack | null = null, hen: unknown = null, het = false
  const vong = async (): Promise<void> => {
    hen = null
    if (het) return
    const g = o.gui()
    if (luoiGuiBat() && g?.track && o.dangXuLy()) {
      if (g.track !== track) { track = g.track; mau = [] }
      const nl = await nangLuongGui(g)
      if (het) return
      if (g.track === track && o.dangXuLy()) {
        mau.push({ luc: o.mt.dongHo(), nl })
        while (mau.length > 2 && mau[mau.length - 1]!.luc - mau[1]!.luc >= LUOI_GUI_MS) mau.shift()
        if (xetGuiCam(mau, o.micCoTieng())) { mau = []; track = null; o.khiCam() }
      } else mau = []
    } else { mau = []; track = null }
    hen = o.mt.hen(() => { void vong() }, 500)
  }
  hen = o.mt.hen(() => { void vong() }, 500)
  return { huy: (): void => { het = true; o.mt.huyHen(hen) } }
}

/** KẸT? — gói vẫn tới, thẻ không tắt tiếng theo ý người dùng, mà thẻ đang dừng hoặc `currentTime` không chạy. */
export function xetPhatKet(s: { goiTang: boolean; tatTieng: boolean; dung: boolean; ctTang: number }): boolean {
  return s.goiTang && !s.tatTieng && (s.dung || s.ctTang < 0.2)
}
async function soGoiNhan(r: RTCRtpReceiver | null): Promise<number | null> {
  if (!r?.getStats) return null
  try { let n: number | null = null; (await r.getStats()).forEach((s: Record<string, unknown>) => { if (s.type === 'inbound-rtp' && typeof s.packetsReceived === 'number') n = s.packetsReceived }); return n } catch { return null }
}

/** Lưới phía nghe cho MỘT thẻ <audio> (`the`) đang phát track của bộ nhận `thu`. */
export function taoLuoiPhat(o: { the: () => HTMLMediaElement | null; thu: () => RTCRtpReceiver | null; khiKet: (ket: boolean) => void; mt: Pick<MoiTruongLive, 'hen' | 'huyHen'> }) {
  let hen: unknown = null, het = false, lan = 0, ket = false, goi0: number | null = null, ct0 = -1, cho: (() => void) | null = null
  const thoiCho = (): void => { if (cho && typeof window !== 'undefined') { window.removeEventListener('pointerdown', cho, true); window.removeEventListener('keydown', cho, true) } cho = null }
  const datKet = (k: boolean): void => {
    if (k === ket) return
    ket = k; o.khiKet(k)
    thoiCho()
    if (k && typeof window !== 'undefined') { cho = () => { thoiCho(); void o.the()?.play().catch(() => undefined) }; window.addEventListener('pointerdown', cho, true); window.addEventListener('keydown', cho, true) }
  }
  const vong = async (): Promise<void> => {
    hen = null
    if (het) return
    const e = o.the(), goi = luoiPhatBat() && e?.srcObject ? await soGoiNhan(o.thu()) : null
    if (het) return
    if (e && goi != null && goi0 != null && ct0 >= 0) {
      if (xetPhatKet({ goiTang: goi > goi0, tatTieng: e.muted, dung: e.paused, ctTang: e.currentTime - ct0 })) {
        lan += 1
        const t = e as HTMLMediaElement & { sinkId?: string; setSinkId?: (id: string) => Promise<void> }
        if (lan === 1 && t.sinkId && t.setSinkId) await t.setSinkId('').catch(() => undefined)
        if (lan >= 3) datKet(true)
        void e.play().catch(() => undefined)
      } else if (goi > goi0 || e.muted) { lan = 0; datKet(false) }
    } else if (!e?.srcObject) { lan = 0; datKet(false) }
    goi0 = goi; ct0 = e ? e.currentTime : -1
    hen = o.mt.hen(() => { void vong() }, 1000)
  }
  hen = o.mt.hen(() => { void vong() }, 1000)
  return { huy: (): void => { het = true; thoiCho(); o.mt.huyHen(hen) }, ket: (): boolean => ket }
}
