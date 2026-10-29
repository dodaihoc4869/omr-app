// Gắn TEM NIÊM PHONG (niem-phong.ts) vào câu lúc PHÁT cho em — chỉ phiên học tập (`hocTap`), câu qua được luật chấm nhanh (không tự luận, trong kênh số).
// Tem là việc phụ của lệnh mở chặng: lỗi bất kỳ ⇒ câu đi không tem (máy em dùng đường chấm thường), không bao giờ làm hỏng lượt mở.
import { noiDungTuCauGoc } from '../../src/lib/thoi-gian-len-bang'
import { ngoaiKenhSo } from '../../src/lib/so-o-tra-loi-ngan'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from './cam-tu-luan'
import { SO_TU_TOI_DA } from './do-giay-luot'
import { HAN_NIEM_MS, lamMoiNiem, niemPhong } from './niem-phong'
import type { Env } from './kieu'

/** Tem cho MỘT câu (đúng như đã phát: đã xáo theo phiên). `hoa2`: phiên Hoá 2.0 (OMNI có thể xét lướt). */
export async function niemPhongCau(env: Env, sbd: string, q: PrivateQuestion, hoa2: boolean, nayMs = Date.now(), hanMs = HAN_NIEM_MS): Promise<string | undefined> {
  try {
    if (laCauTuLuan(q) || ngoaiKenhSo(q) || (q.phan !== 'I' && q.phan !== 'II' && q.phan !== 'III') || !q.correct) return undefined
    // Kích thước đề đo ĐÚNG như `boSungKichThuocDe` (do-giay-luot.ts); hàm đếm lỗi ⇒ -1 (nơi dùng giữ nguyên số đo giây, không thêm kích thước).
    let t = -1, h: 0 | 1 = 0
    try { const nd = noiDungTuCauGoc(q.phan, q); t = Math.min(SO_TU_TOI_DA, Math.max(0, nd.soTu)); h = nd.coHinh ? 1 : 0 } catch { /* khuôn lạ */ }
    return await niemPhong(env, sbd, { q: q.qid, r: q.version, g: q.group, p: q.phan, c: q.correct, l: q.solution, m: q.hinhAnh.filter((x) => x.viTri === 'sau_loi_giai'), t, h, o: hoa2 ? 1 : 0 }, nayMs, hanMs)
  } catch { return undefined }
}

/** Gắn `sk` vào từng câu công khai `cong[i]` (tương ứng riêng `rieng[i]`) — song song. Câu không niêm phong được thì giữ nguyên. */
export async function ganNiemChoCau(env: Env, sbd: string, cong: Record<string, unknown>[], rieng: readonly PrivateQuestion[], hoa2: boolean, nayMs = Date.now(), hanMs = HAN_NIEM_MS): Promise<void> {
  await Promise.all(cong.map(async (c, i) => { const q = rieng[i]; if (!q) return; const sk = await niemPhongCau(env, sbd, q, hoa2, nayMs, hanMs); if (sk) c.sk = sk }))
}

/** Bản SAO các câu công khai của chặng lập sẵn với tem làm MỚI (hạn 45 phút từ giờ); tem không làm mới được thì bỏ khỏi bản sao. Không sửa mảng gốc (đang nằm trong bản lập sẵn). */
export async function lamMoiNiemChoCau(env: Env, sbd: string, cau: readonly unknown[], nayMs = Date.now()): Promise<unknown[]> {
  return Promise.all(cau.map(async (c) => {
    const o = c as Record<string, unknown> | null
    if (!o || typeof o !== 'object' || typeof o.sk !== 'string') return c
    const { sk: cu, ...con } = o
    const moi = await lamMoiNiem(env, sbd, String(o.qid ?? ''), cu, nayMs)
    return moi ? { ...con, sk: moi } : con
  }))
}
