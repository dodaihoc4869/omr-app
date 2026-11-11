// TRANG ĐO MÁY GHI «XEM LẠI LIVE» (11/11) — chạy MÁY GHI THẬT (src/lib/live/may-ghi.ts: AudioWorklet ⇒ Web Worker ⇒ LAME wasm ⇒ khúc 10 giây ⇒ tải lên)
// với mic giả của Chromium, khúc tải về máy chủ thử cục bộ (do-ghi.mjs). Sau khi dừng: ghép khúc bằng NỐI KHUNG như máy chủ làm, mở tệp MP3 bằng <audio>
// qua HTTP Range, tua và đo `currentTime`. Không chạm máy chủ thật, không dữ liệu học sinh.
import { taoMayGhi } from '../../src/lib/live/may-ghi'
import { docKhuc } from '../../src/lib/live/xem-lai-khuc'
import { BYTE_MOI_KHUNG, MS_MOI_KHUNG, byteCua, tachKhung } from '../../src/lib/live/xem-lai-mp3'

const nk = document.getElementById('nk')!
const ghi = (s: string): void => { nk.textContent += `${s}\n` }
const ngu = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
const trungVi = (ds: number[]): number => { const s = [...ds].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)]! : NaN }
const p95 = (ds: number[]): number => { const s = [...ds].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]! : NaN }

/** Dò lúc tiếng «bíp» của mic giả bắt đầu (giờ máy, ms) bằng AnalyserNode ở luồng chính — để so với mốc giờ trong tệp ghi. */
function doBip(mic: MediaStream) {
  const ctx = new AudioContext(), nguon = ctx.createMediaStreamSource(mic), soi = ctx.createAnalyser()
  soi.fftSize = 256
  nguon.connect(soi)
  const mau = new Float32Array(soi.fftSize), luc: number[] = []
  let to = false, song = true
  const vong = (): void => {
    if (!song) return
    soi.getFloatTimeDomainData(mau)
    let s = 0
    for (let i = 0; i < mau.length; i++) s += mau[i]! * mau[i]!
    const co = Math.sqrt(s / mau.length) > 0.05
    if (co && !to) luc.push(Date.now())
    to = co
    setTimeout(vong, 2)
  }
  vong()
  return { luc, dung: (): void => { song = false; void ctx.close() } }
}

async function chay(giay: number): Promise<Record<string, unknown>> {
  const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } })
  const bip = doBip(mic)
  const tin: Record<string, unknown>[] = [], khucBao: { stt: number; kh: number; byte: number; t0: number; ok: boolean; luc: number }[] = []
  const batDau = Date.now(), cpu0 = performance.now()
  const may = taoMayGhi({ goc: location.origin, ve: 've-thu', buoi: 'thu', layLuong: () => ({ mic, em: null }), gui: (t) => { tin.push(t) }, khiKhuc: (k) => { khucBao.push({ ...k, luc: Date.now() - batDau }) } })
  ghi(`Bắt đầu ghi ${giay} giây, phiên ${may.phien}`)
  // mốc nét giả mỗi 3 giây (như thầy bắt đầu một nét)
  const mocNet: [string, number][] = []
  for (let t = 0; t < giay * 1000; t += 3000) { await ngu(Math.max(0, batDau + t - Date.now())); const luc = Date.now(); may.danhDau(`n${mocNet.length}`, luc); mocNet.push([`n${mocNet.length}`, luc]) }
  await ngu(Math.max(0, batDau + giay * 1000 - Date.now()))
  const lucDung = Date.now()
  await may.dung()
  const msDung = Date.now() - lucDung
  bip.dung()
  for (const t of mic.getTracks()) t.stop()
  ghi(`Dừng sau ${Date.now() - batDau} ms; máy ghi dừng + tải khúc cuối mất ${msDung} ms`)

  // Ghép khúc = nối khung (đúng cách máy chủ chốt)
  const ds = (await (await fetch('/khuc')).json()) as { khoa: string; stt: number }[]
  const khuc: { stt: number; kh: number; khThat: number; byte: number; t0: number; tm: number; mucCao: number; soMuc: number; net: [string, number][] }[] = []
  const manh: Uint8Array[] = []
  for (const k of ds.sort((a, b) => a.stt - b.stt)) {
    const b = new Uint8Array(await (await fetch(`/khuc/${k.stt}`)).arrayBuffer()), d = docKhuc(b)
    if (!d) { ghi(`Khúc ${k.stt} hỏng`); continue }
    const t = tachKhung(d.mp3)
    khuc.push({ stt: k.stt, kh: d.dau.kh, khThat: t.khung.length, byte: b.length, t0: d.dau.t0, tm: d.dau.tm, mucCao: Math.max(0, ...d.dau.muc), soMuc: d.dau.muc.length, net: d.dau.net })
    for (const f of t.khung) manh.push(d.mp3.subarray(f.vt, f.vt + f.dai))
  }
  const tieng = new Uint8Array(manh.reduce((s, x) => s + x.length, 0))
  { let o = 0; for (const x of manh) { tieng.set(x, o); o += x.length } }
  await fetch('/tieng', { method: 'POST', body: tieng })
  const soKhung = tieng.length / BYTE_MOI_KHUNG, msTheoKhung = soKhung * MS_MOI_KHUNG
  ghi(`Ghép ${khuc.length} khúc: ${tieng.length} byte, ${soKhung} khung, ${msTheoKhung} ms`)

  // Giải mã cả tệp (chỉ để ĐO): thời lượng thật + vị trí các tiếng bíp trong tệp
  const giaiCtx = new AudioContext()
  const pcm = await giaiCtx.decodeAudioData(tieng.slice().buffer)
  const kenh = pcm.getChannelData(0), hz = pcm.sampleRate
  const bipTep: number[] = []
  { const cua = Math.round(hz * 0.005); let to = false
    for (let i = 0; i + cua <= kenh.length; i += Math.round(hz * 0.001)) { let s = 0; for (let j = 0; j < cua; j++) s += kenh[i + j]! * kenh[i + j]!; const co = Math.sqrt(s / cua) > 0.05; if (co && !to) bipTep.push((i * 1000) / hz); to = co } }
  void giaiCtx.close()
  // Lệch mốc giờ: (t0 của khúc đầu + vị trí bíp trong tệp) so với giờ máy lúc luồng chính nghe thấy bíp đó
  const t0Dau = khuc[0]?.t0 ?? 0, lech: number[] = []
  for (const p of bipTep) { const gio = t0Dau + p; let gan = Infinity; for (const l of bip.luc) if (Math.abs(l - gio) < Math.abs(gan - gio)) gan = l; if (Math.abs(gan - gio) < 250) lech.push(gio - gan) }
  // Trôi giữa đồng hồ mẫu và đồng hồ máy: t0 các khúc liên tiếp phải cách nhau đúng số khung × 24 ms
  const troi = khuc.slice(1).map((k, i) => k.t0 - khuc[i]!.t0 - khuc[i]!.khThat * MS_MOI_KHUNG)

  // <audio> qua HTTP Range: thời lượng trình duyệt báo, tua, đo currentTime
  const a = document.getElementById('tieng') as HTMLAudioElement
  a.src = `/tieng.mp3?b=${Date.now()}`
  await new Promise<void>((xong, loi) => { a.onloadedmetadata = () => xong(); a.onerror = () => loi(new Error('audio lỗi')); setTimeout(() => xong(), 8000) })
  const dai = a.duration
  const tua: { dich: number; den: number; lech: number; ms: number }[] = []
  for (const ti of [0.5, 0.25, 0.75, 0.9, 0.1, 0.6, 0.33]) {
    const dich = Math.round(dai * ti * 1000) / 1000, t = performance.now()
    await new Promise<void>((xong) => { a.onseeked = () => xong(); a.currentTime = dich; setTimeout(() => xong(), 5000) })
    tua.push({ dich, den: a.currentTime, lech: Math.round((a.currentTime - dich) * 1000), ms: Math.round(performance.now() - t) })
  }
  // tua tới GIỮA rồi phát 2 giây: đồng hồ phải chạy tiếp từ đúng chỗ
  await new Promise<void>((xong) => { a.onseeked = () => xong(); a.currentTime = dai / 2; setTimeout(() => xong(), 5000) })
  const giua = a.currentTime
  a.muted = true
  const lucPhat = performance.now()
  await a.play().catch(() => undefined)
  await ngu(2000)
  const sauPhat = a.currentTime, daPhat = performance.now() - lucPhat
  a.pause()
  const range = (await (await fetch('/range')).json()) as string[]
  // TỆP DÀI (tiếng vừa ghi lặp 9 lần ≈ 10 phút, máy chủ thử gửi chậm ~0,4 MB/giây): tua phải đi qua HTTP Range thật — đo byte trình duyệt xin so với byte tính theo CBR.
  const lap = 9, daiTep = new Uint8Array(tieng.length * lap)
  for (let i = 0; i < lap; i++) daiTep.set(tieng, i * tieng.length)
  await fetch('/tieng-dai', { method: 'POST', body: daiTep })
  a.src = `/tieng-dai.mp3?b=${Date.now()}`
  await new Promise<void>((xong) => { a.onloadedmetadata = () => xong(); setTimeout(() => xong(), 8000) })
  const daiBao = a.duration, tuaDai: { dich: number; den: number; lech: number; ms: number; range: string; byteCbr: number }[] = []
  for (const ti of [0.5, 0.8, 0.3, 0.95]) {
    const dich = Math.round(daiBao * ti * 1000) / 1000, t = performance.now()
    const truoc = ((await (await fetch('/range-dai')).json()) as string[]).length
    await new Promise<void>((xong) => { a.onseeked = () => xong(); a.currentTime = dich; setTimeout(() => xong(), 8000) })
    const ms = Math.round(performance.now() - t)
    const moi = ((await (await fetch('/range-dai')).json()) as string[]).slice(truoc)
    tuaDai.push({ dich, den: a.currentTime, lech: Math.round((a.currentTime - dich) * 1000), ms, range: moi.join(' '), byteCbr: byteCua(dich * 1000) })
  }
  a.muted = true
  await new Promise<void>((xong) => { a.onseeked = () => xong(); a.currentTime = daiBao / 2; setTimeout(() => xong(), 8000) })
  const giuaDai = a.currentTime, lucPhatDai = performance.now()
  await a.play().catch(() => undefined)
  await ngu(2000)
  const sauDai = a.currentTime, daPhatDai = Math.round(performance.now() - lucPhatDai)
  a.pause()
  // NỘI DUNG sau khi tua có đúng chỗ không: nghe tiếng bíp qua AnalyserNode lúc phát, ghi `currentTime` lúc bíp bắt đầu, so với vị trí bíp THẬT trong tệp
  // (tệp dài = đoạn vừa ghi lặp lại ⇒ bíp ở k × thời lượng đoạn + vị trí bíp trong đoạn). Bíp cách nhau ~0,5 giây ⇒ phép đo chỉ bắt được lệch dưới ±0,25 giây.
  const ctxDo = new AudioContext(), soi = ctxDo.createAnalyser()
  soi.fftSize = 256
  ctxDo.createMediaElementSource(a).connect(soi) // không nối ra loa
  const mauDo = new Float32Array(soi.fftSize), daiDoan = msTheoKhung / 1000, noiDung: { dich: number; soBip: number; lechTrungVi: number; lechLon: number }[] = []
  a.muted = false
  for (const ti of [0.5, 0.2, 0.85]) {
    await new Promise<void>((xong) => { a.onseeked = () => xong(); a.currentTime = daiBao * ti; setTimeout(() => xong(), 8000) })
    await a.play().catch(() => undefined)
    const lechBip: number[] = [], het = performance.now() + 4000
    let to = true // bỏ bíp đang kêu dở lúc bắt đầu phát
    while (performance.now() < het) {
      soi.getFloatTimeDomainData(mauDo)
      let sm = 0
      for (let i = 0; i < mauDo.length; i++) sm += mauDo[i]! * mauDo[i]!
      const co = Math.sqrt(sm / mauDo.length) > 0.05
      if (co && !to) { const c = a.currentTime, trongDoan = (c % daiDoan) * 1000; let gan = Infinity; for (const b of bipTep) if (Math.abs(trongDoan - b) < Math.abs(gan)) gan = trongDoan - b; lechBip.push(gan) }
      to = co
      await ngu(2)
    }
    a.pause()
    noiDung.push({ dich: Math.round(daiBao * ti * 1000) / 1000, soBip: lechBip.length, lechTrungVi: Math.round(trungVi(lechBip)), lechLon: Math.round(Math.max(0, ...lechBip.map(Math.abs))) })
  }
  void ctxDo.close()
  a.removeAttribute('src'); a.load()
  const kq = {
    giayGhi: giay, hzVao: may.soDo().hz, soKhuc: khuc.length, khuc: khuc.map((k) => ({ stt: k.stt, kh: k.khThat, khGhi: k.kh, byte: k.byte, soMuc: k.soMuc, mucCao: k.mucCao, soNet: k.net.length })),
    byteTieng: tieng.length, soKhung, msTheoKhung, msGiaiMa: Math.round(pcm.duration * 1000), msDung, khucBao: khucBao.filter((k) => !k.ok).map((k) => ({ stt: k.stt, luc: k.luc })), khucDaTai: khucBao.filter((k) => k.ok).length,
    tinPhong: { so: tin.length, dau: tin[0], cuoi: tin[tin.length - 1] },
    bip: { trongTep: bipTep.length, luongChinh: bip.luc.length, khop: lech.length, lechTrungVi: Math.round(trungVi(lech)), lechP95: Math.round(p95(lech.map(Math.abs))), lechNho: Math.round(Math.min(...lech)), lechLon: Math.round(Math.max(...lech)) },
    troiKhuc: { trungVi: Math.round(trungVi(troi)), lon: Math.round(Math.max(0, ...troi.map(Math.abs))) },
    mocNet: { gui: mocNet.length, trongKhuc: khuc.reduce((s, k) => s + k.net.length, 0), lechLon: Math.max(0, ...khuc.flatMap((k) => k.net.map(([id, rel]) => { const g = mocNet.find((m) => m[0] === id); return g ? Math.abs(k.t0 + rel - g[1]) : 0 }))) },
    audio: { thoiLuongBao: dai, thoiLuongTheoKhung: msTheoKhung / 1000, tua, giua: { dich: dai / 2, den: giua, sau2Giay: sauPhat, daPhatMs: Math.round(daPhat) }, range, byteGiuaTheoCbr: byteCua((dai / 2) * 1000) },
    tepDai: { byte: daiTep.length, thoiLuongBao: daiBao, thoiLuongTheoKhung: (daiTep.length / BYTE_MOI_KHUNG) * MS_MOI_KHUNG / 1000, tua: tuaDai, giua: { dich: daiBao / 2, den: giuaDai, sau2Giay: sauDai, daPhatMs: daPhatDai }, noiDungSauTua: noiDung },
    cpuMs: Math.round(performance.now() - cpu0),
  }
  ghi(JSON.stringify(kq, null, 1))
  return kq
}
;(window as unknown as { __chay: typeof chay }).__chay = chay
