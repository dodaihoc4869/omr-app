// NĂM SINH ĐỌC TỪ TÊN CA — một nguồn sự thật cho cả cây thư mục lẫn phạm vi quét.
//
// Thầy đặt tên ca LUÔN để năm sinh ở đầu: "2009 - Lớp 1 - L2", "2011 - Lớp 1 - L1".
// Đó là quy ước có sẵn trong dữ liệu, nên không thêm cột nào lên máy chủ và ca
// cũ cũng vào đúng thư mục ngay — không phải sửa tay ca nào.
//
// VÌ SAO NÓ QUAN TRỌNG HƠN MỘT CÁI THƯ MỤC.
//
// Đường rút câu sai (`docCacCaTruoc`) trước nay xếp MỌI ca của MỌI khối chung
// một danh sách theo giờ mở rồi lấy mấy ca gần nhất. Ca khối 10 thi lúc 14:37
// và ca khối 12 thi lúc 17:40 nằm cạnh nhau, nên ca 2011 hoàn toàn có thể rút
// "câu em từng sai" từ một ca 2009 — đề khác hẳn, chương khác hẳn.
//
// Gom theo năm sinh vừa là cây thư mục thầy cần, vừa bịt luôn chỗ trộn khối đó.

/** Năm sinh hợp lệ: 4 chữ số, 2000–2099. Ngoài khoảng ấy gần như chắc chắn là
 * con số khác (mã ca, số phòng) lọt vào đầu tên. */
const MAU_NAM = /^\s*(20\d{2})\b/

/** ĐỌC NĂM SINH Ở ĐẦU TÊN CA. Không có thì trả `null` — KHÔNG đoán.
 *
 * Chấp cả "2009 - Lớp 1", "2009-Lớp 1", "2009 Lớp 1": thầy gõ tay nên khoảng
 * trắng và dấu gạch không đều nhau. */
export function namSinhTuTenCa(tenCa: string | null | undefined): string | null {
  const m = MAU_NAM.exec(String(tenCa ?? ''))
  return m ? m[1] : null
}


/** NĂM SINH ĐA SỐ CỦA MỘT NHÓM EM.
 *
 * NGUỒN SỰ THẬT THẬT SỰ của "ca này thuộc khối nào" là NĂM SINH CỦA CHÍNH CÁC
 * EM trong ca, không phải cái nhãn thầy gõ ở tên ca. Thầy đổi tên ca là chuyện
 * bình thường; đổi năm sinh trong hồ sơ thì không.
 *
 * Lấy đa số chứ không lấy em đầu tiên: một em học nhảy khối hoặc một dòng hồ sơ
 * gõ sai năm không được phép kéo cả ca sang thư mục khác.
 *
 * Trả `null` khi không có em nào đọc được năm, hoặc khi không có năm nào chiếm
 * quá nửa — hai chuyện đều nghĩa là "không chắc", và không chắc thì KHÔNG đoán.
 */
export function namSinhDaSo(dsNamSinh: (string | number | null | undefined)[]): string | null {
  const dem = new Map<string, number>()
  let tong = 0
  for (const v of dsNamSinh) {
    const m = /(20\d{2})/.exec(String(v ?? ''))
    if (!m) continue
    dem.set(m[1], (dem.get(m[1]) ?? 0) + 1)
    tong += 1
  }
  if (tong === 0) return null
  let nam: string | null = null
  let nhieuNhat = 0
  for (const [k, n] of dem) {
    if (n > nhieuNhat) {
      nhieuNhat = n
      nam = k
    }
  }
  return nhieuNhat * 2 > tong ? nam : null
}

/** Tên thư mục cho ca không đọc được năm sinh. */
export const THU_MUC_KHAC = 'Khác'

export interface ThuMucNam<T> {
  /** "2009", "2011", hoặc `THU_MUC_KHAC`. */
  nam: string
  ca: T[]
}

/** GOM CA THÀNH CÂY THƯ MỤC THEO NĂM SINH.
 *
 * Năm mới nhất đứng trước (2011 trước 2009) — thầy đang dạy khối nào nhiều nhất
 * thì khối ấy thường là khối mới. Thư mục "Khác" luôn đứng CUỐI, không lẫn vào
 * giữa các năm.
 *
 * Thứ tự ca TRONG mỗi thư mục giữ nguyên thứ tự đầu vào: chỗ gọi đã xếp theo
 * giờ mở, xếp lại ở đây là hai nơi quyết định một thứ. */
export function gomCaTheoNamSinh<T>(ds: T[], tenCua: (c: T) => string | null | undefined): ThuMucNam<T>[] {
  const theo = new Map<string, T[]>()
  for (const c of ds) {
    const nam = namSinhTuTenCa(tenCua(c)) ?? THU_MUC_KHAC
    const a = theo.get(nam)
    if (a) a.push(c)
    else theo.set(nam, [c])
  }
  return [...theo.entries()]
    .map(([nam, ca]) => ({ nam, ca }))
    .sort((a, b) => {
      if (a.nam === THU_MUC_KHAC) return 1
      if (b.nam === THU_MUC_KHAC) return -1
      return b.nam.localeCompare(a.nam)
    })
}

/** CÙNG MỘT THƯ MỤC KHÔNG? Ca không đọc được năm chỉ cùng thư mục với ca cũng
 * không đọc được năm — chứ KHÔNG khớp bừa vào một năm nào. */
export function cungNamSinh(tenA: string | null | undefined, tenB: string | null | undefined): boolean {
  const a = namSinhTuTenCa(tenA)
  const b = namSinhTuTenCa(tenB)
  if (a === null && b === null) return true
  return a !== null && a === b
}
