// BI-A · CÀI ĐẶT THEO MÁY (thầy duyệt 30/09): độ nhạy xoay gậy (Thường / Chậm), tay cầm (Phải / Trái), đã xem hướng dẫn lần đầu,
// đã biết giải trước trên bàn, đã biết vạch vàng "đủ tới bi". Nhớ theo MÁY (localStorage, bọc try/catch: chế độ riêng tư / chặn dữ liệu
// ⇒ dùng mặc định, vẫn đổi được trong phiên). Cùng khuôn với mat-than-luon.tsx (useSyncExternalStore, không Context).
import { useSyncExternalStore } from 'react'
import type { DoNhay } from './dieu-khien-cham'

export type Tay = 'phai' | 'trai'
interface Kho<T extends string> { doc(): T; dat(v: T): void; use(): T; quen(): void; khoa: string }

function taoKho<T extends string>(khoa: string, macDinh: T, hop: readonly T[]): Kho<T> {
  let bo: T | null = null
  const nghe = new Set<() => void>()
  const doc = (): T => {
    if (bo !== null) return bo
    try { const x = globalThis.localStorage?.getItem(khoa); bo = x && (hop as readonly string[]).includes(x) ? (x as T) : macDinh } catch { bo = macDinh }
    return bo
  }
  const dat = (v: T): void => {
    bo = v
    try { if (v === macDinh) globalThis.localStorage?.removeItem(khoa); else globalThis.localStorage?.setItem(khoa, v) } catch { /* máy chặn lưu: chỉ nhớ trong phiên */ }
    for (const f of nghe) f()
  }
  const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f) } }
  return { doc, dat, use: () => useSyncExternalStore(dangKy, doc, () => macDinh), quen: () => { bo = null }, khoa }
}

export const KHO_DO_NHAY = taoKho<DoNhay>('bia_do_nhay', 'thuong', ['thuong', 'cham'])
export const KHO_TAY = taoKho<Tay>('bia_tay', 'phai', ['phai', 'trai'])
/** Cờ "đã biết": '0' chưa, '1' rồi. */
export const KHO_HUONG_DAN = taoKho<'0' | '1'>('bia_da_xem_huong_dan', '0', ['0', '1'])
export const KHO_BIET_GIAI_TRUOC = taoKho<'0' | '1'>('bia_da_biet_giai_truoc', '0', ['0', '1'])
export const KHO_BIET_VACH = taoKho<'0' | '1'>('bia_da_biet_vach', '0', ['0', '1'])

/** Chỉ cho test: quên mọi giá trị đã đọc để đọc lại từ localStorage. */
export function _quenCaiDatBia(): void { for (const k of [KHO_DO_NHAY, KHO_TAY, KHO_HUONG_DAN, KHO_BIET_GIAI_TRUOC, KHO_BIET_VACH]) k.quen() }
