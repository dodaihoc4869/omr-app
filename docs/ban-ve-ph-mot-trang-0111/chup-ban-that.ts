// ẢNH NGHIỆM THU từ BẢN BUILD THẬT (dist/) — «Một trang về con» (/ph). Máy chủ GIẢ qua page.route (không một byte ra máy chủ thật), dữ liệu giả của
// scripts/chup-ph-dot19/gia.ts + 4 số đo dựng bằng ĐÚNG hàm máy chủ `banPhuHuynh`. Kiểm từng khổ: không cuộn trang · không tràn ngang · 0 lỗi trang ·
// đích bấm ≥ 44 px · 0 chữ cắt ngang dòng (chỉ «…» sạch) ⇒ anh-ban-that/*.jpg + kiem-ban-that.json.
//   npm run build:cf && NODE_PATH=<repo>/node_modules npx jiti docs/ban-ve-ph-mot-trang-0111/chup-ban-that.ts
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from '../../scripts/chup-ph-dot19/gia'
import { banPhuHuynh } from '../../server/src/ph-bon-so-do'

const GOC = resolve(__dirname, '../..'), DIST = join(GOC, 'dist'), RA = join(__dirname, 'anh-ban-that')
mkdirSync(RA, { recursive: true })
const LOAI: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const may = createServer((rq, rs) => {
  const u = decodeURIComponent((rq.url ?? '/').split('?')[0]!)
  let f = join(DIST, u)
  if (!f.startsWith(DIST) || !existsSync(f) || statSync(f).isDirectory()) f = join(DIST, 'index.html')
  rs.writeHead(200, { 'content-type': LOAI[extname(f)] ?? 'application/octet-stream' })
  rs.end(readFileSync(f))
})

// ── 4 số đo giả (hình hàng bon_chi_so_em), hai hồ sơ
const NGAY14 = Array.from({ length: 14 }, (_, i) => `2026-09-${String(30).padStart(2, '0')}`).map((_, i) => new Date(Date.UTC(2026, 8, 30 + i)).toISOString().slice(0, 10))
const hang = (d: { ht: number; dp: number; ch: number; lu: number }, tot: boolean) => ({
  ngay: '2026-10-14', tinh_luc: '2026-10-13T18:05:00.000Z', ...d, so_luot: tot ? 212 : 168,
  the_json: JSON.stringify(tot ? {
    ht: [{ ma: 'sua', lon: '9/11' }, { ma: 'ky', lon: '84%' }, { ma: 'dungMoi', lon: '72%' }],
    dp: [{ ma: 'voi', w: 2, lon: '3/212' }, { ma: 'boMac', w: 1, lon: '2/11' }],
    ch: [{ ma: 'ngayDu', lon: '12/14' }, { ma: 'cauLam', lon: '94%' }, { ma: 'chuoi', lon: '6' }],
    lu: [{ ma: 'ngayCoLam', tieu: 'Ngày không làm câu nào', lon: '1/14' }, { ma: 'lanCuoi', lon: '14/10', nhoSo: 'hôm nay' }],
  } : {
    ht: [{ ma: 'sua', lon: '3/12' }, { ma: 'ky', lon: '41%' }, { ma: 'khop', lon: '76% → 4,5' }],
    dp: [
      { ma: 'voi', w: 30, lon: '23/168', viDu: [{ luc: '2026-10-12T14:52:00.000Z', qid: 'Q1', phu: 'cần ít nhất 18 giây để đọc đề', kq: 'chọn sau 4 giây · sai', dung: false }] },
      { ma: 'do', w: 12, lon: '9/40', viDu: [{ luc: '2026-10-12T15:10:00.000Z', qid: 'Q2', phu: 'thử 4 đáp án', kq: 'sai', dung: false }] },
      { ma: 'goiY', w: 6, lon: '11/168' },
    ],
    ch: [{ ma: 'ngayDu', lon: '4/14' }, { ma: 'cauLam', lon: '52%' }, { ma: 'chuoi', lon: '0' }],
    lu: [{ ma: 'ngayCoLam', tieu: 'Ngày không làm câu nào', lon: '5/14' }, { ma: 'cauLam', lon: '96/200' }, { ma: 'boMac', lon: '9' }],
  }),
  ngay_json: JSON.stringify(NGAY14.map((ngay, i) => tot ? { ngay, muc: 30, ky: 22 + (i % 4), voi: Math.max(0, 4 - (i >> 2)) } : { ngay, muc: 30, ky: i % 3 ? 9 - (i >> 2) : 0, voi: i % 3 ? 4 + (i >> 1) : 0 })),
})
const BON = { tot: banPhuHuynh(hang({ ht: 78, dp: 12, ch: 86, lu: 14 }, true)), 'chua-tot': banPhuHuynh(hang({ ht: 34, dp: 64, ch: 38, lu: 62 }, false)) }
const chuaTotTq = () => {
  const t = tongQuanGia() as ReturnType<typeof tongQuanGia> & { dem: { homNay: Record<string, number> }; ngay: Record<string, unknown>[] }
  t.dem.homNay = { soLuot: 0, dung: 0, sai: 0, boTrong: 0, soCau: 0, giayTb: 0 }
  t.ngay = t.ngay.map((n, i) => (i === 13 ? { ...n, dung: 0, sai: 0, soCau: 0, daLam: 0, trangThai: 'thieu' } : i % 3 === 1 ? { ...n, daLam: 0, soCau: 0, dung: 0, sai: 0, trangThai: 'khong' } : n))
  return t
}
const chuaTotTatCa = () => {
  const t = tatCaGia() as Record<string, unknown> & { homNay: { tongQuan: Record<string, unknown> } }
  t.hoTen = 'Trần Gia Huy'
  t.homNay = { ...t.homNay, tongQuan: { ...t.homNay.tongQuan, soCau: 0, soDung: 0, phutHoc: 0, chuoiNgayHoc: 0 } }
  return t
}
const DU: Record<string, Record<string, () => unknown>> = {
  tot: { '/ph/tat-ca-ve-con': tatCaGia, '/ph/con-tong-quan': tongQuanGia, '/ph/bon-so-do': () => BON.tot },
  'chua-tot': { '/ph/tat-ca-ve-con': chuaTotTatCa, '/ph/con-tong-quan': chuaTotTq, '/ph/bon-so-do': () => BON['chua-tot'], '/ph/hoc-2': () => ({ ...hoc2Gia(), homNay: { tong: 30, daLam: 0 } }) },
}
const CHUNG: Record<string, () => unknown> = { '/ph/nhip-hoc': nhipGia, '/ph/loi-thay': loiThayGia, '/ph/hoc-2': hoc2Gia, '/ph/ho-so-thai-do': thaiDoGia, '/ph/lich-su-lam-cau': lichSuGia, '/ph/ke-hoach': () => ({ ok: true, canhBao: [] }) }

type Kho = { ten: string; w: number; h: number; dsf: number; toi?: boolean; con?: 'tot' | 'chua-tot'; bam?: string; chiKiem?: boolean }
const KHO: Kho[] = [
  { ten: 'doc-390-sang', w: 390, h: 844, dsf: 2 },
  { ten: 'doc-390-toi', w: 390, h: 844, dsf: 2, toi: true },
  { ten: 'zfold-gap-360-sang', w: 360, h: 800, dsf: 2 },
  { ten: 'ngang-844-sang', w: 844, h: 390, dsf: 2 },
  { ten: 'zfold-mo-904-sang', w: 904, h: 690, dsf: 1.5 },
  { ten: 'may-tinh-bang-1024-sang', w: 1024, h: 768, dsf: 1 },
  { ten: 'may-tinh-1440-sang', w: 1440, h: 900, dsf: 1 },
  { ten: 'may-tinh-1440-toi', w: 1440, h: 900, dsf: 1, toi: true },
  { ten: 'con-chua-tot-390-sang', w: 390, h: 844, dsf: 2, con: 'chua-tot' },
  { ten: 'tam-doi-pho-390-sang', w: 390, h: 844, dsf: 2, con: 'chua-tot', bam: '.mtc-so[data-ma="dp"]' },
  { ten: 'tam-diem-904-sang', w: 904, h: 690, dsf: 1.5, bam: '[data-vung="diem-gan-nhat"]' },
  { ten: 'kiem-390x740', w: 390, h: 740, dsf: 1, chiKiem: true },
  { ten: 'kiem-360x700', w: 360, h: 700, dsf: 1, chiKiem: true },
  { ten: 'kiem-844x390-chua-tot', w: 844, h: 390, dsf: 1, con: 'chua-tot', chiKiem: true },
  { ten: 'kiem-1280x720', w: 1280, h: 720, dsf: 1, chiKiem: true },
]

;(async () => {
  await new Promise<void>((ok) => may.listen(0, '127.0.0.1', ok))
  const cong = (may.address() as { port: number }).port
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const kiem: Record<string, unknown> = {}
  let truot = 0
  for (const k of KHO) {
    const ctx = await b.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dsf, colorScheme: k.toi ? 'dark' : 'light', serviceWorkers: 'block' })
    await ctx.addInitScript(() => { try { localStorage.setItem('omr_ph_sbd', '12121212') } catch { /* */ } })
    const du = { ...CHUNG, ...DU[k.con ?? 'tot'] }
    await ctx.route('**/*', async (r) => {
      const u = new URL(r.request().url())
      if (u.hostname === '127.0.0.1') return r.continue()
      const f = du[u.pathname]
      if (f) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(f()) })
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } })
      return u.hostname.endsWith('workers.dev') ? r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }) : r.abort()
    })
    const p = await ctx.newPage()
    const loi: string[] = []
    p.on('pageerror', (e) => loi.push(String(e).slice(0, 140)))
    await p.goto(`http://127.0.0.1:${cong}/ph`)
    await p.waitForSelector('[data-vung="ph-mot-trang"] .mtc-so[data-ma]', { timeout: 20000 })
    await p.evaluate(() => document.fonts.ready)
    if (k.bam) { await p.click(k.bam); await p.waitForSelector('[role="dialog"] .mtc-tam__than > *', { timeout: 15000 }); await p.waitForTimeout(400) }
    await p.waitForTimeout(250)
    const kq = await p.evaluate(() => {
      const de = document.documentElement
      const hien = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
      const goc: ParentNode = document.querySelector('[role="dialog"]') ?? document
      const dichNho = [...goc.querySelectorAll('button, a')].filter(hien).filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44 }).map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30))
      const coChu = (e: Element) => [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim())
      const tuCat = (cs: CSSStyleDeclaration) => cs.textOverflow === 'ellipsis' || ((cs as unknown as { webkitLineClamp: string }).webkitLineClamp && (cs as unknown as { webkitLineClamp: string }).webkitLineClamp !== 'none')
      const chuCat: string[] = [], baCham: string[] = []
      for (const e of [...document.querySelectorAll('.mtc *')].filter((x) => coChu(x) && hien(x))) {
        const cs = getComputedStyle(e), r = e.getBoundingClientRect(), ten = (e.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 34)
        if (tuCat(cs)) { if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2) baCham.push(ten) }
        else if ((cs.overflowY !== 'visible' && e.scrollHeight > e.clientHeight + 2) || (cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 2)) { chuCat.push('tự cắt: ' + ten); continue }
        for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
          const ca = getComputedStyle(a)
          if (ca.overflowY === 'auto' || ca.overflowY === 'scroll' || a.classList.contains('mtc')) break
          if (ca.overflow === 'visible') continue
          const ra = a.getBoundingClientRect()
          if (r.bottom > ra.bottom + 1 || r.top < ra.top - 1 || r.right > ra.right + 1) { (tuCat(ca) ? baCham : chuCat).push((tuCat(ca) ? '' : 'bị khung cắt: ') + ten); break }
        }
      }
      const mtc = document.querySelector('.mtc')!
      return { cao: de.scrollHeight, khongCuon: de.scrollHeight <= innerHeight && mtc.scrollHeight <= mtc.clientHeight + 1, tranNgang: de.scrollWidth - de.clientWidth, dichNho, chuCat, baCham }
    })
    let kb: number | null = null
    if (!k.chiKiem) {
      const tep = join(RA, k.ten + '.jpg')
      for (let q = k.dsf > 1 ? 66 : 80; q >= 30; q -= 6) { await p.screenshot({ path: tep, type: 'jpeg', quality: q }); kb = Math.round(statSync(tep).size / 1024); if (kb <= 150) break }
    }
    const dat = !loi.length && kq.khongCuon && kq.tranNgang <= 0 && !kq.dichNho.length && !kq.chuCat.length
    if (!dat) truot++
    kiem[k.ten] = { khung: `${k.w}×${k.h}`, sangToi: k.toi ? 'tối' : 'sáng', con: k.con ?? 'tot', bam: k.bam ?? null, dat, ...kq, loiTrang: loi, kb }
    console.log(`${dat ? 'ĐẠT ' : 'LỖI '} ${k.ten}: cao ${kq.cao}/${k.h} · tràn ${kq.tranNgang} · lỗi ${loi.length}${loi[0] ? ' ' + loi[0] : ''} · đích nhỏ ${kq.dichNho.length}${kq.dichNho.length ? ' ' + JSON.stringify(kq.dichNho.slice(0, 3)) : ''} · chữ cắt ${kq.chuCat.length ? JSON.stringify(kq.chuCat.slice(0, 4)) : 0} · «…» ${kq.baCham.length}${kb ? ` · ${kb} KB` : ''}`)
    await ctx.close()
  }
  await b.close()
  may.close()
  writeFileSync(join(__dirname, 'kiem-ban-that.json'), JSON.stringify({ ghiChu: 'Kiểm trên BẢN BUILD THẬT (dist/, chup-ban-that.ts), máy chủ giả qua page.route. khongCuon = trang (và khung .mtc) không cuộn; chuCat phải rỗng; baCham = rút gọn sạch bằng «…».', capNhat: new Date().toISOString(), kho: kiem }, null, 1) + '\n')
  console.log(truot ? `KIỂM BẢN THẬT: ${truot} khổ chưa đạt` : 'KIỂM BẢN THẬT: mọi khổ đạt')
})()
