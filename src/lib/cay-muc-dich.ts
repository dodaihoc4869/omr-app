// HAI THƯ MỤC MỤC ĐÍCH CỦA KHO (OMNI 3, thầy chốt 05/10 — DAC-TA-BUILD-OMNI-3-0510.md mục 2, prompt-tick-bai-tu-giao.md mục E):
//   · DẠY HỌC  = tờ có thư mục "DẠY HỌC" trong `nhom`, HOẶC mã bắt đầu bằng "DH-" — nguồn của tick bài, game, Thử sức thêm, vé, Trạm hồi phục.
//   · TU LUYỆN = MỌI tờ còn lại — thư mục ẢO suy từ `nhom` (không ghi đè `nhom`, không di chuyển dữ liệu); chỉ Tu luyện và ca kiểm tra.
// `dungCayTheoMucDich` dựng cây chọn đề hai nhánh: "DẠY HỌC" (đúng cây DẠY HỌC của `dungCay`) và "TU LUYỆN" (mọi nhánh khác — cây con y hệt
// `dungCay` dựng cho phần còn lại, khoá đặt thêm tiền tố để không đụng nhau). KHÔNG đổi `dungCay` cũ: bảng Dạy học, Gọi lên bảng vẫn dùng cây cũ.
// Hộp chọn đề của Mở ca kiểm tra và Giao chiến dịch dùng cây này — vẫn chọn được MỌI tờ, chỉ xếp lại theo mục đích.
// Đồng bộ lên máy chủ (`/kho/thu-muc`, ≤ 400 mã/lệnh): `dsThuMucKho` + `chiaLo` — cùng luật với máy chủ (`thuMucTheoMa`: thiếu thư mục ⇒ "DH-" là DẠY HỌC).
// Hàm thuần, có test (`tests/omni-3-thay-cay-muc-dich.test.ts`).
import type { TeacherExamSource } from '../data/examContent'
import { chuongCuaDe, dungCay, khoiCuaDe, KHONG_CAU, thuMucCuaDe, type Nut, type SoCau } from './cay-chon-de'

export const TEN_THU_MUC_DAY_HOC_MUC_DICH = 'DẠY HỌC'
export const TEN_THU_MUC_TU_LUYEN = 'TU LUYỆN'
/** Khoá nút thư mục TU LUYỆN trong cây (hộp chọn đề mở sẵn nút này để thầy thấy ngay các khối như trước). */
export const KHOA_THU_MUC_TU_LUYEN = TEN_THU_MUC_TU_LUYEN
/** Số mã tối đa mỗi lệnh `/kho/thu-muc` (hợp đồng mục B). */
export const LO_THU_MUC = 400

export type ThuMucMucDich = 'DAY_HOC' | 'TU_LUYEN'

const laTenDayHoc = (t: string) => t.normalize('NFC').trim().toUpperCase() === TEN_THU_MUC_DAY_HOC_MUC_DICH
const laMaDayHoc = (maDe: string) => maDe.trim().toUpperCase().startsWith('DH-')

/** Tờ thuộc mục đích DẠY HỌC: thư mục "DẠY HỌC" trong `nhom`, hoặc mã "DH-…" (luật lùi của máy chủ khi chưa đồng bộ). */
export function laDayHocMucDich(s: Pick<TeacherExamSource, 'maDe' | 'nhom'>): boolean {
  return laTenDayHoc(thuMucCuaDe(s)) || laMaDayHoc(s.maDe)
}
export const thuMucMucDich = (s: Pick<TeacherExamSource, 'maDe' | 'nhom'>): ThuMucMucDich => (laDayHocMucDich(s) ? 'DAY_HOC' : 'TU_LUYEN')

/** Bản sao NÔNG của tờ với `nhom` ảo "<khối> · DẠY HỌC/<chương>" — chỉ để dựng cây (mọi tờ DẠY HỌC chung MỘT nút thư mục, kể cả mã "DH-…"
 *  mà `nhom` chưa ghi thư mục, hay ghi thư mục khác hoa/thường). Không sửa tờ gốc. */
function vaoThuMucDayHoc(s: TeacherExamSource): TeacherExamSource {
  const n = (s.nhom || '').trim()
  const i = n.indexOf('·')
  const khoi = i >= 0 ? n.slice(0, i).trim() : khoiCuaDe(s) || (/^DH-(10|11|12)(?!\d)/i.exec(s.maDe.trim())?.[1] ?? '')
  return { ...s, nhom: `${khoi ? `${khoi} · ` : ''}${TEN_THU_MUC_DAY_HOC_MUC_DICH}/${chuongCuaDe(s)}` }
}

const cong = (a: SoCau, b: SoCau): SoCau => ({ I: a.I + b.I, II: a.II + b.II, III: a.III + b.III })

/** Chép lại một nhánh với khoá mang tiền tố (khoá phải duy nhất trong cả cây — dùng làm key React và khoá gập/mở). */
function doiKhoa(n: Nut, tienTo: string): Nut {
  return { ...n, khoa: `${tienTo}/${n.khoa}`, con: n.con.map((c) => doiKhoa(c, tienTo)) }
}

/**
 * Cây chọn đề THEO MỤC ĐÍCH: [DẠY HỌC ▸ khối ▸ chương ▸ bài ▸ dạng] rồi [TU LUYỆN ▸ (thư mục khác ▸) khối ▸ chương ▸ bài ▸ dạng].
 * Nhánh nào không có tờ thì không sinh nút. Thứ tự trong mỗi nhánh giữ đúng thứ tự kho (như `dungCay`).
 */
export function dungCayTheoMucDich(ds: TeacherExamSource[]): Nut[] {
  const dayHoc: TeacherExamSource[] = []
  const khac: TeacherExamSource[] = []
  for (const s of ds) (laDayHocMucDich(s) ? dayHoc : khac).push(s)
  const ra: Nut[] = []
  if (dayHoc.length) ra.push(...dungCay(dayHoc.map(vaoThuMucDayHoc)))
  if (khac.length) {
    const con = dungCay(khac).map((n) => doiKhoa(n, KHOA_THU_MUC_TU_LUYEN))
    ra.push({
      khoa: KHOA_THU_MUC_TU_LUYEN,
      nhan: TEN_THU_MUC_TU_LUYEN,
      tang: 'thumuc',
      con,
      soCau: con.reduce((s, c) => cong(s, c.soCau), KHONG_CAU),
      laMa: con.flatMap((c) => c.laMa),
    })
  }
  return ra
}

/** Một dòng gửi `/kho/thu-muc`. */
export interface DongThuMuc {
  maDe: string
  thuMuc: ThuMucMucDich
}

/** Thư mục mục đích của MỌI tờ trong kho trên máy (mã gốc như kho máy chủ `de_kho`), bỏ mã rỗng/trùng, giữ thứ tự kho. */
export function dsThuMucKho(ds: readonly Pick<TeacherExamSource, 'maDe' | 'nhom'>[]): DongThuMuc[] {
  const daCo = new Set<string>()
  const ra: DongThuMuc[] = []
  for (const s of ds) {
    const maDe = String(s?.maDe ?? '').trim()
    if (!maDe || daCo.has(maDe)) continue
    daCo.add(maDe)
    ra.push({ maDe, thuMuc: thuMucMucDich({ maDe, nhom: s.nhom }) })
  }
  return ra
}

/** Chia danh sách thành các lô ≤ `co` phần tử (giữ thứ tự). `co` < 1 ⇒ coi như 1. */
export function chiaLo<T>(ds: readonly T[], co: number = LO_THU_MUC): T[][] {
  const n = Math.max(1, Math.floor(co))
  const ra: T[][] = []
  for (let i = 0; i < ds.length; i += n) ra.push(ds.slice(i, i + n))
  return ra
}
