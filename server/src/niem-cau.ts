// Gắn TEM NIÊM PHONG (niem-phong.ts) vào câu lúc PHÁT cho em — chỉ phiên học tập (`hocTap`), câu qua được luật chấm nhanh (không tự luận, trong kênh số).
// Tem là việc phụ của lệnh mở chặng: lỗi bất kỳ ⇒ câu đi không tem (máy em dùng đường chấm thường), không bao giờ làm hỏng lượt mở.
import { noiDungTuCauGoc } from '../../src/lib/thoi-gian-len-bang'
import { ngoaiKenhSo } from '../../src/lib/so-o-tra-loi-ngan'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from './cam-tu-luan'
import { SO_TU_TOI_DA } from './do-giay-luot'
import { HAN_NIEM_MS, lamMoiNiem, niemPhong } from './niem-phong'
import { omniChoTem } from './omni-d1'
import type { Env } from './kieu'

/** Kết quả hỏi OMNI cho cả chặng (omni-d1.ts `omniChoTem`). */
type OmniTem = NonNullable<Awaited<ReturnType<typeof omniChoTem>>>
/** Phần OMNI của tem: tắt ⇒ `o: 0` (không bao giờ lướt); áp + biết kỳ vọng ⇒ `o: 1, y, u`; chưa biết ⇒ `o: 1` (câu sai nhanh đi đường thường như cũ). */
const dauOmni = (hoa2: boolean, om: OmniTem | null, qid: string): { o: 0 | 1; y?: number; u?: number } => {
  if (!hoa2) return { o: 0 }
  if (!om) return { o: 1 }
  if (!om.bat) return { o: 0 }
  const y = om.ky.get(qid)
  return y ? { o: 1, y: Math.round(y), u: om.luot } : { o: 1 }
}

/** Tem cho MỘT câu (đúng như đã phát: đã xáo theo phiên). `hoa2`: phiên Hoá 2.0 (OMNI có thể xét lướt). */
export async function niemPhongCau(env: Env, sbd: string, q: PrivateQuestion, hoa2: boolean, nayMs = Date.now(), hanMs = HAN_NIEM_MS, om: OmniTem | null = null): Promise<string | undefined> {
  try {
    if (laCauTuLuan(q) || ngoaiKenhSo(q) || (q.phan !== 'I' && q.phan !== 'II' && q.phan !== 'III') || !q.correct) return undefined
    // Kích thước đề đo ĐÚNG như `boSungKichThuocDe` (do-giay-luot.ts); hàm đếm lỗi ⇒ -1 (nơi dùng giữ nguyên số đo giây, không thêm kích thước).
    let t = -1, h: 0 | 1 = 0
    try { const nd = noiDungTuCauGoc(q.phan, q); t = Math.min(SO_TU_TOI_DA, Math.max(0, nd.soTu)); h = nd.coHinh ? 1 : 0 } catch { /* khuôn lạ */ }
    return await niemPhong(env, sbd, { q: q.qid, r: q.version, g: q.group, p: q.phan, c: q.correct, l: q.solution, m: q.hinhAnh.filter((x) => x.viTri === 'sau_loi_giai'), t, h, ...dauOmni(hoa2, om, q.qid) }, nayMs, hanMs)
  } catch { return undefined }
}

/** Gắn `sk` vào từng câu công khai `cong[i]` (tương ứng riêng `rieng[i]`) — song song. Câu không niêm phong được thì giữ nguyên. */
export async function ganNiemChoCau(env: Env, sbd: string, cong: Record<string, unknown>[], rieng: readonly PrivateQuestion[], hoa2: boolean, nayMs = Date.now(), hanMs = HAN_NIEM_MS): Promise<void> {
  // Phiên Hoá 2.0: hỏi OMNI MỘT lần cho cả chặng (kỳ vọng từng câu + số lướt hôm nay) để tem quyết được câu SAI nhanh không cần D1. Lỗi ⇒ null ⇒ tem như cũ.
  const om = hoa2 ? await omniChoTem(env, sbd, rieng.filter(Boolean).map((q) => ({ qid: q.qid, phan: q.phan as 'I' | 'II' | 'III', mucDo: q.mucDo ?? null })), nayMs).catch(() => null) : null
  await Promise.all(cong.map(async (c, i) => { const q = rieng[i]; if (!q) return; const sk = await niemPhongCau(env, sbd, q, hoa2, nayMs, hanMs, om); if (sk) c.sk = sk }))
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
