// BI-A PHẢN ỨNG · MÀN CHƠI (đặc tả 8.3–8.8; bản vẽ docs/ban-ve-bi-a-2809). Ba bố cục theo kích thước khung (dọc · ngang · máy tính),
// nút Toàn màn hình (chỉ còn bàn), nhãn chỉ bi,
// XOAY NGANG (29/09): bàn toàn màn, nút/thanh lực là lớp phủ mảnh hai mép, câu hỏi là tấm phủ giữa màn; âm thanh mô phỏng, tấm câu chấm ở máy chủ, sai là sang lượt ngay, Xem lại câu sai lúc chờ lượt.
// BÀN BI-A MỚI (thầy chốt bản vẽ 30/09): bỏ bảng "Bi của em" + bảng bi đối thủ ⇒ hàng chấm nhỏ trên cùng; bi vẽ theo góc nhìn (em lam đặc,
// đối thủ sọc đỏ cam); giải trước = chạm bi của em trên bàn trong lượt người khác; kéo bàn xoay gậy + bánh xe + thanh lực dọc có Huỷ (DieuKhienBia.tsx).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { KeyboardEvent as KE, PointerEvent as PE } from 'react'
import { AmThanhBia } from './am-thanh'
import { doiCauBia, doiCauBiaMang, giuBanBia, ketVanBia, NHIP_GIU_BAN_MS } from './api'
import { giuTrangKhongTaiLai } from '../../lib/cap-nhat-app'
import { chonBoCuc, panTheoMan, raMan, tinhKhungBan, toaDoBan, type BoCuc, type KhungBan } from './bo-cuc'
import { VanBia, type CauBia, type KetThucVan, type LoaiVan, type YeuCauCau } from './dieu-khien'
import { CAU_NHAN, VanMang, type GoiTT, type KenhVan, type LoaiMang } from './dieu-khien-mang'
import { TEN_MUC, hangMuc, quanHe, tiepTheo, type CheDo } from './luat'
import { CHOT, KL, MAU_QH, NT, PK, TEN_PHE, type KiHieu } from './nguyen-to'
import TamCauBia from './TamCauBia'
import XemLaiCauSai, { type CauSai } from './XemLaiCauSai'
import { R } from './vat-ly'
import { dangCheDoMayYeu } from '../../lib/may-yeu'
import { useLuonMatThan } from './mat-than-luon'
import { BoVe } from './ve-ban'
import { BanhXe, BoDieuKhien, CaiDatDieuKhien, HangCham, HuongDan, ThanhLuc, biTai, daXemHuongDan, ghiDaXemHuongDan } from './DieuKhienBia'
import { KHO_BIET_GIAI_TRUOC, KHO_TAY } from './cai-dat-bia'
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
  them: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></svg>,
}
function IconAm({ tat }: { tat: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z" />{tat ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}</svg>
}

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

const GOI_Y_IOS = 'Thêm vào màn hình chính để chơi toàn màn hình'
type DocWebkit = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void }
/** Khoá màn hình NGANG khi đang toàn màn hình (Android Chrome cho; trình duyệt khác từ chối ⇒ bỏ qua êm). */
function khoaNgang(): void {
  try { const o = (typeof screen !== 'undefined' ? screen.orientation : undefined) as (ScreenOrientation & { lock?: (h: string) => Promise<void> }) | undefined; void o?.lock?.('landscape')?.catch(() => {}) } catch { /* không hỗ trợ */ }
}
export default function ManChoi({ token, tenEm, van, session, cheDo, loai, cauEm, chot, onVeSanh, onChoiLai, mang }: ManChoiProps) {
  const rootRef = useRef<HTMLDivElement>(null), banRef = useRef<HTMLDivElement>(null), cvRef = useRef<HTMLCanvasElement>(null)
  const nhanRef = useRef<HTMLDivElement>(null), chipRef = useRef<HTMLSpanElement>(null)
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
  const [luonMT, setLuonMT] = useLuonMatThan()
  v.luonMT = luonMT // công tắc theo máy: đọc mỗi lần vẽ React; vòng khung hình đọc thẳng `v.luonMT`
  useEffect(() => { if (vm && mang) mang.onVan(vm) }, [vm]) // eslint-disable-line react-hooks/exhaustive-deps
  const [moNhan, setMoNhan] = useState(false)
  useSyncExternalStore(useCallback((fn: () => void) => v.dangKy(fn), [v]), () => v.phienBan)
  const [boCuc, setBoCuc] = useState<BoCuc>('doc')
  const [toan, setToan] = useState(false)
  const [huong, setHuong] = useState<'ngang' | 'doc'>('doc')
  const [popXoay, setPopXoay] = useState(false)
  const [cauSai, setCauSai] = useState<CauSai[]>([])
  const [xem, setXem] = useState(false)
  const [hoiRoi, setHoiRoi] = useState(false)
  const [tat, setTat] = useState(am.tat)
  const [tin, setTin] = useState<{ ma: number; hien: boolean }>({ ma: 0, hien: false })
  const [theLucSau, setTheLucSau] = useState<{ con: number; tong: number } | null>(null)
  const chiRef = useRef<{ id: KiHieu; den: number; tro?: boolean } | null>(null)
  const [moTuyChinh, setMoTuyChinh] = useState(false)
  const [huongDan, setHuongDan] = useState(false)
  const tay = KHO_TAY.use()
  const bietGiai = KHO_BIET_GIAI_TRUOC.use() === '1'
  /** Vẽ ngay một khung (gọi đồng bộ sau khi đổi cỡ canvas: đặt width/height xoá trắng canvas, không vẽ lại ngay ⇒ trình duyệt kịp hiện một khung trống). */
  const veNgayRef = useRef<() => void>(() => {})
  /** Cờ bố cục cho vòng khung hình (đọc ref, không đọc DOM mỗi khung). */
  const hepRef = useRef(false)
  /** Đo nhãn chỉ bi (cỡ nhãn, cỡ hộp bàn, vị trí canvas) — đo lại khi nội dung nhãn đổi hoặc khung đổi cỡ, không đo mỗi khung (đo = ép trình duyệt tính bố cục). */
  const nhanDoRef = useRef<{ w: number; h: number; W0: number; l: number; t: number } | null>(null)
  /** TỰ HẠ CHẤT LƯỢNG (30/09): bi lăn mà hơn nửa số khung chậm quá 22 ms (dưới ~45 khung/giây) ⇒ chuyển sang chế độ máy yếu cho hết ván
   *  (độ nét ≤ 1,5 điểm ảnh thật / điểm CSS, bỏ quầng sáng). Một lần mỗi ván, không tự nâng lại. */
  const haRef = useRef(false), doBanRef = useRef<() => void>(() => {})
  const datKeo = (co: boolean) => { rootRef.current?.toggleAttribute('data-keo', co) }
  const chiDich = () => { const info = v.nham(); if (info && info.loai === 'bi') chiRef.current = { id: info.b.id, den: performance.now() + 1200 } }
  // Bộ điều khiển chạm: sống ngoài React (ref), vòng khung hình gọi `dk.khung()` một lần mỗi khung.
  const [dkc] = useState(() => new BoDieuKhien({
    v, khung: () => khungRef.current, canvas: () => cvRef.current, mo: () => am.mo(), datKeo: (co) => datKeoRef.current(co), chiDich: () => chiDichRef.current(),
    chiBi: (id, ms) => { chiRef.current = { id, den: performance.now() + ms } }, giaiTruoc: (id) => giaiTruocRef.current(id),
    datBiXong: () => { const c = v.bi_('cue'); am.phat('dat', 0, pan(c.x, c.y)) },
  }))
  const datKeoRef = useRef(datKeo); datKeoRef.current = datKeo
  const chiDichRef = useRef(chiDich); chiDichRef.current = chiDich
  const giaiTruocRef = useRef<(id: KiHieu) => void>(() => {})

  // ───────── vòng khung hình ─────────
  useEffect(() => {
    // MỘT requestAnimationFrame duy nhất: vật lý bước cố định (bộ tích luỹ trong VanBia, dt kẹp 50 ms khi tab chậm),
    // vẽ nội suy giữa hai bước; không setState mỗi khung (trừ thanh lực khi giữ Space).
    // Không cấp phát mỗi khung: vòng đồng hồ + chip chỉ ghi DOM khi số (đã lượng tử hoá) đổi; dòng "Đang nhắm" bỏ qua khi bị ẩn (bố cục có cột điều khiển).
    // Máy yếu (30/09): khung không đổi gì thì KHÔNG vẽ lại canvas (BoVe.canVe); có đổi thì chỉ tô vùng bẩn (BoVe.ve).
    let raf = 0, truoc = performance.now(), chipCu = -1, gioCu = -2, ctx: CanvasRenderingContext2D | null = null, nhanX = '', nhanY = '', demLan = 0, demCham = 0
    const veBan = (now: number, ep = false) => {
      const cv = cvRef.current, k = khungRef.current, bv = boVeRef.current
      if (cv && (!ctx || ctx.canvas !== cv)) ctx = cv.getContext('2d')
      const c = chiRef.current, conChi = c && (!c.den || now < c.den) ? c : null
      if (c && c.den && now >= c.den) chiRef.current = null
      if (ctx && k && bv) {
        const chi = conChi && !v.sheet && !xemRef.current ? { id: conChi.id, qh: quanHe(conChi.id, v.em, v.ghe, v.bi) } : null, mtBat = loai !== 'giao_huu', keoBi = dkc.dangKeoBi(), mo = dkc.trongHuy()
        if (bv.canVe(v, chi, mtBat, keoBi, mo) || ep) bv.ve(ctx, v, chi, mtBat, keoBi, mo)
      }
      return conChi
    }
    veNgayRef.current = () => { try { veBan(performance.now(), true) } catch (e) { baoLoiVe(e) } }
    // LỖI VẼ KHÔNG ĐÓNG GAME (30/09): một khung hình ném lỗi (máy yếu hết bộ nhớ canvas, số NaN…) trước đây làm vòng khung hình dừng hẳn — bàn đứng im như đã thoát.
    // Nay hẹn khung kế TRƯỚC, bọc thân khung trong try/catch: khung lỗi bỏ qua, ván chạy tiếp; lỗi chỉ ghi console một lần.
    let daBaoLoi = false
    const baoLoiVe = (e: unknown) => { if (!daBaoLoi) { daBaoLoi = true; console.error('[Bi-a] lỗi một khung hình, bỏ qua', e) } }
    const khung = (now: number) => {
      raf = requestAnimationFrame(khung)
      try { motKhung(now) } catch (e) { baoLoiVe(e) }
    }
    const motKhung = (now: number) => {
      const dtThat = Math.max(0, now - truoc), dt = Math.min(0.05, dtThat / 1000); truoc = now
      if (v.pha === 'moving' && !haRef.current && dtThat > 0) {
        demLan++; if (dtThat > 22) demCham++
        if (demLan >= 40) { if (demCham >= 20) { haRef.current = true; doBanRef.current() } demLan = 0; demCham = 0 }
      }
      dkc.khung(now) // áp thao tác chạm đang chờ (bàn, thanh lực, bánh xe, Space) + ghi DOM thanh lực
      v.buoc(dt)
      am.xa()
      const cv = cvRef.current, k = khungRef.current
      const conChi = veBan(now)
      // đồng hồ: chỉ đấu online (30 giây mỗi cú, phòng giữ giờ) và chỉ HIỆN khi còn ≤ 10 giây
      const goc = rootRef.current
      const giayCon = v.coDongHo() && v.pha === 'aim' && !v.sheet && v.time <= 10 ? Math.max(0, Math.ceil(v.time)) : -1
      if (giayCon !== gioCu && goc) {
        gioCu = giayCon
        const dh = goc.querySelector<HTMLElement>('.bia-dong-ho')
        if (dh) { dh.hidden = giayCon < 0; dh.textContent = giayCon < 0 ? '' : `còn ${giayCon} giây` }
      }
      // nhãn chỉ bi
      const nh = nhanRef.current
      if (nh && cv && k) {
        const b = conChi && !v.sheet && !xemRef.current ? v.bi_(conChi.id) : null
        if (!b || !b.on || !conChi) { if (!nh.hidden) nh.hidden = true }
        else {
          const nd = noiDungNhan(v, conChi.id), key = `${conChi.id}|${nd.chinh}|${nd.nho}`
          if (nh.dataset.k !== key) {
            nhanDoRef.current = null
            nh.dataset.k = key
            nh.style.setProperty('--vien', MAU_QH[nd.qh])
            nh.replaceChildren()
            const tb = document.createElement('b'); tb.textContent = conChi.id
            const em = document.createElement('em'); em.textContent = nd.chinh
            const sm = document.createElement('small'); sm.textContent = nd.nho
            nh.append(tb, document.createTextNode(nd.tieuDe), em, sm)
          }
          if (nh.hidden) { nh.hidden = false; nhanDoRef.current = null }
          const d = nhanDoRef.current ?? (nhanDoRef.current = { w: nh.offsetWidth, h: nh.offsetHeight, W0: banRef.current?.clientWidth ?? 0, l: cv.offsetLeft, t: cv.offsetTop })
          const [px, py] = raMan(k, dprRef.current, b.x, b.y), x0 = d.l + px / dprRef.current, y0 = d.t + py / dprRef.current, rr = R * k.S
          let top = y0 - rr - 8, duoi = false
          if (top - d.h < 4) { top = y0 + rr + 8; duoi = true }
          if (duoi !== nh.hasAttribute('data-duoi')) { if (duoi) nh.setAttribute('data-duoi', ''); else nh.removeAttribute('data-duoi') }
          const lx = `${Math.max(d.w / 2 + 4, Math.min(d.W0 - d.w / 2 - 4, x0))}px`, ty = `${top}px`
          if (lx !== nhanX || nh.style.left !== lx) { nhanX = lx; nh.style.left = lx }
          if (ty !== nhanY || nh.style.top !== ty) { nhanY = ty; nh.style.top = ty }
        }
      }
      // chip toàn màn hình
      const ch = chipRef.current
      if (ch) {
        // chip (chế độ "chỉ còn bàn"): lượt · điểm; đồng hồ chỉ khi đấu online còn ≤ 10 giây
        const me = v.ghe[v.cur]!, hep = hepRef.current, de = v.ghe[v.em]!.doi, a = v.diem[de], b = v.diem[1 - de]!
        const kc = ((((((v.pha === 'over' ? 1 : 0) * 2 + (me.ai ? 1 : 0)) * 8 + v.cur) * 1000 + (giayCon + 1)) * 1000 + a) * 1000 + b) * 2 + (hep ? 1 : 0)
        if (kc !== chipCu) {
          chipCu = kc
          ch.textContent = (v.pha === 'over' ? 'Hết ván' : v.cur === v.em ? 'Lượt em' : `Lượt ${me.ngan}`) + (giayCon >= 0 ? ` · còn ${giayCon} giây` : '') + (hep ? ` · Điểm ${a} : ${b}` : ` · Điểm phe em ${a} : ${b} phe đối thủ`)
        }
      }
    }
    raf = requestAnimationFrame(khung)
    return () => { cancelAnimationFrame(raf); veNgayRef.current = () => {} }
  }, [v, am, loai, dkc])
  useEffect(() => () => { v.huy(); am.dong() }, [v, am])
  // Dựng sẵn âm thanh ngay sau khi bàn hiện (không trong lần chạm đầu — đo máy yếu 30/09: long task 150–350 ms lúc chạm bàn đầu tiên).
  useEffect(() => { const h = setTimeout(() => am.chuanBi(), 700); return () => clearTimeout(h) }, [am])
  // Đang ở màn chơi (kể cả bảng kết quả) ⇒ app KHÔNG tự tải lại vì bản mới (nguyên nhân gốc "đang chơi thoát luôn" 30/09); rời màn ⇒ bản mới vào.
  useEffect(() => giuTrangKhongTaiLai(), [])
  // Giữ bàn ở máy chủ (30/09): ván A.I có phiên câu ⇒ báo "còn chơi" mỗi 3 phút khi màn đang hiện, để máy chủ chỉ nhả câu của bàn THẬT SỰ bỏ dở
  // (không hoạt động quá HAN_GIU_BAN_BIA_MS), không nhả bàn đang chơi. Ván online: phòng đấu giữ. Nối tiếp (không chồng lượt), lỗi thì bỏ qua.
  useEffect(() => {
    if (!session || vm || ket) return
    let song = true, hen: ReturnType<typeof setTimeout> | null = null
    const lap = () => { hen = setTimeout(() => { if (!song) return; if (typeof document === 'undefined' || document.visibilityState !== 'hidden') void giuBanBia(token, session).catch(() => {}); lap() }, NHIP_GIU_BAN_MS) }
    lap()
    return () => { song = false; if (hen) clearTimeout(hen) }
  }, [token, session, vm, ket])
  // Trang xem thử / kiểm tự động (chỉ bản dev, không vào bản build): điều khiển ván từ bên ngoài.
  useEffect(() => { if (import.meta.env.DEV) (window as unknown as { __biaVan?: VanBia }).__biaVan = v }, [v])
  const xemRef = useRef(false); xemRef.current = xem

  // ───────── cỡ khung + bố cục ─────────
  useEffect(() => {
    const goc = rootRef.current, ban = banRef.current, cv = cvRef.current
    if (!goc || !ban || !cv) return
    if (!boVeRef.current) boVeRef.current = new BoVe(document)
    if (import.meta.env.DEV) (window as unknown as { __biaBoVe?: BoVe }).__biaBoVe = boVeRef.current // trang đo: so ảnh vẽ vùng bẩn với vẽ cả bàn
    const doBoCuc = () => {
      nhanDoRef.current = null
      const r = goc.getBoundingClientRect(), bc = chonBoCuc(r.width, r.height)
      hepRef.current = r.width < 480
      setBoCuc(bc); setHuong(r.width > r.height ? 'ngang' : 'doc')
    }
    const doBan = () => {
      const cs = getComputedStyle(ban)
      const bw = ban.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0')
      const bh = ban.clientHeight - parseFloat(cs.paddingTop || '0') - parseFloat(cs.paddingBottom || '0')
      if (bw <= 0 || bh <= 0) return
      // Hướng bàn chốt theo KHUNG NHÌN (máy dọc ⇒ bàn dọc), không theo phần dư của hộp bàn (dao động khi chữ quanh bàn xuống dòng).
      const r = goc.getBoundingClientRect(), cu = khungRef.current
      const nhe = dangCheDoMayYeu() || haRef.current
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
    doBanRef.current = doBan
    // Xoay máy / đổi cỡ: ResizeObserver đo NGAY (chạy sau bố trí, trước khi vẽ ⇒ canvas đổi cỡ + vẽ lại trong cùng khung, không lộ khung trắng);
    // tin xoay máy / khung nhìn gộp vào MỘT lần đo ở khung hình kế (rAF); mọi tin đều hẹn đo lại lần cuối sau 160 ms (debounce:
    // iOS báo cỡ mới trễ sau hoạt ảnh xoay). doBan tự bỏ qua khi cỡ thật không đổi.
    let hen = 0, cuoi: ReturnType<typeof setTimeout> | null = null
    const lam = () => { if (hen) { cancelAnimationFrame(hen); hen = 0 } doBoCuc(); doBan() }
    const henCuoi = () => { if (cuoi) clearTimeout(cuoi); cuoi = setTimeout(() => { cuoi = null; if (!hen) hen = requestAnimationFrame(lam) }, 160) }
    const henDo = () => { if (!hen) hen = requestAnimationFrame(lam); henCuoi() }
    const ro = new ResizeObserver(() => { lam(); henCuoi() })
    ro.observe(goc); ro.observe(ban)
    window.addEventListener('orientationchange', henDo)
    window.visualViewport?.addEventListener('resize', henDo)
    void document.fonts?.ready?.then(() => { nhanDoRef.current = null; boVeRef.current?.napLaiChu() })
    return () => {
      ro.disconnect(); window.removeEventListener('orientationchange', henDo); window.visualViewport?.removeEventListener('resize', henDo)
      if (hen) cancelAnimationFrame(hen)
      if (cuoi) clearTimeout(cuoi)
    }
  }, [])
  const ngang = boCuc === 'ngang'
  /** Chế độ "chỉ còn bàn" cũ (dọc, máy tính). Xoay ngang đã là bàn toàn màn ⇒ nút Toàn màn hình chỉ bật toàn màn hình THẬT. */
  const toanCu = toan && !ngang
  /** Phía của thanh lực: xoay ngang theo tay cầm (mặc định phải); máy tính ở cột điều khiển trái; màn dọc theo tay cầm (mép bàn). */
  const dk = toanCu ? (huong === 'ngang' ? 'trai' : undefined) : boCuc === 'pc' ? 'trai' : ngang ? (tay === 'trai' ? 'trai' : 'phai') : undefined
  /** Thanh lực nằm cạnh bàn (trong hộp bàn) ở màn dọc / xoay ngang; máy tính ở cột điều khiển. */
  const lucTrongBan = boCuc !== 'pc'

  // ───────── toàn màn hình ─────────
  const datToan = (bat: boolean) => {
    setToan(bat)
    const goc = rootRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null
    try {
      if (bat && goc && !document.fullscreenElement) { const r = goc.requestFullscreen ? goc.requestFullscreen({ navigationUI: 'hide' }) : (goc.webkitRequestFullscreen?.(), undefined); r?.catch?.(() => {}) }
      if (!bat && document.fullscreenElement) void document.exitFullscreen?.().catch(() => {})
    } catch { /* trình duyệt chặn: vẫn ẩn phần điều khiển (phủ cả cửa sổ) */ }
    if (bat) v.nhac('Toàn màn hình', 'Chỉ còn bàn bi-a · Esc hoặc nút Thoát để ra', 1500)
  }
  const [toanThat, setToanThat] = useState(false)
  useEffect(() => {
    const f = () => { const co = !!(document.fullscreenElement || (document as DocWebkit).webkitFullscreenElement); setToanThat(co); if (!co) setToan(false) }
    document.addEventListener('fullscreenchange', f); document.addEventListener('webkitfullscreenchange', f)
    return () => { document.removeEventListener('fullscreenchange', f); document.removeEventListener('webkitfullscreenchange', f) }
  }, [])
  /** Xoay ngang: nút Toàn màn hình bật/tắt toàn màn hình THẬT (Fullscreen API) rồi khoá màn ngang nếu trình duyệt cho.
   *  iPhone Safari không có Fullscreen API cho trang ⇒ một dòng gợi ý "Thêm vào màn hình chính". */
  const datToanNgang = () => {
    am.mo()
    const d = document as DocWebkit
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) { if (d.exitFullscreen) void d.exitFullscreen().catch(() => {}); else d.webkitExitFullscreen?.(); return }
      const goc = rootRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null
      if (!goc || (typeof goc.requestFullscreen !== 'function' && typeof goc.webkitRequestFullscreen !== 'function')) { v.nhac('Máy này chưa mở được toàn màn hình', GOI_Y_IOS, 3500); return }
      const r = typeof goc.requestFullscreen === 'function' ? goc.requestFullscreen({ navigationUI: 'hide' }) : (goc.webkitRequestFullscreen!(), undefined)
      void Promise.resolve(r).then(khoaNgang).catch(() => v.nhac('Máy này chưa mở được toàn màn hình', GOI_Y_IOS, 3500))
    } catch { v.nhac('Máy này chưa mở được toàn màn hình', GOI_Y_IOS, 3500) }
  }

  // ───────── hướng dẫn lần đầu (một lần theo máy; xem lại ở Tuỳ chỉnh) ─────────
  const nguoiDanh = v.nguoiDuocDanh()
  useEffect(() => { if (nguoiDanh && !daXemHuongDan()) setHuongDan(true) }, [nguoiDanh])
  const xongHuongDan = () => { setHuongDan(false); ghiDaXemHuongDan() }
  // Gợi ý một lần: lượt người khác, chạm bi của em trên bàn để giải trước. Hiện suốt lượt đầu gặp, qua lượt đó là nhớ đã biết.
  const moGiai = v.coTheGiaiTruoc()
  const [goiYGiai, setGoiYGiai] = useState(false)
  useEffect(() => {
    if (moGiai && !bietGiai && v.biEm().some((id) => !v.bi[id].an && !v.bi[id].vang && !v.bi[id].trong)) setGoiYGiai(true)
    else if (!moGiai && goiYGiai) { setGoiYGiai(false); KHO_BIET_GIAI_TRUOC.dat('1') }
  }, [moGiai]) // eslint-disable-line react-hooks/exhaustive-deps
  // Lăn chuột trên bàn = tinh chỉnh (máy tính). Gắn gốc với passive: false để chặn cuộn trang.
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const f = (e: WheelEvent) => dkc.banLan(e)
    cv.addEventListener('wheel', f, { passive: false })
    return () => cv.removeEventListener('wheel', f)
  }, [dkc])

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

  // ───────── nhập liệu trên bàn (DieuKhienBia.tsx: kéo = xoay gậy, chạm bi = nhắm / giải trước, kéo bi cái khi được đặt) ─────────
  const onDown = (e: PE<HTMLCanvasElement>) => {
    rootRef.current?.focus({ preventScroll: true })
    setMoTuyChinh(false)
    dkc.banDown(e)
  }
  const onMove = (e: PE<HTMLCanvasElement>) => {
    if (dkc.banMove(e)) return
    // di chuột (không bấm) ⇒ chỉ bi dưới con trỏ
    const k = khungRef.current, cv = cvRef.current
    if (e.pointerType !== 'mouse' || e.buttons || !k || !cv) return
    const r = cv.getBoundingClientRect(), f = r.width ? cv.clientWidth / r.width : 1, p = toaDoBan(k, (e.clientX - r.left) * f, (e.clientY - r.top) * f), b = biTai(v, p.x, p.y)
    if (b) chiRef.current = { id: b, den: 0, tro: true }
    else if (chiRef.current?.tro) chiRef.current = null
  }
  const onLeave = () => { if (chiRef.current?.tro) chiRef.current = null }
  const chonXoay = (e: PE<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    v.datXoay((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1))
  }
  /** Chạm đúp mặt bi lớn ⇒ xoáy về tâm. */
  const chamXoayRef = useRef(0)
  const xoayDown = (e: PE<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const t = performance.now()
    if (t - chamXoayRef.current < 320) { chamXoayRef.current = 0; v.datXoay(0, 0); return }
    chamXoayRef.current = t
    chonXoay(e)
  }

  // ───────── bàn phím (máy tính) ─────────
  const onKey = (e: KE<HTMLDivElement>) => {
    am.mo()
    if (e.key === 'Escape') { if (huongDan) { xongHuongDan(); return } if (moTuyChinh) { setMoTuyChinh(false); return } if (popXoay) { setPopXoay(false); return } if (xem) { setXem(false); v.datXemMo(false); return } if (toan) { datToan(false); return } }
    const t = e.target as HTMLElement
    if (t.closest('.bia-tam,.bia-ket,input,textarea')) return
    if (e.key === 'f' || e.key === 'F') { if (ngang) datToanNgang(); else datToan(!toan); e.preventDefault(); return }
    if (e.key === 'm' || e.key === 'M') { am.datTat(!tat); setTat(!tat); return }
    if (!v.nguoiDuocDanh()) return
    if (e.key === 'ArrowLeft') { v.xoayNham(e.shiftKey ? -0.1 : -0.6); chiDich(); e.preventDefault() }
    else if (e.key === 'ArrowRight') { v.xoayNham(e.shiftKey ? 0.1 : 0.6); chiDich(); e.preventDefault() }
    else if (e.key === ' ' && !t.closest('button')) { e.preventDefault(); dkc.spaceDown() }
  }
  const onKeyUp = (e: KE<HTMLDivElement>) => { if (e.key === ' ') dkc.spaceUp() }

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
    if (goiYGiai) setGoiYGiai(false)
    KHO_BIET_GIAI_TRUOC.dat('1')
    const r = v.giaiTruoc(id)
    if (r === 'mo') return
    const q = v.cauCua[id]
    v.nhac(r === 'da_an' ? `Bi ${id} đã ăn` : r === 'vang' ? `Bi ${id} là bi vàng` : r === 'trong' ? `Bi ${id} là bi trống` : `Bi ${id}${q ? ` · ${q.tenDang}` : ''}`, r === 'vang' ? 'Vào lỗ là ăn ngay' : r === 'trong' ? 'Không có câu · vào lỗ là ăn' : r === 'chua_duoc' ? 'Giải trước được khi tới lượt người khác' : '')
  }

  giaiTruocRef.current = giaiTruoc

  // ───────── dữ liệu vẽ HUD ─────────
  const hienXemSai = cauSai.length > 0 && !sheet && !xem && v.pha !== 'over' && (v.cur !== v.em || v.pha === 'cho')
  const doi = cheDo === 'doi'
  const tenLuot = v.ghe[v.cur]!.ten
  const tbHien = tb && tin.ma === tb.ma && tin.hien
  const tk = v.tomTatGhe()
  const doiEm = v.ghe[v.em]!.doi
  const doiThu = v.ghe.find((g) => g.doi !== doiEm)
  const tenTrai = doi ? 'Phe em' : 'Em', tenPhai = (doi ? 'Đối thủ' : (doiThu?.ngan ?? 'Đối thủ')) + (vm && v.ghe.some((g, i) => g.doi !== doiEm && vm.roiGhe[i]) ? ' · đang nối lại' : '')
  const nhanMoi = vm && vm.nhanDen.length ? vm.nhanDen[vm.nhanDen.length - 1] : undefined
  const choDanh = !v.nguoiDuocDanh() // lượt người khác / bi lăn / tấm câu: thanh lực + bánh xe mờ
  const thanhLuc = <ThanhLuc dk={dkc} tat={choDanh} />
  const nutMat = <button type="button" className="bia-nut-kinh bia-nut-tron bia-nut-mat" aria-pressed={luonMT} onClick={() => setLuonMT(!luonMT)}
    aria-label={`Luôn bật Mắt thần: ${luonMT ? 'đang bật' : 'đang tắt'}${loai !== 'giao_huu' ? `. Mắt thần em có: ${v.matThan}` : ''}`} title="Luôn bật Mắt thần · nhắm dễ hơn">{ICON.mat}{loai !== 'giao_huu' && v.matThan > 0 && <b className="bia-so-mat">{v.matThan}</b>}</button>
  return (
    <div ref={rootRef} className="bia" data-bo-cuc={boCuc} data-dk={dk} data-tay={tay} data-nhe={dangCheDoMayYeu() ? '' : undefined} data-toan={toanCu ? '' : undefined} tabIndex={-1} onKeyDown={onKey} onKeyUp={onKeyUp} onPointerDownCapture={() => am.mo()}>
      <div className="bia-man">
        <header className="bia-dau">
          <button type="button" className="bia-nut-kinh bia-nut-tron bia-nut-sanh" onClick={() => (ket ? onVeSanh() : setHoiRoi(true))} aria-label="Về Sảnh Bi-a">{ICON.sau}</button>
          <div className="bia-ten"><b>Bi-a Phản Ứng</b><span>{vm ? (vm.loaiMang === 'giao_huu' ? 'Bàn giao hữu với bạn · không câu' : doi ? 'Đánh đôi với bạn' : 'Đấu với bạn') : loai === 'giao_huu' ? 'Bàn giao hữu · không câu' : doi ? 'Đánh đôi với A.I' : 'Đấu với A.I'}</span></div>
          <HangCham v={v} tenTrai={tenTrai} tenPhai={tenPhai} />
          {nutMat}
          <button type="button" className="bia-nut-kinh bia-nut-tron bia-nut-am" aria-pressed={!tat} aria-label={tat ? 'Bật âm thanh' : 'Tắt âm thanh'} title="Âm thanh (phím M)" onClick={() => { am.datTat(!tat); setTat(!tat) }}><IconAm tat={tat} /></button>
        </header>
        <div className="bia-toan-tren">
          <span className="bia-chip" ref={chipRef} />
          <button type="button" className="bia-nut-kinh bia-nut-thoat" aria-label="Thoát toàn màn hình" onClick={() => datToan(false)}>{ICON.thoat}<span className="bia-chu-nut">Thoát</span></button>
        </div>
        {boCuc === 'pc' && <section className="bia-cot-phai" aria-label="Diễn biến ván">
          <div className="bia-nhat-ky"><b>Diễn biến ván</b><ol>{v.nhatKy.map((d) => <li key={d.ma} data-loai={d.loai || undefined}><time>{Math.floor(d.giay / 60)}:{String(d.giay % 60).padStart(2, '0')}</time><span>{d.chu}</span></li>)}</ol></div>
          <div className="bia-phim-tat"><b>Phím tắt</b><span>Kéo hoặc lăn chuột trên bàn để xoay gậy · giữ <kbd>Shift</kbd> khi lăn để chỉnh rất nhỏ</span><span><kbd>←</kbd><kbd>→</kbd> chỉnh nhỏ · giữ <kbd>Shift</kbd> để chỉnh rất nhỏ</span><span>Giữ <kbd>Space</kbd> lấy lực, thả để đánh</span><span><kbd>F</kbd> toàn màn hình · <kbd>M</kbd> âm thanh</span></div>
        </section>}
        <section className="bia-ban" ref={banRef}>
          <canvas ref={cvRef} role="img" aria-label={`Bàn bi-a: 7 bi Kim loại (${KL.join(', ')}), 7 bi Phi kim (${PK.join(', ')}), Bi chốt carbon và bi cái. Bi của em màu lam, bi đối thủ sọc đỏ cam`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={(e) => dkc.banUp(e)} onPointerCancel={(e) => dkc.banUp(e, true)} onPointerLeave={onLeave} />
          {lucTrongBan && thanhLuc}
          {vm && nhanMoi && <span key={nhanMoi.ma} className="bia-bong-nhan" role="status"><small>{v.ghe[nhanMoi.tu]?.ngan ?? ''}</small><span>{CAU_NHAN[nhanMoi.id - 1]}</span></span>}
          {goiYGiai && moGiai && <div className="bia-goi-y-gay" role="note">Trong lượt đối thủ, chạm bi của em để giải trước</div>}
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
          <button type="button" className="bia-nut-tron bia-nut-xoay" aria-label="Chọn điểm xoáy bi cái" aria-expanded={popXoay} onClick={() => { const mo = !popXoay; setPopXoay(mo); if (mo) am.phat('phan') }}><span className="bia-mat-bi" style={{ ['--sx' as string]: v.spin.x, ['--sy' as string]: -v.spin.y }}><i /></span></button>
          <BanhXe dk={dkc} doc={boCuc !== 'ngang'} tat={choDanh} />
          {!lucTrongBan && thanhLuc}
          <button type="button" className="bia-nut-kinh bia-nut-tron bia-nut-them" aria-label="Tuỳ chỉnh" aria-expanded={moTuyChinh} onClick={() => setMoTuyChinh(!moTuyChinh)}>{ICON.them}</button>
          {popXoay && <div className="bia-pop-xoay">
            <p>Chạm vào bi để chọn điểm đánh. Cao: bi cái chạy theo. Thấp: lùi lại. Trái, phải: dội băng lệch. Chạm đúp để về tâm.</p>
            <button type="button" className="bia-bi-lon" aria-label="Điểm xoáy trên bi cái" style={{ ['--sx' as string]: v.spin.x, ['--sy' as string]: -v.spin.y }} onPointerDown={xoayDown} onPointerMove={(e) => { if (e.buttons) chonXoay(e) }}><i /></button>
            <button type="button" className="bia-nut-chu" onClick={() => v.datXoay(0, 0)}>Bỏ xoáy</button>
          </div>}
          {moTuyChinh && <div className="bia-pop-tuy" role="dialog" aria-label="Tuỳ chỉnh">
            <CaiDatDieuKhien />
            <button type="button" className="bia-nut-chu" aria-pressed={!tat} onClick={() => { am.datTat(!tat); setTat(!tat) }}>{tat ? 'Bật âm thanh' : 'Tắt âm thanh'}</button>
            {ngang
              ? <button type="button" className="bia-nut-chu" onClick={() => { setMoTuyChinh(false); datToanNgang() }} aria-pressed={toanThat}>{toanThat ? 'Thoát toàn màn hình' : 'Toàn màn hình'}</button>
              : <button type="button" className="bia-nut-chu" onClick={() => { setMoTuyChinh(false); datToan(true) }}>Toàn màn hình</button>}
            <button type="button" className="bia-nut-chu" onClick={() => { setMoTuyChinh(false); setHuongDan(true) }}>Xem lại hướng dẫn</button>
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
        {huongDan && !sheet && !ket && !hoiRoi && <HuongDan goc={rootRef.current} onXong={xongHuongDan} />}
      </div>
    </div>
  )
}
