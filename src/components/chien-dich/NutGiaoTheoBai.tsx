// NÚT "GIAO THEO BÀI" ở mục Chiến dịch luyện (OMNI 3 · bảng A2 docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md: "Giao theo bài" = nút mở CÙNG luồng với bước
// "Bài hôm nay" của thẻ Dạy học ở mục Lên bảng — một luồng, hai lối vào). Chỉ hiện khi công tắc OMNI bật (`/gv/omni co-doc`); bấm ⇒ sang mục Lên bảng,
// mở sẵn thẻ Dạy học (khoá phiên `KHOA_MO_THE_DAY_HOC`, đọc một lần rồi xoá). OMNI tắt / máy chủ chưa có lệnh ⇒ không vẽ gì (màn như cũ).
import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { KHOA_MO_THE_DAY_HOC } from '../../lib/bai-hom-nay'
import { TEN_AI } from '../../lib/omni-chu'
import { docCoOmni } from './api-omni'

export default function NutGiaoTheoBai({ className = 'gv2-nut-vien' }: { className?: string }) {
  const setScreen = useAppStore((s) => s.setScreen)
  const [bat, setBat] = useState(false)
  useEffect(() => {
    let song = true
    void docCoOmni().then((r) => {
      if (song && r.ok && r.du.bat) setBat(true)
    })
    return () => {
      song = false
    }
  }, [])
  if (!bat) return null
  const mo = () => {
    try {
      sessionStorage.setItem(KHOA_MO_THE_DAY_HOC, '1')
    } catch {
      /* máy chặn bộ nhớ phiên: mục Lên bảng mở thẻ thứ nhất, thầy bấm thẻ Dạy học */
    }
    setScreen('goilenbang')
  }
  return (
    <button type="button" className={className} onClick={mo} title={`Tick bài vừa dạy ⇒ ${TEN_AI} tự giao luyện theo bài (Hành trình › Dạy học › Bài hôm nay)`}>
      Giao theo bài
    </button>
  )
}
