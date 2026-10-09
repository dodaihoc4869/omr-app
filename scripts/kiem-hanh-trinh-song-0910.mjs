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

const [schema] = await query("SELECT COUNT(*) AS soBangDongCo FROM sqlite_master WHERE type='table' AND name IN ('hanh_trinh_v4_em','hanh_trinh_v4_canh','hanh_trinh_v4_chot','hanh_trinh_v4_can_thiep')")
if(schema.soBangDongCo!==4) throw new Error('Chưa đủ schema động cơ cá nhân hoá.')
console.log(JSON.stringify({dongCo:'ht4-0910-v1',...schema}))

const [schema5]=await query("SELECT COUNT(*) soBangHanhTrinh5 FROM sqlite_master WHERE type='table' AND name IN ('hanh_trinh_v5_muc','hanh_trinh_v5_phan_nhom','hanh_trinh_v5_quyet_dinh','hanh_trinh_v5_de_thu')")
if(schema5.soBangHanhTrinh5!==4)throw new Error('Thiếu schema Hành trình v5.')
console.log(JSON.stringify({dongCo:'ht5-0910-v1',...schema5}))
