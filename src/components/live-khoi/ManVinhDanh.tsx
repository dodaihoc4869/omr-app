// LIVE THEO KHỐI — MÀN VINH DANH khi thầy kết thúc buổi live (thầy 12/11: «kết thúc buổi live có vinh danh đội chiến thắng ngầu và siêu đẹp»).
// Dùng chung máy em và máy thầy. kJ là kJ THẬT của buổi (luật Bình Phản Ứng giữ nguyên), phòng gửi lần cuối lúc kết thúc. Chuyển động chỉ transform + opacity.
import { useEffect, useMemo, type CSSProperties } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import type { NguoiLop } from '../../lib/live-khoi/kieu'
import { saoBuoi, xepHangDoi } from '../../lib/live-khoi/vinh-danh'
import './man-vinh-danh.css'

// 26 mảnh pháo giấy: lệch ngang / trễ / cỡ cố định (không ngẫu nhiên ⇒ ảnh chụp ổn định).
const MANH = Array.from({ length: 26 }, (_, i) => ({ x: (i * 37) % 100, d: (i * 173) % 2400, s: 0.7 + ((i * 29) % 7) / 10, m: i % 4 }))
const Lua = () => (
  <svg className="vd-lua" viewBox="0 0 64 80" aria-hidden="true">
    <path className="n" d="M32 4C35 17 50 25 54 40c4 17-7 34-22 34S6 57 10 40c2-8 7-12 9-19 3 7 6 10 9 11-1-10 1-19 4-28z" />
    <path className="g" d="M32 28c2 9 12 14 14 24 2 12-5 21-14 21s-16-9-14-21c1-5 4-9 6-13 1 4 3 7 6 8-1-7 0-13 2-19z" />
    <path className="l" d="M32 47c2 6 8 9 8 16a8 8 0 0 1-16 0c0-7 6-10 8-16z" />
  </svg>
)

export default function ManVinhDanh({ ds, kj, toi, onDong }: { ds: readonly NguoiLop[]; kj: readonly number[]; toi: NguoiLop | null; onDong: () => void }) {
  const hang = useMemo(() => xepHangDoi(ds, kj), [ds, kj])
  const sao = useMemo(() => saoBuoi(ds), [ds])
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onDong() }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [onDong])
  const nhat = hang.filter((x) => x.hang === 1), dau = nhat[0]
  if (!dau) return <div className="vd" role="dialog" aria-modal="true" aria-label="Kết thúc buổi live"><div className="vd-than"><h2>Buổi live đã kết thúc</h2><button type="button" className="vd-nut" onClick={onDong}>Đóng</button></div></div>
  const hoa = nhat.length > 1, toiHang = toi ? hang.find((x) => x.doi === toi.doi) : null
  const toiThang = !!toiHang && toiHang.hang === 1
  const cao = Math.max(1, dau.kj)
  const mau = (d: number): CSSProperties => ({ ['--doi' as string]: `var(${DOI_BPU[d]?.mau ?? '--p-cam'})` })
  return (
    <div className="vd" role="dialog" aria-modal="true" aria-label="Vinh danh đội thắng" style={mau(dau.doi)}>
      <div className="vd-phao" aria-hidden="true">{MANH.map((m, i) => <i key={i} style={{ left: `${m.x}%`, animationDelay: `${m.d}ms`, ['--s' as string]: m.s, ...mau(hoa ? nhat[i % nhat.length]!.doi : m.m === 3 ? dau.doi : dau.doi) }} data-k={m.m} />)}</div>
      <div className="vd-than">
        <p className="vd-nhan">Kết thúc buổi live</p>
        <div className="vd-cup">{nhat.map((x) => <span key={x.doi} className="vd-ngon" style={mau(x.doi)}><i className="vd-hao" /><Lua /><b>{DOI_BPU[x.doi]?.ky}</b></span>)}</div>
        <h2>{hoa ? `${nhat.map((x) => DOI_BPU[x.doi]?.ten).join(' · ')} cùng về nhất` : `${DOI_BPU[dau.doi]?.ten} chiến thắng`}</h2>
        <p className="vd-kj"><b>{dau.kj}</b> kJ{toi ? <span> · {toiThang ? 'Đội của em về nhất' : `Đội của em về thứ ${toiHang?.hang ?? hang.length}`}</span> : null}</p>
        <ol className="vd-bang" aria-label="Xếp hạng bốn đội">
          {hang.map((x) => (
            <li key={x.doi} style={mau(x.doi)} data-toi={toi?.doi === x.doi || undefined} data-nhat={x.hang === 1 || undefined}>
              <span className="vd-h">{x.hang}</span><span className="vd-t">{DOI_BPU[x.doi]?.ten}<small>{x.soEm} em</small></span>
              <span className="vd-thanh"><i style={{ transform: `scaleX(${Math.max(0.04, x.kj / cao)})` }} /></span><b>{x.kj} kJ</b>
            </li>
          ))}
        </ol>
        {sao.length ? <p className="vd-sao"><span>Ngôi sao buổi học</span>{sao.map((e, i) => <em key={e.sbd} style={mau(e.doi)} data-toi={toi?.sbd === e.sbd || undefined}>{i + 1}. {e.ten} · {Math.round(e.kj ?? 0)} kJ</em>)}</p> : null}
        <button type="button" className="vd-nut" onClick={onDong}>Đóng</button>
      </div>
    </div>
  )
}
