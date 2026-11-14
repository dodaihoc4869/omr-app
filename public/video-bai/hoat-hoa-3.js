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
  // ── A: cơ chế COOH + NaOH ──
  const A = E('bz-san', ''); A.style.top = '24px'
  const svgA = svgEl('svg', { width: W, height: 500, viewBox: `0 0 ${W} 500`, class: 'bz-svg' }, A)
  const cung = svgEl('path', { fill: 'none', stroke: '#fda4af', 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, svgA)
  const muiCung = svgEl('path', { d: 'M -16 -10 L 2 0 L -16 10', fill: 'none', stroke: '#fda4af', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, svgA)
  const a = {
    cooR: E('bz-f', '-COO', A), cooH: E('bz-f h', 'H', A), na: E('bz-f na', 'Na', A), oh: E('bz-f oh', 'OH', A),
    nhC: E('bz-nh', 'nhóm <b>COOH</b> ở <b>đầu C</b>', A), nhAcid: E('bz-nh hong', 'acid: <b>nhường H⁺</b>', A), nhBase: E('bz-nh xanh', 'base: <b>nhận H⁺</b>', A),
    nuoc: E('bz-giot lon', 'H₂O', A), nhNuoc: E('bz-nh nuoc', 'thành <b>1 nước</b>', A), nhCoona: E('bz-nh vang', 'còn lại gộp: <b>COONa</b>', A),
    tom: E('bz-tom', '1 COOH + 1 NaOH → <b>COONa + H₂O</b>', A), cung, muiCung,
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
  // ── D: muối + M ──
  const D = E('bz-san', '')
  const dd = {
    goc: E('bz-f vua', 'H₂N-CH₂-COO', D), h: E('bz-f vua h', 'H', D), na: E('bz-f vua na', 'Na', D), tenM: E('bz-nh vang', 'Gly ⇒ <b>Gly-Na</b>', D),
    tru: E('bz-nh hong', 'mất 1 H: <b>− 1</b>', D), cong: E('bz-nh xanh', 'thêm Na: <b>+ 23</b>', D),
    m: E('bz-m', '<span>Gly-Na</span><i>M = 75</i><i>− 1</i><i>+ 23</i><i>= 75 + <em>22</em></i><i>= 97</i>', D),
    ala: E('bz-m ala', '<span>Ala-Na</span><i>M = 89</i><i>+ <em>22</em></i><i>= 111</i>', D),
  }
  d.bz = { pt, P, A, a, BC, khoi, lk, dauC, soC, naohT, demC, giotCan, giotSinh, can, sinh, triet, con, D, dd, bw, gap, W, giua }
  d.hoatNeo = {
    'pt-pep': P.pep, 'pt-naoh': P.naoh, 'pt-3a': P.naoh.querySelector('em'), 'pt-mui': P.mui, 'pt-nuoc': P.nuoc, 'pt-glyna': P.glyna, 'pt-alana': P.alana,
    'a-cooh': a.cooR, 'a-oh': a.oh, 'a-nuoc': a.nuoc, 'a-coona': a.cooR, 'b-dc': dauC[0], 'd-tru': dd.tru, 'd-m': dd.m, 'd-ala': dd.ala,
  }
}

function veBazo(d, t) {
  const m = d.hoat.moc, Z = d.bz, P = Z.P
  // phương trình tổng: vế hiện đúng lúc Thầy viết; dấu "+" đi cùng vế sau nó; vế mới viết sáng viền 1,6 s
  xuat(Z.pt, t, m.pt_pep - 0.5, 10, 0.97)
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

function veBazoA(Z, m, t) {
  const a = Z.a, W = Z.W, Y = 150
  const pC = lo(t - m.a_cooh, 2.2, 0.55), pN = lo(t - m.a_naoh, 2.2, 0.55)
  const bay = eInOut(tien(t, m.a_bay, 1.0)), gop = eInOut(tien(t, m.a_coona, 0.8)), tach = eInOut(tien(t, m.a_base, 0.6))
  if (!Z.wR) { const c0 = a.cooR.innerHTML, n0 = a.na.innerHTML; a.cooR.innerHTML = '-COO'; a.na.innerHTML = 'Na'; Z.wR = a.cooR.offsetWidth - 6; Z.wNa = a.na.offsetWidth - 6; a.cooR.innerHTML = c0; a.na.innerHTML = n0; if (!Z.wR) Z.wR = 0 }
  const xR = 40, wR = Z.wR || 150, xNa = W - 300, xOH = xNa + (Z.wNa || 74) + 44 * tach
  // H của COOH bay theo cung tới OH⁻ (khi Thầy vẽ mũi tên cong trên bảng)
  const hx0 = xR + wR, hx1 = xOH - 40, cx = (hx0 + hx1) / 2, cy = Y - 150
  const bx = (1 - bay) ** 2 * hx0 + 2 * (1 - bay) * bay * cx + bay ** 2 * hx1, by = (1 - bay) ** 2 * Y + 2 * (1 - bay) * bay * cy + bay ** 2 * Y
  // -COO đứng yên; Na⁺ rời OH⁻ (hạ xuống) rồi bay về gắn vào -COO⁻ ⇒ -COONa
  a.cooR.style.opacity = r3(kep(pC * 1.5)); datXY(a.cooR, xR, Y); a.cooR.style.transform = `scale(${r3(0.7 + 0.3 * kep(pC, 0, 1.2))})`
  a.cooR.innerHTML = t >= m.a_coona + 0.8 ? '-COONa' : t >= m.a_acid && gop < 0.6 ? '-COO<sup>−</sup>' : '-COO'
  a.cooR.classList.toggle('sang', t >= m.a_coona + 0.8)
  a.cooH.style.opacity = r3(kep(pC * 1.5) * (1 - tien(t, m.a_nuoc, 0.25))); datXY(a.cooH, bx, by)
  a.cooH.style.transform = `scale(${r3(t >= m.a_acid ? 1 + 0.3 * ex(-(t - m.a_acid) * 3) : 0.7 + 0.3 * kep(pC, 0, 1.2))})`
  a.cooH.innerHTML = t >= m.a_acid ? 'H<sup>+</sup>' : 'H'; a.cooH.classList.toggle('sang', t >= m.a_acid && t < m.a_nuoc)
  const naX = lerp(xNa - 40 * tach, hx0, gop), naY = Y + 150 * tach * (1 - gop)
  a.na.style.opacity = r3(kep(pN * 1.5) * (1 - tien(t, m.a_coona + 0.8, 0.12))); datXY(a.na, naX, naY); a.na.style.transform = `scale(${r3(0.7 + 0.3 * kep(pN, 0, 1.2))})`
  a.na.innerHTML = t >= m.a_base && gop < 0.6 ? 'Na<sup>+</sup>' : 'Na'
  a.oh.style.opacity = r3(kep(pN * 1.5) * (1 - tien(t, m.a_nuoc, 0.25))); datXY(a.oh, xOH, Y); a.oh.style.transform = `scale(${r3(t >= m.a_base ? 1 + 0.3 * ex(-(t - m.a_base) * 3) : 0.7 + 0.3 * kep(pN, 0, 1.2))})`
  a.oh.innerHTML = t >= m.a_base ? 'OH<sup>−</sup>' : 'OH'; a.oh.classList.toggle('sang', t >= m.a_base && t < m.a_nuoc)
  // nhãn theo lời
  datXY(a.nhC, xR - 6, Y + 96); xuat(a.nhC, t, m.a_cooh + 0.6); tat(a.nhC, t, m.a_acid - 0.3)
  datXY(a.nhAcid, xR - 6, Y + 96); xuat(a.nhAcid, t, m.a_acid); tat(a.nhAcid, t, m.a_coona)
  datXY(a.nhBase, W - 236, Y + 96); xuat(a.nhBase, t, m.a_base); tat(a.nhBase, t, m.a_coona)
  // cung mũi tên H → OH (vẽ dần như nét bút)
  const pc = eOut(tien(t, m.a_bay - 0.25, 0.7)), ex1 = xOH + 36, ey1 = Y - 8
  a.cung.setAttribute('d', `M ${hx0 + 16} ${Y - 6} Q ${cx} ${cy - 30} ${ex1} ${ey1}`); a.cung.setAttribute('stroke-dashoffset', String(r3(1 - pc)))
  const moCung = r3(1 - tien(t, m.a_nuoc, 0.4)); a.cung.setAttribute('opacity', String(moCung))
  const goc = Math.atan2(ey1 - (cy - 30), ex1 - cx) * 180 / Math.PI
  a.muiCung.setAttribute('transform', `translate(${ex1},${ey1}) rotate(${r3(goc)})`); a.muiCung.setAttribute('opacity', String(pc >= 0.97 ? moCung : 0))
  // H⁺ + OH⁻ ⇒ H₂O (giọt nổi lên) · Na⁺ gộp vào COO⁻ ⇒ COONa
  const pn = lo(t - m.a_nuoc, 2.0, 0.45), noi = Math.min(36, Math.max(0, t - m.a_nuoc - 0.8) * 12)
  datXY(a.nuoc, xOH - 36, Y - 18 - noi); a.nuoc.style.transform = `scale(${r3(0.3 + 0.7 * kep(pn, 0, 1.2))})`; a.nuoc.style.opacity = r3(kep(pn * 1.4))
  datXY(a.nhNuoc, xOH - 70, Y + 96 - noi); xuat(a.nhNuoc, t, m.a_nuoc + 0.3); tat(a.nhBase, t, m.a_nuoc - 0.2, 0.2)
  datXY(a.nhCoona, xR - 6, Y + 96); xuat(a.nhCoona, t, m.a_coona + 0.9)
  datXY(a.tom, 0, 420); xuat(a.tom, t, m.a_tom)
}

function veBazoBC(Z, m, t) {
  const Y = 18, bw = Z.bw, gap = Z.gap, giua = Z.giua
  const tKhoi = [m.b_gly1, m.b_ala, m.b_gly2], tach = eInOut(tien(t, m.c_can + 0.6, 0.6)), dx = (i) => (i - 1) * 14 * tach
  Z.khoi.forEach((e, i) => { const p = lo(t - tKhoi[i], 2.2, 0.55); datXY(e, 14 + i * (bw + gap), Y); e.style.opacity = r3(kep(p * 1.5)); e.style.transform = `translateX(${r3(dx(i))}px) scale(${r3(0.6 + 0.4 * kep(p, 0, 1.2))})` })
  // liên kết peptide: hiện khi mắt xích sau vào · đứt khi nước rơi vào (cần 2 nước)
  Z.lk.forEach((e, i) => { const v = tien(t, tKhoi[i + 1], 0.3), dut = tien(t, m.c_can + 0.45 + i * 0.12, 0.2); e.style.top = `${Y + 45}px`; e.style.opacity = r3(v * (1 - dut)); e.style.transform = `scaleX(${r3(v * (1 - dut))})` })
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
  Z.naohT.forEach((e, i) => { const t0 = m.b_3a + i * 0.18, p = eInOut(tien(t, t0, 0.6)); datXY(e, lerp(Z.W - 120, giua(i) - 58 + dx(i), p), lerp(-40, Y + 192, p)); e.style.opacity = r3(tien(t, t0, 0.12)) })
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
    const t0 = m.c_sinh + i * 0.16, len = lo(t - t0, 2.4, 0.5), vao = eInOut(tien(t, m.c_sinh + 1.0 + i * 0.1, 0.7))
    datXY(e, lerp(giua(i) - 25 + dx(i), hopX(false, i, 3), vao), lerp(Y + 128 - 30 * kep(len), hopY, vao)); e.style.transform = `scale(${r3(0.3 + 0.7 * kep(len, 0, 1.2) + (i === 2 && t >= m.c_con ? 0.25 * ex(-(t - m.c_con) * 3) : 0))})`
    e.style.opacity = r3(tien(t, t0, 0.12) * (i < 2 ? 1 - mat : 1)); e.classList.toggle('gach', i < 2 && t >= m.c_triet); e.classList.toggle('sang', i === 2 && t >= m.c_con)
  })
  datXY(Z.can, 14, Y + 328); xuat(Z.can, t, m.c_can + 0.2); Z.can.classList.toggle('gach', t >= m.c_trai)
  datXY(Z.sinh, Z.W / 2 + 6, Y + 328); xuat(Z.sinh, t, m.c_sinh + 0.2); Z.sinh.querySelector('b').textContent = t >= m.c_con ? '1 H₂O' : '3 H₂O'; Z.sinh.classList.toggle('sang', t >= m.c_con)
  datXY(Z.triet, 14, Y + 430); xuat(Z.triet, t, m.c_triet); tat(Z.triet, t, m.c_con)
  datXY(Z.con, 14, Y + 430); xuat(Z.con, t, m.c_con + 0.5)
}

function veBazoD(Z, m, t) {
  const d = Z.dd, Y = 30, X = 30, wG = 336
  // Gly: H của nhóm COOH bật ra (− 1), Na bay vào đúng chỗ đó (+ 23) ⇒ Gly-Na
  xuat(d.goc, t, m.d_hien); datXY(d.goc, X, Y)
  const ra = eOut(tien(t, m.d_na, 0.6)), vao = eInOut(tien(t, m.d_na + 0.45, 0.7))
  d.h.style.opacity = r3(kep(lo(t - m.d_hien, 2.2, 0.55) * 1.5) * (1 - tien(t, m.d_na + 0.9, 0.3))); datXY(d.h, X + wG + ra * 50, Y - ra * 70); d.h.classList.toggle('sang', t >= m.d_na)
  d.na.style.opacity = r3(tien(t, m.d_na + 0.4, 0.2)); datXY(d.na, lerp(Z.W - 110, X + wG, vao), lerp(Y - 80, Y, vao)); d.na.classList.toggle('sang', vao > 0.98)
  datXY(d.tenM, X, Y + 84); xuat(d.tenM, t, m.d_coona)
  datXY(d.tru, X, Y + 150); xuat(d.tru, t, m.d_tru1)
  datXY(d.cong, X + 330, Y + 150); xuat(d.cong, t, m.d_cong23)
  datXY(d.m, 0, Y + 236); d.m.style.opacity = r3(tien(t, m.d_75 - 0.25, 0.3))
  const tm = [m.d_75, m.d_tru1, m.d_cong23, m.d_22, m.d_22 + 1.1]
  d.m.querySelectorAll('i').forEach((e, i) => { const p = lo(t - tm[i], 2.4, 0.5); e.style.opacity = r3(kep(p * 1.4)); e.style.transform = `translateY(${r3((1 - p) * 14)}px) scale(${r3(i === 3 && t >= tm[3] ? 1 + 0.25 * ex(-(t - tm[3]) * 3) : 1)})` })
  datXY(d.ala, 0, Y + 356); d.ala.style.opacity = r3(tien(t, m.d_ala - 0.25, 0.3))
  const ta = [m.d_ala89, m.d_ala22, m.d_ala22 + 0.7]
  d.ala.querySelectorAll('i').forEach((e, i) => { const p = lo(t - ta[i], 2.4, 0.5); e.style.opacity = r3(kep(p * 1.4)); e.style.transform = `translateY(${r3((1 - p) * 14)}px)` })
}
Object.assign(HOAT, { bazo: [dungBazo, veBazo] })
