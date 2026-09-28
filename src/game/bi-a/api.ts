// BI-A PHẢN ỨNG · LỚP GỌI MÁY CHỦ (hợp đồng docs/hop-dong-bi-a.md). Mọi lệnh đi `POST /game-v2/<lệnh>` kèm token của em (goiHoa2).
// Đọc CHẶT: trường thiếu/sai kiểu thì bỏ, KHÔNG bịa số. Đáp án/lời giải chỉ có trong phản hồi `answer` SAU khi em chốt.
import { goiHoa2 } from '../../components/hoa2/api'
import type { HinhAnh } from '../../data/examContent'
import type { CauBia } from './dieu-khien'

export type LyDoBia = 'chua_bat' | 'dang_co_ca' | 'chua_co_chien_dich' | 'het_tran' | 'xong_ke_hoach' | 'cau_dang_bao_ve' | 'giao_huu_chua_mo' | 'het_luot_giao_huu'
const LY_DO: ReadonlySet<string> = new Set(['chua_bat', 'dang_co_ca', 'chua_co_chien_dich', 'het_tran', 'xong_ke_hoach', 'cau_dang_bao_ve', 'giao_huu_chua_mo', 'het_luot_giao_huu'])
/** Bộ gọi máy chủ: mặc định `goiHoa2` (POST /game-v2/<lệnh>). Trang xem thử và test thay bằng máy chủ giả. */
export type BoGoiBia = (lenh: string, token: string, du?: Record<string, unknown>) => Promise<Record<string, unknown>>
let goi: BoGoiBia = goiHoa2
export const datBoGoiBia = (f: BoGoiBia | null): void => { goi = f ?? goiHoa2 }
const so = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0)
const chu = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')
const vat = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null)
const lyDo = (x: unknown): LyDoBia | null => (typeof x === 'string' && LY_DO.has(x) ? (x as LyDoBia) : null)

export interface SanhBia {
  bat: boolean
  lyDoKhoa: LyDoBia | null
  message: string
  chienDich: { ten: string; hanNop: string; tong: number } | null
  theLuc: { con: number; tong: number }
  doan: number
  dao: number
  tran: { con: number; tong: number; conDoan: number; conDao: number }
  giaoHuu: { mo: boolean; con: number; toiDa: number }
}
export function docSanhBia(o: Record<string, unknown>): SanhBia {
  const cd = vat(o.chienDich), tl = vat(o.theLuc), tr = vat(o.tran), gh = vat(o.giaoHuu)
  return {
    bat: o.bat === true,
    lyDoKhoa: lyDo(o.lyDoKhoa),
    message: chu(o.message),
    chienDich: cd ? { ten: chu(cd.ten) || 'Chiến dịch của lớp', hanNop: chu(cd.hanNop), tong: so(cd.tong) } : null,
    theLuc: { con: so(tl?.con), tong: so(tl?.tong) },
    doan: so(vat(o.doan)?.con), dao: so(vat(o.dao)?.con),
    tran: { con: so(tr?.con), tong: so(tr?.tong), conDoan: so(tr?.conDoan), conDao: so(tr?.conDao) },
    giaoHuu: { mo: gh?.mo === true, con: so(gh?.con), toiDa: so(gh?.toiDa) || 2 },
  }
}
export async function taiSanhBia(token: string): Promise<SanhBia> { return docSanhBia(await goi('bia-sanh', token)) }

/** Câu công khai máy chủ gửi (không đáp án). Thiếu qid/phan ⇒ bỏ. */
export function docCau(x: unknown): CauBia | null {
  const o = vat(x)
  if (!o || typeof o.qid !== 'string' || !o.qid || (o.phan !== 'I' && o.phan !== 'II' && o.phan !== 'III')) return null
  if ('correct' in o || 'solution' in o) { const { correct: _c, solution: _s, ...sach } = o; return sach as unknown as CauBia } // phòng xa: không bao giờ giữ đáp án trên máy
  return o as unknown as CauBia
}
export type KetQuaXep =
  | { ok: true; van: string; session: string | null; cau: CauBia[]; chot: CauBia | null; tran: { con: number; tong: number } }
  | { ok: false; lyDo: LyDoBia | null; message: string }
export async function xepBanBia(token: string, loai: 'ai' | 'giao_huu', cheDo: 'don' | 'doi'): Promise<KetQuaXep> {
  const o = await goi('bia-xep-ban', token, { loai, cheDo, soBi: cheDo === 'doi' ? 4 : 7 })
  if (typeof o.van !== 'string' || !o.van) return { ok: false, lyDo: lyDo(o.lyDo) ?? lyDo(o.lyDoKhoa), message: chu(o.message) || 'Chưa xếp được bàn. Em thử lại sau ít phút.' }
  const cau = (Array.isArray(o.bi) ? o.bi : []).map(docCau).filter((c): c is CauBia => !!c)
  const tr = vat(o.tran)
  return { ok: true, van: o.van, session: typeof o.session === 'string' && o.session ? o.session : null, cau, chot: docCau(o.chot), tran: { con: so(tr?.con), tong: so(tr?.tong) } }
}
export interface PhanHoiBia { correct: boolean; answer: string; traLoi: string; solution: unknown; solutionImages: HinhAnh[]; reward: number; expThuThach: number }
/** Chấm một câu qua lệnh `answer` chung (máy chủ ghi sổ, Thể lực, EXP, lịch ôn). */
export async function traLoiBia(token: string, session: string, qid: string, answer: string): Promise<PhanHoiBia> {
  const o = await goi('answer', token, { session, qid, answer, assisted: false })
  return {
    correct: o.correct === true,
    answer: chu(o.answer),
    traLoi: typeof o.traLoi === 'string' ? o.traLoi : answer,
    solution: o.solution,
    solutionImages: Array.isArray(o.solutionImages) ? (o.solutionImages as HinhAnh[]) : [],
    reward: so(o.reward),
    expThuThach: so(o.expThuThach),
  }
}
/** Đổi câu sau câu sai: câu mới cùng dạng, hoặc null (bi trống / hết trần). */
export async function doiCauBia(token: string, session: string, qidCu: string, chot: boolean): Promise<CauBia | null> {
  const o = await goi('bia-doi-cau', token, { session, qidCu, chot })
  return o.trong === true ? null : docCau(o.cau)
}
export interface GheKet { ghe: number; doi: number; ai: boolean; dung: number; sai: number; an: number; vang: number }
export async function ketVanBia(token: string, van: string, ketQua: { doiThang: 0 | 1 | null; diem: [number, number]; lyDo: 'thang' | 'thua' | 'bo' }, ghe: GheKet[], soCu: number): Promise<{ theLuc: { con: number; tong: number } | null }> {
  const o = await goi('bia-ket-van', token, { van, ketQua, ghe, soCu })
  const tl = vat(o.theLuc)
  return { theLuc: tl ? { con: so(tl.con), tong: so(tl.tong) } : null }
}
