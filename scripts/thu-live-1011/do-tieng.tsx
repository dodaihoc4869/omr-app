// TRANG ĐO TIẾNG LIVE (11/11, thầy: «chỉnh tiếng trong và cực rõ», «học sinh nghe được nhưng hơi nhỏ») — thư viện THẬT `taoLiveThay` (mở mic, luật lọc, chuỗi làm
// rõ tiếng, sửa SDP Opus, `setParameters`) phát tiếng tới MỘT RTCPeerConnection thứ hai NGAY TRONG TRANG đóng vai «SFU + máy em» (Cloudflare Realtime SFU chỉ
// chuyển tiếp gói RTP, không mã hoá lại ⇒ số đo bộ mã ở đây đúng với đường thật; KHÔNG có trễ mạng). Nguồn tiếng: mic giả của Chromium đọc tệp WAV
// (`--use-file-for-fake-audio-capture`). Cách chạy: scripts/thu-live-1011/do-tieng.mjs.
import { taoLiveThay, type CheDoLoc } from '../../src/lib/live'
import type { TuyChonOpus } from '../../src/lib/live/sfu'
import { CHAN_DINH, NEN_RO } from '../../src/lib/live/thay'
import { goiLenBang, moLuot, taoPhong, viewBang } from '../../src/lib/bpu/phong'
import { datCoLive, liveBat, liveDat, liveMicBat, liveSan, liveTat, liveThuMic } from '../../src/lib/bpu/phong-live'

interface CauHinh { ten: string; loc: CheDoLoc; chuoi: boolean; opus?: TuyChonOpus }
const gomIce = (pc: RTCPeerConnection) => new Promise<void>((xong) => { if (pc.iceGatheringState === 'complete') { xong(); return } const h = setTimeout(xong, 1500); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(h); xong() } }) })
const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms))
const db = (v: number) => (v > 0 ? 20 * Math.log10(v) : -160)

/** Phát `giay` giây qua đúng đường của thư viện với `ch`, thu ở đầu nhận: phổ giữ đỉnh (dB theo tần số), RMS / đỉnh, tốc độ bit thật, trễ đệm nhận. */
async function doMot(ch: CauHinh, giay: number) {
  const st = taoPhong({ buoiId: 'do', lop: 'L', nay: Date.now(), ds: [{ sbd: 'S1', ten: 'Em', coMat: true, luc: 1 }] })
  datCoLive(st, { cho: true, sfu: true }, Date.now())
  let pc2: RTCPeerConnection | null = null
  let nhan: MediaStreamTrack | null = null
  const lt = taoLiveThay({
    ve: 've', goc: 'https://sfu-gia', loc: ch.loc, chuoi: ch.chuoi, opus: ch.opus,
    kenh: { gui: (t) => { if (t.t === 'live-bat') liveBat(st, Date.now()); if (t.t === 'live-tat') liveTat(st, Date.now()); if (t.t === 'live-san') liveSan(st, { san: t.san !== false, ss: t.ss }, Date.now()); if (t.t === 'live-dat') liveDat(st, t as never, Date.now()); if (t.t === 'live-bat' || t.t === 'live-dat') lt.nhanTinPhong(viewBang(st)) }, guiNhiPhan: () => {} },
    moiTruong: {
      fetch: (async (u: RequestInfo | URL, o?: RequestInit) => {
        const b = JSON.parse(String(o?.body ?? '{}')) as { sdp?: string }
        if (!String(u).endsWith('/noi') || !b.sdp) return new Response(JSON.stringify({ ok: false }))
        pc2 = new RTCPeerConnection()
        pc2.addEventListener('track', (e) => { nhan = e.track; try { (e.receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0 } catch { /* không hỗ trợ */ } })
        await pc2.setRemoteDescription({ type: 'offer', sdp: b.sdp })
        await pc2.setLocalDescription(await pc2.createAnswer())
        await gomIce(pc2)
        return new Response(JSON.stringify({ ok: true, phien: 'p'.repeat(16), sdp: pc2.localDescription!.sdp }))
      }) as typeof fetch,
    },
  })
  lt.nhanTinPhong(viewBang(st))
  const kq = await lt.bat({})
  if (!kq.ok) throw new Error(`bật live hỏng: ${kq.lyDo}`)
  for (let i = 0; i < 60 && !nhan; i++) await ngu(100)
  if (!nhan || !pc2) throw new Error('đầu nhận không có track')
  // Như máy em: gắn luồng vào <audio> (Chromium chỉ giải mã luồng WebRTC đang được phát) + đo bằng Web Audio.
  const luong = new MediaStream([nhan])
  const the = document.createElement('audio'); the.srcObject = luong; the.muted = true; void the.play().catch(() => undefined)
  const actx = new AudioContext({ sampleRate: 48000 })
  await actx.resume()
  const nguon = actx.createMediaStreamSource(luong)
  const pho = actx.createAnalyser(); pho.fftSize = 8192; pho.smoothingTimeConstant = 0; pho.minDecibels = -140
  const song = actx.createAnalyser(); song.fftSize = 2048
  nguon.connect(pho); nguon.connect(song)
  await ngu(2500) // bỏ đoạn đầu (bộ mã + tự chỉnh âm lượng ổn định)
  const giu = new Float32Array(pho.frequencyBinCount).fill(-200), kh = new Float32Array(pho.frequencyBinCount), m = new Float32Array(song.fftSize)
  let tong = 0, dem = 0, dinh = 0
  const rmsKhung: number[] = []
  const so0 = await (pc2 as RTCPeerConnection).getStats(), t0 = performance.now()
  for (const het = t0 + giay * 1000; performance.now() < het;) {
    pho.getFloatFrequencyData(kh)
    for (let i = 0; i < kh.length; i++) if (kh[i]! > giu[i]!) giu[i] = kh[i]!
    song.getFloatTimeDomainData(m)
    let s = 0
    for (let i = 0; i < m.length; i++) { const v = m[i]!; s += v * v; if (Math.abs(v) > dinh) dinh = Math.abs(v) }
    tong += s; dem += m.length; rmsKhung.push(Math.sqrt(s / m.length))
    await ngu(25)
  }
  const so1 = await (pc2 as RTCPeerConnection).getStats(), t1 = performance.now()
  const doc = (bc: RTCStatsReport) => { let byte = 0, tre = 0, phat = 0; bc.forEach((x: Record<string, unknown>) => { if (x.type === 'inbound-rtp' && x.kind === 'audio') { byte = Number(x.bytesReceived) || 0; tre = Number(x.jitterBufferDelay) || 0; phat = Number(x.jitterBufferEmittedCount) || 0 } }); return { byte, tre, phat } }
  const a = doc(so0), b = doc(so1)
  // RMS lúc CÓ tiếng (bỏ khung lặng dưới −50 dBFS — quãng nghỉ giữa các âm tiết)
  const coTieng = rmsKhung.filter((v) => v > 0.00316)
  const rmsNoi = coTieng.length ? Math.sqrt(coTieng.reduce((s, v) => s + v * v, 0) / coTieng.length) : 0
  // Phổ: gom về 96 điểm theo thang log 50 Hz … 22 kHz
  const hzMoiO = 48000 / pho.fftSize, diem: [number, number][] = []
  for (let k = 0; k < 96; k++) {
    const f0 = 50 * Math.pow(440, k / 96), f1 = 50 * Math.pow(440, (k + 1) / 96)
    let lon = -200
    for (let i = Math.max(1, Math.floor(f0 / hzMoiO)); i <= Math.min(giu.length - 1, Math.ceil(f1 / hzMoiO)); i++) if (giu[i]! > lon) lon = giu[i]!
    diem.push([Math.round(Math.sqrt(f0 * f1)), Math.round(lon * 10) / 10])
  }
  const cd = lt.chanDoan()
  lt.tat(); lt.huy()
  try { (pc2 as RTCPeerConnection).close() } catch { /* đã đóng */ }
  await actx.close()
  return {
    ten: ch.ten, pho: diem, rmsDb: Math.round(db(Math.sqrt(tong / Math.max(1, dem))) * 10) / 10, rmsNoiDb: Math.round(db(rmsNoi) * 10) / 10, dinhDb: Math.round(db(dinh) * 10) / 10,
    kbps: Math.round(((b.byte - a.byte) * 8) / (t1 - t0) * 10) / 10, demNhanMs: b.phat > a.phat ? Math.round(((b.tre - a.tre) / (b.phat - a.phat)) * 1000) : null,
    cauHinhMic: { hz: cd.hz, kenh: cd.kenh, vong: cd.vong, on: cd.on, agc: cd.agc, bac: cd.bac, chuoi: cd.chuoi, ctx: cd.ctx },
  }
}

/** Trễ thêm của chuỗi làm rõ tiếng (lọc 80 Hz → nén nâng mức → chặn đỉnh): dựng ngoại tuyến, đo vị trí đỉnh của một xung. */
async function treChuoi(): Promise<number> {
  const c = new OfflineAudioContext(1, 48000, 48000)
  const dem = c.createBuffer(1, 48000, 48000); dem.getChannelData(0)[4800] = 0.5
  const nguon = c.createBufferSource(); nguon.buffer = dem
  const cao = c.createBiquadFilter(); cao.type = 'highpass'; cao.frequency.value = 80; cao.Q.value = 0.707
  const nen = c.createDynamicsCompressor(); nen.threshold.value = NEN_RO.nguong; nen.knee.value = NEN_RO.goi; nen.ratio.value = NEN_RO.tiLe; nen.attack.value = 0.005; nen.release.value = 0.2
  const ha = c.createGain(); ha.gain.value = CHAN_DINH.ha
  const chan = c.createDynamicsCompressor(); chan.threshold.value = CHAN_DINH.nguong; chan.knee.value = 0; chan.ratio.value = 20; chan.attack.value = 0.001; chan.release.value = 0.08
  nguon.connect(cao); cao.connect(nen); nen.connect(ha); ha.connect(chan); chan.connect(c.destination); nguon.start()
  const ra = (await c.startRendering()).getChannelData(0)
  let vt = 0, lon = 0
  for (let i = 0; i < ra.length; i++) if (Math.abs(ra[i]!) > lon) { lon = Math.abs(ra[i]!); vt = i }
  return Math.round(((vt - 4800) / 48) * 10) / 10
}

const TRUOC: CauHinh = { ten: 'trước 11/11 (khử vọng + lọc ồn bật, 24 kb/s có DTX, không chuỗi)', loc: 'bat', chuoi: false, opus: { bitrate: 24000, dtx: true, rong: false } }
const SAU: CauHinh = { ten: 'sau · mặc định (không đường vọng: tắt khử vọng + lọc ồn, 64 kb/s, có chuỗi làm rõ tiếng)', loc: 'tu', chuoi: true }
const SAU_LOC: CauHinh = { ten: 'sau · chống hú («Tất cả»: bật khử vọng + lọc ồn, 64 kb/s, có chuỗi)', loc: 'bat', chuoi: true }
;(window as unknown as Record<string, unknown>).__doTieng = async (giay: number, ca: string[]) => {
  const ra = []
  for (const ch of [TRUOC, SAU, SAU_LOC]) if (ca.includes(ch === TRUOC ? 'truoc' : ch === SAU ? 'sau' : 'sau-loc')) ra.push(await doMot(ch, giay))
  return ra
}
/** PHỔ GỐC: cùng tệp nguồn, mic THÔ (không xử lý, không bộ mã), cùng cách đo ⇒ mốc để trừ ra đường truyền (phổ giữ đỉnh của tiếng quét tần tự nó không phẳng). */
;(window as unknown as Record<string, unknown>).__doGoc = async (giay: number) => {
  const luong = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
  const actx = new AudioContext({ sampleRate: 48000 })
  await actx.resume()
  const pho = actx.createAnalyser(); pho.fftSize = 8192; pho.smoothingTimeConstant = 0; pho.minDecibels = -140
  actx.createMediaStreamSource(luong).connect(pho)
  await ngu(500)
  const giu = new Float32Array(pho.frequencyBinCount).fill(-200), kh = new Float32Array(pho.frequencyBinCount)
  for (const het = performance.now() + giay * 1000; performance.now() < het;) { pho.getFloatFrequencyData(kh); for (let i = 0; i < kh.length; i++) if (kh[i]! > giu[i]!) giu[i] = kh[i]!; await ngu(25) }
  const hzMoiO = 48000 / pho.fftSize, diem: [number, number][] = []
  for (let k = 0; k < 96; k++) {
    const f0 = 50 * Math.pow(440, k / 96), f1 = 50 * Math.pow(440, (k + 1) / 96)
    let lon = -200
    for (let i = Math.max(1, Math.floor(f0 / hzMoiO)); i <= Math.min(giu.length - 1, Math.ceil(f1 / hzMoiO)); i++) if (giu[i]! > lon) lon = giu[i]!
    diem.push([Math.round(Math.sqrt(f0 * f1)), Math.round(lon * 10) / 10])
  }
  for (const t of luong.getTracks()) t.stop()
  await actx.close()
  return diem
}
;(window as unknown as Record<string, unknown>).__treChuoi = treChuoi
/** M1c ĐẦU-CUỐI TRÊN CHROMIUM THẬT (thầy 11/11: chọn đích danh mic, vạch máy thầy chạy, bật «Tất cả» mà em vẫn không nghe): thư viện thật của thầy → kết nối
 *  WebRTC thứ hai đóng vai «SFU + máy em». Các bước: đổi mic TRƯỚC khi bật live → bật live → đổi mic TRONG lúc live → tạm dừng → tiếp tục → đổi chế độ lọc →
 *  tắt live rồi bật lại. Sau MỖI bước đo Ở PHÍA EM: `inbound-rtp.totalAudioEnergy` phải TĂNG trong ≤ 2 giây (tạm dừng thì phải ĐỨNG YÊN), kèm mức RMS nhận
 *  được, track bộ gửi đang cầm, mức âm bộ gửi báo, vạch mic của thư viện. */
;(window as unknown as Record<string, unknown>).__doiMic = async (agc?: boolean) => {
  const st = taoPhong({ buoiId: 'do', lop: 'L', nay: Date.now(), ds: [{ sbd: 'S1', ten: 'Em', coMat: true, luc: 1 }] })
  datCoLive(st, { cho: true, sfu: true }, Date.now())
  let pc2: RTCPeerConnection | null = null, nhan: MediaStreamTrack | null = null, soNhan = 0, soDap = 0
  const actx = new AudioContext({ sampleRate: 48000 })
  const lt = taoLiveThay({
    ve: 've', goc: 'https://sfu-gia', loc: 'tu', agc,
    kenh: { gui: (t) => { if (t.t === 'live-bat') liveBat(st, Date.now()); if (t.t === 'live-tat') liveTat(st, Date.now()); if (t.t === 'live-san') liveSan(st, { san: t.san !== false, ss: t.ss }, Date.now()); if (t.t === 'live-dat') liveDat(st, t as never, Date.now()); if (String(t.t).startsWith('live-')) queueMicrotask(() => lt.nhanTinPhong(viewBang(st))) }, guiNhiPhan: () => undefined },
    moiTruong: { fetch: (async (u: RequestInfo | URL, o?: RequestInit) => {
      const b = JSON.parse(String(o?.body ?? '{}')) as { sdp?: string }
      // «SFU» đưa tiếng của em lên bảng về máy thầy: thêm một đường gửi (tiếng dao động thay giọng em) ⇒ LỜI MỜI MỚI cho máy thầy trả lời (đàm phán lại).
      if (String(u).endsWith('/nhan') && pc2) {
        const dd = actx.createOscillator(), ra = actx.createMediaStreamDestination(); dd.frequency.value = 330; dd.connect(ra); dd.start()
        pc2.addTransceiver(ra.stream.getAudioTracks()[0]!, { direction: 'sendonly' })
        await pc2.setLocalDescription(await pc2.createOffer())
        await gomIce(pc2)
        soNhan += 1
        return new Response(JSON.stringify({ ok: true, sdp: pc2.localDescription!.sdp }))
      }
      if (String(u).endsWith('/dap') && pc2 && b.sdp) { await pc2.setRemoteDescription({ type: 'answer', sdp: b.sdp }); soDap += 1; return new Response(JSON.stringify({ ok: true })) }
      if (!String(u).endsWith('/noi') || !b.sdp) return new Response(JSON.stringify({ ok: false }))
      const p = new RTCPeerConnection()
      p.addEventListener('track', (e) => { if (!nhan || nhan.readyState !== 'live' || e.transceiver.mid === '0') nhan = e.track })
      await p.setRemoteDescription({ type: 'offer', sdp: b.sdp })
      await p.setLocalDescription(await p.createAnswer())
      await gomIce(p)
      pc2 = p
      return new Response(JSON.stringify({ ok: true, phien: 'p'.repeat(16), sdp: p.localDescription!.sdp }))
    }) as typeof fetch },
  })
  lt.nhanTinPhong(viewBang(st))
  const ds = (await lt.dsMic()).filter((d) => d.id !== 'default')
  // KHÔNG tắt tiếng thẻ <audio>: Chromium tính `totalAudioEnergy` SAU âm lượng phát ⇒ thẻ tắt tiếng thì năng lượng luôn 0 dù tiếng vẫn tới.
  const the = document.createElement('audio'); the.autoplay = true
  await actx.resume()
  const song = actx.createAnalyser(); song.fftSize = 2048
  let dangNoi: MediaStreamTrack | null = null, nguon: MediaStreamAudioSourceNode | null = null
  /** Như máy em: track tiếng thầy gắn vào <audio> (Chromium chỉ giải mã luồng đang được phát) + bộ đo. */
  const noiNhan = () => { if (!nhan || nhan === dangNoi) return; dangNoi = nhan; const l = new MediaStream([nhan]); the.srcObject = l; void the.play().catch(() => undefined); try { nguon?.disconnect() } catch { /* chưa nối */ } nguon = actx.createMediaStreamSource(l); nguon.connect(song) }
  const byteNhan = async (): Promise<number> => { let v = 0; if (pc2) (await pc2.getStats()).forEach((x: Record<string, unknown>) => { if (x.type === 'inbound-rtp' && x.kind === 'audio') v = Number(x.bytesReceived) || 0 }); return v }
  const nangLuong = async (): Promise<number> => { let v = 0; if (pc2) (await pc2.getStats()).forEach((x: Record<string, unknown>) => { if (x.type === 'inbound-rtp' && x.kind === 'audio') v = Number(x.totalAudioEnergy) || 0 }); return v }
  const m = new Float32Array(song.fftSize), buoc: Record<string, unknown>[] = []
  /** Đo ngay sau bước `ten`: mấy ms thì năng lượng phía em bắt đầu tăng (null = không tăng trong 2 giây), rồi RMS nhận được trong 1 giây kế. */
  const do1 = async (ten: string) => {
    for (let i = 0; i < 40 && !nhan; i++) await ngu(50)
    noiNhan()
    const e0 = await nangLuong(), t0 = performance.now()
    let tang: number | null = null, e1 = e0
    while (performance.now() - t0 < 2000) { await ngu(100); e1 = await nangLuong(); if (e1 - e0 > 1e-4) { tang = Math.round(performance.now() - t0); break } }
    let s = 0, n = 0, vach = 0
    const b0 = await byteNhan(), tb0 = performance.now()
    for (const het = performance.now() + 1000; performance.now() < het;) { song.getFloatTimeDomainData(m); for (let i = 0; i < m.length; i++) s += m[i]! * m[i]!; n += m.length; vach = Math.max(vach, lt.mucAm()); await ngu(40) }
    const cd = lt.chanDoan()
    buoc.push({ buoc: ten, mic: cd.ten, boGuiCamMic: cd.gan, emNangLuongTangSauMs: tang, nhanRmsDb: Math.round(db(Math.sqrt(s / Math.max(1, n))) * 10) / 10, boGuiBao: cd.mucGui == null ? null : Math.round(cd.mucGui * 100) / 100, vach: Math.round(vach * 100) / 100, vong: cd.vong, bac: cd.bac, kbpsNhan: Math.round(((await byteNhan()) - b0) * 8 / (performance.now() - tb0) * 10) / 10 })
  }
  const bat = async () => { const kq = await lt.bat({}); if (!kq.ok) throw new Error(`bật live hỏng: ${kq.lyDo}`) }
  if (ds[0]) await lt.moMic(ds[0].id) // thầy chọn đích danh một mic TRƯỚC khi bật live
  await bat(); await do1(`chọn «${ds[0]?.ten ?? 'mặc định'}» trước khi bật live ⇒ bật live`)
  const moi = ds[ds.length - 1]
  if (moi && moi !== ds[0]) { await lt.moMic(moi.id); await do1(`đổi sang «${moi.ten}» TRONG lúc live`) }
  lt.tamDung(true); await ngu(1200); await do1('tạm dừng (phía em phải đứng yên)')
  lt.tamDung(false); await do1('tiếp tục'); await do1('3 giây sau khi tiếp tục')
  lt.datLoc('bat'); await ngu(400); await do1('thầy ép lọc «Bật» (mở lại cùng mic)')
  lt.datLoc('tu'); await ngu(400); await do1('về «Tự động»')
  // GỌI EM LÊN BẢNG, EM BẬT MIC (thầy 11/11, ảnh máy em: «Mic của em · Đang bật» mà «Thầy đang im»): máy thầy kéo tiếng em về ⇒ đàm phán lại trên kết nối
  // của thầy. Tiếng thầy phía em phải TIẾP TỤC có: trước khi gọi → em bật mic → em tắt mic → lượt mới.
  const PHIEN_EM = 'e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1'
  const bao = () => lt.nhanTinPhong(viewBang(st))
  moLuot(st, { qid: 'q', phan: 'I', tuLuan: false, cau: { text: 'Đề' }, dung: 'A', hanGiay: null }, Date.now()); bao()
  goiLenBang(st, 'S1', [], Date.now()); bao(); await do1('gọi em lên bảng (em chưa bật mic)')
  lt.datNgheEm(true)
  const micEm = liveMicBat(st, { sbd: 'S1', id: PHIEN_EM, tieng: 'mic', mid: '3' }, Date.now()); bao()
  for (let i = 0; i < 40 && soDap < 1; i++) await ngu(100)
  await do1(`em bật mic ⇒ máy thầy kéo tiếng em về (phòng nhận mic em: ${micEm}; đàm phán lại: ${soNhan} lời mời, ${soDap} câu trả lời)`)
  liveThuMic(st, Date.now(), 'S1'); bao(); await do1('em tắt mic / thầy thu mic')
  moLuot(st, { qid: 'q2', phan: 'I', tuLuan: false, cau: { text: 'Đề 2' }, dung: 'B', hanGiay: null }, Date.now()); bao(); await do1('lượt mới')
  lt.tat(); await ngu(1200); await do1('kết thúc live (phía em phải đứng yên)')
  await bat(); await do1('bật live lại')
  lt.tat(); lt.huy()
  try { (pc2 as RTCPeerConnection | null)?.close() } catch { /* đã đóng */ }
  await actx.close()
  return buoc
}
// ───────────── TRỄ THƯỜNG TRỰC + ĐỘ TRONG (thầy 11/11: «làm cho tức thì», «tiếng phải trong nhất») ─────────────
// Ba kênh thu CÙNG MỘT đồng hồ mẫu (một AudioContext đo, ScriptProcessor 3 kênh): 0 = mic của thầy (luồng trình duyệt giao) · 1 = đầu ra chuỗi làm rõ tiếng
// (track đang gửi) · 2 = tiếng nhận được ở «máy em» (sau Opus + đệm rung). Hiệu vị trí mẫu giữa các kênh = trễ từng chặng, chính xác tới mẫu.
interface CauHinh2 { ten: string; chuoi?: boolean; chuoiKieu?: 'khung' | 'nhanh' | 'nen'; agc?: boolean; loc?: CheDoLoc; locOn?: 'manh' | 'vua' | 'tat'; opus?: TuyChonOpus; demNhan0?: boolean }
const trungVi = (a: number[], q = 0.5): number | null => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.ceil((s.length - 1) * q))]! * 10) / 10 }
/** FFT cơ số 2 tại chỗ (phần thực / ảo). */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const t = re[i]!; re[i] = re[j]!; re[j] = t; const u = im[i]!; im[i] = im[j]!; im[j] = u } }
  for (let len = 2; len <= n; len <<= 1) {
    const goc = (-2 * Math.PI) / len, wr = Math.cos(goc), wi = Math.sin(goc)
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, xr = re[b]! * cr - im[b]! * ci, xi = re[b]! * ci + im[b]! * cr; re[b] = re[a]! - xr; im[b] = im[a]! - xi; re[a] = re[a]! + xr; im[a] = im[a]! + xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t } }
  }
}
/** Tín hiệu sin 1 kHz: SINAD (tín hiệu / (méo + tạp âm), dB) và THD (hài bậc 2–5 so với cơ bản, dB) trong 20 Hz – 20 kHz. Tính trên từng cửa sổ 8192 mẫu
 *  (170 ms) rồi lấy TRUNG VỊ: mic giả của Chromium thỉnh thoảng hụt một khối ⇒ vài cửa sổ có tiếng «tách» không phải của đường truyền. */
function doSin(x: Float32Array): { sinad: number; thd: number; mucDb: number; soCuaSo: number } | null {
  const N = 8192, ds: number[] = [], dt: number[] = []
  const o = (hz: number) => Math.round((hz * N) / 48000)
  for (let dau = 0; dau + N <= x.length; dau += N) {
    const re = new Float64Array(N), im = new Float64Array(N)
    for (let i = 0; i < N; i++) re[i] = x[dau + i]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)))
    fft(re, im)
    const pho = (i: number) => re[i]! * re[i]! + im[i]! * im[i]!
    let dinh = o(900)
    for (let i = o(900); i <= o(1100); i++) if (pho(i) > pho(dinh)) dinh = i
    const quanh = (k: number) => { let v = 0; for (let i = Math.max(1, k - 4); i <= Math.min(N / 2 - 1, k + 4); i++) v += pho(i); return v }
    const tin = quanh(dinh)
    let tong = 0, hai = 0
    for (let i = o(20); i <= o(20000); i++) tong += pho(i)
    for (let h = 2; h <= 5; h++) hai += quanh(dinh * h)
    if (tin <= 0) continue
    ds.push(10 * Math.log10(tin / Math.max(1e-30, tong - tin))); dt.push(10 * Math.log10(Math.max(1e-30, hai) / tin))
  }
  if (!ds.length) return null
  let e = 0
  for (let i = 0; i < x.length; i++) e += x[i]! * x[i]!
  return { sinad: trungVi(ds)!, thd: trungVi(dt)!, mucDb: Math.round(db(Math.sqrt(e / x.length)) * 10) / 10, soCuaSo: ds.length }
}
/** Chuỗi xung: vị trí mẫu của từng lần bật (ngưỡng 30 % đỉnh kênh, nghỉ tối thiểu 0,25 giây giữa hai xung). */
function batXung(x: Float32Array): number[] {
  let dinh = 0
  for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]!); if (v > dinh) dinh = v }
  const ra: number[] = [], ng = dinh * 0.3
  if (dinh < 1e-4) return ra
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i]!) > ng) { ra.push(i); i += 12000 }
  return ra
}
/** Giọng mẫu: mức lúc nói / đỉnh / ồn trong quãng nghỉ (phân khung theo kênh `moc`), độ «thở» (ồn nửa sau quãng nghỉ dài so với nửa đầu), và với kênh `goc`
 *  (đầu vào bộ mã) cho trước: tỉ số tín hiệu / sai khác dạng sóng theo khung 20 ms đã khớp trễ (segSNR) — méo + tạp âm do bộ mã và đường truyền. */
function doNoi(x: Float32Array, moc: Float32Array, goc: Float32Array | null) {
  const K = 960, nk = Math.floor(Math.min(x.length, moc.length) / K)
  const rms = (m: Float32Array, k: number, lech = 0) => { let e = 0; const d = k * K + lech; if (d < 0 || d + K > m.length) return 0; for (let i = 0; i < K; i++) e += m[d + i]! * m[d + i]!; return Math.sqrt(e / K) }
  const rm = Array.from({ length: nk }, (_, k) => rms(moc, k))
  const p95 = [...rm].sort((a, b) => a - b)[Math.floor(nk * 0.95)] || 1e-9
  // ngưỡng «đang nói»: −20 dB dưới mức nói, hoặc giữa mức nói và nền ồn (trung bình nhân) khi nền ồn cao — không thì ồn to bị tính là tiếng nói
  const p10 = [...rm].sort((a, b) => a - b)[Math.floor(nk * 0.1)] || 0
  const noi = rm.map((v) => v > Math.max(p95 * 0.1, Math.sqrt(p95 * p10)))
  // khung NGHỈ: chính nó và 5 khung hai bên (100 ms) đều không có tiếng
  const nghi = rm.map((_, k) => { for (let j = k - 5; j <= k + 5; j++) if (j < 0 || j >= nk || noi[j]) return false; return true })
  const LECH = 3 * K // đường truyền trễ ≈ 60 ms so với kênh mốc
  let eN = 0, nN = 0, eG = 0, nG = 0, dinh = 0
  for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]!); if (v > dinh) dinh = v }
  const dau: number[] = [], cuoi: number[] = []
  for (let k = 0; k < nk; k++) {
    const v = rms(x, k, LECH)
    if (noi[k]) { eN += v * v; nN++ } else if (nghi[k]) { eG += v * v; nG++ }
  }
  for (let k = 1; k < nk; k++) if (nghi[k] && !nghi[k - 1]) { let c = k; while (c < nk && nghi[c]) c++; if (c - k >= 14) { const g = Math.floor((c - k) / 2); let a = 0, b = 0; for (let j = 0; j < g; j++) { a += rms(x, k + j, LECH) ** 2; b += rms(x, c - g + j, LECH) ** 2 } dau.push(a / g); cuoi.push(b / g) } }
  const tb = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length)
  let seg: number | null = null
  if (goc) {
    // trễ chung: tương quan trên 0,5 giây có năng lượng lớn nhất, dò 0–200 ms
    let kLon = 0
    for (let k = 0; k + 25 < nk; k++) if (rm[k]! > rm[kLon]!) kLon = k
    const d0 = Math.max(0, (kLon - 12) * K), dai = 24000
    let lon = -1, tre = 0
    for (let lag = 0; lag <= 9600; lag += 2) { let c = 0; for (let i = 0; i < dai && d0 + i + lag < x.length; i += 2) c += goc[d0 + i]! * x[d0 + i + lag]!; if (c > lon) { lon = c; tre = lag } }
    const ds: number[] = []
    for (let k = 0; k < nk; k++) {
      if (!noi[k]) continue
      const d = k * K
      let tot = -1e9
      for (let lag = tre - 96; lag <= tre + 96; lag++) {
        if (d + lag < 0 || d + lag + K > x.length) continue
        let gg = 0, gx = 0, xx = 0
        for (let i = 0; i < K; i++) { const a = goc[d + i]!, b = x[d + i + lag]!; gg += a * a; gx += a * b; xx += b * b }
        if (gg < 1e-9 || xx < 1e-12) continue
        const sai = gg - (gx * gx) / xx // sai khác còn lại sau khi khớp hệ số khuếch đại
        const snr = 10 * Math.log10(gg / Math.max(1e-12, sai))
        if (snr > tot) tot = snr
      }
      if (tot > -1e8) ds.push(Math.min(60, tot))
    }
    seg = ds.length ? Math.round(tb(ds) * 10) / 10 : null
  }
  const r1 = (v: number) => Math.round(v * 10) / 10
  return { rmsNoiDb: r1(db(Math.sqrt(eN / Math.max(1, nN)))), dinhDb: r1(db(dinh)), onNghiDb: r1(db(Math.sqrt(eG / Math.max(1, nG)))), tinTrenOnDb: r1(db(Math.sqrt(eN / Math.max(1, nN))) - db(Math.sqrt(eG / Math.max(1, nG)))),
    thoDb: dau.length ? r1(10 * Math.log10(tb(cuoi) / Math.max(1e-30, tb(dau)))) : null, soQuangNghi: dau.length, segSnrDb: seg }
}
/** Trễ bằng TƯƠNG QUAN CHÉO trên giọng thật (bộ lọc sâu coi xung / giọng tổng hợp là ồn nên không đo bằng xung được): chia tín hiệu mic thành cửa sổ 0,5 giây,
 *  lấy các cửa sổ to nhất, dò độ lệch 0–250 ms cho kênh chuỗi và kênh nhận (lấy mẫu thưa 4 lần ⇒ bước 0,08 ms), trả trung vị. */
function treTuongQuan(k0: Float32Array, k1: Float32Array, k2: Float32Array) {
  const B = 4, W = 6000, thua = (m: Float32Array) => { const r = new Float32Array(Math.floor(m.length / B)); for (let i = 0; i < r.length; i++) r[i] = m[i * B]!; return r }
  const a = thua(k0), b = thua(k1), c = thua(k2), cs: { d: number; e: number }[] = []
  for (let d = 0; d + W + 3200 < a.length; d += W) { let e = 0; for (let i = 0; i < W; i++) e += a[d + i]! * a[d + i]!; cs.push({ d, e }) }
  cs.sort((x, y) => y.e - x.e)
  const tim = (y: Float32Array, d: number) => { let lon = -1, tre = 0; for (let lag = 0; lag <= 3000; lag++) { let s = 0, yy = 0; for (let i = 0; i < W; i += 2) { const v = y[d + i + lag]!; s += a[d + i]! * v; yy += v * v } const r = yy > 1e-12 ? (s * Math.abs(s)) / yy : -1; if (r > lon) { lon = r; tre = lag } } return (tre * B) / 48 }
  const chon = cs.slice(0, Math.max(4, Math.floor(cs.length * 0.4))), dc = chon.map((x) => tim(b, x.d)), dt = chon.map((x) => tim(c, x.d))
  return { soCuaSo: chon.length, chuoiMs: trungVi(dc), chuoiP95: trungVi(dc, 0.95), tongMs: trungVi(dt), tongP95: trungVi(dt, 0.95) }
}
/** Ồn ở QUÃNG NGHỈ DÀI (≥ 0,6 giây không có tiếng nói tại mic; lấy nửa giữa của quãng): mức tại mic và tại kênh `x` (lùi `lechMs`), dBFS.
 *  Giọng thật có nhiều quãng nghỉ ngắn còn đuôi tiếng ⇒ `doNoi` (quãng ≥ 100 ms) lẫn tiếng nói nhỏ; số này chỉ lấy chỗ chắc chắn im. */
function onNghiDai(k0: Float32Array, x: Float32Array, lechMs: number) {
  const K = 960, nk = Math.floor(k0.length / K), lech = Math.round(lechMs * 48)
  const rms = (m: Float32Array, d: number, n: number) => { let e = 0; if (d < 0 || d + n > m.length) return 0; for (let i = 0; i < n; i++) e += m[d + i]! * m[d + i]!; return e / n }
  const rm = Array.from({ length: nk }, (_, k) => Math.sqrt(rms(k0, k * K, K))), xep = [...rm].sort((a, b) => a - b), p95 = xep[Math.floor(nk * 0.95)] || 1e-9, p10 = xep[Math.floor(nk * 0.1)] || 0
  const noi = rm.map((v) => v > Math.max(p95 * 0.1, Math.sqrt(p95 * p10)))
  let eM = 0, eX = 0, n = 0, so = 0
  for (let k = 0; k < nk; k++) if (!noi[k] && (k === 0 || noi[k - 1])) { let c = k; while (c < nk && !noi[c]) c++; if (c - k >= 30) { const d = (k + Math.floor((c - k) / 4)) * K, dai = Math.floor((c - k) / 2) * K; eM += rms(k0, d, dai) * dai; eX += rms(x, d + lech, dai) * dai; n += dai; so++ } k = c }
  const r1 = (v: number) => Math.round(v * 10) / 10
  return so ? { soQuang: so, micDb: r1(10 * Math.log10(Math.max(1e-30, eM / n))), raDb: r1(10 * Math.log10(Math.max(1e-30, eX / n))) } : null
}
async function do2(ch: CauHinh2, kieu: 'xung' | 'sin' | 'noi' | 'that', giay: number, cho: number) {
  const st = taoPhong({ buoiId: 'do', lop: 'L', nay: Date.now(), ds: [{ sbd: 'S1', ten: 'Em', coMat: true, luc: 1 }] })
  datCoLive(st, { cho: true, sfu: true }, Date.now())
  let pc2: RTCPeerConnection | null = null, nhan: MediaStreamTrack | null = null, thu: RTCRtpReceiver | null = null
  const lt = taoLiveThay({
    ve: 've', goc: 'https://sfu-gia', loc: ch.loc ?? 'tu', locOn: ch.locOn, chuoi: ch.chuoi, chuoiKieu: ch.chuoiKieu, agc: ch.agc, opus: ch.opus,
    kenh: { gui: (t) => { if (t.t === 'live-bat') liveBat(st, Date.now()); if (t.t === 'live-tat') liveTat(st, Date.now()); if (t.t === 'live-san') liveSan(st, { san: t.san !== false, ss: t.ss }, Date.now()); if (t.t === 'live-dat') liveDat(st, t as never, Date.now()); if (String(t.t).startsWith('live-')) queueMicrotask(() => lt.nhanTinPhong(viewBang(st))) }, guiNhiPhan: () => undefined },
    moiTruong: { fetch: (async (u: RequestInfo | URL, o?: RequestInit) => {
      const b = JSON.parse(String(o?.body ?? '{}')) as { sdp?: string }
      if (!String(u).endsWith('/noi') || !b.sdp) return new Response(JSON.stringify({ ok: false }))
      const p = new RTCPeerConnection()
      p.addEventListener('track', (e) => { nhan = e.track; thu = e.receiver })
      await p.setRemoteDescription({ type: 'offer', sdp: b.sdp })
      await p.setLocalDescription(await p.createAnswer())
      await gomIce(p)
      pc2 = p
      return new Response(JSON.stringify({ ok: true, phien: 'p'.repeat(16), sdp: p.localDescription!.sdp }))
    }) as typeof fetch },
  })
  lt.nhanTinPhong(viewBang(st))
  const kq = await lt.bat({})
  if (!kq.ok) throw new Error('bật live hỏng: ' + kq.lyDo)
  for (let i = 0; i < 60 && !nhan; i++) await ngu(100)
  if (!nhan || !pc2 || !thu) throw new Error('đầu nhận không có track')
  // máy em thật đặt đệm rung thấp nhất (em.ts); `demNhan0: false` = để mặc định của trình duyệt, cho biết việc ấy đáng bao nhiêu ms
  if (ch.demNhan0 !== false) { try { (thu as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0 } catch { /* không hỗ trợ */ } try { (thu as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0 } catch { /* không hỗ trợ */ } }
  const the = document.createElement('audio'); the.autoplay = true; the.srcObject = new MediaStream([nhan]); void the.play().catch(() => undefined)
  const actx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' }); await actx.resume()
  await ngu(cho * 1000) // bộ mã, đệm rung, bộ nâng mức ổn định
  const mic = lt.luongMic(), gui = lt.trackGui()
  if (!mic || !gui) throw new Error('không có mic')
  const gop = actx.createChannelMerger(3)
  const mono = (l: MediaStream, kenh: number) => { const g = actx.createGain(); g.channelCount = 1; g.channelCountMode = 'explicit'; actx.createMediaStreamSource(l).connect(g); g.connect(gop, 0, kenh) }
  mono(mic, 0); mono(gui === mic.getAudioTracks()[0] ? mic : new MediaStream([gui]), 1); mono(new MediaStream([nhan]), 2)
  const N = Math.round(giay * 48000), kenh = [new Float32Array(N), new Float32Array(N), new Float32Array(N)]
  let vt = 0
  const sp = actx.createScriptProcessor(4096, 3, 1)
  sp.onaudioprocess = (e) => { const n = Math.min(4096, N - vt); if (n <= 0) return; for (let c = 0; c < 3; c++) kenh[c]!.set(e.inputBuffer.getChannelData(c).subarray(0, n), vt); vt += n }
  gop.connect(sp); sp.connect(actx.destination)
  const doc = async () => { let byte = 0, goi = 0, tre = 0, phat = 0, xl = 0; (await pc2!.getStats()).forEach((x: Record<string, unknown>) => { if (x.type === 'inbound-rtp' && x.kind === 'audio') { byte = Number(x.bytesReceived) || 0; goi = Number(x.packetsReceived) || 0; tre = Number(x.jitterBufferDelay) || 0; phat = Number(x.jitterBufferEmittedCount) || 0; xl = Number(x.totalProcessingDelay) || 0 } }); return { byte, goi, tre, phat, xl } }
  const a = await doc(), t0 = performance.now()
  while (vt < N) await ngu(100)
  const b = await doc(), t1 = performance.now()
  sp.onaudioprocess = null
  const cd = lt.chanDoan()
  const [k0, k1, k2] = kenh as [Float32Array, Float32Array, Float32Array]
  const ra: Record<string, unknown> = {
    ten: ch.ten, kieu, kbps: Math.round(((b.byte - a.byte) * 8) / (t1 - t0) * 10) / 10, goiMoiGiay: Math.round(((b.goi - a.goi) * 1000) / (t1 - t0)),
    demRungMs: b.phat > a.phat ? Math.round(((b.tre - a.tre) / (b.phat - a.phat)) * 10000) / 10 : null, xuLyNhanMs: b.phat > a.phat ? Math.round(((b.xl - a.xl) / (b.phat - a.phat)) * 10000) / 10 : null,
    mic: { hz: cd.hz, kenh: cd.kenh, vong: cd.vong, on: cd.on, agc: cd.agc, bac: cd.bac, treThuMs: cd.treThu, chuoi: cd.chuoi, kieu: cd.kieu, hzXuLy: cd.hzXuLy, locOn: cd.locOn, locOnChay: cd.locOnChay, locOnBo: cd.locOnBo, locOnTre: cd.locOnTre, df3: cd.df3 },
  }
  if (kieu === 'xung') {
    const x0 = batXung(k0), x1 = batXung(k1), x2 = batXung(k2), dChuoi: number[] = [], dTong: number[] = []
    for (const r of x0) {
      const c = x1.find((v) => v >= r - 48 && v < r + 14400), v2 = x2.find((v) => v > r && v < r + 18000)
      if (c != null) dChuoi.push((c - r) / 48)
      if (v2 != null) dTong.push((v2 - r) / 48)
    }
    Object.assign(ra, { soXung: x0.length, soNhan: dTong.length, chuoiMs: trungVi(dChuoi), chuoiP95: trungVi(dChuoi, 0.95), tongMs: trungVi(dTong), tongP95: trungVi(dTong, 0.95), tongNhoNhat: dTong.length ? Math.round(Math.min(...dTong) * 10) / 10 : null, tongLonNhat: dTong.length ? Math.round(Math.max(...dTong) * 10) / 10 : null })
  } else if (kieu === 'sin') Object.assign(ra, { sinMic: doSin(k0), sinChuoi: doSin(k1), sinNhan: doSin(k2) })
  else if (kieu === 'that') { const tq = treTuongQuan(k0, k1, k2); Object.assign(ra, { that: tq, noiMic: doNoi(k0, k0, null), noiChuoi: doNoi(k1, k0, null), noiNhan: doNoi(k2, k0, null), nghiChuoi: onNghiDai(k0, k1, tq.chuoiMs ?? 0), nghiNhan: onNghiDai(k0, k2, tq.tongMs ?? 60) }) }
  else Object.assign(ra, { noiMic: doNoi(k0, k0, null), noiChuoi: doNoi(k1, k0, null), noiNhan: doNoi(k2, k0, k1) })
  lt.tat(); lt.huy()
  try { (pc2 as RTCPeerConnection).close() } catch { /* đã đóng */ }
  await actx.close()
  return ra
}
;(window as unknown as Record<string, unknown>).__do2 = async (ds: CauHinh2[], kieu: 'xung' | 'sin' | 'noi' | 'that', giay: number, cho: number) => { const ra = []; for (const ch of ds) ra.push(await do2(ch, kieu, giay, cho)); return ra }
document.body.textContent = 'Trang đo tiếng Live — chạy bằng scripts/thu-live-1011/do-tieng.mjs'
