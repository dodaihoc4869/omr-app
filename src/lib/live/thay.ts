// LIVE BẢNG — MÁY THẦY (đặc tả docs/dac-ta-live-bang-1011.md mục 4.1, 4.2, 4.5). Nạp lười (không vào đường mở /gv).
// Việc: (1) nối SẴN một PeerConnection tới Cloudflare Realtime SFU, phát sẵn track CÂM + kênh «net», báo phòng `live-san`;
// (2) bấm Live ⇒ lấy mic (khử vọng, lọc ồn, tự chỉnh âm lượng, mono) ⇒ `replaceTrack` (không đàm phán lại) ⇒ `live-bat`;
// (3) nhận nét từ bộ máy bút và gửi đi: điểm đang viết qua DataChannel không tin cậy (lặp lô trước), kèm đường dự phòng WebSocket ≤ 30 lô/giây cho máy em
//     chưa có DataChannel; nét xong / xoá / hoàn tác / bảng mới qua WebSocket của phòng (đúng + đủ);
// (4) đo mức âm mic cho vạch mic, báo «mic đang im», gửi nhịp `live-nhip` để phòng không tự tắt live đang chạy.
// SFU chưa cấu hình (`tieng: 'chua-cau-hinh'`) hoặc nối hỏng ⇒ live vẫn chạy phần HÌNH qua WebSocket.
import type { ViewLiveBang } from '../bpu/phong-live'
import type { DiemBut, NetBut, SuKienBut } from '../but-bang-loi'
import { DIEM_TOI_DA_MOT_GOI, maBangMoi, maGoiDiem, maNetXong, maNhac, maTro, maXoaNet, type DauNet } from './ma-net'
import { choIce, choKenhMo, choNoi, goiCua, moiTruongMacDinh, suaSdpOpus, docSoWebRtc, type KenhPhong, type MoiTruongLive, type TuyChonOpus } from './sfu'

export interface TuyChonLiveThay {
  /** Vé phòng vai thầy (`/gv/bpu/mo` trả về). */
  ve: string
  /** Gốc máy chủ, vd. `https://omr.ttadodaihoc.workers.dev`. */
  goc: string
  kenh: KenhPhong
  /** Ảnh trạng thái của trang đang viết: `{ trang: __mcBut.trang(), ...__mcBut.xuat() }` — dùng khi bật live sau khi đã viết, và khi phòng xin (sổ quá dài). */
  layAnh?: () => AnhBang | null
  khiTrangThai?: (tt: TrangThaiLiveThay) => void
  opus?: TuyChonOpus
  moiTruong?: Partial<MoiTruongLive>
}
/** Một trang của bộ máy bút: khoá trang, tỉ lệ ngang / dọc vùng viết, mọi nét đang có. */
export interface AnhBang { trang: string; tiLe: number; net: NetBut[] }
export interface TrangThaiLiveThay {
  /** chua = chưa nối · dang-noi · san = đã sẵn sàng (bấm Live là live ngay) · dang-bat · live */
  pha: 'chua' | 'dang-noi' | 'san' | 'dang-bat' | 'live'
  /** chua-cau-hinh = Worker chưa có khoá SFU · chua = chưa nối · cam = đang phát track câm · mic = đang phát mic · khong = live không tiếng · loi = nối SFU hỏng */
  tieng: 'chua-cau-hinh' | 'chua' | 'cam' | 'mic' | 'khong' | 'loi'
  /** Điểm đang viết đi đường nào: dc = DataChannel qua SFU · ws = WebSocket của phòng. */
  kenhNet: 'dc' | 'ws'
  /** Mic đang tắt tiếng tạm (thầy bấm tắt tiếng). */
  micTat: boolean
  /** Đang live mà mic im quá 20 giây. */
  micIm: boolean
  /** Số em đang xem + số em trong đó nhận điểm qua WebSocket (phòng báo). */
  xem: number
  xemWs: number
  /** Giờ bật live theo phòng (ms) — cho đồng hồ trên viên Live. */
  tu: number | null
  /** Máy thầy khác đang live buổi này ⇒ máy này chỉ điều khiển. */
  mayKhacLive: boolean
  loi?: string
}
export type KetQuaBat = { ok: true } | { ok: false; lyDo: 'mic-tu-choi' | 'khong-mic' | 'mic-loi' | 'dang-live' | 'chua-san' }

interface NetGui { dau: DauNet; diem: DiemBut[]; tGoc: number | null; daDc: number; truocDc: number; daWs: number }
const WS_CACH_MS = 34
const XA_MS = 16
const NHIP_MS = 30_000
const MIC_IM_MS = 20_000
const NGUONG_TIENG = 0.04

export function taoLiveThay(tuy: TuyChonLiveThay) {
  const mt: MoiTruongLive = { ...moiTruongMacDinh(), ...tuy.moiTruong }
  const tt: TrangThaiLiveThay = { pha: 'chua', tieng: 'chua', kenhNet: 'ws', micTat: false, micIm: false, xem: 0, xemWs: 0, tu: null, mayKhacLive: false }
  let live: ViewLiveBang = null
  let pc: RTCPeerConnection | null = null, dc: RTCDataChannel | null = null, phienSfu = ''
  let gui: RTCRtpSender | null = null
  let amCtx: AudioContext | null = null, trackCam: MediaStreamTrack | null = null
  let mic: MediaStream | null = null, doAm: AnalyserNode | null = null, nguonDo: MediaStreamAudioSourceNode | null = null, mauAm: Float32Array<ArrayBuffer> | null = null
  let dangNoi: Promise<void> | null = null, huyRoi = false
  let t0Live = 0, tuBat = false, daThayBat = false
  const net = new Map<string, NetGui>()
  let henXa: unknown = null, lucWs = -1e9, troCho: { x: number; y: number } | null = null
  let henNhip: unknown = null, lucTieng = 0, lucNet = 0, lucNhip = 0
  let doEm: Record<string, unknown> | null = null, rtt: number | null = null
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
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return null
      amCtx = amCtx ?? new Ctx()
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
      trackCam = trackCam ?? trackCamMoi()
      const tx = trackCam ? p.addTransceiver(trackCam, { direction: 'sendonly' }) : p.addTransceiver('audio', { direction: 'sendonly' })
      // Một kênh trong lời mời đầu ⇒ đường DataChannel (SCTP) được đàm phán luôn, không cần bước establish riêng (tài liệu «Other initial negotiation sequences»).
      const khoiDong = p.createDataChannel('khoi-dong')
      await p.setLocalDescription({ type: 'offer', sdp: suaSdpOpus((await p.createOffer()).sdp ?? '', tuy.opus) })
      await choIce(p, mt)
      const r = await goiCua(mt, tuy.goc, 'noi', { ve: tuy.ve, sdp: p.localDescription?.sdp ?? '', tracks: [{ mid: tx.mid ?? '0', ten: 'thay' }] })
      if (huyRoi) { p.close(); return }
      if (!r.ok || !r.phien || !r.sdp) throw new Error(r.lyDo ?? 'sfu')
      await p.setRemoteDescription({ type: 'answer', sdp: suaSdpOpus(r.sdp, tuy.opus) })
      try { const ts = tx.sender.getParameters(); if (ts.encodings?.length) { ts.encodings[0]!.maxBitrate = tuy.opus?.bitrate ?? 24000; await tx.sender.setParameters(ts) } } catch { /* trình duyệt không cho đặt ⇒ dùng trần trong SDP */ }
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
      dat({ pha: tt.pha === 'dang-noi' ? 'san' : tt.pha, tieng: mic ? 'mic' : 'cam', kenhNet: k ? 'dc' : 'ws', loi: undefined })
      tuy.kenh.gui({ t: 'live-san', ss: { id: phienSfu, tieng: 'thay', kenh: k ? 'net' : null } })
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
    pc = null; dc = null; gui = null; phienSfu = ''
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
    dangNoi = noiSfu().finally(() => { dangNoi = null })
    return dangNoi
  }

  // ── MIC ──
  async function dsMic(): Promise<{ id: string; ten: string }[]> {
    try { return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput').map((d, i) => ({ id: d.deviceId, ten: d.label || `Mic ${i + 1}` })) } catch { return [] }
  }
  function ngatMic(): void {
    try { nguonDo?.disconnect() } catch { /* chưa nối */ }
    nguonDo = null; doAm = null
    for (const t of mic?.getTracks() ?? []) t.stop()
    mic = null
  }
  /** Lấy mic (thẻ chọn mic gọi để chạy vạch mức âm TRƯỚC khi bật; `bat` gọi lại nếu chưa có). */
  async function moMic(id?: string | null): Promise<KetQuaBat> {
    ngatMic()
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: { ...(id ? { deviceId: { exact: id } } : {}), echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
    } catch (e) {
      const ten = (e as { name?: string })?.name ?? ''
      return { ok: false, lyDo: ten === 'NotAllowedError' || ten === 'SecurityError' ? 'mic-tu-choi' : ten === 'NotFoundError' || ten === 'OverconstrainedError' ? 'khong-mic' : 'mic-loi' }
    }
    const t = mic.getAudioTracks()[0]
    if (!t) { ngatMic(); return { ok: false, lyDo: 'khong-mic' } }
    try { t.contentHint = 'speech' } catch { /* trình duyệt cũ */ }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      amCtx = amCtx ?? new Ctx()
      void amCtx.resume().catch(() => undefined)
      nguonDo = amCtx.createMediaStreamSource(mic); doAm = amCtx.createAnalyser(); doAm.fftSize = 512
      nguonDo.connect(doAm); mauAm = new Float32Array(doAm.fftSize)
    } catch { doAm = null }
    return { ok: true }
  }
  /** Mức âm mic 0..1 (cho vạch mic). Chưa có mic ⇒ 0. */
  function mucAm(): number {
    if (!doAm || !mauAm) return 0
    doAm.getFloatTimeDomainData(mauAm)
    let s = 0
    for (let i = 0; i < mauAm.length; i++) s += mauAm[i]! * mauAm[i]!
    const v = Math.min(1, Math.sqrt(s / mauAm.length) * 4)
    if (v > NGUONG_TIENG && !tt.micTat) lucTieng = mt.dongHo()
    return v
  }

  // ── BẬT / TẮT ──
  function nhip(): void {
    henNhip = null
    if (huyRoi || !dangLive()) return
    const nay = mt.dongHo()
    mucAm()
    dat({ micIm: tt.tieng === 'mic' && nay - lucTieng > MIC_IM_MS })
    // Có tiếng hoặc có nét trong 30 giây qua ⇒ báo phòng thầy còn đang live (im + không nét 15 phút thì phòng tự tắt).
    if (nay - lucNhip >= NHIP_MS) { if (nay - lucTieng < NHIP_MS || nay - lucNet < NHIP_MS) tuy.kenh.gui({ t: 'live-nhip' }); lucNhip = nay }
    if (pc) void pc.getStats().then((bc) => { const s = docSoWebRtc(bc); if (s.rtt != null) rtt = s.rtt }).catch(() => undefined)
    henNhip = mt.hen(nhip, 1000)
  }
  /** Bấm Live. `mic`: mã thiết bị (bỏ trống = mic mặc định / mic đã mở bằng `moMic`); `khongTieng` = «Live không tiếng» (chỉ phát bảng). */
  async function bat(o: { mic?: string | null; khongTieng?: boolean } = {}): Promise<KetQuaBat> {
    if (!live) return { ok: false, lyDo: 'chua-san' } // chưa có view của phòng, hoặc công tắc live đang tắt
    if (live.bat && !tuBat) { dat({ mayKhacLive: true }); return { ok: false, lyDo: 'dang-live' } }
    dat({ pha: 'dang-bat' })
    const coSfu = live?.tieng !== 'chua-cau-hinh'
    // Xin mic TRƯỚC (đang trong cú bấm của thầy) rồi mới chờ nối SFU.
    if (!o.khongTieng && coSfu && (!mic || o.mic)) { const r = await moMic(o.mic); if (!r.ok) { dat({ pha: pc || !coSfu ? 'san' : 'chua' }); return r } }
    await noiSan()
    if (huyRoi) return { ok: false, lyDo: 'chua-san' }
    let tieng: TrangThaiLiveThay['tieng'] = !coSfu ? 'chua-cau-hinh' : !gui ? 'loi' : 'khong'
    const t = mic?.getAudioTracks()[0]
    if (gui && t && !o.khongTieng) { try { t.enabled = !tt.micTat; await gui.replaceTrack(t); tieng = 'mic' } catch { tieng = 'loi' } }
    t0Live = mt.dongHo(); tuBat = true; daThayBat = false; lucTieng = lucNet = lucNhip = t0Live
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
    tuBat = false
    if (gui) void gui.replaceTrack(trackCam).catch(() => undefined)
    ngatMic()
    troCho = null
    tuy.kenh.gui({ t: 'live-tat' })
    dat({ pha: 'san', tieng: !gui ? tt.tieng : 'cam', micIm: false, tu: null })
  }
  /** Tắt / bật tiếng mic tạm (không đổi track, không đàm phán lại). */
  function datTiengMic(batTieng: boolean): void {
    const t = mic?.getAudioTracks()[0]
    if (t) t.enabled = batTieng
    dat({ micTat: !batTieng })
  }

  // ── NÉT ──
  const guiSo = (k: Uint8Array<ArrayBuffer> | readonly Uint8Array<ArrayBuffer>[]): void => {
    if (!live) return // công tắc tắt ⇒ không gửi gì
    lucNet = mt.dongHo()
    for (const x of k instanceof Uint8Array ? [k] : k) { dem.khungSo += 1; tuy.kenh.guiNhiPhan(x) }
  }
  const henXaSau = (ms: number): void => { if (henXa == null) henXa = mt.hen(xa, ms) }
  /** Xả lô điểm: DataChannel mỗi ~16 ms (kèm lặp lô trước); WebSocket ≥ 34 ms một lô (≤ 30 lô/giây) và chỉ khi có máy em cần. */
  function xa(): void {
    henXa = null
    if (!dangLive()) { for (const n of net.values()) { n.daDc = n.truocDc = n.daWs = n.diem.length } troCho = null; return }
    const nay = mt.dongHo(), phien = live!.phien, tGui = tLive(), coDc = dcMo()
    const canWs = !coDc || tt.xemWs > 0
    let conWs = false, wsDuoc = canWs && nay - lucWs >= WS_CACH_MS
    for (const n of net.values()) {
      const tong = n.diem.length
      if (!tong) continue
      // Mốc đầu nét trên đồng hồ live: neo điểm mới nhất vào «bây giờ» ở lần gửi đầu (số nguyên ms ⇒ máy em khôi phục đúng t của bộ máy bút).
      if (n.tGoc == null) n.tGoc = Math.round(tGui - n.diem[tong - 1]![3])
      if (coDc && n.daDc < tong) {
        // Gói = lô liền trước + lô mới ⇒ mất MỘT gói không thủng nét.
        const tu = Math.max(n.truocDc, tong - DIEM_TOI_DA_MOT_GOI)
        try { dc!.send(maGoiDiem({ phien, tGui, dau: n.dau, tGoc: n.tGoc, tu, diem: n.diem.slice(tu) })); dem.goiDc += 1 } catch { /* kênh vừa đóng */ }
        n.truocDc = n.daDc; n.daDc = tong
      }
      if (canWs && n.daWs < tong) {
        if (wsDuoc) {
          for (let tu = n.daWs; tu < tong; tu += DIEM_TOI_DA_MOT_GOI) { tuy.kenh.guiNhiPhan(maGoiDiem({ phien, tGui, dau: n.dau, tGoc: n.tGoc, tu, diem: n.diem.slice(tu, tu + DIEM_TOI_DA_MOT_GOI) })); dem.goiWs += 1 }
          n.daWs = tong; lucWs = nay; wsDuoc = false
        } else conWs = true
      } else if (!canWs) n.daWs = tong
    }
    if (troCho) {
      const k = maTro({ phien, tGui, ...troCho })
      if (coDc) { try { dc!.send(k); dem.goiDc += 1 } catch { /* kênh vừa đóng */ } }
      if (canWs && !wsDuoc) conWs = true
      else { if (canWs) { tuy.kenh.guiNhiPhan(k); dem.goiWs += 1; lucWs = nay } troCho = null }
    }
    if (conWs) henXaSau(Math.max(1, WS_CACH_MS - (nay - lucWs)))
  }
  /** Bút nhấc khỏi bảng: xả nốt điểm, báo nhấc (DataChannel gửi hai lần vì không tin cậy). */
  function nhacBut(id: string): void {
    const n = net.get(id)
    if (!n) return
    if (dangLive()) {
      if (henXa != null) { mt.huyHen(henXa); henXa = null }
      lucWs = -1e9 // lô cuối của nét luôn được đi ngay
      xa()
      const k = maNhac({ phien: live!.phien, tGui: tLive(), id, tong: n.diem.length })
      if (dcMo()) { try { dc!.send(k); dc!.send(k); dem.goiDc += 2 } catch { /* kênh vừa đóng */ } }
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
    if (sk.loai === 'them-diem') {
      const n = net.get(sk.id)
      if (!n || !sk.diem.length) return
      for (const p of sk.diem) n.diem.push(p)
      lucNet = mt.dongHo()
      if (dangLive()) henXaSau(XA_MS)
    } else if (sk.loai === 'net-moi') {
      if (sk.xong) { guiSo(maNetXong(sk.net, sk.vt)); return }
      net.set(sk.net.id, { dau: { id: sk.net.id, cong: sk.net.cong, mau: sk.net.mau, co: sk.net.co }, diem: sk.net.diem.slice(), tGoc: null, daDc: 0, truocDc: 0, daWs: 0 })
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
      troCho = { x: sk.x, y: sk.y }
      henXaSau(XA_MS)
    }
  }
  /** Ảnh trạng thái của MỘT trang: bảng mới (khoá trang + tỉ lệ vùng viết) + mọi nét đang có ⇒ sổ của phòng gọn lại, máy em vào muộn nhận đúng bảng. */
  function guiAnh(a: AnhBang): void { guiSo(maBangMoi(a.trang, a.tiLe)); for (const n of a.net) guiSo(maNetXong(n)) }

  // ── TIN TỪ PHÒNG ──
  function nhanLive(l: ViewLiveBang | undefined): void {
    live = l ?? null
    if (!live) return
    if (live.bat && tuBat) daThayBat = true
    // Phòng tự tắt (hết buổi, quá 15 phút) — chỉ tin khi đã từng thấy phòng xác nhận lần bật này (view cũ còn trên đường không được tắt nhầm).
    else if (!live.bat && tuBat && daThayBat) { tuBat = false; ngatMic(); if (gui) void gui.replaceTrack(trackCam).catch(() => undefined) }
    dat({ xem: live.xem, xemWs: live.ws, tu: live.tu, mayKhacLive: live.bat && !tuBat, pha: live.bat && tuBat ? 'live' : tt.pha === 'live' ? 'san' : tt.pha, ...(live.tieng === 'chua-cau-hinh' ? { tieng: 'chua-cau-hinh' as const } : {}) })
  }
  /** Đợt 1B chuyển MỌI tin của phòng vào đây (chuỗi JSON, hoặc đối tượng đã parse). Tin không liên quan ⇒ bỏ qua. */
  function nhanTinPhong(d: unknown): void {
    let m: Record<string, unknown> | null = null
    if (typeof d === 'string') { if (!d.includes('"live') && !d.includes('"bang"')) return; try { m = JSON.parse(d) as Record<string, unknown> } catch { return } }
    else if (d && typeof d === 'object' && !(d instanceof ArrayBuffer)) m = d as Record<string, unknown>
    if (!m) return
    if (m.t === 'bang') nhanLive(m.live as ViewLiveBang | undefined)
    else if (m.t === 'live-xem') dat({ xem: Number(m.xem) || 0, xemWs: Number(m.ws) || 0 })
    else if (m.t === 'live-do') doEm = m
    else if (m.t === 'live-can-anh') { const anh = tuy.layAnh?.(); if (anh) guiAnh(anh) }
    else if (m.t === 'live-kq' && m.lenh === 'bat' && m.ok === false) { tuBat = false; dat({ pha: 'san', mayKhacLive: m.lyDo === 'dang-live' }) }
  }
  /** WebSocket của phòng vừa nối lại ⇒ báo lại trạng thái sẵn sàng (phòng bỏ qua nếu không đổi). */
  function khiNoiLai(): void {
    if (tt.pha === 'chua' || tt.pha === 'dang-noi') return
    tuy.kenh.gui({ t: 'live-san', ss: phienSfu ? { id: phienSfu, tieng: 'thay', kenh: dc ? 'net' : null } : null })
  }
  function huy(): void {
    if (tuBat) tat()
    huyRoi = true
    mt.huyHen(henXa); mt.huyHen(henNhip); henXa = henNhip = null
    ngatMic()
    try { trackCam?.stop() } catch { /* đã dừng */ }
    try { dc?.close() } catch { /* đã đóng */ }
    try { pc?.close() } catch { /* đã đóng */ }
    void amCtx?.close().catch(() => undefined)
    pc = null; dc = null; gui = null; amCtx = null; trackCam = null
    tuy.kenh.gui({ t: 'live-san', san: false })
  }

  return {
    trangThai: (): TrangThaiLiveThay => ({ ...tt }),
    noiSan, dsMic, moMic, mucAm, bat, tat, datTiengMic,
    nhanSuKienBut, guiAnh,
    /** Công tắc buổi: `xa` = cho em ở xa vào xem (điểm quyết 4), `tiengLop` = máy em trong lớp cũng phát tiếng (điểm quyết 3). */
    dat: (o: { xa?: boolean; tiengLop?: boolean }): void => { tuy.kenh.gui({ t: 'live-dat', ...o }) },
    nhanTinPhong, khiNoiLai,
    /** Số đo: gói đã gửi theo đường, RTT máy thầy ↔ SFU, số đo gộp của các máy em (phòng báo 10 giây một lần). */
    soDo: () => ({ ...dem, rtt, em: doEm, kenhNet: tt.kenhNet }),
    huy,
  }
}
export type LiveThay = ReturnType<typeof taoLiveThay>
