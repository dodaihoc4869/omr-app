// ĐĂNG NHẬP KÈM SẢNH (D1, tối ưu vòng 2 06/10 — thầy: "app thật mượt mà nhanh gấp 2 lần", GIỮ NGUYÊN giao diện và hành vi đăng nhập).
//
// Trước: máy em đăng nhập xong (một vòng mạng) rồi MỚI hỏi Sảnh (`/game-v2/hoa2-sanh`, vòng mạng thứ hai) — hai vòng nối tiếp trước khi Sảnh có số.
// Nay: máy em (cổng học sinh `AppHocSinh`) gửi thêm `kemSanh: true` trong thân lệnh đăng nhập; đăng nhập THÀNH CÔNG thì máy chủ chạy luôn đúng lệnh
// `hoa2-sanh` của em ấy (cùng hàm `gameV2`, cùng token vừa cấp — đã nằm trong đệm xác thực nên không tốn thêm một đợt D1 để kiểm mật khẩu) và gắn
// kết quả vào phản hồi đăng nhập, khoá `sanh`. Máy em dùng nó làm phản hồi "hỏi sớm" của Sảnh (src/lib/hoi-som.ts) ⇒ Sảnh có số ngay lúc đăng nhập
// xong, bớt một vòng mạng. Tổng số lệnh tới máy chủ giảm một (máy em không gửi `hoa2-sanh` nữa), tổng việc D1 y như cũ.
//
// An toàn (đăng nhập KHÔNG bao giờ xấu đi vì phần thêm này):
//  · CHỈ chạy khi đăng nhập đã thành công VÀ máy em xin (`kemSanh === true`); sai mật khẩu / chưa có mật khẩu / lỗi ⇒ phản hồi y hệt cũ, không `sanh`.
//  · Sảnh lỗi (ném lỗi, `ok:false`) hoặc quá hạn `HAN_SANH_KEM_MS` ⇒ KHÔNG có `sanh`; đăng nhập vẫn trả đủ token + thông tin; máy em tự hỏi Sảnh như cũ.
//  · `hoa2-sanh` có thể GHI (lập kế hoạch ngày lần đầu) — chạy đúng như lệnh riêng: sau cổng đóng băng reset (đăng nhập đã qua cổng ấy ở đầu `fetch`),
//    một lệnh ghi lặp (máy em quá hạn rồi hỏi lại) là điều các lệnh Sảnh vốn chịu được (ghi một-lần theo ngày).
//  · Không đổi thân hay lời của lệnh đăng nhập cũ: chỉ THÊM khoá `sanh` khi máy em xin.

/** Quá hạn này thì bỏ phần Sảnh, trả đăng nhập ngay (máy em tự hỏi Sảnh như cũ). Sảnh bình thường vài trăm ms tới ~2 s trên D1 thật; D1 nghẽn thì để máy em
 *  đi đường cũ còn hơn giữ cả đăng nhập chờ (form đăng nhập của em tự bỏ cuộc sau 15 giây). */
export const HAN_SANH_KEM_MS = 6000

/** Phần Sảnh gắn kèm đăng nhập: `chay` = đúng lệnh `hoa2-sanh` của em (index.ts truyền `gameV2`), `trangTri` = thêm `serverNow` / `nhipDeNghi` như `ra()` vẫn
 *  thêm vào mọi phản hồi (để bản kèm GIỐNG TỪNG KHOÁ bản trả riêng). Trả `null` khi không có Sảnh dùng được. KHÔNG bao giờ ném lỗi. */
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
