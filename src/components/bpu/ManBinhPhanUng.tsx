// BÌNH PHẢN ỨNG — MÀN MÁY EM (thầy 06/11; bản vẽ docs/ban-ve-binh-phan-ung-0611 ảnh h00–h15). Nạp lười: chỉ mở khi em vừa điểm danh hoặc kênh đẩy báo `bpu`.
// Câu hiện ĐẦY MÀN HÌNH giống chặng (dùng lại DeCau / ChonTracNghiem / ChonDungSai / OTraLoiNgan). KHÔNG có nút thoát giữa buổi; em ẩn app ≥ 2 giây ⇒ báo phòng
// «rời màn» (bảng hiện tên em; 09/11 thầy bỏ trừ kJ), app hiện lại sau lần báo rời ⇒ gửi `{ t: 've' }` (phòng gỡ em khỏi danh sách «đang rời»).
// Mất mạng KHÔNG tính là rời màn: đáp án đã chọn giữ trên máy, nối lại thì gửi.
// THẦY 09/11 (bản vẽ docs/ban-ve-bpu-may-em-0911): đầu màn NGỌN LỬA màu đội + tên đội + kJ; em bấm gửi ⇒ tia lửa màu đội bay lên (như bay lên bảng) rồi
// màn TỰ CHE «Đã gửi · Nhìn lên bảng để chữa bài» — không còn đề, không nút mở; chỉ mở khi thầy đẩy CÂU MỚI (số lượt đổi). Thầy mở đáp án ⇒ vẫn che,
// hiện kết quả trên lớp che: em chọn đúng XANH, sai ĐỎ, đáp án đúng luôn XANH.
// Máy em chỉ nhận `viewEm` từ phòng — không có đáp án tới khi thầy mở. Màn chặng đang làm vẫn nằm nguyên bên dưới (tấm phủ), xong buổi về đúng chỗ.
import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { DOI_BPU, KJ, kyHieu, type ViewEm } from '../../lib/bpu/phong'
import type { Question } from '../../game/than-thu-v2/core'
// Phần hiện câu của chặng nạp ĐỘNG qua mảnh chặng (đã tải sẵn ở Lộ trình) — nhập tĩnh làm bộ đóng gói chia lại mảnh dùng chung (precache + byte mở tăng).
type MangChang = typeof import('../hoc-tap/ManLamBaiTap')['PHAN_CAU_CHANG']
import './bpu-hs.css'
// LỜI GIẢI SAU KHI MỞ ĐÁP ÁN (thầy 07/11): đúng khối lời giải của màn làm bài — có bản Kính ⇒ Kính + nút «Lời giải thu gọn»; chưa có ⇒ lời giải thu gọn đầy đủ.
const LoiGiaiKinhHs = lazy(() => import('../loi-giai-kinh/LoiGiaiKinhHs'))
type LoiGiaiCauKieu = ComponentType<{ q: Question; solution: unknown; dapAn: string; hinhLoiGiai?: Question['hinhAnh'] }>

const GOC_MAC_DINH = 'https://omr.ttadodaihoc.workers.dev'
const LUI_MS = [1500, 3000, 6000, 12000, 20000]
/** Ẩn app lâu hơn ngần này mới tính là rời màn (bàn phím, kéo thanh thông báo không tính). */
export const ROI_MAN_MS = 2000

type Tin = { t: string; [k: string]: unknown }
const gio = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const gioPhut = (ms: number | null | undefined) => { if (!ms) return ''; const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const PHIM_SO = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '−']

function BinhNho() {
  return (
    <svg className="bpu-hs-binh" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M19 5h10M20.5 5v12.6a14 14 0 1 0 7 0V5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.6 30.5a11.6 11.6 0 0 0 22.8 0c-3.6 1.6-7.4 1.6-11.4 0s-7.8-1.6-11.4 0z" className="bpu-hs-binh-long" />
    </svg>
  )
}
/** NGỌN LỬA ĐỘI (thầy 09/11): ba lớp lửa màu đội (`--doi`) lay chập chờn + đốm than bay — chỉ transform/opacity; máy yếu / giảm chuyển động ⇒ tĩnh. */
function NgonLua({ doi, ky, to }: { doi: number; ky?: string; to?: boolean }) {
  return (
    <span className={`bpu-lua${to ? ' to' : ''}`} style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-tin'})` }} aria-hidden="true">
      <i className="hao" />
      <svg viewBox="0 0 64 80">
        <g className="l1"><path className="ngoai" d="M32 4C35 17 50 25 54 40c4 17-7 34-22 34S6 57 10 40c2-8 7-12 9-19 3 7 6 10 9 11-1-10 1-19 4-28z" /></g>
        <g className="l2"><path className="giua" d="M32 28c2 9 12 14 14 24 2 12-5 21-14 21s-16-9-14-21c1-5 4-9 6-13 1 4 3 7 6 8-1-7 0-13 2-19z" /></g>
        <g className="l3"><path className="loi" d="M32 47c2 6 8 9 8 16a8 8 0 0 1-16 0c0-7 6-10 8-16z" /></g>
      </svg>
      <i className="tan" /><i className="tan hai" /><i className="tan ba" />
      {ky ? <b className="ky">{ky}</b> : null}
    </span>
  )
}
/** Tia lửa màu đội bay vụt lên trên màn (như bay lên bảng) khi em bấm gửi — 14 hạt, lệch ngang / trễ cố định (không ngẫu nhiên ⇒ ảnh chụp ổn định). */
const TIA = [[-46, 0, 1], [38, 40, 0.8], [-12, 70, 1.2], [60, 110, 0.7], [-70, 130, 0.9], [16, 160, 1.1], [-30, 200, 0.75], [50, 220, 1], [-58, 260, 0.85], [6, 280, 1.3], [74, 320, 0.7], [-20, 350, 0.95], [28, 380, 0.8], [-40, 420, 1]] as const
function TiaBay() {
  return <div className="bpu-tia" aria-hidden="true"><i className="song" />{TIA.map(([x, d, s], i) => <i key={i} className={i % 3 === 2 ? 'vang' : undefined} style={{ ['--x' as string]: `${x}px`, ['--d' as string]: `${d}ms`, ['--s' as string]: s }} />)}</div>
}
/** KẾT QUẢ ĐÚNG / SAI của em (sau khi thầy mở đáp án): em chọn đúng XANH ✓, sai ĐỎ ✗, đáp án đúng luôn XANH; có chữ «Em chọn» / «Đáp án đúng» (màu không là kênh duy nhất). */
function KetQuaChon({ phan, chon, dung, emDung }: { phan: string; chon: string; dung: string; emDung: boolean }) {
  const c = chon.trim().toUpperCase(), d = dung.trim().toUpperCase()
  if (phan === 'I') return (
    <div className="bpu-kq-pa" role="list" aria-label="Phương án">
      {['A', 'B', 'C', 'D'].map((x) => {
        const la = x === d ? 'dung' : x === c ? 'sai' : undefined
        return <div key={x} role="listitem" className="bpu-kq-cot" data-kq={la} aria-label={`${x}${x === c ? ' · em chọn' : ''}${x === d ? ' · đáp án đúng' : ''}`}><div className="bpu-kq-o" data-kq={la}><b>{x}</b>{la ? <span>{la === 'dung' ? '✓' : '✗'}</span> : null}</div><small>{x === c ? 'Em chọn' : x === d ? 'Đáp án đúng' : ''}</small></div>
      })}
    </div>
  )
  if (phan === 'II') return (
    <div className="bpu-kq-y" role="list" aria-label="Bốn ý">
      {[0, 1, 2, 3].map((i) => {
        const e = c[i] === 'D' || c[i] === 'S' ? c[i] : '', ok = !!e && e === d[i], ten = (x?: string) => (x === 'D' ? 'Đúng' : x === 'S' ? 'Sai' : '—')
        return (
          <div key={i} role="listitem" className="bpu-kq-dong">
            <b>{'abcd'[i]})</b>
            <span className="bpu-kq-chip" data-kq={e ? (ok ? 'dung' : 'sai') : undefined}>Em: {ten(e)} {e ? (ok ? '✓' : '✗') : ''}</span>
            {!ok ? <span className="bpu-kq-chip" data-kq="dung">Đáp án: {ten(d[i])} ✓</span> : null}
          </div>
        )
      })}
    </div>
  )
  return (
    <div className="bpu-kq-y">
      {c ? <div className="bpu-kq-dong"><b>Em ghi</b><span className="bpu-kq-chip so" data-kq={emDung ? 'dung' : 'sai'}>{chon.trim()} {emDung ? '✓' : '✗'}</span></div> : null}
      {!emDung || !c ? <div className="bpu-kq-dong"><b>Đáp án đúng</b><span className="bpu-kq-chip so" data-kq="dung">{dung.trim()} ✓</span></div> : null}
    </div>
  )
}
/** Hiệu ứng gửi rút gọn trên máy yếu / khi em bật giảm chuyển động. */
const tinhLang = () => { try { return document.documentElement.classList.contains('may-yeu') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false } }
const BAY_MS = 1150
function NguyenTu({ ky, doi, to }: { ky: string; doi: number; to?: boolean }) {
  return (
    <div className={`bpu-ng${to ? ' to' : ''}`} style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-tin'})` }} aria-hidden="true">
      <span className="quy" /><span className="quy hai" /><b>{ky}</b>
    </div>
  )
}

/** GIỮ NỐI SẴN (thầy 07/11 «gửi câu tức thì»): `giuNoi` ⇒ màn nối phòng ngay khi em điểm danh xong rồi nằm ẨN; thầy mở lượt mới ⇒ tự hiện tức thì
 *  (không nạp, không xin vé lại). «Rời» ⇒ ẩn (vẫn nối), lượt sau lại tự hiện. `mo` đổi ⇒ hiện ngay (nút «Vào Bình Phản Ứng» / kênh đẩy).
 *  `chan()` đúng (đang thi / phòng chờ / kiểm tra cá nhân) ⇒ KHÔNG tự hiện. */
export default function ManBinhPhanUng({ token, buoiId, onDong, giuNoi = false, mo = 1, chan }: { token: string; buoiId?: string | null; onDong: () => void; giuNoi?: boolean; mo?: number; chan?: () => boolean }) {
  const [an, setAn] = useState(giuNoi && mo <= 0)
  const boLuot = useRef(-1)
  useEffect(() => { if (mo > 0) setAn(false) }, [mo])

  const [v, setV] = useState<ViewEm | null>(null)
  /** Rời: màn giữ nối thì chỉ ẩn (lượt hiện tại coi như đã xem); không thì đóng hẳn. */
  const roi = () => { if (!giuNoi) { onDong(); return } boLuot.current = v?.luot?.so ?? 0; setAn(true) }
  const [tt, setTt] = useState<'noi' | 'mat-mang' | 'chua-mo' | 'khong-buoi' | 'tat' | 'ok'>('noi')
  const [chon, setChon] = useState('')
  const [baoTra, setBaoTra] = useState('')
  const [vuaRoi, setVuaRoi] = useState(false)
  /** Khoá lượt (số:giờ mở) em vừa BẤM GỬI trên máy (che ngay, không chờ phòng báo lại — mất mạng vẫn che); lượt mới ⇒ số khác ⇒ tự mở. */
  const [cheSo, setCheSo] = useState('')
  /** Khoá lượt đang chạy hiệu ứng gửi (tia lửa bay lên) — xong ~1,15 s thì đề bên dưới mới gỡ khỏi màn. */
  const [bay, setBay] = useState('')
  /** Đã báo phòng «rời» ⇒ app hiện lại thì gửi `ve`. */
  const daBaoRoi = useRef(false)
  const [nay, setNay] = useState(() => Date.now())
  const ws = useRef<WebSocket | null>(null)
  const dung = useRef(false)
  const loi = useRef(0)
  const choGui = useRef<Tin[]>([])
  const luotChon = useRef(0)
  const chuaMo = useRef(false)
  const soLuot = v?.luot?.so ?? 0
  const [LC, setLC] = useState<MangChang | null>(null)
  useEffect(() => { let huy = false; void import('../hoc-tap/ManLamBaiTap').then((m) => { if (!huy) setLC(m.PHAN_CAU_CHANG) }).catch(() => {}); return () => { huy = true } }, [])

  const gui = useCallback((t: Tin) => {
    const w = ws.current
    if (w && w.readyState === 1) { try { w.send(JSON.stringify(t)); return true } catch { /* rớt */ } }
    choGui.current.push(t)
    return false
  }, [])

  // Nối phòng: xin vé (theo buổi em vừa điểm danh, hoặc buổi đang mở hôm nay em có mặt) ⇒ WebSocket; rớt ⇒ nối lại lùi dần; phòng chưa mở ⇒ hỏi lại sau 8 giây.
  useEffect(() => {
    dung.current = false
    let hen: ReturnType<typeof setTimeout> | undefined
    let ping: ReturnType<typeof setInterval> | undefined
    const henLai = (ms?: number) => { if (dung.current) return; clearTimeout(hen); hen = setTimeout(() => void noi(), ms ?? LUI_MS[Math.min(loi.current++, LUI_MS.length - 1)]) }
    async function noi() {
      if (dung.current) return
      try {
        const goc = (await layDiaChiMayChu('')) || GOC_MAC_DINH
        const duong = buoiId ? '/hs/bpu/ve' : '/hs/bpu/cua-em'
        const r = await fetch(`${goc}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, buoiId: buoiId ?? undefined }) })
        const j = (await r.json().catch(() => null)) as { ok?: boolean; ve?: string; buoiId?: string | null; lyDo?: string } | null
        if (dung.current) return
        if (j?.lyDo === 'tat') { setTt('tat'); return }
        if (j?.ok && !j.ve) { setTt('khong-buoi'); return }
        if (!j?.ok || !j.ve) { setTt('mat-mang'); henLai(); return }
        const w = new WebSocket(`${goc.replace(/^http/, 'ws')}/bpu/phong?ve=${encodeURIComponent(j.ve)}`)
        ws.current = w
        w.onopen = () => {
          loi.current = 0
          w.send(JSON.stringify({ t: 'vao' })); w.send(JSON.stringify({ t: 'chao' }))
          const cho = choGui.current.splice(0); for (const t of cho) { try { w.send(JSON.stringify(t)) } catch { /* rớt */ } }
          clearInterval(ping); ping = setInterval(() => { try { w.send('{"t":"ping"}') } catch { /* rớt */ } }, 45_000)
        }
        w.onmessage = (e) => {
          if (typeof e.data !== 'string') return
          let m: Tin
          try { m = JSON.parse(e.data) as Tin } catch { return }
          if (m.t === 'em') { chuaMo.current = false; setV(m as unknown as ViewEm); setTt('ok') }
          else if (m.t === 'chua-mo') { chuaMo.current = true; setTt('chua-mo'); try { w.close() } catch { /* đã đóng */ } }
          else if (m.t === 'tra-kq' && m.ok === false) setBaoTra(m.ly === 'het-gio' ? 'Hết giờ, đáp án gửi muộn không được tính.' : m.ly === 'da-khoa' ? 'Thầy đã khoá lượt này.' : m.ly === 'la' ? 'Em không thuộc lớp của buổi này.' : '')
        }
        w.onclose = () => { if (ws.current !== w) return; ws.current = null; clearInterval(ping); if (dung.current) return; if (chuaMo.current) henLai(8000); else { setTt('mat-mang'); henLai() } }
        w.onerror = () => { try { w.close() } catch { /* đã đóng */ } }
      } catch { setTt('mat-mang'); henLai() }
    }
    void noi()
    return () => { dung.current = true; clearTimeout(hen); clearInterval(ping); try { ws.current?.close() } catch { /* đã đóng */ } ws.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, buoiId])

  // Lượt mới ⇒ xoá lựa chọn cũ.
  useEffect(() => { if (soLuot !== luotChon.current) { luotChon.current = soLuot; setChon(''); setBaoTra('') } }, [soLuot])
  // Đang ẩn (giữ nối) mà thầy mở lượt mới ⇒ hiện ngay — trừ khi em đang thi / ở phòng chờ / làm kiểm tra cá nhân.
  const coLuot = !!v?.luot
  useEffect(() => { if (an && coLuot && soLuot > boLuot.current && !v?.ketThuc && !chan?.()) setAn(false) }, [an, coLuot, soLuot, v?.ketThuc, chan])

  useEffect(() => { if (!bay) return; const h = setTimeout(() => setBay(''), BAY_MS); return () => clearTimeout(h) }, [bay])
  // VỀ LẠI MÀN (thầy 09/11 bỏ trừ kJ): đã báo «rời» mà app hiện lại ⇒ báo phòng `ve` (gỡ tên em khỏi «đang rời» trên bảng). Nghe ở mức màn — kể cả khi
  // trong lúc em rời thầy đã mở đáp án (lúc ấy nhánh nghe rời màn đã gỡ). Mất mạng ⇒ `ve` nằm hàng chờ, nối lại là gửi sau `vao`/`chao`.
  useEffect(() => {
    const hien = () => { if (!document.hidden && daBaoRoi.current) { daBaoRoi.current = false; gui({ t: 've' }) } }
    document.addEventListener('visibilitychange', hien)
    window.addEventListener('pageshow', hien)
    return () => { document.removeEventListener('visibilitychange', hien); window.removeEventListener('pageshow', hien) }
  }, [gui])

  // Đồng hồ êm (không đổi màu, không nháy — luật C14).
  const coHan = !!v?.luot?.han && v.luot.pha === 'tra-loi'
  useEffect(() => { if (!coHan) return; const h = setInterval(() => setNay(Date.now()), 500); return () => clearInterval(h) }, [coHan])

  // RỜI MÀN: CHỈ khi đang có lượt chưa mở đáp án (đang làm / bạn lên bảng). Ẩn app ≥ 2 giây ⇒ báo phòng một lần; quay lại ⇒ màn cảnh báo; nút Back bị giữ.
  // Lúc chờ giữa các lượt em rời được (nút «Rời Bình Phản Ứng», không phạt) ⇒ thầy quên kết thúc hay mở ca kiểm tra thì em không bị kẹt.
  const dangChoi = !an && !!v?.luot && v.luot.pha !== 'mo' && !v.ketThuc
  useEffect(() => {
    if (!dangChoi) return
    let hen: ReturnType<typeof setTimeout> | undefined
    const doi = () => {
      if (document.hidden) { hen = setTimeout(() => { daBaoRoi.current = true; gui({ t: 'roi' }); setVuaRoi(true) }, ROI_MAN_MS) }
      else clearTimeout(hen)
    }
    const anTrang = () => { if (document.hidden) { daBaoRoi.current = true; gui({ t: 'roi' }) } }
    document.addEventListener('visibilitychange', doi)
    window.addEventListener('pagehide', anTrang)
    try { window.history.pushState({ bpu: 1 }, '') } catch { /* trình duyệt cũ */ }
    const giuLai = () => { try { window.history.pushState({ bpu: 1 }, '') } catch { /* bỏ qua */ } }
    window.addEventListener('popstate', giuLai)
    return () => { clearTimeout(hen); document.removeEventListener('visibilitychange', doi); window.removeEventListener('pagehide', anTrang); window.removeEventListener('popstate', giuLai) }
  }, [gui, dangChoi])

  // Toàn màn hình ở lần chạm đầu (trình duyệt chỉ cho khi có thao tác của em; không hỗ trợ ⇒ bỏ qua).
  const xinToanMan = () => { try { const d = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> }; if (!document.fullscreenElement && d.requestFullscreen) void d.requestFullscreen().catch(() => {}) } catch { /* bỏ qua */ } }

  const l = v?.luot ?? null
  const e = v?.em ?? null
  const doi = e ? e.doi : 0
  const tenDoi = DOI_BPU[doi]?.ten ?? ''
  const q = (l?.cau ?? null) as unknown as Question | null
  const duChon = !!l && (l.tuLuan || (l.phan === 'II' ? /^[DS]{4}$/.test(chon) : chon.trim().length > 0))
  // Khoá lượt = số lượt + giờ mở: phòng bỏ lượt rỗng rồi mở câu khác cùng số ⇒ khoá khác ⇒ không che nhầm câu em chưa thấy.
  const khoaLuot = l ? `${l.so}:${l.batDau}` : ''
  const che = !!l && (!!l.emTra || cheSo === khoaLuot)
  const dangBay = !!l && bay === khoaLuot
  const guiTra = () => {
    if (!l || !duChon || che) return
    gui({ t: 'tra', chon: l.tuLuan ? 'xong' : chon })
    setCheSo(khoaLuot)
    if (!tinhLang()) setBay(khoaLuot)
    try { navigator.vibrate?.([18, 40, 26]) } catch { /* máy không rung */ }
    xinToanMan()
  }
  // HẾT GIỜ mà em chưa gửi (thầy 07/11): khoá, câu để trống — không gửi muộn, không đoán bừa.
  const hetGio = !!l?.han && l.pha === 'tra-loi' && nay >= l.han && !l.emTra
  const phimSo = (p: string) => setChon((c) => (p === '−' ? (c.startsWith('-') ? c.slice(1) : '-' + c) : (c + p).slice(0, 8)))

  const kjDoi = (v?.doi.kj ?? 0).toLocaleString('vi-VN')
  const tren = (phu: string) => (
    <header className={`bpu-hs-tren${e ? ' co-doi' : ''}`}>
      {e ? <NgonLua doi={doi} /> : <BinhNho />}
      <div className="bpu-hs-tieu"><b>{e ? tenDoi : 'Bình Phản Ứng'}</b><span>{phu}</span></div>
      {e ? <div className="bpu-hs-kj" aria-label={`${tenDoi} đang có ${kjDoi} kJ`}><b>{kjDoi}</b><span>kJ đội</span></div> : null}
      {coHan && l?.han ? <div className="bpu-hs-gio" aria-label={`Còn ${gio(l.han - nay)}`}>{gio(l.han - nay)}</div> : null}
    </header>
  )
  const nhanDoi = `Bình Phản Ứng${l ? ` · Lượt ${l.so}` : ''}`
  let lopChe: React.ReactNode = null

  let than: React.ReactNode
  let day: React.ReactNode = null
  if (tt === 'tat' || tt === 'khong-buoi') {
    than = <div className="bpu-hs-giua"><h3>{tt === 'tat' ? 'Bình Phản Ứng đang tạm tắt' : 'Lớp chưa mở Bình Phản Ứng'}</h3><p>{tt === 'tat' ? 'Thầy sẽ chiếu câu như thường trên bảng.' : 'Khi thầy mở, câu sẽ tự hiện ở đây.'}</p></div>
    day = <button type="button" className="bpu-nut" onClick={onDong}>Đóng</button>
  } else if (!v || !e) {
    than = <div className="bpu-hs-giua"><div className="bpu-hs-xuong" aria-hidden="true" /><h3>{tt === 'chua-mo' ? 'Chờ thầy mở Bình Phản Ứng' : tt === 'mat-mang' ? 'Đang nối lại…' : 'Đang vào lớp…'}</h3><p>Em giữ màn này, câu sẽ tự hiện.</p></div>
    if (tt === 'chua-mo') day = <button type="button" className="bpu-nut phu" onClick={onDong}>Để sau</button>
  } else if (v.ketThuc) {
    than = (
      <div className="bpu-hs-giua"><NguyenTu ky={kyHieu(e.ten)} doi={doi} to /><h3>Xong Bình Phản Ứng</h3>
        <div className="bpu-luoi"><div><b>{e.dungSo}/{v.soLuot}</b><span>lượt đúng</span></div><div><b>{e.kj}</b><span>kJ</span></div><div><b>{e.hang}/{e.soEm}</b><span>hạng</span></div></div>
        <p className="nho">kJ chỉ tính trong buổi này.</p></div>
    )
    day = <button type="button" className="bpu-nut" onClick={onDong}>Về chặng đang làm</button>
  } else if (vuaRoi) {
    // SỬA CÓ CHỦ ĐÍCH 09/11 (thầy bỏ trừ kJ khi rời màn): không nhắc kJ — nhắc em quay lại tập trung lên bảng.
    than = <div className="bpu-hs-giua"><div className="bpu-canh" aria-hidden="true">!</div><h3>Em vừa rời màn hình</h3><p>Bảng đang báo tên em — quay lại tập trung lên bảng.</p><p className="nho">Trong Bình Phản Ứng em ở lại màn này tới khi thầy kết thúc.</p></div>
    day = <button type="button" className="bpu-nut" onClick={() => setVuaRoi(false)}>Quay lại lượt đang làm</button>
  } else if (!l) {
    than = (
      <div className="bpu-hs-giua"><NguyenTu ky={kyHieu(e.ten)} doi={doi} to /><h3>{e.luc ? `Em đã vào lớp lúc ${gioPhut(e.luc)}` : 'Em đã vào lớp'}</h3>
        <div className="bpu-doi-the" style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau})` }}><b>{tenDoi} · {v.doi.so}/{v.doi.tong} bạn đã vào</b><div className="vach"><i style={{ width: `${(v.doi.so / Math.max(1, v.doi.tong)) * 100}%` }} /></div><span>Đội đang có {v.doi.kj} kJ.</span></div>
        <p>Thầy chiếu câu nào, câu đó tự hiện ở đây. Đang làm câu mà rời màn là thầy thấy trên bảng.</p></div>
    )
    day = <button type="button" className="bpu-nut phu" onClick={roi}>Rời Bình Phản Ứng</button>
  } else if ((l.pha === 'goi' || l.pha === 'lam-bang') && l.goi) {
    const g = l.goi, cung = g.doi === doi
    if (g.sbd === e.sbd) {
      than = (
        <div className="bpu-hs-giua"><NguyenTu ky={kyHieu(g.ten)} doi={g.doi} to /><h3>Em được mời lên bảng!</h3><p>Câu đang chiếu trên bảng. Em lên trình bày cho cả lớp nhé.</p>
          <div className="bpu-giai"><b>Vì sao thầy chọn em</b>{g.lyDo.map((x, i) => <span key={i}>{x}</span>)}</div>
          <div className="bpu-the">{DOI_BPU[g.doi]?.ten} đang tiếp sức em: <b>{g.tiep}</b> lượt</div></div>
      )
    } else {
      than = (
        <>
          <div className="bpu-ban" style={{ ['--doi' as string]: `var(${DOI_BPU[g.doi]?.mau})` }}><b className="ky">{kyHieu(g.ten)}</b><div><b>{g.ten}</b><span>{DOI_BPU[g.doi]?.ten} · đang lên bảng</span></div></div>
          <p className="bpu-hoi">Em đoán bạn ấy làm đúng không?</p>
          <div className="bpu-hai">
            <button type="button" aria-pressed={g.emDoan === 1} disabled={g.emDoan !== null} onClick={() => gui({ t: 'doan', v: 1 })}>Làm đúng</button>
            <button type="button" aria-pressed={g.emDoan === 0} disabled={g.emDoan !== null} onClick={() => gui({ t: 'doan', v: 0 })}>Chưa đúng</button>
          </div>
          <p className="nho">Đoán đúng +{KJ.doanDung} kJ cho em. Mỗi lần chạm nút dưới, một tia lửa bay lên bảng tới bạn ấy.</p>
          {q && !che ? <div className="bpu-de-xem"><span className="m3-chip">Đề trên bảng · chỉ xem</span>{LC ? <LC.DeCau q={q} stt={l.so} /> : <p className="bpu-de-tho">{q.text}</p>}</div> : null}
        </>
      )
      day = <button type="button" className="bpu-nut tiep" style={{ ['--doi' as string]: `var(${DOI_BPU[g.doi]?.mau})` }} disabled={g.emTiep >= 10} onClick={() => gui({ t: 'tiep' })}>{cung ? `Tiếp sức ${DOI_BPU[g.doi]?.ten}` : 'Cổ vũ bạn ấy'} · {g.emTiep}/10</button>
    }
  } else if (q) {
    const daGui = !!l.emTra
    const kb = !!l.emTra?.kb
    const daMo = l.pha === 'mo'
    const chonHien = daGui ? l.emTra!.chon : chon
    const k = l.ketQua
    const chuDung = l.tuLuan ? '' : l.phan === 'II' ? (l.dung ?? '').split('').map((x, i) => `${'abcd'[i]}) ${x === 'D' ? 'Đúng' : 'Sai'}`).join(' · ') : String(l.dung ?? '')
    const roiNho = <button type="button" className="bpu-roi-nho" onClick={roi}>Rời Bình Phản Ứng</button>
    const baoMang = tt === 'mat-mang' ? <div className="bpu-bao" role="status">Mất kết nối, đang nối lại… Đáp án em chọn vẫn giữ trên máy, nối lại là gửi.</div> : null
    if (che) {
      // LỚP CHE SAU KHI GỬI (thầy 09/11): kín màn, không đề, không nút mở — chỉ câu mới (số lượt đổi) mới mở. Mở đáp án ⇒ kết quả xanh / đỏ ngay trên lớp che.
      const kq = !daMo || kb || l.tuLuan ? undefined : k?.dung ? 'dung' : 'sai'
      const tieuDe = daMo
        ? kb ? 'Cảm ơn em đã thành thật' : l.tuLuan ? 'Thầy đang chữa trên bảng' : !daGui ? 'Đáp án em gửi chưa được tính' : k?.dung ? (l.phan === 'II' ? 'Đúng cả 4 ý!' : 'Chính xác!') : 'Chưa đúng'
        : !daGui ? 'Đang gửi…' : kb ? 'Em đã báo: chưa biết làm' : l.tuLuan ? 'Đã báo thầy em làm xong' : 'Đã gửi'
      const dongPhu = daMo
        ? kb ? (l.tuLuan ? '' : `+${k?.kj ?? KJ.thanhThat} kJ thành thật · đáp án đúng: ${chuDung}`)
          : l.tuLuan || !k ? '' : `${l.phan === 'II' ? `Em đúng ${k.soY ?? 0}/4 ý · ` : ''}+${k.kj} kJ${k.nhanh ? ` · nhanh thứ ${k.nhanh} cả lớp` : ''} · hạng ${e.hang}/${e.soEm}`
        : daGui ? `${kb || l.tuLuan ? '' : `Đã gửi sau ${Math.round(l.emTra!.t / 1000)} giây · `}${l.daGui}/${l.coMat} bạn đã ${l.tuLuan ? 'xong' : 'gửi'}` : 'Đáp án đã nằm trên máy em, phòng nhận là xong.'
      lopChe = (
        <div className={`bpu-che${dangBay ? ' bay' : ''}`} data-kq={kq} role="status" aria-live="polite" aria-label="Màn đã che sau khi gửi">
          {dangBay ? <TiaBay /> : null}
          <div className="bpu-che-noi">
            <div className="bpu-che-doi"><NgonLua doi={doi} /><b>{tenDoi}</b><span>{kjDoi} kJ đội</span></div>
            {kq ? <div className="bpu-che-dau" aria-hidden="true">{kq === 'dung' ? '✓' : '✗'}</div> : <NgonLua doi={doi} ky={DOI_BPU[doi]?.ky} to />}
            <h3>{tieuDe}</h3>
            {dongPhu ? <p className="phu">{dongPhu}</p> : null}
            {daMo && !kb && !l.tuLuan && l.dung ? <KetQuaChon phan={l.phan} chon={l.emTra?.chon ?? ''} dung={l.dung} emDung={!!k?.dung} /> : null}
            <p className="bpu-che-bang">Nhìn lên bảng để chữa bài</p>
            {baoTra ? <div className="bpu-bao" role="status">{baoTra}</div> : null}
            {!daGui ? baoMang : null}
            {daMo ? roiNho : null}
          </div>
        </div>
      )
    }
    // Đang bay: đề còn nằm dưới lớp che vừa hiện (phương án em chọn bừng sáng màu đội); bay xong ⇒ gỡ đề khỏi màn (em không mở lại được).
    if (!che || dangBay) {
      than = (
        <>
          <span className="m3-chip bpu-chip">{l.tuLuan ? 'Tự luận · làm ra giấy' : l.phan === 'I' ? 'Trắc nghiệm' : l.phan === 'II' ? 'Đúng–sai' : 'Trả lời ngắn'}</span>
          {LC ? <LC.DeCau q={q} stt={l.so} /> : <p className="bpu-de-tho">{q.text}</p>}
          {l.tuLuan ? <div className="bpu-the">Câu này thầy chữa trên bảng, máy không chấm. Em làm ra giấy, xong thì bấm nút bên dưới.</div>
            : !LC ? <p className="nho">Đang tải phương án…</p> : l.phan === 'I' ? <LC.ChonTracNghiem q={q} value={chonHien} onChon={(x) => setChon(x)} khoa={che || daMo || hetGio} />
            : l.phan === 'II' ? <LC.ChonDungSai q={q} value={chonHien.padEnd(4, ' ')} onChon={(i, x) => setChon((c) => { const a = c.padEnd(4, ' ').split(''); a[i] = x; return a.join('') })} khoa={che || daMo || hetGio} />
            : <div className="bpu-tln"><LC.OTraLoiNgan value={chonHien} soO={q.soO} />{!che && !daMo && !hetGio ? <div className="bpu-phim">{PHIM_SO.map((p) => <button type="button" key={p} onClick={() => phimSo(p)} aria-label={p === '−' ? 'Đổi dấu' : p}>{p}</button>)}<button type="button" className="xoa" onClick={() => setChon((c) => c.slice(0, -1))}>Xoá</button></div> : null}</div>}
          {daMo && !che && !l.tuLuan && l.dung && LC ? (
            <div className="bpu-loi-giai"><Suspense fallback={<div aria-busy="true" style={{ minHeight: 120 }} />}>
              <LoiGiaiKinhHs qid={String(l.qid ?? q.qid)} phan={l.phan} choices={q.choices} ideas={q.ideas} dapAn={l.dung} duPhong={<LoiGiaiDuPhong LG={LC.LoiGiaiCau as unknown as LoiGiaiCauKieu} q={q} solution={l.giai?.solution ?? null} dapAn={l.dung} hinhLoiGiai={(l.giai?.anh ?? []) as Question['hinhAnh']} />} />
            </Suspense></div>
          ) : null}
          {!che && baoTra ? <div className="bpu-bao" role="status">{baoTra}</div> : null}
          {!che ? baoMang : null}
        </>
      )
    }
    if (che) day = dangBay ? <div className="bpu-hai-nut"><button type="button" className="bpu-nut" disabled>Đã gửi</button></div> : null
    else if (daMo) {
      // Em CHƯA gửi mà thầy mở đáp án: không che (em chưa có gì để giữ); đáp án đúng tô XANH ngay dưới đề + lời giải như cũ.
      if (l.tuLuan) day = <div className="bpu-ket"><h4>Thầy đang chữa trên bảng</h4><p>Em nhìn lên bảng và đối chiếu bài làm của mình.</p>{roiNho}</div>
      else day = <div className="bpu-ket sai" role="status"><h4>Em chưa gửi kịp</h4>{l.dung ? <KetQuaChon phan={l.phan} chon="" dung={l.dung} emDung={false} /> : <p>Đáp án đúng: {chuDung}</p>}{roiNho}</div>
    } else {
      day = (
        <div className="bpu-hai-nut">
          {hetGio ? <p className="bpu-bao" role="status">Hết giờ — câu này để trống. Nhìn lên bảng nhé.</p>
            : <button type="button" className="bpu-nut" disabled={!duChon} onClick={guiTra}>{l.tuLuan ? 'Em làm xong' : 'Gửi đáp án'}</button>}
        </div>
      )
    }
  } else than = <div className="bpu-hs-giua"><h3>Đang tải câu…</h3></div>

  if (an) return null
  return createPortal(
    <div className={`bpu-hs m3${dangBay ? ' dang-bay' : ''}`} role="dialog" aria-modal="true" aria-label="Bình Phản Ứng" onPointerDown={xinToanMan} style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-tin'})` }}>
      {tren(e ? nhanDoi : 'Cả lớp cùng làm câu thầy chiếu')}
      {coHan && l?.han ? <div className="bpu-hs-vach"><i style={{ width: `${Math.max(0, Math.min(1, (l.han - nay) / Math.max(1, l.han - l.batDau))) * 100}%` }} /></div> : null}
      {than ? <main className="bpu-hs-than">{than}</main> : null}
      {day ? <footer className="bpu-hs-day">{day}</footer> : null}
      {lopChe}
    </div>,
    document.body,
  )
}

/** Lời giải thu gọn (dự phòng khi câu chưa có bản Kính) — khối `LoiGiaiCau` lấy qua mảnh chặng đã nạp (không tách mảnh mới ⇒ precache không phình). */
function LoiGiaiDuPhong({ LG, ...p }: { LG: LoiGiaiCauKieu; q: Question; solution: unknown; dapAn: string; hinhLoiGiai?: Question['hinhAnh'] }) { return <LG {...p} /> }
