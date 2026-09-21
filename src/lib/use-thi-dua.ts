// Ô "Thi đua hôm nay": nạp ngay khi vào bảng, rồi LÀM MỚI mỗi 60 giây khi màn đang hiện (tab ẩn thì bỏ lượt; hiện lại thì nạp ngay). "Vừa vượt lên" suy từ hai lần nạp liền nhau, chỉ giữ 2 phút.
import { useEffect, useRef, useState } from 'react'
import { taiThiDua } from './thi-dua-api'
import { vuaVuotLen, type ThiDua } from './thi-dua'
import { batNhipBenVung } from './nhip-ben-vung'

export const NHIP_THI_DUA_MS = 180_000 // sự cố D1 21/09: 60 s × mọi máy em ⇒ 180 s ± 30 s (lệch ngẫu nhiên, lùi 30→60→120→300 s khi lỗi, quay lại tab dội ≥ 20 s)
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
    const nap = async (): Promise<boolean> => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return true
      const nay = await apiRef.current(token)
      if (huy) return true
      if (!nay) return false // lỗi nhất thời: GIỮ bản đang hiện (không nhấp nháy mất ô) và LÙI nhịp
      const noi = vuaVuotLen(truoc.current, nay)
      truoc.current = nay
      setV((cu) => ({ thiDua: nay, vuot: noi ?? cu.vuot }))
      if (noi) {
        if (hetVuot) clearTimeout(hetVuot)
        hetVuot = setTimeout(() => !huy && setV((cu) => ({ ...cu, vuot: null })), GIU_VUA_VUOT_MS)
      }
      return true
    }
    const nhip = batNhipBenVung(nap, { coSoMs: NHIP_THI_DUA_MS, dangAn: () => typeof document !== 'undefined' && document.visibilityState === 'hidden' })
    const khiHien = () => {
      if (document.visibilityState === 'visible') nhip.kich()
    }
    document.addEventListener('visibilitychange', khiHien)
    return () => {
      huy = true
      nhip.dung()
      if (hetVuot) clearTimeout(hetVuot)
      document.removeEventListener('visibilitychange', khiHien)
    }
  }, [token, bat])
  return v
}
