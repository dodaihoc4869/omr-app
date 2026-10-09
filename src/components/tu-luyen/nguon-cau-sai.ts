// Chọn NGUỒN câu sai cho chế độ 1 "Sửa câu sai" (thầy lệnh 30/09: "cho hs chọn tick nguồn để rút câu").
// Máy chủ (`server/src/tu-luyen-cau-sai.ts` `demTheoNguon`) trả sẵn:
//   · theoNguon — số câu còn trong kho theo từng nguồn (câu sai ở nhiều nguồn đếm cho MỖI nguồn);
//   · theoMat   — số câu theo MẶT NẠ nguồn (bit i = DS_NGUON[i]) ⇒ máy em tính NGAY tổng câu DUY NHẤT khi tick, không hỏi lại máy chủ.
// Thứ tự DS_NGUON PHẢI trùng `DS_NGUON_SAI` của máy chủ (test khoá).

export type MaNguonSai = 'ca' | 'dao' | 'doan' | 'bia' | 'tu_luyen' | 'luyen_de'
export const DS_NGUON: readonly { ma: MaNguonSai; ten: string }[] = [
  { ma: 'ca', ten: 'Ca kiểm tra' },
  { ma: 'dao', ten: 'Bát Linh Đảo' },
  { ma: 'doan', ten: 'Đoàn Hộ Tống' },
  { ma: 'bia', ten: 'Bi-a' },
  { ma: 'tu_luyen', ten: 'Tu luyện' },
  { ma: 'luyen_de', ten: 'Luyện đề cấu trúc' },
]
const LA_MA = new Set<string>(DS_NGUON.map((n) => n.ma))

/** Mặt nạ của tập nguồn đã tick. */
export function matChon(chon: Iterable<string>): number {
  let m = 0
  for (const x of chon) {
    const i = DS_NGUON.findIndex((n) => n.ma === x)
    if (i >= 0) m |= 1 << i
  }
  return m
}

/** Số câu DUY NHẤT còn trong kho thuộc ít nhất một nguồn đã tick. */
export function demChon(theoMat: Readonly<Record<string, number>>, chon: Iterable<string>): number {
  const m = matChon(chon)
  if (!m) return 0
  let n = 0
  for (const [k, so] of Object.entries(theoMat)) if (Number(k) & m) n += Number(so) || 0
  return n
}

/** Nguồn đang có câu (được phép tick). */
export const nguonCoCau = (theoNguon: Readonly<Record<string, number>>): MaNguonSai[] =>
  DS_NGUON.filter((n) => (Number(theoNguon[n.ma]) || 0) > 0).map((n) => n.ma)

// ---- nhớ lựa chọn theo máy: lưu các nguồn em ĐÃ BỎ tick (nguồn mới xuất hiện sau này tự được tick).
const khoa = (sbd: string) => `tlu-nguon-sai:${sbd}`
export function docNhoNguon(sbd: string): string[] | null {
  try {
    const o = JSON.parse(localStorage.getItem(khoa(sbd)) || 'null') as { bo?: unknown } | null
    return o && Array.isArray(o.bo) ? o.bo.map(String).filter((x) => LA_MA.has(x)) : null
  } catch {
    return null
  }
}
export function ghiNhoNguon(sbd: string, chon: ReadonlySet<string>, theoNguon: Readonly<Record<string, number>>) {
  try {
    localStorage.setItem(khoa(sbd), JSON.stringify({ bo: nguonCoCau(theoNguon).filter((m) => !chon.has(m)) }))
  } catch { /* chế độ riêng tư / chặn lưu: bỏ qua */ }
}

/** Lựa chọn ban đầu: mọi nguồn có câu, trừ nguồn em đã bỏ lần trước; còn lại rỗng ⇒ về mặc định tick tất cả. */
export function chonMacDinh(theoNguon: Readonly<Record<string, number>>, bo: readonly string[] | null): Set<MaNguonSai> {
  const co = nguonCoCau(theoNguon)
  const giu = co.filter((m) => !bo?.includes(m))
  return new Set(giu.length ? giu : co)
}
