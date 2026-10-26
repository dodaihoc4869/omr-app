// @vitest-environment node
// MÁY SOẠN «lời giải kiểu sơ đồ của thầy» THEO LÔ (làn D, 26/10) — server/src/soan-so-do.ts + soan-so-do-loi-dan.ts.
// Mô hình GIẢ (không gọi mạng), cổng kiểm GIẢ tiêm qua tham số thứ ba; D1 thật SQLite (tests/_d1-that.ts).
// Kiểm: JSON hỏng ⇒ bỏ · lệch ⇒ thử lại 1 lần rồi lưu `lech` · đạt ⇒ lưu · thuKhong không ghi · không bao giờ ghi bảng câu hỏi ·
//       chọn đúng câu tính toán · con trỏ chạy tiếp · bản `dat` không bị hạ · giờ cao điểm · 3 bài mẫu nhân ra đúng đáp số.
//
// `server/src/so-do-cong.ts` do làn C viết song song. Chưa có trong cây ⇒ test chép soan-so-do.ts sang thư mục tạm, đặt cạnh một STUB
// `so-do-cong.ts` cùng chữ ký (Vite không nạp được mô-đun thiếu tệp, vi.mock cũng không chặn được) — KHÔNG tạo tệp trong server/src.
// Có rồi ⇒ nạp thẳng tệp thật. Cổng dùng trong test luôn là cổng giả tiêm vào.
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { taoD1That, type D1That } from './_d1-that'
import { VI_DU_MAU, loiDanSoDo, TU_DUY_THAY } from '../server/src/soan-so-do-loi-dan'
import type { BanSoDo, KetQuaCong } from '../src/lib/goi-y-cham/kieu'

type MoDun = typeof import('../server/src/soan-so-do')
const GOC = path.resolve(__dirname, '../server/src')
let TAM = ''
afterAll(() => { if (TAM) fs.rmSync(TAM, { recursive: true, force: true }) })

async function napMoDun(): Promise<MoDun> {
  if (fs.existsSync(path.join(GOC, 'so-do-cong.ts'))) return await import('../server/src/soan-so-do')
  TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'soan-so-do-'))
  fs.writeFileSync(path.join(TAM, 'so-do-cong.ts'),
    "export function kiemCong(_ban: unknown, _ctx: { phan: string; dapAn: string; luaChon: readonly string[] }): { ket: 'dat' | 'lech' | 'khong_kiem_duoc' | 'lo_dap_an'; lyDo?: string; giaTri?: number } { return { ket: 'khong_kiem_duoc', lyDo: 'stub' } }\n")
  const chu = fs.readFileSync(path.join(GOC, 'soan-so-do.ts'), 'utf8')
    .replace(/from '(\.\.?\/[^']+)'/g, (m, p: string) => (p === './so-do-cong' ? m : `from '${path.join(GOC, p)}'`))
  fs.writeFileSync(path.join(TAM, 'soan-so-do.ts'), chu)
  return (await import(/* @vite-ignore */ path.join(TAM, 'soan-so-do.ts'))) as MoDun
}
const M = await napMoDun()

// ---------------------------------------------------------------- dữ liệu mẫu

const DE = 'DE-THU-2610'
const Q = { III: `${DE}-III-1`, I: `${DE}-I-2`, LT: `${DE}-I-3`, KLM: `${DE}-I-4`, II: `${DE}-II-1`, III2: `${DE}-III-5` }
const CAU: Record<string, Record<string, unknown>> = {
  [Q.III]: { phan: 'III', text: VI_DU_MAU[0]!.de, choices: [], ideas: [], correct: '76,8', solution: { buoc: ['n FeS2 = 10^6.0,08/120', 'm SO2 = 76,8 kg'] }, reviewed: true },
  [Q.I]: { phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là', choices: ['8,2.', '10,2.', '12,2.', '14,2.'], ideas: [], correct: 'B', solution: 'Rắn = 8,2 + 2 = 10,2', reviewed: true },
  [Q.LT]: { phan: 'I', text: 'Phát biểu nào sau đây không đúng?', choices: ['Nitrogen chiếm khoảng 78% thể tích không khí.', 'b', 'c', 'Nitrogen tan rất tốt trong nước.'], ideas: [], correct: 'D', solution: '', reviewed: true },
  [Q.KLM]: { phan: 'I', text: 'Cho kim loại M tác dụng với dung dịch HCl dư. Giá trị của m là', choices: ['1', '2', '3', '4'], ideas: [], correct: 'A', solution: '', reviewed: true },
  [Q.II]: { phan: 'II', text: 'Cho 8,8 gam ethyl acetate…', choices: [], ideas: ['a', 'b', 'c', 'd'], correct: 'DSDS', solution: '', reviewed: true },
  [Q.III2]: { phan: 'III', text: VI_DU_MAU[1]!.de, choices: [], ideas: [], correct: '1,25', solution: '', reviewed: true },
}
const JSON_MAU: Record<string, string> = { [Q.III]: JSON.stringify(VI_DU_MAU[0]!.ban), [Q.III2]: JSON.stringify(VI_DU_MAU[1]!.ban),
  [Q.I]: JSON.stringify({ deNoiGi: 'Ester bị NaOH thuỷ phân; cô cạn còn muối và NaOH dư.', buoc: [{ ten: 'm_ran', thuaSo: [{ so: '(8,2 + 2)', nghia: 'muối + NaOH dư' }], ketQua: '10,2' }], ketQua: '10,2' }) }

let d: D1That
let sqlChay: string[]
function dungKho(dd: D1That) {
  dd.sql.prepare("INSERT INTO de_kho (ma_de, ten_de, lop, so_cau, da_xoa, cap_nhat_luc) VALUES (?, 'Đề thử', '12', 6, 0, 'v1')").run(DE)
  dd.sql.prepare("INSERT INTO game_v2_index (ma_de, source_version, indexed_at) VALUES (?, 'v1', 'x')").run(DE)
  for (const [qid, c] of Object.entries(CAU)) {
    dd.sql.prepare("INSERT INTO game_v2_question (ma_de, qid, version, content_group, dang, json) VALUES (?, ?, ?, ?, 'X', ?)")
      .run(DE, qid, `ver-${qid}`, `nhom-${qid}`, JSON.stringify({ qid, maDe: DE, ...c }))
  }
}
beforeEach(() => {
  d = taoD1That()
  dungKho(d)
  sqlChay = []
  const db = d.env.DB as unknown as { prepare(q: string): unknown }
  const goc = db.prepare.bind(db)
  db.prepare = (q: string) => { sqlChay.push(q); return goc(q) }
})

/** 10:00 giờ VN 26/10 — ngoài giờ cao điểm. */
const LUC = Date.parse('2026-10-26T03:00:00Z')
const dongHo = (buoc = 0) => { let t = LUC; return () => (t += buoc) }
type Hoi = { heThong: string; luot: readonly { vai: string; chu: string }[]; model: string }
function moHinhGia(tra: (h: Hoi, lan: number) => string) {
  const goi: Hoi[] = []
  const fn = vi.fn(async (h: Hoi) => {
    goi.push(h)
    const cau = Object.keys(CAU).find((q) => h.luot[0]!.chu.includes(String(CAU[q]!.text).slice(0, 40))) ?? ''
    const lan = goi.filter((x) => x.luot[0]!.chu === h.luot[0]!.chu).length
    return { ok: true as const, chu: tra({ ...h, model: cau }, lan), model: 'gia', vao: 100, ra: 50 }
  })
  return { fn, goi }
}
const congGia = (ket: (ban: BanSoDo, lan: number) => KetQuaCong) => {
  const dem = new Map<string, number>()
  return vi.fn((ban: BanSoDo) => { const n = (dem.get(ban.qid) ?? 0) + 1; dem.set(ban.qid, n); const k = ket(ban, n); return k === 'lech' ? { ket: k, lyDo: 'tích ra 70 khác 76,8', giaTri: 70 } : { ket: k } })
}
const goiLo = async (thamSo: unknown, phu: Parameters<MoDun['soanSoDoLo']>[2]) => {
  const r = await M.soanSoDoLo(d.env, thamSo, { bayGio: dongHo(), ...phu })
  return { status: r.status, j: (await r.json()) as Record<string, unknown> & { dem: Record<string, number>; ketQua: { qid: string; ket: string; lanThu: number }[] } }
}
const coBang = () => !!d.sql.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'loi_giai_so_do'").get()
const dongSoDo = (qid: string) => d.sql.prepare('SELECT * FROM loi_giai_so_do WHERE qid = ?').get(qid) as Record<string, unknown> | undefined
const chuMau = (h: Hoi) => JSON_MAU[h.model] ?? '{}'

// ---------------------------------------------------------------- test

describe('chọn câu tính toán', () => {
  const cau = (qid: string) => ({ qid, maDe: DE, version: 'v', ...(CAU[qid] as object) }) as Parameters<MoDun['laCauTinhToan']>[0]
  it('Phần III có số + đơn vị, đáp án số ⇒ chọn; Phần I phương án đúng có số ⇒ chọn', () => {
    expect(M.laCauTinhToan(cau(Q.III))).toBe(true)
    expect(M.laCauTinhToan(cau(Q.I))).toBe(true)
  })
  it('lý thuyết, «kim loại M»/«Giá trị của m», Phần II ⇒ bỏ', () => {
    expect(M.laCauTinhToan(cau(Q.LT))).toBe(false) // có «78%» nhưng phương án đúng D không có số
    expect(M.laCauTinhToan(cau(Q.KLM))).toBe(false)
    expect(M.laCauTinhToan(cau(Q.II))).toBe(false)
  })
})

describe('soạn lô', () => {
  it('đạt ⇒ lưu bản (qid/phienBan do máy chủ gắn, version câu), một lượt gọi', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const cong = congGia(() => 'dat')
    const { status, j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: cong })
    expect(status).toBe(200)
    expect(j.dem.dat).toBe(1)
    expect(mh.fn).toHaveBeenCalledTimes(1)
    expect(cong).toHaveBeenCalledWith(expect.objectContaining({ qid: Q.III }), { phan: 'III', dapAn: '76,8', luaChon: [] })
    const r = dongSoDo(Q.III)!
    expect(r).toMatchObject({ cong: 'dat', version: `ver-${Q.III}`, ma_de: DE, so_lan: 1 })
    const ban = JSON.parse(String(r.ban_json)) as BanSoDo
    expect(ban.qid).toBe(Q.III)
    expect(ban.phienBan).toBeGreaterThanOrEqual(1)
    expect(ban.soDo?.muiTen[0]?.H).toBe(90)
    expect(j.xong).toBe(true)
  })

  it('lời dặn gửi mô hình có tư duy thầy + luật sơ đồ + cấm lộ; tin người dùng có đề, đáp án kho', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III], thuKhong: true }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    const h = mh.goi[0]!
    expect(h.heThong).toContain('Tạm thời bỏ tư duy tiền nhà') // thầy 26/10: lời dặn cấm ẩn dụ tiền / nhà / thuế
    expect(h.heThong).toContain('KHÔNG dùng ẩn dụ')
    expect(h.heThong).toContain('CẤM LỘ ĐÁP ÁN')
    expect(h.luot[0]!.chu).toContain('Đáp án kho: 76,8')
  })

  it('JSON hỏng ⇒ bỏ: không ghi, không gọi cổng', async () => {
    const mh = moHinhGia(() => 'đây không phải JSON {')
    const cong = congGia(() => 'dat')
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: cong })
    expect(j.dem.hong).toBe(1)
    expect(cong).not.toHaveBeenCalled()
    expect(coBang() ? dongSoDo(Q.III) : undefined).toBeUndefined()
  })

  it('JSON sai khuôn (thiếu buoc) ⇒ bỏ', async () => {
    const mh = moHinhGia(() => JSON.stringify({ deNoiGi: 'x', buoc: [] }))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    expect(j.dem.hong).toBe(1)
  })

  it('lệch ⇒ thử lại đúng 1 lần kèm lý do, vẫn lệch ⇒ lưu `lech` (không hiện)', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const cong = congGia(() => 'lech')
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: cong })
    expect(mh.fn).toHaveBeenCalledTimes(2)
    expect(cong).toHaveBeenCalledTimes(2)
    const thuLai = mh.goi[1]!.luot
    expect(thuLai.map((l) => l.vai)).toEqual(['user', 'model', 'user'])
    expect(thuLai[2]!.chu).toContain('tích ra 70 khác 76,8')
    expect(j.dem.lech).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'lech', so_lan: 2, ly_do: 'tích ra 70 khác 76,8', gia_tri: '70' })
  })

  it('lệch rồi thử lại đạt ⇒ lưu `dat`', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia((_b, n) => (n === 1 ? 'lech' : 'dat')) })
    expect(j.dem.dat).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat', so_lan: 2 })
  })

  it('lộ đáp án ⇒ lưu `lo_dap_an`, không thử lại', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lo_dap_an') })
    expect(mh.fn).toHaveBeenCalledTimes(1)
    expect(j.dem.lo_dap_an).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'lo_dap_an' })
  })

  it('thuKhong ⇒ không ghi gì (không tạo bảng), trả bản soạn để xem', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ qids: [Q.III, Q.I], thuKhong: true }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    expect(j.dem.dat).toBe(2)
    expect(coBang() ? dongSoDo(Q.III) : undefined).toBeUndefined() // bảng có thể đã có sẵn từ migration; thuKhong không được ghi dòng nào
    expect(sqlChay.some((s) => /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP)\b/i.test(s))).toBe(false)
    expect((j.ban as { qid: string }[]).map((b) => b.qid).sort()).toEqual([Q.III, Q.I].sort())
  })

  it('không bao giờ ghi bảng câu hỏi (game_v2_question / de_kho / chỉ mục)', async () => {
    const truoc = [d.chup('game_v2_question'), d.chup('de_kho'), d.chup('game_v2_index')]
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ gioiHan: 50 }, { goiMoHinh: mh.fn, kiemCong: congGia((_b, n) => (n === 1 ? 'lech' : 'dat')) })
    await goiLo({ gioiHan: 50, lamLai: true }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lech') })
    const ghi = sqlChay.filter((s) => /\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP)\b/i.test(s))
    expect(ghi.length).toBeGreaterThan(0)
    for (const s of ghi) expect(s).not.toMatch(/game_v2_question|de_kho|game_v2_index|\bq\.json\b/)
    expect([d.chup('game_v2_question'), d.chup('de_kho'), d.chup('game_v2_index')]).toEqual(truoc)
  })

  it('quét kho: chỉ soạn câu tính toán (III, I có số), bỏ lý thuyết / kim loại M / Phần II', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ gioiHan: 50 }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    expect(j.ketQua.map((x) => x.qid).sort()).toEqual([Q.I, Q.III, Q.III2].sort())
    expect(j.xong).toBe(true)
  })

  it('bản `dat` không bị lượt sau hạ xuống `lech`; câu đã soạn bỏ qua khi không lamLai', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    const lai = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lech') })
    expect(lai.j.dem.bo_qua).toBe(1)
    expect(mh.fn).toHaveBeenCalledTimes(1)
    await goiLo({ qids: [Q.III], lamLai: true }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lech') })
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat' })
  })

  const gieoDong = (qid: string, ket: string, phienBan: number, ban: string) => {
    d.sql.exec(`CREATE TABLE IF NOT EXISTS loi_giai_so_do (qid TEXT PRIMARY KEY, ma_de TEXT NOT NULL, version TEXT NOT NULL, phien_ban INTEGER NOT NULL,
      ban_json TEXT NOT NULL, cong TEXT NOT NULL, ly_do TEXT, gia_tri TEXT, so_lan INTEGER NOT NULL DEFAULT 1, model TEXT,
      token_vao INTEGER NOT NULL DEFAULT 0, token_ra INTEGER NOT NULL DEFAULT 0, tao_luc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL)`)
    d.sql.prepare("INSERT INTO loi_giai_so_do (qid, ma_de, version, phien_ban, ban_json, cong, tao_luc, cap_nhat_luc) VALUES (?, ?, ?, ?, ?, ?, 'cu', 'cu')")
      .run(qid, DE, `ver-${qid}`, phienBan, ban, ket)
  }

  it('bản lời dặn mới ⇒ soạn lại câu `dat` cũ; lượt mới `lech` KHÔNG hạ bản `dat` (giữ nguyên bản cũ)', async () => {
    gieoDong(Q.III, 'dat', 0, '{"cu":1}')
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lech') })
    expect(mh.fn).toHaveBeenCalledTimes(2) // đã soạn lại (không bị bỏ qua)
    expect(j.dem.lech).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat', ban_json: '{"cu":1}', phien_ban: 0, cap_nhat_luc: 'cu' })
  })

  it('bản lời dặn mới ⇒ câu `lech` cũ soạn lại đạt thì được thay', async () => {
    gieoDong(Q.III, 'lech', 0, '{"cu":1}')
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    const r = dongSoDo(Q.III)!
    expect(r).toMatchObject({ cong: 'dat', tao_luc: 'cu' })
    expect(JSON.parse(String(r.ban_json)).qid).toBe(Q.III)
    expect(Number(r.phien_ban)).toBeGreaterThanOrEqual(1)
  })

  it('đổi đề (version khác) ⇒ bản `dat` cũ của version cũ được thay kể cả khi lượt mới lệch', async () => {
    gieoDong(Q.III, 'dat', 99, '{"cu":1}')
    d.sql.prepare('UPDATE loi_giai_so_do SET version = ? WHERE qid = ?').run('ver-cu', Q.III)
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lech') })
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'lech', version: `ver-${Q.III}` })
  })

  it('con trỏ: lượt 1 soạn 1 câu, lượt 2 tiếp từ con trỏ, không trùng', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const cong = congGia(() => 'dat')
    const l1 = await goiLo({ gioiHan: 1 }, { goiMoHinh: mh.fn, kiemCong: cong })
    expect(l1.j.daXuLy).toBe(1)
    expect(l1.j.xong).toBe(false)
    expect(String(l1.j.conTro)).toContain('|')
    const l2 = await goiLo({ gioiHan: 1, conTro: l1.j.conTro }, { goiMoHinh: mh.fn, kiemCong: cong })
    const l3 = await goiLo({ gioiHan: 1, conTro: l2.j.conTro }, { goiMoHinh: mh.fn, kiemCong: cong })
    const da = [...l1.j.ketQua, ...l2.j.ketQua, ...l3.j.ketQua].map((x) => x.qid)
    expect(new Set(da).size).toBe(3)
    const l4 = await goiLo({ gioiHan: 1, conTro: l3.j.conTro }, { goiMoHinh: mh.fn, kiemCong: cong })
    expect(l4.j.daXuLy).toBe(0)
    expect(l4.j.xong).toBe(true)
  })

  it('hết ngân sách giờ giữa lô ⇒ dừng, trả con trỏ danh sách', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const r = await M.soanSoDoLo(d.env, { qids: [Q.III, Q.I, Q.III2], songSong: 1, nganSachGiay: 5 }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat'), bayGio: dongHo(2000) })
    const j = (await r.json()) as { xong: boolean; conTro: string; daXuLy: number }
    expect(j.xong).toBe(false)
    expect(j.daXuLy).toBeLessThan(3)
    expect(j.conTro).toMatch(/^#\d+$/)
  })

  it('giờ cao điểm 19–24h VN ⇒ từ chối (409) trừ khi cho phép; thiếu khoá ⇒ 503', async () => {
    const cao = Date.parse('2026-10-26T13:30:00Z') // 20:30 VN
    const r = await M.soanSoDoLo(d.env, { qids: [Q.III] }, { goiMoHinh: moHinhGia(chuMau).fn, kiemCong: congGia(() => 'dat'), bayGio: () => cao })
    expect(r.status).toBe(409)
    const r2 = await M.soanSoDoLo(d.env, { qids: [Q.III], thuKhong: true, choChayGioCaoDiem: true }, { goiMoHinh: moHinhGia(chuMau).fn, kiemCong: congGia(() => 'dat'), bayGio: () => cao })
    expect(r2.status).toBe(200)
    const r3 = await M.soanSoDoLo({ ...d.env, GEMINI_API_KEY: '' } as typeof d.env, { qids: [Q.III] }, { bayGio: () => LUC })
    expect(r3.status).toBe(503)
  })

  it('tham số hỏng ⇒ 400', async () => {
    expect((await M.soanSoDoLo(d.env, { qids: 'abc' }, { bayGio: () => LUC })).status).toBe(400)
    expect((await M.soanSoDoLo(d.env, { qids: ["x'; DROP TABLE"] }, { bayGio: () => LUC })).status).toBe(400)
  })
})

describe('lời dặn và 3 bài mẫu', () => {
  /** Máy tính nhỏ cho thừa số: «10^6», «8/100», «24,79», «(0,15 − 0,1)», tên kết quả bước trước. */
  const giaTri = (so: string, ten: Map<string, number>): number => {
    if (ten.has(so)) return ten.get(so)!
    const s = so.replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '').replace(/10\^(-?\d+)/g, (_m, e: string) => `(1e${e})`)
    if (!/^[\d.()+\-*/e]+$/.test(s)) throw new Error(`thừa số lạ: ${so}`)
    return Number(new Function(`return (${s})`)())
  }
  it.each(VI_DU_MAU.map((v, i) => [i + 1, v] as const))('bài mẫu %i: tích thừa số bước cuối = đáp án kho', (_i, v) => {
    const ten = new Map<string, number>()
    let cuoi = NaN
    for (const b of v.ban.buoc) {
      cuoi = b.thuaSo.reduce((p, t) => p * giaTri(t.so, ten), 1)
      ten.set(b.ten, cuoi)
    }
    const dapAn = Number(v.dapAn.replace(',', '.'))
    expect(Math.abs(cuoi - dapAn) / dapAn).toBeLessThan(0.005)
    expect(v.ban.ketQua).toBe(v.dapAn)
  })
  it('bài mẫu không lộ đáp số ở phần hiện trước khi nộp', () => {
    for (const v of VI_DU_MAU) {
      const { buoc, ketQua: _k, ...truoc } = v.ban
      const chu = JSON.stringify({ ...truoc, buoc: buoc.map(({ ketQua: _kq, ...b }) => b) })
      expect(chu).not.toContain(v.dapAn)
    }
  })
  it('lời dặn nhúng nguyên văn tư duy thầy, sơ đồ không ghi hệ số / «bảo toàn» trong bài mẫu', () => {
    expect(loiDanSoDo()).toContain(TU_DUY_THAY)
    const goc = fs.readFileSync(path.resolve(__dirname, '../docs/tu-duy-day-hoa-thay-2610.md'), 'utf8').trim()
    expect(TU_DUY_THAY.trim()).toBe(goc)
    for (const v of VI_DU_MAU) expect(JSON.stringify(v.ban.soDo)).not.toMatch(/bảo toàn/i)
  })
})
