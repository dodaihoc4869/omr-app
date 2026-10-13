// Bi-a Phản Ứng đã gỡ (thầy 13/10 22:2x: "xóa tất cả các code không liên quan, đảo đoàn, bia…"). Ràng buộc Durable Object `BAN_BIA` (wrangler.toml) GIỮ:
// xoá lớp = migration `deleted_classes` = xoá dữ liệu DO — không làm. Lớp rỗng: mọi lượt vào trả 410.
export class BanBiA {
  async fetch(): Promise<Response> { return new Response('Bi-a đã đóng', { status: 410 }) }
}
