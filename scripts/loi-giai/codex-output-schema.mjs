const chuoi={type:'string',minLength:1,maxLength:20000}
const chuoiRong={type:'string',maxLength:20000}
const mangChuoi={type:'array',maxItems:80,items:chuoi}
const mangChuoiRong={type:'array',maxItems:80,items:chuoiRong}

const luaChon={
  type:'object',additionalProperties:false,required:['ky','noi'],
  properties:{ky:{type:'string',enum:['A','B','C','D','E','F']},noi:chuoi},
}
const hinhAnh={
  type:'object',additionalProperties:false,required:['src','viTri','alt'],
  properties:{
    src:chuoi,alt:chuoi,
    viTri:{type:'string',enum:['sau_de','sau_pa_A','sau_pa_B','sau_pa_C','sau_pa_D','sau_y_a','sau_y_b','sau_y_c','sau_y_d','cuoi_cau']},
  },
}
const noiDung={
  type:'object',additionalProperties:false,
  required:['hoi','kieu','dapAn','luaChon','donVi','bang','y','hinhAnh'],
  properties:{
    hoi:chuoi,kieu:{type:'string',enum:['so','chon','chon_ly_do','ds']},dapAn:chuoi,
    luaChon:{type:'array',maxItems:6,items:luaChon},donVi:chuoiRong,
    bang:{type:'array',maxItems:100,items:{type:'array',maxItems:80,items:chuoiRong}},
    y:mangChuoiRong,hinhAnh:{type:'array',maxItems:8,items:hinhAnh},
  },
}
const probe={
  type:'object',additionalProperties:false,
  required:['qid','phienBan','phan','kyNang','laTuongDuong','dapAnSai','noiDungTrucTiep'],
  properties:{
    qid:{type:'string',minLength:1,maxLength:120},phienBan:chuoi,
    phan:{type:'string',enum:['I','II','III']},kyNang:mangChuoi,
    laTuongDuong:{type:'boolean'},dapAnSai:mangChuoiRong,noiDungTrucTiep:noiDung,
  },
}
const bienThe={
  ...probe,
  required:[...probe.required,'loai'],
  properties:{...probe.properties,loai:{type:'string',enum:['ghep_bai','kiem_chung']}},
}
const doiChieu={
  type:'object',additionalProperties:false,
  required:['maLoi','probeXacNhan','cachNghiCu','diemLech','heQua','cachDung'],
  properties:{maLoi:chuoi,probeXacNhan:probe,cachNghiCu:chuoi,diemLech:chuoi,heQua:chuoi,cachDung:chuoi},
}
const hieuBuoc={
  type:'object',additionalProperties:false,
  required:['mucTieu','yNghiaDaiLuong','viSaoCanBuoc','dieuKienApDung','noiVoiBuocSau','doiChieu','kiemLyDo','chuyenGiao'],
  properties:{
    mucTieu:chuoi,yNghiaDaiLuong:chuoi,viSaoCanBuoc:chuoi,dieuKienApDung:chuoi,noiVoiBuocSau:chuoi,
    doiChieu:{type:'array',maxItems:40,items:doiChieu},
    kiemLyDo:{type:'array',minItems:2,maxItems:40,items:probe},
    chuyenGiao:{type:'array',minItems:2,maxItems:40,items:probe},
  },
}
const hoTro={
  type:'object',additionalProperties:false,required:['muc','noiDung'],
  properties:{muc:{type:'integer',minimum:1,maximum:3},noiDung:chuoi},
}
const loiThuongGap={
  type:'object',additionalProperties:false,required:['ma','loai','tinHieu','probeXacNhan'],
  properties:{
    ma:chuoi,loai:{type:'string',enum:['doc_de','kien_thuc','phuong_phap','tinh_toan']},
    tinHieu:chuoi,probeXacNhan:chuoi,
  },
}
const buoc={
  type:'object',additionalProperties:false,
  required:['id','thuTu','tieuDe','tienQuyet','viKyNang','yApDung','chanDoan','phanBiet','kiemLai','hieuBuoc','hoTro','loiThuongGap'],
  properties:{
    id:chuoi,thuTu:{type:'integer',minimum:0,maximum:7},tieuDe:chuoi,tienQuyet:mangChuoi,viKyNang:mangChuoi,
    yApDung:{type:'array',maxItems:4,items:{type:'integer',minimum:0,maximum:3}},
    chanDoan:{type:'array',minItems:1,maxItems:40,items:probe},
    phanBiet:{type:'array',minItems:1,maxItems:40,items:probe},
    kiemLai:{type:'array',minItems:2,maxItems:40,items:probe},
    hieuBuoc,hoTro:{type:'array',minItems:3,maxItems:3,items:hoTro},
    loiThuongGap:{type:'array',maxItems:40,items:loiThuongGap},
  },
}
const hocLieu={
  type:'object',additionalProperties:false,
  required:['schemaVersion','qidGoc','contentVersion','buoc','banGhepBai','banKiemChung'],
  properties:{
    schemaVersion:{const:1},qidGoc:{type:'string',minLength:1,maxLength:120},contentVersion:chuoi,
    buoc:{type:'array',minItems:1,maxItems:8,items:buoc},
    banGhepBai:{type:'array',minItems:2,maxItems:40,items:bienThe},
    banKiemChung:{type:'array',minItems:2,maxItems:40,items:bienThe},
  },
}

const bangChung=(phase,inputHash,lan)=>({
  type:'object',additionalProperties:false,required:['phase','inputHash','lan'],
  properties:{phase:{const:phase},inputHash:{const:inputHash},lan:{const:lan}},
})

export function schemaSoan(inputHash,lan){
  return {type:'object',additionalProperties:false,required:['bangChung','hocLieu'],properties:{bangChung:bangChung('soan',inputHash,lan),hocLieu}}
}
export function schemaGiaiMu(inputHash,lan){
  const tra={
    type:'object',additionalProperties:false,required:['qid','phienBan','bamDe','dapAn','lyDo','chac'],
    properties:{qid:chuoi,phienBan:chuoi,bamDe:{type:'string',pattern:'^[a-f0-9]{64}$'},dapAn:chuoi,lyDo:chuoi,chac:{type:'boolean'}},
  }
  return {type:'object',additionalProperties:false,required:['bangChung','tra'],properties:{bangChung:bangChung('giai_mu',inputHash,lan),tra:{type:'array',maxItems:2000,items:tra}}}
}
export function schemaChuyenMon(inputHash,lan){
  const chuyenMon={
    type:'object',additionalProperties:false,required:['dungKhoaHoc','tuongDuong','dungDoKho','duBuoc','lyDo'],
    properties:{dungKhoaHoc:{type:'boolean'},tuongDuong:{type:'boolean'},dungDoKho:{type:'boolean'},duBuoc:{type:'boolean'},lyDo:chuoi},
  }
  return {type:'object',additionalProperties:false,required:['bangChung','chuyenMon'],properties:{bangChung:bangChung('chuyen_mon',inputHash,lan),chuyenMon}}
}
