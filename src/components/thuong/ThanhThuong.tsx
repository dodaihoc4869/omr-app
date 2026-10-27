// THANH TRÊN THƯỞNG PHẠT (bản vẽ tp-4, thầy chốt 26/10): đúng 3 bộ đếm — chuỗi ngày · nguyên tử hôm nay · tinh thể — + Bi trong vòng «Mục tiêu ngày x/y bài».
// Phần HIỆN NGAY: vẽ từ bản gần nhất ở máy rồi cập nhật khi /hs/thuong trả (số đổi ⇒ đếm từ số cũ, không chớp). Chưa có bản nào ⇒ khung xương (không số).
// Trường nào thiếu ⇒ ô đó ẩn (không bịa số). Có thông báo thưởng chưa xem (thăng hoa, bình đã đỡ, cuối tuần…) ⇒ nạp LƯỜI tấm thông báo.
// Cắm: thay các viên số trong header.da-tren của Lộ trình (xem CAM-VAO.md).
import { lazy, Suspense, type ReactNode } from 'react'
import { Bi } from '../linh-vat/Bi'
import { IcLua, IcNguyenTu, IcTinhThe } from './hinh'
import { SoDem } from './SoDem'
import { useTongQuan } from './dung-thuong'
import { locThongBao } from './loc-thong-bao'
import '../../styles/trong-thuong-gon.css'

const ThongBaoThuong = lazy(() => import('./ManThuong').then((m) => ({ default: m.ThongBaoThuong })))
const CHU_VI = 138.2 // 2π·22

export interface PropsThanhThuong {
  token?: string
  /** Bấm một bộ đếm ⇒ mở màn tương ứng (Chuỗi ngày · Nhiệm vụ ngày · Cửa hàng tinh thể). Không truyền ⇒ ô chỉ để xem. */
  onMo?: (man: 'chuoi' | 'nhiem-vu' | 'cua-hang') => void
  /** «Học ngay» trên tấm thông báo (thăng hoa, bình đã đỡ…). */
  onHoc?: () => void
  /** Tắt tấm thông báo tự bật (vd. đang ở màn khác). Mặc định bật. */
  thongBao?: boolean
}

export function ThanhThuong({ token, onMo, onHoc, thongBao = true }: PropsThanhThuong) {
  const { du, tai } = useTongQuan(token)
  if (!du) return tai ? <div className="tp-tr" aria-busy="true" aria-label="Đang tải số của em">
    {[0, 1, 2].map((i) => <span key={i} className="tp-tr-o" data-k={['lua', 'nt', 'tt'][i]}><span className="tp-tr-cho" /></span>)}
  </div> : null
  const c = du.chuoiNgay, mt = du.mucTieu
  const dat = !!mt && mt.daXong >= mt.can
  const p = mt ? Math.min(1, mt.daXong / mt.can) : 0
  const o = (k: 'lua' | 'nt' | 'tt', nhan: string, man: 'chuoi' | 'nhiem-vu' | 'cua-hang', con: ReactNode) => onMo
    ? <button type="button" className="tp-tr-o" data-k={k} aria-label={nhan} onClick={() => onMo(man)}>{con}</button>
    : <span className="tp-tr-o" data-k={k} role="img" aria-label={nhan}>{con}</span>
  const tb = thongBao && token ? locThongBao(du) : []
  return <div className="tp-tr">
    {c && o('lua', `Chuỗi ${c.so} ngày`, 'chuoi', <><IcLua tat={c.so === 0} /><SoDem gt={c.so} lat className="tp-tr-so" /></>)}
    {du.nguyenTuHomNay !== undefined && o('nt', `${du.nguyenTuHomNay} nguyên tử hôm nay`, 'nhiem-vu', <><IcNguyenTu /><SoDem gt={du.nguyenTuHomNay} className="tp-tr-so" /></>)}
    {du.tinhThe !== undefined && o('tt', `${du.tinhThe} tinh thể`, 'cua-hang', <><IcTinhThe /><SoDem gt={du.tinhThe} className="tp-tr-so" /></>)}
    {mt && (() => {
      const nhan = `Mục tiêu ngày ${mt.daXong}/${mt.can} chặng${dat ? ', đã đạt' : ''}`
      const ruot = <>
        <svg className="vm" viewBox="0 0 52 52" aria-hidden="true"><circle className="nen" cx="26" cy="26" r="22" /><circle className="chay" cx="26" cy="26" r="22" strokeDasharray={`${p * CHU_VI} 200`} /></svg>
        <Bi cam={dat ? 'mung' : 'chao'} size={34} nhip="yen" />
        <em aria-hidden="true">{mt.daXong}/{mt.can} chặng</em>
      </>
      return onMo ? <button type="button" className="tp-tr-muc" data-dat={dat || undefined} aria-label={nhan} onClick={() => onMo('nhiem-vu')}>{ruot}</button>
        : <span className="tp-tr-muc" data-dat={dat || undefined} role="img" aria-label={nhan}>{ruot}</span>
    })()}
    {tb.length > 0 && <Suspense fallback={null}><ThongBaoThuong token={token!} tongQuan={du} onHoc={onHoc} /></Suspense>}
  </div>
}

export default ThanhThuong
