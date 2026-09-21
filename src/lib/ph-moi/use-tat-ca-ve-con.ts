// Nạp "mọi thứ về con" cho app phụ huynh mới: nạp khi vào; làm mới mỗi 60 giây khi tab đang hiện (tab ẩn ⇒ bỏ lượt, hiện lại ⇒ nạp ngay); lỗi nhất thời GIỮ bản cũ (không nhấp nháy mất màn);
// lỗi khi CHƯA có bản nào ⇒ trạng thái `loi` kèm câu thật + `thuLai()`. Hàm gọi đi qua ref (truyền hàm mới mỗi lần vẽ không nạp lại vô hạn).
import { useCallback, useEffect, useRef, useState } from 'react'
import { taiTatCaVeCon, type PhanHoiTatCa } from './api'
import type { PhMoi } from './du-lieu'

export const NHIP_PH_MOI_MS = 60_000
export type TrangThaiPhMoi = 'tai' | 'ok' | 'loi'
export interface ViewPhMoi {
  trangThai: TrangThaiPhMoi
  pm: PhMoi | null
  chuLoi: string
  /** Đang nạp lại (đã có bản cũ hoặc bấm "Thử lại"). */
  dangLamMoi: boolean
  thuLai: () => void
}

export function useTatCaVeCon(sbd: string | null, api: (sbd: string) => Promise<PhanHoiTatCa> = taiTatCaVeCon): ViewPhMoi {
  const [s, setS] = useState<Omit<ViewPhMoi, 'thuLai'>>({ trangThai: 'tai', pm: null, chuLoi: '', dangLamMoi: false })
  const apiRef = useRef(api)
  apiRef.current = api
  const nap = useRef<() => void>(() => {})
  useEffect(() => {
    if (!sbd) {
      setS({ trangThai: 'tai', pm: null, chuLoi: '', dangLamMoi: false })
      nap.current = () => {}
      return
    }
    let huy = false
    const chay = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      setS((x) => ({ ...x, dangLamMoi: true }))
      const r = await apiRef.current(sbd)
      if (huy) return
      if (r.kieu === 'ok') setS({ trangThai: 'ok', pm: r.pm, chuLoi: '', dangLamMoi: false })
      else setS((x) => (x.pm ? { ...x, dangLamMoi: false } : { trangThai: 'loi', pm: null, chuLoi: r.chu, dangLamMoi: false }))
    }
    nap.current = () => void chay()
    void chay()
    const nhip = setInterval(() => void chay(), NHIP_PH_MOI_MS)
    const khiHien = () => {
      if (document.visibilityState === 'visible') void chay()
    }
    document.addEventListener('visibilitychange', khiHien)
    return () => {
      huy = true
      clearInterval(nhip)
      document.removeEventListener('visibilitychange', khiHien)
    }
  }, [sbd])
  const thuLai = useCallback(() => {
    setS((x) => (x.pm ? x : { ...x, trangThai: 'tai', chuLoi: '' }))
    nap.current()
  }, [])
  return { ...s, thuLai }
}
