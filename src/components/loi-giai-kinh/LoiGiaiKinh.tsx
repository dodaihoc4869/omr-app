// LỜI GIẢI KÍNH — khung vẽ cho app học sinh (thầy chốt bản vẽ 02/11: docs/ban-ve-loi-giai-0211/). MẢNH NẠP LƯỜI (React.lazy ở nơi gọi) + CSS riêng.
// Thứ tự cố định (đáp án + câu chốt nói trước): kết quả em → Kiến thức cốt lõi → phim thầy dẫn từng bước → cảnh mẫu (bấm tác động / ống nghiệm / so sánh)
// → sơ đồ + MỘT phép tính bấm từng số → thầy giảng (thần chú · thầy nói · mẹo) → vì sao từng phương án / ý → chỗ hay nhầm (đoán rồi lật) → tự trả lời trước
// → thẻ nhớ (tự vào hộp thẻ 5 ngăn). Bố cục theo BỀ RỘNG KHUNG CHỨA (container query): hẹp một cột, rộng hai cột (tấm lời giải ở cột phải khi xoay ngang
// vẫn một cột; trang rộng / Fold mở / máy tính hai cột). Chuyển động chỉ transform / opacity ≤ 280 ms, một lượt; máy yếu / giảm chuyển động chỉ hiện dần.
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BanKinh, CanhKinh, PhanKinh } from '../../lib/loi-giai-kinh/kieu'
import { ChuTron, CongThuc } from '../goi-y-cham/so-do-thay'
import { themTheNho } from '../../lib/loi-giai-kinh/the-nho'
import { chuSgk } from '../../lib/loi-giai-kinh/kiem'
import { THAN_CHU_DUNG } from '../../lib/loi-giai-kinh/than-chu-dung'
import './loi-giai-kinh.css'

/** Chữ có **in đậm** + công thức (ChemText / chỉ số `_`). */
export function Chu({ chu }: { chu: string }) {
  const p = chu.split(/\*\*(.+?)\*\*/g)
  return <>{p.map((x, i) => (x ? (i % 2 ? <b key={i}><ChuTron chu={x} /></b> : <ChuTron key={i} chu={x} />) : null))}</>
}

export interface LoiGiaiKinhProps {
  ban: BanKinh
  /** đáp án đang chấm theo thứ tự HIỂN THỊ: «C» · «DSSD» · «13,2» */
  dapAn: string
  /** câu trả lời của em theo thứ tự hiển thị (I: «B»; II: «DDSD» / mảng; III: «17,6»). Vắng ⇒ không hiện dải kết quả. */
  emTraLoi?: string | ReadonlyArray<string | null>
  /** hoán vị: lyDo của bản theo CHỮ GỐC, hiển thị theo vị trí — `perm[viTri] = chỉ số gốc`. Vắng ⇒ giữ nguyên. */
  perm?: readonly number[]
  /** chữ phương án / ý theo thứ tự hiển thị (hiện cạnh lý do) */
  luaChon?: readonly string[]
  /** đề (tuỳ chọn, dòng gọn đầu khung) */
  de?: ReactNode
  children?: ReactNode
}

const KHOA = { I: ['A', 'B', 'C', 'D'], II: ['a', 'b', 'c', 'd'] } as const
const chuanDS = (x: string | null | undefined) => (x ? x.toUpperCase().replace('Đ', 'D') : '')

export default function LoiGiaiKinh({ ban, dapAn, emTraLoi, perm, luaChon, de, children }: LoiGiaiKinhProps) {
  const phan = ban.phan
  return (
    <div className="lgk" data-phan={phan}>
      <div className="lgk-luoi">
        <div className="lgk-cot">
          {emTraLoi !== undefined && <KetQuaEm phan={phan} dapAn={dapAn} em={emTraLoi} />}
          {de && <div className="lgk-de"><b>Đề</b>{de}</div>}
          <CotLoi ban={ban} />
          {ban.phim.length >= 2 && <Phim ban={ban} />}
          {ban.canh && <Canh canh={ban.canh} />}
          {(ban.buoc?.length || ban.phepTinh?.length) ? <PhepTinh ban={ban} /> : null}
          <ThayGiang ban={ban} />
        </div>
        <div className="lgk-cot">
          {(phan === 'I' || phan === 'II') && ban.lyDo.length === 4 && <LyDo phan={phan} ban={ban} dapAn={dapAn} em={emTraLoi} perm={perm} luaChon={luaChon} />}
          {ban.kiemLai && <div className="lgk-kiem"><span className="lgk-dau-tich" aria-hidden="true">✓</span><p><b>Kiểm bằng cách khác.</b> <Chu chu={ban.kiemLai} /></p></div>}
          {ban.hayNham.length > 0 && <HayNham ban={ban} />}
          {ban.tuHoi.hoi && <TuHoi ban={ban} />}
          {ban.theNho.length > 0 && <TheNhoDaThem ban={ban} />}
          {children}
        </div>
      </div>
    </div>
  )
}

function KetQuaEm({ phan, dapAn, em }: { phan: PhanKinh; dapAn: string; em: string | ReadonlyArray<string | null> }) {
  const emChu = typeof em === 'string' ? em : em.map((x) => chuanDS(x) || '_').join('')
  let dung = false, tieuDe = '', phu = ''
  if (phan === 'I') { dung = chuanDS(emChu) === chuanDS(dapAn); tieuDe = emChu ? `Em chọn ${emChu.toUpperCase()} · đáp án ${dapAn.toUpperCase()}` : `Đáp án ${dapAn.toUpperCase()}` }
  else if (phan === 'II') {
    const d = chuanDS(dapAn), e = chuanDS(emChu)
    const soDung = [...d].filter((c, i) => e[i] === c).length
    dung = soDung === 4; tieuDe = `Em đúng ${soDung}/4 ý`
    const sai = [...d].map((c, i) => (e[i] !== c ? 'abcd'[i] : '')).filter(Boolean)
    phu = sai.length ? `Sai ý ${sai.join(', ')}. Xem lý do từng ý bên dưới.` : 'Cả bốn ý đều đúng.'
  } else { dung = !!emChu && emChu.replace(/\s/g, '') === dapAn.replace(/\s/g, ''); tieuDe = emChu ? `Em trả lời ${emChu} · đáp án ${dapAn}` : `Đáp số ${dapAn}` }
  if (!phu) phu = dung ? 'Em làm đúng. Đọc lại cách thầy dẫn để nhớ lâu.' : 'Xem lại từng bước dưới đây.'
  return (
    <div className="lgk-kq" data-tt={dung ? 'dung' : 'sai'}>
      <span className="lgk-oi" aria-hidden="true">{dung ? '✓' : '✕'}</span>
      <span className="lgk-giua"><b>{tieuDe}</b><span>{phu}</span></span>
    </div>
  )
}

function CotLoi({ ban }: { ban: BanKinh }) {
  return (
    <section className="lgk-the lgk-cot-loi" aria-label="Kiến thức cốt lõi">
      <span className="lgk-nhan">Kiến thức cốt lõi</span>
      {ban.cotLoi.congThuc && <div className="lgk-ct-to"><CongThuc chu={ban.cotLoi.congThuc} /></div>}
      <p className="lgk-ct-chu"><Chu chu={ban.cotLoi.chu} /></p>
      {ban.cotLoi.chip.length > 0 && <div className="lgk-chip-hang">{ban.cotLoi.chip.map((c, i) => <span key={i} className="lgk-chip"><b><Chu chu={c.nhan} /></b> <Chu chu={c.chu} /></span>)}</div>}
    </section>
  )
}

// ---------------------------------------------------------------- PHIM: nhịp từng bước, vạch kiểu Stories, chạy MỘT lượt khi lọt vào màn
const BIEU_TUONG: Record<string, string> = {
  binh: 'M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3L14 9V3', 'ong-nghiem': 'M9 3h6M10 3v14a2 2 0 0 0 4 0V3M10 12h4', dun: 'M8 21h8M12 17v4M7 13a5 5 0 0 0 10 0c0-3-5-8-5-8s-5 5-5 8z',
  chiet: 'M8 3h8l-1 6 3 4v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6l3-4zM6 13h12', loc: 'M4 4h16l-6 8v6l-4 2v-8z', can: 'M12 3v18M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z',
  khi: 'M8 18a4 4 0 0 1 0-8 5 5 0 0 1 9-2 4 4 0 0 1 1 10zM9 21v-2M15 21v-2', 'ket-tua': 'M9 3h6M10 3v14a2 2 0 0 0 4 0V3M10 15h4M11 17h2', mau: 'M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z',
  nhiet: 'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z', 'ap-suat': 'M12 3v8M8 7l4 4 4-4M4 21h16M6 17h12', 'xuc-tac': 'M13 2 4 14h7l-1 8 9-12h-7z',
  'nguyen-tu': 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M3 12c0-3 4-6 9-6s9 3 9 6-4 6-9 6-9-3-9-6z', 'phan-tu': 'M6 12a3 3 0 1 0 0 .01M18 6a3 3 0 1 0 0 .01M18 18a3 3 0 1 0 0 .01M8.5 10.5l7-3M8.5 13.5l7 3',
  'lien-ket': 'M4 9h16M4 15h16', dien: 'M13 2 4 14h7l-1 8 9-12h-7z', pin: 'M6 7h12v12H6zM9 4h6M12 10v6M9 13h6', 'do-thi': 'M4 20V4M4 20h16M7 15l4-4 3 3 5-6',
  'mui-ten': 'M5 12h14M13 6l6 6-6 6', 'kinh-lup': 'M11 11m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0M20 20l-4.5-4.5', 'so-sanh': 'M12 3v18M4 7h6M14 7h6M4 17h6M14 17h6', 'cong-thuc': 'M7 4h10M7 20h10M9 4l6 16M15 4 9 20',
}
function Hinh({ ten }: { ten?: string }) {
  const d = BIEU_TUONG[ten ?? ''] ?? BIEU_TUONG['kinh-lup']
  return <svg className="lgk-hinh" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
}
function useChayMotLuot(n: number, t = 3400, batDau = 1) {
  const [buoc, setBuoc] = useState(batDau)
  const [chay, setChay] = useState(false)
  const [goc, datGoc] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (batDau === 0 || typeof IntersectionObserver === 'undefined' || !goc) return
    const io = new IntersectionObserver((ds) => { if (ds[0]?.isIntersecting) { io.disconnect(); setBuoc(1); setChay(true) } }, { threshold: 0.5 })
    io.observe(goc)
    return () => io.disconnect()
  }, [batDau, goc])
  useEffect(() => {
    if (!chay) return
    const an = () => { if (document.hidden) setChay(false) }
    document.addEventListener('visibilitychange', an)
    const h = window.setTimeout(() => { if (buoc < n) setBuoc(buoc + 1); else setChay(false) }, t)
    return () => { window.clearTimeout(h); document.removeEventListener('visibilitychange', an) }
  }, [chay, buoc, n, t])
  const den = (k: number, choi = false) => { setBuoc(k); setChay(choi) }
  const nut = () => (chay ? setChay(false) : den(buoc >= n ? 1 : Math.max(1, buoc), true))
  return { buoc, chay, den, nut, datGoc, t }
}
function Vach({ n, buoc, chay, den, t, nhan }: { n: number; buoc: number; chay: boolean; den: (k: number) => void; t: number; nhan: string }) {
  return (
    <div className="lgk-vach" style={{ ['--t' as string]: `${t}ms` }}>
      {Array.from({ length: n }, (_, i) => (
        <button key={i} type="button" aria-label={`${nhan} ${i + 1} trên ${n}`} aria-current={i + 1 === buoc ? 'step' : undefined}
          data-xong={i + 1 < buoc ? '' : undefined} data-chay={i + 1 === buoc && chay ? '' : undefined} onClick={() => den(i + 1)}><i /></button>
      ))}
    </div>
  )
}
function NutChay({ chay, buoc, n, onClick, chuDau = 'Chạy tiếp' }: { chay: boolean; buoc: number; n: number; onClick: () => void; chuDau?: string }) {
  return (
    <button type="button" className="lgk-nut lgk-nut-kinh" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{chay ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : buoc >= n ? <path d="M12 5a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 12 7v3L7.5 6 12 2z" /> : <path d="M8 5.5v13l11-6.5z" />}</svg>
      {chay ? 'Dừng' : buoc >= n ? 'Xem lại' : chuDau}
    </button>
  )
}
function Phim({ ban }: { ban: BanKinh }) {
  const n = ban.phim.length
  const { datGoc, ...p } = useChayMotLuot(n)
  return (
    <section className="lgk-the lgk-phim" ref={datGoc} aria-label="Thầy dẫn từng bước">
      <div className="lgk-dau"><span className="lgk-nhan">Thầy dẫn từng bước</span><span className="lgk-dem">Bước {p.buoc}/{n}</span></div>
      <Vach n={n} buoc={p.buoc} chay={p.chay} den={(k) => p.den(k)} t={p.t} nhan="Bước" />
      <div className="lgk-phim-san">
        {ban.phim.map((x, i) => (
          <div key={i} className="lgk-nhip" data-bat={i + 1 === p.buoc ? '' : undefined} aria-hidden={i + 1 !== p.buoc}>
            <span className="lgk-nhip-hinh"><Hinh ten={x.hinh} /><b>{i + 1}</b></span>
            <p><Chu chu={x.chu} />{x.phu && <span className="lgk-phu"><Chu chu={x.phu} /></span>}</p>
          </div>
        ))}
      </div>
      <ol className="lgk-sr">{ban.phim.map((x, i) => <li key={i}>{x.chu.replace(/\*\*/g, '')}{x.phu ? ` — ${x.phu.replace(/\*\*/g, '')}` : ''}</li>)}</ol>
      <div className="lgk-dk"><NutChay chay={p.chay} buoc={p.buoc} n={n} onClick={p.nut} /></div>
    </section>
  )
}

// ---------------------------------------------------------------- CẢNH MẪU
function Canh({ canh }: { canh: CanhKinh }) {
  if (canh.loai === 'can-bang') return <CanhCanBang canh={canh} />
  if (canh.loai === 'ong-nghiem') return <CanhOngNghiem canh={canh} />
  return <CanhSoSanh canh={canh} />
}
function CanhCanBang({ canh }: { canh: Extract<CanhKinh, { loai: 'can-bang' }> }) {
  const n = canh.tacDong.length
  const { datGoc, ...p } = useChayMotLuot(n, 3600)
  const td = canh.tacDong[p.buoc - 1]
  const x = td?.chieu === 'thuan' ? 1 : td?.chieu === 'nghich' ? -1 : 0
  return (
    <section className="lgk-the lgk-canh" ref={datGoc} aria-label="Bấm tác động, xem cân bằng chuyển dịch">
      <div className="lgk-dau"><span className="lgk-nhan">Bấm tác động</span><span className="lgk-dem">{p.buoc}/{n}</span></div>
      <div className="lgk-cb" data-chieu={td?.chieu}>
        <div className="lgk-cb-ve" data-sang={x < 0 ? '' : undefined}><b><CongThuc chu={canh.trai} /></b>{canh.nhanTrai && <span>{canh.nhanTrai}</span>}</div>
        <div className="lgk-cb-mui" aria-hidden="true">⇌</div>
        <div className="lgk-cb-ve" data-sang={x > 0 ? '' : undefined}><b><CongThuc chu={canh.phai} /></b>{canh.nhanPhai && <span>{canh.nhanPhai}</span>}</div>
        <div className="lgk-cb-ray" aria-hidden="true"><span>chiều nghịch</span><i /><span>chiều thuận</span></div>
      </div>
      <div className="lgk-tac">{canh.tacDong.map((t, i) => <button key={i} type="button" aria-pressed={i + 1 === p.buoc} onClick={() => p.den(i + 1)}><Chu chu={t.nut} /></button>)}</div>
      <p className="lgk-loi" aria-live="polite">{td && <Chu chu={td.chu} />}</p>
    </section>
  )
}
const MAU_LOP: Record<string, string> = { trong: 'trong', xanh: 'xanh', cam: 'cam', vang: 'vang', hong: 'hong', tim: 'tim', nau: 'nau', 'trang-duc': 'trang-duc' }
function CanhOngNghiem({ canh }: { canh: Extract<CanhKinh, { loai: 'ong-nghiem' }> }) {
  const n = canh.buoc.length
  const { datGoc, ...p } = useChayMotLuot(n, 3600)
  const b = canh.buoc[p.buoc - 1]!
  return (
    <section className="lgk-the lgk-canh" ref={datGoc} aria-label="Thí nghiệm">
      <div className="lgk-dau"><span className="lgk-nhan">Thí nghiệm</span><span className="lgk-dem">Bước {p.buoc}/{n}</span></div>
      <Vach n={n} buoc={p.buoc} chay={p.chay} den={(k) => p.den(k)} t={p.t} nhan="Bước thí nghiệm" />
      {/* Ống nghiệm ĐÚNG BẢN MẪU (p3-hieu-suat.html): ống bo tròn hai đầu viền mảnh, lớp chất bo tròn bên trong, nhãn đứng NGANG lớp có vạch chỉ. */}
      <div className="lgk-on">
        <div className="lgk-on-ong" data-dun={b.dun ? '' : undefined}>
          {b.khi && <svg className="lgk-on-khi" viewBox="0 0 40 18" aria-hidden="true"><path d="M9 16q5-7 0-14M20 16q5-7 0-14M31 16q5-7 0-14" /></svg>}
          <div className="lgk-on-long">{b.lop.map((l, i) => <div key={i} className="lgk-on-lop" data-mau={MAU_LOP[l.mau]} style={{ flexGrow: b.lop.length === 2 && i === 0 ? 2 : 3 }}>{b.ketTua && i === b.lop.length - 1 && <span className="lgk-on-tua"><i /><i /><i /></span>}</div>)}</div>
          {b.dun && <svg className="lgk-on-lua" viewBox="0 0 48 20" aria-hidden="true"><path d="M8 19q6-8 0-17M24 19q6-8 0-17M40 19q6-8 0-17" /></svg>}
        </div>
        <ul className="lgk-on-nhan">{b.lop.map((l, i) => <li key={i} data-mau={MAU_LOP[l.mau]} style={{ flexGrow: b.lop.length === 2 && i === 0 ? 2 : 3 }}><span><Chu chu={l.nhan} /></span></li>)}</ul>
      </div>
      {(b.dun || b.khi || b.ketTua) && <div className="lgk-on-them">{b.khi && <span data-k="khi">có khí thoát ra</span>}{b.ketTua && <span data-k="tua">có kết tủa</span>}{b.dun && <span data-k="dun">đun nóng</span>}</div>}
      <p className="lgk-loi" aria-live="polite"><span className="lgk-so-tron">{p.buoc}</span><Chu chu={b.chu} /></p>
      <div className="lgk-dk"><NutChay chay={p.chay} buoc={p.buoc} n={n} onClick={p.nut} /></div>
    </section>
  )
}
function CanhSoSanh({ canh }: { canh: Extract<CanhKinh, { loai: 'so-sanh' }> }) {
  return (
    <section className="lgk-the" aria-label="So sánh">
      <span className="lgk-nhan">Đặt cạnh nhau</span>
      <div className="lgk-ss">{[canh.trai, canh.phai].map((v, i) => <div key={i}><b><CongThuc chu={v.ten} /></b><ul>{v.y.map((y, j) => <li key={j}><Chu chu={y} /></li>)}</ul></div>)}</div>
    </section>
  )
}

// ---------------------------------------------------------------- SƠ ĐỒ + MỘT PHÉP TÍNH: chạm số nào hiện nghĩa số đó + kết quả tới đó
function PhepTinh({ ban }: { ban: BanKinh }) {
  const buoc = ban.buoc ?? []
  // ĐÚNG BẢN MẪU p3 (thầy 03/11 «kiểm tra sơ đồ 1 phép tính đã làm chuẩn theo mẫu chưa»): phép tính TỰ CHẠY qua từng thừa số (vạch Stories,
  // «Bước k/n»), số đang nói sáng lên kèm ý nghĩa + phép tính tới đó; em chạm số nào thì dừng ở số đó.
  const ds = buoc.flatMap((b, bi) => b.thuaSo.map((_, ti) => ({ b: bi, t: ti })))
  const n = ds.length
  const { datGoc, ...p } = useChayMotLuot(Math.max(1, n), 3200)
  const chon = n ? ds[Math.min(n, p.buoc) - 1]! : null
  const ts = chon ? buoc[chon.b]?.thuaSo[chon.t] : undefined
  const toiDay = chon ? buoc[chon.b]!.thuaSo.slice(0, chon.t + 1).map((x) => x.so).join(' · ') : ''
  return (
    <section className="lgk-the lgk-pt" ref={n ? datGoc : undefined} aria-label="Sơ đồ và phép tính">
      <div className="lgk-dau"><span className="lgk-nhan">{buoc.length ? 'Sơ đồ + một phép tính' : 'Các phép tính'}</span>{n > 0 && <span className="lgk-dem">Bước {Math.min(n, p.buoc)}/{n}</span>}</div>
      {ban.soDo && (
        <div className="lgk-sd" role="img" aria-label={`Sơ đồ: ${ban.soDo.nut.map((x) => [x.tong, x.chat, ...x.soLieu].filter(Boolean).join(' ')).join(' → ')}`}>
          {ban.soDo.nut.map((x, i) => (
            <Fragment key={i}>
              {i > 0 && <div className="lgk-sd-mui">{ban.soDo!.muiTen[i - 1]?.H ? <span>H = {String(ban.soDo!.muiTen[i - 1]!.H).replace('.', ',')}%</span> : null}<svg viewBox="0 0 56 16" aria-hidden="true"><path d="M2 8h50M44 2l8 6-8 6" /></svg><span>{ban.soDo!.chieu === 'nguoc' ? 'tính ngược' : 'tính xuôi'}</span></div>}
              <div className="lgk-sd-chat" data-hoi={x.soLieu.some((s) => s.includes('?')) ? '' : undefined}>
                {x.tong && <span className="lgk-sd-tong"><ChuTron chu={x.tong} /></span>}
                <b><CongThuc chu={x.chat} /></b>
                {x.soLieu.map((s, j) => <span key={j}><ChuTron chu={s} /></span>)}
              </div>
            </Fragment>
          ))}
        </div>
      )}
      {buoc.map((b, bi) => (
        <div key={bi} className="lgk-pt-buoc">
          <div className="lgk-pt-dong" role="group" aria-label={`Phép tính ${b.ten}, chạm từng số để xem ý nghĩa`}>
            <span className="lgk-pt-ten"><ChuTron chu={b.ten} /> =</span>
            {b.thuaSo.map((t, ti) => {
              const k = ds.findIndex((x) => x.b === bi && x.t === ti) + 1
              return (
                <Fragment key={ti}>
                  {ti > 0 && <span className="lgk-pt-nhan" aria-hidden="true">·</span>}
                  <button type="button" className="lgk-so" aria-pressed={chon?.b === bi && chon.t === ti} onClick={() => p.den(k)}><ChuTron chu={t.so} /></button>
                </Fragment>
              )
            })}
            {b.ketQua && <span className="lgk-pt-kq">= <Chu chu={b.ketQua} />{b.donVi ? ` ${b.donVi}` : ''}</span>}
          </div>
        </div>
      ))}
      {chon && ts && (
        <div className="lgk-giai-so" aria-live="polite">
          <div key={`${chon.b}-${chon.t}`}><span className="lgk-so-to">{chon.t > 0 ? '· ' : ''}<ChuTron chu={ts.so} /></span>
            <p><Chu chu={ts.nghia} />{ts.denDay && <span className="lgk-dang-co">{chon.t > 0 && <><ChuTron chu={toiDay} /> = </>}<b><Chu chu={ts.denDay} /></b></span>}</p></div>
        </div>
      )}
      {n > 1 && <div className="lgk-dk"><Vach n={n} buoc={Math.min(n, p.buoc)} chay={p.chay} den={(k) => p.den(k)} t={p.t} nhan="Số" /></div>}
      {n > 1 && <div className="lgk-dk"><NutChay chay={p.chay} buoc={p.buoc} n={n} onClick={p.nut} /><span className="lgk-goi">hoặc chạm từng số</span></div>}
      {ban.phepTinh && ban.phepTinh.length > 0 && (
        <ol className="lgk-pt-ds">{ban.phepTinh.map((x, i) => <li key={i} data-dap-so={x.laDapSo ? '' : undefined}><b><ChuTron chu={x.ten} /></b> = <ChuTron chu={x.bieuThuc.replace(/\*/g, ' · ').replace(/\./g, ',')} /> = <b>{x.ketQua}</b>{x.nghia && <span className="lgk-phu"><Chu chu={x.nghia} /></span>}</li>)}</ol>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- THẦY GIẢNG
/** Ô «Đ» hình BÁNH QUY 12 MÚI (logo app học sinh, bản mẫu docs/ban-ve-ban-sac-hs-0211/v2/kve.js `banh(12, 0.075)`) — vẽ bằng mã, tính một lần. */
const BANH = (() => {
  let d = ''
  for (let i = 0; i <= 240; i++) { const t = (i / 240) * 2 * Math.PI, r = 50 * (1 + 0.075 * Math.cos(12 * t)); d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(t) / 1.075).toFixed(1)} ${(50 + r * Math.sin(t) / 1.075).toFixed(1)}` }
  return d + 'Z'
})()

function ThayGiang({ ban }: { ban: BanKinh }) {
  if (!ban.thanChu.length && !ban.thayNoi && !ban.meo) return null
  return (
    <section className="lgk-the" aria-label="Thầy giảng dạng này">
      <span className="lgk-nhan">Thầy giảng dạng này</span>
      {ban.thanChu.length > 0 && <div className="lgk-tc-hang">{ban.thanChu.map((t, i) => <div key={i} className="lgk-tc"><small>Thần chú của thầy</small><b>{t}</b>{THAN_CHU_DUNG[t] && <span>Dùng khi: {THAN_CHU_DUNG[t]}</span>}</div>)}</div>}
      {ban.thayNoi && <div className="lgk-thay-noi"><span className="lgk-av" aria-hidden="true"><svg viewBox="0 0 100 100"><path d={BANH} /></svg><b>Đ</b></span><div className="lgk-bong"><small>Thầy nói</small><Chu chu={chuSgk(ban.thayNoi)} /></div></div>}
      {ban.meo && ban.meo !== ban.thayNoi && <div className="lgk-meo"><small>Mẹo của thầy</small><Chu chu={chuSgk(ban.meo)} /></div>}
    </section>
  )
}

// ---------------------------------------------------------------- VÌ SAO TỪNG PHƯƠNG ÁN / Ý
function LyDo({ phan, ban, dapAn, em, perm, luaChon }: { phan: 'I' | 'II'; ban: BanKinh; dapAn: string; em?: string | ReadonlyArray<string | null>; perm?: readonly number[]; luaChon?: readonly string[] }) {
  const khoa = KHOA[phan]
  const theoGoc = new Map(ban.lyDo.map((l) => [l.khoa, l]))
  const thuTu = perm && perm.length === 4 ? perm : [0, 1, 2, 3]
  const d = chuanDS(dapAn)
  const emChu = typeof em === 'string' ? chuanDS(em) : (em ?? []).map((x) => chuanDS(x) || '_').join('')
  return (
    <section className="lgk-the" aria-label={phan === 'I' ? 'Vì sao chọn, vì sao không chọn' : 'Từng ý'}>
      <span className="lgk-nhan">{phan === 'I' ? 'Vì sao chọn · vì sao không' : `Từng ý · đáp án ${[...d].map((c) => (c === 'D' ? 'Đ' : 'S')).join(' ')}`}</span>
      <div className="lgk-ly">
        {thuTu.map((goc, viTri) => {
          const l = theoGoc.get(khoa[goc]!)
          if (!l) return null
          const dung = phan === 'I' ? d === 'ABCD'[viTri] : d[viTri] === 'D'
          const emChon = phan === 'I' ? emChu === 'ABCD'[viTri] : !!emChu[viTri] && emChu[viTri] !== '_'
          const emSai = phan === 'I' ? emChon && !dung : emChon && emChu[viTri] !== d[viTri]
          const ma = phan === 'I' ? 'ABCD'[viTri]! : 'abcd'[viTri]!
          return (
            <div key={viTri} className="lgk-ly-dong" data-dung={dung ? '' : undefined} data-em-sai={emSai ? '' : undefined}>
              <span className="lgk-ky">{ma}</span>
              <span className="lgk-giua">
                {luaChon?.[viTri] && <span className="lgk-pa"><Chu chu={luaChon[viTri]!} /></span>}
                {phan === 'I' ? (emSai && <span className="lgk-em">Em chọn</span>) : emChon && <span className={emSai ? 'lgk-em' : 'lgk-em-dung'}>Em chọn {emChu[viTri] === 'D' ? 'Đúng' : 'Sai'}{emSai ? ` · đáp án ${dung ? 'Đúng' : 'Sai'}` : ' · đúng rồi'}</span>}
                <span className="lgk-vs"><Chu chu={l.chu} /></span>
              </span>
              <span className="lgk-dau-ly">{dung ? 'Đúng' : 'Sai'}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function HayNham({ ban }: { ban: BanKinh }) {
  const [mo, setMo] = useState<Set<number>>(() => new Set())
  return (
    <section className="lgk-the" aria-label="Chỗ hay nhầm">
      <span className="lgk-nhan" data-sac="sai">Chỗ hay nhầm · đoán rồi lật</span>
      {ban.hayNham.map((h, i) => (
        <div key={i} className="lgk-bay" data-mo={mo.has(i) ? '' : undefined}>
          <div className="lgk-bay-lat">
            <div className="lgk-bay-m lgk-bay-t" aria-hidden={mo.has(i)}><small>Nhiều em nghĩ</small><p><Chu chu={h.nghi} /></p><span className="lgk-goi">Chạm để xem đúng là gì</span></div>
            <div className="lgk-bay-m lgk-bay-s" aria-hidden={!mo.has(i)}><small>Đúng là</small><p><Chu chu={h.dung} /></p></div>
          </div>
          <button type="button" aria-expanded={mo.has(i)} aria-label={mo.has(i) ? 'Lật lại' : 'Lật xem đúng là gì'} onClick={() => setMo((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })} />
        </div>
      ))}
    </section>
  )
}

function TuHoi({ ban }: { ban: BanKinh }) {
  const [mo, setMo] = useState(false)
  return (
    <section className="lgk-the lgk-hoi" aria-label="Em tự trả lời trước">
      <span className="lgk-nhan">Em tự trả lời trước</span>
      <p className="lgk-cau"><Chu chu={ban.tuHoi.hoi} /></p>
      {mo && <div className="lgk-tra"><Chu chu={ban.tuHoi.tra} /></div>}
      <button type="button" className="lgk-nut lgk-nut-kinh" aria-expanded={mo} onClick={() => setMo(!mo)}>{mo ? 'Ẩn câu trả lời' : 'Xem câu trả lời'}</button>
    </section>
  )
}

function TheNhoDaThem({ ban }: { ban: BanKinh }) {
  const daThem = useMemo(() => themTheNho(ban.qid, ban.theNho), [ban.qid, ban.theNho])
  const [lat, setLat] = useState(false)
  const t = ban.theNho[0]!
  return (
    <section className="lgk-the" aria-label="Thẻ nhớ">
      <div className="lgk-dau"><span className="lgk-nhan">Thẻ nhớ</span><span className="lgk-dem">{daThem > 0 ? `đã thêm ${ban.theNho.length} thẻ · gặp lại ngày mai` : `${ban.theNho.length} thẻ trong hộp`}</span></div>
      <div className="lgk-the-lat" data-mo={lat ? '' : undefined}>
        <div className="lgk-tl">
          <div className="lgk-tl-m lgk-tl-t" aria-hidden={lat}><small>Câu hỏi</small><p className="lgk-tl-hoi"><Chu chu={t.truoc} /></p><span className="lgk-goi">Nhớ trong đầu trước, rồi chạm để lật</span></div>
          <div className="lgk-tl-m lgk-tl-s" aria-hidden={!lat}><small>Đáp</small><p className="lgk-tl-tra"><Chu chu={t.sau} /></p>{t.viSao && <p className="lgk-phu"><Chu chu={t.viSao} /></p>}</div>
        </div>
        <button type="button" aria-expanded={lat} aria-label={lat ? 'Lật lại câu hỏi' : 'Lật thẻ xem đáp'} onClick={() => setLat(!lat)} />
      </div>
    </section>
  )
}
