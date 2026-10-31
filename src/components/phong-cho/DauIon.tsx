// «ĐẤU NGUYÊN TỬ 2» — game bắn nhau của phòng chờ thi (thầy 31/10: «tự bắn tự ngắm vào đối thủ, bỏ hai nút điều khiển … vật phẩm ăn để tiến hoá súng,
// tối đa 6 người … đơn giản nhẹ nhàng vui vẻ»; duyệt «Chốt duyệt tất» docs/DE-XUAT-DAU-ION-V2-3110.md, bản thử scripts/ban-ve-dau-ion-v2-3110/thu.html).
// Mảnh nạp lười ngoài precache. Sảnh là thẻ trong phòng chờ (MỘT nút «Vào sân đấu», 0 kết nối tới khi bấm); trận phủ kín khung nhìn.
// ĐIỀU KHIỂN KHÔNG NÚT: kéo ở đâu cũng được (cần nổi chỉ hiện dưới ngón), chạm một điểm để đi tới; máy tính: rê chuột hoặc W A S D. Súng tự ngắm, tự bắn.
// KHÔNG cản ca kiểm tra: `batDau` (màn cha thấy thầy bắt đầu) hoặc phòng báo `dong` ⇒ huỷ vòng vẽ, đóng WebSocket NGAY, chỉ còn một dòng chữ; `dong` của
// phòng còn gọi `onBatDau` để màn cha vào bài tức thì. Kết quả chỉ để vui: không gửi điểm, không EXP.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './dau-ion.css'
import { dprToiDa, giamHieuUng } from '../../lib/may-yeu'
import { layCauHinhMayChu } from '../../lib/may-chu-moi'
import { CAN_E, MAU_MAX, NGAN_CAP, NGUYEN_TO, SAN, TEN_CAP, TEN_NGUYEN_TO, TOI_DA } from '../../lib/dau-ion/loi'
import { PHIEN_BAN } from '../../lib/dau-ion/goi'
import { Ve, docBang } from './dau-ion-ve'
import { TranAI, TranMang, type BoChay, type DongBang } from './dau-ion-tran'
import { MangDau, duongPhong, type TinMang } from './dau-ion-mang'

type Mang = 'chua' | 'noi' | 'mo' | 'mat' | 'tat' | 'het-ve' | 'may-khac' | 'day'
interface CaiDat { nt: number; an: boolean; vao: boolean }
const KHO = 'ddh.dauIon'
const PHAN_UNG = ['Hay đấy!', 'Suýt nữa!', 'Đấu lại nhé', 'Chơi đẹp']
const ngayNay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
const docKho = (): Record<string, unknown> => { try { return JSON.parse(localStorage.getItem(KHO) || '{}') } catch { return {} } }
const ghiKho = (o: Record<string, unknown>) => { try { localStorage.setItem(KHO, JSON.stringify({ ...docKho(), ...o })) } catch { /* chế độ riêng tư */ } }
function docCaiDat(): CaiDat {
  const j = docKho(), nt = Number(j.nt)
  return { nt: Number.isInteger(nt) && nt >= 0 && nt < NGUYEN_TO.length ? nt : Math.floor(Math.random() * NGUYEN_TO.length), an: !!j.an, vao: !!j.vao }
}
const docThang = () => { const j = docKho(); return j.ngay === ngayNay() ? Number(j.thang) || 0 : 0 }
/** Máy yếu tự hạ trong trận (đo 2 giây đầu) ⇒ giữ cho cả phiên. */
let haCaPhien = false
/** Nghe đổi sáng/tối của máy (trả hàm gỡ). */
const ngheNen = (f: () => void) => { try { const m = matchMedia('(prefers-color-scheme: dark)'); m.addEventListener('change', f); return () => m.removeEventListener('change', f) } catch { return () => {} } }

const Hat = ({ nt }: { nt: number }) => <span className={`dn-hat dn-nt-${nt}`} aria-hidden="true">{NGUYEN_TO[nt]}</span>
/** Em nhất ván: đứng đầu bảng và không bằng hẳn người thứ hai (hạ, bị hạ, cấp cao nhất). */
const laNhat = (b: DongBang[], emId: number) => b[0]?.id === emId && !(b[1] && b[1].ha === b[0].ha && b[1].biHa === b[0].biHa && b[1].capMax === b[0].capMax)

export interface DauIonProps { maCa?: string; veDau?: string; batDau?: boolean; /** Phòng báo thầy vừa bấm Bắt đầu ⇒ màn thi vào bài ngay. */ onBatDau?: () => void }

export default function DauIon({ maCa, veDau, batDau, onBatDau }: DauIonProps) {
  const onBatDauRef = useRef(onBatDau); onBatDauRef.current = onBatDau
  const [cd, setCd] = useState<CaiDat>(docCaiDat)
  const [mang, setMang] = useState<Mang>(veDau && maCa ? 'chua' : 'tat')
  const [lanMat, setLanMat] = useState(0)
  const [sanh, setSanh] = useState<{ so: number; that: number } | null>(null)
  const [tran, setTran] = useState<{ bo: BoChay; key: number } | null>(null)
  const [thang, setThang] = useState(docThang)
  const [tin, setTin] = useState('')
  const [pu, setPu] = useState('')
  const [dong, setDong] = useState(false)
  const mangRef = useRef<MangDau | null>(null)
  const boMang = useRef<TranMang | null>(null)
  const muonVao = useRef(false)
  /** Hàm tháo vòng vẽ của màn trận (đặt khi màn trận gắn) — gọi được NGAY trong lúc nhận gói `dong`. */
  const huyVong = useRef<(() => void) | null>(null)
  const cdRef = useRef(cd); cdRef.current = cd
  const ketThuc = !!batDau || dong

  const doiCd = (m: Partial<CaiDat>) => {
    const c = { ...cdRef.current, ...m }
    setCd(c); ghiKho(c)
    if (mangRef.current?.mo_ && ('nt' in m || 'an' in m)) mangRef.current.gui({ t: 'doi', nt: c.nt, an: c.an })
  }
  const dungHet = useCallback(() => { huyVong.current?.(); huyVong.current = null; mangRef.current?.dong(); mangRef.current = null; boMang.current = null }, [])

  const nhanTin = useCallback((t: TinMang) => {
    const nay = performance.now()
    if (t.k === 'anh') { boMang.current?.nhanAnh(t.a, nay); return }
    if (t.k === 'mo') { setMang('mo'); setLanMat(0); return }
    if (t.k === 'mat') { setMang('mat'); setLanMat(t.lan); if (t.lan >= 5) { boMang.current = null; setTran((x) => (x?.bo.mang ? null : x)) } return }
    if (t.k === 'dong') {
      if (t.ma === 4000) { dungHet(); setDong(true); onBatDauRef.current?.(); return }
      setMang(t.ma === 4003 ? 'het-ve' : t.ma === 4002 ? 'may-khac' : t.ma === 4009 ? 'day' : 'tat')
      boMang.current = null; setTran((x) => (x?.bo.mang ? null : x)); return
    }
    const j = t.j
    switch (j.t) {
      case 'chao': setMang('mo'); if (muonVao.current) mangRef.current?.gui({ t: 'vao-san' }); return
      case 'sanh': setSanh({ so: Number(j.so) || 1, that: Number(j.that) || 0 }); return
      case 'san': {
        muonVao.current = false
        const bo = new TranMang(j, (b) => mangRef.current?.gui(b), nay)
        boMang.current = bo; setPu('')
        setTran({ bo, key: nay }); return
      }
      case 'ghe': case 'van': boMang.current?.nhanJson(j, nay); if (j.t === 'van') setPu(''); return
      case 'ket': boMang.current?.nhanJson(j, nay); return
      case 'pu': { const b = boMang.current, tu = Number(j.tu); if (b) setPu(`${tu === b.emId ? 'Em' : b.ten(tu)}: ${PHAN_UNG[Number(j.i)] ?? ''}`); return }
      case 'tin': setTin(String(j.chu ?? '')); return
      // Phòng báo thầy vừa bấm Bắt đầu ⇒ dừng game trong cùng lượt + màn cha vào bài ngay.
      case 'dong':
        if (j.ly === 'bat-dau') { dungHet(); setDong(true); onBatDauRef.current?.() }
        else { dungHet(); setMang('tat'); setTran((x) => (x?.bo.mang ? null : x)) } // công tắc tắt: chỉ còn chơi tại máy
        return
    }
  }, [dungHet])

  const vaoSanh = useCallback(async () => {
    if (!veDau || !maCa || mangRef.current) return
    setMang('noi')
    let goc = ''
    try { goc = (await layCauHinhMayChu()).URL || '' } catch { /* không đọc được cấu hình */ }
    if (!goc) { setMang('mat'); setLanMat(9); return }
    const m = new MangDau(duongPhong(goc, maCa), () => ({ t: 'vao', v: PHIEN_BAN, ve: veDau, nt: cdRef.current.nt, an: cdRef.current.an }), nhanTin)
    mangRef.current = m; m.mo()
    if (!cdRef.current.vao) doiCd({ vao: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veDau, maCa, nhanTin])

  // Em từng vào sân ở phòng chờ trước ⇒ tự nối lại sảnh (chưa vào sân); thầy bắt đầu ⇒ đóng hết.
  useEffect(() => { if (cd.vao && mang === 'chua' && !ketThuc) void vaoSanh() }, [cd.vao, mang, ketThuc, vaoSanh])
  useLayoutEffect(() => { if (ketThuc) { dungHet(); setTran(null) } }, [ketThuc, dungHet])
  useEffect(() => () => dungHet(), [dungHet])
  useEffect(() => { if (!tin) return; const h = window.setTimeout(() => setTin(''), 5000); return () => clearTimeout(h) }, [tin])

  if (ketThuc) {
    return <section className="dn-the" aria-label="Mini-game Đấu Nguyên Tử">
      <div className="dn-dong" role="status"><strong>Thầy đã bắt đầu thi</strong><span>Đấu Nguyên Tử đã dừng. Em đang được đưa vào bài…</span></div>
    </section>
  }

  const choiAI = () => { boMang.current = null; setPu(''); setTran({ bo: new TranAI(cdRef.current.nt), key: performance.now() }) }
  const coMang = mang === 'mo' || mang === 'chua' || mang === 'noi' || (mang === 'mat' && lanMat < 5)
  const vaoSan = () => {
    if (mang === 'mo') mangRef.current?.gui({ t: 'vao-san' })
    else if (mang === 'chua') { muonVao.current = true; void vaoSanh() }
    else if (!coMang) choiAI()
  }
  const roi = (bo: BoChay) => { if (bo.mang) mangRef.current?.gui({ t: 'roi-san' }); boMang.current = null; setTran(null) }
  const xongVan = (bang: DongBang[], emId: number) => {
    if (laNhat(bang, emId)) { const n = docThang() + 1; setThang(n); ghiKho({ ngay: ngayNay(), thang: n }) }
  }
  const phu = mang === 'noi' ? 'Đang vào sân đấu…'
    : mang === 'mat' ? (lanMat >= 5 ? 'Chưa nối được sân đấu. Em vẫn chơi được với A.I tại máy.' : `Mất kết nối sân đấu — đang thử lại (lần ${lanMat + 1})…`)
    : mang === 'tat' ? 'Sảnh đấu chưa mở ở ca này. Em vẫn chơi được với A.I tại máy.'
    : mang === 'het-ve' ? 'Vé vào sảnh đấu đã hết hạn. Em vẫn chơi được với A.I tại máy.'
    : mang === 'may-khac' ? 'Em đang mở Đấu Nguyên Tử ở máy hoặc tab khác.'
    : mang === 'day' ? 'Sảnh đấu đã đủ người. Em chơi với A.I trong lúc chờ nhé.'
    : sanh ? `Sân ${sanh.so} · ${sanh.that ? `${sanh.that}/${TOI_DA} bạn đang chơi` : 'A.I vào cho đủ 4'} · ván 60 giây`
    : `Tối đa ${TOI_DA} bạn một sân · ván 60 giây`

  return <section className="dn-the" aria-label="Mini-game Đấu Nguyên Tử">
    <div className="dn-dau"><div><div className="dn-mat">CHƠI MỘT CHÚT TRONG LÚC CHỜ</div><h2>Đấu Nguyên Tử</h2></div><div className="dn-thang"><span>Thắng hôm nay</span><b className="so">{thang}</b></div></div>
    <AnhBia nt={cd.nt} />
    <p className="dn-luat">Súng <b>tự ngắm, tự bắn</b>. Em chỉ việc <b>kéo ở đâu cũng được</b> để đi, nhặt electron để súng tiến hoá tới Cấp 5.</p>
    <ul className="dn-cap-hang" aria-label="Năm cấp súng">{[1, 2, 3, 4, 5].map((i) => <li key={i}><i className={`dn-c${i}`}>{i}</i>{NGAN_CAP[i]}</li>)}</ul>
    <div className="dn-vao">
      <button type="button" className="dn-nut dn-nut-chinh dn-nut-to" disabled={mang === 'noi' || (mang === 'mat' && lanMat < 5)} onClick={vaoSan}>{coMang ? 'Vào sân đấu' : 'Chơi với A.I'}</button>
      {mang === 'may-khac' && <button type="button" className="dn-nut dn-nut-vien" onClick={() => { mangRef.current = null; setMang('chua'); muonVao.current = true; void vaoSanh() }}>Chơi ở máy này</button>}
      <p className="dn-phu" role="status">{mang === 'noi' || (mang === 'mat' && lanMat < 5) ? <i className="dn-cham" aria-hidden="true" /> : null}{phu}</p>
      {tin && <p className="dn-phu" role="status">{tin}</p>}
    </div>
    <div className="dn-cai">
      <span className="dn-nhan">Nguyên tố của em</span>
      <div className="dn-chon" role="radiogroup" aria-label="Nguyên tố của em">
        {NGUYEN_TO.map((k, i) => <button key={k} type="button" role="radio" aria-checked={cd.nt === i} aria-label={`${k} · ${TEN_NGUYEN_TO[i]}`} className={`dn-hat dn-nt-${i}`} onClick={() => doiCd({ nt: i })}>{k}</button>)}
      </div>
      <label className="dn-cong-tac"><input type="checkbox" checked={cd.an} onChange={(e) => doiCd({ an: e.target.checked })} />Ẩn tên (bạn thấy «Bạn {NGUYEN_TO[cd.nt]}»)</label>
    </div>
    {tran && createPortal(<ManTran key={tran.key} bo={tran.bo} huyVong={huyVong} pu={pu} matMang={tran.bo.mang && mang === 'mat' ? lanMat : -1}
      onRoi={() => roi(tran.bo)} onXong={xongVan}
      onVanMoi={() => { if (tran.bo.mang) mangRef.current?.gui({ t: 'van-moi' }); else tran.bo.vanMoi() }}
      onPu={tran.bo.mang ? (i) => { mangRef.current?.gui({ t: 'pu', i }); setPu(`Đã gửi «${PHAN_UNG[i]}» cho cả sân.`) } : undefined} />, document.body)}
  </section>
}

function AnhBia({ nt }: { nt: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ve = () => { try { Ve.veBia(cv, docBang(cv.parentElement!), nt) } catch { /* thiếu Canvas */ } }
    ve()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(ve) : null
    ro?.observe(cv)
    const go = ngheNen(ve)
    void document.fonts?.ready.then(ve)
    return () => { ro?.disconnect(); go() }
  }, [nt])
  return <div className="dn-bia"><canvas ref={ref} aria-hidden="true" /></div>
}

interface ManTranProps {
  bo: BoChay; huyVong: { current: (() => void) | null }; pu: string; matMang: number
  onRoi: () => void; onXong: (bang: DongBang[], emId: number) => void; onVanMoi: () => void; onPu?: (i: number) => void
}
interface Hud { mau: number; cap: number; e: number; ha: number; nt: number; con: number }
interface Tin { id: number; chu: string; k: string; cap?: number; t: number }
const RK = 54

/** Màn trận: phủ kín khung nhìn; vòng vẽ requestAnimationFrame (máy yếu 30 khung/giây); khung em + xếp hạng (DOM) chỉ vẽ lại khi số đổi. */
function ManTran({ bo, huyVong, pu, matMang, onRoi, onXong, onVanMoi, onPu }: ManTranProps) {
  const goc = useRef<HTMLDivElement>(null)
  const khung = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const canEl = useRef<HTMLDivElement>(null)
  const demEl = useRef<HTMLElement>(null)
  const [hud, setHud] = useState<Hud | null>(null)
  const [xh, setXh] = useState<{ id: number; ha: number; cap: number }[]>([])
  const [tinDs, setTinDs] = useState<Tin[]>([])
  const [ket, setKet] = useState<DongBang[] | null>(null)
  const [nghi, setNghi] = useState(0)
  const [khongVe, setKhongVe] = useState(false)
  const cb = useRef({ onXong }); cb.current = { onXong }

  useLayoutEffect(() => {
    const c = cv.current, g = goc.current, kh = khung.current, cn = canEl.current
    if (!c || !g || !kh || !cn) return
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx = c.getContext('2d') } catch { /* thiếu Canvas */ }
    if (!ctx) setKhongVe(true)
    let yeu = haCaPhien || giamHieuUng()
    const dpr = () => (yeu ? 1 : dprToiDa(1.5))
    const ve = ctx ? new Ve(c, ctx, docBang(g), yeu) : null
    let canh = 0, dprCu = 0
    const doiCo = () => { const r = kh.getBoundingClientRect(), n = Math.floor(Math.min(r.width, r.height)); if (ve && n > 0 && (n !== canh || dpr() !== dprCu)) { canh = n; dprCu = dpr(); ve.datCo(n, n, dprCu) } }
    doiCo()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(doiCo) : null
    ro?.observe(kh); window.addEventListener('resize', doiCo)
    // Đổi sáng/tối giữa trận: đọc lại biến màu, vẽ lại nền.
    const doiNen = () => { if (ve) ve.datBang(docBang(g)) }
    const mo = new MutationObserver(doiNen); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-giao-dien', 'class'] })
    const goNen = ngheNen(doiNen)

    // ── Điều khiển KHÔNG NÚT ──
    const phim = new Set<string>()
    const can = { id: -1, ox: 0, oy: 0, sx: 0, sy: 0, t0: 0, xa: 0, dx: 0, dy: 0 }
    let diToi: { x: number; y: number } | null = null, chuot = false
    const i = cn.firstElementChild as HTMLElement
    const anCan = () => { delete g.dataset.keo; delete cn.dataset.hien; can.id = -1; can.dx = can.dy = 0 }
    const diemSan = (cx: number, cy: number) => { const r = c.getBoundingClientRect(); return { x: ((cx - r.left) / (r.width || 1)) * SAN, y: ((cy - r.top) / (r.height || 1)) * SAN, trong: cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom && r.width > 0 } }
    const xuong = (e: PointerEvent) => {
      if ((e.target as Element).closest?.('button, .dn-ket, .dn-dai') || e.pointerType === 'mouse' || can.id !== -1) return
      can.id = e.pointerId; can.ox = can.sx = e.clientX; can.oy = can.sy = e.clientY; can.t0 = performance.now(); can.xa = 0; can.dx = can.dy = 0
      try { g.setPointerCapture(e.pointerId) } catch { /* bỏ qua */ }
      cn.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; i.style.transform = ''; cn.dataset.hien = ''
      diToi = null; g.dataset.keo = ''; g.dataset.daKeo = ''
    }
    const di = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        const p = diemSan(e.clientX, e.clientY)
        if (p.trong && !bo.ket()) { chuot = true; diToi = p } else if (chuot) { chuot = false; diToi = null }
        return
      }
      if (e.pointerId !== can.id) return
      can.xa = Math.max(can.xa, Math.hypot(e.clientX - can.sx, e.clientY - can.sy))
      let dx = e.clientX - can.ox, dy = e.clientY - can.oy
      const l = Math.hypot(dx, dy)
      // Kéo xa quá 54 px ⇒ tâm tự đi theo ngón, đổi hướng nhanh.
      if (l > RK) { can.ox += (dx / l) * (l - RK); can.oy += (dy / l) * (l - RK); dx = e.clientX - can.ox; dy = e.clientY - can.oy; cn.style.transform = `translate(${can.ox}px, ${can.oy}px)` }
      i.style.transform = `translate(${dx}px, ${dy}px)`
      const n = Math.min(1, Math.hypot(dx, dy) / RK), m = Math.hypot(dx, dy) || 1
      if (n < 0.14) can.dx = can.dy = 0; else { can.dx = (dx / m) * n; can.dy = (dy / m) * n }
    }
    const tha = (e: PointerEvent) => {
      if (e.pointerId !== can.id) return
      // Chạm nhanh không kéo ⇒ đi tới điểm đó.
      if (performance.now() - can.t0 < 240 && can.xa < 12) { const p = diemSan(e.clientX, e.clientY); if (p.trong) diToi = p }
      anCan()
    }
    const roiChuot = (e: PointerEvent) => { if (e.pointerType === 'mouse' && chuot) { chuot = false; diToi = null } }
    const phimXuong = (e: KeyboardEvent) => { if (/^(Arrow|Key[WASD]$)/.test(e.code)) { phim.add(e.code); e.preventDefault() } }
    const phimLen = (e: KeyboardEvent) => { phim.delete(e.code) }
    const matFocus = () => { phim.clear(); anCan() }
    g.addEventListener('pointerdown', xuong); g.addEventListener('pointermove', di); g.addEventListener('pointerup', tha); g.addEventListener('pointercancel', tha)
    c.addEventListener('pointerleave', roiChuot)
    window.addEventListener('keydown', phimXuong); window.addEventListener('keyup', phimLen); window.addEventListener('blur', matFocus)
    const huong = (): { dx: number; dy: number } => {
      if (phim.size) {
        let dx = (phim.has('ArrowRight') || phim.has('KeyD') ? 1 : 0) - (phim.has('ArrowLeft') || phim.has('KeyA') ? 1 : 0)
        let dy = (phim.has('ArrowDown') || phim.has('KeyS') ? 1 : 0) - (phim.has('ArrowUp') || phim.has('KeyW') ? 1 : 0)
        const l = Math.hypot(dx, dy)
        if (l) { dx /= l; dy /= l; diToi = null; return { dx, dy } }
      }
      if (can.id !== -1) return { dx: can.dx, dy: can.dy }
      if (diToi) {
        const em = bo.canh(performance.now()).ghe.find((k) => k.id === bo.emId)
        if (!em || em.cho > 0) return { dx: 0, dy: 0 }
        const ex = diToi.x - em.x, ey = diToi.y - em.y, l = Math.hypot(ex, ey)
        // Con trỏ đặt lên nguyên tử thì đứng; chạm-để-đi tới nơi thì thôi.
        if (l < 6) { if (!chuot) diToi = null; return { dx: 0, dy: 0 } }
        const t = Math.min(1, l / 40); return { dx: (ex / l) * t, dy: (ey / l) * t }
      }
      return { dx: 0, dy: 0 }
    }

    // ── Vòng vẽ ──
    let raf = 0, truoc = 0, khoaHud = '', khoaXh = '', daKet = false, dem = -1, idTin = 0
    let tins: Tin[] = []
    const doHa = { t0: 0, n: 0, xong: haCaPhien || yeu }
    const themTin = (chu: string, k: string, nay: number, cap?: number) => { tins = [...tins, { id: ++idTin, chu, k, cap, t: nay }].slice(-2); setTinDs(tins) }
    const khungHinh = (nay: number) => {
      raf = requestAnimationFrame(khungHinh)
      if (document.hidden) { truoc = nay; return }
      if (yeu && truoc && nay - truoc < 31) return
      const dt = truoc ? Math.min(0.1, (nay - truoc) / 1000) : 0
      truoc = nay
      // Tự hạ: đo 2 giây đầu (sau 1 giây làm nóng); dưới 45 khung/giây ⇒ chế độ máy yếu cho cả phiên, một lần, không hỏi.
      if (!doHa.xong) {
        if (!doHa.t0) doHa.t0 = nay + 1000
        else if (nay >= doHa.t0) { doHa.n++; if (nay - doHa.t0 >= 2000) { doHa.xong = true; if (doHa.n < 90) { haCaPhien = yeu = true; if (ve) ve.yeu = true; doiCo() } } }
      }
      const h = huong()
      bo.buoc(dt, h.dx, h.dy, nay)
      const sc = bo.canh(nay)
      for (const s of bo.laySu()) {
        ve?.them(s, nay, bo.emId, sc)
        if (s.t === 'ha') {
          if (s.boi === bo.emId) themTin(`Em hạ ${bo.ten(s.ai)}!${s.chuoi >= 2 ? ` · Hạ liền ${s.chuoi}` : ''}`, 'ha', nay)
          else if (s.ai === bo.emId) themTin(`${s.boi ? bo.ten(s.boi) : 'Bạn'} hạ em · súng xuống Cấp ${Math.max(1, s.capCu - 1)} · hồi lại sau 1,5 giây`, 'bi', nay)
        } else if (s.t === 'len' && s.ai === bo.emId) themTin(`${s.xt ? 'Xúc tác! ' : ''}Lên Cấp ${s.cap} · ${TEN_CAP[s.cap]}`, 'len', nay, s.cap)
        else if (s.t === 'nhat' && s.ai === bo.emId && s.k === 'kh') themTin('Khiên: chặn 3 viên đạn kế tiếp', '', nay)
        else if (s.t === 'trung' && s.ai === bo.emId && !yeu) { try { navigator.vibrate?.(12) } catch { /* không rung được */ } }
      }
      if (ve) { ve.diToi = diToi; ve.ve(sc, bo.emId, nay, (id) => bo.ten(id)) }
      if (tins.length && nay - tins[0].t > 1800) { tins = tins.filter((x) => nay - x.t <= 1800); setTinDs(tins) }
      const em = bo.em(), con = Math.ceil(bo.con())
      if (em) { const k = `${em.mau}|${em.cap}|${em.e}|${em.ha}|${em.nt}|${con}`; if (k !== khoaHud) { khoaHud = k; setHud({ ...em, con }) } }
      const ds = bo.xep(), k2 = ds.map((d) => `${d.id}.${d.ha}.${d.cap}`).join(',')
      if (k2 !== khoaXh) { khoaXh = k2; setXh(ds) }
      const kq = bo.ket()
      if (kq && !daKet) { daKet = true; setKet(kq); cb.current.onXong(kq, bo.emId) }
      else if (!kq && daKet) { daKet = false; setKet(null); dem = -1 }
      if (kq) {
        const n = bo.conNghi(nay), s = Math.ceil(n)
        if (s !== dem) { dem = s; setNghi(s) }
        if (demEl.current) demEl.current.style.transform = `scaleX(${Math.min(1, n / 6)})`
      }
    }
    raf = requestAnimationFrame(khungHinh)
    const huy = () => {
      cancelAnimationFrame(raf); raf = 0
      ro?.disconnect(); mo.disconnect(); goNen()
      window.removeEventListener('resize', doiCo); window.removeEventListener('keydown', phimXuong); window.removeEventListener('keyup', phimLen); window.removeEventListener('blur', matFocus)
      g.removeEventListener('pointerdown', xuong); g.removeEventListener('pointermove', di); g.removeEventListener('pointerup', tha); g.removeEventListener('pointercancel', tha); c.removeEventListener('pointerleave', roiChuot)
    }
    huyVong.current = huy
    return () => { huy(); if (huyVong.current === huy) huyVong.current = null }
  }, [bo, huyVong])

  const ten = (id: number) => (id === bo.emId ? 'Em' : bo.ten(id))
  const ntCua = (id: number) => bo.ntCua(id)
  const giay = Math.max(0, hud?.con ?? 60)
  const can = hud && hud.cap < 5 ? CAN_E[hud.cap] : 0
  const hang = ket ? ket.findIndex((d) => d.id === bo.emId) + 1 : 0
  const nhat = !!ket && laNhat(ket, bo.emId)

  return <div className="dn-man" ref={goc} role="dialog" aria-modal="true" aria-label="Trận Đấu Nguyên Tử">
    <div className="dn-dai"><span><i className="dn-cham" aria-hidden="true" />{matMang >= 0 ? `Mất kết nối sân đấu — đang thử lại (lần ${matMang + 1})…` : 'Phòng chờ · Thầy bắt đầu là vào bài'}</span>
      <button type="button" className="dn-nut dn-nut-chu" onClick={onRoi}>Rời sân</button></div>
    <div className="dn-hud">
      {hud && <div className="dn-toi">
        <Hat nt={hud.nt} />
        <div className="dn-d1"><b>Em</b><span className="dn-mau" data-it={hud.mau <= 3 ? '' : undefined} aria-hidden="true"><i style={{ transform: `scaleX(${hud.mau / MAU_MAX})` }} /></span><span className="so">Máu {hud.mau}/{MAU_MAX}</span></div>
        <div className={`dn-d2 dn-c${hud.cap}`}><em>Cấp súng {hud.cap}/5</em>{NGAN_CAP[hud.cap]}</div>
        <div className="dn-e" aria-label="Electron">{hud.cap >= 5 ? <span>Cấp cao nhất · electron hồi 1 Máu</span>
          : <>{Array.from({ length: can }, (_, k) => <i key={k} data-co={k < hud.e ? '' : undefined} />)}<span className="so">Electron {hud.e}/{can}</span></>}</div>
      </div>}
      <div className="dn-tin" aria-live="polite">{tinDs.map((x) => <div key={x.id} data-k={x.k} className={x.cap ? `dn-c${x.cap}` : undefined}>{x.chu}</div>)}</div>
      <div className="dn-so-o"><div className="dn-o"><small>Còn</small><b className="so">{Math.floor(giay / 60)}:{String(giay % 60).padStart(2, '0')}</b></div><div className="dn-o dn-o-ha"><small>Hạ</small><b className="so">{hud?.ha ?? 0}</b></div></div>
    </div>
    <div className="dn-khung" ref={khung}>
      <canvas ref={cv} tabIndex={0} aria-label="Sân đấu. Kéo ở bất kỳ đâu để đi, chạm một điểm để đi tới đó; máy tính: rê chuột trên sân hoặc W A S D. Súng tự ngắm bạn gần nhất và tự bắn." onContextMenu={(e) => e.preventDefault()} />
      {khongVe && <div className="dn-loi">Máy này chưa vẽ được sân đấu. Em vẫn chờ thầy bắt đầu bình thường.</div>}
      {ket && <><div className="dn-mo" aria-hidden="true" />
        <div className="dn-ket" role="dialog" aria-labelledby="dn-ket-tieu-de">
          <h2 id="dn-ket-tieu-de">{nhat ? 'Em nhất ván!' : hang === 1 ? 'Em đồng hạng nhất' : `Em hạng ${hang}/${ket.length}`}</h2>
          <p className="dn-ket-so">Hạng <b className="so">{hang}/{ket.length}</b> · Hạ <b className="so">{ket[hang - 1]?.ha ?? 0}</b></p>
          <table className="dn-bang"><thead><tr><th scope="col">Bạn</th><th scope="col">Hạ</th><th scope="col">Bị hạ</th><th scope="col">Cấp cao nhất</th><th scope="col">Chuỗi hạ</th></tr></thead>
            <tbody>{ket.map((d) => <tr key={d.id} data-em={d.id === bo.emId ? '' : undefined}><th scope="row"><span className="dn-ten-o"><Hat nt={ntCua(d.id)} /><b>{ten(d.id)}</b></span></th><td className="so">{d.ha}</td><td className="so">{d.biHa}</td><td className="so">{d.capMax}</td><td className="so">{d.chuoiMax}</td></tr>)}</tbody></table>
          <p className="dn-ket-so">Ván mới sau {nghi} giây</p>
          <div className="dn-dem" aria-hidden="true"><i ref={demEl} /></div>
          {onPu && <div className="dn-pu" aria-label="Phản ứng nhanh">{PHAN_UNG.map((s, k) => <button type="button" key={s} onClick={() => onPu(k)}>{s}</button>)}</div>}
          {pu && <p className="dn-phu" role="status">{pu}</p>}
          <div className="dn-hang"><button type="button" className="dn-nut dn-nut-chinh" onClick={onVanMoi}>Chơi ván mới</button><button type="button" className="dn-nut dn-nut-vien" onClick={onRoi}>Về sảnh</button></div>
          <p className="dn-phu">Kết quả chỉ để vui, không lưu vào điểm.</p>
        </div></>}
    </div>
    <div className="dn-ben">
      <h3>Xếp hạng ván này</h3>
      <ol className="dn-xh">{xh.map((d, k) => <li key={d.id} data-em={d.id === bo.emId ? '' : undefined}><span className="h so">{k + 1}</span><Hat nt={ntCua(d.id)} /><span className="t">{ten(d.id)}<small>Cấp {d.cap}</small></span><span className="k so" aria-label={`Hạ ${d.ha}`}>{d.ha}</span></li>)}</ol>
      <p className="dn-goi-y"><b>Kéo ở bất kỳ đâu</b> để đi · chạm một điểm để đi tới đó · súng tự bắn<br />{bo.phu()}</p>
      <div className="dn-cach"><h3>Cách chơi</h3><ul>
        <li><b>Di chuyển:</b> rê chuột trên sân, nguyên tử đi theo con trỏ; hoặc <kbd>W A S D</kbd> / phím mũi tên</li>
        <li><b>Súng tự ngắm</b> bạn gần nhất trong tầm và tự bắn</li>
        <li>Nhặt <b>electron</b> để súng lên cấp; <b>Xúc tác</b> lên ngay một cấp; <b>Khiên</b> chặn 3 viên đạn kế tiếp</li>
        <li>Bị hạ: súng xuống một cấp, hồi lại sau 1,5 giây</li>
        <li>{bo.phu()}</li></ul></div>
    </div>
    <div className="dn-can" ref={canEl} aria-hidden="true"><i /></div>
  </div>
}
