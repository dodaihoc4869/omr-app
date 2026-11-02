// CHẨN ĐOÁN 4 BẢNG TRÊN DỮ LIỆU THẬT (02/11 — thầy: «Bạn thiết lập mọi thông số đo chuẩn xác đi. Tuần này tôi cho kiểm tra rồi đo lại mỗi ngày sẽ chính xác.»)
// CHỈ ĐỌC, CHỈ SỐ ĐẾM GỘP (repo công khai): không SBD, không tên, không mã câu. Chạy ĐÚNG đường đọc + lõi của máy chủ (`docDauVaoBon` → `tinhBon`) trên D1 thật
// qua API HTTP của Cloudflare, bọc «chỉ đọc»: câu nào không phải SELECT/WITH bị CHẶN (CREATE … IF NOT EXISTS ⇒ bỏ qua, bảng đã có trên D1 thật) và
// D1 báo có ghi ⇒ dừng ngay. Nhịp ≤ 3 lệnh/giây, lô 12 em (đúng cỡ lô cron ban ngày) — không đè D1 lúc em học.
//   1) Vì sao câu ca thi không ghép được với luyện tập: mỗi câu đúng MỘT lý do (`chanDoanGhep`), độ phủ đơn vị của câu thi (SQL gộp).
//   2) Phân bố z gộp ca thi, khoảng cách tới ngưỡng hai trục (sát ngưỡng = dễ lật nhãn).
//   3) TEST–RETEST: nhãn tính với cửa sổ kết thúc hôm qua / hôm kia / hôm kìa ⇒ tỉ lệ em giữ nguyên nhãn (thô) và sau vùng trễ (khi lõi có `onDinhNhan`).
// Chạy: esbuild đóng gói (xem .github/workflows/chan-doan-bon-0211.yml) rồi `node … ` với CF_TOKEN, CF_ACC.
import { docDanhSachEm, type EmGoc } from '../server/src/bai-hang-ngay'
import { docDauVaoBon } from '../server/src/bon-chi-so-d1'
import * as BON from '../server/src/bon-chi-so'
import { chanDoanGhep, khoaDv, tinhCaThi, type LyDoGhep } from '../server/src/bon-ca-thi'
import { cuaSoTinh } from '../server/src/danh-gia-hoc-that-d1'
import { sqlChuyenDeKho, sqlQidGoc } from '../server/src/danh-gia-hoc-that-d1'
import type { Env } from '../server/src/kieu'
import { appendFileSync } from 'node:fs'

type Row = Record<string, unknown>
type Goi = (sql: string, params: unknown[]) => Promise<Row[]>

// ───── Bọc CHỈ ĐỌC
const boChuoi = (s: string) => s.replace(/--[^\n]*/g, ' ').replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""')
export const laTaoNeuChuaCo = (sql: string) => /^\s*CREATE\s+(TABLE|INDEX|UNIQUE\s+INDEX|TRIGGER|VIEW)\s+IF\s+NOT\s+EXISTS\b/i.test(boChuoi(sql))
export function laCauDoc(sql: string): boolean {
  const s = boChuoi(sql).trim()
  if (!/^(SELECT|WITH)\b/i.test(s)) return false
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|VACUUM|PRAGMA|REINDEX)\b/i.test(s) || /\bREPLACE\s+INTO\b/i.test(s)) return false
  return !/;\s*\S/.test(s)
}
export const demChan = { chan: 0, boQuaTao: 0, lenh: 0 }
/** D1 giả CHỈ ĐỌC trên một hàm gọi (HTTP thật hoặc SQLite trong máy cho test). */
export function taoD1ChiDoc(goi: Goi): Env['DB'] {
  const chay = async (sql: string, b: unknown[]): Promise<Row[]> => {
    if (laTaoNeuChuaCo(sql)) { demChan.boQuaTao++; return [] }
    if (!laCauDoc(sql)) { demChan.chan++; throw new Error('CHẶN: lệnh không chỉ đọc') }
    demChan.lenh++
    return goi(sql, b)
  }
  const prepare = (sql: string) => {
    let b: unknown[] = []
    const st = {
      __sql: sql,
      get __b() { return b },
      bind: (...a: unknown[]) => { b = a; return st },
      all: async () => ({ results: await chay(sql, b), success: true, meta: {} }),
      first: async (cot?: string) => { const r = (await chay(sql, b))[0]; return r === undefined ? null : cot ? (r[cot] ?? null) : r },
      raw: async () => (await chay(sql, b)).map((r) => Object.values(r)),
      run: async () => { await chay(sql, b); return { success: true, meta: { changes: 0 } } },
    }
    return st
  }
  return {
    prepare,
    batch: async (ds: { __sql: string; __b: unknown[] }[]) => { const ra = []; for (const s of ds) ra.push({ results: await chay(s.__sql, s.__b), success: true, meta: {} }); return ra },
    exec: async () => { demChan.chan++; throw new Error('CHẶN: exec') },
  } as unknown as Env['DB']
}

// ───── API HTTP D1 (nhịp ≤ 3 lệnh/giây, thử lại khi 429 / 5xx)
const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nhuChuoi = (x: unknown): string => (x === null || x === undefined ? 'NULL' : typeof x === 'number' ? (Number.isFinite(x) ? String(x) : 'NULL') : typeof x === 'boolean' ? (x ? '1' : '0') : `'${String(x).replace(/'/g, "''")}'`)
/** Thay mọi tham số `?N` / `?` bằng giá trị chữ (khi API không nhận số trong `params`). Bỏ qua chuỗi '…' "…" và chú thích. */
export function nhungThamSo(sql: string, b: readonly unknown[]): string {
  let ra = '', tuan = 0
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]!
    if (c === "'" || c === '"') { const j = sql.indexOf(c, i + 1); const k = j < 0 ? sql.length - 1 : j; ra += sql.slice(i, k + 1); i = k; continue }
    if (c === '-' && sql[i + 1] === '-') { const j = sql.indexOf('\n', i); const k = j < 0 ? sql.length - 1 : j; ra += sql.slice(i, k + 1); i = k; continue }
    if (c === '?') { let j = i + 1; while (j < sql.length && /\d/.test(sql[j]!)) j++; const so = j > i + 1 ? Number(sql.slice(i + 1, j)) - 1 : tuan++; ra += nhuChuoi(b[so]); i = j - 1; continue }
    ra += c
  }
  return ra
}
export function taoGoiHttp(acc: string, token: string, dbId: string): { goi: Goi; dem: { rowsRead: number; lenh: number; ms: number } } {
  const url = `https://api.cloudflare.com/client/v4/accounts/${acc}/d1/database/${dbId}/query`
  const dem = { rowsRead: 0, lenh: 0, ms: 0 }
  let nhung: boolean | null = null, lanCuoi = 0
  const mot = async (sql: string, params: unknown[]): Promise<Row[]> => {
    for (let lan = 0; ; lan++) {
      const cho = lanCuoi + 330 - Date.now(); lanCuoi = Math.max(Date.now(), lanCuoi + 330)
      if (cho > 0) await ngu(cho)
      const t0 = Date.now()
      const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql, params }) })
      const j = (await r.json().catch(() => ({}))) as { success?: boolean; errors?: unknown; result?: { results?: Row[]; meta?: { rows_read?: number; rows_written?: number; changed_db?: boolean } }[] }
      dem.ms += Date.now() - t0
      if (j.success) {
        const k = j.result?.[0]
        if ((k?.meta?.rows_written ?? 0) > 0 || k?.meta?.changed_db) throw new Error('D1 báo CÓ GHI — dừng ngay (phải chỉ đọc).')
        dem.rowsRead += k?.meta?.rows_read ?? 0; dem.lenh++
        return k?.results ?? []
      }
      if ((r.status === 429 || r.status >= 500) && lan < 5) { await ngu(2000 * (lan + 1)); continue }
      throw new Error(`D1 lỗi ${r.status}: ${JSON.stringify(j.errors ?? '').slice(0, 300)}`)
    }
  }
  const goi: Goi = async (sql, b) => {
    if (nhung === null) {
      const r = await mot('SELECT typeof(?1) AS t, ?1 + 1 AS x', [4]).catch(() => [] as Row[])
      nhung = !(r[0]?.t === 'integer' && Number(r[0]?.x) === 5)
      console.log(`tham số số: ${nhung ? 'API chưa nhận kiểu số ⇒ nhúng giá trị vào câu' : 'API nhận kiểu số'}`)
    }
    return nhung ? mot(nhungThamSo(sql, b), []) : mot(sql, b as unknown[])
  }
  return { goi, dem }
}

// ───── Gộp số đếm
type Nhan = { cl: 'ht' | 'dp' | null; cs: 'ch' | 'lu' }
const nhanCua = (v: Record<string, boolean> | undefined): Nhan => ({ cl: v?.ht ? 'ht' : v?.dp ? 'dp' : null, cs: v?.ch ? 'ch' : 'lu' })
const tang = (o: Record<string, number>, k: string, d = 1) => { o[k] = (o[k] ?? 0) + d }
const thung = (x: number, mocs: readonly number[], ten: readonly string[]) => { for (let i = 0; i < mocs.length; i++) if (x < mocs[i]!) return ten[i]!; return ten[ten.length - 1]! }
const satCs = (b: BON.SoLieuBon['bien']) => !!b && b.du75 !== null && (Math.abs(b.du75 - 0.7) <= 0.1 || Math.abs(b.choCo - 0.1) <= 0.04 || Math.abs(b.donHan - 0.5) <= 0.1)
const satCl = (b: BON.SoLieuBon['bien']) => !!b && b.cl !== null && !b.chac && b.cl >= -1 && b.cl <= 0

export interface KetQuaChanDoan {
  soEm: number; cuaSo: string[]
  ghep: Record<LyDoGhep, number>; emCoCa: number; emGhep4: number; emCoBang: number
  dvThi: { dv: string; cau: number; ghep: number; luyenCaTT: number }[]
  zGop: Record<string, number>; bienCl: Record<string, number>; du75: Record<string, number>; satNguong: { cl: number; cs: number }
  nhan: Record<string, number>[]
  retest: { cap: string; cl: { so: number; giu: number; doi: Record<string, number>; doiSat: number }; cs: { so: number; giu: number; doi: Record<string, number>; doiSat: number } }[]
  onDinh: { cap: string; cl: { so: number; giu: number }; cs: { so: number; giu: number } }[] | null
  chan: typeof demChan
}

/** Chạy chẩn đoán cho MỌI em đang học (lô `lo`), nhãn ở các cửa sổ lùi `lui` ngày (0 = kết thúc hôm qua). Chỉ trả số đếm. */
export async function chayChanDoan(env: Env, nowMs: number, tuy: { lo?: number; nghiMs?: number; lui?: number[]; gioiHanEm?: number; em?: EmGoc[] } = {}): Promise<KetQuaChanDoan> {
  const lo = tuy.lo ?? 12, lui = tuy.lui ?? [2, 1, 0]
  const emHet = tuy.em ?? (await docDanhSachEm(env, [])) ?? []
  const em: EmGoc[] = tuy.gioiHanEm ? emHet.slice(0, tuy.gioiHanEm) : emHet
  const ghep: Record<string, number> = {}
  const zGop: Record<string, number> = {}, bienCl: Record<string, number> = {}, du75: Record<string, number> = {}
  const satNguong = { cl: 0, cs: 0 }
  let emCoCa = 0, emGhep4 = 0, emCoBang = 0
  const dvCau = new Map<string, { ten: string; cau: number; ghep: number }>(), dvLuyen = new Map<string, number>()
  // nhãn theo cửa sổ: [lui index] → sbd → nhãn thô + biên
  const theoCua: { nhan: Nhan; bien: BON.SoLieuBon['bien']; vao: Record<string, boolean> }[][] = lui.map(() => [])
  const onDinhCo = typeof (BON as Record<string, unknown>).onDinhNhan === 'function'
  for (let i = 0; i < em.length; i += lo) {
    const phan = em.slice(i, i + lo)
    for (let c = 0; c < lui.length; c++) {
      const ds = await docDauVaoBon(env, phan, nowMs - lui[c]! * 86_400_000, { chiDoc: true })
      for (const { dv } of ds) {
        const k = BON.tinhBon(dv)
        theoCua[c]!.push({ nhan: nhanCua(k.soLieu.vao), bien: k.soLieu.bien, vao: k.soLieu.vao as unknown as Record<string, boolean> })
        if (lui[c] !== 0) continue
        // ── chỉ cửa sổ hôm qua: độ ghép, z, biên
        const luyen = BON.luotLuyenBon(dv)
        const vCa = { luyen, luyenCu: dv.luyenCu ?? [], caThi: dv.caThi ?? [], lenBang: dv.lenBang ?? [] }
        for (const [ly, n] of Object.entries(chanDoanGhep(vCa))) tang(ghep, ly, n)
        const ca = tinhCaThi(vCa)
        if (vCa.caThi.length) emCoCa++
        if (ca.N >= 4) emGhep4++
        if (vCa.lenBang.length) emCoBang++
        if (ca.N >= 6) tang(zGop, thung(ca.z, [-1.96, -1, 0, 1, 1.645, 1.96, 2.33], ['<-1.96', '-1.96..-1', '-1..0', '0..1', '1..1.645', '1.645..1.96', '1.96..2.33', '>=2.33']))
        const b = k.soLieu.bien
        if (b?.cl !== null && b?.cl !== undefined) tang(bienCl, b.chac ? 'chac' : thung(b.cl, [-2, -1, 0, 1, 2], ['<=-3', '-2', '-1', '0', '1', '>=2']))
        if (b?.du75 !== null && b?.du75 !== undefined) tang(du75, thung(b.du75, [0.5, 0.6, 0.7, 0.8, 0.9], ['<0.5', '0.5-0.6', '0.6-0.7', '0.7-0.8', '0.8-0.9', '>=0.9']))
        if (satCl(b)) satNguong.cl++
        if (satCs(b)) satNguong.cs++
        // đơn vị thi ↔ luyện tập cả trung tâm (tên chuyên đề — không phải dữ liệu cá nhân)
        const ghepDv = new Map<string, number>()
        for (const d of ca.dv) ghepDv.set(khoaDv(d.ten), d.nT)
        for (const cau of vCa.caThi) {
          const kd = khoaDv(cau.dv)
          if (!kd) continue
          const x = dvCau.get(kd) ?? { ten: (cau.dv ?? '').trim(), cau: 0, ghep: 0 }
          x.cau++
          dvCau.set(kd, x)
        }
        for (const [kd, n] of ghepDv) { const x = dvCau.get(kd); if (x) x.ghep += n }
        for (const l of luyen) { const kd = khoaDv(l.dv ?? null); if (kd) dvLuyen.set(kd, (dvLuyen.get(kd) ?? 0) + 1) }
        for (const l of vCa.luyenCu) { const kd = khoaDv(l.dv); if (kd) dvLuyen.set(kd, (dvLuyen.get(kd) ?? 0) + l.n) }
      }
      if (tuy.nghiMs) await ngu(tuy.nghiMs)
    }
  }
  const nhan = theoCua.map((ds) => { const o: Record<string, number> = {}; for (const x of ds) { if (x.nhan.cl) tang(o, x.nhan.cl); tang(o, x.nhan.cs) } return o })
  const soSanh = (a: (typeof theoCua)[number], b: (typeof theoCua)[number], cap: string) => {
    const r = { cap, cl: { so: 0, giu: 0, doi: {} as Record<string, number>, doiSat: 0 }, cs: { so: 0, giu: 0, doi: {} as Record<string, number>, doiSat: 0 } }
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const x = a[i]!, y = b[i]!
      if (x.nhan.cl && y.nhan.cl) { r.cl.so++; if (x.nhan.cl === y.nhan.cl) r.cl.giu++; else { tang(r.cl.doi, `${x.nhan.cl}>${y.nhan.cl}`); if (satCl(x.bien) || satCl(y.bien)) r.cl.doiSat++ } }
      r.cs.so++
      if (x.nhan.cs === y.nhan.cs) r.cs.giu++
      else { tang(r.cs.doi, `${x.nhan.cs}>${y.nhan.cs}`); if (satCs(x.bien) || satCs(y.bien)) r.cs.doiSat++ }
    }
    return r
  }
  const retest = lui.slice(1).map((_, c) => soSanh(theoCua[c]!, theoCua[c + 1]!, `lùi ${lui[c]} → lùi ${lui[c + 1]}`))
  // vùng trễ (lõi v3c): nhãn ngày đầu = thô; các ngày sau đi qua `onDinhNhan` với nhãn đã ổn định + thô của ngày trước.
  let onDinh: KetQuaChanDoan['onDinh'] = null
  if (onDinhCo) {
    const od = (BON as unknown as { onDinhNhan: (moi: { vao: Record<string, boolean>; bien: BON.SoLieuBon['bien'] }, truoc: { vao: Record<string, boolean>; tho?: Record<string, boolean> | null } | null) => { vao: Record<string, boolean> } }).onDinhNhan
    const chuoi: Record<string, boolean>[][] = theoCua.map(() => [])
    for (let i = 0; i < theoCua[0]!.length; i++) {
      let truoc: { vao: Record<string, boolean>; tho: Record<string, boolean> | null } | null = null
      for (let c = 0; c < theoCua.length; c++) {
        const x = theoCua[c]![i]!
        const ra = truoc ? od({ vao: x.vao, bien: x.bien }, truoc).vao : x.vao
        chuoi[c]!.push(ra)
        truoc = { vao: ra, tho: x.vao }
      }
    }
    onDinh = lui.slice(1).map((_, c) => {
      const r = { cap: `lùi ${lui[c]} → lùi ${lui[c + 1]}`, cl: { so: 0, giu: 0 }, cs: { so: 0, giu: 0 } }
      for (let i = 0; i < chuoi[c]!.length; i++) {
        const a = nhanCua(chuoi[c]![i]), b = nhanCua(chuoi[c + 1]![i])
        if (a.cl && b.cl) { r.cl.so++; if (a.cl === b.cl) r.cl.giu++ }
        r.cs.so++; if (a.cs === b.cs) r.cs.giu++
      }
      return r
    })
  }
  const dvThi = [...dvCau.entries()].sort((a, b) => b[1].cau - a[1].cau).slice(0, 30).map(([kd, x]) => ({ dv: x.ten, cau: x.cau, ghep: x.ghep, luyenCaTT: dvLuyen.get(kd) ?? 0 }))
  return {
    soEm: em.length, cuaSo: lui.map((l) => cuaSoTinh(nowMs - l * 86_400_000).cuoi),
    ghep: ghep as Record<LyDoGhep, number>, emCoCa, emGhep4, emCoBang, dvThi, zGop, bienCl, du75, satNguong, nhan, retest, onDinh, chan: { ...demChan },
  }
}

// ───── SQL gộp: độ phủ đơn vị của câu thi (60 ngày), hình dạng mã câu thi, thời gian cron hôm nay
export async function demSql(env: Env, nowMs: number): Promise<Record<string, unknown>> {
  const w = cuaSoTinh(nowMs)
  const tu = new Date(Date.parse(w.cuoi + 'T00:00:00Z') - 59 * 86_400_000).toISOString().slice(0, 10)
  const q = async (sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).all<Row>()).results ?? []
  const LOC = `s.nguon = 'thi' AND s.ngay_vn BETWEEN ?1 AND ?2`
  const VAO = `COALESCE(s.visibility, '') <> 'embargoed' AND COALESCE(s.purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND NOT EXISTS (SELECT 1 FROM ca c WHERE c.ma_ca = s.ma_nguon AND c.loai = 'baitap')`
  const ra: Record<string, unknown> = {}
  ra.cauThi = (await q(`SELECT COUNT(*) AS tong, SUM(EXISTS (SELECT 1 FROM ca c WHERE c.ma_ca = s.ma_nguon AND c.loai = 'baitap')) AS ca_bai_tap,
      SUM(COALESCE(s.visibility, '') = 'embargoed') AS chua_cong_bo, SUM(COALESCE(s.purpose, '') IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc')) AS purpose_bo,
      SUM(s.ket_qua IS NULL) AS bo_trong, COUNT(DISTINCT s.ma_nguon) AS so_ca FROM su_kien_hoc s WHERE ${LOC}`, tu, w.cuoi))[0]
  ra.phuDonVi = (await q(`SELECT COUNT(*) AS n, SUM(cd_kho IS NOT NULL) AS cau_meta_co_cd, SUM(co_meta) AS co_dong_cau_meta, SUM(co_meta AND cd_kho IS NULL) AS cau_meta_thieu_cd,
      SUM(cd_kho IS NULL AND cd_dong <> '') AS chi_cd_so_hoc, SUM(cd_kho IS NULL AND cd_dong = '' AND dg <> '') AS chi_ma_dang, SUM(cd_kho IS NULL AND cd_dong = '' AND dg = '') AS khong_co_gi,
      SUM(cd_dong <> '') AS co_cd_so_hoc, SUM(dg <> '') AS co_ma_dang
    FROM (SELECT ${sqlChuyenDeKho('s')} AS cd_kho, EXISTS (SELECT 1 FROM cau_meta m WHERE m.qid = ${sqlQidGoc('s')}) AS co_meta,
      CASE WHEN TRIM(COALESCE(s.chuyen_de, '')) IN ('Hoá học', 'Hóa học') THEN '' ELSE TRIM(COALESCE(s.chuyen_de, '')) END AS cd_dong, TRIM(COALESCE(s.ma_dang, '')) AS dg
      FROM su_kien_hoc s WHERE ${LOC} AND ${VAO})`, tu, w.cuoi))[0]
  // câu thi thiếu đơn vị: ca có mã đề trong lượt thi không, mã đề ấy có chuyên đề ở kho / ở câu khác cùng mã đề không
  ra.thieuDvTheoMaDe = (await q(`SELECT COUNT(*) AS n, SUM(md IS NOT NULL AND md <> '') AS co_ma_de, SUM(cd_de IS NOT NULL) AS de_kho_co_cd, SUM(cd_cung_de IS NOT NULL) AS cau_cung_ma_de_co_cd
    FROM (SELECT x.md, (SELECT d.chuyen_de FROM de_kho d WHERE d.ma_de = x.md AND COALESCE(d.chuyen_de, '') <> '' LIMIT 1) AS cd_de,
        (SELECT m.chuyen_de FROM cau_meta m WHERE m.ma_de = x.md AND COALESCE(m.chuyen_de, '') <> '' LIMIT 1) AS cd_cung_de
      FROM (SELECT (SELECT l.ma_de FROM luot l WHERE l.ma_ca = s.ma_nguon AND l.sbd = s.sbd LIMIT 1) AS md FROM su_kien_hoc s
        WHERE ${LOC} AND ${VAO} AND ${sqlChuyenDeKho('s')} IS NULL AND TRIM(COALESCE(s.chuyen_de, '')) NOT IN ('', 'Hoá học', 'Hóa học') = 0) x)`, tu, w.cuoi))[0]
  // hình dạng mã câu thi (chữ số ⇒ 9) — không in mã câu
  const qids = await q(`SELECT s.qid AS q, COUNT(*) AS n, MAX(${sqlChuyenDeKho('s')} IS NOT NULL) AS kho FROM su_kien_hoc s WHERE ${LOC} AND ${VAO} GROUP BY s.qid`, tu, w.cuoi)
  const hinh: Record<string, { ma: number; cau: number; kho: number }> = {}
  for (const r of qids) { const h = String(r.q ?? '').replace(/[0-9]+/g, '9').replace(/[a-zà-ỹđ]+/gi, (m) => (m.length > 3 ? 'Chu' : m)).slice(0, 24); const x = (hinh[h] ??= { ma: 0, cau: 0, kho: 0 }); x.ma++; x.cau += Number(r.n) || 0; x.kho += Number(r.kho) ? 1 : 0 }
  ra.hinhMaCauThi = Object.entries(hinh).sort((a, b) => b[1].cau - a[1].cau).slice(0, 12).map(([h, x]) => ({ hinh: h, ...x }))
  ra.caTheoLoai = await q(`SELECT COALESCE(loai, '') AS loai, COUNT(*) AS so_ca FROM ca WHERE ma_ca IN (SELECT DISTINCT ma_nguon FROM su_kien_hoc s WHERE ${LOC}) GROUP BY 1`, tu, w.cuoi)
  ra.cronHomNay = (await q(`SELECT COUNT(*) AS so_em, MIN(tinh_luc) AS som, MAX(tinh_luc) AS muon, SUM(json_extract(so_lieu_json, '$.ban') = (SELECT MAX(json_extract(so_lieu_json, '$.ban')) FROM bon_chi_so_em)) AS ban_moi
    FROM bon_chi_so_em WHERE ngay = ?1 AND json_valid(so_lieu_json)`, w.homNay))[0]
  return ra
}

// ───── Chạy thật (workflow)
const laChinh = typeof process !== 'undefined' && process.argv[1] && /chan-doan-bon/.test(process.argv[1])
if (laChinh) {
  const acc = process.env.CF_ACC ?? '', token = process.env.CF_TOKEN ?? '', dbId = process.env.D1_ID ?? 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
  if (!acc || !token) { console.error('Thiếu CF_ACC / CF_TOKEN'); process.exit(1) }
  const http = taoGoiHttp(acc, token, dbId)
  const env = { DB: taoD1ChiDoc(http.goi) } as unknown as Env
  const now = Date.now()
  const g = new Date(now + 7 * 3_600_000)
  const phut = g.getUTCHours() * 60 + g.getUTCMinutes()
  if (phut >= 18 * 60 && phut < 23 * 60 + 30 && !process.env.CHO_CAO_DIEM) { console.error('Giờ cao điểm 18:00–23:30 — không chạy (đặt CHO_CAO_DIEM=1 nếu thật cần).'); process.exit(1) }
  const t0 = Date.now()
  const sql = await demSql(env, now)
  const kq = await chayChanDoan(env, now, { lo: 12, nghiMs: 1500, gioiHanEm: Number(process.env.GIOI_HAN_EM) || undefined })
  const tong = Object.values(kq.ghep).reduce((a, b) => a + b, 0)
  const pc = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : '—')
  const md = [
    `## Chẩn đoán 4 bảng trên dữ liệu thật (chỉ đọc, số đếm gộp)`,
    `${kq.soEm} em · cửa sổ kết thúc ${kq.cuaSo.join(' / ')} · ${http.dem.lenh} lệnh D1, ${http.dem.rowsRead} dòng đọc, ${Math.round((Date.now() - t0) / 1000)} s · chặn ${kq.chan.chan} lệnh ghi, bỏ qua ${kq.chan.boQuaTao} lệnh tạo-nếu-chưa-có`,
    `### 1. Câu ca thi không ghép được — mỗi câu một lý do`,
    `| Lý do | Câu | Tỉ lệ |`, `|---|---|---|`,
    ...Object.entries(kq.ghep).map(([k, n]) => `| ${k} | ${n} | ${pc(n, tong)} |`),
    `| **tổng** | ${tong} | em có ca ${kq.emCoCa} · ghép ≥ 4 câu ${kq.emGhep4} · có lên bảng ${kq.emCoBang} |`,
    `### 2. Biên tới ngưỡng`, `- z gộp (em ≥ 6 câu ghép): \`${JSON.stringify(kq.zGop)}\``, `- trục chất lượng (tổng sức − ngưỡng): \`${JSON.stringify(kq.bienCl)}\``,
    `- trục công sức (tỉ lệ ngày đủ 75% mức): \`${JSON.stringify(kq.du75)}\``, `- sát ngưỡng: chất lượng ${kq.satNguong.cl} em · công sức ${kq.satNguong.cs} em`,
    `### 3. Test–retest (nhãn thô)`, `- nhãn theo cửa sổ: \`${JSON.stringify(kq.nhan)}\``,
    ...kq.retest.map((r) => `- ${r.cap}: chất lượng giữ ${r.cl.giu}/${r.cl.so} = ${pc(r.cl.giu, r.cl.so)} (đổi ${JSON.stringify(r.cl.doi)}, sát ngưỡng ${r.cl.doiSat}) · công sức giữ ${r.cs.giu}/${r.cs.so} = ${pc(r.cs.giu, r.cs.so)} (đổi ${JSON.stringify(r.cs.doi)}, sát ngưỡng ${r.cs.doiSat})`),
    ...(kq.onDinh ? [`### 3b. Sau vùng trễ (onDinhNhan)`, ...kq.onDinh.map((r) => `- ${r.cap}: chất lượng giữ ${r.cl.giu}/${r.cl.so} = ${pc(r.cl.giu, r.cl.so)} · công sức giữ ${r.cs.giu}/${r.cs.so} = ${pc(r.cs.giu, r.cs.so)}`)] : []),
    `### 4. Đơn vị thi (chuyên đề) · câu thi · câu ghép · lượt luyện cả trung tâm`, `| Đơn vị | Câu thi | Ghép | Luyện (cả TT) |`, `|---|---|---|---|`,
    ...kq.dvThi.map((d) => `| ${d.dv.replace(/\|/g, '/')} | ${d.cau} | ${d.ghep} | ${d.luyenCaTT} |`),
    `### 5. SQL gộp`, '```json', JSON.stringify(sql, null, 1), '```',
  ].join('\n')
  console.log(md)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
}
