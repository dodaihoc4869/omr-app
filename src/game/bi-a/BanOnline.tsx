// BI-A PHẢN ỨNG GĐ2 · BÀN ONLINE: giữ kết nối phòng đấu cho cả phòng chờ lẫn ván; chuyển từng gói phòng tới đúng chỗ.
//   'phong' ⇒ Phòng chờ · 'bat_dau' ⇒ xếp câu cho đúng bi ghế em (`bia-xep-ban`) rồi 'san_sang' · 'tt' ⇒ màn chơi (`VanMang`) · 'nhan' · 'loi'.
// Câu đã xếp cất ở sessionStorage theo mã ván: tải lại trang giữa ván vẫn trả lời được câu của mình.
import { useEffect, useRef, useState } from 'react'
import { diaChiPhong, xepBanOnline, type VeVaoBan, type XepOnline } from './api'
import { KetNoiBan, type GoiPhong, type TrangThaiNoi } from './ket-noi'
import ManChoi from './ManChoi'
import PhongCho, { type PhongCK } from './PhongCho'
import type { GoiTT, VanMang } from './dieu-khien-mang'
import { giuTrangKhongTaiLai } from '../../lib/cap-nhat-app'

export interface BanOnlineProps { token: string; hoTen: string; vao: VeVaoBan; conTran: number; onVe: () => void }
const KHOA_XEP = (van: string) => `bia-xep:${van}`
export const KHOA_BAN_DANG = 'bia-ban-dang'

function docXep(van: string): XepOnline | null { try { const s = sessionStorage.getItem(KHOA_XEP(van)); return s ? (JSON.parse(s) as XepOnline) : null } catch { return null } }
function ghiXep(x: XepOnline): void { try { sessionStorage.setItem(KHOA_XEP(x.van), JSON.stringify(x)) } catch { /* bộ nhớ đầy / chặn */ } }

export default function BanOnline({ token, hoTen, vao, conTran, onVe }: BanOnlineProps) {
  const [trangThaiNoi, setTT] = useState<TrangThaiNoi>('dang_noi')
  const [phong, setPhong] = useState<PhongCK | null>(null)
  const [toi, setToi] = useState(-1)
  const [loi, setLoi] = useState('')
  const [dangXep, setDangXep] = useState(false)
  const [dau, setDau] = useState<GoiTT | null>(null)
  const knRef = useRef<KetNoiBan | null>(null)
  const vanRef = useRef<VanMang | null>(null)
  const xepRef = useRef<XepOnline | null>(docXep(vao.van))
  const choRef = useRef<GoiPhong[]>([])
  const daXep = useRef(false)
  const dauRef = useRef<GoiTT | null>(null)
  useEffect(() => giuTrangKhongTaiLai(), []) // phòng chờ + ván online: app không tự tải lại vì bản mới (30/09)
  // Mất mạng lâu (trạng thái 'mat') ⇒ có mạng lại / quay lại app thì TỰ nối lại đúng bàn bằng vé cũ (trước chỉ có nút "Nối lại").
  useEffect(() => {
    const thu = () => { const kn = knRef.current; if (kn && kn.trangThai === 'mat' && (typeof document === 'undefined' || document.visibilityState !== 'hidden')) kn.noiLai() }
    window.addEventListener('online', thu); document.addEventListener('visibilitychange', thu)
    return () => { window.removeEventListener('online', thu); document.removeEventListener('visibilitychange', thu) }
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(KHOA_BAN_DANG, JSON.stringify(vao)) } catch { /* bỏ qua */ }
    let song = true
    const nhan = (m: GoiPhong) => {
      if (m.t === 'phong') { setPhong(m.phong as PhongCK); if (typeof m.toi === 'number') setToi(m.toi) }
      else if (m.t === 'bat_dau') {
        if (daXep.current || typeof m.veGhe !== 'string') return
        daXep.current = true; setDangXep(true)
        void xepBanOnline(token, m.veGhe).then((x) => { xepRef.current = x; ghiXep(x); knRef.current?.gui({ t: 'san_sang', ve: x.veTran }) })
          .catch((e) => { daXep.current = false; setLoi(e instanceof Error ? e.message : 'Chưa xếp được câu.') })
          .finally(() => setDangXep(false))
      } else if (m.t === 'tt') {
        if (typeof m.toi === 'number') setToi(m.toi)
        if (vanRef.current) vanRef.current.apTT(m as unknown as GoiTT)
        else if (dauRef.current) choRef.current.push(m)
        else { dauRef.current = m as unknown as GoiTT; setDau(dauRef.current) }
      } else if (m.t === 'nhan') vanRef.current?.apNhan(Number(m.tu), Number(m.id))
      else if (m.t === 'loi') { const chu = typeof m.chu === 'string' ? m.chu : ''; if (vanRef.current) vanRef.current.apLoi(m.ma, chu); else setLoi(chu) }
    }
    void diaChiPhong(vao.van).then((url) => {
      if (!song) return
      const kn = new KetNoiBan({ url, ve: vao.ve, nhan, doi: (t) => { setTT(t); vanRef.current?.datTrangThaiNoi(t) } })
      knRef.current = kn
      kn.mo()
    })
    return () => { song = false; knRef.current?.dong() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const roi = () => {
    knRef.current?.gui({ t: 'bo_van' })
    try { sessionStorage.removeItem(KHOA_BAN_DANG) } catch { /* bỏ qua */ }
    onVe()
  }
  if (dau && knRef.current) {
    const x = xepRef.current
    return (
      <ManChoi token={token} tenEm={hoTen || 'Em'} van={vao.van} session={x?.session ?? null} cheDo={vao.cheDo} loai={vao.loai === 'giao_huu' ? 'giao_huu' : 'ai'} cauEm={[]} chot={x?.chot ?? null}
        onVeSanh={() => { try { sessionStorage.removeItem(KHOA_BAN_DANG) } catch { /* bỏ qua */ } onVe() }} onChoiLai={onVe}
        mang={{ kenh: knRef.current, em: typeof dau.toi === 'number' ? dau.toi : toi, dau, cauTheoBi: x?.cauTheoBi ?? {}, loaiMang: vao.loai, noiLai: () => knRef.current?.noiLai(),
          onVan: (v) => { vanRef.current = v; v.datTrangThaiNoi(trangThaiNoi); for (const m of choRef.current.splice(0)) v.apTT(m as unknown as GoiTT) } }} />
    )
  }
  return <PhongCho token={token} phong={phong} toi={toi} trangThaiNoi={trangThaiNoi} conTran={conTran} loi={loi} dangXep={dangXep}
    onGhe={(lam, ghe, ghe2) => knRef.current?.gui({ t: 'ghe', lam, ghe, ...(ghe2 !== undefined ? { ghe2 } : {}) })}
    onBatDau={() => knRef.current?.gui({ t: 'bat_dau' })} onRoi={roi} />
}
