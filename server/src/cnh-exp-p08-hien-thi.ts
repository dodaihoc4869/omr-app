// CNH-1.0 P08 — ĐƯỜNG ĐỌC: TRÁM SỐ P08 LÊN BẢN HIỂN THỊ.
//
// ⚠️ CHỈ SỬA BẢN HIỂN THỊ (sau `visible()`), TUYỆT ĐỐI KHÔNG nhét vào `loadProfile`: hồ sơ đọc từ
// `loadProfile` còn đi qua các đường LEGACY rồi `save()` ngược lại `game_v2_profile` — nhét số P08 vào đó
// sẽ GHI số P08 vào sổ cũ. Trám tại ĐIỂM TRẢ CHUNG (`gameV2` bọc `gameV2Tho`) + màn cửa hàng `vang-xem`.
//
// VÌ SAO CẦN: `exp-d1.ts` nay GƯƠNG EXP kiếm được sang `cnh_exp_account` (cùng lúc với sổ cũ), còn lệnh P08
// (`hapThuCore`…) tiêu ví P08. Không có đường đọc thì màn em vẫn đọc sổ CŨ ⇒ hai sổ lệch.
import type { Env } from './kieu'
import { docCauHinhKichHoat } from './cnh-exp-adapter'
import { kiemCuaKichHoat } from './cnh-exp-route-gate'
import { tongExpToiCap } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { MANH_MOI_KHIEN } from './exp-cau-hinh'

/** Số P08 áp lên bản hiển thị (chỉ các trường em NHÌN THẤY). */
export interface TramP08 {
  wallet: number
  ongNghiem: number
  cap: number
  exp: number
  earned: number
  khienConLai: number
  soNgayDat: number
  hapThuHomNay: { da: number }
  khienRen: { manh: number; daRen: number; chuaDung: number; conLai: number; moiKhien: number }
}

interface DongVi { wallet_exp: number; earned_exp: number }
interface DongTrangThai {
  absorbed_today: number
  invested_exp: number
  level: number
  fragment_balance: number
  unused_shields: number
  used_shields: number
  achieved_days: number
}

/**
 * Đọc số P08 để TRÁM lên hiển thị. Trả `null` khi: cổng ĐÓNG (mặc định), hoặc em CHƯA có hàng ví/trạng thái
 * (⇒ giữ nguyên bản cũ, chuyển tiếp êm). KHÔNG ném.
 */
export async function tramP08LenHienThi(env: Env, sbd: string): Promise<TramP08 | null> {
  try {
    const c = await docCauHinhKichHoat(env)
    if (!kiemCuaKichHoat(c).choPhep) return null
    const [tk, st] = await Promise.all([
      env.DB.prepare('SELECT wallet_exp, earned_exp FROM cnh_exp_account WHERE student_id = ?').bind(sbd).first<DongVi>(),
      env.DB.prepare(
        `SELECT absorbed_today, invested_exp, level, fragment_balance, unused_shields, used_shields, achieved_days
           FROM cnh_exp_p08_state WHERE student_id = ?`,
      ).bind(sbd).first<DongTrangThai>(),
    ])
    if (!tk || !st) return null
    const so = [tk.wallet_exp, tk.earned_exp, st.invested_exp, st.level, st.fragment_balance, st.unused_shields, st.used_shields, st.achieved_days]
    if (!so.every((x) => Number.isSafeInteger(x) && x >= 0)) return null // hàng hỏng ⇒ giữ bản cũ, không bịa số
    // `exp` trong cấp = `invested_exp` trừ tổng đường tới cấp hiện tại (nghịch của `chieuTrangThaiP08`).
    const expTrongCap = Math.max(0, st.invested_exp - tongExpToiCap(st.level))
    return {
      wallet: tk.wallet_exp,
      ongNghiem: tk.wallet_exp,
      cap: st.level,
      exp: expTrongCap,
      earned: tk.earned_exp,
      khienConLai: st.unused_shields,
      soNgayDat: st.achieved_days,
      hapThuHomNay: { da: st.absorbed_today },
      // P08 gộp quà + rèn vào MỘT cặp `unused`/`used` (không tách nguồn) ⇒ `chuaDung` = số khiên chưa dùng.
      khienRen: { manh: st.fragment_balance, daRen: st.used_shields, chuaDung: st.unused_shields, conLai: st.unused_shields, moiKhien: MANH_MOI_KHIEN },
    }
  } catch {
    return null
  }
}
