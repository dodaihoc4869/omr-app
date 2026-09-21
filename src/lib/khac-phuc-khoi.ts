// KHẮC PHỤC · KHỐI CỦA EM (Code 4, 21/09/2026 — P0 thầy báo 20:28: "học sinh lớp 11 nhận câu của lớp 12"). Luật Boss: mọi kênh rút câu TỰ ĐỘNG chỉ đưa câu KHỐI EM hoặc THẤP hơn
// (định nghĩa dùng chung `src/lib/khoi-cau.ts` của Code 1). Ở màn Khắc phục: chế độ "Luyện dạng bài" từng MẶC ĐỊNH lớp 12 cho mọi em và cho em tự đổi sang lớp cao hơn; kho đề rút câu
// (chế độ 2, 3, 4) không lọc khối. Nay: (1) danh mục dạng bài chỉ còn lớp ≤ khối em, (2) mặc định = khối em, (3) mọi nguồn đề rút câu đi qua bộ lọc khối.
//
// THUẦN: không IO, không đồng hồ, không localStorage/window. "Không biết ⇒ không kết tội" (như khoi-cau.ts): khối em không rõ (chưa xếp lớp) ⇒ giữ nguyên như cũ, KHÔNG chặn.
// Lọc theo NGUỒN ĐỀ (mã tờ `DB-12-B8-D1` / nhóm "12 · …"), không theo từng câu: cả tờ cùng một khối, và phiếu in đã dựng từ cả tờ nên lọc câu lẻ sau khi dựng sẽ để lọt vào phiếu.
import { khoiCuaEm, khoiCuaLop, locCauHopKhoi, type Khoi } from './khoi-cau'

/** Khối của em từ chuỗi lớp em đang học ("11", "12 - Tinh Hoa"…). Rỗng / lạ ⇒ null (không rõ). */
export function khoiEmTuLop(lop: unknown): Khoi | null {
  return khoiCuaEm({ lop })
}

/** Các lớp em ĐƯỢC CHỌN trong danh mục: lớp ≤ khối em. Lớp không đọc ra khối (tên lạ) giữ lại; khối em không rõ ⇒ giữ hết. Không sửa đầu vào, giữ thứ tự. */
export function lopEmDuocChon<T extends { lop: string }>(khoiEm: Khoi | null, lops: readonly T[]): T[] {
  if (!Array.isArray(lops)) return []
  if (khoiEm === null) return [...lops]
  return lops.filter((l) => {
    const k = khoiCuaLop(l.lop)
    return k === null || k <= khoiEm
  })
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

/** Các nút "Lớp N" hiện ra: 10, 11, 12 mà ≤ khối em (khối em không rõ ⇒ đủ ba). */
export function cacLopHienThi(khoiEm: Khoi | null): string[] {
  return ['10', '11', '12'].filter((l) => khoiEm === null || Number(l) <= khoiEm)
}

/** Em này có được chọn lớp `lop` không (chặn cả khi máy bị sửa/bấm tay sang lớp cao hơn). Lớp lạ ⇒ được (không biết ⇒ không kết tội). */
export function duocChonLop(khoiEm: Khoi | null, lop: string): boolean {
  const k = khoiCuaLop(lop)
  return khoiEm === null || k === null || k <= khoiEm
}

/** Nguồn đề (`TeacherExamSource`: `maDe`, `nhom`) hợp khối em; đề khối CAO hơn bị bỏ. Giữ thứ tự, không sửa đầu vào. */
export function nguonHopKhoi<T>(khoiEm: Khoi | null, nguon: readonly T[]): T[] {
  return locCauHopKhoi(khoiEm, nguon)
}
