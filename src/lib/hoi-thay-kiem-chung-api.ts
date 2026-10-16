// Chỉ nạp sau khi em nhận hướng dẫn. Câu kiểm chứng do kho máy chủ cấp và chấm;
// không dùng kết quả câu luyện nhanh của AI để xác nhận em đã tự làm được.
import type { HinhAnh } from '../data/examContent'
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docTokenHs } from './loi-giai-api'

export interface CauKiemChung {
  qid: string
  phan: 'I' | 'II' | 'III'
  text: string
  choices?: [string, string, string, string]
  ideas?: [string, string, string, string]
  table?: string[][]
  hinhAnh?: HinhAnh[]
  thanCauImg?: string
  imageDataUrl?: string
  choiceImgs?: [string?, string?, string?, string?]
  ideaImgs?: [string?, string?, string?, string?]
  soO?: number
}
export type LoiKiemChung = { ok: false; ma: string; error: string }
export type MoKiemChung = (
  | { ok: true; trangThai: 'co_cau'; phienId: string; cau: CauKiemChung; thongBao?: string }
  | { ok: true; trangThai: 'cho_nguon' | 'cho_kiem_lai' | 'da_xac_nhan' | 'can_thay'; denHan?: string; thongBao?: string }
) & { loiThay?: string; capNhatLuc?: number }
export type NopKiemChung = { ok: true; dung: boolean; trangThai: 'da_tu_lam' | 'cho_kiem_lai' | 'da_xac_nhan' | 'can_thay'; denHan?: string; thongBao: string; idempotent?: boolean }
export type GuiThayKiemChung = { ok: true; thongBao: string }

async function goi<T>(lenh: string, duLieu: Record<string, string>, tokenCuaPhien?: string): Promise<T | LoiKiemChung> {
  const token = tokenCuaPhien ?? docTokenHs()
  if (!token) return { ok: false, ma: 'dang_nhap', error: 'Em đăng nhập lại để tiếp tục nhé.' }
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), 20_000)
  try {
    const diaChi = await layDiaChiMayChu()
    if (!diaChi) return { ok: false, ma: 'mang', error: 'Chưa nối được máy chủ. Em thử lại nhé.' }
    const r = await fetch(`${diaChi}/hs/hoi-tro-ly/kiem/${lenh}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, ...duLieu }), signal: dk.signal,
    })
    const j: unknown = await r.json()
    if (j && typeof j === 'object' && 'ok' in j && j.ok === true && r.ok) return j as T
    const loi = j && typeof j === 'object' ? j as Record<string, unknown> : {}
    return { ok: false, ma: String(loi.ma ?? 'loi'), error: typeof loi.error === 'string' ? loi.error : 'Chưa hoàn tất được. Em thử lại nhé.' }
  } catch {
    return { ok: false, ma: dk.signal.aborted ? 'cham' : 'mang', error: dk.signal.aborted ? 'Chưa nhận được xác nhận. Em bấm thử lại để nhận đúng kết quả của lần gửi này.' : 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại nhé.' }
  } finally { clearTimeout(hen) }
}

export const moKiemChung = (qid: string, token?: string) => goi<MoKiemChung>('mo', { qid }, token)
export const nopKiemChung = (phienId: string, attemptId: string, traLoi: string, token?: string) => goi<NopKiemChung>('nop', { phienId, attemptId, traLoi }, token)
export const guiThayKiemChung = (qid: string, token?: string) => goi<GuiThayKiemChung>('gui-thay', { qid }, token)
