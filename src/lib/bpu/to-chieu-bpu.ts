// BÌNH PHẢN ỨNG — TỜ CHIẾU DỰNG TỪ CÂU THẦY CHỌN NGAY TRÊN BẢNG (thầy 09/11: «khi chiếu điểm danh lên bảng, có nút xong điểm danh rồi chọn câu
// chiếu ngay trên màn điểm danh đó»). Kho = nhánh DẠY HỌC (cùng kho bảng Dạy học, `khoDayHoc`); tờ = màn chiếu chuẩn cũ (`taoHtmlMayChieu`).
// Khác `dungToChieuDayHoc`: KHÔNG xếp em trước cho từng câu (Bình Phản Ứng tự gọi em khi cả lớp làm xong), KHÔNG cầu nối ghi kết quả (kết quả
// em lên bảng ghi MỘT lần qua phòng Bình Phản Ứng); mỗi đợt LUÔN mang mã câu máy chủ ⇒ vào đợt là câu tự gửi xuống máy em.
// Mọi thứ nạp lười: chỉ chạy khi thầy mở bảng chọn câu.
import type { TeacherExamSource } from '../../data/examContent'
import type { CauDayHoc } from '../day-hoc-len-bang'

let kho: TeacherExamSource[] | null = null
let dangNap: Promise<TeacherExamSource[]> | null = null
/** Kho Dạy học của máy này (đọc một lần mỗi phiên; lỗi ⇒ ném để nơi gọi báo và cho thử lại). */
let ngheKho = false
export function napKhoDayHoc(): Promise<TeacherExamSource[]> {
  // Đồng bộ ngầm kho máy thầy (14/11 — bảng chiếu bản cũ «3%» trong khi máy em «1%»): có đề đổi ⇒ bỏ bản đã đọc, lần chọn câu sau đọc lại.
  if (!ngheKho) { ngheKho = true; void import('../dong-bo-ngam').then((m) => { m.khiKhoDoi(() => { kho = null }); void m.dongBoNgam() }).catch(() => {}) }
  else void import('../dong-bo-ngam').then((m) => m.dongBoNgam()).catch(() => {})
  if (kho) return Promise.resolve(kho)
  if (dangNap) return dangNap
  dangNap = (async () => {
    try {
      const [{ loadExamSources }, { khuTrungNguon }, { tachNhieuTheoPhan }, { khoDayHoc }] = await Promise.all([
        import('../exam-db'), import('../khu-trung-cau'), import('../tach-phan-de'), import('../day-hoc-len-bang'),
      ])
      kho = khoDayHoc(await loadExamSources(), khuTrungNguon, tachNhieuTheoPhan)
      return kho
    } finally { dangNap = null }
  })()
  return dangNap
}

/** Bài đã chọn cho buổi ở bảng Dạy học (khoá `ddh.dayHoc.<buổi>` của DayHocLenBang — chỉ ĐỌC). */
export function baiDaChonCuaBuoi(buoiId: string): { maChon: string[]; boCau: string[] } {
  try {
    const j = JSON.parse(localStorage.getItem(`ddh.dayHoc.${buoiId}`) || 'null') as { maChon?: unknown; boCau?: unknown } | null
    const ds = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [])
    return { maChon: ds(j?.maChon), boCau: ds(j?.boCau) }
  } catch { return { maChon: [], boCau: [] } }
}

/** Dựng tờ chiếu cho các câu (câu thầy bấm đứng đầu, rồi các câu sau của bài ⇒ «Câu tiếp» đi tiếp trong bài). */
export async function dungToChieuBpu(dsCau: readonly CauDayHoc[], tenBuoi: string): Promise<string> {
  const [{ cauLuyenTuBoCau }, { taoHtmlMayChieu }, { uocLuongBacCauGoc }, { CAU_HINH_LEN_BANG_MAC_DINH }] = await Promise.all([
    import('../bai-tap-pdf'), import('../html-may-chieu'), import('../uoc-luong-bo-cuc'), import('../len-bang-cau-hinh'),
  ])
  const dsO = dsCau.map((c, i) => {
    const [cl] = cauLuyenTuBoCau([{ phan: c.phan, maDe: c.maDe, q: c.q }])
    const g = c.q as unknown as Record<string, unknown> & { loiGiai?: { chot?: string } }
    const cau = {
      ...cl!,
      chuyenDe: cl!.chuyenDe || c.chuyenDe,
      explanation: cl!.explanation || (g.explanation as string) || (g.huongDanGiai as string) || (g.loiGiaiChiTiet as string),
      loiGiai: cl!.loiGiai || (g.loiGiai as typeof cl.loiGiai),
      chot: cl!.chot || g.loiGiai?.chot || (g.kienThucCotLoi as string) || '',
    }
    return { sbd: '', hoTen: 'Cả lớp', qid: c.qid, bacUoc: uocLuongBacCauGoc(c.phan, c.q).bac, soCau: i + 1, sao: cau.sao, mucDo: c.mucDo || undefined, cau }
  })
  // Lời giải Kính trên màn chiếu (như bảng Dạy học) — lỗi ⇒ tờ như cũ.
  const dsOKinh = await (await import('../loi-giai-kinh/kinh-chieu-gan')).ganKinhChoBang(dsO).catch(() => dsO)
  return taoHtmlMayChieu(dsOKinh, { tenBuoi, ngay: new Date(), nganSachPhut: CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT, nutAiSai: false })
}
