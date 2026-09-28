// CHỌN EM NHẬN CHIẾN DỊCH — MỘT ô chọn nhiều tầng Khối › Lớp › Em (bản vẽ docs/ban-ve-gv-2809/GV-GiaoChienDich, thầy chốt 28/09).
// Ô đóng: các thẻ nhóm đã chọn ("12 - Tinh Hoa · 44 em ×"). Bấm ô ⇒ tấm bật ra: ô tìm, cây Khối › Lớp › Em có đếm "đã chọn / tổng",
// tích cả nhánh (khối/lớp), ô "một phần" khi mới chọn một số em; "Chọn hết" / "Bỏ chọn hết" áp cho em đang hiện (theo ô tìm); Esc / bấm ra ngoài / "Xong" đóng.
// Dưới ô: "Em đã chọn theo lớp" (thanh đã chọn / sĩ số lớp). Ba cách chọn cũ (toàn khối · theo lớp · từng em) vẫn đủ, gộp vào một cây.
import { useEffect, useId, useMemo, useRef, useState } from 'react'

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
export const tenKhoi = (k: string) => (k === 'Khác' ? 'Khác' : `Khối ${k}`)
/** Bỏ dấu để tìm "tinh hoa" ra "Tinh Hoa", "dung" ra "Dũng". */
const khongDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export interface NhomDaChon {
  /** Khoá ổn định: `k:12` (cả khối) · `l:12 - Tinh Hoa` (cả lớp hoặc một phần lớp). */
  khoa: string
  nhan: string
  sbd: string[]
  /** Sĩ số nhóm (để hiện "3/44 em" khi mới chọn một phần lớp). */
  tong: number
}

/** Gom tập em đã chọn thành các nhóm để hiện thẻ: khối đủ ⇒ một thẻ khối; còn lại mỗi lớp có em được chọn một thẻ (đủ hoặc một phần). */
export function nhomDaChon(ds: readonly EmLop[], chon: ReadonlySet<string>): NhomDaChon[] {
  const ra: NhomDaChon[] = []
  const dsKhoi = [...new Set(ds.map((e) => e.khoi))].sort(soSanh)
  for (const k of dsKhoi) {
    const cua = ds.filter((e) => e.khoi === k)
    const da = cua.filter((e) => chon.has(e.sbd))
    if (!da.length) continue
    if (da.length === cua.length && new Set(cua.map((e) => e.tenLop)).size > 1) {
      ra.push({ khoa: `k:${k}`, nhan: tenKhoi(k), sbd: da.map((e) => e.sbd), tong: cua.length })
      continue
    }
    for (const l of [...new Set(cua.map((e) => e.tenLop))].sort(soSanh)) {
      const lop = cua.filter((e) => e.tenLop === l)
      const daLop = lop.filter((e) => chon.has(e.sbd))
      if (daLop.length) ra.push({ khoa: `l:${l}`, nhan: l, sbd: daLop.map((e) => e.sbd), tong: lop.length })
    }
  }
  return ra
}

/** Ô tích ba trạng thái (đủ / một phần / trống) cho khối và lớp. */
function OTich({ nhan, ds, chon, onDoi }: { nhan: string; ds: EmLop[]; chon: ReadonlySet<string>; onDoi: (sbd: string[], nhan: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const soChon = ds.filter((e) => chon.has(e.sbd)).length
  const du = ds.length > 0 && soChon === ds.length
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = soChon > 0 && !du
  }, [soChon, du])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={du}
      aria-label={`${nhan} · ${soChon}/${ds.length} em`}
      onChange={() => onDoi(ds.map((e) => e.sbd), !du)}
    />
  )
}

export default function ChonEmGiao({ ds, chon, onDoi }: { ds: EmLop[]; chon: ReadonlySet<string>; onDoi: (s: Set<string>) => void }) {
  const id = useId()
  const [mo, setMo] = useState(false)
  const [tim, setTim] = useState('')
  const [moNhanh, setMoNhanh] = useState<Set<string>>(() => new Set())
  const khung = useRef<HTMLDivElement>(null)
  const nutMo = useRef<HTMLButtonElement>(null)
  const oTim = useRef<HTMLInputElement>(null)

  const dsKhoi = useMemo(() => [...new Set(ds.map((e) => e.khoi))].sort(soSanh), [ds])
  const lopTheoKhoi = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const e of ds) if (!(m.get(e.khoi) ?? []).includes(e.tenLop)) m.set(e.khoi, [...(m.get(e.khoi) ?? []), e.tenLop])
    for (const v of m.values()) v.sort(soSanh)
    return m
  }, [ds])

  const doiNhieu = (sbd: string[], nhan: boolean) => {
    const s = new Set(chon)
    for (const x of sbd) {
      if (nhan) s.add(x)
      else s.delete(x)
    }
    onDoi(s)
  }
  const gap = (khoa: string) =>
    setMoNhanh((cu) => {
      const s = new Set(cu)
      if (s.has(khoa)) s.delete(khoa)
      else s.add(khoa)
      return s
    })

  // Mở tấm: nhánh khối đang có em được chọn tự mở sẵn; tiêu điểm vào ô tìm.
  const moTam = () => {
    setMoNhanh((cu) => {
      const s = new Set(cu)
      for (const k of dsKhoi) if (ds.some((e) => e.khoi === k && chon.has(e.sbd))) s.add(`k:${k}`)
      return s
    })
    setMo(true)
  }
  useEffect(() => {
    if (!mo) return
    oTim.current?.focus()
    const bam = (e: MouseEvent) => {
      if (khung.current && !khung.current.contains(e.target as Node)) setMo(false)
    }
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMo(false)
        nutMo.current?.focus()
      }
    }
    document.addEventListener('mousedown', bam)
    document.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('mousedown', bam)
      document.removeEventListener('keydown', phim)
    }
  }, [mo])

  const t = khongDau(tim.trim())
  const emKhop = useMemo(
    () =>
      t
        ? ds.filter((e) => khongDau(e.hoTen).includes(t) || e.sbd.includes(t) || khongDau(e.tenLop).includes(t)).sort((a, b) => soSanh(a.tenLop, b.tenLop) || soSanh(a.hoTen, b.hoTen))
        : ds,
    [ds, t],
  )
  const nhom = useMemo(() => nhomDaChon(ds, chon), [ds, chon])
  const soChon = ds.filter((e) => chon.has(e.sbd)).length
  const lopCoChon = useMemo(() => {
    const ra: { lop: string; chon: number; tong: number }[] = []
    for (const k of dsKhoi)
      for (const l of lopTheoKhoi.get(k) ?? []) {
        const lop = ds.filter((e) => e.khoi === k && e.tenLop === l)
        const n = lop.filter((e) => chon.has(e.sbd)).length
        if (n) ra.push({ lop: l, chon: n, tong: lop.length })
      }
    return ra
  }, [ds, chon, dsKhoi, lopTheoKhoi])

  const hangEm = (e: EmLop, sau: number, coLop: boolean) => (
    <li key={e.sbd} className="cd-cay-hang" style={{ paddingLeft: 8 + 24 * sau }} role="treeitem" aria-selected={chon.has(e.sbd)}>
      <span className="cd-cay-gap" aria-hidden="true" />
      <label className="cd-cay-nhan">
        <input type="checkbox" checked={chon.has(e.sbd)} onChange={() => doiNhieu([e.sbd], !chon.has(e.sbd))} />
        <span className="cd-cay-ten">
          {e.hoTen || e.sbd}
          <small className="cd-so">
            {' '}
            · {coLop ? `${e.tenLop} · ` : ''}
            {e.sbd}
          </small>
        </span>
      </label>
    </li>
  )

  return (
    <div className="cd-chon-em" data-khoi="chon-em-giao" ref={khung}>
      <div className={`cd-o-chon${mo ? ' cd-o-chon--mo' : ''}`}>
        <div className="cd-the-nhom" role="group" aria-label="Nhóm em đã chọn">
          {nhom.length === 0 && <span className="cd-phu">Bấm “Chọn em” để chọn khối, lớp hoặc từng em</span>}
          {nhom.map((n) => (
            <span key={n.khoa} className="cd-the-chon" data-nhom={n.khoa}>
              <span className="cd-so">
                {n.nhan} · {n.sbd.length === n.tong ? `${n.tong} em` : `${n.sbd.length}/${n.tong} em`}
              </span>
              <button type="button" className="cd-the-xoa" aria-label={`Bỏ ${n.nhan}`} onClick={() => doiNhieu(n.sbd, false)}>
                ×
              </button>
            </span>
          ))}
        </div>
        <button
          ref={nutMo}
          type="button"
          className="cd-nut-mo-chon"
          aria-haspopup="tree"
          aria-expanded={mo}
          aria-controls={`${id}-tam`}
          onClick={() => (mo ? setMo(false) : moTam())}
        >
          <span>{mo ? 'Đóng' : 'Chọn em'}</span>
          <span aria-hidden="true" className="cd-mui">
            ▾
          </span>
        </button>
      </div>

      {mo && (
        <div className="cd-tam-chon" id={`${id}-tam`} role="dialog" aria-label="Chọn em nhận chiến dịch">
          <input
            ref={oTim}
            type="search"
            className="cd-tim-em"
            value={tim}
            placeholder="Tìm tên, SBD hoặc lớp"
            aria-label="Tìm em"
            onChange={(e) => setTim(e.target.value)}
          />
          <ul className="cd-cay" role="tree" aria-label="Khối › Lớp › Em">
            {t
              ? emKhop.map((e) => hangEm(e, 0, true))
              : dsKhoi.map((k) => {
                  const emKhoi = ds.filter((e) => e.khoi === k)
                  const moK = moNhanh.has(`k:${k}`)
                  const soK = emKhoi.filter((e) => chon.has(e.sbd)).length
                  return (
                    <li key={k} role="treeitem" aria-expanded={moK} aria-selected={soK === emKhoi.length}>
                      <div className="cd-cay-hang cd-cay-hang--khoi">
                        <button type="button" className="cd-cay-gap" aria-label={`${moK ? 'Gập' : 'Mở'} ${tenKhoi(k)}`} aria-expanded={moK} onClick={() => gap(`k:${k}`)}>
                          <span aria-hidden="true">{moK ? '▾' : '›'}</span>
                        </button>
                        <label className="cd-cay-nhan">
                          <OTich nhan={tenKhoi(k)} ds={emKhoi} chon={chon} onDoi={doiNhieu} />
                          <span className="cd-cay-ten">
                            <b>{tenKhoi(k)}</b>
                          </span>
                        </label>
                        <span className="cd-so cd-cay-dem">
                          {soK} / {emKhoi.length} em
                        </span>
                      </div>
                      {moK && (
                        <ul role="group">
                          {(lopTheoKhoi.get(k) ?? []).map((l) => {
                            const emLop = emKhoi.filter((e) => e.tenLop === l)
                            const moL = moNhanh.has(`l:${k}|${l}`)
                            const soL = emLop.filter((e) => chon.has(e.sbd)).length
                            return (
                              <li key={l} role="treeitem" aria-expanded={moL} aria-selected={soL === emLop.length}>
                                <div className={`cd-cay-hang${soL === emLop.length ? ' cd-cay-hang--chon' : ''}`} style={{ paddingLeft: 32 }}>
                                  <button type="button" className="cd-cay-gap" aria-label={`${moL ? 'Gập' : 'Mở'} ${l}`} aria-expanded={moL} onClick={() => gap(`l:${k}|${l}`)}>
                                    <span aria-hidden="true">{moL ? '▾' : '›'}</span>
                                  </button>
                                  <label className="cd-cay-nhan">
                                    <OTich nhan={l} ds={emLop} chon={chon} onDoi={doiNhieu} />
                                    <span className="cd-cay-ten">{l}</span>
                                  </label>
                                  <span className="cd-so cd-cay-dem">
                                    {soL} / {emLop.length} em
                                  </span>
                                </div>
                                {moL && <ul role="group">{emLop.sort((a, b) => soSanh(a.hoTen, b.hoTen)).map((e) => hangEm(e, 2, false))}</ul>}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })}
            {t && emKhop.length === 0 && <li className="cd-phu">Không có em nào khớp “{tim.trim()}”.</li>}
          </ul>
          <div className="cd-tam-chan">
            <span className="cd-phu">{t ? `${emKhop.length} em khớp` : 'Bấm › để chọn từng em'}</span>
            <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => doiNhieu(emKhop.map((e) => e.sbd), true)}>
              Chọn hết
            </button>
            <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => doiNhieu(emKhop.map((e) => e.sbd), false)}>
              Bỏ chọn hết
            </button>
            <button
              type="button"
              className="m3-nut-chinh cd-nut-nho"
              onClick={() => {
                setMo(false)
                nutMo.current?.focus()
              }}
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {lopCoChon.length > 0 && (
        <div className="cd-tom-lop" data-khoi="em-da-chon-theo-lop">
          <span className="cd-nhan-nhom">Em đã chọn theo lớp</span>
          {lopCoChon.map((l) => (
            <div key={l.lop} className="cd-tom-lop-hang">
              <div className="cd-tom-lop-chu">
                <span>{l.lop}</span>
                <b className="cd-so">{l.chon === l.tong ? `${l.tong} em` : `${l.chon} / ${l.tong} em`}</b>
              </div>
              <div className="cd-thanh" aria-hidden="true">
                <div style={{ width: `${(100 * l.chon) / Math.max(1, l.tong)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <small className="cd-so cd-phu" data-so="so-em-chon">
        {soChon === 0 ? 'Chưa chọn em nào' : `Đã chọn ${soChon}/${ds.length} em`}
      </small>
    </div>
  )
}
