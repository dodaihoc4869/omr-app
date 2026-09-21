// THẺ "CẢNH BÁO CỦA THẦY" ở đầu Bảng nhiệm vụ (học sinh + phụ huynh). Chỉ thầy bấm mới gửi; thẻ nói đúng sự thật: bài nào, tình trạng thật, hạn lúc nào,
// KHÔNG doạ, KHÔNG so với bạn. Không có cảnh báo ⇒ KHÔNG dựng gì. Không emoji. Chữ do máy chủ gửi luôn được vẽ như CHỮ.
//  · HS: nút "Làm ngay" (mở đúng bài đó — chỉ khi bài có trong danh sách việc của em và chưa quá hạn) + "Đã xem" (ghi máy chủ, thẻ thu gọn thành một dòng).
//  · PH: chỉ đọc + "Đã xem".
// Không tự lập cổng, chỉ react + lucide-react (test bang-nhiem-vu-1909).
import { useState } from 'react'
import { BellRing, Check, Play } from 'lucide-react'
import { chuGuiLuc, chuHanNop, daQuaHan, dongTinhTrang, tieuDeCanhBao, type CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import './m3-theme.css'
import './canh-bao-thay.css'

export default function TheCanhBaoThay({
  vaiTro,
  now,
  canhBao,
  coTheLam,
  onLam,
  onDaXem,
}: {
  vaiTro: 'hocsinh' | 'phuhuynh'
  now: number
  canhBao: CanhBaoThay[]
  /** Bài của cảnh báo này có mở được từ bảng không (có trong danh sách việc của em). Không có ⇒ không nút "Làm ngay". */
  coTheLam?: (cb: CanhBaoThay) => boolean
  onLam?: (cb: CanhBaoThay) => void
  onDaXem?: (cb: CanhBaoThay) => void
}) {
  const laPh = vaiTro === 'phuhuynh'
  // Đã xem tại máy (kể cả khi máy chủ chưa ghi được): thu gọn ngay, không chờ mạng.
  const [xemTaiMay, setXemTaiMay] = useState<Record<string, true>>({})
  if (canhBao.length === 0) return null

  return (
    <div className="bnv-cb-nhom" data-vung="canh-bao-thay">
      {canhBao.map((cb) => {
        const daXem = cb.daXem || xemTaiMay[cb.id] === true
        const quaHan = daQuaHan(cb, now)
        const tinhTrang = dongTinhTrang(cb, now, vaiTro)
        const han = chuHanNop(cb, now)
        const lam = !laPh && !quaHan && !!onLam && (coTheLam ? coTheLam(cb) : true)
        const tieuDe = tieuDeCanhBao(cb, vaiTro)
        const xem = () => {
          setXemTaiMay((v) => ({ ...v, [cb.id]: true }))
          onDaXem?.(cb)
        }
        // Chỉ dùng ở dạng đầy đủ (chưa xem): bấm "Làm ngay" cũng là đã xem.
        const lamNgay = () => {
          xem()
          onLam?.(cb)
        }

        if (daXem) {
          return (
            <section key={cb.id} className="bnv-cb bnv-cb--gon" data-trang-thai="da-xem" aria-label={`Cảnh báo của thầy: ${tieuDe}`}>
              <BellRing size={18} aria-hidden="true" />
              <div className="bnv-cb-gon-chu">
                <b>{tieuDe}</b>
                {(han || tinhTrang) && <span>{[tinhTrang, han].filter(Boolean).join(' ')}</span>}
              </div>
              {lam && (
                <button type="button" className="bnv-cb-nut bnv-cb-nut--gon" onClick={() => onLam?.(cb)}>
                  <Play size={16} fill="currentColor" aria-hidden="true" />
                  <span>Làm ngay</span>
                </button>
              )}
            </section>
          )
        }

        return (
          <section key={cb.id} className="bnv-cb" data-trang-thai="moi" aria-label={`Cảnh báo của thầy: ${tieuDe}`}>
            <div className="bnv-cb-dau">
              <span className="bnv-cb-o" aria-hidden="true">
                <BellRing size={22} />
              </span>
              <div className="bnv-cb-tieu">
                <span className="bnv-cb-nhan">Cảnh báo của thầy</span>
                <h2>{tieuDe}</h2>
              </div>
            </div>
            {cb.loi && <p className="bnv-cb-loi">{cb.loi}</p>}
            {(tinhTrang || han) && (
              <p className="bnv-cb-that">
                {tinhTrang && <span>{tinhTrang}</span>}
                {han && <span>{han}</span>}
              </p>
            )}
            {chuGuiLuc(cb) && <small className="bnv-cb-luc">{chuGuiLuc(cb)}</small>}
            <div className="bnv-cb-chan">
              {lam && (
                <button type="button" className="bnv-cb-nut" onClick={lamNgay}>
                  <Play size={18} fill="currentColor" aria-hidden="true" />
                  <span>Làm ngay</span>
                </button>
              )}
              <button type="button" className="bnv-cb-nut bnv-cb-nut--phu" onClick={xem}>
                <Check size={18} aria-hidden="true" />
                <span>Đã xem</span>
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
