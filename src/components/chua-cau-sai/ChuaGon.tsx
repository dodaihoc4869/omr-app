// CHỮA CÂU GỌN (thầy 25/10: "đề xuất lại việc chữa câu đơn giản và hiệu quả nhất… để học sinh thấy được ghi nhận ngay khi sửa xong" → "BẠN SỬA THEO
// ĐỀ XUẤT LUÔN"; đặc tả docs/de-xuat-chua-cau-gon-2510.md). Thay ba lối cũ (sửa từng bước · ghép bài · gặp lại 2) bằng MỘT đường cho mọi câu:
//   làm lại (máy chủ chấm) → đúng lần 1 qua luật tự làm ⇒ "Em đã tự sửa xong câu này" NGAY · sai ⇒ một gợi ý ⇒ làm lại · sai nữa ⇒ đáp án + lời giải + Hỏi thầy.
// Máy em KHÔNG có đáp án trước khi nộp (lệnh gon-mo chỉ trả đề công khai); đáp án + lời giải về cùng kết quả nộp. Không EXP (thầy 20/10).
// "Xong phần hôm nay" (Việc hôm nay) ghi khi câu đã khép: đã tự sửa · đúng sau gợi ý / chưa qua luật tự làm · đã xem lời giải đầy đủ · không mở được câu.
// Chỉ lớp kiểu `ccs-*` sẵn có (chua-cau-sai.css) — không màu mới.
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import TheCau, { type TheCauProps } from '../TheCau'
import NutHoiThay from '../loi-giai/NutHoiThay'
import { docChiTiet } from '../hoa2/api'
import { propsTheCau } from '../hoa2/cau-chuyen'
import { propsCauLam } from './ChuaTrucTiep'
import { apiGonMo, apiGonNop, type KetQuaGon } from '../../lib/chua-cau-sai-api'
import { chuDapAn, daTraLoiDu, LUAT_BAN_MOI } from '../../lib/chua-truc-tiep'
import { ghiXongHomNay } from '../../lib/tu-sua-viec-hom-nay'
import { sinhMaNgauNhien } from '../../lib/thiet-bi'
import { phanHoi } from '../../lib/phan-hoi'
// «Trong» HS (thầy 27/10 «Phần sửa câu tôi chưa thấy giao diện của doligo»): cùng logic, cây trình bày kiểu Duolingo ở ChuaGonDuo.tsx.
// Mảnh RIÊNG nạp lười (máy tắt «Trong» không tải; ManChuaCauSai nạp trước lúc mở đợt ⇒ không thêm vòng chờ).
const ChuaGonDuo = lazy(() => import('./ChuaGonDuo'))
import { KhungDuoSua, type TienDoSua } from './KhungDuoSua'

export interface PropsChuaGon {
  token: string
  /** Câu gốc của đợt (Hỏi thầy). */
  qid: string
  dotId: string
  /** Kết quả gon-mo đã tải sẵn (ManChuaCauSai mở đợt rồi gọi luôn). */
  dau: KetQuaGon
  nhanVe: string
  onVe: () => void
  /** Sang câu kế của Việc hôm nay (vắng ⇒ nút chính là `onVe`). */
  onTiep?: () => void
  /** Chỗ của câu trong chặng sửa hôm nay (chỉ màn Duo vẽ: thanh tiến độ + màn xong chặng). */
  tienDo?: TienDoSua
}

/** Lời cho kết quả "xong phần" — vì sao lần đúng này CHƯA tính là đã tự sửa (nói thật, một câu). */
export const CHU_XONG_PHAN: Record<NonNullable<KetQuaGon['lyDo']>, string> = {
  co_goi_y: 'Em làm đúng sau gợi ý. Câu này sẽ gặp lại ở ngày khác; lúc ấy em tự làm đúng là đã tự sửa.',
  cung_ngay: 'Em vừa sai câu này hôm nay. Ngày khác em làm đúng lần nữa thì câu này tính là đã tự sửa.',
  doc_loi_giai: 'Em vừa xem lời giải câu này. Ngày khác em tự làm đúng thì câu này tính là đã tự sửa.',
}
const KHEP = new Set(['tu_sua', 'xong_phan', 'loi_giai'])

export default function ChuaGon({ token, qid, dotId, dau, nhanVe, onVe, onTiep, tienDo }: PropsChuaGon) {
  // Chỉ khi <html data-trong="hs"> lúc mở màn (đọc lúc vẽ — trang chụp gắn data-trong sau khi nạp mã); tắt «Trong» ⇒ màn y cũ.
  const [duo] = useState(() => typeof document !== 'undefined' && document.documentElement.dataset.trong === 'hs')
  const [mo, setMo] = useState<KetQuaGon>(dau)
  const [kq, setKq] = useState<KetQuaGon | null>(dau.daKhepHomNay ? dau : null)
  const [tra, setTra] = useState('')
  const [ban, setBan] = useState(false)
  const [loi, setLoi] = useState('')
  const [xemGiai, setXemGiai] = useState(false)
  /** Khoá chống lặp của LẦN nộp hiện tại: gửi lại sau lỗi mạng dùng đúng khoá cũ (máy chủ trả lại kết quả đã chấm). */
  const khoa = useRef('')
  const tieuDe = useRef<HTMLHeadingElement>(null)
  const song = useRef(true)
  useEffect(() => () => { song.current = false }, [])

  const daTuSua = mo.trangThai === 'da_tu_sua' || kq?.ket === 'tu_sua'
  // Câu đã khép (hoặc không mở được) ⇒ xong phần hôm nay của Việc hôm nay.
  const khep = daTuSua || (!!kq?.ket && KHEP.has(kq.ket)) || !mo.ok
  // Ghi theo cả mã đợt và mã câu: mục Việc hôm nay có thể mang mã đợt khác với đợt vừa mở (xem daXong) ⇒ thiếu mã câu là kẹt vòng.
  const ghiXong = () => { ghiXongHomNay(dotId); ghiXongHomNay(qid) }
  useEffect(() => { if (khep) ghiXong() }, [khep, dotId, qid]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (kq) tieuDe.current?.focus() }, [kq])

  const de = mo.de
  const phan = de?.phan ?? 'I'
  const ct = kq?.chiTiet ? docChiTiet(kq.chiTiet) : null
  const ve = onTiep ?? onVe
  const nhanTiep = onTiep ? 'Câu tiếp theo' : nhanVe

  const nop = async () => {
    if (!de || !mo.ban || ban || !daTraLoiDu(phan, tra)) return
    if (!khoa.current) khoa.current = sinhMaNgauNhien()
    setBan(true); setLoi('')
    const r = await apiGonNop(token, dotId, mo.ban, tra.trim(), khoa.current)
    if (!song.current) return
    setBan(false)
    if (!r.ok) {
      // Máy chủ đã từ chối hẳn (đổi bản / hết lần) ⇒ khoá mới cho lần sau; lỗi mạng ⇒ giữ khoá để gửi lại đúng lần này.
      if (r.ma) khoa.current = ''
      setLoi(r.loi ?? 'Chưa gửi được. Em bấm Kiểm tra lại nhé.')
      return
    }
    khoa.current = ''
    if (r.ket && KHEP.has(r.ket)) ghiXong() // ghi NGAY khi có kết quả (không chờ lượt vẽ sau)
    if (r.ket) phanHoi(r.ket === 'tu_sua' || r.ket === 'xong_phan' ? 'dung' : 'sai') // rung phản hồi (chỉ «Trong»)
    setKq(r)
  }
  const lamLai = async () => {
    setBan(true); setLoi('')
    const r = await apiGonMo(token, dotId)
    if (!song.current) return
    setBan(false)
    if (!r.ok) { setLoi(r.loi ?? 'Chưa mở lại được câu. Em thử lại nhé.'); return }
    setMo(r); setKq(r.daKhepHomNay ? r : null); setTra(''); setXemGiai(false)
    requestAnimationFrame(() => tieuDe.current?.focus())
  }

  if (duo) return (
    <Suspense fallback={<KhungDuoSua onVe={onVe} pct={tienDo ? Math.round((100 * Math.min(tienDo.xong, tienDo.tong)) / Math.max(1, tienDo.tong)) : 0} nhanThanh="Sửa câu này"><div className="ht2-lam-the ht2-lam-cho" role="status"><span className="chu-cho-tre">Đang mở câu…</span></div></KhungDuoSua>}>
    <ChuaGonDuo qid={qid} mo={mo} kq={kq} tra={tra} onTra={setTra} ban={ban} loi={loi} daTuSua={daTuSua} khep={khep} ct={ct}
      onNop={() => void nop()} onLamLai={() => void lamLai()} onVe={onVe} onTiep={ve} nhanTiep={nhanTiep} tienDo={tienDo}
      chuXongPhan={kq?.lyDo ? CHU_XONG_PHAN[kq.lyDo] : ''} />
    </Suspense>
  )

  const khung = (p: TheCauProps, lop = '') => <div className={`m3 ccs-cau-goc-the${lop ? ` ${lop}` : ''}`}><TheCau {...p} /></div>
  const loiGiai = ct ? (
    <>
      <dl className="ccs-doi-chieu">
        <div data-kieu="dung"><dt>Đáp án đúng</dt><dd>{chuDapAn(ct.de.phan, ct.dapAn)}</dd></div>
        {kq?.ket !== 'loi_giai' ? null : tra ? <div data-kieu="em"><dt>Lần em làm lại</dt><dd>{chuDapAn(phan, tra)}</dd></div> : null}
      </dl>
      {khung({ ...propsTheCau(ct, 1), hoiThay: { qid, nguon: 'tu_chua' } })}
    </>
  ) : null

  // ---- nội dung theo trạng thái
  let than: ReactNode
  let nutChinh: ReactNode = null
  let nutPhu: ReactNode = <button type="button" className="ccs-nut-phu" onClick={onVe} disabled={ban}>{nhanVe}</button>
  if (!mo.ok) {
    than = (
      <section className="ccs-trang-thai" data-trang-thai="khong_mo">
        <h2 ref={tieuDe} tabIndex={-1}>Chưa mở được câu này ở đây</h2>
        <p>{mo.loi}</p>
        <NutHoiThay qid={qid} nguon="tu_chua" />
      </section>
    )
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={ve}>{nhanTiep}</button>
    nutPhu = null
  } else if (mo.trangThai === 'da_tu_sua' && !kq) {
    than = (
      <section className="ccs-phan-hoi" data-dung="true" role="status">
        <h2 ref={tieuDe} tabIndex={-1}>Em đã tự sửa xong câu này</h2>
      </section>
    )
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={ve}>{nhanTiep}</button>
    nutPhu = null
  } else if (kq?.ket === 'tu_sua') {
    than = (
      <>
        <section className="ccs-phan-hoi" data-dung="true" role="status" aria-live="polite">
          <h2 ref={tieuDe} tabIndex={-1}>Em đã tự sửa xong câu này</h2>
          <p>Đúng ngay lần đầu, không cần gợi ý.{kq.nguyenTu ? <> <b>+{kq.nguyenTu} nguyên tử</b></> : null}</p>
        </section>
        {xemGiai ? loiGiai : null}
      </>
    )
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={ve}>{nhanTiep}</button>
    nutPhu = xemGiai || !ct ? <button type="button" className="ccs-nut-phu" onClick={onVe}>{nhanVe}</button>
      : <button type="button" className="ccs-nut-phu" onClick={() => setXemGiai(true)}>Xem lời giải</button>
  } else if (kq?.ket === 'xong_phan') {
    than = (
      <>
        <section className="ccs-phan-hoi" data-dung="true" role="status" aria-live="polite">
          <h2 ref={tieuDe} tabIndex={-1}>Đúng rồi · xong phần hôm nay</h2>
          {kq.lyDo && <p>{CHU_XONG_PHAN[kq.lyDo]}</p>}
        </section>
        {loiGiai}
      </>
    )
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={ve}>{nhanTiep}</button>
  } else if (kq?.ket === 'loi_giai') {
    than = (
      <>
        <section className="ccs-phan-hoi" data-dung="false" role="status" aria-live="polite">
          <h2 ref={tieuDe} tabIndex={-1}>Chưa đúng · xem đáp án và lời giải</h2>
          <p>Câu này sẽ gặp lại ở ngày khác. Chỗ nào chưa hiểu, em bấm Hỏi thầy.</p>
        </section>
        {loiGiai}
      </>
    )
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={ve}>{nhanTiep}</button>
  } else if (kq?.ket === 'goi_y') {
    than = (
      <>
        <section className="ccs-phan-hoi" data-dung="false" role="status" aria-live="polite">
          <h2 ref={tieuDe} tabIndex={-1}>Chưa đúng · em thử thêm một lần</h2>
        </section>
        {kq.goiY && <aside className="ccs-goi-y"><strong>Gợi ý</strong><p>{kq.goiY}</p></aside>}
      </>
    )
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={() => void lamLai()} disabled={ban}>Làm lại câu này</button>
  } else if (de) {
    than = (
      <>
        <div className="ccs-buoc-truc-tiep">
          <p className="ccs-ghi">{mo.banKhac ? 'Bản mới của câu em đã sai' : 'Câu em đã sai'}{(mo.lan ?? 1) > 1 ? ' · lần 2' : ''}</p>
          <h2 className="ccs-buoc-ten" ref={tieuDe} tabIndex={-1}>Em tự làm lại câu này</h2>
        </div>
        {(mo.lan ?? 1) === 1 && <p className="ccs-luat">{mo.tuSuaNeuDung ? LUAT_BAN_MOI : 'Em vừa sai câu này hôm nay: làm đúng bây giờ tính xong phần hôm nay. Ngày khác tự làm đúng mới tính là đã tự sửa.'}</p>}
        {khung({ ...propsCauLam(de, tra, (v) => { phanHoi('chon'); setTra(v) }, ban), hoiThay: { qid, nguon: 'tu_chua' } })}
      </>
    )
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={() => void nop()} disabled={ban || !daTraLoiDu(phan, tra)}>{ban ? 'Đang chấm…' : 'Kiểm tra'}</button>
  }

  return (
    <div className="ccs-bo-cuc" data-tuyen="gon">
      <section className="ccs-khu-lam" aria-label="Sửa câu sai">
        {loi && <div className="ccs-loi" role="alert"><p>{loi}</p></div>}
        {than}
        <div className="ccs-hang-nut ccs-day">
          {nutChinh}
          {nutPhu}
        </div>
      </section>
    </div>
  )
}
