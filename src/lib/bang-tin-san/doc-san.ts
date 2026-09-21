// BẢNG TIN KIỂU SÀN GIAO DỊCH · BỘ ĐỌC HỢP ĐỒNG `POST /gv/bang-tin-song` (docs/hop-dong-bang-tin-song-2109.md, Code 4 ⇄ Code 3).
// Đọc CÓ CHỐNG SAI KIỂU: khoá nào sai dạng thì bỏ khoá ấy (khối ẩn, KHÔNG bịa 0); thiếu `song` hoặc thiếu `nhip` ⇒ null ⇒ màn dùng Bảng tin bản 3 (`/gv/bang-tin`).
// Mọi khoá của `/gv/bang-tin` nằm cùng thân ⇒ `bt` đọc bằng CHÍNH `docBangTin` (không chép luật đọc).
import { docBangTin, type BangTin } from '../bang-tin-thay'
import { goiLenh, type KetQuaLenh } from '../goi-lenh-thay'
import type { DanDauSan, DuLieuSan, DungNhipSan, EmNhiet, LoaiTin, LopSan, NenSan, TinSan, Tia60 } from './kieu'

/** Tên lớp máy chủ đặt cho em chưa được xếp lớp (`TEN_LOP_CHUA_XEP` ở server/src/ten-lop.ts — test giữ hai chỗ khớp nhau): chữ nội bộ, màn thầy nói "Chưa rõ lớp". */
export const TEN_LOP_MAY_CHU_CHUA_XEP = 'Chưa xếp lớp'
export const TEN_LOP_CHUA_RO = 'Chưa rõ lớp'
export const tenLopHienThi = (ten: string): string => (ten === TEN_LOP_MAY_CHU_CHUA_XEP ? TEN_LOP_CHUA_RO : ten)

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const chuoi = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const doiTuong = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null)
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const khongAm = (v: unknown): number | null => {
  const n = so(v)
  return n !== null && n >= 0 ? n : null
}

function docDayCon(v: unknown): number[] | null {
  const a = mang(v)
  if (a.length < 2) return null
  const ra: number[] = []
  for (const x of a) {
    const n = so(x)
    if (n === null) return null // một điểm hỏng ⇒ cả chuỗi bỏ (không nối cụt làm lệch trục thời gian)
    ra.push(n)
  }
  return ra
}

/** `tia60`: hs / cau / tile phải cùng độ dài (≥ 2); `nhip` vắng / hỏng ⇒ null (không kéo cả tia xuống). */
export function docTia(v: unknown): Tia60 | null {
  const o = doiTuong(v)
  if (!o) return null
  const hs = docDayCon(o.hs)
  const cau = docDayCon(o.cau)
  const tile = docDayCon(o.tile)
  if (!hs || !cau || !tile || hs.length !== cau.length || cau.length !== tile.length) return null
  const nhip = docDayCon(o.nhip)
  return { hs, cau, tile, nhip: nhip && nhip.length === hs.length ? nhip : null }
}

export function docNen(v: unknown): NenSan[] | null {
  const ra: NenSan[] = []
  for (const x of mang(v)) {
    const o = doiTuong(x)
    if (!o) continue
    const tu = so(o.tu), mo = so(o.mo), cao = so(o.cao), thap = so(o.thap), dong = so(o.dong), soCau = khongAm(o.soCau)
    if (tu === null || mo === null || cao === null || thap === null || dong === null || soCau === null) continue
    ra.push({ tu, mo, cao, thap, dong, soCau })
  }
  ra.sort((a, b) => a.tu - b.tu)
  return ra.length > 0 ? ra.slice(-100) : null // chưa có câu nào hôm nay (máy chủ trả []) ⇒ ẩn khối, không vẽ khung rỗng
}

export function docTheoLop(v: unknown): LopSan[] | null {
  const ra: LopSan[] = []
  for (const x of mang(v)) {
    const o = doiTuong(x)
    if (!o) continue
    const lop = chuoi(o.lop)
    const siSo = khongAm(o.siSo), daHoc = khongAm(o.daHoc), soCau = khongAm(o.soCau), soCauDung = khongAm(o.soCauDung)
    if (!lop || siSo === null || daHoc === null || soCau === null || soCauDung === null) continue
    ra.push({ lop: tenLopHienThi(lop), siSo, daHoc, soCau, soCauDung })
  }
  return ra.length > 0 ? ra : null
}

export function docNhiet(v: unknown): EmNhiet[] | null {
  const ra: EmNhiet[] = []
  for (const x of mang(v)) {
    const o = doiTuong(x)
    if (!o) continue
    const sbd = chuoi(o.sbd)
    const soCau = khongAm(o.soCau), soCauDung = khongAm(o.soCauDung)
    if (!sbd || soCau === null || soCauDung === null) continue
    ra.push({ sbd, hoTen: chuoi(o.hoTen) || sbd, lop: tenLopHienThi(chuoi(o.lop)), soCau, soCauDung, dangVap: o.dangVap === true })
  }
  return ra.length > 0 ? ra : null
}

const LOAI_TIN: readonly LoaiTin[] = ['len', 'xuong', 'cham']
export function docTin(v: unknown): TinSan[] {
  const ra: TinSan[] = []
  for (const x of mang(v)) {
    const o = doiTuong(x)
    if (!o) continue
    const luc = so(o.luc)
    const chu = chuoi(o.chu)
    const loai = LOAI_TIN.find((l) => l === o.loai)
    if (luc === null || !chu || !loai) continue
    const phu = chuoi(o.phu)
    ra.push({ luc, loai, chu, ...(phu ? { phu } : {}) })
  }
  ra.sort((a, b) => a.luc - b.luc)
  return ra.slice(-20)
}

export function docDanDau(v: unknown): DanDauSan[] | null {
  const ra: DanDauSan[] = []
  for (const x of mang(v)) {
    const o = doiTuong(x)
    if (!o) continue
    const sbd = chuoi(o.sbd)
    const soCau = khongAm(o.soCau)
    const tienBo = so(o.tienBo)
    if (!sbd || soCau === null || tienBo === null) continue
    ra.push({ sbd, hoTen: chuoi(o.hoTen) || sbd, tenLop: tenLopHienThi(chuoi(o.tenLop)), soCau, tienBo })
  }
  return ra.length > 0 ? ra.slice(0, 5) : null
}

export function docDungNhip(v: unknown): DungNhipSan | null {
  const o = doiTuong(v)
  if (!o) return null
  const soEm = khongAm(o.soEm), soCoLo = khongAm(o.soCoLo)
  return soEm !== null && soCoLo !== null && soCoLo > 0 ? { soEm: Math.min(soEm, soCoLo), soCoLo } : null
}

/** Chữ nội bộ của tên lớp trong các khối lấy nguyên từ `/gv/bang-tin` (bài tập về nhà, em cần để ý). */
function doiTenLopTrongBangTin(bt: BangTin): BangTin {
  return {
    ...bt,
    baiTap: bt.baiTap.map((b) => ({ ...b, tenLop: tenLopHienThi(b.tenLop) })),
    canDeY: { ...bt.canDeY, ds: bt.canDeY.ds.map((e) => ({ ...e, tenLop: tenLopHienThi(e.tenLop) })) },
  }
}

/** Thân `/gv/bang-tin-song` ⇒ `DuLieuSan`; thiếu `song`, thiếu `nhip`, hoặc không có mốc ⇒ null (màn dùng Bảng tin bản 3). `nhanLucMs` = giờ máy khách lúc nhận. */
export function docSan(j: Record<string, unknown>, nhanLucMs: number): DuLieuSan | null {
  const song = doiTuong(j.song)
  if (!song) return null
  const btTho = docBangTin(j)
  if (!btTho) return null
  const mocMs = Date.parse(btTho.tuHomNay || btTho.tu)
  if (!Number.isFinite(mocMs)) return null
  const bt = doiTenLopTrongBangTin(btTho)
  const theoLop = docTheoLop(song.theoLop)
  const tongEm = khongAm(song.tongEm) ?? bt.nhip.tongEm
  return {
    mocMs,
    serverNow: so(j.serverNow) ?? nhanLucMs,
    nhanLucMs,
    tongEm,
    soEmHoc: bt.nhip.soEmHoc,
    soCau: bt.nhip.soCau,
    soCauDung: bt.nhip.soCauDung ?? (theoLop ? theoLop.reduce((t, l) => t + l.soCauDung, 0) : 0),
    dungNhip: docDungNhip(song.dungNhip),
    tia: docTia(song.tia60),
    tin: docTin(song.suKienMoi),
    nen: docNen(song.nen),
    theoLop,
    nhiet: docNhiet(song.nhiet),
    danDau: docDanDau(song.danDau),
    bt,
  }
}

/** Hỏi máy chủ MỘT lần. `ok:false` + `loai` 'chua_co_lenh' (404) hoặc 'tu_choi' (cờ `bang_tin_san = tat`, lỗi phần trực tiếp…) ⇒ nơi gọi dùng Bảng tin bản 3. */
export async function laySan(): Promise<KetQuaLenh<DuLieuSan>> {
  const r = await goiLenh('/gv/bang-tin-song', {}, 'Máy chủ chưa có lệnh Bảng tin sống — đang hiện bản 3.')
  if (!r.ok) return r
  const san = docSan(r.du as Record<string, unknown>, Date.now())
  if (!san) return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả Bảng tin sống không đúng dạng — đang hiện bản 3.' }
  return { ok: true, du: san }
}
