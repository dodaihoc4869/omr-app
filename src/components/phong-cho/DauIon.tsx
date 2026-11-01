// «ĐẤU NGUYÊN TỬ» — game bắn nhau của phòng chờ thi. BẢN VẼ 3 ĐẤU 3 (thầy 01/11 tối, docs/ban-ve-dau-ion-3v3-0111/DAC-TA.md — CHƯA DUYỆT):
//  · Sảnh là thẻ trong phòng chờ, MỘT nút lớn «Đấu» (0 kết nối tới khi bấm). Bấm ⇒ vào ngay sân đang chạy còn ghế A.I (em thế chỗ A.I) hoặc sân mới
//    1 em + 5 A.I; ván 60 giây nối ván liên tục. Hai phe Bazơ (xanh) / Axit (đỏ); phe em luôn ở TRÁI (ngang) hoặc DƯỚI (dọc).
//  · Trận TRÀN MÀN: sân chữ nhật ngang 2 : 1 vừa khít điện thoại xoay ngang; điện thoại xin toàn màn + khoá ngang khi máy cho (iOS không khoá được ⇒
//    lời nhắc nhỏ «Xoay ngang…»). Tỉ số / đồng hồ / Máu / cấp súng là lớp phủ mỏng ở góc, không chiếm chỗ sân. Tôn trọng tai thỏ (safe-area).
//  · Thân thiện trước giờ thi: lần đầu vào sân có gợi ý 3 giây «Kéo để chạy · súng tự bắn»; thắng thua theo PHE, hết ván KHÔNG xếp hạng ai cuối —
//    mỗi em một huy hiệu vui (lõi `huyHieu`). Kết quả chỉ để vui: không gửi điểm, không EXP.
// ĐIỀU KHIỂN KHÔNG NÚT: kéo ở đâu cũng được (cần ảo vô hình), chạm một điểm để đi tới; máy tính: rê chuột hoặc W A S D. Súng tự ngắm, tự bắn.
// KHÔNG cản ca kiểm tra: `batDau` (màn cha thấy thầy bắt đầu) hoặc phòng báo `dong` ⇒ huỷ vòng vẽ, đóng WebSocket NGAY, thoát toàn màn, chỉ còn một dòng chữ.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './dau-ion.css'
import { dprToiDa, giamHieuUng } from '../../lib/may-yeu'
import { layCauHinhMayChu } from '../../lib/may-chu-moi'
import { CAN_E, ION_PHE, MAU_MAX, NGAN_CAP, NGUYEN_TO, PHE, TEN_NGUYEN_TO, huyHieu } from '../../lib/dau-ion/loi'
import { PHIEN_BAN } from '../../lib/dau-ion/goi'
import { Ve, docBang } from './dau-ion-ve'
import { TranAI, TranMang, type BoChay, type DongBang } from './dau-ion-tran'
import { MangDau, duongPhong, type TinMang } from './dau-ion-mang'
import { KHONG_XOAY, diemVao, huongVao, ra, xoayCanh, xoaySu, type Xoay } from './dau-ion-xoay'

type Mang = 'chua' | 'noi' | 'mo' | 'mat' | 'tat' | 'het-ve' | 'may-khac' | 'day'
interface CaiDat { nt: number; an: boolean; vao: boolean; daXemGoiY: boolean }
const KHO = 'ddh.dauIon'
const PHAN_UNG = ['Hay đấy!', 'Suýt nữa!', 'Đấu lại nhé', 'Chơi đẹp']
const ngayNay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
const docKho = (): Record<string, unknown> => { try { return JSON.parse(localStorage.getItem(KHO) || '{}') } catch { return {} } }
const ghiKho = (o: Record<string, unknown>) => { try { localStorage.setItem(KHO, JSON.stringify({ ...docKho(), ...o })) } catch { /* chế độ riêng tư */ } }
function docCaiDat(): CaiDat {
  const j = docKho(), nt = Number(j.nt)
  return { nt: Number.isInteger(nt) && nt >= 0 && nt < NGUYEN_TO.length ? nt : Math.floor(Math.random() * NGUYEN_TO.length), an: !!j.an, vao: !!j.vao, daXemGoiY: !!j.daXemGoiY }
}
/** Số ván PHE EM thắng hôm nay. */
const docThang = () => { const j = docKho(); return j.ngay === ngayNay() ? Number(j.thang) || 0 : 0 }
/** Máy yếu tự hạ trong trận (đo 2 giây đầu) ⇒ giữ cho cả phiên. */
let haCaPhien = false
/** Nghe đổi sáng/tối của máy (trả hàm gỡ). */
const ngheNen = (f: () => void) => { try { const m = matchMedia('(prefers-color-scheme: dark)'); m.addEventListener('change', f); return () => m.removeEventListener('change', f) } catch { return () => {} } }
const laCamUng = () => { try { return matchMedia('(pointer: coarse)').matches } catch { return false } }

/** Điện thoại: xin toàn màn + khoá ngang NGAY trong lượt bấm (cần thao tác của em). Máy tính / iOS không cho ⇒ bỏ qua, không báo lỗi. */
function vaoToanMan(): void {
  if (!laCamUng()) return
  try {
    const d = document.documentElement as HTMLElement & { requestFullscreen?: (o?: FullscreenOptions) => Promise<void> }
    if (document.fullscreenElement || !d.requestFullscreen) return
    void d.requestFullscreen({ navigationUI: 'hide' })
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape'))
      .catch(() => { /* iOS / máy không cho khoá */ })
  } catch { /* không có Fullscreen API */ }
}
function raToanMan(): void {
  try { (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.() } catch { /* bỏ qua */ }
  try { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}) } catch { /* bỏ qua */ }
}

const Hat = ({ nt, phe }: { nt: number; phe?: number }) => <span className={`dn-hat ${phe === undefined ? `dn-nt-${nt}` : `dn-phe-${phe}`}`} aria-hidden="true">{NGUYEN_TO[nt]}</span>
const gio = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

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
  const dungHet = useCallback(() => { huyVong.current?.(); huyVong.current = null; mangRef.current?.dong(); mangRef.current = null; boMang.current = null; raToanMan() }, [])

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
      case 'ghe': case 'van': case 'thay': boMang.current?.nhanJson(j, nay); if (j.t === 'van') setPu(''); return
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
  const dau = () => {
    vaoToanMan()
    if (mang === 'mo') mangRef.current?.gui({ t: 'vao-san' })
    else if (mang === 'chua') { muonVao.current = true; void vaoSanh() }
    else if (!coMang) choiAI()
  }
  const roi = (bo: BoChay) => { if (bo.mang) mangRef.current?.gui({ t: 'roi-san' }); boMang.current = null; setTran(null); raToanMan() }
  const xongVan = (bang: DongBang[], pheEm: number) => {
    const [a, b] = [0, 1].map((p) => bang.filter((d) => d.phe === p).reduce((s, d) => s + d.ha, 0))
    if ((pheEm === 0 ? a > b : b > a)) { const n = docThang() + 1; setThang(n); ghiKho({ ngay: ngayNay(), thang: n }) }
  }
  const phu = mang === 'noi' ? 'Đang vào sân đấu…'
    : mang === 'mat' ? (lanMat >= 5 ? 'Chưa nối được sân đấu. Bấm «Đấu» để chơi với A.I tại máy.' : `Mất kết nối sân đấu — đang thử lại (lần ${lanMat + 1})…`)
    : mang === 'tat' ? 'Sảnh đấu chưa mở ở ca này. Bấm «Đấu» để chơi với A.I tại máy.'
    : mang === 'het-ve' ? 'Vé vào sảnh đấu đã hết hạn. Bấm «Đấu» để chơi với A.I tại máy.'
    : mang === 'may-khac' ? 'Em đang mở Đấu Nguyên Tử ở máy hoặc tab khác.'
    : mang === 'day' ? 'Sân đấu đang kín. Bấm «Đấu» để chơi với A.I trong lúc chờ nhé.'
    : sanh && sanh.that ? `Đang đấu: ${sanh.that} bạn + ${Math.max(0, 6 - sanh.that)} A.I · bấm là vào ngay`
    : 'Bấm là vào trận ngay · ván 60 giây nối liền'

  return <section className="dn-the" aria-label="Mini-game Đấu Nguyên Tử">
    <div className="dn-dau"><div><div className="dn-mat">CHƠI MỘT CHÚT TRONG LÚC CHỜ</div><h2>Đấu Nguyên Tử</h2></div><div className="dn-thang"><span>Phe em thắng hôm nay</span><b className="so">{thang}</b></div></div>
    <AnhBia nt={cd.nt} />
    <div className="dn-hai-phe" aria-label="Hai phe">
      <span className="dn-chip-phe dn-phe-0"><i aria-hidden="true">{ION_PHE[0]}</i>Phe {PHE[0]}</span>
      <b>3 đấu 3</b>
      <span className="dn-chip-phe dn-phe-1"><i aria-hidden="true">{ION_PHE[1]}</i>Phe {PHE[1]}</span>
    </div>
    <div className="dn-vao">
      <button type="button" className="dn-nut dn-nut-chinh dn-nut-to" disabled={mang === 'noi' || (mang === 'mat' && lanMat < 5)} onClick={dau}>Đấu</button>
      <p className="dn-luat-ngan">3 đấu 3 · thiếu bạn thì A.I vào thay · bạn vào là A.I nhường chỗ</p>
      {mang === 'may-khac' && <button type="button" className="dn-nut dn-nut-vien" onClick={() => { mangRef.current = null; setMang('chua'); muonVao.current = true; void vaoSanh() }}>Chơi ở máy này</button>}
      <p className="dn-phu" role="status">{mang === 'noi' || (mang === 'mat' && lanMat < 5) ? <i className="dn-cham" aria-hidden="true" /> : null}{phu}</p>
      {tin && <p className="dn-phu" role="status">{tin}</p>}
    </div>
    <p className="dn-luat">Súng <b>tự ngắm đối thủ gần nhất, tự bắn</b>. Em chỉ việc <b>kéo để chạy</b>, nấp sau dụng cụ thí nghiệm, nhặt electron để súng lên tới Cấp 5.</p>
    <div className="dn-cai">
      <span className="dn-nhan">Ký hiệu trên nguyên tử của em</span>
      <div className="dn-chon" role="radiogroup" aria-label="Nguyên tố của em">
        {NGUYEN_TO.map((k, i) => <button key={k} type="button" role="radio" aria-checked={cd.nt === i} aria-label={`${k} · ${TEN_NGUYEN_TO[i]}`} className="dn-hat dn-ky" onClick={() => doiCd({ nt: i })}>{k}</button>)}
      </div>
      <label className="dn-cong-tac"><input type="checkbox" checked={cd.an} onChange={(e) => doiCd({ an: e.target.checked })} />Ẩn tên (bạn thấy «Bạn {NGUYEN_TO[cd.nt]}»)</label>
    </div>
    {tran && createPortal(<ManTran key={tran.key} bo={tran.bo} huyVong={huyVong} pu={pu} matMang={tran.bo.mang && mang === 'mat' ? lanMat : -1}
      goiY={!cd.daXemGoiY} onDaXemGoiY={() => doiCd({ daXemGoiY: true })}
      onRoi={() => roi(tran.bo)} onXong={xongVan}
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
  goiY: boolean; onDaXemGoiY: () => void
  onRoi: () => void; onXong: (bang: DongBang[], pheEm: number) => void; onPu?: (i: number) => void
}
interface Hud { mau: number; cap: number; e: number; ha: number; nt: number; phe: number; con: number; ts: [number, number] }
interface Tin { id: number; chu: string; k: string; cap?: number; phe?: number; t: number }
const RK = 54

/** Màn trận TRÀN MÀN: canvas sân giữa vùng an toàn (giữ tỉ lệ 2 : 1, xoay theo máy); lớp phủ mỏng ở góc. Vòng vẽ requestAnimationFrame
 *  (máy yếu 30 khung/giây); lớp phủ (DOM) chỉ vẽ lại khi số đổi. */
function ManTran({ bo, huyVong, pu, matMang, goiY, onDaXemGoiY, onRoi, onXong, onPu }: ManTranProps) {
  const goc = useRef<HTMLDivElement>(null)
  const khung = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const demEl = useRef<HTMLElement>(null)
  const [hud, setHud] = useState<Hud | null>(null)
  const [xh, setXh] = useState<{ id: number; phe: number; ha: number; cap: number }[]>([])
  const [tinDs, setTinDs] = useState<Tin[]>([])
  const [ket, setKet] = useState<DongBang[] | null>(null)
  const [nghi, setNghi] = useState(0)
  const [khongVe, setKhongVe] = useState(false)
  const [hienGoiY, setHienGoiY] = useState(goiY)
  const [nhacXoay, setNhacXoay] = useState(false)
  const cb = useRef({ onXong, onDaXemGoiY }); cb.current = { onXong, onDaXemGoiY }

  // Gợi ý lần đầu: 3 giây rồi tự tắt (một lần mỗi máy).
  useEffect(() => { if (!hienGoiY) return; const h = window.setTimeout(() => { setHienGoiY(false); cb.current.onDaXemGoiY() }, 3000); return () => clearTimeout(h) }, [hienGoiY])
  // Điện thoại đang dọc (iOS không khoá ngang được): nhắc nhỏ 6 giây.
  useEffect(() => {
    const kiem = () => setNhacXoay(laCamUng() && innerHeight > innerWidth)
    kiem()
    const h = window.setTimeout(() => { setNhacXoay(false); removeEventListener('resize', kiem) }, 6000)
    addEventListener('resize', kiem)
    return () => { clearTimeout(h); removeEventListener('resize', kiem) }
  }, [])

  useLayoutEffect(() => {
    const c = cv.current, g = goc.current, kh = khung.current
    if (!c || !g || !kh) return
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx = c.getContext('2d') } catch { /* thiếu Canvas */ }
    if (!ctx) setKhongVe(true)
    let yeu = haCaPhien || giamHieuUng()
    const dpr = () => (yeu ? 1 : dprToiDa(1.5))
    const ve = ctx ? new Ve(c, ctx, docBang(g), yeu) : null
    // Khung xoay: dọc ⇒ sân dựng đứng, phe em dưới; ngang ⇒ phe em trái. Đổi khi xoay máy hoặc khi phòng chia lại phe.
    let xoay: Xoay = KHONG_XOAY, pheEm = bo.pheCua(bo.emId), coW = 0, coH = 0, dprCu = 0
    const doiCo = () => {
      const r = kh.getBoundingClientRect()
      if (!(r.width > 0) || !(r.height > 0)) return
      const k: Xoay = { doc: r.height > r.width * 1.05, lat: pheEm === 1 }
      const co = ve ? ve.datSan(k, pheEm) : { w: k.doc ? 520 : 1040, h: k.doc ? 1040 : 520 }
      const s = Math.min(r.width / co.w, r.height / co.h), w = Math.floor(co.w * s), h = Math.floor(co.h * s)
      const doi = k.doc !== xoay.doc || k.lat !== xoay.lat
      xoay = k
      if (ve && (doi || w !== coW || h !== coH || dpr() !== dprCu)) { coW = w; coH = h; dprCu = dpr(); c.style.width = `${w}px`; c.style.height = `${h}px`; ve.datCo(w, h, dprCu) }
      g.dataset.doc = k.doc ? '1' : '0'
    }
    doiCo()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(doiCo) : null
    ro?.observe(kh); window.addEventListener('resize', doiCo)
    // Đổi sáng/tối giữa trận: đọc lại biến màu, vẽ lại nền.
    const doiNen = () => { if (ve) ve.datBang(docBang(g)) }
    const mo = new MutationObserver(doiNen); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-giao-dien', 'class'] })
    const goNen = ngheNen(doiNen)

    // ── Điều khiển KHÔNG NÚT (hướng trên MÀN ⇒ đổi về hướng trên SÂN theo khung xoay) ──
    const phim = new Set<string>()
    const can = { id: -1, ox: 0, oy: 0, sx: 0, sy: 0, t0: 0, xa: 0, dx: 0, dy: 0 }
    /** Điểm đến (toạ độ SÂN). */
    let diToi: { x: number; y: number } | null = null, chuot = false
    const anCan = () => { can.id = -1; can.dx = can.dy = 0 }
    const diemSan = (cx: number, cy: number) => {
      const r = c.getBoundingClientRect(), cw = xoay.doc ? 520 : 1040, ch = xoay.doc ? 1040 : 520
      const [x, y] = diemVao(((cx - r.left) / (r.width || 1)) * cw, ((cy - r.top) / (r.height || 1)) * ch, xoay)
      return { x, y, trong: cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom && r.width > 0 }
    }
    const xuong = (e: PointerEvent) => {
      if ((e.target as Element).closest?.('button, .dn-ket, .dn-tren, .dn-em-o') || e.pointerType === 'mouse' || can.id !== -1) return
      can.id = e.pointerId; can.ox = can.sx = e.clientX; can.oy = can.sy = e.clientY; can.t0 = performance.now(); can.xa = 0; can.dx = can.dy = 0
      try { g.setPointerCapture(e.pointerId) } catch { /* bỏ qua */ }
      diToi = null; g.dataset.daKeo = ''
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
      if (l > RK) { can.ox += (dx / l) * (l - RK); can.oy += (dy / l) * (l - RK); dx = e.clientX - can.ox; dy = e.clientY - can.oy }
      const n = Math.min(1, Math.hypot(dx, dy) / RK), m = Math.hypot(dx, dy) || 1
      if (n < 0.14) can.dx = can.dy = 0; else { can.dx = (dx / m) * n; can.dy = (dy / m) * n }
    }
    const tha = (e: PointerEvent) => {
      if (e.pointerId !== can.id) return
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
    /** Hướng đi trên SÂN. */
    const huong = (): { dx: number; dy: number } => {
      if (phim.size) {
        let dx = (phim.has('ArrowRight') || phim.has('KeyD') ? 1 : 0) - (phim.has('ArrowLeft') || phim.has('KeyA') ? 1 : 0)
        let dy = (phim.has('ArrowDown') || phim.has('KeyS') ? 1 : 0) - (phim.has('ArrowUp') || phim.has('KeyW') ? 1 : 0)
        const l = Math.hypot(dx, dy)
        if (l) { dx /= l; dy /= l; diToi = null; const [x, y] = huongVao(dx, dy, xoay); return { dx: x, dy: y } }
      }
      if (can.id !== -1) { const [x, y] = huongVao(can.dx, can.dy, xoay); return { dx: x, dy: y } }
      if (diToi) {
        const em = bo.canh(performance.now()).ghe.find((k) => k.id === bo.emId)
        if (!em || em.cho > 0) return { dx: 0, dy: 0 }
        const ex = diToi.x - em.x, ey = diToi.y - em.y, l = Math.hypot(ex, ey)
        if (l < 6) { if (!chuot) diToi = null; return { dx: 0, dy: 0 } }
        const t = Math.min(1, l / 40); return { dx: (ex / l) * t, dy: (ey / l) * t }
      }
      return { dx: 0, dy: 0 }
    }

    // ── Vòng vẽ ──
    let raf = 0, truoc = 0, khoaHud = '', khoaXh = '', daKet = false, dem = -1, idTin = 0
    let tins: Tin[] = []
    const doHa = { t0: 0, n: 0, xong: haCaPhien || yeu }
    const themTin = (chu: string, k: string, nay: number, them?: { cap?: number; phe?: number }) => { tins = [...tins, { id: ++idTin, chu, k, ...them, t: nay }].slice(-2); setTinDs(tins) }
    const khungHinh = (nay: number) => {
      raf = requestAnimationFrame(khungHinh)
      if (document.hidden) { truoc = nay; return }
      if (yeu && truoc && nay - truoc < 31) return
      const dt = truoc ? Math.min(0.1, (nay - truoc) / 1000) : 0
      truoc = nay
      if (!doHa.xong) {
        if (!doHa.t0) doHa.t0 = nay + 1000
        else if (nay >= doHa.t0) { doHa.n++; if (nay - doHa.t0 >= 2000) { doHa.xong = true; if (doHa.n < 90) { haCaPhien = yeu = true; if (ve) ve.yeu = true; doiCo() } } }
      }
      const p = bo.pheCua(bo.emId)
      if (p !== pheEm) { pheEm = p; doiCo() }
      const h = huong()
      bo.buoc(dt, h.dx, h.dy, nay)
      const sc = xoayCanh(bo.canh(nay), xoay)
      for (const s of bo.laySu()) {
        ve?.them(xoaySu(s, xoay), nay, bo.emId, sc)
        if (s.t === 'ha') {
          if (s.boi === bo.emId) themTin(`Em hạ ${bo.ten(s.ai)}!${s.chuoi >= 2 ? ` · Hạ liền ${s.chuoi}` : ''}`, 'ha', nay)
          else if (s.ai === bo.emId) themTin(`${s.boi ? bo.ten(s.boi) : 'Bạn'} hạ em · về bệ sau 1 giây, súng giữ Cấp ${s.capCu}`, 'bi', nay)
        } else if (s.t === 'len' && s.ai === bo.emId) themTin(`${s.xt ? 'Xúc tác! ' : ''}Lên Cấp ${s.cap} · ${NGAN_CAP[s.cap]}`, 'len', nay, { cap: s.cap })
        else if (s.t === 'nhat' && s.ai === bo.emId && s.k === 'kh') themTin('Khiên: chặn 3 viên đạn kế tiếp', '', nay)
        else if (s.t === 'thay') { const ph = bo.pheCua(s.ai); themTin(`${s.ai === bo.emId ? 'Em' : bo.ten(s.ai)} vào thay A.I · Phe ${PHE[ph]}`, 'thay', nay, { phe: ph }) }
        else if (s.t === 'trung' && s.ai === bo.emId && !yeu) { try { navigator.vibrate?.(10) } catch { /* không rung được */ } }
      }
      if (ve) { if (diToi) { const [x, y] = ra(diToi.x, diToi.y, xoay); ve.diToi = { x, y } } else ve.diToi = null; ve.ve(sc, bo.emId, nay, (id) => bo.ten(id)) }
      if (tins.length && nay - tins[0].t > 2200) { tins = tins.filter((x) => nay - x.t <= 2200); setTinDs(tins) }
      const em = bo.em(), con = Math.ceil(bo.con()), ts = bo.tiSo()
      if (em) { const k = `${em.mau}|${em.cap}|${em.e}|${em.ha}|${em.nt}|${em.phe}|${con}|${ts}`; if (k !== khoaHud) { khoaHud = k; setHud({ ...em, con, ts }) } }
      const ds = bo.xep(), k2 = ds.map((d) => `${d.id}.${d.phe}.${d.ha}.${d.cap}`).join(',')
      if (k2 !== khoaXh) { khoaXh = k2; setXh(ds) }
      const kq = bo.ket()
      if (kq && !daKet) { daKet = true; setKet(kq); cb.current.onXong(kq, pheEm) }
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
  const pheEm = hud?.phe ?? bo.pheCua(bo.emId), pheKia = 1 - pheEm
  const ts = hud?.ts ?? [0, 0]
  const giay = Math.max(0, hud?.con ?? 60)
  const can = hud && hud.cap < 5 ? CAN_E[hud.cap] : 0
  const tsKet = ket ? [0, 1].map((p) => ket.filter((d) => d.phe === p).reduce((s, d) => s + d.ha, 0)) : [0, 0]
  const pheThang: number = tsKet[0] === tsKet[1] ? -1 : tsKet[0] > tsKet[1] ? 0 : 1
  const hh = ket ? huyHieu(ket) : null
  const hhEm = hh?.get(bo.emId)
  /** Cột phe: em trước, rồi bạn thật, rồi A.I (KHÔNG theo điểm — không bêu ai đứng chót). */
  const cot = (p: number) => (ket ?? []).filter((d) => d.phe === p).sort((a, b) => Number(b.id === bo.emId) - Number(a.id === bo.emId) || Number(a.ai) - Number(b.ai) || a.id - b.id)

  return <div className="dn-man" ref={goc} role="dialog" aria-modal="true" aria-label="Trận Đấu Nguyên Tử" data-phe-em={pheEm}>
    <div className="dn-khung" ref={khung}>
      <canvas ref={cv} tabIndex={0} aria-label="Sân đấu. Kéo ở bất kỳ đâu để chạy, chạm một điểm để đi tới đó; máy tính: rê chuột trên sân hoặc W A S D. Súng tự ngắm đối thủ gần nhất và tự bắn." onContextMenu={(e) => e.preventDefault()} />
      {khongVe && <div className="dn-loi">Máy này chưa vẽ được sân đấu. Em vẫn chờ thầy bắt đầu bình thường.</div>}
    </div>
    {/* Lớp phủ mỏng ở góc: Rời sân · tỉ số + đồng hồ · ô của em. */}
    <div className="dn-tren">
      <button type="button" className="dn-nut dn-nut-roi" onClick={onRoi} aria-label="Rời sân, về phòng chờ"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>Rời sân</button>
      <div className="dn-ti-so" role="status" aria-label={`Phe ${PHE[pheEm]} ${ts[pheEm]}, Phe ${PHE[pheKia]} ${ts[pheKia]}, còn ${gio(giay)}`}>
        <span className={`dn-ts dn-phe-${pheEm}`}><i aria-hidden="true">{ION_PHE[pheEm]}</i>Phe {PHE[pheEm]}<b className="so">{ts[pheEm]}</b></span>
        <span className="dn-ts-gach" aria-hidden="true">–</span>
        <span className={`dn-ts dn-phe-${pheKia}`}><b className="so">{ts[pheKia]}</b>Phe {PHE[pheKia]}<i aria-hidden="true">{ION_PHE[pheKia]}</i></span>
        <span className="dn-ts-gio so">{gio(giay)}</span>
      </div>
    </div>
    {hud && <div className={`dn-em-o dn-phe-${hud.phe}`}>
      <Hat nt={hud.nt} phe={hud.phe} />
      <div className="dn-em-d1"><b>Em</b><span className="dn-mau" data-it={hud.mau <= 3 ? '' : undefined} aria-hidden="true"><i style={{ transform: `scaleX(${hud.mau / MAU_MAX})` }} /></span><span className="so">Máu {hud.mau}</span></div>
      <div className="dn-em-d2"><em className={`dn-c${hud.cap}`}>Cấp {hud.cap}</em>
        {hud.cap >= 5 ? <span>cao nhất</span> : <span className="dn-e" aria-label={`Electron ${hud.e}/${can}`}>{Array.from({ length: can }, (_, k) => <i key={k} data-co={k < hud.e ? '' : undefined} />)}</span>}
        <span className="so dn-em-ha">Hạ {hud.ha}</span></div>
    </div>}
    <div className="dn-tin" aria-live="polite">{tinDs.map((x) => <div key={x.id} data-k={x.k} className={x.cap ? `dn-c${x.cap}` : x.phe !== undefined ? `dn-phe-${x.phe}` : undefined}>{x.chu}</div>)}</div>
    {matMang >= 0 && <p className="dn-mat-mang" role="status"><i className="dn-cham" aria-hidden="true" />Mất kết nối sân đấu — đang thử lại (lần {matMang + 1})…</p>}
    {hienGoiY && !ket && <div className="dn-goi-y-dau" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 013 0V11m0-1.5a1.5 1.5 0 013 0V11m0-.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L4 14.5a1.5 1.5 0 012.4-1.8L9 15" /></svg><b>Kéo để chạy</b><span>súng tự ngắm, tự bắn</span></div>}
    {nhacXoay && !ket && <p className="dn-nhac-xoay" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M20 9a8 8 0 01-3 8.5M20 9l1.8 2.2M20 9l-2.4 1" /></svg>Xoay ngang điện thoại để chơi to hơn</p>}
    {/* Máy tính (dư chỗ dưới sân): hai cột phe — tên, cấp, số hạ; không đánh số thứ hạng. */}
    <div className="dn-doi" aria-label="Hai phe">
      {[pheEm, pheKia].map((p) => <ul key={p} className={`dn-doi-cot dn-phe-${p}`} aria-label={`Phe ${PHE[p]}`}>
        {xh.filter((d) => d.phe === p).map((d) => <li key={d.id} data-em={d.id === bo.emId ? '' : undefined}><Hat nt={bo.ntCua(d.id)} phe={p} /><span className="t">{ten(d.id)}</span><small>Cấp {d.cap}</small><span className="so k">Hạ {d.ha}</span></li>)}
      </ul>)}
    </div>
    {ket && <><div className="dn-mo" aria-hidden="true" />
      <div className="dn-ket" role="dialog" aria-labelledby="dn-ket-tieu-de">
        <h2 id="dn-ket-tieu-de" className={pheThang >= 0 ? `dn-phe-${pheThang}` : undefined}>{pheThang >= 0 ? <>Phe {PHE[pheThang]} thắng <span className="so">{tsKet[pheThang]} – {tsKet[1 - pheThang]}</span></> : <>Hai phe hoà <span className="so">{tsKet[0]} – {tsKet[1]}</span></>}</h2>
        <p className="dn-ket-em">{pheThang === pheEm ? 'Phe em thắng!' : pheThang < 0 ? 'Hoà — ván sau phân thắng bại nhé.' : 'Sát nút! Ván sau gỡ lại nhé.'}{hhEm ? <> · Em nhận <b>{hhEm.ten}</b></> : null}</p>
        <div className="dn-ket-cot">
          {[pheEm, pheKia].map((p) => <section key={p} className={`dn-cot dn-phe-${p}`} aria-label={`Phe ${PHE[p]}`}>
            <h3><i aria-hidden="true">{ION_PHE[p]}</i>Phe {PHE[p]}<b className="so">{tsKet[p]}</b></h3>
            <ul>{cot(p).map((d) => { const h = hh?.get(d.id); return <li key={d.id} data-em={d.id === bo.emId ? '' : undefined} data-ai={d.ai ? '' : undefined}>
              <Hat nt={d.nt} phe={p} /><span className="t"><b>{ten(d.id)}</b>{h ? <small>{h.ghi}</small> : <small>A.I lấp ghế</small>}</span>
              {h && <span className={`dn-huy dn-huy-${h.k}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z" /></svg>{h.ten}</span>}
            </li> })}</ul>
          </section>)}
        </div>
        <p className="dn-ket-sau">Ván mới sau <b className="so">{nghi}</b> giây · máy chia lại phe cho đều</p>
        <div className="dn-dem" aria-hidden="true"><i ref={demEl} /></div>
        <div className="dn-ket-nut">
          {onPu && <div className="dn-pu" aria-label="Phản ứng nhanh">{PHAN_UNG.map((s, k) => <button type="button" key={s} onClick={() => onPu(k)}>{s}</button>)}</div>}
          <button type="button" className="dn-nut dn-nut-vien" onClick={onRoi}>Về phòng chờ</button>
        </div>
        {pu && <p className="dn-phu" role="status">{pu}</p>}
        <p className="dn-phu">Chỉ để vui, không lưu vào điểm. Ra vào lúc nào cũng được.</p>
      </div></>}
  </div>
}
