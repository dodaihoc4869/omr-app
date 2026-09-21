// APP PHỤ HUYNH MỚI — lớp ĐỌC CHẶT hai lệnh máy chủ (đã soát; server/src/ph-tat-ca-ve-con.ts):
//   POST /ph/tat-ca-ve-con {pass|sbd}        ⇒ mọi thứ về con hôm nay (mỗi khối có thể VẮNG: khối nào không có số thật thì máy chủ không gửi)
//   POST /ph/chi-tiet-cau-ve-con {pass|sbd, qid} ⇒ lời giải của MỘT câu con đã làm
// Nguyên tắc: (1) khối nào sai dạng ⇒ VẮNG (màn ẩn, không bịa 0/mảng rỗng giả); (2) CÂU BỊ CHE (`che`) chỉ giữ {luc, nguon, che, giay?} — mọi trường khác (đề, đáp án, đúng/sai, tên dạng, mã câu) BỊ BỎ
// dù JSON lỡ có: điện thoại phụ huynh không được thành đường lộ đáp án; (3) không trường nào của game (thần thú, EXP, khiên…) được đi qua đây; (4) không ném lỗi.
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
export interface TongQuan {
  soCau: number | null
  soDung: number | null
  phutHoc: number | null
  datNhiemVu: boolean | null
  chuoiNgayHoc: number | null
  soVoiHomQua: { soCau: number; tiLeDung: number } | null
}
export interface MocThoiGian { batDau: string; nguon: NguonHien; ten: string; soCau: number | null; soDung: number | null; che: LyDoChe | null; phut: number; ghiChu: string }
export interface CauChe { kieu: 'che'; luc: string; nguon: NguonHien; che: LyDoChe; giay: number | null }
export interface CauThuong { kieu: 'thuong'; luc: string; nguon: NguonHien; tenDang: string; de: string; conChon: string; dapAn: string; dung: boolean | null; giay: number | null; coLoiGiai: boolean; qid: string }
export type CauHomNay = CauChe | CauThuong
export interface DangSo { ma: string; ten: string; dung: number; tong: number; bac: 0 | 1 | 2 | null }
export interface DangManhYeu { tenDang: string; dung: number; tong: number; bac: TenBac | null }
export interface BtvnDangChay { maBtvn: string; ten: string; hanNop: string; changXong: number | null; changTong: number | null }
export interface BtvnGan { maBtvn: string; ten: string; nopLuc: string; dungHan: boolean | null; diem: number | null }
export interface PhMoi {
  hoTen: string
  serverNow: number | null
  caGanNhat: CaGanNhat | null
  tienBo: { diem: DiemTienBo[]; dangTienBoNhat: DangTienBo[] } | null
  tongQuan: TongQuan | null
  dongThoiGian: MocThoiGian[] | null
  cau: CauHomNay[] | null
  nhipHoc: { ngay: { ngay: string; soCau: number; soCauDung: number }[]; gioThuongHoc: string } | null
  bacTheoDang: { ma: string; ten: string; bac: 0 | 1 | 2 }[] | null
  dangVap: DangSo[] | null
  vuaLenBac: { ma: string; ten: string; tu: number; den: number; ngay: string }[] | null
  manhYeu: { lamTot: DangManhYeu[]; conVap: DangManhYeu[]; lenBacHomNay: string[] } | null
  baiTapVeNha: { dangChay: BtvnDangChay[]; gan: BtvnGan[] } | null
  lichOn: { homNay: number; ngayMai: number; daKhacPhuc14Ngay: number; conSaiChuaKhacPhuc: number } | null
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

function docTongQuan(x: unknown): TongQuan | null {
  if (!laDoiTuong(x)) return null
  const v = laDoiTuong(x.soVoiHomQua) ? x.soVoiHomQua : null
  const t: TongQuan = {
    soCau: nguyenKhongAm(x.soCau),
    soDung: nguyenKhongAm(x.soDung),
    phutHoc: soKhongAm(x.phutHoc),
    datNhiemVu: typeof x.datNhiemVu === 'boolean' ? x.datNhiemVu : null,
    chuoiNgayHoc: nguyenKhongAm(x.chuoiNgayHoc),
    soVoiHomQua: v && nguyenKhongAm(v.soCau) !== null && soKhongAm(v.tiLeDung) !== null && (v.tiLeDung as number) <= 1 ? { soCau: v.soCau as number, tiLeDung: v.tiLeDung as number } : null,
  }
  const co = t.soCau !== null || t.soDung !== null || t.phutHoc !== null || t.datNhiemVu !== null || t.chuoiNgayHoc !== null
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
  return { batDau, nguon: ng, ten: chuoi(x.ten, 140), soCau, soDung: soDung !== null && soCau !== null && soDung <= soCau ? soDung : null, che, phut: Math.max(1, phut), ghiChu }
}

function docCau(x: unknown): CauHomNay | null {
  if (!laDoiTuong(x)) return null
  const luc = iso(x.luc)
  const ng = nguon(x.nguon)
  if (!luc || !ng) return null
  const che = lyDoChe(x.che)
  const giayRaw = soKhongAm(x.giay)
  const giay = giayRaw !== null && giayRaw > 0 ? giayRaw : null
  if (che) return { kieu: 'che', luc, nguon: ng, che, giay } // CHỈ bốn trường này — mọi thứ khác bị bỏ
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
  }
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
          const sd = nguyenKhongAm(e.soCauDung)
          return sc === null || sd === null || sd > sc ? null : { ngay: e.ngay, soCau: sc, soCauDung: sd }
        }, 14),
        gioThuongHoc: chuoi(nh.gioThuongHoc, 40),
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
            return ma && han ? { maBtvn: ma, ten: chuoi(e.ten, 140) || 'Bài tập về nhà', hanNop: han, changXong: nguyenKhongAm(e.changXong), changTong: nguyenKhongAm(e.changTong) } : null
          }, 5),
          gan: lapDanh(bt.gan, (e) => {
            if (!laDoiTuong(e)) return null
            const ma = chuoi(e.maBtvn, 80)
            const nop = iso(e.nopLuc)
            return ma && nop ? { maBtvn: ma, ten: chuoi(e.ten, 140) || 'Bài tập về nhà', nopLuc: nop, dungHan: typeof e.dungHan === 'boolean' ? e.dungHan : null, diem: soKhongAm(e.diem) } : null
          }, 5),
        }
      : null,
    lichOn: lo && [lo.homNay, lo.ngayMai, lo.daKhacPhuc14Ngay, lo.conSaiChuaKhacPhuc].every((v) => nguyenKhongAm(v) !== null)
      ? { homNay: lo.homNay as number, ngayMai: lo.ngayMai as number, daKhacPhuc14Ngay: lo.daKhacPhuc14Ngay as number, conSaiChuaKhacPhuc: lo.conSaiChuaKhacPhuc as number }
      : null,
    phuHuynhLamGi: lapDanh(raw.phuHuynhLamGi, (e) => (typeof e === 'string' && e.trim() ? chuoi(e, 240) : null), 2),
    loiBoNao: lb && (chuoi(lb.loi, 600) || chuoi(lb.thuTuan, 900)) ? { loi: chuoi(lb.loi, 600), ngay: typeof lb.ngay === 'string' ? lb.ngay : '', thuTuan: chuoi(lb.thuTuan, 900) } : null,
    giaoThemConLai: gt ? nguyenKhongAm(gt.conLaiHomNay) : null,
    doCham: dc && nguyenKhongAm(dc.hang) !== null && nguyenKhongAm(dc.siSo) !== null && (dc.hang as number) >= 1 && (dc.siSo as number) >= (dc.hang as number) ? { hang: dc.hang as number, siSo: dc.siSo as number } : null,
  }
}

export type ChiTietCau = { kieu: 'ok'; de: string; phuongAn: string[]; dapAn: string; tenDang: string; loiGiai: string } | { kieu: 'tu_choi'; chu: string; che: LyDoChe | null }

/** Thân `/ph/chi-tiet-cau-ve-con`. `ok:false` ⇒ từ chối kèm LỜI THẬT của máy chủ; thân lạ ⇒ null. */
export function docChiTietCau(raw: unknown): ChiTietCau | null {
  if (!laDoiTuong(raw)) return null
  if (raw.ok === false) return { kieu: 'tu_choi', chu: chuoi(raw.error, 240) || 'Chưa xem được lời giải của câu này.', che: lyDoChe(raw.che) }
  if (raw.ok !== true) return null
  const de = chuoi(raw.de, 4000)
  const dapAn = chuoi(raw.dapAn, 80)
  if (!de || !dapAn) return null
  return { kieu: 'ok', de, phuongAn: lapDanh(raw.phuongAn, (e) => (typeof e === 'string' && e.trim() ? chuoi(e, 600) : null), 8), dapAn, tenDang: chuoi(raw.tenDang, 140), loiGiai: typeof raw.loiGiai === 'string' ? raw.loiGiai.trim().slice(0, 8000) : '' }
}
