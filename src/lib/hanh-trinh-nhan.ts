// Nhãn nội dung tùy chọn đi theo kho, không đưa cấu hình thuật toán vào màn học sinh.
export interface NhanKhoHanhTrinh {
  kyNangDich:string[]
  tienQuyet:{vkn:string;tang:1|2|3}[]
  loaiL4?:'chuyen_giao'|'tong_hop'|'lap_luan'
}
export function docNhanKhoHanhTrinh(v:unknown):NhanKhoHanhTrinh|undefined {
  if(!v||typeof v!=='object'||Array.isArray(v))return undefined
  const o=v as Record<string,unknown>
  if(!Array.isArray(o.kyNangDich)||!o.kyNangDich.length||o.kyNangDich.length>32||!o.kyNangDich.every(k=>typeof k==='string'&&k.length>0&&k.length<=160))return undefined
  if(!Array.isArray(o.tienQuyet)||o.tienQuyet.length>64||!o.tienQuyet.every(p=>p&&typeof p==='object'&&typeof p.vkn==='string'&&p.vkn.length>0&&p.vkn.length<=160&&[1,2,3].includes(p.tang)))return undefined
  const loai=['chuyen_giao','tong_hop','lap_luan'].includes(String(o.loaiL4))?o.loaiL4 as NhanKhoHanhTrinh['loaiL4']:undefined
  return {kyNangDich:[...new Set(o.kyNangDich as string[])],tienQuyet:(o.tienQuyet as NhanKhoHanhTrinh['tienQuyet']).map(p=>({vkn:p.vkn,tang:p.tang})),...(loai?{loaiL4:loai}:{})}
}
