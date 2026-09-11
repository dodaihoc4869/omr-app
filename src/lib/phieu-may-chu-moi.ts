// PHIẾU BÁO CÁO TRÊN MÁY CHỦ MỚI — 11/09.
//
// VÌ SAO: phiếu đang nằm trong sheet `PhieuKetQua`, mỗi gói tới 4 MB. Đo trên
// máy chủ cũ SAU KHI đã tối ưu (v72): `layPhieu` 20 lượt đồng thời cho
// p50 5,13 s · p95 5,85 s. Phụ huynh bấm link rồi ngồi nhìn năm giây.
//
// R2 đọc thẳng ở biên: cùng gói dữ liệu ấy, tính bằng trăm mili giây.
//
// HAI LUẬT GIỮ CHO KHÔNG MẤT PHIẾU NÀO:
//
//   1. GHI CẢ HAI NƠI. Máy chủ mới trước (nhanh), Apps Script sau (vẫn là
//      nguồn sự thật). Đẩy R2 hỏng thì KHÔNG chặn việc lưu — thầy vẫn có phiếu
//      như hôm nay, chỉ là mở chậm hơn.
//   2. ĐỌC MÁY CHỦ MỚI TRƯỚC, HỎNG THÌ HỎI CHỖ CŨ. Mọi phiếu tạo trước hôm nay
//      chỉ nằm bên Apps Script, nên 404 ở đây nghĩa là "hỏi chỗ cũ", KHÔNG phải
//      "báo đỏ cho phụ huynh".
import type { CauHinhMayChu } from './cau-hinh-may-chu'

/** Hạn chờ khi ĐỌC phiếu. Ngắn có chủ ý: đây chỉ là đường tắt, hỏng thì đã có
 * Apps Script đỡ. Chờ lâu ở đây chỉ làm phụ huynh đợi thêm rồi mới bắt đầu
 * đường chắc chắn. */
export const HAN_DOC_PHIEU_GIAY = 4

/** Hạn chờ khi GHI. Rộng hơn vì gói tới 4 MB, và ghi xong ở đây là phụ huynh
 * mở nhanh — đáng chờ. Vẫn ngắn hơn hẳn 90 giây của đường cũ. */
export const HAN_GHI_PHIEU_GIAY = 30

export interface GoiPhieu {
  ma: string
  maCa: string
  sbd: string
  hoTen: string
  loai?: string
  phieu: unknown
}

/** ĐẨY PHIẾU LÊN MÁY CHỦ MỚI. Trả `true` khi đã lên; MỌI trục trặc trả `false`
 * và chỗ gọi bỏ qua — đây là đường tắt, không phải nghĩa vụ. */
export async function dayPhieuMoi(ch: CauHinhMayChu, maBiMat: string, d: GoiPhieu): Promise<boolean> {
  if (!ch.BAT || !ch.URL) return false
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), HAN_GHI_PHIEU_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/phieu/day`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify(d),
      signal: bo.signal,
    })
    if (!res.ok) return false
    const j = (await res.json()) as { ok?: boolean }
    return !!j?.ok
  } catch {
    return false
  } finally {
    clearTimeout(hen)
  }
}

/** ĐỌC PHIẾU TỪ MÁY CHỦ MỚI.
 *
 * Trả `null` nghĩa là "hỏi chỗ cũ" — dùng cho cả ba trường hợp: cờ tắt, không
 * có ở R2 (phiếu cũ), và mạng hỏng. Chỗ gọi không cần phân biệt.
 *
 * Phiếu đã THU HỒI cũng trả `null`: bên Apps Script sẽ nói "không tìm thấy
 * phiếu" bằng đúng câu chữ phụ huynh vẫn thấy, không đẻ thêm một câu lỗi mới. */
export async function layPhieuMoi(ch: CauHinhMayChu, ma: string): Promise<unknown | null> {
  if (!ch.BAT || !ch.URL || !ma) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), HAN_DOC_PHIEU_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/phieu/${encodeURIComponent(ma)}`, { signal: bo.signal })
    if (!res.ok) return null
    const j = (await res.json()) as { thuHoi?: boolean; phieu?: unknown }
    if (j?.thuHoi) return null
    return j?.phieu ?? null
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}
