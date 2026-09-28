// CHỌN EM NHẬN CHIẾN DỊCH (thầy 28/09: "chọn lớp cho tôi chọn khối, chọn lớp tick theo em"): khối → lớp (tích nhiều) → từng em (mặc định tích hết).
// Nguồn: danh sách học sinh trên máy thầy (`classList`). Không có danh sách ⇒ màn giao lùi về ô gõ tên lớp (máy chủ tự lấy em của lớp).
import { useMemo, useState } from 'react'

export interface EmLop {
  sbd: string
  hoTen: string
  lop: string
}

/** Khối của một lớp: số 10/11/12 đứng đầu tên lớp ("12A1" → "12", "11" → "11"); không đọc được ⇒ "Khác". */
export function khoiCuaLop(lop: string): string {
  const m = lop.trim().match(/^(10|11|12)(?!\d)/)
  return m ? m[1]! : 'Khác'
}

const soSanh = (a: string, b: string) => a.localeCompare(b, 'vi', { numeric: true })

export default function ChonEmGiao({
  ds,
  lopChon,
  boEm,
  onDoiLop,
  onDoiBoEm,
}: {
  ds: EmLop[]
  lopChon: ReadonlySet<string>
  /** SBD thầy BỎ tích (mặc định mọi em của lớp đã chọn đều nhận). */
  boEm: ReadonlySet<string>
  onDoiLop: (s: Set<string>) => void
  onDoiBoEm: (s: Set<string>) => void
}) {
  const dsLop = useMemo(() => [...new Set(ds.map((e) => e.lop))].sort(soSanh), [ds])
  const dsKhoi = useMemo(() => [...new Set(dsLop.map(khoiCuaLop))].sort(soSanh), [dsLop])
  const [khoi, setKhoi] = useState<string>(() => {
    const dau = [...lopChon][0]
    return dau ? khoiCuaLop(dau) : dsKhoi[0] ?? ''
  })
  const [tim, setTim] = useState('')

  const lopCuaKhoi = dsLop.filter((l) => khoiCuaLop(l) === khoi)
  const emDaLop = useMemo(() => ds.filter((e) => lopChon.has(e.lop)).sort((a, b) => soSanh(a.lop, b.lop) || soSanh(a.hoTen, b.hoTen)), [ds, lopChon])
  const t = tim.trim().toLowerCase()
  const emHien = t ? emDaLop.filter((e) => e.hoTen.toLowerCase().includes(t) || e.sbd.includes(t)) : emDaLop
  const soNhan = emDaLop.filter((e) => !boEm.has(e.sbd)).length

  const doiLop = (l: string) => {
    const s = new Set(lopChon)
    if (s.has(l)) s.delete(l)
    else s.add(l)
    onDoiLop(s)
  }
  const doiEm = (sbd: string) => {
    const s = new Set(boEm)
    if (s.has(sbd)) s.delete(sbd)
    else s.add(sbd)
    onDoiBoEm(s)
  }
  const datCaHien = (nhan: boolean) => {
    const s = new Set(boEm)
    for (const e of emHien) {
      if (nhan) s.delete(e.sbd)
      else s.add(e.sbd)
    }
    onDoiBoEm(s)
  }

  return (
    <fieldset className="cd-truong cd-chon-em" data-khoi="chon-em-giao">
      <legend>Giao cho</legend>
      <div className="cd-hang-chip" role="group" aria-label="Khối">
        {dsKhoi.map((k) => (
          <button key={k} type="button" className="cd-chip" aria-pressed={k === khoi} onClick={() => setKhoi(k)}>
            {k === 'Khác' ? 'Khác' : `Khối ${k}`}
          </button>
        ))}
      </div>
      <div className="cd-hang-chip" role="group" aria-label={`Lớp khối ${khoi}`}>
        {lopCuaKhoi.map((l) => (
          <label key={l} className="cd-tich cd-chip-tich">
            <input type="checkbox" checked={lopChon.has(l)} onChange={() => doiLop(l)} />
            <span>
              Lớp {l} · {ds.filter((e) => e.lop === l).length} em
            </span>
          </label>
        ))}
      </div>
      {emDaLop.length > 0 && (
        <>
          <div className="cd-hang-chip">
            <input type="text" className="cd-tim-em" value={tim} placeholder="Tìm tên hoặc SBD" aria-label="Tìm em" onChange={(e) => setTim(e.target.value)} />
            <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => datCaHien(true)}>
              Chọn hết
            </button>
            <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => datCaHien(false)}>
              Bỏ hết
            </button>
          </div>
          <div className="cd-ds-em" role="group" aria-label="Học sinh nhận chiến dịch">
            {emHien.map((e) => (
              <label key={e.sbd} className="cd-tich">
                <input type="checkbox" checked={!boEm.has(e.sbd)} onChange={() => doiEm(e.sbd)} />
                <span>
                  {e.hoTen || e.sbd} <small className="cd-so">· {e.lop} · {e.sbd}</small>
                </span>
              </label>
            ))}
          </div>
        </>
      )}
      <small className="cd-so" data-so="so-em-chon">
        {lopChon.size === 0 ? 'Chọn lớp để giao' : `Đã chọn ${soNhan}/${emDaLop.length} em · lớp ${[...lopChon].sort(soSanh).join(', ')}`}
      </small>
    </fieldset>
  )
}
