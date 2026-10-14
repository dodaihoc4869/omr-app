// Danh sách nhận Gói 7: đọc có kiểm dạng, ghi chỉ nhận ACK đủ tập và phiên bản.
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { loadTeacherSecret } from '../../lib/exam-db'
import { goiLenh, type KetQuaLenh } from '../../lib/goi-lenh-thay'
import type { EmLop } from './ChonEmGiao'

export type EmNhanBai = EmLop & { duocThem: boolean }
export type DanhSachNhanBai = {
  goiId: string; tickId: string; lop: string; ten: string; revision: string; serverNow: number
  em: EmNhanBai[]; nhan: string[]; emChuyenLop?: { sbd: string; hoTen: string; tenLop: string }[]
}
export type SuaEmNhanBai = { action: 'sua_em'; goiId: string; revision: string; requestId: string; them: string[]; bot: string[] }
export type AckEmNhanBai = { goiId: string; requestId: string; revision: string; them: string[]; bot: string[]; nhan: string[]; serverNow: number }
const laHo = (d: unknown): d is Record<string, unknown> => !!d && typeof d === 'object' && !Array.isArray(d)
const laChu = (d: unknown): d is string => typeof d === 'string' && d.length > 0
const laPhien = (d: unknown): d is string => typeof d === 'string' && /^[a-f0-9]{64}$/.test(d)
const laTap = (d: unknown): d is string[] => Array.isArray(d) && d.every(laChu) && new Set(d).size === d.length
export const cungTapEm = (a: readonly string[], b: readonly string[]) => a.length === b.length && new Set(a).size === a.length && new Set(b).size === b.length && a.every(x => b.includes(x))
const laGio = (d: unknown): d is number => typeof d === 'number' && Number.isFinite(d) && Number.isFinite(new Date(d).getTime())
const saiDu = (chu: string): KetQuaLenh<never> => ({ ok: false, loai: 'khong_doc_duoc', chu })

export function docEmNhanBai(d: Record<string, unknown>, goiId: string, lop: string): DanhSachNhanBai | null {
  if (d.goiId !== goiId || d.lop !== lop || !laChu(d.tickId) || !laChu(d.ten) || !laPhien(d.revision) || !laGio(d.serverNow) || !Array.isArray(d.em) || !laTap(d.nhan)) return null
  const em: EmNhanBai[] = [], ids = new Set<string>()
  for (const e of d.em) {
    if (!laHo(e) || !laChu(e.sbd) || typeof e.hoTen !== 'string' || !laChu(e.khoi) || typeof e.tenLop !== 'string' || (e.tenLop || e.khoi) !== lop || typeof e.duocThem !== 'boolean' || ids.has(e.sbd)) return null
    ids.add(e.sbd); em.push(e as unknown as EmNhanBai)
  }
  if (!d.nhan.every(s => em.some(e => e.sbd === s && e.duocThem))) return null
  if (d.emChuyenLop !== undefined && (!Array.isArray(d.emChuyenLop) || !d.emChuyenLop.every(e => laHo(e) && laChu(e.sbd) && typeof e.hoTen === 'string' && typeof e.tenLop === 'string'))) return null
  return { goiId, tickId: d.tickId, lop, ten: d.ten, revision: d.revision, serverNow: d.serverNow, em, nhan: [...d.nhan], ...(d.emChuyenLop ? { emChuyenLop: d.emChuyenLop as DanhSachNhanBai['emChuyenLop'] } : {}) }
}

export function docAckEmNhanBai(d: Record<string, unknown>, gui: SuaEmNhanBai, nhan: readonly string[]): AckEmNhanBai | null {
  if (d.goiId !== gui.goiId || d.requestId !== gui.requestId || !laPhien(d.revision) || d.revision === gui.revision || !laGio(d.serverNow) || !laTap(d.them) || !laTap(d.bot) || !laTap(d.nhan) || !cungTapEm(d.them, gui.them) || !cungTapEm(d.bot, gui.bot) || !cungTapEm(d.nhan, nhan)) return null
  return d as AckEmNhanBai
}

async function goi(body: object): Promise<KetQuaLenh<Record<string, unknown>>> {
  try {
    const [mat, url] = await Promise.all([loadTeacherSecret(), layDiaChiMayChu()])
    const r = await goiLenh('/gv/goi-bai-7', body, 'Máy chủ chưa có Thêm / Bớt em. Thầy cập nhật app rồi thử lại.')
    // Đổi kết nối/mã trong lúc chờ: không đưa kết quả phiên trước vào màn mới.
    const [matMoi, urlMoi] = await Promise.all([loadTeacherSecret(), layDiaChiMayChu()])
    if (mat !== matMoi || url !== urlMoi) return { ok: false, loai: 'tu_choi', code: 'doi_ket_noi', chu: 'Kết nối vừa thay đổi. Thầy đọc danh sách mới trước khi lưu lại.' }
    return r
  } catch { return { ok: false, loai: 'mang', chu: 'Không nối được máy chủ. Danh sách thầy chọn vẫn được giữ.' } }
}
export async function taiEmNhanBai(goiId: string, lop: string): Promise<KetQuaLenh<DanhSachNhanBai>> {
  const r = await goi({ action: 'doc_em', goiId })
  if (!r.ok) return r
  const du = docEmNhanBai(r.du, goiId, lop)
  return du ? { ok: true, du } : saiDu('Chưa đọc được danh sách nhận đúng bài và lớp. Thầy thử lại.')
}
export async function luuEmNhanBai(gui: SuaEmNhanBai, nhan: readonly string[]): Promise<KetQuaLenh<AckEmNhanBai>> {
  const r = await goi(gui)
  if (!r.ok) return r
  const du = docAckEmNhanBai(r.du, gui, nhan)
  return du ? { ok: true, du } : saiDu('Chưa nhận được xác nhận đầy đủ. Danh sách thầy chọn được giữ; thầy thử lưu lại.')
}
