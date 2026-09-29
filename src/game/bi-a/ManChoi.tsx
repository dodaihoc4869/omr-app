// BI-A PHẢN ỨNG · MÀN CHƠI (đặc tả 8.3–8.8; bản vẽ docs/ban-ve-bi-a-2809). Ba bố cục theo kích thước khung (dọc · ngang · máy tính),
// nút Toàn màn hình (chỉ còn bàn), nhãn chỉ bi, âm thanh mô phỏng, tấm câu chấm ở máy chủ, sai là sang lượt ngay, Xem lại câu sai lúc chờ lượt.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { KeyboardEvent as KE, PointerEvent as PE } from 'react'
import { AmThanhBia } from './am-thanh'
import { doiCauBia, doiCauBiaMang, ketVanBia } from './api'
import { chonBoCuc, panTheoMan, raMan, tinhKhungBan, toaDoBan, type BoCuc, type KhungBan } from './bo-cuc'
import { VanBia, type CauBia, type KetThucVan, type LoaiVan, type YeuCauCau } from './dieu-khien'
import { CAU_NHAN, VanMang, type GoiTT, type KenhVan, type LoaiMang } from './dieu-khien-mang'
import { GIAY_CU, TEN_MUC, hangMuc, quanHe, tiepTheo, type CheDo } from './luat'
import { CHOT, KL, MAU_QH, NHOM, NT, PK, TEN_PHE, mauCss, type KiHieu } from './nguyen-to'
import TamCauBia from './TamCauBia'
import XemLaiCauSai, { type CauSai } from './XemLaiCauSai'
import { R } from './vat-ly'
import { dangCheDoMayYeu } from '../../lib/may-yeu'
import { CongTacMatThan, useLuonMatThan } from './mat-than-luon'
import { BoVe } from './ve-ban'
import './bi-a.css'

export interface ManChoiProps {
  token: string
  tenEm: string
  van: string
  session: string | null
  cheDo: CheDo
  loai: LoaiVan
  cauEm: readonly CauBia[]
  chot: CauBia | null
  onVeSanh: () => void
  onChoiLai: () => void
  /** Ván online (GĐ2): phòng đấu là quyền quyết; màn chơi nhận `VanMang` qua `onVan` để nguồn tin phòng đẩy gói vào. */
  mang?: MangManChoi
}
export interface MangManChoi { kenh: KenhVan; em: number; dau: GoiTT; cauTheoBi: Partial<Record<KiHieu, CauBia>>; loaiMang: LoaiMang; onVan: (v: VanMang) => void; noiLai?: () => void }
const ICON = {
  sau: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>,
  truoc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>,
  toan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>,
  thoat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>,
  mat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
}
function IconAm({ tat }: { tat: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z" />{tat ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}</svg>
}
const DK_TOA = 2 * Math.PI * 21

/** Nhãn chỉ bi (đặc tả 3.11): kí hiệu, tên, Z; quan hệ với em; một dòng phụ. Bi người khác KHÔNG lộ dạng câu. */
export function noiDungNhan(v: VanBia, id: KiHieu): { qh: ReturnType<typeof quanHe>; tieuDe: string; chinh: string; nho: string } {
  const n = NT[id], qh = quanHe(id, v.em, v.ghe, v.bi), s = v.bi[id]
  let chinh = '', nho = ''
  if (qh === 'chot') { chinh = 'Bi chốt'; nho = v.conLai(v.ghe[v.em]!.doi) ? 'Phe em ăn đủ 7 bi mới được đánh' : 'Phe em đánh Bi chốt được rồi' }
  else if (qh === 'em') { const q = v.cauCua[id]; chinh = s.an ? 'Bi của em · đã ăn' : s.vang ? 'Bi của em · bi vàng' : 'Bi của em'; nho = s.trong || !q ? 'Bi trống · vào lỗ là ăn' : `${q.tenDang} · ${TEN_MUC[hangMuc(q.mucDo)]} · ${v.diemBi(id)} điểm` }
  else if (qh === 'dong-doi') { chinh = `Bi của đồng đội ${v.ghe[s.chu]!.ngan}`; nho = 'Cùng phe · vào lỗ thì đồng đội trả lời' }
  else { chinh = v.cheDo === 'doi' ? `Bi của đối thủ ${v.ghe[s.chu]!.ngan}` : 'Bi của đối thủ'; nho = v.isBreak ? 'Phá bàn: chạm bi nào trước cũng được' : 'Chạm bi này trước là phạm luật' }
  return { qh, tieuDe: `${n.ten} · Z = ${n.z}`, chinh, nho }
}

export default function ManChoi({ token, tenEm, van, session, cheDo, loai, cauEm, chot, onVeSanh, onChoiLai, mang }: ManChoiProps) {
  const rootRef = useRef<HTMLDivElement>(null), banRef = useRef<HTMLDivElement>(null), cvRef = useRef<HTMLCanvasElement>(null)
  const nhanRef = useRef<HTMLDivElement>(null), nhamRef = useRef<HTMLDivElement>(null), chipRef = useRef<HTMLSpanElement>(null), lucRef = useRef<HTMLDivElement>(null)
  const amRef = useRef<AmThanhBia | null>(null)
  if (!amRef.current) amRef.current = new AmThanhBia()
  const am = amRef.current
  const khungRef = useRef<KhungBan | null>(null), dprRef = useRef(1)
  const boVeRef = useRef<BoVe | null>(null)
  const [sheet, setSheet] = useState<YeuCauCau | null>(null)
  const [ket, setKet] = useState<KetThucVan | null>(null)
  const pan = (x?: number, y?: number) => (x == null || y == null || !khungRef.current ? 0 : panTheoMan(khungRef.current, x, y))
  const [v] = useState<VanBia>(() => {
    const sk = {
      moCau: (y: YeuCauCau) => setSheet(y),
      am: (k: Parameters<VanBia['sk']['am']>[0], sp?: number, x?: number, y?: number) => am.phat(k, sp ?? 0, pan(x, y)),
      gomVa: (k: 'bi' | 'bang', sp: number, x: number, y: number, kho?: boolean) => am.gom(k, sp, pan(x, y), kho),
      ketThuc: (k: KetThucVan) => setKet(k),
    }
    return mang ? new VanMang({ cheDo, loaiMang: mang.loaiMang, tenEm, chot, em: mang.em, cauTheoBi: mang.cauTheoBi }, sk, mang.kenh, mang.dau) : new VanBia({ cheDo, loai, tenEm, cauEm, chot }, sk)
  })
  const vm = v instanceof VanMang ? v : null
  const [luonMT] = useLuonMatThan()
  v.luonMT = luonMT // công tắc theo máy: đọc mỗi lần vẽ React; vòng khung hình đọc thẳng `v.luonMT`
  useEffect(() => { if (vm && mang) mang.onVan(vm) }, [vm]) // eslint-disable-line react-hooks/exhaustive-deps
  const [moNhan, setMoNhan] = useState(false)
  useSyncExternalStore(useCallback((fn: () => void) => v.dangKy(fn), [v]), () => v.phienBan)
  const [boCuc, setBoCuc] = useState<BoCuc>('doc')
  const [toan, setToan] = useState(false)
  const [huong, setHuong] = useState<'ngang' | 'doc'>('doc')
  const [moGia, setMoGia] = useState(false)
  const [popXoay, setPopXoay] = useState(false)
  const [cauSai, setCauSai] = useState<CauSai[]>([])
  const [xem, setXem] = useState(false)
  const [hoiRoi, setHoiRoi] = useState(false)
  const [tat, setTat] = useState(am.tat)
  const [tin, setTin] = useState<{ ma: number; hien: boolean }>({ ma: 0, hien: false })
  const [theLucSau, setTheLucSau] = useState<{ con: number; tong: number } | null>(null)
  const chiRef = useRef<{ id: KiHieu; den: number; tro?: boolean } | null>(null)
  const keoRef = useRef<{ nham: boolean; bi: boolean }>({ nham: false, bi: false })
  const lucKeo = useRef<{ x: number; y: number } | null>(null)
  const spaceRef = useRef<number | null>(null)
  const [luc, setLucHien] = useState(0)
  /** Vẽ ngay một khung (gọi đồng bộ sau khi đổi cỡ canvas: đặt width/height xoá trắng canvas, không vẽ lại ngay ⇒ trình duyệt kịp hiện một khung trống). */
  const veNgayRef = useRef<() => void>(() => {})

  // ───────── vòng khung hình ─────────
  useEffect(() => {
    // MỘT requestAnimationFrame duy nhất: vật lý bước cố định (bộ tích luỹ trong VanBia, dt kẹp 50 ms khi tab chậm),
    // vẽ nội suy giữa hai bước; không setState mỗi khung (trừ thanh lực khi giữ Space).
    let raf = 0, truoc = performance.now(), nhamCu = '', chipCu = '', ctx: CanvasRenderingContext2D | null = null
    const veBan = (now: number) => {
      const cv = cvRef.current, k = khungRef.current, bv = boVeRef.current
      if (cv && (!ctx || ctx.canvas !== cv)) ctx = cv.getContext('2d')
      const c = chiRef.current, conChi = c && (!c.den || now < c.den) ? c : null
      if (c && c.den && now >= c.den) chiRef.current = null
      if (ctx && k && bv) bv.ve(ctx, v, conChi && !v.sheet && !xemRef.current ? { id: conChi.id, qh: quanHe(conChi.id, v.em, v.ghe, v.bi) } : null, loai !== 'giao_huu', keoRef.current.bi)
      return conChi
    }
    veNgayRef.current = () => { veBan(performance.now()) }
    const khung = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, now - truoc) / 1000); truoc = now
      if (spaceRef.current !== null && v.pha === 'aim') { const p = Math.min(1, (now - spaceRef.current) / 1400); v.datLuc(p); setLucHien(p) }
      v.buoc(dt)
      am.xa()
      const cv = cvRef.current, k = khungRef.current
      const conChi = veBan(now)
      // vòng đồng hồ quanh ảnh ghế đang đánh
      const goc = rootRef.current
      if (goc) {
        v.ghe.forEach((g, i) => {
          const el = goc.querySelector<SVGCircleElement>(`[data-ghe="${i}"] .vong`)
          if (!el) return
          const kk = i === v.cur && v.pha === 'aim' && !g.ai && !v.sheet ? v.time / GIAY_CU : (i === v.cur && v.pha !== 'over' ? 1 : 0)
          el.style.strokeDasharray = String(DK_TOA); el.style.strokeDashoffset = String(DK_TOA * (1 - kk))
        })
      }
      // nhãn chỉ bi
      const nh = nhanRef.current
      if (nh && cv && k) {
        const b = conChi && !v.sheet && !xemRef.current ? v.bi_(conChi.id) : null
        if (!b || !b.on || !conChi) { if (!nh.hidden) nh.hidden = true }
        else {
          const nd = noiDungNhan(v, conChi.id), key = `${conChi.id}|${nd.chinh}|${nd.nho}`
          if (nh.dataset.k !== key) {
            nh.dataset.k = key
            nh.style.setProperty('--vien', MAU_QH[nd.qh])
            nh.replaceChildren()
            const tb = document.createElement('b'); tb.textContent = conChi.id
            const em = document.createElement('em'); em.textContent = nd.chinh
            const sm = document.createElement('small'); sm.textContent = nd.nho
            nh.append(tb, document.createTextNode(nd.tieuDe), em, sm)
          }
          const [px, py] = raMan(k, dprRef.current, b.x, b.y), x0 = cv.offsetLeft + px / dprRef.current, y0 = cv.offsetTop + py / dprRef.current, rr = R * k.S
          nh.hidden = false
          const w = nh.offsetWidth, h = nh.offsetHeight, W0 = banRef.current?.clientWidth ?? 0
          let top = y0 - rr - 8, duoi = false
          if (top - h < 4) { top = y0 + rr + 8; duoi = true }
          if (duoi) nh.setAttribute('data-duoi', ''); else nh.removeAttribute('data-duoi')
          nh.style.left = `${Math.max(w / 2 + 4, Math.min(W0 - w / 2 - 4, x0))}px`; nh.style.top = `${top}px`
        }
      }
      // dòng "Đang nhắm" (màn dọc) — chỉ ghi khi đổi
      const nm = nhamRef.current
      if (nm) {
        const nguoi = v.pha === 'aim' && !v.ghe[v.cur]!.ai && !v.sheet
        const info = nguoi ? v.nham() : null
        let key = '', chu = '', hl = '', dep = false, mau = '', soc = false
        if (nguoi && info && info.loai === 'bi') {
          const id = info.b.id, ok = v.hopLe(id), qh = quanHe(id, v.em, v.ghe, v.bi)
          key = `${id}|${ok}|${v.matThan}|${v.bi[id].vang}`; mau = mauCss(id); soc = NT[id].nhom === 'pk'; dep = ok
          if (id === CHOT) { chu = 'Đang nhắm: Bi chốt C · carbon'; hl = ok ? 'đánh được' : 'chưa được chạm' }
          else if (qh === 'em') { const q = v.cauCua[id]; chu = q ? `${id} · ${q.tenDang} · ${TEN_MUC[hangMuc(q.mucDo)]} · ${v.diemBi(id)} điểm` : `${id} · ${NT[id].ten} · bi trống`; hl = v.bi[id].vang ? 'bi vàng của em' : 'bi của em' }
          else if (qh === 'dong-doi') { chu = `${id} · ${NT[id].ten} · của đồng đội ${v.ghe[v.bi[id].chu]!.ngan}`; hl = 'cùng phe' }
          else { chu = `${id} · ${NT[id].ten} · của đối thủ`; hl = v.isBreak ? 'phá bàn' : 'chạm trước là phạm luật' }
          if (v.matThan > 0 && loai !== 'giao_huu') hl += ' · Mắt thần'
        } else if (nguoi) { key = 'none' + v.ballInHand; chu = v.ballInHand ? 'Kéo bi cái để đặt, chạm bàn để nhắm' : 'Chạm hoặc kéo trên bàn để nhắm' }
        else { key = `cho-${v.pha}${v.cur}${!!v.sheet}`; chu = v.sheet ? 'Em đang trả lời câu hỏi' : v.pha === 'moving' ? 'Bi đang lăn…' : v.pha === 'over' ? 'Hết ván' : v.ghe[v.cur]!.ai ? `${v.ghe[v.cur]!.ten} đang đánh${loai !== 'giao_huu' ? ' · em giải trước được' : ''}` : 'Chờ lượt' }
        if (key !== nhamCu) {
          nhamCu = key
          const bn = nm.querySelector<HTMLElement>('.bi-nho'), cc = nm.querySelector<HTMLElement>('.chu'), hh = nm.querySelector<HTMLElement>('.hl')
          if (bn) { bn.style.setProperty('--c', mau || 'transparent'); if (soc) bn.setAttribute('data-soc', ''); else bn.removeAttribute('data-soc') }
          if (cc) cc.textContent = chu
          if (hh) { hh.textContent = hl; hh.toggleAttribute('data-dep', !!hl && dep); hh.toggleAttribute('data-xau', !!hl && !dep) }
        }
      }
      // chip toàn màn hình
      const ch = chipRef.current
      if (ch) {
        const me = v.ghe[v.cur]!
        const hep = ch.parentElement ? ch.parentElement.clientWidth < 480 : false // màn dọc hẹp: rút gọn để không cắt chữ
        const s = (v.pha === 'over' ? 'Hết ván' : me.ai ? `Lượt ${me.ngan}` : `Lượt em · ${Math.max(0, Math.ceil(v.time))} giây`) + (hep ? ` · ${v.diem[0]} : ${v.diem[1]}` : ` · Kim loại ${v.diem[0]} : ${v.diem[1]} Phi kim`) + (v.matThan && loai !== 'giao_huu' ? ` · Mắt thần ${v.matThan}` : '')
        if (s !== chipCu) { chipCu = s; ch.textContent = s }
      }
      raf = requestAnimationFrame(khung)
    }
    raf = requestAnimationFrame(khung)
    return () => { cancelAnimationFrame(raf); veNgayRef.current = () => {} }
  }, [v, am, loai])
  useEffect(() => () => { v.huy(); am.dong() }, [v, am])
  // Trang xem thử / kiểm tự động (chỉ bản dev, không vào bản build): điều khiển ván từ bên ngoài.
  useEffect(() => { if (import.meta.env.DEV) (window as unknown as { __biaVan?: VanBia }).__biaVan = v }, [v])
  const xemRef = useRef(false); xemRef.current = xem

  // ───────── cỡ khung + bố cục ─────────
  useEffect(() => {
    const goc = rootRef.current, ban = banRef.current, cv = cvRef.current
    if (!goc || !ban || !cv) return
    if (!boVeRef.current) boVeRef.current = new BoVe(document)
    const doBoCuc = () => { const r = goc.getBoundingClientRect(); setBoCuc(chonBoCuc(r.width, r.height)); setHuong(r.width > r.height ? 'ngang' : 'doc') }
    const doBan = () => {
      const cs = getComputedStyle(ban)
      const bw = ban.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0')
      const bh = ban.clientHeight - parseFloat(cs.paddingTop || '0') - parseFloat(cs.paddingBottom || '0')
      if (bw <= 0 || bh <= 0) return
      // Hướng bàn chốt theo KHUNG NHÌN (máy dọc ⇒ bàn dọc), không theo phần dư của hộp bàn (dao động khi chữ quanh bàn xuống dòng).
      const r = goc.getBoundingClientRect(), cu = khungRef.current
      const nhe = dangCheDoMayYeu()
      const k = tinhKhungBan(bw, bh, { khungDoc: r.width <= r.height, xoayCu: cu?.xoay })
      const dpr = Math.min(nhe ? 1.5 : 2, window.devicePixelRatio || 1)
      const w = Math.round(k.cw * dpr), h = Math.round(k.ch * dpr)
      // Chỉ đặt lại width/height khi cỡ THẬT đổi (đặt lại là xoá canvas + vẽ lại nền, ảnh bi).
      if (cu && cu.xoay === k.xoay && cv.width === w && cv.height === h && dpr === dprRef.current && nhe === boVeRef.current!.nhe) return
      khungRef.current = k; dprRef.current = dpr
      cv.style.width = `${k.cw}px`; cv.style.height = `${k.ch}px`; cv.style.borderRadius = `${22 * k.S}px`
      if (cv.width !== w) cv.width = w
      if (cv.height !== h) cv.height = h
      boVeRef.current!.datCo(k, dpr, nhe)
      veNgayRef.current() // vẽ lại NGAY trong cùng khung ⇒ không lộ canvas trắng
    }
    doBoCuc(); doBan()
    const ro1 = new ResizeObserver(doBoCuc), ro2 = new ResizeObserver(doBan)
    ro1.observe(goc); ro2.observe(ban)
    void document.fonts?.ready?.then(() => boVeRef.current?.napLaiChu())
    return () => { ro1.disconnect(); ro2.disconnect() }
  }, [])
  const dk = toan ? (huong === 'ngang' ? 'trai' : undefined) : boCuc === 'pc' ? 'trai' : boCuc === 'ngang' ? 'phai' : undefined

  // ───────── toàn màn hình ─────────
  const datToan = (bat: boolean) => {
    setToan(bat); if (!bat) setMoGia(false)
    const goc = rootRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null
    try {
      if (bat && goc && !document.fullscreenElement) { const r = goc.requestFullscreen ? goc.requestFullscreen({ navigationUI: 'hide' }) : (goc.webkitRequestFullscreen?.(), undefined); r?.catch?.(() => {}) }
      if (!bat && document.fullscreenElement) void document.exitFullscreen?.().catch(() => {})
    } catch { /* trình duyệt chặn: vẫn ẩn phần điều khiển (phủ cả cửa sổ) */ }
    if (bat) v.nhac('Toàn màn hình', 'Chỉ còn bàn bi-a · Esc hoặc nút Thoát để ra', 1500)
  }
  useEffect(() => {
    const f = () => { if (!document.fullscreenElement) setToan(false) }
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])

  // ───────── thông báo trên bàn ─────────
  const tb = v.thongBao
  useEffect(() => {
    if (!tb) return
    setTin({ ma: tb.ma, hien: true })
    const h = setTimeout(() => setTin((t) => (t.ma === tb.ma ? { ...t, hien: false } : t)), tb.ms)
    return () => clearTimeout(h)
  }, [tb?.ma]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────── tới lượt em, hoặc có câu em phải trả lời (đồng đội đánh bi của em vào lỗ) ⇒ tự đóng Xem lại câu sai ─────────
  useEffect(() => {
    if (xem && sheet) { setXem(false); v.datXemMo(false); return }
    if (xem && v.cur === v.em && v.pha === 'aim') { setXem(false); v.datXemMo(false); v.nhac('Tới lượt em', 'Câu sai vẫn xem lại được khi chờ lượt', 1500) }
  })

  // ───────── kết thúc ván: ghi máy chủ ─────────
  useEffect(() => {
    if (!ket || vm) return // ván online: phòng đấu tự ghi kết thúc + Điểm bàn
    const emDoi = v.ghe[v.em]!.doi
    void ketVanBia(token, van, { doiThang: ket.doiThang, diem: ket.diem, lyDo: ket.doiThang === emDoi ? 'thang' : 'thua' }, v.tomTatGhe().map((g) => ({ ghe: g.ghe, doi: g.doi, ai: g.ai, dung: g.dung, sai: g.sai, an: g.an, vang: g.vang })), v.soCu)
      .then((r) => setTheLucSau(r.theLuc)).catch(() => {})
  }, [ket]) // eslint-disable-line react-hooks/exhaustive-deps
  const roiVan = () => {
    if (vm) { vm.boVan(); if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {}); onVeSanh(); return }
    void ketVanBia(token, van, { doiThang: null, diem: v.diem, lyDo: 'bo' }, v.tomTatGhe().map((g) => ({ ghe: g.ghe, doi: g.doi, ai: g.ai, dung: g.dung, sai: g.sai, an: g.an, vang: g.vang })), v.soCu).catch(() => {})
    if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {})
    onVeSanh()
  }

  // ───────── nhập liệu trên bàn ─────────
  const toaDo = (e: { clientX: number; clientY: number }) => {
    const cv = cvRef.current!, k = khungRef.current!
    const r = cv.getBoundingClientRect(), f = r.width ? cv.clientWidth / r.width : 1
    return toaDoBan(k, (e.clientX - r.left) * f, (e.clientY - r.top) * f)
  }
  const biTai = (p: { x: number; y: number }): KiHieu | null => {
    let best: KiHieu | null = null, bd = (R + 6) * (R + 6)
    for (const b of v.st.balls) { if (!b.on || b.id === 'cue') continue; const d = (b.x - p.x) ** 2 + (b.y - p.y) ** 2; if (d < bd) { bd = d; best = b.id } }
    return best
  }
  const chiDich = () => { const info = v.nham(); if (info && info.loai === 'bi') chiRef.current = { id: info.b.id, den: performance.now() + 1200 } }
  const onDown = (e: PE<HTMLCanvasElement>) => {
    am.mo(); rootRef.current?.focus({ preventScroll: true })
    if (!khungRef.current) return
    const p = toaDo(e), b = biTai(p)
    if (b) chiRef.current = { id: b, den: performance.now() + 1800 }
    if (!v.nguoiDuocDanh()) return
    const c = v.bi_('cue')
    if (v.ballInHand && Math.hypot(p.x - c.x, p.y - c.y) < R * 2.4) keoRef.current.bi = true
    else { keoRef.current.nham = true; v.nhamToi(p); chiDich() }
    e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault()
  }
  const onMove = (e: PE<HTMLCanvasElement>) => {
    if (!khungRef.current) return
    const p = toaDo(e)
    if (e.pointerType === 'mouse' && !e.buttons && !keoRef.current.nham && !keoRef.current.bi) {
      const b = biTai(p)
      if (b) chiRef.current = { id: b, den: 0, tro: true }
      else if (chiRef.current?.tro) chiRef.current = null
    }
    if (!v.nguoiDuocDanh()) return
    if (keoRef.current.bi) v.keoBiCai(p.x, p.y)
    else if (keoRef.current.nham) { v.nhamToi(p); chiDich() }
  }
  const onUp = () => { if (keoRef.current.bi) { const c = v.bi_('cue'); am.phat('dat', 0, pan(c.x, c.y)) } keoRef.current = { nham: false, bi: false } }
  const onLeave = () => { if (chiRef.current?.tro) chiRef.current = null }

  // ───────── thanh lực ─────────
  const datLuc = (p: number) => { v.datLuc(p); setLucHien(p) }
  const lucDown = (e: PE<HTMLDivElement>) => { am.mo(); if (!v.nguoiDuocDanh()) return; lucKeo.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }
  const lucMove = (e: PE<HTMLDivElement>) => {
    if (!lucKeo.current) return
    const el = e.currentTarget, r = el.getBoundingClientRect(), doc = r.height > r.width * 1.3, ty = el.clientWidth ? r.width / el.clientWidth : 1
    const d = doc ? e.clientY - lucKeo.current.y : Math.max(e.clientX - lucKeo.current.x, (e.clientY - lucKeo.current.y) * 1.2)
    const L = doc ? r.height * 0.85 : Math.min(240 * ty, r.width * 0.9)
    datLuc(Math.max(0, Math.min(1, d / L)))
  }
  const lucUp = () => { if (!lucKeo.current) return; lucKeo.current = null; if (v.power >= 0.02) v.ban(); datLuc(0) }
  const giuNut = (fn: () => void) => {
    let t: ReturnType<typeof setTimeout> | null = null, h: ReturnType<typeof setInterval> | null = null
    const dung = () => { if (t) clearTimeout(t); if (h) clearInterval(h); t = h = null }
    return {
      onPointerDown: (e: PE<HTMLButtonElement>) => { am.mo(); if (!v.nguoiDuocDanh()) return; fn(); t = setTimeout(() => { h = setInterval(fn, 45) }, 320); e.preventDefault() },
      onPointerUp: dung, onPointerLeave: dung, onPointerCancel: dung,
      onKeyDown: (e: KE<HTMLButtonElement>) => { if ((e.key === 'Enter' || e.key === ' ') && v.nguoiDuocDanh()) { fn(); e.preventDefault() } },
    }
  }
  const nutTrai = giuNut(() => { v.xoayNham(-0.3); chiDich() }), nutPhai = giuNut(() => { v.xoayNham(0.3); chiDich() })
  const chonXoay = (e: PE<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    v.datXoay((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1))
  }

  // ───────── bàn phím (máy tính) ─────────
  const onKey = (e: KE<HTMLDivElement>) => {
    am.mo()
    if (e.key === 'Escape') { if (popXoay) { setPopXoay(false); return } if (xem) { setXem(false); v.datXemMo(false); return } if (toan) { datToan(false); return } }
    const t = e.target as HTMLElement
    if (t.closest('.bia-tam,.bia-ket,input,textarea')) return
    if (e.key === 'f' || e.key === 'F') { datToan(!toan); e.preventDefault(); return }
    if (e.key === 'm' || e.key === 'M') { am.datTat(!tat); setTat(!tat); return }
    if (!v.nguoiDuocDanh()) return
    if (e.key === 'ArrowLeft') { v.xoayNham(e.shiftKey ? -0.1 : -0.6); chiDich(); e.preventDefault() }
    else if (e.key === 'ArrowRight') { v.xoayNham(e.shiftKey ? 0.1 : 0.6); chiDich(); e.preventDefault() }
    else if (e.key === ' ' && !t.closest('button')) { e.preventDefault(); if (spaceRef.current === null) spaceRef.current = performance.now() }
  }
  const onKeyUp = (e: KE<HTMLDivElement>) => { if (e.key === ' ' && spaceRef.current !== null) { spaceRef.current = null; if (v.power >= 0.02) v.ban(); datLuc(0) } }

  // ───────── tấm câu ─────────
  const onCham = (y: YeuCauCau, dung: boolean, ph: CauSai['phanHoi'] | null, traLoi: string) => {
    v.xongCau(y.ma, dung, false, dung || ph !== null)
    if (!dung && ph) {
      setCauSai((ds) => [...ds, { y, phanHoi: ph, traLoi }])
      const ki = y.mode === 'chot' ? CHOT : y.id
      if (session && vm) void doiCauBiaMang(token, session, y.cau.qid, y.mode === 'chot', ki).then((r) => vm.doiCauMang(ki, r.cau, r.ve)).catch(() => {})
      else if (session) void doiCauBia(token, session, y.cau.qid, y.mode === 'chot').then((c) => v.doiCau(ki, c)).catch(() => {})
    }
  }
  const onDongCau = (y: YeuCauCau, dung: boolean) => { v.xongCau(y.ma, dung, true); setSheet(null) }
  const moXem = () => { setXem(true); v.datXemMo(true); am.phat('mo') }
  const giaiTruoc = (id: KiHieu) => {
    am.mo()
    const r = v.giaiTruoc(id)
    if (r === 'mo') { setMoGia(false); return }
    const q = v.cauCua[id]
    v.nhac(r === 'da_an' ? `Bi ${id} đã ăn` : r === 'vang' ? `Bi ${id} là bi vàng` : r === 'trong' ? `Bi ${id} là bi trống` : `Bi ${id}${q ? ` · ${q.tenDang}` : ''}`, r === 'vang' ? 'Vào lỗ là ăn ngay' : r === 'trong' ? 'Không có câu · vào lỗ là ăn' : r === 'chua_duoc' ? 'Giải trước được khi tới lượt người khác' : '')
  }

  // ───────── dữ liệu vẽ HUD ─────────
  const biEm = v.biEm()
  const moGiai = v.coTheGiaiTruoc()
  const hienXemSai = cauSai.length > 0 && !sheet && !xem && v.pha !== 'over' && (v.cur !== v.em || v.pha === 'cho')
  const doi = cheDo === 'doi'
  const theGhe = (t: 0 | 1) => {
    const ds = v.ghe.map((g, i) => ({ g, i })).filter((o) => o.g.doi === t)
    return (
      <div className="bia-phe" data-phai={t ? '' : undefined} data-dang={v.pha !== 'over' && v.ghe[v.cur]!.doi === t ? '' : undefined} data-doi={doi ? '' : undefined}>
        {doi && <span className="bia-ten-phe">{TEN_PHE[t]}</span>}
        <div className="bia-ghe-hang">
          {ds.map((o) => (
            <div className="bia-ghe" key={o.i} data-ghe={o.i} data-roi={vm?.roiGhe[o.i] ? '' : undefined}>
              {vm && vm.nhanDen.filter((n) => n.tu === o.i).slice(-1).map((n) => <span key={n.ma} className="bia-bong-nhan" role="status">{CAU_NHAN[n.id - 1]}</span>)}
              <span className="bia-anh"><svg viewBox="0 0 46 46" aria-hidden="true"><circle className="nen-vong" cx="23" cy="23" r="21" /><circle className="vong" cx="23" cy="23" r="21" /></svg><span>{o.g.tat}</span></span>
              {doi ? <span className="bia-ghe-ten">{o.g.ngan}{vm?.roiGhe[o.i] ? ' · đang nối lại' : ''}</span> : <span className="bia-ghe-chu"><span className="bia-ghe-ten">{o.g.ten}</span><span className="bia-ten-phe">{vm?.roiGhe[o.i] ? 'Đang nối lại…' : TEN_PHE[t]}</span></span>}
            </div>
          ))}
        </div>
        <div className="bia-cham" aria-label={`${TEN_PHE[t]} còn ${v.conLai(t)} bi`}>
          {NHOM[t]!.map((id) => { const s = v.bi[id]; return <i key={id} title={id} style={{ ['--c' as string]: mauCss(id) }} data-kl={t ? undefined : ''} data-soc={t ? '' : undefined} data-an={s.an ? '' : undefined} data-vang={s.vang && !s.an ? '' : undefined} /> })}
        </div>
      </div>
    )
  }
  const tenLuot = v.ghe[v.cur]!.ten
  const tbHien = tb && tin.ma === tb.ma && tin.hien
  const tk = v.tomTatGhe()
  return (
    <div ref={rootRef} className="bia" data-bo-cuc={boCuc} data-dk={dk} data-toan={toan ? '' : undefined} data-mo-gia={moGia ? '' : undefined} tabIndex={-1} onKeyDown={onKey} onKeyUp={onKeyUp} onPointerDownCapture={() => am.mo()}>
      <div className="bia-man">
        <header className="bia-dau">
          <button type="button" className="bia-nut-kinh" onClick={() => (ket ? onVeSanh() : setHoiRoi(true))} aria-label="Về Sảnh Bi-a">{ICON.sau}<span className="bia-chu-nut">Sảnh</span></button>
          <div className="bia-ten"><b>Bi-a Phản Ứng</b><span>{vm ? (vm.loaiMang === 'giao_huu' ? 'Bàn giao hữu với bạn · không câu' : doi ? 'Đánh đôi với bạn' : 'Đấu với bạn') : loai === 'giao_huu' ? 'Bàn giao hữu · không câu' : doi ? 'Đánh đôi với A.I' : 'Đấu với A.I'}</span></div>
          <button type="button" className="bia-nut-kinh" onClick={() => datToan(true)} aria-label="Toàn màn hình: chỉ hiện bàn bi-a" title="Toàn màn hình (phím F)">{ICON.toan}</button>
          <button type="button" className="bia-nut-kinh" aria-pressed={!tat} aria-label={tat ? 'Bật âm thanh' : 'Tắt âm thanh'} title="Âm thanh (phím M)" onClick={() => { am.datTat(!tat); setTat(!tat) }}><IconAm tat={tat} /></button>
        </header>
        <div className="bia-toan-tren">
          {loai !== 'giao_huu' && <button type="button" className="bia-nut-kinh bia-nut-bi-em" aria-expanded={moGia} onClick={() => setMoGia(!moGia)}>Bi của em</button>}
          <span className="bia-chip" ref={chipRef} />
          <button type="button" className="bia-nut-kinh bia-nut-thoat" aria-label="Thoát toàn màn hình" onClick={() => datToan(false)}>{ICON.thoat}<span className="bia-chu-nut">Thoát</span></button>
        </div>
        <section className="bia-nguoi" aria-label="Hai phe">
          {theGhe(0)}
          <div className="bia-ti-so"><b><span>{v.diem[0]}</span> : <span>{v.diem[1]}</span></b><span>điểm ván</span></div>
          {theGhe(1)}
        </section>
        <section className="bia-gia" aria-label="Bi của em">
          <div className="bia-nhan-gia">
            <span><b>Bi của em</b><span className="bia-phu-nhan"> · {loai === 'giao_huu' ? 'bi trống, không câu' : 'mỗi bi một câu'}</span></span>
            <span className="phai"><span className="bia-goi-y">{moGiai ? 'Chạm ô để giải trước' : v.pha === 'over' ? 'Hết ván' : loai === 'giao_huu' ? '' : 'Giải trước khi người khác đánh'}</span>
              {loai !== 'giao_huu' && <span className="bia-mat-than" data-co={v.matThan > 0 ? '' : undefined} aria-label={`Mắt thần: ${v.matThan}. Mỗi cú đánh dùng 1 để thấy trước đường đi thật của bi`} title="Mắt thần">{ICON.mat}<span>{v.matThan}</span></span>}<CongTacMatThan gon /></span>
          </div>
          <div className="bia-hang-o">
            {biEm.map((id) => {
              const s = v.bi[id], q = v.cauCua[id], tt = s.an ? 'đã ăn' : s.vang ? 'bi vàng' : s.trong ? 'bi trống' : moGiai ? 'chạm để giải trước' : 'chưa giải'
              return <button key={id} type="button" className="bia-o" style={{ ['--c' as string]: mauCss(id) }} data-an={s.an ? '' : undefined} data-vang={s.vang && !s.an ? '' : undefined} data-trong={s.trong && !s.an ? '' : undefined} data-moi={moGiai && !s.an && !s.vang && !s.trong ? '' : undefined}
                aria-label={`Bi ${id} ${NT[id].ten}${q ? `: ${q.tenDang}, ${TEN_MUC[hangMuc(q.mucDo)]}` : ''}, ${tt}`} onClick={() => giaiTruoc(id)}><span className="z">{NT[id].z}</span><span className="kh">{id}</span></button>
            })}
          </div>
          <div className="bia-nhat-ky"><b>Diễn biến ván</b><ol>{v.nhatKy.map((d) => <li key={d.ma} data-loai={d.loai || undefined}><time>{Math.floor(d.giay / 60)}:{String(d.giay % 60).padStart(2, '0')}</time><span>{d.chu}</span></li>)}</ol></div>
          <div className="bia-phim-tat"><b>Phím tắt</b><span><kbd>←</kbd><kbd>→</kbd> nhắm · giữ <kbd>Shift</kbd> để nhắm tinh</span><span>Giữ <kbd>Space</kbd> lấy lực, thả để đánh</span><span><kbd>F</kbd> toàn màn hình · <kbd>M</kbd> âm thanh</span></div>
        </section>
        <section className="bia-ban" ref={banRef}>
          <canvas ref={cvRef} role="img" aria-label={`Bàn bi-a: 7 bi Kim loại (${KL.join(', ')}), 7 bi Phi kim (${PK.join(', ')}), Bi chốt carbon và bi cái`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onLeave} />
          <div className="bia-pt" aria-live="polite">{v.ptHop.map((p) => <div key={p.ma}>{p.chu}</div>)}</div>
          <div className="bia-tin" role="status" data-hien={tbHien ? '' : undefined} data-loai={tb?.loai || undefined}>{tb?.chu}{tb?.phu && <small>{tb.phu}</small>}</div>
          <div className="bia-nhan" ref={nhanRef} hidden />
          {hienXemSai && <button type="button" className="bia-xem-sai" onClick={moXem}>Xem lại câu sai <b>{cauSai.length}</b></button>}
          {vm && vm.trangThaiNoi !== 'noi' && vm.trangThaiNoi !== 'dong' && <div className="bia-mat-noi" role="alert">{vm.trangThaiNoi === 'mat' ? 'Mất kết nối quá 60 giây' : 'Mất kết nối · đang nối lại…'}{vm.trangThaiNoi === 'mat' && mang?.noiLai && <button type="button" className="bia-nut-chu" onClick={mang.noiLai}>Nối lại</button>}</div>}
          {vm && !ket && <div className="bia-nhan-nhanh">
            <button type="button" className="bia-nut-kinh" aria-expanded={moNhan} onClick={() => setMoNhan(!moNhan)}>Nhắn</button>
            {moNhan && <div className="bia-pop-nhan" role="menu" aria-label="Câu nhắn soạn sẵn">{CAU_NHAN.map((c, i) => <button key={c} type="button" role="menuitem" className="bia-nut-chu" onClick={() => { vm.guiNhan(i + 1); setMoNhan(false) }}>{c}</button>)}</div>}
          </div>}
        </section>
        <section className="bia-dk" aria-label="Điều khiển cú đánh">
          <div className="bia-nham" ref={nhamRef}><span className="bi-nho" /><span className="chu">Chạm hoặc kéo trên bàn để nhắm</span><span className="hl" /></div>
          <div className="bia-hang-dk">
            <button type="button" className="bia-nut-tron bia-nut-xoay" aria-label="Chọn điểm xoáy bi cái" aria-expanded={popXoay} onClick={() => { const mo = !popXoay; setPopXoay(mo); if (mo) am.phat('phan') }}><span className="bia-mat-bi" style={{ ['--sx' as string]: v.spin.x, ['--sy' as string]: -v.spin.y }}><i /></span></button>
            <button type="button" className="bia-nut-tron bia-trai" aria-label="Xoay hướng nhắm sang trái một chút" {...nutTrai}>{ICON.sau}</button>
            <div className="bia-luc" ref={lucRef} role="slider" tabIndex={0} aria-label="Lực đánh: kéo rồi thả tay để đánh" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(luc * 100)} data-keo={luc > 0 ? '' : undefined} style={{ ['--p' as string]: luc }}
              onPointerDown={lucDown} onPointerMove={lucMove} onPointerUp={lucUp} onPointerCancel={() => { lucKeo.current = null; datLuc(0) }}>
              <div className="day" />
              <div className="chu-luc">{luc > 0 ? <><span className="so-luc">{Math.round(luc * 100)}%</span><span className="dai">thả tay để đánh</span><span className="ngan">thả tay</span></> : <><span className="dai">Kéo sang phải để lấy lực, thả tay để đánh</span><span className="ngan">Kéo<br />xuống</span></>}</div>
            </div>
            <button type="button" className="bia-nut-tron bia-phai" aria-label="Xoay hướng nhắm sang phải một chút" {...nutPhai}>{ICON.truoc}</button>
          </div>
          {popXoay && <div className="bia-pop-xoay">
            <p>Chạm vào bi để chọn điểm đánh. Cao: bi cái chạy theo. Thấp: lùi lại. Trái, phải: dội băng lệch.</p>
            <button type="button" className="bia-bi-lon" aria-label="Điểm xoáy trên bi cái" style={{ ['--sx' as string]: v.spin.x, ['--sy' as string]: -v.spin.y }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); chonXoay(e) }} onPointerMove={(e) => { if (e.buttons) chonXoay(e) }}><i /></button>
            <button type="button" className="bia-nut-chu" onClick={() => v.datXoay(0, 0)}>Bỏ xoáy</button>
          </div>}
        </section>
        {sheet && session && <TamCauBia key={sheet.ma} y={sheet} token={token} session={session} laEmDanh={sheet.nguoiDanh === v.em} tenNguoiDanh={v.ghe[sheet.nguoiDanh]!.ngan} tenLuotNay={tenLuot} tenKeTiep={v.ghe[tiepTheo(sheet.nguoiDanh, v.ghe.length)]!.ten}
          onCham={(d, ph, t) => onCham(sheet, d, ph, t)} onDong={(d) => onDongCau(sheet, d)} onAm={(k) => am.phat(k)} />}
        {xem && !sheet && cauSai.length > 0 && <XemLaiCauSai ds={cauSai} dongTt={v.pha === 'over' ? 'Ván đã kết thúc' : `Đang lượt ${tenLuot} · tới lượt em thì tấm này tự đóng`} onDong={() => { setXem(false); v.datXemMo(false) }} />}
        {hoiRoi && !ket && <div className="bia-che"><div className="bia-ket" role="dialog" aria-modal="true" aria-label="Rời ván">
          <h3>Rời ván?</h3>
          <p className="bia-chu-nho">{vm ? (doi ? 'A.I sẽ đánh thay ghế em; ván thôi tính Điểm bàn. ' : 'Bạn thắng ván này. ') : 'Ván này dừng lại. '}Câu em đã trả lời vẫn được tính; câu chưa trả lời trả lại kế hoạch hôm nay.</p>
          <div className="bia-hang-nut"><button type="button" className="bia-nut-chu" onClick={() => setHoiRoi(false)}>Chơi tiếp</button><button type="button" className="bia-nut-vang" onClick={roiVan}>Rời ván</button></div>
        </div></div>}
        {ket && <div className="bia-che"><div className="bia-ket" role="dialog" aria-modal="true" aria-labelledby="bia-ket-ten">
          <div className="bia-nhan-tam"><span>Kết thúc ván</span><span>{Math.floor(ket.giay / 60)} phút {ket.giay % 60} giây · {doi ? 'đánh đôi' : 'đấu đơn'}</span></div>
          <h3 id="bia-ket-ten">{vm?.ketMang && vm.ketMang.doiThang === null ? 'Ván quá 2 giờ · không ai thắng' : vm && ket.doiThang === v.ghe[v.em]!.doi ? (doi ? 'Phe em thắng ván' : 'Em thắng ván') : doi ? `${TEN_PHE[ket.doiThang]} thắng ván` : `${v.ghe.find((g) => g.doi === ket.doiThang)!.ten} thắng ván`}</h3>
          {vm?.ketMang && vm.ketMang.lyDo !== 'thang' && vm.ketMang.doiThang !== null && <p className="bia-chu-nho">{vm.ketMang.lyDo === 'bo' ? 'Bạn đã rời ván.' : 'Bạn mất kết nối quá 60 giây.'}</p>}
          <table className="bia-bang-diem">
            <thead><tr><th>Người</th><th>Câu đúng</th><th>Bi ăn</th><th>Bi vàng</th></tr></thead>
            <tbody>{tk.map((g) => <tr key={g.ghe}><td>{g.ten}<small>{TEN_PHE[g.doi]}</small></td><td>{loai === 'giao_huu' ? '—' : `${g.dung}/${g.dung + g.sai}`}</td><td>{g.an}</td><td>{g.vang}</td></tr>)}</tbody>
            <tfoot><tr><td>Điểm ván</td><td colSpan={3}>Kim loại {ket.diem[0]} · Phi kim {ket.diem[1]}</td></tr></tfoot>
          </table>
          {loai !== 'giao_huu' && <p className="bia-chu-nho">{tk[v.em]!.caiSai.length ? `Câu sai của em đã vào lịch ôn: ${[...new Set(tk[v.em]!.caiSai.filter(Boolean))].join(', ')}.` : 'Em không sai câu nào trong ván này.'}{theLucSau ? ` Thể lực hôm nay còn ${theLucSau.con}/${theLucSau.tong} câu.` : ''}</p>}
          {cauSai.length > 0 && <button type="button" className="bia-nut-chu" onClick={moXem}>Xem lại câu sai ({cauSai.length})</button>}
          {vm && vm.loaiMang === 'ban' && <p className="bia-chu-nho">{vm.S.khongElo ? 'Ván có A.I nên không tính Điểm bàn.' : 'Ván này tính Điểm bàn; điểm mới hiện ở Sảnh Bi-a.'}</p>}
          <div className="bia-hang-nut"><button type="button" className={vm ? 'bia-nut-vang' : 'bia-nut-chu'} onClick={onVeSanh}>Về Sảnh</button>{!vm && <button type="button" className="bia-nut-vang" onClick={onChoiLai}>Chơi ván mới</button>}</div>
        </div></div>}
      </div>
    </div>
  )
}
