// THUẬT TOÁN RÚT CÂU SAI & KHẮC PHỤC LỖI SAI — CHUẨN HOÁ CHO CẢ 3 APP
// 1. Làm lại các câu sai: hiển thị lại toàn bộ câu sai và lời giải chuẩn để học sinh tự làm lại.
// 2. Luyện thêm dạng câu sai: thanh rút tối đa số câu có cùng nhãn dán chia theo tỷ lệ, giữ đúng tổng số câu đã chọn.
// 3. Lựa chọn luyện câu: 2 sao, 1 sao, 0 sao, lý thuyết, bài tập tính toán. Rút đúng nhãn dán, thanh trượt tối đa 100 câu.
// 4. Luyện dạng bài: chọn lớp → tên bài sách giáo khoa → dạng toán trọng tâm, gom TẤT CẢ câu trong kho thuộc dạng ấy.
// Tất cả câu rút hiển thị theo mẫu mới của HTML: chuẩn đề, chuẩn lời giải.

import type { TeacherExamSource } from '../data/examContent'
import { cauLuyenTuNguon, type CauLuyen } from './bai-tap-pdf'
import { chuanHoaLoiGiaiCau } from './chuan-hoa-loi-giai'
import { dangCua } from './dang-cau'
import { hopSao, type LocSaoMoRong } from './loc-sao'
import type { DangCauKho } from './rut-de-chua'
import { dungPhieu, type ThongTinPhieu } from './html-phieu'
import { hopLeDeRut } from './loc-cau-rut'

export interface CauSaiDauVao {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  chuyenDe?: string
  mucDo?: string
  dapAnChon?: string
  dapAnDung: string
  text: string
  choices?: string[]
  ideas?: string[]
  table?: string[][]
  imageDataUrl?: string
  hinhAnh?: string | {src:string;viTri:string;alt?:string}[]
  thanCauImg?: string
  choiceImgs?: string[]
  ideaImgs?: string[]
  loiGiai?: string
  dang?: string | { ma?: string; ten?: string }
  /** MÃ dạng do máy chủ trả kèm (`hsCauSai`). Khớp theo MÃ là khớp chắc; khớp
   * theo tên thì hai tờ đề viết lệch một dấu là trượt. */
  dangMa?: string
  /** Kiến thức đã xuất hiện trong câu em làm; chỉ dùng để kiểm điều kiện nền. */
  kienThuc?: string[]
  maCa?: string
  tenCa?: string
}

export interface ThongKeDangCauSai {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  nhanDan: string
  tenDang: string
  soUngVienToiDa: number
  ungVien: CauLuyen[]
}

export interface BoLocCauLuyen {
  sao: LocSaoMoRong
  dang: 'tat_ca' | 'ly_thuyet' | 'bai_tap'
}

/** Chuyển một câu sai đầu vào thành CauLuyen chuẩn hoá lời giải đầy đủ cấu trúc */
export function chuyenCauSaiSangCauLuyen(it: CauSaiDauVao): CauLuyen {
  const rawDang = typeof it.dang === 'string'
    ? (it.dang === '[object Object]' ? '' : it.dang)
    : (it.dang && typeof it.dang === 'object' ? (it.dang as any).ten || (it.dang as any).ma || '' : '')
  const tenDang = rawDang || it.chuyenDe || 'Lỗi sai cần khắc phục'
  const maDang = rawDang
  const rawChoices = it.choices && it.choices.length > 0
    ? it.choices
    : (it.ideas && it.ideas.length > 0 ? it.ideas : null)
  const luaChon = rawChoices ? rawChoices.map((x: unknown) => String(x ?? '')) : null
  const textCau = String(it.text ?? '')
  const daDung = String(it.dapAnDung ?? '')
  const daChon = String(it.dapAnChon ?? '')

  const lgChuan = chuanHoaLoiGiaiCau(it.loiGiai, it.phan || 'I', daDung)

  const hinhAnhUrl = (() => {
    const a = it.imageDataUrl || it.hinhAnh
    if (
      typeof a === 'string' &&
      a.trim().length > 10 &&
      (a.startsWith('data:image/') || a.startsWith('http://') || a.startsWith('https://') || a.startsWith('/'))
    ) {
      return a.trim()
    }
    return undefined
  })()

  return {
    phan: it.phan,
    id: it.qid,
    maDe: it.maCa || '',
    chuyenDe: it.chuyenDe || 'Hoá học',
    dang: dangCua({
      phan: it.phan,
      text: textCau,
      luaChon: luaChon ?? [],
      dapAn: daDung,
      mucDo: it.mucDo as any,
    }),
    sao: 1,
    mucDo: (it.mucDo as any) || 'hieu',
    text: textCau,
    luaChon,
    dapAn: daDung,
    chot: lgChuan.chot,
    lyDo: lgChuan.lyDo,
    buoc: lgChuan.buoc,
    ketQua: lgChuan.ketQua || daDung,
    anhThanCau: it.thanCauImg,
    anhLuaChon: it.phan === 'II' ? it.ideaImgs : it.choiceImgs,
    hinh: [...(Array.isArray(it.hinhAnh) ? it.hinhAnh : []), ...(hinhAnhUrl ? [{src:hinhAnhUrl,viTri:'sau_de'}] : [])],
    bang: it.table ?? null,
    chuaCho: {
      qid: it.qid,
      soCau: Number(it.soCau) || 1,
      phan: it.phan,
      maDang: maDang || '',
      tenDang: tenDang || it.chuyenDe || 'Lỗi sai cần khắc phục',
      bac: 1,
      laLamLai: true,
      daChon,
      viSaoSai: daChon ? `Em đã chọn ${daChon}, đáp án đúng là ${daDung}` : undefined,
    },
  }
}

/** Lấy nhãn dán của câu sai */
export function layNhanDanCauSai(c: CauSaiDauVao, banDo?: Map<string, DangCauKho>): { ma: string; ten: string } {
  // MÃ do máy chủ trả kèm đứng trước tên: máy em không có kho nên không dựng
  // được `banDo`, mà `dang` trả về chỉ là TÊN dạng — khớp tên là khớp hớ.
  if (c.dangMa && String(c.dangMa).trim()) {
    const ma = String(c.dangMa).trim()
    const ten = typeof c.dang === 'string' && c.dang.trim() ? c.dang.trim() : ma
    return { ma, ten }
  }
  if (c.dang) {
    if (typeof c.dang === 'string' && c.dang !== '[object Object]' && c.dang.trim()) {
      return { ma: c.dang.trim(), ten: c.dang.trim() }
    }
    if (typeof c.dang === 'object') {
      const ma = String((c.dang as any).ma ?? '').trim()
      const ten = String((c.dang as any).ten ?? '').trim() || ma
      if (ma) return { ma, ten }
    }
  }
  if (banDo && banDo.has(c.qid)) {
    const d = banDo.get(c.qid)!
    if (d.ma) return { ma: d.ma, ten: d.ten || d.ma }
  }
  try {
    const dAuto = dangCua({
      phan: c.phan,
      text: c.text,
      luaChon: c.choices ?? c.ideas ?? [],
      dapAn: c.dapAnDung,
      mucDo: c.mucDo as any,
    })
    if (dAuto && dAuto !== 'chua_ro') {
      return { ma: dAuto, ten: dAuto === 'ly_thuyet' ? 'Lý thuyết' : 'Bài tập' }
    }
  } catch {}

  return { ma: '', ten: c.chuyenDe || 'Chưa gắn dạng' }
}

type NhanKho = { ma: string; ten: string; kienThuc: string[] }
/** Chỉ nhận mã trên đúng tờ đề chứa ứng viên. QID trùng ở hai tờ không cấp bằng chứng cho câu sai. */
function nhanKho(khoDe: TeacherExamSource[]) {
  const theoCau=new Map<string,NhanKho>(),duyNhat=new Map<string,NhanKho|null>()
  for(const de of khoDe)for(const q of [...de.phanI,...de.phanII,...de.phanIII]){
    const ma=String(q.dang?.ma??'').trim(),id=String(q.id??'')
    if(!id||!ma)continue
    const n={ma,ten:String(q.dang?.ten??'').trim()||ma,kienThuc:Array.isArray(q.kienThuc)?q.kienThuc.map(String):[]}
    theoCau.set(`${de.maDe}|${id}`,n)
    if(duyNhat.has(id))duyNhat.set(id,null)
    else duyNhat.set(id,n)
  }
  const anToan=new Map<string,DangCauKho>()
  for(const [id,n] of duyNhat)if(n)anToan.set(id,{ma:n.ma,ten:n.ten})
  return {theoCau,duyNhat,anToan}
}

function kienThucDaHoc(dsCauSai:CauSaiDauVao[],duyNhat:Map<string,NhanKho|null>):Set<string>{
  const known=new Set<string>()
  for(const c of dsCauSai){
    for(const k of c.kienThuc??[])known.add(String(k))
    const tuKho=duyNhat.get(c.qid),ma=layNhanDanCauSai(c).ma
    if(tuKho&&tuKho.ma===ma)for(const k of tuKho.kienThuc)known.add(k)
  }
  return known
}

function khoaNoiDung(c:CauLuyen):string{
  const chuan=(v:unknown)=>String(v??'').normalize('NFKC').trim().replace(/\s+/g,' ')
  return JSON.stringify([c.phan,chuan(c.text),(c.luaChon??[]).map(chuan),c.bang??null,c.anhThanCau??null,c.anhLuaChon??[],c.hinh??[]])
}

/** Phân bổ theo phần dư lớn nhất: tổng suất không vượt số em kéo. */
function phanBoSuat(thongKe:ThongKeDangCauSai[],tongToiDa:number,tongSoCauRut:number):Map<string,number>{
  const ra=new Map(thongKe.map(t=>[t.qid,0]))
  const K=Math.max(0,Math.min(tongToiDa,Math.floor(Number(tongSoCauRut)||0)))
  const tong=thongKe.reduce((n,t)=>n+t.soUngVienToiDa,0)
  if(!K||!tong)return ra
  const muc=thongKe.map((t,i)=>{const x=K*t.soUngVienToiDa/tong,nen=Math.min(t.soUngVienToiDa,Math.floor(x));ra.set(t.qid,nen);return {t,i,du:x-nen}})
  let con=K-[...ra.values()].reduce((a,b)=>a+b,0)
  muc.sort((a,b)=>b.du-a.du||a.i-b.i)
  while(con>0){let them=false;for(const x of muc){if(con===0)break;const n=ra.get(x.t.qid)??0;if(n>=x.t.soUngVienToiDa)continue;ra.set(x.t.qid,n+1);con--;them=true}if(!them)break}
  return ra
}

/** Rút trong hạn mức, khử cả qid lẫn nội dung. Suất trùng được bù từ cùng tập hợp lệ. */
function rutTheoPhanBo(thongKe:ThongKeDangCauSai[],phanBo:Map<string,number>,gioiHan:number):CauLuyen[]{
  const K=Math.max(0,Math.floor(Number(gioiHan)||0)),out:CauLuyen[]=[],ids=new Set<string>(),noiDung=new Set<string>()
  const ds=thongKe.map(t=>({...t,ungVien:[...t.ungVien].sort((a,b)=>(a.sao??0)-(b.sao??0)||Number(b.dang==='ly_thuyet')-Number(a.dang==='ly_thuyet'))}))
  const daLay=new Map<string,number>()
  const lay=(t:ThongKeDangCauSai,n:number)=>{
    let them=0
    for(const q of t.ungVien){
      if(them>=n||out.length>=K)break
      const key=khoaNoiDung(q)
      if(ids.has(q.id)||noiDung.has(key))continue
      ids.add(q.id);noiDung.add(key);them++
      const so=(daLay.get(t.qid)??0)+1;daLay.set(t.qid,so)
      out.push({...q,chuaCho:{qid:t.qid,soCau:t.soCau,phan:t.phan,maDang:t.nhanDan,tenDang:t.tenDang,bac:Math.min(2,so) as 1|2}})
    }
    return them
  }
  for(const t of ds)lay(t,phanBo.get(t.qid)??0)
  while(out.length<K){let them=0;for(const t of ds)them+=lay(t,1);if(!them)break}
  return out
}

/** LỰA CHỌN 1: Làm lại toàn bộ câu sai */
export function taoDeLamLaiCauSai(
  dsCauSai: CauSaiDauVao[],
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): { html: string; dsCau: CauLuyen[] } {
  const dsCauHopLe = dsCauSai.filter((c) =>
    hopLeDeRut({
      phan: c.phan,
      maDe: c.maCa,
      dapAnDung: c.dapAnDung,
      text: c.text,
      choices: c.choices || c.ideas,
    })
  )
  const dsCau = dsCauHopLe.map(chuyenCauSaiSangCauLuyen)
  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || 'ĐỀ LÀM LẠI CÁC CÂU SAI',
    ketQua: `Gồm ${dsCau.length} câu làm sai cần khắc phục`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'LÀM LẠI CÂU SAI',
  }
  const html = dungPhieu(tt, dsCau, { anGiai: false })
  return { html, dsCau }
}

/** LỰA CHỌN 2: Phân tích tỷ lệ số câu tối đa cùng nhãn dán trong kho cho từng câu sai */
export function phanTichTyLeDang(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[]
): {
  thongKe: ThongKeDangCauSai[]
  tongToiDa: number
  tinhSoCauMoiDang: (tongSoCauRut: number) => Map<string, number>
} {
  const dsCauSaiHopLe = dsCauSai.filter((c) =>
    hopLeDeRut({
      phan: c.phan,
      maDe: c.maCa,
      dapAnDung: c.dapAnDung,
      text: c.text,
      choices: c.choices || c.ideas,
    })
  )
  const {theoCau,duyNhat,anToan}=nhanKho(khoDe)
  const known=kienThucDaHoc(dsCauSaiHopLe,duyNhat)
  const tatCaUngVien = cauLuyenTuNguon(khoDe)
  const qidSaiSet = new Set(dsCauSaiHopLe.map((c) => c.qid))
  const tapUngVienPhanBiet = new Set<string>()

  // Chuẩn bị danh sách ứng viên cho từng câu sai theo đúng nhãn dán
  const thongKe: ThongKeDangCauSai[] = dsCauSaiHopLe.map((cs) => {
    const nhan = layNhanDanCauSai(cs, anToan)
    // Tìm các câu trong kho có cùng nhãn dán và khác câu sai
    const ungVienCungNhan = tatCaUngVien.filter((cand) => {
      if (qidSaiSet.has(cand.id) || cand.id === cs.qid) return false
      const candDang=theoCau.get(`${cand.maDe}|${cand.id}`)
      return !!candDang&&!!nhan.ma&&candDang.ma===nhan.ma&&candDang.kienThuc.every(k=>known.has(k))
    })

    for (const u of ungVienCungNhan) {
      tapUngVienPhanBiet.add(khoaNoiDung(u))
    }

    return {
      qid: cs.qid,
      soCau: cs.soCau,
      phan: cs.phan,
      nhanDan: nhan.ma || nhan.ten,
      tenDang: nhan.ten || nhan.ma,
      soUngVienToiDa: ungVienCungNhan.length,
      ungVien: ungVienCungNhan,
    }
  })

  // TỐI ĐA = SỐ CÂU PHÂN BIỆT RÚT ĐƯỢC, không phải tổng cộng dồn.
  //
  // Bản trước cộng `soUngVienToiDa` của từng câu sai rồi mới chặn bằng số câu
  // phân biệt. Một câu trong kho thường là ứng viên cho NHIỀU câu sai cùng
  // nhãn, nên phép cộng ấy đếm nó nhiều lần — 11 câu sai ra "tối đa 8800 câu"
  // trong khi cả kho chỉ có mấy nghìn câu. Thanh kéo vì thế chạy tới một con số
  // không bao giờ rút nổi.
  //
  // Rút nhiều nhất được bao nhiêu thì đúng bằng số câu PHÂN BIỆT trong tập ứng
  // viên: rút quá số ấy là bắt đầu lặp lại chính những câu đã có.
  const tongToiDa = tapUngVienPhanBiet.size

  // Phân bổ phần dư lớn nhất, không vượt tổng đã chọn
  const tinhSoCauMoiDang = (tongSoCauRut: number): Map<string, number> => phanBoSuat(thongKe,tongToiDa,tongSoCauRut)

  return { thongKe, tongToiDa, tinhSoCauMoiDang }
}

/** Rút luyện thêm dạng câu sai theo tỷ lệ số câu chọn */
export function rutLuyenThemDangCauSai(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): { html: string; dsCau: CauLuyen[] } {
  const { thongKe, tongToiDa, tinhSoCauMoiDang } = phanTichTyLeDang(dsCauSai, khoDe)
  const phanBo = tinhSoCauMoiDang(soCauRut)

  const dsCauRut = rutTheoPhanBo(thongKe, phanBo, Math.min(soCauRut, tongToiDa))

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || 'ĐỀ LUYỆN DẠNG KHẮC PHỤC CÂU SAI',
    ketQua: `Gồm ${dsCauRut.length} câu cùng dạng (chia theo tỷ lệ từ ${tongToiDa} câu tối đa)`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'LUYỆN DẠNG CÂU SAI',
  }
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}

/** LỰA CHỌN 3: Luyện câu theo bộ lọc (2 sao, 1 sao, 0 sao, lý thuyết, bài tập) */
export function phanTichBoLocCau(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  boLoc: BoLocCauLuyen
): {
  thongKe: ThongKeDangCauSai[]
  tongToiDa: number
  tinhSoCauMoiDang: (tongSoCauRut: number) => Map<string, number>
} {
  const thongKe=phanTichTyLeDang(dsCauSai,khoDe).thongKe.map(t=>{
    const ungVien=t.ungVien.filter(c=>hopSao(c.sao,boLoc.sao)&&(boLoc.dang==='tat_ca'||c.dang===boLoc.dang))
    return {...t,ungVien,soUngVienToiDa:ungVien.length}
  })
  const tongToiDa=Math.min(100,new Set(thongKe.flatMap(t=>t.ungVien.map(khoaNoiDung))).size)
  const tinhSoCauMoiDang=(n:number)=>phanBoSuat(thongKe,tongToiDa,n)

  return { thongKe, tongToiDa, tinhSoCauMoiDang }
}

/** Rút đề theo bộ lọc sao & thể loại */
export function rutLuyenTheoBoLoc(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  boLoc: BoLocCauLuyen,
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): { html: string; dsCau: CauLuyen[] } {
  const { thongKe, tongToiDa, tinhSoCauMoiDang } = phanTichBoLocCau(dsCauSai, khoDe, boLoc)
  const phanBo = tinhSoCauMoiDang(soCauRut)

  const dsCauRut = rutTheoPhanBo(thongKe, phanBo, Math.min(soCauRut, tongToiDa))

  // Nhãn sao và dạng
  const nhanSao = boLoc.sao === 'sao_2' ? '2 sao' : boLoc.sao === 'sao_1' ? '1 sao' : boLoc.sao === 'sao_0' ? '0 sao' : 'mọi sao'
  const nhanDang = boLoc.dang === 'ly_thuyet' ? 'Lý thuyết' : boLoc.dang === 'bai_tap' ? 'Bài tập' : 'mọi dạng'

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || `ĐỀ ÔN THEO BỘ LỌC (${nhanSao} · ${nhanDang})`,
    ketQua: `Gồm ${dsCauRut.length} câu (rút từ tối đa ${tongToiDa} câu)`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'BỘ LỌC CÂU LUYỆN',
  }
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}

// ============================================================================
// CHẾ ĐỘ 4 — LUYỆN DẠNG BÀI (15/09)
//
// Khác hẳn ba chế độ trên: ba chế độ kia đi từ CÂU EM SAI, chế độ này đi từ
// DANH MỤC DẠNG TOÁN TRỌNG TÂM của sách. Em chọn lớp → tên bài → dạng, máy chủ
// trả TRỌN tờ đề của dạng ấy (`xong/Dạng bài/<lớp>/<bài>/<mã>.json` trong kho),
// ở đây chỉ còn việc trộn và cắt theo thanh trượt.
//
// KHÔNG lọc lại theo nhãn sao hay thể loại: dạng bài đã là ranh giới rồi, lọc
// thêm là em kéo thanh trượt lên 100 mà chỉ nhận về 7 câu.

/** Trộn tại chỗ, Fisher–Yates. Mỗi lượt rút một thứ tự khác nhau — em luyện
 * dạng ấy lần thứ ba không gặp lại đúng 20 câu đầu. */
function tronMang<T>(ds: T[]): T[] {
  const a = ds.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Số câu dùng được của một dạng bài — đếm SAU khi qua cửa nạp, vì cửa nạp bỏ
 * câu thiếu phương án hoặc thiếu đáp án. Con số trên thanh trượt phải là con số
 * THẬT sẽ rút được, không phải `so_cau` ghi trong gói. */
export function demCauDangBai(khoDangBai: TeacherExamSource[], boLoc?: BoLocCauLuyen): number {
  // return cauLuyenTuNguon(khoDangBai).length
  return locCauTuDo(khoDangBai, boLoc).length
}

function locCauTuDo(kho: TeacherExamSource[], boLoc?: BoLocCauLuyen): CauLuyen[] {
  return cauLuyenTuNguon(kho).filter((c) => {
    if (!boLoc) return true
    if (!hopSao(c.sao, boLoc.sao)) return false
    return boLoc.dang === 'tat_ca' || c.dang === boLoc.dang
  })
}

export function rutLuyenDangBai(
  khoDangBai: TeacherExamSource[],
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDang: string; tenBai: string; lop: string },
  boLoc?: BoLocCauLuyen,
): { html: string; dsCau: CauLuyen[] } {
  const tatCa = locCauTuDo(khoDangBai, boLoc)
  const dsCauRut = tronMang(tatCa).slice(0, Math.max(0, soCauRut))

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: `${thongTin.tenDang} — Lớp ${thongTin.lop} · ${thongTin.tenBai}`,
    ketQua: `Gồm ${dsCauRut.length} câu (kho có ${tatCa.length} câu thuộc dạng này)`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'LUYỆN ĐỀ TỰ DO',
  }
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}
