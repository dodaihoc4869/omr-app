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
  /** sbd → qid → SỐ LẦN em đã sai câu đó TRƯỚC ca này. Cần cho nhãn "sai lần
   * thứ N"; để ở đây thì máy nào mở ca cũng đếm được, không phải đúng cái máy
   * đã bấm Bắt đầu (thầy chốt 08/09: "máy nào cũng được"). */
  dem: Record<string, Record<string, number>>
  /** BIÊN BẢN lúc rút — thứ trả lời "vì sao em này không có câu hỏi lại".
   * Dạng tự do vì nó chỉ để đọc, không có gì tính toán dựa vào nó. */
  bb: Record<string, unknown> | null
}

function banDoSo(v: unknown): Record<string, Record<string, number>> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const ra: Record<string, Record<string, number>> = {}
  for (const [k, gia] of Object.entries(v as Record<string, unknown>)) {
    if (!gia || typeof gia !== 'object' || Array.isArray(gia)) continue
    const mot: Record<string, number> = {}
    for (const [q, n] of Object.entries(gia as Record<string, unknown>)) {
      const so = Number(n)
      if (Number.isFinite(so) && so > 0) mot[q] = Math.floor(so)
    }
    if (Object.keys(mot).length > 0) ra[k] = mot
  }
  return ra
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

export function dongGoiDeRieng(
  bo: Record<string, string[]>,
  lap: Record<string, string[]>,
  dem: Record<string, Record<string, number>> = {},
  bb: Record<string, unknown> | null = null,
): GoiDeRieng {
  return { bo: banDo(bo), lap: banDo(lap), dem: banDoSo(dem), bb: bb && typeof bb === 'object' ? bb : null }
}

/** Mở gói ở cả hai dạng — dạng mới `{bo, lap}` và dạng cũ phẳng `{sbd: [...]}`. */
export function moGoiDeRieng(goi: unknown): GoiDeRieng {
  if (!goi || typeof goi !== 'object' || Array.isArray(goi)) return { bo: {}, lap: {}, dem: {}, bb: null }
  const g = goi as Record<string, unknown>
  // Dạng mới nhận ra bằng khoá `bo` là ĐỐI TƯỢNG. Số báo danh toàn chữ số nên
  // không có em nào tên `bo`, và giá trị của một em là MẢNG chứ không phải đối
  // tượng — hai dấu hiệu độc lập, không nhận nhầm được.
  const co = g.bo && typeof g.bo === 'object' && !Array.isArray(g.bo)
  if (co) return { bo: banDo(g.bo), lap: banDo(g.lap), dem: banDoSo(g.dem), bb: g.bb && typeof g.bb === 'object' && !Array.isArray(g.bb) ? (g.bb as Record<string, unknown>) : null }
  return { bo: banDo(g), lap: {}, dem: {}, bb: null }
}

/** SỐ LẦN SAI TỪNG CÂU của MỘT em, đọc từ gói máy chủ trả về cho chính em đó.
 *
 * Máy chủ bản cũ không gửi trường này. Có `cauLap` mà thiếu `dem` thì dựng
 * `{qid: 0}` — vẫn đủ để báo cáo gắn nhãn "câu em đã sai buổi trước", chỉ là
 * không nói được sai lần thứ mấy. Thiếu hẳn còn tệ hơn (thầy bắt được 08/09:
 * "học sinh thi xong nhưng chưa thống kê là đã làm sai câu trước"). */
export function demLapCuaEm(dem: unknown, cauLap: string[] = []): Record<string, number> {
  const ra: Record<string, number> = {}
  if (dem && typeof dem === 'object' && !Array.isArray(dem)) {
    for (const [q, n] of Object.entries(dem as Record<string, unknown>)) {
      const so = Number(n)
      if (q && Number.isFinite(so) && so >= 0) ra[q] = Math.max(0, Math.floor(so))
    }
  }
  for (const q of cauLap) if (q && !(q in ra)) ra[q] = 0
  return ra
}

/** Câu lặp của MỘT em, đọc từ gói máy chủ trả về cho chính em đó. */
export function cauLapCuaEm(danhSach: unknown): string[] {
  if (!Array.isArray(danhSach)) return []
  return danhSach.map((x) => String(x ?? '').trim()).filter(Boolean)
}
