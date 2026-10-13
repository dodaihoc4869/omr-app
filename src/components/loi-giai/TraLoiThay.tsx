// CÂU TRẢ LỜI CỦA THẦY (bản vẽ docs/ban-ve-hoi-thay-1310, thầy chốt 13/10: "Phần hướng dẫn lời giải phải hiển thị khoa học hơn, ngắt câu
// tô đậm … sao cho hs đọc cái hiểu ngay"): ý chính (cụm then chốt đậm, đáp số làm nổi) → các bước đánh số (tên in đậm) → bảng nhanh → ghi nhớ
// → nút hỏi tiếp. Máy chủ (server/src/hoi-tro-ly-cau-truc.ts) đã làm sạch; ở đây chỉ kiểm khuôn. Công thức qua ChemText (hạ chỉ số).
import { Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { chiSoRo } from '../../lib/chi-so-ro'
import './tra-loi-thay.css'

export interface CauTrucTraLoi {
  yChinh: string
  buoc: { ten: string; chu: string }[]
  bang: { cot: string[]; dong: string[][]; sauBuoc: number } | null
  ghiNho: string
  hoiTiep: string[]
}

const chuoi = (v: unknown): v is string => typeof v === 'string'

/** GỐC HỮU CƠ CÓ GẠCH (thầy báo 13/10, ảnh "gốc alkyl là gì ạ": "CH3-", "C2H5-", "C3H7-" không hạ chỉ số). ChemText cố ý giữ nguyên số
 *  đứng ngay trước dấu +/- (vì "SO42-" có thể là điện tích). Gốc hydrocarbon: có C, tận cùng H + số, sau gạch là hết chữ ⇒ gạch là LIÊN KẾT,
 *  không phải điện tích ⇒ đánh dấu chỉ số tường minh, giữ gạch thường. Ion ("HCO3-", "SO42-", "NH4+") không khớp nên đi đường cũ.
 *  Chỉ áp trong hộp Hỏi Thầy (mảnh tải lười): byte mở app không đổi. */
const RE_GOC = /([A-Za-z0-9()_{}]+)-(?=$|[\s,.;:!?)\]…])/g
/** ĐIỆN TÍCH TRONG NGOẶC (thầy báo 13/10, ảnh "HCO3⁻ + OH⁻ → CO3(2-) + H2O"): Gemini hay viết "CO3(2-)", "Fe(3+)", "NH4(+)" — ChemText
 *  chỉ hiểu điện tích liền sau công thức ⇒ đổi thành mũ tường minh `^{2-}`. Chỉ khi phía trước là công thức (có chữ in hoa): "Fe(III)",
 *  "(1)", "x(2-)" giữ nguyên. Dấu trừ Unicode "−" coi như "-". Không dùng lookbehind (máy iOS cũ). */
const RE_DIEN_TICH_NGOAC = /([A-Za-z0-9)\]]+)\((\d{0,2})([+\-−])\)/g
export function chuHoa(s: string): string {
  return chiSoRo(s).replace(RE_DIEN_TICH_NGOAC, (m, truoc: string, so: string, dau: string) => (/[A-Z]/.test(truoc) ? `${truoc}^{${so}${dau === '+' ? '+' : '-'}}` : m)).replace(RE_GOC, (m, tok: string) =>
    /^(?:[A-Z][a-z]?|[()]|\d+|_\{\d+\})+$/.test(tok) && /C(?![a-z])/.test(tok) && /H\d+$/.test(tok) ? `${tok.replace(/([A-Za-z)])(\d+)/g, '$1_{$2}')}-` : m)
}

/** Kiểm khuôn câu trả lời có cấu trúc của máy chủ; sai khuôn / vắng ⇒ null (máy em vẽ chữ phẳng như cũ). */
export function docCauTruc(v: unknown): CauTrucTraLoi | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  const buoc = Array.isArray(o.buoc) ? o.buoc.filter((b): b is { ten: string; chu: string } => !!b && typeof b === 'object' && chuoi((b as { ten?: unknown }).ten) && chuoi((b as { chu?: unknown }).chu)) : []
  const b = o.bang && typeof o.bang === 'object' ? (o.bang as Record<string, unknown>) : null
  const cot = b && Array.isArray(b.cot) ? b.cot.filter(chuoi) : []
  const dong = b && Array.isArray(b.dong) ? b.dong.filter((d): d is string[] => Array.isArray(d) && d.every(chuoi)) : []
  const yChinh = chuoi(o.yChinh) ? o.yChinh : ''
  if (!yChinh && !buoc.length) return null
  return {
    yChinh,
    buoc,
    bang: cot.length >= 2 && dong.length ? { cot, dong, sauBuoc: Number(b?.sauBuoc) || 0 } : null,
    ghiNho: chuoi(o.ghiNho) ? o.ghiNho : '',
    hoiTiep: Array.isArray(o.hoiTiep) ? o.hoiTiep.filter(chuoi).slice(0, 2) : [],
  }
}

/** Chữ có **đậm** và ==làm nổi==; phần thường qua ChemText (CH3NH2 ⇒ CH₃NH₂, CH3- ⇒ CH₃-). */
export function ChuTo({ text }: { text: string }) {
  const phan = text.split(/(\*\*.+?\*\*|==.+?==)/g).filter(Boolean)
  return (
    <>
      {phan.map((p, i) => {
        if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) return <strong key={i}><ChemText text={chuHoa(p.slice(2, -2))} /></strong>
        if (p.length > 4 && p.startsWith('==') && p.endsWith('==')) return <mark key={i}><ChemText text={chuHoa(p.slice(2, -2))} /></mark>
        return <ChemText key={i} text={chuHoa(p)} />
      })}
    </>
  )
}

/** Cột cuối toàn chữ ngắn (khí / lỏng, đúng / sai…) ⇒ vẽ thành nhãn; giá trị khác số đông được tô khác màu để em thấy ngay chỗ khác biệt. */
function nhanCotCuoi(dong: string[][]): ((c: string) => ReactNode) | null {
  const cuoi = dong.map((r) => (r[r.length - 1] ?? '').trim())
  if (!cuoi.every((c) => c && c.length <= 12 && !/\d|\*\*|==/.test(c))) return null
  const dem = new Map<string, number>()
  for (const c of cuoi) dem.set(c, (dem.get(c) ?? 0) + 1)
  const nhieu = [...dem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  return (c) => <span className="lg-tl-nhan" data-khac={c.trim() !== nhieu || undefined}>{c}</span>
}

function BangNhanh({ bang }: { bang: NonNullable<CauTrucTraLoi['bang']> }) {
  const nhan = nhanCotCuoi(bang.dong)
  return (
    <div className="lg-tl-bang-cuon">
      <table className="lg-tl-bang">
        <thead><tr>{bang.cot.map((c, i) => <th key={i} scope="col"><ChuTo text={c} /></th>)}</tr></thead>
        <tbody>
          {bang.dong.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{nhan && j === r.length - 1 ? nhan(c) : <ChuTo text={c} />}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** `dangLam`: em đang làm ⇒ nhãn "Gợi hướng". `onHoi`: bấm câu hỏi tiếp (chỉ truyền cho câu trả lời MỚI NHẤT). */
export default function TraLoiThay({ ct, dangLam = false, onHoi, khoa = false }: { ct: CauTrucTraLoi; dangLam?: boolean; onHoi?: (cau: string) => void; khoa?: boolean }) {
  const bang = ct.bang
  const sau = bang && bang.sauBuoc >= 1 && bang.sauBuoc <= ct.buoc.length ? bang.sauBuoc : 0
  return (
    <div className="lg-ht-thay lg-tl">
      <div className="lg-tl-dau">
        <span className="lg-tl-avt" aria-hidden="true">Đ</span>
        <span className="lg-ht-nhan">Thầy Đỗ Đại Học</span>
        {dangLam && <span className="lg-tl-the">Gợi hướng</span>}
      </div>
      {ct.yChinh && <p className="lg-tl-chinh"><ChuTo text={ct.yChinh} /></p>}
      {ct.buoc.length > 0 && (
        <ol className="lg-tl-buoc">
          {ct.buoc.map((b, i) => (
            <li key={i}>
              <span className="lg-tl-so" aria-hidden="true">{i + 1}</span>
              <div>
                {b.ten && <b><ChuTo text={b.ten} /></b>}
                <p><ChuTo text={b.chu} /></p>
                {bang && sau === i + 1 && <BangNhanh bang={bang} />}
              </div>
            </li>
          ))}
        </ol>
      )}
      {bang && !sau && <BangNhanh bang={bang} />}
      {ct.ghiNho && (
        <aside className="lg-tl-nho" aria-label="Ghi nhớ">
          <Lightbulb size={20} strokeWidth={2} aria-hidden="true" />
          <div><b>Ghi nhớ</b><span><ChuTo text={ct.ghiNho} /></span></div>
        </aside>
      )}
      {onHoi && ct.hoiTiep.length > 0 && (
        <div className="lg-tl-hoi" role="group" aria-label="Hỏi tiếp">
          {ct.hoiTiep.map((q) => <button key={q} type="button" disabled={khoa} onClick={() => onHoi(q)}><ChemText text={chuHoa(q)} /></button>)}
        </div>
      )}
    </div>
  )
}
