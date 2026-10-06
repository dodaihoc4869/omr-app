// ĐẢO 2.0 · TRẠM HỒI PHỤC (OMNI 3, 05/10 — hợp đồng docs/hop-dong-omni-3.md mục A; chữ một nguồn src/lib/omni-chu.ts).
// 3 câu sai liền ⇒ máy chủ trả `omni.tram` kèm `answer`. Sau kết quả, thẻ thông báo kính SẴN CÓ của Đảo (`dao2-kinh dao2-het-tran`, cùng kiểu
// thẻ báo hết lượt) hiện tiêu đề "Trạm hồi phục" + câu máy chủ viết sẵn (`tram.chu`); có câu nền ⇒ nút "Làm 3 câu nền" mở ĐÚNG hộp câu nền của
// thang tự gỡ (`HopLuyenNen`, lệnh có sẵn `/hs/luyen-nen` với `nhan`). Đóng hộp (hoặc không có câu nền) ⇒ Đảo gọi `hoa2-omni-tram-xong`. Máu không đổi.
// Hộp câu nền vẽ qua cổng ra document.body (bọc vỏ màu `.m3`): thẻ kính có `backdrop-filter` nên không được làm khung cho lớp phủ cố định.
import {useState} from 'react'
import {createPortal} from 'react-dom'
import {HopLuyenNen} from '../../../components/loi-giai/ThanhThangGo'
import {NUT_LAM_CAU_NEN,TIEU_DE_TRAM} from '../../../lib/omni-chu'
import type {TramHoiPhuc} from '../../../../server/src/omni-kieu'

export {NUT_LAM_CAU_NEN} // nhãn nay ở omni-chu.ts (Đoàn dùng chung); giữ xuất lại cho nơi đang nhập từ đây
export interface TheTramProps{
 tram:TramHoiPhuc
 /** Câu em vừa sai (lệnh nộp câu nền ghi kèm). */
 qid:string
 /** Đảo đã gọi xong `hoa2-omni-tram-xong` ⇒ không còn nút. */
 xong:boolean
 /** Em làm xong / đóng hộp câu nền. */
 onXong:()=>void
}
export default function TheTram({tram,qid,xong,onXong}:TheTramProps){
 const [mo,setMo]=useState(false)
 return <div className="dao2-kinh dao2-het-tran" role="status" data-khoi="tram-hoi-phuc">
  <p><b>{TIEU_DE_TRAM}</b></p>
  <p>{tram.chu}</p>
  {/* nút PHỤ (viền) — nút chính của màn vẫn là nút sang ải sẵn có ngay dưới thẻ (luật C2: một nút chính mỗi khung) */}
  {tram.coCauNen&&tram.nhan&&!xong&&<button type="button" className="dao2-nut-vien" onClick={()=>setMo(true)}>{NUT_LAM_CAU_NEN}</button>}
  {mo&&tram.nhan&&typeof document!=='undefined'&&createPortal(<div className="m3" style={{display:'contents'}}><HopLuyenNen nhan={tram.nhan} ten={tram.tenLoi??tram.ten??''} qid={qid} onDong={()=>{setMo(false);onXong()}}/></div>,document.body)}
 </div>
}
