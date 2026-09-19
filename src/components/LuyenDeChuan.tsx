import { useEffect, useRef, useState } from 'react'
import TheCau from './TheCau'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Clock3, FileText, ChevronLeft, Award, ChevronDown } from 'lucide-react'
import { layCauHinhMayChu, xongNapDiaChi } from '../lib/may-chu-moi'
import type { PublicExamBank, TeacherExamSource } from '../data/examContent'
import ModalXacNhanNop from './ModalXacNhanNop'
import './m3'
import './m3/luyen-khac-phuc.css'

type Paper = {
  id: string
  deadline: number
  serverNow: number
  status: string
  answers: Record<string, string>
  bank: PublicExamBank
  result?: { score: number }
  solutions?: TeacherExamSource[]
}

type History = { id: string; createdAt: number; status: string; score: number | null }

export default function LuyenDeChuan({ sbd, token }: { sbd: string; token?: string }) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paper, setPaper] = useState<Paper | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<History[]>([])
  const [seconds, setSeconds] = useState(0)
  const [saved, setSaved] = useState('')
  const [hienXacNhanNop, setHienXacNhanNop] = useState(false)
  const [moDanhSach, setMoDanhSach] = useState(false)

  const saveQueue = useRef(Promise.resolve())
  const answerRef = useRef(answers)
  const paperRef = useRef(paper)
  const offset = useRef(0)
  const submitting = useRef(false)
  const alive = useRef(true)

  answerRef.current = answers
  paperRef.current = paper

  async function api(action: string, data: Record<string, unknown> = {}) {
    if (!token) throw new Error('Em đăng xuất rồi đăng nhập lại để mở luyện đề.')
    await xongNapDiaChi()
    const url = String((await layCauHinhMayChu()).URL || '').replace(/\/+$/, '')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    try {
      const r = await fetch(`${url}/luyen-de/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, token }),
        signal: controller.signal,
      })
      const json = await r.json()
      if (!r.ok || !json.ok) throw new Error(json.error || 'Không kết nối được máy chủ luyện đề.')
      return json
    } finally {
      clearTimeout(timeout)
    }
  }

  async function refresh() {
    try {
      const r = await api('history')
      if (alive.current) {
        const items = (r.items || []) as History[]
        setHistory(items)
        if (items.some((h) => h.status === 'active')) {
          setMoDanhSach(true)
        }
      }
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : 'Không tải được lịch sử.')
    }
  }

  useEffect(() => {
    alive.current = true
    void refresh()
    return () => {
      alive.current = false
    }
  }, [sbd, token])

  function accept(p: Paper) {
    offset.current = p.serverNow - Date.now()
    setPaper(p)
    let local: Record<string, string> = {}
    try {
      local = JSON.parse(localStorage.getItem(`ddh.luyen2026.${sbd}.${p.id}`) || '{}')
    } catch {}
    setAnswers(p.status === 'active' ? { ...p.answers, ...local } : p.answers)
    setSeconds(Math.max(0, Math.ceil((p.deadline - p.serverNow) / 1000)))
  }

  async function open(id?: string) {
    setBusy(true)
    setError('')
    try {
      accept(await api(id ? 'open' : 'start', id ? { id } : { daHocXong: ready }))
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không mở được đề.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(_auto = false) {
    const p = paperRef.current
    if (!p || p.status !== 'active' || submitting.current) return
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      accept(await api('submit', { id: p.id, answers: answerRef.current }))
      setSaved('Đã nộp bài')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa nộp được bài. Em thử lại.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!paper || paper.status !== 'active') return
    const tick = () => {
      const n = Math.max(0, Math.ceil((paper.deadline - Date.now() - offset.current) / 1000))
      setSeconds(n)
      if (n === 0 && !submitting.current) void submit(true)
    }
    const clock = setInterval(tick, 1000)
    return () => clearInterval(clock)
  }, [paper?.id, paper?.status])

  useEffect(() => {
    if (!paper || paper.status !== 'active') return
    try {
      localStorage.setItem(`ddh.luyen2026.${sbd}.${paper.id}`, JSON.stringify(answers))
    } catch {}
    setSaved('Đang lưu…')
    const timer = setTimeout(() => {
      saveQueue.current = saveQueue.current.then(async () => {
        if (answerRef.current !== answers || paperRef.current?.status !== 'active') return
        try {
          const r = await api('save', { id: paper.id, answers })
          if (r.status) accept(r)
          else setSaved('Đã lưu trên máy chủ')
        } catch {
          setSaved('Chưa lưu lên máy chủ. Đáp án đang giữ trên máy này.')
        }
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [answers, paper?.id, paper?.status])

  const panel = 'm3 m3-khoi p-4 sm:p-6 space-y-4'

  // MÀN HÌNH CHƯA MỞ BÀI LUYỆN
  if (!paper) {
    return (
      <section className={panel}>
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg text-blue-700 dark:text-blue-400">LUYỆN ĐỀ CHUẨN CẤU TRÚC</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Chuẩn Bộ GD&ĐT 2026</span>
        </div>
        <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
          Chỉ dành cho học sinh đã học xong toàn bộ chương trình Hóa THPT.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Rút từ BỘ ĐỀ lớp 12 theo thuật toán ma trận đẳng cấu chuẩn Bộ GD&ĐT · 50 phút · 28 câu: 18 câu chọn đáp án (Phần I), 4 câu đúng/sai (Phần II), 6 câu trả lời ngắn (Phần III).
        </p>
        <label className="flex gap-3 items-center min-h-[48px] text-xs font-medium cursor-pointer text-slate-800 dark:text-slate-200">
          <input
            type="checkbox"
            checked={ready}
            onChange={(e) => setReady(e.target.checked)}
            className="rounded accent-blue-600"
          />
          Em đã học xong toàn bộ chương trình.
        </label>
        <button
          className="m3-nut-chinh disabled:opacity-50 cursor-pointer"
          disabled={!ready || busy}
          onClick={() => void open()}
        >
          {busy ? 'Đang chuẩn bị đề…' : 'Bắt đầu / Tiếp tục bài luyện'}
        </button>
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
          <button
            type="button"
            onClick={() => setMoDanhSach(!moDanhSach)}
            className="w-full flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-3 hover:bg-slate-100/80 dark:hover:bg-slate-750 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                Bài luyện của em
              </h3>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                {history.length} bài
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px] hidden sm:inline">{moDanhSach ? 'Thu gọn' : 'Xem danh sách'}</span>
              <ChevronDown size={15} className={`transition-transform duration-200 ${moDanhSach ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {moDanhSach && (
            <div
              role="region"
              aria-label="Bài luyện của em"
              tabIndex={0}
              className="max-h-48 sm:max-h-52 overflow-y-auto overscroll-contain divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800"
            >
              {history.length === 0 ? (
                <p className="p-4 text-xs text-slate-500 text-center">Chưa có bài luyện nào.</p>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    disabled={busy}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50 cursor-pointer"
                    onClick={() => void open(h.id)}
                  >
                    <span className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2 text-blue-600 shrink-0">
                      <FileText size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {h.status === 'active' ? 'Tiếp tục bài luyện' : 'Xem lại bài luyện'}
                      </span>
                      <span className="block mt-0.5 text-[11px] text-slate-400">
                        {new Date(h.createdAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        h.status === 'active'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {h.status === 'active' ? 'Đang làm' : h.score == null ? 'Đã nộp' : `${h.score.toFixed(2)} điểm`}
                    </span>
                    <ArrowUpRight size={14} className="shrink-0 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    )
  }

  // MÀN HÌNH ĐANG LÀM BÀI HOẶC XEM LẠI — FULL MÀN HÌNH ĐỂ TẬP TRUNG
  const done = paper.status === 'submitted'
  const getSolution = (id: string) =>
    paper.solutions?.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII]).find((q) => q.id === id)
  const change = (id: string, v: string) => {
    if (!done && seconds > 0) setAnswers((a) => ({ ...a, [id]: v }))
  }

  const tongSoCau = paper.bank.phanI.length + paper.bank.phanII.length + paper.bank.phanIII.length
  const soCauDaLam = Object.values(answers).filter((v) => v && v.trim() && v !== '----').length

  return createPortal(
    <div className="m3 m3-man-lam fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div
        className="min-h-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingBottom: done ? 'max(32px, env(safe-area-inset-bottom))' : '110px',
        }}
      >
        {/* Header bài luyện */}
        <div className="m3-dau-man flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              onClick={() => setPaper(null)}
              className="m3-nut-chu -ml-3 cursor-pointer"
            >
              <ChevronLeft size={16} />
              Quay lại danh sách luyện tập
            </button>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Luyện đề chuẩn cấu trúc THPT 2026 · 50 phút
            </h2>
          </div>
          {done && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl">
              <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                  Kết quả: <strong>{paper.result?.score?.toFixed(2)} / 10 điểm</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        {/* Danh sách câu hỏi 3 phần */}
        {(['I', 'II', 'III'] as const).map((phan) => (
          <div key={phan} className="space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">PHẦN {phan}</h3>
            {paper.bank[`phan${phan}`].map((q, i) => {
              const sol = getSolution(q.id)
              const common = {
                ...q,
                cheDo: done ? ('xem_lai' as const) : ('thi' as const),
                stt: i + 1,
                explanation: sol?.explanation,
                loiGiai: sol?.loiGiai,
              }
              if ('choices' in q)
                return (
                  <TheCau
                    key={q.id}
                    {...common}
                    phan="I"
                    choices={q.choices}
                    choiceImgs={q.choiceImgs}
                    choicePerm={[0, 1, 2, 3]}
                    selected={(answers[q.id] || null) as 'A' | 'B' | 'C' | 'D' | null}
                    correct={sol?.correct as 'A' | 'B' | 'C' | 'D' | undefined}
                    onSelect={(v) => change(q.id, v)}
                  />
                )
              if ('ideas' in q)
                return (
                  <TheCau
                    key={q.id}
                    {...common}
                    phan="II"
                    ideas={q.ideas}
                    ideaImgs={q.ideaImgs}
                    selected={Array.from({ length: 4 }, (_, j) => {
                      const v = (answers[q.id] || '')[j]
                      return v === 'D' || v === 'S' ? v : null
                    })}
                    correct={sol?.correct as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'] | undefined}
                    onSelect={(j, v) => {
                      const a = (answers[q.id] || '----').split('')
                      a[j] = v
                      change(q.id, a.join(''))
                    }}
                  />
                )
              return (
                <TheCau
                  key={q.id}
                  {...common}
                  phan="III"
                  selected={answers[q.id] || ''}
                  correct={sol?.correct as string | undefined}
                  onChange={(v) => change(q.id, v)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Thanh công cụ nộp bài cố định dưới đáy */}
      {!done && (
        <div
          data-practice-toolbar
          className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))', pointerEvents: 'none' }}
        >
          <div
            className="m3-thanh-duoi mx-auto flex max-w-3xl items-center justify-between gap-3 p-3"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="min-w-0">
              <div
                className={`flex items-center gap-2 font-bold tabular-nums text-sm ${
                  seconds <= 300 ? 'text-red-600' : 'text-slate-900 dark:text-white'
                }`}
              >
                <Clock3 size={18} />
                <span aria-label="Thời gian còn lại">
                  {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500" role="status">
                Đã làm {soCauDaLam}/{tongSoCau} câu · {saved}
              </p>
            </div>
            <button
              disabled={busy}
              className="m3-nut-chinh shrink-0 cursor-pointer"
              onClick={() => setHienXacNhanNop(true)}
            >
              {busy ? 'Đang nộp…' : 'Nộp bài'}
            </button>
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận nộp bài Google Style */}
      <ModalXacNhanNop
        isOpen={hienXacNhanNop}
        tieuDe="Xác nhận nộp bài luyện"
        moTa="Luyện đề chuẩn cấu trúc THPT 2026 · 50 phút"
        tongSoCau={tongSoCau}
        soCauDaLam={soCauDaLam}
        onClose={() => setHienXacNhanNop(false)}
        onConfirm={() => {
          setHienXacNhanNop(false)
          void submit()
        }}
        dangNop={busy}
        primaryColor="blue"
      />
    </div>,
    document.body
  )
}
