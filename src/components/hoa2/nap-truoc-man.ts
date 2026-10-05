// CHUYỂN MÀN NHANH (05/10 — thầy: "nhanh gấp 2 lần hiện tại", GIỮ NGUYÊN giao diện): bộ dụng cụ chung cho các màn mở từ Sảnh 2.0.
//
// 1. `boNap(nap)` — bộ nạp NHỚ mô-đun: gọi nhiều lần vẫn MỘT lượt tải; hỏng thì quên để lần sau thử lại; `.san()` = mô-đun đã về chưa.
// 2. `lazyNapTruoc(bo)` — thay `React.lazy`. VÌ SAO: `React.lazy` LUÔN treo ở lần vẽ đầu (kể cả khi mảnh đã nằm sẵn trong máy, vì
//    `import()` chỉ trả lời ở nhịp sau), màn chờ của Suspense hiện ra, rồi React 19 còn GIỮ màn chờ thêm tới 300 ms
//    (react-dom: `globalMostRecentFallbackTime + 300`) mới hiện màn thật. Đường "Khám phá Bát Linh Đảo" đi qua BA lớp lazy (Game → vỏ
//    Đảo → Đảo 2.0) ⇒ ba lần treo như thế. NAY: mảnh đã nạp (trước) ⇒ vẽ thẳng component, không treo; chưa có ⇒ đúng đường React.lazy cũ
//    (cùng Suspense, cùng màn chờ, cùng cách báo lỗi).
// 3. `taoGoiSom()` — GỌI SỚM: em chạm cửa ⇒ bắn ngay lệnh đọc mà màn sắp mở CHẮC CHẮN sẽ gọi (đúng lệnh, đúng thân), song song với lúc
//    tải mảnh + vẽ màn; lượt gọi đầu của màn NHẬN LẠI lời hứa ấy thay vì gọi lần hai — số lệnh tới máy chủ không đổi, chỉ đi sớm hơn.
//    Lệnh sớm đã HỎNG trước lúc màn nhận ⇒ màn gọi lại như cũ (y hệt lúc chưa có gọi sớm).
// 4. `napTruocLanLuot()` + `nenNapTruoc()` — nạp trước NHẸ TAY: lần lượt từng mảnh, mỗi mảnh đợi lúc máy rảnh; tiết kiệm dữ liệu / 2G /
//    mất mạng thì không nạp; một mảnh hỏng thì dừng (lúc em bấm tải như cũ).
import { createElement, lazy, useState, type ComponentProps, type ComponentType, type ReactElement } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentBatKy = ComponentType<any>

/** Bộ nạp nhớ mô-đun: `bo()` tải (một lượt dù gọi nhiều lần), `bo.san()` = mô-đun đã về (null nếu chưa). */
export type BoNap<M> = (() => Promise<M>) & { san: () => M | null }

export function boNap<M>(nap: () => Promise<M>): BoNap<M> {
  let daVe: M | null = null
  let hua: Promise<M> | null = null
  const bo = (): Promise<M> => {
    if (!hua)
      hua = nap().then(
        (m) => {
          daVe = m
          return m
        },
        (e: unknown) => {
          hua = null
          throw e
        },
      )
    return hua
  }
  return Object.assign(bo, { san: () => daVe })
}

/**
 * Bọc một `React.lazy` (`Luoi`) bằng bộ nạp `bo` của CÙNG mảnh: thể hiện nào sinh ra SAU lúc `bo` đã có mô-đun thì vẽ thẳng component
 * (không treo Suspense, không màn chờ, không 300 ms giữ màn chờ); chưa có thì đi đúng đường `Luoi` cũ (cùng Suspense, cùng màn chờ).
 */
export function veNgayKhiCo<M extends { default: ComponentBatKy }>(Luoi: ComponentBatKy, bo: BoNap<M>): (props: ComponentProps<M['default']>) => ReactElement {
  return function ManNapTruoc(props: ComponentProps<M['default']>): ReactElement {
    // Chốt MỘT lần lúc thể hiện sinh ra: không bao giờ đổi Luoi ↔ component giữa chừng (đổi kiểu = React dựng lại cây con, mất trạng thái).
    const [C] = useState<M['default'] | null>(() => bo.san()?.default ?? null)
    return createElement(C ?? Luoi, props)
  }
}

/** `React.lazy` + `veNgayKhiCo` dùng chung một bộ nạp. `.napTruoc()` = nạp sẵn (trả mô-đun để nơi gọi nạp tiếp mảnh con mà mô-đun ấy xuất). */
export function lazyNapTruoc<M extends { default: ComponentBatKy }>(bo: BoNap<M>): ((props: ComponentProps<M['default']>) => ReactElement) & { napTruoc: () => Promise<M> } {
  return Object.assign(veNgayKhiCo(lazy(bo), bo), { napTruoc: bo })
}

/** Kho GỌI SỚM theo khoá (vd. `lệnh + phiên`). Hạn `hanMs`: quá hạn chưa ai nhận ⇒ bỏ. */
export interface KhoGoiSom<T> {
  /** Bắn `goi()` ngay (một lần cho mỗi khoá còn hạn — chạm hai lần liền không bắn lại). */
  ban: (khoa: string, goi: () => Promise<T>) => void
  /** Lượt gọi đầu của màn: lời hứa đã bắn (còn hạn, CHƯA hỏng) — hoặc null ⇒ màn tự gọi như cũ. Nhận rồi thì xoá khỏi kho. */
  nhan: (khoa: string) => Promise<T> | null
  /** Màn đóng ⇒ bỏ mọi lệnh sớm chưa ai nhận (không để lượt mở sau nhận nhầm số cũ). */
  xoa: () => void
}

export function taoGoiSom<T>(hanMs = 15_000): KhoGoiSom<T> {
  const ds = new Map<string, { luc: number; hua: Promise<T>; hong: boolean }>()
  return {
    ban(khoa, goi) {
      const co = ds.get(khoa)
      if (co && !co.hong && Date.now() - co.luc < hanMs) return
      let hua: Promise<T>
      try {
        hua = goi()
      } catch (e) {
        hua = Promise.reject(e)
      }
      const muc = { luc: Date.now(), hua, hong: false }
      hua.catch(() => {
        muc.hong = true // lỗi để màn tự gọi lại như cũ (hoặc lượt đã nhận tự báo)
      })
      ds.set(khoa, muc)
    },
    nhan(khoa) {
      const co = ds.get(khoa)
      if (!co) return null
      ds.delete(khoa)
      return !co.hong && Date.now() - co.luc < hanMs ? co.hua : null
    },
    xoa() {
      ds.clear()
    },
  }
}

/** Hẹn việc lúc luồng chính rảnh: `requestIdleCallback` (hạn chờ 2 s), máy không có (Safari cũ) thì `setTimeout`. */
export function henLucRanh(viec: () => void): void {
  const ric = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
  if (typeof ric === 'function') ric(viec, { timeout: 2000 })
  else setTimeout(viec, 200)
}

/** Tiết kiệm dữ liệu / 2G / đang mất mạng ⇒ KHÔNG nạp trước (nhẹ tay với máy em mạng yếu: lúc em bấm sẽ tải như cũ). */
export function nenNapTruoc(nav: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator): boolean {
  if (!nav) return false
  if (nav.onLine === false) return false
  const c = (nav as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (c?.saveData) return false
  if (c?.effectiveType === '2g' || c?.effectiveType === 'slow-2g') return false
  return true
}

/**
 * Nạp trước LẦN LƯỢT (một mảnh một lúc, mỗi mảnh đợi lúc rảnh) — không tranh đường mạng / luồng chính với việc em đang làm.
 * Một mảnh hỏng ⇒ DỪNG cả lượt (mạng yếu thì thôi). Lời hứa xong khi hết danh sách hoặc dừng; không bao giờ ném lỗi.
 */
export function napTruocLanLuot(ds: readonly (() => Promise<unknown>)[], hen: (viec: () => void) => void = henLucRanh): Promise<void> {
  return new Promise((xong) => {
    let i = 0
    const tiep = (): void => {
      if (i >= ds.length) return xong()
      const nap = ds[i++]!
      hen(() => {
        try {
          nap().then(tiep, () => xong())
        } catch {
          xong()
        }
      })
    }
    tiep()
  })
}
