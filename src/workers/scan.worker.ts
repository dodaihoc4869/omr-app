/// <reference lib="webworker" />
// Web Worker chạy toàn bộ pipeline thị giác bằng OpenCV.js (WASM) để không
// chặn UI thread trong lúc quét liên tục 30 phiếu. Giao tiếp bằng postMessage
// theo hai lệnh: 'checkFrame' (cổng chất lượng, chạy mỗi frame preview) và
// 'captureFrame' (pipeline đầy đủ: anchor → homography → đọc bubble).
import cvModule from '@techstark/opencv-js'
import { checkQuality } from '../engine/quality-gate'
import { readSheet } from '../engine/reader'
import type { GrayImage } from '../engine/sampling'
import { template } from '../engine/template'
import { DEFAULT_SETTINGS, type AppSettings } from '../engine/settings'

type CvNamespace = typeof import('@techstark/opencv-js')
let cv: CvNamespace

async function loadCv(): Promise<CvNamespace> {
  const mod = cvModule as unknown
  if (mod instanceof Promise) return (await mod) as CvNamespace
  const anyMod = mod as { Mat?: unknown; onRuntimeInitialized?: () => void }
  if (anyMod.Mat) return mod as CvNamespace
  await new Promise<void>((resolve) => {
    anyMod.onRuntimeInitialized = () => resolve()
  })
  return mod as CvNamespace
}

interface AnchorCandidate {
  cx: number
  cy: number
  area: number
}

/** Tìm hình tứ giác lồi (approxPolyDP ra 4 đỉnh, solidity ≥ 0,9) gần nhất 1 trong 4 góc ảnh. */
function findAnchors(gray: InstanceType<CvNamespace['Mat']>, w: number, h: number): (AnchorCandidate | null)[] {
  const blurred = new cv.Mat()
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
  const thresh = new cv.Mat()
  cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 35, 10)

  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  cv.findContours(thresh, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

  const minArea = w * h * 0.0015
  const maxArea = w * h * 0.02
  const candidates: AnchorCandidate[] = []

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i)
    const area = cv.contourArea(cnt)
    if (area < minArea || area > maxArea) {
      cnt.delete()
      continue
    }
    const approx = new cv.Mat()
    const peri = cv.arcLength(cnt, true)
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true)

    if (approx.rows === 4) {
      const hull = new cv.Mat()
      cv.convexHull(cnt, hull)
      const hullArea = cv.contourArea(hull)
      const solidity = hullArea > 0 ? area / hullArea : 0
      if (solidity >= 0.9) {
        let sx = 0
        let sy = 0
        for (let p = 0; p < 4; p++) {
          sx += approx.data32S[p * 2]
          sy += approx.data32S[p * 2 + 1]
        }
        candidates.push({ cx: sx / 4, cy: sy / 4, area })
      }
      hull.delete()
    }
    approx.delete()
    cnt.delete()
  }
  hierarchy.delete()
  contours.delete()
  thresh.delete()
  blurred.delete()

  // Gán ứng viên gần nhất cho từng góc khung ngắm: TL, TR, BL, BR.
  const corners = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ]
  const usedIndex = new Set<number>()
  return corners.map((corner) => {
    const wantLeft = corner.x === 0
    const wantTop = corner.y === 0
    let best: AnchorCandidate | null = null
    let bestIdx = -1
    let bestDist = Infinity
    candidates.forEach((c, idx) => {
      if (usedIndex.has(idx)) return
      // Chỉ nhận ứng viên nằm trong phần tư (40% chiều rộng/cao) gần góc tương ứng
      // — tránh bắt nhầm bubble trả lời nằm giữa trang làm anchor.
      const inLeftHalf = c.cx < w * 0.4
      const inRightHalf = c.cx > w * 0.6
      const inTopHalf = c.cy < h * 0.4
      const inBottomHalf = c.cy > h * 0.6
      const xOk = wantLeft ? inLeftHalf : inRightHalf
      const yOk = wantTop ? inTopHalf : inBottomHalf
      if (!xOk || !yOk) return
      const d = (c.cx - corner.x) ** 2 + (c.cy - corner.y) ** 2
      if (d < bestDist) {
        bestDist = d
        best = c
        bestIdx = idx
      }
    })
    if (bestIdx >= 0) usedIndex.add(bestIdx)
    return best
  })
}

function matToGrayImage(mat: InstanceType<CvNamespace['Mat']>): GrayImage {
  const gray = new cv.Mat()
  if (mat.channels() > 1) {
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY)
  } else {
    mat.copyTo(gray)
  }
  const data = new Uint8ClampedArray(gray.data)
  const result: GrayImage = { data, width: gray.cols, height: gray.rows }
  gray.delete()
  return result
}

function anchorCenterTargetPx(anchorId: string): { x: number; y: number } {
  const a = template.anchors.find((x) => x.id === anchorId)
  if (!a) throw new Error(`Không tìm thấy anchor ${anchorId} trong template`)
  const mmToPx = (mm: number) => (mm * template.page.dpi) / 25.4
  return { x: mmToPx(a.x_mm + a.size_mm / 2), y: mmToPx(a.y_mm + a.size_mm / 2) }
}

function handleCheckFrame(imageData: ImageData, settings: AppSettings) {
  const src = cv.matFromImageData(imageData)
  const gray = new cv.Mat()
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)

  const anchors = findAnchors(gray, gray.cols, gray.rows)
  const anchorsFound = anchors.filter((a) => a !== null).length

  // Cổng chất lượng chạy trên bản thu nhỏ để đủ nhanh cho mỗi frame preview.
  const grayImg = matToGrayImage(gray)
  const quality = checkQuality(grayImg, settings.sharpnessMin, settings.overexposureMaxRatio)

  gray.delete()
  src.delete()

  ;(self as unknown as Worker).postMessage({
    type: 'frameResult',
    anchorsFound,
    quality,
    readyToCapture: anchorsFound === 4 && quality.passed,
  })
}

function handleCaptureFrame(imageData: ImageData, settings: AppSettings) {
  const src = cv.matFromImageData(imageData)
  const gray = new cv.Mat()
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)

  const anchors = findAnchors(gray, gray.cols, gray.rows)
  if (anchors.some((a) => a === null)) {
    gray.delete()
    src.delete()
    ;(self as unknown as Worker).postMessage({ type: 'captureError', reason: 'ANCHOR_NOT_FOUND' })
    return
  }
  const found = anchors as AnchorCandidate[]

  const order: ('TL' | 'TR' | 'BL' | 'BR')[] = ['TL', 'TR', 'BL', 'BR']
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, found.flatMap((a) => [a.cx, a.cy]))
  const dstPtsArr = order.flatMap((id) => {
    const p = anchorCenterTargetPx(id)
    return [p.x, p.y]
  })
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, dstPtsArr)

  const M = cv.getPerspectiveTransform(srcPts, dstPts)
  const warped = new cv.Mat()
  cv.warpPerspective(
    src,
    warped,
    M,
    new cv.Size(template.page.width_px, template.page.height_px),
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar(255, 255, 255, 255),
  )

  const grayImg = matToGrayImage(warped)
  const sheet = readSheet(grayImg, { thresholds: settings.thresholds, maskFraction: settings.maskFraction })

  M.delete()
  srcPts.delete()
  dstPts.delete()
  warped.delete()
  gray.delete()
  src.delete()

  ;(self as unknown as Worker).postMessage({ type: 'sheetResult', sheet })
}

self.onmessage = async (ev: MessageEvent) => {
  if (!cv) cv = await loadCv()
  const msg = ev.data as { type: string; imageData?: ImageData; settings?: AppSettings }
  const settings = msg.settings ?? DEFAULT_SETTINGS

  if (msg.type === 'init') {
    ;(self as unknown as Worker).postMessage({ type: 'ready' })
    return
  }
  if (msg.type === 'checkFrame' && msg.imageData) {
    handleCheckFrame(msg.imageData, settings)
    return
  }
  if (msg.type === 'captureFrame' && msg.imageData) {
    handleCaptureFrame(msg.imageData, settings)
    return
  }
}
