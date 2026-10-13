export interface TomTatGoi7 {
  bat:true; ngay:string; toiThieu:number; daLamHomNay:number; tuLamCon:number; tiepCanCon:number; thieuPhu:number; thieuNgay:number; canHoTro:boolean
  /** Đợt 19 (CHỈ-THÊM): tầng chung của em 1–4 (máy chủ mới). Vắng ⇒ Hành trình không đánh dấu tầng. */
  tang?:Tang7
  kienThucCu:{tong:number;dat:number;tyLe:number|null}
  /** `tang` (đợt 19, CHỈ-THÊM) = tầng đang luyện của bài; vắng ⇒ thẻ bài không ghi tầng. */
  goi:{id:string;ten:string;batDau:string;han:string;tong:number;daGap:number;con:number;quota:number;gapHomNay:number;quaHan:boolean;canBoSung:number;nguonDayDu?:boolean;to:string[];tang?:Tang7}[]
  diemDaDo:{goiId:string;maDe:string;diem:number;luc:string;cauMoi:number;tong:number}[]
}
type Tho = Record<string, unknown>
export type Tang7 = 1|2|3|4
/** Tầng hợp lệ 1–4; khác ⇒ undefined (không đoán). */
const docTang = (v:unknown):Tang7|undefined => v===1||v===2||v===3||v===4 ? v : undefined
const laSo = (v:unknown):v is number => typeof v==='number'&&Number.isFinite(v)&&v>=0
const so0 = (v:unknown):number => laSo(v)?v:0
const laNgay = (v:unknown):v is string => typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)
const laChu = (v:unknown):v is string => typeof v==='string'&&v.trim().length>0
const doiTuong = (v:unknown):v is Tho => !!v&&typeof v==='object'&&!Array.isArray(v)
const KIEN_THUC_TRONG:TomTatGoi7['kienThucCu'] = {tong:0,dat:0,tyLe:null}

/** Một gói: BẮT BUỘC `id` + `ten` (chuỗi khác rỗng), thiếu ⇒ bỏ gói ấy. Trường phụ CHUẨN HOÁ: `to` lọc chuỗi khác rỗng; số lạ ⇒ 0; `daGap` kẹp ≤ `tong`,
 *  `con` tính lại. Số gặp câu MÂU THUẪN (`daGap > tong`, `tong` không phải số) ⇒ gói hiện "chưa chốt tổng số câu" (`nguonDayDu: false`) — KHÔNG kẹp
 *  thành "đã gặp hết" (dữ liệu lệch không biến thành hoàn tất bài). */
function docGoi(x:unknown):TomTatGoi7['goi'][number]|null {
  if(!doiTuong(x)||!laChu(x.id)||!laChu(x.ten))return null
  const tong = so0(x.tong), daGapTho = so0(x.daGap), lech = !laSo(x.tong)||daGapTho>tong
  const daGap = Math.min(daGapTho, tong)
  const nguonDayDu = lech ? false : typeof x.nguonDayDu==='boolean' ? x.nguonDayDu : undefined
  return { id:x.id, ten:x.ten, batDau:laNgay(x.batDau)?x.batDau:'', han:laNgay(x.han)?x.han:'', tong, daGap, con:tong-daGap, quota:so0(x.quota), gapHomNay:so0(x.gapHomNay),
    quaHan:x.quaHan===true, canBoSung:so0(x.canBoSung), ...(nguonDayDu===undefined?{}:{nguonDayDu}), to:Array.isArray(x.to)?[...new Set(x.to.filter(laChu))]:[],
    ...(docTang(x.tang)?{tang:docTang(x.tang)}:{}) }
}
function docKienThuc(x:unknown):TomTatGoi7['kienThucCu'] {
  if(!doiTuong(x)||!laSo(x.tong)||!laSo(x.dat)||x.dat>x.tong||x.tyLe!==null&&!laSo(x.tyLe))return KIEN_THUC_TRONG
  return {tong:x.tong,dat:x.dat,tyLe:x.tyLe as number|null}
}
const laDiem = (d:unknown):d is TomTatGoi7['diemDaDo'][number] => doiTuong(d)&&laChu(d.goiId)&&laChu(d.maDe)&&laSo(d.diem)&&d.diem<=10&&laSo(d.cauMoi)&&laSo(d.tong)&&d.cauMoi<=d.tong&&typeof d.luc==='string'

/**
 * Đọc tóm tắt Gói 7. CHỈ phần CỐT LÕI là bắt buộc: `bat === true`, `ngay`, `toiThieu` (M, > 0), `daLamHomNay` (≥ 0) và `goi` có ≥ 1 gói có `id`/`ten`.
 * Thiếu/sai cốt lõi ⇒ undefined (nơi gọi coi là LỖI — `docSanh` — không đoán, không biến phản hồi hỏng thành "đủ mức").
 * Trường phụ lệch thì CHUẨN HOÁ chứ không bỏ cả gói (khẩn 12/10 21h30: một phần tử `to` / một mục `diemDaDo` lạ từng làm app bỏ cả gói ⇒ Hôm nay
 * rơi về số kế hoạch "7/8" thay vì "7/32"): `to` lọc chuỗi · `daGap` kẹp ≤ `tong`, `con` tính lại · bỏ mục `diemDaDo` lạ · `kienThucCu` thiếu ⇒ mặc
 * định · `tuLamCon`/`tiepCanCon`/`thieuPhu`/`thieuNgay` lạ ⇒ 0.
 */
export function docTomTatGoi7(x:unknown):TomTatGoi7|undefined {
  if(!doiTuong(x))return
  if(x.bat!==true||!laNgay(x.ngay)||!laSo(x.toiThieu)||x.toiThieu<=0||!laSo(x.daLamHomNay)||!Array.isArray(x.goi))return
  const goi = x.goi.map(docGoi).filter((g):g is NonNullable<typeof g> => g!==null)
  if(!goi.length)return
  const tang = docTang(x.tang)
  return { bat:true, ngay:x.ngay, toiThieu:x.toiThieu, daLamHomNay:x.daLamHomNay, tuLamCon:so0(x.tuLamCon), tiepCanCon:so0(x.tiepCanCon), thieuPhu:so0(x.thieuPhu),
    thieuNgay:so0(x.thieuNgay), canHoTro:x.canHoTro===true, ...(tang?{tang}:{}), kienThucCu:docKienThuc(x.kienThucCu), goi, diemDaDo:Array.isArray(x.diemDaDo)?x.diemDaDo.filter(laDiem):[] }
}
