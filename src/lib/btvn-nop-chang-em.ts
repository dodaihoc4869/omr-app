// NỘP MỘT CHẶNG của bài BTVN "nâng đỡ" — phía host (cổng học sinh), nối phiếu trong iframe với máy chủ.
// Hợp đồng: docs/hop-dong-btvn-nang-do-2109.md mục 4.
//
// Phiếu trong iframe KHÔNG có đáp án nên không tự chấm cũng không tự gọi mạng: nó gửi `ddh-btvn-nop-chang` ra host,
// host gọi hàm này. Thứ tự làm việc (mỗi bước hỏng thì dừng, KHÔNG nuốt lỗi, bài làm của em vẫn còn ở máy):
//   1. nộp đáp án các câu MỚI LÀM của chặng → máy chủ chấm, khoá đáp án đầu, trả kết quả + lời giải;
//   2. lưu kết quả ở máy (để mở lại chặng vẫn thấy lời giải — máy chủ không gửi lại đáp án qua `de.cau`);
//   3. tải lại bài (trạng thái chặng máy chủ vừa đổi) rồi dựng phiếu mới có kết quả.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import { docBaiCaNhan, doiLuotLam, luuKetQuaChang, type KetQuaChang } from './btvn-ca-nhan-em'

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
  /** Máy chủ BẬN / không nối được (hết giờ, rớt mạng): bài vẫn ở máy — phiếu khoá nút nộp 15 giây (chống bấm dồn lúc máy chủ nghẽn). */
  ban?: boolean
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
/** Máy chủ nghẽn (sự cố D1 21/09 ~20:30): hết giờ / không nối được ⇒ nói rõ bài còn ở máy và hẹn nộp lại sau 1 phút (nút khoá 15 giây để không dồn thêm lượt). */
export const LOI_MAY_CHU_BAN = 'Máy chủ đang bận, bài của em vẫn ở máy. Bấm nộp lại sau 1 phút.'
const laLoiKhongNoi = (e: string | undefined) => /Không nối được máy chủ/i.test(e ?? '')
/** Máy chủ BẬN (không phải bị từ chối về nghiệp vụ): rớt mạng / hết giờ, HOẶC lỗi chung của Worker khi D1 quá tải (không có `lyDo` nghiệp vụ như chang_chua_mo, qua_han…). */
const laMayChuBan = (k: { lyDo?: string; error?: string }) => laLoiKhongNoi(k.error) || (!k.lyDo && /D1|overload|quá tải|đang bận|hết giờ|timeout|tạm thời|thử lại sau/i.test(k.error ?? ''))

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
    if (!ket.ok) return laMayChuBan(ket) ? { ok: false, error: LOI_MAY_CHU_BAN, ban: true } : { ok: false, error: loiChoEm(ket) }
    // Không câu nào được chấm (đáp án chưa hợp lệ: Phần II chưa đủ 4 ý, Phần III chưa có số…) ⇒ báo, không dựng lại.
    if (ket.ketQua.length === 0) return { ok: false, error: 'Chưa có câu nào được chấm. Em kiểm tra lại đáp án (Phần II cần đủ 4 ý, Phần III cần có số) rồi nộp lại nhé.', ket }
    // Tải lại bài TRƯỚC khi lưu: nếu thầy vừa "Cho làm lại" (soLanLam đổi) thì bỏ làm dở lượt cũ rồi mới lưu kết quả lượt MỚI —
    // lưu trước thì kết quả vừa chấm bị xoá nhầm cùng lượt cũ.
    let r: (Record<string, unknown> & { ok: boolean }) | null = null
    try {
      const x = await dep.cuaEm(ch, maCa, tin.sbd, tin.ma)
      if (x.ok) r = x
    } catch {
      /* không tải lại được: vẫn lưu kết quả vừa nhận */
    }
    if (r) doiLuotLam(tin.ma, tin.sbd, r.soLanLam)
    luuKetQuaChang(tin.ma, tin.sbd, tin.chiSo, ket.ketQua, tin.dapAn)
    if (r) {
      try {
        const soChang = docBaiCaNhan(r)?.soChang
        return { ok: true, ket, html: await dep.dungPhieu(r, maCa, tin.sbd), ...(soChang ? { soChang } : {}) }
      } catch {
        /* đã nộp thành công và đã lưu kết quả — chỉ không dựng lại được phiếu lúc này */
      }
    }
    return { ok: true, ket }
  } catch {
    return { ok: false, error: LOI_MAY_CHU_BAN, ban: true }
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
