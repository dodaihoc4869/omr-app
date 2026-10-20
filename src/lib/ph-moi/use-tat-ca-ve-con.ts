// Nạp "mọi thứ về con" cho app phụ huynh mới: nạp khi vào; làm mới mỗi 60 giây khi tab đang hiện (tab ẩn ⇒ bỏ lượt, hiện lại ⇒ nạp ngay); lỗi nhất thời GIỮ bản cũ (không nhấp nháy mất màn);
// lỗi khi CHƯA có bản nào ⇒ trạng thái `loi` kèm câu thật + `thuLai()`. Hàm gọi đi qua ref (truyền hàm mới mỗi lần vẽ không nạp lại vô hạn).
import { useCallback, useEffect, useRef, useState } from 'react'
import { taiTatCaVeCon, type PhanHoiTatCa } from './api'
import type { PhMoi } from './du-lieu'
import { batNhipBenVung } from '../nhip-ben-vung'
import { docPass } from '../ph-token'
import { usePassPhuHuynh } from './use-pass'

export const NHIP_PH_MOI_MS = 180_000 // sự cố D1 21/09: 60 s × mọi máy phụ huynh ⇒ 180 s ± 30 s (lỗi ⇒ lùi 30→60→120→300 s, quay lại tab dội ≥ 20 s)
export type TrangThaiPhMoi = 'tai' | 'ok' | 'loi'
export interface ViewPhMoi {
  trangThai: TrangThaiPhMoi
  pm: PhMoi | null
  chuLoi: string
  /** Đang nạp lại (đã có bản cũ hoặc bấm "Thử lại"). */
  dangLamMoi: boolean
  /** Nhịp đọc thật sau lần mở đầu; các khối phụ nạp cùng lượt, không nạp lại khi bản đầu về. */
  lanLamMoi?: number
  thuLai: () => void
}

export function useTatCaVeCon(sbd: string | null, api: (sbd: string) => Promise<PhanHoiTatCa> = taiTatCaVeCon): ViewPhMoi {
  const pass = usePassPhuHuynh()
  const [s, setS] = useState<Omit<ViewPhMoi, 'thuLai'>>({ trangThai: 'tai', pm: null, chuLoi: '', dangLamMoi: false })
  const chuDuLieu = useRef({ sbd, pass })
  const apiRef = useRef(api)
  apiRef.current = api
  const nap = useRef<() => void>(() => {})
  useEffect(() => {
    chuDuLieu.current = { sbd, pass }
    setS({ trangThai: 'tai', pm: null, chuLoi: '', dangLamMoi: false })
    if (!sbd) {
      setS({ trangThai: 'tai', pm: null, chuLoi: '', dangLamMoi: false })
      nap.current = () => {}
      return
    }
    let huy = false
    let dangChay: Promise<boolean> | null = null
    let lanDoc = 0
    const doc = async (): Promise<boolean> => {
      if (huy || docPass() !== pass) return true
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return true
      const lanLamMoi = lanDoc++
      setS((x) => ({ ...x, dangLamMoi: true, lanLamMoi }))
      let r: PhanHoiTatCa
      try {
        r = await apiRef.current(sbd)
      } catch {
        if (huy || docPass() !== pass) return true
        setS((x) => ({ ...x, trangThai: x.pm ? 'ok' : 'loi', chuLoi: 'Chưa tải được báo cáo của con. Anh/chị thử lại sau ít phút.', dangLamMoi: false }))
        return false
      }
      if (huy || docPass() !== pass) return true
      if (r.kieu === 'ok') setS({ trangThai: 'ok', pm: r.pm, chuLoi: '', dangLamMoi: false, lanLamMoi })
      else setS((x) => (x.pm ? { ...x, chuLoi: r.chu, dangLamMoi: false } : { trangThai: 'loi', pm: null, chuLoi: r.chu, dangLamMoi: false, lanLamMoi }))
      return r.kieu === 'ok'
    }
    // Tải lại tay và nhịp nền dùng chung lượt đang đọc; không để bản về muộn ghi đè bản mới.
    const chay = (): Promise<boolean> => dangChay ??= doc().finally(() => { dangChay = null })
    nap.current = () => void chay() // nút "làm mới" của phụ huynh: gọi NGAY, không qua nhịp
    const nhip = batNhipBenVung(chay, { coSoMs: NHIP_PH_MOI_MS })
    const khiHien = () => {
      if (document.visibilityState === 'visible') nhip.kich()
    }
    document.addEventListener('visibilitychange', khiHien)
    // Có mạng lại sau lỗi (thang máy, vùng sóng yếu): đọc ngay thay vì chờ nhịp lùi 30–300 s. Đi qua `kich()` nên vẫn chặn dội ≥ 20 s và không chạy chồng lượt đang bay.
    window.addEventListener('online', khiHien)
    return () => {
      huy = true
      nhip.dung()
      document.removeEventListener('visibilitychange', khiHien)
      window.removeEventListener('online', khiHien)
    }
  }, [sbd, pass])
  const thuLai = useCallback(() => {
    setS((x) => (x.pm ? x : { ...x, trangThai: 'tai', chuLoi: '' }))
    nap.current()
  }, [])
  // Không vẽ báo cáo của em trước trong lượt render đầu tiên sau đổi SBD.
  return chuDuLieu.current.sbd === sbd && chuDuLieu.current.pass === pass ? { ...s, thuLai } : { trangThai: 'tai', pm: null, chuLoi: '', dangLamMoi: false, thuLai }
}
