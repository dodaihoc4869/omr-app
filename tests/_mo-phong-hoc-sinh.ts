// MÔ PHỎNG HỌC SINH CÓ ĐÁP ÁN — thước tự đo cho đánh giá 4 bảng v2 (thầy 01/11: «tự đo tự làm tất tự tối ưu và phải đạt 99%»).
// Mỗi kiểu em có TẬP BẢNG ĐƯỢC PHÉP (xếp vào bảng ngoài tập ⇒ SAI) và bảng PHẢI CÓ (để đo độ phủ). Có cả các kiểu DỄ BỊ XẾP OAN: em giỏi làm nhanh, em hay bị
// thông báo kéo ra khỏi app, em dồn hạn, em chăm mà yếu. Số liệu sinh theo phân bố sát thực tế (36 câu/ngày, 14 ngày, độ khó câu, thời gian đọc đề theo phần).
// Đợt 2 (01/11): mỗi lượt có thêm số đo máy em (src/lib/doi-dap-an.ts) — dd đổi lựa chọn · dq số phương án đã thử (Phần I) · rn số lần rời app · ar giây rời app
// trong 30 giây ngay trước lựa chọn cuối. Em thật: thỉnh thoảng đổi một lần (dd 0–1, dq ≤ 2; em yếu hiếm khi phân vân 3 phương án); em bị thông báo kéo ra:
// rn > 0 nhưng ar gần như luôn 0 (quay lại còn đọc tiếp); em tra ngoài: rời rồi quay lại chọn ngay (ar lớn); em DÒ ĐÁP ÁN (`dp_do`): thử 3–4 phương án nhiều lượt.
// v3 (02/11, thầy: «Làm luôn với ca thi thật rồi đếm lại … tính từng câu từng đơn vị kiến thức … thêm phần lên bảng đạt và chưa đạt»): mỗi em có thêm
//   · ĐƠN VỊ KIẾN THỨC cho từng câu (10 chuyên đề theo lịch dạy: mỗi ngày 1–4 chuyên đề đang học) và năng lực RIÊNG từng đơn vị;
//   · luyện tập 28 ngày TRƯỚC cửa sổ 14 ngày (gộp theo ngày × đơn vị, như máy chủ đọc `luyenCu`);
//   · 0–5 CA THI thật trong 6 tuần: mỗi ca 3–4 đơn vị đã học, mỗi đơn vị 4–8 câu, tỉ lệ đúng cả lớp của câu (độ khó) + mức độ; em làm theo NĂNG LỰC THẬT
//     (gian lận ở luyện tập không mang vào phòng thi được);
//     Nhiễu thật cho MỌI kiểu: mỗi ca một «ngày phong độ» ±6 điểm %, và QUÊN (đơn vị học xong càng lâu trước ca càng tụt, tới 9 điểm %);
//   · 0–5 lần LÊN BẢNG / KIỂM TRA ĐẦU GIỜ (Đạt / Chưa đạt): em thật đạt theo năng lực; em đối phó «biết trước đáp án» hỏi lại câu đã làm đúng thì thường chưa đạt.
//   Kiểu khó mới: `dp_thuoc` (biết trước đáp án — luyện đúng ~88% tốc độ bình thường, không lộ hành vi; ca thi trượt đúng đơn vị ấy), `thi_tot_it_luyen`,
//   `ht_run` (lên bảng chưa đạt MỘT lần do run), `ht_dv_moi` (ca thi có đơn vị chưa luyện, làm kém ở đó), `ht_om_thi` (một ca thi kém hẳn — ốm).
import { danhGiaEm, type DauVaoDanhGia, type LuotDanhGia } from '../server/src/danh-gia-hoc-that'
import type { DauVaoBon, NgayNhip } from '../server/src/bon-chi-so'
import type { CauCaThi, LuotBang, LuyenCuDv } from '../server/src/bon-ca-thi'
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
/** 46 ngày TRƯỚC cửa sổ 14 ngày (02/09 – 17/10) — cùng cửa sổ 60 ngày với ca thi / lên bảng. */
export const NGAY_CU = Array.from({ length: 46 }, (_, i) => new Date(Date.parse('2026-09-02T00:00:00Z') + i * 86_400_000).toISOString().slice(0, 10))
/** 12 chuyên đề theo lịch dạy; ngày thứ g (0–59 trong 60 ngày) đang học các đơn vị k có |g − tâm(k)| ≤ 8, tâm(k) = 5k + 4. */
export const DON_VI = ['Este', 'Lipit', 'Cacbohiđrat', 'Amin', 'Amino axit', 'Peptit', 'Polime', 'Kim loại', 'Điện phân', 'Sắt', 'Nhôm', 'Crom']
const tamDv = (k: number) => 5 * k + 4
const dvDangHoc = (g: number) => DON_VI.map((_, k) => k).filter((k) => Math.abs(g - tamDv(k)) <= 8)
const SO_NGAY_CU = NGAY_CU.length
/** Đáp án của một em mô phỏng: trục chất lượng (null = em không có bằng chứng nào: chưa làm gì) · trục công sức. */
export interface DapAn { cl: 'ht' | 'dp' | null; cs: 'ch' | 'lu' }

export type Kieu =
  | 'ht' | 'ht_yeu' | 'ht_it_ngay' | 'gioi_nhanh' | 'ht_thong_bao'
  | 'dp_voi' | 'dp_tra' | 'dp_lap' | 'dp_treo' | 'dp_do'
  | 'cham_yeu' | 'trung_binh' | 'don_han'
  | 'luoi_han' | 'luoi_mot_phan'
  | 'dp_thuoc' | 'thi_tot_it_luyen' | 'ht_run' | 'ht_dv_moi' | 'ht_om_thi'
  | 'moi_vao' | 'vang_dai' | 'it_du_lieu' | 'lan_lon' | 'khong_lam'

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
  dp_do: { duoc: ['dp'], phai: ['dp'], mo: 'Đối phó: dò đáp án — thử 3–4 phương án trước khi bấm Kiểm tra ở nhiều lượt, luyện cao mà kiểm tra thấp' },
  cham_yeu: { duoc: ['ch', 'ht'], phai: ['ch'], mo: 'Chăm, làm thật nhưng yếu, sửa sai một phần' },
  trung_binh: { duoc: ['ch', 'ht'], phai: [], mo: 'Trung bình, lẫn lộn — phần lớn nên «Đang theo dõi»' },
  don_han: { duoc: ['ht'], phai: [], mo: 'Làm đủ nhưng dồn hết sau 23:00 (không được Chăm)' },
  luoi_han: { duoc: ['lu'], phai: ['lu'], mo: 'Lười hẳn: 0–3 ngày có làm' },
  luoi_mot_phan: { duoc: ['lu', 'ht'], phai: [], mo: 'Lười một phần: nghỉ 6–9/14 ngày' },
  dp_thuoc: { duoc: ['dp'], phai: ['dp'], mo: 'Đối phó: biết trước đáp án — luyện đúng ~88% ở tốc độ bình thường, đổi số liệu thì sai, ca thi trượt đúng đơn vị ấy, lên bảng chưa đạt, không có kiểm tra cá nhân' },
  thi_tot_it_luyen: { duoc: ['ht', 'lu'], phai: [], mo: 'Thi tốt nhưng ít luyện (4–7/14 ngày): không được thành Đối phó' },
  ht_run: { duoc: ['ht', 'ch'], phai: ['ht'], mo: 'Học thật, lên bảng 4–5 lần chưa đạt MỘT lần do run: vẫn Học thật' },
  ht_dv_moi: { duoc: ['ht', 'ch'], phai: [], mo: 'Học thật, ca thi có 1–2 đơn vị CHƯA luyện và làm kém ở đó: không bị phạt' },
  ht_om_thi: { duoc: ['ht', 'ch'], phai: [], mo: 'Học thật, MỘT ca thi kém hẳn (ốm): không được thành Đối phó' },
  moi_vao: { duoc: ['ht', 'ch'], phai: [], mo: 'RANH GIỚI — mới vào app 2–5 ngày, làm đủ, chưa có ca thi' },
  vang_dai: { duoc: ['ht', 'lu'], phai: [], mo: 'RANH GIỚI — vắng dài 8–11 ngày rồi quay lại làm 3–6 ngày cuối' },
  it_du_lieu: { duoc: ['ht', 'ch'], phai: [], mo: 'RANH GIỚI — mức ngày nhỏ (8–12 câu), ít lượt' },
  lan_lon: { duoc: ['ht', 'ch', 'lu'], phai: [], mo: 'RANH GIỚI — lẫn lộn: 11–14 ngày có làm nhưng 15–55% số ngày chỉ làm 35–65% mức (đáp án công sức theo số ngày làm đủ)' },
  khong_lam: { duoc: ['lu'], phai: ['lu'], mo: 'RANH GIỚI — không làm gì cả 60 ngày, không thi, không kiểm tra (chỉ xếp được trục công sức: Lười)' },
}
export const CAC_KIEU = Object.keys(NHAN) as Kieu[]

interface ThamSo {
  nangLuc: number; ngayLam: number; voi: number; voiDung: number; sua: number; an: number; anDung: boolean; treo: number
  lap: number; donHan: boolean; nhanh: boolean; ktLech: number | null; hoi: number; vuot: number
  /** Đợt 2: tỉ lệ lượt đổi lựa chọn MỘT lần (em thật) · tỉ lệ lượt Phần I phân vân 3 phương án (em yếu, hiếm) · tỉ lệ lượt Phần I DÒ đáp án (dp_do). */
  doi: number; phanVan: number; doTL: number
  /** v3: biết trước đáp án ở câu luyện lần đầu (dp_thuoc) · số ca thi · số lần lên bảng · kiểu lên bảng («thật» / «gian» / «vội» / «run»). */
  biet: number; soCa: number; soBang: number; bang: 'that' | 'gian' | 'voi' | 'run'
  /** v3b: số ngày PHẢI LÀM trong 14 ngày (mới vào app < 14) · vắng phần đầu, làm liền cuối cửa sổ · mức ngày nhỏ · tỉ lệ ngày chỉ làm một phần mức. */
  moi: number; vangDau: boolean; mucNho: boolean; thieu: number
}
function thamSo(k: Kieu, r: Rng): ThamSo {
  const c: ThamSo = { nangLuc: giua(r, 0.45, 0.8), ngayLam: 14, voi: giua(r, 0, 0.04), voiDung: 0.3, sua: giua(r, 0.82, 0.97), an: giua(r, 0, 0.03), anDung: false, treo: 0,
    lap: 0, donHan: false, nhanh: false, ktLech: giua(r, -0.8, 0.8), hoi: nguyen(r, 0, 2), vuot: nguyen(r, 0, 6), doi: giua(r, 0.06, 0.15), phanVan: 0, doTL: 0,
    // v3: ¼ số em không có ca thi trong 6 tuần (về luật v2); số lần lên bảng 0–4
    // v3b: cửa sổ 60 ngày ⇒ chỉ ~10% em không có ca thi nào
    biet: 0, soCa: r() < 0.1 ? 0 : nguyen(r, 2, 6), soBang: r() < 0.3 ? 0 : nguyen(r, 1, 4), bang: 'that', moi: 14, vangDau: false, mucNho: false, thieu: 0 }
  switch (k) {
    case 'ht': return c
    case 'ht_yeu': return { ...c, nangLuc: giua(r, 0.12, 0.3), sua: giua(r, 0.72, 0.92) }
    case 'ht_it_ngay': return { ...c, ngayLam: nguyen(r, 9, 11) }
    case 'gioi_nhanh': return { ...c, nangLuc: giua(r, 0.88, 0.98), nhanh: true, ktLech: giua(r, 0, 0.6), sua: giua(r, 0.9, 1) }
    case 'ht_thong_bao': return { ...c, an: giua(r, 0.12, 0.22) }
    case 'dp_voi': return { ...c, nangLuc: giua(r, 0.25, 0.6), voi: giua(r, 0.3, 0.6), voiDung: 0.25, sua: giua(r, 0, 0.3), ktLech: null, hoi: 0, vuot: 0, ngayLam: nguyen(r, 11, 14), bang: 'voi' }
    case 'dp_tra': return { ...c, nangLuc: giua(r, 0.2, 0.45), an: giua(r, 0.45, 0.75), anDung: true, voi: giua(r, 0.03, 0.1), sua: giua(r, 0.5, 0.9), ktLech: -giua(r, 3, 4.5), hoi: 0, ngayLam: nguyen(r, 12, 14), bang: 'gian' }
    case 'dp_lap': return { ...c, nangLuc: giua(r, 0.25, 0.55), lap: nguyen(r, 2, 6), voi: giua(r, 0.15, 0.35), voiDung: 0.25, sua: giua(r, 0, 0.4), ktLech: null, hoi: 0, ngayLam: nguyen(r, 11, 14), bang: 'voi' }
    case 'dp_do': return { ...c, nangLuc: giua(r, 0.2, 0.45), doTL: giua(r, 0.25, 0.5), voi: giua(r, 0.03, 0.08), sua: giua(r, 0.5, 0.9), ktLech: -giua(r, 3, 4.5), hoi: 0, ngayLam: nguyen(r, 12, 14), bang: 'gian' }
    case 'dp_treo': return { ...c, nangLuc: giua(r, 0.3, 0.6), treo: giua(r, 0.1, 0.2), voi: giua(r, 0.12, 0.25), voiDung: 0.25, sua: giua(r, 0.1, 0.5), ktLech: null, hoi: 0, ngayLam: nguyen(r, 12, 14), bang: 'voi' }
    case 'cham_yeu': return { ...c, nangLuc: giua(r, 0.12, 0.3), sua: giua(r, 0.35, 0.6), ktLech: giua(r, -1, 0.5), phanVan: giua(r, 0, 0.02) }
    case 'trung_binh': return { ...c, nangLuc: giua(r, 0.35, 0.6), voi: giua(r, 0.06, 0.12), voiDung: 0.4, sua: giua(r, 0.4, 0.75), ngayLam: nguyen(r, 12, 14), an: giua(r, 0, 0.06), hoi: nguyen(r, 0, 1), phanVan: giua(r, 0, 0.02) }
    case 'don_han': return { ...c, donHan: true, voi: giua(r, 0.05, 0.1), voiDung: 0.4, sua: giua(r, 0.4, 0.85), vuot: 0 }
    case 'luoi_han': return { ...c, ngayLam: nguyen(r, 0, 3), sua: giua(r, 0, 0.3), ktLech: null, hoi: 0, vuot: 0 }
    case 'luoi_mot_phan': return { ...c, ngayLam: nguyen(r, 5, 8), sua: giua(r, 0.1, 0.6), ktLech: null, vuot: 0 }
    case 'dp_thuoc': return { ...c, nangLuc: giua(r, 0.2, 0.4), biet: giua(r, 0.85, 0.92), voi: giua(r, 0, 0.03), sua: giua(r, 0.1, 0.35), ktLech: null, hoi: 0, ngayLam: nguyen(r, 11, 14), vuot: 0,
      soCa: nguyen(r, 2, 5), soBang: r() < 0.3 ? 0 : nguyen(r, 2, 4), bang: 'gian' }
    case 'thi_tot_it_luyen': return { ...c, nangLuc: giua(r, 0.72, 0.9), ngayLam: nguyen(r, 4, 7), vuot: 0, soCa: nguyen(r, 2, 5) }
    case 'ht_run': return { ...c, soCa: r() < 0.25 ? 0 : nguyen(r, 2, 5), soBang: nguyen(r, 4, 5), bang: 'run' }
    case 'ht_dv_moi': return { ...c, soCa: nguyen(r, 2, 5) }
    case 'ht_om_thi': return { ...c, soCa: nguyen(r, 2, 5) }
    case 'moi_vao': return { ...c, moi: nguyen(r, 2, 5), soCa: 0, soBang: 0 }
    case 'vang_dai': return { ...c, ngayLam: nguyen(r, 3, 6), vangDau: true, vuot: 0 }
    case 'it_du_lieu': return { ...c, mucNho: true, ngayLam: nguyen(r, 10, 14) }
    case 'lan_lon': return { ...c, nangLuc: giua(r, 0.35, 0.65), ngayLam: nguyen(r, 11, 14), thieu: giua(r, 0.15, 0.55), vuot: 0 }
    case 'khong_lam': return { ...c, ngayLam: 0, ktLech: null, soCa: 0, soBang: 0, hoi: 0 }
  }
}

/** Sinh MỘT em theo kiểu ⇒ đầu vào của tinhBon (đi qua đúng bộ Học thật danhGiaEm như máy chủ). */
export function taoEm(k: Kieu, r: Rng, ma = 'X'): DauVaoBon & { dapAn: DapAn } {
  const t = thamSo(k, r)
  const muc = t.mucNho ? nguyen(r, 8, 12) : nguyen(r, 24, 40)
  const ngayPhai = NGAY.slice(14 - t.moi)
  // v3: năng lực RIÊNG từng đơn vị (quanh năng lực chung)
  const nlDv = DON_VI.map(() => Math.max(0.02, Math.min(0.98, t.nangLuc + giua(r, -0.08, 0.08))))
  const chonDv = (g: number) => { const ds = dvDangHoc(g); return ds[nguyen(r, 0, ds.length - 1)]! }
  // tỉ lệ đúng LUYỆN TẬP ở câu độ khó q (gộp mọi hành vi của kiểu — dùng cho luyện tập cũ 28 ngày, đã gộp theo ngày × đơn vị)
  const dungThat = (q: number, a: number) => kep01(q + (a - 0.5) * 0.9)
  const dungLuyenCu = (q: number, a: number) => {
    const that = dungThat(q, a)
    if (t.biet) return t.biet
    if (t.anDung) return t.an * 0.95 + (1 - t.an) * that
    if (t.doTL) return t.doTL * 0.85 + (1 - t.doTL) * that
    return t.voi * t.voiDung + (1 - t.voi) * that
  }
  const ngayLam = new Set(t.vangDau ? ngayPhai.slice(-t.ngayLam) : [...ngayPhai].sort(() => r() - 0.5).slice(0, t.ngayLam))
  let ngayDuThat = 0
  const luot: LuotDanhGia[] = []
  const ngay: NgayNhip[] = []
  let dem = 0
  const saiCho: { cau: string; ngay: number; dv: string }[] = []
  const KT: number[] = []
  NGAY.forEach((n, d) => {
    if (!ngayPhai.includes(n)) { ngay.push({ ngay: n, muc: 0, lam: 0 }); return }
    if (!ngayLam.has(n)) { ngay.push({ ngay: n, muc, lam: 0 }); return }
    const thieuNgay = r() < t.thieu
    const so = thieuNgay ? Math.round(muc * giua(r, 0.35, 0.65)) : muc + (r() < 0.5 ? t.vuot : 0)
    if (so >= 0.75 * muc) ngayDuThat++
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
      let dvI = DON_VI[chonDv(SO_NGAY_CU + d)]!
      if (den.length && r() < 0.35) { const x = den.shift()!; saiCho.splice(saiCho.indexOf(x), 1); cau = x.cau; dvI = x.dv; songSinh = true }
      const a = nlDv[DON_VI.indexOf(dvI)]!
      const voi = conLap > 0 || r() < t.voi
      const treo = !voi && r() < t.treo
      const roiLau = !voi && !treo && r() < t.an
      const an = roiLau ? giua(r, 9, t.anDung ? 60 : 20) : r() < 0.2 ? giua(r, 0, 4) : 0
      // ar: em tra ngoài quay lại chọn NGAY (còn 1–8 giây trong cửa sổ 30 giây); em bị thông báo kéo ra: 80% quay lại còn đọc tiếp quá 30 giây (ar = 0),
      // 20% rời 1–8 giây trong cửa sổ; liếc ra ngoài vài giây: ar ≤ số giây đã rời.
      const ar = an <= 0 ? 0 : roiLau ? (t.anDung ? Math.round(Math.min(an, 30 - giua(r, 1, 8))) : r() < 0.2 ? Math.min(Math.round(an), nguyen(r, 1, 8)) : 0)
        : r() < 0.3 ? Math.min(Math.round(an), nguyen(r, 0, 4)) : 0
      const rn = an <= 0 ? 0 : roiLau && !t.anDung && t.an >= 0.1 ? nguyen(r, 1, 3) : nguyen(r, 1, 2)
      // dd / dq: dò đáp án (dp_do, Phần I) thử 3–4 phương án; em yếu hiếm khi phân vân 3; em thật thỉnh thoảng đổi một lần; chọn vội / bấm lặp không đổi.
      const doDa = phan === 'I' && !voi && !treo && r() < t.doTL
      const phanVan = !doDa && phan === 'I' && !voi && r() < t.phanVan
      const doiMot = !doDa && !phanVan && !voi && conLap <= 0 && r() < t.doi
      const dq = phan !== 'I' ? undefined : doDa ? (r() < 0.6 ? 3 : 4) : phanVan ? 3 : doiMot ? 2 : 1
      const dd = doDa ? dq! - 1 + nguyen(r, 0, 2) : phanVan ? 2 : doiMot ? 1 : 0
      // dp_thuoc: câu luyện LẦN ĐẦU đã biết đáp án (đúng ~88%); bản song sinh đổi số liệu thì lộ (theo tỉ lệ «sửa» thấp).
      const pDung = songSinh ? (r() < t.sua ? 0.97 : 0.15) : voi ? t.voiDung : an > 8 && t.anDung ? 0.95 : doDa ? 0.85 : t.biet ? t.biet : dungThat(pLop, a)
      const dung = r() < pDung
      const giay = treo ? giua(r, 400, 900) : voi ? giua(r, 2, Math.min(7, giayDoc * 0.5)) : doDa ? giayDoc * giua(r, 1.3, 3) : t.nhanh ? giayDoc * giua(r, 0.75, 1.1) : t.biet ? giayDoc * giua(r, 1.05, 1.8) : giayDoc * giua(r, 1.15, 2.6)
      const chon = phan === 'I' ? (conLap > 0 ? chuLap : 'ABCD'[nguyen(r, 0, 3)]!) : null
      if (conLap > 0) conLap--
      phut += Math.max(1, giay / 60 + giua(r, 0, 1.5))
      const gio = t.donHan ? Math.min(phut, 23 * 60 + 58) : phut
      const luc = new Date(Date.parse(`${n}T00:00:00Z`) - 7 * 3_600_000 + gio * 60_000).toISOString()
      const ma4: LuotDanhGia['ma'] = treo ? 3 : giay < giayDoc ? (t.nhanh && dung ? 2 : 1) : giay < giayDoc * 1.3 ? 2 : 3
      luot.push({ phan, dung, cau, ma: ma4, thuoc: t.nhanh && dung && giay < giayDoc, treo: treo ? 'treo' : null, r: giay / giayDoc, pLop, chon, coGoiY: false, songSinh,
        ngay: n, luc, giay, giayDoc, qid: cau, an, dd, ...(dq !== undefined ? { dq } : {}), ar, rn, dv: dvI })
      if (!dung && !songSinh) saiCho.push({ cau, ngay: d, dv: dvI })
    }
    ngay.push({ ngay: n, muc, lam: so })
  })
  const dungLuyen = luot.length ? luot.filter((l) => l.dung).length / luot.length : 0
  if (t.ktLech !== null && luot.length) KT.push(Math.max(0, Math.min(10, dungLuyen * 10 + t.ktLech)))
  const dauVao: DauVaoDanhGia = { luot, ngayCuaSo: ngayPhai, ktcn: { daNop: KT.length, boHan: k === 'luoi_han' ? 2 : 0, diem: KT }, thi: [], gianLanXacNhan: 0 }

  // ── v3: luyện tập CŨ (28 ngày trước cửa sổ), gộp theo ngày × đơn vị — cùng nhịp ngày làm của kiểu
  const luyenCu: LuyenCuDv[] = []
  NGAY_CU.forEach((n, g) => {
    if (t.moi < 14 || r() >= t.ngayLam / 14) return
    const gom = new Map<string, { n: number; d: number }>()
    for (let i = 0; i < muc; i++) {
      const dvI = DON_VI[chonDv(g)]!, x = gom.get(dvI) ?? { n: 0, d: 0 }
      x.n++
      if (r() < dungLuyenCu(giua(r, 0.15, 0.9), nlDv[DON_VI.indexOf(dvI)]!)) x.d++
      gom.set(dvI, x)
    }
    for (const [dvI, x] of gom) luyenCu.push({ ngay: n, dv: dvI, ...x })
  })
  const ngayG = (g: number) => (g < SO_NGAY_CU ? NGAY_CU[g]! : NGAY[g - SO_NGAY_CU]!)
  const lucG = (g: number, phut: number) => new Date(Date.parse(`${ngayG(g)}T00:00:00Z`) - 7 * 3_600_000 + phut * 60_000).toISOString()

  // ── v3: CA THI thật (năng lực THẬT; một ca «ốm» với ht_om_thi; đơn vị chưa luyện với ht_dv_moi)
  const caThi: CauCaThi[] = []
  const ngayCa: number[] = []
  for (let lan = 0; lan < 60 && ngayCa.length < t.soCa; lan++) { const g = nguyen(r, 8, 59); if (ngayCa.every((x) => Math.abs(x - g) >= 5)) ngayCa.push(g) }
  ngayCa.sort((a, b) => a - b)
  const caOm = k === 'ht_om_thi' ? nguyen(r, 0, ngayCa.length - 1) : -1
  // NHIỄU THẬT (mọi kiểu): mỗi ca một «ngày phong độ» ±6 điểm %; QUÊN — đơn vị học xong càng lâu trước ca càng tụt (0,3 điểm %/ngày, tối đa 9).
  ngayCa.forEach((g, j) => {
    const phongDo = giua(r, -0.06, 0.06)
    const daHoc = [...new Set([...dvDangHoc(g), ...dvDangHoc(Math.max(0, g - 5))])].sort(() => r() - 0.5).slice(0, nguyen(r, 3, 4))
    const chuaHoc = k === 'ht_dv_moi' ? DON_VI.map((_, x) => x).filter((x) => tamDv(x) - 8 > g).slice(0, nguyen(r, 1, 2)) : []
    const maCa = `${ma}-CA${j}`
    for (const x of [...daHoc, ...chuaHoc]) {
      const soCau = nguyen(r, 4, 8)
      for (let i = 0; i < soCau; i++) {
        const q = giua(r, 0.2, 0.85)
        const a = chuaHoc.includes(x) ? Math.max(0.02, nlDv[x]! - 0.35) : nlDv[x]!
        const quen = Math.min(0.09, Math.max(0, 0.003 * (g - tamDv(x))))
        const p = kep01(dungThat(q, a) - (j === caOm ? 0.32 : 0) + phongDo - quen)
        caThi.push({ ma: maCa, qid: `${maCa}-Q${x}-${i}`, ngay: ngayG(g), luc: lucG(g, 19 * 60 + 45), dv: r() < 0.05 ? null : DON_VI[x]!, mucDo: q > 0.7 ? 'biet' : q > 0.5 ? 'hieu' : q > 0.32 ? 'VD' : 'VDC',
          dung: r() < p, pLop: r() < 0.85 ? Math.max(0.02, Math.min(0.98, q + giua(r, -0.05, 0.05))) : null })
      }
    }
  })

  // ── v3: LÊN BẢNG / KIỂM TRA ĐẦU GIỜ (hỏi lại câu em đã làm ĐÚNG ở luyện tập)
  const lenBang: LuotBang[] = []
  const soBang = t.soBang
  const chuaRun = t.bang === 'run' ? nguyen(r, 0, soBang - 1) : -1
  for (let j = 0; j < soBang; j++) {
    const g = nguyen(r, 12, 59)
    const dauGio = r() < 0.5
    const dungTruoc = luot.filter((l) => l.dung && !l.songSinh && l.ngay < ngayG(g))
    const cauCu = dauGio && dungTruoc.length ? dungTruoc[nguyen(r, 0, dungTruoc.length - 1)]! : null
    const x = cauCu ? DON_VI.indexOf(cauCu.dv!) : chonDv(Math.max(0, g - 2))
    const a = nlDv[x]!
    const pDat = t.bang === 'gian' ? 0.2 : t.bang === 'voi' ? (dauGio ? 0.45 : kep01(0.3 + 0.6 * a)) : t.bang === 'run' ? (j === chuaRun ? 0 : 1) : dauGio ? Math.min(0.97, 0.55 + 0.4 * a) : kep01(0.3 + 0.6 * a)
    lenBang.push({ qid: cauCu?.cau ?? `${ma}-B${j}`, ngay: ngayG(g), luc: lucG(g, 17 * 60 + nguyen(r, 0, 60)), dv: DON_VI[x]!, dat: r() < pDat, loai: cauCu ? 'dau_gio' : 'len_bang' })
  }
  // ĐÁP ÁN — chất lượng: kiểu đối phó (dp_*) ⇒ Đối phó, còn lại Học thật; chưa có bằng chứng nào ⇒ null. Công sức: Chăm ⇔ ≥ 70% số ngày phải làm có làm ≥ 75%
  // mức, xu hướng làm cho có (chọn vội mà sai + treo máy, theo tham số sinh — không theo số đo) ≤ 10%, không dồn hạn.
  const lamChoCo = t.voi * (1 - t.voiDung) + t.treo + (t.lap > 0 ? 0.05 : 0)
  const coBangChung = luot.length > 0 || caThi.length > 0 || lenBang.length > 0 || KT.length > 0 || dauVao.ktcn.boHan > 0
  const dapAn: DapAn = {
    cl: !coBangChung ? null : k.startsWith('dp_') ? 'dp' : 'ht',
    cs: ngayDuThat >= 0.7 * ngayPhai.length && lamChoCo <= 0.1 && !t.donHan ? 'ch' : 'lu',
  }
  return { dg: { kq: danhGiaEm(dauVao), dauVao }, ngay, lanCuoiHoc: [...ngayLam].sort().pop() ?? '', den: DEN, hoi: t.hoi, caThi, lenBang, luyenCu, dapAn }
}
