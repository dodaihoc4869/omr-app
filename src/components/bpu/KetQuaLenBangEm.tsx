// BÌNH PHẢN ỨNG — KẾT QUẢ LÊN BẢNG TRÊN MÁY EM (thầy 10/11: em được gọi và cả lớp đều thấy «Đỗ Đại Học · Đạt · đội +200 kJ»).
// Phòng (`viewEm`) gửi mọi máy `goi` = tên, đội, `dat` (thầy vừa chấm) và `kjDoi` (kJ đội do lên bảng — CHỈ sau khi mở đáp án, số thật của phòng).
// Dải nhỏ nổi trên cùng (trên lớp che nếu đang che — không gỡ che), màu đội, tế nhị: Đạt ⇒ «Đạt · đội +200 kJ»; Chưa đạt ⇒ «Chưa đạt · cảm ơn bạn đã
// lên bảng» (không nêu số trừ trước cả lớp; em được gọi thấy thẻ ±kJ của mình qua TheBienDong). Chỉ transform + opacity.
import { DOI_BPU, type ViewEm } from '../../lib/bpu/phong'

type Goi = NonNullable<NonNullable<ViewEm['luot']>['goi']> & { kjDoi?: number }
const dau = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

export default function KetQuaLenBangEm({ g, laEm }: { g: Goi; laEm: boolean }) {
  if (g.dat == null) return null
  const doi = DOI_BPU[g.doi]
  const phu = g.dat
    ? `${laEm ? 'Em giải đúng trên bảng' : 'Giải đúng trên bảng'}${g.kjDoi != null ? ` · ${doi?.ten ?? 'đội'} ${dau(g.kjDoi)}\u00a0kJ` : ''}`
    : laEm ? 'Cảm ơn em đã lên bảng chữa bài' : 'Cảm ơn bạn đã lên bảng'
  return (
    <div className="bpu-klb" data-dat={g.dat ? '1' : '0'} role="status" aria-live="polite" style={{ ['--doi' as string]: `var(${doi?.mau ?? '--tr-tin'})` }}>
      <span className="ky" aria-hidden="true">{doi?.ky ?? ''}</span>
      <div><b>{laEm ? 'Em' : g.ten} · {g.dat ? 'Đạt' : 'Chưa đạt'}</b><span>{phu}</span></div>
    </div>
  )
}
