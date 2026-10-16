// LỆNH THẦY · LƯỢT HỎI THẦY (13/10, server/src/hoi-tro-ly.ts gv*): xem lượt hôm nay của một em, đặt lại, SBD thử không giới hạn lượt.
// Tệp RIÊNG (không nằm trong loi-giai-api.ts, mảnh tải lúc mở cả 3 app) ⇒ chỉ tải cùng màn Cài đặt của thầy (luật tốc độ 13/10).
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

async function goiThay(duong: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  let hen: ReturnType<typeof setTimeout> | undefined
  try {
    const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return { ok: false, error: 'Chưa cài địa chỉ máy chủ.' }
    // AbortController + setTimeout (KHÔNG AbortSignal.timeout: iPhone cũ iOS 14–15 không có — tests/khong-cu-phap-may-cu-2109).
    const dk = new AbortController()
    hen = setTimeout(() => dk.abort(), 20000)
    const r = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' }, body: JSON.stringify(body), signal: dk.signal })
    const j: unknown = await r.json()
    if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('Phản hồi chưa đầy đủ.')
    return { ...j as Record<string, unknown>, ...(!r.ok && r.status >= 400 && r.status < 500 && !('ma' in j) ? { ma: 'bi_tu_choi' } : {}) }
  } catch {
    return { ok: false, ma: 'ket_noi', error: 'Chưa nối được máy chủ.' }
  } finally { if (hen !== undefined) clearTimeout(hen) }
}

export type LuotHoiThay = { tranNgay: number; tranCau: number; sbdThu: string[]; sbd?: string; homNay?: number; laSbdThu?: boolean }
type KqThay<T> = { ok: true; du: T } | { ok: false; loi: string; ma?: string }
const kqThay = <T,>(j: Record<string, unknown>, du: (j: Record<string, unknown>) => T): KqThay<T> =>
  j.ok === true ? { ok: true, du: du(j) } : { ok: false, loi: String(j.error ?? 'Máy chủ chưa làm được việc này.'), ...(typeof j.ma === 'string' ? { ma: j.ma } : {}) }
const docLuot = (j: Record<string, unknown>): LuotHoiThay => ({
  tranNgay: Number(j.tranNgay) || 0, tranCau: Number(j.tranCau) || 0, sbdThu: Array.isArray(j.sbdThu) ? j.sbdThu.map(String) : [],
  ...(typeof j.sbd === 'string' ? { sbd: j.sbd, homNay: Number(j.homNay) || 0, laSbdThu: j.laSbdThu === true } : {}),
})
/** Trần lượt + SBD thử; có `sbd` ⇒ kèm số câu em đã hỏi hôm nay. */
export async function docLuotHoiThay(sbd = ''): Promise<KqThay<LuotHoiThay>> {
  return kqThay(await goiThay('/gv/hoi-tro-ly/luot', sbd ? { sbd } : {}), docLuot)
}
/** Đặt lại lượt hôm nay của một em (máy chủ không xoá sổ, chỉ thôi đếm). */
export async function datLaiLuotHoiThay(sbd: string): Promise<KqThay<{ daDatLai: number }>> {
  return kqThay(await goiThay('/gv/hoi-tro-ly/dat-lai', { sbd }), (j) => ({ daDatLai: Number(j.daDatLai) || 0 }))
}
/** Thêm (them = true) / bớt một SBD thử không giới hạn lượt. */
export async function doiSbdThuHoiThay(sbd: string, them: boolean): Promise<KqThay<{ sbdThu: string[] }>> {
  return kqThay(await goiThay('/gv/hoi-tro-ly/sbd-thu', { sbd, them }), (j) => ({ sbdThu: Array.isArray(j.sbdThu) ? j.sbdThu.map(String) : [] }))
}

/** SỔ HỎI THẦY (13/10 khuya): tổng số lượt, từng em, các lượt gần nhất (máy chủ `gvSoHoiThay`, chỉ đọc). `sbd` ⇒ chỉ một em. */
export interface TongSoHoiThay { luot: number; traLoi: number; ngoaiPhamVi: number; loi: number; soEm: number; soCau: number; dau: string }
export interface EmSoHoiThay { sbd: string; ten: string; lop: string; soLuot: number; soCau: number; ganNhat: string }
export interface LuotSoHoiThay { luc: string; sbd: string; ten: string; qid: string; nguon: string; cauHoi: string; traLoi: string; ngoaiPhamVi: boolean; model: string; ms: number; loi: string }
export interface SoHoiThay { tong: TongSoHoiThay; theoEm: EmSoHoiThay[]; luot: LuotSoHoiThay[] }
const mang = <T,>(v: unknown, f: (x: Record<string, unknown>) => T): T[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object').map((x) => f(x as Record<string, unknown>)) : [])
const chu = (v: unknown) => (typeof v === 'string' ? v : '')
export async function docSoHoiThay(sbd = '', gioiHan = 100): Promise<KqThay<SoHoiThay>> {
  return kqThay(await goiThay('/gv/hoi-tro-ly/so', sbd ? { sbd, gioiHan } : { gioiHan }), (j) => {
    const t = (j.tong && typeof j.tong === 'object' ? j.tong : {}) as Record<string, unknown>
    return {
      tong: { luot: Number(t.luot) || 0, traLoi: Number(t.traLoi) || 0, ngoaiPhamVi: Number(t.ngoaiPhamVi) || 0, loi: Number(t.loi) || 0, soEm: Number(t.soEm) || 0, soCau: Number(t.soCau) || 0, dau: chu(t.dau) },
      theoEm: mang(j.theoEm, (x) => ({ sbd: chu(x.sbd), ten: chu(x.ten), lop: chu(x.lop), soLuot: Number(x.soLuot) || 0, soCau: Number(x.soCau) || 0, ganNhat: chu(x.ganNhat) })),
      luot: mang(j.luot, (x) => ({ luc: chu(x.luc), sbd: chu(x.sbd), ten: chu(x.ten), qid: chu(x.qid), nguon: chu(x.nguon), cauHoi: chu(x.cauHoi), traLoi: chu(x.traLoi), ngoaiPhamVi: x.ngoaiPhamVi === true, model: chu(x.model), ms: Number(x.ms) || 0, loi: chu(x.loi) })),
    }
  })
}

export interface YeuCauCanGiupHoiThay {
  sbd: string; qid: string; ten: string; lop: string; tieuDe: string; lyDo: string
  guiLuc: number; capNhatLuc: number; revision: number
}
export interface MocCanGiupHoiThay { luc: number; sbd: string; qid: string }
export interface SoCanGiupHoiThay { tong: number; ds: YeuCauCanGiupHoiThay[]; sau?: MocCanGiupHoiThay }
export interface GuiHoTroHoiThay {
  qid: string; loiGo: string; requestId: string; em: { sbd: string; revision: number }[]
}
/** Chỉ tải khi thầy mở danh sách; cursor giữ đúng thứ tự giữa các trang. */
export async function docCanGiupHoiThay(lop = '', sau?: MocCanGiupHoiThay): Promise<KqThay<SoCanGiupHoiThay>> {
  return kqThay(await goiThay('/gv/hoi-tro-ly/can-giup', { ...(lop ? { lop } : {}), ...(sau ? { sau } : {}) }), (j) => {
    const moc = j.sau && typeof j.sau === 'object' ? j.sau as Record<string, unknown> : null
    return {
      tong: Number(j.tong) || 0,
      ds: mang(j.ds, (x) => ({ sbd: chu(x.sbd), qid: chu(x.qid), ten: chu(x.ten), lop: chu(x.lop), tieuDe: chu(x.tieuDe), lyDo: chu(x.lyDo), guiLuc: Number(x.guiLuc) || 0, capNhatLuc: Number(x.capNhatLuc) || 0, revision: Number(x.revision) || 0 })),
      ...(moc && typeof moc.luc === 'number' && typeof moc.sbd === 'string' && typeof moc.qid === 'string'
        ? { sau: { luc: moc.luc, sbd: moc.sbd, qid: moc.qid } } : {}),
    }
  })
}
/** Thử lại khi mất mạng phải dùng NGUYÊN payload/requestId để nhận lại biên nhận cũ. */
export async function guiHoTroHoiThay(b: GuiHoTroHoiThay): Promise<KqThay<{ soEm: number; thongBao: string }>> {
  return kqThay(await goiThay('/gv/hoi-tro-ly/ho-tro', { ...b }), (j) => ({ soEm: Number(j.soEm) || 0, thongBao: chu(j.thongBao) }))
}
