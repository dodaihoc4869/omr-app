// HỎI NHANH «Hiểu chưa?» — MÁY THẦY (phím /, bản vẽ 40–41): «bầu trời» ở phần bảng 1/3 bên phải; mỗi em trả lời là một đốm sáng bay vào cụm xanh
// (hiểu) hoặc cam (chưa hiểu), hai con số to phát sáng đếm lên, thanh «đã trả lời», tên các em CHƯA HIỂU (chỉ máy thầy có). Dựng = mở câu hỏi cho cả
// lớp; gỡ (bấm / lần nữa) = đóng. Không bắt chạm ⇒ thầy vẫn viết bảng bình thường.
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import type { KenhLop } from '../../lib/live-khoi/kieu'
import { NHAC_MS, bam01, choDom, docTraLoi, type TinHoiHieu } from './hoi-hieu'
import './hoi-hieu.css'

const SAO: [number, number][] = [[8, 20], [30, 12], [52, 26], [71, 15], [90, 24], [16, 62], [44, 68], [63, 60], [86, 65], [36, 44], [95, 46], [5, 42]]
const DOM_TOI_DA = 70
interface TraLoi { v: 1 | 2; ten: string; tt: number }

export default function HoiHieuThay({ kenh, tong }: { kenh: KenhLop; /** số em đang trong buổi */ tong: number }) {
  const [n] = useState(() => Math.floor(Date.now() / 1000) % 2_000_000_000)
  const [tl, setTl] = useState<Record<string, TraLoi>>({})
  useEffect(() => {
    const mo = (): void => kenh.gui('hieu', { mo: true, n } satisfies TinHoiHieu)
    mo()
    const nhac = setInterval(mo, NHAC_MS)
    const go = kenh.nghe('hieu', (t) => {
      const d = docTraLoi(t.x)
      if (!d || d.n !== n || !t.s || t.s === 'gv') return
      setTl((c) => ({ ...c, [t.s]: { v: d.v, ten: t.n || t.s, tt: c[t.s]?.tt ?? Object.keys(c).length } }))
    })
    return () => { clearInterval(nhac); go(); kenh.gui('hieu', { mo: false, n } satisfies TinHoiHieu) }
  }, [kenh, n])
  const { a, b, dom, chua } = useMemo(() => {
    const ds = Object.entries(tl).sort((x, y) => x[1].tt - y[1].tt), dem = { a: 0, b: 0 }
    const dom = ds.map(([sbd, t]) => { const ben = t.v === 1 ? 'a' as const : 'b' as const, cho = choDom(ben, dem[ben]); dem[ben] += 1; return { sbd, ben, ...cho } })
    return { a: dem.a, b: dem.b, dom: dom.slice(-DOM_TOI_DA), chua: ds.filter(([, t]) => t.v === 2).map(([, t]) => t.ten) }
  }, [tl])
  const da = a + b, mau = Math.max(tong, da, 1), xong = tong > 0 && da >= tong
  return createPortal(
    <div className="hh-lop" data-hoi-hieu="thay" style={MAU_CHIEU as CSSProperties}>
      <section className="hh-troi" role="status" aria-label={`Hiểu chưa: ${a} em hiểu, ${b} em chưa hiểu, ${da} trên ${mau} em đã trả lời`}>
        <h3>Hiểu chưa?<small>{xong ? 'Cả lớp đã trả lời' : da ? 'Các em đang trả lời…' : 'Đang chờ các em bấm 1 hoặc 2…'}</small></h3>
        {SAO.map(([x, y], i) => <i key={i} className="hh-sao" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.45}s` }} />)}
        <div className="hh-cot a"><span key={a} className="hh-so">{a}</span><div className="hh-nh"><kbd>1</kbd>Hiểu</div></div>
        <div className="hh-cot b"><span key={b} className="hh-so">{b}</span><div className="hh-nh"><kbd>2</kbd>Chưa hiểu</div></div>
        {dom.map((d) => {
          const c = 15 + Math.round(bam01(d.sbd) * 10), g = bam01(d.sbd, 7) * Math.PI * 2
          return <i key={`${d.sbd}${d.ben}`} className={`hh-dom ${d.ben}`} style={{ left: `${d.x}%`, top: `${d.y}%`, ['--c' as string]: `calc(${c} * var(--k))`, ['--tx' as string]: `${Math.round(Math.cos(g) * 260)}px`, ['--ty' as string]: `${Math.round(120 + Math.abs(Math.sin(g)) * 240)}px`, ['--tre' as string]: `${-bam01(d.sbd, 3) * 3}s` }} />
        })}
        <div className="hh-vong">
          <div className="hh-ray"><i className="a" style={{ width: `${(a / mau) * 100}%` }} /><i className="b" style={{ width: `${(b / mau) * 100}%` }} /></div>
          <p><b>{da}/{mau}</b> em đã trả lời{da ? <> · <b>{Math.round((a / da) * 100)} %</b> hiểu</> : null}</p>
        </div>
        <div className="hh-ten">{chua.length ? <em>Chưa hiểu:</em> : null}{chua.map((t, i) => <span key={`${t}${i}`}>{t}</span>)}</div>
        <div className="hh-chan">Bấm <kbd>/</kbd> lần nữa để đóng</div>
      </section>
    </div>,
    document.body,
  )
}
