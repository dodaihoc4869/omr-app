// BI-A PHẢN ỨNG · LỚP GỌI MÁY CHỦ (hợp đồng docs/hop-dong-bi-a.md). Mọi lệnh đi `POST /game-v2/<lệnh>` kèm token của em (goiHoa2).
// Đọc CHẶT: trường thiếu/sai kiểu thì bỏ, KHÔNG bịa số. Đáp án/lời giải chỉ có trong phản hồi `answer` SAU khi em chốt.
import { goiHoa2 } from '../../components/hoa2/api'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { laKiHieu, type KiHieu } from './nguyen-to'
import type { HinhAnh } from '../../data/examContent'
import type { CauBia } from './dieu-khien'

export type LyDoBia = 'chua_bat' | 'dang_co_ca' | 'chua_co_chien_dich' | 'het_tran' | 'xong_ke_hoach' | 'cau_dang_bao_ve' | 'cau_dang_o_dao' | 'giao_huu_chua_mo' | 'het_luot_giao_huu'
const LY_DO: ReadonlySet<string> = new Set(['chua_bat', 'dang_co_ca', 'chua_co_chien_dich', 'het_tran', 'xong_ke_hoach', 'cau_dang_bao_ve', 'cau_dang_o_dao', 'giao_huu_chua_mo', 'het_luot_giao_huu'])
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
  /** Máy chủ có phòng đấu (Durable Object) ⇒ mở "Đấu với bạn"; không ⇒ nút ghi "Sắp mở". */
  online: boolean
  diemBan: { diem: number; soVan: number }
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
    online: o.online === true,
    diemBan: { diem: so(vat(o.diemBan)?.diem) || 1000, soVan: so(vat(o.diemBan)?.soVan) },
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
export interface PhanHoiBia { correct: boolean; answer: string; traLoi: string; solution: unknown; solutionImages: HinhAnh[]; reward: number; expThuThach: number; /** Luật 29/09: EXP thật đã vào thú nhờ câu này (vắng ⇒ máy chủ cũ). */ expCau?: number }
/** Chấm một câu qua lệnh `answer` chung (máy chủ ghi sổ, Thể lực, EXP, lịch ôn). */
export async function traLoiBia(token: string, session: string, qid: string, answer: string, assisted = false): Promise<PhanHoiBia> {
  const o = await goi('answer', token, { session, qid, answer, assisted })
  return {
    correct: o.correct === true,
    answer: chu(o.answer),
    traLoi: typeof o.traLoi === 'string' ? o.traLoi : answer,
    solution: o.solution,
    solutionImages: Array.isArray(o.solutionImages) ? (o.solutionImages as HinhAnh[]) : [],
    reward: so(o.reward),
    expThuThach: so(o.expThuThach),
    ...(typeof o.expCau === 'number' ? { expCau: so(o.expCau) } : {}),
  }
}
/** Chế độ "Trả lời câu hỏi" (không cần chơi): một lượt câu Bi-a hôm nay (câu công khai, không đáp án). Hết câu ⇒ lý do như Sảnh. */
export type KetQuaTraLoi =
  | { ok: true; session: string; cau: CauBia[]; tran: { con: number; tong: number } }
  | { ok: false; lyDo: LyDoBia | null; message: string }
export async function layCauTraLoi(token: string): Promise<KetQuaTraLoi> {
  const o = await goi('bia-tra-loi', token, {})
  const cau = (Array.isArray(o.cau) ? o.cau : []).map(docCau).filter((c): c is CauBia => !!c)
  if (typeof o.session !== 'string' || !o.session || !cau.length) return { ok: false, lyDo: lyDo(o.lyDo) ?? lyDo(o.lyDoKhoa), message: chu(o.message) || 'Chưa lấy được câu. Em thử lại sau ít phút.' }
  const tr = vat(o.tran)
  return { ok: true, session: o.session, cau, tran: { con: so(tr?.con), tong: so(tr?.tong) } }
}
/** Em rời màn Trả lời câu hỏi: đóng phiên để câu chưa làm về lại kế hoạch. Lỗi mạng ⇒ bỏ qua (phiên tự hết hạn). */
export async function dongTraLoi(token: string, session: string): Promise<void> {
  try { await goi('bia-tra-loi', token, { dong: true, session }) } catch { /* bỏ qua */ }
}
/** Nhịp báo "em còn ở bàn" (máy chủ tính bàn bỏ dở theo HOẠT ĐỘNG GẦN NHẤT, hạn `HAN_GIU_BAN_BIA_MS` = 15 phút ở server/src/srs2-game.ts). */
export const NHIP_GIU_BAN_MS = 3 * 60_000
/** Báo máy chủ bàn A.I này còn đang chơi (một lệnh ghi nhẹ). Trả `false` khi phiên đã đóng. */
export async function giuBanBia(token: string, session: string): Promise<boolean> {
  return (await goi('bia-giu-ban', token, { session })).conMo === true
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

// ───────────── ĐẤU VỚI BẠN (GĐ2) — hợp đồng docs/hop-dong-bi-a.md mục "Đấu với bạn" ─────────────
export type LoaiBanMang = 'ban' | 'giao_huu'
/** Vé vào bàn online (chủ bàn tạo, nhận lời mời, hay nhập mã). */
export interface VeVaoBan { van: string; ma: string | null; cheDo: 'don' | 'doi'; loai: LoaiBanMang; ve: string }
const docVeVao = (o: Record<string, unknown>): VeVaoBan => {
  if (typeof o.van !== 'string' || typeof o.ve !== 'string') throw new Error(chu(o.message) || 'Chưa vào được bàn. Em thử lại.')
  return { van: o.van, ma: chu(o.ma) || null, cheDo: o.cheDo === 'doi' ? 'doi' : 'don', loai: o.loai === 'giao_huu' ? 'giao_huu' : 'ban', ve: o.ve }
}
export async function taoBanOnline(token: string, cheDo: 'don' | 'doi', loai: LoaiBanMang): Promise<VeVaoBan> { return docVeVao(await goi('bia-tao-ban', token, { cheDo, loai })) }
export async function vaoBanBangMa(token: string, ma: string): Promise<VeVaoBan> { return docVeVao(await goi('bia-vao-ban', token, { ma })) }
export async function moiBanVao(token: string, van: string, den: string): Promise<string> { return chu((await goi('bia-moi', token, { van, den })).id) }
export interface BanCoMat { sbd: string; ten: string; conTran: number }
export interface LoiMoiDen { id: string; tu: string; cheDo: 'don' | 'doi'; loai: LoaiBanMang; conGiay: number }
export interface HoiLoiMoi { ban: BanCoMat[]; moi: LoiMoiDen[]; phanHoi: { id: string; ten: string; nhan: boolean }[] }
/** Mỗi 6 giây khi em ở Sảnh Bi-a / phòng chờ: báo có mặt (kèm số câu Bi-a còn của em), đọc bạn đang ở Sảnh + lời mời. */
export async function hoiLoiMoi(token: string, con: number): Promise<HoiLoiMoi> {
  const o = await goi('bia-loi-moi', token, { con })
  const ds = (x: unknown) => (Array.isArray(x) ? x : []).map(vat).filter((v): v is Record<string, unknown> => !!v)
  return {
    ban: ds(o.ban).filter((x) => typeof x.sbd === 'string').map((x) => ({ sbd: x.sbd as string, ten: chu(x.ten) || 'Bạn', conTran: so(x.conTran) })),
    moi: ds(o.moi).filter((x) => typeof x.id === 'string').map((x) => ({ id: x.id as string, tu: chu(x.tu) || 'Bạn', cheDo: x.cheDo === 'doi' ? 'doi' : 'don', loai: x.loai === 'giao_huu' ? 'giao_huu' : 'ban', conGiay: so(x.conGiay) })),
    phanHoi: ds(o.phanHoi).filter((x) => typeof x.id === 'string').map((x) => ({ id: x.id as string, ten: chu(x.ten) || 'Bạn', nhan: x.nhan === true })),
  }
}
export async function traLoiLoiMoi(token: string, id: string, nhan: boolean): Promise<VeVaoBan | null> {
  const o = await goi('bia-tra-loi-moi', token, { id, nhan })
  return nhan ? docVeVao(o) : null
}
/** Phòng đấu Bắt đầu ⇒ xếp câu cho đúng các bi ghế em (máy chủ trả câu công khai + vé trận). */
export interface XepOnline { van: string; ghe: number; session: string | null; cauTheoBi: Partial<Record<KiHieu, CauBia>>; chot: CauBia | null; veTran: string; trong: number }
export async function xepBanOnline(token: string, veGhe: string): Promise<XepOnline> {
  const o = await goi('bia-xep-ban', token, { veGhe })
  if (typeof o.veTran !== 'string' || typeof o.van !== 'string') throw new Error(chu(o.message) || 'Chưa xếp được câu cho ván này. Em thử lại.')
  const cauTheoBi: Partial<Record<KiHieu, CauBia>> = {}
  let trong = 0
  for (const x of Array.isArray(o.bi) ? o.bi : []) {
    const v = vat(x)
    if (!v || !laKiHieu(v.ki)) continue
    const c = docCau(v.cau)
    if (c) cauTheoBi[v.ki] = c; else trong++
  }
  return { van: o.van, ghe: so(o.ghe), session: typeof o.session === 'string' ? o.session : null, cauTheoBi, chot: docCau(o.chot), veTran: o.veTran, trong }
}
/** Đổi câu ở ván online: kèm vé câu để phòng đấu biết câu mới (hoặc bi thành bi trống). */
export async function doiCauBiaMang(token: string, session: string, qidCu: string, chot: boolean, ki: KiHieu): Promise<{ cau: CauBia | null; ve: string | null }> {
  const o = await goi('bia-doi-cau', token, { session, qidCu, chot, ki })
  return { cau: o.trong === true ? null : docCau(o.cau), ve: typeof o.ve === 'string' ? o.ve : null }
}
/** Địa chỉ WebSocket phòng đấu của ván (cùng máy chủ với các lệnh game). */
export async function diaChiPhong(van: string): Promise<string> {
  const goc = await layDiaChiMayChu('')
  return `${goc.replace(/^http/, 'ws').replace(/\/+$/, '')}/bi-a/phong/${encodeURIComponent(van)}`
}
