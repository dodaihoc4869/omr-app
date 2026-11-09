// VÍ DỤ MẪU (khối B lát 6 — thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-4; 10/11 «Làm nốt hết đi đẩy lên bản sống luôn nhé»).
// Nhóm lỗi «Chưa biết cách» / «Học lại» ở ngày Sửa ⇒ nút «Xem ví dụ mẫu» mở câu CÙNG DẠNG em ĐÃ LÀM ĐÚNG (máy chủ chọn: goi-bai-7-nhom-sua.ts `viDu`)
// với lời giải đầy đủ — dùng đúng khuôn xem lại chuẩn của «Câu đã làm» (`TheCau` chế độ xem lại qua `propsTheCau`), lấy qua `taiChiTiet` (lệnh
// `hoa2-cau-chi-tiet`: máy chủ CHỈ trả câu em đã làm ⇒ không lộ đáp án câu chưa làm). Mảnh nạp lười khi bấm, có trong kho tải ngầm.
import { useEffect, useState, type ReactElement } from 'react'
import TheCau from '../TheCau'
import { propsTheCau } from '../hoa2/cau-chuyen'
import { taiChiTiet } from '../hoa2/tai-chi-tiet'
import type { ChiTietCau } from '../hoa2/api'
import { ChemText } from '../../lib/chem-format'

export default function ViDuMau({ token, qid, ten, onDong }: { token: string; qid: string; ten: string; onDong: () => void }): ReactElement | null {
  const [ct, setCt] = useState<ChiTietCau | null>(null)
  const [loi, setLoi] = useState(false)
  const [lan, setLan] = useState(0)
  useEffect(() => {
    let het = false
    setLoi(false)
    taiChiTiet(token, [qid]).then((ds) => { if (het) return; if (ds[0]) setCt(ds[0]); else setLoi(true) }, () => { if (!het) setLoi(true) })
    return () => { het = true }
  }, [token, qid, lan])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onDong() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onDong])
  return <div className="vdm-nen" role="dialog" aria-modal="true" aria-labelledby="vdm-tieu" onClick={(e) => { if (e.target === e.currentTarget) onDong() }}>
    <div className="vdm-khung">
      <header className="vdm-dau">
        <h2 id="vdm-tieu">Ví dụ mẫu</h2>
        <p><b><ChemText text={ten} /></b> — câu cùng dạng em đã làm đúng. Xem kĩ cách giải rồi làm nhóm này.</p>
      </header>
      <div className="vdm-than">
        {ct ? <TheCau {...propsTheCau(ct, 1)} />
          : loi ? <p className="vdm-loi" role="alert">Chưa mở được ví dụ mẫu. <button type="button" onClick={() => setLan((n) => n + 1)}>Thử lại</button></p>
          : <p className="vdm-cho" role="status">Đang mở ví dụ mẫu…</p>}
      </div>
      <button type="button" className="vdm-nut" onClick={onDong}>Đã hiểu — làm nhóm này</button>
    </div>
  </div>
}
