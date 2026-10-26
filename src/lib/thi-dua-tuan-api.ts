// THI ĐUA TUẦN — lớp nối app THẦY của hệ thưởng phạt kiểu Duolingo (thầy chốt 26/10; hợp đồng ve-moi/thuong-phat/DAC-TA-THUONG-PHAT-2610.md mục 4.4).
// Chỉ màn ThiDuaTuanScreen (mảnh nạp lười) nhập tệp này. Hai lệnh:
//   GET  /gv/thi-dua-tuan?lop=<tên lớp>  → { ok, lop?, tuan?, capNhat?, ds: [{ sbd, ten, lop?, nguyenTuThat, nguyenTuLoai, hang, chuoi, nhan, bacDuoi, hocCung }] }
//        hang = { kl, thuHang } | 'bac' (+ thuHang riêng) | null · nhan = 'Học thật' | 'Đối phó' | null · bacDuoi 1…5 (5 = ĐUỔI) · hocCung = [{ ten, lop?, chuoiDoi }] | string[]
//   GET  /gv/thuong/cong-tac              → { ok, congTac: { thuong_giai_tuan: 'bat'|'tat', … } }   (khoá phẳng ở gốc cũng đọc được)
//   POST /gv/thuong/cong-tac {khoa, giaTri} → { ok, congTac? }
// Đọc chặt: trường sai kiểu ⇒ null / bỏ, không bịa số. Bản gần nhất lưu trên máy (localStorage) để màn vẽ ngay rồi mới cập nhật.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { loadTeacherSecret } from './exam-db'
import type { KetQuaLenh } from './goi-lenh-thay'
import { docKimLoai, type KimLoai } from '../components/HuyHieuGiai'

type O = Record<string, unknown>
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const chu = (x: unknown) => (typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : '')
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null)
const nguyen = (x: unknown): number | null => { const n = so(x); return n !== null && Number.isInteger(n) ? n : null }
const thoat = (loai: Extract<KetQuaLenh<never>, { ok: false }>['loai'], c: string): Extract<KetQuaLenh<never>, { ok: false }> => ({ ok: false, loai, chu: c })

export type Bac = 1 | 2 | 3 | 4 | 5
/** Năm bậc của thang Học thật · Đối phó (DE-XUAT-HOC-THAT-DOI-PHO-2410) — CHỈ app thầy. */
export const TEN_BAC: Readonly<Record<Bac, string>> = { 1: 'Học thật', 2: 'Cần theo dõi', 3: 'Đối phó', 4: 'Không dạy nổi', 5: 'ĐUỔI' }
export interface BanHocCung { ten: string; lop: string; chuoiDoi: number | null }
export interface EmThiDua {
  sbd: string
  ten: string
  lop: string
  nguyenTuThat: number
  nguyenTuLoai: number
  hang: { kl: KimLoai; thuHang: number | null } | null
  chuoi: number | null
  nhan: 'Học thật' | 'Đối phó' | null
  bacDuoi: Bac | null
  hocCung: BanHocCung[]
}
export interface ThiDuaTuan { lop: string; tuan: string; capNhat: number | null; ds: EmThiDua[] }

export function docEm(x: unknown, i: number): EmThiDua | null {
  const o = dt(x)
  const ten = o ? chu(o.ten ?? o.hoTen) : ''
  if (!o || !ten) return null
  const h = dt(o.hang)
  const kl = docKimLoai(h ? h.kl ?? h.hang : o.hang)
  const b = o.bacDuoi
  return {
    sbd: chu(o.sbd) || `#${i}`,
    ten,
    lop: chu(o.lop),
    nguyenTuThat: nguyen(o.nguyenTuThat) ?? 0,
    nguyenTuLoai: nguyen(o.nguyenTuLoai) ?? 0,
    hang: kl ? { kl, thuHang: nguyen(h?.thuHang ?? o.thuHang) || null } : null,
    chuoi: nguyen(o.chuoi),
    nhan: o.nhan === 'Học thật' || o.nhan === 'Đối phó' ? o.nhan : null,
    bacDuoi: b === 1 || b === 2 || b === 3 || b === 4 || b === 5 ? b : null,
    hocCung: (Array.isArray(o.hocCung) ? o.hocCung : []).map((y) => {
      const q = dt(y)
      return { ten: q ? chu(q.ten) : chu(y), lop: q ? chu(q.lop) : '', chuoiDoi: q ? nguyen(q.chuoiDoi) : null }
    }).filter((y) => y.ten),
  }
}
const thoiDiem = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : typeof x === 'string' && Number.isFinite(Date.parse(x)) ? Date.parse(x) : null)
export function docThiDua(j: O, lop: string): ThiDuaTuan | null {
  if (!Array.isArray(j.ds)) return null
  return {
    lop: chu(j.lop) || lop,
    tuan: chu(j.tuan),
    capNhat: thoiDiem(j.capNhat ?? j.serverNow),
    ds: j.ds.map(docEm).filter((e): e is EmThiDua => !!e),
  }
}

// ---- công tắc (cau_hinh) ----
export const KHOA_CONG_TAC = ['thuong_giai_tuan', 'thuong_thang_hoa', 'thuong_ban_be', 'thuong_kim_cuong'] as const
export type KhoaCongTac = (typeof KHOA_CONG_TAC)[number]
export type CongTac = Partial<Record<KhoaCongTac, boolean>>
export function docCongTac(j: O): CongTac {
  const g = dt(j.congTac) ?? j
  const kq: CongTac = {}
  for (const k of KHOA_CONG_TAC) if (g[k] === 'bat' || g[k] === 'tat') kq[k] = g[k] === 'bat'
  return kq
}

/** Gọi lệnh thầy (GET hoặc POST) kèm mã bí mật. Không ném lỗi. */
async function goi(duong: string, body?: O): Promise<KetQuaLenh<O>> {
  let url: string, mat: string | null
  try {
    ;[url, mat] = await Promise.all([layDiaChiMayChu(), loadTeacherSecret()])
  } catch {
    return thoat('mang', 'Chưa đọc được cấu hình máy chủ.')
  }
  if (!url) return thoat('mang', 'Chưa kết nối được máy chủ.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), 20_000)
  try {
    const res = await fetch(`${url}${duong}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'x-ma-bi-mat': mat || '', ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: dk.signal,
    })
    if (res.status === 404) return thoat('chua_co_lenh', 'Máy chủ chưa có lệnh thưởng phạt — cần đẩy bản máy chủ mới.')
    const j = dt(await res.json().catch(() => null))
    if (!j) return thoat('khong_doc_duoc', 'Máy chủ trả lời không đọc được.')
    if (!res.ok || j.ok !== true) return thoat('tu_choi', chu(j.error ?? j.loi) || 'Máy chủ không đồng ý lệnh này.')
    return { ok: true, du: j }
  } catch {
    return dk.signal.aborted ? thoat('cham', 'Máy chủ trả lời chậm — thử lại sau ít phút.') : thoat('mang', 'Không nối được máy chủ.')
  } finally {
    clearTimeout(hen)
  }
}

export async function layThiDuaTuan(lop: string): Promise<KetQuaLenh<ThiDuaTuan>> {
  const r = await goi(`/gv/thi-dua-tuan?lop=${encodeURIComponent(lop)}`)
  if (!r.ok) return r
  const d = docThiDua(r.du, lop)
  if (d) nhoGhi(`td:${lop}`, d)
  return d ? { ok: true, du: d } : thoat('khong_doc_duoc', 'Bảng thi đua máy chủ trả không đúng dạng.')
}
export async function layCongTac(): Promise<KetQuaLenh<CongTac>> {
  const r = await goi('/gv/thuong/cong-tac')
  if (!r.ok) return r
  const c = docCongTac(r.du)
  nhoGhi('ct', c)
  return { ok: true, du: c }
}
/** Ghi một công tắc. Máy chủ trả `congTac` thì dùng đúng số ấy; không thì coi giá trị vừa gửi là đã lưu. */
export async function datCongTac(khoa: KhoaCongTac, bat: boolean, cu: CongTac): Promise<KetQuaLenh<CongTac>> {
  const r = await goi('/gv/thuong/cong-tac', { khoa, giaTri: bat ? 'bat' : 'tat' })
  if (!r.ok) return r
  const tra = docCongTac(r.du)
  const c = { ...cu, ...(Object.keys(tra).length ? tra : { [khoa]: bat }) }
  nhoGhi('ct', c)
  return { ok: true, du: c }
}

// ---- bản gần nhất trên máy (vẽ ngay khi mở màn, rồi cập nhật) ----
const KHOA_NHO = 'ddh.thuongGv.'
export function nhoDoc<T>(k: string): T | null {
  try {
    const s = globalThis.localStorage?.getItem(KHOA_NHO + k)
    return s ? (JSON.parse(s) as T) : null
  } catch {
    return null
  }
}
export function nhoGhi(k: string, v: unknown) {
  try {
    globalThis.localStorage?.setItem(KHOA_NHO + k, JSON.stringify(v))
  } catch {
    /* máy chặn bộ nhớ: chỉ mất tiện lợi */
  }
}
