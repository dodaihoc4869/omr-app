// PHẦN HIỂN THỊ của màn làm bài học sinh (bản vẽ dot13 thầy duyệt 12/10). Màn luyện DỰNG RIÊNG phần trả lời — KHÔNG đụng `TheCau`
// (thẻ câu dùng chung cho màn thi, màn thầy, phiếu…); chỉ dùng lại các mảnh hiển thị đề/hình/công thức mà `TheCau` cũng dùng
// (ChemText · tachDongTheoY · ExperimentDemo · BangSoLieu · CauHinh · HinhTaiViTri · KhoiLoiGiaiChuan) để chữ và hình ra y hệt.
// Màu: chỉ biến của app học sinh (hoc-tap.css, khối `.ht2-lam*`). Đáp án chỉ có ở các khối PHẢN HỒI — nhận từ máy chủ SAU khi nộp.
import { useRef, useSyncExternalStore, type KeyboardEvent as KE, type ReactNode } from 'react'
import { Check, Delete, X as XIcon } from 'lucide-react'
import ExperimentDemo, { ExperimentOriginal } from '../ExperimentDemo'
import { BangSoLieu, CauHinh, HinhTaiViTri } from '../QuestionMedia'
import KhoiLoiGiaiChuan, { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { ChemText } from '../../lib/chem-format'
import { tachDongTheoY } from '../../lib/tach-dong-cau'
import { laChuGiuCho } from '../../lib/anh-phuong-an'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from '../../game/than-thu-v2/core'
import { TOI_DA_KY_TU, chuDS, kyTuHien, phimCoTacDung, soSanhDungSai, type PhimSo } from './lam-bai'
import '../m3/the-cau.css'

// ── BỐ CỤC THEO KHỔ MÀN (làn B đợt 16, thầy 12/10: "Tối ưu cho dọc ngang máy tính tất cả các màn làm bài của học sinh phải siêu đẹp và
// thân thiện"). CÙNG điểm ngắt với hoc-tap.css: 'rong' = màn ≥ 900 px và cao > 560 px (máy tính, máy tính bảng ngang) · 'thap' = điện
// thoại xoay ngang (cao ≤ 560 px, rộng ≥ 640 px) · còn lại 'doc' (GIỮ NGUYÊN bản dọc). Không có matchMedia (jsdom, máy chủ) ⇒ 'doc'.
// Chỉ quyết CHỖ ĐẶT phần trả lời (cột trái dưới đề hay cột phải cạnh nút Nộp) — không đổi đáp án, nháp, thời gian, lệnh máy chủ.
export type BoCucLam = 'doc' | 'rong' | 'thap'
export const MQ_LAM_THAP = '(max-height: 560px) and (min-width: 640px)'
export const MQ_LAM_RONG = '(min-width: 900px)'
/** Bố cục theo bề rộng × chiều cao khung nhìn (thuần — test được không cần trình duyệt). */
export function chonBoCucLam(rong: number, cao: number): BoCucLam {
  if (cao <= 560 && rong >= 640) return 'thap'
  if (rong >= 900) return 'rong'
  return 'doc'
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
export function DeCau({ q, stt }: { q: Question; stt: number }) {
  const de = tachDongTheoY(q.text)
  return (
    <section className="ht2-lam-de" aria-label={`Đề câu ${stt}`}>
      {q.thanCauImg ? (
        <>
          <p className="ht2-lam-de-chu"><b>Câu {stt}.</b></p>
          <CauHinh src={q.thanCauImg} alt={`Đề câu ${stt}`} />
        </>
      ) : (
        <p className="ht2-lam-de-chu"><b>Câu {stt}.</b> <ChemText text={de} /></p>
      )}
      <ExperimentDemo text={de} />
      <BangSoLieu table={q.table} />
      <ExperimentOriginal text={q.text} hasImages={Boolean(q.imageDataUrl || q.hinhAnh.some((h) => h.viTri === 'sau_de'))}>
        {q.imageDataUrl && <CauHinh src={q.imageDataUrl} alt={`Hình câu ${stt}`} />}
        <HinhTaiViTri hinhAnh={hinh(q)} viTri="sau_de" nhan={`câu ${stt}`} />
      </ExperimentOriginal>
    </section>
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
export function ChonTracNghiem({ q, value, onChon, khoa }: { q: Question; value: string; onChon: (v: 'A' | 'B' | 'C' | 'D') => void; khoa: boolean }) {
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

// ───────────────────────────── TRẢ LỜI NGẮN · 4 ô như phiếu + bàn phím số ─────────────────────────────

/** Bốn ô như phiếu (đáp án cũ dài hơn 4 kí tự vẫn hiện đủ). Ô đang nhập viền nét đứt. KHÔNG có ô nhập ⇒ không bật bàn phím điện thoại. */
export function OPhieu({ value, ket }: { value: string; ket?: 'dung' | 'sai' | 'trung' }) {
  const so = Math.max(TOI_DA_KY_TU, value.length)
  return (
    <div className="ht2-lam-o-hang" aria-hidden="true" data-ket={ket}>
      {Array.from({ length: so }, (_, i) => (
        <span key={i} className="ht2-lam-o" data-tt={i < value.length ? 'co' : i === value.length && !ket ? 'dang' : 'trong'}>
          {i < value.length ? kyTuHien(value[i]!) : i === value.length && !ket ? <i className="ht2-lam-con-tro" /> : ''}
        </span>
      ))}
    </div>
  )
}

export function OTraLoiNgan({ value }: { value: string }) {
  return (
    <section className="ht2-lam-tln" aria-label="Ô trả lời">
      <OPhieu value={value} />
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
/** Bàn phím số riêng trong thanh đáy: 1–9, 0, dấu phẩy, dấu trừ, xoá một kí tự, xoá hết. Phím hết tác dụng thì mờ (đủ 4 kí tự, đã có dấu phẩy…). */
export function BanPhimSo({ value, onPhim, khoa }: { value: string; onPhim: (p: PhimSo) => void; khoa: boolean }) {
  return (
    <div className="ht2-lam-phim" role="group" aria-label="Bàn phím số">
      {HANG_PHIM.map(({ p, chu, ten, chuc, rong }) => (
        <button key={p} type="button" aria-label={ten} data-chuc={chuc || undefined} data-rong={rong || undefined} disabled={khoa || !phimCoTacDung(value, p)} onClick={() => onPhim(p)}>
          {p === 'xoa' ? <Delete size={22} aria-hidden="true" /> : chu ?? p}
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
export function PhanHoiTracNghiem({ q, tra, dapAn }: { q: Question; tra: string; dapAn: string }) {
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

/** Trả lời ngắn sau khi nộp: 4 ô với đáp án của em + dòng "Em trả lời … · đáp án …". */
export function PhanHoiTraLoiNgan({ tra, dapAn, dung }: { tra: string; dapAn: string; dung: boolean }) {
  const ket = !tra ? 'trung' : dung ? 'dung' : 'sai'
  return (
    <section className="ht2-lam-tln" aria-label="Đáp án">
      {tra && <OPhieu value={tra} ket={ket} />}
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
