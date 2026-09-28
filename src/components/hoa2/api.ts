// GAME HÓA 2.0 — lớp gọi máy chủ của app học sinh (hợp đồng: docs/hop-dong-game-hoa-2.md, mục A).
// Mọi lệnh đi qua `POST /game-v2/<lệnh>` kèm `token` của em — đúng cách game đang gọi (Game.tsx `request`).
// Đọc CHẶT: trường thiếu/sai kiểu thì bỏ, KHÔNG bịa số. Cờ `cheDo2` chỉ tính khi đúng `true`.
import { useEffect, useRef, useState } from 'react'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { loiCuaKetQua } from '../../game/than-thu-v2/loi-het-tran'

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
  theLuc: { con: number; tong: number }
  huyetChien: boolean
  doan: { con: number }
  dao: { con: number }
  khoaDao: boolean
  loiKhoaDao: string
  ruong: { daLam: number; tong: number; moDuoc: boolean; daMo: boolean; qua: { vang: number } | null }
  /** Cửa thứ ba Bi-a Phản Ứng (máy chủ trả kèm `hoa2-sanh` khi cờ `bi_a` bật). null ⇒ không vẽ cửa. */
  bia: BiaTrenSanh | null
}
/** Tóm tắt Bi-a cho cửa trên Sảnh: số câu Bi-a còn / trần hôm nay; Bàn giao hữu; lý do khoá. */
export interface BiaTrenSanh { con: number; tong: number; giaoHuu: { mo: boolean; con: number }; lyDoKhoa: string | null }

/** Kết quả đọc `hoa2-sanh`: cờ tắt · em chưa chọn thần thú · có dữ liệu Sảnh. */
export type KetQuaSanh = { cheDo2: false } | { cheDo2: true; canChonThu: true } | { cheDo2: true; canChonThu?: false; sanh: SanhHoa2 }

export interface ChienDichCau {
  id: string
  ten: string
  hanNop: string
  tong: number
}
export type TrangThaiCau = 'dang_on' | 'thanh_thao' | 'can_day_lai'
export interface LanLam {
  ngay: string
  dung: boolean
  coGoiY: boolean
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
    const r = await fetch(`${goc}/game-v2/${lenh}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...du, token }),
      signal: c.signal,
    })
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
      theLuc: { con: soKhongAm(tl.con), tong: soKhongAm(tl.tong) },
      huyetChien: o.huyetChien === true,
      doan: { con: soKhongAm((o.doan as Record<string, unknown> | undefined)?.con) },
      dao: { con: soKhongAm((o.dao as Record<string, unknown> | undefined)?.con) },
      khoaDao: o.khoaDao === true,
      loiKhoaDao: chu(o.loiKhoaDao).trim(),
      bia: docBiaTrenSanh(o.bia),
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
        .map((l) => ({ ngay: chu(l.ngay), dung: l.dung === true, coGoiY: l.coGoiY === true })),
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
  return { de, dapAn: chu(o.dapAn).trim(), loiGiai: o.loiGiai, emTraLoi: o.emTraLoi == null ? null : chu(o.emTraLoi).trim() || null }
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
 * Hỏi `hoa2-sanh` khi đăng nhập, mỗi lần `lamMoi` đổi (vừa đóng game / màn con), và khi quay lại tab (dội ≥ 20 giây).
 * Lỗi mạng: GIỮ bản cuối (nếu có) và báo `loi`; cờ nhớ không đổi (không nháy về app cũ vì một lần mất mạng).
 */
export function useSanhHoa2(token: string | undefined, sbd: string | undefined, lamMoi: number): TrangThaiSanh & { taiLai: () => void } {
  const [t, setT] = useState<TrangThaiSanh>(() => ({ pha: 'cho', cheDo2: docNhoCheDo2(sbd), ketQua: null, loi: '', dangTai: false }))
  const [luot, setLuot] = useState(0)
  const lanCuoi = useRef(0)
  useEffect(() => {
    setT({ pha: 'cho', cheDo2: docNhoCheDo2(sbd), ketQua: null, loi: '', dangTai: false })
  }, [token, sbd])
  useEffect(() => {
    if (!token || !sbd) return
    let huy = false
    lanCuoi.current = Date.now()
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
