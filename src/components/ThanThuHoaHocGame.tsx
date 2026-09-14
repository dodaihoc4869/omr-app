/**
 * THẦN THÚ HÓA HỌC (ALCHEMON) — Giao diện chính và hệ thống vòng lặp game.
 * Tích hợp 3 chế độ:
 * 1. Đảo Thần Thú (Nuôi, huấn luyện, nạp năng lượng từ BTVN/đề thi)
 * 2. Leo Tháp Tri Thức (Q&A chiến đấu với Boss vượt tầng)
 * 3. Đột Kích Lò Phản Ứng (Săn Boss khắc phục câu sai, thanh tẩy lỗi sai)
 * Tuân thủ tuyệt đối check:mau (chỉ dùng rgb / rgba / Tailwind tokens).
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import {
  Sparkles,
  Trophy,
  Swords,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Clock,
  LogIn,
} from 'lucide-react'
import {
  DANH_SACH_THAN_THU,
  KHOA_LUU_THAN_THU,
  layHoSoThanThuMacDinh,
  tinhLucChienPet,
  type HoSoThanThuLuu,
  type CapTienHoa,
} from '../game/than-thu-hoa-hoc/he-thong-pet'
import { veThanThuCanvas } from '../game/than-thu-hoa-hoc/ve-than-thu'
import { AmThanhPet } from '../game/than-thu-hoa-hoc/am-thanh-pet'

interface Props {
  auth: { sbd: string; hoTen: string; lop?: string }
  dsLichSu: any[]
  dsBtvn: any[]
  onDong: () => void
  onChuyenSangKhacPhuc: () => void
  onChuyenSangBtvn: () => void
  onChuyenSangVaoThi: () => void
}

type TabGame = 'dao_thu' | 'leo_thap' | 'san_cau_sai' | 'xep_hang'

export default function ThanThuHoaHocGame({
  auth,
  dsLichSu,
  dsBtvn,
  onDong,
  onChuyenSangKhacPhuc,
  onChuyenSangBtvn,
  onChuyenSangVaoThi,
}: Props) {
  const [tabGame, setTabGame] = useState<TabGame>('dao_thu')
  const [hoSo, setHoSo] = useState<HoSoThanThuLuu>(() => {
    try {
      const raw = localStorage.getItem(`${KHOA_LUU_THAN_THU}_${auth.sbd}`)
      return raw ? JSON.parse(raw) : layHoSoThanThuMacDinh()
    } catch {
      return layHoSoThanThuMacDinh()
    }
  })
  const [batAm, setBatAm] = useState(true)
  const amThanhRef = useRef<AmThanhPet | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Khởi tạo audio context
  useEffect(() => {
    amThanhRef.current = new AmThanhPet()
    amThanhRef.current.datBat(batAm)
  }, [batAm])

  // Lưu hồ sơ thần thú khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(`${KHOA_LUU_THAN_THU}_${auth.sbd}`, JSON.stringify(hoSo))
    } catch {}
  }, [hoSo, auth.sbd])

  // Tính toán chỉ số học tập để buff sức mạnh cho Pet
  const chiSoHocTap = useMemo(() => {
    let tongDiem = 0
    let soCaDiem = 0
    for (const ca of dsLichSu) {
      if (typeof ca.tong === 'number' && !Number.isNaN(ca.tong)) {
        tongDiem += ca.tong
        soCaDiem++
      }
    }
    const diemTb = soCaDiem > 0 ? tongDiem / soCaDiem : 7.0

    let btvnDaNop = 0
    for (const bt of dsBtvn) {
      if (bt.trangThai === 'da_nop' || bt.daNop) btvnDaNop++
    }
    const tyLeBtvn = dsBtvn.length > 0 ? btvnDaNop / dsBtvn.length : 0.8

    return { diemTb, tyLeBtvn, btvnDaNop, tongBtvn: dsBtvn.length, soCa: dsLichSu.length }
  }, [dsLichSu, dsBtvn])

  const infoPet = DANH_SACH_THAN_THU[hoSo.idThanhThuChon] || DANH_SACH_THAN_THU['hoa_long']!
  const chiSoPet = useMemo(() => {
    return tinhLucChienPet({
      capDo: hoSo.capDo,
      capTienHoa: hoSo.capTienHoa,
      diemTrungBinh: chiSoHocTap.diemTb,
      tyLeBtvn: chiSoHocTap.tyLeBtvn,
    })
  }, [hoSo.capDo, hoSo.capTienHoa, chiSoHocTap])

  // Vòng lặp vẽ thú bằng Canvas
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    let animId: number
    let startTime = performance.now()

    const render = (now: number) => {
      const t = (now - startTime) / 1000
      const w = cvs.width
      const h = cvs.height
      ctx.clearRect(0, 0, w, h)

      veThanThuCanvas(ctx, w / 2, h / 2 + 10, Math.min(w, h) * 0.32, infoPet, hoSo.capTienHoa, {
        thoiGian: t,
        dangDanh: false,
        dangBiDanh: false,
        dangTungNo: false,
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [infoPet, hoSo.capTienHoa])

  // Xử lý nạp năng lượng / EXP cho Pet
  const choAnNangLuong = () => {
    amThanhRef.current?.moKhoa()
    amThanhRef.current?.dungCauHoi()

    setHoSo((prev) => {
      const expMoi = prev.exp + 35
      if (expMoi >= prev.expToiDa) {
        amThanhRef.current?.tienHoa()
        const capDoMoi = prev.capDo + 1
        const capTienHoaMoi: CapTienHoa = capDoMoi >= 10 ? 3 : capDoMoi >= 5 ? 2 : 1
        return {
          ...prev,
          capDo: capDoMoi,
          exp: expMoi - prev.expToiDa,
          expToiDa: Math.round(prev.expToiDa * 1.3),
          capTienHoa: capTienHoaMoi,
          danhHieuHienTai:
            capTienHoaMoi === 3
              ? `Thần Thú Tối Thượng Lv.${capDoMoi}`
              : capTienHoaMoi === 2
              ? `Chiến Thú Thiếu Niên Lv.${capDoMoi}`
              : `Linh Thú Tập Sự Lv.${capDoMoi}`,
        }
      }
      return { ...prev, exp: expMoi }
    })
  }

  // Đổi linh thú khác
  const doiThanhThu = (idMoi: string) => {
    amThanhRef.current?.moKhoa()
    amThanhRef.current?.tanCong()
    setHoSo((prev) => ({ ...prev, idThanhThuChon: idMoi }))
  }

  // State cho mini-game LEO THÁP TRI THỨC
  const [dangLeoThap, setDangLeoThap] = useState(false)
  const [tangHienTai, setTangHienTai] = useState(1)
  const [mauBoss, setMauBoss] = useState(100)
  const [mauPetCombat, setMauPetCombat] = useState(100)
  const [thongBaoChienDau, setThongBaoChienDau] = useState('')
  const [cauHoiHienTai, setCauHoiHienTai] = useState<{
    cau: string
    phuongAn: string[]
    dung: number
    giaiThich: string
  } | null>(null)
  const [thoiGianConLaiCau, setThoiGianConLaiCau] = useState(15)

  // Danh sách câu hỏi hóa học mẫu phong phú cho leo tháp
  const KHO_CAU_THAP = useMemo(
    () => [
      {
        cau: 'Kim loại nào sau đây có thể phản ứng với nước ở nhiệt độ thường tạo dung dịch kiềm?',
        phuongAn: ['Fe (Sắt)', 'Cu (Đồng)', 'Na (Natri)', 'Al (Nhôm)'],
        dung: 2,
        giaiThich: '2Na + 2H₂O → 2NaOH + H₂↑ (Phản ứng mãnh liệt tỏa nhiệt lớn).',
      },
      {
        cau: 'Khí nào sau đây có màu vàng lục, mùi hắc và có tính oxi hóa rất mạnh?',
        phuongAn: ['O₂ (Oxi)', 'Cl₂ (Clo)', 'N₂ (Nitơ)', 'CO₂ (Cacbon đioxit)'],
        dung: 1,
        giaiThich: 'Khí Clo Cl₂ có màu vàng lục, nặng hơn không khí và oxi hóa mạnh.',
      },
      {
        cau: 'Chất nào tạo kết tủa trắng không tan trong axit mạnh khi tác dụng với Ba(OH)₂?',
        phuongAn: ['NaCl', 'KNO₃', 'H₂SO₄', 'HCl'],
        dung: 2,
        giaiThich: 'Ba(OH)₂ + H₂SO₄ → BaSO₄↓ + 2H₂O (BaSO₄ kết tủa trắng bền vững).',
      },
      {
        cau: 'Phản ứng nhiệt nhôm là phản ứng khử oxit kim loại bằng kim loại nào?',
        phuongAn: ['Fe (Sắt)', 'Mg (Magie)', 'Al (Nhôm)', 'Cu (Đồng)'],
        dung: 2,
        giaiThich: 'Nhôm (Al) dùng để khử Fe₂O₃ hoặc Cr₂O₃ tạo kim loại tự do ở nhiệt độ cao.',
      },
      {
        cau: 'Dung dịch làm quỳ tím hóa đỏ (pH < 7) là dung dịch của chất nào?',
        phuongAn: ['NaOH', 'HCl', 'Ba(OH)₂', 'NaCl'],
        dung: 1,
        giaiThich: 'Dung dịch Axit clohiđric HCl làm quỳ tím chuyển sang màu đỏ.',
      },
    ],
    []
  )

  const batDauLeoThap = () => {
    amThanhRef.current?.moKhoa()
    amThanhRef.current?.tanCong()
    setDangLeoThap(true)
    setTangHienTai(hoSo.tangThapCaoNhat)
    setMauBoss(100)
    setMauPetCombat(100)
    setThongBaoChienDau(`Bắt đầu khiêu chiến Tầng ${hoSo.tangThapCaoNhat}!`)
    raCauHoiMoi()
  }

  const raCauHoiMoi = useCallback(() => {
    const r = KHOA_CAU_THAP_INDEX(KHO_CAU_THAP.length)
    setCauHoiHienTai(KHO_CAU_THAP[r] || KHO_CAU_THAP[0]!)
    setThoiGianConLaiCau(15)
  }, [KHO_CAU_THAP])

  // Đếm ngược câu hỏi
  useEffect(() => {
    if (!dangLeoThap || !cauHoiHienTai) return
    const timer = setInterval(() => {
      setThoiGianConLaiCau((prev) => {
        if (prev <= 1) {
          // Hết giờ coi như trả lời sai
          xuLyTraLoi(-1)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dangLeoThap, cauHoiHienTai])

  const xuLyTraLoi = (idxChon: number) => {
    if (!cauHoiHienTai) return

    if (idxChon === cauHoiHienTai.dung) {
      amThanhRef.current?.dungCauHoi()
      amThanhRef.current?.kichNo()
      const satThuong = 45
      const mauBossMoi = Math.max(0, mauBoss - satThuong)
      setMauBoss(mauBossMoi)
      setThongBaoChienDau(`⚡ CHÍNH XÁC! Thần Thú tung tuyệt kỹ giáng ${satThuong}% sát thương lên Boss!`)

      if (mauBossMoi <= 0) {
        // Thắng tầng
        amThanhRef.current?.thangTran()
        setThongBaoChienDau(`🎉 CHIẾN THẮNG TẦNG ${tangHienTai}! Nhận được +50 EXP và Đá Nguyên Tố!`)
        setHoSo((prev) => ({
          ...prev,
          tangThapCaoNhat: Math.max(prev.tangThapCaoNhat, tangHienTai + 1),
          exp: prev.exp + 50,
        }))
        setTimeout(() => {
          setTangHienTai((prev) => prev + 1)
          setMauBoss(100)
          raCauHoiMoi()
        }, 1800)
      } else {
        setTimeout(raCauHoiMoi, 1200)
      }
    } else {
      amThanhRef.current?.saiCauHoi()
      amThanhRef.current?.trungDon()
      const satThuongBoss = 30
      const mauPetMoi = Math.max(0, mauPetCombat - satThuongBoss)
      setMauPetCombat(mauPetMoi)
      setThongBaoChienDau(`❌ SAI RỒI! Boss phản kích gây mất ${satThuongBoss}% máu! ${cauHoiHienTai.giaiThich}`)

      if (mauPetMoi <= 0) {
        setThongBaoChienDau('💀 Thần Thú đã kiệt sức! Hãy nạp thêm năng lượng từ BTVN để phục thù.')
        setCauHoiHienTai(null)
      } else {
        setTimeout(raCauHoiMoi, 1500)
      }
    }
  }

  return (
    <div className="space-y-5 animate-google-fade pb-10">
      {/* Thanh tiêu đề Game */}
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 dark:from-amber-950/30 dark:via-purple-950/30 dark:to-blue-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  THẦN THÚ HÓA HỌC
                </h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  ALCHEMON
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Nuôi thú, thức tỉnh nguyên tố & leo tháp tri thức cùng kết quả học tập của em
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setBatAm(!batAm)}
              title={batAm ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              {batAm ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onDong}
              className="btn-google-outlined text-xs py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Thoát Game</span>
            </button>
          </div>
        </div>

        {/* 4 Tabs Chế Độ Game */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
          <button
            onClick={() => { setTabGame('dao_thu'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'dao_thu'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Đảo Thần Thú</span>
          </button>

          <button
            onClick={() => { setTabGame('leo_thap'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'leo_thap'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Leo Tháp Tri Thức</span>
          </button>

          <button
            onClick={() => { setTabGame('san_cau_sai'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'san_cau_sai'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Săn Boss Câu Sai</span>
          </button>

          <button
            onClick={() => { setTabGame('xep_hang'); setDangLeoThap(false); }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tabGame === 'xep_hang'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Võ Đài Xếp Hạng</span>
          </button>
        </div>
      </div>

      {/* NỘI DUNG TAB 1: ĐẢO THẦN THÚ */}
      {tabGame === 'dao_thu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cột trái: Khung hiển thị thần thú tương tác Canvas */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
            {/* Header thú cưng */}
            <div className="w-full flex items-center justify-between z-10">
              <div className="text-left">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  Giai đoạn: Cấp {hoSo.capTienHoa} ({hoSo.capTienHoa === 3 ? 'Tối Thượng' : hoSo.capTienHoa === 2 ? 'Thiếu Niên' : 'Sơ Sinh'})
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {infoPet.ten}
                </h2>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {infoPet.danhHieu}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-amber-500 font-mono">
                  CP: {chiSoPet.cp.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">Lực chiến tổng</div>
              </div>
            </div>

            {/* Canvas động vẽ thần thú */}
            <div className="my-2 relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={280}
                height={260}
                className="max-w-full drop-shadow-lg"
              />
            </div>

            {/* Thanh kinh nghiệm EXP & Nút Nạp Năng Lượng */}
            <div className="w-full space-y-3 z-10">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  Cấp độ: <strong className="text-emerald-600 text-sm">Lv.{hoSo.capDo}</strong>
                </span>
                <span className="font-mono text-slate-500">
                  EXP: {hoSo.exp} / {hoSo.expToiDa}
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (hoSo.exp / hoSo.expToiDa) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={choAnNangLuong}
                  className="py-2.5 px-5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nạp Tinh Thể Não Lực (+35 EXP)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Chỉ số sức mạnh & Khung tăng lực chiến từ học tập */}
          <div className="space-y-4">
            {/* Thẻ chỉ số Combat */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Chỉ Số Chiến Đấu</span>
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/60">
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Sinh Lực</div>
                  <div className="text-base font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                    {chiSoPet.mau}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/60">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Công Kích</div>
                  <div className="text-base font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                    {chiSoPet.cong}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/60">
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Giáp Bền</div>
                  <div className="text-base font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                    {chiSoPet.giap}
                  </div>
                </div>
              </div>

              {/* Tác động của điểm học tập */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-xs space-y-2">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>Buff Sức Mạnh Từ Học Tập</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    +{Math.round(((chiSoHocTap.diemTb / 10) * 0.4 + chiSoHocTap.tyLeBtvn * 0.3) * 100)}% Lực
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  • Điểm trung bình ca thi: <strong>{chiSoHocTap.diemTb.toFixed(2)}đ</strong>
                  <br />
                  • Tỷ lệ nộp BTVN đầy đủ: <strong>{Math.round(chiSoHocTap.tyLeBtvn * 100)}%</strong> ({chiSoHocTap.btvnDaNop}/{chiSoHocTap.tongBtvn} bài)
                </div>
              </div>
            </div>

            {/* Chọn đổi linh thú 4 hệ */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Chọn Thần Thú Đồng Hành
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(DANH_SACH_THAN_THU).map((pet) => {
                  const isSelect = hoSo.idThanhThuChon === pet.id
                  return (
                    <button
                      key={pet.id}
                      onClick={() => doiThanhThu(pet.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelect
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="text-xs font-bold line-clamp-1">{pet.ten}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{pet.he}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 2: LEO THÁP TRI THỨC */}
      {tabGame === 'leo_thap' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm">
          {!dangLeoThap ? (
            <div className="text-center py-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center shadow-inner">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tháp Tri Thức 100 Tầng
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mỗi tầng canh giữ bởi Quái Vật Hóa Học. Trả lời đúng trong 15s để kích hoạt chiêu nộ hạ gục Boss!
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                Kỷ lục tầng hiện tại của em: <strong className="text-purple-600 text-sm">Tầng {hoSo.tangThapCaoNhat}</strong>
              </div>

              <button
                onClick={batDauLeoThap}
                className="w-full py-3.5 px-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Swords className="w-5 h-5" />
                <span>Khiêu Chiến Tầng {hoSo.tangThapCaoNhat}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Đấu trường Boss vs Thần Thú */}
              <div className="grid grid-cols-2 gap-4 items-center">
                {/* Pet của em */}
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-left">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {infoPet.ten} (Lv.{hoSo.capDo})
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${mauPetCombat}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{mauPetCombat}% HP</div>
                </div>

                {/* Boss tầng */}
                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-right">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    Trùm Tầng {tangHienTai}: Quái Hóa Hắc Ám
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${mauBoss}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{mauBoss}% HP</div>
                </div>
              </div>

              {/* Thông báo diễn biến trận đấu */}
              {thongBaoChienDau && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-center text-xs font-bold text-amber-800 dark:text-amber-300 animate-pulse">
                  {thongBaoChienDau}
                </div>
              )}

              {/* Khung câu hỏi Q&A chiến đấu */}
              {cauHoiHienTai && mauPetCombat > 0 && mauBoss > 0 && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-600 dark:text-purple-400">
                      ⚡ CÂU HỎI KÍCH HOẠT TUYỆT KỸ
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 font-mono">
                      <Clock className="w-4 h-4" />
                      <span>{thoiGianConLaiCau}s</span>
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {cauHoiHienTai.cau}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {cauHoiHienTai.phuongAn.map((pa, idx) => (
                      <button
                        key={idx}
                        onClick={() => xuLyTraLoi(idx)}
                        className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left text-xs font-medium transition cursor-pointer"
                      >
                        <strong className="text-purple-600 mr-2">{String.fromCharCode(65 + idx)}.</strong>
                        <span>{pa}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDangLeoThap(false)}
                  className="btn-google-outlined text-xs py-2 px-4 rounded-full cursor-pointer"
                >
                  Rút lui khỏi Tháp
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NỘI DUNG TAB 3: SĂN BOSS CÂU SAI (Đột kích lò phản ứng) */}
      {tabGame === 'san_cau_sai' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <span>Đột Kích Lò Phản Ứng: Săn Boss Câu Sai</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các câu làm sai trong ca thi được hóa thân thành Quái Dị Hóa giam giữ Đá Tiến Hóa. Hãy thanh tẩy chúng!
              </p>
            </div>

            <button
              onClick={onChuyenSangKhacPhuc}
              className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mở Kho Câu Khắc Phục</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="text-xs font-bold text-rose-800 dark:text-rose-300">Quái Thể Câu Sai Hiện Tại</div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
                {dsLichSu.reduce((acc, cur) => acc + (cur.soCauSai || 0), 0)} Câu
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Thanh tẩy toàn bộ để nhận danh hiệu <strong>Thợ Săn Dị Hóa Cấp S</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300">Phần Thưởng Thanh Tẩy</div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                +100 EXP / Câu
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Mỗi câu làm lại đúng giúp tăng lực chiến và tiến hóa hình dáng Thần Thú.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Trạng Thái Thần Thú</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                Sẵn Sàng Chiến
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Lực chiến CP hiện tại: <strong>{chiSoPet.cp.toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 text-center sm:text-left">
              Cần luyện thêm đề thi hoặc làm bài tập về nhà để tăng cường giáp bền trước khi đi săn Boss?
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onChuyenSangVaoThi}
                className="btn-google-primary !bg-purple-600 hover:!bg-purple-700 text-white text-xs py-1.5 px-3 rounded-full flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Vào phòng thi</span>
              </button>
              <button
                onClick={onChuyenSangBtvn}
                className="btn-google-outlined text-xs py-1.5 px-3 rounded-full cursor-pointer"
              >
                Bài Tập Về Nhà →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 4: VÕ ĐÀI XẾP HẠNG (PVP Auto-Battler) */}
      {tabGame === 'xep_hang' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Bảng Xếp Hạng Thần Thú Cả Lớp</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Xếp hạng dựa trên Lực chiến CP Thần Thú (gắn với Điểm số thi & Tỷ lệ nộp bài của em)
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Top 1 */}
            <div className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-sm">
                  1
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{auth.hoTen} (Em)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Bậc Thầy Hóa Học
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Thần thú: {infoPet.ten} (Lv.{hoSo.capDo}) • SBD: {auth.sbd}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-amber-600 text-sm">
                CP: {chiSoPet.cp.toLocaleString()}
              </div>
            </div>

            {/* Top 2 bot */}
            <div className="py-3.5 flex items-center justify-between opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-sm flex items-center justify-center">
                  2
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Chiến Binh Nhiệt Nhôm
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Thần thú: Hỏa Long (Lv.8)
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-slate-600 text-sm">
                CP: {(chiSoPet.cp * 0.88).toFixed(0)}
              </div>
            </div>

            {/* Top 3 bot */}
            <div className="py-3.5 flex items-center justify-between opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center">
                  3
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Thần Đồng Halogen
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Thần thú: Phong Lôi Điểu (Lv.7)
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-slate-600 text-sm">
                CP: {(chiSoPet.cp * 0.76).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KHOA_CAU_THAP_INDEX(max: number): number {
  return Math.floor(Math.random() * max)
}
