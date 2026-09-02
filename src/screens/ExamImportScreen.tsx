// MÀN HÌNH MỚI "Thả file -> Duyệt câu -> Lưu" thay cho luồng cũ bắt thầy gõ
// đề theo cú pháp app. Nguyên tắc: FILE THẾ NÀO APP ĐỌC THẾ ĐÓ, thầy chỉ
// duyệt lại (sửa nếu cần) rồi lưu — không phải gõ tay dấu *, (Đ)/(S), =>.
//
// Luồng: [1] Thả nhiều file .pdf/.docx cùng lúc -> app tự phân loại + chạy
// pipeline (tách vùng, tách câu/phương án, đọc bảng đáp án) cho từng file ->
// [2] Gộp tất cả câu của mọi file thành 1 danh sách, mỗi câu 1 thẻ với 3
// trạng thái (xanh: chắc chắn — gập lại; vàng: cần liếc — mở sẵn, nêu rõ lý
// do; đỏ: CHƯA có đáp án — bắt buộc điền, khoá nút lưu) -> [3] Lưu vào ngân
// hàng câu hỏi theo từng mã đề, báo số câu trùng với ngân hàng đã có.
import { useRef, useState, type DragEvent } from 'react'
import { UploadCloud, Check, AlertTriangle, X as XIcon, Trash2, ImageIcon, Table as TableIcon, Pencil } from 'lucide-react'
import { extractTextFromFile, classifyDocx, classifyPdf, renderPdfPageDataUrls, type FileKind } from '../lib/exam-file-import'
import { extractPdfQuestionImages } from '../lib/exam-image-crop'
import { buildExamDraft } from '../lib/exam-import-pipeline'
import { congThucVo } from '../lib/exam-question-split'
import { validateTeacherSource, type TeacherExamSource, type TeacherMcqQuestion, type TeacherTrueFalseQuestion, type TeacherShortAnswerQuestion } from '../data/examContent'
import { loadExamSources, saveExamSource } from '../lib/exam-db'
import { ChemText } from '../lib/chem-format'
import QuestionMedia, { ZoomableImage } from '../components/QuestionMedia'
import { useAppStore } from '../store/appStore'

const KIND_LABEL: Record<FileKind, string> = {
  docx_omml: 'Word — công thức chuẩn (m:oMath)',
  docx_mathtype: 'Word — có công thức MathType',
  docx_chu: 'Word — chữ thuần',
  pdf_chu: 'PDF — có lớp chữ',
  pdf_scan: 'PDF — ảnh scan (chưa đọc được)',
}

interface FileJob {
  id: string
  name: string
  status: 'dang_doc' | 'xong' | 'loi'
  kind?: FileKind
  error?: string
  maDe: string
  soCauI: number
  soCauII: number
  soCauIII: number
  /** Ảnh PNG từng trang PDF (150 DPI tương đương, scale 1.5) — để thầy/Claude
   * đối chiếu trực quan khi sửa câu vàng, KHÔNG dùng để tự động đọc lại. */
  pageImages?: string[]
}

type Trangthai = 'xanh' | 'vang' | 'do'

interface ReviewOption {
  key: 'A' | 'B' | 'C' | 'D'
  text: string
}

interface ReviewCau {
  uid: string
  fileId: string
  fileName: string
  maDe: string
  ten: 'I' | 'II' | 'III'
  so: number
  de: string
  pa: ReviewOption[]
  dapAnDung: string
  canDocAnh: boolean
  /** Thầy (hoặc Claude đọc ảnh trang PDF) xác nhận câu này đã đọc lại bằng mắt
   * và đúng — set true thì tắt hẳn cờ "cần liếc" dù văn bản còn trông giống
   * dấu hiệu vỡ (vd bảng số liệu đã gõ đúng thành hàng/cột thật). KHÔNG tự
   * động set — chỉ set khi có xác nhận thật, đúng nguyên tắc "đừng tự chuyển
   * xanh". */
  daXacNhanBangAnh?: boolean
  table?: string[][]
  imageDataUrl?: string
  /** Ảnh cắt thẳng từ trang PDF gốc (200 DPI) — có ảnh thì HIỂN THỊ ẢNH,
   * không dùng chữ `de`/`pa` để hiện cho học sinh nữa (chữ chỉ còn dùng định
   * vị + tìm kiếm/gắn nhãn, xem exam-image-crop.ts). Không có ảnh (đề gõ
   * tay, hoặc cắt ảnh thất bại) -> vẫn hiện bằng chữ như trước. */
  thanCauImg?: string
  choiceImgs?: [string?, string?, string?, string?]
  /** Tuỳ chọn — chỉ hiện cho học sinh SAU khi nộp bài (qua keyBank), không
   * lộ đề trước giờ thi. Nhiều đề tải từ file gốc không có sẵn, để trống
   * cũng lưu được bình thường. */
  explanation?: string
  tieuDe?: string
}

/** Trạng thái tính LẠI trên chữ HIỆN TẠI (không phải cờ tĩnh lúc đọc file) —
 * để khi thầy/Claude sửa chữ trong ô, thẻ tự gỡ vàng ngay, không cần một cờ
 * "đã sửa" riêng dễ lệch với nội dung thật. */
function trangThaiCua(c: ReviewCau): { tt: Trangthai; lyDo: string[] } {
  const lyDo: string[] = []
  if (!c.dapAnDung.trim()) {
    lyDo.push('Chưa có đáp án')
    return { tt: 'do', lyDo }
  }
  // Câu ĐÃ có ảnh cắt từ file gốc -> hiện bằng ảnh, không còn phụ thuộc lớp
  // chữ vỡ hay không (đúng nguyên tắc "lớp chữ chỉ để định vị"). Chỉ còn cần
  // kiểm tra đủ ảnh phương án (Phần I/II) — thiếu ảnh 1 vài phương án thì
  // vẫn vàng để thầy tự bổ khuyết.
  if (c.thanCauImg) {
    const canPa = c.ten === 'III' ? 0 : c.pa.length
    const duAnhPa = c.ten === 'III' || (c.choiceImgs && c.choiceImgs.filter(Boolean).length === canPa && canPa === 4)
    if (!duAnhPa) lyDo.push('Cắt được ảnh đề bài nhưng thiếu ảnh 1 vài phương án — thầy kiểm tra tay')
    return { tt: lyDo.length > 0 ? 'vang' : 'xanh', lyDo }
  }
  const ngheVo = !c.daXacNhanBangAnh && (congThucVo(c.de) || c.pa.some((p) => congThucVo(p.text)))
  if (ngheVo) lyDo.push('Nghi công thức/bảng Hoá bị vỡ khi trích PDF — thầy liếc lại chữ/số hoặc đối chiếu ảnh trang gốc')
  if ((c.ten === 'I' || c.ten === 'II') && c.pa.length < 4) lyDo.push(`Chỉ đọc được ${c.pa.length}/4 ${c.ten === 'I' ? 'phương án' : 'ý'}`)
  if (c.pa.some((p) => !p.text.trim())) lyDo.push('Có phương án/ý rỗng')
  if (!c.de.trim()) lyDo.push('Đề bài rỗng')
  return { tt: lyDo.length > 0 ? 'vang' : 'xanh', lyDo }
}

function normDedup(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const BORDER: Record<Trangthai, string> = {
  xanh: 'border-emerald-300 dark:border-emerald-800',
  vang: 'border-amber-300 dark:border-amber-800',
  do: 'border-rose-300 dark:border-rose-800',
}

export default function ExamImportScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)

  const [jobs, setJobs] = useState<FileJob[]>([])
  const [cauList, setCauList] = useState<ReviewCau[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Trangthai | 'tatca'>('tatca')
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[] | null>(null)
  const [openGallery, setOpenGallery] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setJobs((prev) => [...prev, { id: jobId, name: file.name, status: 'dang_doc', maDe: '', soCauI: 0, soCauII: 0, soCauIII: 0 }])
      try {
        const buf = await file.arrayBuffer()
        const isDocx = /\.docx$/i.test(file.name)
        const { text, avgCharsPerPage } = await extractTextFromFile(file)
        const kind: FileKind = isDocx ? await classifyDocx(buf) : classifyPdf(avgCharsPerPage ?? 0)

        if (kind === 'pdf_scan') {
          setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'loi', kind, error: 'PDF ảnh scan — chưa có lớp chữ, chưa đọc bằng ảnh được (việc sắp tới)' } : j)))
          continue
        }

        // Render sẵn ảnh trang PDF để đối chiếu trực quan khi sửa câu vàng —
        // lớp chữ pdftotext chỉ dùng để tách câu/đối chiếu số lượng, KHÔNG
        // phải nguồn nội dung hiển thị cuối cùng cho công thức/bảng phức tạp.
        let pageImages: string[] | undefined
        if (!isDocx) {
          try {
            pageImages = await renderPdfPageDataUrls(file, 8, 1.5)
          } catch {
            pageImages = undefined
          }
        }

        // ĐỔI CÁCH ĐỌC PDF: cắt ẢNH thẳng từ trang gốc cho từng câu/phương án
        // thay vì hiển thị lại bằng chữ trích ra (chữ chỉ còn dùng định vị +
        // lưu ẩn). Best-effort — câu nào không xác định đủ mốc thì bỏ qua,
        // giữ nguyên chế độ chữ + cờ vàng như trước cho câu đó, KHÔNG chặn
        // luồng đọc file (rất tốn công tính toán nên chỉ chạy cho PDF có lớp
        // chữ, không chạy cho Word).
        let imgResult: Awaited<ReturnType<typeof extractPdfQuestionImages>> | null = null
        if (!isDocx && kind === 'pdf_chu') {
          try {
            imgResult = await extractPdfQuestionImages(file)
          } catch {
            imgResult = null
          }
        }

        const draft = buildExamDraft(text)
        const maDe = draft.maDe || file.name.replace(/\.(pdf|docx)$/i, '')
        const newCau: ReviewCau[] = draft.phan.flatMap((p) =>
          p.cau.map((c) => {
            const img = imgResult?.images.get(`${p.ten}-${c.so}`)
            const choiceImgs = img?.paImgs
              ? (['A', 'B', 'C', 'D'] as const).map((k) => img.paImgs?.[k]) as [string?, string?, string?, string?]
              : undefined
            return {
              uid: `${jobId}-${p.ten}-${c.so}`,
              fileId: jobId,
              fileName: file.name,
              maDe,
              ten: p.ten,
              so: c.so,
              de: c.de,
              pa: c.pa,
              dapAnDung: c.dapAnDung ?? '',
              canDocAnh: c.canDocAnh,
              thanCauImg: img?.thanCauImg,
              choiceImgs,
            }
          }),
        )
        setCauList((prev) => [...prev, ...newCau])
        const soCauI = draft.phan.find((p) => p.ten === 'I')?.cau.length ?? 0
        const soCauII = draft.phan.find((p) => p.ten === 'II')?.cau.length ?? 0
        const soCauIII = draft.phan.find((p) => p.ten === 'III')?.cau.length ?? 0
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'xong', kind, maDe, soCauI, soCauII, soCauIII, pageImages } : j)))
        // Mặc định mở sẵn thẻ vàng/đỏ, gập thẻ xanh.
        setExpanded((prev) => {
          const next = new Set(prev)
          for (const c of newCau) {
            const { tt } = trangThaiCua(c)
            if (tt !== 'xanh') next.add(c.uid)
          }
          return next
        })
      } catch (err) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'loi', error: err instanceof Error ? err.message : 'Không đọc được file' } : j)))
      }
    }
  }

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length > 0) await processFiles(files)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => /\.(pdf|docx)$/i.test(f.name))
    if (files.length > 0) await processFiles(files)
    else showToast('Chỉ nhận file .pdf hoặc .docx', 'error')
  }

  const updateCau = (uid: string, patch: Partial<ReviewCau>) => {
    setCauList((prev) => prev.map((c) => (c.uid === uid ? { ...c, ...patch } : c)))
  }
  const updateOption = (uid: string, key: 'A' | 'B' | 'C' | 'D', text: string) => {
    setCauList((prev) => prev.map((c) => (c.uid === uid ? { ...c, pa: c.pa.map((p) => (p.key === key ? { ...p, text } : p)) } : c)))
  }
  const toggleExpand = (uid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const withStatus = cauList.map((c) => ({ c, ...trangThaiCua(c) }))
  const countXanh = withStatus.filter((x) => x.tt === 'xanh').length
  const countVang = withStatus.filter((x) => x.tt === 'vang').length
  const countDo = withStatus.filter((x) => x.tt === 'do').length
  const visible = withStatus.filter((x) => filter === 'tatca' || x.tt === filter)

  const handleRemoveFile = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
    setCauList((prev) => prev.filter((c) => c.fileId !== jobId))
  }

  const handleSave = async () => {
    if (countDo > 0) return
    if (cauList.length === 0) return
    setSaving(true)
    try {
      const existing = await loadExamSources()
      const existingKeys = new Set<string>()
      for (const s of existing) {
        for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) existingKeys.add(normDedup(q.text))
      }

      const byMaDe = new Map<string, ReviewCau[]>()
      for (const c of cauList) {
        if (!byMaDe.has(c.maDe)) byMaDe.set(c.maDe, [])
        byMaDe.get(c.maDe)!.push(c)
      }

      let tongCau = 0
      let trungCau = 0
      const loiValidate: string[] = []

      for (const [maDe, cau] of byMaDe) {
        const phanI: TeacherMcqQuestion[] = cau
          .filter((c) => c.ten === 'I')
          .sort((a, b) => a.so - b.so)
          .map((c, i) => ({
            id: `${maDe}-p1-${i}`,
            text: c.de,
            choices: ['A', 'B', 'C', 'D'].map((k) => c.pa.find((p) => p.key === k)?.text ?? '') as [string, string, string, string],
            correct: (c.dapAnDung as 'A' | 'B' | 'C' | 'D') || 'A',
            table: c.table,
            imageDataUrl: c.imageDataUrl,
            explanation: c.explanation,
            tieuDe: c.tieuDe,
            thanCauImg: c.thanCauImg,
            choiceImgs: c.choiceImgs,
          }))
        const phanII: TeacherTrueFalseQuestion[] = cau
          .filter((c) => c.ten === 'II')
          .sort((a, b) => a.so - b.so)
          .map((c, i) => ({
            id: `${maDe}-p2-${i}`,
            text: c.de,
            ideas: ['A', 'B', 'C', 'D'].map((k) => c.pa.find((p) => p.key === k)?.text ?? '') as [string, string, string, string],
            correct: [0, 1, 2, 3].map((idx) => (c.dapAnDung[idx] === 'Đ' ? 'D' : 'S')) as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'],
            table: c.table,
            imageDataUrl: c.imageDataUrl,
            explanation: c.explanation,
            tieuDe: c.tieuDe,
            thanCauImg: c.thanCauImg,
            ideaImgs: c.choiceImgs,
          }))
        const phanIII: TeacherShortAnswerQuestion[] = cau
          .filter((c) => c.ten === 'III')
          .sort((a, b) => a.so - b.so)
          .map((c, i) => ({
            id: `${maDe}-p3-${i}`,
            text: c.de,
            correct: c.dapAnDung,
            table: c.table,
            imageDataUrl: c.imageDataUrl,
            explanation: c.explanation,
            tieuDe: c.tieuDe,
            thanCauImg: c.thanCauImg,
          }))

        for (const q of [...phanI, ...phanII, ...phanIII]) {
          tongCau += 1
          if (existingKeys.has(normDedup(q.text))) trungCau += 1
        }

        const source: TeacherExamSource = { maDe, phanI, phanII, phanIII }
        const errs = validateTeacherSource(source)
        if (errs.length > 0) {
          loiValidate.push(`Mã đề "${maDe}": ${errs[0]}`)
          continue
        }
        await saveExamSource(source)
      }

      if (loiValidate.length > 0) {
        showToast(loiValidate[0], 'error')
      } else {
        showToast(
          `Đã lưu ${byMaDe.size} mã đề, ${tongCau} câu vào ngân hàng câu hỏi.` +
            (trungCau > 0 ? ` Cảnh báo: ${trungCau} câu trùng nội dung với ngân hàng đã có (thầy tự kiểm tra, app không tự loại).` : ''),
          trungCau > 0 ? 'warn' : 'success',
        )
        setJobs([])
        setCauList([])
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-40 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tải đề vào ngân hàng câu hỏi</h1>
        <button onClick={() => setScreen('examsetup')} className="text-xs text-slate-500">
          ← Soạn đề thủ công
        </button>
      </div>

      {/* MÀN HÌNH 1 — THẢ FILE */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`tap-target rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
        }`}
      >
        <UploadCloud size={32} className="text-indigo-500" />
        <div className="font-semibold text-sm">Thả file đề vào đây, hoặc bấm để chọn</div>
        <div className="text-xs text-slate-500">Nhận .pdf và .docx, nhiều file cùng lúc — file thế nào app đọc thế đó, không cần gõ theo khuôn nào.</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx" className="hidden" onChange={handlePick} />
      </div>

      {jobs.length > 0 && (
        <div className="space-y-1.5">
          {jobs.map((j) => {
            const dangMoGallery = openGallery.has(j.id)
            return (
              <div key={j.id} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{j.name}</div>
                    {j.status === 'dang_doc' && <div className="text-slate-400">⟳ đang đọc…</div>}
                    {j.status === 'xong' && (
                      <div className="text-slate-500">
                        {j.kind && KIND_LABEL[j.kind]} · mã {j.maDe} · câu I{j.soCauI} II{j.soCauII} III{j.soCauIII}
                      </div>
                    )}
                    {j.status === 'loi' && <div className="text-rose-600">✕ {j.error}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {j.pageImages && j.pageImages.length > 0 && (
                      <button
                        onClick={() =>
                          setOpenGallery((prev) => {
                            const next = new Set(prev)
                            if (next.has(j.id)) next.delete(j.id)
                            else next.add(j.id)
                            return next
                          })
                        }
                        className="tap-target ml-2 flex items-center gap-1 text-indigo-600 dark:text-indigo-400"
                        title="Xem ảnh trang gốc để đối chiếu"
                      >
                        <ImageIcon size={15} />
                        {dangMoGallery ? 'Ẩn ảnh' : `${j.pageImages.length} trang`}
                      </button>
                    )}
                    <button onClick={() => handleRemoveFile(j.id)} className="tap-target ml-1 text-slate-400 hover:text-rose-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {dangMoGallery && j.pageImages && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {j.pageImages.map((src, i) => (
                      <button key={i} onClick={() => setViewerImages(j.pageImages ? [src] : null)} className="tap-target shrink-0">
                        <img src={src} alt={`Trang ${i + 1}`} className="h-32 w-auto rounded border border-slate-300 dark:border-slate-600" />
                        <div className="text-center text-[10px] text-slate-400">Trang {i + 1}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewerImages && viewerImages.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex flex-col overflow-auto" onClick={() => setViewerImages(null)}>
          {viewerImages.length > 1 && (
            <div className="sticky top-0 z-10 bg-black/60 text-white text-xs text-center py-1.5">
              Cuộn để xem hết {viewerImages.length} trang gốc — chạm bất kỳ đâu để đóng
            </div>
          )}
          <div className="flex-1 flex flex-col items-center gap-2 p-2">
            {viewerImages.map((src, i) => (
              <img key={i} src={src} alt={`Trang gốc ${i + 1}`} className="max-w-full rounded shadow-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* MÀN HÌNH 2 — DUYỆT CÂU */}
      {cauList.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button onClick={() => setFilter('tatca')} className={`tap-target px-2.5 rounded-full border ${filter === 'tatca' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 dark:border-slate-600'}`}>
              Tất cả {cauList.length}
            </button>
            <button onClick={() => setFilter('xanh')} className={`tap-target px-2.5 rounded-full border flex items-center gap-1 ${filter === 'xanh' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-300 text-emerald-700 dark:text-emerald-400'}`}>
              <Check size={12} /> {countXanh} chắc
            </button>
            <button onClick={() => setFilter('vang')} className={`tap-target px-2.5 rounded-full border flex items-center gap-1 ${filter === 'vang' ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-300 text-amber-700 dark:text-amber-400'}`}>
              <AlertTriangle size={12} /> {countVang} cần liếc
            </button>
            <button onClick={() => setFilter('do')} className={`tap-target px-2.5 rounded-full border flex items-center gap-1 ${filter === 'do' ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-300 text-rose-700 dark:text-rose-400'}`}>
              <XIcon size={12} /> {countDo} chưa có đáp án
            </button>
          </div>

          {visible.map(({ c, tt, lyDo }) => (
            <CauCard
              key={c.uid}
              c={c}
              tt={tt}
              lyDo={lyDo}
              expanded={tt !== 'xanh' || expanded.has(c.uid)}
              onToggle={() => toggleExpand(c.uid)}
              onUpdate={(patch) => updateCau(c.uid, patch)}
              onUpdateOption={(key, text) => updateOption(c.uid, key, text)}
              sourceImages={jobs.find((j) => j.id === c.fileId)?.pageImages}
              onXemGoc={(imgs) => setViewerImages(imgs)}
            />
          ))}
        </div>
      )}

      {/* MÀN HÌNH 3 — LƯU. Đặt NỔI TRÊN thanh điều hướng dưới (z cao hơn +
          cách đáy màn hình một khoảng), không phải bottom-0 full-width, để
          không đè/không bị đè bởi pill "Lớp/Kiểm tra/Phụ huynh". */}
      {cauList.length > 0 && (
        <div className="fixed left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-50 px-3">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-3">
            {countDo > 0 && (
              <div className="text-xs text-rose-600 mb-2 text-center">
                Còn {countDo} câu chưa có đáp án — bấm vào ô "Chưa có đáp án" trong thẻ đỏ để điền trước khi lưu.
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={countDo > 0 || saving}
              className="tap-target w-full rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu…' : `Lưu ${cauList.length} câu vào ngân hàng câu hỏi`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EditableText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false)
  if (editing) {
    return (
      <textarea
        autoFocus
        className="w-full rounded-md border border-indigo-400 bg-white dark:bg-slate-950 px-2 py-1 text-sm"
        rows={2}
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(e) => {
          onChange(e.target.value)
          setEditing(false)
        }}
      />
    )
  }
  // LỖI GIAO DIỆN ĐÃ SỬA: trước đây dùng `title="Bấm để sửa"` (tooltip trình
  // duyệt) đè lên đúng chỗ con trỏ đang rê, che mất chữ giữa câu khi đọc.
  // Đổi sang icon bút chì nhỏ ở MÉP PHẢI, mờ sẵn, chỉ rõ hẳn khi rê chuột
  // (group-hover) — không còn che chữ.
  return (
    <div
      onClick={() => setEditing(true)}
      className={`group relative rounded-md pl-2 pr-6 py-1 text-sm cursor-text hover:bg-slate-100 dark:hover:bg-slate-800 ${!value.trim() ? 'text-rose-500 italic' : ''}`}
    >
      {value.trim() ? <ChemText text={value} /> : placeholder || '(trống — bấm để gõ)'}
      <Pencil size={11} className="absolute right-1.5 top-1.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}

function CauCard({
  c,
  tt,
  lyDo,
  expanded,
  onToggle,
  onUpdate,
  onUpdateOption,
  sourceImages,
  onXemGoc,
}: {
  c: ReviewCau
  tt: Trangthai
  lyDo: string[]
  expanded: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<ReviewCau>) => void
  onUpdateOption: (key: 'A' | 'B' | 'C' | 'D', text: string) => void
  sourceImages?: string[]
  onXemGoc: (imgs: string[]) => void
}) {
  return (
    <div className={`rounded-xl bg-white dark:bg-slate-900 border-2 p-3 space-y-2 ${BORDER[tt]}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className="text-xs font-semibold text-slate-500 truncate">
            Mã {c.maDe} · Phần {c.ten} · Câu {c.so}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* "Xem bản gốc" — đường lui đối chiếu, hiện với MỌI câu kể cả thẻ
              xanh, vì chữ render ra có thể trông hợp lý nhưng sai đề (vd
              "280% FeS" đáng ra "80% FeS2") mà không đối chiếu thì không phát
              hiện được. Bản hiện tại mở nguyên các trang PDF của file nguồn
              (chưa crop khít từng câu — cần lưu toạ độ mới crop được). */}
          {sourceImages && sourceImages.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onXemGoc(sourceImages)
              }}
              className="tap-target text-[12px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted"
            >
              xem bản gốc
            </button>
          )}
          <div className="flex items-center gap-1 text-xs cursor-pointer" onClick={onToggle}>
            {tt === 'xanh' && <Check size={14} className="text-emerald-600" />}
            {tt === 'vang' && <AlertTriangle size={14} className="text-amber-500" />}
            {tt === 'do' && <XIcon size={14} className="text-rose-600" />}
          </div>
        </div>
      </div>

      {lyDo.length > 0 && (
        <div className="text-xs text-amber-700 dark:text-amber-400">
          {lyDo.map((l, i) => (
            <div key={i}>• {l}</div>
          ))}
        </div>
      )}

      {expanded && (
        <>
          {c.thanCauImg ? (
            <div className="space-y-1">
              <ZoomableImage src={c.thanCauImg} alt="Đề bài (ảnh cắt từ file gốc)" />
              <details className="text-[11px] text-slate-400">
                <summary className="cursor-pointer select-none">Chữ ẩn (định vị/tìm kiếm) — bấm để sửa</summary>
                <EditableText value={c.de} onChange={(v) => onUpdate({ de: v })} placeholder="Đề bài" />
              </details>
            </div>
          ) : (
            <EditableText value={c.de} onChange={(v) => onUpdate({ de: v })} placeholder="Đề bài" />
          )}
          <QuestionMedia table={c.table} imageDataUrl={c.imageDataUrl} />
          <TableImageEditor c={c} onUpdate={onUpdate} />

          {c.ten === 'I' &&
            (['A', 'B', 'C', 'D'] as const).map((k, idx) => {
              const opt = c.pa.find((p) => p.key === k)
              const dung = c.dapAnDung === k
              const img = c.choiceImgs?.[idx]
              return (
                <div key={k} className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdate({ dapAnDung: k })}
                    className={`tap-target shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                      dung ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                    title="Bấm để chọn đây là đáp án đúng"
                  >
                    {k}
                  </button>
                  <div className="flex-1">
                    {img ? (
                      <div className="space-y-1">
                        <img src={img} alt={`Phương án ${k}`} className="max-h-16 w-auto rounded border border-slate-200 dark:border-slate-700" />
                        <details className="text-[11px] text-slate-400">
                          <summary className="cursor-pointer select-none">Chữ ẩn — sửa</summary>
                          <EditableText value={opt?.text ?? ''} onChange={(v) => onUpdateOption(k, v)} placeholder={`Phương án ${k}`} />
                        </details>
                      </div>
                    ) : (
                      <EditableText value={opt?.text ?? ''} onChange={(v) => onUpdateOption(k, v)} placeholder={`Phương án ${k}`} />
                    )}
                  </div>
                </div>
              )
            })}

          {c.ten === 'II' &&
            (['A', 'B', 'C', 'D'] as const).map((k, idx) => {
              const opt = c.pa.find((p) => p.key === k)
              const chuCai = 'abcd'[idx]
              const img = c.choiceImgs?.[idx]
              const dSValue = c.dapAnDung[idx] === 'Đ' ? 'Đ' : c.dapAnDung[idx] === 'S' ? 'S' : ''
              const setDS = (v: 'Đ' | 'S') => {
                const chars = (c.dapAnDung || 'SSSS').padEnd(4, 'S').split('')
                chars[idx] = v
                onUpdate({ dapAnDung: chars.join('') })
              }
              return (
                <div key={k} className="flex items-center gap-2">
                  <div className="flex shrink-0 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 text-xs font-bold">
                    <button onClick={() => setDS('Đ')} className={`w-8 h-8 ${dSValue === 'Đ' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'}`}>
                      Đ
                    </button>
                    <button onClick={() => setDS('S')} className={`w-8 h-8 ${dSValue === 'S' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'}`}>
                      S
                    </button>
                  </div>
                  <div className="flex-1">
                    {img ? (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 mr-1">{chuCai})</span>
                        <img src={img} alt={`Ý ${chuCai}`} className="max-h-16 w-auto rounded border border-slate-200 dark:border-slate-700" />
                        <details className="text-[11px] text-slate-400">
                          <summary className="cursor-pointer select-none">Chữ ẩn — sửa</summary>
                          <EditableText value={opt?.text ?? ''} onChange={(v) => onUpdateOption(k, v)} placeholder={`Ý ${chuCai}`} />
                        </details>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs text-slate-400 mr-1">{chuCai})</span>
                        <EditableText value={opt?.text ?? ''} onChange={(v) => onUpdateOption(k, v)} placeholder={`Ý ${chuCai}`} />
                      </>
                    )}
                  </div>
                </div>
              )
            })}

          {c.ten === 'III' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 shrink-0">Đáp án:</span>
              <input
                className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-2 py-1 text-sm"
                value={c.dapAnDung}
                onChange={(e) => onUpdate({ dapAnDung: e.target.value })}
                placeholder="vd 12,5"
              />
            </div>
          )}

          {/* Tuỳ chọn — chỉ học sinh xem SAU khi nộp bài (màn Xem lại lời
              giải), không lộ đề trước giờ thi. Nhiều đề thi thật không có
              sẵn, để trống vẫn lưu bình thường. */}
          <div className="pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-1">
            <div className="text-[11px] text-slate-400">Tuỳ chọn — học sinh chỉ xem SAU khi nộp bài:</div>
            <div>
              <span className="text-[11px] text-slate-400 mr-1">Tiêu đề ngắn (chủ đề):</span>
              <EditableText value={c.tieuDe ?? ''} onChange={(v) => onUpdate({ tieuDe: v })} placeholder="vd Ăn mòn kim loại (để trống nếu không cần)" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 mr-1">Lời giải:</span>
              <EditableText value={c.explanation ?? ''} onChange={(v) => onUpdate({ explanation: v })} placeholder="Giải thích ngắn gọn (để trống nếu chưa có)" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Thầy/Claude sửa tay bảng số liệu (cú pháp mỗi dòng 1 hàng, cột cách nhau
 * bằng "|") và ảnh sơ đồ/hình vẽ (dán Ctrl+V hoặc chọn file) — KHÔNG có thuật
 * toán tự dò bảng từ chữ vỡ, vì lớp chữ PDF đã xé lẻ bảng thành vô nghĩa;
 * cách chắc ăn là đọc bằng ảnh trang gốc rồi gõ lại đúng cấu trúc. */
function TableImageEditor({ c, onUpdate }: { c: ReviewCau; onUpdate: (patch: Partial<ReviewCau>) => void }) {
  const [dangSuaBang, setDangSuaBang] = useState(false)
  const tableToText = (t?: string[][]) => (t ?? []).map((row) => row.join(' | ')).join('\n')
  const textToTable = (s: string): string[][] =>
    s
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.split('|').map((cell) => cell.trim()))

  const onPasteImage = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith('image/'))
    if (!item) return
    const file = item.getAsFile()
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onUpdate({ imageDataUrl: reader.result as string })
    reader.readAsDataURL(file)
  }
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onUpdate({ imageDataUrl: reader.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-1.5" onPaste={onPasteImage} tabIndex={-1}>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button
          onClick={() => setDangSuaBang((v) => !v)}
          className="tap-target flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-600 px-2 text-slate-600 dark:text-slate-300"
        >
          <TableIcon size={12} /> {c.table ? 'Sửa bảng' : 'Thêm bảng'}
        </button>
        {c.table && (
          <button onClick={() => onUpdate({ table: undefined })} className="tap-target text-rose-500">
            Bỏ bảng
          </button>
        )}
        <label className="tap-target flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-600 px-2 text-slate-600 dark:text-slate-300 cursor-pointer">
          <ImageIcon size={12} /> {c.imageDataUrl ? 'Đổi ảnh' : 'Thêm ảnh (dán hoặc chọn)'}
          <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        </label>
        {c.imageDataUrl && (
          <button onClick={() => onUpdate({ imageDataUrl: undefined })} className="tap-target text-rose-500">
            Bỏ ảnh
          </button>
        )}
        {(c.table || c.imageDataUrl) && !c.daXacNhanBangAnh && (
          <button
            onClick={() => onUpdate({ daXacNhanBangAnh: true })}
            className="tap-target flex items-center gap-1 rounded-full border border-emerald-400 text-emerald-700 dark:text-emerald-400 px-2"
            title="Đã đối chiếu với ảnh trang gốc, đúng — chuyển thẻ này sang chắc chắn"
          >
            <Check size={12} /> Đã đối chiếu đúng
          </button>
        )}
      </div>
      {dangSuaBang && (
        <textarea
          className="w-full rounded-md border border-indigo-400 bg-white dark:bg-slate-950 px-2 py-1 text-xs font-mono"
          rows={3}
          defaultValue={tableToText(c.table)}
          placeholder={'Cột cách nhau bằng | , mỗi dòng 1 hàng — hàng đầu là tiêu đề\nvd: Chất | CH4(g) | O2(g)\n\\Delta_f H^\\circ_{298} (kJ/mol) | -74,9 | 0'}
          onBlur={(e) => onUpdate({ table: textToTable(e.target.value) })}
        />
      )}
    </div>
  )
}
