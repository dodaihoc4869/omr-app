// LINH VẬT «MOL» — MẶT BÌNH CẦU (thầy chốt 01/11: «Chọn Mol bình cầu, thêm cả cáu, rất cáu nữa nhé. Đặt tên linh vật là Mol thôi»; bản vẽ docs/ban-ve-mol-0111).
// 01/11 tối (thầy: «Giữ nguyên hình cầu đi, điều chỉnh lại cảm xúc cho dễ thương, thêm 6,022, phối màu lại cho đẹp mịn siêu dễ thương»; bản vẽ docs/ban-ve-mol-v2-0111):
//   · GIỮ dáng bình cầu + cổ bình + vành. Màu MỊN: cầu chuyển màu tròn (sáng trên-trái → tối nhẹ dưới-phải), vệt sáng kính bóng, ánh viền, bóng đổ mềm dưới đáy;
//     dung dịch mặt sóng mềm; má hồng phấn (gradient tròn). Mọi màu là lớp `m-*` / lớp stop `s-*` ⇒ biến --mol-* (styles/mol.css) pha từ token có sẵn.
//   · MẮT TO TRÒN: tròng trắng tròn, con ngươi to, đốm sáng to + nhỏ; cảm xúc bằng MÍ cắt vào tròng (cười = mí dưới cong, chán / giận = mí trên sụp nghiêng)
//     + lông mày mềm; miệng nhỏ xinh. Giận KHÔNG răng: mày chau, mắt nheo, miệng khép.
//   · CÁU / RẤT CÁU: cả bình ĐỔI SẮC đỏ sẫm (nhóm .mol-g4 / .mol-g5 đặt lại biến màu ⇒ cả stop gradient đổi theo), tròng hồng đỏ, con ngươi nhỏ;
//     NÚT BẤC trên cổ bình bung lên lơ lửng trên NGỌN LỬA (hai lưỡi); dung dịch đỏ dâng. Dỗi / bực: chỉ ửng má.
//   · BA BỘ MÀU đổi mỗi ngày (thầy «chọn cả 3 bộ màu thay đổi mỗi ngày»): svg mang data-mol-mau = boMauMol(giờ máy chủ) — src/lib/mau-mol-ngay.ts.
//   · «6,022·10²³» ở phần DUNG DỊCH dưới bụng (thầy: «chuyển xuống dưới bụng chỗ dung dịch, cho to nổi bật hơn»): cong theo đáy cầu, trắng đậm + bóng mảnh,
//     đứng yên khi dung dịch đỏ dâng (cáu / rất cáu) — ẩn khi Bi < 64 px (.bi[data-nho] trong mol.css; 48 px đã thử: không đọc được).
// CHỈ CÓ MẶT: hình cú ngọc (lua-dong.ts) chỉ còn là kiểu `Lua` + đường lùi; Bi.tsx và mọi chỗ gọi <Bi …> không đổi. Mảnh NẠP LƯỜI (chỉ Bi.tsx gọi import('./mol-dong')).
//   · Cảm xúc: vui · khen · chào · nghĩ · ngạc nhiên · buồn · ngủ + 4 mức giận theo cấp: 2 dỗi · 3 bực · 4 CÁU · 5 RẤT CÁU.
//     Mặt phương án (thầy chọn sau, chưa gắn trạng thái nào): ngượng · mê · vui nhảy · tự tin.
//   · Chuyển động bằng CSS (styles/mol.css): thở, chớp mắt, bọt nổi, nhún khi khen, run khi rất cáu, miệng mấp máy, lửa lắc + nút bấc nhấp nhô.
//     Giảm chuyển động / máy yếu ⇒ đứng yên (CSS). Không vòng rAF, không filter.
// Khung vẽ 200 × 230 (= tỉ lệ 200 : 230 của khung Bi cũ) ⇒ mọi khung chứa giữ nguyên.
import '../../styles/mol.css'
import { gioMayChu } from '../../lib/gio-may-chu'
import { boMauMol } from '../../lib/mau-mol-ngay'
import type { DungGian, GocLua, Lua, TrangThaiLua, TuyChonLua } from './lua-dong'

export const VIEWBOX_MOL = '0 -26 200 230'
/** Mặt vẽ được của Mol (4 mặt cuối là phương án, chưa gắn trạng thái). */
export type MatMol = 'vui' | 'khen' | 'chao' | 'nghi' | 'ngac' | 'buon' | 'ngu' | 'doi' | 'buc' | 'cau' | 'ratCau' | 'nguong' | 'me' | 'nhay' | 'tuTin'
/** Trạng thái cũ của Lửa ⇒ mặt Mol (giữ API: Bi.tsx truyền đúng các trạng thái này). */
export const MAT_THEO_TRANG_THAI: Readonly<Record<TrangThaiLua, MatMol>> = {
  yen: 'vui', cuoi: 'khen', chao: 'chao', vui: 'vui', combo: 'khen', buon: 'buon', nghi: 'nghi', covu: 'khen', ngu: 'ngu', choc: 'ngac',
  doi: 'doi', caunhau: 'buc', gian: 'cau', giam: 'ratCau',
}
/** Cấp giận 2–5 (src/lib/lua-cam-xuc.ts) ⇒ mặt Mol; thắng trạng thái thường. */
export const MAT_THEO_CAP: Readonly<Record<number, MatMol>> = { 2: 'doi', 3: 'buc', 4: 'cau', 5: 'ratCau' }
/** Nhịp chuyển động (lớp CSS trên svg). */
const DONG: Partial<Record<TrangThaiLua, string>> = { combo: 'nhun', covu: 'nhun', chao: 'lac', buon: 'chung', choc: 'giat' }

const f = (n: number) => Math.round(n * 10) / 10
const L = 73, R = 127, Y = 98, ER = 26 // tâm hai mắt + bán kính tròng
/** Mắt mở: viền tròng + tròng trắng + con ngươi to + đốm sáng to và nhỏ. (dx, dy) = hướng nhìn; p = cỡ con ngươi. */
function tron(x: number, ben: -1 | 1, dx = 0, dy = 2, p = 14): string {
  const px = x - ben * 2 + dx, py = Y + dy
  return `<g class="mol-mat"><circle cx="${x}" cy="${Y}" r="${ER}" class="m-trong m-vien-n"/><circle cx="${px}" cy="${py}" r="${p}" class="m-muc mol-ngoi"/>` +
    `<circle cx="${f(px + p * 0.38)}" cy="${f(py - p * 0.42)}" r="${f(p * 0.42)}" class="m-t mol-ngoi"/><circle cx="${f(px - p * 0.45)}" cy="${f(py + p * 0.42)}" r="${f(p * 0.18)}" class="m-t mol-ngoi"/></g>`
}
/** Mí cắt vào tròng (cùng vùng cắt với tròng): mí TRÊN sụp theo đường nghiêng (ng > 0: ngoài cao trong thấp = giận; < 0: buồn), mí DƯỚI cong lên (cười / nheo). */
function mi(x: number, ben: -1 | 1, u: string, tren?: [number, number], duoi?: number): string {
  let s = `<clipPath id="${u}"><circle cx="${x}" cy="${Y}" r="${ER}"/></clipPath>`
  if (tren) {
    const [ng, sau] = tren, yTB = Y - ER + 2 * ER * sau, yN = yTB - ng * 9, yT = yTB + ng * 9
    const [y1, y2] = ben < 0 ? [yN, yT] : [yT, yN]
    s += `<path clip-path="url(#${u})" d="M${x - ER - 2} ${Y - ER - 2} H${x + ER + 2} V${f(y2)} L${x - ER - 2} ${f(y1)} Z" class="m-x"/><path clip-path="url(#${u})" d="M${x - ER} ${f(y1)} L${x + ER} ${f(y2)}" class="m-net" stroke-width="3"/>`
  }
  if (duoi !== undefined) s += `<path clip-path="url(#${u})" d="M${x - ER - 2} ${Y + ER + 2} V${Y + duoi} Q${x} ${Y + duoi - 11} ${x + ER + 2} ${Y + duoi} V${Y + ER + 2} Z" class="m-x"/><path clip-path="url(#${u})" d="M${x - ER} ${Y + duoi} Q${x} ${Y + duoi - 11} ${x + ER} ${Y + duoi}" class="m-net" stroke-width="2.6"/>`
  return s
}
/** Lông mày mềm: nét tròn ngắn; nghieng > 0 ⇒ chau (thấp phía trong), < 0 ⇒ buồn (cao phía trong); cao = nâng lên. */
const may = (x: number, ben: -1 | 1, nghieng = 0, cao = 0, w = 4.6) => {
  const yN = Y - 34 - cao - nghieng * 4, yT = Y - 34 - cao + nghieng * 4
  return `<path d="M${x + ben * 12} ${f(yN)} Q${x} ${f((yN + yT) / 2 - 3)} ${x - ben * 12} ${f(yT)}" class="m-net" stroke-width="${w}"/>`
}
const cung = (x: number, len = 15, cao = -15, w = 5.6) => `<path d="M${x - len} ${Y + 4} Q${x} ${Y + cao} ${x + len} ${Y + 4}" class="m-net" stroke-width="${w}"/>`
const tim = (x: number, y: number, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 9 C-15 -1 -11 -14 0 -6 C11 -14 15 -1 0 9Z" class="m-tim"/>`
const sao = (x: number, y: number, s: number) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3Z" class="m-sao"/>`

let soId = 0
/** Mắt + mày theo mặt; `g` = tiền tố id của hình (vùng cắt mí `${g}ea` / `${g}eb`, ánh đỏ `${g}g`). */
function matVe(mat: MatMol, goc: GocLua, g: string): string {
  const nhin = goc === 'phai' ? 6 : goc === 'trai' ? -6 : 0
  const u = `${g}e`
  const hai = (fn: (x: number, ben: -1 | 1, id: string) => string) => fn(L, -1, u + 'a') + fn(R, 1, u + 'b')
  switch (mat) {
    case 'khen': case 'nhay': return cung(L) + cung(R)
    case 'nguong': return cung(L, 13, -11) + cung(R, 13, -11)
    case 'ngu': return [L, R].map((x) => `<path d="M${x - 15} ${Y + 1} Q${x} ${Y + 13} ${x + 15} ${Y + 1}" class="m-net" stroke-width="5.4"/>`).join('')
    case 'chao': return tron(L, -1, 2 + nhin, 0) + mi(L, -1, u + 'a', undefined, 21) + cung(R, 15, -13)
    case 'ngac': return hai((x, b) => tron(x, b, nhin / 2, 0, 9.5) + may(x, b, -0.2, 4))
    case 'nghi': return hai((x, b, id) => tron(x, b, 6, -8, 13) + mi(x, b, id, undefined, 19)) + may(R, 1, -0.6, 4)
    case 'buon': return hai((x, b, id) => tron(x, b, nhin, 7, 13) + mi(x, b, id, [-0.9, 0.3]) + may(x, b, -1.2, 1)) + `<path d="M${L - 17} ${Y + 18} q-6 10 0 14 q6 -4 0 -14z" class="m-nuoc"/>`
    case 'doi': return hai((x, b, id) => tron(x, b, -8, 6, 12.5) + mi(x, b, id, [0, 0.46]) + may(x, b, 0.3, -1))
    case 'buc': return hai((x, b, id) => tron(x, b, 0, 5, 12) + mi(x, b, id, [0.7, 0.36], 18) + may(x, b, 1, -2, 5))
    case 'cau': return hai((x, b, id) => tron(x, b, 0, 5, 10) + mi(x, b, id, [1.1, 0.44], 15) + may(x, b, 1.5, -3, 5.4))
    case 'ratCau': return hai((x, b, id) => `<circle cx="${x}" cy="${Y + 2}" r="${ER + 9}" fill="url(#${g}g)"/>` + tron(x, b, 0, 5, 8) + mi(x, b, id, [1.35, 0.5], 14) + may(x, b, 1.9, -4, 5.8))
    case 'me': return [L, R].map((x) => `<circle cx="${x}" cy="${Y}" r="${ER}" class="m-trong m-vien-n"/>` + tim(x, Y + 1, 1.45) + `<circle cx="${x - 5}" cy="${Y - 5}" r="3" class="m-t"/>`).join('')
    case 'tuTin': return hai((x, b, id) => tron(x, b, 5, 5, 12.5) + mi(x, b, id, [0.15, 0.42])) + may(R, 1, -0.5, 4)
    default: return hai((x, b, id) => tron(x, b, nhin, -1) + mi(x, b, id, undefined, 21))
  }
}
function miengVe(mat: MatMol): string {
  const to = '<g class="mol-mieng"><path d="M85 135 Q100 161 115 135 Z" class="m-mieng"/><path d="M92 148 Q100 142 108 148 Q100 155 92 148Z" class="m-luoi"/></g>'
  switch (mat) {
    case 'khen': case 'chao': case 'nhay': case 'me': return to
    case 'ngac': return '<g class="mol-mieng"><ellipse cx="100" cy="143" rx="6" ry="7.5" class="m-mieng"/></g>'
    case 'nghi': return '<g class="mol-mieng"><path d="M93 143 Q99 139.5 108 141.5" class="m-net" stroke-width="3.6"/></g>'
    case 'buon': return '<g class="mol-mieng"><path d="M92 146 Q100 139 108 146" class="m-net" stroke-width="3.8"/></g>'
    case 'ngu': return '<g class="mol-mieng"><ellipse cx="100" cy="142" rx="3.6" ry="3" class="m-mieng"/></g>'
    case 'doi': return '<g class="mol-mieng"><path d="M94 144 Q99.5 140 106 144.5" class="m-net" stroke-width="3.6"/><circle cx="113" cy="140" r="2.6" class="m-hoi"/></g>'
    case 'buc': return '<g class="mol-mieng"><path d="M94 143 H106" class="m-net" stroke-width="3.8"/></g>'
    case 'cau': return '<g class="mol-mieng"><path d="M93.5 144.5 Q100 140.5 106.5 144.5" class="m-net" stroke-width="4"/></g>'
    case 'ratCau': return '<g class="mol-mieng"><path d="M94.5 145 Q100 141.5 105.5 145" class="m-net" stroke-width="4.4"/></g>'
    case 'nguong': return '<g class="mol-mieng"><path d="M94 141 Q100 146.5 106 141" class="m-net" stroke-width="3.6"/></g>'
    case 'tuTin': return '<g class="mol-mieng"><path d="M92 142 Q101 148 109 138.5" class="m-net" stroke-width="3.8"/></g>'
    default: return '<g class="mol-mieng"><path d="M91 137 Q100 150 109 137 Z" class="m-mieng"/><path d="M95 144.5 Q100 141.5 105 144.5 Q100 148.5 95 144.5Z" class="m-luoi"/></g>'
  }
}
function themVe(mat: MatMol): string {
  switch (mat) {
    case 'khen': return '<g class="mol-sao">' + sao(28, 44, 1) + sao(172, 54, 0.8) + sao(160, 24, 0.55) + '</g>'
    case 'ngu': return '<g class="mol-z"><text x="148" y="40" class="m-vien mol-chu" font-size="22">z</text><text x="164" y="22" class="m-vien mol-chu" font-size="15">z</text></g>'
    case 'nghi': return '<text x="160" y="46" class="m-cam mol-chu" font-size="30">?</text>'
    case 'ngac': return '<path d="M38 36 L46 46 M30 58 L42 60 M162 36 L154 46 M170 58 L158 60" class="m-net-cam" stroke-width="3.6"/>'
    case 'nguong': return '<g class="mol-sao">' + sao(30, 52, 0.75) + sao(170, 46, 0.9) + sao(158, 20, 0.5) + '</g><path d="M42 124 l-4 6 M48 124 l-4 6 M156 124 l-4 6 M162 124 l-4 6" class="m-net-ma" stroke-width="2.4"/>'
    case 'me': return tim(28, 50, 0.9) + tim(172, 40, 1.1) + tim(158, 12, 0.65)
    case 'nhay': return '<g class="mol-sao">' + sao(30, 46, 0.8) + sao(170, 40, 0.9) + '</g><path d="M162 22 V4 Q169 7 171 13 M38 40 V24 Q45 27 47 33" class="m-net-not" stroke-width="3"/><ellipse cx="159" cy="23" rx="4.5" ry="3.5" class="m-not"/><ellipse cx="35" cy="41" rx="4.5" ry="3.5" class="m-not"/>'
    case 'tuTin': return '<g class="mol-sao">' + sao(166, 40, 0.7) + sao(178, 60, 0.45) + '</g>'
    default: return ''
  }
}
/** GIẬN = ĐỔI SẮC + DUNG DỊCH SÔI + NÚT BẤC BUNG TRÊN NGỌN LỬA (thầy 01/11). Dung dịch: cáu đỏ cam dâng 14, rất cáu đỏ dâng 26; bọt trồi lên mặt. */
const SOI_THUONG = { dy: 0, lop: 'nuoc', them: '' }
const SOI: Partial<Record<MatMol, typeof SOI_THUONG>> = {
  cau: { dy: -14, lop: 'soi', them: '<circle cx="86" cy="166" r="3.6" class="m-bot mol-bot b2"/>' },
  ratCau: { dy: -26, lop: 'do', them: '<circle cx="84" cy="166" r="4.6" class="m-bot mol-bot b2"/><circle cx="140" cy="168" r="3.8" class="m-bot mol-bot b3"/><circle cx="62" cy="170" r="3.4" class="m-bot mol-bot b1"/>' },
}
const GIAN: Partial<Record<MatMol, string>> = { doi: 'mol-g2', buc: 'mol-g3', cau: 'mol-g4', ratCau: 'mol-g5' }
/** Nút bấc: đóng trong cổ bình; cáu bật lên nghiêng trên lửa; rất cáu bay cao, nghiêng nhiều. */
const NUT_BUNG: Partial<Record<MatMol, string>> = { cau: 'translate(-4 -22) rotate(-14 100 3)', ratCau: 'translate(6 -32) rotate(18 100 3)' }
const LUA = (to: boolean) => `<g class="mol-lua${to ? ' mol-lua-to' : ''}"><g transform="translate(100 14) scale(${to ? 1.3 : 1})"><path d="M0 -30 C6 -22 15 -17 13 -6 C12 2 6 5 0 5 C-6 5 -13 2 -13 -6 C-13 -13 -8 -16 -5 -22 C-3 -18 -2 -17 -1 -18 C-2 -22 -2 -26 0 -30 Z" class="m-lua1"/>` +
  '<path d="M0 -17 C4 -12 8 -9 7 -3 C7 1 3 3 0 3 C-3 3 -7 1 -7 -3 C-7 -8 -3 -11 0 -17 Z" class="m-lua2"/></g></g>'
/** SVG trọn một mặt Mol (dùng cho bản vẽ / test / ảnh tĩnh). Thuần chuỗi. */
export function svgMol(mat: MatMol, goc: GocLua = 'truoc'): string {
  const g = `molb${++soId}`
  const soi = SOI[mat] ?? SOI_THUONG, S = 166 + soi.dy, nut = NUT_BUNG[mat]
  const gian = mat === 'cau' || mat === 'ratCau'
  return `<g class="${GIAN[mat] ?? 'mol-g0'}"><defs><clipPath id="${g}"><circle cx="100" cy="120" r="76"/></clipPath>
    <radialGradient id="${g}q" cx=".38" cy=".3" r=".78" fx=".33" fy=".25"><stop offset="0" class="s-sang"/><stop offset=".52" class="s-x"/><stop offset="1" class="s-toi"/></radialGradient>
    <linearGradient id="${g}c" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="s-sang"/><stop offset=".5" class="s-x"/><stop offset="1" class="s-toi"/></linearGradient>
    <linearGradient id="${g}l" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="s-${soi.lop}-sang"/><stop offset=".35" class="s-${soi.lop}"/><stop offset="1" class="s-${soi.lop}-toi"/></linearGradient>
    <radialGradient id="${g}h"><stop offset="0" class="s-bong-sang"/><stop offset="1" class="s-bong-sang0"/></radialGradient>
    <radialGradient id="${g}m"><stop offset="0" class="s-ma"/><stop offset="1" class="s-ma0"/></radialGradient>${mat === 'ratCau' ? `<radialGradient id="${g}g"><stop offset=".55" class="s-anh"/><stop offset="1" class="s-anh0"/></radialGradient>` : ''}</defs>
  <ellipse cx="100" cy="199" rx="50" ry="5.5" class="m-bong"/>
  <g class="mol-than">
    <rect x="80" y="12" width="40" height="44" rx="6" fill="url(#${g}c)"/>
    ${gian ? LUA(mat === 'ratCau') : ''}
    <g${nut ? ` transform="${nut}"` : ''}><g class="mol-nut"><rect x="85" y="-6" width="30" height="18" rx="7" class="m-nut"/><rect x="88" y="-4" width="12" height="4" rx="2" class="m-nut-sang"/><circle cx="106" cy="3" r="1.6" class="m-nut-toi"/><circle cx="94" cy="6" r="1.3" class="m-nut-toi"/></g></g>
    <rect x="73" y="8" width="54" height="13" rx="6.5" class="m-vanh"/><rect x="77" y="10" width="22" height="3" rx="1.5" class="m-sang"/>
    <circle cx="100" cy="120" r="76" fill="url(#${g}q)"/>
    <g clip-path="url(#${g})"><g class="mol-nuoc-cam"><path d="M20 ${S} C50 ${S - 7} 70 ${S + 5} 100 ${S} C130 ${S - 5} 150 ${S + 6} 182 ${S - 1} V212 H20Z" fill="url(#${g}l)"/>
      <path d="M20 ${S} C50 ${S - 7} 70 ${S + 5} 100 ${S} C130 ${S - 5} 150 ${S + 6} 182 ${S - 1}" class="m-mat-nuoc" stroke-width="2.6"/>
      <circle cx="54" cy="${S + 10}" r="3.6" class="m-bot mol-bot b1"/><circle cx="148" cy="${S + 12}" r="2.6" class="m-bot mol-bot b3"/>${soi.them.replace(/cy="(\d+)"/g, (_, y: string) => `cy="${Number(y) + soi.dy}"`)}</g>
      <path d="M152 162 A76 76 0 0 1 110 195" class="m-anh-vien" stroke-width="4"/></g>
    <path id="${g}k" d="M56 172 A66 66 0 0 0 144 172" fill="none"/><g class="mol-khac"><text class="m-khac-bong" font-size="14.4" text-anchor="middle" transform="translate(0 1)"><textPath href="#${g}k" startOffset="50%">6,022·10<tspan dy="-5.4" font-size="9.4">23</tspan></textPath></text><text class="m-khac" font-size="14.4" text-anchor="middle"><textPath href="#${g}k" startOffset="50%">6,022·10<tspan dy="-5.4" font-size="9.4">23</tspan></textPath></text></g>
    <ellipse cx="62" cy="70" rx="22" ry="12" fill="url(#${g}h)" transform="rotate(-36 62 70)"/><circle cx="48" cy="96" r="3.4" class="m-sang"/>
    <ellipse cx="47" cy="130" rx="15" ry="9" fill="url(#${g}m)"/><ellipse cx="153" cy="130" rx="15" ry="9" fill="url(#${g}m)"/>
    ${matVe(mat, goc, g)}
    <circle cx="100" cy="128" r="7" class="m-cam"/><circle cx="97.6" cy="125.6" r="2.2" class="m-camS"/>
    ${miengVe(mat)}
    ${themVe(mat)}${mat === 'ratCau' ? '<path d="M14 104 q-5 9 0 18 M186 104 q5 9 0 18" class="m-net-do" stroke-width="3"/>' : ''}
  </g></g>`
}

/** Các Mol đang sống (bộ chụp / test điều khiển qua đây) — cùng vai trò `LUA_DANG_SONG` của hình cũ. */
export const MOL_DANG_SONG = new Set<Lua>()
export function taoLua(noiGan: HTMLElement, tc: { trangThai?: TrangThaiLua; tuyChon?: TuyChonLua; tinh?: boolean; goc?: GocLua } = {}): Lua {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', VIEWBOX_MOL)
  svg.setAttribute('class', 'lua-svg mol-svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  if (tc.tinh) svg.setAttribute('data-tinh', '')
  noiGan.appendChild(svg)
  const goc: GocLua = tc.goc ?? 'truoc'
  let tt: TrangThaiLua = tc.trangThai ?? 'chao', cap = 0, hen = 0, henNoi = 0, henCham = 0, dangCham = false
  const mat = (): MatMol => (dangCham ? 'ngac' : MAT_THEO_CAP[cap] ?? MAT_THEO_TRANG_THAI[tt] ?? 'vui')
  const ve = () => {
    const m = mat()
    svg.innerHTML = svgMol(m, goc)
    svg.setAttribute('data-mat', m)
    svg.setAttribute('data-mol-mau', String(boMauMol(gioMayChu()))) // bộ màu của NGÀY VN (qua 0h ⇒ lần vẽ kế tiếp đổi)
    const dong = cap >= 5 ? 'run' : cap === 4 ? 'giat' : DONG[tt]
    if (dong && !tc.tinh) svg.setAttribute('data-dong', dong); else svg.removeAttribute('data-dong')
    if (cap) svg.setAttribute('data-cap-ve', String(cap)); else svg.removeAttribute('data-cap-ve')
  }
  const dat = (t: TrangThaiLua, tuy?: TuyChonLua) => {
    tt = t
    window.clearTimeout(hen)
    if (tuy?.sau && tuy.ve) { const ve2 = tuy.ve; hen = window.setTimeout(() => dat(ve2), tuy.sau) }
    ve()
  }
  const chamVao = () => {
    if (cap >= 2) return
    dangCham = true; ve()
    window.clearTimeout(henCham)
    henCham = window.setTimeout(() => { dangCham = false; ve() }, 900)
  }
  svg.addEventListener('click', chamVao)
  const l: Lua = {
    datTrangThai: (t, tuy) => dat(t, tuy),
    noi(chu, msMoiChu = 40) {
      svg.classList.add('mol-noi')
      window.clearTimeout(henNoi)
      henNoi = window.setTimeout(() => svg.classList.remove('mol-noi'), Math.min(6000, Math.max(400, chu.length * msMoiChu)))
    },
    cham: chamVao,
    get trangThai() { return tt },
    svg,
    buoc() { /* Mol chuyển động bằng CSS — không có đồng hồ để bước. */ },
    datCap(c: number, _dung?: DungGian) { const n = c >= 2 ? Math.min(5, Math.round(c)) : 0; if (n !== cap) { cap = n; ve() } },
    get cap() { return cap },
    huy() {
      window.clearTimeout(hen); window.clearTimeout(henNoi); window.clearTimeout(henCham)
      svg.removeEventListener('click', chamVao)
      svg.remove()
      MOL_DANG_SONG.delete(l)
    },
  }
  dat(tt, tc.tuyChon)
  MOL_DANG_SONG.add(l)
  return l
}

// ── BIỂU TƯỢNG TAB TRÌNH DUYỆT (giữ luật 31/10): cấp 4–5 ⇒ mặt Mol cáu / rất cáu (dung dịch đỏ sôi), chụp từ CHÍNH Mol đang vẽ trên trang (màu token đã quy ra —
// không tệp ảnh mới, không mã màu thô); hạ cấp / rời Lộ trình ⇒ về logo cũ (đúng href / type ban đầu). Lộ trình truyền hàm chụp SVG (`anhSvg` của
// khung-tinh-hs) vào để mảnh này không kéo theo mô-đun ấy. Máy chặn canvas / ảnh ⇒ giữ logo, không ném lỗi.
let iconGoc: { el: HTMLLinkElement; href: string; type: string }[] | null = null
let lanIcon = 0
export async function datIconTabMol(cap: number, anh: (svg: SVGSVGElement) => { src: string } | null): Promise<void> {
  const ma = ++lanIcon
  if (cap < 4) { if (iconGoc) for (const g of iconGoc) { g.el.type = g.type; g.el.href = g.href } iconGoc = null; return }
  try {
    // ưu tiên Mol đứng thẳng (vòng Mục tiêu ngày / bong bóng) đã vẽ xong đúng cấp; thiếu thì Mol cạnh đường
    const duoi = `[data-cap="${cap}"] > svg.mol-svg[data-cap-ve="${cap}"]`
    const svg = document.querySelector<SVGSVGElement>(`.bi.lua:not([data-goc])${duoi}`) ?? document.querySelector<SVGSVGElement>(`.bi.lua${duoi}`)
    const a = svg && anh(svg)
    if (!a) return
    const img = new Image()
    img.src = a.src.replace(/width='[^']*' height='[^']*'/, "width='200' height='230'") // khung vẽ đúng cỡ gốc 200 × 230
    await img.decode()
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d')
    if (!x || ma !== lanIcon) return
    x.drawImage(img, 5, 32, 190, 190, 0, 0, 64, 64) // cổ bình + đầu tròn: x 5…195, y 6…196 của khung vẽ
    const url = c.toDataURL('image/png')
    if (ma !== lanIcon || !url.startsWith('data:image/png')) return
    iconGoc ??= [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')].map((el) => ({ el, href: el.getAttribute('href') ?? '', type: el.type }))
    for (const g of iconGoc) { g.el.type = 'image/png'; g.el.href = url }
  } catch { /* giữ logo */ }
}
