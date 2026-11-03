// THẺ «CHỌN CÁCH LÀM» — câu mới có hướng dẫn, KHỔ RỘNG (xoay ngang · Fold mở · máy tính). Thầy 03/11 («bố cục hợp lý xịn hơn», ảnh: cột phải trống, hai
// nút trôi giữa; chốt bản vẽ docs/ban-ve-chon-cach-0311.jpg): cột phải là thẻ kính hai ô lớn thay dải hai nút. Điện thoại dọc ẩn thẻ (thầy 27/10 — hai nút
// đáy đủ nghĩa). CSS: styles/trong-chang-ngang.css `.duo-chon`. Chữ giải thích = chữ chuẩn sẵn có của khung chọn cách (tính là câu tự làm / có hỗ trợ).
import { ArrowRight, BookOpen, PenLine } from 'lucide-react'

export function TheChonCach({ chua, khoa, onHoc, onTuLam }: { chua: boolean; khoa: boolean; onHoc: () => void; onTuLam: () => void }) {
  return (
    <section className="duo-chon" aria-label="Chọn cách làm">
      <p className="duo-chon-nhan">Câu mới · lần đầu gặp</p>
      <h2 className="duo-chon-tieu">Em muốn làm câu này thế nào?</h2>
      <button type="button" className="duo-chon-o" data-sac="vang" onClick={onHoc} disabled={khoa}>
        <span className="duo-chon-ic" aria-hidden="true"><BookOpen size={24} /></span>
        <span className="duo-chon-chu"><b>Học cách giải</b><small>{chua ? 'Xem phần thầy chữa' : 'Xem lời giải từng bước'} · tính là có hỗ trợ</small></span>
        <ArrowRight className="duo-chon-di" size={20} aria-hidden="true" />
      </button>
      <button type="button" className="duo-chon-o" data-sac="chinh" onClick={onTuLam} disabled={khoa}>
        <span className="duo-chon-ic" aria-hidden="true"><PenLine size={24} /></span>
        <span className="duo-chon-chu"><b>Tự làm câu này</b><small>Tính là câu tự làm</small></span>
        <ArrowRight className="duo-chon-di" size={20} aria-hidden="true" />
      </button>
    </section>
  )
}
