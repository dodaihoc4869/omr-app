import { useEffect, useRef } from 'react'
import type { AppSettings } from '../engine/settings'
import type { ReadSheetResult } from '../engine/reader'
import type { QualityResult } from '../engine/quality-gate'

export interface FrameResult {
  type: 'frameResult'
  anchorsFound: number
  quality: QualityResult
  readyToCapture: boolean
}

export interface SheetResultMsg {
  type: 'sheetResult'
  sheet: ReadSheetResult
}

export interface CaptureErrorMsg {
  type: 'captureError'
  reason: string
}

type WorkerMsg = FrameResult | SheetResultMsg | CaptureErrorMsg | { type: 'ready' }

export function useScanWorker(
  onFrameResult: (r: FrameResult) => void,
  onSheetResult: (r: ReadSheetResult) => void,
  onCaptureError: (reason: string) => void,
) {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/scan.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (ev: MessageEvent<WorkerMsg>) => {
      const msg = ev.data
      if (msg.type === 'frameResult') onFrameResult(msg)
      else if (msg.type === 'sheetResult') onSheetResult(msg.sheet)
      else if (msg.type === 'captureError') onCaptureError(msg.reason)
    }
    worker.postMessage({ type: 'init' })
    workerRef.current = worker
    return () => worker.terminate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkFrame = (imageData: ImageData, settings: AppSettings) => {
    workerRef.current?.postMessage({ type: 'checkFrame', imageData, settings })
  }
  const captureFrame = (imageData: ImageData, settings: AppSettings) => {
    workerRef.current?.postMessage({ type: 'captureFrame', imageData, settings })
  }

  return { checkFrame, captureFrame }
}
