// CHAT TRONG LIVE THEO KHỐI — LÕI THUẦN (không DOM, không React). Hợp đồng kênh: ./kieu.ts (`TinLop`, `ChatNhan`, `CHAT_DAI`, `CHAT_NHIP_MS`).
// Phòng đóng dấu người gửi, cắt 200 ký tự, giới hạn nhịp và phát lại cho mọi máy (kể cả máy gửi) ⇒ máy chỉ hiện tin phòng phát về.
import { CHAT_DAI, CHAT_NHIP_MS, type ChatNhan, type TinLop } from './kieu'

export interface TinChat {
  /** `${l}-${s}` — giờ phòng + số báo danh người gửi. */
  id: string
  sbd: string
  ten: string
  /** 0..3 theo DOI_BPU; -1 = không đội (thầy). */
  doi: number
  /** Giờ phòng (ms). */
  luc: number
  chu: string
  /** Câu hỏi của em: có dấu «?» hoặc mở đầu «thầy ơi», «cho em hỏi»… */
  hoi: boolean
  thay: boolean
}

/** Số tin giữ trên máy (bằng số tin phòng giữ cho em vào muộn). */
export const CHAT_GIU = 200

/** Bỏ dấu + chữ thường để so chuỗi không phân biệt hoa thường / dấu. */
const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
const MO_DAU_HOI = ['thay oi', 'thay cho em hoi', 'thay cho hoi', 'cho em hoi', 'em hoi', 'em muon hoi', 'co oi']

/** Tin này có phải câu hỏi không (để thầy lọc «Câu hỏi»). */
export function laCauHoi(chu: string): boolean {
  if (chu.includes('?')) return true
  const s = boDau(chu).replace(/\s+/g, ' ').trim()
  return MO_DAU_HOI.some((m) => s === m || s.startsWith(m + ' ') || s.startsWith(m + ',') || s.startsWith(m + ':'))
}

const noiDung = (tin: TinLop): ChatNhan => (tin.x && typeof tin.x === 'object' ? (tin.x as ChatNhan) : {})

/** Tin khoá / mở chat của thầy: `true` = đang tắt nhắn tin, `false` = đã mở lại, `null` = không phải tin khoá. Chỉ nhận dấu 'gv' do phòng đóng. */
export function docKhoa(tin: TinLop): boolean | null {
  if (tin.k !== 'chat' || tin.s !== 'gv') return null
  const tat = noiDung(tin).tat
  return typeof tat === 'boolean' ? tat : null
}

/** Đổi tin phòng thành tin chat; tin không có chữ (khoá, tin lạ) ⇒ null. */
export function docTin(tin: TinLop): TinChat | null {
  if (tin.k !== 'chat' || !Number.isFinite(tin.l)) return null
  const c = noiDung(tin).c
  if (typeof c !== 'string') return null
  const chu = c.trim().slice(0, CHAT_DAI)
  if (!chu) return null
  const thay = tin.s === 'gv'
  return { id: `${tin.l}-${tin.s}`, sbd: tin.s, ten: tin.n || (thay ? 'Thầy' : tin.s), doi: Number.isInteger(tin.d) ? tin.d : -1, luc: tin.l, chu, hoi: !thay && laCauHoi(chu), thay }
}

/** Thêm một tin phòng vào danh sách: khử trùng theo id, sắp theo giờ, giữ 200 tin mới nhất. Không đổi gì ⇒ trả đúng mảng cũ. */
export function nhanTin(ds: TinChat[], tin: TinLop): TinChat[] {
  const moi = docTin(tin)
  if (!moi || ds.some((t) => t.id === moi.id)) return ds
  const cuoi = ds[ds.length - 1]
  const ra = !cuoi || cuoi.luc <= moi.luc ? [...ds, moi] : [...ds, moi].sort((a, b) => a.luc - b.luc)
  return ra.length > CHAT_GIU ? ra.slice(ra.length - CHAT_GIU) : ra
}

/** Chữ sắp gửi: cắt khoảng trắng hai đầu, rỗng ⇒ null, dài quá ⇒ cắt còn CHAT_DAI ký tự. */
export function chuanGui(chu: string): string | null {
  const s = chu.trim().slice(0, CHAT_DAI).trim()
  return s || null
}

/** Đã đủ nhịp để gửi tin kế chưa (mỗi em 1 tin / 2 giây). `lucGuiCuoi` = 0 khi chưa gửi lần nào. */
export const duocGui = (lucGuiCuoi: number, nay: number) => nay - lucGuiCuoi >= CHAT_NHIP_MS

// ── CÔNG THỨC HOÁ GÕ THƯỜNG ⇒ CHỈ SỐ DƯỚI ──
// Chỉ đổi một CỤM liền (chữ cái La-tinh không dấu + số + ngoặc) khi CẢ cụm đọc được thành công thức: ký hiệu nguyên tố thật, số đứng ngay sau ký hiệu
// hoặc sau dấu đóng ngoặc. Số đứng riêng («câu 11», «9,6», «0,1 mol») và hệ số đứng đầu («2H2O») giữ nguyên.
const NGUYEN_TO = new Set(
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Ag Cd In Sn Sb Te I Xe Cs Ba La W Pt Au Hg Pb Bi U'.split(' '),
)
export interface ManhChu { t: string; duoi?: boolean }
const laSo = (c: string | undefined) => c !== undefined && c >= '0' && c <= '9'

function docCum(cum: string): ManhChu[] | null {
  const ra: ManhChu[] = []
  let i = 0, sau = 0, coDuoi = false, coNguyenTo = false, thuong = ''
  const docSo = () => { let j = i; while (laSo(cum[j])) j++; const so = cum.slice(i, j); i = j; return so }
  thuong += docSo() // hệ số đứng đầu
  while (i < cum.length) {
    const c = cum[i]
    if (c === '(') { sau++; thuong += c; i++; continue }
    if (c === ')') { if (--sau < 0) return null; thuong += c; i++ }
    else {
      const hai = cum.slice(i, i + 2), kyHieu = /^[A-Z][a-z]$/.test(hai) && NGUYEN_TO.has(hai) ? hai : NGUYEN_TO.has(c) ? c : ''
      if (!kyHieu) return null
      coNguyenTo = true; thuong += kyHieu; i += kyHieu.length
    }
    const so = docSo()
    if (!so) continue
    if (so.length > 3) return null
    ra.push({ t: thuong }, { t: so, duoi: true }); thuong = ''; coDuoi = true
  }
  if (sau !== 0 || !coDuoi || !coNguyenTo) return null
  if (thuong) ra.push({ t: thuong })
  return ra
}
/** Thử cả cụm; hỏng vì ngoặc của câu văn dính vào («(CH3COONa», «H2O)») thì gỡ một ngoặc ngoài rồi thử lại. */
function docCumNoi(cum: string): ManhChu[] | null {
  const ra = docCum(cum)
  if (ra || cum.length < 3) return ra
  if (cum[0] === '(') { const trong = docCumNoi(cum.slice(1)); return trong && [{ t: '(' }, ...trong] }
  if (cum[cum.length - 1] === ')') { const trong = docCumNoi(cum.slice(0, -1)); return trong && [...trong, { t: ')' }] }
  return null
}

const LA_CHU = /\p{L}/u
/** Tách chữ thành mảnh thường / mảnh chỉ số dưới (`duoi`) để vẽ bằng thẻ <sub>. */
export function chuCongThuc(chu: string): ManhChu[] {
  const ra: ManhChu[] = []
  const them = (m: ManhChu) => { const cuoi = ra[ra.length - 1]; if (cuoi && !cuoi.duoi && !m.duoi) cuoi.t += m.t; else if (m.t) ra.push({ ...m }) }
  let tu = 0
  for (const m of chu.matchAll(/[A-Za-z0-9()]+/g)) {
    const dau = m.index ?? 0, cuoi = dau + m[0].length
    // Dính liền chữ có dấu («Hải2») ⇒ là từ tiếng Việt, không phải công thức.
    const dinh = (dau > 0 && LA_CHU.test(chu[dau - 1])) || (cuoi < chu.length && LA_CHU.test(chu[cuoi]))
    const manh = dinh || !/\d/.test(m[0]) ? null : docCumNoi(m[0])
    if (!manh) continue
    them({ t: chu.slice(tu, dau) })
    manh.forEach(them)
    tu = cuoi
  }
  them({ t: chu.slice(tu) })
  return ra
}

const hai = (n: number) => String(n).padStart(2, '0')
/** Giờ Việt Nam «19:52» — tính tay UTC+7 để không lệ thuộc múi giờ của máy. */
export function gioHien(luc: number): string {
  const phut = Math.floor((luc + 7 * 3600_000) / 60_000)
  return `${hai(((Math.floor(phut / 60) % 24) + 24) % 24)}:${hai(((phut % 60) + 60) % 60)}`
}

/** Chữ tắt trong ô tròn: chữ cái đầu của hai từ cuối («Nguyễn Thu Hà» ⇒ «TH»). */
export function tenTat(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean).slice(-2)
  return tu.map((x) => Array.from(x)[0].toUpperCase()).join('') || '?'
}
