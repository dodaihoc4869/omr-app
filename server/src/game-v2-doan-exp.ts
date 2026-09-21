// EXP KẾT CHẶNG ĐOÀN HỘ TỐNG (Điều 9, thầy lệnh 21/09 13:43; prompt-than-thu-moi-ngay-2109.md — vào ĐỢT 2): thắng chặng 5/10/15 EXP theo 1/2/3 sao (chặng thắng ĐẦU ngày VN đủ, các chặng sau một nửa làm tròn lên),
// cả đội làm vỡ giáp trùm +3 EXP mỗi trùm cho TỪNG bạn (kể cả chặng thua). Số tiền do hàm thuần của Code 1 (`khoanKetChang`, src/game/than-thu-v2/doan-core.ts). Ghi sổ `exp_so` loại `doan_chang` / `doan_giap`,
// khoá `<sbd>|doan_chang|<mã chặng>` và `<sbd>|doan_giap|<mã chặng>` (gọi lại không cộng đôi), qua cửa trần 120 EXP game/ngày (`ghiKhoanExpGame`). Bạn máy không có sổ. Lỗi từng em chỉ ghi log, KHÔNG làm hỏng việc chốt chặng.
import type { Env } from './kieu'
import { khoanKetChang, type TomTatChang } from '../../src/game/than-thu-v2/doan-core'
import { ghiKhoanExpGame } from './exp-d1'
import { ngayVn } from './su-kien-hoc'

/** Đây có phải chặng THẮNG ĐẦU TIÊN trong ngày VN của em không (không tính chặng đang xét). Đọc `doan_luot.thang` đã chốt cùng giao dịch kết chặng. */
async function laChangThangDauNgay(env: Env, sbd: string, ngay: string, ma: string): Promise<boolean> {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM doan_luot WHERE sbd = ? AND ngay_vn = ? AND thang = 1 AND ma_chang <> ?').bind(sbd, ngay, ma).first<{ n: number }>()
  return (Number(r?.n) || 0) === 0
}

/** Trao EXP kết chặng cho từng bạn THẬT (bỏ bạn máy). `ghe[].id` = SBD. Không ném lỗi. */
export async function traoExpKetChang(env: Env, ma: string, ketLucMs: number, tt: TomTatChang, nowMs: number = Date.now()): Promise<void> {
  const luc = new Date(ketLucMs).toISOString()
  const ngay = ngayVn(luc)
  const soTrum = tt.trumVoGiap.filter(Boolean).length
  for (const g of tt.ghe) {
    if (g.laMay || !g.id) continue
    try {
      const k = khoanKetChang(tt, tt.thang ? await laChangThangDauNgay(env, g.id, ngay, ma) : false)
      if (k.chang > 0) await ghiKhoanExpGame(env, g.id, { khoa: `doan_chang|${ma}`, loai: 'doan_chang', exp: k.chang, ngay, luc, ghiChu: `Thắng chặng ${tt.sao} sao +${k.chang} EXP`, maNguon: ma }, nowMs)
      if (k.voGiap > 0) await ghiKhoanExpGame(env, g.id, { khoa: `doan_giap|${ma}`, loai: 'doan_giap', exp: k.voGiap, ngay, luc, ghiChu: `Vỡ giáp ${soTrum} trùm +${k.voGiap} EXP`, maNguon: ma }, nowMs)
    } catch (e) {
      console.error('[doan-exp] trao EXP kết chặng lỗi (bỏ qua):', e instanceof Error ? e.message : e)
    }
  }
}

/** Các khoản EXP của chặng `ma` của MỘT em, dạng gửi máy em (nhãn có số, cho màn kết chặng): thắng chặng, vỡ giáp, tiếp sức. Vắng bảng/lỗi ⇒ []. */
export async function docExpKetChang(env: Env, sbd: string, ma: string): Promise<{ loai: string; exp: number; ghiChu: string }[]> {
  try {
    const r = await env.DB.prepare("SELECT loai, exp, ghi_chu FROM exp_so WHERE sbd = ? AND (ma_nguon = ? OR ma_nguon LIKE ? || '|%') AND loai IN ('doan_chang', 'doan_giap', 'tiepsuc') ORDER BY luc, khoa").bind(sbd, ma, ma).all<{ loai: string; exp: number; ghi_chu: string | null }>()
    return (r.results ?? []).map((x) => ({ loai: String(x.loai), exp: Number(x.exp) || 0, ghiChu: String(x.ghi_chu ?? '') }))
  } catch {
    return []
  }
}
