// CHỌN ĐẦU RA ÂM THANH («Loa») cho tiếng app phát trong chế độ Live — thầy 11/11: «làm thêm chọn đầu ra âm thanh để lựa chọn».
// Dựa trên `HTMLMediaElement.setSinkId` (Chrome / Edge máy tính, Chrome Android bản mới, Firefox 116+; Safari + mọi trình duyệt iPhone CHƯA có ⇒ `coChonLoa()`
// false ⇒ lớp giao diện ẩn ô chọn). Mã thiết bị '' = «Mặc định của máy». Lựa chọn nhớ ở localStorage (bọc try / catch).

const KHOA = 'ddh.live.loa'
type TheAm = HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> }

/** Trình duyệt này chọn được đầu ra âm thanh không. */
export const coChonLoa = (): boolean => typeof HTMLMediaElement !== 'undefined' && typeof (HTMLMediaElement.prototype as TheAm).setSinkId === 'function' && typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.enumerateDevices === 'function'

/** Loa của máy (đầu ra âm thanh). Bỏ mục «Communications»; mục mặc định gọi rõ «Mặc định của máy — <tên>» và mang mã ''. Không hỗ trợ / lỗi ⇒ []. */
export async function dsLoa(): Promise<{ id: string; ten: string }[]> {
  if (!coChonLoa()) return []
  try {
    const ds = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audiooutput' && d.deviceId !== 'communications')
    const ra = ds.map((d, i) => (d.deviceId === 'default' || d.deviceId === '' ? { id: '', ten: `Mặc định của máy${d.label ? ` — ${d.label.replace(/^(Default|Mặc định)\s*-\s*/i, '')}` : ''}` } : { id: d.deviceId, ten: d.label || `Loa ${i + 1}` }))
    return ra.some((d) => d.id === '') ? ra : [{ id: '', ten: 'Mặc định của máy' }, ...ra]
  } catch { return [] }
}

/** Loa đã chọn lần trước ('' = mặc định của máy). */
export function loaDaNho(): string { try { return (typeof localStorage !== 'undefined' && localStorage.getItem(KHOA)) || '' } catch { return '' } }
export function nhoLoa(id: string): void { try { if (id) localStorage.setItem(KHOA, id); else localStorage.removeItem(KHOA) } catch { /* chế độ riêng tư: chỉ nhớ trong lượt này */ } }

/** Cho thẻ âm thanh `the` phát ra loa `id`. Thiết bị không còn (đã rút) ⇒ về mặc định của máy và trả false. Trình duyệt không hỗ trợ ⇒ false, không ném lỗi. */
export async function apLoa(the: HTMLMediaElement | null, id: string): Promise<boolean> {
  const t = the as TheAm | null
  if (!t || typeof t.setSinkId !== 'function') return false
  try { await t.setSinkId(id); return true } catch { if (id) { try { await t.setSinkId('') } catch { /* giữ đầu ra hiện tại */ } } return false }
}

/** «Thử loa»: phát một tiếng ngắn (hai nốt 660 → 880 Hz, 0,5 giây, êm đầu êm cuối) ra ĐÚNG thiết bị `id`. Trả true khi tiếng đã phát ra thiết bị ấy. */
export async function thuLoa(id: string): Promise<boolean> {
  const C = typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!C || typeof document === 'undefined') return false
  let c: AudioContext | null = null
  try {
    c = new C()
    const ctx = c, dich = ctx.createMediaStreamDestination(), g = ctx.createGain(), t0 = ctx.currentTime + 0.03
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.25, t0 + 0.03); g.gain.setValueAtTime(0.25, t0 + 0.42); g.gain.linearRampToValueAtTime(0, t0 + 0.5)
    g.connect(dich)
    for (const [hz, tu] of [[660, 0], [880, 0.25]] as const) { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz; o.connect(g); o.start(t0 + tu); o.stop(t0 + tu + 0.25) }
    const the = document.createElement('audio')
    the.srcObject = dich.stream
    const dung = id ? await apLoa(the, id) : true
    await ctx.resume().catch(() => undefined)
    await the.play()
    setTimeout(() => { try { the.pause(); the.srcObject = null } catch { /* đã dừng */ } void ctx.close().catch(() => undefined) }, 900)
    return dung
  } catch { try { void c?.close().catch(() => undefined) } catch { /* đã đóng */ } return false }
}

/** BỘ LOA CỦA TRANG (một trang chỉ là máy thầy hoặc máy em): nhớ loa đang chọn, áp cho mọi thẻ âm thanh đã tạo bằng `theAmLoa()` và cho thẻ tạo sau.
 *  Trình duyệt không chọn được đầu ra ⇒ mọi hàm là không-làm-gì. */
let idLoa: string | null = null
const cacThe = new Set<HTMLMediaElement>()
const idNay = (): string => (idLoa ??= coChonLoa() ? loaDaNho() : '')
/** Thẻ `<audio>` mới cho tiếng live, đã theo loa đang chọn. */
export function theAmLoa(): HTMLAudioElement { const t = document.createElement('audio'); cacThe.add(t); if (idNay()) void apLoa(t, idNay()); return t }
export const boLoa = {
  co: coChonLoa, ds: dsLoa, id: idNay,
  /** Chọn loa ('' = mặc định của máy): nhớ lại + áp ngay cho mọi tiếng đang phát. Thiết bị không còn ⇒ về mặc định, trả false. */
  dat: async (id: string): Promise<boolean> => { idLoa = id; nhoLoa(id); return (await Promise.all([...cacThe].map((t) => apLoa(t, id)))).every(Boolean) },
  /** «Thử loa»: tiếng ngắn ra đúng loa đang chọn. */
  thu: (): Promise<boolean> => thuLoa(idNay()),
}
