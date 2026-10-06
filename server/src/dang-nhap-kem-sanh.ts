// ĐĂNG NHẬP KÈM SẢNH (D1, tối ưu vòng 2 06/10 — thầy: "app thật mượt mà nhanh gấp 2 lần", GIỮ NGUYÊN giao diện và hành vi đăng nhập).
//
// Trước: máy em đăng nhập xong (một vòng mạng) rồi MỚI hỏi Sảnh (`/game-v2/hoa2-sanh`, vòng mạng thứ hai) — hai vòng nối tiếp trước khi Sảnh có số.
// Nay: máy em (cổng học sinh `AppHocSinh`) gửi thêm `kemSanh: true` trong thân lệnh đăng nhập; đăng nhập THÀNH CÔNG thì máy chủ TRẢ LỜI THEO LUỒNG (NDJSON):
//   · DÒNG 1 — đúng thân phản hồi đăng nhập cũ (token, họ tên, lớp…) đi NGAY, không chờ Sảnh;
//   · DÒNG 2 — `{"sanh": <phản hồi lệnh hoa2-sanh của em, hoặc null>}` đi khi Sảnh xong (máy chủ chạy luôn đúng lệnh `hoa2-sanh` của em bằng token vừa cấp — token đã nằm
//     trong đệm xác thực nên không tốn thêm một đợt D1 kiểm mật khẩu).
// Máy em nhận dòng 1 là vào cổng và bắn NGAY các lệnh Sảnh còn lại (kế hoạch ngày, ca đang mở…) như cũ — KHÔNG lệnh nào bị chậm lại vì Sảnh; dòng 2 về thì làm phản hồi
// "hỏi sớm" của Sảnh (src/lib/hoi-som.ts) ⇒ Sảnh có số sớm hơn đúng MỘT vòng mạng. Tổng số lệnh tới máy chủ giảm một (không gửi `hoa2-sanh` nữa), tổng việc D1 y như cũ.
// (Vì sao KHÔNG nhét Sảnh vào MỘT thân JSON duy nhất: lệnh đăng nhập sẽ phải chờ hết thời gian D1 của Sảnh (hàng chục đợt) rồi máy em mới bắn được kế hoạch ngày
//  ⇒ thần thú/EXP của Sảnh hiện CHẬM hơn trước. Theo luồng thì dòng 1 không chờ gì.)
//
// An toàn (đăng nhập KHÔNG bao giờ xấu đi vì phần thêm này):
//  · CHỈ chạy khi đăng nhập đã thành công VÀ máy em xin (`kemSanh === true`); sai mật khẩu / chưa có mật khẩu / lỗi ⇒ phản hồi JSON y hệt cũ, không luồng.
//  · Sảnh lỗi (ném lỗi, `ok:false`) hoặc quá hạn `HAN_SANH_KEM_MS` ⇒ dòng 2 là `{"sanh":null}`; đăng nhập đã trả đủ ở dòng 1; máy em tự hỏi Sảnh như cũ.
//  · `hoa2-sanh` có thể GHI (lập kế hoạch ngày lần đầu) — chạy đúng như lệnh riêng: đăng nhập đã qua cổng đóng băng reset ở đầu `fetch`; lệnh ghi lặp (máy em quá hạn
//    rồi hỏi lại) là điều các lệnh Sảnh vốn chịu được (ghi một-lần theo ngày).
//  · Không đổi thân hay lời của lệnh đăng nhập cũ: chỉ khi máy em xin mới đổi KIỂU phản hồi (NDJSON, không nén ở rìa Cloudflare ⇒ không bị đệm), máy cũ không xin ⇒ y hệt.
//  · Công tắc khẩn: biến môi trường `TAT_KEM_SANH` (bất kỳ giá trị thật) ⇒ bỏ qua `kemSanh`, mọi đăng nhập về JSON thường (không cần sửa mã máy em).

/** Quá hạn này mà Sảnh chưa xong thì dòng 2 là `null` (máy em tự hỏi Sảnh như cũ) và luồng đóng. Dài hơn Sảnh bình thường vài lần (Sảnh lần đầu trong ngày vài giây trên D1 thật). */
export const HAN_SANH_KEM_MS = 20_000

/** Kiểu thân phản hồi theo luồng. KHÔNG nằm trong danh sách kiểu Cloudflare nén ở rìa ⇒ không bị đệm cho tới khi đóng luồng. */
export const KIEU_LUONG_DANG_NHAP = 'application/x-ndjson; charset=utf-8'

/** Công tắc khẩn: `env.TAT_KEM_SANH` có giá trị thật ('1', 'true'…) ⇒ tắt đăng nhập kèm Sảnh. */
export const kemSanhBiTat = (env: unknown): boolean => {
  const v = (env as Record<string, unknown> | null | undefined)?.TAT_KEM_SANH
  return v !== undefined && v !== null && v !== '' && v !== '0' && v !== 'false' && v !== false
}

/** Phần Sảnh của đăng nhập: `chay` = đúng lệnh `hoa2-sanh` của em (index.ts truyền `gameV2`), `trangTri` = thêm `serverNow` / `nhipDeNghi` như `ra()` vẫn thêm vào mọi
 *  phản hồi (để bản kèm GIỐNG TỪNG KHOÁ bản trả riêng). Trả `null` khi không có Sảnh dùng được. KHÔNG bao giờ ném lỗi. */
export async function sanhKemDangNhap(
  chay: () => Promise<Record<string, unknown>>,
  trangTri: (r: Record<string, unknown>) => Record<string, unknown> = (r) => r,
  hanMs = HAN_SANH_KEM_MS,
): Promise<Record<string, unknown> | null> {
  let hen: ReturnType<typeof setTimeout> | undefined
  try {
    const viec = chay().then((r) => (r && typeof r === 'object' && r.ok === true ? r : null))
    viec.catch(() => {}) // quá hạn rồi lệnh mới lỗi: không để thành lỗi "chưa xử lý"
    const r = await Promise.race([viec, new Promise<null>((xong) => { hen = setTimeout(() => xong(null), hanMs) })])
    return r ? trangTri(r) : null
  } catch {
    return null
  } finally {
    if (hen !== undefined) clearTimeout(hen)
  }
}

/**
 * Phản hồi đăng nhập THEO LUỒNG: dòng 1 = `dong1` (đã là thân đăng nhập hoàn chỉnh) đi ngay; dòng 2 = `{"sanh": … | null}` khi `laySanh` xong. `laySanh` KHÔNG ném lỗi
 * (dùng `sanhKemDangNhap`); nếu vẫn ném thì dòng 2 là `null`. Luồng luôn đóng. `ctx.waitUntil` giữ isolate sống tới khi luồng đóng.
 */
export function luongDangNhapKemSanh(
  dong1: Record<string, unknown>,
  laySanh: () => Promise<Record<string, unknown> | null>,
  headers: Record<string, string>,
  ctx?: { waitUntil(p: Promise<unknown>): void },
): Response {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const w = writable.getWriter()
  const mh = new TextEncoder()
  const chay = (async () => {
    try {
      await w.write(mh.encode(JSON.stringify(dong1) + '\n'))
      let sanh: Record<string, unknown> | null = null
      try { sanh = await laySanh() } catch { sanh = null }
      await w.write(mh.encode(JSON.stringify({ sanh }) + '\n'))
      await w.close()
    } catch {
      // máy em ngắt kết nối giữa chừng: không còn ai đọc
      try { await w.abort() } catch { /* đã đóng */ }
    }
  })()
  try { ctx?.waitUntil(chay) } catch { /* không có ctx */ }
  return new Response(readable, { status: 200, headers: { ...headers, 'content-type': KIEU_LUONG_DANG_NHAP, 'cache-control': 'no-store, no-transform' } })
}
