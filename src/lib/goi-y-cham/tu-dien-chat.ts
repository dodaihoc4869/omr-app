// Từ điển CHẤT cho «Chạm để hiểu đề» (thầy chốt build 26/10). Hàm thuần, không mạng, nạp lười.
// - Bảng nguyên tử khối theo SGK; khối lượng mol (M) LUÔN do máy tính từ công thức — trong tệp này KHÔNG gõ M của chất nào.
// - Tra hai chiều: công thức → tên (IUPAC theo SGK 2018 + tên cũ + loại), tên → công thức.
// - Dữ liệu nén dạng chuỗi; muối/oxide/hydroxide sinh từ bảng cation × anion để gọn.

/** Nguyên tử khối theo SGK (dùng khi đề không cho). */
const NTK_CHU =
  'H1 He4 Li7 Be9 B11 C12 N14 O16 F19 Ne20 Na23 Mg24 Al27 Si28 P31 S32 Cl35.5 Ar40 K39 Ca40 Cr52 Mn55 Fe56 Co59 Ni59 Cu64 Zn65 Br80 Rb85.5 Sr88 Ag108 Sn119 I127 Cs133 Ba137 Au197 Hg201 Pb207'
export const NGUYEN_TU_KHOI: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(NTK_CHU.split(' ').map((s) => { const m = /^([A-Z][a-z]?)([\d.]+)$/.exec(s)!; return [m[1], Number(m[2])] })),
)
export type BangNtk = Readonly<Record<string, number>>

const CHI_SO_DUOI = '₀₁₂₃₄₅₆₇₈₉'
const CHI_SO_TREN = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** Chuẩn hoá cách viết công thức: chỉ số dưới/trên Unicode → số thường, bỏ khoảng trắng và «^», dấu ngậm nước → «·». */
export function chuanCongThuc(ct: string): string {
  let s = ''
  for (const c of ct) {
    const d = CHI_SO_DUOI.indexOf(c); const t = CHI_SO_TREN.indexOf(c)
    if (d >= 0) s += String(d)
    else if (t >= 0) s += String(t)
    else if (c === '⁺') s += '+'
    else if (c === '⁻' || c === '−' || c === '–' || c === '—') s += '-'
    else if (c === '.' || c === '*' || c === '•' || c === '∙') s += '·'
    else if (!/[\s^]/.test(c)) s += c
  }
  return s
}

/** Kết quả phân tích công thức: số nguyên tử theo thứ tự xuất hiện; `polyme` khi có «)n». */
export type PhanTich = { dem: [string, number][]; polyme: boolean }

/** Phân tích công thức (đã chuẩn hoá, KHÔNG kèm điện tích). Sai cú pháp / ký hiệu lạ ⇒ null. */
export function phanTichCongThuc(ctVao: string, ntk: BangNtk = NGUYEN_TU_KHOI): PhanTich | null {
  const ct = chuanCongThuc(ctVao)
  if (!ct || /[+]|-$/.test(ct)) return null
  const thuTu: string[] = []
  let polyme = false
  // mỗi phần ngăn bởi «·» (ngậm nước): «5H2O» ⇒ hệ số 5
  const tong = new Map<string, number>()
  const phan = ct.split('·')
  for (let k = 0; k < phan.length; k++) {
    let p = phan[k]
    let heSo = 1
    if (k > 0) { const m = /^(\d+)/.exec(p); if (m) { heSo = Number(m[1]); p = p.slice(m[1].length) } }
    if (!p) return null
    let i = 0
    const ngan: Map<string, number>[] = [new Map()]
    const cong = (map: Map<string, number>, kh: string, n: number) => map.set(kh, (map.get(kh) ?? 0) + n)
    const docSo = (): number | null => { const m = /^\d+/.exec(p.slice(i)); if (!m) return null; i += m[0].length; return Number(m[0]) }
    while (i < p.length) {
      const c = p[i]
      if (c === '=' || c === '≡' || c === '-') { i++; continue }
      if (c === '(' || c === '[') { ngan.push(new Map()); i++; continue }
      if (c === ')' || c === ']') {
        if (ngan.length < 2) return null
        i++
        const trong = ngan.pop()!
        if (trong.size === 0) return null
        let n = docSo()
        if (n === null && p[i] === 'n' && i === p.length - 1 && k === phan.length - 1) { polyme = true; i++; n = 1 }
        for (const [kh, v] of trong) cong(ngan[ngan.length - 1], kh, v * (n ?? 1))
        continue
      }
      if (!/[A-Z]/.test(c)) return null
      let kh = ''
      const hai = p.slice(i, i + 2)
      if (hai.length === 2 && /[a-z]/.test(hai[1]) && ntk[hai] !== undefined) kh = hai
      else if (ntk[c] !== undefined) kh = c
      else return null
      i += kh.length
      if (!thuTu.includes(kh)) thuTu.push(kh)
      cong(ngan[ngan.length - 1], kh, docSo() ?? 1)
    }
    if (ngan.length !== 1 || ngan[0].size === 0) return null
    for (const [kh, v] of ngan[0]) tong.set(kh, (tong.get(kh) ?? 0) + v * heSo)
  }
  return { dem: thuTu.map((kh) => [kh, tong.get(kh)!]), polyme }
}

const lamTron = (x: number) => Math.round(x * 1000) / 1000

/** Khối lượng mol tính từ công thức (g/mol). Polyme «(C6H10O5)n» ⇒ M của một mắt xích. Sai công thức ⇒ null. */
export function tinhM(ct: string, ntk?: BangNtk): number | null {
  const bang = ntk ? { ...NGUYEN_TU_KHOI, ...ntk } : NGUYEN_TU_KHOI
  const pt = phanTichCongThuc(tachDienTich(ct).goc, bang)
  if (!pt) return null
  return lamTron(pt.dem.reduce((s, [kh, n]) => s + bang[kh] * n, 0))
}

/** Số kiểu Việt Nam: 58.5 ⇒ «58,5». */
export const soViet = (x: number) => String(lamTron(x)).replace('.', ',')

/** Cách máy tính M, vd NaOH ⇒ «Na = 23, O = 16, H = 1 (23 + 16 + 1 = 40)». */
export function cachTinhM(ct: string, ntk?: BangNtk): string | null {
  const bang = ntk ? { ...NGUYEN_TU_KHOI, ...ntk } : NGUYEN_TU_KHOI
  const pt = phanTichCongThuc(tachDienTich(ct).goc, bang)
  if (!pt) return null
  const M = pt.dem.reduce((s, [kh, n]) => s + bang[kh] * n, 0)
  const ds = pt.dem.map(([kh]) => `${kh} = ${soViet(bang[kh])}`).join(', ')
  const phep = pt.dem.map(([kh, n]) => (n === 1 ? soViet(bang[kh]) : `${n}·${soViet(bang[kh])}`)).join(' + ')
  return pt.dem.length === 1 && pt.dem[0][1] === 1 ? `${ds}` : `${ds} (${phep} = ${soViet(M)})`
}

/** Công thức phân tử kiểu Hill (C, H trước, còn lại theo vần) — để gom các chất cùng công thức phân tử. */
export function congThucPhanTu(ct: string): string | null {
  const pt = phanTichCongThuc(tachDienTich(ct).goc)
  return pt ? hill(pt) : null
}
function hill(pt: PhanTich): string {
  const m = new Map(pt.dem)
  const h = (x: string) => (m.has('C') ? (x === 'C' ? 0 : x === 'H' ? 1 : 2) : 2)
  const khoa = [...m.keys()].sort((a, b) => h(a) - h(b) || a.localeCompare(b))
  return khoa.map((k) => k + (m.get(k)! > 1 ? m.get(k) : '')).join('') + (pt.polyme ? 'n' : '')
}

/**
 * Tách điện tích ở cuối: «SO42-» ⇒ {goc: 'SO4', dienTich: '2-'}. Ion có trong từ điển tra thẳng;
 * ion lạ: đơn nguyên tử («Sn2+») bỏ cả số; đa nguyên tử chỉ bỏ dấu, trừ khi số cuối ≥ 10 («SiO32-» ⇒ SiO3 + 2-).
 */
export function tachDienTich(ct: string): { goc: string; dienTich: string } {
  const s = chuanCongThuc(ct)
  const m = /^(.*?)(\d*)([+-])$/.exec(s)
  if (!m) return { goc: s, dienTich: '' }
  const ion = ION_GOC().get(s)
  if (ion) return { goc: ion, dienTich: s.slice(ion.length) }
  const [, than, so, dau] = m
  if (NGUYEN_TU_KHOI[than] !== undefined) return { goc: than, dienTich: so + dau }
  if (so.length >= 2) return { goc: than + so.slice(0, -1), dienTich: so.slice(-1) + dau }
  return { goc: than + so, dienTich: dau }
}

/** Chữ đẹp để hiện: CH3COOC2H5 ⇒ CH₃COOC₂H₅; ion «SO4 2-» ⇒ SO₄²⁻; «(C6H10O5)n» ⇒ (C₆H₁₀O₅)ₙ; «CuSO4·5H2O» giữ hệ số 5. */
export function dangDep(ct: string): string {
  const m = /^(.*?)\s(\d?)([+-])$/.exec(ct)
  const goc = (m ? m[1] : ct)
    .replace(/([A-Za-z)\]])(\d+)/g, (_, a: string, d: string) => a + [...d].map((c) => CHI_SO_DUOI[Number(c)]).join(''))
    .replace(/\)n$/, ')ₙ')
  return m ? goc + (m[2] ? CHI_SO_TREN[Number(m[2])] : '') + (m[3] === '+' ? '⁺' : '⁻') : goc
}

// ───────────────────────── DỮ LIỆU ─────────────────────────
// Loại chất (nhãn hiện trên thẻ).
const LOAI: Record<string, string> = {
  kl: 'Kim loại', pk: 'Phi kim', kh: 'Khí hiếm', ob: 'Oxide base', oa: 'Oxide acid', olt: 'Oxide lưỡng tính', otr: 'Oxide trung tính',
  o: 'Oxide', am: 'Acid mạnh', atb: 'Acid trung bình', ay: 'Acid yếu', bm: 'Base mạnh', by: 'Base yếu', bkt: 'Base không tan',
  hlt: 'Hydroxide lưỡng tính', mu: 'Muối', hc: 'Hợp chất vô cơ', qg: 'Khoáng vật', ank: 'Alkane', anken: 'Alkene', ankadien: 'Alkadiene',
  ankin: 'Alkyne', aren: 'Arene', dx: 'Dẫn xuất halogen', ol: 'Alcohol', ph: 'Phenol', al: 'Aldehyde', xt: 'Ketone',
  ax: 'Carboxylic acid', es: 'Ester', cb: 'Chất béo', xp: 'Xà phòng', cbh: 'Carbohydrate', amin: 'Amine', aa: 'Amino acid',
  pol: 'Polymer', ion: 'Ion', nhom: 'Nhóm nguyên tử',
}

// Dòng: «công thức[/cách viết khác…] | tên IUPAC[;tên khác] | tên cũ[;tên thường gọi] | loại».
// Tên bắt đầu bằng «~» chỉ để HIỆN, không dò trong đề (vd «đồng», «bạc», «vàng», «nước» trùng chữ thường).
const DONG = `H2|hydrogen|hiđro;khí hiđro|pk
O2|oxygen|oxi;khí oxi|pk
O3|ozone|ozon|pk
N2|nitrogen|nitơ;khí nitơ|pk
Cl2|chlorine|clo;khí clo|pk
Br2|bromine|brom|pk
I2|iodine|iot|pk
F2|fluorine|flo|pk
S|sulfur|lưu huỳnh|pk
P|phosphorus|photpho|pk
C|carbon|cacbon|pk
Si|silicon|silic|pk
B|boron|~bo|pk
He|helium|heli|kh
Ne|neon|~neon|kh
Ar|argon|agon|kh
Li|lithium|liti|kl
Na|sodium|natri|kl
K|potassium|kali|kl
Rb|rubidium|rubiđi|kl
Cs|caesium;cesium|xesi|kl
Be|beryllium|beri|kl
Mg|magnesium|magie|kl
Ca|calcium|canxi|kl
Sr|strontium|stronti|kl
Ba|barium|bari|kl
Al|aluminium;aluminum|nhôm|kl
Fe|iron|sắt|kl
Cu|copper|~đồng|kl
Zn|zinc|kẽm|kl
Ag|silver|~bạc|kl
Au|gold|~vàng|kl
Pb|lead|chì|kl
Hg|mercury|thuỷ ngân|kl
Cr|chromium|crom|kl
Mn|manganese|mangan|kl
Ni|nickel|niken|kl
Co|cobalt|coban|kl
Sn|~tin|thiếc|kl
CO|carbon monoxide|cacbon monooxit|otr
CO2|carbon dioxide|cacbon đioxit;khí cacbonic;băng khô|oa
SO2|sulfur dioxide|lưu huỳnh đioxit;khí sunfurơ|oa
SO3|sulfur trioxide|lưu huỳnh trioxit|oa
NO|nitrogen monoxide|nitơ monooxit|otr
NO2|nitrogen dioxide|nitơ đioxit|oa
N2O|dinitrogen monoxide|đinitơ oxit;khí cười|otr
N2O5|dinitrogen pentoxide|đinitơ pentaoxit|oa
P2O5|diphosphorus pentoxide;phosphorus pentoxide|điphotpho pentaoxit|oa
SiO2|silicon dioxide|silic đioxit|oa
MnO2|manganese dioxide|mangan đioxit|o
Fe3O4|iron(II,III) oxide|oxit sắt từ;sắt từ oxit|o
CrO3|chromium(VI) oxide|crom(VI) oxit|oa
HCl|hydrochloric acid;hydrogen chloride|axit clohiđric;hiđro clorua|am
HBr|hydrobromic acid;hydrogen bromide|axit bromhiđric|am
HI|hydroiodic acid;hydrogen iodide|axit iothiđric|am
HF|hydrofluoric acid;hydrogen fluoride|axit flohiđric|ay
HNO3|nitric acid|axit nitric|am
HNO2|nitrous acid|axit nitrơ|ay
H2SO4|sulfuric acid|axit sunfuric|am
H2SO3|sulfurous acid|axit sunfurơ|ay
H3PO4|phosphoric acid|axit photphoric|atb
H2CO3|carbonic acid|axit cacbonic|ay
H2S|hydrogen sulfide;hydrosulfuric acid|hiđro sunfua;axit sunfuhiđric|ay
HClO|hypochlorous acid|axit hipoclorơ|ay
HClO4|perchloric acid|axit pecloric|am
H2SiO3|silicic acid|axit silixic|ay
H2O|water|~nước|hc
H2O2|hydrogen peroxide|hiđro peoxit;nước oxi già|hc
NH3|ammonia|amoniac;khí amoniac|by
PH3|phosphine|photphin|hc
CaOCl2|bleaching powder|clorua vôi|mu
CaC2|calcium carbide|canxi cacbua;đất đèn|hc
Al4C3|aluminium carbide|nhôm cacbua|hc
(NH2)2CO|urea|ure;urê;phân urê|hc
CuSO4·5H2O|copper(II) sulfate pentahydrate|đồng(II) sunfat ngậm nước;phèn xanh|mu
CaSO4·2H2O|calcium sulfate dihydrate;gypsum|thạch cao sống|mu
KAl(SO4)2·12H2O|potassium alum|phèn chua|mu
Na2CO3·10H2O|sodium carbonate decahydrate|sođa tinh thể|mu
FeS2|iron pyrite;pyrite|pirit sắt;quặng pirit|qg
CH4|methane|metan;khí metan|ank
C2H6|ethane|etan|ank
C3H8|propane|propan|ank
C4H10|butane|butan|ank
C5H12|pentane|pentan|ank
C6H14|hexane|hexan|ank
C2H4/CH2=CH2|ethylene;ethene|etilen;eten|anken
C3H6/CH2=CHCH3/CH2=CH-CH3|propylene;propene|propilen;propen|anken
CH2=CH-CH=CH2/CH2=CHCH=CH2|buta-1,3-diene|buta-1,3-đien;butađien|ankadien
C2H2/CH≡CH|acetylene;ethyne|axetilen;etin|ankin
CH≡CCH3/CH≡C-CH3|propyne|propin|ankin
C6H6|benzene|benzen|aren
C6H5CH3|toluene|toluen|aren
C6H5CH=CH2|styrene|stiren|aren
C10H8|naphthalene|naphtalen;băng phiến|aren
CH3Cl|chloromethane|metyl clorua|dx
CH2Cl2|dichloromethane|metylen clorua|dx
CHCl3|chloroform;trichloromethane|clorofom|dx
CCl4|carbon tetrachloride;tetrachloromethane|cacbon tetraclorua|dx
C2H5Cl/CH3CH2Cl|chloroethane;ethyl chloride|etyl clorua|dx
C2H5Br/CH3CH2Br|bromoethane;ethyl bromide|etyl bromua|dx
CH2=CHCl|vinyl chloride;chloroethene|vinyl clorua|dx
CH3OH|methanol|ancol metylic;rượu metylic|ol
C2H5OH/CH3CH2OH|ethanol|ancol etylic;rượu etylic|ol
C3H7OH/CH3CH2CH2OH|propan-1-ol;propyl alcohol|ancol propylic|ol
CH3CH(OH)CH3|propan-2-ol;isopropyl alcohol|ancol isopropylic|ol
C4H9OH/CH3CH2CH2CH2OH|butan-1-ol|ancol butylic|ol
C2H4(OH)2/HOCH2CH2OH|ethylene glycol;ethane-1,2-diol|etilen glicol;etylen glicol|ol
C3H5(OH)3|glycerol|glixerol;glixerin|ol
C6H5CH2OH|benzyl alcohol|ancol benzylic|ol
C6H5OH|phenol|~phenol|ph
HCHO|formaldehyde;methanal|anđehit fomic;fomanđehit;fomalin|al
CH3CHO|acetaldehyde;ethanal|anđehit axetic;axetanđehit|al
C2H5CHO|propanal;propionaldehyde|anđehit propionic|al
C6H5CHO|benzaldehyde|benzanđehit|al
CH3COCH3|acetone;propanone|axeton;đimetyl xeton|xt
HCOOH|formic acid;methanoic acid|axit fomic|ax
CH3COOH|acetic acid;ethanoic acid|axit axetic|ax
C2H5COOH|propanoic acid;propionic acid|axit propionic|ax
CH2=CHCOOH|acrylic acid;propenoic acid|axit acrylic|ax
CH2=C(CH3)COOH|methacrylic acid|axit metacrylic|ax
C6H5COOH|benzoic acid|axit benzoic|ax
(COOH)2/HOOC-COOH|oxalic acid|axit oxalic|ax
HOOC[CH2]4COOH|adipic acid|axit ađipic|ax
C15H31COOH|palmitic acid|axit panmitic|ax
C17H35COOH|stearic acid|axit stearic|ax
C17H33COOH|oleic acid|axit oleic|ax
C17H31COOH|linoleic acid|axit linoleic|ax
HCOOCH3|methyl formate|metyl fomat|es
HCOOC2H5|ethyl formate|etyl fomat|es
CH3COOCH3|methyl acetate|metyl axetat|es
CH3COOC2H5|ethyl acetate|etyl axetat|es
CH3COOC3H7|propyl acetate|propyl axetat|es
C2H5COOCH3|methyl propionate|metyl propionat|es
C2H5COOC2H5|ethyl propionate|etyl propionat|es
CH3COOCH=CH2|vinyl acetate|vinyl axetat|es
CH2=CHCOOCH3|methyl acrylate|metyl acrylat|es
CH2=C(CH3)COOCH3|methyl methacrylate|metyl metacrylat|es
CH3COOC6H5|phenyl acetate|phenyl axetat|es
C6H5COOCH3|methyl benzoate|metyl benzoat|es
CH3COOCH2C6H5|benzyl acetate|benzyl axetat|es
CH3COOCH2CH2CH(CH3)2|isoamyl acetate;isopentyl acetate|isoamyl axetat|es
(C17H35COO)3C3H5|tristearin;tristearoylglycerol|tristearin;tristearoylglixerol|cb
(C17H33COO)3C3H5|triolein;trioleoylglycerol|triolein|cb
(C15H31COO)3C3H5|tripalmitin;tripalmitoylglycerol|tripanmitin|cb
(C17H31COO)3C3H5|trilinolein|~trilinolein|cb
C17H35COONa|sodium stearate|natri stearat|xp
C15H31COONa|sodium palmitate|natri panmitat|xp
C17H33COONa|sodium oleate|natri oleat|xp
C17H35COOK|potassium stearate|kali stearat|xp
CH3COONa|sodium acetate|natri axetat|mu
CH3COOK|potassium acetate|kali axetat|mu
(CH3COO)2Ca|calcium acetate|canxi axetat|mu
HCOONa|sodium formate|natri fomat|mu
C2H5COONa|sodium propionate|natri propionat|mu
CH2=CHCOONa|sodium acrylate|natri acrylat|mu
C6H5ONa|sodium phenoxide|natri phenolat|mu
C2H5ONa|sodium ethoxide|natri etylat|mu
CH3COONH4|ammonium acetate|amoni axetat|mu
C6H12O6|glucose|glucozơ|cbh
C6H12O6|fructose|fructozơ|cbh
C12H22O11|saccharose;sucrose|saccarozơ|cbh
C12H22O11|maltose|mantozơ|cbh
(C6H10O5)n|starch|tinh bột|cbh
(C6H10O5)n|cellulose|xenlulozơ|cbh
CH3NH2|methylamine;methanamine|metylamin|amin
C2H5NH2|ethylamine;ethanamine|etylamin|amin
(CH3)2NH|dimethylamine;N-methylmethanamine|đimetylamin|amin
(CH3)3N|trimethylamine;N,N-dimethylmethanamine|trimetylamin|amin
C3H7NH2|propylamine;propan-1-amine|propylamin|amin
C6H5NH2|aniline|anilin|amin
H2NCH2COOH|glycine;Gly|glyxin|aa
CH3CH(NH2)COOH|alanine;Ala|alanin|aa
(CH3)2CHCH(NH2)COOH|valine;Val|valin|aa
HOOC[CH2]2CH(NH2)COOH|glutamic acid;Glu|axit glutamic|aa
H2N[CH2]4CH(NH2)COOH|lysine;Lys|lysin|aa
|polyethylene|polietilen|pol
|polypropylene|polipropilen|pol
|poly(vinyl chloride);PVC|poli(vinyl clorua)|pol
|polystyrene|polistiren|pol
|poly(methyl methacrylate);PMMA|poli(metyl metacrylat);thuỷ tinh hữu cơ|pol
|nylon-6,6|tơ nilon-6,6;nilon-6,6|pol
|capron;nylon-6|tơ capron|pol
|polyacrylonitrile|tơ nitron;tơ olon|pol
|buna rubber|cao su buna|pol
|natural rubber|cao su thiên nhiên|pol
|teflon|~teflon|pol
OH|~nhóm hydroxyl|~nhóm hiđroxyl|nhom
COOH|~nhóm carboxyl|~nhóm cacboxyl|nhom
CHO|~nhóm aldehyde|~nhóm anđehit|nhom
H +|~hydrogen ion|~ion hiđro|ion
OH -|~hydroxide ion|~ion hiđroxit|ion
Li +|~lithium ion|~ion liti|ion
Na +|~sodium ion|~ion natri|ion
K +|~potassium ion|~ion kali|ion
NH4 +|~ammonium ion|~ion amoni|ion
Ag +|~silver ion|~ion bạc|ion
Cu +|~copper(I) ion|~ion đồng(I)|ion
Ca 2+|~calcium ion|~ion canxi|ion
Mg 2+|~magnesium ion|~ion magie|ion
Ba 2+|~barium ion|~ion bari|ion
Zn 2+|~zinc ion|~ion kẽm|ion
Cu 2+|~copper(II) ion|~ion đồng(II)|ion
Fe 2+|~iron(II) ion|~ion sắt(II)|ion
Pb 2+|~lead(II) ion|~ion chì(II)|ion
Mn 2+|~manganese(II) ion|~ion mangan(II)|ion
Ni 2+|~nickel(II) ion|~ion niken(II)|ion
Al 3+|~aluminium ion|~ion nhôm|ion
Fe 3+|~iron(III) ion|~ion sắt(III)|ion
Cr 3+|~chromium(III) ion|~ion crom(III)|ion
Cl -|~chloride ion|~ion clorua|ion
Br -|~bromide ion|~ion bromua|ion
I -|~iodide ion|~ion iotua|ion
F -|~fluoride ion|~ion florua|ion
NO3 -|~nitrate ion|~ion nitrat|ion
NO2 -|~nitrite ion|~ion nitrit|ion
SO4 2-|~sulfate ion|~ion sunfat|ion
SO3 2-|~sulfite ion|~ion sunfit|ion
HSO4 -|~hydrogensulfate ion|~ion hiđrosunfat|ion
CO3 2-|~carbonate ion|~ion cacbonat|ion
HCO3 -|~hydrogencarbonate ion|~ion hiđrocacbonat|ion
PO4 3-|~phosphate ion|~ion photphat|ion
HPO4 2-|~hydrogenphosphate ion|~ion hiđrophotphat|ion
H2PO4 -|~dihydrogenphosphate ion|~ion đihiđrophotphat|ion
S 2-|~sulfide ion|~ion sunfua|ion
O 2-|~oxide ion|~ion oxit|ion
CH3COO -|~acetate ion|~ion axetat|ion
MnO4 -|~permanganate ion|~ion pemanganat|ion
Cr2O7 2-|~dichromate ion|~ion đicromat|ion
CrO4 2-|~chromate ion|~ion cromat|ion
AlO2 -|~aluminate ion|~ion aluminat|ion`

// Cation: ký hiệu | điện tích | IUPAC | tên cũ | đa nguyên tử? (1)
const CATION = `Na|1|sodium|natri
K|1|potassium|kali
Li|1|lithium|liti
NH4|1|ammonium|amoni|1
Ag|1|silver|bạc
Cu|1|copper(I)|đồng(I)
Ca|2|calcium|canxi
Mg|2|magnesium|magie
Ba|2|barium|bari
Zn|2|zinc|kẽm
Fe|2|iron(II)|sắt(II)
Cu|2|copper(II)|đồng(II)
Pb|2|lead(II)|chì(II)
Mn|2|manganese(II)|mangan(II)
Ni|2|nickel(II)|niken(II)
Hg|2|mercury(II)|thuỷ ngân(II)
Al|3|aluminium|nhôm
Fe|3|iron(III)|sắt(III)
Cr|3|chromium(III)|crom(III)`
// Anion: ký hiệu | điện tích | IUPAC | tên cũ | đa nguyên tử? (1)
const ANION = `Cl|1|chloride|clorua
Br|1|bromide|bromua
I|1|iodide|iotua
F|1|fluoride|florua
NO3|1|nitrate|nitrat|1
NO2|1|nitrite|nitrit|1
HSO4|1|hydrogensulfate|hiđrosunfat|1
HCO3|1|hydrogencarbonate|hiđrocacbonat|1
H2PO4|1|dihydrogenphosphate|đihiđrophotphat|1
OH|1|hydroxide|hiđroxit|1
ClO|1|hypochlorite|hipoclorit|1
ClO3|1|chlorate|clorat|1
MnO4|1|permanganate|pemanganat|1
AlO2|1|aluminate|aluminat|1
SO4|2|sulfate|sunfat|1
SO3|2|sulfite|sunfit|1
CO3|2|carbonate|cacbonat|1
HPO4|2|hydrogenphosphate|hiđrophotphat|1
S|2|sulfide|sunfua
O|2|oxide|oxit
SiO3|2|silicate|silicat|1
CrO4|2|chromate|cromat|1
Cr2O7|2|dichromate|đicromat|1
PO4|3|phosphate|photphat|1`
// Cặp được sinh (chỉ hợp chất có thật, gặp trong chương trình). Khoá cation = «ký hiệu+điện tích».
const CAP = `Na1:Cl Br I F NO3 NO2 HSO4 HCO3 H2PO4 OH ClO ClO3 AlO2 SO4 SO3 CO3 HPO4 S O SiO3 CrO4 PO4
K1:Cl Br I F NO3 NO2 HSO4 HCO3 H2PO4 OH ClO ClO3 MnO4 SO4 SO3 CO3 HPO4 S O SiO3 CrO4 Cr2O7 PO4
Li1:Cl OH O NO3 SO4 CO3
NH41:Cl Br NO3 NO2 HCO3 H2PO4 SO4 CO3 HPO4 PO4
Ag1:Cl Br I F NO3 SO4 S O PO4
Cu1:Cl O
Ca2:Cl Br F NO3 HCO3 H2PO4 OH SO4 SO3 CO3 S O SiO3 PO4
Mg2:Cl Br NO3 HCO3 OH SO4 CO3 O PO4
Ba2:Cl Br NO3 HCO3 OH SO4 SO3 CO3 S O PO4 CrO4
Zn2:Cl NO3 OH SO4 CO3 S O
Fe2:Cl NO3 OH SO4 CO3 S O
Cu2:Cl Br NO3 OH SO4 CO3 S O
Pb2:Cl NO3 OH SO4 S O
Mn2:Cl SO4 O
Ni2:Cl NO3 SO4 OH
Hg2:Cl S O
Al3:Cl Br I NO3 OH SO4 S O PO4
Fe3:Cl Br NO3 OH SO4 O PO4
Cr3:Cl OH SO4 O`
// Tên thường gọi thêm cho vài chất sinh tự động (theo công thức).
const TEN_THEM = `NaCl|muối ăn
NaOH|xút ăn da;xút
KOH|potash ăn da
Na2CO3|soda;sođa
NaHCO3|baking soda;thuốc muối
CaCO3|đá vôi
CaO|vôi sống
Ca(OH)2|vôi tôi;nước vôi trong
KNO3|diêm tiêu
Fe2O3|hematite|IUPAC`
const BASE_MANH = new Set(['Na', 'K', 'Li', 'Ca', 'Ba'])
const LUONG_TINH = new Set(['Al', 'Zn', 'Cr'])

/** Một chất trong từ điển. `congThuc` rỗng ⇒ chất không có công thức ngắn (polymer). */
export type Chat = {
  congThuc: string // cách viết chính (ASCII, ion có dấu cách trước điện tích: «SO4 2-»)
  cachViet: string[] // mọi cách viết (đã chuẩn hoá) để tra
  ten: string // tên IUPAC hiện to
  tenKhac: string[] // tên IUPAC khác
  tenCu: string[] // tên cũ + tên thường gọi
  loai: string // nhãn loại chất
  tenDo: string[] // tên được dò trong đề (đã bỏ «~»)
}

const ucln = (a: number, b: number): number => (b ? ucln(b, a % b) : a)

let _ds: Chat[] | null = null
let _theoCt: Map<string, Chat[]> | null = null
let _theoPhanTu: Map<string, Chat[]> | null = null
let _theoTen: Map<string, Chat> | null = null
let _ionGoc: Map<string, string> | null = null

function taoChat(ctChu: string, iupac: string, cu: string, loai: string): Chat {
  const cachViet = ctChu ? ctChu.split('/').map(chuanCongThuc) : []
  const ten = iupac.split(';').map((s) => s.trim()).filter(Boolean)
  const tenCu = cu.split(';').map((s) => s.trim()).filter(Boolean)
  const bo = (s: string) => s.replace(/^~/, '')
  return {
    congThuc: ctChu.split('/')[0] ?? '',
    cachViet,
    ten: bo(ten[0] ?? ''),
    tenKhac: ten.slice(1).map(bo),
    tenCu: tenCu.map(bo),
    loai: LOAI[loai] ?? loai,
    tenDo: [...ten, ...tenCu].filter((s) => !s.startsWith('~')),
  }
}

/** Sinh muối / oxide / hydroxide từ bảng cation × anion (điện tích luôn cân bằng). */
export function sinhHopChat(): { congThuc: string; ten: string; tenCu: string; loai: string; dienTich: [number, number, number, number] }[] {
  const cat = new Map(CATION.split('\n').map((d) => { const [kh, q, ten, cu, da] = d.split('|'); return [kh + q, { kh, q: Number(q), ten, cu, da: da === '1' }] }))
  const an = new Map(ANION.split('\n').map((d) => { const [kh, q, ten, cu, da] = d.split('|'); return [kh, { kh, q: Number(q), ten, cu, da: da === '1' }] }))
  const ra: ReturnType<typeof sinhHopChat> = []
  for (const dong of CAP.split('\n')) {
    const [kc, dsA] = dong.split(':')
    const c = cat.get(kc)!
    for (const ka of dsA.split(' ')) {
      const a = an.get(ka)!
      const g = ucln(c.q, a.q)
      const nc = a.q / g; const na = c.q / g
      const phanC = nc > 1 ? (c.da ? `(${c.kh})${nc}` : `${c.kh}${nc}`) : c.kh
      const phanA = na > 1 ? (a.da ? `(${a.kh})${na}` : `${a.kh}${na}`) : a.kh
      let loai = 'mu'
      if (a.kh === 'O') loai = LUONG_TINH.has(c.kh) ? 'olt' : 'ob'
      if (a.kh === 'OH') loai = BASE_MANH.has(c.kh) ? 'bm' : LUONG_TINH.has(c.kh) ? 'hlt' : 'bkt'
      ra.push({ congThuc: phanC + phanA, ten: `${c.ten} ${a.ten}`, tenCu: `${c.cu} ${a.cu}`, loai, dienTich: [c.q, nc, a.q, na] })
    }
  }
  return ra
}

function napDuLieu() {
  if (_ds) return
  const ds: Chat[] = []
  for (const d of DONG.split('\n')) { const [ct, iu, cu, lo] = d.split('|'); ds.push(taoChat(ct, iu, cu, lo)) }
  const them = new Map(TEN_THEM.split('\n').map((d) => { const [ct, ten, kieu] = d.split('|'); return [chuanCongThuc(ct), { ten, kieu }] }))
  for (const h of sinhHopChat()) {
    const t = them.get(chuanCongThuc(h.congThuc))
    const iu = t?.kieu === 'IUPAC' ? `${h.ten};${t.ten}` : h.ten
    const cu = t && t.kieu !== 'IUPAC' ? `${h.tenCu};${t.ten}` : h.tenCu
    ds.push(taoChat(h.congThuc, iu, cu, h.loai))
  }
  const theoCt = new Map<string, Chat[]>(); const theoPhanTu = new Map<string, Chat[]>(); const theoTen = new Map<string, Chat>()
  const ionGoc = new Map<string, string>()
  for (const c of ds) {
    for (const v of c.cachViet) theoCt.set(v, [...(theoCt.get(v) ?? []), c])
    if (c.congThuc && c.loai !== LOAI.ion) {
      const p = phanTichCongThuc(c.congThuc)
      const pt = p ? hill(p) : null
      if (pt) theoPhanTu.set(pt, [...(theoPhanTu.get(pt) ?? []), c])
    }
    if (c.loai === LOAI.ion) ionGoc.set(chuanCongThuc(c.congThuc), c.congThuc.split(' ')[0])
    for (const t of [c.ten, ...c.tenKhac, ...c.tenCu]) { const k = khoaTen(t); if (k && !theoTen.has(k)) theoTen.set(k, c) }
  }
  _ds = ds; _theoCt = theoCt; _theoPhanTu = theoPhanTu; _theoTen = theoTen; _ionGoc = ionGoc
}
function ION_GOC(): Map<string, string> { napDuLieu(); return _ionGoc! }
/** Khoá tên: chữ thường, đ→d, thống nhất dấu thanh «oà/òa», «uỷ/ủy»; giữ nguyên độ dài chuỗi. */
export function khoaTen(s: string): string {
  return chuanChu(s.normalize('NFC')).trim().replace(/\s+/g, ' ')
}
const DAU_OA: Record<string, string> = {
  'òa': 'oà', 'óa': 'oá', 'ỏa': 'oả', 'õa': 'oã', 'ọa': 'oạ', 'òe': 'oè', 'óe': 'oé', 'ỏe': 'oẻ', 'õe': 'oẽ', 'ọe': 'oẹ',
  'ùy': 'uỳ', 'úy': 'uý', 'ủy': 'uỷ', 'ũy': 'uỹ', 'ụy': 'uỵ',
}
/** Chuẩn hoá chữ GIỮ ĐỘ DÀI (để vị trí ký tự khớp chữ đề gốc): chữ thường, đ→d, dấu thanh kiểu mới. */
export function chuanChu(s: string): string {
  let r = ''
  for (const c of s) { const l = c.toLowerCase(); r += l.length === c.length ? l : c }
  return r.replace(/đ/g, 'd').replace(/[òóỏõọ][ae]|[ùúủũụ]y/g, (m) => DAU_OA[m] ?? m)
}

/** Danh sách chất (nạp lười lần đầu gọi). */
export function danhSachChat(): readonly Chat[] { napDuLieu(); return _ds! }

/** Tra theo công thức như viết trong đề (NaOH, H₂SO₄, SO₄²⁻…). Cùng cách viết nhiều chất (C6H12O6) ⇒ trả mọi chất. */
export function traCongThuc(ct: string): Chat[] {
  napDuLieu()
  const k = chuanCongThuc(ct)
  const dung = _theoCt!.get(k)
  if (dung) return dung
  const pt = congThucPhanTu(k)
  return pt ? (_theoPhanTu!.get(pt) ?? []) : []
}

/** Tra theo tên (IUPAC hoặc tên cũ, không phân biệt hoa thường, «hiđroxit» = «hidroxit»). */
export function traTen(ten: string): Chat | null {
  napDuLieu()
  return _theoTen!.get(khoaTen(ten)) ?? null
}

/** Mọi tên được dò trong đề (đã chuẩn hoá bằng khoaTen), cho bộ phát hiện. */
export function tenDeDo(): string[] {
  napDuLieu()
  const s = new Set<string>()
  for (const c of _ds!) for (const t of c.tenDo) s.add(khoaTen(t))
  return [...s]
}

/** Ion có trong từ điển (khoá đã chuẩn hoá, vd «SO42-»)? */
export function laIon(ct: string): boolean { return ION_GOC().has(chuanCongThuc(ct)) }

/**
 * Đọc bảng nguyên tử khối đề cho, vd «Cho nguyên tử khối: H = 1; C = 12; Cl = 35,5».
 * Trả về bảng (chỉ ký hiệu có trong bảng tuần hoàn của từ điển) và các khoảng ký tự của mệnh đề đó (bộ dò không tô gì trong khoảng này).
 */
export function docNguyenTuKhoiTrongDe(chuDe: string): { bang: Record<string, number>; khoang: [number, number][] } {
  const bang: Record<string, number> = {}
  const khoang: [number, number][] = []
  const re = /(?:\b[A-Z][a-z]?\s*=\s*\d+(?:[,.]\d+)?\s*[;,]\s*)+[A-Z][a-z]?\s*=\s*\d+(?:[,.]\d+)?/g
  for (const m of chuDe.matchAll(re)) {
    let tu = m.index!
    const den = tu + m[0].length
    for (const c of m[0].matchAll(/([A-Z][a-z]?)\s*=\s*(\d+(?:[,.]\d+)?)/g)) {
      if (NGUYEN_TU_KHOI[c[1]] !== undefined) bang[c[1]] = Number(c[2].replace(',', '.'))
    }
    // kéo ngược để gồm cả «Cho (biết) nguyên tử khối …:» đứng trước
    const truoc = chuDe.slice(Math.max(0, tu - 80), tu)
    const mt = /(?:\(\s*)?(?:cho|biết)[^.?!]*?(?:nguyên tử khối|ntk|khối lượng mol)[^.?!]*?$/i.exec(truoc)
    if (mt) tu -= truoc.length - mt.index
    khoang.push([tu, den])
  }
  return { bang, khoang }
}
