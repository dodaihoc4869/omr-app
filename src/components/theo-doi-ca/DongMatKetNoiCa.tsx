// THEO DÕI CA · dòng "Mất kết nối · số lúc HH:MM" (Boss 21/09, sau sự cố D1): thầy đang coi ca thi thật, số tự làm mới mỗi 20 giây; hụt ≥ 2 nhịp liền thì số trên màn đã CŨ ⇒ nói thẳng, kèm giờ của số đang hiện.
// Không có số nào để nói (chưa tải được lần nào) ⇒ không hiện (màn đã có dòng lỗi riêng). Hỏi được lại ⇒ tự mất.
import { OThongBao } from '../DesignSystem'
import { gioPhutMs } from '../../lib/bang-tin-san/trang-thai'

/** Số nhịp hỏi HỤT liền nhau thì báo "Mất kết nối" (Boss: ≥ 2). */
export const NGUONG_MAT_KET_NOI_CA = 2

/** Chữ của dòng, hoặc `null` khi chưa đủ hụt / chưa có số lần nào tốt. Giờ tính theo GIỜ VIỆT NAM của lần tải TỐT cuối. */
export function chuMatKetNoiCa(soHut: number, gioTotMs: number | null): string | null {
  if (!(soHut >= NGUONG_MAT_KET_NOI_CA) || gioTotMs === null || !Number.isFinite(gioTotMs)) return null
  return `Mất kết nối · số lúc ${gioPhutMs(gioTotMs)}`
}

export default function DongMatKetNoiCa({ soHut, gioTotMs }: { soHut: number; gioTotMs: number | null }) {
  const chu = chuMatKetNoiCa(soHut, gioTotMs)
  if (!chu) return null
  return (
    <div role="status" data-man="theo-doi-mat-ket-noi" style={{ marginTop: 'var(--k3)' }}>
      <OThongBao tone="cam">{chu}</OThongBao>
    </div>
  )
}
