// Thẻ giải nghĩa khi chạm một vùng của «Chạm để hiểu đề» (thầy chốt build 26/10). Hàm thuần, từ điển trên máy.
// Không bao giờ đọc đáp án / lời giải; không tính hộ số của đề (chỉ đọc lại số đề cho, và M do máy tính từ công thức).
import type { TheGiaiNghia, VungCham } from './kieu'
import { cachTinhM, chuanCongThuc, dangDep, soViet, tachDienTich, tinhM, traCongThuc, traTen, type BangNtk, type Chat } from './tu-dien-chat'
import { theDonVi } from './tu-dien-don-vi'
import { theThenChot } from './tu-then-chot'

/** Thẻ có thêm vài trường cho giao diện (vẫn gán được vào `TheGiaiNghia`). */
export type TheGiaiNghiaDu = TheGiaiNghia & {
  loai?: string // nhãn loại chất: «Base mạnh», «Ester»… (viên thuốc góc phải thẻ)
  cachTinhM?: string // «Na = 23, O = 16, H = 1 (23 + 16 + 1 = 40)»
  congThucChat?: string // công thức đẹp (chỉ số dưới Unicode) khi thẻ mở từ TÊN chất
  tenIupac?: string // tên IUPAC khi thẻ mở từ CÔNG THỨC
  ungVien?: string[] // công thức ứng với nhiều chất (C6H12O6: glucose, fructose)
}

/** «natri hiđroxit (xút ăn da)»: bỏ tên ngắn đã nằm trong tên dài hơn («xút» trong «xút ăn da»). */
function noiTenCu(vao: string[]): string | undefined {
  const ds = vao.filter((t, i) => !vao.some((u, j) => j !== i && u.startsWith(t + ' ')))
  return ds.length ? ds[0] + (ds.length > 1 ? ` (${ds.slice(1).join(', ')})` : '') : undefined
}

function dongM(ct: string, ntk?: BangNtk): { M?: number; cach?: string } {
  const M = tinhM(ct, ntk)
  const cach = cachTinhM(ct, ntk)
  return M === null ? {} : { M, cach: cach ?? undefined }
}

/** Thẻ khi chạm TÊN chất (ethyl acetate, natri hiđroxit…). */
function theTheoTen(c: Chat, ntk?: BangNtk): TheGiaiNghiaDu {
  const the: TheGiaiNghiaDu = { ten: c.ten, nhan: 'Chất', doan: [], loai: c.loai }
  const cu = noiTenCu(c.tenCu.filter((t) => t.toLowerCase() !== c.ten.toLowerCase()))
  if (cu) the.tenCu = cu
  if (c.congThuc) {
    const { M, cach } = dongM(c.congThuc, ntk)
    const dep = dangDep(c.congThuc)
    the.congThucChat = dep
    const polyme = /\)n$/.test(c.congThuc)
    if (M !== undefined) {
      the.M = M
      the.doan.push(`${dep} · ${polyme ? 'M một mắt xích' : 'M'} = ${soViet(M)} g/mol`)
      if (cach) { the.cachTinhM = cach; the.doan.push(`M tính từ nguyên tử khối ${cach}`) }
    } else the.doan.push(dep)
  } else the.doan.push(`${c.loai}: chất có mạch rất dài, không viết công thức ngắn.`)
  return the
}

/** Thẻ khi chạm CÔNG THỨC (NaOH, SO₄²⁻, C₆H₁₂O₆…). */
function theTheoCongThuc(khoa: string, ntk?: BangNtk): TheGiaiNghiaDu | null {
  const k = chuanCongThuc(khoa)
  const ds = traCongThuc(k)
  const { goc, dienTich } = tachDienTich(k)
  const dep = ds.length === 1 && ds[0].congThuc ? dangDep(ds[0].congThuc) : dangDep(dienTich ? `${goc} ${dienTich}` : goc)
  const { M, cach } = dongM(k, ntk)
  if (M === undefined && !ds.length) return null
  const the: TheGiaiNghiaDu = { ten: dep, nhan: 'Công thức', doan: [] }
  if (ds.length === 1) {
    const c = ds[0]
    the.loai = c.loai
    the.tenIupac = c.ten
    the.doan.push(c.ten)
    const cu = noiTenCu(c.tenCu.filter((t) => t.toLowerCase() !== c.ten.toLowerCase()))
    if (cu) the.tenCu = cu
  } else if (ds.length > 1) {
    the.ungVien = ds.map((c) => c.ten)
    if (ds.every((c) => c.loai === ds[0].loai)) the.loai = ds[0].loai
    the.doan.push(`Công thức này ứng với nhiều chất: ${the.ungVien.join(', ')}. Đọc đề để biết là chất nào.`)
  } else the.doan.push('Chưa có tên chất này trong từ điển của app.')
  if (M !== undefined) {
    the.M = M
    if (cach) { the.cachTinhM = cach; the.doan.push(cach) }
    if (/\)n$/.test(goc)) the.doan.push('M ở đây là của một mắt xích.')
  }
  return the
}

const NGHIA_BIEN: Record<string, string> = { m: 'khối lượng (gam)', V: 'thể tích (lít)', a: '', x: '', y: '' }
const MUA = 'Bắt đầu từ cuối: muốn mua được thứ đề hỏi thì cần tiền (số mol) của chất nào?'

/** Thẻ khi chạm vùng ĐỀ HỎI. */
function theDeHoi(v: VungCham): TheGiaiNghiaDu {
  const chu = v.chu.trim()
  const thuong = chu.toLowerCase()
  if (v.khoa === 'phu-dinh') {
    return thuong.includes('không phải')
      ? { ten: 'Đề hỏi điều KHÔNG phải', nhan: 'Đề hỏi', doan: ['Ba phương án đúng với ý câu hỏi; em tìm phương án KHÔNG phải.', 'Bẫy hay gặp: đọc nhanh rồi chọn phương án đúng đầu tiên.'] }
      : { ten: 'Đề hỏi phát biểu SAI', nhan: 'Đề hỏi', doan: ['Đọc từng phương án và tự hỏi «đúng hay sai?». Phương án sai là đáp án; ba phương án còn lại đều đúng.', 'Bẫy hay gặp: đọc nhanh rồi chọn phương án đúng đầu tiên.'] }
  }
  if (v.khoa === 'phu-dinh-dem') {
    return thuong.includes('không phải')
      ? { ten: 'Đề hỏi đếm cái KHÔNG phải', nhan: 'Đề hỏi', doan: ['Xét lần lượt từng ý (từng chất), đánh dấu cái KHÔNG phải rồi mới đếm.', 'Bẫy hay gặp: đếm nhầm sang những cái đúng.'] }
      : { ten: 'Đề hỏi đếm ý SAI', nhan: 'Đề hỏi', doan: ['Xét lần lượt từng ý, đánh dấu đúng hay sai rồi đếm số ý sai.', 'Bẫy hay gặp: đếm nhầm sang số ý đúng.'] }
  }
  if (v.khoa === 'phu-dinh-chung') {
    return { ten: 'Đề hỏi điều SAI', nhan: 'Đề hỏi', doan: ['Đọc từng ý và tự hỏi «đúng hay sai?».', 'Bẫy hay gặp: đọc nhanh, bỏ sót chữ «không», «sai».'] }
  }
  if (v.khoa === 'nao-sau-day') {
    return { ten: 'Đề hỏi chọn một phương án', nhan: 'Đề hỏi', doan: [`«${chu}»: chỉ một phương án hợp với câu hỏi.`, 'Với từng phương án, tự hỏi «có đúng ý đề không?», gạch phương án chắc chắn không hợp.'] }
  }
  if (v.khoa === 'gia-tri') {
    const bien = /giá trị\s+(?:gần nhất\s+)?(?:của\s+)?([a-zA-Z])(?![\p{L}\p{N}])/iu.exec(chu)?.[1]
    const nghia = bien ? NGHIA_BIEN[bien] : undefined
    const doan = [nghia ? `${bien} là ${nghia}: đó là thứ em cần tìm.` : `«${chu}»: đó là thứ em cần tìm.`]
    if (bien) doan.push(`Đọc ngược lên trong đề: ${bien} gắn với chất nào?`)
    doan.push(MUA)
    return { ten: bien ? `Đề hỏi giá trị của ${bien}` : 'Đề hỏi', nhan: 'Đề hỏi', doan }
  }
  const dem = /^số\s/u.test(thuong) && !/^số (mol|gam)/u.test(thuong)
  if (dem) return { ten: 'Đề hỏi đếm', nhan: 'Đề hỏi', doan: [`«${chu}»: xét lần lượt từng ý, đánh dấu đúng hay sai rồi mới đếm.`] }
  const tinh = v.khoa === 'tinh' || /khối lượng|thể tích|nồng độ|số mol|số gam|hiệu suất|phần trăm|bao nhiêu|giá trị|tính/u.test(thuong)
  return { ten: v.khoa === 'tinh' ? 'Đề yêu cầu tính' : 'Đề hỏi', nhan: 'Đề hỏi', doan: tinh ? [`«${chu}»: đó là thứ em cần tìm.`, MUA] : [`«${chu}»: đó là điều đề hỏi. Đọc kỹ từng ý rồi mới trả lời.`] }
}

/**
 * Thẻ giải nghĩa cho một vùng chạm. Không có trong từ điển ⇒ null (giao diện không mở thẻ).
 * `ntk`: nguyên tử khối đề cho (từ `docNguyenTuKhoiTrongDe(chuDe).bang`), có thì M tính theo số của đề.
 */
export function theCho(vung: VungCham, ntk?: BangNtk): TheGiaiNghiaDu | null {
  switch (vung.loai) {
    case 'cho': return vung.khoa ? theDonVi(vung.khoa, vung.chu) : null
    case 'khoa': return vung.khoa ? theThenChot(vung.khoa, vung.chu) : null
    case 'hoi': return theDeHoi(vung)
    case 'chat': {
      const theoTen = traTen(vung.chu)
      if (theoTen) return theTheoTen(theoTen, ntk)
      return theTheoCongThuc(vung.khoa ?? vung.chu, ntk)
    }
  }
}
