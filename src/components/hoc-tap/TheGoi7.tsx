import type { TomTatGoi7 } from '../../lib/goi-bai-7'
const hienNgay=(d:string)=>d.slice(8,10)+'/'+d.slice(5,7)
// Thầy 12/10: "Bỏ chỗ này đi" — bỏ khối Tự kiểm kiến thức (Tờ 1/2/3), dòng "Kiến thức bài trước … kỹ năng" và đoạn giải thích tiến độ khỏi màn em.
// Máy chủ (`goi-bai-7-kiem.ts`) giữ nguyên — điểm tự kiểm cũ vẫn còn trong sổ.
export default function TheGoi7({du}:{du:TomTatGoi7}) {
  return <section className="ht-the" aria-label="Bài học trong 7 ngày"><h2>Bài học trong 7 ngày</h2>
    {du.goi.map(g=><article className="ht-goi7" key={g.id}><h3>{g.ten}</h3>{g.nguonDayDu===false?<p role="status">Bộ bài đang chờ đủ nguồn của các tờ đã chọn. Chưa chốt tổng số câu hoặc xác nhận hoàn thành; em tiếp tục phần ôn đã sẵn sàng.</p>:<><p>Gặp câu gốc: <strong>{g.daGap}/{g.tong} câu</strong> · Hạn {hienNgay(g.han)}</p><progress aria-label={`Câu đã gặp trong ${g.ten}`} value={g.daGap} max={Math.max(1,g.tong)}/><p className="ht-chu-phu">Hôm nay đã gặp {g.gapHomNay} câu mới · lịch tối thiểu {g.quota} câu. Còn {g.con} câu trong bài.</p></>}
      {g.quaHan&&<p role="status">Đã qua hạn; phần chưa gặp vẫn được giữ để học tiếp và thầy hỗ trợ.</p>}{g.canBoSung>0&&<p>{g.canBoSung} câu đang chờ học liệu được duyệt.</p>}
    </article>)}
    {du.thieuNgay>0&&<p role="status">Còn thiếu {du.thieuNgay} câu phù hợp so với mức ngày. Hệ thống giữ lịch ôn và báo thầy bổ sung.</p>}
    {du.canHoTro&&<p role="status">Phần còn lại cần thêm hỗ trợ hoặc thời gian. Thầy có thể theo dõi để giúp em.</p>}
  </section>
}
