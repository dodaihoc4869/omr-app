// THẺ CÂU HỎI — một component, hai trạng thái (GIAO-DIEN-LAM-BAI.md):
//   cheDo "thi"     : KHÔNG tô đáp án đúng, KHÔNG ô giải thích, xanh = ĐANG CHỌN.
//                     Props `correct`/`explanation` không bao giờ được truyền
//                     (bank công khai không có đáp án — xem examContent.ts).
//   cheDo "xem_lai" : xanh = ĐÚNG (✓), đỏ = em chọn sai (✗), có ô giải thích.
// Chữ đề/phương án/ý dùng class .cau-de/.pa-noi-dung/.y-noi-dung (serif 17px,
// giãn dòng 1.9 — index.css); chữ cái A/B/C/D rộng cố định 28px. Chạm cả
// hàng. Ảnh cắt từ đề gốc (HinhAnh) nhúng đúng vị trí: sau đề, sau từng
// phương án/ý (đi theo chữ cái GỐC khi xáo), cuối câu. Chỉ dùng biến tokens.css.
import { Check, X as XIcon } from 'lucide-react'
import type { HinhAnh } from '../data/examContent'
import { ChemText } from '../lib/chem-format'
import { BangSoLieu, CauHinh, HinhTaiViTri } from './QuestionMedia'
import { TheNoiDung, DauThe, Hang, OThongBao } from './DesignSystem'

export type CheDo = 'thi' | 'xem_lai'
type Chu = 'A' | 'B' | 'C' | 'D'
type DS = 'D' | 'S'

interface BaseProps {
  cheDo: CheDo
  /** Số thứ tự liên tục 1..N trên cả bài — hiện ở ô đầu thẻ và quyết định
   * màu gradient xoay vòng ((stt-1) % 4). */
  stt: number
  /** Tên chuyên đề ngắn từ ngân hàng câu hỏi — không có thì đầu thẻ chỉ hiện số. */
  tieuDe?: string
  /** id DOM để cuộn tới từ lưới số câu. */
  id?: string
  text: string
  thanCauImg?: string
  table?: string[][]
  imageDataUrl?: string
  hinhAnh?: HinhAnh[]
  /** Chỉ chế độ xem lại. */
  explanation?: string
  onZoom?: (src: string) => void
}

interface McqProps extends BaseProps {
  phan: 'I'
  choices: [string, string, string, string]
  choiceImgs?: [string?, string?, string?, string?]
  choicePerm: number[]
  selected: Chu | null
  onSelect?: (orig: Chu) => void
  correct?: Chu
}

interface TfProps extends BaseProps {
  phan: 'II'
  ideas: [string, string, string, string]
  ideaImgs?: [string?, string?, string?, string?]
  selected: (DS | null)[]
  onSelect?: (ideaIdx: number, v: DS) => void
  correct?: [DS, DS, DS, DS]
}

interface SaProps extends BaseProps {
  phan: 'III'
  selected: string | null
  onChange?: (text: string) => void
  correct?: string
}

export type TheCauProps = McqProps | TfProps | SaProps

const CHU_CAI: React.CSSProperties = { fontFamily: 'var(--serif)', fontWeight: 700, width: 28, flexShrink: 0, lineHeight: 1.9 }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', flexShrink: 0 }

function normSo(s: string): string {
  return s.trim().replace(',', '.')
}

function DauDung() {
  return (
    <span className="shrink-0 flex items-center justify-center rounded-full text-white" style={{ width: 22, height: 22, background: 'var(--xanh)' }} aria-label="đúng">
      <Check size={14} />
    </span>
  )
}
function DauSai() {
  return (
    <span className="shrink-0 flex items-center justify-center rounded-full text-white" style={{ width: 22, height: 22, background: 'var(--do)' }} aria-label="sai">
      <XIcon size={14} />
    </span>
  )
}

function GiaiThich({ text }: { text?: string }) {
  return <OThongBao>{text?.trim() ? <ChemText text={text} /> : 'Thầy chưa nhập lời giải cho câu này.'}</OThongBao>
}

export default function TheCau(props: TheCauProps) {
  const { cheDo, stt, tieuDe, id, text, thanCauImg, table, imageDataUrl, hinhAnh, onZoom } = props
  const xemLai = cheDo === 'xem_lai'
  const nhan = `câu ${stt}`

  let body: React.ReactNode
  if (props.phan === 'I') {
    const { choices, choiceImgs, choicePerm, selected, onSelect, correct } = props
    body = (
      <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
        {choicePerm.map((origIdx, displayPos) => {
          const letter = 'ABCD'[displayPos] as Chu
          const orig = 'ABCD'[origIdx] as Chu
          const daChon = selected === orig
          const laDung = xemLai && correct === orig
          const chonSai = xemLai && daChon && !laDung
          const trangThai = laDung ? 'dung' : chonSai ? 'sai' : daChon ? 'chon' : 'trong'
          const img = choiceImgs?.[origIdx]
          return (
            <div key={displayPos} className="flex flex-col">
              <Hang
                selected={laDung || chonSai || (!xemLai && daChon)}
                tone={chonSai ? 'do' : 'xanh'}
                onClick={!xemLai && onSelect ? () => onSelect(orig) : undefined}
                data-trang-thai={trangThai}
              >
                <span style={{ ...CHU_CAI, color: trangThai === 'trong' ? 'var(--nhat)' : chonSai ? 'var(--do)' : 'var(--xanh)' }}>{letter}.</span>
                <span className="flex-1 min-w-0 pa-noi-dung" style={{ overflowWrap: 'break-word' }}>
                  {img ? <img src={img} alt={`Phương án ${letter}`} className="max-h-14 w-auto" /> : <ChemText text={choices[origIdx]} />}
                </span>
                {laDung && <DauDung />}
                {chonSai && <DauSai />}
              </Hang>
              <HinhTaiViTri hinhAnh={hinhAnh} viTri={`sau_pa_${orig}`} onZoom={onZoom} nhan={`${nhan} — phương án ${letter}`} />
            </div>
          )
        })}
      </div>
    )
  } else if (props.phan === 'II') {
    const { ideas, ideaImgs, selected, onSelect, correct } = props
    body = (
      <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
        {ideas.map((idea, i) => {
          const chu = 'abcd'[i] as 'a' | 'b' | 'c' | 'd'
          const val = selected[i] ?? null
          const dapAn = xemLai ? correct?.[i] : undefined
          const dung = xemLai && val !== null && val === dapAn
          const sai = xemLai && val !== null && val !== dapAn
          const img = ideaImgs?.[i]
          const nut = (v: DS, ten: string) => {
            const dangChon = val === v
            // Chế độ thi: cả Đúng lẫn Sai khi chọn đều tô XANH (xanh = đang
            // chọn) — --do chỉ dùng ở chế độ xem lại, đúng GIAO-DIEN-LAM-BAI.md.
            const laDapAn = xemLai && dapAn === v
            const chonSai = xemLai && dangChon && !laDapAn
            const noiBat = laDapAn || chonSai || (!xemLai && dangChon)
            const mauVien = chonSai ? 'var(--do)' : 'var(--xanh)'
            return (
              <button
                type="button"
                disabled={xemLai}
                onClick={!xemLai && onSelect ? () => onSelect(i, v) : undefined}
                className="tap-target shrink-0 font-bold"
                data-trang-thai={laDapAn ? 'dung' : chonSai ? 'sai' : dangChon ? 'chon' : 'trong'}
                style={{
                  width: 64,
                  minHeight: 44,
                  borderRadius: 'var(--bo-1)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-1)',
                  background: noiBat ? (chonSai ? 'var(--do-nen)' : 'var(--xanh-nen)') : 'var(--the)',
                  border: noiBat ? `1.5px solid ${mauVien}` : '1.5px solid var(--vien)',
                  color: noiBat ? mauVien : 'var(--nhat)',
                  transitionProperty: 'background-color, border-color, color',
                  transitionDuration: 'var(--nhanh)',
                }}
              >
                {ten}
              </button>
            )
          }
          return (
            <div key={i} className="flex flex-col">
              <div className="y-hang" data-y={chu}>
                <div className="y-noi-dung flex items-start" style={{ gap: 'var(--k2)' }}>
                  <span style={{ ...CHU_CAI, width: 24, color: 'var(--nhat)' }}>{chu})</span>
                  <span className="flex-1 min-w-0" style={{ overflowWrap: 'break-word' }}>
                    {img ? <img src={img} alt={`Ý ${chu}`} className="max-h-14 w-auto" /> : <ChemText text={idea} />}
                  </span>
                </div>
                <div className="y-nut">
                  {nut('D', 'Đúng')}
                  {nut('S', 'Sai')}
                  {dung && <DauDung />}
                  {sai && <DauSai />}
                </div>
              </div>
              <HinhTaiViTri hinhAnh={hinhAnh} viTri={`sau_y_${chu}`} onZoom={onZoom} nhan={`${nhan} — ý ${chu}`} />
            </div>
          )
        })}
      </div>
    )
  } else {
    const { selected, onChange, correct } = props
    const daTraLoi = !!selected?.trim()
    const dung = xemLai && daTraLoi && correct !== undefined && normSo(selected ?? '') === normSo(correct)
    body = xemLai ? (
      <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
        <Hang selected data-trang-thai="dung">
          <span style={NHAN_NHO}>Đáp án</span>
          <span className="flex-1 font-bold cau-de" style={{ fontSize: 'var(--cx-4)' }}>
            <ChemText text={correct ?? ''} />
          </span>
          <DauDung />
        </Hang>
        {daTraLoi ? (
          <Hang selected={!dung} tone="do" data-trang-thai={dung ? 'dung' : 'sai'}>
            <span style={NHAN_NHO}>Em đã trả lời</span>
            <span className="flex-1 font-bold cau-de">{selected}</span>
            {dung ? <DauDung /> : <DauSai />}
          </Hang>
        ) : (
          <div style={NHAN_NHO}>Em chưa trả lời câu này.</div>
        )}
      </div>
    ) : (
      <input
        className="tap-target w-full"
        style={{
          minHeight: 56,
          borderRadius: 'var(--bo-1)',
          padding: 'var(--k3) var(--k4)',
          background: 'var(--the-2)',
          border: `1.5px solid ${daTraLoi ? 'var(--xanh)' : 'transparent'}`,
          fontFamily: 'var(--serif)',
          fontSize: 'var(--cx-3)',
          color: 'var(--muc)',
          outline: 'none',
        }}
        placeholder="Nhập đáp án"
        inputMode="decimal"
        value={selected ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    )
  }

  return (
    <TheNoiDung id={id} noPadding style={{ scrollMarginTop: 72 }}>
      <DauThe index={stt - 1} badge={stt} title={tieuDe?.trim() ?? ''} />
      <div className="flex flex-col" style={{ padding: 'var(--k5)', gap: 'var(--k3)' }}>
        {thanCauImg ? (
          <button type="button" onClick={() => onZoom?.(thanCauImg)} className="block w-full" title="Bấm để phóng to">
            <img src={thanCauImg} alt="Đề bài" className="w-full" style={{ borderRadius: 'var(--bo-1)', border: '1px solid var(--vien)' }} />
          </button>
        ) : (
          <div className="cau-de" style={{ overflowWrap: 'break-word' }}>
            <ChemText text={text} />
          </div>
        )}
        <BangSoLieu table={table} />
        {imageDataUrl && <CauHinh src={imageDataUrl} alt={`Hình ${nhan}`} onZoom={onZoom} />}
        <HinhTaiViTri hinhAnh={hinhAnh} viTri="sau_de" onZoom={onZoom} nhan={nhan} />
        {body}
        <HinhTaiViTri hinhAnh={hinhAnh} viTri="cuoi_cau" onZoom={onZoom} nhan={nhan} />
        {xemLai && <GiaiThich text={props.explanation} />}
      </div>
    </TheNoiDung>
  )
}
