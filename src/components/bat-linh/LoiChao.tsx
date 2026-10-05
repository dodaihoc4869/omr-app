import { BookOpen } from 'lucide-react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'

// LỜI CHÀO của màn đăng nhập (05/10, tối ưu mở app học sinh): tách khỏi DongHanh.tsx để màn đăng nhập học sinh — màn ĐẦU TIÊN em thấy —
// không kéo theo BieuCamThu + lõi game (`core`). Chữ, lớp CSS, ảnh y nguyên; DongHanh.tsx xuất lại cho mọi chỗ nhập cũ.
export function LoiChao({ vai }: { vai: 'hs' | 'ph' }) {
  return <div className={`bl-loi-chao bl-loi-chao--${vai}`}>
    <span className="bl-eyebrow"><BookOpen size={16} aria-hidden="true" /> HỌC HOÁ MỖI NGÀY</span>
    <h1>{vai === 'hs' ? 'Hành trình lớn lên cùng tri thức' : 'Cùng con, từng bước tiến bộ'}</h1>
    <p>{vai === 'hs' ? 'Hiểu bài sâu hơn. Tự tin hơn mỗi ngày.' : 'Nhìn thấy nỗ lực, hiểu điều con cần và đồng hành đúng lúc.'}</p>
    {vai === 'hs' && <img src={anhThu(1, 50)} alt="Thần thú Thuỷ Long chào đón em" width={220} height={220} decoding="async" />}
  </div>
}
