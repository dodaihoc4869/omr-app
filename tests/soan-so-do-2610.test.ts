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

  // TỰ SỬA (thầy 26/10: «Tự động sửa mọi câu lệch, tôi ko phải làm gì»): lệch ⇒ thử lại tới 4 lượt, mỗi lượt kèm lý do; từ lượt 3 model mạnh.
  it('lệch ⇒ thử lại tới 4 lượt kèm lý do (lượt 3–4 model mạnh), vẫn lệch ⇒ lưu `lech` (không hiện)', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const cong = congGia(() => 'lech')
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: cong })
    expect(mh.fn).toHaveBeenCalledTimes(6) // 4 lượt tự sửa + 2 lần giải MÙ (không đáp án kho)
    expect(cong).toHaveBeenCalledTimes(6)
    const thuLai = mh.goi[1]!.luot
    expect(thuLai.map((l) => l.vai)).toEqual(['user', 'model', 'user'])
    expect(thuLai[2]!.chu).toContain('tích ra 70 khác 76,8')
    expect(mh.goi.map((g) => g.model)).toEqual([M.MODEL_MAC_DINH, M.MODEL_MAC_DINH, M.MODEL_MANH, M.MODEL_MANH, M.MODEL_MAC_DINH, M.MODEL_MANH])
    // 2 lần giải MÙ: đề không kèm đáp án kho
    expect(mh.goi[4]!.luot).toHaveLength(1)
    expect(mh.goi[4]!.luot[0]!.chu).not.toContain('Đáp án kho')
    expect(j.dem.lech).toBe(1)
    // cả 2 lần mù cùng ra 70 (khác kho 76,8) ⇒ nghi đáp án kho sai
    expect(j.dem.nghi_dap_an).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'lech', ly_do: 'tích ra 70 khác 76,8', gia_tri: '70', nghi_dap_an: 1, dap_an_may: '70' })
  })

  it('lệch hai lượt, model mạnh ở lượt 3 đạt ⇒ lưu `dat`', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia((_b, n) => (n < 3 ? 'lech' : 'dat')) })
    expect(mh.fn).toHaveBeenCalledTimes(3)
    expect(j.dem.dat).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat', so_lan: 3 })
  })

  it('lệch rồi thử lại đạt ⇒ lưu `dat`', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia((_b, n) => (n === 1 ? 'lech' : 'dat')) })
    expect(j.dem.dat).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat', so_lan: 2 })
  })

  it('lộ đáp án ⇒ thử lại kèm lời dặn bỏ phần lộ; sửa được ⇒ `dat`, không sửa được ⇒ lưu `lo_dap_an` (không hiện)', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lo_dap_an') })
    expect(mh.fn).toHaveBeenCalledTimes(4)
    expect(mh.goi[1]!.luot[2]!.chu).toContain('LỘ ĐÁP ÁN')
    expect(j.dem.lo_dap_an).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'lo_dap_an' })
    const mh2 = moHinhGia((h) => chuMau(h))
    const { j: j2 } = await goiLo({ qids: [Q.III], lamLai: true }, { goiMoHinh: mh2.fn, kiemCong: congGia((_b, n) => (n === 1 ? 'lo_dap_an' : 'dat')) })
    expect(j2.dem.dat).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat' })
  })

  it('vòng sửa `chiSuaLoi` chỉ lấy câu đang lệch / lộ trong bảng và soạn lại (không cần thầy chỉ qid)', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'lech') })
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'lech' })
    const mh2 = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ chiSuaLoi: true }, { goiMoHinh: mh2.fn, kiemCong: congGia(() => 'dat') })
    expect(mh2.fn).toHaveBeenCalledTimes(1)
    expect(j.dem.dat).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat' })
  })

  it('27/10: câu tính trả THIẾU sơ đồ / bước ⇒ thử lại kèm lời dặn bắt soạn phép tính; vẫn thiếu ⇒ lưu, vòng sửa lấy lại', async () => {
    const thieu = { ket: 'khong_kiem_duoc' as const, lyDo: 'Câu tính thiếu sơ đồ hoặc bước tính.' }
    const mh = moHinhGia((h) => chuMau(h))
    let n = 0
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: vi.fn(() => (++n === 1 ? thieu : { ket: 'dat' as const })) })
    expect(mh.fn).toHaveBeenCalledTimes(2)
    expect(mh.goi[1]!.luot[2]!.chu).toContain('BÀI TÍNH TOÁN')
    expect(j.dem.dat).toBe(1)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat', so_lan: 2 })
    // thiếu mãi ⇒ 4 lượt, lưu `khong_kiem_duoc` kèm đúng lý do ⇒ vòng sửa `chiSuaLoi` soạn lại câu ấy
    const mh2 = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III2] }, { goiMoHinh: mh2.fn, kiemCong: vi.fn(() => thieu) })
    expect(mh2.fn).toHaveBeenCalledTimes(4)
    expect(dongSoDo(Q.III2)).toMatchObject({ cong: 'khong_kiem_duoc', ly_do: thieu.lyDo })
    const mh3 = moHinhGia((h) => chuMau(h))
    const { j: j3 } = await goiLo({ chiSuaLoi: true }, { goiMoHinh: mh3.fn, kiemCong: vi.fn(() => ({ ket: 'dat' as const })) })
    expect(mh3.fn).toHaveBeenCalledTimes(1)
    expect(j3.dem.dat).toBe(1)
    expect(dongSoDo(Q.III2)).toMatchObject({ cong: 'dat' })
  })

  it('27/10: bản thiếu sơ đồ xếp dưới `lech` (lệch còn được giải mù), «không kiểm được» lý do khác vẫn dừng ngay', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    let n = 0
    await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: vi.fn(() => (++n === 1 ? { ket: 'khong_kiem_duoc' as const, lyDo: 'Câu tính thiếu sơ đồ hoặc bước tính.' } : { ket: 'lech' as const, lyDo: 'tích ra 70', giaTri: 70 })) })
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'lech' })
    const mh2 = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III2] }, { goiMoHinh: mh2.fn, kiemCong: vi.fn(() => ({ ket: 'khong_kiem_duoc' as const, lyDo: 'Phần II chưa kiểm số (v1).' })) })
    expect(mh2.fn).toHaveBeenCalledTimes(1)
  })

  it('27/10: nhãn hạn mức Gemini chỉ lấy mã hạn mức + giây chờ', () => {
    const j = { error: { message: 'x', details: [{ '@type': 'QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaMetric: 'm' }] }, { '@type': 'RetryInfo', retryDelay: '12.5s' }] } }
    expect(M.nhanHanMuc(j)).toBe(' [quota=GenerateRequestsPerDayPerProjectPerModel-FreeTier; retry=12s]')
    expect(M.nhanHanMuc({ error: { message: 'x' } })).toBe('')
    expect(M.nhanHanMuc(null)).toBe('')
  })

  it('27/10: câu lỗi gọi (Gemini 429) KHÔNG bị con trỏ bỏ qua — lượt sau soạn lại đúng câu ấy', async () => {
    let loi = true
    const fn = vi.fn(async (h: Hoi) => {
      const laIII = h.luot[0]!.chu.includes(String(CAU[Q.III]!.text).slice(0, 40))
      if (loi && laIII) return { ok: false as const, loi: 'HTTP 429 quota', http: 429 }
      const cau = Object.keys(CAU).find((q) => h.luot[0]!.chu.includes(String(CAU[q]!.text).slice(0, 40))) ?? ''
      return { ok: true as const, chu: JSON_MAU[cau] ?? '{}', model: 'gia', vao: 1, ra: 1 }
    })
    const { j } = await goiLo({}, { goiMoHinh: fn, kiemCong: congGia(() => 'dat') })
    expect(j.dem.loi_goi).toBe(1)
    expect(j.xong).toBe(false)
    expect(dongSoDo(Q.III)).toBeUndefined()
    loi = false
    const { j: j2 } = await goiLo({ conTro: j.conTro }, { goiMoHinh: fn, kiemCong: congGia(() => 'dat') })
    expect(j2.ketQua.map((k) => k.qid)).toContain(Q.III)
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat' })
  })

  it('27/10: lỗi cố định của riêng câu (rỗng SAFETY) KHÔNG ghim con trỏ — bước qua như cũ', async () => {
    const fn = vi.fn(async (h: Hoi) => {
      if (h.luot[0]!.chu.includes(String(CAU[Q.III]!.text).slice(0, 40))) return { ok: false as const, loi: 'rỗng finishReason=SAFETY' }
      const cau = Object.keys(CAU).find((q) => h.luot[0]!.chu.includes(String(CAU[q]!.text).slice(0, 40))) ?? ''
      return { ok: true as const, chu: JSON_MAU[cau] ?? '{}', model: 'gia', vao: 1, ra: 1 }
    })
    const { j } = await goiLo({}, { goiMoHinh: fn, kiemCong: congGia(() => 'dat') })
    expect(j.dem.loi_goi).toBe(1)
    expect(j.xong).toBe(true)
    expect(dongSoDo(Q.III2)).toMatchObject({ cong: 'dat' })
  })

  it('27/10: model nhanh 429 ⇒ thử MODEL_MANH một lần (ngoài danh sách model của Hỏi thầy)', async () => {
    const { DS_MODEL_DU_PHONG, MAC_DINH_HOI_THEM } = await import('../server/src/hoi-tro-ly')
    expect([MAC_DINH_HOI_THEM.model, ...DS_MODEL_DU_PHONG]).not.toContain(M.MODEL_MANH)
    const goc = globalThis.fetch
    const goi: string[] = []
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const u = String(url); goi.push(u)
      if (u.includes(encodeURIComponent(M.MODEL_MAC_DINH))) return new Response(JSON.stringify({ error: { message: 'quota' } }), { status: 429 })
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }], usageMetadata: {} }), { status: 200 })
    }) as typeof fetch
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    try {
      const p = M.taoGoiGeminiLo({ GEMINI_API_KEY: 'k' } as never)({ heThong: 'h', luot: [{ vai: 'user', chu: 'x' }], model: M.MODEL_MAC_DINH })
      await vi.runAllTimersAsync()
      const kq = await p
      expect(kq).toMatchObject({ ok: true, model: M.MODEL_MANH })
      expect(goi.filter((u) => u.includes(encodeURIComponent(M.MODEL_MANH)))).toHaveLength(1)
    } finally { globalThis.fetch = goc; vi.useRealTimers() }
  })

  it('27/10 Workers AI: chỉ lấy chữ trả lời cuối (không lấy suy luận), nhiều dạng kết quả', () => {
    expect(M.chuTuWorkersAi({ output: [{ type: 'reasoning', content: [{ type: 'reasoning_text', text: 'NGHĨ' }] }, { type: 'message', content: [{ type: 'output_text', text: '{"a":1}' }] }] })).toBe('{"a":1}')
    expect(M.chuTuWorkersAi({ output_text: ' x ' })).toBe('x')
    expect(M.chuTuWorkersAi({ response: 'y' })).toBe('y')
    expect(M.chuTuWorkersAi({ choices: [{ message: { content: 'z', reasoning_content: 'NGHĨ' } }] })).toBe('z')
    expect(M.chuTuWorkersAi({ output: [{ type: 'reasoning', content: [{ type: 'reasoning_text', text: 'NGHĨ' }] }] })).toBe('')
  })
  it('27/10 Workers AI: lỗi hạn mức / quá tải ném ra ⇒ HTTP 429 (giữ con trỏ); lỗi khác ⇒ lỗi thường', async () => {
    const nem = (m: string) => ({ run: vi.fn(async () => { throw new Error(m) }) })
    for (const m of ['3036: Account limited', 'Capacity temporarily exceeded', '4006: you have used up your daily free allocation of 10,000 neurons', 'Too many requests'])
      expect(await M.goiWorkersAi(nem(m), { heThong: 'h', luot: [] })).toMatchObject({ ok: false, http: 429 })
    const k = await M.goiWorkersAi(nem('5007: No such model'), { heThong: 'h', luot: [] })
    expect(k.ok).toBe(false)
    expect((k as { http?: number }).http).toBeUndefined()
    const ok = await M.goiWorkersAi({ run: vi.fn(async () => ({ output_text: '{"a":1}', usage: { input_tokens: 5, output_tokens: 7 } })) }, { heThong: 'h', luot: [{ vai: 'model', chu: 'a' }] })
    expect(ok).toMatchObject({ ok: true, chu: '{"a":1}', model: M.MODEL_CF, vao: 5, ra: 7 })
  })
  it('27/10: Gemini 429 cả model mạnh ⇒ Workers AI; các câu sau cùng lượt đi thẳng Workers AI', async () => {
    const goc = globalThis.fetch
    let soGemini = 0
    globalThis.fetch = vi.fn(async () => { soGemini++; return new Response(JSON.stringify({ error: { message: 'quota' } }), { status: 429 }) }) as typeof fetch
    const ai = { run: vi.fn(async (_m: string, _i: unknown) => ({ output_text: '{"a":1}' })) }
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    try {
      const goi = M.taoGoiGeminiLo({ GEMINI_API_KEY: 'k', AI: ai } as never)
      const p1 = goi({ heThong: 'h', luot: [{ vai: 'user', chu: 'x' }], model: M.MODEL_MAC_DINH })
      await vi.runAllTimersAsync()
      expect(await p1).toMatchObject({ ok: true, model: M.MODEL_CF })
      const truoc = soGemini
      expect(await goi({ heThong: 'h', luot: [{ vai: 'user', chu: 'y' }], model: M.MODEL_MAC_DINH })).toMatchObject({ ok: true, model: M.MODEL_CF })
      expect(soGemini).toBe(truoc)
      expect(ai.run).toHaveBeenCalledTimes(2)
      expect(ai.run.mock.calls[0]![1]).toMatchObject({ instructions: 'h', input: [{ role: 'user', content: 'x' }] })
    } finally { globalThis.fetch = goc; vi.useRealTimers() }
  })

  it('27/10: vòng sửa lấy lại câu «thừa số … không đọc được» (cổng đã đọc thêm cách viết mới); lý do khác thì không', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III, Q.III2] }, { goiMoHinh: mh.fn, kiemCong: vi.fn((ban: BanSoDo) => ({ ket: 'khong_kiem_duoc' as const,
      lyDo: ban.qid === Q.III ? 'Bước 1: thừa số «10 000» không đọc được.' : 'Phần II chưa kiểm số (v1).' })) })
    const mh2 = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ chiSuaLoi: true }, { goiMoHinh: mh2.fn, kiemCong: congGia(() => 'dat') })
    expect(j.ketQua.map((k) => k.qid)).toEqual([Q.III])
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat' })
    expect(dongSoDo(Q.III2)).toMatchObject({ cong: 'khong_kiem_duoc' })
  })

  it('26/10 bỏ tư duy tiền nhà: bản đạt số mà còn ẩn dụ ⇒ bắt viết lại; «nhà máy» không tính', async () => {
    const ban = (chu: string) => ({ ...(VI_DU_MAU[0]!.ban as object), deNoiGi: chu }) as BanSoDo
    expect(M.coAnDuTienNha(ban('Số mol là tiền, nhà A giàu hơn nhà B'))).toBe(true)
    expect(M.coAnDuTienNha(ban('Bị đánh thuế 10%'))).toBe(true)
    expect(M.coAnDuTienNha(ban('Nhà máy sản xuất H₂SO₄ từ quặng pirit'))).toBe(false)
    expect(M.coAnDuTienNha(VI_DU_MAU[0]!.ban as BanSoDo)).toBe(false)
    const mh = moHinhGia((h, lan) => lan === 1 ? JSON.stringify({ ...JSON.parse(chuMau(h)), deNoiGi: 'Số mol là tiền của nhà FeS₂' }) : chuMau(h))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    expect(mh.fn).toHaveBeenCalledTimes(2)
    expect(mh.goi[1]!.luot[2]!.chu).toContain('BỎ ẩn dụ')
    expect(j.dem.dat).toBe(1)
    expect(String(JSON.parse(String(dongSoDo(Q.III)!.ban_json)).deNoiGi)).not.toMatch(/tiền/)
  })

  it('27/10 trình bày: thiếu «?» / H không đứng riêng / thiếu nghĩa ⇒ bắt soạn lại; bản mẫu đạt', async () => {
    const mau = VI_DU_MAU[0]!.ban as BanSoDo
    expect(M.loiTrinhBay(mau)).toBeNull()
    const khongHoi = { ...mau, soDo: { ...mau.soDo!, nut: mau.soDo!.nut.map((n) => ({ ...n, soLieu: n.soLieu.filter((x) => !x.includes('?')), tong: n.tong?.replace('?', '') })) } }
    expect(M.loiTrinhBay(khongHoi)).toMatch(/đề hỏi/)
    const khongH = { ...mau, buoc: mau.buoc.map((b) => ({ ...b, thuaSo: b.thuaSo.filter((t) => !/\/100$|^100\//.test(t.so)) })) }
    expect(M.loiTrinhBay(khongH)).toMatch(/hiệu suất/)
    const thieuNghia = { ...mau, buoc: mau.buoc.map((b) => ({ ...b, thuaSo: b.thuaSo.map((t, i) => (i ? t : { ...t, nghia: '' })) })) }
    expect(M.loiTrinhBay(thieuNghia)).toMatch(/thiếu nghĩa/)
    const mh = moHinhGia((h, lan) => (lan === 1 ? JSON.stringify(khongHoi) : chuMau(h)))
    const { j } = await goiLo({ qids: [Q.III] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    expect(mh.fn).toHaveBeenCalledTimes(2)
    expect(mh.goi[1]!.luot[2]!.chu).toContain('TRÌNH BÀY')
    expect(j.dem.dat).toBe(1)
  })
  it('27/10: dòng đạt đánh dấu «trinh_bay_lai» ⇒ vòng sửa soạn lại; bản mới đạt thay, bản mới lệch KHÔNG hạ bản đạt cũ', async () => {
    const mh = moHinhGia((h) => chuMau(h))
    await goiLo({ qids: [Q.III, Q.III2] }, { goiMoHinh: mh.fn, kiemCong: congGia(() => 'dat') })
    d.sql.prepare("UPDATE loi_giai_so_do SET ly_do = 'trinh_bay_lai'").run()
    const mh2 = moHinhGia((h) => chuMau(h))
    const { j } = await goiLo({ chiSuaLoi: true }, { goiMoHinh: mh2.fn, kiemCong: vi.fn((ban: BanSoDo) => (ban.qid === Q.III ? { ket: 'dat' as const } : { ket: 'lech' as const, lyDo: 'x', giaTri: 1 })) })
    expect(j.ketQua.map((k) => k.qid).sort()).toEqual([Q.III, Q.III2].sort())
    expect(dongSoDo(Q.III)).toMatchObject({ cong: 'dat', ly_do: null })
    expect(dongSoDo(Q.III2)).toMatchObject({ cong: 'dat', ly_do: 'trinh_bay_lai' })
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
    expect(mh.fn).toHaveBeenCalledTimes(6) // đã soạn lại (không bị bỏ qua); lệch ⇒ 4 lượt tự sửa + 2 lần giải mù
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
