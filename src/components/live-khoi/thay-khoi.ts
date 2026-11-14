// LIVE THEO KHỐI — MÁY THẦY (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md, bản vẽ docs/ban-ve-live-moi-1211 ảnh 03–05).
// Buổi live của khối dùng CHÍNH bảng Bình Phản Ứng + tờ chiếu + phần live sẵn có (chế độ «Học» = màn live cũ, không vẽ lại). Tệp này chỉ thêm một lớp nổi:
//   · phòng chờ (em đang vào, bốn đội, nút «Bắt đầu live»);  · khi đang live: công tắc «Học | Bảng» + cột «Tin nhắn lớp» (phím M).
// Trạng thái thật nằm ở PHÒNG (`live.khoi`), tệp này chỉ gửi `live-dat { khoi }` qua cầu nối cau-live.ts ⇒ tải lại trang giữa buổi vẫn đúng chỗ.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ViewBang } from '../../lib/bpu/phong'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { xongLiveKhoi } from '../../lib/live-khoi/api'
import type { KenhLop, KhoiLive, LichLive, LoaiTinLop, TinLop } from '../../lib/live-khoi/kieu'
import { layBangCuoi, layPhong, nghePhong, ngheTin } from '../bpu/cau-live'
import './thay-khoi.css'

const KHOA = 'ddh.gv.live-khoi'
export interface PhienKhoi { id: string; khoi: KhoiLive; buoiId: string }
let phien: PhienKhoi | null = null
let goc: Root | null = null
let khung: HTMLDivElement | null = null

function docPhien(): PhienKhoi | null {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA) || 'null') as Partial<PhienKhoi> | null
    return v && typeof v.id === 'string' && typeof v.buoiId === 'string' && (v.khoi === 10 || v.khoi === 11 || v.khoi === 12) ? { id: v.id, khoi: v.khoi, buoiId: v.buoiId } : null
  } catch { return null }
}
function ghiPhien(p: PhienKhoi | null): void { phien = p; try { if (p) localStorage.setItem(KHOA, JSON.stringify(p)); else localStorage.removeItem(KHOA) } catch { /* đầy / chặn */ } }
/** Phiên live theo khối máy này đang giữ cho `buoiId` (đã mở từ nút Live; còn nhớ qua tải lại trang). */
export function phienCua(buoiId: string): PhienKhoi | null { const p = phien ?? docPhien(); return p && p.buoiId === buoiId ? p : null }

// ── Kho nhỏ: bản xem mới nhất của bảng + kênh lớp ──
let view: ViewBang | null = null
/** Thầy vừa bấm «Mở phòng chờ»: khối đang mở ⇒ lớp nổi hiện NGAY («Đang mở phòng chờ…»), không chờ bảng nối phòng. Phòng trả bản xem có cờ khối / 15 giây ⇒ thôi. */
let dangMo: number | null = null
let henMo: ReturnType<typeof setTimeout> | undefined
export const layDangMo = (): number | null => dangMo
export const layView = (): ViewBang | null => view
/** Sinh Tồn đợt 4: đồ + danh hiệu từng em (từ `lop-ds` phòng phát cả máy thầy) ⇒ máy chiếu vẽ đồ / danh hiệu như máy em. Đổi ⇒ tạo Map mới (useSyncExternalStore). */
let doLop: ReadonlyMap<string, { c?: string; dh?: number }> = new Map()
export const layDoLop = (): ReadonlyMap<string, { c?: string; dh?: number }> => doLop
const nghe = new Set<() => void>()
const phatDoi = (): void => { for (const f of nghe) f() }
// ── Nối với mảnh gắn bảng (gan-gv): báo chế độ để bảng Bình Phản Ứng ẩn / hiện đúng luật; theo dõi lúc thầy Esc ra Hôm nay. ──
let gg: typeof import('../bpu/gan-gv') | null = null
/** Phần tử nằm ngoài gốc lớp nổi (tấm nền, viên «Đang live») tự mang bảng màu màn chiếu + xanh than cố định. */
function datMau(el: HTMLElement): void { for (const [k, v] of Object.entries({ ...MAU_CHIEU, ...MAU_XANH_THAN })) el.style.setProperty(k, v) }
function apChe(): void {
  const k = view?.live?.khoi
  gg?.datCheLive(!k || k.gd === 'cho' ? 'cho' : k.che)
}
// RA HÔM NAY GIỮA BUỔI (thầy 12/11: «out ra ngoài thì nút live hiện thành kết thúc buổi, bấm vào kết thúc luôn»): nút «Live» ở Hôm nay được thay bằng nút
// «Kết thúc buổi» (đặt cạnh, cùng dáng — không thêm byte vào mảnh Hôm nay); kèm một viên nhỏ góc dưới phải «Đang live · Vào lại» để thầy quay lại phòng.
let ngoai: HTMLDivElement | null = null, nutKt: HTMLButtonElement | null = null, nutLiveAn: HTMLElement | null = null
let henNgoai: ReturnType<typeof setInterval> | undefined
function goNgoai(): void {
  clearInterval(henNgoai); henNgoai = undefined
  ngoai?.remove(); ngoai = null; nutKt?.remove(); nutKt = null
  if (nutLiveAn) { nutLiveAn.style.display = ''; nutLiveAn = null }
}
function ketThucTuNgoai(nut: HTMLButtonElement, buoiId: string): void {
  if (nut.disabled) return
  nut.disabled = true; nut.textContent = 'Đang kết thúc…'
  void gg?.ketThucBuoiHoc(buoiId).then((loi) => { if (loi) { nut.disabled = false; nut.textContent = 'Kết thúc buổi' } })
}
function gangNutKt(buoiId: string): void {
  if (nutKt?.isConnected) return
  const live = document.querySelector<HTMLElement>('button[aria-label^="Live"]')
  if (!live) return
  nutKt = document.createElement('button')
  nutKt.type = 'button'; nutKt.className = live.className; nutKt.textContent = 'Kết thúc buổi'; nutKt.setAttribute('data-live-khoi-kt', '')
  const n = nutKt
  n.addEventListener('click', () => ketThucTuNgoai(n, buoiId))
  live.after(n); live.style.display = 'none'; nutLiveAn = live
}
function soatNgoai(): void {
  const p = gg?.phienDangCo(), k = view?.live?.khoi
  if (!p?.tamAn || !k || !phienCua(p.buoiId) || view?.ketThuc) { goNgoai(); return }
  const buoiId = p.buoiId
  if (!ngoai) {
    ngoai = document.createElement('div')
    ngoai.setAttribute('data-live-khoi-ngoai', ''); datMau(ngoai)
    const chu = document.createElement('span'); chu.textContent = `Đang live · Khối ${k.k}`
    const vao = document.createElement('button'); vao.type = 'button'; vao.textContent = 'Vào lại'
    vao.addEventListener('click', () => gg?.moBangDiemDanh({ buoiId, live: true }))
    ngoai.append(chu, vao)
    document.body.appendChild(ngoai)
  }
  // Màn Hôm nay dựng sau khi ra ngoài ⇒ thử gắn nút «Kết thúc buổi» tới khi thấy nút «Live» (và gắn lại nếu Hôm nay vẽ lại).
  gangNutKt(buoiId)
  if (!henNgoai) henNgoai = setInterval(() => { if (gg?.phienDangCo()?.tamAn) gangNutKt(buoiId); else goNgoai() }, 600)
}
let nen: HTMLDivElement | null = null
function go(): void { goc?.unmount(); khung?.remove(); nen?.remove(); goc = null; khung = null; nen = null; document.documentElement.removeAttribute('data-live-khoi'); for (const k of Object.keys(MAU_XANH_THAN)) if (k.startsWith('--lk-')) document.documentElement.style.removeProperty(k); goNgoai() }
function datDangMo(k: number | null): void { clearTimeout(henMo); dangMo = k; if (k != null) henMo = setTimeout(() => { datDangMo(null); if (!view?.live?.khoi) go() }, 15_000); phatDoi() }
const tai = new Map<LoaiTinLop, Set<(t: TinLop) => void>>()
export const kenh: KenhLop = {
  gui: (k, x) => layPhong()?.gui({ t: 'lop', k, x }),
  nghe: (k, f) => { let s = tai.get(k); if (!s) { s = new Set(); tai.set(k, s) } s.add(f); return () => { s.delete(f) } },
}
/** Đàm thoại hai chiều (giơ tay ⇒ thầy mời ⇒ em bật mic): lệnh của thầy tới phòng — luật có sẵn ở phong-live.ts (`liveMoi`, `liveHaTay`, `liveThu`). */
export const lenhMic = (t: 'live-moi' | 'live-ha-tay' | 'live-thu-mic', sbd?: string): void => layPhong()?.gui(sbd ? { t, sbd } : { t })
/** Luật «rời màn N lần ⇒ bị mời ra» (13/11): bật / tắt + số lần; thầy «Duyệt» / «Từ chối» em xin vào lại. */
export const datLuat = (bat: boolean, n: number): void => layPhong()?.gui({ t: 'live-dat', luat: { bat, n } })
export const duyetLuat = (sbd: string, ok: boolean): void => layPhong()?.gui({ t: 'live-luat-duyet', sbd, ok })
export const datKhoi = (k: { k: number; gd: 'cho' | 'dang'; che: 'hoc' | 'bang' | 'sanh' }): void => layPhong()?.gui({ t: 'live-dat', khoi: k })
/** NÚT «NGHỈ» / «HỌC TIẾP» (13/11): nghỉ ⇒ cả lớp về màn chờ chơi trò + live tạm dừng (mic thầy và nét ngừng tới); học tiếp ⇒ gỡ cờ, live chạy lại,
 *  `che` không đổi nên mọi máy vào lại đúng chỗ đang dạy. */
export const datGiaiLao = (k: { k: number; gd: 'cho' | 'dang'; che: 'hoc' | 'bang' | 'sanh' }, nghi: boolean): void => layPhong()?.gui({ t: 'live-dat', khoi: { k: k.k, gd: k.gd, che: k.che, ...(nghi ? { giaiLao: Date.now() } : {}) }, nghi })
// TỰ BẬT TIẾNG (thầy 12/11): buổi đã «Bắt đầu live» (`gd = dang`) mà phòng chưa ghi nhận live ⇒ bật qua phần live máy thầy (thay-noi.ts), thử lại mỗi
// 2 giây tới khi phòng báo `bat` (tối đa 8 lần). Đã bật được MỘT lần trong buổi ⇒ thôi tự bật (thầy tự «Kết thúc live» / «Tạm dừng» trên tờ được tôn trọng).
let tiengBuoi = '', tiengDaBat = false, tiengLan = 0
let henTieng: ReturnType<typeof setTimeout> | undefined
function soatTieng(): void {
  const v = view, l = v?.live
  if (!v || !l?.khoi || l.khoi.gd !== 'dang' || v.ketThuc) return
  if (tiengBuoi !== v.buoiId) { tiengBuoi = v.buoiId; tiengDaBat = false; tiengLan = 0 }
  if (l.bat) { tiengDaBat = true; clearTimeout(henTieng); henTieng = undefined; return }
  if (tiengDaBat || henTieng || tiengLan >= 8) return
  tiengLan += 1
  void import('../live/thay-noi').then((m) => { m.batLiveKhoi() }).catch(() => {})
  henTieng = setTimeout(() => { henTieng = undefined; soatTieng() }, 2000)
}
/** Sảnh: thầy bấm «Bật tiếng lại» (mic vừa cắm / vừa cho quyền). */
export function batTiengLai(): void { tiengDaBat = false; tiengLan = 0; clearTimeout(henTieng); henTieng = undefined; soatTieng() }
/** Phòng vừa nối / vừa có bản xem: buổi của phiên mà phòng chưa mang cờ khối ⇒ đặt «phòng chờ». */
function soat(): void {
  const l = view?.live, p = view ? phienCua(view.buoiId) : null
  if (view && l && !l.khoi && p && !view.ketThuc && layPhong()) datKhoi({ k: p.khoi, gd: 'cho', che: 'hoc' })
}
function nhan(tin: unknown): void {
  const j = tin as { t?: string; k?: LoaiTinLop } | null
  if (!j || typeof j !== 'object' || tin instanceof ArrayBuffer) return
  if (j.t === 'bang') {
    view = tin as ViewBang
    // Buổi đã kết thúc, hoặc bảng vừa chuyển sang buổi trên lớp (không cờ khối) ⇒ gỡ lớp live.
    if (view.ketThuc || (!view.live?.khoi && dangMo == null && !phienCua(view.buoiId))) { go(); phatDoi(); return }
    soat(); soatTieng(); apChe()
    if (view.live?.khoi && dangMo != null) datDangMo(null)
    gan(); phatDoi()
  }
  else if (j.t === 'lop' && j.k) for (const f of tai.get(j.k) ?? []) { try { f(tin as TinLop) } catch { /* nơi nghe lỗi */ } }
  else if (j.t === 'lop-ds') {
    const m = new Map<string, { c?: string; dh?: number }>()
    for (const x of Array.isArray((j as { ds?: unknown }).ds) ? (j as { ds: unknown[] }).ds : []) {
      if (Array.isArray(x) && typeof x[0] === 'string' && (typeof x[4] === 'string' || typeof x[5] === 'number')) m.set(x[0], { ...(typeof x[4] === 'string' && x[4] ? { c: x[4] } : {}), ...(typeof x[5] === 'number' ? { dh: x[5] } : {}) })
    }
    if (m.size || doLop.size) { doLop = m; phatDoi() }
  }
}
let daNghe = false
function batNghe(): void {
  if (daNghe) return
  daNghe = true
  ngheTin(nhan)
  // Phòng chớp mất nối ⇒ GIỮ bản xem cuối (cụm nút, sảnh đứng yên); nối lại ⇒ đọc bản mới.
  nghePhong(() => { if (layPhong()) { const b = layBangCuoi() as ViewBang | null; if (b) nhan(b) } })
  window.addEventListener('bpu-phien-live', soatNgoai)
  void import('../bpu/gan-gv').then((m) => { gg = m; apChe(); soatNgoai() }).catch(() => {})
  const b = layBangCuoi() as ViewBang | null
  if (b) nhan(b)
}
function gan(): void {
  if (khung || view?.ketThuc || (!view?.live?.khoi && !dangMo)) return
  // Cờ ở gốc trang suốt buổi live: tờ giảng kín màn (không dải đầu, không chừa thanh bên) + tấm nền xanh than che app bên dưới (thay-khoi.css).
  document.documentElement.setAttribute('data-live-khoi', '')
  // 13/11 đồng bộ nền tối Duolingo: bảng xanh than (--lk-*) gắn cả ở gốc trang ⇒ tờ riêng (KhungXemPhieu, ngoài gốc lớp nổi) và cột tin nhắn đọc cùng một bảng
  for (const [k, v] of Object.entries(MAU_XANH_THAN)) if (k.startsWith('--lk-')) document.documentElement.style.setProperty(k, v)
  if (!nen) { nen = document.createElement('div'); nen.setAttribute('data-live-khoi-nen', ''); datMau(nen); document.body.appendChild(nen) }
  khung = document.createElement('div')
  khung.setAttribute('data-live-khoi-thay', '')
  document.body.appendChild(khung)
  const g = (goc = createRoot(khung))
  void import('./LopNoiThay').then((m) => { if (goc === g) g.render(createElement(m.default)) }).catch(() => {})
}

/** Thầy bấm «Mở phòng chờ» / «Vào lại phòng» ở nút Live: nhớ phiên rồi mở bảng của buổi (bảng tự nối phòng; phòng nối xong ⇒ `soat` đặt cờ khối). */
export async function moBangLiveKhoi(o: { lich: LichLive; buoiId: string; ma: string }): Promise<void> {
  ghiPhien({ id: o.lich.id, khoi: o.lich.khoi, buoiId: o.buoiId })
  batNghe()
  if (!view?.live?.khoi) { datDangMo(o.lich.khoi); gan() }
  const m = await import('../bpu/gan-gv')
  m.moBangDiemDanh({ buoiId: o.buoiId, live: true })
}
/** Bảng của một buổi vừa mở (kể cả sau tải lại trang) ⇒ bắt đầu nghe để dựng lớp nổi nếu đó là buổi live theo khối. */
export function ngheBangKhoi(): void { batNghe() }
/** Thầy kết thúc buổi học ⇒ đóng lịch live của khối (máy em tắt thẻ Live). */
export function khiKetThucBuoi(buoiId: string): void {
  // Thầy 12/11: «bấm vào cái là kết thúc hẳn, out ra màn Hôm nay luôn» ⇒ máy thầy gỡ lớp nổi ngay (màn vinh danh chỉ hiện ở máy em).
  const p = phienCua(buoiId)
  go()
  view = null
  if (!p) return
  ghiPhien(null)
  void xongLiveKhoi(p.id)
}

export const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f) } }
