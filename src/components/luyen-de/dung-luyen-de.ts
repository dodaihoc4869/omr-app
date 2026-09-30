// LÕI LUYỆN ĐỀ CHUẨN CẤU TRÚC (tách 30/09 từ LuyenDeChuan.tsx — KHÔNG đổi luật): gọi `/luyen-de/*`, giữ bài, lưu nháp (máy + máy chủ),
// đồng hồ theo mốc máy chủ, tự nộp khi hết giờ. Hai giao diện dùng chung: LuyenDeChuan (tab Khắc phục cũ) và thẻ "Luyện đề cấu trúc"
// trong Tu luyện (tu-luyen/LuyenDeCauTruc.tsx). Đáp án/lời giải CHỈ có sau nộp (máy chủ `server/src/luyen-de.ts` mới gửi `solutions`).
import { useEffect, useMemo, useRef, useState } from 'react'
import { taoKhoGio, useMocGio, type KhoGio } from '../../lib/dong-ho-thi'
import { layCauHinhMayChu, xongNapDiaChi } from '../../lib/may-chu-moi'
import type { PublicExamBank, TeacherExamSource } from '../../data/examContent'

export type PaperLuyenDe = {
  id: string
  deadline: number
  serverNow: number
  status: string
  answers: Record<string, string>
  bank: PublicExamBank
  result?: { score: number; detail?: Record<string, { correct: unknown; points: number }> }
  solutions?: TeacherExamSource[]
}
export type LuotLuyenDe = { id: string; createdAt: number; status: string; score: number | null }
export type TrangThaiLuyenDe = 'mo' | 'can_xac_nhan' | 'khoa'
export type DieuKienLuyenDe = { trangThai: TrangThaiLuyenDe; lyDo: string; items: LuotLuyenDe[] }

/** Gọi `POST /luyen-de/<lệnh>` kèm token. Lỗi ⇒ ném Error mang đúng câu máy chủ trả. */
export async function goiLuyenDe(action: string, token: string | undefined, data: Record<string, unknown> = {}) {
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

const docLuot = (v: unknown): LuotLuyenDe[] =>
  (Array.isArray(v) ? v : [])
    .map((x: Record<string, unknown>) => ({
      id: String(x?.id ?? ''),
      createdAt: Number(x?.createdAt) || 0,
      status: String(x?.status ?? ''),
      score: typeof x?.score === 'number' && Number.isFinite(x.score) ? x.score : null,
    }))
    .filter((x) => x.id)

/** Trạng thái cổng + lý do DO MÁY CHỦ TÍNH (`/luyen-de/dieu-kien`, chỉ đọc). Máy chủ cũ chưa có lệnh này ⇒ `null` (giao diện giữ cổng cũ: nút bắt đầu, máy chủ chặn ở `start`). */
export async function taiDieuKienLuyenDe(token: string | undefined): Promise<DieuKienLuyenDe | null> {
  try {
    const j = await goiLuyenDe('dieu-kien', token)
    const t = j.trangThai
    if (t !== 'mo' && t !== 'can_xac_nhan' && t !== 'khoa') return null
    return { trangThai: t, lyDo: String(j.lyDo ?? ''), items: docLuot(j.items) }
  } catch {
    return null
  }
}

/** Câu đã làm: Phần II đủ 4 ý chưa không bắt buộc — như bản cũ, có ô nào khác rỗng/"----" là tính đã làm. */
export const demDaLam = (answers: Record<string, string>) => Object.values(answers).filter((v) => v && v.trim() && v !== '----').length

export function useLuyenDe(sbd: string, token: string | undefined) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paper, setPaper] = useState<PaperLuyenDe | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<LuotLuyenDe[]>([])
  const [seconds, setSeconds] = useState(0)
  const [saved, setSaved] = useState('')

  const saveQueue = useRef(Promise.resolve())
  const answerRef = useRef(answers)
  const paperRef = useRef(paper)
  const offset = useRef(0)
  const submitting = useRef(false)
  const alive = useRef(true)

  answerRef.current = answers
  paperRef.current = paper

  const api = (action: string, data: Record<string, unknown> = {}) => goiLuyenDe(action, token, data)

  async function refresh() {
    try {
      const r = await api('history')
      if (alive.current) setHistory((r.items || []) as LuotLuyenDe[])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sbd, token])

  function accept(p: PaperLuyenDe) {
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

  // Giờ còn lại nằm trong KHO GIỜ (lib/dong-ho-thi), giờ máy chủ = Date.now() + lệch.
  // Gốc chỉ nghe MỐC (hết giờ hay chưa) ⇒ không vẽ lại cả đề mỗi giây.
  const dangLam = paper?.status === 'active'
  const khoGio: KhoGio | null = useMemo(
    () => (paper && dangLam ? taoKhoGio(paper.deadline, () => Date.now() + offset.current) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paper?.id, dangLam, paper?.deadline],
  )
  const mocGio = useMocGio(khoGio)
  // Hết giờ (giây làm tròn lên về 0 ⇔ còn ≤ 0) ⇒ tự nộp; nộp hỏng thì thử lại mỗi giây như bản cũ.
  const hetGio = mocGio === 'het'
  useEffect(() => {
    if (!hetGio || !dangLam) return
    const thu = () => {
      if (!submitting.current) void submit(true)
    }
    thu()
    const id = setInterval(thu, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hetGio, dangLam, paper?.id])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, paper?.id, paper?.status])

  const done = paper?.status === 'submitted'
  const change = (id: string, v: string) => {
    if (!done && (khoGio ? !hetGio : seconds > 0)) setAnswers((a) => ({ ...a, [id]: v }))
  }
  const getSolution = (id: string) =>
    paper?.solutions?.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII]).find((q) => q.id === id)

  return {
    ready, setReady, busy, error, paper, setPaper, answers, history, seconds, saved,
    khoGio, hetGio, done, open, submit, change, getSolution, refresh,
  }
}
