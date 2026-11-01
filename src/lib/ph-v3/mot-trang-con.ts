// «MỘT TRANG VỀ CON» (app phụ huynh, thầy chốt bản vẽ 01/11 — docs/ban-ve-ph-mot-trang-0111, DAC-TA mục 3 bảng từ ngữ). PHÉP THUẦN: mức + lời của 4 số đo,
// câu «Hôm nay», 14 ô ngày, việc sắp tới, dạng cần luyện thêm, «Anh chị nên làm gì». Không đọc mạng, không đọc giờ máy (mọi mốc truyền vào).
import type { MaSoDo, NgaySoDo, TraLoiBonSoDo } from './bon-so-do-kieu'
import type { NgayHoc } from './con-tong-quan'
import type { TomTatKiemTra } from '../kiem-tra-ca-nhan'
import type { BtvnDangChay, DangSo } from '../ph-moi/du-lieu'
import { gioVn, ngayNganVn, tachVn } from '../ph-moi/dinh-dang'

export type MauMuc = 'xl' | 'hp' | 'ho' | 'xam'
export const THU_TU_SO: readonly MaSoDo[] = ['ht', 'dp', 'ch', 'lu']
export const TEN_SO: Readonly<Record<MaSoDo, string>> = { ht: 'Học thật', dp: 'Đối phó', ch: 'Chăm', lu: 'Lười' }
export const NGHIA_SO: Readonly<Record<MaSoDo, string>> = { ht: 'tự nghĩ, tự sửa', dp: 'làm cho xong', ch: 'học đều đặn', lu: 'bỏ ngày, làm ít' }
/** Học thật, Chăm: cao là tốt · Đối phó, Lười: thấp là tốt. */
export const CAO_LA_TOT: Readonly<Record<MaSoDo, boolean>> = { ht: true, dp: false, ch: true, lu: false }
/** Mốc «tốt» vẽ trên cột 14 ngày của tấm. */
export const MOC_TOT: Readonly<Record<MaSoDo, number>> = { ht: 75, dp: 30, ch: 75, lu: 30 }

/** Mức của một số đo (DAC-TA mục 3). null ⇒ chưa đủ dữ liệu. */
export function mucSoDo(ma: MaSoDo, d: number | null): { chu: string; mau: MauMuc; muc: 'tot' | 'vua' | 'xau' | 'chua' } {
  if (d === null) return { chu: 'Chưa đủ dữ liệu', mau: 'xam', muc: 'chua' }
  if (ma === 'ht') return d >= 75 ? { chu: 'Tốt', mau: 'xl', muc: 'tot' } : d >= 50 ? { chu: 'Khá', mau: 'hp', muc: 'vua' } : { chu: 'Cần để ý', mau: 'hp', muc: 'xau' }
  if (ma === 'ch') return d >= 75 ? { chu: 'Rất đều', mau: 'xl', muc: 'tot' } : d >= 50 ? { chu: 'Khá đều', mau: 'hp', muc: 'vua' } : { chu: 'Chưa đều', mau: 'hp', muc: 'xau' }
  if (ma === 'dp') return d < 30 ? { chu: 'Ít, tốt', mau: 'xl', muc: 'tot' } : d < 50 ? { chu: 'Có lúc', mau: 'hp', muc: 'vua' } : { chu: 'Cao', mau: 'ho', muc: 'xau' }
  return d < 30 ? { chu: 'Ít, tốt', mau: 'xl', muc: 'tot' } : d < 60 ? { chu: 'Có lúc', mau: 'hp', muc: 'vua' } : { chu: 'Cao', mau: 'ho', muc: 'xau' }
}

/** Một câu «số đo này nói gì» theo mức. */
export function noiSoDo(ma: MaSoDo, d: number | null): string {
  const m = mucSoDo(ma, d).muc
  if (m === 'chua') return 'Con chưa làm đủ lượt để thầy tính số đo này (cần khoảng 40 lượt làm câu trong 14 ngày).'
  const BANG: Record<MaSoDo, Record<'tot' | 'vua' | 'xau', string>> = {
    ht: { tot: 'Con tự nghĩ, đọc kỹ đề và sửa lại câu từng sai, không chỉ làm cho xong.', vua: 'Con có tự nghĩ, nhưng còn nhiều câu chọn nhanh hoặc chưa sửa câu sai.', xau: 'Con ít tự sửa câu sai, nhiều câu chọn khi chưa đọc kỹ đề.' },
    dp: { tot: 'Con hầu như không đoán mò, không dò đáp án, không làm cho xong.', vua: 'Có lúc con làm cho xong: chọn vội hoặc thử đáp án.', xau: 'Nhiều câu con làm cho xong: chọn vội, dò đáp án, có lúc tra ngoài.' },
    ch: { tot: 'Con học đều mỗi ngày và làm đủ phần thầy giao.', vua: 'Con học khá đều, còn vài ngày làm thiếu.', xau: 'Con học chưa đều: nhiều ngày làm thiếu hoặc bỏ.' },
    lu: { tot: 'Con gần như không bỏ ngày học.', vua: 'Có ngày con bỏ học hoặc làm ít.', xau: 'Con hay bỏ ngày học hoặc làm rất ít.' },
  }
  return BANG[ma][m]
}

/** «Anh chị nên làm gì» cho từng số đo theo mức (tấm chi tiết). */
export function nenTheoSoDo(ma: MaSoDo, d: number | null): string[] {
  const m = mucSoDo(ma, d).muc
  if (m === 'chua') return ['Nhắc con làm bài đều mỗi ngày để thầy đủ số liệu đánh giá.']
  const BANG: Record<MaSoDo, Record<'tot' | 'vua' | 'xau', string[]>> = {
    ht: { tot: ['Khen cụ thể: con tự sửa được câu sai.', 'Hỏi con kể lại một câu đã sửa: lần trước sai ở bước nào?'], vua: ['Hỏi con giảng lại một câu vừa làm.', 'Khen khi con chịu làm lại câu sai.'], xau: ['Hỏi con giảng lại một câu vừa làm. Con giảng được là con hiểu thật.', 'Khen khi con chịu làm lại câu sai, dù chậm.'] },
    dp: { tot: ['Không cần lo phần này. Giữ thói quen đọc hết đề rồi mới chọn.'], vua: ['Nhắc con đọc hết đề rồi mới chọn đáp án.'], xau: ['Ngồi cạnh con 15 phút đầu, nhắc: đọc hết đề rồi mới chọn.', 'Không mắng. Hỏi con: câu nào khó nhất, con nghĩ thế nào?', 'Để điện thoại khác ra xa khi con làm bài.'] },
    ch: { tot: ['Khen con vì học đều.'], vua: ['Thống nhất với con một giờ học cố định mỗi tối.'], xau: ['Thống nhất với con một giờ học cố định, ví dụ 20:00.', 'Nhắc nhẹ đúng giờ đó, đừng đợi tới khuya.'] },
    lu: { tot: ['Không cần nhắc thêm giờ học: con đang tự giác.'], vua: ['Nhắc nhẹ vào giờ học quen của con.'], xau: ['Nhắc nhẹ lúc 20:00, đừng đợi tới khuya.', 'Cùng con xem lịch tuần: tối nào bận thì làm sớm hơn.'] },
  }
  return BANG[ma][m]
}

/** Giá trị mỗi ngày (0–100) để vẽ xu hướng 14 ngày từ `ngay_json`: Học thật = % câu làm kỹ · Đối phó = % câu chọn vội · Chăm = % mức ngày đã làm · Lười = phần còn thiếu.
 *  Ngày không làm câu nào: Học thật / Đối phó ⇒ null (không có gì để đo); Chăm 0, Lười 100. */
export function giaTriNgay(ma: MaSoDo, n: NgaySoDo): number | null {
  const lam = n.ky + n.voi
  if (ma === 'ht') return lam ? Math.round((100 * n.ky) / lam) : null
  if (ma === 'dp') return lam ? Math.round((100 * n.voi) / lam) : null
  const du = n.muc > 0 ? Math.min(100, Math.round((100 * lam) / n.muc)) : lam > 0 ? 100 : 0
  return ma === 'ch' ? du : 100 - du
}
/** Đổi so với tuần trước: trung bình 7 ngày cuối trừ 7 ngày trước (bỏ ngày null). Thiếu một nửa ⇒ null. */
export function doiTuan(ma: MaSoDo, ds: readonly NgaySoDo[]): number | null {
  const v = ds.map((n) => giaTriNgay(ma, n))
  const tb = (a: (number | null)[]) => { const c = a.filter((x): x is number => x !== null); return c.length ? c.reduce((s, x) => s + x, 0) / c.length : null }
  const sau = tb(v.slice(-7)), truoc = tb(v.slice(-14, -7))
  return sau === null || truoc === null ? null : Math.round(sau - truoc)
}
/** Đổi có tốt không (mũi tên xanh / hồng). */
export const doiTot = (ma: MaSoDo, doi: number): boolean => (CAO_LA_TOT[ma] ? doi > 0 : doi < 0)

/** Câu lớn «Hôm nay …» tách đoạn (đoạn `nhan` tô màu nhấn). */
export type DoanCau = { chu: string; nhan?: boolean }
export function cauHomNay(x: { soCau: number; dung: number | null; phut: number | null }): DoanCau[] {
  if (x.soCau <= 0) return [{ chu: 'Hôm nay con ' }, { chu: 'chưa làm câu nào', nhan: true }, { chu: '.' }]
  const ra: DoanCau[] = [{ chu: 'Hôm nay con ' }]
  if (x.phut !== null && x.phut > 0) ra.push({ chu: 'học ' }, { chu: `${Math.round(x.phut)} phút`, nhan: true }, { chu: ', ' })
  ra.push({ chu: 'làm ' }, { chu: `${x.soCau} câu`, nhan: true })
  if (x.dung !== null) ra.push({ chu: ', đúng ' }, { chu: `${x.dung}`, nhan: true })
  ra.push({ chu: '.' })
  return ra
}
/** Câu phụ dưới câu lớn: nói về hôm qua (đã có số) hoặc cách con làm hôm nay. */
export function cauPhuHomNay(x: { soCau: number; giayTb: number | null; homQua: { daLam: number; canLam: number } | null; voiNay?: number }): string {
  if (x.soCau <= 0) return x.homQua ? (x.homQua.daLam > 0 ? `Hôm qua con làm ${x.homQua.daLam}/${x.homQua.canLam} câu.` : 'Hôm qua con cũng chưa làm câu nào.') : ''
  if (x.giayTb !== null && x.giayTb > 0) return `Trung bình ${Math.round(x.giayTb)} giây mỗi câu${x.homQua ? ` · hôm qua ${x.homQua.daLam}/${x.homQua.canLam} câu` : ''}.`
  return x.homQua ? `Hôm qua con làm ${x.homQua.daLam}/${x.homQua.canLam} câu.` : ''
}

/** 14 ô ngày (cũ → hôm nay): đủ mức · chưa đủ · không học · hôm nay chưa làm. */
export type ONgay = { ngay: string; t: 'du' | 'thieu' | 'khong' | 'chua'; nay: boolean }
export function o14(ds: readonly NgayHoc[]): { o: ONgay[]; du: number } {
  const o = ds.slice(-14).map((n): ONgay => ({
    ngay: n.ngay,
    nay: n.homNay,
    t: n.homNay ? (n.canLam > 0 && n.daLam >= n.canLam ? 'du' : n.daLam > 0 ? 'thieu' : 'chua') : n.trangThai,
  }))
  return { o, du: o.filter((x) => x.t === 'du').length }
}

/** Việc sắp tới (tối đa `toiDa`, gần nhất trước): hạn nộp BTVN đang chạy + bài kiểm tra ôn tập sắp mở / đang chờ làm. */
export type ViecSap = { loai: 'btvn' | 'kt'; ms: number; thu: string; ngay: string; ten: string; phu: string }
const THU_NGAN = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const gioHan = (ms: number): string => { const g = gioVn(ms); return g === '00:00' ? '24:00' : g }
export function viecSap(btvn: readonly BtvnDangChay[] | null | undefined, kt: TomTatKiemTra | undefined, nowMs: number, toiDa = 2): ViecSap[] {
  const ra: ViecSap[] = []
  for (const b of btvn ?? []) {
    const ms = Date.parse(b.hanNop)
    if (!Number.isFinite(ms) || ms < nowMs) continue
    const con = b.changTong !== null && b.changXong !== null ? ` · còn ${Math.max(0, b.changTong - b.changXong)} chặng` : ''
    ra.push({ loai: 'btvn', ms, thu: '', ngay: '', ten: 'Hạn nộp BTVN', phu: `${gioHan(ms)}${con}` })
  }
  if (kt && (kt.trangThai === 'sap_den' || kt.trangThai === 'can_lam')) {
    const ms = kt.trangThai === 'sap_den' ? kt.moLuc : kt.hanLuc
    ra.push({ loai: 'kt', ms, thu: '', ngay: '', ten: 'Kiểm tra ôn tập', phu: kt.trangThai === 'sap_den' ? `mở ${gioVn(kt.moLuc)} · ${kt.tong} câu` : `hạn ${gioHan(kt.hanLuc)} · còn ${kt.con} câu` })
  }
  return ra.sort((a, b) => a.ms - b.ms).slice(0, toiDa).map((v) => {
    const t = tachVn(v.loai === 'btvn' && gioHan(v.ms) === '24:00' ? v.ms - 1 : v.ms)
    return { ...v, thu: t ? THU_NGAN[t.thu]! : '', ngay: ngayNganVn(v.loai === 'btvn' && gioHan(v.ms) === '24:00' ? v.ms - 1 : v.ms) }
  })
}

/** Dạng con cần luyện thêm: tỉ lệ đúng thấp nhất trước (có ít nhất 3 câu), tối đa 3. */
export function dangCanLuyen(ds: readonly DangSo[] | null | undefined, toiDa = 3): { ten: string; dung: number; tong: number }[] {
  return [...(ds ?? [])].filter((d) => d.tong >= 3 && d.ten.trim()).sort((a, b) => a.dung / a.tong - b.dung / b.tong || b.tong - a.tong).slice(0, toiDa).map((d) => ({ ten: d.ten.trim(), dung: d.dung, tong: d.tong }))
}

/** «Anh chị nên làm gì» trên trang (tối đa 3 việc): số đo đáng lo trước (Đối phó cao, Lười cao, Học thật thấp), rồi hôm nay chưa làm, rồi lời khen, rồi gợi ý máy chủ. */
export type ViecNen = { dong: string; chu: string }
export function nenLamGi(x: { bon: TraLoiBonSoDo | null; homNayDaLam: number; homNayDu: boolean; chuoi: number | null; goiYMayChu: readonly string[] }): ViecNen[] {
  const ra: ViecNen[] = []
  const d = x.bon && x.bon.co ? x.bon.diem : null
  const m = (ma: MaSoDo) => mucSoDo(ma, d ? d[ma] : null).muc
  if (x.homNayDaLam <= 0) ra.push({ dong: 'Tối nay', chu: 'nhắc con làm bài, ngồi cạnh con 15 phút đầu.' })
  else if (!x.homNayDu) ra.push({ dong: 'Nhắc nhẹ', chu: 'con làm nốt phần hôm nay.' })
  if (d && m('dp') === 'xau') ra.push({ dong: 'Nhắc con', chu: 'đọc hết đề rồi mới chọn. Không mắng, hỏi con câu nào khó.' })
  if (d && m('lu') === 'xau') ra.push({ dong: 'Thống nhất', chu: 'với con một giờ học cố định mỗi tối, ví dụ 20:00.' })
  if (d && m('ht') === 'xau') ra.push({ dong: 'Hỏi con', chu: 'giảng lại một câu vừa làm. Giảng được là con hiểu thật.' })
  if (x.homNayDu || (d && m('ht') === 'tot' && m('ch') === 'tot')) ra.push({ dong: 'Khen con', chu: x.chuoi && x.chuoi > 1 ? `vì giữ chuỗi ${x.chuoi} ngày học đều.` : 'vì hôm nay đã làm đủ phần thầy giao.' })
  for (const g of x.goiYMayChu) if (g.trim()) ra.push({ dong: '', chu: g.trim() })
  if (d && x.homNayDu && m('dp') === 'tot' && m('lu') === 'tot') ra.push({ dong: 'Không cần', chu: 'nhắc thêm giờ học: con đang tự giác.' })
  if (!ra.length) ra.push({ dong: 'Hỏi con', chu: 'hôm nay học phần nào, khó chỗ nào.' })
  const thay: ViecNen[] = []
  for (const v of ra) if (!thay.some((t) => t.dong === v.dong && t.chu === v.chu)) thay.push(v)
  return thay.slice(0, 3)
}
