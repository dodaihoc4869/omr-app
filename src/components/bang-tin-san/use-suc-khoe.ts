// CHIP "Máy chủ: tốt / đang bận / nghẽn" của Bảng tin sàn — nhịp hỏi `POST /gv/suc-khoe-may-chu` mỗi 10 giây (useNhipThay: tab ẩn dừng, không chồng lệnh, hụt ⇒ lùi dần, máy chủ đề nghị giãn ⇒ giãn tối đa 20 s).
// Trạng thái: `null` = KHÔNG có chip (chưa có câu trả lời đầu / máy chủ chưa có lệnh / từ chối / sai dạng — không bịa "tốt"); còn lại = MAX của SO_MAU_CHIP lượt gần nhất (số đo mỗi isolate một khác). Hụt mạng ⇒ GIỮ chip cũ.
import { useCallback, useEffect, useRef, useState } from 'react'
import { laySucKhoeMay, mucCaoNhat, NHIP_SUC_KHOE_MS, SO_MAU_CHIP, THU_LAI_CHIP_SAU_KHI_TU_CHOI_MS, type MucMay } from '../../lib/suc-khoe-may-chu'
import { TUY_CHON_NHIP_THAY, useNhipThay } from '../../lib/nhip-may-thay'

export function useSucKhoeMay(bat = true): MucMay | null {
  const [muc, setMuc] = useState<MucMay | null>(null)
  const gan = useRef<MucMay[]>([])
  const chiHoiTu = useRef(0)
  const dangHoi = useRef(false)
  const conSong = useRef(true)
  /** `true` = tốt (kể cả máy chủ nói KHÔNG — đã có luật 5 phút riêng); `false` = hụt mạng / chậm ⇒ vòng lùi dần. */
  const lam = useCallback(async (): Promise<boolean> => {
    if (dangHoi.current || Date.now() < chiHoiTu.current) return true
    dangHoi.current = true
    try {
      const r = await laySucKhoeMay()
      if (!conSong.current) return true
      if (r.ok) {
        gan.current = [...gan.current, r.du].slice(-SO_MAU_CHIP)
        setMuc(mucCaoNhat(gan.current))
        return true
      }
      if (r.loai === 'chua_co_lenh' || r.loai === 'tu_choi' || r.loai === 'khong_doc_duoc') {
        chiHoiTu.current = Date.now() + THU_LAI_CHIP_SAU_KHI_TU_CHOI_MS
        gan.current = []
        setMuc(null)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      dangHoi.current = false
    }
  }, [])
  useEffect(() => {
    conSong.current = true
    if (bat) void lam()
    return () => {
      conSong.current = false
    }
  }, [lam, bat])
  useNhipThay(lam, NHIP_SUC_KHOE_MS, bat, TUY_CHON_NHIP_THAY.sucKhoeMay)
  return bat ? muc : null
}
