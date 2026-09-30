// BI-A PHẢN ỨNG · VÀO GAME (đặc tả 8.2): Sảnh Bi-a → xếp bàn (máy chủ lấy câu từ kế hoạch hôm nay, trần 40%) → Màn chơi.
// Sảnh chia 3 nhóm chế độ: Chơi với bạn · Chơi với A.I · Trả lời câu hỏi (không cần chơi); ngang / máy tính có cột phụ bên phải.
// GĐ1: tự chơi với A.I (đấu đơn, đánh đôi) và Bàn giao hữu với A.I. GĐ2 (máy chủ có phòng đấu): Đấu đơn / Đánh đôi với bạn, Nhập mã bàn,
// bạn cùng lớp đang ở Sảnh Bi-a + Mời, lời mời đến (Nhận / Từ chối), Điểm bàn. Máy chủ chưa có phòng đấu ⇒ nút online ghi "Sắp mở".
import { useCallback, useEffect, useRef, useState } from 'react'
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

// Biểu tượng 3 nhóm chế độ ở Sảnh (nét vẽ, theo màu chữ của ô biểu tượng).
const NET = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const BIEU_TUONG = {
  ban: <svg {...NET}><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" /><circle cx="17" cy="9" r="2.6" /><path d="M16.2 14.3c2.5.2 4.3 1.9 4.8 5" /></svg>,
  ai: <svg {...NET}><rect x="5" y="8" width="14" height="11" rx="3.2" /><path d="M12 4.5V8M2.8 12.5v3M21.2 12.5v3" /><circle cx="12" cy="3.6" r="1" /><circle cx="9.5" cy="13.2" r="1.3" fill="currentColor" stroke="none" /><circle cx="14.5" cy="13.2" r="1.3" fill="currentColor" stroke="none" /></svg>,
  cau: <svg {...NET}><path d="M4 5h16v11.5H9.5L4 20.5z" /><path d="M9.8 9.2a2.2 2.2 0 1 1 3 2c-.6.3-.8.7-.8 1.3" /><circle cx="12" cy="14.3" r=".7" fill="currentColor" /></svg>,
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
  if (banOnline) return <BanOnline token={token} hoTen={hoTen} vao={banOnline} conTran={conTran} onVe={() => { setBanOnline(null); setBoBanDang(true); void napSanh() }} />
  if (chiTraLoi) return <TraLoiCau token={token} onVe={() => { setChiTraLoi(false); void napSanh() }} />
  if (van) return (
    <ManChoi key={van.khoa} token={token} tenEm={hoTen || 'Em'} van={van.van} session={van.session} cheDo={van.cheDo} loai={van.loai} cauEm={van.cauEm} chot={van.chot}
      onVeSanh={() => { setVan(null); void napSanh() }} onChoiLai={() => { setVan(null); const c = cuoi.current; if (c) void vaoBan(c.loai, c.cheDo); else void napSanh() }} />
  )
  const khoa = sanh?.lyDoKhoa ?? null
  const coCau = !!sanh && sanh.bat && !khoa && sanh.tran.con > 0
  const phanTram = sanh && sanh.theLuc.tong ? Math.round((1 - sanh.theLuc.con / sanh.theLuc.tong) * 100) : 0
  return (
    <div className="bia" data-bo-cuc="doc">
      <div className="bia-sanh">
        <div className="bia-sanh-trong bia-sanh-rong">
          <header className="bia-dau" style={{ padding: 0 }}>
            <button type="button" className="bia-nut-kinh" onClick={onVe} aria-label="Về Sảnh Bát Linh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg><span className="bia-chu-nut">Sảnh</span></button>
            <div className="bia-ten"><b>Bi-a Phản Ứng</b><span>Kim loại đấu Phi kim · mỗi bi một câu</span></div>
            <span style={{ width: 44 }} />
          </header>
          <div className="bia-bi-mau" aria-hidden="true"><BiMau id="Na" /><BiMau id="Cl" /><BiMau id={CHOT as 'C'} /></div>
          {!sanh && !loi && <p className="bia-chu-nho" role="status" style={{ textAlign: 'center' }}>Đang mở bàn…</p>}
          {loi && <div className="bia-the"><p className="bia-loi" role="alert">{loi}</p><button type="button" className="bia-nut-phu" onClick={() => void napSanh()}>Thử lại</button></div>}
          {sanh && <>
            {(khoa || !sanh.bat) && <div className="bia-the"><p className="bia-chu-nho" style={{ fontSize: 14 }}>{sanh.message || 'Bi-a chưa mở cho em.'}</p></div>}
            {tin && <p className="bia-loi" role="alert">{tin}</p>}
            {/* Bố cục: dọc = một cột (số liệu → chế độ chơi → phụ); ngang / máy tính = chế độ chơi bên trái, cột phụ bên phải (bi-a.css). */}
            <div className="bia-sanh-luoi">
              <section className="bia-the bia-chi-so" aria-label="Số liệu hôm nay">
                {sanh.chienDich && <div className="bia-chi-so-dau"><span className="bia-chu-nho">Chiến dịch thầy giao</span>
                  <h2>{sanh.chienDich.ten}{sanh.chienDich.tong ? ` · ${sanh.chienDich.tong} câu` : ''}</h2></div>}
                <div className="bia-o-so-luoi">
                  {online && <div className="bia-o-so"><span>Điểm bàn</span><b>{sanh.diemBan.diem}{sanh.diemBan.soVan ? ` · ${sanh.diemBan.soVan} ván` : ''}</b></div>}
                  <div className="bia-o-so"><span>Bi-a hôm nay</span><b>còn {sanh.tran.con}/{sanh.tran.tong} câu</b></div>
                  {sanh.chienDich && <div className="bia-o-so"><span>Thể lực hôm nay</span><b>còn {sanh.theLuc.con}/{sanh.theLuc.tong} câu</b>
                    <div className="bia-vach" role="progressbar" aria-label="Đã làm hôm nay" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phanTram}><i style={{ width: `${phanTram}%` }} /></div></div>}
                </div>
                {sanh.chienDich && <span className="bia-chu-nho">Đoàn còn {sanh.doan} câu · Đảo còn {sanh.dao} câu</span>}
              </section>
              <div className="bia-sanh-chinh" data-ai-truoc={online ? undefined : ''}>
                {online && banDang && !boBanDang && <div className="bia-the bia-the-rong"><b>Em đang có một bàn online</b><span className="bia-chu-nho">Mạng rớt hay trang tải lại thì vào lại bàn cũ; quá 60 giây phòng coi như em đã rời.</span>
                  <div className="bia-luoi-2"><button type="button" className="bia-nut-vang" onClick={() => setBanOnline(banDang)}>Vào lại bàn</button><button type="button" className="bia-nut-phu" onClick={() => { try { sessionStorage.removeItem(KHOA_BAN_DANG) } catch { /* bỏ qua */ } setBoBanDang(true) }}>Bỏ bàn đó</button></div></div>}
                <section className="bia-che-do" aria-labelledby="bia-cd-ban">
                  {(() => { const lm = online ? loaiMang(sanh) : null; const gh = lm === 'giao_huu'; return <>
                    <div className="bia-che-do-dau"><span className="bia-bieu-tuong" data-loai="ban">{BIEU_TUONG.ban}</span>
                      <div><h2 id="bia-cd-ban">Chơi với bạn</h2><p>{!online ? 'Đấu với bạn cùng lớp · sắp mở' : gh ? 'Bàn giao hữu với bạn · không câu, không EXP' : 'Đấu với bạn cùng lớp · ván tính Điểm bàn'}</p></div></div>
                    {online ? <>
                      <button type="button" className="bia-nut-vang" disabled={!lm || dang} onClick={() => lm && void moBanOnline(() => taoBanOnline(token, 'don', lm))}>{dang ? 'Đang mở bàn…' : gh ? 'Bàn giao hữu với bạn · đấu đơn' : 'Đấu đơn với bạn'}{gh && <small>Không câu, không EXP · còn {sanh.giaoHuu.con}/{sanh.giaoHuu.toiDa} ván</small>}</button>
                      <div className="bia-luoi-2">
                        <button type="button" className="bia-nut-phu" disabled={!lm || dang} onClick={() => lm && void moBanOnline(() => taoBanOnline(token, 'doi', lm))}>Đánh đôi 2 đấu 2<small>{gh ? 'Bàn giao hữu với bạn' : 'Mời bạn hoặc thêm A.I'}</small></button>
                        <button type="button" className="bia-nut-phu" aria-expanded={nhapMa} disabled={dang} onClick={() => setNhapMa(!nhapMa)}>Nhập mã bàn<small>Bạn ngồi cạnh đọc mã</small></button>
                      </div>
                      {nhapMa && <form className="bia-nhap-ma" onSubmit={(e) => { e.preventDefault(); void moBanOnline(() => vaoBanBangMa(token, ma)) }}>
                        <label className="bia-chu-nho" htmlFor="bia-ma">Mã bàn (4 chữ số)</label>
                        <input id="bia-ma" inputMode="numeric" autoComplete="off" maxLength={4} value={ma} onChange={(e) => setMa(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                        <button type="submit" className="bia-nut-vang" disabled={ma.length !== 4 || dang}>Vào bàn</button>
                      </form>}
                    </> : <div className="bia-luoi-2">
                      <button type="button" className="bia-nut-phu" disabled>Đấu với bạn<small>Sắp mở</small></button>
                      <button type="button" className="bia-nut-phu" disabled>Nhập mã bàn<small>Sắp mở</small></button>
                    </div>}
                  </> })()}
                </section>
                <section className="bia-che-do" aria-labelledby="bia-cd-ai">
                  <div className="bia-che-do-dau"><span className="bia-bieu-tuong" data-loai="ai">{BIEU_TUONG.ai}</span>
                    <div><h2 id="bia-cd-ai">Chơi với A.I</h2><p>{coCau ? 'Tự luyện một mình · mỗi bi rơi lỗ là một câu' : sanh.giaoHuu.mo ? 'Hết câu Bi-a hôm nay · còn Bàn giao hữu' : 'Chưa có câu Bi-a lúc này'}</p></div></div>
                  {/* Máy chủ chưa mở đấu với bạn ⇒ "Đấu đơn với A.I" là nút chính của Sảnh; đã mở ⇒ nút chính là "Đấu đơn với bạn". */}
                  <div className={online ? 'bia-luoi-2' : 'bia-cot-nut'}>
                    <button type="button" className={online ? 'bia-nut-phu' : 'bia-nut-vang'} disabled={!coCau || dang} onClick={() => void vaoBan('ai', 'don')}>{dang && !online ? 'Đang xếp bàn…' : 'Đấu đơn với A.I'}</button>
                    <button type="button" className="bia-nut-phu" disabled={!coCau || dang} onClick={() => void vaoBan('ai', 'doi')}>Đánh đôi với A.I<small>2 đấu 2 · em giữ 4 bi</small></button>
                  </div>
                  {sanh.giaoHuu.mo && <button type="button" className="bia-nut-phu" disabled={dang || sanh.giaoHuu.con <= 0} onClick={() => void vaoBan('giao_huu', 'don')}>Bàn giao hữu với A.I<small>còn {sanh.giaoHuu.con}/{sanh.giaoHuu.toiDa} ván · không câu, không EXP</small></button>}
                </section>
                <button type="button" className="bia-the-cau" disabled={!coCau || dang} onClick={() => { setTin(''); setChiTraLoi(true) }}>
                  <span className="bia-bieu-tuong" data-loai="cau">{BIEU_TUONG.cau}</span>
                  <span className="bia-the-cau-chu"><b>Trả lời câu hỏi · không cần chơi</b><small>{coCau ? `Làm câu Bi-a hôm nay (còn ${sanh.tran.con} câu), không đánh bi · vẫn có EXP` : 'Chưa có câu Bi-a lúc này'}</small></span>
                  <svg className="bia-mui" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
              <div className="bia-sanh-phu">
                {online && <div className="bia-the">
                  <b>Bạn cùng lớp đang ở Sảnh Bi-a</b>
                  {ban.length ? <ul className="bia-ds-ban">{ban.map((b) => <li key={b.sbd}><span><span className="bia-ghe-ten">{b.ten}</span><span className="bia-chu-nho">Bi-a còn {b.conTran} câu</span></span>
                    <button type="button" className="bia-nut-chu" disabled={dang || !loaiMang(sanh)} onClick={() => taoVaMoi(b)}>Mời</button></li>)}</ul>
                    : <p className="bia-chu-nho">Chưa có bạn nào đang ở Sảnh Bi-a. Em mở bàn rồi đọc mã cho bạn ngồi cạnh nhé.</p>}
                </div>}
                <CongTacMatThan />
                <details className="bia-the bia-luat">
                  <summary>Luật nhanh</summary>
                  <p className="bia-chu-nho">Bi của phe em rơi lỗ thì người giữ bi trả lời câu của bi, đúng mới ăn. Sai là sang lượt người khác ngay, em đọc lời giải. Lúc người khác đánh: giải trước bi của em (đúng thì bi hoá vàng) hoặc xem lại câu sai. Ăn đủ 7 bi rồi hạ Bi chốt carbon và trả lời Câu chốt để thắng.</p>
                </details>
              </div>
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
