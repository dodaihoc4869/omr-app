// Mẫu dùng chung cho các test thử thách riêng của Bộ não (Code 1, 21/09/2026): thẻ mẫu + 6 lời mẫu TỐT + 4 lời mẫu CẤM (chép nguyên chữ vào cẩm nang / LUAT-CHIEU.md — test khoá).
import type { TheDeKiem } from '../src/lib/bo-nao-khuon'

export const THE: TheDeKiem = {
  biDanh: 'A17',
  maDang: ['ESTE.THUY_PHAN', 'CARB.PHAN_LOAI', 'LIPID.BEO'],
  khiNaoVietPhuHuynh: [],
  luotSoiKyTuan: false,
  dangChuY: [
    { ma: 'ESTE.THUY_PHAN', gap: 9, sai: 1, bac: 1, tiLeKhacPhuc: 0.9, lam7: 9, sai7: 1 },
    { ma: 'CARB.PHAN_LOAI', gap: 6, sai: 3, bac: 0, tiLeKhacPhuc: 0.5, lam7: 6, sai7: 3 },
    { ma: 'LIPID.BEO', gap: 5, sai: 0, bac: 1, tiLeKhacPhuc: 1, lam7: 4, sai7: 0 },
  ],
  cau: { lam7: 24, dung7: 20, sai7: 4, tiLe7: 0.83, lam3: 12, tiLe3: 0.92, lam4Truoc: 12, lamHomQua: 8, dungHomQua: 7 },
  chuoi: 4,
  exp: { tong: 460, cap: 6 },
  thanThu: { ten: 'Rồng Lửa', cap: 6, expConThieu: 40, manhKhien: 3, manhKhienTong: 12, chuoiNgay: 4 },
}
export const THE_KHONG_THU: TheDeKiem = (() => {
  const { thanThu: _t, ...con } = THE as Record<string, unknown>
  void _t
  return con as TheDeKiem
})()

/** MẪU TỐT — chép NGUYÊN CHỮ vào `bo-nao/HUONG-DAN-BO-NAO.md` (test khoá bên dưới). Khung 3 ý: điều em vừa làm được bằng số → mời thử mấy câu dạng X → làm xong thần thú/em được gì bằng số thật. */
export const LOI_TOT: { chu: string; the: TheDeKiem; dang?: string[] }[] = [
  { chu: 'Hôm qua em đúng lại 4 câu từng sai. Rồng Lửa còn thiếu 40 EXP để lên cấp 6, hôm nay thử mấy câu Thuỷ phân ester nhé.', the: THE, dang: ['ESTE.THUY_PHAN'] },
  { chu: 'Rồng Lửa đang có 3 mảnh khiên, cần 12 mảnh để rèn. Hôm nay thử vài câu Thuỷ phân ester, mỗi câu đúng đều được thêm EXP.', the: THE, dang: ['ESTE.THUY_PHAN'] },
  { chu: 'Hôm qua em làm 8 câu, đúng 7 câu. Hôm nay thử mấy câu Thuỷ phân ester để giữ chuỗi 4 ngày.', the: THE, dang: ['ESTE.THUY_PHAN'] },
  { chu: 'Chuỗi 4 ngày của em đang chạy đều. Rồng Lửa còn thiếu 40 EXP lên cấp 6, hôm nay thử vài câu Lipid béo nhé.', the: THE, dang: ['LIPID.BEO'] },
  { chu: 'Hôm qua em đúng lại 4 câu từng sai, làm rất đều. Hôm nay thử mấy câu Thuỷ phân ester để luyện tiếp.', the: THE_KHONG_THU, dang: ['ESTE.THUY_PHAN'] },
  { chu: 'Em đã đạt 4 ngày liền. Hôm nay thử vài câu Carb phân loại, mỗi câu đúng đều được thêm EXP.', the: THE_KHONG_THU, dang: ['CARB.PHAN_LOAI'] },
]
/** MẪU CẤM — kèm điều bị chặn (chép vào cẩm nang). */
export const LOI_CAM: { chu: string; mau: string }[] = [
  { chu: 'Em đã nắm chắc Thuỷ phân ester sau 4 ngày, thử mấy câu nữa nhé.', mau: 'từ cấm' },
  { chu: 'Rồng Lửa còn thiếu 55 EXP để lên cấp, thử mấy câu nhé.', mau: 'số không có trong thẻ' },
  { chu: 'Hôm nay thử 6 câu Thuỷ phân ester, xong là Rồng Lửa lên cấp 6.', mau: 'số câu' },
  { chu: 'Các bạn khác đã làm 4 câu rồi, em thử mấy câu nhé.', mau: 'từ cấm' },
]

