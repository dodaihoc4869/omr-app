// DẢI NHẮC "THÊM VÀO MÀN HÌNH CHÍNH" — hiện ở đầu màn vào thi, TRƯỚC ô số báo
// danh, CHỈ khi app đang chạy trong tab trình duyệt thường (display-mode:
// browser). Đã cài rồi thì không bao giờ hiện. "Bỏ qua" ghi nhớ localStorage,
// không hỏi lại. Chrome/Android có beforeinstallprompt → thêm nút "Cài đặt"
// 1 chạm; Safari không có → chỉ hướng dẫn tay.
import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { caiMotCham, coTheCaiMotCham, daBoQuaNhacCai, dangTrongTrinhDuyet, ghiNhoBoQuaNhacCai, theoDoiSuKienCai } from '../lib/pwa-install'

export default function DaiNhacCaiApp() {
  const [hien, setHien] = useState(() => dangTrongTrinhDuyet() && !daBoQuaNhacCai())
  const [coNutCai, setCoNutCai] = useState(coTheCaiMotCham())

  useEffect(() => theoDoiSuKienCai(() => setCoNutCai(coTheCaiMotCham())), [])
  // Đang mở dải mà em cài xong (Chrome chuyển sang cửa sổ standalone) → ẩn.
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: browser)')
    const onChange = () => setHien(dangTrongTrinhDuyet() && !daBoQuaNhacCai())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (!hien) return null

  const boQua = () => {
    ghiNhoBoQuaNhacCai()
    setHien(false)
  }
  const cai = async () => {
    const ok = await caiMotCham()
    if (ok) setHien(false)
    else setCoNutCai(coTheCaiMotCham())
  }

  return (
    <div
      role="note"
      className="flex items-start"
      style={{
        gap: 'var(--k3)',
        background: 'var(--cam-nen)',
        borderLeft: '3px solid var(--cam)',
        borderRadius: 'var(--bo-1)',
        padding: 'var(--k3) var(--k4)',
        marginBottom: 'var(--k4)',
        fontFamily: 'var(--sans)',
        fontSize: 'var(--cx-1)',
        color: 'var(--muc)',
        lineHeight: 1.6,
      }}
    >
      <Smartphone size={20} className="shrink-0" style={{ color: 'var(--cam)', marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
          Thêm vào màn hình chính để làm bài toàn màn hình
        </div>
        {!coNutCai && (
          <div style={{ color: 'var(--nhat)' }}>
            Chrome: menu ⋮ → <b>Thêm vào Màn hình chính</b>
            <br />
            Safari: nút Chia sẻ → <b>Thêm vào MH chính</b>
          </div>
        )}
        <div className="flex items-center" style={{ gap: 'var(--k4)', marginTop: 'var(--k2)' }}>
          {coNutCai && (
            <button type="button" onClick={cai} className="tap-target font-bold" style={{ color: 'var(--muc-nguoc)', background: 'var(--muc)', borderRadius: 'var(--bo-1)', padding: '0 var(--k4)' }}>
              Cài đặt
            </button>
          )}
          <button type="button" onClick={boQua} className="tap-target" style={{ color: 'var(--nhat)' }}>
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  )
}
