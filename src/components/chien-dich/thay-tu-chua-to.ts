// CHỮA CÂU KHÓ & TÍNH TOÁN (Thầy tự chữa 12/10 → 12/10B "chiếu lên bảng theo chuẩn") — DỰNG TỜ MÁY CHIẾU cho đề thầy chọn trong Dạy học. Dùng LẠI đúng
// luồng tờ chiếu của Chiếu lên bảng (`dungToChieu` → `cauLuyenTuBoCau` → `taoHtmlMayChieu` → `KhungXemPhieu`): cùng khuôn đề + phương án + hình + bảng,
// lời giải hiện dần, lật trang, phím tắt, chữ không thu nhỏ.
//   · NỘI DUNG ĐÚNG MÃ: bảng tra dựng từ CHÍNH các tờ thầy chọn (`dungBangTra`, khoá id kho + mã câu máy chủ) — `traChinhXac` theo nguyên mã, không đoán số thứ tự.
//     Câu không có chữ đề lẫn hình trên máy ⇒ không vào bảng tra ⇒ tờ chiếu dòng thay thế "Nội dung câu hỏi N" và được đếm `soThieu` (luật cũ).
//   · KHỐI: `khoiDich` = khối của lớp thầy chọn ⇒ câu mang mã khối khác bị BỎ (`cauKhacKhoiLop`, đếm `soBoKhoi`).
//   · GỌI EM (12/10B, chuẩn Chiếu lên bảng): câu có em của lớp làm SAI (`ungVien`, ung-vien-chua-cau.ts) ⇒ ô CÓ EM = người đầu danh sách (phím L / nút
//     "Lên bảng" gọi em ấy), các em còn lại đi kèm cho nút "Gọi em khác"; thẻ tên mang "Sai câu này N lần · gần nhất dd/mm · số giây". Câu có chuyên đề ⇒
//     nút Đạt / Chưa đạt ghi sổ qua cầu nối (`useGhiToChieu`, lệnh `ghiLenBang` như Lên bảng chiến dịch); THIẾU chuyên đề ⇒ không nút, đếm `soKhongGhi`
//     để màn báo trước (luật cũ). Câu không có em nào sai ⇒ ô "Cả lớp" như trước (thầy chữa chung, X vẫn tra được ai sai).
//   · THỐNG KÊ LỚP (phím T): số gộp `/gv/thong-ke-lop-cau` (sổ học của các em trong lớp, không tên em) ⇒ `thongKeTuSoGop`; không có số ⇒ không dải.
//   · AI SAI (phím X): mốc khoá của ô (`aiSaiCaLop`), app trả lời bằng lệnh CHỈ ĐỌC sẵn có `/gv/ai-sai-cau` (em · giờ · nơi · số giây).
//   · TỰ LUẬN: thầy tự chọn đề ⇒ giữ (`giuTuLuan`), tờ ghi "Tự luận" như bảng Dạy học.
import type { TeacherExamSource } from '../../data/examContent'
import type { CauTuChua } from '../../lib/thay-tu-chua'
import { nhanTheTen, type UngVien } from '../../lib/ung-vien-chua-cau'
import { thongKeTuSoGop, type SoGopCauLop } from '../../lib/thong-ke-lop-cau'
import { cauKhacKhoiLop, dungBangTra, dungToChieu, type OChieu, type OGhiToChieu } from './to-chieu'

/** Số liệu lớp của một câu cho thanh dưới tờ ("18/34 em lớp sai câu này"). */
export interface SoLopCau {
  sai: number
  lam: number
}

/** Dòng tờ chiếu của từng câu (đúng thứ tự đã xếp). Có em làm sai ⇒ ô có em (người đầu) + danh sách gọi thay; không ⇒ "Cả lớp". Số câu = số trên đề. */
export function oChieuTuChua(ds: readonly CauTuChua[], ungVien?: ReadonlyMap<string, readonly UngVien[]> | null, soLop?: ReadonlyMap<string, SoLopCau> | null): OChieu[] {
  return ds.map((c) => {
    const chung = { qid: c.qid, stt: c.so, phan: c.phan, mucDo: (c.q as { mucDo?: string }).mucDo ?? null }
    const lop = soLop?.get(c.qid)
    const chuLop = lop && lop.lam > 0 ? `${lop.sai}/${lop.lam} em lớp sai câu này` : ''
    const uv = ungVien?.get(c.qid) ?? []
    const dau = uv[0]
    if (!dau) return { ...chung, sbd: '', ten: 'Cả lớp', viSao: 'Thầy tự chữa cả lớp', ...(chuLop ? { chuLop } : {}) }
    const nhan = (e: UngVien) => ({ kieu: 'sai' as const, chu: nhanTheTen(e) })
    return {
      ...chung,
      sbd: dau.sbd,
      ten: dau.ten,
      viSao: 'Làm sai câu này',
      lichSu: nhan(dau),
      ungVien: uv.map((e) => ({ sbd: e.sbd, ten: e.ten, lichSu: nhan(e) })),
      ...(chuLop ? { chuLop } : {}),
    }
  })
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
  /** Mã phiên cầu nối (luôn truyền ⇒ tờ nối app: Đạt / Chưa đạt, nút X "Ai sai", bảng chi tiết em). */
  maPhien?: string
  /** Số gộp của lớp theo mã câu máy chủ; vắng / lỗi ⇒ tờ không có dải thống kê. */
  soGop?: Readonly<Record<string, SoGopCauLop>> | null
  /** Em của lớp làm sai từng câu, đã xếp (người đầu = em gọi lên bảng). Vắng ⇒ mọi câu "Cả lớp". */
  ungVien?: ReadonlyMap<string, readonly UngVien[]> | null
  /** Số em sai / số em làm của lớp từng câu (thanh dưới tờ). */
  soLop?: ReadonlyMap<string, SoLopCau> | null
}

/** Dựng tờ: mọi câu đã xếp, đúng mã, bỏ câu khác khối. Trả thêm `o` (khoá ô ⇒ ô) cho `useGhiToChieu` và `soKhongGhi` (số câu có em nhưng thiếu chuyên đề). */
export async function dungToThayTuChua(
  ds: readonly CauTuChua[],
  dsTo: readonly TeacherExamSource[],
  tuy: TuyChonToTuChua,
): Promise<{ html: string; soThieu: number; soBoKhoi: number; soKhongGhi: number; o: Map<string, OGhiToChieu> }> {
  const tra = dungBangTra(toCoNoiDung(dsTo, new Set(ds.filter((c) => c.thieuNoiDung).map((c) => c.khoa))))
  const soGop = tuy.soGop ?? null
  const dong = oChieuTuChua(ds, tuy.ungVien, tuy.soLop)
  const kq = await dungToChieu(dong, tuy.tenBuoi, tra, tuy.maPhien, {
    khoiDich: tuy.khoi ? [tuy.khoi] : [],
    giuTuLuan: true,
    aiSaiCaLop: true,
    thongKe: (qid, cau) => (soGop?.[qid] ? thongKeTuSoGop(cau.phan, soGop[qid], String(cau.dapAn ?? '')) : null),
  })
  // Câu CÓ em nhưng không ghi được (thiếu chuyên đề) — chỉ câu còn trên tờ; câu thiếu nội dung đã được đếm ở `soThieu`.
  const khoiDich = tuy.khoi ? [tuy.khoi] : []
  const thieu = new Set(ds.filter((c) => c.thieuNoiDung).map((c) => c.qid))
  const soKhongGhi = dong.filter((o) => o.sbd && !thieu.has(o.qid) && !cauKhacKhoiLop(o.qid, khoiDich) && !kq.o.get(`${o.sbd}|${o.qid}`)?.chuyenDe).length
  return { ...kq, soKhongGhi }
}
