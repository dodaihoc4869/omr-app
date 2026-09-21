// Trạng thái nút "Giao thêm bài cho con" của phụ huynh. Nạp `chiXem` một lần (không tính lượt); bấm ⇒ GIAO; bấm đúp bị chặn ở máy (và ở máy chủ: khoá theo phút).
// Máy chủ chưa có lệnh (`san = false`) ⇒ màn giữ đường giao bài cũ. Không ném lỗi.
import { useCallback, useEffect, useRef, useState } from 'react'
import { phGiaoThemApi, type PhanHoiGiaoThem } from './giao-them-api'
import { theTuChoi, theXacNhan, type GoiGanNhat } from './giao-them-hien-thi'

export interface TheGiaoThem {
  kieu: 'da_giao' | 'tu_choi' | 'loi'
  tieuDe: string
  dong: string[]
  cuoi: string
}
export interface ViewGiaoThem {
  /** Máy chủ CÓ lệnh `/ph/giao-them` ⇒ dùng giao diện mới; false ⇒ giữ đường cũ. */
  san: boolean
  dangTai: boolean
  conLai: number | null
  goiGanNhat: GoiGanNhat | null
  the: TheGiaoThem | null
  dangGui: boolean
  giao: () => void
}

const CHU_LOI_CHUNG = 'Chưa giao được bài lúc này. Anh/chị chưa mất lượt nào, thử lại sau ít phút.'

export function useGiaoThem(bat: boolean, api: (chiXem: boolean) => Promise<PhanHoiGiaoThem> = phGiaoThemApi): ViewGiaoThem {
  const [s, setS] = useState<Omit<ViewGiaoThem, 'giao'>>({ san: false, dangTai: bat, conLai: null, goiGanNhat: null, the: null, dangGui: false })
  const dangGui = useRef(false)
  // `api` đi qua ref: truyền hàm mới mỗi lần vẽ (vd trong test) không làm nạp lại vô hạn.
  const apiRef = useRef(api)
  apiRef.current = api
  useEffect(() => {
    if (!bat) {
      setS((x) => ({ ...x, san: false, dangTai: false }))
      return
    }
    let huy = false
    setS((x) => ({ ...x, dangTai: true }))
    void apiRef.current(true).then((p) => {
      if (huy) return
      if (p.kieu === 'ok') setS((x) => ({ ...x, san: true, dangTai: false, conLai: p.kq.conLaiHomNay, goiGanNhat: p.kq.goiGanNhat }))
      else setS((x) => ({ ...x, san: false, dangTai: false }))
    })
    return () => {
      huy = true
    }
  }, [bat])

  const giao = useCallback(() => {
    if (dangGui.current) return
    dangGui.current = true
    setS((x) => ({ ...x, dangGui: true, the: null }))
    void apiRef.current(false)
      .then((p) => {
        setS((x) => {
          if (p.kieu !== 'ok') return { ...x, the: { kieu: 'loi', tieuDe: 'Chưa giao được bài', dong: [p.kieu === 'loi' ? p.chu : CHU_LOI_CHUNG], cuoi: '' } }
          const conLai = p.kq.conLaiHomNay ?? x.conLai
          if (p.kq.daGiao) return { ...x, conLai, goiGanNhat: p.kq.goiGanNhat ?? x.goiGanNhat, the: { kieu: 'da_giao', ...theXacNhan(p.kq.daGiao, conLai) } }
          if (p.kq.tuChoi) return { ...x, conLai, the: { kieu: 'tu_choi', ...theTuChoi(p.kq.tuChoi) } }
          return { ...x, conLai, the: { kieu: 'loi', tieuDe: 'Chưa giao được bài', dong: [CHU_LOI_CHUNG], cuoi: '' } }
        })
      })
      .finally(() => {
        dangGui.current = false
        setS((x) => ({ ...x, dangGui: false }))
      })
  }, [])

  return { ...s, giao }
}
