// GAME HÓA 2.0 — lớp gọi máy chủ của app học sinh (hợp đồng: docs/hop-dong-game-hoa-2.md, mục A).
// Mọi lệnh đi qua `POST /game-v2/<lệnh>` kèm `token` của em — đúng cách game đang gọi (Game.tsx `request`).
// Đọc CHẶT: trường thiếu/sai kiểu thì bỏ, KHÔNG bịa số. Cờ `cheDo2` chỉ tính khi đúng `true`.
import { useEffect, useRef, useState } from 'react'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { danhDauDaNhan, layHoiSom, xemHoiSomDaVe } from '../../lib/hoi-som'
import { loiCuaKetQua } from '../../game/than-thu-v2/loi-het-tran'
import { laCauTuLuan } from '../../lib/cau-tu-luan'
import { chanCauTuLuan, choPhepCauChoEm } from '../../lib/cau-tu-luan-may-hs'
import { docSanhOmni } from '../../lib/omni-hs'
import type { SanhOmni } from '../../../server/src/omni-kieu'

export interface ChienDichSanh {
  id: string
  ten: string
  /** 'YYYY-MM-DD' — hạn nộp hết lúc 23:59 ngày này (giờ Việt Nam). */
  hanNop: string
  D: number
  tong: number
  coXat: number
  thanhThao: number
  canDayLai: number
  /** 'YYYY-MM-DD' hoặc null khi đã có câu thành thạo. */
  thanhThaoTangTu: string | null
}

export interface SanhHoa2 {
  ngay: string
  chienDich: ChienDichSanh | null
  /** Chiến dịch chưa tới ngày bắt đầu (thầy 28/09): chỉ tên + ngày, không lộ câu. Máy chủ cũ không gửi ⇒ null. */
  sapBatDau?: { ten: string; batDau: string } | null
  theLuc: { con: number; tong: number }
  huyetChien: boolean
  doan: { con: number }
  dao: { con: number }
  khoaDao: boolean
  loiKhoaDao: string
  ruong: { daLam: number; tong: number; moDuoc: boolean; daMo: boolean; qua: { vang: number } | null }
  /** Cửa thứ ba Bi-a Phản Ứng (máy chủ trả kèm `hoa2-sanh` khi cờ `bi_a` bật). null ⇒ không vẽ cửa. */
  bia: BiaTrenSanh | null
  /** 30/09: số câu còn lại hôm nay đang tạm giữ vì lớp có ca kiểm tra (chỉ số, không qid). 0 ⇒ không có / máy chủ cũ. */
  tamGiuCa: number
  /**
   * THỬ SỨC THÊM (thầy 30/09): xong kế hoạch hôm nay ⇒ được lấy trước `soCau` câu mới của ngày mai (không bắt buộc). Chỉ vẽ nút khi `duoc` và `soCau > 0`.
   * Máy chủ cũ / thiếu / rác ⇒ `{ duoc: false, soCau: 0 }`.
   */
  thuSucThem: { duoc: boolean; soCau: number }
  /** 01/10: chuỗi ngày học (số ngày VN liên tiếp em có làm ≥ 1 câu; hôm nay chưa làm ⇒ giữ tới hôm qua). Máy chủ cũ không gửi ⇒ null (dùng số cũ). */
  chuoiNgay?: number | null
  /** OMNI 3 (05/10, docs/hop-dong-omni-3.md mục A): CHỈ có khi công tắc `omni` áp cho em. Vắng ⇒ Sảnh y hệt hôm nay (không dòng thêm, không nút thêm). */
  omni?: SanhOmni
}
/** Tóm tắt Bi-a cho cửa trên Sảnh: số câu Bi-a còn / trần hôm nay; Bàn giao hữu; lý do khoá. */
export interface BiaTrenSanh { con: number; tong: number; giaoHuu: { mo: boolean; con: number }; lyDoKhoa: string | null }

/** Kết quả đọc `hoa2-sanh`: cờ tắt · em chưa chọn thần thú · có dữ liệu Sảnh. */
export type KetQuaSanh = { cheDo2: false } | { cheDo2: true; canChonThu: true } | { cheDo2: true; canChonThu?: false; sanh: SanhHoa2 }

/** Số "Chuỗi N ngày" trên Sảnh: ưu tiên số máy chủ tính từ sổ học (`sanh.chuoiNgay`); máy chủ cũ / chưa có Sảnh ⇒ `duPhong` (số kế hoạch ngày cũ). */
export function chuoiNgaySanh(kq: KetQuaSanh | null | undefined, duPhong: number): number {
  const n = kq && kq.cheDo2 && 'sanh' in kq ? kq.sanh.chuoiNgay : null
  return typeof n === 'number' ? n : duPhong
}

export interface ChienDichCau {
  id: string
  ten: string
  hanNop: string
  tong: number
}
export type TrangThaiCau = 'dang_on' | 'thanh_thao' | 'can_day_lai'
/** Nơi em làm lần đó (máy chủ gắn): Bi-a Phản Ứng / Đoàn Hộ Tống / Bát Linh Đảo / Ca kiểm tra / Lên bảng / Kiểm tra đầu giờ; nguồn khác hoặc bản máy chủ cũ ⇒ vắng. */
export type NguonLanLam = 'bia' | 'doan' | 'dao' | 'thi' | 'len_bang' | 'dau_gio'
export const NHAN_NGUON_LAN: Record<NguonLanLam, string> = { bia: 'Bi-a', doan: 'Đoàn Hộ Tống', dao: 'Bát Linh Đảo', thi: 'Ca kiểm tra', len_bang: 'Lên bảng', dau_gio: 'Kiểm tra đầu giờ' }
const laNguonLan = (x: unknown): x is NguonLanLam => typeof x === 'string' && Object.prototype.hasOwnProperty.call(NHAN_NGUON_LAN, x)
export interface LanLam {
  ngay: string
  dung: boolean
  coGoiY: boolean
  nguon?: NguonLanLam
}
export interface CauDaLamMuc {
  qid: string
  chienDichId: string
  stt: number
  phan: 'I' | 'II' | 'III'
  mucDo: string | null
  tenDang: string
  trangThai: TrangThaiCau
  lanCuoiDung: boolean | null
  henOn: string | null
  lichSu: LanLam[]
  /** Nhãn nợ máy chủ viết sẵn: "Sai 2 lần · Ca 26/09 · Lên bảng 28/09" (Sổ nợ 29/09; câu đã thành thạo / máy chủ cũ ⇒ vắng). */
  nhan?: string
  /** 30/09: câu TỰ LUẬN em đã trả lời (lịch sử cũ) — hiện nhãn "Câu tự luận — không chấm tự động", không đỏ/xanh, không tính sai. */
  tuLuan?: boolean
}
export type KetQuaCauDaLam = { cheDo2: false } | { cheDo2: true; chienDich: ChienDichCau[]; cau: CauDaLamMuc[] }

/** Một câu chi tiết (đề công khai + đáp án + lời giải thô của kho + đáp án em gửi lần gần nhất). */
export interface DeCongKhai {
  qid: string
  phan: 'I' | 'II' | 'III'
  text: string
  choices: string[]
  ideas: string[]
  table?: string[][]
  thanCauImg?: string
  imageDataUrl?: string
  choiceImgs?: string[]
  ideaImgs?: string[]
  hinhAnh: { src: string; viTri: string; alt?: string }[]
  tenDang: string
  mucDo: string | null
  maDe: string
  sao: number | null
}
export interface ChiTietCau {
  de: DeCongKhai
  dapAn: string
  loiGiai: unknown
  emTraLoi: string | null
  /** 30/09: câu TỰ LUẬN (máy chủ gắn, hoặc máy em tự nhận ra bằng luật chung `laCauTuLuan` khi có đáp án) — không chấm đúng/sai. */
  tuLuan?: boolean
}

const laSo = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const soKhongAm = (x: unknown): number => (laSo(x) && x > 0 ? Math.floor(x) : 0)
const chu = (x: unknown): string => (typeof x === 'string' ? x : x == null ? '' : String(x))
const laNgay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
const laPhan = (x: unknown): x is 'I' | 'II' | 'III' => x === 'I' || x === 'II' || x === 'III'

/** Lỗi máy chủ trả về (`ok:false`) — mang câu tiếng Việt của máy chủ. */
export class LoiHoa2 extends Error {
  ma: string
  constructor(tin: string, ma = '') {
    super(tin)
    this.ma = ma
  }
}

/** Gọi `POST /game-v2/<lenh>` với token của em. Máy chủ báo `ok:false` ⇒ ném `LoiHoa2` kèm câu của máy chủ. */
export async function goiHoa2(lenh: string, token: string, du: Record<string, unknown> = {}, giay = 15): Promise<Record<string, unknown>> {
  const c = new AbortController()
  const hen = setTimeout(() => c.abort(), giay * 1000)
  try {
    const goc = await layDiaChiMayChu('')
    const url = `${goc}/game-v2/${lenh}`
    const than = JSON.stringify({ ...du, token })
    // Lệnh đã HỎI SỚM (lúc mở app / vừa đăng nhập, src/lib/hoi-som.ts) ⇒ nhận phản hồi ấy, không gửi lại; không có / hỏng ⇒ gửi như cũ.
    const r =
      (await layHoiSom(url, than, c.signal)) ??
      (await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: than,
        signal: c.signal,
      }))
    let j: unknown = null
    try {
      j = await r.json()
    } catch {
      j = null
    }
    if (!j || typeof j !== 'object') throw new LoiHoa2('Máy chủ chưa trả lời được. Em thử lại sau ít phút.')
    const o = j as Record<string, unknown>
    // Lời máy chủ: `error` hoặc `loi` (vd. `hoa2-ruong-mo` chưa đủ: ma `chua_du`).
    if (o.ok !== true) throw new LoiHoa2(loiCuaKetQua(o) || 'Máy chủ chưa trả lời được. Em thử lại sau ít phút.', chu(o.ma))
    return o
  } catch (e) {
    if (e instanceof LoiHoa2) throw e
    throw new LoiHoa2('Chưa kết nối được máy chủ. Em kiểm tra mạng rồi thử lại.')
  } finally {
    clearTimeout(hen)
  }
}

function docSapBatDau(v: unknown): { ten: string; batDau: string } | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  return laNgay(o.batDau) ? { ten: chu(o.ten).trim() || 'Chiến dịch của lớp', batDau: o.batDau } : null
}

/** Đọc CHẶT phản hồi `hoa2-sanh`. Trả null nếu thiếu phần bắt buộc (coi như lỗi, KHÔNG đoán). */
export function docSanh(o: Record<string, unknown>): KetQuaSanh | null {
  if (o.cheDo2 !== true) return { cheDo2: false }
  if (o.canChonThu === true) return { cheDo2: true, canChonThu: true }
  const tl = o.theLuc as Record<string, unknown> | undefined
  if (!tl || typeof tl !== 'object' || !laSo(tl.con) || !laSo(tl.tong)) return null
  const cdTho = o.chienDich as Record<string, unknown> | null | undefined
  let chienDich: ChienDichSanh | null = null
  if (cdTho && typeof cdTho === 'object') {
    chienDich = {
      id: chu(cdTho.id),
      ten: chu(cdTho.ten).trim() || 'Chiến dịch của lớp',
      hanNop: laNgay(cdTho.hanNop) ? cdTho.hanNop : '',
      D: soKhongAm(cdTho.D),
      tong: soKhongAm(cdTho.tong),
      coXat: soKhongAm(cdTho.coXat),
      thanhThao: soKhongAm(cdTho.thanhThao),
      canDayLai: soKhongAm(cdTho.canDayLai),
      thanhThaoTangTu: laNgay(cdTho.thanhThaoTangTu) ? cdTho.thanhThaoTangTu : null,
    }
  }
  const r = (o.ruong ?? {}) as Record<string, unknown>
  const q = r.qua && typeof r.qua === 'object' ? (r.qua as Record<string, unknown>) : null
  return {
    cheDo2: true,
    sanh: {
      ngay: laNgay(o.ngay) ? o.ngay : '',
      chienDich,
      sapBatDau: docSapBatDau(o.sapBatDau),
      theLuc: { con: soKhongAm(tl.con), tong: soKhongAm(tl.tong) },
      huyetChien: o.huyetChien === true,
      doan: { con: soKhongAm((o.doan as Record<string, unknown> | undefined)?.con) },
      dao: { con: soKhongAm((o.dao as Record<string, unknown> | undefined)?.con) },
      khoaDao: o.khoaDao === true,
      loiKhoaDao: chu(o.loiKhoaDao).trim(),
      bia: docBiaTrenSanh(o.bia),
      tamGiuCa: soKhongAm((o.tamGiu as Record<string, unknown> | undefined)?.ca),
      thuSucThem: docThuSucThem(o.thuSucThem),
      chuoiNgay: typeof o.chuoiNgay === 'number' && Number.isFinite(o.chuoiNgay) ? Math.max(0, Math.floor(o.chuoiNgay)) : null,
      ...docOmniSanh(o.omni),
      ruong: {
        daLam: soKhongAm(r.daLam),
        tong: soKhongAm(r.tong),
        moDuoc: r.moDuoc === true,
        daMo: r.daMo === true,
        qua: q && laSo(q.vang) ? { vang: soKhongAm(q.vang) } : null,
      },
    },
  }
}

/** OMNI 3: chỉ gắn trường `omni` khi máy chủ gửi `omni.bat === true` (vắng ⇒ đối tượng Sảnh y hệt trước). */
function docOmniSanh(x: unknown): { omni?: SanhOmni } {
  const omni = docSanhOmni(x)
  return omni ? { omni } : {}
}

/** Đọc chặt `thuSucThem` của `hoa2-sanh`: chỉ `duoc === true` với số câu dương mới là được. */
function docThuSucThem(x: unknown): { duoc: boolean; soCau: number } {
  const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : null
  const soCau = soKhongAm(o?.soCau)
  return o?.duoc === true && soCau > 0 ? { duoc: true, soCau } : { duoc: false, soCau: 0 }
}

/** Đọc chặt phần `bia` của `hoa2-sanh`: chỉ khi `bat === true` mới vẽ cửa. */
export function docBiaTrenSanh(x: unknown): BiaTrenSanh | null {
  const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : null
  if (!o || o.bat !== true) return null
  const g = o.giaoHuu && typeof o.giaoHuu === 'object' ? (o.giaoHuu as Record<string, unknown>) : {}
  return { con: soKhongAm(o.con), tong: soKhongAm(o.tong), giaoHuu: { mo: g.mo === true, con: soKhongAm(g.con) }, lyDoKhoa: typeof o.lyDoKhoa === 'string' && o.lyDoKhoa ? o.lyDoKhoa : null }
}

export async function taiSanh(token: string): Promise<KetQuaSanh> {
  const kq = docSanh(await goiHoa2('hoa2-sanh', token))
  if (!kq) throw new LoiHoa2('Máy chủ trả dữ liệu Sảnh chưa đủ. Em thử lại sau ít phút.')
  return kq
}

const TRANG_THAI: ReadonlySet<string> = new Set(['dang_on', 'thanh_thao', 'can_day_lai'])

export function docCauDaLam(o: Record<string, unknown>): KetQuaCauDaLam {
  if (o.cheDo2 === false) return { cheDo2: false }
  const chienDich: ChienDichCau[] = (Array.isArray(o.chienDich) ? o.chienDich : [])
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({ id: chu(c.id), ten: chu(c.ten).trim() || 'Chiến dịch', hanNop: laNgay(c.hanNop) ? c.hanNop : '', tong: soKhongAm(c.tong) }))
    .filter((c) => c.id)
  const cau: CauDaLamMuc[] = (Array.isArray(o.cau) ? o.cau : [])
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object' && typeof c.qid === 'string' && !!c.qid)
    .map((c) => ({
      qid: chu(c.qid),
      chienDichId: chu(c.chienDichId),
      stt: soKhongAm(c.stt),
      phan: laPhan(c.phan) ? c.phan : 'I',
      mucDo: c.mucDo == null ? null : chu(c.mucDo),
      tenDang: chu(c.tenDang).trim(),
      trangThai: TRANG_THAI.has(chu(c.trangThai)) ? (c.trangThai as TrangThaiCau) : 'dang_on',
      lanCuoiDung: typeof c.lanCuoiDung === 'boolean' ? c.lanCuoiDung : null,
      henOn: laNgay(c.henOn) ? c.henOn : null,
      lichSu: (Array.isArray(c.lichSu) ? c.lichSu : [])
        .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object' && laNgay(l.ngay))
        .map((l) => ({ ngay: chu(l.ngay), dung: l.dung === true, coGoiY: l.coGoiY === true, ...(laNguonLan(l.nguon) ? { nguon: l.nguon } : {}) })),
      ...(typeof c.nhan === 'string' && c.nhan.trim() ? { nhan: c.nhan.trim() } : {}),
      ...(c.tuLuan === true ? { tuLuan: true, lanCuoiDung: null } : {}),
    }))
  return { cheDo2: true, chienDich, cau }
}

export async function taiCauDaLam(token: string): Promise<KetQuaCauDaLam> {
  return docCauDaLam(await goiHoa2('hoa2-cau-da-lam', token))
}

const mangChu = (x: unknown): string[] => (Array.isArray(x) ? x.map((v) => chu(v)) : [])

export function docChiTiet(x: unknown): ChiTietCau | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const d = o.de as Record<string, unknown> | undefined
  if (!d || typeof d !== 'object' || typeof d.qid !== 'string' || !laPhan(d.phan)) return null
  const de: DeCongKhai = {
    qid: d.qid,
    phan: d.phan,
    text: chu(d.text),
    choices: mangChu(d.choices),
    ideas: mangChu(d.ideas),
    table: Array.isArray(d.table) ? (d.table as unknown[]).map(mangChu) : undefined,
    thanCauImg: typeof d.thanCauImg === 'string' && d.thanCauImg ? d.thanCauImg : undefined,
    imageDataUrl: typeof d.imageDataUrl === 'string' && d.imageDataUrl ? d.imageDataUrl : undefined,
    choiceImgs: Array.isArray(d.choiceImgs) ? mangChu(d.choiceImgs) : undefined,
    ideaImgs: Array.isArray(d.ideaImgs) ? mangChu(d.ideaImgs) : undefined,
    hinhAnh: (Array.isArray(d.hinhAnh) ? d.hinhAnh : [])
      .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object' && typeof h.src === 'string')
      .map((h) => ({ src: chu(h.src), viTri: chu(h.viTri), ...(typeof h.alt === 'string' ? { alt: h.alt } : {}) })),
    tenDang: chu(d.tenDang).trim(),
    mucDo: d.mucDo == null ? null : chu(d.mucDo),
    maDe: chu(d.maDe),
    sao: laSo(d.sao) ? d.sao : null,
  }
  const dapAn = chu(o.dapAn).trim()
  // Máy chủ cũ chưa gắn `tuLuan` ⇒ máy em tự xét bằng ĐÚNG luật chung (câu đã làm nên có đáp án).
  const tuLuan = o.tuLuan === true || laCauTuLuan({ phan: de.phan, qid: de.qid, text: de.text, dapAn, tuLuan: d.tuLuan === true })
  return { de, dapAn, loiGiai: o.loiGiai, emTraLoi: o.emTraLoi == null ? null : chu(o.emTraLoi).trim() || null, ...(tuLuan ? { tuLuan: true } : {}) }
}

/** Máy chủ nhận tối đa 60 câu một lượt (`hoa2-cau-chi-tiet`). */
export const TOI_DA_MOT_LUOT = 60

/** Lấy chi tiết nhiều câu, chia lượt ≤ 60 câu. `tienDo(da, tong)` báo sau mỗi lượt. */
export async function taiChiTiet(token: string, qids: string[], tienDo?: (da: number, tong: number) => void): Promise<ChiTietCau[]> {
  const ra: ChiTietCau[] = []
  for (let i = 0; i < qids.length; i += TOI_DA_MOT_LUOT) {
    const lo = qids.slice(i, i + TOI_DA_MOT_LUOT)
    const o = await goiHoa2('hoa2-cau-chi-tiet', token, lo.length === 1 ? { qid: lo[0] } : { qids: lo }, 30)
    for (const c of Array.isArray(o.cau) ? o.cau : []) {
      const d = docChiTiet(c)
      if (d) ra.push(d)
    }
    tienDo?.(Math.min(qids.length, i + lo.length), qids.length)
  }
  return ra
}

export interface KetQuaRuong {
  vang: number
  lapLai: boolean
}
export async function moRuong(token: string): Promise<KetQuaRuong> {
  const o = await goiHoa2('hoa2-ruong-mo', token)
  const q = (o.qua ?? {}) as Record<string, unknown>
  return { vang: soKhongAm(q.vang), lapLai: o.lapLai === true }
}

/** Thử sức thêm (không bắt buộc): máy chủ thêm một lô câu mới của ngày mai vào kế hoạch hôm nay. `them` = số câu vừa thêm (0 ⇒ máy khác vừa thêm, tải lại Sảnh). */
export async function thuSucThem(token: string): Promise<{ them: number }> {
  const o = await goiHoa2('hoa2-thu-suc-them', token)
  return { them: soKhongAm(o.them) }
}

// ─── OMNI 3 (05/10) · lệnh `hoa2-omni-*` (docs/hop-dong-omni-3.md mục A). CHỈ gọi khi `hoa2-sanh` có `omni` — cờ tắt thì không nơi nào gọi.
/** Cách gọi một lệnh `game-v2`: Sảnh dùng `goiHoa2` với token cổng học sinh (`goiBangToken`); Đảo dùng `request` của Game.tsx (token phiên game).
 *  Cả hai NÉM lỗi mang câu của máy chủ khi máy chủ trả `ok:false`. */
export type GoiLenhHoa2 = (lenh: string, du?: Record<string, unknown>) => Promise<unknown>
export const goiBangToken =
  (token: string): GoiLenhHoa2 =>
  (lenh, du = {}) =>
    goiHoa2(lenh, token, du)
const vatOmni = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})
/** Câu công khai máy chủ gửi (đề, không đáp án): phải có `qid` và phần I/II/III; câu tự luận bị chặn ở chốt cuối (thầy lệnh 21/09). */
const laCauCongKhai = (c: unknown): c is Record<string, unknown> => {
  const o = vatOmni(c)
  return typeof o.qid === 'string' && !!o.qid && laPhan(o.phan)
}

/** Mệt theo giờ: em chọn "Để mai" (dời câu mới khó sang mai) hay "Làm luôn". Máy chủ trả thể lực + số câu Đảo/Đoàn sau khi xếp lại. */
export async function omniDoiThuTu(goi: GoiLenhHoa2, quyet: 'de_mai' | 'lam_luon'): Promise<{ theLuc: { con: number; tong: number } | null; dao: number | null; doan: number | null }> {
  const o = vatOmni(await goi('hoa2-omni-doi-thu-tu', { quyet }))
  const tl = vatOmni(o.theLuc)
  const con = (x: unknown) => (laSo(vatOmni(x).con) ? soKhongAm(vatOmni(x).con) : null)
  return { theLuc: laSo(tl.con) && laSo(tl.tong) ? { con: soKhongAm(tl.con), tong: soKhongAm(tl.tong) } : null, dao: con(o.dao), doan: con(o.doan) }
}

/** Nhật ký "Hôm nay em tiến thêm gì" — các dòng máy chủ viết sẵn (rỗng ⇒ []). */
export async function omniNhatKy(goi: GoiLenhHoa2): Promise<string[]> {
  const o = vatOmni(await goi('hoa2-omni-nhat-ky'))
  return (Array.isArray(o.dong) ? o.dong : []).filter((d): d is string => typeof d === 'string' && !!d.trim()).map((d) => d.trim())
}

/** Sau Trạm hồi phục: máy chủ đổi ải KẾ TIẾP chưa làm của chuyến bằng câu cùng dạng thấp hơn một bậc. Không có câu thay ⇒ `cau: null`. */
export async function omniTramXong(goi: GoiLenhHoa2, session: string): Promise<{ cau: Record<string, unknown> | null; viTri: number | null }> {
  const o = vatOmni(await goi('hoa2-omni-tram-xong', { session }))
  const cau = laCauCongKhai(o.cau) && choPhepCauChoEm(o.cau, 'game-v2/hoa2-omni-tram-xong') ? o.cau : null
  const viTri = laSo(o.viTri) && o.viTri >= 0 ? Math.floor(o.viTri) : null
  return cau && viTri !== null ? { cau, viTri } : { cau: null, viTri: null }
}

/** CẨN THẬN (c): em chạm một bước ở thẻ "Em biết câu này. Sai vì bước nào?" (hoặc "Em chưa rõ") ⇒ máy chủ ghi sổ riêng `omni_buoc_sai`, KHÔNG chấm. Lỗi ⇒ NÉM câu của máy chủ. */
export async function omniBuocSai(goi: GoiLenhHoa2, qid: string, ma: string): Promise<{ daGhi: boolean }> {
  const o = vatOmni(await goi('hoa2-omni-buoc-sai', { qid, ma }))
  return { daGhi: o.daGhi === true }
}

/** Đề thử nửa (14 câu lạ, 25 phút): câu CÔNG KHAI (không đáp án) + hạn nộp của máy chủ. */
export interface DeThuOmni {
  id: string
  cau: Record<string, unknown>[]
  phut: number
  /** ISO — hết giờ theo đồng hồ máy chủ; máy chủ không gửi ⇒ ''. */
  hetLuc: string
}
export async function omniDeThu(goi: GoiLenhHoa2): Promise<DeThuOmni> {
  const o = vatOmni(await goi('hoa2-omni-de-thu'))
  const cau = chanCauTuLuan((Array.isArray(o.cau) ? o.cau : []).filter(laCauCongKhai), 'game-v2/hoa2-omni-de-thu')
  if (typeof o.id !== 'string' || !o.id || !cau.length) throw new LoiHoa2('Chưa soạn được đề thử. Em thử lại sau ít phút.')
  const hetLuc = typeof o.hetLuc === 'string' && Number.isFinite(Date.parse(o.hetLuc)) ? o.hetLuc : ''
  return { id: o.id, cau, phut: soKhongAm(o.phut), hetLuc }
}

/** Kết quả đề thử (máy chủ chấm cả bài khi nộp): điểm + từng câu kèm đáp án và lời giải — CHỈ có sau khi nộp. */
export interface KetQuaDeThu {
  diem: number | null
  dung: number
  tong: number
  cau: { qid: string; dung: boolean; traLoi: string; dapAn: string; loiGiai: unknown }[]
}
export async function omniDeThuNop(goi: GoiLenhHoa2, id: string, traLoi: Record<string, string>, msLam?: Record<string, number>): Promise<KetQuaDeThu> {
  const o = vatOmni(await goi('hoa2-omni-de-thu-nop', { id, traLoi, ...(msLam ? { msLam } : {}) }))
  const cau = (Array.isArray(o.cau) ? o.cau : [])
    .map(vatOmni)
    .filter((c) => typeof c.qid === 'string' && !!c.qid)
    .map((c) => ({ qid: chu(c.qid), dung: c.dung === true, traLoi: chu(c.traLoi).trim(), dapAn: chu(c.dapAn).trim(), loiGiai: c.loiGiai }))
  return { diem: laSo(o.diem) ? o.diem : null, dung: soKhongAm(o.dung), tong: soKhongAm(o.tong) || cau.length, cau }
}

/** Đổi tên thần thú của CHÍNH em (`rename`; máy chủ soát luật tên + tối đa 3 lần/ngày). Trả tên máy chủ đã lưu. */
export async function doiTenThu(token: string, ten: string): Promise<string> {
  const o = await goiHoa2('rename', token, { name: ten })
  const p = (o.profile ?? {}) as Record<string, unknown>
  return typeof p.nickname === 'string' && p.nickname ? p.nickname : ten
}

// ─── nhớ chế độ 2.0 theo SBD (để lần mở sau vẽ ngay Sảnh, không nháy Bảng nhiệm vụ cũ) ──────────
const khoaNho = (sbd: string) => `omr_hoa2_che_do:${sbd}`
export function docNhoCheDo2(sbd: string | undefined): boolean {
  if (!sbd) return false
  try {
    return localStorage.getItem(khoaNho(sbd)) === '1'
  } catch {
    return false
  }
}
function ghiNhoCheDo2(sbd: string, bat: boolean) {
  try {
    if (bat) localStorage.setItem(khoaNho(sbd), '1')
    else localStorage.removeItem(khoaNho(sbd))
  } catch {
    /* máy chặn lưu: lần sau chờ máy chủ như thường */
  }
}

export interface TrangThaiSanh {
  /** 'cho' = chưa có câu trả lời nào của máy chủ ở phiên này. */
  pha: 'cho' | 'xong'
  /** Chế độ 2.0 đang bật cho em (máy chủ vừa báo, hoặc NHỚ từ lần trước khi đang chờ). */
  cheDo2: boolean
  ketQua: KetQuaSanh | null
  loi: string
  dangTai: boolean
}

/**
 * Báo Sảnh ĐÃ CÓ SỐ (lượt trả lời đầu của máy chủ — thành công hay lỗi — đã vẽ ra màn) trong phiên trang này: cờ `window.__ddhSanhDaVe` +
 * sự kiện cửa sổ `ddh-sanh-da-ve`. main.tsx: máy mở cổng học sinh LẦN ĐẦU đăng ký service worker sau mốc này (05/10) — lượt cài precache không
 * giành đường truyền với đăng nhập + lượt vẽ Sảnh. Dùng sự kiện để main.tsx không phải nhập mảnh cổng.
 */
function baoSanhDaVe(): void {
  if (typeof window === 'undefined') return
  const w = window as Window & { __ddhSanhDaVe?: boolean }
  if (w.__ddhSanhDaVe) return
  w.__ddhSanhDaVe = true
  try {
    window.dispatchEvent(new Event('ddh-sanh-da-ve'))
  } catch {
    /* trình duyệt cũ: service worker vẫn đăng ký sau 30 giây (main.tsx) */
  }
}

/**
 * Phản hồi `hoa2-sanh` đã HỎI SỚM và ĐÃ VỀ trước khi Sảnh dựng (src/lib/hoi-som.ts) ⇒ đọc đồng bộ để lượt vẽ ĐẦU có số ngay, không qua
 * trạng thái "đang tải". Chỉ nhận phản hồi `ok:true` đọc chặt đủ phần (`docSanh`); còn lại ⇒ null, đi đường thường (gửi/nhận như cũ).
 */
function sanhHoiSom(token: string | undefined): { than: string; kq: KetQuaSanh } | null {
  if (!token) return null
  const than = JSON.stringify({ token })
  const x = xemHoiSomDaVe('/game-v2/hoa2-sanh', than)
  if (!x || !x.ok) return null
  try {
    const o = JSON.parse(x.text) as unknown
    if (!o || typeof o !== 'object' || (o as Record<string, unknown>).ok !== true) return null
    const kq = docSanh(o as Record<string, unknown>)
    return kq ? { than, kq } : null
  } catch {
    return null
  }
}

/**
 * Hỏi `hoa2-sanh` khi đăng nhập, mỗi lần `lamMoi` đổi (vừa đóng game / màn con), và khi quay lại tab (dội ≥ 20 giây).
 * Lỗi mạng: GIỮ bản cuối (nếu có) và báo `loi`; cờ nhớ không đổi (không nháy về app cũ vì một lần mất mạng).
 * 05/10: phản hồi đã hỏi sớm và đã về lúc dựng ⇒ lượt hỏi "khi đăng nhập" CHÍNH LÀ lượt ấy (không gửi lại), lượt vẽ đầu đã có số.
 */
export function useSanhHoa2(token: string | undefined, sbd: string | undefined, lamMoi: number): TrangThaiSanh & { taiLai: () => void } {
  const som = useRef<{ than: string; kq: KetQuaSanh } | null | undefined>(undefined)
  if (som.current === undefined) som.current = sbd ? sanhHoiSom(token) : null
  const [t, setT] = useState<TrangThaiSanh>(() =>
    som.current
      ? { pha: 'xong', cheDo2: som.current.kq.cheDo2, ketQua: som.current.kq, loi: '', dangTai: false }
      : { pha: 'cho', cheDo2: docNhoCheDo2(sbd), ketQua: null, loi: '', dangTai: false },
  )
  const [luot, setLuot] = useState(0)
  const lanCuoi = useRef(0)
  const khoaDung = useRef(`${token ?? ''}|${sbd ?? ''}`)
  useEffect(() => {
    // Đổi em (đăng xuất / đăng nhập SBD khác) ⇒ về "chờ". Lượt dựng đầu: trạng thái ban đầu vốn đã đúng (không vẽ lại thừa).
    const khoa = `${token ?? ''}|${sbd ?? ''}`
    if (khoaDung.current === khoa) return
    khoaDung.current = khoa
    setT({ pha: 'cho', cheDo2: docNhoCheDo2(sbd), ketQua: null, loi: '', dangTai: false })
  }, [token, sbd])
  useEffect(() => {
    if (!token || !sbd) return
    lanCuoi.current = Date.now()
    const daCo = som.current
    if (daCo) {
      // Lượt hỏi lúc dựng = lượt đã hỏi sớm: nhận nó (lượt sau gửi thật), ghi nhớ chế độ như khi gửi thường.
      som.current = null
      danhDauDaNhan('/game-v2/hoa2-sanh', daCo.than)
      ghiNhoCheDo2(sbd, daCo.kq.cheDo2)
      return
    }
    let huy = false
    setT((x) => ({ ...x, dangTai: true }))
    taiSanh(token)
      .then((kq) => {
        if (huy) return
        ghiNhoCheDo2(sbd, kq.cheDo2)
        setT({ pha: 'xong', cheDo2: kq.cheDo2, ketQua: kq, loi: '', dangTai: false })
      })
      .catch((e: unknown) => {
        if (huy) return
        setT((x) => ({ ...x, pha: 'xong', loi: e instanceof Error ? e.message : 'Chưa tải được Sảnh.', dangTai: false }))
      })
    return () => {
      huy = true
    }
  }, [token, sbd, lamMoi, luot])
  useEffect(() => {
    if (t.pha === 'xong') baoSanhDaVe()
  }, [t.pha])
  useEffect(() => {
    if (!token) return
    const kich = () => {
      if (typeof document !== 'undefined' && document.hidden) return
      if (Date.now() - lanCuoi.current < 20_000) return
      setLuot((n) => n + 1)
    }
    window.addEventListener('focus', kich)
    document.addEventListener('visibilitychange', kich)
    return () => {
      window.removeEventListener('focus', kich)
      document.removeEventListener('visibilitychange', kich)
    }
  }, [token])
  return { ...t, taiLai: () => setLuot((n) => n + 1) }
}
