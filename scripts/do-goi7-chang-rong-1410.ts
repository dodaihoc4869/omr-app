// LỖI 14/10 15h (thầy, ảnh màn em "Chặng học của em — Em đã hoàn thành phần được xếp hôm nay…"): "học sinh còn 1 câu nhưng app ko cho làm, sửa triệt để nhé".
// Đo trên D1 THẬT, CHỈ ĐỌC, CHỈ IN SỐ ĐẾM (repo công khai: KHÔNG in số báo danh, tên em, mã câu). Với mọi em có mức Gói 7 đã chốt hôm nay:
//   · đã làm / mức (`demHomNay7` — đúng số vòng tròn Hôm nay);
//   · em còn thiếu mức ⇒ lập kế hoạch bằng `lapGoi7` (mã máy chủ thật) rồi xét TỪNG câu của kế hoạch qua đúng các cổng của `startGoi7`
//     (siêu dữ liệu · câu chặn · "vừa làm 15 phút" · đọc câu theo ref · cổng khối · tự luận · chưa duyệt · dạng thầy giới hạn) ⇒ chặng có phát được câu không;
//   · kế hoạch rỗng mà còn thiếu mức ⇒ đếm câu bị loại CHỈ vì "vừa làm" (sửa / ôn).
// `env.DB` là lớp mỏng gọi D1 qua API REST: CHỈ GỬI SELECT/WITH; mọi lệnh ghi bị bỏ qua tại chỗ (trả "0 dòng đổi", không bao giờ tới D1).
import { writeSync } from 'node:fs'
import '../server/src/index' // nạp theo ĐÚNG thứ tự của Worker thật (các tệp máy chủ nhập vòng nhau)
import { demHomNay7, lapGoi7 } from '../server/src/goi-bai-7'
import { ngayVn7 } from '../server/src/goi-bai-7-loi'
import { docCauTheoRef, docKhoiEm } from '../server/src/game-v2-bank'
import { chanKhacKhoiEm } from '../server/src/chan-khac-khoi'
import { laCauTuLuan } from '../src/lib/cau-tu-luan'

type Row = Record<string, unknown>
const CHE_DO = process.env.OMR_D1_CHE_DO === 'local' ? 'local' : 'rest'
const GIOI_HAN_MS = Number(process.env.OMR_GIOI_HAN_MS) || 1_500_000
const SONG_SONG = Math.max(1, Math.min(6, Number(process.env.OMR_SONG_SONG) || 3))
const t0 = Date.now()
const ra = (s: string): void => { writeSync(1, `${String((Date.now() - t0) / 1000).padStart(7).slice(0, 7)}s ${s}\n`) }
setInterval(() => { if (Date.now() - t0 > GIOI_HAN_MS) { ra('GIỚI HẠN thời gian — dừng'); tongHop(); process.exit(3) } }, 2000).unref()

let soTruyVan = 0, soGhiBoQua = 0
async function hoiRest(sql: string, params: unknown[]): Promise<Row[]> {
  const tai = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN, db = process.env.OMR_D1_ID
  if (!tai || !token || !db) throw new Error('thiếu CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / OMR_D1_ID')
  for (let lan = 0; ; lan++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${tai}/d1/database/${db}/query`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ sql, params }),
    })
    const j = (await r.json().catch(() => ({}))) as { success?: boolean; errors?: { message?: string }[]; result?: { results?: Row[] }[] }
    if (j.success) return j.result?.[0]?.results ?? []
    if (lan < 2 && (r.status === 429 || r.status >= 500)) { await new Promise((ok) => setTimeout(ok, 1500 * (lan + 1))); continue }
    throw new Error(`D1 REST ${r.status}: ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 160)}`)
  }
}
let hoiLocal: ((sql: string, params: unknown[]) => Row[]) | null = null
const laDocDuoc = (sql: string): boolean => /^\s*(SELECT|WITH)\b/i.test(sql)
async function hoi(sql: string, params: unknown[]): Promise<Row[]> {
  if (!laDocDuoc(sql)) throw new Error('CHỈ ĐỌC: chặn câu không phải SELECT')
  soTruyVan++
  return CHE_DO === 'local' ? hoiLocal!(sql, params) : hoiRest(sql, params)
}
function lopMong(query: string) {
  let values: unknown[] = []
  const st = {
    bind(...a: unknown[]) { values = a; return st },
    async first<T>(cot?: string) { const r = (await hoi(query, values))[0] ?? null; return (cot && r ? r[cot] : r) as T | null },
    async all<T>() { return { results: (await hoi(query, values)) as T[], success: true, meta: { changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 } } },
    async raw() { return (await hoi(query, values)).map((r) => Object.values(r)) },
    // Lệnh ghi (chốt quota/mức lần đầu trong ngày) KHÔNG gửi tới D1: trả "0 dòng đổi" — hàm máy chủ đọc lại dòng đã có như khi bị trùng.
    async run() { if (!laDocDuoc(query)) { soGhiBoQua++; return { success: true, meta: { changes: 0 } } } await hoi(query, values); return { success: true, meta: { changes: 0 } } },
    _q: query,
  }
  return st
}
const db = {
  prepare: lopMong,
  async batch(ds: { all: () => Promise<unknown>; _q?: string }[]) {
    return Promise.all(ds.map((s) => (s._q && !laDocDuoc(s._q) ? (soGhiBoQua++, { results: [], success: true, meta: { changes: 0 } }) : s.all())))
  },
  async exec(_sql: string) { soGhiBoQua++; return { count: 0, duration: 0 } },
  withSession() { return db },
}
const env = { MA_BI_MAT: 'khong-dung', DB: db, DE: { async get() { return null }, async put() { return {} }, async delete() {} } } as never

if (CHE_DO === 'local') {
  const { taoD1That } = await import('../tests/_d1-that')
  const k = taoD1That()
  hoiLocal = (sql, params) => k.sql.prepare(sql).all(...(params as never[])) as Row[]
  if (process.env.OMR_D1_SEED) await (await import(process.env.OMR_D1_SEED)).default(k)
}

const dem = (m: Map<string, number>, k: string, n = 1): void => void m.set(k, (m.get(k) ?? 0) + n)
const chuMap = (m: Map<string, number>): string => [...m].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join(' · ') || '—'
const nhomEm = new Map<string, number>(), lyDoBo = new Map<string, number>(), vaiBo = new Map<string, number>()
function tongHop(): void {
  ra('--- TỔNG HỢP (số đếm)')
  ra(`em theo tình trạng: ${chuMap(nhomEm)}`)
  ra(`câu kế hoạch bị bỏ lúc mở chặng, theo lý do: ${chuMap(lyDoBo)}`)
  ra(`câu kế hoạch bị bỏ, theo vai: ${chuMap(vaiBo)}`)
  ra(`tổng truy vấn đọc D1: ${soTruyVan} · lệnh ghi bị bỏ qua tại chỗ (không gửi D1): ${soGhiBoQua}`)
}

const now = Date.now()
const ngay = ngayVn7(now)
ra(`BẮT ĐẦU · chế độ ${CHE_DO} · hôm nay (VN) ${ngay} · song song ${SONG_SONG}`)
const dsEm = (await hoi('SELECT sbd FROM goi_bai_7_muc_ngay WHERE ngay=? ORDER BY sbd', [ngay])).map((r) => String(r.sbd))
ra(`em có mức Gói 7 đã chốt hôm nay: ${dsEm.length}`)

async function xet(sbd: string, i: number): Promise<void> {
  const d = await demHomNay7(env, sbd, now)
  const daLam = Number(d.daLamHomNay), muc = d.toiThieu == null ? NaN : Number(d.toiThieu)
  if (!Number.isFinite(muc)) { dem(nhomEm, 'chưa_có_mức'); return }
  if (daLam >= muc) { dem(nhomEm, 'đủ_mức'); return }
  const lap = await lapGoi7(env, sbd, now)
  if (!lap) { dem(nhomEm, 'thiếu_mức·không_còn_gói'); return }
  if (!lap.control.enabled) { dem(nhomEm, 'thiếu_mức·thầy_tạm_dừng'); return }
  const khoi = await docKhoiEm(env, sbd)
  const cauGoi = new Map(lap.goi.flatMap((g) => g.cau).map((c) => [c.qid, c] as const).reverse())
  let phatDuoc = 0
  const boEm = new Map<string, number>()
  const ung = lap.plan.viec.map((v) => ({ v, meta: lap.hs.meta.get(v.qid) ?? cauGoi.get(v.qid) }))
  const conLai: typeof ung = []
  for (const x of ung) {
    const ly = !x.meta ? 'không_có_siêu_dữ_liệu' : lap.chan.has(x.v.qid) ? 'câu_bị_chặn' : lap.chan.has(x.meta.group) ? 'nhóm_bị_chặn' : lap.vuaLam.has(x.v.qid) ? 'vừa_làm_15_phút' : ''
    if (ly) { dem(boEm, ly); dem(vaiBo, `${x.v.vai}:${ly}`); continue }
    conLai.push(x)
  }
  const daDoc = (await Promise.all(conLai.map((x) => docCauTheoRef(env, x.meta!).then((q) => ({ ...x, q }), () => ({ ...x, q: null }))))).filter((x) => {
    if (x.q) return true
    dem(boEm, 'không_đọc_được_câu_theo_ref'); dem(vaiBo, `${x.v.vai}:không_đọc_được`); return false
  }) as (typeof conLai[number] & { q: NonNullable<Awaited<ReturnType<typeof docCauTheoRef>>> })[]
  const quaKhoi = new Set(await chanKhacKhoiEm(env, 'goi7', { sbd, khoiEm: khoi }, daDoc.map((x) => x.q)))
  for (const x of daDoc) {
    const q = x.q
    const ly = !quaKhoi.has(q) ? 'cổng_khối/câu_nghi' : laCauTuLuan(q) ? 'tự_luận' : !q.reviewed ? 'chưa_duyệt' : lap.control.types.length && (!q.dang || !lap.control.types.includes(q.dang)) ? 'ngoài_dạng_thầy_giới_hạn' : ''
    if (ly) { dem(boEm, ly); dem(vaiBo, `${x.v.vai}:${ly}`); continue }
    phatDuoc++
  }
  for (const [k, n] of boEm) dem(lyDoBo, k, n)
  const thieu = muc - daLam
  let nhom: string
  if (!lap.plan.viec.length) {
    // Kế hoạch rỗng: câu sửa / ôn bị loại CHỈ vì "vừa làm"?
    nhom = `thiếu_mức·kế_hoạch_RỖNG·thiếu_phủ=${lap.plan.thieuPhu > 0 ? 'có' : 'không'}`
  } else nhom = phatDuoc ? 'thiếu_mức·phát_được' : 'thiếu_mức·kế_hoạch_có_câu_nhưng_KHÔNG_PHÁT_ĐƯỢC'
  dem(nhomEm, nhom)
  ra(`em#${i}: đã làm ${daLam}/${muc} (thiếu ${thieu}) · kế hoạch ${lap.plan.viec.length} câu [${[...new Set(lap.plan.viec.map((v) => v.vai))].join(',')}] · phát được ${phatDuoc} · bỏ: ${chuMap(boEm)} · thiếu phủ ${lap.plan.thieuPhu} · vừa làm ${lap.vuaLam.size} · ${nhom}`)
}

let viTri = 0
await Promise.all(Array.from({ length: SONG_SONG }, async () => {
  for (;;) {
    const i = viTri++
    if (i >= dsEm.length) return
    try { await xet(dsEm[i]!, i + 1) } catch (e) { dem(nhomEm, 'LỖI_đo'); ra(`em#${i + 1}: LỖI ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`) }
  }
}))
tongHop()
process.exit(0)
