// Hiển thị công thức Hoá học đẹp mắt (chỉ số dưới, số mũ điện tích, mũi tên
// phản ứng) từ văn bản thầy gõ thuần chữ — KHÔNG sửa dữ liệu gốc đã lưu, chỉ
// là bước trình bày (render) khi hiện lên màn hình.
//
// Quy tắc:
// 1) Mũi tên: "->" → "→", "<-" → "←", "<=>" → "⇌" (an toàn, không mơ hồ).
// 2) Đánh dấu tường minh (thầy chủ động gõ, LUÔN đúng vì thầy tự kiểm soát):
//    "_2" hoặc "_{23}" → chỉ số dưới; "^2+" hoặc "^{2-}" → số mũ (điện tích).
// 3) Tự động suy đoán PHẦN AN TOÀN, không mơ hồ:
//    - Một dãy số đứng ngay sau chữ cái/dấu đóng ngoặc, KHÔNG có dấu +/- bám
//      ngay sau → hiểu là chỉ số nguyên tử (vd H2O, CO2, Fe2O3) → chỉ số dưới.
//    - Dấu +/- đứng một mình ngay sau chữ/số, không có số khác kèm theo →
//      hiểu là điện tích đơn giản (vd Na+, Cl-) → số mũ.
//    - Trường hợp số ĐI KÈM dấu +/- (vd "SO42-", "Fe3+") có thể hiểu theo 2
//      nghĩa khác nhau tuỳ từng ion cụ thể → KHÔNG đoán bừa, giữ nguyên chữ
//      thường để tránh hiển thị sai điện tích. Muốn hiển thị đúng, thầy gõ rõ
//      bằng dấu ^: "SO4^{2-}" hoặc "Fe^3+".
import type { JSX } from 'react'

type ChemPart = { t: 'text'; v: string } | { t: 'sub'; v: string } | { t: 'sup'; v: string }

function isAtomBoundaryChar(ch: string | undefined): boolean {
  if (!ch) return false
  return /[A-Za-zĐ)\]]/.test(ch)
}

export function parseChemText(raw: string): ChemPart[] {
  const text = raw.replace(/<=>/g, '⇌').replace(/->/g, '→').replace(/<-/g, '←')
  const parts: ChemPart[] = []
  const pushText = (ch: string) => {
    const last = parts[parts.length - 1]
    if (last && last.t === 'text') last.v += ch
    else parts.push({ t: 'text', v: ch })
  }

  let i = 0
  while (i < text.length) {
    const ch = text[i]

    // Đánh dấu tường minh: _{...} hoặc _X
    if (ch === '_' && text[i + 1] === '{') {
      const end = text.indexOf('}', i + 2)
      if (end !== -1) {
        parts.push({ t: 'sub', v: text.slice(i + 2, end) })
        i = end + 1
        continue
      }
    }
    if (ch === '_' && /[A-Za-z0-9]/.test(text[i + 1] ?? '')) {
      parts.push({ t: 'sub', v: text[i + 1] })
      i += 2
      continue
    }

    // Đánh dấu tường minh: ^{...} hoặc ^(số/+/- liên tiếp)
    if (ch === '^' && text[i + 1] === '{') {
      const end = text.indexOf('}', i + 2)
      if (end !== -1) {
        parts.push({ t: 'sup', v: text.slice(i + 2, end) })
        i = end + 1
        continue
      }
    }
    if (ch === '^') {
      const m = /^[0-9+-]+/.exec(text.slice(i + 1))
      if (m) {
        parts.push({ t: 'sup', v: m[0] })
        i += 1 + m[0].length
        continue
      }
    }

    // Tự động: dãy số ngay sau chữ/dấu đóng ngoặc
    if (/[0-9]/.test(ch)) {
      const lastPart = parts[parts.length - 1]
      const prevChar = lastPart && lastPart.t === 'text' ? lastPart.v.slice(-1) : undefined
      if (isAtomBoundaryChar(prevChar)) {
        const m = /^[0-9]+/.exec(text.slice(i))!
        const after = text[i + m[0].length]
        if (after === '+' || after === '-') {
          // Số đi liền dấu +/- — có thể là chỉ số NGUYÊN TỬ hay ĐIỆN TÍCH tuỳ
          // ion cụ thể, không thể suy đoán chắc chắn → giữ nguyên chữ thường.
          pushText(m[0])
          i += m[0].length
          continue
        }
        parts.push({ t: 'sub', v: m[0] })
        i += m[0].length
        continue
      }
    }

    // Tự động: dấu +/- đứng một mình ngay sau chữ/dấu đóng ngoặc (không có số kèm)
    if ((ch === '+' || ch === '-') && i > 0) {
      const prevChar = text[i - 1]
      const nextChar = text[i + 1]
      const boundaryBefore = isAtomBoundaryChar(prevChar)
      const boundaryAfter = !nextChar || !/[0-9+-]/.test(nextChar)
      if (boundaryBefore && boundaryAfter) {
        parts.push({ t: 'sup', v: ch })
        i += 1
        continue
      }
    }

    pushText(ch)
    i += 1
  }
  return parts
}

/** Component hiển thị: <ChemText text={item.question.text} /> */
export function ChemText({ text }: { text: string }): JSX.Element {
  const parts = parseChemText(text ?? '')
  return (
    <>
      {parts.map((p, i) => {
        if (p.t === 'sub') return <sub key={i}>{p.v}</sub>
        if (p.t === 'sup') return <sup key={i}>{p.v}</sup>
        return <span key={i}>{p.v}</span>
      })}
    </>
  )
}
