// Vòng CHẠY của hàng đợi nộp lại (logic thuần ở `hang-doi-nop.ts`). Gắn MỘT lần ở cổng học sinh.
// Luật: mỗi lần chỉ MỘT lượt thử bay (tuần tự — không thêm tải lên máy chủ đang nghẽn); tab ẩn thì hoãn; mạng có lại ⇒ thử sớm (2–10 giây, lệch ngẫu nhiên) chứ không
// đập ngay; lỗi ⇒ `sauLanThu` lùi dần 20 → 40 → 80 → 160 → 300 giây; máy chủ từ chối hẳn ⇒ gỡ khỏi hàng (xuLy trả 'bo').
// NHIỀU TAB CÙNG MỘT MÁY (Boss soi 21/09): KHO là nguồn sự thật — mỗi lần chạy / sửa đều đọc lại kho, TRƯỚC khi gửi "giữ chỗ" mục (hẹn lùi 90 giây, ghi vào kho) để tab kia thấy và bỏ
// lượt; tab kia nộp xong/gỡ thì sự kiện `storage` cập nhật số việc chờ. Hai máy khác nhau không phối hợp được — máy chủ idempotent lo phần đó.
import { useCallback, useEffect, useRef, useState } from 'react'
import { KHOA_LUU_HANG, boMucQuaTuoi, demHangCuaEm, docHang, docHangTuKho, henSomNhat, luuHangVaoKho, mucDenHan, sauLanThu, themMuc, type KetQuaThu, type MucHang } from './hang-doi-nop'

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

  /** Đọc lại kho (tab khác có thể đã nhận / nộp / thêm việc). Kho không đọc được ⇒ giữ bản trong bộ nhớ. */
  const lamMoiTuKho = useCallback(() => {
    try {
      const k = kho === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : kho
      if (k) dsRef.current = docHang(k.getItem(KHOA_LUU_HANG))
    } catch {
      /* giữ bản trong bộ nhớ */
    }
  }, [kho])

  const capNhat = useCallback(
    (f: (cu: MucHang[]) => MucHang[]) => {
      lamMoiTuKho()
      dsRef.current = f(dsRef.current)
      setDs(dsRef.current)
      if (kho === undefined) luuHangVaoKho(dsRef.current)
      else luuHangVaoKho(dsRef.current, kho)
    },
    [kho, lamMoiTuKho],
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
      if (typeof document !== 'undefined' && document.hidden) return // hẹn lại khi tab hiện (visibilitychange bên dưới)
      lamMoiTuKho() // tab khác có thể đã nộp / nhận việc này
      const den = mucDenHan(dsRef.current, sbd, bayGio())[0]
      if (!den) {
        setDs(dsRef.current) // việc đã bị tab khác gỡ ⇒ số việc chờ cập nhật, lập lại lịch
        return
      }
      // GIỮ CHỖ: hẹn lùi 90 giây và ghi vào kho ngay (tab khác đọc kho thấy mục chưa đến hạn ⇒ bỏ lượt). Lượt này xong thì `sauLanThu` đặt lại hạn đúng.
      capNhat((cu) => cu.map((m) => (m.id === den.id ? { ...m, henLuc: bayGio() + 90_000 } : m)))
      dangBay.current = true
      let kq: KetQuaThu = 'ban'
      try {
        kq = await xuLyRef.current(den)
      } catch {
        kq = 'ban'
      } finally {
        dangBay.current = false
      }
      // KHÔNG bỏ qua khi `huy`: giữ chỗ ở trên đổi state nên hiệu ứng này đã chạy lại trong lúc chờ; kết quả lượt bay luôn phải ghi vào hàng (đổi em / đóng tab cũng vậy).
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
    // Tab khác đổi hàng (nhận việc, nộp xong, thêm việc) ⇒ đọc lại và lập lại lịch (chỉ khi dùng localStorage thật).
    const khiKhoDoi = (e: StorageEvent) => {
      if (e.key !== KHOA_LUU_HANG) return
      dsRef.current = docHang(e.newValue)
      setDs(dsRef.current)
    }
    document.addEventListener('visibilitychange', khiHien)
    window.addEventListener('online', khiCoMang)
    if (kho === undefined) window.addEventListener('storage', khiKhoDoi)
    return () => {
      huy = true
      if (gio) clearTimeout(gio)
      document.removeEventListener('visibilitychange', khiHien)
      window.removeEventListener('online', khiCoMang)
      if (kho === undefined) window.removeEventListener('storage', khiKhoDoi)
    }
  }, [sbd, ds, nhip, capNhat, lamMoiTuKho]) // eslint-disable-line react-hooks/exhaustive-deps

  return { soCho: sbd ? demHangCuaEm(ds, sbd) : 0, them, go, daCo }
}
