// PHẦN ĐO DÙNG CHUNG của hai phép thử tiếng thật (tieng-that.mjs: bản dựng thật + phòng giả; phong-that.mjs: phòng THẬT + giao diện đầy đủ).
// `moc` chạy TRONG TRANG trước mã app (addInitScript): ghi mọi PeerConnection, track nhận, thẻ <audio>, luồng mic, Worker / AudioContext của app; hàm đo `__do`.
// `taoKetLuan` chấm MỘT chiều theo tầng 0 mic vào · 1 phía gửi · 2 phía nhận · 3 phần tử phát (+ tương quan đường bao với mẫu giọng).
import { duongBao, tuongQuan } from './giong.mjs'

// ── Móc trong trang (chạy trước mã app) ──
export function moc() {
  if (window.__moc) return
  window.__moc = true
  window.__pcs = []; window.__tracks = []; window.__am = []; window.__mic = []
  const P = window.RTCPeerConnection
  if (P) {
    const PC = function (...a) { const p = new P(...a); window.__pcs.push(p); p.addEventListener('track', (e) => { if (e.track.kind === 'audio') window.__tracks.push({ pc: p, t: e.track }) }); return p }
    PC.prototype = P.prototype; Object.setPrototypeOf(PC, P)
    window.RTCPeerConnection = PC
  }
  const ce = Document.prototype.createElement
  Document.prototype.createElement = function (t, o) { const e = ce.call(this, t, o); if (typeof t === 'string' && t.toLowerCase() === 'audio') window.__am.push(e); return e }
  const A = window.Audio
  if (A) { const Au = function (s) { const e = new A(s); window.__am.push(e); return e }; Au.prototype = A.prototype; window.Audio = Au }
  const bl = new Map(), cu = URL.createObjectURL.bind(URL)
  URL.createObjectURL = (b) => { const u = cu(b); if (b instanceof Blob) bl.set(u, b); return u }
  window.__workers = []; window.__ctxs = []
  const W = window.Worker
  if (W) { const Wk = function (u, o) { const w = new W(u, o); window.__workers.push(w); w.__loai = '?'; const b = bl.get(String(u)); if (b) b.text().then((t) => { w.__loai = t.includes('xuLy(') ? 'khung' : t.includes('df_process_frame') ? 'df3' : 'khac' }); return w }; Wk.prototype = W.prototype; window.Worker = Wk }
  const AC = window.AudioContext
  if (AC) { const Ac = function (o) { const c = new AC(o); if (!window.__dangDo) window.__ctxs.push(c); return c }; Ac.prototype = AC.prototype; Object.setPrototypeOf(Ac, AC); window.AudioContext = Ac }
  const md = navigator.mediaDevices
  if (md?.getUserMedia) { const g = md.getUserMedia.bind(md); md.getUserMedia = async (c) => { const s = await g(c); window.__mic.push(s); return s } }
  const pcSong = () => window.__pcs.filter((p) => p.signalingState !== 'closed')
  window.__chon = (vai) => {
    if (vai === 'micTho') { for (let i = window.__mic.length - 1; i >= 0; i--) { const t = window.__mic[i].getAudioTracks()[0]; if (t && t.readyState === 'live') return t } return null }
    const ds = pcSong(), p = ds[ds.length - 1]
    if (!p) return null
    if (vai === 'gui') { const s = p.getSenders().filter((x) => x.track && x.track.kind === 'audio'); return s.length ? s[s.length - 1].track : null }
    const tr = window.__tracks.filter((x) => x.pc === p).map((x) => x.t)
    if (vai === 'nhanDau') return tr[0] ?? null
    if (vai === 'nhanCuoi') return tr.length > (window.__laThay ? 0 : 1) ? tr[tr.length - 1] : null
    return null
  }
  window.__anh = async (t) => {
    const ra = {}
    const bcs = await Promise.all(pcSong().map((p) => p.getStats().catch(() => null)))
    for (const [vai, tr] of Object.entries(t)) {
      if (!tr || vai === 'micTho') continue
      for (const bc of bcs) {
        if (!bc) continue
        const ds = []; bc.forEach((s) => ds.push(s))
        if (vai === 'gui') {
          const ms = ds.find((s) => s.type === 'media-source' && s.kind === 'audio' && s.trackIdentifier === tr.id)
          if (!ms) continue
          const ob = ds.find((s) => s.type === 'outbound-rtp' && s.kind === 'audio' && s.mediaSourceId === ms.id)
          ra[vai] = { byte: ob?.bytesSent ?? 0, goi: ob?.packetsSent ?? 0, muc: ms.audioLevel ?? 0, nl: ms.totalAudioEnergy ?? 0 }
        } else {
          const ib = ds.find((s) => s.type === 'inbound-rtp' && s.kind === 'audio' && s.trackIdentifier === tr.id)
          if (ib) ra[vai] = { byte: ib.bytesReceived ?? 0, goi: ib.packetsReceived ?? 0, muc: ib.audioLevel ?? 0, nl: ib.totalAudioEnergy ?? 0, an: ib.concealedSamples ?? 0, mau: ib.totalSamplesReceived ?? 0 }
        }
      }
    }
    return ra
  }
  window.__phanTu = (t) => {
    if (!t) return null
    const e = window.__am.find((a) => { const so = a.srcObject; return so && typeof so.getAudioTracks === 'function' && so.getAudioTracks().some((x) => x.id === t.id) })
    if (!e) return { co: false, tr: { rs: t.readyState, en: t.enabled, mu: t.muted } }
    return { co: true, dung: e.paused, tat: e.muted, vol: e.volume, ct: e.currentTime, rs: e.readyState, loa: typeof e.sinkId === 'string' ? e.sinkId : null, tr: { rs: t.readyState, en: t.enabled, mu: t.muted } }
  }
  window.__thu = async (t, ms) => {
    window.__dangDo = true
    const C = window.__ctxDo ?? (window.__ctxDo = new AudioContext())
    window.__dangDo = false
    try { await C.resume() } catch { /* bị chặn */ }
    const e = {}, nut = []
    for (const [vai, tr] of Object.entries(t)) {
      if (!tr) continue
      const ds = []; e[vai] = ds
      try {
        const n = C.createMediaStreamSource(new MediaStream([tr])), sp = C.createScriptProcessor(1024, 1, 1)
        sp.onaudioprocess = (ev) => { const x = ev.inputBuffer.getChannelData(0); let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; ds.push(Math.sqrt(s / x.length)) }
        n.connect(sp); sp.connect(C.destination); nut.push(n, sp)
      } catch { /* không đo được */ }
    }
    await new Promise((r) => setTimeout(r, ms))
    for (const n of nut) { try { n.disconnect() } catch { /* đã gỡ */ } }
    return { d: 1024 / C.sampleRate, st: C.state, e }
  }
  window.__do = async (cacVai, ms) => {
    const t = {}
    for (const v of cacVai) t[v] = window.__chon(v)
    const s0 = await window.__anh(t), p0 = {}
    for (const v of cacVai) p0[v] = window.__phanTu(t[v])
    const thu = await window.__thu(t, ms)
    const s1 = await window.__anh(t), p1 = {}
    for (const v of cacVai) p1[v] = window.__phanTu(t[v])
    const ds = window.__pcs.filter((p) => p.signalingState !== 'closed'), pc = ds[ds.length - 1]
    return { co: Object.fromEntries(cacVai.map((v) => [v, !!t[v]])), s0, s1, p0, p1, thu, pc: pc ? { cs: pc.connectionState, ice: pc.iceConnectionState, so: window.__pcs.length } : null }
  }
}

/** Bộ chấm theo tầng. `mauMono` = mẫu giọng 48 kHz một kênh; `giay` = độ dài cửa sổ đo. Trả `ketLuan(pha, ten, nguon, dich, vaiNhan, thietKe?, moDoi?)`
 *  (đẩy một dòng bảng vào `dong`), `loi()` = số chiều câm thật (không tính «thiết kế» / «mong đợi»). */
export function taoKetLuan({ nhan, giay, mauMono }) {
  const dong = [], NGUONG_R = 0.5
  let soLoi = 0
  const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100)
  const db = (ds) => { if (!ds?.length) return null; let s = 0; for (const v of ds) s += v * v; return r2(20 * Math.log10(Math.max(1e-5, Math.sqrt(s / ds.length)))) }
  const r = (thu, vai) => { const ds = thu?.e?.[vai]; if (!ds?.length) return null; const n = Float32Array.from(ds, (v) => 20 * Math.log10(Math.max(1e-4, v))); return tuongQuan(n.slice(4), duongBao(mauMono, 48000, thu.d)) }
  function ketLuan(pha, ten, nguon, dich, vaiNhan, thietKe = '', moDoi = '') {
    const L0 = { db: db(nguon.thu.e.micTho), r: r(nguon.thu, 'micTho') }
    const g0 = nguon.s0.gui, g1 = nguon.s1.gui
    const L1 = { co: !!nguon.co.gui, byte: g1 && g0 ? g1.byte - g0.byte : null, nl: g1 && g0 ? r2((g1.nl - g0.nl) * 1000) : null, db: db(nguon.thu.e.gui), r: r(nguon.thu, 'gui') }
    const n0 = dich.s0[vaiNhan], n1 = dich.s1[vaiNhan]
    const L2 = { co: !!dich.co[vaiNhan], goi: n1 && n0 ? n1.goi - n0.goi : n1 ? n1.goi : null, nl: n1 && n0 ? r2((n1.nl - n0.nl) * 1000) : null }
    const p0 = dich.p0[vaiNhan], p1 = dich.p1[vaiNhan]
    const pt = p1 ? { co: p1.co, dung: p1.dung, tat: p1.tat, vol: p1.vol, ct: p1.co && p0?.co ? r2(p1.ct - p0.ct) : null, tr: p1.tr } : null
    const L3 = { pt, db: db(dich.thu.e[vaiNhan]), r: r(dich.thu, vaiNhan) }
    const loi = [], doGui = nguon.thu.st === 'running', doNhan = dich.thu.st === 'running'
    if (doGui && !(L0.db > -60 && L0.r >= NGUONG_R)) loi.push('0:mic vào không có giọng')
    if (!L1.co) loi.push('1:không có track đang gửi')
    else { if (!(L1.byte > 0)) loi.push('1:bộ gửi không tăng byte'); if (!(L1.nl > 0)) loi.push('1:đang gửi IM LẶNG'); if (doGui && !(L1.r >= NGUONG_R)) loi.push(`1:tiếng gửi không còn là giọng (r=${L1.r})`) }
    if (!L2.co) loi.push('2:máy nhận không có track')
    else { if (!(L2.goi > 0)) loi.push('2:không nhận gói'); if (!(L2.nl > 0)) loi.push('2:inbound năng lượng = 0') }
    if (!pt?.co) loi.push('3:không có thẻ <audio> cầm track')
    else {
      if (pt.dung) loi.push('3:<audio> DỪNG'); if (pt.tat) loi.push('3:<audio> TẮT TIẾNG'); if (!(pt.vol > 0)) loi.push('3:âm lượng 0')
      if (!(pt.ct > giay * 0.5)) loi.push(`3:currentTime đứng (+${pt.ct} s)`); if (pt.tr?.rs !== 'live' || !pt.tr?.en) loi.push('3:track dừng / tắt')
      if (doNhan && !(L3.r >= NGUONG_R)) loi.push(`3:tiếng thẻ cầm không còn là giọng (r=${L3.r})`)
    }
    const dat = loi.length === 0
    if (!dat && !thietKe && !moDoi) soLoi += 1
    const o = (t) => (loi.some((x) => x.startsWith(t)) ? 'KHÔNG' : 'đạt')
    dong.push(`| ${nhan} | ${pha} | ${ten} | ${o('0:')} (${L0.db} dB, r ${L0.r}) | ${o('1:')} (+${L1.byte ?? '—'} B, nl ${L1.nl}, r ${L1.r}) | ${o('2:')} (+${L2.goi ?? '—'} gói, nl ${L2.nl}) | ${o('3:')} (${pt?.co ? `${pt.dung ? 'dừng' : 'chạy'}${pt.tat ? ' · TẮT TIẾNG' : ''} · vol ${pt.vol} · ct +${pt.ct}` : 'không thẻ'}, r ${L3.r}) | ${dat ? 'ĐẠT' : thietKe ? `TẮT THEO THIẾT KẾ (${thietKe})` : moDoi ? `MONG ĐỢI (${moDoi}): ${loi.join('; ')}` : 'CÂM: ' + loi.join('; ')} |`)
    return { pha, ten, dat, loi, L0, L1, L2, L3, thietKe: thietKe || undefined }
  }
  return { ketLuan, dong, loi: () => soLoi }
}
