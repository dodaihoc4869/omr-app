// KHỐI LỜI GIẢI CHUẨN — MỘT chỗ vẽ duy nhất cho mọi màn (học sinh, phụ huynh, giáo viên, game).
// Chuẩn: docs/hop-dong-game-hoa-2.md:53 — LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓ ✗ (Phần III: bước + kết quả).
// Thiếu cấu trúc ⇒ "Lời giải ngắn" (chữ); không có gì ⇒ "Thầy chưa nhập lời giải cho câu này."
// Markup/lớp lấy NGUYÊN từ ô LỜI GIẢI của TheCau (index.css `.loi-giai`, `.lg-*`; dưới `.m3` đổi sang màu M3 ở m3/the-cau.css).
// Dữ liệu: `loiGiaiChuanTuKho` đi qua chuanHoaLoiGiaiCau (src/lib/chuan-hoa-loi-giai.ts). Cấm bịa: chỉ hiện trường kho có.
import type { ReactNode } from 'react'
import type { LoiGiaiCauTruc } from '../../data/examContent'
import { ChemText } from '../../lib/chem-format'
import { chuanHoaLoiGiaiCau, type LoiGiaiCauTrucChuan } from '../../lib/chuan-hoa-loi-giai'

type Chu = 'A' | 'B' | 'C' | 'D'

/** Dạng đã chuẩn hoá (`chuanHoaLoiGiaiCau`: chot/lyDo/buoc/ketQua) → `LoiGiaiCauTruc` mà khối đọc. Kho thiếu ⇒ undefined. */
export function chuanSangCauTruc(lg: LoiGiaiCauTrucChuan, phan: 'I' | 'II' | 'III'): LoiGiaiCauTruc | undefined {
  if (lg.thieu) return undefined
  const ra: LoiGiaiCauTruc = { chot: lg.chot }
  if (lg.lyDo && phan === 'I') {
    ra.tungPa = {}
    for (const p of lg.lyDo) if (/^[A-D]$/.test(p.khoa)) ra.tungPa[p.khoa as Chu] = { dung: p.dung, viSao: p.ly }
  }
  if (lg.lyDo && phan === 'II') {
    ra.tungY = {}
    for (const p of lg.lyDo) if (/^[a-d]$/.test(p.khoa)) ra.tungY[p.khoa as 'a' | 'b' | 'c' | 'd'] = { dung: p.dung, viSao: p.ly }
  }
  if (lg.buoc) ra.buoc = lg.buoc
  if (phan === 'III' && lg.ketQua) ra.ketQua = lg.ketQua
  return ra
}

/** Lời giải THÔ của kho (object / chuỗi JSON / chữ) → dạng có cấu trúc; kho thiếu ⇒ undefined. */
export function loiGiaiChuanTuKho(tho: unknown, phan: 'I' | 'II' | 'III', dapAn: string): LoiGiaiCauTruc | undefined {
  return chuanSangCauTruc(chuanHoaLoiGiaiCau(tho, phan, dapAn), phan)
}

/** Một dòng lý do: dấu ✓/✗ (theo đáp án ĐANG CHẤM) · mã A./a) · lý do. */
export function DongLyDo({ dung, ma, chu, phuongAn, emChon }: { dung: boolean; ma: string; chu?: string; /** Chữ phương án (tuỳ chọn) — hiện mờ trước lý do. */ phuongAn?: string; /** Em đã chọn phương án này (chỉ khi sai). */ emChon?: boolean }) {
  return (
    <div className="lg-y" data-dung={dung ? '1' : '0'}>
      <span className={`lg-dau ${dung ? 'dung' : 'sai'}`} role="img" aria-label={dung ? 'đúng' : 'sai'}>
        {dung ? '✓' : '✗'}
      </span>
      <span className="lg-ma">{ma}</span>
      <span className="lg-chu">
        {phuongAn?.trim() ? <span style={{ color: 'var(--nhat)' }}><ChemText text={phuongAn} /> — </span> : null}
        {chu?.trim() ? <ChemText text={chu} /> : <span style={{ color: 'var(--mo)' }}>(chưa có lý do)</span>}
        {emChon && !dung ? <b style={{ color: 'var(--do)' }}> ← em đã chọn ý này</b> : null}
      </span>
    </div>
  )
}

export interface KhoiLoiGiaiChuanProps {
  phan: 'I' | 'II' | 'III'
  /** Lời giải có cấu trúc (ưu tiên). */
  loiGiai?: LoiGiaiCauTruc
  /** Lời giải dạng chữ (dữ liệu cũ) — hiện khi không có `loiGiai.chot`. */
  explanation?: string
  /** Đáp án đang chấm: Phần I 'A'–'D'; Phần II 'DSSD' hoặc mảng ['D','S',…]; Phần III kết quả. */
  correct?: string | ReadonlyArray<string | null>
  /** Hoán vị phương án: `choicePerm[viTríHiểnThị] = chỉSốGốc`. Thiếu ⇒ giữ A–D. */
  choicePerm?: number[]
  /** Hoán vị bốn ý Phần II. Thiếu hoặc sai độ dài ⇒ giữ a–d. */
  yPerm?: number[]
  /** Phần I: chữ bốn phương án THEO CHỮ GỐC (A–D) — hiện mờ trước lý do (game Leo Tháp / Săn câu sai). */
  phuongAn?: readonly string[]
  /** Phần I: chữ gốc phương án em đã chọn — dòng đó ghi "em đã chọn ý này" nếu sai. */
  daChon?: string
  /** Giữ xuống dòng có sẵn trong chữ (đã qua `tachDongTheoY`): thêm `white-space: pre-line` (index.css). */
  giuDong?: boolean
  /** Chèn thêm vào cuối khối (vd. hình sau lời giải). */
  children?: ReactNode
}

export default function KhoiLoiGiaiChuan({ phan, loiGiai: lg, explanation: text, correct, choicePerm, yPerm, phuongAn, daChon, giuDong, children }: KhoiLoiGiaiChuanProps) {
  const coChot = !!lg?.chot && typeof lg.chot === 'string' && !lg.chot.includes('[object Object]') && !!lg.chot.trim()
  const coGi = !!lg?.chot || !!text?.trim() || !!(lg?.buoc && lg.buoc.length > 0) || !!lg?.tungPa || !!lg?.tungY
  const dapAnChu = typeof correct === 'string' ? correct : ''
  // Đáp án Phần II đủ 4 ký tự Đ/S ⇒ dấu ✓/✗ theo đó; không có ⇒ lấy cờ `dung` của kho.
  const dsII = (typeof correct === 'string' ? [...correct.toUpperCase().replace(/Đ/g, 'D')] : [...(correct ?? [])]).map((x) => (x === 'D' || x === 'S' ? x : null))
  const coDsII = dsII.length === 4 && dsII.every(Boolean)
  return (
    <div className="loi-giai" data-giu-dong={giuDong ? '1' : undefined}>
      <div className="loi-giai-nhan lg-nhan">LỜI GIẢI</div>
      {!coGi && <div className="lg-chu">Thầy chưa nhập lời giải cho câu này.</div>}
      {coChot && (
        <div className="loi-giai-chot lg-chot">
          <div className="loi-giai-nhan-nho">Kiến thức cốt lõi</div>
          <ChemText text={lg!.chot} />
        </div>
      )}
      {!lg?.chot && text?.trim() && (
        <div className="lg-chu">
          <ChemText text={text} />
        </div>
      )}
      {lg && phan === 'I' && lg.tungPa && (
        <div>
          {(choicePerm && choicePerm.length === 4 ? choicePerm : [0, 1, 2, 3]).map((origIdx, displayPos) => {
            const orig = 'ABCD'[origIdx] as Chu
            return <DongLyDo key={orig} dung={dapAnChu ? dapAnChu.toUpperCase() === orig : !!lg.tungPa?.[orig]?.dung} ma={`${'ABCD'[displayPos]}.`} chu={lg.tungPa?.[orig]?.viSao} phuongAn={phuongAn?.[origIdx]} emChon={!!daChon && daChon.toUpperCase() === orig} />
          })}
        </div>
      )}
      {lg && phan === 'II' && lg.tungY && (
        <div>
          {(yPerm && yPerm.length === 4 ? yPerm : [0, 1, 2, 3]).map((i, viTri) => {
            const k = (['a', 'b', 'c', 'd'] as const)[i]
            return <DongLyDo key={k} dung={coDsII ? dsII[i] === 'D' : !!lg.tungY?.[k]?.dung} ma={`${'abcd'[viTri]})`} chu={lg.tungY?.[k]?.viSao} />
          })}
        </div>
      )}
      {lg?.buoc && lg.buoc.length > 0 && (
        <ol className="lg-buoc">
          {lg.buoc.map((b, i) => (
            <li key={i}>
              <ChemText text={b} />
            </li>
          ))}
        </ol>
      )}
      {lg && phan === 'III' && (lg.ketQua || dapAnChu) && (
        <div className="lg-ket-qua">
          <ChemText text={lg.ketQua || dapAnChu} />
        </div>
      )}
      {children}
    </div>
  )
}

/** Lời giải dạng `LoiGiaiCT` của phụ huynh (src/lib/ph-moi/du-lieu.ts: chot, buoc, ketQua, lyDo) hoặc chữ ngắn → khối chuẩn.
 * Không có cả hai ⇒ null (nơi gọi tự nói "chưa có lời giải"). `tach` = hàm ngắt dòng theo ý (tachDongTheoY) áp lên MỌI đoạn chữ. */
export function KhoiLoiGiaiTuCT({ ct, chuNgan, dapAn, tach }: { ct: { chot: string; buoc: string[]; ketQua: string; lyDo: { khoa: string; dung: boolean; ly: string }[] } | null; chuNgan?: string; dapAn: string; tach?: (s: string) => string }) {
  const t = tach ?? ((x: string) => x)
  if (!ct) {
    if (!chuNgan?.trim()) return null
    return <KhoiLoiGiaiChuan phan="I" explanation={t(chuNgan)} giuDong={!!tach} />
  }
  const dapChuan = dapAn.trim().toUpperCase().replace(/Đ/g, 'D')
  const kyTu = ct.lyDo.map((l) => l.khoa)
  const phan: 'I' | 'II' | 'III' = kyTu.length > 0 && kyTu.every((k) => /^[a-d]$/.test(k)) ? 'II' : kyTu.length > 0 || /^[A-D]$/.test(dapChuan) ? 'I' : /^[DS]{4}$/.test(dapChuan) ? 'II' : 'III'
  const lg = chuanSangCauTruc(
    { chot: t(ct.chot), lyDo: ct.lyDo.length ? ct.lyDo.map((l) => ({ ...l, ly: t(l.ly) })) : null, buoc: ct.buoc.length ? ct.buoc.map(t) : null, ketQua: t(ct.ketQua), thieu: false },
    phan,
  )
  return <KhoiLoiGiaiChuan phan={phan} loiGiai={lg} correct={phan === 'III' ? '' : dapChuan} giuDong={!!tach} />
}
