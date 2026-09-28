// BI-A PHẢN ỨNG · XEM LẠI CÂU SAI (đặc tả 8.8, thầy yêu cầu Q11). Mở lúc CHỜ LƯỢT; mỗi câu hiện đúng mẫu "Câu đã làm" của app:
// TheCau 'xem_lai' + lời giải chuẩn + hình sau lời giải (KhoiLoiGiai của Đảo 2.0). Dữ liệu là phản hồi `answer` đã nhận — không gọi máy chủ thêm.
import { useState } from 'react'
import { KhoiLoiGiai } from '../than-thu-v2/dao2/TrongAi'
import { NhanCau, phanHoiChoLoiGiai } from './TamCauBia'
import type { PhanHoiBia } from './api'
import type { YeuCauCau } from './dieu-khien'

export interface CauSai { y: YeuCauCau; phanHoi: PhanHoiBia; traLoi: string }
export default function XemLaiCauSai({ ds, dongTt, onDong, batDau }: { ds: readonly CauSai[]; dongTt: string; onDong: () => void; batDau?: number }) {
  const [i, setI] = useState(() => Math.max(0, Math.min(ds.length - 1, batDau ?? ds.length - 1)))
  const e = ds[i]
  if (!e) return null
  return (
    <div className="bia-che" role="presentation">
      <div className="bia-tam" role="dialog" aria-modal="true" aria-label="Xem lại câu sai">
        <div className="bia-xem-dau">
          <b>Xem lại câu sai</b>
          <span>Câu {i + 1}/{ds.length}</span>
          <button type="button" className="bia-nut-tron" aria-label="Câu sai trước" disabled={i <= 0} onClick={() => setI(i - 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg></button>
          <button type="button" className="bia-nut-tron" aria-label="Câu sai sau" disabled={i >= ds.length - 1} onClick={() => setI(i + 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg></button>
        </div>
        <div className="bia-dong-tt">{dongTt}</div>
        <div className="bia-dau-cau"><NhanCau y={e.y} /><span>{e.y.cau.tenDang}</span></div>
        <div className="dao2 bia-dao2" key={e.y.ma}><KhoiLoiGiai cau={e.y.cau} stt={i + 1} phanHoi={phanHoiChoLoiGiai(e.phanHoi)} traLoiMay={e.traLoi} /></div>
        <button type="button" className="bia-nut-xanh" onClick={onDong}>Đóng · về bàn</button>
      </div>
    </div>
  )
}
