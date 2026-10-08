// Chờ cron khôi phục nguyên tử hoàn tất, chỉ in thống kê, không xuất dữ liệu em.
import { query } from './kiem-phat-hanh-chua.mjs'
let done = false
for (let i = 0; i < 18; i++) {
  const rows = await query("SELECT gia_tri FROM cau_hinh WHERE khoa='khoi_phuc_chien_dich_rieng_0810_v1'")
  if (rows.length) { done = true; break }
  await new Promise(r => setTimeout(r, 10000))
}
if (!done) throw new Error('Chưa có biên nhận khôi phục; chưa phát hành Pages.')
const [r] = await query(`SELECT
 (SELECT COUNT(*) FROM chien_dich c JOIN hanh_trinh_hop_nhat h ON h.chien_dich_cu=c.id WHERE c.trang_thai='dang_chay') AS chienDichRieng,
 (SELECT COUNT(*) FROM chien_dich c JOIN hanh_trinh_gioi_hoa h ON h.chien_dich_id=c.id WHERE c.trang_thai='da_huy') AS hanhTrinhLuuTru,
 (SELECT COUNT(*) FROM bai_da_day b JOIN hanh_trinh_gioi_hoa h ON h.chien_dich_id=b.chien_dich_id) AS baiConGanHanhTrinh,
 (SELECT COUNT(*) FROM khoi_phuc_0810_sao_luu WHERE bang='chien_dich') AS banSaoChienDich,
 (SELECT COUNT(*) FROM khoi_phuc_0810_sao_luu WHERE bang='bai_da_day') AS banSaoBai`)
if (r.chienDichRieng !== 9 || r.hanhTrinhLuuTru !== 3 || r.baiConGanHanhTrinh !== 0 || r.banSaoChienDich !== 12 || r.banSaoBai !== 5) throw new Error('Số liệu khôi phục không khớp; dừng phát hành Pages.')
console.log(JSON.stringify(r))
