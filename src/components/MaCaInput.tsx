// Ô nhập MÃ CA 6 số dạng 6 ô vuông rời 48×56px, serif 24px, tự nhảy ô, bàn
// phím số (HETHIETKETOANAPP.md — "Học sinh — vào phòng"). Cách làm: MỘT input
// thật trong suốt phủ lên 6 ô vẽ — chạm bất kỳ ô nào là focus input thật,
// bàn phím số hiện lên; giá trị đi qua input thật nên dán/xoá/tự điền của
// trình duyệt đều hoạt động bình thường, không phải tự quản 6 input rời.
import { useState } from 'react'
import { laManThi } from './m3'
import './m3/vao-thi.css'

export default function MaCaInput({ value, onChange, autoFocus = false }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const [focus, setFocus] = useState(false)
  const digits = value.replace(/\D/g, '').slice(0, 6)
  const viTri = Math.min(digits.length, 5)
  // Kích thước / nền / viền của ô đi qua BIẾN `--ma-*` có giá trị dự phòng = đúng giá trị cũ: ngoài `.m3` không đổi một điểm ảnh;
  // dưới `.m3` (m3/vao-thi.css) chỉ cần đặt biến, không phải đè kiểu nội tuyến bằng !important.
  const ma = (
    <div className="relative m3-ma-ca" style={{ height: 'var(--ma-cao-hang, 56px)' }}>
      <div className="flex justify-between m3-ma-ca-hang" style={{ gap: 'var(--k2)' }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const dangGo = focus && i === viTri && digits.length < 6
          return (
            <div
              key={i}
              className="flex items-center justify-center font-bold m3-o-ma"
              data-co-so={digits[i] ? '1' : undefined}
              data-dang-go={dangGo ? '1' : undefined}
              style={{
                width: 'var(--ma-rong, 48px)',
                height: 'var(--ma-cao, 56px)',
                borderRadius: 'var(--ma-bo, var(--bo-1))',
                background: 'var(--ma-nen, var(--the-2))',
                border: `var(--ma-vien, 1.5px solid ${dangGo ? 'var(--muc)' : digits[i] ? 'var(--vien-dam)' : 'transparent'})`,
                fontFamily: 'var(--serif)',
                fontSize: 'var(--cx-5)',
                color: 'var(--muc)',
                transitionProperty: 'border-color',
                transitionDuration: 'var(--nhanh)',
              }}
            >
              {digits[i] ?? ''}
            </div>
          )
        })}
      </div>
      <input
        className="absolute inset-0 w-full h-full opacity-0"
        style={{ caretColor: 'transparent', fontSize: 16 }}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={6}
        value={digits}
        autoFocus={autoFocus}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        aria-label="Mã ca 6 số"
      />
    </div>
  )
  // chỉ ở màn thi của em (?examCode=, /t/<mã>) mới tự mang `m3`; ExamTakeScreen đặt `m3` ở gốc thì lớp bọc này là thừa nhưng vô hại
  return laManThi() ? <div className="m3">{ma}</div> : ma
}
