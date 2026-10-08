// Chẩn đoán CHỈ ĐỌC một kế hoạch cá nhân hoá trên D1 thật.
// Nhật ký chỉ in hạng và số đếm; không in SBD, tên, mã chiến dịch, mã câu hay nội dung câu.
import { chanDoanEm } from '../server/src/srs2-d1'

type Row = Record<string, unknown>
const sbd = (process.argv[2] ?? '').trim()
if (!sbd) throw new Error('Thiếu học sinh cần kiểm tra.')

async function hoi(sql: string, params: unknown[]): Promise<Row[]> {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw new Error('Chẩn đoán chỉ được đọc dữ liệu.')
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN
  const database = process.env.OMR_D1_ID
  if (!account || !token || !database) throw new Error('Thiếu cấu hình D1.')
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params }),
    signal: AbortSignal.timeout(60_000),
  })
  const j = await r.json() as { success?: boolean; result?: { results?: Row[] }[] }
  if (!r.ok || !j.success) throw new Error(`Không đọc được D1 (${r.status}).`)
  return j.result?.[0]?.results ?? []
}

function cauLenh(sql: string) {
  let params: unknown[] = []
  const st = {
    bind(...x: unknown[]) { params = x; return st },
    async first<T>() { return ((await hoi(sql, params))[0] ?? null) as T | null },
    async all<T>() { return { results: await hoi(sql, params) as T[], success: true, meta: { changes: 0, rows_read: 0, rows_written: 0 } } },
    async run() { throw new Error('Chẩn đoán chỉ được đọc dữ liệu.') },
  }
  return st
}

const DB = {
  prepare: cauLenh,
  async batch(ds: { all: () => Promise<unknown> }[]) { const ra = []; for (const x of ds) ra.push(await x.all()); return ra },
  withSession() { return DB },
}
const env = { DB, MA_BI_MAT: 'khong-dung', DE: { async get() { return null } } } as never
const kq = await chanDoanEm(env, sbd, Date.now()) as Record<string, unknown>
const chot = (kq.keHoachDaChot ?? null) as Record<string, unknown> | null
const duKien = (kq.lapLaiSeRa ?? {}) as Record<string, unknown>
const omni = (kq.omni ?? null) as Record<string, unknown> | null
const omniLap = (omni?.lapLaiSeRa ?? null) as Record<string, unknown> | null
const tongDuKien = Number(duKien.dao ?? 0) + Number(duKien.doan ?? 0)
const suKien = await hoi("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd=? AND ngay_vn=date('now','+7 hours') AND nguon='game'", [sbd])

console.log(JSON.stringify({
  ngay: kq.ngay,
  coChienDich: kq.chienDichDangChay != null,
  omni: omni != null,
  hangChung: kq.hangChung,
  soCauChienDich: kq.soCauChienDich,
  soCauMoi: kq.soCauMoi,
  keHoachDaChotTong: chot?.tong ?? null,
  daBatDauHomNay: Number(suKien[0]?.n ?? 0) > 0,
  soLuotGameHomNay: Number(suKien[0]?.n ?? 0),
  lapLaiTheoHoSoTong: omniLap ? Number(omniLap.tran ?? 0) : tongDuKien,
  lapLaiDao: duKien.dao ?? null,
  lapLaiDoan: duKien.doan ?? null,
}))
