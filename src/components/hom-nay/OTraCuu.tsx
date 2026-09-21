import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { gopKetQuaTim, laSbdGo, timEm, timEmMayChu, type EmTraCuu } from '../../lib/hom-nay-v2'
import '../../styles/hom-nay-v2.css'

/** Ô TRA CỨU ở đầu màn Hôm nay (bản vẽ docs/ban-ve-hom-nay-v2-2109/): gõ tên hoặc số báo danh — KHÔNG DẤU cũng ra — gợi ý hiện khi gõ; ↑ ↓ chọn, Enter mở TOÀN CẢNH em đó, Esc đóng.
 *  Mã ca 6 số vẫn mở ca (như ô cũ). Tìm MÁY CHỦ trước (`/gv/tim-em`, trễ ~200 ms, lượt cũ bị bỏ) rồi GỘP với danh sách lớp trên máy thầy — máy chủ lỗi/chưa có lệnh ⇒ vẫn dùng danh sách trên máy, không báo đỏ.
 *  Enter KHÔNG BAO GIỜ chết (lỗi thầy gặp 21/09): không có gợi ý ⇒ hỏi máy chủ đúng chuỗi đã gõ; có em thì mở, không có thì hiện dòng thật ("Không thấy em nào có số báo danh 12074"). */
export default function OTraCuu({ ds, onMoEm, onMoCa, placeholder = 'Gõ tên hoặc số báo danh…' }: { ds: EmTraCuu[]; onMoEm: (sbd: string) => void; onMoCa: (ma: string) => void; placeholder?: string }) {
  const [q, setQ] = useState('')
  const [mo, setMo] = useState(false)
  const [chon, setChon] = useState(0)
  /** Trả lời của máy chủ cho ĐÚNG chuỗi `q` đã gõ (`ds` rỗng + `ok` = máy chủ nói "không có em nào"). `xong:false` = đang chờ. */
  const [tra, setTra] = useState<{ q: string; xong: boolean; ok: boolean; ds: EmTraCuu[] } | null>(null)
  const [dangHoi, setDangHoi] = useState(false)
  const lan = useRef(0)
  const id = useId()
  const k = q.trim()

  useEffect(() => {
    if (!k) {
      lan.current += 1
      setTra(null)
      return
    }
    const luot = ++lan.current
    setTra({ q: k, xong: false, ok: false, ds: [] })
    const hen = setTimeout(() => {
      void timEmMayChu(k).then((r) => {
        if (lan.current !== luot) return // đã gõ tiếp ⇒ bỏ lượt cũ
        setTra({ q: k, xong: true, ok: r.ok, ds: r.ok ? r.du : [] })
      })
    }, 200)
    return () => clearTimeout(hen)
  }, [k])

  const traHopLe = tra && tra.q === k ? tra : null
  const laMaCa = /^\d{6}$/.test(k)
  const ketQua = useMemo(() => gopKetQuaTim(traHopLe?.ds ?? [], timEm(ds, q, 8)), [ds, q, traHopLe])
  const muc: { khoa: string; ten: string; phu: string; chay: () => void }[] = [
    ...(laMaCa ? [{ khoa: 'ca', ten: `Mở ca kiểm tra mã ${k}`, phu: 'Chi tiết ca đang theo dõi', chay: () => onMoCa(k) }] : []),
    ...ketQua.map((e) => ({ khoa: e.sbd, ten: e.hoTen || `SBD ${e.sbd}`, phu: `${e.tenLop || e.lop ? `${e.tenLop || e.lop} · ` : ''}SBD ${e.sbd}`, chay: () => onMoEm(e.sbd) })),
  ]
  const co = k !== ''
  const mem = (i: number) => `${id}-o${i}`

  const chay = (i: number) => {
    const m = muc[i]
    if (!m) return
    m.chay()
    setMo(false)
    setQ('')
  }

  /** Enter: có gợi ý ⇒ mở em đang chọn; không có ⇒ hỏi máy chủ thẳng (đừng để Enter chết). */
  const enter = async () => {
    if (muc[chon]) return chay(chon)
    if (!k || dangHoi) return
    const luot = lan.current
    setDangHoi(true)
    const r = await timEmMayChu(k)
    setDangHoi(false)
    if (lan.current !== luot) return // đã gõ tiếp trong lúc chờ ⇒ bỏ
    if (r.ok && r.du.length > 0) {
      const dung = r.du.find((e) => e.sbd === k) ?? r.du[0]
      onMoEm(dung.sbd)
      setMo(false)
      setQ('')
      return
    }
    setTra({ q: k, xong: true, ok: r.ok, ds: [] })
    setMo(true)
  }

  // Dòng báo khi không có gợi ý nào — nói THẬT theo việc máy chủ đã trả lời hay chưa.
  const dongTrong = (() => {
    if (muc.length > 0) return ''
    if (!traHopLe || !traHopLe.xong) return dangHoi || traHopLe ? 'Đang tìm…' : ''
    if (traHopLe.ok) return laSbdGo(k) ? `Không thấy em nào có số báo danh ${k}` : `Không thấy em nào tên “${k}”`
    return `Không tìm thấy “${k}” trong danh sách lớp trên máy này.`
  })()

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
          placeholder={placeholder}
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
              void enter()
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
        {ds.length === 0 && traHopLe && !traHopLe.ok && traHopLe.xong ? (
          'Chưa hỏi được máy chủ và chưa có danh sách lớp trên máy này — vào Học sinh để nạp danh sách rồi tìm ở đây.'
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
          {dongTrong && (
            <li className="hn2-tim-trong" role="status">
              {dongTrong}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
