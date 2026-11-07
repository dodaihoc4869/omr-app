// CẢNH ĐỒNG PHÂN (thầy 08/11 «hoạt hoạ mọi thứ của đồng phân phải thiết kế cực kì dễ hiểu đúng bản chất theo phương pháp của thầy»).
// Đúng thứ tự skill của thầy (docs/skill-dong-phan-thay/SKILL.md):
//   tính K → viết phép tính mạch đại số → giải mã từng mạch thành khung C: điểm sáng chạy qua từng vị trí, vị trí trùng (đối xứng) mờ đi,
//   vị trí thừa hoá trị chớp đỏ → bảng phần cố định (ester / amine / arene) → xét hai đầu nối đôi, lật cis / trans → cộng tổng.
// Bàn «tự đặt»: em bấm vị trí trên mạch, cảnh báo chất mới / trùng do đối xứng / sai hoá trị. Mọi số do lõi `dong-phan.ts` tính lại, không tin dữ liệu.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DongPhanKinh, MachDP } from '../../lib/loi-giai-kinh/kieu'
import { hinhHocCua, laDatNguyenTu, lietKeMach, thuToHop, type KhungDung, type ToHopDP, type ViTriDP } from '../../lib/loi-giai-kinh/dong-phan'
import { CongThuc } from '../goi-y-cham/so-do-thay'
import './dong-phan.css'

const CHI_SO = '₀₁₂₃₄₅₆₇₈₉'
const ha = (t: string) => t.replace(/_/g, '').replace(/([A-Za-z)])(\d+)/g, (_m, a: string, d: string) => a + [...d].map((c) => CHI_SO[+c]).join(''))

function Dam({ chu }: { chu: string }) {
  return <>{chu.split(/\*\*/).map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</>
}

type Nhip =
  | { loai: 'K'; chu: string }
  | { loai: 'dai-so'; chu: string }
  | { loai: 'mach'; i: number; chu: string }
  | { loai: 'bang'; chu: string }
  | { loai: 'hinh'; chu: string }
  | { loai: 'tong'; chu: string }

const BUOC_QUET = 1150 // ms mỗi vị trí
const giam = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export default function CanhDongPhan({ dp }: { dp: DongPhanKinh }) {
  const mach = useMemo(() => (dp.mach ?? []).map((m) => ({ m, kq: lietKeMach(m) })).filter((x): x is { m: MachDP; kq: NonNullable<ReturnType<typeof lietKeMach>> } => !!x.kq), [dp])
  const hinh = useMemo(() => (dp.hoi === 'dong-phan' ? hinhHocCua(dp) : []), [dp])
  const soHH = hinh.reduce((a, h) => a + h.them, 0)
  const { C, H, N = 0, X = 0 } = dp.nguyenTu
  const nhip = useMemo<Nhip[]>(() => {
    const ds: Nhip[] = [{ loai: 'K', chu: `**Bước 1 · tính K**: K = (2·${C} + 2${N ? ` + ${N}` : ''} − ${H}${X ? ` − ${X}` : ''}) / 2 = **${dp.K}**${dp.tachK ? ` — ${dp.tachK}` : ''}.` }]
    if (mach.length) {
      const soC = mach[0]!.kq.kd.cha.length
      const cacSo = [...new Set(mach.map((x) => x.m.so))]
      ds.push({ loai: 'dai-so', chu: dp.khungCoDinh ? `**Bước 2 · mạch đại số** cho ${soC} C: đề cho sẵn mạch — chỉ xét **${cacSo.join(' | ')}**. ${dp.khungCoDinh}`
        : `**Bước 2 · lập mạch đại số** cho ${soC} C: viết phép tính trước — **${cacSo.join(' | ')}**. Số đầu là mạch chính, số sau là nhánh.` })
      mach.forEach((x, i) => ds.push({ loai: 'mach', i, chu: `Mạch **${x.m.so}**: đánh số các vị trí rồi điền **${x.m.dat.map((d) => d.nhan).join(' + ')}** lần lượt — trùng chưa? thừa gạch chưa?` }))
    }
    if (dp.bang) ds.push({ loai: 'bang', chu: `**Phần cố định**: ${dp.bang.tieuDe} — mỗi dòng nhân số cách của từng phần.` })
    if (hinh.length) ds.push({ loai: 'hinh', chu: `**Hình học**: tách nối đôi, **hai đầu này khác nhau chưa?** Mỗi đầu gắn hai nhóm khác nhau thì cộng thêm 1.` })
    ds.push({ loai: 'tong', chu: `**Cộng lại**: ${dp.tong} ${dp.hoi === 'dong-phan' ? 'đồng phân' : 'công thức cấu tạo'}.` })
    return ds
  }, [dp, mach, hinh.length, C, H, N, X])
  const n = nhip.length
  // thời lượng từng nhịp: nhịp mạch đủ để điểm sáng chạy qua mọi vị trí rồi đứng lại nhìn kết quả
  const dur = nhip.map((x) => (x.loai === 'mach' ? (mach[x.i]!.kq.toHop.length + 2) * BUOC_QUET : x.loai === 'hinh' ? 2600 + hinh.length * 1400 : x.loai === 'bang' ? 2400 + (dp.bang?.hang.length ?? 0) * 700 : 3600))
  const [buoc, setBuoc] = useState(1)
  const [chay, setChay] = useState(false)
  const [goc, datGoc] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !goc) return
    const io = new IntersectionObserver((ds) => { if (ds[0]?.isIntersecting) { io.disconnect(); setBuoc(1); setChay(true) } }, { threshold: 0.4 })
    io.observe(goc)
    return () => io.disconnect()
  }, [goc])
  useEffect(() => {
    if (!chay) return
    const an = () => { if (document.hidden) setChay(false) }
    document.addEventListener('visibilitychange', an)
    const h = window.setTimeout(() => { if (buoc < n) setBuoc(buoc + 1); else setChay(false) }, dur[buoc - 1])
    return () => { window.clearTimeout(h); document.removeEventListener('visibilitychange', an) }
  }, [chay, buoc, n, dur])
  const den = (k: number) => { setBuoc(k); setChay(false) }
  const h = nhip[buoc - 1]!
  return (
    <>
      <section className="lgk-the lgk-canh ldp" ref={datGoc} aria-label="Đồng phân theo cách của thầy" data-nhip={h.loai}>
        <div className="lgk-dau"><span className="lgk-nhan">Đồng phân theo cách của thầy</span><span className="lgk-dem">Nhịp {buoc}/{n}</span></div>
        <div className="lgk-vach">
          {nhip.map((_, i) => (
            <button key={i} type="button" aria-label={`Nhịp ${i + 1} trên ${n}`} aria-current={i + 1 === buoc ? 'step' : undefined}
              style={{ ['--t' as string]: `${dur[i]}ms` }} data-xong={i + 1 < buoc ? '' : undefined} data-chay={i + 1 === buoc && chay ? '' : undefined} onClick={() => den(i + 1)}><i /></button>
          ))}
        </div>
        <div className="ldp-san">
          {h.loai === 'K' && <CanhK dp={dp} />}
          {h.loai === 'dai-so' && <DaiSo mach={mach.map((x) => x.m)} soC={mach[0]!.kq.kd.cha.length} />}
          {h.loai === 'mach' && <QuetMach key={h.i} m={mach[h.i]!.m} kq={mach[h.i]!.kq} chay={chay} />}
          {h.loai === 'bang' && dp.bang && <Bang bang={dp.bang} />}
          {h.loai === 'hinh' && <HinhHoc ds={hinh} />}
          {h.loai === 'tong' && <Tong dp={dp} mach={mach.map((x) => ({ so: x.m.so, n: x.kq.soChat }))} soHH={dp.hoi === 'dong-phan' ? soHH : 0} />}
        </div>
        <p className="lgk-loi" aria-live="polite"><span className="lgk-so-tron">{buoc}</span><span><Dam chu={h.chu} /></span></p>
        <div className="lgk-dk">
          <button type="button" className="lgk-nut lgk-nut-kinh" onClick={() => (chay ? setChay(false) : (buoc >= n && setBuoc(1), setChay(true)))}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{chay ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : buoc >= n ? <path d="M12 5a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 12 7v3L7.5 6 12 2z" /> : <path d="M8 5.5v13l11-6.5z" />}</svg>
            {chay ? 'Dừng' : buoc >= n ? 'Xem lại' : 'Chạy tiếp'}
          </button>
        </div>
      </section>
      {mach.length > 0 && <TuDat mach={mach} />}
    </>
  )
}

// ---------------------------------------------------------------- nhịp K
function CanhK({ dp }: { dp: DongPhanKinh }) {
  const { C, H, N = 0, X = 0, O = 0 } = dp.nguyenTu
  return (
    <div className="ldp-k">
      <div className="ldp-ctpt"><CongThuc chu={dp.ctpt} /></div>
      <div className="ldp-k-dong ldp-k-mau">K = <span>(2C + 2{N ? ' + N' : ''} − H{X ? ' − X' : ''}) / 2</span></div>
      <div className="ldp-k-dong ldp-k-so">K = <span>(2·<b>{C}</b> + 2{N ? <> + <b>{N}</b></> : null} − <b>{H}</b>{X ? <> − <b>{X}</b></> : null}) / 2</span> = <strong>{dp.K}</strong></div>
      <div className="ldp-chip">
        <span>K = số liên kết π + số vòng</span>
        {O > 0 && <span>{O} O ⇒ đếm O trước để biết mấy nhóm chức</span>}
      </div>
      {dp.tachK && <p className="ldp-ghi"><Dam chu={dp.tachK} /></p>}
    </div>
  )
}

// ---------------------------------------------------------------- nhịp mạch đại số (phép tính trước, hình sau)
function DaiSo({ mach, soC }: { mach: MachDP[]; soC: number }) {
  const cacSo = [...new Set(mach.map((m) => m.so))]
  return (
    <div className="ldp-ds">
      <div className="ldp-ds-dau">C{ha(String(soC))}:</div>
      <div className="ldp-ds-hang">
        {cacSo.map((so, i) => (
          <span key={so} className="ldp-ds-o" style={{ animationDelay: `${i * 380}ms` }}>
            {so.split('+').map((p, j) => <span key={j} data-chinh={j === 0 ? '' : undefined}>{j > 0 && <i>+</i>}{p}</span>)}
          </span>
        ))}
      </div>
      <p className="ldp-ghi">Nhánh không dài bằng hoặc hơn phần mạch chính còn lại · mỗi nhánh chỉ điền vào một chỗ.</p>
    </div>
  )
}

// ---------------------------------------------------------------- vẽ khung
interface Diem { x: number; y: number }
interface BoCuc { w: number; h: number; c: Diem[]; huong: number[]; truc: number | null }
function boCuc(kd: KhungDung): BoCuc {
  const W = 340
  const dx = kd.chinh > 1 ? Math.min(54, (W - 70) / (kd.chinh - 1)) : 0
  const x0 = (W - dx * (kd.chinh - 1)) / 2
  const c: Diem[] = [], huong: number[] = []
  for (let i = 0; i < kd.chinh; i++) { c.push({ x: x0 + i * dx, y: i % 2 ? 0 : 22 }); huong.push(i % 2 ? -1 : 1) }
  const daGan = new Map<number, number>()
  for (const nh of kd.nhanh) {
    const lan = daGan.get(nh.o) ?? 0; daGan.set(nh.o, lan + 1)
    const d = lan === 0 ? huong[nh.o]! : -huong[nh.o]!
    nh.nguyenTu.forEach((a, j) => { c[a] = { x: c[nh.o]!.x, y: c[nh.o]!.y + d * 40 * (j + 1) }; huong[a] = d })
  }
  const ys = c.map((p) => p.y)
  const tren = Math.min(...ys) - 52, duoi = Math.max(...ys) + 52
  for (const p of c) p.y -= tren
  // trục đối xứng: mạch chính lật đầu–cuối vẫn y nguyên (nhánh cũng lật theo)
  const ky = (o: number, dai: number) => `${o}:${dai}`
  const nh1 = kd.nhanh.map((x) => ky(x.o, x.nguyenTu.length)).sort().join(',')
  const nh2 = kd.nhanh.map((x) => ky(kd.chinh - 1 - x.o, x.nguyenTu.length)).sort().join(',')
  return { w: W, h: duoi - tren, c, huong, truc: kd.chinh > 1 && nh1 === nh2 ? (c[0]!.x + c[kd.chinh - 1]!.x) / 2 : null }
}
/** chỗ đặt răng giả thứ `lan` của nguyên tử a: luôn ra xa mạch */
function choThe(kd: KhungDung, bc: BoCuc, a: number, lan = 0): Diem {
  const p = bc.c[a]!, d = bc.huong[a]!
  const cuoiNhanh = a >= kd.chinh && !kd.cha.some((c) => c === a)
  const conNhanh = kd.cha.some((c, i) => c === a && i >= kd.chinh)
  const dau = a < kd.chinh && kd.chinh > 1 && (a === 0 || a === kd.chinh - 1)
  const ngang = a === 0 ? -38 : 38
  const cho: Diem[] = a >= kd.chinh
    ? [...(cuoiNhanh ? [{ x: p.x, y: p.y + d * 40 }] : []), { x: p.x + 40, y: p.y }, { x: p.x - 40, y: p.y }]
    : dau ? [{ x: p.x + ngang, y: p.y }, { x: p.x, y: p.y + (conNhanh ? -d : d) * 40 }, { x: p.x, y: p.y - (conNhanh ? -d : d) * 40 }]
      : [{ x: p.x, y: p.y + (conNhanh ? -d : d) * 40 }, { x: p.x, y: p.y - (conNhanh ? -d : d) * 40 }]
  return cho[Math.min(lan, cho.length - 1)]!
}
const giua = (a: Diem, b: Diem): Diem => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

function Khung({ kd, bc, m, cam, dau, trangThai, chonDiem, sangTruc, nhanDiem }: {
  kd: KhungDung; bc: BoCuc; m: MachDP
  /** thứ đang cắm (tổ hợp hiện tại) */
  cam: ViTriDP[] | null
  /** thừa hoá trị ⇒ chớp đỏ */
  dau?: 'thua' | 'trung' | 'moi' | 'loai' | null
  trangThai?: Map<string, { ket: ToHopDP['ket']; chat?: number }>
  /** bàn tự đặt: bấm vị trí */
  chonDiem?: (v: ViTriDP) => void
  sangTruc?: boolean
  nhanDiem?: boolean
}) {
  const vtDat = laDatNguyenTu(m.dat[0]!.loai) ? kd.cha.map((_, a) => ({ loai: 'c' as const, a })) : kd.cha.flatMap((c, b) => (c >= 0 ? [{ loai: 'lk' as const, a: c, b }] : []))
  const kyVT = (v: ViTriDP) => (v.loai === 'c' ? `c${v.a}` : `l${v.a}-${v.b}`)
  const diemVT = (v: ViTriDP) => (v.loai === 'c' ? bc.c[v.a]! : giua(bc.c[v.a]!, bc.c[v.b]!))
  const camLk = new Map<string, { loai: string; nhan: string }>()
  const camC: { a: number; nhan: string; xeton: boolean }[] = []
  cam?.forEach((v, i) => { const d = m.dat[i]!; if (v.loai === 'lk') camLk.set(`${Math.min(v.a, v.b)}-${Math.max(v.a, v.b)}`, d); else camC.push({ a: v.a, nhan: d.loai === 'xeton' ? 'O' : d.nhan, xeton: d.loai === 'xeton' }) })
  const lanC = new Map<number, number>()
  return (
    <svg className="ldp-khung" viewBox={`0 0 ${bc.w} ${bc.h}`} role="img" data-dau={dau ?? undefined}
      aria-label={`Khung ${m.so}: mạch chính ${kd.chinh} C${kd.nhanh.length ? `, ${kd.nhanh.length} nhánh` : ''}`}>
      {bc.truc !== null && <line className="ldp-truc" data-sang={sangTruc ? '' : undefined} x1={bc.truc} y1={8} x2={bc.truc} y2={bc.h - 8} />}
      {kd.cha.map((c, b) => {
        if (c < 0) return null
        const p = bc.c[c]!, q = bc.c[b]!, l = camLk.get(`${Math.min(c, b)}-${Math.max(c, b)}`)
        const nx = -(q.y - p.y), ny = q.x - p.x, dd = Math.hypot(nx, ny) || 1, ox = (nx / dd) * 5, oy = (ny / dd) * 5
        return (
          <g key={`l${b}`} className="ldp-lk" data-cam={l ? l.loai : undefined}>
            <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
            {l && (l.loai === 'doi' || l.loai === 'ba') && <line className="ldp-pi" x1={p.x + ox} y1={p.y + oy} x2={q.x + ox} y2={q.y + oy} />}
            {l && l.loai === 'ba' && <line className="ldp-pi" x1={p.x - ox} y1={p.y - oy} x2={q.x - ox} y2={q.y - oy} />}
            {l && l.loai === 'chen' && (() => { const g = giua(p, q); return <g className="ldp-the"><rect x={g.x - 16} y={g.y - 12} width={32} height={24} rx={12} /><text x={g.x} y={g.y + 5} textAnchor="middle">{ha(l.nhan)}</text></g> })()}
          </g>
        )
      })}
      {camC.map((t, i) => {
        const lan = lanC.get(t.a) ?? 0; lanC.set(t.a, lan + 1)
        const p = bc.c[t.a]!, q = choThe(kd, bc, t.a, lan)
        const w = Math.max(30, 12 + ha(t.nhan).length * 9)
        return (
          <g key={`t${i}`} className="ldp-the" data-xeton={t.xeton ? '' : undefined}>
            <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
            {t.xeton && <line x1={p.x + 5} y1={p.y} x2={q.x + 5} y2={q.y} />}
            <rect x={q.x - w / 2} y={q.y - 12} width={w} height={24} rx={12} />
            <text x={q.x} y={q.y + 5} textAnchor="middle">{ha(t.nhan)}</text>
          </g>
        )
      })}
      {bc.c.map((p, a) => (
        <g key={`c${a}`} className="ldp-c" data-nhanh={a >= kd.chinh ? '' : undefined}>
          <circle cx={p.x} cy={p.y} r={14} />
          <text x={p.x} y={p.y + 5} textAnchor="middle">C</text>
        </g>
      ))}
      {(nhanDiem || chonDiem) && vtDat.map((v, i) => {
        const d = diemVT(v), tt = trangThai?.get(kyVT(v))
        const lech = v.loai === 'c' ? { x: 13, y: -13 } : { x: 0, y: 0 }
        const nd = (
          <g className="ldp-vt" data-ket={tt?.ket} transform={`translate(${d.x + lech.x} ${d.y + lech.y})`}>
            <circle r={9.5} />
            <text y={4} textAnchor="middle">{tt?.ket === 'moi' && tt.chat ? `✓` : tt?.ket === 'thua' ? '✕' : i + 1}</text>
          </g>
        )
        return chonDiem
          ? <g key={`v${i}`} className="ldp-vt-bam" role="button" tabIndex={0} aria-label={`Vị trí ${i + 1}`} onClick={() => chonDiem(v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chonDiem(v) } }}>
              <circle className="ldp-vt-cham" cx={d.x + lech.x} cy={d.y + lech.y} r={20} />{nd}
            </g>
          : <g key={`v${i}`}>{nd}</g>
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- nhịp quét một mạch
function QuetMach({ m, kq, chay }: { m: MachDP; kq: NonNullable<ReturnType<typeof lietKeMach>>; chay: boolean }) {
  const bc = useMemo(() => boCuc(kq.kd), [kq])
  const nTH = kq.toHop.length
  const [k, setK] = useState(() => (giam() ? nTH : 0)) // số tổ hợp đã xét
  useEffect(() => {
    if (!chay || k >= nTH) return
    const h = window.setTimeout(() => setK(k + 1), k === 0 ? 500 : BUOC_QUET)
    return () => window.clearTimeout(h)
  }, [chay, k, nTH])
  useEffect(() => { if (!chay && k === 0) setK(nTH) }, [chay]) // eslint-disable-line react-hooks/exhaustive-deps
  const cur = k > 0 && k <= nTH ? kq.toHop[k - 1]! : null
  const motCho = m.dat.length === 1
  const trangThai = useMemo(() => {
    const t = new Map<string, { ket: ToHopDP['ket']; chat?: number }>()
    if (!motCho) return t
    for (const th of kq.toHop.slice(0, k)) { const v = th.viTri[0]!; t.set(v.loai === 'c' ? `c${v.a}` : `l${v.a}-${v.b}`, { ket: th.ket, ...(th.chat ? { chat: th.chat } : {}) }) }
    return t
  }, [kq, k, motCho])
  const daTim = kq.toHop.slice(0, k).filter((t) => t.ket === 'moi')
  const loi = !cur ? (k >= nTH ? `Mạch **${m.so}** ⇒ **${kq.soChat} chất**${kq.toHop.some((t) => t.ket === 'trung') ? ' — vị trí đối xứng chỉ tính một' : ''}.` : `Đánh số vị trí trên mạch **${m.so}**…`)
    : cur.ket === 'moi' ? `Vị trí ${cur.so} → **chất mới (${cur.chat})**`
    : cur.ket === 'trung' ? `Vị trí ${cur.so} → **trùng chất ở vị trí ${cur.trungVoi}** — đối xứng dịch ra là giống nhau`
    : cur.ket === 'loai' ? `Vị trí ${cur.so} → không thoả điều kiện đề${m.loc ? ` (${m.loc})` : ''}`
    : `Vị trí ${cur.so} → **không điền được**: ${cur.ly}`
  return (
    <div className="ldp-mach">
      <div className="ldp-mach-dau"><span className="ldp-ds-o ldp-ds-nho">{m.so}</span><span>điền <b>{m.dat.map((d) => ha(d.nhan)).join(' + ')}</b></span><span className="ldp-dem">{daTim.length} chất</span></div>
      <Khung kd={kq.kd} bc={bc} m={m} cam={cur ? cur.viTri : null} dau={cur?.ket ?? null} trangThai={trangThai} nhanDiem={motCho} sangTruc={cur?.ket === 'trung'} />
      <p className="ldp-quet" data-ket={cur?.ket ?? 'xong'} aria-live="polite"><Dam chu={loi} />{cur?.gon && cur.ket !== 'thua' && <> <span className="ldp-gon"><CongThuc chu={cur.gon} /></span></>}</p>
      <ol className="ldp-ds-chat">
        {daTim.map((t) => <li key={t.so}><span className="ldp-so">{t.chat}</span><CongThuc chu={t.gon ?? ''} />{t.hinhHoc ? <em>có hình học</em> : null}</li>)}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------- bảng phần cố định
function Bang({ bang }: { bang: NonNullable<DongPhanKinh['bang']> }) {
  const cot = bang.cot.length ? bang.cot : bang.loai === 'este' ? ['R (gốc acid, được là H)', 'R′ (gốc alcohol)'] : bang.loai === 'amin' ? ['Các gốc quanh N'] : bang.loai === 'aren' ? ['Các nhánh trên vòng'] : ['Cách xếp']
  const tong = bang.hang.reduce((a, h) => a + h.tich, 0)
  return (
    <div className="ldp-bang">
      <div className="ldp-bang-dau"><b>{bang.tieuDe}</b></div>
      <table>
        <thead><tr><th>{cot.join(' · ')}</th><th>Số cách</th><th>Số chất</th></tr></thead>
        <tbody>
          {bang.hang.map((h, i) => (
            <tr key={i} style={{ animationDelay: `${300 + i * 650}ms` }}>
              <td>{h.phan.length ? h.phan.map((c) => (bang.loai === 'este' && c === 0 ? 'H' : `${c}C`)).join(' – ') : '—'}{h.ghi && <small>{h.ghi}</small>}</td>
              <td>{h.soCach.join(' × ')}{bang.loai === 'aren' && h.phan.length === 2 ? ' × 3 (o, m, p)' : ''}</td>
              <td><b>{h.tich}</b></td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={2}>Cộng</td><td><b>{tong}</b></td></tr></tfoot>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------- hình học: hai đầu nối đôi, lật cis / trans
function HinhHoc({ ds }: { ds: ReturnType<typeof hinhHocCua> }) {
  return (
    <div className="ldp-hh">
      {ds.map((x, i) => (
        <div key={i} className="ldp-hh-the" data-co={x.them ? '' : undefined} style={{ animationDelay: `${i * 1400}ms` }}>
          <div className="ldp-hh-ten"><CongThuc chu={x.gon} /></div>
          {x.dau.map((d, j) => (
            <div key={j} className="ldp-hh-noi">
              <DauNoi nhom={d.trai} />
              <span className="ldp-hh-db" aria-hidden="true"><i /><i /></span>
              <DauNoi nhom={d.phai} lat={d.co} />
            </div>
          ))}
          <div className="ldp-hh-ket">{x.them ? <>Hai đầu đều khác ⇒ <b>+{x.them}</b> (cis và trans)</> : <>Một đầu giống nhau ⇒ <b>vứt đi</b></>}</div>
        </div>
      ))}
    </div>
  )
}
function DauNoi({ nhom, lat }: { nhom: [string, string]; lat?: boolean }) {
  const khac = nhom[0] !== nhom[1]
  return (
    <span className="ldp-hh-dau" data-khac={khac ? '' : undefined} data-lat={lat ? '' : undefined}>
      <span><CongThuc chu={nhom[0]} /></span>
      <span><CongThuc chu={nhom[1]} /></span>
      <small>{khac ? 'khác ✓' : 'giống ✕'}</small>
    </span>
  )
}

// ---------------------------------------------------------------- cộng tổng
function Tong({ dp, mach, soHH }: { dp: DongPhanKinh; mach: { so: string; n: number }[]; soHH: number }) {
  const phan: ReactNode[] = []
  mach.forEach((x, i) => phan.push(<span key={`m${i}`} className="ldp-tong-o"><b>{x.n}</b><small>mạch {x.so}</small></span>))
  dp.bang?.hang.forEach((h, i) => phan.push(<span key={`b${i}`} className="ldp-tong-o"><b>{h.tich}</b><small>{h.phan.map((c) => (dp.bang!.loai === 'este' && c === 0 ? 'H' : `${c}C`)).join('–') || 'cách xếp'}</small></span>))
  if (soHH) phan.push(<span key="hh" className="ldp-tong-o" data-hh=""><b>{soHH}</b><small>hình học</small></span>)
  return (
    <div className="ldp-tong">
      <div className="ldp-tong-hang">
        {phan.map((p, i) => <span key={i} className="ldp-tong-cum" style={{ animationDelay: `${i * 300}ms` }}>{i > 0 && <i>+</i>}{p}</span>)}
        <span className="ldp-tong-cum ldp-tong-bang" style={{ animationDelay: `${phan.length * 300}ms` }}><i>=</i><strong>{dp.tong}</strong></span>
      </div>
      <p className="ldp-ghi">{dp.hoi === 'dong-phan' ? 'Đề hỏi đồng phân ⇒ cộng cả hình học (mỗi nối đôi đủ điều kiện chỉ cộng thêm 1).' : 'Đề hỏi công thức cấu tạo ⇒ không cộng hình học.'}</p>
    </div>
  )
}

// ---------------------------------------------------------------- bàn tự đặt
function TuDat({ mach }: { mach: { m: MachDP; kq: NonNullable<ReturnType<typeof lietKeMach>> }[] }) {
  const [i, setI] = useState(0)
  const x = mach[Math.min(i, mach.length - 1)]!
  return (
    <section className="lgk-the ldp-tu" aria-label="Em tự đặt vị trí">
      <div className="lgk-dau"><span className="lgk-nhan">Em tự đặt</span><span className="lgk-dem">bấm số trên mạch</span></div>
      {mach.length > 1 && (
        <div className="ldp-tu-tab" role="tablist">
          {mach.map((y, j) => <button key={j} type="button" role="tab" aria-selected={j === i} onClick={() => setI(j)}>{y.m.so}</button>)}
        </div>
      )}
      <BanTuDat key={i} m={x.m} kq={x.kq} />
    </section>
  )
}
function BanTuDat({ m, kq }: { m: MachDP; kq: NonNullable<ReturnType<typeof lietKeMach>> }) {
  const bc = useMemo(() => boCuc(kq.kd), [kq])
  const [dang, setDang] = useState<ViTriDP[]>([])
  const [tim, setTim] = useState<{ dc: string; gon: string }[]>([])
  const [bao, setBao] = useState<{ ket: 'moi' | 'trung' | 'thua' | 'loai' | 'cho'; chu: string } | null>(null)
  const [cam, setCam] = useState<ViTriDP[] | null>(null)
  const can = m.dat.length
  const chonDung = useMemo(() => new Set(kq.toHop.filter((t) => t.ket === 'moi' || t.ket === 'trung').map((t) => t.dangChuan)), [kq])
  const bam = (v: ViTriDP) => {
    const ds = [...dang, v]
    if (ds.length < can) { setDang(ds); setBao({ ket: 'cho', chu: `Đã cắm **${m.dat[0]!.nhan}** — bấm chỗ cắm **${m.dat[1]!.nhan}**` }); return }
    setDang([])
    const r = thuToHop(m, ds)
    if (r.ok) r.gon = ha(r.gon)
    if (!r.ok) { setBao({ ket: 'thua', chu: `**Không điền được**: ${r.ly}` }); setCam(ds); return }
    setCam(ds)
    if (m.chon && !chonDung.has(r.dangChuan)) { setBao({ ket: 'loai', chu: `${r.gon}: **không thoả điều kiện đề**${m.loc ? ` (${m.loc})` : ''}` }); return }
    const cu = tim.find((t) => t.dc === r.dangChuan)
    if (cu) { setBao({ ket: 'trung', chu: `**Trùng rồi!** ${r.gon} chính là ${ha(cu.gon)} — đối xứng dịch ra là giống nhau` }); return }
    const moi = [...tim, { dc: r.dangChuan, gon: r.gon }]
    setTim(moi)
    setBao({ ket: 'moi', chu: moi.length >= kq.soChat ? `**Chất mới!** ${r.gon} — đủ **${kq.soChat}/${kq.soChat}** chất của mạch này rồi` : `**Chất mới!** ${r.gon} — đã tìm **${moi.length}/${kq.soChat}**` })
  }
  const hien = dang.length ? dang : cam
  return (
    <div className="ldp-tu-ban">
      <Khung kd={kq.kd} bc={bc} m={m} cam={hien} dau={bao && bao.ket !== 'cho' ? bao.ket : null} chonDiem={bam} sangTruc={bao?.ket === 'trung'} />
      <p className="ldp-quet" data-ket={bao?.ket ?? 'xong'} aria-live="polite">
        <Dam chu={bao?.chu ?? (can === 1 ? `Bấm một số để cắm **${m.dat[0]!.nhan}** vào đó — thử tìm đủ **${kq.soChat}** chất.` : `Bấm hai chỗ: cắm **${m.dat[0]!.nhan}** rồi **${m.dat[1]!.nhan}** — thử tìm đủ **${kq.soChat}** chất.`)} />
      </p>
      {tim.length > 0 && <ol className="ldp-ds-chat">{tim.map((t, j) => <li key={j}><span className="ldp-so">{j + 1}</span><CongThuc chu={t.gon} /></li>)}</ol>}
      {(tim.length > 0 || bao) && <button type="button" className="ldp-lai" onClick={() => { setTim([]); setBao(null); setCam(null); setDang([]) }}>Làm lại</button>}
    </div>
  )
}
