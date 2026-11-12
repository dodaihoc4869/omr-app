// THẺ «LIVE» Ở TRANG CHỦ MÁY EM — lối vào Live theo khối (thầy duyệt bản vẽ 12/11; docs/ban-ve-live-moi-1211 ảnh 06; đặc tả docs/dac-ta-live-moi-1211.md mục 3).
// Không có buổi cho khối em ⇒ KHÔNG vẽ gì (trang chủ không thêm thứ thừa). Có lịch ⇒ thẻ giờ + đếm ngược. Thầy mở phòng chờ / đang live ⇒ thẻ sáng + «Tham gia».
// Hỏi máy chủ: lúc gắn, khoảng 2 phút một lần khi tab đang hiện (qua nhip-ben-vung), ngay khi em quay lại tab, và ngay khi kênh đẩy phát sự kiện cửa sổ `ddh-live-khoi`.
import { useCallback, useEffect, useRef, useState } from 'react'
import { liveCuaEm, vaoLiveKhoi } from '../../lib/live-khoi/api'
import { taiSanEm } from './tai-san-em'
import { batNhipBenVung } from '../../lib/nhip-ben-vung'
import { henKhiCoKenh } from '../../lib/kenh-co'
import type { LiveCuaEm } from '../../lib/live-khoi/kieu'
import { chuConLai, chuGioLive } from './chu-gio'
import './the-live-em.css'

const HOI_MS = 120_000 // kênh đẩy `live` đã báo ngay khi thầy mở / bắt đầu / kết thúc; nhịp chỉ là lưới an toàn khi kênh rớt
const LECH_MS = 20_000
const CHAN_DOI_MS = 2000
const DEM_MS = 30_000
const BieuLive = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="2.5" /><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9" /></svg>
)
const BieuLich = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10.5h17" /></svg>
)

export default function TheLiveEm({ token }: { token: string }) {
  const [tt, setTt] = useState<LiveCuaEm>({ trangThai: 'khong' })
  const [nay, setNay] = useState(() => Date.now())
  const [dangVao, setDangVao] = useState(false)
  const [loi, setLoi] = useState('')
  const dangGoi = useRef(false) // chặn bấm lặp trước khi React kịp khoá nút
  const luot = useRef(0)
  const ttCu = useRef<LiveCuaEm['trangThai']>('khong')

  // Vòng hỏi máy chủ đi qua nhip-ben-vung (luật nhịp app học sinh): 2 phút ± 20 giây để cả khối không đồng pha, không gọi chồng, tab ẩn không gọi,
  // quay lại tab ⇒ hỏi ngay. Kênh đẩy báo thầy vừa mở / bắt đầu / kết thúc (`ddh-live-khoi`) ⇒ hỏi thẳng, không chờ nhịp.
  useEffect(() => {
    if (!token) return
    let song = true
    const hoi = async () => {
      const l = ++luot.current
      const r = await liveCuaEm(token)
      if (!song || l !== luot.current) return
      // Buổi hết / đổi trạng thái ⇒ lỗi cũ không còn đúng.
      if (r.trangThai !== ttCu.current) { ttCu.current = r.trangThai; setLoi('') }
      setTt(r); setNay(Date.now())
    }
    // 12/11 giảm chi phí: kênh đẩy mở ⇒ mọi đổi trạng thái live đã báo tức thì (`ddh-live-khoi`; nối lại sau khi đứt cũng hỏi lại) ⇒ lưới an toàn 6 phút.
    const nhip = batNhipBenVung(hoi, { coSoMs: HOI_MS, lechMs: LECH_MS, chanDoiMs: CHAN_DOI_MS, heSoToiDa: 1, datGio: henKhiCoKenh })
    const doiHien = () => nhip.kich()
    const day = () => { void hoi() }
    document.addEventListener('visibilitychange', doiHien)
    window.addEventListener('ddh-live-khoi', day)
    return () => { song = false; nhip.dung(); document.removeEventListener('visibilitychange', doiHien); window.removeEventListener('ddh-live-khoi', day) }
  }, [token])

  // Đếm ngược chỉ chạy khi đang có lịch hẹn.
  const coHen = tt.trangThai === 'hen'
  // Có buổi cho khối em (hẹn / phòng chờ / đang live) ⇒ tải sẵn mọi mảnh của live lúc máy rảnh: bấm «Tham gia» là vào ngay.
  const coBuoi = tt.trangThai !== 'khong'
  useEffect(() => { if (coBuoi) taiSanEm() }, [coBuoi])
  useEffect(() => {
    if (!coHen) return
    const h = window.setInterval(() => setNay(Date.now()), DEM_MS)
    return () => clearInterval(h)
  }, [coHen])

  const thamGia = useCallback(async () => {
    if (dangGoi.current) return
    dangGoi.current = true; setDangVao(true); setLoi('')
    // Màn phòng hiện NGAY lúc bấm (mảnh đã tải sẵn); máy chủ + phòng trả lời sau.
    const baoVao = (co: boolean): void => { void import('./em-khoi').then((m) => m.baoDangVao(co)).catch(() => {}) }
    baoVao(true)
    try {
      const r = await vaoLiveKhoi(token)
      if (!r.ok) { baoVao(false); setLoi(r.chu); return }
      const m = await import('../bpu/gan-hs')
      if (!m.moBpuHs(token, r.buoiId)) { baoVao(false); setLoi('Em đang làm bài thi. Nộp bài xong rồi bấm «Tham gia» nhé.') }
    } catch { baoVao(false); setLoi('Chưa mở được màn live. Em kiểm tra mạng rồi thử lại.') } finally { dangGoi.current = false; setDangVao(false) }
  }, [token])

  if (tt.trangThai === 'khong') return null
  if (tt.trangThai === 'hen') {
    const co = typeof tt.batDau === 'number'
    return (
      <div className="tle" data-tt="hen" role="status">
        <span className="tle-bieu" aria-hidden="true"><BieuLich /></span>
        <div className="tle-chu">
          <b>{co ? chuGioLive(tt.batDau!, nay) : 'Thầy đã hẹn buổi live'}</b>
          <span>{[tt.ten, co ? chuConLai(tt.batDau!, nay) : ''].filter(Boolean).join(' · ') || 'Tới giờ thẻ này tự sáng.'}</span>
        </div>
      </div>
    )
  }
  const khoi = tt.khoi ? ` · Khối ${tt.khoi}` : ''
  return (
    <div className="tle-khung">
      <div className="tle" data-tt={tt.trangThai}>
        <span className="tle-bieu" aria-hidden="true"><BieuLive /></span>
        <div className="tle-chu">
          <b>{tt.trangThai === 'dang' ? `Thầy đang live${khoi}` : `Thầy đang mở phòng chờ${khoi}`}</b>
          <span>{tt.ten || (tt.trangThai === 'dang' ? 'Vào học cùng cả khối.' : 'Vào chơi Sinh Tồn trong lúc chờ thầy.')}</span>
        </div>
        <button type="button" className="tle-nut" disabled={dangVao} onClick={() => { void thamGia() }}>{dangVao ? 'Đang vào…' : 'Tham gia'}</button>
      </div>
      {loi && <p className="tle-loi" role="alert">{loi}</p>}
    </div>
  )
}
