// THẾ HỆ CẤU HÌNH MÁY CHỦ (02/11): đếm số lần thầy đổi / bỏ nhớ cấu hình (`quenCauHinhMayChu`). Tệp riêng, không phụ thuộc gì,
// để `dia-chi-may-chu.ts` biết địa chỉ đã nhớ thuộc cấu hình CŨ mà không phải nhập `may-chu-moi.ts` thêm hàm (nhiều test giả mô-đun ấy).
let theHe = 0
export const tangTheHeCauHinh = (): void => { theHe++ }
export const theHeCauHinh = (): number => theHe
