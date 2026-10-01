// BÀI BỔ SUNG (01/10) — phía app thầy. Máy chủ: server/src/bai-bo-sung.ts.
// Đáp án máy em gửi tới SAU KHI lượt đã đóng (máy chủ chốt hộ lúc hết giờ / thầy khoá) mà khác bài đã chốt ⇒ chờ thầy Nhận hoặc Bỏ.
import { layCauHinhMayChu } from './may-chu-moi'

export interface BaiBoSung {
  khoa: string
  maCa: string
  tenCa: string
  sbd: string
  hoTen: string
  lanThu: number
  soCauMoi: number
  guiLuc: string
  nopLuc: string
}

async function goi<T>(maBiMat: string, duong: string, than: unknown): Promise<T> {
  const ch = await layCauHinhMayChu()
  if (!ch.URL) throw new Error('Chưa có địa chỉ máy chủ')
  const r = await fetch(`${ch.URL}${duong}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
    body: JSON.stringify(than),
  })
  const j = (await r.json().catch(() => null)) as (T & { ok?: boolean; error?: string }) | null
  if (!r.ok || !j || j.ok === false) throw new Error(j?.error || `Máy chủ trả lỗi ${r.status}`)
  return j
}

export async function layBaiBoSung(maBiMat: string, maCa?: string): Promise<BaiBoSung[]> {
  const j = await goi<{ ds?: BaiBoSung[] }>(maBiMat, '/bo-sung/ds', maCa ? { maCa } : {})
  return j.ds ?? []
}

export async function xuLyBaiBoSung(maBiMat: string, khoa: string, nhan: boolean): Promise<{ chamLai?: boolean; loiChamLai?: string }> {
  return goi(maBiMat, '/bo-sung/xu-ly', { khoa, nhan })
}
