import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  EyeOff,
  Flame,
  Hand,
  Lightbulb,
  ListOrdered,
  RefreshCw,
  Share2,
  Smartphone,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
} from 'lucide-react'
import { ChemText } from '../lib/chem-format'
import {
  guiLenhRemote,
  layThongTinPhien,
  layTrangThaiServer,
  type CauPhienToChieu,
  type LenhRemoteNhan,
  type PhienToChieu,
} from '../lib/to-chieu-dong-bo-remote'
import ModalDieuKhienTuXa from '../components/to-chieu/ModalDieuKhienTuXa'

export default function DieuKhienToChieuScreen() {
  const [maPhien, setMaPhien] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const q = new URLSearchParams(window.location.search)
    const m = q.get('remote') || q.get('ma') || ''
    if (m) return m
    const p = window.location.pathname
    if (p.startsWith('/remote/')) return p.slice('/remote/'.length).replace(/\/$/, '')
    return ''
  })

  const [maNhap, setMaNhap] = useState('')
  const [phien, setPhien] = useState<PhienToChieu | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [ketNoi, setKetNoi] = useState<'tot' | 'dang' | 'mat'>('dang')

  // Trạng thái cục bộ điều khiển
  const [dotHienTai, setDotHienTai] = useState(0)
  const [pha, setPha] = useState<'cho' | 'goi' | 'chua'>('cho')
  const [loiGiaiMo, setLoiGiaiMo] = useState(false)
  const [daCham, setDaCham] = useState<Record<string, boolean>>({})

  // Tab xem trên điện thoại: 'de' | 'giai' | 'ds'
  const [tabXem, setTabXem] = useState<'de' | 'giai' | 'ds'>('giai')
  const [moModalQr, setMoModalQr] = useState(false)
  const [thongBaoNhanh, setThongBaoNhanh] = useState('')

  const daNapRef = useRef(false)

  const bao = (chu: string) => {
    setThongBaoNhanh(chu)
    setTimeout(() => setThongBaoNhanh(''), 2200)
  }

  // Nạp phiên từ máy chủ
  const napPhien = useCallback(async (ma: string) => {
    if (!ma) return
    setDangTai(true)
    setLoi('')
    const res = await layThongTinPhien(ma)
    setDangTai(false)
    if (res.ok && res.phien) {
      setPhien(res.phien)
      setDotHienTai(res.phien.dotHienTai || 0)
      setPha(res.phien.pha || 'cho')
      setLoiGiaiMo(Boolean(res.phien.loiGiaiMo))
      setDaCham(res.phien.daCham || {})
      setKetNoi('tot')
    } else {
      setLoi(res.error || 'Không tìm thấy phiên chiếu. Vui lòng kiểm tra lại mã.')
      setKetNoi('mat')
    }
  }, [])

  useEffect(() => {
    if (maPhien && !daNapRef.current) {
      daNapRef.current = true
      void napPhien(maPhien)
    }
  }, [maPhien, napPhien])

  // Lắng nghe BroadcastChannel nếu cùng thiết bị (0ms)
  useEffect(() => {
    if (!maPhien) return
    let bc: BroadcastChannel | null = null
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('ddh-to-chieu-' + maPhien)
        bc.onmessage = (e) => {
          const d = e?.data
          if (d?.type === 'ddh-mc-trang-thai' && d.trangThai) {
            setKetNoi('tot')
            const tt = d.trangThai
            if (typeof tt.dot === 'number') setDotHienTai(tt.dot)
            if (tt.pha) setPha(tt.pha)
            if (typeof tt.lgMo === 'boolean') setLoiGiaiMo(tt.lgMo)
          }
        }
      }
    } catch {
      /* trình duyệt không hỗ trợ */
    }
    return () => {
      bc?.close()
    }
  }, [maPhien])

  // Polling trạng thái từ máy chủ mỗi 1.2s để đồng bộ khi máy tính thay đổi
  useEffect(() => {
    if (!maPhien) return
    let huy = false
    const poll = async () => {
      if (huy) return
      const r = await layTrangThaiServer(maPhien)
      if (!huy && r.ok) {
        setKetNoi('tot')
        if (typeof r.dotHienTai === 'number') setDotHienTai(r.dotHienTai)
        if (r.pha) setPha(r.pha as any)
        if (typeof r.loiGiaiMo === 'boolean') setLoiGiaiMo(r.loiGiaiMo)
        if (r.daCham) setDaCham((cu) => ({ ...cu, ...r.daCham }))
      }
      if (!huy) {
        hen = setTimeout(() => void poll(), 1200)
      }
    }
    let hen = setTimeout(() => void poll(), 1200)
    return () => {
      huy = true
      clearTimeout(hen)
    }
  }, [maPhien])

  // Gửi lệnh
  const guiLenh = async (loai: LenhRemoteNhan['loai'], thamSo?: any) => {
    if (!maPhien) return
    // Rung nhẹ phản hồi xúc giác trên điện thoại nếu có hỗ trợ
    try {
      if (navigator.vibrate) navigator.vibrate(30)
    } catch {
      /* bỏ qua */
    }

    // Cập nhật lạc quan trên giao diện điện thoại
    if (loai === 'LEN_BANG') {
      setPha('goi')
      bao('Đã gọi em lên bảng!')
    } else if (loai === 'BAT_LOI_GIAI') {
      const moMoi = thamSo && typeof thamSo.mo === 'boolean' ? thamSo.mo : !loiGiaiMo
      setLoiGiaiMo(moMoi)
      if (moMoi) setTabXem('giai')
      bao(moMoi ? 'Đã bật lời giải trên máy chiếu' : 'Đã ẩn lời giải trên máy chiếu')
    } else if (loai === 'CHUYEN_DOT' && typeof thamSo?.dot === 'number') {
      setDotHienTai(thamSo.dot)
      setLoiGiaiMo(false)
      setPha('cho')
      bao(`Chuyển sang đợt ${thamSo.dot + 1}`)
    } else if (loai === 'CHAM' && thamSo?.khoa) {
      setDaCham((cu) => ({ ...cu, [thamSo.khoa]: Boolean(thamSo.dat) }))
      bao(thamSo.dat ? 'Đã chấm ĐẠT (+1 sao) 🎉' : 'Đã chấm Chưa đạt')
    } else if (loai === 'BUOC_TIEP') {
      bao('Hiện bước tiếp / Cuộn')
    }

    await guiLenhRemote(maPhien, loai, thamSo)
  }

  const dsO: CauPhienToChieu[] = phien?.dsO ?? []
  const oHienTai: CauPhienToChieu | undefined = dsO[dotHienTai]
  const tongDot = dsO.length || phien?.tongSoDot || 1
  const khoaO = oHienTai ? (oHienTai.sbd && oHienTai.qid ? `${oHienTai.sbd}|${oHienTai.qid}` : oHienTai.qid || '') : ''
  const daGhiO = daCham[khoaO]

  // Màn hình nhập mã nếu chưa có mã phiên
  if (!maPhien || !phien) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--sans, system-ui)' }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center mb-4">
            <Smartphone size={26} />
          </div>
          <h1 className="text-xl font-black mb-1">Điều khiển Máy chiếu</h1>
          <p className="text-xs text-slate-500 mb-6">
            Nhập mã PIN hoặc mã phiên từ màn hình máy tính để kết nối điều khiển từ xa.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (maNhap.trim()) {
                setMaPhien(maNhap.trim())
                void napPhien(maNhap.trim())
              }
            }}
            className="flex flex-col gap-3"
          >
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mã PIN hoặc Mã phiên</label>
              <input
                type="text"
                value={maNhap}
                onChange={(e) => setMaNhap(e.target.value)}
                placeholder="VD: 123456 hoặc phien_..."
                className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                autoFocus
              />
            </div>

            {loi && <p className="text-xs text-rose-600 font-semibold">{loi}</p>}

            <button
              type="submit"
              disabled={dangTai || !maNhap.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-bold bg-sky-700 hover:bg-sky-800 text-white flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {dangTai ? <RefreshCw size={18} className="animate-spin" /> : 'Kết nối ngay'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-24 flex flex-col"
      style={{
        background: 'var(--mc-nen)',
        color: 'var(--mc-muc)',
        fontFamily: 'var(--sans, system-ui, sans-serif)',
      }}
    >
      {/* Toast thông báo nhanh */}
      {thongBaoNhanh && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-900/90 backdrop-blur shadow-lg flex items-center gap-2 animate-bounce"
        >
          <Sparkles size={14} className="text-amber-300" />
          <span>{thongBaoNhanh}</span>
        </div>
      )}

      {/* HEADER ĐIỀU KHIỂN */}
      <header
        className="sticky top-0 z-30 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              ketNoi === 'tot' ? 'bg-emerald-500 animate-pulse' : ketNoi === 'dang' ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            title={ketNoi === 'tot' ? 'Đã kết nối máy chiếu' : 'Đang kết nối'}
          />
          <div>
            <h1 className="text-sm font-black leading-tight line-clamp-1">{phien.tieuDe || 'Điều khiển tờ chiếu'}</h1>
            <p className="text-[11px] text-slate-500 font-semibold">
              Đợt {dotHienTai + 1} / {tongDot} · {pha === 'cho' ? 'Chờ gọi' : pha === 'goi' ? 'Mời lên bảng' : 'Đang chữa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMoModalQr(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Mở mã QR chia sẻ điều khiển"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => void napPhien(maPhien)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Làm mới"
          >
            <RefreshCw size={18} className={dangTai ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* KHỐI THÔNG TIN CÂU & HỌC SINH ĐANG CHIẾU */}
      <div className="p-3 sm:p-4 max-w-xl mx-auto w-full flex flex-col gap-3">
        <div
          className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
              CÂU {oHienTai?.soCau ?? dotHienTai + 1}
              {oHienTai?.phan ? ` · PHẦN ${oHienTai.phan}` : ''}
              {oHienTai?.tuLuan ? ' (Tự luận)' : ''}
            </span>
            <div className="flex items-center gap-1.5">
              {oHienTai?.sao ? (
                <span className="inline-flex items-center text-xs font-bold text-amber-500">
                  <Flame size={14} fill="currentColor" /> {oHienTai.sao}⭐
                </span>
              ) : null}
              {daGhiO !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    daGhiO ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {daGhiO ? '✓ Đạt' : '✗ Chưa đạt'}
                </span>
              )}
            </div>
          </div>

          {/* Tên học sinh */}
          <div className="flex items-center gap-3 py-1">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                pha === 'goi'
                  ? 'bg-amber-500 text-white animate-bounce'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              <UserCheck size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black truncate">
                {oHienTai?.hoTen || (oHienTai?.sbd ? `SBD ${oHienTai.sbd}` : 'Chưa phân công em')}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                {oHienTai?.lop ? <span>Lớp {oHienTai.lop}</span> : null}
                {oHienTai?.lanLenBang ? <span>Lần lên bảng thứ {oHienTai.lanLenBang}</span> : null}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ BỘ NÚT ĐIỀU KHIỂN CHÍNH (TO, DỄ BẤM BẰNG 1 TAY) ═══ */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* NÚT 1: LÊN BẢNG (Gọi tên, hào quang thần thú) */}
          <button
            type="button"
            onClick={() => void guiLenh('LEN_BANG')}
            className={`py-4 px-3 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 border ${
              pha === 'cho'
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400 shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Hand size={24} className={pha === 'cho' ? 'animate-bounce' : ''} />
            <span>{pha === 'cho' ? 'MỜI LÊN BẢNG' : 'ĐÃ GỌI LÊN BẢNG'}</span>
            <span className="text-[10px] font-normal opacity-80">Phím L trên máy chiếu</span>
          </button>

          {/* NÚT 2: HIỆN / ẨN LỜI GIẢI */}
          <button
            type="button"
            onClick={() => void guiLenh('BAT_LOI_GIAI')}
            className={`py-4 px-3 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 border ${
              loiGiaiMo
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-emerald-500/20'
                : 'bg-gradient-to-br from-sky-600 to-blue-700 text-white border-sky-500 shadow-sky-500/20'
            }`}
          >
            {loiGiaiMo ? <EyeOff size={24} /> : <Lightbulb size={24} className="text-amber-300" />}
            <span>{loiGiaiMo ? 'ẨN LỜI GIẢI' : 'HIỆN LỜI GIẢI'}</span>
            <span className="text-[10px] font-normal opacity-80">Đồng bộ máy chiếu theo thời gian thực</span>
          </button>
        </div>

        {/* HÀNG NÚT ĐIỀU HƯỚNG & BƯỚC TIẾP */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={dotHienTai <= 0}
            onClick={() => void guiLenh('CHUYEN_DOT', { dot: dotHienTai - 1 })}
            className="py-3 px-2 rounded-xl font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200 disabled:opacity-40 active:bg-slate-100"
          >
            <ArrowLeft size={16} /> Câu trước
          </button>

          <button
            type="button"
            onClick={() => void guiLenh('BUOC_TIEP')}
            className="py-3 px-2 rounded-xl font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1 text-indigo-700 dark:text-indigo-300 active:bg-indigo-100"
          >
            <Sparkles size={15} /> Bước tiếp (Space)
          </button>

          <button
            type="button"
            disabled={dotHienTai >= tongDot - 1}
            onClick={() => void guiLenh('CHUYEN_DOT', { dot: dotHienTai + 1 })}
            className="py-3 px-2 rounded-xl font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200 disabled:opacity-40 active:bg-slate-100"
          >
            Câu sau <ArrowRight size={16} />
          </button>
        </div>

        {/* HÀNG NÚT CHẤM ĐẠT / CHƯA ĐẠT */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => void guiLenh('CHAM', { khoa: khoaO, dat: true })}
            className="py-3 px-3 rounded-xl font-bold text-sm bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 active:scale-95"
          >
            <ThumbsUp size={18} /> ĐẠT (+1 sao)
          </button>

          <button
            type="button"
            onClick={() => void guiLenh('CHAM', { khoa: khoaO, dat: false })}
            className="py-3 px-3 rounded-xl font-bold text-sm bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2 active:scale-95"
          >
            <ThumbsDown size={18} /> Chưa đạt
          </button>
        </div>

        {/* THANH TAB XEM NỘI DUNG (CHO GIÁO VIÊN ĐỌC GIẢNG) */}
        <div className="mt-2 flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTabXem('giai')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
              tabXem === 'giai'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <Lightbulb size={16} /> Lời giải chi tiết
          </button>

          <button
            type="button"
            onClick={() => setTabXem('de')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
              tabXem === 'de'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <BookOpen size={16} /> Đề bài & Phương án
          </button>

          <button
            type="button"
            onClick={() => setTabXem('ds')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
              tabXem === 'ds'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <ListOrdered size={16} /> Danh sách câu ({tongDot})
          </button>
        </div>

        {/* NỘI DUNG THEO TAB */}
        {tabXem === 'giai' && (
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            {oHienTai?.dapAn && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                  Đáp án đúng:
                </span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-200">
                  <ChemText text={oHienTai.dapAn} />
                </span>
              </div>
            )}

            {oHienTai?.kienThucCotLoi && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                  Kiến thức cốt lõi:
                </span>
                <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                  <ChemText text={oHienTai.kienThucCotLoi} />
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Hướng dẫn giải:
              </span>
              <div
                className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-serif whitespace-pre-wrap"
              >
                {oHienTai?.loiGiai || oHienTai?.huongDan ? (
                  <ChemText text={oHienTai.loiGiai || oHienTai.huongDan || ''} />
                ) : (
                  <p className="text-slate-400 italic">Chưa có bản ghi lời giải chi tiết cho câu này.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tabXem === 'de' && (
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <div className="text-sm font-serif leading-relaxed">
              <ChemText text={oHienTai?.de || 'Đang tải đề…'} />
            </div>

            {oHienTai?.hinhAnh && oHienTai.hinhAnh.length > 0 && (
              <div className="flex flex-col gap-2 my-1">
                {oHienTai.hinhAnh.map((h: any, idx: number) => (
                  <img
                    key={idx}
                    src={typeof h === 'string' ? h : h?.src}
                    alt={typeof h === 'string' ? 'Hình minh hoạ' : h?.alt || 'Hình minh hoạ'}
                    className="max-h-48 object-contain rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            )}

            {oHienTai?.pa && oHienTai.pa.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {oHienTai.pa.map((paText: any, idx: number) => {
                  const chu = ['A', 'B', 'C', 'D'][idx]
                  const laDung = oHienTai.dapAn === chu || oHienTai.dapAn?.startsWith(chu + '.')
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs flex items-baseline gap-2 ${
                        laDung
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 font-bold text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-mono font-black text-sky-700 dark:text-sky-300">{chu}.</span>
                      <span className="flex-1 font-serif">
                        <ChemText text={paText} />
                      </span>
                      {laDung && <Check size={16} className="text-emerald-600 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tabXem === 'ds' && (
          <div className="rounded-2xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 max-h-96 overflow-y-auto">
            {dsO.map((o, idx) => {
              const laHienTai = idx === dotHienTai
              const khoa = o.sbd && o.qid ? `${o.sbd}|${o.qid}` : o.qid || ''
              const da = daCham[khoa]
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    void guiLenh('CHUYEN_DOT', { dot: idx })
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-colors ${
                    laHienTai
                      ? 'bg-sky-50 dark:bg-sky-950/70 border border-sky-400 font-bold text-sky-900 dark:text-sky-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-slate-500">#{idx + 1}</span>
                    <span className="truncate">Câu {o.soCau}: {o.hoTen || o.sbd || 'Chưa gán em'}</span>
                  </div>
                  {da !== undefined && (
                    <span className={`text-[10px] font-bold ${da ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {da ? '✓ Đạt' : '✗ Chưa'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL QR CODE CHIA SẺ NẾU CẦN */}
      {moModalQr && (
        <ModalDieuKhienTuXa
          maPhien={maPhien}
          maPin={phien.maPin}
          tieuDe={phien.tieuDe}
          onDong={() => setMoModalQr(false)}
        />
      )}
    </div>
  )
}
