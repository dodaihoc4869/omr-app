// Kiểm tra riêng từng em: phủ danh mục đã dạy, kiểm chứng chỗ chưa vững, lịch và giờ riêng.
export const NGAY_KT = 86400000
export const ngayKt = (ms: number) => new Date(ms + 7 * 3600000).toISOString().slice(0, 10)
export const congNgayKt = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * NGAY_KT).toISOString().slice(0, 10)
export const dauNgayKt = (d: string) => Date.parse(d + 'T00:00:00+07:00')
export const khoangNgayKt = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / NGAY_KT)
export function bamKt(s: string): number { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
export interface MucKt { id: string; bai: string; tenBai: string; kyNang: string; mucDo: string; loai?:'bai'|'ky_nang'; baiLienQuan?:string[] }
export interface BangChungKt { p: number; vung: boolean; n: number; ngayCuoi: string | null; hen?: string }
export interface UngKt { qid: string; group: string; muc: string[]; phut: number; hopLe: boolean; daGap: boolean; hopSuc?:number }

/** Greedy phủ cứng trước, kiểm chứng thêm sau. Không lấy số lượt làm làm mẫu số kiến thức. */
export function chonDeKt(muc: readonly MucKt[], cau: readonly UngKt[], hs: ReadonlyMap<string, BangChungKt>, seed: string) {
  const can = new Set(muc.map(m => m.id)), con = new Set(can), chon: UngKt[] = [], dung = new Set<string>(), nhom = new Set<string>()
  const nguon = cau.filter(q => q.hopLe && q.muc.some(k => can.has(k)))
  while (con.size) {
    let tot: UngKt | undefined, diem = -1
    for (const q of nguon) {
      if (dung.has(q.qid)) continue
      const gain = q.muc.filter(k => con.has(k)).length
      if (!gain) continue
      const yeu = q.muc.reduce((s, k) => s + (1 - (hs.get(k)?.p ?? 0.3)), 0) / Math.max(1, q.muc.length)
      const v = gain / Math.max(0.5, q.phut) * (1 + 0.15 * yeu + (q.daGap ? 0 : 0.1)) * (q.hopSuc??1)
      if (v > diem || v === diem && bamKt(seed + q.qid) < bamKt(seed + (tot?.qid ?? ''))) { tot = q; diem = v }
    }
    if (!tot) break
    chon.push(tot); dung.add(tot.qid); nhom.add(tot.group)
    for (const k of tot.muc) con.delete(k)
  }
  const soPhu = chon.length
  // Chỗ đã có bằng chứng nhưng còn yếu được kiểm chứng thêm; chưa đo thì đo lần đầu, không tự nhân đôi mọi mục.
  // Phần thêm tối đa 25% bộ phủ; những lỗi khác tiếp tục qua vòng ôn/kiểm chứng sau, không bỏ khỏi danh mục kiến thức.
  const canThem = new Set(muc.filter(m => { const b = hs.get(m.id); return m.loai!=='bai'&&!!b&&b.n>0&&(!b.vung||b.p<0.9) }).map(m => m.id))
  const tranThem=Math.ceil(soPhu*0.25)
  const daKiem = new Set<string>()
  for (const q of [...nguon].sort((a, b) => b.muc.filter(k => canThem.has(k)).length / b.phut - a.muc.filter(k => canThem.has(k)).length / a.phut || bamKt(seed + a.qid) - bamKt(seed + b.qid))) {
    if(chon.length-soPhu>=tranThem)break
    if (dung.has(q.qid) || nhom.has(q.group) || !q.muc.some(k => canThem.has(k) && !daKiem.has(k))) continue
    chon.push(q); dung.add(q.qid); nhom.add(q.group)
    for (const k of q.muc) daKiem.add(k)
  }
  return { qids: chon.map(q => q.qid), soPhu, soThem: chon.length - soPhu, thieu: [...con], tongMuc: can.size,
    phu: can.size - con.size, phut: Math.ceil(chon.reduce((s, q) => s + q.phut, 0) * 1.2 / 5) * 5 }
}

/** Hẹn sau 3–7 ngày, sớm hơn nếu nhiều kiến thức cần kiểm chứng; chọn ngày hợp nhip và tránh cuối hạn bài mới. */
export function henKt(a: { sbd: string; homNay: string; lanTruoc?: string; bangChung: readonly BangChungKt[]; nhip?: ReadonlyMap<number, number>; hanBai?: readonly string[] }) {
  const yeu = a.bangChung.length ? a.bangChung.filter(b => !b.vung || b.p < 0.9 || b.n < 3).length / a.bangChung.length : 1
  const pha=bamKt(a.sbd)%3
  const cho = a.lanTruoc ? 7 : yeu > 0.6 ? 3+pha : yeu > 0.25 ? 4+pha : 7-pha
  const goc = a.lanTruoc ?? a.homNay
  const som = [congNgayKt(a.homNay, 1), congNgayKt(goc, a.lanTruoc?5:3)].sort().at(-1)!
  const muon = [som, congNgayKt(goc, 7)].sort().at(-1)!
  const henDu = a.bangChung.map(b => b.hen).filter((d): d is string => !!d && d <= muon).sort()[0]
  const mucTieu = henDu ? [som,henDu].sort().at(-1)! : congNgayKt(goc, cho)
  let ngay = som, tot = -Infinity
  for (let d = som; d <= muon; d = congNgayKt(d, 1)) {
    const thu = new Date(d + 'T00:00:00Z').getUTCDay()
    const ganHan = (a.hanBai ?? []).some(h => khoangNgayKt(d, h) >= 0 && khoangNgayKt(d, h) <= 1)
    const diem = -Math.abs(khoangNgayKt(d, mucTieu)) + (a.nhip?.get(thu) ?? 0) * 0.6 - (ganHan ? 2 : 0) + (bamKt(a.sbd + d) % 100) / 1000
    if (diem > tot) { tot = diem; ngay = d }
  }
  return { ngay, lyDo: yeu > 0.6 ? 'Kiểm chứng những phần em đang luyện thêm' : yeu > 0.25 ? 'Ôn lại và kiểm chứng các phần đến lịch' : 'Kiểm tra khả năng nhớ sau một khoảng nghỉ' }
}

/** Ngày kiểm tra không giao câu mới thường. Giữ hạn thật; ngày hết hạn vẫn báo nợ nếu còn. */
export function quotaHocKt(u: number, ngay: string, han: string, ngayKiem: ReadonlySet<string>): number {
  if (ngayKiem.has(ngay)) return 0
  let d = 0
  for (let n = ngay; n <= han; n = congNgayKt(n, 1)) if (!ngayKiem.has(n)) d++
  return Math.ceil(Math.max(0, u) / Math.max(1, d))
}

export function phutCauKt(phan: string, ms: readonly number[]): number {
  const nen = phan === 'III' ? 150 : phan === 'II' ? 120 : 60
  const mau = ms.filter(t => Number.isFinite(t) && t >= 5000 && t <= 600000).sort((a, b) => a - b)
  const trungVi = mau.length ? mau[Math.floor(mau.length / 2)]! / 1000 : nen
  const w = mau.length / (mau.length + 10)
  return (nen * (1 - w) + Math.max(nen * 0.5, Math.min(nen * 2, trungVi)) * w) / 60
}
