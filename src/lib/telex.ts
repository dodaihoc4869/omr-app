// BỘ GÕ TELEX CHO BÀN PHÍM TRONG APP (thầy 13/11 «ép bàn phím xoay ngang» — hình live đang xoay 90° thì bàn phím hệ thống nằm ngang chữ, không gõ được
// ⇒ ngăn chat tự vẽ bàn phím, chữ đi qua bộ gõ này). Thuần, KHÔNG nhớ trạng thái: mỗi phím áp lên TỪ CUỐI của chuỗi đang có.
//   · mũ / móc: aa â · aw ă · ee ê · oo ô · ow ơ · uw ư · dd đ · «uo» + w ⇒ ươ
//   · dấu thanh: s sắc · f huyền · r hỏi · x ngã · j nặng · z xoá dấu thanh; dấu đặt theo chính tả phổ thông kiểu mới (hoà, quả, thuỷ, nghĩa, được, người)
//   · gõ lại đúng phím vừa biến đổi ⇒ HOÀN TÁC, ra chữ gốc (aaa → aa, ass → as, ddd → dd)
//   · từ không ghép được thành tiếng Việt (không nguyên âm, phụ âm đầu / cuối lạ, cụm nguyên âm lạ) ⇒ nối thường
//   · PHÍM HOA KHÔNG BAO GIỜ BIẾN ĐỔI — lớp Hoá gõ công thức bằng chữ hoa (CH3COOH, CuSO4, NaF, BaSO4): nếu «OO» thành «Ô», «uS» thành «ú» thì hỏng công thức.
//     Chữ hoa có dấu vẫn gõ được như thường: phím biến đổi gõ THƯỜNG, chữ bị đổi giữ nguyên hoa / thường của nó (Dd ⇒ Đ, Thaayf ⇒ Thầy, Ow ⇒ Ơ).

/** Sáu dạng thanh của từng nguyên âm: ngang · sắc · huyền · hỏi · ngã · nặng. */
const BANG_THANH = ['aáàảãạ', 'ăắằẳẵặ', 'âấầẩẫậ', 'eéèẻẽẹ', 'êếềểễệ', 'iíìỉĩị', 'oóòỏõọ', 'ôốồổỗộ', 'ơớờởỡợ', 'uúùủũụ', 'ưứừửữự', 'yýỳỷỹỵ']
/** chữ có dấu thanh ⇒ [nguyên âm gốc, số thanh] */
const TACH = new Map<string, readonly [string, number]>()
for (const h of BANG_THANH) [...h].forEach((c, i) => TACH.set(c, [h[0]!, i]))
const PHIM_THANH: Record<string, number> = { z: 0, s: 1, f: 2, r: 3, x: 4, j: 5 }
/** bỏ mũ / móc: ă â ⇒ a · ê ⇒ e · ô ơ ⇒ o · ư ⇒ u */
const TRAN: Record<string, string> = { ă: 'a', â: 'a', ê: 'e', ô: 'o', ơ: 'o', ư: 'u' }
const tran = (v: string): string => [...v].map((c) => TRAN[c] ?? c).join('')

const DAU = new Set(['', ...'b c ch d đ g gh gi h k kh l m n ng ngh nh p ph qu r s t th tr v x'.split(' ')])
const CUOI = new Set(['', ...'c ch m n ng nh p t'.split(' ')])
/** Cụm nguyên âm KHÔNG đi với phụ âm cuối. */
const VAN_MO = 'ai ao au ay âu ây eo êu ia iu oi ôi ơi ua ưa ưi ưu ui uơ iêu yêu oai oao oay oeo uây uôi ươi ươu uya uyu'.split(' ')
/** Cụm nguyên âm đi được với phụ âm cuối (lúc đang gõ dở thì chưa có phụ âm cuối cũng nhận). */
const VAN_DONG = 'a ă â e ê i o ô ơ u ư y iê oa oă oe oo uâ uê uô uy ươ yê uyê'.split(' ')
const VAN = new Map<string, boolean>([...VAN_MO.map((v) => [v, true] as const), ...VAN_DONG.map((v) => [v, false] as const)])
/** Cụm đang gõ dở (chưa thêm mũ / móc) vẫn nhận dấu thanh: «nguoif» + w ⇒ «người». */
const VAN_TRAN = new Set([...VAN.keys()].map(tran))
const vanHop = (v: string, coCuoi: boolean): boolean => { const mo = VAN.get(v); return mo !== undefined && !(mo && coCuoi) }

const LA_CHU = /\p{L}/u
const TU_CUOI = /\p{L}+$/u
const DAI_NHAT = 8 // tiếng Việt dài nhất 7 chữ («nghiêng»); dài hơn ⇒ không phải một tiếng

interface Chu { /** chữ gốc viết thường, không dấu thanh */ g: string; hoa: boolean }
interface Tu { dau: Chu[]; van: Chu[]; cuoi: Chu[]; thanh: number }

/** Tách một từ thành phụ âm đầu · cụm nguyên âm · phụ âm cuối · thanh. null = không có dạng đó (nguyên âm rời nhau, hai dấu thanh). */
function tach(tu: string): Tu | null {
  const ds: Chu[] = []
  let thanh = 0
  for (const c of tu.normalize('NFC')) {
    const thuong = c.toLowerCase(), t = TACH.get(thuong)
    if (t && t[1]) { if (thanh) return null; thanh = t[1] }
    ds.push({ g: t ? t[0] : thuong, hoa: c !== thuong })
  }
  const laNa = (c: Chu): boolean => TACH.has(c.g)
  let a = ds.findIndex(laNa)
  if (a < 0) return { dau: ds, van: [], cuoi: [], thanh }
  let b = a
  while (b < ds.length && laNa(ds[b]!)) b++
  if (ds.slice(b).some(laNa)) return null
  // «gi» + nguyên âm, «qu» + nguyên âm: chữ i / u thuộc phụ âm đầu (già, quả, giường, quyển)
  const truoc = ds.slice(0, a).map((c) => c.g).join('')
  if (b - a > 1 && ((truoc === 'g' && ds[a]!.g === 'i') || (truoc === 'q' && ds[a]!.g === 'u'))) a++
  return { dau: ds.slice(0, a), van: ds.slice(a, b), cuoi: ds.slice(b), thanh }
}
const noi = (ds: Chu[]): string => ds.map((c) => c.g).join('')
/** Từ ghép được thành tiếng Việt (kể cả đang gõ dở, chưa thêm mũ / móc). */
const hopLe = (t: Tu): boolean => t.van.length > 0 && DAU.has(noi(t.dau)) && CUOI.has(noi(t.cuoi)) && VAN_TRAN.has(tran(noi(t.van)))

/** Dấu thanh nằm ở nguyên âm thứ mấy của cụm. */
function choThanh(van: string, coCuoi: boolean): number {
  const n = van.length
  // có mũ / móc ⇒ ở đó; «ươ» ⇒ ở ơ (được, người)
  const o = van.indexOf('ơ')
  if (o >= 0) return o
  for (let i = n - 1; i >= 0; i--) if (TRAN[van[i]!]) return i
  if (n === 1) return 0
  if (coCuoi) return n - 1 // hoàng, toán, huýt
  const v = tran(van)
  if (n === 2) return v === 'oa' || v === 'oe' || v === 'uy' || v === 'ie' || v === 'ye' || v === 'uo' ? 1 : 0 // hoà, khoẻ, thuỷ · mái, nghĩa, của
  return v === 'uye' ? 2 : 1 // ngoái, xoáy, khuỷu
}

function ghep(t: Tu): string {
  // «ưo» còn chữ theo sau (ngưoi, đưoc) ⇒ «ươ»
  const van = t.van.map((c) => ({ ...c }))
  for (let i = 0; i + 1 < van.length; i++) if (van[i]!.g === 'ư' && van[i + 1]!.g === 'o' && (i + 2 < van.length || t.cuoi.length)) van[i + 1]!.g = 'ơ'
  const cho = t.thanh && van.length ? choThanh(noi(van), t.cuoi.length > 0) : -1
  const ra = (c: Chu, thanh = 0): string => { const k = thanh ? BANG_THANH.find((h) => h[0] === c.g)![thanh]! : c.g; return c.hoa ? k.toUpperCase() : k }
  return t.dau.map((c) => ra(c)).join('') + van.map((c, i) => ra(c, i === cho ? t.thanh : 0)).join('') + t.cuoi.map((c) => ra(c)).join('')
}
const doiVan = (t: Tu, doi: (g: string, i: number) => string): Tu => ({ ...t, van: t.van.map((c, i) => ({ ...c, g: doi(c.g, i) })) })

/** Phím thêm mũ (a ⇒ â, e ⇒ ê, o ⇒ ô). Trả từ mới, hoặc null = phím này không biến đổi được từ. */
function themMu(t: Tu, phim: string): string | null {
  const dich = phim === 'a' ? 'â' : phim === 'e' ? 'ê' : 'ô'
  const van = noi(t.van)
  // đã có mũ ⇒ hoàn tác: bỏ mũ, nối phím (aaa → aa)
  if (van.includes(dich)) return ghep(doiVan(t, (g) => (g === dich ? phim : g))) + phim
  const nguon = phim === 'a' ? 'aă' : phim === 'e' ? 'e' : 'oơ'
  let i = t.van.length - 1
  while (i >= 0 && !nguon.includes(t.van[i]!.g)) i--
  if (i < 0) return null
  const moi = doiVan(t, (g, j) => (j === i ? dich : g))
  return vanHop(noi(moi.van), t.cuoi.length > 0) ? ghep(moi) : null
}

/** Phím w: «uo» ⇒ ươ · a ⇒ ă · u ⇒ ư · o ⇒ ơ; chọn cách đầu tiên ra cụm nguyên âm có thật (mua ⇒ mưa, hoa ⇒ hoă, luu ⇒ lưu, nguoi ⇒ ngươi). */
function themMoc(t: Tu, phim: string): string | null {
  const coCuoi = t.cuoi.length > 0, g = t.van.map((c) => c.g)
  const thu: Tu[] = []
  const cap = g.findIndex((c, i) => (c === 'u' || c === 'ư') && 'oôơ'.includes(g[i + 1] ?? ' '))
  if (cap >= 0 && !(g[cap] === 'ư' && g[cap + 1] === 'ơ')) thu.push(doiVan(t, (c, i) => (i === cap ? 'ư' : i === cap + 1 ? 'ơ' : c)))
  const a = Math.max(g.lastIndexOf('a'), g.lastIndexOf('â'))
  if (a >= 0) thu.push(doiVan(t, (c, i) => (i === a ? 'ă' : c)))
  const u = g.indexOf('u')
  if (u >= 0) thu.push(doiVan(t, (c, i) => (i === u ? 'ư' : c)))
  const o = Math.max(g.lastIndexOf('o'), g.lastIndexOf('ô'))
  if (o >= 0) thu.push(doiVan(t, (c, i) => (i === o ? 'ơ' : c)))
  const duoc = thu.find((m) => vanHop(noi(m.van), coCuoi))
  if (duoc) return ghep(duoc)
  // đã có móc / trăng ⇒ hoàn tác (ưw → uw, ươw → uow, ăw → aw)
  const MOC: Record<string, string> = { ă: 'a', ư: 'u', ơ: 'o' }
  return g.some((c) => MOC[c]) ? ghep(doiVan(t, (c) => MOC[c] ?? c)) + phim : null
}

/** TỪ MƯỢN viết liền nhiều âm tiết của môn Hoá (bazơ, nitơ, glucozơ, hiđro, anđehit) không tách được thành một tiếng ⇒ chỉ nhận ba phép SÁT CUỐI từ:
 *  o + w ⇒ ơ · u + w ⇒ ư · d + d ⇒ đ (và hoàn tác), với điều kiện phía trước đã có nguyên âm («show», «add» đầu từ không dính). */
function tuMuon(tu: string, phim: string): string | null {
  const ds = [...tu], cuoi = ds[ds.length - 1]!, c = cuoi.toLowerCase()
  if (!ds.slice(0, -1).some((k) => TACH.has(k.toLowerCase()))) return null
  const DOI: Record<string, string> = phim === 'w' ? { o: 'ơ', u: 'ư' } : phim === 'd' ? { d: 'đ' } : {}
  const giu = (k: string): string => ds.slice(0, -1).join('') + (cuoi === c ? k : k.toUpperCase())
  if (DOI[c]) return giu(DOI[c])
  const nguoc = Object.keys(DOI).find((k) => DOI[k] === c)
  return nguoc ? giu(nguoc) + phim : null
}

/** Gõ thêm MỘT phím (chữ, chữ số, dấu câu, dấu cách) vào cuối chuỗi theo kiểu Telex. */
export function goTelex(chuoi: string, phim: string): string {
  const thuong = phim.toLowerCase()
  // không phải chữ, hoặc PHÍM HOA (công thức hoá) ⇒ nối thường
  if (phim.length !== 1 || !LA_CHU.test(phim) || phim !== thuong) return chuoi + phim
  const tu = TU_CUOI.exec(chuoi)?.[0] ?? ''
  const goc = chuoi.slice(0, chuoi.length - tu.length)
  // chữ dính liền sau chữ số / ngoặc đóng là công thức gõ thường (ch3cooh, c2h5oh, (oh)2) ⇒ nối thường
  if (!tu || /[\d)]$/.test(goc)) return chuoi + phim
  const t = tu.length > DAI_NHAT ? null : tach(tu)
  if (!t || !hopLe(t)) {
    const muon = tuMuon(tu, thuong)
    if (muon !== null) return goc + muon
  }
  if (!t) return chuoi + phim

  // dd ⇒ đ (gõ ở cuối từ cũng được: «dangd» ⇒ «đang»); đ + d ⇒ hoàn tác
  if (thuong === 'd' && t.dau.length === 1 && (t.van.length === 0 ? t.cuoi.length === 0 : hopLe({ ...t, dau: [{ g: 'd', hoa: false }] }))) {
    const d = t.dau[0]!
    if (d.g === 'đ') return goc + ghep({ ...t, dau: [{ ...d, g: 'd' }] }) + phim
    if (d.g === 'd') return goc + ghep({ ...t, dau: [{ ...d, g: 'đ' }] })
  }
  if (hopLe(t)) {
    const thanh = PHIM_THANH[thuong]
    if (thanh !== undefined) {
      if (thanh === t.thanh) return thanh ? goc + ghep({ ...t, thanh: 0 }) + phim : chuoi + phim // ass → as · z khi chưa có dấu ⇒ chữ z
      return goc + ghep({ ...t, thanh })
    }
    const moi = thuong === 'a' || thuong === 'e' || thuong === 'o' ? themMu(t, thuong) : thuong === 'w' ? themMoc(t, thuong) : null
    if (moi !== null) return goc + moi
  }
  // nối thường; từ đang có dấu thanh / «ưo» mà vẫn ghép được ⇒ xếp lại chỗ đặt dấu (toas + n ⇒ toán, ngưo + i ⇒ ngươi)
  const them = tach(tu + phim)
  return them && hopLe(them) && (them.thanh || noi(them.van).includes('ưo')) ? goc + ghep(them) : chuoi + phim
}

const DAU_ROI = /\p{M}/u
/** Xoá lùi MỘT ký tự: chữ có dấu (kể cả dạng dấu rời) và ký tự ngoài mặt phẳng cơ bản đều tính là một. */
export function xoaLui(chuoi: string): string {
  const ds = [...chuoi]
  while (ds.length > 1 && DAU_ROI.test(ds[ds.length - 1]!)) ds.pop()
  ds.pop()
  return ds.join('')
}
