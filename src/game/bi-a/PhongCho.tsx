// BI-A PHẢN ỨNG GĐ2 · PHÒNG CHỜ (đặc tả 6.2): mã bàn 4 chữ số cho bạn ngồi cạnh; ghế theo phe (đánh đôi 4 ghế: ghế trống "Mời bạn" / "Thêm A.I",
// chủ bàn đổi chỗ, "Bắt đầu" khi đủ 4 ghế; đấu đơn: bạn vào là vào ván); danh sách bạn cùng lớp đang ở Sảnh Bi-a + "Mời" (chỉ chủ bàn).
import { useEffect, useRef, useState } from 'react'
import { batVongTrucTiep } from '../../lib/nhip-ben-vung'
import { hoiLoiMoi, moiBanVao, type BanCoMat } from './api'
import type { TrangThaiNoi } from './ket-noi'
import { TEN_PHE } from './nguyen-to'

export interface GhePhongCK { ten: string; ai: boolean; noi: boolean; sanSang: boolean }
export interface PhongCK { van: string; cheDo: 'don' | 'doi'; loai: 'ban' | 'giao_huu'; ma: string | null; trangThai: 'cho' | 'bat_dau' | 'dang' | 'xong' | 'huy'; chuBan: number; ghe: (GhePhongCK | null)[] }
export interface PhongChoProps {
  token: string
  phong: PhongCK | null
  toi: number
  trangThaiNoi: TrangThaiNoi
  conTran: number
  loi: string
  dangXep: boolean
  onGhe: (lam: 'them_ai' | 'bo_ai' | 'doi_cho', ghe: number, ghe2?: number) => void
  onBatDau: () => void
  onRoi: () => void
}

export default function PhongCho({ token, phong, toi, trangThaiNoi, conTran, loi, dangXep, onGhe, onBatDau, onRoi }: PhongChoProps) {
  const [ban, setBan] = useState<BanCoMat[]>([])
  const [daMoi, setDaMoi] = useState<Record<string, 'cho' | 'nhan' | 'tu_choi'>>({})
  const [chonDoi, setChonDoi] = useState<number | null>(null)
  const [tin, setTin] = useState('')
  const moiRef = useRef<Record<string, string>>({})
  const laChu = !!phong && phong.chuBan === toi
  useEffect(() => {
    let song = true
    const hoi = async () => {
      const r = await hoiLoiMoi(token, conTran)
      if (!song) return
      setBan(r.ban)
      if (r.phanHoi.length) setDaMoi((d) => { const m = { ...d }; for (const p of r.phanHoi) { const sbd = Object.keys(moiRef.current).find((k) => moiRef.current[k] === p.id); if (sbd) m[sbd] = p.nhan ? 'nhan' : 'tu_choi' } return m })
    }
    void hoi().catch(() => {})
    const vong = batVongTrucTiep(hoi, 6000)
    return () => { song = false; vong.dung() }
  }, [token, conTran])
  const moi = async (b: BanCoMat) => {
    if (!phong) return
    setTin('')
    try { moiRef.current[b.sbd] = await moiBanVao(token, phong.van, b.sbd); setDaMoi((d) => ({ ...d, [b.sbd]: 'cho' })); setTin(`Đã mời ${b.ten}. Lời mời hết hạn sau 60 giây.`) } catch (e) { setTin(e instanceof Error ? e.message : 'Chưa mời được.') }
  }
  if (!phong) return <Khung onRoi={onRoi} tieuDe="Đang vào bàn…"><p className="bia-chu-nho" role="status">{trangThaiNoi === 'mat' ? 'Chưa nối được phòng đấu. Em kiểm tra mạng rồi vào lại.' : 'Đang nối tới phòng đấu…'}</p>{loi && <p className="bia-loi" role="alert">{loi}</p>}</Khung>
  const doi = phong.cheDo === 'doi', du = phong.ghe.every(Boolean)
  const tenGhe = (i: number) => `Ghế ${i + 1} · ${TEN_PHE[i % 2]}${i === 0 ? ' · phá bàn' : ''}`
  return (
    <Khung onRoi={onRoi} tieuDe="Phòng chờ" phu={`${phong.loai === 'giao_huu' ? 'Bàn giao hữu · không câu' : 'Mỗi bi một câu của em'} · ${doi ? 'đánh đôi 2 đấu 2' : 'đấu đơn'}`}>
      {phong.ma && phong.trangThai === 'cho' && <div className="bia-the bia-ma-ban"><span className="bia-chu-nho">Mã bàn</span><b aria-label={`Mã bàn ${phong.ma.split('').join(' ')}`}>{phong.ma}</b><span className="bia-chu-nho">Bạn ngồi cạnh vào Sảnh Bi-a → "Nhập mã bàn" → nhập mã này.</span></div>}
      <div className="bia-the">
        <b>{doi ? 'Bốn ghế, đánh lần lượt ghế 1 → 2 → 3 → 4' : 'Hai ghế'}</b>
        <ul className="bia-ds-ghe" aria-label="Ghế trong bàn">
          {phong.ghe.map((g, i) => (
            <li key={i} data-phe={i % 2} data-chon={chonDoi === i ? '' : undefined}>
              <span className="bia-chu-nho">{tenGhe(i)}</span>
              <span className="bia-ghe-ten">{g ? `${g.ten}${i === toi ? ' (em)' : ''}` : 'Ghế trống'}</span>
              <span className="bia-chu-nho">{g ? (g.ai ? 'A.I đánh ghế này' : [i === phong.chuBan ? 'Chủ bàn' : '', g.noi ? '' : 'Đang nối lại', phong.trangThai === 'bat_dau' ? (g.sanSang ? 'Sẵn sàng' : 'Đang xếp câu') : ''].filter(Boolean).join(' · ')) : laChu ? 'Mời bạn ở dưới hoặc thêm A.I' : 'Chờ chủ bàn xếp'}</span>
              {laChu && phong.trangThai === 'cho' && doi && <span className="bia-hang-nut-nho">
                {!g && <button type="button" className="bia-nut-chu" onClick={() => onGhe('them_ai', i)}>Thêm A.I</button>}
                {g?.ai && <button type="button" className="bia-nut-chu" onClick={() => onGhe('bo_ai', i)}>Bỏ A.I</button>}
                <button type="button" className="bia-nut-chu" aria-pressed={chonDoi === i} onClick={() => { if (chonDoi === null) setChonDoi(i); else { if (chonDoi !== i) onGhe('doi_cho', chonDoi, i); setChonDoi(null) } }}>{chonDoi === null ? 'Đổi chỗ' : chonDoi === i ? 'Huỷ' : 'Đổi vào đây'}</button>
              </span>}
            </li>
          ))}
        </ul>
        {phong.trangThai === 'cho' && (doi
          ? laChu ? <button type="button" className="bia-nut-vang" disabled={!du} onClick={onBatDau}>{du ? 'Bắt đầu' : 'Đủ 4 ghế mới bắt đầu'}</button> : <p className="bia-chu-nho">Chờ chủ bàn bấm Bắt đầu.</p>
          : <p className="bia-chu-nho" role="status">{du ? 'Đủ người, đang vào ván…' : 'Bạn vào bàn là vào ván ngay.'}</p>)}
        {(phong.trangThai === 'bat_dau' || dangXep) && <p className="bia-chu-nho" role="status">Đang xếp câu cho từng bi của em…</p>}
        {phong.trangThai === 'huy' && <p className="bia-loi" role="alert">Bàn đã đóng.</p>}
      </div>
      {laChu && phong.trangThai === 'cho' && !du && <div className="bia-the">
        <b>Bạn cùng lớp đang ở Sảnh Bi-a</b>
        {ban.length ? <ul className="bia-ds-ban">{ban.map((b) => <li key={b.sbd}><span><span className="bia-ghe-ten">{b.ten}</span><span className="bia-chu-nho">{phong.loai === 'giao_huu' ? 'Đang ở Sảnh' : `Bi-a còn ${b.conTran} câu`}</span></span>
          <button type="button" className="bia-nut-chu" disabled={daMoi[b.sbd] === 'cho' || daMoi[b.sbd] === 'nhan'} onClick={() => void moi(b)}>{daMoi[b.sbd] === 'nhan' ? 'Đã nhận' : daMoi[b.sbd] === 'tu_choi' ? 'Mời lại' : daMoi[b.sbd] === 'cho' ? 'Đã mời' : 'Mời'}</button></li>)}</ul>
          : <p className="bia-chu-nho">Chưa có bạn nào đang ở Sảnh Bi-a. Em đọc mã bàn cho bạn ngồi cạnh nhé.</p>}
        {tin && <p className="bia-chu-nho" role="status">{tin}</p>}
      </div>}
      {loi && <p className="bia-loi" role="alert">{loi}</p>}
    </Khung>
  )
}

function Khung({ tieuDe, phu, onRoi, children }: { tieuDe: string; phu?: string; onRoi: () => void; children: React.ReactNode }) {
  return (
    <div className="bia" data-bo-cuc="doc">
      <div className="bia-sanh"><div className="bia-sanh-trong">
        <header className="bia-dau" style={{ padding: 0 }}>
          <button type="button" className="bia-nut-kinh" onClick={onRoi} aria-label="Rời bàn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg><span className="bia-chu-nut">Rời bàn</span></button>
          <div className="bia-ten"><b>{tieuDe}</b>{phu && <span>{phu}</span>}</div>
          <span style={{ width: 44 }} />
        </header>
        {children}
      </div></div>
    </div>
  )
}
