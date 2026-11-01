// PHẦN HIỂN THỊ của màn làm bài học sinh (bản vẽ dot13 thầy duyệt 12/10). Màn luyện DỰNG RIÊNG phần trả lời — KHÔNG đụng `TheCau`
// (thẻ câu dùng chung cho màn thi, màn thầy, phiếu…); chỉ dùng lại các mảnh hiển thị đề/hình/công thức mà `TheCau` cũng dùng
// (ChemText · tachDongTheoY · ExperimentDemo · BangSoLieu · CauHinh · HinhTaiViTri · KhoiLoiGiaiChuan) để chữ và hình ra y hệt.
// Màu: chỉ biến của app học sinh (hoc-tap.css, khối `.ht2-lam*`). Đáp án chỉ có ở các khối PHẢN HỒI — nhận từ máy chủ SAU khi nộp.
import { memo, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as KE, type ReactNode } from 'react'
import { Check, Delete, X as XIcon } from 'lucide-react'
import ExperimentDemo, { ExperimentOriginal } from '../ExperimentDemo'
import { BangSoLieu, CauHinh, HinhTaiViTri } from '../QuestionMedia'
import KhoiLoiGiaiChuan, { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { ChemText } from '../../lib/chem-format'
import { tachDongTheoY } from '../../lib/tach-dong-cau'
import { giuLienPhuongTrinh, tachDoanDe } from '../../lib/gian-y-de'
import { laChuGiuCho } from '../../lib/anh-phuong-an'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from '../../game/than-thu-v2/core'
import { TOI_DA_KY_TU, chuDS, kyTuHien, phimCoTacDung, phimTuBanPhim, soSanhDungSai, type PhimSo } from './lam-bai'
import { LUN_TOI_THIEU_MS, cuonThayBanPhim, doiO } from './ban-phim-hieu-ung'
import { phanHoi } from '../../lib/phan-hoi'
import { MQ_HAI_COT, haiCotLam } from './bo-cuc-lam'
// Thanh cuộn vẽ tay của hai cột: xuất lại từ đây ⇒ nằm CÙNG mảnh dùng chung với LamCau (màn làm chặng + sửa câu), không đẻ thêm tệp precache.
export { ThanhCuon } from './ThanhCuon'
import '../m3/the-cau.css'

// ── BỐ CỤC THEO KHỔ MÀN (làn B đợt 16, thầy 12/10: "Tối ưu cho dọc ngang máy tính tất cả các màn làm bài của học sinh phải siêu đẹp và
// thân thiện"). CÙNG điểm ngắt với hoc-tap.css. 01/11 (thầy, Galaxy Z Fold mở): hai cột theo MỘT NGUỒN `haiCotLam` (bo-cuc-lam.ts — rộng > cao
// từ 640 px, hoặc rộng ≥ 700 mà cao ≤ 1,3 × rộng); trong đó 'thap' = cao ≤ 560 px (điện thoại xoay ngang), 'rong' = cao hơn (máy gập mở, máy tính
// bảng ngang, máy tính) · còn lại 'doc' (GIỮ NGUYÊN bản dọc, kể cả máy tính bảng dọc 768×1024). Không có matchMedia (jsdom, máy chủ) ⇒ 'doc'.
// Chỉ quyết CHỖ ĐẶT phần trả lời (cột trái dưới đề hay cột phải cạnh nút Nộp) — không đổi đáp án, nháp, thời gian, lệnh máy chủ.
export type BoCucLam = 'doc' | 'rong' | 'thap'
export const MQ_LAM_THAP = '(max-height: 560px) and (min-width: 640px)'
export const MQ_LAM_RONG = MQ_HAI_COT.split(', ').map((m) => `${m} and (min-height: 561px)`).join(', ')
/** Bố cục theo bề rộng × chiều cao khung nhìn (thuần — test được không cần trình duyệt). */
export function chonBoCucLam(rong: number, cao: number): BoCucLam {
  if (!haiCotLam(rong, cao)) return 'doc'
  return cao <= 560 ? 'thap' : 'rong'
}
const coMq = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
function docBoCucLam(): BoCucLam {
  if (!coMq()) return 'doc'
  if (window.matchMedia(MQ_LAM_THAP).matches) return 'thap'
  if (window.matchMedia(MQ_LAM_RONG).matches) return 'rong'
  return 'doc'
}
function ngheBoCucLam(bao: () => void): () => void {
  if (!coMq()) return () => {}
  const ds = [MQ_LAM_THAP, MQ_LAM_RONG].map((q) => window.matchMedia(q))
  for (const m of ds) m.addEventListener?.('change', bao)
  return () => { for (const m of ds) m.removeEventListener?.('change', bao) }
}
/** Bố cục hiện tại — đổi ngay khi xoay máy / kéo cửa sổ (đáp án, nháp nằm ở màn cha nên không mất gì). */
export function useBoCucLam(): BoCucLam {
  return useSyncExternalStore(ngheBoCucLam, docBoCucLam, () => 'doc')
}
/** Phần trả lời sang CỘT PHẢI (cạnh nút Nộp): máy tính — mọi loại câu; điện thoại xoay ngang — chỉ trắc nghiệm (4 phương án vừa một màn
 *  thấp; đúng–sai và 4 ô + bàn phím số cao hơn màn nên giữ dưới đề như bản đã duyệt). */
export function traLoiCotPhai(boCuc: BoCucLam, phan: string): boolean {
  return boCuc === 'rong' || (boCuc === 'thap' && phan === 'I')
}

type Hinh = HinhAnh[]
const hinh = (q: Question): Hinh => q.hinhAnh as Hinh
const CHU_Y = ['a', 'b', 'c', 'd'] as const
const CHU_PA = ['A', 'B', 'C', 'D'] as const

/** Đề câu: "Câu 4." + đề (công thức hoá học, xuống dòng theo ý) + minh hoạ thí nghiệm + bảng số liệu + hình sau đề — cùng thứ tự `TheCau`. */
// 28/10 MƯỢT: ghi nhớ theo (câu, số thứ tự) — mỗi lần màn làm bài vẽ lại (chọn phương án, Kiểm tra, đổi câu) không phải dựng lại chữ đề (tách dòng +
// công thức hoá). Đề là hàm thuần của `q` + `stt`.
export const DeCau = memo(function DeCau({ q, stt }: { q: Question; stt: number }) {
  const de = tachDongTheoY(q.text)
  return (
    <section className="ht2-lam-de" aria-label={`Đề câu ${stt}`}>
      {q.thanCauImg ? (
        <>
          <p className="ht2-lam-de-chu"><b>Câu {stt}.</b></p>
          <CauHinh src={q.thanCauImg} alt={`Đề câu ${stt}`} />
        </>
      ) : (
        <ChuDe de={de} stt={stt} />
      )}
      <ExperimentDemo text={de} />
      <BangDe table={q.table} />
      <ExperimentOriginal text={q.text} hasImages={Boolean(q.imageDataUrl || q.hinhAnh.some((h) => h.viTri === 'sau_de'))}>
        {q.imageDataUrl && <CauHinh src={q.imageDataUrl} alt={`Hình câu ${stt}`} />}
        <HinhTaiViTri hinhAnh={hinh(q)} viTri="sau_de" nhan={`câu ${stt}`} />
      </ExperimentOriginal>
    </section>
  )
})

/** Chữ đề GIÃN Ý (thầy 27/10): mỗi dòng gốc / nhãn «Bước 1:» / phương trình / câu hỏi cuối là một đoạn riêng (`tachDoanDe`).
 *  Đoạn = <span> khối (cùng nằm trong <p> cũ ⇒ khung chữ L của giám thị, «Câu N.» ẩn ở Duo giữ nguyên); `data-gyc-khoi` ⇒ chạm-hiểu-đề dò từng đoạn.
 *  Khoảng cách / khối phương trình: styles/trong-lam-bai.css (chỉ giao diện «Trong», nạp lười). Đề một đoạn ⇒ DOM y như cũ. */
function ChuDe({ de, stt }: { de: string; stt: number }) {
  const ds = tachDoanDe(de)
  if (ds.length < 2 && ds[0]?.loai !== 'pt' && !ds[0]?.nhan) return <p className="ht2-lam-de-chu"><b>Câu {stt}.</b> <ChemText text={de} /></p>
  return (
    <p className="ht2-lam-de-chu de-gian"><b>Câu {stt}.</b>{' '}
      {ds.map((d, i) => (
        <span key={i} className="de-doan" data-loai={d.loai} data-gyc-khoi="" style={{ display: 'block' }}>
          {d.nhan && <b className="de-nhan">{d.nhan}</b>}{d.nhan && d.chu ? ' ' : null}{d.chu && <ChemText text={d.loai === 'pt' ? giuLienPhuongTrinh(d.chu) : d.chu} />}
        </span>
      ))}
    </p>
  )
}

/** Ảnh cuối câu (sau phần trả lời) — như `TheCau`. */
export function HinhCuoiCau({ q, stt }: { q: Question; stt: number }) {
  return q.hinhAnh.some((h) => h.viTri === 'cuoi_cau') ? <div className="ht2-lam-hinh"><HinhTaiViTri hinhAnh={hinh(q)} viTri="cuoi_cau" nhan={`câu ${stt}`} /></div> : null
}

/** Nội dung một ý / một phương án: ảnh riêng (nếu kho có) hoặc chữ có công thức. */
function NoiDung({ chu, anh, alt }: { chu: string; anh?: string; alt: string }) {
  return anh ? <img src={anh} alt={alt} loading="lazy" decoding="async" className="ht2-lam-anh-nho" /> : <ChemText text={chu} />
}

// ───────────────────────────── ĐÚNG–SAI · đang làm ─────────────────────────────

/** Bốn thẻ ý; mỗi ý hai nút Đúng/Sai chia đôi (≥ 48 px). Ý ĐẦU TIÊN chưa chọn có viền nổi — em biết ngay còn ý nào. */
export function ChonDungSai({ q, value, onChon, khoa }: { q: Question; value: string; onChon: (i: number, v: 'D' | 'S') => void; khoa: boolean }) {
  const chon = CHU_Y.map((_, i) => (value[i] === 'D' || value[i] === 'S' ? (value[i] as 'D' | 'S') : null))
  const dauChua = chon.findIndex((v) => v === null)
  return (
    <div className="ht2-lam-ds">
      {CHU_Y.map((chu, i) => (
        <section key={chu} className="ht2-lam-y" data-noi={i === dauChua || undefined} aria-label={`Ý ${chu}`}>
          <div className="ht2-lam-y-dau">
            <b className="ht2-lam-chu-cai" aria-hidden="true">{chu}</b>
            <div className="ht2-lam-y-chu"><NoiDung chu={q.ideas[i] ?? ''} anh={q.ideaImgs?.[i]} alt={`Ý ${chu}`} /></div>
          </div>
          <HinhTaiViTri hinhAnh={hinh(q)} viTri={`sau_y_${chu}`} nhan={`ý ${chu}`} />
          <div className="ht2-lam-y-nut" role="group" aria-label={`Chọn cho ý ${chu}`}>
            {(['D', 'S'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={chon[i] === v} disabled={khoa} onClick={() => onChon(i, v)}>
                {chon[i] === v && <Check size={18} strokeWidth={2.6} aria-hidden="true" />}
                {chuDS(v)}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Bản đồ ý ở thanh đáy: "a · Đ" "b · S" "c" "d". */
export function BanDoY({ value }: { value: string }) {
  const so = CHU_Y.filter((_, i) => value[i] === 'D' || value[i] === 'S').length
  return (
    <div className="ht2-lam-ban-do" role="img" aria-label={`Đã chọn ${so} trên 4 ý`}>
      {CHU_Y.map((chu, i) => {
        const v = value[i] === 'D' ? 'Đ' : value[i] === 'S' ? 'S' : ''
        return <span key={chu} data-co={!!v || undefined}>{v ? `${chu} · ${v}` : chu}</span>
      })}
    </div>
  )
}

// ───────────────────────────── TRẮC NGHIỆM · đang làm ─────────────────────────────

/** Bốn ô lựa chọn lớn (≥ 56 px), chạm CẢ Ô, `role=radio`; phím mũi tên chuyển ô như nhóm radio. */
/** `tranh` (nâng cấp 27/10): tranh minh hoạ từng phương án (phân tử) — màn Duo truyền vào; thiếu ⇒ như cũ. */
export function ChonTracNghiem({ q, value, onChon, khoa, tranh }: { q: Question; value: string; onChon: (v: 'A' | 'B' | 'C' | 'D') => void; khoa: boolean; tranh?: ReactNode[] }) {
  const nut = useRef<(HTMLButtonElement | null)[]>([])
  const dangChon = CHU_PA.indexOf(value as 'A')
  const phim = (e: KE<HTMLDivElement>) => {
    const buoc = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!buoc || khoa) return
    e.preventDefault()
    const tu = Math.max(0, nut.current.findIndex((b) => b === document.activeElement))
    const den = (tu + buoc + 4) % 4
    onChon(CHU_PA[den]!)
    nut.current[den]?.focus()
  }
  return (
    <div className="ht2-lam-tn" role="radiogroup" aria-label="Chọn một đáp án" onKeyDown={phim}>
      {CHU_PA.map((chu, i) => {
        const anhSau = q.hinhAnh.filter((h) => h.viTri === `sau_pa_${chu}`)
        const gopAnh = !q.choiceImgs?.[i] && anhSau.length > 0 && laChuGiuCho(q.choices[i] ?? '')
        return (
          <div key={chu} className="ht2-lam-pa-khoi">
            <button
              ref={(b) => { nut.current[i] = b }}
              type="button"
              role="radio"
              aria-checked={value === chu}
              tabIndex={(dangChon < 0 ? i === 0 : dangChon === i) ? 0 : -1}
              disabled={khoa}
              className="ht2-lam-pa"
              onClick={() => onChon(chu)}
            >
              <b className="ht2-lam-pa-ma">{chu}</b>
              {tranh?.[i]}
              <span className="ht2-lam-pa-chu">
                {gopAnh ? anhSau.map((h, k) => <img key={k} src={h.src} alt={h.alt ?? `Phương án ${chu}`} loading="lazy" decoding="async" className="ht2-lam-anh-nho" />) : <NoiDung chu={q.choices[i] ?? ''} anh={q.choiceImgs?.[i]} alt={`Phương án ${chu}`} />}
              </span>
            </button>
            {!gopAnh && <HinhTaiViTri hinhAnh={hinh(q)} viTri={`sau_pa_${chu}`} nhan={`phương án ${chu}`} />}
          </div>
        )
      })}
    </div>
  )
}

// ───────────────────────────── TRẢ LỜI NGẮN · đúng số ô của câu (thiếu ⇒ 4 như phiếu) + bàn phím số ─────────────────────────────

/** `soO` ô = đúng số kí tự đáp số máy chủ gửi kèm (thầy 15/10; 1–4 ô giữ cỡ ô phiếu 58 px, hơn 4 ô co lại cho vừa màn); thiếu ⇒ 4 như phiếu.
 *  Đáp án cũ dài hơn vẫn hiện đủ. Ô đang nhập viền nét đứt.
 *  KHÔNG có ô nhập ⇒ không bật bàn phím điện thoại. */
export function OPhieu({ value, ket, soO = TOI_DA_KY_TU, hu }: { value: string; ket?: 'dung' | 'sai' | 'trung'; soO?: number; hu?: HieuUngO }) {
  const so = Math.max(soO, value.length)
  return (
    <div className="ht2-lam-o-hang" aria-hidden="true" data-ket={ket} data-nhieu={so > TOI_DA_KY_TU || undefined} style={so > TOI_DA_KY_TU ? { '--so-o': so } as CSSProperties : undefined}>
      {Array.from({ length: so }, (_, i) => {
        const moi = !!hu && hu.moi === i && i < value.length
        return (
          <span key={i} className="ht2-lam-o" data-tt={i < value.length ? 'co' : i === value.length && !ket ? 'dang' : 'trong'} data-nay={moi ? (hu!.nhip % 2 ? 'a' : 'b') : undefined}>
            {/* chữ số vừa bấm: phần tử MỚI (key theo nhịp) ⇒ hiệu ứng bật vào ô chạy đúng một lần cho đúng ô ấy */}
            {i < value.length ? (hu ? <span key={moi ? `m${hu.nhip}` : 'c'} className="ht2-lam-so" data-moi={moi || undefined}>{kyTuHien(value[i]!)}</span> : kyTuHien(value[i]!))
              : i === value.length && !ket ? <i className="ht2-lam-con-tro" /> : ''}
            {hu?.bong && hu.bong.i === i && i >= value.length && <span key={`x${hu.bong.id}`} className="ht2-lam-bong">{kyTuHien(hu.bong.ch)}</span>}
          </span>
        )
      })}
    </div>
  )
}

/** Trạng thái hiệu ứng của hàng ô khi em đang gõ: ô vừa nhận kí tự (`moi`, `nhip` tăng mỗi lần) + bóng kí tự vừa xoá. */
export interface HieuUngO { moi: number; nhip: number; bong: { i: number; ch: string; id: number } | null }
const BONG_MS = 110
/** So giá trị trước / sau (`doiO`) TRƯỚC khi vẽ (layout effect ⇒ không nháy): chữ số mới bật vào ô, ô nảy nhẹ; xoá ⇒ bóng kí tự thu nhỏ 100 ms. */
function useHieuUngO(value: string): HieuUngO {
  const truoc = useRef(value)
  const [hu, setHu] = useState<HieuUngO>({ moi: -1, nhip: 0, bong: null })
  useLayoutEffect(() => {
    const cu = truoc.current
    truoc.current = value
    if (cu === value) return
    const d = doiO(cu, value)
    // bóng kí tự xoá chỉ có tờ trình bày ở giao diện «Trong» (styles/trong-lam-bai.css) ⇒ giao diện cũ không vẽ bóng
    if (!document.documentElement.dataset.trong) d.bong = null
    setHu((h) => ({ moi: d.moi, nhip: d.moi >= 0 ? h.nhip + 1 : h.nhip, bong: d.bong ? { ...d.bong, id: h.nhip + Date.now() } : null }))
  }, [value])
  useEffect(() => {
    if (!hu.bong) return
    const t = window.setTimeout(() => setHu((h) => ({ ...h, bong: null })), BONG_MS)
    return () => window.clearTimeout(t)
  }, [hu.bong])
  return hu
}

export function OTraLoiNgan({ value, soO }: { value: string; soO?: number }) {
  const hu = useHieuUngO(value)
  return (
    <section className="ht2-lam-tln" aria-label="Ô trả lời">
      <OPhieu value={value} soO={soO} hu={hu} />
      <output className="ht2-an" aria-live="polite">{value ? `Đáp án của em: ${[...value].map(kyTuHien).join('')}` : 'Chưa nhập đáp án'}</output>
    </section>
  )
}

const HANG_PHIM: { p: PhimSo; chu?: string; ten?: string; chuc?: true; rong?: true }[] = [
  { p: '1' }, { p: '2' }, { p: '3' }, { p: 'xoa', ten: 'Xoá một kí tự', chuc: true },
  { p: '4' }, { p: '5' }, { p: '6' }, { p: ',', chu: ',', ten: 'Dấu phẩy', chuc: true },
  { p: '7' }, { p: '8' }, { p: '9' }, { p: '-', chu: '−', ten: 'Dấu trừ', chuc: true },
  { p: '0', rong: true }, { p: 'xoa-het', chu: 'Xoá hết', chuc: true, rong: true },
]
/** Khung cuộn gần nhất của một phần tử (màn học sinh nằm trong lớp bọc `fixed … overflow-y-auto`); không có ⇒ khung trang. */
function khungCuon(el: HTMLElement): HTMLElement {
  for (let e = el.parentElement; e; e = e.parentElement) {
    const oy = getComputedStyle(e).overflowY
    if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight) return e
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}

/** Bàn phím số riêng trong thanh đáy: 1–9, 0, dấu phẩy, dấu trừ, xoá một kí tự, xoá hết. Phím hết tác dụng thì mờ (đủ `soO` kí tự, đã có dấu phẩy…).
 *  KIỂU DUOLINGO (thầy 27/10): mỗi phím là mặt phím trên gờ đáy 4 px — chạm ⇒ mặt lún xuống (≥ 80 ms, chỉ transform) rồi bật lại; mỗi lần bấm
 *  `phanHoi('chon')` (rung + tiếng «tách»). Gõ số trên máy tính: phím tương ứng trên màn cũng lún + phản hồi (việc NHẬP vẫn do màn cha lo như cũ).
 *  Lúc bắt đầu câu: màn thấp ⇒ tự cuộn để trọn bàn phím nằm trên thanh đáy dính (không cuộn mất ô đáp án). */
export function BanPhimSo({ value, onPhim, khoa, soO = TOI_DA_KY_TU }: { value: string; onPhim: (p: PhimSo) => void; khoa: boolean; soO?: number }) {
  const goc = useRef<HTMLDivElement>(null)
  const nut = useRef<Partial<Record<PhimSo, HTMLButtonElement | null>>>({})
  const hen = useRef(new Map<PhimSo, number>())
  const lucAn = useRef(new Map<PhimSo, number>())
  const hienTai = useRef({ value, khoa, soO })
  hienTai.current = { value, khoa, soO }
  // 27/10 MƯỢT: màn Duo đọc `.duo[data-co-phim]` (bố cục hai cột khi có bàn phím số) thay cho `.duo:has(.ht2-lam-phim)` — :has() ở khối cha
  // làm tính lại kiểu cả trang mỗi lần đổi nút. Gắn trước lần sơn (layout effect), gỡ khi bàn phím rời đi.
  useLayoutEffect(() => {
    const duo = goc.current?.closest('.duo')
    if (!duo) return
    duo.setAttribute('data-co-phim', '')
    return () => duo.removeAttribute('data-co-phim')
  }, [])
  const lun = (p: PhimSo) => {
    const b = nut.current[p]
    if (!b) return
    window.clearTimeout(hen.current.get(p))
    b.setAttribute('data-an', '')
    lucAn.current.set(p, performance.now())
  }
  const nha = (p: PhimSo, toiThieu = LUN_TOI_THIEU_MS) => {
    const b = nut.current[p]
    if (!b || !b.hasAttribute('data-an')) return
    const con = Math.max(0, toiThieu - (performance.now() - (lucAn.current.get(p) ?? 0)))
    hen.current.set(p, window.setTimeout(() => b.removeAttribute('data-an'), con))
  }
  // Gõ phím máy tính: chỉ hiệu ứng + phản hồi (KHÔNG nhập — màn cha đã nghe phím và nhập như cũ). Cùng điều kiện bỏ qua với màn cha.
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target instanceof HTMLElement ? e.target : null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('[role=dialog]'))) return
      const p = phimTuBanPhim(e.key)
      const { value: v, khoa: k, soO: n } = hienTai.current
      if (!p || k || !phimCoTacDung(v, p, n)) return
      lun(p)
      nha(p)
      if (!e.repeat) phanHoi('chon')
    }
    window.addEventListener('keydown', f)
    const ds = hen.current
    return () => { window.removeEventListener('keydown', f); for (const t of ds.values()) window.clearTimeout(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Bắt đầu câu (bàn phím dựng lại theo câu): đo rồi cuộn vừa đủ để thấy ô đáp án + bàn phím + «Kiểm tra».
  // 29/10 (thầy, video 11:00 «Vẫn bị khựng chỗ mở câu»): trước đây đo SAU hai khung vẽ rồi cuộn MƯỢT ~0,35 s ⇒ câu vừa hiện đã trượt lên ngay trước mắt em. Nay đo + cuộn TỨC THÌ
  // trong lượt layout (trước lần vẽ đầu) ⇒ khung đầu tiên đã ở đúng vị trí, không trượt. Bố cục chưa có (cao 0) ⇒ đo lại sau khung vẽ, vẫn cuộn tức thì (không trượt).
  useLayoutEffect(() => {
    const el = goc.current
    if (!el || !el.closest('.duo')) return
    const cuon = (): boolean => {
      if (el.getBoundingClientRect().height <= 0) return false
      const khung = khungCuon(el)
      const laTrang = khung === document.scrollingElement || khung === document.documentElement
      const thanh = el.closest('.duo')?.querySelector<HTMLElement>('.duo-day')
      const dinh = !!thanh && getComputedStyle(thanh).position === 'sticky'
      const kTren = laTrang ? 0 : khung.getBoundingClientRect().top
      const kDuoi = laTrang ? window.innerHeight : khung.getBoundingClientRect().bottom
      const o = el.closest('.duo')?.querySelector<HTMLElement>('.ht2-lam-o-hang')
      // thanh đáy không dính (điện thoại ngang: nằm ngay dưới bàn phím trong cột phải) ⇒ đưa luôn nút KIỂM TRA vào khung nếu vừa
      const nutKt = !dinh ? thanh?.querySelector<HTMLElement>('.duo-nut') : null
      const d = cuonThayBanPhim({
        phimDay: Math.max(el.getBoundingClientRect().bottom, nutKt?.getBoundingClientRect().bottom ?? 0),
        thanhTren: dinh ? Math.min(thanh!.getBoundingClientRect().top, kDuoi) : kDuoi,
        oTren: (o ?? el).getBoundingClientRect().top,
        khungTren: kTren,
      })
      if (d > 0) khung.scrollBy({ top: d, behavior: 'auto' })
      return true
    }
    let r1 = 0, r2 = 0
    if (!cuon()) r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => { cuon() }) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [])
  return (
    <div ref={goc} className="ht2-lam-phim" role="group" aria-label="Bàn phím số">
      {HANG_PHIM.map(({ p, chu, ten, chuc, rong }) => (
        <button
          key={p}
          ref={(b) => { nut.current[p] = b }}
          type="button"
          aria-label={ten}
          data-chuc={chuc || undefined}
          data-rong={rong || undefined}
          disabled={khoa || !phimCoTacDung(value, p, soO)}
          onPointerDown={(e) => { if (e.button === 0 || e.pointerType !== 'mouse') lun(p) }}
          onPointerUp={() => nha(p)}
          onPointerLeave={() => nha(p)}
          onPointerCancel={() => nha(p)}
          onClick={(e) => { if (e.detail === 0) { lun(p); nha(p) } phanHoi('chon'); onPhim(p) }}
        >
          <span className="ht2-lam-phim-mat">{p === 'xoa' ? <Delete size={22} aria-hidden="true" /> : chu ?? p}</span>
        </button>
      ))}
    </div>
  )
}

// ───────────────────────────── SAU KHI NỘP ─────────────────────────────

const DauDung = () => <Check size={16} strokeWidth={2.6} aria-hidden="true" />
const DauSai = () => <XIcon size={16} strokeWidth={2.6} aria-hidden="true" />

/** Đúng–sai sau khi nộp: từng ý "Em chọn X · đáp án Y" (màu + biểu tượng), giải thích ý sai MỞ SẴN khi lời giải tách được theo ý. */
export function PhanHoiDungSai({ q, tra, dapAn, lyDo }: { q: Question; tra: string; dapAn: string; lyDo: (chu: 'a' | 'b' | 'c' | 'd') => string | undefined }) {
  return (
    <div className="ht2-lam-ds">
      {soSanhDungSai(tra, dapAn).map((y, i) => {
        const ket = y.chon === null ? 'trung' : y.dung ? 'dung' : 'sai'
        const giai = ket === 'sai' ? lyDo(y.chu) : undefined
        return (
          <section key={y.chu} className="ht2-lam-y" data-ket={ket} aria-label={`Ý ${y.chu}${ket === 'trung' ? '' : ket === 'dung' ? ', đúng' : ', sai'}`}>
            <div className="ht2-lam-y-dau">
              <b className="ht2-lam-chu-cai" aria-hidden="true">{y.chu}</b>
              <div className="ht2-lam-y-chu"><NoiDung chu={q.ideas[i] ?? ''} anh={q.ideaImgs?.[i]} alt={`Ý ${y.chu}`} /></div>
            </div>
            <HinhTaiViTri hinhAnh={hinh(q)} viTri={`sau_y_${y.chu}`} nhan={`ý ${y.chu}`} />
            <p className="ht2-lam-y-ket">
              {ket === 'sai' ? <DauSai /> : <DauDung />}
              {y.chon ? `Em chọn ${chuDS(y.chon)} · đáp án ${chuDS(y.dapAn)}` : `Đáp án ${chuDS(y.dapAn)}`}
            </p>
            {giai?.trim() && <div className="ht2-lam-y-giai"><ChemText text={giai} /></div>}
          </section>
        )
      })}
    </div>
  )
}

/** Trắc nghiệm sau khi nộp: ô em chọn / ô đáp án đánh dấu (chữ + biểu tượng), các ô khác mờ. */
export function PhanHoiTracNghiem({ q, tra, dapAn, tranh }: { q: Question; tra: string; dapAn: string; tranh?: ReactNode[] }) {
  return (
    <div className="ht2-lam-tn" aria-label="Các lựa chọn">
      {CHU_PA.map((chu, i) => {
        const laDapAn = dapAn === chu, emChon = tra === chu
        const ket = laDapAn ? 'dung' : emChon ? 'sai' : 'mo'
        const nhan = emChon && laDapAn ? 'Em chọn · đáp án' : laDapAn ? 'Đáp án' : emChon ? 'Em chọn' : ''
        const anhSau = q.hinhAnh.filter((h) => h.viTri === `sau_pa_${chu}`)
        const gopAnh = !q.choiceImgs?.[i] && anhSau.length > 0 && laChuGiuCho(q.choices[i] ?? '')
        return (
          <div key={chu} className="ht2-lam-pa-khoi">
            <div className="ht2-lam-pa" data-ket={ket}>
              <b className="ht2-lam-pa-ma">{chu}</b>
              {tranh?.[i]}
              <span className="ht2-lam-pa-chu">{ket !== 'mo' && <span className="ht2-an">Phương án {chu}: </span>}{gopAnh ? anhSau.map((h, k) => <img key={k} src={h.src} alt={h.alt ?? `Phương án ${chu}`} loading="lazy" decoding="async" className="ht2-lam-anh-nho" />) : <NoiDung chu={q.choices[i] ?? ''} anh={q.choiceImgs?.[i]} alt={`Phương án ${chu}`} />}</span>
              {nhan && <small className="ht2-lam-pa-nhan">{nhan}</small>}
            </div>
            {!gopAnh && <HinhTaiViTri hinhAnh={hinh(q)} viTri={`sau_pa_${chu}`} nhan={`phương án ${chu}`} />}
          </div>
        )
      })}
    </div>
  )
}

/** Trả lời ngắn sau khi nộp: các ô (số ô của câu, thiếu ⇒ 4) với đáp án của em + dòng "Em trả lời … · đáp án …". */
export function PhanHoiTraLoiNgan({ tra, dapAn, dung, soO }: { tra: string; dapAn: string; dung: boolean; soO?: number }) {
  const ket = !tra ? 'trung' : dung ? 'dung' : 'sai'
  return (
    <section className="ht2-lam-tln" aria-label="Đáp án">
      {tra && <OPhieu value={tra} ket={ket} soO={soO} />}
      <p className="ht2-lam-y-ket" data-ket={ket}>
        {ket === 'sai' ? <DauSai /> : <DauDung />}
        {tra ? <>Em trả lời {[...tra].map(kyTuHien).join('')} · đáp án <ChemText text={dapAn} /></> : <>Đáp án <ChemText text={dapAn} /></>}
      </p>
    </section>
  )
}

/** Lời giải chuẩn như hiện nay (`loiGiaiChuanTuKho` → `KhoiLoiGiaiChuan`) + hình sau lời giải máy chủ gửi kèm. */
export function LoiGiaiCau({ q, solution, dapAn, hinhLoiGiai, children }: { q: Question; solution: unknown; dapAn: string; hinhLoiGiai?: Question['hinhAnh']; children?: ReactNode }) {
  return (
    <section className="ht2-lam-loi-giai" aria-label="Lời giải">
      <KhoiLoiGiaiChuan phan={q.phan} loiGiai={loiGiaiChuanTuKho(solution, q.phan, dapAn)} explanation={typeof solution === 'string' ? solution : undefined} correct={dapAn}>
        <HinhTaiViTri hinhAnh={hinhLoiGiai as Hinh | undefined} viTri="sau_loi_giai" nhan="lời giải" />
        {children}
      </KhoiLoiGiaiChuan>
    </section>
  )
}

/** Bảng số liệu trong đề ở các màn luyện của em (làm chặng · Kiểm tra ôn tập · Tự sửa lỗi). 27/10 (thầy: bảng «Chất | Ammonia | Methylamine |
 *  Ethylamine…» tràn phải, cột cuối bị cắt): bảng HAI hàng rộng hơn khung ⇒ tự xoay DỌC (mỗi chất một hàng; đủ chỗ lại thì về ngang); bảng lớn ⇒ cuộn
 *  ngang trong khung, bóng mờ ở mép còn nội dung. Đo bằng ResizeObserver + cuộn; vẽ lại bằng BangSoLieu sẵn có (bảng đã xoay khi cần). */
function BangDe({ table }: { table?: string[][] }) {
  const k = useRef<HTMLDivElement>(null)
  const [[doc, mep], dat] = useState<[number, string]>([0, ''])
  const hai = table?.length === 2 && table[0]!.length > 2
  useLayoutEffect(() => {
    const e = k.current?.firstElementChild as HTMLElement | null
    if (!e) return
    const f = () => {
      if (doc) { if (e.clientWidth >= doc) dat([0, '']); return }
      const w = e.scrollWidth, c = e.clientWidth, l = e.scrollLeft
      if (w > c + 1 && hai) return dat([w, ''])
      dat([0, `${l > 1 ? 'inset 14px 0 12px -12px var(--phu)' : ''}${l > 1 && l + c < w - 1 ? ',' : ''}${l + c < w - 1 ? 'inset -14px 0 12px -12px var(--phu)' : ''}`])
    }
    f(); e.onscroll = f
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(f) : null
    ro?.observe(e)
    return () => { e.onscroll = null; ro?.disconnect() }
  }, [doc, hai, table])
  if (!table?.length) return null
  const bang = doc ? table[0]!.map((c, j) => [c, table[1]![j] ?? '']) : table
  return <div ref={k} className="bang-de" data-doc={doc ? '' : undefined} style={{ ['--bang-mep' as string]: mep || 'none' }}><BangSoLieu table={bang} /></div>
}
