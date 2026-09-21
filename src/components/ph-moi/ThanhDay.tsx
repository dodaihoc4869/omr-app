// MỘT nút hành động duy nhất của app phụ huynh mới: "Giao thêm bài cho con", dính đáy (màn chính VÀ bảng "Mọi thứ về con"). Kết quả (đã giao / từ chối / lỗi thật của máy chủ) hiện NGAY TRÊN nút;
// dòng lượt còn lại dưới nút; hết lượt ⇒ nút mờ. Mọi chữ do giao-them-hien-thi (số thật, chủ ngữ "A.I Đỗ Đại Học").
import { Send } from 'lucide-react'
import '../m3'
import './ph-moi.css'
import './ph-moi-them.css'
import { chuGoiGanNhat, chuLuot } from '../../lib/giao-them-hien-thi'
import type { ViewGiaoThem } from '../../lib/use-giao-them'

export default function ThanhDay({ giaoThem }: { giaoThem: ViewGiaoThem }) {
  const hetLuot = giaoThem.conLai === 0
  const luot = giaoThem.the?.kieu === 'da_giao' && !giaoThem.dangGui ? '' : chuLuot(giaoThem.conLai)
  return (
    <div className="phm-day" data-vung="thanh-day">
      {giaoThem.the && !giaoThem.dangGui && (
        <div className="phm-day__the" role={giaoThem.the.kieu === 'loi' ? 'alert' : 'status'} data-kieu={giaoThem.the.kieu} data-vung="the-giao-them">
          <h3>{giaoThem.the.tieuDe}</h3>
          <ul>
            {giaoThem.the.dong.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
          {giaoThem.the.cuoi && <p>{giaoThem.the.cuoi}</p>}
        </div>
      )}
      {giaoThem.goiGanNhat && !giaoThem.the && !giaoThem.dangGui && (
        <p className="phm-day__goi" data-vung="goi-gan-nhat">
          {chuGoiGanNhat(giaoThem.goiGanNhat)}
        </p>
      )}
      <button type="button" className="phm-nut phm-nut--chinh" data-vung="giao-them" disabled={giaoThem.dangGui || hetLuot} aria-busy={giaoThem.dangGui || undefined} onClick={giaoThem.giao}>
        <Send className="phm-i" aria-hidden="true" />
        <span>{giaoThem.dangGui ? 'Đang chọn câu…' : 'Giao thêm bài cho con'}</span>
      </button>
      {luot && <p data-vung="luot-giao">{luot} · A.I Đỗ Đại Học chọn câu hợp với con</p>}
    </div>
  )
}
