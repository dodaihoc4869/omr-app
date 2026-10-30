// ĐIỂM DANH BUỔI HỌC — phần DÙNG CHUNG (hook + định dạng ngày), tách khỏi thẻ nổi giao diện cũ (TheDiemDanhHs.tsx) ngày 30/10 (máy yếu):
// giao diện «Trong» (TrongHs, khối Điểm danh đầu menu) chỉ cần phần này ⇒ thẻ nổi cũ + CSS của nó nạp lười, không nằm trong mảnh cổng lúc mở app.
// Luật điểm danh: xem đầu tệp TheDiemDanhHs.tsx.
import { useCallback, useEffect, useRef, useState } from 'react'
import { buoiCuaEm, emDiemDanh, maTuDuongDan, type BuoiCuaEm } from '../../lib/buoi-hoc-api'

// «Trong» (26/10, bản vẽ hs-mot-trang-menu): khối Điểm danh đứng đầu menu dọc dùng CHÍNH hook này (cùng lệnh, cùng luồng QR) — `an.daXong` / `xong.luc`
// chỉ để menu hiện «Đã điểm danh» (+ giờ em vừa bấm trên máy này); thẻ nổi bên dưới vẫn ẩn như cũ khi đã điểm danh từ trước.
export type TrangThaiDiemDanh = { loai: 'an'; daXong?: BuoiCuaEm } | { loai: 'cho'; buoi: BuoiCuaEm | null } | { loai: 'xong'; buoi: BuoiCuaEm; luc: number }

function xoaMaKhoiDuongDan() {
  try {
    const u = new URL(window.location.href)
    if (!u.searchParams.has('diem-danh')) return
    u.searchParams.delete('diem-danh')
    window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}${u.hash}`)
  } catch {
    /* trình duyệt cũ: để nguyên đường dẫn */
  }
}

/** "Buổi học 29/09/2026" ⇒ "29/09"; tên thầy tự đặt thì giữ nguyên. */
export function ngayGon(ten: string): string {
  const m = /(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?/.exec(ten)
  return m && /^Buổi học\s/.test(ten) ? `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}` : ten
}

/** Toàn bộ logic điểm danh của em (hỏi buổi, gửi mã, QR `?diem-danh=`). `bat` = false ⇒ như khi thẻ chưa gắn (không hỏi, không nghe); bật lại ⇒ hỏi lại. */
export function useDiemDanhHs(token: string, bat = true) {
  const [tt, setTt] = useState<TrangThaiDiemDanh>({ loai: 'an' })
  const [mo, setMo] = useState(false)
  const [ma, setMa] = useState('')
  const [loi, setLoi] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [tuQr, setTuQr] = useState(false)
  const oNhap = useRef<HTMLInputElement>(null)
  const daTuGui = useRef(false)

  const gui = useCallback(
    async (maGui: string) => {
      const m = maGui.replace(/\D/g, '')
      if (m.length !== 6) {
        setLoi('Mã điểm danh gồm 6 chữ số trên máy chiếu.')
        oNhap.current?.focus()
        return
      }
      setDangGui(true)
      setLoi('')
      const r = await emDiemDanh(token, m)
      setDangGui(false)
      if (r.ok) {
        setTt({ loai: 'xong', buoi: r.buoi, luc: Date.now() })
        setMa('')
        setMo(false)
      } else {
        setLoi(r.chu)
        setMo(true)
        oNhap.current?.focus()
      }
    },
    [token],
  )

  const hoi = useCallback(async () => {
    const b = await buoiCuaEm(token).catch(() => null)
    setTt((cu) => {
      if (cu.loai === 'xong') return cu
      if (!b) return cu.loai === 'cho' && !cu.buoi ? cu : { loai: 'an' }
      // Đã điểm danh từ trước (mở lại app / đóng màn khác) ⇒ không làm phiền nữa; báo "đã điểm danh" chỉ ngay sau lượt em bấm.
      return b.daDiemDanh ? { loai: 'an', daXong: b } : { loai: 'cho', buoi: b }
    })
  }, [token])

  useEffect(() => {
    if (!bat) return
    // QUÉT QR: mã có sẵn trong đường dẫn ⇒ gửi ngay một lần rồi xoá khỏi đường dẫn (tải lại trang không gửi lại).
    const maUrl = typeof window !== 'undefined' ? maTuDuongDan(window.location.search) : ''
    if (maUrl && !daTuGui.current) {
      daTuGui.current = true
      xoaMaKhoiDuongDan()
      setTt({ loai: 'cho', buoi: null })
      setTuQr(true)
      void gui(maUrl)
    }
    void hoi()
    const hien = () => {
      if (document.visibilityState === 'visible') void hoi()
    }
    document.addEventListener('visibilitychange', hien)
    // em vừa từ màn khác về Lộ trình (StudentPortalScreen `SU_KIEN_VE_LO_TRINH`) ⇒ hỏi lại buổi đang mở
    const ve = () => { void hoi() }
    window.addEventListener('ddh-ve-lo-trinh', ve)
    return () => { document.removeEventListener('visibilitychange', hien); window.removeEventListener('ddh-ve-lo-trinh', ve) }
  }, [gui, hoi, bat])

  return { tt, setTt, mo, setMo, ma, setMa, loi, setLoi, dangGui, gui, oNhap, tuQr }
}
