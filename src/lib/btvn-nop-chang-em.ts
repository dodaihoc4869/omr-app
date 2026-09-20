// NỘP MỘT CHẶNG của bài BTVN "nâng đỡ" — phía host (cổng học sinh), nối phiếu trong iframe với máy chủ.
// Hợp đồng: docs/hop-dong-btvn-nang-do-2109.md mục 4.
//
// Phiếu trong iframe KHÔNG có đáp án nên không tự chấm cũng không tự gọi mạng: nó gửi `ddh-btvn-nop-chang` ra host,
// host gọi hàm này. Thứ tự làm việc (mỗi bước hỏng thì dừng, KHÔNG nuốt lỗi, bài làm của em vẫn còn ở máy):
//   1. nộp đáp án các câu MỚI LÀM của chặng → máy chủ chấm, khoá đáp án đầu, trả kết quả + lời giải;
//   2. lưu kết quả ở máy (để mở lại chặng vẫn thấy lời giải — máy chủ không gửi lại đáp án qua `de.cau`);
//   3. tải lại bài (trạng thái chặng máy chủ vừa đổi) rồi dựng phiếu mới có kết quả.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import { docBaiCaNhan, luuKetQuaChang, type KetQuaChang } from './btvn-ca-nhan-em'

export interface TinNopChang {
  ma: string
  sbd: string
  chiSo: number
  dapAn: Record<string, string>
}

export interface KqNopChang {
  ok: boolean
  /** Lời báo cho em khi hỏng. */
  error?: string
  /** Phiếu dựng lại sau khi nộp; vắng khi không tải lại được bài (host đóng phiếu và nạp lại danh sách). */
  html?: string
  ket?: KetQuaChang
  /** Tổng số chặng của bài (từ lần tải lại) — để vẽ thanh chặng ở thẻ cuối chặng. */
  soChang?: number
}

export interface PhuThuocNopChang {
  layCauHinh: () => Promise<CauHinhMayChu>
  nopChang: (ch: CauHinhMayChu, d: TinNopChang & { maBtvn: string }) => Promise<KetQuaChang>
  cuaEm: (ch: CauHinhMayChu, maCa: string, sbd: string, maBtvn: string) => Promise<Record<string, unknown> & { ok: boolean }>
  dungPhieu: (r: Record<string, unknown>, maCa: string, sbd: string) => Promise<string>
}

const LOI_CHUNG = 'Chưa nộp được chặng. Bài của em vẫn được giữ, em thử lại nhé.'

/** Lời báo cho em từ phản hồi lỗi của máy chủ. */
export function loiChoEm(ket: Pick<KetQuaChang, 'lyDo' | 'error'>): string {
  if (ket.lyDo === 'chang_chua_mo') return 'Chặng này chưa mở. Em quay lại đúng ngày nhé.'
  if (ket.lyDo === 'qua_han') return 'Bài đã quá hạn nộp.'
  return ket.error && ket.error.trim() ? ket.error : LOI_CHUNG
}

const dapAnHopLe = (d: unknown): d is Record<string, string> =>
  typeof d === 'object' && d !== null && !Array.isArray(d) && Object.values(d).every((v) => typeof v === 'string')

export async function nopChangCaNhan(tin: TinNopChang, maCa: string, dep: PhuThuocNopChang = macDinh()): Promise<KqNopChang> {
  if (!tin.ma || !Number.isInteger(tin.chiSo) || tin.chiSo < 0 || !dapAnHopLe(tin.dapAn) || Object.keys(tin.dapAn).length === 0) {
    return { ok: false, error: 'Gói nộp không hợp lệ. Em mở lại bài rồi nộp nhé.' }
  }
  try {
    const ch = await dep.layCauHinh()
    const ket = await dep.nopChang(ch, { ...tin, maBtvn: tin.ma })
    if (!ket.ok) return { ok: false, error: loiChoEm(ket) }
    // Không câu nào được chấm (đáp án chưa hợp lệ: Phần II chưa đủ 4 ý, Phần III chưa có số…) ⇒ báo, không dựng lại.
    if (ket.ketQua.length === 0) return { ok: false, error: 'Chưa có câu nào được chấm. Em kiểm tra lại đáp án (Phần II cần đủ 4 ý, Phần III cần có số) rồi nộp lại nhé.', ket }
    luuKetQuaChang(tin.ma, tin.sbd, tin.chiSo, ket.ketQua, tin.dapAn)
    try {
      const r = await dep.cuaEm(ch, maCa, tin.sbd, tin.ma)
      if (r.ok) {
        const soChang = docBaiCaNhan(r)?.soChang
        return { ok: true, ket, html: await dep.dungPhieu(r, maCa, tin.sbd), ...(soChang ? { soChang } : {}) }
      }
    } catch {
      /* đã nộp thành công và đã lưu kết quả — chỉ không dựng lại được phiếu lúc này */
    }
    return { ok: true, ket }
  } catch {
    return { ok: false, error: LOI_CHUNG }
  }
}

function macDinh(): PhuThuocNopChang {
  return {
    layCauHinh: async () => (await import('./btvn-cho-em')).layCauHinhChoEmBtvn(),
    nopChang: async (ch, d) => (await import('./btvn-may-chu-moi')).nopChangBtvn(ch, { maBtvn: d.maBtvn, sbd: d.sbd, chiSo: d.chiSo, dapAn: d.dapAn }),
    cuaEm: async (ch, maCa, sbd, maBtvn) => (await import('./btvn-may-chu-moi')).btvnCuaEm(ch, maCa, sbd, maBtvn),
    dungPhieu: async (r, maCa, sbd) => (await import('./btvn-cho-em')).dungPhieuBtvn(r as never, maCa, sbd),
  }
}
