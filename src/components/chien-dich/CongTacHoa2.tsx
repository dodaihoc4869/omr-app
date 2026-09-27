// CÔNG TẮC GAME HÓA 2.0 ở màn Cài đặt → `co-luu`. Ba lựa chọn: Tắt · Bật cả trung tâm · Bật theo lớp.
// Bật (hay đổi phạm vi) là việc lớn ⇒ hộp xác nhận nói THẬT hậu quả: học sinh chỉ còn Sảnh game, Bài tập về nhà (BTVN) và
// app phụ huynh ngừng; app thầy chỉ còn Ca kiểm tra + Lên bảng. Tắt ⇒ mọi thứ chạy lại như cũ.
import { useEffect, useState } from 'react'
import HopXacNhan from '../HopXacNhan'
import { TheNoiDung } from '../DesignSystem'
import { useAppStore } from '../../store/appStore'
import type { CoHoa2 } from './api'
import { useCoHoa2 } from './co-hoa2'
import './chien-dich.css'

type CheDo = 'tat' | 'ca' | 'lop'
const cheDoCua = (co: CoHoa2 | null): CheDo => (!co?.bat ? 'tat' : co.lop.length ? 'lop' : 'ca')
const tachLop = (s: string): string[] => [...new Set(s.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean))]

export default function CongTacHoa2() {
  const showToast = useAppStore((s) => s.showToast)
  const co = useCoHoa2((s) => s.co)
  const loiDoc = useCoHoa2((s) => s.loi)
  const doc = useCoHoa2((s) => s.doc)
  const luu = useCoHoa2((s) => s.luu)

  const [cheDo, setCheDo] = useState<CheDo>(cheDoCua(co))
  const [lop, setLop] = useState((co?.lop ?? []).join(', '))
  const [hoi, setHoi] = useState<CoHoa2 | null>(null)
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    void doc()
  }, [doc])
  useEffect(() => {
    setCheDo(cheDoCua(co))
    setLop((co?.lop ?? []).join(', '))
  }, [co])

  const moi: CoHoa2 = cheDo === 'tat' ? { bat: false, lop: [], sbd: [] } : cheDo === 'ca' ? { bat: true, lop: [], sbd: [] } : { bat: true, lop: tachLop(lop), sbd: [] }
  const thieuLop = cheDo === 'lop' && moi.lop.length === 0
  const hienTai: CoHoa2 = co?.bat ? { bat: true, lop: co.lop, sbd: co.sbd } : { bat: false, lop: [], sbd: [] }
  const khongDoi = JSON.stringify(moi) === JSON.stringify(hienTai)

  const xacNhan = async () => {
    if (!hoi) return
    setDangLuu(true)
    const chu = await luu(hoi)
    setDangLuu(false)
    setHoi(null)
    if (chu) {
      setLoi(chu)
      return
    }
    setLoi('')
    showToast(hoi.bat ? 'Đã bật Game Hóa 2.0' : 'Đã tắt Game Hóa 2.0 — ba app chạy như cũ', 'success')
  }

  const phamVi = hoi?.lop.length ? `các lớp ${hoi.lop.join(', ')}` : 'cả trung tâm'

  return (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k2)' }}>Game Hóa 2.0</h2>
      <p style={{ marginBottom: 'var(--k3)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
        Vòng khép kín: kết thúc ca kiểm tra → giao chiến dịch luyện có hạn nộp → theo dõi bảng chiến dịch → buổi chữa khi hết hạn nộp. Đang:{' '}
        <b data-trang-thai-hoa2>{!co?.bat ? 'tắt' : co.lop.length ? `bật cho lớp ${co.lop.join(', ')}` : co.sbd.length ? `bật cho ${co.sbd.length} em` : 'bật cả trung tâm'}</b>.
      </p>
      <div role="radiogroup" aria-label="Game Hóa 2.0" className="cd-cong-tac">
        {(
          [
            ['tat', 'Tắt'],
            ['ca', 'Bật cả trung tâm'],
            ['lop', 'Bật theo lớp'],
          ] as const
        ).map(([v, ten]) => (
          <button key={v} type="button" role="radio" aria-checked={cheDo === v} onClick={() => setCheDo(v)} className={`m3-nut-chu${cheDo === v ? ' m3-nut-tonal' : ' m3-nut-vien'}`}>
            {ten}
          </button>
        ))}
      </div>
      {cheDo === 'lop' && (
        <label className="cd-truong" style={{ marginTop: 'var(--k3)' }}>
          Các lớp bật (cách nhau bằng dấu phẩy)
          <input type="text" value={lop} placeholder="12A1, 12A2" onChange={(e) => setLop(e.target.value)} />
          {thieuLop && <small>Nhập ít nhất một lớp.</small>}
        </label>
      )}
      {(loi || (loiDoc && !co)) && (
        <p className="cd-loi" role="alert" style={{ marginTop: 'var(--k2)' }}>
          {loi || loiDoc}
        </p>
      )}
      <div className="cd-hang-nut" style={{ marginTop: 'var(--k3)' }}>
        <button type="button" className="m3-nut-chinh" disabled={khongDoi || thieuLop || dangLuu} onClick={() => setHoi(moi)}>
          {moi.bat ? 'Lưu và bật Game Hóa 2.0' : 'Lưu và tắt Game Hóa 2.0'}
        </button>
      </div>

      {hoi && (
        <HopXacNhan
          tieuDe={hoi.bat ? `Bật Game Hóa 2.0 cho ${phamVi}?` : 'Tắt Game Hóa 2.0?'}
          noiDung={
            hoi.bat ? (
              <p>
                Học sinh {phamVi} chỉ còn Sảnh game (Đảo thần thú, Đoàn Hộ Tống, Câu đã làm) và vào ca kiểm tra khi có ca. Bài tập về nhà (BTVN) ngừng giao và ngừng hiện;
                app phụ huynh ngừng. App thầy chỉ còn Ca kiểm tra và Lên bảng (Học sinh, Ngân hàng đề, Cài đặt nằm trong “Thêm…”). Tắt lại lúc nào cũng được.
              </p>
            ) : (
              <p>Ba app chạy lại như cũ: học sinh thấy lại bảng nhiệm vụ và BTVN, app phụ huynh mở lại, app thầy hiện đủ các mục. Chiến dịch đã giao vẫn giữ trên máy chủ.</p>
            )
          }
          nhanXacNhan={hoi.bat ? 'Bật Game Hóa 2.0' : 'Tắt Game Hóa 2.0'}
          nhanDangLam="Đang lưu…"
          nguyHiem={hoi.bat}
          dangLam={dangLuu}
          onXacNhan={() => void xacNhan()}
          onHuy={() => setHoi(null)}
        />
      )}
    </TheNoiDung>
  )
}
