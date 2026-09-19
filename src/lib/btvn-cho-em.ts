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
import { loDangCho, tinhLichLoBtvn, tongCauDenLo } from './lich-lo-btvn'

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
  r: {
    hanNop?: string
    giaoLuc?: string
    soCau?: number
    de?: unknown
    daNop?: boolean
    maBtvn?: string
    soLanLam?: number
    soLanLamLaiConLai?: number
    /** Số lô đã xong — máy chủ ghi qua `/btvn/xong-lo` (xem `lich-lo-btvn.ts`). */
    loDaXong?: number
  },
  maCa: string,
  sbd: string,
  tuyChon?: { lamLai?: boolean; soCauSang?: number },
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
  const laLamLai = !!tuyChon?.lamLai
  if (laLamLai) {
    r = { ...r, daNop: false }
  }
  const conLai = typeof r.soLanLamLaiConLai === 'number' ? r.soLanLamLaiConLai : 3
  const lanLamHienTai = (Number(r.soLanLam) || 1) + (laLamLai ? 1 : 0)

  let banNhap: Record<string, string> | undefined
  if (!laLamLai && !r.daNop && maBtvn) {
    try {
      const raw = localStorage.getItem(`ddh.btvn.draft.${maBtvn}.${sbd}`) || localStorage.getItem(`ddh.lam.${maBtvn}`)
      if (raw) banNhap = JSON.parse(raw)
    } catch {}
  }

  // LỊCH LÔ (thay Vòng 1/2/3 — mục 3 SO-VIEC.md 19/09): tính lại ngay tại đây
  // từ giaoLuc/hanNop/soCau + `loDaXong` máy chủ đã ghi, MỘT nguồn duy nhất
  // cho mọi màn mở phiếu (trợ lý bảng tin lẫn tab "Bài tập" bấm thẳng) — không
  // còn 3 màn Vòng 1/2/3 chọn `soCauSang` khác nhau nên không cần công thức cố
  // định riêng cho auto-detect nữa (xem NGƯỠNG LÔ HIỆN TẠI ở html-phieu.ts).
  // Ngân sách ngày dùng mặc định "vừa sức" (12 câu) vì hàm này không thấy được
  // các nhiệm vụ KHÁC của em — trợ lý bảng tin (`tro-ly-ca-nhan.ts`) mới có đủ
  // ngữ cảnh đó; lệch nhau ở đây chỉ ảnh hưởng NHỊP hiện câu, không ảnh hưởng
  // hạn nộp thật (máy chủ vẫn chặn theo `hanNop`).
  const lich = tinhLichLoBtvn({ soCau: cau.length, giaoLuc: String(r.giaoLuc ?? ''), hanNop: han, nganSachNgay: 12, taiKhac: 0 })
  const dangCho = loDangCho(lich, Math.max(0, Number(r.loDaXong) || 0), Date.now())
  const soCauSangMacDinh = r.daNop ? cau.length : dangCho ? tongCauDenLo(lich, dangCho.chiSo) : cau.length
  const soCauSang = typeof tuyChon?.soCauSang === 'number' ? tuyChon.soCauSang : soCauSangMacDinh
  const tongLo = lich.cacLo.length

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
        ...(laLamLai ? [{ nhan: 'Lượt làm', gia: `Làm lại lần ${lanLamHienTai - 1} (còn ${conLai} lượt)` }] : []),
      ],
    },
    cau,
    {
      laBtvn: true,
      soCauSang,
      chiSoLoHienTai: dangCho?.chiSo,
      // Đã nộp rồi thì mở thành phiếu CHỈ ĐỌC kèm lời giải — em xem lại bài,
      // không nộp thêm lần nữa.
      nop: r.daNop || !maBtvn ? null : { ma: maBtvn, sbd, banNhap, legacyIds:cau.map(c=>doc.json!.ma_de+(c.id.match(/-(III|II|I)-\d+$/)?.[0]||'')), url: `${String(ch.URL ?? '').replace(/\/+$/, '')}/goi` },
      loiNhac: r.daNop
        ? `Em đã nộp bài này rồi — đây là bản xem lại, bấm vào từng câu để mở lời giải.${conLai > 0 ? ` Thầy cho phép làm lại tối đa 3 lần (còn ${conLai} lượt).` : ' (Đã hết 3 lượt làm lại)'}`
        : laLamLai
        ? `Bài tập về nhà (Làm lại lần ${lanLamHienTai - 1} · còn ${conLai} lượt) · ${cau.length} câu${han ? ` · hạn nộp ${gioVN(han)}` : ''}. Hôm nay làm ${soCauSang} câu${tongLo > 1 ? ` (lô ${(dangCho?.chiSo ?? 0) + 1}/${tongLo})` : ''}; câu còn lại mở dần theo ngày/giờ, không dồn hết một lúc. Làm xong bấm Nộp bài ở thanh trên.`
        : `Bài tập về nhà · ${cau.length} câu${han ? ` · hạn nộp ${gioVN(han)}` : ''}. Hôm nay làm ${soCauSang} câu${tongLo > 1 ? ` (lô ${(dangCho?.chiSo ?? 0) + 1}/${tongLo})` : ''}; câu còn lại mở dần theo ngày/giờ, không dồn hết một lúc. Làm xong bấm Nộp bài ở thanh trên.`,
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
