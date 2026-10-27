// BỎ CHỜ CHẶNG KIỂM TRA CÁ NHÂN KHI BẢN MỚI KHÔNG ĐỤNG LÀN KIỂM TRA (thầy duyệt 27/10: «Không chờ nếu không đụng kiểm tra»).
// Đo 27/10 (workflow do-ktcn-song-2710, chỉ đọc): 19:00–22:59 VN lúc nào cũng có 6–14 chặng đang làm thật ⇒ cổng chờ 45 phút rồi FAIL.
// Luật: KHÔNG chờ khi ĐỒNG THỜI (1) biết chắc commit Worker đang sống, (2) không tệp nào trong làn (scripts/lan-ktcn.json `tep`) bị đổi,
// (3) không tệp schema/migration/wrangler (`mauSchema`) bị đổi. Thiếu bất kỳ điều nào ⇒ chờ như cũ. Ca thi mở vẫn DỪNG ở kiem-phat-hanh-chua.mjs.
// Chỉ in tên tệp, không dữ liệu.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const SHA = /^[a-f0-9]{40}$/

/** Hàm thuần: `song` = commit Worker đang sống (hoặc null), `doi` = danh sách tệp đổi giữa bản sống và HEAD (hoặc null nếu không lấy được). */
export function quyetDinhChoKtcn({ song, doi, lan }) {
  if (!SHA.test(song ?? '')) return { cho: true, lyDo: 'Chưa xác định được commit Worker đang sống: chờ như cũ.' }
  if (!Array.isArray(doi)) return { cho: true, lyDo: 'Không so được bản sống với bản mới: chờ như cũ.' }
  const tep = new Set(lan?.tep ?? [])
  const mau = (lan?.mauSchema ?? []).map((m) => new RegExp(m, 'i'))
  if (!tep.size || !mau.length) return { cho: true, lyDo: 'Thiếu danh sách làn kiểm tra: chờ như cũ.' }
  const chan = doi.filter((f) => tep.has(f) || mau.some((m) => m.test(f)))
  if (chan.length) return { cho: true, lyDo: `Phải chờ KTCN: đổi tệp thuộc làn kiểm tra/schema: ${chan.join(', ')}`, chan }
  return { cho: false, lyDo: `Bỏ chờ KTCN: ${doi.length} tệp đổi, 0 tệp thuộc làn kiểm tra.` }
}

/** Commit Worker đang sống = nhãn `workers/tag` của bản 100% (deploy.yml đẩy với --tag=<sha>). Lỗi/thiếu ⇒ null. */
export async function shaWorkerSong({ token = process.env.CLOUDFLARE_API_TOKEN, account = process.env.CLOUDFLARE_ACCOUNT_ID, layVe = fetch } = {}) {
  try {
    const cf = async (path) => {
      const r = await layVe(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) })
      const j = await r.json()
      if (!r.ok || !j.success) throw new Error(`Cloudflare ${r.status}`)
      return j.result
    }
    const d = await cf('workers/scripts/omr/deployments')
    const v = (d.deployments ?? d)[0]?.versions
    if (!v || v.length !== 1 || v[0].percentage !== 100) return null
    const ver = await cf(`workers/scripts/omr/versions/${v[0].version_id}`)
    const tag = (ver.annotations ?? ver.metadata?.annotations)?.['workers/tag']
    return SHA.test(tag ?? '') ? tag : null
  } catch {
    return null
  }
}

/** Tệp đổi giữa commit sống và HEAD (lấy commit sống về bằng fetch nông nếu chưa có). Lỗi ⇒ null. */
export function tepDoiTu(song, { git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } = {}) {
  if (!SHA.test(song ?? '')) return null
  try {
    try { git(['cat-file', '-e', `${song}^{commit}`]) } catch { git(['fetch', '-q', '--no-tags', '--depth=1', 'origin', song]) }
    return git(['diff', '--no-renames', '--name-only', song, 'HEAD']).split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return null
  }
}

export async function xetChoKtcn({ lanPath = 'scripts/lan-ktcn.json' } = {}) {
  let lan = null
  try { lan = JSON.parse(readFileSync(lanPath, 'utf8')) } catch {}
  const song = await shaWorkerSong()
  const kq = quyetDinhChoKtcn({ song, doi: tepDoiTu(song), lan })
  console.log(kq.lyDo)
  return kq
}
