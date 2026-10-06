// LÀM BÀI TRÊN ĐIỆN THOẠI XOAY NGANG (thầy 29/09, nguyên văn): "Xoay ngang làm bài thi trên điện thoại bỏ phần điền ô đáp án để tối ưu
// hiển thị, câu nào dài quá tự động chia 2 màn hình, một bên là đề một bên là các ý đáp án để chọn, lúc chia cho hs tự điều chỉnh được.
// Đồng hồ, font chữ, nút dịu mắt thiết kế nhỏ và thật tinh tế để không ảnh hưởng tới nội dung đề bài."
//
// CHỈ dùng khi `chonBoCuc` trả 'ngang-gon' (xoay ngang, cao < 500 px). Máy tính / máy tính bảng ('ngang') và mọi màn DỌC giữ nguyên.
//   · KHÔNG còn phiếu đáp án: em chọn ngay trên thẻ câu (chính TheCau của màn thi, truyền qua `children`) — cùng hàm ghi, dữ liệu nộp/chấm y hệt.
//   · MỖI LẦN MỘT CÂU chiếm trọn khung; đi câu bằng ‹ › và ô "Câu 3/28" (bấm mở bảng số câu nhỏ, đóng lại ngay khi chọn).
//   · Câu DÀI (đo chiều cao thật khi xếp một cột > khung nhìn) ⇒ tự chia 2 cột: trái ĐỀ, phải PHƯƠNG ÁN / Ý / Ô ĐÁP SỐ, mỗi bên cuộn riêng;
//     THANH CHIA kéo bằng ngón tay (pointer events), 30–70 %, nhớ theo máy (localStorage bọc try/catch), bấm đúp hoặc nút ↺ để về mặc định.
//     Câu ngắn giữ một cột. Bàn phím ảo mở (Phần III) làm khung thấp đi ⇒ đo lại ⇒ câu chia đôi, ô đáp số nằm đầu cột phải, không bị che.
//   · Thanh trên MỎNG 32 px: đồng hồ viên nhỏ (số tabular; ≤ 10 phút vàng + chữ, ≤ 5 phút đỏ + "Sắp hết giờ"), A−/A+, Dịu mắt, Nộp bài —
//     nút trông nhỏ nhưng vùng chạm vô hình đủ 40 px.
// Chỉ TRÌNH BÀY: đáp án, cờ, giờ, lưu, nộp đều do ExamTakeScreen truyền vào (LamBaiNgangProps) — xoay qua lại không mất gì.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { canChiaDoi, CHIA_MAC_DINH, CHIA_MAX, CHIA_MIN, chiaTheoPhim, chiaTheoViTri, docChia, ghiChia, kepChia, mucDongHo } from '../lib/lam-bai-ngang'
import { dinhDangDongHo, useGiayConLai, type KhoGio } from '../lib/dong-ho-thi'
import type { CauPhieu, LamBaiNgangProps, PhanCau } from './LamBaiNgang'

function Net({ size = 16, children, fill = 'none' }: { size?: number; children: ReactNode; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
const Timer = () => (
  <Net size={13}>
    <path d="M10 2h4M12 14l3-3" />
    <circle cx="12" cy="14" r="8" />
  </Net>
)
const Trai = () => (
  <Net size={18}>
    <path d="m15 18-6-6 6-6" />
  </Net>
)
const Phai = () => (
  <Net size={18}>
    <path d="m9 18 6-6-6-6" />
  </Net>
)
const VeGiua = () => (
  <Net size={15}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Net>
)
const Check = () => (
  <Net size={13}>
    <path d="M20 6 9 17l-5-5" />
  </Net>
)
const CloudOff = () => (
  <Net size={13}>
    <path d="m2 2 20 20M5.8 5.8A7 7 0 0 0 9 20h9a5 5 0 0 0 1.7-.3M22 15.5A4.5 4.5 0 0 0 17.5 11h-1.8A7 7 0 0 0 11 6.2" />
  </Net>
)

const TEN_PHAN: Record<PhanCau, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const CO_MIN = 15
const CO_MAX = 22
const CO_MAC_DINH = 16
const KHOA_CO = 'ddh.lamBaiNgang.coChuGon'
const docCo = () => {
  try {
    const n = Number(localStorage.getItem(KHOA_CO))
    return n >= CO_MIN && n <= CO_MAX ? n : CO_MAC_DINH
  } catch {
    return CO_MAC_DINH
  }
}

/** Viên đồng hồ nhỏ. Bình thường: biểu tượng + số. ≤ 10 phút: nền vàng + "Dưới 10 phút". ≤ 5 phút: nền đỏ + "Sắp hết giờ". */
function GioNho({ dongHo, conGiay, chuThayDongHo }: { dongHo: string | null; conGiay: number | null; chuThayDongHo: string }) {
  const muc = dongHo === null ? '' : mucDongHo(conGiay)
  const nhan = muc === 'do' ? 'Sắp hết giờ' : muc === 'vang' ? 'Dưới 10 phút' : ''
  return (
    <div
      className="lb-gio lb-gon-gio"
      data-muc={muc || undefined}
      role="timer"
      aria-label={dongHo === null ? chuThayDongHo : `${nhan ? `${nhan}. ` : ''}Thời gian còn lại ${dongHo}`}
    >
      <Timer />
      {nhan && <span className="lb-gio-nhan">{nhan}</span>}
      <span className="lb-gio-so">{dongHo ?? chuThayDongHo}</span>
    </div>
  )
}
function GioNhoSong({ kho, chuThayDongHo }: { kho: KhoGio; chuThayDongHo: string }) {
  const giay = useGiayConLai(kho)
  return <GioNho dongHo={dinhDangDongHo(giay ?? 0)} conGiay={giay} chuThayDongHo={chuThayDongHo} />
}

/** Phần tử con TRỰC TIẾP của khung đề chứa thẻ `cau-N` (thẻ câu, hoặc khung bọc M3 có nút "Xem lại sau"). */
function bocCuaCau(de: HTMLElement, n: number): HTMLElement | null {
  let el = de.querySelector<HTMLElement>(`[id="cau-${n}"]`)
  while (el && el.parentElement !== de) el = el.parentElement
  return el
}
/** Phần "chọn đáp án" của thẻ câu: khối phương án (Phần I), khối ý Đúng/Sai (Phần II), ô đáp số (Phần III). */
function khoiLuaChon(than: Element): HTMLElement | null {
  for (const c of Array.from(than.children) as HTMLElement[]) {
    if (c.matches('.osl') || c.querySelector('.pa-hang, .y-hang, .osl, input')) return c
  }
  return null
}

type ViTriKeo = { x: number; top: number; h: number } | null

export default function LamBaiNgangGon(p: LamBaiNgangProps) {
  const { cau } = p
  const khungRef = useRef<HTMLDivElement>(null)
  const thanRef = useRef<HTMLDivElement>(null)
  const deRef = useRef<HTMLDivElement>(null)
  const [dangXem, setDangXem] = useState(() => Math.max(1, Math.min(cau.length || 1, p.cauBatDau || 1)))
  const [coChu, setCoChu] = useState(docCo)
  const [ti, setTi] = useState(() => docChia())
  const [chia, setChia] = useState(false)
  const [dangKeo, setDangKeo] = useState(false)
  const [keo, setKeo] = useState<ViTriKeo>(null)
  const [moBang, setMoBang] = useState(false)
  const [caoVv, setCaoVv] = useState<number | null>(null)
  const onCauDangXemRef = useRef(p.onCauDangXem)
  onCauDangXemRef.current = p.onCauDangXem

  const toiCau = useCallback(
    (n: number) => {
      const m = Math.max(1, Math.min(cau.length, n))
      setDangXem(m)
      onCauDangXemRef.current(m)
      setMoBang(false)
    },
    [cau.length],
  )

  // ---------------------------------------------------------------- một câu một lần + đo để chia đôi
  const datViTriKeo = useCallback(() => {
    const than = thanRef.current
    const de = deRef.current
    const pa = de?.querySelector<HTMLElement>('[data-lb-pa]')
    const tc = pa?.parentElement
    if (!than || !de || !pa || !tc || !de.hasAttribute('data-chia')) {
      setKeo((k) => (k === null ? k : null))
      return
    }
    const k = than.getBoundingClientRect()
    const b = tc.getBoundingClientRect()
    const r = pa.getBoundingClientRect()
    const khe = parseFloat(getComputedStyle(tc).columnGap) || 24
    const moi = { x: Math.round(r.left - khe / 2 - k.left), top: Math.round(b.top - k.top), h: Math.round(b.height) }
    setKeo((c) => (c && c.x === moi.x && c.top === moi.top && c.h === moi.h ? c : moi))
  }, [])

  /** Đánh dấu câu đang hiện + khối lựa chọn của nó (thuộc tính DOM — không vẽ lại thẻ câu). Trả về thân thẻ và khối lựa chọn. */
  const danhDau = useCallback(() => {
    const de = deRef.current
    if (!de) return { tc: null, pa: null }
    const boc = bocCuaCau(de, dangXem)
    for (const c of Array.from(de.children) as HTMLElement[]) {
      if (c === boc) {
        if (!c.hasAttribute('data-gon-hien')) c.setAttribute('data-gon-hien', '')
      } else if (c.hasAttribute('data-gon-hien')) c.removeAttribute('data-gon-hien')
    }
    const the = boc ? (boc.id?.startsWith('cau-') ? boc : boc.querySelector<HTMLElement>('[id^="cau-"]')) : null
    const tc = (the?.lastElementChild as HTMLElement | null) ?? null
    const pa = tc ? khoiLuaChon(tc) : null
    de.querySelectorAll('[data-lb-pa]').forEach((e) => {
      if (e !== pa) e.removeAttribute('data-lb-pa')
    })
    if (pa && !pa.hasAttribute('data-lb-pa')) pa.setAttribute('data-lb-pa', '')
    return { tc, pa }
  }, [dangXem])

  /** ĐO THẬT: xếp một cột, so chiều cao câu với khung nhìn ⇒ chia đôi hay không. Chỉ chạy khi đổi câu / cỡ chữ / cỡ khung /
   * ảnh tải xong — KHÔNG chạy mỗi lần chọn đáp án (bật tắt chia sẽ làm mất chỗ em đang cuộn). Chỗ cuộn hai cột được giữ lại. */
  const danhGia = useCallback(() => {
    const de = deRef.current
    if (!de) return
    const { tc, pa } = danhDau()
    const cuonDe = tc?.scrollTop ?? 0
    const cuonPa = pa?.scrollTop ?? 0
    de.removeAttribute('data-chia')
    const can = !!tc && !!pa && canChiaDoi(de.scrollHeight, de.clientHeight)
    if (can && tc && pa) {
      de.setAttribute('data-chia', '')
      de.style.setProperty('--lb-cot-cao', `${Math.max(120, tc.clientHeight - 24)}px`)
      tc.scrollTop = cuonDe
      pa.scrollTop = cuonPa
    }
    setChia(can)
    datViTriKeo()
  }, [danhDau, datViTriKeo])

  // Mỗi lượt vẽ (đáp án đổi, thẻ mới dựng…): chỉ đánh dấu lại, giữ nguyên cách chia — trước khi trình duyệt vẽ, không nháy.
  useLayoutEffect(() => {
    danhDau()
  })
  // Đổi câu / đổi cỡ chữ ⇒ đo lại; đổi câu thì về đầu câu.
  useLayoutEffect(() => {
    if (deRef.current) deRef.current.scrollTop = 0
    danhGia()
  }, [danhGia, coChu])
  // Thanh chia dời theo tỉ lệ.
  useLayoutEffect(() => {
    datViTriKeo()
  }, [ti, datViTriKeo])

  // Khung đổi cỡ (xoay máy, bàn phím ảo mở/đóng, dải cảnh báo hiện) ⇒ đo lại; ảnh trong đề tải xong ⇒ đo lại.
  useEffect(() => {
    const de = deRef.current
    const than = thanRef.current
    if (!de || !than) return
    let raf = 0
    const lai = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        danhGiaRef.current()
      })
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(lai) : null
    ro?.observe(than)
    de.addEventListener('load', lai, true)
    window.addEventListener('resize', lai)
    return () => {
      ro?.disconnect()
      de.removeEventListener('load', lai, true)
      window.removeEventListener('resize', lai)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  const danhGiaRef = useRef(danhGia)
  danhGiaRef.current = danhGia

  // iPhone: bàn phím ảo không thu nhỏ cửa sổ mà chỉ thu "khung nhìn thấy" ⇒ khung làm bài theo visualViewport để ô đáp số không bị che.
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined
    if (!vv) return
    const doi = () => setCaoVv(vv.height < window.innerHeight - 40 ? Math.round(vv.height) : null)
    vv.addEventListener('resize', doi)
    return () => vv.removeEventListener('resize', doi)
  }, [])
  // Vào ô đáp số ⇒ đưa ô vào tầm nhìn sau khi bàn phím bung.
  useEffect(() => {
    const de = deRef.current
    if (!de) return
    const vao = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.tagName !== 'INPUT') return
      setTimeout(() => el.scrollIntoView?.({ block: 'nearest' }), 320)
    }
    de.addEventListener('focusin', vao)
    return () => de.removeEventListener('focusin', vao)
  }, [])

  // Bảng số câu: Esc đóng.
  useEffect(() => {
    if (!moBang) return
    const dong = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoBang(false)
    }
    document.addEventListener('keydown', dong)
    return () => document.removeEventListener('keydown', dong)
  }, [moBang])

  // ---------------------------------------------------------------- thanh chia
  const datTi = (v: number, luu = true) => {
    const t = kepChia(v)
    setTi(t)
    if (luu) ghiChia(t)
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
    let cuoi = ti
    const di = (ev: PointerEvent) => {
      const tc = deRef.current?.querySelector<HTMLElement>('[data-lb-pa]')?.parentElement
      if (!tc) return
      const r = tc.getBoundingClientRect()
      const cs = getComputedStyle(tc)
      const trai = parseFloat(cs.paddingLeft) || 0
      const phai = parseFloat(cs.paddingRight) || 0
      cuoi = chiaTheoViTri(ev.clientX - r.left - trai, r.width - trai - phai, parseFloat(cs.columnGap) || 24)
      setTi(cuoi)
    }
    const tha = () => {
      setDangKeo(false)
      ghiChia(cuoi)
      thanh.removeEventListener('pointermove', di)
      thanh.removeEventListener('pointerup', tha)
      thanh.removeEventListener('pointercancel', tha)
    }
    thanh.addEventListener('pointermove', di)
    thanh.addEventListener('pointerup', tha)
    thanh.addEventListener('pointercancel', tha)
  }
  const keoPhim = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const moi = chiaTheoPhim(ti, e.key, e.shiftKey)
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
  }

  // ---------------------------------------------------------------- số liệu
  const c = cau[dangXem - 1] as CauPhieu | undefined
  const phan = c?.phan
  const pt = Math.round(ti * 100)
  const phanCo = (['I', 'II', 'III'] as PhanCau[]).filter((ph) => cau.some((x) => x.phan === ph))

  return (
    <div
      ref={khungRef}
      className="lb-gon"
      data-bo-cuc="ngang-gon"
      data-chia={chia ? '' : undefined}
      data-dang-keo={dangKeo ? '' : undefined}
      style={{
        ['--lb-chia-de' as string]: `${ti}fr`,
        ['--lb-chia-pa' as string]: `${Math.round((1 - ti) * 1000) / 1000}fr`,
        ...(caoVv ? { height: caoVv } : null),
      }}
    >
      <header className="lb-gon-thanh">
        <nav className="lb-gon-di" aria-label="Chuyển câu">
          <button type="button" className="lb-gon-nut" onClick={() => toiCau(dangXem - 1)} disabled={dangXem <= 1} aria-label="Câu trước">
            <Trai />
          </button>
          <button
            type="button"
            className="lb-gon-so"
            aria-haspopup="dialog"
            aria-expanded={moBang}
            aria-label={`Đang ở câu ${dangXem} trên ${cau.length}. Bấm để chọn câu khác`}
            onClick={() => setMoBang((m) => !m)}
          >
            Câu <b>{dangXem}</b>/{cau.length}
          </button>
          <button type="button" className="lb-gon-nut" onClick={() => toiCau(dangXem + 1)} disabled={dangXem >= cau.length} aria-label="Câu sau">
            <Phai />
          </button>
          {phan && (
            <span className="lb-gon-phan">
              Phần {phan}
              <span className="lb-gon-phan-dai"> · {TEN_PHAN[phan]}</span>
            </span>
          )}
        </nav>
        <div className="lb-gon-phai">
          <span className="lb-gon-tien">
            Đã làm <b>{p.daLam}/{p.tong}</b>
          </span>
          <span
            className="lb-luu lb-gon-luu"
            data-trang-thai={p.mayNgoaiMang ? 'ngoai-mang' : p.dangLuu ? 'dang-luu' : 'da-luu'}
            role="status"
            aria-label={p.nhanLuu.charAt(0).toUpperCase() + p.nhanLuu.slice(1)}
            title={p.nhanLuu}
          >
            {p.mayNgoaiMang ? <CloudOff /> : <Check />}
            {p.mayNgoaiMang && <span>Mất mạng</span>}
          </span>
          {chia && Math.abs(ti - CHIA_MAC_DINH) > 0.005 && (
            <button type="button" className="lb-gon-nut" onClick={() => datTi(CHIA_MAC_DINH)} aria-label="Đưa khung đề và khung đáp án về độ rộng mặc định">
              <VeGiua />
            </button>
          )}
          <div className="lb-co-chu lb-gon-co" role="group" aria-label={`Cỡ chữ đề: ${coChu} px`}>
            <button type="button" onClick={() => doiCo(-1)} disabled={coChu <= CO_MIN} aria-label="Chữ đề nhỏ lại">
              A−
            </button>
            <button type="button" onClick={() => doiCo(1)} disabled={coChu >= CO_MAX} aria-label="Chữ đề to lên">
              A+
            </button>
          </div>
          {p.congCu}
          <div className="lb-dk lb-gon-dk">
            {p.dongHo !== null && p.khoGio ? (
              <GioNhoSong kho={p.khoGio} chuThayDongHo={p.chuThayDongHo} />
            ) : (
              <GioNho dongHo={p.dongHo} conGiay={p.conGiay} chuThayDongHo={p.chuThayDongHo} />
            )}
            <button type="button" className="lb-nop" disabled={p.khoaNop} title={p.ghiChuNop} onClick={() => !p.khoaNop && p.onNop()}>
              {p.nhanNutNop}
            </button>
          </div>
        </div>
      </header>
      {p.tren}
      <div ref={thanRef} className="lb-gon-than">
        <div ref={deRef} className="lb-gon-de thi-noi-dung" tabIndex={-1} data-phan={phan} style={{ ['--cx-3' as string]: `${coChu}px` }}>
          {p.children}
        </div>
        {chia && keo && (
          <div
            className="lb-gon-keo"
            data-lb-keo=""
            role="separator"
            aria-orientation="vertical"
            aria-label="Kéo để đổi độ rộng khung đề và khung đáp án. Bấm đúp để về mặc định."
            aria-valuemin={Math.round(CHIA_MIN * 100)}
            aria-valuemax={Math.round(CHIA_MAX * 100)}
            aria-valuenow={pt}
            aria-valuetext={`Khung đề rộng ${pt} %`}
            tabIndex={0}
            style={{ left: keo.x, top: keo.top, height: keo.h }}
            onPointerDown={keoXuong}
            onDoubleClick={() => datTi(CHIA_MAC_DINH)}
            onKeyDown={keoPhim}
          >
            <i className="lb-gon-keo-num" aria-hidden="true" />
            <span className="lb-gon-keo-ti" aria-hidden="true">
              Đề {pt} % · Đáp án {100 - pt} %
            </span>
          </div>
        )}
        {p.phuDe}
      </div>

      {moBang && (
        <div role="presentation" className="lb-gon-phu" onClick={() => setMoBang(false)}>
          <div className="lb-gon-bang" role="dialog" aria-modal="true" aria-label="Chọn câu" onClick={(e) => e.stopPropagation()}>
            {phanCo.map((ph) => (
              <div key={ph} className="lb-gon-bang-phan">
                <div className="lb-gon-bang-ten">
                  Phần {ph} · {TEN_PHAN[ph]}
                </div>
                <div className="lb-gon-bang-so">
                  {cau
                    .filter((x) => x.phan === ph)
                    .map((x) => (
                      <button
                        key={x.stt}
                        type="button"
                        className="lb-so"
                        data-tt={x.daLam ? 'xong' : 'chua'}
                        data-co={x.danhDau ? '' : undefined}
                        aria-current={x.stt === dangXem ? 'true' : undefined}
                        aria-label={`Tới câu ${x.stt} — ${x.daLam ? 'đã làm' : 'chưa làm'}${x.danhDau ? ', đã đánh dấu xem lại' : ''}`}
                        onClick={() => toiCau(x.stt)}
                      >
                        {x.stt}
                      </button>
                    ))}
                </div>
              </div>
            ))}
            <div className="lb-gon-bang-chu" aria-hidden="true">
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
