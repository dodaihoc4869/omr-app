// Hiển thị bảng số liệu / ảnh đồ thị đính kèm câu hỏi — TÁI TẠO NGUYÊN VẸN,
// không suy diễn: bảng là dữ liệu thô thầy gõ, ảnh là ảnh thật thầy upload.
// Chữ trong từng ô (tiêu đề cột lẫn số liệu) được đưa qua ChemText để chỉ số
// dưới/số mũ (vd nồng độ "10^-3", cột "C_M") hiển thị đúng như trong câu hỏi
// — không chỉ phần đề bài mới đẹp, bảng đi kèm cũng phải đẹp tương tự.
import type { QuestionMedia as QuestionMediaData } from '../data/examContent'
import { ChemText } from '../lib/chem-format'

export default function QuestionMedia({ table, imageDataUrl }: QuestionMediaData) {
  if (!table && !imageDataUrl) return null
  return (
    <div className="space-y-2 mt-1">
      {table && table.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                {table[0].map((cell, i) => (
                  <th
                    key={i}
                    className="p-2 text-left font-semibold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap"
                  >
                    <ChemText text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.slice(1).map((row, r) => (
                <tr
                  key={r}
                  className={`border-t border-slate-100 dark:border-slate-800 ${
                    r % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-900/40' : ''
                  }`}
                >
                  {row.map((cell, c) => (
                    <td key={c} className="p-2 whitespace-nowrap">
                      <ChemText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="Đồ thị / hình vẽ đính kèm"
          className="max-w-full rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
        />
      )}
    </div>
  )
}
