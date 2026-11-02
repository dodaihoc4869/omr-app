// LỜI CỦA 4 GIÁM THỊ (thầy 02/11, bản vẽ docs/ban-ve-giam-thi-moi-0211: «dùng các câu của thầy, tôi đã tự ghép theo từng tình huống»). Sửa chữ trực tiếp ở đây.
// Câu của thầy chép NGUYÊN VĂN từ src/lib/loi-mol.ts (test giam-thi-loi-0211 khoá) — không nhập tệp ấy: mảnh dùng chung làm precache vượt trần 170 tệp.
// Tình huống → kho câu (câu thầy trước, xen lời giám thị) + màu bong bóng:
//   voi (chọn vội / làm cho xong) · saiLien (sai liên tiếp) · sai · dung · dungLien (đúng liền / tiến bộ) · cho (lâu không thao tác) · thiRoi (lúc thi, rời màn rồi quay lại).
// Đúng / đúng liền: ~1/3 lượt là CHÂN NGÔN của thầy (bong bóng tím), không hai lượt liền, không quá hai lượt khen ngắn liền nhau.
// Luật chữ: không xúc phạm, không emoji. Câu dài xuống dòng cân bằng — bong bóng nổi trên hàng riêng nên không đẩy đề.
import type { MucGT } from './giam-thi-ve'
import type { CamLoi } from './giam-thi-nguoi'

export type NguCanhLoi = 'voi' | 'sai' | 'saiLien' | 'dung' | 'dungLien' | 'cho' | 'thiRoi'

/** Câu của thầy (nguyên văn loi-mol.ts). */
export const LOI_THAY = {
  doiPho: ['Ơ, lại vội rồi đấy.', 'Bực thật đấy! Lại đối phó.', 'Không biết học đối phó có lợi ích gì?', 'Nhét data vào đầu đi, thầy ăn cơm em không thể no được.'],
  sai: ['Học thật, nỗ lực thật thì kết quả mới thật được.', 'Em không thể trồng cây chuối mà lại ra quả bưởi được.', 'Để học giỏi Hoá cần 2 điều kiện: hiểu tiếng Việt và giỏi toán lớp 4.'],
  chanNgon: ['Tập trung vào quá trình, kết quả là tất yếu.', 'Cái gì nhận ra được thì không phải là ta.', 'Lòng biết ơn là nguyên lý của sự giàu có.', 'Năng lực của tình yêu là chữa lành và nuôi lớn.', 'Luôn phải thật khiêm hạ. Luôn phải thật xứng đáng.'],
  thiRoi: ['Mất công học thì học thật đi!', 'Tại sao phải đối phó với một giáo viên top 3 miền Bắc dạy Hoá?'],
} as const

/** Lời riêng từng giám thị (thầy duyệt 27/10, giữ nguyên). */
export const LOI_GIAM_THI: Record<MucGT, Record<'voi' | 'sai2' | 'sai' | 'dung' | 'combo' | 'cho', readonly string[]>> = {
  nb: { voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Từ từ, đọc đề đã nào.'], sai2: ['Làm nên trò trống gì không đây?', 'Hai câu liền rồi, chậm lại nào.'], sai: ['Học với hành!', 'Ôi, câu dễ thế mà.', 'Đọc lại lí thuyết nhé.'], dung: ['Giỏi!', 'Đúng rồi, cứ thế!', 'Chuẩn!'], combo: ['Giỏi lắm, giữ nhịp nhé!'], cho: ['Còn ngồi nghĩ à?', 'Câu này dễ mà, chọn đi em.'] },
  th: { voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Chưa hiểu đã chọn à?'], sai2: ['Làm nên trò trống gì không đây?', 'Hai câu rồi. Ôn lại lí thuyết đi.'], sai: ['Hừ. Học với hành!', 'Thuộc mà chưa hiểu rồi.', 'Xem lại bản chất đi em.'], dung: ['Được, hiểu đúng bản chất.', 'Tốt.', 'Đúng. Nhớ lí do nhé.'], combo: ['Ừ, khá đấy.'], cho: ['Còn ngồi nghĩ à?', 'Nghĩ lâu quá, bản chất là gì?'] },
  vd: { voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Chưa tính xong đã bấm?'], sai2: ['Làm nên trò trống gì không đây?', 'Hai câu liền. Chú ghi sổ đấy.'], sai: ['Hừ. Học với hành!', 'Sai phép tính rồi.', 'Ẩu quá. Tính lại đi.'], dung: ['Được. Tích một cái.', 'Đúng. Làm thế là chắc.'], combo: ['Khá. Giữ tay cho chắc.'], cho: ['Còn ngồi nghĩ à?', 'Tính đến đâu rồi?'] },
  vdc: { voi: ['Bấm nhanh thế, đã đọc đề chưa?', 'Câu này mà bấm vội à?'], sai2: ['Làm nên trò trống gì không đây?'], sai: ['Hừ. Học với hành!', 'Ta ghi sổ rồi đấy.', 'Thiếu một trường hợp.'], dung: ['Được. Lần này tạm chấp nhận.', 'Hừm. Không tệ.'], combo: ['Khá. Ta bắt đầu để ý em rồi.'], cho: ['Còn ngồi nghĩ à?', 'Hừ. Nghĩ ra chưa?'] },
}

/** Tình huống → (câu thầy, lời giám thị, màu bong bóng). */
export const GAN_LOI: Record<NguCanhLoi, { thay: readonly string[]; gt: (m: MucGT) => readonly string[]; cam: CamLoi }> = {
  voi: { thay: LOI_THAY.doiPho, gt: (m) => LOI_GIAM_THI[m].voi, cam: 'doi' },
  saiLien: { thay: LOI_THAY.doiPho, gt: (m) => LOI_GIAM_THI[m].sai2, cam: 'doi' },
  sai: { thay: LOI_THAY.sai, gt: (m) => LOI_GIAM_THI[m].sai, cam: 'sai' },
  dung: { thay: [], gt: (m) => LOI_GIAM_THI[m].dung, cam: 'khen' },
  dungLien: { thay: [], gt: (m) => [...LOI_GIAM_THI[m].combo, ...LOI_GIAM_THI[m].dung], cam: 'khen' },
  thiRoi: { thay: LOI_THAY.thiRoi, gt: () => [], cam: 'gian' },
  cho: { thay: [], gt: (m) => LOI_GIAM_THI[m].cho, cam: 'nghi' },
}

type Rng = () => number
const tron = (a: string[], rng: Rng) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!] } return a }
/** Túi xoay vòng: hết túi mới trộn lại, xen kẽ câu thầy (nhiều hơn) với lời giám thị, lượt đầu mở bằng câu thầy, không lặp liền qua hai túi. */
class XoayVong {
  bo: string[] = []
  truoc: string | null = null
  dau = true
  readonly thay: readonly string[]
  readonly gt: readonly string[]
  constructor(thay: readonly string[], gt: readonly string[]) { this.thay = thay; this.gt = gt }
  lay(rng: Rng): string | null {
    if (!this.bo.length) {
      const a = tron([...this.thay], rng), b = tron([...this.gt], rng), bo: string[] = []
      while (a.length || b.length) { if (a.length) bo.push(a.pop()!); if (a.length && rng() < 0.5) bo.push(a.pop()!); if (b.length) bo.push(b.pop()!) }
      if (!this.dau && bo.length > 1 && bo[0] === this.truoc) bo.push(bo.shift()!)
      this.bo = bo; this.dau = false
    }
    return (this.truoc = this.bo.shift() ?? null)
  }
}

/** Nhịp nói dùng chung cả phiên làm bài (màn câu dựng lại mỗi câu nên giữ ở đây): tối đa 1 lần mỗi câu, nghỉ 1–2 câu sau mỗi lần nói, cách nhau ≥ 5 giây;
 *  không chen ngay sau khi em chạm phương án (1,5 giây) với lời «lâu không làm». Sai liên tiếp và rời màn lúc thi luôn nói. `phien` đổi ⇒ đếm lại từ đầu. */
export type NhipLoi = { phien: string; cau: string; nghi: number; daNoi: boolean; lanCham: number; lanNoi: number; saiLien: number; demKhen: number; chanTruoc: boolean; kho: Map<string, XoayVong> }
export const taoNhip = (phien = ''): NhipLoi => ({ phien, cau: '', nghi: 0, daNoi: false, lanCham: -1e9, lanNoi: -1e9, saiLien: 0, demKhen: 0, chanTruoc: false, kho: new Map() })
export const LUON_NOI: ReadonlySet<NguCanhLoi> = new Set(['saiLien', 'thiRoi'])
const CACH_NOI_MS = 5000

const khoCua = (n: NhipLoi, muc: MucGT, k: NguCanhLoi): XoayVong => {
  const key = muc + ':' + k
  let x = n.kho.get(key)
  if (!x) { x = new XoayVong(GAN_LOI[k].thay, GAN_LOI[k].gt(muc)); n.kho.set(key, x) }
  return x
}
/** Chọn câu cho tình huống (không xét nhịp). */
export function chonCau(n: NhipLoi, muc: MucGT, k: NguCanhLoi, rng: Rng = Math.random): { chu: string; cam: CamLoi } | null {
  if (k === 'dung' || k === 'dungLien') {
    const p = k === 'dungLien' ? 0.5 : 0.33
    const chan = !n.chanTruoc && (n.demKhen >= 2 || rng() < p)
    n.chanTruoc = chan
    if (chan) {
      n.demKhen = 0
      let x = n.kho.get('chan')
      if (!x) { x = new XoayVong(LOI_THAY.chanNgon, []); n.kho.set('chan', x) }
      const chu = x.lay(rng)
      return chu ? { chu, cam: 'chan' } : null
    }
    n.demKhen++
  }
  const chu = khoCua(n, muc, k).lay(rng)
  return chu ? { chu, cam: GAN_LOI[k].cam } : null
}
export function cauMoi(n: NhipLoi, qid: string) { if (n.cau === qid) return; n.cau = qid; n.daNoi = false; if (n.nghi > 0) n.nghi-- }
export function suLoi(n: NhipLoi, muc: MucGT, k: NguCanhLoi, bay: number, rng: Rng = Math.random): { chu: string; cam: CamLoi } | null {
  if (!LUON_NOI.has(k)) {
    if (n.nghi > 0 || n.daNoi || bay - n.lanNoi < CACH_NOI_MS) return null
    if (k === 'cho' && bay - n.lanCham < 1500) return null
  }
  const c = chonCau(n, muc, k, rng)
  if (!c) return null
  n.daNoi = true; n.nghi = 1 + (rng() < 0.5 ? 1 : 0); n.lanNoi = bay
  return c
}
