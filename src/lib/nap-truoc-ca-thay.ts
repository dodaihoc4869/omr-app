// TẢI SẴN CA KIỂM TRA CHO APP THẦY (thầy 03/11: «ca kiểm tra trên app gv load quá chậm, bấm vào từng ca mãi mới vào được, tải được sẵn gì thì tải sẵn»).
// Gốc chậm: lần ĐẦU mở một ca trên thiết bị này, máy chưa có «bản đề CÓ đáp án» (ngân hàng chấm lại) ⇒ `chiTietCa(…, xinKeyBank = true)` BUỘC đi đường cũ qua Apps
// Script (đo p50 ~5 giây — ghi ở exam-api.ts chiTietCa); lần sau mới đi đường nhanh. Cộng với mảnh ExamMonitorScreen (~50 KB nén) tải lười sau lần bấm.
// Cách làm: màn «Ca kiểm tra» vừa có danh sách ⇒ LÚC RẢNH, lần lượt từng ca (đang mở trước, rồi gần nhất) làm đúng các bước của `tai()` ở ExamMonitorScreen:
// xin chi tiết (kèm ngân hàng có đáp án nếu máy chưa có) → CẤT ngân hàng + số câu vào IndexedDB → giữ bản chi tiết trong bộ nhớ ~90 s. Bấm vào ca ⇒ màn theo dõi
// dùng ngay bản đã có (vẽ tức thì) rồi tự làm mới ngầm; ca chưa kịp tải sẵn ⇒ chạy như cũ. Mọi lỗi im lặng; một lượt lỗi ⇒ dừng cả hàng (không dồn tải lên máy chủ).
import { chiTietCa, type ChiTietCa } from './exam-api'
import { docSoCauCa, loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret, luuSoCauCa, saveSessionTeacherBank } from './exam-db'

const TOI_DA_CA = 5
const HAN_CACHE_MS = 90_000
const NGHI_GIUA_CA_MS = 600

interface MucCa { ct: ChiTietCa; luc: number }
const cache = new Map<string, MucCa>()
const xong = new Map<string, number>() // maCa → lúc tải sẵn xong (không tải lại trong 5 phút)
const hang: string[] = []
let dangChay = false

/** Bản chi tiết đã tải sẵn còn mới (≤ 90 s) — lấy MỘT lần (màn theo dõi dùng rồi tự làm mới ngầm). Không có ⇒ null. */
export function layCaNapTruoc(maCa: string): { ct: ChiTietCa; tuoiMs: number } | null {
  const m = cache.get(maCa)
  cache.delete(maCa)
  return m && Date.now() - m.luc <= HAN_CACHE_MS ? { ct: m.ct, tuoiMs: Date.now() - m.luc } : null
}

const mangYeu = (): boolean => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!c && (c.saveData === true || /^(slow-)?2g$/.test(c.effectiveType ?? ''))
}
const nghi = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const ranh = () => new Promise<void>((r) => { const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback; ric ? ric(() => r(), { timeout: 1500 }) : setTimeout(r, 200) })

async function napMotCa(ma: string, url: string, mat: string): Promise<boolean> {
  const bankCu = await loadSessionTeacherBank(ma)
  const ct = await chiTietCa(url, mat, ma, !bankCu)
  // Cất như `tai()` của ExamMonitorScreen: ngân hàng có đáp án + số câu (thiếu số câu ⇒ màn theo dõi không biết cấu trúc đề khi lần sau chỉ đi đường nhanh).
  if (!bankCu && ct.keyBank && (ct.keyBank.phanI.length || ct.keyBank.phanII.length || ct.keyBank.phanIII.length)) {
    await saveSessionTeacherBank(ma, [{ maDe: ct.ca.maCa, phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII }])
  }
  const scLocal = await docSoCauCa(ma)
  const scServer = (ct.keyBank as { soCau?: { I: number; II: number; III: number } } | undefined)?.soCau
  if (!scLocal && scServer && scServer.I + scServer.II + scServer.III > 0) await luuSoCauCa(ma, scServer as never)
  cache.set(ma, { ct, luc: Date.now() })
  xong.set(ma, Date.now())
  return true
}

async function chay(): Promise<void> {
  if (dangChay) return
  dangChay = true
  try {
    const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
    if (!url.trim() || !mat.trim()) return
    while (hang.length) {
      if (document.hidden || mangYeu()) break
      const ma = hang.shift()!
      if (cache.has(ma) || Date.now() - (xong.get(ma) ?? 0) < 5 * 60_000) continue
      await ranh()
      try { await napMotCa(ma, url.trim(), mat.trim()) } catch { hang.length = 0; break } // lỗi ⇒ dừng cả hàng
      await nghi(NGHI_GIUA_CA_MS)
    }
  } catch { /* chưa có cấu hình ⇒ thôi */ } finally { dangChay = false }
}

/** Đưa các ca vào hàng tải sẵn: đang mở trước, rồi mới nhất, tối đa 5. */
export function napTruocCaThay(ds: readonly { maCa: string; trangThai: string; moLuc?: string; loai?: string }[]): void {
  if (typeof document === 'undefined') return
  const ma = [...ds].filter((c) => c.trangThai !== 'da_xoa' && c.loai !== 'baitap')
    .sort((a, b) => (a.trangThai === 'mo' ? 0 : 1) - (b.trangThai === 'mo' ? 0 : 1) || String(b.moLuc ?? '').localeCompare(String(a.moLuc ?? '')))
    .slice(0, TOI_DA_CA).map((c) => c.maCa)
  for (const m of ma) if (!hang.includes(m)) hang.push(m)
  void chay()
}

/** Chạm / rê vào MỘT ca: tải sẵn ngay ca ấy (đứng đầu hàng), kể cả ngoài 5 ca đầu. */
export function napTruocMotCa(maCa: string): void {
  if (!maCa) return
  xong.delete(maCa)
  const i = hang.indexOf(maCa); if (i >= 0) hang.splice(i, 1)
  hang.unshift(maCa)
  void chay()
}

/** Chỉ cho test: dọn trạng thái. */
export function xoaNapTruocCaThay(): void { cache.clear(); xong.clear(); hang.length = 0; dangChay = false }
