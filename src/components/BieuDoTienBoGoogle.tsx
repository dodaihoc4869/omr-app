import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Award, Calendar, Trophy, ChevronRight, CheckCircle2 } from 'lucide-react'
import { chuoiTienBo, moc, nhanXetTienBo, trungBinhCongDon } from '../lib/tien-bo'
import type { HoSoEm } from '../lib/exam-api'
import { classify } from '../engine/score'
import { dungM3 } from './m3'

interface BieuDoTienBoGoogleProps {
  ca: HoSoEm['ca']
  diemDe?: Record<string, number> | null
  onChonCa?: (maCa: string) => void
  /** HỌC SINH / PHỤ HUYNH (chuẩn từ ngữ 21/09): KHÔNG in nhãn xếp loại ("Yếu", "Khá"…) cạnh điểm và KHÔNG in "Hạng x/sĩ số" — chỉ số điểm và so với lần trước của chính em. Màn thầy giữ nguyên (mặc định false). */
  anNhanNangLuc?: boolean
}

function ngayVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function soVN(x: number, le = 2): string {
  return x.toFixed(le).replace('.', ',')
}

export default function BieuDoTienBoGoogle({ ca, diemDe, onChonCa, anNhanNangLuc = false }: BieuDoTienBoGoogleProps) {
  const ds = useMemo(() => chuoiTienBo(ca, diemDe), [ca, diemDe])
  const cong = useMemo(() => trungBinhCongDon(ds.map((d) => d.diem)), [ds])
  const nx = useMemo(() => nhanXetTienBo(ds), [ds])
  const { cao, thap } = useMemo(() => moc(ds), [ds])
  const [chonIdx, setChonIdx] = useState<number | null>(null)

  const n = ds.length
  const diemTb = cong.length > 0 ? cong[cong.length - 1] : 0

  if (n === 0) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Chưa có ca kiểm tra nào</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Em chưa có ca kiểm tra nào đã nộp hoặc được chấm điểm trong hệ thống.
        </p>
      </div>
    )
  }

  // Kích thước SVG
  const W = 600
  const H = 220
  const LE_T = 36
  const LE_P = 24
  const LE_TREN = 24
  const LE_DUOI = 36

  const x = (i: number) => (n === 1 ? (W + LE_T - LE_P) / 2 : LE_T + ((W - LE_T - LE_P) * i) / (n - 1))
  const y = (v: number) => LE_TREN + (H - LE_TREN - LE_DUOI) * (1 - Math.max(0, Math.min(10, v)) / 10)

  const duong = ds.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.diem).toFixed(1)}`).join(' ')
  const duongTb = cong.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const vung = n > 1 ? `${duong} L${x(n - 1).toFixed(1)},${H - LE_DUOI} L${x(0).toFixed(1)},${H - LE_DUOI} Z` : ''

  const selectedCa = chonIdx !== null ? ds[chonIdx] : ds[n - 1]

  return (
    <div className="space-y-4">
      {/* THẺ TỔNG QUAN GOOGLE M3 VỚI DẢI 4 MÀU */}
      <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        {/* Dải 4 màu thương hiệu Google */}
        <div className={`${dungM3() ? 'm3-an ' : ''}flex h-1.5 w-full rounded-full overflow-hidden`}>
          <div className="flex-1 bg-blue-500" />
          <div className="flex-1 bg-red-500" />
          <div className="flex-1 bg-amber-500" />
          <div className="flex-1 bg-emerald-500" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Mức độ tiến bộ qua các ca kiểm tra
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phân tích và theo dõi xu hướng điểm số trực quan của tất cả {n} ca kiểm tra
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                nx.chieu === 'len'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : nx.chieu === 'xuong'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {nx.chieu === 'len' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : nx.chieu === 'xuong' ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              <span>{nx.chieu === 'len' ? 'Đang tiến bộ đi lên' : nx.chieu === 'xuong' ? 'Điểm có xu hướng giảm' : 'Giữ phong độ ổn định'}</span>
            </span>
          </div>
        </div>

        {/* 4 CHIP THÔNG SỐ CHÍNH */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đã làm</div>
              <div className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{n} ca</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cao nhất</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                {cao ? soVN(cao.diem) : '--'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Thấp nhất</div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 leading-tight">
                {thap ? soVN(thap.diem) : '--'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Trung bình chung</div>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400 leading-tight">
                {soVN(diemTb)}
              </div>
            </div>
          </div>
        </div>

        {/* BIỂU ĐỒ SVG GOOGLE STYLE */}
        <div className="pt-2">
          <div className="w-full overflow-x-auto pb-1">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto min-w-[340px] select-none"
              role="img"
              aria-label={`Điểm qua ${n} bài, ${nx.cau}`}
            >
              <defs>
                <linearGradient id="gradientGoogleVung" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--m3-primary, rgb(26, 115, 232))" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--m3-primary, rgb(26, 115, 232))" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Lưới ngang và nhãn trục Y */}
              {[0, 2.5, 5, 7.5, 10].map((v) => (
                <g key={v}>
                  <line
                    x1={LE_T}
                    y1={y(v)}
                    x2={W - LE_P}
                    y2={y(v)}
                    stroke="var(--m3-surface-container-high, rgba(203, 213, 225, 0.4))"
                    strokeWidth={v === 5 ? '1.5' : '1'}
                    strokeDasharray={v === 5 ? '3 3' : 'none'}
                  />
                  <text
                    x={LE_T - 8}
                    y={y(v) + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill="var(--m3-on-surface-variant, rgb(148, 163, 184))"
                    fontFamily="sans-serif"
                    fontWeight="500"
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* Vùng bóng đổ mờ Google Blue */}
              {vung && <path d={vung} fill="url(#gradientGoogleVung)" />}

              {/* Đường trung bình cộng dồn — nét đứt màu cam hổ phách */}
              {n > 1 && (
                <path
                  d={duongTb}
                  fill="none"
                  stroke="var(--m3-tren-canh-bao, rgb(217, 119, 6))"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}

              {/* Đường điểm số chính Google Blue */}
              {n > 1 && (
                <path
                  d={duong}
                  fill="none"
                  stroke="var(--m3-primary, rgb(26, 115, 232))"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Các điểm tròn trên biểu đồ */}
              {ds.map((d, i) => {
                const laChon = chonIdx === i
                const cx = x(i)
                const cy = y(d.diem)
                return (
                  <g key={d.maCa + i} onClick={() => setChonIdx(i)} className="cursor-pointer">
                    {/* Vùng chạm rộng */}
                    <circle cx={cx} cy={cy} r={16} fill="transparent" />

                    {/* Vòng ngoài nếu được chọn */}
                    {laChon && (
                      <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--m3-primary, rgb(26, 115, 232))" strokeWidth="2" strokeOpacity="0.4" />
                    )}

                    {/* Chấm tròn điểm */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={laChon ? 6.5 : 5}
                      fill={laChon ? 'var(--m3-primary, rgb(26, 115, 232))' : 'var(--m3-surface-container-lowest, white)'}
                      stroke="var(--m3-primary, rgb(26, 115, 232))"
                      strokeWidth="2.5"
                    />

                    {/* Nhãn điểm số phía trên chấm */}
                    <text
                      x={cx}
                      y={cy - 10}
                      textAnchor="middle"
                      fontSize={laChon ? '12' : '10'}
                      fontWeight="bold"
                      fill={laChon ? 'var(--m3-primary, rgb(26, 115, 232))' : 'var(--m3-on-surface, rgb(51, 65, 85))'}
                      fontFamily="sans-serif"
                    >
                      {soVN(d.diem, 1)}
                    </text>

                    {/* Nhãn ngày thi trục X */}
                    {(i === 0 || i === n - 1 || n <= 6 || laChon) && (
                      <text
                        x={cx}
                        y={H - 12}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill={laChon ? 'var(--m3-primary, rgb(26, 115, 232))' : 'var(--m3-on-surface-variant, rgb(148, 163, 184))'}
                        fontWeight={laChon ? 'bold' : 'normal'}
                        fontFamily="sans-serif"
                      >
                        {d.ngay ? ngayVN(d.ngay).slice(0, 5) : `Ca ${i + 1}`}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* CHÚ THÍCH ĐƯỜNG VẼ */}
          <div className="flex items-center justify-center flex-wrap gap-5 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-1 rounded-full bg-blue-600 inline-block" /> Điểm từng ca kiểm tra
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-0 border-t-2 border-dashed border-amber-600 inline-block" /> Xu hướng trung bình
            </span>
          </div>
        </div>

        {/* THÔNG TIN CHI TIẾT CA THI ĐANG CHỌN */}
        {selectedCa && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-blue-950 dark:text-blue-200">
                {selectedCa.tenCa || `Ca ${selectedCa.maCa}`}
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                Ngày thi: {selectedCa.ngay ? ngayVN(selectedCa.ngay) : 'Đã nộp'}
                {!anNhanNangLuc && selectedCa.hang && selectedCa.siSo ? ` · Hạng ${selectedCa.hang}/${selectedCa.siSo}` : ''}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 leading-none">
                {soVN(selectedCa.diem)}
              </div>
              {!anNhanNangLuc && (
                <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                  {classify(selectedCa.diem)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NHẬN XÉT TRUYỀN ĐỘNG LỰC */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {nx.cau}
        </div>
      </div>

      {/* DANH SÁCH TẤT CẢ CÁC CA THI */}
      <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          Lịch sử điểm tất cả các ca kiểm tra ({n})
        </h3>

        <div className="space-y-2">
          {ds.map((c, idx) => {
            const laCaoNhat = cao && c.maCa === cao.maCa
            const diemTruoc = idx > 0 ? ds[idx - 1].diem : null
            const delta = diemTruoc !== null ? Number((c.diem - diemTruoc).toFixed(2)) : null

            return (
              <div
                key={c.maCa + idx}
                onClick={() => {
                  setChonIdx(idx)
                  if (onChonCa) onChonCa(c.maCa)
                }}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                  chonIdx === idx
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                      {c.tenCa || `Ca ${c.maCa}`}
                    </span>
                    {laCaoNhat && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        Kỷ lục
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{c.ngay ? ngayVN(c.ngay) : 'Đã nộp'}</span>
                    {!anNhanNangLuc && c.hang && c.siSo && (
                      <>
                        <span>·</span>
                        <span>Hạng {c.hang}/{c.siSo}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {delta !== null && (
                    <span
                      className={`text-xs font-bold ${
                        delta > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : delta < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {delta > 0 ? `+${soVN(delta)}` : soVN(delta)}
                    </span>
                  )}
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900 dark:text-white leading-none">
                      {soVN(c.diem)}
                    </div>
                    {!anNhanNangLuc && (
                      <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        {classify(c.diem)}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
