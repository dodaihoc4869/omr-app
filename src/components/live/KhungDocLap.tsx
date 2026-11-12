// LIVE BẢNG — HAI KHUNG ĐỘC LẬP TRÊN MÁY EM: khung GIẤY ĐỀ + khung BẢNG ĐEN, mỗi khung một phép co (bo-cuc-doc-lap.ts; đặc tả mục 4.3h).
// Dùng chung cho bảng live (`LopLive.tsx`, lớp CSS «lv-…») và trình phát «Xem lại Live» (`TrinhPhat.tsx`, lớp «xp-…»): nơi dùng lo đo khổ hình, vòng
// khung hình, nguồn sự kiện bút; phần này lo bố cục hai khung, lớp vẽ nét (ve-bang.ts), cuộn / tự trôi, tự ưu tiên theo thầy, kéo vạch chia, chạm hai
// lần phóng kín. Kiểu vị trí đặt thẳng ở đây (`style`); màu và dáng nằm ở CSS của nơi dùng (không thêm tệp CSS ⇒ không thêm tệp precache).
//   · GIẤY: `.…-giay` (khung, cắt) > `.…-kg-cuon` (khung cuộn dọc của trình duyệt) > `.…-kg-tam` (tấm giấy = ô giấy của thầy đã co) > chữ đề + canvas nét
//     đã chốt của giấy (cuộn cùng chữ, không lệch nhau một khung hình nào).
//   · BẢNG: `.…-bang` (khung, cắt) > khung cuộn `.lv-cuon` của lớp vẽ (canvas nét đã chốt của bảng, dời bằng transform).
//   · LỚP «ĐANG VIẾT» `.…-net`: một canvas nhỏ đi theo đầu bút, chạy trong cả hình.
// Mỗi khung hình KHÔNG vẽ lại React: mũi tên «Thầy đang viết ở dưới», nút «Về chỗ thầy đang viết» bật / tắt bằng thuộc tính.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { taoLoiBut, type SuKienBut } from '../../lib/but-bang-loi'
import { giaiTrang, khungChieu, type AnToan, type KhungChieu, type VungChieu } from './bo-cuc'
import { DAU_BANG, DAU_DU, NHUONG_MS, NO_MS, TI_LE_CHU_MAC_DINH, boCucDocLap, buocTroi, chuyenKhung, docChia, ghiChia, khungVeDL, mocChia, netOBang, oDauBang, taoUuTien, troiGiay, vungBut, type BoCucDL, type Vung } from './bo-cuc-doc-lap'
import { taoVeBang, type VeBang } from './ve-bang'

export interface HinhDL { w: number; h: number; xoay: boolean; at: AnToan }
export interface ButDL { x: number; y: number; cham: boolean; net?: string; mau?: string }
export interface TayKhungDL {
  /** Tính lại bố cục (đổi cỡ màn, xoay, đổi trang). */
  xep: () => void
  /** Áp MỘT sự kiện bút (nơi dùng đã cập nhật trang + gọi `xep` nếu là trang mới). */
  ap: (sk: SuKienBut) => void
  /** MỘT khung hình: đầu nét + cây bút ⇒ vẽ, tự ưu tiên, tự trôi. Trả chỗ ngòi bút trong hình (px) hoặc null. */
  khung: (nay: number, dau: readonly { id: string; x: number; y: number }[], but: ButDL | null, cuon?: number | null) => [number, number] | null
  ve: () => VeBang | null
  /** Em bật lại «tự chia theo thầy» ⇒ bỏ vạch chia em đã kéo. */
  boTay: () => void
  /** Em tắt «tự chia theo thầy» ⇒ giữ vạch chia đang đứng. */
  giuTay: () => void
}
export interface PropsKhungDL {
  /** Tiền tố lớp CSS của nơi dùng. */
  lop: 'lv' | 'xp'
  layHinh: () => HinhDL
  layTrang: () => { trang: string; tiLe: number }
  /** Giấy soi KHỚP giấy thầy ⇒ nét trên giấy hiện, giấy là tấm giấy của thầy (cuộn trong khung). false ⇒ giấy dựng thường, nét trên giấy ẩn. */
  netGiay: boolean
  /** Cỡ chữ đề / bề ngang ô giấy của thầy (từ số đo giấy). null ⇒ giấy dựng thường (chữ không phụ thuộc bề ngang khung); bỏ trống ⇒ mặc định của tờ. */
  tiLeChu?: number | null
  /** Cho máy tự ưu tiên khung theo thầy (máy yếu ⇒ false: chia cố định). */
  tuUuTien: boolean
  /** Cho chuyển động (máy yếu / giảm chuyển động ⇒ false: đổi tức thì). */
  dong: boolean
  /** Chữ đề: nơi dùng dựng theo khổ tấm giấy (`rong` × `cao`). */
  giay: (k: { rong: number; cao: number }) => ReactNode
  /** Khổ GỐC của tấm giấy do nơi dùng dựng (giấy soi: px của giấy thầy). Có ⇒ chữ đề dựng MỘT lần ở khổ ấy rồi co bằng transform — khung nở / thu không phải
   *  dựng lại chữ (đo CPU ×4: bớt ~40 ms mỗi lần nở). Vắng ⇒ nơi dùng dựng lại theo khổ tấm giấy trên máy em mỗi lần xếp. */
  tamGoc?: { rong: number; cao: number } | null
  /** Chữ gợi ý khi bảng đen chưa có nét. */
  bangTrong?: ReactNode
  /** DẢI THẺ TÊN em đang lên bảng (LenBang.tsx): có ⇒ khung bảng nhường `DAU_BANG` px phía trên, dải nằm NGOÀI mép trên khung bảng (không đè nét). */
  dauBang?: ReactNode
  /** Em chạm vào nền (trước khi xét chạm hai lần). Trả true ⇒ nơi dùng đã xử lí, bỏ qua. */
  /** LIVE THEO KHỐI (12/11): thầy chọn chế độ «Bảng» ⇒ ép khung bảng phủ kín (`'bang'`); về «Học» (`null`) ⇒ trả hai khung. Vắng ⇒ như cũ. */
  epPhong?: Vung | null
  khiCham?: () => boolean | void
  khiPhong?: (v: Vung | null) => void
  /** Vạch chia đang do em giữ (true) hay máy tự chia theo thầy (false) — báo lúc dựng và mỗi lần đổi. */
  khiTay?: (tay: boolean) => void
  /** Đã áp một sự kiện bút (nơi dùng đếm nét). */
  khiNet?: (v: VeBang) => void
}
const kho = (): Storage | null => { try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null } }
const mayYeu = (): boolean => typeof document !== 'undefined' && document.documentElement.classList.contains('may-yeu')
const NO_DANG = 'cubic-bezier(0.3, 0.7, 0.2, 1)'

export default forwardRef<TayKhungDL, PropsKhungDL>(function KhungDocLap(p, ref) {
  const goc = useRef<HTMLDivElement>(null), kG = useRef<HTMLDivElement>(null), cuonG = useRef<HTMLDivElement>(null), kB = useRef<HTMLDivElement>(null), net = useRef<HTMLDivElement>(null)
  const cvChot = useRef<HTMLCanvasElement>(null), cvSong = useRef<HTMLCanvasElement>(null), vach = useRef<HTMLDivElement>(null), noiB = useRef<HTMLDivElement>(null), dauB = useRef<HTMLDivElement>(null)
  const veB = useRef<VeBang | null>(null)
  const [d, setD] = useState<{ bc: BoCucDL; kc: KhungChieu; vung: VungChieu } | null>(null)
  const P = useRef(p)
  P.current = p
  const [dau] = useState(() => ({ tay: docChia(kho()), uu: taoUuTien() }))
  /** Trạng thái chạy (vòng khung hình đọc, không gây vẽ lại). */
  const S = useRef({
    bc: null as BoCucDL | null, kc: null as KhungChieu | null, vung: null as VungChieu | null, phong: null as Vung | null, tay: dau.tay, uu: dau.uu,
    /** Bố cục cũ chờ chuyển êm · bố cục của lần dựng trước (để co độ cuộn của giấy) · hẹn dọn sau khi nở xong. */
    cho: null as BoCucDL | null, truoc: null as BoCucDL | null, henNo: undefined as ReturnType<typeof setTimeout> | undefined,
    /** Lớp vẽ đã nhận khung lần đầu chưa · còn chờ đặt khung cho lớp vẽ (đặt cùng lượt với lúc trình duyệt nhận bố cục mới) · các chuyển động nở đang chạy. */
    daDat: false, choDat: false, hoat: [] as Animation[],
    cuonGiay: 0, dichGiay: null as number | null, cuonAo: 0, lucChamGiay: -1e9, lucChamBang: -1e9, lucKhung: 0, vungBut: 'bang' as Vung, mui: 0, ve: false,
    chamCuoi: { giay: -1e9, bang: -1e9 }, chamG: null as { id: number; x: number; y: number; luc: number } | null, keoB: null as { id: number; y: number; keo: boolean } | null, keoV: null as { id: number; x0: number } | null,
  })

  const datKhungVe = useCallback(() => {
    const s = S.current
    if (!s.bc || !s.kc) return
    s.choDat = false
    veB.current?.datKhung(khungVeDL(s.bc, s.kc, Math.min(window.devicePixelRatio || 1, mayYeu() ? 1.5 : 2.5)))
  }, [])
  const xep = useCallback((dong = false) => {
    const s = S.current, q = P.current, hinh = q.layHinh(), tr = q.layTrang()
    const { vung } = giaiTrang(tr.trang), kc = khungChieu(vung, tr.tiLe)
    const moc = mocChia(hinh.w, hinh.h, hinh.at, kc, q.tiLeChu === undefined ? TI_LE_CHU_MAC_DINH : q.tiLeChu)
    const chia = s.tay ?? (q.tuUuTien ? (s.uu.dang() === 'giay' ? moc.giay : moc.bang) : moc.giua)
    const moi = boCucDocLap({ w: hinh.w, h: hinh.h, at: hinh.at, kc, chia, phong: s.phong, dauBang: q.dauBang ? DAU_BANG : 0 })
    const cu = s.bc
    s.cho = dong && q.dong && cu && cu.w === moi.w && cu.h === moi.h && (cu.sG !== moi.sG || cu.sB !== moi.sB || cu.giay.x !== moi.giay.x || cu.bang.x !== moi.bang.x) ? cu : null
    s.bc = moi; s.kc = kc; s.vung = vung
    setD({ bc: moi, kc, vung })
    // lớp vẽ nhận khung CÙNG LƯỢT với lúc hai khung đổi chỗ trên màn (hiệu ứng bên dưới) — không có khung hình nào nét một cỡ, khung một cỡ.
    // Riêng lần đầu đặt ngay: nơi dùng áp bảng (`ap`) liền sau đó, lớp vẽ phải có khung để tới thẳng chỗ nét mới nhất.
    if (s.daDat) s.choDat = true
    else if (veB.current) { datKhungVe(); s.daDat = true }
  }, [datKhungVe])

  // Lớp vẽ nét: dựng MỘT lần (khung cuộn của bảng nằm trong khung bảng ⇒ đi cùng khi khung trượt / nở).
  useLayoutEffect(() => {
    if (!cvChot.current || !cvSong.current) return
    const v = taoVeBang(taoLoiBut(), cvChot.current, cvSong.current, noiB.current)
    veB.current = v
    // `S.current` là MỘT vật suốt đời khung (không bao giờ gán lại) ⇒ giữ tay cầm cho lượt dọn — đọc `henNo` lúc dọn như trước.
    const s = S.current
    P.current.khiTay?.(s.tay != null)
    xep()
    return () => { veB.current = null; s.daDat = false; clearTimeout(s.henNo) }
  }, [xep])
  // Giấy đổi giữa «soi khớp» và «dựng thường», đổi cỡ chữ của giấy thầy, bật / tắt tự ưu tiên ⇒ chia lại.
  const daDung = useRef(false)
  const coDau = !!p.dauBang
  useLayoutEffect(() => { if (daDung.current) xep(false); daDung.current = true }, [p.netGiay, p.tiLeChu, p.tuUuTien, coDau, xep])

  /** Dọn kiểu của lần nở trước (cũng gọi khi lần nở mới chen vào). */
  const donNo = useCallback(() => {
    const s = S.current
    clearTimeout(s.henNo); s.henNo = undefined
    for (const a of s.hoat) { try { a.cancel() } catch { /* đã xong */ } }
    s.hoat = []
    if (s.bc) { if (kG.current) kG.current.style.height = `${s.bc.giay.h}px`; if (kB.current) kB.current.style.height = `${s.bc.bang.h}px` }
  }, [])
  // Sau mỗi lần xếp: giữ chỗ em đang đọc trên giấy, rồi (nếu được) cho hai khung NỞ / THU êm từ bố cục cũ sang bố cục mới — chỉ transform.
  useLayoutEffect(() => {
    const s = S.current, moi = s.bc, c = cuonG.current
    if (!moi || !d) return
    if (s.choDat) datKhungVe()
    // giấy đang cuộn dở mà phép co đổi ⇒ co độ cuộn theo (em vẫn thấy đúng dòng đang đọc). Không cuộn thì không đụng (đọc / ghi độ cuộn buộc trình duyệt bố cục ngay).
    if (c && s.truoc && s.truoc.sG !== moi.sG && s.cuonGiay > 0) { s.cuonGiay = (s.cuonGiay * moi.sG) / s.truoc.sG; c.scrollTop = s.cuonGiay; s.dichGiay = null; veB.current?.datCuonGiay(s.cuonGiay) }
    s.truoc = moi
    const cu = s.cho
    s.cho = null
    donNo()
    if (!cu || !kG.current || !kB.current || typeof kG.current.animate !== 'function') return
    // Chuyển động bằng Web Animations (chỉ transform, chạy ở bộ ghép hình): từ phép «trông như bố cục cũ» về không — không phải ép trình duyệt bố cục giữa chừng.
    const k = chuyenKhung(cu, moi), n = k.net(s.vungBut)
    const chay = (e: HTMLElement | null, dx: number, dy: number, r: number): void => {
      if (!e) return
      s.hoat.push(e.animate([{ transform: `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0) scale(${r.toFixed(5)})` }, { transform: 'translate3d(0,0,0) scale(1)' }], { duration: NO_MS, easing: NO_DANG }))
    }
    // khung đang thu nhỏ lại (r < 1 lúc đầu) ⇒ kéo dài khung cho đủ chiều cao màn suốt lúc nở
    kG.current.style.height = `${moi.giay.h / Math.min(1, k.giay.r)}px`; kB.current.style.height = `${moi.bang.h / Math.min(1, k.bang.r)}px`
    chay(kG.current, k.giay.dx, 0, k.giay.r); chay(kB.current, k.bang.dx, 0, k.bang.r); chay(net.current, n.dx, n.dy, n.r)
    if (cu.vach != null && moi.vach != null) chay(vach.current, cu.vach - moi.vach, 0, 1)
    chay(dauB.current, cu.bang.x - moi.bang.x, 0, 1) // dải thẻ tên đi theo mép trái khung bảng
    s.henNo = setTimeout(donNo, NO_MS + 40)
  }, [d, donNo, datKhungVe])

  /** Toạ độ con trỏ theo trục của HÌNH (hình xoay 90° ⇒ đổi trục; trình phát nhúng trong trang ⇒ trừ góc khung). */
  const toaDo = (e: { clientX: number; clientY: number }): { x: number; y: number } => {
    const r = goc.current?.getBoundingClientRect()
    if (!r) return { x: e.clientX, y: e.clientY }
    return P.current.layHinh().xoay ? { x: e.clientY - r.top, y: r.right - e.clientX } : { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const epPhong = p.epPhong
  useEffect(() => { if (epPhong === undefined || S.current.phong === epPhong) return; S.current.phong = epPhong; P.current.khiPhong?.(epPhong); xep(true) }, [epPhong, xep])
  /** Chạm hai lần vào khung nào ⇒ khung đó phủ kín; hai lần nữa ⇒ về hai khung. */
  const cham = (v: Vung, luc: number): void => {
    const s = S.current
    if (P.current.khiCham?.()) { s.chamCuoi[v] = -1e9; return }
    if (luc - s.chamCuoi[v] < 320) {
      s.chamCuoi[v] = -1e9
      s.phong = s.phong ? null : v
      P.current.khiPhong?.(s.phong)
      xep(true)
    } else s.chamCuoi[v] = luc
  }
  const datTay = (chia: number | null): void => { const s = S.current; s.tay = chia; ghiChia(kho(), chia); P.current.khiTay?.(chia != null) }

  useImperativeHandle(ref, (): TayKhungDL => ({
    xep: () => xep(false),
    ap: (sk) => {
      const v = veB.current, s = S.current
      if (!v) return
      v.ap(sk)
      // vào live / bảng mới: bảng đã có nét ⇒ ưu tiên bảng ngay (không chờ 2 giây); bảng trống ⇒ ưu tiên giấy cho em đọc đề
      if (sk.loai === 'trang') {
        const oB = giaiTrang(sk.trang).vung.bang, coBang = sk.net.some((n) => netOBang(oB, n)), truoc = s.uu.dang()
        s.uu.dat(coBang ? 'bang' : 'giay')
        if (truoc !== s.uu.dang() && s.tay == null && P.current.tuUuTien) xep(false)
      } else if (sk.loai === 'net-moi' && sk.xong && s.vung && s.uu.dang() !== 'bang' && netOBang(s.vung.bang, sk.net)) {
        // nét bảng tới NGUYÊN CẢ NÉT (nối lại, tua tới trong trình phát): bảng vừa có thêm chữ mà em không thấy thầy viết ⇒ ưu tiên bảng luôn
        s.uu.dat('bang')
        if (s.tay == null && !s.phong && P.current.tuUuTien) xep(true)
      }
      P.current.khiNet?.(v)
    },
    khung: (nay, dauNet, but, cuon) => {
      const v = veB.current, s = S.current, b = s.bc, kc = s.kc, q = P.current
      if (!v || !b || !kc || !s.vung) return null
      v.datDau(dauNet)
      v.datBut(but, cuon)
      v.veSong(nay)
      const vung = but ? vungBut(s.vung.bang, but.x, but.net) : null, dangViet = !!but && (but.cham || dauNet.length > 0)
      if (vung) s.vungBut = vung
      // 1 · TỰ ƯU TIÊN THEO THẦY (có trễ 2 giây): chỉ khi em không tự giữ vạch chia và không phóng kín khung nào
      const truoc = s.uu.dang(), sau = s.uu.buoc(nay, dangViet ? vung : null)
      // (vòng khung hình nằm ngoài React ⇒ ép React nhận bố cục mới NGAY trong khung hình này: hai khung, lớp vẽ và chuyển động nở bắt đầu cùng một lượt)
      if (sau !== truoc && q.tuUuTien && s.tay == null && !s.phong) flushSync(() => xep(true))
      // 2 · GIẤY TỰ TRÔI tới chỗ thầy đang viết / trỏ (em vừa tự cuộn ⇒ nhường, chỉ hiện mũi tên)
      const c = cuonG.current
      let mui = 0
      if (c && q.netGiay && but && vung === 'giay') {
        const t = troiGiay({ y: (but.y * kc.Hv - kc.oy - kc.giay.y) * b.sG, cuon: s.cuonGiay, cao: b.giay.h, tong: b.tam.h, nay, lucCham: s.lucChamGiay })
        if (t.dich != null) { if (s.dichGiay == null) s.cuonAo = s.cuonGiay; s.dichGiay = t.dich }
        mui = t.mui
      }
      if (c && s.dichGiay != null) {
        s.cuonAo = q.dong ? buocTroi(s.cuonAo, s.dichGiay, nay - s.lucKhung) : s.dichGiay
        c.scrollTop = s.cuonAo
        s.cuonGiay = s.cuonAo; v.datCuonGiay(s.cuonGiay)
        if (s.cuonAo === s.dichGiay) s.dichGiay = null
      }
      if (mui !== s.mui) { s.mui = mui; if (mui) kG.current?.setAttribute('data-mui', mui > 0 ? 'duoi' : 'tren'); else kG.current?.removeAttribute('data-mui') }
      // 3 · BẢNG: em tự vuốt xem lại thì đứng yên; em thôi chạm 4 giây mà thầy đang viết trên bảng ⇒ tự về chỗ thầy
      let ve = v.cuon().tay
      if (ve && dangViet && vung === 'bang' && nay - s.lucChamBang > NHUONG_MS) { v.vuotBang(null); ve = false }
      if (ve !== s.ve) { s.ve = ve; if (ve) kB.current?.setAttribute('data-tay', ''); else kB.current?.removeAttribute('data-tay') }
      s.lucKhung = nay
      return v.viTriBut()
    },
    ve: () => veB.current,
    boTay: () => { datTay(null); xep(true) },
    giuTay: () => { if (S.current.bc) datTay(S.current.bc.chia) },
  }), [xep])

  const nay = (): number => performance.now()
  // ── khung giấy: em cuộn bằng tay ⇒ khung nhường (không tự trôi) 4 giây ──
  const emCuon = (): void => { S.current.lucChamGiay = nay(); S.current.dichGiay = null }
  // (chạm = ấn rồi nhả tại chỗ trong 0,3 giây; em vuốt cuộn thì trình duyệt huỷ con trỏ ⇒ hai cú vuốt nhanh KHÔNG bị tính là chạm hai lần)
  const giayXuong = (e: React.PointerEvent): void => { emCuon(); S.current.chamG = { id: e.pointerId, x: e.clientX, y: e.clientY, luc: e.timeStamp } }
  const giayNha = (e: React.PointerEvent): void => {
    const k = S.current.chamG
    S.current.chamG = null
    if (k && k.id === e.pointerId && e.timeStamp - k.luc < 300 && Math.abs(e.clientX - k.x) + Math.abs(e.clientY - k.y) < 12) cham('giay', e.timeStamp)
  }
  const giayCuon = (e: React.UIEvent<HTMLDivElement>): void => { const s = S.current; if (s.dichGiay == null) { s.cuonGiay = e.currentTarget.scrollTop; veB.current?.datCuonGiay(s.cuonGiay) } }
  const toiThay = (e: React.SyntheticEvent): void => { e.stopPropagation(); S.current.lucChamGiay = -1e9 }
  // ── khung bảng: vuốt dọc xem lại phần trên; chạm hai lần phóng kín ──
  const bangXuong = (e: React.PointerEvent<HTMLDivElement>): void => {
    S.current.keoB = { id: e.pointerId, y: toaDo(e).y, keo: false }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ }
  }
  const bangDi = (e: React.PointerEvent<HTMLDivElement>): void => {
    const s = S.current, k = s.keoB
    if (!k || k.id !== e.pointerId) return
    const y = toaDo(e).y
    if (!k.keo && Math.abs(y - k.y) < 7) return
    k.keo = true
    veB.current?.vuotBang(k.y - y)
    k.y = y; s.lucChamBang = nay()
  }
  const bangNha = (e: React.PointerEvent<HTMLDivElement>): void => {
    const k = S.current.keoB
    S.current.keoB = null
    if (k && k.id === e.pointerId && !k.keo && e.type === 'pointerup') cham('bang', e.timeStamp)
  }
  const bangLan = (e: React.WheelEvent): void => { veB.current?.vuotBang(e.deltaY); S.current.lucChamBang = nay() }
  const veThay = (e: React.SyntheticEvent): void => { e.stopPropagation(); veB.current?.vuotBang(null) }
  // ── vạch chia: kéo ngang, thả ra mới xếp lại (lúc kéo chỉ dời vạch — không vẽ lại nét từng li) ──
  const vachXuong = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    S.current.keoV = { id: e.pointerId, x0: toaDo(e).x }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ }
    e.currentTarget.setAttribute('data-keo', '')
  }
  const vachDi = (e: React.PointerEvent<HTMLDivElement>): void => {
    const k = S.current.keoV, b = S.current.bc
    if (!k || k.id !== e.pointerId || !b) return
    const dx = Math.max(b.x0 + b.W * 0.25, Math.min(b.x0 + b.W * 0.8, (b.vach ?? 0) + toaDo(e).x - k.x0)) - (b.vach ?? 0)
    e.currentTarget.style.transform = `translate3d(${dx.toFixed(1)}px,0,0)`
  }
  const vachNha = (e: React.PointerEvent<HTMLDivElement>): void => {
    const s = S.current, k = s.keoV, b = s.bc
    s.keoV = null
    e.currentTarget.removeAttribute('data-keo'); e.currentTarget.style.transform = ''
    if (!k || k.id !== e.pointerId || !b || b.vach == null || !s.kc) return
    const dx = toaDo(e).x - k.x0
    if (Math.abs(dx) < 4) return
    const trai = s.kc.giay.x <= s.kc.bang.x, x = b.vach + dx - b.x0
    datTay(Math.max(0.25, Math.min(0.8, trai ? x / b.W : 1 - x / b.W)))
    xep(true)
  }

  const L = p.lop, bc = d?.bc, oDau = bc && p.dauBang ? oDauBang(bc) : null
  const o = (v: { x: number; y: number; w: number; h: number } | undefined): CSSProperties => ({ position: 'absolute', left: v?.x ?? 0, top: v?.y ?? 0, width: v?.w ?? 0, height: v?.h ?? 0, overflow: 'hidden', transformOrigin: '0 0', willChange: 'transform' })
  // giấy dựng thường (không soi được) ⇒ lớp «đang viết» cắt khỏi khung giấy (nét trên giấy ẩn; nét bảng giữ nguyên)
  const catNet = (): CSSProperties | undefined => {
    if (!bc || p.netGiay || bc.phong === 'bang') return undefined
    const trai = bc.giay.x <= bc.bang.x, mep = Math.max(0, Math.round(trai ? bc.giay.x + bc.giay.w : bc.w - bc.giay.x))
    const cat = trai ? `inset(0 0 0 ${mep}px)` : `inset(0 ${mep}px 0 0)`
    return { WebkitClipPath: cat, clipPath: cat }
  }
  const soi = p.netGiay && !!bc
  /** Chữ đề: giấy soi có khổ gốc ⇒ dựng ở khổ gốc rồi co; còn lại dựng theo khổ trên máy em. Cùng khổ thì KHÔNG dựng lại (khung nở / thu chỉ đổi phép co). */
  const goc0 = soi && p.tamGoc && p.tamGoc.rong > 0 ? p.tamGoc : null
  const rongDung = !bc ? 0 : goc0 ? goc0.rong : soi ? bc.tam.w : bc.giay.w, caoDung = !bc ? 0 : goc0 ? goc0.cao : soi ? bc.tam.h : bc.giay.h
  const dungGiay = p.giay
  const noiDung = useMemo(() => (rongDung > 0 ? dungGiay({ rong: rongDung, cao: caoDung }) : null), [dungGiay, rongDung, caoDung])
  // (cùng MỘT cây phần tử từ khung hình đầu — lớp vẽ giữ canvas và khung bảng suốt đời lớp; chưa có bố cục thì hai khung rỗng, khổ 0)
  return (
    <div ref={goc} className={`${L}-dl`} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} data-phong={bc?.phong || undefined}>
      <div ref={kG} className={`${L}-giay`} style={o(bc?.giay)}>
        <div ref={cuonG} className={`${L}-kg-cuon`} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflowX: 'hidden', overflowY: soi && bc.tam.h > bc.giay.h + 1 ? 'auto' : 'hidden', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
          onPointerDown={giayXuong} onPointerUp={giayNha} onPointerCancel={() => { S.current.chamG = null }} onTouchMove={emCuon} onWheel={emCuon} onScroll={giayCuon}>
          <div className={`${L}-kg-tam`} style={{ position: 'relative', marginLeft: soi ? bc.tam.x : 0, width: soi ? bc.tam.w : '100%', height: soi ? bc.tam.h : '100%' }}>
            <div style={goc0 && bc ? { position: 'absolute', left: 0, top: 0, width: goc0.rong, height: goc0.cao, transformOrigin: '0 0', transform: `scale(${bc.tam.w / goc0.rong})` } : { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>{noiDung}</div>
            <canvas ref={cvChot} className={`${L}-cv`} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', display: p.netGiay ? undefined : 'none' }} />
          </div>
        </div>
        <button type="button" className={`${L}-mui`} data-huong="duoi" onPointerDown={toiThay} onClick={toiThay}>Thầy đang viết ở dưới ↓</button>
        <button type="button" className={`${L}-mui`} data-huong="tren" onPointerDown={toiThay} onClick={toiThay}>Thầy đang viết ở trên ↑</button>
      </div>
      <div ref={kB} className={`${L}-bang`} style={o(bc?.bang)} onPointerDown={bangXuong} onPointerMove={bangDi} onPointerUp={bangNha} onPointerCancel={bangNha} onWheel={bangLan}>
        {/* chỗ lớp vẽ gắn khung cuộn của bảng (nút ngoài React, để riêng một hộp) */}
        <div ref={noiB} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        {p.bangTrong}
        <button type="button" className={`${L}-ve`} onPointerDown={(e) => e.stopPropagation()} onClick={veThay}>Về chỗ thầy đang viết</button>
      </div>
      {oDau ? <div ref={dauB} className={`${L}-dau-bang`} data-hep={oDau.w < DAU_DU || undefined} style={{ position: 'absolute', left: oDau.x, top: oDau.y, width: oDau.w, height: oDau.h, pointerEvents: 'none' }}>{p.dauBang}</div> : null}
      {bc?.vach == null ? null : (
        <div ref={vach} className={`${L}-vach-chia`} role="separator" aria-orientation="vertical" aria-label="Kéo để chia lại bề ngang giấy đề và bảng đen" style={{ position: 'absolute', left: bc.vach - 15, top: bc.giay.y, width: 30, height: bc.giay.h, touchAction: 'none' }}
          onPointerDown={vachXuong} onPointerMove={vachDi} onPointerUp={vachNha} onPointerCancel={vachNha}><i /></div>
      )}
      <div ref={net} className={`${L}-net`} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', transformOrigin: '0 0', ...catNet() }}>
        <canvas ref={cvSong} className={`${L}-cv song`} aria-hidden="true" />
      </div>
    </div>
  )
})
