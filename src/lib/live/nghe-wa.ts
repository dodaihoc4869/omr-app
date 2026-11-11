// PHÍA NGHE TRÊN ĐIỆN THOẠI THẬT (11/11 tối — bản phát hành 1630: thầy + nhiều em «không nghe thấy gì» dù thẻ <audio> đang chạy). Hai lưới:
//  · «Chạm để nghe»: tiếng thầy ĐÃ giải mã đủ to (> −50 dBFS, đo từ xa) mà em CHƯA chạm màn từ lúc vào live ⇒ iOS / một số Android vẫn câm dù `autoplay`
//    ⇒ khay hiện nút to «Chạm để nghe» (một chạm gọi `play()` + `AudioContext.resume()`).
//  · «Vẫn không nghe? Thử cách khác»: phát track nhận qua WebAudio (`createMediaStreamSource` → `destination`) thay cho thẻ <audio> (thẻ tắt tiếng để không
//    nghe đôi). Bật trong cú chạm của em; nhớ ở máy (`ddh.live.nghe-wa` = `1`).
export const KHOA_WA = 'ddh.live.nghe-wa'
export const nhoWa = (): boolean => { try { return typeof localStorage !== 'undefined' && localStorage.getItem(KHOA_WA) === '1' } catch { return false } }
/** Hiện «Chạm để nghe»? — đang bật nghe, chưa chạm từ lúc vào live, tiếng giải mã > −50 dBFS. */
export function chamNghe(o: { nghe: boolean; daCham: boolean; db: number | null | undefined }): boolean {
  return o.nghe && !o.daCham && o.db != null && o.db > -50
}
type Ctx = typeof AudioContext
export function taoNgheWa() {
  let bat = nhoWa(), ctx: AudioContext | null = null
  const nut = new Map<MediaStreamTrack, { src: AudioNode; g: GainNode }>()
  const C = (): Ctx | undefined => (typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext)
  const go = (): void => { for (const [, n] of nut) { try { n.src.disconnect(); n.g.disconnect() } catch { /* đã gỡ */ } } nut.clear() }
  return {
    bat: (): boolean => bat,
    /** Bật / tắt — gọi TRONG cú chạm của em để AudioContext được chạy. Không có WebAudio ⇒ giữ tắt. */
    dat(on: boolean): void {
      const L = C()
      bat = on && !!L
      try { if (bat) localStorage.setItem(KHOA_WA, '1'); else localStorage.removeItem(KHOA_WA) } catch { /* chế độ riêng tư */ }
      if (!bat) { go(); return }
      try { ctx ??= new L!(); void ctx.resume().catch(() => undefined) } catch { bat = false; go() }
    },
    /** Lần chạm của em: chạy lại AudioContext (iOS treo nó tới khi có thao tác). */
    moKhoa(): void { if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => undefined) },
    /** Đồng bộ nguồn WebAudio theo các track đang nhận + mức phát (0 = im: em tắt tiếng / rời màn). */
    capNhat(ds: (MediaStreamTrack | null | undefined)[], muc: number): void {
      if (!bat) return
      const L = C()
      if (!L) return
      try { ctx ??= new L() } catch { return }
      const c = ctx, con = new Set(ds.filter((t): t is MediaStreamTrack => !!t && t.readyState === 'live'))
      for (const [t, n] of nut) if (!con.has(t)) { try { n.src.disconnect(); n.g.disconnect() } catch { /* đã gỡ */ } nut.delete(t) }
      for (const t of con) if (!nut.has(t)) { try { const src = c.createMediaStreamSource(new MediaStream([t])), g = c.createGain(); src.connect(g); g.connect(c.destination); nut.set(t, { src, g }) } catch { /* bỏ */ } }
      for (const [, n] of nut) n.g.gain.value = muc
    },
  }
}
