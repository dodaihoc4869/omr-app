#!/usr/bin/env node
// ĐO «TĂNG TIẾNG» TRÊN CHROMIUM THẬT (13/11, thầy: «chỉ thêm tăng tiếng thôi», «không được phép để mất tiếng») — mic giả đọc tệp WAV giọng TỔNG HỢP (không phải
// giọng người thật), thư viện thật `taoLiveThay` phát tới một kết nối WebRTC thứ hai trong trang (do-tang-tieng.tsx). Không SFU thật, không trễ mạng.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/do-tang-tieng.mjs <thư mục tạm> [tệp số đo JSON]
// Mỗi kiểu tiếng («Chuẩn trình duyệt», «Làm rõ») một buổi live liên tục: Gốc → +3 → +6 → +9 → Gốc → +6 (đổi bậc GIỮA lúc live). Kiểm:
//   (a) Gốc có tiếng suốt chặng; (b) mỗi bậc to hơn Gốc đúng ≈ N dB (so 1 giây trước / sau lúc đổi, trung vị RMS khung 10 ms có tiếng), đỉnh ≤ trần −2,2 dBFS;
//   (c) không quãng câm > 200 ms ở bất kỳ lúc nào (kể cả lúc đổi bậc); (d) trình duyệt KHÔNG có kiểu khung ⇒ +6 gửi thẳng track mic gốc, vẫn có tiếng.
import { existsSync, mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const RA = process.argv[3] ? resolve(process.argv[3]) : null
const HZ = 48000
const tam = mkdtempSync(join(tmpdir(), 'do-tang-'))
const db = (v) => (v > 0 ? 20 * Math.log10(v) : -160)
const r1 = (v) => Math.round(v * 10) / 10

/** Giọng tổng hợp LIÊN TỤC (không quãng nghỉ dài — đo được «câm» do đường truyền): âm tiết 4 / giây, răng cưa 110–160 Hz qua ba cộng hưởng nguyên âm,
 *  bao không bao giờ về 0 (sàn 0,25); RMS = `rmsDb`. */
function giong(rmsDb, ten) {
  const T = 28, n = T * HZ, m = new Float32Array(n)
  let hat = 777
  const rnd = () => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat / 0x7fffffff }
  const NA = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [570, 840, 2410]]
  const ch = (f, q) => { const w = (2 * Math.PI * f) / HZ, al = Math.sin(w) / (2 * q), a0 = 1 + al; return { b0: al / a0, b2: -al / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 } }
  const chay = (c, x) => { const y = c.b0 * x + c.b2 * c.x2 - c.a1 * c.y1 - c.a2 * c.y2; c.x2 = c.x1; c.x1 = x; c.y2 = c.y1; c.y1 = y; return y }
  let i = 0
  while (i < n) {
    const d = Math.round((0.2 + rnd() * 0.08) * HZ), va = NA[Math.floor(rnd() * NA.length)], f0 = 110 + rnd() * 50, cs = [ch(va[0], 6), ch(va[1], 9), ch(va[2], 10)]
    let pha = 0
    for (let k = 0; k < d && i + k < n; k++) {
      pha += f0 / HZ
      const cua = 2 * (pha - Math.floor(pha + 0.5)), bao = 0.25 + 0.75 * Math.sin((Math.PI * k) / d) ** 0.7
      m[i + k] = (chay(cs[0], cua) + 0.6 * chay(cs[1], cua) + 0.35 * chay(cs[2], cua) + 0.12 * cua) * bao
    }
    i += d
  }
  let s = 0
  for (const v of m) s += v * v
  const he = Math.pow(10, rmsDb / 20) / Math.sqrt(s / n)
  for (let k = 0; k < n; k++) m[k] *= he
  const b = Buffer.alloc(44 + n * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22)
  b.writeUInt32LE(HZ, 24); b.writeUInt32LE(HZ * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40)
  for (let k = 0; k < n; k++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(m[k] * 32767))), 44 + k * 2)
  const p = join(tam, ten); writeFileSync(p, b); return p
}

// TIẾNG TO (−12 dBFS RMS): +9 ⇒ khâu chặn đỉnh phải làm việc — đỉnh gửi đi vẫn ≤ trần, không câm
const LICH_TO = [{ ten: 'Gốc', db: 0, giay: 3 }, { ten: '+9', db: 9, giay: 6 }]
const LICH = [{ ten: 'Gốc', db: 0, giay: 10 }, { ten: '+3', db: 3, giay: 4 }, { ten: '+6', db: 6, giay: 4 }, { ten: '+9', db: 9, giay: 4 }, { ten: 'Gốc lại', db: 0, giay: 4 }, { ten: '+6 lại', db: 6, giay: 4 }]
const WAV = giong(-26, 'giong.wav'), WAV_TO = giong(-12, 'giong-to.wav')
const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const tv = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0 }
const ket = [], so = {}
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }
async function chay(kieu, khongKhung, lich, wav = WAV) {
  const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required'] })
  try {
    const ctx = await trinh.newContext({ permissions: ['microphone'] })
    await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
    const t = await ctx.newPage()
    const loi = []
    t.on('pageerror', (e) => loi.push(e.message))
    await t.goto(`${may.goc}/scripts/thu-live-1011/do-tang-tieng.html`)
    await t.waitForFunction(() => typeof window.__doTang === 'function', null, { timeout: 15000 })
    const kq = await t.evaluate(([k, l, kk]) => window.__doTang(k, l, kk), [kieu, lich, khongKhung])
    if (loi.length) console.log('  lỗi trang:', loi.slice(0, 2).join(' | '))
    return kq
  } finally { await trinh.close() }
}
const NGUONG_CAM = Math.pow(10, -60 / 20)
function phanTich(kq, lich) {
  const ten = `${kq.kieuTieng === 'chuan' ? 'Chuẩn trình duyệt' : 'Làm rõ'}${kq.khongKhung ? ' · KHÔNG có kiểu khung' : ''}`
  console.log(`\n== ${ten} · mic: khử vọng ${kq.caiMic.ec} · lọc ồn ${kq.caiMic.ns} · tự chỉnh ${kq.caiMic.agc} · ${kq.caiMic.kenh} kênh`)
  for (const g of kq.ghiTrack) console.log(`   ${g.chang}: gửi ${g.trackGui} (chuỗi ${g.chuoi}, tăng ${g.tang ?? 0})`)
  // (c) quãng câm dài nhất (ms) trên toàn buổi
  let camDai = 0, batDau = null, camLuc = ''
  for (const x of kq.mau) { if (x.r < NGUONG_CAM) { if (batDau == null) batDau = x.t } else if (batDau != null) { if (x.t - batDau > camDai) { camDai = x.t - batDau; camLuc = x.c } batDau = null } }
  if (batDau != null) { const t = kq.mau[kq.mau.length - 1].t - batDau; if (t > camDai) { camDai = t; camLuc = 'cuối' } }
  // (a) mức từng chặng + đỉnh; (b) bước ở mỗi lần đổi: trung vị 1 giây trước / sau (bỏ 150 ms quanh lúc đổi)
  const theo = {}
  for (const x of kq.mau) (theo[x.c] ??= []).push(x)
  const chang = lich.map((c) => { const a = theo[c.ten] ?? []; return { ten: c.ten, db: c.db, rmsTvDb: r1(db(tv(a.map((x) => x.r)))), dinhNhanDb: r1(db(Math.max(0, ...a.map((x) => x.d)))), guiTvDb: r1(db(tv(a.map((x) => x.rg)))), dinhGuiDb: r1(db(Math.max(0, ...a.map((x) => x.dg)))), heSoGuiTvDb: r1(tv(a.filter((x) => x.rm > 0.003 && x.dg < 0.74).map((x) => db(x.rg) - db(x.rm)))), coTieng: a.length ? r1((100 * a.filter((x) => x.r >= NGUONG_CAM).length) / a.length) : 0 } })
  const buoc = []
  for (let i = 1; i < lich.length; i++) {
    const truoc = theo[lich[i - 1].ten] ?? [], sau = theo[lich[i].ten] ?? []
    const tDoi = sau[0]?.t ?? 0
    const o = (x) => x.rm > 0.003 && x.dg < 0.74 // khung có tiếng, chưa sát trần
    const a = truoc.filter((x) => x.t > tDoi - 1650 && x.t < tDoi - 150 && o(x)), b = sau.filter((x) => x.t > tDoi + 150 && x.t < tDoi + 1650 && o(x))
    // HỆ SỐ ĐANG GỬI = tiếng gửi / tiếng mic cùng khung 10 ms (khử được dao động của giọng + tự chỉnh âm lượng của trình duyệt); kèm bước ở đầu nhận (sau Opus)
    buoc.push({ tu: lich[i - 1].ten, toi: lich[i].ten, muon: lich[i].db - lich[i - 1].db, doDuoc: r1(tv(b.map((x) => db(x.rg) - db(x.rm))) - tv(a.map((x) => db(x.rg) - db(x.rm)))), nhan: r1(db(tv(b.map((x) => x.r))) - db(tv(a.map((x) => x.r)))) })
  }
  for (const c of chang) console.log(`   ${c.ten}: GỬI RMS ${c.guiTvDb} dBFS, đỉnh ${c.dinhGuiDb} dBFS, hệ số gửi/mic ${c.heSoGuiTvDb} dB · NHẬN RMS ${c.rmsTvDb} dBFS, đỉnh ${c.dinhNhanDb} dBFS · có tiếng ${c.coTieng} % khung`)
  for (const b of buoc) console.log(`   đổi ${b.tu} → ${b.toi}: muốn ${b.muon > 0 ? '+' : ''}${b.muon} dB · hệ số gửi đổi ${b.doDuoc > 0 ? '+' : ''}${b.doDuoc} dB · đầu nhận ${b.nhan > 0 ? '+' : ''}${b.nhan} dB`)
  console.log(`   quãng câm dài nhất: ${camDai} ms${camDai ? ` (chặng ${camLuc})` : ''}`)
  so[ten + (lich === LICH_TO ? " · tiếng to" : "")] = { caiMic: kq.caiMic, ghiTrack: kq.ghiTrack, chang, buoc, camDaiNhatMs: camDai }
  return { ten, chang, buoc, camDai, ghiTrack: kq.ghiTrack }
}
for (const kieu of ['chuan', 'lam-ro']) {
  const p = phanTich(await chay(kieu, false, LICH), LICH)
  const goc = p.chang[0]
  kiem(`${p.ten} (a): Gốc có tiếng suốt ${LICH[0].giay} giây`, goc.coTieng >= 99 && goc.rmsTvDb > -45, `${goc.coTieng} % khung trên −60 dBFS, RMS ${goc.rmsTvDb} dBFS`)
  kiem(`${p.ten}: Gốc gửi track mic gốc (Chuẩn) / chuỗi (Làm rõ) như cũ; +N gửi chuỗi khung`, p.ghiTrack[0].trackGui === (kieu === 'chuan' ? 'track mic gốc' : 'chuỗi khung') && p.ghiTrack.filter((g) => g.tang).every((g) => g.trackGui === 'chuỗi khung'))
  for (const b of p.buoc) if (b.muon) kiem(`${p.ten} (b): đổi ${b.tu} → ${b.toi} — tiếng gửi to thêm đúng bậc`, Math.abs(b.doDuoc - b.muon) <= 1, `muốn ${b.muon}, hệ số gửi đổi ${b.doDuoc} dB (đầu nhận ${b.nhan} dB)`)
  kiem(`${p.ten} (b): đỉnh tiếng GỬI ở mọi chặng +N ≤ trần −2,16 dBFS`, p.chang.filter((c) => c.db).every((c) => c.dinhGuiDb <= -2.15), p.chang.map((c) => `${c.ten} ${c.dinhGuiDb}`).join(' · '))
  kiem(`${p.ten} (c): không quãng câm > 200 ms (kể cả lúc đổi bậc giữa live)`, p.camDai <= 200, `${p.camDai} ms`)
}
for (const kieu of ['chuan', 'lam-ro']) {
  const p = phanTich(await chay(kieu, false, LICH_TO, WAV_TO), LICH_TO)
  kiem(`${p.ten} · tiếng to +9: đỉnh tiếng GỬI ≤ trần −2,16 dBFS, có tiếng, không câm`, p.chang[1].dinhGuiDb <= -2.15 && p.chang[1].coTieng >= 99 && p.camDai <= 200, `đỉnh gửi ${p.chang[1].dinhGuiDb} dBFS · đỉnh nhận ${p.chang[1].dinhNhanDb} dBFS · câm dài nhất ${p.camDai} ms`)
}
const LICH2 = [{ ten: 'Gốc', db: 0, giay: 3 }, { ten: '+6', db: 6, giay: 5 }]
const p2 = phanTich(await chay('chuan', true, LICH2), LICH2)
kiem('(d) không có kiểu khung: +6 gửi thẳng track mic gốc, vẫn có tiếng, không câm', p2.ghiTrack[1].trackGui === 'track mic gốc' && p2.chang[1].coTieng >= 99 && p2.camDai <= 200, `${p2.ghiTrack[1].trackGui} · có tiếng ${p2.chang[1].coTieng} % · câm dài nhất ${p2.camDai} ms`)
await may.dong?.()
const dat = ket.filter((k) => k.dat).length
console.log(`\n${dat}/${ket.length} đạt`)
if (RA) writeFileSync(RA, JSON.stringify({ luc: new Date().toISOString(), ket, so }, null, 1))
process.exit(dat === ket.length ? 0 : 1)
