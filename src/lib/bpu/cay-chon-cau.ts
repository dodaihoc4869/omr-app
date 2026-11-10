// BÌNH PHẢN ỨNG — DANH SÁCH BÀI CỦA BẢNG CHỌN CÂU, ĐÚNG THỨ TỰ CÂY THƯ MỤC KHO (thầy 10/11: «sắp xếp đúng thứ tự cây thư mục»).
// Lỗi cũ: ChonCauBpu gom theo chương nhưng giữ THỨ TỰ NHẬP KHO ⇒ «Bài 11. Ôn tập chương 3» đứng trước «Bài 8. Amine».
// KHÔNG tự sắp: dùng lại đúng cây của app thầy — `dungCay` (cay-chon-de.ts, cây chọn đề: khối → chương → bài → tờ) rồi `dsBaiCuaKhoi`
// (bai-hom-nay.ts, danh sách bài «Bài hôm nay» của bảng Dạy học: chương theo số chương, bài theo số bài — «Bài 2» trước «Bài 10», thầy 06/10).
// Trong một bài: thứ tự tờ của cây (Ví dụ minh hoạ, Các dạng toán trọng tâm trước), rồi Phần I → II → III (Trắc nghiệm → Đúng–sai → Trả lời ngắn) như
// `tachTheoPhan` tách một đề — kể cả khi kho cất sẵn từng tờ riêng (kho máy đọc theo mã ⇒ «-DS» đứng trước «-TN»). Sắp ổn định: tờ khác giữ chỗ.
// Thuần, không IO. Chỉ bảng chọn câu (mảnh nạp lười) dùng — không vào đường mở /gv.
import type { TeacherExamSource } from '../../data/examContent'
import { dungCay } from '../cay-chon-de'
import { dsBaiCuaKhoi, type BaiCay } from '../bai-hom-nay'

/** Nhãn phần dùng trong bảng chọn câu (cùng chữ thẻ câu bên phải và chip máy em). */
export const LOAI_PHAN: Record<'I' | 'II' | 'III', string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

export interface ToChonCau { maDe: string; nhan: string; soCau: number }
export interface BaiChonCau { khoa: string; ten: string; soCau: number; to: ToChonCau[] }
export interface ChuongChonCau { khoa: string; ten: string; bai: BaiChonCau[] }

/** Khối «?» = nút «Chưa rõ khối» của cây (`dungCay` đặt khoá `…/?`) — luôn hiện ở mọi bộ lọc khối như trước. */
const KHOI_CHUA_RO = '?'
const boDau = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** Nhãn tờ: tờ một phần ⇒ tên phần (giữ đuôi « · D1» của bài cắt đôi); Ví dụ minh hoạ / Các dạng toán trọng tâm / Cả đề ⇒ nhãn của cây. */
export function nhanTo(t: BaiCay['to'][number]): string {
  if (!t.phan) return t.nhan.replace(/^Đúng sai/, LOAI_PHAN.II)
  const i = t.nhan.indexOf(' · ')
  return LOAI_PHAN[t.phan] + (i >= 0 ? t.nhan.slice(i) : '')
}

const HANG_PHAN: Record<string, number> = { I: 1, II: 2, III: 3 }
/** Hạng tờ trong bài: Ví dụ minh hoạ / Các dạng toán trọng tâm (cây đặt đầu) ⇒ 0; Phần I / II / III ⇒ 1 / 2 / 3; tờ khác (cả đề, tự luận) ⇒ 4. */
const hangTo = (t: BaiCay['to'][number]): number => (t.phan ? HANG_PHAN[t.phan]! : /^(Ví dụ minh hoạ|Các dạng toán trọng tâm)$/.test(t.nhan) ? 0 : 4)
const xepTo = (to: BaiCay['to']): BaiCay['to'] => to.map((t, i) => ({ t, i })).sort((a, b) => hangTo(a.t) - hangTo(b.t) || a.i - b.i).map((x) => x.t)

/** Bài theo khối, đúng thứ tự cây; dựng MỘT lần cho mỗi kho (lọc khối / ô tìm chạy trên kết quả này). */
export function baiTheoCay(kho: readonly TeacherExamSource[]): { khoi: string; bai: BaiCay[] }[] {
  const cay = dungCay([...kho])
  const ra = ['10', '11', '12', KHOI_CHUA_RO].map((k) => ({ khoi: k, bai: dsBaiCuaKhoi(cay, k).map((b) => ({ ...b, to: xepTo(b.to) })) })).filter((x) => x.bai.length)
  // Phòng xa: tờ nào cây không xếp vào khối 10 / 11 / 12 / «chưa rõ» ⇒ vẫn hiện (cuối, đúng thứ tự kho) — không để tờ biến mất khỏi bảng chọn.
  const daCo = new Set(ra.flatMap((x) => x.bai.flatMap((b) => b.to.map((t) => t.maDe))))
  const sot = kho.filter((s) => !daCo.has(s.maDe))
  if (sot.length) {
    const bai: BaiCay[] = sot.map((s, i) => {
      const so = s.phanI.length + s.phanII.length + s.phanIII.length
      const phan = s.phanI.length && !s.phanII.length && !s.phanIII.length ? 'I' : s.phanII.length && !s.phanI.length && !s.phanIII.length ? 'II' : s.phanIII.length && !s.phanI.length && !s.phanII.length ? 'III' : null
      const ten = (s.nguon || s.maDe).split(' — ')[0]!.trim()
      return { khoaBai: s.maDe, tenBai: ten, viTri: i + 1, chuong: '', soCau: so, to: [{ maDe: s.maDe, nhan: phan ? LOAI_PHAN[phan] : 'Cả đề', soCau: so, phan, tuDong: false }] }
    })
    const cu = ra.find((x) => x.khoi === KHOI_CHUA_RO)
    if (cu) cu.bai.push(...bai)
    else ra.push({ khoi: KHOI_CHUA_RO, bai })
  }
  return ra
}

/** Danh sách hiện ở cột trái: chương (tiêu đề «Lớp 12 · C3 - …») → bài (tiêu đề) → tờ (nút chọn). Lọc khối: chỉ khối ấy + «chưa rõ khối»;
 *  ô tìm (không dấu) khớp tên bài hoặc tên chương. */
export function dsChonCau(theoKhoi: ReturnType<typeof baiTheoCay>, khoi: string, tim: string): ChuongChonCau[] {
  const t = boDau(tim.trim())
  const ra: ChuongChonCau[] = []
  for (const { khoi: k, bai } of theoKhoi) {
    if (khoi && k !== KHOI_CHUA_RO && k !== khoi) continue
    for (const b of bai) {
      if (t && !boDau(`${b.tenBai} ${b.chuong}`).includes(t)) continue
      const khoa = `${k}/${b.chuong}`
      let ch = ra[ra.length - 1]
      if (!ch || ch.khoa !== khoa) {
        ch = { khoa, ten: `${k !== KHOI_CHUA_RO ? `Lớp ${k} · ` : ''}${b.chuong || 'Chưa xếp chương'}`, bai: [] }
        ra.push(ch)
      }
      ch.bai.push({ khoa: `${k}/${b.khoaBai}/${b.viTri}`, ten: b.tenBai, soCau: b.soCau, to: b.to.map((x) => ({ maDe: x.maDe, nhan: nhanTo(x), soCau: x.soCau })) })
    }
  }
  return ra
}
