import { useEffect, useRef, useState } from 'react'
import { useAppStore, type ScannedSheet } from '../store/appStore'
import { scoreStudent } from '../engine/score'
import { loadSettings } from '../engine/settings'
import { findStudentBySbd } from '../lib/classlist-db'
import { useScanWorker } from '../hooks/useScanWorker'
import type { ReadSheetResult } from '../engine/reader'

const TARGET_W = 1654
const TARGET_H = 2339

export default function ScanScreen() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stableSinceRef = useRef<number | null>(null)
  const capturingRef = useRef(false)
  const loopRef = useRef<number | null>(null)
  const lastCaptureImageRef = useRef<string | undefined>(undefined)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [anchorsFound, setAnchorsFound] = useState(0)
  const [qualityOk, setQualityOk] = useState(false)

  const sheets = useAppStore((s) => s.sheets)
  const addSheet = useAppStore((s) => s.addSheet)
  const answerKeys = useAppStore((s) => s.answerKeys)
  const classList = useAppStore((s) => s.classList)
  const showToast = useAppStore((s) => s.showToast)

  const settings = loadSettings()

  async function handleSheetResult(sheet: ReadSheetResult) {
    capturingRef.current = false
    stableSinceRef.current = null

    const sbd = sheet.sbd.value
    const madeThi = sheet.madeThi.value
    const student = await findStudentBySbd(sbd)
    const sbdKnown = classList.length === 0 ? true : !!student

    const answers = { sbd, madeThi, phanI: sheet.phanI, phanII: sheet.phanII, phanIII: sheet.phanIII }
    const key = answerKeys[madeThi]
    const score = key ? scoreStudent(answers, key) : null

    const duplicate = sheets.find((s) => s.answers.sbd === sbd && s.answers.madeThi === madeThi)
    if (duplicate) {
      if ('vibrate' in navigator) navigator.vibrate?.([80, 40, 80])
      const overwrite = window.confirm(
        `SBD ${sbd} đã quét trước đó (${duplicate.hoTen || 'chưa rõ tên'}). Đè lên phiếu cũ?`,
      )
      if (!overwrite) {
        showToast('Đã bỏ qua phiếu trùng SBD', 'warn')
        return
      }
    }

    const newSheet: ScannedSheet = {
      id: crypto.randomUUID(),
      scannedAt: new Date().toISOString(),
      answers,
      score,
      hoTen: student?.hoTen ?? '',
      lop: student?.lop ?? '',
      sdt: student?.sdt ?? '',
      sbdKnown,
      reviewed: false,
      imageDataUrl: lastCaptureImageRef.current,
    }

    addSheet(newSheet)

    const needsReview =
      !sbdKnown ||
      sheet.phanI.some((x) => x.flag === 'WARN_ERASURE' || x.flag === 'ERR_DOUBLE_MARK') ||
      sheet.phanII.some((q) => q.some((x) => x.flag === 'WARN_ERASURE' || x.flag === 'ERR_DOUBLE_MARK')) ||
      sheet.phanIII.some((x) => x.flag === 'WARN_ERASURE' || x.flag === 'ERR_DOUBLE_MARK')

    if ('vibrate' in navigator) navigator.vibrate?.(needsReview ? [40, 30, 40, 30, 40] : 40)

    if (needsReview) {
      showToast('1 chỗ cần xem', 'warn')
    } else if (score) {
      showToast(`✓ ${student?.hoTen ?? sbd} · ${score.total.toFixed(2)}`, 'success')
    } else {
      showToast(`✓ Đã quét SBD ${sbd} — chưa có đáp án mã đề ${madeThi}`, 'warn')
    }
  }

  const { checkFrame, captureFrame } = useScanWorker(
    (r) => {
      setAnchorsFound(r.anchorsFound)
      setQualityOk(r.quality.passed)
      const now = performance.now()
      if (r.readyToCapture) {
        if (stableSinceRef.current === null) stableSinceRef.current = now
        const heldMs = now - stableSinceRef.current
        if (heldMs >= settings.stableMsBeforeCapture && !capturingRef.current && videoRef.current) {
          capturingRef.current = true
          const canvas = canvasRef.current!
          const ctx = canvas.getContext('2d')!
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          ctx.drawImage(videoRef.current, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          lastCaptureImageRef.current = canvas.toDataURL('image/jpeg', 0.85)
          captureFrame(imageData, settings)
        }
      } else {
        stableSinceRef.current = null
      }
    },
    handleSheetResult,
    (reason) => {
      capturingRef.current = false
      stableSinceRef.current = null
      if (reason !== 'ANCHOR_NOT_FOUND') showToast('Không đọc được phiếu, thử lại', 'error')
    },
  )

  useEffect(() => {
    let stream: MediaStream | null = null
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: TARGET_W }, height: { ideal: TARGET_H } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setCameraReady(true)
        }
      } catch {
        setCameraError('Không mở được camera — kiểm tra quyền truy cập camera cho trang này.')
      }
    })()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (!cameraReady) return
    const tick = () => {
      if (videoRef.current && canvasRef.current && !capturingRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video.videoWidth > 0) {
          const scale = 640 / video.videoWidth
          canvas.width = Math.round(video.videoWidth * scale)
          canvas.height = Math.round(video.videoHeight * scale)
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          checkFrame(imageData, settings)
        }
      }
      loopRef.current = window.setTimeout(tick, 180)
    }
    tick()
    return () => {
      if (loopRef.current) clearTimeout(loopRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady])

  const frameOk = anchorsFound === 4 && qualityOk

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-slate-300">Đã quét: <span className="font-bold text-white">{sheets.length}</span></div>
        <div className="text-sm text-slate-300">Anchor: {anchorsFound}/4</div>
      </div>

      <div className="relative flex-1 mx-4 mb-24 rounded-2xl overflow-hidden bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Khung ngắm 4 góc, phát sáng khi bắt được đủ anchor + đủ chất lượng */}
        <div className="absolute inset-6 pointer-events-none">
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
            <div
              key={corner}
              className={`absolute w-10 h-10 border-4 rounded-md transition-colors duration-150 ${
                frameOk ? 'border-indigo-400' : 'border-white/50'
              } ${corner === 'tl' ? 'top-0 left-0 border-r-0 border-b-0' : ''} ${
                corner === 'tr' ? 'top-0 right-0 border-l-0 border-b-0' : ''
              } ${corner === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0' : ''} ${
                corner === 'br' ? 'bottom-0 right-0 border-l-0 border-t-0' : ''
              }`}
            />
          ))}
        </div>

        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">Đang mở camera…</div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-rose-300">
            {cameraError}
          </div>
        )}
      </div>
    </div>
  )
}
