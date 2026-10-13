import { ArrowRight, CalendarCheck, CheckCheck, Clock3 } from 'lucide-react'
import type { TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import { gioKiemTra } from '../../lib/kiem-tra-ca-nhan'
import './kiem-tra-ca-nhan.css'
export default function TheKiemTraCaNhan({du,onMo,disabled=false}:{du:TomTatKiemTra;onMo?:()=>void;disabled?:boolean}) {
 const xong=du.nopLuc!==null
 return <section className="ktcn-the" aria-label="Kiểm tra theo lịch riêng" data-hom-nay={du.homNay}>
  <div className="ktcn-dau"><span className="ktcn-bieu-tuong" aria-hidden="true">{xong?<CheckCheck size={24}/>:<CalendarCheck size={24}/>}</span><div><p className="ktcn-nhan">{du.homNay?'Việc của em hôm nay':'Lịch dành riêng cho em'}</p><h2>Kiểm tra ôn tập</h2></div></div>
  <p className="ktcn-ly-do">{du.lyDo}</p>
  {du.trangThai==='cho_nguon'?<p role="status">Thầy đang bổ sung nguồn để kiểm tra đủ kiến thức. Em tiếp tục lịch học thường.</p>:<>
   <div className="ktcn-so"><span><strong>{du.tong}</strong><small>câu kiểm tra</small></span><span><strong>{du.phut}</strong><small>phút làm bài</small></span><span><strong>{du.soBai}</strong><small>bài đã học</small></span></div>
   <p className="ktcn-han"><Clock3 size={16} aria-hidden="true"/>{du.homNay?`Hạn nộp ${gioKiemTra(du.hanLuc)}`:`Mở ${gioKiemTra(du.moLuc)} · hoàn thành trong 24 giờ`}</p>
   {du.homNay&&<><progress value={du.daTra} max={Math.max(1,du.tong)} aria-label="Câu đã trả lời trong bài kiểm tra"/><p className="ktcn-tien-do">{du.daTra}/{du.tong} câu đã trả lời · {du.soChang} chặng</p><p className="ktcn-chu-phu">{du.baiNgayToiThieu?'Hôm nay có thêm kế hoạch học nhẹ: tối thiểu 12 câu, giữ tiến độ bài mới.':xong?'Bài đã nộp. Bài tập tiếp tục vào ngày học kế tiếp.':'Hôm nay em chỉ cần làm bài kiểm tra này.'}</p></>}
   {xong&&du.diem!==null&&<p className="ktcn-diem">Điểm lần này <strong>{du.diem}/10</strong></p>}
   {onMo&&<button type="button" className={du.homNay?'ht-nut-chinh':'ht-nut-phu'} disabled={disabled} onClick={onMo}>{xong?'Xem kết quả':du.homNay?'Làm bài kiểm tra':'Xem lịch kiểm tra'}<ArrowRight size={18} aria-hidden="true"/></button>}
  </>}
 </section>
}
