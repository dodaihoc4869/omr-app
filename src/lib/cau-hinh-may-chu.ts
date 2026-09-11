// MÁY CHỦ MỚI — MỘT NGUỒN SỰ THẬT cho mọi cấu hình (MAY-CHU-MOI.md mục 3).
//
// Cấm rải hằng số ở `exam-api.ts` hay bất kỳ màn nào. Đổi ngưỡng thì đổi ở đây,
// hoặc thầy đổi trong màn Cài đặt.
//
// `BAT` MẶC ĐỊNH FALSE. App phải chạy y như hôm nay khi thầy chưa bật gì.
export interface CauHinhMayChu {
  /** Bật đường máy chủ mới cho 4 lệnh nóng. Mặc định TẮT. */
  BAT: boolean
  /** https://<tên>.workers.dev — rỗng thì coi như tắt. */
  URL: string
  /** Hạn chờ mỗi lượt gọi (giây). */
  HAN_GIAY: number
  /** HẠN CHỜ RIÊNG CHO BỐN LỆNH TRONG LÚC THI.
   *
   * Vì sao phải tách khỏi `HAN_GIAY`: trên đường nóng, Apps Script CHÍNH LÀ
   * lượt thử lại. Chờ lâu ở đây không cứu được gì mà chỉ đẩy lùi thời điểm
   * đường lùi bắt đầu chạy. Đo đợt 3: lệnh chậm nhất ở 50 em đồng thời là
   * 829 ms, nên 3 giây đã rộng gấp 3,6 lần. */
  HAN_NONG_GIAY: number
  /** Số lần thử lại khi mạng hỏng. */
  SO_LAN_THU: number
  /** Worker hỏng thì tự rơi về Apps Script cho ĐÚNG lượt đó.
   *
   * ĐÂY LÀ LUẬT, KHÔNG PHẢI TUỲ CHỌN. Chỉ được đặt false sau khi đã chạy thật
   * đủ 30 ca không sự cố — và kể cả thế cũng nên để nguyên true. Cloudflare sập
   * giữa ca thi mà không có đường lùi là mất cả buổi. */
  LUI_VE_APPS_SCRIPT: boolean
  /** Giãn ngẫu nhiên 0..N giây trước lượt vào thi đầu tiên — cả lớp bấm trong
   * cùng 2 giây vì thầy vừa hô, giãn ra là hết cảnh húc cửa. */
  GIAN_VAO_THI_GIAY: number
}

export const MAC_DINH_MAY_CHU: CauHinhMayChu = {
  BAT: false,
  URL: '',
  HAN_GIAY: 10,
  HAN_NONG_GIAY: 3,
  SO_LAN_THU: 3,
  LUI_VE_APPS_SCRIPT: true,
  GIAN_VAO_THI_GIAY: 3,
}

function soDuong(v: unknown, macDinh: number): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : macDinh
}

export function chuanHoaMayChu(c?: Partial<CauHinhMayChu> | null): CauHinhMayChu {
  const url = String(c?.URL ?? '').trim()
  return {
    // Không có URL thì BẬT cũng vô nghĩa — chốt ngay ở đây để mọi chỗ gọi khỏi
    // phải nhớ kiểm hai điều kiện.
    BAT: c?.BAT === true && url.length > 0,
    URL: url.replace(/\/+$/, ''),
    HAN_GIAY: soDuong(c?.HAN_GIAY, MAC_DINH_MAY_CHU.HAN_GIAY),
    HAN_NONG_GIAY: soDuong(c?.HAN_NONG_GIAY, MAC_DINH_MAY_CHU.HAN_NONG_GIAY),
    SO_LAN_THU: soDuong(c?.SO_LAN_THU, MAC_DINH_MAY_CHU.SO_LAN_THU),
    LUI_VE_APPS_SCRIPT: c?.LUI_VE_APPS_SCRIPT !== false,
    GIAN_VAO_THI_GIAY: Number.isFinite(Number(c?.GIAN_VAO_THI_GIAY)) && Number(c?.GIAN_VAO_THI_GIAY) >= 0
      ? Number(c?.GIAN_VAO_THI_GIAY)
      : MAC_DINH_MAY_CHU.GIAN_VAO_THI_GIAY,
  }
}

/** Giãn ngẫu nhiên trước lượt vào thi. Trả về số mili giây đã chờ. */
export async function gianVaoThi(ch: CauHinhMayChu, nguNgau: () => number = Math.random): Promise<number> {
  const ms = Math.floor(nguNgau() * ch.GIAN_VAO_THI_GIAY * 1000)
  if (ms > 0) await new Promise((r) => setTimeout(r, ms))
  return ms
}
