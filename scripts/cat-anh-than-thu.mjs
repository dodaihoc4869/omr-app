// CẮT ẢNH NHẸ CHO ĐẢO THẦN THÚ bản mới (đề bài prompt-dao-than-thu-moi.md, mục 1) → public/than-thu-v2/nho/
//
//   node scripts/cat-anh-than-thu.mjs                 ghi lại mọi tệp
//   node scripts/cat-anh-than-thu.mjs --kiem          KHÔNG ghi; thoát mã 1 nếu tệp trong nho/ khác bản sinh lại
//   node scripts/cat-anh-than-thu.mjs --xem <tệp.jpg> ghi thêm một tờ xem nhanh (mọi ảnh xếp lưới) để soát bằng mắt
//
// Công cụ: Chromium của Playwright (đã là devDependency; KHÔNG thêm phụ thuộc) — vẽ lên <canvas> rồi xuất WebP.
// Cùng máy + cùng bản Chromium thì ra cùng từng byte (`--kiem` dựa vào đó, giống scripts/sinh-logo-png.mjs).
//
// RA HAI BỘ ẢNH (màn mới chỉ nạp ảnh nhỏ này, lazy; KHÔNG xoá tệp gốc — màn cũ, màn chiếu, Đoàn còn dùng):
//   thu-<thú 0..7>-<dạng 0..5>.webp   ô tiến hoá đã tách nền, từ evolution-{elements,virtues}-cutout.png (3 MB/tấm).
//                                     Khung vuông 288 px, KHÔNG phóng/thu (giữ tương quan lớn dần giữa 6 dạng), thú căn giữa
//                                     theo chiều ngang, chân chạm đáy (chừa 6 px). Ô Thạch Quy dạng 3 đã lật sẵn cho cùng
//                                     hướng nhìn (evolutionMirror) → component không phải lật nữa. ≤ 60 KB.
//   thu-<thú>-<dạng>-be.webp          cùng hình, thu còn 96 px cho ô nhỏ (đường tiến hoá, thanh điều hướng). ≤ 12 KB.
//   the-<thú>-binh-thuong.webp        thẻ tranh 512 px từ combat/<thú>.png (mỗi tấm 2 trạng thái Bình thường | Cuồng nộ,
//   the-<thú>-cuong-no.webp           ~2,4 MB/tấm, trước giờ KHÔNG dùng). ≤ 90 KB.
//
// Bảng toạ độ ô tiến hoá chép từ src/game/than-thu-v2/evolution.ts (evolutionCrop); tests/dao-anh-nho.test.ts so từng ô.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const NGUON = resolve(GOC, 'public/than-thu-v2')
export const THU_MUC_RA = resolve(NGUON, 'nho')
export const SO_THU = 8, SO_DANG = 6
export const CANH_THU = 288, CANH_BE = 96, CANH_THE = 512
export const TRAN_THU = 60 * 1024, TRAN_BE = 12 * 1024, TRAN_THE = 90 * 1024
export const TRANG_THAI = ['binh-thuong', 'cuong-no']
export const tenAnhThu = (thu, dang, be = false) => `thu-${thu}-${dang}${be ? '-be' : ''}.webp`
export const tenAnhThe = (thu, trangThai) => `the-${thu}-${trangThai}.webp`

/** Y hệt evolutionCrop(index, level) nhưng nhận thẳng số dạng 0..5 (test so với bản TS). */
export function oTienHoa(thu, dang) {
  const atlas = thu < 4 ? 'elements' : 'virtues', row = thu % 4
  const cols = atlas === 'elements' ? [0, 215, 449, 710, 982, 1250, 1536] : [0, 244, 497, 747, 995, 1255, 1536]
  const rows = atlas === 'elements' ? [0, 263, 514, 758, 1024] : [0, 258, 503, 771, 1024]
  const x = cols[dang], y = rows[row]
  let right = cols[dang + 1], bottom = rows[row + 1]
  if (atlas === 'elements' && row === 1) bottom = 509
  if (atlas === 'elements' && row === 2) bottom = 750
  if (atlas === 'elements' && row === 3 && dang === 3) right = 970
  if (atlas === 'virtues' && row === 3 && dang === 1) right = 475
  return { atlas, x, y, width: right - x, height: bottom - y, lat: thu === 0 && dang === 2 }
}

/**
 * Tấm combat 1536×1024: tên thú + tên hệ ở trên (tới y≈188; riêng Ái Hồ chữ "TÌNH YÊU" xuống tới y≈205), nhãn trạng thái ở
 * dưới (từ y≈890); mỗi nửa một trạng thái. `loang` = dải chữ trang trí ở mép tấm Minh Linh lọt vào khung: tô đè bằng chính
 * màu nền sát cạnh trong của dải (nền là màn sương nhạt nên không lộ).
 */
export function oThe(thu, trangThai) {
  const trai = trangThai === 'binh-thuong'
  // Tinh Lang, Minh Linh: vạch chia giữa tấm nằm lệch trái (x≈713 / 726) → lùi khung nửa trái cho khỏi dính vạch
  const o = { x: trai ? (thu === 4 ? 14 : thu === 7 ? 30 : 58) : 794, y: thu === 5 ? 208 : 192, canh: 684, loang: [] }
  if (thu === 7) o.loang.push(trai ? { x0: 30, x1: 100, y0: 192, y1: 340, lay: 'phai' } : { x0: 1436, x1: 1478, y0: 192, y1: 300, lay: 'trai' })
  return o
}

export function danhSachTep() {
  const ds = []
  for (let thu = 0; thu < SO_THU; thu++) {
    for (let dang = 0; dang < SO_DANG; dang++) {
      ds.push({ ten: tenAnhThu(thu, dang), loai: 'thu', thu, dang, tran: TRAN_THU })
      ds.push({ ten: tenAnhThu(thu, dang, true), loai: 'be', thu, dang, tran: TRAN_BE })
    }
    for (const trangThai of TRANG_THAI) ds.push({ ten: tenAnhThe(thu, trangThai), loai: 'the', thu, trangThai, tran: TRAN_THE })
  }
  return ds
}

// ── phần chạy trong trang Chromium ──
async function veTrongTrang({ viec, canhThu, canhBe, canhThe, xem }) {
  const anh = new Map()
  const nap = async (khoa) => {
    if (!anh.has(khoa)) {
      const img = new Image(); img.src = window.__nguon[khoa]; await img.decode(); anh.set(khoa, img)
    }
    return anh.get(khoa)
  }
  const xuat = (canvas, tran) => {
    // hạ chất lượng từng nấc cố định cho tới khi vừa trần — tất định
    for (const q of [0.86, 0.8, 0.74, 0.68, 0.6, 0.5, 0.4]) {
      const url = canvas.toDataURL('image/webp', q), b64 = url.slice(url.indexOf(',') + 1)
      if (b64.length * 3 / 4 <= tran) return { b64, q }
    }
    throw new Error('không ép nổi xuống dưới trần')
  }
  const ra = [], luoi = []
  for (const v of viec) {
    const img = await nap(v.nguon)
    let c = document.createElement('canvas'), g = c.getContext('2d')
    if (v.loai === 'the') {
      c.width = c.height = canhThe; g.imageSmoothingQuality = 'high'
      g.drawImage(img, v.o.x, v.o.y, v.o.canh, v.o.canh, 0, 0, canhThe, canhThe)
      const k = canhThe / v.o.canh
      for (const l of v.o.loang) {
        const x0 = Math.floor((l.x0 - v.o.x) * k), x1 = Math.ceil((l.x1 - v.o.x) * k), y0 = Math.floor((l.y0 - v.o.y) * k), y1 = Math.ceil((l.y1 - v.o.y) * k)
        for (let y = y0; y < y1; y++) {
          // trung bình 6 điểm nền sát cạnh trong của dải, mờ dần về 0 ở 12 dòng cuối cho khỏi lộ mép
          const d = g.getImageData(l.lay === 'phai' ? x1 + 1 : x0 - 7, y, 6, 1).data, tb = [0, 0, 0]
          for (let i = 0; i < 6; i++) for (let c = 0; c < 3; c++) tb[c] += d[i * 4 + c] / 6
          g.fillStyle = `rgba(${Math.round(tb[0])},${Math.round(tb[1])},${Math.round(tb[2])},${Math.min(1, (y1 - y) / 12)})`
          g.fillRect(x0, y, x1 - x0, 1)
        }
      }
    } else {
      // ô tiến hoá: tìm hộp bao phần có hình (alpha > 24) rồi đặt vào khung vuông, chân chạm đáy
      const t = document.createElement('canvas'); t.width = v.o.width; t.height = v.o.height
      const tg = t.getContext('2d')
      if (v.o.lat) { tg.translate(t.width, 0); tg.scale(-1, 1) }
      tg.drawImage(img, v.o.x, v.o.y, v.o.width, v.o.height, 0, 0, v.o.width, v.o.height)
      const d = tg.getImageData(0, 0, t.width, t.height).data
      let x0 = t.width, x1 = -1, y1 = -1
      for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) if (d[(y * t.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y > y1) y1 = y }
      c.width = c.height = canhThu
      g.drawImage(t, Math.round((canhThu - (x1 - x0 + 1)) / 2) - x0, canhThu - 6 - (y1 + 1))
      if (v.loai === 'be') {
        const b = document.createElement('canvas'); b.width = b.height = canhBe
        const bg = b.getContext('2d'); bg.imageSmoothingQuality = 'high'; bg.drawImage(c, 0, 0, canhBe, canhBe); c = b
      }
    }
    const { b64, q } = xuat(c, v.tran)
    ra.push({ ten: v.ten, b64, q })
    if (xem && v.loai !== 'be') luoi.push(c)
  }
  let toXem = ''
  if (xem) {
    const o = 160, cot = 8, to = document.createElement('canvas'), g = to.getContext('2d')
    to.width = o * cot; to.height = o * Math.ceil(luoi.length / cot)
    g.fillStyle = 'rgb(20,26,60)'; g.fillRect(0, 0, to.width, to.height)
    luoi.forEach((c, i) => g.drawImage(c, (i % cot) * o, Math.floor(i / cot) * o, o, o))
    const url = to.toDataURL('image/jpeg', 0.6); toXem = url.slice(url.indexOf(',') + 1)
  }
  return { ra, toXem }
}

async function main() {
  const chiKiem = process.argv.includes('--kiem')
  const iXem = process.argv.indexOf('--xem'), tepXem = iXem > 0 ? process.argv[iXem + 1] : ''
  const { chromium } = await import('playwright')
  const viec = danhSachTep().map(t => t.loai !== 'the'
    ? { ...t, o: oTienHoa(t.thu, t.dang), nguon: `evolution-${oTienHoa(t.thu, t.dang).atlas}-cutout.png` }
    : { ...t, o: oThe(t.thu, t.trangThai), nguon: `combat/${t.thu}.png` })
  const browser = await chromium.launch({ headless: true })
  let lech = 0
  try {
    const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()
    await page.setContent('<!doctype html><title>cat-anh</title>')
    // mỗi lượt một thú để không giữ quá nhiều ảnh 3 MB trong trang
    const toXemTatCa = []
    for (let thu = 0; thu < SO_THU; thu++) {
      const phan = viec.filter(v => v.thu === thu), nguon = {}
      for (const v of phan) nguon[v.nguon] ??= `data:image/png;base64,${readFileSync(resolve(NGUON, v.nguon)).toString('base64')}`
      await page.evaluate(n => { window.__nguon = n }, nguon)
      const { ra, toXem } = await page.evaluate(veTrongTrang, { viec: phan, canhThu: CANH_THU, canhBe: CANH_BE, canhThe: CANH_THE, xem: !!tepXem })
      if (toXem) toXemTatCa.push(toXem)
      for (const r of ra) {
        const buf = Buffer.from(r.b64, 'base64'), dich = resolve(THU_MUC_RA, r.ten)
        if (chiKiem) {
          if (!existsSync(dich) || !readFileSync(dich).equals(buf)) { lech++; console.log(`LỆCH ${r.ten}`) }
        } else {
          mkdirSync(THU_MUC_RA, { recursive: true }); writeFileSync(dich, buf)
          console.log(`${r.ten}\t${(buf.length / 1024).toFixed(1)} KB\tq=${r.q}`)
        }
      }
    }
    if (tepXem && toXemTatCa.length) {
      // ghép các dải (mỗi thú một dải 8 ô) thành một tờ
      const b64 = await page.evaluate(async ds => {
        const imgs = await Promise.all(ds.map(async s => { const i = new Image(); i.src = `data:image/jpeg;base64,${s}`; await i.decode(); return i }))
        const to = document.createElement('canvas'); to.width = imgs[0].width; to.height = imgs.reduce((s, i) => s + i.height, 0)
        const g = to.getContext('2d'); let y = 0; for (const i of imgs) { g.drawImage(i, 0, y); y += i.height }
        const url = to.toDataURL('image/jpeg', 0.55); return url.slice(url.indexOf(',') + 1)
      }, toXemTatCa)
      writeFileSync(tepXem, Buffer.from(b64, 'base64'))
    }
  } finally { await browser.close() }
  if (chiKiem) { console.log(lech ? `${lech} tệp lệch — chạy lại không --kiem rồi commit` : 'khớp từng byte'); if (lech) process.exit(1) }
}

// chỉ chạy khi gọi thẳng (test import được bảng toạ độ mà không mở Chromium)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
