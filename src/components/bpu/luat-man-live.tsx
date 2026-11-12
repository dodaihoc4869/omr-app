// BÌNH PHẢN ỨNG × LIVE — luật «máy em đang ở màn nào» + màn chờ của em ở xa. Tách khỏi ManBinhPhanUng.tsx (cổng cỡ tệp); cùng mảnh nạp lười với màn ấy.
import { laDienThoai, thuocTinhXoay } from '../live/chieu-xoay'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

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

/** HƯỚNG MÀN LÚC LIVE (thầy 11/11 tối: «khi chuyển câu thì máy hs đang ở màn hình ngang live thì câu hiện luôn theo kiểu xoay ngang không về dạng dọc nữa»).
 *  Bảng live luôn NGANG (Android khoá hướng / trang ngang thật / xoay hình CSS) ⇒ em đang cầm máy ngang. Trước đây thầy chuyển câu ⇒ lớp bảng gỡ ⇒ nhả khoá
 *  (máy khoá xoay hệ thống quay về dọc) và màn câu hỏi không có cách xoay ⇒ câu hiện DỌC. Nay nhớ hướng em đang cầm từ lúc xem bảng:
 *   · `null`    chưa vào bảng trong lần live này / hết live ⇒ màn câu hỏi như cũ, không giữ khoá ngang (máy cầm DỌC chạy y như cũ).
 *   · 'ngang'   bảng hiện trên trang ngang (máy tự xoay, hoặc Android đã khoá ngang) ⇒ giữ khoá ngang tới hết live (LopLive); câu theo hướng trang.
 *   · 'xoay'    bảng phải xoay hình CSS (trang dọc, không khoá được: iPhone, máy khoá xoay hệ thống chưa toàn màn hình) ⇒ màn câu hỏi XOAY HÌNH y như bảng.
 *               Trang thành ngang (em tự xoay máy / khoá được) ⇒ 'ngang': từ đó câu theo hướng trang (em xoay lại dọc ⇒ câu dọc). */
export type HuongLive = null | 'ngang' | 'xoay'
export function buocHuongLive(truoc: HuongLive, che: 'an' | 'dau' | 'bang', liveBat: boolean, doc: boolean): HuongLive {
  if (!liveBat) return null
  if (che === 'bang') return doc ? 'xoay' : 'ngang'
  return truoc === 'xoay' && !doc ? 'ngang' : truoc
}
/** Màn câu hỏi (đang live, chưa vào bảng) xoay hình 90° bằng CSS: chỉ khi em đang cầm ngang trên trang dọc. */
export const xoayManCau = (h: HuongLive, che: 'an' | 'dau' | 'bang', doc: boolean): boolean => che === 'dau' && h === 'xoay' && doc
/** Bề ngang tối thiểu của HÌNH để màn câu hỏi chia hai cột — đúng ngưỡng `@media (orientation: landscape) and (min-width: 640px)` của bpu-hs.css; CÙNG số với
 *  hai cột của màn chặng (`RONG_NGANG_MIN`, bo-cuc-lam.ts — không nhập để mảnh màn này không kéo theo mảnh chặng; test bpu-ngang-de-dap-an-1111 khoá bằng nhau).
 *  11/11 (bố cục ngang «một bên đề một bên chọn đáp án»): trước 700 ⇒ máy 640 / 667 px ngang còn một cột. */
export const RONG_HAI_COT = 640
/** Bề cao tối đa của HÌNH còn tính là «khung thấp xoay ngang» — đúng ngưỡng `@media (orientation: landscape) and (max-height: 500px)` (giám thị gọn, giam-thi.css). */
export const CAO_KHUNG_THAP = 500

/** Trạng thái hướng màn của máy em lúc live (đặt trong ManBinhPhanUng). Cập nhật NGAY trong lượt dựng (không qua hiệu ứng) ⇒ câu mới thay bảng ở đúng khung
 *  hình đầu tiên đã xoay, không nháy dọc. Chỉ nghe đổi cỡ khi đang live. Trả: `giu` = giữ khoá ngang (LopLive) · `xoay` = gốc màn đang xoay hình ·
 *  `the` = thuộc tính + kiểu cho gốc `.bpu-hs` (`data-xoay`; `data-ngang` / `data-thap` = điều kiện @media ngang mà HÌNH thoả — trang dọc nên @media
 *  không khớp, bpu-hs.css nhắc lại đúng các luật ấy; khổ HÌNH = trang đổi trục). */
export function useHuongLive(che: 'an' | 'dau' | 'bang', liveBat: boolean, ep = false): { giu: boolean; xoay: boolean; the: { 'data-xoay'?: '' | 'nguoc'; 'data-ngang'?: ''; 'data-thap'?: ''; style?: CSSProperties } } {
  const [kho, setKho] = useState<readonly [number, number]>(() => [window.innerWidth, window.innerHeight])
  useEffect(() => {
    if (!liveBat && !ep) return
    const doi = () => setKho((c) => (c[0] === window.innerWidth && c[1] === window.innerHeight ? c : [window.innerWidth, window.innerHeight]))
    doi()
    window.addEventListener('resize', doi)
    window.addEventListener('orientationchange', doi)
    return () => { window.removeEventListener('resize', doi); window.removeEventListener('orientationchange', doi) }
  }, [liveBat, ep])
  const doc = kho[1] > kho[0]
  const [huong, setHuong] = useState<HuongLive>(null)
  // `ep` (LIVE THEO KHỐI, thầy 12/11 «ép xoay ngang hết khi hs vào live»): suốt buổi live máy em luôn NGANG — trang dọc thì xoay hình mọi màn
  // (danh sách, câu hỏi, kết quả); riêng lớp bảng live tự xoay lấy nên gốc màn không xoay chồng.
  const moi = ep ? (doc ? 'xoay' : 'ngang') : buocHuongLive(huong, che, liveBat, doc)
  if (moi !== huong) setHuong(moi)
  // chỉ ĐIỆN THOẠI mới bị xoay hình (máy tính / máy tính bảng không bao giờ) — live/chieu-xoay.ts
  const xoay = (ep ? che !== 'bang' && doc : xoayManCau(moi, che, doc)) && laDienThoai()
  if (!xoay) return { giu: moi !== null, xoay, the: {} }
  return { giu: true, xoay, the: { 'data-xoay': thuocTinhXoay(), ...(kho[1] >= RONG_HAI_COT ? { 'data-ngang': '' } : {}), ...(kho[0] <= CAO_KHUNG_THAP ? { 'data-thap': '' } : {}), style: { width: kho[1], height: kho[0] } } }
}

/** EM Ở XA (live đợt 2, điểm quyết 4 — vé «em ở xa»): chỉ xem live. Thầy đang live ⇒ lớp bảng live phủ lên màn này; chưa live / thầy tắt «cho em ở xa» ⇒ màn
 *  chờ, đóng được. Trả [thân màn, nút đáy]. */
export function manEmXa(dangLive: boolean, duocXem: boolean, onDong: () => void): [ReactNode, ReactNode] {
  return [
    <div className="bpu-hs-giua"><h3>{dangLive ? 'Thầy đang live' : duocXem ? 'Em đang xem từ xa' : 'Thầy chưa mở xem từ xa'}</h3><p>{dangLive ? 'Bảng và tiếng thầy đang hiện lên máy em…' : 'Khi thầy bật live, bảng và tiếng thầy tự hiện ở đây.'}</p><p className="nho">Em xem từ xa: không điểm danh, không tính kJ. Lúc thầy đang live mà em rời màn thì thầy thấy tên em.</p></div>,
    dangLive ? null : <button type="button" className="bpu-nut phu" onClick={onDong}>Đóng</button>,
  ]
}
