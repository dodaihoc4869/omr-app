// BA THẺ ĐIỂM THEO PHẦN — MỘT KHUÔN CHO MỌI BÁO CÁO.
//
// Thầy chốt 14/09: "đồng bộ mọi dữ liệu hình thức bố cục của báo cáo vào tất cả
// các ca trước đó, tất cả các chỗ có báo cáo, tất cả các app."
//
// Trước bản này cổng học sinh vẽ ba thẻ gọn, còn cổng phụ huynh vẽ ba khối dài
// ở một thẻ riêng tên "Cấu trúc 3 Phần Đề" — cùng một dữ liệu, hai bố cục, và
// thẻ ấy lại trùng nội dung với thẻ Tổng quan ngay bên cạnh.

interface Props {
  diemI: number
  diemII: number
  diemIII: number
}

/** Trần điểm từng phần của đề chuẩn 2018. */
const TRAN = { I: 4.5, II: 4.0, III: 1.5 } as const

const THE = [
  { khoa: 'I', ten: 'PHẦN I: TRẮC NGHIỆM', mo: 'Nhiều lựa chọn (A, B, C, D)' },
  { khoa: 'II', ten: 'PHẦN II: ĐÚNG / SAI', mo: 'Câu hỏi Đúng / Sai (mỗi câu gồm 4 ý a, b, c, d)' },
  { khoa: 'III', ten: 'PHẦN III: TRẢ LỜI NGẮN', mo: 'Câu hỏi trả lời ngắn tính toán và biện luận' },
] as const

export default function KhoiBaPhan({ diemI, diemII, diemIII }: Props) {
  const diem: Record<string, number> = { I: diemI, II: diemII, III: diemIII }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {THE.map((t) => (
        <div key={t.khoa} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t.ten}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {(diem[t.khoa] ?? 0).toFixed(2)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {TRAN[t.khoa].toFixed(2)} điểm</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t.mo}</div>
        </div>
      ))}
    </div>
  )
}
