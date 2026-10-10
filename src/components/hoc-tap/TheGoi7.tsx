import type { TomTatGoi7 } from '../../lib/goi-bai-7'
const hienNgay=(d:string)=>d.slice(8,10)+'/'+d.slice(5,7)
export default function TheGoi7({du,onKiem}:{du:TomTatGoi7;onKiem?:(goiId:string,maDe:string)=>void}) {
  return <section className="ht-the" aria-label="Bài học trong 7 ngày"><h2>Bài học trong 7 ngày</h2>
    {du.goi.map(g=><article className="ht-goi7" key={g.id}><h3>{g.ten}</h3><p>Gặp câu gốc: <strong>{g.daGap}/{g.tong} câu</strong> · Hạn {hienNgay(g.han)}</p><progress aria-label={`Câu đã gặp trong ${g.ten}`} value={g.daGap} max={Math.max(1,g.tong)}/><p className="ht-chu-phu">Hôm nay đã gặp {g.gapHomNay}/{g.quota} câu mới theo lịch. Còn {g.con} câu trong bài.</p>
      {g.quaHan&&<p role="status">Đã qua hạn; phần chưa gặp vẫn được giữ để học tiếp và thầy hỗ trợ.</p>}{g.canBoSung>0&&<p>{g.canBoSung} câu đang chờ học liệu được duyệt.</p>}
      {onKiem&&<details><summary>Tự kiểm kiến thức · mục tiêu 7/10 điểm</summary><p className="ht-chu-phu">Tự làm cả tờ, không mở phần chữa trong lúc làm. Nếu vừa xem chữa, em quay lại sau ít nhất 12 giờ.</p>{g.to.map((ma,i)=>{const d=du.diemDaDo.find(d=>d.goiId===g.id&&d.maDe===ma);return <div className="ht-goi7-kiem" key={ma}><span>Tờ {i+1}: {d?`${d.diem.toFixed(2)}/10 điểm · ${d.cauMoi}/${d.tong} câu biến thể`:'Chưa có điểm tự kiểm'}</span><button className="ht-nut-phu" onClick={()=>onKiem(g.id,ma)}>Tự kiểm tờ {i+1}</button></div>})}</details>}
    </article>)}
    <p>Kiến thức bài trước: {du.kienThucCu.tong?`${du.kienThucCu.dat}/${du.kienThucCu.tong} kỹ năng đã đạt (${du.kienThucCu.tyLe}%) · mục tiêu 80%`:'Chưa có đủ bản đồ kỹ năng để đo mức 80%.'}</p>
    <p className="ht-chu-phu">Đã gặp câu, đã đọc chữa và tự làm được là các tiến độ khác nhau. Đọc chữa không đồng nghĩa đã hiểu chắc.</p>
    {du.thieuNgay>0&&<p role="status">Còn thiếu {du.thieuNgay} câu phù hợp so với mức ngày. Hệ thống giữ lịch ôn và báo thầy bổ sung.</p>}
    {du.canHoTro&&<p role="status">Phần còn lại cần thêm hỗ trợ hoặc thời gian. Thầy có thể theo dõi để giúp em.</p>}
  </section>
}
