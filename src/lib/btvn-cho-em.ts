// BÀI TẬP VỀ NHÀ — PHÍA MÁY EM.
//
// Máy em KHÔNG có mã bí mật, và hai đường BTVN của em (`/btvn/cua-em`,
// `/btvn/nop`) cố ý là đường CÔNG KHAI — đúng mô hình `layPhieu` đang chạy: ai
// có mã ca và số báo danh thì mở được bài của chính mình.
//
// Phiếu dựng bằng chính bộ `html-phieu.ts` đang dùng cho phiếu khắc phục, để
// em nhìn thấy đúng một kiểu trang, và để không đẻ thêm một bộ dựng thứ hai.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import { layCauHinhMayChu, xongNapDiaChi } from './may-chu-moi'

/** Cấu hình máy chủ cho đường BTVN của em. Dùng chung đường máy em vẫn tự tìm
 * địa chỉ (xem `layCauHinhChoEm`), nên máy nào mở link cũng chạy. */
export async function layCauHinhChoEmBtvn(): Promise<CauHinhMayChu> {
  // Chờ lượt nạp địa chỉ lúc khởi động xong rồi hãy đọc — máy em mở link lần
  // đầu thì cấu hình đang được nạp ngay lúc ấy (xem `napDiaChiMayChuMoiChoEm`).
  await xongNapDiaChi()
  return layCauHinhMayChu()
}

/** Dựng trang bài tập về nhà.
 *
 * DÙNG ĐÚNG BỘ PHIẾU KHẮC PHỤC (thầy chốt 12/09: "làm chuẩn html và hiển thị
 * đầy đủ đề ảnh, công thức. Nộp được chọn đáp án được theo chuẩn của html rút
 * câu hỏi khắc phục"). Nghĩa là gói đề đi qua ĐÚNG cửa nạp kho đang chạy:
 *
 *     gói kho → parseKhoDeJson → buildTeacherSourceFromKhoDe → cauLuyenTuNguon
 *             → dungPhieu(..., { nop })
 *
 * VÌ SAO PHẢI ĐI QUA CỬA ẤY, và đây là lỗi bản đầu đã dính: gói kho ghi phương
 * án ở khoá `pa: {A,B,C,D}`, đáp án ở `dap_an`, ảnh ở `hinh`. Bản đầu tự đọc
 * `luaChon` nên phương án MẤT SẠCH — em mở phiếu ra chỉ thấy đề bài và một ô
 * "Đáp án: ......", không có gì để chọn. Cửa nạp kho biết đủ mọi khuôn ấy, và
 * còn LOẠI câu thiếu phương án hay thiếu đáp án ngay tại cửa thay vì dựng một
 * ô trống cho em ngồi đoán.
 *
 * Phiếu nộp được: `dungPhieu` gắn thanh nộp, chấm tại chỗ rồi gửi lên máy chủ.
 * Đáp án KHÔNG nằm trong dữ liệu phiếu cho tới lúc em bấm nộp — máy chủ chấm
 * lại bằng kho, không tin con số máy em gửi. */
export async function dungPhieuBtvn(
  r: { hanNop?: string; soCau?: number; de?: unknown; daNop?: boolean; maBtvn?: string },
  maCa: string,
  sbd: string,
): Promise<string> {
  const [{ dungPhieu }, { parseKhoDeJson, buildTeacherSourceFromKhoDe }, { cauLuyenTuNguon }, { layCauHinhChoEmBtvn: layCh }] = await Promise.all([
    import('./html-phieu'),
    import('./exam-kho-de-import'),
    import('./bai-tap-pdf'),
    Promise.resolve({ layCauHinhChoEmBtvn }),
  ])

  const doc = parseKhoDeJson(r.de)
  if (!doc.ok || !doc.json) {
    // Kê hai lỗi đầu là đủ để thầy biết hỏng ở đâu; kê hết thì câu báo dài
    // hơn màn điện thoại. Đây là cắt DANH SÁCH LỖI, không phải cắt câu hỏi.
    const viSao = (doc.errors ?? []).filter((_, i) => i < 2).join('; ')
    throw new Error(`Gói bài tập không đọc được: ${viSao || 'khuôn lạ'}`)
  }
  const dung = buildTeacherSourceFromKhoDe(doc.json)
  const cau = cauLuyenTuNguon([dung.source])
  if (cau.length === 0) throw new Error('Gói bài tập không có câu nào dùng được')

  const ch = await layCh()
  const han = String(r.hanNop ?? '')
  const maBtvn = String(r.maBtvn ?? '').trim()

  return dungPhieu(
    {
      hoTen: '',
      sbd,
      ngay: new Date(),
      tenChuyenDe: 'Bài tập về nhà',
      ketQua: '',
      hienDapAn: false,
      nhanBia: 'BÀI TẬP VỀ NHÀ',
      oBia: [
        { nhan: 'Số báo danh', gia: sbd },
        { nhan: 'Ca', gia: maCa },
        { nhan: 'Hạn nộp', gia: han ? gioVN(han) : '—' },
      ],
    },
    cau,
    {
      // Đã nộp rồi thì mở thành phiếu CHỈ ĐỌC kèm lời giải — em xem lại bài,
      // không nộp thêm lần nữa.
      nop: r.daNop || !maBtvn ? null : { ma: maBtvn, sbd, url: `${String(ch.URL ?? '').replace(/\/+$/, '')}/goi` },
      loiNhac: r.daNop
        ? 'Em đã nộp bài này rồi — đây là bản xem lại, bấm vào từng câu để mở lời giải.'
        : `Bài tập về nhà · ${cau.length} câu${han ? ` · hạn nộp ${gioVN(han)}` : ''}. Làm xong bấm Nộp bài ở thanh trên.`,
    },
  )
}

/** Giờ Việt Nam gọn cho phiếu: 20:30 ngày 13/09. */
function gioVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${hai(d.getHours())}:${hai(d.getMinutes())} ngày ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
}

/** Rút câu từ gói đề. Nhận mọi dạng gói qua các đời, và KHÔNG đoán khi lạ. */
export function docCauBtvn(de: unknown): Record<string, unknown>[] {
  const g = (de ?? {}) as Record<string, unknown>
  if (Array.isArray(g.cau)) return g.cau as Record<string, unknown>[]
  if (Array.isArray(g.items)) return g.items as Record<string, unknown>[]
  const gom: Record<string, unknown>[] = []
  for (const p of ['phanI', 'phanII', 'phanIII'] as const) {
    const v = g[p]
    if (Array.isArray(v)) for (const c of v) gom.push(c as Record<string, unknown>)
  }
  return gom
}
