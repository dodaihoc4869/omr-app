// BÀN GỠ NÚT THẮT — máy khách của thầy (máy chủ: server/src/ban-go-nut-that.ts). Lệnh thầy: mã bí mật `x-ma-bi-mat` như mọi lệnh thầy
// (cùng cách `goiThay` của loi-giai-api.ts). Học sinh đọc lời gỡ qua `/hs/loi-go` (token cổng học sinh).
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'
import { docTokenHs } from './loi-giai-api'
import { layDiaChiMayChu } from './dia-chi-may-chu'

type Obj = Record<string, unknown>

async function goiThay<T>(duong: string, body: Obj): Promise<T> {
  try {
    const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return { ok: false, error: 'Chưa cài địa chỉ máy chủ.' } as T
    const dk = new AbortController()
    const t = setTimeout(() => dk.abort(), 20000)
    const r = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' }, body: JSON.stringify(body), signal: dk.signal })
    clearTimeout(t)
    return (await r.json()) as T
  } catch {
    return { ok: false, error: 'Chưa nối được máy chủ.' } as T
  }
}

export interface KiemEm { traLoi: string; dung: boolean; luc: string }
export interface EmVuong { sbd: string; hoTen: string; dapAnChon: string; kiem: KiemEm[]; viet: string; soLanThu: number; guiLuc: string }
export interface NhomNut {
  /** Khoá nội bộ của nhóm (câu × bước) — chỉ để vẽ, KHÔNG hiện. */
  khoa: string
  bam: string
  buoc: number
  qidMau: string
  so: string
  /** Đề (HTML máy chủ đã thoát). */
  de: string
  /** Chữ bước vướng (HTML đã thoát). */
  chuBuoc: string
  nhanNen: string
  cauKiemHoi: string
  soEm: number
  em: EmVuong[]
  soCauCungChuyenDe: number
  hanGanNhat: string | null
  diem: number
  nhieuEmVuong: boolean
}
export interface NhomNen { nen: string; soEm: number; soCau: number; khoa: string[] }
export interface EmKemRieng { sbd: string; hoTen: string; qid: string; buoc: number; so: string; chuBuoc: string }
export interface KetQuaDsNut {
  ok: boolean
  error?: string
  nhom?: NhomNut[]
  cungNen?: NhomNen[]
  kemRieng?: EmKemRieng[]
  tong?: { soThe: number; soNhom: number; theNgayDongNhat: number; quaTai: boolean }
}
export type KieuGo = 'ngan' | 'lop' | 'sua'
export interface KetQuaGo { ok: boolean; error?: string; soThe?: number; tenBuoi?: string; emCanGoi?: { sbd: string; hoTen: string }[] }

export const gvDsNutThat = () => goiThay<KetQuaDsNut>('/gv/nut-that/ds', {})
export const gvGoNutThat = (b: { bam: string; buoc: number; kieu: KieuGo; noiDung: string; buoiHoc?: string }) => goiThay<KetQuaGo>('/gv/nut-that/go', b)

export interface LoiGoEm { buoc: number; kieu: 'ngan' | 'lop'; noiDung: string; luc: string; buoiHoc?: string }

/** Học sinh: các lời thầy gỡ của một câu. Không có phiên ⇒ rỗng. */
export async function hsLoiGo(qid: string): Promise<{ ok: boolean; loiGo: LoiGoEm[]; error?: string }> {
  const token = docTokenHs()
  if (!token || !qid) return { ok: false, loiGo: [], error: 'Em đăng nhập lại để xem lời thầy gỡ.' }
  try {
    const url = await layDiaChiMayChu()
    if (!url) return { ok: false, loiGo: [], error: 'Chưa nối được máy chủ.' }
    const r = await fetch(`${url}/hs/loi-go`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, qid }) })
    const j = (await r.json()) as Obj
    return { ok: j.ok === true, loiGo: Array.isArray(j.loiGo) ? (j.loiGo as LoiGoEm[]) : [], ...(j.ok === true ? {} : { error: String(j.error ?? 'Chưa mở được lời thầy gỡ.') }) }
  } catch {
    return { ok: false, loiGo: [], error: 'Chưa nối được máy chủ.' }
  }
}
