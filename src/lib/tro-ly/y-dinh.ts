// TRỢ LÝ TRONG APP — TẦNG HIỂU CÂU HỎI (TRO-LY-TRONG-APP.md, luồng bước 2).
//
// MỘT NGUỒN SỰ THẬT cho mọi chuỗi nhận dạng: cấm rải từ khoá trong component.
// Tầng này THUẦN — không đụng mạng, không đụng IndexedDB — nên kiểm bằng test
// được, và sai ở đâu thì biết ngay là sai ở hiểu hay sai ở tra.
//
// LUẬT LỚN NHẤT: KHÔNG ĐOÁN. Câu nào không khớp chắc chắn thì trả `khong_hieu`
// để tầng dựng nói thẳng "chưa hiểu", chứ không đoán bừa rồi in ra một con số
// của việc khác — thầy đang đứng lớp, một con số sai còn tệ hơn không có số.

/** Loại việc thầy đang hỏi. */
export type LoaiYDinh =
  | 'ca_dang_mo'
  | 'ca_gan_day'
  | 'ca_chua_nop'
  | 'ca_diem'
  | 'em_ho_so'
  | 'em_diem_thap'
  | 'kho_tong_quan'
  | 'kho_theo_chuyen_de'
  | 'kho_nghi_dap_an'
  | 'hoi_bai'
  | 'tin_nhan'
  | 'huong_dan'
  | 'khong_hieu'

export interface YDinh {
  loai: LoaiYDinh
  /** Mã ca thầy nhắc trong câu (nếu có). */
  maCa?: string
  /** Tên em hoặc số báo danh. */
  em?: string
  /** Tên chuyên đề hoặc từ khoá chuyên đề. */
  chuyenDe?: string
  /** Ngưỡng điểm trong câu "ai dưới 5 điểm". */
  nguongDiem?: number
  /** Khoá mục hướng dẫn. */
  muc?: string
}

/** Bỏ dấu, thường hoá, gom khoảng trắng. Thầy gõ nhanh trên điện thoại nên
 * phải nhận cả "ca nao dang mo" lẫn "Ca nào đang mở?". */
export function chuanHoaHoi(raw: string): string {
  return String(raw ?? '')
    .normalize('NFC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    // GIỮ dấu thập phân giữa hai chữ số: "duoi 6.5 diem" mà xoá dấu chấm thì
    // thành "6 5", đọc ngưỡng ra 6 — sai hẳn con số thầy hỏi.
    .replace(/(\d)[.,](\d)/g, '$1<>$2')
    .replace(/[?!.,;:]/g, ' ')
    .replace(/<>/g, '.')
    .replace(/\s+/g, ' ')
    .trim()
}

const co = (s: string, ...tu: string[]) => tu.some((t) => s.includes(t))

/** Mã ca là chuỗi 4–12 ký tự chữ HOA hoặc số trong câu gốc (chưa bỏ dấu).
 * Đọc từ câu GỐC vì mã ca phân biệt hoa thường, mà bước chuẩn hoá đã hạ hết. */
export function docMaCa(raw: string): string | undefined {
  const m = String(raw ?? '').match(/\b([A-Z0-9][A-Z0-9-]{3,11})\b/)
  if (!m) return undefined
  // Toàn số 1–3 chữ số thì là con số trong câu, không phải mã ca.
  if (/^\d{1,3}$/.test(m[1])) return undefined
  return m[1]
}

/** Số báo danh: dãy 5–8 chữ số. */
function docSbd(raw: string): string | undefined {
  const m = String(raw ?? '').match(/\b(\d{5,8})\b/)
  return m ? m[1] : undefined
}

/** Tên em sau chữ "em" / "học sinh" / "hs". Lấy từ câu GỐC để giữ dấu. */
function docTenEm(raw: string): string | undefined {
  const m = String(raw ?? '').match(/(?:\bem|\bhọc sinh|\bhs)\s+([\p{L}][\p{L}\s]{1,30}?)(?=\s+(?:điểm|diem|thế|the|ra sao|yếu|yeu|làm|lam|học|hoc|có|co)\b|[?.,]|$)/iu)
  if (!m) return undefined
  const ten = m[1].trim()
  // "em nào", "em đó" không phải tên.
  if (/^(nao|nào|do|đó|ay|ấy|gi|gì|nay|này)$/i.test(ten)) return undefined
  return ten
}

const NGUONG_MAC_DINH = 5

function docNguong(s: string): number {
  const m = s.match(/(?:duoi|tren)\s*(\d{1,2}(?:\.\d)?)/)
  if (!m) return NGUONG_MAC_DINH
  const v = Number(m[1].replace(',', '.'))
  return isFinite(v) ? v : NGUONG_MAC_DINH
}

/** Bảng chuyên đề: từ khoá ngắn thầy hay gõ → tên chuẩn trong kho. Dùng đúng
 * danh sách chuẩn của chương trình 2018, lệch một chữ là thành chuyên đề khác. */
export const TU_KHOA_CHUYEN_DE: { tu: string[]; ten: string }[] = [
  { tu: ['ester', 'este', 'lipid', 'chat beo', 'xa phong'], ten: 'Ester – lipid' },
  { tu: ['carbohydrate', 'glucose', 'saccharose', 'tinh bot', 'cellulose'], ten: 'Carbohydrate' },
  { tu: ['nitrogen', 'amine', 'amino acid', 'peptide', 'protein', 'chua n'], ten: 'Hợp chất chứa nitrogen' },
  { tu: ['polymer', 'chat deo', 'cao su'], ten: 'Polymer' },
  { tu: ['dien phan', 'pin dien', 'an mon'], ten: 'Pin điện và điện phân' },
  { tu: ['dai cuong kim loai', 'kim loai chung'], ten: 'Đại cương kim loại' },
  { tu: ['nhom ia', 'nhom iia', 'kiem tho', 'nuoc cung'], ten: 'Kim loại nhóm IA, IIA' },
  { tu: ['phuc chat', 'chuyen tiep'], ten: 'Sơ lược dãy kim loại chuyển tiếp thứ nhất và phức chất' },
  { tu: ['can bang hoa hoc', 'can bang'], ten: 'Cân bằng hoá học' },
  { tu: ['nitrogen sulfur', 'sulfur'], ten: 'Nitrogen – sulfur' },
  { tu: ['hydrocarbon'], ten: 'Hydrocarbon' },
  { tu: ['alcohol', 'phenol', 'dan xuat halogen'], ten: 'Dẫn xuất halogen – alcohol – phenol' },
  { tu: ['carbonyl', 'carboxylic'], ten: 'Hợp chất carbonyl – carboxylic acid' },
  { tu: ['cau tao nguyen tu'], ten: 'Cấu tạo nguyên tử' },
  { tu: ['bang tuan hoan'], ten: 'Bảng tuần hoàn' },
  { tu: ['lien ket hoa hoc', 'lien ket'], ten: 'Liên kết hoá học' },
  { tu: ['oxi hoa khu', 'oxh khu'], ten: 'Phản ứng oxi hoá – khử' },
  { tu: ['nang luong hoa hoc'], ten: 'Năng lượng hoá học' },
  { tu: ['toc do phan ung', 'toc do'], ten: 'Tốc độ phản ứng' },
  { tu: ['halogen'], ten: 'Halogen' },
]

export function docChuyenDe(s: string): string | undefined {
  // Từ khoá DÀI khớp trước: "can bang hoa hoc" phải thắng "can bang".
  const phang = TU_KHOA_CHUYEN_DE.flatMap((c) => c.tu.map((t) => ({ t, ten: c.ten }))).sort((a, b) => b.t.length - a.t.length)
  for (const { t, ten } of phang) if (s.includes(t)) return ten
  return undefined
}

/** Mục hướng dẫn dùng app. Trả về khoá, nội dung nằm ở `tra-loi.ts`. */
const HUONG_DAN: { tu: string[]; muc: string }[] = [
  { tu: ['van tay', 'face id', 'khuon mat'], muc: 'van_tay' },
  { tu: ['mat khau', 'khoa app', 'mo app'], muc: 'mat_khau' },
  { tu: ['mo ca', 'tao ca', 'phat ma ca'], muc: 'mo_ca' },
  { tu: ['nap de', 'them de', 'day de'], muc: 'nap_de' },
  { tu: ['goi len bang'], muc: 'len_bang' },
  { tu: ['gui zalo', 'gui phu huynh', 'gui bao cao'], muc: 'gui_phieu' },
  { tu: ['xuat bang diem', 'xuat excel', 'bang diem'], muc: 'bang_diem' },
]

/** Đọc câu hỏi của thầy ra ý định. */
export function docYDinh(raw: string): YDinh {
  const goc = String(raw ?? '')
  const s = chuanHoaHoi(goc)
  if (!s) return { loai: 'khong_hieu' }

  const maCa = docMaCa(goc)
  // "ca" phải là MỘT TỪ. Dùng `includes('ca ')` thì "hôm nay có mấy ca" (chữ ca
  // ở cuối, không có dấu cách sau) lọt lưới, mà "cách làm" lại bị nhận nhầm.
  const laHoiCa = /\bca\b/.test(s) || !!maCa

  // HƯỚNG DẪN đứng trước mọi luật khác: "mở ca thế nào" là hỏi cách làm, không
  // phải hỏi danh sách ca.
  if (co(s, 'the nao', 'lam sao', 'cach ', 'o dau', 'huong dan', 'chi minh', 'bam vao dau')) {
    for (const h of HUONG_DAN) if (co(s, ...h.tu)) return { loai: 'huong_dan', muc: h.muc }
  }

  // HỌC SINH HỎI
  if (co(s, 'cho thay chua', 'cho chua', 'chua chua', 'hoi bai', 'hoc sinh hoi', 'em hoi')) {
    return { loai: 'hoi_bai' }
  }

  // TIN NHẮN
  if (co(s, 'tin nhan', 'nhan tin', 'phu huynh nhan')) return { loai: 'tin_nhan' }

  // KHO ĐỀ
  if (co(s, 'kho de', 'ngan hang', 'bao nhieu de', 'bao nhieu cau')) {
    if (co(s, 'nghi dap an', 'dap an sai', 'can duyet', 'cho duyet')) return { loai: 'kho_nghi_dap_an' }
    const cd = docChuyenDe(s)
    if (cd) return { loai: 'kho_theo_chuyen_de', chuyenDe: cd }
    return { loai: 'kho_tong_quan' }
  }
  if (co(s, 'nghi dap an', 'dap an sai')) return { loai: 'kho_nghi_dap_an' }
  if (co(s, 'de nao') && docChuyenDe(s)) return { loai: 'kho_theo_chuyen_de', chuyenDe: docChuyenDe(s) }

  // ĐIỂM THẤP CẢ LỚP — đứng TRƯỚC hồ sơ một em: "ai dưới 5" không có tên em.
  if (co(s, 'ai duoi', 'em nao duoi', 'duoi diem', 'diem thap', 'ai truot', 'em nao yeu')) {
    return { loai: 'em_diem_thap', nguongDiem: docNguong(s) }
  }

  // MỘT EM
  const sbd = docSbd(goc)
  const tenEm = docTenEm(goc)
  if ((sbd || tenEm) && co(s, 'diem', 'the nao', 'ra sao', 'yeu', 'ho so', 'hoc hanh', 'lam bai', 'tien bo')) {
    return { loai: 'em_ho_so', em: sbd || tenEm }
  }

  // CA THI. CHỈ vào đây khi trong câu CÓ chữ "ca" hoặc có mã ca — "hôm nay
  // trời mưa không" cũng có "hôm nay", vào đây là trả ra danh sách ca, tức là
  // đoán bừa đúng cái luật cấm.
  if (laHoiCa) {
    if (co(s, 'chua nop', 'ai vang', 'chua lam', 'con ai')) return { loai: 'ca_chua_nop', maCa }
    if (co(s, 'diem', 'cao nhat', 'thap nhat', 'trung binh', 'ket qua')) return { loai: 'ca_diem', maCa }
    // Nhiều cách hỏi cùng một việc: "đang mở", "còn ca nào mở không", "ca nào
    // mở". Không gom đủ thì câu thứ ba rơi xuống luật danh sách ca ở dưới.
    if (co(s, 'dang mo', 'con mo', 'mo chua', 'nao mo', 'mo khong', 'dang chay')) return { loai: 'ca_dang_mo' }
    if (co(s, 'hom nay', 'gan day', 'moi nhat', 'may ca', 'bao nhieu ca', 'danh sach ca')) return { loai: 'ca_gan_day' }
    if (maCa) return { loai: 'ca_diem', maCa }
  }

  // Hỏi trống kiểu "ca nào" mà không rõ hỏi gì -> vẫn cho danh sách ca gần đây.
  if (co(s, 'ca nao')) return { loai: 'ca_gan_day' }

  return { loai: 'khong_hieu' }
}

/** Câu gợi ý hiện lần đầu mở trợ lý, và hiện lại khi không hiểu câu hỏi. */
export const CAU_GOI_Y = [
  'Ca nào đang mở?',
  'Ca nào có em chờ Thầy chữa?',
  'Kho có bao nhiêu câu?',
  'Ai dưới 5 điểm?',
]
