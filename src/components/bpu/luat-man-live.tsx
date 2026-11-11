// BÌNH PHẢN ỨNG × LIVE — luật «máy em đang ở màn nào» + màn chờ của em ở xa. Tách khỏi ManBinhPhanUng.tsx (cổng cỡ tệp); cùng mảnh nạp lười với màn ấy.
import type { ReactNode } from 'react'

/** MÀN CỦA MÁY EM LÚC THẦY LIVE — thầy test máy thật 11/11:
 *  (K1) «Khi chuyển câu, máy hs nhận câu nhưng khi bấm nộp thì không tự về màn live» ⇒ đang live, màn câu hỏi CHỈ hiện lúc em đang làm (`dangLam`: lượt đang
 *       mở, em chưa gửi, chưa hết giờ). Em bấm gửi (đổi ngay trên máy, không chờ phòng) / hết giờ / thầy mở đáp án / chưa có lượt ⇒ về BẢNG LIVE ngay.
 *  (K2) «Bấm lên bảng là phải ép hết mọi hs vào live không chờ nộp xong» ⇒ cờ phòng `live.bang` (`coBang`: tự bật khi thầy gọi em lên bảng; thầy bật tay bằng
 *       «Bảng → máy em») ÉP mọi máy vào bảng live kể cả em chưa gửi. Lượt đã khoá theo luật gọi lên bảng đang có (`nhanTra` ⇒ `da-khoa`): đáp án em chọn dở
 *       KHÔNG được gửi hộ. Đáp án / lời giải vẫn chỉ xuống máy em sau khi thầy mở.
 *  (K6) Chuyển cảnh tức thì: không chờ tia lửa gửi bay xong (kết quả gửi hiện ở dải lượt trên bảng live).
 *  Em Ở XA (không có màn câu hỏi) luôn xem bảng. Đang hiện cảnh báo rời màn ⇒ lớp live nhường màn (`an`: chỉ nối ngầm).
 *  Trả: `an` = không vẽ gì · `dau` = màn câu hỏi + tay nắm «Thầy đang live» ở mép trái · `bang` = bảng live phủ kín. */
export function cheLiveCua(o: { liveBat: boolean; vuaRoi: boolean; xaEm: boolean; coBang: boolean; dangLam: boolean }): 'an' | 'dau' | 'bang' {
  return !o.liveBat || o.vuaRoi ? 'an' : o.xaEm || o.coBang || !o.dangLam ? 'bang' : 'dau'
}

/** EM Ở XA (live đợt 2, điểm quyết 4 — vé «em ở xa»): chỉ xem live. Thầy đang live ⇒ lớp bảng live phủ lên màn này; chưa live / thầy tắt «cho em ở xa» ⇒ màn
 *  chờ, đóng được. Trả [thân màn, nút đáy]. */
export function manEmXa(dangLive: boolean, duocXem: boolean, onDong: () => void): [ReactNode, ReactNode] {
  return [
    <div className="bpu-hs-giua"><h3>{dangLive ? 'Thầy đang live' : duocXem ? 'Em đang xem từ xa' : 'Thầy chưa mở xem từ xa'}</h3><p>{dangLive ? 'Bảng và tiếng thầy đang hiện lên máy em…' : 'Khi thầy bật live, bảng và tiếng thầy tự hiện ở đây.'}</p><p className="nho">Em xem từ xa: không điểm danh, không tính kJ. Lúc thầy đang live mà em rời màn thì thầy thấy tên em.</p></div>,
    dangLive ? null : <button type="button" className="bpu-nut phu" onClick={onDong}>Đóng</button>,
  ]
}
