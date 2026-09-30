// Ô TRẢ LỜI SỐ DÙNG CHUNG (thầy 30/09: "thêm dấu âm, dấu phẩy vào BÊN TRONG ô cho đẹp") — thay `ONhapDapSo` ở MỌI màn có ô đáp số
// (thẻ câu thi TheCau ⇒ màn thi dọc, Đảo, Đảo 2, Bi-a, Tu luyện, Luyện đề; màn thi ngang; Đoàn; ôn câu; mở bài; cổng học sinh).
// NGUYÊN NHÂN GỐC: bàn phím `inputMode="decimal"` của iPhone chỉ có 0–9 và dấu thập phân, KHÔNG có dấu trừ; bản 28/09 chỉ hiện nút "−" khi
// đoán ra máy là iPhone/iPad (theo userAgent) và bỏ nút "," ⇒ đoán trượt là em không gõ nổi "-3". Nay HAI nút "±" và "," LUÔN nằm trong ô, mép phải.
// Luật: hai nút KHÔNG lấy tiêu điểm (bàn phím không đóng); "±" bật/tắt "-" ở ĐẦU số (gửi dấu trừ ASCII "-", ô HIỂN THỊ "−" cho đẹp);
// "," chèn TẠI CON TRỎ, chỉ MỘT dấu thập phân. Không chặn ký tự nào em gõ (bàn phím máy tính gõ thẳng "-", "." được).
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { chuanDauGo, laAm, suaChenPhay, suaDoiDau, type KetQuaSua } from '../lib/nhap-dap-so'
import './o-so-tra-loi.css'

export interface OSoTraLoiProps {
  value: string
  onChange: (v: string) => void
  /** Ô bị khoá / đã chấm ⇒ khoá cả hai nút. */
  disabled?: boolean
  maxLength?: number
  placeholder?: string
  /** "decimal" (mặc định: bàn phím số) hoặc "text" (ô "số hoặc chữ": bàn phím chữ, nút vẫn có). */
  inputMode?: 'decimal' | 'text'
  id?: string
  ariaLabel?: string
  className?: string
  inputClassName?: string
  style?: CSSProperties
  inputStyle?: CSSProperties
  /** Màn thi (thầy 28/09): gõ "." tự thành ",", mọi dấu gạch Unicode thành "-", chỉ giữ một dấu thập phân (`chuanDauGo`). */
  chuanViet?: boolean
}

/** Dấu trừ để HIỂN THỊ (U+2212) — rộng bằng chữ số, đẹp hơn gạch nối. Chỉ đổi dấu ĐẦU số; độ dài chuỗi không đổi nên con trỏ giữ nguyên chỗ. */
export const DAU_TRU_HIEN = '−'
export const hienThiSo = (v: string): string => v.replace(/^(\s*)-/, `$1${DAU_TRU_HIEN}`)
/** Chuỗi gửi đi: dấu trừ hiển thị ở đầu số trở về "-" ASCII. */
export const guiSo = (v: string): string => v.replace(/^(\s*)−/, '$1-')

const giuTieuDiem = (e: { preventDefault: () => void }) => e.preventDefault()

export default function OSoTraLoi({ value, onChange, disabled, maxLength, placeholder, inputMode = 'decimal', id, ariaLabel, className, inputClassName, style, inputStyle, chuanViet }: OSoTraLoiProps) {
  const oRef = useRef<HTMLInputElement>(null)
  const caretCho = useRef<number | null>(null)
  const giaTri = value ?? ''
  const am = laAm(giaTri)
  const hetChoPhay = suaChenPhay(giaTri, giaTri.length, giaTri.length, maxLength) === null

  // Sau khi cha cập nhật `value` theo phép của nút: đặt con trỏ đúng chỗ (chỉ khi ô đang có tiêu điểm — không tự mở bàn phím).
  useLayoutEffect(() => {
    const p = caretCho.current
    caretCho.current = null
    const o = oRef.current
    if (p !== null && o && document.activeElement === o) {
      try { o.setSelectionRange(p, p) } catch { /* kiểu ô không hỗ trợ: bỏ qua */ }
    }
  }, [value])

  /** Vùng chọn hiện tại; ô KHÔNG có tiêu điểm ⇒ coi như con trỏ ở CUỐI. */
  const vung = (): { tu: number; den: number; tieuDiem: boolean } => {
    const o = oRef.current
    if (o && document.activeElement === o && o.selectionStart !== null) return { tu: o.selectionStart, den: o.selectionEnd ?? o.selectionStart, tieuDiem: true }
    return { tu: giaTri.length, den: giaTri.length, tieuDiem: false }
  }
  const ap = (kq: KetQuaSua | null, tieuDiem: boolean) => {
    if (!kq || disabled) return
    caretCho.current = tieuDiem ? kq.caret : null
    onChange(kq.value)
  }

  return (
    <div className={`osl${className ? ` ${className}` : ''}`} style={style} data-khoa={disabled ? '' : undefined}>
      <input
        ref={oRef}
        id={id}
        className={inputClassName}
        style={inputStyle}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-label={ariaLabel}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        value={hienThiSo(giaTri)}
        onChange={(e) => {
          caretCho.current = null
          const tho = e.target.value
          const moi = chuanViet ? chuanDauGo(tho) : guiSo(tho)
          // chuanDauGo có thể bỏ dấu phẩy thừa ⇒ chuỗi ngắn đi: lùi con trỏ đúng bấy nhiêu.
          if (chuanViet && moi.length !== tho.length && document.activeElement === e.target) caretCho.current = Math.max(0, (e.target.selectionStart ?? moi.length) - (tho.length - moi.length))
          onChange(moi)
        }}
      />
      <span className="osl-cum">
        <button
          type="button"
          className="osl-nut osl-nut-dau"
          aria-label="Đổi dấu âm"
          aria-pressed={am}
          title="Đổi dấu âm"
          disabled={disabled}
          onPointerDown={giuTieuDiem}
          onMouseDown={giuTieuDiem}
          onClick={() => { const v = vung(); ap(suaDoiDau(giaTri, v.tu, v.den, maxLength), v.tieuDiem) }}
        >
          ±
        </button>
        <button
          type="button"
          className="osl-nut osl-nut-phay"
          aria-label="Thêm dấu phẩy"
          title="Thêm dấu phẩy"
          disabled={disabled || hetChoPhay}
          onPointerDown={giuTieuDiem}
          onMouseDown={giuTieuDiem}
          onClick={() => { const v = vung(); ap(suaChenPhay(giaTri, v.tu, v.den, maxLength), v.tieuDiem) }}
        >
          ,
        </button>
      </span>
    </div>
  )
}
