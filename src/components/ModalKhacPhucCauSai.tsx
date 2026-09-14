// MODAL KHẮC PHỤC CÂU SAI — CHUẨN HOÁ CHO CẢ 3 APP
// 1. Làm lại các câu sai
// 2. Luyện thêm dạng câu sai (chia theo tỷ lệ tối đa của từng câu sai, lẻ làm tròn lên)
// 3. Lựa chọn luyện câu (2 sao, 1 sao, 0 sao, lý thuyết, bài tập tính toán — thanh trượt tối đa 100 câu)
// Tuyệt đối không dùng mã màu #hex trần trong file .tsx.

import { useEffect, useMemo, useState } from 'react'
import {
  X,
  RefreshCw,
  Layers,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Calculator,
  Star,
  Info,
  Eye,
  Heart,
} from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { loadExamSources } from '../lib/exam-db'
import {
  taoDeLamLaiCauSai,
  rutLuyenThemDangCauSai,
  rutLuyenTheoBoLoc,
  phanTichTyLeDang,
  phanTichBoLocCau,
  type CauSaiDauVao,
  type BoLocCauLuyen,
} from '../lib/thuat-toan-rut-cau-sai'
import KhungXemPhieu from './KhungXemPhieu'

export interface ModalKhacPhucCauSaiProps {
  isOpen: boolean
  onClose: () => void
  dsCauSai: CauSaiDauVao[]
  hoTen: string
  sbd: string
  tieuDeCa?: string
  onTaoPhieuXong?: (html: string) => void
  onGiaoBaiChoCon?: (dsCau: any[], tieuDe: string) => void
}

export default function ModalKhacPhucCauSai({
  isOpen,
  onClose,
  dsCauSai,
  hoTen,
  sbd,
  tieuDeCa,
  onTaoPhieuXong,
  onGiaoBaiChoCon,
}: ModalKhacPhucCauSaiProps) {
  const [cheDo, setCheDo] = useState<1 | 2 | 3>(2)
  const [khoDe, setKhoDe] = useState<TeacherExamSource[]>([])
  const [, setDangTaiKho] = useState(false)
  const [dangTao, setDangTao] = useState(false)

  // Tuỳ chọn Chế độ 2: Luyện thêm dạng câu sai
  const [soCauCheDo2, setSoCauCheDo2] = useState<number>(20)

  // Tuỳ chọn Chế độ 3: Luyện câu theo bộ lọc
  const [boLocSao, setBoLocSao] = useState<BoLocCauLuyen['sao']>('moi')
  const [boLocDang, setBoLocDang] = useState<BoLocCauLuyen['dang']>('tat_ca')
  const [soCauCheDo3, setSoCauCheDo3] = useState<number>(20)

  // HTML phiếu bài tập đã tạo để xem tại chỗ
  const [phieuHtml, setPhieuHtml] = useState<string>('')

  // Tải kho đề khi mở modal
  useEffect(() => {
    if (!isOpen) return
    let active = true
    setDangTaiKho(true)
    loadExamSources()
      .then((sources) => {
        if (active) setKhoDe(sources)
      })
      .catch(() => {
        if (active) setKhoDe([])
      })
      .finally(() => {
        if (active) setDangTaiKho(false)
      })
    return () => {
      active = false
    }
  }, [isOpen])

  // Danh sách các ca thi trích xuất từ câu sai
  const dsCaThi = useMemo(() => {
    const map = new Map<string, { maCa: string; tenCa: string; soCauSai: number }>()
    for (const c of dsCauSai) {
      const ma = c.maCa || 'mac_dinh'
      const ten = c.tenCa || (c.maCa ? `Ca thi #${c.maCa}` : 'Bài kiểm tra')
      const hien = map.get(ma)
      if (hien) {
        hien.soCauSai += 1
      } else {
        map.set(ma, { maCa: ma, tenCa: ten, soCauSai: 1 })
      }
    }
    return Array.from(map.values())
  }, [dsCauSai])

  // Set các ca thi được tick chọn trong Chế độ 2 (mặc định chọn tất cả ca)
  const [caChonCheDo2, setCaChonCheDo2] = useState<Set<string>>(() => new Set(dsCauSai.map((c) => c.maCa || 'mac_dinh')))

  // Đồng bộ khi dsCauSai thay đổi
  useEffect(() => {
    setCaChonCheDo2(new Set(dsCauSai.map((c) => c.maCa || 'mac_dinh')))
  }, [dsCauSai])

  // Danh sách câu sai được lọc theo các ca thi đã tick ở Chế độ 2
  const dsCauSaiCheDo2 = useMemo(() => {
    return dsCauSai.filter((c) => caChonCheDo2.has(c.maCa || 'mac_dinh'))
  }, [dsCauSai, caChonCheDo2])

  // Phân tích tỷ lệ cho Chế độ 2 theo danh sách câu sai của các ca đã tick
  const { thongKe: thongKeCheDo2, tongToiDa: tongToiDaCheDo2, tinhSoCauMoiDang: tinhCheDo2 } = useMemo(() => {
    return phanTichTyLeDang(dsCauSaiCheDo2, khoDe)
  }, [dsCauSaiCheDo2, khoDe])

  // Cập nhật số câu mặc định cho Chế độ 2 khi phân tích xong
  useEffect(() => {
    if (tongToiDaCheDo2 > 0) {
      setSoCauCheDo2((prev) => Math.min(tongToiDaCheDo2, Math.max(1, prev > 0 ? prev : Math.min(tongToiDaCheDo2, dsCauSaiCheDo2.length * 2))))
    } else {
      setSoCauCheDo2(0)
    }
  }, [tongToiDaCheDo2, dsCauSaiCheDo2.length])

  // Phân bổ hiện tại của Chế độ 2
  const phanBoCheDo2 = useMemo(() => {
    return tinhCheDo2(soCauCheDo2)
  }, [soCauCheDo2, tinhCheDo2])

  // Phân tích cho Chế độ 3
  const boLocHienTai: BoLocCauLuyen = useMemo(
    () => ({ sao: boLocSao, dang: boLocDang }),
    [boLocSao, boLocDang]
  )
  const { tongToiDa: tongToiDaCheDo3 } = useMemo(() => {
    return phanTichBoLocCau(dsCauSai, khoDe, boLocHienTai)
  }, [dsCauSai, khoDe, boLocHienTai])

  // Cập nhật số câu mặc định cho Chế độ 3 khi bộ lọc thay đổi
  useEffect(() => {
    if (tongToiDaCheDo3 > 0) {
      setSoCauCheDo3(Math.min(tongToiDaCheDo3, 20))
    }
  }, [tongToiDaCheDo3])

  if (!isOpen) return null

  // Xử lý tạo đề
  const handleTaoDe = (laGiaoBai: boolean = false) => {
    setDangTao(true)
    try {
      let ketQuaHtml = ''
      let dsCauKetQua: any[] = []
      let tieuDeBai = ''
      const options = { hoTen, sbd, tieuDe: tieuDeCa }
      if (cheDo === 1) {
        // Chế độ 1: Làm lại các câu sai
        const res = taoDeLamLaiCauSai(dsCauSai, options)
        ketQuaHtml = res.html
        dsCauKetQua = res.dsCau
        tieuDeBai = `Làm lại ${dsCauKetQua.length} câu sai`
      } else if (cheDo === 2) {
        // Chế độ 2: Luyện thêm dạng câu sai theo các ca đã chọn
        const res = rutLuyenThemDangCauSai(dsCauSaiCheDo2, khoDe, soCauCheDo2, options)
        ketQuaHtml = res.html
        dsCauKetQua = res.dsCau
        tieuDeBai = `Luyện thêm dạng câu sai (${dsCauKetQua.length} câu)`
      } else {
        // Chế độ 3: Luyện câu theo bộ lọc
        const res = rutLuyenTheoBoLoc(dsCauSai, khoDe, boLocHienTai, soCauCheDo3, options)
        ketQuaHtml = res.html
        dsCauKetQua = res.dsCau
        const tenSao = boLocSao === 'sao_2' ? '2 sao' : boLocSao === 'sao_1' ? '1 sao' : boLocSao === 'sao_0' ? '0 sao' : 'Mọi sao'
        const tenDang = boLocDang === 'ly_thuyet' ? 'Lý thuyết' : boLocDang === 'bai_tap' ? 'Bài tập' : 'Mọi thể loại'
        tieuDeBai = `Luyện câu [${tenSao} · ${tenDang}] (${dsCauKetQua.length} câu)`
      }

      if (laGiaoBai && onGiaoBaiChoCon) {
        onGiaoBaiChoCon(dsCauKetQua, tieuDeBai)
        onClose()
        return
      }

      if (onTaoPhieuXong) {
        onTaoPhieuXong(ketQuaHtml)
      } else {
        setPhieuHtml(ketQuaHtml)
      }
    } finally {
      setDangTao(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
          style={{ background: 'var(--the, rgb(255, 255, 255))', color: 'var(--muc, rgb(15, 23, 42))' }}
        >
          {/* Header phong cách Google Material 3 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{ background: 'rgba(26, 115, 232, 0.1)', color: 'var(--gg-xanh, rgb(26, 115, 232))' }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--serif)' }}>
                  Khắc phục câu sai
                </h2>
                <div className="text-xs text-slate-500 font-medium">
                  {tieuDeCa ? `${tieuDeCa} · ` : ''}{dsCauSai.length} câu làm sai · Lựa chọn phương pháp khắc phục tối ưu
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dải 4 màu Google M3 */}
          <div className="h-1 w-full grid grid-cols-4 shrink-0">
            <div style={{ background: 'var(--gg-xanh, rgb(26, 115, 232))' }} />
            <div style={{ background: 'var(--gg-do, rgb(234, 67, 53))' }} />
            <div style={{ background: 'var(--gg-vang, rgb(251, 188, 4))' }} />
            <div style={{ background: 'var(--gg-xanh-la, rgb(52, 168, 83))' }} />
          </div>

          {/* Nội dung Modal */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* LỰA CHỌN 1, 2, 3 */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chọn hình thức luyện tập
              </label>

              {/* THẺ 1: LÀM LẠI CÁC CÂU SAI */}
              <div
                onClick={() => setCheDo(1)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                  cheDo === 1
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    cheDo === 1 ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'
                  }`}
                >
                  {cheDo === 1 ? <CheckCircle2 className="w-4 h-4" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    1. Làm lại các câu sai ({dsCauSai.length} câu)
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Hiển thị lại toàn bộ các câu sai và lời giải chuẩn để học sinh tự làm lại và nhận diện lỗ hổng kiến thức.
                  </p>
                </div>
              </div>

              {/* THẺ 2: LUYỆN THÊM DẠNG CÂU SAI */}
              <div
                onClick={() => setCheDo(2)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                  cheDo === 2
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    cheDo === 2 ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'
                  }`}
                >
                  {cheDo === 2 ? <CheckCircle2 className="w-4 h-4" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    2. Luyện thêm dạng câu sai (Tỷ lệ tối đa: {tongToiDaCheDo2} câu)
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Rút thêm các câu có cùng nhãn dán với từng câu sai chia theo đúng tỷ lệ tối đa (nếu lẻ làm tròn lên).
                  </p>
                </div>
              </div>

              {/* THẺ 3: LỰA CHỌN LUYỆN CÂU THEO BỘ LỌC */}
              <div
                onClick={() => setCheDo(3)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                  cheDo === 3
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    cheDo === 3 ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'
                  }`}
                >
                  {cheDo === 3 ? <CheckCircle2 className="w-4 h-4" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                    3. Lựa chọn luyện câu (2 sao, 1 sao, 0 sao, lý thuyết, tính toán)
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Rút đúng nhãn dán kết hợp bộ lọc độ khó và thể loại câu hỏi, thanh trượt tối đa 100 câu.
                  </p>
                </div>
              </div>
            </div>

            {/* PHẦN ĐIỀU KHIỂN CHI TIẾT THEO TỪNG CHẾ ĐỘ */}
            {cheDo === 2 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
                {/* Hộp chọn ca thi của học sinh trong box có ô tick */}
                {dsCaThi.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ca thi của học sinh ({caChonCheDo2.size}/{dsCaThi.length} ca · {dsCauSaiCheDo2.length} câu sai)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCaChonCheDo2(new Set(dsCaThi.map((c) => c.maCa)))}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setCaChonCheDo2(new Set())}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {dsCaThi.map((ca) => {
                        const daTick = caChonCheDo2.has(ca.maCa)
                        return (
                          <div
                            key={ca.maCa}
                            onClick={() => {
                              setCaChonCheDo2((prev) => {
                                const moi = new Set(prev)
                                if (moi.has(ca.maCa)) moi.delete(ca.maCa)
                                else moi.add(ca.maCa)
                                return moi
                              })
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                              daTick
                                ? 'bg-blue-50/40 border-blue-200 text-slate-800'
                                : 'bg-slate-50/50 border-slate-200/60 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={daTick}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer pointer-events-none"
                              />
                              <span className="text-xs font-semibold truncate">
                                {ca.tenCa}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                                daTick
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {ca.soCauSai} câu sai
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Số câu rút luyện tập:
                  </span>
                  <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                    {soCauCheDo2} / {tongToiDaCheDo2} câu
                  </span>
                </div>

                {dsCauSaiCheDo2.length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    Vui lòng tick chọn ít nhất một ca thi ở danh sách trên để tính câu khắc phục.
                  </div>
                ) : tongToiDaCheDo2 > 0 ? (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={1}
                      max={tongToiDaCheDo2}
                      value={soCauCheDo2}
                      onChange={(e) => setSoCauCheDo2(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span>1 câu</span>
                      <span>{Math.round(tongToiDaCheDo2 / 2)} câu</span>
                      <span>Tối đa {tongToiDaCheDo2} câu</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    Kho đề hiện tại chưa có câu hỏi tương tự cùng nhãn dán. Học sinh sẽ làm lại các câu sai gốc.
                  </div>
                )}

                {/* Bảng phân bổ theo từng câu sai */}
                {thongKeCheDo2.length > 0 && tongToiDaCheDo2 > 0 && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="text-xs font-bold text-slate-500 mb-2">
                      Phân bổ câu rút theo tỷ lệ của từng câu sai (làm tròn lên):
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {thongKeCheDo2.map((t, idx) => {
                        const soRut = phanBoCheDo2.get(t.qid) ?? 0
                        return (
                          <div
                            key={t.qid || idx}
                            className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white border border-slate-100 text-slate-600"
                          >
                            <span className="truncate max-w-[280px]">
                              <b>Câu {t.soCau} ({t.phan})</b>: {t.tenDang || t.nhanDan}
                            </span>
                            <span className="shrink-0 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              +{soRut} câu (tối đa {t.soUngVienToiDa})
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {cheDo === 3 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
                {/* Bộ lọc mức sao */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    Lọc theo mức độ câu (Sao):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        ['moi', 'Mọi mức sao'],
                        ['sao_2', '2 sao (Khó)'],
                        ['sao_1', '1 sao (Bản chất)'],
                        ['sao_0', '0 sao (Cơ bản)'],
                      ] as const
                    ).map(([s, label]) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBoLocSao(s)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          boLocSao === s
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bộ lọc thể loại */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    Lọc theo thể loại:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['tat_ca', 'Mọi thể loại', <Layers key="a" className="w-3.5 h-3.5" />],
                        ['ly_thuyet', 'Lý thuyết', <BookOpen key="b" className="w-3.5 h-3.5" />],
                        ['bai_tap', 'Bài tập tính toán', <Calculator key="c" className="w-3.5 h-3.5" />],
                      ] as const
                    ).map(([d, label, icon]) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setBoLocDang(d)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                          boLocDang === d
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {icon}
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thanh trượt số câu cho Chế độ 3 (tối đa 100 câu) */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">
                      Số câu rút (tối đa 100 câu):
                    </span>
                    <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                      {soCauCheDo3} / {tongToiDaCheDo3} câu
                    </span>
                  </div>

                  {tongToiDaCheDo3 > 0 ? (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={1}
                        max={tongToiDaCheDo3}
                        value={soCauCheDo3}
                        onChange={(e) => setSoCauCheDo3(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>1 câu</span>
                        <span>{Math.round(tongToiDaCheDo3 / 2)} câu</span>
                        <span>Tối đa {tongToiDaCheDo3} câu</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      Không tìm thấy câu nào trong kho khớp bộ lọc này cùng nhãn dán.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer nút hành động */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="tap-target px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Huỷ
            </button>

            <div className="flex items-center gap-2">
              {onGiaoBaiChoCon && (
                <button
                  type="button"
                  onClick={() => handleTaoDe(false)}
                  disabled={dangTao || (cheDo === 2 && tongToiDaCheDo2 === 0 && dsCauSai.length === 0)}
                  className="tap-target px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Xem trước đề dạng HTML"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem trước đề</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleTaoDe(Boolean(onGiaoBaiChoCon))}
                disabled={dangTao || (cheDo === 2 && tongToiDaCheDo2 === 0 && dsCauSai.length === 0)}
                className={`tap-target px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  onGiaoBaiChoCon
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {dangTao ? (
                  <span>Đang xử lý…</span>
                ) : onGiaoBaiChoCon ? (
                  <>
                    <Heart className="w-4 h-4 text-white" />
                    <span>Giao bài cho con (Hạn 2h)</span>
                  </>
                ) : (
                  <>
                    <span>Bắt đầu làm bài</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hiển thị bài tập trong app nếu không có callback cha */}
      {phieuHtml && (
        <KhungXemPhieu
          html={phieuHtml}
          ten="Đề luyện tập khắc phục câu sai"
          dong={() => {
            setPhieuHtml('')
            onClose()
          }}
        />
      )}
    </>
  )
}
