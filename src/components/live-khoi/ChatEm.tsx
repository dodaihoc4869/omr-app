// CHAT TRONG LIVE THEO KHỐI — MÁY EM (thầy chốt build 12/11; bản vẽ docs/ban-ve-live-moi-1211 ảnh 10 · 11 · 13). Tin đi qua kênh lớp sẵn có của
// phòng (`KenhLop`), phòng đóng dấu người gửi và phát lại cho mọi máy ⇒ máy chỉ hiện tin phòng phát về (không tự chèn tin vừa gõ).
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as TroReact } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import { chuCongThuc, chuanGui, docKhoa, docTin, duocGui, gioHien, nhanTin, tenTat, type TinChat } from '../../lib/live-khoi/chat-loi'
import { CHAT_DAI, CHAT_NHIP_MS, type ChatGui, type KenhLop } from '../../lib/live-khoi/kieu'
import './chat.css'

type KetQuaGui = 'ok' | 'nhanh-qua' | 'rong' | 'khoa'
export interface ChatLop {
  ds: TinChat[]
  /** Thầy đang tắt nhắn tin cả lớp. */
  khoa: boolean
  /** Số tin chưa đọc. */
  moi: number
  /** Tin cuối chưa đọc (để làm bong bóng); đọc hết ⇒ null. */
  tinMoi: TinChat | null
  gui(chu: string): KetQuaGui
  danhDauDoc(): void
}

/** Loạt tin cũ phòng gửi lại ngay sau `{ xin: 1 }` coi như ĐÃ ĐỌC (không nổ số đỏ, không nổi bong bóng khi em vừa vào). */
const LICH_SU_MS = 1500

/** Nghe kênh 'chat' của phòng: danh sách tin, trạng thái khoá, số tin chưa đọc, gửi theo nhịp. Hook ở cùng tệp component theo đề bài ghép (một điểm nhập). */
// oxlint-disable-next-line react/only-export-components
export function useChatLop(kenh: KenhLop | null): ChatLop {
  const [ds, setDs] = useState<TinChat[]>([])
  const [khoa, setKhoa] = useState(false)
  const [docLuc, setDocLuc] = useState(0)
  const lucGui = useRef(0), cuoiLuc = useRef(0), daXin = useRef<KenhLop | null>(null)

  useEffect(() => {
    if (!kenh) return
    const hetLichSu = Date.now() + LICH_SU_MS
    const bo = kenh.nghe('chat', (tin) => {
      const k = docKhoa(tin)
      if (k !== null) { setKhoa(k); return }
      if (!docTin(tin)) return
      cuoiLuc.current = Math.max(cuoiLuc.current, tin.l)
      setDs((cu) => nhanTin(cu, tin))
      if (Date.now() < hetLichSu) setDocLuc((cu) => Math.max(cu, tin.l))
    })
    if (daXin.current !== kenh) { daXin.current = kenh; kenh.gui('chat', { xin: 1 } satisfies ChatGui) }
    // EM QUAY LẠI APP / CÓ MẠNG LẠI (thầy 12/11 «thầy nhắn mà hs không thấy»): tin chỉ được phát cho máy ĐANG nối — em vừa rời app hay rớt mạng là lỡ. Xin lại
    // lịch sử (phòng giữ 200 tin gần nhất; tin trùng mã bị bỏ) ⇒ tin lỡ hiện lại thành bong bóng + số tin mới. Hai nhịp: ngay và sau khi kết nối kịp nối lại.
    let h1: ReturnType<typeof setTimeout> | undefined, h2: ReturnType<typeof setTimeout> | undefined
    const xinLai = () => { if (document.hidden) return; clearTimeout(h1); clearTimeout(h2); const x = () => kenh.gui('chat', { xin: 1 } satisfies ChatGui); h1 = setTimeout(x, 400); h2 = setTimeout(x, 2500) }
    document.addEventListener('visibilitychange', xinLai); window.addEventListener('pageshow', xinLai); window.addEventListener('online', xinLai)
    return () => { bo(); clearTimeout(h1); clearTimeout(h2); document.removeEventListener('visibilitychange', xinLai); window.removeEventListener('pageshow', xinLai); window.removeEventListener('online', xinLai) }
  }, [kenh])

  const gui = useCallback((chu: string): KetQuaGui => {
    if (khoa) return 'khoa'
    const c = chuanGui(chu)
    if (!c || !kenh) return 'rong'
    const nay = Date.now()
    if (!duocGui(lucGui.current, nay)) return 'nhanh-qua'
    lucGui.current = nay
    kenh.gui('chat', { c } satisfies ChatGui)
    return 'ok'
  }, [kenh, khoa])
  const danhDauDoc = useCallback(() => setDocLuc((cu) => Math.max(cu, cuoiLuc.current)), [])

  return useMemo(() => {
    let moi = 0
    for (let i = ds.length - 1; i >= 0 && ds[i].luc > docLuc; i--) moi++
    return { ds, khoa, moi, tinMoi: moi ? ds[ds.length - 1] : null, gui, danhDauDoc }
  }, [ds, khoa, docLuc, gui, danhDauDoc])
}

// ── MẢNH DÙNG CHUNG VỚI CỘT MÁY THẦY ──
const DUONG_BT = {
  chat: 'M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4V15A2.5 2.5 0 0 1 5 12.5z',
  x: 'M6 6l12 12M18 6L6 18',
  gui: 'M5 12h14M13 6l6 6-6 6',
  ghim: 'M9 4h6l-1 6 3 3H7l3-3zM12 13v7',
} as const
export function BieuTuongChat({ ten, co = 20 }: { ten: keyof typeof DUONG_BT; co?: number }) {
  return <svg className="lc-bt" width={co} height={co} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={DUONG_BT[ten]} /></svg>
}
/** Màu đội (biến CSS của DOI_BPU) gắn vào --lc-doi; thầy / không đội ⇒ để mặc định của chat.css. */
const mauDoi = (doi: number): CSSProperties | undefined => (DOI_BPU[doi] ? ({ '--lc-doi': `var(${DOI_BPU[doi].mau})` } as CSSProperties) : undefined)
/** Chữ tin nhắn, công thức hoá gõ thường hiện chỉ số dưới. */
function ChuTin({ chu }: { chu: string }) {
  return <>{chuCongThuc(chu).map((m, i) => (m.duoi ? <sub key={i}>{m.t}</sub> : m.t))}</>
}
/** Một dòng tin: ô tròn chữ tắt màu đội · tên · nhãn (Thầy / Em / ký hiệu đội) · giờ · chữ. Câu hỏi của em viền màu chú ý. */
const DongTin = memo(function DongTin({ tin, toi = false }: { tin: TinChat; toi?: boolean }) {
  const ky = DOI_BPU[tin.doi]?.ky
  const nhan = tin.thay ? 'Thầy' : [toi ? 'Em' : '', ky ?? ''].filter(Boolean).join(' · ')
  return (
    <div className="lc-tn" style={mauDoi(tin.doi)} data-thay={tin.thay || undefined} data-hoi={tin.hoi || undefined} data-toi={toi || undefined}>
      <span className="lc-av" aria-hidden="true">{tin.thay ? 'T' : tenTat(tin.ten)}</span>
      <div className="lc-tn-bong">
        <div className="lc-tn-dau">
          <span className="lc-tn-ten">{tin.ten}</span>
          <span className="lc-tn-phu">{nhan ? `${nhan} · ` : ''}{gioHien(tin.luc)}{tin.hoi ? ' · Câu hỏi' : ''}</span>
        </div>
        <div className="lc-tn-chu"><ChuTin chu={tin.chu} /></div>
      </div>
    </div>
  )
})

/** Danh sách tin tự cuộn xuống tin mới; người xem đang kéo lên đọc thì giữ nguyên vị trí. `rong` hiện khi chưa có tin. */
/** DÒNG TIN GỌN của cột cố định máy thầy (bản vẽ 59): dòng trên HỌ TÊN ĐẦY ĐỦ in đậm màu theo đội (+ nhãn «Câu hỏi», giờ); dòng dưới nội dung chữ nhỏ hơn.
 *  Vạch màu đội ở mép trái, nền ám nhẹ màu đội. Tin của thầy: màu trung tính. */
const DongTinGon = memo(function DongTinGon({ tin, toi = false }: { tin: TinChat; /** tin của chính em (máy em): nhãn «Em» + viền nhẹ */ toi?: boolean }) {
  return (
    <div className="lc-g" style={mauDoi(tin.doi)} data-thay={tin.thay || undefined} data-hoi={tin.hoi || undefined} data-toi={toi || undefined}>
      <div className="lc-g-ten"><span>{tin.thay ? 'Thầy' : tin.ten}</span>{toi ? <em className="toi">Em</em> : tin.hoi ? <em>Câu hỏi</em> : null}<time>{gioHien(tin.luc)}</time></div>
      <div className="lc-g-chu"><ChuTin chu={tin.chu} /></div>
    </div>
  )
})
export function DanhSachTin({ ds, toiSbd, rong, veCuoi, gon }: { ds: TinChat[]; toiSbd?: string; rong: string; /** Đổi số này ⇒ ép cuộn về cuối (vừa gửi tin). */ veCuoi?: number; /** dòng tin gọn hai dòng (cột cố định máy thầy) */ gon?: boolean }) {
  const khung = useRef<HTMLDivElement>(null), oDay = useRef(true)
  useLayoutEffect(() => { oDay.current = true }, [veCuoi])
  useLayoutEffect(() => { const el = khung.current; if (el && oDay.current) el.scrollTop = el.scrollHeight }, [ds, veCuoi])
  // Khung đổi cỡ (bàn phím máy em bật lên, dòng báo hiện ra) mà đang ở cuối ⇒ vẫn bám tin mới nhất.
  useEffect(() => {
    const el = khung.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const mat = new ResizeObserver(() => { if (oDay.current) el.scrollTop = el.scrollHeight })
    mat.observe(el)
    return () => mat.disconnect()
  }, [])
  const khiCuon = () => { const el = khung.current; if (el) oDay.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48 }
  return (
    <div className={gon ? 'lc-ds lc-ds-gon' : 'lc-ds'} ref={khung} onScroll={khiCuon} role="log" aria-label="Tin nhắn lớp" tabIndex={0}>
      {ds.length ? ds.map((t) => (gon ? <DongTinGon key={t.id} tin={t} toi={!!toiSbd && t.sbd === toiSbd} /> : <DongTin key={t.id} tin={t} toi={!!toiSbd && t.sbd === toiSbd} />)) : <p className="lc-rong">{rong}</p>}
    </div>
  )
}

// ── MÁY EM ──
/** Nút 44 × 44 trong thanh ẩn mép phải: bong bóng chat + số tin mới. */
export function NutChatEm({ moi, onMo }: { moi: number; onMo: () => void }) {
  return (
    <button type="button" className="lc-goc lc-nut" onClick={onMo} aria-label={moi ? `Nhắn cả lớp, ${moi} tin mới` : 'Nhắn cả lớp'}>
      <BieuTuongChat ten="chat" />
      {moi > 0 && <span className="lc-nut-so" aria-hidden="true">{moi > 99 ? '99+' : moi}</span>}
    </button>
  )
}

/** Bong bóng nhỏ cạnh thanh ẩn: tên (màu đội) + chữ của tin mới, hiện 4 giây rồi tự mờ. Cha cần `position: relative`. */
export function BongTinMoi({ tin }: { tin: TinChat | null }) {
  const [daMo, setDaMo] = useState<string | null>(null)
  const ky = tin ? DOI_BPU[tin.doi]?.ky : undefined
  return (
    <div className="lc-goc lc-bong-cho" aria-live="polite">
      {tin && daMo !== tin.id && (
        <div key={tin.id} className={`lc-bong-noi${tin.thay ? ' thay' : ''}`} style={mauDoi(tin.doi)} onAnimationEnd={() => setDaMo(tin.id)}>
          <b>{tin.thay ? 'Thầy' : ky ? `${tin.ten} · ${ky}` : tin.ten}</b>
          <ChuTin chu={tin.chu} />
        </div>
      )}
    </div>
  )
}

const NHAN_NHANH = [
  { chu: 'Em hiểu rồi ạ' },
  { chu: 'Thầy giảng lại ạ' },
  { chu: '🔥', doc: 'Gửi lửa cổ vũ' },
  { chu: '👏', doc: 'Gửi vỗ tay' },
] as const

/** Cửa nổi «Nhắn cả lớp» bên phải máy em. Cha cần `position: relative`; lề phải chỉnh bằng biến `--lc-cach-phai` (mặc định 52 px = thanh ẩn 44 + 8). */
export function CuaChatEm({ chat, toiSbd, onDong }: { chat: ChatLop; toiSbd: string; onDong: () => void }) {
  const [chu, setChu] = useState('')
  const [nhanhQua, setNhanhQua] = useState(false)
  const [veCuoi, setVeCuoi] = useState(0)
  const cua = useRef<HTMLDivElement>(null)
  const { ds, khoa, danhDauDoc } = chat

  // Cửa đang mở ⇒ tin tới là đã đọc.
  useEffect(() => { danhDauDoc() }, [ds, danhDauDoc])
  useEffect(() => { cua.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    const khiPhim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onDong() } }
    window.addEventListener('keydown', khiPhim)
    return () => window.removeEventListener('keydown', khiPhim)
  }, [onDong])
  useEffect(() => {
    if (!nhanhQua) return
    const hen = window.setTimeout(() => setNhanhQua(false), CHAT_NHIP_MS)
    return () => window.clearTimeout(hen)
  }, [nhanhQua])

  /** Gửi; trả true khi tin đã đi. */
  const gui = (c: string) => {
    const kq = chat.gui(c)
    setNhanhQua(kq === 'nhanh-qua')
    if (kq === 'ok') setVeCuoi((n) => n + 1)
    return kq === 'ok'
  }
  const khiGui = (e: FormEvent) => { e.preventDefault(); if (gui(chu)) setChu('') }

  return (
    <div className="lc-goc lc-khung lc-cua" ref={cua} role="dialog" aria-label="Nhắn cả lớp" tabIndex={-1}>
      <div className="lc-dau">
        <BieuTuongChat ten="chat" co={18} />
        <span className="lc-dau-ten">Nhắn cả lớp</span>
        <button type="button" className="lc-o44" onClick={onDong} aria-label="Đóng nhắn tin"><BieuTuongChat ten="x" co={18} /></button>
      </div>
      <DanhSachTin ds={ds} toiSbd={toiSbd} rong="Chưa có tin nhắn nào" veCuoi={veCuoi} />
      <div className="lc-nhanh">
        {NHAN_NHANH.map((n) => (
          <button key={n.chu} type="button" className="lc-vien-bam" disabled={khoa} onClick={() => gui(n.chu)} aria-label={'doc' in n ? n.doc : undefined}><span>{n.chu}</span></button>
        ))}
      </div>
      <p className="lc-bao" role="status" data-loai={khoa ? 'khoa' : 'nhanh'}>{khoa ? 'Thầy đang tắt nhắn tin' : nhanhQua ? 'Chờ 2 giây rồi gửi tiếp' : ''}</p>
      <form className="lc-nhap" onSubmit={khiGui}>
        <input value={chu} onChange={(e) => setChu(e.target.value)} maxLength={CHAT_DAI} disabled={khoa} placeholder="Nhắn thầy và cả lớp…" aria-label="Nhắn thầy và cả lớp" enterKeyHint="send" autoComplete="off" />
        <button type="submit" className="lc-gui" disabled={khoa || !chu.trim()} aria-label="Gửi tin"><BieuTuongChat ten="gui" co={18} /></button>
      </form>
    </div>
  )
}

// ── NGĂN «TIN NHẮN LỚP» MÁY EM (thầy duyệt bản vẽ 60–66 ngày 13/11: «hs vuốt từ mép bên phải vào thì hiện luôn khung chat … giống như thiết kế của gv») ──
// Điện thoại xoay ngang: ngăn trượt từ mép phải theo ngón tay (LopLive báo `ddh-lk-keo` / `ddh-lk-tha`), kéo tay nắm của ngăn sang phải / chạm ra ngoài ⇒ đóng;
// bàn phím bật ⇒ ngăn co lên trên bàn phím, chỉ còn tin mới + ô nhập. Máy tính: ngăn GHIM thành cột bên phải (màn live co sang trái), Enter gõ ngay, Esc về bài.
const NHAN_NHANH_NGAN = ['Em hiểu rồi ạ', 'Thầy giảng lại ạ', 'Em chưa rõ ạ'] as const
/** Bề cao đáy cửa sổ đang bị bàn phím ảo che (px); 0 = không có bàn phím / trình duyệt không báo. */
function useBanPhim(): number {
  const [px, setPx] = useState(0)
  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const f = () => setPx(Math.max(0, Math.round(window.innerHeight - v.height - v.offsetTop)))
    v.addEventListener('resize', f); v.addEventListener('scroll', f)
    return () => { v.removeEventListener('resize', f); v.removeEventListener('scroll', f) }
  }, [])
  return px
}
export function NganChatEm({ chat, toiSbd, soEm, ghim, coGhim, keo, tieuDiem, trucX, onDong, onGhim }: {
  chat: ChatLop; toiSbd: string; soEm: number
  /** đang ghim thành cột (máy tính) */ ghim: boolean; /** máy này ghim được (máy tính màn rộng) */ coGhim: boolean
  /** đang kéo mở: số px đã kéo vào (null = không kéo) */ keo: number | null
  /** đổi số ⇒ đưa con trỏ vào ô nhập (phím Enter) */ tieuDiem: number
  /** hoành độ con trỏ theo trục của HÌNH (hình xoay 90° thì đổi trục) */ trucX: (e: { clientX: number; clientY: number }) => number
  onDong: () => void; onGhim: (b: boolean) => void
}) {
  const [chu, setChu] = useState('')
  const [nhanhQua, setNhanhQua] = useState(false)
  const [veCuoi, setVeCuoi] = useState(0)
  const [lech, setLech] = useState<number | null>(null)
  const goc = useRef<HTMLDivElement>(null), o = useRef<HTMLInputElement>(null), k = useRef<{ id: number; x0: number } | null>(null)
  const banPhim = useBanPhim()
  const { ds, khoa, danhDauDoc } = chat
  const dangKeo = keo != null
  useEffect(() => { if (!dangKeo) danhDauDoc() }, [ds, danhDauDoc, dangKeo])
  useEffect(() => { if (tieuDiem) o.current?.focus({ preventScroll: true }) }, [tieuDiem])
  // Esc: đang gõ ⇒ rời ô nhập (về bài); ngăn trượt ⇒ đóng. Cột ghim không gõ ⇒ để Esc cho màn bên dưới.
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const dangGo = document.activeElement === o.current
      if (!dangGo && ghim) return
      e.stopPropagation()
      if (dangGo) o.current?.blur()
      if (!ghim) onDong()
    }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [ghim, onDong])
  useEffect(() => {
    if (!nhanhQua) return
    const hen = window.setTimeout(() => setNhanhQua(false), CHAT_NHIP_MS)
    return () => window.clearTimeout(hen)
  }, [nhanhQua])
  const gui = (c: string) => { const kq = chat.gui(c); setNhanhQua(kq === 'nhanh-qua'); if (kq === 'ok') setVeCuoi((n) => n + 1); return kq === 'ok' }
  const khiGui = (e: FormEvent) => { e.preventDefault(); if (gui(chu)) setChu('') }
  // kéo tay nắm của ngăn sang phải ⇒ ngăn theo ngón tay; quá 30 % bề ngang (hoặc chỉ chạm) ⇒ đóng
  const xuong = (e: TroReact<HTMLElement>) => { k.current = { id: e.pointerId, x0: trucX(e) }; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ } }
  const di = (e: TroReact<HTMLElement>) => { const c = k.current; if (c && c.id === e.pointerId) setLech(Math.max(0, trucX(e) - c.x0)) }
  const nha = (e: TroReact<HTMLElement>) => {
    const c = k.current
    k.current = null
    if (!c || c.id !== e.pointerId) return
    const d = Math.max(0, trucX(e) - c.x0)
    setLech(null)
    if (d < 6 || d > (goc.current?.offsetWidth ?? 320) * 0.3) onDong()
  }
  const go = banPhim > 80
  const dich = dangKeo ? `translateX(max(0px, calc(100% - ${Math.round(keo)}px)))` : lech ? `translateX(${Math.round(lech)}px)` : undefined
  return (
    <div ref={goc} className={`lc-goc lc-khung lc-ngan${ghim ? ' lc-ghim' : ''}${go ? ' go' : ''}`} role="dialog" aria-label="Tin nhắn lớp" data-keo={dangKeo || lech != null || undefined}
      style={{ transform: dich, ...(banPhim > 0 ? { bottom: banPhim } : {}) }}>
      {ghim ? null : <i className="lc-ngan-tay" aria-hidden="true" onPointerDown={xuong} onPointerMove={di} onPointerUp={nha} onPointerCancel={nha} />}
      <div className="lc-dau">
        <span className="lc-dau-ten">Tin nhắn lớp<small>{soEm} em</small></span>
        {coGhim && !ghim ? <button type="button" className="lc-o44" onClick={() => onGhim(true)} aria-label="Ghim tin nhắn thành cột bên phải" title="Ghim thành cột"><BieuTuongChat ten="ghim" co={18} /></button> : null}
        <button type="button" className="lc-o44" onClick={() => (ghim ? onGhim(false) : onDong())} aria-label={ghim ? 'Cất cột tin nhắn' : 'Đóng tin nhắn'} title={ghim ? 'Cất cột' : 'Đóng'}><BieuTuongChat ten="x" co={18} /></button>
      </div>
      <DanhSachTin ds={ds} toiSbd={toiSbd} rong="Chưa có tin nhắn nào" veCuoi={veCuoi} gon />
      <div className="lc-nhanh">
        {NHAN_NHANH_NGAN.map((c) => <button key={c} type="button" className="lc-vien-bam" disabled={khoa} onClick={() => gui(c)}><span>{c}</span></button>)}
      </div>
      <p className="lc-bao" role="status" data-loai={khoa ? 'khoa' : 'nhanh'}>{khoa ? 'Thầy đang tắt nhắn tin' : nhanhQua ? 'Chờ 2 giây rồi gửi tiếp' : ''}</p>
      <form className="lc-nhap" onSubmit={khiGui}>
        <input ref={o} value={chu} onChange={(e) => setChu(e.target.value)} maxLength={CHAT_DAI} disabled={khoa} placeholder="Nhắn thầy và cả lớp…" aria-label="Nhắn thầy và cả lớp" enterKeyHint="send" autoComplete="off" />
        <button type="submit" className="lc-gui" disabled={khoa || !chu.trim()} aria-label="Gửi tin"><BieuTuongChat ten="gui" co={18} /></button>
      </form>
      {coGhim ? <p className="lc-phim" aria-hidden="true"><kbd>Enter</kbd> gõ ngay · <kbd>Esc</kbd> về bài</p> : null}
    </div>
  )
}
