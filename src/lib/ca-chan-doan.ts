// RÚT CA CHẨN ĐOÁN 15 PHÚT — lõi chung + phần riêng theo em.
// Đặc tả MOCAVAGOILENBANG.md mục 3 và 4.
//
// VÌ SAO PHẢI CÓ LÕI CHUNG. `tiLeDungLop` và `doChum` — hai chỉ số quyết định
// câu nào GIẢNG CẢ LỚP thay vì gọi một em lên bảng — chỉ tính được khi nhiều em
// cùng làm một câu. Cho mỗi em một bộ hoàn toàn riêng là mất sạch hai chỉ số đó.
// Lõi chung lấy câu 2 sao của đề mới, vì đó là câu chắc chắn sẽ chữa.
//
// VÌ SAO ĐO SÂU. Trắc nghiệm bốn phương án có 25% đoán trúng, nên một câu cho
// một chuyên đề là nhiễu lớn hơn tín hiệu:
//   đo nông  3 chuyên đề × 1 câu → 3 kết luận đều không chắc
//   đo sâu   1 chuyên đề × 3 câu → 1 kết luận dùng được
// Bốn buổi xoay vòng thì phủ bốn chuyên đề. Độ sâu tích luỹ theo thời gian.
//
// VÌ SAO KHÔNG CÓ PHẦN III. Tính theo GIÂY MỖI TÍN HIỆU (một tín hiệu = một
// điều thầy biết thêm về em sau khi chấm):
//   Phần II  150s/câu ÷ 4 ý độc lập = 37,5 s/tín hiệu
//   Phần I    60s/câu ÷ 1           = 60   s/tín hiệu
//   Phần III 180s/câu ÷ 1           = 180  s/tín hiệu  ← đắt gấp 4,8 lần Phần II
// Năng lực tính toán đo ở bài về nhà và trên bảng, nơi không bị bó 15 phút.
//
// Kiểu CauUngVien / SoCauPhan / PhanDe dùng chung với `rut-de.ts` — một nguồn
// sự thật, không định nghĩa lại.
import type { CauUngVien, PhanDe, SoCauPhan } from './rut-de'

export type { CauUngVien, PhanDe, SoCauPhan }

/** Thống kê một chuyên đề của một em, tích luỹ qua các buổi. */
export interface ThongKeChuyenDe {
  /** 0..1, lần đo gần nhất. */
  tiLeSai: number
  /** Số buổi kể từ lần đo cuối. */
  buoiChuaDo: number
  /** Sai từ 3 buổi liền trở lên. */
  daiDang: boolean
  chuaTungDo: boolean
}

export interface HoSoEm {
  sbd: string
  ten: string
  chuyenDe: Record<string, ThongKeChuyenDe>
  /** id câu đã ra với CHÍNH em này ở các ca trước. */
  daRa: string[]
}

export interface YeuCauCa {
  /** Ngân sách làm bài, giây. */
  giay: number
  /** Giây mỗi câu từng phần. */
  demGiay: SoCauPhan
  /** Mọi em giống nhau — để tính được tiLeDungLop và doChum. */
  loiChung: SoCauPhan
  /** Rút theo em, từ đề mới. */
  riengMoi: SoCauPhan
  /** Rút theo em, từ kho cũ. */
  cu: SoCauPhan
  /** 1 = đo sâu một chuyên đề. */
  soChuyenDeCu: number
  seed: number
}

/** Ba chế độ tích chọn ở màn mở ca chẩn đoán. */
export type CheDo = 'ca_hai' | 'chi_moi' | 'chi_cu'

const NEN: Omit<YeuCauCa, 'loiChung' | 'riengMoi' | 'cu'> = {
  giay: 840,
  demGiay: { I: 60, II: 150, III: 180 },
  soChuyenDeCu: 1,
  seed: 1,
}

export const CHE_DO: Record<CheDo, YeuCauCa> = {
  // chữa bài mới + ôn cũ — 8 câu · 660s · 14 tín hiệu
  ca_hai: {
    ...NEN,
    loiChung: { I: 2, II: 1, III: 0 },
    riengMoi: { I: 2, II: 0, III: 0 },
    cu: { I: 2, II: 1, III: 0 },
  },
  // chỉ chữa bài mới — 8 câu · 660s · 14 tín hiệu, lõi chung dày hơn
  chi_moi: {
    ...NEN,
    loiChung: { I: 3, II: 2, III: 0 },
    riengMoi: { I: 3, II: 0, III: 0 },
    cu: { I: 0, II: 0, III: 0 },
  },
  // buổi ôn, không có đề mới — 7 câu · 600s · 13 tín hiệu, đo sâu HAI chuyên đề
  chi_cu: {
    ...NEN,
    soChuyenDeCu: 2,
    loiChung: { I: 0, II: 0, III: 0 },
    riengMoi: { I: 0, II: 0, III: 0 },
    cu: { I: 5, II: 2, III: 0 },
  },
}

export const MAC_DINH: YeuCauCa = CHE_DO.ca_hai

/** Chế độ suy ra từ hai khối tích chọn ở màn mở ca. Bỏ tích cả hai → null,
 * nút Mở ca xám. */
export function cheDoTu(coDeMoi: boolean, coDeCu: boolean): CheDo | null {
  if (coDeMoi && coDeCu) return 'ca_hai'
  if (coDeMoi) return 'chi_moi'
  if (coDeCu) return 'chi_cu'
  return null
}

export interface CaKiemChung {
  loiChung: CauUngVien[]
  theoEm: Record<string, CauUngVien[]>
  chuyenDeDo: Record<string, string[]>
  giayUocTinh: number
  soTinHieu: number
  canhBao: string[]
}

// ---------------------------------------------------------------- tiện ích

function bam(s: string, seed: number): number {
  let h = seed >>> 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h / 4294967296
}

function tongGiay(ds: CauUngVien[], d: SoCauPhan): number {
  return ds.reduce((t, c) => t + d[c.phan], 0)
}

/** Tín hiệu chẩn đoán: Phần II bốn ý độc lập = 4, còn lại 1. */
export function tinHieu(ds: CauUngVien[]): number {
  return ds.reduce((t, c) => t + (c.phan === 'II' ? 4 : 1), 0)
}

/** Số câu và số tín hiệu của một chế độ — dòng tổng ở màn mở ca đọc từ đây,
 * không đếm tay. */
export function tomTatCheDo(yc: YeuCauCa): { soCau: number; giay: number; tinHieu: number } {
  const dem = (s: SoCauPhan) => s.I + s.II + s.III
  const giay = (s: SoCauPhan) => s.I * yc.demGiay.I + s.II * yc.demGiay.II + s.III * yc.demGiay.III
  const th = (s: SoCauPhan) => s.I + s.II * 4 + s.III
  return {
    soCau: dem(yc.loiChung) + dem(yc.riengMoi) + dem(yc.cu),
    giay: giay(yc.loiChung) + giay(yc.riengMoi) + giay(yc.cu),
    tinHieu: th(yc.loiChung) + th(yc.riengMoi) + th(yc.cu),
  }
}

/** Điểm ưu tiên một chuyên đề cần đo lại. Cao = đo trước. */
export function diemChuyenDe(t: ThongKeChuyenDe): number {
  return 40 * t.tiLeSai + 10 * Math.min(t.buoiChuaDo, 6) + (t.daiDang ? 30 : 0) + (t.chuaTungDo ? 20 : 0)
}

/** Lấy n câu của một phần, xếp theo bộ khoá rồi cắt. */
function lay(ds: CauUngVien[], phan: PhanDe, n: number, cam: Set<string>, khoa: (c: CauUngVien) => number, seed: number): CauUngVien[] {
  if (n <= 0) return []
  return ds
    .filter((c) => c.phan === phan && !cam.has(c.id))
    .map((c) => ({ c, k: khoa(c), r: bam(c.id, seed) }))
    .sort((a, b) => b.k - a.k || a.r - b.r)
    .slice(0, n)
    .map((x) => x.c)
}

// -------------------------------------------------------------- thuật toán

export function rutCaKiemChung(uvMoi: CauUngVien[], uvCu: CauUngVien[], dsEm: HoSoEm[], yc: YeuCauCa = MAC_DINH): CaKiemChung {
  const canhBao: string[] = []

  // 1. LÕI CHUNG — câu sao cao nhất của đề mới, mọi em làm giống nhau.
  const camChung = new Set<string>()
  const loiChung: CauUngVien[] = []
  for (const p of ['II', 'I', 'III'] as PhanDe[]) {
    const daCoCd = new Set(loiChung.map((c) => c.chuyenDe))
    const got = lay(
      uvMoi,
      p,
      yc.loiChung[p],
      camChung,
      // sao cao trước; câu thuộc chuyên đề chưa có trong lõi được cộng điểm
      (c) => c.sao * 10 + (daCoCd.has(c.chuyenDe) ? 0 : 3) + (c.canXem ? -5 : 0),
      yc.seed,
    )
    got.forEach((c) => {
      loiChung.push(c)
      camChung.add(c.id)
    })
    if (got.length < yc.loiChung[p]) {
      canhBao.push(`Lõi chung Phần ${p}: kho mới chỉ đủ ${got.length}/${yc.loiChung[p]} câu`)
    }
  }

  const theoEm: Record<string, CauUngVien[]> = {}
  const chuyenDeDo: Record<string, string[]> = {}

  for (const em of dsEm) {
    const cam = new Set<string>(camChung)
    const daRa = new Set(em.daRa)
    const rieng: CauUngVien[] = []

    // 2. RIÊNG MỚI — ưu tiên câu thuộc chuyên đề em yếu, rồi sao cao.
    for (const p of ['I', 'II', 'III'] as PhanDe[]) {
      const got = lay(
        uvMoi,
        p,
        yc.riengMoi[p],
        cam,
        (c) => {
          const t = em.chuyenDe[c.chuyenDe]
          return c.sao * 10 + (t ? t.tiLeSai * 15 : 0) + (daRa.has(c.id) ? -8 : 0)
        },
        yc.seed + 7,
      )
      got.forEach((c) => {
        rieng.push(c)
        cam.add(c.id)
      })
    }

    // 3. CHỌN CHUYÊN ĐỀ CŨ — đo SÂU ít chuyên đề, không dàn mỏng.
    const coTrongKhoCu = new Set(uvCu.map((c) => c.chuyenDe))
    const xepCd = Object.entries(em.chuyenDe)
      .filter(([ten]) => coTrongKhoCu.has(ten))
      .map(([ten, t]) => ({ ten, d: diemChuyenDe(t) }))
      .sort((a, b) => b.d - a.d || bam(a.ten, yc.seed) - bam(b.ten, yc.seed))
    const chon = xepCd.slice(0, yc.soChuyenDeCu).map((x) => x.ten)
    chuyenDeDo[em.sbd] = chon

    // 4. RIÊNG CŨ — trong chuyên đề đã chọn. Thiếu thì NỚI sang chuyên đề kế.
    //    Vòng i = 0 lấy trọn danh sách `chon` (một hoặc hai chuyên đề đo sâu);
    //    còn thiếu thì i tiếp theo mở thêm đúng một chuyên đề, không mở toang.
    for (const p of ['II', 'I', 'III'] as PhanDe[]) {
      let con = yc.cu[p]
      for (let i = 0; i < xepCd.length && con > 0; i++) {
        const trong = i < chon.length ? chon : [xepCd[i].ten]
        const nguon = uvCu.filter((c) => trong.includes(c.chuyenDe))
        const got = lay(nguon, p, con, cam, (c) => c.sao * 5 + (daRa.has(c.id) ? -20 : 0), yc.seed + 13)
        got.forEach((c) => {
          rieng.push(c)
          cam.add(c.id)
        })
        con -= got.length
        if (i === 0 && con === 0) break
      }
      if (con > 0) canhBao.push(`${em.ten}: kho cũ thiếu ${con} câu Phần ${p}`)
    }

    theoEm[em.sbd] = rieng
  }

  // 5. Ngân sách — đo trên em nhận nhiều câu nhất.
  const nangNhat = Object.values(theoEm).reduce((m, r) => Math.max(m, tongGiay(r, yc.demGiay)), 0)
  const giayUocTinh = tongGiay(loiChung, yc.demGiay) + nangNhat
  if (giayUocTinh > yc.giay) {
    canhBao.push(`Vượt ngân sách: ${giayUocTinh}s > ${yc.giay}s — bớt câu Phần II hoặc giảm riengMoi`)
  }
  const mau = Object.values(theoEm)[0] || []
  return {
    loiChung,
    theoEm,
    chuyenDeDo,
    giayUocTinh,
    soTinHieu: tinHieu(loiChung) + tinHieu(mau),
    canhBao,
  }
}
