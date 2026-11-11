// XEM LẠI LIVE — MÁY GHI, PHẦN CẮT KHÚC (đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.2; rủi ro R3, R4). Thuần: không DOM, không mạng — bộ mã hoá truyền vào.
// Khúc cắt theo SỐ MẪU đã nạp (không theo bộ hẹn giờ ⇒ thẻ live xuống nền, trình duyệt bóp hẹn giờ vẫn cắt đúng): cứ đủ 10 giây mẫu vào là đóng một khúc
// gồm các KHUNG MP3 trọn vẹn bộ mã hoá đã nhả ra. Bộ mã hoá chạy LIỀN suốt phiên ghi ⇒ nối các khúc theo thứ tự = đúng luồng MP3 gốc.
// GIỜ: mẫu vào thứ n ↔ giờ máy thầy `e0 + n / hz` (ms). `e0` ước từ dấu giờ các lô mẫu của AudioWorklet (lấy giá trị NHỎ NHẤT trong 30 giây gần nhất =
// lô ít trễ nhất) và được ước lại ở MỖI khúc ⇒ đồng hồ thẻ âm thanh trôi so với đồng hồ máy không cộng dồn. Nét của thầy đánh mốc bằng cùng `Date.now()`.
import { mucTuRms, MUC_MS, type DauKhuc } from './xem-lai-khuc'
import { HZ_LIVE, MAU_MOI_KHUNG, TRE_LAME_MAU, tachKhung } from './xem-lai-mp3'

export const GIAY_MOI_KHUC = 10
/** Độ trễ từ mic tới lúc AudioWorklet nhận mẫu (ước lượng; đợt X0 đo lại bằng tiếng gõ bút). */
export const TRE_VAO_MS = 20
const CUA_SO_E0_MS = 30_000

export interface KhucRa { stt: number; dau: DauKhuc; mp3: Uint8Array<ArrayBuffer> }
export interface BoMaHoa {
  /** Nạp mẫu mono −1..1, trả các byte MP3 vừa nhả (có thể rỗng). Kết quả được chép ngay. */
  maHoa(pcm: Float32Array): Uint8Array
  /** Xả nốt các khung cuối. */
  ketThuc(): Uint8Array
}

export class BoCatKhuc {
  private mauVao = 0
  private mauKhuc: number
  private mauMuc: number
  private stt = 0
  private khungTruoc = 0
  private cho: Uint8Array[] = []
  private du: Uint8Array = new Uint8Array(0)
  private soKhungCho = 0
  private muc: number[] = []
  private tongBp = 0
  private soBp = 0
  private net: [string, number][] = []
  private lech: { luc: number; d: number }[] = []
  private e0: number | null = null

  private hz: number
  private ma: BoMaHoa
  private khiKhuc: (k: KhucRa) => void
  constructor(hz: number, ma: BoMaHoa, khiKhuc: (k: KhucRa) => void) {
    this.hz = hz; this.ma = ma; this.khiKhuc = khiKhuc
    this.mauKhuc = Math.round(hz * GIAY_MOI_KHUC)
    this.mauMuc = Math.round((hz * MUC_MS) / 1000)
  }

  /** Dấu giờ của một lô mẫu: `khungDau` = số mẫu trước lô (đếm ở AudioWorklet), `luc` = `Date.now()` lúc lô rời AudioWorklet. */
  datMoc(khungDau: number, dai: number, luc: number): void {
    const d = luc - ((khungDau + dai) * 1000) / this.hz
    this.lech.push({ luc, d })
    while (this.lech.length > 1 && luc - this.lech[0]!.luc > CUA_SO_E0_MS) this.lech.shift()
    let nho = Infinity
    for (const x of this.lech) if (x.d < nho) nho = x.d
    this.e0 = nho - TRE_VAO_MS
  }
  /** Giờ máy thầy (ms) của mẫu vào thứ `n`. */
  gioCua(n: number): number { return (this.e0 ?? Date.now()) + (n * 1000) / this.hz }
  /** Mốc giờ bắt đầu một nét (giờ máy thầy) — đi kèm khúc đang ghi. */
  danhDau(id: string, t: number): void { if (this.net.length < 200) this.net.push([String(id).slice(0, 40), t]) }

  private nhan(b: Uint8Array): void {
    if (!b.length) return
    const tat = new Uint8Array(this.du.length + b.length)
    tat.set(this.du); tat.set(b, this.du.length)
    const t = tachKhung(tat)
    if (t.khung.length) {
      // chép gọn các khung tiếng (bỏ khung Info / rác) thành một mảng
      const ra = new Uint8Array(t.khung.reduce((s, k) => s + k.dai, 0))
      let o = 0
      for (const k of t.khung) { ra.set(tat.subarray(k.vt, k.vt + k.dai), o); o += k.dai }
      this.cho.push(ra); this.soKhungCho += t.khung.length
    }
    this.du = tat.slice(t.du)
  }
  private dongKhuc(): void {
    const kh = this.soKhungCho
    const mp3 = new Uint8Array(this.cho.reduce((s, x) => s + x.length, 0))
    let o = 0
    for (const x of this.cho) { mp3.set(x, o); o += x.length }
    // Khung thứ k của luồng ↔ mẫu vào (k × 576 − độ trễ LAME) ở tần số ra 24 kHz.
    const t0 = Math.round((this.e0 ?? Date.now()) + ((this.khungTruoc * MAU_MOI_KHUNG - TRE_LAME_MAU) * 1000) / HZ_LIVE)
    const tm = Math.round(this.gioCua(this.stt * this.mauKhuc))
    const dau: DauKhuc = { v: 1, t0, kh, tm, muc: this.muc, net: this.net.map(([id, t]) => [id, Math.round(t - t0)] as [string, number]) }
    this.khungTruoc += kh; this.cho = []; this.soKhungCho = 0; this.muc = []; this.net = []
    const stt = this.stt++
    if (kh > 0) this.khiKhuc({ stt, dau, mp3 })
  }
  /** Nạp một lô mẫu (cỡ bất kỳ). Lô vắt qua mốc 10 giây ⇒ tách đúng tại mốc. */
  nap(pcm: Float32Array): void {
    let o = 0
    while (o < pcm.length) {
      const conKhuc = this.mauKhuc - (this.mauVao % this.mauKhuc), conMuc = this.mauMuc - (this.mauVao % this.mauMuc)
      const n = Math.min(pcm.length - o, conKhuc, conMuc), phan = pcm.subarray(o, o + n)
      for (let i = 0; i < n; i++) { const v = phan[i]!; this.tongBp += v * v }
      this.soBp += n
      this.nhan(this.ma.maHoa(phan))
      this.mauVao += n; o += n
      if (this.mauVao % this.mauMuc === 0) { this.muc.push(mucTuRms(Math.sqrt(this.tongBp / Math.max(1, this.soBp)))); this.tongBp = 0; this.soBp = 0 }
      if (this.mauVao % this.mauKhuc === 0) this.dongKhuc()
    }
  }
  /** Dừng ghi: xả bộ mã hoá, đóng khúc cuối (ngắn hơn 10 giây). */
  dong(): void {
    this.nhan(this.ma.ketThuc())
    if (this.soBp) { this.muc.push(mucTuRms(Math.sqrt(this.tongBp / this.soBp))); this.tongBp = 0; this.soBp = 0 }
    this.dongKhuc()
  }
  soDo(): { mauVao: number; khung: number; khuc: number } { return { mauVao: this.mauVao, khung: this.khungTruoc, khuc: this.stt } }
}
