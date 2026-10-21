// BẢNG NHẬP SỐ DÙNG CHUNG cho câu TRẢ LỜI NGẮN (thầy 21/10, kèm ảnh màn luyện: "toàn bộ phần trả lời ngắn trong mọi chỗ, kể cả màn kiểm tra của học
// sinh phải hiện bảng nhập này, tuỳ theo đáp số mà hiện số ô nhập tương ứng"). Cùng hình và cùng luật phím với bảng nhập của màn luyện
// (`hoc-tap/LamCau.tsx` OPhieu + BanPhimSo, `hoc-tap/lam-bai.ts` nhanPhim): `soO` ô = đúng số kí tự đáp số gõ chuẩn (`soOPhanIII`), mỗi chữ số /
// dấu phẩy / dấu trừ một ô; bàn phím 1–9, 0, dấu phẩy, dấu trừ, xoá một kí tự, xoá hết.
//
// KHÁC màn luyện: nhiều câu trên cùng một trang (màn kiểm tra dọc) ⇒ KHÔNG nghe phím cả cửa sổ; bảng là MỘT vùng nhận tiêu điểm (`tabIndex=0`),
// gõ số trên máy tính chỉ vào bảng đang được chọn. Không có ô <input> ⇒ bàn phím điện thoại không bật đè lên đề.
// Giá trị gửi đi y như ô cũ `OSoTraLoi chuanViet`: dấu trừ ASCII "-", dấu thập phân ",". Đáp án đã lưu dài hơn `soO` vẫn hiện đủ (chỉ xoá bớt được).
import type { CSSProperties, KeyboardEvent } from 'react'
import { Delete } from 'lucide-react'
import { kyTuHien, nhanPhim, phimCoTacDung, phimTuBanPhim, type PhimSo } from './hoc-tap/lam-bai'
import './bang-nhap-so.css'

export interface BangNhapSoProps {
  value: string
  onChange: (v: string) => void
  /** Số ô = số kí tự đáp số (1..8). */
  soO: number
  disabled?: boolean
  ariaLabel?: string
  id?: string
  onFocus?: () => void
  /** GỌN (phiếu tô cột phải của màn kiểm tra trên máy tính): chỉ hàng ô, gõ bằng bàn phím máy tính — bàn phím số đầy đủ nằm ở thẻ câu bên trái,
   *  không lặp lại ở từng dòng phiếu. */
  gon?: boolean
}

const HANG_PHIM: { p: PhimSo; chu?: string; ten?: string; chuc?: true; rong?: true }[] = [
  { p: '1' }, { p: '2' }, { p: '3' }, { p: 'xoa', ten: 'Xoá một kí tự', chuc: true },
  { p: '4' }, { p: '5' }, { p: '6' }, { p: ',', chu: ',', ten: 'Dấu phẩy', chuc: true },
  { p: '7' }, { p: '8' }, { p: '9' }, { p: '-', chu: '−', ten: 'Dấu trừ', chuc: true },
  { p: '0', rong: true }, { p: 'xoa-het', chu: 'Xoá hết', chuc: true, rong: true },
]

export default function BangNhapSo({ value, onChange, soO, disabled, ariaLabel = 'Đáp án của em', id, onFocus, gon }: BangNhapSoProps) {
  const v = value ?? ''
  const so = Math.max(soO, v.length)
  const nhan = (p: PhimSo) => {
    if (disabled) return
    const moi = nhanPhim(v, p, soO)
    if (moi !== v) onChange(moi)
  }
  const go = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const p = phimTuBanPhim(e.key)
    if (!p) return
    e.preventDefault()
    nhan(p)
  }
  return (
    <div id={id} className="bns" role="group" aria-label={ariaLabel} tabIndex={disabled ? -1 : 0} onKeyDown={go} onFocus={onFocus} data-khoa={disabled || undefined} data-gon={gon || undefined}>
      <div className="bns-o-hang" aria-hidden="true" data-nhieu={so > 4 || undefined} style={so > 4 ? ({ '--bns-so-o': so } as CSSProperties) : undefined}>
        {Array.from({ length: so }, (_, i) => (
          <span key={i} className="bns-o" data-tt={i < v.length ? 'co' : i === v.length && !disabled ? 'dang' : 'trong'}>
            {i < v.length ? kyTuHien(v[i]!) : i === v.length && !disabled ? <i className="bns-con-tro" /> : ''}
          </span>
        ))}
      </div>
      <output className="bns-an" aria-live="polite">{v ? `Đáp án của em: ${[...v].map(kyTuHien).join('')}` : 'Chưa nhập đáp án'}</output>
      {!gon && <div className="bns-phim" role="group" aria-label="Bàn phím số">
        {HANG_PHIM.map(({ p, chu, ten, chuc, rong }) => (
          <button key={p} type="button" tabIndex={-1} aria-label={ten} data-chuc={chuc || undefined} data-rong={rong || undefined} disabled={disabled || !phimCoTacDung(v, p, soO)} onClick={() => nhan(p)}>
            {p === 'xoa' ? <Delete size={22} aria-hidden="true" /> : chu ?? p}
          </button>
        ))}
      </div>}
    </div>
  )
}
