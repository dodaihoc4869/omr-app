// PHÂN TÍCH CÁCH LÀM BÀI — phần "phụ huynh nhắc con cái gì" của phiếu kết quả.
//
// LUẬT CỦA CẢ FILE NÀY: mỗi nhận định phải đứng được bằng CON SỐ ĐO ĐƯỢC lấy từ
// bảng chi tiết câu. Không có số thì không có nhận định — thà im còn hơn đoán
// tính nết học sinh rồi để phụ huynh mắng oan.
//
// Đo được đúng bốn thứ, và chỉ bốn thứ:
//   1. em chọn gì ở từng câu (kể cả bỏ trống),
//   2. mất bao nhiêu giây cho từng câu,
//   3. câu đó thuộc chuyên đề nào, mức độ nào,
//   4. tổng thời gian làm so với thời lượng ca.
// Từ đó suy ra HÀNH VI, không suy ra TÍNH CÁCH: "làm nhanh hơn ở những câu sai"
// là quan sát; "em ẩu" là quy chụp — quy tắc viết của thầy điều 28 cấm.
//
// Không đưa việc rời màn hình vào đây. Máy chỉ đo được tín hiệu rời khỏi màn
// làm bài, một cuộc gọi đến cũng cho đúng tín hiệu đó; việc đó có tin riêng
// (soanTinRoiMan) và phải qua tay thầy.
import type { ChiTietCauRow } from './exam-api'

export type MucDo = 'biet' | 'hieu' | 'van_dung'

export const TEN_MUC_DO: Record<MucDo, string> = {
  biet: 'Nhận biết',
  hieu: 'Thông hiểu',
  van_dung: 'Vận dụng',
}

export const TEN_PHAN: Record<'I' | 'II' | 'III', string> = {
  I: 'Phần I, trắc nghiệm',
  II: 'Phần II, đúng/sai',
  III: 'Phần III, trả lời ngắn',
}

export interface ThongKeLamBai {
  tongCau: number
  soSai: number
  /** Câu em không chọn gì. Phần II tính là bỏ trống khi không tick ý nào. */
  soBoTrong: number
  /** Trung bình giây mỗi câu; null khi ca không đo được thời gian từng câu. */
  giayTB: number | null
  giayCauDungTB: number | null
  giayCauSaiTB: number | null
  /** Câu tốn nhiều giây nhất (chỉ tính khi có số giây). */
  cauLauNhat: { phan: string; soCau: number; giay: number; dung: boolean } | null
  phutDaDung: number | null
  phutChoPhep: number | null
  theoPhan: { phan: 'I' | 'II' | 'III'; tong: number; sai: number }[]
  theoMucDo: { mucDo: MucDo; tong: number; sai: number }[]
}

export interface TinHieuLamBai {
  ma: string
  /** Nhãn ngắn hiện trên phiếu. Mô tả hành vi, không gán tính cách. */
  nhan: string
  /** Câu nêu ĐÚNG con số làm căn cứ — phụ huynh đọc là kiểm được. */
  soLieu: string
  /** Việc phụ huynh nhắc con, phải là hành vi làm được ngay. */
  loiKhuyen: string
}

/** Câu bỏ trống: Phần I và III là chuỗi rỗng, Phần II là bốn dấu gạch. */
export function boTrong(r: Pick<ChiTietCauRow, 'phan' | 'dapAnChon'>): boolean {
  const s = (r.dapAnChon || '').trim()
  if (!s) return true
  if (r.phan === 'II') return /^-{1,4}$/.test(s)
  return false
}

function tb(xs: number[]): number | null {
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null
}

export function thongKeLamBai(
  rows: ChiTietCauRow[],
  ca?: { vaoLuc?: string | null; nopLuc?: string | null; thoiLuongPhut?: number | null },
): ThongKeLamBai {
  const coGiay = rows.filter((r) => typeof r.giay === 'number' && (r.giay as number) > 0) as (ChiTietCauRow & { giay: number })[]
  const lau = coGiay.length ? coGiay.reduce((a, b) => (b.giay > a.giay ? b : a)) : null

  const phan: ('I' | 'II' | 'III')[] = ['I', 'II', 'III']
  const mucDo: MucDo[] = ['biet', 'hieu', 'van_dung']

  let phut: number | null = null
  if (ca?.vaoLuc && ca?.nopLuc) {
    const a = new Date(ca.vaoLuc).getTime()
    const b = new Date(ca.nopLuc).getTime()
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) phut = Math.round((b - a) / 60000)
  }

  return {
    tongCau: rows.length,
    soSai: rows.filter((r) => !r.dungSai).length,
    soBoTrong: rows.filter((r) => boTrong(r)).length,
    giayTB: tb(coGiay.map((r) => r.giay)),
    giayCauDungTB: tb(coGiay.filter((r) => r.dungSai).map((r) => r.giay)),
    giayCauSaiTB: tb(coGiay.filter((r) => !r.dungSai).map((r) => r.giay)),
    cauLauNhat: lau ? { phan: lau.phan, soCau: lau.soCau, giay: lau.giay, dung: Boolean(lau.dungSai) } : null,
    phutDaDung: phut,
    phutChoPhep: ca?.thoiLuongPhut ?? null,
    theoPhan: phan
      .map((p) => ({ phan: p, tong: rows.filter((r) => r.phan === p).length, sai: rows.filter((r) => r.phan === p && !r.dungSai).length }))
      .filter((x) => x.tong > 0),
    theoMucDo: mucDo
      .map((m) => ({ mucDo: m, tong: rows.filter((r) => r.mucDo === m).length, sai: rows.filter((r) => r.mucDo === m && !r.dungSai).length }))
      .filter((x) => x.tong > 0),
  }
}

function tiLe(sai: number, tong: number): number {
  return tong > 0 ? sai / tong : 0
}

function phanTram(sai: number, tong: number): string {
  return `${Math.round(tiLe(sai, tong) * 100)}%`
}

/**
 * Suy ra tín hiệu về cách làm bài. Mỗi tín hiệu chỉ bật khi có ĐỦ DỮ LIỆU cho
 * nó — thiếu thì không bật, không hạ ngưỡng để "có cái mà nói".
 *
 * Ngưỡng chọn theo cỡ một ca thật (28 câu, 45 phút), ghi thẳng ở đây để lần sau
 * đọc là biết vì sao chứ không phải số rơi từ trên trời.
 */
export function tinHieuLamBai(tk: ThongKeLamBai): TinHieuLamBai[] {
  const ra: TinHieuLamBai[] = []
  if (tk.tongCau === 0) return ra

  // 1. BỎ TRỐNG — chắc chắn 0 điểm, và là thứ sửa được ngay trong buổi sau.
  if (tk.soBoTrong > 0) {
    ra.push({
      ma: 'bo_trong',
      nhan: 'Bỏ trống câu',
      soLieu: `Em không điền gì ở ${tk.soBoTrong}/${tk.tongCau} câu.`,
      loiKhuyen: 'Nhắc em: còn 5 phút cuối thì quay lại điền hết những câu bỏ trống. Điền sai vẫn có cơ hội đúng, bỏ trống chắc chắn 0 điểm.',
    })
  }

  // 2. LÀM NHANH HƠN Ở NHỮNG CÂU SAI — dấu hiệu đọc lướt, đo bằng giây/câu.
  //    Cần ít nhất 3 câu sai có số giây để trung bình không phải là một câu cá biệt.
  const soSaiCoGiay = tk.giayCauSaiTB !== null ? tk.soSai : 0
  if (tk.giayCauSaiTB !== null && tk.giayCauDungTB !== null && soSaiCoGiay >= 3 && tk.giayCauSaiTB < tk.giayCauDungTB * 0.6) {
    ra.push({
      ma: 'nhanh_o_cau_sai',
      nhan: 'Làm nhanh hơn ở những câu sai',
      soLieu: `Trung bình ${tk.giayCauSaiTB} giây cho một câu sai, so với ${tk.giayCauDungTB} giây cho một câu đúng.`,
      loiKhuyen: 'Nhắc em đọc lại đề một lượt trước khi tô đáp án, nhất là câu thấy quen. Câu quen là câu dễ đọc lướt nhất.',
    })
  }

  // 3. DỪNG QUÁ LÂU Ở MỘT CÂU rồi vẫn sai — mất thời gian của những câu khác.
  if (tk.cauLauNhat && tk.giayTB !== null && !tk.cauLauNhat.dung && tk.cauLauNhat.giay >= tk.giayTB * 3 && tk.cauLauNhat.giay >= 90) {
    ra.push({
      ma: 'dung_lau_mot_cau',
      nhan: 'Dừng quá lâu ở một câu',
      soLieu: `${TEN_PHAN[tk.cauLauNhat.phan as 'I' | 'II' | 'III'] ?? tk.cauLauNhat.phan} câu ${tk.cauLauNhat.soCau} tốn ${tk.cauLauNhat.giay} giây, gấp hơn 3 lần trung bình ${tk.giayTB} giây, và vẫn sai.`,
      loiKhuyen: 'Nhắc em: một câu quá 2 phút chưa ra hướng thì bỏ qua, làm hết đề rồi quay lại. Ngồi lì một câu là mất luôn mấy câu dễ ở sau.',
    })
  }

  // 4. HỔNG NỀN vs 5. HỤT VẬN DỤNG — hai chuyện khác hẳn nhau, chữa khác nhau.
  const nen = tk.theoMucDo.find((m) => m.mucDo === 'biet')
  const vd = tk.theoMucDo.find((m) => m.mucDo === 'van_dung')
  if (nen && nen.tong >= 3 && tiLe(nen.sai, nen.tong) >= 0.4) {
    ra.push({
      ma: 'hong_nen',
      nhan: 'Hổng ở câu nhận biết',
      soLieu: `Sai ${nen.sai}/${nen.tong} câu mức nhận biết (${phanTram(nen.sai, nen.tong)}).`,
      loiKhuyen: 'Câu nhận biết sai là hổng phần định nghĩa và công thức. Nhắc em học lại lý thuyết của chuyên đề bên dưới trước, rồi mới làm bài tập.',
    })
  } else if (vd && vd.tong >= 3 && tiLe(vd.sai, vd.tong) >= 0.6 && (!nen || tiLe(nen.sai, nen.tong) < 0.25)) {
    ra.push({
      ma: 'hut_van_dung',
      nhan: 'Chắc nền, hụt ở câu vận dụng',
      soLieu: `Sai ${vd.sai}/${vd.tong} câu mức vận dụng, trong khi câu nhận biết chỉ sai ${nen ? `${nen.sai}/${nen.tong}` : '0'}.`,
      loiKhuyen: 'Em không thiếu kiến thức, em thiếu số lần luyện dạng. Nhắc em làm đủ bài tập Thầy giao thay vì đọc lại lý thuyết.',
    })
  }

  // 6. NỘP SỚM mà còn sai nhiều — thời gian còn mà không dùng để soát.
  if (tk.phutDaDung !== null && tk.phutChoPhep !== null && tk.phutChoPhep > 0 && tk.phutDaDung < tk.phutChoPhep * 0.6 && tk.soSai >= 3) {
    ra.push({
      ma: 'nop_som',
      nhan: 'Nộp sớm khi còn nhiều câu sai',
      soLieu: `Em làm ${tk.phutDaDung} phút trên ${tk.phutChoPhep} phút được phép, còn sai ${tk.soSai} câu.`,
      loiKhuyen: 'Nhắc em ngồi hết giờ và soát lại từ câu đầu. Nộp sớm không được cộng điểm nào.',
    })
  }

  // 7. PHẦN NÀO SAI DỒN — nói đúng chỗ để luyện, chỉ nêu khi lệch hẳn.
  const nang = [...tk.theoPhan].filter((p) => p.tong >= 3).sort((a, b) => tiLe(b.sai, b.tong) - tiLe(a.sai, a.tong))[0]
  if (nang && tiLe(nang.sai, nang.tong) >= 0.5 && nang.sai >= 2 && tk.theoPhan.length > 1) {
    ra.push({
      ma: 'lech_mot_phan',
      nhan: `Mất điểm dồn vào ${TEN_PHAN[nang.phan]}`,
      soLieu: `Sai ${nang.sai}/${nang.tong} câu ở ${TEN_PHAN[nang.phan]} (${phanTram(nang.sai, nang.tong)}).`,
      loiKhuyen:
        nang.phan === 'III'
          ? 'Phần trả lời ngắn sai thường do tính toán và đơn vị. Nhắc em viết ra từng bước rồi mới điền số, đừng nhẩm.'
          : 'Nhắc em luyện riêng dạng câu của phần này, mỗi ngày 5 câu, thay vì làm dàn đều cả đề.',
    })
  }

  // Không có tín hiệu nào: NÓI THẲNG là không thấy gì bất thường, đừng nặn ra
  // một lời khuyên chung chung cho có.
  if (ra.length === 0) {
    ra.push({
      ma: 'deu_tay',
      nhan: 'Cách làm bài đều tay',
      soLieu: `Sai ${tk.soSai}/${tk.tongCau} câu, không có câu bỏ trống, thời gian phân bổ đều giữa các câu.`,
      loiKhuyen: 'Không có gì về cách làm bài cần chỉnh. Chỗ cần chữa là kiến thức của các chuyên đề bên dưới.',
    })
  }

  return ra
}

/** ĐÚC KẾT KIẾN THỨC để em chép vào sổ.
 *
 * Lấy nguyên câu `chot` trong lời giải của KHO ĐỀ — mỗi câu chốt đúng một ý
 * kiến thức quyết định, dưới 20 từ, do chính pipeline nạp đề viết ra và thầy đã
 * duyệt. KHÔNG tự viết thêm câu nào: chữ trong sổ của em phải là chữ đúng.
 * Gom theo chuyên đề, bỏ ý trùng. */
export function ducKetKienThuc(cauSai: { chuyenDe: string; chot: string }[]): { chuyenDe: string; y: string[] }[] {
  const nhom = new Map<string, string[]>()
  for (const c of cauSai) {
    const chot = (c.chot || '').trim()
    if (!chot) continue
    const ten = (c.chuyenDe || '').trim() || 'Chưa phân loại chuyên đề'
    const ds = nhom.get(ten) ?? []
    const khoa = chot.toLowerCase().replace(/\s+/g, ' ')
    if (!ds.some((x) => x.toLowerCase().replace(/\s+/g, ' ') === khoa)) ds.push(chot)
    nhom.set(ten, ds)
  }
  return [...nhom.entries()].map(([chuyenDe, y]) => ({ chuyenDe, y })).sort((a, b) => b.y.length - a.y.length)
}
