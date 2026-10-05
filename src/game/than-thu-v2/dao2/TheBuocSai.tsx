// ĐẢO 2.0 · THẺ "EM BIẾT CÂU NÀY. SAI VÌ BƯỚC NÀO?" (CHƯƠNG TRÌNH CẨN THẬN, đặc tả DAC-TA-BUILD-OMNI-3-0510.md mục 4.6(c); thầy 06/10 "Làm nốt đi tất cả").
// Chỉ hiện khi máy chủ báo `canThan` ∧ lượt vừa rồi là CHẮC-MÀ-SAI ở câu em đã vững (omni.buocSai): em chạm MỘT bước của câu (tên bước, không mã nội bộ) hoặc "Em chưa rõ"
// ⇒ máy chủ ghi sổ riêng `omni_buoc_sai` (KHÔNG chấm, KHÔNG đổi điểm/EXP/Máu). Thẻ kính SẴN CÓ của Đảo (`dao2-kinh dao2-het-tran`, cùng kiểu thẻ Trạm hồi phục) + nút viền
// `dao2-nut-vien` — không màu mới. Chữ một nguồn src/lib/omni-chu.ts. Nút chính của màn vẫn là nút sang ải ngay dưới (luật C2: một nút chính mỗi khung).
import {useState} from 'react'
import {CHU_DA_GHI_BUOC_SAI,CHU_LOI_GHI_BUOC_SAI,NUT_EM_CHUA_RO,TIEU_DE_BUOC_SAI} from '../../../lib/omni-chu'
import type {LuaChonBuocSai} from '../../../../server/src/omni-kieu'

/** Mã máy chủ quy ước cho nút "Em chưa rõ" (server/src/omni-can-than.ts `MA_EM_CHUA_RO`). */
export const MA_CHUA_RO='chua_ro'
export interface TheBuocSaiProps{
 lua:readonly LuaChonBuocSai[]
 /** Ghi lựa chọn (mã bước, hoặc `chua_ro`). NÉM khi máy chủ từ chối / mất mạng ⇒ thẻ báo lỗi nhỏ và cho chạm lại. */
 onChon:(ma:string)=>Promise<void>
}
export default function TheBuocSai({lua,onChon}:TheBuocSaiProps){
 const [chon,setChon]=useState<string|null>(null),[dang,setDang]=useState(false),[loi,setLoi]=useState(false)
 const bam=async(ma:string)=>{if(dang||chon)return;setDang(true);setLoi(false)
  try{await onChon(ma);setChon(ma)}catch{setLoi(true)}finally{setDang(false)}}
 const nut=[...lua.map(l=>({ma:l.ma,ten:l.ten})),{ma:MA_CHUA_RO,ten:NUT_EM_CHUA_RO}]
 return <div className="dao2-kinh dao2-het-tran" role="group" aria-label={TIEU_DE_BUOC_SAI} data-khoi="buoc-sai">
  <p><b>{TIEU_DE_BUOC_SAI}</b></p>
  <div className="dao2-buoc-sai">{nut.map(n=><button key={n.ma} type="button" className="dao2-nut-vien" data-ma={n.ma} aria-pressed={chon===n.ma} disabled={dang||!!chon} onClick={()=>void bam(n.ma)}>{n.ten}</button>)}</div>
  {chon&&<p role="status" data-khoi="buoc-sai-da-ghi">{CHU_DA_GHI_BUOC_SAI}</p>}
  {loi&&<p role="alert">{CHU_LOI_GHI_BUOC_SAI}</p>}
 </div>
}
