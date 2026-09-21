// Vòng CHẠY của hàng đợi nộp lại (logic thuần ở `hang-doi-nop.ts`). Gắn MỘT lần ở cổng học sinh.
// Luật: mỗi lần chỉ MỘT lượt thử bay (tuần tự — không thêm tải lên máy chủ đang nghẽn); tab ẩn thì hoãn; mạng có lại ⇒ thử sớm (2–10 giây, lệch ngẫu nhiên) chứ không
// đập ngay; lỗi ⇒ `sauLanThu` lùi dần 20 → 40 → 80 → 160 → 300 giây; máy chủ từ chối hẳn ⇒ gỡ khỏi hàng (xuLy trả 'bo').
import { useCallback, useEffect, useRef, useState } from 'react'
import { boMucQuaTuoi, demHangCuaEm, docHangTuKho, henSomNhat, luuHangVaoKho, mucDenHan, sauLanThu, themMuc, type KetQuaThu, type MucHang } from './hang-doi-nop'

export interface TuyChonHang {
  now?: () => number
  ngauNhien?: () => number
  /** Kho lưu (test); mặc định localStorage. */
  kho?: Pick<Storage, 'getItem' | 'setItem'> | null
}

export interface HangDoiNop {
  /** Số việc của em đang chờ (để vẽ dòng "Đã lưu ở máy N bài"). */
  soCho: number
  them: (m: Omit<MucHang, 'tao' | 'lanThu' | 'henLuc'>) => void
  go: (id: string) => void
  daCo: (id: string) => boolean
}

export function useHangDoiNop(sbd: string | undefined, xuLy: (m: MucHang) => Promise<KetQuaThu>, o: TuyChonHang = {}): HangDoiNop {
  const bayGio = o.now ?? Date.now
  const nn = o.ngauNhien ?? Math.random
  const kho = o.kho
  const [ds, setDs] = useState<MucHang[]>(() => boMucQuaTuoi(kho === undefined ? docHangTuKho() : docHangTuKho(kho), bayGio()))
  const dsRef = useRef(ds)
  const xuLyRef = useRef(xuLy)
  xuLyRef.current = xuLy
  const dangBay = useRef(false)
  const [nhip, setNhip] = useState(0) // đổi để lập lại lịch hẹn (mạng có lại / tab hiện)

  const capNhat = useCallback(
    (f: (cu: MucHang[]) => MucHang[]) => {
      dsRef.current = f(dsRef.current)
      setDs(dsRef.current)
      if (kho === undefined) luuHangVaoKho(dsRef.current)
      else luuHangVaoKho(dsRef.current, kho)
    },
    [kho],
  )

  const them = useCallback(
    (m: Omit<MucHang, 'tao' | 'lanThu' | 'henLuc'>) => capNhat((cu) => themMuc(cu, m, bayGio(), nn)),
    [capNhat], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const go = useCallback((id: string) => capNhat((cu) => cu.filter((m) => m.id !== id)), [capNhat])
  const daCo = useCallback((id: string) => dsRef.current.some((m) => m.id === id), [])

  useEffect(() => {
    if (!sbd) return
    let huy = false
    let gio: ReturnType<typeof setTimeout> | undefined
    const chay = async () => {
      if (huy || dangBay.current) return
      const den = mucDenHan(dsRef.current, sbd, bayGio())[0]
      if (!den) return
      if (typeof document !== 'undefined' && document.hidden) return // hẹn lại khi tab hiện (visibilitychange bên dưới)
      dangBay.current = true
      let kq: KetQuaThu = 'ban'
      try {
        kq = await xuLyRef.current(den)
      } catch {
        kq = 'ban'
      } finally {
        dangBay.current = false
      }
      if (huy) return
      capNhat((cu) => sauLanThu(cu, den.id, kq, bayGio(), nn))
    }
    const cho = henSomNhat(dsRef.current, sbd, bayGio())
    if (cho !== null) gio = setTimeout(() => void chay(), cho)
    const khiHien = () => {
      if (typeof document === 'undefined' || !document.hidden) setNhip((n) => n + 1)
    }
    const khiCoMang = () => {
      // Mạng có lại: kéo mục sớm nhất lên trong 2–10 giây (không đập ngay, không bỏ qua lệch pha).
      const som = henSomNhat(dsRef.current, sbd, bayGio(), 0)
      if (som !== null && som > 10_000) {
        const t = bayGio() + 2000 + Math.round(nn() * 8000)
        capNhat((cu) => {
          const dau = [...cu].filter((m) => m.sbd === sbd).sort((a, b) => a.henLuc - b.henLuc)[0]
          return dau ? cu.map((m) => (m.id === dau.id ? { ...m, henLuc: Math.min(m.henLuc, t) } : m)) : cu
        })
      }
    }
    document.addEventListener('visibilitychange', khiHien)
    window.addEventListener('online', khiCoMang)
    return () => {
      huy = true
      if (gio) clearTimeout(gio)
      document.removeEventListener('visibilitychange', khiHien)
      window.removeEventListener('online', khiCoMang)
    }
  }, [sbd, ds, nhip, capNhat]) // eslint-disable-line react-hooks/exhaustive-deps

  return { soCho: sbd ? demHangCuaEm(ds, sbd) : 0, them, go, daCo }
}
