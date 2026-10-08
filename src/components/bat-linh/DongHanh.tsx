import BieuCamThu from '../../game/than-thu-v2/BieuCamThu'
import { Sparkles, Compass, Leaf } from 'lucide-react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'

/** All pet identity and level come from the student's existing server state. */
export default function DongHanh({ thu, xong = false, onMo, tenHanhTrinh }: {
  thu: { index: number; cap: number; ten: string } | null
  xong?: boolean
  onMo: () => void
  tenHanhTrinh?: string
}) {
  return (
    <section className="bl-dong-hanh" aria-label="Thần thú đồng hành">
      <div className="bl-dong-hanh__dau">
        <span className="bl-eyebrow"><Compass size={15} aria-hidden="true" /> BÁT LINH</span>
        <h1>{xong ? 'Một ngày tiến bộ' : (tenHanhTrinh || 'Hành trình giỏi Hóa')}</h1>
        <p>{xong ? 'Em đã hoàn thành kế hoạch hôm nay.' : 'Vững từng bước · Chinh phục từng bậc'}</p>
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

// Lời chào màn đăng nhập nay ở LoiChao.tsx (05/10) — xuất lại để mọi chỗ nhập cũ giữ nguyên.
export { LoiChao } from './LoiChao'
