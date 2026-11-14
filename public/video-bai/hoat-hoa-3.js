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
  // ── phương trình tổng: 2 hàng, mỗi vế giữ sẵn chỗ (không xô chữ khi hiện) ──
  const pt = E('bz-pt', ''), h1 = E('bz-h', '', pt), h2 = E('bz-h', '', pt)
  const o = (h, k, html) => E(`bz-o ${k}`, html, h)
  const P = {
    pep: o(h1, 'pep', '<b>Gly-Ala-Gly</b> <span class="hs">: a</span>'), cong1: o(h1, 'dau', '+'), naoh: o(h1, 'naoh', '<b>NaOH</b> <span class="hs">: <em>3a</em></span>'),
    mui: o(h1, 'dau mui', '→'),
    glyna: o(h2, 'glyna', '<b>Gly-Na</b> : 2a'), cong2: o(h2, 'dau', '+'), alana: o(h2, 'alana', '<b>Ala-Na</b> : a'), cong3: o(h2, 'dau', '+'), nuoc: o(h2, 'nuoc', '<b>H₂O</b> : <em>a</em>'),
  }
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
  // ── B + C: chuỗi Gly - Ala - Gly · đầu C · NaOH · nước ──
  const BC = E('bz-san', '')
  const ten = ['Gly', 'Ala', 'Gly'], bw = 196, gap = (W - 28 - 3 * bw) / 2, giua = (i) => 14 + i * (bw + gap) + bw / 2
  const khoi = ten.map((t2) => E('bz-k', `<b>${t2}</b>`, BC))
  const lk = [0, 1].map((i) => { const e = E('bz-lk', '', BC); e.style.left = `${Math.round(14 + bw + i * (bw + gap))}px`; e.style.width = `${Math.round(gap)}px`; return e })
  const dauC = ten.map(() => E('bz-dc', 'COOH', BC))
  const soC = ten.map((_, i) => E('bz-so', String(i + 1), BC))
  const naohT = ten.map(() => E('bz-tag', '+ NaOH', BC))
  const demC = E('bz-dem', '<span>Đếm đầu C</span><i>1</i><i>+ 1</i><i>+ 1</i><i>= 3</i><i>⇒ NaOH : <em>3a</em></i>', BC)
  const giotCan = [0, 1].map(() => E('bz-giot nho', 'H₂O', BC)), giotSinh = [0, 1, 2].map(() => E('bz-giot nho', 'H₂O', BC))
  const can = E('bz-hop trai', '<span>Cắt 2 liên kết, cần</span><b>2 H₂O</b>', BC), sinh = E('bz-hop phai', '<span>3 đầu C sinh</span><b>3 H₂O</b>', BC)
  const triet = E('bz-triet', '3 − 2: <b>triệt tiêu 2 nước</b>', BC), con = E('bz-con', 'Chỉ còn <b>1 H₂O</b> ⇒ <em>H₂O : a</em>', BC)
  // các ý Thầy giảng thêm (lời nguyên văn): 2 liên kết cần 2 nước · không cộng HCl mà cộng NaOH · quy luật 1 COOH ăn 1 NaOH
  const nhLk = E('bz-nh vang', '2 liên kết ⇒ cần <b>2 H₂O</b>', BC), nhDoi = E('bz-nh xanh', '<s>HCl: đếm N</s> ⇒ <b>NaOH: đếm đầu C</b>', BC)
  const banChat = E('bz-tom nho', 'Quy luật: <b>1 COOH</b> ăn <b>1 NaOH</b>, sinh <b>1 H₂O</b>', BC)
  // ── D: muối + M ──
  const D = E('bz-san', '')
  const dd = {
    hang: E('bz-hangD', '<span class="bz-g">H₂N-CH₂-COO</span><span class="bz-g h">H</span>', D), h: E('bz-bay h vua', 'H', D), na: E('bz-bay na vua', 'Na', D), tenM: E('bz-nh vang', 'Gly ⇒ <b>Gly-Na</b>', D),
    tru: E('bz-nh hong', 'mất 1 H: <b>− 1</b>', D), cong: E('bz-nh xanh', 'thêm Na: <b>+ 23</b>', D), khong: E('bz-nh hong', 'không phải <s>+ 23</s> ngay', D),
    m: E('bz-m', '<span>Gly-Na</span><i>M = 75</i><i>− 1</i><i>+ 23</i><i>= 75 + <em>22</em></i><i>= 97</i>', D),
    ala: E('bz-m ala', '<span>Ala-Na</span><i>M = 89</i><i>+ <em>22</em></i><i>= 111</i>', D),
  }
  d.bz = { pt, P, A, a, BC, khoi, lk, dauC, soC, naohT, demC, giotCan, giotSinh, can, sinh, triet, con, nhLk, nhDoi, banChat, D, dd, bw, gap, W, giua }
  // TIA LẤP LÁNH đúng khoảnh khắc (khung.js vẽ theo moc + trễ): nước thành · Na gắn · đếm 1-2-3 · tổng 3 · NaOH gắn · còn 1 nước · M = 97 · 111
  const iDem = demC.querySelectorAll('i'), iM = dd.m.querySelectorAll('i'), iAla = dd.ala.querySelectorAll('i'), NUOC = '#8fd8ee', VANG = '#ffd27a'
  d.lap = [
    { k: 'a_nuoc', e: g.H2O, mau: NUOC, n: 14 }, { k: 'a_coona', e: g.COONa, mau: VANG },
    { k: 'b_c1', e: dauC[0] }, { k: 'b_c2', e: dauC[1] }, { k: 'b_c3', e: dauC[2] }, { k: 'b_tong', e: iDem[3], mau: VANG, n: 16 },
    ...naohT.map((e, i) => ({ k: 'b_3a', tre: 0.6 + i * 0.18, e, mau: '#8fb6ff', n: 8 })),
    { k: 'c_con', tre: 0.5, e: giotSinh[2], mau: NUOC, n: 14 }, { k: 'd_na', tre: 1.15, e: dd.na, mau: '#8fb6ff' },
    { k: 'd_22', e: iM[3], mau: VANG, n: 16 }, { k: 'd_22', tre: 1.1, e: iM[4], mau: VANG }, { k: 'd_ala22', tre: 0.7, e: iAla[2], mau: VANG, n: 16 },
    { k: 'pt_naoh', e: P.naoh, n: 10 }, { k: 'pt_nuoc', e: P.nuoc, n: 10 }, { k: 'pt_glyna', e: P.glyna, n: 10 }, { k: 'pt_alana', e: P.alana, n: 10 },
  ]
  d.hoatNeo = {
    'pt-pep': P.pep, 'pt-naoh': P.naoh, 'pt-3a': P.naoh.querySelector('em'), 'pt-mui': P.mui, 'pt-nuoc': P.nuoc, 'pt-glyna': P.glyna, 'pt-alana': P.alana,
    'a-cooh': g.C, 'a-h': g.H, 'a-oh': g.OH, 'a-nuoc': g.H2O, 'a-coona': g.COONa, 'b-dc1': dauC[1], 'b-dc2': dauC[2], 'd-cong': dd.cong, 'b-banchat': banChat, 'b-dc': dauC[0], 'd-tru': dd.tru, 'd-m': dd.m, 'd-ala': dd.ala,
  }
}

function veBazo(d, t) {
  const m = d.hoat.moc, Z = d.bz, P = Z.P
  // phương trình tổng: vế hiện đúng lúc Thầy viết; dấu "+" đi cùng vế sau nó; vế mới viết sáng viền 1,6 s
  xuat(Z.pt, t, m.pt_pep - 0.5, 10, 0.97); Z.pt.classList.toggle('sang', m.c_dung != null && t >= m.c_dung && t < m.c_dung + 2.6)
  const ve = [[P.pep, m.pt_pep], [P.cong1, m.pt_naoh], [P.naoh, m.pt_naoh], [P.mui, m.pt_mui], [P.nuoc, m.pt_nuoc], [P.cong3, m.pt_nuoc], [P.glyna, m.pt_glyna], [P.cong2, m.pt_alana], [P.alana, m.pt_alana]]
  for (const [e, t0] of ve) { xuat(e, t, t0, 14); e.classList.toggle('moi', t >= t0 && t < t0 + 1.6) }
  P.pep.querySelector('.hs').style.opacity = r3(tien(t, m.pt_a, 0.3)); P.naoh.querySelector('.hs').style.opacity = r3(tien(t, m.b_3a, 0.3))
  // ba sân nối nhau: A tới lúc Thầy viết peptide · B + C tới lúc Thầy nói Gly-Na · D sau đó
  const vA = 1 - tien(t, m.b_hien - 0.4, 0.45), vBC = tien(t, m.b_hien - 0.35, 0.4) * (1 - tien(t, m.d_hien - 0.4, 0.4)), vD = tien(t, m.d_hien - 0.35, 0.4)
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

function veBazoBC(Z, m, t) {
  const Y = 18, bw = Z.bw, gap = Z.gap, giua = Z.giua
  const tKhoi = [m.b_gly1, m.b_ala, m.b_gly2], tach = eInOut(tien(t, m.c_can + 0.6, 0.6)), cat = m.d_cat != null ? eInOut(tien(t, m.d_cat, 0.7)) : 0, dx = (i) => (i - 1) * (14 * tach + 34 * cat)
  Z.khoi.forEach((e, i) => { const p = lo(t - tKhoi[i], 2.2, 0.55); datXY(e, 14 + i * (bw + gap), Y); e.style.opacity = r3(kep(p * 1.5)); e.style.transform = `translateX(${r3(dx(i))}px) scale(${r3(0.6 + 0.4 * kep(p, 0, 1.2))})` })
  // liên kết peptide: hiện khi mắt xích sau vào · đứt khi nước rơi vào (cần 2 nước)
  Z.lk.forEach((e, i) => { const v = tien(t, tKhoi[i + 1], 0.3), dut = tien(t, m.c_can + 0.45 + i * 0.12, 0.2); e.style.top = `${Y + 45}px`; e.style.opacity = r3(v * (1 - dut)); e.style.transform = `scaleX(${r3(v * (1 - dut))}) scaleY(${r3(m.b_canNuoc != null && t >= m.b_canNuoc && t < m.b_canNuoc + 2 ? 1.8 - 0.8 * tien(t, m.b_canNuoc + 1.2, 0.8) : 1)})`; e.classList.toggle('sang', m.b_canNuoc != null && t >= m.b_canNuoc && t < m.b_canNuoc + 2.6) })
  // đầu C (COOH) của mỗi mắt xích: hiện khi Thầy viết "(đếm COOH)", sáng lần lượt theo lời "Gly… Ala… Gly…"
  const tDem = [m.b_c1, m.b_c2, m.b_c3]
  Z.dauC.forEach((e, i) => {
    const p = lo(t - m.b_dem - i * 0.15, 2.2, 0.55), nay = t >= tDem[i]
    datXY(e, giua(i) - 60, Y + 132); e.style.opacity = r3(kep(p * 1.5)); e.classList.toggle('sang', nay)
    e.style.transform = `translateX(${r3(dx(i))}px) scale(${r3(nay ? 1 + 0.3 * ex(-(t - tDem[i]) * 5) : 0.7 + 0.3 * kep(p, 0, 1.2))})`
    e.textContent = t >= m.c_sinh + 0.7 ? 'COONa' : 'COOH'
  })
  Z.soC.forEach((e, i) => { const p = lo(t - tDem[i], 2.4, 0.5); datXY(e, giua(i) + 56, Y + 112); e.style.opacity = r3(kep(p * 1.5)); e.style.transform = `translateX(${r3(dx(i))}px) scale(${r3(0.4 + 0.6 * kep(p, 0, 1.2))})` })
  // NaOH bay vào gắn từng đầu C khi Thầy viết ": 3a"
  Z.naohT.forEach((e, i) => { const t0 = (m.b_an ?? m.b_3a) + i * 0.18, p = eInOut(tien(t, t0, 0.6)); datXY(e, lerp(Z.W + 20, giua(i) - 58 + dx(i), p), Y + 192); e.style.opacity = r3(tien(t, t0, 0.12)) })
  const dem = Z.demC; dem.style.top = `${Y + 254}px`; dem.style.opacity = r3(tien(t, m.b_c1 - 0.25, 0.3))
  const tI = [tDem[0], tDem[1], tDem[2], m.b_tong, m.b_3a + 0.4]
  dem.querySelectorAll('i').forEach((e, i) => { const p = lo(t - tI[i], 2.4, 0.5); e.style.opacity = r3(kep(p * 1.4)); e.style.transform = `translateY(${r3((1 - p) * 14)}px)` })
  dem.classList.toggle('xong', t >= m.b_3a + 0.4)
  // NƯỚC — cần 2: hai giọt rơi vào hai liên kết, liên kết đứt · sinh 3: mỗi đầu C + NaOH bật ra một giọt · triệt tiêu 2 cặp ⇒ còn 1
  const mat = tien(t, m.c_triet + 0.5, 0.35)
  const hopX = (trai, j, n) => (trai ? 14 : Z.W / 2 + 6) + 394 - 16 - (n - j) * 54, hopY = Y + 338
  Z.giotCan.forEach((e, i) => {
    const t0 = m.c_can + i * 0.12, roi = eInOut(tien(t, t0, 0.5)), vao = eInOut(tien(t, m.c_can + 1.1 + i * 0.1, 0.7))
    datXY(e, lerp(14 + bw + i * (bw + gap) + gap / 2 - 25, hopX(true, i, 2), vao), lerp(lerp(-70, Y + 16, roi), hopY, vao))
    e.style.opacity = r3(tien(t, t0, 0.12) * (1 - mat)); e.classList.toggle('gach', t >= m.c_triet)
  })
  Z.giotSinh.forEach((e, i) => {
    const t0 = m.c_sinh + i * 0.16, len = lo(t - t0, 2.4, 0.5), vao = eInOut(tien(t, (m.c_sinhHop ?? m.c_sinh + 1.0) + i * 0.1, 0.7))
    datXY(e, lerp(giua(i) + 62 + dx(i), hopX(false, i, 3), vao), lerp(Y + 150 - 18 * kep(len), hopY, vao)); e.style.transform = `scale(${r3(0.3 + 0.7 * kep(len, 0, 1.2) + (i === 2 && t >= m.c_con ? 0.25 * ex(-(t - m.c_con) * 3) : 0))})`
    e.style.opacity = r3(tien(t, t0, 0.12) * (i < 2 ? 1 - mat : 1)); e.classList.toggle('gach', i < 2 && t >= m.c_triet); e.classList.toggle('sang', i === 2 && t >= m.c_con)
  })
  datXY(Z.can, 14, Y + 328); xuat(Z.can, t, m.c_can + 0.2); Z.can.classList.toggle('gach', t >= m.c_trai)
  datXY(Z.sinh, Z.W / 2 + 6, Y + 328); xuat(Z.sinh, t, (m.c_sinhHop ?? m.c_sinh + 0.4) - 0.2); Z.sinh.querySelector('b').textContent = t >= m.c_con ? '1 H₂O' : '3 H₂O'; Z.sinh.classList.toggle('sang', t >= m.c_con)
  datXY(Z.triet, 14, Y + 430); xuat(Z.triet, t, m.c_triet); tat(Z.triet, t, m.c_con)
  datXY(Z.con, 14, Y + 430); xuat(Z.con, t, m.c_con + 0.5)
  if (m.b_canNuoc != null) { datXY(Z.nhLk, Z.W / 2 - 170, Y + 136); xuat(Z.nhLk, t, m.b_canNuoc); tat(Z.nhLk, t, m.b_dem - 0.3) } else Z.nhLk.style.opacity = 0
  if (m.b_hcl != null) { datXY(Z.nhDoi, 14, Y + 254); xuat(Z.nhDoi, t, m.b_hcl); tat(Z.nhDoi, t, m.b_c1 - 0.5) } else Z.nhDoi.style.opacity = 0
  if (m.b_banChat != null) { datXY(Z.banChat, 0, Y + 330); xuat(Z.banChat, t, m.b_banChat); tat(Z.banChat, t, (m.c_sinhHop ?? m.c_sinh) - 0.5) } else Z.banChat.style.opacity = 0
}

function veBazoD(Z, m, t) {
  const d = Z.dd, Y = 30, X = 30
  // Gly: H của nhóm COOH bật ra (− 1), Na bay vào ĐÚNG ô của H (+ 23) ⇒ Gly-Na. Ô H đo từ dòng chữ (một lần, khi đã hiện + phông đã nạp).
  datXY(d.hang, X, Y); xuat(d.hang, t, m.d_hien)
  const oH = d.hang.lastChild
  if (!Z.oD && d.hang.offsetWidth && (!document.fonts || document.fonts.status === 'loaded')) Z.oD = { x: d.hang.offsetLeft + oH.offsetLeft, y: d.hang.offsetTop + oH.offsetTop }
  const ra = eOut(tien(t, m.d_na, 0.6)), vao = eInOut(tien(t, m.d_na + 0.45, 0.7)), daGan = vao >= 1
  oH.textContent = daGan ? 'Na' : 'H'; oH.className = `bz-g ${daGan ? 'na' : 'h'}`; oH.classList.toggle('sang', daGan || (t >= m.d_na && ra < 0.05))
  oH.style.visibility = t >= m.d_na && !daGan ? 'hidden' : ''
  if (Z.oD) {
    datXY(d.h, Z.oD.x + ra * 70, Z.oD.y - ra * 34); d.h.style.opacity = r3(tien(t, m.d_na, 0.05) * (1 - tien(t, m.d_na + 0.9, 0.3)))
    datXY(d.na, lerp(Z.W - 90, Z.oD.x, vao), lerp(Z.oD.y + 40, Z.oD.y, vao) - 36 * Math.sin(Math.PI * vao)); d.na.style.opacity = r3(tien(t, m.d_na + 0.4, 0.2) * (daGan ? 0 : 1))
  }
  datXY(d.tenM, X, Y + 84); xuat(d.tenM, t, m.d_coona)
  datXY(d.tru, X, Y + 150); xuat(d.tru, t, m.d_tru1)
  datXY(d.cong, X + 330, Y + 150); xuat(d.cong, t, m.d_cong23)
  datXY(d.m, 0, Y + 236); d.m.style.opacity = r3(tien(t, (m.d_mHien ?? m.d_75) - 0.25, 0.3))
  if (m.d_khong != null) { datXY(d.khong, X + 330, Y + 150); xuat(d.khong, t, m.d_khong); tat(d.khong, t, m.d_tru1 - 0.2) } else d.khong.style.opacity = 0
  const tm = [m.d_75, m.d_tru1, m.d_cong23, m.d_22, m.d_22 + 1.1]
  d.m.querySelectorAll('i').forEach((e, i) => { const p = lo(t - tm[i], 2.4, 0.5); e.style.opacity = r3(kep(p * 1.4)); e.style.transform = `translateY(${r3((1 - p) * 14)}px) scale(${r3(i === 3 && t >= tm[3] ? 1 + 0.25 * ex(-(t - tm[3]) * 3) : 1)})` })
  datXY(d.ala, 0, Y + 356); d.ala.style.opacity = r3(tien(t, m.d_ala - 0.25, 0.3))
  const ta = [m.d_ala89, m.d_ala22, m.d_ala22 + 0.7]
  d.ala.querySelectorAll('i').forEach((e, i) => { const p = lo(t - ta[i], 2.4, 0.5); e.style.opacity = r3(kep(p * 1.4)); e.style.transform = `translateY(${r3((1 - p) * 14)}px)` })
}
Object.assign(HOAT, { bazo: [dungBazo, veBazo] })
