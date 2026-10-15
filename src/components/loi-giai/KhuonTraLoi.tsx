// KHUÔN TRẢ LỜI v3 của Hỏi Thầy (bản vẽ docs/ban-ve-hoi-thay-v3-1510, thầy chốt 15/10 "chốt build luôn nhé"): câu trả lời đổi HÌNH DẠNG theo ý em
// hỏi — Chỉ chỗ sai (so bài em với lời giải) · Gợi ý từng nấc (em tự mở) · Giải thích (thang xếp hạng, hình vẽ sẵn, đối chiếu) · Từng ý a–d ·
// Tính từng bước (em THỬ một bước). Chung: "Em chưa hiểu chỗ nào?" (chạm là hỏi), "Thầy hỏi lại 1 câu" (em chọn, biết ngay hiểu chưa), phần phụ
// gập lại. Máy chủ (server/src/hoi-tro-ly-cau-truc.ts) chọn khuôn và làm sạch; ở đây kiểm khuôn rồi vẽ. Mở nấc / em thử / Thầy hỏi lại chạy
// TRÊN MÁY EM, không gọi máy chủ. Biểu tượng vẽ tại chỗ (không lucide) để byte mở app không đổi.
import { useState, type ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import OSoTraLoi from '../OSoTraLoi'
import { ChuTo, chuHoa } from './TraLoiThay'
import './khuon-tra-loi.css'

export const KHUON = ['cho-sai', 'goi-y', 'giai-thich', 'tung-y', 'tinh'] as const
export type Khuon = (typeof KHUON)[number]
export const HINH_DUNG = ['cap-e-amine', 'lien-ket-hydrogen', 'glucose-mach-ho', 'xa-phong-hoa'] as const
export type HinhDung = (typeof HINH_DUNG)[number]
type Nac = { ten: string; chu: string; khoi: '' | 'thiNghiem' | 'nhanBiet' | 'soDo' }
type XepHang = { tieuChi: string; chat: { ct: string; ten: string }[]; hoi: number; nguong: { sau: number; tren: string; duoi: string } | null }
type DoiChieu = { a: string; b: string; dong: { tieuChi: string; a: string; b: string }[] }
type YDS = { y: string; noi: string; em: '' | 'D' | 'S'; dapAn: 'D' | 'S'; lyDo: string }
type BuocThu = { buoc: number; hoi: string; dap: string; goiYSai: string }
type KiemLai = { hoi: string; lua: string[]; dung: number; vi: string; goiYSai: string }
export interface PhanKhuon {
  khuon?: Khuon
  soSanh?: { em: string; dung: string; lech: boolean }[]
  nac?: Nac[]
  xepHang?: XepHang
  hinhDung?: HinhDung
  doiChieu?: DoiChieu
  yDS?: YDS[]
  buocThu?: BuocThu
  kiemLai?: KiemLai
  chuaHieu?: string[]
}

type Obj = Record<string, unknown>
const chu = (v: unknown): string => (typeof v === 'string' ? v : '')
const ds = (v: unknown, toiDa: number): Obj[] => (Array.isArray(v) ? v.slice(0, toiDa).filter((x): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x)) : [])
const so = (v: unknown, md: number): number => (typeof v === 'number' && Number.isInteger(v) ? v : md)

/** Kiểm khuôn phần v3; phần sai khuôn thì bỏ riêng phần đó. */
export function docKhuon(o: Obj): PhanKhuon {
  const k: PhanKhuon = {}
  if ((KHUON as readonly string[]).includes(chu(o.khuon))) k.khuon = o.khuon as Khuon
  const ss = ds(o.soSanh, 5).map((x) => ({ em: chu(x.em), dung: chu(x.dung), lech: x.lech === true })).filter((x) => x.em && x.dung)
  if (ss.length >= 2) k.soSanh = ss
  const nac = ds(o.nac, 3).map((x) => ({ ten: chu(x.ten), chu: chu(x.chu), khoi: (['thiNghiem', 'nhanBiet', 'soDo'].includes(chu(x.khoi)) ? chu(x.khoi) : '') as Nac['khoi'] })).filter((x) => x.chu)
  if (nac.length >= 2) k.nac = nac
  const xh = o.xepHang && typeof o.xepHang === 'object' ? (o.xepHang as Obj) : null
  const chat = xh ? ds(xh.chat, 5).map((x) => ({ ct: chu(x.ct), ten: chu(x.ten) })).filter((x) => x.ct) : []
  if (xh && chat.length >= 2) {
    const ng = xh.nguong && typeof xh.nguong === 'object' ? (xh.nguong as Obj) : null
    const sau = ng ? so(ng.sau, -1) : -1
    k.xepHang = { tieuChi: chu(xh.tieuChi) || 'So sánh', chat, hoi: so(xh.hoi, -1), nguong: ng && sau >= 0 && sau < chat.length - 1 && chu(ng.tren) && chu(ng.duoi) ? { sau, tren: chu(ng.tren), duoi: chu(ng.duoi) } : null }
  }
  if ((HINH_DUNG as readonly string[]).includes(chu(o.hinhDung))) k.hinhDung = o.hinhDung as HinhDung
  const dc = o.doiChieu && typeof o.doiChieu === 'object' ? (o.doiChieu as Obj) : null
  const dcDong = dc ? ds(dc.dong, 4).map((x) => ({ tieuChi: chu(x.tieuChi), a: chu(x.a), b: chu(x.b) })).filter((x) => x.tieuChi && x.a && x.b) : []
  if (dc && chu(dc.a) && chu(dc.b) && dcDong.length) k.doiChieu = { a: chu(dc.a), b: chu(dc.b), dong: dcDong }
  const y = ds(o.yDS, 4).filter((x) => chu(x.dapAn) === 'D' || chu(x.dapAn) === 'S')
    .map((x) => ({ y: chu(x.y), noi: chu(x.noi), em: (chu(x.em) === 'D' || chu(x.em) === 'S' ? chu(x.em) : '') as YDS['em'], dapAn: chu(x.dapAn) as 'D' | 'S', lyDo: chu(x.lyDo) }))
  if (y.length) k.yDS = y
  const bt = o.buocThu && typeof o.buocThu === 'object' ? (o.buocThu as Obj) : null
  if (bt && so(bt.buoc, 0) >= 1 && chu(bt.hoi) && /^-?\d+(?:,\d+)?$/.test(chu(bt.dap))) k.buocThu = { buoc: so(bt.buoc, 0), hoi: chu(bt.hoi), dap: chu(bt.dap), goiYSai: chu(bt.goiYSai) }
  const kl = o.kiemLai && typeof o.kiemLai === 'object' ? (o.kiemLai as Obj) : null
  const lua = kl && Array.isArray(kl.lua) ? kl.lua.slice(0, 3).map(chu) : []
  if (kl && chu(kl.hoi) && lua.length === 3 && lua.every(Boolean) && [0, 1, 2].includes(so(kl.dung, -1))) k.kiemLai = { hoi: chu(kl.hoi), lua, dung: so(kl.dung, -1), vi: chu(kl.vi), goiYSai: chu(kl.goiYSai) }
  const ch = Array.isArray(o.chuaHieu) ? o.chuaHieu.slice(0, 3).map(chu).filter(Boolean) : []
  if (ch.length) k.chuaHieu = ch
  return k
}

const NET: Record<string, ReactNode> = {
  ss: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 3v18" /></>,
  den: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6M10 22h4" /></>,
  mat: <><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></>,
  y4: <><path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" /></>,
  tinh: <><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" /></>,
  xh: <><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M7 16h8M7 11h12M7 6h3" /></>,
  hoi: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>,
  khoa: <><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  bay: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></>,
}
export function Net({ ten, co = 18 }: { ten: keyof typeof NET; co?: number }) {
  return <svg width={co} height={co} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{NET[ten]}</svg>
}

/** Nhãn khuôn ở đầu thẻ: em biết ngay Thầy đang trả lời theo cách nào. */
export const NHAN_KHUON: Record<Khuon, { net: keyof typeof NET; chu: string }> = {
  'cho-sai': { net: 'ss', chu: 'Chỉ chỗ sai' },
  'goi-y': { net: 'den', chu: 'Gợi ý từng nấc' },
  'giai-thich': { net: 'mat', chu: 'Giải thích' },
  'tung-y': { net: 'y4', chu: 'Từng ý a–d' },
  tinh: { net: 'tinh', chu: 'Tính từng bước' },
}
const Ct = ({ t }: { t: string }) => <ChemText text={chuHoa(t)} />

/** K1 · SO BÀI EM VỚI LỜI GIẢI: dòng trước chỗ lệch có ✓, dòng lệch đỏ–xanh, dòng sau gạch nhẹ (sai kéo theo). */
export function SoSanh({ dong }: { dong: NonNullable<PhanKhuon['soSanh']> }) {
  const lech = dong.findIndex((d) => d.lech)
  return (
    <section className="lg-k" aria-label="So bài em với lời giải">
      <div className="lg-k-dau"><Net ten="ss" />So bài em với lời giải</div>
      <div className="lg-ss-bang">
        <div className="lg-ss-dau" aria-hidden="true"><span>Em làm</span><span>Đúng là</span></div>
        {dong.map((d, i) => {
          const kieu = lech < 0 ? {} : i < lech ? { 'data-giong': '' } : i === lech ? { 'data-lech': '' } : { 'data-keo': '' }
          return (
            <div key={i} className="lg-ss-dong" {...kieu}>
              {i === lech && <span className="lg-ss-co"><Net ten="bay" co={14} />Chỗ lệch</span>}
              <div className="em"><span className="sr-only">Em làm: </span><Ct t={d.em} /></div>
              <div className="dung"><span className="sr-only">Đúng là: </span><Ct t={d.dung} /></div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** K2 · GỢI Ý TỪNG NẤC: nấc 1 mở sẵn, em bấm mở nấc kế; `khoiCua` vẽ khối v2 (thí nghiệm, nhận biết, sơ đồ) gắn vào nấc. */
export function GoiYNac({ nac, khoiCua, dangLam }: { nac: Nac[]; khoiCua: (k: Nac['khoi']) => ReactNode; dangLam: boolean }) {
  const [mo, setMo] = useState(1)
  const ke = nac[mo]
  return (
    <>
      <div className="lg-nac-tien" role="status">{nac.map((_n, i) => <i key={i} data-xong={i < mo || undefined} />)}<span>Đã mở {mo}/{nac.length} gợi ý</span></div>
      <ol className="lg-nac">
        {nac.slice(0, mo).map((n, i) => (
          <li key={i} data-moi={i > 0 || undefined}>
            <div className="lg-nac-dau"><span className="so" aria-hidden="true">{i + 1}</span>{n.ten ? <Ct t={n.ten} /> : `Gợi ý ${i + 1}`}</div>
            <p><ChuTo text={n.chu} /></p>
            {n.khoi && khoiCua(n.khoi)}
          </li>
        ))}
        {ke && <li data-cho><button type="button" className="lg-nac-mo" onClick={() => setMo((x) => x + 1)}><Net ten="den" />Mở gợi ý {mo + 1}{ke.ten ? <> · <Ct t={ke.ten} /></> : null}</button></li>}
        {dangLam && <li data-khoa><Net ten="khoa" />Đáp án: nộp bài rồi bấm Lời giải từng bước để xem.</li>}
      </ol>
    </>
  )
}

/** K4 · THANG XẾP HẠNG dọc: mạnh / lớn ở trên; vạch ngưỡng sau chất thứ `nguong.sau`; chất em hỏi viền nổi. */
export function XepHangKhoi({ xh }: { xh: XepHang }) {
  return (
    <section className="lg-k" aria-label={xh.tieuChi}>
      <div className="lg-k-dau"><Net ten="xh" /><Ct t={xh.tieuChi} /></div>
      <div className="lg-xh">
        <span className="lg-xh-moc">▲ Mạnh / lớn</span>
        {xh.chat.map((c, i) => (
          <div key={i} className="lg-xh-nhom">
            <div className="lg-xh-hang" data-hoi={i === xh.hoi || undefined}><span className="ct"><Ct t={c.ct} /></span>{(c.ten || i === xh.hoi) && <span className="ten">{c.ten}{i === xh.hoi ? `${c.ten ? ' · ' : ''}chất em hỏi` : ''}</span>}</div>
            {xh.nguong && i === xh.nguong.sau && <div className="lg-xh-nguong"><span>▲ <Ct t={xh.nguong.tren} /></span><span>▼ <Ct t={xh.nguong.duoi} /></span></div>}
          </div>
        ))}
        <span className="lg-xh-moc">▼ Yếu / nhỏ</span>
      </div>
    </section>
  )
}

/** K4 · HÌNH VẼ SẴN (danh sách đóng): mô hình chỉ gửi mã, máy em vẽ. */
export function HinhDungKhoi({ ma }: { ma: HinhDung }) {
  return (
    <figure className="lg-k lg-hd" aria-label="Hình dung">
      <div className="lg-k-dau"><Net ten="mat" />Hình dung</div>
      {ma === 'cap-e-amine' && <CapEAmine />}
      {ma === 'lien-ket-hydrogen' && (
        <div className="lg-hd-2">
          <div><b>Alcohol</b><span className="ct"><Ct t="C2H5–O–H" /></span><span className="lk" data-co>⋮ liên kết hydrogen</span><span className="ct"><Ct t="H–O–C2H5" /></span><small>Có H gắn O ⇒ các phân tử hút nhau mạnh ⇒ <b>sôi cao</b></small></div>
          <div><b>Ester</b><span className="ct"><Ct t="CH3COOCH3" /></span><span className="lk">không có H gắn O</span><small>Không có liên kết hydrogen ⇒ <b>sôi thấp hơn</b></small></div>
        </div>
      )}
      {ma === 'glucose-mach-ho' && (
        <>
          <div className="lg-hd-chuoi" aria-label="Glucose mạch hở: HOCH2, bốn nhóm CHOH, nhóm CHO">
            <span data-n="oh"><Ct t="HOCH2" /></span>{[1, 2, 3, 4].map((i) => <span key={i} data-n="oh"><Ct t="CHOH" /></span>)}<span data-n="cho">CHO</span>
          </div>
          <figcaption className="lg-hd-chu"><span><span className="lg-nhom" data-n="oh">5 nhóm –OH</span> kề nhau ⇒ hoà tan Cu(OH)<sub>2</sub> (dung dịch xanh lam)</span><span><span className="lg-nhom" data-n="cho">1 nhóm –CHO</span> ⇒ tráng bạc, mất màu nước bromine</span></figcaption>
        </>
      )}
      {ma === 'xa-phong-hoa' && (
        <div className="lg-hd-xp">
          <div className="pt"><span data-p="acid"><Ct t="R–COO" /></span><span data-p="ancol"><Ct t="–R'" /></span> + NaOH →</div>
          <div className="ra"><span data-p="acid"><Ct t="R–COONa" /><small>muối: giữ gốc acid</small></span><span data-p="ancol"><Ct t="R'–OH" /><small>alcohol</small></span></div>
        </div>
      )}
    </figure>
  )
}
function CapEAmine() {
  return (
    <>
      <svg viewBox="0 0 320 128" role="img" aria-label="Methylamine: cặp electron của N rảnh, H+ bám vào dễ. Aniline: cặp electron bị vòng benzene kéo vào, H+ bám khó.">
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 92h34" />
          <circle className="mui-luc" cx="96" cy="22" r="11" /><path className="mui-luc ve-mui" d="M96 34v18" /><path className="mui-luc" d="M90 47l6 7 6-7" />
          <path d="M226 64l24 14v28l-24 14-24-14V78z" /><circle cx="226" cy="92" r="11" strokeDasharray="3 4" /><path d="M226 64V50" />
          <path className="mui-do ve-mui" d="M242 30c26 4 30 30 14 40" /><path className="mui-do" d="M252 64l4 7 7-4" />
          <circle cx="292" cy="20" r="11" strokeDasharray="4 3" />
        </g>
        <g fontFamily="inherit" fontWeight="800" fontSize="15" fill="currentColor">
          <text x="6" y="97">CH<tspan fontSize="11" dy="4">3</tspan></text>
          <text x="70" y="97">NH<tspan fontSize="11" dy="4">2</tspan></text>
          <text className="chu-luc" x="88" y="27" fontSize="12">H<tspan fontSize="9" dy="-5">+</tspan></text>
          <text x="212" y="44">NH<tspan fontSize="11" dy="4">2</tspan></text>
          <text x="284" y="25" fontSize="12">H<tspan fontSize="9" dy="-5">+</tspan></text>
        </g>
        <g fill="currentColor"><circle cx="78" cy="74" r="2.6" /><circle cx="86" cy="74" r="2.6" /><circle className="chu-do" cx="232" cy="27" r="2.6" /><circle className="chu-do" cx="240" cy="27" r="2.6" /></g>
      </svg>
      <figcaption className="lg-hd-chu lg-hd-2cot"><span><b>Methylamine</b>cặp e của N rảnh ⇒ H<sup>+</sup> bám dễ</span><span><b>Aniline</b>cặp e bị vòng kéo ⇒ H<sup>+</sup> bám khó</span></figcaption>
    </>
  )
}

/** Phần phụ GẬP LẠI (hé lộ dần — luật C5). */
export function Gon({ tieu, children }: { tieu: string; children: ReactNode }) {
  return <details className="lg-gon"><summary>{tieu}</summary><div>{children}</div></details>
}
export function DoiChieuKhoi({ dc }: { dc: DoiChieu }) {
  return (
    <div className="lg-dc" role="table" aria-label={`Đối chiếu ${dc.a} và ${dc.b}`}>
      <span className="tieu" role="columnheader" /><span className="dau" role="columnheader"><Ct t={dc.a} /></span><span className="dau" role="columnheader"><Ct t={dc.b} /></span>
      {dc.dong.map((d, i) => (
        <div key={i} role="row" className="lg-dc-dong"><span className="tieu" role="rowheader"><Ct t={d.tieuChi} /></span><span role="cell"><Ct t={d.a} /></span><span role="cell"><Ct t={d.b} /></span></div>
      ))}
    </div>
  )
}

const DS_CHU = { D: 'Đúng', S: 'Sai' } as const
/** K6 · TỪNG Ý a–d: "Em: …" (khi máy em gửi bài em) và "Đáp án: …" từ kho; ý em sai nổi lên. */
export function TungY({ y }: { y: YDS[] }) {
  const biet = y.every((x) => x.em)
  const dung = y.filter((x) => x.em && x.em === x.dapAn).length
  return (
    <>
      {biet && <p className="lg-y4-tong">Em đúng <b>{dung}/{y.length}</b> ý</p>}
      <ol className="lg-y4">
        {y.map((x) => (
          <li key={x.y} data-em-sai={(x.em && x.em !== x.dapAn) || undefined}>
            <span className="lg-y4-chu" aria-hidden="true">{x.y}</span>
            <span className="lg-y4-noi"><span className="sr-only">Ý {x.y}: </span><Ct t={x.noi} /></span>
            <span className="lg-y4-nhan">{x.em && <span>Em: {DS_CHU[x.em]}</span>}<span data-kq={x.dapAn === 'D' ? 'dung' : 'sai'}>Đáp án: {DS_CHU[x.dapAn]}</span></span>
            {x.lyDo && <p className="lg-y4-ly"><ChuTo text={x.lyDo} /></p>}
          </li>
        ))}
      </ol>
    </>
  )
}

const soCua = (t: string): number => Number(t.trim().replace(/\s+/g, '').replace(',', '.'))
/** Đúng khi lệch ≤ 1% (làm tròn); "0.16" và "0,16" như nhau. */
export function thuDung(em: string, dap: string): boolean {
  const a = soCua(em), b = soCua(dap)
  if (!Number.isFinite(a) || !Number.isFinite(b) || !em.trim()) return false
  return b === 0 ? a === 0 : Math.abs(a - b) <= Math.abs(b) * 0.01
}
/** K3 · EM THỬ một bước: tính đúng (hoặc bấm "Xem luôn") thì `onXong`. */
/** Em tính đúng ⇒ `onXong(true)` (nơi gọi mở bước, ghi "Em tính đúng"); bấm "Xem luôn" ⇒ `onXong(false)`. */
export function EmThu({ thu, onXong }: { thu: BuocThu; onXong: (dung: boolean) => void }) {
  const [gia, setGia] = useState('')
  const [sai, setSai] = useState(false)
  const kiem = () => { if (thuDung(gia, thu.dap)) onXong(true); else setSai(true) }
  return (
    <div className="lg-thu">
      <label><ChemText text={chuHoa(`Em thử: ${thu.hoi}`)} /></label>
      {/* Ô số dùng chung (luật 21/09: mọi ô đáp số có nút "−" và ","); Enter trong ô = Kiểm tra. */}
      <div className="lg-thu-hang" onKeyDown={(e) => { if (e.key === 'Enter' && e.target instanceof HTMLInputElement) { e.preventDefault(); kiem() } }}>
        <OSoTraLoi value={gia} onChange={(v) => { setGia(v); setSai(false) }} placeholder="Ví dụ 0,5" ariaLabel="Kết quả em tính" maxLength={12} />
        <button type="button" onClick={kiem} disabled={!gia.trim()}>Kiểm tra</button>
      </div>
      <p className="lg-thu-kq" data-kq={sai ? 'sai' : undefined} aria-live="polite">{sai && <Ct t={thu.goiYSai || 'Chưa đúng, em tính lại nhé.'} />}</p>
      <button type="button" className="lg-nut-chu" onClick={() => onXong(false)}>Xem luôn bước {thu.buoc}</button>
    </div>
  )
}

/** THẦY HỎI LẠI 1 CÂU: em chọn ⇒ biết ngay; sai thì chọn lại. */
export function KiemLaiKhoi({ k }: { k: KiemLai }) {
  const [chon, setChon] = useState<number | null>(null)
  const dung = chon === k.dung
  return (
    <section className="lg-kiem" aria-label="Thầy hỏi lại một câu">
      <div className="lg-kiem-dau"><Net ten="hoi" co={16} />Thầy hỏi lại 1 câu</div>
      <p className="lg-kiem-hoi"><ChemText text={chuHoa(k.hoi)} /></p>
      <div className="lg-kiem-lua">
        {k.lua.map((l, i) => (
          <button key={i} type="button" aria-pressed={chon === i} data-chon={chon === i ? (i === k.dung ? 'dung' : 'sai') : undefined} onClick={() => setChon(i)}>
            <b aria-hidden="true">{'ABC'[i]}</b><span><Ct t={l} /></span>
          </button>
        ))}
      </div>
      <p className="lg-kiem-kq" aria-live="polite">{chon === null ? '' : dung ? <>Đúng. <Ct t={k.vi} /></> : <>Chưa đúng. <Ct t={k.goiYSai || 'Em đọc lại phần Thầy giải thích rồi chọn lại nhé.'} /></>}</p>
    </section>
  )
}

/** EM CHƯA HIỂU CHỖ NÀO: chạm là gửi đúng chỗ ấy cho Thầy (1 lượt hỏi). */
export function ChuaHieu({ ds: cac, onHoi, khoa }: { ds: string[]; onHoi: (cau: string) => void; khoa: boolean }) {
  return (
    <div className="lg-chua" role="group" aria-label="Em chưa hiểu chỗ nào">
      <span>Em chưa hiểu chỗ nào? Chạm để hỏi Thầy:</span>
      <div>{cac.map((c) => <button key={c} type="button" disabled={khoa} onClick={() => onHoi(`Em chưa hiểu: ${c}`)}><Ct t={c} /></button>)}</div>
    </div>
  )
}
