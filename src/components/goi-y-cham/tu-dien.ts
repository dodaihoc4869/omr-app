// CỬA DUY NHẤT tới lõi «Chạm để hiểu đề» của làn A (src/lib/goi-y-cham/: phat-hien · the-cham · tu-dien-chat — kéo cả từ điển ~395 chất,
// ~17,5 KB nén) ⇒ nạp LƯỜI một lần cho cả phiên, mảnh `tu-dien-cham` ngoài precache. Nạp hỏng (mất mạng lần đầu) ⇒ null ⇒ đề trơn như cũ;
// câu sau thử nạp lại.
import type { TheGiaiNghia, VungCham } from '../../lib/goi-y-cham/kieu'

export type TuDien = {
  phatHien: (chuDe: string) => VungCham[]
  /** `chuDe`: chữ đề chứa vùng — đề có «Cho nguyên tử khối …» thì M tính theo đúng số của đề. */
  theCho: (vung: VungCham, chuDe?: string) => TheGiaiNghia | null
}

let hua: Promise<TuDien | null> | null = null
/** Nạp từ điển MỘT lần cho cả phiên (lần mở câu đầu). */
export function napTuDien(): Promise<TuDien | null> {
  hua ??= Promise.all([import('../../lib/goi-y-cham/phat-hien'), import('../../lib/goi-y-cham/the-cham'), import('../../lib/goi-y-cham/tu-dien-chat')]).then(
    ([a, b, c]) => {
      const ntk = new Map<string, Record<string, number>>()
      const ntkCua = (chu: string) => {
        if (!ntk.has(chu)) { try { ntk.set(chu, c.docNguyenTuKhoiTrongDe(chu).bang) } catch { ntk.set(chu, {}) } }
        const bang = ntk.get(chu)!
        return Object.keys(bang).length ? bang : undefined
      }
      return { phatHien: a.phatHien, theCho: (v: VungCham, chuDe?: string) => b.theCho(v, chuDe ? ntkCua(chuDe) : undefined, chuDe ?? '') }
    },
    () => { hua = null; return null },
  )
  return hua
}

// HÂM NÓNG (27/10 MƯỢT, đo scripts/do-muot-hs.mjs): lần dò ĐẦU của phatHien dựng các biểu thức tìm đơn vị / công thức / tên chất / từ then chốt và
// V8 dịch chúng sang mã máy ở lần chạy thứ hai — ~60 ms ở máy mạnh, 200–400 ms ở CPU ×6, rơi đúng lúc em mở câu đầu / bấm sang câu hai. Nay chạy
// sẵn lúc máy RẢNH (requestIdleCallback, mỗi lượt một câu mẫu) ⇒ lúc em mở câu chỉ còn phần dò của chính câu ấy (~1 ms máy mạnh). Không đổi kết quả.
const MAU_HAM_NONG = [
  'Hoà tan hoàn toàn 5,6 gam Fe trong 200 ml dung dịch HCl 2M thu được V lít khí H2 (đkc). Giá trị của V là bao nhiêu?',
  'Cho 0,1 mol ethyl acetate (CH3COOC2H5) tác dụng với dung dịch NaOH dư, đun nóng. Chất nào sau đây là ester? Phát biểu nào không đúng?',
]
let daHamNong = false
type RanhCb = (f: () => void, o?: { timeout: number }) => unknown
/** Nạp từ điển + chạy dò thử lúc máy rảnh (một lần mỗi phiên). Lỗi bất kỳ ⇒ bỏ qua, lần mở câu tự nạp như cũ. */
export function hamNongTuDien(): void {
  if (daHamNong || typeof window === 'undefined') return
  daHamNong = true
  const w = window as Window & { requestIdleCallback?: RanhCb }
  const ranh: RanhCb = w.requestIdleCallback ? w.requestIdleCallback.bind(w) : (f) => window.setTimeout(f, 300)
  ranh(() => {
    void napTuDien().then((td) => {
      if (!td) { daHamNong = false; return }
      let i = 0
      const buoc = () => { try { td.phatHien(MAU_HAM_NONG[i]!) } catch { /* đề trơn vẫn hiện */ } if (++i < MAU_HAM_NONG.length) ranh(buoc, { timeout: 4000 }) }
      ranh(buoc, { timeout: 4000 })
    })
  }, { timeout: 6000 })
}
