// TẢI PHIẾU HÀNG LOẠT CHO CẢ MỘT CA.
//
// Chấm xong một ca 30 em thì mở từng hồ sơ để lấy từng ảnh là mất cả buổi. Hàm
// này dựng ảnh cho MỌI em đã chấm trong ca rồi gói thành một tệp .zip, thầy
// giải nén ra là có sẵn 30 ảnh đặt đúng tên từng em.
//
// Số liệu lấy TẠI CHỖ từ kết quả chấm ở máy thầy (`taoChiTietCau`), không gọi
// máy chủ lần nào — một lượt `hoSoEm` mất 2–4 giây, nhân 30 em là 2 phút chờ vô
// nghĩa cho dữ liệu mình đang cầm trong tay.
import { anhPhieuBlob, tenTepPhieu, type ChuyenDeMatDiem, type DuLieuAnhPhieu } from './anh-phieu'
import { taoZip, type TepTrongZip } from './zip'
import type { ChiTietCauRow } from './exam-api'

/** Gộp chi tiết từng câu thành bảng chuyên đề của RIÊNG ca này, sắp giảm dần
 * theo số câu sai. Câu không ghi chuyên đề thì bỏ qua — không gộp vào một ô
 * "khác" vì phiếu gửi phụ huynh không nói được gì với chữ "khác". */
export function chuyenDeTuChiTiet(rows: ChiTietCauRow[]): ChuyenDeMatDiem[] {
  const m = new Map<string, ChuyenDeMatDiem>()
  for (const r of rows) {
    const ten = (r.chuyenDe || '').trim()
    if (!ten) continue
    const c = m.get(ten) ?? { ten, soCau: 0, soSai: 0 }
    c.soCau += 1
    if (r.dungSai === false) c.soSai += 1
    m.set(ten, c)
  }
  return [...m.values()].sort((a, b) => b.soSai - a.soSai || b.soCau - a.soCau)
}

export interface EmTrongCaDeXuatPhieu {
  sbd: string
  hoTen: string
  lop: string
  diem: number
  xepLoai: string
  diemPhan: { I: number; II: number; III: number } | null
  toiDaPhan: { I: number; II: number; III: number } | null
  chiTietCau: ChiTietCauRow[]
  hang: number | null
  siSo: number | null
  nopLuc: string
  vieCanLam: string
}

/** Dựng ảnh cho từng em rồi gói .zip. `moiAnh` báo tiến độ để màn hiện "12/30". */
export async function goiPhieuCaZip(
  ds: EmTrongCaDeXuatPhieu[],
  tenCa: string,
  moiAnh?: (da: number, tong: number) => void,
): Promise<Blob> {
  const tep: TepTrongZip[] = []
  const daDung = new Set<string>()
  for (let i = 0; i < ds.length; i++) {
    const e = ds[i]
    const cd = chuyenDeTuChiTiet(e.chiTietCau)
    const soSai = e.chiTietCau.filter((r) => r.dungSai === false).length
    const du: DuLieuAnhPhieu = {
      hoTen: e.hoTen,
      sbd: e.sbd,
      lop: e.lop,
      tenCa,
      ngay: e.nopLuc,
      diem: e.diem,
      xepLoai: e.xepLoai,
      diemPhan: e.diemPhan,
      toiDaPhan: e.toiDaPhan,
      soCauSai: soSai,
      tongSoCau: e.chiTietCau.length || null,
      hang: e.hang,
      siSo: e.siSo,
      chuyenDe: cd.filter((c) => c.soSai > 0),
      vieCanLam: e.vieCanLam,
    }
    const blob = await anhPhieuBlob(du)
    // Hai em trùng tên là chuyện thường trong danh sách 251 em — thêm số báo
    // danh để không em nào bị ghi đè mất phiếu trong lúc giải nén.
    let ten = tenTepPhieu(e.hoTen, e.sbd, e.nopLuc)
    if (daDung.has(ten)) ten = ten.replace(/\.png$/, `-${e.sbd}.png`)
    daDung.add(ten)
    tep.push({ ten, duLieu: new Uint8Array(await blob.arrayBuffer()) })
    moiAnh?.(i + 1, ds.length)
  }
  return taoZip(tep)
}

/** Tên tệp zip: có tên ca và ngày để thầy tìm lại được sau vài tuần. */
export function tenTepZipCa(tenCa: string, maCa: string, luc = new Date()): string {
  const ten = (tenCa || `ca-${maCa}`)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const ns = `${luc.getFullYear()}${String(luc.getMonth() + 1).padStart(2, '0')}${String(luc.getDate()).padStart(2, '0')}`
  return `phieu-${ten || maCa}-${ns}.zip`
}
