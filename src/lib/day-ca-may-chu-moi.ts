// ĐẨY CA, GÓI ĐỀ VÀ DANH SÁCH LỚP LÊN MÁY CHỦ MỚI — 11/09.
//
// VÌ SAO PHẢI CÓ TỆP NÀY: Worker có sẵn `/ca/day` từ đợt 2, nhưng KHÔNG tệp nào
// của app gọi tới. Nghĩa là D1 chưa từng có một ca nào — và vì `luu-tam` với
// `nop` chỉ cập nhật dòng lượt do `/vao-thi` tạo ra, còn `/vao-thi` lại cần ca
// trong D1, nên cả đợt 3 nằm im: bật cờ lên thì mọi lệnh đều lùi về Apps Script.
//
// MỘT LUẬT DUY NHẤT, và nó quyết định mức an toàn của cả tệp:
// **đẩy hỏng KHÔNG BAO GIỜ được chặn việc mở ca.** Apps Script vẫn là nơi ca
// được mở thật. Đẩy lên đây chỉ để đường nóng có chỗ chạy nhanh; hỏng thì ca
// vẫn mở bình thường và cả lớp thi trên đường cũ.
import type { CauHinhMayChu } from './cau-hinh-may-chu'

/** Hạn chờ khi đẩy. Rộng vì gói đề tới vài MB, nhưng vẫn hữu hạn. */
export const HAN_DAY_CA_GIAY = 45

export interface CaDay {
  maCa: string
  tenCa?: string
  trangThai?: string
  batDau?: string
  hetHanVao?: string
  thoiGianPhut?: number
  loai?: string
  hanNop?: string
  congBo?: string
  nguongLan?: number
  nguongGiay?: number
  lop?: string
  phongCho?: boolean
  batDauThiLuc?: string
  giuDeDoc?: boolean
  anHanGiay?: number
  soCau?: unknown
  boTheoEm?: unknown
}

async function guiJson(ch: CauHinhMayChu, maBiMat: string, duong: string, than: unknown, giay: number): Promise<boolean> {
  if (!ch.BAT || !ch.URL) return false
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), giay * 1000)
  try {
    const res = await fetch(`${ch.URL}${duong}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify(than),
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

/** ĐẨY MỘT CA LÊN MÁY CHỦ MỚI, kèm gói đề nếu có.
 *
 * `bank` là bản KHÔNG ĐÁP ÁN — Worker cất vào R2 và phục vụ công khai ở
 * `/de/:maCa`. Đẩy bản có đáp án lên đó là phát đáp án cho cả lớp. */
export async function dayCaMoi(ch: CauHinhMayChu, maBiMat: string, ca: CaDay, bank?: unknown): Promise<boolean> {
  if (!ca?.maCa) return false
  return guiJson(ch, maBiMat, '/ca/day', bank ? { ca, bank } : { ca }, HAN_DAY_CA_GIAY)
}

export interface EmDanhSach {
  sbd: string
  hoTen?: string
  namSinh?: string
  lop?: string
}

/** ĐẨY DANH SÁCH LỚP. Đây là CỔNG CHẶN số báo danh lạ trên máy chủ mới.
 *
 * Chưa đẩy thì bảng rỗng, và Worker cố ý KHÔNG chặn ai — giống hệt luật bên
 * Apps Script. Thà thiếu cổng còn hơn cả lớp đứng ngoài cửa vì thầy quên đẩy. */
export async function dayDanhSachMoi(ch: CauHinhMayChu, maBiMat: string, ds: EmDanhSach[]): Promise<boolean> {
  const sach = (ds ?? []).filter((e) => String(e?.sbd ?? '').trim().length > 0)
  if (sach.length === 0) return false
  return guiJson(ch, maBiMat, '/danh-sach/day', { ds: sach }, HAN_DAY_CA_GIAY)
}
