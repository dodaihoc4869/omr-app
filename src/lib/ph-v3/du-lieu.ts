// APP PHỤ HUYNH MỚI 28/09 (chỉ xem báo cáo; bản vẽ https://claude.ai/artifact/2HShm51xEiuVKcTAUpfeFT) — lớp ĐỌC CHẶT ba lệnh chỉ-đọc mới (server/src/ph-bao-cao-moi.ts):
//   POST /ph/bao-cao-ca {pass|sbd, maCa} ⇒ báo cáo một ca của con (+ nhận xét của thầy khi ca đã công bố)
//   POST /ph/loi-thay   {pass|sbd}       ⇒ nhận xét của thầy ở các ca đã công bố
//   POST /ph/hoc-2      {pass|sbd}       ⇒ chiến dịch Game Hoá 2.0 + kế hoạch hôm nay đã chốt + câu từng sai
// Cùng nguyên tắc với src/lib/ph-moi/du-lieu.ts: khối sai dạng ⇒ VẮNG (không bịa 0); ca CHƯA công bố ⇒ không điểm/đáp án/nhận xét dù JSON lỡ có; không trường game; không ném lỗi.
import type { CongBo } from '../ph-moi/du-lieu'

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
const iso = (x: unknown): string => (typeof x === 'string' && Number.isFinite(Date.parse(x)) ? x : '')
const ngayChuoi = (x: unknown): string => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : '')

function docCongBo(x: unknown): CongBo | null {
  if (!laDoiTuong(x)) return null
  const k = x.congBo === 'ngay' || x.congBo === 'ca_lop_xong' ? x.congBo : 'khong'
  return { congBo: k, daCongBo: x.daCongBo === true, soEmDaNop: nguyenKhongAm(x.soEmDaNop) ?? 0, soEmDaVao: nguyenKhongAm(x.soEmDaVao) ?? 0 }
}

// ---------------------------------------------------------------- báo cáo một ca ----------------------------------------------------------------
/** `toiDa` = trần điểm của phần (máy chủ tính bằng `quotaPhan` — cùng nguồn với chấm điểm); vắng ⇒ null, màn chỉ ghi điểm. */
export interface PhanCa { ma: 'I' | 'II' | 'III'; dung: number; tong: number; motPhan: number; diem: number | null; toiDa: number | null }
export interface DangCa { ten: string; dung: number; tong: number }
export interface CauXemLai { qid: string; phan: 'I' | 'II' | 'III'; soCau: number | null; de: string; dapAnChon: string; dapAnDung: string; loiGiai: string; laDungNhungLau: boolean }
export interface BaoCaoCa {
  maCa: string
  tenCa: string
  nopLuc: string
  thoiGianLamGiay: number | null
  congBo: CongBo
  /** CHỈ khi đã công bố. */
  ketQua: { tong: number; soCau: number | null; soCauDung: number | null } | null
  truoc: { tenCa: string; tong: number | null; doi: number } | null
  phan: PhanCa[]
  dang: DangCa[]
  cauXemLai: CauXemLai[]
  nhanXet: { noiDung: string; capNhatLuc: string } | null
}
const laPhan = (x: unknown): x is 'I' | 'II' | 'III' => x === 'I' || x === 'II' || x === 'III'

export function docBaoCaoCa(raw: unknown): BaoCaoCa | null {
  if (!laDoiTuong(raw) || raw.ok !== true || !laDoiTuong(raw.ca)) return null
  const ca = raw.ca
  const maCa = chuoi(ca.maCa, 80)
  const congBo = docCongBo(raw.congBo)
  if (!maCa || !congBo) return null
  const g = soKhongAm(ca.thoiGianLamGiay)
  const base: BaoCaoCa = {
    maCa, tenCa: chuoi(ca.tenCa, 120) || `Ca ${maCa}`, nopLuc: iso(ca.nopLuc), thoiGianLamGiay: g !== null && g > 0 ? g : null, congBo,
    ketQua: null, truoc: null, phan: [], dang: [], cauXemLai: [], nhanXet: null,
  }
  // CHƯA công bố: chỉ tên ca + trạng thái công bố — không điểm, không đáp án, không nhận xét (luật công bố đứng trên mọi khối).
  if (!congBo.daCongBo) return base
  const kq = laDoiTuong(raw.ketQua) ? raw.ketQua : null
  const tong = kq ? soKhongAm(kq.tong) : null
  if (tong === null) return base
  const tr = laDoiTuong(raw.truoc) ? raw.truoc : null
  const phan: PhanCa[] = []
  for (const p of mang(raw.phan)) {
    if (!laDoiTuong(p) || !laPhan(p.ma)) continue
    const dung = nguyenKhongAm(p.dung)
    const t = nguyenKhongAm(p.tong)
    if (dung === null || t === null || t <= 0 || dung > t) continue
    const toiDa = soKhongAm(p.toiDa)
    phan.push({ ma: p.ma, dung, tong: t, motPhan: nguyenKhongAm(p.motPhan) ?? 0, diem: soKhongAm(p.diem), toiDa: toiDa !== null && toiDa > 0 ? toiDa : null })
  }
  const dang: DangCa[] = []
  for (const d of mang(raw.dang)) {
    if (!laDoiTuong(d)) continue
    const dung = nguyenKhongAm(d.dung)
    const t = nguyenKhongAm(d.tong)
    if (dung === null || t === null || t <= 0 || dung > t) continue
    dang.push({ ten: chuoi(d.ten, 120) || 'Dạng chưa đặt tên', dung, tong: t })
  }
  const cauXemLai: CauXemLai[] = []
  for (const c of mang(raw.cauCanXemLai)) {
    if (!laDoiTuong(c) || !laPhan(c.phan)) continue
    const qid = chuoi(c.qid, 120)
    if (!qid) continue
    cauXemLai.push({
      qid, phan: c.phan, soCau: nguyenKhongAm(c.soCau), de: chuoi(c.de, 400), dapAnChon: chuoi(c.dapAnChon, 40), dapAnDung: chuoi(c.dapAnDung, 40),
      loiGiai: typeof c.loiGiai === 'string' ? c.loiGiai.trim().slice(0, 4000) : '', laDungNhungLau: c.laDungNhungLau === true,
    })
  }
  const nx = laDoiTuong(raw.nhanXet) ? raw.nhanXet : null
  const noiDung = nx && typeof nx.noiDung === 'string' ? nx.noiDung.trim().slice(0, 2000) : ''
  return {
    ...base,
    ketQua: { tong, soCau: kq ? nguyenKhongAm(kq.soCau) : null, soCauDung: kq ? nguyenKhongAm(kq.soCauDung) : null },
    truoc: tr && so(tr.doi) !== null ? { tenCa: chuoi(tr.tenCa, 120), tong: soKhongAm(tr.tong), doi: so(tr.doi) as number } : null,
    phan, dang, cauXemLai,
    nhanXet: noiDung ? { noiDung, capNhatLuc: iso(nx?.capNhatLuc) } : null,
  }
}

// ---------------------------------------------------------------- lời thầy ----------------------------------------------------------------
export interface NhanXetCa { maCa: string; tenCa: string; noiDung: string; capNhatLuc: string; nopLuc: string; tong: number | null }
export function docLoiThay(raw: unknown): NhanXetCa[] | null {
  if (!laDoiTuong(raw) || raw.ok !== true) return null
  const ra: NhanXetCa[] = []
  for (const x of mang(raw.nhanXet)) {
    if (!laDoiTuong(x)) continue
    const maCa = chuoi(x.maCa, 80)
    const noiDung = typeof x.noiDung === 'string' ? x.noiDung.trim().slice(0, 2000) : ''
    if (!maCa || !noiDung) continue
    ra.push({ maCa, tenCa: chuoi(x.tenCa, 120) || `Ca ${maCa}`, noiDung, capNhatLuc: iso(x.capNhatLuc), nopLuc: iso(x.nopLuc), tong: soKhongAm(x.tong) })
  }
  return ra
}

// ---------------------------------------------------------------- Game Hoá 2.0 của con ----------------------------------------------------------------
export interface Hoc2 {
  chienDich: { ten: string; hanNop: string; conNgay: number; tong: number; daGap: number; thanhThao: number; canDayLai: number } | null
  homNay: { tong: number; daLam: number } | null
  cauTungSai: { tong: number; thanhThao: number; canDayLai: number; dangOn: number } | null
}
export function docHoc2(raw: unknown): Hoc2 | null {
  if (!laDoiTuong(raw) || raw.ok !== true) return null
  if (raw.cheDo2 !== true) return { chienDich: null, homNay: null, cauTungSai: null }
  let chienDich: Hoc2['chienDich'] = null
  if (laDoiTuong(raw.chienDich)) {
    const c = raw.chienDich
    const tong = nguyenKhongAm(c.tong)
    const daGap = nguyenKhongAm(c.daGap)
    const thanhThao = nguyenKhongAm(c.thanhThao)
    const canDayLai = nguyenKhongAm(c.canDayLai)
    const hanNop = ngayChuoi(c.hanNop)
    if (tong !== null && tong > 0 && daGap !== null && thanhThao !== null && canDayLai !== null && hanNop && daGap <= tong && thanhThao + canDayLai <= daGap)
      chienDich = { ten: chuoi(c.ten, 120) || 'Chiến dịch của lớp', hanNop, conNgay: nguyenKhongAm(c.conNgay) ?? 0, tong, daGap, thanhThao, canDayLai }
  }
  let homNay: Hoc2['homNay'] = null
  if (laDoiTuong(raw.homNay)) {
    const tong = nguyenKhongAm(raw.homNay.tong)
    const daLam = nguyenKhongAm(raw.homNay.daLam)
    if (tong !== null && tong > 0 && daLam !== null && daLam <= tong) homNay = { tong, daLam }
  }
  let cauTungSai: Hoc2['cauTungSai'] = null
  if (laDoiTuong(raw.cauTungSai)) {
    const t = raw.cauTungSai
    const tong = nguyenKhongAm(t.tong)
    const thanhThao = nguyenKhongAm(t.thanhThao)
    const canDayLai = nguyenKhongAm(t.canDayLai)
    const dangOn = nguyenKhongAm(t.dangOn)
    if (tong !== null && tong > 0 && thanhThao !== null && canDayLai !== null && dangOn !== null && thanhThao + canDayLai + dangOn === tong) cauTungSai = { tong, thanhThao, canDayLai, dangOn }
  }
  return { chienDich, homNay, cauTungSai }
}
