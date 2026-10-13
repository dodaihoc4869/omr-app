// LỜI GIẢI TỪNG BƯỚC — lệnh của THẦY (màn Duyệt lời giải, DuyetLoiGiaiScreen). Mã bí mật như mọi lệnh của thầy (`x-ma-bi-mat`).
// Tách khỏi loi-giai-api.ts 13/10 (luật tốc độ thầy 13/10): tệp kia nằm trong mảnh dùng chung mở app của cả ba app; phần này chỉ màn thầy cần.
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'
import type { CauChoKhung, HoSoLoiGiai } from './loi-giai-api'

async function goiThay(duong: string, body: Record<string, unknown>): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return { ok: false, error: 'Chưa cài địa chỉ máy chủ.' }
    const dk = new AbortController()
    const t = setTimeout(() => dk.abort(), 20000)
    const r = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' }, body: JSON.stringify(body), signal: dk.signal })
    clearTimeout(t)
    return (await r.json()) as Record<string, unknown>
  } catch {
    return { ok: false, error: 'Chưa nối được máy chủ.' }
  }
}

export type TrangThaiLoiGiai = 'da_duyet' | 'cho_duyet' | 'tra_lai' | 'dang_soan' | 'truot' | 'chua_co_bo'
export interface CauChoDuyet {
  qid: string
  bam: string
  dang: 'tn' | 'ds' | 'tln'
  bo: string
  trangThai: TrangThaiLoiGiai
  sach: boolean
  /** Máy tự duyệt lúc nộp (hồ sơ sạch — thầy chốt 29/09). */
  mayDuyet?: boolean
  co: { loai: string; ghi: string; chot?: string; sua?: { truong: string; truoc: string; sau: string } }[]
  ghiChu: string
  loiMay: string
  soLan: number
}
export interface KetQuaChoDuyet {
  ok: boolean
  error?: string
  maDe?: string
  cau?: CauChoDuyet[]
  tong?: { cau: number; daDuyet: number; choDuyet: number; sach: number; dangSoan: number; traLai: number; truot: number; chuaCoBo: number }
}

export const gvChoDuyet = (maDe: string) => goiThay('/gv/loi-giai/cho-duyet', { maDe }) as Promise<KetQuaChoDuyet>
export const gvXemLoiGiai = (qid: string) => goiThay('/gv/loi-giai/xem', { qid }) as Promise<{ ok: boolean; error?: string; hoSo?: HoSoLoiGiai; cau?: CauChoKhung }>
export const gvDuyetLoiGiai = (b: { quyet: 'duyet' | 'tra_lai'; bam?: string[]; maDe?: string; caLoSach?: boolean; ghiChu?: string }) =>
  goiThay('/gv/loi-giai/duyet', b) as Promise<{ ok: boolean; error?: string; soCau?: number }>
export const gvSoanGap = (maDe: string) => goiThay('/gv/loi-giai/soan-gap', { maDe }) as Promise<{ ok: boolean; error?: string; soCau?: number }>
