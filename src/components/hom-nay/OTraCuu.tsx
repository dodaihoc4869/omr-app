import { useId, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { timEm, type EmTraCuu } from '../../lib/hom-nay-v2'
import '../../styles/hom-nay-v2.css'

/** Ô TRA CỨU LỚN ở đầu màn Hôm nay (bản vẽ docs/ban-ve-hom-nay-v2-2109/): gõ tên hoặc số báo danh — KHÔNG DẤU cũng ra — gợi ý hiện ngay khi gõ; ↑ ↓ chọn, Enter mở TOÀN CẢNH em đó, Esc đóng.
 *  Mã ca 6 số vẫn mở ca (như ô cũ). Tạm tìm trên DANH SÁCH LỚP trên máy thầy, chờ lệnh `/gv/tim-em` của máy chủ (tìm cả trường, theo tên/SBD). */
export default function OTraCuu({ ds, onMoEm, onMoCa }: { ds: EmTraCuu[]; onMoEm: (sbd: string) => void; onMoCa: (ma: string) => void }) {
  const [q, setQ] = useState('')
  const [mo, setMo] = useState(false)
  const [chon, setChon] = useState(0)
  const id = useId()
  const ketQua = useMemo(() => timEm(ds, q), [ds, q])
  const laMaCa = /^\d{6}$/.test(q.trim())
  const muc: { khoa: string; ten: string; phu: string; chay: () => void }[] = [
    ...(laMaCa ? [{ khoa: 'ca', ten: `Mở ca kiểm tra mã ${q.trim()}`, phu: 'Chi tiết ca đang theo dõi', chay: () => onMoCa(q.trim()) }] : []),
    ...ketQua.map((e) => ({ khoa: e.sbd, ten: e.hoTen || `SBD ${e.sbd}`, phu: `${e.lop ? `${e.lop} · ` : ''}SBD ${e.sbd}`, chay: () => onMoEm(e.sbd) })),
  ]
  const co = q.trim() !== ''
  const mem = (i: number) => `${id}-o${i}`

  const chay = (i: number) => {
    const m = muc[i]
    if (!m) return
    m.chay()
    setMo(false)
    setQ('')
  }

  return (
    <div className="hn2-tim-khung">
      <div className="hn2-tim">
        <Search size={26} aria-hidden="true" />
        <input
          role="combobox"
          aria-expanded={mo && co}
          aria-controls={`${id}-ds`}
          aria-activedescendant={mo && muc[chon] ? mem(chon) : undefined}
          aria-autocomplete="list"
          aria-label="Tìm học sinh theo tên hoặc số báo danh"
          autoComplete="off"
          value={q}
          placeholder="Gõ tên hoặc số báo danh…"
          onChange={(e) => {
            setQ(e.target.value)
            setMo(true)
            setChon(0)
          }}
          onFocus={() => setMo(true)}
          onBlur={() => setTimeout(() => setMo(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setMo(true)
              setChon((c) => Math.min(muc.length - 1, c + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setChon((c) => Math.max(0, c - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              chay(chon)
            } else if (e.key === 'Escape') {
              setMo(false)
              setQ('')
            }
          }}
        />
        <span className="hn2-tim-phim" aria-hidden="true">
          Enter · mở toàn cảnh
        </span>
      </div>
      <p className="hn2-tim-goi-y">
        {ds.length === 0 ? (
          'Chưa có danh sách lớp trên máy này — vào Học sinh để nạp danh sách rồi tìm ở đây.'
        ) : (
          <>
            Ví dụ: <b>tran thu ha</b> (không dấu cũng ra) · <b>12121007</b> — gợi ý hiện ngay khi gõ; Enter mở TOÀN CẢNH em đó.
          </>
        )}
      </p>
      {mo && co && (
        <ul className="hn2-tim-ds" id={`${id}-ds`} role="listbox" aria-label="Gợi ý học sinh">
          {muc.map((m, i) => (
            <li
              key={m.khoa}
              id={mem(i)}
              role="option"
              aria-selected={i === chon}
              className={`hn2-tim-o${i === chon ? ' hn2-tim-o--chon' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                chay(i)
              }}
              onMouseEnter={() => setChon(i)}
            >
              <span className="hn2-tim-chu" aria-hidden="true">
                {m.ten.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="hn2-tim-ten">
                <b>{m.ten}</b>
                <small>{m.phu}</small>
              </span>
            </li>
          ))}
          {muc.length === 0 && <li className="hn2-tim-trong">Không tìm thấy “{q.trim()}” trong danh sách lớp trên máy này.</li>}
        </ul>
      )}
    </div>
  )
}
