// CHỌN EM LÊN BẢNG — "XỔ SỐ CÓ PHÂN TẦNG" (thầy chốt 21/10, bản vẽ docs/ban-ve-goi-len-bang-2110, đặc tả docs/dac-ta-goi-len-bang-phan-tang-2110.md).
// Lỗi gốc (thầy 21/10: "hôm nay chỉ gọi đúng 2 bạn"): bộ chọn cũ xếp "đã làm đúng" rồi "xác suất đúng cao nhất", luật rải đều chỉ để phá hoà ⇒ em giỏi nhất thắng mọi câu.
// PHẦN THUẦN, MỘT chỗ cho mọi kênh gọi lên bảng (Dạy học · Chữa câu trên lớp · Thầy tự chữa · tờ chiếu chiến dịch · Gọi lên bảng · Kiểm tra đầu giờ):
//   1. Chia BA TẦNG theo khả năng đúng CHÍNH câu ấy của các em có mặt (phân vị 1/3; em chưa có dữ liệu ⇒ tầng dưới): 1 Cần kèm · 2 Trung bình · 3 Khá.
//   2. Ghép tầng theo mức độ câu: Nhận biết → Cần kèm trước · Thông hiểu → Trung bình trước · Vận dụng/VDC → Khá trước; cả buổi mỗi tầng ≈ N/3 lượt.
//   3. Rút thăm TRONG tầng, ưu tiên em lâu chưa lên bảng (số lần lên bảng 14 ngày: 0 ⇒ ×3 · 1 ⇒ ×1,5 · 2 ⇒ ×1 · ≥ 3 ⇒ ×0,7).
//   4. Luật cứng: mỗi em một lần, đủ em có mặt mới tới lần hai; không gọi một em ở hai câu liền nhau; hạt giống theo buổi ⇒ mở lại tờ rút đúng như cũ.
// Ba chế độ thầy chọn: 'tron' (mặc định) · 'chac' (y như bộ chọn cũ) · 'ngau' (rút thăm đều có trọng số, không phân tầng).
// Không đọc mạng, không đọc đồng hồ (nơi gọi truyền `nowMs`); không bao giờ ném.

export type CheDoChonEm = 'tron' | 'chac' | 'ngau'
export const CHE_DO_MAC_DINH: CheDoChonEm = 'tron'
export type Tang = 1 | 2 | 3
export const TEN_TANG: Readonly<Record<Tang, string>> = { 3: 'Khá', 2: 'Trung bình', 1: 'Cần kèm' }
export const TEN_CHE_DO: Readonly<Record<CheDoChonEm, string>> = { tron: 'Trộn giỏi – yếu', chac: 'Chắc đúng', ngau: 'Ngẫu nhiên' }
/** Mức độ câu đã chuẩn hoá: 0 Nhận biết · 1 Thông hiểu · 2 Vận dụng / VDC. */
export type BacCau = 0 | 1 | 2
const TEN_BAC: Readonly<Record<BacCau, string>> = { 0: 'Câu dễ', 1: 'Câu thông hiểu', 2: 'Câu vận dụng' }
/** Thứ tự tầng ưu tiên theo mức độ câu (tầng kế là dự phòng khi tầng đầu hết em / hết hạn mức). */
export const THU_TU_TANG: Readonly<Record<BacCau, readonly Tang[]>> = { 0: [1, 2, 3], 1: [2, 1, 3], 2: [3, 2, 1] }

/** Một em có mặt, nhìn từ MỘT câu. */
export interface UngVienEm {
  sbd: string
  ten: string
  /** Khả năng đúng câu này (0..1); null = chưa có dữ liệu. */
  p: number | null
  /** Lần gần nhất làm câu này là đúng. */
  daDung: boolean
  /** Số lần đã sai câu này (vai "lên bảng làm" ở chữa câu). */
  soSai?: number
  /** Số lần lên bảng 14 ngày qua (sổ lên bảng). */
  soLan14?: number
  /** ISO — lần lên bảng gần nhất (để ghi "9 ngày chưa lên bảng"). */
  lanCuoiLenBang?: string | null
}
export interface CauCanGoi {
  qid: string
  bac: BacCau
  ungVien: readonly UngVienEm[]
}
export interface KetQuaGoi {
  qid: string
  sbd: string
  ten: string
  tang: Tang
  /** Một dòng cho thầy: "Câu dễ → em Cần kèm · 9 ngày chưa lên bảng". Không đưa lên bản chiếu. */
  lyDo: string
  /** Lần thứ mấy em lên trong lượt chọn này (1 = lần đầu). */
  lan: number
}
export interface TuyChonChon {
  cheDo?: CheDoChonEm
  /** Hạt giống rút thăm (mã buổi + kênh): cùng hạt giống + cùng đầu vào ⇒ cùng kết quả. */
  hatGiong?: string
  /** Số lần đã lên trong BUỔI trước lượt này (các lượt trước): tính vào luật "mỗi em một lần". */
  daLenTrongBuoi?: ReadonlyMap<string, number>
  /** Em thầy đã bấm "Đổi em" bỏ qua ở từng câu. */
  boQua?: ReadonlyMap<string, ReadonlySet<string>>
  nowMs?: number
}

const NGAY_MS = 86_400_000

/** Mức độ câu (chuỗi kho / hợp đồng) ⇒ bậc; lạ / thiếu ⇒ Thông hiểu. */
export function bacCuaMucDo(v: unknown): BacCau {
  const k = String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[_\s-]+/g, ' ').trim()
  if (k === 'biet' || k === 'nhan biet' || k === 'nb' || k === '1') return 0
  if (k === 'vd' || k === 'vdc' || k === 'van dung' || k === 'van dung cao' || k === '3' || k === '4') return 2
  return 1
}

/** Băm chuỗi 32 bit (FNV-1a) — dựng hạt giống. */
function bam(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}
/** Bộ sinh số giả ngẫu nhiên mulberry32 ∈ [0,1). */
export function rngTu(hat: string): () => number {
  let a = bam(hat) || 1
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Trọng số rút thăm theo số lần lên bảng 14 ngày. */
export function trongSoLenBang(soLan14: number | undefined): number {
  const n = Math.max(0, Math.floor(soLan14 ?? 0))
  return n === 0 ? 3 : n === 1 ? 1.5 : n === 2 ? 1 : 0.7
}

/**
 * Chia ba tầng cho các em CÓ MẶT của một câu: em có `p` xếp theo `p` tăng dần, cắt phân vị 1/3 (đều nhất có thể); em chưa có dữ liệu ⇒ tầng 1.
 * Đã đúng câu này mà thiếu `p` ⇒ tầng 2 (có bằng chứng làm được). Dưới 3 em ⇒ mọi em tầng 2 (không chia).
 */
export function chiaTang(ds: readonly Pick<UngVienEm, 'sbd' | 'p' | 'daDung'>[]): Map<string, Tang> {
  const ra = new Map<string, Tang>()
  if (ds.length < 3) { for (const e of ds) ra.set(e.sbd, 2); return ra }
  const diem = (e: Pick<UngVienEm, 'p' | 'daDung'>) => (e.p ?? (e.daDung ? 0.5 : -1)) + (e.daDung ? 0.001 : 0)
  const xep = [...ds].sort((a, b) => diem(a) - diem(b) || a.sbd.localeCompare(b.sbd))
  const n = xep.length
  xep.forEach((e, i) => {
    const t: Tang = e.p === null && !e.daDung ? 1 : i < Math.round(n / 3) ? 1 : i < Math.round((2 * n) / 3) ? 2 : 3
    ra.set(e.sbd, t)
  })
  return ra
}

/** Câu lý do một dòng. */
export function chuLyDo(bac: BacCau, tang: Tang, e: Pick<UngVienEm, 'soLan14' | 'lanCuoiLenBang'>, nowMs: number, cheDo: CheDoChonEm, lan = 1): string {
  const dau = cheDo === 'tron' ? `${TEN_BAC[bac]} → em ${TEN_TANG[tang]}` : cheDo === 'chac' ? 'Khả năng làm đúng cao' : 'Rút thăm đều'
  const t = e.lanCuoiLenBang ? Date.parse(e.lanCuoiLenBang) : NaN
  const ngay = Number.isFinite(t) ? Math.max(0, Math.floor((nowMs - t) / NGAY_MS)) : null
  const lau = (e.soLan14 ?? 0) === 0 ? (ngay !== null && ngay >= 14 ? `${ngay} ngày chưa lên bảng` : 'chưa lên bảng 14 ngày qua') : ngay !== null ? (ngay === 0 ? 'đã lên bảng hôm nay' : `${ngay} ngày chưa lên bảng`) : `${e.soLan14} lần lên bảng 14 ngày qua`
  return `${dau} · ${lan > 1 ? `lên lần ${lan} trong buổi · ` : ''}${lau}`
}

/** Rút một em theo trọng số (rng ∈ [0,1)). */
function rutTrongSo<T extends UngVienEm>(ds: readonly T[], rng: () => number): T | undefined {
  if (!ds.length) return undefined
  const w = ds.map((e) => trongSoLenBang(e.soLan14))
  const tong = w.reduce((a, b) => a + b, 0)
  let x = rng() * tong
  for (let i = 0; i < ds.length; i++) { x -= w[i]!; if (x < 0) return ds[i] }
  return ds[ds.length - 1]
}

/** Thứ tự xếp của bộ chọn CŨ (chế độ "Chắc đúng"): đã đúng trước · p giảm dần · ít lượt gọi trong lượt này. Chỉ em có bằng chứng (đã đúng hoặc có p). */
function chonChac(ungVien: readonly UngVienEm[], goi: ReadonlyMap<string, number>): UngVienEm | undefined {
  return [...ungVien].filter((e) => e.daDung || e.p !== null)
    .sort((a, b) => Number(b.daDung) - Number(a.daDung) || (a.daDung ? 0 : (b.p ?? 0) - (a.p ?? 0)) || (goi.get(a.sbd) ?? 0) - (goi.get(b.sbd) ?? 0))[0]
}

/**
 * Xếp em cho DANH SÁCH câu (đúng thứ tự chiếu). Trả một kết quả mỗi câu có ứng viên (câu không còn em nào ⇒ vắng, nơi gọi để "Cả lớp").
 * 'tron': hạn mức mỗi tầng ⌈N/3⌉; câu đi theo `THU_TU_TANG[bac]`, tầng hết hạn mức / hết em đủ điều kiện ⇒ tầng kế; hết cả ⇒ bỏ hạn mức.
 */
export function xepEmPhanTang(cau: readonly CauCanGoi[], tuy: TuyChonChon = {}): Map<string, KetQuaGoi> {
  const cheDo = tuy.cheDo ?? CHE_DO_MAC_DINH
  const nowMs = tuy.nowMs ?? 0
  const rng = rngTu(`${tuy.hatGiong ?? ''}|${cheDo}`)
  const daLen = new Map(tuy.daLenTrongBuoi ?? [])
  const goiLuot = new Map<string, number>()
  const hanMuc = Math.max(1, Math.ceil(cau.length / 3))
  const dungTang = new Map<Tang, number>([[1, 0], [2, 0], [3, 0]])
  const ra = new Map<string, KetQuaGoi>()
  let truoc = ''
  for (const c of cau) {
    const bo = tuy.boQua?.get(c.qid)
    const uv = c.ungVien.filter((e) => e.sbd && !bo?.has(e.sbd))
    if (!uv.length) continue
    const tang = chiaTang(uv)
    let chon: UngVienEm | undefined
    if (cheDo === 'chac') chon = chonChac(uv, goiLuot)
    else {
      // Luật "mỗi em một lần": chỉ xét em có số lần lên ít nhất trong số ứng viên câu này; tránh em vừa lên câu liền trước nếu còn em khác.
      const it = Math.min(...uv.map((e) => daLen.get(e.sbd) ?? 0))
      let du = uv.filter((e) => (daLen.get(e.sbd) ?? 0) === it)
      if (du.length > 1) du = du.filter((e) => e.sbd !== truoc)
      if (cheDo === 'ngau') chon = rutTrongSo(du, rng)
      else {
        const thuTu = THU_TU_TANG[c.bac]
        const coEm = (t: Tang) => du.filter((e) => tang.get(e.sbd) === t)
        const t1 = thuTu.find((t) => (dungTang.get(t) ?? 0) < hanMuc && coEm(t).length) ?? thuTu.find((t) => coEm(t).length)
        if (t1) chon = rutTrongSo(coEm(t1), rng)
      }
    }
    if (!chon) continue
    const t = tang.get(chon.sbd) ?? 2
    const lan = (daLen.get(chon.sbd) ?? 0) + 1
    daLen.set(chon.sbd, lan)
    goiLuot.set(chon.sbd, (goiLuot.get(chon.sbd) ?? 0) + 1)
    dungTang.set(t, (dungTang.get(t) ?? 0) + 1)
    truoc = chon.sbd
    ra.set(c.qid, { qid: c.qid, sbd: chon.sbd, ten: chon.ten, tang: t, lyDo: chuLyDo(c.bac, t, chon, nowMs, cheDo, lan), lan })
  }
  return ra
}

/** Hai vai của MỘT câu chữa: em đã sai lên bảng làm · em đã đúng giảng lại (khác em). */
export interface CapChua {
  qid: string
  lenBang?: KetQuaGoi
  giangLai?: KetQuaGoi
}
/**
 * Chữa câu: vai "lên bảng làm" rút trong em ĐÃ SAI câu ấy (phân tầng như `xepEmPhanTang` — câu chữa chủ yếu là câu khó nên vẫn trộn đủ tầng nhờ hạn mức);
 * vai "giảng lại" rút trong em ĐÃ ĐÚNG câu ấy, ưu tiên Khá rồi Trung bình. Không em nào giữ hai vai trong một câu; luật mỗi em một lần áp cho cả hai vai.
 * Không còn em đã sai ⇒ vai lên bảng rút như câu thường (em chưa đúng trước).
 */
export function xepCapChua(cau: readonly CauCanGoi[], tuy: TuyChonChon = {}): Map<string, CapChua> {
  const cheDo = tuy.cheDo ?? CHE_DO_MAC_DINH
  const nowMs = tuy.nowMs ?? 0
  const daLen = new Map(tuy.daLenTrongBuoi ?? [])
  const lenBang = xepEmPhanTang(
    cau.map((c) => {
      const sai = c.ungVien.filter((e) => (e.soSai ?? 0) > 0)
      const chuaDung = c.ungVien.filter((e) => !e.daDung)
      return { ...c, ungVien: sai.length ? sai : chuaDung.length ? chuaDung : c.ungVien }
    }),
    { ...tuy, daLenTrongBuoi: daLen },
  )
  for (const k of lenBang.values()) daLen.set(k.sbd, (daLen.get(k.sbd) ?? 0) + 1)
  const rng = rngTu(`${tuy.hatGiong ?? ''}|${cheDo}|giang`)
  const ra = new Map<string, CapChua>()
  for (const c of cau) {
    const lb = lenBang.get(c.qid)
    const bo = tuy.boQua?.get(`${c.qid}#giang`)
    const dung = c.ungVien.filter((e) => e.daDung && e.sbd !== lb?.sbd && !bo?.has(e.sbd))
    let giang: KetQuaGoi | undefined
    if (dung.length) {
      const tang = chiaTang(c.ungVien)
      const it = Math.min(...dung.map((e) => daLen.get(e.sbd) ?? 0))
      const du = dung.filter((e) => (daLen.get(e.sbd) ?? 0) === it)
      const tg = cheDo === 'ngau' ? undefined : ([3, 2, 1] as const).find((t) => du.some((e) => tang.get(e.sbd) === t))
      const e = cheDo === 'chac' ? [...du].sort((a, b) => (b.p ?? 0) - (a.p ?? 0))[0] : rutTrongSo(tg ? du.filter((x) => tang.get(x.sbd) === tg) : du, rng)
      if (e) {
        const t = tang.get(e.sbd) ?? 2
        const lan = (daLen.get(e.sbd) ?? 0) + 1
        daLen.set(e.sbd, lan)
        giang = { qid: c.qid, sbd: e.sbd, ten: e.ten, tang: t, lan, lyDo: `Đã làm đúng câu này · ${chuLyDo(c.bac, t, e, nowMs, cheDo, lan).split(' · ').slice(1).join(' · ')}` }
      }
    }
    ra.set(c.qid, { qid: c.qid, ...(lb ? { lenBang: { ...lb, lyDo: lb.lyDo.replace(/^[^·]+·/, `Đã sai câu này ${c.ungVien.find((x) => x.sbd === lb.sbd)?.soSai ?? 0} lần ·`) } } : {}), ...(giang ? { giangLai: giang } : {}) })
  }
  return ra
}

/** Phân bố một lượt chọn cho ô "Phân bố": lượt + số em mỗi tầng, số em khác nhau, số em lên từ lần 2, có cặp câu liền nhau trùng em không. */
export interface PhanBoGoi {
  tang: Record<Tang, { luot: number; em: number }>
  soEm: number
  soLuot: number
  lenLan2: number
  lienNhau: boolean
}
export function phanBoGoi(kq: readonly Pick<KetQuaGoi, 'sbd' | 'tang'>[]): PhanBoGoi {
  const tang: PhanBoGoi['tang'] = { 1: { luot: 0, em: 0 }, 2: { luot: 0, em: 0 }, 3: { luot: 0, em: 0 } }
  const emTang = new Map<Tang, Set<string>>([[1, new Set()], [2, new Set()], [3, new Set()]])
  const dem = new Map<string, number>()
  let lienNhau = false
  kq.forEach((k, i) => {
    tang[k.tang].luot++
    emTang.get(k.tang)!.add(k.sbd)
    dem.set(k.sbd, (dem.get(k.sbd) ?? 0) + 1)
    if (i > 0 && kq[i - 1]!.sbd === k.sbd) lienNhau = true
  })
  for (const t of [1, 2, 3] as const) tang[t].em = emTang.get(t)!.size
  return { tang, soEm: dem.size, soLuot: kq.length, lenLan2: [...dem.values()].filter((n) => n > 1).length, lienNhau }
}

/** Chế độ thầy chọn, nhớ trên máy theo kênh (localStorage; lỗi / vắng ⇒ mặc định). */
const KHOA_CHE_DO = 'omr-che-do-chon-em'
export function docCheDo(kenh: string): CheDoChonEm {
  try {
    const v = (JSON.parse(globalThis.localStorage?.getItem(KHOA_CHE_DO) ?? '{}') as Record<string, unknown>)[kenh]
    return v === 'tron' || v === 'chac' || v === 'ngau' ? v : CHE_DO_MAC_DINH
  } catch { return CHE_DO_MAC_DINH }
}
export function ghiCheDo(kenh: string, v: CheDoChonEm): void {
  try {
    const cu = JSON.parse(globalThis.localStorage?.getItem(KHOA_CHE_DO) ?? '{}') as Record<string, unknown>
    globalThis.localStorage?.setItem(KHOA_CHE_DO, JSON.stringify({ ...cu, [kenh]: v }))
  } catch { /* máy không cho lưu — vẫn dùng trong phiên */ }
}
