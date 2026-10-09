// L4 được chia theo mục đích học; không tạo nhãn chuyển giao chỉ từ số sao.
import type { QCau } from './omni-kieu'
import type { NhanHanhTrinh,VaiTroCau } from './hanh-trinh-v5-loi'
import { vknCaCau } from './omni-p-vkn'
export function vaiTroL4(q:QCau,nhan:NhanHanhTrinh|null,moi:boolean,daHocBaiKhac:boolean):VaiTroCau {
  if(nhan?.loaiL4)return nhan.loaiL4
  if(vknCaCau(q).filter(k=>!k.startsWith('nen:')).length>=2)return 'tong_hop'
  if(moi&&daHocBaiKhac)return 'chuyen_giao'
  return 'hoc_moi'
}
/** 36 câu gồm các mục đích, không 36 bài tổng hợp. Thiếu mục thì bù từ câu hợp lệ đã xếp. */
export function canBangL4(ids:readonly string[],vai:Readonly<Record<string,VaiTroCau>>,soCon:number):string[] {
  const ds=[...new Set(ids)],used=new Set<string>(),out:string[]=[]
  const take=(roles:VaiTroCau[],n:number)=>{for(const id of ds){if(out.length>=soCon||n<=0)break;if(!used.has(id)&&roles.includes(vai[id]!)){used.add(id);out.push(id);n--}}}
  // Một chặng sửa/ôn, hai chuyển giao, hai tổng hợp/lập luận, một kiểm. Tỉ lệ giảm theo phần ngày còn lại.
  const n=(x:number)=>Math.floor(soCon*x/36)
  take(['on_sua'],n(6));take(['chuyen_giao'],n(12));take(['tong_hop','lap_luan'],n(12));take(['kiem_doc_lap'],n(6))
  for(const id of ds)if(out.length<soCon&&!used.has(id)){used.add(id);out.push(id)}
  // Đan xen mục đích trong chặng; chặng kiểm để cuối, không lẫn phản hồi học trước lúc kiểm.
  const lanes: string[][]=[out.filter(id=>vai[id]==='on_sua'),out.filter(id=>vai[id]==='chuyen_giao'),out.filter(id=>vai[id]==='tong_hop'||vai[id]==='lap_luan'),out.filter(id=>!['on_sua','chuyen_giao','tong_hop','lap_luan','kiem_doc_lap'].includes(vai[id]??''))]
  const mixed:string[]=[];for(let i=0;lanes.some(l=>i<l.length);i++)for(const l of lanes)if(l[i])mixed.push(l[i]!)
  return [...mixed,...out.filter(id=>vai[id]==='kiem_doc_lap')]
}
