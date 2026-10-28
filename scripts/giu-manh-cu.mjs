// GIỮ MẢNH MÃ CỦA CÁC BẢN GẦN ĐÂY TRÊN CLOUDFLARE PAGES (28/10).
//
// LỖI THẦY CHỤP 28/10: màn «Đang tải bản mới của app» kèm
//   Failed to fetch dynamically imported module: …/assets/StudentPortalScreen-BEU0ucly.js
//
// NGUYÊN NHÂN GỐC. Mỗi lần `pages deploy` là một bản TRỌN VẸN: tệp nào không có trong `dist/` của bản mới thì
// biến mất khỏi bản sống. Tên mảnh có mã băm theo nội dung ⇒ mảnh đổi là tên đổi ⇒ mảnh của bản cũ mất ngay khi
// bản mới lên. Máy em đang mở app (hoặc mở lại app nằm nền từ tối qua) vẫn chạy mã bản cũ trong bộ nhớ; tới lúc
// cần một màn tải lười thì xin đúng tên cũ — Pages trả `index.html` (dòng `/* /index.html 200` của `_redirects`)
// ⇒ trình duyệt từ chối nạp HTML làm mã ⇒ lỗi trên. Đêm phát hành nhiều lần là gần như chắc gặp.
//
// CÁCH SỬA. Trước khi đẩy, chép lại vào `dist/assets` mọi mảnh của các bản gần đây, lấy thẳng từ bản đang sống.
//   · Bản sống có `manh-cu.json` (tệp này ghi ra): danh sách mảnh của từng bản đã giữ, mới nhất trước.
//   · Lần đầu chưa có danh sách ⇒ dò từ `index.html` + `sw.js` của bản sống, lần theo mọi tên mảnh trong mã.
//   · Giữ: ít nhất SO_BAN_TOI_THIEU bản mới nhất, cộng mọi bản trong GIU_TRONG_MS (máy để app nằm nền qua đêm
//     sau chục lần phát hành vẫn chạy được), trần SO_BAN_TOI_DA bản. Bản quá cũ tự rơi khỏi danh sách = được dọn.
//   · Giới hạn Pages: 20 000 tệp / bản, 25 MiB / tệp ⇒ trần TOI_DA_TEP tệp, bỏ tệp quá cỡ, bỏ bớt bản cũ nếu chạm trần.
//   · Chỉ nhận mảnh thật: 200 và KHÔNG phải HTML (Pages trả index.html cho tên không có).
// Mạng lỗi không bao giờ chặn phát hành: thiếu mảnh nào thì ghi cảnh báo, đẩy tiếp.
//
// Chạy: node scripts/giu-manh-cu.mjs dist --goc https://omr-app-b3u.pages.dev --id <commit>
// Precache của service worker dựng TRƯỚC bước này nên mảnh cũ không chui vào precache, không làm nặng lượt cài.
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const TEN_DANH_SACH = 'manh-cu.json'
export const SO_BAN_TOI_THIEU = 5
export const GIU_TRONG_MS = 72 * 3600 * 1000
export const SO_BAN_TOI_DA = 40
export const TOI_DA_TEP = 15_000
export const TOI_DA_BYTE_TEP = 25 * 1024 * 1024
const SO_LUONG_SONG_SONG = 16
const TOI_DA_DO = 4000

const DUOI = 'js|mjs|css|woff2?|ttf|otf|png|jpe?g|svg|webp|gif|wasm|data|json'
const TEN = `[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8}\\.(?:${DUOI})`
// Ba cách mã đã dựng gọi tên mảnh: `assets/Ten-abc12345.js` (index.html, sw.js, __vite__mapDeps), `./Ten-abc12345.js`
// (import động giữa hai mảnh cùng thư mục, url() trong CSS) và chuỗi trần `"Ten-abc12345.png"` (new URL(…, import.meta.url)).
const MAU_TEN = new RegExp(`(?:assets/|\\./|["'\`(])(${TEN})(?=["'\`)?#\\s,]|$)`, 'g')

/** Mọi tên mảnh nhắc tới trong một tệp mã / trang — dạng `assets/<tên>`. */
export function timTenManh(noiDung) {
  const ra = new Set()
  for (const m of String(noiDung).matchAll(MAU_TEN)) ra.add(`assets/${m[1]}`)
  return ra
}

/** Chọn bản cần giữ (mới nhất trước). `cacBan` là danh sách cũ, chưa tính bản đang đẩy. */
export function chonBanGiu(cacBan, nay = Date.now()) {
  const ds = (Array.isArray(cacBan) ? cacBan : []).filter((b) => b && typeof b.id === 'string' && Array.isArray(b.tep))
  // Bản đang đẩy chiếm một chỗ trong SO_BAN_TOI_THIEU.
  return ds
    .filter((b, i) => i < SO_BAN_TOI_THIEU - 1 || nay - Date.parse(b.luc || 0) < GIU_TRONG_MS)
    .slice(0, SO_BAN_TOI_DA - 1)
}

/** Danh sách tệp `assets/*` của bản vừa dựng. */
export function tepCuaBan(dist) {
  const thu = join(dist, 'assets')
  if (!existsSync(thu)) return []
  return readdirSync(thu).filter((t) => statSync(join(thu, t)).isFile()).sort().map((t) => `assets/${t}`)
}

const laHtml = (loai, than) => /text\/html/i.test(loai || '') || /^\s*<(?:!doctype|html)/i.test(than.subarray(0, 64).toString('utf8'))

/** Lấy một tệp từ bản sống; null nếu không có (404, hoặc Pages trả trang HTML thay tệp). */
export async function layTepMang(url) {
  for (let lan = 0; lan < 2; lan++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'cache-control': 'no-cache' } })
      if (r.status !== 200) return null
      const than = Buffer.from(await r.arrayBuffer())
      return { loai: r.headers.get('content-type') || '', than }
    } catch {
      /* thử lại một lần */
    }
  }
  return null
}

async function songSong(ds, viec) {
  let i = 0
  const tho = async () => {
    while (i < ds.length) {
      const j = i++
      await viec(ds[j])
    }
  }
  await Promise.all(Array.from({ length: Math.min(SO_LUONG_SONG_SONG, ds.length) }, tho))
}

/** Lần đầu (bản sống chưa có danh sách): dò mọi mảnh của bản sống từ trang vào + sw.js. */
export async function doBanSong(goc, layTep) {
  const daThay = new Set()
  const hang = []
  for (const vao of ['/', '/sw.js', '/cai-app/index.html']) {
    const t = await layTep(`${goc}${vao}`)
    if (!t) continue
    for (const ten of timTenManh(t.than.toString('utf8'))) if (!daThay.has(ten)) { daThay.add(ten); hang.push(ten) }
  }
  const coThat = new Set()
  while (hang.length && daThay.size < TOI_DA_DO) {
    const lo = hang.splice(0, hang.length)
    await songSong(lo, async (ten) => {
      const t = await layTep(`${goc}/${ten}`)
      if (!t || laHtml(t.loai, t.than)) return
      coThat.add(ten)
      if (/\.(?:m?js|css)$/.test(ten)) {
        for (const con of timTenManh(t.than.toString('utf8'))) if (!daThay.has(con)) { daThay.add(con); hang.push(con) }
      }
    })
  }
  return [...coThat].sort()
}

/** Đọc danh sách bản đã giữ trên bản sống; chưa có ⇒ dò bản sống thành một bản. */
export async function docDanhSachSong(goc, layTep, ghi = console.log) {
  const t = await layTep(`${goc}/${TEN_DANH_SACH}?t=${Date.now()}`)
  if (t && !laHtml(t.loai, t.than)) {
    try {
      const d = JSON.parse(t.than.toString('utf8'))
      if (Array.isArray(d?.ban)) return d.ban
    } catch {
      /* hỏng ⇒ dò lại */
    }
  }
  ghi(`[giu-manh-cu] bản sống chưa có ${TEN_DANH_SACH} — dò mảnh từ trang vào`)
  const tep = await doBanSong(goc, layTep)
  return tep.length ? [{ id: 'song-truoc', luc: new Date().toISOString(), tep }] : []
}

/** Việc chính. Trả về số liệu để in và để test kiểm. */
export async function giuManhCu({ dist, goc, id = 'chua-ro', nay = Date.now(), layTep = layTepMang, ghi = console.log }) {
  dist = resolve(dist)
  const banNay = tepCuaBan(dist)
  if (!banNay.length) throw new Error(`Không thấy ${dist}/assets — chạy build trước.`)
  const coSan = new Set(banNay)
  const tongTepKhac = demTep(dist) - banNay.length

  let cu = []
  try {
    cu = chonBanGiu(await docDanhSachSong(goc, layTep, ghi), nay)
  } catch (e) {
    ghi(`[giu-manh-cu] không đọc được bản sống (${e?.message || e}) — chỉ đẩy bản mới`)
  }
  // Chạm trần tệp ⇒ bỏ bớt bản cũ nhất.
  const hop = () => new Set(cu.flatMap((b) => b.tep).filter((t) => !coSan.has(t)))
  while (cu.length && tongTepKhac + banNay.length + hop().size > TOI_DA_TEP) cu = cu.slice(0, -1)

  const canLay = [...hop()].filter((t) => /^assets\/[A-Za-z0-9_.-]+$/.test(t))
  const daLay = new Set()
  let byte = 0
  await songSong(canLay, async (ten) => {
    const t = await layTep(`${goc}/${ten}`)
    if (!t || laHtml(t.loai, t.than) || t.than.length > TOI_DA_BYTE_TEP) return
    writeFileSync(join(dist, ten), t.than)
    daLay.add(ten)
    byte += t.than.length
  })
  const coMat = (t) => coSan.has(t) || daLay.has(t)
  const ban = [
    { id, luc: new Date(nay).toISOString(), tep: banNay },
    ...cu.map((b) => ({ id: b.id, luc: b.luc, tep: b.tep.filter(coMat) })).filter((b) => b.tep.length),
  ]
  writeFileSync(join(dist, TEN_DANH_SACH), JSON.stringify({ ghiChu: 'Mảnh mã của các bản gần đây, giữ lại cho máy còn chạy bản cũ (scripts/giu-manh-cu.mjs).', ban }))
  const kq = { banGiu: ban.length, tepBanNay: banNay.length, tepCuCanLay: canLay.length, tepCuDaLay: daLay.size, tepCuThieu: canLay.length - daLay.size, byteCu: byte, tongTep: demTep(dist) }
  ghi(`[giu-manh-cu] ${JSON.stringify(kq)}`)
  if (kq.tongTep > 20_000) throw new Error(`Quá giới hạn 20 000 tệp của Pages: ${kq.tongTep}`)
  return kq
}

function demTep(thu) {
  let n = 0
  for (const t of readdirSync(thu, { withFileTypes: true })) n += t.isDirectory() ? demTep(join(thu, t.name)) : 1
  return n
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const thamSo = process.argv.slice(2)
  const lay = (k) => { const i = thamSo.indexOf(k); return i >= 0 ? thamSo[i + 1] : undefined }
  const dist = thamSo.find((a, i) => !a.startsWith('--') && !thamSo[i - 1]?.startsWith('--')) || 'dist'
  const goc = (lay('--goc') || 'https://omr-app-b3u.pages.dev').replace(/\/+$/, '')
  giuManhCu({ dist, goc, id: lay('--id') }).catch((e) => {
    // Không chặn phát hành: thiếu mảnh cũ chỉ làm máy chạy bản cũ phải tải lại, còn hơn không phát hành được bản sửa.
    console.error(`[giu-manh-cu] lỗi: ${e?.message || e}`)
    process.exitCode = 1
  })
}
