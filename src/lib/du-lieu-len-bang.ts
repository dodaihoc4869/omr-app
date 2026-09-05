// NỐI DỮ LIỆU MỘT CA VÀO THUẬT TOÁN PHÂN CÔNG LÊN BẢNG.
//
// Thầy chốt 05/09 chiều: BỎ tách ca kiểm tra / ca chẩn đoán. Chỉ còn MỘT loại
// ca, thầy tự tay tích đề. Nên dữ liệu một ca phải gánh cả hai việc:
//
//   1. GỬI PHỤ HUYNH — đã chạy sẵn qua `phieu-du-lieu.ts` (điểm, câu sai,
//      chuyên đề mất điểm). File này KHÔNG đụng vào đường đó.
//   2. PHÂN CÔNG LÊN BẢNG — cần biết EM NÀO SAI CÂU NÀO và SAI GIỐNG NHAU
//      KHÔNG. Đó là việc của file này.
//
// Cả hai đọc CHUNG một nguồn: bản đề CÓ đáp án của ca + đáp án em đã nộp. Không
// sinh thêm bảng dữ liệu nào, không đòi máy chủ thêm lệnh nào.
//
// Vì sao không lấy thẳng ChiTietCau trên máy chủ: bảng đó chỉ có sau khi thầy
// bấm chấm ở màn Theo dõi. Dựng lại tại chỗ từ đáp án thô thì gọi lên bảng chạy
// được ngay khi em vừa nộp, chưa cần chấm.
import type { TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { soSao } from '../data/examContent'
import type { AnswerRecord } from './exam-db'
import { taoChiTietCau } from './chi-tiet-cau'
import { chuanChuyenDe, type BaiLam, type CauChua, type EmGoi, type PhanDe } from './phan-cong'
import type { MucDo } from './goi-len-bang'

/** Bản đề CÓ đáp án của ca. `boTheoEm` chỉ còn để đọc lại ca mở trước 05/09;
 * ca mở từ nay không ghi trường đó nữa. */
export interface BanDeCa {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
  soCau?: { I: number; II: number; III: number }
  boTheoEm?: Record<string, string[]>
}

/** Một lượt thi lấy từ `chiTietCa`. Chỉ giữ đúng những trường dùng tới. */
export interface LuotCa {
  sbd: string
  hoTen: string
  lanThu: number
  trangThai: string
  dapAn: AnswerRecord | null
  giayCau?: Record<string, number> | null
}

/** Hồ sơ tích luỹ của một em (từ `hoSoEm`), rút gọn còn phần dùng để ghép câu. */
export interface HoSoRutGon {
  sbd: string
  hoTen: string
  chuyenDe: { ten: string; soCau: number; soSai: number }[]
}

const PHAN: PhanDe[] = ['I', 'II', 'III']

/** Vài chữ đầu đề bài để thầy nhận ra câu — bỏ vỏ `$\ce{...}$` cho dễ đọc. */
export function tomTatCau(text: string): string {
  return (text || '')
    .replace(/\$\\ce\{([^}]*)\}\$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
}

/** MỌI CÂU CỦA CA → danh sách câu đáng chữa.
 *
 * Lấy HẾT, kể cả câu không em nào làm: câu 2 sao chưa ai chạm vẫn đáng chữa hơn
 * câu 0 sao nửa lớp sai, và `thongKeCau` tự xử lý chỗ đó bằng độ tin cậy. */
export function cauTuBanDe(bank: BanDeCa, dichSo: Partial<Record<PhanDe, number>> = {}): CauChua[] {
  const ra: CauChua[] = []
  for (const phan of PHAN) {
    const ds = phan === 'I' ? bank.phanI : phan === 'II' ? bank.phanII : bank.phanIII
    const dich = dichSo[phan] ?? 0
    ds.forEach((q, i) => {
      ra.push({
        id: q.id,
        phan,
        so: dich + i + 1,
        viTri: i,
        chuyenDe: q.chuyenDe ?? '',
        mucDo: (q.mucDo ?? '') as MucDo | '',
        sao: soSao(q),
        lyDoSao: q.canChua?.ly_do ?? '',
        tomTat: tomTatCau(q.text),
      })
    })
  }
  return ra
}

/** LƯỢT MỚI NHẤT của mỗi em. Em thi lại có nhiều dòng cùng SBD; chữa bài phải
 * nhìn lần làm gần nhất, không nhìn lần đầu em đã được chữa rồi. */
export function luotMoiNhat(luot: LuotCa[]): LuotCa[] {
  const theoSbd = new Map<string, LuotCa>()
  for (const l of luot) {
    const cu = theoSbd.get(l.sbd)
    if (!cu || (Number(l.lanThu) || 1) >= (Number(cu.lanThu) || 1)) theoSbd.set(l.sbd, l)
  }
  return [...theoSbd.values()]
}

/** Lượt có dữ liệu để chấm: đã nộp hoặc bị khoá, và có đáp án. Em đang làm dở
 * KHÔNG tính — đọc bài chưa xong rồi kết luận em sai là oan. */
export function daCoBaiLam(l: LuotCa): boolean {
  return !!l.dapAn && (l.trangThai === 'da_nop' || l.trangThai === 'khoa')
}

/** BÀI LÀM TỪNG CÂU của cả ca — đầu vào của `thongKeCau`/`phanCong`.
 *
 * `chon` giữ nguyên đáp án em chọn theo THỨ TỰ GỐC của đề (đáp án gửi lên đã
 * quy về gốc lúc nộp), nên hai em cùng chọn B là cùng một hiểu nhầm thật, không
 * phải trùng vì xáo phương án. Đó là điều kiện để `doChum` có nghĩa. */
export function baiLamTuCa(bank: BanDeCa, maCa: string, luot: LuotCa[]): BaiLam[] {
  const ra: BaiLam[] = []
  for (const l of luotMoiNhat(luot)) {
    if (!daCoBaiLam(l)) continue
    const rows = taoChiTietCau(bank, maCa, l.sbd, l.dapAn as AnswerRecord, l.giayCau ?? null)
    for (const r of rows) {
      // Câu bỏ trống tính là LÀM SAI, không tính là chưa làm: em đã ngồi trước
      // câu đó và không ra được đáp án — đúng chỗ cần chữa.
      ra.push({ sbd: l.sbd, idCau: r.qid, dung: r.dungSai === true, chon: r.dapAnChon || undefined })
    }
  }
  return ra
}

/** DANH SÁCH EM để phân công.
 *
 * `coMat` mặc định theo việc em có bài trong ca này. Thầy bỏ tích em vắng ở màn
 * hình (em nộp bài ở nhà rồi hôm nay nghỉ), nên `sbdVang` cắt đè lên.
 *
 * `chuyenDe` là hồ sơ TÍCH LUỸ chứ không phải riêng ca này: gọi em lên bảng để
 * vá chỗ hổng lâu ngày, không phải để phạt một ca xui.
 *
 * `daGoiCau`, `daGoiTheoCd`, `soLanLenBang` đếm TRONG BUỔI này. Máy chủ chưa có
 * lệnh trả số lượt lên bảng theo lịch sử, nên không bịa số: buổi mới bắt đầu là
 * 0, mỗi lần bấm phân công lại thì cộng lên. */
export function emTuCa(
  luot: LuotCa[],
  hoSo: Record<string, HoSoRutGon>,
  dsCau: CauChua[],
  daGoiCau: Record<string, string[]> = {},
  sbdVang: Set<string> = new Set(),
): EmGoi[] {
  return luotMoiNhat(luot)
    .filter((l) => daCoBaiLam(l))
    .map((l) => {
      const h = hoSo[l.sbd]
      const daGoi = daGoiCau[l.sbd] ?? []
      return {
        sbd: l.sbd,
        hoTen: h?.hoTen || l.hoTen || '',
        coMat: !sbdVang.has(l.sbd),
        chuyenDe: h?.chuyenDe ?? [],
        daGoiTheoCd: demTheoChuyenDe(daGoi, dsCau),
        daGoiCau: daGoi,
        soLanLenBang: daGoi.length,
      }
    })
    .sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd, 'vi'))
}

/** Số lần em đã được gọi ở từng chuyên đề TRONG BUỔI — để `mucDoNenGoi` nâng
 * bậc khó dần: lần hai khó hơn lần một. Tính từ chính danh sách câu đã gọi. */
export function demTheoChuyenDe(daGoiCau: string[], dsCau: CauChua[]): Record<string, number> {
  const traCd = new Map(dsCau.map((c) => [c.id, chuanChuyenDe(c.chuyenDe)]))
  const ra: Record<string, number> = {}
  for (const id of daGoiCau) {
    const cd = traCd.get(id)
    if (!cd) continue
    ra[cd] = (ra[cd] || 0) + 1
  }
  return ra
}
