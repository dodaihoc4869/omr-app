// MÔ PHỎNG HỌC SINH CÓ ĐÁP ÁN — thước tự đo cho đánh giá 4 bảng v2 (thầy 01/11: «tự đo tự làm tất tự tối ưu và phải đạt 99%»).
// Mỗi kiểu em có TẬP BẢNG ĐƯỢC PHÉP (xếp vào bảng ngoài tập ⇒ SAI) và bảng PHẢI CÓ (để đo độ phủ). Có cả các kiểu DỄ BỊ XẾP OAN: em giỏi làm nhanh, em hay bị
// thông báo kéo ra khỏi app, em dồn hạn, em chăm mà yếu. Số liệu sinh theo phân bố sát thực tế (36 câu/ngày, 14 ngày, độ khó câu, thời gian đọc đề theo phần).
import { danhGiaEm, type DauVaoDanhGia, type LuotDanhGia } from '../server/src/danh-gia-hoc-that'
import type { DauVaoBon, NgayNhip } from '../server/src/bon-chi-so'
import type { MaBang } from '../src/lib/bon-bang-kieu'

export type Rng = () => number
/** PRNG xác định (mulberry32) — cùng hạt ⇒ cùng bộ em. */
export function taoRng(hat: number): Rng {
  let a = hat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const giua = (r: Rng, a: number, b: number) => a + (b - a) * r()
const nguyen = (r: Rng, a: number, b: number) => Math.floor(giua(r, a, b + 1))
const kep01 = (x: number) => Math.max(0.02, Math.min(0.98, x))

export const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(18 + i)}`)
export const DEN = NGAY[13]!

export type Kieu =
  | 'ht' | 'ht_yeu' | 'ht_it_ngay' | 'gioi_nhanh' | 'ht_thong_bao'
  | 'dp_voi' | 'dp_tra' | 'dp_lap' | 'dp_treo'
  | 'cham_yeu' | 'trung_binh' | 'don_han'
  | 'luoi_han' | 'luoi_mot_phan'

/** Bảng được phép (ngoài tập ⇒ xếp SAI) · bảng phải có (đo độ phủ). */
export const NHAN: Record<Kieu, { duoc: MaBang[]; phai: MaBang[]; mo: string }> = {
  ht: { duoc: ['ht', 'ch'], phai: ['ht', 'ch'], mo: 'Học thật, chăm: đọc kỹ, sửa câu sai bằng câu song sinh, kiểm tra khớp' },
  ht_yeu: { duoc: ['ht', 'ch'], phai: ['ch'], mo: 'Học thật nhưng yếu: đúng ít, vẫn sửa sai đều, kiểm tra thấp nhưng khớp luyện tập' },
  ht_it_ngay: { duoc: ['ht'], phai: ['ht'], mo: 'Học thật, nghỉ 3–5 ngày (không đều ⇒ chưa phải Chăm)' },
  gioi_nhanh: { duoc: ['ht', 'ch'], phai: [], mo: 'Giỏi, làm NHANH mà đúng cả câu khó, kiểm tra 9–10 (không được thành Đối phó)' },
  ht_thong_bao: { duoc: ['ht', 'ch'], phai: [], mo: 'Học thật nhưng hay bị thông báo kéo ra khỏi app vài giây (không được thành Đối phó)' },
  dp_voi: { duoc: ['dp'], phai: ['dp'], mo: 'Đối phó: chọn trước khi đọc hết đề, sai nhiều, không sửa, kiểm tra thấp' },
  dp_tra: { duoc: ['dp'], phai: ['dp'], mo: 'Đối phó: rời app tra đáp án rồi chọn đúng, luyện cao mà kiểm tra thấp' },
  dp_lap: { duoc: ['dp'], phai: ['dp'], mo: 'Đối phó: bấm một chữ liền nhiều câu + chọn vội' },
  dp_treo: { duoc: ['dp'], phai: [], mo: 'Đối phó: treo máy cho đủ giờ + chọn vội' },
  cham_yeu: { duoc: ['ch', 'ht'], phai: ['ch'], mo: 'Chăm, làm thật nhưng yếu, sửa sai một phần' },
  trung_binh: { duoc: ['ch', 'ht'], phai: [], mo: 'Trung bình, lẫn lộn — phần lớn nên «Đang theo dõi»' },
  don_han: { duoc: ['ht'], phai: [], mo: 'Làm đủ nhưng dồn hết sau 23:00 (không được Chăm)' },
  luoi_han: { duoc: ['lu'], phai: ['lu'], mo: 'Lười hẳn: 0–3 ngày có làm' },
  luoi_mot_phan: { duoc: ['lu', 'ht'], phai: [], mo: 'Lười một phần: nghỉ 6–9/14 ngày' },
}
export const CAC_KIEU = Object.keys(NHAN) as Kieu[]

interface ThamSo {
  nangLuc: number; ngayLam: number; voi: number; voiDung: number; sua: number; an: number; anDung: boolean; treo: number
  lap: number; donHan: boolean; nhanh: boolean; ktLech: number | null; hoi: number; vuot: number
}
function thamSo(k: Kieu, r: Rng): ThamSo {
  const c: ThamSo = { nangLuc: giua(r, 0.45, 0.8), ngayLam: 14, voi: giua(r, 0, 0.04), voiDung: 0.3, sua: giua(r, 0.82, 0.97), an: giua(r, 0, 0.03), anDung: false, treo: 0,
    lap: 0, donHan: false, nhanh: false, ktLech: giua(r, -0.8, 0.8), hoi: nguyen(r, 0, 2), vuot: nguyen(r, 0, 6) }
  switch (k) {
    case 'ht': return c
    case 'ht_yeu': return { ...c, nangLuc: giua(r, 0.12, 0.3), sua: giua(r, 0.72, 0.92) }
    case 'ht_it_ngay': return { ...c, ngayLam: nguyen(r, 9, 11) }
    case 'gioi_nhanh': return { ...c, nangLuc: giua(r, 0.88, 0.98), nhanh: true, ktLech: giua(r, 0, 0.6), sua: giua(r, 0.9, 1) }
    case 'ht_thong_bao': return { ...c, an: giua(r, 0.12, 0.22) }
    case 'dp_voi': return { ...c, nangLuc: giua(r, 0.25, 0.6), voi: giua(r, 0.3, 0.6), voiDung: 0.25, sua: giua(r, 0, 0.3), ktLech: null, hoi: 0, vuot: 0, ngayLam: nguyen(r, 11, 14) }
    case 'dp_tra': return { ...c, nangLuc: giua(r, 0.2, 0.45), an: giua(r, 0.45, 0.75), anDung: true, voi: giua(r, 0.03, 0.1), sua: giua(r, 0.5, 0.9), ktLech: -giua(r, 3, 4.5), hoi: 0, ngayLam: nguyen(r, 12, 14) }
    case 'dp_lap': return { ...c, nangLuc: giua(r, 0.25, 0.55), lap: nguyen(r, 2, 6), voi: giua(r, 0.15, 0.35), voiDung: 0.25, sua: giua(r, 0, 0.4), ktLech: null, hoi: 0, ngayLam: nguyen(r, 11, 14) }
    case 'dp_treo': return { ...c, nangLuc: giua(r, 0.3, 0.6), treo: giua(r, 0.1, 0.2), voi: giua(r, 0.12, 0.25), voiDung: 0.25, sua: giua(r, 0.1, 0.5), ktLech: null, hoi: 0, ngayLam: nguyen(r, 12, 14) }
    case 'cham_yeu': return { ...c, nangLuc: giua(r, 0.12, 0.3), sua: giua(r, 0.35, 0.6), ktLech: giua(r, -1, 0.5) }
    case 'trung_binh': return { ...c, nangLuc: giua(r, 0.35, 0.6), voi: giua(r, 0.06, 0.12), voiDung: 0.4, sua: giua(r, 0.4, 0.75), ngayLam: nguyen(r, 12, 14), an: giua(r, 0, 0.06), hoi: nguyen(r, 0, 1) }
    case 'don_han': return { ...c, donHan: true, voi: giua(r, 0.05, 0.1), voiDung: 0.4, sua: giua(r, 0.4, 0.85), vuot: 0 }
    case 'luoi_han': return { ...c, ngayLam: nguyen(r, 0, 3), sua: giua(r, 0, 0.3), ktLech: null, hoi: 0, vuot: 0 }
    case 'luoi_mot_phan': return { ...c, ngayLam: nguyen(r, 5, 8), sua: giua(r, 0.1, 0.6), ktLech: null, vuot: 0 }
  }
}

/** Sinh MỘT em theo kiểu ⇒ đầu vào của tinhBon (đi qua đúng bộ Học thật danhGiaEm như máy chủ). */
export function taoEm(k: Kieu, r: Rng, ma = 'X'): DauVaoBon {
  const t = thamSo(k, r)
  const muc = nguyen(r, 24, 40)
  const ngayLam = new Set([...NGAY].sort(() => r() - 0.5).slice(0, t.ngayLam))
  const luot: LuotDanhGia[] = []
  const ngay: NgayNhip[] = []
  let dem = 0
  const saiCho: { cau: string; ngay: number }[] = []
  const KT: number[] = []
  NGAY.forEach((n, d) => {
    if (!ngayLam.has(n)) { ngay.push({ ngay: n, muc, lam: 0 }); return }
    const so = muc + (r() < 0.5 ? t.vuot : 0)
    const gioDau = t.donHan ? 23 * 60 + nguyen(r, 0, 10) : nguyen(r, 15 * 60, 20 * 60)
    let phut = gioDau
    let conLap = t.lap > 0 && r() < t.lap / 6 ? nguyen(r, 6, 11) : 0
    const chuLap = 'ABCD'[nguyen(r, 0, 3)]!
    // câu song sinh của câu từng sai (1–4 ngày trước)
    const den = saiCho.filter((x) => d - x.ngay >= 1 && d - x.ngay <= 4)
    for (let i = 0; i < so; i++) {
      dem++
      const phan: LuotDanhGia['phan'] = r() < 0.7 ? 'I' : r() < 0.66 ? 'II' : 'III'
      const pLop = giua(r, 0.15, 0.9)
      const giayDoc = phan === 'I' ? giua(r, 12, 24) : phan === 'II' ? giua(r, 25, 45) : giua(r, 30, 60)
      let songSinh = false
      let cau = `${ma}-C${dem}`
      if (den.length && r() < 0.35) { const x = den.shift()!; saiCho.splice(saiCho.indexOf(x), 1); cau = x.cau; songSinh = true }
      const voi = conLap > 0 || r() < t.voi
      const treo = !voi && r() < t.treo
      const an = !voi && !treo && r() < t.an ? giua(r, 9, t.anDung ? 60 : 20) : r() < 0.2 ? giua(r, 0, 4) : 0
      const pDung = songSinh ? (r() < t.sua ? 0.97 : 0.15) : voi ? t.voiDung : an > 8 && t.anDung ? 0.95 : kep01(pLop + (t.nangLuc - 0.5) * 0.9)
      const dung = r() < pDung
      const giay = treo ? giua(r, 400, 900) : voi ? giua(r, 2, Math.min(7, giayDoc * 0.5)) : t.nhanh ? giayDoc * giua(r, 0.75, 1.1) : giayDoc * giua(r, 1.15, 2.6)
      const chon = phan === 'I' ? (conLap > 0 ? chuLap : 'ABCD'[nguyen(r, 0, 3)]!) : null
      if (conLap > 0) conLap--
      phut += Math.max(1, giay / 60 + giua(r, 0, 1.5))
      const gio = t.donHan ? Math.min(phut, 23 * 60 + 58) : phut
      const luc = new Date(Date.parse(`${n}T00:00:00Z`) - 7 * 3_600_000 + gio * 60_000).toISOString()
      const ma4: LuotDanhGia['ma'] = treo ? 3 : giay < giayDoc ? (t.nhanh && dung ? 2 : 1) : giay < giayDoc * 1.3 ? 2 : 3
      luot.push({ phan, dung, cau, ma: ma4, thuoc: t.nhanh && dung && giay < giayDoc, treo: treo ? 'treo' : null, r: giay / giayDoc, pLop, chon, coGoiY: false, songSinh,
        ngay: n, luc, giay, giayDoc, qid: cau, an })
      if (!dung && !songSinh) saiCho.push({ cau, ngay: d })
    }
    ngay.push({ ngay: n, muc, lam: so })
  })
  const dungLuyen = luot.length ? luot.filter((l) => l.dung).length / luot.length : 0
  if (t.ktLech !== null && luot.length) KT.push(Math.max(0, Math.min(10, dungLuyen * 10 + t.ktLech)))
  const dauVao: DauVaoDanhGia = { luot, ngayCuaSo: NGAY, ktcn: { daNop: KT.length, boHan: k === 'luoi_han' ? 2 : 0, diem: KT }, thi: [], gianLanXacNhan: 0 }
  return { dg: { kq: danhGiaEm(dauVao), dauVao }, ngay, lanCuoiHoc: [...ngayLam].sort().pop() ?? '', den: DEN, hoi: t.hoi }
}
