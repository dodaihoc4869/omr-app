// MỤC "BÀI TẬP VỀ NHÀ ĐÃ GIAO" THIẾT KẾ LẠI — PHẦN THUẦN (Code 1, 21/09/2026; thầy chốt 18:1x; đề prompt-btvn-da-giao-thiet-ke-lai-2109.md, hợp đồng docs/hop-dong-btvn-theo-doi-v2-2109.md).
// LUẬT: màn KHÔNG tự tính nhóm em (chưa mở / đúng nhịp / chậm nhịp / xong chặng hôm nay / đã nộp) — chỉ ĐỌC số máy chủ trả (`nhom`) rồi sắp, cộng các dòng cùng một lần giao, đổi ra chữ và độ rộng đoạn.
// Máy chủ cũ thiếu khoá ⇒ `nhom = null` ⇒ thẻ không thanh nhóm, KHÔNG bịa số. Không nhãn năng lực, không xếp hạng em với em.
import type { NhomBtvn } from './nhom-btvn'

export type NhomEm = 'chua_mo' | 'dung_nhip' | 'cham_nhip' | 'xong_hom_nay' | 'da_nop'
export const NHOM_EM: readonly NhomEm[] = ['chua_mo', 'dung_nhip', 'cham_nhip', 'xong_hom_nay', 'da_nop']
export interface NhomBai { chuaMo: number; dungNhip: number; chamNhip: number; xongHomNay: number; daNop: number; nopTre: number }
export interface ChangBai { so: number; ngay: string; laHomNay: boolean }

const soKhongAm = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0

/** Đọc `nhom` của MỘT dòng: đủ sáu số nguyên ≥ 0 mới nhận; thiếu / sai ⇒ null (máy chủ cũ). */
export function docNhomBai(raw: unknown): NhomBai | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const { chuaMo, dungNhip, chamNhip, xongHomNay, daNop, nopTre } = r
  if (![chuaMo, dungNhip, chamNhip, xongHomNay, daNop, nopTre].every(soKhongAm)) return null
  return { chuaMo: chuaMo as number, dungNhip: dungNhip as number, chamNhip: chamNhip as number, xongHomNay: xongHomNay as number, daNop: daNop as number, nopTre: nopTre as number }
}

/** Đường chặng: chỉ nhận phần tử đúng dạng, sắp theo số chặng; rỗng ⇒ bài không chia chặng. */
export function docChang(raw: unknown): ChangBai[] {
  if (!Array.isArray(raw)) return []
  const ra: ChangBai[] = []
  for (const c of raw) {
    const o = c as Record<string, unknown> | null
    if (!o || typeof o !== 'object' || !Number.isInteger(o.so) || (o.so as number) < 1 || typeof o.ngay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.ngay)) continue
    ra.push({ so: o.so as number, ngay: o.ngay, laHomNay: o.laHomNay === true })
  }
  return ra.sort((a, b) => a.so - b.so)
}

const cong = (a: NhomBai, b: NhomBai): NhomBai => ({
  chuaMo: a.chuaMo + b.chuaMo, dungNhip: a.dungNhip + b.dungNhip, chamNhip: a.chamNhip + b.chamNhip, xongHomNay: a.xongHomNay + b.xongHomNay, daNop: a.daNop + b.daNop, nopTre: a.nopTre + b.nopTre,
})

/** MỘT bài như thẻ nhìn thấy (đã gộp các dòng `btvn` cùng một lần giao). */
export interface TheBai {
  khoa: string
  /** Tên đọc được của máy chủ; máy cũ ⇒ tên cũ do nơi gọi đưa vào (`coTenMoi = false`). */
  ten: string
  coTenMoi: boolean
  tenLop: string
  tong: number
  /** Số em đã nộp (số máy chủ). */
  daNop: number
  soCau: number
  soCauLoi: number | null
  /** Bài nâng đỡ (mỗi em một bộ câu riêng). */
  caNhan: boolean
  giaoLuc: string
  hanNop: string
  hanMs: number | null
  quaHan: boolean
  chang: ChangBai[]
  chiaChang: boolean
  /** Số em theo nhóm — CỘNG các dòng của lần giao; MỘT dòng thiếu ⇒ null (không cộng nửa vời). */
  nhom: NhomBai | null
  /** Mức cần để ý = chậm nhịp × 2 + chưa mở (chỉ để SẮP thẻ); không có nhóm ⇒ 0. */
  mucCanY: number
  daNopHet: boolean
}

export const mucCanYCuaNhom = (n: NhomBai | null): number => (n ? n.chamNhip * 2 + n.chuaMo : 0)

/**
 * Số em CHƯA NỘP của bài ĐÃ QUA HẠN (số máy chủ: tổng − đã nộp; không tính thu hồi vì `tong` đã loại). Bài chưa quá hạn ⇒ 0. Dùng cho dải "cần thầy để ý" và thẻ: bài KHÔNG chia chặng quá hạn còn em đang làm dở
 * vốn không có nhóm "chậm nhịp" (nhóm ấy chỉ có ở bài chia chặng) nhưng vẫn là việc thầy cần thấy — không được nói "mọi bài đúng nhịp".
 */
export function chuaNopQuaHan(b: Pick<TheBai, 'hanMs' | 'tong' | 'daNop'>, nowMs: number): number {
  return b.hanMs !== null && b.hanMs <= nowMs ? Math.max(0, b.tong - b.daNop) : 0
}

const khongTrung = (ds: readonly string[]): string[] => [...new Set(ds.map((x) => x.trim()).filter(Boolean))]

/** Từ MỘT lần giao (`nhomBtvn`) ra thẻ. `tenCu` = cách gọi tên cũ khi máy chủ chưa trả `ten`. */
export function baiChoThe(t: NhomBtvn, tenCu: (t: NhomBtvn) => string): TheBai {
  const dong = t.baiGoc?.length ? t.baiGoc : [t]
  const tenMoi = dong.map((d) => (typeof d.ten === 'string' ? d.ten.trim() : '')).find(Boolean) ?? ''
  const nhomDong = dong.map((d) => docNhomBai(d.nhom))
  const nhom = nhomDong.length > 0 && nhomDong.every((n): n is NhomBai => n !== null) ? nhomDong.reduce((a, b) => cong(a, b)) : null
  const chang = dong.map((d) => docChang(d.chang)).find((c) => c.length > 0) ?? []
  const soCauLoi = dong.map((d) => (soKhongAm(d.soCauLoi) ? d.soCauLoi : soKhongAm(d.soLoi) ? d.soLoi : null)).find((x) => x !== null) ?? null
  const hanMs = Date.parse(t.hanNop)
  const tenLop = khongTrung(dong.map((d) => (typeof d.tenLop === 'string' ? d.tenLop : ''))).join(' · ')
  return {
    khoa: t.maBtvn,
    ten: tenMoi && tenLop && !tenLop.includes(' · ') && !tenMoi.includes(tenLop) ? `${tenLop} · ${tenMoi}` : tenMoi || tenCu(t), // máy chủ trả `ten` KHÔNG kèm lớp (đã có tenLop): thẻ đọc "Lớp 10 · Chương 2 · Bài 5"
    coTenMoi: tenMoi !== '',
    tenLop,
    tong: t.tong,
    daNop: t.daNop,
    soCau: t.soCau,
    soCauLoi,
    caNhan: t.caNhan === true,
    giaoLuc: t.giaoLuc,
    hanNop: t.hanNop,
    hanMs: Number.isFinite(hanMs) ? hanMs : null,
    quaHan: t.quaHan,
    chang,
    chiaChang: chang.length > 0,
    nhom,
    mucCanY: mucCanYCuaNhom(nhom),
    daNopHet: t.tong > 0 && t.daNop >= t.tong,
  }
}

/** Sắp thẻ: mức cần để ý giảm dần, rồi HẠN GẦN trước (không hạn ⇒ cuối), rồi giao muộn trước; ổn định. */
export function sapXepThe<T extends Pick<TheBai, 'mucCanY' | 'hanMs' | 'giaoLuc'>>(ds: readonly T[]): T[] {
  return ds
    .map((x, i) => ({ x, i }))
    .sort((a, b) => b.x.mucCanY - a.x.mucCanY || (a.x.hanMs ?? Infinity) - (b.x.hanMs ?? Infinity) || (a.x.giaoLuc < b.x.giaoLuc ? 1 : a.x.giaoLuc > b.x.giaoLuc ? -1 : 0) || a.i - b.i)
    .map((o) => o.x)
}

// ─────────────────────────────── giờ VN, chữ ───────────────────────────────
const LECH_VN = 7 * 3_600_000
const MS_NGAY = 86_400_000
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const hai = (n: number) => String(n).padStart(2, '0')
const vn = (ms: number) => new Date(ms + LECH_VN)
export const ngayVnCuaMs = (ms: number): string => vn(ms).toISOString().slice(0, 10)
const gioPhut = (ms: number): string => `${hai(vn(ms).getUTCHours())}:${hai(vn(ms).getUTCMinutes())}`
const thuCuaNgay = (ngay: string): string => THU[new Date(`${ngay}T00:00:00Z`).getUTCDay()] ?? ''
const ddmm = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`

/** "12:00 Thứ Năm 24/09" — hạn nộp cho thầy đọc. */
export function chuHanNop(hanMs: number | null): string {
  if (hanMs === null) return 'Chưa có hạn hợp lệ'
  const ngay = ngayVnCuaMs(hanMs)
  return `${gioPhut(hanMs)} ${thuCuaNgay(ngay)} ${ddmm(ngay)}`
}

/** Đếm ngược tới hạn theo PHÚT: "còn 2 ngày 17 giờ" · "còn 5 giờ 12 phút" · "còn 42 phút"; dưới 6 giờ ⇒ `cam`; hết hạn ⇒ "Đã qua hạn". */
export function demNguocHan(hanMs: number | null, nowMs: number): { chu: string; cam: boolean; qua: boolean } {
  if (hanMs === null) return { chu: 'Chưa có hạn hợp lệ', cam: false, qua: false }
  const con = hanMs - nowMs
  if (con <= 0) return { chu: 'Đã qua hạn', cam: false, qua: true }
  const phut = Math.floor(con / 60_000)
  const ngay = Math.floor(phut / 1440)
  const gio = Math.floor((phut % 1440) / 60)
  const p = phut % 60
  const chu = ngay > 0 ? `còn ${ngay} ngày ${gio} giờ` : gio > 0 ? `còn ${gio} giờ ${p} phút` : `còn ${Math.max(1, p)} phút`
  return { chu, cam: con < 6 * 3_600_000, qua: false }
}

/** "giao 10:48 Thứ Hai" */
export function chuGiaoLuc(giaoLuc: string): string {
  const ms = Date.parse(giaoLuc)
  if (!Number.isFinite(ms)) return ''
  return `giao ${gioPhut(ms)} ${thuCuaNgay(ngayVnCuaMs(ms))}`
}

// ─────────────────────────────── dải "cần thầy để ý" ───────────────────────────────
export interface DaiCanY {
  /** Ô "Em chưa mở bài": số em và số bài; null = 0 ⇒ ẨN. */
  chuaMo: { em: number; bai: number } | null
  /** Ô "Em chậm nhịp": số em; null = 0 ⇒ ẨN. */
  chamNhip: { em: number; bai: number } | null
  /** Ô "Em chưa nộp quá hạn": số em chưa nộp của các bài ĐÃ QUA HẠN; null = 0 ⇒ ẨN. */
  chuaNopQuaHan: { em: number; bai: number } | null
  /** Ô "Hạn gần nhất": bài CHƯA nộp hết còn hạn, hạn gần nhất; null ⇒ ẨN. */
  hanGanNhat: { ten: string; chu: string; cam: boolean; hanMs: number } | null
  /** Mọi bài đều có số nhóm (máy chủ mới). Thiếu ⇒ KHÔNG nói "mọi bài đúng nhịp" (không biết). */
  coDuNhom: boolean
  /** Ba ô trống VÀ biết chắc ⇒ một dòng xanh "Mọi bài đang đúng nhịp". */
  moiBaiDungNhip: boolean
}

export function daiCanYNhu(ds: readonly TheBai[], nowMs: number): DaiCanY {
  let emChua = 0, baiChua = 0, emCham = 0, baiCham = 0, emQua = 0, baiQua = 0
  const coDuNhom = ds.length > 0 && ds.every((b) => b.nhom !== null)
  for (const b of ds) {
    const qua = chuaNopQuaHan(b, nowMs)
    if (qua > 0) { emQua += qua; baiQua++ }
    if (!b.nhom) continue
    if (b.nhom.chuaMo > 0) { emChua += b.nhom.chuaMo; baiChua++ }
    if (b.nhom.chamNhip > 0) { emCham += b.nhom.chamNhip; baiCham++ }
  }
  let gan: DaiCanY['hanGanNhat'] = null
  for (const b of ds) {
    if (b.hanMs === null || b.hanMs <= nowMs || b.daNopHet) continue
    if (!gan || b.hanMs < gan.hanMs) gan = { ten: b.ten, ...demNguocHan(b.hanMs, nowMs), hanMs: b.hanMs }
  }
  const chuaMo = emChua > 0 ? { em: emChua, bai: baiChua } : null
  const chamNhip = emCham > 0 ? { em: emCham, bai: baiCham } : null
  const quaHan = emQua > 0 ? { em: emQua, bai: baiQua } : null
  return {
    chuaMo, chamNhip, chuaNopQuaHan: quaHan, hanGanNhat: gan ? { ten: gan.ten, chu: gan.chu, cam: gan.cam, hanMs: gan.hanMs } : null, coDuNhom,
    moiBaiDungNhip: coDuNhom && !chuaMo && !chamNhip && !quaHan && !gan,
  }
}

// ─────────────────────────────── đường chặng, thanh nhóm ───────────────────────────────
export interface DiemChang { so: number; nhan: string; trangThai: 'qua' | 'nay' | 'toi' }

/** "Chặng 1 · hôm nay" | "Chặng 2 · Thứ Ba" | (xa hơn 6 ngày) "Chặng 5 · 30/09". Chặng hôm nay = cờ của MÁY CHỦ; trước nó = đã qua, sau nó = tới. Không cờ nào ⇒ so với ngày VN của `nowMs`. */
export function duongChang(chang: readonly ChangBai[], nowMs: number): DiemChang[] {
  const homNay = ngayVnCuaMs(nowMs)
  const viTriNay = chang.findIndex((c) => c.laHomNay)
  return chang.map((c, i) => {
    const trangThai: DiemChang['trangThai'] = c.laHomNay ? 'nay' : viTriNay >= 0 ? (i < viTriNay ? 'qua' : 'toi') : c.ngay < homNay ? 'qua' : 'toi'
    const cachNgay = Math.round((Date.parse(`${c.ngay}T00:00:00Z`) - Date.parse(`${homNay}T00:00:00Z`)) / MS_NGAY)
    const ngayChu = c.laHomNay ? 'hôm nay' : cachNgay === -1 ? 'hôm qua' : cachNgay === 1 ? 'ngày mai' : Math.abs(cachNgay) <= 6 ? thuCuaNgay(c.ngay) : ddmm(c.ngay)
    return { so: c.so, nhan: `Chặng ${c.so} · ${ngayChu}`, trangThai }
  })
}

export type SacNhom = 'xam' | 'duong' | 'cam' | 'la' | 'la_dam'
export interface DoanNhom { khoa: NhomEm; nhan: string; so: number; phanTram: number; hep: boolean; sac: SacNhom }
/** Đoạn có độ rộng dưới ngưỡng này thì số không nằm trong đoạn mà chỉ ra chú giải. */
export const NGUONG_DOAN_HEP = 9

const SAC: Record<NhomEm, SacNhom> = { chua_mo: 'xam', dung_nhip: 'duong', cham_nhip: 'cam', xong_hom_nay: 'la', da_nop: 'la_dam' }
const NHAN_CO_CHANG: Record<NhomEm, string> = { chua_mo: 'chưa mở', dung_nhip: 'đúng nhịp', cham_nhip: 'chậm nhịp', xong_hom_nay: 'xong chặng hôm nay', da_nop: 'đã nộp cả bài' }
// Bài KHÔNG chia chặng: máy chủ đặt em chưa nộp của bài QUÁ HẠN vào cham_nhip (đúng emChamNhip của Bảng tin) ⇒ nhãn "quá hạn chưa nộp".
const NHAN_KHONG_CHANG: Record<NhomEm, string> = { chua_mo: 'chưa mở', dung_nhip: 'đang làm', cham_nhip: 'quá hạn chưa nộp', xong_hom_nay: 'xong chặng hôm nay', da_nop: 'đã nộp' }
export const nhanNhomEm = (khoa: NhomEm, chiaChang: boolean): string => (chiaChang ? NHAN_CO_CHANG : NHAN_KHONG_CHANG)[khoa]

const soCuaNhom = (n: NhomBai, k: NhomEm): number => (k === 'chua_mo' ? n.chuaMo : k === 'dung_nhip' ? n.dungNhip : k === 'cham_nhip' ? n.chamNhip : k === 'xong_hom_nay' ? n.xongHomNay : n.daNop)

/**
 * THANH NHÓM cả lớp: chưa mở · đúng nhịp · chậm nhịp · xong chặng hôm nay · đã nộp (chỉ khi > 0). Bài KHÔNG chia chặng: chưa mở · đang làm · đã nộp.
 * `doan` = các đoạn có số > 0 (độ rộng % theo số / tổng các đoạn); `chuGiai` = mọi nhóm của bài (kể cả 0, trừ "đã nộp" khi 0).
 */
export function thanhNhom(nhom: NhomBai, chiaChang: boolean): { doan: DoanNhom[]; chuGiai: { khoa: NhomEm; nhan: string; so: number; sac: SacNhom }[]; tong: number } {
  const khoa = (chiaChang ? NHOM_EM : (['chua_mo', 'dung_nhip', 'cham_nhip', 'da_nop'] as NhomEm[])).filter((k) => (k !== 'da_nop' || nhom.daNop > 0) && (chiaChang || k !== 'cham_nhip' || nhom.chamNhip > 0))
  const tong = khoa.reduce((s, k) => s + soCuaNhom(nhom, k), 0)
  const doan: DoanNhom[] = khoa
    .filter((k) => soCuaNhom(nhom, k) > 0)
    .map((k) => {
      const so = soCuaNhom(nhom, k)
      const phanTram = tong > 0 ? (so / tong) * 100 : 0
      return { khoa: k, nhan: nhanNhomEm(k, chiaChang), so, phanTram, hep: phanTram < NGUONG_DOAN_HEP, sac: SAC[k] }
    })
  return { doan, chuGiai: khoa.map((k) => ({ khoa: k, nhan: nhanNhomEm(k, chiaChang), so: soCuaNhom(nhom, k), sac: SAC[k] })), tong }
}

/** Số em "cần để ý" của thẻ (nút "Xem N em này"): chưa mở + chậm nhịp — ĐỌC từ số của máy chủ. */
export const soEmCanY = (n: NhomBai | null): number => (n ? n.chuaMo + n.chamNhip : 0)

// ─────────────────────────────── ngăn danh sách em ───────────────────────────────
export type EmCuaBai = NonNullable<NhomBtvn['hocSinh']>[number]

const bo = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').replace(/\u0110/g, 'D').toLowerCase().trim()
/** Không dấu, không phân biệt hoa thường. */
export const chuanTim = bo

export function emKhopTim(e: { sbd: string; hoTen: string }, q: string): boolean {
  const k = bo(q)
  return k === '' || bo(e.hoTen).includes(k) || bo(e.sbd).includes(k)
}

const tenGoiEm = (hoTen: string): string => hoTen.trim().split(/\s+/).pop() ?? hoTen

/** Em của bài (đã gộp) — thu hồi bị bỏ; máy cũ chưa có `nhom` của em ⇒ trả rỗng cho tab (ngăn nói "Cập nhật máy chủ"). */
/** Tab của ngăn: một nhóm, "cần để ý" (chưa mở + chậm nhịp — nút "Xem N em này") hoặc tất cả. */
export type NhomChon = NhomEm | 'can_y' | 'chua_nop' | 'tat_ca'
export const laCanY = (n: NhomEm | undefined): boolean => n === 'chua_mo' || n === 'cham_nhip'
/** Em CHƯA NỘP: có nhóm ⇒ khác "đã nộp"; máy cũ chưa có nhóm ⇒ chưa có giờ nộp. */
export const laChuaNop = (e: Pick<EmCuaBai, 'nhom' | 'nopLuc'>): boolean => (e.nhom ? e.nhom !== 'da_nop' : !e.nopLuc)

export function emTheoNhom(hs: readonly EmCuaBai[] | undefined, nhom: NhomChon, q = ''): EmCuaBai[] {
  return (hs ?? [])
    .filter((e) => !e.thuHoi && (nhom === 'tat_ca' || (nhom === 'can_y' ? laCanY(e.nhom) : nhom === 'chua_nop' ? laChuaNop(e) : e.nhom === nhom)) && emKhopTim(e, q))
    .slice()
    .sort((a, b) => tenGoiEm(a.hoTen).localeCompare(tenGoiEm(b.hoTen), 'vi') || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd))
}

/** Đếm em theo nhóm cho các tab của ngăn: ĐỌC `nhom` của từng em (máy chủ tính). `coNhom` = mọi em đều có nhóm. */
export function demEmTheoNhom(hs: readonly EmCuaBai[] | undefined, q = ''): { tatCa: number; canY: number; chuaNop: number; theo: Record<NhomEm, number>; coNhom: boolean } {
  const ds = (hs ?? []).filter((e) => !e.thuHoi && emKhopTim(e, q))
  const theo: Record<NhomEm, number> = { chua_mo: 0, dung_nhip: 0, cham_nhip: 0, xong_hom_nay: 0, da_nop: 0 }
  for (const e of ds) if (e.nhom) theo[e.nhom]++
  return { tatCa: ds.length, canY: theo.chua_mo + theo.cham_nhip, chuaNop: ds.filter(laChuaNop).length, theo, coNhom: ds.length > 0 && ds.every((e) => !!e.nhom) }
}

/** "hôm nay 20:41" · "hôm qua 20:41" · "3 ngày trước" · null ⇒ "chưa mở". */
export function chuHocGanNhat(iso: string | null | undefined, nowMs: number): string {
  const ms = iso ? Date.parse(iso) : NaN
  if (!Number.isFinite(ms)) return 'chưa mở'
  const cach = Math.round((Date.parse(`${ngayVnCuaMs(nowMs)}T00:00:00Z`) - Date.parse(`${ngayVnCuaMs(ms)}T00:00:00Z`)) / MS_NGAY)
  if (cach <= 0) return `hôm nay ${gioPhut(ms)}`
  if (cach === 1) return `hôm qua ${gioPhut(ms)}`
  return `${cach} ngày trước`
}

/** "Chặng 2 · 14/32 câu" — chặng em đang ở + số câu đã làm / số câu của em; thiếu phần nào bỏ phần đó, không bịa. */
export function chuTienDoEm(e: Pick<EmCuaBai, 'changHienTai' | 'soCauDaLam' | 'soCauCuaEm' | 'soCau'>): string {
  const cuaEm = soKhongAm(e.soCauCuaEm) ? e.soCauCuaEm : soKhongAm(e.soCau) ? e.soCau : null
  const chang = soKhongAm(e.changHienTai) && e.changHienTai > 0 ? `Chặng ${e.changHienTai}` : ''
  const cau = soKhongAm(e.soCauDaLam) ? (cuaEm !== null ? `${e.soCauDaLam}/${cuaEm} câu` : `${e.soCauDaLam} câu`) : ''
  return [chang, cau].filter(Boolean).join(' · ')
}

export const chuNopTre = (gio: number | undefined): string => (soKhongAm(gio) && gio > 0 ? `nộp trễ ${gio} giờ` : '')

// ─────────────────────────────── bộ lọc lớp + ô tìm chung ───────────────────────────────
/** Tên lớp chuẩn của các bài (bỏ trống, không trùng, sắp theo số rồi chữ). */
export function lopCuaCacBai(ds: readonly TheBai[]): string[] {
  return [...new Set(ds.flatMap((b) => b.tenLop.split(' · ').map((x) => x.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))
}

/** Lọc bài theo lớp ('' = tất cả) và ô tìm chung: có ô tìm ⇒ CHỈ còn bài có em khớp; trả kèm em khớp đầu tiên của mỗi bài (mở sẵn ngăn ở đúng em). */
export function locBai(ds: readonly TheBai[], emCuaBai: (khoa: string) => readonly EmCuaBai[] | undefined, lop: string, q: string): { bai: TheBai; emDau: EmCuaBai | null }[] {
  const ra: { bai: TheBai; emDau: EmCuaBai | null }[] = []
  for (const b of ds) {
    if (lop && !b.tenLop.split(' · ').includes(lop)) continue
    if (bo(q) === '') { ra.push({ bai: b, emDau: null }); continue }
    const em = emTheoNhom(emCuaBai(b.khoa), 'tat_ca', q)[0] ?? null
    if (em) ra.push({ bai: b, emDau: em })
  }
  return ra
}
