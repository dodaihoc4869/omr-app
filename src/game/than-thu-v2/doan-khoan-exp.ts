// ĐOÀN HỘ TỐNG — các KHOẢN EXP của một chuyến, cho màn KẾT CHUYẾN (Điều 9 của DE-XUAT-THAN-THU-MOI-NGAY-2109: "Thắng chuyến 3 sao +15 EXP", "Vỡ giáp 2 trùm +6 EXP", "Tiếp sức 2 lần +10 EXP").
// Máy chủ (`doan.ketChang.expChang`, chỉ-thêm) gửi [{loai, exp, ghiChu}] của RIÊNG em; máy khách dựng nhãn từ `loai` + số (KHÔNG in `ghiChu` của máy chủ: nó còn nói "chặng" — từ chuẩn của game là "chuyến" — và chưa được kiểm).
// THUẦN (không React, không mạng) để test. Số EXP luôn lấy từ `exp` đã qua trần 120/ngày của máy chủ: khoản 0 ⇒ nói thật là đã đủ trần.
import { TRAN_EXP_GAME_NGAY } from '../../lib/hap-thu-ngay'

export interface KhoanExpChang {
  loai: string
  exp: number
  ghiChu: string
}
export interface DongKhoanExp {
  ma: 'chuyen' | 'giap' | 'tiep-suc'
  nhan: string
  exp: number
}

const soNguyen = (x: unknown): number => {
  const n = Math.floor(Number(x))
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100_000) : 0
}

/**
 * Gộp các khoản thành ≤ 3 dòng (chuyến · giáp · tiếp sức). Loại lạ / không phải mảng ⇒ bỏ. Vắng hoặc không còn dòng nào ⇒ [] (màn rơi về ô "EXP vào ví" cũ).
 * `sao`: số sao của chuyến; `soTrumVoGiap`: số trùm bị vỡ giáp (từ `ketChang.trumVoGiap`).
 */
export function dongKhoanExp(ds: unknown, sao: number, soTrumVoGiap: number): DongKhoanExp[] {
  if (!Array.isArray(ds)) return []
  let chuyen: number | null = null
  let giap: number | null = null
  let tiep = 0
  let soLanTiep = 0
  for (const k of ds) {
    if (!k || typeof k !== 'object') continue
    const { loai, exp } = k as Record<string, unknown>
    const e = soNguyen(exp)
    if (loai === 'doan_chang') chuyen = (chuyen ?? 0) + e
    else if (loai === 'doan_giap') giap = (giap ?? 0) + e
    else if (loai === 'tiepsuc') {
      tiep += e
      soLanTiep += 1
    }
  }
  const ra: DongKhoanExp[] = []
  if (chuyen !== null) ra.push({ ma: 'chuyen', nhan: `Thắng chuyến ${Math.max(1, Math.min(3, Math.floor(sao) || 1))} sao`, exp: chuyen })
  if (giap !== null) ra.push({ ma: 'giap', nhan: `Vỡ giáp ${Math.max(1, Math.floor(soTrumVoGiap) || 1)} trùm`, exp: giap })
  if (soLanTiep > 0) ra.push({ ma: 'tiep-suc', nhan: `Tiếp sức ${soLanTiep} lần`, exp: tiep })
  return ra
}

export const tongKhoanExp = (dong: readonly DongKhoanExp[]): number => dong.reduce((t, d) => t + d.exp, 0)

/** Có khoản nào bị cắt về 0 (trần EXP từ game 120/ngày) ⇒ true. */
export const coKhoanBiCat = (dong: readonly DongKhoanExp[]): boolean => dong.some((d) => d.exp === 0)

/** Câu nói thật khi đủ trần (Điều 9): thưởng 0 nhưng mọi thứ khác vẫn được ghi. */
export const chuDuTran = (tenThu: string): string => `hôm nay em đã đủ ${TRAN_EXP_GAME_NGAY} EXP từ game. Muốn ${tenThu || 'thần thú'} ăn no thì làm bài tập về nhà hoặc phần ôn lại.`
