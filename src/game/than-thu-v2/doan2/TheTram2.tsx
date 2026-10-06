// ĐOÀN HỘ TỐNG · THẺ TRẠM HỒI PHỤC (OMNI 3; thầy 06/10: "Tôi làm thử chiến dịch sai 3 câu liên tiếp trong đoàn không thấy về trạm hồi phục").
// Đặc tả gốc: "chuyến Đảo / chặng Đoàn MỘT MÌNH" có Trạm, Đoàn nhiều người không. Máy chủ chỉ trả `omni.tram` khi phòng còn đúng một người thật (hiệp kế chờ em bấm
// "ĐÁNH TIẾP", không đồng hồ) và có câu nền để làm. Thẻ đứng ngay dưới kết quả câu thứ ba sai liền (quãng nghỉ): tiêu đề + câu máy chủ viết sẵn + nút "Làm 3 câu nền"
// mở ĐÚNG hộp câu nền của thang tự gỡ (`HopLuyenNen`, lệnh có sẵn `/hs/luyen-nen`). Không đổi ải kế (ải của Đoàn chia sẵn cho cả đội), Máu Linh Tâm không đổi.
// Vẽ bằng lớp thẻ `dh-buoc-sai` + chip `dh-xin` SẴN CÓ của Đoàn (không màu mới); hộp câu nền vẽ qua cổng ra document.body, nâng trên lớp phủ Đoàn (`dh-tram-hop`).
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { HopLuyenNen } from '../../../components/loi-giai/ThanhThangGo'
import { NUT_LAM_CAU_NEN, TIEU_DE_TRAM } from '../../../lib/omni-chu'
import type { TramHoiPhuc } from '../../../../server/src/omni-kieu'

export default function TheTram2({ tram, qid }: { tram: TramHoiPhuc; qid: string }) {
  const [mo, setMo] = useState(false)
  const [xong, setXong] = useState(false)
  return (
    <div className="dh-buoc-sai dh-tram" role="status" data-khoi="tram-hoi-phuc">
      <b>{TIEU_DE_TRAM}</b>
      <small>{tram.chu}</small>
      {tram.coCauNen && tram.nhan && !xong && (
        <div className="dh-buoc-sai-nut">
          <button type="button" className="dh-xin" style={{ minHeight: 44 }} onClick={() => setMo(true)}>{NUT_LAM_CAU_NEN}</button>
        </div>
      )}
      {mo && tram.nhan && typeof document !== 'undefined' && createPortal(
        <div className="m3 dh-tram-hop" style={{ display: 'contents' }}>
          <HopLuyenNen nhan={tram.nhan} ten={tram.tenLoi ?? tram.ten ?? ''} qid={qid} onDong={() => { setMo(false); setXong(true) }} />
        </div>,
        document.body,
      )}
    </div>
  )
}
