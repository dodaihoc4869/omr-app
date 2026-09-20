// BTVN "NÂNG ĐỠ" — LƯU KẾT QUẢ CHẶNG Ở MÁY EM (localStorage). Chỉ chạy trong trình duyệt.
// Kiểu + hàm thuần nằm ở `btvn-ca-nhan-kieu.ts` (không đụng API trình duyệt, an toàn để phía máy chủ biên dịch); tệp này
// tái xuất tất cả để mã phía máy em chỉ cần một chỗ import.
import { docKetQuaChang, type KetQuaCauChang } from './btvn-ca-nhan-kieu'
export * from './btvn-ca-nhan-kieu'

const laDoiTuong = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

// ───────────────────────── lưu kết quả ở máy ─────────────────────────
// Máy chủ không gửi lại đáp án cho câu đã nộp qua `de.cau` — muốn xem lại lời giải chặng đã xong
// thì dùng chính kết quả máy chủ đã trả lúc nộp, giữ ở máy em.

export const khoaKetQuaChang = (maBtvn: string, sbd: string, chiSo: number): string => `ddh.btvn.ketqua.${maBtvn}.${sbd}.${chiSo}`

export interface KetQuaChangDaLuu {
  ketQua: KetQuaCauChang[]
  /** Đáp án em đã nộp (đáp án ĐẦU thắng, giống máy chủ). */
  dapAn: Record<string, string>
}

export function docKetQuaChangDaLuu(maBtvn: string, sbd: string, chiSo: number): KetQuaChangDaLuu {
  const rong: KetQuaChangDaLuu = { ketQua: [], dapAn: {} }
  try {
    const raw = localStorage.getItem(khoaKetQuaChang(maBtvn, sbd, chiSo))
    if (!raw) return rong
    const o = JSON.parse(raw) as unknown
    if (!laDoiTuong(o)) return rong
    const kq = docKetQuaChang({ ok: true, ketQua: o.ketQua })
    const dapAn: Record<string, string> = {}
    if (laDoiTuong(o.dapAn)) for (const [q, v] of Object.entries(o.dapAn)) if (typeof v === 'string') dapAn[q] = v
    return { ketQua: kq?.ketQua ?? [], dapAn }
  } catch {
    return rong
  }
}

/** Gộp thêm kết quả mới vào bản đã lưu. ĐÁP ÁN ĐẦU THẮNG: câu đã có thì giữ bản cũ. */
export function luuKetQuaChang(maBtvn: string, sbd: string, chiSo: number, moi: KetQuaCauChang[], dapAnGui: Record<string, string>): KetQuaChangDaLuu {
  const cu = docKetQuaChangDaLuu(maBtvn, sbd, chiSo)
  const coSan = new Set(cu.ketQua.map((k) => k.qid))
  const ketQua = [...cu.ketQua, ...moi.filter((k) => !coSan.has(k.qid))]
  const dapAn = { ...dapAnGui, ...cu.dapAn }
  for (const k of ketQua) if (!(k.qid in dapAn) && k.qid in dapAnGui) dapAn[k.qid] = dapAnGui[k.qid]
  const gop: KetQuaChangDaLuu = { ketQua, dapAn }
  try {
    localStorage.setItem(khoaKetQuaChang(maBtvn, sbd, chiSo), JSON.stringify(gop))
  } catch {
    /* máy chặn lưu: em vẫn thấy kết quả lần này, chỉ không xem lại được sau khi tải lại */
  }
  return gop
}
