// "HỒ SƠ LÀM BÀI CỦA EM" — app học sinh (thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé").
// Bọc ĐÚNG tấm thầy mở ở Hôm nay › Nhịp học (`HoSoLamCauEm`) ở chế độ học sinh, nguồn = hai lệnh học sinh CHỈ ĐỌC (`/hs/ho-so-thai-do`,
// `/hs/lich-su-lam-cau` — src/lib/ho-so-em-hs-api.ts; máy chủ lấy SBD từ token, bỏ lượt chưa được xem kết quả, không đáp án em chọn).
// Nơi mở (thẻ "Hôm nay của em" — làn khác, prop `onMoHoSo`) nạp LƯỜI: `lazy(() => import('../hoc-tap/HoSoCuaEmHs'))`; mảnh này ngoài precache.
//   · Trượt ra từ PHẢI trên máy tính (rộng ≤ 760 px, nền che), TOÀN MÀN trên điện thoại dọc (≤ 600 px) — khung sẵn có của tấm (gv-v2.css).
//   · Esc / nút Đóng (≥ 44 px) / bấm nền che ⇒ `onDong`; Tab giữ trong tấm (tấm lo); đóng xong focus TRỞ VỀ đúng phần tử đã mở tấm (ở đây lo).
//   · Mở ⇒ khoá trang phía sau (`useKhoaCuonTrang`); tấm có MỘT khung cuộn riêng (thân tấm), vuốt được tới đáy, không trôi xuống trang sau.
//   · Vẽ qua cổng (portal) vào <body>: lớp `position: fixed` của tấm không bị khung cha (transform / overflow / inert) cắt hay khoá.
//   · MÀU: xem ho-so-cua-em-hs.css (bảng --gvm-* sẵn có, sáng/tối theo máy như app học sinh; nền che = --phu của app học sinh).
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import HoSoLamCauEm from '../chien-dich/HoSoLamCauEm'
import { taoNguonHoSoEm } from '../../lib/ho-so-em-hs-api'
import { useKhoaCuonTrang } from '../../lib/khoa-cuon-trang'
// Tấm thầy dựa vào kiểu dáng khung của app thầy (gv-v2.css — chỉ lớp `.gvv2-*`, không luật toàn cục) mà app học sinh không nạp sẵn.
import '../chien-dich/gv-v2.css'
import './ho-so-cua-em-hs.css'

export interface HoSoCuaEmHsProps {
  /** Token phiên của em (cùng token `/hs/nhip-hoc`). */
  token: string
  /** Tên em hiện ở đầu tấm khi máy chủ chưa trả. */
  tenEm: string
  /** Tên lớp hiện ở đầu tấm khi máy chủ chưa trả (vd "12A1"). */
  lop?: string
  onDong(): void
  /** Đợt 16: bấm một hộp "Chưa sửa được" ⇒ mở Tự chữa đúng câu ấy. `qid` = khoá câu của lệnh `/hs/lich-su-lam-cau` (bản học sinh: "c1", "c2"…
   *  theo hợp đồng lọc server/src/ho-so-em-hs-loc.ts). Cổng học sinh (StudentPortalScreen) nối. Vắng ⇒ hộp không bấm được. */
  onChuaCau?: (qid: string) => void
}

export default function HoSoCuaEmHs({ token, tenEm, lop, onDong, onChuaCau }: HoSoCuaEmHsProps) {
  useKhoaCuonTrang(true)
  const nguon = useMemo(() => taoNguonHoSoEm(token), [token])
  const em = useMemo(() => ({ sbd: '', ten: tenEm, khoi: null, ...(lop ? { lop } : {}) }), [tenEm, lop])
  // Trả focus: phần tử đang focus lúc mở (nút / bảng em vừa bấm) — đóng tấm thì focus về đó nếu còn trên trang.
  const moTu = useRef<HTMLElement | null>(null)
  if (moTu.current === null && typeof document !== 'undefined') moTu.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  useEffect(
    () => () => {
      const el = moTu.current
      if (el && el.isConnected && el !== document.body) el.focus()
    },
    [],
  )
  return createPortal(
    <div className="hs-ho-so-em" data-che-do="hoc-sinh">
      <HoSoLamCauEm em={em} nguon={nguon} cheDo="hoc-sinh" onDong={onDong} onChuaCau={onChuaCau} />
    </div>,
    document.body,
  )
}
