// BI-A PHẢN ỨNG · VÀO GAME (đặc tả 8.2): Sảnh Bi-a → xếp bàn (máy chủ lấy câu từ kế hoạch hôm nay, trần 40%) → Màn chơi.
// GĐ1: tự chơi với A.I (đấu đơn, đánh đôi) và Bàn giao hữu với A.I. Đấu với bạn / mã bàn là GĐ2 — nút ghi "Sắp mở".
import { useCallback, useEffect, useRef, useState } from 'react'
import { taiSanhBia, xepBanBia, type SanhBia } from './api'
import ManChoi from './ManChoi'
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

export default function BiaGame({ token, hoTen, onVe }: BiaGameProps) {
  const [sanh, setSanh] = useState<SanhBia | null>(null)
  const [loi, setLoi] = useState('')
  const [dang, setDang] = useState(false)
  const [van, setVan] = useState<VanDangChoi | null>(null)
  const [tin, setTin] = useState('')
  const cuoi = useRef<{ loai: LoaiVan; cheDo: CheDo } | null>(null)
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
            <button type="button" className="bia-nut-vang" disabled={!coCau || dang} onClick={() => void vaoBan('ai', 'don')}>{dang ? 'Đang xếp bàn…' : 'Tự chơi với A.I · đấu đơn'}</button>
            <button type="button" className="bia-nut-phu" disabled={!coCau || dang} onClick={() => void vaoBan('ai', 'doi')}>Đánh đôi 2 đấu 2 với A.I<small>Em + 1 A.I đồng đội đấu 2 A.I · em giữ 4 bi</small></button>
            {sanh.giaoHuu.mo && <button type="button" className="bia-nut-phu" disabled={dang || sanh.giaoHuu.con <= 0} onClick={() => void vaoBan('giao_huu', 'don')}>Bàn giao hữu · còn {sanh.giaoHuu.con}/{sanh.giaoHuu.toiDa} ván<small>Không câu, không EXP · em đã xong kế hoạch hôm nay</small></button>}
            <div className="bia-luoi-2">
              <button type="button" className="bia-nut-phu" disabled>Đấu với bạn<small>Sắp mở</small></button>
              <button type="button" className="bia-nut-phu" disabled>Nhập mã bàn<small>Sắp mở</small></button>
            </div>
            <div className="bia-the">
              <b>Luật nhanh</b>
              <span className="bia-chu-nho">Bi của phe em rơi lỗ thì người giữ bi trả lời câu của bi, đúng mới ăn. Sai là sang lượt người khác ngay, em đọc lời giải. Lúc người khác đánh: giải trước bi của em (đúng thì bi hoá vàng) hoặc xem lại câu sai. Ăn đủ 7 bi rồi hạ Bi chốt carbon và trả lời Câu chốt để thắng.</span>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}
