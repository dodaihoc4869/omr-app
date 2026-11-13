// NHÓM BƯỚC «CD — CUỘN ĐỀ» (13/11 — thầy, buổi Live theo khối: «Đề trên máy học sinh không vuốt cuộn xuống được»). Dùng chung cho bộ thử lớn
// (thu-gv-that-1211.mjs, chạy cuối) và bản chạy riêng nhanh (thu-cuon-de-1311.mjs). Tự mở MỘT phòng thật mới trong Node + máy thầy + bốn máy em:
//   em1  844 × 390 chuột            — máy tính, bánh xe
//   em2  390 × 844 ĐIỆN THOẠI CHẠM  — cầm dọc ⇒ hình xoay 90° bằng CSS; vuốt thật (CDP Input.dispatchTouchEvent) theo hướng «xuống» CỦA HÌNH
//   em3  500 × 800 chuột            — cửa sổ dọc trên máy tính: khung giấy CAO hơn tấm giấy soi
//   em4  844 × 390 ĐIỆN THOẠI CHẠM  — máy ngang thật, không xoay; vuốt thật
// Thầy chiếu câu ĐỀ DÀI ở chế độ «Học» (cau-dai.mjs): Q3 giấy soi, Q4 giấy dựng thường. Chuỗi chạm đi qua bộ lọc `touch-action` + đường cuộn của trình
// duyệt (không gán scrollTop trên máy em). `soLuoc` = chỉ đo cuộn tới cuối / về đầu (dùng để lấy số đo TRƯỚC khi sửa).
import { moMayChu } from './may-chu.mjs'

const ngu = (ms) => new Promise((r) => setTimeout(r, ms))

export async function thuCuonDe({ trinh, dist, kiem, chup = async () => {}, loiTrang = [], soLuoc = false }) {
  const may = await moMayChu({ dist })
  const ds = []
  const mo = async (duong, w, h, dienThoai = false) => {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, permissions: ['microphone'], ...(dienThoai ? { hasTouch: true, isMobile: true } : {}) })
    ds.push(ctx)
    await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loiTrang.push(`CD ${duong}: ${e.message.slice(0, 160)}`))
    await p.goto(`${may.goc}/scripts/thu-live-1011/trang.html?${duong}`)
    return p
  }
  const st = () => may.trangThai()
  const gv = await mo('vai=gv', 1366, 768)
  const em1 = await mo('vai=em&sbd=S1', 844, 390), em2 = await mo('vai=em&sbd=S2', 390, 844, true), em3 = await mo('vai=em&sbd=S3', 500, 800), em4 = await mo('vai=em&sbd=S4', 844, 390, true)
  const EM = [['em1 máy tính 844×390 (bánh xe)', em1, false], ['em2 điện thoại DỌC, hình xoay 90° (vuốt chạm)', em2, true], ['em3 cửa sổ dọc máy tính 500×800 (bánh xe)', em3, false], ['em4 điện thoại NGANG 844×390 (vuốt chạm)', em4, true]]
  await gv.waitForFunction(() => window.__sanSang); await ngu(400)
  await gv.evaluate(() => { void window.__moLive() }); await ngu(2800)
  await gv.locator('.lkt-bat-dau').click(); await ngu(3200)

  /** Số đo cuộn của giấy đề trên máy em. Mọi toạ độ theo trục «xuống» CỦA HÌNH (hình xoay 90° ⇒ «xuống» = sang trái màn), gốc = mép trên vùng đọc.
   *  `conDuoi` = mép dưới của chữ đề cuối cùng so với mép dưới vùng đọc (≤ 0 = đã thấy hết) · `conTren` = mép trên của chữ đầu tiên so với mép trên (≥ 0 = đang ở đầu đề). */
  const doGiay = (p) => p.evaluate(() => {
    const lv = document.querySelector('.lv'), c = document.querySelector('.lv-kg-cuon'), d = document.querySelector('.lv-de'), tam = document.querySelector('.lv-kg-tam')
    if (!lv || !c) return null
    const xoay = lv.getAttribute('data-xoay')
    const f = (e) => (e ? { top: Math.round(e.scrollTop), cao: e.clientHeight, tong: e.scrollHeight, oy: getComputedStyle(e).overflowY, ta: getComputedStyle(e).touchAction } : null)
    const tren = (r) => (xoay == null ? r.top : xoay === 'nguoc' ? r.left : -r.right), duoi = (r) => (xoay == null ? r.bottom : xoay === 'nguoc' ? r.right : -r.left)
    const kc = c.getBoundingClientRect()
    const chu = [...document.querySelectorAll('.lv-gt[data-khop] .lv-gt-o, .lv-de .lv-gd *')].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect())
    const de = document.querySelector('.lv-gt[data-khop] .lv-gt-chu')
    const kd = d && getComputedStyle(d).overflowY !== 'hidden' && d.scrollHeight > d.clientHeight + 1 ? d : c
    const g = document.querySelector('.lv-gt')
    return {
      xoay: xoay == null ? 'không' : xoay || '90', soi: lv.hasAttribute('data-soi'), khung: kd === d ? '.lv-de' : '.lv-kg-cuon', cuon: f(c), de: f(d), k: f(kd),
      conDuoi: chu.length ? Math.round(Math.max(...chu.map(duoi)) - duoi(kc)) : null, conTren: chu.length ? Math.round(Math.min(...chu.map(tren)) - tren(kc)) : null,
      deTren: de ? Math.round((tren(de.getBoundingClientRect()) - tren(kc)) * 10) / 10 : null, du: Math.round(parseFloat(getComputedStyle(tam).marginTop) || 0),
      tiLe: g ? g.getBoundingClientRect()[xoay == null ? 'width' : 'height'] / (g.offsetWidth || 1) : 0, mui: document.querySelector('.lv-giay')?.getAttribute('data-mui') ?? '',
    }
  })
  /** Tâm vùng đọc đề trên MÀN (px) + véc-tơ «xuống của hình» trên màn. */
  const huong = (p) => p.evaluate(() => { const lv = document.querySelector('.lv'), r = document.querySelector('.lv-kg-cuon').getBoundingClientRect(), x = lv.getAttribute('data-xoay'); return { x: r.left + r.width / 2, y: r.top + r.height / 2, xuong: x == null ? [0, 1] : x === 'nguoc' ? [1, 0] : [-1, 0] } })
  /** VUỐT THẬT: ngón tay đặt ở giữa đề rồi kéo NGƯỢC hướng «xuống của hình» `quang` px (em vuốt lên để đọc phần dưới); `quang` âm = vuốt xuống. */
  const vuot = async (p, quang, cho = 1100) => {
    const h = await huong(p), cdp = await p.context().newCDPSession(p)
    const diem = (t) => [{ x: Math.round(h.x - h.xuong[0] * quang * (t - 0.5)), y: Math.round(h.y - h.xuong[1] * quang * (t - 0.5)), id: 1 }]
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: diem(0) })
    for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: diem(i / 12) }); await ngu(16) }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach(); await ngu(cho)
  }
  const lan = async (p, dy, cho = 700) => { const h = await huong(p); await p.mouse.move(h.x, h.y); await p.mouse.wheel(0, dy); await ngu(cho) }
  const cuonEm = (p, cham, quang) => (cham ? vuot(p, quang) : lan(p, quang * 1.6))
  /** Cuộn tới CUỐI đề rồi về ĐẦU đề trên cả bốn máy; ghi số đo từng máy. */
  const cuonHet = async (ma, moTa) => {
    for (const [ten, p, cham] of EM) {
      const a = await doGiay(p)
      if (!a) { kiem(`${ma} ${ten}: có giấy đề`, false, 'không thấy .lv-kg-cuon'); continue }
      let b = a, luot = 0
      for (; luot < 16; luot++) { const tr = b.k.top; await cuonEm(p, cham, 200); b = await doGiay(p); if (b.k.top === tr) break }
      const so = { xoay: a.xoay, soi: a.soi, khung: a.khung, oy: a.k.oy, ta: a.k.ta, cao: a.k.cao, tong: a.k.tong, topTruoc: a.k.top, topSau: b.k.top, conDuoiTruoc: a.conDuoi, conDuoiSau: b.conDuoi, luot }
      kiem(`${ma} ${ten} · ${moTa}: đề còn ${a.conDuoi} px dưới mép vùng đọc ⇒ cuộn đọc được TỚI CUỐI đề`, a.conDuoi > 8 && b.k.top > a.k.top + 20 && b.conDuoi <= 8, JSON.stringify(so))
      let c = b
      for (let i = 0; i < 16 && c.k.top > 0; i++) { await cuonEm(p, cham, -200); c = await doGiay(p) }
      kiem(`${ma} ${ten} · ${moTa}: cuộn ngược về ĐẦU đề`, c.k.top <= 2 && c.conTren >= 0, `top ${b.k.top} → ${c.k.top} · chữ đầu cách mép trên ${c.conTren} px`)
    }
  }

  // ── CD1. GIẤY SOI, đề dài hơn cả ô giấy của thầy ──
  const loi3 = await gv.evaluate((q) => window.__chieuCauDai(q), 'Q3'); await ngu(6500)
  const dau = await Promise.all(EM.map(([, p]) => doGiay(p)))
  kiem('CD1a thầy chiếu câu ĐỀ DÀI ở «Học»: bốn máy em đều dựng giấy SOI khớp giấy thầy; chỉ điện thoại cầm dọc bị xoay hình', loi3 === '' && st()?.live?.khoi?.che === 'hoc' && st()?.luot?.qid === 'Q3' && dau.every((d) => d?.soi) && dau.map((d) => d?.xoay).join() === 'không,90,không,không', JSON.stringify(dau.map((d) => d && { xoay: d.xoay, soi: d.soi, khung: d.khung })))
  await chup(em2, 'cd-1-em-doc-dau-de')
  await cuonHet('CD1b', 'giấy soi')
  if (!soLuoc) {
    const to = gv.frameLocator('.lop-xem-phieu iframe')
    const sGv = () => gv.evaluate(() => parseFloat(document.documentElement.style.getPropertyValue('--lkc-s')) || 1)
    /** Ô giấy của thầy trên TRANG máy thầy (px) + hệ số thu của tờ. */
    const oGiayThay = async () => { const k = await gv.locator('.lop-xem-phieu iframe').boundingBox(), s = await sGv(); const c = await to.locator('body').evaluate(() => { const r = window.__mcDot().querySelector('.mc-vung-de').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } }); return { x: k.x + c.x * s, y: k.y + c.y * s, w: c.w * s, h: c.h * s, s } }
    /** Thầy đặt bút ở (fx0, fy) của ô giấy, kẻ ngang tới fx1 và GIỮ bút (chưa nhả). */
    const keGiu = async (fx0, fx1, fy) => { const o = await oGiayThay(), y = o.y + o.h * fy; await gv.mouse.move(o.x + o.w * fx0, y); await gv.mouse.down(); for (let i = 1; i <= 10; i++) { await gv.mouse.move(o.x + o.w * (fx0 + ((fx1 - fx0) * i) / 10), y); await ngu(20) } return { yT: (o.h * fy) / o.s, x0T: (o.w * fx0) / o.s, x1T: (o.w * fx1) / o.s } }
    /** Chỗ MỰC MỚI trên màn máy em (so hai ảnh chụp) trong dải ngang [x0, x1] của vùng đọc đề ⇒ tung độ giữa các hàng đổi màu (px màn), null = không thấy. */
    const mucMoi = async (p, truoc, x0, x1) => { const sau = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async ([a, b, x0, x1]) => { const nap = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return g }; const A = await nap(a), B = await nap(b), r = document.querySelector('.lv-kg-cuon').getBoundingClientRect(); const X0 = Math.max(Math.round(r.left), Math.round(x0)), W = Math.max(1, Math.min(Math.round(r.right), Math.round(x1)) - X0), Y0 = Math.round(r.top), H = Math.round(r.height); const da = A.getImageData(X0, Y0, W, H).data, db = B.getImageData(X0, Y0, W, H).data; const hang = []; for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (Math.abs(da[k] - db[k]) + Math.abs(da[k + 1] - db[k + 1]) + Math.abs(da[k + 2] - db[k + 2]) > 45) n++ } if (n >= W * 0.3) hang.push(y) } return hang.length ? Y0 + (hang[0] + hang[hang.length - 1]) / 2 : null }, [truoc, sau, x0, x1]) }
    /** Số điểm có mực trên từng hàng của LỚP NÉT ĐÃ CHỐT của giấy (canvas nằm trên tấm giấy, cuộn cùng chữ). */
    const hangMuc = (p) => p.evaluate(() => { const c = document.querySelector('.lv-giay canvas.lv-cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, ra = new Array(c.height).fill(0); for (let i = 3; i < d.length; i += 4) if (d[i] > 40) ra[Math.floor(i / 4 / c.width)]++; const r = c.getBoundingClientRect(); return { ra, top: r.top, tiLe: r.height / c.height } })
    /** Nét MỚI chốt so với lần đo trước ⇒ tung độ trên màn (px) của tâm nét, null = không có nét mới. */
    const netChot = (truoc, sau) => { const ds = []; for (let y = 0; y < sau.ra.length; y++) if (sau.ra[y] - (truoc.ra[y] ?? 0) >= 20) ds.push(y); return ds.length ? sau.top + ((ds[0] + ds[ds.length - 1] + 1) / 2) * sau.tiLe : null }
    await to.locator('body').evaluate(() => window.__mcBut.bat(true)); await ngu(300)

    // ── CD2. NÉT THẦY GẠCH TRÊN GIẤY VẪN KHỚP CHỖ khi em đã tự cuộn (lớp «đang viết» + lớp nét đã chốt) ──
    await lan(em1, 110); await ngu(300)
    const e2 = await doGiay(em1), hop1 = await em1.evaluate(() => { const r = document.querySelector('.lv-kg-cuon').getBoundingClientRect(), t = document.querySelector('.lv-kg-tam').getBoundingClientRect(); return { top: r.top, tamTrai: t.left } })
    const anh0 = (await em1.screenshot({ type: 'png' })).toString('base64'), muc0 = await hangMuc(em1)
    const net = await keGiu(0.12, 0.62, 0.52); await ngu(700)
    const mong = hop1.top + e2.du + net.yT * e2.tiLe - e2.cuon.top, xa = hop1.tamTrai + net.x0T * e2.tiLe + 12, xb = hop1.tamTrai + (net.x0T + (net.x1T - net.x0T) * 0.45) * e2.tiLe
    const dangViet = await mucMoi(em1, anh0, xa, xb)
    await gv.mouse.up(); await ngu(1200)
    const daChot = netChot(muc0, await hangMuc(em1)), sauNet = await doGiay(em1)
    kiem('CD2a em đã tự cuộn giấy 110 px: nét thầy ĐANG gạch trên giấy hiện đúng dòng (lệch ≤ 3 px so với chỗ tính từ chữ đề), nhả bút xong vẫn đúng chỗ ấy; giấy không tự nhảy', dangViet != null && daChot != null && Math.abs(dangViet - mong) <= 3 && Math.abs(daChot - mong) <= 3 && sauNet.cuon.top === e2.cuon.top, JSON.stringify({ cuon: e2.cuon.top, cuonSau: sauNet.cuon.top, tiLe: Math.round(e2.tiLe * 1000) / 1000, mong: Math.round(mong * 10) / 10, dangViet, daChot }))
    await chup(em1, 'cd-2-net-khop-khi-em-cuon')

    // ── CD3. LUẬT NHƯỜNG 4 GIÂY: em vừa tự cuộn ⇒ giấy không tự trôi theo bút thầy, hiện mũi tên; hết 4 giây ⇒ tự về chỗ thầy ──
    for (let i = 0; i < 3; i++) await vuot(em2, 200, 500)
    for (let i = 0; i < 4; i++) await lan(em1, 320, 250)
    const n1 = await doGiay(em1), n2 = await doGiay(em2)
    await keGiu(0.15, 0.5, 0.3)
    // thầy giữ bút, nhích qua lại ⇒ bút vẫn «đang viết» suốt lúc đo
    const nhich = async (ms) => { const o = await oGiayThay(), y = o.y + o.h * 0.3; for (let t = 0; t < ms; t += 120) { await gv.mouse.move(o.x + o.w * (0.5 + 0.02 * ((t / 120) % 5)), y); await ngu(120) } }
    await nhich(900)
    const g1 = await doGiay(em1), g2 = await doGiay(em2)
    kiem('CD3a em vừa tự cuộn xuống cuối đề, thầy viết ở phần trên: trong 4 giây giấy máy em ĐỨNG YÊN, có mũi tên «Thầy đang viết ở trên» (máy tính và điện thoại hình xoay)', n1.cuon.top > 200 && g1.cuon.top === n1.cuon.top && g1.mui === 'tren' && n2.cuon.top > 200 && g2.cuon.top === n2.cuon.top && g2.mui === 'tren', JSON.stringify({ em1: [n1.cuon.top, g1.cuon.top, g1.mui], em2: [n2.cuon.top, g2.cuon.top, g2.mui] }))
    await chup(em2, 'cd-3-em-doc-nhuong-mui-ten')
    await nhich(4600)
    const h1 = await doGiay(em1), h2 = await doGiay(em2)
    await gv.mouse.up(); await ngu(600)
    kiem('CD3b em thôi chạm quá 4 giây mà thầy vẫn viết ở trên ⇒ giấy TỰ TRÔI về chỗ thầy, mũi tên tắt', h1.cuon.top < n1.cuon.top - 100 && h1.mui === '' && h2.cuon.top < n2.cuon.top - 100 && h2.mui === '', JSON.stringify({ em1: [n1.cuon.top, h1.cuon.top, h1.mui], em2: [n2.cuon.top, h2.cuon.top, h2.mui] }))

    // ── CD4. THẦY LẬT TRANG GIẤY CỦA THẦY (lệnh ↓ / ↑ của tờ — đề dài, tờ chia trang lúc chờ gọi; tờ tự đo lại và gửi số đo như thật) ──
    const yDe = () => st()?.live?.giay?.o?.find((b) => b[0] === 2)?.[3]
    await to.locator('body').evaluate(() => window.__mcBut.bat(false)) // bút bật thì tờ không lật trang
    // (lệnh «↓» / «↑» của tờ — đúng đường phím ↓ ↑ PageDown PageUp và điều khiển từ xa gọi; `press` của bộ thử lấy tiêu điểm khung làm tờ vào lại đợt)
    const thayLat = async (xuong) => { await to.locator('body').evaluate((k) => window.__mcLenh(k), xuong ? '↓' : '↑'); await ngu(1900) }
    for (const [, p, cham] of [EM[0], EM[1]]) for (let i = 0; i < 12; i++) { const d = await doGiay(p); if (d.cuon.top <= 0) break; await cuonEm(p, cham, -200) }
    await ngu(4300) // quá 4 giây không chạm ⇒ máy em đi theo giấy thầy
    const t0 = await Promise.all([doGiay(em1), doGiay(em2)]), y0 = yDe()
    if (process.env.DO_CD) console.log('DO', await to.locator('body').evaluate(() => { const v = window.__mcDot().querySelector('.mc-vung-de'); const tr = (n) => n + ' trang=' + v.getAttribute('data-trang') + ' __trang=' + v.__trang + ' moc=' + JSON.stringify(v.__moc) + ' lop=' + v.className + ' tt=' + JSON.stringify(window.__mcTrangThai()) + ' but=' + document.body.className; const a = tr('trước'); window.__mcLenh('↓'); return a + ' || ' + tr('sau') }))
    await thayLat(true)
    const t1 = await Promise.all([doGiay(em1), doGiay(em2)]), y1 = yDe(), D1 = y0 - y1
    const theo = (a, b) => b.soi && b.du > 0 && Math.abs(b.cuon.top - b.du) <= 1 && Math.abs(b.deTren - (a.deTren - D1 * a.tiLe)) <= 2
    kiem('CD4a thầy lật giấy sang trang 2 (khối đề của giấy thầy sang toạ độ âm): máy em không tự cuộn gần đây ĐI THEO như trước (chữ dời đúng quãng thầy lật × phép co), giấy vẫn soi khớp', y1 < 0 && D1 > 100 && theo(t0[0], t1[0]) && theo(t0[1], t1[1]), JSON.stringify({ yDe: [y0, y1], em1: [t0[0].deTren, t1[0].deTren, t1[0].du, t1[0].cuon.top], em2: [t0[1].deTren, t1[1].deTren, t1[1].du, t1[1].cuon.top] }))
    // em kéo ngược về xem lại ĐẦU đề (phần thầy đã lật qua)
    for (const [, p, cham] of [EM[0], EM[1]]) for (let i = 0; i < 8; i++) { const d = await doGiay(p); if (d.cuon.top <= 0) break; await cuonEm(p, cham, -200) }
    const t2 = await Promise.all([doGiay(em1), doGiay(em2)])
    kiem('CD4b phần đề thầy ĐÃ LẬT QUA: em kéo ngược lại đọc được tới dòng đầu của đề (nằm trong vùng đọc)', t2.every((d) => d.cuon.top === 0 && d.deTren >= 0 && d.deTren < 80), JSON.stringify(t2.map((d) => [d.cuon.top, d.deTren])))
    await chup(em2, 'cd-4-em-doc-xem-lai-dau-de')
    // em vừa tự cuộn (dưới 4 giây) mà thầy lật tiếp ⇒ chữ em đang đọc đứng yên
    await lan(em1, 60, 400)
    const t3 = await doGiay(em1)
    await thayLat(true)
    const t4 = await doGiay(em1), y2 = yDe()
    kiem('CD4c em VỪA tự cuộn (dưới 4 giây) mà thầy lật tiếp sang trang 3 ⇒ chữ em đang đọc ĐỨNG YÊN trên màn (không bị giật theo thầy)', y2 < y1 - 100 && t4.du > t3.du + 40 && Math.abs(t4.deTren - t3.deTren) <= 1.5, JSON.stringify({ yDe: [y1, y2], truoc: [t3.deTren, t3.du, t3.cuon.top], sau: [t4.deTren, t4.du, t4.cuon.top] }))
    await thayLat(false); await thayLat(false)
    const t5 = await doGiay(em1)
    kiem('CD4d thầy lật về trang đầu: máy em hết phần dư phía trên, giấy vẫn soi khớp', yDe() === y0 && t5.soi && t5.du === 0, JSON.stringify({ yDe: yDe(), du: t5.du, top: t5.cuon.top }))
    // ── CD5. KHÔNG HỎNG: chạm thanh xám mở dải chọn đáp án trên máy hình xoay (chạm không bị nuốt thành kéo) ──
    const nam = em2.locator('.lv-tra-nam[aria-expanded="false"]')
    if (await nam.count()) { const b = await nam.boundingBox(); await em2.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await ngu(450) }
    kiem('CD5a điện thoại hình xoay: chạm thanh xám dưới đề ⇒ dải chọn đáp án vẫn mở, đề vẫn cuộn được phía trên dải', (await em2.locator('.lv-giay .lv-tra').count()) === 1, String(await em2.locator('.lv-giay .lv-tra, .lv-giay .lv-tra-thu').count()))
    const d5 = await doGiay(em2)
    await vuot(em2, 200)
    const d6 = await doGiay(em2)
    kiem('CD5b dải chọn đang mở: vuốt trên đề vẫn cuộn (vùng đọc thấp lại, không bị dải che)', d6.cuon.top > d5.cuon.top + 60, JSON.stringify([d5.cuon.top, d6.cuon.top, d6.cuon.cao]))
    await chup(em2, 'cd-5-em-doc-dai-chon-mo')
  }

  // ── CD6. GIẤY DỰNG THƯỜNG (câu của lượt lệch chữ trên tờ ⇒ không soi được): khối đề `.lv-de` tự cuộn ──
  const loi4 = await gv.evaluate((q) => window.__chieuCauDai(q), 'Q4'); await ngu(6500)
  const thuong = await Promise.all(EM.map(([, p]) => doGiay(p)))
  kiem('CD6a câu lệch tờ ⇒ bốn máy em dựng giấy THƯỜNG (không soi), khung cuộn là khối đề', loi4 === '' && st()?.luot?.qid === 'Q4' && thuong.every((d) => d && !d.soi && d.khung === '.lv-de'), JSON.stringify(thuong.map((d) => d && { soi: d.soi, khung: d.khung })))
  await cuonHet('CD6b', 'giấy dựng thường')
  await chup(em2, 'cd-6-em-doc-giay-thuong')

  for (const c of ds) await c.close()
  await may.dong()
}
