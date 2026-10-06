// CHỌN LỚP NHẬN BÀI — ô tick xổ xuống xếp theo KHỐI 10 · 11 · 12 (thầy 06/10: "tích chọn được nhiều lớp … chỗ chọn lớp xếp theo khối 10,11,12 ô tick xổ xuống là các lớp").
// Cùng kiểu, cùng lớp CSS với ô "Chọn em nhận chiến dịch" của màn Giao (`ChonEmGiao`, bản vẽ thầy chốt 28/09): ô đóng hiện thẻ các lớp đã chọn (bấm × bỏ lớp) + nút "Chọn lớp";
// bấm ⇒ tấm bật ra: cây Khối › Lớp, ô tích ba trạng thái ở khối (tích cả khối), tích từng lớp; Esc / bấm ra ngoài / "Xong" đóng.
// Cây bài của mỗi KHỐI một khác ⇒ mỗi lần chỉ chọn lớp CÙNG KHỐI: tích lớp của khối khác ⇒ chọn lại từ đầu, kèm một dòng báo (aria-live). Thuần giao diện:
// luật chọn nằm ở `doiChonLop` / `doiChonKhoi` (src/lib/bai-hom-nay.ts, có test).
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { doiChonKhoi, doiChonLop, type LopChonDuoc } from '../../lib/bai-hom-nay'
import '../chien-dich/chien-dich.css'

const tenKhoi = (k: string) => `Khối ${k}`
const GHI_CHU_MAC_DINH = 'Cây bài mỗi khối một khác nên mỗi lần chỉ chọn các lớp cùng khối.'

/** Ô tích ba trạng thái (đủ / một phần / trống) của một khối. */
function OTichKhoi({ nhan, soChon, tong, onDoi }: { nhan: string; soChon: number; tong: number; onDoi: (nhan: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const du = tong > 0 && soChon === tong
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = soChon > 0 && !du
  }, [soChon, du])
  return <input ref={ref} type="checkbox" checked={du} aria-label={`${nhan} · ${soChon}/${tong} lớp`} onChange={() => onDoi(!du)} />
}

export default function ChonLopGiao({ dsLop, chon, onDoi }: { dsLop: readonly LopChonDuoc[]; chon: readonly string[]; onDoi: (ds: string[]) => void }) {
  const id = useId()
  const [mo, setMo] = useState(false)
  const [ghiChu, setGhiChu] = useState('')
  const khung = useRef<HTMLDivElement>(null)
  const nutMo = useRef<HTMLButtonElement>(null)
  const tam = useRef<HTMLDivElement>(null)

  const dsKhoi = useMemo(() => [...new Set(dsLop.map((l) => l.khoi))], [dsLop])
  const chonSet = useMemo(() => new Set(chon), [chon])
  const soEmCua = (ten: string) => dsLop.find((l) => l.tenLop === ten)?.soEm

  const ap = (r: { chon: string[]; doiKhoi: boolean }, khoi: string) => {
    onDoi(r.chon)
    setGhiChu(r.doiKhoi ? `Đã chuyển sang ${tenKhoi(khoi)}. ${GHI_CHU_MAC_DINH}` : '')
  }

  useEffect(() => {
    if (!mo) return
    tam.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus()
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

  const dong = () => {
    setMo(false)
    nutMo.current?.focus()
  }

  return (
    <div className="cd-chon-em bhn-chon-lop" data-khoi="chon-lop-giao" ref={khung}>
      <div className={`cd-o-chon${mo ? ' cd-o-chon--mo' : ''}`}>
        <div className="cd-the-nhom" role="group" aria-label="Lớp đã chọn">
          {chon.length === 0 && <span className="cd-phu">Bấm “Chọn lớp” để chọn khối và lớp nhận bài</span>}
          {chon.map((ten) => {
            const n = soEmCua(ten)
            return (
              <span key={ten} className="cd-the-chon" data-lop={ten}>
                <span className="cd-so">
                  {ten}
                  {n ? ` · ${n} em` : ''}
                </span>
                <button type="button" className="cd-the-xoa" aria-label={`Bỏ ${ten}`} onClick={() => ap(doiChonLop(dsLop, chon, ten, false), '')}>
                  ×
                </button>
              </span>
            )
          })}
        </div>
        <button ref={nutMo} type="button" className="cd-nut-mo-chon" aria-haspopup="tree" aria-expanded={mo} aria-controls={`${id}-tam`} onClick={() => setMo(!mo)}>
          <span>{mo ? 'Đóng' : 'Chọn lớp'}</span>
          <span aria-hidden="true" className="cd-mui">
            ▾
          </span>
        </button>
      </div>

      {mo && (
        <div className="cd-tam-chon" id={`${id}-tam`} role="dialog" aria-label="Chọn lớp nhận bài" ref={tam}>
          <ul className="cd-cay" role="tree" aria-label="Khối › Lớp">
            {dsKhoi.map((k) => {
              const lopK = dsLop.filter((l) => l.khoi === k)
              const soK = lopK.filter((l) => chonSet.has(l.tenLop)).length
              return (
                <li key={k} role="treeitem" aria-expanded="true" aria-selected={soK === lopK.length}>
                  <div className="cd-cay-hang cd-cay-hang--khoi">
                    <label className="cd-cay-nhan">
                      <OTichKhoi nhan={tenKhoi(k)} soChon={soK} tong={lopK.length} onDoi={(nhan) => ap(doiChonKhoi(dsLop, chon, k, nhan), k)} />
                      <span className="cd-cay-ten">
                        <b>{tenKhoi(k)}</b>
                      </span>
                    </label>
                    <span className="cd-so cd-cay-dem">
                      {soK} / {lopK.length} lớp
                    </span>
                  </div>
                  <ul role="group">
                    {lopK.map((l) => {
                      const co = chonSet.has(l.tenLop)
                      return (
                        <li key={l.tenLop} role="treeitem" aria-selected={co}>
                          <div className={`cd-cay-hang${co ? ' cd-cay-hang--chon' : ''}`} style={{ paddingLeft: 28 }}>
                            <label className="cd-cay-nhan">
                              <input type="checkbox" checked={co} aria-label={`${l.tenLop}${l.soEm ? ` · ${l.soEm} em` : ''}`} onChange={() => ap(doiChonLop(dsLop, chon, l.tenLop, !co), k)} />
                              <span className="cd-cay-ten">{l.tenLop}</span>
                            </label>
                            {l.soEm > 0 && <span className="cd-so cd-cay-dem">{l.soEm} em</span>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
            {dsKhoi.length === 0 && <li className="cd-phu">Chưa có lớp nào (tên lớp cần bắt đầu bằng 10, 11 hoặc 12).</li>}
          </ul>
          <div className="cd-tam-chan">
            <span className="cd-phu" aria-live="polite" data-khoi="ghi-chu-khoi">
              {ghiChu || GHI_CHU_MAC_DINH}
            </span>
            <button type="button" className="m3-nut-chu cd-nut-nho" disabled={chon.length === 0} onClick={() => ap({ chon: [], doiKhoi: false }, '')}>
              Bỏ chọn hết
            </button>
            <button type="button" className="m3-nut-chinh cd-nut-nho" onClick={dong}>
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
