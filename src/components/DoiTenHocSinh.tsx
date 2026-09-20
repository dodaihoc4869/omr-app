import { useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { chuanHoaTen, doiTenHocSinh, TEN_TOI_DA, type KetQuaDoiTen } from '../lib/doi-ten-hs-api'

/** TIÊU ĐỀ TÊN EM + nút bút chì "Đổi tên học sinh" trong hồ sơ (thầy lệnh 21/09; hợp đồng docs/hop-dong-doi-ten-hoc-sinh-2109.md mục 2).
 *  Bấm bút chì → ô nhập tại chỗ (điền sẵn tên cũ) + Lưu / Huỷ; Enter = Lưu, Esc = Huỷ. Lưu gọi lệnh máy chủ: thành công → `onXong` (màn cập nhật danh sách lớp
 *  trên máy thầy, tải lại hồ sơ, báo "Đã đổi tên: «cũ» → «mới»"); lỗi/từ chối → hiện đúng lý do, GIỮ ô nhập. Không tự đổi riêng ở máy thầy. */
export default function DoiTenHocSinh({ sbd, hoTen, onXong }: { sbd: string; hoTen: string; onXong: (k: KetQuaDoiTen) => void | Promise<void> }) {
  const [sua, setSua] = useState(false)
  const [nhap, setNhap] = useState('')
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const nutBut = useRef<HTMLButtonElement>(null)
  const hienTen = hoTen || `SBD ${sbd}`

  const mo = () => {
    setNhap(hoTen)
    setLoi('')
    setSua(true)
  }
  const huy = () => {
    setSua(false)
    setLoi('')
    requestAnimationFrame(() => nutBut.current?.focus())
  }
  const luu = async () => {
    if (dang) return
    const c = chuanHoaTen(nhap)
    if (!c.ok) return setLoi(c.loi)
    if (c.ten === hoTen) return setLoi('Tên mới trùng tên cũ — không có gì để đổi.')
    setDang(true)
    setLoi('')
    try {
      const k = await doiTenHocSinh(sbd, c.ten)
      if (k.khongDoi) {
        setLoi('Tên mới trùng tên cũ — không có gì để đổi.')
        return
      }
      setSua(false)
      await onXong(k)
      requestAnimationFrame(() => nutBut.current?.focus())
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không đổi được tên.')
    } finally {
      setDang(false)
    }
  }

  if (!sua) {
    return (
      <div className="hs-ten-dong">
        <h2 className="hs-ho-so-ten">{hienTen}</h2>
        <button ref={nutBut} type="button" className="tap-target hs-nut-but" aria-label="Đổi tên học sinh" title="Đổi tên học sinh" onClick={mo}>
          <Pencil size={16} aria-hidden="true" />
        </button>
      </div>
    )
  }
  return (
    <div className="hs-doi-ten" role="group" aria-label="Đổi tên học sinh">
      <div className="hs-doi-ten-hang">
        <input
          autoFocus
          className="hs-doi-ten-o"
          value={nhap}
          maxLength={TEN_TOI_DA + 20}
          aria-label="Tên mới của học sinh"
          aria-invalid={loi ? true : undefined}
          onChange={(e) => setNhap(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void luu()
            if (e.key === 'Escape') huy()
          }}
        />
        <button type="button" className="tap-target hs-nut-chinh" disabled={dang} onClick={() => void luu()}>
          {dang ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button type="button" className="tap-target hs-nut-vien" disabled={dang} onClick={huy}>
          Huỷ
        </button>
      </div>
      {loi && (
        <p className="hs-doi-ten-loi" role="alert">
          {loi}
        </p>
      )}
      <p className="hs-doi-ten-ghi-chu">
        Tên mới hiện ở app học sinh và phụ huynh từ lần mở app kế tiếp. Nếu danh sách lớp gốc (file/Sheet) còn tên cũ, sửa cả ở đó — nạp lại danh sách sẽ ghi đè tên.
      </p>
    </div>
  )
}
