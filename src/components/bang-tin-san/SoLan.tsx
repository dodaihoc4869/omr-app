// SỐ LĂN KIỂU CÔNG-TƠ: mỗi chữ số là một cột 0–9 trượt tới chữ số mới; chỉ chữ số nào ĐỔI mới lăn. Lần đầu hiện KHÔNG chạy chuyển động.
// Tắt chuyển động (prefers-reduced-motion) ở CSS. Số đổi độ dài (999 → 1.000) ⇒ dựng lại các cột (không lăn).
import { useEffect, useState } from 'react'

const CHU_SO = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function SoLan({ chu }: { chu: string }) {
  const [chay, setChay] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setChay(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <span className={`bts-so-lan${chay ? ' bts-so-lan--chay' : ''}`} role="img" aria-label={chu} data-so={chu} key={chu.length}>
      {[...chu].map((ch, i) =>
        /\d/.test(ch) ? (
          <span className="bts-cs" key={i} aria-hidden="true">
            <span className="bts-dai" style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>
              {CHU_SO.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span className="bts-kt" key={i} aria-hidden="true">
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
