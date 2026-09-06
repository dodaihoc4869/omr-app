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
import { parseChemText, tachMuiTen } from './chem-format'

export type LoaiDoan = 'chu' | 'sub' | 'sup' | 'mui'
export interface DoanChu {
  t: LoaiDoan
  v: string
  /** Chỉ đoạn `mui`: nhãn nằm TRÊN thân mũi tên (điều kiện phản ứng). */
  tren?: DoanChu[]
  /** Chỉ đoạn `mui`: nhãn nằm DƯỚI thân mũi tên. */
  duoi?: DoanChu[]
}

/** Gỡ đánh dấu LaTeX/mhchem về chuỗi mà parseChemText hiểu được.
 *
 * `->[t^o]` (điều kiện trên mũi tên) thành `-> (t°)`: đặt điều kiện ngay sau
 * mũi tên trong ngoặc — in một dòng thì không có chỗ để chữ nằm trên mũi tên,
 * mà bỏ điều kiện đi là mất dữ kiện của đề. */
/** Gỡ vỏ `\ce{}` / `\text{}` / `$` — phần KHÔNG liên quan tới mũi tên. Tách
 * riêng để `doanCongThuc` gỡ vỏ trước rồi mới cắt mũi tên ra. */
function boVoLatex(raw: string): string {
  return String(raw ?? '')
    .replace(/\\ce\s*\{([\s\S]*?)\}/g, '$1')
    .replace(/\\(?:text|mathrm|mathbf|rm)\s*\{([\s\S]*?)\}/g, '$1')
}

export function goDauLatex(raw: string): string {
  let s = boVoLatex(raw)
  // Điều kiện trên mũi tên: ->[t^o] , ->[xt] , <=>[a][b]
  s = s.replace(/(->|<->|<=>|<-)\s*\[([^\]]*)\]\s*(?:\[([^\]]*)\])?/g, (_m, mui: string, tren: string, duoi?: string) => {
    const dk = [tren, duoi].filter((x) => x && x.trim()).join(', ')
    return dk ? `${mui} (${dk}) ` : `${mui} `
  })
  return donKyHieu(s)
}

/** Đổi lệnh LaTeX còn lại sang ký tự đọc được. Không đụng tới mũi tên. */
function donKyHieu(raw: string): string {
  let s = String(raw ?? '')
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

/** Tách một chuỗi đề bài thành các đoạn để vẽ.
 *
 * Mũi tên GIỮ NGUYÊN NHÃN của nó (`tren` / `duoi`) thay vì bị nhét vào ngoặc
 * đứng sau. Phiếu là HTML nên xếp chồng chữ được, và sơ đồ chuyển hoá đọc đúng
 * như trong sách — đây là chỗ thầy chụp màn ngày 06/09. */
export function doanCongThuc(raw: string): DoanChu[] {
  const ra: DoanChu[] = []
  // Gỡ vỏ `\ce{}` TRƯỚC rồi mới cắt mũi tên: nhãn nằm bên trong vỏ.
  for (const khuc of tachMuiTen(boVoLatex(raw))) {
    if (khuc.t === 'mui') {
      const tren = doanThuong(khuc.tren)
      const duoi = doanThuong(khuc.duoi)
      ra.push({ t: 'mui', v: khuc.mui, ...(tren.length ? { tren } : {}), ...(duoi.length ? { duoi } : {}) })
      continue
    }
    ra.push(...doanThuong(khuc.v))
  }
  return ra.filter((d) => d.v !== '')
}

/** Một khúc CHỮ (không có mũi tên có nhãn) thành các đoạn vẽ. */
function doanThuong(raw: string): DoanChu[] {
  const s = String(raw ?? '')
  if (!s.trim()) return []
  const ra: DoanChu[] = []
  for (const p of parseChemText(donKyHieu(s))) {
    if (p.t !== 'text') {
      ra.push({ t: p.t, v: p.v })
      continue
    }
    // Mũi tên TRẦN còn sót (chuỗi cũ đã có sẵn ký tự →) vẫn cắt riêng để bên
    // vẽ vẽ bằng nét, chỉ là không có nhãn.
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

/** Chuỗi thuần để đo bề rộng thô hoặc đưa vào tên tệp — KHÔNG dùng để in đề.
 * Nhãn mũi tên tính vào chuỗi, nếu không đo bề rộng sẽ thiếu hẳn điều kiện. */
export function chuThuanTuDoan(ds: DoanChu[]): string {
  return ds
    .map((d) => {
      if (d.t !== 'mui') return d.v
      const nhan = [d.tren, d.duoi].filter(Boolean).map((x) => chuThuanTuDoan(x as DoanChu[]))
      return nhan.length ? `${d.v} (${nhan.join(', ')})` : d.v
    })
    .join('')
}
