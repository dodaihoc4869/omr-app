// THẺ CÂU HỎI — một component, hai trạng thái (GIAO-DIEN-LAM-BAI.md):
//   cheDo "thi"     : KHÔNG tô đáp án đúng, KHÔNG ô giải thích, xanh = ĐANG CHỌN.
//                     Props `correct`/`explanation` không bao giờ được truyền
//                     (bank công khai không có đáp án — xem examContent.ts).
//   cheDo "xem_lai" : xanh = ĐÚNG (✓), đỏ = em chọn sai (✗), có ô giải thích.
// Chữ đề/phương án/ý dùng class .cau-de/.pa-noi-dung/.y-noi-dung (serif 17px,
// giãn dòng 1.9 — index.css); mã A/B/C/D dùng .pa-ma cùng cỡ chữ. Chạm cả
// hàng, mã thẳng hàng với dòng đầu của nội dung. Ảnh cắt từ đề gốc (HinhAnh) nhúng đúng vị trí: sau đề, sau từng
// phương án/ý (đi theo chữ cái GỐC khi xáo), cuối câu. Chỉ dùng biến tokens.css.
import { Check, RotateCcw, X as XIcon } from 'lucide-react'
import type { HinhAnh, LoiGiaiCauTruc, TrangThaiLoiGiai } from '../data/examContent'
import { ChemText } from '../lib/chem-format'
import { BangSoLieu, CauHinh, HinhTaiViTri } from './QuestionMedia'
import { TheNoiDung, DauThe, Hang, Nhan } from './DesignSystem'

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
  /** Chỉ chế độ xem lại — lời giải dạng chuỗi (dữ liệu cũ). */
  explanation?: string
  /** Chỉ chế độ xem lại — lời giải có cấu trúc (ưu tiên). */
  loiGiai?: LoiGiaiCauTruc
  /** Chỉ chế độ xem lại — nhãn cảnh báo khi pipeline nghi đáp án đề sai /
   * đề thiếu đáp án (NAPDETUDONG.md "Hiển thị trong app"). */
  nhanLoiGiai?: TrangThaiLoiGiai
  /** CÂU HỎI LẠI (thầy chốt 08/09): câu này chính em đã sai buổi trước và được
   * rút lại vào đề lần này. Hiện một dải nhắc ngay đầu thẻ.
   *
   * `soLanSai` = số lần em đã sai câu này TRƯỚC lần làm này; 0 hoặc thiếu thì
   * dải chỉ nhắc, không nêu con số — cấm bịa số. */
  cauHoiLai?: { soLanSai?: number }
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
  /** `ideaIdx` LUÔN là chỉ số Ý GỐC, kể cả khi bốn ý đang hiện ra theo thứ tự
   * xáo. Nhờ vậy đáp án cất đi vẫn theo thứ tự gốc và đường chấm không đổi. */
  onSelect?: (ideaIdx: number, v: DS) => void
  correct?: [DS, DS, DS, DS]
  /** XÁO BỐN Ý: `yPerm[viTríHiểnThị] = chỉSốÝGốc`. Thiếu ⇒ giữ nguyên thứ tự
   * gốc, đúng hành vi cũ của mọi chỗ đang gọi (xem lại, phiếu, ngân hàng câu). */
  yPerm?: number[]
}

interface SaProps extends BaseProps {
  phan: 'III'
  selected: string | null
  onChange?: (text: string) => void
  correct?: string
}

export type TheCauProps = McqProps | TfProps | SaProps

// Mã phương án A./B./C./D. và mã ý a)b)c)d) nay để .pa-ma/.y-ma trong
// index.css lo, để CÙNG cỡ chữ và CÙNG giãn dòng với nội dung — điều kiện thứ
// hai của "thẳng tuyệt đối". Hằng CHU_CAI cũ đặt bề rộng bằng tay nên đã bỏ.
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', flexShrink: 0 }

/** Đáp án đang mang dấu âm chưa. Bỏ khoảng trắng đầu vì em hay gõ lỡ. */
export function laAm(v: string | null | undefined): boolean {
  return String(v ?? '').trimStart().startsWith('-')
}

/** ĐỔI DẤU đáp án phần III — bàn phím số của iPhone không có dấu trừ.
 *
 * Ô trống bấm dấu trừ vẫn ra `-`, để em bấm dấu trước rồi gõ số cũng được. */
export function doiDau(v: string): string {
  const s = String(v ?? '')
  const dau = s.match(/^\s*/)?.[0] ?? ''
  const than = s.slice(dau.length)
  return than.startsWith('-') ? dau + than.slice(1) : dau + '-' + than
}

/** THÊM DẤU PHẨY vào đáp án phần III — thầy báo 07/09: "có một số bàn phím
 * của iPhone không hiển thị dấu ,".
 *
 * `inputMode="decimal"` đáng ra cho dấu thập phân, nhưng trên vài bố cục bàn
 * phím iOS nó ra dấu chấm hoặc không ra gì. Em không gõ nổi `1,5` thì mọi câu
 * có phần thập phân đều mất điểm oan.
 *
 * ĐÃ CÓ dấu thập phân rồi thì không thêm nữa: `1,,5` không phải số. */
export function themPhay(v: string): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('.') ? s : s + ','
}

/** Đáp án đã có dấu thập phân chưa — để khoá nút, không cho gõ thành `1,,5`. */
export function coPhay(v: string | null | undefined): boolean {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('.')
}

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

/** Một dòng lý do: dấu ✓/✗ (theo đáp án ĐANG CHẤM) · mã A./a) · lý do. */
function DongLyDo({ dung, ma, chu }: { dung: boolean; ma: string; chu?: string }) {
  return (
    <div className="lg-y" data-dung={dung ? '1' : '0'}>
      <span className={`lg-dau ${dung ? 'dung' : 'sai'}`} aria-label={dung ? 'đúng' : 'sai'}>
        {dung ? '✓' : '✗'}
      </span>
      <span className="lg-ma">{ma}</span>
      <span className="lg-chu">{chu?.trim() ? <ChemText text={chu} /> : <span style={{ color: 'var(--mo)' }}>(chưa có lý do)</span>}</span>
    </div>
  )
}

/** Ô LỜI GIẢI (THIẾT KẾ LẠI Ô LỜI GIẢI): nhãn nhỏ → câu chốt in đậm, không
 * nghiêng → mỗi phương án/ý MỘT DÒNG có ✓/✗ (Phần I theo thứ tự ĐÃ XÁO của
 * em, mã hiện là chữ đang thấy; lý do tra theo chữ GỐC) · Phần III: các bước
 * đánh số tròn + kết quả nổi màu xanh. Dữ liệu cũ (chỉ có chuỗi) vẫn hiện. */
/** DẢI "EM ĐÃ SAI CÂU NÀY BUỔI TRƯỚC" — nằm ngay dưới đầu thẻ, trước đề bài.
 *
 * Đặt TRƯỚC đề chứ không phải sau: em đọc đề rồi mới thấy nhắc thì đã chọn
 * xong theo đúng lối mòn cũ.
 *
 * ĐÁNH ĐỔI, nói thẳng: dải này cho em biết câu nào là câu cũ, nên em dồn sức
 * vào đó và điểm ca có thể nhích lên so với không đánh dấu. Thầy chốt đánh dấu
 * — mục đích ở đây là em SỬA ĐƯỢC LỖI, không phải xếp hạng.
 *
 * Không emoji, không màu đỏ báo động: đây là lời nhắc, không phải lời phạt. */
function DaiHoiLai({ soLanSai }: { soLanSai?: number }) {
  const n = Number(soLanSai)
  const co = Number.isFinite(n) && n > 0
  return (
    <div
      data-hoi-lai="1"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--k2)',
        padding: '8px var(--k5)',
        background: 'var(--cam-nen)',
        color: 'var(--cam)',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      <RotateCcw size={15} aria-hidden />
      <span>{co ? `Câu em đã sai buổi trước (${n} lần) — đọc kỹ lại từ đầu` : 'Câu em đã sai buổi trước — đọc kỹ lại từ đầu'}</span>
    </div>
  )
}

function LoiGiai({ props, nhan }: { props: TheCauProps; nhan?: TrangThaiLoiGiai }) {
  const lg = props.loiGiai
  const text = props.explanation
  const coGi = !!lg?.chot || !!text?.trim() || !!(lg?.buoc && lg.buoc.length > 0) || !!lg?.tungPa || !!lg?.tungY
  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
      {nhan === 'nghi_dap_an_sai' && (
        <Nhan tone="do" wrap className="self-start" data-nhan="nghi_dap_an_sai">
          Câu này đáp án có thể chưa chuẩn — thầy sẽ chữa trên lớp
        </Nhan>
      )}
      {nhan === 'thieu_dap_an' && (
        <Nhan tone="cam" wrap className="self-start" data-nhan="thieu_dap_an">
          Đáp án theo lời giải của thầy
        </Nhan>
      )}
      <div className="loi-giai">
        <div className="loi-giai-nhan lg-nhan">LỜI GIẢI</div>
        {!coGi && <div className="lg-chu">Thầy chưa nhập lời giải cho câu này.</div>}
        {lg?.chot && (
          <div className="loi-giai-chot lg-chot">
            <div className="loi-giai-nhan-nho">Kiến thức cốt lõi</div>
            <ChemText text={lg.chot} />
          </div>
        )}
        {!lg?.chot && text?.trim() && (
          <div className="lg-chu">
            <ChemText text={text} />
          </div>
        )}
        {lg && props.phan === 'I' && lg.tungPa && (
          <div>
            {props.choicePerm.map((origIdx, displayPos) => {
              const orig = 'ABCD'[origIdx] as Chu
              const y = lg.tungPa?.[orig]
              return <DongLyDo key={orig} dung={props.correct === orig} ma={`${'ABCD'[displayPos]}.`} chu={y?.viSao} />
            })}
          </div>
        )}
        {lg && props.phan === 'II' && lg.tungY && (
          <div>
            {(props.yPerm && props.yPerm.length === 4 ? props.yPerm : [0, 1, 2, 3]).map((i, viTri) => {
              const k = (['a', 'b', 'c', 'd'] as const)[i]
              return <DongLyDo key={k} dung={props.correct?.[i] === 'D'} ma={`${'abcd'[viTri]})`} chu={lg.tungY?.[k]?.viSao} />
            })}
          </div>
        )}
        {lg && props.phan === 'III' && (
          <>
            {lg.buoc && lg.buoc.length > 0 && (
              <ol className="lg-buoc">
                {lg.buoc.map((b, i) => (
                  <li key={i}>
                    <ChemText text={b} />
                  </li>
                ))}
              </ol>
            )}
            {(lg.ketQua || props.correct) && (
              <div className="lg-ket-qua">
                <ChemText text={lg.ketQua || props.correct || ''} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
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
                className="pa-hang"
                selected={laDung || chonSai || (!xemLai && daChon)}
                tone={chonSai ? 'do' : 'xanh'}
                onClick={!xemLai && onSelect ? () => onSelect(orig) : undefined}
                data-trang-thai={trangThai}
              >
                <span className="pa-ma" style={{ color: trangThai === 'trong' ? 'var(--nhat)' : chonSai ? 'var(--do)' : 'var(--xanh)' }}>{letter}.</span>
                <span className="min-w-0 pa-noi-dung" style={{ overflowWrap: 'break-word' }}>
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
    // `viTri` chạy theo THỨ TỰ HIỆN RA; `i` là chỉ số Ý GỐC. Mọi lần đọc/ghi dữ
    // liệu bên dưới đều dùng `i`, chỉ nhãn a) b) c) d) mới dùng `viTri`.
    const thuTu = props.yPerm && props.yPerm.length === 4 ? props.yPerm : [0, 1, 2, 3]
    body = (
      <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
        {thuTu.map((i, viTri) => {
          const idea = ideas[i]
          const chu = 'abcd'[viTri] as 'a' | 'b' | 'c' | 'd'
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
                <div className="y-noi-dung grid" style={{ gridTemplateColumns: '24px minmax(0, 1fr)', alignItems: 'baseline', gap: 'var(--k2)' }}>
                  <span className="y-ma" style={{ color: 'var(--nhat)' }}>{chu})</span>
                  <span className="min-w-0" style={{ overflowWrap: 'break-word' }}>
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
      // BÀN PHÍM iPHONE KHÔNG CÓ DẤU TRỪ (thầy báo 06/09). `inputMode="decimal"`
      // cho bàn phím số có dấu phẩy nhưng KHÔNG có dấu âm, mà đáp án phần III
      // có thể âm (biến thiên enthalpy chẳng hạn) — em không gõ nổi.
      //
      // Giữ bàn phím số vì em gõ số là chính, và thêm nút ĐỔI DẤU bên cạnh:
      // một chạm, không phải chuyển sang bàn phím chữ rồi tìm dấu.
      //
      // 07/09 thêm nút DẤU PHẨY cùng lý do: vài bố cục bàn phím iOS không hiện
      // dấu phẩy, em không gõ nổi `1,5`.
      <div className="flex items-stretch" style={{ gap: 'var(--k2)' }}>
        <button
          type="button"
          className="tap-target shrink-0"
          aria-label={laAm(selected) ? 'Bỏ dấu âm' : 'Thêm dấu âm'}
          onClick={() => onChange?.(doiDau(selected ?? ''))}
          style={{
            minHeight: 56,
            width: 56,
            borderRadius: 'var(--bo-1)',
            border: '1.5px solid var(--vien)',
            background: laAm(selected) ? 'var(--muc)' : 'var(--the-2)',
            color: laAm(selected) ? 'var(--muc-nguoc)' : 'var(--muc)',
            fontFamily: 'var(--serif)',
            fontSize: 'var(--cx-3)',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          −
        </button>
        <button
          type="button"
          className="tap-target shrink-0"
          aria-label="Thêm dấu phẩy"
          disabled={coPhay(selected)}
          onClick={() => onChange?.(themPhay(selected ?? ''))}
          style={{
            minHeight: 56,
            width: 48,
            borderRadius: 'var(--bo-1)',
            border: '1.5px solid var(--vien)',
            background: 'var(--the-2)',
            color: 'var(--muc)',
            opacity: coPhay(selected) ? 0.45 : 1,
            fontFamily: 'var(--serif)',
            fontSize: 'var(--cx-3)',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ,
        </button>
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
      </div>
    )
  }

  return (
    <TheNoiDung id={id} noPadding className="the-cau">
      <DauThe index={stt - 1} badge={stt} title={tieuDe?.trim() ?? ''} />
      {props.cauHoiLai && <DaiHoiLai soLanSai={props.cauHoiLai.soLanSai} />}
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
        {xemLai && <LoiGiai props={props} nhan={props.nhanLoiGiai} />}
      </div>
    </TheNoiDung>
  )
}
