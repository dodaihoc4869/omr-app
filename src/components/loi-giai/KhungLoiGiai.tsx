// KHUNG LỜI GIẢI TỪNG BƯỚC — hộp toàn màn chứa trang tĩnh `public/loi-giai/khung.html` trong iframe sandbox="allow-scripts"
// (KHÔNG allow-same-origin: khung không đọc được phiên đăng nhập, không gọi mạng — CSP của khung chặn thêm một lớp).
// Dữ liệu đi một chiều qua postMessage khi khung báo "khung-san-sang". Esc / nút Đóng để thoát; tiêu điểm trả về nút đã mở.
// Câu CHƯA có hồ sơ từng bước (nút Hỏi thầy): hộp hiện lời giải chữ đang có của kho, vẽ bằng React (chữ kho là chữ thường, React tự thoát).
// Vòng học v2 GĐ2: câu có học liệu `kiem` ⇒ khung thêm "Đọc từng bước"; câu kiểm khung gửi lên ('khung-cau-kiem') được chuyển tới máy chủ
// (`/hs/cau-kiem`, chấm ở máy chủ) rồi trả kết quả vào khung ('cau-kiem-kq'); dưới hộp có thanh thang tự gỡ (ThanhThangGo). Màn thầy không có.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { baoDocLoiGiai, guiCauKiem, type CauChoKhung, type HoSoLoiGiai, type KiemKhung, type LoiGiaiChu, type SuKienKhung } from '../../lib/loi-giai-api'
import ThanhThangGo from './ThanhThangGo'
import './loi-giai.css'

export const DUONG_KHUNG = `${import.meta.env.BASE_URL}loi-giai/khung.html`

const DS_DUNG_SAI = (da: string) => /^[DS]{4}$/.test(da) ? da.split('').map((x, i) => `${'abcd'[i]} ${x === 'D' ? 'Đúng' : 'Sai'}`).join(' · ') : da

function LoiGiaiChuView({ cau, lg }: { cau: CauChoKhung; lg: LoiGiaiChu }) {
  return (
    <div className="lg-van">
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

const KIEU_SU_KIEN = new Set(['chon', 'goi_y', 'gan', 'tuong_tu', 'tra_loi_so', 'chot', 'mo_buoc', 'kiem'])

export default function KhungLoiGiai({ hoSo, cau, loiGiaiChu, kiem, thay = false, nguon = '', onDong }: { hoSo?: HoSoLoiGiai | null; cau: CauChoKhung; loiGiaiChu?: LoiGiaiChu; kiem?: KiemKhung; thay?: boolean; nguon?: string; onDong: () => void }) {
  const khung = useRef<HTMLIFrameElement>(null)
  // GĐ1 v2: gom thao tác em làm trong khung (khung chỉ postMessage, không gọi mạng) — đóng hộp thì gửi một lần. Màn thầy không gửi.
  const suKien = useRef<SuKienKhung[]>([])
  const batDau = useRef(Date.now())
  // Thang tự gỡ tải lại sau mỗi câu kiểm và khi em mở tới bước cuối.
  const [lanTai, setLanTai] = useState(0)
  const coThang = !!hoSo && !!kiem && kiem.buoc.length > 0 && !thay
  useEffect(() => {
    if (thay || !hoSo) return
    const bd = Date.now()
    batDau.current = bd
    suKien.current = []
    return () => baoDocLoiGiai(cau.qid, nguon, Math.round((Date.now() - bd) / 1000), suKien.current)
  }, [thay, hoSo, cau.qid, nguon])
  const layDang = useCallback(() => ({ giay: Math.round((Date.now() - batDau.current) / 1000), suKien: suKien.current.slice(0, 200) }), [])
  const nutDong = useRef<HTMLButtonElement>(null)
  const id = useId()
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    const nghe = (e: MessageEvent) => {
      if (!hoSo || e.source !== khung.current?.contentWindow) return
      const m = e.data as { loai?: string; kieu?: string; y?: unknown; dung?: unknown; muc?: unknown; buoc?: unknown; traLoi?: unknown } | null
      if (m?.loai === 'khung-su-kien' && typeof m.kieu === 'string' && KIEU_SU_KIEN.has(m.kieu) && suKien.current.length < 200) {
        suKien.current.push({ k: m.kieu, ...(typeof m.y === 'string' ? { y: m.y.slice(0, 12) } : {}), ...(typeof m.dung === 'boolean' ? { d: m.dung } : {}), ...(typeof m.muc === 'number' ? { m: m.muc } : {}), t: Date.now() })
        if (coThang && m.kieu === 'mo_buoc' && m.y === String((kiem?.buoc.length ?? 0) - 1)) setLanTai((x) => x + 1)
        return
      }
      if (m?.loai === 'khung-cau-kiem') {
        // Khung không có đáp án: câu trả lời đi lên máy chủ chấm, kết quả trả về đúng khung đã hỏi.
        const buoc = Number(m.buoc)
        const traLoi = typeof m.traLoi === 'string' ? m.traLoi.trim().slice(0, 40) : ''
        const w = khung.current?.contentWindow
        if (!coThang || !Number.isInteger(buoc) || buoc < 0 || !traLoi || !w) return
        const mo = [...suKien.current].reverse().find((x) => x.k === 'mo_buoc' && x.y === String(buoc))
        const giay = mo ? Math.round((Date.now() - mo.t) / 1000) : 0
        void guiCauKiem(cau.qid, buoc, traLoi, giay).then((r) => {
          w.postMessage(r.ok
            ? { loai: 'cau-kiem-kq', buoc, dung: r.dung, ...(r.dapAn ? { dapAn: r.dapAn } : {}), ...(r.tenNen ? { tenNen: r.tenNen } : {}) }
            : { loai: 'cau-kiem-kq', buoc, loi: r.loi }, '*')
          setLanTai((x) => x + 1)
        })
        return
      }
      if (m?.loai === 'khung-san-sang') khung.current?.contentWindow?.postMessage({ loai: 'loi-giai', hoSo, cau, thay, ...(coThang ? { kiem } : {}) }, '*')
    }
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') onDong() }
    window.addEventListener('message', nghe)
    window.addEventListener('keydown', phim)
    return () => {
      window.removeEventListener('message', nghe)
      window.removeEventListener('keydown', phim)
      truoc?.focus?.()
    }
  }, [hoSo, cau, thay, onDong, kiem, coThang])
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
      {coThang && kiem && <ThanhThangGo qid={cau.qid} kiem={kiem} lanTai={lanTai} layDang={layDang} />}
    </div>
  )
}
