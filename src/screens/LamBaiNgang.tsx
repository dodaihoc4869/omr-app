// BỐ CỤC LÀM BÀI NGANG — theo bản vẽ thầy chốt 28/09 (docs/ban-ve-lam-bai-ngang-2809/LamBai-Ngang.html):
//   TRÁI: khung ĐỀ cuộn riêng (thẻ câu TheCau của màn thi, truyền vào qua `children`) + cỡ chữ A−/A+ + chuyển phần.
//   GIỮA: THANH KÉO (chuột/cảm ứng, bấm đúp về 58 %, phím mũi tên khi có tiêu điểm, nhớ tỉ lệ, 35–75 %).
//   PHẢI: đồng hồ lớn (vàng ≤ 10 phút, đỏ ≤ 5 phút) · "Đã làm x/y" · trạng thái lưu · Nộp bài · PHIẾU ĐÁP ÁN.
// CHỈ TRÌNH BÀY: mọi dữ liệu (đáp án, cờ, giờ, lưu) và mọi hành động do ExamTakeScreen truyền vào — xoay qua lại
// giữa dọc/ngang không mất gì vì state nằm ở màn thi. Chọn trong đề hay trên phiếu đều gọi CÙNG một hàm ghi.
// Phiếu Phần I/II hiện chữ cái / ý THEO THỨ TỰ ĐÃ XÁO của em (giống đề em đang nhìn); màn thi quy về gốc khi ghi.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { dangGoChu, docPhim, docTiLe, ghiTiLe, kepTiLe, mucDongHo, TI_LE_MAC_DINH, tiLeTheoPhim, type BoCuc } from '../lib/lam-bai-ngang'
import './lam-bai-ngang.css'
import { dinhDangDongHo, useGiayConLai, type KhoGio } from '../lib/dong-ho-thi'

// Biểu tượng nét mảnh vẽ tại chỗ (không kéo thêm mảnh lucide dùng chung vào precache — build:cf đếm tệp).
function Net({ size = 16, children, fill = 'none' }: { size?: number; children: ReactNode; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
const Timer = ({ size }: { size?: number }) => (
  <Net size={size}>
    <path d="M10 2h4M12 14l3-3" />
    <circle cx="12" cy="14" r="8" />
  </Net>
)
const Flag = ({ size, fill }: { size?: number; fill?: string }) => (
  <Net size={size} fill={fill}>
    <path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 8 2a6 6 0 0 0 4-1.5V14a6 6 0 0 1-4 1.5c-3 0-5-2-8-2a6 6 0 0 0-4 1.5" />
  </Net>
)
const Check = ({ size }: { size?: number }) => (
  <Net size={size}>
    <path d="M20 6 9 17l-5-5" />
  </Net>
)
const CloudOff = ({ size }: { size?: number }) => (
  <Net size={size}>
    <path d="m2 2 20 20M5.8 5.8A7 7 0 0 0 9 20h9a5 5 0 0 0 1.7-.3M22 15.5A4.5 4.5 0 0 0 17.5 11h-1.8A7 7 0 0 0 11 6.2" />
  </Net>
)
const Keyboard = ({ size }: { size?: number }) => (
  <Net size={size}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 15h10" />
  </Net>
)
const X = ({ size }: { size?: number }) => (
  <Net size={size}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Net>
)

export type PhanCau = 'I' | 'II' | 'III'
export interface CauPhieu {
  stt: number
  phan: PhanCau
  /** Phần I: vị trí HIỆN RA (0..3) của phương án em chọn; chưa chọn ⇒ null. */
  chon?: number | null
  /** Phần II: giá trị 4 ý THEO THỨ TỰ HIỆN RA (a..d). */
  y?: ('D' | 'S' | null)[]
  /** Phần III: chuỗi em gõ. */
  tl?: string
  daLam: boolean
  danhDau: boolean
}

export interface LamBaiNgangProps {
  boCuc: Exclude<BoCuc, 'doc'>
  tenCa: string
  cau: CauPhieu[]
  onChonPa: (stt: number, viTri: number) => void
  onGhiY: (stt: number, viTri: number, gt: 'D' | 'S') => void
  onNhap: (stt: number, text: string) => void
  /** Ô đáp số Phần III (màn thi dựng bằng `ONhapDapSo` chuanViet). Truyền vào thay vì import để mảnh ngang không tách
   * `ONhapDapSo` khỏi mảnh dùng chung hiện có (precache giữ nguyên số tệp). */
  oDapSo: (p: { value: string; onChange: (v: string) => void; ariaLabel: string }) => ReactNode
  onDoiDau: (stt: number) => void
  /** Chuỗi mm:ss; bài tập về nhà ⇒ null và hiện `chuThayDongHo`. */
  dongHo: string | null
  chuThayDongHo: string
  conGiay: number | null
  /** Kho giờ sống (màn thi): có ⇒ ô giờ TỰ đếm từng giây trong nút lá `OGioSong`,
   * bỏ qua `dongHo`/`conGiay` (trừ `dongHo === null` = bài tập). Gốc màn thi không
   * phải vẽ lại cả phiếu + đề mỗi giây. */
  khoGio?: KhoGio | null
  /** "11:08" — giờ hết bài (theo máy chủ); không có ⇒ không hiện dòng này. */
  hetGioLuc?: string
  daLam: number
  tong: number
  nhanLuu: string
  mayNgoaiMang: boolean
  dangLuu: boolean
  nhanNutNop: ReactNode
  khoaNop: boolean
  ghiChuNop?: string
  onNop: () => void
  /** Đang có hộp thoại / tấm che ⇒ tắt phím tắt. */
  tatPhim: boolean
  cauBatDau: number
  onCauDangXem: (stt: number) => void
  /** Dải cảnh báo rời màn / báo thêm giờ — đặt trên đầu khung đề. */
  tren?: ReactNode
  /** Tấm phủ Giữ để đọc (trongKhung) — phủ đúng khung đề. */
  phuDe?: ReactNode
  /** Công cụ đặt cạnh cụm A−/A+ ở đầu cột đề (nút "Dịu mắt") — luôn thấy, kể cả toàn màn hình. */
  congCu?: ReactNode
  children: ReactNode
}

/** Ô đồng hồ (trình bày thuần): đổi màu vàng ≤ 10 phút, đỏ ≤ 5 phút. */
function OGio({ dongHo, conGiay, chuThayDongHo, hetGioLuc }: { dongHo: string | null; conGiay: number | null; chuThayDongHo: string; hetGioLuc?: string }) {
  const muc = dongHo === null ? '' : mucDongHo(conGiay)
  return (
    <div className="lb-gio" data-muc={muc || undefined} role="timer" aria-label={dongHo === null ? chuThayDongHo : `Thời gian còn lại ${dongHo}`}>
      <div className="lb-gio-nhan">
        <Timer size={15} />
        <span>{dongHo === null ? 'Bài tập về nhà' : muc === 'do' ? 'Còn dưới 5 phút' : muc === 'vang' ? 'Còn dưới 10 phút' : 'Thời gian còn lại'}</span>
      </div>
      <div className="lb-gio-so">{dongHo ?? chuThayDongHo}</div>
      {dongHo !== null && hetGioLuc && <div className="lb-gio-phu">Hết giờ lúc {hetGioLuc}</div>}
    </div>
  )
}

/** Nút lá nghe kho giờ — chỉ mình nó vẽ lại mỗi giây. */
function OGioSong({ kho, chuThayDongHo, hetGioLuc }: { kho: KhoGio; chuThayDongHo: string; hetGioLuc?: string }) {
  const giay = useGiayConLai(kho)
  return <OGio dongHo={dinhDangDongHo(giay ?? 0)} conGiay={giay} chuThayDongHo={chuThayDongHo} hetGioLuc={hetGioLuc} />
}

const TEN_PHAN: Record<PhanCau, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const CO_MIN = 17
const CO_MAX = 24
const KHOA_CO = 'ddh.lamBaiNgang.coChu'
const docCo = () => {
  try {
    const n = Number(localStorage.getItem(KHOA_CO))
    return n >= CO_MIN && n <= CO_MAX ? n : 18
  } catch {
    return 18
  }
}
const giamDong = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function LamBaiNgang(p: LamBaiNgangProps) {
  const { cau, boCuc } = p
  const khungRef = useRef<HTMLDivElement>(null)
  const deRef = useRef<HTMLDivElement>(null)
  const phieuRef = useRef<HTMLDivElement>(null)
  const [tiLe, setTiLe] = useState(() => docTiLe())
  const [dangKeo, setDangKeo] = useState(false)
  const [coChu, setCoChu] = useState(docCo)
  const [dangXem, setDangXem] = useState(() => Math.max(1, Math.min(cau.length, p.cauBatDau || 1)))
  const [yChon, setYChon] = useState(0)
  const [moPhim, setMoPhim] = useState(false)
  const tuCuonRef = useRef(0)
  const dangXemRef = useRef(dangXem)
  dangXemRef.current = dangXem
  const onCauDangXemRef = useRef(p.onCauDangXem)
  onCauDangXemRef.current = p.onCauDangXem

  const datDangXem = useCallback((n: number) => {
    setDangXem((cu) => {
      if (cu !== n) setYChon(0)
      return n
    })
    onCauDangXemRef.current(n)
  }, [])

  // ---------------------------------------------------------------- cuộn đề ↔ phiếu
  const cuonDeToi = useCallback((n: number, muot = true) => {
    const khung = deRef.current
    const el = document.getElementById(`cau-${n}`)
    if (!khung || !el) return
    // Đầu phần dính (PHẦN I — …) nằm đè mép trên khung ⇒ chừa đúng chiều cao của nó, số câu không bị che.
    const dau = khung.querySelector<HTMLElement>('.sticky')
    const top = el.getBoundingClientRect().top - khung.getBoundingClientRect().top + khung.scrollTop - 8 - (dau?.offsetHeight ?? 0)
    tuCuonRef.current = Date.now()
    if (typeof khung.scrollTo === 'function') khung.scrollTo({ top, behavior: muot && !giamDong() ? 'smooth' : 'auto' })
    else khung.scrollTop = top
  }, [])
  const trongTam = (n: number) => {
    const khung = deRef.current
    const el = document.getElementById(`cau-${n}`)
    if (!khung || !el) return true
    const r = el.getBoundingClientRect()
    const k = khung.getBoundingClientRect()
    return r.top >= k.top - 4 && r.top < k.bottom - 120
  }
  const toiCau = useCallback(
    (n: number, cuon = true) => {
      const m = Math.max(1, Math.min(cau.length, n))
      datDangXem(m)
      if (cuon) cuonDeToi(m)
    },
    [cau.length, cuonDeToi, datDangXem],
  )

  // Mở bố cục (kể cả sau khi xoay máy): đưa câu em đang xem lên đầu khung đề, không trượt.
  useLayoutEffect(() => {
    cuonDeToi(dangXemRef.current, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const khung = deRef.current
    if (!khung) return
    let raf = 0
    const khiCuon = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (Date.now() - tuCuonRef.current < 700) return // đang cuộn do bấm số câu — giữ câu đã chọn
        const moc = khung.getBoundingClientRect().top + khung.clientHeight * 0.28
        let chon = 1
        for (const el of Array.from(khung.querySelectorAll<HTMLElement>('[id^="cau-"]'))) {
          if (el.getBoundingClientRect().top <= moc) chon = Number(el.id.slice(4)) || chon
          else break
        }
        if (chon !== dangXemRef.current) datDangXem(chon)
      })
    }
    khung.addEventListener('scroll', khiCuon, { passive: true })
    return () => {
      khung.removeEventListener('scroll', khiCuon)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [datDangXem])

  // Câu đang xem: viền trong đề (thuộc tính DOM, không render lại thẻ câu) + giữ hàng phiếu trong tầm nhìn.
  useEffect(() => {
    const khung = deRef.current
    khung?.querySelectorAll('[data-lb-dang-xem]').forEach((e) => e.removeAttribute('data-lb-dang-xem'))
    document.getElementById(`cau-${dangXem}`)?.setAttribute('data-lb-dang-xem', '')
    const phieu = phieuRef.current
    const hang = phieu?.querySelector<HTMLElement>(`[data-hang="${dangXem}"]`)
    if (!phieu || !hang || typeof phieu.scrollBy !== 'function') return
    const r = hang.getBoundingClientRect()
    const k = phieu.getBoundingClientRect()
    if (r.top < k.top + 8) phieu.scrollBy({ top: r.top - k.top - 40 })
    else if (r.bottom > k.bottom - 8) phieu.scrollBy({ top: r.bottom - k.bottom + 40 })
  }, [dangXem])

  // ---------------------------------------------------------------- phím tắt
  const pRef = useRef(p)
  pRef.current = p
  const yChonRef = useRef(yChon)
  yChonRef.current = yChon
  useEffect(() => {
    const xuong = (e: KeyboardEvent) => {
      const pp = pRef.current
      if (pp.tatPhim || e.ctrlKey || e.metaKey || e.altKey) return
      if (dangGoChu(document.activeElement)) {
        // Esc trong ô đáp số ⇒ rời ô để dùng lại phím tắt.
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur()
        return
      }
      if ((document.activeElement as HTMLElement | null)?.dataset?.lbKeo !== undefined) return
      // Phím cách = Giữ để đọc (màn thi lo). Ở đây chỉ chặn việc cuộn trang / bấm nút đang có tiêu điểm.
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        return
      }
      const n = dangXemRef.current
      const c = pp.cau[n - 1]
      if (!c) return
      const hd = docPhim(e.key, c.phan)
      if (!hd) return
      e.preventDefault()
      if (hd.loai === 'sau') toiCau(n + 1)
      else if (hd.loai === 'truoc') toiCau(n - 1)
      else if (hd.loai === 'danh-dau') pp.onDoiDau(n)
      else if (hd.loai === 'bang-phim') setMoPhim(true)
      else if (hd.loai === 'chon-pa') pp.onChonPa(n, hd.viTri)
      else if (hd.loai === 'chon-y') setYChon(hd.viTri)
      else if (hd.loai === 'ghi-y') {
        pp.onGhiY(n, yChonRef.current, hd.gt)
        setYChon((y) => Math.min(3, y + 1))
      } else if (hd.loai === 'vao-o') document.querySelector<HTMLInputElement>(`[data-hang="${n}"] input`)?.focus()
    }
    const len = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.code === 'Space') && !dangGoChu(document.activeElement) && !pRef.current.tatPhim) e.preventDefault()
    }
    document.addEventListener('keydown', xuong)
    document.addEventListener('keyup', len)
    return () => {
      document.removeEventListener('keydown', xuong)
      document.removeEventListener('keyup', len)
    }
  }, [toiCau])
  useEffect(() => {
    if (!moPhim) return
    const dong = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoPhim(false)
    }
    document.addEventListener('keydown', dong)
    return () => document.removeEventListener('keydown', dong)
  }, [moPhim])

  // ---------------------------------------------------------------- thanh kéo
  const datTi = (v: number, luu = true) => {
    const t = kepTiLe(v)
    setTiLe(t)
    if (luu) ghiTiLe(t)
  }
  const keoXuong = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    const thanh = e.currentTarget
    try {
      thanh.setPointerCapture(e.pointerId)
    } catch {
      /* jsdom / trình duyệt cũ */
    }
    setDangKeo(true)
    const neo = dangXemRef.current
    let cuoi = tiLe
    const di = (ev: PointerEvent) => {
      const r = khungRef.current?.getBoundingClientRect()
      if (!r || r.width <= 16) return
      cuoi = kepTiLe((ev.clientX - r.left - 8) / (r.width - 16))
      setTiLe(cuoi)
    }
    const tha = () => {
      setDangKeo(false)
      ghiTiLe(cuoi)
      thanh.removeEventListener('pointermove', di)
      thanh.removeEventListener('pointerup', tha)
      thanh.removeEventListener('pointercancel', tha)
      requestAnimationFrame(() => cuonDeToi(neo, false)) // chữ dàn lại dòng ⇒ giữ câu đang đọc ở đầu khung
    }
    thanh.addEventListener('pointermove', di)
    thanh.addEventListener('pointerup', tha)
    thanh.addEventListener('pointercancel', tha)
  }
  const keoPhim = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const moi = tiLeTheoPhim(tiLe, e.key, e.shiftKey)
    if (moi === null) return
    e.preventDefault()
    e.stopPropagation()
    datTi(moi)
  }

  const doiCo = (d: number) => {
    const n = Math.max(CO_MIN, Math.min(CO_MAX, coChu + d))
    setCoChu(n)
    try {
      localStorage.setItem(KHOA_CO, String(n))
    } catch {
      /* chỉ mất tiện nhớ */
    }
    requestAnimationFrame(() => cuonDeToi(dangXemRef.current, false))
  }

  // ---------------------------------------------------------------- số liệu
  const theoPhan = (ph: PhanCau) => cau.filter((c) => c.phan === ph)
  const phanCo = (['I', 'II', 'III'] as PhanCau[]).filter((ph) => cau.some((c) => c.phan === ph))
  const soDanhDau = cau.filter((c) => c.danhDau).length
  const pt = Math.round(tiLe * 100)
  const phanDangXem = cau[dangXem - 1]?.phan

  const nutSo = (c: CauPhieu) => (
    <button
      type="button"
      className="lb-so"
      data-tt={c.daLam ? 'xong' : 'chua'}
      data-co={c.danhDau ? '' : undefined}
      aria-label={`Tới câu ${c.stt} — ${c.daLam ? 'đã làm' : 'chưa làm'}${c.danhDau ? ', đã đánh dấu xem lại' : ''}`}
      onClick={() => toiCau(c.stt)}
    >
      {c.stt}
      {c.danhDau && (
        <span className="lb-so-co" aria-hidden="true">
          <Flag size={9} fill="currentColor" />
        </span>
      )}
    </button>
  )
  const chamCau = (n: number) => {
    if (n !== dangXemRef.current) toiCau(n, !trongTam(n))
  }

  return (
    <div
      ref={khungRef}
      className="lb-khung"
      data-bo-cuc={boCuc}
      data-dang-keo={dangKeo ? '' : undefined}
      style={{ gridTemplateColumns: `minmax(0, ${Math.round(tiLe * 1000) / 10}fr) 16px minmax(0, ${Math.round((1 - tiLe) * 1000) / 10}fr)` }}
    >
      {/* ===== TRÁI: ĐỀ ===== */}
      <section className="lb-de-khung" aria-label="Đề bài">
        <header className="lb-de-dau">
          <div className="lb-de-dau-hang">
            <div className="lb-ten-ca">
              <b>{p.tenCa.trim() || 'Bài làm'}</b>
              <span>
                {p.tong} câu · Phím tắt: bấm <kbd>?</kbd>
              </span>
            </div>
            {p.congCu}
            <div className="lb-co-chu" role="group" aria-label="Cỡ chữ đề">
              <button type="button" onClick={() => doiCo(-1)} disabled={coChu <= CO_MIN} aria-label="Chữ đề nhỏ lại">
                A−
              </button>
              <span className="lb-co-so" aria-live="polite">
                <b>{coChu}</b> px
              </span>
              <button type="button" onClick={() => doiCo(1)} disabled={coChu >= CO_MAX} aria-label="Chữ đề to lên">
                A+
              </button>
            </div>
          </div>
          {phanCo.length > 1 && (
            <nav className="lb-phan-tab" aria-label="Chuyển nhanh giữa các phần">
              {phanCo.map((ph) => {
                const ds = theoPhan(ph)
                return (
                  <button key={ph} type="button" aria-current={phanDangXem === ph ? 'true' : undefined} onClick={() => toiCau(ds[0].stt)}>
                    Phần {ph}
                    <span className="lb-tab-dai">&nbsp;· {TEN_PHAN[ph]}</span>
                    <span className="lb-dem">
                      {ds.filter((c) => c.daLam).length}/{ds.length}
                    </span>
                  </button>
                )
              })}
            </nav>
          )}
        </header>
        {p.tren}
        <div className="lb-de-cuon-boc">
          <div ref={deRef} className="lb-de thi-noi-dung" tabIndex={-1} style={{ ['--cx-3' as string]: `${coChu}px` }}>
            {p.children}
          </div>
          {p.phuDe}
        </div>
      </section>

      {/* ===== GIỮA: THANH KÉO ===== */}
      <div
        className="lb-keo"
        data-lb-keo=""
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để đổi độ rộng khung đề và phiếu. Bấm đúp để về mặc định."
        aria-valuemin={35}
        aria-valuemax={75}
        aria-valuenow={pt}
        aria-valuetext={`Khung đề rộng ${pt} %`}
        tabIndex={0}
        onPointerDown={keoXuong}
        onDoubleClick={() => datTi(TI_LE_MAC_DINH)}
        onKeyDown={keoPhim}
      >
        <div className="lb-keo-num" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="lb-keo-ti" aria-hidden="true">
          Đề {pt} % · Phiếu {100 - pt} %
        </div>
      </div>

      {/* ===== PHẢI: ĐIỀU KHIỂN + PHIẾU ===== */}
      <aside className="lb-phai" aria-label="Phiếu đáp án">
        <div className="lb-dk">
          {p.dongHo !== null && p.khoGio ? (
            <OGioSong kho={p.khoGio} chuThayDongHo={p.chuThayDongHo} hetGioLuc={p.hetGioLuc} />
          ) : (
            <OGio dongHo={p.dongHo} conGiay={p.conGiay} chuThayDongHo={p.chuThayDongHo} hetGioLuc={p.hetGioLuc} />
          )}
          <div className="lb-tien">
            <div className="lb-tien-dong">
              <span>Đã làm</span>
              <b>
                {p.daLam}/{p.tong}
              </b>
              <span>câu</span>
            </div>
            <div className="lb-thanh" role="progressbar" aria-label="Số câu đã làm" aria-valuemin={0} aria-valuemax={p.tong} aria-valuenow={p.daLam}>
              <i style={{ width: `${p.tong ? (p.daLam / p.tong) * 100 : 0}%` }} />
            </div>
            <div className="lb-chip">
              <span>Chưa làm: {p.tong - p.daLam} câu</span>
              {soDanhDau > 0 && (
                <span className="lb-chip-co">
                  <Flag size={13} />
                  Xem lại: {soDanhDau} câu
                </span>
              )}
              <span className="lb-luu" data-trang-thai={p.mayNgoaiMang ? 'ngoai-mang' : p.dangLuu ? 'dang-luu' : 'da-luu'} role="status">
                {p.mayNgoaiMang ? <CloudOff size={13} /> : <Check size={13} />}
                {p.nhanLuu.charAt(0).toUpperCase() + p.nhanLuu.slice(1)}
              </span>
            </div>
          </div>
          <div className="lb-nop-boc">
            <button type="button" className="lb-nop" disabled={p.khoaNop} onClick={() => !p.khoaNop && p.onNop()}>
              {p.nhanNutNop}
            </button>
            {p.ghiChuNop && <div className="lb-nop-ghi">{p.ghiChuNop}</div>}
          </div>
        </div>

        <div ref={phieuRef} className="lb-phieu">
          <div className="lb-chu-giai" aria-label="Chú giải màu phiếu">
            <span>
              <i className="lb-mau" data-tt="chua" />
              Chưa làm
            </span>
            <span>
              <i className="lb-mau" data-tt="xong" />
              Đã làm
            </span>
            <span>
              <i className="lb-mau" data-tt="co" />
              Đánh dấu xem lại
            </span>
            <span>
              <i className="lb-mau" data-tt="xem" />
              Đang xem
            </span>
          </div>
          {phanCo.map((ph) => {
            const ds = theoPhan(ph)
            return (
              <div key={ph} className="lb-p-khoi">
                <div className="lb-p-dau">
                  <h3>
                    Phần {ph} · {TEN_PHAN[ph]}
                  </h3>
                  <span>
                    Đã làm {ds.filter((c) => c.daLam).length}/{ds.length} câu
                  </span>
                </div>
                <div className={`lb-p${ph}`}>
                  {ds.map((c) => (
                    <div key={c.stt} className="lb-hang" data-hang={c.stt} data-dang-xem={dangXem === c.stt ? '' : undefined}>
                      {nutSo(c)}
                      {ph === 'I' &&
                        [0, 1, 2, 3].map((i) => (
                          <button
                            key={i}
                            type="button"
                            className="lb-bong"
                            aria-pressed={c.chon === i}
                            aria-label={`Câu ${c.stt} phương án ${'ABCD'[i]}`}
                            onClick={() => {
                              p.onChonPa(c.stt, i)
                              chamCau(c.stt)
                            }}
                          >
                            {'ABCD'[i]}
                          </button>
                        ))}
                      {ph === 'II' && (
                        <div className="lb-y-luoi">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="lb-y" data-y-chon={dangXem === c.stt && yChon === i ? '' : undefined}>
                              <b>{'abcd'[i]}</b>
                              {(['D', 'S'] as const).map((gt) => (
                                <button
                                  key={gt}
                                  type="button"
                                  data-gt={gt}
                                  aria-pressed={c.y?.[i] === gt}
                                  aria-label={`Câu ${c.stt} ý ${'abcd'[i]} ${gt === 'D' ? 'Đúng' : 'Sai'}`}
                                  onClick={() => {
                                    p.onGhiY(c.stt, i, gt)
                                    chamCau(c.stt)
                                    setYChon(i)
                                  }}
                                >
                                  {gt === 'D' ? 'Đ' : 'S'}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {ph === 'III' && (
                        <div className="lb-o3" onFocusCapture={() => chamCau(c.stt)}>
                          {p.oDapSo({ value: c.tl ?? '', onChange: (v) => p.onNhap(c.stt, v), ariaLabel: `Đáp số câu ${c.stt}` })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="lb-goi-y">
          <div className="lb-goi-y-ds" aria-hidden="true">
            <span>
              <kbd>1</kbd>–<kbd>4</kbd> chọn
            </span>
            <span>
              <kbd>N</kbd> câu sau
            </span>
            <span>
              <kbd>P</kbd> câu trước
            </span>
            <span>
              <kbd>M</kbd> đánh dấu
            </span>
            <span>
              Giữ <kbd>phím cách</kbd> để đọc
            </span>
          </div>
          <button type="button" className="lb-nut-phim" onClick={() => setMoPhim(true)}>
            <Keyboard size={16} />
            Phím tắt
          </button>
        </div>
      </aside>

      {moPhim && (
        <div className="lb-phu" onClick={() => setMoPhim(false)}>
          <div className="lb-hop" role="dialog" aria-modal="true" aria-label="Phím tắt khi làm bài" onClick={(e) => e.stopPropagation()}>
            <div className="lb-hop-dau">
              <h2>Phím tắt khi làm bài</h2>
              <button type="button" className="lb-hop-dong" onClick={() => setMoPhim(false)} aria-label="Đóng bảng phím tắt">
                <X size={20} />
              </button>
            </div>
            <table className="lb-bang-phim">
              <tbody>
                <tr>
                  <td>
                    <kbd>1</kbd>–<kbd>4</kbd> hoặc <kbd>A</kbd>–<kbd>D</kbd>
                  </td>
                  <td>Phần I: chọn phương án A, B, C, D</td>
                </tr>
                <tr>
                  <td>
                    <kbd>1</kbd>–<kbd>4</kbd>
                  </td>
                  <td>Phần II: chọn ý a, b, c, d</td>
                </tr>
                <tr>
                  <td>
                    <kbd>D</kbd> / <kbd>S</kbd>
                  </td>
                  <td>Phần II: ghi Đúng / Sai cho ý đang chọn rồi sang ý kế</td>
                </tr>
                <tr>
                  <td>
                    <kbd>Enter</kbd>
                  </td>
                  <td>Phần III: vào ô đáp số (bấm Esc để thoát ô)</td>
                </tr>
                <tr>
                  <td>
                    <kbd>N</kbd> / <kbd>P</kbd>
                  </td>
                  <td>Câu sau / câu trước</td>
                </tr>
                <tr>
                  <td>
                    <kbd>M</kbd>
                  </td>
                  <td>Đánh dấu xem lại (bấm lần nữa để bỏ)</td>
                </tr>
                <tr>
                  <td>
                    Giữ <kbd>phím cách</kbd>
                  </td>
                  <td>Giữ để đọc đề (ca bật "Giữ để đọc")</td>
                </tr>
                <tr>
                  <td>
                    <kbd>←</kbd> <kbd>→</kbd> trên thanh kéo
                  </td>
                  <td>Đổi độ rộng khung đề; bấm đúp thanh kéo để về mặc định</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
