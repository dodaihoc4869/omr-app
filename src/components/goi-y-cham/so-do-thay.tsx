// KHỐI VẼ DÙNG CHUNG cho «Gợi ý 3 tầng» (trước khi nộp) và «Lời giải kiểu sơ đồ» (sau khi nộp) — làn B, 26/10.
//   SoDoThay  : Tóm tắt của thầy Đỗ Đại Học — vẽ đúng ảnh cận cảnh docs/ban-ve-doc-de-2610/bang/doc-de-7b-tom-tat-can-canh.png
//               (tổng lượng bên TRÁI vạch dọc · chất · số liệu xếp cột dọc · mũi tên, H ghi TRÊN mũi tên · đại lượng hỏi tô hổ phách).
//   ChuoiTinh : Một phép tính — chạm từng thừa số ⇒ dãy từ đầu tới số đó sáng + bóng giải thích + danh sách nghĩa đánh dấu ✓.
//   ThiNghiemAo: 3 khung cốc (SVG nhẹ), nút phát lại.
// Chữ dữ liệu là chữ thường (không HTML); công thức viết `_` `^` kiểu đơn giản («FeS_2», «10^-6»).
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import type { BuocTinh, SoDo } from '../../lib/goi-y-cham/kieu'
import { BieuTuong } from './bieu-tuong'

// `_` sau là TÊN chất («n_paracetamol», «n_p-nitrophenol») ⇒ cả tên là chỉ số dưới (thầy 27/10, ảnh: trước hiện «n_paracetamol» thô, «n_p» hạ mỗi chữ p).
const CHI_SO = /_(\{[^}]*\}|[0-9]+|[\p{Ll}][\p{L}\p{N}()\-]+(?![_\p{L}\p{N}])|[A-Z][A-Za-z0-9()]*|[A-Za-z](?![a-z]))|\^(\{[^}]*\}|[-−+]?[0-9]*[+\-−]?)/gu
const CS_DUOI: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
/** (Không dùng regex nhìn-lùi: Safari < 16.4 không chạy — tests/khong-cu-phap-may-cu-2109.) Công thức trong chỉ số dưới («H2SO4») ⇒ số sau chữ thành chỉ số Unicode («H₂SO₄») — n<sub>H₂SO₄</sub> gọn, không lồng <sub> (thầy 27/10). */
const hoaChiSo = (v: string) => (/^[A-Z(]/.test(v) ? v.replace(/([A-Za-z)\]])(\d+)/g, (_m, a: string, d: string) => a + [...d].map((c) => CS_DUOI[c] ?? c).join('')) : v)
const MU: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '−': '⁻', '+': '⁺' }
/** Chữ có `_x` (chỉ số dưới) / `^x` (số mũ) → React; không có ⇒ trả nguyên chuỗi. */
export function ChuCo({ chu }: { chu: string }): ReactNode {
  if (!/[_^]/.test(chu)) return chu
  const ra: ReactNode[] = []
  let cuoi = 0
  for (const m of chu.matchAll(CHI_SO)) {
    if (m.index! > cuoi) ra.push(chu.slice(cuoi, m.index))
    const goc = (m[1] ?? m[2]).replace(/^\{|\}$/g, '')
    const v = m[1] !== undefined ? goc : goc.replace(/-/g, '−')
    // Số mũ chỉ gồm chữ số / dấu ⇒ ký tự mũ Unicode («10⁶»), không dùng <sup>: trong khung flex của sơ đồ <sup> bị đẩy lên cao (thầy 27/10, ảnh «mũ 6»).
    if (m[2] !== undefined && /^[0-9+\-−]+$/.test(v)) ra.push([...v].map((c) => MU[c] ?? c).join(''))
    else ra.push(m[1] !== undefined ? <sub key={m.index} className="gyc-cs">{hoaChiSo(v)}</sub> : <sup key={m.index}>{v}</sup>)
    cuoi = m.index! + m[0].length
  }
  ra.push(chu.slice(cuoi))
  return <>{ra}</>
}
/** Bề rộng hiện (đơn vị ~ch) của một thừa số: phần chỉ số dưới / mũ vẽ nhỏ (~0,7) ⇒ cột số không rộng thừa. */
const doDaiHien = (so: string) => {
  let nho = 0
  const goc = so.replace(CHI_SO, (m) => { nho += m.length - 1; return '' })
  return Math.ceil(goc.length + nho * 0.7)
}
/** Chữ giải nghĩa: kí hiệu đại lượng kiểu «n_paracetamol», «m_{CO2}» lẫn trong câu ⇒ chỉ số dưới (ChuCo); phần còn lại ChemText như cũ. */
const RE_KI_HIEU = /([A-Za-zΔ]+_(?:\{[^}]*\}|[^\s,;:)]+))/u
export function ChuTron({ chu }: { chu: string }) {
  if (!chu.includes('_')) return <ChemText text={chu} />
  return <>{chu.split(RE_KI_HIEU).map((p, i) => (i % 2 ? <ChuCo key={i} chu={p} /> : p ? <ChemText key={i} text={p} /> : null))}</>
}
/** Công thức chất: có `_`/`^` ⇒ ChuCo; viết liền kiểu «FeS2» ⇒ ChemText tự hạ chỉ số như đề. */
export function CongThuc({ chu }: { chu: string }) {
  return /[_^]/.test(chu) ? <ChuCo chu={chu} /> : <ChemText text={chu} />
}
const laHoi = (s?: string) => !!s && s.includes('?')

export function SoDoThay({ soDo }: { soDo: SoDo }) {
  const tom = soDo.nut.map((n) => [n.tong, n.chat, ...n.soLieu].filter(Boolean).join(' ')).join(' → ')
  // Thầy 27/10: «Toàn bộ sơ đồ chuyển theo hướng ngang, dài quá thì cuộn» ⇒ LUÔN ngang, khung cuộn ngang (bỏ tự xếp dọc).
  return (
    <div className="gyc-sd" role="img" tabIndex={0} aria-label={`Tóm tắt: ${tom}`}>
      {soDo.nut.map((n, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <div className="gyc-sd-mui">{soDo.muiTen[i - 1]?.H ? <span className="gyc-sd-H">H = {String(soDo.muiTen[i - 1].H).replace('.', ',')}%</span> : null}</div>
          )}
          <div className={`gyc-sd-cot${n.tong ? ' gyc-co-goc' : ''}`}>
            {n.tong && <span className={`gyc-sd-goc${laHoi(n.tong) ? ' gyc-hoi-sd' : ''}`}><span><ChuCo chu={n.tong} /></span></span>}
            <div className="gyc-sd-so">
              <span className="gyc-sd-ct"><CongThuc chu={n.chat} /></span>
              {n.soLieu.map((s, j) => <span key={j} className={`gyc-sd-sl${laHoi(s) ? ' gyc-hoi-sd' : ''}`}><ChuCo chu={s} /></span>)}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

/** Quy ước của thầy: tính xuôi × H/100 · tính ngược × 100/H (chip đậm = chiều của bài). Không có hiệu suất ⇒ không vẽ. */
export function QuyUoc({ soDo }: { soDo: SoDo }) {
  if (!soDo.muiTen.some((m) => m.H)) return null
  return (
    <div className="gyc-quy-uoc">
      <span className={`gyc-chip ${soDo.chieu === 'xuoi' ? 'gyc-dung' : 'gyc-vien'}`}>Tính xuôi: × H/100</span>
      <span className={`gyc-chip ${soDo.chieu === 'nguoc' ? 'gyc-dung' : 'gyc-vien'}`}>Tính ngược: × 100/H</span>
    </div>
  )
}

const PHAN_SO = /^([^/\s]+)\/([^/\s]+)$/
function Thua({ so, tt, onCham, nhan }: { so: string; tt: '' | 'qua' | 'dang' | 'sau'; onCham: () => void; nhan: string }) {
  const ps = so.match(PHAN_SO)
  return (
    <button type="button" className={`gyc-thua${ps ? ' gyc-ps' : ''}${tt ? ` gyc-${tt}` : ''}`} aria-pressed={tt === 'dang'} aria-label={nhan} onClick={onCham}>
      {ps ? <><b><ChuCo chu={ps[1]} /></b><i><ChuCo chu={ps[2]} /></i></> : <span><ChuCo chu={so} /></span>}
    </button>
  )
}

/**
 * Một bước tính. `hienKetQua` CHỈ bật sau khi nộp (lời giải) — trước khi nộp luôn «= ?», dù dữ liệu có `ketQua` hay không.
 * `ten` của bước: «m», «n_{CO2}»… (đứng trước dấu =).
 */
export function ChuoiTinh({ buoc, stt, nhieu, hienKetQua }: { buoc: BuocTinh; stt: number; nhieu: boolean; hienKetQua: boolean }) {
  const [dang, setDang] = useState<number | null>(null)
  const tt = (i: number) => (dang === null ? '' : i < dang ? 'qua' : i === dang ? 'dang' : 'sau') as '' | 'qua' | 'dang' | 'sau'
  const ketQua = hienKetQua && buoc.ketQua ? `${buoc.ketQua}${buoc.donVi ? ` ${buoc.donVi}` : ''}` : ''
  const than = (
    <>
      <div className="gyc-chuoi" role="group" aria-label={nhieu ? `Bước ${stt}` : 'Một phép tính'}>
        <span className="gyc-nhan"><ChuCo chu={buoc.ten} /> =</span>
        {buoc.thuaSo.map((x, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="gyc-nhan" aria-hidden="true">·</span>}
            <Thua so={x.so} tt={tt(i)} nhan={`Thừa số ${i + 1}: ${x.so}`} onCham={() => setDang((d) => (d === i ? null : i))} />
          </Fragment>
        ))}
        {ketQua ? <span className="gyc-nhan gyc-ket">= {ketQua}</span> : <span className="gyc-nhan gyc-bang">= ?</span>}
      </div>
      <div className="gyc-y-nghia" style={{ '--gyc-cot-so': `${Math.min(14, Math.max(5, ...buoc.thuaSo.map((x, i) => doDaiHien(x.so) + (i ? 2 : 0)))) + 1}ch` } as CSSProperties}>
        {buoc.thuaSo.map((x, i) => (
          <div key={i} className={`gyc-dong-yn${tt(i) ? ` gyc-${tt(i)}` : ''}`}>
            <span className="gyc-tt">{tt(i) === 'qua' ? <BieuTuong ten="check" /> : i + 1}</span>
            <span className="gyc-ps-chu">{i ? '· ' : ''}<ChuCo chu={x.so} /></span>
            <span><ChuTron chu={x.nghia} />{x.denDay ? <small className="gyc-den-day"> · <ChuTron chu={x.denDay} /></small> : null}</span>
          </div>
        ))}
      </div>
    </>
  )
  return nhieu ? <div className="gyc-bt"><div className="gyc-bt-ten">Bước {stt} · <ChuCo chu={buoc.ten} /></div>{than}</div> : than
}

/** Cốc dung dịch (SVG, chỉ biến màu): `muc` = chiều cao dung dịch, `bot` = số bọt khí. */
function Coc({ muc, bot }: { muc: number; bot: number }) {
  const vt = [[26, 70], [44, 78], [58, 66], [34, 56], [52, 50], [22, 46], [40, 40]]
  return (
    <svg viewBox="0 0 84 96" aria-hidden="true">
      <path d="M42 6 C38 13 38 17 42 19 C46 17 46 13 42 6Z" fill="var(--tr-tin)" />
      <rect x="38" y="0" width="8" height="5" rx="2" fill="var(--tr-chu-3)" />
      <rect x="14" y={88 - muc} width="56" height={muc} rx="6" fill="var(--tr-tin-nhat)" />
      {vt.slice(0, bot).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5 + (i % 3)} fill="none" stroke="var(--tr-chu-2)" strokeWidth="1.4" />)}
      <path d="M12 26 V84 a6 6 0 0 0 6 6 H66 a6 6 0 0 0 6-6 V26" fill="none" stroke="var(--tr-chu-3)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/** Thí nghiệm ảo 2–3 khung; «Phát lại» chạy lần lượt từng khung (máy bật giảm chuyển động ⇒ nhảy thẳng khung cuối). */
export function ThiNghiemAo({ khung }: { khung: { tieuDe: string; moTa: string }[] }) {
  const n = khung.length
  const [dang, setDang] = useState(n - 1)
  const hen = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearInterval(hen.current), [])
  const phat = () => {
    window.clearInterval(hen.current)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setDang(n - 1); return }
    setDang(0)
    let i = 0
    hen.current = window.setInterval(() => { i++; setDang(i); if (i >= n - 1) window.clearInterval(hen.current) }, 900)
  }
  const muc = (i: number) => 46 + Math.round((14 * i) / Math.max(1, n - 1))
  return (
    <div className="gyc-tna" aria-label="Thí nghiệm ảo">
      <div className="gyc-tna-khung" style={{ ['--gyc-n' as string]: n }}>
        {khung.map((k, i) => (
          <div key={i} className={`gyc-tna-buoc${i === dang ? ' gyc-dang' : ''}`} aria-current={i === dang ? 'step' : undefined}>
            <Coc muc={i <= dang ? muc(i) : 40} bot={i === n - 1 && dang === n - 1 ? 7 : 0} />
            <b><ChemText text={k.tieuDe} /></b>
            <span><ChemText text={k.moTa} /></span>
          </div>
        ))}
      </div>
      <div className="gyc-tna-thanh">
        <button type="button" className="gyc-nut gyc-vuong" aria-label="Phát lại thí nghiệm" onClick={phat}><BieuTuong ten="play" /></button>
        <div className="gyc-tna-vach" role="progressbar" aria-label="Tiến trình thí nghiệm" aria-valuemin={1} aria-valuemax={n} aria-valuenow={dang + 1}><i style={{ width: `${((dang + 1) / n) * 100}%` }} /></div>
      </div>
    </div>
  )
}
