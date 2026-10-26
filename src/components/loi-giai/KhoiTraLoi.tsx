// KHỐI HÌNH trong câu trả lời của Thầy (bản vẽ docs/ban-ve-hoi-thay-v2-1410, thầy 14/10: "nếu cần vẽ sơ đồ tạo thí nghiệm ảo nhẹ, làm mọi thứ để
// trả lời học sinh tốt nhất hiểu bài nhanh, in đậm tô màu mọi thứ có thể"). Máy chủ (server/src/hoi-tro-ly-cau-truc.ts) đã làm sạch; ở đây kiểm
// khuôn rồi vẽ. Thí nghiệm ảo CHỈ bằng CSS (không canvas, không ảnh): hoạt cảnh chạy một lần khi khối lọt vào màn, "Làm lại" dựng lại ống;
// máy bật giảm chuyển động ⇒ ống đứng sẵn ở trạng thái cuối. Màu hoá chất lấy từ biến màu có sẵn (luật màu 05/10).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { ChuTo, chuHoa } from './TraLoiThay'
import './khoi-tra-loi.css'

export const HIEN_TUONG = ['quy-xanh', 'quy-do', 'trang-bac', 'tua-trang', 'tua-vang', 'tua-xanh', 'tua-nau-do', 'dd-xanh-lam', 'tim', 'xanh-tim', 'mat-mau', 'khi', 'tach-lop', 'khong-doi'] as const
export type HienTuong = (typeof HIEN_TUONG)[number]
type Ong = { nhan: string; thuoc: string; hien: HienTuong; chu: string; phu: string }
type DongNb = { thuoc: string; hien: HienTuong; chu: string; nhom: string }
type Pt = { trai: string[]; phai: string[]; mui: string; dk: string; chinh: string }
type Tinh = { dong: { nhan: string; phep: string; kq: string }[]; dapSo: string }
export interface KhoiHinh {
  soDo?: { nut: { ten: string; nhan: string }[]; dk: string[] }
  thiNghiem?: Ong[]
  nhanBiet?: DongNb[]
  phuongTrinh?: Pt[]
  tinh?: Tinh
  bay?: { tieuDe: string; chu: string }
}

/** Biểu tượng VẼ TẠI CHỖ (nét lucide): lucide-react bị gom vào mảnh biểu tượng dùng chung tải ngay lúc mở app (+0,5 KB cả 3 app, đo 14/10)
 *  ⇒ vẽ trong mảnh lười này để byte mở app không đổi (luật tốc độ 13/10). */
const HINH: Record<string, ReactNode> = {
  binh: <><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></>,
  pt: <><circle cx="12" cy="12" r="1" /><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" /><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" /></>,
  tinh: <><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" /></>,
  soDo: <><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></>,
  tim: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  bay: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></>,
  lai: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
}
function Hinh({ ten, co = 18 }: { ten: keyof typeof HINH; co?: number }) {
  return <svg width={co} height={co} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{HINH[ten]}</svg>
}

type Obj = Record<string, unknown>
const chu = (v: unknown): string => (typeof v === 'string' ? v : '')
const ds = (v: unknown, toiDa: number): Obj[] => (Array.isArray(v) ? v.slice(0, toiDa).filter((x): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x)) : [])
const laHien = (v: unknown): v is HienTuong => (HIEN_TUONG as readonly string[]).includes(chu(v))
const dsChu = (v: unknown, toiDa: number): string[] => (Array.isArray(v) ? v.slice(0, toiDa).map(chu) : [])

/** Kiểm khuôn từng khối; khối sai khuôn thì bỏ riêng khối đó. */
export function docKhoi(o: Obj): KhoiHinh {
  const k: KhoiHinh = {}
  const sd = o.soDo && typeof o.soDo === 'object' ? (o.soDo as Obj) : null
  const nut = sd ? ds(sd.nut, 6).map((n) => ({ ten: chu(n.ten), nhan: chu(n.nhan) })).filter((n) => n.ten || n.nhan) : []
  if (sd && nut.length >= 2) { const dk = dsChu(sd.dk, 5); k.soDo = { nut, dk: nut.slice(1).map((_n, i) => dk[i] ?? '') } }
  const tn = ds(o.thiNghiem, 4).filter((x) => laHien(x.hien) && chu(x.thuoc) && chu(x.chu))
    .map((x) => ({ nhan: chu(x.nhan), thuoc: chu(x.thuoc), hien: x.hien as HienTuong, chu: chu(x.chu), phu: chu(x.phu) }))
  if (tn.length) k.thiNghiem = tn
  const nb = ds(o.nhanBiet, 5).filter((x) => laHien(x.hien) && chu(x.thuoc) && chu(x.nhom))
    .map((x) => ({ thuoc: chu(x.thuoc), hien: x.hien as HienTuong, chu: chu(x.chu), nhom: chu(x.nhom) }))
  if (nb.length) k.nhanBiet = nb
  const pt = ds(o.phuongTrinh, 3).map((x) => ({ trai: dsChu(x.trai, 5).filter(Boolean), phai: dsChu(x.phai, 5).filter(Boolean), mui: chu(x.mui) === '⇌' ? '⇌' : '→', dk: chu(x.dk), chinh: chu(x.chinh) }))
    .filter((x) => x.trai.length && x.phai.length)
  if (pt.length) k.phuongTrinh = pt
  const ti = o.tinh && typeof o.tinh === 'object' ? (o.tinh as Obj) : null
  const dong = ti ? ds(ti.dong, 6).map((d) => ({ nhan: chu(d.nhan), phep: chu(d.phep), kq: chu(d.kq) })).filter((d) => d.nhan || d.kq) : []
  if (ti && dong.length) k.tinh = { dong, dapSo: chu(ti.dapSo) }
  const by = o.bay && typeof o.bay === 'object' ? (o.bay as Obj) : null
  if (by && chu(by.chu)) k.bay = { tieuDe: chu(by.tieuDe) === 'Chỗ em nhầm' ? 'Chỗ em nhầm' : 'Bẫy hay nhầm', chu: chu(by.chu) }
  return k
}

/** Màu giọt thuốc thử theo tên (nước bromine cam, thuốc tím tím, iodine nâu, Cu(OH)2 xanh lam); còn lại không màu. */
function mauThuoc(thuoc: string): string | undefined {
  if (/brom|Br2/i.test(thuoc)) return 'var(--cam)'
  if (/KMnO4|thuốc tím|permanganat/i.test(thuoc)) return 'var(--tim)'
  if (/iod|\bI2\b/i.test(thuoc)) return 'var(--vd-nau)'
  if (/Cu\(OH\)2|CuSO4/i.test(thuoc)) return 'color-mix(in srgb, var(--gg-xanh) 70%, var(--slate-50))'
  return undefined
}
const KHONG_GIOT = new Set<HienTuong>(['quy-xanh', 'quy-do'])
const KHUON_BOT = [6, 14, 22, 28]

function OngNghiem({ o, tre }: { o: Ong; tre: number }) {
  const giot = mauThuoc(o.thuoc)
  // Mất màu: dung dịch mang màu thuốc thử rồi nhạt hết.
  const kieu = { '--tre': `${tre}s`, ...(giot ? { '--mau-giot': giot } : {}), ...(o.hien === 'mat-mau' ? { '--truoc': `color-mix(in srgb, ${giot ?? 'var(--cam)'} 50%, transparent)` } : {}) } as CSSProperties
  const lua = o.hien === 'trang-bac' || /t°|đun/i.test(o.thuoc)
  return (
    <div className="lg-tn" data-h={o.hien} style={kieu}>
      <span className="lg-tn-nhan">{o.nhan ? <ChemText text={chuHoa(o.nhan)} /> : ' '}</span>
      <span className="lg-tn-thuoc"><span><ChemText text={chuHoa(o.thuoc)} /></span></span>
      <div className="lg-tn-voi" aria-hidden="true">
        {!KHONG_GIOT.has(o.hien) && <span className="lg-tn-giot" />}
        <span className="lg-tn-mieng" />
        <div className="lg-tn-ong">
          <div className="lg-tn-long">{o.hien === 'khi' && KHUON_BOT.map((x) => <span key={x} className="lg-tn-bot" style={{ left: x }} />)}</div>
          {o.hien === 'tach-lop' && <div className="lg-tn-lop" />}
          {KHONG_GIOT.has(o.hien) && <div className="lg-tn-quy" />}
          {o.hien.startsWith('tua-') && <div className="lg-tn-tua" />}
          {o.hien === 'trang-bac' && <div className="lg-tn-guong" />}
        </div>
        {lua && <span className="lg-tn-lua" />}
      </div>
      <span className="lg-tn-chu"><b><ChemText text={chuHoa(o.chu)} /></b>{o.phu && <ChuTo text={o.phu} />}</span>
    </div>
  )
}

export function ThiNghiem({ ong }: { ong: Ong[] }) {
  const [lan, setLan] = useState(0)
  const [chay, setChay] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // Hoạt cảnh đứng ở khung đầu tới khi khối lọt vào màn (em đang đọc phía trên thì chưa chạy hết mất); máy không có IntersectionObserver ⇒ chạy ngay.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setChay(true); return }
    const io = new IntersectionObserver((d) => { if (d.some((x) => x.isIntersecting)) { setChay(true); io.disconnect() } }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section className="lg-k" aria-label="Thí nghiệm ảo">
      <div className="lg-k-dau">
        <Hinh ten="binh" />Thí nghiệm ảo
        <button type="button" onClick={() => setLan((n) => n + 1)} aria-label="Làm lại thí nghiệm"><Hinh ten="lai" co={16} />Làm lại</button>
      </div>
      <div key={lan} ref={ref} className="lg-tn-hang" data-chay={chay || undefined} style={{ '--so': ong.length } as CSSProperties}>
        {ong.map((o, i) => <OngNghiem key={i} o={o} tre={i * 0.9} />)}
      </div>
      <p className="sr-only">{ong.map((o) => `${o.nhan ? `${o.nhan} với ` : ''}${o.thuoc}: ${o.chu}${o.phu ? `, ${o.phu}` : ''}.`).join(' ')}</p>
    </section>
  )
}

/** Nhóm chức trong ô "nhom": phần đầu là nhóm có gạch ⇒ nhãn màu; phần còn lại chữ thường (ChuTo tự gắn nhãn cho nhóm đứng riêng). */
export function NhanBiet({ dong }: { dong: DongNb[] }) {
  return (
    <section className="lg-k" aria-label="Hiện tượng và nhóm chức">
      <div className="lg-k-dau"><Hinh ten="tim" />Hiện tượng → nhóm chức</div>
      <div className="lg-nb">
        {dong.map((r, i) => (
          <div key={i} className="lg-nb-dong">
            <span className="lg-thuoc"><ChemText text={chuHoa(r.thuoc)} /></span>
            <i aria-hidden="true">→</i>
            <span className="lg-hien" data-h={r.hien}><ChemText text={chuHoa(r.chu || r.hien)} /></span>
            <i aria-hidden="true">⇒</i>
            <span><ChuTo text={r.nhom} /></span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function PhuongTrinh({ pt }: { pt: Pt[] }) {
  const o = (c: string, sp: boolean, chinh: boolean, k: string) => <span key={k} className="c" data-sp={sp || undefined} data-chinh={chinh || undefined}><ChemText text={chuHoa(c)} /></span>
  return (
    <section className="lg-k" aria-label="Phương trình">
      <div className="lg-k-dau"><Hinh ten="pt" />Phương trình</div>
      {pt.map((p, i) => (
        <div key={i} className="lg-pt">
          {p.trai.flatMap((c, j) => [...(j ? [<span key={`c${j}`} className="cong">+</span>] : []), o(c, false, c === p.chinh, `t${j}`)])}
          <span className="mui"><span>{p.dk ? <ChemText text={chuHoa(p.dk)} /> : ' '}</span><i>{p.mui === '⇌' ? '⇌' : '⟶'}</i></span>
          {p.phai.flatMap((c, j) => [...(j ? [<span key={`d${j}`} className="cong">+</span>] : []), o(c, true, c === p.chinh, `p${j}`)])}
        </div>
      ))}
    </section>
  )
}

/** Kết quả mỗi dòng in đậm màu; dòng "Đáp số" làm nổi. */
export function TinhNhanh({ tinh }: { tinh: Tinh }) {
  return (
    <section className="lg-k" aria-label="Tính nhanh">
      <div className="lg-k-dau"><Hinh ten="tinh" />Tính nhanh</div>
      <dl className="lg-tinh">
        {tinh.dong.map((d, i) => (
          <div key={i} className="lg-tinh-dong">
            <dt><ChemText text={chuHoa(d.nhan)} /></dt>
            <dd>{d.phep && <><ChemText text={chuHoa(d.phep)} /> = </>}<b><ChemText text={chuHoa(d.kq)} /></b></dd>
          </div>
        ))}
        {tinh.dapSo && <div className="cuoi"><dt>Đáp số</dt><dd><ChemText text={chuHoa(tinh.dapSo)} /></dd></div>}
      </dl>
    </section>
  )
}

export function SoDo({ soDo }: { soDo: NonNullable<KhoiHinh['soDo']> }) {
  const n = soDo.nut.length
  return (
    <section className="lg-k" aria-label="Sơ đồ chuyển hoá">
      <div className="lg-k-dau"><Hinh ten="soDo" />Sơ đồ chuyển hoá</div>
      <ol className="lg-sd">
        {soDo.nut.map((x, i) => (
          <li key={i}>
            {i > 0 && <span className="mui">{soDo.dk[i - 1] ? <span><ChemText text={chuHoa(soDo.dk[i - 1]!)} /></span> : null}<span className="sr-only">tạo ra</span></span>}
            <span className="nut" data-dau={i === 0 || undefined} data-cuoi={(i === n - 1 && i > 0) || undefined}>
              {x.ten && <span><ChemText text={chuHoa(x.ten)} /></span>}
              {x.nhan && (x.ten ? <small>{x.nhan}</small> : <b>{x.nhan}</b>)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Bay({ bay }: { bay: NonNullable<KhoiHinh['bay']> }) {
  return (
    <aside className="lg-bay" aria-label={bay.tieuDe}>
      <Hinh ten="bay" co={20} />
      <div><b className="tieu">{bay.tieuDe}</b><ChuTo text={bay.chu} /></div>
    </aside>
  )
}

