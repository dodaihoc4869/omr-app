// NÚT «VÀO BÌNH PHẢN ỨNG» trên khối «Đã điểm danh» của máy em (thầy 07/11: «học sinh bị văng muốn vào lại chưa có nút, sau khi điểm danh thì
// nút điểm danh có thêm chỗ vào bình phản ứng, bấm vào đó load vào lại được»). Nạp lười màn máy em (gan-hs) — không thêm byte mở app.
// Đang thi / phòng chờ / kiểm tra cá nhân ⇒ moBpuHs từ chối (không cướp màn), nút báo nhẹ. Bấm ⇒ xin quyền phân biệt tắt màn (10/11, mã ở mảnh lười).
import { useEffect, useState } from 'react'

export default function NutVaoBpu({ token, buoiId }: { token: string; buoiId: string }) {
  const [chu, setChu] = useState('')
  // Đã điểm danh ⇒ nối phòng SẴN (màn ẩn) để câu thầy mở hiện TỨC THÌ (thầy 07/11).
  useEffect(() => { void import('./gan-hs').then((m) => m.nenBpuHs(token, buoiId)).catch(() => {}) }, [token, buoiId])
  const vao = () => {
    setChu('')
    void import('./gan-hs').then((m) => { m.xinQuyenTatMan(); if (!m.moBpuHs(token, buoiId)) setChu('Em đang làm bài kiểm tra — làm xong rồi vào lại.') }).catch(() => setChu('Chưa mở được. Em thử lại.'))
  }
  return (
    <>
      <button type="button" className="tr-dd-nut" onClick={vao}>Vào Bình Phản Ứng</button>
      {chu && <p className="tr-dd-phu" role="status">{chu}</p>}
    </>
  )
}
