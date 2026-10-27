// THANH TRÊN THƯỞNG PHẠT (bản vẽ tp-4, thầy chốt 26/10): đúng 3 bộ đếm — chuỗi ngày · nguyên tử hôm nay · tinh thể — + Bi trong vòng «Mục tiêu ngày x/y bài».
// Phần HIỆN NGAY: vẽ từ bản gần nhất ở máy rồi cập nhật khi /hs/thuong trả (số đổi ⇒ đếm từ số cũ, không chớp). Chưa có bản nào ⇒ khung xương (không số).
// Trường nào thiếu ⇒ ô đó ẩn (không bịa số). Có thông báo thưởng chưa xem (thăng hoa, bình đã đỡ, cuối tuần…) ⇒ nạp LƯỜI tấm thông báo.
// Cắm: thay các viên số trong header.da-tren của Lộ trình (xem CAM-VAO.md).
import { lazy, Suspense, useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Bi } from '../linh-vat/Bi'
import { IcLua, IcNguyenTu, IcTinhThe } from './hinh'
import { SoDem } from './SoDem'
import { useTongQuan } from './dung-thuong'
import { locThongBao } from './loc-thong-bao'
import { vongMucTieu } from '../../lib/thuong-api'
import { soGon } from '../../lib/so-gon'
import { TheVien, type NoiDungTheVien } from './TheVien'
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
  /** VIÊN ĐẾM (thầy chốt P2 27/10): 'noi' = viên nổi mép trái (điện thoại, xoay ngang) · 'menu' = trong thanh menu trái (máy tính).
   *  Có ⇒ số dài rút gọn («12,3k»), chạm viên ⇒ THẺ BẬT nhãn đầy đủ + nút mở màn (không mở thẳng). Không truyền ⇒ y cũ (thanh ngang, bấm là mở). */
  vien?: 'noi' | 'menu'
}

type KhoaVien = 'lua' | 'nt' | 'tt' | 'muc'
const vn = (v: number) => v.toLocaleString('vi-VN')

export function ThanhThuong({ token, onMo, onHoc, thongBao = true, vien }: PropsThanhThuong) {
  const { du, tai } = useTongQuan(token)
  const [mo, datMo] = useState<{ k: KhoaVien; el: HTMLElement } | null>(null)
  const dong = useCallback((traFocus: boolean) => { datMo((m) => { if (traFocus) m?.el.focus(); return null }) }, [])
  if (!du) return tai ? <div className="tp-tr" aria-busy="true" aria-label="Đang tải số của em">
    {[0, 1, 2].map((i) => <span key={i} className="tp-tr-o" data-k={['lua', 'nt', 'tt'][i]}><span className="tp-tr-cho" /></span>)}
  </div> : null
  const c = du.chuoiNgay, mt = vongMucTieu(du.mucTieu)
  const dat = !!mt && mt.dat
  const p = mt ? Math.min(1, mt.da / mt.can) : 0
  // Một khuôn cho 3 bộ đếm + vòng mục tiêu (`lop` = 'tp-tr-muc'): có onMo ⇒ nút mở màn; không ⇒ ô chỉ để xem.
  // Viên (vien): bấm ⇒ thẻ bật (aria-expanded + aria-controls); bấm lại viên đang mở ⇒ đóng.
  const o = (k: 'lua' | 'nt' | 'tt' | undefined, nhan: string, man: 'chuoi' | 'nhiem-vu' | 'cua-hang', con: ReactNode, lop = 'tp-tr-o', d?: true) => onMo
    ? vien
      ? <button type="button" className={lop} data-k={k} data-dat={d} aria-label={nhan} aria-haspopup="dialog" aria-expanded={mo?.k === (k ?? 'muc')}
        aria-controls={mo?.k === (k ?? 'muc') ? `tp-vien-${k ?? 'muc'}` : undefined}
        onClick={(e) => { const el = e.currentTarget; datMo((m) => (m?.k === (k ?? 'muc') ? null : { k: k ?? 'muc', el })) }}>{con}</button>
      : <button type="button" className={lop} data-k={k} data-dat={d} aria-label={nhan} onClick={() => onMo(man)}>{con}</button>
    : <span className={lop} data-k={k} data-dat={d} role="img" aria-label={nhan}>{con}</span>
  const dinh = vien ? soGon : undefined
  // Nội dung thẻ bật của từng viên — số ĐẦY ĐỦ (không rút gọn).
  const theNd = (k: KhoaVien): NoiDungTheVien | null => {
    if (!onMo) return null
    if (k === 'lua' && c) return { sac: 'chu-y', tieu: `Chuỗi ${vn(c.so)} ngày`, phu: 'Mỗi ngày xong ít nhất 1 chặng để giữ chuỗi.', nut: 'Xem chuỗi ngày', onNut: () => onMo('chuoi') }
    if (k === 'nt' && du.nguyenTuHomNay !== undefined) return { sac: 'dung', tieu: `${vn(du.nguyenTuHomNay)} nguyên tử hôm nay`, phu: 'Làm đúng câu để nhận thêm nguyên tử.', nut: 'Xem nhiệm vụ ngày', onNut: () => onMo('nhiem-vu') }
    if (k === 'tt' && du.tinhThe !== undefined) return { sac: 'tim', tieu: `${vn(du.tinhThe)} tinh thể`, phu: 'Dùng tinh thể ở Cửa hàng.', nut: 'Mở cửa hàng', onNut: () => onMo('cua-hang') }
    if (k === 'muc' && mt) return { sac: dat ? 'sao' : 'tin', tieu: `Mục tiêu hôm nay: ${vn(mt.can)} ${mt.donVi}`, phu: dat ? `Đã làm ${vn(mt.da)} ${mt.donVi}, đủ mức.` : `Đã làm ${vn(mt.da)}/${vn(mt.can)} ${mt.donVi}.`, nut: 'Xem nhiệm vụ ngày', onNut: () => onMo('nhiem-vu') }
    return null
  }
  const nd = vien && mo ? theNd(mo.k) : null
  const tb = thongBao && token ? locThongBao(du) : []
  return <div className="tp-tr">
    {c && o('lua', `Chuỗi ${c.so} ngày`, 'chuoi', <><IcLua tat={c.so === 0} /><SoDem gt={c.so} lat dinh={dinh} className="tp-tr-so" /></>)}
    {du.nguyenTuHomNay !== undefined && o('nt', `${du.nguyenTuHomNay} nguyên tử hôm nay`, 'nhiem-vu', <><IcNguyenTu /><SoDem gt={du.nguyenTuHomNay} dinh={dinh} className="tp-tr-so" /></>)}
    {du.tinhThe !== undefined && o('tt', `${du.tinhThe} tinh thể`, 'cua-hang', <><IcTinhThe /><SoDem gt={du.tinhThe} dinh={dinh} className="tp-tr-so" /></>)}
    {mt && (() => {
      // Thầy 27/10: vòng CÙNG thước đo với thẻ «Đủ x/y câu hôm nay!» — «Mục tiêu hôm nay: 92 câu · đã làm 93»; nhãn dưới vòng «Đủ mức» khi đạt.
      const nhan = `Mục tiêu hôm nay: ${mt.can} ${mt.donVi} · đã làm ${mt.da}${dat ? ', đủ mức' : ''}`
      const ruot = <>
        <svg className="vm" viewBox="0 0 52 52" aria-hidden="true"><circle className="nen" cx="26" cy="26" r="22" /><circle className="chay" cx="26" cy="26" r="22" strokeDasharray={`${p * CHU_VI} 200`} /></svg>
        <Bi cam={dat ? 'mung' : 'chao'} size={34} nhip="yen" />
        {/* viên nổi 44 px: nhãn gọn «3/4» (đủ chữ ở thẻ bật); trong menu máy tính: chữ đầy đủ hai dòng */}
        <em aria-hidden="true">{vien === 'menu' ? <>Mục tiêu hôm nay<br />{dat ? 'Đủ mức' : `${mt.da}/${mt.can} ${mt.donVi}`}</> : dat ? 'Đủ mức' : vien ? `${mt.da}/${mt.can}` : `${mt.da}/${mt.can} ${mt.donVi}`}</em>
      </>
      return o(undefined, nhan, 'nhiem-vu', ruot, 'tp-tr-muc', dat || undefined)
    })()}
    {/* 27/10: tấm thông báo toàn khung (position: fixed) đưa ra <body> — thanh trên `.da-tren` có clip-path + sticky z-index ⇒ để bên trong thì tấm bị
        cắt còn đúng dải thanh trên (thấy nút Đóng + bộ đếm, mất thân). */}
    {nd && mo && <TheVien id={`tp-vien-${mo.k}`} el={mo.el} nd={nd} onDong={dong} />}
    {tb.length > 0 && typeof document !== 'undefined' && createPortal(<Suspense fallback={null}><ThongBaoThuong token={token!} tongQuan={du} onHoc={onHoc} /></Suspense>, document.body)}
  </div>
}

export default ThanhThuong
