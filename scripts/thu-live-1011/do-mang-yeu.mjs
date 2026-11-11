#!/usr/bin/env node
// ĐO NÉT TRÊN MÁY EM KHI MẠNG YẾU (12/11, thầy: «Nãy tôi thử iphone mạng wifi 1 vạch nét chữ ko mượt»). MÁY MÔ PHỎNG — không mạng thật, không trình duyệt:
// chạy đúng mã `src/lib/live/noi-suy.ts` (đệm phát của máy em) + bản chép LUẬT GỬI của máy thầy (`src/lib/live/thay.ts`, hàm `xa`) + mô hình đường truyền.
//   node scripts/thu-live-1011/do-mang-yeu.mjs [tệp ra = docs/ban-ve-but-1011/so-do-mang-yeu.json]
//   GOC_CU=<thư mục có src/lib của bản trước>  ⇒ thêm cột TRƯỚC (đệm phát cũ + luật gửi cũ: gói kèm 1 lô, không có đường phụ)
//   CHEO=1 (kèm GOC_CU) ⇒ thêm dòng «máy em BẢN CŨ nhận gói của máy thầy bản mới» (tương thích ngược) · CHI=<chữ trong tên> ⇒ chỉ chạy kịch bản đó · SOI=1 ⇒ in từng lần đứng
// MÔ HÌNH (bước 1 ms):
//   · thầy viết ~20 giây công thức (chữ mẫu 200 mẫu / giây), máy thầy 60 khung / giây, gửi theo đúng luật của bản đang đo;
//   · DataChannel (không thứ tự, không gửi lại): trễ nền 30 ms + rung đều 0 … J ms; mất gói p % (rời, hoặc theo CHÙM kiểu Wi-Fi yếu); ĐỨT = mọi gói gửi
//     trong quãng đứt mất hẳn — hoặc (kịch bản «dồn cục») về cả cục ngay khi mạng có lại;
//   · WebSocket của phòng (TCP, đúng thứ tự, không mất): gói «mất» = gửi lại chậm 200–800 ms và CHẶN các gói sau nó; đứt ⇒ mọi thứ về sau khi mạng có lại;
//     nét xong (sổ nét) đi cùng đường này;
//   · máy em báo phòng «cần điểm qua WebSocket» ⇒ 250 ms sau máy thầy mới biết (mạng đang đứt thì chờ có lại);
//   · máy em 60 khung / giây; kịch bản iPhone: 30 khung / giây (chế độ tiết kiệm pin) + đồng hồ làm tròn 1 ms.
// SỐ ĐO (chỉ tính lúc ngòi bút của thầy đã đi xa hơn chỗ máy em đang hiện):
//   · số lần ĐỨNG > 100 ms · quãng đứng dài nhất · số khung HIỆN VỤT (một khung hiện hơn 250 ms đường viết) · độ đều của tốc độ hiện mực
//     (hệ số biến thiên của «ms đường viết hiện ra mỗi ms»; 0 = đều tuyệt đối) · trễ nét trung vị / p95
//   · con trỏ nhảy > 12 px trong một khung 16,7 ms (màn máy em 844 px ngang) · số nét phải SỬA HÌNH lúc bản chốt tới (đã vẽ thiếu điểm) · D trung vị / lớn nhất
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { taoNgauNhien, vietDong } from '../but-bang-1011/chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-but-1011/so-do-mang-yeu.json'))
const TAM = mkdtempSync(join(tmpdir(), 'mang-yeu-'))
async function nap(goc, ten) {
  const ra = join(TAM, ten + '.mjs')
  await build({ entryPoints: [join(goc, 'src/lib/live/noi-suy.ts')], bundle: true, platform: 'node', format: 'esm', outfile: ra, logLevel: 'warning' })
  return (await import(pathToFileURL(ra).href)).taoDemPhat
}
function baiViet() {
  const rnd = taoNgauNhien(1111), net = []
  let t = 500
  const dong = ['CH_3COOH + NaOH', '> CH_3COONa + H_2O', 'n = 0,1 mol', 'C_6H_5OH + NaOH', '> C_6H_5ONa + H_2O', 'n = 0,2 mol']
  for (let i = 0; i < dong.length; i++) for (const m of vietDong(dong[i], 1312, 190 + i * 88, 42, { rnd, vMax: 700 })) {
    net.push(m.map((p) => [p[0] / 1920, p[1] / 1080, Math.round(p[2] * 100) / 100, Math.round(t + p[3])]))
    t += m[m.length - 1][3] + 110 + rnd() * 160
  }
  return net
}
const GOI_TOI_DA = 110, MAU = 'rgb(244,239,228)'

/** Một lượt. `cu` = máy em bản cũ (không xin đường phụ) · `cuThay` = máy thầy gửi theo luật cũ (mặc định theo `cu`). `o`: { duong: 'dc' | 'ws', rung, mat, chum, dut: [chu kì ms, dài ms], don, dcRot, hol, fps, tron } */
function chay(taoDemPhat, cu, o, hat, cuThay = cu, nhipCu = cuThay) {
  const rn = taoNgauNhien(hat), bai = baiViet(), LECH = 987_654, TRE = 30
  const tHet = bai[bai.length - 1][bai[bai.length - 1].length - 1][3] + 600
  // bản mới: phòng nhận 60 lô / giây ⇒ WebSocket 17 ms một lô (o.phongCu: phòng chưa đẩy bản mới ⇒ 27 ms); lô đầu của mỗi nét đi ngay
  // (`nhipCu` = nhịp gửi của bản #1614: 34 ms, lô đầu không được ưu tiên). Lớp có em mạng xấu (độ đệm em báo về > 200 ms, máy thầy biết sau ~1 giây) ⇒ về 34 ms
  const KEM = cuThay ? 1 : 3
  let dBao = 0, dBaoLuc = 0
  // WebSocket: 34 ms một lô (đã thử 17 ms + lô đầu của nét đi ngay: o.wsDay — em mạng xấu đứng nhiều hơn nên không dùng)
  const cachWs = () => (o.wsDay && !nhipCu && dBao <= 200 ? 17 : 34)
  // quãng đứt: bắt đầu ở giây 3, lặp theo chu kì
  const dutLuc = (t) => { if (!o.dut) return null; const [ck, dai] = o.dut, k = Math.floor((t - 3000) / ck); if (t < 3000) return null; const a = 3000 + k * ck; return t < a + dai ? a + dai : null }
  // rung: cả buổi (o.rung) hoặc chỉ trong một quãng (o.rungDoan = [từ, tới, ms])
  const rungLuc = (t) => (o.rungDoan ? (t >= o.rungDoan[0] && t < o.rungDoan[1] ? o.rungDoan[2] : 0) : o.rung || 0)
  const coDcEm = (t) => o.duong === 'dc' && !(o.dcRot && t >= o.dcRot)
  // ── đường truyền ──
  const toi = [] // { nhan, g, ws } — luôn xếp theo giờ tới (gói tới sau không được chặn gói tới trước)
  const xep = (x) => { let i = toi.length; while (i > 0 && toi[i - 1].nhan > x.nhan) i--; toi.splice(i, 0, x) }
  let xau = false, wsTruoc = 0
  const guiDc = (g, t) => {
    if (!coDcEm(t)) return
    const het = dutLuc(t)
    if (het != null) { if (o.don) xep({ nhan: het + 5 + rn() * 40, g, ws: false }); return }
    // mất theo chùm (Gilbert): trạng thái xấu mất 70 %, vào xấu với xác suất sao cho tỉ lệ mất trung bình ≈ o.mat
    if (o.chum) { xau = xau ? rn() < 0.75 : rn() < (o.mat / 100) / 2.8; if (xau && rn() < 0.7) return }
    else if (rn() < (o.mat || 0) / 100) return
    xep({ nhan: t + TRE + rn() * rungLuc(t), g, ws: false })
  }
  const guiWs = (g, t) => {
    let den = t + TRE + rn() * (o.duong === 'ws' ? rungLuc(t) : Math.min(rungLuc(t), 60))
    const het = dutLuc(t)
    if (het != null) den = het + 60 + rn() * 80
    else if (rn() < (o.hol ?? (o.mat || 0) / 100 / 2)) den += 200 + rn() * 600 // gói phải gửi lại: chặn cả hàng
    den = Math.max(wsTruoc + 0.05, den); wsTruoc = den
    xep({ nhan: den, g, ws: true })
  }
  // ── máy thầy ──
  const st = bai.map((m, i) => ({ m, id: 'n' + i, tGoc: null, daMoi: 0, daDc: 0, lich: [], daWs: 0, xong: false }))
  const tro = (t) => { for (let i = 0; i + 1 < bai.length; i++) { const a = bai[i][bai[i].length - 1], b = bai[i + 1][0]; if (t > a[3] && t < b[3]) { const k = (t - a[3]) / (b[3] - a[3]); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] } } return null }
  let lucDc = -1e9, lucWs = -1e9, troCho = null, henXa = null, xemWs = o.duong === 'ws' ? 1 : 0, xemWsDoi = null
  const diemCua = (s, a, b) => s.m.slice(a, b).map((q) => [q[0], q[1], q[2], q[3] - s.m[0][3]])
  const xa = (t, cuoiNet) => {
    henXa = null
    const canWs = xemWs > 0, dcDuoc = cuoiNet || t - lucDc >= 12
    let wsDuoc = canWs && (cuoiNet || t - lucWs >= cachWs()), conDc = false, conWs = false, daDc = false
    for (const s of st) {
      const tong = s.daMoi
      if (!tong || s.xong) continue
      if (s.tGoc == null) s.tGoc = Math.round(t - (s.m[tong - 1][3] - s.m[0][3]))
      const dau = { id: s.id, cong: 'but', mau: MAU, co: 1.7 }
      if (s.daDc < tong) {
        if (dcDuoc) {
          const tu = cuThay ? Math.max(s.lich.length ? s.lich[s.lich.length - 1] : 0, tong - GOI_TOI_DA) : Math.max(s.lich.length ? s.lich[0] : s.daDc, s.daDc - 24, tong - GOI_TOI_DA, 0)
          guiDc({ phien: 1, tGui: t, k: 'diem', dau, tGoc: s.tGoc, tu, diem: diemCua(s, tu, tong) }, t)
          s.lich.push(s.daDc); if (s.lich.length > KEM) s.lich.shift()
          s.daDc = tong; daDc = true
        } else conDc = true
      }
      if (canWs && s.daWs < tong) {
        if (wsDuoc) { for (let tu = s.daWs; tu < tong; tu += GOI_TOI_DA) guiWs({ phien: 1, tGui: t, k: 'diem', dau, tGoc: s.tGoc, tu, diem: diemCua(s, tu, Math.min(tong, tu + GOI_TOI_DA)) }, t); s.daWs = tong; lucWs = t; wsDuoc = false }
        else conWs = true
      } else if (!canWs && cuThay) s.daWs = tong
    }
    if (troCho) {
      const g = { phien: 1, tGui: t, k: 'tro', x: troCho[0], y: troCho[1] }
      let xong = true
      if (!troCho.dc) { if (dcDuoc) { guiDc(g, t); troCho.dc = true; daDc = true } else { conDc = true; xong = false } }
      if (canWs) { if (wsDuoc) { guiWs(g, t); lucWs = t; wsDuoc = false } else { conWs = true; xong = false } }
      if (xong) troCho = null
    }
    if (daDc) lucDc = t
    if (conDc) henXa = t + Math.max(1, 12 - (t - lucDc)); else if (conWs) henXa = t + Math.max(1, cachWs() - (t - lucWs))
  }
  const chot = [] // bản chốt từ sổ nét: { nhan, id, diem }
  const nhacLai = [] // tin nhấc nhắc lại có hẹn: { luc, g }
  let khungThay = 0, lucTro = -1e9
  const buocThay = (t) => {
    if (xemWsDoi && t >= xemWsDoi.luc) { xemWs = xemWsDoi.v; xemWsDoi = null }
    if (henXa != null && t >= henXa) xa(t, false)
    for (let i = nhacLai.length - 1; i >= 0; i--) if (nhacLai[i].luc <= t) { guiDc({ ...nhacLai[i].g, tGui: t }, t); nhacLai.splice(i, 1) }
    if (t < khungThay) return
    khungThay += 1000 / 60
    let co = false
    for (const s of st) { if (s.xong) continue; let n = s.daMoi; while (n < s.m.length && s.m[n][3] <= t) n++; if (n > s.daMoi) { co = true; if (!s.daMoi && o.wsDay && !nhipCu) lucDc = lucWs = -1e9; s.daMoi = n } }
    const p = tro(t)
    if (p && t - lucTro > 15) { lucTro = t; troCho = p; co = true }
    if (co) xa(t + 0.5, false)
    for (const s of st) if (!s.xong && s.daMoi >= s.m.length) {
      xa(t + 0.6, true); s.xong = true
      const dau = { id: s.id, cong: 'but', mau: MAU, co: 1.7 }
      if (!cuThay) { const tu = Math.max(s.lich.length ? s.lich[0] : 0, s.m.length - 32, 0); guiDc({ phien: 1, tGui: t + 0.65, k: 'diem', dau, tGoc: s.tGoc, tu, diem: diemCua(s, tu, s.m.length) }, t + 0.65) }
      const g = { phien: 1, tGui: t + 0.7, k: 'nhac', id: s.id, tong: s.m.length }
      guiDc(g, t + 0.7); guiDc(g, t + 0.7)
      // bản mới: tin nhấc nhắc lại sau 0,3 và 1,2 giây (dọn nét «ma» trên máy em bản cũ)
      if (!cuThay) for (const ms of [300, 1200]) nhacLai.push({ luc: t + ms, g })
      if (xemWs > 0) guiWs(g, t + 0.7)
      // nét xong vào sổ nét: đường WebSocket tin cậy của phòng
      guiWs({ k: 'chot', id: s.id, diem: diemCua(s, 0, s.m.length) }, t + 1)
    }
  }
  // ── máy em ──
  const dem = taoDemPhat({}), khungEm = 1000 / (o.fps || 60), tr = (v) => (o.tron ? Math.round(v) : v)
  const tNet = new Map(bai.map((m, i) => ['n' + i, m]))
  const daPhat = new Map(), tDauTruoc = new Map()
  const dBaoCho = []
  let dNay = 0, veSan = 0, dTruocRung = 0, luotEm = 7, troWs = false, suaHinh = 0
  let dungNay = 0, dungDai = 0, dungHon100 = 0, vut = 0, troNhay = 0, troTruoc = null, lucTroTruoc = 0
  const tre = [], tiLe = [], ds = []
  const buocEm = (t) => {
    while (toi.length && toi[0].nhan <= t) {
      const x = toi.shift()
      if (x.g.k === 'chot') chot.push({ nhan: x.nhan, id: x.g.id, diem: x.g.diem })
      else dem.nap(x.g, tr(x.nhan + LECH), x.ws && coDcEm(t))
    }
    if (t < luotEm) return
    luotEm += khungEm
    const nay = tr(t + LECH)
    for (const c of chot) {
      if (c.xong) continue
      // như src/lib/live/em.ts: bản chốt đợi nét dở phát xong; hạn chờ = 400 ms (bản mới: + độ đệm đang dùng)
      if (dem.dangPhat(c.id) && t < c.nhan + 400 + (cu ? 0 : dNay)) { if (dem.va) dem.va(c.id, c.diem); continue }
      if (dem.dangPhat(c.id)) dem.boNet(c.id)
      if ((daPhat.get(c.id) ?? 0) !== c.diem.length) suaHinh++
      c.xong = true; tDauTruoc.delete(c.id)
    }
    const k = dem.khung(nay)
    ds.push(k.d); dNay = k.d
    if (t - dBaoLuc >= 1000) { dBaoLuc = t; dBaoCho.push({ luc: t + 1000, v: k.d }) }
    while (dBaoCho.length && dBaoCho[0].luc <= t) dBao = dBaoCho.shift().v
    if (o.rungDoan && t > o.rungDoan[1]) { if (k.d > dTruocRung + 6) veSan = t - o.rungDoan[1]; } else if (o.rungDoan && t < o.rungDoan[0]) dTruocRung = k.d
    // đường phụ: máy em báo phòng, máy thầy biết sau 250 ms (đang đứt thì khi mạng có lại)
    if (!cu && dem.canTro && o.duong === 'dc') { const can = dem.canTro(nay) || !coDcEm(t); if (can !== troWs) { troWs = can; xemWsDoi = { luc: (dutLuc(t) ?? t) + 250, v: can ? 1 : 0 } } }
    else if (o.dcRot && t >= o.dcRot && !troWs) { troWs = true; xemWsDoi = { luc: t + 250, v: 1 } } // bản cũ: kênh đóng thì cũng báo
    for (const n of k.net) {
      const m = tNet.get(n.dau.id)
      daPhat.set(n.dau.id, (daPhat.get(n.dau.id) ?? 0) + n.moi.length)
      if (!n.head || n.xong) { if (n.xong) tDauTruoc.delete(n.dau.id); continue }
      const moiNhat = n.moi.length ? n.moi[n.moi.length - 1] : null
      let i = moiNhat ? m.findIndex((q) => q[3] - m[0][3] === moiNhat[3] && q[0] === moiNhat[0]) : (tDauTruoc.get(n.dau.id)?.i ?? 0)
      if (i < 0) i = tDauTruoc.get(n.dau.id)?.i ?? 0
      let tDau = m[i][3]
      if (i + 1 < m.length) { const a = m[i], b = m[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy; if (q > 0) tDau = a[3] + Math.max(0, Math.min(1, ((n.head.x - a[0]) * dx + (n.head.y - a[1]) * dy) / q)) * (b[3] - a[3]) }
      // «thầy đã đi xa hơn»: còn ít nhất 40 ms đường viết chưa hiện (vài điểm cuối nét hiện muộn — gói cuối mất, chờ bản chốt — không tính là đứng)
      const truoc = tDauTruoc.get(n.dau.id), conDiem = tDau < m[m.length - 1][3] - 40
      if (truoc && conDiem && t - m[0][3] > 60) {
        const tien = tDau - truoc.t
        if (tien <= 0.01) { dungNay += khungEm; if (dungNay > dungDai) dungDai = dungNay; if (process.env.SOI && dungNay > 100 && dungNay < 100 + khungEm + 1) console.log('  SOI đứng t=' + Math.round(t), n.dau.id, 'i=' + i + '/' + m.length, 'moi=' + n.moi.length, 'daCo=' + n.daCo, 'troWs=' + troWs, 'xemWs=' + xemWs, 'd=' + k.d.toFixed(0), 'tDau−t=' + Math.round(t - tDau)) } else { if (dungNay > 100) dungHon100++; dungNay = 0; if (tien > 250) vut++ }
        tiLe.push(Math.max(0, tien) / khungEm)
        tre.push(t - tDau)
      }
      tDauTruoc.set(n.dau.id, { t: tDau, i })
    }
    const b = k.but ?? k.tro
    if (b && troTruoc) { const px = Math.hypot((b.x - troTruoc.x) * 844, (b.y - troTruoc.y) * 475); if (px > 12 * (t - lucTroTruoc) / 16.7) troNhay++ }
    troTruoc = b; lucTroTruoc = t
  }
  for (let t = 0; t < tHet + 800; t++) { buocThay(t); buocEm(t) }
  if (dungNay > 100) dungHon100++
  const s = (a) => [...a].sort((x, y) => x - y), pv = (a, p) => { const b = s(a); return b.length ? +b[Math.min(b.length - 1, Math.floor(b.length * p))].toFixed(1) : 0 }
  const tb = tiLe.reduce((x, y) => x + y, 0) / Math.max(1, tiLe.length), ps = tiLe.reduce((x, y) => x + (y - tb) * (y - tb), 0) / Math.max(1, tiLe.length)
  return { dungHon100, dungDaiNhatMs: Math.round(dungDai), hienVut: vut, doDeu: +(Math.sqrt(ps) / (tb || 1)).toFixed(2), treTrungVi: pv(tre, 0.5), treP95: pv(tre, 0.95), troNhay, suaHinh, dTrungVi: pv(ds, 0.5), dLonNhat: pv(ds, 1), ...(o.rungDoan ? { veSanMs: Math.round(veSan) } : {}) }
}

const moi = await nap(GOC, 'moi'), cuTao = process.env.GOC_CU ? await nap(resolve(process.env.GOC_CU), 'cu') : null, tao1614 = process.env.GOC_1614 ? await nap(resolve(process.env.GOC_1614), 'b1614') : null
// SO_HAT=<n> ⇒ trung vị của n hạt ngẫu nhiên (mặc định 5)
const HAT = Array.from({ length: Number(process.env.SO_HAT) || 5 }, (_, i) => i + 1)
const KICH_BAN = [
  ['Mạng tốt (rung 0, mất 0)', { duong: 'dc' }],
  ['Mạng tốt, đường WebSocket', { duong: 'ws', hol: 0 }],
  ['(đã thử, không dùng) WebSocket 17 ms một lô · mạng tốt', { duong: 'ws', hol: 0, wsDay: true }],
  ['(đã thử, không dùng) WebSocket 17 ms một lô · 5 % gói bị chặn đầu hàng', { duong: 'ws', rung: 30, hol: 0.05, wsDay: true }],
  ['Rung 30 ms · mất 0 %', { duong: 'dc', rung: 30 }],
  ['Rung 150 ms trong 5 giây (giây 4–9) rồi tốt lại', { duong: 'dc', rungDoan: [4000, 9000, 150] }],
  ['Rung 150 ms trong 5 giây rồi tốt lại · đường WebSocket', { duong: 'ws', hol: 0, rungDoan: [4000, 9000, 150] }],
  ['Mất gói 5 % · rung 30', { duong: 'dc', mat: 5, rung: 30 }],
  ['Mất gói 15 % · rung 30', { duong: 'dc', mat: 15, rung: 30 }],
  ['Mất gói 30 % · rung 30', { duong: 'dc', mat: 30, rung: 30 }],
  ['Mất gói 15 % theo CHÙM · rung 50', { duong: 'dc', mat: 15, chum: true, rung: 50 }],
  ['Rung 50 ms · mất 2 %', { duong: 'dc', mat: 2, rung: 50 }],
  ['Rung 150 ms · mất 2 %', { duong: 'dc', mat: 2, rung: 150 }],
  ['Rung 300 ms · mất 2 %', { duong: 'dc', mat: 2, rung: 300 }],
  ['Đứt 0,5 giây mỗi 5 giây (gói mất)', { duong: 'dc', mat: 2, rung: 30, dut: [5000, 500] }],
  ['Đứt 1 giây mỗi 6 giây (gói mất)', { duong: 'dc', mat: 2, rung: 30, dut: [6000, 1000] }],
  ['Đứt 2 giây mỗi 8 giây (gói mất)', { duong: 'dc', mat: 2, rung: 30, dut: [8000, 2000] }],
  ['Đứt 1 giây rồi gói về DỒN CỤC', { duong: 'dc', mat: 2, rung: 30, dut: [6000, 1000], don: true }],
  ['DataChannel RỚT ở giây 6 ⇒ WebSocket', { duong: 'dc', mat: 2, rung: 30, dcRot: 6000 }],
  ['WebSocket · 5 % gói bị chặn đầu hàng 200–800 ms', { duong: 'ws', rung: 30, hol: 0.05 }],
  ['WebSocket · rung 30 · mất 2 % (kịch bản cũ)', { duong: 'ws', rung: 30, mat: 2 }],
  ['«Wi-Fi 1 vạch»: mất 15 % chùm · rung 150 · đứt 0,5 giây', { duong: 'dc', mat: 15, chum: true, rung: 150, dut: [5000, 500] }],
  ['iPhone 30 khung/giây, đồng hồ 1 ms · mạng tốt', { duong: 'dc', fps: 30, tron: true }],
  ['iPhone 30 khung/giây · «Wi-Fi 1 vạch»', { duong: 'dc', mat: 15, chum: true, rung: 150, dut: [5000, 500], fps: 30, tron: true }],
]
const in1 = (r) => `đứng > 100 ms: ${r.dungHon100} lần, dài nhất ${r.dungDaiNhatMs} ms · hiện vụt ${r.hienVut} · độ đều ${r.doDeu} · trễ ${r.treTrungVi} / p95 ${r.treP95} ms · con trỏ nhảy ${r.troNhay} · sửa hình ${r.suaHinh} nét · D ${r.dTrungVi} (lớn nhất ${r.dLonNhat})${r.veSanMs != null ? ` · VỀ SÀN sau ${r.veSanMs} ms` : ''}`
const kq = []
for (const [ten, o] of KICH_BAN) {
  if (process.env.CHI && !ten.includes(process.env.CHI)) continue
  if (process.env.TUNG_HAT && cuTao) { for (const [nhan, tao, cu, cuThay] of [['TRƯỚC', cuTao, true, true], ['CHÉO', cuTao, true, false], ['SAU', moi, false, false]]) console.log(ten, nhan, 'con trỏ nhảy theo hạt:', [1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => chay(tao, cu, o, h * 13, cuThay).troNhay).join(' ')); continue }
  if (process.env.SOI) { console.log(ten, JSON.stringify(chay(moi, false, o, 13))); continue }
  // trung vị của 5 hạt ngẫu nhiên cho từng số đo
  const tv = (tao, cu, cuThay = cu, nhipCu = cuThay) => { const ds = HAT.map((h) => chay(tao, cu, o, h * 13, cuThay, nhipCu)), ra = {}; for (const k of Object.keys(ds[0])) ra[k] = [...ds.map((d) => d[k])].sort((a, b) => a - b)[HAT.length >> 1]; return ra }
  const dong = { kichBan: ten, cauHinh: o }
  // GOC_1614=<cây của bản #1614> ⇒ cột «bản #1614» (đệm phát #1614 + luật gửi #1614: gói kèm 3 lô, 34 ms một lô WebSocket)
  if (tao1614) dong.ban1614 = tv(tao1614, false, false, true)
  if (cuTao) dong.truoc = tv(cuTao, true)
  dong.sau = tv(moi, false)
  // TƯƠNG THÍCH NGƯỢC: máy em BẢN CŨ (tab chưa tải lại) nhận gói của máy thầy bản mới
  if (cuTao && process.env.CHEO) dong.emCuThayMoi = tv(cuTao, true, false)
  kq.push(dong)
  console.log(`[${ten}]`)
  if (dong.ban1614) console.log('   #1614: ' + in1(dong.ban1614))
  if (dong.truoc) console.log('   TRƯỚC: ' + in1(dong.truoc))
  console.log('   SAU:   ' + in1(dong.sau))
  if (dong.emCuThayMoi) console.log('   EM CŨ + THẦY MỚI: ' + in1(dong.emCuThayMoi))
}
mkdirSync(dirname(RA), { recursive: true })
writeFileSync(RA, JSON.stringify({ luc: new Date().toISOString(), may: 'máy mô phỏng (không mạng thật, không trình duyệt): node + src/lib/live/noi-suy.ts + bản chép luật gửi của máy thầy; mỗi ô = trung vị 5 hạt ngẫu nhiên', ketQua: kq }, null, 2) + '\n')
