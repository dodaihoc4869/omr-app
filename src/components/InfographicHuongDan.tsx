import { X, GraduationCap, Users, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'
import LogoApp from './LogoApp'

interface InfographicHuongDanProps {
  onClose?: () => void
  vaiMacDinh?: 'hocsinh' | 'phuhuynh' | 'giaovien'
}

export default function InfographicHuongDan({ onClose, vaiMacDinh }: InfographicHuongDanProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto animate-google-fade">
      <div
        className="w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto"
        style={{ background: 'var(--the)', color: 'var(--muc)' }}
      >
        {/* HEADER */}
        <div
          className="p-6 sm:p-8 flex items-center justify-between relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--gg-xanh), var(--gg-luc))',
            color: 'white',
          }}
        >
          <div className="relative z-10 flex items-center gap-4">
            <LogoApp size={56} />
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                HƯỚNG DẪN ĐĂNG NHẬP
              </h2>
              <p className="text-xs sm:text-sm font-medium opacity-90 mt-1">
                Hệ thống Khảo thí & Luyện thi Hoá Thầy Đỗ Đại Học
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="relative z-10 p-2 rounded-full hover:bg-white/20 transition tap-target"
            >
              <X size={22} />
            </button>
          )}
        </div>

        {/* BODY: 3 CỘT CHO 3 ĐỐI TƯỢNG */}
        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CỘT 1: HỌC SINH */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              vaiMacDinh === 'hocsinh'
                ? 'ring-2 ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold">
                <GraduationCap size={26} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Dành Cho
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 mb-2">
                Học Sinh
              </h3>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Truy cập: <b className="font-mono text-emerald-600">/hoc-sinh</b> hoặc mở link ca thi{' '}
                    <b className="font-mono">/t/mã-ca</b>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Đăng nhập bằng <b>Số báo danh (SBD)</b> + Mật khẩu học sinh
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Vào thi, xem điểm, nộp BTVN</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Làm <b>Bài của Mom giao</b> (hạn 2 tiếng) & hỏi bài Trợ lý AI
                  </span>
                </div>
              </div>
            </div>

            <a
              href="/hoc-sinh"
              className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition"
            >
              <span>Vào Cổng Học Sinh</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* CỘT 2: PHỤ HUYNH */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              vaiMacDinh === 'phuhuynh'
                ? 'ring-2 ring-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold">
                <Users size={26} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Dành Cho
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 mb-2">
                Phụ Huynh
              </h3>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Truy cập: <b className="font-mono text-blue-600">/phu-huynh</b>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Đăng nhập cực dễ: <b>Chỉ cần gõ Số báo danh (SBD) của con</b>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>Xem báo cáo kết quả các ca thi của con</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Thanh trượt tạo <b>Bài của Mom giao</b> (tối đa 99 câu)
                  </span>
                </div>
              </div>
            </div>

            <a
              href="/phu-huynh"
              className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition"
            >
              <span>Vào Cổng Phụ Huynh</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* CỘT 3: GIÁO VIÊN */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              vaiMacDinh === 'giaovien'
                ? 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold">
                <ShieldCheck size={26} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Dành Cho
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 mb-2">
                Giáo Viên
              </h3>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    Truy cập: <b className="font-mono text-indigo-600">/gv</b>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>Đăng nhập bảo mật bằng <b>Mã bí mật của Thầy</b></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>Mở ca kiểm tra, chấm phiếu OMR tự động</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>Kho đề thi, phân công, hộp thư & Trợ lý AI</span>
                </div>
              </div>
            </div>

            <a
              href="/gv"
              className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition"
            >
              <span>Vào App Giáo Viên</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
