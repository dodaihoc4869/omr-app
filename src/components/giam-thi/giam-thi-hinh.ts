// HÌNH VẼ 4 GIÁM THỊ bản «sống động» (thầy duyệt 02/11, bản vẽ docs/ban-ve-giam-thi-moi-0211/giam-thi.html — chép NGUYÊN hình, chỉ đổi tên lớp
// sang gf-* / gn-* / gs-* để không đụng lớp CSS sẵn có của app). Đầu to, mắt to có đốm sáng, má hồng, nét bo tròn; giữ nhận diện từng người:
// Tí kính bảo hộ trên trán · Cô Cốc kính tròn, búi tóc · Chú Tam kính ôm mắt, tạp dề cam · Giáo sư Kíp kính nửa vầng trăng, tóc bạc búi cài bút chì.
// Khung SVG như bản cũ (-110 -240 220 254) ⇒ bố cục bong bóng đề / chữ L không đổi. Màu: lớp gf-* / gn-* / gs-* ⇒ biến --gm-* (giam-thi.css).
import type { MucGT } from './giam-thi-ve'

export type NhanRoi = 'nhinDe' | 'daoMat' | 'nghieng' | 'lac' | 'kinh' | 'nhun' | 'ngap' | 'nheo' | 'goBut'
export type NvGT4 = {
  lid: number; ma0: number; mieng: 'cuoi' | 'phang'; miengY: number; mayY: number; nhip: number; gang?: boolean
  /** Trọng số chọn động tác lúc đứng chờ (ngẫu nhiên có trọng số, không lặp liền). */
  nhanRoi: Partial<Record<NhanRoi, number>>
}
export const NV_GT4: Record<MucGT, NvGT4> = {
  nb: { lid: 0, ma0: -2, mieng: 'cuoi', miengY: -121, mayY: -171, nhip: 0.85, nhanRoi: { nhinDe: 3, daoMat: 2.6, nghieng: 3, lac: 3, kinh: 1.6, nhun: 2.2, ngap: 1.2 } },
  th: { lid: 0.06, ma0: 0, mieng: 'cuoi', miengY: -121, mayY: -172, nhip: 1, nhanRoi: { nhinDe: 3.4, daoMat: 2, nghieng: 2, lac: 2.6, kinh: 2.8, nheo: 0.7, ngap: 1 } },
  vd: { lid: 0.14, ma0: 3, mieng: 'phang', miengY: -114, mayY: -175, nhip: 1.1, gang: true, nhanRoi: { nhinDe: 3, daoMat: 2, nghieng: 1.2, goBut: 3.2, kinh: 2, nheo: 1.2, ngap: 1 } },
  vdc: { lid: 0.3, ma0: 4, mieng: 'phang', miengY: -120, mayY: -172, nhip: 1.25, nhanRoi: { nhinDe: 3, daoMat: 1.4, nghieng: 1, goBut: 2.6, kinh: 3, nheo: 2.4, ngap: 0.8 } },
}
/** Khung SVG (giống bản cũ) + tỉ lệ thu người trong nhóm + toạ độ mắt. */
export const VB = { x: -110, y: -240, w: 220, h: 254 }
export const TL = 0.93
export const MAT_Y = -147
export const MAT_X = 21

const DAU = 'M0,-206 C39,-206 61,-188 61,-153 C61,-120 42,-98 0,-98 C-42,-98 -61,-120 -61,-153 C-61,-188 -39,-206 0,-206Z'
const SAO = 'M0,-9 Q1.7,-1.7 9,0 Q1.7,1.7 0,9 Q-1.7,1.7 -9,0 Q-1.7,-1.7 0,-9Z'
export function veNguoi(k: MucGT, u: string): string {
  const n = NV_GT4[k]
  const giay = (s: number) => `<g transform="translate(${s * 11.5} 0) scale(${s} 1)"><path d="M-9,-11.5 C-3,-13 6,-11.5 10.5,-6.5 C13,-3.5 12.5,0 9.5,0 L-9,0 C-11.5,0 -12.5,-2 -12.5,-4.8 C-12.5,-8.4 -11.3,-10.8 -9,-11.5Z" class="gf-giay"/><path d="M-12.5,-3.4 L12.6,-3.4 C12.3,-1.2 11.2,0 9.5,0 L-9,0 C-11.2,0 -12.4,-1.2 -12.5,-3.4Z" class="gf-giay-s"/><ellipse cx="2" cy="-9" rx="4" ry="1.6" class="gf-trang" opacity=".45"/></g>`
  const ao = (hem: number) => `
    <path d="M-25,-104 C-34,-104 -39,-98 -40,-89 L-45,${hem - 9} C-46,${hem - 3} -42,${hem} -35,${hem} L35,${hem} C42,${hem} 46,${hem - 3} 45,${hem - 9} L40,-89 C39,-98 34,-104 25,-104Z" fill="url(#${u}ao)"/>
    <path d="M27,-103 C35,-102 39,-97 40,-89 L45,${hem - 9} C46,${hem - 3} 42,${hem} 35,${hem} L30,${hem} L33.5,-88 C33.5,-96 31,-101 27,-103Z" class="gf-ao-s" opacity=".5"/>`
  const ve = (hem: number) => `
    <path d="M-12.5,-105 L0,-79 L12.5,-105Z" class="gf-ao2"/>
    <path d="M-14.5,-105 L-1,-75 L-4.5,-58 L-22,-89 C-21,-97 -18.5,-103 -14.5,-105Z" class="gf-ao-l"/>
    <path d="M14.5,-105 L1,-75 L4.5,-58 L22,-89 C21,-97 18.5,-103 14.5,-105Z" class="gf-ao-l" opacity=".8"/>
    <path d="M0,-70 L0,${hem - 1}" class="gn gn-ao-d" stroke-width="2"/>
    <circle cx="-5.5" cy="-50" r="2.3" class="gf-ao-d"/><circle cx="-5.5" cy="-35" r="2.3" class="gf-ao-d"/>
    <rect x="18.5" y="-72" width="3.6" height="11" rx="1.8" class="gf-but-1"/><rect x="23.6" y="-70" width="3.6" height="9" rx="1.8" class="gf-but-2"/>
    <rect x="15" y="-64" width="16" height="12" rx="3.5" class="gf-ao-d" opacity=".6"/>`
  let than = '', tocSau = '', toc = '', kinh = '', ria = '', vat = '', them = ''
  if (k === 'nb') {
    than = ao(-21) + ve(-21)
    toc = `<path d="M-62,-146 C-67,-190 -37,-214 2,-214 C42,-214 67,-191 62,-148 C59,-160 52,-168 42,-172 C30,-180 12,-176 -2,-180 C-18,-184 -40,-178 -52,-163 C-57,-158 -60,-152 -62,-146Z" fill="url(#${u}toc)"/>
      <path d="M-6,-211 C-3,-229 18,-238 35,-228 C27,-226 23,-222 21,-216 C31,-220 42,-215 46,-206 C30,-210 14,-209 -6,-211Z" class="gf-toc"/>
      <path d="M-40,-196 Q-25,-207 -8,-208" class="gn gn-toc-l" stroke-width="4" opacity=".8"/>`
    kinh = `<path d="M-61,-178 Q0,-200 61,-178" class="gn gn-quai" stroke-width="7"/>
      <g transform="translate(-16 -190)"><rect x="-14" y="-10.5" width="28" height="21" rx="9.5" class="gf-kinh-v"/><rect x="-10" y="-6.8" width="20" height="13.6" rx="6.4" class="gf-kinh-t"/><path d="M-5.5,-3 L-1,-3" class="gn gn-trang" stroke-width="2.6"/></g>
      <g transform="translate(16 -190)"><rect x="-14" y="-10.5" width="28" height="21" rx="9.5" class="gf-kinh-v"/><rect x="-10" y="-6.8" width="20" height="13.6" rx="6.4" class="gf-kinh-t"/><path d="M-5.5,-3 L-1,-3" class="gn gn-trang" stroke-width="2.6"/></g>
      <rect x="-4" y="-193" width="8" height="6" rx="3" class="gf-kinh-v"/>`
    vat = `<path d="M-5,-12 L-5,2 L-19.5,25 C-21.5,29 -18.5,33 -14,33 L14,33 C18.5,33 21.5,29 19.5,25 L5,2 L5,-12Z" class="gf-thuy"/>
      <g clip-path="url(#${u}vat)"><g data-k="song"><path d="M-34,16 Q-17,13 0,16 Q17,19 34,16 L34,44 L-34,44Z" class="gf-long"/><circle cx="-6" cy="26" r="2.1" class="gf-long-l"/><circle cx="5" cy="22" r="1.4" class="gf-long-l"/><circle cx="9" cy="28" r="1.1" class="gf-long-l"/></g></g>
      <path d="M-12,27 L-4,9" class="gn gn-trang" stroke-width="2.6" opacity=".8"/>
      <rect x="-7.5" y="-16" width="15" height="5.5" rx="2.75" class="gf-thuy-v"/>`
    them = `<clipPath id="${u}vat"><path d="M-5,-12 L-5,2 L-19.5,25 C-21.5,29 -18.5,33 -14,33 L14,33 C18.5,33 21.5,29 19.5,25 L5,2 L5,-12Z"/></clipPath>`
  } else if (k === 'th') {
    than = ao(-14) + ve(-14)
    tocSau = `<circle cx="0" cy="-219" r="21" fill="url(#${u}toc)"/><path d="M-11,-230 Q-4,-236 5,-235" class="gn gn-toc-l" stroke-width="3.4" opacity=".9"/>
      <rect x="-16" y="-204" width="32" height="9" rx="4.5" class="gf-bang"/><rect x="-11" y="-202.5" width="12" height="2.6" rx="1.3" class="gf-trang" opacity=".5"/>`
    toc = `<path d="M-63,-144 C-67,-192 -35,-212 0,-212 C35,-212 67,-192 63,-144 C59,-160 51,-170 40,-175 C29,-182 12,-184 0,-180 C-12,-184 -29,-182 -40,-175 C-51,-170 -59,-160 -63,-144Z" fill="url(#${u}toc)"/>
      <path d="M-38,-197 Q-24,-206 -8,-207" class="gn gn-toc-l" stroke-width="3.6" opacity=".9"/>
      <circle cx="-59" cy="-128" r="3.2" class="gf-vang"/><circle cx="59" cy="-128" r="3.2" class="gf-vang"/>`
    kinh = `<path d="M-40.5,-150 L-57,-154 M40.5,-150 L57,-154" class="gn gn-gong" stroke-width="3"/>
      <circle cx="-21" cy="-147" r="19.5" class="gf-trang" fill-opacity=".14"/><circle cx="21" cy="-147" r="19.5" class="gf-trang" fill-opacity=".14"/>
      <circle cx="-21" cy="-147" r="19.5" class="gn gn-gong" stroke-width="3.6"/><circle cx="21" cy="-147" r="19.5" class="gn gn-gong" stroke-width="3.6"/>
      <path d="M-2,-151 Q0,-154.5 2,-151" class="gn gn-gong" stroke-width="3.2"/>
      <path d="M-32,-157 L-26,-163" class="gn gn-trang" stroke-width="2.6" opacity=".85"/><path d="M10,-157 L16,-163" class="gn gn-trang" stroke-width="2.6" opacity=".85"/>`
    vat = `<path d="M-6,-16 L6,-16 L6,22 A6,6 0 0 1 -6,22Z" class="gf-thuy"/>
      <g clip-path="url(#${u}vat)"><g data-k="song"><path d="M-16,8 Q-8,6.5 0,8 Q8,9.5 16,8 L16,36 L-16,36Z" class="gf-long"/><circle cx="-1.5" cy="17" r="1.6" class="gf-long-l"/><circle cx="2" cy="12.5" r="1.1" class="gf-long-l"/></g></g>
      <path d="M-2.6,-10 L-2.6,18" class="gn gn-trang" stroke-width="2.2" opacity=".8"/>
      <rect x="-8" y="-24" width="16" height="9.5" rx="3.4" class="gf-nut-ong"/>`
    them = `<clipPath id="${u}vat"><path d="M-6,-16 L6,-16 L6,22 A6,6 0 0 1 -6,22Z"/></clipPath>`
  } else if (k === 'vd') {
    than = ao(-21) + `
      <path d="M-13,-105 L-4,-92 L-13,-88 L-20,-100Z" class="gf-ao-l"/><path d="M13,-105 L4,-92 L13,-88 L20,-100Z" class="gf-ao-l"/>
      <path d="M-20,-84 L-14,-104 M20,-84 L14,-104" class="gn gn-tap" stroke-width="5"/>
      <path d="M-21,-84 L21,-84 L23,-58 L33,-52 L35,-27 C35,-23 32,-21 28,-21 L-28,-21 C-32,-21 -35,-23 -35,-27 L-33,-52 L-23,-58Z" class="gf-tap"/>
      <path d="M14,-84 L21,-84 L23,-58 L33,-52 L35,-27 C35,-23 32,-21 28,-21 L22,-21 L24,-52 L17,-58Z" class="gf-tap-s" opacity=".6"/>
      <rect x="-36" y="-56" width="72" height="5" rx="2.5" class="gf-tap-s"/>
      <rect x="-3" y="-80" width="3.4" height="11" rx="1.7" class="gf-but-1"/><rect x="2" y="-78" width="3.4" height="9" rx="1.7" class="gf-but-2"/>
      <rect x="-11" y="-72" width="22" height="12" rx="4" class="gf-tap-l"/>`
    toc = `<path d="M-61,-148 C-63,-184 -52,-206 -30,-209 L30,-209 C52,-206 63,-184 61,-148 C58,-161 54,-170 47,-176 L-47,-176 C-54,-170 -58,-161 -61,-148Z" fill="url(#${u}toc)"/>
      <path d="M-61,-148 C-62,-160 -60,-170 -56,-176 L-48,-176 L-50,-150Z" class="gf-bac"/><path d="M61,-148 C62,-160 60,-170 56,-176 L48,-176 L50,-150Z" class="gf-bac"/>
      <path d="M-30,-203 L22,-203" class="gn gn-toc-l" stroke-width="4" opacity=".8"/>`
    kinh = `<rect x="-62" y="-153" width="18" height="8" rx="4" class="gf-quai"/><rect x="44" y="-153" width="18" height="8" rx="4" class="gf-quai"/>
      <rect x="-45" y="-167" width="90" height="41" rx="18" class="gf-kinh-t" fill-opacity=".24"/>
      <rect x="-45" y="-167" width="90" height="41" rx="18" class="gn gn-kinh-v" stroke-width="3.8"/>
      <path d="M-33,-161 L-25,-161 L-39,-136 L-43,-142Z" class="gf-trang" opacity=".55"/><path d="M14,-161 L18,-161 L8,-140 L5,-144Z" class="gf-trang" opacity=".4"/>`
    ria = `<path d="M-16,-123 C-11,-130 -3,-128 0,-125 C3,-128 11,-130 16,-123 C11,-119 4,-120 0,-122 C-4,-120 -11,-119 -16,-123Z" class="gf-toc"/>`
    vat = `<rect x="-4" y="-24" width="34" height="44" rx="4.5" class="gf-bia"/><rect x="26" y="-24" width="4" height="44" rx="2" class="gf-bia-s"/>
      <rect x="0" y="-18" width="26" height="34" rx="2" class="gf-giay-to"/>
      <path d="M4,-10 l2.2,2.2 l3.6,-4.4 M4,-1 l2.2,2.2 l3.6,-4.4" class="gn gn-ok" stroke-width="2"/><path d="M4.5,6.5 l4.5,4.5 M9,6.5 l-4.5,4.5" class="gn gn-x" stroke-width="2"/>
      <path d="M13,-10 H22 M13,-1 H22 M13,8.5 H20" class="gn gn-dong" stroke-width="2.4"/>
      <rect x="6" y="-28" width="14" height="8" rx="3" class="gf-den"/><rect x="10" y="-30" width="6" height="4" rx="2" class="gf-den-s"/>`
  } else {
    than = ao(-19) + ve(-19) + `<path d="M-15,-106 C-10,-98 -4,-95 0,-95 C4,-95 10,-98 15,-106 L12,-90 C8,-87 4,-86 0,-86 C-4,-86 -8,-87 -12,-90Z" class="gf-trang"/><circle cx="0" cy="-88" r="3.6" class="gf-vang"/>`
    tocSau = `<path d="M-67,-120 C-75,-162 -62,-206 0,-208 C62,-206 75,-162 67,-120 C64,-108 55,-104 49,-108 L-49,-108 C-55,-104 -64,-108 -67,-120Z" fill="url(#${u}toc)"/>
      <g transform="rotate(30 0 -216)"><rect x="-3.6" y="-252" width="7.2" height="38" rx="3.6" class="gf-vang"/><path d="M-3.6,-252 L0,-261 L3.6,-252Z" class="gtay-but-g"/><path d="M-1.2,-258 L0,-261 L1.2,-258Z" class="gf-net"/><rect x="-3.6" y="-219" width="7.2" height="6" rx="2.4" class="gtay-tay"/></g>
      <circle cx="0" cy="-216" r="19" class="gf-toc gn-toc-s" stroke-width="2.4"/><path d="M-10,-212 Q-6,-226 6,-226 Q12,-222 9,-214" class="gn gn-toc-s" stroke-width="2.6" opacity=".8"/>`
    toc = `<path d="M-63,-146 C-67,-193 -31,-214 4,-212 C41,-210 67,-191 63,-150 C57,-166 45,-177 27,-180 C13,-172 -9,-171 -26,-177 C-41,-173 -55,-163 -63,-146Z" fill="url(#${u}toc)"/>
      <path d="M-40,-196 Q-22,-207 -2,-207" class="gn gn-trang" stroke-width="4" opacity=".75"/>`
    kinh = `<path d="M-39,-139 H-3 A18,13 0 0 1 -39,-139Z" class="gf-trang" fill-opacity=".34"/><path d="M3,-139 H39 A18,13 0 0 1 3,-139Z" class="gf-trang" fill-opacity=".34"/>
      <path d="M-39,-139 H-3 A18,13 0 0 1 -39,-139Z M3,-139 H39 A18,13 0 0 1 3,-139Z" class="gn gn-gong" stroke-width="3.2"/>
      <path d="M-3,-139 Q0,-142.5 3,-139" class="gn gn-gong" stroke-width="3"/>
      <path d="M-33,-134 L-28,-130" class="gn gn-trang" stroke-width="2.2" opacity=".85"/><path d="M9,-134 L14,-130" class="gn gn-trang" stroke-width="2.2" opacity=".85"/>
      <path d="M-39,-138 Q-57,-116 -42,-100 M39,-138 Q57,-116 42,-100" class="gn gn-vang" stroke-width="1.8" stroke-dasharray="2 2.6"/>`
    vat = `<rect x="-4" y="-24" width="32" height="42" rx="4.5" class="gf-so"/><rect x="24" y="-24" width="4" height="42" rx="2" class="gf-so-s"/>
      <rect x="4" y="-17" width="17" height="9" rx="2" class="gf-giay-to"/>
      <rect x="4" y="-3" width="3.4" height="3.4" rx=".8" class="gf-giay-to"/><rect x="17.6" y="-3" width="3.4" height="3.4" rx=".8" class="gf-giay-to"/>
      <rect x="4" y="1.6" width="3.4" height="3.4" rx=".8" class="gf-giay-to"/><rect x="8.5" y="1.6" width="3.4" height="3.4" rx=".8" class="gf-vang"/><rect x="13" y="1.6" width="3.4" height="3.4" rx=".8" class="gf-giay-to"/><rect x="17.6" y="1.6" width="3.4" height="3.4" rx=".8" class="gf-giay-to"/>
      <path d="M5,11 H20" class="gn gn-so-s" stroke-width="2.2"/>
      <path d="M-4,-17 h5 M-4,-9 h5 M-4,-1 h5 M-4,7 h5" class="gn gn-trang" stroke-width="2.2"/>`
  }
  const mat1 = (s: number, b: string) => `<g transform="translate(${s * MAT_X} ${MAT_Y})">
    <g data-k="mo${b}"><ellipse rx="14.5" ry="16.5" class="gf-trang"/>
      <g clip-path="url(#${u}e)"><g data-k="con${b}"><circle r="9.4" class="gf-net"/><circle cx="-3.3" cy="-3.9" r="3.5" class="gf-trang"/><circle cx="3.3" cy="3.5" r="1.5" class="gf-trang"/></g>
        <g data-k="mi${b}"><path d="M-19,-44 H19 V-1.5 Q0,3 -19,-1.5Z" class="gf-da"/><path d="M-19,-1.5 Q0,3 19,-1.5" class="gn gn-net" stroke-width="2.6"/></g></g>
      <ellipse rx="14.5" ry="16.5" class="gn gn-net" stroke-width="2.3"/></g>
    <path data-k="nham${b}" d="M-12,-1 Q0,6 12,-1" class="gn gn-net" stroke-width="3.4" opacity="0"/>
    <path data-k="cong${b}" d="M-11.5,5 Q0,-8.5 11.5,5" class="gn gn-net" stroke-width="3.8" opacity="0"/></g>`
  const tay = (s: number, b: string) => `<g data-k="tay${b}">
    <path d="M0,0 L0,25" class="gn gn-ao" stroke-width="15"/><path d="M${-s * 3.6},3 L${-s * 3.6},21" class="gn gn-ao-l" stroke-width="3" opacity=".6"/>
    <g data-k="khuyu${b}"><path d="M0,0 L0,18" class="gn gn-ao" stroke-width="14"/>
      <rect x="-7.8" y="14" width="15.6" height="7.5" rx="3.2" class="${n.gang ? 'gf-tay-s' : 'gf-ao-d'}"/>
      <g data-k="ban${b}" transform="translate(0 27)">${b === 'T' ? `<g data-k="vat">${vat}</g><g><circle r="8.3" class="gf-tay"/><path d="M-5,-1 Q-1,1.2 3,-1 M-5,3 Q-1,5.2 3,3" class="gn gn-tay-s" stroke-width="1.5"/></g>` : banPhai(u)}</g></g></g>`
  return `<defs>
    <linearGradient id="${u}ao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="gs-ao-l"/><stop offset=".45" class="gs-ao"/><stop offset="1" class="gs-ao-s"/></linearGradient>
    <radialGradient id="${u}da" cx=".4" cy=".3" r=".78"><stop offset="0" class="gs-da-l"/><stop offset=".55" class="gs-da"/><stop offset="1" class="gs-da-s"/></radialGradient>
    <linearGradient id="${u}toc" x1=".2" y1="0" x2=".5" y2="1"><stop offset="0" class="gs-toc-l"/><stop offset=".55" class="gs-toc"/><stop offset="1" class="gs-toc-s"/></linearGradient>
    <radialGradient id="${u}ma"><stop offset="0" class="gs-ma" stop-opacity=".85"/><stop offset="1" class="gs-ma" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}tia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="gs-tia" stop-opacity=".75"/><stop offset="1" class="gs-tia" stop-opacity="0"/></linearGradient>
    <radialGradient id="${u}bong"><stop offset="0" class="gs-bong"/><stop offset=".6" class="gs-bong" stop-opacity=".75"/><stop offset="1" class="gs-bong" stop-opacity="0"/></radialGradient>
    <clipPath id="${u}e"><ellipse rx="14.5" ry="16.5"/></clipPath>${them}
  </defs>
  <g transform="scale(${TL})">
  <ellipse data-k="bong" cx="0" cy="0" rx="52" ry="9" fill="url(#${u}bong)"/>
  <g data-k="goc">
    <g><rect x="-16.5" y="-31" width="11" height="26" rx="5.5" class="gf-quan"/><rect x="5.5" y="-31" width="11" height="26" rx="5.5" class="gf-quan"/>${giay(-1)}${giay(1)}</g>
    <g data-k="than">
      <g>${than}<path d="M-15,-104 Q0,-97 15,-104" class="gn gn-ao-d" stroke-width="2.4" opacity=".35"/></g>
      <g data-k="dau">
        ${tocSau}
        <g data-k="tai"><ellipse cx="-59" cy="-143" rx="8" ry="10.5" class="gf-da"/><ellipse cx="-59.5" cy="-143" rx="3.6" ry="6" class="gf-da-s"/><ellipse cx="59" cy="-143" rx="8" ry="10.5" class="gf-da"/><ellipse cx="59.5" cy="-143" rx="3.6" ry="6" class="gf-da-s"/></g>
        <path d="${DAU}" fill="url(#${u}da)"/>
        <g data-k="mat">
          <g data-k="ma"><ellipse cx="-37" cy="-126" rx="10.5" ry="6.5" fill="url(#${u}ma)"/><ellipse cx="37" cy="-126" rx="10.5" ry="6.5" fill="url(#${u}ma)"/></g>
          ${mat1(-1, 'T')}${mat1(1, 'P')}
          <g data-k="mayT"><path d="M-8.5,1.6 Q0,-3 8.5,1.6" class="gn gn-may" stroke-width="4.4"/></g>
          <g data-k="mayP"><path d="M-8.5,1.6 Q0,-3 8.5,1.6" class="gn gn-may" stroke-width="4.4"/></g>
          <ellipse cx="0" cy="-132" rx="4.3" ry="3.2" class="gf-da-s"/><ellipse cx="-1.4" cy="-133.3" rx="1.5" ry=".9" class="gf-trang" opacity=".55"/>
          ${ria}
          <g data-k="mieng">
            <path data-m="cuoi" d="M-7,-1.5 Q0,5.5 7,-1.5" class="gn gn-mieng" stroke-width="3.2"/>
            <g data-m="cuoiTo"><path d="M-10.5,-3 Q0,-1 10.5,-3 Q9,10.5 0,11 Q-9,10.5 -10.5,-3Z" class="gf-mieng"/><path d="M-6,6.6 Q0,3.6 6,6.6 Q4,10.4 0,10.7 Q-4,10.4 -6,6.6Z" class="gf-luoi"/><path d="M-8.8,-2.5 Q0,-.9 8.8,-2.5 L8,.8 Q0,2 -8,.8Z" class="gf-trang"/></g>
            <path data-m="phang" d="M-6.5,0 Q0,1.2 6.5,0" class="gn gn-mieng" stroke-width="3.2"/>
            <path data-m="meo" d="M-7,3 Q0,-2.8 7,3" class="gn gn-mieng" stroke-width="3.2"/>
            <ellipse data-m="o" cx="0" cy="1" rx="3.6" ry="4.4" class="gf-mieng"/>
            <g data-m="ngap"><ellipse cx="0" cy="2" rx="7.5" ry="10.5" class="gf-mieng"/><ellipse cx="0" cy="8.5" rx="5" ry="3.4" class="gf-luoi"/></g>
            <path data-m="nhech" d="M-6.5,1.6 Q1,4.4 8,-2.6" class="gn gn-mieng" stroke-width="3.2"/>
            <path data-m="hmm" d="M-6.5,1 Q-3.2,-1.6 0,1 Q3.2,3.6 6.5,.6" class="gn gn-mieng" stroke-width="3"/>
          </g>
        </g>
        <g data-k="tocT">${toc}</g>
        <g data-k="kinh">${kinh}</g>
        <g data-k="sao" opacity="0">
          <path d="${SAO}" class="gf-vang" transform="translate(-64 -200)"/><path d="${SAO}" class="gf-vang" transform="translate(66 -188) scale(.8)"/>
          <path d="${SAO}" class="gf-vang" transform="translate(74 -138) scale(.6)"/><path d="${SAO}" class="gf-vang" transform="translate(-74 -148) scale(.55)"/>
          <circle cx="-48" cy="-226" r="2.6" class="gf-vang"/><circle cx="52" cy="-222" r="2" class="gf-vang"/>
        </g>
      </g>
      ${tay(-1, 'T')}${tay(1, 'P')}
    </g>
  </g></g>`
}
function banPhai(u: string): string {
  return `
  <g data-b="mo"><ellipse cx="-6.6" cy="-1.5" rx="3.6" ry="4.8" class="gf-tay"/><circle r="8.3" class="gf-tay"/><path d="M-4,4.5 Q0,6.6 4,4.5" class="gn gn-tay-s" stroke-width="1.5"/></g>
  <g data-b="chi"><rect x="-2.9" y="2" width="5.8" height="15.5" rx="2.9" class="gf-tay"/><circle r="8" class="gf-tay"/><ellipse cx="-6.4" cy="1" rx="3.2" ry="4.2" class="gf-tay"/><path d="M-4,-2 Q0,0 4,-2" class="gn gn-tay-s" stroke-width="1.4"/></g>
  <g data-b="cai"><rect x="-3.7" y="3" width="7.4" height="13" rx="3.7" class="gf-tay"/><circle r="8.5" class="gf-tay"/><path d="M-5.6,-3 H4 M-5.6,1 H4 M-5,-7 H3" class="gn gn-tay-s" stroke-width="1.5"/></g>
  <g data-b="but"><g transform="rotate(-90)"><rect x="-1.9" y="-12" width="3.8" height="30" rx="1.9" class="gf-but"/><path d="M-1.9,17.5 L0,23 L1.9,17.5Z" class="gf-net"/><rect x="-1.9" y="-12" width="3.8" height="6" rx="1.9" class="gf-but-d"/></g><circle r="8" class="gf-tay"/><path d="M-5,-1 Q-1,1.2 3,-1" class="gn gn-tay-s" stroke-width="1.4"/></g>
  <g data-b="den" class="gt-den"><g data-k="tia" opacity="0"><path d="M-6.5,23 L-66,300 L66,300 L6.5,23Z" fill="url(#${u}tia)"/><ellipse cx="0" cy="24" rx="14" ry="6.5" class="gf-tia" opacity=".7"/></g>
    <rect x="-5.5" y="-9" width="11" height="23" rx="3" class="gf-den"/><path d="M-5.5,12 L-8.2,21 L8.2,21 L5.5,12Z" class="gf-den-s"/><ellipse cx="0" cy="21.4" rx="8.2" ry="2.8" class="gf-vang gt-den-kinh"/>
    <circle r="8.3" class="gf-tay"/><path d="M-5,-1 Q-1,1.2 3,-1" class="gn gn-tay-s" stroke-width="1.4"/></g>`
}
