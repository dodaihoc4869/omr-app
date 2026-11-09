// Gói bài 7 ngày: phủ câu gốc, tự làm và hiểu kiến thức là ba bằng chứng khác nhau.
import { bamMt, oMaTran, xepTheoMaTran } from './ma-tran-rut-moi'
export type VaiGoi7 = 'moi' | 'sua' | 'on' | 'tiep_can' | 'chua'
export interface CauGoi7 {
  qid: string; maDe: string; maTo?: string; soCau?:number; version: string; group: string; phan: 'I' | 'II' | 'III'
  hopLe?: boolean; kho: boolean; tinhToan: boolean; kyNang: string[]
  /** Mức độ (NB/TH/VD/VDC hoặc biet/hieu/van_dung) — ô ma trận khi rút câu mới (`ma-tran-rut-moi.ts`). Vắng ⇒ Hiểu. */
  mucDo?: string | null
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
/** 09/11 thầy «mỗi ngày chỉ 28 câu» ⇒ MỨC CỐ ĐỊNH 28 cho mọi em, mọi tầng (bỏ 24/30/36 và bỏ «lịch vượt mức thì mức tăng»): câu mới theo lịch
 *  vượt phần còn lại của 28 tự dồn sang ngày sau (`chiTrongMuc`); hạn chung (han-chung.ts) tính để lịch câu mới vừa trong 28/ngày.
 *  28 = 4 chặng 6 câu + 1 chặng 4 câu (số chặng làm tròn lên ở `hanh-trinh-ngay.ts`). Giữ chữ ký cũ để nơi gọi không đổi. */
export const MUC_NGAY_CO_DINH = 28
export const mucNgayGoi7 = (_toiThieuTang: number, _tongQuota: number): number => MUC_NGAY_CO_DINH
/** Ngày mức 28 bắt đầu có hiệu lực (ngày lên bản sống). Ước tính mức cho NGÀY CŨ chưa có dòng chốt (`mucCuaNgay`) giữ luật cũ
 *  max(mức tầng, Σ quota) — không áp ngược 28 làm ngày đã đủ thành «thiếu». Hôm nay (`homNay`) và ngày tới luôn 28 = đúng số lần mở sẽ chốt. */
export const NGAY_MUC_CO_DINH = '2026-11-09'
export const mucUocGoi7 = (ngay: string, toiThieuTang: number, tongQuota: number, homNay = ''): number =>
  ngay >= NGAY_MUC_CO_DINH || (homNay !== '' && ngay >= homNay) ? MUC_NGAY_CO_DINH : Math.max(Math.max(0, Math.floor(Number(toiThieuTang) || 0)), Math.max(0, Math.floor(Number(tongQuota) || 0)))

/** LOẠI NGÀY (khối B đợt 1 — thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 «duyệt, build và đẩy lên bản sống luôn»): mỗi em mỗi ngày là NGÀY HỌC MỚI
 *  (28 câu mới của bài đúng ma trận; thiếu câu mới mới lấp bằng sửa / ôn) hoặc NGÀY SỬA LỖI (câu em sai trước, không giới hạn ⅓ như ngày thường; thiếu thì
 *  ôn rồi câu mới cho đủ 28). Chốt MỘT lần ở lần mở đầu ngày (bảng `goi_bai_7_loai_ngay`, cùng lô với dòng mức 28), mọi lần sau đọc lại ⇒ không đổi giữa ngày.
 *  Từ `NGAY_LOAI_NGAY` — thầy 09/11 «áp dụng luôn» ⇒ ngay hôm nay (em đã chốt mức hôm nay: loại ghi riêng ở lần mở kế, chặng đang làm giữ nguyên câu). */
export type LoaiNgay7 = 'moi' | 'sua'
export const NGAY_LOAI_NGAY = '2026-11-09'
/** Ngày sửa lỗi khi em có từ chừng này câu sai đang chờ sửa (≈ nửa ngày) và hai ngày có loại gần nhất đều là học mới — «cứ 2 ngày Mới chen 1 ngày Sửa». */
export const SO_LOI_NGAY_SUA = 12
export const laLoaiNgay7 = (v: unknown): v is LoaiNgay7 => v === 'moi' || v === 'sua'
/** Luật chọn loại ngày (thuần). `truoc` = loại của các ngày ĐÃ CÓ LOẠI gần nhất, mới trước. null ⇒ không gắn loại (kế hoạch như cũ). */
export function chonLoaiNgay7(a: { ngay: string; truoc: readonly string[]; soSua: number; soMoiCon: number; kiemNhe?: boolean }): LoaiNgay7 | null {
  if (a.ngay < NGAY_LOAI_NGAY || a.kiemNhe) return null
  // hết câu mới của mọi bài đang luyện: còn lỗi ⇒ sửa; không còn gì ⇒ không gắn loại (ngày ôn như cũ, không nói «học mới» sai sự thật)
  if (a.soMoiCon <= 0) return a.soSua > 0 ? 'sua' : null
  if (a.soSua >= SO_LOI_NGAY_SUA && a.truoc[0] === 'moi' && a.truoc[1] === 'moi') return 'sua'
  return 'moi'
}

const DEM_CAU7 = new WeakMap<CauGoi7, { ngay: string; bm: number; o: string }>()
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
  /** Khi bật kiểm tra riêng: giữ chỗ thực cho ôn đến lịch, không để chữa/sửa ăn hết. */
  giuOn?: number
  /** ÔN SỚM (thầy 23/10, em báo «3 câu chờ thầy bổ sung» ở 27/30): câu em ĐÃ làm, chưa tới lịch ôn — tầng CUỐI, chỉ lấp phần mức còn thiếu khi
   *  câu mới / chữa / sửa / ôn đến lịch đã hết. Vai 'on' (phát như câu ôn). Vắng ⇒ hành vi cũ. */
  onSom?: readonly string[]
  /** Ngày lập (YYYY-MM-DD): hoà trong một ô ma trận xoay theo ngày. Vắng ⇒ theo mã câu. */
  ngay?: string
  /** Câu em GẶP LẦN ĐẦU HÔM NAY (nằm trong `daGap`): vẫn đứng trong dãy ma trận của ngày rồi mới bỏ ra ⇒ lập lại giữa ngày không đổi phần câu mới còn lại,
   *  em làm câu nào trước cũng vậy. Vắng ⇒ mọi câu `daGap` tính là đã rút trước hôm nay. */
  gapHomNay?: ReadonlySet<string>
  /** Khối B (10/11): 'sua' ⇒ câu sửa không bị giới hạn ⅓ mức (ngày sửa lỗi). Câu mới theo loại ngày do nơi gọi đặt qua `nhomPhu` quota. Vắng ⇒ như cũ. */
  loaiNgay?: LoaiNgay7 | null
}): { viec: ViecGoi7[]; thieuPhu: number; tuLam: number; tiepCan: number } {
  const viec: ViecGoi7[] = [], used = new Set<string>()
  const muc = Math.max(0, a.mucTieuNgay ?? 24)
  // CÂU MỚI THEO MA TRẬN ĐỀ 2026 (thầy 06/11, bỏ «dễ trước khó sau»): trong một ô (phần × mức) — sẵn sàng trước, trọng số OMNI, hoà xoay theo ngày;
  // giữa các ô — `xepTheoMaTran`, đếm cả câu mới đã rút những ngày trước của CÙNG nhóm ⇒ ô ít câu không dồn về cuối. Số câu mới mỗi ngày giữ nguyên.
  // Tốc độ máy chủ (luật tốc độ 13/10 — không chậm hơn bản cũ): khoá hạng (sẵn sàng, trọng số, băm xoay) và ô ma trận tính MỘT lần mỗi câu vào mảng số,
  // sắp chỉ số MỘT lần cho cả kho; mỗi nhóm phụ lấy câu của nhóm rồi sắp theo hạng số đã có (cùng thứ tự với sắp lại từ đầu).
  const N = a.cau.length, ss = new Uint8Array(N), ts = new Float64Array(N), bm = new Uint32Array(N), oQ: string[] = new Array(N)
  const viTriQ = new Map<CauGoi7, number>()
  for (let i = 0; i < N; i++) {
    const q = a.cau[i]!
    viTriQ.set(q, i); ss[i] = a.sanSang.has(q.qid) ? 0 : 1; ts[i] = a.trongSo?.[q.qid] ?? 0
    // Đệm theo đối tượng câu (một lượt lập gọi chonGoi7 nhiều lần trên CÙNG mảng câu): băm xoay theo ngày + ô ma trận chỉ tính lần đầu.
    let d = DEM_CAU7.get(q)
    if (!d || d.ngay !== (a.ngay ?? '')) { d = { ngay: a.ngay ?? '', bm: a.ngay ? bamMt(`${a.ngay}|${q.qid}`) : 0, o: oMaTran(q.phan, q.mucDo) }; DEM_CAU7.set(q, d) }
    bm[i] = d.bm; oQ[i] = d.o
  }
  const cmpI = (x: number, y: number) => ss[x]! - ss[y]! || ts[y]! - ts[x]! || bm[x]! - bm[y]! || a.cau[x]!.qid.localeCompare(a.cau[y]!.qid)
  const thuTu = Array.from({ length: N }, (_, i) => i).sort(cmpI), hangI = new Int32Array(N)
  for (let r = 0; r < N; r++) hangI[thuTu[r]!] = r
  const oCua = (q: CauGoi7) => oQ[viTriQ.get(q)!]!
  const truocNay = (id: string) => a.daGap.has(id) && !a.gapHomNay?.has(id)
  const boChan = (q: CauGoi7) => a.chan.has(q.qid) || a.chan.has(q.group)
  /** `ds` ĐÃ theo hạng. */
  const xepMoi = (ds: readonly CauGoi7[]): CauGoi7[] => {
    const ung: CauGoi7[] = [], da = new Map<string, number>()
    for (const q of ds) { if (truocNay(q.qid)) { const o = oCua(q); da.set(o, (da.get(o) ?? 0) + 1) } else if (!boChan(q)) ung.push(q) }
    return xepTheoMaTran(ung, oCua, da).filter(q => !a.daGap.has(q.qid))
  }
  const moi = xepMoi(thuTu.map(i => a.cau[i]!))
  const phu:CauGoi7[]=[],daChon=new Set<string>()
  let thieuPhu=0
  if(a.nhomPhu?.length){
    const theoQid=new Map(a.cau.map(q=>[q.qid,q] as const))
    for(const g of a.nhomPhu){const ids=new Set(g.qids),con=Math.max(0,g.quota-[...daChon].filter(id=>ids.has(id)).length)
      const cuaNhom=[...ids].flatMap(id=>theoQid.get(id)??[]).sort((x,y)=>hangI[viTriQ.get(x)!]!-hangI[viTriQ.get(y)!]!)
      const chon=xepMoi(cuaNhom).filter(q=>!daChon.has(q.qid)).slice(0,con);for(const q of chon){phu.push(q);daChon.add(q.qid)}thieuPhu+=Math.max(0,con-chon.length)}
  }else {phu.push(...moi.slice(0,a.quotaCon));thieuPhu=Math.max(0,a.quotaCon-moi.length)}
  for (const q of a.chiTrongMuc ? phu.slice(0, muc) : phu) {
    const huongDan = !a.sanSang.has(q.qid)
    viec.push({ qid: q.qid, vai: huongDan ? 'tiep_can' : 'moi', huongDan }); used.add(q.qid)
  }
  // Phần chữa mới của câu em đã nhờ thầy: quay lại học, không tính thêm câu gốc mới.
  const giuOn=Math.min(Math.max(0,a.giuOn??0),Math.max(0,muc-viec.length))
  for(const qid of a.chua??[]){if(viec.length>=muc-giuOn)break;if(used.has(qid)||a.daLamNgay.has(qid)||a.chan.has(qid))continue;used.add(qid);viec.push({qid,vai:'chua',huongDan:true})}
  const them = (ids: readonly string[], vai: VaiGoi7, tran: number) => {
    let n = 0
    for (const qid of ids) {
      if (n >= tran || used.has(qid) || a.daLamNgay.has(qid) || a.chan.has(qid) || !a.sanSang.has(qid)) continue
      used.add(qid); viec.push({ qid, vai, huongDan: false }); n++
    }
  }
  // Giữ chỗ cho cả lỗi và kiến thức cũ; không sinh nhiệm vụ giả để đủ số.
  const con = Math.max(0,muc-viec.length)
  them(a.sua, 'sua', Math.min(Math.max(0,con-giuOn),a.loaiNgay==='sua'?con:Math.max(4,Math.ceil(muc/3))))
  them(a.on, 'on', Math.max(0,muc-viec.length))
  them(moi.map(q=>q.qid), 'moi', Math.max(0,muc-viec.length))
  for(const q of moi){if(viec.length>=muc)break;if(used.has(q.qid))continue;const huongDan=!a.sanSang.has(q.qid);viec.push({qid:q.qid,vai:huongDan?'tiep_can':'moi',huongDan});used.add(q.qid)}
  them(a.onSom ?? [], 'on', Math.max(0, muc - viec.length))
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
