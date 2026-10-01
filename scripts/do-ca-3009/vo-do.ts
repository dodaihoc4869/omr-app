// VỎ ĐO cho bộ ĐO CA KIỂM TRA 300 EM (tối ưu ca 30/09) — CHỈ chạy trong `wrangler dev --local` (scripts/do-ca-3009/wrangler.toml).
// Bọc Worker THẬT (`server/src/index.ts`, không sửa dòng nào) và đếm cho TỪNG lượt gọi (AsyncLocalStorage):
//   · số câu D1, số VÒNG ĐI-VỀ D1 (mỗi run/all/first/raw = 1 vòng; một `batch` = 1 vòng dù nhiều câu), dòng đọc/ghi (meta của D1 cục bộ);
//   · số lần đọc/ghi R2 và số byte R2 đọc.
// ĐỘ TRỄ GIẢ (biến TRE_D1_MS, TRE_R2_MS): mỗi vòng D1 / mỗi thao tác R2 chờ thêm chừng ấy ms như đường mạng Worker → D1/R2 thật.
// D1 cục bộ (miniflare) chạy SQLite trong MỘT đối tượng ⇒ câu lệnh xếp hàng một luồng như D1 thật; độ trễ giả KHÔNG xếp hàng (là đường mạng).
//   GET  /__do/dump  → mọi lượt đã ghi (JSON gọn)      GET /__do/reset → xoá sổ đo
//   POST /__do/sql   {cau: string[]} → chạy từng câu trên D1 GỐC (không đếm, không trễ), câu lỗi bỏ qua ⇒ {ok, loi}
//   POST /__do/r2    {khoa, noiDung} → ghi R2 GỐC (không đếm)
import { AsyncLocalStorage } from 'node:async_hooks'
import worker from '../../server/src/index'
import { gameToken } from '../../server/src/game-v2-auth'
import { LUAT_CAP_MOI } from '../../src/lib/hap-thu-ngay'

interface Luot {
  lenh: string
  ms: number
  ma: number
  cau: number
  vong: number
  doc: number
  ghi: number
  r2Doc: number
  r2Ghi: number
  r2Byte: number
}

const so: Luot[] = []
const als = new AsyncLocalStorage<Luot>()
let treD1 = 0
let treR2 = 0
const cho = (ms: number): Promise<void> | undefined => (ms > 0 ? new Promise<void>((ok) => setTimeout(ok, ms)) : undefined)

type CauGoc = { bind(...a: unknown[]): CauGoc; all(): Promise<{ results?: unknown[]; meta?: Record<string, unknown> }>; run(): Promise<{ meta?: Record<string, unknown> }>; raw(o?: unknown): Promise<unknown> }
interface CauBoc { bind(...a: unknown[]): CauBoc; all(): Promise<unknown>; run(): Promise<unknown>; first(c?: string): Promise<unknown>; raw(o?: unknown): Promise<unknown>; __goc(): CauGoc }

function ghi(meta: Record<string, unknown> | undefined, cau: number, vong: number): void {
  const l = als.getStore()
  if (!l) return
  l.cau += cau
  l.vong += vong
  l.doc += Number(meta?.rows_read ?? 0) || 0
  l.ghi += Number(meta?.rows_written ?? 0) || 0
}

function bocCau(goc: CauGoc): CauBoc {
  let cur = goc
  const p: CauBoc = {
    __goc: () => cur,
    bind(...a) { cur = cur.bind(...a); return p },
    async all() { await cho(treD1); const r = await cur.all(); ghi(r.meta, 1, 1); return r },
    async run() { await cho(treD1); const r = await cur.run(); ghi(r.meta, 1, 1); return r },
    // D1 thật chạy trọn câu rồi lấy dòng đầu ⇒ đo bằng all().
    async first(col?: string) {
      await cho(treD1)
      const r = await cur.all()
      ghi(r.meta, 1, 1)
      const dong = ((r.results ?? [])[0] ?? null) as Record<string, unknown> | null
      return col ? (dong ? (dong[col] ?? null) : null) : dong
    },
    async raw(o?: unknown) { await cho(treD1); const r = await cur.raw(o); ghi(undefined, 1, 1); return r },
  }
  return p
}

const daBoc = new WeakMap<object, object>()
function bocD1(db: any): any {
  const da = daBoc.get(db)
  if (da) return da
  const moi = {
    prepare: (sql: string) => bocCau(db.prepare(sql)),
    async batch(ds: CauBoc[]) {
      await cho(treD1)
      const r = (await db.batch(ds.map((s) => (s.__goc ? s.__goc() : s)))) as { meta?: Record<string, unknown> }[]
      r.forEach((x, i) => ghi(x?.meta, 1, i === 0 ? 1 : 0))
      return r
    },
    async exec(sql: string) { await cho(treD1); const r = await db.exec(sql); ghi(undefined, 1, 1); return r },
    dump: (...a: unknown[]) => db.dump(...a),
    withSession: db.withSession ? (...a: unknown[]) => bocD1(db.withSession(...a)) : undefined,
  }
  daBoc.set(db, moi)
  return moi
}

function bocR2(de: any): any {
  return new Proxy(de, {
    get(t, p) {
      if (p === 'get') {
        return async (key: string, ...a: unknown[]) => {
          await cho(treR2)
          const o = await t.get(key, ...a)
          const l = als.getStore()
          if (l) { l.r2Doc++; if (o && 'body' in o) l.r2Byte += Number(o.size) || 0 }
          return o
        }
      }
      if (p === 'head') {
        return async (key: string) => { await cho(treR2); const l = als.getStore(); if (l) l.r2Doc++; return t.head(key) }
      }
      if (p === 'put') {
        return async (key: string, v: unknown, ...a: unknown[]) => { await cho(treR2); const l = als.getStore(); if (l) l.r2Ghi++; return t.put(key, v, ...a) }
      }
      const v = t[p]
      return typeof v === 'function' ? v.bind(t) : v
    },
  })
}

const envBoc = new WeakMap<object, object>()
const bocEnv = (env: any): any => {
  const da = envBoc.get(env)
  if (da) return da
  treD1 = Number(env.TRE_D1_MS) || 0
  treR2 = Number(env.TRE_R2_MS) || 0
  const moi = { ...env, DB: bocD1(env.DB), DE: bocR2(env.DE) }
  envBoc.set(env, moi)
  return moi
}

const nhanLenh = (v: string | null): string => { if (!v) return ''; try { return decodeURIComponent(v) } catch { return v } }

export default {
  async fetch(req: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/__do/dump') return Response.json({ so })
    if (url.pathname === '/__do/reset') { so.length = 0; return Response.json({ ok: true }) }
    if (url.pathname === '/__do/doi-chieu-game') {
      const r = await env.DB.prepare('SELECT sbd, COUNT(*) AS n FROM game_v2_attempt GROUP BY sbd').all()
      return Response.json({ rows: r.results })
    }
    if (url.pathname === '/__do/game') {
      const { sbds } = (await req.json()) as { sbds: string[] }
      const luc = new Date().toISOString(), maDe = '12-PEAK-GAME', qids = Array.from({ length: 20 }, (_, i) => `PEAK-Q${i}`)
      const cau = qids.map(qid => ({ qid, maDe, version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu hoá giả lập ${qid}`, choices: ['a','b','c','d'], ideas: [], hinhAnh: [], dang: 'ES.A.D1', tenDang: 'Dạng thử', mucDo: 'hieu', sao: 1, kienThuc: ['k'], correct: 'B', solution: { chot: 'Lời giải thử' }, reviewed: true }))
      const st = [env.DB.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{\"bat\":true}',?)").bind(luc),
        env.DB.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,'Kho giả','12',20,'kho/peak.json',0,'v1')").bind(maDe),
        env.DB.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1',?)").bind(maDe,luc),
        ...cau.map(q => env.DB.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').bind(maDe,q.qid,q.version,q.group,q.dang,JSON.stringify(q))),
        env.DB.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,the_luc_ngay,tao_luc) VALUES('PEAK-CD','Chiến dịch giả','12A',?,?,?,'2026-10-04',40,?)").bind(JSON.stringify(sbds),JSON.stringify([maDe]),JSON.stringify(qids),luc)]
      await env.DB.batch(st)
      const profile = JSON.stringify({pet:'dat_quy',choice:false,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,cutover:luc,luatCap:LUAT_CAP_MOI,mocVang:0})
      const tokens: Record<string,string> = {}
      for (const sbd of sbds) {
        await env.DB.batch([env.DB.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,'Em giả','12A','mk',?)").bind(sbd,luc),env.DB.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').bind(sbd,profile,luc)])
        tokens[sbd] = await gameToken(env,sbd)
      }
      return Response.json({ tokens })
    }
    if (url.pathname === '/__do/doi-chieu') {
      const { maCa } = (await req.json()) as { maCa: string }
      const r = await env.DB.prepare('SELECT sbd, trang_thai, dap_an_json, giay_cau_json FROM luot WHERE ma_ca = ?').bind(maCa).all()
      return Response.json({ rows: r.results })
    }
    if (url.pathname === '/__do/sql') {
      const { cau } = (await req.json()) as { cau: string[] }
      let loi = 0
      const dsLoi: string[] = []
      for (const c of cau) {
        try { await env.DB.prepare(c).run() } catch (e) { loi++; if (dsLoi.length < 5) dsLoi.push(String((e as Error).message).slice(0, 160)) }
      }
      return Response.json({ ok: true, loi, dsLoi })
    }
    if (url.pathname === '/__do/r2') {
      const { khoa, noiDung } = (await req.json()) as { khoa: string; noiDung: string }
      await env.DE.put(khoa, noiDung)
      return Response.json({ ok: true })
    }
    const l: Luot = { lenh: nhanLenh(req.headers.get('x-do-lenh')) || url.pathname, ms: 0, ma: 0, cau: 0, vong: 0, doc: 0, ghi: 0, r2Doc: 0, r2Ghi: 0, r2Byte: 0 }
    const t0 = Date.now()
    return als.run(l, async () => {
      try {
        const r = await worker.fetch(req, bocEnv(env), ctx)
        const body = await r.arrayBuffer()
        l.ms = Date.now() - t0
        l.ma = r.status
        if (so.length < 400_000) so.push(l)
        const h = new Headers(r.headers)
        h.set('x-do-cau', String(l.cau))
        h.set('x-do-vong', String(l.vong))
        return new Response(r.status === 304 ? null : body, { status: r.status, headers: h })
      } catch (e) {
        l.ms = Date.now() - t0
        l.ma = 599
        if (so.length < 400_000) so.push(l)
        return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), { status: 500 })
      }
    })
  },
}
