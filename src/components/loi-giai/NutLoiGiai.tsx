// NÚT "LỜI GIẢI TỪNG BƯỚC" dưới một câu học sinh đã làm. Chỉ hiện khi câu có hồ sơ THẦY ĐÃ DUYỆT (hỏi gộp một lệnh cho cả báo cáo);
// bấm thì máy chủ kiểm lại cổng công bố + vân tay đề rồi mới trả hồ sơ. Không có phiên học sinh / chưa duyệt ⇒ không hiện gì.
import { useEffect, useState } from 'react'
import { coLoiGiai, taiLoiGiai, type CauChoKhung, type HoSoLoiGiai } from '../../lib/loi-giai-api'
import KhungLoiGiai from './KhungLoiGiai'
import './loi-giai.css'

export default function NutLoiGiai({ qid }: { qid?: string | null }) {
  const [co, setCo] = useState(false)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [mo, setMo] = useState<{ hoSo: HoSoLoiGiai; cau: CauChoKhung } | null>(null)
  useEffect(() => {
    let con = true
    if (qid) void coLoiGiai(qid).then((x) => { if (con) setCo(x) })
    return () => { con = false }
  }, [qid])
  if (!qid || !co) return null
  const bam = async () => {
    setDangTai(true)
    setLoi('')
    const r = await taiLoiGiai(qid)
    setDangTai(false)
    if (r.ok) setMo({ hoSo: r.hoSo, cau: r.cau })
    else setLoi(r.loi)
  }
  return (
    <div className="lg-nut-hang">
      <button type="button" className="lg-nut lg-nut--chinh" onClick={bam} disabled={dangTai}>
        {dangTai ? 'Đang mở…' : 'Xem lời giải từng bước'}
      </button>
      {loi && <span className="lg-loi" role="status">{loi}</span>}
      {mo && <KhungLoiGiai hoSo={mo.hoSo} cau={mo.cau} onDong={() => setMo(null)} />}
    </div>
  )
}
