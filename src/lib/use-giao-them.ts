// Trạng thái nút "Giao thêm bài cho con" của phụ huynh. Nạp `chiXem` một lần (không tính lượt); bấm ⇒ GIAO; bấm đúp bị chặn ở máy (và ở máy chủ: khoá theo phút).
// App PH chỉ còn MỘT đường giao bài: đọc trạng thái lỗi ⇒ thẻ lỗi (lời thật của máy chủ) ngay dưới nút, nút VẪN bấm được để thử lại. `san` = máy chủ đã trả trạng thái. Không ném lỗi.
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
  /** Máy chủ đã trả trạng thái nút (có lệnh + nhận danh tính); false = chưa nạp xong hoặc lỗi (khi lỗi có thẻ `the` kiểu `loi`). */
  san: boolean
  dangTai: boolean
  conLai: number | null
  goiGanNhat: GoiGanNhat | null
  the: TheGiaoThem | null
  dangGui: boolean
  giao: () => void
}

const CHU_LOI_CHUNG = 'Chưa giao được bài lúc này. Anh/chị chưa mất lượt nào, thử lại sau ít phút.'

/** `sbd`: SBD trần của con — dùng khi máy phụ huynh KHÔNG có mã liên kết riêng (cả hai kiểu đăng nhập đều giao được bài). */
export function useGiaoThem(bat: boolean, api: (chiXem: boolean, sbd?: string) => Promise<PhanHoiGiaoThem> = phGiaoThemApi, sbd?: string): ViewGiaoThem {
  const [s, setS] = useState<Omit<ViewGiaoThem, 'giao'>>({ san: false, dangTai: bat, conLai: null, goiGanNhat: null, the: null, dangGui: false })
  const dangGui = useRef(false)
  // `api` đi qua ref: truyền hàm mới mỗi lần vẽ (vd trong test) không làm nạp lại vô hạn.
  const apiRef = useRef(api)
  apiRef.current = api
  const sbdRef = useRef(sbd)
  sbdRef.current = sbd
  useEffect(() => {
    if (!bat) {
      setS((x) => ({ ...x, san: false, dangTai: false }))
      return
    }
    let huy = false
    setS((x) => ({ ...x, dangTai: true }))
    void apiRef.current(true, sbdRef.current).then((p) => {
      if (huy) return
      if (p.kieu === 'ok') setS((x) => ({ ...x, san: true, dangTai: false, conLai: p.kq.conLaiHomNay, goiGanNhat: p.kq.goiGanNhat }))
      else setS((x) => ({ ...x, san: false, dangTai: false, the: { kieu: 'loi', tieuDe: 'Chưa xem được số lượt hôm nay', dong: [p.kieu === 'loi' ? p.chu : CHU_LOI_CHUNG], cuoi: '' } }))
    })
    return () => {
      huy = true
    }
  }, [bat, sbd])

  const giao = useCallback(() => {
    if (dangGui.current) return
    dangGui.current = true
    setS((x) => ({ ...x, dangGui: true, the: null }))
    void apiRef.current(false, sbdRef.current)
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
