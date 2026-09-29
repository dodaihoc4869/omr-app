// BI-A · "TRẢ LỜI CÂU HỎI" — KHÔNG CẦN CHƠI (thầy lệnh 29/09: "một nút cho trả lời câu hỏi không cần chơi").
// Câu = ĐÚNG câu Bi-a hôm nay của em (máy chủ `bia-tra-loi`: cùng nguồn kế hoạch, cùng trần, cùng luật bảo vệ đề ca, không tự luận).
// Thẻ câu chuẩn (`TheCauAi` = TheCau chế độ 'thi'), chấm ở MÁY CHỦ qua `answer` chung (đáp án chỉ về SAU khi chốt), lời giải `KhoiLoiGiai`,
// "+N EXP" bay vào thần thú theo số máy chủ (`expCau`, luật v5). Hỏi thầy trước khi chốt ⇒ câu tính "có trợ giúp" (không EXP).
// Hết lượt câu ⇒ xin lượt sau; hết câu ⇒ báo đúng chữ của Bi-a (het_tran…). Câu đã trả lời ở đây không hỏi lại trong ván bi-a hôm đó.
import { useCallback, useEffect, useRef, useState } from 'react'
import { KhoiLoiGiai, TheCauAi } from '../than-thu-v2/dao2/TrongAi'
import { docGoiY, docVai } from '../than-thu-v2/dao2/dao2-core'
import NutHoiThay from '../../components/loi-giai/NutHoiThay'
import { SoExpCau, useCheDoHieuUng } from '../../components/exp-cau/ExpCau'
import { expCauGame } from '../../lib/hieu-ung-exp-cau'
import { dongTraLoi, layCauTraLoi, traLoiBia, type PhanHoiBia } from './api'
import { CHU_CAU_DOI, laLoiCauDoi } from '../than-thu-v2/loi-het-tran'
import { TEN_MUC, hangMuc } from './luat'
import { dayDu, phanHoiChoLoiGiai } from './TamCauBia'
import type { CauBia } from './dieu-khien'

export interface TraLoiCauProps { token: string; onVe: () => void }
interface Luot { session: string; cau: CauBia[]; tran: { con: number; tong: number } }
const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

export default function TraLoiCau({ token, onVe }: TraLoiCauProps) {
  const [luot, setLuot] = useState<Luot | null>(null)
  const [viTri, setViTri] = useState(0)
  const [het, setHet] = useState('')
  const [loiTai, setLoiTai] = useState('')
  const [traLoi, setTraLoi] = useState('')
  const [troGiup, setTroGiup] = useState(false)
  const [phanHoi, setPhanHoi] = useState<PhanHoiBia | null>(null)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [baoCau, setBaoCau] = useState('')
  const [soDung, setSoDung] = useState(0)
  const [soDaLam, setSoDaLam] = useState(0)
  const cheDo = useCheDoHieuUng()
  const goc = useRef<HTMLDivElement>(null)
  const phienRef = useRef<string | null>(null)

  const taiLuot = useCallback(async () => {
    setLoiTai(''); setHet('')
    try {
      const r = await layCauTraLoi(token)
      if (!r.ok) { phienRef.current = null; setLuot(null); setHet(r.message); return }
      phienRef.current = r.session
      setLuot(r); setViTri(0); setTraLoi(''); setTroGiup(false); setPhanHoi(null); setLoi('')
      goc.current?.scrollTo?.({ top: 0 })
    } catch (e) { setLoiTai(e instanceof Error && e.message ? e.message : 'Chưa lấy được câu. Em thử lại.') }
  }, [token])
  const daMo = useRef(false)
  useEffect(() => { if (daMo.current) return; daMo.current = true; void taiLuot() }, [taiLuot]) // một lần (StrictMode chạy hiệu ứng hai lượt)
  // Rời màn: đóng phiên ⇒ câu chưa trả lời về lại kế hoạch ngay.
  useEffect(() => () => { const s = phienRef.current; if (s) void dongTraLoi(token, s) }, [token])

  const cau = luot?.cau[viTri] ?? null
  const goiY = cau ? docGoiY(cau.goiY, cau.phan) : null
  const nop = async () => {
    if (!luot || !cau || dang || phanHoi || !dayDu(cau.phan, traLoi)) return
    setDang(true); setLoi('')
    try {
      const p = await traLoiBia(token, luot.session, cau.qid, traLoi, troGiup)
      setPhanHoi(p); setSoDaLam((n) => n + 1); if (p.correct) setSoDung((n) => n + 1)
      goc.current?.scrollTo?.({ top: 0 })
    } catch (e) {
      // Câu vừa được thầy sửa đề/đáp án (mã `cau_doi`, 29/09) ⇒ tự sang câu kế (không tính sai) thay vì để em kẹt.
      if (laLoiCauDoi(e)) { tiep(); setBaoCau(CHU_CAU_DOI); return }
      setLoi(e instanceof Error && e.message ? e.message : 'Chưa chấm được. Em thử lại.')
    } finally { setDang(false) }
  }
  const tiep = () => {
    if (!luot) return
    setBaoCau('')
    if (viTri + 1 < luot.cau.length) { setViTri(viTri + 1); setTraLoi(''); setTroGiup(false); setPhanHoi(null); setLoi(''); goc.current?.scrollTo?.({ top: 0 }); return }
    void taiLuot() // hết lượt ⇒ xin lượt sau (máy chủ tự đóng phiên cũ; hết câu thì báo)
  }
  const dung = !!phanHoi?.correct
  const expBay = phanHoi && cau ? expCauGame({ correct: phanHoi.correct, coTroGiup: troGiup || !!goiY, reward: phanHoi.reward, expThuThach: phanHoi.expThuThach, expCau: phanHoi.expCau }) : 0
  const vai = cau ? docVai(cau.vai) : null
  const moTa = cau ? [cau.tenDang, TEN_MUC[hangMuc(cau.mucDo)], TEN_PHAN[cau.phan]].filter(Boolean).join(' · ') : ''
  const cuoiLuot = !!luot && viTri + 1 >= luot.cau.length

  return (
    <div className="bia" data-bo-cuc="doc">
      <div className="bia-tl" ref={goc}>
        <div className="bia-tl-trong">
          <header className="bia-dau" style={{ padding: 0 }}>
            <button type="button" className="bia-nut-kinh" onClick={onVe} aria-label="Về Sảnh Bi-a"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg><span className="bia-chu-nut">Sảnh</span></button>
            <div className="bia-ten"><b>Trả lời câu hỏi</b><span>Câu Bi-a hôm nay</span></div>
            <span style={{ width: 44 }} />
          </header>
          {!luot && !het && !loiTai && <p className="bia-chu-nho" role="status" style={{ textAlign: 'center' }}>Đang lấy câu…</p>}
          {loiTai && <div className="bia-the"><p className="bia-loi" role="alert">{loiTai}</p><button type="button" className="bia-nut-phu" onClick={() => void taiLuot()}>Thử lại</button></div>}
          {het && <div className="bia-the" role="status">
            {soDaLam > 0 && <b>Em đã trả lời {soDaLam} câu · đúng {soDung} câu</b>}
            <p className="bia-chu-nho" style={{ fontSize: 14 }}>{het}</p>
            <button type="button" className="bia-nut-vang" onClick={onVe}>Về Sảnh Bi-a</button>
          </div>}
          {luot && cau && <>
            <div className="bia-tl-tien-do" role="status">
              <span>Câu {viTri + 1}/{luot.cau.length}</span>
              <span>Đã trả lời {soDaLam} · đúng {soDung}</span>
            </div>
            {phanHoi && <div className="bia-kq" data-sai={dung ? undefined : ''} role="status">
              <b>{dung ? 'Đúng' : 'Chưa đúng'}</b>
              <span>{dung ? (expBay > 0 ? 'EXP đã vào thần thú của em.' : troGiup ? 'Câu có trợ giúp: không tính EXP, câu sẽ quay lại để em tự làm.' : 'Em làm tốt lắm.') : 'Câu này vào lịch ôn. Em đọc lời giải bên dưới.'}</span>
              {expBay > 0 && <SoExpCau exp={expBay} cheDo={cheDo} vaoThu="dong" />}
            </div>}
            <div className="bia-dau-cau"><b data-on={vai === 'on_lai' ? '' : undefined}>{vai === 'on_lai' ? 'CÂU ÔN' : 'CÂU MỚI'}</b><span>{moTa}</span></div>
            {cau.nhanNo && <p className="bia-nhan-no" data-khoi="nhan-no">{cau.nhanNo}</p>}
            <div className="dao2 bia-dao2">
              {!phanHoi
                ? <TheCauAi cau={cau} stt={viTri + 1} traLoi={traLoi} khoa={dang} onTraLoi={setTraLoi} />
                : <KhoiLoiGiai nguon="bi_a" cau={cau} stt={viTri + 1} phanHoi={phanHoiChoLoiGiai(phanHoi)} traLoiMay={traLoi} />}
            </div>
            {!phanHoi && <NutHoiThay key={cau.qid} qid={cau.qid} nguon="bi_a" gon onHoi={() => setTroGiup(true)} />}
            {!phanHoi && troGiup && <small className="bia-chu-nho">Có trợ giúp · câu này không tính EXP và sẽ quay lại để em tự làm.</small>}
            {loi && <p className="bia-loi" role="alert">{loi}</p>}
            {baoCau && !loi && !phanHoi && <p role="status">{baoCau}</p>}
            {!phanHoi
              ? <button type="button" className="bia-nut-vang" disabled={dang || !dayDu(cau.phan, traLoi)} onClick={() => void nop()}>{dang ? 'Đang chấm…' : dayDu(cau.phan, traLoi) ? 'Chốt đáp án' : cau.phan === 'I' ? 'Chọn một phương án' : cau.phan === 'II' ? 'Chọn đủ 4 ý' : 'Nhập đáp số'}</button>
              : <button type="button" className="bia-nut-vang" onClick={tiep}>{cuoiLuot ? 'Lấy thêm câu' : 'Câu tiếp theo'}</button>}
          </>}
        </div>
      </div>
    </div>
  )
}
