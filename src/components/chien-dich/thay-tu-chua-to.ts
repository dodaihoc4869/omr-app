// THẦY TỰ CHỮA (12/10) — DỰNG TỜ MÁY CHIẾU cho đề thầy chọn trong Dạy học. Dùng LẠI đúng luồng tờ chiếu của Chiếu lên bảng (`dungToChieu` →
// `cauLuyenTuBoCau` → `taoHtmlMayChieu` → `KhungXemPhieu`): cùng khuôn đề + phương án + hình + bảng, lời giải hiện dần, lật trang, phím tắt, chữ không thu nhỏ.
//   · NỘI DUNG ĐÚNG MÃ: bảng tra dựng từ CHÍNH các tờ thầy chọn (`dungBangTra`, khoá id kho + mã câu máy chủ) — `traChinhXac` theo nguyên mã, không đoán số thứ tự.
//     Câu không có chữ đề lẫn hình trên máy ⇒ không vào bảng tra ⇒ tờ chiếu dòng thay thế "Nội dung câu hỏi N" và được đếm `soThieu` (luật cũ).
//   · KHỐI: `khoiDich` = khối của lớp thầy chọn ⇒ câu mang mã khối khác bị BỎ (`cauKhacKhoiLop`, đếm `soBoKhoi`).
//   · THỐNG KÊ LỚP (phím T): số gộp `/gv/thong-ke-lop-cau` (sổ học của các em trong lớp, không tên em) ⇒ `thongKeTuSoGop`; không có số ⇒ không dải.
//   · AI SAI (phím X): tờ cả lớp ⇒ mốc khoá ẩn `|<mã câu>` mỗi đợt (`aiSaiCaLop`), app trả lời bằng lệnh CHỈ ĐỌC sẵn có `/gv/ai-sai-cau` (em · giờ · nơi · số giây).
//   · TỰ LUẬN: thầy tự chọn đề ⇒ giữ (`giuTuLuan`), tờ ghi "Tự luận" như bảng Dạy học.
import type { TeacherExamSource } from '../../data/examContent'
import type { CauTuChua } from '../../lib/thay-tu-chua'
import { thongKeTuSoGop, type SoGopCauLop } from '../../lib/thong-ke-lop-cau'
import { dungBangTra, dungToChieu, type OChieu, type OGhiToChieu } from './to-chieu'

/** Dòng tờ chiếu của từng câu (đúng thứ tự đã xếp): "Cả lớp" (không gọi em), số câu = số trên đề. */
export function oChieuTuChua(ds: readonly CauTuChua[]): OChieu[] {
  return ds.map((c) => ({
    qid: c.qid,
    stt: c.so,
    phan: c.phan,
    mucDo: (c.q as { mucDo?: string }).mucDo ?? null,
    sbd: '',
    ten: 'Cả lớp',
    viSao: 'Thầy tự chữa cả lớp',
  }))
}

/** Bản sao các tờ, BỎ câu không có nội dung trên máy (để tờ chiếu dùng dòng thay thế thay vì một khung trắng). */
export function toCoNoiDung(dsTo: readonly TeacherExamSource[], thieu: ReadonlySet<string>): TeacherExamSource[] {
  if (!thieu.size) return [...dsTo]
  const giu = <T extends { id: string }>(a: readonly T[] | undefined) => (a ?? []).filter((q) => !thieu.has(q.id))
  return dsTo.map((s) => ({ ...s, phanI: giu(s.phanI), phanII: giu(s.phanII), phanIII: giu(s.phanIII) }))
}

export interface TuyChonToTuChua {
  tenBuoi: string
  /** Khối của lớp đang chọn (10 / 11 / 12); null ⇒ không chặn khối. */
  khoi: number | null
  /** Mã phiên cầu nối (Thầy tự chữa luôn truyền ⇒ tờ nối app để nút X tra "Ai sai"). */
  maPhien?: string
  /** Số gộp của lớp theo mã câu máy chủ; vắng / lỗi ⇒ tờ không có dải thống kê. */
  soGop?: Readonly<Record<string, SoGopCauLop>> | null
}

/** Dựng tờ: mọi câu đã xếp, đúng mã, bỏ câu khác khối. Trả thêm `o` (mốc khoá các ô cả lớp) cho `useGhiToChieu`. */
export async function dungToThayTuChua(
  ds: readonly CauTuChua[],
  dsTo: readonly TeacherExamSource[],
  tuy: TuyChonToTuChua,
): Promise<{ html: string; soThieu: number; soBoKhoi: number; o: Map<string, OGhiToChieu> }> {
  const tra = dungBangTra(toCoNoiDung(dsTo, new Set(ds.filter((c) => c.thieuNoiDung).map((c) => c.khoa))))
  const soGop = tuy.soGop ?? null
  return dungToChieu(oChieuTuChua(ds), tuy.tenBuoi, tra, tuy.maPhien, {
    khoiDich: tuy.khoi ? [tuy.khoi] : [],
    giuTuLuan: true,
    aiSaiCaLop: true,
    thongKe: (qid, cau) => (soGop?.[qid] ? thongKeTuSoGop(cau.phan, soGop[qid], String(cau.dapAn ?? '')) : null),
  })
}
