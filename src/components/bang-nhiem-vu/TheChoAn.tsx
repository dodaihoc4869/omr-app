// LỜI NHẮC "CHO ĂN" (thần thú mỗi ngày · Đợt 1; chỉ học sinh): ống nghiệm có EXP chờ nạp VÀ hôm nay thú còn ăn được ⇒ MỘT thẻ bấm được (≥ 48 px) dẫn vào Đảo, nơi có nút nạp.
// Mọi số do máy chủ tính (`exp.thu`); thiếu một số ⇒ không thẻ (Pages đi trước Worker được). Không đói khi: ống nghiệm 0, hôm nay không ăn được nữa, cấp cao nhất.
import { Utensils } from 'lucide-react'
import { PETS } from '../../game/than-thu-v2/core'
import { HAP_THU_DAT } from '../../lib/hap-thu-ngay'
import type { DuLieuBangNhiemVu } from '../../lib/nhiem-vu-adapter'

export interface ViewChoAn {
  ten: string
  ongNghiem: number
  /** Dự trữ đủ N ngày ăn (ống nghiệm ÷ mức ăn tối đa một ngày, làm tròn xuống); 0 ⇒ null (ẩn, không nói "0 ngày"). */
  duTruNgay: number | null
}

/** null = KHÔNG hiện thẻ. */
export function viewChoAn(d: Pick<DuLieuBangNhiemVu, 'exp' | 'thanThu'>): ViewChoAn | null {
  const t = d.exp?.thu
  if (!t || d.thanThu.kieu !== 'co') return null
  if (t.ongNghiem <= 0 || t.hapThuConLaiHomNay <= 0 || t.expConThieu <= 0) return null
  const ten = (d.thanThu.ten ?? '').trim() || PETS.find((p) => p.id === (d.thanThu as { pet: string }).pet)?.name || 'Thần thú'
  const n = Math.floor(t.ongNghiem / HAP_THU_DAT)
  return { ten, ongNghiem: t.ongNghiem, duTruNgay: n > 0 ? n : null }
}

export default function TheChoAn({ v, onMo }: { v: ViewChoAn; onMo: () => void }) {
  return (
    <button type="button" className="bnv-cho-an" data-vung="cho-an" onClick={onMo} aria-label={`${v.ten} đang đói. Ống nghiệm có ${v.ongNghiem} EXP. Chạm để cho ${v.ten} ăn`}>
      <span className="bnv-cho-an-bt" aria-hidden="true">
        <Utensils size={22} />
      </span>
      <span className="bnv-cho-an-chu">
        <span className="bnv-cho-an-ten">{v.ten} đang đói</span>
        <span className="bnv-cho-an-phu">
          Ống nghiệm có {v.ongNghiem.toLocaleString('vi-VN')} EXP{v.duTruNgay !== null ? ` · dự trữ đủ ${v.duTruNgay} ngày ăn` : ''}
        </span>
      </span>
      <span className="bnv-cho-an-nut" aria-hidden="true">
        Cho ăn
      </span>
    </button>
  )
}
