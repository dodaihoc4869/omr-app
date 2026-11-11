#!/usr/bin/env node
// ĐO ĐỘ MƯỢT NÉT TRÊN MÁY EM BẰNG MÁY MÔ PHỎNG (11/11, thầy: «đang bị giật khựng ở máy hs»). KHÔNG có mạng thật, không có trình duyệt: chạy đúng mã
// `src/lib/live/noi-suy.ts` (đệm phát của máy em) với chữ viết tay mẫu (bút 200 Hz) + mô hình máy thầy gom lô + mô hình mạng có rung và mất gói.
//   node scripts/thu-live-1011/do-dem-phat.mjs [tệp ra = docs/ban-ve-but-1011/so-do-dem-phat.json]
//   GOC_CU=<thư mục giải nén `git archive <commit cũ> src`>  ⇒ đo thêm bản cũ (đệm phát cũ + máy thầy gửi chậm 16 ms + con trỏ 20 lần / giây).
// MÔ HÌNH:
//   · thầy viết ~20 giây công thức (vietDong, 200 mẫu / giây), giữa hai nét bút lơ lửng đi thẳng tới đầu nét sau;
//   · máy thầy vẽ 60 khung / giây, mỗi khung gom mẫu một lần; bản CŨ gửi sau khung 16 ms, bản MỚI gửi ngay sau khung (cách nhau ≥ 12 ms);
//     đường DataChannel: gói = lô trước + lô mới, không thứ tự, mất thì thôi; đường WebSocket (dự phòng): ≥ 34 ms một lô, đúng thứ tự, «mất» = gửi lại chậm 200 ms;
//   · mạng: trễ nền 30 ms + rung đều 0 … J ms + mất gói p %;
//   · máy em vẽ 60 khung / giây (máy yếu: 30), mỗi khung nạp gói đã tới rồi gọi `khung()`.
// SỐ ĐO (chỉ tính lúc ngòi bút của thầy ĐANG ĐI trên bảng):
//   · khung ĐỨNG = đầu nét trên máy em không tiến dù nét còn điểm chưa vẽ · quãng đứng dài nhất (ms)
//   · khung NHẢY CỤC = đầu nét tiến một phát hơn 45 ms đường viết của thầy (bình thường 16,7 ms mỗi khung)
//   · p95 khoảng cách giữa hai khung có mực mới trong cùng một nét (ms) · trễ nét thầy → em (ms): từ lúc mẫu sinh ra ở máy thầy tới khung máy em vẽ tới đó
//   · con trỏ: số khung đang viết mà con trỏ KHÔNG nằm ở đầu nét · sai số so với bút thật (p95, % bề ngang bảng đen) · số khung sai > 3 %
//   · nét phải THAY CẢ NÉT = gói cuối mất, nét dở không phát hết ⇒ sau 0,4 giây xoá nét dở, vẽ lại bằng bản chốt (đuôi nét hiện thành một cục)
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { taoNgauNhien, vietDong } from '../but-bang-1011/chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-but-1011/so-do-dem-phat.json'))
const TAM = mkdtempSync(join(tmpdir(), 'dem-phat-'))
async function nap(goc, ten) {
  const ra = join(TAM, ten + '.mjs')
  await build({ entryPoints: [join(goc, 'src/lib/live/noi-suy.ts')], bundle: true, platform: 'node', format: 'esm', outfile: ra, logLevel: 'warning' })
  return (await import(pathToFileURL(ra).href)).taoDemPhat
}

/** Bài viết: mảng nét, mỗi nét = mảng mẫu [x 0..1, y 0..1, lực, giờ tuyệt đối ms]; kèm đường lơ lửng giữa hai nét. */
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

/** Chạy một cấu hình. `cu` = mô hình máy thầy + lớp chọn con trỏ của bản cũ. */
function chay(taoDemPhat, { cu, duong, rung, mat, mayYeu = false, ban = false, hat = 7 }) {
  const rn = taoNgauNhien(hat), bai = baiViet(), LECH = 987_654, TRE = 30
  const cuoi = bai[bai.length - 1], tHet = cuoi[cuoi.length - 1][3] + 400
  // ── máy thầy: sự kiện theo khung 60 Hz ──
  const goi = [], chot = [] // goi: { gui, g } · chot: bản chốt từ sổ nét { nhan, id, diem }
  const ID = (i) => 'n' + i
  let tGuiCuoiDc = -1e9, tGuiCuoiWs = -1e9
  const TROI = cu ? 50 : 15 // bản cũ báo con trỏ lơ lửng ≤ 20 lần / giây
  const st = bai.map((m, i) => ({ m, id: ID(i), tGoc: null, da: 0, truoc: 0, daWs: 0, daMoi: 0, xong: false }))
  let lucTro = -1e9, hang = [] // việc chờ gửi: { luc, lam }
  const khungThay = 1000 / 60
  // con trỏ lơ lửng giữa hai nét: đi thẳng từ cuối nét i tới đầu nét i + 1
  const tro = (t) => { for (let i = 0; i + 1 < bai.length; i++) { const a = bai[i][bai[i].length - 1], b = bai[i + 1][0]; if (t > a[3] && t < b[3]) { const k = (t - a[3]) / (b[3] - a[3]); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] } } return null }
  const guiDc = (g, t) => goi.push({ gui: t, g, kenh: 'dc' }), guiWs = (g, t) => goi.push({ gui: t, g, kenh: 'ws' })
  let troCho = null
  for (let f = 0; f < tHet; f += khungThay) {
    // máy thầy BẬN (tuỳ chọn): 15 % khung vẽ trễ 20–60 ms (luồng chính đang lo việc khác)
    const tf = f + rn() * 1.5 + (ban && rn() < 0.15 ? 20 + rn() * 40 : 0)
    let co = false
    for (const s of st) { if (s.xong) continue; let n = s.daMoi; while (n < s.m.length && s.m[n][3] <= tf) n++; if (n > s.daMoi) { co = true; s.daMoi = n } }
    const p = tro(tf)
    if (p && tf - lucTro > TROI) { lucTro = tf; troCho = p; co = true }
    // nét vừa xong ở khung này ⇒ xả ngay + báo nhấc
    const xa = (t, cuoiNet) => {
      const dcDuoc = duong === 'dc' && (cuoiNet || t - tGuiCuoiDc >= (cu ? 0 : 12)), wsDuoc = duong === 'ws' && (cuoiNet || t - tGuiCuoiWs >= 34)
      let lai = false
      for (const s of st) {
        const tong = s.daMoi
        if (!tong || s.xong) continue
        // mốc đầu nét trên đồng hồ live: neo mẫu mới nhất vào «bây giờ» ở lần gửi đầu (như src/lib/live/thay.ts)
        if (s.tGoc == null) s.tGoc = Math.round(t - (s.m[tong - 1][3] - s.m[0][3]))
        const dau = { id: s.id, cong: 'but', mau: 'rgb(244,239,228)', co: 1.7 }
        if (duong === 'dc' && s.da < tong) { if (dcDuoc) { guiDc({ phien: 1, tGui: t, k: 'diem', dau, tGoc: s.tGoc, tu: s.truoc, diem: s.m.slice(s.truoc, tong).map((q) => [q[0], q[1], q[2], q[3] - s.m[0][3]]), _t0: s.m[0][3] }, t); s.truoc = s.da; s.da = tong; tGuiCuoiDc = t } else lai = true }
        if (duong === 'ws' && s.daWs < tong) { if (wsDuoc) { guiWs({ phien: 1, tGui: t, k: 'diem', dau, tGoc: s.tGoc, tu: s.daWs, diem: s.m.slice(s.daWs, tong).map((q) => [q[0], q[1], q[2], q[3] - s.m[0][3]]) }, t); s.daWs = tong; s.da = tong; tGuiCuoiWs = t } else lai = true }
      }
      if (troCho) { if (duong === 'dc' ? dcDuoc : wsDuoc) { (duong === 'dc' ? guiDc : guiWs)({ phien: 1, tGui: t, k: 'tro', x: troCho[0], y: troCho[1] }, t); if (duong === 'dc') tGuiCuoiDc = t; else tGuiCuoiWs = t; troCho = null } else lai = true }
      if (lai) hang.push({ luc: t + (duong === 'dc' ? 12 : Math.max(1, 34 - (t - tGuiCuoiWs))), lam: (t2) => xa(t2, false) })
    }
    // việc chờ tới hạn trước khung này
    hang.sort((a, b) => a.luc - b.luc)
    while (hang.length && hang[0].luc <= tf) { const v = hang.shift(); v.lam(v.luc + rn() * 2) }
    if (co) { if (cu) hang.push({ luc: tf + 16, lam: (t2) => xa(t2, false) }); else xa(tf + 0.5, false) }
    // nhấc bút: nét đã gom đủ mẫu ⇒ xả nốt ngay + báo nhấc (DataChannel hai lần)
    for (const s of st) if (!s.xong && s.daMoi >= s.m.length) {
      const tuLap = s.da
      xa(tf + 0.6, true); s.xong = true
      // bản mới: gói cuối gửi DataChannel thêm một lần (không có gói nào sau nó lặp lại)
      if (!cu && duong === 'dc') { const tu = Math.min(tuLap, s.truoc); guiDc({ phien: 1, tGui: tf + 0.65, k: 'diem', dau: { id: s.id, cong: 'but', mau: 'rgb(244,239,228)', co: 1.7 }, tGoc: s.tGoc, tu, diem: s.m.slice(tu).map((q) => [q[0], q[1], q[2], q[3] - s.m[0][3]]) }, tf + 0.65) }
      // nét xong vào sổ nét qua WebSocket của phòng (đường tin cậy): tới máy em sau trễ nền + rung
      chot.push({ nhan: tf + 1 + LECH + TRE + rn() * rung + 8, id: s.id, diem: s.m.map((q) => [q[0], q[1], q[2], q[3] - s.m[0][3]]) })
      const g = { phien: 1, tGui: tf + 0.7, k: 'nhac', id: s.id, tong: s.m.length }
      if (duong === 'dc') { guiDc(g, tf + 0.7); guiDc(g, tf + 0.7) } else guiWs(g, tf + 0.7)
    }
  }
  // ── mạng ──
  const toi = []
  let wsTruoc = 0
  for (const x of goi) {
    if (x.kenh === 'dc') { if (rn() < mat / 100) continue; toi.push({ nhan: x.gui + LECH + TRE + rn() * rung, g: x.g }) }
    else { const t = Math.max(wsTruoc, x.gui + LECH + TRE + rn() * rung + (rn() < mat / 100 ? 200 : 0)); wsTruoc = t; toi.push({ nhan: t, g: x.g }) }
  }
  toi.sort((a, b) => a.nhan - b.nhan)
  // ── máy em ──
  const dem = taoDemPhat({ mayYeu }), khungEm = mayYeu ? 1000 / 30 : 1000 / 60
  const tNet = new Map(bai.map((m, i) => [ID(i), m])) // id → mẫu (giờ tuyệt đối)
  const daPhat = new Map(), dangCo = new Set()
  let gi = 0, thay1 = 0, khungViet = 0, khungDung = 0, dungNay = 0, dungDai = 0, nhay = 0, troLech = 0, troNhay = 0, troTruoc = null
  const tre = [], cachMuc = [], ds = [], troVet = []
  let lucMucTruoc = null, netMucTruoc = '', tDauTruoc = new Map()
  for (let nay = LECH + 7; nay < LECH + tHet + 600; nay += khungEm) {
    while (gi < toi.length && toi[gi].nhan <= nay) { dem.nap(toi[gi].g, toi[gi].nhan); gi++ }
    // bản chốt tới (như src/lib/live/em.ts): nét dở còn đang phát ⇒ bản MỚI vá điểm thiếu rồi đợi phát xong; bản CŨ chỉ đợi; quá 400 ms thì thay hẳn
    for (const c of chot) {
      if (c.xong || c.nhan > nay) continue
      if (dem.dangPhat(c.id) && nay < c.nhan + 400) { if (!cu && dem.va) dem.va(c.id, c.diem); continue }
      if (dem.dangPhat(c.id)) { dem.boNet(c.id); thay1++ }
      c.xong = true; tDauTruoc.delete(c.id)
    }
    const k = dem.khung(nay)
    ds.push(k.d)
    let dauNet = null, coMuc = false, netMuc = ''
    for (const n of k.net) {
      const m = tNet.get(n.dau.id), da = (daPhat.get(n.dau.id) ?? 0) + n.moi.length
      daPhat.set(n.dau.id, da)
      if (n.xong) dangCo.delete(n.dau.id); else dangCo.add(n.dau.id)
      if (!n.head || n.xong) { if (n.xong) tDauTruoc.delete(n.dau.id); continue }
      dauNet = n.head
      // giờ (đồng hồ thầy) của đầu nét: tìm đoạn mẫu chứa đầu nét kể từ mẫu vừa phát
      const moiNhat = n.moi.length ? n.moi[n.moi.length - 1] : null
      let i = moiNhat ? m.findIndex((q) => q[3] - m[0][3] === moiNhat[3] && q[0] === moiNhat[0]) : (tDauTruoc.get(n.dau.id)?.i ?? 0)
      if (i < 0) i = tDauTruoc.get(n.dau.id)?.i ?? 0
      let tDau = m[i][3]
      if (i + 1 < m.length) { const a = m[i], b = m[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy; if (q > 0) tDau = a[3] + Math.max(0, Math.min(1, ((n.head.x - a[0]) * dx + (n.head.y - a[1]) * dy) / q)) * (b[3] - a[3]) }
      const truoc = tDauTruoc.get(n.dau.id)
      const conDiem = tDau < m[m.length - 1][3] - 1 // thầy đã viết xa hơn chỗ này
      const tThay = nay - LECH // «bây giờ» theo đồng hồ thầy
      if (truoc && conDiem && tThay - m[0][3] > 60) {
        khungViet++
        const tien = tDau - truoc.t
        if (tien <= 0.01) { khungDung++; dungNay += khungEm; if (dungNay > dungDai) dungDai = dungNay } else { dungNay = 0; coMuc = true; netMuc = n.dau.id; if (tien > 45) nhay++ }
        tre.push(tThay - tDau)
      } else if (truoc && tDau > truoc.t) { coMuc = true; netMuc = n.dau.id }
      tDauTruoc.set(n.dau.id, { t: tDau, i })
    }
    // khoảng cách giữa hai khung có mực mới TRONG CÙNG MỘT NÉT (không tính quãng thầy nhấc bút giữa hai nét)
    if (coMuc) { if (lucMucTruoc != null && netMuc === netMucTruoc) cachMuc.push(nay - lucMucTruoc); lucMucTruoc = nay; netMucTruoc = netMuc }
    // con trỏ: bản mới = k.but; bản cũ = lớp LopLive chọn «con trỏ lơ lửng, không có thì đầu nét»
    const tr = cu ? (k.tro ?? dauNet) : k.but
    if (dauNet && tr && Math.hypot(tr.x - dauNet.x, tr.y - dauNet.y) > 0.002) troLech++
    if (tr && troTruoc && Math.hypot(tr.x - troTruoc.x, tr.y - troTruoc.y) > 0.015) troNhay++
    troTruoc = tr
    if (tr) troVet.push([nay - LECH, tr.x, tr.y])
  }
  // CON TRỎ so với BÚT THẬT: bút thật ở đâu lúc (giờ thầy − trễ nét trung vị)? Sai số tính bằng % bề ngang bảng đen (0,33 cửa sổ).
  const butThat = (t) => { for (const m of bai) { if (t >= m[0][3] && t <= m[m.length - 1][3]) { let i = 0; while (i + 1 < m.length && m[i + 1][3] < t) i++; const a = m[i], b = m[Math.min(m.length - 1, i + 1)], k = b[3] > a[3] ? (t - a[3]) / (b[3] - a[3]) : 0; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] } } return tro(t) }
  const treGiua = [...tre].sort((x, y) => x - y)[tre.length >> 1] ?? 60
  const saiTro = []
  for (const [t, x, y] of troVet) { const p = butThat(t - treGiua); if (p) saiTro.push(Math.hypot(x - p[0], y - p[1]) / 0.33 * 100) }
  const s = (a) => [...a].sort((x, y) => x - y), pc = (a, p) => { const b = s(a); return b.length ? +b[Math.min(b.length - 1, Math.floor(b.length * p))].toFixed(1) : 0 }
  const tongDiem = bai.reduce((x, m) => x + m.length, 0), daVe = [...daPhat.values()].reduce((x, y) => x + y, 0)
  return {
    khungViet, khungDung, phanTramDung: +(100 * khungDung / Math.max(1, khungViet)).toFixed(2), dungDaiNhatMs: +dungDai.toFixed(0), khungNhayCuc: nhay,
    cachMucP95: pc(cachMuc, 0.95), cachMucLonNhat: pc(cachMuc, 1), treTrungVi: pc(tre, 0.5), treP95: pc(tre, 0.95), dTrungVi: pc(ds, 0.5),
    troLechDauNet: troLech, troNhay, troSaiP95: pc(saiTro, 0.95), troSaiHon3: saiTro.filter((v) => v > 3).length, netPhaiThay: thay1, diemVeTrucTiep: +(100 * daVe / tongDiem).toFixed(1),
  }
}

const moi = await nap(GOC, 'moi'), cu = process.env.GOC_CU ? await nap(resolve(process.env.GOC_CU), 'cu') : null
const kq = []
const in1 = (r) => `đứng ${r.khungDung}/${r.khungViet} khung (${r.phanTramDung} %), dài nhất ${r.dungDaiNhatMs} ms · nhảy cục ${r.khungNhayCuc} · cách mực p95 ${r.cachMucP95} ms (lớn nhất ${r.cachMucLonNhat}) · trễ ${r.treTrungVi} / p95 ${r.treP95} ms · D ${r.dTrungVi} ms · con trỏ: lệch đầu nét ${r.troLechDauNet} khung, sai p95 ${r.troSaiP95} % bề ngang bảng, sai > 3 %: ${r.troSaiHon3} khung · nét phải thay cả nét ${r.netPhaiThay}`
const CAU_HINH = [['dc', 0, 0], ['dc', 30, 0], ['dc', 30, 2], ['dc', 80, 2], ['dc', 80, 5], ['dc', 30, 2, 'yeu'], ['dc', 30, 2, 'ban'], ['ws', 0, 0], ['ws', 30, 2], ['ws', 80, 5]]
for (const [duong, rung, mat, them] of CAU_HINH) {
  const o = { duong, rung, mat, mayYeu: them === 'yeu', ban: them === 'ban' }
  const dong = { duong: duong === 'dc' ? 'DataChannel' : 'WebSocket dự phòng', rungMs: rung, matPhanTram: mat, mayYeu: o.mayYeu, mayThayBan: o.ban }
  // trung vị của 5 hạt ngẫu nhiên cho từng số đo
  const tv = (tao, la) => { const ds = [1, 2, 3, 4, 5].map((h) => chay(tao, { ...o, cu: la, hat: h * 13 })), ra = {}; for (const k of Object.keys(ds[0])) ra[k] = [...ds.map((d) => d[k])].sort((a, b) => a - b)[2]; return ra }
  if (cu) dong.truoc = tv(cu, true)
  dong.sau = tv(moi, false)
  kq.push(dong)
  console.log(`[${dong.duong}] rung ${rung} ms · mất ${mat} %${o.mayYeu ? ' · máy em yếu 30 khung/giây' : ''}${o.ban ? ' · máy thầy bận (15 % khung trễ 20–60 ms)' : ''}`)
  if (dong.truoc) console.log('   TRƯỚC: ' + in1(dong.truoc))
  console.log('   SAU:   ' + in1(dong.sau))
}
mkdirSync(dirname(RA), { recursive: true })
writeFileSync(RA, JSON.stringify({ luc: new Date().toISOString(), may: 'máy mô phỏng (không mạng thật, không trình duyệt): node + src/lib/live/noi-suy.ts; mỗi ô = trung vị 5 hạt ngẫu nhiên', moHinh: 'thầy viết ~20 giây chữ mẫu 200 Hz, máy thầy 60 khung/giây; mạng trễ nền 30 ms + rung đều 0…J + mất p %; máy em 60 khung/giây (máy yếu 30)', ketQua: kq }, null, 2) + '\n')
