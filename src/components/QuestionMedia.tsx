// Hiển thị bảng số liệu / ảnh đồ thị đính kèm câu hỏi — TÁI TẠO NGUYÊN VẸN,
// không suy diễn: bảng là dữ liệu thô thầy gõ, ảnh là ảnh thật thầy upload.
// Chữ trong từng ô (tiêu đề cột lẫn số liệu) được đưa qua ChemText để chỉ số
// dưới/số mũ (vd nồng độ "10^-3", cột "C_M") hiển thị đúng như trong câu hỏi
// — không chỉ phần đề bài mới đẹp, bảng đi kèm cũng phải đẹp tương tự.
import { useState } from 'react'
import type { QuestionMedia as QuestionMediaData } from '../data/examContent'
import { ChemText } from '../lib/chem-format'

// Bảng số liệu và ảnh hình vẽ/sơ đồ PHẢI luôn hiện ngay dưới đề bài liên
// quan — không giấu sau nút bấm nào, học sinh không hiểu đề nếu phải bấm
// thêm mới thấy. Ảnh bấm được để phóng to toàn màn hình (đối chiếu số liệu
// dễ hơn trên điện thoại màn nhỏ); bảng chữ tối thiểu 13px, không co nhỏ hơn.
/** Ảnh bấm phóng to toàn màn hình — dùng chung cho ảnh đồ thị/hình vẽ VÀ ảnh
 * đề bài cắt từ PDF gốc (than_cau.png), cùng một hành vi chạm. */
export function ZoomableImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [phongTo, setPhongTo] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setPhongTo(true)} className={`tap-target block w-full ${className}`} title="Bấm để phóng to toàn màn hình">
        <img src={src} alt={alt} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
      </button>
      {phongTo && (
        <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-2 overflow-auto" onClick={() => setPhongTo(false)}>
          <img src={src} alt={alt} className="max-w-full max-h-full rounded shadow-2xl" />
        </div>
      )}
    </>
  )
}

/** Đề bài: có ảnh cắt từ PDF gốc thì LUÔN ưu tiên hiện ảnh — đúng nguyên tắc
 * "lớp chữ chỉ để định vị, không dùng để hiển thị" (lớp chữ PDF vỡ công thức
 * ÂM THẦM, ảnh thì không). Không có ảnh (đề gõ tay, hoặc cắt ảnh thất bại) ->
 * hiện lại bằng chữ (ChemText) như trước. */
export function StemOrText({ img, text }: { img?: string; text: string }) {
  if (img) return <ZoomableImage src={img} alt="Đề bài (ảnh cắt từ file gốc)" />
  return (
    <div className="text-sm leading-relaxed">
      <ChemText text={text} />
    </div>
  )
}

/** Phương án A/B/C/D hoặc ý a/b/c/d — có ảnh thì hiện ảnh, không có thì hiện
 * chữ. Ảnh phương án không cần bấm phóng to riêng (đã đủ nhỏ để đọc trong
 * hàng chọn, và trộn/xáo hoạt động y hệt vì vẫn tham chiếu qua chỉ số gốc). */
export function ChoiceOrText({ img, text }: { img?: string; text: string }) {
  if (img) return <img src={img} alt="Phương án (ảnh cắt từ file gốc)" className="max-h-14 w-auto" />
  return (
    <span className="flex-1">
      <ChemText text={text} />
    </span>
  )
}

export default function QuestionMedia({ table, imageDataUrl }: QuestionMediaData) {
  const [phongTo, setPhongTo] = useState(false)
  if (!table && !imageDataUrl) return null
  return (
    <div className="space-y-2 mt-1">
      {table && table.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="w-full text-[13px] border-collapse">
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
        <>
          <button type="button" onClick={() => setPhongTo(true)} className="tap-target block w-full" title="Bấm để phóng to toàn màn hình">
            <img
              src={imageDataUrl}
              alt="Đồ thị / hình vẽ đính kèm"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
            />
          </button>
          {phongTo && (
            <div
              className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-2 overflow-auto"
              onClick={() => setPhongTo(false)}
            >
              <img src={imageDataUrl} alt="Đồ thị / hình vẽ phóng to" className="max-w-full max-h-full rounded shadow-2xl" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
