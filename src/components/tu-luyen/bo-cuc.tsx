// BỐ CỤC NGANG + MÁY TÍNH của Tu luyện (30/09, thầy: "mục tu luyện tất cả các thẻ các lớp phải có giao diện xoay ngang và máy tính cho chuyên
// nghiệp cuốn hút, siêu đẹp"). Dùng chung cho ManTuLuyen (4 chế độ + Tổng hợp) và LuyenDeCauTruc:
//   · `useBoCuc()` — 'doc' (điện thoại dọc, máy tính bảng dọc: GIỮ NGUYÊN màn cũ) · 'ngang' (điện thoại xoay ngang, cao ≤ 500 px) ·
//     'rong' (màn ≥ 900 px và cao > 500 px). jsdom/máy không có matchMedia ⇒ 'doc'.
//   · `BangCau` — cột phải khi làm bài: lưới số câu theo phần (máy tính) hoặc PHIẾU TRẢ LỜI chạm được (ngang: A–D, ý a–d Đ/S, ô trả lời ngắn nhảy tới câu).
//   · `useCauHienTai` — câu đang nằm trong vùng đọc (IntersectionObserver), để tô ô và cho phím ←/→.
//   · `usePhimTat` — phím tắt máy tính: ←/→ đổi câu, A–D chọn phương án, Đ/S điền ý kế tiếp. Không bắt phím khi đang gõ trong ô nhập,
//     khi có hộp thoại, hay khi giữ Ctrl/Alt/⌘.
// CHỈ TRÌNH BÀY + gọi đúng hàm ghi của màn cha (chọn trên phiếu = chọn trong đề). Không đáp án, không chấm ở đây.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'

export type BoCuc = 'doc' | 'ngang' | 'rong'
export const MQ_NGANG = '(orientation: landscape) and (max-height: 500px)'
export const MQ_RONG = '(min-width: 900px) and (min-height: 501px)'

const coMq = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
function docBoCuc(): BoCuc {
  if (!coMq()) return 'doc'
  if (window.matchMedia(MQ_NGANG).matches) return 'ngang'
  if (window.matchMedia(MQ_RONG).matches) return 'rong'
  return 'doc'
}
function dangKy(bao: () => void): () => void {
  if (!coMq()) return () => {}
  const ds = [MQ_NGANG, MQ_RONG].map((q) => window.matchMedia(q))
  for (const m of ds) (m.addEventListener ? m.addEventListener('change', bao) : m.addListener?.(bao))
  return () => { for (const m of ds) (m.removeEventListener ? m.removeEventListener('change', bao) : m.removeListener?.(bao)) }
}
/** Bố cục theo khổ màn — đổi ngay khi xoay máy / kéo cửa sổ (state bài làm nằm ở màn cha nên không mất gì). */
export function useBoCuc(): BoCuc {
  return useSyncExternalStore(dangKy, docBoCuc, () => 'doc')
}

/** Cuộn mượt trừ khi máy xin giảm chuyển động hoặc đang ở chế độ máy yếu. */
export function cuonMuot(): ScrollBehavior {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('may-yeu')) return 'auto'
  if (coMq() && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto'
  return 'smooth'
}
/** Đưa một thẻ câu lên đầu vùng đọc (bù thanh dính bằng `scroll-margin-top` trong CSS). */
export function cuonToiCau(domId: string): void {
  const el = typeof document !== 'undefined' ? document.getElementById(domId) : null
  el?.scrollIntoView?.({ block: 'start', behavior: cuonMuot() })
}

/**
 * Câu ĐANG ĐỌC: thẻ câu đầu tiên chạm dải 35 % trên của vùng cuộn. `goc` = khung cuộn (null = cửa sổ). Trả [id, đặt tay] — bấm nhảy câu thì đặt
 * tay ngay (không chờ cuộn xong). `bat = false` ⇒ không quan sát (màn dọc: không cần).
 */
export function useCauHienTai(ids: readonly string[], domId: (id: string) => string, goc: HTMLElement | null, bat: boolean): [string, (id: string) => void] {
  const [hienTai, datHienTai] = useState(ids[0] ?? '')
  const khoa = ids.join('|')
  useEffect(() => {
    if (!bat || typeof IntersectionObserver === 'undefined') return
    const trong = new Set<string>()
    const thuTu = new Map(ids.map((id, i) => [domId(id), i]))
    const io = new IntersectionObserver((mucs) => {
      for (const m of mucs) (m.isIntersecting ? trong.add(m.target.id) : trong.delete(m.target.id))
      let dau = -1
      for (const d of trong) { const i = thuTu.get(d) ?? -1; if (i >= 0 && (dau < 0 || i < dau)) dau = i }
      if (dau >= 0) datHienTai(ids[dau]!)
    }, { root: goc, rootMargin: '0px 0px -65% 0px', threshold: 0 })
    for (const id of ids) { const el = document.getElementById(domId(id)); if (el) io.observe(el) }
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa, goc, bat])
  return [hienTai, datHienTai]
}

export type PhanCau = 'I' | 'II' | 'III'
export interface CauBang { id: string; so: number; phan: PhanCau; giaTri: string; daLam: boolean }
export interface NhomBang { phan: PhanCau; ten: string; cau: CauBang[] }

/**
 * PHÍM TẮT (chỉ khi có bàn phím): ←/→ câu trước/sau · A B C D chọn phương án (Phần I) · Đ (hoặc D) / S điền ý kế tiếp chưa làm (Phần II).
 * Phần III gõ trong ô như thường. Bỏ qua khi đang gõ chữ, có hộp thoại, hay giữ phím bổ trợ.
 */
export function usePhimTat(o: { bat: boolean; ds: readonly CauBang[]; hienTai: string; onNhay: (id: string) => void; onChon: (id: string, v: string) => void }): void {
  const ref = useRef(o)
  ref.current = o
  useEffect(() => {
    if (!o.bat) return
    const nghe = (e: KeyboardEvent) => {
      const r = ref.current
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [aria-modal="true"]')) return
      const i = Math.max(0, r.ds.findIndex((c) => c.id === r.hienTai))
      const cau = r.ds[i]
      if (!cau) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const j = e.key === 'ArrowRight' ? Math.min(r.ds.length - 1, i + 1) : Math.max(0, i - 1)
        if (j !== i) { e.preventDefault(); r.onNhay(r.ds[j]!.id) }
        return
      }
      const k = e.key.toLowerCase()
      if (cau.phan === 'I' && /^[abcd]$/.test(k)) { e.preventDefault(); r.onChon(cau.id, k.toUpperCase()); return }
      if (cau.phan === 'II' && (k === 'd' || k === 'đ' || k === 's')) {
        const mang = (cau.giaTri || '----').padEnd(4, '-').slice(0, 4).split('')
        const y = mang.findIndex((x) => x !== 'D' && x !== 'S')
        if (y < 0) return
        e.preventDefault()
        mang[y] = k === 's' ? 'S' : 'D'
        r.onChon(cau.id, mang.join(''))
      }
    }
    window.addEventListener('keydown', nghe)
    return () => window.removeEventListener('keydown', nghe)
  }, [o.bat])
}

const Y = ['a', 'b', 'c', 'd'] as const

/**
 * BẢNG CÂU (cột phải). `kieu='luoi'`: lưới số câu theo phần (máy tính — bấm để nhảy). `kieu='phieu'`: phiếu trả lời chạm được (ngang):
 * Phần I bốn ô A–D, Phần II bốn ô ý bấm vòng Đ → S → trống, Phần III một ô hiện đáp án đã gõ, bấm để tới câu gõ tiếp.
 */
export function BangCau({ nhom, hienTai, kieu, nhan, onNhay, onChon }: { nhom: readonly NhomBang[]; hienTai: string; kieu: 'luoi' | 'phieu'; nhan: string; onNhay: (id: string) => void; onChon?: (id: string, v: string) => void }) {
  return (
    <nav className="tlu-bc" data-kieu={kieu} aria-label={nhan}>
      {nhom.map((n) => (
        <section key={n.phan} className="tlu-bc-nhom" aria-label={`Phần ${n.phan} · ${n.ten}`}>
          <h3 className="tlu-bc-ten">
            <span>Phần {n.phan} · {n.ten}</span>
            <span className="tlu-tab">{n.cau.filter((c) => c.daLam).length}/{n.cau.length}</span>
          </h3>
          {kieu === 'luoi' ? (
            <div className="tlu-bc-luoi">
              {n.cau.map((c) => (
                <button key={c.id} type="button" className="tlu-bc-so tlu-tab" data-da-lam={c.daLam ? 'true' : 'false'} aria-current={c.id === hienTai ? 'true' : undefined}
                  aria-label={`Câu ${c.so}${c.daLam ? ', đã làm' : ', chưa làm'}`} onClick={() => onNhay(c.id)}>{c.so}</button>
              ))}
            </div>
          ) : (
            <ol className="tlu-bc-phieu">
              {n.cau.map((c) => (
                <li key={c.id} className="tlu-bc-hang" data-da-lam={c.daLam ? 'true' : 'false'} aria-current={c.id === hienTai ? 'true' : undefined}>
                  <button type="button" className="tlu-bc-so tlu-tab" aria-label={`Tới câu ${c.so}`} onClick={() => onNhay(c.id)}>{c.so}</button>
                  <HangPhieu c={c} onNhay={onNhay} onChon={onChon} />
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </nav>
  )
}

function HangPhieu({ c, onNhay, onChon }: { c: CauBang; onNhay: (id: string) => void; onChon?: (id: string, v: string) => void }) {
  if (c.phan === 'I') {
    return (
      <span className="tlu-bc-o-hang" role="group" aria-label={`Câu ${c.so}: chọn phương án`}>
        {(['A', 'B', 'C', 'D'] as const).map((x) => (
          <button key={x} type="button" className="tlu-bc-o" aria-pressed={c.giaTri === x} aria-label={`Câu ${c.so} chọn ${x}`} onClick={() => onChon?.(c.id, x)}>{x}</button>
        ))}
      </span>
    )
  }
  if (c.phan === 'II') {
    const mang = (c.giaTri || '----').padEnd(4, '-').slice(0, 4).split('')
    return (
      <span className="tlu-bc-o-hang" role="group" aria-label={`Câu ${c.so}: bấm từng ý để đổi Đúng / Sai / bỏ trống`}>
        {Y.map((y, j) => {
          const v = mang[j]
          const chu = v === 'D' ? 'Đ' : v === 'S' ? 'S' : '–'
          return (
            <button key={y} type="button" className="tlu-bc-o tlu-bc-y" data-gia-tri={v === 'D' || v === 'S' ? v : ''} aria-pressed={v === 'D' || v === 'S'}
              aria-label={`Câu ${c.so} ý ${y}: ${v === 'D' ? 'Đúng' : v === 'S' ? 'Sai' : 'chưa chọn'}`}
              onClick={() => { const m = [...mang]; m[j] = v === 'D' ? 'S' : v === 'S' ? '-' : 'D'; onChon?.(c.id, m.join('')) }}>
              <small aria-hidden="true">{y}</small>{chu}
            </button>
          )
        })}
      </span>
    )
  }
  return (
    <button type="button" className="tlu-bc-ngan" onClick={() => onNhay(c.id)} aria-label={c.daLam ? `Câu ${c.so}: đã điền ${c.giaTri}. Bấm để sửa` : `Câu ${c.so}: bấm để điền đáp án`}>
      {c.daLam ? <b className="tlu-tab">{c.giaTri}</b> : <span>Điền đáp án</span>}
    </button>
  )
}

/** Lọc danh sách câu xem lại: Tất cả / Câu đúng / Câu sai. */
export type LocXem = 'tat' | 'dung' | 'sai'

/** BẢN ĐỒ KẾT QUẢ: mỗi câu một ô (đúng = đặc + dấu ✓ vẽ, sai = viền đỏ + dấu ✗, bỏ trống = gạch) — bấm để tới câu trong danh sách xem lại. */
export function BanDoKetQua({ nhom, onNhay }: { nhom: readonly { phan: PhanCau; ten: string; cau: { id: string; so: number; kieu: 'dung' | 'sai' | 'trong' | 'mot_phan' }[] }[]; onNhay: (id: string) => void }) {
  const tenKieu = { dung: 'đúng', sai: 'sai', trong: 'bỏ trống', mot_phan: 'đúng một phần' } as const
  return (
    <div className="tlu-bd-kq">
      {nhom.filter((n) => n.cau.length).map((n) => (
        <div key={n.phan} className="tlu-bd-kq-nhom">
          <span className="tlu-bd-kq-ten">Phần {n.phan} · {n.ten}</span>
          <div className="tlu-bd-kq-luoi">
            {n.cau.map((c) => (
              <button key={c.id} type="button" className="tlu-bd-kq-o tlu-tab" data-kieu={c.kieu} aria-label={`Câu ${c.so}: ${tenKieu[c.kieu]}. Bấm để xem lại`} onClick={() => onNhay(c.id)}>
                {c.so}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="tlu-bd-kq-chu" aria-hidden="true">
        <span data-kieu="dung">Đúng</span><span data-kieu="mot_phan">Đúng một phần</span><span data-kieu="sai">Sai</span><span data-kieu="trong">Bỏ trống</span>
      </p>
    </div>
  )
}

function IconMui({ huong }: { huong: 'trai' | 'phai' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={huong === 'trai' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

/**
 * KHUNG LÀM BÀI NGANG / MÁY TÍNH (dùng chung Tu luyện + Luyện đề cấu trúc).
 *   · 'rong': đầu màn gọn ở trên; TRÁI danh sách câu (rộng ~720 px, cuộn theo trang/khung); PHẢI cột dính: đồng hồ, đã làm, lưới số câu theo phần,
 *     câu trước/sau, Nộp bài, gợi ý phím tắt.
 *   · 'ngang': TRÁI khung đề cuộn riêng (cao trọn màn, không thanh nào che); PHẢI: đầu màn, đồng hồ, PHIẾU TRẢ LỜI chạm được, câu trước/sau + Nộp bài.
 * `children` = các thẻ câu, mỗi thẻ mang `id = domId(qid)`.
 */
export function KhungLamRong(p: {
  boCuc: Exclude<BoCuc, 'doc'>
  dau: ReactNode
  nhom: readonly NhomBang[]
  domId: (id: string) => string
  /** Khung cuộn của cả màn ở bố cục 'rong' (null = cửa sổ). */
  gocCuon: HTMLElement | null
  dongHo: ReactNode
  nhanDongHo: string
  daLam: number
  tong: number
  trangThai?: ReactNode
  loi?: ReactNode
  nutNop: ReactNode
  onChon: (id: string, v: string) => void
  children: ReactNode
}) {
  const { boCuc, nhom, domId } = p
  const [pane, setPane] = useState<HTMLDivElement | null>(null)
  // Thứ tự ←/→ = thứ tự thẻ câu trên màn: số câu không trùng (Tu luyện đánh số cả lượt) ⇒ theo số; đánh số lại từng phần (đề Bộ) ⇒ theo phần.
  const phang = nhom.flatMap((n) => n.cau)
  const thuTu = new Set(phang.map((c) => c.so)).size === phang.length ? [...phang].sort((a, b) => a.so - b.so) : phang
  const [hienTai, datHienTai] = useCauHienTai(thuTu.map((c) => c.id), domId, boCuc === 'ngang' ? pane : p.gocCuon, true)
  const nhay = (id: string) => {
    datHienTai(id)
    cuonToiCau(domId(id))
    const c = thuTu.find((x) => x.id === id)
    if (c?.phan === 'III') setTimeout(() => (document.getElementById(domId(id))?.querySelector('input') as HTMLInputElement | null)?.focus({ preventScroll: true }), 380)
  }
  usePhimTat({ bat: true, ds: thuTu, hienTai, onNhay: nhay, onChon: p.onChon })
  // Tô thẻ câu đang đọc (thuộc tính ngoài React quản — chỉ để CSS vẽ viền).
  useEffect(() => {
    const el = document.getElementById(domId(hienTai))
    el?.setAttribute('data-hien-tai', 'true')
    return () => el?.removeAttribute('data-hien-tai')
  }, [hienTai, domId])
  const i = Math.max(0, thuTu.findIndex((c) => c.id === hienTai))
  const truoc = thuTu[i - 1], sau = thuTu[i + 1]
  const chuyen = (
    <div className="tlu-ben-chuyen">
      <button type="button" className="tlu-nut-phu tlu-nut-mui" disabled={!truoc} onClick={() => truoc && nhay(truoc.id)} aria-label="Câu trước">
        <IconMui huong="trai" />{boCuc === 'rong' && <span>Câu trước</span>}
      </button>
      <button type="button" className="tlu-nut-phu tlu-nut-mui" disabled={!sau} onClick={() => sau && nhay(sau.id)} aria-label="Câu sau">
        {boCuc === 'rong' && <span>Câu sau</span>}<IconMui huong="phai" />
      </button>
    </div>
  )
  return (
    <>
      {boCuc === 'rong' && <header className="tlu-dau tlu-dau-rong">{p.dau}</header>}
      <div className="tlu-lam-luoi" data-bo-cuc={boCuc}>
        <div className="tlu-lam-de" ref={setPane}>{p.children}</div>
        <aside className="tlu-lam-ben" aria-label="Bảng làm bài">
          {boCuc === 'ngang' && <div className="tlu-ben-dau">{p.dau}</div>}
          <div className="tlu-ben-so">
            <div className="tlu-ben-o"><span className="tlu-ben-nhan">{p.nhanDongHo}</span>{p.dongHo}</div>
            <div className="tlu-ben-o"><span className="tlu-ben-nhan">Đã làm</span><b className="tlu-tab tlu-ben-lon">{p.daLam}/{p.tong}</b></div>
          </div>
          <div className="tlu-tien-do" role="progressbar" aria-label="Số câu đã làm" aria-valuemin={0} aria-valuemax={p.tong} aria-valuenow={p.daLam}>
            <span style={{ transform: `scaleX(${p.tong ? p.daLam / p.tong : 0})` }} />
          </div>
          {p.trangThai}
          <BangCau nhom={nhom} hienTai={hienTai} kieu={boCuc === 'ngang' ? 'phieu' : 'luoi'} nhan={boCuc === 'ngang' ? 'Phiếu trả lời' : 'Lưới câu theo phần'} onNhay={nhay} onChon={p.onChon} />
          <div className="tlu-ben-cuoi">
            {chuyen}
            {p.loi}
            {p.nutNop}
          </div>
          {boCuc === 'rong' && (
            <p className="tlu-phim">
              Phím tắt: <kbd>←</kbd> <kbd>→</kbd> đổi câu · <kbd>A</kbd>–<kbd>D</kbd> chọn phương án · <kbd>Đ</kbd> / <kbd>S</kbd> điền ý đúng–sai
            </p>
          )}
        </aside>
      </div>
    </>
  )
}
