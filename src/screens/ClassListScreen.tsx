import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import {
  autoMatchColumns,
  fetchClassListFromSheet,
  parseTsv,
  rowsToClassList,
  type ColumnMapping,
} from '../lib/sheet-gviz'
import { loadClassListMeta, saveClassList } from '../lib/classlist-db'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { napDanhSachLop } from '../lib/exam-api'
import { GraduationCap, RefreshCw, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react'

const FIELD_LABEL: Record<keyof ColumnMapping, string> = {
  sbd: 'Số báo danh',
  hoTen: 'Họ tên',
  sdt: 'SĐT phụ huynh',
  lop: 'Lớp',
  namSinh: 'Năm sinh',
}

export default function ClassListScreen() {
  const classList = useAppStore((s) => s.classList)
  const setClassList = useAppStore((s) => s.setClassList)
  const showToast = useAppStore((s) => s.showToast)

  const [mode, setMode] = useState<'gviz' | 'tsv'>('gviz')
  const [sheetUrl, setSheetUrl] = useState('')
  const [tsvText, setTsvText] = useState('')
  const [rows, setRows] = useState<string[][] | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({ sbd: null, hoTen: null, sdt: null, lop: null, namSinh: null })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClassListMeta().then((meta) => {
      if (meta?.sheetUrl) setSheetUrl(meta.sheetUrl)
    })
  }, [])

  const handleFetch = async () => {
    setError(null)
    setLoading(true)
    try {
      const { rows: fetchedRows, mapping: auto } = await fetchClassListFromSheet(sheetUrl)
      setRows(fetchedRows)
      setMapping(auto)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  const handleParseTsv = () => {
    setError(null)
    const parsed = parseTsv(tsvText)
    if (parsed.length < 2) {
      setError('Cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu')
      return
    }
    setRows(parsed)
    setMapping(autoMatchColumns(parsed[0]))
  }

  const handleConfirmSave = async () => {
    if (!rows) return
    const list = rowsToClassList(rows, mapping)
    setClassList(list)
    await saveClassList(list, {
      sheetUrl: mode === 'gviz' ? sheetUrl : '(dán tay TSV)',
      mapping,
      syncedAt: new Date().toISOString(),
      mode,
    })
    showToast(`Đã lưu ${list.length} học sinh vào danh sách lớp`, 'success')

    // ĐẨY LUÔN LÊN MÁY CHỦ. Em vào thi chỉ gõ số báo danh; không có bản sao này
    // thì máy chủ không biết tên em, danh sách học sinh chỉ toàn số. Đẩy ngầm,
    // hỏng thì báo một dòng chứ không chặn việc lưu ở máy.
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !mat.trim()) {
        showToast('Đã lưu ở máy. Chưa có địa chỉ máy chủ hoặc mã bí mật nên chưa đẩy lên máy chủ.', 'warn')
        return
      }
      const kq = await napDanhSachLop(
        url.trim(),
        mat.trim(),
        list.map((r) => ({ sbd: r.sbd, hoTen: r.hoTen, namSinh: r.namSinh, lop: r.lop })),
      )
      const thieuNam = list.filter((r) => !r.namSinh).length
      // Máy chủ mới nhận danh sách hay không phải hiện ra — xem ghi chú ở
      // `KetQuaNapDanhSach.mayChuMoi`.
      const loiMay =
        kq.mayChuMoi === 'hong' ? '. MÁY CHỦ MỚI CHƯA NHẬN — bấm đồng bộ lại' : kq.mayChuMoi === 'ok' ? '. Máy chủ mới đã nhận' : ''
      showToast(
        `Đã đẩy ${kq.soDong} em lên máy chủ — em vào thi là tự có tên${thieuNam ? `. ${thieuNam} em chưa có năm sinh, ca lọc theo khối sẽ chặn các em đó` : ''}${loiMay}`,
        kq.mayChuMoi === 'hong' ? 'error' : thieuNam ? 'warn' : 'success',
      )
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không đẩy được danh sách lên máy chủ', 'error')
    }
  }

  const header = rows?.[0] ?? []

  return (
    <div className="gv-page min-h-screen pb-24 px-3 sm:px-4 pt-4 space-y-4">
      {/* HEADER GOOGLE STYLE */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/70 text-[color:var(--m3-primary)] border border-blue-200 dark:border-blue-800 shadow-2xs">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Kết nối danh sách lớp
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đồng bộ danh sách học sinh theo lớp từ Google Sheet hoặc tệp bảng tính
            </p>
          </div>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[color:var(--m3-primary)] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs">
          Đang lưu: {classList.length} học sinh
        </div>
      </header>

      {/* THÔNG BÁO / HƯỚNG DẪN KIỂU GOOGLE AMBER */}
      <div className="rounded-2xl border-2 border-amber-200/90 dark:border-amber-800/70 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-sm leading-relaxed space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
          <Sparkles size={16} className="text-[color:var(--m3-tren-canh-bao)]" />
          <span>Lưu ý kết nối Google Sheet</span>
        </div>
        <p>
          Link Google Sheet ở chế độ "ai có link đều xem" là công khai (dù không ai đoán được đường link) — chỉ dùng khi thầy chấp nhận điều đó. Nếu cần kín hoàn toàn, dùng "Dán tay TSV" ở dưới, không cần bật chia sẻ.
        </p>
      </div>

      {/* CHUYỂN CHẾ ĐỘ GOOGLE PILLS */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('gviz')}
          className={`tap-target flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
            mode === 'gviz'
              ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <FileSpreadsheet size={16} />
          <span>Link Google Sheet</span>
        </button>
        <button
          onClick={() => setMode('tsv')}
          className={`tap-target flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
            mode === 'tsv'
              ? 'bg-[color:var(--m3-primary)] text-[color:var(--m3-on-primary)] shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <span>Dán tay TSV</span>
        </button>
      </div>

      {/* KHUNG NHẬP DỮ LIỆU */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs space-y-3">
        {mode === 'gviz' ? (
          <div className="space-y-3">
            <input
              className="tap-target w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              placeholder="Dán link Google Sheet…"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !sheetUrl}
              className="tap-target w-full min-h-[46px] rounded-xl bg-[color:var(--m3-primary)] hover:opacity-90 text-[color:var(--m3-on-primary)] font-bold text-sm shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Đang tải…' : 'Đồng bộ'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              placeholder="Dán vùng dữ liệu copy trực tiếp từ Google Sheet (kèm hàng tiêu đề)"
              value={tsvText}
              onChange={(e) => setTsvText(e.target.value)}
            />
            <button
              onClick={handleParseTsv}
              className="tap-target w-full min-h-[46px] rounded-xl bg-[color:var(--m3-primary)] hover:opacity-90 text-[color:var(--m3-on-primary)] font-bold text-sm shadow-xs transition cursor-pointer"
            >
              Đọc dữ liệu đã dán
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800 p-3 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-200 shadow-2xs">
          {error}
        </div>
      )}

      {/* ÁNH XẠ CỘT */}
      {rows && (
        <div className="rounded-2xl border-2 border-blue-200/90 dark:border-blue-800/70 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900/60">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[color:var(--m3-primary)]" />
              <span>Ánh xạ cột ({rows.length - 1} dòng dữ liệu)</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {(Object.keys(FIELD_LABEL) as (keyof ColumnMapping)[]).map((field) => (
              <div
                key={field}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {FIELD_LABEL[field]}
                </span>
                <select
                  className="tap-target border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mapping[field] ?? ''}
                  onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || null })}
                >
                  <option value="">— không có —</option>
                  {header.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirmSave}
            className="tap-target w-full min-h-[48px] rounded-xl bg-[color:var(--m3-primary)] hover:opacity-90 text-[color:var(--m3-on-primary)] font-bold text-sm shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            Lưu danh sách lớp
          </button>
        </div>
      )}
    </div>
  )
}
