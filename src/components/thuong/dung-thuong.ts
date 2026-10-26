// MÓC DỮ LIỆU THƯỞNG PHẠT: vẽ NGAY từ bản gần nhất ở máy (thuong-api: localStorage có try/catch), rồi cập nhật khi máy chủ trả — không chờ mạng, không chớp số.
// Lỗi / mất mạng ⇒ giữ bản gần nhất, trả `loi` để màn hiện nút «Thử lại». Sau một lệnh ghi (mở rương, mua bình…) gọi capNhatTongQuan ⇒ mọi chỗ đang hiện
// tổng quan (thanh trên, các màn) cùng đổi số.
import { useCallback, useEffect, useState } from 'react'
import { DUONG, khoaTam, layTam, layTongQuan, type KetQua, type TongQuanThuong } from '../../lib/thuong-api'

const SU_KIEN = 'ddh-thuong-moi'

export interface Tai<T> { du: T | undefined; tai: boolean; loi: string; thuLai: () => void; datDu: (d: T) => void }

export function useTai<T>(token: string | undefined, duong: string, lay: (token: string) => Promise<KetQua<T>>, bat = true): Tai<T> {
  const khoa = token ? khoaTam(duong, token) : ''
  const [du, setDu] = useState<T | undefined>(() => (khoa ? layTam<T>(khoa) : undefined))
  const [tai, setTai] = useState(!!token && bat)
  const [loi, setLoi] = useState('')
  const [lan, setLan] = useState(0)
  useEffect(() => {
    if (!token || !bat) { setTai(false); return }
    let song = true
    setTai(true)
    void lay(token).then((r) => {
      if (!song) return
      if (r.ok) { setDu(r.du); setLoi('') } else setLoi(r.chu)
      setTai(false)
    })
    return () => { song = false }
  }, [token, khoa, lan, bat, lay])
  useEffect(() => {
    if (!khoa) return
    const nghe = (e: Event) => { if ((e as CustomEvent).detail === khoa) { const d = layTam<T>(khoa); if (d !== undefined) setDu(d) } }
    window.addEventListener(SU_KIEN, nghe)
    return () => window.removeEventListener(SU_KIEN, nghe)
  }, [khoa])
  const thuLai = useCallback(() => setLan((n) => n + 1), [])
  return { du, tai, loi, thuLai, datDu: setDu }
}

export const useTongQuan = (token: string | undefined): Tai<TongQuanThuong> => useTai(token, DUONG.tongQuan, layTongQuan)

/** Sau một lệnh ghi: đọc lại tổng quan rồi báo mọi chỗ đang hiện. */
export async function capNhatTongQuan(token: string): Promise<void> {
  const r = await layTongQuan(token)
  if (r.ok) window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: khoaTam(DUONG.tongQuan, token) }))
}
/** Báo mọi chỗ đang hiện `duong` đọc lại bản tạm (đã ghi bởi lệnh đọc vừa xong). */
export function baoMoi(duong: string, token: string): void { window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: khoaTam(duong, token) })) }
