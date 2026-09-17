import type { ReactNode } from 'react'
import { gomCaTheoNamSinh, THU_MUC_KHAC } from '../lib/nam-sinh-ca'

/**
 * Danh sách nhóm ca theo năm sinh thu gọn chuẩn Google Material 3.
 * - Bỏ chữ "Năm sinh", chỉ hiện năm (ví dụ: 2011 · 1 ca).
 * - Bỏ mũi tên tam giác mặc định, chạm vào thẻ để mở/gập các ca.
 * - Cỡ chữ và khoảng cách hài hòa chuẩn Google.
 */
export default function NhomCaThuGon<T extends { maCa: string; tenCa: string }>({
  ds,
  render,
  selected,
}: {
  ds: T[]
  render: (c: T) => ReactNode
  selected?: (c: T) => boolean
}) {
  const nhom = gomCaTheoNamSinh(ds, (c) => c.tenCa)

  return (
    <>
      {nhom.map((g) => {
        const daChon = selected ? g.ca.filter(selected).length : 0
        const tenNhom = g.nam === THU_MUC_KHAC ? 'Khác' : g.nam

        return (
          <details
            key={g.nam}
            className="group/nhom rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-2 sm:p-2.5 transition-all shadow-2xs hover:border-blue-300 dark:hover:border-blue-700"
          >
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 tap-target">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  {tenNhom}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  · {g.ca.length} ca
                </span>
                {selected && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      daChon > 0
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'text-slate-400'
                    }`}
                  >
                    · {daChon} đã chọn
                  </span>
                )}
              </div>
            </summary>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {g.ca.map(render)}
            </div>
          </details>
        )
      })}
    </>
  )
}
