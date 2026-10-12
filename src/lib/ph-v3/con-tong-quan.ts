// LÀN PHỤ HUYNH 12/10 — lớp ĐỌC CHẶT của `POST /ph/con-tong-quan` (hợp đồng server/src/ph-con-tong-quan-kieu.ts, chỉ import KIỂU).
// Cùng nguyên tắc với du-lieu.ts: khối sai dạng ⇒ VẮNG hoặc bỏ dòng (không bịa 0), không ném lỗi. Chữ gợi ý nhắc do máy chủ sinh theo luật — app chỉ hiện.
import type {
  CauSaiCon, DemCau, GoiYNhac, KetQuaConTongQuan, KhoangGiay, LuotGanDay, MaGoiY, NgayHoc, NguonGiay, ThoiGianLam, TrangThaiNgay,
} from '../../../server/src/ph-con-tong-quan-kieu'

export type { CauSaiCon, DemCau, GoiYNhac, KhoangGiay, LuotGanDay, NgayHoc, ThoiGianLam }
export type ConTongQuan = Omit<KetQuaConTongQuan, 'ok'>

const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const nguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : null)
const soDuong = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null)
const chuoi = (x: unknown, tran = 200): string => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, tran) : '')
const mang = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const ngayChuoi = (x: unknown): string => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : '')
const iso = (x: unknown): string => (typeof x === 'string' && Number.isFinite(Date.parse(x)) ? x : '')
const MA_GOI_Y: readonly MaGoiY[] = ['con-cau-hom-nay', 'chua-lam-hom-nay', 'nhanh-sai', 'sai-chua-sua', 'thieu-ngay', 'lam-khuya', 'ti-le-giam', 'dung-goi-y']
const TRANG_THAI: readonly TrangThaiNgay[] = ['du', 'thieu', 'khong']

function docDem(x: unknown): DemCau | null {
  if (!laDoiTuong(x)) return null
  const soLuot = nguyen(x.soLuot), dung = nguyen(x.dung), sai = nguyen(x.sai), boTrong = nguyen(x.boTrong), soCau = nguyen(x.soCau)
  if (soLuot === null || dung === null || sai === null || boTrong === null || soCau === null || dung + sai + boTrong !== soLuot) return null
  return { soLuot, dung, sai, boTrong, soCau, giayTb: soDuong(x.giayTb) }
}

function docNgay(x: unknown): NgayHoc | null {
  if (!laDoiTuong(x)) return null
  const ngay = ngayChuoi(x.ngay)
  const dung = nguyen(x.dung), sai = nguyen(x.sai), boTrong = nguyen(x.boTrong), soCau = nguyen(x.soCau)
  const muc = nguyen(x.muc), canLam = nguyen(x.canLam), daLam = nguyen(x.daLam)
  const trangThai = TRANG_THAI.find((t) => t === x.trangThai)
  if (!ngay || dung === null || sai === null || boTrong === null || soCau === null || muc === null || canLam === null || daLam === null || !trangThai) return null
  return { ngay, dung, sai, boTrong, soCau, muc, mucUocTinh: x.mucUocTinh === true, daXep: nguyen(x.daXep), canLam, daLam, trangThai, homNay: x.homNay === true }
}

const docNguonGiay = (x: unknown): NguonGiay => (x === 'do' || x === 'uoc' ? x : null)

function docThoiGian(x: unknown): ThoiGianLam | null {
  if (!laDoiTuong(x)) return null
  const soDo = nguyen(x.soDo), soUoc = nguyen(x.soUoc), soChuaDo = nguyen(x.soChuaDo)
  if (soDo === null || soUoc === null || soChuaDo === null) return null
  const phanBo: KhoangGiay[] = []
  for (const k of mang(x.phanBo)) {
    if (!laDoiTuong(k)) continue
    const tu = nguyen(k.tu), so = nguyen(k.so), sai = nguyen(k.sai)
    const den = k.den === null ? null : nguyen(k.den)
    if (tu === null || so === null || sai === null || sai > so || (den !== null && den <= tu)) continue
    phanBo.push({ tu, den, so, sai })
  }
  const nh = laDoiTuong(x.nhanh) ? x.nhanh : null
  const nSo = nguyen(nh?.so), nSai = nguyen(nh?.sai)
  return {
    giayTb: soDuong(x.giayTb), giayGiua: soDuong(x.giayGiua), soDo, soUoc, soChuaDo, phanBo,
    nhanh: { so: nSo ?? 0, sai: nSo !== null && nSai !== null && nSai <= nSo ? nSai : 0 },
  }
}

function docLuot(x: unknown): LuotGanDay | null {
  if (!laDoiTuong(x)) return null
  const luc = iso(x.luc)
  if (!luc) return null
  const giay = soDuong(x.giay)
  return {
    luc, tieuDe: chuoi(x.tieuDe, 160), noi: chuoi(x.noi, 60), dung: x.dung === true ? true : x.dung === false ? false : null,
    giay: giay !== null ? Math.round(giay) : null, nguonGiay: giay !== null ? docNguonGiay(x.nguonGiay) ?? 'do' : null, coGoiY: x.coGoiY === true,
  }
}

function docCauSai(x: unknown): CauSaiCon | null {
  if (!laDoiTuong(x)) return null
  const soSai = nguyen(x.soSai), lanCuoi = iso(x.lanCuoi)
  if (soSai === null || soSai < 1 || !lanCuoi) return null
  return { tieuDe: chuoi(x.tieuDe, 160), soSai, lanCuoi, daSua: x.daSua === true }
}

/** Phản hồi hợp lệ ⇒ dữ liệu; thiếu khối bắt buộc (ok, dem, ngay) ⇒ null (màn giữ khối cũ, không dựng số giả). */
export function docConTongQuan(raw: unknown): ConTongQuan | null {
  if (!laDoiTuong(raw) || raw.ok !== true || !laDoiTuong(raw.dem)) return null
  const homNay = ngayChuoi(raw.homNay)
  const dHomNay = docDem(raw.dem.homNay), dBay = docDem(raw.dem.bayNgay), dMoc = docDem(raw.dem.tuMoc)
  if (!homNay || !dHomNay || !dBay || !dMoc) return null
  const ngay = mang(raw.ngay).map(docNgay).filter((n): n is NgayHoc => n !== null && n.ngay <= homNay).sort((a, b) => (a.ngay < b.ngay ? -1 : 1))
  const thoiGian = docThoiGian(raw.thoiGian) ?? { giayTb: null, giayGiua: null, soDo: 0, soUoc: 0, soChuaDo: 0, phanBo: [], nhanh: { so: 0, sai: 0 } }
  const cs = laDoiTuong(raw.cauSai) ? raw.cauSai : {}
  const ds = mang(cs.ds).map(docCauSai).filter((c): c is CauSaiCon => c !== null)
  const tongSai = Math.max(nguyen(cs.tong) ?? 0, ds.length)
  const daSua = Math.min(nguyen(cs.daSua) ?? ds.filter((c) => c.daSua).length, tongSai)
  const kh = laDoiTuong(raw.khuya) ? raw.khuya : {}
  const gy = laDoiTuong(raw.goiYDaDung) ? raw.goiYDaDung : {}
  const goiY: GoiYNhac[] = []
  for (const g of mang(raw.goiY)) {
    if (!laDoiTuong(g)) continue
    const ma = MA_GOI_Y.find((m) => m === g.ma)
    const chu = chuoi(g.chu, 240)
    if (ma && chu && !goiY.some((x) => x.ma === ma)) goiY.push({ ma, chu })
  }
  return {
    serverNow: typeof raw.serverNow === 'number' && Number.isFinite(raw.serverNow) ? raw.serverNow : Date.now(),
    homNay,
    moc: ngayChuoi(raw.moc) || '2026-10-12',
    tuNgay: ngayChuoi(raw.tuNgay) || (ngay[0]?.ngay ?? homNay),
    dem: { homNay: dHomNay, bayNgay: dBay, tuMoc: dMoc },
    ngay,
    thoiGian,
    ganDay: mang(raw.ganDay).map(docLuot).filter((l): l is LuotGanDay => l !== null).slice(0, 30),
    cauSai: { tong: tongSai, daSua, chuaSua: tongSai - daSua, ds },
    khuya: { soNgay: nguyen(kh.soNgay) ?? 0, soLuot: nguyen(kh.soLuot) ?? 0 },
    goiYDaDung: { so: nguyen(gy.so) ?? 0, tong: nguyen(gy.tong) ?? 0 },
    goiY: goiY.slice(0, 5),
    catBot: raw.catBot === true,
  }
}

/** Tỉ lệ đúng (0–100, làm tròn) trên các lượt có kết quả; chưa có lượt ⇒ null. */
export function tiLeDung(d: { dung: number; sai: number }): number | null {
  const n = d.dung + d.sai
  return n > 0 ? Math.round((d.dung / n) * 100) : null
}

/** "45 giây" · "1 phút 20 giây"; ước tính ⇒ "≈45 giây"; không đo ⇒ "chưa đo giờ". */
export function chuGiay(giay: number | null, nguon: NguonGiay = 'do'): string {
  if (giay === null) return 'chưa đo giờ'
  const g = Math.max(1, Math.round(giay))
  const p = Math.floor(g / 60), s = g % 60
  const chu = p === 0 ? `${s} giây` : s === 0 ? `${p} phút` : `${p} phút ${s} giây`
  return nguon === 'uoc' ? `≈${chu}` : chu
}

/** Nhãn khoảng giây của phân bố: "Dưới 8 giây" · "8–30 giây" · "1–2 phút" · "Từ 5 phút". */
export function nhanKhoangGiay(k: { tu: number; den: number | null }): string {
  const ghi = (g: number) => (g >= 60 && g % 60 === 0 ? `${g / 60}` : `${g}`)
  const donVi = (g: number) => (g >= 60 && g % 60 === 0 ? 'phút' : 'giây')
  if (k.tu === 0 && k.den !== null) return `Dưới ${ghi(k.den)} ${donVi(k.den)}`
  if (k.den === null) return `Từ ${ghi(k.tu)} ${donVi(k.tu)}`
  if (donVi(k.tu) === donVi(k.den)) return `${ghi(k.tu)}–${ghi(k.den)} ${donVi(k.den)}`
  return `${k.tu} giây–${ghi(k.den)} ${donVi(k.den)}`
}
