import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const goc = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const thuMuc = resolve(goc, 'docs/ra-soat-giao-dien-0710')
const diaChi = process.env.UI_AUDIT_URL || 'http://127.0.0.1:5198'
const tuyen = ['/gv', '/hs', '/ph']
const kichThuoc = [
  { ten: '360', width: 360, height: 800 },
  { ten: '390', width: 390, height: 844 },
  { ten: '768', width: 768, height: 1024 },
  { ten: '1440', width: 1440, height: 1000 },
]
const giaoDien = ['light', 'dark']

await mkdir(thuMuc, { recursive: true })
const trinhDuyet = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] })
const ketQua = []

for (const duong of tuyen) {
  for (const khung of kichThuoc) {
    for (const mau of giaoDien) {
      const nguCanh = await trinhDuyet.newContext({
        viewport: { width: khung.width, height: khung.height },
        colorScheme: mau,
        locale: 'vi-VN',
      })
      const trang = await nguCanh.newPage()
      const loiTrang = []
      trang.on('pageerror', (loi) => loiTrang.push(String(loi)))
      await trang.goto(`${diaChi}${duong}`, { waitUntil: 'networkidle', timeout: 30_000 })
      await trang.waitForTimeout(500)

      const doDuoc = await trang.evaluate(() => {
        const hien = (el) => {
          const cs = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0 && r.width > 0 && r.height > 0
        }
        const nhan = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80)
        const dieuKhien = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')].filter(hien)
        const nho = dieuKhien.flatMap((el) => {
          const r = el.getBoundingClientRect()
          if (r.width >= 44 && r.height >= 44) return []
          return [{ loai: el.tagName.toLowerCase(), nhan: nhan(el), rong: Math.round(r.width), cao: Math.round(r.height) }]
        })
        const thieuNhan = dieuKhien.flatMap((el) => {
          const tag = el.tagName.toLowerCase()
          const type = el.getAttribute('type') || ''
          if (tag === 'input' && ['hidden', 'submit', 'button'].includes(type)) return []
          if (nhan(el)) return []
          if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return []
          if (el.closest('label')) return []
          return [{ loai: tag, html: el.outerHTML.slice(0, 180) }]
        })
        const html = document.documentElement
        const body = document.body
        return {
          tieuDe: document.title,
          tranNgang: Math.max(html.scrollWidth, body.scrollWidth) - innerWidth,
          dieuKhien: dieuKhien.length,
          nho,
          thieuNhan,
        }
      })

      if ((khung.ten === '390' || khung.ten === '1440')) {
        const ten = `${duong.slice(1)}-${khung.ten}-${mau}.jpg`
        await trang.screenshot({ path: resolve(thuMuc, ten), fullPage: true, type: 'jpeg', quality: 82 })
      }
      ketQua.push({ tuyen: duong, kichThuoc: khung.ten, giaoDien: mau, ...doDuoc, loiTrang })
      await nguCanh.close()
    }
  }
}

await trinhDuyet.close()
const tong = {
  thoiDiem: new Date().toISOString(),
  diaChi,
  soLuot: ketQua.length,
  tranNgang: ketQua.filter((x) => x.tranNgang > 1).length,
  thieuNhan: ketQua.reduce((n, x) => n + x.thieuNhan.length, 0),
  loiTrang: ketQua.reduce((n, x) => n + x.loiTrang.length, 0),
  vungChamNho: ketQua.reduce((n, x) => n + x.nho.length, 0),
}
await writeFile(resolve(thuMuc, 'ket-qua.json'), `${JSON.stringify({ tong, ketQua }, null, 2)}\n`)
console.log(JSON.stringify(tong, null, 2))
