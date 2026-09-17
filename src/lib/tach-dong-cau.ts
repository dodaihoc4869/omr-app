// TÁCH DÒNG THEO Ý CHO CÂU HỎI — 100% KHÔNG BỎ SÓT
//
// Giúp đề thi có nhiều ý/thí nghiệm (1), (2), (3)... hoặc (a), (b), (c)...
// không bị dồn cục thành một đoạn văn dày đặc, mà tự động ngắt dòng thông minh,
// thoáng mắt, dễ đọc trên cả điện thoại và máy tính.

/**
 * Tự động ngắt dòng theo các ý (1), (2)... (a), (b)... và câu hỏi kết luận.
 */
export function tachDongTheoY(rawText: string | null | undefined): string {
  if (!rawText) return ''
  let s = String(rawText)

  // 1. Tách dòng sau dấu hai chấm trước ý (1) hoặc (a) nếu chưa có xuống dòng
  s = s.replace(/([:;])\s*(\((?:1|a|A)\))/g, '$1\n$2')

  // 2. Tách dòng trước các ý (1), (2), (3), (4), (5), (6), (7), (8), (9), (10)
  // Chỉ ngắt khi đứng sau dấu chấm, chấm phẩy, hoặc khoảng trắng phân tách ý
  s = s.replace(/([.;?!])\s*(\((?:[1-9]|10)\)\s+)/g, '$1\n$2')
  s = s.replace(/(^|[^\n])\s+(\((?:[2-9]|10)\)\s+)/g, '$1\n$2')

  // 3. Tách dòng trước các ý (a), (b), (c), (d), (e)
  s = s.replace(/([.;?!])\s*(\([a-eA-E]\)\s+)/g, '$1\n$2')
  s = s.replace(/(^|[^\n])\s+(\([b-eB-E]\)\s+)/g, '$1\n$2')

  // 4. Tách dòng trước các gạch đầu dòng / bullet point
  s = s.replace(/([.;?!])\s*([•-]\s+)/g, '$1\n$2')

  // 5. Tách câu hỏi kết luận hoặc yêu cầu hành động ra một dòng riêng biệt
  const tuKhoaKetLuan = [
    'Liệt kê các thí nghiệm',
    'Liệt kê các phát biểu',
    'Liệt kê các chất',
    'Số phát biểu đúng là',
    'Số phát biểu không đúng là',
    'Số phát biểu sai là',
    'Số thí nghiệm thu được',
    'Số thí nghiệm xảy ra',
    'Số chất phản ứng được',
    'Số chất thoả mãn',
    'Số đồng phân',
    'Hãy xác định',
    'Hãy cho biết',
    'Có bao nhiêu',
    'Tính giá trị',
    'Tính khối lượng',
    'Tính thể tích',
    'Tính nồng độ',
    'Giá trị của',
    'Phần trăm khối lượng',
    'Công thức phân tử',
    'Công thức cấu tạo',
    'Hỏi ',
    'Xác định ',
  ]

  for (const tk of tuKhoaKetLuan) {
    const reg = new RegExp(`([.;?!])\\s*(${tk})`, 'gi')
    s = s.replace(reg, '$1\n\n$2')
  }

  // Chuẩn hoá không để quá 2 dấu xuống dòng liên tiếp
  return s.replace(/\n{3,}/g, '\n\n').trim()
}
