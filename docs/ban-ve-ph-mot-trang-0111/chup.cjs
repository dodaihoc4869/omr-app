// Chụp bản vẽ «Một trang về con» bằng Chromium thật + KIỂM BẰNG MÁY từng khổ ⇒ anh/*.jpg + kiem.json
//   NODE_PATH=<repo>/node_modules node docs/ban-ve-ph-mot-trang-0111/chup.cjs [dot1|dot2|tat-ca]
// Kiểm: không cuộn trang (scrollHeight ≤ innerHeight) · không tràn ngang · 0 lỗi trang · đích bấm ≥ 44 px · ô bị cắt chữ (thông tin).
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs')
const RA = path.join(__dirname, 'anh'), TRANG = path.join(__dirname, 'ph-mot-trang.html'), KIEM = path.join(__dirname, 'kiem.json')
fs.mkdirSync(RA, { recursive: true })
const DOT1 = [
  { ten: 'doc-390-sang', w: 390, h: 844, dsf: 2 },
  { ten: 'zfold-mo-904-sang', w: 904, h: 690, dsf: 1.5 },
  { ten: 'may-tinh-1440-sang', w: 1440, h: 900, dsf: 1 }
]
const DOT2 = [
  { ten: 'ngang-844-sang', w: 844, h: 390, dsf: 2 },
  { ten: 'doc-390-toi', w: 390, h: 844, dsf: 2, toi: 1 },
  { ten: 'may-tinh-1440-toi', w: 1440, h: 900, dsf: 1, toi: 1 },
  { ten: 'zfold-gap-360-sang', w: 360, h: 800, dsf: 2 },
  { ten: 'tam-so-do-doi-pho-390-sang', w: 390, h: 844, dsf: 2, con: 'chua-tot', tam: 'dp' },
  { ten: 'tam-ca-kiem-tra-904-sang', w: 904, h: 690, dsf: 1.5, tam: 'ca' },
  { ten: 'con-chua-tot-390-sang', w: 390, h: 844, dsf: 2, con: 'chua-tot' },
  // chỉ kiểm, không giữ ảnh: điện thoại có thanh địa chỉ (khung thật nhỏ hơn màn), Z Fold gập trong trình duyệt, máy tính 1280×720
  { ten: 'kiem-390x740-thanh-dia-chi', w: 390, h: 740, dsf: 1, chiKiem: 1 },
  { ten: 'kiem-360x700-zfold-gap-trinh-duyet', w: 360, h: 700, dsf: 1, chiKiem: 1 },
  { ten: 'kiem-1280x720-may-tinh', w: 1280, h: 720, dsf: 1, chiKiem: 1 },
  { ten: 'kiem-844x390-ngang-chua-tot', w: 844, h: 390, dsf: 1, con: 'chua-tot', chiKiem: 1 }
]
const chon = process.argv[2] || 'tat-ca'
const DS = chon === 'dot1' ? DOT1 : chon === 'dot2' ? DOT2 : [...DOT1, ...DOT2]

;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const kiem = fs.existsSync(KIEM) ? JSON.parse(fs.readFileSync(KIEM, 'utf8')) : { ghiChu: 'Kiểm bằng Chromium thật (chup.cjs). khongCuon = scrollHeight ≤ innerHeight; tranNgang = scrollWidth − clientWidth; dichNho = phần tử bấm được cao/rộng < 44 px; oCat = ô có phần tử con lòi khỏi đáy; chuCat = chữ bị cắt ngang dòng (phải 0); baCham = chữ rút gọn sạch bằng «…» (được phép, ghi để soát).', kho: {} }
  let loi = 0
  for (const k of DS) {
    const p = await b.newPage({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dsf, colorScheme: k.toi ? 'dark' : 'light' })
    const loiTrang = []
    p.on('pageerror', (e) => loiTrang.push(String(e).slice(0, 120)))
    await p.goto('file://' + TRANG + (k.con ? '?con=' + k.con : '') + (k.tam ? '#tam=' + k.tam : ''))
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250)
    const kq = await p.evaluate(() => {
      const de = document.documentElement
      const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
      const tamMo = !document.getElementById('tam').hidden
      const goc = tamMo ? document.getElementById('tam') : document
      const dichNho = [...goc.querySelectorAll('button, a')].filter(hien).filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44 }).map((e) => (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30))
      // ô bị cắt: phần tử con (không tính hình trang trí ::before/::after) lòi khỏi đáy ô
      const oCat = tamMo ? [] : [...document.querySelectorAll('.o, .so, .o-bon')].filter(hien).map((e) => {
        const day = e.getBoundingClientRect().bottom - parseFloat(getComputedStyle(e).paddingBottom) + 1
        const lo = Math.max(0, ...[...e.children].filter(hien).map((c) => c.getBoundingClientRect().bottom - day))
        return [e, Math.round(lo)]
      }).filter(([, lo]) => lo > 2).map(([e, lo]) => (e.id || e.dataset.tam || e.className) + ` (${lo}px)`)
      // chữ bị cắt ngang dòng: phần tử có chữ lòi khỏi khung cắt của tổ tiên (overflow ≠ visible, trừ vùng cuộn của tấm),
      // hoặc tự cắt mà không có «…» (text-overflow: ellipsis / line-clamp). «…» sạch được phép ⇒ ghi riêng vào baCham.
      const coChu = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      const tuCat = (cs) => cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')
      const chuCat = [], baCham = []
      for (const e of [...document.querySelectorAll('body *')].filter((x) => coChu(x) && hien(x))) {
        const cs = getComputedStyle(e), r = e.getBoundingClientRect(), ten = e.textContent.trim().replace(/\s+/g, ' ').slice(0, 34)
        if (tuCat(cs)) { if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2) baCham.push(ten); }
        else if ((cs.overflowY !== 'visible' && e.scrollHeight > e.clientHeight + 2) || (cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 2)) { chuCat.push('tự cắt: ' + ten); continue }
        for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
          const ca = getComputedStyle(a)
          if (ca.overflowY === 'auto' || ca.overflowY === 'scroll') break
          if (ca.overflow === 'visible') continue
          const ra = a.getBoundingClientRect()
          if (r.bottom > ra.bottom - parseFloat(ca.borderBottomWidth) + 1 || r.top < ra.top - 1 || r.right > ra.right + 1) { chuCat.push('bị khung cắt: ' + ten); break }
        }
      }
      return { chuCat, baCham, cao: de.scrollHeight, khung: innerHeight, khongCuon: de.scrollHeight <= innerHeight && document.body.scrollHeight <= innerHeight, tranNgang: de.scrollWidth - de.clientWidth, dichNho, oCat }
    })
    let kb = null
    if (!k.chiKiem) {
      const tep = path.join(RA, k.ten + '.jpg')
      for (let q = k.dsf > 1 ? 66 : 80; q >= 30; q -= 6) {
        await p.screenshot({ path: tep, type: 'jpeg', quality: q })
        kb = Math.round(fs.statSync(tep).size / 1024)
        if (kb <= 150) break
      }
    }
    const dat = loiTrang.length === 0 && kq.khongCuon && kq.tranNgang <= 0 && kq.dichNho.length === 0 && kq.chuCat.length === 0 && kq.oCat.length === 0
    if (!dat) loi++
    kiem.kho[k.ten] = { khung: `${k.w}×${k.h}`, sangToi: k.toi ? 'tối' : 'sáng', con: k.con || 'tot', tam: k.tam || null, dat, khongCuon: kq.khongCuon, cao: kq.cao, tranNgang: kq.tranNgang, loiTrang, dichNho: kq.dichNho, oCat: kq.oCat, chuCat: kq.chuCat, baCham: kq.baCham, kb }
    console.log(`${dat ? 'ĐẠT ' : 'LỖI '} ${k.ten}: cao ${kq.cao}/${kq.khung} · tràn ${kq.tranNgang} · lỗi ${loiTrang.length} · đích nhỏ ${kq.dichNho.length}${kq.dichNho.length ? ' ' + JSON.stringify(kq.dichNho.slice(0, 3)) : ''} · ô cắt ${kq.oCat.length ? JSON.stringify(kq.oCat) : 0} · chữ cắt ${kq.chuCat.length ? JSON.stringify(kq.chuCat.slice(0, 4)) : 0} · «…» ${kq.baCham.length}${kb ? ' · ' + kb + ' KB' : ''}`)
    await p.close()
  }
  await b.close()
  kiem.capNhat = new Date().toISOString()
  fs.writeFileSync(KIEM, JSON.stringify(kiem, null, 1) + '\n')
  console.log(loi ? `KIỂM: ${loi} khổ chưa đạt` : 'KIỂM: mọi khổ đạt')
})()
