// LIVE THEO KHỐI — MÁY THẦY (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md, bản vẽ docs/ban-ve-live-moi-1211 ảnh 03–05).
// Buổi live của khối dùng CHÍNH bảng Bình Phản Ứng + tờ chiếu + phần live sẵn có (chế độ «Học» = màn live cũ, không vẽ lại). Tệp này chỉ thêm một lớp nổi:
//   · phòng chờ (em đang vào, bốn đội, nút «Bắt đầu live»);  · khi đang live: công tắc «Học | Bảng» + cột «Tin nhắn lớp» (phím M).
// Trạng thái thật nằm ở PHÒNG (`live.khoi`), tệp này chỉ gửi `live-dat { khoi }` qua cầu nối cau-live.ts ⇒ tải lại trang giữa buổi vẫn đúng chỗ.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ViewBang } from '../../lib/bpu/phong'
import { xongLiveKhoi } from '../../lib/live-khoi/api'
import type { KenhLop, KhoiLive, LichLive, LoaiTinLop, TinLop } from '../../lib/live-khoi/kieu'
import { layBangCuoi, layPhong, nghePhong, ngheTin } from '../bpu/cau-live'

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
export const layView = (): ViewBang | null => view
const nghe = new Set<() => void>()
const phatDoi = (): void => { for (const f of nghe) f() }
const tai = new Map<LoaiTinLop, Set<(t: TinLop) => void>>()
export const kenh: KenhLop = {
  gui: (k, x) => layPhong()?.gui({ t: 'lop', k, x }),
  nghe: (k, f) => { let s = tai.get(k); if (!s) { s = new Set(); tai.set(k, s) } s.add(f); return () => { s.delete(f) } },
}
export const datKhoi = (k: { k: number; gd: 'cho' | 'dang'; che: 'hoc' | 'bang' }): void => layPhong()?.gui({ t: 'live-dat', khoi: k })
/** Phòng vừa nối / vừa có bản xem: buổi của phiên mà phòng chưa mang cờ khối ⇒ đặt «phòng chờ». */
function soat(): void {
  const l = view?.live, p = view ? phienCua(view.buoiId) : null
  if (view && l && !l.khoi && p && !view.ketThuc && layPhong()) datKhoi({ k: p.khoi, gd: 'cho', che: 'hoc' })
}
function nhan(tin: unknown): void {
  const j = tin as { t?: string; k?: LoaiTinLop } | null
  if (!j || typeof j !== 'object' || tin instanceof ArrayBuffer) return
  if (j.t === 'bang') { view = tin as ViewBang; soat(); gan(); phatDoi() }
  else if (j.t === 'lop' && j.k) for (const f of tai.get(j.k) ?? []) { try { f(tin as TinLop) } catch { /* nơi nghe lỗi */ } }
}
let daNghe = false
function batNghe(): void {
  if (daNghe) return
  daNghe = true
  ngheTin(nhan)
  nghePhong(() => { if (!layPhong()) { view = null; phatDoi() } else { const b = layBangCuoi() as ViewBang | null; if (b) nhan(b) } })
  const b = layBangCuoi() as ViewBang | null
  if (b) nhan(b)
}
function gan(): void {
  if (khung || !view?.live?.khoi) return
  khung = document.createElement('div')
  khung.setAttribute('data-live-khoi-thay', '')
  document.body.appendChild(khung)
  const g = (goc = createRoot(khung))
  void import('./LopNoiThay').then((m) => { if (goc === g) g.render(createElement(m.default)) }).catch(() => {})
}
function go(): void { goc?.unmount(); khung?.remove(); goc = null; khung = null }

/** Thầy bấm «Mở phòng chờ» / «Vào lại phòng» ở nút Live: nhớ phiên rồi mở bảng của buổi (bảng tự nối phòng; phòng nối xong ⇒ `soat` đặt cờ khối). */
export async function moBangLiveKhoi(o: { lich: LichLive; buoiId: string; ma: string }): Promise<void> {
  ghiPhien({ id: o.lich.id, khoi: o.lich.khoi, buoiId: o.buoiId })
  batNghe()
  const m = await import('../bpu/gan-gv')
  m.moBangDiemDanh({ buoiId: o.buoiId, ma: o.ma || undefined })
}
/** Bảng của một buổi vừa mở (kể cả sau tải lại trang) ⇒ bắt đầu nghe để dựng lớp nổi nếu đó là buổi live theo khối. */
export function ngheBangKhoi(): void { batNghe() }
/** Thầy kết thúc buổi học ⇒ đóng lịch live của khối (máy em tắt thẻ Live). */
export function khiKetThucBuoi(buoiId: string): void {
  const p = phienCua(buoiId)
  go(); view = null
  if (!p) return
  ghiPhien(null)
  void xongLiveKhoi(p.id)
}

export const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f) } }
