// XEM LẠI LIVE — TRÌNH PHÁT (đợt X2, thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 2.1, 3, 4.9; bản vẽ ảnh 19–27).
// Phát lại VECTƠ + tiếng: đồng hồ chủ là `audio.currentTime` (buổi không tiếng ⇒ đồng hồ riêng); mỗi khung hình máy phát (`may-phat.ts`) đưa các điểm
// tới hạn vào ĐÚNG lớp vẽ bảng live của máy em (`components/live/ve-bang.ts` + bộ dựng nét `but-bang-loi.ts`) ⇒ hình y như lúc live, sắc ở mọi cỡ.
// Bố cục = bố cục lúc live: giấy đề trái, bảng đen phải; giấy sáng / tối theo THẦY (`buoi.giayToi`). Từ 11/11 chiều: HAI KHUNG CO GIÃN ĐỘC LẬP như bảng live
// (`components/live/KhungDocLap.tsx` + `bo-cuc-doc-lap.ts`): mỗi khung co theo bề ngang của nó, khung thầy đang viết tự nở, em kéo vạch chia / chạm hai lần
// phóng kín được; tua lại ⇒ bảng tới thẳng chỗ nét đang phát, giấy tự trôi theo bút.
// · Phủ kín, luôn NGANG: máy đang cầm dọc ⇒ xoay hình 90° bằng CSS như Live. `nhung` (máy tính): nằm trong trang, điều khiển dưới bảng.
// · Tua = dựng lại từ mốc «bảng mới» gần nhất phía trước; `net.bin` tải theo Range từng khúc (`kho-net.ts`).
// · «Bỏ khoảng lặng», tốc độ 1× / 1,5× / 2×, lùi / tới 10 giây, «Đoạn 3/5», thanh tua chia khúc theo câu + vạch em nói, dải tự ẩn sau 3 giây.
// · Mất mạng: dừng tại chỗ, có mạng phát tiếp. Tệp trả 404 ⇒ thầy đã gỡ buổi (`khiGo`). Máy yếu: 30 khung/giây, bỏ quầng con trỏ.
// AN TOÀN: chỉ đọc ba tệp của buổi qua vé; đề trên giấy là câu trong `buoi.json`.
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { anToanHinh, canXoayCss, giaiTrang, khungChieu } from '../../../components/live/bo-cuc'
import KhungDocLap, { type HinhDL, type TayKhungDL } from '../../../components/live/KhungDocLap'
import { MAU_CHIEU } from '../../../lib/bpu/mau-chieu'
import type { SuKienBut } from '../../../lib/but-bang-loi'
import { TEP_LIVE, type BuoiLiveJson, type DoanBuoiLive } from '../../../lib/live/xem-lai-kieu'
import { BtDong, BtDung, BtLui10, BtPhat, BtToi10 } from './bieu-tuong'
import { nhayLang, taoDongHoRieng, taoLamMuot, tongHang, tuViTriHang, viTriHang } from './dong-ho'
import { taoKhoNet, type KhoNet } from './kho-net'
import { AN_SAU_MS, thanhCau, type MangChang } from './kieu'
import { batVongHoiLai, duongTep, taiKhucNet } from './may-chu'
import { taoMayPhat, type MayPhat } from './may-phat'
import { chuDapAn, gioPhat, mauDoi } from './ten-hien'
import './phat.css'

export interface PropsTrinhPhat {
  goc: string
  buoi: BuoiLiveJson
  ve: string
  /** Hàng phát: các đoạn theo thứ tự buổi («Đoạn 3/5»). */
  hang: DoanBuoiLive[]
  /** Đoạn mở đầu (chỉ số trong hàng). */
  batDau: number
  /** Phát ngay khi sẵn sàng (em vừa bấm một đoạn). */
  tuPhat: boolean
  /** Máy tính: nằm trong trang, điều khiển luôn hiện dưới bảng, không có nút đóng. */
  nhung?: boolean
  /** Lệnh từ trang (máy tính): nhảy tới đoạn `vt` và phát; `so` tăng mỗi lần bấm. */
  lenh?: { vt: number; so: number } | null
  LC: MangChang | null
  tenDoi: readonly string[]
  dong?: () => void
  khiDoan?: (vt: number) => void
  /** Em đã xem (gần) trọn một đoạn ⇒ trang ghi «Đã xem x/y đoạn» trên máy. */
  khiXem: (stt: number) => void
  /** Tệp của buổi trả 404 ⇒ «Thầy đã gỡ buổi này.» */
  khiGo: () => void
}
const TOC_DO = [1, 1.5, 2] as const
/** Đang báo «Mất mạng · đang nối lại…» ⇒ thử lại sau chừng này. */
const THU_LAI_MS = 4000
const mayYeu = (): boolean => typeof document !== 'undefined' && document.documentElement.classList.contains('may-yeu')
class LoiTai extends Error { loai: 'mang' | 'loi' | 'go'; constructor(loai: 'mang' | 'loi' | 'go') { super(loai); this.loai = loai } }
interface BoCuc { xoay: boolean; w: number; h: number }
const giamDong = (): boolean => mayYeu() || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)

/** Tấm giấy đề: khối đề dựng theo bề ngang khung giấy của EM rồi phóng lên cho vừa chiều cao giấy (cùng phép tính lớp bảng live của máy em — hệ số phóng
 *  kẹp theo bề ngang khung ⇒ chữ to tự nhiên theo khổ máy). */
const GiayDe = memo(function GiayDe({ de, khoa, rong, cao }: { de: ReactNode | null; khoa: string; rong: number; cao: number }) {
  const trong = useRef<HTMLDivElement>(null)
  const kMin = Math.max(1, Math.min(1.6, rong / 480)), kMax = Math.max(1.25, Math.min(2.6, rong / 340))
  const [k, setK] = useState(kMin)
  const coDe = de != null
  useLayoutEffect(() => {
    const el = trong.current
    if (!el) return
    const do1 = () => { const h = el.scrollHeight || 1; setK(Math.max(kMin, Math.min(kMax, (cao - 28) / h))) }
    do1()
    if (typeof ResizeObserver !== 'function') return
    const ro = new ResizeObserver(do1)
    ro.observe(el)
    return () => ro.disconnect()
  }, [khoa, rong, cao, coDe, kMin, kMax])
  if (!de) return <p className="xp-giay-trong" style={{ fontSize: Math.max(18, Math.min(34, rong / 18)) }}>Thầy chữa trên bảng</p>
  return <div className="xp-de"><div ref={trong} className="xp-de-trong" style={{ width: (rong - 36) / k, transform: `scale(${k})` }}>{de}</div></div>
})
const khong = () => {}

export default function TrinhPhat({ goc, buoi, ve, hang, batDau, tuPhat, nhung, lenh, LC, tenDoi, dong, khiDoan, khiXem, khiGo }: PropsTrinhPhat) {
  const gocRef = useRef<HTMLDivElement>(null), nen = useRef<HTMLDivElement>(null), thuoc = useRef<HTMLDivElement>(null)
  const kdl = useRef<TayKhungDL>(null)
  const am = useRef<HTMLAudioElement>(null), tua = useRef<HTMLDivElement>(null), gioChu = useRef<HTMLSpanElement>(null)
  const may = useRef<MayPhat | null>(null), kho = useRef<KhoNet | null>(null)
  const bcRef = useRef<BoCuc | null>(null), khoHinh = useRef<HinhDL | null>(null)
  const [bc, setBc] = useState<BoCuc | null>(null)
  const [vt, setVt] = useState(() => Math.max(0, Math.min(batDau, hang.length - 1)))
  const [dangPhat, setDangPhat] = useState(false)
  const [cho, setCho] = useState(true)
  const [matMang, setMatMang] = useState(false)
  const [het, setHet] = useState(false)
  const [tocDo, setTocDo] = useState(1)
  const [boLang, setBoLang] = useState(true)
  const [hien, setHien] = useState(true)
  const [luoc, setLuoc] = useState(0)
  /** Trạng thái chạy (không gây vẽ lại): mọi thứ vòng khung hình đọc. */
  const S = useRef({
    vt: Math.max(0, Math.min(batDau, hang.length - 1)), phat: false, tocDo: 1, boLang: true, luot: 0, daNap: -1, dangNapKe: false, dangDung: false, matMang: false,
    luoc: 0, daBaoXem: -1, gioCuoi: 0, gioMuon: -1, trang: { trang: '', tiLe: 16 / 9 }, giayCu: -1, het: false, lucHien: 0,
  })
  const [rieng] = useState(taoDongHoRieng), [muot] = useState(taoLamMuot)
  const hangRef = useRef(hang)
  const cb = useRef({ khiDoan, khiXem, khiGo })
  // (đặt trước mọi hiệu ứng khác: vòng khung hình và các lệnh tua luôn thấy hàng phát + hàm báo mới nhất)
  useLayoutEffect(() => { hangRef.current = hang; cb.current = { khiDoan, khiXem, khiGo } })
  const coTieng = buoi.coTieng

  // ── đồng hồ ──
  const dangChay = useCallback((): boolean => (coTieng ? !!am.current && !am.current.paused && !am.current.ended : rieng.dangPhat()), [coTieng, rieng])
  const docGio = useCallback((nay: number): number => {
    if (!coTieng) return rieng.doc(nay)
    const a = am.current
    if (!a) return S.current.gioCuoi
    // chưa có siêu dữ liệu: `currentTime` chưa nhận lệnh tua ⇒ dùng mốc đang muốn tới
    if (S.current.gioMuon >= 0 && a.readyState < 1) return S.current.gioMuon
    return muot.doc(a.currentTime * 1000, nay, !a.paused && a.readyState > 2, S.current.tocDo)
  }, [coTieng, rieng, muot])
  const datGio = useCallback((ms: number): void => {
    S.current.gioCuoi = ms
    if (!coTieng) { rieng.dat(ms, performance.now()); return }
    const a = am.current
    S.current.gioMuon = ms
    if (a) { try { a.currentTime = ms / 1000 } catch { /* chưa có siêu dữ liệu: đặt lại ở `loadedmetadata` */ } }
    muot.doc(ms, performance.now(), false, 1)
  }, [coTieng, rieng, muot])
  const dungPhat = useCallback((): void => {
    if (coTieng) { try { am.current?.pause() } catch { /* jsdom */ } } else rieng.dung(performance.now())
  }, [coTieng, rieng])
  const chayPhat = useCallback((): void => {
    if (!coTieng) { rieng.datTocDo(S.current.tocDo, performance.now()); rieng.phat(performance.now()); return }
    const a = am.current
    if (!a) return
    try {
      a.playbackRate = S.current.tocDo
      const h = a.play() as Promise<void> | undefined
      // trình duyệt chặn tự phát (chưa có thao tác của em) ⇒ về tạm dừng, em bấm nút phát to giữa bảng
      if (h && typeof h.catch === 'function') h.catch(() => { if (a.paused) { S.current.phat = false; setDangPhat(false) } })
    } catch { S.current.phat = false; setDangPhat(false) }
  }, [coTieng, rieng])

  // ── bố cục ──
  /** Đo khổ hình + vùng an toàn. Nhúng trong trang (máy tính): hình rộng bằng khung, cao theo tỉ lệ vùng chiếu của thầy. */
  const doHinh = useCallback((): HinhDL => {
    const el = gocRef.current
    const W = nhung ? el?.clientWidth || 800 : window.innerWidth, H0 = window.innerHeight
    const { vung } = giaiTrang(S.current.trang.trang), kc = khungChieu(vung, S.current.trang.tiLe)
    const xoay = !nhung && canXoayCss(W, H0, false)
    const w = xoay ? H0 : W
    const cs = thuoc.current && !nhung ? getComputedStyle(thuoc.current) : null
    const px = (v: string | undefined) => parseFloat(v || '0') || 0
    const at = anToanHinh({ tren: px(cs?.paddingTop), phai: px(cs?.paddingRight), duoi: px(cs?.paddingBottom), trai: px(cs?.paddingLeft) }, xoay)
    return { xoay, w, h: nhung ? Math.round((w * kc.LH) / kc.LW) : xoay ? W : H0, at: nhung ? { trai: 0, phai: 0, duoi: 0, tren: 0 } : at }
  }, [nhung])
  const layHinh = useCallback((): HinhDL => khoHinh.current ?? (khoHinh.current = doHinh()), [doHinh])
  const layTrang = useCallback(() => S.current.trang, [])
  const xep = useCallback(() => {
    const el = gocRef.current
    if (!el) return
    const m = doHinh(), at = m.at
    khoHinh.current = m
    const moi: BoCuc = { xoay: m.xoay, w: m.w, h: m.h }
    bcRef.current = moi
    setBc(moi)
    el.style.setProperty('--xp-at-trai', `${at.trai}px`); el.style.setProperty('--xp-at-phai', `${at.phai}px`); el.style.setProperty('--xp-at-duoi', `${at.duoi}px`)
    kdl.current?.xep()
  }, [doHinh])

  // ── tua / phát ──
  const baoLoi = useCallback((e: unknown) => {
    const loai = e instanceof LoiTai ? e.loai : 'mang'
    if (loai === 'go') { dungPhat(); cb.current.khiGo(); return }
    // mất mạng / máy chủ chưa trả: dừng tại chỗ, tự thử lại
    S.current.matMang = true; setMatMang(true); dungPhat(); setCho(false)
  }, [dungPhat])
  const tuaToi = useCallback(async (vtMoi: number, t: number, phat?: boolean): Promise<void> => {
    const ds = hangRef.current, d = ds[vtMoi], m = may.current, k = kho.current
    if (!d || !m || !k) return
    const luot = ++S.current.luot
    S.current.dangDung = false // lệnh mới thay lệnh cũ còn đang tải dở (lệnh cũ thấy số lượt đã đổi thì tự bỏ)
    if (phat != null) S.current.phat = phat
    if (vtMoi !== S.current.vt || S.current.het) { S.current.luoc = 0; setLuoc(0) }
    S.current.vt = vtMoi; S.current.het = false; S.current.daBaoXem = S.current.daBaoXem === d.stt ? d.stt : -1
    setVt(vtMoi); setHet(false); cb.current.khiDoan?.(vtMoi)
    const tt = Math.max(d.t0, Math.min(t, d.t1))
    const canDung = m.gio() < 0 || tt < m.gio() || k.chiSo(tt) > S.current.daNap
    if (canDung || Math.abs(docGio(performance.now()) - tt) > 300) datGio(tt)
    if (canDung) {
      S.current.dangDung = true; setCho(true)
      try {
        const r = await k.napTu(tt)
        if (luot !== S.current.luot) return
        S.current.daNap = r.den
        m.dungLai(r.muc, tt)
      } catch (e) { if (luot === S.current.luot) { S.current.dangDung = false; baoLoi(e) } return }
      S.current.dangDung = false
    }
    setCho(false)
    if (S.current.matMang) { S.current.matMang = false; setMatMang(false) }
    setDangPhat(S.current.phat)
    if (S.current.phat) chayPhat(); else dungPhat()
  }, [docGio, datGio, baoLoi, chayPhat, dungPhat])
  const tuaRef = useRef(tuaToi)
  useLayoutEffect(() => { tuaRef.current = tuaToi }, [tuaToi])
  const bamPhat = useCallback(() => {
    const ds = hangRef.current
    if (S.current.het) { void tuaRef.current(0, ds[0]?.t0 ?? 0, true); return }
    const moi = !S.current.phat
    void tuaRef.current(S.current.vt, docGio(performance.now()), moi)
  }, [docGio])
  const nhay = useCallback((ms: number) => {
    const ds = hangRef.current
    const den = tuViTriHang(ds, Math.max(0, viTriHang(ds, S.current.vt, docGio(performance.now())) + ms))
    void tuaRef.current(den.vt, den.t)
  }, [docGio])

  // ── lớp vẽ + máy phát + kho nét + vòng khung hình ──
  const daMo = useRef(false)
  useLayoutEffect(() => {
    // lớp vẽ nét nằm trong KhungDocLap (hiệu ứng của nó chạy trước hiệu ứng này)
    const v = kdl.current
    if (!v) return
    const ap = (sk: SuKienBut) => {
      if (sk.loai === 'trang') { const doi = sk.trang !== S.current.trang.trang || sk.tiLe !== S.current.trang.tiLe; S.current.trang = { trang: sk.trang, tiLe: sk.tiLe }; if (doi) xep() }
      v.ap(sk)
    }
    may.current = taoMayPhat(ap)
    kho.current = taoKhoNet({ byteNet: buoi.byteNet, moc: buoi.mocBang, tai: async (tu, den) => { const k = await taiKhucNet(goc, buoi.id, ve, tu, den); if (!k.ok) throw new LoiTai(k.loai); return k.d } })
    S.current.daNap = -1; S.current.luot += 1
    xep()
    // mở đầu: dựng bảng tại đầu đoạn (phát ngay nếu em vừa bấm một đoạn). Hiệu ứng chạy lại (chế độ kiểm của React) ⇒ dựng lại tại chỗ đang đứng.
    { const d0 = hangRef.current[S.current.vt]; if (d0) void tuaRef.current(S.current.vt, S.current.gioCuoi > d0.t0 ? S.current.gioCuoi : d0.t0, daMo.current ? S.current.phat : tuPhat); daMo.current = true }
    const yeu = mayYeu()
    let raf = 0, le = false
    const khung = () => {
      raf = requestAnimationFrame(khung)
      if (yeu && (le = !le)) return // máy yếu: 30 khung / giây
      const ds = hangRef.current, d = ds[S.current.vt], m = may.current, k = kho.current
      if (!d || !m || !k) return
      const nay = performance.now()
      let t = docGio(nay)
      if (dangChay() && !S.current.dangDung) {
        S.current.gioCuoi = t
        if (S.current.boLang) { const den = nhayLang(t, buoi.lang, d); if (den != null) { S.current.luoc += den - t; setLuoc(S.current.luoc); datGio(den); t = den } }
        if (S.current.daBaoXem !== d.stt && t - d.t0 >= (d.t1 - d.t0) * 0.9) { S.current.daBaoXem = d.stt; cb.current.khiXem(d.stt) }
        if (t >= d.t1 - 20) {
          // hết đoạn: sang đoạn kế của hàng, hoặc dừng ở cuối hàng
          if (S.current.vt + 1 < ds.length) void tuaRef.current(S.current.vt + 1, ds[S.current.vt + 1]!.t0)
          else { S.current.phat = false; S.current.het = true; dungPhat(); setDangPhat(false); setHet(true); setHien(true) }
          return
        }
        // sắp sang khúc nét kế ⇒ tải trước
        const ke = S.current.daNap + 1
        if (ke < k.soKhuc && !S.current.dangNapKe && t > k.gioMoc(ke) - 6000) {
          S.current.dangNapKe = true
          const luot = S.current.luot
          k.khuc(ke).then((muc) => { if (luot === S.current.luot && S.current.daNap === ke - 1) { m.nap(muc); S.current.daNap = ke } }, (e) => { if (luot === S.current.luot) baoLoi(e) }).then(() => { S.current.dangNapKe = false })
        }
      }
      if (m.gio() >= 0 && !S.current.dangDung) {
        const f = m.buoc(t)
        // Con trỏ = CÂY BÚT của bảng live (11/11, tro-but.ts): lớp vẽ tự vẽ nó trên lớp «đang viết», ngòi ở đúng đầu nét, bảng đã cuộn thì trôi theo;
        // khung thầy đang viết tự nở, giấy tự trôi theo bút (KhungDocLap).
        const dn = f.dau.length ? f.dau[f.dau.length - 1]! : null
        v.khung(nay, f.dau, f.tro ? { x: f.tro.x, y: f.tro.y, cham: !!dn, net: dn?.id } : null)
      }
      // thanh tua + giờ: đổi thẳng DOM (không vẽ lại React mỗi khung)
      const ray = tua.current?.children[S.current.vt]?.querySelector<HTMLElement>('.xp-ray')
      if (ray) ray.style.setProperty('--xp-f', Math.min(1, Math.max(0, (t - d.t0) / Math.max(1, d.t1 - d.t0))).toFixed(4))
      const giay = Math.floor(viTriHang(ds, S.current.vt, t) / 1000)
      if (giay !== S.current.giayCu && gioChu.current) { S.current.giayCu = giay; gioChu.current.textContent = gioPhat(giay * 1000) }
    }
    raf = requestAnimationFrame(khung)
    return () => { cancelAnimationFrame(raf); may.current = null; kho.current = null }
  }, [buoi, goc, ve, xep, docGio, datGio, dangChay, dungPhat, baoLoi]) // eslint-disable-line react-hooks/exhaustive-deps -- `tuPhat` chỉ đọc lúc mở
  // lệnh từ trang (máy tính): bấm một đoạn trong danh sách / ảnh bìa
  const lenhSo = lenh?.so ?? 0
  useEffect(() => {
    if (!lenh || !lenhSo) return
    const d = hangRef.current[lenh.vt]
    if (d) void tuaRef.current(lenh.vt, d.t0, true)
  }, [lenhSo]) // eslint-disable-line react-hooks/exhaustive-deps -- chỉ chạy khi số lệnh tăng
  // đổi cỡ / xoay máy
  useEffect(() => {
    const f = () => xep()
    window.addEventListener('resize', f); window.addEventListener('orientationchange', f)
    let ro: ResizeObserver | null = null
    if (nhung && typeof ResizeObserver === 'function' && gocRef.current) { ro = new ResizeObserver(f); ro.observe(gocRef.current) }
    return () => { window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f); ro?.disconnect() }
  }, [xep, nhung])
  // rời màn (đổi tab, khoá máy) ⇒ tạm dừng; mất mạng ⇒ dừng tại chỗ; có mạng ⇒ phát tiếp từ chỗ dừng
  useEffect(() => {
    const an = () => { if (document.hidden && S.current.phat) { S.current.phat = false; dungPhat(); setDangPhat(false) } }
    const mat = () => { if (!S.current.matMang) { S.current.matMang = true; setMatMang(true); dungPhat() } }
    const noi = () => {
      if (!S.current.matMang) return
      const a = am.current
      if (a && a.error) { try { a.load() } catch { /* jsdom */ } }
      void tuaRef.current(S.current.vt, S.current.gioCuoi)
    }
    document.addEventListener('visibilitychange', an); window.addEventListener('offline', mat); window.addEventListener('online', noi)
    // đang báo mất mạng ⇒ tự thử lại, lượt sau chỉ hẹn khi lượt trước xong, không `setInterval` (cùng luật vòng hỏi trực tiếp của app)
    const dungVong = batVongHoiLai(() => { if (S.current.matMang && (typeof navigator === 'undefined' || navigator.onLine !== false)) noi() }, THU_LAI_MS)
    return () => { document.removeEventListener('visibilitychange', an); window.removeEventListener('offline', mat); window.removeEventListener('online', noi); dungVong() }
  }, [dungPhat])
  // tiếng: tua trước khi có siêu dữ liệu, đang đệm, lỗi tệp (404 = thầy đã gỡ)
  useEffect(() => {
    const a = am.current
    if (!a) return
    const meta = () => { if (S.current.gioMuon >= 0 && Math.abs(a.currentTime * 1000 - S.current.gioMuon) > 300) { try { a.currentTime = S.current.gioMuon / 1000 } catch { /* bỏ */ } } a.playbackRate = S.current.tocDo }
    const doi = () => setCho(true), xong = () => { if (!S.current.dangDung) setCho(false) }
    const loi = () => {
      void taiKhucNet(goc, buoi.id, ve, 0, 1).then((k) => { if (!k.ok && k.loai === 'go') cb.current.khiGo(); else baoLoi(new LoiTai('mang')) })
    }
    a.addEventListener('loadedmetadata', meta); a.addEventListener('waiting', doi); a.addEventListener('playing', xong); a.addEventListener('canplay', xong); a.addEventListener('error', loi)
    return () => { a.removeEventListener('loadedmetadata', meta); a.removeEventListener('waiting', doi); a.removeEventListener('playing', xong); a.removeEventListener('canplay', xong); a.removeEventListener('error', loi); try { a.pause() } catch { /* jsdom */ } }
  }, [goc, buoi.id, ve, baoLoi])
  // dải điều khiển tự ẩn sau 3 giây khi đang phát (chỉ bản phủ kín)
  const [nhip, setNhip] = useState(0)
  /** Em vừa chạm / rê chuột ⇒ hiện dải + đếm lại 3 giây (rê chuột liên tục: nửa giây mới đếm lại một lần). */
  const giuHien = useCallback(() => {
    setHien(true)
    const nay = Date.now()
    if (nay - S.current.lucHien > 500) { S.current.lucHien = nay; setNhip((n) => n + 1) }
  }, [])
  useEffect(() => {
    if (nhung || !dangPhat || !hien || matMang) return
    const h = setTimeout(() => setHien(false), AN_SAU_MS)
    return () => clearTimeout(h)
  }, [nhung, dangPhat, hien, matMang, nhip])
  // phím: cách = phát / tạm dừng, ← → = lùi / tới 10 giây, Esc = đóng
  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      const dich = e.target as HTMLElement | null
      if (nhung && !gocRef.current?.contains(dich)) return
      if (e.key === ' ' && dich?.tagName !== 'BUTTON') { e.preventDefault(); bamPhat() }
      else if (e.key === 'ArrowLeft') nhay(-10_000)
      else if (e.key === 'ArrowRight') nhay(10_000)
      else if (e.key === 'Escape' && !nhung) dong?.()
      else return
      giuHien()
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [nhung, bamPhat, nhay, dong, giuHien])

  const doiTocDo = useCallback((v: number) => { S.current.tocDo = v; setTocDo(v); if (coTieng) { if (am.current) am.current.playbackRate = v } else rieng.datTocDo(v, performance.now()) }, [coTieng, rieng])
  const doiLang = () => { S.current.boLang = !S.current.boLang; setBoLang(S.current.boLang) }
  /** Chạm / kéo trên thanh tua: khúc nào + tới đâu trong khúc (hình xoay 90° ⇒ trục dọc của màn là trục ngang của hình). */
  const keo = useRef<{ id: number; luc: number } | null>(null)
  const tuaTheo = (e: React.PointerEvent<HTMLDivElement>, chot: boolean) => {
    const o = tua.current
    if (!o) return
    const xoay = !!bcRef.current?.xoay, p = xoay ? e.clientY : e.clientX
    const ds = hangRef.current
    for (let i = 0; i < o.children.length && i < ds.length; i++) {
      const r = o.children[i]!.getBoundingClientRect(), a = xoay ? r.top : r.left, dai = xoay ? r.height : r.width
      if (p <= a + dai + 2 || i === ds.length - 1) {
        if (!chot && e.timeStamp - (keo.current?.luc ?? 0) < 140) return
        if (keo.current) keo.current.luc = e.timeStamp
        const f = Math.min(1, Math.max(0, (p - a) / Math.max(1, dai)))
        void tuaRef.current(i, ds[i]!.t0 + (ds[i]!.t1 - ds[i]!.t0) * Math.min(f, 0.995))
        return
      }
    }
  }
  const tuaXuong = (e: React.PointerEvent<HTMLDivElement>) => { keo.current = { id: e.pointerId, luc: 0 }; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ } tuaTheo(e, true); giuHien() }
  const tuaDi = (e: React.PointerEvent<HTMLDivElement>) => { if (keo.current?.id === e.pointerId) { tuaTheo(e, false); giuHien() } }
  const tuaNha = (e: React.PointerEvent<HTMLDivElement>) => { if (keo.current?.id === e.pointerId) { keo.current = null; tuaTheo(e, true) } }
  const chamNen = () => { if (nhung) { bamPhat(); return } if (hien && S.current.phat) setHien(false); else giuHien() }

  const d = hang[vt], cau = d ? buoi.cau.find((c) => c.so === d.cau) ?? null : null
  const q = cau ? thanhCau(cau) : null
  const kieuChang = typeof document !== 'undefined' && !!document.documentElement.dataset.trong
  const de = cau && q && LC ? <div className={kieuChang ? 'ht-app ht2-lam duo bpu-de-chang' : undefined} data-duo={kieuChang ? '' : undefined}>
    <LC.DeCau q={q} stt={cau.so} />
    {cau.tuLuan ? null : cau.phan === 'I' && q.choices.length ? <LC.ChonTracNghiem q={q} value="" onChon={khong} khoa /> : cau.phan === 'II' && q.ideas.length ? <LC.ChonDungSai q={q} value="" onChon={khong} khoa /> : null}
    {cau.dung ? <p className="xp-dap">Đáp án đúng<b>{chuDapAn(cau)}</b></p> : null}
  </div> : cau && q ? <p style={{ fontSize: 20, margin: 0 }}>{q.text}</p> : null
  const tong = tongHang(hang)
  const khoaDe = `${cau?.qid ?? ''}|${LC ? 1 : 0}`
  const dungGiay = useCallback(({ rong, cao }: { rong: number; cao: number }) => <GiayDe de={de} khoa={khoaDe} rong={rong} cao={cao} />, [de, khoaDe]) // eslint-disable-line react-hooks/exhaustive-deps -- `de` dựng lại mỗi lượt vẽ; khoá theo câu
  const kieu: CSSProperties = { ...(MAU_CHIEU as CSSProperties), ['--doi' as string]: mauDoi(d?.lenBang?.doi), ...(bc && !nhung ? { width: bc.w, height: bc.h } : null) }
  const an = !nhung && !hien && dangPhat && !matMang
  const hinh = (
    <div ref={gocRef} className="xp" data-nhung={nhung || undefined} data-xoay={bc?.xoay || undefined} data-an={an || undefined} data-giay={buoi.giayToi ? 'toi' : 'sang'} style={kieu}
      role={nhung ? 'region' : 'dialog'} aria-modal={nhung ? undefined : true} aria-label={`Xem lại đoạn chữa bài${d ? `: ${d.ten}` : ''}`} tabIndex={nhung ? 0 : undefined} onPointerMove={nhung ? undefined : giuHien}>
      <div ref={thuoc} className="xp-thuoc" aria-hidden="true" />
      {coTieng ? <audio ref={am} src={duongTep(goc, buoi.id, TEP_LIVE.tieng, ve)} preload="metadata" /> : null}
      <div ref={nen} className="xp-nen" style={nhung && bc ? { height: bc.h } : undefined} onClick={chamNen}>
        {/* GIẤY ĐỀ + BẢNG ĐEN: hai khung co giãn độc lập như bảng live (giấy ở đây dựng theo khối đề của chặng ⇒ `tiLeChu` null: chữ không phụ thuộc bề ngang khung) */}
        <KhungDocLap ref={kdl} lop="xp" layHinh={layHinh} layTrang={layTrang} netGiay tiLeChu={null} tuUuTien={!mayYeu()} dong={!giamDong()} giay={dungGiay} />
        {!dangPhat && !cho && !matMang ? <button type="button" className="xp-giua" onClick={(e) => { e.stopPropagation(); bamPhat() }} aria-label={het ? 'Phát lại từ đầu' : 'Phát'}><BtPhat s={38} /></button> : null}
        {luoc >= 1000 && boLang ? <div className="xp-luoc so" role="status">Đã lược {gioPhat(Math.round(luoc / 1000) * 1000)} khoảng lặng</div> : null}
        {matMang ? <div className="xp-mat" role="status"><i aria-hidden="true" />Mất mạng · đang nối lại…</div> : null}
      </div>
      {nhung ? null : <div className="xp-tren">
        <button type="button" className="xp-dong" onClick={dong} aria-label="Đóng trình phát"><BtDong /></button>
      </div>}
      <div className="xp-day" onPointerDown={giuHien}>
        <div className="xp-ten"><i className="xp-cham" aria-hidden="true" /><b>{d?.ten ?? ''}{d?.lenBang && tenDoi[d.lenBang.doi] ? ` · ${tenDoi[d.lenBang.doi]}` : ''}</b><span className="so">Đoạn {vt + 1}/{hang.length}</span></div>
        <div ref={tua} className="xp-tua" role="slider" aria-label="Thanh tua theo câu" aria-valuemin={0} aria-valuemax={Math.round(tong / 1000)} aria-valuenow={Math.round(viTriHang(hang, vt, d?.t0 ?? 0) / 1000)} aria-valuetext={d ? `Đoạn ${vt + 1}/${hang.length}: ${d.ten}` : undefined} tabIndex={0}
          onPointerDown={tuaXuong} onPointerMove={tuaDi} onPointerUp={tuaNha} onPointerCancel={tuaNha}>
          {hang.map((x, i) => {
            const dai = Math.max(1, x.t1 - x.t0)
            return <div key={x.stt} className={`xp-khuc${i === vt ? ' nay' : ''}`} style={{ flex: `${dai} 1 0`, ['--doi' as string]: mauDoi(x.lenBang?.doi) }}>
              <small>Câu {x.cau}</small>
              <div className={`xp-ray${i < vt || (het && i === vt) ? ' xong' : ''}`} style={i === vt ? undefined : { ['--xp-f' as string]: 0 }}>
                <i />{i === vt ? <u /> : null}{x.dangXem ? <em title="Đoạn đáng xem" /> : null}
                {buoi.emNoi.filter((n) => n.t1 > x.t0 && n.t0 < x.t1).map((n, j) => <s key={j} title={`${n.ten} nói`} style={{ left: `${(Math.max(0, n.t0 - x.t0) / dai) * 100}%`, width: `${((Math.min(n.t1, x.t1) - Math.max(n.t0, x.t0)) / dai) * 100}%`, ['--doi' as string]: mauDoi(n.doi) }} />)}
              </div>
            </div>
          })}
        </div>
        <div className="xp-nut">
          <button type="button" className="xp-n" onClick={() => nhay(-10_000)} aria-label="Lùi 10 giây"><BtLui10 /></button>
          <button type="button" className="xp-n chinh" data-cho={cho && dangPhat ? '' : undefined} onClick={bamPhat} aria-label={het ? 'Phát lại từ đầu' : dangPhat ? 'Tạm dừng' : 'Phát'}>{dangPhat ? <BtDung s={24} /> : <BtPhat s={24} />}</button>
          <button type="button" className="xp-n" onClick={() => nhay(10_000)} aria-label="Tới 10 giây"><BtToi10 /></button>
          <span className="xp-gio so"><span ref={gioChu} style={{ color: 'inherit' }}>0:00</span> <span>/ {gioPhat(tong)}</span></span>
          {coTieng ? null : <span className="xp-kt">Buổi này không có tiếng</span>}
          <div className="xp-td" role="group" aria-label="Tốc độ phát">{TOC_DO.map((v) => <button key={v} type="button" aria-pressed={tocDo === v} onClick={() => doiTocDo(v)} aria-label={`Tốc độ ${String(v).replace('.', ',')} lần`}>{String(v).replace('.', ',')}×</button>)}</div>
          <button type="button" className="xp-lang" role="switch" aria-checked={boLang} onClick={doiLang}><span>Bỏ khoảng lặng</span><i aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )
  // bản phủ kín gắn thẳng vào <body>: không nằm trong khung cuộn của trang buổi (iPhone đời cũ xử lí `position: fixed` trong khung cuộn không ổn)
  return nhung ? hinh : createPortal(hinh, document.body)
}
