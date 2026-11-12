// LIVE THEO KHỐI — MÁY EM (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md, bản vẽ docs/ban-ve-live-moi-1211 ảnh 08–13).
// Màn Bình Phản Ứng + màn live sẵn có giữ nguyên (chế độ «Học» = màn live cũ). Tệp này nghe CHÍNH kết nối phòng của màn ấy (`noiKhoi(w)`, một dòng ở
// ManBinhPhanUng) rồi tự dựng lớp nổi riêng khi phòng báo buổi là live theo khối (`live.khoi`):
//   · `gd = 'cho'`  ⇒ phòng chờ kín màn, ép ngang, trò Giữ Lửa bốn đội;
//   · thầy bấm Bắt đầu ⇒ màn «Bốn đội» 3 giây rồi vào bài;
//   · `gd = 'dang'` ⇒ nút chat nhỏ ở mép phải (số tin mới), bong bóng tin mới tự mờ, cửa nhắn cả lớp, nút xem lại bốn đội.
// Mọi mảnh nặng (trò chơi, chat, màn bốn đội) nạp lười ⇒ buổi dạy trên lớp không tải gì thêm.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { KenhLop, LoaiTinLop, NguoiLop, TinLop } from '../../lib/live-khoi/kieu'

export interface KhoEm { /** Phòng đang có lượt câu (em làm bài / thầy chữa) ⇒ ẩn nút nhắn tin và ngọn lửa cho khỏi vướng. */ coLuot?: boolean; /** Em vừa bấm «Tham gia»: hiện màn phòng NGAY, chờ phòng trả bản xem. */ dangVao?: boolean; /** Thầy vừa kết thúc buổi live ⇒ màn vinh danh (tới khi em đóng). */ xong?: boolean; khoi: { k: number; gd: 'cho' | 'dang'; che: 'hoc' | 'bang' | 'sanh' } | null; toi: NguoiLop | null; ds: NguoiLop[]; kj: number[]; noi: boolean }
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

/** Đọc tin chữ của phòng: bản xem của em (`t: 'em'`), danh sách lớp (`lop-ds`), tin kênh lớp (`lop`). Xuất cho test. */
function nhanTinPhongEm(d: unknown): void {
  if (typeof d !== 'string' || d.length < 8) return
  const laEm = d.startsWith('{"t":"em"'), laLop = d.startsWith('{"t":"lop')
  if (!laEm && !laLop) return
  let j: Record<string, unknown>
  try { j = JSON.parse(d) as Record<string, unknown> } catch { return }
  if (j.t === 'em') {
    const live = j.live as { khoi?: KhoEm['khoi'] } | null, e = j.em as { sbd?: string; ten?: string; doi?: number; vao?: boolean } | null
    const khoi = !j.ketThuc && live?.khoi && e?.vao ? live.khoi : null
    const toi = e?.sbd ? { sbd: e.sbd, ten: e.ten ?? e.sbd, doi: e.doi ?? 0 } : null
    const doi = JSON.stringify(khoi) !== JSON.stringify(kho.khoi) || JSON.stringify(toi) !== JSON.stringify(kho.toi)
    if (j.ketThuc && kho.khoi?.gd === 'dang' && kho.toi) { dat({ xong: true, khoi: null }); return }
    if (kho.xong) return
    if (khoi && !kho.khoi) guiTho({ t: 'lop-xin' })
    const coLuot = !!j.luot
    if (doi || coLuot !== !!kho.coLuot || (khoi && kho.dangVao)) dat({ khoi, toi, coLuot, ...(khoi ? { dangVao: false } : {}) })
    if (khoi || kho.dangVao) gan(); else if (khung) go()
  } else if (j.t === 'lop-ds') {
    const ds = (Array.isArray(j.ds) ? j.ds : []).flatMap((x) => (Array.isArray(x) && typeof x[0] === 'string' ? [{ sbd: x[0], ten: String(x[1] ?? x[0]), doi: Number(x[2]) || 0, kj: Number(x[3]) || 0 }] : []))
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
