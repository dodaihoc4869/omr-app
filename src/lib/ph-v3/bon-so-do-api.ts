// Gọi `POST /ph/bon-so-do` (4 số đo của con — «Một trang về con», thầy chốt 01/11). Chỉ mảnh nạp lười MotTrangCon kéo tệp này. Trường sai kiểu ⇒ bỏ / null, không bịa số.
import type { KetQuaLenh } from '../goi-lenh-thay'
import { goiLenhCon } from '../ho-so-con-ph-api'
import type { BangChungPh, MaSoDo, NgaySoDo, TraLoiBonSoDo } from './bon-so-do-kieu'

export const DUONG_BON_SO_DO = '/ph/bon-so-do'
const MA: readonly MaSoDo[] = ['ht', 'dp', 'ch', 'lu']
const chu = (x: unknown, dai = 200): string => (typeof x === 'string' ? x.trim().slice(0, dai) : '')
const diem = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 100 ? Math.round(x) : null)
const khongAm = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0)
const dt = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null)

function docBangChung(x: unknown): BangChungPh[] {
  return (Array.isArray(x) ? x : []).slice(0, 3).flatMap((b): BangChungPh[] => {
    const o = dt(b), vd = dt(o?.vd)
    const so = chu(o?.so, 24), c = chu(o?.chu)
    if (!so || !c) return []
    return [{ so, chu: c, ngan: chu(o?.ngan, 40) || c, ...(vd && chu(vd.luc) ? { vd: { luc: chu(vd.luc, 40), chu: chu(vd.chu) } } : {}) }]
  })
}

/** Đọc phản hồi máy chủ (thuần). Không đúng hình ⇒ null. */
export function docBonSoDo(j: Record<string, unknown>): TraLoiBonSoDo | null {
  if (j.ok !== true) return null
  if (j.co === false) return { ok: true, co: false }
  const d = dt(j.diem), bc = dt(j.bangChung)
  if (j.co !== true || !d) return null
  const ngay: NgaySoDo[] = (Array.isArray(j.ngay) ? j.ngay : []).slice(-14).flatMap((n): NgaySoDo[] => {
    const o = dt(n)
    return o && /^\d{4}-\d{2}-\d{2}$/.test(chu(o.ngay)) ? [{ ngay: chu(o.ngay), muc: khongAm(o.muc), ky: khongAm(o.ky), voi: khongAm(o.voi) }] : []
  })
  return {
    ok: true, co: true,
    tinhLuc: chu(j.tinhLuc, 40), tu: chu(j.tu, 10), den: chu(j.den, 10), soLuot: khongAm(j.soLuot),
    diem: { ht: diem(d.ht), dp: diem(d.dp), ch: diem(d.ch), lu: diem(d.lu) },
    bangChung: Object.fromEntries(MA.map((m) => [m, docBangChung(bc?.[m])])) as Record<MaSoDo, BangChungPh[]>,
    ngay,
  }
}

export async function layBonSoDo(sbd: string): Promise<KetQuaLenh<TraLoiBonSoDo>> {
  const r = await goiLenhCon(DUONG_BON_SO_DO, sbd)
  if (!r.ok) return r
  const d = docBonSoDo(r.du)
  return d ? { ok: true, du: d } : { ok: false, loai: 'khong_doc_duoc', chu: '4 số đo của con chưa đọc được. Anh/chị tải lại sau ít phút.' }
}
