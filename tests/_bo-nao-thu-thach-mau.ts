// Mẫu dùng chung cho các test thử thách riêng của Bộ não (Code 1, 21/09/2026): thẻ mẫu + 8 lời mẫu TỐT + 4 lời mẫu CẤM (chép nguyên chữ vào cẩm nang / LUAT-CHIEU.md — test khoá).
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

/** MẪU TỐT — chép NGUYÊN CHỮ vào `bo-nao/HUONG-DAN-BO-NAO.md` và `bo-nao/LUAT-CHIEU.md` (test khoá). Khung 3 ý: ĐIỀU EM ĐÃ LÀM (số thật) → Ý NGHĨA của nó với chính em (mệnh đề ngắn, dữ kiện, không khen suông) → LỜI MỜI mạnh + phần thưởng (số thật).
 * Tám mẫu, tám kiểu MỞ ĐẦU khác nhau; hai mẫu đẩy bậc (`cao_hon_mot_bac`, `thap_hon_mot_bac`) nói ĐÚNG bậc; thẻ có `thanThu` chỉ dùng EXP còn thiếu + cấp (KHÔNG khiên); em chưa có thú thì mời chọn thú ở CÂU CUỐI (ba cách nói). */
export const LOI_TOT: { chu: string; the: TheDeKiem; dang: string[]; bac: 'dung_bac' | 'thap_hon_mot_bac' | 'cao_hon_mot_bac' }[] = [
  { chu: 'Sai rồi sửa lại được 4 câu, đó là cách nhớ lâu nhất. Hôm nay em hãy cùng Rồng Lửa thử mấy câu Thuỷ phân ester nhé.', the: THE, dang: ['ESTE.THUY_PHAN'], bac: 'dung_bac' },
  { chu: 'Chuỗi 4 ngày liền, hôm nay đến lúc nâng tầm: hãy thử câu khó hơn một bậc ở dạng Thuỷ phân ester, vì em đã đúng 8 trong 9 câu dạng này. Rồng Lửa còn thiếu 40 EXP lên cấp 6.', the: THE, dang: ['ESTE.THUY_PHAN'], bac: 'cao_hon_mot_bac' },
  { chu: 'Hôm qua em làm 8 câu, đúng 7 câu, nhịp đều như vậy là nền vững cho bài dài. Thử ngay vài câu Lipid béo, Rồng Lửa còn thiếu 40 EXP để lên cấp 6.', the: THE, dang: ['LIPID.BEO'], bac: 'dung_bac' },
  { chu: 'Rồng Lửa đang chờ em ở cấp 6, còn thiếu 40 EXP. Em vừa đúng lại 4 câu từng sai, nên hôm nay hãy thử mấy câu Thuỷ phân ester để chắc thêm.', the: THE, dang: ['ESTE.THUY_PHAN'], bac: 'dung_bac' },
  { chu: 'Hôm nay mình lùi một bậc ở dạng Carb phân loại để em lấy lại nhịp: làm chậm, kỹ từng câu. Rồng Lửa vẫn chờ em, còn thiếu 40 EXP.', the: THE, dang: ['CARB.PHAN_LOAI'], bac: 'thap_hon_mot_bac' },
  { chu: 'Em đã đạt 4 ngày liền, nghĩa là thói quen học đang thành hình. Hôm nay hãy thử mấy câu Carb phân loại, rồi chọn một thần thú để EXP của em có chỗ về.', the: THE_KHONG_THU, dang: ['CARB.PHAN_LOAI'], bac: 'dung_bac' },
  { chu: 'Thuỷ phân ester em làm đều tay nên thử ngay câu khó hơn một bậc ở dạng này, vì em đã đúng 8 trong 9 câu dạng này. Rồi chọn một bạn đồng hành nhé.', the: THE_KHONG_THU, dang: ['ESTE.THUY_PHAN'], bac: 'cao_hon_mot_bac' },
  { chu: 'Em đã làm đúng lại 4 câu từng sai, sửa được lỗi là cách nhớ lâu nhất. Thử ngay vài câu Thuỷ phân ester, rồi chọn thần thú của em nhé.', the: THE_KHONG_THU, dang: ['ESTE.THUY_PHAN'], bac: 'dung_bac' },
]
/** Em CHƯA có thú, bậc đúng bậc — dùng cho các test cần một lời hợp lệ của thẻ không có `thanThu`. */
export const LOI_KHONG_THU = LOI_TOT[5]
/** MẪU CẤM — kèm điều bị chặn (chép vào cẩm nang / LUAT-CHIEU.md). `bac` mặc định `dung_bac`. */
export const LOI_CAM: { chu: string; mau: string; bac?: 'dung_bac' | 'thap_hon_mot_bac' | 'cao_hon_mot_bac' }[] = [
  { chu: 'Em đã nắm chắc Thuỷ phân ester sau 4 ngày, thử mấy câu nữa nhé.', mau: 'từ cấm' },
  { chu: 'Rồng Lửa còn thiếu 55 EXP để lên cấp, thử mấy câu nhé.', mau: 'số không có trong thẻ' },
  { chu: 'Hôm nay thử 6 câu Thuỷ phân ester, xong là Rồng Lửa lên cấp 6.', mau: 'số câu' },
  { chu: 'Các bạn khác đã làm 4 câu rồi, em thử mấy câu nhé.', mau: 'từ cấm' },
  { chu: 'Em làm tuyệt vời lắm, 4 ngày liền rồi, hôm nay thử mấy câu nhé.', mau: 'hứa điều không chắc' },
  { chu: 'Rồng Lửa đang có 3 mảnh khiên, hôm nay em hãy thử vài câu nhé.', mau: 'hứa điều không chắc' },
  { chu: 'Em đúng 8 trong 9 câu Thuỷ phân ester, hôm nay thử vài câu dạng này nhé.', mau: 'khó hơn một bậc', bac: 'cao_hon_mot_bac' },
]
