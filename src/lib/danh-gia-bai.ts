// XẾP LOẠI VÀ NHẬN XÉT MỘT BÀI THI — MỘT BẢN DUY NHẤT CHO MỌI BÁO CÁO.
//
// Thầy bắt được 14/09: em được 10 điểm mà báo cáo vẫn ghi "Em chỉ còn thiếu một
// chút nữa là đạt điểm 10 tuyệt đối. Hãy khắc phục ngay các câu sai này" —
// trong khi không còn câu nào để khắc phục. Lý do: câu nhận xét chỉ nhìn ĐIỂM,
// không nhìn số câu còn phải chữa, và được viết sẵn theo giọng cổ vũ nên nói
// những điều không đúng với bài trước mặt.
//
// Luật mới: mọi câu chữ đều phải đúng với con số của CHÍNH bài ấy. Không câu
// nào khen suông, không câu nào hối thúc khắc phục khi chẳng còn gì để khắc
// phục, không dấu chấm than.
//
// Nhận xét cũng KHÔNG suy năng lực từ điểm ("bẫy đề chứ không phải lỗ hổng lý thuyết", "đã mất cả phần nhận biết và thông hiểu"):
// hàm này chỉ có điểm, số câu cần chữa và tổng câu — không có dữ liệu theo phần / mức độ nên không được nói về chúng
// (luật thầy chốt 18/09: không coi điểm là bằng chứng đã nắm chắc kiến thức).
//
// Hai cổng dùng chung hàm này nên xếp loại và nhận xét không bao giờ lệch nhau.

export interface DanhGiaBai {
  /** Tên xếp loại, dùng cho cả thẻ của cổng học sinh lẫn cổng phụ huynh. */
  xepLoai: string
  mau: string
  nen: string
  /** Nhận xét — luôn nhắc đúng con số của bài này. */
  thongDiep: string
  mucDoCanThiet: 'tron_diem' | 'can_thien' | 'cap_thiet' | 'khan_cap'
}

const XANH = { mau: 'text-emerald-600 dark:text-emerald-400', nen: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' }
const LAM = { mau: 'text-blue-600 dark:text-blue-400', nen: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' }
const CHAM = { mau: 'text-indigo-600 dark:text-indigo-400', nen: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' }
const HO_PHACH = { mau: 'text-amber-600 dark:text-amber-400', nen: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' }
const DO = { mau: 'text-rose-600 dark:text-rose-400', nen: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' }

/** "12 câu" hoặc "" khi chưa biết tổng — cấm bịa số. */
function veTong(tongCau: number | null): string {
  return tongCau && tongCau > 0 ? ` trên ${tongCau} câu` : ''
}

export function danhGiaBai(diem: number, soCanKhacPhuc: number, tongCau: number | null = null): DanhGiaBai {
  const d = Number.isFinite(diem) ? diem : 0
  const con = Math.max(0, Math.floor(Number(soCanKhacPhuc) || 0))

  // KHÔNG CÒN CÂU NÀO PHẢI CHỮA. Nói đúng chuyện đó, và không hối thúc khắc
  // phục một danh sách rỗng.
  if (con === 0) {
    return {
      xepLoai: d >= 9.995 ? 'Trọn điểm' : 'Không còn câu sai',
      ...XANH,
      thongDiep:
        d >= 9.995
          ? `Em làm đúng hết${veTong(tongCau)}. Không còn câu nào phải chữa. Ca sau giữ nguyên cách làm này.`
          : `Không câu nào sai${veTong(tongCau)}. Phần điểm chưa trọn là do phần II chấm theo từng ý — mở mục Câu sai cần chữa để xem mất ở ý nào.`,
      mucDoCanThiet: 'tron_diem',
    }
  }

  const conCau = `${con} câu cần chữa`

  if (d >= 9.0) {
    return {
      xepLoai: 'Xuất sắc',
      ...XANH,
      thongDiep: `Em được ${d.toFixed(2)} điểm, còn ${conCau}${veTong(tongCau)}. Chữa hết chỗ này là trọn điểm.`,
      mucDoCanThiet: 'can_thien',
    }
  }
  if (d >= 8.0) {
    return {
      xepLoai: 'Giỏi',
      ...LAM,
      thongDiep: `Em được ${d.toFixed(2)} điểm, còn ${conCau}${veTong(tongCau)}. Mở từng câu ở mục Câu sai cần chữa để xem mình sai ở bước nào.`,
      mucDoCanThiet: 'can_thien',
    }
  }
  if (d >= 6.5) {
    return {
      xepLoai: 'Khá',
      ...CHAM,
      thongDiep: `Em được ${d.toFixed(2)} điểm, còn ${conCau}${veTong(tongCau)}. Làm lại đúng ${conCau} này trước khi sang đề mới.`,
      mucDoCanThiet: 'cap_thiet',
    }
  }
  if (d >= 5.0) {
    return {
      xepLoai: 'Trung bình',
      ...HO_PHACH,
      thongDiep: `Em được ${d.toFixed(2)} điểm, còn ${conCau}${veTong(tongCau)}. Làm lại từng câu ở mục Câu sai cần chữa, kèm lời giải.`,
      mucDoCanThiet: 'khan_cap',
    }
  }
  return {
    xepLoai: 'Cần khắc phục',
    ...DO,
    thongDiep: `Em được ${d.toFixed(2)} điểm, còn ${conCau}${veTong(tongCau)}. Mỗi câu bên dưới đều có lời giải từng bước — làm lại lần lượt, không bỏ câu nào.`,
    mucDoCanThiet: 'khan_cap',
  }
}
