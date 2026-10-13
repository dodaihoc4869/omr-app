// LỆNH THẦY · LƯỢT HỎI THẦY (13/10, server/src/hoi-tro-ly.ts gv*): xem lượt hôm nay của một em, đặt lại, SBD thử không giới hạn lượt.
// Tệp RIÊNG (không nằm trong loi-giai-api.ts, mảnh tải lúc mở cả 3 app) ⇒ chỉ tải cùng màn Cài đặt của thầy (luật tốc độ 13/10).
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

async function goiThay(duong: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return { ok: false, error: 'Chưa cài địa chỉ máy chủ.' }
    // AbortController + setTimeout (KHÔNG AbortSignal.timeout: iPhone cũ iOS 14–15 không có — tests/khong-cu-phap-may-cu-2109).
    const dk = new AbortController()
    const t = setTimeout(() => dk.abort(), 20000)
    const r = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' }, body: JSON.stringify(body), signal: dk.signal })
    clearTimeout(t)
    return (await r.json()) as Record<string, unknown>
  } catch {
    return { ok: false, error: 'Chưa nối được máy chủ.' }
  }
}

export type LuotHoiThay = { tranNgay: number; tranCau: number; sbdThu: string[]; sbd?: string; homNay?: number; laSbdThu?: boolean }
type KqThay<T> = { ok: true; du: T } | { ok: false; loi: string }
const kqThay = <T,>(j: Record<string, unknown>, du: (j: Record<string, unknown>) => T): KqThay<T> =>
  j.ok === true ? { ok: true, du: du(j) } : { ok: false, loi: String(j.error ?? 'Máy chủ chưa làm được việc này.') }
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
