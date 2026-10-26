// 26/10 (làm nhẹ đường /ph): trang cũ «Hôm nay của con» (TrangVeCon + trang-con.css) nay NẠP LƯỜI trong AppPhuHuynh. Test nào dựng app phụ huynh ở giao
// diện cũ nhập tệp này: chờ mảnh trang cũ về MỘT lần trước các test (như app đã mở xong lần đầu) ⇒ các lần vẽ sau dùng ngay như trước, không lệ thuộc
// tốc độ máy chạy test (waitFor 1 giây).
import { beforeAll, vi } from 'vitest'

beforeAll(async () => {
  await import('../src/components/ph-v3/TrangVeCon')
  await vi.dynamicImportSettled()
})
