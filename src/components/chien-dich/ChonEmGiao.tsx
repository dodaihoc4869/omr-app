// CHỌN EM NHẬN CHIẾN DỊCH (thầy 28/09): ba cách tích, dùng CHUNG một tập em đã chọn —
//   1. "Toàn khối": tích Khối 10/11/12 ⇒ chọn/bỏ mọi em của khối.
//   2. "Theo lớp": tích lớp thầy đã phân (`ten_lop`, vd "12 - Tinh Hoa") ⇒ chọn/bỏ mọi em của lớp.
//   3. "Từng em": danh sách có bộ lọc theo khối + tìm tên; "Tích tất cả" / "Bỏ hết" áp cho các em đang hiện.
// Ô khối/lớp tự tích khi đủ em, "một phần" khi mới chọn một số em.
import { useEffect, useMemo, useRef, useState } from 'react'

export interface EmLop {
  sbd: string
  hoTen: string
  /** Khối '10' / '11' / '12' (cột `lop` của máy chủ). */
  khoi: string
  /** Lớp thầy đã phân (cột `ten_lop`; rỗng ⇒ mặc định theo khối). */
  tenLop: string
}

/** Khối của một tên lớp: số 10/11/12 đứng đầu ("12A1" → "12", "11" → "11"); không đọc được ⇒ "Khác". */
export function khoiCuaLop(lop: string): string {
  const m = lop.trim().match(/^(10|11|12)(?!\d)/)
  return m ? m[1]! : 'Khác'
}

const soSanh = (a: string, b: string) => a.localeCompare(b, 'vi', { numeric: true })
const tenKhoi = (k: string) => (k === 'Khác' ? 'Khác' : `Khối ${k}`)

/** Ô tích nhóm: đủ ⇒ tích; một phần ⇒ trạng thái "một phần" (indeterminate). */
function OTichNhom({ nhan, ds, chon, onDoi }: { nhan: string; ds: EmLop[]; chon: ReadonlySet<string>; onDoi: (sbd: string[], nhan: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const soChon = ds.filter((e) => chon.has(e.sbd)).length
  const du = ds.length > 0 && soChon === ds.length
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = soChon > 0 && !du
  }, [soChon, du])
  return (
    <label className="cd-tich cd-chip-tich">
      <input ref={ref} type="checkbox" checked={du} onChange={() => onDoi(ds.map((e) => e.sbd), !du)} />
      <span>
        {nhan} · {soChon > 0 && !du ? `${soChon}/${ds.length}` : ds.length} em
      </span>
    </label>
  )
}

export default function ChonEmGiao({ ds, chon, onDoi }: { ds: EmLop[]; chon: ReadonlySet<string>; onDoi: (s: Set<string>) => void }) {
  const dsKhoi = useMemo(() => [...new Set(ds.map((e) => e.khoi))].sort(soSanh), [ds])
  const lopTheoKhoi = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const e of ds) if (!(m.get(e.khoi) ?? []).includes(e.tenLop)) m.set(e.khoi, [...(m.get(e.khoi) ?? []), e.tenLop])
    for (const v of m.values()) v.sort(soSanh)
    return m
  }, [ds])
  const [locKhoi, setLocKhoi] = useState('')
  const [tim, setTim] = useState('')

  const doiNhieu = (sbd: string[], nhan: boolean) => {
    const s = new Set(chon)
    for (const x of sbd) {
      if (nhan) s.add(x)
      else s.delete(x)
    }
    onDoi(s)
  }
  const t = tim.trim().toLowerCase()
  const emHien = ds
    .filter((e) => (!locKhoi || e.khoi === locKhoi) && (!t || e.hoTen.toLowerCase().includes(t) || e.sbd.includes(t) || e.tenLop.toLowerCase().includes(t)))
    .sort((a, b) => soSanh(a.tenLop, b.tenLop) || soSanh(a.hoTen, b.hoTen))
  const lopCoChon = [...new Set(ds.filter((e) => chon.has(e.sbd)).map((e) => e.tenLop))].sort(soSanh)

  return (
    <fieldset className="cd-truong cd-chon-em" data-khoi="chon-em-giao">
      <legend>Giao cho</legend>

      <span className="cd-nhan-nhom">Toàn khối</span>
      <div className="cd-hang-chip" role="group" aria-label="Chọn toàn khối">
        {dsKhoi.map((k) => (
          <OTichNhom key={k} nhan={tenKhoi(k)} ds={ds.filter((e) => e.khoi === k)} chon={chon} onDoi={doiNhieu} />
        ))}
      </div>

      <span className="cd-nhan-nhom">Theo lớp</span>
      {dsKhoi.map((k) => (
        <div key={k} className="cd-hang-chip" role="group" aria-label={`Lớp của ${tenKhoi(k)}`}>
          {(lopTheoKhoi.get(k) ?? []).map((l) => (
            <OTichNhom key={l} nhan={l} ds={ds.filter((e) => e.khoi === k && e.tenLop === l)} chon={chon} onDoi={doiNhieu} />
          ))}
        </div>
      ))}

      <span className="cd-nhan-nhom">Từng em</span>
      <div className="cd-hang-chip" role="group" aria-label="Lọc theo khối">
        {['', ...dsKhoi].map((k) => (
          <button key={k || 'tat-ca'} type="button" className="cd-chip" aria-pressed={locKhoi === k} onClick={() => setLocKhoi(k)}>
            {k ? tenKhoi(k) : 'Tất cả khối'}
          </button>
        ))}
      </div>
      <div className="cd-hang-chip">
        <input type="text" className="cd-tim-em" value={tim} placeholder="Tìm tên, SBD hoặc lớp" aria-label="Tìm em" onChange={(e) => setTim(e.target.value)} />
        <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => doiNhieu(emHien.map((e) => e.sbd), true)}>
          Tích tất cả
        </button>
        <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => doiNhieu(emHien.map((e) => e.sbd), false)}>
          Bỏ hết
        </button>
      </div>
      <div className="cd-ds-em" role="group" aria-label="Học sinh nhận chiến dịch">
        {emHien.map((e) => (
          <label key={e.sbd} className="cd-tich">
            <input type="checkbox" checked={chon.has(e.sbd)} onChange={() => doiNhieu([e.sbd], !chon.has(e.sbd))} />
            <span>
              {e.hoTen || e.sbd} <small className="cd-so">· {e.tenLop} · {e.sbd}</small>
            </span>
          </label>
        ))}
        {emHien.length === 0 && <p className="cd-phu">Không có em nào khớp bộ lọc.</p>}
      </div>

      <small className="cd-so" data-so="so-em-chon">
        {chon.size === 0 ? 'Chưa chọn em nào' : `Đã chọn ${chon.size}/${ds.length} em · ${lopCoChon.join(', ')}`}
      </small>
    </fieldset>
  )
}
