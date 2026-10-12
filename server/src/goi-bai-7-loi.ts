// Gói bài 7 ngày: phủ câu gốc, tự làm và hiểu kiến thức là ba bằng chứng khác nhau.
export const PHIEN_BAN_GOI7 = 'goi7-1010-v1'
export type VaiGoi7 = 'moi' | 'sua' | 'on' | 'tiep_can' | 'chua'
export interface CauGoi7 {
  qid: string; maDe: string; maTo?: string; soCau?:number; version: string; group: string; phan: 'I' | 'II' | 'III'
  hopLe?: boolean; kho: boolean; tinhToan: boolean; kyNang: string[]
}
export interface ViecGoi7 { qid: string; vai: VaiGoi7; huongDan: boolean }
export const ngayVn7 = (ms: number): string => new Date(ms + 7 * 3600000).toISOString().slice(0, 10)
export const congNgay7 = (ngay: string, n: number): string => new Date(Date.parse(ngay + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
export const soNgayCon7 = (ngay: string, han: string): number => Math.max(1, 1 + Math.floor((Date.parse(han) - Date.parse(ngay)) / 86400000))
export const quotaGoi7 = (chuaGap: number, ngay: string, han: string): number => Math.ceil(Math.max(0, chuaGap) / soNgayCon7(ngay, han))
/**
 * MỨC HÔM NAY của ngày Gói bài 7 ngày — MỘT con số (thầy 12/10: "học sinh làm 24 câu nhưng lại báo 31 câu làm … phải rất cẩn thận chỗ này để học sinh
 * thấy chính xác làm đủ làm thiếu"). M = số lớn hơn giữa mức theo tầng (`CAU_TOI_THIEU[tầng]`) và tổng số câu mới theo lịch của các gói hôm nay.
 * Vòng tròn, "còn x câu", số chặng, "Đã đạt mục tiêu" (app học sinh) và mọi bảng của thầy / phụ huynh / Nhịp học đều đọc ĐÚNG số này
 * (chốt một lần mỗi ngày ở bảng `goi_bai_7_muc_ngay`, xem `chotMucNgay7` trong goi-bai-7.ts; ngày chưa có dòng chốt: `mucCuaNgay` trong bai-hang-ngay.ts).
 * Giả định tự chốt (ghi rõ theo yêu cầu thầy): câu mới theo lịch NẰM TRONG M (không cộng thêm) — nên M không nhỏ hơn lịch câu mới; phần lịch câu mới
 * chưa gặp hết trong ngày tự dồn sang ngày sau vì `quotaGoi7` chia lại số câu còn cho số ngày còn.
 */
export const mucNgayGoi7 = (toiThieuTang: number, tongQuota: number): number =>
  Math.max(Math.max(0, Math.floor(Number(toiThieuTang) || 0)), Math.max(0, Math.floor(Number(tongQuota) || 0)))

/** Quota phủ bài không bị tỷ lệ ôn/sửa ăn mất. Câu chưa sẵn sàng chỉ mở học có hỗ trợ. */
export function chonGoi7(a: {
  cau: readonly CauGoi7[]; daGap: ReadonlySet<string>; daLamNgay: ReadonlySet<string>
  quotaCon: number; sanSang: ReadonlySet<string>; chan: ReadonlySet<string>
  sua: readonly string[]; on: readonly string[]; chua?: readonly string[]; mucTieuNgay?: number
  trongSo?: Readonly<Record<string,number>>
  nhomPhu?: readonly {qids:readonly string[];quota:number}[]
  /** true ⇒ tổng việc KHÔNG vượt `mucTieuNgay` (thầy 12/10: một con số): câu mới theo lịch vẫn đứng đầu nhưng chỉ lấy trong phần còn lại của mức;
   *  phần lịch chưa gặp dồn sang ngày sau. Không truyền ⇒ hành vi cũ (câu mới theo lịch xếp đủ, có thể vượt mức). */
  chiTrongMuc?: boolean
}): { viec: ViecGoi7[]; thieuPhu: number; tuLam: number; tiepCan: number } {
  const viec: ViecGoi7[] = [], used = new Set<string>()
  const muc = Math.max(0, a.mucTieuNgay ?? 24)
  const moi = a.cau.filter(q => !a.daGap.has(q.qid) && !a.chan.has(q.qid) && !a.chan.has(q.group))
    .sort((x, y) => Number(!a.sanSang.has(x.qid))-Number(!a.sanSang.has(y.qid)) ||
      (a.trongSo?.[y.qid]??0)-(a.trongSo?.[x.qid]??0) || Number(x.kho) - Number(y.kho) || Number(x.tinhToan) - Number(y.tinhToan) || x.qid.localeCompare(y.qid))
  const phu:CauGoi7[]=[],daChon=new Set<string>()
  let thieuPhu=0
  if(a.nhomPhu?.length){
    for(const g of a.nhomPhu){const ids=new Set(g.qids),con=Math.max(0,g.quota-[...daChon].filter(id=>ids.has(id)).length),chon=moi.filter(q=>ids.has(q.qid)&&!daChon.has(q.qid)).slice(0,con);for(const q of chon){phu.push(q);daChon.add(q.qid)}thieuPhu+=Math.max(0,con-chon.length)}
  }else {phu.push(...moi.slice(0,a.quotaCon));thieuPhu=Math.max(0,a.quotaCon-moi.length)}
  for (const q of a.chiTrongMuc ? phu.slice(0, muc) : phu) {
    const huongDan = !a.sanSang.has(q.qid)
    viec.push({ qid: q.qid, vai: huongDan ? 'tiep_can' : 'moi', huongDan }); used.add(q.qid)
  }
  // Phần chữa mới của câu em đã nhờ thầy: quay lại học, không tính thêm câu gốc mới.
  for(const qid of a.chua??[]){if(viec.length>=muc)break;if(used.has(qid)||a.daLamNgay.has(qid)||a.chan.has(qid))continue;used.add(qid);viec.push({qid,vai:'chua',huongDan:true})}
  const them = (ids: readonly string[], vai: VaiGoi7, tran: number) => {
    let n = 0
    for (const qid of ids) {
      if (n >= tran || used.has(qid) || a.daLamNgay.has(qid) || a.chan.has(qid) || !a.sanSang.has(qid)) continue
      used.add(qid); viec.push({ qid, vai, huongDan: false }); n++
    }
  }
  // Giữ chỗ cho cả lỗi và kiến thức cũ; không sinh nhiệm vụ giả để đủ số.
  const con = Math.max(0,muc-viec.length)
  them(a.sua, 'sua', Math.min(con,Math.max(4,Math.ceil(muc/3))))
  them(a.on, 'on', Math.max(0,muc-viec.length))
  them(moi.map(q=>q.qid), 'moi', Math.max(0,muc-viec.length))
  for(const q of moi){if(viec.length>=muc)break;if(used.has(q.qid))continue;const huongDan=!a.sanSang.has(q.qid);viec.push({qid:q.qid,vai:huongDan?'tiep_can':'moi',huongDan});used.add(q.qid)}
  return { viec, thieuPhu, tuLam: viec.filter(x => !x.huongDan).length, tiepCan: viec.filter(x => x.huongDan).length }
}

/** Điểm từng ý đúng-sai theo cùng thang THPT; chuẩn hoá từng tờ về 10. */
export function diemGoi7(phan: 'I' | 'II' | 'III', tra: string, dapAn: string, dung: boolean): number {
  if (phan !== 'II') return dung ? 0.25 : 0
  if (!/^[DS]{4}$/.test(tra) || !/^[DS]{4}$/.test(dapAn)) return 0
  const n = [...tra].filter((c, i) => c === dapAn[i]).length
  return [0, 0.1, 0.25, 0.5, 1][n]!
}
export const diemTo7 = (dat: number, toiDa: number): number | null => toiDa > 0 ? Math.round(100 * Math.min(10, 10 * dat / toiDa)) / 100 : null
export function lyDoChua7(q: CauGoi7, daDo: number, sai: number): string[] {
  const ly = [...(q.kho ? ['Câu khó'] : []), ...(q.tinhToan ? ['Có tính toán'] : [])]
  // Mẫu nhỏ hiển thị số thật, chưa gắn nhãn "sai nhiều".
  if (daDo >= 5 && sai / daDo >= 0.3) ly.push('Nhiều học sinh sai')
  return ly
}
/** Một điểm cũ không xác nhận tờ mới vừa thêm/sửa/rút câu. */
export function diemConDungNguon7(snapshot:unknown,cau:readonly CauGoi7[]):boolean {
  if(!Array.isArray(snapshot)||snapshot.length!==cau.length||!cau.length||cau.some(q=>q.hopLe===false))return false
  const refs=new Map(cau.map(q=>[q.qid,`${q.maDe}|${q.version}`]))
  return snapshot.every(c=>c&&typeof c==='object'&&c.goc&&refs.get(c.goc.qid)===`${c.goc.maDe}|${c.goc.version}`)&&new Set(snapshot.map(c=>c.goc.qid)).size===cau.length
}
