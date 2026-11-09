// NÚT «ĐIỂM DANH» Ở ĐẦU MÀN HÔM NAY (thầy 09/11: «chuyển nút điểm danh ra màn hôm nay, bỏ hẳn thẻ hành trình, khi bấm nút điểm danh tự động hiện ra
// mọi thứ chọn như đang làm»). Bấm ⇒ (nạp lười src/lib/bpu/diem-danh-nhanh.ts) buổi đang mở / mở buổi mới ⇒ bảng Bình Phản Ứng chiếu điểm danh
// ⇒ «Xong điểm danh · Chọn câu» ngay trên bảng. Thầy dạy nhiều lớp ⇒ hộp nhỏ hỏi lớp. Không thêm lệnh nào lúc mở màn.
import { useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export default function NutDiemDanh({ className }: { className: string }) {
  const showToast = useAppStore((s) => s.showToast)
  const [dang, setDang] = useState(false)
  const [hoi, setHoi] = useState<{ ds: string[]; tra: (l: string | null) => void } | null>(null)
  const hop = useRef<HTMLDivElement>(null)
  useEffect(() => { if (hoi) hop.current?.querySelector('button')?.focus() }, [hoi])
  const bam = async () => {
    if (dang) return
    setDang(true)
    try {
      const m = await import('../../lib/bpu/diem-danh-nhanh')
      const loi = await m.batDauDiemDanh((ds) => (ds.length ? new Promise((tra) => setHoi({ ds, tra })) : Promise.resolve('')))
      if (loi) showToast(loi, 'warn')
    } catch {
      showToast('Chưa mở được điểm danh. Thầy thử lại.', 'warn')
    } finally {
      setDang(false)
      setHoi(null)
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={() => void bam()} disabled={dang && !hoi} aria-haspopup="dialog">
        <Users size={18} aria-hidden="true" />
        {dang && !hoi ? 'Đang mở điểm danh…' : 'Điểm danh'}
      </button>
      {hoi && (
        <div className="gvhn-chon-lop" role="dialog" aria-label="Điểm danh lớp nào?" ref={hop} onKeyDown={(e) => { if (e.key === 'Escape') hoi.tra(null) }}>
          <b>Điểm danh lớp nào?</b>
          <div className="gvhn-chon-lop-ds">
            {hoi.ds.map((l) => <button key={l} type="button" className="gvv2-nut-vien" onClick={() => hoi.tra(l)}>{l}</button>)}
          </div>
          <button type="button" className="gvhn-chon-lop-huy" onClick={() => hoi.tra(null)}>Huỷ</button>
        </div>
      )}
    </>
  )
}
