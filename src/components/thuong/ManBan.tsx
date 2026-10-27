// HỌC CÙNG BẠN (bản vẽ tp-16) · MỜI BẠN / NHẬN LỜI MỜI / MỐC CHUỖI ĐÔI (tp-17) · lời nhắc «Gõ cửa» — thầy chốt 26/10 («áp dụng thật tinh tế và dễ hiểu»).
// Hợp đồng 4.4: /hs/ban {ban[], loiMoi[]} (+ daMoi, toiDa máy chủ gửi thêm) — KHÔNG điểm / nguyên tử / nhãn của bạn: màn chỉ hiện «đã học hôm nay / chưa»
// + số lửa đôi. Tối đa 3 bạn; bạn phải bấm đồng ý; gõ cửa 1 lần/ngày/bạn; «Thôi học cùng» không báo xấu (hỏi lại một bước trước khi gửi).
// Công tắc «bạn bè» tắt ⇒ mọi khối ẩn. Hiệu ứng: lửa đôi bùng khi cả hai cùng xong (số lật) · gõ cửa: nút rung 2 nhịp + gợn sóng · gửi lời mời ·
// nhận lời mời: hai ảnh đại diện xích lại, lửa nhen lên · mốc đôi: hai Bi nhảy so le, lửa bùng, hoa giấy, tinh thể bay vào bộ đếm.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CheckCircle2, Clock, Eye, Flame, Plus, Search, Trophy } from 'lucide-react'
import { Bi } from '../linh-vat/Bi'
import { bayToi, bungHat, hoaGiay, hoatAnh, latSo, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import { DUONG, MOC_DOI, goCua, layDsBan, moiBan, thoiHocCung, timBan, traLoiMoi, type BanHoc, type KetQuaTim, type NguoiMoi, type ThongBao, type TongQuanThuong } from '../../lib/thuong-api'
import { IcLua, IcTinhThe, Tia } from './hinh'
import { baoMoi, useTai, useTongQuan } from './dung-thuong'
import { Cho, DemTT, Loi, ManToan, NutDay, chuCai, ngayNgan, oTinhThe, useHieuUng, useToast } from './chung'
import { DauVe } from './ManChuoi'
import { hieuUngGoCua, tenNgan } from './ban-gon'

export const LUAT_BAN = [
  'Cả hai cùng xong ít nhất 1 bài trong ngày thì lửa đôi tăng 1. Một bạn lỡ thì lửa đôi tắt.',
  'Bình giữ chuỗi hay ngày vắng có phép của bạn nào thì đỡ cho bạn ấy.',
  'Em xong bài mà bạn chưa? Bấm «Gõ cửa», mỗi ngày 1 lần cho mỗi bạn.',
  'Bạn bè chỉ thấy em đã học hôm nay chưa và số lửa đôi, không thấy điểm.',
] as const
const KHO_DOI = 'ddh.thuong.lua-doi'
const docDoiCu = (): Record<string, number> => { try { const v = JSON.parse(localStorage.getItem(KHO_DOI) || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} } }
const ghiDoi = (v: Record<string, number>) => { try { localStorage.setItem(KHO_DOI, JSON.stringify(v)) } catch { /* bỏ qua */ } }
const lamMoiBan = async (token: string) => { const r = await layDsBan(token); if (r.ok) baoMoi(DUONG.ban, token) }

function LuaDoi({ so, id }: { so: number; id?: string }) {
  return <span className="tp-lua-doi" role="img" aria-label={`Lửa đôi ${so} ngày`}><span className="doi" aria-hidden="true"><IcLua /><IcLua /></span><span className="tp-lat" id={id} aria-hidden="true">{so}</span></span>
}
const HOM_NAY_CHU = (b: BanHoc) => ({
  ca_hai: { Ic: CheckCircle2, chu: 'Hôm nay cả hai đã xong' },
  ban_chua: { Ic: Clock, chu: `${tenNgan(b.ten)} chưa học hôm nay` },
  em_chua: { Ic: Flame, chu: `${tenNgan(b.ten)} đã học · còn chờ em 1 bài` },
  ca_hai_chua: { Ic: Clock, chu: 'Hôm nay cả hai chưa học' },
}[b.homNay])

function TheBan({ b, i, token, bao }: { b: BanHoc; i: number; token?: string; bao: (c: string) => void }) {
  const [daGo, setDaGo] = useState(b.daGoCua)
  const [dangGo, setDangGo] = useState(false)
  const [hoiThoi, setHoiThoi] = useState(false)
  const nut = useRef<HTMLButtonElement>(null)
  useEffect(() => setDaGo(b.daGoCua), [b.daGoCua])
  const go = async () => {
    if (!token || dangGo || daGo) return
    setDangGo(true)
    hieuUngGoCua(nut.current)
    const r = await goCua(token, b.ma)
    setDangGo(false)
    if (!r.ok) return bao(r.chu)
    setDaGo(true)
    bao(`Đã gõ cửa ${tenNgan(b.ten)}.`)
  }
  const thoi = async () => {
    if (!token) return
    const r = await thoiHocCung(token, b.ma)
    if (!r.ok) return bao(r.chu)
    bao(`Đã thôi học cùng ${tenNgan(b.ten)}.`)
    void lamMoiBan(token)
  }
  const tt = HOM_NAY_CHU(b)
  const ke = MOC_DOI.find((m) => m.so > b.chuoiDoi)
  return <section className="tp-the tp-the-ban" aria-label={b.ten} data-ban={b.ma}>
    <div className="tp-ban-dau"><span className="tp-av" data-k={String((i % 4) + 1)} aria-hidden="true">{chuCai(b.ten)}</span>
      <div className="giua"><b>{b.ten}</b><span>{[b.lop, b.tuNgay && `học cùng từ ${ngayNgan(b.tuNgay)}`].filter(Boolean).join(' · ')}</span></div>
      <LuaDoi so={b.chuoiDoi} id={`tp-doi-${b.ma}`} /></div>
    <div className="tp-tt-nay" data-k={b.homNay}><tt.Ic aria-hidden="true" /><span>{tt.chu}</span>
      {b.homNay === 'ban_chua' && token && <button ref={nut} type="button" className="tp-nut" data-sac={daGo ? 'tat' : 'tt'} disabled={daGo || dangGo} onClick={() => void go()}>{daGo ? 'Đã gõ cửa' : 'Gõ cửa'}</button>}</div>
    {ke && <div className="tp-moc-doi">
      <div className="hang-m"><span>Mốc kế tiếp · {ke.so} ngày</span><b>+{ke.tt} <IcTinhThe /></b></div>
      <div className="tp-thanh" data-sac="sao" style={{ '--p': `${Math.round((100 * b.chuoiDoi) / ke.so)}%` } as CSSProperties}><i /></div>
      <span className="tp-mo" style={{ fontSize: 12.5 }}>còn {ke.so - b.chuoiDoi} ngày · cả hai nhận huy hiệu đôi</span>
    </div>}
    {token && <div className="tp-ban-chan">{hoiThoi
      ? <><button type="button" className="tp-nut-chu" onClick={() => setHoiThoi(false)}>Giữ lại</button><button type="button" className="tp-nut" onClick={() => void thoi()}>Thôi học cùng {tenNgan(b.ten)}</button></>
      : <button type="button" className="tp-nut-chu" onClick={() => setHoiThoi(true)}>Thôi học cùng</button>}</div>}
  </section>
}

/** Màn Học cùng bạn (tp-16). */
export function ManHocCungBan({ token, onVe, onMoi, onHoc }: { token?: string; onVe?: () => void; onMoi?: () => void; onHoc?: () => void }) {
  const tq = useTongQuan(token).du
  const tat = tq?.bat.banBe === false
  const { du: ds, tai, loi, thuLai } = useTai(token, DUONG.ban, layDsBan, !tat)
  const [toast, bao] = useToast()
  const [dangTra, setDangTra] = useState('')
  useHieuUng((h) => {
    if (!ds || ds.tat) return
    const cu = docDoiCu(), moi: Record<string, number> = {}
    for (const b of ds.ban) {
      moi[b.ma] = b.chuoiDoi
      if (b.homNay !== 'ca_hai' || cu[b.ma] === undefined || cu[b.ma]! >= b.chuoiDoi) continue
      const the = document.querySelector(`[data-ban="${b.ma}"]`), lua = the?.querySelectorAll('.tp-lua-doi .tp-dv')
      phanHoiThuong('chuoi')
      hoatAnh(lua?.[0], [{ transform: 'translateX(-10px) rotate(-12deg) scale(.8)' }, { transform: 'translateX(2px) rotate(-6deg) scale(1.7)', offset: 0.45 }, { transform: 'rotate(-12deg)' }], 1100, { tre: 200 })
      hoatAnh(lua?.[1], [{ transform: 'translateX(10px) rotate(10deg) scale(.8)' }, { transform: 'translateX(-2px) rotate(6deg) scale(1.7)', offset: 0.45 }, { transform: 'rotate(10deg)' }], 1100, { tre: 200 })
      h.sau(600, () => { bungHat(the?.querySelector('.tp-lua-doi .doi'), { n: 14, r: 70, mau: ['sao', 'lua', 'sai'] }); latSo(document.getElementById(`tp-doi-${b.ma}`), String(cu[b.ma]), String(b.chuoiDoi), 500) })
      hoatAnh(the?.querySelector('.tp-tt-nay'), [{ transform: 'scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], 400, { tre: 900 })
    }
    ghiDoi(moi)
  }, [!!ds])
  if (tat || ds?.tat) return null
  if (!ds) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} />{tai ? <Cho /> : <Loi chu={loi || 'Chưa xem được bạn học cùng.'} onThuLai={thuLai} />}</div>
  const tra = async (n: NguoiMoi, dongY: boolean) => {
    if (!token || dangTra) return
    setDangTra(n.ma)
    const r = await traLoiMoi(token, n.ma, dongY)
    setDangTra('')
    if (!r.ok) return bao(r.chu)
    if (dongY) phanHoiThuong('chuoi')
    bao(dongY ? `Em đã học cùng ${tenNgan(n.ten)}.` : 'Đã để lời mời lại sau.')
    void lamMoiBan(token)
  }
  const con = Math.max(0, ds.toiDa - ds.ban.length - ds.daMoi.length)
  const canHoc = ds.ban.some((b) => b.homNay === 'em_chua' || b.homNay === 'ca_hai_chua')
  return <div className="tp-goc tp-vo" data-man="ban">
    <DauVe onVe={onVe} />
    {loi && <Loi chu={loi} onThuLai={thuLai} />}
    <div><h1 className="tp-tieu">Học cùng bạn</h1><p className="tp-phu" style={{ marginTop: 4 }}>Lửa đôi chỉ tăng khi cả hai cùng xong ít nhất 1 bài trong ngày.</p></div>
    {ds.loiMoi.map((n, i) => <section key={n.ma} className="tp-the" aria-label={`Lời mời của ${n.ten}`}>
      <div className="tp-ban-dau"><span className="tp-av" data-k={String((i % 4) + 1)} aria-hidden="true">{chuCai(n.ten)}</span>
        <div className="giua"><b>{n.ten} mời em học cùng</b><span>{n.lop}</span></div></div>
      {token && <div className="tp-ban-chan"><button type="button" className="tp-nut-chu" disabled={!!dangTra} onClick={() => void tra(n, false)}>Để sau</button>
        <button type="button" className="tp-nut" data-sac="chinh" disabled={!!dangTra} onClick={() => void tra(n, true)}>Đồng ý</button></div>}
    </section>)}
    <div className="tp-luoi-ban">
      {ds.ban.map((b, i) => <TheBan key={b.ma} b={b} i={i} token={token} bao={bao} />)}
      {ds.daMoi.map((n, i) => <section key={n.ma} className="tp-the tp-the-ban" aria-label={`Đã mời ${n.ten}`}>
        <div className="tp-ban-dau"><span className="tp-av" data-k={String(((ds.ban.length + i) % 4) + 1)} aria-hidden="true">{chuCai(n.ten)}</span>
          <div className="giua"><b>{n.ten}</b><span>{n.lop}</span></div></div>
        <div className="tp-tt-nay" data-k="ca_hai_chua"><Clock aria-hidden="true" /><span>Đã gửi lời mời · chờ bạn đồng ý</span></div>
      </section>)}
      {con > 0 && <div className="tp-trong-ban" role="group" aria-label="Mời thêm bạn">
        <span className="tron" aria-hidden="true"><Plus /></span><b>Mời bạn học cùng</b><span className="tp-mo">Còn {con} chỗ · tìm theo tên hoặc số báo danh</span>
        {onMoi && <button type="button" className="tp-nut" onClick={onMoi}>Mời bạn</button>}
      </div>}
    </div>
    {canHoc && onHoc && <button type="button" className="tp-nut-lon" onClick={onHoc}>Học 1 bài để giữ lửa đôi</button>}
    <section className="tp-the" aria-label="Luật học cùng">
      <h2>Luật học cùng</h2>
      <ol className="tp-luat">{LUAT_BAN.map((l, i) => <li key={i}><b>{i + 1}</b><span>{l}</span></li>)}</ol>
    </section>
    {toast}
  </div>
}

/** Màn phủ tìm + mời bạn (tp-17 «tìm»). Gõ ≥ 2 chữ ⇒ tìm (chờ 350 ms sau phím cuối). */
export function ManMoiBan({ token, onDong, q: qDau = '' }: { token?: string; onDong: () => void; q?: string }) {
  const ds = useTai(token, DUONG.ban, layDsBan).du
  const [q, setQ] = useState(qDau)
  const [kq, setKq] = useState<KetQuaTim[] | null>(null)
  const [loi, setLoi] = useState('')
  const [dang, setDang] = useState('')
  const [toast, bao] = useToast()
  const o = useRef<HTMLInputElement>(null)
  useEffect(() => { o.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    if (!token || q.trim().length < 2) { setKq(null); return }
    let song = true
    const t = setTimeout(() => { void timBan(token, q).then((r) => { if (!song) return; if (r.ok) { setKq(r.du); setLoi('') } else setLoi(r.chu) }) }, 350)
    return () => { song = false; clearTimeout(t) }
  }, [q, token])
  const con = ds ? Math.max(0, ds.toiDa - ds.ban.length - ds.daMoi.length) : undefined
  const moi = async (x: KetQuaTim, e: HTMLButtonElement) => {
    if (!token || dang) return
    setDang(x.ma)
    const r = x.trangThai === 'moi_em' ? await traLoiMoi(token, x.ma, true) : await moiBan(token, x.ma)
    setDang('')
    if (!r.ok) return bao(r.chu)
    phanHoiThuong('gui')
    const rr = e.getBoundingClientRect(); bungHat([rr.left + rr.width / 2, rr.top], { n: 6, r: 40, mau: ['tt', 'trang'] })
    setKq((ds) => ds?.map((y) => (y.ma === x.ma ? { ...y, trangThai: x.trangThai === 'moi_em' ? 'ban' : 'da_moi' } : y)) ?? null)
    bao(x.trangThai === 'moi_em' ? `Em đã học cùng ${tenNgan(x.ten)}.` : `Đã gửi lời mời tới ${tenNgan(x.ten)}.`)
    void lamMoiBan(token)
  }
  const day = con === 0
  return <ManToan nhan="Mời bạn học cùng" onDong={onDong}>
    <main className="tp-tim-vo">
      <h1 className="tp-tieu">Mời bạn học cùng</h1>
      {con !== undefined && <p className="tp-phu">{day ? `Em đã học cùng đủ ${ds!.toiDa} bạn.` : `Còn ${con} chỗ · em học cùng tối đa ${ds!.toiDa} bạn`}</p>}
      <label className="tp-o-tim"><Search aria-hidden="true" /><span className="tp-an">Tìm bạn theo tên hoặc số báo danh</span>
        <input ref={o} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên hoặc số báo danh" autoComplete="off" enterKeyHint="search" maxLength={40} /></label>
      {loi && <Loi chu={loi} />}
      {kq && <section className="tp-the" aria-label="Kết quả tìm">
        {kq.length === 0 ? <p className="tp-phu">Chưa thấy bạn nào tên «{q.trim()}» trong trung tâm. Em thử gõ số báo danh nhé.</p>
          : <div className="tp-kq-tim">{kq.map((x, i) => <div key={x.ma} className="dong-b">
            <span className="tp-av" data-k={String((i % 4) + 1)} aria-hidden="true">{chuCai(x.ten)}</span>
            <div className="giua"><b>{x.ten}</b><span>{[x.lop, x.sbd && `SBD ${x.sbd}`].filter(Boolean).join(' · ')}</span></div>
            {x.trangThai === 'ban' ? <button type="button" className="tp-nut" data-sac="tat" disabled>Đang học cùng</button>
              : x.trangThai === 'da_moi' ? <button type="button" className="tp-nut" data-sac="tat" disabled>Đã gửi lời mời</button>
              : <button type="button" className="tp-nut" data-sac={day ? 'tat' : 'tt'} disabled={day || !!dang} onClick={(e) => void moi(x, e.currentTarget)}>{x.trangThai === 'moi_em' ? 'Đồng ý' : 'Mời'}</button>}
          </div>)}</div>}
      </section>}
      <p className="tp-phu" style={{ fontSize: 13.5 }}><Eye size={16} aria-hidden="true" style={{ verticalAlign: -3 }} /> Bạn bè chỉ thấy em đã học hôm nay chưa và số lửa đôi, không thấy điểm hay nguyên tử.</p>
    </main>
    {toast}
  </ManToan>
}

/** Màn phủ nhận lời mời (thông báo `moi_ban` {ma, ten, lop}) — tp-17 «nhận». */
export function ManLoiMoi({ tb, token, onDong }: { tb: ThongBao; token?: string; onDong: () => void }) {
  const ma = typeof tb.duLieu.ma === 'string' ? tb.duLieu.ma : '', ten = typeof tb.duLieu.ten === 'string' ? tb.duLieu.ten : ''
  const lop = typeof tb.duLieu.lop === 'string' ? tb.duLieu.lop : ''
  const [dang, setDang] = useState(false)
  const [toast, bao] = useToast()
  const a1 = useRef<HTMLSpanElement>(null), a2 = useRef<HTMLSpanElement>(null), lua = useRef<HTMLSpanElement>(null)
  useHieuUng((h) => {
    hoatAnh(a1.current, [{ transform: 'translateX(-40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 500)
    hoatAnh(a2.current, [{ transform: 'translateX(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 500)
    hoatAnh(lua.current, [{ transform: 'scale(0)' }, { transform: 'scale(1.4)', offset: 0.6 }, { transform: 'none' }], 700, { tre: 450 })
    h.sau(800, () => bungHat(lua.current, { n: 10, r: 50, mau: ['sao', 'lua'] }))
  }, [])
  if (!ma || !ten) return null
  const tra = async (dongY: boolean) => {
    if (!token) return onDong()
    if (dang) return
    setDang(true)
    const r = await traLoiMoi(token, ma, dongY)
    setDang(false)
    if (!r.ok) return bao(r.chu)
    if (dongY) phanHoiThuong('chuoi')
    void lamMoiBan(token)
    onDong()
  }
  return <ManToan nhan={`${ten} mời em học cùng`} onDong={onDong}
    day={<><NutDay chu="Đồng ý" tat={dang} onClick={() => void tra(true)} /><NutDay chu="Để sau" phu onClick={onDong} /></>}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hai-av"><span ref={a1} className="tp-av" data-k="1" aria-hidden="true">{chuCai(ten)}</span><span ref={lua} className="lua-g" aria-hidden="true"><IcLua /></span><span ref={a2} className="tp-av" data-k="0" aria-hidden="true">Em</span></div>
        <h1>{ten} mời em học cùng</h1>
        <p className="tp-phu">{lop ? `${lop} · ` : ''}Mỗi ngày cả hai cùng xong ít nhất 1 bài thì ngọn lửa đôi cháy thêm 1 ngày.</p>
      </div>
      <div className="cot-b">
        <section className="tp-the" aria-label="Học cùng là gì">
          <div className="tp-dong"><span className="tp-o" data-sac="sao"><Flame aria-hidden="true" /></span><div className="giua"><b>Lửa đôi tăng khi cả hai cùng học</b><span>một bạn lỡ ngày thì lửa đôi tắt</span></div></div>
          <div className="tp-dong"><span className="tp-o" data-sac="tt"><IcTinhThe /></span><div className="giua"><b>Mốc 7 / 30 / 100 ngày</b><span>cả hai nhận huy hiệu đôi + 10 / 30 / 100 tinh thể</span></div></div>
          <div className="tp-dong"><span className="tp-o" data-sac="tin"><Eye aria-hidden="true" /></span><div className="giua"><b>Riêng tư</b><span>bạn chỉ thấy em đã học hôm nay chưa, không thấy điểm</span></div></div>
        </section>
      </div>
    </main>
    {toast}
  </ManToan>
}

/** Màn phủ mốc chuỗi đôi (thông báo `moc_doi` {moc, tinhThe, ban}) — tp-17 «mốc». */
export function ManMocDoi({ tb, tq, onDong }: { tb: ThongBao; tq: TongQuanThuong; onDong: () => void }) {
  const moc = typeof tb.duLieu.moc === 'number' ? tb.duLieu.moc : undefined
  const tt = typeof tb.duLieu.tinhThe === 'number' ? tb.duLieu.tinhThe : MOC_DOI.find((m) => m.so === moc)?.tt ?? 0
  const ban = typeof tb.duLieu.ban === 'string' ? tb.duLieu.ban : ''
  const [dem, setDem] = useState(tq.tinhThe !== undefined ? Math.max(0, tq.tinhThe - tt) : undefined)
  const lua = useRef<HTMLSpanElement>(null), b1 = useRef<HTMLDivElement>(null), b2 = useRef<HTMLDivElement>(null), qua = useRef<HTMLSpanElement>(null)
  useHieuUng((h) => {
    phanHoiThuong('lenHang')
    hoatAnh(lua.current, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.6)', opacity: 1, offset: 0.4 }, { transform: 'scale(.9)', offset: 0.7 }, { transform: 'none', opacity: 1 }], 1300)
    const nhay: Keyframe[] = [{ transform: 'translateY(0)' }, { transform: 'translateY(-24px) rotate(-5deg)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-12px) rotate(4deg)' }, { transform: 'translateY(0)' }]
    hoatAnh(b1.current, nhay, 900, { tre: 300 }); hoatAnh(b2.current, nhay, 900, { tre: 520 })
    hoatAnh(document.querySelector('.tp-toan .tp-tia'), [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], 800, { tre: 300 })
    h.sau(500, () => { bungHat(lua.current, { n: 16, r: 110, mau: ['sao', 'lua', 'sai', 'trang'] }); hoaGiay(32, 1300) })
    if (tt > 0 && tq.tinhThe !== undefined) h.sau(1600, () => void bayToi(qua.current, oTinhThe(), { n: 6 }).then(() => setDem(tq.tinhThe)))
  }, [])
  if (!moc) return null
  const ke = MOC_DOI.find((m) => m.so > moc)
  return <ManToan nhan={`Chuỗi đôi ${moc} ngày`} onDong={onDong} demTT={dem !== undefined ? <DemTT gt={dem} /> : undefined}
    day={<NutDay chu={tt > 0 ? `Nhận ${tt} tinh thể` : 'Tiếp tục'} sac={tt > 0 ? 'tt' : undefined} onClick={onDong} />}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hai-bi"><Tia className="quay" /><div ref={b1} className="bi-o b1"><Bi cam="lua" size={110} /></div>
          <div ref={b2} className="bi-o b2"><div className="lat"><Bi cam="lua" size={110} /></div></div>
          <span ref={lua} className="lua-g" aria-hidden="true"><IcLua /></span><span className="ten-b a">Em</span>{ban && <span className="ten-b b">{ban}</span>}</div>
        <h1 style={{ color: 'var(--tr-sao-chu)' }}>Chuỗi đôi {moc} ngày!</h1>
        <p className="tp-phu">Em{ban ? ` và ${ban}` : ''} cùng học {moc} ngày liền.</p>
      </div>
      <div className="cot-b">
        <section className="tp-the" aria-label="Thưởng mốc đôi">
          {tt > 0 && <div className="tp-dong"><span ref={qua} className="tp-o" data-sac="tt"><IcTinhThe /></span><div className="giua"><b>+{tt} tinh thể cho mỗi bạn</b>{ban && <span>{ban} cũng nhận {tt}</span>}</div></div>}
          <div className="tp-dong"><span className="tp-o" data-sac="sao"><Trophy aria-hidden="true" /></span><div className="giua"><b>Huy hiệu «Chuỗi đôi {moc}»</b>{ke && <span>mốc kế tiếp: {ke.so} ngày · +{ke.tt} tinh thể</span>}</div></div>
        </section>
      </div>
    </main>
  </ManToan>
}

/** Lời nhắc «Gõ cửa» (thông báo `go_cua` {ma, ten, lop}) — một dải báo nhỏ, không phủ màn. */
export function BaoGoCua({ tb, onHoc, onDong }: { tb: ThongBao; onHoc?: () => void; onDong: () => void }) {
  const ten = typeof tb.duLieu.ten === 'string' ? tb.duLieu.ten : ''
  const ref = useRef<HTMLDivElement>(null)
  useHieuUng(() => { phanHoiThuong('goCua'); hoatAnh(ref.current, [{ transform: 'translate(-50%, 40px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1 }], 300) }, [])
  if (!ten) return null
  return <div ref={ref} className="tp-goc tp-toast" role="status">
    <span>{tenNgan(ten)} gõ cửa: bạn đã học xong, chờ em 1 bài để giữ lửa đôi.</span>
    {onHoc && <button type="button" className="tp-nut-chu" onClick={() => { onDong(); onHoc() }}>Học ngay</button>}
    <button type="button" className="tp-nut-chu" onClick={onDong}>Đóng</button>
  </div>
}
