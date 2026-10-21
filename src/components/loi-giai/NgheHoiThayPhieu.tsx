// NGHE NÚT "HỎI THẦY" CỦA PHIẾU HTML trong một iframe trần (PhieuScreen mở phiếu bài tập qua đường link): phiếu nhắn `ddh-hoi-thay`
// (html-phieu.ts HOI_THAY_PHIEU) ⇒ mở hộp hỏi Thầy / lời giải như KhungXemPhieu. Trước 13/10 nút ở đây không ai nghe (nút chết).
import { useEffect, useState, type RefObject } from 'react'
import { CHU_LAM_XONG, hoiThay, type CauChoKhung, type HoSoLoiGiai, type KiemKhung, type LoiGiaiChu } from '../../lib/loi-giai-api'
import HopHoiThay from './HopHoiThay'
import KhungLoiGiai from './KhungLoiGiai'
import './loi-giai.css'

type Hoi = { cau: CauChoKhung; hoSo?: HoSoLoiGiai; loiGiaiChu?: LoiGiaiChu; kiem?: KiemKhung; hoiThem: boolean; dangLam: boolean; em: unknown }

export default function NgheHoiThayPhieu({ khung }: { khung: RefObject<HTMLIFrameElement | null> }) {
  const [hoi, setHoi] = useState<Hoi | null>(null)
  const [loi, setLoi] = useState('')
  useEffect(() => {
    const nghe = (e: MessageEvent) => {
      if (e.data?.type !== 'ddh-hoi-thay' || !e.data.qid || e.source !== khung.current?.contentWindow) return
      const dangLam = e.data.dangLam === true
      void hoiThay(String(e.data.qid), 'phieu', dangLam, undefined, true).then((r) => {
        if (!r.ok) setLoi(r.loi)
        else if (dangLam && !r.hoiThem) setLoi(CHU_LAM_XONG)
        else setHoi({ cau: r.cau, hoSo: r.hoSo, loiGiaiChu: r.loiGiaiChu, kiem: 'kiem' in r ? r.kiem : undefined, hoiThem: r.hoiThem === true, dangLam, em: r.emVaCau ?? null })
      })
    }
    window.addEventListener('message', nghe)
    return () => window.removeEventListener('message', nghe)
  }, [khung])
  return (
    <>
      {hoi && (hoi.hoiThem
        ? <HopHoiThay cau={hoi.cau} em={hoi.em} nguon="phieu" dangLam={hoi.dangLam} onDong={() => setHoi(null)} onMoLoiGiai={hoi.dangLam ? undefined : () => setHoi({ ...hoi, hoiThem: false })} />
        : <KhungLoiGiai hoSo={hoi.hoSo} cau={hoi.cau} loiGiaiChu={hoi.loiGiaiChu} kiem={hoi.kiem} nguon="phieu" onDong={() => setHoi(null)} />)}
      {loi && (
        <div className="lg-bao-loi m3" role="alert">
          <span>{loi}</span>
          <button type="button" className="lg-nut" onClick={() => setLoi('')}>Đóng</button>
        </div>
      )}
    </>
  )
}
