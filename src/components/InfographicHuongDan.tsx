import { useState } from 'react'
import { X, GraduationCap, Users, ShieldCheck, CheckCircle2, ArrowRight, Copy, Check } from 'lucide-react'
import LogoApp from './LogoApp'
import { nhoVaiDaDung } from '../lib/vai-tro'

interface InfographicHuongDanProps {
  onClose?: () => void
  vaiMacDinh?: 'hocsinh' | 'phuhuynh' | 'giaovien'
}

export default function InfographicHuongDan({ onClose, vaiMacDinh }: InfographicHuongDanProps) {
  const [saoChep, setSaoChep] = useState<string | null>(null)

  const saoChepLink = (vai: 'hocsinh' | 'phuhuynh' | 'giaovien') => {
    const origin = window.location.origin
    const url =
      vai === 'hocsinh'
        ? `${origin}/?vai=hocsinh`
        : vai === 'phuhuynh'
          ? `${origin}/?vai=phuhuynh`
          : `${origin}/?vai=gv`
    void navigator.clipboard?.writeText(url)
    setSaoChep(vai)
    setTimeout(() => setSaoChep(null), 2500)
  }

  const chuyenVai = (vai: 'hs' | 'ph' | 'gv') => {
    nhoVaiDaDung(vai)
    const param = vai === 'hs' ? 'hocsinh' : vai === 'ph' ? 'phuhuynh' : 'gv'
    window.location.href = `${window.location.origin}/?vai=${param}`
  }

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
                Phân biệt 3 App riêng biệt: Học Sinh · Phụ Huynh · Giáo Viên
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="relative z-10 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 cursor-pointer"
              title="Đóng hướng dẫn"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* 3 CỘT VAI TRÒ */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CỘT 1: HỌC SINH */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition ${
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
                    Truy cập: <b className="font-mono text-emerald-600">/?vai=hocsinh</b>
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
                    Làm <b>Bài gia đình giao</b> & Trợ lý AI
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => saoChepLink('hocsinh')}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-center border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {saoChep === 'hocsinh' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{saoChep === 'hocsinh' ? 'Đã chép link Học Sinh' : 'Sao chép link Học Sinh'}</span>
              </button>

              <button
                type="button"
                onClick={() => chuyenVai('hs')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Vào Cổng Học Sinh</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* CỘT 2: PHỤ HUYNH */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition ${
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
                    Truy cập: <b className="font-mono text-blue-600">/?vai=phuhuynh</b>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Đăng nhập cực dễ: <b>Chỉ cần gõ SBD của con</b>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>Xem báo cáo kết quả các ca kiểm tra của con</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Tạo <b>Bài gia đình giao</b> (tối đa 99 câu)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => saoChepLink('phuhuynh')}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-center border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {saoChep === 'phuhuynh' ? <Check size={14} className="text-blue-600" /> : <Copy size={14} />}
                <span>{saoChep === 'phuhuynh' ? 'Đã chép link Phụ Huynh' : 'Sao chép link Phụ Huynh'}</span>
              </button>

              <button
                type="button"
                onClick={() => chuyenVai('ph')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Vào Cổng Phụ Huynh</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* CỘT 3: GIÁO VIÊN */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition ${
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
                    Truy cập: <b className="font-mono text-indigo-600">/?vai=gv</b>
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

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => saoChepLink('giaovien')}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-center border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {saoChep === 'giaovien' ? <Check size={14} className="text-indigo-600" /> : <Copy size={14} />}
                <span>{saoChep === 'giaovien' ? 'Đã chép link Giáo Viên' : 'Sao chép link Giáo Viên'}</span>
              </button>

              <button
                type="button"
                onClick={() => chuyenVai('gv')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Vào App Giáo Viên</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
