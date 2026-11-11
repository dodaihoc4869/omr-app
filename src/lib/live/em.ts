// LIVE BẢNG — MÁY EM (đặc tả docs/dac-ta-live-bang-1011.md mục 4.1, 4.4, 4.5, 4.7). Nạp lười (không vào đường mở /hs): chỉ khi `viewEm.live.san`.
// Việc: (1) tải ngầm sổ nét của phòng (bắt kịp khi vào muộn / nối lại) và giữ BẢNG hiện tại;
// (2) nối ngầm tới Cloudflare Realtime SFU khi phòng báo có phiên của thầy: kéo track tiếng (đệm jitter thấp nhất), mở kênh điểm đang viết;
//     SFU chưa cấu hình / nối hỏng ⇒ điểm đang viết đến qua WebSocket của phòng, hình vẫn chạy;
// (3) đệm phát + nội suy nét (noi-suy.ts), đồng bộ tiếng–nét, trả ra đúng SỰ KIỆN của bộ máy bút ⇒ lớp vẽ chỉ việc `taoLoiBut().apSuKien(ds, sk)`;
// (4) mở khoá phát tiếng ở lần chạm đầu; rời màn ⇒ ngừng tiếng; (5) số đo `live-do` 10 giây một lần.
// AN TOÀN: thư viện này không nhận, không giữ gì về đáp án — đề trên máy em vẫn dựng từ `viewEm.luot.cau` như cũ.
import type { NetBut, SuKienBut } from '../but-bang-loi'
import { nhomKhung, type ViewLiveEm } from '../bpu/phong-live'
import { giaiGoi, giaiSo } from './ma-net'
import { taoDemPhat, type ButThay } from './noi-suy'
import { apMuc, datLai, taoBang, type BangNet } from './so-net'
import { taoSoDo, TRE_CO_DINH_EM, treKhungOpus, treTiengUocTinh } from './so-do'
import { boLoa, theAmLoa } from './loa'
import { taoLuoiPhat } from './luoi-tieng'
import { doTieng } from './do-tieng'
import { ngheThat, type SoTieng } from './so-tieng'
import { OPUS_EM, choIce, choKenhMo, choNoi, docSoWebRtc, goiCua, moiTruongMacDinh, suaSdpOpus, traLoiMoi, type KenhPhong, type MoiTruongLive } from './sfu'

export interface TuyChonLiveEm {
  /** Vé phòng của em (`/hs/bpu/ve` hoặc `/hs/bpu/cua-em`). */
  ve: string
  goc: string
  kenh: KenhPhong
  /** Sự kiện bút cho LỚP ĐÃ CHỐT + nét đang viết: áp bằng `taoLoiBut().apSuKien(ds, sk)` rồi vẽ. Gọi theo đúng thứ tự. */
  khiBut?: (sk: SuKienBut) => void
  khiTrangThai?: (tt: TrangThaiLiveEm) => void
  /** Máy yếu (`ddh.mayYeu`): đệm phát + 16 ms. */
  mayYeu?: boolean
  /** Em vừa được gọi lên bảng lúc đang live ⇒ thư viện TỰ gọi `batMicLenBang()` (thầy 10/11 «tự động bật mic cho bạn lên bảng»). Mặc định tắt: lớp giao diện tự gọi. */
  tuBatMic?: boolean
  moiTruong?: Partial<MoiTruongLive>
}
export interface TrangThaiLiveEm {
  /** Công tắc live bật và em được xem. */
  duocXem: boolean
  san: boolean
  /** Thầy đang live ⇒ bật lớp bảng live. */
  bat: boolean
  tu: number | null
  /** chua-cau-hinh = Worker chưa có khoá SFU · cho = chưa nối · dang-noi · co = đang có tiếng · bi-chan = trình duyệt chặn tự phát («Chạm để bật tiếng thầy») · loi = nối hỏng */
  tieng: 'chua-cau-hinh' | 'cho' | 'dang-noi' | 'co' | 'bi-chan' | 'loi'
  /** Em đang BẬT nghe tiếng (mặc định theo phòng: em trong lớp tắt, em ở xa bật — điểm quyết 3). */
  nghe: boolean
  /** Điểm đang viết đến qua: dc = DataChannel · ws = WebSocket của phòng. */
  kenhNet: 'dc' | 'ws'
  /** Sổ nét đã bắt kịp phòng. */
  duBang: boolean
  /** Máy em HIỆN BẢNG LIVE (thầy gọi bạn lên bảng / thầy bật tay). false mà `bat` ⇒ giữ màn câu hỏi bình thường, tiếng thầy vẫn chạy. */
  bang: boolean
  /** Em được phép bật mic lúc này (`batMicLenBang`): em đang được gọi lên bảng (mic tự bật), hoặc thầy mời nói (`duocMoi` — em phải tự chạm). */
  duocMoMic: boolean
  /** ĐỢT 2: thầy đang MỜI em nói ⇒ tấm «Thầy mời em nói» · em đang giơ tay + thứ tự trong hàng. */
  duocMoi: boolean
  tay: boolean
  hangTay: number | null
  /** Mic của em: tat · xin-quyen (hộp hỏi quyền đang hiện — KHÔNG tính rời màn) · dang-noi (đang nối lên SFU) · dang-phat (thầy và cả lớp đang nghe) · tu-choi (em / máy không cho dùng mic) · loi */
  mic: 'tat' | 'xin-quyen' | 'dang-noi' | 'dang-phat' | 'tu-choi' | 'loi'
  /** Bạn đang phát mic trên bảng (không phải em); null = không ai. */
  banNoi: { sbd: string; ten: string; doi: number } | null
  /** Thầy đang TẠM DỪNG live (11/11): tiếng và nét ngừng tới, phiên giữ nguyên — hiện «Thầy tạm dừng live». */
  nghi: boolean
}
export type KetQuaMicEm = { ok: true } | { ok: false; lyDo: 'chua-duoc-moi' | 'chua-noi' | 'mic-tu-choi' | 'khong-mic' | 'mic-loi' | 'sfu-loi' }
export interface KhungLiveEm {
  /** Đầu nét nội suy của từng nét đang viết (vẽ làm đuôi sau các điểm đã phát qua `khiBut`). */
  dau: { id: string; x: number; y: number; apLuc: number }[]
  /** Con trỏ bút lơ lửng của thầy; null = ẩn. */
  tro: { x: number; y: number } | null
  /** (11/11) CÂY BÚT của thầy: MỘT vị trí cho con trỏ — đang viết thì ở đúng đầu nét (`cham`), không thì theo bút lơ lửng; null = ẩn. */
  but: ButThay | null
  /** (11/11) Độ cuộn bảng đen của thầy (số lần bề dọc cửa sổ thầy); null = chưa biết ⇒ lớp vẽ tự trôi theo bút. */
  cuon: number | null
}

const CAM = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
const NHIP_SO_MS = 1000
const NHIP_DO_MS = 10_000
const RAI_NOI_MS = 20_000
const RAI_BU_MS = 3000
/** Bản chốt của nét đang phát dở chờ tối đa ngần này (đệm phát D ≤ 150 ms + dư) rồi chốt luôn. */
const CHO_CHOT_MS = 400

/** Âm lượng tiếng thầy trên máy em ĐANG PHÁT MIC: mic có khử vọng của trình duyệt ⇒ 1; không (hoặc chưa biết) ⇒ 0,6. */
export function amLuongKhiNoi(l: MediaStream | null): number {
  try { return l?.getAudioTracks()[0]?.getSettings().echoCancellation === true ? 1 : 0.6 } catch { return 0.6 }
}

export function taoLiveEm(tuy: TuyChonLiveEm) {
  const mt: MoiTruongLive = { ...moiTruongMacDinh(), ...tuy.moiTruong }
  const tt: TrangThaiLiveEm = { duocXem: false, san: false, bat: false, tu: null, tieng: 'cho', nghe: false, kenhNet: 'ws', duBang: false, bang: false, duocMoMic: false, duocMoi: false, tay: false, hangTay: null, mic: 'tat', banNoi: null, nghi: false }
  const bang: BangNet = taoBang()
  const dem = taoDemPhat({ mayYeu: tuy.mayYeu })
  const soDo = taoSoDo()
  let live: ViewLiveEm = null
  let huyRoi = false, roiMan = false, ngheDat: boolean | null = null, daCham = false, hienBang: boolean | null = null
  let pc: RTCPeerConnection | null = null, dc: RTCDataChannel | null = null, nguonNoi = '', doi = 0, henNoi: unknown = null
  let am: HTMLAudioElement | null = null, thu: RTCRtpReceiver | null = null
  // Mic của em được gọi lên bảng + tiếng của bạn đang phát mic.
  let phienCuaEm = '', hangSfu: Promise<unknown> = Promise.resolve(), trackSapToi: 'thay' | 'ban' = 'thay'
  let micLuong: MediaStream | null = null, micTx: RTCRtpTransceiver | null = null, dangXinMic = false, hetXinMic = -1e9
  let amCtx: AudioContext | null = null, doAm: AnalyserNode | null = null, mauAm: Float32Array<ArrayBuffer> | null = null
  let amBan: HTMLAudioElement | null = null, thuBan: RTCRtpReceiver | null = null, banDangKeo = '', henBan: unknown = null
  let midThay: string | null = null, banSo: { goi: number; mucAm: number } = { goi: 0, mucAm: 0 }
  let okPhien = -1, okDc: boolean | null = null, okNghe: boolean | null = null
  /** Đang xin điểm qua đường phụ WebSocket (DataChannel thủng) · mức mạng của nét cho giao diện (0 tốt · 1 đang nới đệm · 2 kém). */
  let troWs = false, mucMang: 0 | 1 | 2 = 0, dNay = 0
  let henBu: unknown = null, choSo = false, lucXinBu = -1e9
  /** ĐO TIẾNG TỪ XA (do-tieng.ts): bản tóm tắt gần nhất (đi kèm `live-do`) + «đang nghe thật» theo năng lượng và thẻ phát (đi kèm `live-ok`). */
  let tiNay: SoTieng | null = null, ngheTi: boolean | null = null, lucTi = -1e9, dangDoTi = false, loiSfu = ''
  let henSo: unknown = null, lucDo = 0, demTruoc: { tong: number; so: number } | null = null, mucAmThay = 0, rtt: number | null = null, demRung: number | null = null, giayLech = false
  /** Nét đang viết đã phát ra lớp vẽ: id → số điểm đã phát. */
  const dangVe = new Map<string, number>()

  const bao = (): void => { tuy.khiTrangThai?.({ ...tt }) }
  const dat = (o: Partial<TrangThaiLiveEm>): void => {
    let doiTt = false
    for (const k of Object.keys(o) as (keyof TrangThaiLiveEm)[]) if (tt[k] !== o[k]) { (tt as unknown as Record<string, unknown>)[k] = o[k]; doiTt = true }
    if (doiTt) { bao(); if ('nghe' in o || 'tieng' in o) baoOk() } // nghe / hết nghe ⇒ báo phòng (thầy thấy «mấy em đang nghe»)
  }
  const but = (sk: SuKienBut): void => { try { tuy.khiBut?.(sk) } catch { /* lớp vẽ lỗi không làm hỏng luồng nhận */ } }
  const dcMo = (): boolean => !!dc && dc.readyState === 'open'

  // ── TIẾNG ──
  /** Tiếng thầy + tiếng bạn: tắt khi em tắt nghe / rời màn. Em ĐANG PHÁT MIC ⇒ âm lượng theo `amLuongKhiNoi` (có khử vọng ⇒ 1, không ⇒ 0,6). */
  /** Loa máy em ĐANG PHÁT tiếng thầy thật: có luồng, em không tắt tiếng, trình duyệt không chặn phát, em không rời màn. */
  const dangNghe = (): boolean => !!am && !!am.srcObject && tt.nghe && tt.tieng === 'co' && !roiMan
  const capNhatTieng = (): void => {
    // 11/11 tối (thầy: em lên bảng không nghe thầy): bản cũ hạ còn 0,25 — trên điện thoại (trình duyệt chuyển tiếng sang loa thoại khi mic mở) gần như câm.
    // Khử vọng của trình duyệt ĐANG chạy trên mic em ⇒ để nguyên 1; không có khử vọng ⇒ 0,6 (vẫn nghe rõ, bớt phần lọt vào mic).
    if (am) { am.muted = !tt.nghe || roiMan; try { am.volume = tt.mic === 'dang-phat' || tt.mic === 'dang-noi' ? amLuongKhiNoi(micLuong) : 1 } catch { /* iPhone */ } }
    if (amBan) amBan.muted = !tt.nghe || roiMan
  }
  /** Mọi thay đổi trên phiên SFU của máy em đi NỐI TIẾP (một phiên chỉ có một máy trạng thái lời mời / trả lời — tài liệu «Serialize mutations per session»). */
  const xepSfu = <T,>(f: () => Promise<T>): Promise<T> => { const p = hangSfu.then(f, f); hangSfu = p.catch(() => undefined); return p }
  function phatTieng(): void {
    if (!am || !am.srcObject) return
    capNhatTieng()
    void am.play().then(() => { dat({ tieng: 'co' }) }, () => { dat({ tieng: 'bi-chan' }) })
  }
  /** GỌI TRONG LẦN CHẠM ĐẦU của em trong buổi (vd. cú chạm vào toàn màn hình): mở khoá phát tiếng ⇒ sau này có tiếng thật không cần chạm nữa. */
  async function moKhoaTieng(): Promise<boolean> {
    daCham = true
    try {
      am = am ?? theAmLoa()
      am.autoplay = true
      am.setAttribute('playsinline', '')
      if (amBan?.srcObject) void amBan.play().catch(() => undefined)
      if (am.srcObject) { capNhatTieng(); await am.play(); dat({ tieng: 'co' }); return true }
      // Chưa có luồng tiếng: phát một tệp câm trong cú chạm để trình duyệt ghi nhận thẻ này đã được người dùng cho phát.
      am.src = CAM; am.muted = true
      await am.play().catch(() => undefined)
      return true
    } catch { return false }
  }
  /** Em bật / tắt nghe tiếng thầy (nút «Tiếng: Đang bật / Đang tắt»). */
  function datTieng(nghe: boolean): void { ngheDat = nghe; dat({ nghe }); capNhatTieng(); if (nghe) { phatTieng(); soatMic() } }
  /** Rời màn (đặc tả 4.7): tiếng NGỪNG trong lúc em ở app khác; về lại nghe tiếp từ hiện tại, không phát bù. */
  function datRoiMan(roi: boolean): void { roiMan = roi; if (roi) tatMic(); capNhatTieng(); baoOk(); if (!roi) { dem.xoa(); phatTieng(); soatMic() } }

  // ── SFU ──
  function dongSfu(): void {
    doi += 1
    mt.huyHen(henNoi); henNoi = null
    try { dc?.close() } catch { /* đã đóng */ }
    try { pc?.close() } catch { /* đã đóng */ }
    pc = null; dc = null; thu = null; nguonNoi = ''; demTruoc = null; phienCuaEm = ''; banDangKeo = ''
    ngatMic('tat')
    if (am) am.srcObject = null
    if (amBan) amBan.srcObject = null
    dat({ kenhNet: 'ws', tieng: live?.tieng === 'chua-cau-hinh' ? 'chua-cau-hinh' : 'cho' })
  }
  async function noiSfu(ss: NonNullable<NonNullable<ViewLiveEm>['ss']>): Promise<void> {
    const doiNay = ++doi
    nguonNoi = ss.id
    dat({ tieng: 'dang-noi' })
    let p: RTCPeerConnection | null = null
    const con = (): boolean => !huyRoi && doiNay === doi
    try {
      p = mt.taoPc({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }], bundlePolicy: 'max-bundle' })
      const pcNay = p
      p.addEventListener('track', (e) => {
        if (!con() || e.track.kind !== 'audio') return
        if (trackSapToi === 'ban') {
          // Tiếng của bạn đang phát mic trên bảng.
          thuBan = e.receiver
          try { (e.receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0 } catch { /* không hỗ trợ */ }
          try { (e.receiver as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0 } catch { /* không hỗ trợ */ }
          amBan = amBan ?? theAmLoa()
          amBan.autoplay = true; amBan.setAttribute('playsinline', '')
          amBan.srcObject = new MediaStream([e.track])
          capNhatTieng()
          void amBan.play().catch(() => undefined)
          return
        }
        thu = e.receiver
        // Đệm jitter thấp nhất, để trình duyệt tự thích ứng (đặc tả 4.2).
        try { (e.receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0 } catch { /* không hỗ trợ */ }
        try { (e.receiver as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0 } catch { /* không hỗ trợ */ }
        am = am ?? theAmLoa()
        am.autoplay = true
        am.setAttribute('playsinline', '')
        am.removeAttribute('src')
        am.srcObject = new MediaStream([e.track])
        phatTieng()
      })
      const r = await goiCua(mt, tuy.goc, 'noi', { ve: tuy.ve, nguon: ss.id, ten: [ss.tieng ?? 'thay'] })
      if (!con()) { p.close(); return }
      if (!r.ok || !r.phien || !r.sdp) throw new Error(r.lyDo ?? 'sfu')
      const phien = r.phien
      midThay = r.tracks?.[0]?.mid ?? null
      trackSapToi = 'thay'
      let d = await goiCua(mt, tuy.goc, 'dap', { ve: tuy.ve, phien, sdp: await traLoiMoi(p, mt, r.sdp), kenh: ss.kenh != null })
      if (!con()) { p.close(); return }
      if (!d.ok && !d.dapXong) throw new Error(d.lyDo ?? 'dap')
      // Có lời mời mới = đường DataChannel đã dựng ⇒ trả lời lần hai.
      let coKenh = d.ok && !!d.sdp
      if (coKenh) { d = await goiCua(mt, tuy.goc, 'dap', { ve: tuy.ve, phien, sdp: await traLoiMoi(p, mt, d.sdp!) }); coKenh = d.ok }
      if (!con()) { p.close(); return }
      if (!(await choNoi(p, mt))) throw new Error('khong-noi')
      if (!con()) { p.close(); return }
      pc = p; phienCuaEm = phien; loiSfu = ''
      p.addEventListener('connectionstatechange', () => {
        if (pc !== pcNay || !con()) return
        // Mất kết nối quá 5 giây ⇒ tạo phiên mới (đặc tả mục 5).
        if (pcNay.connectionState === 'failed') noiLaiSfu(0)
        else if (pcNay.connectionState === 'disconnected') mt.hen(() => { if (pc === pcNay && pcNay.connectionState !== 'connected') noiLaiSfu(0) }, 5000)
      })
      if (coKenh && ss.kenh) {
        const c = await goiCua(mt, tuy.goc, 'kenh', { ve: tuy.ve, phien, ten: ss.kenh, nguon: ss.id })
        if (!con()) return
        if (c.ok && typeof c.id === 'number') {
          const k = p.createDataChannel(ss.kenh, { negotiated: true, id: c.id, ordered: false, maxRetransmits: 0 })
          k.binaryType = 'arraybuffer'
          k.addEventListener('message', (e) => { if (e.data instanceof ArrayBuffer) nhanDiem(e.data, false) })
          k.addEventListener('close', () => { if (dc === k) { dc = null; dat({ kenhNet: 'ws' }); baoOk() } })
          if (await choKenhMo(k, mt)) { if (!con()) return; dc = k; dat({ kenhNet: 'dc' }) } else { try { k.close() } catch { /* đã đóng */ } }
        }
      }
      baoOk()
      soatMic()
    } catch (e) {
      try { p?.close() } catch { /* đã đóng */ }
      if (!con()) return
      loiSfu = e instanceof Error ? e.message.slice(0, 20) : 'sfu' // đo từ xa: 'khong-noi' = ICE / DTLS không lên
      pc = null; dc = null; nguonNoi = ''
      dat({ tieng: 'loi', kenhNet: 'ws' })
      baoOk()
      noiLaiSfu(8000)
    }
  }
  function noiLaiSfu(sauMs: number): void {
    if (huyRoi) return
    dongSfu()
    const ss = live?.ss
    if (!ss || !live?.duocXem || live.tieng === 'chua-cau-hinh') return
    henNoi = mt.hen(() => { henNoi = null; const s = live?.ss; if (s && !pc && !huyRoi) void xepSfu(() => noiSfu(s)) }, sauMs)
  }

  // ── MIC CỦA EM ĐƯỢC GỌI LÊN BẢNG + TIẾNG CỦA BẠN ĐANG PHÁT MIC (thầy 10/11) ──
  /** Thả mic tại máy em (không báo phòng). Transceiver cũ để `inactive`; lần sau thêm transceiver mới. */
  function ngatMic(sau: TrangThaiLiveEm['mic']): void {
    for (const t of micLuong?.getTracks() ?? []) t.stop()
    micLuong = null; doAm = null
    if (micTx) { const tx = micTx; micTx = null; void tx.sender.replaceTrack(null).catch(() => undefined); try { tx.direction = 'inactive' } catch { /* đã đóng */ } }
    if (tt.mic !== sau) dat({ mic: sau })
    capNhatTieng()
  }
  /** Em tắt mic (nút «Xong, tắt mic») — báo phòng gỡ để các máy khác thôi nghe. Thầy thu mic / chấm xong / lượt mới thì thư viện tự tắt. */
  function tatMic(): void {
    const dangMo = tt.mic === 'dang-phat' || tt.mic === 'dang-noi'
    ngatMic('tat')
    if (dangMo) tuy.kenh.gui({ t: 'live-mic-tat' })
  }
  /** Hộp hỏi quyền mic đang hiện (hoặc vừa đóng < 0,6 giây) ⇒ bộ bắt rời màn KHÔNG tính «cửa sổ nổi» / mất tiêu điểm lúc này (đặc tả 4.7). */
  const dangChoQuyenMic = (): boolean => dangXinMic || mt.dongHo() - hetXinMic < 600
  /** BẬT MIC cho em đang được gọi lên bảng: xin quyền mic (khử vọng, lọc ồn, tự chỉnh âm lượng, mono) ⇒ phát track lên SFU qua cửa `/bpu/live/phat`
   *  (máy chủ hỏi phòng: chỉ em đang được gọi mới được) ⇒ thầy và các máy đang bật tiếng tự kéo về nghe. Gọi lặp khi đang mở ⇒ `ok`. */
  async function batMicLenBang(): Promise<KetQuaMicEm> {
    if (tt.mic === 'dang-phat' || tt.mic === 'dang-noi' || tt.mic === 'xin-quyen') return { ok: true }
    if (!live?.emDuocMoi || roiMan) return { ok: false, lyDo: 'chua-duoc-moi' }
    if (!pc || !phienCuaEm) return { ok: false, lyDo: 'chua-noi' }
    dat({ mic: 'xin-quyen' })
    let luong: MediaStream
    dangXinMic = true
    try { luong = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }) } catch (e) {
      const ten = (e as { name?: string })?.name ?? ''
      dat({ mic: ten === 'NotAllowedError' || ten === 'SecurityError' ? 'tu-choi' : 'loi' })
      // Đợt 2 (đặc tả 4.8 bước 3): em ĐƯỢC MỜI mà không bật được mic ⇒ báo phòng: lời mời thôi, màn chiếu ghi «chưa bật được mic».
      if (live?.emMoi) tuy.kenh.gui({ t: 'live-mic-loi', ly: tt.mic === 'tu-choi' ? 'tu-choi' : 'loi' })
      return { ok: false, lyDo: ten === 'NotAllowedError' || ten === 'SecurityError' ? 'mic-tu-choi' : ten === 'NotFoundError' || ten === 'OverconstrainedError' ? 'khong-mic' : 'mic-loi' }
    } finally { dangXinMic = false; hetXinMic = mt.dongHo() }
    const track = luong.getAudioTracks()[0]
    // Trong lúc hộp quyền hiện, thầy có thể đã chấm / chuyển câu.
    if (!track || !live?.emDuocMoi || roiMan || !pc || huyRoi) { for (const t of luong.getTracks()) t.stop(); dat({ mic: 'tat' }); return { ok: false, lyDo: track ? 'chua-duoc-moi' : 'khong-mic' } }
    try { track.contentHint = 'speech' } catch { /* trình duyệt cũ */ }
    micLuong = luong
    dat({ mic: 'dang-noi' }); capNhatTieng()
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      amCtx = amCtx ?? new Ctx(); void amCtx.resume().catch(() => undefined)
      doAm = amCtx.createAnalyser(); doAm.fftSize = 512; amCtx.createMediaStreamSource(luong).connect(doAm); mauAm = new Float32Array(doAm.fftSize)
    } catch { doAm = null }
    return xepSfu(async (): Promise<KetQuaMicEm> => {
      const p = pc, phien = phienCuaEm
      if (!p || !phien || micLuong !== luong) { if (micLuong === luong) ngatMic('tat'); return { ok: false, lyDo: 'chua-noi' } }
      let tx: RTCRtpTransceiver | null = null
      try {
        tx = p.addTransceiver(track, { direction: 'sendonly' })
        micTx = tx
        await p.setLocalDescription({ type: 'offer', sdp: suaSdpOpus((await p.createOffer()).sdp ?? '', OPUS_EM) })
        await choIce(p, mt)
        const r = await goiCua(mt, tuy.goc, 'phat', { ve: tuy.ve, phien, sdp: p.localDescription?.sdp ?? '', tracks: [{ mid: tx.mid ?? '', ten: 'mic' }] })
        // Có câu trả lời của SFU thì luôn áp (kể cả khi phòng từ chối sau đó) để máy trạng thái SDP về ổn định; không có ⇒ lùi lời mời.
        if (r.sdp) {
          await p.setRemoteDescription({ type: 'answer', sdp: suaSdpOpus(r.sdp, OPUS_EM) })
          try { const ts = tx.sender.getParameters(); if (ts.encodings?.length) { ts.encodings[0]!.maxBitrate = OPUS_EM.bitrate!; await tx.sender.setParameters(ts) } } catch { /* dùng trần trong SDP */ }
        } else await p.setLocalDescription({ type: 'rollback' }).catch(() => undefined)
        if (!r.ok) {
          ngatMic(r.lyDo === 'chua-duoc-moi' ? 'tat' : 'loi')
          if (r.lyDo !== 'chua-duoc-moi' && live?.emMoi) tuy.kenh.gui({ t: 'live-mic-loi', ly: 'loi' })
          return { ok: false, lyDo: r.lyDo === 'chua-duoc-moi' ? 'chua-duoc-moi' : 'sfu-loi' }
        }
        if (micLuong !== luong) return { ok: false, lyDo: 'chua-duoc-moi' } // đã bị thu trong lúc nối
        dat({ mic: 'dang-phat' }); capNhatTieng()
        return { ok: true }
      } catch { if (micLuong === luong) ngatMic('loi'); if (live?.emMoi) tuy.kenh.gui({ t: 'live-mic-loi', ly: 'loi' }); return { ok: false, lyDo: 'sfu-loi' } }
    })
  }
  // ── ĐỢT 2 · GIƠ TAY / ĐƯỢC MỜI (đặc tả 4.8) ──
  /** Em bấm «Giơ tay» (true) / chạm lần nữa để hạ (false). Phòng xếp hàng theo thứ tự; trạng thái về qua view (`tay`, `hangTay`). */
  function gioTay(gio: boolean): void { if (live?.bat) tuy.kenh.gui({ t: 'live-tay', v: gio }) }
  /** Em bấm «Để sau» trên tấm «Thầy mời em nói». */
  function deSau(): void { if (live?.emMoi) tuy.kenh.gui({ t: 'live-de-sau' }) }
  /** Lớp giao diện báo máy em có đang HIỆN bảng live không (11/11: em gửi đáp án xong tự về bảng live dù cờ phòng `bang` tắt). Thôi hiện ⇒ bỏ nét đang viết dở. */
  function datHienBang(hien: boolean): void {
    if (hienBang === hien) return
    hienBang = hien
    if (!hien) { dem.xoa(); for (const id of dangVe.keys()) but({ loai: 'xoa', trang: bang.trang, id: [id] }); dangVe.clear() }
  }
  /** Lớp giấy báo: giấy đề trên máy em xuống dòng KHÁC giấy của thầy (đang ẩn nét trên giấy) ⇒ đi kèm số đo `live-do` (rủi ro R3). */
  function datGiayLech(lech: boolean): void { giayLech = lech }
  /** Mức âm mic của em 0..1 (cho sóng «Em đang nói»). */
  function mucAmMic(): number {
    if (!doAm || !mauAm) return 0
    doAm.getFloatTimeDomainData(mauAm)
    let tong = 0
    for (let i = 0; i < mauAm.length; i++) tong += mauAm[i]! * mauAm[i]!
    return Math.min(1, Math.sqrt(tong / mauAm.length) * 4)
  }
  /** Kéo tiếng của bạn đang phát mic về phiên của máy em (chỉ khi em đang bật nghe; rải 0–0,8 giây để cả lớp không dồn một lúc). Không kéo tiếng của chính mình. */
  function keoBan(): void {
    henBan = null
    const n = live?.noi[0]
    if (!n || live?.emNoi || !tt.nghe || roiMan || !pc || !phienCuaEm || banDangKeo === n.ss.id) return
    const nguon = n.ss.id, ten = n.ss.tieng
    banDangKeo = nguon
    void xepSfu(async () => {
      const p = pc, phien = phienCuaEm
      if (!p || !phien || live?.noi[0]?.ss.id !== nguon) { if (banDangKeo === nguon) banDangKeo = ''; return }
      try {
        const r = await goiCua(mt, tuy.goc, 'nhan', { ve: tuy.ve, phien, nguon, ten: [ten] })
        if (!r.ok || !r.sdp) throw new Error('nhan')
        trackSapToi = 'ban'
        const tra = await traLoiMoi(p, mt, r.sdp)
        trackSapToi = 'thay'
        await goiCua(mt, tuy.goc, 'dap', { ve: tuy.ve, phien, sdp: tra })
      } catch { trackSapToi = 'thay'; if (banDangKeo === nguon) banDangKeo = '' }
    })
  }
  /** Mức âm tiếng của BẠN đang phát mic 0..1 (cho dải «Bạn … đang nói»; cần em đang bật nghe). */
  function mucAmBan(): number {
    if (!tt.banNoi) return 0
    try { const n = thuBan?.getSynchronizationSources?.()[0]?.audioLevel; if (typeof n === 'number') return n } catch { /* không hỗ trợ */ }
    return banSo.mucAm // dự phòng: số đo mỗi giây
  }
  /** Soát lại mic + tiếng bạn theo view mới nhất của phòng. */
  function soatMic(): void {
    const l = live
    // Phòng đã thu mic của em (thầy chấm xong, lượt mới, thầy bấm «Thu mic», tắt live) ⇒ thả mic tại máy, không báo lại.
    if (micLuong && (!l?.bat || !l.emDuocMoi)) ngatMic('tat')
    else if (!micLuong && (tt.mic === 'tu-choi' || tt.mic === 'loi') && !l?.emDuocMoi) dat({ mic: 'tat' })
    const n = l?.bat ? l.noi[0] : undefined
    const ban = n && !l?.emNoi ? { sbd: n.sbd, ten: n.ten, doi: n.doi } : null
    if ((tt.banNoi?.sbd ?? '') !== (ban?.sbd ?? '')) dat({ banNoi: ban })
    if (!n || l?.emNoi) { banDangKeo = ''; thuBan = null; if (amBan) amBan.srcObject = null; mt.huyHen(henBan); henBan = null }
    else if (banDangKeo !== n.ss.id && henBan == null) henBan = mt.hen(keoBan, mt.ngauNhien() * 800)
    if (tuy.tuBatMic && l?.bat && l.emDuocMoi && !l.emMoi && tt.mic === 'tat' && pc && !roiMan) void batMicLenBang()
  }

  // ── BẢNG ──
  /** Báo phòng em đã sẵn sàng xem (để đếm «em xem») + em có DataChannel hay cần điểm qua WebSocket. Gửi lại khi phiên / đường điểm đổi. */
  function baoOk(): void {
    if (!live?.bat || huyRoi) return
    // (12/11) DataChannel mở nhưng đang THỦNG (mất nhiều gói liền / vừa đứt) ⇒ báo như không có DataChannel: phòng gửi THÊM điểm qua WebSocket (tin cậy);
    // máy em nhận cả hai đường, ghép theo chỉ số điểm. Hết xấu 20 giây thì thôi xin.
    // «N em đang nghe» của thầy tính theo NĂNG LƯỢNG tiếng tới + thẻ đang phát thật (đo 2 giây), không theo cờ
    const coDc = dcMo() && !troWs, nghe = dangNghe() && ngheTi === true
    if (okPhien === live.phien && okDc === coDc && okNghe === nghe) return
    okPhien = live.phien; okDc = coDc; okNghe = nghe
    tuy.kenh.gui({ t: 'live-ok', dc: coDc, nghe })
  }
  function xinBu(): void {
    henBu = null
    if (huyRoi || !live?.duocXem) return
    lucXinBu = mt.dongHo(); choSo = true
    tuy.kenh.gui({ t: 'live-bu', net: bang.cuoi })
  }
  /** Hàng chờ sự kiện từ sổ nét (giữ đúng thứ tự): mục `cho` = bản chốt của một nét ĐANG được phát dở ⇒ đợi nét dở phát hết (hoặc quá hạn) rồi mới chốt,
   *  để đuôi nét không nhảy vọt và lớp vẽ không phải vẽ lại; các sự kiện tới sau xếp sau nó. */
  const hangSo: ({ cho: NetBut; sk: SuKienBut; han: number } | { ds: SuKienBut[]; don: () => void })[] = []
  /** Chốt một nét: nét dở cùng id đã phát ĐỦ điểm ⇒ chỉ báo `net-xong` (không vẽ lại); thiếu ⇒ thay bằng bản chốt. */
  function chotNet(net: NetBut, sk: SuKienBut): void {
    const daPhat = dangVe.get(net.id)
    dem.boNet(net.id); dangVe.delete(net.id)
    if (daPhat === net.diem.length) { but({ loai: 'net-xong', trang: bang.trang, id: net.id }); return }
    if (daPhat != null) but({ loai: 'xoa', trang: bang.trang, id: [net.id] })
    but(sk)
  }
  function xaHangSo(nay: number): void {
    while (hangSo.length) {
      const dau = hangSo[0]!
      // bản chốt tới khi nét dở còn đang phát: vá điểm thiếu (gói cuối mất) cho nét phát nốt, đợi nó xong rồi mới chốt
      if ('cho' in dau) { if (dem.dangPhat(dau.cho.id) && nay < dau.han) { dem.va(dau.cho.id, dau.cho.diem); return } chotNet(dau.cho, dau.sk) }
      else { dau.don(); for (const sk of dau.ds) but(sk) }
      hangSo.shift()
    }
  }
  function apSo(khung: ArrayBuffer | Uint8Array): void {
    const m = giaiSo(khung)
    if (!m) return
    // Nét nhiều khung chưa đủ thì `apMuc` chưa trả sự kiện — nét dở trên lớp vẽ giữ nguyên tới lúc đó.
    const ds = apMuc(bang, m), nay = mt.dongHo()
    if (!ds.length) return
    if (m.k === 'net' && ds.length === 1 && ds[0]!.loai === 'net-moi') hangSo.push({ cho: ds[0]!.net, sk: ds[0]!, han: nay + Math.max(CHO_CHOT_MS, dNay + CHO_CHOT_MS) })
    else {
      const don = (): void => {
        if (m.k === 'net') { dem.boNet(m.net.id); dangVe.delete(m.net.id) }
        if (m.k === 'xoa') for (const id of m.id) { dem.boNet(id); dangVe.delete(id) }
        if (m.k === 'xoa-het' || m.k === 'bang') { dem.xoa(); dangVe.clear() }
      }
      hangSo.push({ ds, don })
    }
    xaHangSo(nay)
  }
  function nhanDiem(goi: ArrayBuffer | Uint8Array, quaWs: boolean): void {
    // Bảng live chưa hiện (máy em đang ở màn câu hỏi) ⇒ bỏ điểm đang viết; nét xong vẫn vào sổ nên bật bảng là thấy đủ.
    // 11/11 (thầy «bấm nộp thì tự về màn live»): máy em tự vào bảng live cả khi cờ phòng `bang` tắt ⇒ lớp giao diện báo `datHienBang`; chưa báo ⇒ theo cờ phòng.
    if (!live?.bat || !(hienBang ?? live.bang) || roiMan) return
    const g = giaiGoi(goi, live.phien)
    if (!g) return
    // Nét đã có bản chốt trong bảng ⇒ gói điểm tới muộn của nó bỏ.
    if (g.k === 'diem' && !dangVe.has(g.dau.id) && bang.net.some((x) => x.id === g.dau.id)) return
    // DataChannel đang mở mà gói này tới qua WebSocket = gói của ĐƯỜNG PHỤ (em xin thêm vì DataChannel thủng): chỉ lấy điểm, không tính dao động
    dem.nap(g, mt.dongHo(), quaWs && dcMo())
  }
  /** GỌI MỖI KHUNG HÌNH khi đang live: phát các điểm tới hạn ra `khiBut` (net-moi / them-diem) và trả đầu nét nội suy + con trỏ để vẽ lớp «đang viết». */
  function khung(nay: number = mt.dongHo()): KhungLiveEm {
    const k = dem.khung(nay), dau: KhungLiveEm['dau'] = [], coCho = hangSo.length > 0
    if (dem.canTro(nay) !== troWs) { troWs = !troWs; baoOk() }
    dNay = k.d
    for (const n of k.net) {
      if (n.moi.length) {
        if (!dangVe.has(n.dau.id)) but({ loai: 'net-moi', trang: bang.trang, net: { ...n.dau, diem: n.moi.slice() } })
        else but({ loai: 'them-diem', trang: bang.trang, id: n.dau.id, diem: n.moi })
        dangVe.set(n.dau.id, n.daCo + n.moi.length)
      }
      if (n.head && !n.xong) dau.push({ id: n.dau.id, ...n.head })
    }
    if (coCho) xaHangSo(nay)
    return { dau, tro: k.tro, but: k.but, cuon: k.cuon }
  }

  // ── SỐ ĐO + ĐỒNG BỘ TIẾNG–NÉT ──
  function nhipSo(): void {
    henSo = null
    if (huyRoi || !live?.bat) return
    const nay = mt.dongHo()
    xaHangSo(nay)
    if (!dangDoTi && nay - lucTi >= 5000) {
      lucTi = nay; dangDoTi = true
      void doTieng(() => ({ pc, n: { thu, the: am }, b: { thu: thuBan, the: amBan }, g: micTx?.sender ?? null }), mt.dongHo, (ms) => new Promise<void>((r) => { mt.hen(r, ms) }))
        .then((t) => { tiNay = t; const ng = ngheThat(t.n); if (ng !== ngheTi) { ngheTi = ng; baoOk() } }, () => undefined).finally(() => { dangDoTi = false })
    }
    const xong = (): void => {
      const s = dem.soDo(nay)
      soDo.ghi('d', s.d); soDo.ghi('j', s.jitter); if (s.muon) soDo.ghi('m', s.muonToiDa)
      mucMang = s.muc
      if (s.dung) soDo.ghi('dg', s.dungToiDa)
      soDo.ghi('tn', s.d + (rtt ?? 0) / 2)
      if (nay - lucDo >= NHIP_DO_MS) {
        lucDo = nay
        const tin = roiMan ? null : soDo.tinKy(dcMo()), ti: SoTieng = { ...(tiNay ?? { cs: pc?.connectionState ?? 'khong', ice: pc?.iceConnectionState ?? 'khong', uv: '' }), tg: tt.tieng, mc: tt.mic, ...(roiMan ? { r: 1 as const } : {}), ...(loiSfu && !pc ? { l: loiSfu } : {}) }
        tuy.kenh.gui({ ...(tin ?? { t: 'live-do' }), ...(giayLech ? { gl: true } : {}), ti })
      }
      // Phòng báo có mục mới mà quá 2 giây chưa thấy khung nào ⇒ xin bù (kết nối vừa nối lại, tin lạc).
      if (live && live.soNet > bang.cuoi && henBu == null && nay - lucXinBu > (choSo ? 5000 : 2000)) xinBu()
      henSo = mt.hen(nhipSo, NHIP_SO_MS)
    }
    if (!pc) { xong(); return }
    void pc.getStats().then((bc) => {
      const s = docSoWebRtc(bc, midThay)
      rtt = s.rtt
      banSo = { goi: s.khac.reduce((a, k) => a + (k.goiNhan ?? 0), 0), mucAm: Math.max(0, ...s.khac.map((k) => k.mucAm ?? 0)) }
      soDo.ghi('rtt', s.rtt); soDo.ghi('jt', s.jitter)
      if (s.mucAm != null) mucAmThay = s.mucAm
      if (s.demTong != null && s.demSo != null) {
        if (demTruoc && s.demSo > demTruoc.so) {
          // Trễ tiếng phía máy em ≈ đệm jitter + ~45 ms thu, mã hoá + ~20 ms loa ⇒ D nét = kẹp(trễ tiếng − 60, D theo dao động, 150).
          demRung = ((s.demTong - demTruoc.tong) / (s.demSo - demTruoc.so)) * 1000
          const treTieng = demRung + TRE_CO_DINH_EM
          soDo.ghi('tt', treTieng); dem.datDTheoTieng(tt.nghe && !roiMan ? treTieng : null)
        }
        demTruoc = { tong: s.demTong, so: s.demSo }
      }
    }).catch(() => undefined).then(xong)
  }
  /** Mức âm tiếng thầy 0..1 (cho sóng «Thầy đang nói»). */
  function mucAm(): number {
    try { const n = thu?.getSynchronizationSources?.()[0]?.audioLevel; if (typeof n === 'number') return n } catch { /* không hỗ trợ */ }
    return mucAmThay
  }

  // ── TIN TỪ PHÒNG ──
  /** Mỗi `viewEm` mới của phòng: chuyển `view.live` vào đây (null / vắng = công tắc tắt hoặc phòng bản cũ). */
  function nhanView(l: ViewLiveEm | undefined): void {
    const truoc = live
    live = l ?? null
    if (!live || !live.duocXem) {
      if (pc || henNoi) dongSfu()
      if (truoc?.bat) { dem.xoa(); dangVe.clear() }
      soatMic()
      dat({ duocXem: false, san: false, bat: false, tu: null, bang: false, duocMoMic: false, duocMoi: false, tay: false, hangTay: null, nghi: false })
      return
    }
    const nghe = ngheDat ?? live.tieng === 'bat', duBang = tt.duBang || bang.cuoi === live.soNet
    // Sổ nét: tải ngầm ngay khi phòng sẵn sàng (rải 0–3 giây để 300 máy không dồn); đang live thì xin ngay.
    if ((live.san || live.bat) && !duBang && !choSo && henBu == null) henBu = mt.hen(xinBu, live.bat ? 0 : mt.ngauNhien() * RAI_BU_MS)
    // SFU: nối ngầm khi có phiên của thầy (rải 0–20 giây khi chưa live; đang live ⇒ nối ngay). Phiên của thầy đổi ⇒ nối lại.
    const ss = live.tieng === 'chua-cau-hinh' ? null : live.ss
    if (!ss) { if (pc || henNoi || nguonNoi) dongSfu() }
    else if (nguonNoi !== ss.id) {
      if (pc || nguonNoi) dongSfu()
      mt.huyHen(henNoi)
      if (live.bat) { henNoi = null; void xepSfu(() => noiSfu(ss)) }
      else henNoi = mt.hen(() => { henNoi = null; const s = live?.ss; if (s && !pc && !nguonNoi) void xepSfu(() => noiSfu(s)) }, mt.ngauNhien() * RAI_NOI_MS)
    } else if (live.bat && henNoi != null) { mt.huyHen(henNoi); henNoi = null; void xepSfu(() => noiSfu(ss)) }
    if (live.bat && (!truoc?.bat || truoc.phien !== live.phien)) { dem.xoa(); dangVe.clear(); demTruoc = null; lucDo = mt.dongHo() }
    if (!live.bat && truoc?.bat) { xaHangSo(Infinity); dem.xoa(); for (const id of dangVe.keys()) but({ loai: 'xoa', trang: bang.trang, id: [id] }); dangVe.clear(); okPhien = -1 }
    if (truoc?.bang && !live.bang) { dem.xoa(); for (const id of dangVe.keys()) but({ loai: 'xoa', trang: bang.trang, id: [id] }); dangVe.clear() }
    dat({ duocXem: true, san: live.san, bat: live.bat, tu: live.tu, nghe, duBang, bang: live.bang, duocMoMic: live.emDuocMoi, duocMoi: !!live.emMoi, tay: !!live.emTay, hangTay: live.hangTay ?? null, nghi: !!live.nghi, ...(live.tieng === 'chua-cau-hinh' ? { tieng: 'chua-cau-hinh' as const } : tt.tieng === 'chua-cau-hinh' ? { tieng: 'cho' as const } : {}) })
    capNhatTieng()
    if (live.bat) { baoOk(); if (henSo == null) henSo = mt.hen(nhipSo, NHIP_SO_MS); if (daCham) phatTieng() }
    soatMic()
  }
  /** Đợt 1B chuyển MỌI tin của phòng vào đây: khung nhị phân (ArrayBuffer), chuỗi JSON, hoặc đối tượng đã parse. Tin không liên quan ⇒ bỏ qua. */
  function nhanTinPhong(d: unknown): void {
    if (d instanceof ArrayBuffer || d instanceof Uint8Array) {
      const b = d instanceof Uint8Array ? d : new Uint8Array(d)
      if (!b.length) return
      const nhom = nhomKhung(b[0]!)
      if (nhom === 'so') apSo(b)
      else if (nhom === 'diem') nhanDiem(b, true)
      return
    }
    let m: Record<string, unknown> | null = null
    if (typeof d === 'string') { if (!d.includes('"live') && !d.includes('"em"')) return; try { m = JSON.parse(d) as Record<string, unknown> } catch { return } }
    else if (d && typeof d === 'object') m = d as Record<string, unknown>
    if (!m) return
    if (m.t === 'em') nhanView(m.live as ViewLiveEm | undefined)
    else if (m.t === 'live-so') {
      // Phòng sắp gửi `muc` mục bù ngay sau tin này. `lamLai` ⇒ bảng trắng, nhận lại từ đầu sổ.
      choSo = false
      if (m.lamLai === true) { hangSo.length = 0; dem.xoa(); dangVe.clear(); but(datLai(bang)) }
      dat({ duBang: true })
    }
  }
  /** WebSocket của phòng vừa nối lại ⇒ xin bù sổ nét từ số thứ tự cuối đã có + báo lại `live-ok`. */
  function khiNoiLai(): void {
    okPhien = -1; okDc = null; okNghe = null; choSo = false
    if (!live?.duocXem) return
    mt.huyHen(henBu); henBu = null
    xinBu()
    baoOk()
  }
  // LƯỚI AN TOÀN phía nghe (luoi-tieng.ts): gói tiếng thầy / bạn vẫn tới mà thẻ phát đứng ⇒ bỏ chọn loa, phát lại; vẫn kẹt ⇒ `bi-chan` (khay ghi «Chạm để nghe»).
  const khiKet = (k: boolean): void => { if (k) dat({ tieng: 'bi-chan' }); else if (tt.tieng === 'bi-chan' && am && !am.paused) dat({ tieng: 'co' }) }
  const luoi = [taoLuoiPhat({ the: () => am, thu: () => thu, khiKet, mt }), taoLuoiPhat({ the: () => amBan, thu: () => thuBan, khiKet, mt })]
  function huy(): void {
    for (const l of luoi) l.huy()
    huyRoi = true
    mt.huyHen(henBu); mt.huyHen(henSo); mt.huyHen(henBan); henBu = henSo = henBan = null
    dongSfu()
    void amCtx?.close().catch(() => undefined); amCtx = null
    if (amBan) { amBan.srcObject = null; amBan = null }
    if (am) { try { am.pause() } catch { /* chưa phát */ } am.srcObject = null; am.removeAttribute('src') }
    am = null
  }

  return {
    trangThai: (): TrangThaiLiveEm => ({ ...tt }),
    nhanView, nhanTinPhong, khiNoiLai,
    moKhoaTieng, datTieng, datRoiMan,
    batMicLenBang, tatMic, mucAmMic, mucAmBan, dangChoQuyenMic, coLoa: boLoa.co, dsLoa: boLoa.ds, loa: boLoa.id, datLoa: boLoa.dat,
    gioTay, deSau, datGiayLech, datHienBang,
    /** Bảng đã chốt (khoá trang, tỉ lệ vùng viết, mọi nét) — dùng khi lớp vẽ cần dựng lại từ đầu (đổi cỡ, phóng bảng). */
    bang: (): BangNet => bang,
    khung, mucAm,
    /** Số đo đã thu (trung vị / p95 / lớn nhất): d, j, m, rtt, jt, tt, tn — xem so-do.ts. */
    /** Trễ tiếng ƯỚC TÍNH miệng thầy → máy này (ms; null = chưa đo được): đệm rung đo tại máy + quãng mạng (coi máy thầy ↔ SFU bằng máy em ↔ SFU) +
     *  phần máy thầy (≈ 10 ms thu + khung Opus 20 ms). Chưa gồm loa / tai nghe. */
    treUocTinh: (): number | null => (demRung == null || rtt == null ? null : treTiengUocTinh({ thu: 10, chuoi: 0, ma: treKhungOpus(20), mangThay: rtt, mangEm: rtt, demEm: demRung }).ms),
    /** `mang` (12/11) = mức mạng của nét LÚC NÀY: 0 tốt · 1 đang nới đệm / đang xin đường phụ · 2 kém; `troWs` = đang nhận thêm điểm qua WebSocket. */
    /** Bản đo tiếng từ xa gần nhất (do-tieng.ts). */
    doTieng: (): SoTieng | null => tiNay,
    soDo: () => ({ ...soDo.doc(), kenhNet: tt.kenhNet, ban: tt.banNoi ? { ...banSo } : null, mang: mucMang, troWs }),
    huy,
  }
}
export type LiveEm = ReturnType<typeof taoLiveEm>
