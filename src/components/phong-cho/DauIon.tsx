// «ĐẤU ION» — game bắn nhau của phòng chờ thi (thầy 30/10: «thay hoàn toàn game hiện tại … học sinh chờ có thể bắn với nhau được luôn qua số báo danh»;
// 30/10 22:45 «tự duyệt bản vẽ build luôn»). Đặc tả + bản vẽ: docs/dac-ta-game-ban-sung-3010.md, docs/ban-ve-game-ban-sung-3010/.
// Mảnh nạp lười (chỉ tải khi em đang ở phòng chờ). Sảnh đấu nằm trong thẻ của phòng chờ; trận phủ kín khung nhìn (vẫn giữ dải «Phòng chờ» trên cùng).
// KHÔNG cản ca kiểm tra: `batDau` (màn cha thấy thầy bắt đầu) hoặc phòng đấu báo `dong` ⇒ đóng WebSocket, dừng vòng vẽ, chỉ còn một dòng chữ.
// Kết quả chỉ để vui: không gửi điểm, không EXP, không bảng xếp hạng máy chủ.
import { useCallback, useEffect, useRef, useState, type PointerEvent as PE } from 'react'
import { createPortal } from 'react-dom'
import './ban-nguyen-to.css'
import { dprToiDa, giamHieuUng } from '../../lib/may-yeu'
import { layCauHinhMayChu } from '../../lib/may-chu-moi'
import { NGUYEN_TO, TEN_NGUYEN_TO, type KieuTran, type YDinh } from '../../lib/dau-ion/loi'
import { VeSan, docBang } from './dau-ion-ve'
import { TranAI, TranMang, ngamGanNhat, type BoChay, type KetTran, type ThongTinGhe } from './dau-ion-tran'
import { MangDau, duongPhong, type TinMang } from './dau-ion-mang'

type Mang = 'chua' | 'noi' | 'mo' | 'mat' | 'tat' | 'het-ve' | 'may-khac' | 'day'
type TT = 'ranh' | 'tim' | 'dau'
interface Ban { id: number; ten: string; nt: number; tt: TT }
interface Moi { tu: number; ten: string; nt: number; het: number }
interface Nhom { ma: number; chu: number; ds: number[] }
interface CaiDat { nt: number; an: boolean; km: boolean; vao: boolean }
const KHO = 'ddh.dauIon'
const PHAN_UNG = ['Hay đấy!', 'Suýt nữa!', 'Đấu lại nhé', 'Chơi đẹp']
const ngayNay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

function docCaiDat(): CaiDat {
  try { const j = JSON.parse(localStorage.getItem(KHO) || '{}'); return { nt: Number.isInteger(j.nt) && j.nt >= 0 && j.nt < NGUYEN_TO.length ? j.nt : Math.floor(Math.random() * NGUYEN_TO.length), an: !!j.an, km: !!j.km, vao: !!j.vao } }
  catch { return { nt: 0, an: false, km: false, vao: false } }
}
function luuCaiDat(c: CaiDat): void { try { const j = JSON.parse(localStorage.getItem(KHO) || '{}'); localStorage.setItem(KHO, JSON.stringify({ ...j, ...c })) } catch { /* chế độ riêng tư */ } }
function docThang(): number { try { const j = JSON.parse(localStorage.getItem(KHO) || '{}'); return j.ngay === ngayNay() ? Number(j.thang) || 0 : 0 } catch { return 0 } }
function ghiThang(n: number): void { try { const j = JSON.parse(localStorage.getItem(KHO) || '{}'); localStorage.setItem(KHO, JSON.stringify({ ...j, ngay: ngayNay(), thang: n })) } catch { /* bỏ qua */ } }

const ntLop = (nt: number) => `di-nt-${(NGUYEN_TO[nt] ?? 'Na').toLowerCase()}`
function Nut({ nt, nho }: { nt: number; nho?: boolean }) { return <span className={`di-hat ${ntLop(nt)}${nho ? ' di-hat-nho' : ''}`} aria-hidden="true">{NGUYEN_TO[nt]}</span> }
const CHU_TT: Record<TT, string> = { ranh: 'Rảnh', tim: 'Đang tìm trận', dau: 'Đang đấu' }

export interface DauIonProps { maCa?: string; veDau?: string; batDau?: boolean }

export default function DauIon({ maCa, veDau, batDau }: DauIonProps) {
  const [cd, setCd] = useState<CaiDat>(docCaiDat)
  const [mang, setMang] = useState<Mang>(veDau && maCa ? 'chua' : 'tat')
  const [lanMat, setLanMat] = useState(0)
  const [toi, setToi] = useState(0)
  const [ban, setBan] = useState<Ban[]>([])
  const [moi, setMoi] = useState<Moi | null>(null)
  const [nhom, setNhom] = useState<Nhom | null>(null)
  const [tin, setTin] = useState('')
  const [tran, setTran] = useState<{ bo: BoChay; ten: Record<number, string>; key: number } | null>(null)
  const [dangTim, setDangTim] = useState(false)
  const [thang, setThang] = useState(docThang)
  const [moNhom, setMoNhom] = useState(false)
  const [maNhap, setMaNhap] = useState('')
  const [sbdNhap, setSbdNhap] = useState('')
  const [dong, setDong] = useState(false)
  const [pu, setPu] = useState<{ tu: number; i: number; luc: number } | null>(null)
  const mangRef = useRef<MangDau | null>(null)
  const tranMangRef = useRef<TranMang | null>(null)
  const cdRef = useRef(cd); cdRef.current = cd
  const banRef = useRef(ban); banRef.current = ban
  const toiRef = useRef(toi); toiRef.current = toi
  const mucAI = useRef<0 | 1>(0)
  const ketThuc = batDau || dong

  const doiCd = (moi_: Partial<CaiDat>) => {
    const c = { ...cdRef.current, ...moi_ }
    setCd(c); luuCaiDat(c)
    if (mangRef.current?.mo_ && ('nt' in moi_ || 'an' in moi_ || 'km' in moi_)) mangRef.current.gui({ t: 'doi', nt: c.nt, an: c.an, km: c.km })
  }

  const nhanTin = useCallback((t: TinMang) => {
    if (t.k === 'mo') { setMang('mo'); setLanMat(0); return }
    if (t.k === 'mat') { setMang('mat'); setLanMat(t.lan); return }
    if (t.k === 'dong') {
      if (t.ma === 4000) setDong(true)
      setMang(t.ma === 4010 ? 'tat' : t.ma === 4003 ? 'het-ve' : t.ma === 4002 ? 'may-khac' : t.ma === 4009 ? 'day' : 'tat')
      setTran((x) => (x && x.bo instanceof TranMang ? null : x)); return
    }
    if (t.k === 'anh') { tranMangRef.current?.nhanAnh(t.a, performance.now()); return }
    const j = t.j
    switch (j.t) {
      case 'chao': setToi(Number(j.toi)); setBan(((j.ds as unknown[][]) ?? []).map((d) => ({ id: Number(d[0]), ten: String(d[1]), nt: Number(d[2]), tt: d[3] as TT }))); return
      case 's': { const d = j.d as unknown[]; const b: Ban = { id: Number(d[0]), ten: String(d[1]), nt: Number(d[2]), tt: d[3] as TT }; setBan((ds) => { const i = ds.findIndex((x) => x.id === b.id); if (i < 0) return [...ds, b]; const n = ds.slice(); n[i] = b; return n }); if (b.id === toiRef.current) setDangTim(b.tt === 'tim'); return }
      case 'x': setBan((ds) => ds.filter((x) => x.id !== Number(j.id))); return
      case 'moi': setMoi({ tu: Number(j.tu), ten: String(j.ten), nt: Number(j.nt), het: Date.now() + Number(j.con) * 1000 }); return
      case 'tin': case 'loi': setTin(String(j.chu ?? '')); return
      case 'nhom': setNhom(Number(j.ma) ? { ma: Number(j.ma), chu: Number(j.chu), ds: (j.ds as number[]) ?? [] } : null); if (j.tin) setTin(String(j.tin)); return
      case 'tran': {
        const ghe = ((j.ghe as unknown[][]) ?? []).map((g) => ({ id: Number(g[0]), ten: String(g[1]), nt: Number(g[2]) }))
        const bo = new TranMang(Number(j.toi), j.kieu as KieuTran, ghe, (b) => mangRef.current?.gui(b))
        tranMangRef.current = bo
        setMoi(null); setDangTim(false); setTin('')
        setTran({ bo, ten: Object.fromEntries(ghe.map((g) => [g.id, g.ten])), key: Date.now() }); return
      }
      case 'ket': {
        const b = tranMangRef.current
        if (b) b.datKet({ thang: j.thang == null ? null : Number(j.thang), roi: !!j.roi, banRoi: !!j.banRoi, bang: ((j.bang as number[][]) ?? []).map((d) => ({ id: d[0], ha: d[1], biHa: d[2], ban: d[3], trung: d[4], chuoiMax: d[5] })) })
        return
      }
      case 'pu': setPu({ tu: Number(j.tu), i: Number(j.i), luc: Date.now() }); return
      case 'dong': setDong(true); return
    }
  }, [])

  const vaoSanh = useCallback(async () => {
    if (!veDau || !maCa || mangRef.current) return
    setMang('noi')
    let goc = ''
    try { goc = (await layCauHinhMayChu()).URL || '' } catch { /* không đọc được cấu hình */ }
    if (!goc) { setMang('mat'); setLanMat(9); return }
    const m = new MangDau(duongPhong(goc, maCa), () => ({ t: 'vao', ve: veDau, nt: cdRef.current.nt, an: cdRef.current.an, km: cdRef.current.km }), nhanTin)
    mangRef.current = m; m.mo()
    if (!cdRef.current.vao) doiCd({ vao: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veDau, maCa, nhanTin])

  // Em từng vào sảnh ở phòng chờ trước ⇒ tự vào lại (một chạm ít hơn); thầy bắt đầu ⇒ đóng hết.
  useEffect(() => { if (cd.vao && mang === 'chua' && !ketThuc) void vaoSanh() }, [cd.vao, mang, ketThuc, vaoSanh])
  useEffect(() => {
    if (!ketThuc) return
    mangRef.current?.dong(); mangRef.current = null; tranMangRef.current = null
    setTran(null); setMoi(null)
  }, [ketThuc])
  useEffect(() => () => { mangRef.current?.dong(); mangRef.current = null }, [])
  // Lời thách đếm lùi (setTimeout nối tiếp, chỉ khi có lời thách).
  const [, setNhip] = useState(0)
  useEffect(() => {
    if (!moi) return
    if (moi.het <= Date.now()) { setMoi(null); return }
    const h = window.setTimeout(() => setNhip((n) => n + 1), 1000)
    return () => clearTimeout(h)
  })
  useEffect(() => { if (!tin) return; const h = window.setTimeout(() => setTin(''), 5000); return () => clearTimeout(h) }, [tin])

  const tapAI = () => {
    const ten: [string, string] = ['Em', `A.I ${NGUYEN_TO[(cd.nt + 3) % NGUYEN_TO.length]}`]
    const bo = new TranAI(ten, cd.nt, (cd.nt + 3) % NGUYEN_TO.length, mucAI.current)
    if (dangTim) { mangRef.current?.gui({ t: 'huy' }); setDangTim(false) }
    setTran({ bo, ten: { 1: ten[0], 2: ten[1] }, key: Date.now() })
  }
  const xongTran = (k: KetTran, bo: BoChay) => {
    if (k.thang === bo.emId && !k.roi) { const n = thang + 1; setThang(n); ghiThang(n); if (bo instanceof TranAI) mucAI.current = 1 }
    else if (bo instanceof TranAI && k.thang !== null) mucAI.current = 0
  }
  const veSanh = () => { setTran(null); tranMangRef.current = null }
  const dauLai = (bo: BoChay) => {
    if (bo instanceof TranAI) { tapAI(); return }
    const ban_ = bo.bang().ghe.find((g) => g.id !== bo.emId)
    veSanh()
    if (ban_ && bo.kieu === 'doi') mangRef.current?.gui({ t: 'thach', den: ban_.id })
  }

  if (ketThuc) {
    return <section className="pc-bn di" aria-label="Mini-game Đấu Nguyên Tử">
      <div className="di-dong" role="status"><strong>Thầy đã bắt đầu thi</strong><span>Đấu Nguyên Tử đã dừng. Em đang được đưa vào bài…</span></div>
    </section>
  }

  const coMang = mang === 'mo'
  const banKhac = ban.filter((b) => b.id !== toi)
  const lienMang = mang === 'chua' || mang === 'noi' || mang === 'mat'
  const chuMang: Record<Mang, string> = {
    chua: '', noi: 'Đang vào sảnh đấu…', mo: '',
    mat: lanMat >= 5 ? 'Chưa nối được sảnh đấu. Em vẫn tập được với A.I.' : `Mất kết nối sảnh đấu — đang thử lại (lần ${lanMat + 1})…`,
    tat: 'Sảnh đấu chưa mở ở ca này. Em vẫn tập được với A.I.', 'het-ve': 'Vé vào sảnh đấu đã hết hạn. Em vẫn tập được với A.I.',
    'may-khac': 'Em đang mở Đấu Nguyên Tử ở máy hoặc tab khác.', day: 'Sảnh đấu đã đủ người. Em tập với A.I trong lúc chờ nhé.',
  }

  return <section className="pc-bn di" aria-label="Mini-game Đấu Nguyên Tử">
    <div className="pc-bn-head">
      <div><div className="pc-bn-eyebrow">CHƠI MỘT CHÚT TRONG LÚC CHỜ</div><h2>Đấu Nguyên Tử</h2></div>
      <div className="pc-bn-score"><span>Thắng hôm nay</span><strong>{thang}</strong></div>
    </div>
    <AnhBia />
    <p className="di-mo-ta">Bắn nhau bằng súng ion với bạn cùng phòng chờ. Mỗi bạn có 3 vỏ electron (Máu 3); hạ 5 lần trước là thắng.</p>

    {moi && <div className="di-moi" role="alertdialog" aria-labelledby="di-moi-chu">
      <Nut nt={moi.nt} />
      <p id="di-moi-chu"><b>{moi.ten}</b> thách em đấu 1–1 · còn <span className="so">{Math.max(0, Math.ceil((moi.het - Date.now()) / 1000))}</span> giây</p>
      <div><button type="button" className="di-nut di-nut-chinh" onClick={() => mangRef.current?.gui({ t: 'nhan', tu: moi.tu })}>Nhận lời</button>
        <button type="button" className="di-nut di-nut-chu" onClick={() => { mangRef.current?.gui({ t: 'tu-choi', tu: moi.tu }); setMoi(null) }}>Để sau</button></div>
    </div>}
    {tin && <p className="di-tin" role="status">{tin}</p>}

    {coMang ? <div className="di-hanh-dong">
      {dangTim
        ? <div className="di-tim" role="status"><span className="di-cham" aria-hidden="true" />Đang tìm bạn rảnh… <button type="button" className="di-nut di-nut-chu" onClick={() => { mangRef.current?.gui({ t: 'huy' }); setDangTim(false) }}>Huỷ tìm</button></div>
        : <button type="button" className="di-nut di-nut-chinh di-nut-to" onClick={() => mangRef.current?.gui({ t: 'nhanh' })}>Đấu nhanh</button>}
      <div className="di-hang">
        <button type="button" className="di-nut di-nut-vien" onClick={tapAI}>Tập với A.I</button>
        <button type="button" className="di-nut di-nut-vien" aria-expanded={moNhom} onClick={() => setMoNhom((x) => !x)}>Nhóm 3–4 bạn</button>
      </div>
      {dangTim && <p className="di-phu">Chưa có ai rảnh thì em cứ Tập với A.I — vẫn giữ chỗ trong hàng đấu nhanh.</p>}
    </div> : <div className="di-hanh-dong">
      {mang === 'chua'
        ? <button type="button" className="di-nut di-nut-chinh di-nut-to" onClick={() => void vaoSanh()}>Vào sảnh đấu</button>
        : <button type="button" className="di-nut di-nut-chinh di-nut-to" onClick={tapAI}>Tập với A.I</button>}
      {mang === 'chua' && <button type="button" className="di-nut di-nut-vien" onClick={tapAI}>Tập với A.I</button>}
      {mang === 'may-khac' && <button type="button" className="di-nut di-nut-vien" onClick={() => { mangRef.current = null; setMang('chua'); void vaoSanh() }}>Chơi ở máy này</button>}
      {chuMang[mang] && <p className="di-phu" role="status">{lienMang && mang !== 'mat' ? <span className="di-cham" aria-hidden="true" /> : null}{chuMang[mang]}</p>}
    </div>}

    {coMang && (moNhom || nhom) && <div className="di-nhom">
      {nhom ? <>
        <p><b>Nhóm <span className="so">{nhom.ma}</span></b> · <span className="so">{nhom.ds.length}</span>/4 bạn: {nhom.ds.map((id) => id === toi ? 'Em' : banRef.current.find((b) => b.id === id)?.ten ?? 'Bạn').join(', ')}</p>
        <p className="di-phu">Đọc mã nhóm cho bạn ngồi cạnh để vào cùng.</p>
        <div className="di-hang">
          {nhom.chu === toi && <button type="button" className="di-nut di-nut-chinh" disabled={nhom.ds.length < 2} onClick={() => mangRef.current?.gui({ t: 'nhom-bat' })}>Bắt đầu nhóm</button>}
          <button type="button" className="di-nut di-nut-vien" onClick={() => mangRef.current?.gui({ t: 'nhom-roi' })}>Rời nhóm</button>
        </div>
      </> : <div className="di-hang">
        <button type="button" className="di-nut di-nut-vien" onClick={() => mangRef.current?.gui({ t: 'nhom-tao' })}>Tạo nhóm</button>
        <label className="di-o"><span>Mã nhóm</span><input inputMode="numeric" maxLength={2} value={maNhap} onChange={(e) => setMaNhap(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter' && maNhap) mangRef.current?.gui({ t: 'nhom-vao', ma: Number(maNhap) }) }} /></label>
        <button type="button" className="di-nut di-nut-vien" disabled={maNhap.length < 2} onClick={() => mangRef.current?.gui({ t: 'nhom-vao', ma: Number(maNhap) })}>Vào nhóm</button>
      </div>}
    </div>}

    {coMang && <div className="di-ban">
      <h3>Bạn trong sảnh đấu · <span className="so">{banKhac.length}</span></h3>
      {banKhac.length === 0 ? <p className="di-phu">Chưa có bạn nào vào sảnh đấu. Rủ bạn ngồi cạnh bấm «Vào sảnh đấu», hoặc tập với A.I trong lúc chờ.</p>
        : <ul>{banKhac.map((b) => <li key={b.id}>
          <Nut nt={b.nt} /><span className="di-ten">{b.ten}<small>{CHU_TT[b.tt]}</small></span>
          {b.tt !== 'dau' && <button type="button" className="di-nut di-nut-vien di-nut-nho" onClick={() => mangRef.current?.gui({ t: 'thach', den: b.id })}>Thách</button>}
        </li>)}</ul>}
      <form className="di-sbd" onSubmit={(e) => { e.preventDefault(); if (sbdNhap.trim()) { mangRef.current?.gui({ t: 'thach', sbd: sbdNhap.trim() }); setSbdNhap('') } }}>
        <label className="di-o"><span>Thách theo số báo danh</span><input inputMode="numeric" autoComplete="off" maxLength={20} value={sbdNhap} onChange={(e) => setSbdNhap(e.target.value)} placeholder="Số báo danh của bạn" /></label>
        <button type="submit" className="di-nut di-nut-vien" disabled={!sbdNhap.trim()}>Thách</button>
      </form>
    </div>}

    <div className="di-cai-dat">
      <span className="di-nhan">Nguyên tố của em</span>
      <div className="di-chon-nt" role="radiogroup" aria-label="Nguyên tố của em">
        {NGUYEN_TO.map((k, i) => <button key={k} type="button" role="radio" aria-checked={cd.nt === i} aria-label={`${k} · ${TEN_NGUYEN_TO[i]}`} className={`di-hat ${ntLop(i)}`} onClick={() => doiCd({ nt: i })}>{k}</button>)}
      </div>
      {coMang && <div className="di-cong-tac">
        <label><input type="checkbox" checked={cd.an} onChange={(e) => doiCd({ an: e.target.checked })} />Ẩn tên (bạn thấy «Bạn {NGUYEN_TO[cd.nt]}»)</label>
        <label><input type="checkbox" checked={cd.km} onChange={(e) => doiCd({ km: e.target.checked })} />Không nhận lời thách</label>
      </div>}
    </div>

    {tran && createPortal(<ManTran key={tran.key} bo={tran.bo} ten={tran.ten} pu={pu} onPhanUng={(i) => mangRef.current?.gui({ t: 'pu', i })}
      onRoi={() => { if (tran.bo instanceof TranMang && !tran.bo.ketQua()) mangRef.current?.gui({ t: 'roi-tran' }); veSanh() }}
      onXong={xongTran} onDauLai={dauLai} />, document.body)}
  </section>
}

function AnhBia() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ve = () => { try { const r = cv.getBoundingClientRect(); VeSan.veBia(cv, docBang(cv.parentElement!), r.width, r.height, dprToiDa(1.5)) } catch { /* thiếu Canvas */ } }
    ve()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(ve) : null
    ro?.observe(cv)
    const mo = new MutationObserver(ve); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-giao-dien', 'class'] })
    return () => { ro?.disconnect(); mo.disconnect() }
  }, [])
  return <div className="di-bia"><canvas ref={ref} aria-hidden="true" /></div>
}

interface ManTranProps {
  bo: BoChay; ten: Record<number, string>; pu: { tu: number; i: number; luc: number } | null
  onPhanUng: (i: number) => void; onRoi: () => void; onXong: (k: KetTran, bo: BoChay) => void; onDauLai: (bo: BoChay) => void
}

/** Màn trận: phủ kín khung nhìn, vòng vẽ requestAnimationFrame (máy yếu 30 khung/giây), cần điều khiển chạm, chuột, bàn phím. */
function ManTran({ bo, ten, pu, onPhanUng, onRoi, onXong, onDauLai }: ManTranProps) {
  const goc = useRef<HTMLDivElement>(null)
  const khung = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const canTrai = useRef<HTMLDivElement>(null)
  const canPhai = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState<{ con: number; ghe: ThongTinGhe[] }>(() => bo.bang())
  const [tinHa, setTinHa] = useState<{ chu: string; luc: number; emBiHa: boolean } | null>(null)
  const [nhatKy, setNhatKy] = useState<string[]>([])
  const [ket, setKet] = useState<KetTran | null>(null)
  const [khongVe, setKhongVe] = useState(false)
  const mang = bo instanceof TranMang
  // Hàm của màn cha đổi mỗi lần vẽ lại ⇒ giữ trong ref, vòng vẽ chỉ dựng lại khi đổi trận.
  const cb = useRef({ ten, onXong }); cb.current = { ten, onXong }
  const dk = useRef({ phim: new Set<string>(), jx: 0, jy: 0, ngam: -Math.PI / 4, giuPhai: false, giuChuot: false, banPhim: false, banDen: 0, tuNgamDen: 0, chuotLuc: -1e9, trai: null as null | { id: number; x: number; y: number }, phai: null as null | { id: number; x: number; y: number; t: number; xa: number } })

  useEffect(() => {
    const c = cv.current, g = goc.current, kh = khung.current
    if (!c || !g || !kh) return
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx = c.getContext('2d') } catch { /* thiếu Canvas */ }
    if (!ctx) { setKhongVe(true); return }
    let giam = giamHieuUng()
    const ve = new VeSan(c, ctx, docBang(g), giam)
    let canh = 0
    const doiCo = () => { const r = kh.getBoundingClientRect(); const n = Math.floor(Math.min(r.width, r.height)); if (n > 0 && n !== canh) { canh = n; c.style.width = `${n}px`; c.style.height = `${n}px`; ve.datCo(n, giam ? 1 : dprToiDa(1.5)) } }
    doiCo()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(doiCo) : null
    ro?.observe(kh); window.addEventListener('resize', doiCo)
    const doiNen = () => { ve.datBang(docBang(g)); giam = giamHieuUng(); ve.datGiam(giam) }
    const mo = new MutationObserver(doiNen); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-giao-dien', 'class'] })
    const mq = matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', doiNen)

    let raf = 0, truoc = 0, khoaHud = '', daKet = false
    const d = dk.current
    const yd: YDinh = { dx: 0, dy: 0, ngam: d.ngam, ban: false }
    let canhCu = bo.canh(performance.now(), false)
    const khungHinh = (nay: number) => {
      raf = requestAnimationFrame(khungHinh)
      if (document.hidden) { truoc = nay; return }
      if (giam && nay - truoc < 31) return
      const dt = truoc ? Math.min(0.1, (nay - truoc) / 1000) : 0
      truoc = nay
      // Ý định từ cần điều khiển + phím.
      const p = d.phim
      let dx = d.jx + ((p.has('ArrowRight') || p.has('KeyD')) ? 1 : 0) - ((p.has('ArrowLeft') || p.has('KeyA')) ? 1 : 0)
      let dy = d.jy + ((p.has('ArrowDown') || p.has('KeyS')) ? 1 : 0) - ((p.has('ArrowUp') || p.has('KeyW')) ? 1 : 0)
      const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l }
      const chuot = nay - d.chuotLuc < 3000
      const tuNgam = nay < d.tuNgamDen || (d.banPhim && !chuot)
      if (tuNgam) { const a = ngamGanNhat(canhCu); if (a !== null) d.ngam = a }
      else if (!d.giuPhai && !chuot && l > 0.2) d.ngam = Math.atan2(dy, dx)
      yd.dx = dx; yd.dy = dy; yd.ngam = d.ngam; yd.ban = d.giuPhai || d.giuChuot || d.banPhim || nay < d.banDen || nay < d.tuNgamDen
      if (dt > 0) bo.buoc(dt, yd, nay)
      const sc = bo.canh(nay, d.giuPhai || chuot)
      if (bo instanceof TranMang) bo.datNgamEm(sc, d.ngam)
      canhCu = sc
      for (const s of bo.laySu()) {
        ve.them(s, (id) => bo.ntCua(id), nay)
        if (s.t === 'ha') {
          const ten = cb.current.ten
          const a = s.boi === bo.emId ? 'Em' : ten[s.boi] ?? 'Bạn', b = s.ai === bo.emId ? 'em' : ten[s.ai] ?? 'bạn'
          setNhatKy((k) => [...k.slice(-2), `${a} hạ ${b}`])
          if (s.boi === bo.emId || s.ai === bo.emId) setTinHa({ chu: s.ai === bo.emId ? `${ten[s.boi] ?? 'Bạn'} hạ em · hồi lại sau 1,6 giây` : `Em hạ ${ten[s.ai] ?? 'bạn'}!`, luc: nay, emBiHa: s.ai === bo.emId })
        }
        if (s.t === 'trung' && s.ai === bo.emId && !giam) { try { navigator.vibrate?.(12) } catch { /* không rung được */ } }
      }
      ve.ve(sc, nay)
      const b = bo.bang()
      const k = `${Math.ceil(b.con)}|${b.ghe.map((x) => `${x.mau}${x.ha}${x.biHa}${x.cho ? 1 : 0}`).join(',')}`
      if (k !== khoaHud) { khoaHud = k; setHud(b) }
      const kq = bo.ketQua()
      if (kq && !daKet) { daKet = true; setKet(kq); cb.current.onXong(kq, bo) }
    }
    raf = requestAnimationFrame(khungHinh)

    const phimXuong = (e: KeyboardEvent) => {
      if (/^(Arrow|Key[WASD]$)/.test(e.code)) { d.phim.add(e.code); e.preventDefault() }
      else if (e.code === 'Space') { d.banPhim = true; e.preventDefault() }
    }
    const phimLen = (e: KeyboardEvent) => { d.phim.delete(e.code); if (e.code === 'Space') d.banPhim = false }
    const matFocus = () => { d.phim.clear(); d.banPhim = false; d.giuChuot = false; d.giuPhai = false; d.jx = 0; d.jy = 0 }
    window.addEventListener('keydown', phimXuong); window.addEventListener('keyup', phimLen); window.addEventListener('blur', matFocus)
    return () => {
      cancelAnimationFrame(raf); ro?.disconnect(); mo.disconnect(); mq.removeEventListener('change', doiNen)
      window.removeEventListener('resize', doiCo); window.removeEventListener('keydown', phimXuong); window.removeEventListener('keyup', phimLen); window.removeEventListener('blur', matFocus)
    }
  }, [bo])

  // Toạ độ màn ⇒ hướng ngắm từ chỗ em đang đứng.
  const ngamToi = (cx: number, cy: number) => {
    const c = cv.current
    if (!c) return
    const r = c.getBoundingClientRect(), k = 600 / r.width
    const em = bo.canh(performance.now(), false).ghe.find((g) => g.laEm)
    if (!em) return
    dk.current.ngam = Math.atan2((cy - r.top) * k - em.y, (cx - r.left) * k - em.x)
  }
  const capCan = (el: HTMLDivElement | null, x: number, y: number) => { const n = el?.querySelector<HTMLElement>('.di-num'); if (n) n.style.transform = `translate(${x}px, ${y}px)` }
  const canXuong = (ben: 'trai' | 'phai') => (e: PE<HTMLDivElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* bỏ qua */ }
    const d = dk.current
    if (ben === 'trai') d.trai = { id: e.pointerId, x: e.clientX, y: e.clientY }
    else d.phai = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), xa: 0 }
  }
  const canDi = (ben: 'trai' | 'phai') => (e: PE<HTMLDivElement>) => {
    const d = dk.current, o = ben === 'trai' ? d.trai : d.phai
    if (!o || o.id !== e.pointerId) return
    let x = e.clientX - o.x, y = e.clientY - o.y
    const l = Math.hypot(x, y), R = 46
    if (l > R) { x = (x / l) * R; y = (y / l) * R }
    capCan(ben === 'trai' ? canTrai.current : canPhai.current, x, y)
    if (ben === 'trai') { d.jx = x / R; d.jy = y / R }
    else { const p = d.phai!; p.xa = Math.max(p.xa, l); if (l > 12) { d.ngam = Math.atan2(y, x); d.giuPhai = true } }
  }
  const canLen = (ben: 'trai' | 'phai') => (e: PE<HTMLDivElement>) => {
    const d = dk.current
    if (ben === 'trai') { if (d.trai?.id !== e.pointerId) return; d.trai = null; d.jx = 0; d.jy = 0 }
    else {
      const p = d.phai
      if (p?.id !== e.pointerId) return
      // Chạm nhanh không kéo = tự ngắm bạn gần nhất và bắn một loạt.
      if (performance.now() - p.t < 260 && p.xa < 12) d.tuNgamDen = performance.now() + 650
      d.phai = null; d.giuPhai = false
    }
    capCan(ben === 'trai' ? canTrai.current : canPhai.current, 0, 0)
  }

  const em = hud.ghe.find((g) => g.id === bo.emId)
  const khac = hud.ghe.filter((g) => g.id !== bo.emId)
  const phut = Math.floor(Math.max(0, hud.con) / 60), giay = Math.floor(Math.max(0, hud.con) % 60)
  const tyLe = (b: { ban: number; trung: number }) => (b.ban ? `${Math.round((b.trung / b.ban) * 100)}%` : '0%')
  const chip = (g: ThongTinGhe, laEm: boolean) => <div className={`di-chip${laEm ? ' di-chip-em' : ''}${g.cho ? ' di-chip-cho' : ''}`} key={g.id}>
    <Nut nt={g.nt} nho />
    <span className="di-chip-ten">{laEm ? 'Em' : g.ten}</span>
    <span className="di-mau" aria-label={`Máu ${g.mau}/3`}>{[0, 1, 2].map((i) => <i key={i} className={i < g.mau ? 'di-mau-con' : ''} />)}</span>
    <span className="di-ha" aria-label={`Hạ ${g.ha}`}><small>Hạ</small><b className="so">{g.ha}</b></span>
    {pu && pu.tu === g.id && Date.now() - pu.luc < 2500 && <span className="di-bong" role="status">{PHAN_UNG[pu.i]}</span>}
  </div>
  const tieuDe = !ket ? '' : ket.roi ? 'Em đã rời trận' : ket.banRoi && ket.thang === bo.emId ? 'Bạn đã rời trận — em thắng' : ket.thang === null ? 'Hoà' : ket.thang === bo.emId ? 'Em thắng!' : 'Em thua'
  const xepHang = ket ? ket.bang.findIndex((d) => d.id === bo.emId) + 1 : 0

  return <div className="pc-room di-man" ref={goc} role="dialog" aria-modal="true" aria-label={`Trận Đấu Nguyên Tử${mang ? '' : ' với A.I'}`}>
    <div className="di-dai"><span><i className="di-cham" aria-hidden="true" />Phòng chờ · Thầy bắt đầu là vào bài</span>
      <button type="button" className="di-nut di-nut-chu" onClick={onRoi}>{ket ? 'Về sảnh đấu' : 'Rời trận'}</button></div>
    <div className="di-hud">
      {em && chip(em, true)}
      <div className="di-dong-ho"><b className="so">{phut}:{String(giay).padStart(2, '0')}</b><small>Hạ {bo.haThang} để thắng</small></div>
      <div className="di-hud-khac">{khac.map((g) => chip(g, false))}</div>
    </div>
    <div className="di-than">
      <div className="di-can di-can-trai" ref={canTrai} onPointerDown={canXuong('trai')} onPointerMove={canDi('trai')} onPointerUp={canLen('trai')} onPointerCancel={canLen('trai')} aria-hidden="true">
        <div className="di-de"><div className="di-num" /></div><span>Di chuyển</span>
      </div>
      <div className="di-khung" ref={khung}>
        <canvas ref={cv} tabIndex={0} aria-label="Sân đấu: kéo cần trái để đi, kéo cần phải để ngắm và bắn; máy tính dùng phím W A S D và chuột"
          onPointerMove={(e) => { if (e.pointerType === 'mouse') { dk.current.chuotLuc = performance.now(); ngamToi(e.clientX, e.clientY) } }}
          onPointerDown={(e) => { ngamToi(e.clientX, e.clientY); if (e.pointerType === 'mouse') { dk.current.chuotLuc = performance.now(); dk.current.giuChuot = true } else dk.current.banDen = performance.now() + 450 }}
          onPointerUp={() => { dk.current.giuChuot = false }} onPointerLeave={() => { dk.current.giuChuot = false }} onContextMenu={(e) => e.preventDefault()} />
        {khongVe && <div className="pc-bn-fallback">Máy này chưa vẽ được sân đấu. Em vẫn chờ thầy bắt đầu bình thường.</div>}
        {nhatKy.length > 0 && <ol className="di-nhat-ky" aria-live="polite">{nhatKy.map((s, i) => <li key={i + s}>{s}</li>)}</ol>}
        {tinHa && !ket && <div key={tinHa.luc} className={`di-bang-ha${tinHa.emBiHa ? ' di-bang-ha-em' : ''}`} role="status">{tinHa.chu}</div>}
        {ket && <div className="di-ket-mo" aria-hidden="true" />}
        {ket && <div className="di-ket" role="dialog" aria-labelledby="di-ket-tieu-de">
          <h2 id="di-ket-tieu-de">{tieuDe}</h2>
          {bo.kieu === 'nhom' ? <p className="di-ket-so">Hạng <span className="so">{xepHang}/{ket.bang.length}</span></p>
            : <p className="di-ket-so so">{ket.bang.find((d) => d.id === bo.emId)?.ha ?? 0} – {ket.bang.find((d) => d.id !== bo.emId)?.ha ?? 0}</p>}
          {ket.bang.length > 0 && <table className="di-bang"><thead><tr><th scope="col">Bạn</th><th scope="col">Hạ</th><th scope="col">Bị hạ</th><th scope="col">Trúng</th><th scope="col">Chuỗi hạ</th></tr></thead>
            <tbody>{ket.bang.map((d) => <tr key={d.id} className={d.id === bo.emId ? 'di-dong-em' : ''}><th scope="row">{d.id === bo.emId ? 'Em' : ten[d.id] ?? 'Bạn'}</th><td className="so">{d.ha}</td><td className="so">{d.biHa}</td><td className="so">{tyLe(d)}</td><td className="so">{d.chuoiMax}</td></tr>)}</tbody></table>}
          <div className="di-hang">
            {bo.kieu !== 'nhom' && !ket.roi && <button type="button" className="di-nut di-nut-chinh" onClick={() => onDauLai(bo)}>{mang ? 'Thách đấu lại' : 'Đấu lại'}</button>}
            <button type="button" className="di-nut di-nut-vien" onClick={onRoi}>Về sảnh đấu</button>
          </div>
          <p className="di-phu">Kết quả chỉ để vui, không lưu vào điểm.</p>
        </div>}
      </div>
      <div className="di-can di-can-phai" ref={canPhai} onPointerDown={canXuong('phai')} onPointerMove={canDi('phai')} onPointerUp={canLen('phai')} onPointerCancel={canLen('phai')} aria-hidden="true">
        <div className="di-de"><div className="di-num" /></div><span>Ngắm · Bắn</span>
      </div>
      <aside className="di-ben">
        <h3>Cách chơi</h3>
        <ul><li><kbd>W A S D</kbd> hoặc phím mũi tên: di chuyển</li><li>Chuột: ngắm · giữ chuột trái: bắn</li><li><kbd>Phím cách</kbd>: tự ngắm bạn gần nhất và bắn</li><li>Nhặt <b>Xúc tác</b> để bắn nhanh gấp đôi, <b>Khiên</b> để chặn một viên</li></ul>
        {mang && <><h3>Phản ứng nhanh</h3><div className="di-pu">{PHAN_UNG.map((s, i) => <button type="button" key={s} className="di-nut di-nut-vien di-nut-nho" onClick={() => onPhanUng(i)}>{s}</button>)}</div></>}
      </aside>
    </div>
    {mang && <div className="di-pu di-pu-duoi">{PHAN_UNG.map((s, i) => <button type="button" key={s} className="di-nut di-nut-vien di-nut-nho" onClick={() => onPhanUng(i)}>{s}</button>)}</div>}
  </div>
}
