// THẺ «HÌNH CỦA ĐỀ · VẼ LẠI» (thầy 03/11): cảnh vector do máy vẽ điền, app vẽ bằng SVG; hoạt hoạ chạy MỘT lượt (nhịp), máy yếu / giảm chuyển động ⇒ tĩnh.
// Mảnh nạp lười — nơi gọi dùng `React.lazy`. Màu CHỈ biến --tr-* của app học sinh. Chữ KHÔNG đè hình: toạ độ chọn sẵn + xếp nhãn tự nhích (xepNhan).
import { useEffect, useState } from 'react'
import type { CanhDoThi, CanhFischer, CanhSoDo, CanhThiNghiem, HinhVeLai } from '../../lib/hinh-ve/kieu'
import './hinh-ve.css'

type SoDo = CanhSoDo
type DoThi = CanhDoThi
type ThiNghiem = CanhThiNghiem
type Fischer = CanhFischer

function useNhip(n: number, ms = 900) {
  const [k, setK] = useState(0)
  useEffect(() => { if (k >= n) return; const h = setTimeout(() => setK(k + 1), k === 0 ? 300 : ms); return () => clearTimeout(h) }, [k, n, ms])
  return [k, () => setK(0)] as const
}

function VeSoDo({ v }: { v: SoDo }) {
  const [k] = useNhip(v.noi.length + 1)
  const W = 340, H = 420, X = (x: number) => (x / 100) * W, Y = (y: number) => 18 + (y / 100) * (H - 36)
  const o = new Map(v.o.map((b) => [b.id, b]))
  const hien = (id: string) => v.noi.findIndex((n) => n.den === id) < k || !v.noi.some((n) => n.den === id)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hv-svg" role="img" aria-label="Sơ đồ chuyển hoá">
      <defs><marker id="hv-mui" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" className="hv-mui" /></marker></defs>
      {v.noi.map((n, i) => {
        const d = o.get(n.den)!
        const ds = n.tu.map((t) => o.get(t)!)
        const sang = i < k
        if (ds.length === 1) {
          const a = ds[0]!, x1 = X(a.x), y1 = Y(a.y) + 16, x2 = X(d.x), y2 = Y(d.y) - 16
          return <g key={i} className="hv-noi" data-sang={sang ? '' : undefined}><path d={`M${x1} ${y1} L${x2} ${y2}`} markerEnd="url(#hv-mui)" pathLength={1} />
            {n.so && <text x={x1 - 10} y={(y1 + y2) / 2 + 5} textAnchor="end" className="hv-so">({n.so})</text>}{n.nhan && <text x={x1 + 10} y={(y1 + y2) / 2 + 5} className="hv-nhan">{n.nhan}</text>}</g>
        }
        const yg = Y(d.y) - 50
        return <g key={i} className="hv-noi" data-sang={sang ? '' : undefined}><path d={ds.map((a) => `M${X(a.x)} ${Y(a.y) + 16} L${X(a.x)} ${yg}`).join(' ') + ` M${X(ds[0]!.x)} ${yg} L${X(ds[ds.length - 1]!.x)} ${yg} M${X(d.x)} ${yg} L${X(d.x)} ${Y(d.y) - 16}`} markerEnd="url(#hv-mui)" pathLength={1} />
          {n.so && <text x={X(d.x) - 10} y={(yg + Y(d.y) - 17) / 2 + 5} textAnchor="end" className="hv-so">({n.so})</text>}</g>
      })}
      {v.o.map((b) => (
        <g key={b.id} className="hv-o" data-hien={hien(b.id) ? '' : undefined} transform={`translate(${X(b.x)} ${Y(b.y)})`}>
          <rect x={-64} y={-17} width={128} height={34} rx={17} /><text y={5} textAnchor="middle">{b.chu}</text>
        </g>
      ))}
    </svg>
  )
}

/** Xếp nhãn KHÔNG ĐÈ (thầy 03/11 «đừng để bị chèn chữ với hình»): ước bề rộng chữ, nhãn nào chạm nhãn đã đặt hoặc đỉnh que khác thì nhích lên 18 px. */
function xepNhan(ds: { x: number; y: number; chu: string }[], co = 12.5) {
  const da: { l: number; r: number; t: number; b: number }[] = []
  return ds.map((d) => {
    const w = d.chu.length * co * 0.58, l = d.x - w / 2, r = d.x + w / 2
    let y = d.y
    for (let lan = 0; lan < 8 && da.some((o) => l < o.r + 4 && o.l < r + 4 && y - co < o.b + 2 && o.t < y + 4); lan++) y -= 18
    da.push({ l, r, t: y - co, b: y + 4 })
    return y
  })
}

function VeDoThi({ v }: { v: DoThi }) {
  const [k] = useNhip(2, 700)
  const W = 340, H = 220, L = 46, B = 186, R = 324, T = 20
  const X = (x: number) => L + ((x - v.truc.xMin) / (v.truc.xMax - v.truc.xMin)) * (R - L), Y = (y: number) => B - (y / v.truc.yMax) * (B - T)
  const yNhan = xepNhan(v.que.map((q) => ({ x: X(q.x), y: Y(q.y) - 8, chu: q.nhan ?? '' })))
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="hv-svg" role="img" aria-label={`Đồ thị ${v.truc.y} theo ${v.truc.x}`}>
      {v.truc.yVach.map((y) => <g key={y}><line x1={L} x2={R} y1={Y(y)} y2={Y(y)} className="hv-luoi" /><text x={L - 6} y={Y(y) + 4} textAnchor="end" className="hv-vach">{y}</text></g>)}
      <line x1={L} x2={R} y1={B} y2={B} className="hv-truc" /><line x1={L} x2={L} y1={B} y2={T - 6} className="hv-truc" />
      {v.truc.xVach.map((x) => <text key={x} x={X(x)} y={B + 16} textAnchor="middle" className="hv-vach">{String(x).replace('.', ',')}</text>)}
      <text x={R} y={B + 32} textAnchor="end" className="hv-nhan-truc">{v.truc.x}</text>
      <text x={16} y={(B + T) / 2} textAnchor="middle" className="hv-nhan-truc" transform={`rotate(-90 16 ${(B + T) / 2})`}>{v.truc.y}</text>
      {v.que.map((q, i) => (
        <g key={i} className="hv-que" data-len={k >= 1 ? '' : undefined} style={{ ['--tre' as string]: `${i * 180}ms` }}>
          <rect x={X(q.x) - 5} y={Y(q.y)} width={10} height={B - Y(q.y)} rx={5} />
          {q.nhan && <text x={X(q.x)} y={yNhan[i]} textAnchor="middle" className="hv-nhan" data-hien={k >= 2 ? '' : undefined}>{q.nhan}</text>}
        </g>
      ))}
    </svg>
  )
}

function VeChungCat({ v }: { v: ThiNghiem }) {
  const n = v.nhan
  return (
    <svg viewBox="0 0 360 250" className="hv-svg hv-tn" role="img" aria-label="Bộ dụng cụ chưng cất: bình cầu đun trên lưới, hơi qua sinh hàn ngưng tụ, chảy vào bình hứng">
      <defs><linearGradient id="hv-kinh" x1="0" x2="1"><stop offset="0" className="hv-k0" /><stop offset="1" className="hv-k1" /></linearGradient></defs>
      <rect x="14" y="232" width="312" height="9" rx="4.5" className="hv-ban" />
      {/* giá đỡ + kẹp */}
      <g className="hv-gia"><rect x="30" y="34" width="7" height="200" rx="3.5" /><rect x="22" y="228" width="44" height="7" rx="3.5" /><rect x="30" y="92" width="58" height="6" rx="3" /><rect x="30" y="168" width="70" height="5" rx="2.5" /></g>
      {/* đèn cồn + lửa */}
      <path d="M66 232 c-14 0 -18-26 0-34 h24 c18 8 14 34 0 34z" className="hv-den" /><rect x="74" y="190" width="8" height="10" rx="2" className="hv-den-co" />
      <path className="hv-lua" d="M78 190 c-9-10 -4-22 0-30 c4 8 9 20 0 30z" />
      <rect x="50" y="170" width="58" height="5" rx="2.5" className="hv-luoi-tn" />
      {/* bình cầu có cổ */}
      <path d="M72 70 h12 v34 a28 28 0 1 1 -12 0z" fill="url(#hv-kinh)" className="hv-thuy" />
      <path d="M53 140 a28 28 0 0 0 50 0z" className="hv-long" />
      {[0, 1, 2, 3].map((i) => <circle key={i} className="hv-bot" cx={62 + i * 11} cy="150" r="2.4" style={{ animationDelay: `${i * 0.3}s` }} />)}
      <rect x="70" y="62" width="16" height="10" rx="3" className="hv-nut" /><rect x="76" y="44" width="4" height="20" className="hv-nhiet-ke" />
      {/* ống dẫn hơi + sinh hàn (ống trong + vỏ nước) */}
      <path d="M86 66 L108 66 L268 150" className="hv-ong" />
      <path d="M128 76 L250 140" className="hv-sinh-han" />
      <path className="hv-hoi" d="M92 66 L108 66 L262 146" pathLength={1} />
      <path d="M236 134 l14 22" className="hv-nuoc-ong" /><path d="M138 82 l-10 -18" className="hv-nuoc-ong" />
      {/* bình hứng (bình tam giác) + giọt */}
      <path d="M262 166 v14 l-22 48 h48 l-22-48 v-14z" fill="url(#hv-kinh)" className="hv-thuy" />
      <path d="M248 212 l-8 16 h48 l-8-16z" className="hv-long hv-long-2" />
      <circle className="hv-giot" cx="266" cy="154" r="3" />
      <g className="hv-chi">
        <path d="M100 122 L118 122" /><path d="M104 172 L118 186" /><path d="M200 116 L206 102" /><path d="M130 70 L130 50" /><path d="M248 158 L222 196" /><path d="M284 214 L294 214" />
      </g>
      <g className="hv-nhan-tn">
        <text x="122" y="126">{n.binh}</text><text x="122" y="192">{n.luoi}</text><text x="206" y="98">{n.sinhHan}</text>
        <text x="136" y="46">{n.ra}</text><text x="150" y="212">{n.vao}</text><text x="352" y="218" textAnchor="end">{n.hung}</text>
      </g>
    </svg>
  )
}

function VeFischer({ v }: { v: Fischer }) {
  const [k] = useNhip(v.hang.length + 1, 420)
  const x = 170, y0 = 34, dy = 30
  return (
    <svg viewBox={`0 0 340 ${y0 + dy * (v.hang.length + 1) + 24}`} className="hv-svg" role="img" aria-label="Công thức chiếu Fischer">
      <text x={x} y={y0 - 8} textAnchor="middle" className="hv-nhom-dau">{v.dau}</text>
      <line x1={x} x2={x} y1={y0} y2={y0 + dy * v.hang.length + 10} className="hv-truc-f" />
      {v.hang.map(([t, p], i) => {
        const y = y0 + dy * (i + 0.6)
        return <g key={i} className="hv-hang-f" data-hien={i < k ? '' : undefined}>
          <line x1={x - 54} x2={x + 54} y1={y} y2={y} className="hv-ngang-f" /><circle cx={x} cy={y} r={4} className="hv-c-f" />
          <text x={x - 62} y={y + 5} textAnchor="end" data-oh={t === 'OH' || t === 'HO' ? '' : undefined}>{t}</text>
          <text x={x + 62} y={y + 5} data-oh={p === 'OH' || p === 'HO' ? '' : undefined}>{p}</text>
        </g>
      })}
      <text x={x} y={y0 + dy * v.hang.length + 32} textAnchor="middle" className="hv-nhom-dau">{v.cuoi}</text>
    </svg>
  )
}

export default function TheHinhVeLai({ hinh }: { hinh: HinhVeLai }) {
  const v = hinh.canh
  return (
    <section className="hv-the" aria-label={`Hình của đề vẽ lại: ${hinh.tieuDe}`}>
      <span className="hv-nhan-the">Hình của đề · vẽ lại</span>
      <b className="hv-tieu-de">{hinh.tieuDe}</b>
      <div className="hv-san">
        {v.loai === 'so-do' ? <VeSoDo v={v} /> : v.loai === 'do-thi' ? <VeDoThi v={v} /> : v.loai === 'fischer' ? <VeFischer v={v} /> : <VeChungCat v={v} />}
      </div>
    </section>
  )
}
