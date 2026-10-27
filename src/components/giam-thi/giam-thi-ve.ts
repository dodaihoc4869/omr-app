// GIÁM THỊ THEO MỨC CÂU (bản vẽ duyệt 27/10: ve-moi/giam-thi) — cùng gia đình với Bi. 4 con, mức càng cao càng khó tính:
//   nb Tí (ống nghiệm, nút bần) · th Cô Cốc (cốc có mỏ, kính tròn) · vd Chú Tam (bình tam giác, còi, bảng kẹp) · vdc Giáo sư Kíp (bình Kipp, kính một mắt, mũ, ria).
// SVG phẳng TÁCH LỚP + CSS (giam-thi.css: màu = biến --tr-*, không màu thô) + Web Animations API. Không thư viện. Chỉ transform / opacity:
// tư thế, nét mặt chuyển bằng transition trên biến CSS (nội suy từ giá trị đang có); động tác một lần bằng WAAPI, động tác mới trên cùng phần tử
// lấy giá trị ĐANG HIỆN làm điểm đầu (không nhảy cóc); mắt dõi theo bằng lerp trên requestAnimationFrame. Tab ẩn ⇒ dừng mọi hoạt ảnh và hẹn giờ;
// giảm chuyển động ⇒ đứng yên, chỉ đổi nét mặt. Chế độ `tinh` (+ `xam`, `mo`): hình tĩnh xám mờ cho chỗ khác dùng (vd. cạnh Lộ trình).
export type MucGT = 'nb' | 'th' | 'vd' | 'vdc'
export type TrangThaiGT = 'yen' | 'doc' | 'cho' | 'soi' | 'dong-ho' | 'nghi-ngo' | 'nop' | 'dung' | 'sai' | 'chua-tinh' | 'combo' | 'xong'
export const THU_TU_GT: readonly MucGT[] = ['nb', 'th', 'vd', 'vdc']

type HinhNV = {
  ten: string; muc: string; loai: string
  hinh: string; muc0: number; long?: string
  mat: [number, number, number]; r: [number, number]; may: [number, number, number, boolean?]; mieng: [number, number]
  ma: [number, number][] | null; vai: [[number, number], [number, number]]; L: number; chan: [number, number][]; dinh: number
  sang: string; sau?: string; dau?: string; mat2?: (c: HinhNV) => string; tha: [number, number]
}

export const NV_GT: Record<MucGT, HinhNV> = {
  nb: {
    ten: 'Tí', muc: 'Nhận biết', loai: 'Ống nghiệm',
    hinh: '<path d="M70 54 V184 A30 30 0 0 0 130 184 V54 Z"/><rect x="62" y="46" width="76" height="13" rx="6.5"/>',
    muc0: 98, mat: [86, 114, 130], r: [11.5, 13.5], may: [109, 8.5, 5.5], mieng: [100, 157],
    ma: [[78, 149], [122, 149]], vai: [[76, 174], [124, 174]], L: 32, chan: [[87, 219], [113, 219]], dinh: 22,
    sang: '<path class="gt-st" d="M79 66 V86" stroke-width="5" stroke-linecap="round" opacity=".9"/><circle class="gt-ft" cx="79" cy="95" r="2.6" opacity=".9"/>',
    dau: '<g class="gt-mu" style="transform-origin:100px 40px"><path class="gt-f-ban" d="M78 49 L80 27 Q80 22 85 22 H115 Q120 22 120 27 L122 49 Z"/><rect class="gt-f-ban2" x="80" y="22" width="40" height="7" rx="3.5"/><g class="gt-f-ban3"><circle cx="90" cy="38" r="2"/><circle cx="108" cy="34" r="1.6"/><circle cx="111" cy="43" r="1.8"/></g></g>',
    tha: [16, -16],
  },
  th: {
    ten: 'Cô Cốc', muc: 'Thông hiểu', loai: 'Cốc có mỏ',
    hinh: '<path d="M54 74 H146 V194 Q146 212 128 212 H72 Q54 212 54 194 Z"/><rect x="50" y="66" width="100" height="12" rx="6"/><path d="M54 66 Q42 60 35 63 Q33 72 54 78 Z"/>',
    muc0: 102, mat: [82, 118, 136], r: [12.5, 14.5], may: [108, 9, 5.5], mieng: [100, 172],
    ma: [[66, 165], [134, 165]], vai: [[66, 186], [134, 186]], L: 42, chan: [[80, 219], [120, 219]], dinh: 30,
    sang: '<path class="gt-st" d="M64 88 V96" stroke-width="5" stroke-linecap="round" opacity=".9"/><path class="gt-sd" d="M118 85 H134 M126 93 H134" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>',
    sau: '<g transform="translate(132 58) rotate(26)"><rect class="gt-f-vang" x="-4.5" y="-30" width="9" height="34" rx="2"/><rect class="gt-f-cy" x="-4.5" y="-30" width="3" height="34"/><rect class="gt-f-hong" x="-4.5" y="-37" width="9" height="8" rx="2.5"/></g>',
    mat2: (c) => { const [a, b, y] = c.mat; return `<g class="gt-kinh" style="transform-origin:100px ${y}px"><path class="gt-s-toi" d="M${a - 19} ${y - 3} L57 ${y - 8} M${b + 19} ${y - 3} L143 ${y - 8}" stroke-width="4" stroke-linecap="round"/><circle class="gt-kinh-o" cx="${a}" cy="${y}" r="18.5" stroke-width="4.5"/><circle class="gt-kinh-o" cx="${b}" cy="${y}" r="18.5" stroke-width="4.5"/><path class="gt-s-toi" d="M${a + 18} ${y - 3} Q100 ${y - 10} ${b - 18} ${y - 3}" fill="none" stroke-width="4.5" stroke-linecap="round"/></g>` },
    tha: [20, -20],
  },
  vd: {
    ten: 'Chú Tam', muc: 'Vận dụng', loai: 'Bình tam giác',
    hinh: '<path d="M88 46 V74 L46 184 Q38 212 66 212 H134 Q162 212 154 184 L112 74 V46 Z"/><rect x="82" y="38" width="36" height="11" rx="5.5"/>',
    muc0: 106, mat: [84, 116, 134], r: [12, 14], may: [114, 9, 6], mieng: [100, 162],
    ma: [[70, 155], [130, 155]], vai: [[64, 182], [136, 182]], L: 36, chan: [[82, 219], [118, 219]], dinh: 18,
    sang: '<path class="gt-st" d="M94 54 V66" stroke-width="5" stroke-linecap="round" opacity=".9"/>',
    dau: '<path class="gt-f-xam3" d="M86 40 L89 22 H111 L114 40 Z"/><rect class="gt-f-xam" x="87" y="18" width="26" height="7" rx="3.5"/>' +
      '<g class="gt-coi" style="transform-origin:100px 64px"><path class="gt-s-xanh" d="M89 62 Q100 82 111 62" fill="none" stroke-width="3"/><g transform="translate(100 80)"><rect class="gt-f-xam" x="-8" y="-4" width="13" height="8" rx="3"/><circle class="gt-f-xam2" cx="5" cy="1" r="5.5"/><circle class="gt-f-xam3" cx="5" cy="1" r="2"/></g></g>',
    tha: [16, -16],
  },
  vdc: {
    ten: 'Giáo sư Kíp', muc: 'Vận dụng cao', loai: 'Bình Kipp',
    hinh: '<circle cx="100" cy="128" r="44"/><ellipse cx="100" cy="186" rx="54" ry="28"/><rect x="93" y="68" width="14" height="22"/><circle cx="100" cy="52" r="21"/><rect x="95" y="20" width="10" height="16"/><rect x="146" y="185" width="26" height="10" rx="3"/>',
    muc0: 92, long: '<rect class="gt-fc" x="70" y="56" width="60" height="30"/><path class="gt-ss" d="M79 56 Q100 51 121 56" fill="none" stroke-width="4"/>',
    mat: [82, 118, 118], r: [12.5, 14.5], may: [96, 11, 8, true], mieng: [100, 156],
    ma: null, vai: [[64, 184], [136, 184]], L: 42, chan: [[78, 221], [122, 221]], dinh: 0,
    sang: '<path class="gt-st" d="M62 142 Q61 127 67 116" fill="none" stroke-width="5" stroke-linecap="round" opacity=".85"/><path class="gt-st" d="M85 46 Q88 39 95 36" fill="none" stroke-width="4" stroke-linecap="round" opacity=".9"/>',
    dau: '<g transform="translate(166 190)"><rect class="gt-f-xam3" x="-3" y="-11" width="6" height="22" rx="3"/><circle class="gt-f-xam" r="5"/></g>' +
      '<g class="gt-mu" style="transform-origin:100px 18px"><path class="gt-f-xam3" d="M78 17 V28 Q100 37 122 28 V17 Z"/><path class="gt-f-toi" d="M100 2 L142 14 L100 26 L58 14 Z"/><path class="gt-s-vang" d="M100 14 L134 19 V33" fill="none" stroke-width="2.5"/><rect class="gt-f-vang" x="131" y="31" width="6" height="11" rx="2"/></g>',
    mat2: (c) => { const [, b, y] = c.mat; return `<path class="gt-f-bac" transform="translate(0 -7)" d="M100 146 C94 139 83 139 78 146 C76 151 83 153 88 150 C92 148 96 149 100 151 C104 149 108 148 112 150 C117 153 124 151 122 146 C117 139 106 139 100 146Z"/>` +
      `<g class="gt-kinh" style="transform-origin:${b}px ${y}px"><path class="gt-s-vang2" d="M${b + 6} ${y + 18} Q${b + 22} ${y + 40} ${b + 14} ${y + 56}" fill="none" stroke-width="2" stroke-dasharray="3 2.5"/><circle class="gt-kinh-1" cx="${b}" cy="${y}" r="18.5" stroke-width="4.5"/><path class="gt-st" d="M${b - 9} ${y - 12} Q${b - 3} ${y - 15} ${b + 3} ${y - 14}" fill="none" stroke-width="2.5" stroke-linecap="round" opacity=".9"/></g>` },
    tha: [16, -16],
  },
}

// ─────────────────────────────── VẼ (chuỗi SVG, mọi màu là lớp CSS) ───────────────────────────────
const lapLanh = (x: number, y: number, s: number, lop: string) => `<path class="${lop}" transform="translate(${x} ${y}) scale(${s})" d="M0 -10 Q1.5 -1.5 10 0 Q1.5 1.5 0 10 Q-1.5 1.5 -10 0 Q-1.5 -1.5 0 -10Z"/>`
const lucGiac = (r: number, lop: string) => `<path class="${lop}" d="M${r} 0 L${r / 2} ${r * 0.866} L${-r / 2} ${r * 0.866} L${-r} 0 L${-r / 2} ${-r * 0.866} L${r / 2} ${-r * 0.866}Z"/>`
const bongLoi = (ky: '?' | '!') => `<circle class="gt-ft gt-s-toi" r="14" stroke-width="3"/>` + (ky === '?'
  ? `<path class="gt-s-tin" d="M-4.5 -3.5 Q-4.5 -8.5 0 -8.5 Q5 -8.5 5 -4 Q5 -1 0.5 1 V3" fill="none" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><circle class="gt-f-tin" cy="7.5" cx=".5" r="2.2"/>`
  : `<path class="gt-s-cy" d="M0 -8 V2" stroke-width="4.4" stroke-linecap="round"/><circle class="gt-f-cy" cy="7.5" r="2.5"/>`)
const MIENG: Record<string, string> = {
  thang: '<path class="gt-s-toi" d="M-8 0 H8" stroke-width="4.5" stroke-linecap="round"/>',
  mim: '<path class="gt-s-toi" d="M-8 2 Q0 -1.5 8 2" fill="none" stroke-width="4.5" stroke-linecap="round"/>',
  'cuoi-nhe': '<path class="gt-s-toi" d="M-9 -2 Q0 7 9 -2" fill="none" stroke-width="4.5" stroke-linecap="round"/>',
  cuoi: '<path class="gt-f-mieng gt-s-toi" d="M-13 -3 Q0 17 13 -3 Z" stroke-width="3.5" stroke-linejoin="round"/><path class="gt-f-luoi" d="M-6 7 Q0 12 6 7 Q0 3 -6 7Z"/>',
  nhech: '<path class="gt-s-toi" d="M-9 2 Q1 3 10 -5" fill="none" stroke-width="4.5" stroke-linecap="round"/>',
  xi: '<path class="gt-s-toi" d="M-9 5 Q0 -5 9 5" fill="none" stroke-width="4.5" stroke-linecap="round"/>',
  o: '<ellipse class="gt-f-mieng gt-s-toi" cy="1" rx="5" ry="6" stroke-width="3"/>',
}

let soId = 0
export function veGiamThi(muc: MucGT): string {
  const c = NV_GT[muc], id = `gt${++soId}`
  const [xL, xR, ey] = c.mat, [rx, ry] = c.r, m = c.muc0
  const mat = (x: number, k: number) => `<g class="gt-mo"><clipPath id="${id}-e${k}"><ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}"/></clipPath>
<ellipse class="gt-ft" cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}"/><g clip-path="url(#${id}-e${k})">
<g class="gt-con"><circle class="gt-f-toi" cx="${x + 1}" cy="${ey + 1.5}" r="${(rx * 0.62).toFixed(1)}"/><circle class="gt-ft" cx="${x + 3.8}" cy="${ey - 2.6}" r="${(rx * 0.24).toFixed(1)}"/></g>
<g class="gt-chop"><g class="gt-mi"><rect class="gt-fc" x="${x - rx - 2}" y="${ey - ry * 3 - 2}" width="${rx * 2 + 4}" height="${ry * 2 + 2}"/><path class="gt-sd" d="M${x - rx - 2} ${ey - ry} H${x + rx + 2}" stroke-width="3.5"/></g></g>
<g class="gt-mi2"><rect class="gt-fc" x="${x - rx - 2}" y="${ey + ry}" width="${rx * 2 + 4}" height="${ry * 2}"/><path class="gt-sd" d="M${x - rx - 2} ${ey + ry} H${x + rx + 2}" stroke-width="3"/></g></g></g>
<path class="gt-cuoi gt-s-toi" d="M${x - rx + 1} ${ey + 4} Q${x} ${ey - ry + 1} ${x + rx - 1} ${ey + 4}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
<path class="gt-nham gt-s-toi" d="M${x - rx + 2} ${ey + 1} Q${x} ${ey + 7} ${x + rx - 2} ${ey + 1}" fill="none" stroke-width="4.5" stroke-linecap="round"/>`
  const [my, mw, ms, bac] = c.may
  const may = (x: number, k: string) => `<g transform="translate(${x} ${my})"><path class="gt-may-${k} ${bac ? 'gt-s-bac' : 'gt-s-toi'}" d="M${-mw} 1.5 Q0 -2.5 ${mw} 1.5" fill="none" stroke-width="${ms}" stroke-linecap="round"/></g>`
  const [mx, myy] = c.mieng
  const tay = (k: 0 | 1) => {
    const [sx, sy] = c.vai[k], L = c.L
    let cu = ''
    const nguoc = (s: string) => `<g class="gt-nguoc" style="transform-origin:0px ${L}px"><g class="gt-theo" style="transform-origin:0px ${L}px">${s}</g></g>`
    if (k === 0) cu += `<g class="gt-dongho" transform="translate(0 ${L - 13})"><g><rect class="gt-f-xam3" x="-8.5" y="-3" width="17" height="6" rx="2"/><rect class="gt-ft gt-s-xam3" x="-5.5" y="-5" width="11" height="10" rx="3" stroke-width="2"/><path class="gt-s-xam3" d="M0 -2.6 V0 H2.4" stroke-width="1.4" fill="none" stroke-linecap="round"/></g></g>`
    if (muc === 'vd' && k === 1) cu += nguoc(`<g transform="translate(-16 ${L - 33})"><rect class="gt-f-ban" width="32" height="38" rx="5"/><rect class="gt-ft" x="4" y="6" width="24" height="28" rx="2"/><rect class="gt-f-xam" x="10" y="-3" width="12" height="7" rx="2"/><path class="gt-s-xam2" d="M8 14 H24 M8 20 H20 M8 26 H22" stroke-width="2" stroke-linecap="round"/><g class="gt-tick" style="transform-origin:16px 19px"><path class="gt-s-dung" d="M8 19 L14 26 L25 11" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g><g class="gt-cheo" style="transform-origin:16px 19px"><path class="gt-s-sai" d="M9 11 L23 27 M23 11 L9 27" fill="none" stroke-width="4.5" stroke-linecap="round"/></g></g>`)
    if (muc === 'vdc' && k === 0) cu += nguoc(`<g class="gt-so" style="transform-origin:0px ${L}px"><g transform="translate(-17 ${L - 30})"><rect class="gt-f-xam3" width="34" height="32" rx="4"/><rect class="gt-ft" x="4" y="3" width="27" height="26" rx="2"/><path class="gt-s-xam2" d="M8 10 H26 M8 16 H22 M8 22 H25" stroke-width="2" stroke-linecap="round"/><rect class="gt-f-sai" width="5" height="32" rx="2"/></g></g>`)
    if ((muc === 'vd' && k === 0) || (muc === 'vdc' && k === 1)) cu += `<g class="${muc === 'vd' ? '' : 'gt-but'}" transform="translate(0 ${L}) rotate(${k ? 35 : -35})"><path class="gt-s-toi" d="M0 4 V-16" stroke-width="4.5" stroke-linecap="round"/><path class="gt-s-vang" d="M0 -16 V-20" stroke-width="4.5" stroke-linecap="round"/></g>`
    return `<g class="gt-tay gt-tay-${k ? 'p' : 't'}" transform="translate(${sx} ${sy})"><g class="x"><g class="gt-vay">
<path class="gt-sd" d="M0 0 V${L}" stroke-width="16" stroke-linecap="round"/><path class="gt-sc" d="M0 0 V${L}" stroke-width="10" stroke-linecap="round"/>${cu}</g></g></g>`
  }
  const tren = c.dinh, hx = xR + rx + 18, hy = ey - ry - 16
  const hieu = `<g class="gt-hieu">
${([[30, ey - 4, 1.1], [170, ey - 20, 0.9], [152, tren + 6, 0.7], [46, tren + 14, 0.65]] as const).map(([x, y, s], i) => `<g class="gt-sao" style="transform-origin:${x}px ${y}px">${lapLanh(x, y, s, i % 2 ? 'gt-f-vang' : 'gt-f-vang2')}</g>`).join('')}
${(['tin', 'sai', 'dung', 'vang', 'tin', 'cy', 'dung', 'sai'] as const).map((l, i) => `<g class="gt-giay" transform="translate(100 ${ey})"><g>${lucGiac(6 + (i % 3), `gt-f-${l}`)}</g></g>`).join('')}
<path class="gt-giot gt-f-giot" d="M${xR + rx + 10} ${ey - ry - 4} Q${xR + rx + 18} ${ey - ry + 8} ${xR + rx + 10} ${ey - ry + 14} Q${xR + rx + 2} ${ey - ry + 8} ${xR + rx + 10} ${ey - ry - 4}Z"/>
${([[0, 0, 7], [9, -8, 5.5], [2, -15, 4]] as const).map(([x, y, r]) => `<circle class="gt-hoi gt-f-hoi" cx="${mx + 20 + x}" cy="${myy - 6 + y}" r="${r}" style="transform-origin:${mx + 20 + x}px ${myy - 6 + y}px"/>`).join('')}
<g class="gt-bq" style="transform-origin:${hx}px ${hy + 12}px"><g transform="translate(${hx} ${hy})">${bongLoi('?')}</g></g>
<g class="gt-bc" style="transform-origin:${hx}px ${hy + 12}px"><g transform="translate(${hx} ${hy})">${bongLoi('!')}</g></g>
<g class="gt-loe" style="transform-origin:${xR + 13}px ${ey - 13}px">${lapLanh(xR + 13, ey - 13, 0.8, 'gt-ft')}</g></g>`
  const chan = c.chan.map(([x, y], k) => `<ellipse class="gt-chan${k} gt-fd" cx="${x}" cy="${y}" rx="13" ry="8" style="transform-origin:${x - 9}px ${y + 5}px"/>`).join('')
  return `<svg class="gtv" data-muc="${muc}" xmlns="http://www.w3.org/2000/svg" viewBox="-10 -26 220 264" aria-hidden="true" focusable="false" style="--h:${ry * 2}px">
<defs><clipPath id="${id}-t">${c.hinh}</clipPath></defs>
<ellipse class="gt-bong" cx="100" cy="226" rx="56" ry="8"/>
<g class="gt-nhay"><g class="gt-nghieng"><g class="gt-lac"><g class="gt-tho">
${chan}${c.sau ?? ''}
<g class="gt-fd gt-sd" stroke-width="7" stroke-linejoin="round">${c.hinh}</g>
<g clip-path="url(#${id}-t)"><rect class="gt-fk" x="0" y="-20" width="200" height="260"/>
<path class="gt-fc" d="M0 ${m} Q25 ${m - 6} 50 ${m} T100 ${m} T150 ${m} T200 ${m} V240 H0 Z"/>
<path class="gt-ss" d="M0 ${m} Q25 ${m - 6} 50 ${m} T100 ${m} T150 ${m} T200 ${m}" fill="none" stroke-width="5"/>${c.long ?? ''}
<rect class="gt-f-toi" x="128" y="-20" width="80" height="260" opacity=".08"/><rect class="gt-fd" x="0" y="202" width="200" height="40" opacity=".35"/>
${c.sang}</g>${c.dau ?? ''}
<g class="gt-mat"><g class="gt-gat">
${c.ma ? c.ma.map(([x, y]) => `<ellipse class="gt-f-ma" cx="${x}" cy="${y}" rx="7.5" ry="4.8"/>`).join('') : ''}
${mat(xL, 0)}${mat(xR, 1)}${may(xL, 't')}${may(xR, 'p')}${c.mat2 ? c.mat2(c) : ''}
<g transform="translate(${mx} ${myy})">${Object.entries(MIENG).map(([k, s]) => `<g data-m="${k}">${s}</g>`).join('')}</g>
</g></g>
${tay(1)}${tay(0)}
</g></g></g></g>${hieu}</svg>`
}

// ─────────────────────────────── TƯ THẾ TAY (góc quanh vai; dương = theo chiều kim đồng hồ) ───────────────────────────────
const DO = 180 / Math.PI
const huong = (sx: number, sy: number, x: number, y: number) => Math.atan2(-(x - sx), y - sy) * DO
export function gocTay(muc: MucGT, ten: string): [number, number] {
  const c = NV_GT[muc], [[a, b], [p, q]] = c.vai, [, xR, ey] = c.mat
  switch (ten) {
    case 'khoanh': return [-96, 84]
    case 'xiu': return [7, -7]
    case 'gio': return [148, -148]
    case 'vo': { const v = huong(a, b, 99, c.mieng[1] + 20); return [v, -v] }
    case 'dong-ho': return [huong(a, b, 97, ey + c.r[1] + 6), muc === 'vd' ? 52 : muc === 'vdc' ? 80 : c.tha[1]]
    case 'day-kinh': return [muc === 'vdc' ? -100 : c.tha[0], huong(p, q, xR + 14, ey + 4)]
    case 'ghi': return [-55, huong(p, q, 98, b + 10)]
    case 'cam-bang': return [c.tha[0], 52]
    case 'go-but': return [huong(a, b, 98, b + 22), 52]
    case 'lac-ngon': return [muc === 'vdc' ? -100 : c.tha[0], 166]
    default: return c.tha
  }
}

// ─────────────────────────────── TÍNH CÁCH: nét mặt nền + kịch bản từng trạng thái ───────────────────────────────
export type Buoc = { tay?: string; mat?: 'mo' | 'cuoi' | 'nham'; mieng?: string; mi?: number; duoi?: number; may?: number; mayY?: number; may2?: number; nx?: number; ny?: number; vong?: string[]; dong?: string[]; fx?: string[]; ms?: number }
const NEN: Record<MucGT, Buoc> = {
  nb: { tay: 'tha', mi: 0.1, may: 3, mieng: 'thang' },
  th: { tay: 'tha', mi: 0.2, may: 9, mieng: 'thang' },
  vd: { tay: 'cam-bang', mi: 0.24, may: 12, mieng: 'mim' },
  vdc: { tay: 'khoanh', mi: 0.36, may: 17, mayY: 2, mieng: 'mim' },
}
export function kichBan(muc: MucGT, tt: TrangThaiGT): Buoc[] {
  const n = NEN[muc], k = THU_TU_GT.indexOf(muc), nMay = n.may ?? 0, nMi = n.mi ?? 0
  const B = (o: Buoc): Buoc => ({ ...n, ...o })
  const cho: Buoc = ({ nb: { tay: 'tha', vong: ['go-chan'] }, th: { tay: 'khoanh', vong: ['go-ngon'] }, vd: { tay: 'go-but', vong: ['go-but'] }, vdc: { tay: 'khoanh', vong: ['go-ngon', 'go-chan'] } } as Record<MucGT, Buoc>)[muc]
  switch (tt) {
    case 'doc': return [B({ mieng: 'noi', nx: 0.85, ny: -0.25, mi: nMi * 0.5, ms: 1900 }), B({})]
    case 'cho': return [B({ nx: 0, ny: 0.1, mi: nMi + 0.08, may: nMay + 3, ...cho })]
    case 'soi': return [B({ mi: 0.48 + k * 0.03, duoi: 0.24, may: nMay + 8, mayY: 2, dong: ['cui'], fx: k < 2 ? ['bq'] : k === 3 ? ['loe'] : [] })]
    case 'dong-ho': return [B({ tay: 'dong-ho', nx: -0.1, ny: 1, mi: 0.12, may: k ? nMay : -4, ms: 1500 }), B({ nx: 0, ny: 0, mi: nMi + 0.1, may: nMay + 6, mieng: k > 1 ? 'xi' : n.mieng, ...cho })]
    case 'nghi-ngo': return [B({ mi: 0.5, duoi: 0.08, may2: -7, nx: 0.95, ny: 0, mieng: k ? 'mim' : 'thang', dong: ['nghieng'], fx: k > 1 ? ['bc'] : [] })]
    case 'nop': return [B({ mi: Math.max(0, nMi - 0.1), may: nMay - 4, mayY: -2, dong: ['cui'] })]
    case 'chua-tinh':
      if (muc === 'vd') return [B({ tay: 'go-but', mieng: 'xi', mi: 0.4, may: 16, dong: ['cheo', 'lac:2:5'], fx: ['bc'], ms: 1600 }), B({ mieng: 'mim' })]
      if (muc === 'vdc') return [B({ tay: 'day-kinh', mieng: 'xi', mi: 0.45, may: 22, dong: ['kinh'], fx: ['bc'], ms: 700 }), B({ tay: 'ghi', vong: ['ghi'], nx: -0.2, ny: 1, may: 20, ms: 1600 }), B({})]
      return [B({ tay: 'lac-ngon', vong: ['lac-ngon'], mieng: 'xi', mi: 0.36, may: nMay + 6, dong: ['lac:2:4'], fx: ['bc'], ms: 1700 }), B({})]
    case 'dung':
      if (muc === 'nb') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'gio', may: -6, dong: ['nhay:2:20'], fx: ['sao'], ms: 1600 }), B({ mieng: 'cuoi-nhe', mi: 0.06, may: 0, ms: 900 }), B({})]
      if (muc === 'th') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'vo', may: -2, dong: ['vo:3', 'nhay:1:8'], ms: 1300 }), B({ mieng: 'cuoi-nhe', may: 4, ms: 900 }), B({})]
      if (muc === 'vd') return [B({ tay: 'go-but', mieng: 'cuoi-nhe', mi: 0.1, may: 2, dong: ['gat', 'tick'], ms: 1500 }), B({ mieng: 'cuoi-nhe', ms: 700 }), B({})]
      return [B({ mieng: 'nhech', mi: 0.3, may: 8, may2: -6, dong: ['gat'], ms: 900 }), B({ tay: 'vo', mieng: 'nhech', may2: -6, dong: ['vo:2'], ms: 800 }), B({ mieng: 'nhech', ms: 700 }), B({})]
    case 'sai':
      if (muc === 'nb') return [B({ tay: 'xiu', mieng: 'xi', mi: 0.3, may: -13, ny: 0.5, nx: 0, dong: ['xiu', 'lac:2:4'], fx: ['giot'], ms: 1700 }), B({ mieng: 'xi', may: -6, ms: 700 }), B({})]
      if (muc === 'th') return [B({ tay: 'khoanh', mieng: 'xi', mi: 0.38, may: -5, dong: ['lac:3:6'], ms: 1000 }), B({ tay: 'khoanh', mat: 'nham', mieng: 'o', may: -8, dong: ['thodai'], fx: ['hoi'], ms: 1200 }), B({ mieng: 'xi', ms: 600 }), B({})]
      if (muc === 'vd') return [B({ tay: 'go-but', mieng: 'xi', mi: 0.4, may: 16, dong: ['cheo', 'lac:3:6'], ms: 1300 }), B({ mat: 'nham', mieng: 'o', may: 10, dong: ['thodai'], fx: ['hoi'], ms: 1100 }), B({ mieng: 'xi' })]
      return [B({ tay: 'day-kinh', mieng: 'xi', mi: 0.45, may: 23, dong: ['kinh'], ms: 750 }), B({ tay: 'ghi', vong: ['ghi'], nx: -0.2, ny: 1, mieng: 'mim', may: 21, ms: 1700 }), B({ mat: 'nham', mieng: 'o', may: 14, dong: ['thodai', 'lac:2:4'], fx: ['hoi'], ms: 1200 }), B({ mieng: 'xi' })]
    case 'combo':
      if (muc === 'nb') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'gio', may: -6, dong: ['nhay:3:24', 'mu'], fx: ['sao', 'giay'], ms: 1900 }), B({ mieng: 'cuoi-nhe', may: 0 })]
      if (muc === 'th') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'gio', may: -4, dong: ['nhay:2:14'], fx: ['sao'], ms: 1200 }), B({ mat: 'cuoi', mieng: 'cuoi', tay: 'vo', dong: ['vo:3'], ms: 900 }), B({ mieng: 'cuoi-nhe' })]
      if (muc === 'vd') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'gio', may: -2, dong: ['nhay:1:12', 'tick'], fx: ['sao'], ms: 1400 }), B({ mieng: 'cuoi-nhe' })]
      return [B({ mieng: 'cuoi-nhe', mi: 0.22, may: 4, tay: 'vo', dong: ['gat', 'vo:3'], ms: 1200 }), B({ mieng: 'nhech', may2: -6, dong: ['mu'], ms: 1000 }), B({})]
    case 'xong':
      if (muc === 'nb') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'gio', may: -6, dong: ['nhay:4:24', 'mu'], fx: ['giay', 'sao'], ms: 2400 }), B({ mieng: 'cuoi-nhe', may: 0 })]
      if (muc === 'th') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'vo', may: -4, dong: ['vo:5', 'nhay:2:12'], fx: ['giay'], ms: 2000 }), B({ mieng: 'cuoi-nhe' })]
      if (muc === 'vd') return [B({ mat: 'cuoi', mieng: 'cuoi', tay: 'gio', may: -2, dong: ['nhay:2:16', 'tick'], fx: ['giay', 'sao'], ms: 1900 }), B({ mieng: 'cuoi-nhe' })]
      return [B({ mieng: 'cuoi', mi: 0.15, may: 2, tay: 'vo', dong: ['vo:3', 'mu', 'nhay:1:8'], fx: ['giay'], ms: 2100 }), B({ mieng: 'nhech', may2: -6 })]
    default: return [B({})]
  }
}

// ─────────────────────────────── ĐỘNG TÁC (Web Animations API) ───────────────────────────────
const NAY = 'cubic-bezier(.34,1.56,.64,1)' // nảy mềm kiểu Duolingo
type KF = Keyframe[]
type Opt = KeyframeAnimationOptions & { goc?: string; giu?: boolean; theo?: boolean }
export interface GiamThi {
  readonly muc: MucGT
  readonly svg: SVGSVGElement
  datTrangThai(ten: TrangThaiGT, o?: { buoc?: number; xong?: () => void }): GiamThi
  trangThai(): TrangThaiGT
  nhin(nx: number, ny: number): GiamThi
  nhinVao(el: Element | null | undefined): GiamThi
  noi(chu: string | null | undefined, o?: { giu?: number }): GiamThi
  tamDung(dung: boolean): void
  huy(): void
}

export function taoGiamThi(khung: HTMLElement, o: { muc: MucGT; tinh?: boolean; xam?: boolean; mo?: boolean; trangThai?: TrangThaiGT; buoc?: number; /** chỗ đặt bong bóng càu nhàu (mặc định: trong khung, nổi trên đầu) */ loiVao?: HTMLElement | null }): GiamThi {
  const muc = o.muc, c = NV_GT[muc]
  // Lớp «thân thở» là phần tử HTML (transform trên lớp riêng, máy dựng bằng GPU, không vẽ lại SVG); bong bóng càu nhàu là anh em của nó.
  khung.innerHTML = `<div class="gt-tho-o">${veGiamThi(muc)}</div>`
  const tho = khung.firstElementChild as HTMLElement, svg = tho.firstElementChild as unknown as SVGSVGElement
  const tinh = !!o.tinh
  const giam = !tinh && typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  if (tinh) khung.classList.add('gt-tinh')
  if (o.xam) khung.classList.add('gt-xam')
  if (o.mo) khung.classList.add('gt-mo-nhat')
  const q = <T extends Element = SVGGElement>(s: string) => svg.querySelector<T>(s)
  const qa = (s: string) => Array.from(svg.querySelectorAll<SVGElement>(s))
  let hen: number[] = [], loiHen: number[] = [], vong: Animation[] = [], giu: Animation[] = [], mot: Animation[] = []
  let tt: TrangThaiGT = 'yen', mat = 'mo', buocNay: Buoc | null = null, chop = 0, dung = false
  const dangChay = new WeakMap<Element, Animation>()
  // Chạy một hoạt ảnh trên phần tử; phần tử đang có hoạt ảnh của ta ⇒ lấy transform ĐANG HIỆN làm khung đầu rồi mới huỷ cái cũ.
  const a = (el: Element | null, kf: KF, opt: Opt = {}): Animation | null => {
    if (!el || giam || !(el as HTMLElement).animate) return null
    if (opt.goc) (el as SVGElement).style.transformOrigin = opt.goc
    const cu = dangChay.get(el)
    if (cu && cu.playState !== 'finished' && cu.playState !== 'idle' && kf[0] && 'transform' in kf[0]) {
      const hien = getComputedStyle(el).transform
      kf = [{ ...kf[0], transform: hien === 'none' ? 'none' : hien }, ...kf.slice(1)]
      cu.cancel()
    }
    const { goc: _g, giu: giuLai, theo: _t, ...con } = opt
    const an = (el as HTMLElement).animate(kf, { duration: 600, easing: 'ease-out', ...con })
    dangChay.set(el, an)
    if (tinh) { an.pause(); an.currentTime = Number(con.delay ?? 0) + Number(con.duration ?? 600) * (giuLai ? 1 : 0.42) - 1 }
    else if (dung) an.pause()
    ;(giuLai ? giu : mot).push(an)
    if (mot.length > 40) mot = mot.filter((x) => x.playState === 'running' || x.playState === 'paused')
    return an
  }
  // Theo đà (follow-through): kính / mũ / còi / bảng kẹp lắc theo sau thân một nhịp.
  const theoDa = (tre = 120, bien = 6) => {
    for (const el of qa('.gt-kinh, .gt-mu, .gt-coi, .gt-theo')) a(el, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${-bien}deg)`, offset: 0.3 }, { transform: `rotate(${bien * 0.6}deg)`, offset: 0.65 }, { transform: 'rotate(0deg)' }], { duration: 560, delay: tre, easing: 'ease-out' })
  }
  const nhayKf = (h: number): KF => [
    { transform: 'translateY(0) scale(1)', easing: 'ease-out' },
    { transform: 'translateY(3px) scale(1.08,.9)', offset: 0.16, easing: 'cubic-bezier(.2,.8,.3,1)' }, // lấy đà
    { transform: `translateY(-${h}px) scale(.95,1.07)`, offset: 0.5, easing: 'cubic-bezier(.5,0,.8,.6)' }, // vươn
    { transform: 'translateY(0) scale(1.08,.92)', offset: 0.8, easing: NAY }, // đáp, bẹt
    { transform: 'translateY(0) scale(1)' },
  ]
  const DONG: Record<string, (...t: string[]) => void> = {
    nhay: (n = '1', h = '18') => { a(q('.gt-nhay'), nhayKf(+h), { duration: 560, iterations: +n }); a(q('.gt-bong'), [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.16 }, { transform: 'scale(.72)', offset: 0.5 }, { transform: 'scale(1)' }], { duration: 560, iterations: +n, goc: '100px 226px' }); theoDa(200, 8) },
    lac: (n = '3', d = '6') => a(q('.gt-lac'), [{ transform: 'rotate(0deg)' }, { transform: `rotate(${d}deg)`, offset: 0.25 }, { transform: `rotate(-${d}deg)`, offset: 0.75 }, { transform: 'rotate(0deg)' }], { duration: 440, iterations: +n, delay: 80, easing: 'ease-in-out', goc: '100px 170px' }),
    gat: () => { a(q('.gt-gat'), [{ transform: 'translateY(0)' }, { transform: 'translateY(7px) scale(1.02,.97)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 560, easing: 'ease-in-out' }); theoDa(160, 4) },
    vo: (n = '3') => { const kf = (s: number): KF => [{ transform: `rotate(${s * 26}deg)` }, { transform: 'rotate(0deg)', offset: 0.5 }, { transform: `rotate(${s * 26}deg)` }]
      a(q('.gt-tay-t .gt-vay'), kf(-1), { duration: 260, iterations: +n, delay: 150, easing: 'ease-in-out' }); a(q('.gt-tay-p .gt-vay'), kf(1), { duration: 260, iterations: +n, delay: 150, easing: 'ease-in-out' }) },
    thodai: () => { a(q('.gt-nhay'), [{ transform: 'none' }, { transform: 'translateY(-4px) scale(1,1.03)', offset: 0.35 }, { transform: 'translateY(3px) scale(1.03,.95)', offset: 0.7 }, { transform: 'none' }], { duration: 1200, easing: 'ease-in-out' }); theoDa(420, 3) },
    xiu: () => a(q('.gt-nhay'), [{ transform: 'none' }, { transform: 'translateY(4px) scale(1.03,.95)' }], { duration: 500, fill: 'forwards', easing: 'ease-out', giu: true }),
    cui: () => a(q('.gt-gat'), [{ transform: 'none' }, { transform: 'translateY(3px) scale(1.04)' }], { duration: 420, fill: 'forwards', easing: 'ease-out', giu: true }),
    nghieng: () => a(q('.gt-lac'), [{ transform: 'none' }, { transform: 'rotate(-4deg)' }], { duration: 420, fill: 'forwards', easing: NAY, goc: '100px 224px', giu: true }),
    kinh: () => a(q('.gt-kinh'), [{ transform: 'none' }, { transform: 'translateY(-5px) scale(1.08)', offset: 0.5 }, { transform: 'none' }], { duration: 440, delay: 300, easing: NAY }),
    mu: () => a(q('.gt-mu'), [{ transform: 'none' }, { transform: 'translate(6px,-16px) rotate(-14deg)', offset: 0.4, easing: 'ease-in-out' }, { transform: 'translate(6px,-16px) rotate(-14deg)', offset: 0.6, easing: NAY }, { transform: 'none' }], { duration: 1000 }),
    tick: () => a(q('.gt-tick'), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }], { duration: 380, delay: 260, fill: 'forwards', easing: NAY, giu: true }),
    cheo: () => a(q('.gt-cheo'), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }], { duration: 380, delay: 260, fill: 'forwards', easing: NAY, giu: true }),
  }
  const VONG: Record<string, () => Animation | null> = {
    'go-chan': () => a(q('.gt-chan1'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-16deg)', offset: 0.3 }, { transform: 'rotate(0deg)', offset: 0.6 }], { duration: 560, iterations: Infinity, easing: 'ease-in-out' }),
    'go-ngon': () => a(q('.gt-tay-t .gt-vay'), [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1].map((offset, i) => ({ offset, transform: `rotate(${i % 2 && i < 7 ? -8 : 0}deg)` })), { duration: 1500, iterations: Infinity }),
    'go-but': () => a(q('.gt-tay-t .gt-vay'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(9deg)', offset: 0.5 }, { transform: 'rotate(0deg)' }], { duration: 420, iterations: Infinity, easing: 'ease-in-out' }),
    ghi: () => a(q('.gt-tay-p .gt-vay'), [0, 6, -2, 7, -1, 0].map((d, i, m) => ({ offset: i / (m.length - 1), transform: `rotate(${d}deg) translateY(${i % 2 ? 2 : 0}px)` })), { duration: 520, iterations: Infinity }),
    'lac-ngon': () => a(q('.gt-tay-p .gt-vay'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(14deg)', offset: 0.25 }, { transform: 'rotate(-12deg)', offset: 0.75 }, { transform: 'rotate(0deg)' }], { duration: 520, iterations: Infinity, easing: 'ease-in-out' }),
  }
  const FX: Record<string, () => void> = {
    sao: () => qa('.gt-sao').forEach((e, i) => a(e, [{ opacity: 0, transform: 'scale(.2) rotate(0deg)' }, { opacity: 1, transform: 'scale(1.15) rotate(45deg)', offset: 0.4 }, { opacity: 0, transform: 'scale(.6) rotate(90deg)' }], { duration: 900, delay: i * 140, iterations: 2 })),
    giay: () => qa('.gt-giay>g').forEach((e, i) => { const t = (i / 8) * Math.PI * 2 - Math.PI / 2, r = 70 + (i % 3) * 18
      a(e, [{ opacity: 1, transform: 'translate(0px,0px) rotate(0deg) scale(.4)' }, { opacity: 1, transform: `translate(${Math.cos(t) * r}px,${Math.sin(t) * r * 0.8 - 30}px) rotate(${180 + i * 40}deg) scale(1)`, offset: 0.55 }, { opacity: 0, transform: `translate(${Math.cos(t) * r * 1.1}px,${Math.sin(t) * r * 0.8 + 30}px) rotate(${300 + i * 40}deg) scale(.8)` }], { duration: 1500, delay: (i % 3) * 60, easing: 'cubic-bezier(.2,.7,.4,1)' }) }),
    giot: () => a(q('.gt-giot'), [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'translateY(0)', offset: 0.2 }, { opacity: 1, transform: 'translateY(6px)', offset: 0.8 }, { opacity: 0, transform: 'translateY(12px)' }], { duration: 1600 }),
    hoi: () => qa('.gt-hoi').forEach((e, i) => a(e, [{ opacity: 0, transform: 'translate(0px,0px) scale(.4)' }, { opacity: 0.95, transform: 'translate(4px,-10px) scale(1)', offset: 0.3 }, { opacity: 0, transform: 'translate(12px,-34px) scale(1.5)' }], { duration: 1300, delay: 150 + i * 120, easing: 'ease-out' })),
    bq: () => { a(q('.gt-bq'), [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.12)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }], { duration: 380, fill: 'forwards', easing: NAY, giu: true }) },
    bc: () => { a(q('.gt-bc'), [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.12 }, { opacity: 1, transform: 'scale(1)', offset: 0.2 }, { opacity: 1, transform: 'scale(1)', offset: 0.85 }, { opacity: 0, transform: 'scale(.6)' }], { duration: 1900 }) },
    loe: () => { a(q('.gt-loe'), [{ opacity: 0, transform: 'scale(0) rotate(0deg)' }, { opacity: 1, transform: 'scale(1.2) rotate(60deg)', offset: 0.5 }, { opacity: 0, transform: 'scale(0) rotate(120deg)' }], { duration: 700, delay: 200, iterations: 2 }) },
  }

  // ── mắt dõi theo: lerp trên rAF (tự dừng khi tới đích) ──
  let nhinXY: [number, number] = [0, 0], dangNhin: [number, number] = [0, 0], raf = 0, tLan = 0
  // Đặt giá trị THẲNG lên đúng phần tử cần (không đặt biến/thuộc tính ở gốc SVG: đổi ở gốc ⇒ tính lại kiểu cả cây vài trăm phần tử mỗi khung).
  type El = SVGElement | null
  const E = {
    con: qa('.gt-con'), mat: q('.gt-mat') as El, nghieng: q('.gt-nghieng') as El, mi: qa('.gt-mi'), mi2: qa('.gt-mi2'), may: qa('.gt-may-t, .gt-may-p'),
    mo: qa('.gt-mo'), cuoi: qa('.gt-cuoi'), nham: qa('.gt-nham'), mieng: qa('[data-m]'), dongho: q('.gt-dongho') as El, so: q('.gt-so') as El, but: q('.gt-but') as El,
    tayT: q('.gt-tay-t') as El, tayP: q('.gt-tay-p') as El,
  }
  const daDat = new WeakMap<Element, Record<string, string>>()
  const datBien = (els: El | El[], k: string, v: string) => { for (const e of ([] as El[]).concat(els)) { if (!e) continue; const m = daDat.get(e) ?? {}; if (m[k] === v) continue; m[k] = v; daDat.set(e, m); e.style.setProperty(k, v) } }
  const lop = (e: El, ten: string, bat: boolean) => e?.classList.toggle(ten, bat)
  const apNhin = (x: number, y: number, lean: number) => {
    const t = `translate(${(x * 4.6).toFixed(2)}px,${(y * 4.2).toFixed(2)}px)`
    for (const e of E.con) e.style.transform = t
    if (E.mat) E.mat.style.transform = `translate(${(x * 2.6).toFixed(2)}px,${(y * 2).toFixed(2)}px)`
    if (E.nghieng) E.nghieng.style.transform = `rotate(${lean.toFixed(2)}deg)`
  }
  const dichNhin = (): [number, number, number] => { const s = buocNay ?? {}; const x = s.nx ?? nhinXY[0], y = s.ny ?? nhinXY[1]; return [x, y, s.nx == null ? x * 2.5 : 0] }
  const buocNhin = (t: number) => {
    raf = 0
    const [x, y, lean] = dichNhin(), dt = tLan ? Math.min(64, t - tLan) : 16
    tLan = t
    const k = 1 - Math.exp(-dt / 70)
    dangNhin = [dangNhin[0] + (x - dangNhin[0]) * k, dangNhin[1] + (y - dangNhin[1]) * k]
    const xong = Math.abs(x - dangNhin[0]) < 0.004 && Math.abs(y - dangNhin[1]) < 0.004
    if (xong) dangNhin = [x, y]
    apNhin(dangNhin[0], dangNhin[1], lean * (xong ? 1 : Math.min(1, Math.abs(dangNhin[0] / (x || 1)))))
    if (!xong && !dung) raf = requestAnimationFrame(buocNhin); else tLan = 0
  }
  const nhinAp = () => {
    if (tinh || giam || dung) { const [x, y, l] = dichNhin(); dangNhin = [x, y]; apNhin(x, y, l); return }
    if (!raf) raf = requestAnimationFrame(buocNhin)
  }

  const ap = (s: Buoc) => {
    buocNay = s
    mat = s.mat ?? 'mo'
    for (const e of E.mo) lop(e, 'tat', mat !== 'mo')
    for (const e of E.cuoi) lop(e, 'on', mat === 'cuoi')
    for (const e of E.nham) lop(e, 'on', mat === 'nham')
    const mieng = s.mieng ?? 'thang'
    for (const e of E.mieng) { const k = e.getAttribute('data-m'); lop(e, 'on', k === mieng || (mieng === 'noi' && k === 'thang')); lop(e, 'noi', mieng === 'noi' && k === 'o') }
    const tay = s.tay ?? 'tha'
    lop(E.dongho, 'on', tay === 'dong-ho'); lop(E.so, 'on', tay === 'ghi'); lop(E.but, 'on', tay === 'ghi')
    datBien(E.mi, '--mi', String(s.mi ?? 0)); datBien(E.mi2, '--duoi', String(s.duoi ?? 0))
    datBien(E.may, '--may', (s.may ?? 0) + 'deg'); datBien(E.may, '--mayY', (s.mayY ?? 0) + 'px'); datBien(E.may, '--may2', (s.may2 ?? 0) + 'px')
    const [t, p] = gocTay(muc, tay)
    datBien(E.tayT, '--g', t + 'deg'); datBien(E.tayP, '--g', p + 'deg')
    nhinAp()
    vong.forEach((x) => x.cancel()); vong = []
    for (const v of s.vong ?? []) { const an = VONG[v]?.(); if (an) { mot = mot.filter((x) => x !== an); vong.push(an); if (tinh) an.currentTime = 140 } }
    for (const d of s.dong ?? []) { const [ten, ...ts] = d.split(':'); DONG[ten!]?.(...ts) }
    for (const f of s.fx ?? []) FX[f]?.()
  }
  const huyHen = () => { hen.forEach((t) => clearTimeout(t)); hen = [] }
  const g: GiamThi = {
    muc, svg,
    datTrangThai(ten, oo = {}) {
      tt = ten; huyHen()
      giu.forEach((x) => x.cancel()); giu = []
      const ds = kichBan(muc, ten)
      if (oo.buoc != null) { ap(ds[Math.min(oo.buoc, ds.length - 1)]!); return g }
      let i = 0
      const chay = () => {
        if (i > 0) { giu.forEach((x) => x.cancel()); giu = [] }
        const s = ds[i]!
        ap(s)
        if (i < ds.length - 1) hen.push(window.setTimeout(() => { i++; chay() }, s.ms ?? 1000))
        else if (oo.xong) hen.push(window.setTimeout(oo.xong, s.ms ?? 0))
      }
      chay(); return g
    },
    trangThai: () => tt,
    nhin(nx, ny) { nhinXY = [Math.max(-1, Math.min(1, +nx || 0)), Math.max(-1, Math.min(1, +ny || 0))]; nhinAp(); return g },
    nhinVao(el) {
      if (!el) return g.nhin(0, 0)
      const r1 = svg.getBoundingClientRect(), r2 = el.getBoundingClientRect()
      const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2), dy = r2.top + r2.height / 2 - (r1.top + r1.height * 0.5)
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 120)
      return g.nhin((dx / d) * k, (dy / d) * k)
    },
    noi(chu, oo = {}) {
      loiHen.forEach((t) => { clearTimeout(t); clearInterval(t) }); loiHen = []
      const vao = o.loiVao ?? khung
      vao.querySelectorAll(':scope > .gt-loi').forEach((e) => e.remove())
      if (!chu) return g
      const el = document.createElement('div'); el.className = 'gt-loi'; el.setAttribute('role', 'status'); el.dataset.muc = muc
      const da = document.createElement('span'), con = document.createElement('span'); con.className = 'an'
      el.append(da, con)
      // mũi nhọn chĩa xuống đầu giám thị (đầu ở giữa bề ngang khung vẽ)
      const lech = vao === khung ? 0 : khung.getBoundingClientRect().left - vao.getBoundingClientRect().left
      el.style.setProperty('--gt-loi-duoi', Math.max(14, lech + khung.clientWidth * 0.5 - 7).toFixed(1) + 'px') // tâm mũi nhọn (14 px) = giữa đầu
      vao.appendChild(el)
      if (tinh || giam || dung) { da.textContent = chu; if (tinh) return g } else con.textContent = chu
      if (typeof el.animate === 'function') el.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.05)', offset: 0.65 }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: NAY })
      if (!giam && !dung) { let i = 0; const go = window.setInterval(() => { i++; da.textContent = chu.slice(0, i); con.textContent = chu.slice(i); if (i >= chu.length) clearInterval(go) }, 34); loiHen.push(go) }
      loiHen.push(window.setTimeout(() => { if (typeof el.animate !== 'function') { el.remove(); return } const an = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) scale(.96)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' }); an.onfinish = () => el.remove() }, chu.length * 34 + (oo.giu ?? 1900)))
      return g
    },
    tamDung(d) {
      if (d === dung || tinh) return
      dung = d
      khung.classList.toggle('gt-dung', d)
      for (const an of svg.getAnimations ? svg.getAnimations({ subtree: true }) : []) { if (d) an.pause(); else if (an.playState === 'paused') an.play() }
      if (d) { if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(chop) } else { nhinAp(); chopMat() }
    },
    huy() { huyHen(); o.loiVao?.querySelectorAll(':scope > .gt-loi').forEach((e) => e.remove()); loiHen.forEach((t) => { clearTimeout(t); clearInterval(t) }); clearTimeout(chop); if (raf) cancelAnimationFrame(raf); [...vong, ...giu, ...mot].forEach((x) => x.cancel()); khung.innerHTML = ''; khung.classList.remove('gt-tinh', 'gt-xam', 'gt-mo-nhat', 'gt-dung') },
  }
  // Chớp mắt ngẫu nhiên 2,5–6 giây, thỉnh thoảng chớp đúp.
  const chopMat = () => {
    clearTimeout(chop)
    if (tinh || giam || dung) return
    chop = window.setTimeout(() => {
      if (mat === 'mo' && !document.hidden) {
        const kep = Math.random() < 0.18
        qa('.gt-chop').forEach((e) => e.animate?.(kep
          ? [{ transform: 'none' }, { transform: `translateY(${c.r[1] * 2}px)`, offset: 0.22 }, { transform: 'none', offset: 0.45 }, { transform: `translateY(${c.r[1] * 2}px)`, offset: 0.67 }, { transform: 'none' }]
          : [{ transform: 'none' }, { transform: `translateY(${c.r[1] * 2}px)`, offset: 0.45 }, { transform: 'none' }], { duration: kep ? 360 : 180, easing: 'ease-in-out' }))
      }
      chopMat()
    }, 2500 + Math.random() * 3500)
  }
  chopMat()
  g.datTrangThai(o.trangThai ?? 'yen', tinh ? { buoc: o.buoc ?? 0 } : {})
  return g
}

// ─────────────────────────────── VIỀN BONG BÓNG CHỮ L (đề dài) ───────────────────────────────
/** Khuyết góc trái trên theo cỡ giám thị — CÙNG công thức với giam-thi.css (`--gt-kw / --gt-kh / --gt-kd`). */
export const khuyetL = (nvw: number) => ({ kw: nvw * 0.66 - 2, kh: nvw * 1.1 + 4, kd: nvw * 0.38 })
/** Đường viền bong bóng chữ L: hộp w×h, khuyết kw×kh ở góc trái trên; bo R ở góc ngoài, r ở góc trong; mũi nhọn ở cạnh khuyết, cao kd, chĩa trái. */
export function duongL(w: number, h: number, kw: number, kh: number, kd: number, R = 18, r = 16): string {
  const b = 1, n = (x: number) => Math.round(x * 10) / 10
  R = Math.max(4, Math.min(R, (w - kw) / 2, (h - kh) / 2, kh / 2)); r = Math.min(r, kw / 2, kh / 2)
  const dy = Math.max(R + 9, Math.min(kd, kh - r - 9))
  return [`M${n(kw + R)} ${b}`, `H${n(w - R)}`, `A${R} ${R} 0 0 1 ${n(w - b)} ${n(R)}`, `V${n(h - R)}`, `A${R} ${R} 0 0 1 ${n(w - R)} ${n(h - b)}`,
    `H${n(R)}`, `A${R} ${R} 0 0 1 ${b} ${n(h - R)}`, `V${n(kh + R)}`, `A${R} ${R} 0 0 1 ${n(R)} ${n(kh)}`, `H${n(kw - r)}`, `A${r} ${r} 0 0 0 ${n(kw)} ${n(kh - r)}`,
    `V${n(dy + 7)}`, `L${n(kw - 8)} ${n(dy)}`, `L${n(kw)} ${n(dy - 7)}`, `V${n(R)}`, `A${R} ${R} 0 0 1 ${n(kw + R)} ${b}`, 'Z'].join(' ')
}
