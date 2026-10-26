// BÀI 6 CÂU KIỂU DUOLINGO (thầy 26/10: "mọi thứ học theo app dolingo … vẫn đảm bảo phủ câu mới, sửa câu sai"; đặc tả docs/de-xuat-phan-cau-kieu-duolingo-2610.md, A1 + A2).
// CHỈ SẮP LẠI danh sách việc của ngày đã chốt (`chonGoi7`) — không thêm, không bớt câu nào: quota phủ câu mới, trần câu sửa, mức ngày giữ nguyên.
// Trước: danh sách xếp theo khối (hết câu mới → chữa → sửa → ôn) nên chặng 1–2 toàn câu mới, chặng cuối toàn câu ôn. Nay mỗi chặng 6 câu trộn đều theo tỉ lệ
// còn lại của ngày (số câu mới mỗi chặng = phần câu mới còn lại chia đều cho số chặng còn lại), và trong chặng xếp dễ → khó → vừa:
//   câu 1 KHỞI ĐỘNG (ưu tiên câu ôn, xác suất đúng cao nhất) · giữa: dễ dần sang khó (câu khó nhất ở câu 4–5) · câu cuối VỪA (ưu tiên câu ôn) — em kết chặng bằng câu làm được.
// Câu mới của chặng chọn trong cửa sổ ưu tiên (giữ thứ tự ưu tiên của động cơ) sao cho TRUNG BÌNH xác suất đúng dự đoán của chặng gần 0,78 (Duolingo nhắm ~80% đúng).
// Ngày sát hạn (`giuThuTu`): giữ nguyên thứ tự cũ — câu mới đi trước, em làm dở ngày vẫn phủ được tối đa câu mới.
import type { ViecGoi7 } from './goi-bai-7-loi'

export const CAU_MOI_BAI = 6
/** Xác suất đúng mục tiêu của một chặng (Duolingo ~0,8; giữa dải 0,70–0,85). */
export const P_MUC_TIEU = 0.78
/** Câu chưa có dự đoán (động cơ chưa đủ dữ liệu). */
export const P_MAC_DINH = 0.7

type Nhom = 'on' | 'sua' | 'moi'
const nhomCua = (v: Pick<ViecGoi7, 'vai'>): Nhom => v.vai === 'on' ? 'on' : v.vai === 'sua' || v.vai === 'chua' ? 'sua' : 'moi'
/** Câu em đã nhờ thầy và thầy vừa chữa xong (`chua`): em đang chờ ⇒ luôn vào chặng SỚM NHẤT, không chia đều. */
const laChua = (v: Pick<ViecGoi7, 'vai'>): boolean => v.vai === 'chua'

/** Chia `co` chỗ cho các nhóm theo tỉ lệ số câu còn lại (phần dư lớn nhất), không nhóm nào vượt số câu nó có. */
export function chiaCho(dem: Readonly<Record<Nhom, number>>, co: number): Record<Nhom, number> {
  const tong = dem.on + dem.sua + dem.moi
  const ra: Record<Nhom, number> = { on: 0, sua: 0, moi: 0 }
  if (tong <= 0 || co <= 0) return ra
  const n = Math.min(co, tong), ks: Nhom[] = ['moi', 'sua', 'on']
  const du: { k: Nhom; r: number }[] = []
  for (const k of ks) { const x = dem[k] * n / tong; ra[k] = Math.min(dem[k], Math.floor(x)); du.push({ k, r: x - Math.floor(x) }) }
  // Phần dư: nhóm dư lớn hơn trước; hoà ⇒ câu mới trước (phủ bài), rồi sửa, rồi ôn.
  du.sort((a, b) => b.r - a.r || ks.indexOf(a.k) - ks.indexOf(b.k))
  let con = n - ra.on - ra.sua - ra.moi
  for (let vong = 0; con > 0 && vong < 3; vong++) for (const { k } of du) { if (con <= 0) break; if (ra[k] < dem[k]) { ra[k]++; con-- } }
  return ra
}

/** Chọn `k` câu trong cửa sổ ưu tiên đầu danh sách sao cho trung bình xác suất đúng của chặng (cùng `daCo`) gần `P_MUC_TIEU`. Giữ thứ tự ưu tiên khi hoà. */
function chonCanBang<T extends ViecGoi7>(ds: readonly T[], k: number, p: (v: T) => number, daCo: readonly T[]): T[] {
  if (k <= 0) return []
  const cua = ds.slice(0, Math.max(k, Math.min(ds.length, 3 * k)))
  const chon: T[] = []
  let tong = daCo.reduce((s, v) => s + p(v), 0), dem = daCo.length
  for (let i = 0; i < k && chon.length < cua.length; i++) {
    let tot = -1, lech = Infinity
    for (let j = 0; j < cua.length; j++) {
      if (chon.includes(cua[j]!)) continue
      const l = Math.abs((tong + p(cua[j]!)) / (dem + 1) - P_MUC_TIEU)
      if (l < lech - 1e-9) { lech = l; tot = j }
    }
    if (tot < 0) break
    chon.push(cua[tot]!); tong += p(cua[tot]!); dem++
  }
  // Trả theo thứ tự ưu tiên gốc (cửa sổ), không theo thứ tự chọn.
  return cua.filter(v => chon.includes(v))
}

/** Xếp MỘT chặng đã chọn: khởi động → dễ dần sang khó → câu cuối vừa. */
export function xepTrongBai<T extends ViecGoi7>(bai: readonly T[], p: (v: T) => number): T[] {
  if (bai.length <= 2) return [...bai].sort((a, b) => p(b) - p(a))
  const de = [...bai].sort((a, b) => p(b) - p(a))
  const layDauTien = (ds: T[], uuTien: (v: T) => boolean): T => { const i = ds.findIndex(uuTien); return ds.splice(i >= 0 ? i : 0, 1)[0]! }
  const dau = layDauTien(de, v => nhomCua(v) === 'on')
  const cuoi = layDauTien(de, v => nhomCua(v) === 'on')
  return [dau, ...de, cuoi]
}

/**
 * Sắp lại danh sách việc của ngày thành các chặng `co` câu trộn đều. Mỗi phần tử giữ nguyên (cùng đối tượng), tổng số và tập câu không đổi.
 * `p`: xác suất đúng dự đoán theo qid (động cơ Hành trình); thiếu ⇒ `P_MAC_DINH`.
 */
export function xepBai6<T extends ViecGoi7>(viec: readonly T[], pDung: Readonly<Record<string, number>> = {}, o: { co?: number; giuThuTu?: boolean } = {}): T[] {
  const co = Math.max(1, o.co ?? CAU_MOI_BAI)
  if (o.giuThuTu || viec.length <= 1) return [...viec]
  const p = (v: T): number => { const x = pDung[v.qid]; return typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : P_MAC_DINH }
  const con: Record<Nhom, T[]> = { on: [], sua: [], moi: [] }
  let chua: T[] = []
  for (const v of viec) if (laChua(v)) chua.push(v); else con[nhomCua(v)].push(v)
  const ra: T[] = []
  while (chua.length + con.on.length + con.sua.length + con.moi.length) {
    const dau = chua.slice(0, co); chua = chua.slice(dau.length)
    // Đủ `co` câu mỗi chặng (mở chặng cắt đúng `co` câu đầu danh sách), chặng cuối nhận phần còn; tỉ lệ tính trên phần CÒN LẠI ⇒ chia đều cho các chặng.
    const kich = Math.min(co - dau.length, con.on.length + con.sua.length + con.moi.length)
    const cho = chiaCho({ on: con.on.length, sua: con.sua.length, moi: con.moi.length }, kich)
    const on = con.on.slice(0, cho.on), sua = con.sua.slice(0, cho.sua)
    const moi = chonCanBang(con.moi, cho.moi, p, [...dau, ...on, ...sua])
    con.on = con.on.slice(cho.on); con.sua = con.sua.slice(cho.sua); con.moi = con.moi.filter(v => !moi.includes(v))
    ra.push(...xepTrongBai([...dau, ...on, ...sua, ...moi], p))
  }
  return ra
}
