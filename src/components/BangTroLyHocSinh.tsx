import { useMemo, useState } from 'react'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Flame,
  ChevronRight,
  MessageSquareQuote,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  PenSquare,
} from 'lucide-react'
import {
  tongHopKeHoachTroLy,
  type NhiemVuTroLy,
  type KeHoachNgayTroLy,
} from '../lib/tro-ly-ca-nhan'

export interface BangTroLyHocSinhProps {
  sbd: string
  hoTen: string
  dsBtvn: any[]
  dsMomGiao: any[]
  dsLichSu: any[]
  tongSoCauSai: number
  hoSoThanThu?: any
  onAction: (hanhDong: NhiemVuTroLy['hanhDong']) => void
}

export default function BangTroLyHocSinh({
  sbd,
  hoTen,
  dsBtvn,
  dsMomGiao,
  dsLichSu,
  tongSoCauSai,
  hoSoThanThu,
  onAction,
}: BangTroLyHocSinhProps) {
  const [moRadar, setMoRadar] = useState(false)

  const keHoach: KeHoachNgayTroLy = useMemo(() => {
    return tongHopKeHoachTroLy({
      sbd,
      hoTen,
      dsBtvn,
      dsMomGiao,
      dsLichSu,
      tongCauSai: tongSoCauSai,
      hoSoThanThu,
    })
  }, [sbd, hoTen, dsBtvn, dsMomGiao, dsLichSu, tongSoCauSai, hoSoThanThu])

  const { nganSach, streak, top3, radarDeadline, thanThu, loiKhuyenSuPham } = keHoach

  return (
    <section
      aria-label="Trợ lý Học tập Cá nhân"
      className="rounded-3xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/60 dark:from-slate-900/80 dark:via-slate-900/50 dark:to-slate-950 p-4 sm:p-6 shadow-sm space-y-5 transition-all"
    >
      {/* 1. HEADER TRỢ LÝ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-bold text-lg">
              ĐĐH
            </div>
            <span
              title="Trợ lý đang hoạt động trực tiếp trên app của em"
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Trợ Lý Học Tập Của Em</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                Toàn diện · Cá nhân hoá
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đồng hành cùng em · Quản lý deadline & Bịt dứt điểm lỗ hổng
            </p>
          </div>
        </div>

        {/* Nút Vào thi & Streak & Thần thú info */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => onAction({ loai: 'mo_thi', nhanNut: 'Vào phòng thi' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer ring-2 ring-blue-400/20"
            title="Vào phòng thi trực tuyến để làm bài kiểm tra"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>Vào phòng thi</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
            <span>Chuỗi {streak.soNgayLienTiep} ngày</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>{thanThu.tenThu} · Cấp {thanThu.cap}</span>
          </div>
        </div>
      </div>

      {/* 2. LỜI KHUYÊN SƯ PHẠM CỦA THẦY */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 p-3.5 sm:p-4 shadow-2xs flex items-start gap-3">
        <MessageSquareQuote className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold text-slate-900 dark:text-white">
            {loiKhuyenSuPham.tieuDe}
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {loiKhuyenSuPham.noiDung}
          </p>
          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium pt-1">
            Linh thú nhắc em: {thanThu.thongDiepThu}
          </div>
        </div>
      </div>

      {/* 3. TIẾN ĐỘ NGÀY & NGÂN SÁCH THÍCH ỨNG (ANTI-BURNOUT) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Target className="w-4 h-4 text-blue-600" />
            <span>Tiến độ học hôm nay: {nganSach.daLamCau} / {nganSach.mucTieuCau} câu ({nganSach.phanTramHoanThanh}%)</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            {nganSach.phutConLaiUocTinh > 0
              ? `Ước tính còn ~${nganSach.phutConLaiUocTinh} phút học`
              : 'Đã hoàn thành chỉ tiêu ngày!'}
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              nganSach.phanTramHoanThanh >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(4, nganSach.phanTramHoanThanh))}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          {nganSach.chuThich}
        </p>
      </div>

      {/* 4. TOP 3 VIỆC CẦN LÀM NGAY HÔM NAY (THE DAILY 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Hôm nay Trợ lý xếp cho em (3 việc quan trọng nhất)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Ưu tiên theo thời hạn & độ cần thiết</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3.map((task, idx) => {
            const isKhancap = task.capDoUuTien === 'khan_cap'
            const isQuanTrong = task.capDoUuTien === 'quan_trong'
            const isThuThach = task.capDoUuTien === 'thu_thach'

            let borderClass = 'border-slate-200 dark:border-slate-800'
            let badgeBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            let rankText = `#${idx + 1} TIÊU CHUẨN`

            if (isKhancap) {
              borderClass = 'border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-400/30'
              badgeBg = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              rankText = `#${idx + 1} KHẨN CẤP`
            } else if (isQuanTrong) {
              borderClass = 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/30'
              badgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              rankText = `#${idx + 1} QUAN TRỌNG`
            } else if (isThuThach) {
              borderClass = 'border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-400/30'
              badgeBg = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
              rankText = `#${idx + 1} BỨT PHÁ`
            }

            return (
              <div
                key={task.id}
                className={`rounded-2xl p-4 bg-white dark:bg-slate-900 border ${borderClass} flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                      {rankText}
                    </span>
                    {task.conLaiChu && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.conLaiChu}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2">
                    {task.tieuDe}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {task.moTa}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>{task.soCau} câu · ~{task.phutUocTinh} phút</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">+{task.expThuong} EXP</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAction(task.hanhDong)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer ${
                      isKhancap
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        : isQuanTrong
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{task.hanhDong.nhanNut}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. RADAR DEADLINE & TỔNG QUAN TẤT CẢ HẠN NỘP */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 sm:p-4 space-y-3">
        <button
          type="button"
          onClick={() => setMoRadar(!moRadar)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            <span>Radar Hạn Nộp & Bài Tập:</span>
            {radarDeadline.sapHetHan > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold">
                {radarDeadline.sapHetHan} bài sắp đến hạn
              </span>
            )}
            {radarDeadline.quaHan > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold">
                {radarDeadline.quaHan} bài quá hạn
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              {radarDeadline.daXong} bài đã hoàn thành
            </span>
          </div>

          <span className="text-slate-400 p-1">
            {moRadar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {moRadar && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-google-fade">
            {radarDeadline.danhSach.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Hiện chưa có hạn nộp nào cần theo dõi.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {radarDeadline.danhSach.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.trangThai === 'da_xong') return
                      if (item.loai === 'mom') {
                        onAction({ loai: 'mo_mom', nhanNut: 'Làm bài Mom' })
                      } else {
                        onAction({ loai: 'mo_btvn', nhanNut: 'Làm BTVN' })
                      }
                    }}
                    className={`py-2 flex items-center justify-between gap-2 text-xs ${
                      item.trangThai !== 'da_xong' ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg px-2 -mx-2 transition' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">
                      {item.tieuDe}
                    </div>
                    <div className="shrink-0 font-semibold">
                      {item.trangThai === 'da_xong' && (
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã nộp</span>
                        </span>
                      )}
                      {item.trangThai === 'khan_cap' && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          {item.conLaiChu}
                        </span>
                      )}
                      {item.trangThai === 'sap_den' && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {item.conLaiChu}
                        </span>
                      )}
                      {item.trangThai === 'binh_thuong' && (
                        <span className="text-slate-500 dark:text-slate-400">
                          {item.conLaiChu}
                        </span>
                      )}
                      {item.trangThai === 'qua_han' && (
                        <span className="text-rose-500 dark:text-rose-400 font-bold">
                          Đã quá hạn
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
