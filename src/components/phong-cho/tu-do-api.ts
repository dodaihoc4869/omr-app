// LỆNH MÁY CHỦ của tủ đồ bé ma / thẻ sảnh Sinh Tồn (đợt 4; server/src/sinh-ton-du-lieu.ts). Em xác thực bằng vé phòng chờ ca (`ve`) hoặc token game (`token`).
// Không ném lỗi: hỏng / chậm / máy chủ cũ ⇒ null (màn giữ thẻ như cũ, không hiện phần thêm). Chỉ nạp cùng các mảnh lười của thẻ sảnh / tủ đồ.
import { layCauHinhMayChu } from '../../lib/may-chu-moi'
import { DO_BE_MA, chuanMac, chuanThanhTich, type BoMac, type LoaiDanhHieu, type ThanhTich } from '../../lib/live-khoi/tu-do'

export type XacThucEm = { ve: string } | { token: string }
export interface DuLieuTuDo {
  cap: number; chuoi: number; mo: string[]; mac: BoMac; thanhTich: ThanhTich; huyHieu: string[]
  /** Đội cả học kỳ (0 Natri · 1 Kali · 2 Đồng · 3 Canxi) — null khi chưa gán được. */ doiKy: number | null
  danhHieu: LoaiDanhHieu[]
  thiDua: { chuTuan: string; doi: number[] }
}
const HAN_MS = 12_000
const MA_DO = new Set(DO_BE_MA.map((d) => d.ma))
const LOAI_DH = new Set(['tho-san', 'pha-tk', 'ha-thay'])

async function goi(duong: string, than: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const dk = new AbortController(), hen = setTimeout(() => dk.abort(), HAN_MS)
  try {
    const goc = (await layCauHinhMayChu()).URL || ''
    if (!goc) return null
    const r = await fetch(`${goc.replace(/\/+$/, '')}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than), signal: dk.signal })
    const j = (await r.json().catch(() => null)) as Record<string, unknown> | null
    return j && typeof j === 'object' && !Array.isArray(j) ? j : null
  } catch { return null } finally { clearTimeout(hen) }
}

export function docDuLieuTuDo(j: Record<string, unknown> | null): DuLieuTuDo | null {
  if (!j || j.ok !== true) return null
  const td = (j.thiDua ?? {}) as Record<string, unknown>, doi = Number(j.doiKy)
  const vach = Array.isArray(td.doi) ? td.doi.slice(0, 4).map((x) => Math.max(0, Math.floor(Number(x)) || 0)) : []
  return {
    cap: Math.max(0, Math.floor(Number(j.cap)) || 0), chuoi: Math.max(0, Math.floor(Number(j.chuoi)) || 0),
    mo: Array.isArray(j.mo) ? j.mo.filter((m): m is string => typeof m === 'string' && MA_DO.has(m)) : [],
    mac: chuanMac(j.mac), thanhTich: chuanThanhTich(j.thanhTich),
    huyHieu: Array.isArray(j.huyHieu) ? j.huyHieu.filter((m): m is string => typeof m === 'string') : [],
    doiKy: j.doiKy != null && doi >= 0 && doi < 4 ? Math.floor(doi) : null,
    danhHieu: Array.isArray(j.danhHieu) ? j.danhHieu.filter((m): m is LoaiDanhHieu => typeof m === 'string' && LOAI_DH.has(m)) : [],
    thiDua: { chuTuan: typeof td.chuTuan === 'string' ? td.chuTuan : '', doi: vach.length === 4 ? vach : [0, 0, 0, 0] },
  }
}

export const taiTuDo = async (xt: XacThucEm): Promise<DuLieuTuDo | null> => docDuLieuTuDo(await goi('/hs/bpu/st-tu-do', xt))
/** Mặc đồ: máy chủ kiểm quyền. Trả bộ đồ đã lưu, hoặc câu báo vì sao không mặc được. */
export async function macDo(xt: XacThucEm, mac: BoMac): Promise<{ ok: true; mac: BoMac } | { ok: false; chu: string }> {
  const j = await goi('/hs/bpu/st-mac', { ...xt, mac })
  if (j?.ok === true) return { ok: true, mac: chuanMac(j.mac) }
  return { ok: false, chu: typeof j?.error === 'string' && j.error ? j.error : 'Chưa lưu được. Em thử lại sau ít giây.' }
}
