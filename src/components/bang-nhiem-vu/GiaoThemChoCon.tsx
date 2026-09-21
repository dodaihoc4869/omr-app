// MỘT NÚT "GIAO THÊM BÀI CHO CON" (phụ huynh; thầy lệnh 21/09, đề prompt-ph-giao-them-bai-2109.md mục A4). Nút CHÍNH duy nhất của khối; dưới nút: "Hôm nay còn N lượt giao".
// Bấm ⇒ trạng thái chờ có khung xương ⇒ THẺ XÁC NHẬN có số ("Đã giao cho con 6 câu, khoảng 8 phút: …") hoặc thẻ TỪ CHỐI nêu lý do thật + "Anh/chị chưa mất lượt nào".
// Hết 3 lượt ⇒ nút mờ + "Hôm nay đã giao đủ 3 lượt, mai giao tiếp được". Gói gần nhất: "Con đã làm xong gói 19:40 · đúng 5 trong 6 câu". Mọi chữ do lib thuần dựng từ số THẬT của máy chủ.
import { Plus } from 'lucide-react'
import { chuGoiGanNhat, chuLuot } from '../../lib/giao-them-hien-thi'
import type { ViewGiaoThem } from '../../lib/use-giao-them'

export default function GiaoThemChoCon({ v }: { v: ViewGiaoThem }) {
  const hetLuot = v.conLai === 0
  // Thẻ xác nhận đã có dòng lượt còn lại ở cuối ⇒ không lặp lại dưới nút (mỗi con số chỉ MỘT lần).
  const luot = v.the?.kieu === 'da_giao' && !v.dangGui ? '' : chuLuot(v.conLai)
  return (
    <section className="bnv-giao-them" aria-label="Giao thêm bài cho con" data-vung="giao-them" data-trang-thai={v.dangGui ? 'cho' : hetLuot ? 'het-luot' : 'san-sang'}>
      {v.goiGanNhat && !v.the && !v.dangGui && (
        <p className="bnv-giao-them-goi" data-vung="goi-gan-nhat">
          {chuGoiGanNhat(v.goiGanNhat)}
        </p>
      )}
      {v.dangGui && (
        <div className="bnv-giao-them-cho" role="status" aria-label="A.I Đỗ Đại Học đang chọn câu cho con" data-vung="giao-them-cho">
          <i />
          <i />
          <span className="bnv-sr">A.I Đỗ Đại Học đang chọn câu cho con…</span>
        </div>
      )}
      {!v.dangGui && v.the && (
        <div className="bnv-giao-them-the" role={v.the.kieu === 'loi' ? 'alert' : 'status'} data-kieu={v.the.kieu} data-vung="the-giao-them">
          <h3>{v.the.tieuDe}</h3>
          <ul>
            {v.the.dong.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
          {v.the.cuoi && <p>{v.the.cuoi}</p>}
        </div>
      )}
      <button
        type="button"
        className="bnv-nut-chinh bnv-giao-them-nut"
        disabled={v.dangGui || hetLuot}
        aria-busy={v.dangGui || undefined}
        aria-describedby={luot ? 'bnv-giao-them-luot' : undefined}
        onClick={v.giao}
      >
        <Plus size={18} aria-hidden="true" />
        <span>{v.dangGui ? 'Đang chọn câu…' : 'Giao thêm bài cho con'}</span>
      </button>
      {luot && (
        <p id="bnv-giao-them-luot" className="bnv-giao-them-luot" data-vung="luot-giao">
          {luot}
        </p>
      )}
    </section>
  )
}
