// BÌNH PHẢN ỨNG — MÀN MÁY EM (thầy 06/11; bản vẽ docs/ban-ve-binh-phan-ung-0611 ảnh h00–h15). Nạp lười: chỉ mở khi em vừa điểm danh hoặc kênh đẩy báo `bpu`.
// Câu hiện ĐẦY MÀN HÌNH giống chặng (dùng lại DeCau / ChonTracNghiem / ChonDungSai / OTraLoiNgan). KHÔNG có nút thoát giữa buổi; em ẩn app ≥ 2 giây ⇒ báo phòng
// «rời màn» (bảng hiện tên, đội −20 kJ). Mất mạng KHÔNG tính là rời màn: đáp án đã chọn giữ trên máy, nối lại thì gửi.
// Máy em chỉ nhận `viewEm` từ phòng — không có đáp án tới khi thầy mở. Màn chặng đang làm vẫn nằm nguyên bên dưới (tấm phủ), xong buổi về đúng chỗ.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { DOI_BPU, KJ, kyHieu, type ViewEm } from '../../lib/bpu/phong'
import type { Question } from '../../game/than-thu-v2/core'
// Phần hiện câu của chặng nạp ĐỘNG qua mảnh chặng (đã tải sẵn ở Lộ trình) — nhập tĩnh làm bộ đóng gói chia lại mảnh dùng chung (precache + byte mở tăng).
type MangChang = typeof import('../hoc-tap/ManLamBaiTap')['PHAN_CAU_CHANG']
import './bpu-hs.css'

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
function NguyenTu({ ky, doi, to }: { ky: string; doi: number; to?: boolean }) {
  return (
    <div className={`bpu-ng${to ? ' to' : ''}`} style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-tin'})` }} aria-hidden="true">
      <span className="quy" /><span className="quy hai" /><b>{ky}</b>
    </div>
  )
}

export default function ManBinhPhanUng({ token, buoiId, onDong }: { token: string; buoiId?: string | null; onDong: () => void }) {
  const [v, setV] = useState<ViewEm | null>(null)
  const [tt, setTt] = useState<'noi' | 'mat-mang' | 'chua-mo' | 'khong-buoi' | 'tat' | 'ok'>('noi')
  const [chon, setChon] = useState('')
  const [baoTra, setBaoTra] = useState('')
  const [vuaRoi, setVuaRoi] = useState(false)
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

  // Đồng hồ êm (không đổi màu, không nháy — luật C14).
  const coHan = !!v?.luot?.han && v.luot.pha === 'tra-loi'
  useEffect(() => { if (!coHan) return; const h = setInterval(() => setNay(Date.now()), 500); return () => clearInterval(h) }, [coHan])

  // RỜI MÀN: ẩn app ≥ 2 giây ⇒ báo phòng một lần; quay lại ⇒ màn cảnh báo. Không có nút thoát; nút Back của trình duyệt bị giữ lại trong buổi.
  useEffect(() => {
    let hen: ReturnType<typeof setTimeout> | undefined
    const doi = () => {
      if (document.hidden) { hen = setTimeout(() => { gui({ t: 'roi' }); setVuaRoi(true) }, ROI_MAN_MS) }
      else clearTimeout(hen)
    }
    const anTrang = () => { if (document.hidden) gui({ t: 'roi' }) }
    document.addEventListener('visibilitychange', doi)
    window.addEventListener('pagehide', anTrang)
    try { window.history.pushState({ bpu: 1 }, '') } catch { /* trình duyệt cũ */ }
    const giuLai = () => { if (!v?.ketThuc) { try { window.history.pushState({ bpu: 1 }, '') } catch { /* bỏ qua */ } } }
    window.addEventListener('popstate', giuLai)
    return () => { clearTimeout(hen); document.removeEventListener('visibilitychange', doi); window.removeEventListener('pagehide', anTrang); window.removeEventListener('popstate', giuLai) }
  }, [gui, v?.ketThuc])

  // Toàn màn hình ở lần chạm đầu (trình duyệt chỉ cho khi có thao tác của em; không hỗ trợ ⇒ bỏ qua).
  const xinToanMan = () => { try { const d = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> }; if (!document.fullscreenElement && d.requestFullscreen) void d.requestFullscreen().catch(() => {}) } catch { /* bỏ qua */ } }

  const l = v?.luot ?? null
  const e = v?.em ?? null
  const doi = e ? e.doi : 0
  const tenDoi = DOI_BPU[doi]?.ten ?? ''
  const q = (l?.cau ?? null) as unknown as Question | null
  const duChon = !!l && (l.tuLuan || (l.phan === 'II' ? /^[DS]{4}$/.test(chon) : chon.trim().length > 0))
  const guiTra = () => { if (!l || !duChon) return; gui({ t: 'tra', chon: l.tuLuan ? 'xong' : chon }); xinToanMan() }
  const phimSo = (p: string) => setChon((c) => (p === '−' ? (c.startsWith('-') ? c.slice(1) : '-' + c) : (c + p).slice(0, 8)))

  const tren = (phu: string) => (
    <header className="bpu-hs-tren">
      <BinhNho />
      <div className="bpu-hs-tieu"><b>Bình Phản Ứng</b><span>{phu}</span></div>
      {coHan && l?.han ? <div className="bpu-hs-gio" aria-label={`Còn ${gio(l.han - nay)}`}>{gio(l.han - nay)}</div> : null}
    </header>
  )
  const nhanDoi = `${l ? `Lượt ${l.so} · ` : ''}${tenDoi}`

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
    than = <div className="bpu-hs-giua"><div className="bpu-canh" aria-hidden="true">!</div><h3>Em vừa rời màn hình</h3><p>Thầy đã thấy trên bảng. {tenDoi} bị trừ {Math.abs(KJ.roiMan)} kJ.</p><p className="nho">Trong Bình Phản Ứng em ở lại màn này tới khi thầy kết thúc.</p></div>
    day = <button type="button" className="bpu-nut" onClick={() => setVuaRoi(false)}>Quay lại lượt đang làm</button>
  } else if (!l) {
    than = (
      <div className="bpu-hs-giua"><NguyenTu ky={kyHieu(e.ten)} doi={doi} to /><h3>{e.luc ? `Em đã vào lớp lúc ${gioPhut(e.luc)}` : 'Em đã vào lớp'}</h3>
        <div className="bpu-doi-the" style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau})` }}><b>{tenDoi} · {v.doi.so}/{v.doi.tong} bạn đã vào</b><div className="vach"><i style={{ width: `${(v.doi.so / Math.max(1, v.doi.tong)) * 100}%` }} /></div><span>Đội đang có {v.doi.kj} kJ.</span></div>
        <p>Thầy chiếu câu nào, câu đó tự hiện ở đây. Em giữ màn này; rời màn là thầy thấy trên bảng.</p></div>
    )
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
          {q ? <div className="bpu-de-xem"><span className="m3-chip">Đề trên bảng · chỉ xem</span>{LC ? <LC.DeCau q={q} stt={l.so} /> : <p className="bpu-de-tho">{q.text}</p>}</div> : null}
        </>
      )
      day = <button type="button" className="bpu-nut tiep" style={{ ['--doi' as string]: `var(${DOI_BPU[g.doi]?.mau})` }} disabled={g.emTiep >= 10} onClick={() => gui({ t: 'tiep' })}>{cung ? `Tiếp sức ${DOI_BPU[g.doi]?.ten}` : 'Cổ vũ bạn ấy'} · {g.emTiep}/10</button>
    }
  } else if (q) {
    const daGui = !!l.emTra
    const daMo = l.pha === 'mo'
    const chonHien = daGui ? l.emTra!.chon : chon
    than = (
      <>
        <span className="m3-chip bpu-chip">{l.tuLuan ? 'Tự luận · làm ra giấy' : l.phan === 'I' ? 'Trắc nghiệm' : l.phan === 'II' ? 'Đúng–sai' : 'Trả lời ngắn'}</span>
        {LC ? <LC.DeCau q={q} stt={l.so} /> : <p className="bpu-de-tho">{q.text}</p>}
        {l.tuLuan ? <div className="bpu-the">Câu này thầy chữa trên bảng, máy không chấm. Em làm ra giấy, xong thì bấm nút bên dưới.</div>
          : !LC ? <p className="nho">Đang tải phương án…</p> : l.phan === 'I' ? <LC.ChonTracNghiem q={q} value={chonHien} onChon={(x) => setChon(x)} khoa={daGui || daMo} />
          : l.phan === 'II' ? <LC.ChonDungSai q={q} value={chonHien.padEnd(4, ' ')} onChon={(i, x) => setChon((c) => { const a = c.padEnd(4, ' ').split(''); a[i] = x; return a.join('') })} khoa={daGui || daMo} />
          : <div className="bpu-tln"><LC.OTraLoiNgan value={chonHien} soO={q.soO} />{!daGui && !daMo ? <div className="bpu-phim">{PHIM_SO.map((p) => <button type="button" key={p} onClick={() => phimSo(p)} aria-label={p === '−' ? 'Đổi dấu' : p}>{p}</button>)}<button type="button" className="xoa" onClick={() => setChon((c) => c.slice(0, -1))}>Xoá</button></div> : null}</div>}
        {baoTra ? <div className="bpu-bao" role="status">{baoTra}</div> : null}
        {tt === 'mat-mang' ? <div className="bpu-bao" role="status">Mất kết nối, đang nối lại… Đáp án em chọn vẫn giữ trên máy, nối lại là gửi.</div> : null}
      </>
    )
    if (daMo) {
      const k = l.ketQua
      const chuDung = l.tuLuan ? '' : l.phan === 'II' ? (l.dung ?? '').split('').map((x, i) => `${'abcd'[i]}) ${x === 'D' ? 'Đúng' : 'Sai'}`).join(' · ') : String(l.dung ?? '')
      if (l.tuLuan) day = <div className="bpu-ket"><h4>Thầy đang chữa trên bảng</h4><p>Em nhìn lên bảng và đối chiếu bài làm của mình.</p></div>
      else if (k?.dung) day = <div className="bpu-ket dung" role="status"><h4>{l.phan === 'II' ? 'Đúng cả 4 ý!' : 'Chính xác!'}</h4><p>+{k.kj} kJ{k.nhanh ? ` · nhanh thứ ${k.nhanh} cả lớp` : ''} · hạng {e.hang}/{e.soEm}</p></div>
      else day = <div className="bpu-ket sai" role="status"><h4>{l.emTra ? 'Chưa đúng' : 'Em chưa gửi kịp'}</h4><p>{l.phan === 'II' && k ? `Em đúng ${k.soY ?? 0}/4 ý · +${k.kj} kJ. ` : ''}Đáp án đúng: {chuDung}</p></div>
    } else if (daGui) {
      day = <div className="bpu-gui"><NguyenTu ky={kyHieu(e.ten)} doi={doi} /><b>{l.tuLuan ? 'Đã báo thầy em làm xong' : `Đã gửi sau ${Math.round(l.emTra!.t / 1000)} giây`}</b><span>Nhìn lên bảng nhé · {l.daGui}/{l.coMat} bạn đã {l.tuLuan ? 'xong' : 'gửi'}</span></div>
    } else {
      day = <button type="button" className="bpu-nut" disabled={!duChon} onClick={guiTra}>{l.tuLuan ? 'Em làm xong' : 'Gửi đáp án'}</button>
    }
  } else than = <div className="bpu-hs-giua"><h3>Đang tải câu…</h3></div>

  return createPortal(
    <div className="bpu-hs m3" role="dialog" aria-modal="true" aria-label="Bình Phản Ứng" onPointerDown={xinToanMan}>
      {tren(e ? nhanDoi : 'Cả lớp cùng làm câu thầy chiếu')}
      {coHan && l?.han ? <div className="bpu-hs-vach"><i style={{ width: `${Math.max(0, Math.min(1, (l.han - nay) / Math.max(1, l.han - l.batDau))) * 100}%` }} /></div> : null}
      <main className="bpu-hs-than">{than}</main>
      {day ? <footer className="bpu-hs-day">{day}</footer> : null}
    </div>,
    document.body,
  )
}
