import { useMemo } from 'react'
import {
  Sparkles,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  MessageSquareQuote,
  Target,
  Send,
  TrendingUp,
} from 'lucide-react'

export interface BangTroLyPhuHuynhProps {
  sbd: string
  hoTen: string
  lop?: string
  dsBaiThi: any[]
  caGanNhat?: any
  tongCauSai: number
  dsMomGiao: any[]
  onGiaoBaiKhacPhuc: () => void
  onXemChiTietCa: (ca: any) => void
  onXemBangDiem: () => void
  onGiaoBaiLuyen?: () => void
}

export default function BangTroLyPhuHuynh({
  sbd: _sbd,
  hoTen,
  lop: _lop,
  dsBaiThi,
  caGanNhat,
  tongCauSai,
  dsMomGiao,
  onGiaoBaiKhacPhuc,
  onXemChiTietCa,
  onXemBangDiem,
  onGiaoBaiLuyen,
}: BangTroLyPhuHuynhProps) {
  // Phân tích trạng thái học tập của con
  const thongKe = useMemo(() => {
    const soCaThi = dsBaiThi.length
    const diemGanNhat = caGanNhat ? (typeof caGanNhat.tong === 'number' ? caGanNhat.tong : (typeof caGanNhat.diem === 'number' ? caGanNhat.diem : null)) : null

    // Đếm bài Mom đang chờ làm
    const momChuaLam = dsMomGiao.filter((b) => b.trangThai === 'chua_lam' || b.trangThai === 'dang_lam').length
    const momDaNop = dsMomGiao.filter((b) => b.trangThai === 'da_nop').length

    // Nhận định sư phạm thích ứng
    let danhGia = 'Con đang duy trì tiến độ học tập ổn định.'
    let mucDoKhanCap = 'binh_thuong'

    if (tongCauSai >= 15) {
      danhGia = `Con đang tồn đọng ${tongCauSai} câu sai chưa chữa dứt điểm. Bố mẹ nên ưu tiên giao bài khắc phục ngắn (3–5 câu) để con bịt lỗ hổng kiến thức trước khi làm đề mới.`
      mucDoKhanCap = 'can_chu_y'
    } else if (momChuaLam > 0) {
      danhGia = `Con đang có ${momChuaLam} bài bố mẹ giao đang chờ hoàn thành. Hãy khích lệ con hoàn thành đúng hạn 2 tiếng để rèn luyện tính kỷ luật.`
      mucDoKhanCap = 'binh_thuong'
    } else if (diemGanNhat !== null && diemGanNhat >= 8) {
      danhGia = `Điểm ca gần nhất đạt ${diemGanNhat.toFixed(1)} điểm — con đang nắm rất chắc kiến thức trọng tâm! Bố mẹ có thể thưởng linh thú hoặc cho con thử sức câu hỏi nâng cao.`
      mucDoKhanCap = 'khen_ngoi'
    } else if (soCaThi > 0) {
      danhGia = `Con đã hoàn thành ${soCaThi} ca thi. Việc sửa lỗi sai kịp thời sẽ giúp con tiến bộ rõ rệt qua từng buổi học.`
    }

    return {
      soCaThi,
      diemGanNhat,
      momChuaLam,
      momDaNop,
      danhGia,
      mucDoKhanCap,
    }
  }, [dsBaiThi, caGanNhat, tongCauSai, dsMomGiao])

  return (
    <section
      aria-label="Trợ lý Phụ huynh Đồng hành cùng con"
      className="rounded-3xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/60 dark:from-slate-900/80 dark:via-slate-900/50 dark:to-slate-950 p-4 sm:p-6 shadow-sm space-y-5 transition-all"
    >
      {/* 1. HEADER TRỢ LÝ PHỤ HUYNH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-bold text-lg">
              ĐĐH
            </div>
            <span
              title="Trợ lý đang hoạt động trực tuyến"
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Trợ Lý Đồng Hành Cùng Con</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                Toàn diện · Trực tuyến
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Báo cáo tiến độ của em {hoTen} · Đề xuất sư phạm chính xác
            </p>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>{thongKe.soCaThi} ca đã thi</span>
          </div>

          {tongCauSai > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{tongCauSai} câu cần sửa</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã bịt sạch câu sai</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. LỜI KHUYÊN SƯ PHẠM CỦA THẦY ĐỐI VỚI BỐ MẸ */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 p-3.5 sm:p-4 shadow-2xs flex items-start gap-3">
        <MessageSquareQuote className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold text-slate-900 dark:text-white">
            Lời khuyên từ Thầy Đỗ Đại Học
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {thongKe.danhGia}
          </p>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 italic">
            Gợi ý: Chỉ cần 10–15 phút mỗi ngày cùng con xem lại 3–5 câu sai trọng tâm sẽ tạo ra bước nhảy vọt về điểm số.
          </div>
        </div>
      </div>

      {/* 3. TOP HÀNH ĐỘNG TRỢ LÝ ĐỀ XUẤT CHO BỐ MẸ (1-CLICK) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-blue-600" />
            <span>Trợ lý đề xuất cho Bố Mẹ hôm nay (Bấm là bung ra làm ngay)</span>
          </h3>
          <span className="text-[11px] text-slate-400">1-Click cá nhân hoá</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Giao bài khắc phục câu sai */}
          <div
            onClick={onGiaoBaiKhacPhuc}
            className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md hover:border-rose-400 transition cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  #1 BỊT LỖ HỔNG
                </span>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {tongCauSai > 0 ? `${tongCauSai} câu đang chờ` : 'Sạch lỗi sai'}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                Giao bài khắc phục câu sai
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tongCauSai > 0
                  ? `Chọn lọc từ ${tongCauSai} câu con đã làm sai ở các ca thi để giao con làm lại, bịt dứt điểm lỗ hổng.`
                  : 'Con đã làm đúng hết các câu! Bố mẹ có thể chọn thêm chuyên đề mới cho con.'}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onGiaoBaiKhacPhuc()
              }}
              className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              <span>Giao bài khắc phục ngay</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Xem kết quả ca thi gần nhất */}
          {caGanNhat ? (
            <div
              onClick={() => onXemChiTietCa(caGanNhat)}
              className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md hover:border-blue-400 transition cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    #2 KẾT QUẢ MỚI
                  </span>
                  {caGanNhat.maCa && (
                    <span className="text-[11px] font-mono text-slate-400">
                      #{caGanNhat.maCa}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {caGanNhat.tenCa || 'Ca thi vừa hoàn thành'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Điểm số: <b className="text-blue-600 dark:text-blue-400 text-sm">{typeof thongKe.diemGanNhat === 'number' ? thongKe.diemGanNhat.toFixed(1) : 'Đã nộp'}</b>
                  {caGanNhat.ngayNop ? ` · Ngày ${new Date(caGanNhat.ngayNop).toLocaleDateString('vi-VN')}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onXemChiTietCa(caGanNhat)
                }}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <span>Xem báo cáo chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={onXemBangDiem}
              className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    #2 BẢNG ĐIỂM
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-blue-600 transition">
                  Bảng điểm các ca thi
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Xem lịch sử làm bài và tiến trình hoàn thành các ca thi của con.
                </p>
              </div>
              <button
                type="button"
                className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <span>Xem bảng điểm</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Card 3: Giao bài luyện tập hôm nay hoặc Xem tất cả ca thi */}
          <div
            onClick={onGiaoBaiLuyen || onXemBangDiem}
            className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md hover:border-indigo-400 transition cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  #3 LUYỆN TẬP
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                  {thongKe.momChuaLam > 0 ? `${thongKe.momChuaLam} bài đang làm` : 'Sẵn sàng'}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {thongKe.momChuaLam > 0 ? 'Theo dõi bài con đang làm' : 'Giao bài luyện bứt phá hôm nay'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {thongKe.momChuaLam > 0
                  ? `Con đang có ${thongKe.momChuaLam} bài cần nộp. Thời hạn 2 tiếng giúp con rèn luyện tốc độ.`
                  : 'Giao bài luyện đề theo ngân sách thích ứng (8–16 câu) để con nâng cao năng lực.'}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (onGiaoBaiLuyen) onGiaoBaiLuyen()
                else onXemBangDiem()
              }}
              className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{thongKe.momChuaLam > 0 ? 'Xem danh sách bài giao' : 'Giao bài luyện ngay'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
