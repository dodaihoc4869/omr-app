// APP PHỤ HUYNH MỚI — lớp ĐỌC CHẶT hai lệnh máy chủ (đã soát; server/src/ph-tat-ca-ve-con.ts):
//   POST /ph/tat-ca-ve-con {pass|sbd}        ⇒ mọi thứ về con hôm nay (mỗi khối có thể VẮNG: khối nào không có số thật thì máy chủ không gửi)
//   POST /ph/chi-tiet-cau-ve-con {pass|sbd, qid} ⇒ lời giải của MỘT câu con đã làm
// Nguyên tắc: (1) khối nào sai dạng ⇒ VẮNG (màn ẩn, không bịa 0/mảng rỗng giả); (2) CÂU BỊ CHE (`che`) chỉ giữ {luc, nguon, che, giay?} — mọi trường khác (đề, đáp án, đúng/sai, tên dạng, mã câu) BỊ BỎ
// dù JSON lỡ có: điện thoại phụ huynh không được thành đường lộ đáp án; (3) không trường nào của game (thần thú, EXP, khiên…) được đi qua đây; (4) không ném lỗi.
import { chuanHoaLoiGiaiCau } from '../chuan-hoa-loi-giai'
export type NguonHien = 'on_lai' | 'btvn' | 'thu_thach_rieng' | 'luyen_dang_vap' | 'gia_dinh_giao' | 'ca_kiem_tra' | 'len_bang' | 'khac_phuc' | 'luyen_de'
export type LyDoChe = 'chua_cong_bo' | 'chua_nop'
export type TenBac = 'biet' | 'hieu' | 'van_dung'
const NGUON: readonly string[] = ['on_lai', 'btvn', 'thu_thach_rieng', 'luyen_dang_vap', 'gia_dinh_giao', 'ca_kiem_tra', 'len_bang', 'khac_phuc', 'luyen_de']
const BAC: readonly string[] = ['biet', 'hieu', 'van_dung']

export interface CongBo { congBo: 'khong' | 'ngay' | 'ca_lop_xong'; daCongBo: boolean; soEmDaNop: number; soEmDaVao: number }
export interface PhanDiem { ma: 'I' | 'II' | 'III'; dung: number; tong: number; diem: number | null }
export interface CaGanNhat {
  maCa: string
  tenCa: string
  nopLuc: string
  thoiGianLamGiay: number | null
  congBo: CongBo
  /** CHỈ có khi đã công bố. */
  ketQua: { tong: number | null; soCau: number | null; soCauDung: number | null } | null
  truoc: { tong: number | null; doi: number } | null
  phan: PhanDiem[]
}
export interface DiemTienBo { ngay: string; diem: number; maCa: string; tenCa: string }
export interface DangTienBo { ma: string; ten: string; tu: number; den: number }
/** Mục tiêu ngày để vẽ vòng 1 (câu) và vòng 3 (phút) — CHỈ khi máy chủ trả; thiếu ⇒ vòng đó ẩn, chỉ còn số. */
export interface MucTieu { soCau: number | null; phutHoc: number | null }
export interface TongQuan {
  /** "Câu đã làm hôm nay" (định nghĩa chuẩn, GỒM cả câu bị che: chỉ đếm, không lộ đúng/sai). */
  soCau: number | null
  /** Số câu ĐÚNG — chỉ trên câu KHÔNG che. Vắng khi cả ngày chỉ có câu che. */
  soDung: number | null
  /** MẪU SỐ của tỉ lệ đúng = số câu KHÔNG che đã có kết quả (≤ soCau). Máy chủ cũ chưa gửi ⇒ null ⇒ màn rơi về soCau như trước. */
  soCauCoKetQua: number | null
  phutHoc: number | null
  datNhiemVu: boolean | null
  chuoiNgayHoc: number | null
  /** Hôm qua: ngày toàn câu che ⇒ chỉ có `soCau` (tiLeDung, soCauCoKetQua = null) — không có tỉ lệ đúng để so. */
  soVoiHomQua: { soCau: number; tiLeDung: number | null; soCauCoKetQua: number | null; phutHoc: number | null } | null
  mucTieu: MucTieu | null
  /** Số lần ngồi học hôm nay + lần dài nhất (phút): máy chủ trả sẵn để câu tóm tắt không lệch; thiếu ⇒ màn tự đếm từ dòng thời gian. */
  soLanHoc: number | null
  lanDaiNhatPhut: number | null
  /** Việc trong kế hoạch hôm nay: đã xong / tổng. CHỈ khi máy chủ trả ĐỦ cả hai (viecTong > 0, viecXong ≤ viecTong); thiếu ⇒ cả hai null và màn KHÔNG vẽ "N/M việc". */
  viecXong: number | null
  viecTong: number | null
}
/** `soCauDaLam`: CHỈ ở mốc bị che — "Con đã làm 6 câu · kết quả hiện sau…" (KHÔNG đúng/sai). */
export interface MocThoiGian { batDau: string; nguon: NguonHien; ten: string; soCau: number | null; soDung: number | null; che: LyDoChe | null; phut: number; ghiChu: string; soCauDaLam: number | null }
/** `lamLau` (máy chủ tính, không chép ngưỡng sang máy khách) và `lan` (chỉ số lần ngồi học) — cả hai null khi máy chủ chưa trả. */
export interface CauChe { kieu: 'che'; luc: string; nguon: NguonHien; che: LyDoChe; giay: number | null; lamLau: boolean | null; lan: number | null }
export interface CauThuong { kieu: 'thuong'; luc: string; nguon: NguonHien; tenDang: string; de: string; conChon: string; dapAn: string; dung: boolean | null; giay: number | null; coLoiGiai: boolean; qid: string; lamLau: boolean | null; lan: number | null }
export type CauHomNay = CauChe | CauThuong
export interface DangSo { ma: string; ten: string; dung: number; tong: number; bac: 0 | 1 | 2 | null }
export interface DangManhYeu { tenDang: string; dung: number; tong: number; bac: TenBac | null }
/** Một chấm chặng của bài tập về nhà: `thu` = thứ của NGÀY MỞ chặng (giờ VN); xong · hôm nay (đã mở, chưa xong) · sắp tới (chưa mở). Máy chủ KHÔNG trả số đúng/tổng câu từng chặng (soDung/soCau/nopLuc luôn null trừ khi sau này có). */
export interface ChangBtvn { thu: 'CN' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'; ngay: string; trangThai: 'xong' | 'hom_nay' | 'sap_toi'; soDung: number | null; soCau: number | null; nopLuc: string }
export interface BtvnDangChay { maBtvn: string; ten: string; hanNop: string; changXong: number | null; changTong: number | null; chang: ChangBtvn[] | null }
export interface BtvnGan { maBtvn: string; ten: string; nopLuc: string; dungHan: boolean | null; diem: number | null; nopTreGio: number | null }
/** Điều đáng mừng (≤ 3): CHỈ sự thật đo được; không có gì đáng kể ⇒ vắng. */
/** `dang`: ≤ 3 tên dạng của dòng `len_bac`; `chiTiet`: chữ phụ nếu máy chủ gửi chữ (mảng tên dạng được ghép bằng dấu phẩy). */
export interface DieuDangMung { loai: 'dung_lai' | 'len_bac' | 'chuoi'; so: number | null; chiTiet: string; dang: string[] }
/** Việc THẬT có số mà A.I Đỗ Đại Học đã làm cho con hôm nay (≤ 5). `luc`: ISO hoặc "HH:MM". */
/** `theoNguon`: chỉ ở `chon_rieng` — số câu theo nguồn của kế hoạch ngày {ma: on_lai | than_thu | on_thi | btvn_lo…, so}. `nhac_han`: `so` = số lần đã nhắc phụ huynh hôm nay, `luc` = lần gần nhất. */
export interface ViecAi { loai: 'chon_rieng' | 'xep_on' | 'soan_thu_thach' | 'nhac_han' | 'cham'; so: number | null; luc: string; chiTiet: string; theoNguon: { ma: string; so: number }[] }
/** Dồn về đích: món nợ của con (chỉ khi có nợ). */
export interface NoPh { theoNgay: { ngay: string; loai: string; ten: string; soCau: number | null; phut: number | null }[]; tongCau: number; tongPhut: number | null }
export interface PhMoi {
  hoTen: string
  serverNow: number | null
  caGanNhat: CaGanNhat | null
  tienBo: { diem: DiemTienBo[]; dangTienBoNhat: DangTienBo[] } | null
  tongQuan: TongQuan | null
  dongThoiGian: MocThoiGian[] | null
  cau: CauHomNay[] | null
  nhipHoc: { ngay: { ngay: string; soCau: number; soCauDung: number | null }[]; gioThuongHoc: string; trungBinhCauMoiNgay: number | null; tongCau: number | null } | null
  bacTheoDang: { ma: string; ten: string; bac: 0 | 1 | 2 }[] | null
  dangVap: DangSo[] | null
  vuaLenBac: { ma: string; ten: string; tu: number; den: number; ngay: string }[] | null
  manhYeu: { lamTot: DangManhYeu[]; conVap: DangManhYeu[]; lenBacHomNay: string[] } | null
  baiTapVeNha: { dangChay: BtvnDangChay[]; gan: BtvnGan[] } | null
  lichOn: { homNay: number; ngayMai: number; daKhacPhuc14Ngay: number; conSaiChuaKhacPhuc: number; tongTungSai: number | null; bayNgayToi: { ngay: string; soCau: number }[] | null; phutNgayMai: number | null } | null
  dieuDangMung: DieuDangMung[] | null
  aiDaLam: ViecAi[] | null
  /** Cảnh "con chưa học": việc A.I đã CHUẨN BỊ cho con (cùng khuôn). */
  aiDaChuanBi: ViecAi[] | null
  no: NoPh | null
  phuHuynhLamGi: string[]
  loiBoNao: { loi: string; ngay: string; thuTuan: string } | null
  giaoThemConLai: number | null
  doCham: { hang: number; siSo: number } | null
}

const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const soKhongAm = (x: unknown): number | null => {
  const n = so(x)
  return n !== null && n >= 0 ? n : null
}
const nguyenKhongAm = (x: unknown): number | null => {
  const n = soKhongAm(x)
  return n !== null && Number.isInteger(n) ? n : null
}
const chuoi = (x: unknown, tran = 400): string => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, tran) : '')
const mang = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const nguon = (x: unknown): NguonHien | null => (typeof x === 'string' && NGUON.includes(x) ? (x as NguonHien) : null)
const lyDoChe = (x: unknown): LyDoChe | null => (x === 'chua_cong_bo' || x === 'chua_nop' ? x : null)
const tenBac = (x: unknown): TenBac | null => (typeof x === 'string' && BAC.includes(x) ? (x as TenBac) : null)
const bac012 = (x: unknown): 0 | 1 | 2 | null => (x === 0 || x === 1 || x === 2 ? x : null)
const iso = (x: unknown): string => (typeof x === 'string' && Number.isFinite(Date.parse(x)) ? x : '')

function docCongBo(x: unknown): CongBo | null {
  if (!laDoiTuong(x)) return null
  const k = x.congBo === 'ngay' || x.congBo === 'ca_lop_xong' ? x.congBo : 'khong'
  return { congBo: k, daCongBo: x.daCongBo === true, soEmDaNop: nguyenKhongAm(x.soEmDaNop) ?? 0, soEmDaVao: nguyenKhongAm(x.soEmDaVao) ?? 0 }
}

function docCaGanNhat(x: unknown): CaGanNhat | null {
  if (!laDoiTuong(x)) return null
  const maCa = chuoi(x.maCa, 80)
  const congBo = docCongBo(x.congBo)
  const nopLuc = iso(x.nopLuc)
  if (!maCa || !congBo || !nopLuc) return null
  const tenCa = chuoi(x.tenCa, 120) || `Ca ${maCa}`
  const base: CaGanNhat = { maCa, tenCa, nopLuc, thoiGianLamGiay: (() => { const g = soKhongAm(x.thoiGianLamGiay); return g !== null && g > 0 ? g : null })(), congBo, ketQua: null, truoc: null, phan: [] }
  // CHƯA công bố: KHÔNG điểm/số câu/phần/so sánh, dù JSON lỡ có (luật công bố đứng trên mọi khối).
  if (!congBo.daCongBo) return base
  const kq = laDoiTuong(x.ketQua) ? x.ketQua : null
  const tong = kq ? soKhongAm(kq.tong) : null
  if (tong === null) return base
  const tr = laDoiTuong(x.truoc) ? x.truoc : null
  const phan: PhanDiem[] = []
  for (const p of mang(x.phan)) {
    if (!laDoiTuong(p) || (p.ma !== 'I' && p.ma !== 'II' && p.ma !== 'III')) continue
    const dung = nguyenKhongAm(p.dung)
    const t = nguyenKhongAm(p.tong)
    if (dung === null || t === null || t <= 0 || dung > t) continue
    phan.push({ ma: p.ma, dung, tong: t, diem: soKhongAm(p.diem) })
    if (phan.length >= 3) break
  }
  return {
    ...base,
    ketQua: { tong, soCau: kq ? nguyenKhongAm(kq.soCau) : null, soCauDung: kq ? nguyenKhongAm(kq.soCauDung) : null },
    truoc: tr && so(tr.doi) !== null ? { tong: so(tr.tong), doi: so(tr.doi) as number } : null,
    phan,
  }
}

/** Mục tiêu chỉ nhận số > 0 (0 hoặc âm = không có mục tiêu ⇒ không vẽ vòng); cả hai vắng ⇒ null. */
function docMucTieu(x: unknown): MucTieu | null {
  if (!laDoiTuong(x)) return null
  const cau = nguyenKhongAm(x.cau) ?? nguyenKhongAm(x.soCau) // máy chủ: {cau, phut}; nhận thêm tên {soCau, phutHoc} của GHI-CHU-BUILD
  const phut = soKhongAm(x.phut) ?? soKhongAm(x.phutHoc)
  const m = { soCau: cau !== null && cau > 0 ? cau : null, phutHoc: phut !== null && phut > 0 ? phut : null }
  return m.soCau !== null || m.phutHoc !== null ? m : null
}

/** "So với hôm qua": tiLeDung có thể VẮNG (hôm qua toàn câu che) ⇒ giữ dòng, tiLeDung = null. Có gửi mà hỏng (âm, > 1) ⇒ bỏ cả khối như cũ. */
function docSoVoiHomQua(v: Record<string, unknown> | null): TongQuan['soVoiHomQua'] {
  if (!v) return null
  const soCau = nguyenKhongAm(v.soCau)
  if (soCau === null) return null
  const ti = v.tiLeDung === undefined ? null : soKhongAm(v.tiLeDung)
  if (v.tiLeDung !== undefined && (ti === null || ti > 1)) return null
  const kq = nguyenKhongAm(v.soCauCoKetQua)
  return { soCau, tiLeDung: ti, soCauCoKetQua: kq !== null && kq <= soCau ? kq : null, phutHoc: soKhongAm(v.phutHoc) }
}

/**
 * MẪU SỐ của "câu đúng / tỉ lệ đúng" (Boss 21/09, một định nghĩa câu đã làm): số câu ĐÃ CÓ KẾT QUẢ (không che) do máy chủ gửi; chưa gửi (máy chủ cũ) ⇒ rơi về `soCau` như trước. Không có soCau ⇒ null.
 */
export function mauSoTiLeDung(t: { soCau: number | null; soCauCoKetQua?: number | null }): number | null {
  if (t.soCau === null) return null
  const kq = t.soCauCoKetQua
  return typeof kq === 'number' && Number.isInteger(kq) && kq >= 0 && kq <= t.soCau ? kq : t.soCau
}

function docTongQuan(x: unknown): TongQuan | null {
  if (!laDoiTuong(x)) return null
  const v = laDoiTuong(x.soVoiHomQua) ? x.soVoiHomQua : null
  const vx = nguyenKhongAm(x.viecXong)
  const vt = nguyenKhongAm(x.viecTong)
  const coViec = vx !== null && vt !== null && vt > 0 && vx <= vt
  const soCau = nguyenKhongAm(x.soCau)
  const soKq = nguyenKhongAm(x.soCauCoKetQua)
  const t: TongQuan = {
    soCau,
    soDung: nguyenKhongAm(x.soDung),
    soCauCoKetQua: soCau !== null && soKq !== null && soKq <= soCau ? soKq : null,
    phutHoc: soKhongAm(x.phutHoc),
    datNhiemVu: typeof x.datNhiemVu === 'boolean' ? x.datNhiemVu : null,
    chuoiNgayHoc: nguyenKhongAm(x.chuoiNgayHoc),
    soVoiHomQua: docSoVoiHomQua(v),
    mucTieu: docMucTieu(x.mucTieu),
    soLanHoc: nguyenKhongAm(x.soLanHoc),
    lanDaiNhatPhut: soKhongAm(x.lanDaiNhatPhut),
    viecXong: coViec ? vx : null,
    viecTong: coViec ? vt : null,
  }
  const co = t.soCau !== null || t.soDung !== null || t.phutHoc !== null || t.datNhiemVu !== null || t.chuoiNgayHoc !== null || t.viecTong !== null || t.mucTieu !== null
  return co ? t : null
}

function docMoc(x: unknown): MocThoiGian | null {
  if (!laDoiTuong(x)) return null
  const batDau = iso(x.batDau)
  const ng = nguon(x.nguon)
  const phut = nguyenKhongAm(x.phut)
  if (!batDau || !ng || phut === null) return null
  const che = lyDoChe(x.che)
  // Mốc bị che: KHÔNG số câu / số đúng dù JSON lỡ có.
  const soCau = che ? null : nguyenKhongAm(x.soCau)
  const soDung = che || soCau === null ? null : nguyenKhongAm(x.soDung)
  const ghiChu = x.ghiChu === 'Nộp đúng hạn' || x.ghiChu === 'Nộp sau hạn' ? x.ghiChu : ''
  const daLam = che ? nguyenKhongAm(x.soCauDaLam) : null // chỉ SỐ CÂU ĐÃ LÀM (khoá riêng) của mốc bị che — không đúng/sai, không lấy từ soCau
  return { batDau, nguon: ng, ten: chuoi(x.ten, 140), soCau, soDung: soDung !== null && soCau !== null && soDung <= soCau ? soDung : null, che, phut: Math.max(1, phut), ghiChu, soCauDaLam: daLam }
}

function docCau(x: unknown): CauHomNay | null {
  if (!laDoiTuong(x)) return null
  const luc = iso(x.luc)
  const ng = nguon(x.nguon)
  if (!luc || !ng) return null
  const che = lyDoChe(x.che)
  const giayRaw = soKhongAm(x.giay)
  const giay = giayRaw !== null && giayRaw > 0 ? giayRaw : null
  const lamLau = typeof x.lamLau === 'boolean' ? x.lamLau : null
  const lan = nguyenKhongAm(x.lan)
  if (che) return { kieu: 'che', luc, nguon: ng, che, giay, lamLau, lan } // CHỈ các trường này — mọi thứ khác (đề, đáp án, đúng/sai) bị bỏ
  const de = chuoi(x.deRutGon, 200)
  if (!de) return null
  return {
    kieu: 'thuong',
    luc,
    nguon: ng,
    tenDang: chuoi(x.tenDang, 140),
    de,
    conChon: chuoi(x.conChon, 40),
    dapAn: chuoi(x.dapAn, 40),
    dung: typeof x.dung === 'boolean' ? x.dung : null,
    giay,
    coLoiGiai: x.coLoiGiai === true,
    qid: chuoi(x.qid, 200),
    lamLau,
    lan,
  }
}

function docChang(x: unknown): ChangBtvn | null {
  if (!laDoiTuong(x)) return null
  const thu = typeof x.thu === 'string' && ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].includes(x.thu) ? (x.thu as ChangBtvn['thu']) : null
  const tt = x.trangThai === 'xong' || x.trangThai === 'hom_nay' || x.trangThai === 'sap_toi' ? x.trangThai : null
  const ngay = typeof x.ngay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.ngay) ? x.ngay : ''
  if (thu === null || tt === null || !ngay) return null
  const soCau = nguyenKhongAm(x.soCau)
  const soDung = nguyenKhongAm(x.soDung)
  const daNop = tt !== 'sap_toi' // chặng của hôm nay có thể đã nộp rồi; chặng sắp tới thì chưa có số
  return { thu, ngay, trangThai: tt, soCau: daNop ? soCau : null, soDung: daNop && soCau !== null && soDung !== null && soDung <= soCau ? soDung : null, nopLuc: daNop ? iso(x.nopLuc) : '' }
}

function docViecAi(x: unknown): ViecAi | null {
  if (!laDoiTuong(x)) return null
  const loai = ['chon_rieng', 'xep_on', 'soan_thu_thach', 'nhac_han', 'cham'].includes(x.loai as string) ? (x.loai as ViecAi['loai']) : null
  if (!loai) return null
  const so_ = nguyenKhongAm(x.so)
  const luc = typeof x.luc === 'string' && (Number.isFinite(Date.parse(x.luc)) || /^\d{1,2}:\d{2}$/.test(x.luc.trim())) ? x.luc.trim() : ''
  // "Việc nào không có số thật ⇒ không gửi dòng đó": số vắng/0 ⇒ bỏ (không vẽ "0 câu"); riêng nhắc hạn nói được bằng giờ nhắc.
  if ((so_ === null || so_ === 0) && !(loai === 'nhac_han' && luc)) return null
  const theoNguon = laDoiTuong(x.chiTiet)
    ? Object.entries(x.chiTiet)
        .map(([ma, v]) => ({ ma: chuoi(ma, 40), so: nguyenKhongAm(v) ?? 0 }))
        .filter((e) => e.ma && e.so > 0)
        .slice(0, 6)
    : []
  return { loai, so: so_, luc, chiTiet: typeof x.chiTiet === 'string' ? chuoi(x.chiTiet, 240) : '', theoNguon }
}

function docDieuMung(x: unknown): DieuDangMung | null {
  if (!laDoiTuong(x)) return null
  const loai = x.loai === 'dung_lai' || x.loai === 'len_bac' || x.loai === 'chuoi' ? x.loai : null
  const so_ = nguyenKhongAm(x.so)
  const dang = Array.isArray(x.chiTiet) ? lapDanh(x.chiTiet, (e) => (typeof e === 'string' && e.trim() ? chuoi(e, 140) : null), 3) : []
  return loai && so_ !== null && so_ > 0 ? { loai, so: so_, chiTiet: typeof x.chiTiet === 'string' ? chuoi(x.chiTiet, 240) : dang.join(', '), dang } : null
}

function docNo(x: unknown): NoPh | null {
  if (!laDoiTuong(x)) return null
  const tongCau = nguyenKhongAm(x.tongCau)
  const ds = lapDanh(x.theoNgay, (e) => {
    if (!laDoiTuong(e)) return null
    const ngay = typeof e.ngay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.ngay) ? e.ngay : ''
    return ngay ? { ngay, loai: chuoi(e.loai, 40), ten: chuoi(e.ten, 140), soCau: nguyenKhongAm(e.soCau), phut: soKhongAm(e.phut) } : null
  }, 30)
  return tongCau !== null && tongCau > 0 && ds.length > 0 ? { theoNgay: ds, tongCau, tongPhut: soKhongAm(x.tongPhut) } : null
}

function docDangSo(x: unknown): DangSo | null {
  if (!laDoiTuong(x)) return null
  const ten = chuoi(x.ten, 140)
  const dung = nguyenKhongAm(x.dung)
  const tong = nguyenKhongAm(x.tong)
  if (!ten || dung === null || tong === null || tong <= 0 || dung > tong) return null
  return { ma: chuoi(x.ma, 80), ten, dung, tong, bac: bac012(x.bac) }
}

function docManYeu(x: unknown): DangManhYeu | null {
  if (!laDoiTuong(x)) return null
  const tenDang = chuoi(x.tenDang, 140)
  const dung = nguyenKhongAm(x.dung)
  const tong = nguyenKhongAm(x.tong)
  if (!tenDang || dung === null || tong === null || tong <= 0 || dung > tong) return null
  return { tenDang, dung, tong, bac: tenBac(x.bac) }
}

const lapDanh = <T,>(x: unknown, doc: (e: unknown) => T | null, toiDa: number): T[] => {
  const ra: T[] = []
  for (const e of mang(x)) {
    const v = doc(e)
    if (v) ra.push(v)
    if (ra.length >= toiDa) break
  }
  return ra
}

/** Thân `/ph/tat-ca-ve-con` ⇒ `PhMoi`; không phải thân của lệnh này (ok≠true, thiếu tên con) ⇒ null. */
export function docTatCaVeCon(raw: unknown): PhMoi | null {
  if (!laDoiTuong(raw) || raw.ok !== true) return null
  const hoTen = chuoi(raw.hoTen, 80)
  if (!hoTen) return null
  const hn = laDoiTuong(raw.homNay) ? raw.homNay : null
  const tb = laDoiTuong(raw.tienBo) ? raw.tienBo : null
  const nh = laDoiTuong(raw.nhipHoc) ? raw.nhipHoc : null
  const my = laDoiTuong(raw.manhYeu) ? raw.manhYeu : null
  const bt = laDoiTuong(raw.baiTapVeNha) ? raw.baiTapVeNha : null
  const lo = laDoiTuong(raw.lichOn) ? raw.lichOn : null
  const lb = laDoiTuong(raw.loiBoNao) ? raw.loiBoNao : null
  const gt = laDoiTuong(raw.giaoThem) ? raw.giaoThem : null
  const dc = laDoiTuong(raw.doCham) ? raw.doCham : null
  const dongTG = hn && Array.isArray(hn.dongThoiGian) ? lapDanh(hn.dongThoiGian, docMoc, 60).sort((a, b) => Date.parse(a.batDau) - Date.parse(b.batDau)) : null
  const cau = hn && Array.isArray(hn.cau) ? lapDanh(hn.cau, docCau, 120) : null
  const manYeu = my
    ? { lamTot: lapDanh(my.lamTot, docManYeu, 3), conVap: lapDanh(my.conVap, docManYeu, 3), lenBacHomNay: lapDanh(my.lenBacHomNay, (e) => (laDoiTuong(e) && chuoi(e.tenDang, 140) ? chuoi(e.tenDang, 140) : null), 12) }
    : null
  const nhip = nh
    ? {
        ngay: lapDanh(nh.ngay, (e) => {
          if (!laDoiTuong(e) || typeof e.ngay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.ngay)) return null
          const sc = nguyenKhongAm(e.soCau)
          // Ngày chỉ có câu bị che: máy chủ gửi soCau mà KHÔNG gửi soCauDung ⇒ giữ ngày (số câu vẫn thật), soCauDung = null (không "0 đúng" giả). Có gửi mà hỏng / lớn hơn soCau ⇒ bỏ cả ngày như cũ.
          const sd = e.soCauDung === undefined ? null : nguyenKhongAm(e.soCauDung)
          return sc === null || (e.soCauDung !== undefined && (sd === null || sd > sc)) ? null : { ngay: e.ngay, soCau: sc, soCauDung: sd }
        }, 14),
        gioThuongHoc: chuoi(nh.gioThuongHoc, 40),
        trungBinhCauMoiNgay: soKhongAm(nh.trungBinhCauMoiNgay),
        tongCau: nguyenKhongAm(nh.tongCau),
      }
    : null
  return {
    hoTen,
    serverNow: so(raw.serverNow),
    caGanNhat: docCaGanNhat(raw.caGanNhat),
    tienBo: tb
      ? {
          diem: lapDanh(tb.diem, (e) => {
            if (!laDoiTuong(e)) return null
            const d = soKhongAm(e.diem)
            const ngay = typeof e.ngay === 'string' ? e.ngay : ''
            return d === null || !ngay ? null : { ngay, diem: d, maCa: chuoi(e.maCa, 80), tenCa: chuoi(e.tenCa, 120) }
          }, 8),
          dangTienBoNhat: lapDanh(tb.dangTienBoNhat, (e) => {
            if (!laDoiTuong(e)) return null
            const ten = chuoi(e.ten, 140)
            const tu = so(e.tu)
            const den = so(e.den)
            return ten && tu !== null && den !== null ? { ma: chuoi(e.ma, 80), ten, tu, den } : null
          }, 3),
        }
      : null,
    tongQuan: hn ? docTongQuan(hn.tongQuan) : null,
    dongThoiGian: dongTG && dongTG.length > 0 ? dongTG : null,
    cau: cau && cau.length > 0 ? cau : null,
    nhipHoc: nhip && nhip.ngay.length > 0 ? nhip : null,
    bacTheoDang: Array.isArray(raw.bacTheoDang)
      ? lapDanh(raw.bacTheoDang, (e) => {
          if (!laDoiTuong(e)) return null
          const ten = chuoi(e.ten, 140)
          const b = bac012(e.bac)
          return ten && b !== null ? { ma: chuoi(e.ma, 80), ten, bac: b } : null
        }, 5)
      : null,
    dangVap: Array.isArray(raw.dangVap) ? lapDanh(raw.dangVap, docDangSo, 5) : null,
    vuaLenBac: Array.isArray(raw.vuaLenBac)
      ? lapDanh(raw.vuaLenBac, (e) => {
          if (!laDoiTuong(e)) return null
          const ten = chuoi(e.ten, 140)
          const tu = so(e.tu)
          const den = so(e.den)
          return ten && tu !== null && den !== null ? { ma: chuoi(e.ma, 80), ten, tu, den, ngay: typeof e.ngay === 'string' ? e.ngay : '' } : null
        }, 5)
      : null,
    manhYeu: manYeu && (manYeu.lamTot.length > 0 || manYeu.conVap.length > 0 || manYeu.lenBacHomNay.length > 0) ? manYeu : null,
    baiTapVeNha: bt
      ? {
          dangChay: lapDanh(bt.dangChay, (e) => {
            if (!laDoiTuong(e)) return null
            const ma = chuoi(e.maBtvn, 80)
            const han = iso(e.hanNop)
            const chang = Array.isArray(e.chang) ? lapDanh(e.chang, docChang, 12) : []
            return ma && han ? { maBtvn: ma, ten: chuoi(e.ten, 140) || 'Bài tập về nhà', hanNop: han, changXong: nguyenKhongAm(e.changXong), changTong: nguyenKhongAm(e.changTong), chang: chang.length > 0 ? chang : null } : null
          }, 5),
          gan: lapDanh(bt.gan, (e) => {
            if (!laDoiTuong(e)) return null
            const ma = chuoi(e.maBtvn, 80)
            const nop = iso(e.nopLuc)
            return ma && nop ? { maBtvn: ma, ten: chuoi(e.ten, 140) || 'Bài tập về nhà', nopLuc: nop, dungHan: typeof e.dungHan === 'boolean' ? e.dungHan : null, diem: soKhongAm(e.diem), nopTreGio: soKhongAm(e.nopTreGio) } : null
          }, 5),
        }
      : null,
    lichOn: lo && [lo.homNay, lo.ngayMai, lo.daKhacPhuc14Ngay, lo.conSaiChuaKhacPhuc].every((v) => nguyenKhongAm(v) !== null)
      ? {
          homNay: lo.homNay as number,
          ngayMai: lo.ngayMai as number,
          daKhacPhuc14Ngay: lo.daKhacPhuc14Ngay as number,
          conSaiChuaKhacPhuc: lo.conSaiChuaKhacPhuc as number,
          tongTungSai: nguyenKhongAm(lo.tongTungSai),
          bayNgayToi: Array.isArray(lo.bayNgayToi)
            ? (() => {
                const d = lapDanh(lo.bayNgayToi, (e) => (laDoiTuong(e) && typeof e.ngay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.ngay) && nguyenKhongAm(e.soCau) !== null ? { ngay: e.ngay, soCau: e.soCau as number } : null), 7)
                return d.length > 0 ? d : null
              })()
            : null,
          phutNgayMai: soKhongAm(lo.phutNgayMai),
        }
      : null,
    dieuDangMung: (() => {
      const d = hn && Array.isArray(hn.dieuDangMung) ? lapDanh(hn.dieuDangMung, docDieuMung, 3) : []
      return d.length > 0 ? d : null
    })(),
    aiDaLam: (() => {
      const d = hn && Array.isArray(hn.aiDaLam) ? lapDanh(hn.aiDaLam, docViecAi, 5) : []
      return d.length > 0 ? d : null
    })(),
    aiDaChuanBi: (() => {
      const d = hn && Array.isArray(hn.aiDaChuanBi) ? lapDanh(hn.aiDaChuanBi, docViecAi, 5) : []
      return d.length > 0 ? d : null
    })(),
    no: docNo(raw.no),
    phuHuynhLamGi: lapDanh(raw.phuHuynhLamGi, (e) => (typeof e === 'string' && e.trim() ? chuoi(e, 240) : null), 2),
    loiBoNao: lb && (chuoi(lb.loi, 600) || chuoi(lb.thuTuan, 900)) ? { loi: chuoi(lb.loi, 600), ngay: typeof lb.ngay === 'string' ? lb.ngay : '', thuTuan: chuoi(lb.thuTuan, 900) } : null,
    giaoThemConLai: gt ? nguyenKhongAm(gt.conLaiHomNay) : null,
    doCham: dc && nguyenKhongAm(dc.hang) !== null && nguyenKhongAm(dc.siSo) !== null && (dc.hang as number) >= 1 && (dc.siSo as number) >= (dc.hang as number) ? { hang: dc.hang as number, siSo: dc.siSo as number } : null,
  }
}

/** Lời giải có cấu trúc (chuẩn chung của app, chuan-hoa-loi-giai.ts): dòng Chốt, các bước đánh số, dòng Kết quả (+ lý do từng phương án nếu kho có). */
export interface LoiGiaiCT {
  chot: string
  buoc: string[]
  ketQua: string
  lyDo: { khoa: string; dung: boolean; ly: string }[]
}
/** `loiGiai` là CHỮ THUẦN đọc được (chuỗi thường giữ nguyên; lời giải có cấu trúc được dựng lại thành các dòng Chốt / Bước / Kết quả) — KHÔNG BAO GIỜ chứa JSON thô. `loiGiaiCT` chỉ có khi máy chủ gửi lời giải có cấu trúc. */
export type ChiTietCau = { kieu: 'ok'; de: string; phuongAn: string[]; dapAn: string; tenDang: string; loiGiai: string; loiGiaiCT: LoiGiaiCT | null } | { kieu: 'tu_choi'; chu: string; che: LyDoChe | null }

/**
 * Máy chủ (`ph-tat-ca-ve-con.ts`) gửi `loiGiai` = CHUỖI JSON của lời giải có cấu trúc ({chot, buoc[], ketQua, tung_pa…}); nhiều câu chỉ có chữ thường.
 * Chuỗi bắt đầu bằng `{` ⇒ đọc bằng bộ chuẩn CHUNG chuanHoaLoiGiaiCau (không tự nghĩ ra nội dung); đọc hỏng ⇒ KHÔNG hiện chuỗi rác (chữ rỗng ⇒ màn nói "chưa có lời giải").
 */
export function docLoiGiai(raw: unknown): { loiGiai: string; loiGiaiCT: LoiGiaiCT | null } {
  const s = typeof raw === 'string' ? raw.trim().slice(0, 8000) : ''
  if (!s) return { loiGiai: '', loiGiaiCT: null }
  if (!s.startsWith('{') && !s.startsWith('[')) return { loiGiai: s, loiGiaiCT: null }
  let obj: unknown
  try {
    obj = JSON.parse(s)
  } catch {
    return { loiGiai: '', loiGiaiCT: null }
  }
  if (!laDoiTuong(obj)) return { loiGiai: '', loiGiaiCT: null }
  const c = chuanHoaLoiGiaiCau(obj)
  const ketQua = chuoi(obj.ketQua ?? obj.ket_qua ?? obj.dapAn, 240)
  if (c.thieu && !ketQua) return { loiGiai: '', loiGiaiCT: null }
  const sach = (t: string) => !t.includes('[object Object]') // bộ chuẩn chung ép String() mọi phần tử: phần tử là object ⇒ bỏ, không in rác
  const ct: LoiGiaiCT = { chot: sach(c.chot) ? c.chot : '', buoc: (c.buoc ?? []).filter(sach), ketQua, lyDo: (c.lyDo ?? []).filter((l) => l.ly && sach(l.ly)) }
  const chu = [ct.chot, ...ct.buoc.map((b, i) => `Bước ${i + 1}: ${b}`), ct.ketQua ? `Kết quả: ${ct.ketQua}` : ''].filter(Boolean).join('\n')
  return { loiGiai: chu, loiGiaiCT: chu ? ct : null }
}

/** Thân `/ph/chi-tiet-cau-ve-con`. `ok:false` ⇒ từ chối kèm LỜI THẬT của máy chủ; thân lạ ⇒ null. */
export function docChiTietCau(raw: unknown): ChiTietCau | null {
  if (!laDoiTuong(raw)) return null
  if (raw.ok === false) return { kieu: 'tu_choi', chu: chuoi(raw.error, 240) || 'Chưa xem được lời giải của câu này.', che: lyDoChe(raw.che) }
  if (raw.ok !== true) return null
  const de = chuoi(raw.de, 4000)
  const dapAn = chuoi(raw.dapAn, 80)
  if (!de || !dapAn) return null
  return { kieu: 'ok', de, phuongAn: lapDanh(raw.phuongAn, (e) => (typeof e === 'string' && e.trim() ? chuoi(e, 600) : null), 8), dapAn, tenDang: chuoi(raw.tenDang, 140), ...docLoiGiai(raw.loiGiai) }
}
