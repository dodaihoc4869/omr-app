// IN CÔNG THỨC HOÁ HỌC RA PDF CHO ĐÚNG.
//
// Trên màn hình, công thức được KaTeX dựng từ `\ce{...}`. PDF không có KaTeX,
// nên phải tự tách chuỗi thành các đoạn chữ thường / chỉ số dưới / số mũ / mũi
// tên rồi vẽ từng đoạn ở đúng cỡ và đúng độ cao.
//
// Bản trước in thẳng chuỗi thô ra giấy, thành `CH3COOC2H5 + NaOH ->[t^o] ...`.
// Sai kiểu này nguy hiểm: em đọc phiếu và học theo đúng cái sai đó.
//
// MŨI TÊN VẼ BẰNG NÉT, không dùng glyph: font đã cắt gọn không có ký tự →, mà
// nét vẽ thì luôn sắc, không phụ thuộc font, và canh giữa dòng chuẩn hơn.
import { parseChemText } from './chem-format'

export type LoaiDoan = 'chu' | 'sub' | 'sup' | 'mui'
export interface DoanChu {
  t: LoaiDoan
  v: string
}

/** Gỡ đánh dấu LaTeX/mhchem về chuỗi mà parseChemText hiểu được.
 *
 * `->[t^o]` (điều kiện trên mũi tên) thành `-> (t°)`: đặt điều kiện ngay sau
 * mũi tên trong ngoặc — in một dòng thì không có chỗ để chữ nằm trên mũi tên,
 * mà bỏ điều kiện đi là mất dữ kiện của đề. */
export function goDauLatex(raw: string): string {
  let s = String(raw ?? '')
  s = s.replace(/\\ce\s*\{([\s\S]*?)\}/g, '$1')
  s = s.replace(/\\(?:text|mathrm|mathbf|rm)\s*\{([\s\S]*?)\}/g, '$1')
  // Điều kiện trên mũi tên: ->[t^o] , ->[xt] , <=>[a][b]
  s = s.replace(/(->|<->|<=>|<-)\s*\[([^\]]*)\]\s*(?:\[([^\]]*)\])?/g, (_m, mui: string, tren: string, duoi?: string) => {
    const dk = [tren, duoi].filter((x) => x && x.trim()).join(', ')
    return dk ? `${mui} (${dk}) ` : `${mui} `
  })
  s = s.replace(/\^\s*\\?circ\b/g, '°')
  s = s.replace(/\bt\^o\b/gi, 't°')
  s = s.replace(/\\left|\\right/g, '')
  s = s.replace(/\\to\b|\\rightarrow\b/g, '->')
  s = s.replace(/\\rightleftharpoons\b|\\leftrightharpoons\b/g, '<=>')
  s = s.replace(/\\times\b/g, '×')
  s = s.replace(/\\cdot\b/g, '·')
  s = s.replace(/\\Delta\b/g, 'Δ')
  s = s.replace(/\\alpha\b/g, 'α')
  s = s.replace(/\\beta\b/g, 'β')
  s = s.replace(/\\%/g, '%')
  s = s.replace(/\\,|\\;|\\!/g, ' ')
  s = s.replace(/\$/g, '')
  s = s.replace(/[ \t]{2,}/g, ' ')
  return s.trim()
}

const MUI = new Set(['→', '←', '⇌'])

/** Tách một chuỗi đề bài thành các đoạn để vẽ. */
export function doanCongThuc(raw: string): DoanChu[] {
  const phan = parseChemText(goDauLatex(raw))
  const ra: DoanChu[] = []
  for (const p of phan) {
    if (p.t !== 'text') {
      ra.push({ t: p.t, v: p.v })
      continue
    }
    // Cắt riêng mũi tên ra khỏi chữ để bên vẽ biết chỗ nào phải vẽ nét.
    let dem = ''
    for (const ch of p.v) {
      if (MUI.has(ch)) {
        if (dem) ra.push({ t: 'chu', v: dem })
        dem = ''
        ra.push({ t: 'mui', v: ch })
      } else {
        dem += ch
      }
    }
    if (dem) ra.push({ t: 'chu', v: dem })
  }
  return ra.filter((d) => d.v !== '')
}

/** Chuỗi thuần để đo bề rộng thô hoặc đưa vào tên tệp — KHÔNG dùng để in đề. */
export function chuThuanTuDoan(ds: DoanChu[]): string {
  return ds.map((d) => d.v).join('')
}
