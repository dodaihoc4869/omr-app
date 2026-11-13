// LUẬT «RỜI MÀN N LẦN ⇒ BỊ MỜI RA KHỎI LỚP» của buổi live (thầy chốt build 13/11, bản vẽ docs/ban-ve-live-moi-1211/48–54). Phần THUẦN của phòng.
// · Thầy bật / tắt và chỉnh số lần trong nút bốn ô (`live-dat { luat: { bat, n } }`). Chỉ đếm các lần rời TỪ LÚC BẬT, lúc đang live (Học / Bảng) — không tính phòng chờ.
// · Em rời đủ `n` lần ⇒ vào `ra`: không còn được xem live (không tiếng, không bảng). Em bấm «Xin vào lại» (`xin`) ⇒ thầy «Duyệt» (vào lại, đếm lại từ đầu)
//   hoặc «Từ chối» (em bị CẤM tới hết buổi live: ra màn Hôm nay, không xin lại được). Tắt live ⇒ gỡ hết.
// · `so` = sổ các lần mời ra của buổi (kể cả em đã được duyệt vào lại) — để thầy chép tin báo văn phòng nhắn phụ huynh. App KHÔNG tự nhắn phụ huynh.
import type { TrangThaiPhong } from './phong'

export const LUAT_N_MAC_DINH = 3, LUAT_N_MIN = 1, LUAT_N_MAX = 9
export interface LuatPhong {
  /** số lần rời thì bị mời ra */ n: number; /** giờ phòng lúc bật (đổi ⇒ máy em hiện thông báo «Thầy vừa bật luật») */ tu: number
  /** số lần rời của từng em kể từ lúc bật / từ lần được duyệt vào lại */ dem: Record<string, number>
  /** em đang bị mời ra, CHỜ thầy quyết: giờ bị mời ra, giờ xin vào lại */ ra: Record<string, { luc: number; xin?: number }>
  so: { sbd: string; luc: number; lan: number }[]
}
/** Một việc của luật cần GHI SỔ cho văn phòng trực live đọc (`/gv/bpu/moi-ra`): 'ra' = em bị mời ra · 'tu' = thầy từ chối (cấm tới hết buổi) · 'vao' = em được vào lại. */
export interface SuKienLuat { loai: 'ra' | 'tu' | 'vao'; sbd: string; luc: number; /** số lần em đã rời */ lan?: number; /** ngưỡng của luật lúc đó */ n?: number }
const ghiSo = (st: TrangThaiPhong, sk: SuKienLuat): void => { const l = st.live; if (l) l.choGhi = [...(l.choGhi ?? []), sk].slice(-200) }
/** Máy chủ (phòng) lấy các việc chờ ghi sổ rồi xoá khỏi trạng thái. */
export function layChoGhiLuat(st: TrangThaiPhong): SuKienLuat[] { const l = st.live, ds = l?.choGhi ?? []; if (l && ds.length) l.choGhi = []; return ds }
const kepN = (v: unknown): number => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(LUAT_N_MAX, Math.max(LUAT_N_MIN, n)) : LUAT_N_MAC_DINH }
const luatCua = (st: TrangThaiPhong): LuatPhong | null => st.live?.luat ?? null

/** Thầy bật / tắt / đổi số lần. Bật mới ⇒ đếm lại từ 0; đổi số lần lúc đang bật ⇒ giữ số đã đếm. Tắt ⇒ gỡ luật, em đang CHỜ duyệt được vào lại
 *  (em thầy đã TỪ CHỐI thì vẫn bị cấm tới hết buổi live — `live.camLive`). */
export function datLuat(st: TrangThaiPhong, o: unknown, nay: number): boolean {
  const l = st.live, x = (o ?? null) as { bat?: unknown; n?: unknown } | null
  if (!l || !x || typeof x !== 'object' || typeof x.bat !== 'boolean') return false
  const cu = l.luat ?? null
  if (!x.bat) { if (!cu) return false; for (const sbd of Object.keys(cu.ra)) ghiSo(st, { loai: 'vao', sbd, luc: nay }); l.luat = null; st.capNhat = nay; return true }
  const n = kepN(x.n ?? cu?.n)
  if (cu && cu.n === n) return false
  l.luat = cu ? { ...cu, n } : { n, tu: nay, dem: {}, ra: {}, so: [] }
  st.capNhat = nay
  return true
}
/** Em bị thầy TỪ CHỐI cho vào lại: cấm tới hết buổi live (ra hẳn màn Hôm nay, không xin lại được). */
export const biCam = (st: TrangThaiPhong, sbd: string): boolean => !!st.live?.camLive?.[sbd]
/** Em đang ở ngoài lớp vì luật rời màn (đang chờ thầy quyết, hoặc đã bị từ chối). */
export const biMoiRa = (st: TrangThaiPhong, sbd: string): boolean => !!luatCua(st)?.ra[sbd] || biCam(st, sbd)
/** Gọi khi phòng vừa ghi MỘT LẦN RỜI MỚI của em lúc đang live. Đủ số lần ⇒ mời ra. Trả true nếu em vừa bị mời ra. */
export function luatKhiRoi(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const l = st.live, u = l?.luat
  if (!l || !u || !l.bat || l.khoi?.gd === 'cho' || l.khoi?.giaiLao || u.ra[sbd] || biCam(st, sbd)) return false // phòng chờ / đang nghỉ giải lao: không đếm
  const lan = (u.dem[sbd] ?? 0) + 1
  u.dem[sbd] = lan
  if (lan < u.n) return false
  u.ra[sbd] = { luc: nay }
  u.so = [...u.so, { sbd, luc: nay, lan }].slice(-200)
  ghiSo(st, { loai: 'ra', sbd, luc: nay, lan, n: u.n })
  return true
}
/** Em bấm «Xin vào lại» (chỉ khi đang chờ thầy quyết; em đã bị từ chối không xin lại được). */
export function luatXin(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const r = luatCua(st)?.ra[sbd]
  if (!r || r.xin || biCam(st, sbd)) return false
  r.xin = nay; st.capNhat = nay
  return true
}
/** Thầy «Duyệt» (ok): em vào lại, đếm lại từ đầu (gỡ cả lệnh cấm nếu thầy đổi ý). «Từ chối»: em bị CẤM tới hết buổi live — máy em ra màn Hôm nay,
 *  không xin lại được (thầy 13/11: «bấm từ chối hs sẽ không vào được suốt buổi live, out hẳn ra màn hôm nay, không xin vào lại được nữa»). */
export function luatDuyet(st: TrangThaiPhong, sbd: string, ok: boolean, nay: number): boolean {
  const l = st.live, u = luatCua(st), r = u?.ra[sbd]
  if (!l || (!r && !(ok && biCam(st, sbd)))) return false
  if (u) { delete u.ra[sbd]; delete u.dem[sbd] }
  if (ok) { if (l.camLive) delete l.camLive[sbd]; if (st.roiNay?.includes(sbd)) st.roiNay = st.roiNay.filter((s) => s !== sbd) }
  else l.camLive = { ...(l.camLive ?? {}), [sbd]: nay }
  ghiSo(st, { loai: ok ? 'vao' : 'tu', sbd, luc: nay })
  st.capNhat = nay
  return true
}
/** Tắt live ⇒ gỡ luật và mọi lệnh cấm (buổi sau thầy bật lại nếu cần); không em nào kẹt ngoài lớp. */
export function luatKhiTat(st: TrangThaiPhong): void { if (st.live) { if (st.live.luat) st.live.luat = null; if (st.live.camLive) st.live.camLive = {} } }

/** Phần luật trong bản xem của MỘT em. Luật tắt và em không bị cấm ⇒ null. */
export function viewLuatEm(st: TrangThaiPhong, sbd: string) {
  const u = luatCua(st), cam = biCam(st, sbd)
  if ((!u && !cam) || !st.live?.bat) return null
  const r = u?.ra[sbd]
  return { n: u?.n ?? 0, tu: u?.tu ?? 0, da: u?.dem[sbd] ?? 0, ra: !!r || cam, xin: !!r?.xin, cam }
}
export type LuatEm = NonNullable<ReturnType<typeof viewLuatEm>>
/** Phần luật trong bản xem của THẦY: số lần của các em đã rời, các em đang chờ thầy quyết (ai đã xin), các em đã bị từ chối, sổ mời ra của buổi. */
export function viewLuatBang(st: TrangThaiPhong) {
  const u = luatCua(st), cam = Object.entries(st.live?.camLive ?? {}).map(([sbd, luc]) => ({ sbd, luc })).sort((a, b) => a.luc - b.luc)
  if (!u && !cam.length) return null
  return {
    bat: !!u, n: u?.n ?? 0, dem: u ? Object.fromEntries(Object.entries(u.dem).filter(([s, k]) => k > 0 && !u.ra[s])) : {},
    ra: u ? Object.entries(u.ra).map(([sbd, r]) => ({ sbd, luc: r.luc, xin: !!r.xin })).sort((a, b) => a.luc - b.luc) : [], cam, so: u?.so ?? [],
  }
}
export type LuatBang = NonNullable<ReturnType<typeof viewLuatBang>>
/** Giờ Việt Nam «HH:MM» của một mốc giờ phòng. */
export const gioVnLuat = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(11, 16)
