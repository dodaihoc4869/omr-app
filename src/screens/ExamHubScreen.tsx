import { ClipboardList, GraduationCap, Users2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export default function ExamHubScreen() {
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Kiểm tra tại lớp</h1>
      <p className="text-sm text-slate-500">
        Mỗi học sinh nhận một đề với thứ tự câu/đáp án riêng (chống nhìn bài), có đồng hồ đếm giờ, nộp bài tự lưu lên
        Google Sheet của lớp để chấm.
      </p>

      <button
        onClick={() => setScreen('examsetup')}
        className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold p-4 text-left flex items-center gap-3"
      >
        <span className="shrink-0 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
          <GraduationCap size={22} />
        </span>
        <span>
          <div className="text-base">Giáo viên — Soạn đề &amp; mở ca kiểm tra</div>
          <div className="text-xs font-normal opacity-90 mt-1">Dán đề, chọn lớp, đặt thời gian, tạo mã ca cho học sinh</div>
        </span>
      </button>

      <button
        onClick={() => setScreen('exammonitor')}
        className="tap-target w-full rounded-xl bg-white dark:bg-slate-800 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold p-4 text-left flex items-center gap-3"
      >
        <span className="shrink-0 w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
          <ClipboardList size={22} />
        </span>
        <span>
          <div className="text-base">Giáo viên — Theo dõi &amp; chấm bài đã nộp</div>
          <div className="text-xs font-normal opacity-90 mt-1">Nhập mã ca để xem ai đã nộp, chấm điểm tự động</div>
        </span>
      </button>

      <button
        onClick={() => setScreen('examtake')}
        className="tap-target w-full rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold p-4 text-left flex items-center gap-3"
      >
        <span className="shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Users2 size={22} />
        </span>
        <span>
          <div className="text-base">Học sinh — Vào thi</div>
          <div className="text-xs font-normal opacity-90 mt-1">Nhập mã ca thầy cho + số báo danh</div>
        </span>
      </button>

      <div className="text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        Cần cấu hình 1 lần: dán code Apps Script (file docs/apps-script-kiem-tra.gs) vào script.google.com để có nơi
        nhận bài — làm ở màn "Soạn đề &amp; mở ca kiểm tra".
      </div>
    </div>
  )
}
