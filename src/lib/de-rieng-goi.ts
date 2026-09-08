// GÓI ĐỀ RIÊNG GỬI LÊN MÁY CHỦ — hai bản đồ, MỘT ô trên Sheet.
//
// Cột 28 của `CaKiemTra` đang chở bản đồ `sbd → qid`. Nay cần chở thêm bản đồ
// `sbd → qid CÂU LẶP` để máy em đánh dấu "em đã sai câu này buổi trước" ngay
// trong màn làm bài.
//
// VÌ SAO KHÔNG THÊM CỘT 29: sheet `CaKiemTra` của thầy đang chạy có đúng số cột
// bằng `CA_HEADERS` hiện tại; `getRange(row, 29)` trên sheet 28 cột là lỗi
// "range out of bounds" ngay giữa lúc cả lớp đứng ở phòng chờ. Gói hai bản đồ
// vào một ô không đụng tới hình dạng sheet.
//
// DẠNG CŨ VẪN ĐỌC ĐƯỢC: ca mở trước hôm nay cất thẳng `{ "12121212": [...] }`.
// `moGoiDeRieng` nhận cả hai dạng, nên không phải chạy lại ca nào.
//
// TÊN KHOÁ `bo`/`lap` không đụng số báo danh vì số báo danh toàn chữ số.

export interface GoiDeRieng {
  /** sbd → mọi qid của em đó. Máy chủ gắn vào gói đề dưới tên `boTheoEm`. */
  bo: Record<string, string[]>
  /** sbd → qid câu lặp. Máy chủ CHỈ trả phần của chính em đang thi. */
  lap: Record<string, string[]>
}

function banDo(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const ra: Record<string, string[]> = {}
  for (const [k, gia] of Object.entries(v as Record<string, unknown>)) {
    if (!Array.isArray(gia)) continue
    const qids = gia.map((x) => String(x ?? '').trim()).filter(Boolean)
    if (qids.length > 0) ra[k] = qids
  }
  return ra
}

export function dongGoiDeRieng(bo: Record<string, string[]>, lap: Record<string, string[]>): GoiDeRieng {
  return { bo: banDo(bo), lap: banDo(lap) }
}

/** Mở gói ở cả hai dạng — dạng mới `{bo, lap}` và dạng cũ phẳng `{sbd: [...]}`. */
export function moGoiDeRieng(goi: unknown): GoiDeRieng {
  if (!goi || typeof goi !== 'object' || Array.isArray(goi)) return { bo: {}, lap: {} }
  const g = goi as Record<string, unknown>
  // Dạng mới nhận ra bằng khoá `bo` là ĐỐI TƯỢNG. Số báo danh toàn chữ số nên
  // không có em nào tên `bo`, và giá trị của một em là MẢNG chứ không phải đối
  // tượng — hai dấu hiệu độc lập, không nhận nhầm được.
  const co = g.bo && typeof g.bo === 'object' && !Array.isArray(g.bo)
  if (co) return { bo: banDo(g.bo), lap: banDo(g.lap) }
  return { bo: banDo(g), lap: {} }
}

/** Câu lặp của MỘT em, đọc từ gói máy chủ trả về cho chính em đó. */
export function cauLapCuaEm(danhSach: unknown): string[] {
  if (!Array.isArray(danhSach)) return []
  return danhSach.map((x) => String(x ?? '').trim()).filter(Boolean)
}
