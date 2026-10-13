import { ArrowRight, CalendarDays, Route, Timer } from 'lucide-react'
import type { TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import BieuTuongKiemTra from './BieuTuongKiemTra'
import { diemChu, gioHan, gioVn, soNgayToi, thuNgan, thuNgay } from './kiem-tra-chu'
import './kiem-tra-ca-nhan.css'

// ĐỢT 20 · THẺ KIỂM TRA ÔN TẬP (bản vẽ docs/ban-ve-dot20 thầy duyệt 13/10: "Chốt bản vẽ làm đi nhé"). Năm trạng thái thật của máy chủ:
//   cho_nguon → thẻ MỎNG vàng dịu (em vẫn học như thường) · sap_den → tờ lịch + 3 ô số, không đếm ngược từng giây ·
//   can_lam → thẻ CHÍNH thay khối Hôm nay: vòng "đã trả lời", 3 dòng số, MỘT nút · da_nop / het_han → điểm lớn + Xem kết quả.
// Chỉ số có trong TomTatKiemTra (không bịa "câu đúng" khi máy chủ chưa gửi). Máy tính: thẻ chính 2 cột theo vùng lưới (CSS).

function Vong({ da, tong }: { da: number; tong: number }) {
  const c = 2 * Math.PI * 42, ti = tong > 0 ? Math.min(1, da / tong) : 0
  return <div className="ktcn-vong" role="img" aria-label={`Đã trả lời ${da} trên ${tong} câu`}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ktcn-vong-nen" cx="50" cy="50" r="42" /><circle className="ktcn-vong-cung" cx="50" cy="50" r="42" strokeDasharray={`${ti * c} ${c}`} /></svg>
    <span><b>{da}/{tong}</b><small>đã trả lời</small></span>
  </div>
}

export default function TheKiemTraCaNhan({ du, onMo, disabled = false }: { du: TomTatKiemTra; onMo?: () => void; disabled?: boolean }) {
  const xong = du.nopLuc !== null
  const nhan = du.homNay ? 'Việc của em hôm nay' : 'Lịch dành riêng cho em'

  if (du.trangThai === 'cho_nguon') {
    const co = du.tongKienThuc > 0
    return <section className="ktcn-the ktcn-mong" aria-label="Kiểm tra theo lịch riêng" data-trang-thai="cho_nguon">
      <div className="ktcn-dau"><span className="ktcn-hinh"><BieuTuongKiemTra hinh="cho" /></span><div className="ktcn-chu">
        <p className="ktcn-nhan" data-sac="vang">Lịch dành riêng cho em</p>
        <h2>Kiểm tra ôn tập <span className="ktcn-chip" data-sac="vang">Đang chuẩn bị</span></h2>
        <p className="ktcn-ly-do" role="status">Thầy Đỗ Đại Học đang chuẩn bị thêm câu để bài kiểm tra phủ đủ kiến thức em đã học. Em cứ học như thường — đủ câu là ngày kiểm tra hiện ở đây.</p>
      </div></div>
      {co && <div className="ktcn-thanh-dong"><div className="ktcn-thanh-nhan"><span>Phần kiến thức đã có câu kiểm tra</span><b>{du.phuDe}/{du.tongKienThuc}</b></div>
        <div className="ktcn-vach" role="img" aria-label={`${du.phuDe} trên ${du.tongKienThuc} phần kiến thức đã có câu`}><span style={{ width: `${Math.round(100 * du.phuDe / du.tongKienThuc)}%` }} /></div></div>}
    </section>
  }

  if (!xong && !du.homNay) {
    const con = soNgayToi(du.ngay, du.serverNow)
    return <section className="ktcn-the" aria-label="Kiểm tra theo lịch riêng" data-trang-thai={du.trangThai}>
      <div className="ktcn-dau"><div className="ktcn-to-lich" aria-hidden="true"><i>{thuNgan(du.ngay)}</i><b>{Number(du.ngay.slice(8))}</b><small>Tháng {Number(du.ngay.slice(5, 7))}</small></div><div className="ktcn-chu">
        <p className="ktcn-nhan">{nhan}</p>
        <h2>Kiểm tra ôn tập</h2>
        <p className="ktcn-ly-do"><b>{thuNgay(du.ngay)}</b>{con > 0 ? ` · còn ${con} ngày` : ''}<br />Mở {gioVn(du.moLuc)} · hoàn thành trong 24 giờ</p>
      </div></div>
      <div className="ktcn-o-so"><div><b>{du.tong}</b><small>câu</small></div><div><b>{du.phut}</b><small>phút</small></div><div><b>{du.soBai}</b><small>bài đã học</small></div></div>
      <p className="ktcn-loi">Đề chọn riêng cho em từ các bài đã học. Ngày đó không có bài tập thường.</p>
      {onMo && <button type="button" className="ktcn-nut-phu" disabled={disabled} onClick={onMo}>Xem lịch kiểm tra<ArrowRight size={18} aria-hidden="true" /></button>}
    </section>
  }

  if (xong || du.trangThai === 'het_han') {
    const het = du.trangThai === 'het_han'
    return <section className="ktcn-the" data-chinh={het ? undefined : ''} aria-label="Kiểm tra theo lịch riêng" data-trang-thai={du.trangThai}>
      <div className="ktcn-dau"><span className="ktcn-hinh"><BieuTuongKiemTra hinh={het ? 'het' : 'xong'} /></span><div className="ktcn-chu">
        <p className="ktcn-nhan" data-sac={het ? 'xam' : undefined}>{nhan}</p>
        <h2>Kiểm tra ôn tập <span className="ktcn-chip" data-sac={het ? 'xam' : 'xanh'}>{het ? 'Đã hết hạn' : 'Đã nộp'}</span></h2>
        <p className="ktcn-ly-do">{het
          ? <>Hạn nộp {gioHan(du.hanLuc, du.ngay)} · {thuNgay(du.ngay)} đã qua. App đã tự chốt các câu em đã lưu.</>
          : <>Nộp lúc {gioVn(du.nopLuc!)} · {thuNgay(du.ngay)}</>}</p>
      </div></div>
      <div className="ktcn-than ktcn-than-diem">
        {du.diem !== null ? <div><small>Điểm lần này</small><p className="ktcn-diem"><b>{diemChu(du.diem)}</b><span>/10</span></p></div> : <div><small>Điểm lần này</small><p className="ktcn-diem"><span>Đang chấm</span></p></div>}
        <p className="ktcn-tra"><b>{du.daTra}/{du.tong}</b> câu đã trả lời</p>
      </div>
      {!het && <p className="ktcn-loi">Bài đã nộp. Bài tập tiếp tục vào ngày học kế tiếp.</p>}
      {onMo && <button type="button" className={het ? 'ktcn-nut-phu' : 'ktcn-nut-chinh'} disabled={disabled} onClick={onMo}>Xem kết quả<ArrowRight size={20} aria-hidden="true" /></button>}
    </section>
  }

  // can_lam: ngày kiểm tra, chưa nộp — thẻ CHÍNH thay khối Hôm nay.
  return <section className="ktcn-the" data-chinh="" aria-label="Kiểm tra theo lịch riêng" data-trang-thai={du.trangThai}>
    <div className="ktcn-dau"><span className="ktcn-hinh"><BieuTuongKiemTra hinh="lam" /></span><div className="ktcn-chu">
      <p className="ktcn-nhan">{nhan}</p>
      <h2>Kiểm tra ôn tập</h2>
      {du.lyDo && <p className="ktcn-ly-do">{du.lyDo}</p>}
    </div></div>
    <div className="ktcn-than">
      <Vong da={du.daTra} tong={du.tong} />
      <ul className="ktcn-dong-so">
        <li><Route size={20} aria-hidden="true" /><span><b>{du.soChang} chặng</b></span></li>
        <li><Timer size={20} aria-hidden="true" /><span>Khoảng <b>{du.phut} phút</b></span></li>
        <li><CalendarDays size={20} aria-hidden="true" /><span>Hạn nộp <b>{gioHan(du.hanLuc, du.ngay)}</b></span></li>
      </ul>
    </div>
    <div className="ktcn-loi"><p>Hôm nay em chỉ cần làm bài kiểm tra này.</p><p>Đồng hồ mỗi chặng chỉ chạy khi em bấm vào chặng đó.</p></div>
    {onMo && <button type="button" className="ktcn-nut-chinh" disabled={disabled} onClick={onMo}>{du.daTra > 0 ? `Làm tiếp · còn ${du.con} câu` : 'Làm bài kiểm tra'}<ArrowRight size={20} aria-hidden="true" /></button>}
  </section>
}
