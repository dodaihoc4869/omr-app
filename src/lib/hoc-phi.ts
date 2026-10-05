/** HỌC PHÍ (thầy 05/10) — lõi thuần + lệnh máy chủ `POST /gv/hoc-phi/*` (mã bí mật; server/src/hoc-phi.ts).
 *  Em chưa có dòng nào ở máy chủ ⇒ phải nộp MỨC CHUẨN 4.500.000 đ, đã nộp 0 ⇒ "Chưa nộp" (em mới thêm tự rơi vào đây). */
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

export const MUC_HOC_PHI_CHUAN = 4_500_000

export interface HocPhiEm { sbd: string; phaiNop: number; daNop: number; ghiChu: string; soLan: number }
export interface LanNop { id: string; soTien: number; ngayVn: string; ghiChu: string; nguon: string; luc: string }
export type HocPhiChiTiet = HocPhiEm & { lanNop: LanNop[] }

export type TrangThaiHocPhi = 'chua_nop' | 'con_thieu' | 'du' | 'khong_thu'

export const TEN_TRANG_THAI: Record<TrangThaiHocPhi, string> = {
  chua_nop: 'Chưa nộp',
  con_thieu: 'Còn thiếu',
  du: 'Đã nộp đủ',
  khong_thu: 'Không thu',
}

export function trangThaiHocPhi(phaiNop: number, daNop: number): TrangThaiHocPhi {
  if (phaiNop <= 0) return 'khong_thu'
  if (daNop >= phaiNop) return 'du'
  return daNop > 0 ? 'con_thieu' : 'chua_nop'
}

/** Ghi chú để HIỆN: bỏ thẻ nguồn máy "[excel:…]" (máy chủ dùng để nạp lại không ghi đôi). */
export const ghiChuHien = (g: string) => g.replace(/\s*\[excel:[^\]]*\]\s*$/u, '').trim()

export const conThieu = (x: { phaiNop: number; daNop: number }) => Math.max(0, x.phaiNop - x.daNop)

/** Học phí của một em: có ở máy chủ thì lấy, không thì mức chuẩn, chưa nộp. */
export function hocPhiCuaEm(sbd: string, theoSbd: ReadonlyMap<string, HocPhiEm> | null | undefined): HocPhiEm {
  return theoSbd?.get(sbd) ?? { sbd, phaiNop: MUC_HOC_PHI_CHUAN, daNop: 0, ghiChu: '', soLan: 0 }
}

export interface TongHocPhi {
  soEm: number
  phaiNop: number
  daNop: number
  conThieu: number
  dem: Record<TrangThaiHocPhi, number>
}

/** Tổng của một tập em (danh sách đang xem). Còn thiếu cộng theo TỪNG em (không lấy tổng phải − tổng đã ⇒ không bù trừ giữa các em). */
export function tongHocPhi(sbds: readonly string[], theoSbd: ReadonlyMap<string, HocPhiEm> | null | undefined): TongHocPhi {
  const t: TongHocPhi = { soEm: 0, phaiNop: 0, daNop: 0, conThieu: 0, dem: { chua_nop: 0, con_thieu: 0, du: 0, khong_thu: 0 } }
  for (const s of new Set(sbds)) {
    const h = hocPhiCuaEm(s, theoSbd)
    t.soEm++
    t.phaiNop += h.phaiNop
    t.daNop += h.daNop
    t.conThieu += conThieu(h)
    t.dem[trangThaiHocPhi(h.phaiNop, h.daNop)]++
  }
  return t
}

/** 4500000 → "4.500.000 đ". */
export const dinhDangTien = (n: number) => `${Math.round(n).toLocaleString('vi-VN').replace(/,/g, '.')} đ`

/** Chữ thầy gõ → số đồng. Nhận "500000", "500.000", "500 000"; "500k" = 500.000; "1,5tr" / "1.5 triệu" = 1.500.000. Sai ⇒ null. */
export function docSoTien(vao: string): number | null {
  const s = vao.trim().toLowerCase().replace(/\s+/g, '').replace(/(vnđ|vnd|đồng|đ)$/u, '')
  if (!s) return null
  const donVi = /^(\d+(?:[.,]\d+)?)(k|nghìn|ngàn|tr|triệu|trieu)$/u.exec(s)
  if (donVi) {
    const so = Number(donVi[1].replace(',', '.'))
    const nhan = donVi[2] === 'k' || donVi[2] === 'nghìn' || donVi[2] === 'ngàn' ? 1_000 : 1_000_000
    const n = Math.round(so * nhan)
    return Number.isSafeInteger(n) && n > 0 ? n : null
  }
  if (!/^\d{1,3}([.,]\d{3})*$|^\d+$/.test(s)) return null
  const n = Number(s.replace(/[.,]/g, ''))
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

/** Mã lần nộp do máy thầy sinh: bấm hai lần / mạng chập chờn gửi lại không ghi đôi. */
export function taoMaLanNop(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

const HAN_GIAY = 15

async function goi(duong: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
  if (!ch.URL) throw new Error('Chưa kết nối được máy chủ.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${ch.URL}${duong}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' },
      body: JSON.stringify(body),
      signal: dk.signal,
    })
  } catch (e) {
    throw new Error((e as { name?: string })?.name === 'AbortError' ? 'Máy chủ trả lời chậm — thầy thử lại.' : 'Không nối được máy chủ — thầy kiểm tra mạng rồi thử lại.')
  } finally {
    clearTimeout(hen)
  }
  let j: Record<string, unknown> = {}
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    throw new Error('Máy chủ trả lời không đọc được.')
  }
  return j
}

const docEm = (v: unknown): HocPhiChiTiet | null => {
  if (!v || typeof v !== 'object') return null
  const x = v as Record<string, unknown>
  return {
    sbd: String(x.sbd ?? ''),
    phaiNop: Number(x.phaiNop) || 0,
    daNop: Number(x.daNop) || 0,
    ghiChu: String(x.ghiChu ?? ''),
    soLan: Number(x.soLan) || 0,
    lanNop: Array.isArray(x.lanNop) ? (x.lanNop as LanNop[]) : [],
  }
}

export async function taiHocPhi(): Promise<Map<string, HocPhiEm>> {
  const j = await goi('/gv/hoc-phi/ds', {})
  if (j.ok !== true || !Array.isArray(j.items)) throw new Error(String(j.error || 'Không tải được học phí.'))
  return new Map((j.items as HocPhiEm[]).map((x) => [String(x.sbd), { ...x, sbd: String(x.sbd) }]))
}

export interface KetQuaHocPhi { em: HocPhiChiTiet | null; loi?: string }

async function lenh(duong: string, body: Record<string, unknown>): Promise<KetQuaHocPhi> {
  const j = await goi(duong, body)
  const em = docEm(j.em)
  if (j.ok !== true) return { em, loi: String(j.error || 'Máy chủ không ghi.') }
  return { em }
}

export const chiTietHocPhi = (sbd: string) => lenh('/gv/hoc-phi/em', { sbd })
export const nopHocPhi = (sbd: string, soTien: number, ghiChu: string, id: string) => lenh('/gv/hoc-phi/nop', { sbd, soTien, ghiChu, id })
export const suaMucHocPhi = (sbd: string, phaiNop: number, ghiChu: string) => lenh('/gv/hoc-phi/muc', { sbd, phaiNop, ghiChu })
export const xoaLanNop = (sbd: string, id: string) => lenh('/gv/hoc-phi/xoa-lan', { sbd, id })
