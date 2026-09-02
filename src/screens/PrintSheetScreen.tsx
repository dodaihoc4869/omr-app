import { useState } from 'react'
import { downloadAnswerSheetPdfBlob } from '../lib/print-sheet'
import { useAppStore } from '../store/appStore'

export default function PrintSheetScreen() {
  const [hoTen, setHoTen] = useState('')
  const [lop, setLop] = useState('')
  const [busy, setBusy] = useState(false)
  const showToast = useAppStore((s) => s.showToast)

  const handleCreatePdf = () => {
    // Vẽ PDF (~500+ hình tròn/chữ) chạy đồng bộ và có thể mất vài giây trên
    // điện thoại tầm trung — nếu build ngay trong handler, trình duyệt chưa
    // kịp sơn lại nút "Đang tạo…" trước khi màn hình đứng hình, trông y hệt
    // "bấm không phản hồi". setTimeout(0) nhường một nhịp cho React vẽ trạng
    // thái bận trước, rồi mới bắt đầu phần nặng.
    setBusy(true)
    setTimeout(() => {
      try {
        downloadAnswerSheetPdfBlob({ hoTen, lop })
        showToast('Đã tải PhieuTraLoi.pdf — mở app Files/Tải xuống trên máy để xem', 'success')
      } catch (e) {
        showToast(`Lỗi tạo PDF: ${e instanceof Error ? e.message : 'không rõ nguyên nhân'}`, 'error')
      } finally {
        setBusy(false)
      }
    }, 30)
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Tạo & in phiếu</h1>

      <div className="space-y-2">
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Họ tên (tuỳ chọn, in sẵn lên phiếu)"
          value={hoTen}
          onChange={(e) => setHoTen(e.target.value)}
        />
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Lớp (tuỳ chọn)"
          value={lop}
          onChange={(e) => setLop(e.target.value)}
        />
      </div>

      <button
        onClick={handleCreatePdf}
        disabled={busy}
        className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
      >
        {busy ? 'Đang tạo…' : 'Tạo PDF phiếu trả lời'}
      </button>

      <div className="text-sm text-slate-500 space-y-1">
        <p>In khổ A4, chọn scale 100% (tắt "Fit to page" / "Vừa trang") trong hộp thoại in.</p>
        <p>Toạ độ trên phiếu in khớp chính xác với toạ độ máy đọc — không tự chỉnh sửa layout PDF.</p>
      </div>
    </div>
  )
}
