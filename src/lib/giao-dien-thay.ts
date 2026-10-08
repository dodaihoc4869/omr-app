// GIAO DIỆN SÁNG / TỐI / THEO MÁY của app giáo viên. Lựa chọn nhớ trong localStorage `ddh.giaoDienThay`; áp dụng bằng thuộc tính
// `data-giao-dien` trên <html> ('sang' | 'toi'; 'may' = không đặt thuộc tính, đi theo prefers-color-scheme như mọi nơi khác).
// Cách ép màu: xem `vietLaiMedia` (viết lại điều kiện `prefers-color-scheme` của mọi luật) — không sao chép bảng màu.
import { useCallback, useState } from 'react'

export type GiaoDien = 'sang' | 'toi' | 'may'
export const KHOA_GIAO_DIEN = 'ddh.giaoDienThay'

export function docGiaoDien(): GiaoDien {
  try {
    const v = localStorage.getItem(KHOA_GIAO_DIEN)
    return v === 'sang' || v === 'toi' ? v : 'may'
  } catch {
    return 'may'
  }
}

// ÉP SÁNG / TỐI KHÔNG CẦN SAO CHÉP BẢNG MÀU: mọi luật nền tối của app (tokens.css, m3-theme.css, index.css, các biến thể dark: của Tailwind)
// nằm trong `@media (prefers-color-scheme: dark)`. Khi thầy ép, ta viết lại ĐIỀU KIỆN của các khối ấy: dark → luôn đúng (tối) hoặc luôn sai (sáng),
// light → ngược lại; 'theo máy' trả lại chữ gốc. Một nguồn màu, không bản sao. CSS nạp muộn (màn nạp lười) cũng được xử lý (quan sát <head>).
const DUNG = '(min-width: 0px)'
const SAI = '(min-width: 999999px)'
const RE_MAU = /\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)/g

/** Viết lại điều kiện media theo lựa chọn; 'may' trả nguyên văn. Thuần — kiểm bằng test. */
export function vietLaiMedia(goc: string, v: GiaoDien): string {
  if (v === 'may') return goc
  return goc.replace(RE_MAU, (_, k: string) => (k === v || (k === 'dark' && v === 'toi') || (k === 'light' && v === 'sang') ? DUNG : SAI))
}

const NGUYEN_VAN = new WeakMap<object, string>()

function duyet(rules: CSSRuleList, v: GiaoDien): void {
  for (const r of Array.from(rules) as (CSSRule & { media?: MediaList; cssRules?: CSSRuleList })[]) {
    // Khối đã từng bị viết lại (nhớ chữ gốc) HOẶC còn nguyên chữ gốc có prefers-color-scheme: đều được viết lại theo lựa chọn mới.
    if (r.media && typeof r.media.mediaText === 'string' && (NGUYEN_VAN.has(r) || r.media.mediaText.includes('prefers-color-scheme'))) {
      if (!NGUYEN_VAN.has(r)) NGUYEN_VAN.set(r, r.media.mediaText)
      r.media.mediaText = vietLaiMedia(NGUYEN_VAN.get(r)!, v)
    }
    if (r.cssRules) duyet(r.cssRules, v)
  }
}

function xuLyTatCa(v: GiaoDien): void {
  for (const sh of Array.from(document.styleSheets)) {
    try {
      duyet(sh.cssRules, v)
    } catch {
      /* tờ kiểu khác nguồn: không đọc được, bỏ qua */
    }
  }
}

let hienTai: GiaoDien = 'may'
let dangTheoDoi = false
let cho = 0

function theoDoiCssMoi(): void {
  if (dangTheoDoi || typeof MutationObserver === 'undefined') return
  dangTheoDoi = true
  const lai = () => {
    if (hienTai === 'may' || cho) return
    cho = requestAnimationFrame(() => {
      cho = 0
      xuLyTatCa(hienTai)
    })
  }
  new MutationObserver(lai).observe(document.head, { childList: true })
  document.addEventListener('load', lai, true) // <link rel=stylesheet> nạp xong
}

/** Áp dụng lựa chọn: thuộc tính `data-giao-dien` + color-scheme trên <html> + viết lại điều kiện media. 'may' gỡ hết. */
export function apDungGiaoDien(v: GiaoDien): void {
  const goc = document.documentElement
  hienTai = v
  if (v === 'may') {
    goc.removeAttribute('data-giao-dien')
    goc.style.removeProperty('color-scheme')
  } else {
    goc.setAttribute('data-giao-dien', v)
    goc.style.setProperty('color-scheme', v === 'toi' ? 'dark' : 'light')
    theoDoiCssMoi()
  }
  xuLyTatCa(v)
}

export function datGiaoDien(v: GiaoDien): void {
  try {
    if (v === 'may') localStorage.removeItem(KHOA_GIAO_DIEN)
    else localStorage.setItem(KHOA_GIAO_DIEN, v)
  } catch {
    /* chế độ riêng tư: vẫn áp dụng cho phiên này */
  }
  apDungGiaoDien(v)
}

export function useGiaoDien(): [GiaoDien, (v: GiaoDien) => void] {
  const [v, setV] = useState<GiaoDien>(docGiaoDien)
  const dat = useCallback((moi: GiaoDien) => {
    datGiaoDien(moi)
    setV(moi)
  }, [])
  return [v, dat]
}
