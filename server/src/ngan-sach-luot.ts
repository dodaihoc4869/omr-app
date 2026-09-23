// NGÂN SÁCH CÒN LẠI CỦA NGÀY cho bộ chọn — CNH-1.0 (P05 §5.2 + T09).
//
// 02 §5.2: "Tổng taskSeconds của nhiệm vụ TỰ ĐỘNG đã chốt ≤ budgetSeconds" và nhiều màn phải dùng
// CHUNG một ngân sách ("4 Mom +3 ôn +6 game" không tạo 13 việc nếu ngân sách chỉ chứa 8).
// Adapter này trả phần ngân sách CÒN LẠI của hôm nay để nơi rút câu (game/Mom/ôn) cắt lượt cho vừa.
//
// Ánh xạ THẬT: `ke_hoach_ngay.ngan_sach_json.phutNgay` (kế hoạch ngày đã chốt) × 60 giây = ngân sách ngày;
// đã dùng = tổng `su_kien_hoc.giay` của HÔM NAY (một truy vấn đi chỉ mục (sbd, ngày)).
//
// Cờ `cau_hinh.ngan_sach_luot` MẶC ĐỊNH TẮT: bật mới cắt lượt theo ngân sách (giữ nguyên hành vi đang chạy).
import type { Env } from './kieu'
import type { MauThoiGian } from './uoc-luong-thoi-gian'

/** Khoá cờ trong `cau_hinh`; `'bat'` mới cắt lượt theo ngân sách ngày. Chỉ ĐỌC. */
export const KHOA_BAT_NGAN_SACH_LUOT = 'ngan_sach_luot'

let demBat = { luc: 0, bat: false }
export function xoaDemNganSachLuot(): void { demBat = { luc: 0, bat: false } }

/** Cờ bật. LỖI ĐỌC ⇒ `false` (giữ đường cũ) — không để một lỗi tạm bóp ngắn lượt của em. */
export async function nganSachLuotBat(env: Env): Promise<boolean> {
  const bayGio = Date.now()
  if (bayGio - demBat.luc < 30_000) return demBat.bat
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_BAT_NGAN_SACH_LUOT).first<{ gia_tri: string }>()
    demBat = { luc: bayGio, bat: String(r?.gia_tri ?? '').trim() === 'bat' }
  } catch {
    demBat = { luc: bayGio, bat: false }
  }
  return demBat.bat
}

export interface NganSachConLai {
  /** Ngân sách ngày do kế hoạch đã chốt (`phutNgay` × 60). */
  nganSachGiay: number
  /** Đã dùng hôm nay theo sổ (`su_kien_hoc.giay`, tổng — có thể thấp hơn thực tế nếu thiếu số đo). */
  daDungGiay: number
  conLaiGiay: number
  /** Mẫu tốc độ gửi cho bộ ước lượng. Hiện để RỖNG ⇒ hệ số 1 (đúng luật "n<5 ⇒ factor=1"), chưa ghép mẫu theo part/mức. */
  mau: MauThoiGian[]
  ghiChu: string
}

/**
 * Phần ngân sách CÒN LẠI của một em trong ngày. `null` khi CHƯA có kế hoạch ngày (không tự bịa ngân sách).
 * Lỗi đọc số đo ⇒ coi như đã dùng 0 và NÓI RA (không chặn oan, cũng không giấu).
 */
export async function docNganSachConLai(env: Env, sbd: string, ngay: string): Promise<NganSachConLai | null> {
  let nganSachGiay = 0
  try {
    const r = await env.DB.prepare('SELECT ngan_sach_json FROM ke_hoach_ngay WHERE sbd = ? AND ngay = ? LIMIT 1').bind(sbd, ngay).first<{ ngan_sach_json: string }>()
    if (!r) return null
    const json = JSON.parse(String(r.ngan_sach_json ?? '{}')) as { phutNgay?: unknown }
    const phut = Number(json.phutNgay)
    if (!Number.isFinite(phut) || phut <= 0) return null
    nganSachGiay = Math.round(phut * 60)
  } catch {
    return null
  }
  let daDungGiay = 0
  let ghiChu = ''
  try {
    const r = await env.DB.prepare('SELECT COALESCE(SUM(giay), 0) AS g FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND giay IS NOT NULL').bind(sbd, ngay).first<{ g: number }>()
    daDungGiay = Math.max(0, Number(r?.g ?? 0) || 0)
  } catch {
    ghiChu = 'chưa đọc được số giây đã dùng hôm nay nên tính là 0'
  }
  return {
    nganSachGiay, daDungGiay, conLaiGiay: Math.max(0, nganSachGiay - daDungGiay), mau: [], ghiChu,
  }
}
