// VIDEO BÀI GIẢNG — HOẠT HOẠ PHẦN 3: PEPTIDE TRONG MÔI TRƯỜNG BASE, TỪNG BƯỚC THEO LỜI + NÉT VIẾT CỦA THẦY (thầy 14/11 «làm kĩ hơn về từng bước hoạt hoạ
// giải thích theo lời thầy nói cực cuốn, cực chi tiết, bảng và hoạt hoạ phải phối hợp nhịp nhàng» · «làm thử phần viết pt tác dụng với bazơ»).
// Mốc lấy từ GIỜ THẦY VIẾT từng cụm nét ({s}) và GIỜ THẦY NÓI từng từ khoá ([câu, "từ"]); bộ dựng đổi ra giây video.
// Cột: phương trình tổng ở đỉnh (mỗi vế hiện ĐÚNG lúc Thầy viết vế đó) + sân hoạt hoạ 4 bước:
//   A · cơ chế COOH + NaOH (acid nhường H⁺, base nhận H⁺ ⇒ H₂O, còn lại COONa)
//   B · đếm đầu C của Gly - Ala - Gly ⇒ NaOH : 3a
//   C · cân bằng nước: cần 2 (cắt 2 liên kết), sinh 3 (3 đầu C) ⇒ triệt tiêu 2, còn 1 ⇒ H₂O : a
//   D · muối Gly-Na: mất 1 H (− 1), thêm Na (+ 23) ⇒ M = 75 + 22 = 97; Ala-Na: 89 + 22 = 111
'use strict'
const r3 = (x) => Math.round(x * 1000) / 1000
/** hiện bật nhẹ từ dưới lên (lò xo), trả tiến độ */
const xuat = (e, t, t0, dy = 18, s0 = 0.82) => { const p = lo(t - t0, 2.3, 0.55); e.style.opacity = r3(kep(p * 1.5)); e.style.transform = `translateY(${r3((1 - p) * dy)}px) scale(${r3(s0 + (1 - s0) * kep(p, 0, 1.25))})`; return p }
/** mờ đi từ t0 (nhân vào độ mờ đang có) */
const tat = (e, t, t0, d = 0.35) => { if (t >= t0) e.style.opacity = r3(Number(e.style.opacity || 1) * (1 - tien(t, t0, d))) }
const datXY = (e, x, y) => { e.style.left = `${Math.round(x)}px`; e.style.top = `${Math.round(y)}px` }
const hien = (e, v) => { e.style.opacity = r3(v); e.style.display = v > 0.001 ? '' : 'none' }

function dungBazo(d, goc) {
  goc.classList.add('bz')
  const W = (typeof COT !== 'undefined' && COT.w) || 828
  const E = (cls, html, cha = goc) => tao('div', cls, cha, html)
  // ── A: PHƯƠNG TRÌNH ĐÚNG NHƯ BẢNG (thầy 14/11 «hoạt hoạ theo thứ tự thầy viết, ký hiệu phải chính xác đúng vị trí»): «1COOH + 1NaOH → H₂O + COONa» là MỘT
  //    dòng chữ thường (mỗi ký hiệu một ô cố định, không bao giờ chồng); mỗi chữ hiện đúng lúc Thầy viết chữ đó. Chuyển động là các BẢN SAO bay giữa
  //    các ô (H⁺ theo cung, OH⁻ + H⁺ vào ô H₂O, COO + Na vào ô COONa) — điểm đi / đến đo từ chính các ô sau khi chữ đã dàn trang.
  const A = E('bz-san', ''); A.style.top = '24px'
  const svgA = svgEl('svg', { width: W, height: 500, viewBox: `0 0 ${W} 500`, class: 'bz-svg' }, A)
  const cung = svgEl('path', { fill: 'none', stroke: '#fda4af', 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, svgA)
  const muiCung = svgEl('path', { d: 'M -16 -10 L 2 0 L -16 10', fill: 'none', stroke: '#fda4af', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, svgA)
  const hang = E('bz-hangA', '', A), S = (cls, html, cha = hang) => tao('span', `bz-g ${cls}`, cha, html)
  const g = {
    he1: S('he', '1'), C: S('', 'C'), O1: S('', 'O'), O2: S('', 'O<i class="q">−</i>'), H: S('h', 'H<i class="q">+</i>'), cong1: S('dau', '+'),
    he2: S('he', '1'), Na: S('na', 'Na<i class="q">+</i>'), OH: S('oh', 'OH<i class="q">−</i>'), mui: S('dau mui', '→'), H2O: S('nuoc', ''), cong2: S('dau', '+'), COONa: S('', ''),
  }
  g.H2O_H = S('', 'H', g.H2O); g.H2O_2 = S('chiso', '2', g.H2O); g.H2O_O = S('', 'O', g.H2O)
  g.CN_C = S('', 'C', g.COONa); g.CN_OO = S('', 'OO', g.COONa); g.CN_Na = S('na', 'Na', g.COONa)
  const a = {
    hang, g, cung, muiCung, gach: E('bz-gach', '', A), hop: E('bz-khung', '', A),
    bayH: E('bz-bay h', 'H<i class="q">+</i>', A), bayOH: E('bz-bay oh', 'OH<i class="q">−</i>', A), bayCOO: E('bz-bay', 'COO', A), bayNa: E('bz-bay na', 'Na', A),
    nhAcid: E('bz-nh hong', 'acid: <b>nhường H⁺</b>', A), nhBase: E('bz-nh xanh', 'base: <b>nhận H⁺</b>', A),
    nhNuoc: E('bz-nh nuoc', 'H⁺ + OH⁻ ⇒ <b>1 nước</b>', A), nhCoona: E('bz-nh vang', 'còn lại gộp: <b>COONa</b>', A),
    tom: E('bz-tom', 'Mỗi <b>COOH</b> (đầu C) cần <b>1 NaOH</b>, sinh <b>1 H₂O</b>', A),
  }
  // ── B + C (bản 8 — thầy 14/11 «học tập cách làm rõ ràng dễ hiểu trên thế giới… không bị lặp chữ, mượt mà»): KHÔNG thẻ chữ nhắc lại lời Thầy
  //    (nguyên tắc dư thừa của Mayer: lời đã có giọng + phụ đề thì hình không viết lại câu đó); chỉ VẬT THỂ + ký hiệu + con số, và vật thể BIẾN ĐỔI
  //    liền mạch (kiểu 3Blue1Brown): COOH ⇒ COONa ngay trong ô, NaOH ×3 tách thành 3 thẻ, giọt nước đi từ chỗ sinh tới chỗ triệt tiêu.
  const BC = E('bz-san', ''); BC.style.top = '20px'
  const ten = ['Gly', 'Ala', 'Gly'], bw = 196, gap = (W - 28 - 3 * bw) / 2, giua = (i) => 14 + i * (bw + gap) + bw / 2
  const khoi = ten.map((t2) => E('bz-k', `<b>${t2}</b>`, BC))
  const lk = [0, 1].map((i) => { const e = E('bz-lk', '', BC); e.style.left = `${Math.round(14 + bw + i * (bw + gap))}px`; e.style.width = `${Math.round(gap)}px`; return e })
  const dauC = ten.map(() => E('bz-dc', 'COO<span class="khe"><i class="g2">H</i><i class="g3">Na</i></span>', BC))
  const soC = ten.map((_, i) => E('bz-so', String(i + 1), BC))
  const naohT = ten.map(() => E('bz-tag', 'NaOH', BC))
  const chipHcl = E('bz-chip hcl', 'HCl', BC), chipNaoh = E('bz-chip naoh', 'NaOH<i class="x">× 3</i>', BC), ba = E('bz-so-lon', '3', BC)
  const bongCan = [0, 1].map(() => E('bz-giot nho bong', '', BC))
  const giotCan = [0, 1].map(() => E('bz-giot nho', 'H₂O', BC)), giotSinh = [0, 1, 2].map(() => E('bz-giot nho', 'H₂O', BC))
  const tagTru = E('bz-tagso tru', '− 2', BC), tagCong = E('bz-tagso cong', '+ 3', BC), chipNuoc = E('bz-chip nuoc', 'H₂O', BC), poof = [0, 1].map(() => E('bz-poof', '', BC))
  // ── D: muối + M — công thức Gly mọc ra từ khối Gly (biến đổi liền mạch); số − 1 / + 23 bay từ đúng chỗ H rời / Na đến vào phép tính; − 1 + 23 chập thành + 22
  const D = E('bz-san', ''); D.style.top = '20px'
  const dd = {
    gly: E('bz-k bong', '<b>Gly</b>', D),
    hang: E('bz-hangD', '<span class="bz-g">H₂N-CH₂-COO</span><span class="bz-g h">H</span>', D), h: E('bz-bay h vua', 'H', D), na: E('bz-bay na vua', 'Na', D),
    soTru: E('bz-bay so tru', '− 1', D), soCong: E('bz-bay so cong', '+ 23', D), sai: E('bz-bay so sai', '+ 23', D), g1: E('bz-bay so tru', '− 1', D), g2: E('bz-bay so cong', '+ 23', D),
    m: E('bz-m2', '<div class="d1"><span>Gly-Na</span><i>75</i><i class="tru">− 1</i><i class="cong">+ 23</i></div><div class="d2"><i>= 75</i><i class="gop">+ 22</i><i class="kq">= 97</i></div>', D),
    ala: E('bz-m2 ala', '<div class="d1"><span>Ala-Na</span><i>89</i><i class="gop">+ 22</i><i class="kq">= 111</i></div>', D),
  }
  d.bz = { A, a, BC, khoi, lk, dauC, soC, naohT, chipHcl, chipNaoh, ba, bongCan, giotCan, giotSinh, tagTru, tagCong, chipNuoc, poof, D, dd, bw, gap, W, giua }
  // TIA LẤP LÁNH đúng khoảnh khắc: nước thành · đếm 1-2-3 · tổng 3 · NaOH gắn · còn 1 nước · Na gắn · + 22 · = 97 · = 111
  const iM = dd.m.querySelectorAll('i'), iAla = dd.ala.querySelectorAll('i'), NUOC = '#8fd8ee', VANG = '#ffd27a'
  d.lap = [
    { k: 'a_nuoc', e: g.H2O, mau: NUOC, n: 14 }, { k: 'a_coona', e: g.COONa, mau: VANG },
    { k: 'b_c1', e: dauC[0] }, { k: 'b_c2', e: dauC[1] }, { k: 'b_c3', e: dauC[2] }, { k: 'b_tong', e: ba, mau: VANG, n: 16 },
    ...naohT.map((e, i) => ({ k: 'b_an', tre: 0.6 + i * 0.18, e, mau: '#8fb6ff', n: 8 })),
    { k: 'c_con', tre: 0.7, e: giotSinh[2], mau: NUOC, n: 16 }, { k: 'd_na', tre: 1.15, e: dd.na, mau: '#8fb6ff' },
    { k: 'd_22', tre: 0.7, e: iM[4], mau: VANG, n: 16 }, { k: 'd_22', tre: 1.4, e: iM[5], mau: VANG }, { k: 'd_ala22', tre: 0.7, e: iAla[2], mau: VANG, n: 16 },
  ]
  // đường nối từ chỗ khoanh trên bảng tới đúng vật thể (giữ tên mốc cũ của cấu hình)
  d.hoatNeo = {
    'pt-pep': khoi[1], 'pt-naoh': chipNaoh, 'pt-3a': chipNaoh, 'pt-mui': khoi[2], 'pt-nuoc': giotSinh[2], 'pt-glyna': dd.hang, 'pt-alana': dd.ala,
    'a-cooh': g.C, 'a-h': g.H, 'a-oh': g.OH, 'a-nuoc': g.H2O, 'a-coona': g.COONa, 'b-dc': dauC[0], 'b-dc1': dauC[1], 'b-dc2': dauC[2], 'b-banchat': dauC[0],
    'd-tru': iM[1], 'd-cong': iM[2], 'd-m': dd.m, 'd-ala': dd.ala,
  }
}

function veBazo(d, t) {
  const m = d.hoat.moc, Z = d.bz
  // ba sân nối nhau: A (khi bảng thu nhỏ) · B + C từ lúc Thầy viết peptide · D từ lúc Thầy nói «Gly … gắn Na»
  const vA = 1 - tien(t, m.b_hien - 0.4, 0.45), vBC = tien(t, m.b_hien - 0.35, 0.4) * (1 - tien(t, m.d_hien - 0.4, 0.5)), vD = tien(t, m.d_hien - 0.45, 0.5)
  hien(Z.A, vA); hien(Z.BC, vBC); hien(Z.D, vD)
  if (vA > 0) veBazoA(Z, m, t)
  if (vBC > 0) veBazoBC(Z, m, t)
  if (vD > 0) veBazoD(Z, m, t)
}

/** Ô chữ của dòng phương trình theo toạ độ sân A (đo MỘT lần, chỉ khi dòng đã hiện + phông đã nạp — đo lúc ẩn ra 0 là lỗi bản 2: «H đè lên C»). */
function oA(Z) {
  if (Z.oA) return Z.oA
  const h = Z.a.hang
  if (!h.offsetWidth || (document.fonts && document.fonts.status !== 'loaded')) return null
  const o = {}
  for (const [k, e] of Object.entries(Z.a.g)) { let x = e.offsetLeft, y = e.offsetTop; if (e.parentElement !== h) { x += e.parentElement.offsetLeft; y += e.parentElement.offsetTop } o[k] = { x: h.offsetLeft + x, y: h.offsetTop + y, w: e.offsetWidth, h: e.offsetHeight } }
  Z.oA = o; return o
}
function veBazoA(Z, m, t) {
  const a = Z.a, g = a.g
  // chữ hiện ĐÚNG lúc Thầy viết chữ đó (giờ nét trên bảng)
  for (const [k, t0] of [['he1', m.a_g1], ['C', m.a_gC], ['O1', m.a_gO1], ['O2', m.a_gO2], ['H', m.a_gH], ['cong1', m.a_gCong1], ['he2', m.a_g1b], ['Na', m.a_gNa], ['OH', m.a_gOH], ['mui', m.a_gMui],
    ['H2O_H', m.a_gH2O], ['H2O_2', m.a_gH2O2], ['H2O_O', m.a_gH2O3], ['cong2', m.a_gCong2], ['CN_C', m.a_gCN], ['CN_OO', m.a_gCN2], ['CN_Na', m.a_gCN3]]) xuat(g[k], t, t0, 10, 0.6)
  for (const k of ['H2O', 'COONa']) g[k].style.opacity = 1
  // acid nhường H⁺ (H sáng hồng, mang dấu +, COO mang dấu −) · base nhận H⁺ (OH sáng xanh, mang dấu −, Na mang dấu +)
  const daBay = t >= m.a_cung1, xongNuoc = t >= m.a_nuoc, xongMuoi = t >= m.a_coona, tom = t >= m.a_tom
  g.H.classList.toggle('sang', t >= m.a_acid && !daBay); g.OH.classList.toggle('sang', t >= m.a_base && t < m.a_nuoc)
  for (const [e, t0] of [[g.H, m.a_acid], [g.O2, m.a_cooTru ?? m.a_acid], [g.Na, m.a_naCong ?? m.a_base], [g.OH, m.a_base]]) e.querySelector('.q').style.opacity = r3(tien(t, t0, 0.25) * (tom ? 0 : 1))
  // đã dùng ⇒ mờ đi (H đã bay sang OH, OH đã thành nước, COO + Na đã gộp); tổng kết ⇒ phương trình đọc lại bình thường
  const mo = (e, t0) => { if (t >= t0 && !tom) e.style.opacity = r3(Number(e.style.opacity) * (1 - 0.62 * tien(t, t0, 0.4))) }
  mo(g.H, m.a_cung0 + 0.1); mo(g.OH, m.a_gH2O); mo(g.C, m.a_gCN); mo(g.O1, m.a_gCN); mo(g.O2, m.a_gCN); mo(g.Na, m.a_gCN3 - 0.3)
  // nhãn theo lời
  const o = oA(Z)
  if (o) {
    const duoi = (k, dy = 0) => o[k].y + o[k].h + 10 + dy
    datXY(a.nhAcid, o.C.x - 6, duoi('C')); xuat(a.nhAcid, t, m.a_acid); tat(a.nhAcid, t, m.a_nuoc + 1.2)
    datXY(a.nhBase, Math.min(Z.W - 236, o.Na.x - 6), duoi('Na', 58)); xuat(a.nhBase, t, m.a_base); tat(a.nhBase, t, m.a_nuoc + 1.2)
    datXY(a.nhNuoc, Math.min(Z.W - 300, o.H2O.x - 20), duoi('H2O')); xuat(a.nhNuoc, t, m.a_nuoc + 0.2)
    datXY(a.nhCoona, Math.min(Z.W - 330, o.COONa.x - 60), duoi('COONa', 58)); xuat(a.nhCoona, t, m.a_coona + 0.2)
    // MŨI TÊN CONG H → OH: vẽ dần ĐÚNG nhịp nét cong Thầy vẽ (a_cung0 … a_cung1); bản sao H⁺ chạy theo đầu mũi tên
    const x0 = o.H.x + o.H.w / 2, x1 = o.OH.x + o.OH.w * 0.4, yC = o.H.y + 2, cx = (x0 + x1) / 2, cy = yC - 120
    const pc = tien(t, m.a_cung0, Math.max(0.3, m.a_cung1 - m.a_cung0)), mCung = r3(1 - tien(t, m.a_gH2O, 0.4))
    a.cung.setAttribute('d', `M ${x0} ${yC} Q ${cx} ${cy} ${x1} ${yC}`); a.cung.setAttribute('stroke-dashoffset', String(r3(1 - pc))); a.cung.setAttribute('opacity', String(mCung))
    a.muiCung.setAttribute('transform', `translate(${x1},${yC}) rotate(${r3((Math.atan2(yC - cy, x1 - cx) * 180) / Math.PI)})`); a.muiCung.setAttribute('opacity', String(t >= m.a_muiCung ? mCung : 0))
    const bz = (p, A0, A1, A2) => (1 - p) * (1 - p) * A0 + 2 * (1 - p) * p * A1 + p * p * A2
    // H⁺ bay theo cung, đậu trên OH; khi Thầy viết H₂O thì H⁺ + OH⁻ cùng bay vào ô H₂O
    const vao = eInOut(tien(t, m.a_gH2O - 0.35, 0.6)), hX = lerp(bz(pc, o.H.x, cx - o.H.w / 2, o.OH.x - 4), o.H2O.x, vao), hY = lerp(bz(pc, o.H.y, cy - 10, o.OH.y - o.OH.h * 0.75), o.H2O.y, vao)
    datXY(a.bayH, hX, hY); a.bayH.style.opacity = r3(tien(t, m.a_cung0, 0.12) * (1 - tien(t, m.a_gH2O + 0.25, 0.2)))
    datXY(a.bayOH, lerp(o.OH.x, o.H2O.x + o.H2O.w * 0.35, vao), lerp(o.OH.y, o.H2O.y, vao)); a.bayOH.style.opacity = r3(tien(t, m.a_gH2O - 0.35, 0.1) * (1 - tien(t, m.a_gH2O + 0.25, 0.2)))
    // gạch dưới OH (lúc Thầy gạch trên bảng) · khung quanh H₂O (lúc Thầy vẽ khung)
    datXY(a.gach, o.OH.x - 2, o.OH.y + o.OH.h - 4); a.gach.style.width = `${o.OH.w + 4}px`; a.gach.style.transform = `scaleX(${r3(eOut(tien(t, m.a_gachOH, 0.35)))})`; a.gach.style.opacity = r3(1 - tien(t, m.a_gH2O, 0.4))
    datXY(a.hop, o.H2O.x - 10, o.H2O.y - 4); a.hop.style.width = `${o.H2O.w + 20}px`; a.hop.style.height = `${o.H2O.h + 8}px`; a.hop.style.opacity = r3(tien(t, m.a_hop, 0.3))
    // COO (từ COOH) + Na (từ NaOH) bay vào ô COONa đúng lúc Thầy viết COONa
    const vC = eInOut(tien(t, m.a_gCN - 0.5, 0.6)), vN = eInOut(tien(t, m.a_gCN3 - 0.5, 0.6))
    datXY(a.bayCOO, lerp(o.C.x, o.COONa.x, vC), lerp(o.C.y, o.COONa.y, vC) - 70 * Math.sin(Math.PI * vC)); a.bayCOO.style.opacity = r3(tien(t, m.a_gCN - 0.5, 0.1) * (1 - tien(t, m.a_gCN + 0.15, 0.2)))
    datXY(a.bayNa, lerp(o.Na.x, o.CN_Na.x, vN), lerp(o.Na.y, o.CN_Na.y, vN) - 50 * Math.sin(Math.PI * vN)); a.bayNa.style.opacity = r3(tien(t, m.a_gCN3 - 0.5, 0.1) * (1 - tien(t, m.a_gCN3 + 0.15, 0.2)))
  }
  g.H2O.classList.toggle('sang', xongNuoc && !tom); g.COONa.classList.toggle('sang', xongMuoi && !tom)
  datXY(a.tom, 0, 330); xuat(a.tom, t, m.a_tom)
}

const vao2 = (t, t0, d = 0.6) => eInOut(tien(t, t0, d))
const nhay = (t, t0) => (t >= t0 ? 1 + 0.28 * ex(-(t - t0) * 5) : 1)
function veBazoBC(Z, m, t) {
  const Y = 20, bw = Z.bw, gap = Z.gap, giua = Z.giua, W = Z.W
  const tKhoi = [m.b_gly1, m.b_ala, m.b_gly2], tach = vao2(t, m.c_can + 0.6), cat = m.d_cat != null ? vao2(t, m.d_cat, 0.7) : 0, dx = (i) => (i - 1) * (14 * tach + 34 * cat)
  Z.khoi.forEach((e, i) => { const p = lo(t - tKhoi[i], 2.2, 0.55); datXY(e, 14 + i * (bw + gap), Y); e.style.opacity = r3(kep(p * 1.5)); e.style.transform = `translateX(${r3(dx(i))}px) scale(${r3(0.6 + 0.4 * kep(p, 0, 1.2))})` })
  // liên kết: sáng khi «cần 2 nước» · đứt khi nước vào
  const sangLk = m.b_canNuoc != null && t >= m.b_canNuoc && t < m.c_can
  Z.lk.forEach((e, i) => { const v = tien(t, tKhoi[i + 1], 0.3), dut = tien(t, m.c_can + 0.45 + i * 0.12, 0.2); e.style.top = `${Y + 45}px`; e.style.opacity = r3(v * (1 - dut)); e.style.transform = `scaleX(${r3(v * (1 - dut))})`; e.classList.toggle('sang', sangLk) })
  // chỗ chờ nước (giọt rỗng) trên hai liên kết từ lúc «cần 2 nước» — tới lúc nước thật rơi vào
  Z.bongCan.forEach((e, i) => { datXY(e, 14 + bw + i * (bw + gap) + gap / 2 - 25, Y + 16); e.style.opacity = r3(m.b_canNuoc == null ? 0 : tien(t, m.b_canNuoc + i * 0.15, 0.3) * (1 - tien(t, m.c_can, 0.25)) * (0.55 + 0.45 * Math.abs(Math.sin((t - m.b_canNuoc) * 2.4)))) })
  // ô COOH dưới mỗi mắt xích: hiện khi Thầy nói / viết «đếm đầu C», sáng lần lượt theo «Gly… Ala… Gly…»; H rời đi, Na vào ⇒ COONa ngay trong ô
  const tDem = [m.b_c1, m.b_c2, m.b_c3]
  Z.dauC.forEach((e, i) => {
    const p = lo(t - m.b_dem - i * 0.15, 2.2, 0.55), nay = t >= tDem[i], doi = vao2(t, m.c_sinh + i * 0.16, 0.5)
    datXY(e, giua(i) - 62, Y + 140); e.style.opacity = r3(kep(p * 1.5)); e.classList.toggle('sang', nay)
    e.classList.toggle('vong', m.b_banChat != null && i === 0 && t >= m.b_banChat && t < m.b_an)
    e.style.transform = `translateX(${r3(dx(i))}px) scale(${r3(nay ? nhay(t, tDem[i]) : 0.7 + 0.3 * kep(p, 0, 1.2))})`
    const h = e.querySelector('.g2'), na = e.querySelector('.g3'); h.style.opacity = r3(1 - doi); h.style.transform = `translateY(${r3(-22 * doi)}px)`; na.style.opacity = r3(doi); na.style.transform = `translateY(${r3(18 * (1 - doi))}px)`
  })
  Z.soC.forEach((e, i) => { const p = lo(t - tDem[i], 2.4, 0.5); datXY(e, giua(i) + 50, Y + 122); e.style.opacity = r3(kep(p * 1.5)); e.style.transform = `translateX(${r3(dx(i))}px) scale(${r3(0.4 + 0.6 * kep(p, 0, 1.2))})` })
  // HCl ✕ ⇒ NaOH (thẻ ký hiệu, không câu chữ) · «tổng là 3» ⇒ số 3 bay vào thành NaOH × 3 · «ăn được 3» ⇒ NaOH × 3 tách thành 3 thẻ gắn vào 3 đầu C
  const yChip = Y + 262, xHcl = W / 2 - 250, xNaoh = W / 2 + 40
  datXY(Z.chipHcl, xHcl, yChip); Z.chipHcl.style.opacity = r3(m.b_hcl == null ? 0 : tien(t, m.b_hcl - 0.6, 0.3) * (1 - tien(t, m.b_hcl + 1.4, 0.5))); Z.chipHcl.classList.toggle('gach', m.b_hcl != null && t >= m.b_hcl)
  Z.chipHcl.style.transform = `translateY(${r3(m.b_hcl == null ? 0 : 30 * tien(t, m.b_hcl + 1.4, 0.5))}px)`
  const tN = m.b_hcl ?? m.b_dem, tachRa = vao2(t, m.b_an, 0.6)
  datXY(Z.chipNaoh, xNaoh, yChip); Z.chipNaoh.style.opacity = r3(tien(t, tN, 0.3) * (1 - tien(t, m.b_an + 0.1, 0.25))); Z.chipNaoh.style.transform = `scale(${r3(nhay(t, tN) * (t >= m.b_tong + 0.6 ? nhay(t, m.b_tong + 0.6) : 1))})`
  Z.chipNaoh.querySelector('.x').style.opacity = r3(tien(t, m.b_tong + 0.6, 0.2))
  const bay3 = vao2(t, m.b_tong, 0.6); datXY(Z.ba, lerp(W / 2 - 40, xNaoh + 150, bay3), lerp(Y + 196, yChip - 10, bay3)); Z.ba.style.opacity = r3(tien(t, m.b_tong - 0.1, 0.2) * (1 - tien(t, m.b_tong + 0.55, 0.1)))
  Z.ba.style.transform = `scale(${r3(lerp(1.6, 0.6, bay3))})`
  Z.naohT.forEach((e, i) => { const t0 = m.b_an + i * 0.18, p = vao2(t, t0, 0.6), nhap = vao2(t, m.c_sinh + i * 0.16, 0.45); datXY(e, lerp(xNaoh + 10, giua(i) - 50 + dx(i), p), lerp(yChip + 6, Y + 192, p) - 34 * nhap); e.style.opacity = r3(tien(t, t0 - 0.05, 0.1) * (1 - nhap)); e.style.transform = `scale(${r3(1 - 0.4 * nhap)})` })
  // NƯỚC: sinh 3 (mỗi đầu C + NaOH bật ra một giọt) ⇒ gom bên phải «+ 3» · cần 2 (giọt vào hai liên kết, liên kết đứt) ⇒ gom bên trái «− 2»
  //       ⇒ hai cặp chập nhau, tan · giọt thứ ba còn lại ra giữa
  const yNhom = Y + 400, xTrai = (j) => 90 + j * 66, xPhai = (j) => W - 250 + j * 66
  const triet = tien(t, m.c_triet + 0.3, 0.7), tan = tien(t, m.c_triet + 1.0, 0.35)
  Z.giotSinh.forEach((e, i) => {
    const t0 = m.c_sinh + i * 0.16, len = lo(t - t0, 2.4, 0.5), gom = vao2(t, (m.c_sinhHop ?? m.c_sinh + 1.0) + i * 0.1, 0.7), ra = i === 2 ? vao2(t, m.c_con, 0.8) : 0
    let x = lerp(giua(i) + 62 + dx(i), xPhai(i), gom), y = lerp(Y + 150 - 18 * kep(len), yNhom, gom)
    if (i < 2) { x = lerp(x, xTrai(i) + 30, triet); y = lerp(y, yNhom, triet) }
    else { x = lerp(x, W / 2 - 25, ra); y = lerp(y, yNhom - 10, ra) }
    datXY(e, x, y); e.style.transform = `scale(${r3((0.3 + 0.7 * kep(len, 0, 1.2)) * (i === 2 ? 1 + 0.6 * ra : 1))})`
    e.style.opacity = r3(tien(t, t0, 0.12) * (i < 2 ? 1 - tan : 1)); e.classList.toggle('sang', i === 2 && t >= m.c_con)
  })
  Z.giotCan.forEach((e, i) => {
    const t0 = m.c_can + i * 0.12, roi = vao2(t, t0, 0.5), gom = vao2(t, m.c_can + 1.1 + i * 0.1, 0.7)
    datXY(e, lerp(14 + bw + i * (bw + gap) + gap / 2 - 25, xTrai(i), gom), lerp(lerp(-60, Y + 16, roi), yNhom, gom)); e.style.opacity = r3(tien(t, t0, 0.12) * (1 - tan))
  })
  Z.poof.forEach((e, i) => { const p = tien(t, m.c_triet + 0.95, 0.5); datXY(e, xTrai(i) - 10, yNhom - 6); e.style.opacity = r3(p > 0 && p < 1 ? 1 - p : 0); e.style.transform = `scale(${r3(0.5 + 1.2 * p)})` })
  datXY(Z.tagCong, xPhai(0) + 40, yNhom - 56); Z.tagCong.style.opacity = r3(tien(t, (m.c_sinhHop ?? m.c_sinh + 1) + 0.6, 0.3) * (1 - tan))
  datXY(Z.tagTru, xTrai(0) + 40, yNhom - 56); Z.tagTru.style.opacity = r3(tien(t, m.c_can + 1.6, 0.3) * (1 - tan))
  datXY(Z.chipNuoc, W / 2 - 52, yNhom + 76); Z.chipNuoc.style.opacity = r3(tien(t, m.c_con + 0.6, 0.3)); Z.chipNuoc.classList.toggle('sang', m.c_dung != null && t >= m.c_dung && t < m.c_dung + 2.4)
}

/** Ô chữ của sân D (đo một lần khi đã hiện + phông đã nạp): chỗ H trong công thức, các số trong phép tính. */
function oD(Z) {
  if (Z.oD2) return Z.oD2
  const d = Z.dd
  if (!d.hang.offsetWidth || !d.m.offsetWidth || (document.fonts && document.fonts.status !== 'loaded')) return null
  // toạ độ trong sân D: cộng dồn offsetLeft / offsetTop theo chuỗi offsetParent tới sân D
  const vt = (e) => { let x = 0, y = 0; while (e && e !== Z.D) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent } return { x, y } }
  const iM = d.m.querySelectorAll('i')
  Z.oD2 = { H: vt(d.hang.lastChild), tru: vt(iM[1]), cong: vt(iM[2]), gop: vt(iM[4]), sau75: vt(iM[1]) }
  return Z.oD2
}
function veBazoD(Z, m, t) {
  const d = Z.dd, Y = 20, X = 30
  // khối Gly của chuỗi ⇒ phóng thành công thức của nó (biến đổi liền mạch, không tắt rồi hiện)
  const moc = vao2(t, m.d_hien - 0.3, 0.8)
  datXY(d.gly, lerp(14, X + 90, moc), Y); d.gly.style.opacity = r3(1 - tien(t, m.d_hien - 0.15, 0.3)); d.gly.style.transform = `scale(${r3(lerp(1, 1.25, moc))})`
  datXY(d.hang, X, Y); d.hang.style.opacity = r3(tien(t, m.d_hien + 0.15, 0.4)); d.hang.style.transform = `scale(${r3(lerp(0.7, 1, tien(t, m.d_hien + 0.1, 0.5)))})`
  datXY(d.m, 0, Y + 220); datXY(d.ala, 0, Y + 400)
  const oH = d.hang.lastChild, o = oD(Z)
  const ra = eOut(tien(t, m.d_na, 0.6)), vao = vao2(t, m.d_na + 0.45, 0.7), daGan = vao >= 1
  oH.textContent = daGan ? 'Na' : 'H'; oH.className = `bz-g ${daGan ? 'na' : 'h'}`; oH.classList.toggle('sang', daGan || (t >= m.d_na && ra < 0.05)); oH.style.visibility = t >= m.d_na && !daGan ? 'hidden' : ''
  // phép tính: 75 · (+ 23 ngay ⇒ sai, rơi) · − 1 bay từ chỗ H rời · + 23 bay từ chỗ Na đến · − 1 + 23 chập thành + 22 · = 97
  d.m.style.opacity = r3(tien(t, (m.d_mHien ?? m.d_75) - 0.25, 0.3))
  const iM = d.m.querySelectorAll('i'), hienSo = (e, t0) => { const p = lo(t - t0, 2.4, 0.5); e.style.opacity = r3(kep(p * 1.4)); e.style.transform = `translateY(${r3((1 - p) * 14)}px)` }
  hienSo(iM[0], m.d_75); hienSo(iM[3], m.d_22 - 0.5)
  if (o) {
    datXY(d.h, o.H.x + ra * 70, o.H.y - ra * 34); d.h.style.opacity = r3(tien(t, m.d_na, 0.05) * (1 - tien(t, m.d_na + 0.9, 0.3)))
    datXY(d.na, lerp(Z.W - 90, o.H.x, vao), lerp(o.H.y + 40, o.H.y, vao) - 36 * Math.sin(Math.PI * vao)); d.na.style.opacity = r3(tien(t, m.d_na + 0.4, 0.2) * (daGan ? 0 : 1))
    const bay = (e, t0, tu, den) => { const p = vao2(t, t0 + 0.35, 0.7); datXY(e, lerp(tu.x, den.x, p), lerp(tu.y, den.y, p) - 40 * Math.sin(Math.PI * p)); e.style.opacity = r3(tien(t, t0, 0.2) * (1 - tien(t, t0 + 1.05, 0.05))); e.style.transform = `scale(${r3(nhay(t, t0))})` }
    bay(d.soTru, m.d_tru1, { x: o.H.x + 20, y: o.H.y - 50 }, o.tru); bay(d.soCong, m.d_cong23, { x: o.H.x + 10, y: o.H.y + 30 }, o.cong)
    iM[1].style.opacity = r3(tien(t, m.d_tru1 + 1.05, 0.05)); iM[2].style.opacity = r3(tien(t, m.d_cong23 + 1.05, 0.05))
    if (m.d_khong != null) { const p = vao2(t, m.d_khong, 0.5), roi = tien(t, m.d_khong + 1.3, 0.6); datXY(d.sai, lerp(Z.W - 160, o.sau75.x, p), o.sau75.y + roi * 60); d.sai.style.opacity = r3(tien(t, m.d_khong, 0.2) * (1 - roi)); d.sai.classList.toggle('gach', t >= m.d_khong + 0.7); d.sai.style.transform = `translateX(${r3(t >= m.d_khong + 0.5 && t < m.d_khong + 1.1 ? Math.sin((t - m.d_khong) * 40) * 6 : 0)}px)` }
    // − 1 và + 23 chập lại thành + 22 (hai bản sao bay xuống ô + 22 rồi tan vào nó)
    const chap = vao2(t, m.d_22 - 0.4, 0.7)
    for (const [e, tu] of [[d.g1, o.tru], [d.g2, o.cong]]) { datXY(e, lerp(tu.x, o.gop.x, chap), lerp(tu.y, o.gop.y, chap)); e.style.opacity = r3(chap > 0 && chap < 1 ? 1 : 0) }
  }
  iM[4].style.opacity = r3(tien(t, m.d_22 + 0.3, 0.2)); iM[4].style.transform = `scale(${r3(nhay(t, m.d_22 + 0.3))})`
  hienSo(iM[5], m.d_22 + 1.1)
  d.ala.style.opacity = r3(tien(t, m.d_ala - 0.25, 0.3))
  const iA = d.ala.querySelectorAll('i'); hienSo(iA[0], m.d_ala89); hienSo(iA[1], m.d_ala22); hienSo(iA[2], m.d_ala22 + 0.7)
}
Object.assign(HOAT, { bazo: [dungBazo, veBazo] })
