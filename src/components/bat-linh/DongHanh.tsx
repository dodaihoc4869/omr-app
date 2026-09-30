import BieuCamThu from '../../game/than-thu-v2/BieuCamThu'
import { Sparkles, Compass, BookOpen, Leaf } from 'lucide-react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'

/** All pet identity and level come from the student's existing server state. */
export default function DongHanh({ thu, xong = false, onMo }: {
  thu: { index: number; cap: number; ten: string } | null
  xong?: boolean
  onMo: () => void
}) {
  return (
    <section className="bl-dong-hanh" aria-label="Thần thú đồng hành">
      <div className="bl-dong-hanh__dau">
        <span className="bl-eyebrow"><Compass size={15} aria-hidden="true" /> BÁT LINH</span>
        <h1>{xong ? 'Một ngày tiến bộ' : 'Đảo của em'}</h1>
        <p>{xong ? 'Em đã hoàn thành kế hoạch hôm nay.' : 'Mỗi điều hiểu thêm, một bước trưởng thành.'}</p>
      </div>
      {thu ? (
        <button type="button" className="bl-ban-dong-hanh" onClick={onMo} aria-label={`Gặp ${thu.ten}, cấp ${thu.cap}`}>
          <span className="bl-ban-dong-hanh__hao" aria-hidden="true" />
          <img src={anhThu(thu.index, thu.cap)} alt="" width={320} height={320} decoding="async" fetchPriority="high" />
          <BieuCamThu thu={thu.index} camXuc={xong ? 'mung' : 'chao'} size={64} />
          <span className="bl-ban-dong-hanh__ten"><Sparkles size={16} aria-hidden="true" />{thu.ten}<small>Cấp {thu.cap}</small></span>
        </button>
      ) : (
        <div className="bl-dong-hanh__moi"><Sparkles size={44} aria-hidden="true" /><p>Một người bạn đang chờ em</p></div>
      )}
      <span className="bl-dong-hanh__loi"><Leaf size={15} aria-hidden="true" />{xong ? 'Nghỉ một chút, hẹn em buổi sau!' : 'Cùng chinh phục bài hôm nay nhé!'}</span>
    </section>
  )
}

export function LoiChao({ vai }: { vai: 'hs' | 'ph' }) {
  return <div className={`bl-loi-chao bl-loi-chao--${vai}`}>
    <span className="bl-eyebrow"><BookOpen size={16} aria-hidden="true" /> HỌC HOÁ MỖI NGÀY</span>
    <h1>{vai === 'hs' ? 'Hành trình lớn lên cùng tri thức' : 'Cùng con, từng bước tiến bộ'}</h1>
    <p>{vai === 'hs' ? 'Hiểu bài sâu hơn. Tự tin hơn mỗi ngày.' : 'Nhìn thấy nỗ lực, hiểu điều con cần và đồng hành đúng lúc.'}</p>
    {vai === 'hs' && <img src={anhThu(1, 50)} alt="Thần thú Thuỷ Long chào đón em" width={220} height={220} decoding="async" />}
  </div>
}
