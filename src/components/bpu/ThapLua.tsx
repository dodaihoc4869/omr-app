// BÌNH PHẢN ỨNG — BẢNG «THÁP LỬA» (thầy chốt 09/11 «chốt bản ống nghiệm nhé» · «chốt build và đẩy luôn»; bản vẽ docs/ban-ve-bpu-dua-top-0911, phương án A).
// Thay chiếu ĐỀ ở màn «cả lớp đang làm» và «đã mở đáp án»: đề có trên máy em; lên bảng (L) thì tờ chiếu cũ có đủ đề. Một điểm nhìn chính: các đội đua
// bằng kJ trong ống nghiệm (chất lỏng màu đội, ngọn lửa thử màu). Cột phải: số em đã gửi · Bảng vàng kJ · chuỗi đúng; mở đáp án: đáp án gọn, năng lượng
// hoạt hoá, nhanh và đúng nhất. Dải tên đáy theo đội. TẾ NHỊ: không nêu tên em sai / chưa biết làm; chỉ mũi tên LÊN hạng; «+kJ» riêng chỉ cho 3 em nhanh nhất.
// Chuyển động chỉ transform / opacity; máy yếu / giảm chuyển động ⇒ trạng thái cuối (luật chung html.may-yeu của bpu-bang.css). Bay tên / ±kJ: dua-top.ts.
import { useLayoutEffect, useRef } from 'react'
import { DOI_BPU, KJ, type ViewBang } from '../../lib/bpu/phong'
import { mauDoi } from './ong-ket-qua'
import { boCucThap, chuoiDaiNhat, dapAnDs, dapSo, dauTheo, kjDoi, soKj, thangOng, thuTuDoi, xepVang, type Em } from './dua-top'
import './bpu-thap.css'

type Luot = NonNullable<ViewBang['luot']>
const tenDoi = (d: number) => (DOI_BPU[d]?.ten ?? '').replace('Đội ', '')
const LuaThap = () => <svg className="bpu-lua" viewBox="0 0 40 56" aria-hidden="true"><path className="ngoai" d="M20 1C25 12 37 21 37 36a17 17 0 0 1-34 0C3 27 10 21 13 11c2 6 4 9 7 11C21 14 19 8 20 1Z" /><path className="trong" d="M20 26c3 5 8 8 8 14a8 8 0 0 1-16 0c0-5 4-8 5-12 1 2 2 3 3 4z" /></svg>
const Tick = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" /></svg>
const SaoNho = ({ x, y, s, d }: { x: number; y: number; s: number; d: number }) => <svg className="bpu-sao" viewBox="-12 -12 24 24" style={{ left: x, top: y, width: 26 * s, height: 26 * s, animationDelay: `${d}s` }} aria-hidden="true"><path d="M0-12l2.6 9.4L12 0l-9.4 2.6L0 12l-2.6-9.4L-12 0l9.4-2.6z" /></svg>
const BOT: [number, number, number][] = [[0.22, 30, 10], [0.6, 70, 7], [0.38, 120, 12], [0.72, 160, 6], [0.28, 200, 8], [0.55, 250, 9], [0.4, 310, 7]]

export interface PropsThap {
  v: ViewBang
  l: Luot
  /** kJ đội ngay trước khi mở đáp án (useDuaTop) — null: không vẽ vạch «trước» / «+kJ lượt này». */
  truoc: number[] | null
  /** Lên hạng so với lần mở đáp án trước (chỉ số dương). */
  len: Map<string, number>
  tenGoi: Map<string, string>
  /** Tên trên Bảng vàng / thẻ nhanh (ẩn tên H ⇒ «Em số …»). */
  tenHien: (e: Em) => string
  an: boolean
  toanMan: boolean
  roiNay: string[]
  /** Tấm giấy G / M đang đè vùng tháp ⇒ ẩn ống (không vẽ thứ không ai thấy). */
  che?: boolean
}

export default function ThapLua({ v, l, truoc, len, tenGoi, tenHien, an, toanMan, roiNay, che = false }: PropsThap) {
  const mo = l.pha === 'mo'
  const B = boCucThap(v, toanMan)
  const goc = useRef<HTMLDivElement>(null)
  const coMat = v.ds.filter((e) => e.vao)
  const daGui = new Set(l.daGui), chuaBiet = new Set(l.chuaBiet ?? [])
  const daGuiN = coMat.filter((e) => daGui.has(e.sbd)).length
  const kj = B.doi.map((d) => kjDoi(v, d)), coTruoc = mo && !!truoc && truoc.length === B.doi.length
  const thu = thuTuDoi(v), dan = (kj[B.doi.indexOf(thu[0]!)] ?? 0) > 0 ? thu[0]! : -1
  const butLen = coTruoc && dan >= 0 && dauTheo(truoc!, B.doi) !== dan
  const thang = thangOng([...kj, ...(coTruoc ? truoc! : [])])
  const kq = (mo ? l.ketQua : undefined) ?? {}
  const nhanh = coMat.map((e) => ({ e, k: kq[e.sbd] })).filter((x) => x.k?.nhanh && x.k.nhanh <= 3).sort((a, b) => a.k!.nhanh! - b.k!.nhanh!)
  const vang = xepVang(v), chuoi = mo ? null : chuoiDaiNhat(v)
  const soDung = Object.values(kq).filter((x) => x.dung).length

  // Chữ tên tự co cho vừa ô (lớp đông, tên dài): hạ từng px tới khi vừa (tối thiểu 14 px).
  useLayoutEffect(() => {
    goc.current?.querySelectorAll<HTMLElement>('.bb-tl-o .ten').forEach((el) => {
      el.style.fontSize = ''
      let co = parseFloat(getComputedStyle(el).fontSize) || B.coChu
      while (el.scrollWidth > el.clientWidth + 1 && co > 14) { co -= 1; el.style.fontSize = `${co}px` }
    })
  })

  // ── Cột phải: số dòng Bảng vàng vừa chiều cao còn lại (6 lúc đang làm). ──
  let dung = mo ? 108 + 14 + (chuaBiet.size && !l.tuLuan ? 34 : 0) + (l.kich ? 64 : 0) + (nhanh.length ? 64 + nhanh.length * 56 + 14 : 0)
    : 164 + 14 + (chuaBiet.size ? 32 : 0) + (chuoi ? 104 : 0)
  if (mo && l.tuLuan) dung = 122
  // Đủ chỗ 6 dòng cao 54 ⇒ thường; chỉ đủ 6 dòng cao 46 (không toàn màn hình) ⇒ dòng gọn; ít hơn nữa ⇒ bớt dòng.
  const choVang = B.caoVung - dung - 64 + 6, gonVang = choVang < 6 * 60 && choVang >= 6 * 52
  const soVang = Math.max(0, Math.min(6, gonVang ? 6 : Math.floor(choVang / 60)))

  const hangVang = (e: Em, i: number) => {
    const n = len.get(e.sbd) ?? 0
    return (
      <div key={e.sbd} className="bb-tl-hang">
        <span className={`bb-tl-hc ${i < 3 ? `h${i + 1}` : 'hx'}`}>{i + 1}</span>
        <span className="t">{tenHien(e)}</span>
        <span className="bb-tl-ky" style={{ ['--doi' as string]: mauDoi(e.doi) }}>{DOI_BPU[e.doi]?.ky}</span>
        <span className="d">{soKj(e.kj)}</span>
        <span className="len" aria-label={n ? `Lên ${n} hạng` : undefined}>{n ? `▲${n}` : ''}</span>
      </div>
    )
  }
  const bangVang = soVang >= 2 && vang.length ? <div className={`bb-tl-the bb-tl-vang${gonVang ? ' gon' : ''}`}><div className="dau"><span className="bb-tl-nhan">Bảng vàng kJ</span><span className="bb-tl-nhan">cả buổi</span></div>{vang.slice(0, soVang).map(hangVang)}</div> : null

  let phai: React.ReactNode
  if (!mo) {
    phai = (
      <>
        <div className="bb-tl-the bb-tl-dem">
          <div className="so"><b>{daGuiN}</b><span className="mau">/{coMat.length}</span> em {l.tuLuan ? 'làm xong' : 'đã gửi'}</div>
          {coMat.length <= 48 ? <div className="o" style={{ gridTemplateColumns: `repeat(${Math.max(1, coMat.length)}, minmax(0, 1fr))` }}>{coMat.map((e, i) => <i key={e.sbd} className={i < daGuiN ? 'c' : ''} />)}</div> : null}
          {chuaBiet.size ? <span className="kb">trong đó {chuaBiet.size} em chưa biết làm</span> : null}
        </div>
        {bangVang}
        {chuoi ? <div className="bb-tl-the bb-tl-chuoi"><span className="so-c">{chuoi.chuoi}</span><div><div className="bb-tl-nhan">Chuỗi đúng dài nhất</div><div className="c2">{tenHien(chuoi)} <span>· {chuoi.chuoi} câu đúng liền</span></div></div></div> : null}
      </>
    )
  } else {
    const dungChu = l.dung ?? ''
    const theDa = l.tuLuan
      ? <div className="bb-tl-the bb-tl-da"><div><div className="bb-tl-nhan">Câu tự luận · thầy chữa</div><div className="x2"><b>{Math.max(0, daGuiN - chuaBiet.size)}</b> em đã làm xong</div></div></div>
      : l.phan === 'II'
        ? <div className="bb-tl-the bb-tl-da ds"><div><div className="bb-tl-nhan">Đáp án</div><div className="dsc">{dapAnDs(dungChu)}</div><div className="x3"><b>{soDung}</b> em đúng đủ 4 ý</div></div></div>
        : l.phan === 'III'
          ? <div className="bb-tl-the bb-tl-da"><div className="min"><div className="bb-tl-nhan">Đáp số</div><div className="dso">{dapSo(dungChu)}</div><div className="x3"><b>{soDung}</b>/{coMat.length} em đúng</div></div></div>
          : <div className="bb-tl-the bb-tl-da"><span className="chu-da">{dungChu.toUpperCase()}</span><div><div className="bb-tl-nhan">Đáp án</div><div className="x2"><b>{soDung}</b>/{coMat.length} em đúng</div></div></div>
    phai = (
      <>
        {theDa}
        {chuaBiet.size && !l.tuLuan ? <div className="bb-tl-kb">{chuaBiet.size} em chưa biết làm · thầy chữa kĩ câu này</div> : null}
        {l.kich ? <div className="bb-tl-kich">Vượt năng lượng hoạt hoá · cả lớp +{KJ.kichHoat} kJ</div> : null}
        {nhanh.length ? <div className="bb-tl-the bb-tl-nhanh"><div className="dau"><span className="bb-tl-nhan">Nhanh và đúng nhất</span></div>{nhanh.map(({ e, k }, i) => <div key={e.sbd} className="bb-tl-hang" style={{ animationDelay: `${1.7 + i * 0.15}s` }}><span className={`bb-tl-hc h${k!.nhanh}`}>{k!.nhanh}</span><span className="t">{tenHien(e)}</span><span className="bb-tl-ky" style={{ ['--doi' as string]: mauDoi(e.doi) }}>{DOI_BPU[e.doi]?.ky}</span><span className="bb-tl-cong">+{soKj(k!.kj)} kJ</span></div>)}</div> : null}
        {bangVang}
      </>
    )
  }

  return (
    <div ref={goc} className={`bb-tl${mo ? ' mo' : ''}${B.hai ? ' hai' : ''}`} style={{ ['--ong' as string]: `${B.caoOng}px` }}>
      <div className="bb-tl-dai" style={{ height: B.caoVung, visibility: che ? 'hidden' : undefined }}>
        {B.doi.map((d, i) => {
          const t = kj[i] ?? 0, t0 = coTruoc ? truoc![i] ?? t : t, H = B.caoOng
          const h = Math.round((Math.max(0, t) / thang) * H), h0 = Math.round((Math.max(0, t0) / thang) * H)
          const hang = thu.indexOf(d), tren = hang > 0 ? (kj[B.doi.indexOf(thu[hang - 1]!)] ?? 0) - t : 0
          const laDan = d === dan, lh = B.hai ? (laDan ? 250 : 210) : laDan ? 196 : 162
          const yLua = 56 + H - h - Math.round(lh * 0.9), yLua0 = 56 + H - h0 - Math.round(lh * 0.9)
          const dang = coTruoc && h !== h0
          const phu = coTruoc ? <span className="bb-tl-cong">+{soKj(t - t0)} kJ lượt này</span>
            : dan < 0 ? null : laDan ? <span className="bb-tl-dau">Dẫn đầu</span> : <span className="phu">{tren > 0 ? `kém hạng trên ${soKj(tren)} kJ` : 'ngang hạng trên'}</span>
          return (
            <div key={d} className={`bb-tl-cot${laDan ? ' dan' : ''}`} data-doi={d} style={{ left: B.x[i], ['--doi' as string]: mauDoi(d) }}>
              <div className="bb-tl-ong" style={{ height: H }}>
                {Array.from({ length: Math.max(4, Math.floor((H - 50) / 44)) }, (_, k) => <i key={k} className="bb-tl-vach" style={{ top: 40 + k * 44, width: k % 2 ? 14 : 24 }} />)}
                <div key={mo ? 'mo' : 'lam'} className={`bb-tl-day${dang ? ' dang' : ''}`} style={{ height: H, transform: `translateY(${H - h}px)`, ['--tu' as string]: `translateY(${H - h0}px)` }}>
                  {BOT.map(([x, y, r], k) => <i key={k} className="bb-tl-bot" style={{ left: `${x * 100}%`, bottom: y, width: r, height: r }} />)}
                </div>
                <i className="bb-tl-sang" /><i className="bb-tl-toi" />
              </div>
              <i className="bb-tl-mieng" /><i className="bb-tl-gon" />
              {coTruoc && h0 !== h ? <div className="bb-tl-cu" style={{ top: 56 + H - h0 }}><span>trước {soKj(t0)}</span></div> : null}
              <div key={mo ? 'mo' : 'lam'} className={`bb-tl-lua${dang ? ' dang' : ''}`} style={{ height: lh, transform: `translateY(${yLua}px)`, ['--tu' as string]: `translateY(${yLua0}px)` }}>
                <i className="bb-tl-quang" /><span className="bb-tl-nhun"><LuaThap /></span>
              </div>
              {laDan && butLen ? <><span className="bb-tl-dau bb-tl-noi" style={{ top: Math.max(-6, yLua - 34) }}>Bứt lên dẫn đầu</span><SaoNho x={-6} y={yLua + 40} s={1} d={1.6} /><SaoNho x={B.hai ? 420 : 236} y={yLua + 10} s={0.8} d={1.9} /><SaoNho x={B.hai ? 410 : 226} y={yLua + 140} s={1.2} d={2.1} /></> : null}
              <div className="bb-tl-chan" style={{ top: 56 + H + 14 }}>
                <div className="t"><i>{DOI_BPU[d]?.ky}</i>{tenDoi(d)}</div>
                <b className="so">{coTruoc && t0 !== t ? <><span className="cu">{soKj(t0)}</span><span className="moi">{soKj(t)}</span></> : soKj(t)}<small>kJ</small></b>
                {phu}
              </div>
            </div>
          )
        })}
      </div>
      <div className="bb-tl-phai" style={{ height: B.caoVung }}>{phai}</div>
      <div className="bb-tl-dai-ten" style={{ top: B.topDai, height: B.caoDai, gridTemplateColumns: `repeat(${B.doi.length}, minmax(0, 1fr))` }}>
        {B.doi.map((d) => {
          const th = coMat.filter((e) => e.doi === d), g = th.filter((e) => daGui.has(e.sbd)).length
          return (
            <div key={d} className="bb-tl-nhom" style={{ ['--doi' as string]: mauDoi(d) }}>
              <div className="dau"><i />{tenDoi(d)}<span>{g === th.length && g ? 'đủ đội ' : ''}{g}/{th.length} {l.tuLuan ? 'làm xong' : 'đã gửi'}</span></div>
              <div className={`luoi${B.caoO < 60 ? ' thap' : ''}`} style={{ gridTemplateColumns: `repeat(${B.cot}, minmax(0, 1fr))`, gridAutoRows: `${B.caoO}px`, ['--co' as string]: `${B.coChu}px` }}>
                {th.map((e) => {
                  const gui = daGui.has(e.sbd), roi = roiNay.includes(e.sbd), n = kq[e.sbd]?.nhanh
                  return (
                    <div key={e.sbd} data-sbd={e.sbd} className={`bb-tl-o${gui ? ' gui' : ''}${roi ? ' roi' : ''}`} aria-label={`${e.ten}${gui ? ' · đã gửi' : ''}${roi ? ' · đang rời màn' : ''}`}>
                      <span className="ten">{an ? v.ds.indexOf(e) + 1 : tenGoi.get(e.sbd) ?? e.ten}</span>
                      {mo && n && n <= 3 ? <span className={`bb-tl-hc h${n}`} aria-label={`Nhanh thứ ${n}`}>{n}</span> : gui ? <span className="dau"><Tick /></span> : null}
                      {roi ? <b className="the-roi">Rời màn</b> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
