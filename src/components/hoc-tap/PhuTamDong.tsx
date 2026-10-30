// MÀN PHỦ TẠM ĐÓNG APP HỌC SINH (thầy 27/10 tối). 28/10 (tác tử tốc độ): tách khỏi TrongHs, nạp lười CÙNG mảnh ManThuong (thuong/ManThuong.tsx xuất lại) —
// chỉ tải khi `/hs/thuong` báo `tamDong`. Trước đây mọi lần mở Lộ trình cõng ~0,6 KB nén mã chỉ dùng lúc thầy đóng app (PR 512, 517, 535). Kiểu `.tdg-*` vẫn ở
// styles/trong-hs.css (luôn có khi Lộ trình / gác giao diện cũ vẽ). Cùng chữ, cùng giao diện.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bi } from '../linh-vat/Bi'
import { baoMoi } from '../thuong/dung-thuong'
import { DUONG, layTongQuan } from '../../lib/thuong-api'
import { batNhipBenVung } from '../../lib/nhip-ben-vung'

/** Nhịp tự kiểm lại công tắc tạm đóng (thầy mở lại ⇒ máy em tự vào trong khoảng 1 phút). Vòng chuẩn `batNhipBenVung`: lệch ±10 giây, tab ẩn không gọi, lỗi lùi dần. */
export const TAM_DONG_KIEM_MS = 60_000
/** Ngày bảo trì — CÙNG danh sách với server/src/ngay-bao-tri.ts (test giữ hai bên khớp): chỉ ngày này em không làm mà không bị thiệt (chuỗi, bình…). */
export const NGAY_BAO_TRI_HS: readonly string[] = ['2026-10-27', '2026-10-28', '2026-10-29']
const ngayVn = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
/**
 * Chữ màn phủ theo NGÀY VN. Ngày bảo trì: nguyên văn thầy chốt 27/10. Ngày khác: không hứa «không mất chuỗi» (máy chủ chỉ miễn thiệt cho ngày trong
 * NGAY_BAO_TRI — đóng sang ngày mới mà chưa thêm ngày vào danh sách thì lời hứa ấy SAI), không hứa giờ mở.
 */
export function chuTamDong(ms: number): readonly [string, string] {
  return NGAY_BAO_TRI_HS.includes(ngayVn(ms))
    ? ['Tối nay các em không phải làm.', 'Ngày mai vào làm bình thường.']
    : ['Các em chưa phải làm bài lúc này.', 'App mở lại các em vào làm tiếp bình thường.']
}
/** Đọc lại /hs/thuong rồi báo mọi chỗ đang hiện tổng quan (công tắc tắt ⇒ màn phủ tự gỡ). Trả `false` khi lỗi ⇒ vòng lùi dần. */
const kiemLaiTamDong = (token: string) => layTongQuan(token).then((r) => { if (r.ok) baoMoi(DUONG.tongQuan, token); return r.ok })
export type PropsPhuTamDong = { token?: string; onKiemLai?: () => Promise<unknown> | unknown; kiemDo?: () => void; caMo?: () => void }
/**
 * MÀN PHỦ TẠM ĐÓNG APP (thầy 27/10 tối). Phủ cả Lộ trình khi `/hs/thuong` báo `tamDong`; tự đọc lại theo vòng chuẩn (≈ 60 giây, dừng khi tab ẩn, lỗi lùi dần)
 * và khi em quay lại thẻ ⇒ thầy mở lại là tự vào. Màn làm kiểm tra / ca thi KHÔNG nằm trong Lộ trình nên không bị phủ; còn bài kiểm tra dở / ca đang mở ⇒
 * nút vào nộp tiếp.
 */
export function PhuTamDong(p: PropsPhuTamDong) {
  const [bay, datBay] = useState(() => Date.now())
  const goi = useRef(p.onKiemLai)
  goi.current = p.onKiemLai ?? (p.token ? () => kiemLaiTamDong(p.token!) : undefined)
  useEffect(() => {
    const nhip = batNhipBenVung(() => { datBay(Date.now()); return goi.current?.() }, { coSoMs: TAM_DONG_KIEM_MS, lechMs: 10_000, chayNgay: false })
    const kich = () => nhip.kich()
    document.addEventListener('visibilitychange', kich)
    window.addEventListener('online', kich)
    return () => { nhip.dung(); document.removeEventListener('visibilitychange', kich); window.removeEventListener('online', kich) }
  }, [])
  const [dong1, dong2] = chuTamDong(bay)
  // Phủ CẢ trang (gồm menu bên) ⇒ vẽ ra body; Lộ trình bị che bởi tấm khác (kiểm tra / ca thi / chặng: cổng đặt `inert` lên Lộ trình) ⇒ ẩn để em nộp cho xong.
  const moc = useRef<HTMLSpanElement>(null)
  const [biChe, datBiChe] = useState(false)
  useLayoutEffect(() => {
    const xet = () => datBiChe(!!moc.current?.closest('[inert]'))
    xet()
    const mo = typeof MutationObserver === 'function' ? new MutationObserver(xet) : null
    mo?.observe(document.body, { attributes: true, attributeFilter: ['inert'], subtree: true })
    return () => mo?.disconnect()
  }, [])
  return <><span ref={moc} hidden />{!biChe && createPortal(<div className="tdg-phu" role="dialog" aria-modal="true" aria-labelledby="tdg-tieu" data-vung="tam-dong">
    <div className="tdg-the">
      <Bi cam="ngu" size={120} />
      <h1 id="tdg-tieu">App đang bảo trì.</h1>
      <p>{dong1}<br />{dong2}</p>
      {p.caMo && <button type="button" className="tdg-nut" onClick={p.caMo}>Vào ca kiểm tra</button>}
      {p.kiemDo && <button type="button" className="tdg-nut" onClick={p.kiemDo}>Làm tiếp Kiểm tra ôn tập</button>}
    </div>
  </div>, document.body)}</>
}
