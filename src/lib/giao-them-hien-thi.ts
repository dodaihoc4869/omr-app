// "GIAO THÊM BÀI CHO CON" (app phụ huynh, thầy lệnh 21/09; `prompt-ph-giao-them-bai-2109.md` mục A · hợp đồng `docs/hop-dong-ph-giao-them-2109.md` mục 5–6).
// THUẦN: đọc CHẶT thân trả của `POST /ph/giao-them` rồi dựng CHỮ cho thẻ; KHÔNG tính liều/cơ cấu (việc của `giao-them-cho-con.ts` + máy chủ), KHÔNG tự bịa số.
// Giọng phụ huynh: "con", "anh/chị"; chủ ngữ tự động là "A.I Đỗ Đại Học". Không thần thú / EXP / khiên / game.
import { gioDayDu } from './ngay-gio-24'

export type LoaiThanhPhan = 'on_lai' | 'dang_vap' | 'cau_sai' | 'thu_suc'
export interface ThanhPhanGiao {
  loai: LoaiThanhPhan
  tenDang: string
  soCau: number
}
export interface DaGiao {
  soCau: number
  luot: number | null
  luc: string
  phutUocTinh: number | null
  thanhPhan: ThanhPhanGiao[]
  /** Bấm đúp CÙNG PHÚT: máy chủ trả lại gói vừa giao, KHÔNG tạo gói mới, KHÔNG mất thêm lượt. */
  laLuotCu: boolean
}
export type MaTuChoi = 'het_luot' | 'qua_muon' | 'con_viec_bat_buoc' | 'goi_truoc_chua_xong' | 'het_tran_ngay' | 'khong_co_cau'
export interface TuChoi {
  ma: MaTuChoi | string
  lyDo: string[]
}
export interface GoiGanNhat {
  luc: string
  soCau: number
  soDaLam: number | null
  soDung: number | null
}
export interface KetQuaGiaoThem {
  conLaiHomNay: number | null
  goiGanNhat: GoiGanNhat | null
  daGiao: DaGiao | null
  tuChoi: TuChoi | null
}

export const TOI_DA_LUOT_MOI_NGAY = 3
const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const soNguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : null)
const chuoi = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')
const LOAI = new Set<string>(['on_lai', 'dang_vap', 'cau_sai', 'thu_suc'])

/** Đọc CHẶT thân trả `{ok:true,…}`. `ok !== true` / sai dạng ⇒ null (màn coi như "máy chủ chưa có lệnh": giữ đường giao cũ). */
export function docKetQuaGiaoThem(raw: unknown): KetQuaGiaoThem | null {
  if (!laDoiTuong(raw) || raw.ok !== true) return null
  const conLai = soNguyen(raw.conLaiHomNay)
  // Hợp đồng: `conLaiHomNay` LUÔN có khi ok. Thiếu ⇒ không phải thân của lệnh này (vd một đường bắt-mọi-thứ trả {ok:true}) ⇒ null, màn giữ đường giao cũ.
  if (conLai === null) return null
  const g = laDoiTuong(raw.goiGanNhat) ? raw.goiGanNhat : null
  const goiGanNhat: GoiGanNhat | null = g && chuoi(g.luc) && (soNguyen(g.soCau) ?? 0) > 0 ? { luc: chuoi(g.luc), soCau: soNguyen(g.soCau)!, soDaLam: soNguyen(g.soDaLam), soDung: soNguyen(g.soDung) } : null
  const d = laDoiTuong(raw.daGiao) ? raw.daGiao : null
  let daGiao: DaGiao | null = null
  if (d && (soNguyen(d.soCau) ?? 0) > 0) {
    const thanhPhan: ThanhPhanGiao[] = []
    for (const t of Array.isArray(d.thanhPhan) ? d.thanhPhan : []) {
      if (laDoiTuong(t) && LOAI.has(String(t.loai)) && (soNguyen(t.soCau) ?? 0) > 0) thanhPhan.push({ loai: t.loai as LoaiThanhPhan, tenDang: chuoi(t.tenDang), soCau: soNguyen(t.soCau)! })
    }
    daGiao = { soCau: soNguyen(d.soCau)!, luot: soNguyen(d.luot), luc: chuoi(d.luc), phutUocTinh: soNguyen(d.phutUocTinh), thanhPhan, laLuotCu: d.laLuotCu === true }
  }
  const t = laDoiTuong(raw.tuChoi) ? raw.tuChoi : null
  const lyDo = t && Array.isArray(t.lyDo) ? t.lyDo.map(chuoi).filter(Boolean) : []
  const tuChoi: TuChoi | null = t && chuoi(t.ma) ? { ma: chuoi(t.ma), lyDo } : null
  // Vừa có gói vừa có từ chối là sai dạng: KHÔNG tin cả hai (không báo "đã giao" khi máy chủ nói từ chối).
  if (daGiao && tuChoi) return { conLaiHomNay: conLai, goiGanNhat, daGiao: null, tuChoi }
  return { conLaiHomNay: conLai, goiGanNhat, daGiao, tuChoi }
}

/** "3 câu ôn lại đến lịch" · "3 câu dạng Thuỷ phân ester (dạng con đang vấp)" · "2 câu con từng làm sai" · "1 câu thử sức, cao hơn một bậc". */
export function chuThanhPhan(t: ThanhPhanGiao): string {
  switch (t.loai) {
    case 'on_lai':
      return `${t.soCau} câu ôn lại đến lịch`
    case 'dang_vap':
      return t.tenDang ? `${t.soCau} câu dạng ${t.tenDang} (dạng con đang vấp)` : `${t.soCau} câu ở dạng con đang vấp`
    case 'cau_sai':
      return `${t.soCau} câu con từng làm sai`
    case 'thu_suc':
      return `${t.soCau} câu thử sức, cao hơn con một bậc`
  }
}

/** Dòng dưới nút: "Hôm nay còn 2 lượt giao" · "Hôm nay đã giao đủ 3 lượt, mai giao tiếp được". Thiếu số ⇒ rỗng (không đoán). */
export function chuLuot(conLai: number | null): string {
  if (conLai === null) return ''
  return conLai > 0 ? `Hôm nay còn ${conLai} lượt giao` : `Hôm nay đã giao đủ ${TOI_DA_LUOT_MOI_NGAY} lượt, mai giao tiếp được`
}

const gioNgan = (iso: string): string => gioDayDu(iso, '').split(' · ')[0] ?? ''

/** THẺ XÁC NHẬN sau khi giao: tiêu đề + các dòng + dòng lượt còn lại. */
export function theXacNhan(d: DaGiao, conLai: number | null): { tieuDe: string; dong: string[]; cuoi: string } {
  const phut = d.phutUocTinh !== null && d.phutUocTinh > 0 ? `, khoảng ${d.phutUocTinh} phút` : ''
  return {
    tieuDe: d.laLuotCu ? `Bài vừa giao cho con đây: ${d.soCau} câu${phut}` : `Đã giao cho con ${d.soCau} câu${phut}`,
    dong: [`A.I Đỗ Đại Học đã chọn ${d.soCau} câu hợp với con hôm nay.`, ...d.thanhPhan.map(chuThanhPhan)],
    cuoi: d.laLuotCu ? `Anh/chị chưa mất thêm lượt nào. ${chuLuot(conLai)}`.trim() : chuLuot(conLai),
  }
}

/** THẺ TỪ CHỐI: nêu lý do THẬT của máy chủ + "Anh/chị chưa mất lượt nào" (lượt bị từ chối không tính). */
export function theTuChoi(t: TuChoi): { tieuDe: string; dong: string[]; cuoi: string } {
  return { tieuDe: 'Chưa giao thêm bài lúc này', dong: t.lyDo.length ? t.lyDo : ['Lúc này chưa giao thêm được.'], cuoi: 'Anh/chị chưa mất lượt nào.' }
}

/** Dòng gói gần nhất: đã xong "Con đã làm xong gói 19:40 · đúng 5 trong 6 câu"; đang làm "Gói lúc 19:40: con đã làm 2/6 câu". Thiếu số ⇒ chỉ nói gói lúc mấy giờ. */
export function chuGoiGanNhat(g: GoiGanNhat): string {
  const luc = gioNgan(g.luc)
  const moc = luc ? `gói ${luc}` : 'gói vừa giao'
  if (g.soDaLam === null) return `Con có ${g.soCau} câu ở ${moc}`
  if (g.soDaLam >= g.soCau) return g.soDung !== null ? `Con đã làm xong ${moc} · đúng ${g.soDung} trong ${g.soCau} câu` : `Con đã làm xong ${moc} · ${g.soCau} câu`
  return `Con đã làm ${g.soDaLam}/${g.soCau} câu của ${moc}`
}
