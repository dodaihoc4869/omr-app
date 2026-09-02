// Hiển thị bảng số liệu / ảnh đồ thị đính kèm câu hỏi — TÁI TẠO NGUYÊN VẸN,
// không suy diễn: bảng là dữ liệu thô thầy gõ, ảnh là ảnh thật thầy upload.
import type { QuestionMedia as QuestionMediaData } from '../data/examContent'

export default function QuestionMedia({ table, imageDataUrl }: QuestionMediaData) {
  if (!table && !imageDataUrl) return null
  return (
    <div className="space-y-2 mt-1">
      {table && table.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                {table[0].map((cell, i) => (
                  <th key={i} className="p-1.5 text-left font-semibold border-b border-slate-200 dark:border-slate-700">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.slice(1).map((row, r) => (
                <tr key={r} className="border-t border-slate-100 dark:border-slate-800">
                  {row.map((cell, c) => (
                    <td key={c} className="p-1.5">
                      {cell}
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
          className="max-w-full rounded-lg border border-slate-200 dark:border-slate-700"
        />
      )}
    </div>
  )
}
