// VIỆC (14) 06/10 21:05 — "chiến dịch #cd22009otTH đang chạy nhưng trên app học sinh báo hôm nay em chưa có câu nào": vì sao KẾ HOẠCH HÔM NAY của em TRỐNG?
// Đo trên D1 THẬT, CHỈ ĐỌC, CHỈ IN SỐ ĐẾM (repo công khai, nhật ký ai cũng đọc được: KHÔNG in số báo danh, tên em, mã câu, tên chiến dịch).
// Với chiến dịch khớp mẫu `OMR_CD_MAU` (mặc định "22009otTH", khớp mã hoặc tên): đọc trạng thái chiến dịch, rồi với từng em mẫu (≤ số em đưa vào dòng lệnh):
//   · dòng kế hoạch ĐÃ CHỐT hôm nay (`srs2_ke_hoach`): số câu Đảo/Đoàn, lập lúc nào, của chiến dịch nào;
//   · hồ sơ em (`docHoSo2`): chiến dịch đang chạy của em có phải chiến dịch này không, số câu trong phạm vi, số câu MỚI chưa làm, số câu đến lịch ôn;
//   · kế hoạch sẽ LẬP nếu lập lại bây giờ (`lapKeHoachNgay`, mã máy chủ thật) — so với bản đã chốt ⇒ phân biệt "chốt trống từ sáng" với "hồ sơ không có câu";
//   · số câu bị TẠM HOÃN (`tamHoanCauKhoa`: ca bảo vệ · rút khỏi kho · tự luận · nghi sai đáp án).
// Chạy ĐÚNG mã máy chủ, `env.DB` là lớp mỏng gọi D1 qua API REST: CHỈ nhận SELECT/WITH (riêng `CREATE … IF NOT EXISTS` của hàm "đảm bảo bảng" là không-làm-gì).
// Dùng: node do-kh-trong.mjs [số em mẫu]. Thử cục bộ: OMR_D1_CHE_DO=local (D1 giả trong bộ nhớ, nạp mẫu bằng OMR_D1_SEED).
import { writeSync } from 'node:fs'
import '../server/src/index' // nạp theo ĐÚNG thứ tự của Worker thật (các tệp máy chủ nhập vòng nhau)
import { docHoSo2, tamHoanCauKhoa, tuyChonKeHoachOmni, ngayVnCua, type KeHoachDaChot } from '../server/src/srs2-d1'
import { lapKeHoachNgay } from '../server/src/srs2-loi'
import { protectedQuestions } from '../server/src/game-v2-bank'
import { docCauNghiDem } from '../server/src/chan-khac-khoi'

type Row = Record<string, unknown>
const CHE_DO = process.env.OMR_D1_CHE_DO === 'local' ? 'local' : 'rest'
const MAU = (process.env.OMR_CD_MAU ?? '22009otTH').trim()
const SO_EM = Math.max(1, Math.min(80, Number(process.argv[2]) || 30))
const GIOI_HAN_MS = Number(process.env.OMR_GIOI_HAN_MS) || 1_100_000
const t0 = Date.now()
const ra = (s: string): void => { writeSync(1, `${String((Date.now() - t0) / 1000).padStart(7).slice(0, 7)}s ${s}\n`) }
setInterval(() => { if (Date.now() - t0 > GIOI_HAN_MS) { ra('GIỚI HẠN thời gian — dừng'); process.exit(3) } }, 2000).unref()

let soTruyVan = 0
async function hoiRest(sql: string, params: unknown[]): Promise<Row[]> {
  const tai = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN, db = process.env.OMR_D1_ID
  if (!tai || !token || !db) throw new Error('thiếu CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / OMR_D1_ID')
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${tai}/d1/database/${db}/query`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ sql, params }),
  })
  const j = (await r.json()) as { success?: boolean; errors?: { message?: string }[]; result?: { results?: Row[] }[] }
  if (!j.success) throw new Error(`D1 REST ${r.status}: ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 160)}`)
  return j.result?.[0]?.results ?? []
}
let hoiLocal: ((sql: string, params: unknown[]) => Row[]) | null = null
const laDocDuoc = (sql: string): boolean => /^\s*(SELECT|WITH)\b/i.test(sql)
const laDdlDamBao = (sql: string): boolean => /^\s*CREATE\s+(TABLE|INDEX|UNIQUE INDEX)\s+IF\s+NOT\s+EXISTS\b/i.test(sql)
async function hoi(sql: string, params: unknown[]): Promise<Row[]> {
  if (!laDocDuoc(sql)) throw new Error('CHỈ ĐỌC: chặn câu không phải SELECT')
  soTruyVan++
  return CHE_DO === 'local' ? hoiLocal!(sql, params) : hoiRest(sql, params)
}
function lopMong(query: string) {
  let values: unknown[] = []
  const st = {
    bind(...a: unknown[]) { values = a; return st },
    async first<T>() { return ((await hoi(query, values))[0] ?? null) as T | null },
    async all<T>() { return { results: (await hoi(query, values)) as T[], success: true, meta: { changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 } } },
    async run() { if (laDdlDamBao(query)) return { success: true, meta: { changes: 0 } }; throw new Error('CHỈ ĐỌC: chặn run()') },
    _q: query,
  }
  return st
}
const db = {
  prepare: lopMong,
  async batch(ds: { all: () => Promise<unknown> }[]) { const r = []; for (const s of ds) r.push(await s.all()); return r },
  async exec(sql: string) { if (laDdlDamBao(sql)) return { count: 0, duration: 0 }; throw new Error('CHỈ ĐỌC: chặn exec()') },
  withSession() { return db },
}
const env = { MA_BI_MAT: 'khong-dung', DB: db, DE: { async get() { return null }, async put() { return {} }, async delete() {} } } as never

if (CHE_DO === 'local') {
  const { taoD1That } = await import('../tests/_d1-that')
  const k = taoD1That()
  hoiLocal = (sql, params) => k.sql.prepare(sql).all(...(params as never[])) as Row[]
  if (process.env.OMR_D1_SEED) await (await import(process.env.OMR_D1_SEED)).default(k)
}

const parse = (v: unknown): string[] => { try { const a = JSON.parse(String(v ?? '[]')) as unknown; return Array.isArray(a) ? a.map(String) : [] } catch { return [] } }
const dem = (m: Map<string, number>, k: string): void => void m.set(k, (m.get(k) ?? 0) + 1)
const chuMap = (m: Map<string, number>): string => [...m].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join(' · ') || '—'

const nowMs = Date.now()
const homNay = ngayVnCua(nowMs)
ra(`BẮT ĐẦU · chế độ ${CHE_DO} · mẫu chiến dịch khớp mã/tên · hôm nay (VN) ${homNay}`)
const cds = await hoi('SELECT * FROM chien_dich WHERE id LIKE ? OR ten LIKE ? ORDER BY tao_luc DESC LIMIT 5', [`%${MAU}%`, `%${MAU}%`])
ra(`chiến dịch khớp mẫu: ${cds.length}`)
for (const [i, c] of cds.entries()) {
  const skal = Object.entries(c).filter(([k, v]) => !/sbd_json|qid_json|ma_de_json|ten$|^id$/.test(k) && (typeof v === 'number' || (typeof v === 'string' && v.length <= 40))).map(([k, v]) => `${k}=${String(v)}`).join(' · ')
  ra(`cd#${i + 1}: ${parse(c.sbd_json).length} em · ${parse(c.qid_json).length} câu · ${skal}`)
}
const cd = cds[0]
if (!cd) { ra('KHÔNG có chiến dịch khớp — dừng'); process.exit(0) }
const cdId = String(cd.id)
const dsEm = [...new Set(parse(cd.sbd_json))].sort()
const mau = dsEm.length <= SO_EM ? dsEm : Array.from({ length: SO_EM }, (_, i) => dsEm[Math.floor((i * dsEm.length) / SO_EM)]!)
ra(`em của chiến dịch: ${dsEm.length} · lấy mẫu ${mau.length}`)

// Phần chung đọc MỘT lần.
const [chan, nghi] = await Promise.all([protectedQuestions(env).catch(() => new Set<string>()), docCauNghiDem(env, nowMs)])
ra(`câu bảo vệ ca thi: ${chan.size} · câu nghi sai đáp án: ${nghi.size}`)

const nhomChot = new Map<string, number>(), nhomHs = new Map<string, number>(), nhomLap = new Map<string, number>(), nhomHoan = new Map<string, number>()
let i = 0
for (const sbd of mau) {
  i++
  try {
    const rows = await hoi('SELECT chien_dich_id, dao_json, doan_json, huyet_chien, tong, tao_luc FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?', [sbd, homNay])
    const row = rows[0] ?? null
    const dao = row ? parse(row.dao_json) : [], doan = row ? parse(row.doan_json) : []
    dem(nhomChot, !row ? 'chưa_có_dòng_chốt' : dao.length + doan.length === 0 ? 'chốt_TRỐNG' : 'chốt_có_câu')
    const hs = await docHoSo2(env, sbd, homNay)
    const cauCd = hs.cau.filter((c) => c.cd === cdId).length
    const moi = hs.cau.filter((c) => hs.tt.get(c.qid)?.laMoi).length
    const denHan = hs.cau.filter((c) => (hs.tt.get(c.qid)?.henOn ?? '9') <= homNay).length
    dem(nhomHs, `${hs.chienDich?.id === cdId ? 'đang_chạy=chiến_dịch_này' : hs.chienDich ? 'đang_chạy=chiến_dịch_KHÁC' : 'không_có_chiến_dịch_đang_chạy'}${hs.omni?.bat ? '·OMNI' : ''}`)
    const tc = hs.omni?.bat ? await tuyChonKeHoachOmni(env, sbd, nowMs, hs).catch(() => null) : null
    const lap = lapKeHoachNgay(hs.cau, hs.tt, tc ?? { homNay, hanNop: hs.chienDich?.hanNop ?? null })
    dem(nhomLap, lap.dao.length + lap.doan.length === 0 ? 'lập_lại_ra_TRỐNG' : 'lập_lại_ra_có_câu')
    let hoan = '—'
    if (row) {
      const kh: KeHoachDaChot = { ngay: homNay, chienDichId: row.chien_dich_id == null ? null : String(row.chien_dich_id), dao, doan, huyetChien: Number(row.huyet_chien) === 1, tong: dao.length + doan.length, conDao: dao, conDoan: doan }
      const sau = await tamHoanCauKhoa(env, kh, hs, Promise.resolve(chan), Promise.resolve(nghi))
      const th = sau.tamHoan ?? { ca: 0, kho: 0 }
      hoan = `ca ${th.ca} · kho ${th.kho} · tự luận ${th.tuLuan ?? 0} · nghi ${th.nghi ?? 0} ⇒ còn ${sau.tong}/${kh.tong}`
      dem(nhomHoan, sau.tong === 0 && kh.tong > 0 ? 'chốt_có_câu_nhưng_TẠM_HOÃN_hết' : 'không_bị_tạm_hoãn_hết')
    }
    ra(`em#${i}: dòng chốt ${row ? `Đảo ${dao.length} · Đoàn ${doan.length} · chiến dịch ${String(row.chien_dich_id) === cdId ? 'này' : row.chien_dich_id == null ? '(không)' : 'KHÁC'}` : 'CHƯA CÓ'} · hồ sơ: câu của chiến dịch ${cauCd} · câu mới ${moi} · đến lịch ôn ${denHan} · chiến dịch đang chạy ${hs.chienDich?.id === cdId ? 'này' : hs.chienDich ? 'KHÁC' : 'KHÔNG'}${hs.chienDichHet ? ` (${hs.chienDichHet.length} chiến dịch)` : ''} · lập lại bây giờ: Đảo ${lap.dao.length} · Đoàn ${lap.doan.length} · tạm hoãn: ${hoan}`)
  } catch (e) {
    ra(`em#${i}: LỖI ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`)
  }
}
ra('--- TỔNG HỢP (số đếm)')
ra(`dòng kế hoạch chốt hôm nay: ${chuMap(nhomChot)}`)
ra(`hồ sơ em: ${chuMap(nhomHs)}`)
ra(`lập lại bây giờ: ${chuMap(nhomLap)}`)
ra(`tạm hoãn: ${chuMap(nhomHoan)}`)
ra(`tổng truy vấn D1: ${soTruyVan}`)
process.exit(0)
