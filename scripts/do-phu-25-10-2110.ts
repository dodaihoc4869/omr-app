// PHỦ CÂU MỚI / CÂU CŨ TỚI HẾT 25/10 (thầy 21/10: "tới hết ngày 25/10 mỗi học sinh được phủ hết câu mới và làm được bao nhiêu câu cũ ở bài kiểm tra và sửa lỗi").
// Chạy ĐÚNG mã máy chủ (`lapGoi7`, `quotaCacGoiHocKt`, `quotaGoi7`) trên D1 THẬT, CHỈ ĐỌC (lớp mỏng chỉ gửi SELECT/WITH; lệnh ghi bị bỏ qua tại chỗ),
// CHỈ IN SỐ ĐẾM GỘP (repo công khai: không số báo danh / tên / mã câu / mã bài). Giả định mô phỏng: em làm ĐỦ phần câu mới theo lịch mỗi ngày.
import { writeSync } from 'node:fs'
import '../server/src/index' // nạp theo ĐÚNG thứ tự của Worker thật (các tệp máy chủ nhập vòng nhau)
import { lapGoi7, SQL_LUOT_GOI7 } from '../server/src/goi-bai-7'
import { ngayVn7, congNgay7, quotaGoi7, soNgayCon7 } from '../server/src/goi-bai-7-loi'
import { quotaCacGoiHocKt } from '../server/src/kiem-tra-ca-nhan-loi'
import { coKtCn } from '../server/src/kiem-tra-ca-nhan'

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
    // Lưu phiên chặng mới (`startGoi7`): trả "1 dòng" để hàm đi hết như thật — vẫn KHÔNG gửi tới D1.
    async run() { if (!laDocDuoc(query)) { soGhiBoQua++; return { success: true, meta: { changes: /INSERT INTO game_v2_session/i.test(query) ? 1 : 0 } } } await hoi(query, values); return { success: true, meta: { changes: 0 } } },
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


// ───── ĐO: tới hết MOC (mặc định 25/10) mỗi em phủ hết câu MỚI chưa, sửa lỗi / ôn / kiểm tra cá nhân được bao nhiêu câu CŨ ─────
const MOC = process.env.OMR_MOC || '2026-10-25'
const now = Date.now()
const ngay = ngayVn7(now)
const soNgayDen = (d: string): number => Math.max(1, Math.round((Date.parse(MOC) - Date.parse(d)) / 86400000) + 1)
const NGAY_TRONG_MOC = soNgayDen(ngay)

const dem = (m: Map<string, number>, k: string, n = 1): void => void m.set(k, (m.get(k) ?? 0) + n)
const chuMap = (m: Map<string, number>): string => [...m].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'vi')).map(([k, n]) => `${k}=${n}`).join(' · ') || '—'
/** Xô theo mốc: nhãn "≤e" cho mốc nhỏ nhất ≥ n, cuối cùng ">e_cuối". */
const xo = (n: number, mocs: number[]): string => { for (const e of mocs) if (n <= e) return `≤${String(e).padStart(3, '0')}`; return `>${String(mocs[mocs.length - 1]).padStart(3, '0')}` }
const tong = (a: number[]): number => a.reduce((x, y) => x + y, 0)
const trungVi = (a: number[]): number => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]! }

const tk = {
  soEm: 0, khongGoi: 0, tamDung: 0, loi: 0,
  chuaNay: [] as number[], chuaSauMoc: [] as number[], chuaHanTruocMoc: [] as number[],
  xoChuaNay: new Map<string, number>(), xoChuaSauMoc: new Map<string, number>(),
  phan: new Map<string, number>(), quaHan: 0, vuotSuc: 0, nhieuGoi: new Map<string, number>(),
  pace: new Map<string, number>(), paceTb: [] as number[], canTb: [] as number[],
  muc: [] as number[], xoMuc: new Map<string, number>(),
  loiMo: [] as number[], suaPool: [] as number[], suaLam: [] as number[], xoSuaPool: new Map<string, number>(), hetSua: 0,
  onPool: [] as number[], xoOnPool: new Map<string, number>(), vaiHomNay: new Map<string, number>(),
  nKt: [] as number[], xoNKt: new Map<string, number>(), trangThaiKt: new Map<string, number>(),
  batKt: null as boolean | null,
}
function tongHop(): void {
  ra('--- TỔNG HỢP (số đếm gộp, không mã em)')
  ra(`mốc ${MOC} · hôm nay (VN) ${ngay} · số ngày tính cả hôm nay tới mốc: ${NGAY_TRONG_MOC} · lịch kiểm tra riêng ${tk.batKt === null ? '?' : tk.batKt ? 'BẬT' : 'TẮT'}`)
  ra(`em đo: ${tk.soEm} · không còn gói: ${tk.khongGoi} · thầy tạm dừng: ${tk.tamDung} · lỗi đo: ${tk.loi}`)
  ra(`== A. CÂU MỚI (chưa gặp trong các gói đang chạy)`)
  ra(`chưa gặp hiện tại — tổng ${tong(tk.chuaNay)} · trung vị ${trungVi(tk.chuaNay)} · lớn nhất ${Math.max(0, ...tk.chuaNay)} · xô: ${chuMap(tk.xoChuaNay)}`)
  ra(`NẾU em làm đủ phần câu mới theo lịch mỗi ngày tới hết ${MOC}: còn chưa gặp — tổng ${tong(tk.chuaSauMoc)} · lớn nhất ${Math.max(0, ...tk.chuaSauMoc)} · xô: ${chuMap(tk.xoChuaSauMoc)}`)
  ra(`  trong đó phần của gói có hạn ≤ ${MOC} còn lại — tổng ${tong(tk.chuaHanTruocMoc)}`)
  ra(`phân loại em: ${chuMap(tk.phan)}`)
  ra(`em có gói QUÁ HẠN còn câu chưa gặp: ${tk.quaHan} · em có ngày lịch vượt sức (Σ quota > 24, hoặc > 12 ngày kiểm tra): ${tk.vuotSuc} · số gói còn câu chưa gặp/em: ${chuMap(tk.nhieuGoi)}`)
  ra(`nhịp THỰC 3 ngày qua (câu khác nhau thuộc gói/ngày, gồm cả làm lại) so với nhịp CẦN: ${chuMap(tk.pace)} · nhịp thực trung vị ${trungVi(tk.paceTb)} · nhịp cần trung vị ${trungVi(tk.canTb)}`)
  ra(`mức hôm nay M: trung vị ${trungVi(tk.muc)} · xô: ${chuMap(tk.xoMuc)}`)
  ra(`== B. SỬA LỖI (câu cũ em từng sai)`)
  ra(`lỗi đang mở/chờ kiểm — tổng ${tong(tk.loiMo)} · trung vị ${trungVi(tk.loiMo)}`)
  ra(`câu sửa XẾP ĐƯỢC (kế hoạch + dự phòng) — tổng ${tong(tk.suaPool)} · xô: ${chuMap(tk.xoSuaPool)}`)
  ra(`NẾU làm đủ trần sửa mỗi ngày: sửa được tới hết ${MOC} — tổng ${tong(tk.suaLam)} · em dọn hết kho sửa kịp: ${tk.hetSua}/${tk.soEm - tk.khongGoi - tk.tamDung}`)
  ra(`== C. ÔN LẠI (câu cũ đến hạn ôn)`)
  ra(`kho ôn xếp được — tổng ${tong(tk.onPool)} · xô: ${chuMap(tk.xoOnPool)} · việc kế hoạch hôm nay theo vai: ${chuMap(tk.vaiHomNay)}`)
  ra(`== D. KIỂM TRA CÁ NHÂN trong ${ngay} → ${MOC}`)
  ra(`số bài/em — tổng ${tong(tk.nKt)} (×28 câu = ${28 * tong(tk.nKt)}) · xô: ${chuMap(tk.xoNKt)} · trạng thái: ${chuMap(tk.trangThaiKt)}`)
  ra(`tổng truy vấn đọc D1: ${soTruyVan} · lệnh ghi bị bỏ qua tại chỗ (không gửi D1): ${soGhiBoQua}`)
}

ra(`BẮT ĐẦU · chế độ ${CHE_DO} · hôm nay (VN) ${ngay} · mốc ${MOC} · song song ${SONG_SONG}`)
tk.batKt = await coKtCn(env).catch(() => null)
const dsEm = (await hoi('SELECT DISTINCT sbd FROM goi_bai_7_em WHERE bat_dau <= ? AND han >= ? ORDER BY sbd', [ngay, ngay])).map((r) => String(r.sbd))
ra(`em có gói đang trong hạn (goi_bai_7_em): ${dsEm.length}`)

async function xet(sbd: string): Promise<void> {
  tk.soEm++
  const lap = await lapGoi7(env, sbd, now)
  if (!lap) { tk.khongGoi++; return }
  if (!lap.control.enabled) { tk.tamDung++; return }
  // Lịch kiểm tra riêng của em (đúng cách `lapGoi7` đọc: ngày → n nếu ngày ấy có học, 2 nếu ngày ấy chỉ kiểm tra).
  const lichR = await hoi(`SELECT k.ngay AS ngay, MAX(COALESCE(json_extract(km.meta_json,'$.baiNgayToiThieu'),0)) AS hoc, COUNT(*) AS n FROM kiem_tra_ca_nhan k LEFT JOIN kiem_tra_ca_nhan_meta km ON km.id=k.id WHERE k.sbd=? AND k.trang_thai<>'cho_nguon' AND k.ngay>=? GROUP BY k.ngay`, [sbd, ngay])
  const lich = new Map<string, number>(lichR.map((r) => [String(r.ngay), Number(r.hoc) ? Number(r.n) : 2]))
  const ktR = await hoi('SELECT ngay, trang_thai FROM kiem_tra_ca_nhan WHERE sbd=? AND ngay>=? AND ngay<=?', [sbd, ngay, MOC])
  tk.nKt.push(ktR.length); dem(tk.xoNKt, xo(ktR.length, [0, 1, 2, 3])); for (const r of ktR) dem(tk.trangThaiKt, String(r.trang_thai))

  // A. câu mới: trạng thái bây giờ
  const goi = lap.goi
  const tatCa = new Set(goi.flatMap((g) => g.cau.map((c) => c.qid))), daGapTat = new Set(goi.flatMap((g) => [...g.daGap]))
  let chuaNay = 0; for (const q of tatCa) if (!daGapTat.has(q)) chuaNay++
  tk.chuaNay.push(chuaNay); dem(tk.xoChuaNay, xo(chuaNay, [0, 12, 24, 48, 96, 200]))
  const st = goi.map((g) => ({ id: g.id, han: g.han, u: g.cau.length - g.daGap.size + g.gapNgay.size, quotaNay: g.quota }))
  const goiConCau = st.filter((s) => s.u > 0)
  dem(tk.nhieuGoi, String(goiConCau.length))
  if (goiConCau.some((s) => s.han < ngay)) tk.quaHan++
  // Mô phỏng: hôm nay dùng đúng quota đã chốt của gói, các ngày sau dùng đúng hàm chia quota của máy chủ; em làm đủ phần câu mới mỗi ngày.
  let vuot = false
  for (let d = ngay, i = 0; d <= MOC; d = congNgay7(d, 1), i++) {
    const quotas = new Map<string, number>()
    if (i === 0) for (const s of st) quotas.set(s.id, s.quotaNay)
    else if (lich.size) for (const [k, v] of quotaCacGoiHocKt(st.map((s) => ({ id: s.id, han: s.han, chuaGap: s.u })), d, lich)) quotas.set(k, v)
    else for (const s of st) quotas.set(s.id, quotaGoi7(s.u, d, s.han))
    const sum = tong(st.map((s) => Math.min(s.u, quotas.get(s.id) ?? 0)))
    if (sum > (lich.get(d) === 1 ? 12 : 24)) vuot = true
    for (const s of st) s.u -= Math.min(s.u, quotas.get(s.id) ?? 0)
  }
  if (vuot) tk.vuotSuc++
  const uSau = tong(st.map((s) => s.u)), uHanTruoc = tong(st.filter((s) => s.han <= MOC).map((s) => s.u))
  tk.chuaSauMoc.push(uSau); tk.chuaHanTruocMoc.push(uHanTruoc); dem(tk.xoChuaSauMoc, xo(uSau, [0, 12, 24, 48, 96, 200]))
  dem(tk.phan, chuaNay === 0 ? 'A_đã_gặp_hết_câu_mới_từ_trước' : uSau === 0 ? 'B_phủ_hết_trước_hết_mốc(nếu làm đủ kế hoạch)' : uHanTruoc === 0 ? 'C_gói_hạn≤mốc_xong,_còn_gói_hạn_sau_mốc' : 'D_KHÔNG_kịp_phủ_gói_hạn≤mốc')
  // Nhịp thực 3 ngày qua so với nhịp cần để kịp hạn gần nhất của gói còn câu.
  if (chuaNay > 0) {
    const ids = JSON.stringify(goi.map((g) => g.id))
    const tu = congNgay7(ngay, -3)
    const r = await hoi(`SELECT ngay_vn, COUNT(DISTINCT qid) AS n FROM su_kien_hoc WHERE sbd=? AND ngay_vn>=? AND ngay_vn<? AND qid IN (SELECT qid FROM goi_bai_7_cau WHERE goi_id IN (SELECT value FROM json_each(?))) AND ${SQL_LUOT_GOI7} GROUP BY ngay_vn`, [sbd, tu, ngay, ids])
    const thuc = tong(r.map((x) => Number(x.n))) / 3
    const hanGan = goiConCau.map((s) => s.han).sort()[0] ?? MOC
    const can = chuaNay / soNgayCon7(ngay, hanGan)
    tk.paceTb.push(Math.round(thuc)); tk.canTb.push(Math.round(can))
    dem(tk.pace, thuc >= can ? 'kịp(thực≥cần)' : thuc === 0 ? 'trễ·không_làm_3_ngày_qua' : 'trễ(thực<cần)')
  }
  // Mức hôm nay + kế hoạch hôm nay theo vai + kho sửa / ôn (kế hoạch + dự phòng = mọi câu xếp được theo đúng luật xếp của máy chủ).
  const M = Number(lap.toiThieu) || 0
  tk.muc.push(M); dem(tk.xoMuc, xo(M, [12, 24, 30, 36, 48]))
  for (const v of lap.plan.viec) dem(tk.vaiHomNay, v.vai)
  let dp: { vai: string }[] = []
  try { dp = lap.duPhong() } catch { /* không có dự phòng */ }
  const suaPool = lap.plan.viec.filter((v) => v.vai === 'sua').length + dp.filter((v) => v.vai === 'sua').length
  const onPool = lap.plan.viec.filter((v) => v.vai === 'on').length + dp.filter((v) => v.vai === 'on').length
  const loiMo = [...(lap.hs.loiV2?.values() ?? [])].filter((x) => ['mo', 'cho_kiem'].includes(String((x as { trangThai?: string }).trangThai ?? ''))).length
  const capSua = tk.batKt ? 4 : Math.max(4, Math.ceil(M / 3))
  const suaLam = Math.min(suaPool, capSua * NGAY_TRONG_MOC)
  tk.loiMo.push(loiMo); tk.suaPool.push(suaPool); tk.suaLam.push(suaLam); if (suaPool <= capSua * NGAY_TRONG_MOC) tk.hetSua++
  dem(tk.xoSuaPool, xo(suaPool, [0, 4, 10, 20, 40])); tk.onPool.push(onPool); dem(tk.xoOnPool, xo(onPool, [0, 6, 20, 50, 100]))
}

let viTri = 0
await Promise.all(Array.from({ length: SONG_SONG }, async () => {
  for (;;) {
    const i = viTri++
    if (i >= dsEm.length) return
    try { await xet(dsEm[i]!) } catch (e) { tk.loi++; ra(`em#${i + 1}: LỖI ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`) }
  }
}))
// Chỉ in TÊN trường (không giá trị) của bản tóm tắt một bài kiểm tra — để biết có thể đếm "câu cũ" trong bài kiểm tra từ đâu.
try {
  const k = await hoi("SELECT (SELECT group_concat(key,',') FROM json_each(km.meta_json)) AS cac_truong FROM kiem_tra_ca_nhan_meta km JOIN kiem_tra_ca_nhan k ON k.id=km.id WHERE k.trang_thai IN ('da_nop','het_han') LIMIT 1", [])
  ra(`trường của meta_json một bài kiểm tra đã xong: ${String(k[0]?.cac_truong ?? '—')}`)
} catch (e) { ra(`(không đọc được trường meta: ${(e instanceof Error ? e.message : String(e)).slice(0, 100)})`) }
tongHop()
process.exit(0)
