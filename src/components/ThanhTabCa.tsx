import { useRef } from 'react'

/** Thanh tab lọc danh sách em theo trạng thái (G4). Chỉ đổi cái ĐƯỢC HIỆN, không đổi dữ liệu.
 *  Bàn phím: ←/→ chuyển tab, Home/End nhảy đầu/cuối (mẫu WAI-ARIA tabs, kích hoạt ngay khi tới). */
export interface MucTabCa {
  ma: string
  nhan: string
  so: number
}

export default function ThanhTabCa({ muc, dangChon, doi, idBang }: { muc: MucTabCa[]; dangChon: string; doi: (ma: string) => void; idBang: string }) {
  const goc = useRef<HTMLDivElement>(null)
  const chuyen = (i: number) => {
    const m = muc[(i + muc.length) % muc.length]
    doi(m.ma)
    requestAnimationFrame(() => goc.current?.querySelector<HTMLButtonElement>(`[data-tab="${m.ma}"]`)?.focus())
  }
  return (
    <div ref={goc} className="ca-tab" role="tablist" aria-label="Lọc học sinh theo trạng thái">
      {muc.map((m, i) => {
        const chon = m.ma === dangChon
        return (
          <button
            key={m.ma}
            type="button"
            role="tab"
            id={`ca-tab-${m.ma}`}
            data-tab={m.ma}
            aria-selected={chon}
            aria-controls={idBang}
            tabIndex={chon ? 0 : -1}
            className="ca-tab-nut"
            onClick={() => doi(m.ma)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); chuyen(i + 1) }
              else if (e.key === 'ArrowLeft') { e.preventDefault(); chuyen(i - 1) }
              else if (e.key === 'Home') { e.preventDefault(); chuyen(0) }
              else if (e.key === 'End') { e.preventDefault(); chuyen(muc.length - 1) }
            }}
          >
            {m.nhan} · <span className="ca-tab-so">{m.so}</span>
          </button>
        )
      })}
    </div>
  )
}
