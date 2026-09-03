// MÀN BÁO TIN CHO LINK CŨ CỦA EM VÀ PHỤ HUYNH.
//
// App học sinh và app phụ huynh đã tách khỏi repo này (TACHAPPHSPH.md). Link
// riêng `/hs/<token>`, `/ph/<token>` đã phát ra Zalo rồi, không thu về được;
// app cũ cũng đã nằm trên màn hình chính máy các em. Không có màn này thì mọi
// link đó rơi thẳng vào app QUẢN LÝ của thầy — đúng lỗi thầy đã báo.
//
// Màn này là ngõ cụt cố ý: không nút nào dẫn tiếp vào app thầy.
import LogoDDH from '../components/LogoDDH'

export default function AppDaChuyenScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center"
      style={{ background: 'var(--nen)', color: 'var(--muc)', padding: 'var(--k6) var(--k5)', gap: 'var(--k4)' }}
    >
      <LogoDDH size={56} />
      <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)' }}>
        Link này đã ngừng dùng
      </h1>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)', maxWidth: 420, lineHeight: 1.6 }}>
        Thầy đang chuyển app học sinh và app phụ huynh sang bản mới. Thầy sẽ gửi link mới qua Zalo.
      </p>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)', maxWidth: 420, lineHeight: 1.6 }}>
        Có bài kiểm tra hoặc bài tập về nhà thì mở đúng link Thầy gửi kèm mã ca, rồi nhập số báo danh.
      </p>
    </div>
  )
}
