// LỊCH BÀI (khối B, bản vẽ docs/ban-ve-moi-on-sua-0911 dt-sang-1 «Lịch Bài 8 · Amine»; thầy 10/11 «Làm nốt mấy việc còn lại đi đẩy hết lên bản sống»).
// Mỗi ngày của bài đang học tới hạn chung: Học mới · Sửa lỗi · Kiểm tra ôn tập · Dự phòng (máy chủ: goi-bai-7-lich-bai.ts — ngày qua / hôm nay theo loại đã chốt,
// ngày tới dự kiến bằng chính luật chọn ngày). Màu theo ánh xạ đang có: học mới chàm, sửa lỗi hồng, Kiểm tra ôn tập lam ngọc. Không đánh dấu «xong» ngày cũ.
// Chỗ đặt: cột phải ở khổ rộng (như thẻ phụ của Duolingo); điện thoại sau «Việc hôm nay» — giữ nút chính trong màn đầu (bản vẽ đặt giữa thẻ mức và nút chính).
// Mảnh nạp lười, có trong kho tải ngầm (vite.config KHO_HS_GOC), ngoài precache — 0 byte đường mở app.
import { BookOpen, Target, Wrench } from 'lucide-react'
import { ChemText } from '../../lib/chem-format'
import type { TomTatGoi7 } from '../../lib/goi-bai-7'
import { docLichBai, type LoaiLich } from './lich-bai-doc'
import './lich-bai.css'

const TEN: Record<LoaiLich, string> = { moi: 'Học mới', sua: 'Sửa lỗi', kiem: 'Kiểm tra ôn tập', du: 'Dự phòng' }
const HINH = { moi: BookOpen, sua: Wrench, kiem: Target } as const
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const thu = (d: string) => THU[new Date(`${d}T00:00:00Z`).getUTCDay()]!
const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

export default function LichBaiHs({ g }: { g: TomTatGoi7 }) {
  const l = docLichBai(g.lichBai)
  if (!l) return null
  const nay = g.ngay
  return <section className="kb-lich" aria-label={`Lịch ${l.ten}, dự kiến tới hạn chung`}>
    <h3><span className="kb-lich-ten">Lịch <ChemText text={l.ten} /></span><span className="kb-lich-han">Hạn chung 23:59 · {thu(l.han)} {ddmm(l.han)}</span></h3>
    <ol className="kb-lich-o">{l.ngay.map(({ ngay, loai }) => {
      const H = loai === 'du' ? null : HINH[loai]
      return <li key={ngay} data-l={loai} data-nay={ngay === nay || undefined} data-xa={ngay > nay || undefined}
        aria-label={`${thu(ngay)} ${ddmm(ngay)}: ${TEN[loai]}${ngay === nay ? ' (hôm nay)' : ngay > nay ? ' (dự kiến)' : ''}`}>
        <i aria-hidden="true">{H ? <H size={16} strokeWidth={2.6} /> : '—'}</i><span aria-hidden="true">{ddmm(ngay)}</span></li>
    })}</ol>
    <p className="kb-lich-chu" aria-hidden="true">{(['moi', 'sua', 'kiem', 'du'] as const).map((k) => <span key={k} data-l={k}>{TEN[k]}</span>)}</p>
    <p className="kb-lich-ghi">Ngày sau là dự kiến: A.I Đỗ Đại Học xếp lại mỗi sáng theo kết quả của em.</p>
  </section>
}
