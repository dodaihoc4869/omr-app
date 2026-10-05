// BỘ SINH BIẾN THỂ THEO DẠNG cho câu TÍNH TOÁN (05/10). Thầy: "thay vì lặp lại câu sai bạn hãy tìm cách để học sinh vẫn hoàn thành được câu sai
// đó nhưng không học thuộc đáp án được" + "tôi ko duyệt gì cả". Câu sai thuộc một dạng tính toán ⇒ sinh câu CÙNG CÁCH GIẢI, đổi số liệu / đổi chất;
// đáp án TÍNH BẰNG MÃ; không bước nào chờ thầy duyệt: mọi câu đi qua cổng kiểm của máy (đáp số hữu hạn, dương; Phần III vừa 4 ô, làm tròn ổn định
// trước sai số làm tròn trung gian; Phần I đúng 1 phương án đúng, 3 nhiễu từ LỖI HAY GẶP, khác nhau, cách nhau ≥ 3 %; đề không chứa đáp án) —
// không qua ⇒ BỎ, sinh lại với hạt phụ kế tiếp. Đáp án được KIỂM CHÉO trong tests/bien-the-sinh-0510.test.ts bằng bộ giải ĐỘC LẬP đọc lại chữ đề.
//
// API: `coBoSinh(dang)`, `sinhBienThe(dang, hatGiong, phan, mucDo?, goc?)` (tất định), `cacHoDe()`; tiện ích phủ lên câu gốc `apBienThe`.
// KHỐI: biến thể chỉ dùng cho em CÙNG KHỐI câu gốc ⇒ `maDe` (mã tờ) của câu gốc được GIỮ NGUYÊN trong biến thể (cùng `lop`/`khoi`/`nhom` nếu câu gốc có)
// để `khoiCuaCau` / cổng khối đọc đúng khối câu gốc; biến thể KHÔNG tự gắn khối riêng. `apBienThe` (kênh đưa câu cho em) đòi khối em = khối câu gốc
// (cả hai phải rõ) rồi lọc thêm bằng `cauHopKhoi` (src/lib/khoi-cau.ts).
// Không nối vào game / thang làm lại ở đợt này (điều phối nối đợt sau). Không IO, không D1/R2.
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { cauHopKhoi, khoiCuaCau, khoiCuaMaDe, type Khoi } from '../../src/lib/khoi-cau'
import { tenCua } from '../../src/lib/tu-vung-dang'
import { CAC_MUC, Rng, bam32, lamTron, soLe, vn, vnCo, type BanSinh, type HoDe, type MauDe, type MucDo, type Phan } from './bien-the/chung'
import { HO_CARBOHYDRATE } from './bien-the/ho-carbohydrate'
import { HO_ESTER } from './bien-the/ho-ester'
import { HO_KIM_LOAI } from './bien-the/ho-kim-loai'
import { HO_LOP_11 } from './bien-the/ho-lop-11'

export type { Phan, MucDo } from './bien-the/chung'

/** Đổi khi đổi luật sinh/lắp (vào `bienThe.phienBan` để nơi lưu biết câu sinh theo bản nào). */
export const PHIEN_BAN_BIEN_THE = 'bt-0510.1'

const CAC_HO: readonly HoDe[] = [...HO_CARBOHYDRATE, ...HO_ESTER, ...HO_KIM_LOAI, ...HO_LOP_11]

/** Thông tin câu gốc mà biến thể kế thừa (đều tuỳ chọn). `maDe` = mã tờ câu gốc — nguồn khối của biến thể. `text` chỉ để chọn mẫu gần câu gốc nhất. */
export interface GocBienThe {
  maDe?: string | null
  text?: string | null
  tenDang?: string | null
  sao?: number | null
  family?: string | null
  lop?: unknown
  khoi?: unknown
  nhom?: unknown
}
export interface ThongTinBienThe {
  ho: string
  mau: string
  dang: string
  hatGiong: string
  phan: Phan
  mucDo: MucDo
  /** Số chữ số thập phân của quy tắc làm tròn Phần III (null: đáp số đúng tuyệt đối / Phần I). */
  lamTron: number | null
  /** Khối đọc từ câu gốc (mã tờ…) — null khi nơi gọi không đưa câu gốc ⇒ cổng khối không có căn cứ (luật mới: chặn). */
  khoiGoc: Khoi | null
  phienBan: string
}
/** Cùng hình PrivateQuestion TRỪ qid (nơi gọi đặt qid ảo), kèm `bienThe`. */
export type CauBienThe = Omit<PrivateQuestion, 'qid'> & { bienThe: ThongTinBienThe; lop?: unknown; khoi?: unknown; nhom?: unknown }

// ---------------------------------------------------------------- danh mục

export interface MoTaHoDe {
  ma: string; ten: string; khoiChuong: number; cacDang: string[]; soMau: number; mucDo: MucDo[]
  /** Mức độ có mẫu, theo từng mã dạng (mức khác ⇒ biến thể lấy mức gần nhất). */
  mucTheoDang: Record<string, MucDo[]>
}
/** Các họ đề + mã dạng phủ (thứ tự cố định). */
export function cacHoDe(): MoTaHoDe[] {
  return CAC_HO.map((h) => {
    const cacDang = [...new Set(h.mau.flatMap((m) => m.dang))].sort()
    return {
      ma: h.ma, ten: h.ten, khoiChuong: h.khoiChuong, cacDang, soMau: h.mau.length,
      mucDo: CAC_MUC.filter((m) => h.mau.some((x) => x.muc === m)),
      mucTheoDang: Object.fromEntries(cacDang.map((d) => [d, CAC_MUC.filter((m) => h.mau.some((x) => x.muc === m && x.dang.includes(d)))])),
    }
  })
}
const DANG_CO_BO_SINH: ReadonlySet<string> = new Set(CAC_HO.flatMap((h) => h.mau.flatMap((m) => m.dang)))
/** Mọi mã dạng có bộ sinh (sắp xếp). */
export const cacDangCoBoSinh = (): string[] => [...DANG_CO_BO_SINH].sort()
export const coBoSinh = (dang: string): boolean => typeof dang === 'string' && DANG_CO_BO_SINH.has(dang)

/** Mức độ của kho ('biet' | 'hieu' | 'van_dung'; nhận cả 'nhan_biet', 'thong_hieu', 'van_dung_cao'). Lạ ⇒ undefined (mọi mức). */
function chuanMuc(m: unknown): MucDo | undefined {
  const s = String(m ?? '').trim().toLowerCase()
  if (s === 'biet' || s === 'nhan_biet') return 'biet'
  if (s === 'hieu' || s === 'thong_hieu') return 'hieu'
  if (s === 'van_dung' || s === 'van_dung_cao') return 'van_dung'
  return undefined
}

interface UngVien { ho: HoDe; mau: MauDe }
function ungVien(dang: string, phan: Phan, muc: MucDo | undefined, chuGoc: string): UngVien[] {
  let ds: UngVien[] = []
  for (const ho of CAC_HO) for (const mau of ho.mau) if (mau.dang.includes(dang) && (mau.phan ?? ['I', 'III']).includes(phan)) ds.push({ ho, mau })
  if (!ds.length) return ds
  if (chuGoc) {
    // CÙNG CÁCH GIẢI trước hết: giữ các mẫu gần câu gốc nhất theo từ khoá của mẫu (2 điểm) + của họ (1 điểm); không mẫu nào khớp ⇒ giữ tất cả.
    const diem = (x: UngVien) => (x.mau.tuKhoa?.test(chuGoc) ? 2 : 0) + (x.ho.tuKhoa.test(chuGoc) ? 1 : 0)
    const cao = Math.max(...ds.map(diem))
    if (cao > 0) ds = ds.filter((x) => diem(x) === cao)
  }
  if (muc) {
    // Rồi đúng mức độ câu gốc; không có ⇒ mức GẦN nhất (cách đều thì mức thấp hơn) — `mucDo` của biến thể luôn ghi mức THẬT của mẫu.
    const i = CAC_MUC.indexOf(muc)
    const xa = (m: MucDo) => Math.abs(CAC_MUC.indexOf(m) - i) * 2 + (CAC_MUC.indexOf(m) > i ? 1 : 0)
    const gan = Math.min(...ds.map((x) => xa(x.mau.muc)))
    ds = ds.filter((x) => xa(x.mau.muc) === gan)
  }
  return ds
}

// ---------------------------------------------------------------- lắp ráp + cổng kiểm của máy

const HANG = ['hàng đơn vị', 'hàng phần mười', 'hàng phần trăm'] as const
/** Sai số tương đối khi em làm tròn trung gian (giữ ~4 chữ số có nghĩa): đáp số làm tròn phải KHÔNG đổi trong ±0,05 %. */
const SAI_SO_TRUNG_GIAN = 5e-4
/** Hai phương án số phải cách nhau ≥ 3 % (em làm tròn trung gian không "trúng" nhiễu). */
const CACH_TOI_THIEU = 0.03
const CHU_CAI = ['A', 'B', 'C', 'D'] as const

/** Các số (chữ số ASCII; chỉ số dưới ₂ không tính) xuất hiện trong chữ. */
const soTrongChu = (s: string) => (s.match(/\d+(?:,\d+)?/g) ?? []).map((t) => Number(t.replace(',', '.')))
const coSo = (s: string, x: number) => soTrongChu(s).some((t) => Math.abs(t - x) < 1e-9)

interface DaLap { text: string; choices: string[]; correct: string; solution: Record<string, unknown>; lamTron: number | null }

/** Phần III: đáp số 1 số, dấu phẩy, ≤ 4 kí tự (4 ô phiếu trả lời ngắn), quy tắc làm tròn ghi trong đề. */
function lapPhanIII(b: BanSinh): DaLap | null {
  let s: string, d: number | null = null
  if (b.kieu === 'chu') {
    if (!b.dapAnChu || !/^\d{2,4}$/.test(b.dapAnChu)) return null
    s = b.dapAnChu
    if ((b.de.match(/\d+/g) ?? ([] as string[])).includes(s)) return null
  } else {
    const x = b.giaTri
    if (x === undefined || !Number.isFinite(x) || x <= 0) return null
    if (b.chinhXac) {
      if (soLe(x) > 2) return null
      s = vn(x)
    } else {
      if (x < 0.1) return null
      const d0 = x >= 100 ? 0 : x >= 10 ? 1 : 2
      const r0 = lamTron(x, d0)
      let dd = d0
      while (dd > 0 && soLe(r0) < dd) dd-- // 12,0 ⇒ "12" và quy tắc "hàng đơn vị": không để em gõ 12 mà bị chấm sai vì thiếu ",0"
      const duoi = lamTron(x * (1 - SAI_SO_TRUNG_GIAN), dd), tren = lamTron(x * (1 + SAI_SO_TRUNG_GIAN), dd)
      if (duoi !== tren || lamTron(x, dd) !== r0) return null
      s = vnCo(r0, dd)
      d = dd
    }
    if (coSo(b.de, Number(s.replace(',', '.')))) return null
  }
  if (s.length > 4) return null
  const text = d === null ? b.de : `${b.de} (Làm tròn kết quả đến ${HANG[d]}.)`
  const ketLuan = d === null ? `Đáp số: ${s}.` : `Làm tròn đến ${HANG[d]}: ${s}.`
  return { text, choices: [], correct: s, solution: { chot: b.chot, buoc: [...b.buoc, ketLuan], ketQua: s }, lamTron: d }
}

/** Phần I: 1 đúng + 3 nhiễu TỪ LỖI HAY GẶP (theo thứ tự ưu tiên), khác nhau; câu số cùng số chữ số thập phân (3 chữ số có nghĩa), cách nhau ≥ 3 %. */
function lapPhanI(b: BanSinh, r: Rng): DaLap | null {
  const pa: { chu: string; viSao: string | null }[] = []
  if (b.kieu === 'chu') {
    if (!b.dapAnChu) return null
    if (b.de.includes(b.dapAnChu)) return null
    pa.push({ chu: b.dapAnChu, viSao: null })
    for (const n of b.nhieu) {
      if (pa.length === 4) break
      if (!n.chu || pa.some((p) => p.chu === n.chu)) continue
      pa.push({ chu: n.chu, viSao: n.viSao })
    }
  } else {
    const x = b.giaTri
    if (x === undefined || !Number.isFinite(x) || x <= 0) return null
    // 3 chữ số có nghĩa; đáp số đúng tuyệt đối ít chữ số hơn (75 · 2,5) ⇒ viết gọn như đề (75 chứ không 75,0).
    const d0 = x >= 100 ? 0 : x >= 10 ? 1 : x >= 1 ? 2 : 3
    const d = b.chinhXac ? Math.min(d0, soLe(x)) : d0
    const s0 = vnCo(x, d)
    if (coSo(b.de, Number(s0.replace(',', '.')))) return null
    const giaTri = [x]
    pa.push({ chu: s0, viSao: null })
    for (const n of b.nhieu) {
      if (pa.length === 4) break
      const v = n.giaTri
      if (v === undefined || !Number.isFinite(v) || v <= 0 || v > 100 * x || v < x / 100 || (b.toiDa !== undefined && v >= b.toiDa)) continue
      const s = vnCo(v, d)
      if (pa.some((p) => p.chu === s) || Number(s.replace(',', '.')) <= 0) continue
      if (giaTri.some((g) => Math.abs(g - v) / Math.max(g, v) < CACH_TOI_THIEU)) continue
      giaTri.push(v)
      pa.push({ chu: s, viSao: n.viSao })
    }
  }
  if (pa.length < 4) return null
  const thuTu = r.xao([0, 1, 2, 3])
  const choices = thuTu.map((i) => pa[i]!.chu)
  const correct = CHU_CAI[thuTu.indexOf(0)]!
  const tungPa: Record<string, { dung: boolean; viSao: string }> = {}
  thuTu.forEach((i, k) => {
    const p = pa[i]!
    tungPa[CHU_CAI[k]!] = p.viSao === null
      ? { dung: true, viSao: `Chọn: ${p.chu} — ${b.lyDoDung}.` }
      : { dung: false, viSao: `Không chọn: ${p.chu} là kết quả khi ${p.viSao}.` }
  })
  return { text: b.de, choices, correct, solution: { chot: b.chot, buoc: [...b.buoc, `Kết quả: ${pa[0]!.chu}.`], tungPa, ketQua: pa[0]!.chu }, lamTron: null }
}

const hex = (s: string) => `${bam32(s).toString(16).padStart(8, '0')}${bam32(`#${s}`).toString(16).padStart(8, '0')}`

/** Số lần thử lại (hạt phụ) cho MỖI mẫu trước khi chuyển mẫu khác. */
const SO_LAN_THU = 40

/**
 * Biến thể TẤT ĐỊNH của một mã dạng tính toán: cùng (dang, hatGiong, phan, mucDo, chữ câu gốc) ⇒ cùng câu. Không có bộ sinh / phần II / không lắp
 * được ⇒ null. `goc` (câu gốc): giữ `maDe` (khối), `tenDang`, `sao`, `family`; chữ `text` chỉ dùng để chọn mẫu gần câu gốc. Không có `goc` ⇒
 * `maDe` rỗng ⇒ khối không rõ (cổng khối luật mới sẽ chặn) — nơi gọi PHẢI đưa câu gốc.
 */
export function sinhBienThe(dang: string, hatGiong: string, phan: 'I' | 'III', mucDo?: string, goc?: GocBienThe | null): CauBienThe | null {
  if (typeof dang !== 'string' || !coBoSinh(dang) || (phan !== 'I' && phan !== 'III')) return null
  const hat = String(hatGiong ?? '')
  const muc = chuanMuc(mucDo)
  const ds = ungVien(dang, phan, muc, String(goc?.text ?? ''))
  if (!ds.length) return null
  const dau = bam32(`chon|${dang}|${phan}|${muc ?? ''}|${hat}`) % ds.length
  for (let j = 0; j < ds.length; j++) {
    const { ho, mau } = ds[(dau + j) % ds.length]!
    for (let k = 0; k < SO_LAN_THU; k++) {
      const goi = `bt|${dang}|${phan}|${muc ?? ''}|${mau.ma}|${hat}|${k}`
      const ban = mau.sinh(new Rng(goi), phan)
      if (!ban) continue
      const lap = phan === 'III' ? lapPhanIII(ban) : lapPhanI(ban, new Rng(`${goi}|pa`))
      if (!lap) continue
      const group = `bt-${hex(`${lap.text}|${lap.choices.join('|')}`)}`
      const cau: CauBienThe = {
        maDe: String(goc?.maDe ?? ''), version: `bt-${hex(`${group}|${lap.correct}`)}`, group, phan,
        text: lap.text, choices: lap.choices, ideas: [], hinhAnh: [],
        dang, tenDang: String(goc?.tenDang ?? '').trim() || tenCua(dang), mucDo: mau.muc, sao: goc?.sao ?? null, kienThuc: [...ban.kienThuc],
        family: goc?.family ?? null,
        correct: lap.correct,
        solution: { ...lap.solution, bien_the: true },
        reviewed: true,
        bienThe: { ho: ho.ma, mau: mau.ma, dang, hatGiong: hat, phan, mucDo: mau.muc, lamTron: lap.lamTron, khoiGoc: goc ? khoiCuaCau(goc) : null, phienBan: PHIEN_BAN_BIEN_THE },
      }
      // Các nguồn khối khác của câu gốc (dòng D1 có `lop`, tờ kho có `nhom`…) đi theo nguyên vẹn — cổng khối đọc ra ĐÚNG khối câu gốc.
      for (const k2 of ['lop', 'khoi', 'nhom'] as const) if (goc && goc[k2] !== undefined && goc[k2] !== null && goc[k2] !== '') cau[k2] = goc[k2]
      return cau
    }
  }
  return null
}

/**
 * Phủ biến thể lên câu gốc (đúng hình PrivateQuestion, qid = `qidAo` do nơi gọi đặt; mặc định hạt giống = qid ảo ⇒ chấm lại sinh lại được đúng câu).
 * Chặn: câu tự luận, Phần II, câu không có bộ sinh; KHỐI (luật 05/10, kênh tự động): khối em và khối câu gốc phải RÕ và TRÙNG nhau
 * (em lớp 12 cũng không nhận biến thể câu lớp 11; không rõ khối em / khối câu ⇒ chặn), câu gốc qua `cauHopKhoi`, qid ảo không lệch khối.
 * `version` là băm NỘI DUNG biến thể (bộ sinh đổi ⇒ version đổi ⇒ lượt cũ không chấm theo câu khác).
 */
export function apBienThe(goc: PrivateQuestion, qidAo: string, khoiEm: Khoi | null, hatGiong: string = qidAo): PrivateQuestion | null {
  if (!goc || (goc.phan !== 'I' && goc.phan !== 'III') || !goc.dang || !qidAo) return null
  if (laCauTuLuan(goc)) return null
  // CÙNG KHỐI, tự kiểm ở đây (không chờ làn sửa khoi-cau.ts gộp): `cauHopKhoi` bản hiện tại còn cho em khối trên nhận câu khối dưới.
  const khoiGoc = khoiCuaCau(goc)
  if (khoiEm === null || khoiGoc === null || khoiEm !== khoiGoc) return null
  if (!cauHopKhoi(khoiEm, goc)) return null
  // qid ảo phải mang ĐÚNG khối câu gốc (hoặc không mang khối): lệch khối = mâu thuẫn ⇒ chặn (luật khối 05/10).
  const khoiAo = khoiCuaMaDe(qidAo)
  if (khoiAo !== null && khoiAo !== khoiGoc) return null
  const bt = sinhBienThe(goc.dang, hatGiong, goc.phan, goc.mucDo ?? undefined, goc)
  if (!bt) return null
  const { bienThe, ...cau } = bt
  const q = { ...cau, qid: qidAo, solution: { ...(cau.solution as Record<string, unknown>), bien_the_cua: goc.qid, ho: bienThe.ho, mau: bienThe.mau } } as PrivateQuestion
  if (khoiCuaCau(q) !== khoiGoc || !cauHopKhoi(khoiEm, q)) return null
  return q
}
