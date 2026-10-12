// "HỒ SƠ LÀM BÀI CỦA CON" — app phụ huynh (đợt 16, thầy 12/10: "Đồng bộ cho cả app hs gv và ph"). Bọc ĐÚNG tấm thầy / học sinh (`HoSoLamCauEm`) ở chế
// độ 'phu-huynh': chữ ngôi "con", ẩn mọi đường của thầy (SBD, Mở hồ sơ đầy đủ, kho thiếu…), hộp câu chưa sửa KHÔNG là đường vào Tự chữa.
// Nguồn = hai lệnh phụ huynh CHỈ ĐỌC `/ph/ho-so-thai-do` · `/ph/lich-su-lam-cau` (src/lib/ho-so-con-ph-api.ts — danh tính như `/ph/con-tong-quan`).
// Nơi mở (thẻ "Nhịp học của con" — NhipHocCon.tsx) nạp LƯỜI. Giống bản học sinh (HoSoCuaEmHs.tsx): vẽ qua cổng vào <body>, khoá trang phía sau,
// Esc / Đóng / nền che ⇒ `onDong`, đóng xong focus TRỞ VỀ phần tử đã mở tấm. MÀU: ho-so-con.css (chỉ ánh xạ biến sẵn có).
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import HoSoLamCauEm from '../chien-dich/HoSoLamCauEm'
import { taoNguonHoSoCon } from '../../lib/ho-so-con-ph-api'
import { useKhoaCuonTrang } from '../../lib/khoa-cuon-trang'
// Tấm dựa vào kiểu dáng khung của app thầy (gv-v2.css — chỉ lớp `.gvv2-*`, không luật toàn cục) mà app phụ huynh không nạp sẵn.
import '../chien-dich/gv-v2.css'
import './ho-so-con.css'

export interface HoSoCuaConPhProps {
  /** SBD của con (danh tính dự phòng khi máy không lưu liên kết riêng — như mọi lệnh `/ph/*`). */
  sbd: string
  /** Tên con hiện ở đầu tấm khi máy chủ chưa trả. */
  tenCon: string
  /** Tên lớp hiện ở đầu tấm khi máy chủ chưa trả. */
  lop?: string
  onDong(): void
}

export default function HoSoCuaConPh({ sbd, tenCon, lop, onDong }: HoSoCuaConPhProps) {
  useKhoaCuonTrang(true)
  const nguon = useMemo(() => taoNguonHoSoCon(sbd), [sbd])
  const em = useMemo(() => ({ sbd: '', ten: tenCon, khoi: null, ...(lop ? { lop } : {}) }), [tenCon, lop])
  // Trả focus: phần tử đang focus lúc mở (nút bảng Nhịp học) — đóng tấm thì focus về đó nếu còn trên trang.
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
    <div className="ph-ho-so-con" data-che-do="phu-huynh">
      <HoSoLamCauEm em={em} nguon={nguon} cheDo="phu-huynh" onDong={onDong} />
    </div>,
    document.body,
  )
}
