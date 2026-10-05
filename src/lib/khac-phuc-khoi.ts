// KHẮC PHỤC · KHỐI CỦA EM (Code 4, 21/09/2026 — P0 thầy báo 20:28: "học sinh lớp 11 nhận câu của lớp 12"). Luật Boss: mọi kênh rút câu TỰ ĐỘNG chỉ đưa câu KHỐI EM hoặc THẤP hơn
// (định nghĩa dùng chung `src/lib/khoi-cau.ts` của Code 1). Ở màn Khắc phục: chế độ "Luyện dạng bài" từng MẶC ĐỊNH lớp 12 cho mọi em và cho em tự đổi sang lớp cao hơn; kho đề rút câu
// (chế độ 2, 3, 4) không lọc khối. Nay: (1) danh mục dạng bài chỉ còn lớp ≤ khối em, (2) mặc định = khối em, (3) mọi nguồn đề rút câu đi qua bộ lọc khối.
//
// LUẬT THẦY 05/10 (thay luật 21/09, nguyên văn): "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
// ⇒ chỉ lớp/đề ĐÚNG khối em (khác khối thấp hay cao đều chặn); lớp/đề không đọc ra khối ⇒ chặn; khối em không rõ (chưa xếp lớp) ⇒ không lớp/đề nào.
// THUẦN: không IO, không đồng hồ, không localStorage/window.
// Lọc theo NGUỒN ĐỀ (mã tờ `DB-12-B8-D1` / nhóm "12 · …"), không theo từng câu: cả tờ cùng một khối, và phiếu in đã dựng từ cả tờ nên lọc câu lẻ sau khi dựng sẽ để lọt vào phiếu.
import { khoiCuaEm, khoiCuaLop, locCauHopKhoi, type Khoi } from './khoi-cau'

/** Khối của em từ chuỗi lớp em đang học ("11", "12 - Tinh Hoa"…). Rỗng / lạ ⇒ null (không rõ). */
export function khoiEmTuLop(lop: unknown): Khoi | null {
  return khoiCuaEm({ lop })
}

/** Các lớp em ĐƯỢC CHỌN trong danh mục: lớp ĐÚNG khối em (luật thầy 05/10; trước đây lớp ≤ khối em). Lớp không đọc ra khối (tên lạ) ⇒ bỏ; khối em không rõ ⇒ rỗng. Không sửa đầu vào, giữ thứ tự. */
export function lopEmDuocChon<T extends { lop: string }>(khoiEm: Khoi | null, lops: readonly T[]): T[] {
  if (!Array.isArray(lops)) return []
  if (khoiEm === null) return []
  return lops.filter((l) => khoiCuaLop(l.lop) === khoiEm)
}

/** Lớp chọn sẵn: đúng khối em nếu có trong danh mục; không thì lớp CAO NHẤT còn được chọn. Khối em không rõ ⇒ như cũ (lớp 12, không có thì lớp cuối). Danh mục rỗng ⇒ "". */
export function lopMacDinhCuaEm<T extends { lop: string }>(khoiEm: Khoi | null, lopsDuocChon: readonly T[]): string {
  if (!Array.isArray(lopsDuocChon) || lopsDuocChon.length === 0) return ''
  const cuoi = lopsDuocChon[lopsDuocChon.length - 1]!.lop
  if (khoiEm === null) return lopsDuocChon.find((l) => khoiCuaLop(l.lop) === 12)?.lop ?? cuoi
  const dung = lopsDuocChon.find((l) => khoiCuaLop(l.lop) === khoiEm)
  if (dung) return dung.lop
  let cao: T | null = null
  for (const l of lopsDuocChon) {
    const k = khoiCuaLop(l.lop)
    if (k !== null && (cao === null || k > (khoiCuaLop(cao.lop) ?? 0))) cao = l
  }
  return (cao ?? lopsDuocChon[lopsDuocChon.length - 1]!).lop
}

/** Các nút "Lớp N" hiện ra: CHỈ lớp đúng khối em (luật thầy 05/10; trước đây 10, 11, 12 mà ≤ khối em); khối em không rõ ⇒ không nút nào. */
export function cacLopHienThi(khoiEm: Khoi | null): string[] {
  return ['10', '11', '12'].filter((l) => khoiEm !== null && Number(l) === khoiEm)
}

/** Em này có được chọn lớp `lop` không (chặn cả khi máy bị sửa/bấm tay sang lớp khác). Luật thầy 05/10: chỉ lớp ĐÚNG khối em; lớp lạ / khối em không rõ ⇒ không. */
export function duocChonLop(khoiEm: Khoi | null, lop: string): boolean {
  return khoiEm !== null && khoiCuaLop(lop) === khoiEm
}

/** Nguồn đề (`TeacherExamSource`: `maDe`, `nhom`) ĐÚNG khối em (luật thầy 05/10); đề khác khối / không rõ khối bị bỏ. Giữ thứ tự, không sửa đầu vào. */
export function nguonHopKhoi<T>(khoiEm: Khoi | null, nguon: readonly T[]): T[] {
  return locCauHopKhoi(khoiEm, nguon)
}
