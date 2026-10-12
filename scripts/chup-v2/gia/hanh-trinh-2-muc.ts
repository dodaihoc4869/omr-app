// LÀN HÀNH TRÌNH 12/10B — máy chủ GIẢ riêng cho cảnh `?man=gv-nhip&ht2=1` (Hành trình còn 2 mục; mục Dạy học & đầu giờ = MỘT buổi dạy 4 bước).
// Chỉ trả lời khi đang chụp cảnh ht2 (mọi cảnh khác đi tiếp máy giả chung — ảnh cũ không đổi). Tên học sinh là tên GIẢ.
//   · `/gv/buoi-hoc` xem: buổi giả chung (38/44 em có mặt) + danh sách lớp có 6 em vắng ⇒ dòng "Vắng 6 em: …";
//   · `/gv/dau-gio`: một lượt 6 em gọi lên bảng (1 Đạt · 1 Chưa đạt · 4 chưa chấm), câu lấy từ kho giả trên máy, lịch sử câu như bản vẽ.
// `/gv/goi-bai-7` (bảng Bài đang giao) dùng bộ giả của làn Bài mới 7 ngày (3 gói ≈ 60 em × 40 câu).
import { traLoiThay } from '../../chup-omni-3/gia/may-thay'
import { KHO } from '../../chup-omni-3/gia/may-thay'
import { cauTheoQid } from '../../../src/lib/dau-gio-kho'

export const LA_HT2 = new URLSearchParams(globalThis.location?.search ?? '').get('ht2') === '1'

const VANG = ['Bùi Quang Minh', 'Lý Gia Hân', 'Trịnh Bảo Ngọc', 'Hồ Đức Thịnh', 'Mai Phương Thảo', 'Cao Minh Khôi']
const LICH_SU = [
  'Đúng 08/10 (Học theo kế hoạch) · 52 giây',
  'Sai 02/10 (Ca kiểm tra) · Đúng 06/10 (Ôn theo kế hoạch)',
  'Đúng 05/10 (Học theo kế hoạch) · 1 phút 20 giây',
  'Đúng 03/10 (Lên bảng)',
  'Đúng 07/10 (Ôn theo kế hoạch) · 2 phút 4 giây',
  'Đúng 09/10 (Học theo kế hoạch) · 48 giây',
]
type KQ = { ok: true; du: Record<string, unknown> } | { ok: false; loai: string; chu: string }
const du = (o: Record<string, unknown>): KQ => ({ ok: true, du: { ok: true, ...o } })

/** Sáu em đầu danh sách có mặt của buổi giả, mỗi em một câu khác nhau của kho DẠY HỌC khối 12 (trạng thái chấm như bản vẽ). */
async function luotGia() {
  const b = await traLoiThay('/gv/buoi-hoc', { action: 'xem', id: 'BH-9' })
  const coMat = b.ok ? ((b.du.coMat as { sbd: string; hoTen: string }[]) ?? []) : []
  const qid = [...cauTheoQid(KHO).values()].filter((c) => c.qid.startsWith('DH-12') && !c.tuLuan).map((c) => c.qid)
  const buoc = Math.max(1, Math.floor(qid.length / 6))
  return coMat.slice(0, 6).map((e, i) => ({
    sbd: e.sbd, hoTen: e.hoTen, qid: qid[(i * buoc) % Math.max(1, qid.length)] ?? `Q${i}`, luot: 1, chuyenDe: 'Ester – Lipid',
    trangThai: i === 0 ? 'dat' : i === 1 ? 'chua_dat' : 'cho', chamLuc: i < 2 ? '2026-10-05T11:20:00Z' : null, daChuaLuc: i === 1 ? '2026-10-05T11:25:00Z' : null,
  }))
}

/** Trả lời một lệnh của cảnh ht2; `null` ⇒ để máy giả chung trả lời. */
export async function traLoiHt2(duong: string, b: Record<string, unknown>): Promise<KQ | null> {
  if (!LA_HT2) return null
  if (duong === '/gv/buoi-hoc' && b.action !== 'dang-mo' && b.action !== 'gan-day') {
    const r = await traLoiThay(duong, b)
    if (!r.ok) return r
    const coMat = (r.du.coMat as { sbd: string; hoTen: string }[]) ?? []
    const lop = String((r.du.buoi as { lop?: string } | undefined)?.lop ?? '12A1')
    const lopEm = [...coMat.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: lop })), ...VANG.map((hoTen, i) => ({ sbd: `V${i + 1}`, hoTen, tenLop: lop }))]
    return { ok: true, du: { ...r.du, lopEm } }
  }
  if (duong === '/gv/dau-gio') {
    const luot = await luotGia()
    if (b.action === 'xem') return du({ daKetThuc: false, luot })
    if (b.action === 'lich-su') return du({ ketQua: luot.map((x, i) => ({ sbd: x.sbd, qid: x.qid, chu: LICH_SU[i] ?? '', daChua: [] })) })
    if (b.action === 'cham') return du({ ketQua: b.dat ? 'dat' : 'chua_dat', daCoTruoc: false })
    return du({})
  }
  return null
}
