// D1 GIẢ BẰNG SQLITE TRONG BỘ NHỚ (node:sqlite) — dùng chung cho test sổ/hồ sơ/kế hoạch (GĐ 0–2, 19/09).
//
// ⚠️ RUNTIME: đây là **SQLite trong bộ nhớ của Node**, KHÔNG phải runtime Cloudflare D1/workerd. Nó chứng minh
// hình dạng lược đồ + ngữ nghĩa câu lệnh SQL (json_each, ON CONFLICT, CAS, `changes`) — KHÔNG chứng minh hành vi
// đồng thời ở tầng runtime D1, giới hạn tải, hay khác biệt dialect của D1 (RV06 của rà soát độc lập 01).
// Test nào cần khẳng định ĐỒNG THỜI phải nói rõ runtime và (khi có môi trường) chạy thêm trên workerd/wrangler.
//
// Khác các stub tay ở nhiều test cũ: ở đây câu SQL của máy chủ CHẠY THẬT trên
// lược đồ THẬT (nạp đúng tệp `server/schema.sql` + mọi `server/migration-*.sql`),
// nên `json_each`, `ON CONFLICT`, `date(...,'+7 hours')` được kiểm chứng chứ không
// đoán. `batch` chạy trong một giao dịch, giống D1.
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import type { D1PreparedStatement, Env } from '../server/src/kieu'
import { xoaDemThiDua } from '../server/src/dem-thi-dua'
import { xoaMoiDem } from '../server/src/dem-chung'
import { xoaDemKeHoach } from '../server/src/dem-ke-hoach'
import { xoaSucKhoe } from '../server/src/suc-khoe-may'

/** Duy nhất tệp này phụ thuộc thứ tự (cần `game_v2_settings` dựng trước) — bỏ qua, không dùng tới. */
const BO_QUA = new Set(['migration-1609-academic-start.sql'])

/**
 * GIỚI HẠN CỦA D1 THẬT mà node:sqlite không có: TỐI ĐA 5 term trong MỘT truy vấn UNION (thử trên D1 thật 21/09: 5 term chạy, 6 term ⇒ "too many terms in compound SELECT").
 * Đếm theo TỪNG nhóm ngoặc (truy vấn con có nhóm riêng); bỏ qua chữ trong chuỗi '…', "…", `…` và chú thích. Lệnh vượt ⇒ ném đúng lỗi của D1 khi chạy (first/all/run), như D1 thật.
 */
export const D1_TOI_DA_TERM_UNION = 5
export function demTermUnionToiDa(query: string): number {
  const s = query.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""').replace(/`[^`]*`/g, '``')
  const ngan: number[] = [0]
  let toiDa = 1
  const chot = (n: number) => { if (n + 1 > toiDa) toiDa = n + 1 }
  const re = /\(|\)|\bUNION\b/gi
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m[0] === '(') ngan.push(0)
    else if (m[0] === ')') { chot(ngan.pop() ?? 0); if (ngan.length === 0) ngan.push(0) }
    else ngan[ngan.length - 1]!++
  }
  for (const n of ngan) chot(n)
  return toiDa
}

export function taoD1That() {
  xoaDemThiDua(); xoaMoiDem(); xoaDemKeHoach(); xoaSucKhoe() // đệm Thi đua 30 giây (mức mô-đun) không được lẫn giữa các D1 giả khác nhau
  const sql = new DatabaseSync(':memory:')
  const tep = ['schema.sql', ...readdirSync('server').filter((f) => /^migration-.*\.sql$/.test(f)).sort()]
  for (const f of tep) {
    if (BO_QUA.has(f)) continue
    sql.exec(readFileSync(`server/${f}`, 'utf8'))
  }
  // LỆCH LƯỢC ĐỒ GIỮA REPO VÀ D1 THẬT (có từ trước, ghi nhận 19/09): bảng `ca` trên D1 thật có các cột dưới đây nhưng
  // không tệp migration nào trong repo tạo ra chúng (thêm tay/đường khác). Bổ sung ở đây để câu SQL của máy chủ chạy
  // trên đúng hình dạng bảng thật; kiểm trước để không thêm trùng nếu một migration sau này có thêm.
  const cotCa = new Set((sql.prepare("SELECT name FROM pragma_table_info('ca')").all() as { name: string }[]).map((x) => x.name))
  for (const c of ['pham_vi', 'danh_sach_chon_json', 'mat_khau', 'de_rieng', 'pham_vi_hoi_lai']) {
    if (!cotCa.has(c)) sql.exec(`ALTER TABLE ca ADD COLUMN ${c} TEXT`)
  }
  // Cùng loại lệch, ghi nhận 21/09 (Code 4 báo, Code 3 xác nhận bằng pragma_table_info trên D1 thật): `cau_hoi_em` trên D1 thật có
  // `da_xoa INTEGER NOT NULL DEFAULT 0` (goi-cu.ts danhSachCauHoi/INSERT/UPDATE dùng nó) nhưng không migration nào trong repo tạo.
  // KHÔNG viết migration ADD COLUMN cho D1 thật: cột đã có, chạy lại sẽ lỗi "duplicate column name".
  const cotCauHoi = new Set((sql.prepare("SELECT name FROM pragma_table_info('cau_hoi_em')").all() as { name: string }[]).map((x) => x.name))
  if (!cotCauHoi.has('da_xoa')) sql.exec('ALTER TABLE cau_hoi_em ADD COLUMN da_xoa INTEGER NOT NULL DEFAULT 0')
  const objects = new Map<string, unknown>()
  const soLenh = { prepare: 0, batch: 0 }

  function prepare(query: string): D1PreparedStatement {
    soLenh.prepare++
    let values: unknown[] = []
    const kiemTerm = () => { if (demTermUnionToiDa(query) > D1_TOI_DA_TERM_UNION) throw new Error('D1_ERROR: too many terms in compound SELECT: SQLITE_ERROR') }
    const st: D1PreparedStatement = {
      bind(...a: unknown[]) {
        values = a
        return st
      },
      async first<T>() {
        kiemTerm()
        return (sql.prepare(query).get(...(values as never[])) ?? null) as T | null
      },
      async all<T>() {
        kiemTerm()
        return { results: sql.prepare(query).all(...(values as never[])) as T[], success: true, meta: { changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 } }
      },
      async run<T>() {
        kiemTerm()
        const r = sql.prepare(query).run(...(values as never[]))
        return { results: [] as T[], success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid), rows_read: 0, rows_written: Number(r.changes) } }
      },
    }
    ;(st as unknown as { _q: string })._q = query
    return st
  }

  const dbThat = {
    prepare,
    async batch(ds: D1PreparedStatement[]) {
      soLenh.batch++
      sql.exec('BEGIN')
      try {
        const r = []
        // Như D1 thật: câu SELECT trong batch trả `results` (câu ghi trả `meta.changes`).
        for (const s of ds) r.push(/^\s*(SELECT|WITH)\b/i.test((s as unknown as { _q?: string })._q ?? '') ? await s.all() : await s.run())
        sql.exec('COMMIT')
        return r
      } catch (e) {
        sql.exec('ROLLBACK')
        throw e
      }
    },
    // Sessions API (Boss 22/09, lượt 2): D1 giả KHÔNG có replica để mô phỏng thật — trả nguyên bản sqlite trong bộ nhớ này,
    // cùng đối tượng `prepare/batch`, để route dùng withSession chạy Y HỆT route không dùng (không đổi kết quả/số lệnh test đo).
    withSession(_constraintOrBookmark?: string) {
      return dbThat
    },
  }
  const env = {
    MA_BI_MAT: 'bi-mat-thu',
    DB: dbThat,
    DE: {
      async get(key: string) {
        const v = objects.get(key)
        return v === undefined ? null : { body: new Response(typeof v === 'string' ? v : JSON.stringify(v)).body!, httpEtag: 'x' }
      },
      async put(key: string, value: unknown) {
        objects.set(key, typeof value === 'string' ? value : value)
        return {}
      },
      async delete(key: string | string[]) {
        for (const k of Array.isArray(key) ? key : [key]) objects.delete(k)
      },
    },
  } as unknown as Env

  const dem = (bang: string, dieuKien = '1=1') => Number((sql.prepare(`SELECT COUNT(*) n FROM ${bang} WHERE ${dieuKien}`).get() as { n: number }).n)
  const chup = (bang: string) => JSON.stringify(sql.prepare(`SELECT * FROM ${bang} ORDER BY 1, 2`).all())
  return { sql, env, objects, soLenh, dem, chup }
}

export type D1That = ReturnType<typeof taoD1That>

/** Với request đồng thời, mọi batch phải không bị SQL khác chen giữa hai câu.
 * Adapter gốc await từng câu nên không đủ mô phỏng tính nguyên tử của D1. */
export function serialiseD1(env: Env) {
  const batch=env.DB.batch.bind(env.DB),prepare=env.DB.prepare.bind(env.DB)
  let queue:Promise<unknown>=Promise.resolve()
  const serial=<T,>(fn:()=>Promise<T>)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next}
  const raw=new WeakMap<object,ReturnType<typeof prepare>>()
  env.DB.prepare=((query:string)=>{
    const base=prepare(query)
    const st={
      bind(...args:unknown[]){base.bind(...args);return st},
      first:()=>serial(()=>base.first()),all:()=>serial(()=>base.all()),run:()=>serial(()=>base.run()),
    } as ReturnType<typeof prepare>
    raw.set(st,base)
    return st
  }) as typeof prepare
  env.DB.batch=((ds)=>serial(()=>batch(ds.map(s=>raw.get(s)??s)))) as typeof batch
}

/** Gọi Worker thật qua `fetch` — đúng đường của app. `thay` = true thì kèm mã bí mật của thầy. */
/** `giuNhipDeNghi` = false (mặc định) ⇒ BỎ trường `nhipDeNghi` (hệ số nhịp, gắn ở MỌI phản hồi từ 21/09) khỏi kết quả để các test "phản hồi đúng từng khoá" không phải nhắc tới nó; bật true khi test chính trường ấy. */
// `ctx` GIẢ (Boss 22/09, ctx.waitUntil): gom mọi việc phụ được hoãn, rồi ĐỢI HẾT trước khi trả kết quả cho test — vừa
// đi đúng đường thật (worker nhận được `ctx`, không rơi về đường "chạy ngay tại chỗ"), vừa giữ test tất định (không
// đọc D1/kết quả trước khi việc phụ ghi xong). Test nào cần đo query TRƯỚC khi việc phụ chạy thì tự gọi worker.fetch(req, env) không qua goiWorker.
export async function goiWorker(worker: { fetch(r: Request, e: Env, c?: { waitUntil(p: Promise<unknown>): void }): Promise<Response> }, env: Env, duong: string, body: Record<string, unknown>, thay = false, giuNhipDeNghi = false) {
  const choDoi: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { choDoi.push(p) } }
  const r = await worker.fetch(
    new Request(`https://test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(thay ? { ...body, secret: 'bi-mat-thu' } : body) }),
    env,
    ctx,
  )
  const kq = (await r.json()) as Record<string, any>
  await Promise.all(choDoi)
  if (!giuNhipDeNghi) delete kq.nhipDeNghi
  return kq
}
