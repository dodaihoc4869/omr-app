// @vitest-environment node
// 14/10: gỡ Bi-a / Đoàn / cửa hàng / võ đài phía máy chủ — không bỏ ca nào; bỏ import thừa (startDoan2, gameV2, gameToken) và cờ cấu hình `bi_a` trong kho giả.
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// LỖI THẦY CHỤP 21:36 29/09: Bát Linh Đảo "Rương 42/46", còn 4 câu, khung báo "Các câu hôm nay đang dùng cho ca kiểm tra…" trong khi KHÔNG có ca nào mở.
// Mỗi nguyên nhân khả dĩ làm `napLuot` rỗng một test (D1 thật = node:sqlite, lược đồ đủ migration):
//   (b) phiên Bi-a giữ câu — đã gỡ cùng Bi-a 14/10
//   (a) ca đóng mà chưa công bố khoá câu còn lại của kế hoạch ⇒ Đảo rỗng + rương kẹt
//   (c) câu còn lại đã rút khỏi kho ⇒ Đảo rỗng + rương kẹt
// Sau khi sửa: lý do báo ĐÚNG, rương/thể lực không kẹt vì câu bị khoá.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, qidGoc, sanh2 } from '../server/src/srs2-d1'
import { hoa2Action, startDao2 } from '../server/src/srs2-game'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const LOI_CA = 'đang dùng cho ca kiểm tra'

function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: `Cốt lõi ${qid}` },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')

function fixture(soCau = 30) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',${soCau},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, dapAn(i)))
  }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
async function giao(env: Env) {
  const nay = Date.now()
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: new Date(nay + 5 * NGAY).toISOString().slice(0, 10) }, nay - 3 * NGAY)
  expect(r.ok).toBe(true)
}
const suKien = (qid: string, msLuc: number, dung: boolean): SuKien => ({ nguon: 'game', maNguon: `phien-${qid}-${msLuc}`, sbd: 'S1', qid, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(msLuc).toISOString() })
/** Em làm xong (đúng) các câu này hôm nay — trừ vào thể lực như làm trong game. */
async function lamXong(env: Env, qids: string[], nay: number) { if (qids.length) await ghiSuKien(env, qids.map((q) => suKien(q, nay, true))) }
/** Còn đúng `con` câu Đảo: làm xong mọi câu khác của kế hoạch. Trả các câu còn lại. */
async function conLai(env: Env, giu: (ds: string[]) => string[], nay: number): Promise<string[]> {
  const { kh } = await layKeHoachHomNay(env, 'S1', nay)
  expect(kh.conDoan).toEqual([]) // chiến dịch mới: chỉ câu mới ở Đảo
  const ds = kh.conDao.map(qidGoc)
  const de = giu(ds)
  await lamXong(env, ds.filter((q) => !de.includes(q)), nay)
  return de
}
/** Ca (không phải hôm nay mở) chứa đúng các câu `qids`: đóng, KHÔNG công bố ⇒ `protectedQuestions` khoá chúng. */
function caChuaCongBo(d: ReturnType<typeof fixture>['d'], qids: string[], o: { trangThai?: string; congBo?: string } = {}) {
  const bank = { phanI: qids.map((id) => ({ id, text: `Câu ${id}`, choices: ['a', 'b', 'c', 'd'], correct: 'B' })), phanII: [], phanIII: [] }
  d.objects.set('de/CA-CU.json', bank)
  const luc = Date.now() - 2 * 3_600_000
  d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-CU','Ca cũ',?,?,?,45,'thi',?,'de/CA-CU.json',?)`)
    .run(o.trangThai ?? 'dong', new Date(luc).toISOString(), new Date(luc + 20 * 60_000).toISOString(), o.congBo ?? 'khong', new Date(luc).toISOString())
  xoaDemCaBaoVe()
}
const qidsCua = (r: Record<string, unknown>) => ((r.questions as { qid: string }[]) ?? []).map((q) => q.qid)

beforeEach(() => xoaDemCaBaoVe())

describe('Đảo báo nhầm "ca kiểm tra" — nguyên nhân (a): ca đóng chưa công bố', () => {
  it('câu còn lại nằm trong ca đóng chưa công bố ⇒ không lộ câu, không kẹt rương: thể lực trừ câu tạm hoãn, rương mở, lời báo nói đúng ca', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const bon = await conLai(env, (ds) => ds.slice(-4), nay)
    caChuaCongBo(d, bon)
    const dao = await startDao2(env, 'S1', nay)
    expect(qidsCua(dao)).toEqual([]) // KHÔNG lộ câu ca chưa công bố
    expect(dao.het).toBe(true)
    expect(String(dao.message)).toContain('ca kiểm tra')
    expect(dao.tamHoan).toBe(4)
    const s = await sanh2(env, 'S1', nay)
    expect((s.ruong as { moDuoc: boolean }).moDuoc).toBe(true)
    expect(s.theLuc).toMatchObject({ con: 0 })
    const mo = await hoa2Action(env, 'S1', 'hoa2-ruong-mo', {}, nay)
    expect(mo.ok).toBe(true)
    // Ca công bố ⇒ câu quay lại kế hoạch hôm nay
    d.sql.exec("UPDATE ca SET cong_bo='ngay'"); xoaDemCaBaoVe()
    const lai = await startDao2(env, 'S1', nay)
    expect(qidsCua(lai).sort()).toEqual([...bon].sort())
  })

  it('câu ôn Đoàn bị ca khoá hết ⇒ Đảo KHÔNG bị khoá chờ Đoàn mãi', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    await ghiSuKien(env, ['Q1', 'Q2', 'Q3'].map((q) => suKien(q, nay - NGAY, false)))
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const on = kh.conDoan.map(qidGoc)
    expect(on.length).toBeGreaterThan(0)
    caChuaCongBo(d, on)
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).not.toBe('khoa_cho_doan')
    expect(qidsCua(dao).length).toBeGreaterThan(0)
    for (const q of qidsCua(dao)) expect(on).not.toContain(q)
  })

  it('ca ĐANG MỞ chứa câu còn lại ⇒ vẫn khoá (không lộ đề), lời báo đúng là ca kiểm tra', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const bon = await conLai(env, (ds) => ds.slice(-4), nay)
    const bank = { phanI: bon.map((id) => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct: 'B' })), phanII: [], phanIII: [] }
    d.objects.set('de/CA-MO.json', bank)
    d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-MO','Ca mở','mo',?,?,45,'thi','ca_lop_xong','de/CA-MO.json',?)`)
      .run(new Date(nay - 60_000).toISOString(), new Date(nay + 30 * 60_000).toISOString(), new Date(nay).toISOString())
    xoaDemCaBaoVe()
    const dao = await startDao2(env, 'S1', nay)
    expect(qidsCua(dao)).toEqual([])
    expect(String(dao.message)).toContain('ca kiểm tra')
  })
})

describe('Đảo báo nhầm "ca kiểm tra" — nguyên nhân (c): câu rút khỏi kho', () => {
  it('câu còn lại đã rút khỏi kho ⇒ không báo ca, rương không kẹt (30/09: còn câu mới hợp lệ ⇒ THAY câu khác theo quota, làm nốt là rương mở)', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const bon = await conLai(env, (ds) => ds.slice(-4), nay)
    for (const q of bon) d.sql.prepare('DELETE FROM game_v2_question WHERE qid=?').run(q)
    const dao = await startDao2(env, 'S1', nay)
    expect(String(dao.message ?? '')).not.toContain(LOI_CA)
    const thay = qidsCua(dao)
    expect(thay.length).toBeGreaterThan(0)
    for (const q of thay) expect(bon).not.toContain(q)
    const s = await sanh2(env, 'S1', nay)
    expect((s.theLuc as { con: number }).con).toBe(thay.length)
    await lamXong(env, thay, nay)
    const s2 = await sanh2(env, 'S1', nay)
    expect((s2.ruong as { moDuoc: boolean }).moDuoc).toBe(true)
  })
})
