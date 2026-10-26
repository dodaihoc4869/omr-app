// LINH VẬT «Bi» (thầy chốt 26/10, bản vẽ ve-moi/linh-vat/bi.js): bình cầu thuỷ tinh, dung dịch ĐỔI MÀU theo cảm xúc như chất chỉ thị.
// SVG nội tuyến vẽ lại đúng hình bản duyệt (viewBox 0 0 200 230). KHÔNG có màu thô: mọi màu là lớp CSS trong bi.css, lấy từ biến --tr-* của app học sinh
// (vui/chào → --tr-dung, nghĩ → --tr-tin, sai → --tr-sai, mừng → --tr-sao, lửa → --tr-chu-y, ngủ → --tr-chu-3). Đổi `cam` ⇒ dung dịch đổi màu dần 400 ms.
// Chỉ dùng trong app học sinh «Trong» (không ở màn thi, đăng nhập, app thầy, app phụ huynh). aria-hidden: chữ đi kèm đã nói đủ nghĩa.
import { useId, type CSSProperties } from 'react'
import '../../styles/bi.css'

export type CamBi = 'chao' | 'vui' | 'nghi' | 'sai' | 'mung' | 'ngu' | 'lua'
export const CAM_BI: readonly CamBi[] = ['chao', 'vui', 'nghi', 'sai', 'mung', 'ngu', 'lua']

const THAN = 'M84 46 V77.2 A60 60 0 1 0 116 77.2 V46 Z'
const MUC: Record<CamBi, number> = { chao: 108, vui: 106, lua: 104, nghi: 110, sai: 114, mung: 102, ngu: 118 }
const TAY: Record<CamBi, number[]> = {
  chao: [48, 148, 34, 162, 152, 126, 170, 100], mung: [50, 124, 32, 98, 150, 124, 168, 98], vui: [50, 124, 34, 102, 152, 132, 172, 114],
  lua: [48, 148, 34, 162, 152, 128, 172, 106], nghi: [48, 148, 34, 162, 150, 122, 160, 98], sai: [48, 152, 42, 172, 152, 152, 158, 172], ngu: [48, 152, 42, 172, 152, 152, 158, 172],
}
const L = [78, 134], R = [122, 134]
const SAO = 'M0 -14 L4 -4.5 L14 -4 L6.5 2.5 L9 12.5 L0 7 L-9 12.5 L-6.5 2.5 L-14 -4 L-4 -4.5 Z'
const LAP = 'M0 -10 Q1.5 -1.5 10 0 Q1.5 1.5 0 10 Q-1.5 1.5 -10 0 Q-1.5 -1.5 0 -10Z'
const lucGiac = (r: number) => `M${r} 0 L${r / 2} ${r * 0.866} L${-r / 2} ${r * 0.866} L${-r} 0 L${-r / 2} ${-r * 0.866} L${r / 2} ${-r * 0.866}Z`

function Tay({ d: [x1, y1, x2, y2] }: { d: number[] }) {
  const p = `M${x1} ${y1} L${x2} ${y2}`
  return <g className="bi-tay"><path d={p} className="bi-net" strokeWidth="23" strokeLinecap="round" /><path d={p} className="bi-net-c" strokeWidth="15.5" strokeLinecap="round" /></g>
}
function MatMo({ x, y, dx = 0, dy = 0 }: { x: number; y: number; dx?: number; dy?: number }) {
  return <>
    <ellipse cx={x} cy={y} rx="14" ry="16" className="bi-trang bi-net" strokeWidth="3" />
    <circle cx={x + 1.5 + dx} cy={y + 2 + dy} r="9" className="bi-toi" />
    <circle cx={x + 4.5 + dx} cy={y - 2 + dy} r="3.6" className="bi-trang" />
    <circle cx={x - 1 + dx} cy={y + 6 + dy} r="1.4" className="bi-trang" opacity=".9" />
  </>
}
function Mat({ cam }: { cam: CamBi }) {
  if (cam === 'vui') return <>{[L, R].map(([x, y]) => <path key={x} d={`M${x! - 10} ${y! + 3} Q${x} ${y! - 11} ${x! + 10} ${y! + 3}`} className="bi-net" fill="none" strokeWidth="4.5" strokeLinecap="round" />)}</>
  if (cam === 'ngu') return <>{[L, R].map(([x, y]) => <path key={x} d={`M${x! - 10} ${y} Q${x} ${y! + 8} ${x! + 10} ${y}`} className="bi-net" fill="none" strokeWidth="4" strokeLinecap="round" />)}</>
  if (cam === 'mung') return <>{[L, R].map(([x, y]) => <path key={x} transform={`translate(${x} ${y})`} d={SAO} className="bi-sao-mat bi-net" strokeWidth="3" strokeLinejoin="round" />)}</>
  const [dx, dy] = cam === 'nghi' ? [2.5, -4] : cam === 'sai' ? [-1, 3] : [0, 0]
  return <>
    {/* Chớp mắt (G): nhóm mắt mở co dọc một nhịp — chỉ CSS, lặp ngẫu nhiên 3–6 s */}
    <g className="bi-chop"><MatMo x={L[0]!} y={L[1]!} dx={dx} dy={dy} /><MatMo x={R[0]!} y={R[1]!} dx={dx} dy={dy} /></g>
    {cam === 'sai' && <><path d="M64 118 Q74 116 86 110" className="bi-net" fill="none" strokeWidth="4" strokeLinecap="round" /><path d="M136 118 Q126 116 114 110" className="bi-net" fill="none" strokeWidth="4" strokeLinecap="round" /></>}
  </>
}
function Mieng({ cam }: { cam: CamBi }) {
  if (cam === 'nghi') return <ellipse cx="100" cy="161" rx="6" ry="7.5" className="bi-mieng bi-net" strokeWidth="3.5" />
  if (cam === 'sai') return <path d="M88 163 Q94 157 100 163 Q106 169 112 163" className="bi-net" fill="none" strokeWidth="4" strokeLinecap="round" />
  if (cam === 'ngu') return <path d="M95 162 Q100 165 105 162" className="bi-net" fill="none" strokeWidth="3.5" strokeLinecap="round" />
  return <><path d="M86 156 Q100 176 114 156 Z" className="bi-mieng bi-net" strokeWidth="3.5" strokeLinejoin="round" /><path d="M93 165 Q100 171 107 165 Q100 161 93 165Z" className="bi-luoi" /></>
}
/** Đồ trang trí quanh Bi theo dáng (lấp lánh, hoa giấy lục giác, dấu hỏi, giọt lo, zzz, ngọn lửa). */
function Tren({ cam }: { cam: CamBi }) {
  if (cam === 'vui') return <g className="bi-tren">{[[40, 70, 1.1], [166, 64, 0.8], [150, 30, 0.6]].map(([x, y, s], i) => <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d={LAP} className="bi-f-sao" />)}</g>
  if (cam === 'mung') return <g className="bi-tren bi-hoa">
    {([[30, 40, 9, 'tin', 10], [172, 46, 8, 'sai', 30], [160, 12, 6, 'dung', 0], [46, 12, 5, 'sao', 20]] as const).map(([x, y, r, m, xoay], i) =>
      <path key={i} transform={`translate(${x} ${y}) rotate(${xoay})`} d={lucGiac(r)} className={`bi-s-${m}`} fill="none" strokeWidth="3" style={{ '--i': i } as CSSProperties} />)}
    <circle cx="20" cy="78" r="4" className="bi-f-dung" /><circle cx="184" cy="84" r="4" className="bi-f-tin" />
    <path transform="translate(64 34) scale(.9)" d={LAP} className="bi-f-sao" /><path transform="translate(140 30) scale(.7)" d={LAP} className="bi-f-tin" />
  </g>
  if (cam === 'nghi') return <g className="bi-tren"><g transform="translate(150 26)"><circle r="17" className="bi-trang bi-net" strokeWidth="3" /><path d="M-5 -5 Q-5 -11 0.5 -11 Q6 -11 6 -5.5 Q6 -1.5 1 1 V4" className="bi-s-tin" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><circle cy="9.5" r="2.4" className="bi-f-tin" /></g><circle cx="132" cy="50" r="4" className="bi-trang bi-net" strokeWidth="2.5" /></g>
  if (cam === 'sai') return <path d="M168 92 Q176 104 168 110 Q160 104 168 92Z" className="bi-tren bi-giot bi-net" strokeWidth="2.5" />
  if (cam === 'ngu') return <g className="bi-tren bi-z">{([[128, 30, 1], [146, 16, .75], [160, 6, .55]] as const).map(([x, y, s], i) => <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d="M0 0 H12 L0 13 H12" className="bi-s-tin" fill="none" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />)}</g>
  if (cam === 'lua') return <g className="bi-tren bi-ngon"><path d="M160 52 C150 40 162 30 158 16 C172 26 180 40 172 54 C170 58 164 58 160 52Z" className="bi-f-lua bi-net" strokeWidth="2.5" /><path d="M164 50 C160 44 166 40 165 33 C171 39 173 46 169 51Z" className="bi-f-sao" /></g>
  return null
}

export interface PropsBi {
  cam?: CamBi
  /** Cạnh rộng (px); cao tự theo tỉ lệ 200 : 230. */
  size?: number
  className?: string
  /** Nhịp một lần khi vừa hiện: 'nay' (đúng), 'lac' (sai), 'nhay' (mừng). Mặc định theo cảm xúc. */
  nhip?: 'nay' | 'lac' | 'nhay' | 'yen'
}

export function Bi({ cam = 'chao', size = 96, className, nhip }: PropsBi) {
  const id = 'bi' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const y = MUC[cam] ?? 108
  const song = `M20 ${y} Q40 ${y - 8} 60 ${y} T100 ${y} T140 ${y} T180 ${y}`
  const nhipMd = nhip ?? (cam === 'vui' ? 'nay' : cam === 'sai' ? 'lac' : cam === 'mung' ? 'nhay' : 'yen')
  // Chớp mắt ngẫu nhiên 3–6 s, mỗi Bi một nhịp (ổn định theo id, không đổi giữa các lần vẽ).
  const chop = 3 + ([...id].reduce((s, c) => s + c.charCodeAt(0), 0) % 30) / 10
  return <svg className={`bi${className ? ` ${className}` : ''}`} data-cam={cam} data-nhip={nhipMd} viewBox="0 0 200 230" width={size} height={Math.round((size * 230) / 200)}
    aria-hidden="true" focusable="false" style={{ '--bi-chop': `${chop}s` } as CSSProperties}>
    <defs>
      <clipPath id={`${id}-c`}><path d={THAN} /></clipPath>
      <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="bi-g-sang" /><stop offset=".55" className="bi-g-chinh" /><stop offset="1" className="bi-g-dam" /></linearGradient>
      <radialGradient id={`${id}-k`} cx=".35" cy=".3" r=".75"><stop offset="0" className="bi-g-kinh" stopOpacity=".95" /><stop offset="1" className="bi-g-kinh-2" stopOpacity=".9" /></radialGradient>
    </defs>
    <ellipse cx="100" cy="214" rx="50" ry="7" className="bi-bong" opacity=".12" />
    <Tren cam={cam} />
    <g className="bi-than">
      {cam !== 'ngu' && <g className="bi-bot">
        <circle cx="100" cy="30" r="6" className="bi-f-sang bi-net" strokeWidth="2.5" />
        <circle cx="112" cy="16" r="4" className="bi-f-sang bi-net" strokeWidth="2.2" />
        <circle cx="93" cy="6" r="2.8" className="bi-f-sang bi-net" strokeWidth="2" />
      </g>}
      <Tay d={TAY[cam].slice(0, 4)} /><Tay d={TAY[cam].slice(4)} />
      <ellipse cx="78" cy="197" rx="14" ry="9" className="bi-f-dam bi-net" strokeWidth="4" />
      <ellipse cx="122" cy="197" rx="14" ry="9" className="bi-f-dam bi-net" strokeWidth="4" />
      <path d={THAN} fill={`url(#${id}-k)`} />
      <g clipPath={`url(#${id}-c)`}>
        <path d={`${song} V230 H20 Z`} fill={`url(#${id}-l)`} />
        <path d={song} className="bi-s-trang" fill="none" strokeOpacity=".55" strokeWidth="3" />
        <circle cx="70" cy={y + 70} r="4" className="bi-trang" opacity=".35" /><circle cx="136" cy={y + 62} r="5.5" className="bi-trang" opacity=".3" /><circle cx="118" cy={y + 80} r="3" className="bi-trang" opacity=".35" />
      </g>
      <rect x="78" y="38" width="44" height="12" rx="6" fill={`url(#${id}-k)`} className="bi-net" strokeWidth="4.5" />
      <path d={THAN} className="bi-net" fill="none" strokeWidth="5" strokeLinejoin="round" />
      <path d="M58 104 Q64 92 76 86" className="bi-s-trang" fill="none" strokeWidth="6" strokeLinecap="round" opacity=".9" />
      <circle cx="54" cy="116" r="3.2" className="bi-trang" opacity=".9" />
      <path d="M91 52 V74" className="bi-s-trang" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      <ellipse cx="62" cy="156" rx="9.5" ry="6" className="bi-ma" opacity={cam === 'ngu' ? 0.5 : 0.85} />
      <ellipse cx="138" cy="156" rx="9.5" ry="6" className="bi-ma" opacity={cam === 'ngu' ? 0.5 : 0.85} />
      <Mat cam={cam} />
      <Mieng cam={cam} />
    </g>
  </svg>
}

export default Bi
