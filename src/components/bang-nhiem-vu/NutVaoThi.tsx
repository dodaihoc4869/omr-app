// VÙNG 4 — nút Vào thi: M3 extended FAB ở góc dưới phải. Tonal (KHÔNG phải nút
// nổi bật — màn chỉ có một nút filled là "Làm ngay"). Khi có ca đang mở cho lớp
// của em: đổi sang tertiary + chấm nhịp. Luật vào thi/mã ca nằm nguyên ở
// PhongVaoThi; nút này chỉ gọi `onVaoThi`.
//
// NHƯỜNG NÚT CHÍNH: nút nổi luôn nằm trên nội dung; khi nó sắp che nút "Làm …" của thẻ Làm ngay (điện thoại thấp / thẻ cao)
// thì mờ đi và không bấm trúng (data-nhuong) tới khi em cuộn khỏi chỗ đó. Bàn phím vẫn tới được (focus ⇒ hiện lại).
import { useEffect, useRef, useState } from 'react'
import { PencilLine } from 'lucide-react'

/** Hai hình chữ nhật có đè lên nhau không (chạm cạnh KHÔNG tính là đè). Ô rỗng (0×0, vd jsdom) ⇒ không đè. */
export function haiOChongNhau(a: DOMRect, b: DOMRect): boolean {
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
}

export default function NutVaoThi({ caDangMo = false, onVaoThi }: { caDangMo?: boolean; onVaoThi: () => void }) {
  const nut = useRef<HTMLButtonElement>(null)
  const [nhuong, setNhuong] = useState(false)

  useEffect(() => {
    let khung = 0
    const soi = () => {
      khung = 0
      const fab = nut.current
      const chinh = document.querySelector('.bnv-nut-chinh')
      setNhuong(!!fab && !!chinh && haiOChongNhau(fab.getBoundingClientRect(), chinh.getBoundingClientRect()))
    }
    const hen = () => {
      if (!khung) khung = requestAnimationFrame(soi)
    }
    soi()
    window.addEventListener('scroll', hen, true)
    window.addEventListener('resize', hen)
    const goc = nut.current?.closest('.bnv')
    const doi = typeof MutationObserver === 'function' && goc ? new MutationObserver(hen) : null
    if (doi && goc) doi.observe(goc, { childList: true, subtree: true })
    return () => {
      if (khung) cancelAnimationFrame(khung)
      window.removeEventListener('scroll', hen, true)
      window.removeEventListener('resize', hen)
      doi?.disconnect()
    }
  }, [])

  return (
    <button
      ref={nut}
      type="button"
      className="bnv-fab"
      data-ca-mo={caDangMo ? 'true' : 'false'}
      data-nhuong={nhuong ? 'true' : 'false'}
      onClick={onVaoThi}
    >
      {caDangMo ? <span className="bnv-fab-cham" aria-hidden="true" /> : <PencilLine size={22} aria-hidden="true" />}
      <span>{caDangMo ? 'Vào thi · ca đang mở' : 'Vào thi'}</span>
    </button>
  )
}
