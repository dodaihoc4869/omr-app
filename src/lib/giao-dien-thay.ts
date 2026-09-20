// GIAO DIỆN SÁNG / TỐI / THEO MÁY của app giáo viên. Lựa chọn nhớ trong localStorage `ddh.giaoDienThay`; áp dụng bằng thuộc tính
// `data-giao-dien` trên <html> ('sang' | 'toi'; 'may' = không đặt thuộc tính, đi theo prefers-color-scheme như mọi nơi khác).
// CSS đọc thuộc tính ấy ở src/styles/che-do-thu-cong.css (bản sinh từ các khối nền tối của tokens.css / m3-theme.css).
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

/** Đặt thuộc tính trên <html> theo `v`; 'may' thì gỡ thuộc tính. */
export function apDungGiaoDien(v: GiaoDien): void {
  const goc = document.documentElement
  if (v === 'may') goc.removeAttribute('data-giao-dien')
  else goc.setAttribute('data-giao-dien', v)
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
