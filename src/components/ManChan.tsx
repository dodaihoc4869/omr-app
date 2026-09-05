// TẤM CHE ĐỀ — BAOMATCATHI.md mục 4.2, lớp thứ hai.
//
// Lớp thứ nhất là CSS thuần (`html[data-la-chan]` trong index.css) — bật một
// lần rồi tự chạy, không phụ thuộc JavaScript về sau. Lớp này là lớp React,
// dựng NGAY TRONG HÀM XỬ LÝ SỰ KIỆN, trước khung hình kế tiếp.
//
// Hai lớp độc lập vì mỗi lớp hỏng một kiểu khác nhau: JavaScript treo thì CSS
// vẫn che; trình duyệt không hiểu `:fullscreen` thì React vẫn che.
//
// TẤM NÀY KHÔNG CHỨA NỘI DUNG CÂU HỎI NÀO. Một dòng lý do và một nút.
import { EyeOff } from 'lucide-react'

export interface ManChanProps {
  /** Một dòng nói vì sao đang che. Không có chữ "gian lận", "quay cóp". */
  lyDo: string
  onQuayLai: () => void
}

export default function ManChan({ lyDo, onQuayLai }: ManChanProps) {
  return (
    <div
      data-man-chan
      role="alertdialog"
      aria-label="Bài thi đang tạm che"
      className="flex flex-col items-center justify-center text-center"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-man-chan)' as unknown as number,
        background: 'var(--nen)',
        color: 'var(--muc)',
        gap: 'var(--k4)',
        padding: 'var(--k6)',
      }}
    >
      <EyeOff size={40} style={{ color: 'var(--cam)' }} />
      <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
        Đề đang tạm ẩn
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)', maxWidth: 420 }}>{lyDo}</div>
      <button
        type="button"
        onClick={onQuayLai}
        className="tap-target font-bold"
        style={{ minHeight: 56, padding: '0 var(--k6)', borderRadius: 'var(--bo-1)', background: 'var(--muc)', color: 'var(--muc-nguoc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
      >
        Quay lại bài làm
      </button>
    </div>
  )
}
