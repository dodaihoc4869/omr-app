// HỌC LIỆU MÁY SOẠN (05/10) — LÕI THUẦN. Thầy 05/10: "thay vì lặp lại câu sai bạn hãy tìm cách để học sinh vẫn hoàn thành được câu sai đó
// nhưng không học thuộc đáp án được" + "làm tất nhé, tôi ko duyệt gì cả, tôi chỉ chữa câu học sinh cần chữa thôi nhé".
// Đặc tả chung: DE-XUAT-LAM-LAI-CAU-SAI-0510.md (bậc 1 "song sinh" nâng trần 2 → 4 + hàng soạn ưu tiên câu em đã sai).
//
// Ngoài hồ sơ lời giải, máy soạn (scripts/loi-giai/may-soan.mjs, `claude -p` trên máy thầy) soạn THÊM cho mỗi câu theo `can` máy chủ giao:
//   · BẢN KHÁC (tối đa 4 / câu Phần I và III) — lưu vào `cau_bo_tro.song_sinh_json` (cùng chỗ song sinh của kho ⇒ game phủ như song sinh):
//       kieu 'so'        = song sinh ĐỔI SỐ LIỆU (câu tính toán): mỗi bản một bộ số riêng, khác đề gốc; đáp án TÍNH LẠI ĐƯỢC (`phepTinh`, máy tính lại);
//       kieu 'ly_thuyet' = biến thể lí thuyết: đổi chất cùng loại · đảo chiều hỏi · đúng↔sai · đổi phương án nhiễu.
//   · Ý ĐÚNG–SAI MỚI (Phần II): 8–12 ý mới cùng đề dẫn (ngoài 4 ý gốc), mỗi ý Đ/S + lí do 1 dòng — lưu bảng `cau_y_ds` (server/src/cau-y-ds.ts).
// HAI LƯỢT ĐỘC LẬP, không người duyệt: lượt SOẠN ra nội dung + đáp án; lượt KIỂM MÙ (một `claude -p` khác, thư mục tạm riêng, KHÔNG thấy đáp án
// đề xuất / đáp án kho / hồ sơ) tự giải từng mục ⇒ chỉ giữ mục hai lượt KHỚP; mục bị báo mơ hồ / phụ thuộc quy ước ("?") ⇒ bỏ.
// TỰ XỬ CỜ ĐÁP ÁN: hồ sơ còn cờ `dapAn` sau phiên chốt ⇒ lượt kiểm mù giải lại CÂU GỐC: khớp đáp án kho ⇒ cờ sang `daChot` (máy duyệt như cũ);
// vẫn lệch ⇒ cờ mang `tuXu`, máy chủ đưa câu vào diện nghi đáp án (`cau_nghi_dap_an`) — không đẩy việc cho thầy, KHÔNG sửa đáp án kho.
//
// THUẦN: không IO, không đồng hồ, không ngẫu nhiên. Máy soạn (qua scripts/loi-giai/kiem.bundle.mjs) và máy chủ (lúc nhận) dùng CÙNG hàm;
// máy chủ không tin máy soạn — dựng câu gốc từ KHO (`cauGocTuKho`) rồi kiểm lại từng mục + bằng chứng hai lượt (`kiem.d2`).
// Chữ học sinh đọc (đề, phương án, ý, lời giải bản khác) viết như đề KHO (H2SO4, Fe^3+, \ce{…}); không thẻ HTML, không từ nội bộ.
import { loaiCau, saiSoLamTron, tinhBieuThuc, type CauKho, type DangLoiGiai } from '../../src/lib/loi-giai-kiem'
import { docBangSongSinh, songSinhDuDuLieu, type SongSinh } from './cau-bo-tro'

type Obj = Record<string, unknown>
const laObj = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x)
const chuoi = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' && Number.isFinite(x) ? String(x) : '').normalize('NFC')

/** Trần số bản khác DÙNG ĐƯỢC của một câu (đề xuất 2.7 đã chốt: 2 → 4). */
export const SO_BAN_KHAC_TOI_DA = 4
/** Câu Phần II "đã có kho ý" khi có ít nhất chừng này ý mới. */
export const Y_DS_DU = 8
/** Mỗi lượt soạn nhắm tới chừng này ý mới (đề xuất 8–12). */
export const Y_DS_MUC_TIEU = 12
/** Trần số ý mới lưu cho một câu. */
export const Y_DS_TRAN = 24
/** Cách làm bản khác (ghi để thống kê; `doi_so` cho kieu 'so', bốn cách còn lại cho biến thể lí thuyết). */
export const CACH_BAN_KHAC = ['doi_so', 'doi_chat', 'dao_chieu', 'dung_sai', 'doi_nhieu'] as const

export type KieuBanKhac = 'so' | 'ly_thuyet'
export type PhanGoc = 'I' | 'II' | 'III'
export interface PhepTinhBan { ten?: string; bieuThuc: string; ketQua: number; lamTron: number; laDapSo?: boolean }
/** Một bản khác đã qua bộ kiểm (đúng khuôn `SongSinh` của cau-bo-tro.ts + vài trường của máy soạn — game bỏ qua trường lạ). */
export interface BanKhacSoan {
  kieu: KieuBanKhac; cach?: string; de: string; pa?: Record<string, string>; bang?: string[][]; dap_an: string; buoc: string[]; chot: string; phepTinh?: PhepTinhBan[]
}
export interface YMoiSoan { t: string; d: 'D' | 'S'; lyDo: string }
/** Bằng chứng HAI LƯỢT: đáp án lượt kiểm mù tự giải ra (khớp đáp án lượt soạn mới được giữ). */
export interface BangChung2Luot { d2: string; lyDo2?: string }
/** Việc máy chủ giao cho một câu: soạn hồ sơ lời giải? cần mấy bản khác (kiểu nào)? cần mấy ý Đ–S mới? */
export interface CanSoan { hoSo: boolean; banKhac: number; kieuBan: KieuBanKhac | 'tu_chon'; yDs: number }
export const CAN_RONG: CanSoan = { hoSo: true, banKhac: 0, kieuBan: 'tu_chon', yDs: 0 }
/** Câu gốc tối thiểu để kiểm (máy chủ dựng từ KHO; máy soạn dựng từ tệp vao/). `dapAn` là chuỗi kho: "C" · "DSSD" · "3,5". */
export interface CauGoc {
  qid: string; bam: string; dang: DangLoiGiai; phan: PhanGoc; de: string; bang: string[][] | null
  pa: Record<string, string> | null; y: { id: string; t: string }[]; dapAn: string; kieu: string
}
/** Học liệu câu ĐÃ có (để không soạn trùng): mọi bản khác trong `cau_bo_tro` + chữ các ý trong `cau_y_ds`. */
export interface DaCo { banKhac: { de: string; pa?: Record<string, string>; dap_an: string; bang?: string[][] }[]; yDs: string[] }
export const DA_CO_RONG: DaCo = { banKhac: [], yDs: [] }
/** Một trả lời của lượt kiểm mù. `d` = "A"–"D" · "D"/"S" · "DSSD" (câu gốc Phần II) · số "3,36" · "?" (mơ hồ). */
export interface TraLoiMu { id: string; d: string; lyDo?: string; chac?: boolean }
export interface MucBo { i: number; lyDo: string }

// ---------------------------------------------------------------- chữ, số

/** Bỏ thẻ HTML / thực thể (đề trong vao/ là HTML đã thoát). */
export function boHtml(s: string): string {
  return chuoi(s).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}
/** Chữ chuẩn để so trùng: bỏ hoa thường, khoảng trắng, dấu câu. */
export function chuanChu(s: string): string {
  return boHtml(s).toLowerCase().replace(/[\s.,;:!?()[\]{}"'“”‘’«»\-–—_/\\|*+=^~`…]+/gu, '')
}
/**
 * Các con số SỐ LIỆU trong chữ: bỏ chỉ số công thức (H2O, (CH3)2, Fe^3+, SO4^{2-}, \ce{…}: số dính ngay sau chữ cái / ngoặc / ^ / _ / {).
 * "3,36" và "3.36" như nhau.
 */
export function soTrongChu(s: string): number[] {
  const ra: number[] = []
  for (const m of chuoi(s).matchAll(/(?<![\p{L}\d)\]}^_{.,])\d+(?:[.,]\d+)?/gu)) {
    const v = Number(m[0].replace(',', '.'))
    if (Number.isFinite(v)) ra.push(v)
  }
  return ra
}
/** Dấu SỐ LIỆU của một đề (đề + bảng): các con số xếp lại. Hai bản "đổi số" mà cùng dấu ⇒ trùng số liệu. Đề không có số ⇒ ''. */
export function dauSoLieu(de: string, bang?: string[][] | null): string {
  return soTrongChu([de, ...(bang ?? []).flat()].join(' \n ')).map((v) => String(Number(v.toFixed(6)))).sort().join('|')
}
const soDapAn = (s: string): number => Number(chuoi(s).trim().replace(',', '.'))
const soLe = (s: string): number => /[.,](\d+)$/.exec(chuoi(s).trim())?.[1]?.length ?? 0
const khoaBan = (x: { de: string; pa?: Record<string, string> | null }): string =>
  chuanChu(x.de + ' ' + (x.pa ? ['A', 'B', 'C', 'D'].map((k) => x.pa?.[k] ?? '').join(' ') : ''))

/** Từ nội bộ không được lọt vào chữ học sinh đọc ("không mã nội bộ trên màn học sinh"). */
const TU_NOI_BO = /song\s*sinh|biến\s*thể|bản\s*khác|câu\s*gốc|đề\s*gốc|máy\s*soạn|lượt\s*kiểm/iu
function chuChoEm(s: string, noi: string, loi: string[]): void {
  if (/<\/?[a-z][a-z0-9]*\b[^>]*>/i.test(s)) loi.push(`${noi}: không được có thẻ HTML (viết chữ thường như đề kho)`)
  if (TU_NOI_BO.test(s)) loi.push(`${noi}: có từ nội bộ (song sinh / biến thể / bản khác / câu gốc…) — học sinh đọc chữ này`)
}

/** "D"/"Đ"/"Đúng" ⇒ 'D'; "S"/"Sai" ⇒ 'S'; khác ⇒ ''. */
export function chuanDs(v: unknown): 'D' | 'S' | '' {
  const s = chuoi(v).trim().toUpperCase().replace(/[.!]+$/, '')
  if (s === 'D' || s === 'Đ' || s === 'ĐÚNG' || s === 'DUNG') return 'D'
  if (s === 'S' || s === 'SAI') return 'S'
  return ''
}
/** Mẫu Đúng/Sai bốn ý ("DSSD", "Đ S S Đ", "Đ-S-S-Đ") ⇒ "DSSD"; khác ⇒ ''. */
export function chuoiDs4(v: unknown): string {
  const s = chuoi(v).toUpperCase().replace(/Đ/g, 'D').replace(/[\s,;|–—-]+/g, '')
  return /^[DS]{4}$/.test(s) ? s : ''
}

// ---------------------------------------------------------------- câu gốc

/** Câu gốc từ câu KHO đã chuẩn hoá (máy chủ). Tự luận / thiếu đáp án ⇒ null. */
export function cauGocTuKho(c: CauKho, bam: string): CauGoc | null {
  const dang = loaiCau(c)
  if (!dang) return null
  const ids = (o: Record<string, string> | null) => (o ? Object.keys(o).sort() : [])
  return {
    qid: c.qid, bam, dang, phan: c.phan, de: c.de, bang: c.bang,
    pa: dang === 'tn' && c.pa ? Object.fromEntries(ids(c.pa).map((k) => [k, c.pa![k]!])) : null,
    y: dang === 'ds' && c.y ? ids(c.y).map((k) => ({ id: k, t: c.y![k]! })) : [],
    dapAn: c.dapAn, kieu: c.kieu ?? '',
  }
}

/** Câu gốc từ tệp `vao/<tệp>.json` của lô (máy soạn): dùng `deTho` (chữ kho) + `bang` máy chủ gửi kèm; đáp án lấy từ `dapAn` / `mc`. */
export function cauGocTuVao(v: unknown): CauGoc | null {
  if (!laObj(v)) return null
  const dang = chuoi(v.dang) as DangLoiGiai
  if (dang !== 'tn' && dang !== 'ds' && dang !== 'tln') return null
  const y = Array.isArray(v.y) ? (v.y as unknown[]).filter(laObj).map((x) => ({ id: chuoi(x.id), t: chuoi(x.t) })) : []
  const da = laObj(v.dapAn) ? v.dapAn : {}
  const phanTho = chuoi(v.phan)
  const phan: PhanGoc = phanTho === 'I' || phanTho === 'II' || phanTho === 'III' ? phanTho : dang === 'tn' ? 'I' : dang === 'ds' ? 'II' : 'III'
  const dapAn = dang === 'tn'
    ? chuoi(laObj(v.mc) ? v.mc.dapAn : '') || (y.find((x) => chuoi(da[x.id]) === 'D')?.id ?? '')
    : dang === 'ds' ? y.map((x) => chuoi(da[x.id])).join('') : chuoi(da.kq)
  return {
    qid: chuoi(v.qid), bam: chuoi(v.bam), dang, phan, de: chuoi(v.deTho) || boHtml(chuoi(v.de)), bang: docBangSongSinh(v.bang) ?? null,
    pa: dang === 'tn' ? Object.fromEntries(y.map((x) => [x.id, x.t])) : null, y: dang === 'ds' ? y : [], dapAn, kieu: chuoi(v.kieuKho),
  }
}

/** Kiểu bản khác hợp với câu theo nhãn kho (`kieu` của gói đề): bài tập ⇒ đổi số; lí thuyết ⇒ biến thể lí thuyết; không nhãn ⇒ máy soạn tự chọn. */
export function kieuBanCua(kieuKho: unknown): CanSoan['kieuBan'] {
  const k = chuoi(kieuKho).trim()
  return k === 'bai_tap' ? 'so' : k === 'ly_thuyet' ? 'ly_thuyet' : 'tu_chon'
}

/** Việc giao cho một câu từ tình trạng học liệu hiện có. Câu đang nghi đáp án / tắt học liệu thêm ⇒ chỉ hồ sơ. */
export function tinhCan(o: { dang: DangLoiGiai; kieuKho?: unknown; hoSo: boolean; soBanDung: number; soY: number; nghi?: boolean; boTro?: boolean }): CanSoan {
  const kieuBan = kieuBanCua(o.kieuKho)
  if (o.boTro === false || o.nghi) return { hoSo: o.hoSo, banKhac: 0, kieuBan, yDs: 0 }
  return {
    hoSo: o.hoSo, kieuBan,
    banKhac: o.dang === 'ds' ? 0 : Math.max(0, SO_BAN_KHAC_TOI_DA - Math.max(0, o.soBanDung)),
    yDs: o.dang === 'ds' && o.soY < Y_DS_DU ? Math.max(0, Math.min(Y_DS_MUC_TIEU, Y_DS_TRAN - o.soY, Y_DS_MUC_TIEU - Math.max(0, o.soY))) : 0,
  }
}

// ---------------------------------------------------------------- hàng soạn ưu tiên câu em đã sai

export type MucThieu = 'han' | 'mot_phan' | null
/** Câu còn thiếu bản khác? 'han' = chưa có bản khác dùng được nào (Phần II: chưa có ý mới nào); 'mot_phan' = có nhưng chưa đủ 4 (Phần II: < 8 ý). */
export function thieuBanKhac(dang: DangLoiGiai, soBanDung: number, soY: number): MucThieu {
  if (dang === 'ds') return soY <= 0 ? 'han' : soY < Y_DS_DU ? 'mot_phan' : null
  return soBanDung <= 0 ? 'han' : soBanDung < SO_BAN_KHAC_TOI_DA ? 'mot_phan' : null
}
/**
 * Ưu tiên trong hàng soạn của câu EM ĐÃ SAI: luôn trên mọi ưu tiên cũ (khối 12 · sao · đề sắp giao +5000 · Hỏi thầy +3000 ≈ ≤ 10 000);
 * chưa có bản khác nào trước, có một phần sau; trong cùng bậc: nhiều em sai trước.
 */
export function uuTienEmSai(soEm: number, thieu: 'han' | 'mot_phan'): number {
  return (thieu === 'han' ? 200_000 : 100_000) + Math.min(9_999, Math.max(0, Math.floor(soEm))) * 10
}
/** qid trong sổ → qid câu gốc: bỏ hậu tố lượt lặp "#n", song sinh "~ssN", bản Tu luyện "~n". */
export const qidGocMaySoan = (q: string): string => chuoi(q).trim().replace(/#\d+$/, '').replace(/~ss\d+$/, '').replace(/~\d+$/, '')

// ---------------------------------------------------------------- phép tính

function kiemPhepTinhBan(ds: unknown, noi: string, loi: string[]): PhepTinhBan[] {
  if (!Array.isArray(ds)) { loi.push(`${noi}: phepTinh phải là mảng`); return [] }
  const ra: PhepTinhBan[] = []
  ds.forEach((p, j) => {
    if (!laObj(p)) { loi.push(`${noi}: phepTinh[${j}] không phải đối tượng`); return }
    const ten = chuoi(p.ten).trim() || `#${j + 1}`
    const d = p.lamTron === undefined ? 2 : Number(p.lamTron)
    if (!Number.isInteger(d) || d < 0 || d > 8) { loi.push(`${noi}: "${ten}" lamTron lạ`); return }
    if (typeof p.ketQua !== 'number' || !Number.isFinite(p.ketQua)) { loi.push(`${noi}: "${ten}" ketQua không phải số`); return }
    try {
      const v = tinhBieuThuc(chuoi(p.bieuThuc))
      if (Math.abs(v - p.ketQua) > saiSoLamTron(p.ketQua, d)) { loi.push(`KHOÁ SỐ ${noi}: "${ten}" máy tính ra ${v.toFixed(d + 2)} ≠ ghi ${p.ketQua}`); return }
    } catch (e) { loi.push(`${noi}: "${ten}" ${(e as Error).message}`); return }
    ra.push({ ...(chuoi(p.ten).trim() ? { ten } : {}), bieuThuc: chuoi(p.bieuThuc), ketQua: p.ketQua, lamTron: d, ...(p.laDapSo === true ? { laDapSo: true } : {}) })
  })
  return ra
}

// ---------------------------------------------------------------- bản khác (song sinh đổi số / biến thể lí thuyết)

/** Kiểm MỘT bản khác (không so với bản khác). Hợp lệ ⇒ `ban` đã làm sạch (chỉ giữ trường biết). */
export function kiemBanKhacMot(goc: CauGoc, x: unknown, i: number): { loi: string[]; ban?: BanKhacSoan } {
  const noi = `bản khác ${i + 1}`
  if (!laObj(x)) return { loi: [`${noi}: không phải đối tượng JSON`] }
  if (goc.phan !== 'I' && goc.phan !== 'III') return { loi: [`${noi}: chỉ câu Phần I / III có bản khác`] }
  const loi: string[] = []
  const kieu = chuoi(x.kieu).trim()
  if (kieu !== 'so' && kieu !== 'ly_thuyet') loi.push(`${noi}: kieu phải là "so" (đổi số liệu) hoặc "ly_thuyet" (biến thể lí thuyết)`)
  const cach = chuoi(x.cach).trim()
  if (cach && !(CACH_BAN_KHAC as readonly string[]).includes(cach)) loi.push(`${noi}: cach lạ "${cach}" (${CACH_BAN_KHAC.join(' | ')})`)
  const de = chuoi(x.de).trim()
  if (de.length < 15) loi.push(`${noi}: đề rỗng hoặc quá ngắn`)
  else if (de.length > 3000) loi.push(`${noi}: đề dài quá 3000 kí tự`)
  chuChoEm(de, `${noi} · đề`, loi)
  const dapAn = chuoi(x.dap_an).trim()
  let pa: Record<string, string> | undefined
  if (goc.phan === 'I') {
    if (!laObj(x.pa) || Object.keys(x.pa).sort().join('') !== 'ABCD') loi.push(`${noi}: pa cần đúng 4 phương án A, B, C, D`)
    else {
      const paTho = x.pa
      pa = Object.fromEntries(['A', 'B', 'C', 'D'].map((k) => [k, chuoi(paTho[k]).trim()]))
      for (const k of ['A', 'B', 'C', 'D']) {
        const t = pa[k]!
        if (!t) loi.push(`${noi}: phương án ${k} rỗng`)
        else { if (t.length > 800) loi.push(`${noi}: phương án ${k} dài quá 800 kí tự`); chuChoEm(t, `${noi} · phương án ${k}`, loi) }
      }
      if (new Set(Object.values(pa).map(chuanChu)).size < 4) loi.push(`${noi}: có hai phương án trùng nhau`)
    }
    if (!/^[ABCD]$/.test(dapAn)) loi.push(`${noi}: dap_an phải là một chữ A–D`)
  } else {
    if (x.pa !== undefined) loi.push(`${noi}: câu trả lời ngắn (Phần III) không có pa`)
    if (!/^-?\d+(,\d+)?$/.test(dapAn)) loi.push(`${noi}: dap_an phải là số kiểu "54" hoặc "3,36" (dấu phẩy thập phân)`)
  }
  const buoc = Array.isArray(x.buoc) ? x.buoc.map((b) => chuoi(b).trim()) : null
  if (!buoc || buoc.length < 1 || buoc.length > 6 || buoc.some((b) => !b)) loi.push(`${noi}: buoc cần 1–6 bước, không bước rỗng`)
  else buoc.forEach((b, j) => { if (b.length > 600) loi.push(`${noi}: bước ${j + 1} dài quá 600 kí tự`); chuChoEm(b, `${noi} · bước ${j + 1}`, loi) })
  const chot = chuoi(x.chot).trim()
  if (!chot) loi.push(`${noi}: thiếu chot (một câu chốt cách giải)`)
  else { if (chot.length > 400) loi.push(`${noi}: chot dài quá 400 kí tự`); chuChoEm(chot, `${noi} · chot`, loi) }
  let bang: string[][] | undefined
  if (x.bang !== undefined && x.bang !== null) {
    bang = docBangSongSinh(x.bang)
    if (!bang) loi.push(`${noi}: bang phải là bảng chữ nhật ≥ 2 hàng × 2 cột (ô là chữ hoặc số)`)
    else bang.flat().forEach((o) => chuChoEm(o, `${noi} · bảng`, loi))
  }
  let phepTinh: PhepTinhBan[] | undefined
  if (kieu === 'so') {
    if (!Array.isArray(x.phepTinh) || !x.phepTinh.length) loi.push(`KHOÁ SỐ ${noi}: kieu "so" cần phepTinh (máy tính lại đáp án)`)
    else {
      const truoc = loi.length
      phepTinh = kiemPhepTinhBan(x.phepTinh, noi, loi)
      const cuoi = phepTinh.filter((p) => p.laDapSo).pop()
      if (loi.length === truoc) {
        if (!cuoi) loi.push(`KHOÁ SỐ ${noi}: thiếu phép tính cuối "laDapSo": true`)
        else if (goc.phan === 'III' && /^-?\d+(,\d+)?$/.test(dapAn) && Math.abs(soDapAn(dapAn) - cuoi.ketQua) > 1e-9) {
          loi.push(`KHOÁ SỐ ${noi}: phép tính cuối ra ${cuoi.ketQua} ≠ đáp số ${dapAn}`)
        } else if (goc.phan === 'I' && pa && /^[ABCD]$/.test(dapAn)) {
          // Phương án là số ⇒ phương án đúng phải chứa đúng kết quả tính; KHÔNG phương án nhiễu nào trùng kết quả (hai đáp án đúng).
          const sai = 0.5 * 10 ** -cuoi.lamTron + 1e-9
          const coKetQua = (s: string) => soTrongChu(s).some((v) => Math.abs(v - cuoi.ketQua) <= sai)
          if (soTrongChu(pa[dapAn]!).length && !coKetQua(pa[dapAn]!)) loi.push(`KHOÁ SỐ ${noi}: phương án đúng ${dapAn} không chứa kết quả tính ${cuoi.ketQua}`)
          for (const k of ['A', 'B', 'C', 'D']) if (k !== dapAn && coKetQua(pa[k]!)) loi.push(`KHOÁ SỐ ${noi}: phương án nhiễu ${k} trùng kết quả tính ${cuoi.ketQua} (hai đáp án đúng)`)
        }
      }
    }
    if (de && !dauSoLieu(de, bang)) loi.push(`${noi}: kieu "so" mà đề không có số liệu`)
  } else if (x.phepTinh !== undefined) {
    phepTinh = kiemPhepTinhBan(x.phepTinh, noi, loi)
  }
  // Luật "dùng được" của máy chủ / game (cùng hàm game dùng lúc phủ song sinh): đề nhắc bảng thì phải kèm bảng, đủ phương án / đáp số.
  if (!loi.length) {
    const ss: SongSinh = { de, dap_an: dapAn, ...(pa ? { pa } : {}), ...(bang ? { bang } : {}), buoc: buoc!, chot }
    if (!songSinhDuDuLieu(goc.phan, ss)) loi.push(`${noi}: game chưa dùng được (đề nhắc tới bảng mà không kèm bảng, hoặc thiếu phương án / đáp số)`)
  }
  if (loi.length) return { loi }
  return {
    loi,
    ban: { kieu: kieu as KieuBanKhac, ...(cach ? { cach } : {}), de, ...(pa ? { pa } : {}), ...(bang ? { bang } : {}), dap_an: dapAn, buoc: buoc!, chot, ...(phepTinh?.length ? { phepTinh } : {}) },
  }
}

/**
 * Kiểm CẢ BỘ bản khác của một câu. `batBuocSo` (lượt soạn tự kiểm): đúng số bản `can.banKhac`, đáp án đúng Phần I không cùng một chữ.
 * Luôn: mỗi bản hợp lệ; KHÁC đề gốc, khác bản đã có, khác nhau (chữ); bản đổi số ⇒ khác SỐ LIỆU; Phần III ⇒ đáp số khác đáp số gốc và khác nhau.
 * `hopLe` + `chiSo` (vị trí trong đầu vào) = các bản được giữ; `bo` = các bản bỏ kèm lí do.
 */
export function kiemBanKhac(goc: CauGoc, can: CanSoan, ds: unknown, daCo: DaCo = DA_CO_RONG, batBuocSo = true):
  { loi: string[]; canhBao: string[]; hopLe: BanKhacSoan[]; chiSo: number[]; bo: MucBo[] } {
  const loi: string[] = [], canhBao: string[] = [], hopLe: BanKhacSoan[] = [], chiSo: number[] = [], bo: MucBo[] = []
  const can_ = Math.max(0, Math.min(SO_BAN_KHAC_TOI_DA, Math.floor(Number(can.banKhac) || 0)))
  if (ds === undefined || ds === null) {
    if (can_ > 0 && batBuocSo) loi.push(`thiếu songSinh: cần ${can_} bản khác`)
    return { loi, canhBao, hopLe, chiSo, bo }
  }
  if (!Array.isArray(ds)) return { loi: ['songSinh phải là mảng'], canhBao, hopLe, chiSo, bo }
  if (can_ === 0) {
    if (ds.length) canhBao.push('câu này không cần bản khác — bỏ qua')
    return { loi, canhBao, hopLe, chiSo, bo }
  }
  if (batBuocSo && ds.length !== can_) loi.push(`cần đúng ${can_} bản khác (câu đã có ${SO_BAN_KHAC_TOI_DA - can_} bản dùng được), nộp ${ds.length}`)
  const khoa = new Set<string>([khoaBan(goc), ...daCo.banKhac.map(khoaBan)])
  const so = new Set<string>([dauSoLieu(goc.de, goc.bang), ...daCo.banKhac.map((x) => dauSoLieu(x.de, x.bang))].filter(Boolean))
  const dapSo = goc.phan === 'III' ? [goc.dapAn, ...daCo.banKhac.map((x) => x.dap_an)].map(soDapAn).filter(Number.isFinite) : []
  ds.forEach((x, i) => {
    if (i >= can_) { bo.push({ i, lyDo: `thừa (chỉ cần ${can_} bản)` }); return }
    const r = kiemBanKhacMot(goc, x, i)
    if (!r.ban) { loi.push(...r.loi); bo.push({ i, lyDo: r.loi[0] ?? 'không hợp lệ' }); return }
    const ban = r.ban
    const boVi = (m: string) => { loi.push(m); bo.push({ i, lyDo: m }) }
    const k = khoaBan(ban)
    if (khoa.has(k)) return boVi(`bản khác ${i + 1}: trùng chữ với đề gốc / bản đã có / bản trước`)
    if (ban.kieu === 'so') {
      const s = dauSoLieu(ban.de, ban.bang)
      if (so.has(s)) return boVi(`bản khác ${i + 1}: trùng SỐ LIỆU với đề gốc / bản khác — mỗi bản phải một bộ số riêng`)
      so.add(s)
    }
    if (goc.phan === 'III') {
      const v = soDapAn(ban.dap_an)
      if (dapSo.some((w) => Math.abs(w - v) < 1e-9)) return boVi(`bản khác ${i + 1}: đáp số ${ban.dap_an} trùng đáp số gốc / bản khác — học sinh nhớ được số`)
      dapSo.push(v)
    }
    khoa.add(k)
    hopLe.push(ban)
    chiSo.push(i)
  })
  if (batBuocSo && goc.phan === 'I' && hopLe.length >= 2 && new Set(hopLe.map((x) => x.dap_an)).size === 1) {
    loi.push(`đáp án đúng của ${hopLe.length} bản đều là ${hopLe[0]!.dap_an} — xếp đáp án đúng ở các chữ khác nhau (học sinh nhớ được chữ cái)`)
  }
  if (can.kieuBan === 'so' && hopLe.some((x) => x.kieu !== 'so')) canhBao.push('câu tính toán (kho ghi "bai_tap"): nên đổi số liệu (kieu "so")')
  if (can.kieuBan === 'ly_thuyet' && hopLe.some((x) => x.kieu === 'so')) canhBao.push('câu lí thuyết: kieu "so" chỉ khi đề thật sự có số liệu để đổi')
  return { loi, canhBao, hopLe, chiSo, bo }
}

// ---------------------------------------------------------------- ý Đúng–Sai mới (Phần II)

export function kiemYMoiMot(_goc: CauGoc, x: unknown, i: number): { loi: string[]; y?: YMoiSoan } {
  const noi = `ý mới ${i + 1}`
  if (!laObj(x)) return { loi: [`${noi}: không phải đối tượng JSON`] }
  const loi: string[] = []
  const t = chuoi(x.t).trim()
  if (t.length < 10) loi.push(`${noi}: chữ của ý rỗng hoặc quá ngắn`)
  else if (t.length > 600) loi.push(`${noi}: chữ của ý dài quá 600 kí tự`)
  chuChoEm(t, noi, loi)
  const d = chuanDs(x.d)
  if (!d) loi.push(`${noi}: d phải là "D" (đúng) hoặc "S" (sai)`)
  const lyDo = chuoi(x.lyDo ?? x.ly_do).trim()
  if (!lyDo) loi.push(`${noi}: thiếu lyDo (lí do 1 dòng)`)
  else if (/[\r\n]/.test(lyDo)) loi.push(`${noi}: lyDo chỉ được 1 dòng`)
  else if (lyDo.length > 300) loi.push(`${noi}: lyDo dài quá 300 kí tự`)
  else chuChoEm(lyDo, `${noi} · lyDo`, loi)
  return loi.length ? { loi } : { loi, y: { t, d: d as 'D' | 'S', lyDo } }
}

/**
 * Kiểm CẢ BỘ ý mới của một câu Phần II. `batBuocSo`: số ý trong [min(8, cần), cần] và mỗi giá trị Đ/S chiếm ít nhất 1/4 (kho lệch một phía thì em đoán được).
 * Luôn: mỗi ý hợp lệ; khác 4 ý gốc, khác ý đã có, khác nhau.
 */
export function kiemYMoi(goc: CauGoc, can: CanSoan, ds: unknown, daCo: DaCo = DA_CO_RONG, batBuocSo = true):
  { loi: string[]; canhBao: string[]; hopLe: YMoiSoan[]; chiSo: number[]; bo: MucBo[] } {
  const loi: string[] = [], canhBao: string[] = [], hopLe: YMoiSoan[] = [], chiSo: number[] = [], bo: MucBo[] = []
  const can_ = Math.max(0, Math.min(Y_DS_MUC_TIEU, Math.floor(Number(can.yDs) || 0)))
  if (goc.dang !== 'ds') {
    if (Array.isArray(ds) && ds.length) canhBao.push('chỉ câu Đúng/Sai (Phần II) có ý mới — bỏ qua')
    return { loi, canhBao, hopLe, chiSo, bo }
  }
  if (ds === undefined || ds === null) {
    if (can_ > 0 && batBuocSo) loi.push(`thiếu yMoi: cần ${Math.min(Y_DS_DU, can_)}–${can_} ý mới`)
    return { loi, canhBao, hopLe, chiSo, bo }
  }
  if (!Array.isArray(ds)) return { loi: ['yMoi phải là mảng'], canhBao, hopLe, chiSo, bo }
  if (can_ === 0) {
    if (ds.length) canhBao.push('câu này đã đủ ý — bỏ qua')
    return { loi, canhBao, hopLe, chiSo, bo }
  }
  const toiThieu = Math.min(Y_DS_DU, can_)
  if (batBuocSo && (ds.length < toiThieu || ds.length > can_)) loi.push(`cần ${toiThieu}–${can_} ý mới, nộp ${ds.length}`)
  const khoa = new Set<string>([...goc.y.map((x) => chuanChu(x.t)), ...daCo.yDs.map(chuanChu)])
  ds.forEach((x, i) => {
    if (i >= can_) { bo.push({ i, lyDo: `thừa (chỉ cần ${can_} ý)` }); return }
    const r = kiemYMoiMot(goc, x, i)
    if (!r.y) { loi.push(...r.loi); bo.push({ i, lyDo: r.loi[0] ?? 'không hợp lệ' }); return }
    const k = chuanChu(r.y.t)
    if (khoa.has(k)) { const m = `ý mới ${i + 1}: trùng ý gốc / ý đã có / ý trước`; loi.push(m); bo.push({ i, lyDo: m }); return }
    khoa.add(k)
    hopLe.push(r.y)
    chiSo.push(i)
  })
  if (batBuocSo && hopLe.length >= 4) {
    const toi = Math.ceil(hopLe.length / 4)
    const nD = hopLe.filter((x) => x.d === 'D').length, nS = hopLe.length - nD
    if (nD < toi || nS < toi) loi.push(`cần ít nhất ${toi} ý Đúng và ${toi} ý Sai (đang ${nD} Đúng · ${nS} Sai) — kho lệch một phía thì em đoán được`)
  }
  return { loi, canhBao, hopLe, chiSo, bo }
}

/** Kiểm TỆP bổ trợ của một câu (lượt soạn tự kiểm bằng `node kiem.mjs`; máy soạn lọc trước lượt kiểm mù). */
export function kiemBoTro(goc: CauGoc, can: CanSoan, bt: unknown, daCo: DaCo = DA_CO_RONG):
  { loi: string[]; canhBao: string[]; songSinh: BanKhacSoan[]; yMoi: YMoiSoan[]; boSongSinh: MucBo[]; boY: MucBo[] } {
  const rong = { songSinh: [] as BanKhacSoan[], yMoi: [] as YMoiSoan[], boSongSinh: [] as MucBo[], boY: [] as MucBo[] }
  if (!laObj(bt)) return { loi: ['tệp bổ trợ không phải đối tượng JSON'], canhBao: [], ...rong }
  const loi: string[] = []
  if (chuoi(bt.qid) !== goc.qid) loi.push(`KHOÁ MÃ CÂU: tệp bổ trợ ghi ${chuoi(bt.qid)} ≠ ${goc.qid}`)
  if (chuoi(bt.bam) !== goc.bam) loi.push(`KHOÁ VÂN TAY: tệp bổ trợ ghi ${chuoi(bt.bam)} ≠ ${goc.bam}`)
  if (loi.length) return { loi, canhBao: [], ...rong }
  const ss = kiemBanKhac(goc, can, bt.songSinh, daCo)
  const ym = kiemYMoi(goc, can, bt.yMoi, daCo)
  return { loi: [...ss.loi, ...ym.loi], canhBao: [...ss.canhBao, ...ym.canhBao], songSinh: ss.hopLe, yMoi: ym.hopLe, boSongSinh: ss.bo, boY: ym.bo }
}

// ---------------------------------------------------------------- lượt kiểm mù

export interface MucMu { id: string; loai: 'ban_khac' | 'y' | 'goc'; dang: DangLoiGiai; de?: string; pa?: Record<string, string>; bang?: string[][]; y?: { id: string; t: string }[]; t?: string }
/** Đầu vào lượt kiểm mù cho MỘT câu: đề dẫn gốc (cho ý mới / câu gốc) + các mục cần giải. KHÔNG có đáp án, lí do, lời giải nào. */
export interface VaoMu { cau: { de: string; bang?: string[][] }; muc: MucMu[] }

/** Dựng đầu vào lượt kiểm mù: mỗi bản khác (đề + phương án), mỗi ý mới (chữ ý), và câu gốc nếu cần giải lại để tự xử cờ đáp án. Không có gì ⇒ null. */
export function dungVaoMu(goc: CauGoc, hopLe: { songSinh: readonly BanKhacSoan[]; yMoi: readonly YMoiSoan[] }, kiemGoc: boolean): VaoMu | null {
  const muc: MucMu[] = []
  hopLe.songSinh.forEach((s, i) => muc.push({ id: `ss${i + 1}`, loai: 'ban_khac', dang: goc.dang, de: s.de, ...(s.pa ? { pa: s.pa } : {}), ...(s.bang ? { bang: s.bang } : {}) }))
  hopLe.yMoi.forEach((y, i) => muc.push({ id: `y${i + 1}`, loai: 'y', dang: 'ds', t: y.t }))
  if (kiemGoc) muc.push({ id: 'goc', loai: 'goc', dang: goc.dang, ...(goc.dang === 'tn' && goc.pa ? { pa: goc.pa } : {}), ...(goc.dang === 'ds' ? { y: goc.y } : {}) })
  if (!muc.length) return null
  return { cau: { de: goc.de, ...(goc.bang ? { bang: goc.bang } : {}) }, muc }
}

/** Đọc tệp ra/ của lượt kiểm mù (`{ tra: [{ id, d, lyDo, chac }] }`); hỏng ⇒ []. */
export function docTraLoiMu(v: unknown): TraLoiMu[] {
  const ds = laObj(v) && Array.isArray(v.tra) ? v.tra : Array.isArray(v) ? v : []
  return (ds as unknown[]).filter(laObj).map((x) => ({
    id: chuoi(x.id).trim(), d: chuoi(x.d).trim(), lyDo: chuoi(x.lyDo ?? x.ly_do).trim(),
    ...(x.chac === false ? { chac: false } : x.chac === true ? { chac: true } : {}),
  })).filter((x) => x.id)
}

/**
 * Hai lượt KHỚP? Lượt kiểm mù báo "?" hoặc `chac: false` ⇒ KHÔNG khớp (mục mơ hồ ⇒ bỏ).
 * tn: cùng chữ A–D · ds: cùng Đ/S (`la4Y`: cùng mẫu 4 ý "DSSD") · tln: cùng số trong sai số làm tròn của đáp án đề xuất.
 */
export function khopMu(dang: DangLoiGiai, deXuat: string, m: { d: string; chac?: boolean } | null | undefined, la4Y = false): boolean {
  if (!m || m.chac === false) return false
  const a = chuoi(m.d).trim()
  if (!a || a.includes('?')) return false
  if (dang === 'tn') return /^[ABCD]$/i.test(a) && a.toUpperCase() === chuoi(deXuat).trim().toUpperCase()
  if (dang === 'ds') {
    if (la4Y) { const x = chuoiDs4(a); return !!x && x === chuoiDs4(deXuat) }
    const x = chuanDs(a)
    return !!x && x === chuanDs(deXuat)
  }
  if (!/^-?\d+([.,]\d+)?$/.test(a)) return false
  const v = soDapAn(a), w = soDapAn(deXuat)
  return Number.isFinite(w) && Math.abs(v - w) <= 0.5 * 10 ** -soLe(deXuat) + 1e-9
}

const lyDoBoMu = (m: TraLoiMu | undefined, deXuat: string): string =>
  !m ? 'lượt kiểm mù không trả lời mục này'
    : (m.d.includes('?') || m.chac === false) ? `lượt kiểm mù báo mơ hồ / không chắc${m.lyDo ? ': ' + m.lyDo.slice(0, 160) : ''}`
      : `lượt kiểm mù ra ${m.d} ≠ ${deXuat}`

/** Ghép lượt soạn với lượt kiểm mù: chỉ giữ mục hai lượt khớp, kèm bằng chứng `kiem` (máy chủ đòi bằng chứng này lúc nhận). */
export function ghepHaiLuot(goc: CauGoc, hopLe: { songSinh: readonly BanKhacSoan[]; yMoi: readonly YMoiSoan[] }, tra: readonly TraLoiMu[] | null | undefined): {
  songSinh: (BanKhacSoan & { kiem: BangChung2Luot })[]; yMoi: (YMoiSoan & { kiem: BangChung2Luot })[]; boSongSinh: MucBo[]; boY: MucBo[]
} {
  const theo = new Map((tra ?? []).map((t) => [t.id, t]))
  const songSinh: (BanKhacSoan & { kiem: BangChung2Luot })[] = [], yMoi: (YMoiSoan & { kiem: BangChung2Luot })[] = []
  const boSongSinh: MucBo[] = [], boY: MucBo[] = []
  hopLe.songSinh.forEach((s, i) => {
    const m = theo.get(`ss${i + 1}`)
    if (khopMu(goc.dang, s.dap_an, m)) songSinh.push({ ...s, kiem: { d2: m!.d, ...(m!.lyDo ? { lyDo2: m!.lyDo.slice(0, 300) } : {}) } })
    else boSongSinh.push({ i, lyDo: lyDoBoMu(m, s.dap_an) })
  })
  hopLe.yMoi.forEach((y, i) => {
    const m = theo.get(`y${i + 1}`)
    if (khopMu('ds', y.d, m)) yMoi.push({ ...y, kiem: { d2: chuanDs(m!.d), ...(m!.lyDo ? { lyDo2: m!.lyDo.slice(0, 300) } : {}) } })
    else boY.push({ i, lyDo: lyDoBoMu(m, y.d) })
  })
  return { songSinh, yMoi, boSongSinh, boY }
}

// ---------------------------------------------------------------- tự xử cờ đáp án (thầy: "tôi ko duyệt gì cả")

export type KetQuaTuXu = 'khong_can' | 'khop' | 'lech' | 'khong_chac' | 'khong_co'
/** Hồ sơ còn cờ `dapAn` (dù đã có `chot` hay chưa)? */
export const coDapAnConLai = (h: unknown): boolean => laObj(h) && Array.isArray(h.co) && (h.co as unknown[]).some((c) => laObj(c) && c.loai === 'dapAn')
/** Cờ đáp án đã qua máy tự xử mà vẫn lệch (`tuXu`) ⇒ máy chủ đưa câu vào diện nghi đáp án. */
export const coTuXuNghi = (co: unknown): boolean => Array.isArray(co) && co.some((c) => laObj(c) && c.loai === 'dapAn' && laObj(c.tuXu))

/**
 * Lượt kiểm mù đã giải lại câu gốc (không xem đáp án kho, không xem hồ sơ) ⇒ quyết định cuối, không ai duyệt:
 *   khớp đáp án kho ⇒ mọi cờ `dapAn` sang `daChot` ("Giữ đáp án kho") ⇒ hồ sơ sạch ⇒ máy chủ máy duyệt;
 *   lệch / mơ hồ / không trả lời ⇒ cờ giữ nguyên + `tuXu {ketQua, giaiLai, lyDo}` ⇒ máy chủ: hồ sơ ẩn + câu vào `cau_nghi_dap_an`.
 * Không bao giờ đổi `d` / đáp án kho.
 */
export function tuXuCoDapAn(hoSo: Obj, goc: CauGoc, m: TraLoiMu | null | undefined): { hoSo: Obj; ketQua: KetQuaTuXu } {
  const co = Array.isArray(hoSo.co) ? (hoSo.co as unknown[]) : []
  const coDA = co.filter((c): c is Obj => laObj(c) && c.loai === 'dapAn')
  if (!coDA.length) return { hoSo, ketQua: 'khong_can' }
  if (khopMu(goc.dang, goc.dapAn, m, goc.dang === 'ds')) {
    const daChot = [
      ...(Array.isArray(hoSo.daChot) ? (hoSo.daChot as unknown[]) : []),
      ...coDA.map((c) => ({
        ghi: chuoi(c.ghi) || 'nghi đáp án',
        // Không cắt chữ phiên chốt: cắt giữa "{…}" làm lệch ngoặc công thức ⇒ bộ kiểm hồ sơ trượt.
        chot: `Giữ đáp án kho: lượt giải lại độc lập (không xem đáp án) ra đúng đáp án kho${chuoi(c.chot).trim() ? ` — phiên chốt trước đó nghi: ${chuoi(c.chot).trim()}` : ''}.`,
      })),
    ]
    return { hoSo: { ...hoSo, co: co.filter((c) => !(laObj(c) && c.loai === 'dapAn')), daChot }, ketQua: 'khop' }
  }
  const ketQua: KetQuaTuXu = !m ? 'khong_co' : (m.d.includes('?') || !m.d || m.chac === false) ? 'khong_chac' : 'lech'
  const tuXu = { ketQua, giaiLai: m ? m.d.slice(0, 40) : '', ...(m?.lyDo ? { lyDo: m.lyDo.slice(0, 300) } : {}) }
  return { hoSo: { ...hoSo, co: co.map((c) => (laObj(c) && c.loai === 'dapAn' ? { ...c, tuXu } : c)) }, ketQua }
}

// ---------------------------------------------------------------- máy chủ nhận (không tin máy soạn)

/**
 * MÁY CHỦ nhận bản khác: mỗi bản phải mang bằng chứng hai lượt khớp (`kiem.d2` = đáp án lượt kiểm mù), qua lại bộ kiểm với câu gốc từ KHO,
 * không trùng đề gốc / bản đã có / nhau. Không đòi đủ số bản (giữ được bản nào hay bản ấy). `giu[].i` = vị trí trong đầu vào.
 */
export function nhanBanKhacNop(goc: CauGoc, ds: unknown, daCo: DaCo): { giu: { i: number; ban: BanKhacSoan & { kiem: BangChung2Luot } }[]; bo: MucBo[] } {
  if (!Array.isArray(ds) || (goc.phan !== 'I' && goc.phan !== 'III')) return { giu: [], bo: [] }
  const qua: { i: number; x: unknown; kiem: BangChung2Luot }[] = [], bo: MucBo[] = []
  ds.slice(0, SO_BAN_KHAC_TOI_DA * 2).forEach((x, i) => {
    const k = laObj(x) && laObj(x.kiem) ? x.kiem : null
    if (!k || !khopMu(goc.dang, chuoi((x as Obj).dap_an), { d: chuoi(k.d2) })) { bo.push({ i, lyDo: 'chưa qua hai lượt khớp (thiếu kiem.d2 hoặc lệch đáp án)' }); return }
    qua.push({ i, x, kiem: { d2: chuoi(k.d2).slice(0, 40), ...(chuoi(k.lyDo2).trim() ? { lyDo2: chuoi(k.lyDo2).trim().slice(0, 300) } : {}) } })
  })
  const r = kiemBanKhac(goc, { ...CAN_RONG, banKhac: SO_BAN_KHAC_TOI_DA }, qua.map((q) => q.x), daCo, false)
  r.bo.forEach((b) => bo.push({ i: qua[b.i]!.i, lyDo: b.lyDo }))
  return { giu: r.hopLe.map((ban, j) => ({ i: qua[r.chiSo[j]!]!.i, ban: { ...ban, kiem: qua[r.chiSo[j]!]!.kiem } })), bo: bo.sort((a, b) => a.i - b.i) }
}

/** MÁY CHỦ nhận ý mới: như bản khác — bằng chứng hai lượt khớp + bộ kiểm + không trùng 4 ý gốc / ý đã có / nhau. */
export function nhanYMoiNop(goc: CauGoc, ds: unknown, daCo: DaCo): { giu: { i: number; y: YMoiSoan & { kiem: BangChung2Luot } }[]; bo: MucBo[] } {
  if (!Array.isArray(ds) || goc.dang !== 'ds') return { giu: [], bo: [] }
  const qua: { i: number; x: unknown; kiem: BangChung2Luot }[] = [], bo: MucBo[] = []
  ds.slice(0, Y_DS_MUC_TIEU * 2).forEach((x, i) => {
    const k = laObj(x) && laObj(x.kiem) ? x.kiem : null
    if (!k || !khopMu('ds', chuoi((x as Obj).d), { d: chuoi(k.d2) })) { bo.push({ i, lyDo: 'chưa qua hai lượt khớp (thiếu kiem.d2 hoặc lệch Đ/S)' }); return }
    qua.push({ i, x, kiem: { d2: chuanDs(k.d2), ...(chuoi(k.lyDo2).trim() ? { lyDo2: chuoi(k.lyDo2).trim().slice(0, 300) } : {}) } })
  })
  const r = kiemYMoi(goc, { ...CAN_RONG, yDs: Y_DS_MUC_TIEU }, qua.map((q) => q.x), daCo, false)
  r.bo.forEach((b) => bo.push({ i: qua[b.i]!.i, lyDo: b.lyDo }))
  return { giu: r.hopLe.map((y, j) => ({ i: qua[r.chiSo[j]!]!.i, y: { ...y, kiem: qua[r.chiSo[j]!]!.kiem } })), bo: bo.sort((a, b) => a.i - b.i) }
}
