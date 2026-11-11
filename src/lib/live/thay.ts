// LIVE BẢNG — MÁY THẦY (đặc tả docs/dac-ta-live-bang-1011.md mục 4.1, 4.2, 4.5). Nạp lười (không vào đường mở /gv).
// Việc: (1) nối SẴN một PeerConnection tới Cloudflare Realtime SFU, phát sẵn track CÂM + kênh «net», báo phòng `live-san`;
// (2) bấm Live ⇒ lấy mic (khử vọng, lọc ồn, tự chỉnh âm lượng, mono) ⇒ `replaceTrack` (không đàm phán lại) ⇒ `live-bat`;
// (3) nhận nét từ bộ máy bút và gửi đi: điểm đang viết qua DataChannel không tin cậy (lặp lô trước), kèm đường dự phòng WebSocket ≤ 30 lô/giây cho máy em
//     chưa có DataChannel; nét xong / xoá / hoàn tác / bảng mới qua WebSocket của phòng (đúng + đủ);
// (4) đo mức âm mic cho vạch mic, báo «mic đang im», gửi nhịp `live-nhip` để phòng không tự tắt live đang chạy.
// SỬA 11/11 (thầy test máy thật với mic cài áo USB: «không nhận mic ngoài, chỉnh tiếng trong và cực rõ») — phần MIC:
//   · LỖI THẬT đã có từ đợt 1B: `moMic` (mở cửa sổ nút Live / đổi mic LÚC ĐANG LIVE) dừng track đang gửi rồi mở luồng mới mà KHÔNG gắn vào bộ gửi ⇒ từ lúc
//     thầy mở cửa sổ, cả lớp mất tiếng tới hết buổi; Tạm dừng → Tiếp tục cũng chỉ bật / tắt track mới (không được gửi). Nay: mọi lần mở mic đều `ganMic()`
//     (thay track trên bộ gửi rồi mới dừng luồng cũ); mở cửa sổ khi mic đang tốt thì GIỮ luồng (`giu`).
//   · Mic câm không còn im lặng: nghe `mute` / `unmute` / `ended` của track + `devicechange`; mic ra TOÀN SỐ 0 (thiết bị tắt tiếng / bộ xử lý của trình
//     duyệt nuốt tín hiệu) ⇒ tự mở lại với ràng buộc nới dần (bỏ `channelCount` → tắt khử vọng + lọc ồn → tắt cả tự chỉnh âm lượng); vẫn câm ⇒ `micTinh: 'im'`.
//   · Vạch mức âm có nguồn thứ hai KHÔNG cần AudioContext: `sender.getStats()` (`media-source.audioLevel`) = tiếng ĐANG GỬI cho lớp; AudioContext bị treo
//     thì vạch, «mic đang im» và nhịp `live-nhip` vẫn đúng.
//   · Tiếng trong: Opus 64 kb/s dải rộng, không DTX (`OPUS_THAY`); khử vọng + lọc ồn của trình duyệt làm đục giọng mic cài áo ⇒ chỉ bật khi CÓ đường vọng
//     (loa máy thầy đang phát tiếng em) — luật ở `canLoc()`; thầy ép tay được (`datLoc`).
// SFU chưa cấu hình (`tieng: 'chua-cau-hinh'`) hoặc nối hỏng ⇒ live vẫn chạy phần HÌNH qua WebSocket.
import type { ViewLiveBang } from '../bpu/phong-live'
import type { NetBut, SuKienBut } from '../but-bang-loi'
import { DIEM_TOI_DA_MOT_GOI, maBangMoi, maGoiDiem, maNetXong, maNhac, maTro, maXoaNet } from './ma-net'
import { OPUS_THAY, choIce, choKenhMo, choNoi, docSoGui, goiCua, moiTruongMacDinh, suaSdpOpus, docSoWebRtc, traLoiMoi, type MoiTruongLive, type TuyChonOpus } from './sfu'
import { dsMic, timTheMacDinh } from './thiet-bi-mic'
import { BAC_CUOI, coMic, rangBuocMic, timMicTheoTen } from './thang-mic'
import { theAmLoa } from './loa'
import { taoLuoiGui, taoLuoiPhat } from './luoi-tieng'
import { dungChuoiTieng, type KieuChuoi, type MucLocOn } from './chuoi-tieng'

import type { AnhBang, ChanDoanMic, CheDoLoc, KetQuaBat, TrangThaiLiveThay, TuyChonLiveThay } from './thay-kieu'
export type { AnhBang, ChanDoanMic, CheDoLoc, KetQuaBat, TinhMic, TrangThaiLiveThay, TuyChonLiveThay } from './thay-kieu'

const NHIP_MS = 30_000
const MIC_IM_MS = 20_000
const NGUONG_TIENG = 0.04
/** Đỉnh biên độ dưới ngưỡng này (≈ −94 dBFS) suốt 1,5 giây = mic câm (mic thật luôn có nhiễu nền lớn hơn). */
const NGUONG_CAM = 2e-5
/** Mic chưa hề có tín hiệu, đã hết bậc: chờ ngần này rồi chạy lại cả vòng. Mic từng có tín hiệu rồi im hẳn: im liền ngần này mới mở lại đúng bậc đang chạy. */
const CHO_VONG = 8000, CAM_LAU = 20000
export { NEN_RO, CHAN_DINH, LAM_RO } from './chuoi-tieng'
import { DC_CACH_MS, NGHEN_WS, NHAC_LAI_MS, WS_CACH_MS, XA_MS, daGuiDc, netGuiMoi, tuGoiCuoi, tuGoiDc, tuGoiWs, type NetGui } from './gui-diem'

export function taoLiveThay(tuy: TuyChonLiveThay) {
  const mt: MoiTruongLive = { ...moiTruongMacDinh(), ...tuy.moiTruong }
  const opus: TuyChonOpus = { ...OPUS_THAY, ...tuy.opus }
  const tt: TrangThaiLiveThay = { pha: 'chua', tieng: 'chua', kenhNet: 'ws', micTat: false, micIm: false, xem: 0, xemWs: 0, xemNghe: 0, tu: null, mayKhacLive: false, bang: false, emNoi: null, ngheEm: false, nghi: false, micTinh: 'chua', micTen: '', loc: false }
  let live: ViewLiveBang = null
  let pc: RTCPeerConnection | null = null, dc: RTCDataChannel | null = null, phienSfu = ''
  let gui: RTCRtpSender | null = null
  let amCtx: AudioContext | null = null, trackCam: MediaStreamTrack | null = null
  let mic: MediaStream | null = null, doAm: AnalyserNode | null = null, mauAm: Float32Array<ArrayBuffer> | null = null
  let dangNoi: Promise<void> | null = null, huyRoi = false
  let t0Live = 0, tuBat = false, daThayBat = false
  const net = new Map<string, NetGui>()
  let henXa: unknown = null, lucWs = -1e9, lucDc = -1e9, troCho: { x: number; y: number; dc?: boolean } | null = null, cuonCho: { x: number; y: number; dc?: boolean } | null = null
  let henNhip: unknown = null, lucTieng = 0, lucNet = 0, lucNhip = 0
  let doEm: Record<string, unknown> | null = null, rtt: number | null = null, duong: string | null = null
  // Tiếng của em đang phát mic trên bảng.
  let hangSfu: Promise<unknown> = Promise.resolve(), ngheEmDat: boolean | null = null, emDangKeo = '', amEm: HTMLAudioElement | null = null, thuEm: RTCRtpReceiver | null = null
  let emSo: { goi: number; mucAm: number } = { goi: 0, mucAm: 0 }, loiKeo = ''
  const xepSfu = <T,>(f: () => Promise<T>): Promise<T> => { const p = hangSfu.then(f, f); hangSfu = p.catch(() => undefined); return p }
  const dem = { goiDc: 0, goiWs: 0, khungSo: 0 }

  const bao = (): void => { tuy.khiTrangThai?.({ ...tt }) }
  const dat = (o: Partial<TrangThaiLiveThay>): void => {
    let doi = false
    for (const k of Object.keys(o) as (keyof TrangThaiLiveThay)[]) if (tt[k] !== o[k]) { (tt as unknown as Record<string, unknown>)[k] = o[k]; doi = true }
    if (doi) bao()
  }
  const dangLive = (): boolean => !!live?.bat && tuBat
  const dcMo = (): boolean => !!dc && dc.readyState === 'open'
  const tLive = (): number => Math.max(0, mt.dongHo() - t0Live)

  // ── SFU ──
  function trackCamMoi(): MediaStreamTrack | null {
    try {
      if (!taoCtx() || !amCtx) return null
      void amCtx.resume().catch(() => undefined)
      // Nguồn Web Audio im lặng (không đụng mic, đèn mic không sáng). Track vẫn chảy gói ⇒ SFU không dọn track vì 30 giây không có gói.
      const dao = amCtx.createOscillator(), nho = amCtx.createGain(), dich = amCtx.createMediaStreamDestination()
      nho.gain.value = 0
      dao.connect(nho); nho.connect(dich); dao.start()
      return dich.stream.getAudioTracks()[0] ?? null
    } catch { return null }
  }
  async function noiSfu(): Promise<void> {
    dat({ pha: 'dang-noi' })
    let p: RTCPeerConnection | null = null
    try {
      p = mt.taoPc({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }], bundlePolicy: 'max-bundle' })
      p.addEventListener('track', (e) => {
        // Track nhận về trên phiên của thầy chỉ có thể là tiếng của em đang phát mic.
        if (e.track.kind !== 'audio') return
        thuEm = e.receiver
        try { (e.receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0 } catch { /* không hỗ trợ */ }
        try { (e.receiver as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0 } catch { /* không hỗ trợ */ }
        amEm = amEm ?? theAmLoa()
        amEm.autoplay = true
        amEm.srcObject = new MediaStream([e.track])
        amEm.muted = !tt.ngheEm
        void amEm.play().catch(() => undefined)
      })
      trackCam = trackCam ?? trackCamMoi()
      const tx = trackCam ? p.addTransceiver(trackCam, { direction: 'sendonly' }) : p.addTransceiver('audio', { direction: 'sendonly' })
      // Một kênh trong lời mời đầu ⇒ đường DataChannel (SCTP) được đàm phán luôn, không cần bước establish riêng (tài liệu «Other initial negotiation sequences»).
      const khoiDong = p.createDataChannel('khoi-dong')
      await p.setLocalDescription({ type: 'offer', sdp: suaSdpOpus((await p.createOffer()).sdp ?? '', opus) })
      await choIce(p, mt)
      const r = await goiCua(mt, tuy.goc, 'noi', { ve: tuy.ve, sdp: p.localDescription?.sdp ?? '', tracks: [{ mid: tx.mid ?? '0', ten: 'thay' }] })
      if (huyRoi) { p.close(); return }
      if (!r.ok || !r.phien || !r.sdp) throw new Error(r.lyDo ?? 'sfu')
      await p.setRemoteDescription({ type: 'answer', sdp: suaSdpOpus(r.sdp, opus) })
      try { const ts = tx.sender.getParameters(); if (ts.encodings?.length) { ts.encodings[0]!.maxBitrate = opus.bitrate ?? 64000; await tx.sender.setParameters(ts) } } catch { /* trình duyệt không cho đặt ⇒ dùng trần trong SDP */ }
      if (!(await choNoi(p, mt))) throw new Error('khong-noi')
      pc = p; gui = tx.sender; phienSfu = r.phien
      p.addEventListener('connectionstatechange', () => { if (pc === p && (p!.connectionState === 'failed' || p!.connectionState === 'closed')) matSfu() })
      // Kênh điểm đang viết: không thứ tự, không gửi lại. Hỏng ⇒ điểm đi WebSocket, tiếng vẫn chạy.
      let k: RTCDataChannel | null = null
      const c = await goiCua(mt, tuy.goc, 'kenh', { ve: tuy.ve, phien: r.phien, ten: 'net' })
      if (c.ok && typeof c.id === 'number') {
        k = p.createDataChannel('net', { negotiated: true, id: c.id, ordered: false, maxRetransmits: 0 })
        k.binaryType = 'arraybuffer'
        if (!(await choKenhMo(k, mt))) { try { k.close() } catch { /* đã đóng */ } k = null }
      }
      try { khoiDong.close() } catch { /* đã đóng */ }
      if (huyRoi) { p.close(); return }
      dc = k
      dat({ pha: tt.pha === 'dang-noi' ? 'san' : tt.pha, tieng: 'cam', kenhNet: k ? 'dc' : 'ws', loi: undefined })
      // Phiên SFU mới (nối lại giữa lúc live) ⇒ bộ gửi mới đang cầm track câm ⇒ gắn lại mic đang mở.
      await ganMic()
      tuy.kenh.gui({ t: 'live-san', ss: { id: phienSfu, tieng: 'thay', kenh: k ? 'net' : null } })
      soatEmNoi()
    } catch (e) {
      try { p?.close() } catch { /* đã đóng */ }
      pc = null; dc = null; gui = null; phienSfu = ''
      // Không có SFU vẫn sẵn sàng: live chỉ hình.
      dat({ pha: tt.pha === 'dang-noi' ? 'san' : tt.pha, tieng: 'loi', kenhNet: 'ws', loi: e instanceof Error ? e.message : 'sfu' })
      tuy.kenh.gui({ t: 'live-san', ss: null })
    }
  }
  function matSfu(): void {
    try { pc?.close() } catch { /* đã đóng */ }
    pc = null; dc = null; gui = null; phienSfu = ''; emDangKeo = ''; thuEm = null
    if (amEm) amEm.srcObject = null
    dat({ tieng: 'loi', kenhNet: 'ws' })
    tuy.kenh.gui({ t: 'live-san', ss: null })
    // Thử nối lại sau 3 giây (phiên SFU mới ⇒ phòng tăng `phien`, máy em kéo lại track).
    mt.hen(() => { if (!huyRoi && !pc && !dangNoi) void noiSan() }, 3000)
  }
  /** Nối sẵn (gọi khi tờ chiếu có phòng). SFU chưa cấu hình ⇒ chỉ báo phòng «sẵn sàng, chỉ hình». Gọi lặp không sao. */
  function noiSan(): Promise<void> {
    if (pc) return Promise.resolve()
    if (dangNoi) return dangNoi
    if (live?.tieng === 'chua-cau-hinh') {
      dat({ pha: tt.pha === 'chua' || tt.pha === 'dang-noi' ? 'san' : tt.pha, tieng: 'chua-cau-hinh', kenhNet: 'ws' })
      tuy.kenh.gui({ t: 'live-san', ss: null })
      return Promise.resolve()
    }
    dangNoi = xepSfu(noiSfu).finally(() => { dangNoi = null })
    return dangNoi
  }

  // ── MIC ──
  /** Thiết bị thầy chọn (null = mic mặc định của máy), bậc ràng buộc đang dùng, số lần mở (chống đua), thầy chọn «Live không tiếng». */
  let micId: string | null = null, bac = 0, lanMo = 0, khongTieng = false
  let cheDoLoc: CheDoLoc = tuy.loc ?? 'tu'
  let henSoat: unknown = null, henMoLai: unknown = null, lucMo = 0, raCam = 0
  /** Soát mic câm: bộ đo đỉnh cửa sổ DÀI (≈ 170 ms — không lọt tiếng ngắt quãng), đã có tín hiệu từ lần mở này chưa, lúc có tín hiệu gần nhất, bậc đã từng
   *  có tín hiệu (−1 = chưa bậc nào), chế độ lọc đã XIN ở lần mở gần nhất. */
  let doDinh: AnalyserNode | null = null, mauDinh: Float32Array<ArrayBuffer> | null = null, coTin = false, lucTin = 0, bacTot = -1, locXin = false
  /** Thiết bị của luồng đang mở (`undefined` = chưa mở), lúc thử mở lại luồng đã chết gần nhất. */
  let idMo: string | null | undefined, lucThu = 0
  /** THẾ THÂN MỤC MẶC ĐỊNH: thầy để «Mặc định của máy» mà luồng câm ⇒ mở THẲNG thiết bị thật đứng sau nó (thiet-bi-mic.ts). `daThuThe` = vòng này đã thử. */
  let idThe: string | null = null, daThuThe = false
  /** `macDinhTam` = mic đã chọn không có trên máy ⇒ đang dùng mic mặc định (báo `micKhac`); `tenChon` = tên mic đã chọn (tìm lại khi mã đổi). */
  let macDinhTam = false, tenChon = tuy.micTen ?? ''
  const idDung = (): string | null => (macDinhTam ? null : idThe ?? micId)
  const timThe = (): Promise<string | null> => timTheMacDinh(mic?.getAudioTracks()[0]?.label ?? '')
  /** Chuỗi làm rõ tiếng (Web Audio) của luồng mic đang mở; `hong` = chuỗi ra câm trong khi mic có tiếng ⇒ bỏ chuỗi, gửi thẳng track mic. */
  let chuoi: { ra: MediaStreamTrack; doRa: AnalyserNode; nut: AudioNode[]; hong: boolean; k: { kieu: string; datLocOn?: (m: MucLocOn) => void; locOn?: string; vao?: number; vaoLuc?: number } } | null = null, chuoiDo: AudioNode[] | null = null, mauRa: Float32Array<ArrayBuffer> | null = null
  let lyDoLuoi = '' // lý do lưới an toàn phía gửi đã bỏ chuỗi (chanDoan)
  let guiSo2: { muc: number | null; kbps: number | null; byte: number | null; luc: number } = { muc: null, kbps: null, byte: null, luc: 0 }, lucDocGui = -1e9, gui0 = 0
  /** LUẬT XỬ LÝ TIẾNG (thầy 11/11 «tiếng trong và cực rõ»): khử vọng + lọc ồn của trình duyệt làm đục giọng (nhất là mic cài áo) ⇒ chỉ bật khi CÓ ĐƯỜNG VỌNG:
   *  loa máy thầy đang phát tiếng em nói (11/11 lần 4: hết tính `tiengLop`). Còn lại: tắt hai bộ ấy, giữ tự chỉnh âm
   *  lượng. Thầy ép «Luôn bật» / «Luôn tắt» bằng `datLoc`. */
  // 11/11 lần 4 (`tiengLop` nay mặc định bật): bỏ `tiengLop` khỏi luật — khử vọng chỉ khử tiếng do CHÍNH MÁY THẦY phát; tiếng loa máy em lọt vào mic thì không khử được.
  /** «Chuẩn trình duyệt» (11/11 tối, hàng dự phòng): bỏ chuỗi làm rõ tiếng, gửi thẳng mic với khử vọng + lọc ồn + tự chỉnh âm lượng của trình duyệt (kiểu Meet). */
  let chuanTD = tuy.kieuTieng === 'chuan'
  const coChuoi = (): boolean => tuy.chuoi !== false && !chuanTD
  const canLoc = (): boolean => (chuanTD || cheDoLoc === 'bat' ? true : cheDoLoc === 'tat' ? false : tt.ngheEm && !!tt.emNoi)
  /** Ràng buộc mở mic theo bậc: thang-mic.ts (thiết bị LUÔN `exact` — 11/11 tối). */
  const rangBuoc = (loc: boolean, b: number): MediaTrackConstraints => rangBuocMic(idDung(), loc, b, tuy.agc ?? true)
  const bacCuoi = (): number => BAC_CUOI
  /** Bậc kế có ràng buộc xử lý KHÁC bậc đang chạy (bậc trùng ràng buộc thì bỏ qua — không chờ 1,5 giây vô ích). */
  const bacKe = (): number => { const khoa = (b: number) => { const r = rangBuoc(locXin, b); return `${r.echoCancellation}${r.noiseSuppression}${r.autoGainControl}${JSON.stringify(r.deviceId ?? '')}` }; let b = bac + 1; while (b < bacCuoi() && khoa(b) === khoa(bac)) b += 1; return Math.min(bacCuoi(), b) }
  const ctxChay = (): boolean => !!amCtx && amCtx.state === 'running'
  function thaLuong(l: MediaStream | null): void { for (const t of l?.getTracks() ?? []) { t.onmute = t.onunmute = t.onended = null; try { t.stop() } catch { /* đã dừng */ } } }
  function goChuoi(): void {
    for (const n of chuoi?.nut ?? chuoiDo ?? []) { try { n.disconnect() } catch { /* chưa nối */ } }
    try { chuoi?.ra.stop() } catch { /* đã dừng */ }
    chuoi = null; chuoiDo = null; doAm = doDinh = null
  }
  function ngatMic(): void {
    lanMo += 1
    mt.huyHen(henSoat); mt.huyHen(henMoLai); henSoat = henMoLai = null
    goChuoi()
    thaLuong(mic)
    mic = null; idMo = undefined
    if (tt.micTinh !== 'chua' || tt.micTen) dat({ micTinh: 'chua', micTen: '' })
  }
  /** CHUỖI LÀM RÕ TIẾNG (src/lib/live/chuoi-tieng.ts): mic → cộng hai kênh về mono → lọc 80 Hz → nâng mức → chặn đỉnh → track gửi cho lớp.
   *  ĐƯỜNG LUI: AudioContext treo / dựng lỗi / chuỗi ra câm ⇒ `trackGui()` trả thẳng track mic — không bao giờ mất tiếng vì chuỗi. */
  const kieuMuon = (): KieuChuoi => tuy.chuoiKieu ?? 'khung'
  let mucLocOn: MucLocOn = tuy.locOn ?? 'vua'
  /** Thầy đổi «Lọc ồn» (Mạnh / Vừa / Tắt): áp ngay vào chuỗi đang chạy, không mở lại mic. */
  function datLocOn(m: MucLocOn): void { mucLocOn = m; chuoi?.k.datLocOn?.(m) }
  function taoCtx(): AudioContext | null {
    if (amCtx) return amCtx
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      // 48 kHz xuyên suốt (thu → xử lý → Opus), khối xử lý nhỏ nhất
      try { amCtx = new Ctx({ sampleRate: 48000, latencyHint: 'interactive' }) } catch { amCtx = new Ctx() }
      amCtx.onstatechange = () => { if (!huyRoi) void ganMic() } // bộ xử lý treo / chạy lại ⇒ đổi track đang gửi cho đúng
    } catch { amCtx = null }
    return amCtx
  }
  function dungChuoi(l: MediaStream): void {
    goChuoi()
    try {
      const c = taoCtx()
      if (!c) return
      void c.resume().catch(() => undefined)
      const giu: { k: unknown } = { k: null }
      const k = dungChuoiTieng(c, l, { kieu: kieuMuon(), khiHong: () => { if (chuoi && chuoi.k === giu.k && !chuoi.hong) { chuoi.hong = true; void ganMic() } }, })
      giu.k = k
      k.datLocOn?.(mucLocOn)
      doAm = k.doAm; mauAm = new Float32Array(doAm.fftSize); doDinh = k.doDinh; mauDinh = new Float32Array(doDinh.fftSize)
      if (k.ra && k.doRa) { mauRa = new Float32Array(k.doRa.fftSize); chuoi = { ra: k.ra, doRa: k.doRa, nut: k.nut, hong: false, k } } else chuoiDo = k.nut
    } catch { chuoi = null }
  }
  /** Track GỬI cho lớp: track của chuỗi làm rõ tiếng khi chuỗi đang chạy tốt; không thì thẳng track mic. */
  function trackGui(): MediaStreamTrack | null {
    const t = mic?.getAudioTracks()[0] ?? null
    // chuỗi từng khung chạy trong Worker, không cần AudioContext ⇒ bộ đo treo vẫn dùng được; hai kiểu Web Audio thì phải có bộ xử lý đang chạy
    return t && coChuoi() && chuoi && !chuoi.hong && (chuoi.k.kieu === 'khung' || ctxChay()) && chuoi.ra.readyState === 'live' ? chuoi.ra : t
  }
  /** Luồng bọc track ĐANG GỬI cho lớp (cho máy ghi «Xem lại Live»); track đổi ⇒ đối tượng luồng mới. Không dựng được `MediaStream` ⇒ luồng mic thô. */
  let luongGuiNho: { t: MediaStreamTrack; l: MediaStream } | null = null
  function luongGui(): MediaStream | null {
    const t = trackGui()
    if (!t || !mic) return null
    if (t === mic.getAudioTracks()[0] || typeof MediaStream !== 'function') return mic
    if (luongGuiNho?.t !== t) luongGuiNho = { t, l: new MediaStream([t]) }
    return luongGuiNho.l
  }
  /** Gắn tiếng mic đang mở vào bộ gửi (đang live, không phải «Live không tiếng»). Trả true nếu bộ gửi đang cầm tiếng mic. `dangBat` = đang trong `bat()`
   *  (phòng chưa kịp báo `bat`). */
  async function ganMic(dangBat = false): Promise<boolean> {
    const t = mic?.getAudioTracks()[0], g = trackGui()
    if (!gui || !t || !g || !(dangBat || dangLive()) || khongTieng) return false
    try { t.enabled = !tt.micTat; if (gui.track !== g) { await gui.replaceTrack(g); gui0 = mt.dongHo() } dat({ tieng: 'mic' }); return true } catch { dat({ tieng: 'loi' }); return false }
  }
  const dinh = (a: AnalyserNode | null, m: Float32Array<ArrayBuffer> | null): number | null => {
    if (!a || !m || !ctxChay()) return null
    a.getFloatTimeDomainData(m)
    let d = 0
    for (let i = 0; i < m.length; i++) { const v = Math.abs(m[i]!); if (v > d) d = v }
    return d
  }
  /** MIC CÂM? Tín hiệu = đỉnh ≥ −94 dBFS và track không `muted`. Chưa hề có tín hiệu sau 1,5 giây ⇒ mở lại bậc kế; hết bậc ⇒ `im`, cứ 8 giây chạy lại cả
   *  vòng TỚI KHI CÓ TÍN HIỆU. Đã có tín hiệu rồi im hẳn (bộ thu có cổng ồn) ⇒ giữ bậc; im 20 giây mới mở lại, 60 giây mới báo `im`. Bộ đo treo ⇒ dùng mức
   *  âm của bộ gửi. Không xét khi thầy tắt tiếng / tạm dừng. Chuỗi ra câm mà mic có tiếng (ba lần liền) ⇒ gửi thẳng track mic. Chi tiết: đặc tả 4.3f. */
  function soatTinHieu(): void {
    henSoat = null
    const t = mic?.getAudioTracks()[0]
    if (huyRoi || !t) return
    const nay = mt.dongHo(), dau = nay - lucMo < 1450
    if (t.readyState === 'live' && !tt.micTat) {
      let d = dinh(doDinh, mauDinh)
      if (d == null && dangLive() && gui && gui.track && pc?.connectionState === 'connected' && nay - gui0 > 1500 && guiSo2.muc != null && nay - guiSo2.luc < 1500) d = guiSo2.muc // bộ đo treo: số đo của bộ gửi
      if (d != null) {
        if (d >= NGUONG_CAM && !t.muted) {
          coTin = true; bacTot = bac; lucTin = nay
          if (tt.micTinh === 'im') dat({ micTinh: 'tot' })
        } else if (!dau) {
          if (!coTin && bacTot !== bac) {
            if (!daThuThe && !idThe && (micId == null || micId === 'default')) {
              // mục mặc định câm ⇒ trước khi nới ràng buộc, mở thẳng thiết bị thật đứng sau nó
              daThuThe = true
              const lan0 = lanMo, im = tt.micTinh === 'im'
              void timThe().then((id) => {
                if (huyRoi || lanMo !== lan0) return
                if (!id) { henSoat = mt.hen(soatTinHieu, 0); return }
                idThe = id; bac = 0
                void moBac(im).then((r) => { if (!r.ok && lanMo === lan0 + 1 && !huyRoi) { idThe = null; void moBac(im) } })
              })
              return
            }
            // bậc 0 không xin lọc thì trùng ràng buộc với bậc 1 ⇒ nhảy thẳng bậc 2
            if (bac < bacCuoi()) { bac = bacKe(); void moBac(tt.micTinh === 'im'); return }
            if (!t.muted && tt.micTinh !== 'im') dat({ micTinh: 'im' })
            if (nay - lucMo > CHO_VONG) { bac = 0; idThe = null; daThuThe = false; void moBac(true); return }
          } else if (nay - Math.max(lucTin, lucMo) > CAM_LAU) {
            if (!t.muted && tt.micTinh !== 'im' && nay - lucTin > 3 * CAM_LAU) dat({ micTinh: 'im' })
            void moBac(tt.micTinh === 'im'); return
          }
        }
        if (!dau) {
          const m = dinh(doAm, mauAm), r = chuoi && !chuoi.hong ? dinh(chuoi.doRa, mauRa) : null
          raCam = r != null && m != null && r < NGUONG_CAM && m > 0.003 ? raCam + 1 : 0
          if (raCam >= 3 && chuoi) { chuoi.hong = true; void ganMic() }
        }
      }
    } else if (t.readyState !== 'live') {
      // luồng đã chết (mở lại chưa được / thiết bị vừa rút): cứ 8 giây thử mở lại, không nằm im ở «mic lỗi»
      if (nay - lucThu > CHO_VONG) { lucThu = nay; void moBac(tt.micTinh === 'im'); return }
    } else { lucMo = nay; if (coTin) lucTin = nay } // đang tắt tiếng / tạm dừng: bật lại thì tính như vừa mở
    henSoat = mt.hen(soatTinHieu, dau ? 250 : 700)
  }
  /** Mở mic theo bậc hiện tại; ràng buộc không đáp ứng được ⇒ tự nới bậc. `dangThuLai` = vòng thử lại của mic đang câm (giữ nhãn `im` tới khi có tín hiệu). Luồng mới gắn vào bộ gửi XONG mới dừng luồng cũ (không hở tiếng). */
  async function moBac(dangThuLai = false): Promise<KetQuaBat> {
    const lan = ++lanMo, loc = canLoc()
    // CÙNG THIẾT BỊ ⇒ THẢ LUỒNG CŨ TRƯỚC (đo Chromium thật 11/11): thiết bị còn một luồng đang mở thì `getUserMedia` trả lại ĐÚNG cấu hình xử lý của luồng ấy
    // (hoặc rơi về mic thô), bất kể ràng buộc mới — mở lại «với bậc khác» mà chưa thả là mở lại y như cũ. Luồng cũ đang câm ⇒ cũng thả trước (không mất gì).
    // Khác thiết bị và luồng cũ đang có tiếng (thầy đổi mic giữa buổi) ⇒ vẫn gắn luồng mới rồi mới thả luồng cũ.
    if (mic && (idMo === idDung() || !coTin)) thaLuong(mic)
    let luong: MediaStream, thuLai = 0
    for (;;) {
      try { luong = await navigator.mediaDevices.getUserMedia({ audio: rangBuoc(loc, bac) }); break } catch (e) {
        const ten = (e as { name?: string })?.name ?? ''
        // mã mic đã chọn không còn đúng ⇒ tìm lại THEO TÊN; không thấy ⇒ mic mặc định của máy + báo rõ (không âm thầm đổi mic — thang-mic.ts)
        if ((ten === 'OverconstrainedError' || ten === 'NotFoundError') && idDung()) { const id2 = await timMicTheoTen(tenChon); if (id2 && id2 !== idDung()) { if (idThe) idThe = id2; else { micId = id2; tuy.khiMicMoi?.(id2) } } else { macDinhTam = true; idThe = null } continue }
        // vừa thả luồng cũ của chính thiết bị này: hệ điều hành có thể chưa nhả kịp («thiết bị đang bận») ⇒ thử lại ngay vài lần, không chờ vòng 8 giây
        if (ten === 'NotReadableError' && thuLai++ < 3 && lan === lanMo && !huyRoi) { await new Promise<void>((r) => { mt.hen(() => r(), 300) }); continue }
        if (lan === lanMo && ten !== 'NotAllowedError' && ten !== 'SecurityError' && mic && mic.getAudioTracks()[0]?.readyState !== 'live') dat({ micTinh: 'mat' })
        if (lan === lanMo && mic && !huyRoi) { mt.huyHen(henSoat); henSoat = mt.hen(soatTinHieu, 2000) } // luồng cũ đã thả mà mở lại chưa được ⇒ vòng soát tự thử tiếp
        return { ok: false, lyDo: ten === 'NotAllowedError' || ten === 'SecurityError' ? 'mic-tu-choi' : ten === 'NotFoundError' || ten === 'OverconstrainedError' ? 'khong-mic' : ten === 'NotReadableError' ? 'mic-ban' : 'mic-loi' }
      }
    }
    const t = luong.getAudioTracks()[0]
    if (lan !== lanMo || huyRoi || !t) { thaLuong(luong); return { ok: false, lyDo: t ? 'mic-loi' : 'khong-mic' } }
    try { t.contentHint = 'speech' } catch { /* trình duyệt cũ */ }
    const cu = mic, chuoiCu = chuoi
    chuoi = null // chuỗi cũ còn phát tới khi bộ gửi nhận track mới
    mic = luong
    lucMo = mt.dongHo(); coTin = false; locXin = loc; idMo = idDung(); raCam = 0
    dungChuoi(luong)
    t.onmute = () => { if (mic === luong) dat({ micTinh: 'bi-tat' }) }
    t.onunmute = () => { if (mic === luong) { dat({ micTinh: 'tot' }); lucMo = mt.dongHo(); mt.huyHen(henSoat); henSoat = mt.hen(soatTinHieu, 250) } }
    t.onended = () => { if (mic === luong) { dat({ micTinh: 'mat' }); henMoLaiMic(800) } }
    const dangAp = (() => { try { return t.getSettings().echoCancellation } catch { return undefined } })()
    if (micId && !macDinhTam && !idThe && t.label) tenChon = t.label
    dat({ micKhac: macDinhTam ? tenChon || 'mic đã chọn' : '', micTinh: t.muted ? 'bi-tat' : dangThuLai ? 'im' : 'tot', micTen: t.label || '', loc: typeof dangAp === 'boolean' ? dangAp : bac < 1 && loc })
    await ganMic()
    if (chuoiCu) { for (const n of chuoiCu.nut) { try { n.disconnect() } catch { /* chưa nối */ } } try { chuoiCu.ra.stop() } catch { /* đã dừng */ } }
    if (cu && cu !== luong) thaLuong(cu)
    mt.huyHen(henSoat); henSoat = mt.hen(soatTinHieu, 250)
    return { ok: true }
  }
  /** Mic vừa rút / luồng kết thúc: thử mở lại (mic đã chọn; không còn thì mic mặc định của máy). */
  function henMoLaiMic(sauMs: number): void {
    mt.huyHen(henMoLai)
    henMoLai = mt.hen(() => {
      henMoLai = null
      if (huyRoi || tt.micTinh !== 'mat') return
      bac = 0; idThe = null; daThuThe = false
      void moBac().then((r) => { if (!r.ok && r.lyDo === 'khong-mic' && micId) { micId = null; return moBac() } return r }).catch(() => undefined)
    }, sauMs)
  }
  /** Lấy mic (thẻ chọn mic gọi để chạy vạch mức âm TRƯỚC khi bật; `bat` gọi lại nếu chưa có). `id`: mã thiết bị ('' / null = mặc định của máy; bỏ trống =
   *  giữ thiết bị đang chọn). `giu`: mic đang mở, còn sống, đúng thiết bị và đúng chế độ lọc ⇒ KHÔNG mở lại (mở cửa sổ nút Live lúc đang live không làm hở tiếng).
   *  Đang live ⇒ luồng mới được gắn NGAY vào bộ gửi. */
  async function moMic(id?: string | null, o: { giu?: boolean } = {}): Promise<KetQuaBat> {
    const muon = id === undefined ? micId : id || null
    const t = mic?.getAudioTracks()[0]
    void amCtx?.resume().catch(() => undefined) // đang trong cú bấm của thầy ⇒ bộ đo / chuỗi đang treo được chạy lại
    if (o.giu && t && t.readyState === 'live' && muon === micId && locXin === canLoc()) { await ganMic(); return { ok: true } }
    if (micId && muon !== micId) tenChon = ''
    micId = muon; bac = 0; bacTot = -1; idThe = null; daThuThe = false; macDinhTam = false
    return moBac()
  }
  /** Thầy đổi «Lọc tiếng ồn + khử vọng» (tự động / luôn bật / luôn tắt), hoặc luật tự động đổi kết quả. Chế độ CẦN khác chế độ đã xin lúc mở ⇒ mở lại từ
   *  bậc 0 (gắn luồng mới rồi mới dừng luồng cũ). Bậc đã bị nới vì mic câm: luật tự động KHÔNG tự xin lọc lại (tránh vòng lặp), nhưng thầy BẤM thì thử lại. */
  function datLoc(cheDo: CheDoLoc): void { cheDoLoc = cheDo; soatLoc(true) }
  function soatLoc(thayBam = false): void {
    const t = mic?.getAudioTracks()[0]
    if (!t || t.readyState !== 'live') return
    const can = canLoc()
    if (can === locXin && !(thayBam && can && bac >= 1)) return
    bac = 0; bacTot = -1; void moBac()
  }
  const rms = (a: AnalyserNode, m: Float32Array<ArrayBuffer>): number => { a.getFloatTimeDomainData(m); let s = 0; for (let i = 0; i < m.length; i++) s += m[i]! * m[i]!; return Math.sqrt(s / m.length) }
  /** Mức âm 0..1 cho vạch mic = tiếng SẼ / ĐANG gửi cho lớp (sau chuỗi làm rõ tiếng). Bộ đo AudioContext treo ⇒ mức âm của bộ gửi (`getStats`, làm mới ≤ 4 lần / giây). */
  function mucAm(): number {
    let v = 0
    const nay = mt.dongHo(), ra = coChuoi() && chuoi && !chuoi.hong && mauRa ? chuoi.doRa : null
    const doTaiCho = (): number | null => (ctxChay() && (ra || (doAm && mauAm)) ? Math.min(1, (ra ? rms(ra, mauRa!) : rms(doAm!, mauAm!)) * 3) : null)
    if (tt.micTat) v = 0 // thầy tắt tiếng / tạm dừng: lớp không nghe ⇒ vạch đứng yên ngay (không chờ số đo của bộ gửi làm mới)
    else if (dangLive() && gui && tt.tieng === 'mic' && !khongTieng) {
      // ĐANG LIVE: vạch = tiếng ĐANG GỬI cho lớp (số đo của bộ gửi), KHÔNG lấy luồng đo tại chỗ — máy thầy có tín hiệu mà bộ gửi không cầm / chưa nối
      // máy chủ tiếng thì vạch phải đứng yên (thầy 11/11: vạch chạy mà em không nghe).
      if (nay - lucDocGui > 120) docGui()
      if (guiSo2.muc != null && nay - guiSo2.luc < 1500) v = pc && pc.connectionState === 'connected' ? Math.min(1, guiSo2.muc * 3) : 0
      else v = nay - gui0 < 1500 || !gui.getStats ? doTaiCho() ?? 0 : 0 // bộ gửi chưa kịp có số đo (vừa gắn) / trình duyệt không có `getStats`
    } else {
      const d = doTaiCho()
      if (d != null) v = d
      else { void amCtx?.resume().catch(() => undefined); if (nay - lucDocGui > 250) docGui(); v = Math.min(1, (guiSo2.muc ?? 0) * 3) }
    }
    if (v > NGUONG_TIENG && !tt.micTat) lucTieng = nay
    return v
  }
  /** Đọc số đo của bộ gửi: mức âm đang gửi + tốc độ bit thật. */
  function docGui(): void {
    const g = gui
    lucDocGui = mt.dongHo()
    if (!g?.getStats) return
    void g.getStats().then((bc) => {
      const so = docSoGui(bc), nay = mt.dongHo()
      const kbps = so.byteGui != null && guiSo2.byte != null && nay > guiSo2.luc ? Math.max(0, Math.round(((so.byteGui - guiSo2.byte) * 8) / (nay - guiSo2.luc))) : guiSo2.kbps
      guiSo2 = { muc: so.mucAm, kbps, byte: so.byteGui, luc: nay }
      if ((so.mucAm ?? 0) * 4 > NGUONG_TIENG && !tt.micTat) lucTieng = nay
    }).catch(() => undefined)
  }
  /** Dòng chẩn đoán mic (thầy chụp gửi khi còn lỗi): tên mic · trạng thái track · cấu hình đang chạy · mức âm tại mic / đang gửi · tốc độ bit · đã lên SFU chưa. */
  function chanDoan(): ChanDoanMic {
    const t = mic?.getAudioTracks()[0]
    const cd = (() => { try { return t?.getSettings() ?? {} } catch { return {} } })() as MediaTrackSettings
    const d = t && ctxChay() && doAm && mauAm ? Math.min(1, rms(doAm, mauAm) * 4) : null
    return {
      ten: t?.label || '', track: !t ? 'khong' : t.readyState !== 'live' ? 'ended' : t.muted ? 'muted' : !t.enabled ? 'tat' : 'live',
      muc: d, mucGui: gui && guiSo2.muc != null ? Math.min(1, guiSo2.muc * 3) : null, kbps: guiSo2.kbps, gan: !!gui && !!t && (gui.track === t || (!!chuoi && gui.track === chuoi.ra)),
      sfu: !!pc && pc.connectionState === 'connected', loc: tt.loc, bac, ctx: amCtx?.state ?? 'khong',
      hz: cd.sampleRate ?? null, kenh: cd.channelCount ?? null, vong: typeof cd.echoCancellation === 'boolean' ? cd.echoCancellation : cd.echoCancellation == null ? null : true, on: cd.noiseSuppression ?? null, agc: cd.autoGainControl ?? null,
      chuoi: coChuoi() && !!chuoi && !chuoi.hong && (chuoi.k.kieu === 'khung' || ctxChay()), the: !!idThe, kieu: chuoi?.k.kieu ?? 'khong', locOn: mucLocOn, locOnChay: chuoi && !chuoi.hong ? chuoi.k.locOn ?? 'khong' : 'khong', luoi: lyDoLuoi, hzXuLy: amCtx?.sampleRate ?? null, treThu: ((l) => (typeof l === 'number' && l >= 0 && l <= 0.2 ? Math.round(l * 1000) : null))((cd as { latency?: number }).latency), // ngoài 0–200 ms = trình điều khiển báo bậy (mic USB báo số âm ⇒ «trễ −121 ms»)
    }
  }
  // cắm lại đúng mic đã chọn (kể cả khi mã đổi) ⇒ tự về mic ấy
  const khiThietBi = (): void => { tuy.khiThietBi?.(); if (tt.micTinh === 'mat') henMoLaiMic(300); else if (macDinhTam && micId) void coMic(micId, tenChon).then((id) => { if (id && macDinhTam && mic) { macDinhTam = false; micId = id; bac = 0; void moBac() } }) }
  try { navigator.mediaDevices?.addEventListener?.('devicechange', khiThietBi) } catch { /* trình duyệt cũ */ }

  // ── BẬT / TẮT ──
  function nhip(): void {
    henNhip = null
    if (huyRoi || !dangLive()) return
    const nay = mt.dongHo()
    docGui()
    mucAm()
    dat({ micIm: tt.tieng === 'mic' && !tt.nghi && nay - lucTieng > MIC_IM_MS })
    // Có tiếng hoặc có nét trong 30 giây qua ⇒ báo phòng thầy còn đang live (im + không nét 15 phút thì phòng tự tắt).
    if (nay - lucNhip >= NHIP_MS) { if (nay - lucTieng < NHIP_MS || nay - lucNet < NHIP_MS) tuy.kenh.gui({ t: 'live-nhip' }); lucNhip = nay }
    // Trên phiên của thầy, luồng tiếng NHẬN duy nhất là tiếng của em đang phát mic.
    if (pc) void pc.getStats().then((bc) => { const s = docSoWebRtc(bc); if (s.rtt != null) rtt = s.rtt; duong = s.duong; emSo = { goi: (s.goiNhan ?? 0) + s.khac.reduce((a, k) => a + (k.goiNhan ?? 0), 0), mucAm: Math.max(s.mucAm ?? 0, ...s.khac.map((k) => k.mucAm ?? 0)) } }).catch(() => undefined)
    henNhip = mt.hen(nhip, 1000)
  }
  /** Bấm Live. `mic`: mã thiết bị (bỏ trống = mic mặc định / mic đã mở bằng `moMic`); `khongTieng` = «Live không tiếng» (chỉ phát bảng). */
  async function bat(o: { mic?: string | null; khongTieng?: boolean } = {}): Promise<KetQuaBat> {
    if (!live) return { ok: false, lyDo: 'chua-san' } // chưa có view của phòng, hoặc công tắc live đang tắt
    if (live.bat && !tuBat) { dat({ mayKhacLive: true }); return { ok: false, lyDo: 'dang-live' } }
    dat({ pha: 'dang-bat' })
    const coSfu = live?.tieng !== 'chua-cau-hinh'
    // Xin mic TRƯỚC (đang trong cú bấm của thầy) rồi mới chờ nối SFU.
    khongTieng = !!o.khongTieng
    if (!khongTieng && coSfu && (!mic || mic.getAudioTracks()[0]?.readyState !== 'live' || o.mic)) { const r = await moMic(o.mic); if (!r.ok) { dat({ pha: pc || !coSfu ? 'san' : 'chua' }); return r } }
    await noiSan()
    if (huyRoi) return { ok: false, lyDo: 'chua-san' }
    t0Live = mt.dongHo(); tuBat = true; daThayBat = false; lucTieng = lucNet = lucNhip = t0Live
    const tieng: TrangThaiLiveThay['tieng'] = !coSfu ? 'chua-cau-hinh' : !gui ? 'loi' : (await ganMic(true)) ? 'mic' : tt.tieng === 'loi' ? 'loi' : 'khong'
    // Thầy đã viết trước khi bật ⇒ gửi ảnh trạng thái vào sổ nét trước `live-bat` (máy em vào là thấy đủ bảng).
    const anh = tuy.layAnh?.()
    if (anh) guiAnh(anh)
    tuy.kenh.gui({ t: 'live-bat' })
    dat({ pha: 'live', tieng, micIm: false, mayKhacLive: false })
    if (!henNhip) henNhip = mt.hen(nhip, 1000)
    return { ok: true }
  }
  /** Tắt live: trả track về câm (vẫn nối sẵn để bật lại tức thì), thả mic. */
  function tat(): void {
    if (!tuBat && !live?.bat) return
    tuBat = false; khongTieng = false
    if (gui) void gui.replaceTrack(trackCam).catch(() => undefined)
    ngatMic()
    guiSo2 = { muc: null, kbps: null, byte: null, luc: 0 }
    troCho = null
    tuy.kenh.gui({ t: 'live-tat' })
    dat({ pha: 'san', tieng: !gui ? tt.tieng : 'cam', micIm: false, tu: null })
  }
  /** Tắt / bật tiếng mic tạm (không đổi track, không đàm phán lại). */
  function datTiengMic(batTieng: boolean): void {
    const t = mic?.getAudioTracks()[0]
    if (t) t.enabled = batTieng
    dat({ micTat: !batTieng })
    if (batTieng) { lucTieng = mt.dongHo(); mt.huyHen(henSoat); henSoat = mt.hen(soatTinHieu, 1500) }
  }

  // ── NÉT ──
  const guiSo = (k: Uint8Array<ArrayBuffer> | readonly Uint8Array<ArrayBuffer>[]): void => {
    if (!live) return // công tắc tắt ⇒ không gửi gì
    lucNet = mt.dongHo()
    for (const x of k instanceof Uint8Array ? [k] : k) { dem.khungSo += 1; tuy.kenh.guiNhiPhan(x) }
  }
  const henXaSau = (ms: number): void => { if (henXa == null) henXa = mt.hen(xa, ms) }
  /** Xả lô điểm: DataChannel ngay sau mỗi khung vẽ của thầy, cách nhau ≥ 12 ms (kèm lặp lô trước); WebSocket ≥ 34 ms một lô (≤ 30 lô/giây) và chỉ khi có máy em cần. */
  function xa(): void {
    henXa = null
    // 11/11 (thầy «bấm nộp thì tự về màn live»): em gửi xong là ở bảng live dù cờ phòng `bang` tắt ⇒ điểm đang viết phát SUỐT lúc live (máy em đang ở màn câu
    // hỏi tự bỏ). Đang TẠM DỪNG ⇒ không phát.
    if (!dangLive() || live!.nghi) { for (const n of net.values()) { n.daDc = n.daWs = n.diem.length; n.lichDc = [] } troCho = null; cuonCho = null; return }
    const nay = mt.dongHo(), phien = live!.phien, tGui = tLive(), coDc = dcMo()
    const canWs = !coDc || tt.xemWs > 0
    const dcDuoc = coDc && nay - lucDc >= DC_CACH_MS
    const nghen = canWs && (tuy.kenh.hangCho?.() ?? 0) > NGHEN_WS
    let conWs = false, conDc = false, daDc = false, wsDuoc = canWs && !nghen && nay - lucWs >= WS_CACH_MS
    for (const n of net.values()) {
      const tong = n.diem.length
      if (!tong) continue
      // Mốc đầu nét trên đồng hồ live: neo điểm mới nhất vào «bây giờ» ở lần gửi đầu (số nguyên ms ⇒ máy em khôi phục đúng t của bộ máy bút).
      if (n.tGoc == null) n.tGoc = Math.round(tGui - n.diem[tong - 1]![3])
      if (coDc && n.daDc < tong) {
        if (dcDuoc) {
          // Gói = 3 lô liền trước + lô mới (gui-diem.ts) ⇒ mất tới 3 gói liền không thủng nét.
          const tu = tuGoiDc(n)
          try { dc!.send(maGoiDiem({ phien, tGui, dau: n.dau, tGoc: n.tGoc, tu, diem: n.diem.slice(tu) })); dem.goiDc += 1 } catch { /* kênh vừa đóng */ }
          daGuiDc(n); daDc = true
        } else conDc = true
      }
      if (canWs && n.daWs < tong) {
        if (wsDuoc) {
          for (let tu = tuGoiWs(n); tu < tong; tu += DIEM_TOI_DA_MOT_GOI) { tuy.kenh.guiNhiPhan(maGoiDiem({ phien, tGui, dau: n.dau, tGoc: n.tGoc, tu, diem: n.diem.slice(tu, tu + DIEM_TOI_DA_MOT_GOI) })); dem.goiWs += 1 }
          n.daWs = tong; lucWs = nay; wsDuoc = false
        } else { conWs = true; if (nghen) n.nghen = true }
      }
    }
    // Con trỏ lơ lửng + (11/11) độ cuộn của bảng đen (`tro` có x > 1,5): hai ô chờ riêng để cái này không đè cái kia.
    // Đường DataChannel gửi ngay, mỗi vị trí một lần (kể cả khi đường WebSocket còn phải chờ lượt). Trả true = đã gửi xong mọi đường cần gửi.
    const guiTro = (o: { x: number; y: number; dc?: boolean }): boolean => {
      const k = maTro({ phien, tGui, x: o.x, y: o.y })
      if (coDc && !o.dc) { if (dcDuoc) { try { dc!.send(k); dem.goiDc += 1 } catch { /* kênh vừa đóng */ } o.dc = true; daDc = true } else conDc = true }
      if (canWs) { if (nghen) return !coDc || !!o.dc; if (!wsDuoc) { conWs = true; return false } tuy.kenh.guiNhiPhan(k); dem.goiWs += 1; lucWs = nay; wsDuoc = false }
      return !coDc || !!o.dc
    }
    if (troCho && guiTro(troCho)) troCho = null
    if (cuonCho && guiTro(cuonCho)) cuonCho = null
    if (daDc) lucDc = nay
    if (conDc) henXaSau(Math.max(1, DC_CACH_MS - (nay - lucDc)))
    else if (conWs) henXaSau(Math.max(1, WS_CACH_MS - (nay - lucWs)))
  }
  /** Bút nhấc khỏi bảng: xả nốt điểm, báo nhấc (DataChannel gửi hai lần vì không tin cậy). */
  function nhacBut(id: string): void {
    const n = net.get(id)
    if (!n) return
    if (dangLive()) {
      if (henXa != null) { mt.huyHen(henXa); henXa = null }
      lucWs = lucDc = -1e9 // lô cuối của nét luôn được đi ngay
      xa()
      // Gói CUỐI của nét không có gói nào sau nó lặp lại ⇒ gửi DataChannel thêm một lần (11/11: mất gói cuối là đuôi nét hiện muộn thành một cục).
      if (!live!.nghi && dcMo() && n.tGoc != null && n.diem.length) { const tu = tuGoiCuoi(n); try { dc!.send(maGoiDiem({ phien: live!.phien, tGui: tLive(), dau: n.dau, tGoc: n.tGoc, tu, diem: n.diem.slice(tu) })); dem.goiDc += 1 } catch { /* kênh vừa đóng */ } }
      const k = maNhac({ phien: live!.phien, tGui: tLive(), id, tong: n.diem.length })
      if (dcMo()) { try { dc!.send(k); dc!.send(k); dem.goiDc += 2 } catch { /* kênh vừa đóng */ } }
      // tin nhấc nhắc lại sau 0,3 và 1,2 giây (gui-diem.ts: dọn nét «ma» trên máy em bản cũ khi mạng rung)
      const ph = live!.phien, tong = n.diem.length
      for (const ms of NHAC_LAI_MS) mt.hen(() => { if (dcMo() && live?.bat && live.phien === ph) { try { dc!.send(maNhac({ phien: ph, tGui: tLive(), id, tong })); dem.goiDc += 1 } catch { /* kênh vừa đóng */ } } }, ms)
      if (!dcMo() || tt.xemWs > 0) { tuy.kenh.guiNhiPhan(k); dem.goiWs += 1 }
    }
    net.delete(id)
  }
  /** NỐI BỘ MÁY BÚT: chuyển MỌI sự kiện của `window.__mcBut.nghe(...)` (tờ chiếu) vào đây. Hàm nhẹ (chỉ xếp hàng), gọi được ngay trong khung vẽ.
   *   net-moi (đang viết) + them-diem ⇒ lô điểm đang viết (DataChannel / WebSocket dự phòng) — chỉ khi đang live;
   *   net-xong ⇒ nét vào sổ của phòng (gửi cả khi CHƯA live: bảng viết trước vẫn tới máy em vào sau);
   *   net-moi có `xong` (hoàn tác xoá / làm lại) ⇒ nét vào sổ tại đúng vị trí `vt`;  xoa ⇒ xoá khỏi sổ;  trang ⇒ bảng mới + các nét sẵn có;  tro ⇒ con trỏ. */
  function nhanSuKienBut(sk: SuKienBut): void {
    if (!live) return
    // TẠM DỪNG (11/11): ngừng gửi nét — bỏ mọi sự kiện bút; lúc tiếp tục gửi lại ảnh trạng thái của trang đang chiếu (`nhanLive`) nên bảng máy em khớp ngay.
    if (live.bat && live.nghi) { if (sk.loai === 'trang' || sk.loai === 'net-xong' || sk.loai === 'xoa') net.clear(); return }
    if (sk.loai === 'them-diem') {
      const n = net.get(sk.id)
      if (!n || !sk.diem.length) return
      for (const p of sk.diem) n.diem.push(p)
      lucNet = mt.dongHo()
      if (dangLive()) henXaSau(XA_MS)
    } else if (sk.loai === 'net-moi') {
      if (sk.xong) { guiSo(maNetXong(sk.net, sk.vt)); return }
      net.set(sk.net.id, netGuiMoi({ id: sk.net.id, cong: sk.net.cong, mau: sk.net.mau, co: sk.net.co }, sk.net.diem.slice()))
      lucNet = mt.dongHo()
      if (dangLive() && sk.net.diem.length) henXaSau(XA_MS)
    } else if (sk.loai === 'net-xong') {
      const n = net.get(sk.id)
      // Nét bắt đầu trước khi thư viện nghe (không có điểm trong tay) ⇒ lấy từ ảnh trạng thái của bộ máy bút.
      const xong: NetBut | undefined = n ? { ...n.dau, diem: n.diem } : tuy.layAnh?.()?.net.find((x) => x.id === sk.id)
      nhacBut(sk.id)
      if (xong) guiSo(maNetXong(xong))
    } else if (sk.loai === 'xoa') {
      for (const id of sk.id) nhacBut(id)
      guiSo(maXoaNet(sk.id))
    } else if (sk.loai === 'trang') {
      net.clear()
      guiAnh({ trang: sk.trang, tiLe: sk.tiLe, net: sk.net })
    } else if (sk.loai === 'tro') {
      if (!dangLive()) return
      if (sk.x > 1.5) cuonCho = { x: sk.x, y: sk.y }
      else troCho = { x: sk.x, y: sk.y }
      henXaSau(XA_MS)
    }
  }
  /** Ảnh trạng thái của MỘT trang: bảng mới (khoá trang + tỉ lệ vùng viết) + mọi nét đang có ⇒ sổ của phòng gọn lại, máy em vào muộn nhận đúng bảng. */
  function guiAnh(a: AnhBang): void { guiSo(maBangMoi(a.trang, a.tiLe)); for (const n of a.net) guiSo(maNetXong(n)) }

  // ── EM ĐANG PHÁT MIC TRÊN BẢNG (thầy 10/11) ──
  /** Kéo tiếng của em về phiên của máy thầy (khi thầy đang bật nghe em). */
  function soatEmNoi(): void {
    const n = live?.bat ? live.noi[0] : undefined
    const emNoi = n ? { sbd: n.sbd, ten: n.ten, doi: n.doi, xa: n.xa } : null
    // Mặc định chỉ phát ra loa khi em ở xa: em đứng ngay trong lớp mà loa lớp phát lại giọng em qua mic máy em ⇒ vọng / hú.
    const ngheEm = ngheEmDat ?? !!n?.xa
    // 11/11 lần 4: soát lọc NGAY khi hai giá trị này đổi (`soatLoc()` của `nhanLive` chạy trước dòng này ⇒ chậm một view).
    if ((tt.emNoi?.sbd ?? '') !== (emNoi?.sbd ?? '') || tt.ngheEm !== ngheEm) { dat({ emNoi, ngheEm }); soatLoc() }
    if (amEm) amEm.muted = !ngheEm
    if (!n) { emDangKeo = ''; thuEm = null; if (amEm) amEm.srcObject = null; return }
    if (!ngheEm || !pc || !phienSfu || emDangKeo === n.ss.id) return
    const nguon = n.ss.id, ten = n.ss.tieng
    emDangKeo = nguon
    void xepSfu(async () => {
      const p = pc, phien = phienSfu
      if (!p || !phien || live?.noi[0]?.ss.id !== nguon) { if (emDangKeo === nguon) emDangKeo = ''; return }
      try {
        const r = await goiCua(mt, tuy.goc, 'nhan', { ve: tuy.ve, phien, nguon, ten: [ten] })
        if (!r.ok || !r.sdp) throw new Error('nhan')
        // lời mời mới của SFU mô tả lại cả đường gửi tiếng thầy ⇒ sửa Opus như lúc nối (không thì bộ mã của thầy rơi về mặc định của SFU sau khi gọi em lên bảng)
        await goiCua(mt, tuy.goc, 'dap', { ve: tuy.ve, phien, sdp: await traLoiMoi(p, mt, suaSdpOpus(r.sdp, opus)) })
        void ganMic() // đàm phán lại xong: bộ gửi vẫn phải cầm tiếng mic
        loiKeo = ''
      } catch (e) { loiKeo = e instanceof Error ? e.message.slice(0, 16) : 'keo'; if (emDangKeo === nguon) emDangKeo = '' }
    })
  }
  /** Thầy bấm «Thu mic»: phòng gỡ quyền + đóng track của em ở SFU (có hiệu lực cả khi máy em không nghe lệnh). */
  function thuMic(sbd?: string): void { tuy.kenh.gui(sbd ? { t: 'live-thu-mic', sbd } : { t: 'live-thu-mic' }) }
  /** ĐỢT 2 (đặc tả 4.8): thầy «Mời nói» một em trong hàng giơ tay · «Hạ hết tay» (không `sbd`) / hạ tay một em. */
  function moiNoi(sbd: string): void { tuy.kenh.gui({ t: 'live-moi', sbd }) }
  function haTay(sbd?: string): void { tuy.kenh.gui(sbd ? { t: 'live-ha-tay', sbd } : { t: 'live-ha-tay' }) }
  /** Bật / tắt phát tiếng của em ra loa máy thầy (ghi đè mặc định «chỉ em ở xa»). */
  function datNgheEm(nghe: boolean): void { ngheEmDat = nghe; soatEmNoi() }
  /** «Tạm dừng» / «Tiếp tục» (thầy 11/11): báo phòng; tiếng mic tắt / bật NGAY tại máy (không chờ phòng báo lại). Phiên SFU, track, kênh nét giữ nguyên. */
  function tamDung(nghi: boolean): void { if (!dangLive()) return; datTiengMic(!nghi); tuy.kenh.gui({ t: 'live-dat', nghi }) }
  /** Mức âm tiếng em đang nói 0..1 (cần đang nghe em). */
  function mucAmEm(): number {
    if (!tt.emNoi) return 0
    try { const n = thuEm?.getSynchronizationSources?.()[0]?.audioLevel; if (typeof n === 'number') return n } catch { /* không hỗ trợ */ }
    return emSo.mucAm // dự phòng: số đo mỗi giây
  }

  // ── TIN TỪ PHÒNG ──
  function nhanLive(l: ViewLiveBang | undefined): void {
    const nghiTruoc = !!live?.bat && !!live.nghi
    live = l ?? null
    if (!live) return
    // TẠM DỪNG / TIẾP TỤC theo phòng (11/11): dừng ⇒ tắt tiếng mic tại nguồn (không đổi track, không đàm phán lại ⇒ tiếp tục là có tiếng ngay);
    // tiếp tục ⇒ bật tiếng + gửi ảnh trạng thái của trang đang chiếu (nét thầy viết lúc dừng tới máy em một lượt).
    const nghiNay = live.bat && !!live.nghi
    if (nghiNay !== nghiTruoc) {
      datTiengMic(!nghiNay)
      if (!nghiNay && live.bat && tuBat) { net.clear(); const anh = tuy.layAnh?.(); if (anh) guiAnh(anh) }
    }
    if (tt.nghi !== nghiNay) dat({ nghi: nghiNay })
    soatLoc() // có đường vọng ⇒ đổi chế độ lọc của mic đang mở
    if (live.bat && tuBat) daThayBat = true
    // Phòng tự tắt (hết buổi, quá 15 phút) — chỉ tin khi đã từng thấy phòng xác nhận lần bật này (view cũ còn trên đường không được tắt nhầm).
    else if (!live.bat && tuBat && daThayBat) { tuBat = false; ngatMic(); if (gui) void gui.replaceTrack(trackCam).catch(() => undefined) }
    soatEmNoi()
    dat({ xem: live.xem, xemWs: live.ws, xemNghe: live.nghe ?? 0, tu: live.tu, bang: !!live.bang, mayKhacLive: live.bat && !tuBat, pha: live.bat && tuBat ? 'live' : tt.pha === 'live' ? 'san' : tt.pha, ...(live.tieng === 'chua-cau-hinh' ? { tieng: 'chua-cau-hinh' as const } : {}) })
  }
  /** Đợt 1B chuyển MỌI tin của phòng vào đây (chuỗi JSON, hoặc đối tượng đã parse). Tin không liên quan ⇒ bỏ qua. */
  function nhanTinPhong(d: unknown): void {
    let m: Record<string, unknown> | null = null
    if (typeof d === 'string') { if (!d.includes('"live') && !d.includes('"bang"')) return; try { m = JSON.parse(d) as Record<string, unknown> } catch { return } }
    else if (d && typeof d === 'object' && !(d instanceof ArrayBuffer)) m = d as Record<string, unknown>
    if (!m) return
    if (m.t === 'bang') nhanLive(m.live as ViewLiveBang | undefined)
    else if (m.t === 'live-xem') dat({ xem: Number(m.xem) || 0, xemWs: Number(m.ws) || 0, xemNghe: Number(m.nghe) || 0 })
    else if (m.t === 'live-do') doEm = m
    else if (m.t === 'live-can-anh') { const anh = tuy.layAnh?.(); if (anh) guiAnh(anh) }
    else if (m.t === 'live-kq' && m.lenh === 'bat' && m.ok === false) { tuBat = false; dat({ pha: 'san', mayKhacLive: m.lyDo === 'dang-live' }) }
  }
  /** WebSocket của phòng vừa nối lại ⇒ báo lại trạng thái sẵn sàng (phòng bỏ qua nếu không đổi). */
  function khiNoiLai(): void {
    if (tt.pha === 'chua' || tt.pha === 'dang-noi') return
    tuy.kenh.gui({ t: 'live-san', ss: phienSfu ? { id: phienSfu, tieng: 'thay', kenh: dc ? 'net' : null } : null })
  }
  // LƯỚI AN TOÀN (luoi-tieng.ts): chuỗi ra câm 1,5 giây mà mic vào có tiếng ⇒ gửi thẳng mic; tiếng em tới mà thẻ phát đứng ⇒ bỏ chọn loa, phát lại, báo `amEmKet`.
  const micCoTieng = (): boolean | null => { const k = chuoi?.k; if (k?.vaoLuc && Date.now() - k.vaoLuc < 2500) return (k.vao ?? 0) > 1e-4; const d = dinh(doDinh, mauDinh); return d == null ? null : d >= NGUONG_CAM }
  const luoiGui = taoLuoiGui({ gui: () => gui, dangXuLy: () => !!chuoi && !chuoi.hong && gui?.track === chuoi.ra && !tt.micTat && dangLive(), micCoTieng, mt,
    khiCam: () => { if (chuoi && !chuoi.hong) { chuoi.hong = true; lyDoLuoi = `chuỗi ${chuoi.k.kieu} ra câm 1,5 giây ⇒ gửi thẳng mic`; void ganMic() } } })
  const luoiPhat = taoLuoiPhat({ the: () => amEm, thu: () => thuEm, khiKet: (k) => dat({ amEmKet: k }), mt })
  function huy(): void {
    if (tuBat) tat()
    huyRoi = true; luoiGui.huy(); luoiPhat.huy()
    mt.huyHen(henXa); mt.huyHen(henNhip); henXa = henNhip = null
    ngatMic()
    try { trackCam?.stop() } catch { /* đã dừng */ }
    try { dc?.close() } catch { /* đã đóng */ }
    try { pc?.close() } catch { /* đã đóng */ }
    void amCtx?.close().catch(() => undefined)
    if (amEm) { amEm.srcObject = null; amEm = null }
    pc = null; dc = null; gui = null; amCtx = null; trackCam = null
    tuy.kenh.gui({ t: 'live-san', san: false })
  }

  return {
    trangThai: (): TrangThaiLiveThay => ({ ...tt }),
    noiSan, dsMic, moMic, mucAm, bat, tat, datTiengMic,
    /** (Đợt 1B thêm) Thầy đóng thẻ chọn mic mà KHÔNG bật live ⇒ thả mic đã mở thử (đèn mic tắt). Đang live thì không đụng. */
    thaMic: (): void => { if (!tuBat) ngatMic() },
    nhanSuKienBut, guiAnh,
    /** Công tắc buổi: `xa` = cho em ở xa vào xem (điểm quyết 4), `tiengLop` = máy em trong lớp cũng phát tiếng (điểm quyết 3). */
    /** …và `bang` = bật / tắt TAY bảng live trên máy em (giảng trên bảng mà không gọi ai). */
    /** …và `giay` = bố cục giấy đề đang chiếu (chỉ số đo; null = xoá) để máy em dựng giấy giống giấy của thầy. */
    dat: (o: { xa?: boolean; tiengLop?: boolean; bang?: boolean; giay?: unknown }): void => { tuy.kenh.gui({ t: 'live-dat', ...o }) },
    thuMic, datNgheEm, mucAmEm, moiNoi, haTay, tamDung,
    /** (11/11) «Lọc tiếng ồn + khử vọng»: tu / bat / tat · dòng chẩn đoán mic · luồng mic đang mở (thô) · track tiếng đang gửi cho lớp (sau chuỗi làm rõ tiếng). */
    datLoc, datLocOn, chanDoan, luongMic: (): MediaStream | null => mic, trackGui, phatLaiEm: (): void => { void amEm?.play().catch(() => undefined) },
    /** Cho đo tiếng từ xa (do-tieng.ts): phiên SFU, bộ nhận + thẻ phát tiếng em, bộ gửi; `dangLive` = đang live thật. */
    nguonDo: () => ({ pc, n: { thu: thuEm, the: amEm as HTMLMediaElement | null }, g: gui, dangLive: dangLive(), keo: !!emDangKeo, loiKeo }),
    /** Đổi «Làm rõ» ⇄ «Chuẩn trình duyệt» NGAY (không tải lại): mở lại mic với / không xử lý của trình duyệt rồi gắn đúng track vào bộ gửi. */
    datKieuTieng: (chuan: boolean): void => { if (chuanTD === chuan) return; chuanTD = chuan; soatLoc(true); void ganMic() },
    /** (Xem lại Live 11/11 — chỉ thêm) Luồng tiếng cho MÁY GHI: tiếng thầy ĐANG GỬI cho lớp — SAU chuỗi làm rõ tiếng (đủ to, đã chặn đỉnh; chuỗi không chạy thì
     *  là thẳng track mic) — + tiếng em đang kéo về (null = không có). Track gửi đổi (đổi mic, chuỗi ⇄ mic thô) ⇒ trả đối tượng luồng MỚI để máy ghi nối lại. */
    luongGhi: (): { mic: MediaStream | null; em: MediaStream | null } => ({ mic: tuBat && tt.tieng === 'mic' ? luongGui() : null, em: tt.emNoi && amEm?.srcObject instanceof MediaStream ? amEm.srcObject : null }),
    nhanTinPhong, khiNoiLai,
    /** Số đo: gói đã gửi theo đường, RTT máy thầy ↔ SFU, số đo gộp của các máy em (phòng báo 10 giây một lần). */
    /** Số cho «trễ tiếng ước tính»: RTT + đường nối máy thầy ↔ SFU, khung Opus đang dùng, số đo máy em báo. */
    mang: () => ({ rtt, duong, ptime: opus.ptime ?? 20, em: doEm }),
    soDo: () => ({ ...dem, rtt, em: doEm, kenhNet: tt.kenhNet, emNoi: tt.emNoi ? { ...emSo } : null }),
    huy,
  }
}
export type LiveThay = ReturnType<typeof taoLiveThay>
