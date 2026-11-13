// TRANG ĐO «TĂNG TIẾNG» (13/11, thầy: «chỉ thêm tăng tiếng thôi», «tăng tiếng nhưng phải giữ được độ trong tiếng nhất có thể», «không được phép để mất tiếng»).
// Thư viện THẬT `taoLiveThay` (mở mic, Worker khung, hoán track) phát tới MỘT RTCPeerConnection thứ hai ngay trong trang (đóng vai «SFU + máy em»; SFU thật chỉ
// chuyển tiếp gói ⇒ mức tiếng ở đây đúng với đường thật). Nguồn: mic giả của Chromium đọc tệp WAV giọng tổng hợp. Cách chạy: do-tang-tieng.mjs.
// Đo LIÊN TỤC ở đầu nhận (RMS mỗi 10 ms) suốt một buổi live: Gốc → +3 → +6 → +9 → Gốc → +6 (đổi bậc GIỮA lúc live), ghi quãng câm dài nhất, mức từng chặng, đỉnh.
import { taoLiveThay } from '../../src/lib/live'
import { taoPhong, viewBang } from '../../src/lib/bpu/phong'
import { datCoLive, liveBat, liveDat, liveSan, liveTat } from '../../src/lib/bpu/phong-live'

const gomIce = (pc: RTCPeerConnection) => new Promise<void>((xong) => { if (pc.iceGatheringState === 'complete') { xong(); return } const h = setTimeout(xong, 1500); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(h); xong() } }) })
const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Chang { ten: string; db: number; giay: number }
async function doMot(kieuTieng: 'chuan' | 'lam-ro', lich: Chang[], khongKhung: boolean) {
  if (khongKhung) (globalThis as unknown as Record<string, unknown>).MediaStreamTrackProcessor = undefined // giả lập trình duyệt không có kiểu khung
  const st = taoPhong({ buoiId: 'do', lop: 'L', nay: Date.now(), ds: [{ sbd: 'S1', ten: 'Em', coMat: true, luc: 1 }] })
  datCoLive(st, { cho: true, sfu: true }, Date.now())
  let pc2: RTCPeerConnection | null = null, nhan: MediaStreamTrack | null = null
  const lt = taoLiveThay({
    ve: 've', goc: 'https://sfu-gia', kieuTieng, locOn: 'tat',
    kenh: { gui: (t) => { if (t.t === 'live-bat') liveBat(st, Date.now()); if (t.t === 'live-tat') liveTat(st, Date.now()); if (t.t === 'live-san') liveSan(st, { san: t.san !== false, ss: t.ss }, Date.now()); if (t.t === 'live-dat') liveDat(st, t as never, Date.now()); if (t.t === 'live-bat' || t.t === 'live-dat') lt.nhanTinPhong(viewBang(st)) }, guiNhiPhan: () => undefined },
    moiTruong: { fetch: (async (u: RequestInfo | URL, o?: RequestInit) => {
      const b = JSON.parse(String(o?.body ?? '{}')) as { sdp?: string }
      if (!String(u).endsWith('/noi') || !b.sdp) return new Response(JSON.stringify({ ok: false }))
      pc2 = new RTCPeerConnection()
      pc2.addEventListener('track', (e) => { nhan = e.track })
      await pc2.setRemoteDescription({ type: 'offer', sdp: b.sdp })
      await pc2.setLocalDescription(await pc2.createAnswer())
      await gomIce(pc2)
      return new Response(JSON.stringify({ ok: true, phien: 'p'.repeat(16), sdp: pc2.localDescription!.sdp }))
    }) as typeof fetch },
  })
  lt.nhanTinPhong(viewBang(st))
  const kq = await lt.bat({})
  if (!kq.ok) throw new Error(`bật live hỏng: ${kq.lyDo}`)
  for (let i = 0; i < 60 && !nhan; i++) await ngu(100)
  if (!nhan) throw new Error('đầu nhận không có track')
  const micT = lt.luongMic()!.getAudioTracks()[0]!
  const caiMic = micT.getSettings()
  const luong = new MediaStream([nhan])
  const the = document.createElement('audio'); the.srcObject = luong; the.muted = true; void the.play().catch(() => undefined)
  const actx = new AudioContext({ sampleRate: 48000 })
  await actx.resume()
  const doMoi = () => { const a = actx.createAnalyser(); a.fftSize = 512; return a } // ≈ 10,7 ms
  // ba điểm đo cùng một đồng hồ: tiếng MIC (sau xử lý của trình duyệt) · tiếng ĐANG GỬI (track trên bộ gửi, trước bộ mã) · tiếng NHẬN ở «máy em» (sau Opus)
  const song = doMoi(), doMic = doMoi(), doGui = doMoi()
  actx.createMediaStreamSource(luong).connect(song)
  actx.createMediaStreamSource(new MediaStream([micT])).connect(doMic)
  let nguonGui: MediaStreamAudioSourceNode | null = null, trackDo: MediaStreamTrack | null = null
  const noiGui = () => { const t = lt.trackGui(); if (!t || t === trackDo) return; trackDo = t; try { nguonGui?.disconnect() } catch { /* chưa nối */ } nguonGui = actx.createMediaStreamSource(new MediaStream([t])); nguonGui.connect(doGui) }
  noiGui()
  await ngu(12000) // bộ mã + tự chỉnh âm lượng của trình duyệt + bộ nâng mức của «Làm rõ» ổn định
  const m = new Float32Array(512), mm = new Float32Array(512), mg = new Float32Array(512)
  const mau: { t: number; r: number; d: number; c: string; rm: number; rg: number; dg: number }[] = []
  const t0 = performance.now()
  let chang = lich[0]!.ten, het = t0
  const ghiTrack: { chang: string; trackGui: string; chuoi: boolean; tang: number | undefined }[] = []
  for (const c of lich) {
    lt.datTang(c.db); chang = c.ten
    await ngu(30)
    const cd = lt.chanDoan()
    ghiTrack.push({ chang: c.ten, trackGui: lt.trackGui() === micT ? 'track mic gốc' : 'chuỗi khung', chuoi: cd.chuoi, tang: cd.tang })
    noiGui()
    het += c.giay * 1000
    while (performance.now() < het) {
      song.getFloatTimeDomainData(m); doMic.getFloatTimeDomainData(mm); doGui.getFloatTimeDomainData(mg)
      let s = 0, d = 0, sm = 0, sg = 0, dg = 0
      for (let i = 0; i < m.length; i++) { const v = m[i]!; s += v * v; if (Math.abs(v) > d) d = Math.abs(v); sm += mm[i]! * mm[i]!; sg += mg[i]! * mg[i]!; if (Math.abs(mg[i]!) > dg) dg = Math.abs(mg[i]!) }
      mau.push({ t: Math.round(performance.now() - t0), r: Math.sqrt(s / m.length), d, c: chang, rm: Math.sqrt(sm / 512), rg: Math.sqrt(sg / 512), dg })
      await ngu(10)
    }
  }
  lt.tat(); lt.huy()
  try { (pc2 as RTCPeerConnection | null)?.close() } catch { /* đã đóng */ }
  await actx.close()
  return { kieuTieng, khongKhung, caiMic: { ec: caiMic.echoCancellation, ns: caiMic.noiseSuppression, agc: caiMic.autoGainControl, kenh: caiMic.channelCount }, ghiTrack, mau }
}
;(window as unknown as Record<string, unknown>).__doTang = doMot
