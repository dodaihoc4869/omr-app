// GHI CA LÊN SHEET Ở NỀN — và KHÔNG BAO GIỜ để nó hỏng trong im lặng.
//
// VÌ SAO CÓ TỆP NÀY, đo thật ca 112480 lúc 19h07 ngày 11/09:
//
//     bat_dau       12:07:06.336Z
//     cap_nhat_luc  12:07:07.482Z   ← máy chủ mới đã có ca
//
// Máy chủ mới nhận ca sau **1,15 giây**. Toàn bộ phần thầy ngồi chờ còn lại là
// Apps Script ghi gói đề vào bảng `CaKiemTra` — lượt nặng nhất cả buổi. Chạy
// song song (đợt 5D) chỉ cắt được phần D1, không cắt được phần ấy.
//
// Nên: trả về cho thầy NGAY khi D1 và R2 có ca; lượt ghi Sheet chạy nền.
//
// ĐÁNH ĐỔI PHẢI NÓI RÕ: ca không lên được Sheet mà im lặng là hỏng đường điểm
// (`BangDiem.xlsx`) và đường gửi Zalo. Nên tệp này giữ trạng thái từng ca để
// màn hình HIỆN RA, và có nút thử lại. Im lặng là thứ duy nhất bị cấm ở đây.

export type TrangThaiSheet = 'dang_ghi' | 'xong' | 'hong'

export interface DongGhiSheet {
  maCa: string
  trangThai: TrangThaiSheet
  loi: string
  batDauLuc: number
  /** Chạy lại đúng lượt ghi đã hỏng. Giữ nguyên gói gửi đi, không dựng lại. */
  thuLai: () => Promise<void>
}

const bang = new Map<string, DongGhiSheet>()
const nguoiNghe = new Set<() => void>()

function bao(): void {
  for (const f of nguoiNghe) {
    try {
      f()
    } catch {
      // một người nghe hỏng không được làm hỏng những người còn lại
    }
  }
}

/** Màn hình đăng ký để vẽ lại khi trạng thái đổi. Trả hàm gỡ đăng ký. */
export function ngheGhiSheet(f: () => void): () => void {
  nguoiNghe.add(f)
  return () => {
    nguoiNghe.delete(f)
  }
}

export function trangThaiGhiSheet(maCa: string): DongGhiSheet | null {
  return bang.get(maCa) ?? null
}

/** Mọi ca CHƯA lên được Sheet. Màn nào cũng hỏi được, để không ca nào trôi đi. */
export function caChuaLenSheet(): DongGhiSheet[] {
  return [...bang.values()].filter((d) => d.trangThai === 'hong')
}

/** THEO một lượt ghi Sheet đang bay. Gọi ngay khi vừa bắn lượt ghi đi.
 *
 * `chay` phải TỰ NÓ gửi lại được — nút Thử lại gọi đúng hàm ấy, không dựng lại
 * gói. Dựng lại là mở đường cho hai gói khác nhau cùng mang một mã ca. */
export function theoGhiSheet(maCa: string, chay: () => Promise<void>): void {
  const dong: DongGhiSheet = {
    maCa,
    trangThai: 'dang_ghi',
    loi: '',
    batDauLuc: Date.now(),
    thuLai: async () => {
      const d = bang.get(maCa)
      if (!d || d.trangThai === 'dang_ghi') return
      d.trangThai = 'dang_ghi'
      d.loi = ''
      bao()
      await chay_(maCa, chay)
    },
  }
  bang.set(maCa, dong)
  bao()
  void chay_(maCa, chay)
}

async function chay_(maCa: string, chay: () => Promise<void>): Promise<void> {
  try {
    await chay()
    const d = bang.get(maCa)
    if (d) {
      d.trangThai = 'xong'
      d.loi = ''
    }
  } catch (e) {
    const d = bang.get(maCa)
    if (d) {
      d.trangThai = 'hong'
      d.loi = e instanceof Error ? e.message : 'Không ghi được lên Sheet'
    }
  }
  bao()
}

/** Chỉ dùng cho phép kiểm. */
export function quenGhiSheet(): void {
  bang.clear()
}
