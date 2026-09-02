// NÚT ĐỒNG BỘ MỘT CHẠM — viên thuốc nhỏ đặt ở đầu thẻ (vd "Đề cho ca này" ở
// màn Mở ca): bấm là kéo đề mới từ kho về máy, không phải vào Ngân hàng câu
// hỏi. Ba trạng thái, đổi màu/chữ mượt theo --nhanh:
//   nghỉ      → icon + "Đồng bộ"
//   đang chạy → icon xoay + "Đang đồng bộ…" (khoá nút)
//   xong      → nền xanh "+2 đề mới" / "Đã mới nhất" ~2,5 giây rồi về nghỉ;
//               lỗi → nền đỏ + thông báo ngắn.
import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { dongBoNganHang, type KetQuaDongBo } from '../lib/exam-sync'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'

type TrangThai = { kieu: 'nghi' } | { kieu: 'chay' } | { kieu: 'xong'; chu: string } | { kieu: 'loi'; chu: string }

export default function NutDongBo({ onXong, className = '' }: { onXong?: (kq: KetQuaDongBo) => void; className?: string }) {
  const [tt, setTt] = useState<TrangThai>({ kieu: 'nghi' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const bao = (next: TrangThai) => {
    setTt(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setTt({ kieu: 'nghi' }), next.kieu === 'loi' ? 4000 : 2500)
  }

  const chay = async () => {
    if (tt.kieu === 'chay') return
    setTt({ kieu: 'chay' })
    try {
      const [url, secret] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !secret.trim()) {
        bao({ kieu: 'loi', chu: 'Chưa cấu hình kho đề' })
        return
      }
      const kq = await dongBoNganHang(url.trim(), secret.trim())
      onXong?.(kq)
      const soMoi = kq.moi.length + kq.capNhat.length
      if (kq.loi.length > 0 && soMoi === 0) bao({ kieu: 'loi', chu: `${kq.loi.length} đề lỗi` })
      else bao({ kieu: 'xong', chu: soMoi > 0 ? `+${soMoi} đề mới` : 'Đã mới nhất' })
    } catch (e) {
      bao({ kieu: 'loi', chu: e instanceof Error && /fetch/i.test(e.message) ? 'Mất mạng' : 'Lỗi đồng bộ' })
    }
  }

  const mau =
    tt.kieu === 'xong'
      ? { nen: 'var(--xanh-nen)', chu: 'var(--xanh)' }
      : tt.kieu === 'loi'
        ? { nen: 'var(--do-nen)', chu: 'var(--do)' }
        : { nen: 'var(--the-2)', chu: 'var(--muc)' }
  const nhan = tt.kieu === 'chay' ? 'Đang đồng bộ…' : tt.kieu === 'nghi' ? 'Đồng bộ' : tt.chu

  return (
    <button
      type="button"
      onClick={chay}
      disabled={tt.kieu === 'chay'}
      aria-live="polite"
      aria-label={tt.kieu === 'nghi' ? 'Đồng bộ đề từ kho' : nhan}
      className={`tap-target inline-flex items-center justify-center font-bold whitespace-nowrap ${className}`}
      style={{
        gap: 'var(--k2)',
        height: 40,
        minHeight: 40,
        padding: '0 var(--k4) 0 var(--k3)',
        borderRadius: 'var(--bo-tron)',
        background: mau.nen,
        color: mau.chu,
        fontFamily: 'var(--sans)',
        fontSize: 'var(--cx-1)',
        border: '1.5px solid transparent',
        transitionProperty: 'background-color, color, transform',
        transitionDuration: 'var(--nhanh)',
        transform: tt.kieu === 'chay' ? 'scale(.98)' : 'scale(1)',
      }}
    >
      {tt.kieu === 'xong' ? <Check size={16} /> : tt.kieu === 'loi' ? <AlertCircle size={16} /> : <RefreshCw size={16} className={tt.kieu === 'chay' ? 'animate-spin' : ''} />}
      <span>{nhan}</span>
    </button>
  )
}
