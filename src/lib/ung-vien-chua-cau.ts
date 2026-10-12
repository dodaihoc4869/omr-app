// ỨNG VIÊN GỌI LÊN BẢNG CHO TỪNG CÂU — Hành trình › Chữa bài › "Chữa câu khó & tính toán" (thầy 12/10: "chữa câu khó và tính toán cũng phải chiếu lên
// bảng theo chuẩn nhé" — chuẩn Chiếu lên bảng: mỗi đợt một câu, gọi MỘT em lên bảng, chấm Đạt / Chưa đạt vào sổ).
//
// NGUỒN (chỉ đọc):
//   · em làm sai: `/gv/ai-sai-nhieu-cau {sbd, qids}` — MỘT lệnh cho cả đề, chỉ em của lớp, ứng viên = em có lần làm MỚI NHẤT sai (server/src/ai-sai-nhieu-cau.ts).
//     Máy chủ cũ chưa có lệnh (404) ⇒ lùi về lệnh sẵn có `/gv/ai-sai-cau` TỪNG CÂU (tối đa `TRAN_CAU_TUNG_CAU` câu đầu theo thứ tự chiếu, 4 lệnh cùng lúc),
//     lọc em của lớp — khi ấy là em TỪNG sai (lệnh cũ không trả lượt đúng) và không có số "em đã làm".
//   · em có mặt: buổi điểm danh ĐANG MỞ hôm nay (`/gv/buoi-hoc` `gan-day`, lệnh sẵn có của Điểm danh). Không có buổi nào ⇒ không biết ai có mặt (null),
//     vẫn liệt kê em sai, không đoán.
// XẾP (`xepUngVien`, thuần): mỗi câu — em CÓ MẶT trước, rồi nhiều lần sai trước, rồi sai gần đây trước, rồi tên. Người đầu của mỗi câu ưu tiên em CHƯA là
// người đầu của câu trước (cả lớp cùng được gọi, không dồn một em) — nhưng có mặt luôn thắng "chưa gọi".
import { goiLenh } from './goi-lenh-thay'
import { taiGioiHan } from './tai-gioi-han'

export interface EmSaiCau {
  sbd: string
  ten: string
  /** Số lượt sai của em ở câu này (mọi kênh). */
  soLanSai: number
  /** Lúc sai gần nhất (ISO). */
  lucSai: string
  /** Số giây của lần sai gần nhất; null = không đo được. */
  giay: number | null
  /** Số giây ƯỚC TÍNH (lượt game cũ không đo). */
  uocTinh?: boolean
}
export interface SaiCuaCau {
  /** Số em của lớp đã làm câu; null = không biết (lệnh từng câu). */
  lam: number | null
  sai: EmSaiCau[]
}
/** `coMat`: true có mặt buổi đang mở hôm nay · false chưa điểm danh · null không có buổi điểm danh nào đang mở. */
export interface UngVien extends EmSaiCau {
  coMat: boolean | null
}

export const TRAN_EM_UV = 200
export const TRAN_CAU_UV = 120
export const TRAN_CAU_TUNG_CAU = 30
const KHONG_CO_LENH = 'Máy chủ chưa có lệnh tra em làm sai theo lô.'

const chu = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const soHayNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null)

function docEmSai(v: unknown): EmSaiCau | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const sbd = chu(o.sbd)
  if (!sbd) return null
  return {
    sbd,
    ten: chu(o.ten) || sbd,
    soLanSai: Math.max(1, Math.round(Number(o.soLanSai) || 1)),
    lucSai: chu(o.lucSai),
    giay: soHayNull(o.giay),
    ...(o.uocTinh === true ? { uocTinh: true } : {}),
  }
}

/** Đọc kết quả `/gv/ai-sai-nhieu-cau` (chống sai kiểu: dòng thiếu SBD bị bỏ). */
export function docSaiNhieuCau(du: Record<string, unknown>): Record<string, SaiCuaCau> {
  const ra: Record<string, SaiCuaCau> = {}
  const cau = du.cau && typeof du.cau === 'object' ? (du.cau as Record<string, unknown>) : {}
  for (const [qid, v] of Object.entries(cau)) {
    const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
    const lam = Number(o.lam)
    ra[qid] = { lam: Number.isFinite(lam) && lam >= 0 ? Math.round(lam) : null, sai: (Array.isArray(o.sai) ? o.sai : []).map(docEmSai).filter((x): x is EmSaiCau => !!x) }
  }
  return ra
}

/** Gom các lượt sai của `/gv/ai-sai-cau` (một câu, mọi em) thành em sai của lớp: số lượt · lần gần nhất · giây của lần ấy. */
export function gomLuotSai(ds: readonly { sbd?: unknown; ten?: unknown; luc?: unknown; giay?: unknown; uocTinh?: unknown }[], lop: ReadonlySet<string>): EmSaiCau[] {
  const theoEm = new Map<string, EmSaiCau>()
  for (const x of ds) {
    const sbd = chu(x.sbd)
    if (!sbd || !lop.has(sbd)) continue
    const luc = chu(x.luc)
    const cu = theoEm.get(sbd)
    if (!cu) {
      theoEm.set(sbd, { sbd, ten: chu(x.ten) || sbd, soLanSai: 1, lucSai: luc, giay: soHayNull(x.giay), ...(x.uocTinh === true ? { uocTinh: true } : {}) })
      continue
    }
    cu.soLanSai++
    if (luc > cu.lucSai) {
      cu.lucSai = luc
      cu.giay = soHayNull(x.giay)
      if (x.uocTinh === true) cu.uocTinh = true
      else delete cu.uocTinh
    }
  }
  return [...theoEm.values()].sort((a, b) => b.soLanSai - a.soLanSai || (a.lucSai < b.lucSai ? 1 : a.lucSai > b.lucSai ? -1 : 0) || a.ten.localeCompare(b.ten, 'vi'))
}

export type KetQuaSai = { ok: true; cau: Record<string, SaiCuaCau>; tungCau: boolean } | { ok: false; chu: string }

/** Em của lớp làm sai từng câu (theo lô; máy chủ cũ ⇒ từng câu). Không ném lỗi. */
export async function laySaiNhieuCau(sbd: readonly string[], qids: readonly string[]): Promise<KetQuaSai> {
  const em = [...new Set(sbd)].slice(0, TRAN_EM_UV)
  const cau = [...new Set(qids)].slice(0, TRAN_CAU_UV)
  if (!em.length || !cau.length) return { ok: true, cau: {}, tungCau: false }
  const r = await goiLenh('/gv/ai-sai-nhieu-cau', { sbd: em, qids: cau }, KHONG_CO_LENH)
  if (r.ok) return { ok: true, cau: docSaiNhieuCau(r.du), tungCau: false }
  if (r.loai !== 'chua_co_lenh') return { ok: false, chu: r.chu }
  // Máy chủ cũ: lệnh sẵn có MỘT câu, lọc em của lớp.
  const lop = new Set(em)
  const tung = cau.slice(0, TRAN_CAU_TUNG_CAU)
  let loi = ''
  const kq = await taiGioiHan(tung, async (q) => {
    const x = await goiLenh('/gv/ai-sai-cau', { qids: [q] }, 'Máy chủ chưa có lệnh tra em làm sai.')
    if (!x.ok) {
      loi ||= x.chu
      return null
    }
    return gomLuotSai(Array.isArray(x.du.ds) ? (x.du.ds as Record<string, unknown>[]) : [], lop)
  })
  if (tung.length && kq.every((x) => x === null)) return { ok: false, chu: loi || 'Chưa đọc được danh sách em làm sai.' }
  const ra: Record<string, SaiCuaCau> = {}
  tung.forEach((q, i) => {
    const s = kq[i]
    if (s) ra[q] = { lam: null, sai: s }
  })
  return { ok: true, cau: ra, tungCau: true }
}

/** Ngày Việt Nam (UTC+7) của một mốc ISO / ms: "2026-10-12". */
export function ngayVnCua(moc: string | number): string {
  const t = typeof moc === 'number' ? moc : Date.parse(moc)
  return Number.isFinite(t) ? new Date(t + 7 * 3_600_000).toISOString().slice(0, 10) : ''
}

/** Em có mặt ở buổi điểm danh ĐANG MỞ hôm nay (mọi buổi mở hôm nay gộp lại). null = không đọc được / không có buổi nào đang mở. */
export async function docCoMatHomNay(nowMs = Date.now()): Promise<ReadonlySet<string> | null> {
  try {
    const { buoiGanDay } = await import('./buoi-hoc-api')
    const r = await buoiGanDay('', 1)
    if (!r.ok) return null
    const homNay = ngayVnCua(nowMs)
    const mo = r.du.filter((b) => b.dangMo && ngayVnCua(b.moLuc) === homNay)
    if (!mo.length) return null
    return new Set(mo.flatMap((b) => b.coMat))
  } catch {
    return null
  }
}

/** Xếp ứng viên của mọi câu (đúng thứ tự chiếu `qids`). Xem đầu tệp. */
export function xepUngVien(qids: readonly string[], sai: Readonly<Record<string, SaiCuaCau>>, coMat: ReadonlySet<string> | null): Map<string, UngVien[]> {
  const ra = new Map<string, UngVien[]>()
  const daDau = new Set<string>()
  for (const q of qids) {
    if (ra.has(q)) continue
    const ds: UngVien[] = (sai[q]?.sai ?? []).map((e) => ({ ...e, coMat: coMat ? coMat.has(e.sbd) : null }))
    ds.sort((a, b) => Number(b.coMat === true) - Number(a.coMat === true) || b.soLanSai - a.soLanSai || (a.lucSai < b.lucSai ? 1 : a.lucSai > b.lucSai ? -1 : 0) || a.ten.localeCompare(b.ten, 'vi'))
    if (ds.length) {
      // người đầu: em có mặt (nếu có) chưa là người đầu câu trước; hết thì em đứng đầu như đã xếp
      const nhomDau = ds.filter((e) => e.coMat === ds[0]!.coMat)
      const chon = nhomDau.find((e) => !daDau.has(e.sbd)) ?? ds[0]!
      daDau.add(chon.sbd)
      ds.splice(ds.indexOf(chon), 1)
      ds.unshift(chon)
    }
    ra.set(q, ds)
  }
  return ra
}

const hai = (n: number) => String(n).padStart(2, '0')
/** "08/10" (giờ Việt Nam). */
export function ngayNgan(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const d = new Date(t + 7 * 3_600_000)
  return `${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}`
}
/** "1 phút 20 giây" · "42 giây" · ước tính: "khoảng 42 giây"; null ⇒ ''. */
export function chuThoiLuong(giay: number | null, uocTinh = false): string {
  if (giay === null || !(giay > 0)) return ''
  const p = Math.floor(giay / 60)
  const g = giay % 60
  const s = p ? `${p} phút${g ? ` ${g} giây` : ''}` : `${g} giây`
  return uocTinh ? `khoảng ${s}` : s
}

/** Dòng trên THẺ TÊN của tờ chiếu (bản vẽ 12/10): "Sai câu này 2 lần · gần nhất 08/10 · 1 phút 20 giây". */
export function nhanTheTen(e: Pick<EmSaiCau, 'soLanSai' | 'lucSai' | 'giay' | 'uocTinh'>): string {
  return [`Sai câu này ${e.soLanSai} lần`, e.lucSai && ngayNgan(e.lucSai) ? `gần nhất ${ngayNgan(e.lucSai)}` : '', chuThoiLuong(e.giay, e.uocTinh)].filter(Boolean).join(' · ')
}

/** Dòng "Gọi lên bảng" của xem trước: "Gọi lên bảng: Đỗ Ngọc Ánh (có mặt, làm sai câu này) · còn 17 em sai khác". Rỗng ⇒ ''. */
export function dongGoiLenBang(ds: readonly UngVien[]): string {
  const e = ds[0]
  if (!e) return ''
  const tinh = e.coMat === true ? 'có mặt, làm sai câu này' : e.coMat === false ? 'chưa điểm danh hôm nay, làm sai câu này' : 'làm sai câu này'
  return `Gọi lên bảng: ${e.ten} (${tinh})${ds.length > 1 ? ` · còn ${ds.length - 1} em sai khác` : ''}`
}
