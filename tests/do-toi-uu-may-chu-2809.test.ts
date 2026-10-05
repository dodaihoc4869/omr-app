// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// ĐO trước/sau tối ưu máy chủ 28/09 (việc 4): số VÒNG D1 và số ĐỢT NỐI TIẾP (≈ độ trễ; mỗi đợt ≈ 300–400 ms trên D1 thật).
// Tệp này chạy được trên CẢ origin/main (trước) lẫn nhánh tối ưu (sau): chỉ dùng hàm có ở cả hai; in dòng `DO|tên|vòng|đợt|...` để ghi bảng
// docs/toi-uu-2809/MAY-CHU.md. Ngưỡng `expect` là của bản SAU (trên origin/main chúng đỏ — đó là bằng chứng trước/sau).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { taoD1That } from './_d1-that'
import { demVongD1 } from './_dem-vong-d1'
import worker from '../server/src/index'
import { gvChienDich } from '../server/src/srs2-gv'
import { docHoSo2, layKeHoachHomNay, sanh2 } from '../server/src/srs2-d1'
import { napCau } from '../server/src/srs2-game'
import { protectedQuestions, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import type { Env } from '../server/src/kieu'

export const T0 = Date.parse('2026-09-30T02:00:00Z')
const cau = (qid: string, phan: 'I' | 'II') => JSON.stringify({
  qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : 'DSDS', reviewed: true, solution: { chot: 'c' },
})
export async function dungSanh() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 24; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`, i % 4 === 0 ? 'II' : 'I'))
  const t = await gvChienDich(env, { action: 'tao', ten: 'Test', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, T0) as { id: string }
  return { d, env, id: t.id }
}
export function dungCa(soCa = 3, soEm = 30) {
  const d = taoD1That()
  const ca = d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,45,'thi','khong',?,?)")
  const lu = d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES(?,?,?,1,'x',?,'x','Em')")
  for (let c = 1; c <= soCa; c++) {
    ca.run(`CA${c}`, `Ca ${c}`, 'mo', new Date(T0 - 60_000).toISOString(), new Date(T0 + 3_600_000).toISOString(), `key/CA${c}.json`, `v${c}`)
    for (let e = 1; e <= soEm; e++) lu.run(`CA${c}|E${e}|1`, `CA${c}`, `E${e}`, e % 3 ? 'da_nop' : 'dang_lam')
  }
  // ca ĐÃ XOÁ nhiều lượt: trước tối ưu vẫn bị quét/gom trong /ca/danh-sach
  ca.run('CAX', 'Ca xoá', 'da_xoa', 'x', 'x', null, 'x')
  for (let e = 1; e <= 200; e++) lu.run(`CAX|E${e}|1`, 'CAX', `E${e}`, 'da_nop')
  return d
}
const bank = (c: number) => ({ phanI: Array.from({ length: 4 }, (_, i) => ({ id: `DE${c}-I-${i + 1}`, text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] })) })
const in1 = (ten: string, d: { vong: number; dot: number }, them = '') => console.log(`DO|${ten}|${d.vong}|${d.dot}|${them}`)

afterEach(() => { vi.useRealTimers() })

describe('ĐO vòng D1 (in ra để so trước/sau)', () => {
  it('/ca/danh-sach', async () => {
    const d = dungCa()
    const { env, d: dem } = demVongD1(d.env as unknown as Env)
    const r = await worker.fetch(new Request('https://x.dev/ca/danh-sach', { method: 'POST', body: JSON.stringify({ secret: 'bi-mat-thu' }) }), env as any)
    const j = await r.json() as { ok: boolean; items: { maCa: string; daVao: number; daNop: number }[] }
    expect(j.ok).toBe(true)
    expect(j.items.find((x) => x.maCa === 'CA1')).toMatchObject({ daVao: 30, daNop: 20 })
    in1('ca-danh-sach', dem, dem.sql.filter((s) => /FROM luot/.test(s)).length + ' lượt có câu luot; ' + dem.sql.filter((s) => /^batch/.test(s)).length + ' batch')
    expect(dem.sql.filter((s) => /MAX\(lan_thu\)/.test(s)).length).toBe(1)
    expect(dem.sql.find((s) => /MAX\(lan_thu\)/.test(s))).toContain("ma_ca IN (SELECT ma_ca FROM ca WHERE trang_thai <> 'da_xoa'")
    expect(j.items.find((x) => x.maCa === 'CAX')).toBeUndefined()
  })
  it('Sảnh hoa2 (mở lần 2 trong ngày: kế hoạch đã chốt)', async () => {
    const { env: e0 } = await dungSanh()
    await sanh2(e0, 'S1', T0 + 1000)
    const { env, d } = demVongD1(e0)
    const s = await sanh2(env, 'S1', T0 + 2000) as { ok: boolean; theLuc: { tong: number } }
    expect(s.ok).toBe(true)
    expect(s.theLuc.tong).toBeGreaterThan(0)
    in1('sanh2', d)
    expect(d.dot).toBeLessThanOrEqual(3)
  })
  it('napCau 6 câu (Đảo)', async () => {
    const { env: e0 } = await dungSanh()
    const { kh } = await layKeHoachHomNay(e0, 'S1', T0 + 1000)
    const hs = await docHoSo2(e0, 'S1', '2026-09-30')
    const khoa = [...kh.dao, ...kh.doan, ...hs.cau.map((c) => c.qid)]
    const { env, d } = demVongD1(e0)
    const ra = await napCau(env, hs, khoa, 6, new Set())
    expect(ra.length).toBe(6)
    in1('napCau-6', d)
    expect(d.vong).toBe(1)
    // câu vừa rút khỏi kho ⇒ bỏ qua như cũ, vẫn đủ 6 câu theo đúng thứ tự
    const q0 = ra[0]!.q.qid
    const bo = await napCau({ ...e0, DB: { ...e0.DB, prepare: (s: string) => e0.DB.prepare(s.replace('JOIN game_v2_question q ON', `JOIN game_v2_question q ON q.qid <> '${q0}' AND`)) } } as any, hs, khoa, 6, new Set())
    expect(bo.map((x) => x.q.qid)).toEqual(ra.slice(1).map((x) => x.q.qid).concat(bo.slice(5).map((x) => x.q.qid)))
    expect(bo.length).toBe(6)
  })
  it('protectedQuestions: 3 ca đang thi, vân tay đổi (em vào/nộp) ⇒ số lần đọc đề R2', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0)
    const dd = dungCa(3, 5)
    let docR2 = 0
    for (let c = 1; c <= 3; c++) await dd.env.DE.put(`key/CA${c}.json`, JSON.stringify(bank(c)))
    const getGoc = dd.env.DE.get.bind(dd.env.DE)
    const env = { ...dd.env, DE: { ...dd.env.DE, get: (k: string) => { docR2++; return getGoc(k) } } } as unknown as Env
    const a = await protectedQuestions(env)
    for (let lan = 1; lan <= 5; lan++) {
      dd.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES(?,?,?,1,'x','dang_lam','x','Em')").run(`CA1|N${lan}|1`, 'CA1', `N${lan}`)
      vi.setSystemTime(T0 + lan * 6_000) // qua đệm 5 s
      const b = await protectedQuestions(env)
      expect([...b].sort()).toEqual([...a].sort())
    }
    expect(a.size).toBeGreaterThan(0)
    in1('protectedQuestions-R2', { vong: docR2, dot: docR2 }, 'lần đọc R2 qua 6 lượt')
    expect(docR2).toBe(3) // mỗi đề đọc MỘT lần; vân tay đổi vì lượt sống không đọc lại
    // thầy đẩy lại đề (cap_nhat_luc mới) ⇒ đọc lại đúng đề đó
    dd.sql.prepare("UPDATE ca SET cap_nhat_luc = 'v9' WHERE ma_ca = 'CA2'").run()
    vi.setSystemTime(T0 + 60_000)
    await protectedQuestions(env)
    expect(docR2).toBe(4)
    xoaDemCaBaoVe()
  })
  it('/gv/chien-dich danh-sach thongKe (gọi lần 2 trong 60 s)', async () => {
    const { env: e0 } = await dungSanh()
    for (let i = 0; i < 4; i++) await gvChienDich(e0, { action: 'tao', ten: `CD${i}`, sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, T0)
    await gvChienDich(e0, { action: 'danh-sach', thongKe: true }, T0 + 1000)
    const { env, d } = demVongD1(e0)
    const r = await gvChienDich(env, { action: 'danh-sach', thongKe: true }, T0 + 2000) as { ok: boolean; chienDich: { thongKe: unknown }[] }
    expect(r.ok).toBe(true)
    expect(r.chienDich[0]!.thongKe).toBeTruthy()
    in1('chien-dich-thongKe-5cd', d)
    expect(d.vong).toBeLessThanOrEqual(3)
    // chiến dịch đổi (đóng) ⇒ khoá đổi ⇒ tính lại, không đọc bản cũ
    const id0 = (r.chienDich[0] as unknown as { id: string }).id
    await gvChienDich(e0, { action: 'dong', id: id0 }, T0 + 3000)
    const truoc = d.vong
    await gvChienDich(env, { action: 'danh-sach', thongKe: true }, T0 + 4000)
    expect(d.vong - truoc).toBeGreaterThan(3)
  })
})
