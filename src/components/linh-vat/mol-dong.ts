// LINH VẬT «MOL» — MẶT BÌNH CẦU (thầy chốt 01/11: «Chọn Mol bình cầu, thêm cả cáu, rất cáu nữa nhé. Đặt tên linh vật là Mol thôi»; bản vẽ docs/ban-ve-mol-0111).
// CHỈ CÓ MẶT (như Duolingo): đầu bình cầu thí nghiệm xanh dương của app, cổ bình, dung dịch cam sóng sánh ở cằm có bọt khí, hai mắt to sát nhau, mũi tròn cam.
// THAY hình cú ngọc (lua-dong.ts) nhưng GIỮ ĐÚNG giao diện `Lua` ⇒ Bi.tsx và mọi chỗ gọi <Bi …> không đổi. Mảnh NẠP LƯỜI (chỉ Bi.tsx gọi import('./mol-dong')).
//   · Cảm xúc: vui · khen · chào · nghĩ · ngạc nhiên · buồn · ngủ + 4 mức giận theo cấp (31/10): 2 dỗi · 3 bực · 4 CÁU · 5 RẤT CÁU (thầy 01/11).
//   · Giận: dung dịch cam hoá đỏ, dâng lên và sôi (cáu: tới miệng · rất cáu: sát mắt + hơi nước) — đầu vẫn xanh.
//   · Chuyển động bằng CSS (styles/mol.css): thở nhẹ, chớp mắt, bọt khí nổi (giận ⇒ sôi nhanh), nhún khi khen, run khi rất cáu, miệng mấp máy khi nói.
//     Giảm chuyển động / máy yếu ⇒ đứng yên (CSS). Không vòng rAF, không lò xo ⇒ nhẹ hơn hẳn hình cũ.
//   · Không màu thô: mọi màu là lớp `m-*` ⇒ biến --mol-* (styles/mol.css) pha từ token có sẵn (--tr-gv xanh app, --cam cam, --tr-sai đỏ giận).
// Khung vẽ 200 × 230 (= tỉ lệ 200 : 230 của khung Bi cũ) ⇒ mọi khung chứa giữ nguyên.
import '../../styles/mol.css'
import type { DungGian, GocLua, Lua, TrangThaiLua, TuyChonLua } from './lua-dong'

export const VIEWBOX_MOL = '0 -26 200 230'
/** Mặt vẽ được của Mol. */
export type MatMol = 'vui' | 'khen' | 'chao' | 'nghi' | 'ngac' | 'buon' | 'ngu' | 'doi' | 'buc' | 'cau' | 'ratCau'
/** Trạng thái cũ của Lửa ⇒ mặt Mol (giữ API: Bi.tsx truyền đúng các trạng thái này). */
export const MAT_THEO_TRANG_THAI: Readonly<Record<TrangThaiLua, MatMol>> = {
  yen: 'vui', cuoi: 'khen', chao: 'chao', vui: 'vui', combo: 'khen', buon: 'buon', nghi: 'nghi', covu: 'khen', ngu: 'ngu', choc: 'ngac',
  doi: 'doi', caunhau: 'buc', gian: 'cau', giam: 'ratCau',
}
/** Cấp giận 2–5 (src/lib/lua-cam-xuc.ts) ⇒ mặt Mol; thắng trạng thái thường. */
export const MAT_THEO_CAP: Readonly<Record<number, MatMol>> = { 2: 'doi', 3: 'buc', 4: 'cau', 5: 'ratCau' }
/** Nhịp chuyển động (lớp CSS trên svg). */
const DONG: Partial<Record<TrangThaiLua, string>> = { combo: 'nhun', covu: 'nhun', chao: 'lac', buon: 'chung', choc: 'giat' }

const L = 77, R = 123, Y = 92
const tron = (rx: number, ry: number, dx: number, dy: number, pr: number) => [L, R].map((x) =>
  `<g class="mol-mat"><ellipse cx="${x}" cy="${Y}" rx="${rx}" ry="${ry}" class="m-t m-vien-n"/><circle cx="${x + dx}" cy="${Y + dy}" r="${pr}" class="m-muc mol-ngoi"/><circle cx="${x + dx + pr * 0.32}" cy="${Y + dy - pr * 0.42}" r="${pr * 0.36}" class="m-t mol-ngoi"/></g>`).join('')
const cung = (x: number, len: number, cao: number, w = 6.5) => `<path d="M${x - len} ${Y + 6} Q${x} ${Y + cao} ${x + len} ${Y + 6}" class="m-net" stroke-width="${w}"/>`
/** Mí / mày: `nghieng` > 0 ⇒ ngoài cao trong thấp (giận), < 0 ⇒ trong cao ngoài thấp (buồn). */
function mi(x: number, ben: -1 | 1, nghieng: number, phu: number, u: string): string {
  const yNgoai = Y - 10 - nghieng * 6, yTrong = Y - 10 + nghieng * 6
  const [y1, y2] = ben < 0 ? [yNgoai, yTrong] : [yTrong, yNgoai]
  return `<clipPath id="${u}"><ellipse cx="${x}" cy="${Y}" rx="22" ry="28"/></clipPath><path clip-path="url(#${u})" d="M${x - 26} ${Y - 32} L${x + 26} ${Y - 32} L${x + 26} ${y2 + phu} L${x - 26} ${y1 + phu} Z" class="m-x"/><line x1="${x - 21}" y1="${y1 + phu}" x2="${x + 21}" y2="${y2 + phu}" class="m-net" stroke-width="3.5"/>`
}
let soId = 0
function matVe(mat: MatMol, goc: GocLua): string {
  const nhin = goc === 'phai' ? 6 : goc === 'trai' ? -6 : 0
  const u = `mol${++soId}`
  const mo = (dy: number, pr = 11) => tron(22, 28, 5 + nhin, dy, pr)
  const giuMat = (dx: number, dy: number, pr: number) => [L, R].map((x) => `<ellipse cx="${x}" cy="${Y}" rx="22" ry="28" class="m-t"/><circle cx="${x + dx}" cy="${Y + dy}" r="${pr}" class="m-muc"/><circle cx="${x + dx + 3}" cy="${Y + dy - 4}" r="${pr * 0.34}" class="m-t"/>`).join('')
  const vienMat = [L, R].map((x) => `<ellipse cx="${x}" cy="${Y}" rx="22" ry="28" class="m-khong m-vien-n"/>`).join('')
  switch (mat) {
    case 'khen': return [L, R].map((x) => cung(x, 17, -18)).join('')
    case 'ngu': return [L, R].map((x) => `<path d="M${x - 17} ${Y + 2} Q${x} ${Y + 16} ${x + 17} ${Y + 2}" class="m-net" stroke-width="6"/>`).join('')
    case 'chao': return `${tron(22, 28, 5 + nhin, 3, 11).split('</g>')[0]}</g>${cung(R, 17, -14)}`
    case 'ngac': return tron(24, 31, nhin / 2, 0, 8.5)
    case 'nghi': return tron(22, 28, 7, -10, 10.5) + `<path d="M${R - 17} ${Y - 38} Q${R} ${Y - 48} ${R + 17} ${Y - 40}" class="m-net" stroke-width="5"/>`
    case 'buon': return giuMat(0, 10, 10.5) + mi(L, -1, -1, 0, u + 'a') + mi(R, 1, -1, 0, u + 'b') + vienMat + `<path d="M${L - 16} ${Y + 26} q-6 10 0 14 q6 -4 0 -14z" class="m-nuoc"/>`
    case 'doi': return giuMat(12, 8, 10) + mi(L, -1, 0, 4, u + 'a') + mi(R, 1, 0, 4, u + 'b') + vienMat
    case 'buc': return giuMat(0, 6, 10) + mi(L, -1, 0.8, 0, u + 'a') + mi(R, 1, 0.8, 0, u + 'b') + vienMat
    case 'cau': return giuMat(0, 6, 9) + mi(L, -1, 1.6, 2, u + 'a') + mi(R, 1, 1.6, 2, u + 'b') + vienMat
    case 'ratCau': return giuMat(0, 5, 7) + mi(L, -1, 2.2, 4, u + 'a') + mi(R, 1, 2.2, 4, u + 'b') + vienMat
    default: return mo(3)
  }
}
function miengVe(mat: MatMol): string {
  switch (mat) {
    case 'khen': case 'chao': return '<g class="mol-mieng"><path d="M66 140 Q100 186 134 140 Z" class="m-vien"/><path d="M82 162 Q100 152 118 162 Q100 180 82 162Z" class="m-luoi"/></g>'
    case 'ngac': return '<g class="mol-mieng"><ellipse cx="100" cy="152" rx="11" ry="13" class="m-vien"/></g>'
    case 'nghi': return '<g class="mol-mieng"><path d="M86 152 Q100 146 116 150" class="m-net" stroke-width="5"/></g>'
    case 'buon': return '<g class="mol-mieng"><path d="M80 158 Q100 142 120 158" class="m-net" stroke-width="5.5"/></g>'
    case 'ngu': return '<g class="mol-mieng"><ellipse cx="100" cy="152" rx="6" ry="4.5" class="m-vien"/></g>'
    case 'doi': return '<g class="mol-mieng"><path d="M90 154 Q98 148 110 156" class="m-net" stroke-width="5"/><circle cx="120" cy="150" r="3" class="m-vien"/></g>'
    case 'buc': return '<g class="mol-mieng"><path d="M82 156 L118 156" class="m-net" stroke-width="5.5"/></g>'
    case 'cau': return '<g class="mol-mieng"><rect x="78" y="146" width="44" height="16" rx="6" class="m-vien"/><path d="M82 154 H118 M92 148 V160 M100 148 V160 M108 148 V160" class="m-net-t" stroke-width="2.4"/></g>'
    case 'ratCau': return '<g class="mol-mieng"><path d="M72 162 Q100 132 128 162 Z" class="m-vien"/><path d="M78 158 L86 150 L94 157 L100 149 L106 157 L114 150 L122 158" class="m-net-t" stroke-width="2.6"/></g>'
    default: return '<g class="mol-mieng"><path d="M70 142 Q100 180 130 142 Z" class="m-vien"/><path d="M85 160 Q100 152 115 160 Q100 174 85 160Z" class="m-luoi"/></g>'
  }
}
function themVe(mat: MatMol): string {
  if (mat === 'khen') return '<g class="mol-sao">' + [[30, 40, 1], [170, 52, 0.8], [162, 22, 0.55]].map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3Z" class="m-cam"/>`).join('') + '</g>'
  if (mat === 'ngu') return '<g class="mol-z"><text x="150" y="40" class="m-vien mol-chu" font-size="22">z</text><text x="166" y="22" class="m-vien mol-chu" font-size="15">z</text></g>'
  if (mat === 'nghi') return '<text x="160" y="42" class="m-cam mol-chu" font-size="30">?</text>'
  if (mat === 'cau' || mat === 'ratCau') {
    const hoi = mat === 'ratCau' ? '<g class="mol-hoi"><circle cx="92" cy="-6" r="9" class="m-hoi"/><circle cx="108" cy="-14" r="11" class="m-hoi"/><circle cx="100" cy="-2" r="7" class="m-hoi"/></g>' : ''
    return hoi + '<path d="M150 30 l8 -8 M158 38 l10 -2 M146 22 l2 -10" class="m-net-do" stroke-width="4"/>'
  }
  return ''
}
/** GIẬN = DUNG DỊCH SÔI (thầy 01/11 «thêm cả cáu, rất cáu»): dung dịch cam ở cằm hoá ĐỎ, DÂNG lên và sôi sùng sục theo cơn giận — đầu vẫn xanh của app.
 *  cáu: đỏ cam, dâng tới miệng · rất cáu: đỏ, dâng sát mắt, bọt to + hơi nước phụt khỏi cổ bình. */
const SOI_THUONG = { dy: 0, lop: 'm-cam', them: '' }
const SOI: Partial<Record<MatMol, typeof SOI_THUONG>> = {
  cau: { dy: -24, lop: 'm-soi', them: '<circle cx="88" cy="184" r="4" class="m-bot mol-bot b2"/>' },
  ratCau: { dy: -46, lop: 'm-soi2', them: '<circle cx="88" cy="184" r="5.5" class="m-bot mol-bot b2"/><circle cx="146" cy="186" r="4.5" class="m-bot mol-bot b3"/><circle cx="52" cy="186" r="4" class="m-bot mol-bot b1"/>' },
}
/** SVG trọn một mặt Mol (dùng cho bản vẽ / test / ảnh tĩnh). Thuần chuỗi. */
export function svgMol(mat: MatMol, goc: GocLua = 'truoc'): string {
  const g = `molb${++soId}`
  const soi = SOI[mat] ?? SOI_THUONG
  return `<defs><clipPath id="${g}"><circle cx="100" cy="120" r="76"/></clipPath></defs>
  <g class="mol-than">
    <rect x="80" y="12" width="40" height="44" rx="6" class="m-xd"/><rect x="73" y="8" width="54" height="13" rx="6.5" class="m-vien"/>
    <circle cx="100" cy="120" r="76" class="m-x"/>
    <g clip-path="url(#${g})"><g transform="translate(0 ${soi.dy})"><path d="M20 176 Q50 166 80 174 T140 172 T190 168 V${210 - soi.dy} H10Z" class="${soi.lop} mol-nuoc-cam"/>
      <circle cx="70" cy="190" r="5" class="m-bot mol-bot b1"/><circle cx="128" cy="192" r="3.5" class="m-bot mol-bot b2"/><circle cx="104" cy="188" r="2.6" class="m-bot mol-bot b3"/>${soi.them}</g></g>
    <ellipse cx="66" cy="78" rx="22" ry="11" class="m-sang" transform="rotate(-32 66 78)"/>
    ${matVe(mat, goc)}${miengVe(mat)}
    <circle cx="100" cy="124" r="8.5" class="m-cam"/><circle cx="97.5" cy="121.5" r="2.6" class="m-camS"/>
    <ellipse cx="56" cy="142" rx="9" ry="5" class="m-ma"/><ellipse cx="144" cy="142" rx="9" ry="5" class="m-ma"/>
    ${themVe(mat)}
  </g>`
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
