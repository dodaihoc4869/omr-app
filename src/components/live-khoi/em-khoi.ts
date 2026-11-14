// LIVE THEO KHỐI — MÁY EM (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md, bản vẽ docs/ban-ve-live-moi-1211 ảnh 08–13).
// Màn Bình Phản Ứng + màn live sẵn có giữ nguyên (chế độ «Học» = màn live cũ). Tệp này nghe CHÍNH kết nối phòng của màn ấy (`noiKhoi(w)`, một dòng ở
// ManBinhPhanUng) rồi tự dựng lớp nổi riêng khi phòng báo buổi là live theo khối (`live.khoi`):
//   · `gd = 'cho'`  ⇒ phòng chờ kín màn, ép ngang, trò Sinh Tồn bốn đội;
//   · thầy bấm Bắt đầu ⇒ màn «Bốn đội» 3 giây rồi vào bài;
//   · `gd = 'dang'` ⇒ nút chat nhỏ ở mép phải (số tin mới), bong bóng tin mới tự mờ, cửa nhắn cả lớp, nút xem lại bốn đội.
// Mọi mảnh nặng (trò chơi, chat, màn bốn đội) nạp lười ⇒ buổi dạy trên lớp không tải gì thêm.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { KenhLop, LoaiTinLop, NguoiLop, TinLop } from '../../lib/live-khoi/kieu'
import type { LuatEm } from '../../lib/bpu/phong-luat'

export interface KhoEm { /** Luật «rời màn N lần ⇒ bị mời ra» của buổi, phần của CHÍNH em (null = luật tắt). */ luat?: LuatEm | null; /** Phòng đang có lượt câu (em làm bài / thầy chữa) ⇒ ẩn nút nhắn tin và ngọn lửa cho khỏi vướng. */ coLuot?: boolean; /** Em vừa bấm «Tham gia»: hiện màn phòng NGAY, chờ phòng trả bản xem. */ dangVao?: boolean; /** Thầy vừa kết thúc buổi live ⇒ màn vinh danh (tới khi em đóng). */ xong?: boolean; khoi: { k: number; gd: 'cho' | 'dang'; che: 'hoc' | 'bang' | 'sanh'; /** thầy cho NGHỈ GIẢI LAO từ giờ này (13/11) */ giaiLao?: number } | null; toi: NguoiLop | null; ds: NguoiLop[]; kj: number[]; noi: boolean }
let kho: KhoEm = { khoi: null, toi: null, ds: [], kj: [0, 0, 0, 0], noi: false }
let ws: WebSocket | null = null
let goc: Root | null = null
let khung: HTMLDivElement | null = null
const nghe = new Set<() => void>()
const tai = new Map<LoaiTinLop, Set<(t: TinLop) => void>>()
const dat = (moi: Partial<KhoEm>): void => { kho = { ...kho, ...moi }; for (const f of nghe) f() }
export const guiTho = (tin: Record<string, unknown>): void => { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(tin)) } catch { /* rớt */ } }
export const kenh: KenhLop = {
  gui: (k, x) => guiTho({ t: 'lop', k, x }),
  nghe: (k, f) => { let s = tai.get(k); if (!s) { s = new Set(); tai.set(k, s) } s.add(f); return () => { s.delete(f) } },
}
function gan(): void {
  if (khung) return
  khung = document.createElement('div')
  khung.setAttribute('data-live-khoi-em', '')
  document.body.appendChild(khung)
  const g = (goc = createRoot(khung))
  void import('./LopNoiEm').then((m) => { if (goc === g) g.render(createElement(m.default)) }).catch(() => {})
}
function go(): void { goc?.unmount(); khung?.remove(); goc = null; khung = null }

/** Thầy vừa TỪ CHỐI cho em vào lại (luật rời màn): lớp nổi live gỡ, màn Bình Phản Ứng tự ẩn ⇒ em về Hôm nay; báo MỘT dòng 6 giây để em biết vì sao. */
function baoBiTuChoi(): void {
  if (typeof document === 'undefined') return
  const b = document.createElement('div')
  b.setAttribute('role', 'alert'); b.setAttribute('data-luat-roi', 'cam')
  b.textContent = 'Thầy không duyệt cho em vào lại. Em không vào được buổi live này nữa. Đã gửi thông báo cho phụ huynh.'
  b.style.cssText = 'position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483640;max-width:min(92vw,520px);padding:11px 16px;border-radius:14px;background:var(--tr-chu,CanvasText);color:var(--tr-nen,Canvas);font-weight:700;font-size:14.5px;line-height:1.4;box-shadow:0 12px 36px color-mix(in srgb, var(--p-muc) 35%, transparent);text-align:center'
  document.body.appendChild(b)
  setTimeout(() => b.remove(), 6000)
}
/** Đọc tin chữ của phòng: bản xem của em (`t: 'em'`), danh sách lớp (`lop-ds`), tin kênh lớp (`lop`). Xuất cho test. */
function nhanTinPhongEm(d: unknown): void {
  if (typeof d !== 'string' || d.length < 8) return
  const laEm = d.startsWith('{"t":"em"'), laLop = d.startsWith('{"t":"lop')
  if (!laEm && !laLop) return
  let j: Record<string, unknown>
  try { j = JSON.parse(d) as Record<string, unknown> } catch { return }
  if (j.t === 'em') {
    const live = j.live as { khoi?: KhoEm['khoi']; giay?: unknown } | null, e = j.em as { sbd?: string; ten?: string; doi?: number; vao?: boolean } | null
    const khoi = !j.ketThuc && live?.khoi && e?.vao ? live.khoi : null
    const toi = e?.sbd ? { sbd: e.sbd, ten: e.ten ?? e.sbd, doi: e.doi ?? 0 } : null
    const luat = (e as { luat?: LuatEm | null } | null)?.luat ?? null
    if (luat?.cam && !kho.luat?.cam) baoBiTuChoi()
    if (JSON.stringify(luat) !== JSON.stringify(kho.luat ?? null)) dat({ luat })
    const doi = JSON.stringify(khoi) !== JSON.stringify(kho.khoi) || JSON.stringify(toi) !== JSON.stringify(kho.toi)
    if (j.ketThuc && kho.khoi?.gd === 'dang' && kho.toi) { dat({ xong: true, khoi: null }); return }
    if (kho.xong) return
    if (khoi && !kho.khoi) guiTho({ t: 'lop-xin' })
    // có lượt câu HOẶC thầy đang chiếu một tờ có giấy đề (chữa câu / gọi lên bảng từ tấm hoạt động — không mở lượt) ⇒ em vào màn chiếu
    const coLuot = !!j.luot || !!live?.giay
    if (doi || coLuot !== !!kho.coLuot || (khoi && kho.dangVao)) dat({ khoi, toi, coLuot, ...(khoi ? { dangVao: false } : {}) })
    if (khoi || kho.dangVao) gan(); else if (khung) go()
  } else if (j.t === 'lop-ds') {
    // [sbd, tên, đội, kJ, mã đồ gọn?, danh hiệu?] — hai phần cuối (Sinh Tồn đợt 4) thiếu ⇒ không đồ / không danh hiệu.
    const ds = (Array.isArray(j.ds) ? j.ds : []).flatMap((x) => (Array.isArray(x) && typeof x[0] === 'string' ? [{ sbd: x[0], ten: String(x[1] ?? x[0]), doi: Number(x[2]) || 0, kj: Number(x[3]) || 0, ...(typeof x[4] === 'string' && x[4] ? { c: x[4] } : {}), ...(typeof x[5] === 'number' ? { dh: x[5] } : {}) }] : []))
    dat({ ds, kj: [0, 1, 2, 3].map((i) => Number((j.kj as unknown[] | undefined)?.[i]) || 0) })
  } else if (j.t === 'lop' && typeof j.k === 'string') for (const f of tai.get(j.k as LoaiTinLop) ?? []) { try { f(j as unknown as TinLop) } catch { /* nơi nghe lỗi */ } }
}
let henVao: ReturnType<typeof setTimeout> | undefined
/** Thẻ Live gọi lúc em bấm «Tham gia» (true) và khi vào hỏng (false). Quá 15 giây phòng chưa trả lời ⇒ tự gỡ màn chờ. */
export function baoDangVao(co: boolean): void {
  clearTimeout(henVao)
  if (co) { dat({ dangVao: true }); gan(); henVao = setTimeout(() => baoDangVao(false), 15_000) }
  else if (kho.dangVao) { dat({ dangVao: false }); if (!kho.khoi && !kho.xong) go() }
}
/** Màn Bình Phản Ứng gọi ngay sau khi tạo WebSocket của phòng. */
export function noiKhoi(w: WebSocket, tinGiu?: string[]): void {
  if (typeof w.addEventListener !== 'function') return
  ws = w
  if (tinGiu) { if (w.readyState === 1) dat({ noi: true }); for (const t of tinGiu) nhanTinPhongEm(t) } // nạp lười: phát lại các tin đã giữ trong lúc mảnh tải
  w.addEventListener('open', () => { if (ws === w) dat({ noi: true }) })
  w.addEventListener('message', (e: MessageEvent) => { if (ws === w) nhanTinPhongEm(e.data) })
  // Rớt mà 8 giây không có kết nối mới (em đóng màn, thầy kết thúc) ⇒ gỡ lớp nổi; màn tự nối lại thì `noiKhoi` chạy với kết nối mới.
  w.addEventListener('close', () => { if (ws !== w) return; dat({ noi: false }); setTimeout(() => { if (ws === w && !kho.xong) dongKhoi() }, 8000) })
}
/** Màn Bình Phản Ứng đóng hẳn (thầy kết thúc / em rời) ⇒ gỡ lớp nổi. */
export function dongKhoi(): void { ws = null; go(); kho = { khoi: null, toi: null, ds: [], kj: [0, 0, 0, 0], noi: false } }

export const layKho = (): KhoEm => kho
export const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f) } }
