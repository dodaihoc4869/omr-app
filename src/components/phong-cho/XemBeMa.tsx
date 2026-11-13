// XEM TRƯỚC BÉ MA MẶC ĐỒ (canvas) — mảnh lười dùng chung tủ đồ + thẻ sảnh: hình nướng của trò chỉ tải khi màn cần vẽ bé ma (không vào mảnh thẻ sảnh).
import { useEffect, useRef, type CSSProperties } from 'react'
import { MAU_SINH_TON, MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { KHUNG_H, KHUNG_W, veBeMaMac, type VeBeMa } from './be-ma-mac'

/** Biến màu luôn tối của trò gắn ngay ở khung (canvas đọc màu tại chỗ). */
const NEN: CSSProperties = { ...(MAU_XANH_THAN as CSSProperties), ...(MAU_SINH_TON as CSSProperties) }

/** `nen`: khung có nền tối riêng (thẻ sảnh có thể đang ở giao diện sáng — bé ma nét phấn trắng cần nền tối). */
export default function XemBeMa({ rong, nhan, nen, ...o }: VeBeMa & { rong: number; nhan: string; nen?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const khoa = `${o.doi}|${o.mac.mu ?? ''}|${o.mac.ao ?? ''}|${o.hieuUng ?? ''}|${o.mo ? 1 : 0}|${rong}`
  useEffect(() => {
    const c = ref.current
    if (c) { try { veBeMaMac(c, o) } catch { /* máy không vẽ được ⇒ để trống, chữ nhãn vẫn đủ nghĩa */ } }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- vẽ lại theo khoá nội dung
  }, [khoa])
  return (
    <span style={{ ...NEN, display: 'inline-block', flex: 'none', width: rong, height: (rong * KHUNG_H) / KHUNG_W, lineHeight: 0, ...(nen ? { background: 'var(--st-nen)', borderRadius: 14 } : {}) }}>
      <canvas ref={ref} role="img" aria-label={nhan} style={{ width: '100%', height: '100%' }} />
    </span>
  )
}
