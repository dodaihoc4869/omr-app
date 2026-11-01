// @vitest-environment node
// TỐI ƯU GIỜ CAO ĐIỂM 14/10 (thầy: "Tối ưu chuyên sâu toàn bộ cho giờ cao điểm luôn nhé"). Cao điểm 13/10: 135 yêu cầu chết vì isolate vượt 128 MB.
// Số đo kho thật: 15.359 câu, JSON TB 3.946 ký tự (có câu 289.745 vì ảnh) — vài lệnh lọc/đếm câu nạp JSON ĐẦY ĐỦ của 1.500–1.700 câu một lượt.
// Nay đọc câu RÚT GỌN (cau-gon.ts: bỏ ảnh / lời giải / bảng). Khoá: (1) kết quả TRÙNG KHÍT cách đọc cũ (giữ bản cũ làm phép thử);
// (2) phản hồi D1 không còn mang ảnh / lời giải; (3) Tự luyện: kho câu sai giữ bản gọn, câu được phát vẫn đủ nội dung.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { cauCuaToChiTiet, tachMaTo } from '../server/src/srs2-gv'
import { docKhoCauSai, docNoiDung, docNoiDungGon, napDayDuCauSai } from '../server/src/tu-luyen-cau-sai'
import { laCauTuLuan } from '../server/src/cam-tu-luan'
import { lamNhe, readScope } from '../server/src/game-v2-bank'
import type { Env } from '../server/src/kieu'

const ANH = `data:image/png;base64,${'A'.repeat(40_000)}`
const LOI_GIAI = 'Lời giải rất dài '.repeat(2_000)
type Cau = Record<string, unknown>
const cau = (qid: string, x: Cau = {}): Cau => ({
  qid, maDe: 'DH-12-B8', version: 'v1', phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', reviewed: true,
  mucDo: 'Thông hiểu', lop: '12', dang: 'D1', solution: { chot: LOI_GIAI }, imageDataUrl: ANH, kienThuc: ['amine'], ...x,
})
/** Bộ câu khó: ảnh phương án thay chữ, hình kèm câu, tự luận các kiểu, chưa duyệt, JSON hỏng, phần II/III, nhãn kiến thức lạ. */
const BO: [string, Cau | string][] = [
  ['Q1', cau('Q1')],
  ['Q2', cau('Q2', { choices: ['', '', '', ''], choiceImgs: [ANH, ANH, ANH, ANH] })], // phương án chỉ có ảnh ⇒ vẫn trắc nghiệm
  ['Q3', cau('Q3', { choices: ['', '', 'c', 'd'], choiceImgs: [ANH, '', null, ''] })], // thiếu phương án ⇒ tự luận
  ['Q4', cau('Q4', { phan: 'III', choices: undefined, correct: 'Giải thích vì sao' })], // tự luận
  ['Q5', cau('Q5', { reviewed: false })],
  ['Q6', '{"qid":"Q6", hỏng'],
  ['Q7', cau('Q7', { phan: 'II', choices: undefined, ideas: ['a', 'b', 'c', 'd'], correct: 'DSDS', mucDo: '  Vận dụng  ' })],
  ['Q8', cau('Q8', { hinh: [{ viTri: 'sau_pa_1', src: ANH }], choices: ['a', '', 'c', 'd'] })], // hình thay phương án 2
  ['Q9', cau('Q9', { kienThuc: 'chuỗi không phải mảng', sao: 2 })],
  ['Q10', cau('Q10', { kieu: 'tu_luan' })],
  ['Q11', cau('Q11', { phan: 'III', choices: undefined, correct: '2,5', mucDo: 'VD', kienThuc: ['', ' este ', 'amine'] })],
]

function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const [qid, c] of BO) st.run('DH-12-B8', qid, 'v1', `g-${qid}`, 'D1', typeof c === 'string' ? c : JSON.stringify(c))
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-12-B8','Bài 8',11,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-12-B8','v1','x')`)
  return { d, env }
}

/** Bộ bọc D1 đếm tổng ký tự CHUỖI trong mọi dòng trả về (đo phần phải giữ trong bộ nhớ Worker). */
function demKyTu(env: Env) {
  const dem = { kyTu: 0 }
  const goc = env.DB as unknown as { prepare(q: string): { bind(...a: unknown[]): { all(): Promise<{ results: Record<string, unknown>[] }> } } }
  const db = {
    prepare: (q: string) => {
      const st = goc.prepare(q)
      return {
        bind: (...a: unknown[]) => {
          const b = st.bind(...a)
          return { all: async () => { const r = await b.all(); for (const x of r.results ?? []) for (const v of Object.values(x)) if (typeof v === 'string') dem.kyTu += v.length; return r } }
        },
      }
    },
  }
  return { env: { ...env, DB: db } as unknown as Env, dem }
}

/** BẢN CŨ (trước 14/10) của `cauCuaToChiTiet` — JSON đầy đủ — giữ làm phép thử. */
async function cauCuaToCu(env: Env, maDe: readonly string[]) {
  const goc = [...new Set(maDe.map((m) => tachMaTo(m).goc))]
  const r = await env.DB.prepare('SELECT ma_de, qid, json FROM game_v2_question WHERE ma_de IN (SELECT value FROM json_each(?)) ORDER BY rowid').bind(JSON.stringify(goc)).all<Record<string, unknown>>()
  const theoGoc = new Map<string, { qid: string; phan: string; mucDo: string }[]>()
  for (const x of r.results ?? []) {
    let q: Record<string, unknown>
    try { q = JSON.parse(String(x.json)) } catch { continue }
    if (!q.reviewed || laCauTuLuan(q)) continue
    const k = String(x.ma_de)
    theoGoc.set(k, [...(theoGoc.get(k) ?? []), { qid: String(x.qid), phan: String(q.phan ?? ''), mucDo: String(q.mucDo ?? '').trim() }])
  }
  const qids: string[] = [], da = new Set<string>(), theoTo: Record<string, number> = {}, theoMucDo: Record<string, number> = {}, theoPhan: Record<string, number> = {}
  for (const m of maDe) {
    const { goc: g, phan } = tachMaTo(m)
    let n = 0
    for (const c of theoGoc.get(g) ?? []) if ((!phan || c.phan === phan) && !da.has(c.qid)) { da.add(c.qid); qids.push(c.qid); n++; const md = c.mucDo || 'Chưa gắn mức độ'; theoMucDo[md] = (theoMucDo[md] ?? 0) + 1; theoPhan[c.phan] = (theoPhan[c.phan] ?? 0) + 1 }
    theoTo[m] = (theoTo[m] ?? 0) + n
  }
  return { qids, theoTo, theoMucDo, theoPhan } // 01/11: + số câu theo phần (thẻ «Câu sẽ luyện»)
}

describe('câu RÚT GỌN thay JSON đầy đủ (giờ cao điểm 14/10)', () => {
  it('cauCuaToChiTiet: trùng khít bản cũ (cả tờ, tờ tách phần) và phản hồi D1 nhẹ hơn ≥ 20 lần (không ảnh, không lời giải)', async () => {
    const { env } = dung()
    for (const maDe of [['DH-12-B8'], ['DH-12-B8-P1', 'DH-12-B8-P3'], ['DH-12-B8-P2', 'DH-12-B8']]) {
      expect(await cauCuaToChiTiet(env, maDe), maDe.join(',')).toEqual(await cauCuaToCu(env, maDe))
    }
    expect((await cauCuaToChiTiet(env, ['DH-12-B8'])).qids).toEqual(['Q1', 'Q2', 'Q7', 'Q9', 'Q11'])
    const moi = demKyTu(env), cu = demKyTu(env)
    await cauCuaToChiTiet(moi.env, ['DH-12-B8'])
    await cauCuaToCu(cu.env, ['DH-12-B8'])
    expect(moi.dem.kyTu * 20).toBeLessThan(cu.dem.kyTu)
  })

  it('docNoiDungGon: cùng câu, cùng nhóm, cùng cờ tự luận như docNoiDung; không mang ảnh / lời giải', async () => {
    const { env } = dung()
    const qids = BO.map(([q]) => q)
    const [gon, day] = await Promise.all([docNoiDungGon(env, qids), docNoiDung(env, qids)])
    expect([...gon.keys()].sort()).toEqual([...day.keys()].sort())
    for (const [qid, x] of day) {
      const g = gon.get(qid)!
      expect(g.group, qid).toBe(x.group)
      expect(laCauTuLuan(g.q), qid).toBe(laCauTuLuan(x.q))
      expect(JSON.stringify(g.q)).not.toContain('base64')
      expect(JSON.stringify(g.q)).not.toContain('Lời giải rất dài')
      for (const k of ['qid', 'phan', 'mucDo', 'sao', 'lop', 'maDe', 'dang', 'text', 'correct']) expect((g.q as Record<string, unknown>)[k], `${qid}.${k}`).toEqual((x.q as Record<string, unknown>)[k])
    }
  })

  it('Tự luyện: kho câu sai giữ bản gọn; napDayDuCauSai trả lại nội dung đầy đủ cho đúng câu cần phát', async () => {
    const { d, env } = dung()
    d.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')`)
    const ghi = d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,?,?,?,?)`)
    for (const q of ['Q1', 'Q2', 'Q7', 'Q11']) ghi.run(`k-${q}`, 'S1', q, 'game', 'phien-1', 1, 0, '2026-10-10T12:00:00Z', '2026-10-10')
    const kho = await docKhoCauSai(env, 'S1')
    expect(kho.ds.map((c) => c.qid).sort(), kho.loi).toEqual(['Q1', 'Q11', 'Q2', 'Q7'])
    for (const c of kho.ds) expect(JSON.stringify(c.q)).not.toContain('Lời giải rất dài')
    const day = await napDayDuCauSai(env, kho.ds.slice(0, 2))
    expect(day.map((c) => c.qid)).toEqual(kho.ds.slice(0, 2).map((c) => c.qid))
    for (const c of day) expect(JSON.stringify(c.q)).toContain('Lời giải rất dài')
  })

  it('readScope (vòng làm mới nền /mom, academic-sync, bảng tin gọi): pool nhẹ y hệt lamNhe(JSON đầy đủ); 6 lượt cùng lúc ở isolate nguội ⇒ MỘT lượt nạp kho dạng', async () => {
    const { d, env } = dung()
    d.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')`)
    const day = (d.sql.prepare("SELECT json FROM game_v2_question WHERE qid<>'Q6' ORDER BY ma_de||'|'||qid").all() as { json: string }[]).map((x) => lamNhe(JSON.parse(x.json)))
    let napKho = 0
    const goc = env.DB as unknown as { prepare(q: string): unknown }
    const dem = { ...env, DB: { ...env.DB, prepare: (q: string) => { if (q.includes('FROM json_each(?) j JOIN game_v2_question')) napKho++; return goc.prepare(q) }, batch: (env.DB as unknown as { batch: unknown }).batch } } as unknown as Env
    const kq = await Promise.all(Array.from({ length: 6 }, () => readScope(dem, 'S1', ['D1'])))
    expect(napKho).toBe(1)
    for (const r of kq) expect(r.pool.filter((q) => q.qid !== 'Q6')).toEqual(day)
    for (const q of kq[0]!.pool) expect(JSON.stringify(q)).not.toContain('base64')
  })
})
