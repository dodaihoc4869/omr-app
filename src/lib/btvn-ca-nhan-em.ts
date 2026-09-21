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

// ───────────────────────── "CHO LÀM LẠI" của thầy: đổi lượt làm ─────────────────────────
// Thầy bấm "Cho làm lại" (`/btvn/cho-lam-lai`) ⇒ máy chủ tăng `soLanLam`, xoá nộp/đáp án/chặng đã xong, GIỮ NGUYÊN bộ câu
// và hạn nộp. Bộ câu giữ nguyên nên nháp của phiếu (khoá theo VÂN TAY bộ câu) sẽ hiện LẠI đáp án lượt cũ nếu không xoá.
// Máy em nhớ số lượt đã thấy; thấy khác ⇒ bỏ nháp + kết quả chặng của lượt cũ, mở lại từ chặng 1.

export const khoaLuotLam = (maBtvn: string, sbd: string): string => `ddh.btvn.luot.${maBtvn}.${sbd}`

/** Xoá mọi thứ ở máy thuộc bài này của em này: nháp (host + phiếu) và kết quả từng chặng. Không đụng bài/em khác. */
function xoaLamDoLuotCu(maBtvn: string, sbd: string): void {
  try {
    const bo = [`ddh.btvn.draft.${maBtvn}.${sbd}`, `ddh.lam.${maBtvn}`]
    const tienTo = [`ddh.lam.${maBtvn}.`, `ddh.btvn.ketqua.${maBtvn}.${sbd}.`]
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && (bo.includes(k) || tienTo.some((t) => k.startsWith(t)))) localStorage.removeItem(k)
    }
  } catch {
    /* máy chặn lưu: không có gì để xoá */
  }
}

/** Gọi MỖI LẦN mở/dựng lại phiếu bài `ca_nhan`, TRƯỚC khi đọc nháp/kết quả. Trả true nếu vừa bỏ làm dở của lượt cũ.
 * `soLanLam` không phải số nguyên ≥ 1 (máy chủ cũ, thiếu trường) ⇒ không làm gì. Lần đầu thấy lượt 1 ⇒ chỉ ghi nhớ, KHÔNG xoá
 * (không phá bài đang làm). */
export function doiLuotLam(maBtvn: string, sbd: string, soLanLam: unknown): boolean {
  if (!maBtvn || typeof soLanLam !== 'number' || !Number.isInteger(soLanLam) || soLanLam < 1) return false
  try {
    const cu = localStorage.getItem(khoaLuotLam(maBtvn, sbd))
    const daThay = cu === null || cu.trim() === '' ? null : Number(cu)
    if (daThay === soLanLam) return false
    const laLuotMoi = daThay === null ? soLanLam > 1 : true
    if (laLuotMoi) xoaLamDoLuotCu(maBtvn, sbd)
    localStorage.setItem(khoaLuotLam(maBtvn, sbd), String(soLanLam))
    return laLuotMoi
  } catch {
    return false
  }
}
