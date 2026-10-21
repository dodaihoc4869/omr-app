// Chỉ mở câu khi em bấm; /mo khôi phục phiên hoặc biên nhận đã nộp từ máy chủ.
// Không lưu đề/đáp án vào bộ nhớ bền; lần gửi lại dùng đúng mã và bài của lần gửi đầu.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, MessageCircleQuestion } from 'lucide-react'
import TheCau from '../TheCau'
import { guiThayKiemChung, moKiemChung, nopKiemChung, type CauKiemChung, type MoKiemChung, type NopKiemChung } from '../../lib/hoi-thay-kiem-chung-api'
import { docTokenHs } from '../../lib/loi-giai-api'
import { sinhMaNgauNhien } from '../../lib/thiet-bi'
import { ChemText } from '../../lib/chem-format'
import './hoi-thay-kiem-chung.css'

type BienNhan = Exclude<MoKiemChung, { trangThai: 'co_cau' }> | NopKiemChung
const NHAN = { cho_nguon: 'Đang chuẩn bị câu phù hợp', cho_kiem_lai: 'Đang chờ kiểm lại', da_xac_nhan: 'Đã xác nhận khắc phục', can_thay: 'Cần thầy hỗ trợ', da_tu_lam: 'Em đã tự làm được' } as const
const trangThaiHopLe = (v: unknown): v is keyof typeof NHAN => typeof v === 'string' && Object.prototype.hasOwnProperty.call(NHAN, v)
const CAN_KHOI_PHUC = new Set(['PHIEN_HET_HAN', 'CAU_THAY_DOI', 'KHONG_CO_PHIEN', 'DA_NOP', 'XUNG_DOT_ATTEMPT'])
function gioVn(luc?: string): string {
  const ngay = luc ? new Date(luc) : null
  return ngay && Number.isFinite(ngay.getTime()) ? ngay.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''
}
function dayDu(c: CauKiemChung, gia: string): boolean {
  return c.phan === 'I' ? /^[ABCD]$/.test(gia) : c.phan === 'II' ? /^[DS]{4}$/.test(gia) : gia.trim().length > 0
}
function TheKiem({ cau, gia, khoa, doi }: { cau: CauKiemChung; gia: string; khoa: boolean; doi: (gia: string) => void }) {
  const chung = { cheDo: 'thi' as const, stt: 1, tieuDe: 'Câu tương đương', text: cau.text, table: cau.table, hinhAnh: cau.hinhAnh, thanCauImg: cau.thanCauImg, imageDataUrl: cau.imageDataUrl }
  if (cau.phan === 'I') return <TheCau {...chung} phan="I" choices={cau.choices!} choiceImgs={cau.choiceImgs} choicePerm={[0, 1, 2, 3]} selected={gia ? gia as 'A' | 'B' | 'C' | 'D' : null} onSelect={khoa ? undefined : doi} />
  if (cau.phan === 'II') return <TheCau {...chung} phan="II" ideas={cau.ideas!} ideaImgs={cau.ideaImgs} selected={[0, 1, 2, 3].map((i) => gia[i] === 'D' || gia[i] === 'S' ? gia[i] as 'D' | 'S' : null)} onSelect={khoa ? undefined : (i, v) => { const ds = [...(gia || '____')]; ds[i] = v; doi(ds.join('')) }} />
  return <TheCau {...chung} phan="III" soO={(cau as { soO?: number }).soO} selected={gia} onChange={doi} khoaO={khoa} />
}
function cauHopLe(r: Extract<MoKiemChung, { trangThai: 'co_cau' }>): boolean {
  const c = r.cau
  return typeof r.phienId === 'string' && !!r.phienId && !!c && typeof c.text === 'string' && typeof c.qid === 'string' && !!c.qid &&
    (c.table === undefined || Array.isArray(c.table) && c.table.every((row) => Array.isArray(row) && row.every((s) => typeof s === 'string'))) &&
    (c.hinhAnh === undefined || Array.isArray(c.hinhAnh) && c.hinhAnh.every((h) => h && typeof h.src === 'string' && typeof h.viTri === 'string')) && (
    r.cau.phan === 'III' || r.cau.phan === 'I' && Array.isArray(r.cau.choices) && r.cau.choices.length === 4 && r.cau.choices.every((s) => typeof s === 'string') || r.cau.phan === 'II' && Array.isArray(r.cau.ideas) && r.cau.ideas.length === 4 && r.cau.ideas.every((s) => typeof s === 'string')
  )
}

type PropsKiem = { qid: string; token?: string; khoa?: boolean; tuMo?: boolean; onDangKiem?: (dang: boolean) => void }
export default function HoiThayKiemChung(props: PropsKiem) {
  return <PhienKiem key={JSON.stringify([props.qid, props.token])} {...props} />
}
function PhienKiem({ qid, token: tokenCuaPhien, khoa = false, tuMo = false, onDangKiem }: PropsKiem) {
  // Khoá theo qid ở nơi gọi; cờ sống còn chặn phản hồi về sau khi em đóng/đổi câu.
  const song = useRef(true)
  const dang = useRef(false)
  const guiLan = useRef<{ id: string; gia: string } | null>(null)
  const guiThayRef = useRef(false)
  const daTuMo = useRef(false)
  const [phien, setPhien] = useState<Extract<MoKiemChung, { trangThai: 'co_cau' }> | null>(null)
  const [gia, setGia] = useState('')
  const [bienNhan, setBienNhan] = useState<BienNhan | null>(null)
  const [cho, setCho] = useState<'mo' | 'nop' | ''>(tuMo ? 'mo' : '')
  const [loi, setLoi] = useState('')
  const [khoiPhuc, setKhoiPhuc] = useState(false)
  const [daThuMo, setDaThuMo] = useState(false)
  const [guiThay, setGuiThay] = useState<'chua' | 'dang' | 'xong'>('chua')
  const [loiGuiThay, setLoiGuiThay] = useState('')
  const [loiThay, setLoiThay] = useState('')
  useEffect(() => { song.current = true; return () => { song.current = false } }, [])
  const capNhatTienDo = () => {
    const token = tokenCuaPhien ?? docTokenHs()
    if (token) void import('../../lib/tu-sua-loi').then(({ taiTuSuaLoi }) => taiTuSuaLoi(token, { moi: true })).catch(() => { /* Kết quả đã lưu; mất mạng tải số không làm mất biên nhận. */ })
  }
  const mo = useCallback(async () => {
    if (dang.current || khoa) return
    dang.current = true; setCho('mo'); setLoi(''); setDaThuMo(true)
    const r = await moKiemChung(qid, tokenCuaPhien)
    if (!song.current) return
    dang.current = false; setCho('')
    if (!r.ok) { setLoi(r.error); return }
    setLoiThay(typeof r.loiThay === 'string' ? r.loiThay : '')
    if (r.trangThai === 'co_cau') {
      if (!cauHopLe(r)) { setLoi('Câu này chưa hiển thị đầy đủ. Em tải lại nhé.'); return }
      setPhien(r); setBienNhan(null); setGia(''); setKhoiPhuc(false); guiLan.current = null; onDangKiem?.(true)
    } else if (trangThaiHopLe(r.trangThai)) { setPhien(null); setBienNhan(r); setKhoiPhuc(false); onDangKiem?.(false) }
    else setLoi('Chưa nhận được trạng thái đầy đủ. Em tải lại nhé.')
  }, [qid, tokenCuaPhien, khoa, onDangKiem])
  // Đường Tự sửa lỗi mở thẳng từ hàng đã có phiên: không cần hỏi AI thêm,
  // không xem hướng dẫn lại, nên vẫn có thể tích luỹ bằng chứng độc lập.
  useEffect(() => {
    if (tuMo && !khoa && !daTuMo.current) { daTuMo.current = true; void mo() }
  }, [tuMo, khoa, mo])
  const nop = async () => {
    if (!phien || dang.current || khoa || khoiPhuc || !dayDu(phien.cau, gia)) return
    // Giữ nguyên cả bài làm khi mạng lỗi: không tạo lượt mới để vô tình thử nhiều đáp án.
    if (!guiLan.current) guiLan.current = { id: sinhMaNgauNhien(), gia }
    dang.current = true; setCho('nop'); setLoi('')
    const r = await nopKiemChung(phien.phienId, guiLan.current.id, guiLan.current.gia, tokenCuaPhien)
    if (!song.current) return
    dang.current = false; setCho('')
    if (!r.ok) { setLoi(r.error); setKhoiPhuc(CAN_KHOI_PHUC.has(r.ma)); return }
    if (!trangThaiHopLe(r.trangThai) || typeof r.dung !== 'boolean') { setLoi('Chưa nhận được xác nhận đầy đủ. Em gửi lại lần trả lời này nhé.'); return }
    setPhien(null); setBienNhan(r); onDangKiem?.(false); capNhatTienDo()
  }
  const canThay = async () => {
    if (guiThayRef.current || khoa) return
    guiThayRef.current = true
    setGuiThay('dang'); setLoiGuiThay('')
    const r = await guiThayKiemChung(qid, tokenCuaPhien)
    if (!song.current) return
    if (!r.ok) { guiThayRef.current = false; setGuiThay('chua'); setLoiGuiThay(r.error); return }
    setGuiThay('xong'); setLoi('')
    setPhien(null); setBienNhan({ ok: true, trangThai: 'can_thay', thongBao: r.thongBao }); onDangKiem?.(false); capNhatTienDo()
  }
  const denHan = bienNhan ? gioVn(bienNhan.denHan) : ''
  return (
    <section className="lg-kc" aria-label="Tự làm sau khi được hướng dẫn" aria-busy={!!cho}>
      <div className="lg-kc-dau"><span className="lg-kc-icon" aria-hidden="true"><Check size={18} /></span><div><h3>{tuMo ? 'Em tự kiểm lại' : 'Em tự làm lại'}</h3><p>{tuMo ? 'Tự làm câu kiểm lại theo lịch ôn của em.' : 'Thử một câu từ kho để kiểm lại điều em vừa hiểu.'}</p></div></div>
      {!phien && !bienNhan && <button type="button" className="lg-kc-mo" disabled={!!cho || khoa} onClick={() => void mo()}>{cho === 'mo' ? 'Đang chọn câu phù hợp…' : daThuMo ? 'Tải lại câu tương đương' : 'Tự làm một câu tương đương'}<ChevronRight size={18} aria-hidden="true" /></button>}
      {phien && <>
        <p className="lg-kc-nhac">Em tự làm câu này nhé. Lần trả lời đầu giúp chọn cách hỗ trợ tiếp theo.</p>
        <fieldset className="lg-kc-cau" disabled={!!cho || khoa || !!guiLan.current}><legend className="sr-only">Câu để em tự làm</legend><TheKiem cau={phien.cau} gia={gia} khoa={!!cho || khoa || !!guiLan.current} doi={setGia} /></fieldset>
        {khoiPhuc ? <button type="button" className="lg-kc-mo" onClick={() => void mo()} disabled={!!cho || khoa}>{cho === 'mo' ? 'Đang khôi phục…' : 'Khôi phục trạng thái đã lưu'}</button> : <button type="button" className="lg-kc-mo" onClick={() => void nop()} disabled={!!cho || khoa || !dayDu(phien.cau, gia)}>{cho === 'nop' ? 'Đang ghi nhận…' : guiLan.current ? 'Gửi lại lần trả lời này' : 'Nộp câu tự làm'}</button>}
        {guiLan.current && !cho && loi && <p className="lg-kc-chu">Bài trả lời được giữ nguyên để nhận lại kết quả, không tạo lượt làm mới.</p>}
      </>}
      {bienNhan && <div className="lg-kc-bien-nhan" role="status" data-can-thay={bienNhan.trangThai === 'can_thay' || undefined}><b>{NHAN[bienNhan.trangThai]}</b>{bienNhan.thongBao && <p>{bienNhan.thongBao}</p>}{denHan && <p>Lịch kiểm lại: {denHan} · giờ Việt Nam.</p>}{(bienNhan.trangThai === 'cho_kiem_lai' || bienNhan.trangThai === 'da_tu_lam') && <p>Lần ôn tiếp theo nằm trong kế hoạch học của em.</p>}{bienNhan.trangThai === 'cho_nguon' && <button type="button" className="lg-kc-phu" onClick={() => void mo()} disabled={!!cho || khoa}>{cho ? 'Đang tải…' : 'Kiểm tra lại nguồn câu'}</button>}</div>}
      {!phien && loiThay && <aside className="lg-kc-bien-nhan" aria-label="Thầy Đỗ Đại Học gửi em"><b>Thầy Đỗ Đại Học gửi em</b><p><ChemText text={loiThay} /></p></aside>}
      {loi && <p className="lg-ht-loi" role="alert">{loi}</p>}
      <div className="lg-kc-thay"><button type="button" className="lg-kc-phu" disabled={guiThay !== 'chua' || khoa || !!cho} onClick={() => void canThay()}><MessageCircleQuestion size={17} aria-hidden="true" />{guiThay === 'dang' ? 'Đang gửi thầy…' : guiThay === 'xong' ? 'Đã gửi thầy' : 'Cần thầy hỗ trợ'}</button>{loiGuiThay && <p className="lg-ht-loi" role="alert">{loiGuiThay}</p>}</div>
    </section>
  )
}
