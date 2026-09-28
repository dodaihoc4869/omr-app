// ĐỔI TÊN THẦN THÚ (thầy 28/09: "cho app học sinh đổi tên thần thú được nhé"). Dùng hộp chung HopXacNhan (ô nhập + đếm x/16),
// mở qua cổng ra body trong vỏ `.m3` (như hop-thoai.tsx). Luật tên = pet-name.ts (cùng luật máy chủ `rename`): soát ngay ở máy
// để báo lỗi tức thì, rồi máy chủ soát lại + đếm 3 lần/ngày. Lỗi hiện NGAY DƯỚI Ô, hộp vẫn mở; nút "Lưu tên" mờ khi đang gửi, giữ chữ.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import HopXacNhan from '../HopXacNhan'
import { normalizePetName, TEN_TOI_DA } from '../../game/than-thu-v2/pet-name'

export default function HopDoiTen({ tenHienTai, onLuu, onDong }: { tenHienTai: string; onLuu: (ten: string) => Promise<void>; onDong: () => void }) {
  const [loi, setLoi] = useState('')
  const [dangLam, setDangLam] = useState(false)
  const luu = async (go?: string) => {
    let ten: string
    try {
      ten = normalizePetName(go ?? '')
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Tên chưa hợp lệ.')
      return
    }
    if (ten === tenHienTai) return onDong()
    setLoi('')
    setDangLam(true)
    try {
      await onLuu(ten)
      onDong()
    } catch (e) {
      setLoi(e instanceof Error && e.message ? e.message : 'Chưa lưu được tên. Em thử lại nhé.')
      setDangLam(false)
    }
  }
  return createPortal(
    <div className="m3" style={{ display: 'contents' }} data-vo-cong="doi-ten-thu">
      <HopXacNhan
        tieuDe="Đổi tên thần thú"
        noiDung={<p>Tên mới hiện ở Sảnh, Đảo và cho bạn cùng Đoàn Hộ Tống. Mỗi ngày em đổi được tối đa 3 lần.</p>}
        nhap={{ nhan: 'Tên thần thú', macDinh: tenHienTai, batBuoc: true, toiDa: TEN_TOI_DA, onDoi: () => loi && setLoi('') }}
        loi={loi}
        nhanXacNhan="Lưu tên"
        nhanDangLam="Lưu tên"
        dangLam={dangLam}
        onXacNhan={(g) => void luu(g)}
        onHuy={onDong}
      />
    </div>,
    document.body,
  )
}
