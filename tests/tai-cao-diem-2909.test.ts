// @vitest-environment node
// GIẢ LẬP TẢI CAO ĐIỂM 20h–24h (thầy 29/09: "Học sinh làm bài cao điểm từ 20h tới 23h59 … tối ưu máy chủ thật xịn khung giờ này").
// 300 em trong MỘT phút: mỗi em Sảnh (hoa2-sanh) + start chuyến + 2 lần chốt đáp án (+ 1/3 số em gọi recommendations, 1/3 gọi sync) ≈ 4 lệnh/em/phút.
// Đếm: tổng truy vấn D1, lần đọc R2, truy vấn theo loại; mọi câu SQL đã chạy được EXPLAIN QUERY PLAN để bắt QUÉT BẢNG không chỉ mục.
// "Nhiều isolate": cứ 40 lệnh thì xoá mọi đệm mức mô-đun (mô phỏng lệnh rơi vào isolate lạnh) — con số bi quan hơn một isolate.
// Chạy được trên CẢ main cũ (trước) lẫn nhánh tối ưu (sau). In `TAI|…` để lập bảng; chi tiết ghi ra tệp (DO_RA).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { writeFileSync } from 'node:fs'
import { taoD1That } from './_d1-that'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { gvChienDich } from '../server/src/srs2-gv'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T21:00:00+07:00')
const SO_EM = Number(process.env.SO_EM ?? 300), SO_DE = 200, CAU_MOI_DE = 10, SO_CA = 40, CA_MO = 5, LENH_MOI_ISOLATE = 40
const ma = (i: number) => `DE${String(i).padStart(3, '0')}`
const cau = (maDe: string, i: number) => {
  const phan = i % 5 === 4 ? 'II' : 'I'
  return { qid: `${maDe}-${phan}-${i}`, maDe, version: 'v1', group: `g-${maDe}-${i}`, phan, text: `Câu ${i} của ${maDe}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang: `ES.A.D${i % 7}`, tenDang: 'Dạng', mucDo: 'hieu', sao: 2, kienThuc: ['k'], correct: phan === 'I' ? 'B' : 'DSDS', solution: { chot: 'Giải' }, reviewed: true }
}
const bank = (c: number) => ({ phanI: Array.from({ length: 40 }, (_, i) => ({ id: `CA${c}-I-${i + 1}`, text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] })) })
const sbdCua = (e: number) => `S${String(e).padStart(3, '0')}`

afterEach(() => { vi.useRealTimers() })

describe('TẢI CAO ĐIỂM: 300 em trong một phút', () => {
  it('đếm D1/R2 theo phút + EXPLAIN mọi câu SQL', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 - 3600_000)
    const d = taoD1That()
    const s = d.sql
    s.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('exp_moi','{"tu":"2026-09-01T00:00:00Z","toanBo":true}','x'),('nang_luc_v1','bat','x')`)
    const dk = s.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')")
    const gi = s.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')")
    const gq = s.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    for (let i = 1; i <= SO_DE; i++) {
      dk.run(ma(i), ma(i), CAU_MOI_DE, `kho/${ma(i)}.json`); gi.run(ma(i))
      for (let j = 1; j <= CAU_MOI_DE; j++) { const q = cau(ma(i), j); gq.run(q.maDe, q.qid, q.version, q.group, q.dang, JSON.stringify(q)) }
    }
    const ca = s.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,45,'thi',?,?,?)")
    const lu = s.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES(?,?,?,1,'x',?,'x','Em')")
    for (let c = 1; c <= SO_CA; c++) {
      const mo = c <= CA_MO
      ca.run(`CA${c}`, `Ca ${c}`, mo ? 'mo' : 'dong', new Date(T0 - (mo ? 60_000 : 86400_000 * c)).toISOString(), new Date(T0 + (mo ? 3600_000 : -86400_000 * c)).toISOString(), mo ? 'khong' : 'ngay', `key/CA${c}.json`, `v${c}`)
      await d.env.DE.put(`key/CA${c}.json`, JSON.stringify(bank(c)))
      for (let e = 1; e <= 60; e++) lu.run(`CA${c}|X${e}|1`, `CA${c}`, `X${e}`, e % 3 ? 'da_nop' : 'dang_lam')
    }
    const hs = s.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12A','mk','x')")
    const at = s.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
    const ss = s.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)')
    const dsSbd: string[] = []
    for (let e = 1; e <= SO_EM; e++) {
      const sbd = sbdCua(e); dsSbd.push(sbd); hs.run(sbd, `Em ${e}`)
      for (let k = 0; k < 60; k++) {
        const q = cau(ma(100 + ((e + k) % 100)), (k % CAU_MOI_DE) + 1)
        at.run(`OLD${e}-${k}|${q.qid}`, sbd, `OLD${e}-${k}`, q.qid, q.group, JSON.stringify({ attempt: { id: `OLD${e}-${k}|${q.qid}`, qid: q.qid, group: q.group, dang: q.dang, correct: k % 2 === 0, assisted: false, at: T0 - k * 3600_000 } }), new Date(T0 - k * 3600_000).toISOString())
      }
    }
    await gvChienDich(d.env, { action: 'tao', ten: 'CD', sbd: dsSbd, maDe: [ma(2), ma(3), ma(4), ma(5)], hanNop: '2026-10-05' }, T0 - 3600_000)
    const token = new Map<string, string>()
    for (const sbd of dsSbd) {
      token.set(sbd, await gameToken(d.env, sbd))
      await gameV2(d.env, 'choose', { token: token.get(sbd), pet: 'dat_quy' }).catch(() => null)
      const e = Number(sbd.slice(1))
      const qs = Array.from({ length: 4 }, (_, j) => cau(ma(10 + (e % 150)), j + 1))
      ss.run(`LUOT-${sbd}`, sbd, JSON.stringify({ mode: 'adventure', created: T0, hoa2: 1, questions: qs.map((q) => ({ qid: q.qid, maDe: q.maDe, version: 'v1', group: q.group, novel: true, role: 'moi' })) }), new Date(T0).toISOString())
    }
    vi.setSystemTime(T0)
    xoaMoiDem(); xoaDemCaBaoVe(); xoaDemCauHinh(d.env)

    // Bộ đếm: mọi first/all/run/raw ngoài batch = 1 truy vấn; batch đếm từng câu bên trong. EXPLAIN chạy sau, ngoài phần đếm.
    const dem = { tong: 0, batch: 0, r2: 0, loai: new Map<string, number>() }
    const cong = (sql: string) => { dem.tong++; const k = sql.replace(/\s+/g, ' ').trim().slice(0, 110); dem.loai.set(k, (dem.loai.get(k) ?? 0) + 1) }
    const sqlDaChay = new Set<string>()
    const goc = d.env.DB as any
    const that = new WeakMap<object, any>(), sqlCua = new WeakMap<object, string>()
    const boc = (st: any, sql: string): any => {
      const p = new Proxy(st, { get(t, k) {
        const v = t[k]
        if (k === 'bind') return (...a: unknown[]) => boc(v.apply(t, a), sql)
        if (k === 'first' || k === 'all' || k === 'run' || k === 'raw') return (...a: unknown[]) => { cong(sql); sqlDaChay.add(sql); return v.apply(t, a) }
        return typeof v === 'function' ? v.bind(t) : v
      } })
      that.set(p, st); sqlCua.set(p, sql)
      return p
    }
    const db: any = {
      prepare: (sql: string) => boc(goc.prepare(sql), sql),
      batch: (ds: any[]) => { dem.batch++; for (const x of ds) { const q = sqlCua.get(x) ?? '?'; cong(q); sqlDaChay.add(q) } return goc.batch(ds.map((x) => that.get(x) ?? x)) },
      withSession: () => db,
      [Symbol.for('omr.d1Goc')]: goc,
    }
    const getR2 = d.env.DE.get.bind(d.env.DE)
    const env = { ...d.env, DB: db, DE: { ...d.env.DE, get: (k: string) => { dem.r2++; return getR2(k) } } } as unknown as Env
    const cho: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => { cho.push(p) } }
    const goi = gameV2 as unknown as (e: Env, a: string, b: Record<string, unknown>, c?: unknown) => Promise<Record<string, unknown>>

    let soLenh = 0, loi = 0
    const lenhTheoLoai = new Map<string, number>()
    const chay = async (sbd: string, lenh: string, b: Record<string, unknown> = {}) => {
      if (++soLenh % LENH_MOI_ISOLATE === 0) { xoaMoiDem(); xoaDemCaBaoVe(); xoaDemCauHinh(env) }
      lenhTheoLoai.set(lenh, (lenhTheoLoai.get(lenh) ?? 0) + 1)
      const r = await goi(env, lenh, { token: token.get(sbd), mode: 'adventure', ...b }, ctx).catch((e: Error) => ({ ok: false, error: e.message }))
      if (r.ok !== true) loi++
      return r
    }
    const t = performance.now()
    // Một phút cao điểm: 300 em, mỗi em một dãy lệnh; 20 em chạy đồng thời một lúc; đồng hồ nhích dần trong phút.
    const NHOM = 20
    for (let i = 0; i < dsSbd.length; i += NHOM) {
      vi.setSystemTime(T0 + Math.floor((i / dsSbd.length) * 60_000))
      await Promise.all(dsSbd.slice(i, i + NHOM).map(async (sbd, j) => {
        const e = i + j
        await chay(sbd, 'hoa2-sanh')
        await chay(sbd, 'start')
        const q = cau(ma(10 + ((e + 1) % 150)), 1)
        await chay(sbd, 'answer', { session: `LUOT-${sbd}`, qid: q.qid, answer: e % 2 ? 'B' : 'A' })
        const q2 = cau(ma(10 + ((e + 1) % 150)), 2)
        await chay(sbd, 'answer', { session: `LUOT-${sbd}`, qid: q2.qid, answer: 'B' })
        if (e % 3 === 0) await chay(sbd, 'recommendations')
        if (e % 3 === 1) await chay(sbd, 'sync')
      }))
    }
    await Promise.all(cho)
    const ms = performance.now() - t
    // EXPLAIN mọi câu đã chạy: quét bảng (SCAN <bảng>) mà không dùng chỉ mục ⇒ nghi vấn.
    const quet: string[] = []
    for (const q of sqlDaChay) {
      if (!/^\s*(SELECT|WITH|UPDATE|DELETE|INSERT)/i.test(q)) continue
      let ke: string[] = []
      try { ke = (s.prepare('EXPLAIN QUERY PLAN ' + q).all() as { detail: string }[]).map((x) => x.detail) } catch { continue }
      const xau = ke.filter((x) => /^SCAN (?!CONSTANT)/.test(x) && !/USING (COVERING )?INDEX|json_each|VIRTUAL TABLE/.test(x))
      if (xau.length) quet.push(`${xau.join(' | ')}  ⇐  ${q.replace(/\s+/g, ' ').slice(0, 140)}`)
    }
    const top = [...dem.loai.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
    const dong = `TAI|em=${SO_EM}|lenh=${soLenh}|loi=${loi}|d1=${dem.tong}|batch=${dem.batch}|r2=${dem.r2}|d1MoiLenh=${(dem.tong / soLenh).toFixed(1)}|cpuMs=${ms.toFixed(0)}`
    console.log(dong)
    writeFileSync(`${process.env.DO_RA ?? '/tmp'}/tai-cao-diem.txt`, [dong, '', 'LỆNH:', ...[...lenhTheoLoai].map(([k, v]) => `${v}\t${k}`), '', 'TOP TRUY VẤN:', ...top.map(([k, v]) => `${v}\t${k}`), '', 'QUÉT BẢNG:', ...quet].join('\n'))
    expect(soLenh).toBeGreaterThan(SO_EM * 4)
  }, 600_000)
})
