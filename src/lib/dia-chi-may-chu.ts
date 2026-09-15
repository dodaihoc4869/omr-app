// ĐỊA CHỈ MÁY CHỦ — MỘT NGUỒN DUY NHẤT CHO MỌI MÁY, MỌI APP.
//
// ─────────────────────────────────────────────────────────────────────────
// THẦY BÁO 15/09, kèm ảnh ca Test7 (SBD 12121212, 9 câu cần chữa):
//   "Nút khắc phục ngay 9 câu sai bấm không phản hồi trên điện thoại của học
//    sinh, trên Chrome máy tính vẫn bấm được."
//
// ĐO THẬT trước khi sửa — gọi thẳng máy chủ cho đúng em ấy, đúng ca ấy:
//   POST https://omr.ttadodaihoc.workers.dev/hs/cau-sai
//   → 200 · ok: true · 9 câu · 16.649 byte · 1.257 ms
// Máy chủ KHÔNG hỏng, gói trả về nhỏ, không có gì để chậm.
//
// NGUYÊN NHÂN GỐC — `scriptUrl` là một giá trị CHẾT mà vẫn canh cửa:
//
//   · 12/09 thầy cắt hẳn Google. Khoá `scriptUrl` bị gỡ khỏi
//     `public/cau-hinh.json`, và `postJson` chặn cứng mọi địa chỉ Google.
//   · `loadScriptUrlHoacMacDinh()` chạy MỘT LẦN lúc màn mở. Nó đọc IndexedDB,
//     không có thì hỏi `layCauHinhMayChu()`, vẫn không có thì tải
//     `cau-hinh.json` tìm khoá `scriptUrl` — khoá đã bị gỡ ⇒ trả về rỗng.
//     Rỗng rồi thì KHÔNG ai thử lại nữa cho tới lần mở app sau.
//   · Máy tính của thầy còn giữ `scriptUrl` cũ trong IndexedDB từ trước 12/09
//     ⇒ luôn khác rỗng ⇒ mọi cổng canh đều lọt.
//   · Điện thoại em chưa từng lưu khoá ấy, và lúc màn mở thì lượt nạp địa chỉ
//     ở `main.tsx` có thể chưa xong ⇒ rỗng, và rỗng vĩnh viễn cả phiên.
//
// Hai màn báo cáo canh cửa bằng đúng giá trị chết ấy:
//   `if (!baiThi.maCa || !scriptUrl) return`
// nên trên điện thoại lượt gọi `hsCauSai` KHÔNG BAO GIỜ được bắn đi. Không
// phải nút hỏng — nút không có gì để mở.
//
// Cùng họ lỗi với vụ 60-vs-579 ngày 14/09: MÀN PHỤ THUỘC VÀO MỘT GIÁ TRỊ CẤT
// TRONG MÁY ĐANG MỞ. Chữa bằng cách bỏ hẳn sự phụ thuộc ấy, không phải bằng
// cách đoán giá trị giỏi hơn.
//
// ─────────────────────────────────────────────────────────────────────────
// LUẬT CỦA TỆP NÀY
//   1. Cấm ném lỗi. Không ra được địa chỉ thì trả chuỗi rỗng.
//   2. Cấm nhớ cái rỗng. Lần trước không ra thì lần này PHẢI thử lại — đó
//      chính là chỗ bản cũ chết cứng.
//   3. Cấm trả về địa chỉ Google. Đường ấy đã cắt từ 12/09.
import { layCauHinhMayChu, xongNapDiaChi } from './may-chu-moi'
import { loadDiaChiMayChuMoiChoEm } from './exam-db'

/** Địa chỉ Google — đã cắt từ 12/09, trả về là dẫn em vào ngõ cụt. */
function laGoogle(u: string): boolean {
  return /(^|\.)google\.com|googleusercontent|script\.googleapis/i.test(u)
}

function don(u: unknown): string {
  const s = String(u ?? '').trim().replace(/\/+$/, '')
  if (!s || !s.startsWith('https://') || laGoogle(s)) return ''
  return s
}

/** Nhớ địa chỉ ĐÃ RA ĐƯỢC. Không bao giờ nhớ chuỗi rỗng (luật 2). */
let daBiet = ''

/** Chỉ dùng cho phép kiểm. */
export function quenDiaChiMayChu(): void {
  daBiet = ''
}

/**
 * Địa chỉ máy chủ cho MỌI lượt gọi của học sinh và phụ huynh.
 *
 * Thứ tự: cấu hình trong máy → gợi ý chỗ gọi đưa vào → chờ lượt nạp lúc khởi
 * động → tải thẳng `cau-hinh.json`. Bốn đường cùng chỉ về một địa chỉ; đường
 * nào ra trước thì lấy.
 *
 * @param goiY địa chỉ chỗ gọi sẵn có (thường là `scriptUrl` đời cũ). Rỗng cũng
 *             không sao — đó chính là điểm của tệp này.
 */
export async function layDiaChiMayChu(goiY = ''): Promise<string> {
  if (daBiet) return daBiet

  try {
    const ch = await layCauHinhMayChu()
    const u = don(ch.URL)
    if (u) return (daBiet = u)
  } catch {
    // IndexedDB hỏng (máy em ở chế độ riêng tư, hết chỗ) — còn ba đường nữa.
  }

  const g = don(goiY)
  if (g) return (daBiet = g)

  // Lượt nạp ở `main.tsx` có thể đang chạy dở. Chờ nó rồi hỏi lại.
  try {
    await xongNapDiaChi()
    const ch = await layCauHinhMayChu()
    const u = don(ch.URL)
    if (u) return (daBiet = u)
  } catch {
    // vẫn còn đường cuối
  }

  // Đường cuối: tải thẳng tệp cấu hình cùng gốc (service worker đã đệm sẵn).
  try {
    const u = don(await loadDiaChiMayChuMoiChoEm())
    if (u) return (daBiet = u)
  } catch {
    // hết đường
  }

  return ''
}
