// `/` TRẦN — NGÕ CỤT, KHÔNG PHẢI CHỖ CHỌN APP.
//
// Thầy chốt 15/09: "bạn bỏ màn chọn app đi nhé, vì có thể học sinh dùng 2 máy
// chọn 2 app khác nhau. Bạn bỏ màn chọn app tôi chỉ gửi link".
//
// ─────────────────────────────────────────────────────────────────────────
// VÌ SAO MÀN CHỌN APP LÀ SAI
//
// Bản trước, `/` trần hiện ba thẻ cho người dùng tự chọn. Nó bỏ được chỗ ĐOÁN,
// nhưng đẻ ra chỗ SAI MỚI: em mở trên hai máy, hai lần chọn hai app khác nhau
// — và lần nào cũng là em tự chọn, nên không có gì bắt được.
//
// Chọn app không phải việc của em. Vai do LINK quyết, mà link do thầy gửi.
//
// Nên `/` trần nay KHÔNG dẫn đi đâu cả: không thẻ, không nút, không link sang
// app nào. Chỉ một câu bảo mở đúng link. Đường thường ngày không đi qua đây —
// link thầy gửi là đường dẫn, biểu tượng trên màn hình chính cũng mở đường dẫn.
// Màn này chỉ hứng người gõ tay tên miền.
import { Link2 } from 'lucide-react'

export default function DungLinkScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: 'var(--k5, 24px)', background: 'var(--nen)', gap: 'var(--k3, 12px)' }}
      data-man="dung-link"
    >
      <span
        className="flex items-center justify-center"
        style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--the-2)' }}
      >
        <Link2 size={26} />
      </span>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', fontWeight: 800, color: 'var(--muc)' }}>
        ĐỖ ĐẠI HỌC
      </div>
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 'var(--cx-2)',
          color: 'var(--nhat)',
          textAlign: 'center',
          maxWidth: 380,
          lineHeight: 1.6,
        }}
      >
        Mở app bằng đúng link Thầy gửi. Mỗi người một link riêng, mở đúng link là vào thẳng app của mình.
      </div>
    </div>
  )
}
