// DỌN DỮ LIỆU CŨ KHI ĐỔI CẤU TRÚC.
//
// Máy học sinh giữ lại thiết lập từ những bản trước; đổi cấu trúc mà không dọn
// thì máy cũ chạy sai theo kiểu khó đoán. Đây là công tắc để dọn: tăng
// PHIEN_BAN_DU_LIEU là lần mở app kế tiếp mọi máy tự xoá thiết lập cũ.
//
// CỐ Ý KHÔNG DÙNG `localStorage.clear()`. Hai thứ nằm trong localStorage mà xoá
// đi là hỏng việc thật:
//   · `ddh_id_thiet_bi` — máy chủ dựa vào đây để biết "một SBD một lượt mỗi ca"
//     và để em khôi phục bài đang làm dở trên ĐÚNG máy đó. Xoá là em đang thi
//     dở bị coi như máy khác, mất quyền vào lại.
//   · `omr.settings.v1` — thiết lập chấm bài trên máy thầy.
// Bài làm, đề, token, SBD nằm trong IndexedDB, tuyệt đối không đụng tới.

/** Tăng số này khi đổi cấu trúc dữ liệu lưu trong localStorage. */
export const PHIEN_BAN_DU_LIEU = 1

const KHOA_PHIEN_BAN = 'ddh.phienBanDuLieu'

/** Chỉ những khoá THUẦN GIAO DIỆN mới được dọn — mất đi thì cùng lắm là app
 * hỏi lại một câu, không mất dữ liệu và không gãy luồng thi. */
export const KHOA_DUOC_DON = ['ddh.vai', 'ddh.boQuaCaiApp', 'omr_msgfab_pos_v1']
// 'ddh.vai' giữ trong danh sách để dọn nốt trên máy đã cài bản có cơ chế nhớ vai
// (đã bỏ) — vai nay chỉ đến từ đường link.

/** Chạy DÒNG ĐẦU khi khởi động, trước mọi logic khác. */
export function donPhienCu(): void {
  try {
    const cu = Number(localStorage.getItem(KHOA_PHIEN_BAN) || '0')
    if (cu === PHIEN_BAN_DU_LIEU) return
    for (const k of KHOA_DUOC_DON) localStorage.removeItem(k)
    localStorage.setItem(KHOA_PHIEN_BAN, String(PHIEN_BAN_DU_LIEU))
  } catch {
    // trình duyệt chặn storage — không dọn được cũng không sao
  }
}
