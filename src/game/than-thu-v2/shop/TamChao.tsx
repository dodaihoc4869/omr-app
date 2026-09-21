// CỬA HÀNG PHỤ KIỆN — tấm chào LẦN ĐẦU MỞ (hiện đúng một lần; nơi gọi quyết "đã chào chưa" và nhớ ở đâu). Bốn câu [C1–C4] + nút "Xem Cửa hàng".
import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { chuChao, chuXemCuaHang } from './chu-shop'

export default function TamChao({ onXong }: { onXong: () => void }) {
  const chinh = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    chinh.current?.focus({ preventScroll: true })
  }, [])
  const phim = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onXong()
    }
  }
  return (
    <div className="ps-phu">
      <div className="ps-to ps-kinh ps-chao" role="dialog" aria-modal="true" aria-labelledby="ps-chao-tieu" onKeyDown={phim}>
        <h3 id="ps-chao-tieu">{chuChao[0]}</h3>
        {chuChao.slice(1).map((c) => (
          <p key={c} className="ps-to-chu">
            {c}
          </p>
        ))}
        <button ref={chinh} type="button" className="ps-nut-vang" onClick={onXong}>
          <span>{chuXemCuaHang}</span>
        </button>
      </div>
    </div>
  )
}
