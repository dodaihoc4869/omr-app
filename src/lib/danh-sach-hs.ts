// ĐỌC FILE DANH SÁCH HỌC SINH của thầy (xlsx / xls / csv).
//
// Danh sách này là CỔNG VÀO THI: em phải nhập đúng cả ba — số báo danh, họ tên,
// năm sinh — khớp một dòng trong đây mới thi được. Nên bộ đọc phải khắt khe với
// chính nó: dòng nào thiếu một trong ba thì báo ra để thầy sửa file, KHÔNG âm
// thầm bỏ qua rồi để em đứng ngoài phòng thi mà không hiểu vì sao.
//
// Ba cột, tên cột đặt kiểu gì cũng nhận (có dấu, không dấu, hoa thường), và
// không có hàng tiêu đề cũng đọc được — nhận diện theo hình dạng dữ liệu.
import * as XLSX from 'xlsx'

export interface EmTrongDanhSach {
  sbd: string
  hoTen: string
  namSinh: string
}

export interface KetQuaDocDanhSach {
  items: EmTrongDanhSach[]
  /** Dòng bị bỏ vì thiếu dữ liệu — kèm số dòng trong file để thầy mở ra sửa. */
  boQua: { dong: number; vaoSao: string }[]
  /** Số báo danh xuất hiện nhiều lần: giữ dòng đầu, nêu ra để thầy biết. */
  trung: string[]
}

function bo(v: unknown): string {
  return String(v ?? '').trim()
}

function khongDau(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/** Năm sinh về đúng 4 chữ số. Ô Excel có thể là số 2009, là ngày 12/05/2009,
 * hoặc là số sê-ri ngày của Excel (XLSX đã đổi sẵn thành Date khi cellDates). */
export function docNamSinh(v: unknown): string {
  if (v instanceof Date) return String(v.getFullYear())
  const m = bo(v).match(/(19|20)\d{2}/)
  return m ? m[0] : ''
}

const TEN_COT = {
  sbd: ['sbd', 'so bao danh', 'sobaodanh', 'ma hs', 'mahs', 'ma hoc sinh'],
  hoTen: ['ho ten', 'ho va ten', 'hoten', 'ten', 'ten hoc sinh', 'ho ten hoc sinh'],
  namSinh: ['nam sinh', 'namsinh', 'ngay sinh', 'ngaysinh', 'ns', 'sinh'],
}

/** Dò 3 cột từ hàng tiêu đề. Trả về chỉ số cột, -1 nếu không thấy. */
function doCotTheoTieuDe(hang: unknown[]): { sbd: number; hoTen: number; namSinh: number } {
  const kq = { sbd: -1, hoTen: -1, namSinh: -1 }
  hang.forEach((o, i) => {
    const t = khongDau(bo(o))
    if (!t) return
    ;(Object.keys(TEN_COT) as (keyof typeof TEN_COT)[]).forEach((k) => {
      if (kq[k] < 0 && TEN_COT[k].some((alias) => t === alias || t.startsWith(alias))) kq[k] = i
    })
  })
  return kq
}

/** Không có tiêu đề thì đoán theo HÌNH DẠNG: ô toàn chữ số = số báo danh, ô có
 * 4 chữ số năm = năm sinh, ô còn lại nhiều chữ cái nhất = họ tên. */
function doCotTheoHinhDang(hang: unknown[]): { sbd: number; hoTen: number; namSinh: number } {
  const kq = { sbd: -1, hoTen: -1, namSinh: -1 }
  hang.forEach((o, i) => {
    const t = bo(o)
    if (!t) return
    if (kq.namSinh < 0 && (o instanceof Date || /^(19|20)\d{2}$/.test(t) || /\d{1,2}[/-]\d{1,2}[/-](19|20)\d{2}/.test(t))) kq.namSinh = i
    else if (kq.sbd < 0 && /^\d{2,10}$/.test(t)) kq.sbd = i
    else if (kq.hoTen < 0 && /[a-zA-ZÀ-ỹ]{2,}/.test(t)) kq.hoTen = i
  })
  return kq
}

/** Chuyển các hàng thô (từ xlsx hoặc csv) thành danh sách học sinh. */
export function hangToDanhSach(hang: unknown[][]): KetQuaDocDanhSach {
  const items: EmTrongDanhSach[] = []
  const boQua: { dong: number; vaoSao: string }[] = []
  const trung: string[] = []
  const daCo = new Set<string>()

  const khongRong = hang.filter((h) => h.some((o) => bo(o) !== ''))
  if (khongRong.length === 0) return { items, boQua, trung }

  let cot = doCotTheoTieuDe(khongRong[0])
  let batDau = 1
  // Hàng đầu không phải tiêu đề (thiếu cột) → đoán theo hình dạng và đọc từ hàng 0.
  if (cot.sbd < 0 || cot.hoTen < 0 || cot.namSinh < 0) {
    cot = doCotTheoHinhDang(khongRong[0])
    batDau = 0
  }
  if (cot.sbd < 0 || cot.hoTen < 0 || cot.namSinh < 0) {
    throw new Error('Không tìm thấy đủ 3 cột: số báo danh, họ tên, năm sinh. Đặt tên cột cho rõ rồi thử lại.')
  }

  for (let i = batDau; i < khongRong.length; i++) {
    const h = khongRong[i]
    const dong = i + 1
    const sbd = bo(h[cot.sbd]).replace(/\s+/g, '')
    const hoTen = bo(h[cot.hoTen]).replace(/\s+/g, ' ')
    const namSinh = docNamSinh(h[cot.namSinh])
    const thieu: string[] = []
    if (!sbd) thieu.push('số báo danh')
    if (!hoTen) thieu.push('họ tên')
    if (!namSinh) thieu.push('năm sinh')
    if (thieu.length) {
      boQua.push({ dong, vaoSao: `thiếu ${thieu.join(', ')}` })
      continue
    }
    if (daCo.has(sbd)) {
      trung.push(sbd)
      continue
    }
    daCo.add(sbd)
    items.push({ sbd, hoTen, namSinh })
  }
  return { items, boQua, trung }
}

/** Đọc một file thầy chọn (xlsx, xls, csv) thành danh sách học sinh. */
export async function docFileDanhSach(file: File): Promise<KetQuaDocDanhSach> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { cellDates: true })
  const ten = wb.SheetNames[0]
  if (!ten) throw new Error('File không có sheet nào')
  const hang = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[ten], { header: 1, raw: true, defval: '' })
  return hangToDanhSach(hang)
}
