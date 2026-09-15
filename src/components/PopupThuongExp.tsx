/**
 * POPUP LẤP LÁNH KHI NHẬN EXP.
 *
 * Thầy chốt 15-09: "hoàn thành xong nhiệm vụ thì popup ra một cái gì đó lấp
 * lánh toả hào quang được cộng bao nhiêu exp".
 *
 * Vẽ bằng SVG và CSS thuần — kho cấm tệp ảnh và cấm CDN. Hào quang là hai vòng
 * tia xoay ngược chiều nhau, cộng mười hạt sáng bay lên. Tự tắt sau 2,8 giây,
 * và bấm vào là tắt ngay cho em nào vội.
 *
 * `prefers-reduced-motion` thì bỏ hết chuyển động, giữ nguyên chữ — có em say
 * chuyển động, và cái popup này bật rất thường xuyên.
 */

import { useEffect } from 'react'
import { TEN_NGUON_EXP, type NguonKiemExp } from '../game/than-thu-hoa-hoc/kinh-nghiem'

export interface TinThuongExp {
  /** Số EXP vừa rót vào ống. */
  exp: number
  nguon: NguonKiemExp
  /** Việc cụ thể vừa làm, ví dụ "Hạ trùm tầng 7". */
  viec: string
  /** Khoá đổi mỗi lần thưởng, để React dựng lại hoạt ảnh từ đầu. */
  lan: number
}

const SO_TIA = 12
const SO_HAT = 10

export default function PopupThuongExp({
  tin,
  onDong,
}: {
  tin: TinThuongExp | null
  onDong: () => void
}) {
  useEffect(() => {
    if (tin === null) return
    const h = setTimeout(onDong, 2800)
    return () => clearTimeout(h)
  }, [tin, onDong])

  if (tin === null) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {/* Nền mờ nhẹ, bấm để tắt sớm */}
      <button
        type="button"
        aria-label="Đóng thông báo thưởng"
        onClick={onDong}
        className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/40 pointer-events-auto cursor-pointer"
      />

      <div className="relative pointer-events-none animate-google-fade">
        {/* Hào quang: hai vành tia xoay ngược chiều */}
        <svg
          width="260"
          height="260"
          viewBox="-130 -130 260 260"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden"
        >
          <g>
            {Array.from({ length: SO_TIA }, (_, i) => (
              <rect
                key={'a' + i}
                x="-2.5" y="-118" width="5" height="34" rx="2.5"
                fill="rgba(251, 191, 36, 0.85)"
                transform={`rotate(${(360 / SO_TIA) * i})`}
              />
            ))}
            <animateTransform attributeName="transform" type="rotate"
              from="0" to="360" dur="9s" repeatCount="indefinite" />
          </g>
          <g>
            {Array.from({ length: SO_TIA }, (_, i) => (
              <rect
                key={'b' + i}
                x="-1.6" y="-96" width="3.2" height="20" rx="1.6"
                fill="rgba(52, 211, 153, 0.75)"
                transform={`rotate(${(360 / SO_TIA) * i + 15})`}
              />
            ))}
            <animateTransform attributeName="transform" type="rotate"
              from="360" to="0" dur="6s" repeatCount="indefinite" />
          </g>
          {/* Hạt sáng bay lên */}
          {Array.from({ length: SO_HAT }, (_, i) => {
            const x = -84 + i * 18.6
            return (
              <circle key={'h' + i} cx={x} cy="70" r={2 + (i % 3)} fill="rgba(253, 230, 138, 0.95)">
                <animate attributeName="cy" values="70;-86" dur={`${2 + (i % 4) * 0.45}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur={`${2 + (i % 4) * 0.45}s`} repeatCount="indefinite" />
              </circle>
            )
          })}
        </svg>

        {/* Thẻ nội dung */}
        <div className="relative rounded-3xl px-7 py-6 text-center bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 shadow-2xl min-w-[240px]">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
            Hoàn thành nhiệm vụ
          </div>
          <div className="mt-1.5 text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums leading-none">
            +{tin.exp}
          </div>
          <div className="text-[11px] font-bold text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">
            EXP vào ống nghiệm
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {TEN_NGUON_EXP[tin.nguon]}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {tin.viec}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
