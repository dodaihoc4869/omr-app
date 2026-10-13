import type { TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import { gioVn, ngayNganVn } from '../../lib/ph-moi/dinh-dang'
export default function TheKiemTraCon({ kt }: { kt: TomTatKiemTra }) {
  return (
    <section className="tvc-the" aria-labelledby="ph3-kiemtra">
      <header className="tvc-dau">
        <div>
          <span>Lịch riêng của con · Kiểm tra ôn tập</span>
          <h2 id="ph3-kiemtra">{kt.nopLuc !== null ? 'Con đã nộp bài kiểm tra' : kt.homNay ? 'Hôm nay con làm bài kiểm tra' : 'Lịch kiểm tra sắp tới của con'}</h2>
        </div>
      </header>
      <p className="tvc-hn-so"><b>{kt.homNay ? kt.daTra : kt.tong}</b><span>{kt.homNay ? `/${kt.tong} câu đã trả lời` : ' câu kiểm tra'}</span></p>
      <p className="tvc-phu">{kt.phut} phút làm bài · {kt.soBai} bài đã học</p>
      <p className="tvc-hop">{kt.homNay ? `Hạn nộp ${gioVn(kt.hanLuc)} ${ngayNganVn(kt.hanLuc)}. Hôm nay không giao thêm bài tập ngày.` : `Mở ${gioVn(kt.moLuc)} ${ngayNganVn(kt.moLuc)} · hoàn thành trong 24 giờ.`}</p>
      {kt.diem !== null && <p className="tvc-phu">Điểm lần này: {kt.diem}/10. Kết quả nhớ lâu được kiểm chứng tiếp.</p>}
    </section>
  )
}
