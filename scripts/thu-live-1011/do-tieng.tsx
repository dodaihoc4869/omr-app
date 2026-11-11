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
;(window as unknown as Record<string, unknown>).__doiMic = async () => {
  const st = taoPhong({ buoiId: 'do', lop: 'L', nay: Date.now(), ds: [{ sbd: 'S1', ten: 'Em', coMat: true, luc: 1 }] })
  datCoLive(st, { cho: true, sfu: true }, Date.now())
  let pc2: RTCPeerConnection | null = null, nhan: MediaStreamTrack | null = null, soNhan = 0, soDap = 0
  const actx = new AudioContext({ sampleRate: 48000 })
  const lt = taoLiveThay({
    ve: 've', goc: 'https://sfu-gia', loc: 'tu',
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
  lt.tamDung(false); await do1('tiếp tục')
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
document.body.textContent = 'Trang đo tiếng Live — chạy bằng scripts/thu-live-1011/do-tieng.mjs'
