// BI-A PHẢN ỨNG · VÀO GAME (đặc tả 8.2): Sảnh Bi-a → xếp bàn (máy chủ lấy câu từ kế hoạch hôm nay, trần 40%) → Màn chơi.
// GĐ1: tự chơi với A.I (đấu đơn, đánh đôi) và Bàn giao hữu với A.I. GĐ2 (máy chủ có phòng đấu): Đấu đơn / Đánh đôi với bạn, Nhập mã bàn,
// bạn cùng lớp đang ở Sảnh Bi-a + Mời, lời mời đến (Nhận / Từ chối), Điểm bàn. Máy chủ chưa có phòng đấu ⇒ nút online ghi "Sắp mở".
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { batVongTrucTiep } from '../../lib/nhip-ben-vung'
import { hoiLoiMoi, moiBanVao, taiSanhBia, taoBanOnline, traLoiLoiMoi, vaoBanBangMa, xepBanBia, type BanCoMat, type LoiMoiDen, type SanhBia, type VeVaoBan } from './api'
import BanOnline, { KHOA_BAN_DANG } from './BanOnline'
import ManChoi from './ManChoi'
import TraLoiCau from './TraLoiCau'
import { CongTacMatThan } from './mat-than-luon'
import type { CauBia, LoaiVan } from './dieu-khien'
import type { CheDo } from './luat'
import { CHOT, NT, mauCss } from './nguyen-to'
import { qMul, qTruc } from './vat-ly'
import { veBiMau } from './ve-ban'
import './bi-a.css'

export interface BiaGameProps { token: string; hoTen: string; onVe: () => void }
interface VanDangChoi { van: string; session: string | null; cheDo: CheDo; loai: LoaiVan; cauEm: CauBia[]; chot: CauBia | null; khoa: number }
const Q_MAU = qMul(qTruc(1, 0, 0, -0.35), qMul(qTruc(0, 0, 1, 0.25), qTruc(0, 1, 0, Math.PI / 2 + 0.3)))

function BiMau({ id }: { id: 'Na' | 'Cl' | 'C' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => { if (ref.current) try { veBiMau(ref.current, id, Q_MAU) } catch { /* máy không vẽ được: bỏ qua */ } }, [id])
  return <canvas ref={ref} width={64} height={64} role="img" aria-label={`Bi ${id} (${NT[id].ten})`} style={{ background: 'transparent', borderRadius: '50%', boxShadow: `0 0 0 2px ${mauCss(id)}` }} />
}

/** Lớp chắn RIÊNG của Bi-a (30/09): lỗi lúc vẽ React ở màn chơi chỉ đóng bàn, KHÔNG gỡ cả cổng học sinh (trước: lớp chắn chung của app thay cả màn). */
class ChanLoiBia extends Component<{ children: ReactNode; onVe: () => void }, { loi: boolean }> {
  state = { loi: false }
  static getDerivedStateFromError() { return { loi: true } }
  componentDidCatch(e: unknown) { console.error('[Bi-a] màn chơi gặp lỗi', e) }
  render() {
    if (!this.state.loi) return this.props.children
    return (
      <div className="bia" data-bo-cuc="doc"><div className="bia-sanh"><div className="bia-sanh-trong"><div className="bia-the" role="alert">
        <b>Bàn bi-a vừa gặp lỗi</b>
        <span className="bia-chu-nho">Câu em đã trả lời vẫn được tính. Em về Sảnh Bi-a rồi vào bàn mới nhé.</span>
        <button type="button" className="bia-nut-vang" onClick={this.props.onVe}>Về Sảnh Bi-a</button>
      </div></div></div></div>
    )
  }
}

export default function BiaGame({ token, hoTen, onVe }: BiaGameProps) {
  const [sanh, setSanh] = useState<SanhBia | null>(null)
  const [loi, setLoi] = useState('')
  const [dang, setDang] = useState(false)
  const [van, setVan] = useState<VanDangChoi | null>(null)
  const [tin, setTin] = useState('')
  const cuoi = useRef<{ loai: LoaiVan; cheDo: CheDo } | null>(null)
  const [banOnline, setBanOnline] = useState<VeVaoBan | null>(null)
  const [banDang] = useState<VeVaoBan | null>(() => { try { const x = sessionStorage.getItem(KHOA_BAN_DANG); return x ? (JSON.parse(x) as VeVaoBan) : null } catch { return null } })
  const [boBanDang, setBoBanDang] = useState(false)
  const [nhapMa, setNhapMa] = useState(false)
  const [ma, setMa] = useState('')
  const [moAi, setMoAi] = useState(false)
  const [ban, setBan] = useState<BanCoMat[]>([])
  const [loiMoi, setLoiMoi] = useState<LoiMoiDen[]>([])
  const [chiTraLoi, setChiTraLoi] = useState(false)
  const napSanh = useCallback(async () => {
    setLoi('')
    try { setSanh(await taiSanhBia(token)) } catch (e) { setLoi(e instanceof Error && e.message ? e.message : 'Chưa mở được Sảnh Bi-a. Em thử lại.') }
  }, [token])
  useEffect(() => { void napSanh() }, [napSanh])
  const vaoBan = async (loai: LoaiVan, cheDo: CheDo) => {
    if (dang) return
    setDang(true); setTin('')
    try {
      const r = await xepBanBia(token, loai, cheDo)
      if (!r.ok) { setTin(r.message); void napSanh(); return }
      cuoi.current = { loai, cheDo }
      setVan({ van: r.van, session: r.session, cheDo, loai, cauEm: r.cau, chot: r.chot, khoa: Date.now() })
    } catch (e) { setTin(e instanceof Error && e.message ? e.message : 'Chưa xếp được bàn. Em thử lại.') }
    finally { setDang(false) }
  }
  const online = !!sanh?.online
  const conTran = sanh?.tran.con ?? 0
  // Có mặt ở Sảnh Bi-a + lời mời đến: mỗi 6 giây, CHỈ khi em đang ở Sảnh (vòng trực tiếp nối tiếp, không chồng lượt).
  useEffect(() => {
    if (!online || van || banOnline || chiTraLoi) return
    let song = true
    const hoi = async () => { const r = await hoiLoiMoi(token, conTran); if (song) { setBan(r.ban); setLoiMoi(r.moi) } }
    void hoi().catch(() => {})
    const vong = batVongTrucTiep(hoi, 6000)
    return () => { song = false; vong.dung() }
  }, [online, van, banOnline, chiTraLoi, token, conTran])
  const loaiMang = (s: SanhBia | null): 'ban' | 'giao_huu' | null => (!s || !s.bat ? null : !s.lyDoKhoa && s.tran.con > 0 ? 'ban' : s.giaoHuu.mo ? 'giao_huu' : null)
  const moBanOnline = async (f: () => Promise<VeVaoBan>) => {
    if (dang) return
    setDang(true); setTin('')
    try { setBanOnline(await f()) } catch (e) { setTin(e instanceof Error && e.message ? e.message : 'Chưa vào được bàn. Em thử lại.') } finally { setDang(false) }
  }
  const taoVaMoi = (b: BanCoMat) => void moBanOnline(async () => { const lm = loaiMang(sanh); if (!lm) throw new Error(sanh?.message || 'Hôm nay em chưa đấu được.'); const v = await taoBanOnline(token, 'don', lm); await moiBanVao(token, v.van, b.sbd); return v })
  if (banOnline) { const ve = () => { setBanOnline(null); setBoBanDang(true); void napSanh() }; return <ChanLoiBia onVe={ve}><BanOnline token={token} hoTen={hoTen} vao={banOnline} conTran={conTran} onVe={ve} /></ChanLoiBia> }
  if (chiTraLoi) { const ve = () => { setChiTraLoi(false); void napSanh() }; return <ChanLoiBia onVe={ve}><TraLoiCau token={token} onVe={ve} /></ChanLoiBia> }
  if (van) return (
    <ChanLoiBia key={van.khoa} onVe={() => { setVan(null); void napSanh() }}>
      <ManChoi key={van.khoa} token={token} tenEm={hoTen || 'Em'} van={van.van} session={van.session} cheDo={van.cheDo} loai={van.loai} cauEm={van.cauEm} chot={van.chot}
        onVeSanh={() => { setVan(null); void napSanh() }} onChoiLai={() => { setVan(null); const c = cuoi.current; if (c) void vaoBan(c.loai, c.cheDo); else void napSanh() }} />
    </ChanLoiBia>
  )
  const khoa = sanh?.lyDoKhoa ?? null
  const coCau = !!sanh && sanh.bat && !khoa && sanh.tran.con > 0
  const phanTram = sanh && sanh.theLuc.tong ? Math.round((1 - sanh.theLuc.con / sanh.theLuc.tong) * 100) : 0
  return (
    <div className="bia" data-bo-cuc="doc">
      <div className="bia-sanh">
        <div className="bia-sanh-trong">
          <header className="bia-dau" style={{ padding: 0 }}>
            <button type="button" className="bia-nut-kinh" onClick={onVe} aria-label="Về Sảnh Bát Linh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg><span className="bia-chu-nut">Sảnh</span></button>
            <div className="bia-ten"><b>Bi-a Phản Ứng</b><span>Kim loại đấu Phi kim · mỗi bi một câu</span></div>
            <span style={{ width: 44 }} />
          </header>
          <div className="bia-bi-mau" aria-hidden="true"><BiMau id="Na" /><BiMau id="Cl" /><BiMau id={CHOT as 'C'} /></div>
          {!sanh && !loi && <p className="bia-chu-nho" role="status" style={{ textAlign: 'center' }}>Đang mở bàn…</p>}
          {loi && <div className="bia-the"><p className="bia-loi" role="alert">{loi}</p><button type="button" className="bia-nut-phu" onClick={() => void napSanh()}>Thử lại</button></div>}
          {sanh && <>
            {sanh.chienDich && <div className="bia-the">
              <span className="bia-chu-nho">Chiến dịch thầy giao</span>
              <h2>{sanh.chienDich.ten}{sanh.chienDich.tong ? ` · ${sanh.chienDich.tong} câu` : ''}</h2>
              <div className="bia-dong-so"><span>Thể lực hôm nay</span><b>còn {sanh.theLuc.con}/{sanh.theLuc.tong} câu</b></div>
              <div className="bia-vach" role="progressbar" aria-label="Đã làm hôm nay" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phanTram}><i style={{ width: `${phanTram}%` }} /></div>
              <div className="bia-dong-so"><span>Bi-a hôm nay</span><b>còn {sanh.tran.con}/{sanh.tran.tong} câu</b></div>
              <span className="bia-chu-nho">Đoàn còn {sanh.doan} câu · Đảo còn {sanh.dao} câu</span>
            </div>}
            {(khoa || !sanh.bat) && <div className="bia-the"><p className="bia-chu-nho" style={{ fontSize: 14 }}>{sanh.message || 'Bi-a chưa mở cho em.'}</p></div>}
            {tin && <p className="bia-loi" role="alert">{tin}</p>}
            {online ? <>
              {banDang && !boBanDang && <div className="bia-the"><b>Em đang có một bàn online</b><span className="bia-chu-nho">Mạng rớt hay trang tải lại thì vào lại bàn cũ; quá 60 giây phòng coi như em đã rời.</span>
                <div className="bia-luoi-2"><button type="button" className="bia-nut-vang" onClick={() => setBanOnline(banDang)}>Vào lại bàn</button><button type="button" className="bia-nut-phu" onClick={() => { try { sessionStorage.removeItem(KHOA_BAN_DANG) } catch { /* bỏ qua */ } setBoBanDang(true) }}>Bỏ bàn đó</button></div></div>}
              <div className="bia-dong-so bia-diem-ban"><span>Điểm bàn</span><b>{sanh.diemBan.diem}{sanh.diemBan.soVan ? ` · ${sanh.diemBan.soVan} ván` : ''}</b></div>
              {(() => { const lm = loaiMang(sanh); const gh = lm === 'giao_huu'; return <>
                <button type="button" className="bia-nut-vang" disabled={!lm || dang} onClick={() => lm && void moBanOnline(() => taoBanOnline(token, 'don', lm))}>{dang ? 'Đang mở bàn…' : gh ? 'Bàn giao hữu với bạn · đấu đơn' : 'Đấu đơn với bạn'}{gh && <small>Không câu, không EXP · còn {sanh.giaoHuu.con}/{sanh.giaoHuu.toiDa} ván</small>}</button>
                <div className="bia-luoi-2">
                  <button type="button" className="bia-nut-phu" disabled={!lm || dang} onClick={() => lm && void moBanOnline(() => taoBanOnline(token, 'doi', lm))}>Đánh đôi 2 đấu 2<small>{gh ? 'Bàn giao hữu với bạn' : 'Mời bạn hoặc thêm A.I'}</small></button>
                  <button type="button" className="bia-nut-phu" aria-expanded={nhapMa} disabled={dang} onClick={() => setNhapMa(!nhapMa)}>Nhập mã bàn<small>Bạn ngồi cạnh đọc mã</small></button>
                </div>
              </> })()}
              {nhapMa && <form className="bia-the bia-nhap-ma" onSubmit={(e) => { e.preventDefault(); void moBanOnline(() => vaoBanBangMa(token, ma)) }}>
                <label className="bia-chu-nho" htmlFor="bia-ma">Mã bàn (4 chữ số)</label>
                <input id="bia-ma" inputMode="numeric" autoComplete="off" maxLength={4} value={ma} onChange={(e) => setMa(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                <button type="submit" className="bia-nut-vang" disabled={ma.length !== 4 || dang}>Vào bàn</button>
              </form>}
              <button type="button" className="bia-nut-phu" aria-expanded={moAi} onClick={() => setMoAi(!moAi)}>Tự chơi với A.I<small>{coCau ? 'Đấu đơn hoặc đánh đôi với A.I' : sanh.giaoHuu.mo ? 'Bàn giao hữu với A.I' : 'Hết câu Bi-a hôm nay'}</small></button>
              {moAi && <div className="bia-luoi-2">
                {coCau ? <>
                  <button type="button" className="bia-nut-phu" disabled={dang} onClick={() => void vaoBan('ai', 'don')}>Đấu đơn với A.I</button>
                  <button type="button" className="bia-nut-phu" disabled={dang} onClick={() => void vaoBan('ai', 'doi')}>Đánh đôi với A.I<small>em giữ 4 bi</small></button>
                </> : <button type="button" className="bia-nut-phu" disabled={dang || !sanh.giaoHuu.mo || sanh.giaoHuu.con <= 0} onClick={() => void vaoBan('giao_huu', 'don')}>Bàn giao hữu với A.I<small>còn {sanh.giaoHuu.con}/{sanh.giaoHuu.toiDa} ván</small></button>}
              </div>}
              <div className="bia-the">
                <b>Bạn cùng lớp đang ở Sảnh Bi-a</b>
                {ban.length ? <ul className="bia-ds-ban">{ban.map((b) => <li key={b.sbd}><span><span className="bia-ghe-ten">{b.ten}</span><span className="bia-chu-nho">Bi-a còn {b.conTran} câu</span></span>
                  <button type="button" className="bia-nut-chu" disabled={dang || !loaiMang(sanh)} onClick={() => taoVaMoi(b)}>Mời</button></li>)}</ul>
                  : <p className="bia-chu-nho">Chưa có bạn nào đang ở Sảnh Bi-a. Em mở bàn rồi đọc mã cho bạn ngồi cạnh nhé.</p>}
              </div>
            </> : <>
            <button type="button" className="bia-nut-vang" disabled={!coCau || dang} onClick={() => void vaoBan('ai', 'don')}>{dang ? 'Đang xếp bàn…' : 'Tự chơi với A.I · đấu đơn'}</button>
            <button type="button" className="bia-nut-phu" disabled={!coCau || dang} onClick={() => void vaoBan('ai', 'doi')}>Đánh đôi 2 đấu 2 với A.I<small>Em + 1 A.I đồng đội đấu 2 A.I · em giữ 4 bi</small></button>
            {sanh.giaoHuu.mo && <button type="button" className="bia-nut-phu" disabled={dang || sanh.giaoHuu.con <= 0} onClick={() => void vaoBan('giao_huu', 'don')}>Bàn giao hữu · còn {sanh.giaoHuu.con}/{sanh.giaoHuu.toiDa} ván<small>Không câu, không EXP · em đã xong kế hoạch hôm nay</small></button>}
            <div className="bia-luoi-2">
              <button type="button" className="bia-nut-phu" disabled>Đấu với bạn<small>Sắp mở</small></button>
              <button type="button" className="bia-nut-phu" disabled>Nhập mã bàn<small>Sắp mở</small></button>
            </div>
            </>}
            <button type="button" className="bia-nut-phu" disabled={!coCau || dang} onClick={() => { setTin(''); setChiTraLoi(true) }}>Trả lời câu hỏi · không cần chơi<small>{coCau ? `Làm câu Bi-a hôm nay (còn ${sanh.tran.con} câu), không đánh bi · vẫn có EXP` : 'Chưa có câu Bi-a lúc này'}</small></button>
            <CongTacMatThan />
            <div className="bia-the">
              <b>Luật nhanh</b>
              <span className="bia-chu-nho">Bi của phe em rơi lỗ thì người giữ bi trả lời câu của bi, đúng mới ăn. Sai là sang lượt người khác ngay, em đọc lời giải. Lúc người khác đánh: giải trước bi của em (đúng thì bi hoá vàng) hoặc xem lại câu sai. Ăn đủ 7 bi rồi hạ Bi chốt carbon và trả lời Câu chốt để thắng.</span>
            </div>
          </>}
        </div>
      </div>
      {online && loiMoi[0] && <div className="bia-loi-moi" role="dialog" aria-label="Lời mời đấu Bi-a">
        <span><b>{loiMoi[0].tu}</b> mời em {loiMoi[0].loai === 'giao_huu' ? 'chơi Bàn giao hữu' : 'đấu Bi-a'} · {loiMoi[0].cheDo === 'doi' ? 'đánh đôi' : 'đấu đơn'}<small>còn {loiMoi[0].conGiay} giây</small></span>
        <div className="bia-hang-nut">
          <button type="button" className="bia-nut-chu" onClick={() => { const m = loiMoi[0]!; setLoiMoi((d) => d.filter((x) => x.id !== m.id)); void traLoiLoiMoi(token, m.id, false).catch(() => {}) }}>Từ chối</button>
          <button type="button" className="bia-nut-vang" disabled={dang} onClick={() => { const m = loiMoi[0]!; setLoiMoi((d) => d.filter((x) => x.id !== m.id)); void moBanOnline(async () => (await traLoiLoiMoi(token, m.id, true))!) }}>Nhận</button>
        </div>
      </div>}
    </div>
  )
}
