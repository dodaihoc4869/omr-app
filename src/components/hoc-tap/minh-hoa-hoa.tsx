// MINH HOẠ HOÁ HỌC trong màn làm chặng kiểu Duolingo (bản vẽ ve-moi/nang-cap, thầy 27/10 «Bạn tự chốt sao cho tốt nhất build luôn đi»).
// Tranh phẳng tự vẽ bằng SVG (không tải ảnh), màu lấy từ biến --tr-* sẵn có qua lớp CSS (styles/trong-lam-bai.css mục 17).
// Đi chung mảnh màn làm bài (đã nạp lười) — không cộng byte lượt mở app, không thêm tệp precache.
//  - <MinhHoaDe text>: đề có lượng chất (gam / mol) + một chất trong từ điển + chất phản ứng ⇒ cảnh «bình chất · ống chất phản ứng → cốc sản phẩm ?».
//    Không nhận ra ⇒ không vẽ gì (không đoán).
//  - <TranhPa choices i>: CẢ BỐN phương án là chất có trong từ điển phân tử ⇒ vẽ phân tử bi–que (có chữ nguyên tố) trong ô phương án thứ i.
//    Thiếu một ⇒ không vẽ ô nào (bốn ô phải cùng kiểu).
import { memo, type ReactNode } from 'react'

type NguyenTu = [x: number, y: number, e: 'C' | 'N' | 'O' | 'H']
type Lien = [a: number, b: number, kep?: 1]
type Chat = { ten: string[]; ct: string; pt?: [NguyenTu[], Lien[]]; dd?: 1 | 2 | 3 }

// Toạ độ trong khung 160 × 110. Liên kết đôi C=O vẽ hai nét.
const CHAT: Chat[] = [
  { ten: ['methylamine'], ct: 'CH3NH2', dd: 1, pt: [[[58, 56, 'C'], [102, 56, 'N'], [32, 40, 'H'], [32, 76, 'H'], [58, 24, 'H'], [128, 40, 'H'], [128, 76, 'H']], [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6]]] },
  { ten: ['ethylamine'], ct: 'C2H5NH2', dd: 1, pt: [[[32, 62, 'C'], [68, 48, 'C'], [104, 62, 'N'], [8, 58, 'H'], [26, 92, 'H'], [28, 34, 'H'], [62, 20, 'H'], [76, 78, 'H'], [128, 50, 'H'], [120, 88, 'H']], [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8], [2, 9]]] },
  { ten: ['dimethylamine'], ct: '(CH3)2NH', dd: 1, pt: [[[36, 66, 'C'], [80, 52, 'N'], [124, 66, 'C'], [80, 22, 'H'], [12, 60, 'H'], [32, 94, 'H'], [24, 40, 'H'], [148, 60, 'H'], [128, 94, 'H'], [136, 40, 'H']], [[0, 1], [1, 2], [1, 3], [0, 4], [0, 5], [0, 6], [2, 7], [2, 8], [2, 9]]] },
  { ten: ['ammonia'], ct: 'NH3', pt: [[[80, 58, 'N'], [50, 72, 'H'], [110, 72, 'H'], [80, 26, 'H']], [[0, 1], [0, 2], [0, 3]]] },
  { ten: ['methanol', 'methyl alcohol'], ct: 'CH3OH', pt: [[[56, 56, 'C'], [98, 58, 'O'], [30, 40, 'H'], [30, 74, 'H'], [56, 24, 'H'], [124, 46, 'H']], [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5]]] },
  { ten: ['ethanol', 'ethyl alcohol'], ct: 'C2H5OH', pt: [[[38, 62, 'C'], [76, 48, 'C'], [114, 62, 'O'], [12, 60, 'H'], [32, 92, 'H'], [34, 34, 'H'], [70, 20, 'H'], [86, 76, 'H'], [140, 48, 'H']], [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8]]] },
  { ten: ['formic acid'], ct: 'HCOOH', pt: [[[56, 58, 'C'], [60, 24, 'O'], [94, 74, 'O'], [24, 66, 'H'], [122, 62, 'H']], [[0, 1, 1], [0, 2], [0, 3], [2, 4]]] },
  { ten: ['acetic acid'], ct: 'CH3COOH', pt: [[[38, 64, 'C'], [76, 54, 'C'], [80, 20, 'O'], [112, 72, 'O'], [12, 62, 'H'], [32, 94, 'H'], [36, 36, 'H'], [138, 60, 'H']], [[0, 1], [1, 2, 1], [1, 3], [0, 4], [0, 5], [0, 6], [3, 7]]] },
  { ten: ['methyl formate'], ct: 'HCOOCH3', pt: [[[44, 60, 'C'], [46, 24, 'O'], [82, 74, 'O'], [118, 60, 'C'], [18, 70, 'H'], [142, 46, 'H'], [140, 82, 'H'], [114, 30, 'H']], [[0, 1, 1], [0, 2], [2, 3], [0, 4], [3, 5], [3, 6], [3, 7]]] },
  { ten: ['aniline', 'phenylamine'], ct: 'C6H5NH2', dd: 3 },
  { ten: ['ethyl acetate'], ct: 'CH3COOC2H5', dd: 2 },
  { ten: ['methyl acetate'], ct: 'CH3COOCH3', dd: 2 },
  { ten: ['glycine'], ct: 'H2NCH2COOH', dd: 2 },
  { ten: ['glucose'], ct: 'C6H12O6', dd: 2 },
  { ten: ['phenol'], ct: 'C6H5OH', dd: 3 },
]
// Chất phản ứng (ống nghiệm giữa cảnh): tên trong đề → công thức.
const PHAN_UNG: [RegExp, string][] = [
  [/\bHCl\b|hydrochloric/i, 'HCl'], [/\bNaOH\b|sodium hydroxide/i, 'NaOH'], [/\bKOH\b|potassium hydroxide/i, 'KOH'],
  [/\bHNO2\b|nitrous/i, 'HNO2'], [/\bHNO3\b|nitric/i, 'HNO3'], [/\bH2SO4\b|sulfuric/i, 'H2SO4'], [/\bBr2\b|bromine/i, 'Br2'], [/đốt cháy/i, 'O2'],
]

const chuan = (s: string) => s.replace(/[₀-₉]/g, (d) => String(d.charCodeAt(0) - 0x2080)).replace(/[\s\-–−.]/g, '').toLowerCase()
const MAP = new Map<string, Chat>()
for (const c of CHAT) { MAP.set(chuan(c.ct), c); for (const t of c.ten) MAP.set(chuan(t), c) }
/** Chất ứng với chữ một phương án (tên hoặc công thức, bỏ «.» cuối, không phân biệt hoa thường). */
export const chatCua = (chu: string) => MAP.get(chuan(chu))

/** Chữ có chỉ số dưới cho nhãn SVG (tspan dịch dòng — không dùng kí tự ₂ vì phông tự host không có). */
function NhanCt({ ct, x, y }: { ct: string; x: number; y: number }) {
  const phan = ct.match(/\d+|\D+/g) ?? []
  let thap = false
  return <text x={x} y={y} textAnchor="middle" className="mh-nhan">{phan.map((p, i) => {
    const so = /\d/.test(p)
    const dy = so ? (thap ? 0 : 4) : thap ? -4 : 0
    thap = so
    return <tspan key={i} dy={dy} fontSize={so ? 10 : undefined}>{p}</tspan>
  })}</text>
}

function PhanTu({ chat }: { chat: Chat }) {
  const [nt, lien] = chat.pt!
  return <svg className="mh-pt" viewBox="0 0 160 110" role="img" aria-label={`Mô hình phân tử ${chat.ct}`}>
    <ellipse className="mh-bong" cx="80" cy="104" rx="56" ry="5" />
    {lien.map(([a, b, kep], i) => {
      const [x1, y1] = nt[a]!, [x2, y2] = nt[b]!
      if (!kep) return <path key={i} className="mh-lien" d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={6} />
      const l = Math.hypot(y2 - y1, x1 - x2), ox = ((y2 - y1) / l) * 4, oy = ((x1 - x2) / l) * 4
      return <path key={i} className="mh-lien" d={`M${x1 + ox} ${y1 + oy}L${x2 + ox} ${y2 + oy}M${x1 - ox} ${y1 - oy}L${x2 - ox} ${y2 - oy}`} strokeWidth={4} />
    })}
    {nt.map(([x, y, e], i) => {
      const r = e === 'H' ? 10 : 16
      return <g key={i}>
        <circle className={`mh-${e}`} cx={x} cy={y} r={r} />
        {e !== 'H' && <circle className="mh-loe" cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.28} />}
        <text className={e === 'H' ? 'mh-chu-h' : 'mh-chu'} x={x} y={y + (e === 'H' ? 4.5 : 6)} textAnchor="middle" fontSize={e === 'H' ? 12 : 17}>{e}</text>
      </g>
    })}
  </svg>
}

// 28/10 MƯỢT: ghi nhớ — màn làm bài vẽ lại mỗi lần chạm (chọn, Kiểm tra) không phải vẽ lại tranh phân tử của bốn ô (hàm thuần của phương án)
export const TranhPa = memo(function TranhPa({ choices, i }: { choices: readonly string[]; i: number }) {
  const ds = choices.map(chatCua)
  if (ds.length !== 4 || ds.some((c) => !c?.pt)) return null
  return <span className="mh-pa" aria-hidden="true"><PhanTu chat={ds[i]!} /></span>
})

/** Đọc đề: chất chính (có lượng gam / mol đứng gần), chất phản ứng, đại lượng cần tìm. Không đủ ⇒ null. */
export function docCanh(text: string): { ct: string; luong: string; thuoc: string; tim: string; dd: 1 | 2 | 3 } | null {
  // Lượng phải đứng NGAY TRƯỚC tên chất («4,5 gam ethylamine», «0,1 mol aniline») — hỗn hợp / lượng của chất khác ⇒ không vẽ (không gán sai).
  let chat: Chat | undefined, luong: RegExpMatchArray | null = null
  let viTri = Infinity
  for (const c of CHAT) for (const t of [...c.ten, c.ct]) {
    const m = text.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(gam|g|mol)\\s+${t.replace(/[()]/g, '\\$&')}(?![a-z])`, 'i'))
    if (m && m.index! < viTri) { viTri = m.index!; chat = c; luong = m }
  }
  const thuoc = PHAN_UNG.find(([re]) => re.test(text))?.[1]
  if (!chat || !luong || !thuoc || chat.ct === thuoc) return null
  const an = text.match(/thu được\s+([mVax])\s+(?:gam|lít|mol)/)?.[1] ?? text.match(/Giá trị của\s+([mVax])\b/)?.[1] ?? (/khối lượng/i.test(text) ? 'm' : /thể tích/i.test(text) ? 'V' : '')
  return { ct: chat.ct, luong: `${luong[1]} ${luong[2] === 'gam' ? 'g' : luong[2]}`, thuoc, tim: an ? `${an} = ?` : '?', dd: chat.dd ?? 2 }
}

export function MinhHoaDe({ text }: { text: string }): ReactNode {
  const c = docCanh(text)
  if (!c) return null
  const rong = c.luong.length * 8 + 20
  return <figure className="mh-canh" aria-label={`Minh hoạ: ${c.luong} ${c.ct} tác dụng với ${c.thuoc}`}>
    <svg viewBox="0 0 330 129" aria-hidden="true">
      <ellipse className="mh-bong" cx="62" cy="104" rx="40" ry="5" />
      <path className="mh-thuy-tinh" d="M50 14h24v8h-3v22l26 48a8 8 0 0 1-7 12H34a8 8 0 0 1-7-12l26-48V22h-3z" />
      <path className={`mh-dd-${c.dd}`} d="M40 66h44l13 26a8 8 0 0 1-7 12H34a8 8 0 0 1-7-12z" />
      <path className="mh-sang" d="M58 30v18" strokeWidth={4} strokeLinecap="round" />
      <rect className="mh-nap" x="47" y="10" width="30" height="8" rx="4" />
      <rect className="mh-the" x={62 - rong / 2} y="72" width={rong} height="20" rx="10" />
      <text className="mh-the-chu" x="62" y="87" textAnchor="middle">{c.luong}</text>
      <NhanCt ct={c.ct} x={62} y={120} />
      <text className="mh-dau" x="118" y="66" textAnchor="middle">+</text>
      <g transform="translate(150 6)">
        <ellipse className="mh-bong" cx="14" cy="98" rx="18" ry="4" />
        <path className="mh-thuy-tinh" d="M4 8h20v76a10 10 0 0 1-20 0z" />
        <path className="mh-dd-2" d="M4 44h20v40a10 10 0 0 1-20 0z" />
        <rect className="mh-nap" x="0" y="2" width="28" height="8" rx="4" />
        <path className="mh-sang" d="M10 18v18" strokeWidth={3.5} strokeLinecap="round" />
      </g>
      <NhanCt ct={c.thuoc} x={164} y={120} />
      <path className="mh-mui" d="M196 58h34m-10-9 10 9-10 9" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(248 20)">
        <ellipse className="mh-bong" cx="34" cy="84" rx="38" ry="5" />
        <path className="mh-thuy-tinh" d="M4 6h60l-6 70a8 8 0 0 1-8 7H18a8 8 0 0 1-8-7z" />
        <path className="mh-muoi" d="M10 50h48l-2 26a8 8 0 0 1-8 7H20a8 8 0 0 1-8-7z" />
        <path className="mh-tinh-the" d="M18 52l6-8 6 8zM32 54l7-10 7 10zM24 66l6-8 6 8zM40 66l6-8 6 8z" strokeWidth={1.5} />
        <path className="mh-sang" d="M14 14v26" strokeWidth={4} strokeLinecap="round" />
        <rect className="mh-hoi" x="18" y="20" width="32" height="20" rx="10" />
        <text className="mh-hoi-chu" x="34" y="35" textAnchor="middle">?</text>
      </g>
      <text className="mh-nhan" x="282" y="120" textAnchor="middle">{c.tim}</text>
    </svg>
  </figure>
}

/** Biểu tượng nhỏ của nhãn câu (tự vẽ — không kéo thêm biểu tượng thư viện vào mảnh dùng chung). */
export const IcLapLanh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.4 6.6 6.6 2.4-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4z" /></svg>
export const IcMayTinh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="3" /><path d="M8.5 7h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" /></svg>
