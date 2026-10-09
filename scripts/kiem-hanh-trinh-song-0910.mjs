// Chỉ đọc số tổng hợp; không in danh tính, nội dung câu hay khoá.
import { query } from './kiem-phat-hanh-chua.mjs'
let xong = false
for (let i = 0; i < 18; i++) {
  const r = await query("SELECT gia_tri FROM cau_hinh WHERE khoa='hanh_trinh_3_0910_v1'")
  if (r.some(x => JSON.parse(x.gia_tri).bat === true)) { xong = true; break }
  await new Promise(r => setTimeout(r, 10000))
}
if (!xong) throw new Error('Chưa có biên nhận gộp ba hành trình. Kiểm nhật ký cron; không kết luận đã áp dụng.')
const [r] = await query(`SELECT
 (SELECT COUNT(*) FROM chien_dich WHERE trang_thai='dang_chay' AND id IN ('hanh-trinh-v3-khoi-10','hanh-trinh-v3-khoi-11','hanh-trinh-v3-khoi-12')) AS hanhTrinhDangChay,
 (SELECT COUNT(*) FROM chien_dich WHERE trang_thai='dang_chay' AND id NOT IN ('hanh-trinh-v3-khoi-10','hanh-trinh-v3-khoi-11','hanh-trinh-v3-khoi-12')) AS nguonConChay,
 (SELECT COUNT(*) FROM hanh_trinh_v3_nguon) AS nguonDaSaoLuu,
 (SELECT COUNT(*) FROM cau_hinh WHERE khoa IN ('hanh_trinh_v3_kho_10','hanh_trinh_v3_kho_11','hanh_trinh_v3_kho_12')) AS khoTheoKhoi`)
if (r.hanhTrinhDangChay !== 3 || r.nguonConChay !== 0 || r.khoTheoKhoi !== 3) throw new Error('Số hành trình hoặc kho câu chưa khớp.')
console.log(JSON.stringify(r))
