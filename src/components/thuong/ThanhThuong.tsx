// THANH TRÊN THƯỞNG PHẠT (bản vẽ tp-4, thầy chốt 26/10): đúng 3 bộ đếm — chuỗi ngày · nguyên tử hôm nay · tinh thể — + Bi trong vòng «Mục tiêu ngày x/y bài».
// Phần HIỆN NGAY: vẽ từ bản gần nhất ở máy rồi cập nhật khi /hs/thuong trả (số đổi ⇒ đếm từ số cũ, không chớp). Chưa có bản nào ⇒ khung xương (không số).
// Trường nào thiếu ⇒ ô đó ẩn (không bịa số). Có thông báo thưởng chưa xem (thăng hoa, bình đã đỡ, cuối tuần…) ⇒ nạp LƯỜI tấm thông báo.
// Cắm: thay các viên số trong header.da-tren của Lộ trình (xem CAM-VAO.md).
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Bi } from '../linh-vat/Bi'
import { IcLua, IcNguyenTu, IcTinhThe } from './hinh'
import { SoDem } from './SoDem'
import { useTongQuan } from './dung-thuong'
import { locThongBao } from './loc-thong-bao'
import { vongMucTieu } from '../../lib/thuong-api'
import { soGon } from '../../lib/so-gon'
import type { LoaiBieuTuong } from './TamHuongDan'
import '../../styles/trong-thuong-gon.css'

// Tấm thông báo thưởng chưa xem + thẻ hướng dẫn lửa / nguyên tử / tinh thể (thầy 30/10): MỘT cửa nạp lười `PhuThanhThuong` trong mảnh ManThuong
// (đã được SW cất sẵn) ⇒ chạm là nạp, không thêm byte mở app.
const Phu = lazy(() => import('./ManThuong').then((m) => ({ default: m.PhuThanhThuong })))
const CHU_VI = 138.2 // 2π·22

export interface PropsThanhThuong {
  token?: string
  /** Mở màn chi tiết: vòng mục tiêu ⇒ Nhiệm vụ ngày; nút chính của tấm hướng dẫn lửa / nguyên tử / tinh thể ⇒ Chuỗi ngày · Giải tuần / Nhiệm vụ · Cửa hàng.
   *  Không truyền ⇒ vòng chỉ để xem, tấm hướng dẫn chỉ có «Đã hiểu». */
  onMo?: (man: 'chuoi' | 'giai' | 'nhiem-vu' | 'cua-hang') => void
  /** «Học ngay» trên tấm thông báo (thăng hoa, bình đã đỡ…). */
  onHoc?: () => void
  /** Tắt tấm thông báo tự bật (vd. đang ở màn khác). Mặc định bật. */
  thongBao?: boolean
  /** SỐ TRONG HÀNG ĐẦU MENU (thầy 27/10 «chuyển hết 4 biểu tượng bên trái vào menu ẩn bên phải» · «xếp dọc tinh tế bỏ nền thẳng hàng với cái chuông»):
   *  4 mục — vòng mục tiêu · lửa · nguyên tử · tinh thể — mỗi mục biểu tượng trên, số gọn («12,3k») dưới, không nền; chạm ⇒ mở màn như cũ.
   *  Không truyền ⇒ y cũ (thanh ngang). Nhãn đủ chữ ở aria-label. */
  menu?: boolean
  /** Cấp giận của Lửa (31/10, src/lib/lua-cam-xuc.ts): đầu Lửa trong vòng Mục tiêu ngày cùng mặt + màu với Lửa trên Lộ trình. Vắng = 0. */
  capLua?: number
}

export function ThanhThuong({ token, onMo, onHoc, thongBao = true, menu, capLua }: PropsThanhThuong) {
  const { du, tai } = useTongQuan(token)
  const [hd, setHd] = useState<LoaiBieuTuong | null>(null)
  if (!du) return tai ? <div className="tp-tr" aria-busy="true" aria-label="Đang tải số của em">
    {[0, 1, 2].map((i) => <span key={i} className="tp-tr-o" data-k={['lua', 'nt', 'tt'][i]}><span className="tp-tr-cho" /></span>)}
  </div> : null
  const c = du.chuoiNgay, mt = vongMucTieu(du.mucTieu)
  const dat = !!mt && mt.dat
  const p = mt ? Math.min(1, mt.da / mt.can) : 0
  // Một khuôn cho 3 bộ đếm + vòng mục tiêu (`lop` = 'tp-tr-muc'). Lửa / nguyên tử / tinh thể (thầy 30/10) ⇒ LUÔN là nút mở tấm hướng dẫn (nút chính
  // trong tấm mới sang màn chi tiết); vòng mục tiêu: có onMo ⇒ nút mở màn, không ⇒ ô chỉ để xem.
  const o = (k: LoaiBieuTuong | undefined, nhan: string, man: 'chuoi' | 'nhiem-vu' | 'cua-hang', con: ReactNode, lop = 'tp-tr-o', d?: true) => k
    ? <button type="button" className={lop} data-k={k} data-dat={d} aria-label={nhan} aria-haspopup="dialog" onClick={() => setHd(k)}>{con}</button>
    : onMo
    ? <button type="button" className={lop} data-k={k} data-dat={d} aria-label={nhan} onClick={() => onMo(man)}>{con}</button>
    : <span className={lop} data-k={k} data-dat={d} role="img" aria-label={nhan}>{con}</span>
  const dinh = menu ? soGon : undefined
  const tb = thongBao && token ? locThongBao(du) : []
  return <div className="tp-tr">
    {c && o('lua', `Chuỗi ${c.so} ngày`, 'chuoi', <><IcLua tat={c.so === 0} /><SoDem gt={c.so} lat dinh={dinh} className="tp-tr-so" /></>)}
    {du.nguyenTuHomNay !== undefined && o('nt', `${du.nguyenTuHomNay} nguyên tử hôm nay`, 'nhiem-vu', <><IcNguyenTu /><SoDem gt={du.nguyenTuHomNay} dinh={dinh} className="tp-tr-so" /></>)}
    {du.tinhThe !== undefined && o('tt', `${du.tinhThe} tinh thể`, 'cua-hang', <><IcTinhThe /><SoDem gt={du.tinhThe} dinh={dinh} className="tp-tr-so" /></>)}
    {mt && (() => {
      // Thầy 27/10: vòng CÙNG thước đo với thẻ «Đủ x/y câu hôm nay!» — «Mục tiêu hôm nay: 92 câu · đã làm 93»; nhãn dưới vòng «Đủ mức» khi đạt.
      const nhan = `Mục tiêu hôm nay: ${mt.can} ${mt.donVi} · đã làm ${mt.da}${dat ? ', đủ mức' : ''}`
      const vong = <span className="tp-tr-vong" aria-hidden="true">
        <svg className="vm" viewBox="0 0 52 52"><circle className="nen" cx="26" cy="26" r="22" /><circle className="chay" cx="26" cy="26" r="22" strokeDasharray={`${p * CHU_VI} 200`} /></svg>
        <Bi cam={dat ? 'mung' : 'chao'} size={menu ? 18 : 34} nhip="yen" cap={capLua} khung="tron" />
      </span>
      // trong menu: vòng nhỏ trên, số «3/4» (đủ ⇒ «Đủ») dưới; thanh ngang cũ: nhãn «3/4 chặng» / «Đủ mức» dưới vòng
      const ruot = menu
        ? <>{vong}<span className="tp-tr-so">{dat ? 'Đủ' : `${mt.da}/${mt.can}`}</span></>
        : <>{vong}<em aria-hidden="true">{dat ? 'Đủ mức' : `${mt.da}/${mt.can} ${mt.donVi}`}</em></>
      return o(undefined, nhan, 'nhiem-vu', ruot, 'tp-tr-muc', dat || undefined)
    })()}
    {/* 27/10: tấm thông báo toàn khung (position: fixed) đưa ra <body> — thanh trên `.da-tren` có clip-path + sticky z-index ⇒ để bên trong thì tấm bị
        cắt còn đúng dải thanh trên (thấy nút Đóng + bộ đếm, mất thân). */}
    {(tb.length > 0 || hd) && typeof document !== 'undefined' && createPortal(<Suspense fallback={null}><Phu hd={hd ?? undefined} token={token!} tq={du} onHoc={onHoc} onMo={onMo} onDong={() => setHd(null)} /></Suspense>, document.body)}
  </div>
}

export default ThanhThuong
