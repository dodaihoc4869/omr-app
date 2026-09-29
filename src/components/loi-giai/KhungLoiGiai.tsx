// KHUNG LỜI GIẢI TỪNG BƯỚC — hộp toàn màn chứa trang tĩnh `public/loi-giai/khung.html` trong iframe sandbox="allow-scripts"
// (KHÔNG allow-same-origin: khung không đọc được phiên đăng nhập, không gọi mạng — CSP của khung chặn thêm một lớp).
// Dữ liệu đi một chiều qua postMessage khi khung báo "khung-san-sang". Esc / nút Đóng để thoát; tiêu điểm trả về nút đã mở.
// Câu CHƯA có hồ sơ từng bước (nút Hỏi thầy): hộp hiện lời giải chữ đang có của kho, vẽ bằng React (chữ kho là chữ thường, React tự thoát).
import { useEffect, useId, useRef } from 'react'
import type { CauChoKhung, HoSoLoiGiai, LoiGiaiChu } from '../../lib/loi-giai-api'
import './loi-giai.css'

export const DUONG_KHUNG = `${import.meta.env.BASE_URL}loi-giai/khung.html`

const DS_DUNG_SAI = (da: string) => /^[DS]{4}$/.test(da) ? da.split('').map((x, i) => `${'abcd'[i]} ${x === 'D' ? 'Đúng' : 'Sai'}`).join(' · ') : da

function LoiGiaiChuView({ cau, lg }: { cau: CauChoKhung; lg: LoiGiaiChu }) {
  return (
    <div className="lg-chu">
      <p className="lg-chu-bao">Thầy Đỗ Đại Học đang soạn lời giải từng bước cho câu này. Em xem tạm lời giải ngắn dưới đây.</p>
      {/* `cau.de` do máy chủ dựng từ chữ kho đã thoát HTML (chỉ thêm <p>, <br>, bảng, ảnh data:) */}
      <div className="lg-chu-de" dangerouslySetInnerHTML={{ __html: cau.de }} />
      {Object.keys(cau.y).length > 0 && (
        <ul className="lg-chu-y">
          {Object.entries(cau.y).map(([id, t]) => <li key={id}><b>{id}.</b> <span dangerouslySetInnerHTML={{ __html: t }} /></li>)}
        </ul>
      )}
      <p className="lg-chu-dap-an"><b>Đáp án:</b> {DS_DUNG_SAI(lg.ketQua || lg.dapAn)}</p>
      {lg.chot && <p><b>Điểm mấu chốt:</b> {lg.chot}</p>}
      {lg.tung.length > 0 && (
        <ul className="lg-chu-tung">
          {lg.tung.map((x) => <li key={x.id}><b>{x.id}. {x.dung ? 'Đúng' : 'Sai'}:</b> {x.viSao}</li>)}
        </ul>
      )}
      {lg.buoc.length > 0 && (
        <ol className="lg-chu-buoc">{lg.buoc.map((b, i) => <li key={i}>{b}</li>)}</ol>
      )}
    </div>
  )
}

export default function KhungLoiGiai({ hoSo, cau, loiGiaiChu, thay = false, onDong }: { hoSo?: HoSoLoiGiai | null; cau: CauChoKhung; loiGiaiChu?: LoiGiaiChu; thay?: boolean; onDong: () => void }) {
  const khung = useRef<HTMLIFrameElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const id = useId()
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    const nghe = (e: MessageEvent) => {
      if (!hoSo || e.source !== khung.current?.contentWindow) return
      if ((e.data as { loai?: string })?.loai === 'khung-san-sang') khung.current?.contentWindow?.postMessage({ loai: 'loi-giai', hoSo, cau, thay }, '*')
    }
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') onDong() }
    window.addEventListener('message', nghe)
    window.addEventListener('keydown', phim)
    return () => {
      window.removeEventListener('message', nghe)
      window.removeEventListener('keydown', phim)
      truoc?.focus?.()
    }
  }, [hoSo, cau, thay, onDong])
  return (
    <div className="lg-nen m3" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
      <div className="lg-thanh">
        <h2 id={`${id}-t`} className="lg-tieu-de">{hoSo ? 'Lời giải từng bước' : 'Lời giải'} · {cau.so}</h2>
        <button ref={nutDong} type="button" className="lg-nut" onClick={onDong}>Đóng</button>
      </div>
      {hoSo ? (
        <iframe ref={khung} className="lg-khung" title={`Lời giải từng bước ${cau.so}`} src={DUONG_KHUNG} sandbox="allow-scripts" referrerPolicy="no-referrer" />
      ) : loiGiaiChu ? (
        <div className="lg-cuon"><LoiGiaiChuView cau={cau} lg={loiGiaiChu} /></div>
      ) : null}
    </div>
  )
}
