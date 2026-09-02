import { useState } from 'react'
import { downloadAnswerSheetPdf } from '../lib/print-sheet'

export default function PrintSheetScreen() {
  const [hoTen, setHoTen] = useState('')
  const [lop, setLop] = useState('')

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
        onClick={() => downloadAnswerSheetPdf({ hoTen, lop })}
        className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold"
      >
        Tạo PDF phiếu trả lời
      </button>

      <div className="text-sm text-slate-500 space-y-1">
        <p>In khổ A4, chọn scale 100% (tắt "Fit to page" / "Vừa trang") trong hộp thoại in.</p>
        <p>Toạ độ trên phiếu in khớp chính xác với toạ độ máy đọc — không tự chỉnh sửa layout PDF.</p>
      </div>
    </div>
  )
}
