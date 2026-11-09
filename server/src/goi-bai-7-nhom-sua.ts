// NHÓM LỖI NGÀY SỬA — khối B đợt 2 lát 3–4 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-3, «làm hết sạch đẩy luôn lên bản sống», «làm mọi thứ
// xong hết đi»). Ngày Sửa: câu sai chờ sửa gom theo DẠNG (meta `dang`, tên `tenDang`); mỗi nhóm mang loại lỗi NẶNG NHẤT em đã chạm ở «Vì sao em sai?»
// (Hiểu nhầm > Chưa biết cách > Tính / đọc đề sai; chưa chạm ⇒ không gắn); nhóm có câu em đã sai từ 3 lần ⇒ «Học lại» (thắng mọi loại). Thứ tự nhóm = thứ tự
// câu đầu tiên của nhóm trong hàng sửa; câu sửa trong kế hoạch xếp liền theo nhóm (`xepSuaTheoNhom`) ⇒ chặng đầu là nhóm 1. Tiến độ: `xong` = câu lỗi cũ
// (sai trước hôm nay) em đã làm hôm nay. Thuần CPU trên dữ liệu đã đọc (0 lệnh D1).
import type { LyDoSai } from './ly-do-sai'

export type LoaiNhom7 = LyDoSai | 'hoc_lai'
export interface NhomSua7 { ten: string; loai?: LoaiNhom7; so: number; xong: number; viDu?: string }
const NANG: Record<LoaiNhom7, number> = { tinh: 1, cach: 2, nham: 3, hoc_lai: 4 }
/** Số lần sai từ đó nhóm thành «Học lại» (bản vẽ: «Sai 3 lần cùng nhóm»). */
export const SAI_HOC_LAI = 3
/** qid câu song sinh / anh em ("<gốc>~ss0") ⇒ câu gốc. */
export const qidGocSua = (q: string): string => q.replace(/~.*$/, '')

type Meta = ReadonlyMap<string, { dang: string | null; tenDang: string | null }>
type Loi = ReadonlyMap<string, { soLanSai: number; saiCuoi: string; trangThai?: string; ngayDung?: readonly string[] }>
type TtCau = ReadonlyMap<string, { laMoi: boolean; lanCuoiDung: boolean | null; thanhThao?: boolean; catTia?: boolean; lichSu: readonly { dung: boolean }[] }>
const metaCua = (meta: Meta, q: string) => meta.get(q) ?? meta.get(qidGocSua(q))
const khoaNhom = (meta: Meta, q: string): string => { const g = metaCua(meta, q); return g?.dang || g?.tenDang?.trim() || '' }

/** Hàng câu sửa xếp liền theo nhóm dạng (giữ thứ tự ưu tiên: nhóm theo câu đầu tiên của nhóm, trong nhóm giữ thứ tự cũ). */
export function xepSuaTheoNhom(sua: readonly string[], meta: Meta): string[] {
  const m = new Map<string, string[]>()
  for (const q of sua) { const k = khoaNhom(meta, q); const ds = m.get(k); if (ds) ds.push(q); else m.set(k, [q]) }
  return [...m.values()].flat()
}

/** Gom câu sửa của kế hoạch hôm nay (còn lại + câu lỗi cũ đã làm hôm nay) thành nhóm theo dạng; tối đa 8 nhóm (phần dư gộp vào nhóm cuối). */
export function nhomSua7(viec: readonly { qid: string; vai: string }[], hs: { meta: Meta; loiV2?: Loi; tt?: TtCau }, lyDo: ReadonlyMap<string, LyDoSai | 'cc'>, daLam: ReadonlySet<string> = new Set(), ngay = ''): NhomSua7[] {
  const m = new Map<string, NhomSua7>()
  const loiCua = (q: string) => hs.loiV2?.get(q) ?? hs.loiV2?.get(qidGocSua(q))
  const nap = (q: string, xong: boolean) => {
    const k = khoaNhom(hs.meta, q)
    let n = m.get(k)
    if (!n) { n = { ten: metaCua(hs.meta, q)?.tenDang?.trim() || 'Câu sai khác', so: 0, xong: 0 }; m.set(k, n) }
    n.so++
    if (xong) n.xong++
    const g = lyDo.get(q) ?? lyDo.get(qidGocSua(q))
    const l: LoaiNhom7 | undefined = (loiCua(q)?.soLanSai ?? 0) >= SAI_HOC_LAI ? 'hoc_lai' : g === 'cc' ? undefined : g
    if (l && (!n.loai || NANG[l] > NANG[n.loai])) n.loai = l
  }
  const con = viec.flatMap(v => (v.vai === 'sua' ? [v.qid] : []))
  const conSet = new Set(con)
  // câu lỗi cũ (sai TRƯỚC hôm nay) em đã làm hôm nay — tính vào nhóm của nó như phần đã xong (câu mới làm sai hôm nay không phải câu sửa)
  for (const q of daLam) { const l = loiCua(q); if (!conSet.has(q) && l && l.soLanSai > 0 && l.saiCuoi && (!ngay || l.saiCuoi < ngay)) nap(q, true) }
  for (const q of con) nap(q, false)
  // VÍ DỤ MẪU (lát 6, bản vẽ dt-sang-4): nhóm «Chưa biết cách» / «Học lại» ⇒ một câu CÙNG DẠNG em ĐÃ LÀM và lần cuối làm ĐÚNG (không trong kế hoạch hôm
  // nay, không bị cắt tỉa), ưu tiên câu đã thành thạo — app mở lời giải của câu ấy qua lệnh «Câu đã làm» (máy chủ chỉ trả câu em đã làm ⇒ không lộ đáp án).
  const canViDu = [...m].filter(([, n]) => n.loai === 'cach' || n.loai === 'hoc_lai')
  if (canViDu.length && hs.tt) {
    const tot = new Map<string, { q: string; diem: number }>()
    for (const [q, t] of hs.tt) {
      // chỉ câu em làm ĐÚNG và CHƯA TỪNG SAI: câu ấy được phát ở mã gốc ⇒ sổ có dòng đúng mã (lệnh «Câu đã làm» tra đúng mã; câu sửa qua bản song sinh thì không)
      if (t.laMoi || t.lanCuoiDung !== true || t.catTia || conSet.has(q) || daLam.has(q) || (loiCua(q)?.soLanSai ?? 0) > 0 || t.lichSu.some((l) => !l.dung)) continue
      const k = khoaNhom(hs.meta, q), diem = t.thanhThao ? 2 : 1
      if (k && (tot.get(k)?.diem ?? 0) < diem) tot.set(k, { q, diem })
    }
    for (const [k, n] of canViDu) { const v = tot.get(k); if (v) n.viDu = v.q }
  }
  const ds = [...m.values()]
  if (ds.length <= 8) return ds
  const du = ds.slice(7)
  const loai = du.reduce<LoaiNhom7 | undefined>((a, n) => (n.loai && (!a || NANG[n.loai] > NANG[a]) ? n.loai : a), undefined)
  return [...ds.slice(0, 7), { ten: 'Các dạng khác', so: du.reduce((s, n) => s + n.so, 0), xong: du.reduce((s, n) => s + n.xong, 0), ...(loai ? { loai } : {}) }]
}

/** LƯỢT ĐÚNG THEO LOẠI LỖI (khối B lát 5–6, đặc tả mục 2: «Tính / đọc đề sai ⇒ cần đúng 1 lần · Chưa biết cách ⇒ 2 lần · Hiểu nhầm ⇒ 3 lần») + «CHƯA CHẮC»,
 *  áp khi xếp hàng sửa ngày Sửa: THÊM vào cuối (a) câu «Hiểu nhầm» luật đóng lỗi chung đã đóng (đúng 2 ngày) nhưng chưa đủ 3 ngày đúng; (b) câu sửa em làm
 *  đúng nhưng «Chưa chắc»; BỎ (c) câu «Tính / đọc đề sai» đã đúng ≥ 1 ngày sau lần sai cuối (không dấu Chưa chắc) — đủ lượt theo loại.
 *  Không đổi luật đóng lỗi chung (srs2) — chỉ quyết hàng sửa của Lộ trình; câu đã làm hôm nay không thêm. Thuần CPU. */
export function themSua7(sua: readonly string[], hs: { cau: readonly { qid: string }[]; loiV2?: Loi }, lyDo: ReadonlyMap<string, LyDoSai | 'cc'>, ngay: string): string[] {
  const co = new Set(sua), them: string[] = []
  for (const { qid } of hs.cau) {
    if (co.has(qid)) continue
    const l = hs.loiV2?.get(qid)
    if (!l || !l.soLanSai || (l.ngayDung ?? []).includes(ngay)) continue
    const nham = lyDo.get(qid) === 'nham' && (l.trangThai === 'dong' || l.trangThai === 'duy_tri') && (l.ngayDung?.length ?? 0) < 3
    if (nham || lyDo.has(`cc:${qid}`)) { them.push(qid); co.add(qid) }
  }
  const loi = hs.loiV2
  const giu = sua.filter((q) => !(lyDo.get(q) === 'tinh' && !lyDo.has(`cc:${q}`) && (loi?.get(q)?.ngayDung?.length ?? 0) >= 1))
  return [...giu, ...them]
}
