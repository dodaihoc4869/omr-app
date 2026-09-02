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

const FIELD_LABEL: Record<keyof ColumnMapping, string> = {
  sbd: 'Số báo danh',
  hoTen: 'Họ tên',
  sdt: 'SĐT phụ huynh',
  lop: 'Lớp',
}

export default function ClassListScreen() {
  const classList = useAppStore((s) => s.classList)
  const setClassList = useAppStore((s) => s.setClassList)
  const showToast = useAppStore((s) => s.showToast)

  const [mode, setMode] = useState<'gviz' | 'tsv'>('gviz')
  const [sheetUrl, setSheetUrl] = useState('')
  const [tsvText, setTsvText] = useState('')
  const [rows, setRows] = useState<string[][] | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({ sbd: null, hoTen: null, sdt: null, lop: null })
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
  }

  const header = rows?.[0] ?? []

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Kết nối danh sách lớp</h1>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
        Link Google Sheet ở chế độ "ai có link đều xem" là công khai (dù không ai đoán được đường link) — chỉ dùng
        khi thầy chấp nhận điều đó. Nếu cần kín hoàn toàn, dùng "Dán tay TSV" ở dưới, không cần bật chia sẻ.
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('gviz')}
          className={`tap-target flex-1 rounded-lg font-semibold ${mode === 'gviz' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600'}`}
        >
          Link Google Sheet
        </button>
        <button
          onClick={() => setMode('tsv')}
          className={`tap-target flex-1 rounded-lg font-semibold ${mode === 'tsv' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600'}`}
        >
          Dán tay TSV
        </button>
      </div>

      {mode === 'gviz' ? (
        <div className="space-y-2">
          <input
            className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
            placeholder="Dán link Google Sheet…"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />
          <button onClick={handleFetch} disabled={loading || !sheetUrl} className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50">
            {loading ? 'Đang tải…' : 'Đồng bộ'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full h-32 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-sm font-mono"
            placeholder="Dán vùng dữ liệu copy trực tiếp từ Google Sheet (kèm hàng tiêu đề)"
            value={tsvText}
            onChange={(e) => setTsvText(e.target.value)}
          />
          <button onClick={handleParseTsv} className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold">
            Đọc dữ liệu đã dán
          </button>
        </div>
      )}

      {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>}

      {rows && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Ánh xạ cột ({rows.length - 1} dòng dữ liệu)</h2>
          {(Object.keys(FIELD_LABEL) as (keyof ColumnMapping)[]).map((field) => (
            <div key={field} className="flex items-center justify-between gap-2">
              <span className="text-sm">{FIELD_LABEL[field]}</span>
              <select
                className="tap-target border border-slate-300 dark:border-slate-600 rounded-lg px-2 bg-white dark:bg-slate-900"
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
          <button onClick={handleConfirmSave} className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold">
            Lưu danh sách lớp
          </button>
        </div>
      )}

      <div className="text-sm text-slate-500">Đang lưu: {classList.length} học sinh (cache ngoại tuyến).</div>
    </div>
  )
}
