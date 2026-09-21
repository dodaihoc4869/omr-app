// Ô "Thi đua hôm nay": nạp ngay khi vào bảng, rồi LÀM MỚI mỗi 60 giây khi màn đang hiện (tab ẩn thì bỏ lượt; hiện lại thì nạp ngay). "Vừa vượt lên" suy từ hai lần nạp liền nhau, chỉ giữ 2 phút.
import { useEffect, useRef, useState } from 'react'
import { taiThiDua } from './thi-dua-api'
import { vuaVuotLen, type ThiDua } from './thi-dua'

export const NHIP_THI_DUA_MS = 60_000
export const GIU_VUA_VUOT_MS = 120_000

export interface ViewThiDua {
  thiDua: ThiDua | null
  vuot: string | null
}

export function useThiDua(token: string | undefined, bat: boolean, api: (t: string) => Promise<ThiDua | null> = taiThiDua): ViewThiDua {
  const [v, setV] = useState<ViewThiDua>({ thiDua: null, vuot: null })
  const truoc = useRef<ThiDua | null>(null)
  const apiRef = useRef(api)
  apiRef.current = api
  useEffect(() => {
    if (!bat || !token) {
      truoc.current = null
      setV({ thiDua: null, vuot: null })
      return
    }
    let huy = false
    let hetVuot: ReturnType<typeof setTimeout> | undefined
    const nap = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      const nay = await apiRef.current(token)
      if (huy) return
      if (!nay) return // lỗi nhất thời: GIỮ bản đang hiện (không nhấp nháy mất ô)
      const noi = vuaVuotLen(truoc.current, nay)
      truoc.current = nay
      setV((cu) => ({ thiDua: nay, vuot: noi ?? cu.vuot }))
      if (noi) {
        if (hetVuot) clearTimeout(hetVuot)
        hetVuot = setTimeout(() => !huy && setV((cu) => ({ ...cu, vuot: null })), GIU_VUA_VUOT_MS)
      }
    }
    void nap()
    const nhip = setInterval(() => void nap(), NHIP_THI_DUA_MS)
    const khiHien = () => {
      if (document.visibilityState === 'visible') void nap()
    }
    document.addEventListener('visibilitychange', khiHien)
    return () => {
      huy = true
      clearInterval(nhip)
      if (hetVuot) clearTimeout(hetVuot)
      document.removeEventListener('visibilitychange', khiHien)
    }
  }, [token, bat])
  return v
}
