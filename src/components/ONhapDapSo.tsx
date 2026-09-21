// Ô TRẢ LỜI NGẮN DÙNG CHUNG cho mọi app / màn có ô đáp số (thẻ câu thi, Đảo, Võ đài, Đoàn, ôn câu, mở bài, cổng học sinh): ô nhập + hai nút "−" (đổi dấu âm) và "," (dấu thập phân)
// vì bàn phím SỐ của điện thoại không có hai dấu ấy (thầy 06/09, 07/09, lệnh 21/09 "quét mọi chỗ mọi app").
// Luật: hai nút KHÔNG lấy tiêu điểm khỏi ô (bấm không làm đóng bàn phím); "−" bật/tắt "-" ở ĐẦU số; "," chèn TẠI CON TRỎ, chỉ MỘT dấu thập phân; em gõ / dán gì (kể cả "0.54") gửi nấy — KHÔNG chuẩn hoá ở đây.
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { choPhepPhay, laAm, suaChenPhay, suaDoiDau, type KetQuaSua } from '../lib/nhap-dap-so'
import './o-nhap-dap-so.css'

export interface ONhapDapSoProps {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  maxLength?: number
  placeholder?: string
  /** "decimal" (mặc định: bàn phím số) hoặc "text" (ô "số hoặc chữ": giữ bàn phím chữ, nút vẫn có). */
  inputMode?: 'decimal' | 'text'
  id?: string
  ariaLabel?: string
  className?: string
  inputClassName?: string
  nutClassName?: string
  style?: CSSProperties
  inputStyle?: CSSProperties
  nutStyle?: CSSProperties
  /** Cả hai nút đứng TRƯỚC ô (thẻ câu thi giữ bố cục cũ: − , ô); mặc định "−" trước, "," sau ô. */
  nutTruoc?: boolean
}

const giuTieuDiem = (e: { preventDefault: () => void }) => e.preventDefault()

export default function ONhapDapSo({ value, onChange, disabled, maxLength, placeholder, inputMode = 'decimal', id, ariaLabel, className, inputClassName, nutClassName, style, inputStyle, nutStyle, nutTruoc }: ONhapDapSoProps) {
  const oRef = useRef<HTMLInputElement>(null)
  const caretCho = useRef<number | null>(null)
  const am = laAm(value)
  const daCoPhay = /[,.]/.test(value)

  // Sau khi cha cập nhật `value` theo phép của nút: đặt con trỏ đúng chỗ (chỉ khi ô đang có tiêu điểm — không tự mở bàn phím).
  useLayoutEffect(() => {
    const p = caretCho.current
    caretCho.current = null
    const o = oRef.current
    if (p !== null && o && document.activeElement === o) {
      try { o.setSelectionRange(p, p) } catch { /* kiểu ô không hỗ trợ: bỏ qua */ }
    }
  }, [value])

  /** Vùng chọn hiện tại; ô KHÔNG có tiêu điểm ⇒ coi như con trỏ ở CUỐI (vùng chọn cũ của một ô không tiêu điểm không đáng tin). */
  const vung = (): { tu: number; den: number; tieuDiem: boolean } => {
    const o = oRef.current
    if (o && document.activeElement === o && o.selectionStart !== null) return { tu: o.selectionStart, den: o.selectionEnd ?? o.selectionStart, tieuDiem: true }
    return { tu: value.length, den: value.length, tieuDiem: false }
  }
  const ap = (kq: KetQuaSua | null, tieuDiem: boolean) => {
    if (!kq) return
    caretCho.current = tieuDiem ? kq.caret : null
    onChange(kq.value)
  }

  const nutDoiDau = () => { const v = vung(); ap(suaDoiDau(value, v.tu, v.den, maxLength), v.tieuDiem) }
  const nutPhayBam = () => { const v = vung(); ap(suaChenPhay(value, v.tu, v.den, maxLength), v.tieuDiem) }

  const nutAm = (
    <button
      type="button"
      className={`ond-nut${nutClassName ? ` ${nutClassName}` : ''}`}
      style={nutStyle}
      aria-label={am ? 'Bỏ dấu âm' : 'Thêm dấu âm'}
      data-bat={am ? '' : undefined}
      disabled={disabled}
      onPointerDown={giuTieuDiem}
      onMouseDown={giuTieuDiem}
      onClick={nutDoiDau}
    >
      −
    </button>
  )
  const nutPhay = (
    <button
      type="button"
      className={`ond-nut${nutClassName ? ` ${nutClassName}` : ''}`}
      style={nutStyle}
      aria-label="Thêm dấu phẩy"
      disabled={disabled || daCoPhay || !choPhepPhay(value, value.length, value.length, maxLength)}
      onPointerDown={giuTieuDiem}
      onMouseDown={giuTieuDiem}
      onClick={nutPhayBam}
    >
      ,
    </button>
  )
  return (
    <div className={`ond${className ? ` ${className}` : ''}`} style={style}>
      {nutAm}
      {nutTruoc && nutPhay}
      <input
        ref={oRef}
        id={id}
        className={inputClassName}
        style={inputStyle}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={ariaLabel}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        value={value}
        onChange={(e) => { caretCho.current = null; onChange(e.target.value) }}
      />
      {!nutTruoc && nutPhay}
    </div>
  )
}
