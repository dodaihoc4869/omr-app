// NÚT «VÀO BÌNH PHẢN ỨNG» trên khối «Đã điểm danh» của máy em (thầy 07/11: «học sinh bị văng muốn vào lại chưa có nút, sau khi điểm danh thì
// nút điểm danh có thêm chỗ vào bình phản ứng, bấm vào đó load vào lại được»). Nạp lười màn máy em (gan-hs) — không thêm byte mở app.
// Đang thi / phòng chờ / kiểm tra cá nhân ⇒ moBpuHs từ chối (không cướp màn), nút báo nhẹ.
import { useState } from 'react'

export default function NutVaoBpu({ token, buoiId }: { token: string; buoiId: string }) {
  const [chu, setChu] = useState('')
  const vao = () => {
    setChu('')
    void import('./gan-hs').then((m) => { if (!m.moBpuHs(token, buoiId)) setChu('Em đang làm bài kiểm tra — làm xong rồi vào lại.') }).catch(() => setChu('Chưa mở được. Em thử lại.'))
  }
  return (
    <>
      <button type="button" className="tr-dd-nut" onClick={vao}>Vào Bình Phản Ứng</button>
      {chu && <p className="tr-dd-phu" role="status">{chu}</p>}
    </>
  )
}
