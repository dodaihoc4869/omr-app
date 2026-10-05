// MÔ PHỎNG KIỂM CHỨNG "CHẮC 8+" — OMNI bản 3 (05/10/2026). Chạy: node docs/omni-0510/mo-phong-chac-8.mjs
// Tất định (PRNG mulberry32). Không đọc D1, không đụng mã app. Trả lời bằng SỐ:
//   (1) trần điểm theo tỉ lệ SƠ Ý S của em: nắm hết mọi kỹ năng thì điểm kỳ vọng và P(≥ 8) là bao nhiêu;
//   (2) với thể lực 40 lượt/ngày, em ở mức kiến thức xuất phát P0 và độ cẩn thận S nào đạt chứng chỉ sau mấy ngày;
//   (3) chứng chỉ theo mô hình có khai oan không (P thật < 0,80 lúc cấp).
// Mô hình: 9 dạng × 4 vi kỹ năng = 36 kỹ năng nhị phân. Câu Phần I/III cần 2 kỹ năng cùng dạng (cổng AND); mỗi ý Đúng–sai cần 1 kỹ năng.
// Đúng với xác suất 1 − S nếu đủ kỹ năng, G nếu thiếu (G: I 0,25 · ý II 0,5 · III 0,01). Học thật: mỗi lượt có phản hồi, kỹ năng chưa nắm mà câu cần
// được nắm với xác suất T_THAT. Máy ước P_k bằng cập nhật Bayes hội (độc lập xấp xỉ) + bước học T_UOC, và ƯỚC S RIÊNG của em từ các lượt sai
// khi mọi kỹ năng cần đã ≥ 0,9 (prior 0,08, 10 lượt ảo). Chứng chỉ: P_mô hình(điểm ≥ 8) ≥ 0,90 trên đề 18 + 4 + 6 (PMF chính xác bằng tích chập,
// dùng câu "trung bình" từng phần).

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

const SO_DANG = 9, KN_MOI_DANG = 4, K = SO_DANG * KN_MOI_DANG
const G = { I: 0.25, Y: 0.5, III: 0.01 }
const T_THAT = 0.20, T_UOC = 0.15
const S_PRIOR = 0.08, S_AO = 10
const BUOC = 0.05, SO_BIN = Math.round(10 / BUOC) + 1

function taoKho(rng) {
  const kho = []
  const them = (phan, n) => { for (let i = 0; i < n; i++) { const d = i % SO_DANG; const a = d * KN_MOI_DANG + Math.floor(rng() * KN_MOI_DANG); let b = d * KN_MOI_DANG + Math.floor(rng() * KN_MOI_DANG); if (b === a) b = d * KN_MOI_DANG + ((a - d * KN_MOI_DANG + 1) % KN_MOI_DANG); kho.push({ phan, dang: d, kn: [a, b] }) } }
  them('I', 60); them('III', 32)
  for (let i = 0; i < 20; i++) { const d = i % SO_DANG; kho.push({ phan: 'II', dang: d, y: [0, 1, 2, 3].map(() => d * KN_MOI_DANG + Math.floor(rng() * KN_MOI_DANG)) }) }
  return kho
}

const pAll = (P, kn) => kn.reduce((s, k) => s * P[k], 1)
const pDung = (pall, g, S) => pall * (1 - S) + (1 - pall) * g

/** PMF điểm một câu Đúng–sai từ xác suất đúng của 4 ý. */
function pmfDungSai(py) {
  const soY = [1, 0, 0, 0, 0]
  for (const p of py) { const m = [0, 0, 0, 0, 0]; for (let j = 0; j < 5; j++) { if (!soY[j]) continue; m[j] += soY[j] * (1 - p); if (j < 4) m[j + 1] += soY[j] * p } for (let j = 0; j < 5; j++) soY[j] = m[j] }
  return [[0, soY[0]], [0.1, soY[1]], [0.25, soY[2]], [0.5, soY[3]], [1, soY[4]]]
}

/** Đề "trung bình" 18 + 4 + 6: xác suất đúng trung bình của câu từng phần trong kho, theo P (mô hình) hoặc trạng thái thật (0/1), với S cho trước. */
function phanBoDe(kho, P, S) {
  const tb = (phan, g) => { const ds = kho.filter((c) => c.phan === phan); return ds.reduce((s, c) => s + pDung(pAll(P, c.kn), g, S), 0) / ds.length }
  const pI = tb('I', G.I), pIII = tb('III', G.III)
  const dsII = kho.filter((c) => c.phan === 'II')
  const pY = dsII.reduce((s, c) => s + c.y.reduce((t, k) => t + pDung(P[k], G.Y, S), 0) / 4, 0) / dsII.length
  const cauII = pmfDungSai([pY, pY, pY, pY])
  let pmf = new Float64Array(SO_BIN); pmf[0] = 1
  const nhan = (ds) => { const moi = new Float64Array(SO_BIN); for (const [d, pr] of ds) { if (!pr) continue; const dich = Math.round(d / BUOC); for (let b = 0; b + dich < SO_BIN; b++) if (pmf[b]) moi[b + dich] += pmf[b] * pr } pmf = moi }
  for (let i = 0; i < 18; i++) nhan([[0, 1 - pI], [0.25, pI]])
  for (let i = 0; i < 4; i++) nhan(cauII)
  for (let i = 0; i < 6; i++) nhan([[0, 1 - pIII], [0.25, pIII]])
  let p8 = 0, ky = 0
  for (let b = 0; b < SO_BIN; b++) { ky += b * BUOC * pmf[b]; if (b >= Math.round(8 / BUOC)) p8 += pmf[b] }
  return { p8, ky, pI, pY, pIII }
}

/** Cập nhật Bayes hội từng kỹ năng (độc lập xấp xỉ) rồi bước học. */
function capNhat(P, kn, dung, g, S) {
  const pall = pAll(P, kn)
  const pc = pDung(pall, g, S)
  const moi = P.slice()
  for (const k of kn) {
    const pKhac = pall / P[k]
    const thich = dung ? ((1 - S) * pKhac + g * (1 - pKhac)) / pc : (S * pKhac + (1 - g) * (1 - pKhac)) / (1 - pc)
    let p = Math.min(0.99, Math.max(0.02, P[k] * thich))
    moi[k] = p + (1 - p) * T_UOC
  }
  return moi
}

function moPhongEm(kho, p0, sThat, theLuc, rng, soNgayToiDa = 21) {
  const that = Array.from({ length: K }, () => (rng() < p0 ? 1 : 0))
  let P = Array.from({ length: K }, () => p0)
  let nVung = 0, nSaiVung = 0
  const sUoc = () => (nSaiVung + S_PRIOR * S_AO) / (nVung + S_AO)
  const daGap = new Set(), sai = new Set()
  let ngayChung = null, thatLucChung = null
  const lichSu = []
  for (let ngay = 1; ngay <= soNgayToiDa; ngay++) {
    const S = sUoc()
    const diem = (c) => { const kn = c.phan === 'II' ? c.y : c.kn; const pall = pAll(P, kn); const pc = pDung(pall, c.phan === 'I' ? G.I : c.phan === 'II' ? G.Y : G.III, S); const trong = c.phan === 'II' ? 1 : 0.25; const vung = pc >= 0.75 && pc <= 0.9 ? 1.3 : pc < 0.5 ? 0.8 : 1; return trong * (1 - pall) * vung }
    const no = kho.filter((c) => sai.has(c)).sort((a, b) => diem(b) - diem(a))
    const moi = kho.filter((c) => !daGap.has(c)).sort((a, b) => diem(b) - diem(a))
    const on = kho.filter((c) => daGap.has(c) && !sai.has(c)).sort((a, b) => diem(b) - diem(a))
    const quotaMoi = ngay <= 4 ? Math.ceil(moi.length / (5 - ngay)) : moi.length
    const layNo = Math.min(no.length, Math.floor(theLuc * 0.5))
    const layMoi = Math.min(moi.length, quotaMoi, theLuc - layNo)
    const layOn = Math.max(0, theLuc - layNo - layMoi)
    const luot = [...no.slice(0, layNo), ...moi.slice(0, layMoi), ...on.slice(0, layOn)]
    const quanSat = (kn, g) => {
      const vung = kn.every((k) => P[k] >= 0.9)
      const d = rng() < (kn.every((k) => that[k]) ? 1 - sThat : g)
      if (vung) { nVung++; if (!d) nSaiVung++ }
      P = capNhat(P, kn, d, g, sUoc())
      for (const k of kn) if (!that[k] && rng() < T_THAT) that[k] = 1
      return d
    }
    for (const c of luot) {
      daGap.add(c)
      if (c.phan === 'II') { let du = true; for (const k of c.y) if (!quanSat([k], G.Y)) du = false; if (du) sai.delete(c); else sai.add(c) }
      else { const d = quanSat(c.kn, c.phan === 'I' ? G.I : G.III); if (d) sai.delete(c); else sai.add(c) }
    }
    const mo = phanBoDe(kho, P, sUoc())
    const th = phanBoDe(kho, that, sThat)
    lichSu.push({ ngay, p8Mo: mo.p8, kyMo: mo.ky, p8That: th.p8, kyThat: th.ky, sUoc: sUoc() })
    if (ngayChung === null && mo.p8 >= 0.9) { ngayChung = ngay; thatLucChung = th.p8 }
  }
  return { ngayChung, thatLucChung, lichSu }
}

const trungVi = (xs) => { const a = xs.filter((x) => x !== null).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null }
const KHO = taoKho(mulberry32(20261005))
const pct = (x) => `${(x * 100).toFixed(0)} %`

console.log('== (1) TRẦN ĐIỂM THEO SƠ Ý: nắm hết mọi kỹ năng (P = 1) ==')
for (const S of [0.12, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02]) { const r = phanBoDe(KHO, Array(K).fill(1), S); console.log(`S = ${S.toFixed(2)} → điểm kỳ vọng ${r.ky.toFixed(2)} · P(≥ 8) = ${pct(r.p8)}`) }
console.log('\n== (1b) Kiến thức chưa trọn, S = 0,05 ==')
for (const p of [0.85, 0.9, 0.95, 0.97, 0.99]) { const r = phanBoDe(KHO, Array(K).fill(p), 0.05); console.log(`P mỗi kỹ năng ${p.toFixed(2)} · S 0,05 → điểm kỳ vọng ${r.ky.toFixed(2)} · P(≥ 8) = ${pct(r.p8)}`) }

console.log('\n== (2)(3) Thể lực 40 · 80 em mỗi ô · ngày đạt chứng chỉ (P mô hình ≥ 0,90) · đạt tới ngày 7/10/14 · khai oan (P thật < 0,80 lúc cấp) · S ước ngày 7 ==')
const LOAI = [['Giỏi', 0.75], ['Khá', 0.6], ['Trung bình', 0.45], ['Yếu', 0.3]]
const CAN_THAN = [['cẩn thận', 0.03], ['thường', 0.06], ['sơ ý', 0.10]]
for (const [tenS, sThat] of CAN_THAN) {
  for (const [ten, p0] of LOAI) {
    const kq = []
    for (let i = 0; i < 80; i++) kq.push(moPhongEm(KHO, p0, sThat, 40, mulberry32(50_000 + 1000 * Math.round(sThat * 100) + 97 * i + Math.round(p0 * 100))))
    const ngay = kq.map((x) => x.ngayChung)
    const dat = (n) => pct(ngay.filter((d) => d !== null && d <= n).length / ngay.length)
    const co = kq.filter((x) => x.ngayChung !== null)
    const oan = co.length ? pct(co.filter((x) => x.thatLucChung < 0.8).length / co.length) : '–'
    const s7 = (kq.reduce((s, x) => s + x.lichSu[6].sUoc, 0) / kq.length).toFixed(3)
    const ky7 = (kq.reduce((s, x) => s + x.lichSu[6].kyThat, 0) / kq.length).toFixed(2)
    console.log(`S thật ${sThat.toFixed(2)} ${tenS.padEnd(8)} · ${ten.padEnd(10)} P0 ${p0} · trung vị ngày đạt ${String(trungVi(ngay) ?? '> 21').padStart(4)} · ≤ 7: ${dat(7).padStart(5)} · ≤ 10: ${dat(10).padStart(5)} · ≤ 14: ${dat(14).padStart(5)} · khai oan ${oan} · S ước ngày 7 ${s7} · điểm thật kỳ vọng ngày 7 ${ky7}`)
  }
}
