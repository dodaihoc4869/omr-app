// TU LUYỆN — lớp gọi máy chủ của màn học sinh (hợp đồng docs/hop-dong-tu-luyen-2909.md). Mọi lệnh `POST /hs/tu-luyen/<lệnh>` kèm token.
// Đọc CHẶT: trường thiếu/sai kiểu thì bỏ, không bịa số. Không bao giờ nhận đáp án trước khi nộp (máy chủ không gửi).
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import type {
  CauCongKhai,
  CheDoTuLuyen,
  DongCauTuLuyen,
  DongLuotTuLuyen,
  DongLuyenDeTongHop,
  DuKhacPhuc,
  KetQuaCau,
  LopDangBaiTL,
} from '../../lib/tu-luyen'

type Obj = Record<string, unknown>
export type KetQua<T> = { ok: true; du: T } | { ok: false; loi: string }

async function goi(lenh: string, token: string, du: Obj = {}, giay = 60): Promise<Obj | null> {
  const dk = new AbortController()
  const t = setTimeout(() => dk.abort(), giay * 1000)
  try {
    const goc = await layDiaChiMayChu()
    if (!goc) return null
    const r = await fetch(`${goc}/hs/tu-luyen/${lenh}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...du, token }),
      signal: dk.signal,
    })
    return (await r.json()) as Obj
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
const LOI_MANG = 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.'
const loiCua = (j: Obj | null): string => (j ? String(j.error ?? 'Máy chủ chưa trả lời được. Em thử lại.') : LOI_MANG)
const so = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)
const chu = (v: unknown) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v))

export interface CaCoCauSai { maCa: string; tenCa: string; soCauSai: number }
export interface NguonTuLuyen {
  cacCa: CaCoCauSai[]
  soCauSai: number
  loiCauSai: string
  danhMuc: LopDangBaiTL[]
  loiDanhMuc: string
  dangThi: boolean
  /** KHO CÂU SAI CHUNG từ 29/09 (chế độ 1, 2, 4): `tong` = câu còn trong kho; `tongTuMoc` / `daKhacPhuc` = bộ đếm khắc phục. Máy chủ cũ không gửi ⇒ null. */
  khoCauSai: KhoCauSaiEm | null
  /** Chế độ 2: nguồn dạng đang dùng ("Theo câu sai của em" / "Theo dạng em còn yếu" / …); `loi` ⇒ thật sự không luyện được (có lý do). */
  dangCauSai: NguonDangEm | null
  /** Chế độ 4: nguồn câu (kho câu sai / toàn kho). */
  tuDo: NguonDangEm | null
  /** Dạng nên luyện khi chưa có câu sai (gợi ý ở chế độ 1). */
  dangNenLuyen: { ma: string; ten: string } | null
}
export interface KhoCauSaiEm { tong: number; tuCa: number; tuChienDich: number; tuLuyenDe: number; tuTuLuyen: number; loi: string; tongTuMoc: number; daKhacPhuc: number; toiHan: number; choHen: number
  /** Chọn nguồn (30/09): số câu theo nguồn + theo mặt nạ nguồn. null = máy chủ bản cũ (không hiện khối chọn nguồn). */
  theoNguon: Record<string, number> | null; theoMat: Record<string, number> }
export interface NguonDangEm { kieu: string; nhan: string; loi: string }
const docNguonDang = (v: unknown): NguonDangEm | null => {
  if (!v || typeof v !== 'object') return null
  const o = v as Obj
  return { kieu: chu(o.kieu), nhan: chu(o.nhan), loi: chu(o.loi) }
}
/** Bảng { khoá: số } từ máy chủ (bỏ giá trị không phải số). Không phải đối tượng ⇒ null. */
const bangSo = (v: unknown): Record<string, number> | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const ra: Record<string, number> = {}
  for (const [k, x] of Object.entries(v as Obj)) if (Number.isFinite(Number(x))) ra[k] = Number(x)
  return ra
}
export async function taiNguon(token: string): Promise<KetQua<NguonTuLuyen>> {
  const j = await goi('nguon', token)
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const cacCa = (Array.isArray(j.cacCa) ? j.cacCa : []).map((x: Obj) => ({ maCa: chu(x.maCa), tenCa: chu(x.tenCa), soCauSai: so(x.soCauSai) })).filter((x) => x.maCa)
  const danhMuc = (Array.isArray(j.danhMuc) ? j.danhMuc : []).map((l: Obj) => ({
    lop: chu(l.lop),
    bais: (Array.isArray(l.bais) ? l.bais : []).map((b: Obj) => ({
      tenBai: chu(b.tenBai),
      dangs: (Array.isArray(b.dangs) ? b.dangs : []).map((d: Obj) => ({ ma: chu(d.ma), ten: chu(d.ten), soCau: so(d.soCau) })),
    })),
  }))
  const k = j.khoCauSai && typeof j.khoCauSai === 'object' ? (j.khoCauSai as Obj) : null
  const khoCauSai = k
    ? {
        tong: so(k.tong), tuCa: so(k.tuCa), tuChienDich: so(k.tuChienDich), tuLuyenDe: so(k.tuLuyenDe), tuTuLuyen: so(k.tuTuLuyen), loi: chu(k.loi),
        // Máy chủ bản cũ không có bộ đếm ⇒ coi mọi câu còn trong kho là tổng, chưa khắc phục câu nào.
        tongTuMoc: k.tongTuMoc === undefined ? so(k.tong) : so(k.tongTuMoc), daKhacPhuc: so(k.daKhacPhuc), toiHan: so(k.toiHan), choHen: so(k.choHen),
        theoNguon: bangSo(k.theoNguon), theoMat: bangSo(k.theoMat) ?? {},
      }
    : null
  const nl = j.dangNenLuyen && typeof j.dangNenLuyen === 'object' ? (j.dangNenLuyen as Obj) : null
  return {
    ok: true,
    du: {
      cacCa, soCauSai: so(j.soCauSai), loiCauSai: chu(j.loiCauSai), danhMuc, loiDanhMuc: chu(j.loiDanhMuc), dangThi: j.dangThi === true, khoCauSai,
      dangCauSai: docNguonDang(j.dangCauSai), tuDo: docNguonDang(j.tuDo), dangNenLuyen: nl && chu(nl.ma) ? { ma: chu(nl.ma), ten: chu(nl.ten) || chu(nl.ma) } : null,
    },
  }
}

export interface ThamSoRut { cheDo: CheDoTuLuyen; soCau?: number; dsMaCa?: string[]; dsDang?: string[]; mucDo?: string[]; nguon?: string[] }
export interface XemTruoc { tongToiDa: number; loi: string; thongKe: { tenDang: string; soCauSai: number; soUngVien: number }[]; nguonDang: NguonDangEm | null }
export async function xemTruoc(token: string, t: ThamSoRut): Promise<KetQua<XemTruoc>> {
  const j = await goi('xem-truoc', token, { ...t })
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const thongKe = (Array.isArray(j.thongKe) ? j.thongKe : []).map((x: Obj) => ({ tenDang: chu(x.tenDang), soCauSai: so(x.soCauSai), soUngVien: so(x.soUngVien) }))
  return { ok: true, du: { tongToiDa: so(j.tongToiDa), loi: chu(j.loi), thongKe, nguonDang: docNguonDang(j.nguonDang) } }
}

export interface LuotDangLam { luotId: string; cheDo: CheDoTuLuyen; tieuDe: string; taoLuc: number; cau: CauCongKhai[] }
export async function rutCau(token: string, t: ThamSoRut): Promise<KetQua<LuotDangLam>> {
  const j = await goi('rut', token, { ...t }, 90)
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const cau = (Array.isArray(j.cau) ? j.cau : []) as CauCongKhai[]
  if (!cau.length) return { ok: false, loi: 'Không rút được câu nào. Em đổi lựa chọn rồi thử lại.' }
  return { ok: true, du: { luotId: chu(j.luotId), cheDo: so(j.cheDo) as CheDoTuLuyen, tieuDe: chu(j.tieuDe), taoLuc: so(j.taoLuc), cau } }
}

export interface KetQuaNop { luotId: string; tieuDe: string; cheDo: CheDoTuLuyen; soCau: number; soDung: number; diem: number; giay: number; nopLuc: number; cau: KetQuaCau[] }
export async function nopBai(
  token: string,
  luotId: string,
  traLoi: Record<string, string>,
  giay: number,
  giayCau: Record<string, number>,
  coGoiY: string[],
): Promise<KetQua<KetQuaNop>> {
  const j = await goi('nop', token, { luotId, traLoi, giay, giayCau, coGoiY })
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  return {
    ok: true,
    du: {
      luotId: chu(j.luotId), tieuDe: chu(j.tieuDe), cheDo: so(j.cheDo) as CheDoTuLuyen, soCau: so(j.soCau), soDung: so(j.soDung),
      diem: so(j.diem), giay: so(j.giay), nopLuc: so(j.nopLuc), cau: (Array.isArray(j.cau) ? j.cau : []) as KetQuaCau[],
    },
  }
}

export interface DuTongHop { luot: DongLuotTuLuyen[]; cau: DongCauTuLuyen[]; luyenDe: DongLuyenDeTongHop[]; khacPhuc: DuKhacPhuc | null }
export async function taiTongHop(token: string): Promise<KetQua<DuTongHop>> {
  const j = await goi('tong-hop', token)
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const phan = (v: unknown) => { const o = (v && typeof v === 'object' ? v : {}) as Obj; return { soCau: so(o.soCau), soDung: so(o.soDung) } }
  const luyenDe = (Array.isArray(j.luyenDe) ? j.luyenDe : []).map((x: Obj) => {
    const tp = (x.theoPhan && typeof x.theoPhan === 'object' ? x.theoPhan : {}) as Obj
    return { id: chu(x.id), luc: so(x.luc), diem: so(x.diem), theoPhan: { I: phan(tp.I), II: phan(tp.II), III: phan(tp.III) } }
  }).filter((x) => x.id)
  const kp = j.khacPhuc && typeof j.khacPhuc === 'object' ? (j.khacPhuc as Obj) : null
  const khacPhuc = kp
    ? { tong: so(kp.tong), daKhacPhuc: so(kp.daKhacPhuc), lichSu: (Array.isArray(kp.lichSu) ? kp.lichSu : []).map((x: Obj) => ({ vao: so(x.vao), khacPhucLuc: x.khacPhucLuc == null ? null : so(x.khacPhucLuc) })) }
    : null
  return { ok: true, du: { luot: (Array.isArray(j.luot) ? j.luot : []) as DongLuotTuLuyen[], cau: (Array.isArray(j.cau) ? j.cau : []) as DongCauTuLuyen[], luyenDe, khacPhuc } }
}

/** CHẤM TỪNG CÂU: máy chủ chấm đúng một câu của lượt đang làm, khoá câu, trả đáp án + lời giải của RIÊNG câu đó. */
export async function chamCau(token: string, luotId: string, qid: string, traLoi: string): Promise<KetQua<KetQuaCau>> {
  const j = await goi('cham-cau', token, { luotId, qid, traLoi }, 30)
  if (!j || j.ok !== true || !j.ketQua || typeof j.ketQua !== 'object') return { ok: false, loi: loiCua(j) }
  return { ok: true, du: j.ketQua as KetQuaCau }
}

/** Xem lại một lượt ĐÃ NỘP: câu công khai đã cất + kết quả đã chốt (máy chủ không chấm lại). */
export async function xemLuot(token: string, luotId: string): Promise<KetQua<{ nop: KetQuaNop; cau: CauCongKhai[] }>> {
  const j = await goi('xem-luot', token, { luotId })
  if (!j || j.ok !== true) return { ok: false, loi: loiCua(j) }
  const nop: KetQuaNop = {
    luotId: chu(j.luotId), tieuDe: chu(j.tieuDe), cheDo: so(j.cheDo) as CheDoTuLuyen, soCau: so(j.soCau), soDung: so(j.soDung),
    diem: so(j.diem), giay: so(j.giay), nopLuc: so(j.nopLuc), cau: (Array.isArray(j.cau) ? j.cau : []) as KetQuaCau[],
  }
  return { ok: true, du: { nop, cau: (Array.isArray(j.cauCongKhai) ? j.cauCongKhai : []) as CauCongKhai[] } }
}
