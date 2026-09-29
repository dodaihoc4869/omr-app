// BI-A PHẢN ỨNG · TẤM CÂU HỎI (đặc tả 8.4). Dùng lại thẻ câu của Đảo 2.0: `TheCauAi` (TheCau chế độ 'thi', Bùa Trợ giảng gạch phương án)
// khi làm, `KhoiLoiGiai` (TheCau 'xem_lai' + lời giải chuẩn + hình sau lời giải) khi đã chốt — không vẽ bộ lời giải thứ hai.
// Chấm ở máy chủ (lệnh `answer` chung). SAI ⇒ báo `onCham` ngay (lượt sang người kế tiếp NGAY), tấm ở lại tới khi em bấm "Đã đọc lời giải".
import { useEffect, useRef, useState } from 'react'
import { KhoiLoiGiai, TheCauAi } from '../than-thu-v2/dao2/TrongAi'
import type { PhanHoi2 } from '../than-thu-v2/dao2/TrongAi'
import { docGoiY, docVai } from '../than-thu-v2/dao2/dao2-core'
import { SoExpCau, useCheDoHieuUng } from '../../components/exp-cau/ExpCau'
import { expCauGame } from '../../lib/hieu-ung-exp-cau'
import { traLoiBia, type PhanHoiBia } from './api'
import { giayCau, TEN_MUC, hangMuc } from './luat'
import type { YeuCauCau } from './dieu-khien'

export const dayDu = (phan: string, t: string): boolean => (phan === 'I' ? /^[ABCD]$/.test(t) : phan === 'II' ? /^[DS]{4}$/.test(t) : !!t.trim())
export const phanHoiChoLoiGiai = (p: PhanHoiBia): PhanHoi2 => ({ correct: p.correct, answer: p.answer, traLoi: p.traLoi, solution: p.solution, solutionImages: p.solutionImages, reward: p.reward, lyDo: { moc: 0, exp: p.reward, chu: '' } })
export function NhanCau({ y }: { y: Pick<YeuCauCau, 'mode' | 'id' | 'cau'> }) {
  const vai = docVai(y.cau.vai), on = vai === 'on_lai'
  return y.mode === 'chot'
    ? <b data-chot="">BI CHỐT · CÂU CHỐT</b>
    : <b data-on={on ? '' : undefined}>BI {y.id} · {on ? 'CÂU ÔN' : 'CÂU MỚI'}</b>
}
const moTa = (y: YeuCauCau) => [y.cau.tenDang, TEN_MUC[hangMuc(y.cau.mucDo)], y.cau.phan === 'I' ? 'Trắc nghiệm' : y.cau.phan === 'II' ? 'Đúng–sai' : 'Trả lời ngắn'].filter(Boolean).join(' · ')

export interface TamCauBiaProps {
  y: YeuCauCau
  token: string
  session: string
  /** Tên người đánh (khi đồng đội đánh bi của em), tên lượt hiện tại (giải trước), tên người kế tiếp (câu sai). */
  tenNguoiDanh: string
  laEmDanh: boolean
  tenLuotNay: string
  tenKeTiep: string
  /** Máy chủ vừa chấm (hoặc hết giờ khi chưa chọn đủ ⇒ `phanHoi` null, không gửi máy chủ). */
  onCham: (dung: boolean, phanHoi: PhanHoiBia | null, traLoi: string) => void
  onDong: (dung: boolean) => void
  onAm?: (k: 'mo' | 'tich') => void
}
export default function TamCauBia({ y, token, session, tenNguoiDanh, laEmDanh, tenLuotNay, tenKeTiep, onCham, onDong, onAm }: TamCauBiaProps) {
  const [traLoi, setTraLoi] = useState('')
  const [phanHoi, setPhanHoi] = useState<PhanHoiBia | null>(null)
  const [hetGio, setHetGio] = useState(false)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [con, setCon] = useState(() => giayCau(y.cau.phan))
  const xong = !!phanHoi || hetGio
  const traLoiRef = useRef(traLoi); traLoiRef.current = traLoi
  const goc = useRef<HTMLDivElement>(null)
  useEffect(() => { onAm?.('mo'); goc.current?.scrollTo?.({ top: 0 }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const nop = async (t: string) => {
    if (dang || xong) return
    setDang(true); setLoi('')
    try {
      const p = await traLoiBia(token, session, y.cau.qid, t)
      setPhanHoi(p)
      onCham(p.correct, p, t)
      goc.current?.scrollTo?.({ top: 0 })
    } catch (e) {
      setLoi(e instanceof Error && e.message ? e.message : 'Chưa chấm được. Em thử lại.')
    } finally { setDang(false) }
  }
  useEffect(() => {
    if (xong) return
    const h = setInterval(() => setCon((c) => {
      const n = c - 1
      if (n <= 10 && n > 0) onAm?.('tich')
      if (n <= 0) {
        clearInterval(h)
        const t = traLoiRef.current
        if (dayDu(y.cau.phan, t)) void nop(t)
        else { setHetGio(true); onCham(false, null, t) } // chưa chọn đủ: không gửi máy chủ — câu chưa tính, để lại cho lần sau
      }
      return Math.max(0, n)
    }), 1000)
    return () => clearInterval(h)
  }, [xong]) // eslint-disable-line react-hooks/exhaustive-deps
  const dung = !!phanHoi?.correct
  const cheDo = useCheDoHieuUng()
  const tt = y.mode === 'sau-lo' ? (laEmDanh ? `Bi ${y.id} vào lỗ · trả lời đúng để ăn bi` : `Đồng đội ${tenNguoiDanh} đánh bi ${y.id} của em vào lỗ · em trả lời`)
    : y.mode === 'chot' ? 'Bi chốt vào lỗ · trả lời đúng là thắng ván' : `Lượt của ${tenLuotNay} · em giải trước`
  const ttSau = xong && !dung && y.mode !== 'giai-truoc' ? `Đã sang lượt ${tenKeTiep} · em đọc lời giải` : tt
  let tieuDe = '', phu = ''
  if (hetGio && !phanHoi) { tieuDe = 'Hết giờ'; phu = y.mode === 'giai-truoc' ? 'Câu này chưa tính, em giải lại sau.' : `Bi ${y.mode === 'chot' ? 'chốt' : y.id} quay lại bàn. Câu này chưa tính, để lại cho lần sau.` }
  else if (phanHoi) {
    if (y.mode === 'sau-lo') { tieuDe = dung ? `Đúng · ăn bi ${y.id}` : `Chưa đúng · bi ${y.id} quay lại bàn`; phu = dung ? (laEmDanh ? 'Em được đánh tiếp và có thêm 1 Mắt thần.' : `${tenNguoiDanh} được đánh tiếp. Em có thêm 1 Mắt thần.`) : `Câu này vào lịch ôn, bi ${y.id} đổi sang câu khác cùng dạng.` }
    else if (y.mode === 'chot') { tieuDe = dung ? 'Đúng · hạ Bi chốt' : 'Chưa đúng · Bi chốt quay lại bàn'; phu = dung ? 'Phe em thắng ván.' : 'Câu này vào lịch ôn.' }
    else { tieuDe = dung ? `Đúng · bi ${y.id} hoá vàng` : 'Chưa đúng'; phu = dung ? 'Bi vàng vào lỗ là ăn ngay. +1 Mắt thần.' : `Câu này vào lịch ôn. Bi ${y.id} đổi sang câu khác cùng dạng.` }
  }
  // Luật v4 (29/09): "+N EXP" bay sang thần thú — số máy chủ (`reward` + `expThuThach`); câu sai / có Bùa Trợ giảng ⇒ không hiệu ứng.
  const expBay = phanHoi ? expCauGame({ correct: phanHoi.correct, coTroGiup: !!docGoiY(y.cau.goiY, y.cau.phan), reward: phanHoi.reward, expThuThach: phanHoi.expThuThach, expCau: phanHoi.expCau }) : 0
  const nutDong = dung ? (y.mode === 'sau-lo' && laEmDanh ? 'Đánh tiếp' : y.mode === 'chot' ? 'Xem kết quả' : 'Về bàn') : hetGio && !phanHoi ? 'Về bàn' : 'Đã đọc lời giải'
  return (
    <div className="bia-che" role="presentation">
      <div className="bia-tam" ref={goc} role="dialog" aria-modal="true" aria-label={tt}>
        <div className="bia-dong-tt">{ttSau}</div>
        {xong && <div className="bia-kq" data-sai={dung ? undefined : ''} role="status"><b>{tieuDe}</b><span>{phu}</span>{expBay > 0 && <SoExpCau exp={expBay} cheDo={cheDo} vaoThu="dong" />}</div>}
        <div className="bia-dau-cau"><NhanCau y={y} /><span>{moTa(y)}</span>{!xong && <span className="gio" data-gap={con <= 15 ? '' : undefined}>Còn {Math.floor(con / 60)}:{String(con % 60).padStart(2, '0')}</span>}</div>
        {y.cau.nhanNo && <p className="bia-nhan-no" data-khoi="nhan-no">{y.cau.nhanNo}</p>}
        <div className="dao2 bia-dao2">
          {!phanHoi && !hetGio && <TheCauAi cau={y.cau} stt={1} traLoi={traLoi} khoa={dang} onTraLoi={setTraLoi} />}
          {phanHoi && (dung
            ? <details className="bia-xem-lg"><summary className="bia-nut-chu">Xem lời giải</summary><KhoiLoiGiai nguon="bi_a" cau={y.cau} stt={1} phanHoi={phanHoiChoLoiGiai(phanHoi)} traLoiMay={traLoi} /></details>
            : <KhoiLoiGiai nguon="bi_a" cau={y.cau} stt={1} phanHoi={phanHoiChoLoiGiai(phanHoi)} traLoiMay={traLoi} />)}
        </div>
        {loi && <p className="bia-loi" role="alert">{loi}</p>}
        {!xong
          ? <button type="button" className="bia-nut-vang" disabled={dang || !dayDu(y.cau.phan, traLoi)} onClick={() => void nop(traLoi)}>{dang ? 'Đang chấm…' : dayDu(y.cau.phan, traLoi) ? 'Chốt đáp án' : y.cau.phan === 'I' ? 'Chọn một phương án' : y.cau.phan === 'II' ? 'Chọn đủ 4 ý' : 'Nhập đáp số'}</button>
          : <button type="button" className={dung ? 'bia-nut-vang' : 'bia-nut-xanh'} onClick={() => onDong(dung)}>{nutDong}</button>}
        {loi && !xong && <button type="button" className="bia-nut-chu" onClick={() => { setHetGio(true); onCham(false, null, traLoi) }}>Bỏ qua câu này (chưa tính)</button>}
      </div>
    </div>
  )
}
