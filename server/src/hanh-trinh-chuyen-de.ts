// Bản đồ chuyên đề do thầy cung cấp. Quan hệ cấp chương chỉ hỗ trợ, không khóa toàn chương.
export const TIEN_QUYET_CHUYEN_DE: Readonly<Record<string,readonly string[]>> = {
  NGUYEN_TU:[],BANG_TUAN_HOAN:['NGUYEN_TU'],LIEN_KET:['NGUYEN_TU','BANG_TUAN_HOAN'],
  OXI_HOA_KHU:['NGUYEN_TU','LIEN_KET'],NANG_LUONG_HH:['LIEN_KET','OXI_HOA_KHU'],
  TOC_DO:['OXI_HOA_KHU','NANG_LUONG_HH'],HALOGEN:['BANG_TUAN_HOAN','LIEN_KET','OXI_HOA_KHU'],
  NITROGEN_SULFUR:['HALOGEN','BANG_TUAN_HOAN','OXI_HOA_KHU'],CAN_BANG:['TOC_DO'],HUU_CO_DAI_CUONG:['LIEN_KET'],
  HYDROCARBON:['HUU_CO_DAI_CUONG'],ALCOHOL_PHENOL:['HYDROCARBON'],CARBONYL_ACID:['ALCOHOL_PHENOL'],
  ESTER:['CARBONYL_ACID','ALCOHOL_PHENOL'],CARBOHYDRATE:['ALCOHOL_PHENOL','CARBONYL_ACID'],
  HOP_CHAT_N:['CARBONYL_ACID','HYDROCARBON'],POLYMER:['HYDROCARBON','HUU_CO_DAI_CUONG'],
  KIM_LOAI:['OXI_HOA_KHU','BANG_TUAN_HOAN','LIEN_KET'],KIM_LOAI_IA_IIA:['KIM_LOAI'],
  DIEN_PHAN:['KIM_LOAI','OXI_HOA_KHU'],PHUC_CHAT:['KIM_LOAI','DIEN_PHAN'],
}
export function chuyenDeTuDang(dang:string|null):string|null {
  const s=(dang??'').replace(/^dang:/,'').split('.')[0]!.toUpperCase()
  return Object.hasOwn(TIEN_QUYET_CHUYEN_DE,s)?s:null
}
export const CANH_CHUYEN_DE=Object.entries(TIEN_QUYET_CHUYEN_DE).flatMap(([den,ds])=>ds.map(tu=>({tu,den,loai:'ho_tro' as const,nguon:'chuong_trinh_thay' as const})))
export function kiemDoThiChuyenDe():boolean {
  const done=new Set<string>(),path=new Set<string>()
  const visit=(n:string):boolean=>{if(path.has(n)||!Object.hasOwn(TIEN_QUYET_CHUYEN_DE,n))return false;if(done.has(n))return true;path.add(n);for(const p of TIEN_QUYET_CHUYEN_DE[n]!)if(!visit(p))return false;path.delete(n);done.add(n);return true}
  return Object.keys(TIEN_QUYET_CHUYEN_DE).every(visit)
}
