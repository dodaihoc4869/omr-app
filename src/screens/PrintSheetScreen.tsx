import { useEffect, useRef, useState } from 'react'
import { NutChinh } from '../components/DesignSystem'
import { downloadAnswerSheetPdfBlob } from '../lib/print-sheet'
import { useAppStore } from '../store/appStore'

export default function PrintSheetScreen() {
  const [hoTen, setHoTen] = useState('')
  const [lop, setLop] = useState('')
  const [busy, setBusy] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const showToast = useAppStore((s) => s.showToast)
  const pdfUrlRef = useRef<string | null>(null)

  // Giải phóng blob URL khi rời màn hình, tránh rò rỉ bộ nhớ.
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
    }
  }, [])

  const handleCreatePdf = () => {
    // Vẽ PDF (~500+ hình tròn/chữ) chạy đồng bộ và có thể mất vài giây trên
    // điện thoại tầm trung — nếu build ngay trong handler, trình duyệt chưa
    // kịp sơn lại nút "Đang tạo…" trước khi màn hình đứng hình, trông y hệt
    // "bấm không phản hồi". setTimeout(0) nhường một nhịp cho React vẽ trạng
    // thái bận trước, rồi mới bắt đầu phần nặng.
    setBusy(true)
    setTimeout(() => {
      try {
        const url = downloadAnswerSheetPdfBlob({ hoTen, lop }, 'PhieuTraLoi.pdf', pdfUrlRef.current ?? undefined)
        pdfUrlRef.current = url
        setPdfUrl(url)
        showToast('Đã tải PhieuTraLoi.pdf — bấm "Xem PDF vừa tạo" bên dưới để xem ngay', 'success')
      } catch (e) {
        showToast(`Lỗi tạo PDF: ${e instanceof Error ? e.message : 'không rõ nguyên nhân'}`, 'error')
      } finally {
        setBusy(false)
      }
    }, 30)
  }

  const handleViewPdf = () => {
    // Bấm trực tiếp vào nút này là một user-gesture đồng bộ mới, nên
    // window.open ở đây mở tin cậy, không bị Chrome/Safari di động chặn như
    // khi gọi tự động ngay sau khi tạo xong.
    if (!pdfUrl) return
    const win = window.open(pdfUrl, '_blank', 'noopener')
    if (!win) {
      showToast('Trình duyệt đang chặn cửa sổ xem PDF — mở app Files/Tải xuống để xem file đã tải', 'warn')
    }
  }

  const handleDownloadPdf = () => {
    // Tải lại file PDF đã tạo (không vẽ lại) — để thầy có file riêng gửi
    // qua Zalo/email cho quán photocopy in hộ.
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = 'PhieuTraLoi.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    showToast('Đã tải PhieuTraLoi.pdf — gửi file này cho quán photo là in được', 'success')
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

      {pdfUrl && (
        <div className="space-y-2">
          <NutChinh onClick={handleViewPdf}>Xem PDF vừa tạo</NutChinh>
          <NutChinh variant="phu" onClick={handleDownloadPdf}>
            Tải PDF (gửi cho quán photo)
          </NutChinh>
        </div>
      )}

      <div className="text-sm text-slate-500 space-y-1">
        <p>In khổ A5, chọn scale 100% (tắt "Fit to page" / "Vừa trang") trong hộp thoại in.</p>
        <p>Toạ độ trên phiếu in khớp chính xác với toạ độ máy đọc — không tự chỉnh sửa layout PDF.</p>
      </div>
    </div>
  )
}
