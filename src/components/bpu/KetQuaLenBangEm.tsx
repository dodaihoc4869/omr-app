// BÌNH PHẢN ỨNG — KẾT QUẢ LÊN BẢNG TRÊN MÁY EM (thầy 10/11: em được gọi và cả lớp đều thấy kết quả lên bảng).
// Phòng (`viewEm`) gửi mọi máy `goi` = tên, đội, `dat` (thầy vừa chấm). Chỉ hiện sau khi thầy mở đáp án.
// LÀM LẠI 10/11 (thầy «làm lại đẹp hơn gọn hơn tinh tế hơn — bỏ em đạt, chỉ ghi đạt / không đạt nổi bật»): bỏ thẻ to «Em · Chưa đạt / Cảm ơn…»;
// giờ là MỘT NHÃN nằm bên phải thanh đội:
//  • em được gọi: nhãn to «Đạt» (xanh --tr-dung) / «Chưa đạt» (đỏ dịu --tr-sai*), dòng phụ nhỏ = kJ THẬT của em lượt này (mục `bienDongEm` của phòng —
//    người gọi truyền vào, không tính lại); không có biến động ⇒ không dòng phụ;
//  • bạn cùng lớp: «Tên gọi · Đạt» nhỏ hơn, chấm ký hiệu màu đội của bạn ấy (không nêu số trừ trước cả lớp).
// Vào: trượt nhẹ + hiện (transform / opacity); máy yếu / giảm chuyển động ⇒ tĩnh.
import { DOI_BPU, type ViewEm } from '../../lib/bpu/phong'

type Goi = NonNullable<NonNullable<ViewEm['luot']>['goi']>
const dau = (n: number) => (n > 0 ? `+${n.toLocaleString('vi-VN')}` : `−${Math.abs(n).toLocaleString('vi-VN')}`)
/** Tên gọi = chữ cuối của họ tên («Đỗ Đại Học» ⇒ «Học»). */
export const tenGoiEm = (ten: string): string => ten.trim().split(/\s+/).pop() || ten

export default function KetQuaLenBangEm({ g, laEm, kjEm }: { g: Goi; laEm: boolean; kjEm?: number | null }) {
  if (g.dat == null) return null
  const kq = g.dat ? 'Đạt' : 'Chưa đạt'
  const doi = DOI_BPU[g.doi]
  if (laEm) {
    const coKj = typeof kjEm === 'number' && kjEm !== 0
    return (
      <div className="bpu-klb em" data-dat={g.dat ? '1' : '0'} role="status" aria-live="polite" aria-label={`Kết quả lên bảng: ${kq}${coKj ? `, ${dau(kjEm!)} kJ` : ''}`}>
        <b>{kq}</b>
        {coKj ? <small>{dau(kjEm!)} kJ</small> : null}
      </div>
    )
  }
  return (
    <div className="bpu-klb" data-dat={g.dat ? '1' : '0'} role="status" aria-live="polite" aria-label={`${g.ten} (${doi?.ten ?? 'đội'}) lên bảng: ${kq}`}
      style={{ ['--doi' as string]: `var(${doi?.mau ?? '--tr-tin'})` }}>
      <i aria-hidden="true">{doi?.ky ?? ''}</i>
      <span>{tenGoiEm(g.ten)} · <b>{kq}</b></span>
    </div>
  )
}
