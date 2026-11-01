// LỬA ĐỔI CẢM XÚC — LUẬT CHỌN CẤP + LỜI (thầy «Chốt duyệt tất» 31/10, docs/DE-XUAT-BI-CAM-XUC-3110.md mục 3–5). HÀM THUẦN, một nguồn, test ở
// tests/cap-gian-lua-3110.test.ts + tests/loi-lua-3110.test.ts. Mọi số lấy từ dữ liệu ĐÃ CÓ trên máy em (Sảnh `so.daLam/so.muc`, /hs/thuong, sổ
// `ddh.lua-that`) ⇒ 0 lệnh máy chủ mới, 0 lượt đọc D1.
// 6 cấp: 0 Vui vẻ · 1 Chờ em · 2 Sốt ruột · 3 Bực · 4 Giận · 5 Siêu cáu, mặt đỏ lừ.
// Lửa giận vì VIỆC (muộn mà chưa làm, làm vội nên câu chưa được tính) — KHÔNG BAO GIỜ vì điểm thấp hay làm sai. Em làm thật là Lửa hết giận ngay.
// Không dùng nhãn tuần «Học thật / Đối phó» (thầy quyết 2: giữ lệnh 26/10 giấu nhãn khỏi máy em). NGOẠI LỆ thầy 01/11 tối: lời Mol giận vì câu chưa được
// tính được gọi thẳng hành vi «đối phó» (thầy: «Làm kiểu câu ngắn kiểu: Bực thật đấy, lại đối phó») — chỉ trong bong bóng, không phải nhãn tuần.
import type { SoLuaThat } from './lua-that'
import { KHO_CHAN_NGON, KHO_DOI_PHO, KHO_GIUC_HOC } from './loi-mol'
// Kho câu (giận · dỗi · chân ngôn) ở MỘT tệp hằng số src/lib/loi-mol.ts — xuất lại để chỗ gọi cũ không đổi.
export { KHO_CHAN_NGON, KHO_DOI_PHO, KHO_GIUC_HOC }

export type CapLua = 0 | 1 | 2 | 3 | 4 | 5
/** Tên cấp trên bản vẽ (chỉ để đọc mã / test — màn em không hiện tên cấp). */
export const TEN_CAP_LUA: readonly string[] = ['Vui vẻ', 'Chờ em', 'Sốt ruột', 'Bực', 'Giận', 'Siêu cáu · mặt đỏ lừ']
/**
 * Vì sao Lửa ở cấp này: 'ca' ca kiểm tra đang mở · 'nghi' nghỉ phép / thầy tắt ngày / hết câu / mức bằng 0 · 'du' đủ mức · 'that' vừa xong chặng làm thật
 * (vui 30 phút) · 'gio' theo giờ × số câu còn thiếu · 'chuaTinh' câu chưa được tính đẩy cấp lên.
 */
export type LyDoLua = 'ca' | 'nghi' | 'du' | 'that' | 'gio' | 'chuaTinh'

export interface VaoLua {
  /** Giờ hiện tại (ms) — giờ máy chủ đã chỉnh (`gioMayChu()`); quy ra giờ Việt Nam bên trong. */
  now: number
  daLam: number
  muc: number
  /** Đủ mức hôm nay (cùng điều kiện vòng «Đủ mức» của Lộ trình). */
  du: boolean
  /** Máy chủ hết câu xếp được (`p.hetCau` / `so.duNgay`). */
  hetCau?: boolean
  /** Ca kiểm tra đang mở. */
  coCa?: boolean
  /** Ngày Kiểm tra ôn tập (`p.ngayKiem`) hoặc Kiểm tra ôn tập đang khoá chặng (`khoaKt`). */
  kiem?: boolean
  /** Hôm nay nghỉ phép / thầy tắt ngày (`lich7` hôm nay `phep` | `tat`). */
  nghi?: boolean
  /** Chuỗi ngày hiện có. */
  chuoi?: number
  /** Hôm nay đã giữ chuỗi. */
  giuHomNay?: boolean
  /** Bình giữ chuỗi còn (vắng = không rõ ⇒ không coi là chuỗi sắp mất). */
  giuChuoi?: number
  /** Ngày đầu em vào app (chưa có chuỗi, trước hôm nay chưa làm câu nào). */
  ngayDau?: boolean
  /** Số lấy từ bản lưu (lỗi / mất mạng) ⇒ không cáu nặng theo số cũ. */
  cu?: boolean
  /** Sổ `ddh.lua-that` hôm nay. */
  so?: SoLuaThat | null
  /** (01/11 tối) Câu bong bóng giận đã hiện ở LƯỢT TRƯỚC — kho câu không lặp liền (Lộ trình nhớ ở localStorage `ddh.loi-mol`). */
  loiTruoc?: string
}

export interface KetLua {
  cap: CapLua
  lyDo: LyDoLua
  /** Số câu chưa được tính / số câu xét (≤ 10 câu nộp gần nhất hôm nay, sau lần xong chặng làm thật nếu còn trong 30 phút). */
  chua: number
  tong: number
  /** Dài nhất bao nhiêu câu LIỀN chưa được tính trong các câu xét. */
  lien: number
  /** Chuỗi ≥ 3 ngày, hôm nay chưa giữ, hết bình giữ chuỗi. */
  chuoiSapMat: boolean
  /** Giờ Việt Nam (0–23) và phút trong giờ. */
  gio: number
  phut: number
}

/** Lửa vui lại bao lâu sau khi xong một chặng làm thật. */
export const PHUT_HA_NHIET = 30
const VN = 7 * 3600_000
export const gioPhutVn = (ms: number): [number, number] => { const d = new Date(ms + VN); return [d.getUTCHours(), d.getUTCMinutes()] }
const hai = (n: number) => String(n).padStart(2, '0')
/** «HH:MM» 24 giờ, giờ Việt Nam. */
export const chuGio = (ms: number): string => { const [h, m] = gioPhutVn(ms); return `${hai(h)}:${hai(m)}` }

/** BƯỚC 1 — gấp theo giờ (chỉ khi CHƯA đủ mức): hàng = mốc giờ, cột = đã làm ≥ 50% mức · 1–49% · chưa làm câu nào. */
const BANG_GIO: readonly (readonly [number, number, number])[] = [
  [1, 1, 1], // trước 19:00
  [1, 2, 2], // 19:00–20:59
  [2, 3, 3], // 21:00–21:59
  [3, 4, 4], // 22:00–22:59
  [4, 4, 5], // 23:00–23:59
]
const hangGio = (h: number): number => (h < 19 ? 0 : h < 21 ? 1 : h < 22 ? 2 : h < 23 ? 3 : 4)

export function capTheoGio(h: number, daLam: number, muc: number): CapLua {
  const cot = muc > 0 && daLam * 2 >= muc ? 0 : daLam > 0 ? 1 : 2
  return BANG_GIO[hangGio(h)]![cot]! as CapLua
}

/** Câu xét ở bước 2: 10 câu gần nhất hôm nay; đang trong 30 phút sau chặng làm thật ⇒ chỉ câu nộp SAU lúc xong chặng ấy. */
function cauXet(so: SoLuaThat | null | undefined, sau?: number): boolean[] {
  const kq = (so?.kq ?? []).slice(-10)
  return (sau !== undefined ? kq.filter((x) => x.t > sau) : kq).map((x) => x.tinh)
}
function lienDaiNhat(ds: boolean[]): number {
  let max = 0, n = 0
  for (const t of ds) { n = t ? 0 : n + 1; if (n > max) max = n }
  return max
}

/** Luật chọn cấp (mục 4.2 + ngoại lệ mục 5). Chạy lại mỗi lần mở Lộ trình / về từ chặng / quay lại tab. */
export function xetLua(v: VaoLua): KetLua {
  const [gio, phut] = gioPhutVn(v.now)
  const chuoi = v.chuoi ?? 0
  const chuoiSapMat = chuoi >= 3 && !v.giuHomNay && v.giuChuoi === 0
  const ra = (cap: CapLua, lyDo: LyDoLua, x: { chua?: number; tong?: number; lien?: number } = {}): KetLua =>
    ({ cap, lyDo, chua: x.chua ?? 0, tong: x.tong ?? 0, lien: x.lien ?? 0, chuoiSapMat, gio, phut })
  // Ngoại lệ đứng trên mọi bước
  if (v.coCa) return ra(1, 'ca')
  if (v.nghi || v.hetCau || !(v.muc > 0)) return ra(0, 'nghi')
  // BƯỚC 3 (một phần) — xong chặng làm thật trong 30 phút ⇒ bỏ qua bước 1; bước 2 chỉ xét câu nộp SAU lúc ấy
  const x = v.so?.xongThat
  const that = x !== undefined && v.now - x > -60_000 && v.now - x < PHUT_HA_NHIET * 60_000 ? x : undefined
  // BƯỚC 1 — gấp theo giờ; chuỗi sắp mất ⇒ cấp 5 từ 23:00
  let c1: CapLua = v.du || that !== undefined ? 0 : capTheoGio(gio, v.daLam, v.muc)
  if (!v.du && that === undefined && chuoiSapMat && gio >= 23) c1 = 5
  // BƯỚC 2 — học thật: câu chưa được tính trong 10 câu nộp gần nhất hôm nay (mọi giờ, kể cả đã đủ mức)
  const ds = cauXet(v.so, that)
  const chua = ds.filter((t) => !t).length, lien = lienDaiNhat(ds)
  // BƯỚC 3 — 3 câu LIỀN được tính ⇒ bỏ ngay phần cộng của bước 2
  const haNhiet = ds.length >= 3 && ds.slice(-3).every(Boolean)
  let cong = 0, toiThieu = 0
  if (!haNhiet) {
    if (chua >= 5 || lien >= 3) { cong = 2; toiThieu = 4 }
    else if (chua >= 3) { cong = 1; toiThieu = 3 }
  }
  let cap = Math.min(5, Math.max(c1 + cong, cong ? toiThieu : 0)) as CapLua
  const lyDo: LyDoLua = cap > c1 ? 'chuaTinh' : that !== undefined ? 'that' : v.du ? 'du' : 'gio'
  // TRẦN theo ngoại lệ (mục 5)
  if (v.kiem || v.ngayDau) cap = Math.min(cap, 2) as CapLua
  if (v.cu) cap = Math.min(cap, 3) as CapLua
  return ra(cap, lyDo, { chua, tong: ds.length, lien })
}

/** Cấp 0–5 (hàm thuần, một nguồn). */
export const capGianLua = (v: VaoLua): CapLua => xetLua(v).cap

/**
 * LỜI BONG BÓNG theo cấp (mục 3). `null` ⇒ GIỮ lời cũ của Lộ trình (cấp 1, đủ mức, ngày nghỉ, ca kiểm tra, Kiểm tra ôn tập).
 * 01/11 tối (thầy: «Câu văn trong bong bóng theo hướng gắt một chút» rồi «Làm kiểu câu ngắn kiểu: Bực thật đấy, lại đối phó»): cấp 2–5 là câu CỰC NGẮN, một dòng,
 * gắt dần, KHÔNG số, không giải thích (số câu / giờ / chuỗi vẫn ở vòng Mục tiêu và thẻ Chuỗi ngày sẵn có). Đúng sự thật theo LÝ DO: giận vì câu chưa được tính
 * ⇒ gọi thẳng «đối phó»; giận vì muộn mà chưa đủ câu ⇒ giục vào học (không nói «đối phó» khi em chưa làm). Không chữ xúc phạm, không chê con người em.
 */
export function loiLua(cap: CapLua, v: VaoLua, k: KetLua = xetLua(v)): string | null {
  if (k.lyDo === 'ca' || k.lyDo === 'nghi' || v.kiem) return null
  const con = Math.max(0, v.muc - v.daLam)
  if (cap === 0) return k.lyDo === 'that' && !v.du && con > 0 ? `Em làm thật, Mol vui lắm! Còn ${con} câu nữa là đủ mức.` : null
  if (cap === 1) return null
  return chonCau(k.lyDo === 'chuaTinh' ? KHO_DOI_PHO[cap] : KHO_GIUC_HOC[cap], soLuot(v.daLam, v.now), v.loiTruoc)
}
/** LƯỢT nói của Mol = số câu đã làm hôm nay + số ngày Việt Nam ⇒ mỗi lần làm thêm câu là một lượt mới; cùng lượt ⇒ cùng câu (tất định, không chớp khi vẽ lại). */
export const soLuot = (daLam: number, now: number): number => daLam + Math.floor((now + 7 * 3_600_000) / 86_400_000)
/** Lời VUI xen chân ngôn: cứ 3 lượt vui thì 1 lượt (lượt chia hết cho 3) thay lời khen bằng một câu chân ngôn; 2/3 còn lại giữ lời khen cũ.
 *  Lượt chân ngôn kế tiếp luôn sang câu khác (chọn theo lượt / 3, tránh câu của lượt chân ngôn trước) ⇒ không lặp liền. `null` ⇒ giữ lời khen. */
export function chanNgon(luot: number): string | null {
  if (((luot % 3) + 3) % 3 !== 0) return null
  const vong = Math.floor(luot / 3)
  return chonCau(KHO_CHAN_NGON, vong, chonCau(KHO_CHAN_NGON, vong - 1))
}
/** Chọn một câu trong kho theo lượt (tất định); trùng câu vừa hiện ở lượt trước ⇒ lấy câu kế tiếp (kho ≥ 2 câu thì không bao giờ lặp liền). */
export function chonCau(kho: readonly string[], luot: number, truoc?: string): string {
  const n = kho.length
  let i = ((Math.floor(luot) % n) + n) % n
  if (n > 1 && kho[i] === truoc) i = (i + 1) % n
  return kho[i]!
}

/** Giờ (ms) cấp có thể đổi lần tới chỉ vì giờ trôi: mốc 19 · 21 · 22 · 23 · 00 giờ Việt Nam, hoặc hết 30 phút vui sau chặng làm thật. */
export function mocDoiLua(v: VaoLua): number {
  const [h, m] = gioPhutVn(v.now)
  const moc = [19, 21, 22, 23, 24].find((x) => x > h) ?? 24
  const s = new Date(v.now).getUTCSeconds() * 1000 + new Date(v.now).getUTCMilliseconds()
  let t = v.now + ((moc - h) * 60 - m) * 60_000 - s
  const x = v.so?.xongThat
  if (x !== undefined && v.now < x + PHUT_HA_NHIET * 60_000) t = Math.min(t, x + PHUT_HA_NHIET * 60_000)
  return t
}
